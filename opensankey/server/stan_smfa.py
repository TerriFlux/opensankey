"""
==================================================================================================
The MIT License (MIT)
==================================================================================================
Copyright (c) 2026 TerriFlux

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
==================================================================================================
Author        : Julien Alapetite for TerriFlux
==================================================================================================

Importeur de fichiers STAN (TU Wien, subSTance flow ANalysis) vers le format
OpenSankey.

Deux formats de document STAN sont supportés, détectés par magic number :
- .smfa (STAN 2.6+) : base SQLite ;
- .zmfa (format d'échange le plus répandu) : document XML <MfaSystemData>
  (namespace http://inkasoft.net/MfaSystemData.xsd) compressé en gzip. Les
  éléments de premier niveau du XML reproduisent les tables SQLite (mêmes noms
  de champs), ce qui permet un pipeline de construction commun.

Ce module lit ces fichiers et produit une structure JSON (version 0.9)
consommée par le fromJSON du front, en réutilisant les helpers et le calcul
de positions du module neutre sankey_layout.py.

Périmètre v1 : nœuds (processus), flux et valeurs. Les incertitudes, couches
substance/énergie multiples, stocks et coefficients de transfert ne sont pas
encore rendus (valeurs = MFInput normalisée, repli sur MFCalc si mesure absente).

Modèle de données STAN (tables SQLite = éléments XML) :
- Process(ProcessID, ProcessType, Name) : ProcessType 1 = frontière de système
  (« Systemgrenze »/P0), 2 = processus réel.
- ProcessInput/ProcessOutput(…ID, ProcessID) : ports de connexion d'un processus.
- Flow(FlowID, ProcessInputID, ProcessOutputID, Name) : un flux va du processus
  portant ProcessOutputID (source) vers celui portant ProcessInputID (cible).
  Un port à NULL (SQLite) ou absent (XML) = franchissement de frontière
  (import si source absente, export si cible absente).
- FlowValue(FlowID, PeriodID, FlowLayerID, MFInput, MFCalc, MFNumUnitID, …) :
  valeurs par période et couche. MFInput = valeur saisie, MFCalc = réconciliée.
- Unit(UnitID, UnitCode, Factor) : Factor = facteur vers l'unité SI (kg=1, t=1000).
"""

# coding: utf-8

import base64
import binascii
import gzip
import sqlite3
import struct
import xml.etree.ElementTree as ET

try:
    from . import sankey_layout
    from . import nrbf
except Exception:
    try:
        import sankey_layout
        import nrbf
    except Exception:
        pass


# Tables/éléments consommés par le pipeline de construction.
# `Diagram` et `Shape` portent la mise en page dessinée par l'utilisateur.
_TABLES = (
    "Process", "ProcessInput", "ProcessOutput", "Flow",
    "FlowValue", "Unit", "Period", "FlowLayer",
    "Diagram", "Shape", "DefaultUnit", "Stock",
)

# Un fichier STAN multi-périodes devient un groupe de tags de DONNÉES : une période
# = un tag, et chaque flux (comme chaque stock) porte une valeur par tag. C'est la
# façon dont OpenSankey exprime « la même topologie, plusieurs jeux de valeurs ».
_PERIOD_TAGG_ID = "period"

# Un pixel par unité STAN donnerait un diagramme minuscule : dans Example.smfa les
# processus mesurent 20x20 unités et sont espacés de 60 x 45. Ce facteur amène une
# boîte de processus à ~100 px, l'ordre de grandeur d'un nœud OpenSankey.
_PX_PER_STAN_UNIT = 5.0

# Taille minimale d'un nœud d'import/export. Sa hauteur suit l'épaisseur de son flux,
# mais l'ellipse doit rester assez grande pour contenir la lettre « I » ou « E ».
_EXTERNAL_NODE_MIN_PX = 26.0

# Marge entre le bord d'un flux vertical et son nom, écrit à sa droite comme STAN.
_VERTICAL_NAME_PAD_PX = 5.0

# Rôles de ShapeType, déduits de la géométrie et des jointures d'Example.smfa
# (STAN ne documente pas cette énumération).
# STAN calibre ses cadres de texte sur SA police ; nous rendons le texte avec la nôtre,
# plus large. Sans marge, le texte déborde. Facteurs empiriques, ajustés sur
# Example.smfa : la hauteur souffre plus que la largeur (interligne différent).
_TEXT_ZONE_PADDING_W = 1.30
_TEXT_ZONE_PADDING_H = 1.45

_SHAPE_PROCESS = 1
_SHAPE_FLOW_LINK = 2
_SHAPE_EXTERNAL_MARKER = 5
_SHAPE_FREE_TEXT = 7
_SHAPE_SYSTEM_BOUNDARY = 8

# ProcessType de la frontière du système. STAN la modélise comme un processus (les
# flux entrants/sortants s'y raccordent) mais la dessine comme un cadre en pointillés,
# lequel ne porte pas de ProcessID : on les rapproche par élimination.
_PROCESS_TYPE_BOUNDARY = 1

# Champs numériques du XML (tout y est texte, contrairement à SQLite) :
# les identifiants se terminent par "ID", les valeurs/facteurs sont des réels.
# SV… = niveau de stock, DT… = sa variation sur la période.
_FLOAT_FIELDS = {"MFInput", "MFCalc", "Factor", "SVInput", "SVCalc", "DTInput", "DTCalc"}


# --- Lecteur SQLite (.smfa) ---------------------------------------------------

def _fetch_all(cur, table):
    """Renvoie (colonnes, lignes) d'une table, tolérant à son absence."""
    try:
        rows = cur.execute('SELECT * FROM "%s"' % table).fetchall()
    except sqlite3.Error:
        return [], []
    cols = [d[0] for d in cur.description]
    return cols, rows


def _rows_as_dicts(cur, table):
    cols, rows = _fetch_all(cur, table)
    return [dict(zip(cols, r)) for r in rows]


def _read_tables_sqlite(path):
    """Lit un .smfa (SQLite) et renvoie {table: [lignes dict]}.

    Une table absente rend une liste vide plutôt que de lever : les tables de mise
    en page (Diagram, Shape) manquent des fichiers minimaux, et leur absence ne doit
    priver que de la géométrie.
    """
    con = sqlite3.connect(path)
    try:
        cur = con.cursor()
        tables = {}
        for t in _TABLES:
            try:
                tables[t] = _rows_as_dicts(cur, t)
            except sqlite3.DatabaseError:
                tables[t] = []
        return tables
    finally:
        con.close()


# --- Lecteur XML gzippé (.zmfa) -----------------------------------------------

def _coerce_xml_value(tag, text):
    """Aligne les types du XML (tout texte) sur ceux de SQLite."""
    if text is None:
        return None
    text = text.strip()
    if text == "":
        return None
    if tag.endswith("ID"):
        try:
            return int(text)
        except ValueError:
            return text
    if tag in _FLOAT_FIELDS:
        try:
            return float(text)
        except ValueError:
            return text
    return text


def _read_tables_zmfa(path):
    """Lit un .zmfa (XML <MfaSystemData> gzippé) et renvoie {table: [lignes dict]}."""
    with gzip.open(path, "rb") as fh:
        root = ET.parse(fh).getroot()
    ns = root.tag.split("}")[0] + "}" if root.tag.startswith("{") else ""
    tables = {t: [] for t in _TABLES}
    for elem in root:
        tag = elem.tag[len(ns):] if ns else elem.tag
        if tag not in tables:
            continue
        row = {}
        for child in elem:
            ctag = child.tag[len(ns):] if ns else child.tag
            row[ctag] = _coerce_xml_value(ctag, child.text)
        tables[tag].append(row)
    return tables


# --- Dispatch sur le contenu (les extensions mentent parfois) -------------------

def _read_tables(path):
    """Détecte le format STAN par magic number et lit les tables."""
    with open(path, "rb") as fh:
        magic = fh.read(16)
    if magic[:2] == b"\x1f\x8b":
        return _read_tables_zmfa(path)
    if magic.startswith(b"SQLite format 3"):
        return _read_tables_sqlite(path)
    raise ValueError("Format STAN non reconnu (ni SQLite .smfa, ni gzip .zmfa)")


def list_periods_and_layers(path):
    """Périodes et couches disponibles, pour laisser le choix à l'appelant."""
    tables = _read_tables(path)
    periods = [
        {"id": r["PeriodID"], "code": r.get("PeriodCode")}
        for r in tables["Period"]
    ]
    layers = [
        {"id": r["FlowLayerID"], "name": r.get("Name") or r.get("MaterialCode")}
        for r in tables["FlowLayer"]
    ]
    return {"periods": periods, "layers": layers}


def _polyline(link_obj, objects):
    """Points du tracé d'un NLineLink, en unités STAN."""
    points = nrbf.resolve(link_obj.members.get("m_Points"), objects)
    if not isinstance(points, nrbf.ClassRef):
        return []
    array = nrbf.resolve(points.members.get("m_ModelPoints"), objects)
    if not isinstance(array, nrbf.ClassRef):
        return []
    size = nrbf.resolve(array.members.get("ArrayList+_size"), objects) or 0
    items = nrbf.resolve(array.members.get("ArrayList+_items"), objects) or []
    out = []
    for item in items[:size]:
        item = nrbf.resolve(item, objects)
        if isinstance(item, nrbf.ClassRef) and "x" in item.members:
            out.append((nrbf.resolve(item.members["x"], objects),
                        nrbf.resolve(item.members["y"], objects)))
    return out


def _orientation_from_polyline(points):
    """Traduit un tracé STAN SANS DÉTOUR en `shape_orientation` OpenSankey.

    STAN route ses flux à angle droit (le `HVLink` de sa bibliothèque de dessin).
    Un tracé dont tous les points partagent leur ordonnée est horizontal, tous leur
    abscisse est vertical ; sinon c'est une équerre, dont le nom dépend du premier
    segment. Renvoie None si le tracé est inexploitable, pour laisser le défaut.

    Ne convient qu'aux tracés d'au plus UN coude : les détours (escaliers,
    boucles) passent par le régime routé de `_route_from_polyline`.
    """
    if len(points) < 2:
        return None
    # Les coordonnées de STAN sont des flottants 32 bits : sur un tracé pourtant
    # rigoureusement horizontal, les ordonnées diffèrent au septième chiffre. Un
    # epsilon de 1e-6 y voyait des équerres partout. Un millième d'unité STAN est
    # de toute façon sous le seuil du visible.
    eps = 1e-3
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    flat = max(ys) - min(ys) < eps
    upright = max(xs) - min(xs) < eps
    if flat:
        return "hh"
    if upright:
        return "vv"
    # Équerre : le premier segment non dégénéré donne le sens de départ.
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if abs(x1 - x0) > eps:
            return "hv"
        if abs(y1 - y0) > eps:
            return "vh"
    return None


def _simplify_polyline(points, eps=1e-3):
    """Ôte d'un tracé STAN les points dupliqués et les sommets colinéaires.

    Les tracés STAN traînent des points intermédiaires sans coude (« Racoyet -
    WB 3-1 » : 4 points rigoureusement alignés) : les garder fabriquerait des
    waypoints inutiles. Un sommet où le tracé REBROUSSE (produit scalaire
    négatif) n'est pas colinéaire : c'est un vrai détour, on le garde.
    """
    if not points:
        return []
    out = [points[0]]
    for p in points[1:]:
        if abs(p[0] - out[-1][0]) < eps and abs(p[1] - out[-1][1]) < eps:
            continue
        out.append(p)
    i = 1
    while i < len(out) - 1:
        (ax, ay), (bx, by), (cx, cy) = out[i - 1], out[i], out[i + 1]
        ux, uy = bx - ax, by - ay
        vx, vy = cx - bx, cy - by
        norm = ((ux * ux + uy * uy) ** 0.5) * ((vx * vx + vy * vy) ** 0.5)
        cross = ux * vy - uy * vx
        dot = ux * vx + uy * vy
        if norm > 0 and abs(cross) / norm < eps and dot > 0:
            del out[i]
        else:
            i += 1
    return out


def _segment_axes(points, eps=1e-3):
    """Axe de chaque segment du tracé : 'h', 'v', ou 'd' (diagonale libre)."""
    axes = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        if dx < eps and dy < eps:
            continue
        axes.append("h" if dy < eps else ("v" if dx < eps else "d"))
    return axes


def _dominant_axis(p0, p1):
    """Axe dominant d'un segment quelconque (diagonale comprise)."""
    return "h" if abs(p1[0] - p0[0]) >= abs(p1[1] - p0[1]) else "v"


def _route_from_polyline(points):
    """Classe un tracé STAN : régime du lien OpenSankey et données associées.

    Miroir de `hasOrthogonalTurn` de l'import e!Sankey (esankeyParser.ts) : un
    tracé est ROUTÉ dès qu'il fait un DÉTOUR — au moins DEUX coudes orthogonaux
    (h↔v) — et ses points intérieurs deviennent des `shape_waypoints`. UN coude
    ou moins reste paramétrique (hh/vv/hv/vh, comportement historique). Cas à
    part : STAN sait tracer une droite LIBRE (diagonale, 2 points) ; l'écraser
    en équerre `hv`, comme avant, dessinait un coude là où STAN dessine une
    droite — on la rend par un flux droit aux segments d'attache quasi nuls.

    Renvoie `{"kind": "routed", "waypoints": [...]}` (points en unités STAN),
    `{"kind": "diagonal"|"parametric", "orientation": ...}`, ou None si le
    tracé est inexploitable (le style garde alors son défaut).
    """
    pts = _simplify_polyline(points)
    if len(pts) < 2:
        return None
    axes = _segment_axes(pts)
    if not axes:
        return None
    turns = sum(1 for a, b in zip(axes, axes[1:]) if {a, b} == {"h", "v"})
    if turns >= 2:
        return {"kind": "routed", "waypoints": [(p[0], p[1]) for p in pts[1:-1]]}
    if axes == ["d"]:
        return {"kind": "diagonal",
                "orientation": _dominant_axis(pts[0], pts[-1]) * 2}
    if "d" in axes:
        # Tracé mixte sans détour (ex. h-d-h) : le rendu droit paramétrique —
        # bout, diagonale, bout — est déjà sa silhouette. L'axe d'accroche à
        # chaque extrémité est celui de son premier/dernier segment.
        first = axes[0] if axes[0] != "d" else _dominant_axis(pts[0], pts[1])
        last = axes[-1] if axes[-1] != "d" else _dominant_axis(pts[-2], pts[-1])
        return {"kind": "parametric", "orientation": first + last}
    orientation = _orientation_from_polyline(pts)
    return {"kind": "parametric", "orientation": orientation} if orientation else None


def _connector_to_leaf_process(rows, id_field, sub_field):
    """Associe chaque connecteur (entrée ou sortie de processus) au processus RÉEL.

    STAN modélise un flux de frontière en deux temps : il entre dans le système
    (connecteur porté par le processus « frontière »), puis descend au processus
    concerné via `SubProcessInputID` / `SubProcessOutputID`. Ignorer cette chaîne
    raccroche tous les flux de frontière à un unique nœud « Systemgrenze » — d'où
    des bandes cumulant tous les imports, et une échelle absurde.

    On suit donc la chaîne jusqu'à sa feuille, et c'est le processus de la feuille
    qui compte. Le compteur de sécurité protège d'un fichier cyclique.
    """
    by_id = {r[id_field]: r for r in rows}
    leaves = {}
    for connector_id in by_id:
        current = by_id[connector_id]
        for _ in range(len(by_id) + 1):
            nxt = current.get(sub_field)
            if nxt is None or nxt not in by_id:
                break
            current = by_id[nxt]
        leaves[connector_id] = current["ProcessID"]
    return leaves


def _period_tag_id(period):
    """Identifiant du tag d'une période : son code STAN (« 2006 »), ou son id à défaut."""
    return str(period.get("PeriodCode") or period["PeriodID"])


def _period_tag_group(periods):
    """Groupe de tags de données décrivant les périodes du fichier."""
    return {
        _PERIOD_TAGG_ID: {
            "name": "Période",
            "tags": {
                _period_tag_id(p): {"name": _period_tag_id(p), "selected": i == 0}
                for i, p in enumerate(periods)
            },
            "tags_order": [_period_tag_id(p) for p in periods],
        }
    }


def _stock_values(tables, node_id_of_process, periods, layer_id, display_factor, units):
    """Stocks des processus, par période : `{node_id: json de stock_values}`.

    STAN distingue le NIVEAU de stock (`SV…`) de sa VARIATION sur la période (`DT…`) —
    ce que sa légende appelle « Stocks [t] » et « Σ Stock ». OpenSankey a exactement ces
    deux champs : `initial_stock` et `stock_variation`.
    """
    def scaled(row, prefix, unit_field):
        raw = row.get(prefix + "Input")
        if raw is None:
            raw = row.get(prefix + "Calc")
        try:
            # Ceinture et bretelles : un champ non listé dans _FLOAT_FIELDS arriverait
            # du XML sous forme de chaîne, et se multiplierait comme une séquence.
            raw = float(raw)
        except (TypeError, ValueError):
            return None
        unit = units.get(row.get(unit_field))
        factor = unit["Factor"] if unit and unit.get("Factor") else 1.0
        return round(raw * float(factor) / display_factor, 6)

    period_ids = [p["PeriodID"] for p in periods]
    multi = len(periods) > 1
    per_node = {}
    for row in tables.get("Stock") or []:
        if row.get("PeriodID") not in period_ids:
            continue
        if layer_id is not None and row.get("FlowLayerID") != layer_id:
            continue
        node_id = node_id_of_process.get(row.get("ProcessID"))
        if node_id is None:
            continue
        leaf = {}
        level = scaled(row, "SV", "SVUnitID")
        delta = scaled(row, "DT", "DTNumUnitID")
        if level is not None:
            leaf["initial_stock"] = level
        if delta is not None:
            leaf["stock_variation"] = delta
        if not leaf:
            continue
        if multi:
            period = next(p for p in periods if p["PeriodID"] == row["PeriodID"])
            tree = per_node.setdefault(node_id, {"datatag_group": _PERIOD_TAGG_ID})
            tree[_period_tag_id(period)] = leaf
        else:
            per_node[node_id] = leaf
    return per_node


def _display_unit(tables, units, flow_values, layer_id):
    """Unité dans laquelle STAN affiche les flux : `(facteur_vers_SI, code)`.

    C'est celle de la table `DefaultUnit` pour la couche courante. Elle peut différer
    de l'unité de saisie de chaque flux (`MFNumUnitID`), qui varie d'un flux à l'autre.
    `DefaultUnit` contient aussi les unités de concentration : on ne retient que celles
    de la même famille SI que les flux eux-mêmes.
    """
    families = set()
    for fv in flow_values:
        unit = units.get(fv.get("MFNumUnitID"))
        if unit:
            families.add(unit.get("SiUnitID"))

    candidates = []
    for row in tables.get("DefaultUnit") or []:
        row_layer = row.get("FlowLayerID")
        if layer_id is not None and row_layer not in (None, -1, layer_id):
            continue
        unit = units.get(row.get("NumUnitID"))
        if unit and (not families or unit.get("SiUnitID") in families):
            candidates.append(unit)

    if not candidates:
        return 1.0, None
    unit = candidates[0]
    return (unit.get("Factor") or 1.0), unit.get("UnitCode")


def _flow_colors(tables):
    """Couleur choisie par l'utilisateur pour chaque flux, indexée par FlowID.

    Elle n'est ni dans une colonne SQL, ni dans le graphe de dessin (où tous les
    liens sont noirs) : elle est dans `Flow.Properties`, un SECOND blob .NET
    sérialisé, distinct de `Diagram.Document` et bien plus petit — un unique objet
    `Mfa.Common.ExtendedFlowProperties` dont `foreColor` est un ARGB signé.
    """
    colors = {}
    for row in tables.get("Flow") or []:
        blob = row.get("Properties")
        if isinstance(blob, str):
            try:
                blob = base64.b64decode(blob)
            except (ValueError, binascii.Error):
                continue
        if not isinstance(blob, (bytes, bytearray)):
            continue
        try:
            streams = nrbf.read_streams(bytes(blob))
        except (nrbf.NrbfError, struct.error, IndexError, KeyError):
            continue
        for objects in streams:
            for obj in objects.values():
                if not isinstance(obj, nrbf.ClassRef):
                    continue
                argb = nrbf.resolve(obj.members.get("foreColor"), objects)
                if isinstance(argb, int):
                    colors[row["FlowID"]] = "#%02x%02x%02x" % (
                        (argb >> 16) & 0xFF, (argb >> 8) & 0xFF, argb & 0xFF)
    return colors


def _as_int(value):
    """Entier, ou None. Les champs du XML sont des chaînes là où SQLite donne des int."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _document_bytes(tables):
    """Le blob `Diagram.Document`, quel que soit le format d'origine.

    En SQLite c'est un BLOB ; en XML (.zmfa), le MÊME blob encodé en base64. Rien
    d'autre ne distingue les deux formats de ce point de vue.
    """
    rows = tables.get("Diagram") or []
    if not rows:
        return None
    document = rows[0].get("Document")
    if isinstance(document, (bytes, bytearray)):
        return bytes(document)
    if isinstance(document, str) and document.strip():
        try:
            return base64.b64decode(document)
        except (ValueError, binascii.Error):
            return None
    return None


def read_geometry(tables):
    """Lit la mise en page dessinée par l'utilisateur dans un fichier STAN.

    STAN est un éditeur graphique : les positions des boîtes et le tracé des flux
    sont dans le fichier. Ils y sont enfermés dans `Diagram.Document`, un graphe
    d'objets .NET sérialisé par sa bibliothèque de dessin (cf. nrbf.py), et non
    dans une table SQL — raison pour laquelle l'import les a longtemps ignorés et
    recalculé une mise en page à leur place.

    Renvoie un dict `{"processes", "polylines", "boundary", "texts", "markers"}` en
    unités STAN, ou `None` si le fichier n'expose pas de géométrie (document absent,
    version de bibliothèque non reconnue). L'appelant retombe alors sur le placement
    calculé : une mise en page illisible ne doit jamais faire échouer l'import.

    `polylines` porte le tracé COMPLET de chaque flux : c'est `_route_from_polyline`
    qui décide ensuite du régime (paramétrique, droite libre, ou routé par waypoints).
    """
    document = _document_bytes(tables)
    if document is None:
        return None
    try:
        index = nrbf.index_by_uid(nrbf.read_streams(document))
    except (nrbf.NrbfError, struct.error, IndexError, KeyError):
        return None

    processes, polylines, texts, markers, boundary = {}, {}, [], {}, None
    for shape in tables.get("Shape") or []:
        entry = index.get(str(shape.get("ShapeGuid") or "").lower())
        if entry is None:
            continue
        shape_type = _as_int(shape.get("ShapeType"))
        if shape_type is None:
            continue
        process_id, flow_id = shape.get("ProcessID"), shape.get("FlowID")
        if shape_type == _SHAPE_PROCESS and process_id is not None and entry["bounds"]:
            processes[process_id] = entry["bounds"]
        elif shape_type == _SHAPE_SYSTEM_BOUNDARY and entry["bounds"]:
            boundary = entry["bounds"]
            texts.append({"text": entry["text"] or "", "bounds": entry["bounds"], "frame": True})
        elif shape_type == _SHAPE_FREE_TEXT and entry["bounds"]:
            texts.append({"text": entry["text"] or "", "bounds": entry["bounds"], "frame": False})
        elif shape_type == _SHAPE_EXTERNAL_MARKER and flow_id is not None and entry["bounds"]:
            # Le petit « I » ou « E » que STAN dessine au bout de chaque flux de
            # frontière : un par flux, comme les imports/exports scindés d'OpenSankey.
            # Son texte est son nom, et sa forme une ellipse.
            markers[flow_id] = {"bounds": entry["bounds"], "text": (entry["text"] or "").strip()}
        elif shape_type == _SHAPE_FLOW_LINK and flow_id is not None:
            points = _polyline(entry["object"], entry["objects"])
            if len(points) >= 2:
                polylines[flow_id] = points

    if not processes:
        return None
    return {"processes": processes, "polylines": polylines,
            "boundary": boundary, "texts": texts, "markers": markers}


def parse_stan(path, period_id=None, layer_id=None):
    """
    Lit un fichier STAN (.smfa SQLite ou .zmfa XML gzippé) et renvoie une
    structure OpenSankey.

    Parameters
    ----------
    path : str
        chemin du fichier .smfa ou .zmfa
    period_id : int | None
        période à importer (défaut : première période)
    layer_id : int | None
        couche à importer (défaut : première couche)

    Returns
    -------
    dict compatible fromJSON (version 0.9)
    """
    tables = _read_tables(path)

    # --- Référentiels -------------------------------------------------
    processes = {r["ProcessID"]: r for r in tables["Process"]}
    pin_to_proc = _connector_to_leaf_process(
        tables["ProcessInput"], "ProcessInputID", "SubProcessInputID")
    pout_to_proc = _connector_to_leaf_process(
        tables["ProcessOutput"], "ProcessOutputID", "SubProcessOutputID")
    units = {r["UnitID"]: r for r in tables["Unit"]}

    periods = tables["Period"]
    layers = tables["FlowLayer"]
    if layer_id is None and layers:
        layer_id = layers[0]["FlowLayerID"]

    # Périodes. Un fichier STAN multi-périodes devient un GROUPE DE TAGS DE DONNÉES :
    # une période = un tag, et chaque flux porte une valeur par tag. `period_id` force
    # une période unique (et donc une valeur plate, sans tags), pour les appelants qui
    # n'en veulent qu'une.
    if period_id is not None:
        selected_periods = [p for p in periods if p["PeriodID"] == period_id]
    else:
        selected_periods = list(periods)
    if not selected_periods and periods:
        selected_periods = [periods[0]]
    period_ids = [p["PeriodID"] for p in selected_periods]
    multi_period = len(selected_periods) > 1

    # Valeurs indexées par (PeriodID, FlowID).
    #
    # STAN autorise une unité de SAISIE différente par flux (dans Example.smfa, Flow B
    # est en kg quand les autres sont en tonnes) mais AFFICHE tout dans l'unité par
    # défaut de la couche — sa légende dit « Flows [t/a] ». On normalise donc en SI
    # via `Factor`, puis on convertit vers cette unité d'affichage. Convertir en SI et
    # s'y arrêter, comme avant, écrivait « 190 000 » là où STAN écrit « 190 ».
    retained = []
    for fv in tables["FlowValue"]:
        if fv.get("PeriodID") not in period_ids:
            continue
        if layer_id is not None and fv.get("FlowLayerID") != layer_id:
            continue
        raw = fv.get("MFInput")
        if raw is None:
            raw = fv.get("MFCalc")  # repli sur la valeur réconciliée
        if raw is None:
            continue
        retained.append(fv)

    display_factor, unit_code = _display_unit(tables, units, retained, layer_id)

    flow_values = {}
    for fv in retained:
        raw = fv.get("MFInput")
        if raw is None:
            raw = fv.get("MFCalc")
        num_unit = units.get(fv.get("MFNumUnitID"))
        factor = num_unit["Factor"] if num_unit and num_unit.get("Factor") else 1.0
        # L'arrondi ôte le bruit du double aller-retour de facteurs (114999.999... -> 115).
        flow_values[(fv["PeriodID"], fv["FlowID"])] = round(raw * factor / display_factor, 6)

    def flow_value(flow_id, pid):
        return flow_values.get((pid, flow_id), 0.0)

    def flow_value_max(flow_id):
        """Valeur maximale sur les périodes : sert à dimensionner l'échelle et les bandes.

        Une échelle calée sur une seule période ferait déborder les autres de leur boîte.
        """
        return max((flow_value(flow_id, pid) for pid in period_ids), default=0.0)

    # --- Nœuds : un par processus (frontière incluse pour fidélité) ---
    nodes = {}
    node_id_of_process = {}

    def node_id_for_process(proc_id):
        proc = processes[proc_id]
        name = proc.get("Name") or ("Process %s" % proc_id)
        nid = sankey_layout.normalizeStringToValidId("proc_%s_%s" % (proc_id, name))
        node_id_of_process[proc_id] = nid
        if nid not in nodes:
            nodes[nid] = sankey_layout.create_json_node(nid, name)
        return nid

    external_of_flow = {}

    def external_node(kind, flow_id):
        # UN nœud externe PAR FLUX, comme les imports/exports scindés d'OpenSankey —
        # et comme STAN, qui dessine un marqueur « I » ou « E » au bout de chacun.
        # Un nœud partagé cumulerait tous les imports en une seule bande énorme.
        name = "Import" if kind == "import" else "Export"
        nid = sankey_layout.normalizeStringToValidId("ext_%s_%s" % (kind, flow_id))
        if nid not in nodes:
            nodes[nid] = sankey_layout.create_json_node(nid, name)
        external_of_flow[flow_id] = nid
        return nid

    # --- Flux ---------------------------------------------------------
    # Les couleurs de flux sont les seules que STAN mémorise : elles sont un choix
    # de l'utilisateur, pas une palette. Elles descendent donc en local (cf. le
    # thème `stan`, qui a `node_rule: none` et `link_rule: flow`).
    flow_colors = _flow_colors(tables)
    links = {}
    link_id_of_flow = {}
    # Épaisseur de référence de chaque lien : `value` peut être un ARBRE (multi-période),
    # auquel cas `data_value` n'existe plus à sa racine.
    sizing_of_link = {}
    for fl in tables["Flow"]:
        fid = fl["FlowID"]
        out_id = fl.get("ProcessOutputID")
        in_id = fl.get("ProcessInputID")
        src_proc = pout_to_proc.get(out_id) if out_id is not None else None
        tgt_proc = pin_to_proc.get(in_id) if in_id is not None else None

        src_node = (node_id_for_process(src_proc) if src_proc is not None
                    else external_node("import", fid))
        tgt_node = (node_id_for_process(tgt_proc) if tgt_proc is not None
                    else external_node("export", fid))

        # La bande d'un flux est dimensionnée sur son maximum toutes périodes
        # confondues : c'est lui qui doit tenir dans la boîte du processus.
        sizing_value = flow_value_max(fid)
        new_flow = sankey_layout.create_json_flow(
            src_node, tgt_node, sizing_value, flow_colors.get(fid))
        # Le nom d'un flux (« Flow A ») ne vit pas dans `name` — celui d'un lien est un
        # getter calculé « source---cible », sans setter — mais dans `value.text_value`,
        # que `LinkDrawNameLabel` affiche quand `name_label_text_source` vaut `custom`
        # (son défaut). Il ne concurrence pas le label de valeur, qui passe par data_label.
        flow_name = fl.get("Name")
        if flow_name:
            new_flow["value"]["text_value"] = flow_name
        if multi_period:
            # Une valeur par tag de période. L'arbre est reconstruit côté front à partir
            # du groupe `dataTags` ; le JSON n'y dépose que les feuilles.
            tree = {"datatag_group": _PERIOD_TAGG_ID}
            for period in selected_periods:
                leaf = {"data_value": flow_value(fid, period["PeriodID"])}
                if flow_name:
                    leaf["text_value"] = flow_name
                tree[_period_tag_id(period)] = leaf
            new_flow["value"] = tree
        links[new_flow["id"]] = new_flow
        link_id_of_flow[fid] = new_flow["id"]
        sizing_of_link[new_flow["id"]] = sizing_value

        node_src = nodes[src_node]
        node_tgt = nodes[tgt_node]
        node_src["outputLinksId"].append(new_flow["id"])
        node_src["output_value"] += sizing_value
        node_src["links_order"].append(new_flow["id"])
        node_tgt["inputLinksId"].append(new_flow["id"])
        node_tgt["input_value"] += sizing_value
        node_tgt["links_order"].append(new_flow["id"])

    # --- Mise en page : celle du fichier si elle s'y trouve, sinon calculée -----
    #
    # Aucune couleur n'est cuite dans les nœuds : STAN n'attribue pas de palette,
    # tout y est noir sauf ce que l'utilisateur a peint. C'est le thème `stan` qui
    # porte cela (cf. NOTE-THEMES.md), et la couleur reste ainsi commutable.
    #
    # Le processus « frontière du système » ne devient jamais un nœud : depuis que la
    # chaîne SubProcessInput/Output est suivie, aucun flux ne s'y raccroche. Son cadre
    # en pointillés devient une zone de texte, comme les autres.
    geometry = read_geometry(tables)
    containers = {}

    if geometry:
        DA_scale = _apply_stan_geometry(
            nodes, links, node_id_of_process, link_id_of_flow, external_of_flow,
            sizing_of_link, geometry["processes"], geometry["polylines"],
            geometry["markers"])
        containers = _text_containers(geometry["texts"])
    else:
        try:
            DA_scale = sankey_layout.computeSankeyPosition(nodes, links, _default_setting())
        except Exception:
            # Positionnement best-effort : si l'algo échoue (graphe dégénéré),
            # on laisse le front relancer un auto-layout.
            DA_scale = 100.0

    # Stocks : un processus peut en porter un, avec son niveau et sa variation.
    stocks = _stock_values(
        tables, node_id_of_process, selected_periods, layer_id, display_factor, units)
    for node_id, stock_json in stocks.items():
        node = nodes.get(node_id)
        if node is not None:
            node["stock_values"] = stock_json
            node["stock_shape_is_visible"] = True

    theme = _stan_theme(unit_code)
    return {
        "version": "0.9",
        "nodes": nodes,
        "links": links,
        "labels": containers,
        # Un seul jeu de valeurs : pas de groupe de tags, la valeur reste plate.
        "dataTags": _period_tag_group(selected_periods) if multi_period else {},
        "user_scale": DA_scale,
        "couleur_fond_sankey": "#ffffff",
        # STAN dessine ses flux non renseignés (une simple ligne fine, cf. Flow D/E) :
        # sans cela, ils disparaîtraient du diagramme importé.
        "show_zero_links": True,
        # Le patch du thème est fusionné dans les styles écrits au fichier : à la
        # LECTURE, `loadTheme` ne l'applique pas (le fichier fait autorité, cf.
        # NOTE-THEMES.md). Sans cette fusion, un diagramme STAN importé n'aurait pas
        # la silhouette de STAN. Les clés du patch portent des noms d'attributs
        # modernes, recopiés verbatim par StylePersistence.fromJSON.
        "style_node": {"default": dict(_default_node_style(), **theme["styles"]["NodeStyle"])},
        "style_link": {"default": dict(_default_link_style(), **theme["styles"]["LinkStyle"])},
        "grid_visible": False,
        "theme": theme,
    }


def _html_escape(text):
    """Échappe un texte pour l'insérer dans le contenu HTML d'une zone de texte."""
    return (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\n", "<br/>"))


def _text_containers(texts):
    """Traduit les zones de texte de STAN en conteneurs OpenSankey.

    STAN y met ses en-têtes (« Sum of Imports »), sa légende, son titre, et le cadre
    en pointillés de la frontière du système. Seul ce dernier a une forme visible.

    Le format 0.9 d'un conteneur N'EST PAS celui d'un nœud, et s'en écarte sur trois
    points qui, ignorés, donnent une zone sans texte, mal dimensionnée et bordée :

      - son texte se lit dans `title`, pas dans `name` (que `fromJSON_0_91` écrase) ;
      - ses dimensions dans `label_width` / `label_height`, pas `node_width/height` ;
      - `shape_border_visible` vaut `!transparent_border`, donc l'absence de la clé
        allume la bordure.

    `fromJSON_0_91` force par ailleurs `name_label_has_fo`, si bien que le texte rendu
    vient de `content` (du HTML), et non de `name_label_text`.
    """
    containers = {}
    for i, item in enumerate(texts):
        x, y, w, h = item["bounds"]
        cid = "id_stan_text_%d" % i
        frame = bool(item["frame"])
        # STAN sépare ses lignes par CRLF.
        text = (item["text"] or "").replace("\r\n", "\n").replace("\r", "\n").strip()
        # Le cadre de la frontière encadre le diagramme, pas du texte : il garde ses
        # dimensions exactes. Les zones de texte, elles, doivent respirer.
        pad_w = 1.0 if frame else _TEXT_ZONE_PADDING_W
        pad_h = 1.0 if frame else _TEXT_ZONE_PADDING_H
        width = max(w * _PX_PER_STAN_UNIT * pad_w, 1.0)
        height = max(h * _PX_PER_STAN_UNIT * pad_h, 1.0)
        containers[cid] = {
            "id": cid,
            "name": text,
            "title": text,
            "content": _html_escape(text),
            # On élargit autour du centre, pour ne pas décaler la zone vers la droite
            # et vers le bas en la faisant grandir.
            "x": x * _PX_PER_STAN_UNIT - (width - w * _PX_PER_STAN_UNIT) / 2.0,
            "y": y * _PX_PER_STAN_UNIT - (height - h * _PX_PER_STAN_UNIT) / 2.0,
            "label_width": width,
            "label_height": height,
            # Le cadre de la frontière du système est le seul à avoir un trait, et il
            # est en pointillés. Les autres zones sont du texte nu.
            "transparent_border": not frame,
            "color_visible": False,
            "color": "#ffffff",
            # Relues à la racine par le `fromJSON` moderne, qui passe APRÈS la
            # migration 0.91 et a donc le dernier mot.
            "shape_border_dashed": frame,
            "name_label_is_visible": bool(text),
            "style": "default",
            "tags": {},
            "local": {},
            "tiedToNode": False,
            "attachedNodes": [],
        }
    return containers


def _link_has_name(link):
    """Le flux porte-t-il un nom ? (`text_value` plat, ou dans les feuilles multi-période)."""
    value = link.get("value") or {}
    if value.get("text_value"):
        return True
    return any(isinstance(leaf, dict) and leaf.get("text_value")
               for leaf in value.values())


def _place_vertical_flux_labels(link, points, band_px):
    """Labels d'un flux VERTICAL, à la façon de STAN.

    STAN écrit toujours ses textes à l'horizontale : la valeur reste dans son
    ellipse SUR le flux mais ne pivote pas avec lui, et le nom (les « Flow
    Properties ») s'écrit À DROITE du tracé, à mi-hauteur. Chez nous, par
    défaut, `value_label_on_path` couche le texte le long du tracé (un textPath
    suit sa direction), et le nom se pose sous le point de départ.

    Trois attributs modernes suffisent côté valeur : hors tracé (`on_path`),
    centré (`vert: middle` — le `horiz: middle` par défaut ancre déjà au milieu
    du lien), sans repositionnement automatique (`pos_auto`). Le nom passe en
    position ABSOLUE (ancre `start`, baseline `middle` : le texte part vers la
    droite depuis le point donné), calculée sur la polyligne STAN : bord droit
    de la bande + marge, à mi-hauteur du tracé.
    """
    local = link["local"]
    local["value_label_on_path"] = False
    local["value_label_vert"] = "middle"
    local["value_label_pos_auto"] = False
    if not (points and _link_has_name(link)):
        return
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    local["name_label_position_absolute"] = True
    local["name_label_position_x"] = ((min(xs) + max(xs)) / 2.0) * _PX_PER_STAN_UNIT \
        + band_px / 2.0 + _VERTICAL_NAME_PAD_PX
    local["name_label_position_y"] = ((min(ys) + max(ys)) / 2.0) * _PX_PER_STAN_UNIT


def _apply_stan_geometry(nodes, links, node_id_of_process, link_id_of_flow,
                         external_of_flow, sizing_of_link, proc_bounds, polylines, markers):
    """Pose les positions, tailles et tracés dessinés par l'utilisateur dans STAN.

    Renvoie l'échelle (`user_scale`) du front. Celle-ci est choisie pour qu'aucune
    bande de flux ne dépasse la boîte du processus qu'elle traverse : chez nous la
    hauteur d'un nœud est celle de sa bande de flux, plancherée par `node_height`
    (= `shape_min_height`). En calant l'échelle sur le processus le plus contraint,
    les boîtes gardent leur taille STAN et les flux restent à l'intérieur.
    """
    scale = _PX_PER_STAN_UNIT
    ky = None
    for proc_id, bounds in proc_bounds.items():
        node = nodes.get(node_id_of_process.get(proc_id))
        if node is None:
            continue
        x, y, w, h = bounds
        node["x"] = x * scale
        node["y"] = y * scale
        # `node_width` / `node_height` deviennent `shape_min_width` / `shape_min_height`,
        # des PLANCHERS : un nœud ne rétrécit jamais sous sa bande de flux.
        node["local"]["node_width"] = w * scale
        node["local"]["node_height"] = h * scale
        value = max(node["input_value"], node["output_value"])
        if value > 0:
            candidate = (h * scale) / value
            ky = candidate if ky is None else min(ky, candidate)

    # Nœuds externes : abscisse du marqueur « I » / « E », mais ordonnée alignée sur
    # le PROCESSUS d'en face, pas sur le marqueur.
    #
    # Un nœud se positionne par son coin haut-gauche, et notre moteur empile les flux
    # d'un côté depuis ce bord haut. Pour qu'un import arrive tout droit de la gauche —
    # ce que fait STAN — le nœud externe doit donc commencer exactement là où sa bande
    # se raccorde au processus. Se contenter du marqueur laissait le flux en biais.
    band_of = {}
    for link_id, sizing in sizing_of_link.items():
        band_of[link_id] = (sizing * ky) if ky else 0.0

    # Préplacement grossier des nœuds externes, sur leur marqueur : le tri qui suit a
    # besoin d'une ordonnée, et l'alignement fin a besoin du tri. On casse la boucle ici.
    for flow_id, node_id in external_of_flow.items():
        marker, node = markers.get(flow_id), nodes.get(node_id)
        if node is not None and marker is not None:
            bounds = marker["bounds"]
            node["y"] = (bounds[1] + bounds[3] / 2.0) * scale

    # Régime de chaque flux, décidé sur son tracé complet (cf. _route_from_polyline).
    routes = {}
    for flow_id, points in polylines.items():
        route = _route_from_polyline(points)
        if route is not None:
            routes[flow_id] = route
    flow_of_link = {lid: fid for fid, lid in link_id_of_flow.items()}

    # L'empilement des flux d'un côté suit l'ordre de la liste : on la trie pour
    # retrouver l'ordre vertical de STAN. La clé d'un flux est sa POLYLIGNE lue
    # depuis le nœud en s'en éloignant (tuple d'ordonnées) : le point d'attache
    # d'abord, puis chaque coude. STAN fait converger les tracés qui fusionnent
    # (F43/F44/F49 → P09 dans Wastewater : même point final (183, 15) pour tous),
    # et c'est en remontant la route que l'ordre apparaît — le flux DIRECT (tuple
    # préfixe, plus court) passe devant, puis chacun se départage sur le coude de
    # son propre étage. Repli sans tracé : l'ordonnée du nœud d'en face.
    def _facing_key(link_id, opposite_key, from_end):
        pts = _simplify_polyline(polylines.get(flow_of_link.get(link_id)) or [])
        if len(pts) >= 2:
            seq = reversed(pts) if from_end else pts
            # Arrondi au 1/10 px : les coordonnées STAN sont des float32, et leur
            # bruit (7e chiffre) suffirait sinon à inverser deux tuples égaux à
            # l'œil — c'est lui qui décidait de l'ordre au lieu du coude suivant.
            return tuple(round(p[1] * scale, 1) for p in seq)
        return (nodes[links[link_id][opposite_key]]["y"],)

    for node in nodes.values():
        node["inputLinksId"].sort(key=lambda lid: _facing_key(lid, "idSource", True))
        node["outputLinksId"].sort(key=lambda lid: _facing_key(lid, "idTarget", False))
        node["links_order"] = node["inputLinksId"] + node["outputLinksId"]

    def attachment_center(process_node, link_id, side, box_height):
        """Ordonnée du CENTRE de la bande de ce flux, sur le côté donné du processus.

        Le moteur ne colle pas la bande en haut du nœud : `shape_anchor_align_vertical`
        vaut `center` par défaut, donc l'empilement démarre à `(hauteur - bande) / 2`
        (cf. Node.getLinksStartingPositionOffSet). Un nœud de processus est plus haut
        que sa bande — sa boîte STAN fait 100 px — et ignorer ce décalage laissait les
        flux d'import en biais.
        """
        occupied = sum(band_of.get(other, 0.0) for other in process_node[side])
        offset = max(0.0, (box_height - occupied) / 2.0)
        for other in process_node[side]:
            if other == link_id:
                break
            offset += band_of.get(other, 0.0)
        return process_node["y"] + offset + band_of.get(link_id, 0.0) / 2.0

    for flow_id, node_id in external_of_flow.items():
        node = nodes.get(node_id)
        marker = markers.get(flow_id)
        link_id = link_id_of_flow.get(flow_id)
        if node is None or marker is None or link_id is None:
            continue
        bounds = marker["bounds"]
        link = links[link_id]
        is_import = link["idSource"] == node_id
        facing_id = link["idTarget"] if is_import else link["idSource"]
        facing = nodes.get(facing_id)

        # STAN nomme ces nœuds « I » et « E », et les dessine en ellipse, la lettre
        # centrée dedans.
        node["name"] = marker["text"] or ("I" if is_import else "E")
        node["local"]["shape"] = "ellipse"
        node["local"]["label_visible"] = True
        # `inside_*` met le libellé DANS la forme ; ce sont `name_label_vert` et
        # `name_label_horiz` qui décident OÙ. Le style de nœud du thème les laisse à
        # `bottom` / `middle` (le nom d'un processus est en bas de sa boîte), d'où une
        # lettre collée au bas de l'ellipse.
        node["local"]["name_label_inside_vert"] = True
        node["local"]["name_label_inside_horiz"] = True
        node["local"]["name_label_vert"] = "middle"
        node["local"]["name_label_horiz"] = "middle"

        band = band_of[link_id]
        # La hauteur suit l'épaisseur du flux, avec un plancher : l'ellipse doit pouvoir
        # contenir sa lettre, y compris pour un flux à valeur nulle. Le plancher ne rompt
        # pas l'alignement — l'ancre d'un flux est CENTRÉE sur la hauteur du nœud
        # (`shape_anchor_align_vertical`), donc le milieu de la bande reste le milieu du
        # nœud, quelle que soit sa taille.
        #
        # STAN dessine un disque de taille FIXE dont le flux part du centre ; chez nous la
        # bande est contenue dans le nœud. L'ellipse s'allonge donc avec le flux épais.
        height = max(band, _EXTERNAL_NODE_MIN_PX)
        node["local"]["node_width"] = max(bounds[2] * scale, _EXTERNAL_NODE_MIN_PX)
        node["local"]["node_height"] = height
        node["x"] = bounds[0] * scale

        # On aligne les CENTRES, pas les bords : un nœud se positionne par son coin
        # haut-gauche, mais c'est le milieu de sa bande qui doit tomber en face du
        # milieu de la bande du processus, sans quoi le flux d'import arrive en biais.
        route = routes.get(flow_id)
        if facing is None or (route is not None and route["kind"] == "routed"):
            # Flux ROUTÉ : son tracé (waypoints) part du marqueur, pas du bord du
            # processus d'en face. L'aligner sur la bande du processus, comme un
            # flux droit, arrachait le nœud « I »/« E » de son marqueur et
            # empilait au même endroit tous les externes d'un même processus
            # (F43/F44/F49 → P09 dans BalansSTANcheck-Wastewater). Le marqueur
            # STAN est la position fidèle : le premier segment de la route en part.
            center = (bounds[1] + bounds[3] / 2.0) * scale
        else:
            side = "inputLinksId" if is_import else "outputLinksId"
            # Hauteur RENDUE du processus : sa boîte STAN, ou sa bande si elle déborde
            # (cf. Node.getShapeHeightToUse, où node_height n'est qu'un plancher).
            box_height = max(
                sum(band_of.get(x, 0.0) for x in facing["inputLinksId"]),
                sum(band_of.get(x, 0.0) for x in facing["outputLinksId"]),
                facing["local"].get("node_height", 0.0))
            center = attachment_center(facing, link_id, side, box_height)
        node["y"] = center - height / 2.0

    # Application du régime décidé par _route_from_polyline. Un flux ROUTÉ ne
    # reçoit PAS d'orientation : en régime routé le front la déduit de la route
    # (cf. NOTE-WAYPOINTS.md), et `shape_waypoints` — nom moderne, sans alias
    # legacy — est relu par la boucle générique de ProtoElementPersistence.fromJSON.
    for flow_id, route in routes.items():
        link = links.get(link_id_of_flow.get(flow_id))
        if link is None:
            continue
        if route["kind"] == "routed":
            link["local"]["shape_waypoints"] = [
                {"x": x * scale, "y": y * scale} for x, y in route["waypoints"]]
            # Segments d'attache quasi nuls, comme l'import e!Sankey : le tracé
            # part droit du nœud vers son premier waypoint.
            link["local"]["left_horiz_shift"] = 0.01
            link["local"]["right_horiz_shift"] = 0.01
        else:
            link["local"]["orientation"] = route["orientation"]
            if route["kind"] == "diagonal":
                # Droite libre STAN : en rendu droit le tracé paramétrique est
                # bout - diagonale - bout ; des bouts quasi nuls laissent la
                # diagonale seule, comme STAN la dessine.
                link["local"]["left_horiz_shift"] = 0.01
                link["local"]["right_horiz_shift"] = 0.01
            if route["orientation"] == "vv":
                _place_vertical_flux_labels(
                    link, polylines.get(flow_id) or [], band_of.get(link["id"], 0.0))

    if not ky or ky <= 0:
        return 100.0
    # px = valeur x ky, et le front calcule px = valeur / user_scale x 100.
    return 100.0 / ky


def _stan_theme(unit_code=None):
    """Le thème `stan` : pas de palette, bordure noire, valeur dans une ellipse.

    STAN n'attribue aucune couleur automatiquement — le noir est son défaut, et
    toute couleur est un choix de l'utilisateur, posé sur l'élément. D'où
    `node_rule: none` et `link_rule: flow`.

    Le fond de label demande TROIS attributs, pas un : `DrawLabel` ne peint que si
    `background_color_visible` est vrai, et n'utilise la couleur déclarée que si
    `background_color_sustainable` l'est aussi — sinon il reprend celle de l'élément,
    et l'ellipse blanche devient une ellipse de la couleur du flux.
    """
    link_style = {
        "shape_color": "#000000",
        "shape_color_rule": "flow",
        "shape_opacity": 1,
        "shape_is_curved": False,
        "shape_is_arrow": True,
        # Les pointes de flèche de STAN sont nettement plus allongées que notre défaut (10).
        "shape_arrow_size": 25,
        # Le nom du flux, lu depuis `value.text_value` (le défaut de
        # `name_label_text_source` est déjà `custom`). STAN l'écrit à côté du tracé,
        # pas dessus — la valeur, elle, est sur le tracé, dans son ellipse.
        "name_label_is_visible": True,
        "name_label_color": "#000000",
        # STAN écrit le nom du flux SOUS son tracé, et la valeur dessus, dans l'ellipse.
        "name_label_vert": "bottom",
        "name_label_on_path": False,
        "value_label_is_visible": True,
        "value_label_on_path": True,
        "value_label_color": "#000000",
        # STAN écrit des entiers, jamais de décimales.
        "value_label_custom_digit": True,
        "value_label_nb_digit": 0,
        # L'ellipse blanche à liseré noir.
        "value_label_background_visible": True,
        "value_label_background_type": "ellipse",
        "value_label_background_color_visible": True,
        "value_label_background_color_sustainable": True,
        "value_label_background_color": "#ffffff",
        "value_label_background_opacity": 1,
        "value_label_background_border_visible": True,
        "value_label_background_border_color": "#000000",
        "value_label_background_border_thickness": 1,
        # Sans marges, `rx = largeur_texte / 2` : l'ellipse est INSCRITE dans le
        # rectangle du texte et lui coupe les coins. Elles ne sont pas déclarées dans
        # Element.tsx (typage seul) mais existent bien dans ALL_ATTRIBUTES_CONFIG,
        # engendrées par createConfigWithPrefixAndOverrides(BASE_SHAPE_CONFIG, 'background').
        "value_label_background_margin_left": 8,
        "value_label_background_margin_right": 8,
        "value_label_background_margin_top": 3,
        "value_label_background_margin_bottom": 3,
    }
    if unit_code:
        # La légende de STAN dit « Flows [t/a] » : l'unité est celle de la saisie.
        link_style["value_label_unit_visible"] = True
        link_style["value_label_unit_type"] = "unit_name"
        link_style["value_label_unit"] = unit_code

    return {
        "id": "stan",
        "palette": {"colors": [], "offset": 0, "node_rule": "none", "link_rule": "flow"},
        "styles": {
            "NodeStyle": {
                "shape_type": "rect",
                "shape_color": "#ffffff",
                "shape_border_visible": True,
                "shape_border_color": "#000000",
                "shape_border_thickness": 1,
                "name_label_is_visible": True,
                "name_label_inside_vert": True,
                "name_label_inside_horiz": True,
                "value_label_is_visible": False,
            },
            "LinkStyle": link_style,
        },
        "globals": {"couleur_fond_sankey": "#ffffff"},
    }


# Alias historique (l'entrée publique gérait initialement le seul .smfa).
parse_stan_smfa = parse_stan


def _default_setting():
    """Réglages minimaux attendus par computeSankeyPosition."""
    return {
        "size_width": "1000",
        "size_height": "600",
        "margin_top": "20",
        "margin_bottom": "20",
        "node_width": "20",
        "node_height": "50",
        "node_spacing": "50",
        "node_opacity": "1",
        "flow_inheritfrom": "source",
        "flow_opacity": "0.45",
        "layout_order": "automatic",
        "labels_linespacing": "0.2",
        "labels_relativesize": "100",
        "label_name_size": "16",
        "label_name_weight": "400",
        "label_name_appears": "Y",
        "label_value_appears": "Y",
        "label_position_autoalign": "0",
        "label_position_scheme": "auto",
        "label_position_first": "before",
        "label_position_breakpoint": "3",
    }


def _default_node_style():
    return {
        "shape_visible": True,
        "shape": "rect",
        "node_width": 20.0,
        "node_height": 0,
        "color": "#888888",
        "colorSustainable": False,
        "label_visible": True,
        "font_family": "Arial,sans-serif",
        "font_size": 16.0,
        "label_vert": "bottom",
        "label_horiz": "middle",
        "show_value": True,
        "value_font_size": 16.0,
        "label_vert_valeur": "top",
        "label_horiz_valeur": "middle",
        "position": "absolute",
        "name": "Style par default",
    }


def _default_link_style():
    return {
        "orientation": "hh",
        "left_horiz_shift": 0.05,
        "right_horiz_shift": 0.05,
        "starting_tangeant": 0.25,
        "ending_tangeant": 0.25,
        "curvature": 0.5,
        "curved": True,
        "color": "#999999",
        "opacity": 0.45,
        "label_visible": False,
        "font_family": "Arial,sans-serif",
        "name": "Style par default",
    }


def _build_minimal_smfa(path):
    """Construit un .smfa minimal (schéma réduit aux tables lues) pour les tests.

    Modèle : P1(Process 1) --Flow B--> P2(Process 2), un import vers P1 (Flow A),
    valeurs en t (Factor 1000) et kg (Factor 1) pour couvrir la normalisation.
    """
    con = sqlite3.connect(path)
    cur = con.cursor()
    cur.executescript(
        """
        CREATE TABLE Process(ProcessID INT, ProcessType INT, Name TEXT);
        CREATE TABLE ProcessInput(ProcessInputID INT, ProcessID INT);
        CREATE TABLE ProcessOutput(ProcessOutputID INT, ProcessID INT);
        CREATE TABLE Flow(FlowID INT, ProcessInputID INT, ProcessOutputID INT, Name TEXT);
        CREATE TABLE FlowValue(FlowID INT, PeriodID INT, FlowLayerID INT,
            MFInput REAL, MFCalc REAL, MFNumUnitID INT);
        CREATE TABLE Unit(UnitID INT, UnitCode TEXT, Factor REAL);
        CREATE TABLE Period(PeriodID INT, PeriodCode TEXT);
        CREATE TABLE FlowLayer(FlowLayerID INT, MaterialCode TEXT, Name TEXT);
        """
    )
    cur.executemany("INSERT INTO Process VALUES(?,?,?)",
                    [(1, 1, "Systemgrenze"), (2, 2, "Process 1"), (3, 2, "Process 2")])
    cur.executemany("INSERT INTO ProcessInput VALUES(?,?)", [(10, 2), (11, 3)])
    cur.executemany("INSERT INTO ProcessOutput VALUES(?,?)", [(20, 2)])
    cur.executemany("INSERT INTO Flow VALUES(?,?,?,?)",
                    [(0, 10, None, "Flow A"), (1, 11, 20, "Flow B")])
    cur.executemany("INSERT INTO FlowValue VALUES(?,?,?,?,?,?)",
                    [(0, 1, 1, 250.0, None, 20),        # 250 t -> 250000
                     (1, 1, 1, 115000.0, None, 2)])     # 115000 kg -> 115000
    cur.executemany("INSERT INTO Unit VALUES(?,?,?)", [(2, "kg", 1.0), (20, "t", 1000.0)])
    cur.execute("INSERT INTO Period VALUES(1, '2006')")
    cur.execute("INSERT INTO FlowLayer VALUES(1, 'Good', 'Good')")
    con.commit()
    con.close()


def _build_two_periods_smfa(path):
    """Meme modele que _build_minimal_smfa, mais DEUX periodes et un stock sur P1."""
    _build_minimal_smfa(path)
    con = sqlite3.connect(path)
    cur = con.cursor()
    cur.execute("INSERT INTO Period VALUES(2, '2007')")
    cur.executemany("INSERT INTO FlowValue VALUES(?,?,?,?,?,?)",
                    [(0, 2, 1, 300.0, None, 20),     # 300 t
                     (1, 2, 1, 90.0, None, 20)])     # 90 t
    cur.executescript(
        """
        CREATE TABLE Stock(ProcessID INT, FlowLayerID INT, PeriodID INT,
            SVInput REAL, SVCalc REAL, SVUnitID INT,
            DTInput REAL, DTCalc REAL, DTNumUnitID INT);
        CREATE TABLE DefaultUnit(FlowLayerID INT, NumUnitID INT, DenomUnitID INT);
        """
    )
    cur.executemany("INSERT INTO Stock VALUES(?,?,?,?,?,?,?,?,?)",
                    [(2, 1, 1, 40.0, None, 20, 5.0, None, 20),
                     (2, 1, 2, 45.0, None, 20, 7.0, None, 20)])
    cur.execute("INSERT INTO DefaultUnit VALUES(-1, 20, 17)")
    con.commit()
    con.close()


def test_periodes_deviennent_un_groupe_de_tags_de_donnees():
    import tempfile
    import os
    path = os.path.join(tempfile.mkdtemp(), "two.smfa")
    _build_two_periods_smfa(path)
    result = parse_stan(path)

    tagg = result["dataTags"][_PERIOD_TAGG_ID]
    assert tagg["tags_order"] == ["2006", "2007"]
    # Une seule periode selectionnee a l'ouverture.
    assert [t["selected"] for t in tagg["tags"].values()] == [True, False]

    # Chaque flux porte une valeur PAR TAG ; l'arbre remplace la valeur plate.
    by_name = {link["value"].get("2006", {}).get("text_value"): link
               for link in result["links"].values()}
    flow_a = by_name["Flow A"]
    assert flow_a["value"]["datatag_group"] == _PERIOD_TAGG_ID
    assert flow_a["value"]["2006"]["data_value"] == 250.0   # 250 t affichees en t
    assert flow_a["value"]["2007"]["data_value"] == 300.0
    assert "data_value" not in flow_a["value"]

    # Les stocks suivent la meme structure, avec niveau et variation.
    stocks = {n["name"]: n.get("stock_values") for n in result["nodes"].values()}
    p1 = stocks["Process 1"]
    assert p1["datatag_group"] == _PERIOD_TAGG_ID
    assert p1["2006"] == {"initial_stock": 40.0, "stock_variation": 5.0}
    assert p1["2007"] == {"initial_stock": 45.0, "stock_variation": 7.0}
    assert next(n for n in result["nodes"].values()
                if n["name"] == "Process 1")["stock_shape_is_visible"] is True


def test_periode_unique_garde_une_valeur_plate():
    # Sans tags, `link["value"]["data_value"]` doit rester lisible tel quel : c'est ce
    # que fait le front quand aucun groupe de tags de donnees n'existe.
    import tempfile
    import os
    path = os.path.join(tempfile.mkdtemp(), "one.smfa")
    _build_minimal_smfa(path)
    result = parse_stan(path)
    assert result["dataTags"] == {}
    assert all("data_value" in link["value"] for link in result["links"].values())


def test_period_id_force_une_seule_periode():
    import tempfile
    import os
    path = os.path.join(tempfile.mkdtemp(), "two.smfa")
    _build_two_periods_smfa(path)
    result = parse_stan(path, period_id=2)
    assert result["dataTags"] == {}
    values = sorted(link["value"]["data_value"] for link in result["links"].values())
    assert values == [90.0, 300.0]


def _build_minimal_zmfa(path):
    """Construit un .zmfa minimal (XML gzippé) : même modèle que le .smfa de test.

    Flow A n'a pas d'élément ProcessOutputID (= import, équivalent du NULL
    SQLite) ; les valeurs mélangent t et kg pour couvrir la normalisation.
    """
    xml = """<MfaSystemData xmlns="http://inkasoft.net/MfaSystemData.xsd">
  <Process><ProcessID>1</ProcessID><ProcessType>1</ProcessType><Name>Systemgrenze</Name></Process>
  <Process><ProcessID>2</ProcessID><ProcessType>2</ProcessType><Name>Process 1</Name></Process>
  <Process><ProcessID>3</ProcessID><ProcessType>2</ProcessType><Name>Process 2</Name></Process>
  <ProcessInput><ProcessInputID>10</ProcessInputID><ProcessID>2</ProcessID></ProcessInput>
  <ProcessInput><ProcessInputID>11</ProcessInputID><ProcessID>3</ProcessID></ProcessInput>
  <ProcessOutput><ProcessOutputID>20</ProcessOutputID><ProcessID>2</ProcessID></ProcessOutput>
  <Flow><FlowID>0</FlowID><ProcessInputID>10</ProcessInputID><Name>Flow A</Name></Flow>
  <Flow><FlowID>1</FlowID><ProcessInputID>11</ProcessInputID>
    <ProcessOutputID>20</ProcessOutputID><Name>Flow B</Name></Flow>
  <FlowValue><FlowValueID>1</FlowValueID><FlowID>0</FlowID><FlowLayerID>1</FlowLayerID><PeriodID>1</PeriodID><MFNumUnitID>20</MFNumUnitID><MFInput>250</MFInput></FlowValue>
  <FlowValue><FlowValueID>2</FlowValueID><FlowID>1</FlowID><FlowLayerID>1</FlowLayerID><PeriodID>1</PeriodID><MFNumUnitID>2</MFNumUnitID><MFInput>115000</MFInput></FlowValue>
  <Unit><UnitID>2</UnitID><UnitCode>kg</UnitCode><Factor>1</Factor></Unit>
  <Unit><UnitID>20</UnitID><UnitCode>t</UnitCode><Factor>1000</Factor></Unit>
  <Period><PeriodID>1</PeriodID><PeriodCode>2006</PeriodCode></Period>
  <FlowLayer><FlowLayerID>1</FlowLayerID><MaterialCode>Good</MaterialCode><Name>Good</Name></FlowLayer>
</MfaSystemData>
"""
    with gzip.open(path, "wb") as fh:
        fh.write(xml.encode("utf-8"))


def _check_minimal_result(result):
    """Assertions communes aux deux formats de test (même modèle minimal)."""
    assert result["version"] == "0.9"

    # 3 nœuds : Import, Process 1, Process 2 (frontière non touchée par un flux réel ici)
    names = sorted(n["name"] for n in result["nodes"].values())
    assert names == ["Import", "Process 1", "Process 2"]
    assert len(result["links"]) == 2

    by_pair = {}
    for link in result["links"].values():
        src = result["nodes"][link["idSource"]]["name"]
        tgt = result["nodes"][link["idTarget"]]["name"]
        by_pair[(src, tgt)] = link["value"]["data_value"]

    # Normalisation des unités : 250 t = 250000, 115000 kg = 115000
    assert by_pair[("Import", "Process 1")] == 250000.0
    assert by_pair[("Process 1", "Process 2")] == 115000.0


def test_parse_stan_smfa():
    import tempfile
    import os
    tmp = tempfile.mkdtemp()
    path = os.path.join(tmp, "mini.smfa")
    _build_minimal_smfa(path)
    _check_minimal_result(parse_stan(path))


def test_parse_stan_zmfa():
    import tempfile
    import os
    tmp = tempfile.mkdtemp()
    path = os.path.join(tmp, "mini.zmfa")
    _build_minimal_zmfa(path)
    _check_minimal_result(parse_stan(path))

    meta = list_periods_and_layers(path)
    assert meta["periods"] == [{"id": 1, "code": "2006"}]
    assert meta["layers"] == [{"id": 1, "name": "Good"}]


def test_parse_stan_unknown_format():
    import tempfile
    import os
    tmp = tempfile.mkdtemp()
    path = os.path.join(tmp, "not_stan.txt")
    with open(path, "wb") as fh:
        fh.write(b"definitely not a STAN file")
    try:
        parse_stan(path)
        assert False, "ValueError attendue"
    except ValueError:
        pass


def test_orientation_from_polyline():
    # STAN trace ses flux a angle droit : ordonnee constante = horizontal,
    # abscisse constante = vertical, sinon equerre nommee d'apres son 1er segment.
    assert _orientation_from_polyline([(0, 5), (10, 5), (20, 5)]) == "hh"
    assert _orientation_from_polyline([(5, 0), (5, 10), (5, 20)]) == "vv"
    assert _orientation_from_polyline([(0, 0), (10, 0), (10, 20)]) == "hv"
    assert _orientation_from_polyline([(0, 0), (0, 20), (10, 20)]) == "vh"
    # Trop peu de points, ou points confondus : on laisse le defaut du style.
    assert _orientation_from_polyline([]) is None
    assert _orientation_from_polyline([(1.0, 1.0)]) is None

    # STAN stocke ses coordonnees en flottants 32 bits : un trace rigoureusement
    # horizontal y a des ordonnees qui different au septieme chiffre. Sans tolerance,
    # tout devenait une equerre -- ce que des tests a coordonnees entieres ne voient pas.
    import struct as _struct

    def f32(v):
        return _struct.unpack('<f', _struct.pack('<f', v))[0]

    bruit = [(12.5, f32(35.0)), (f32(26.2), f32(35.0)), (f32(32.4), f32(35.000004))]
    assert _orientation_from_polyline(bruit) == "hh"
    assert _orientation_from_polyline([(f32(50.0), 45.0), (f32(50.000004), 68.0)]) == "vv"


def test_route_from_polyline():
    # 0 ou 1 coude : paramétrique, comme avant (hh/vv/hv/vh).
    assert _route_from_polyline([(0, 5), (20, 5)]) == {"kind": "parametric", "orientation": "hh"}
    assert _route_from_polyline([(5, 0), (5, 20)]) == {"kind": "parametric", "orientation": "vv"}
    assert _route_from_polyline([(0, 0), (10, 0), (10, 20)]) == {"kind": "parametric", "orientation": "hv"}
    assert _route_from_polyline([(0, 0), (0, 20), (10, 20)]) == {"kind": "parametric", "orientation": "vh"}

    # DEUX coudes (escalier h-v-h) : ROUTÉ, les points intérieurs deviennent des
    # waypoints. C'est le motif dominant de BalansSTANcheck-Wastewater (23/48 flux),
    # qu'on écrasait avant en équerre `hv` — mauvais tracé ET mauvais axe d'arrivée.
    route = _route_from_polyline([(0, 0), (10, 0), (10, 20), (30, 20)])
    assert route == {"kind": "routed", "waypoints": [(10, 0), (10, 20)]}

    # Boucle qui repart en arrière (h-v-h à rebours) : routé aussi.
    route = _route_from_polyline([(0, 0), (10, 0), (10, 20), (-30, 20)])
    assert route["kind"] == "routed"

    # Droite DIAGONALE libre (2 points) : flux droit, pas une équerre.
    assert _route_from_polyline([(0, 0), (30, 10)]) == {"kind": "diagonal", "orientation": "hh"}
    assert _route_from_polyline([(0, 0), (10, 30)]) == {"kind": "diagonal", "orientation": "vv"}

    # Tracé mixte sans détour (h puis diagonale puis h) : paramétrique hh — le rendu
    # droit (bout - diagonale - bout) est déjà sa silhouette.
    assert _route_from_polyline([(0, 0), (5, 0), (25, 10), (30, 10)]) == \
        {"kind": "parametric", "orientation": "hh"}

    # Points intermédiaires colinéaires : simplifiés, pas de faux waypoints
    # (« Racoyet - WB 3-1 » : 4 points rigoureusement alignés → flux droit).
    assert _route_from_polyline([(0, 5), (8, 5), (14, 5), (20, 5)]) == \
        {"kind": "parametric", "orientation": "hh"}

    # Tracé inexploitable : None, le style garde son défaut.
    assert _route_from_polyline([]) is None
    assert _route_from_polyline([(1, 1)]) is None


def test_simplify_polyline_garde_les_rebroussements():
    # Un sommet où le tracé fait demi-tour n'est PAS colinéaire au sens du dessin :
    # le supprimer gommerait un vrai détour.
    pts = [(0, 0), (20, 0), (10, 0), (10, 15)]
    assert _simplify_polyline(pts) == pts
    # Les doublons et alignements stricts, eux, disparaissent.
    assert _simplify_polyline([(0, 0), (0, 0), (5, 0), (9, 0)]) == [(0, 0), (9, 0)]


def test_read_geometry_absente_ne_leve_pas():
    # Un fichier sans table Diagram doit simplement renoncer a la geometrie,
    # pas faire echouer l'import.
    assert read_geometry({}) is None
    assert read_geometry({"Diagram": [], "Shape": []}) is None
    # Document illisible : meme repli silencieux.
    assert read_geometry({"Diagram": [{"Document": b"pas du NRBF"}]}) is None
    assert read_geometry({"Diagram": [{"Document": "pas du base64 !!"}]}) is None


def test_document_bytes_accepte_les_deux_formats():
    # Le .smfa (SQLite) porte le blob tel quel ; le .zmfa (XML) le porte en base64.
    # C'est la seule difference entre les deux formats de ce point de vue.
    raw = b"\x00\x01\x02\x03"
    assert _document_bytes({"Diagram": [{"Document": raw}]}) == raw
    assert _document_bytes({"Diagram": [{"Document": base64.b64encode(raw).decode()}]}) == raw
    assert _document_bytes({"Diagram": [{"Document": None}]}) is None
    assert _document_bytes({}) is None


def test_parse_stan_sans_geometrie_pose_le_theme_stan():
    import tempfile
    import os
    tmp = tempfile.mkdtemp()
    path = os.path.join(tmp, "mini.smfa")
    _build_minimal_smfa(path)
    result = parse_stan(path)
    assert result["theme"]["id"] == "stan"
    # Pas de palette : STAN n'attribue aucune couleur, et aucune n'est cuite.
    assert result["theme"]["palette"]["node_rule"] == "none"
    assert all("color" not in n["local"] for n in result["nodes"].values())


def _stan_fixtures():
    """Fichiers STAN reels de SankeyData (submodule) — absents d'un checkout nu."""
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    for _ in range(8):
        root = os.path.join(here, "SankeyData", "templates", "other_formats", "data")
        if os.path.isdir(root):
            return sorted(os.path.join(root, f) for f in os.listdir(root)
                          if f.lower().endswith((".smfa", ".zmfa")))
        parent = os.path.dirname(here)
        if parent == here:
            break
        here = parent
    return []


def test_fixtures_stan_reelles():
    """Les vrais fichiers STAN se lisent, avec leur mise en page.

    Ces fixtures sont la seule validation du chemin `read_geometry` : les fichiers
    synthetiques n'ont pas de blob `Diagram.Document`, donc tout ce chemin y est
    court-circuite. Elles sont aussi la seule validation des equerres (`hv` / `vh`),
    que seul BalansSTANcheck-Wastewater.zmfa contient.
    """
    fixtures = _stan_fixtures()
    if not fixtures:
        return  # SankeyData absent : rien a verifier

    seen_orientations = set()
    routed_links = 0
    for path in fixtures:
        result = parse_stan(path)
        assert result["theme"]["id"] == "stan"
        assert result["nodes"], path
        assert result["user_scale"] > 0, path
        for node in result["nodes"].values():
            assert node["x"] == node["x"], path   # pas de NaN
            assert node["y"] == node["y"], path
        for link in result["links"].values():
            orientation = link["local"].get("orientation")
            assert orientation in (None, "hh", "vv", "hv", "vh"), path
            seen_orientations.add(orientation)
            if orientation == "vv":
                # Flux vertical : la valeur reste HORIZONTALE (STAN ne couche
                # jamais ses textes), et le nom s'ecrit a droite du trace.
                assert link["local"].get("value_label_on_path") is False, path
                assert link["local"].get("value_label_vert") == "middle", path
                if _link_has_name(link):
                    assert link["local"].get("name_label_position_absolute") is True, path
                    assert link["local"]["name_label_position_x"] == \
                        link["local"]["name_label_position_x"], path  # pas de NaN
            waypoints = link["local"].get("shape_waypoints")
            if waypoints is not None:
                # Un flux route : au moins 2 points (un detour a 2 coudes), en
                # coordonnees monde finies, et JAMAIS d'orientation concurrente.
                routed_links += 1
                assert len(waypoints) >= 2, path
                assert all(p["x"] == p["x"] and p["y"] == p["y"] for p in waypoints), path
                assert orientation is None, path
        # Aucune couleur cuite dans les noeuds : STAN n'a pas de palette.
        assert all("color" not in n["local"] for n in result["nodes"].values()), path

        # Les noeuds d'import/export sont des ellipses nommees « I » et « E ».
        externals = [n for n in result["nodes"].values() if n["local"].get("shape") == "ellipse"]
        assert all(n["name"] in ("I", "E") for n in externals), path

    # Au moins un fichier a des equerres : sinon on ne teste pas ce qu'on croit.
    assert seen_orientations & {"hv", "vh"}, seen_orientations
    # Et au moins un a des detours (BalansSTANcheck-Wastewater : 23 escaliers h-v-h) :
    # c'est la seule validation du chemin route sur un vrai fichier.
    assert routed_links >= 20, routed_links


def test_fixtures_stan_les_deux_formats_concordent():
    """Le meme diagramme en .smfa et .zmfa doit donner la meme geometrie.

    Le .zmfa porte le MEME blob NRBF, encode en base64 : c'est la seule difference.
    """
    import os
    fixtures = {os.path.splitext(os.path.basename(p))[0]: p for p in _stan_fixtures()}
    smfa = fixtures.get("Example")
    zmfa = fixtures.get("stan_example")
    if not (smfa and zmfa):
        return

    def signature(path):
        d = parse_stan(path)
        return (sorted((n["name"], round(n["x"], 3), round(n["y"], 3)) for n in d["nodes"].values()),
                sorted(link["local"].get("orientation") or "" for link in d["links"].values()),
                sorted(len(link["local"].get("shape_waypoints") or []) for link in d["links"].values()),
                round(d["user_scale"], 6))

    assert signature(smfa) == signature(zmfa)


def test_display_unit_convertit_vers_l_unite_de_la_couche():
    # STAN autorise une unite de saisie par flux mais affiche dans celle de la couche.
    units = {2: {"UnitID": 2, "UnitCode": "kg", "Factor": 1.0, "SiUnitID": 2},
             20: {"UnitID": 20, "UnitCode": "t", "Factor": 1000.0, "SiUnitID": 2}}
    tables = {"DefaultUnit": [{"FlowLayerID": -1, "NumUnitID": 20}]}
    flow_values = [{"MFNumUnitID": 20}, {"MFNumUnitID": 2}]
    assert _display_unit(tables, units, flow_values, 1) == (1000.0, "t")
    # Sans DefaultUnit : on reste en unite SI, comme avant.
    assert _display_unit({}, units, flow_values, 1) == (1.0, None)

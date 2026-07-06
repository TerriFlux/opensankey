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

import gzip
import sqlite3
import xml.etree.ElementTree as ET

try:
    from . import sankey_layout
except Exception:
    try:
        import sankey_layout
    except Exception:
        pass


# Tables/éléments consommés par le pipeline de construction.
_TABLES = (
    "Process", "ProcessInput", "ProcessOutput", "Flow",
    "FlowValue", "Unit", "Period", "FlowLayer",
)

# Champs numériques du XML (tout y est texte, contrairement à SQLite) :
# les identifiants se terminent par "ID", les valeurs/facteurs sont des réels.
_FLOAT_FIELDS = {"MFInput", "MFCalc", "Factor"}


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
    """Lit un .smfa (SQLite) et renvoie {table: [lignes dict]}."""
    con = sqlite3.connect(path)
    try:
        cur = con.cursor()
        return {t: _rows_as_dicts(cur, t) for t in _TABLES}
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
    pin_to_proc = {
        r["ProcessInputID"]: r["ProcessID"]
        for r in tables["ProcessInput"]
    }
    pout_to_proc = {
        r["ProcessOutputID"]: r["ProcessID"]
        for r in tables["ProcessOutput"]
    }
    units = {r["UnitID"]: r for r in tables["Unit"]}

    periods = tables["Period"]
    layers = tables["FlowLayer"]
    if period_id is None and periods:
        period_id = periods[0]["PeriodID"]
    if layer_id is None and layers:
        layer_id = layers[0]["FlowLayerID"]

    # Valeurs (numérateur normalisé en unité SI via Factor) indexées par FlowID
    flow_values = {}
    for fv in tables["FlowValue"]:
        if period_id is not None and fv.get("PeriodID") != period_id:
            continue
        if layer_id is not None and fv.get("FlowLayerID") != layer_id:
            continue
        raw = fv.get("MFInput")
        if raw is None:
            raw = fv.get("MFCalc")  # repli sur la valeur réconciliée
        if raw is None:
            continue
        num_unit = units.get(fv.get("MFNumUnitID"))
        factor = num_unit["Factor"] if num_unit and num_unit.get("Factor") else 1.0
        flow_values[fv["FlowID"]] = raw * factor

    # --- Nœuds : un par processus (frontière incluse pour fidélité) ---
    nodes = {}

    def node_id_for_process(proc_id):
        proc = processes[proc_id]
        name = proc.get("Name") or ("Process %s" % proc_id)
        nid = sankey_layout.normalizeStringToValidId("proc_%s_%s" % (proc_id, name))
        if nid not in nodes:
            nodes[nid] = sankey_layout.create_json_node(nid, name)
        return nid

    def external_node(kind):
        # Un nœud source « Import » et un nœud puits « Export » partagés :
        # les flux de frontière y sont raccordés faute d'extrémité interne.
        name = "Import" if kind == "import" else "Export"
        nid = sankey_layout.normalizeStringToValidId("ext_" + name)
        if nid not in nodes:
            nodes[nid] = sankey_layout.create_json_node(nid, name)
        return nid

    # --- Flux ---------------------------------------------------------
    links = {}
    for fl in tables["Flow"]:
        fid = fl["FlowID"]
        out_id = fl.get("ProcessOutputID")
        in_id = fl.get("ProcessInputID")
        src_proc = pout_to_proc.get(out_id) if out_id is not None else None
        tgt_proc = pin_to_proc.get(in_id) if in_id is not None else None

        src_node = node_id_for_process(src_proc) if src_proc is not None else external_node("import")
        tgt_node = node_id_for_process(tgt_proc) if tgt_proc is not None else external_node("export")

        value = flow_values.get(fid, 0.0)
        new_flow = sankey_layout.create_json_flow(src_node, tgt_node, value, None)
        links[new_flow["id"]] = new_flow

        node_src = nodes[src_node]
        node_tgt = nodes[tgt_node]
        node_src["outputLinksId"].append(new_flow["id"])
        node_src["output_value"] += new_flow["value"]["data_value"]
        node_src["links_order"].append(new_flow["id"])
        node_tgt["inputLinksId"].append(new_flow["id"])
        node_tgt["input_value"] += new_flow["value"]["data_value"]
        node_tgt["links_order"].append(new_flow["id"])

    # --- Réglages par défaut + calcul de positions (réutilise SankeyMATIC)
    setting = _default_setting()
    for node in nodes.values():
        if "color" not in node["local"]:
            node["local"]["color"] = sankey_layout.generate_hexa_color()

    try:
        DA_scale = sankey_layout.computeSankeyPosition(nodes, links, setting)
    except Exception:
        # Positionnement best-effort : si l'algo échoue (graphe dégénéré),
        # on laisse le front relancer un auto-layout.
        DA_scale = 100.0

    return {
        "version": "0.9",
        "nodes": nodes,
        "links": links,
        "user_scale": DA_scale,
        "couleur_fond_sankey": "#ffffff",
        "style_node": {"default": _default_node_style()},
        "style_link": {"default": _default_link_style()},
        "grid_visible": False,
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

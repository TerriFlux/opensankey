// Parseur e!Sankey (ifu Hamburg / iPoint-systems), 100 % côté front.
// Un fichier `.sankey` est un ZIP contenant `esankey.xml` (namespace
// http://www.ifu.com/eSankey/v5.3.0), une signature XML-DSig (ignorée à
// l'import) et un dossier Images/ (vignette + images utilisateur).
//
// Le XML est découpé en trois parties :
// - netModel (logique)  : unitTypes (unités + coefficient), entryGroup/entries
//   (« matériaux » : nom, couleur, unité), graphNodes/graphProcess,
//   graphArrows/graphArrow (from/to + compartments/flow : quantity, entryRef,
//   unitRef). Une flèche peut porter PLUSIEURS flows (matériaux empilés).
// - net (graphique)     : process (position, taille, couleur, label), flèches
//   (géométrie), shapes libres, légende, échelle.
// - logicalGraphicalObjectMapping : liaison logique ↔ graphique par refs.
//
// Produit la même structure JSON (version 0.9) que sankeymaticParser,
// consommée telle quelle par fromJSON, enrichie de `fluxTags` : chaque entry
// e!Sankey devient un tag de flux (groupe unique), et chaque flow d'une
// flèche devient un flux OpenSankey portant ce tag et la couleur de l'entry.
//
// Périmètre : nœuds, flux, valeurs (convergées vers l'unité de base via le
// coefficient), positions/couleurs/visibilité/images des process, couleurs et
// tags par entry, échelle (globale + par unitType, cf. A5), unités sur les
// labels de flux (via le REGISTRE d'unités OS#1286, clé `units` : chaque
// unitType devient une grandeur, chaque flux garde son unité d'origine en
// mode unit_model), labels en pourcentage (format personnalisé
// {PercentProcessSource}/{PercentProcessDestination}, cf. A2), formes de
// process alternatives (shapeType 0/1/2, cf. A4), commentaires de flèche
// (→ tooltips), zones libres texte/image/rectangle (→ zones de texte),
// légende, thème esankey, dégradé le long du flux (OS#1294 :
// gradientFromSource+gradientToDestination → shape_color_rule='gradient',
// couleur du nœud source → couleur du nœud cible). Les jeux de couleurs
// (<colorSets>) sont des <brushColor> à id, résolus par la palette partagée
// (cf. buildBrushColorPalette).
// Hors périmètre (listé sur l'issue #264) : lignes libres, balance labels,
// pourcentages « Arrow »/« Model » (bascule simple
// showPercentage, sans équivalent chez nous — seul le format personnalisé à
// mots-clés {PercentProcessSource}/{PercentProcessDestination} est mappé),
// export.

import JSZip from 'jszip'
import { themeEsankey, Type_ThemeJSON } from '../types/Theme'
import { Type_UnitTypeJSON } from '../types/Units'

type EsLocal = { [k: string]: string | number | boolean }

interface EsNode {
  id: string
  name: string
  svg_parent_group: string
  x: number
  y: number
  u: number
  v: number
  style: string
  local: EsLocal
  tags: Record<string, never>
  dimensions: Record<string, never>
  inputLinksId: string[]
  outputLinksId: string[]
  links_order: string[]
  input_value: number
  output_value: number
  /** Nœud-image (mappé vers icon_is_image/icon_image_src au chargement). */
  is_image?: boolean
  image_src?: string
}

interface EsFlow {
  id: string
  is_visible: boolean
  svg_parent_group: string
  idSource: string
  idTarget: string
  style: string
  local: EsLocal
  displaying_order: number
  tooltip_text: string
  // Ordre des ancres E/S FIGÉ à l'import (cadenas #197 sur les deux bouts) :
  // e!Sankey a déjà rangé les flux autour de chaque nœud, on ne veut pas que le
  // ré-agencement géométrique OpenSankey les réordonne au chargement.
  source_side_locked: boolean
  target_side_locked: boolean
  value: { id: string, data_value: number, tags: { [grp: string]: string[] } }
}

interface EsFluxTag {
  name: string
  selected: boolean
  color: string
}

interface EsFluxTagGroup {
  name: string
  banner: string
  use_colors: boolean
  // SA#285 (fusion) — le groupe des entries PORTE des valeurs : chaque flèche
  // multi-matériaux devient UN flux dont les valeurs sont ventilées par tag
  // (bandes), au lieu de N flux parallèles. Fusionné à la migration au
  // chargement (migrateParallelTaggedLinks), banner 'multi' pour l'éclatement.
  carries_values?: boolean
  tags: { [id: string]: EsFluxTag }
}

// Zone libre e!Sankey (texte, image, rectangle) → « zone de texte » OpenSankey
// (Class_ContainerElement, clé JSON `labels`). Clés 0.9 comprises par
// ContainerPersistence : name/title, is_image/image_src, color/color_visible/
// transparent_border/opacity, label_width/label_height, x/y — plus n'importe
// quel attribut moderne passé tel quel à la racine (name_label_font_size…).
type EsContainerJSON = { [k: string]: string | number | boolean }

export interface EsParsedDiagram {
  version: string
  nodes: { [id: string]: EsNode }
  links: { [id: string]: EsFlow }
  user_scale: number
  couleur_fond_sankey: string
  style_node: { default: EsLocal }
  style_link: { default: EsLocal }
  grid_visible: boolean
  fluxTags: { [id: string]: EsFluxTagGroup }
  theme: Type_ThemeJSON
  /** Zones de texte / images / rectangles importés (clé `labels` du JSON). */
  labels: { [id: string]: EsContainerJSON }
  /**
   * Légende affichée si le fichier en contient une (mask_legend: false).
   * `legend_police` (OS#1296, optionnel) : taille de police du CONTENU de la
   * légende e!Sankey (`<legend><textFont size>`), reprise telle quelle par
   * `LegendPersistence.fromJSON` (clé `legend_police` — seul réglage de police
   * que porte la légende OpenSankey, partagé entre entrées et titres de
   * groupe). La police du TITRE du cadre e!Sankey (`<captionFont>`, le mot
   * "Legend" en en-tête) n'a pas d'équivalent : le cadre généré n'a pas de
   * titre visible (frame.name_label_is_visible = false, cf.
   * LegendGenerator.regenerateLegend) — non reprise.
   */
  legend?: { mask_legend: boolean, legend_dx: number, legend_dy: number, legend_police?: number }
  /** OS#1286 — registre d'unités reconstruit depuis les unitTypes e!Sankey. */
  units?: Type_UnitTypeJSON[]
}

// Id du groupe de tags de flux créé depuis les entries e!Sankey.
export const ESANKEY_ENTRIES_TAGG_ID = 'esankey_entries'

// ---------------------------------------------------------------- Helpers DOM

// Accès par localName : robuste que le document soit servi avec ou sans
// préfixe de namespace (DOMParser navigateur comme jsdom).
const childrenByTag = (el: Element, name: string): Element[] =>
  Array.from(el.children).filter(c => c.localName === name)

const childByTag = (el: Element, name: string): Element | null =>
  childrenByTag(el, name)[0] ?? null

// OS#1291 — refId d'un point de raccordement d'une flèche (<from>/<to>) : le
// premier enfant portant un `refId`, quelle que soit sa balise
// (<graphProcessRef> vers un process, <graphPlaceRef> vers une place). Robuste
// aux variantes de nommage des références de nœud.
const refIdOfEndpoint = (container: Element | null): string | null => {
  if (!container) return null
  for (const c of Array.from(container.children)) {
    const refId = c.getAttribute('refId')
    if (refId !== null) return refId
  }
  return null
}

const attrNum = (el: Element | null, attr: string, fallback: number): number => {
  const raw = el?.getAttribute(attr)
  if (raw === null || raw === undefined) return fallback
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Couleurs e!Sankey : entier ARGB signé 32 bits (ex: -1073774768 = Coral
// avec alpha). On ne garde que le RGB pour la couleur.
const argbToHex = (argb: string | null): string | null => {
  if (argb === null) return null
  const parsed = parseInt(argb, 10)
  if (!Number.isFinite(parsed)) return null
  const rgb = (parsed >>> 0) & 0xFFFFFF
  return '#' + rgb.toString(16).padStart(6, '0').toUpperCase()
}

// e!Sankey encode la transparence dans l'alpha de la couleur d'entry
// (ex. « RGB:70 190 205 (30%) » = 30 % transparent = alpha 178). Chaque entry a
// SA transparence ; comme les bandes n'ont pas d'opacité propre, on APLATIT
// l'alpha dans une couleur RGB équivalente (mélange sur le fond du diagramme) :
// chaque bande obtient ainsi la teinte exacte rendue par e!Sankey, sans
// plomberie d'opacité par bande.
const flattenArgbOverBg = (argb: string | null, bgHex: string): string | null => {
  if (argb === null) return null
  const parsed = parseInt(argb, 10)
  if (!Number.isFinite(parsed)) return null
  const n = parsed >>> 0
  const a = ((n >>> 24) & 0xFF) / 255
  if (a >= 1) return argbToHex(argb) // opaque : rien à mélanger
  const r = (n >>> 16) & 0xFF
  const g = (n >>> 8) & 0xFF
  const b = n & 0xFF
  const bg = parseInt(bgHex.replace('#', ''), 16)
  const br = (bg >> 16) & 0xFF
  const bgg = (bg >> 8) & 0xFF
  const bb = bg & 0xFF
  const mix = (c: number, bc: number) => Math.round(a * c + (1 - a) * bc)
  const out = (mix(r, br) << 16) | (mix(g, bgg) << 8) | mix(b, bb)
  return '#' + out.toString(16).padStart(6, '0').toUpperCase()
}

const normalizeStringToValidId = (text: string): string =>
  'id_' + text.replace(/[^0-9a-zA-Z]+/g, '_')

// Palette de couleurs partagée du document : les entries (et parfois process /
// shapes) ne portent pas toujours un <brushColor argb> en clair — souvent un
// <brushColorRef refId="…"> pointant une <brushColor id="…" argb="…"> définie
// ailleurs (démos « Bus Passengers » p.ex.). On indexe toutes les brushColor
// nommées (avec id) une fois, pour résoudre ces références.
// OS#1294 — les jeux de couleurs (<colorSets>/<colorSet>/<colors>/<brushColor
// id argb>) sont eux aussi de simples <brushColor> à id : ce balayage global les
// capture, donc un <brushColorRef> pointant une couleur de palette est résolu
// sans traitement dédié. Le <colorSetRef> porté par un <unitType> n'est qu'un
// choix de palette par défaut pour la saisie (aucune couleur d'élément à
// résoudre) : il n'est pas exploité à l'import.
type EsBrushPalette = { [id: string]: string }
const buildBrushColorPalette = (root: Element): EsBrushPalette => {
  const out: EsBrushPalette = {}
  Array.from(root.getElementsByTagName('*')).forEach(el => {
    if (el.localName !== 'brushColor') return
    const id = el.getAttribute('id')
    const argb = el.getAttribute('argb')
    if (id && argb !== null) out[id] = argb
  })
  return out
}

// Couleur de remplissage d'un élément : <brushColor argb> direct si présent,
// sinon <brushColorRef refId> résolu via la palette. Renvoie un hex #RRGGBB.
const resolveBrushColorHex = (el: Element | null, palette: EsBrushPalette): string | null => {
  if (!el) return null
  const direct = childByTag(el, 'brushColor')?.getAttribute('argb')
  if (direct !== null && direct !== undefined) return argbToHex(direct)
  const refId = childByTag(el, 'brushColorRef')?.getAttribute('refId')
  if (refId !== null && refId !== undefined && refId in palette) return argbToHex(palette[refId])
  return null
}

// Hachurage e!Sankey → orientation de hachure OpenSankey. Le motif est porté
// par la <brushColor hasPattern="true" pattern="N"> de l'élément ; N suit
// l'enum .NET HatchStyle (0 Horizontal, 1 Vertical, 2 ForwardDiagonal /,
// 3 BackwardDiagonal \). Rendu par shape_hatch (zones de texte, nœuds).
const hatchFromBrush = (el: Element | null): string | null => {
  const bc = el ? childByTag(el, 'brushColor') : null
  if (!bc || bc.getAttribute('hasPattern') !== 'true') return null
  switch (attrNum(bc, 'pattern', -1)) {
    case 0: return 'horizontal'
    case 1: return 'vertical'
    case 2: return 'diagonal'
    case 3: return 'antidiagonal'
    default: return 'diagonal'
  }
}

// ARGB brut d'un élément (direct ou via la palette) — pour en extraire l'alpha
// (opacité), que resolveBrushColorHex écarte.
const resolveBrushArgb = (el: Element | null, palette: EsBrushPalette): string | null => {
  if (!el) return null
  const direct = childByTag(el, 'brushColor')?.getAttribute('argb')
  if (direct !== null && direct !== undefined) return direct
  const refId = childByTag(el, 'brushColorRef')?.getAttribute('refId')
  if (refId !== null && refId !== undefined && refId in palette) return palette[refId]
  return null
}

// OS#1290 — trait pointillé. e!Sankey code le style de trait de deux façons
// selon l'élément :
// - `<penColor … hasPattern="true" Pattern="N">` (bordures de process/shapes,
//   `<rectangle>`/`<line>` dans `parseShapes`) : N=0 solide (vérifié sur le
//   corpus de démos officielles, seule valeur non nulle rencontrée : Pattern="1"
//   sur un `<penColor name="… (LineWidth: 3, Dash)" …>`, confirmant que
//   Pattern!=0 = pointillé). L'attribut Pattern est absent quand hasPattern=false.
// - `<pen … dashStyle="N"><dashPattern length="M" /></pen>` (tracé d'un flux,
//   dans `<arrow><sankeyLink>`) : dashStyle reprend l'énumération .NET
//   System.Drawing.Drawing2D.DashStyle (0=Solid, 1=Dash, 2=Dot, 3=DashDot,
//   4=DashDotDot, 5=Custom — jamais vu !=0 dans le corpus de démos, toutes en
//   trait plein) ; dashStyle=5 (Custom) s'accompagne d'un `<dashPattern>` non
//   vide (length>0) décrivant le motif. On traite les deux comme équivalents :
//   dashStyle!=0 OU dashPattern non vide → pointillé.
const isPenColorPatternDashed = (penColorEl: Element | null): boolean => {
  const pattern = penColorEl?.getAttribute('Pattern')
  if (pattern === null || pattern === undefined) return false
  const n = parseInt(pattern, 10)
  return Number.isFinite(n) && n !== 0
}

const isDashStylePenDashed = (penEl: Element | null): boolean => {
  if (!penEl) return false
  if (attrNum(penEl, 'dashStyle', 0) !== 0) return true
  return attrNum(childByTag(penEl, 'dashPattern'), 'length', 0) > 0
}

// ------------------------------------------------------------- Modèle logique

interface EsUnit { id: string, coefficient: number, name: string, isBasic: boolean }
interface EsUnitType { id: string, name: string, maximumFlow: number, width: number, used: boolean, showUnit: boolean, units: { [id: string]: EsUnit } }
interface EsEntry { name: string, color: string | null, tagId: string }

const parseUnitTypes = (netModel: Element): { [id: string]: EsUnitType } => {
  const out: { [id: string]: EsUnitType } = {}
  const unitTypes = childByTag(netModel, 'unitTypes')
  if (!unitTypes) return out
  childrenByTag(unitTypes, 'unitType').forEach(ut => {
    const units: { [id: string]: EsUnit } = {}
    const unitsEl = childByTag(ut, 'units')
    if (unitsEl) childrenByTag(unitsEl, 'unit').forEach(u => {
      const unit_id = u.getAttribute('id') ?? ''
      units[unit_id] = {
        id: unit_id,
        coefficient: attrNum(u, 'coefficient', 1),
        name: u.getAttribute('name') ?? '',
        isBasic: u.getAttribute('isBasicUnit') === 'true',
      }
    })
    const type_id = ut.getAttribute('id') ?? ''
    out[type_id] = {
      id: type_id,
      name: ut.getAttribute('name') ?? '',
      maximumFlow: attrNum(ut, 'maximumFlow', 0),
      width: attrNum(ut, 'width', 0),
      used: ut.getAttribute('used') === 'true',
      showUnit: ut.getAttribute('showUnit') === 'true',
      units,
    }
  })
  return out
}

// Les entries (matériaux/énergies) peuvent être imbriquées dans des
// entryGroups : aplatissement récursif.
const parseEntries = (entryGroup: Element, out: { [id: string]: EsEntry }, usedTagIds: Set<string>, palette: EsBrushPalette, bgHex: string): void => {
  const entriesEl = childByTag(entryGroup, 'entries')
  if (entriesEl) childrenByTag(entriesEl, 'entry').forEach(entry => {
    const id = entry.getAttribute('id') ?? ''
    const name = entry.getAttribute('name') ?? id
    let tagId = normalizeStringToValidId(name)
    // Deux entries homonymes (groupes différents) : suffixe par l'id XML.
    if (usedTagIds.has(tagId)) tagId = tagId + '_' + id
    usedTagIds.add(tagId)
    out[id] = {
      name,
      // Transparence e!Sankey (alpha) aplatie dans la couleur (mélange sur le
      // fond) : chaque entry a sa propre teinte semi-transparente rendue en
      // couleur solide équivalente.
      color: flattenArgbOverBg(resolveBrushArgb(entry, palette), bgHex),
      tagId,
    }
  })
  const subGroups = childByTag(entryGroup, 'entryGroups')
  if (subGroups) childrenByTag(subGroups, 'entryGroup').forEach(g => parseEntries(g, out, usedTagIds, palette, bgHex))
}

// ----------------------------------------------------------- Partie graphique

interface EsGraphicalProcess {
  x: number
  y: number
  // OS#1298 — Boîte réelle du process (sinon le nœud importé est réduit à un
  // point). Le `<process>` porte `backgroundSizeW/H` (taille du fond) ; l'enfant
  // `<selectionNode boundaryW/H>` donne la même boîte (fallback). Vérifié sur
  // toutes les démos e!Sankey 5 : locationX/Y == backgroundLocationX/Y ==
  // boundaryX/Y (coin haut-gauche) et backgroundSizeW/H == boundaryW/H. La
  // position `x/y` (= locationX/Y) étant donc le COIN haut-gauche de cette
  // boîte, elle reste cohérente avec la sémantique « coin » du JSON 0.9 (pas de
  // node_pos_is_center) : poser la taille ne décale pas le nœud. 0 = inconnue.
  width: number
  height: number
  color: string | null
  labelText: string
  /**
   * Position PROPRE du label du process (e!Sankey stocke un `<label locationX/Y
   * sizeW/H>` déplaçable, souvent décalé du nœud pour se caler sous une icône
   * libre). `labelHasPos` = un locationX est présent ; coordonnées en repère
   * e!Sankey (mêmes unités que x/y du nœud). Sert à poser le name label en mode
   * ABSOLU (indépendant de la hauteur rendue du nœud). NaN/0 si absent.
   */
  labelHasPos: boolean
  labelX: number
  labelY: number
  labelW: number
  labelH: number
  /** `visible='false'` : e!Sankey n'affiche que le label (et l'icône libre à côté). */
  visible: boolean
  /** Chemin dans le ZIP de l'image du process (ex: `Images\\tmpXX.tmp`), sinon ''. */
  imageFile: string
  /**
   * Forme du process (manuel e!Sankey 5 §"Options for Processes", p.45) :
   * 0 = rectangle (défaut), 1 = rectangle arrondi, 2 = ellipse/cercle.
   * Vérifié sur les démos officielles (`shapeType="0|1|2"` sur `<process>`).
   */
  shapeType: number
  /**
   * `arrowDirection` e!Sankey : axe de raccordement des flux à ce nœud/ancre.
   * 2 = horizontal (le flux arrive/part par un CÔTÉ gauche/droite) ; 1 ou 4 =
   * vertical (par le HAUT/BAS). Donne l'orientation OpenSankey d'un flux :
   * [axe du nœud source][axe du nœud cible] (cf. `linkAxis`). Vérifié sur les
   * démos (Bus : In=vh, Out=hv, on-board=hh).
   */
  arrowDirection: number
}

/** Axe de raccordement d'un flux à un nœud, depuis `arrowDirection` e!Sankey. */
const linkAxis = (arrowDirection: number): 'h' | 'v' =>
  (arrowDirection === 1 || arrowDirection === 4) ? 'v' : 'h'

/** Fond blanc / quasi-blanc (WhiteSmoke #F5F5F5, White #FFFFFF…). En e!Sankey
 *  une boîte terminale de cette couleur sert d'ANCRE invisible sur le canevas
 *  (blanc) : le flux s'y raccorde sans qu'aucun rectangle ne soit dessiné. À
 *  l'import, un tel nœud sans image est donc rendu invisible (`shape_visible`
 *  false) plutôt qu'en rectangle bordé. Seuil 0xF0 sur les trois canaux. */
const isNearWhiteFill = (hex?: string | null): boolean => {
  const m = hex ? /^#?([0-9a-fA-F]{6})$/.exec(hex.trim()) : null
  if (!m) return false
  const n = parseInt(m[1], 16)
  return ((n >> 16) & 0xff) >= 0xf0 && ((n >> 8) & 0xff) >= 0xf0 && (n & 0xff) >= 0xf0
}

const parseGraphicalProcesses = (net: Element, palette: EsBrushPalette): { [id: string]: EsGraphicalProcess } => {
  const out: { [id: string]: EsGraphicalProcess } = {}
  const processes = childByTag(net, 'processes')
  if (!processes) return out
  childrenByTag(processes, 'process').forEach(p => {
    const label = childByTag(p, 'label')
    // OS#1298 — taille de la boîte : backgroundSizeW/H sur le <process>, sinon
    // les boundaryW/H de l'enfant <selectionNode> (même valeur ; fallback).
    const selNode = childByTag(p, 'selectionNode')
    const width = attrNum(p, 'backgroundSizeW', attrNum(selNode, 'boundaryW', 0))
    const height = attrNum(p, 'backgroundSizeH', attrNum(selNode, 'boundaryH', 0))
    out[p.getAttribute('id') ?? ''] = {
      x: attrNum(p, 'locationX', 0),
      y: attrNum(p, 'locationY', 0),
      width,
      height,
      color: resolveBrushColorHex(p, palette),
      labelText: (label?.getAttribute('text') ?? '').replace(/\r?\n/g, ' ').trim(),
      labelHasPos: !!label && label.hasAttribute('locationX'),
      labelX: attrNum(label, 'locationX', 0),
      labelY: attrNum(label, 'locationY', 0),
      labelW: attrNum(label, 'sizeW', 0),
      labelH: attrNum(label, 'sizeH', 0),
      visible: p.getAttribute('visible') !== 'false',
      imageFile: childByTag(p, 'image')?.getAttribute('filename') ?? '',
      shapeType: attrNum(p, 'shapeType', 0),
      arrowDirection: attrNum(p, 'arrowDirection', 2),
    }
  })
  return out
}

// -------------------------------------------------- OS#1291 — PLACES (E/S ext.)
// Beaucoup de diagrammes e!Sankey raccordent leurs flux non pas à un
// <graphProcess> mais à une PLACE : point d'entrée/sortie/connexion/stockage
// externe (prototypes <placeInput>/<placeOutput>/<placeConnection>/
// <placeStorage>). Côté GRAPHIQUE (net), ces places vivent dans un conteneur
// <places> frère de <processes> et portent EXACTEMENT le même schéma
// d'attributs qu'un <process> (locationX/Y, visible, shapeType, brushColor,
// image, label). On les parse donc à l'identique et on les FUSIONNE dans le
// dictionnaire des process graphiques (ids uniques dans tout le document) —
// la résolution d'orientation, de couleur et de position s'applique alors aux
// places sans code supplémentaire. Défaut arrowDirection = 0 (les places n'en
// portent pas toujours) → axe horizontal via linkAxis.
const parseGraphicalPlaces = (net: Element, palette: EsBrushPalette): { [id: string]: EsGraphicalProcess } => {
  const out: { [id: string]: EsGraphicalProcess } = {}
  const places = childByTag(net, 'places')
  if (!places) return out
  childrenByTag(places, 'place').forEach(p => {
    const label = childByTag(p, 'label')
    out[p.getAttribute('id') ?? ''] = {
      x: attrNum(p, 'locationX', 0),
      y: attrNum(p, 'locationY', 0),
      color: resolveBrushColorHex(p, palette),
      labelText: (label?.getAttribute('text') ?? '').replace(/\r?\n/g, ' ').trim(),
      labelHasPos: !!label && label.hasAttribute('locationX'),
      labelX: attrNum(label, 'locationX', 0),
      labelY: attrNum(label, 'locationY', 0),
      labelW: attrNum(label, 'sizeW', 0),
      labelH: attrNum(label, 'sizeH', 0),
      visible: p.getAttribute('visible') !== 'false',
      imageFile: childByTag(p, 'image')?.getAttribute('filename') ?? '',
      shapeType: attrNum(p, 'shapeType', 0),
      arrowDirection: attrNum(p, 'arrowDirection', 0),
      // Boîte de la place (OS#1298), même schéma que le process.
      width: attrNum(p, 'backgroundSizeW', 0),
      height: attrNum(p, 'backgroundSizeH', 0),
    }
  })
  return out
}

// ------------------------------------------------- Zones libres et légende

// .NET FontStyle : 1 = gras, 2 = italique (combinables).
const fontStyleBold = (style: number): boolean => (style & 1) !== 0
const fontStyleItalic = (style: number): boolean => (style & 2) !== 0

/** Chemin d'image du XML (`Images\\tmpXX.tmp`) → clé du dict d'images du ZIP. */
const imageKey = (filename: string): string => filename.replace(/\\/g, '/')

// Applique le texte d'un <text> e!Sankey à une zone (base). Le contenu (et son
// multi-ligne) vit en rich-text (name_label_fo_content, un <p> par ligne non
// vide — pas de <br>, qui casse le rendu) ; les champs plats name/name_label_text
// portent le texte SANS \n (un \n y casse l'affichage et l'éditeur). Renvoie
// false si le <text> est vide (rien posé).
const applyTextToContainer = (base: EsContainerJSON, textEl: Element): boolean => {
  const text = (textEl.getAttribute('text') ?? '').replace(/\r\n/g, '\n')
  if (!text.trim()) return false
  const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const oneLine = text.replace(/\s*\n+\s*/g, ' ').trim()
  base.name = oneLine
  base.title = oneLine
  base.name_label_source = 'custom'
  base.name_label_text = oneLine
  base.name_label_is_visible = true
  base.name_label_fo_content = text.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => `<p>${escapeHtml(line)}</p>`).join('')
  const font = childByTag(textEl, 'font')
  if (font) {
    base.name_label_font_size = attrNum(font, 'size', 9)
    const style = attrNum(font, 'style', 0)
    if (fontStyleBold(style)) base.name_label_bold = true
    if (fontStyleItalic(style)) base.name_label_italic = true
  }
  const textColor = argbToHex(textEl.getAttribute('textColor'))
  if (textColor) base.name_label_color = textColor
  return true
}

interface EsShapeBox { el: Element, kind: string, x: number, y: number, w: number, h: number }

/**
 * Shapes libres du `net` → zones de texte OpenSankey (clé JSON `labels`).
 * Mappés : text (texte, police, couleur), picture (image embarquée du ZIP,
 * en data URI), rectangle / roundedRectangle (zone à fond coloré), line (trait
 * décoratif → ligne libre, élément OS#1276).
 *
 * FUSION texte-dans-rectangle : e!Sankey fabrique une « boîte » (p.ex. un profil)
 * en DEUX objets superposés — un rectangle de fond + un texte séparé. Chaque
 * <text> géométriquement contenu dans un <rectangle>/<roundedRectangle> est
 * absorbé par ce rectangle → UNE seule zone (fond + texte), éditable. Sinon le
 * fond, plus grand, recouvre le texte et intercepte les clics.
 */
const parseShapes = (
  net: Element,
  images: { [path: string]: string },
  palette: EsBrushPalette
): { [id: string]: EsContainerJSON } => {
  const out: { [id: string]: EsContainerJSON } = {}
  const shapes = childByTag(net, 'shapes')
  if (!shapes) return out
  // Collecte de tous les shapes graphiques avec leur boîte englobante.
  const items: EsShapeBox[] = []
  childrenByTag(shapes, 'shape').forEach(wrapper => {
    Array.from(wrapper.children).forEach(shape => {
      items.push({
        el: shape, kind: shape.localName,
        x: attrNum(shape, 'locationX', 0), y: attrNum(shape, 'locationY', 0),
        w: attrNum(shape, 'sizeW', 100), h: attrNum(shape, 'sizeH', 30),
      })
    })
  })
  // Appariement texte → plus petit rectangle englobant (tolérance 1 px).
  const isRect = (k: string): boolean => k === 'rectangle' || k === 'roundedRectangle'
  const contains = (r: EsShapeBox, t: EsShapeBox): boolean =>
    t.x >= r.x - 1 && t.y >= r.y - 1 &&
    t.x + t.w <= r.x + r.w + 1 && t.y + t.h <= r.y + r.h + 1
  const textOfRect = new Map<EsShapeBox, EsShapeBox>()
  const absorbed = new Set<EsShapeBox>()
  items.filter(it => it.kind === 'text').forEach(t => {
    const host = items
      .filter(r => isRect(r.kind) && !textOfRect.has(r) && contains(r, t))
      .sort((a, b) => (a.w * a.h) - (b.w * b.h))[0]
    if (host) { textOfRect.set(host, t); absorbed.add(t) }
  })
  let n = 0
  items.forEach(it => {
    if (it.kind === 'text' && absorbed.has(it)) return // fusionné dans son rectangle
    const shape = it.el
    const kind = it.kind
    const id = 'esankey_shape_' + (++n)
    const base: EsContainerJSON = {
      name: '', title: '',
      x: it.x, y: it.y,
      label_width: it.w || 100, label_height: it.h || 30,
      color_visible: false, transparent_border: true,
    }
    if (kind === 'text') {
      if (!applyTextToContainer(base, shape)) return
      out[id] = base
    } else if (kind === 'picture') {
      const file = childByTag(shape, 'image')?.getAttribute('filename') ?? ''
      const src = images[imageKey(file)]
      if (!src) return // image absente du ZIP : rien à afficher
      base.is_image = true
      base.image_src = src
      // `transparency` e!Sankey (0-100) → clé 0.9 `opacity` (%, → shape_opacity).
      const transparency = attrNum(shape, 'transparency', 0)
      if (transparency > 0) base.opacity = Math.max(0, 100 - transparency)
      out[id] = base
    } else if (isRect(kind)) {
      const fill = resolveBrushColorHex(shape, palette)
      if (fill) {
        base.color = fill
        base.color_visible = true
      }
      base.transparent_border = shape.getAttribute('drawBorder') !== 'true'
      const transparency = attrNum(shape, 'transparency', 0)
      if (transparency > 0) base.opacity = Math.max(0, 100 - transparency)
      // OS#1290 — trait pointillé de la bordure (<penColor Pattern="…">).
      if (isPenColorPatternDashed(childByTag(shape, 'penColor'))) base.shape_border_dashed = true
      // Hachurage e!Sankey (<brushColor hasPattern pattern>) → shape_hatch.
      const hatch = hatchFromBrush(shape)
      if (hatch) base.shape_hatch = hatch
      // Texte absorbé (boîte e!Sankey en 2 objets) : le fond porte le texte.
      const t = textOfRect.get(it)
      if (t) applyTextToContainer(base, t.el)
      out[id] = base
    } else if (kind === 'line') {
      // Ligne libre (élément OS#1276, débloque l'import #1266) : trait décoratif.
      // e!Sankey fournit 2 points ; on en tire la boîte englobante + le sens de la
      // diagonale (shape_line_flip), et l'apparence du trait (penColor/width →
      // bordure, qui EST le trait pour shape_type 'line').
      const pts = childByTag(shape, 'points')
      const values = pts ? childrenByTag(pts, 'value') : []
      let x1 = it.x, y1 = it.y, x2 = it.x + it.w, y2 = it.y + it.h
      if (values.length >= 2) {
        x1 = attrNum(values[0], 'X', x1); y1 = attrNum(values[0], 'Y', y1)
        x2 = attrNum(values[values.length - 1], 'X', x2); y2 = attrNum(values[values.length - 1], 'Y', y2)
      }
      const minX = Math.min(x1, x2)
      const minY = Math.min(y1, y2)
      base.x = minX
      base.y = minY
      base.label_width = Math.abs(x2 - x1) || 1
      base.label_height = Math.abs(y2 - y1) || 1
      base.shape_type = 'line'
      // 2 extrémités exactes dans le repère local (boîte normalisée à min=0) —
      // modèle OS#1276b (segment orientable), plus fidèle que la diagonale de boîte.
      base.shape_line_x1 = x1 - minX
      base.shape_line_y1 = y1 - minY
      base.shape_line_x2 = x2 - minX
      base.shape_line_y2 = y2 - minY
      base.color_visible = false
      base.transparent_border = false
      const pen = childByTag(shape, 'penColor')
      const penHex = argbToHex(pen?.getAttribute('argb') ?? null)
      if (penHex) base.shape_border_color = penHex
      const penWidth = attrNum(pen, 'width', 1)
      if (penWidth) base.shape_border_thickness = penWidth
      // OS#1290 — trait pointillé (<penColor Pattern="…">, EST le trait pour
      // shape_type 'line', cf. commentaire plus haut).
      if (isPenColorPatternDashed(pen)) base.shape_border_dashed = true
      out[id] = base
    }
  })
  return out
}

/**
 * Première légende du `net` (hors prototypes). e!Sankey y liste les entries ;
 * côté OpenSankey la légende affiche les tags colorés — nos tags de flux
 * importés y figurent grâce à `use_colors` sur le groupe.
 */
/** Attributs utiles des flèches graphiques (commentaire, réglages du label). */
interface EsGraphicalArrow {
  tooltip: string
  labelVisible: boolean
  showValue: boolean
  showUnit: boolean
  /**
   * Gabarit du label (`sankeyArrowLabel/@labelFormat`) : toujours présent, même
   * hors mode « Custom » (e!Sankey l'auto-génère aussi pour ses modes intégrés,
   * vérifié sur les démos officielles). Sert à repérer les mots-clés
   * `{PercentProcessSource}`/`{PercentProcessDestination}` (cf. A2).
   */
  labelFormat: string
  // ----------------------------------------------------- OS#1287 label (T/P)
  // e!Sankey stocke la mise en forme du label de VALEUR dans le
  // `<sankeyArrowLabel>` graphique (et son enfant `<font>`). Ces champs
  // alimentent la TAILLE, la COULEUR et la POSITION du label côté OpenSankey
  // (cf. boucle de création des flux). Valeurs neutres = « attribut absent »
  // (on ne pose alors rien, le style par défaut décide).
  /** Taille de police du label (`<font>/@size`), 0 = absente. */
  labelFontSize: number
  /** Décalage PERPENDICULAIRE au tracé (`@offsetH`), px signés (0 = absent). */
  labelOffsetH: number
  /** Position LE LONG du tracé (`@segmentPercentage`, 0→100), NaN = absente. */
  labelSegmentPercentage: number
  /** Couleur du texte (`@textColor` argb → hex #RRGGBB), null = absente. */
  labelColor: string | null
  // OS#1288 — COUDE DROIT. Géométrie du tracé portée par le `<sankeyLink>`
  // (enfant du `<arrow>` graphique). e!Sankey trace des coudes quasi à angle
  // droit : un SEGMENT DROIT (px) part de chaque nœud, puis un virage COURT
  // rejoint l'autre bout. Nos flux vh/hv (In/Out) sont, eux, trop arrondis.
  /** `<sankeyLink>` présent : on ne pose la géométrie de coude que dans ce cas. */
  hasSankeyLink: boolean
  /** `sankeyStartSegmentLength` (px) : segment droit avant la courbure côté source. */
  startSegmentLength: number
  /** `sankeyEndSegmentLength` (px) : segment droit avant la courbure côté cible. */
  endSegmentLength: number
  /** `curviness` (px) : rayon/longueur du virage (petit = coude serré). */
  curviness: number
  /** `orthogonal` : tracé à angle droit strict → coude encore plus serré. */
  orthogonal: boolean
  /** `adjustingStyle` : mode d'ajustement e!Sankey (repris pour information). */
  adjustingStyle: string
  // os#1289 — têtes de flèche, portées par `sankeyLink` (enfant de `arrow`,
  // indépendant de `sankeyArrowLabel`) : `toArrow`/`fromArrow` = présence
  // d'une pointe à chaque bout (cible / source). `null` = `sankeyLink` absent
  // (versions/diagrammes sans réglage de pointe explicite) : à distinguer
  // d'un `false` explicite, sous peine d'éteindre à tort la pointe cible par
  // défaut d'OpenSankey (`shape_is_arrow` vaut `true` par défaut, cf.
  // ElementsAttributesConfig) sur des flux qui n'ont simplement pas cette
  // info. `to/fromArrowLength` = PROFONDEUR (px) du chevron cible/source, reprise
  // sur shape_arrow_size / shape_source_notch_size (`null` si absent → défaut 10).
  toArrow: boolean | null
  fromArrow: boolean | null
  toArrowLength: number | null
  fromArrowLength: number | null
  /** OS#1290 — trait pointillé (`sankeyLink/pen@dashStyle` ou `dashPattern`). */
  dashed: boolean
  /**
   * OS#1294 — dégradé le long du flux. Les booléens `gradientFromSource` /
   * `gradientToDestination` sont portés par la flèche GRAPHIQUE (`<arrow>` du
   * `net`, à côté de `drawBorder`). Vrais tous les deux, le flux est un dégradé
   * de la couleur du nœud source à celle du nœud cible (démos « Distribution
   * diagram », « Traffic Visualization », « Efficiency diagram »).
   */
  gradientFromSource: boolean
  gradientToDestination: boolean
}

const parseGraphicalArrows = (net: Element): { [id: string]: EsGraphicalArrow } => {
  const out: { [id: string]: EsGraphicalArrow } = {}
  const arrows = childByTag(net, 'arrows')
  if (!arrows) return out
  childrenByTag(arrows, 'arrow').forEach(a => {
    const label = childByTag(a, 'sankeyArrowLabel')
    const comment = childByTag(a, 'comment')
    // OS#1287 — la taille de police vit dans un enfant `<font>` du label ;
    // offsetH/segmentPercentage/textColor sont des attributs du label lui-même.
    // childByTag/attrNum tolèrent `label`/`labelFont` null (attribut absent).
    const labelFont = label ? childByTag(label, 'font') : null
    // OS#1288 — géométrie du coude portée par le `<sankeyLink>` du `<arrow>`.
    const sankeyLink = childByTag(a, 'sankeyLink')
    // os#1289 — sankeyLink : fromArrow/toArrow (bool) + fromArrowLength/
    // toArrowLength (px = PROFONDEUR du chevron, ce que pilote shape_arrow_size /
    // shape_source_notch_size côté OpenSankey ; la largeur y est auto-calée sur
    // l'épaisseur du flux). On reprend donc ces longueurs à l'import pour coller à
    // la dimension e!Sankey plutôt qu'au défaut OpenSankey (10). *ArrowWidth,
    // *ArrowStyle, *ArrowFilled, *ArrowShaftLength : pas d'équivalent, non lus.
    const toArrow = sankeyLink ? sankeyLink.getAttribute('toArrow') === 'true' : null
    const fromArrow = sankeyLink ? sankeyLink.getAttribute('fromArrow') === 'true' : null
    const toArrowLength = sankeyLink?.hasAttribute('toArrowLength') ? attrNum(sankeyLink, 'toArrowLength', 0) : null
    const fromArrowLength = sankeyLink?.hasAttribute('fromArrowLength') ? attrNum(sankeyLink, 'fromArrowLength', 0) : null
    // OS#1290 — le pen du tracé vit sous <sankeyLink>, pas directement sous
    // <arrow> (qui ne porte qu'un <penColor> de repli, non pointillable).
    const pen = sankeyLink ? childByTag(sankeyLink, 'pen') : null
    out[a.getAttribute('id') ?? ''] = {
      tooltip: (comment?.getAttribute('text') ?? '').replace(/\r\n/g, '\n').trim(),
      labelVisible: label?.getAttribute('visible') !== 'false',
      showValue: label?.getAttribute('showValue') !== 'false',
      showUnit: label?.getAttribute('showUnit') === 'true',
      labelFormat: label?.getAttribute('labelFormat') ?? '',
      labelFontSize: attrNum(labelFont, 'size', 0),
      labelOffsetH: attrNum(label, 'offsetH', 0),
      labelSegmentPercentage: attrNum(label, 'segmentPercentage', NaN),
      labelColor: argbToHex(label?.getAttribute('textColor') ?? null),
      hasSankeyLink: sankeyLink !== null,
      startSegmentLength: attrNum(sankeyLink, 'sankeyStartSegmentLength', 0),
      endSegmentLength: attrNum(sankeyLink, 'sankeyEndSegmentLength', 0),
      curviness: attrNum(sankeyLink, 'curviness', 0),
      orthogonal: sankeyLink?.getAttribute('orthogonal') === 'true',
      adjustingStyle: sankeyLink?.getAttribute('adjustingStyle') ?? '',
      toArrow,
      toArrowLength,
      fromArrowLength,
      fromArrow,
      dashed: isDashStylePenDashed(pen),
      // OS#1294 — dégradé source→cible (lu sur la flèche graphique).
      gradientFromSource: a.getAttribute('gradientFromSource') === 'true',
      gradientToDestination: a.getAttribute('gradientToDestination') === 'true',
    }
  })
  return out
}

// logicalGraphicalObjectMapping/edges : graphArrowRef (logique) → arrowRef
// (graphique), pour retrouver commentaire et réglages de label d'une flèche.
const parseEdgeMapping = (root: Element): { [logicalId: string]: string } => {
  const out: { [logicalId: string]: string } = {}
  const mapping = childByTag(root, 'logicalGraphicalObjectMapping')
  const edges = mapping ? childByTag(mapping, 'edges') : null
  if (!edges) return out
  childrenByTag(edges, 'keyValuePair').forEach(kv => {
    const logical = childByTag(kv, 'graphArrowRef')?.getAttribute('refId')
    const graphical = childByTag(kv, 'arrowRef')?.getAttribute('refId')
    if (logical && graphical) out[logical] = graphical
  })
  return out
}

// Factorisé entre parseLegendPosition et parseLegendFontSize (OS#1296) : la
// première <legend> du `net` hors prototypes.
const findLegendElement = (net: Element): Element | null => {
  const protos = childByTag(net, 'prototypes')
  const all = Array.from(net.getElementsByTagName('*'))
  const inProtos = protos ? new Set(Array.from(protos.getElementsByTagName('*'))) : new Set()
  return all.find(el => el.localName === 'legend' && !inProtos.has(el)) ?? null
}

const parseLegendPosition = (net: Element): { x: number, y: number } | null => {
  const legend = findLegendElement(net)
  if (!legend) return null
  return { x: attrNum(legend, 'locationX', 0), y: attrNum(legend, 'locationY', 0) }
}

/**
 * OS#1296 — taille de police du contenu de la légende (`<legend><textFont
 * size>`, enfant direct — à ne pas confondre avec le `<textFont>` du `<scale>`
 * voisin). `null` si absent (légende sans police explicite, ou sans légende).
 */
const parseLegendFontSize = (net: Element): number | null => {
  const legend = findLegendElement(net)
  const textFont = legend ? childByTag(legend, 'textFont') : null
  if (!textFont) return null
  const size = attrNum(textFont, 'size', NaN)
  return Number.isFinite(size) ? size : null
}

// logicalGraphicalObjectMapping/nodes : graphProcessRef (logique) → processRef
// (graphique). Nécessaire car le nom logique est souvent vide, le nom affiché
// vivant dans le label graphique.
const parseNodeMapping = (root: Element): { [logicalId: string]: string } => {
  const out: { [logicalId: string]: string } = {}
  const mapping = childByTag(root, 'logicalGraphicalObjectMapping')
  const nodes = mapping ? childByTag(mapping, 'nodes') : null
  if (!nodes) return out
  childrenByTag(nodes, 'keyValuePair').forEach(kv => {
    const logical = childByTag(kv, 'graphProcessRef')?.getAttribute('refId')
    const graphical = childByTag(kv, 'processRef')?.getAttribute('refId')
    if (logical && graphical) out[logical] = graphical
  })
  return out
}

// OS#1291 — Mapping des PLACES : les places logiques (<graphPlace>) sont mappées
// vers leur place graphique (<place>) dans la MÊME sous-section <nodes> du
// mapping (une place est un nœud), mais via <graphPlaceRef>/<placeRef> que
// parseNodeMapping ignore. On les récupère ici pour fusionner dans nodeMapping.
const parsePlaceNodeMapping = (root: Element): { [logicalId: string]: string } => {
  const out: { [logicalId: string]: string } = {}
  const mapping = childByTag(root, 'logicalGraphicalObjectMapping')
  const nodes = mapping ? childByTag(mapping, 'nodes') : null
  if (!nodes) return out
  childrenByTag(nodes, 'keyValuePair').forEach(kv => {
    const logical = childByTag(kv, 'graphPlaceRef')?.getAttribute('refId')
    const graphical = childByTag(kv, 'placeRef')?.getAttribute('refId')
    if (logical && graphical) out[logical] = graphical
  })
  return out
}

// -------------------------------------------------------- Styles par défaut

const defaultNodeStyle = (): EsLocal => ({
  shape_visible: true,
  shape: 'rect',
  node_width: 40,
  node_height: 0,
  color: '#D9D9D9',
  colorSustainable: false,
  node_arrow_angle_factor: 30,
  node_arrow_angle_direction: 'right',
  label_visible: true,
  font_family: 'Arial,sans-serif',
  font_size: 14,
  uppercase: false,
  bold: false,
  italic: false,
  label_box_width: 150,
  label_color: false,
  label_vert: 'bottom',
  name_label_vert_shift: 0,
  label_horiz: 'middle',
  name_label_horiz_shift: 0,
  show_value: false,
  value_label_font_family: 'Arial,sans-serif',
  value_font_size: 14,
  value_label_uppercase: false,
  value_label_bold: false,
  value_label_italic: false,
  value_label_box_width: 150,
  value_label_color: false,
  label_vert_valeur: 'top',
  value_label_vert_shift: 0,
  label_horiz_valeur: 'middle',
  value_label_horiz_shift: 0,
  value_label_background: false,
  position: 'absolute',
  label_background: false,
  name: 'Style par default',
})

const defaultLinkStyle = (): EsLocal => ({
  orientation: 'hh',
  left_horiz_shift: 0.05,
  starting_tangeant: 0.3,
  ending_tangeant: 0.3,
  right_horiz_shift: 0.05,
  curvature: 0.5,
  curved: true,
  recycling: false,
  is_structur: false,
  arrow_size: 10,
  label_position: 'middle',
  orthogonal_label_position: 'middle',
  label_on_path: true,
  label_pos_auto: false,
  arrow: true,
  color: '#999999',
  opacity: 0.9,
  dashed: false,
  label_visible: false,
  label_font_size: 20,
  text_color: 'black',
  font_family: 'Arial,sans-serif',
  label_unit_visible: false,
  label_unit: '',
  label_unit_factor: 1,
  to_precision: false,
  scientific_precision: false,
  nb_scientific_precision: 3,
  custom_digit: true,
  nb_digit: 2,
  name: 'Style par default',
})

// ------------------------------------------------------------- Point d'entrée

/**
 * Parse le contenu de `esankey.xml` et renvoie la structure JSON (version 0.9)
 * prête pour fromJSON.
 */
export const parseEsankeyXml = (
  xmlText: string,
  /** Images du ZIP en data URI, indexées par chemin (`Images/tmpXX.tmp`). */
  images: { [path: string]: string } = {}
): EsParsedDiagram => {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const root = doc.documentElement
  if (!root || root.localName !== 'document')
    throw new Error('Fichier e!Sankey invalide : élément <document> attendu dans esankey.xml')
  const netModel = childByTag(root, 'netModel')
  const net = childByTag(root, 'net')
  if (!netModel || !net)
    throw new Error('Fichier e!Sankey invalide : sections netModel/net absentes')

  const unitTypes = parseUnitTypes(netModel)

  // Échelle : un unitType e!Sankey affiche `maximumFlow` (en unité de base) sur
  // `width` pixels. user_scale du front = unités pour 100 px. On retient un
  // unitType de RÉFÉRENCE (le premier `used`) pour l'échelle globale du
  // diagramme, comme avant. A5 — les AUTRES unitTypes ayant leur propre ratio
  // maximumFlow/width (différent de la référence) gardent leur échelle PROPRE :
  // posée en local sur chaque flux concerné (`shape_local_link_scale`,
  // multiplicateur de l'échelle globale — cf. Link.scaleValueToPx), sans toucher
  // à l'échelle globale ni au système de tags d'unité (is_unit) : ce dernier
  // FILTRE/sélectionne un unitType à la fois pour tout le diagramme (comme une
  // vue), il ne superpose pas des échelles indépendantes — inadapté ici, cf.
  // NOTE-ESANKEY-COMPARATIF §2.4.
  const unitTypeOwnScale = (ut: EsUnitType): number => (ut.maximumFlow / ut.width) * 100
  let userScale = 100
  const referenceUnitType = Object.values(unitTypes).find(ut => ut.used && ut.maximumFlow > 0 && ut.width > 0) ?? null
  if (referenceUnitType) userScale = unitTypeOwnScale(referenceUnitType)

  // os#1297 — <scale>/<sectionFactors>/<quantityFactors> (`<net><prototypes>`) :
  // PAS d'échelle supplémentaire, RIEN à mapper. Vérifié sur les 101 démos
  // officielles (e!Sankey 5 demos/) : ce n'est pas un facteur d'échelle global
  // ni un facteur par section, mais le PROTOTYPE (gabarit par défaut, jamais
  // placé sur le canevas — locationX=locationY=0 et absent de <shapes> dans
  // les 101 fichiers) de la légende « Scale » — l'équivalent e!Sankey de notre
  // `display_legend_scale` (cf. NOTE-ESANKEY-COMPARATIF §2.5, ligne « Légende,
  // élément échelle (3 magnitudes) » déjà listée OK). sectionFactors
  // (ex. [0.4, 0.32, 0.28], somme=1) sont les largeurs relatives des 3
  // segments du bandeau ; quantityFactors (ex. [1, 0.2, 0.05]) les fractions
  // de `maximumFlow` affichées sur chacun — mais ces 6 valeurs sont
  // IDENTIQUES dans les 101 démos (constante d'appli, pas dérivée du
  // diagramme), et maximumFlow/width (unitType) sont déjà captés ci-dessus.
  // Aucune info supplémentaire : non mappé, sciemment.

  // Palette de couleurs partagée : résout les <brushColorRef refId> (entries,
  // process, shapes) vers leur <brushColor argb>.
  const brushPalette = buildBrushColorPalette(root)

  // Fond du diagramme (pour aplatir la transparence des couleurs d'entry).
  const bgHex = argbToHex(net.getAttribute('backgroundColor')) ?? '#FFFFFF'

  const entries: { [id: string]: EsEntry } = {}
  const rootEntryGroup = childByTag(netModel, 'entryGroup')
  if (rootEntryGroup) parseEntries(rootEntryGroup, entries, new Set(), brushPalette, bgHex)
  const graphicalProcesses = parseGraphicalProcesses(net, brushPalette)
  // OS#1291 — les places graphiques rejoignent le même dictionnaire (ids
  // uniques) : orientation/couleur/position des flux place↔process réutilisent
  // le code existant sans modification.
  Object.assign(graphicalProcesses, parseGraphicalPlaces(net, brushPalette))
  const graphicalArrows = parseGraphicalArrows(net)
  const nodeMapping = parseNodeMapping(root)
  // OS#1291 — mapping logique→graphique des places, fusionné dans nodeMapping.
  Object.assign(nodeMapping, parsePlaceNodeMapping(root))
  const edgeMapping = parseEdgeMapping(root)

  // Unité (et son unitType) portée par un flow, pour la conversion et le label.
  const findUnit = (unitId: string | null): { unit: EsUnit, unitType: EsUnitType } | null => {
    if (unitId === null) return null
    for (const ut of Object.values(unitTypes)) {
      if (unitId in ut.units) return { unit: ut.units[unitId], unitType: ut }
    }
    return null
  }
  // OS#1286 — registre d'unités du diagramme reconstruit depuis les unitTypes
  // (unité par défaut = unité de base, celle dans laquelle les valeurs sont
  // converties à l'import). Consommé par SankeyPersistence.fromJSON (clé `units`).
  const unitsRegistry: Type_UnitTypeJSON[] = Object.values(unitTypes)
    .filter(ut => Object.keys(ut.units).length > 0)
    .map((ut, i) => ({
      id: ut.id || 'esankey_unit_type_' + i,
      name: ut.name || 'Unités ' + (i + 1),
      default_unit: (Object.values(ut.units).find(u => u.isBasic) ?? Object.values(ut.units)[0]).id,
      units: Object.values(ut.units).map(u => ({ id: u.id, name: u.name, coefficient: u.coefficient })),
    }))

  // Placement du LABEL de nom : e!Sankey donne sa position ABSOLUE (labelX/Y =
  // coin haut-gauche de la boîte de label). Pour que le décalage OpenSankey soit
  // indépendant de la bbox RENDUE du nœud (taille pilotée par les flux, inconnue
  // à l'import), on ancre le label au COIN HAUT-GAUCHE du nœud : horiz='left' +
  // vert='top' + inside → la référence devient l'origine locale du nœud
  // (= node.x/node.y monde), pas son centre. Le décalage vaut alors label − node
  // (coins), exact quelle que soit la taille rendue.
  const applyNameLabelPos = (node: EsNode, graphical: EsGraphicalProcess | null): void => {
    if (!graphical?.labelHasPos) return
    node.local.name_label_horiz = 'left'
    node.local.name_label_inside_horiz = true
    node.local.name_label_vert = 'top'
    node.local.name_label_inside_vert = true
    node.local.name_label_horiz_shift = Math.round(graphical.labelX - node.x)
    node.local.name_label_vert_shift = Math.round(graphical.labelY - node.y)
    // Largeur de la boîte de label depuis e!Sankey (sinon défaut 150).
    if (graphical.labelW > 0) node.local.name_label_box_width = Math.round(graphical.labelW)
    // e!Sankey rend ses labels avec césure (wrapping) dans leur boîte : on
    // active le retour à la ligne + coupure des mots longs pour tenir la largeur.
    node.local.name_label_wrap_long_words = true
    // e!Sankey centre le texte dans sa boîte (alignment 2/32 = TopCenter/Middle
    // Center) : le centre du texte s'aligne alors sur le centre de la boîte (=
    // centre de l'image du nœud). Sinon left-aligné → texte décalé à droite.
    node.local.name_label_text_align = 'middle'
  }

  // Nœuds : un par graphProcess. Nom = nom logique, sinon label graphique.
  const nodes: { [id: string]: EsNode } = {}
  const logicalToNodeId: { [logicalId: string]: string } = {}
  const usedNodeIds = new Set<string>()
  const graphNodes = childByTag(netModel, 'graphNodes')
  const graphProcessList = graphNodes ? childrenByTag(graphNodes, 'graphProcess') : []
  graphProcessList.forEach(gp => {
    const logicalId = gp.getAttribute('id') ?? ''
    const graphical = graphicalProcesses[nodeMapping[logicalId] ?? ''] ?? null
    const name = (gp.getAttribute('name') || graphical?.labelText || 'Process ' + logicalId).trim()
    let id = normalizeStringToValidId(name)
    if (usedNodeIds.has(id)) id = id + '_' + logicalId
    usedNodeIds.add(id)
    logicalToNodeId[logicalId] = id
    nodes[id] = {
      id, name,
      svg_parent_group: 'g_nodes',
      x: graphical?.x ?? 0,
      y: graphical?.y ?? 0,
      u: 0, v: 0,
      style: 'default',
      local: {},
      tags: {},
      dimensions: {},
      inputLinksId: [],
      outputLinksId: [],
      links_order: [],
      input_value: 0,
      output_value: 0,
    }
    if (graphical?.color) nodes[id].local.color = graphical.color
    // OS#1298 — Taille réelle du nœud depuis la boîte du process (sinon un point).
    // node_width/node_height (clés du JSON 0.9) sont mappées vers
    // shape_min_width/shape_min_height (cf. persistenceLegacyKeyMaps) : elles
    // fixent la taille PLANCHER du nœud (getShapeWidthToUse/getShapeHeightToUse
    // renvoient max(shape_min_*, épaisseurs des flux/enveloppe)), donc le nœud
    // n'est jamais plus petit que sa boîte e!Sankey. La boîte ayant pour coin
    // haut-gauche locationX/Y (= x/y déjà posé), aucun décalage : cohérent avec la
    // sémantique « coin » du JSON (pas de node_pos_is_center).
    // Un nœud INVISIBLE (process caché e!Sankey, ou boîte blanche/quasi-blanche
    // sans image = ancre fondue dans le canevas) : on masque forme ET bordure
    // (shape_visible ne masque que le remplissage — NodeDrawShape : fill-opacity ;
    // la bordure suit shape_border_visible, indépendant) ET on ne lui donne AUCUNE
    // largeur/hauteur de boîte. Sinon sa largeur (backgroundSizeW, ex. 133 px pour
    // le process central) écarte la pointe entrante de l'encoche des flux sortants
    // et empêche leur imbrication : c'est l'équivalent de la « Distance » e!Sankey
    // (écart process→flèches) mise à 0/négatif. Un nœud invisible collapse donc à
    // un point, les flux convergent et pointe/encoche s'emboîtent.
    const nodeHidden = (graphical && !graphical.visible) ||
      (graphical?.visible && !graphical.imageFile && isNearWhiteFill(graphical.color))
    if (nodeHidden) {
      nodes[id].local.shape_visible = false
      nodes[id].local.shape_border_visible = false
    } else {
      // OS#1298 — taille de boîte réelle, uniquement pour un nœud VISIBLE.
      if (graphical && graphical.width > 0) nodes[id].local.node_width = graphical.width
      if (graphical && graphical.height > 0) nodes[id].local.node_height = graphical.height
    }
    applyNameLabelPos(nodes[id], graphical)
    // A4 — Forme alternative du process (0 = rect, notre défaut : rien à poser).
    // 1 = rectangle arrondi → on garde 'rect' et on pose un rayon de coin visible
    // (`shape_border_radius`, clé moderne appliquée telle quelle par le loader
    // générique — pas d'équivalent legacy). 2 = ellipse/cercle → `shape_type`.
    // La capsule (forme OpenSankey en plus, cf. NOTE-ESANKEY-COMPARATIF §2.3)
    // n'a pas d'équivalent e!Sankey : jamais ciblée à l'import.
    if (graphical?.shapeType === 1) {
      nodes[id].local.shape_border_radius = 10
    } else if (graphical?.shapeType === 2) {
      nodes[id].local.shape = 'ellipse'
    }
    // Image de process → nœud-image (is_image/image_src à la racine du nœud
    // 0.9, mappés vers icon_is_image/icon_image_src au chargement).
    const imgSrc = graphical?.imageFile ? images[imageKey(graphical.imageFile)] : undefined
    if (imgSrc) {
      nodes[id].is_image = true
      nodes[id].image_src = imgSrc
    }
  })

  // OS#1291 — Nœuds de PLACES : un par <graphPlace> (frère de <graphProcess>
  // dans <graphNodes>). Même construction qu'un process, avec deux différences
  // volontaires reflétant leur rôle de point d'entrée/sortie externe :
  //  - largeur réduite par défaut (`node_width` petit) → « stub » d'E/S, comme
  //    e!Sankey les dessine (petits carrés 48px), à moins de porter une image ;
  //  - visibilité/couleur/forme honorées depuis la place graphique si présente.
  // Le nœud entre dans `logicalToNodeId`/`nodes` : la boucle des flux ci-dessous
  // raccorde alors les flèches place↔process exactement comme process↔process.
  const graphPlaceList = graphNodes ? childrenByTag(graphNodes, 'graphPlace') : []
  graphPlaceList.forEach(gp => {
    const logicalId = gp.getAttribute('id') ?? ''
    // `nodeMapping` inclut désormais les places (cf. parsePlaceNodeMapping) ;
    // repli sur l'id logique si la place graphique partage le même id.
    const graphical = graphicalProcesses[nodeMapping[logicalId] ?? logicalId] ?? null
    const name = (gp.getAttribute('name') || graphical?.labelText || 'Place ' + logicalId).trim()
    let id = normalizeStringToValidId(name)
    if (usedNodeIds.has(id)) id = id + '_' + logicalId
    usedNodeIds.add(id)
    logicalToNodeId[logicalId] = id
    nodes[id] = {
      id, name,
      svg_parent_group: 'g_nodes',
      x: graphical?.x ?? 0,
      y: graphical?.y ?? 0,
      u: 0, v: 0,
      style: 'default',
      local: {},
      tags: {},
      dimensions: {},
      inputLinksId: [],
      outputLinksId: [],
      links_order: [],
      input_value: 0,
      output_value: 0,
    }
    if (graphical?.color) nodes[id].local.color = graphical.color
    // Idem process : masquer forme ET bordure (shape_border_visible indépendant).
    if ((graphical && !graphical.visible) ||
        (graphical?.visible && !graphical.imageFile && isNearWhiteFill(graphical.color))) {
      nodes[id].local.shape_visible = false
      nodes[id].local.shape_border_visible = false
    }
    if (graphical?.shapeType === 1) nodes[id].local.shape_border_radius = 10
    else if (graphical?.shapeType === 2) nodes[id].local.shape = 'ellipse'
    applyNameLabelPos(nodes[id], graphical)
    const imgSrc = graphical?.imageFile ? images[imageKey(graphical.imageFile)] : undefined
    if (imgSrc) {
      nodes[id].is_image = true
      nodes[id].image_src = imgSrc
    } else {
      // Point d'E/S sans image : forme compacte pour ne pas masquer le flux.
      nodes[id].local.node_width = 12
    }
  })

  // Flux : un par flow de compartments (une flèche multi-matériaux e!Sankey
  // devient N flux parallèles même source/cible, chacun tagué par son entry).
  const links: { [id: string]: EsFlow } = {}
  const usedEntryIds = new Set<string>()
  const graphArrows = childByTag(netModel, 'graphArrows')
  const graphArrowList = graphArrows ? childrenByTag(graphArrows, 'graphArrow') : []
  graphArrowList.forEach(ga => {
    const fromEl = childByTag(ga, 'from')
    const toEl = childByTag(ga, 'to')
    // OS#1291 — <from>/<to> peut pointer un process (<graphProcessRef>) OU une
    // place (<graphPlaceRef>) : on lit le refId de n'importe quel enfant <…Ref>
    // présent. `logicalToNodeId` contient désormais process ET places, donc le
    // flux se raccorde des deux côtés sans distinction.
    const fromRef = refIdOfEndpoint(fromEl)
    const toRef = refIdOfEndpoint(toEl)
    const sourceId = logicalToNodeId[fromRef ?? '']
    const targetId = logicalToNodeId[toRef ?? '']
    if (!sourceId || !targetId) return
    const arrowId = ga.getAttribute('id') ?? ''
    const graphicalArrow = graphicalArrows[edgeMapping[arrowId] ?? ''] ?? null
    // Orientation OpenSankey depuis l'`arrowDirection` des nœuds source/cible :
    // axe d'accroche du flux à chaque bout (h = côté, v = haut/bas). Sur les
    // démos : In = vh, Out = hv, flux principal = hh. Défaut 'hh' → non posé.
    const srcProc = graphicalProcesses[nodeMapping[fromRef ?? ''] ?? '']
    const tgtProc = graphicalProcesses[nodeMapping[toRef ?? ''] ?? '']
    const orientation = (srcProc && tgtProc)
      ? linkAxis(srcProc.arrowDirection) + linkAxis(tgtProc.arrowDirection)
      : 'hh'
    const compartments = childByTag(ga, 'compartments')
    const flows = compartments ? childrenByTag(compartments, 'flow') : []
    flows.forEach(flow => {
      const flowId = flow.getAttribute('id') ?? ''
      const quantity = attrNum(flow, 'quantity', 0)
      const found = findUnit(childByTag(flow, 'unitRef')?.getAttribute('refId') ?? null)
      const entry = entries[childByTag(flow, 'entryRef')?.getAttribute('refId') ?? ''] ?? null
      const id = sourceId + '-->' + targetId + '_' + arrowId + '_' + flowId
      const link: EsFlow = {
        id,
        is_visible: true,
        svg_parent_group: 'g_links',
        idSource: sourceId,
        idTarget: targetId,
        style: 'default',
        local: {},
        displaying_order: 0,
        // Ordre des ancres verrouillé des deux côtés : préserve le rangement
        // e!Sankey (cf. interface EsFlow).
        source_side_locked: true,
        target_side_locked: true,
        // Commentaire de la flèche e!Sankey → infobulle du flux.
        tooltip_text: graphicalArrow?.tooltip ?? '',
        value: {
          id: id + '_v',
          data_value: quantity * (found?.unit.coefficient ?? 1),
          tags: {},
        },
      }
      if (entry) {
        link.value.tags[ESANKEY_ENTRIES_TAGG_ID] = [entry.tagId]
        usedEntryIds.add(entry.tagId)
        if (entry.color) link.local.color = entry.color
      }
      if (orientation !== 'hh') link.local.orientation = orientation
      // Label de valeur : MASQUÉ à l'import (décision utilisateur). Chez e!Sankey
      // la quantité appartient à la FLÈCHE (somme de ses matériaux, posée sur un
      // segment) ; la reproduire PAR flux est faux — sur une flèche
      // multi-matériaux chaque flux afficherait SA part et les N valeurs se
      // chevauchent (illisible). On laisse donc les valeurs éteintes ; seul le
      // titre du nœud reste visible. Les réglages de style du label (#1287 :
      // taille/couleur/offset ci-dessous) sont tout de même posés : ils
      // s'appliqueront si l'utilisateur réactive les valeurs à la main. e!Sankey
      // affiche les valeurs TOUJOURS à l'horizontale (jamais sur la tangente).
      link.local.value_label_is_visible = false
      link.local.value_label_on_path = false
      // Unité du label : référence au REGISTRE d'unités (mode unit_model, OS#1286)
      // pointant l'unité D'ORIGINE du flow. data_value étant converti vers l'unité
      // de base, l'affichage re-divise par le coefficient et restitue la quantité
      // saisie dans e!Sankey, avec son symbole.
      // OS#1288 — COUDE DROIT. Reproduit l'allure e!Sankey (segment droit puis
      // virage court), surtout sur les flux In/Out vh/hv trop arrondis chez
      // nous. Modèle OpenSankey du tracé (LinkControlPoints) :
      //  - `left/right_horiz_shift` (= shape_starting/ending_curve, ratio de la
      //    longueur du flux) = SEGMENT DROIT collé à l'ancre avant la courbure ;
      //  - `starting/ending_tangeant` = rayon du virage : PETIT ⇒ coude serré
      //    (notre défaut 0.3 arrondit trop) ;
      //  - `curvature` = courbure générale (secondaire, posée pour cohérence).
      // e!Sankey exprime segment et virage en PIXELS ; on les convertit en
      // ratios via la portée du flux (distance source→cible, invariante par la
      // normalisation de positions faite plus bas).
      if (graphicalArrow?.hasSankeyLink) {
        const span = Math.hypot(
          nodes[targetId].x - nodes[sourceId].x,
          nodes[targetId].y - nodes[sourceId].y,
        ) || 1
        const clamp = (v: number, lo: number, hi: number): number =>
          Math.min(hi, Math.max(lo, v))
        if (graphicalArrow.startSegmentLength > 0) {
          link.local.left_horiz_shift = clamp(graphicalArrow.startSegmentLength / span, 0.01, 0.45)
        }
        if (graphicalArrow.endSegmentLength > 0) {
          link.local.right_horiz_shift = clamp(graphicalArrow.endSegmentLength / span, 0.01, 0.45)
        }
        // Virage court : tangente petite (dérivée de `curviness`, défaut 10 px).
        // `orthogonal` (angle droit strict) ⇒ tangente encore plus serrée.
        const tangent = clamp((graphicalArrow.curviness || 10) / span, 0.02, 0.2)
        const bend = graphicalArrow.orthogonal ? Math.min(tangent, 0.06) : tangent
        link.local.starting_tangeant = bend
        link.local.ending_tangeant = bend
        link.local.curvature = bend
      }
      // os#1289 — têtes de flux e!Sankey (sankeyLink/@toArrow et @fromArrow) :
      //  - @toArrow (côté CIBLE) → pointe classique qui RESSORT (shape_is_arrow,
      //    défaut vrai) ; toArrow=false → pas de pointe cible.
      //  - @fromArrow (côté SOURCE) → e!Sankey ne dessine PAS une pointe qui
      //    ressort mais une « flèche en négatif » : une ENCOCHE en chevron
      //    creusée dans le départ du flux (fromArrowStyle=1) → shape_source_notch.
      // Dimensions : taille par défaut OpenSankey. NOTE : le mode « angle constant »
      // (shape_*_size_ratio, depth ∝ épaisseur) existe dans OpenSankey mais N'EST
      // PAS appliqué à l'import : sur un nœud multi-flux collapsé, une encoche
      // proportionnelle à la bande épaisse creusait un énorme triangle de fond
      // (trou blanc). À recaler prudemment (profondeur plafonnée) avant réactivation.
      if (graphicalArrow?.toArrow === false) link.local.shape_is_arrow = false
      if (graphicalArrow?.fromArrow === true) link.local.shape_source_notch = true
      // OS#1290 — trait pointillé (dashStyle/dashPattern du pen de la
      // sankeyLink) → bordure pointillée du flux.
      if (graphicalArrow?.dashed) link.local.shape_border_dashed = true
      // OS#1294 — dégradé le long du flux. Quand la flèche e!Sankey a À LA FOIS
      // `gradientFromSource` et `gradientToDestination`, le tracé va de la
      // couleur du nœud source à celle du nœud cible : c'est exactement la règle
      // 'gradient' d'OpenSankey (`shape_color_rule`, posée ici via la clé legacy
      // `color_rule` du bloc local → LINK_LOCAL_KEY_MAP → shape_color_rule ;
      // getShapeColorToUse construit alors un linearGradient source→cible à
      // partir des couleurs des deux nœuds). La couleur d'entry reste posée sur
      // `local.color` (elle sert au tag) mais le rendu du flux passe au dégradé.
      // Un dégradé À UN SEUL bout (source→couleur propre du flux, ou l'inverse)
      // n'a pas d'équivalent chez nous : on ne le mappe pas, le flux garde sa
      // couleur plate. Idem pour une flèche multi-matériaux (flux parallèles =
      // multi-links) : getShapeColorToUse ignore le dégradé sur ces flux.
      if (graphicalArrow?.gradientFromSource && graphicalArrow?.gradientToDestination) {
        link.local.color_rule = 'gradient'
      }
      // AUCUN label de valeur posé sur les flux importés (décision user) : chez
      // e!Sankey l'étiquette de quantité appartient à la FLÈCHE (somme de ses
      // matériaux, position sur segment) — la reproduire par flux serait faux ;
      // manque « label agrégé par flèche » listé en #264. On prépare seulement
      // l'unité : si l'utilisateur active les valeurs, elle est déjà correcte.
      // OS#1286 — l'unité est désormais une référence au REGISTRE d'unités
      // (mode unit_model) pointant l'unité D'ORIGINE du flow : data_value étant
      // converti vers l'unité de base, l'affichage re-divise par le coefficient
      // et restitue la quantité saisie dans e!Sankey, avec son symbole.
      if (graphicalArrow?.showUnit && found) {
        link.local.label_unit_visible = true
        link.local.value_label_unit_type = 'unit_model'
        link.local.label_unit = found.unit.id
      }
      // A2 — Labels en pourcentage (format personnalisé à mots-clés, manuel
      // e!Sankey 5 p.34) : {PercentProcessSource} = % de la SORTIE totale du
      // process source, {PercentProcessDestination} = % de l'ENTRÉE totale du
      // process destination. Purement un attribut d'AFFICHAGE
      // (`value_label_unit_type`, calculé à la volée par format_value à partir
      // des sommes d'entrée/sortie des nœuds) : `value_option` n'est PAS touché
      // et reste 'value' — data_value importé demeure la quantité physique
      // réelle (`value_option` en %, lui, ferait traiter data_value comme une
      // contrainte MFA en % et masquerait le flux tant qu'il n'est pas résolu).
      // {PercentArrow} (% au sein de la flèche multi-matériaux) et
      // {PercentModel} (% du plus gros flux du même unitType dans tout le
      // modèle) n'ont pas d'équivalent nœud-relatif chez nous : non mappés.
      const labelFormat = graphicalArrow?.labelFormat ?? ''
      if (labelFormat.includes('{PercentProcessSource}')) {
        link.local.value_label_unit_type = '%OS'
      } else if (labelFormat.includes('{PercentProcessDestination}')) {
        link.local.value_label_unit_type = '%ID'
      }
      // OS#1287 — TAILLE, COULEUR et POSITION du label de VALEUR, repris du
      // `<sankeyArrowLabel>` graphique de la flèche (retrouvé via edgeMapping).
      // On ne DÉCIDE PAS ici de la visibilité du label (arbitrée ailleurs, selon
      // la stratégie e!Sankey « l'étiquette appartient à la flèche ») : on se
      // contente, quand la flèche affiche sa valeur (`showValue`), de préparer la
      // mise en forme pour qu'un label activé soit fidèle — sinon le style par
      // défaut impose une police trop grosse (~20 px) et un placement générique.
      if (graphicalArrow && graphicalArrow.showValue !== false) {
        // TAILLE de police (<font size>). Absente (0) → le style décide.
        if (graphicalArrow.labelFontSize > 0) {
          link.local.value_label_font_size = graphicalArrow.labelFontSize
        }
        // COULEUR du texte (argb → hex).
        if (graphicalArrow.labelColor) {
          link.local.value_label_color = graphicalArrow.labelColor
        }
        // POSITION LE LONG du tracé (segmentPercentage : 0 = près de la source,
        // 100 = près de la cible). e!Sankey affiche la valeur À PLAT, hors tracé
        // (jamais sur la tangente) : il n'existe alors pas d'attribut « % le long
        // du chemin » côté OpenSankey — l'axe le long du flux est piloté par
        // value_label_horiz (left = source, middle = centre, right = cible ; cf.
        // Class_LinkLabelDrawer.getLabelPos, off-path). On approxime par tiers ;
        // couvre les flux In/Out (vh/hv) dont e!Sankey colle le label près du nœud.
        if (Number.isFinite(graphicalArrow.labelSegmentPercentage)) {
          const seg = graphicalArrow.labelSegmentPercentage
          link.local.value_label_horiz = seg < 33 ? 'left' : seg > 66 ? 'right' : 'middle'
        }
        // DÉCALAGE PERPENDICULAIRE au tracé (offsetH) : côté du flux où poser le
        // label. offsetH >= 0 → sous le flux horizontal (value_label_vert =
        // 'bottom'), < 0 → au-dessus ('top'). Seul le CÔTÉ est repris : OpenSankey
        // réserve déjà un écart perpendiculaire hors tracé (demi-épaisseur +
        // police) ; reporter l'amplitude d'offsetH en vert_shift éloignerait trop
        // le label (double comptage) — approximation assumée, cf. #1287.
        if (graphicalArrow.labelOffsetH !== 0) {
          link.local.value_label_vert = graphicalArrow.labelOffsetH >= 0 ? 'bottom' : 'top'
        }
      }
      // A5 — échelle indépendante par unitType (cf. calcul de `userScale` plus
      // haut) : ce flux appartient à un unitType dont le ratio
      // maximumFlow/width diffère de la référence du diagramme → échelle
      // locale (multiplicateur) plutôt que l'échelle globale.
      if (found && found.unitType.maximumFlow > 0 && found.unitType.width > 0) {
        const ownScale = unitTypeOwnScale(found.unitType)
        if (Math.abs(ownScale - userScale) > 1e-9) {
          link.local.shape_local_link_scale = ownScale / userScale
        }
      }
      links[id] = link
      nodes[sourceId].outputLinksId.push(id)
      nodes[sourceId].output_value += link.value.data_value
      nodes[sourceId].links_order.push(id)
      nodes[targetId].inputLinksId.push(id)
      nodes[targetId].input_value += link.value.data_value
      nodes[targetId].links_order.push(id)
    })
  })

  // Zones libres (textes, images, rectangles) et légende.
  const labels = parseShapes(net, images, brushPalette)
  const legendPos = parseLegendPosition(net)
  const legendFontSize = parseLegendFontSize(net) // OS#1296

  // Normalisation des positions : e!Sankey stocke des coordonnées de document
  // potentiellement lointaines de l'origine ; on ramène le coin haut-gauche de
  // l'ensemble (nœuds + zones libres + légende) vers (50, 50).
  const nodeList = Object.values(nodes)
  const containerList = Object.values(labels)
  const allX = [...nodeList.map(n => n.x), ...containerList.map(c => c.x as number), ...(legendPos ? [legendPos.x] : [])]
  const allY = [...nodeList.map(n => n.y), ...containerList.map(c => c.y as number), ...(legendPos ? [legendPos.y] : [])]
  if (allX.length > 0) {
    const dx = 50 - Math.min(...allX)
    const dy = 50 - Math.min(...allY)
    nodeList.forEach(n => { n.x += dx; n.y += dy })
    containerList.forEach(c => { c.x = (c.x as number) + dx; c.y = (c.y as number) + dy })
    if (legendPos) { legendPos.x += dx; legendPos.y += dy }
  }

  // (Échelle globale `userScale` déjà calculée plus haut, avant les flux — A5.)

  // Groupe de tags de flux : une entry = un tag (nom + couleur e!Sankey).
  // Seules les entries réellement portées par un flux sont conservées.
  const fluxTags: { [id: string]: EsFluxTagGroup } = {}
  const usedEntries = Object.values(entries).filter(e => usedEntryIds.has(e.tagId))
  if (usedEntries.length > 0) {
    const tags: { [id: string]: EsFluxTag } = {}
    usedEntries.forEach(e => {
      tags[e.tagId] = { name: e.name, selected: true, color: e.color ?? '#888888' }
    })
    // `use_colors` : les tags portent les couleurs des entries → ils
    // apparaissent dans la légende, et la colormap coïncide avec les couleurs
    // déjà posées sur les flux.
    // SA#285 (fusion) — banner 'multi' + porteur de valeurs : après la fusion
    // des flux parallèles au chargement, la flèche multi-matériaux s'affiche en
    // UN flux dont l'épaisseur est ventilée en bandes (une par entry).
    fluxTags[ESANKEY_ENTRIES_TAGG_ID] = { name: 'Flux e!Sankey', banner: 'multi', use_colors: true, carries_values: true, tags }
  }

  const backgroundColor = argbToHex(net.getAttribute('backgroundColor')) ?? '#FFFFFF'

  // Thème e!Sankey posé sur le diagramme importé (repris par loadTheme au
  // fromJSON), avec le fond du fichier plutôt que le blanc par défaut du thème.
  const theme: Type_ThemeJSON = {
    ...themeEsankey().toJSON(),
    globals: { couleur_fond_sankey: backgroundColor },
  }

  // Le patch du thème est FUSIONNÉ dans les styles écrits au fichier : à la
  // lecture, `loadTheme` ne l'applique pas (le fichier fait autorité, cf.
  // NOTE-THEMES.md) — même recette que l'importeur STAN (stan_smfa). Les clés
  // du patch portent des noms d'attributs modernes, recopiés verbatim par
  // StylePersistence ; c'est notamment lui qui éteint les labels de valeur
  // (value_label_is_visible: false), que l'amorce interne de LinkStyle
  // allumerait sinon pour tous les flux.
  const result: EsParsedDiagram = {
    version: '0.9',
    nodes,
    links,
    user_scale: userScale,
    couleur_fond_sankey: backgroundColor,
    style_node: { default: { ...defaultNodeStyle(), ...theme.styles.NodeStyle } },
    style_link: { default: { ...defaultLinkStyle(), ...theme.styles.LinkStyle } },
    grid_visible: false,
    fluxTags,
    theme,
    labels,
  }
  if (legendPos) {
    result.legend = { mask_legend: false, legend_dx: legendPos.x, legend_dy: legendPos.y }
    // OS#1296 — police du contenu de la légende (`legend_police`, lue telle
    // quelle par LegendPersistence.fromJSON via la clé `legend` du JSON 0.9).
    if (legendFontSize !== null) result.legend.legend_police = legendFontSize
  }
  // OS#1286 — registre d'unités (grandeurs e!Sankey), lu par fromJSON.
  if (unitsRegistry.length > 0) {
    result.units = unitsRegistry
  }
  return result
}

// ---------------------------------------------------------------- Dézippage

// Signature d'image → type MIME du data URI (les images du ZIP sont stockées
// sous des noms neutres `Images/tmpXX.tmp`, l'extension ne dit rien).
const mimeFromMagic = (base64: string): string => {
  if (base64.startsWith('iVBOR')) return 'image/png'
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  if (base64.startsWith('Qk')) return 'image/bmp'
  // TIFF (II*\0 little-endian = 'SUkq…', MM\0* big-endian = 'TU0A…'). NB : les
  // navigateurs ne savent PAS afficher le TIFF nativement (image cassée sans
  // décodeur JS) — mais on émet le bon type MIME plutôt que du faux PNG.
  if (base64.startsWith('SUkq') || base64.startsWith('TU0A')) return 'image/tiff'
  return 'image/png'
}

/**
 * Dézippe un fichier `.sankey` (e!Sankey) et parse son `esankey.xml`, en
 * extrayant les images embarquées (icônes, décors) en data URIs.
 * La signature XML-DSig embarquée n'est pas vérifiée (lecture seule).
 */
export const loadEsankeyFile = async (data: ArrayBuffer): Promise<EsParsedDiagram> => {
  const zip = await JSZip.loadAsync(data)
  const xmlFile = zip.file('esankey.xml')
  if (!xmlFile)
    throw new Error('Fichier e!Sankey invalide : esankey.xml absent de l\'archive')
  const images: { [path: string]: string } = {}
  await Promise.all(
    zip.file(/^Images\//)
      .filter(f => f.name !== 'Images/preview.png')
      .map(async f => {
        const base64 = await f.async('base64')
        images[f.name] = 'data:' + mimeFromMagic(base64) + ';base64,' + base64
      })
  )
  return parseEsankeyXml(await xmlFile.async('string'), images)
}

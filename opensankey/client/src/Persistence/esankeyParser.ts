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
// mode unit_model), format numérique des valeurs (unitType@displayFormat,
// format .NET → nombre de décimales par flux, cf. netFormatDecimalCount,
// os#1304), labels en pourcentage (format personnalisé
// {PercentProcessSource}/{PercentProcessDestination}, cf. A2 ; % intégré
// showPercentage=2 = {PercentModel}, reproduit statiquement via unit_factor),
// formes de process alternatives (shapeType 0/1/2, cf. A4), commentaires de
// flèche (→ tooltips), zones libres texte/image/rectangle (→ zones de texte),
// légende, masquage des zéros (net@hideZeroFlows/@hideZeroFlowProcesses,
// cf. os#1306 : le défaut OpenSankey masque déjà, on ne pose `show_zero_links`
// que pour les DÉSACTIVER fidèlement), thème esankey, dégradé le long du flux (OS#1294 :
// gradientFromSource+gradientToDestination → shape_color_rule='gradient',
// couleur du nœud source → couleur du nœud cible). Les jeux de couleurs
// (<colorSets>) sont des <brushColor> à id, résolus par la palette partagée
// (cf. buildBrushColorPalette).
// Hors périmètre (listé sur l'issue #264) : lignes libres, balance labels,
// pourcentage « Arrow » (part du flux au sein de sa flèche multi-matériaux,
// sans équivalent chez nous), label agrégé par flèche multi-matériaux (les
// valeurs de ces flèches restent éteintes), export.

import JSZip from 'jszip'
import { themeEsankey, Type_ThemeJSON } from '../types/Theme'
import { Type_UnitTypeJSON } from '../types/Units'

// opensankey#1301 — la valeur peut aussi être un tableau de points (shape_waypoints).
type EsLocal = { [k: string]: string | number | boolean | Array<{ x: number, y: number }> }

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
  /** OS#1292 — Donnée de stock du process (compartiments `<stock>`). Clés lues
   *  telles quelles au niveau nœud par le loader générique. La REPRÉSENTATION
   *  visible est le LIBELLÉ de stock (stock_label_*, posé dans local), pas la
   *  forme stock (qui encode un niveau, absent du format e!Sankey). La
   *  représentation en flux « From/To Stock » façon e!Sankey = OS#1303. */
  has_stock?: boolean
  stock_values?: { stock_variation: number }
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
  // SA#294 — cadenas d'ancre (#197). Posé à false : on préfère l'auto-positionnement
  // dynamique d'OpenSankey (le rangement e!Sankey était mal reconstitué à l'import et
  // le figer produisait des inversions selon vh/hv).
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
  /**
   * os#1305 — « Scale to lower flow threshold » e!Sankey
   * (`scaleToLowerFlowTreashold` + `lowerFlowTreashold`, unitType de référence
   * ou miroir `<net>`) : épaisseur visible MINIMALE des flux fins, en px —
   * même sémantique que le `minimum_flux` de la drawing area (clamp de rendu,
   * cf. flowThickness.fluxFloor), d'où la recopie directe sans conversion
   * d'échelle. Clé racine `minimum_flux` du JSON 0.9, lue par le fromJSON
   * générique. Absent quand le fichier n'active pas le réglage.
   */
  minimum_flux?: number
  /**
   * Ordre Z global des éléments importés (nœuds + flux + zones), du 1ER PLAN
   * vers le FOND (convention `_list_g_element_id`), reconstruit depuis les
   * `@zorder` e!Sankey (plus grand = par-dessus). C'est lui qui restitue les
   * fonds de process DERRIÈRE les flux (démo « Erdgas Krankenhaus »). Lu par
   * le fromJSON générique (clé `order_g_elements`). Absent si le fichier ne
   * porte aucun zorder.
   */
  order_g_elements?: string[]
  /**
   * os#1306 — posé à `true` quand le fichier N'ACTIVE PAS `net@hideZeroFlows`
   * (défaut e!Sankey : les flux à quantité nulle restent tracés en trait fin).
   * Clé racine du drawing_area (option globale « flux nuls visibles »), lue par
   * le fromJSON générique. Absent quand hideZeroFlows=true : le défaut
   * OpenSankey (`show_zero_links=false` + porte `is_not_zero`) masque déjà
   * dynamiquement les flux nuls ET les nœuds dont tous les flux sont nuls
   * (= hideZeroFlowProcesses). Détail du choix : cf. le bloc os#1306 dans
   * parseEsankeyXml.
   */
  show_zero_links?: boolean
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

// Tailles de police : e!Sankey (.NET) exprime `<font size>` en POINTS
// typographiques (pt, 1/72") — vérifié : tous les `<font>` du corpus portent
// `unit="3"` (GraphicsUnit.Point). OpenSankey rend `font_size` en PIXELS CSS
// (1/96"). Sans conversion, un « 12 » e!Sankey (= 16 px réels) devient un
// « 12 px » et le texte importé est ~25 % trop petit. Facteur 96/72 = 4/3.
// 0 (absent) reste 0 pour ne pas déclencher les gardes `> 0`.
const PT_TO_PX = 96 / 72
const ptToPx = (pt: number): number => pt > 0 ? Math.round(pt * PT_TO_PX) : pt

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

// OS#1292 — Alpha d'une couleur ARGB (0 = totalement transparente, 255 =
// opaque). Sert à repérer les entries « Transparent » (astuce e!Sankey pour
// équilibrer un process sans rien dessiner).
const argbAlpha = (argb: string | null): number => {
  if (argb === null) return 255
  const parsed = parseInt(argb, 10)
  if (!Number.isFinite(parsed)) return 255
  return ((parsed >>> 0) >>> 24) & 0xFF
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
// os#1305 — scaleToLowerFlowTreashold/lowerFlowTreashold : « Scale to lower
// flow threshold », plancher d'épaisseur des flux fins (cf. calcul de
// `minimumFlux` dans parseEsankeyXml pour la sémantique établie sur corpus).
interface EsUnitType { id: string, name: string, maximumFlow: number, width: number, used: boolean, showUnit: boolean, displayFormat: string, scaleToLowerFlowTreashold: boolean, lowerFlowTreashold: number, units: { [id: string]: EsUnit } }

// os#1304 — Format numérique .NET du unitType (`displayFormat`) → nombre de
// décimales. Grammaire .NET : `0` = chiffre forcé, `#` = chiffre optionnel,
// `.` = début des décimales, `,` = séparateur de milliers (toujours AVANT le
// point). Le nombre de décimales = nombre de placeholders (0/#) après le point.
// Corpus des démos : `0`→0, `0.#`/`0.0`/`#,0.#`→1, `0.00`/`0.##`/`#,#.##`/
// `0,0.00`→2. null = pas de format déclaré (on laisse les défauts OpenSankey).
export const netFormatDecimalCount = (fmt: string): number | null => {
  if (!fmt) return null
  const dot = fmt.indexOf('.')
  if (dot < 0) return 0
  return (fmt.slice(dot + 1).match(/[0#]/g) ?? []).length
}
interface EsEntry { name: string, color: string | null, tagId: string, isTransparent: boolean }

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
      displayFormat: ut.getAttribute('displayFormat') ?? '',
      scaleToLowerFlowTreashold: ut.getAttribute('scaleToLowerFlowTreashold') === 'true',
      lowerFlowTreashold: attrNum(ut, 'lowerFlowTreashold', 0),
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
    const brush = resolveBrushArgb(entry, palette)
    out[id] = {
      name,
      // Transparence e!Sankey (alpha) aplatie dans la couleur (mélange sur le
      // fond) : chaque entry a sa propre teinte semi-transparente rendue en
      // couleur solide équivalente.
      color: flattenArgbOverBg(brush, bgHex),
      tagId,
      // OS#1292 — alpha 0 : entry invisible (élément « Transparent » servant à
      // équilibrer un process). Sa DONNÉE compte, son rendu non.
      isTransparent: argbAlpha(brush) === 0,
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
  /** `<label visible='false'>` : e!Sankey masque le NOM du process (démos
   *  « Efficiency diagram example » : tous les process du bloc central). Absent
   *  = visible. Indépendant de `visible` (qui masque la BOÎTE, pas le nom). */
  labelVisible: boolean
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
  // Mise en forme du label de NOM du process (`<label><font>` + `@textColor`).
  // e!Sankey met souvent ces titres en gras (démos « Bus Passengers » : tous les
  // process/places en style="1"). Sans ces champs, le nom importé retombait sur le
  // style OpenSankey par défaut (maigre) alors qu'il était gras chez e!Sankey.
  // Neutres = « absent » (on ne pose rien, le style par défaut décide).
  /** `<label><font>/@style` gras (bit 1 de FontStyle .NET). */
  labelBold: boolean
  /** `<label><font>/@style` italique (bit 2). */
  labelItalic: boolean
  /** Taille de police du nom (`<label><font>/@size`), 0 = absente. */
  labelFontSize: number
  /** Couleur du texte du nom (`<label>/@textColor` argb → hex), null = absente. */
  labelColor: string | null
  /**
   * Écart d'accroche des flux = « Distance » e!Sankey, portée par les `<port>`
   * enfants DIRECTS du process/place (attribut `nodePadding`, souvent négatif :
   * -8, -30, -80…). Négatif = les flèches RENTRENT dans la boîte (les flux
   * entrants/sortants se rejoignent à travers le nœud). Un process peut avoir
   * plusieurs ports : on retient le plus PROFOND (nodePadding minimal). 0 si aucun
   * port ou tous à 0. Mappé vers `shape_link_inset = -linkPadding` (OpenSankey :
   * positif = vers l'intérieur, cf. NODE_SHAPE_SPECIFIC_CONFIG).
   */
  linkPadding: number
  /**
   * Bordure du process : `<penColor argb width Pattern>` (« Nom/couleur »,
   * « Largeur » et « Style du trait » de la boîte de dialogue e!Sankey). e!Sankey
   * varie ces largeurs par nœud (Bus : width 1 ET 3) ; ignorées, tous les nœuds
   * importés retombaient sur la bordure par défaut (3px pointillés). borderWidth
   * 0 = pas de trait (bordure masquée). borderColor null si absent.
   */
  borderColor: string | null
  borderWidth: number
  borderDashed: boolean
  /**
   * Ordre Z GLOBAL de l'élément (`@zorder` sur `<process>`/`<arrow>`/shapes du
   * `net`) : entier unique par document, PLUS GRAND = dessiné PAR-DESSUS. C'est
   * lui qui met les fonds de process DERRIÈRE les flux (démo « Erdgas
   * Krankenhaus » : process 0-8, flèches 9-20 — sauf un cache translucide
   * volontairement posé sur les flux, zorder 17). -1 = absent (les `<place>`
   * n'en portent jamais, vérifié sur les 120 démos).
   */
  zorder: number
}

/** Axe de raccordement d'un flux à un nœud, depuis `arrowDirection` e!Sankey. */
const linkAxis = (arrowDirection: number): 'h' | 'v' =>
  (arrowDirection === 1 || arrowDirection === 4) ? 'v' : 'h'

/**
 * opensankey#1301 — orientation (hh/vv/hv/vh) déduite de la polyligne du tracé : axe du
 * 1er segment (source) + axe du dernier segment (cible). Bien plus fiable que
 * `arrowDirection`. Utilisée pour les flux PARAMÉTRIQUES (non routés) ; les flux routés
 * l'ignorent. `null` si trop peu de points / segments dégénérés (→ repli arrowDirection).
 */
const orientationFromPoints = (points: Array<{ x: number, y: number }>): string | null => {
  const n = points.length
  if (n < 2) return null
  const axisOf = (a: { x: number, y: number }, b: { x: number, y: number }): 'h' | 'v' | null => {
    const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y)
    if (dx < 1e-6 && dy < 1e-6) return null
    return dx >= dy ? 'h' : 'v'
  }
  const src = axisOf(points[0], points[1])
  const tgt = axisOf(points[n - 2], points[n - 1])
  if (!src || !tgt) return null
  return src + tgt
}

/**
 * opensankey#1301 — un flux est ROUTÉ si sa polyligne fait un DÉTOUR, détecté par
 * l'une OU l'autre de ces deux signatures :
 *  1. au moins DEUX coudes QUASI-orthogonaux (segment quasi-horizontal rencontrant
 *     un quasi-vertical). « Quasi » : e!Sankey stocke des points de la route arrondie,
 *     pas des coins parfaits — sur le corpus (Petroleum) les segments « verticaux »
 *     des détours dérivent de 8 à 22 px en x, quand les segments milieu des S-curves
 *     paramétriques dérivent d'au moins 42 px. D'où une tolérance transversale
 *     ABSOLUE (30 px, entre les deux populations) plutôt qu'angulaire : un seuil
 *     d'angle happait les S-curves raides (milieu long presque vertical).
 *  2. un REBROUSSEMENT : la progression en x (ou y) s'inverse entre deux segments
 *     significatifs (≥ 10 px, pour ignorer la dérive des quasi-verticaux) — le flux
 *     revient sur ses pas (droite, remonte, revient à gauche), exactement le détour
 *     qui exige des waypoints même quand un segment milieu est franchement diagonal
 *     (Petroleum : Refined Products Imports → Transportation, un seul coude compté).
 * UN seul coude sans rebroussement = simple élan HV/VH paramétrique : NON routé.
 * Indépendant du nombre de points (un détour tient en 4 points : source, coin, coin,
 * cible). Un segment milieu diagonal (flux droit/courbe simple) ne compte pas comme
 * coude et ne fait rien tourner.
 */
/** Dérive transversale max (px) pour qu'un segment compte comme quasi-axial. */
const ROUTED_CROSS_TOL = 30

/** Axe d'un segment de polyligne e!Sankey, avec la tolérance transversale ci-dessus. */
const routedSegAxis = (a: { x: number, y: number }, b: { x: number, y: number }): 'h' | 'v' | 'd' => {
  const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y)
  if (dx < 2 && dy < 2) return 'd' // dégénéré
  if (dy <= ROUTED_CROSS_TOL && dy <= dx) return 'h'
  if (dx <= ROUTED_CROSS_TOL && dx <= dy) return 'v'
  return 'd' // diagonal
}

const isRoutedPolyline = (points: Array<{ x: number, y: number }>): boolean => {
  const minSeg = 10 // px — delta significatif pour le test de rebroussement
  let turns = 0
  for (let i = 1; i < points.length - 1; i++) {
    const inSeg = routedSegAxis(points[i - 1], points[i])
    const outSeg = routedSegAxis(points[i], points[i + 1])
    if ((inSeg === 'h' && outSeg === 'v') || (inSeg === 'v' && outSeg === 'h')) turns++
  }
  if (turns >= 2) return true
  // Rebroussement sur x ou y parmi les deltas significatifs.
  for (const axis of ['x', 'y'] as const) {
    let prevSign = 0
    for (let i = 1; i < points.length; i++) {
      const d = points[i][axis] - points[i - 1][axis]
      if (Math.abs(d) < minSeg) continue
      const sign = d > 0 ? 1 : -1
      if (prevSign !== 0 && sign !== prevSign) return true
      prevSign = sign
    }
  }
  return false
}

/**
 * Rectifie la polyligne d'un flux ROUTÉ en ses COINS à 90°. La route e!Sankey est
 * arrondie : un « montant vertical » y est stocké en plusieurs segments qui dérivent
 * de quelques px (Petroleum : x = 984 → 1000 → 992). Repris tels quels en waypoints,
 * ces sommets font dessiner au runtime (segments droits + congés) des mini-S qui
 * repartent en arrière à chaque coin. On fusionne donc les chaînes de segments
 * quasi-axiaux DE MÊME SENS en un run H/V exact (coordonnée = moyenne des points du
 * run) et on n'émet que les intersections de runs consécutifs — les vrais coins.
 * Les segments diagonaux restent des runs à part entière : leurs jonctions sont
 * conservées (recalées sur la coordonnée du run axial voisin). Retourne les coins
 * INTÉRIEURS (sans les ancres), en coordonnées document e!Sankey.
 */
const rectifyRoutedWaypoints = (points: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> => {
  // Dédoublonnage des points quasi-confondus (< 2 px).
  const pts: Array<{ x: number, y: number }> = []
  points.forEach(p => {
    const last = pts[pts.length - 1]
    if (!last || Math.abs(p.x - last.x) >= 2 || Math.abs(p.y - last.y) >= 2) pts.push(p)
  })
  if (pts.length < 3) return []
  // Runs : segments consécutifs de même axe ET même sens le long de l'axe principal
  // (un aller-retour sur le même axe reste deux runs distincts).
  interface Run { axis: 'h' | 'v' | 'd', start: number, end: number }
  const runs: Run[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const axis = routedSegAxis(pts[i], pts[i + 1])
    const prev = runs[runs.length - 1]
    if (prev && prev.axis === axis && axis !== 'd') {
      const mainDelta = (p: number, q: number): number =>
        axis === 'h' ? pts[q].x - pts[p].x : pts[q].y - pts[p].y
      if (mainDelta(prev.start, prev.end) * mainDelta(i, i + 1) > 0) {
        prev.end = i + 1
        continue
      }
    }
    runs.push({ axis, start: i, end: i + 1 })
  }
  // Coordonnée d'un run axial = moyenne (x pour 'v', y pour 'h') de ses points.
  const runCoord = (r: Run): number => {
    let sum = 0
    for (let i = r.start; i <= r.end; i++) sum += (r.axis === 'v') ? pts[i].x : pts[i].y
    return sum / (r.end - r.start + 1)
  }
  const corners: Array<{ x: number, y: number }> = []
  for (let i = 1; i < runs.length; i++) {
    const a = runs[i - 1], b = runs[i]
    const j = pts[a.end] // jonction entre les deux runs
    if (a.axis === 'h' && b.axis === 'v') corners.push({ x: runCoord(b), y: runCoord(a) })
    else if (a.axis === 'v' && b.axis === 'h') corners.push({ x: runCoord(a), y: runCoord(b) })
    else {
      // Un diagonal (ou deux runs parallèles après rebroussement) : jonction
      // conservée, recalée sur la coordonnée des runs axiaux qui la bordent.
      const x = (a.axis === 'v') ? runCoord(a) : (b.axis === 'v') ? runCoord(b) : j.x
      const y = (a.axis === 'h') ? runCoord(a) : (b.axis === 'h') ? runCoord(b) : j.y
      corners.push({ x, y })
    }
  }
  return corners
}

/** nodePadding minimal (le plus profond) parmi les `<port>` d'un process/place.
 *  Les `<port>` sont des enfants DIRECTS du `<process>`/`<place>` (pas de wrapper
 *  `<ports>` — vérifié sur le corpus e!Sankey 5). */
const deepestPortPadding = (el: Element): number => {
  let min = 0
  childrenByTag(el, 'port').forEach(p => {
    const pad = attrNum(p, 'nodePadding', 0)
    if (pad < min) min = pad
  })
  return min
}

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

/** Un `<process>`/`<place>` porte un trait VISIBLE : largeur > 0 et couleur non
 *  quasi-blanche. Une boîte au fond quasi-blanc n'est une ANCRE invisible (cf.
 *  isNearWhiteFill) que si elle n'a PAS un tel trait : e!Sankey dessine des
 *  process au fond quasi-blanc mais BORDÉS (démo « Depuration de Chlore » : fond
 *  #F0F0F8, trait noir 3px), qui sont de vrais nœuds à conserver, pas des ancres. */
const hasVisibleBorder = (g: EsGraphicalProcess | null): boolean =>
  !!g && g.borderWidth > 0 && !!g.borderColor && !isNearWhiteFill(g.borderColor)

/** Mise en forme du label de NOM d'un `<process>`/`<place>` : gras/italique/taille
 *  depuis son `<label><font>`, couleur depuis `<label>/@textColor`. Commun aux deux
 *  parseurs. `label` null (aucun label) → tout neutre. .NET FontStyle : bit 1 gras,
 *  bit 2 italique. */
const parseGraphicalLabelFont = (label: Element | null): Pick<EsGraphicalProcess, 'labelBold' | 'labelItalic' | 'labelFontSize' | 'labelColor'> => {
  const font = label ? childByTag(label, 'font') : null
  const style = attrNum(font, 'style', 0)
  return {
    labelBold: (style & 1) !== 0,
    labelItalic: (style & 2) !== 0,
    labelFontSize: ptToPx(attrNum(font, 'size', 0)),
    labelColor: argbToHex(label?.getAttribute('textColor') ?? null),
  }
}

/** Bordure d'un `<process>`/`<place>` depuis son `<penColor>`. Commun aux deux
 *  parseurs. Absente → largeur 0 (pas de trait), la construction du nœud
 *  masquera la bordure. */
const parseGraphicalBorder = (el: Element): Pick<EsGraphicalProcess, 'borderColor' | 'borderWidth' | 'borderDashed'> => {
  const pen = childByTag(el, 'penColor')
  return {
    borderColor: argbToHex(pen?.getAttribute('argb') ?? null),
    borderWidth: attrNum(pen, 'width', 0),
    borderDashed: isPenColorPatternDashed(pen),
  }
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
      // opensankey#1301 — bord GAUCHE réel du label = connectionPointX + offsetX
      // (offset depuis le point d'accroche au nœud). `locationX` est TANTÔT le coin
      // gauche TANTÔT le centre selon les fichiers (même alignment), donc peu fiable ;
      // connectionPointX + offsetX donne systématiquement le bord gauche. Repli locationX.
      labelX: (label?.hasAttribute('connectionPointX') && label?.hasAttribute('offsetX'))
        ? attrNum(label, 'connectionPointX', 0) + attrNum(label, 'offsetX', 0)
        : attrNum(label, 'locationX', 0),
      labelY: attrNum(label, 'locationY', 0),
      labelW: attrNum(label, 'sizeW', 0),
      labelH: attrNum(label, 'sizeH', 0),
      labelVisible: label?.getAttribute('visible') !== 'false',
      visible: p.getAttribute('visible') !== 'false',
      imageFile: childByTag(p, 'image')?.getAttribute('filename') ?? '',
      shapeType: attrNum(p, 'shapeType', 0),
      arrowDirection: attrNum(p, 'arrowDirection', 2),
      linkPadding: deepestPortPadding(p),
      zorder: attrNum(p, 'zorder', -1),
      ...parseGraphicalLabelFont(label),
      ...parseGraphicalBorder(p),
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
      // opensankey#1301 — bord GAUCHE réel du label = connectionPointX + offsetX
      // (offset depuis le point d'accroche au nœud). `locationX` est TANTÔT le coin
      // gauche TANTÔT le centre selon les fichiers (même alignment), donc peu fiable ;
      // connectionPointX + offsetX donne systématiquement le bord gauche. Repli locationX.
      labelX: (label?.hasAttribute('connectionPointX') && label?.hasAttribute('offsetX'))
        ? attrNum(label, 'connectionPointX', 0) + attrNum(label, 'offsetX', 0)
        : attrNum(label, 'locationX', 0),
      labelY: attrNum(label, 'locationY', 0),
      labelW: attrNum(label, 'sizeW', 0),
      labelH: attrNum(label, 'sizeH', 0),
      labelVisible: label?.getAttribute('visible') !== 'false',
      visible: p.getAttribute('visible') !== 'false',
      imageFile: childByTag(p, 'image')?.getAttribute('filename') ?? '',
      shapeType: attrNum(p, 'shapeType', 0),
      arrowDirection: attrNum(p, 'arrowDirection', 0),
      linkPadding: deepestPortPadding(p),
      zorder: attrNum(p, 'zorder', -1),
      // Boîte de la place (OS#1298), même schéma que le process.
      width: attrNum(p, 'backgroundSizeW', 0),
      height: attrNum(p, 'backgroundSizeH', 0),
      ...parseGraphicalLabelFont(label),
      ...parseGraphicalBorder(p),
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

// Padding/interligne du .ql-editor (quill.snow.css, chargé par react-quill) qui
// rend le rich-text des zones : padding 12px vertical (×2) + 15px horizontal (×2),
// line-height 1.42, `p { margin:0 }`. Sert à dimensionner la boîte pour englober
// EXACTEMENT le texte rendu (le foreignObject clippe à shape_min_height).
const QL_PAD_V = 24
const QL_PAD_H = 30
const QL_LINE_HEIGHT = 1.42

// Applique le texte d'un <text> e!Sankey à une zone (base). Le contenu multi-ligne
// vit en rich-text (name_label_fo_content, un <p> par ligne, `<p><br></p>` pour une
// ligne vide — e!Sankey sépare des blocs par des lignes blanches, qu'on préserve
// pour garder l'espacement) ; les champs plats name/name_label_text portent le texte
// SANS \n (un \n y casse l'affichage et l'éditeur). `resize` (défaut vrai) agrandit
// la boîte pour englober le texte rendu — désactivé quand le texte est absorbé par
// un rectangle (le fond garde sa géométrie propre). Renvoie false si <text> vide.
const applyTextToContainer = (base: EsContainerJSON, textEl: Element, resize = true): boolean => {
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
  // Mise en forme (gras/italique/taille/couleur) reprise du <font> + textColor.
  // On la pose sur les attributs plats ET dans le HTML du rich-text : les zones
  // de texte forcent `name_label_has_fo` (ContainerPersistence.applyBaseJSON) — le
  // rendu passe donc TOUJOURS par le foreignObject, qui affiche le HTML brut du
  // fo_content et IGNORE les attributs plats. Sans style inline dans le <p>, gras
  // et taille e!Sankey (ex. titre gras) étaient aplatis au style par défaut du
  // rich-text. On bake donc le style dans chaque <p>.
  const font = childByTag(textEl, 'font')
  const textColor = argbToHex(textEl.getAttribute('textColor'))
  const fontSize = ptToPx(attrNum(font, 'size', 9)) // pt e!Sankey → px (×4/3)
  const inlineStyle: string[] = []
  if (font) {
    base.name_label_font_size = fontSize
    if (fontSize > 0) inlineStyle.push(`font-size:${fontSize}px`)
    const style = attrNum(font, 'style', 0)
    if (fontStyleBold(style)) { base.name_label_bold = true; inlineStyle.push('font-weight:bold') }
    if (fontStyleItalic(style)) { base.name_label_italic = true; inlineStyle.push('font-style:italic') }
  }
  if (textColor) { base.name_label_color = textColor; inlineStyle.push(`color:${textColor}`) }
  const styleAttr = inlineStyle.length ? ` style="${inlineStyle.join(';')}"` : ''
  // Lignes vides préservées (`<p><br></p>`) : e!Sankey sépare des blocs par des
  // lignes blanches ; les filtrer collait les lignes (la ligne du bas remontait).
  const lines = text.split('\n')
  base.name_label_fo_content = lines
    .map(line => line.trim() === '' ? '<p><br></p>' : `<p${styleAttr}>${escapeHtml(line)}</p>`)
    .join('')
  // Boîte : la boîte e!Sankey (sizeH), calibrée au plus juste pour SA police, coupe
  // le bas du texte agrandi car le .ql-editor ajoute padding + interligne. On
  // l'agrandit pour englober le rendu exact, et on RECENTRE (le loader force
  // name_label_horiz/vert='middle' + inside : le texte est centré dans la boîte)
  // pour ne pas déplacer le texte de sa place e!Sankey. Décalage x/y appliqué avant
  // la normalisation : translation relative de la zone, que la normalisation suit.
  if (resize) {
    const contentH = Math.ceil(lines.length * fontSize * QL_LINE_HEIGHT + QL_PAD_V)
    const oldH = Number(base.label_height) || 0
    if (contentH > oldH) {
      base.y = Math.round((Number(base.y) || 0) - (contentH - oldH) / 2)
      base.label_height = contentH
    }
    // Largeur : compense le padding horizontal pour garder l'aire de texte = sizeW
    // (sinon le texte se replierait, ajoutant des lignes → re-débordement).
    base.label_width = (Number(base.label_width) || 0) + QL_PAD_H
    base.x = Math.round((Number(base.x) || 0) - QL_PAD_H / 2)
  }
  return true
}

interface EsShapeBox { el: Element, kind: string, x: number, y: number, w: number, h: number, z: number }

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
): { containers: { [id: string]: EsContainerJSON }, zorders: { [id: string]: number } } => {
  const out: { [id: string]: EsContainerJSON } = {}
  // Ordre Z global (`@zorder`) de chaque zone émise — alimente order_g_elements.
  const zorders: { [id: string]: number } = {}
  const shapes = childByTag(net, 'shapes')
  if (!shapes) return { containers: out, zorders }
  // Collecte de tous les shapes graphiques avec leur boîte englobante.
  const items: EsShapeBox[] = []
  childrenByTag(shapes, 'shape').forEach(wrapper => {
    Array.from(wrapper.children).forEach(shape => {
      items.push({
        el: shape, kind: shape.localName,
        x: attrNum(shape, 'locationX', 0), y: attrNum(shape, 'locationY', 0),
        w: attrNum(shape, 'sizeW', 100), h: attrNum(shape, 'sizeH', 30),
        z: attrNum(shape, 'zorder', -1),
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
      // resize=false : le rectangle garde SA géométrie (position/taille du fond),
      // on ne l'agrandit pas pour le texte.
      const t = textOfRect.get(it)
      if (t) applyTextToContainer(base, t.el, false)
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
    if (id in out) zorders[id] = it.z
  })
  return { containers: out, zorders }
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
   * `sankeyArrowLabel/@showPercentage` : label en POURCENTAGE intégré (sans
   * passer par labelFormat). Seule la valeur 2 est observée sur le corpus
   * (démos « Efficiency diagram example ») = % du plus gros flux du même
   * unitType dans tout le modèle (mot-clé {PercentModel} du manuel). 0 = off.
   */
  showPercentage: number
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
  /**
   * BOÎTE du label en coordonnées DOCUMENT (même repère que les nœuds et la
   * polyligne du tracé) : `locationX/Y` = coin HAUT-GAUCHE, `sizeW/H` = taille.
   * Modèle e!Sankey vérifié numériquement (Efficiency diagram, flèches droites
   * et coudées) : point d'accroche = point du segment `@segment` de la
   * polyligne à `@segmentPercentage` %, puis centre du label = accroche +
   * (offsetW, offsetH), et locationX/Y = centre − size/2 (cache sérialisé,
   * exact au centième). On lit directement locationX/Y : présent sur 100 % des
   * 2136 labels de flèches mappées du corpus.
   */
  labelHasPos: boolean
  labelX: number
  labelY: number
  labelW: number
  labelH: number
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
  /**
   * opensankey#1301 — polyligne du tracé (`<sankeyLink><points>`), coordonnées
   * document e!Sankey, SUR le tracé (coudes orthogonaux) : `[ancre source, …coins…,
   * ancre cible]`. Tous les points INTÉRIEURS (P1..P_{n-2}) deviennent des points de
   * contrôle. Vide si le `<sankeyLink>`/`<points>` est absent.
   */
  points: Array<{ x: number, y: number }>
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
  /** Ordre Z global de la flèche (`@zorder`, cf. EsGraphicalProcess.zorder). */
  zorder: number
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
    // opensankey#1301 — polyligne du tracé (<sankeyLink><points><value X Y>).
    const pointsEl = sankeyLink ? childByTag(sankeyLink, 'points') : null
    const linkPoints = pointsEl
      ? childrenByTag(pointsEl, 'value').map(v => ({ x: attrNum(v, 'X', 0), y: attrNum(v, 'Y', 0) }))
      : []
    out[a.getAttribute('id') ?? ''] = {
      tooltip: (comment?.getAttribute('text') ?? '').replace(/\r\n/g, '\n').trim(),
      labelVisible: label?.getAttribute('visible') !== 'false',
      showValue: label?.getAttribute('showValue') !== 'false',
      showUnit: label?.getAttribute('showUnit') === 'true',
      showPercentage: attrNum(label, 'showPercentage', 0),
      labelFormat: label?.getAttribute('labelFormat') ?? '',
      labelFontSize: ptToPx(attrNum(labelFont, 'size', 0)),
      labelOffsetH: attrNum(label, 'offsetH', 0),
      labelSegmentPercentage: attrNum(label, 'segmentPercentage', NaN),
      labelColor: argbToHex(label?.getAttribute('textColor') ?? null),
      labelHasPos: !!label && label.hasAttribute('locationX'),
      labelX: attrNum(label, 'locationX', 0),
      labelY: attrNum(label, 'locationY', 0),
      labelW: attrNum(label, 'sizeW', 0),
      labelH: attrNum(label, 'sizeH', 0),
      hasSankeyLink: sankeyLink !== null,
      startSegmentLength: attrNum(sankeyLink, 'sankeyStartSegmentLength', 0),
      endSegmentLength: attrNum(sankeyLink, 'sankeyEndSegmentLength', 0),
      curviness: attrNum(sankeyLink, 'curviness', 0),
      orthogonal: sankeyLink?.getAttribute('orthogonal') === 'true',
      adjustingStyle: sankeyLink?.getAttribute('adjustingStyle') ?? '',
      points: linkPoints,
      toArrow,
      toArrowLength,
      fromArrowLength,
      fromArrow,
      dashed: isDashStylePenDashed(pen),
      // OS#1294 — dégradé source→cible (lu sur la flèche graphique).
      gradientFromSource: a.getAttribute('gradientFromSource') === 'true',
      gradientToDestination: a.getAttribute('gradientToDestination') === 'true',
      zorder: attrNum(a, 'zorder', -1),
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
  // NB : PAS de conversion pt→px ici pour l'instant — legend_police pilote la
  // disposition de la légende (agrandir crée des sauts de ligne). À traiter plus tard.
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
  // Bordure : e!Sankey trace un trait fin plein noir par défaut (jamais le
  // pointillé 3px de l'appli). shape_border_color_sustainable = true pour que la
  // couleur de bordure soit indépendante du remplissage (sinon NodeDrawShape
  // recolore le trait avec la couleur du nœud). Surchargé par nœud via penColor.
  shape_border_visible: true,
  shape_border_color: 'black',
  shape_border_color_sustainable: true,
  shape_border_thickness: 1,
  shape_border_dashed: false,
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

  // os#1305 — « Scale to lower flow threshold » : e!Sankey borne l'épaisseur
  // RENDUE des flux fins à `lowerFlowTreashold`, seuil en PIXELS — pas en
  // quantité. Preuve corpus (« Energy Flows China 2014 ») : maximumFlow=141126
  // sur width=61 px (≈ 0.0004 px/unité) avec lowerFlowTreashold=2 — lu en
  // quantité, le plancher vaudrait 0.0009 px (réglage sans effet) ; lu en px,
  // c'est un plancher visible de 2 px, cohérent sur les 4 démos actives du
  // corpus. Les valeurs observées (1, 2, 11) sont d'ailleurs de petits entiers
  // découplés des maximumFlow (20 → 141126), même famille de réglages px que
  // smallArrowTreashold. Équivalent OpenSankey EXACT : `minimum_flux` de la
  // drawing area (clamp px de l'épaisseur visible, cf. flowThickness.fluxFloor)
  // → recopié tel quel, AUCUNE conversion par l'échelle (userScale). Le réglage
  // vit sur chaque unitType ET en miroir sur <net> (valeurs identiques sur tout
  // le corpus) : on lit le unitType de RÉFÉRENCE d'abord, <net> en repli.
  let minimumFlux: number | null = null
  if (referenceUnitType?.scaleToLowerFlowTreashold) {
    minimumFlux = referenceUnitType.lowerFlowTreashold
  } else if (net.getAttribute('scaleToLowerFlowTreashold') === 'true') {
    minimumFlux = attrNum(net, 'lowerFlowTreashold', 0)
  }
  // Seuil nul/absent : rien à émettre (0 ABAISSERAIT le plancher par défaut de
  // 2 px d'OpenSankey, contraire à l'intention du réglage).
  if (minimumFlux !== null && minimumFlux <= 0) minimumFlux = null

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

  // Mise en forme du LABEL de nom (gras/italique/taille/couleur) reprise du
  // `<label><font>` e!Sankey. Indépendante de la position : e!Sankey met souvent
  // ces titres en gras (démos « Bus Passengers »), sinon le nom retombe sur le
  // style OpenSankey maigre par défaut. Clés modernes `name_label_*` (mêmes que
  // les zones de texte) appliquées telles quelles par le loader.
  const applyNameLabelFont = (node: EsNode, graphical: EsGraphicalProcess | null): void => {
    if (!graphical) return
    // `<label visible='false'>` : e!Sankey masque le NOM (démo « Efficiency
    // diagram example » : tous les process du bloc central) — indépendant de la
    // visibilité de la boîte. Clé legacy 0.9 → name_label_is_visible.
    if (!graphical.labelVisible) node.local.label_visible = false
    if (graphical.labelBold) node.local.name_label_bold = true
    if (graphical.labelItalic) node.local.name_label_italic = true
    if (graphical.labelFontSize > 0) node.local.name_label_font_size = graphical.labelFontSize
    if (graphical.labelColor) node.local.name_label_color = graphical.labelColor
  }

  // Bordure du nœud depuis la <penColor> du process/place (« Largeur » + couleur
  // + « Style du trait »). width 0 = pas de trait → bordure masquée.
  const applyGraphicalBorder = (node: EsNode, graphical: EsGraphicalProcess | null): void => {
    if (!graphical) return
    if (graphical.borderWidth > 0) {
      node.local.shape_border_visible = true
      node.local.shape_border_thickness = graphical.borderWidth
      node.local.shape_border_dashed = graphical.borderDashed
      if (graphical.borderColor) {
        node.local.shape_border_color = graphical.borderColor
        node.local.shape_border_color_sustainable = true
      }
    } else {
      node.local.shape_border_visible = false
    }
  }

  // « Distance » e!Sankey (port nodePadding NÉGATIF) → shape_link_inset POSITIF :
  // les ancres de flux rentrent dans la boîte, les flux entrants/sortants se
  // rejoignent à travers le nœud (Node.updateLinksPositions clampe à mi-boîte).
  // Padding >= 0 (gap externe e!Sankey) : pas d'équivalent utile à l'import, ignoré.
  const applyLinkInset = (node: EsNode, graphical: EsGraphicalProcess | null): void => {
    if (!graphical || graphical.linkPadding >= 0) return
    node.local.shape_link_inset = -graphical.linkPadding
  }

  // Nœuds : un par graphProcess. Nom = nom logique, sinon label graphique.
  const nodes: { [id: string]: EsNode } = {}
  // Ordre Z global e!Sankey (`@zorder` : plus grand = par-dessus) de chaque
  // élément importé (nœuds, flux, zones), collecté au fil des boucles pour
  // émettre `order_g_elements` (liste OpenSankey 1er plan → fond). z = -1 :
  // élément sans zorder (places, nœud sans contrepartie graphique) — posé au
  // 1er plan, comme e!Sankey qui dessine ces petits stubs d'E/S au-dessus.
  const zOrderEntries: Array<{ id: string, z: number }> = []
  // S2 (SA#294) — Boîte e!Sankey des ancres In/Out collapsées en point. Mémorisée
  // pour recaler, une fois le voisin connu, le point d'accroche du flux sur le BORD
  // de la boîte face au voisin (cf. recenterHiddenAnchor) au lieu du coin haut-gauche.
  const hiddenNodeBox: {
    [id: string]: {
      x: number, y: number, w: number, h: number,
      labelX: number, labelY: number, labelW: number, labelH: number, labelHasPos: boolean
    }
  } = {}
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
    zOrderEntries.push({ id, z: graphical?.zorder ?? -1 })
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
    // Image de process → nœud-image (résolue tôt : un process à image REMPLACE sa
    // boîte, e!Sankey n'en dessine alors ni le fond ni la bordure — cf. bloc else).
    const imgSrc = graphical?.imageFile ? images[imageKey(graphical.imageFile)] : undefined
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
      (graphical?.visible && !graphical.imageFile && isNearWhiteFill(graphical.color) &&
        !hasVisibleBorder(graphical))
    if (nodeHidden) {
      nodes[id].local.shape_visible = false
      nodes[id].local.shape_border_visible = false
      // « Distance » e!Sankey NÉGATIVE sur une jonction masquée. e!Sankey ne pose
      // JAMAIS de Distance négative sur un process VISIBLE (vérifié sur les 120
      // démos) : c'est toujours une jonction cachée, fine et HAUTE, qui rassemble
      // plusieurs flux sur sa hauteur (ex. CHP Hospital : boîte 16×160, padding -8
      // = demi-largeur). On garde alors sa BOÎTE (invisible) + l'inset : les flux
      // s'étalent le long de la hauteur et se rejoignent au centre en x, fidèle à
      // e!Sankey. Sans ça, le nœud collapserait en un point, écrasant AUSSI cet
      // étalement vertical (tous les flux convergeraient au même endroit).
      if (graphical && graphical.linkPadding < 0 && graphical.width > 0 && graphical.height > 0) {
        nodes[id].local.node_width = graphical.width
        nodes[id].local.node_height = graphical.height
        applyLinkInset(nodes[id], graphical)
      } else if (graphical && graphical.width > 0 && graphical.height > 0) {
        // S2 (SA#294) — ancre In/Out collapsée en point : on mémorise la boîte pour
        // recaler, une fois le voisin connu, le point d'accroche sur le bord face au
        // voisin (recenterHiddenAnchor). Un nœud-point rend le choix du bord
        // (target_side/source_side) SANS OBJET (haut=bas), donc l'accroche est
        // robuste même quand la barre grossit et remonte au-dessus de l'ancre.
        hiddenNodeBox[id] = {
          x: graphical.x, y: graphical.y, w: graphical.width, h: graphical.height,
          labelX: graphical.labelX, labelY: graphical.labelY,
          labelW: graphical.labelW, labelH: graphical.labelH,
          labelHasPos: graphical.labelHasPos,
        }
      }
    } else {
      // OS#1298 — taille de boîte réelle, uniquement pour un nœud VISIBLE.
      if (graphical && graphical.width > 0) nodes[id].local.node_width = graphical.width
      if (graphical && graphical.height > 0) nodes[id].local.node_height = graphical.height
      applyLinkInset(nodes[id], graphical)
      // Nœud-image : l'image REMPLACE la boîte — e!Sankey ne trace PAS la bordure du
      // process (case « Couleur ligne » inactive pour un process à image, cf.
      // « Energy Balance for a Country »), même si un <penColor> est sérialisé. On
      // masque donc la bordure ; sinon on applique celle du penColor.
      if (imgSrc) nodes[id].local.shape_border_visible = false
      else applyGraphicalBorder(nodes[id], graphical)
    }
    applyNameLabelPos(nodes[id], graphical)
    applyNameLabelFont(nodes[id], graphical)
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
    // 0.9, mappés vers icon_is_image/icon_image_src au chargement). imgSrc résolu
    // plus haut (gate de bordure).
    if (imgSrc) {
      nodes[id].is_image = true
      nodes[id].image_src = imgSrc
    }
    // OS#1292 — Stocks : compartiments <stock> du graphProcess (un par matière).
    // Sémantique e!Sankey CENTRÉE PROCESS (vérifiée par bilan matière sur la
    // démo « Processes with Stocks ») : inputQuantity = entrée du process
    // DEPUIS le stock (déstockage), outputQuantity = sortie du process VERS le
    // stock (stockage). Δ stock = output − input, sommé sur les compartiments
    // et converti en unité de base comme les flux. Pas de niveau initial dans
    // le format → initial_stock jamais posé, et la FORME stock OpenSankey (qui
    // encode un niveau) n'aurait rien à montrer : la même information est
    // rendue en LIBELLÉ de stock (« Δ Stock : +380 kg », drawStockBox), activé
    // EXPLICITEMENT en local — le remplissage de style legacy 0.9 résout
    // stock_label_is_visible à false, le défaut config (true) ne suffit pas.
    // (La représentation en FLUX « From/To Stock » façon e!Sankey est l'objet
    // d'OS#1303, branche 1303-esankey-stock-flux.) Les stocks d'entry
    // TRANSPARENTE (astuce e!Sankey pour équilibrer un process sans rien
    // dessiner) gardent la donnée (bilan du process juste) mais restent muets.
    const compartmentsEl = childByTag(gp, 'compartments')
    const stockList = compartmentsEl ? childrenByTag(compartmentsEl, 'stock') : []
    let stockVariation = 0
    let hasStockQuantity = false
    let hasVisibleStockEntry = false
    let stockUnitId: string | null = null
    stockList.forEach(s => {
      const input = attrNum(s, 'inputQuantity', 0)
      const output = attrNum(s, 'outputQuantity', 0)
      // Compartiment sans quantité : e!Sankey ne dessine rien (flèches de
      // largeur nulle) → rien à mapper.
      if (input === 0 && output === 0) return
      hasStockQuantity = true
      const found = findUnit(childByTag(s, 'unitRef')?.getAttribute('refId') ?? null)
      stockVariation += (output - input) * (found?.unit.coefficient ?? 1)
      const entry = entries[childByTag(s, 'entryRef')?.getAttribute('refId') ?? ''] ?? null
      if (entry && !entry.isTransparent) {
        hasVisibleStockEntry = true
        if (stockUnitId === null) stockUnitId = found?.unit.id ?? null
      }
    })
    if (hasStockQuantity) {
      nodes[id].has_stock = true
      nodes[id].stock_values = { stock_variation: stockVariation }
      if (hasVisibleStockEntry) {
        nodes[id].local.stock_label_is_visible = true
        // Unité du libellé via le registre (OS#1286), comme les labels de flux :
        // la variation est en unité de base, l'affichage re-divise par le
        // coefficient et restitue la quantité avec son symbole (« +380 kg »).
        if (stockUnitId !== null) {
          nodes[id].local.stock_label_unit_visible = true
          nodes[id].local.stock_label_unit_type = 'unit_model'
          nodes[id].local.stock_label_unit = stockUnitId
        }
      }
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
    zOrderEntries.push({ id, z: graphical?.zorder ?? -1 })
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
    const imgSrc = graphical?.imageFile ? images[imageKey(graphical.imageFile)] : undefined
    // Idem process : masquer forme ET bordure (shape_border_visible indépendant).
    // Une boîte quasi-blanche BORDÉE reste un vrai nœud (cf. hasVisibleBorder).
    if ((graphical && !graphical.visible) ||
        (graphical?.visible && !graphical.imageFile && isNearWhiteFill(graphical.color) &&
          !hasVisibleBorder(graphical))) {
      nodes[id].local.shape_visible = false
      nodes[id].local.shape_border_visible = false
    } else if (imgSrc) {
      // Place à image : l'image REMPLACE la boîte, pas de bordure (cf. process).
      nodes[id].local.shape_border_visible = false
    } else {
      applyGraphicalBorder(nodes[id], graphical)
    }
    // « Distance » e!Sankey (no-op pour les places du corpus, toutes à padding 0).
    applyLinkInset(nodes[id], graphical)
    if (graphical?.shapeType === 1) nodes[id].local.shape_border_radius = 10
    else if (graphical?.shapeType === 2) nodes[id].local.shape = 'ellipse'
    applyNameLabelPos(nodes[id], graphical)
    applyNameLabelFont(nodes[id], graphical)
    if (imgSrc) {
      nodes[id].is_image = true
      nodes[id].image_src = imgSrc
    } else {
      // Point d'E/S sans image : forme compacte pour ne pas masquer le flux.
      nodes[id].local.node_width = 12
    }
  })

  // S2 (SA#294) — Recalage du point d'accroche d'une ancre collapsée sur le MILIEU
  // du bord de sa boîte e!Sankey face à son voisin. e!Sankey raccorde le flux au
  // milieu de ce bord (bas d'un In posé au-dessus, bas d'un Out dont la barre est
  // dessous) ; le coin haut-gauche décalait le départ d'une demi-boîte (flux trop
  // haut). Le nœud restant un POINT, le choix du bord côté rendu (source/target_side)
  // est sans objet (haut=bas) : accroche robuste même quand la barre grossit. Le
  // label de nom est ré-ancré au CENTRE du point (name_label='middle' + shift =
  // centre du label e!Sankey − point) : stable quel que soit l'épaississement.
  // Idempotent (une ancre = un flux). Positions e!Sankey (pré-croissance) au moment
  // de l'appel → comparaison de bord fiable.
  const anchorRecentered = new Set<string>()
  const recenterHiddenAnchor = (id: string, neighbor: EsNode | undefined): void => {
    const box = hiddenNodeBox[id]
    if (!box || !neighbor || anchorRecentered.has(id)) return
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    // Recalage UNIQUEMENT pour un voisin surtout au-DESSUS/DESSOUS (accroche
    // verticale = le cas « flux trop haut » des stubs In/Out). Pour un voisin
    // LATÉRAL (flux horizontal), on NE touche PAS l'ancre : la déplacer au milieu
    // du bord la ferait descendre d'une demi-boîte alors que la source ne suit pas
    // (ex. Building Energy « Transmission », qui doit rester droit et horizontal).
    if (Math.abs(neighbor.y - cy) < Math.abs(neighbor.x - cx)) return
    anchorRecentered.add(id)
    const px = cx
    const py = neighbor.y >= cy ? box.y + box.h : box.y // bord bas si voisin dessous, sinon haut
    nodes[id].x = px
    nodes[id].y = py
    // Label ré-ancré au centre du point (invariant à la croissance en largeur).
    if (box.labelHasPos) {
      nodes[id].local.name_label_horiz = 'middle'
      nodes[id].local.name_label_vert = 'middle'
      nodes[id].local.name_label_inside_horiz = false
      nodes[id].local.name_label_inside_vert = false
      nodes[id].local.name_label_horiz_shift = Math.round(box.labelX + box.labelW / 2 - px)
      nodes[id].local.name_label_vert_shift = Math.round(box.labelY + box.labelH / 2 - py)
    }
  }

  // Flux : un par flow de compartments (une flèche multi-matériaux e!Sankey
  // devient N flux parallèles même source/cible, chacun tagué par son entry).
  const links: { [id: string]: EsFlow } = {}
  const usedEntryIds = new Set<string>()
  const graphArrows = childByTag(netModel, 'graphArrows')
  const graphArrowList = graphArrows ? childrenByTag(graphArrows, 'graphArrow') : []
  // Labels en % intégré (showPercentage=2, {PercentModel}) : la référence est le
  // plus gros flux du même unitType dans TOUT le modèle, en unité de base —
  // vérifié sur « Efficiency diagram example » (2000 → 100 %, 1680 → 84 %…) ;
  // ce n'est PAS le maximumFlow du unitType (555.6 sur cette démo, réglage
  // d'échelle). Pré-passe avant la boucle des flux.
  const maxFlowByUnitType: { [unitTypeId: string]: number } = {}
  graphArrowList.forEach(ga => {
    const compartments = childByTag(ga, 'compartments')
    const flows = compartments ? childrenByTag(compartments, 'flow') : []
    flows.forEach(flow => {
      const found = findUnit(childByTag(flow, 'unitRef')?.getAttribute('refId') ?? null)
      if (!found) return
      const v = attrNum(flow, 'quantity', 0) * (found.unit.coefficient ?? 1)
      const key = found.unitType.id
      if (!(key in maxFlowByUnitType) || v > maxFlowByUnitType[key]) maxFlowByUnitType[key] = v
    })
  })
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
    // S2 (SA#294) — recale les ancres collapsées de CETTE flèche sur le bord face
    // au voisin AVANT toute géométrie de coude (qui lit les positions des nœuds).
    recenterHiddenAnchor(sourceId, nodes[targetId])
    recenterHiddenAnchor(targetId, nodes[sourceId])
    const arrowId = ga.getAttribute('id') ?? ''
    const graphicalArrow = graphicalArrows[edgeMapping[arrowId] ?? ''] ?? null
    // Orientation OpenSankey = axe d'accroche du flux à chaque bout (h = côté,
    // v = haut/bas). opensankey#1301 — SOURCE DE VÉRITÉ = la polyligne du tracé
    // (direction 1er/dernier segment), repli sur l'heuristique `arrowDirection`.
    // N'est POSÉE que pour un flux paramétrique (cf. isRoutedPolyline plus bas) ; un
    // flux ROUTÉ l'ignore (axe/côté dérivent de la route au runtime, cf. NOTE-WAYPOINTS.md).
    const srcProc = graphicalProcesses[nodeMapping[fromRef ?? ''] ?? '']
    const tgtProc = graphicalProcesses[nodeMapping[toRef ?? ''] ?? '']
    const orientationFromArrowDir = (srcProc && tgtProc)
      ? linkAxis(srcProc.arrowDirection) + linkAxis(tgtProc.arrowDirection)
      : 'hh'
    const orientation = orientationFromPoints(graphicalArrow?.points ?? []) ?? orientationFromArrowDir
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
        // SA#294 — ancres NON verrouillées : on laisse l'auto-positionnement
        // d'OpenSankey (côté + ordre calculés depuis les positions des nœuds) placer
        // les ancres. Verrouiller figeait un rangement e!Sankey mal reconstitué
        // (ordre des flèches, côté calculé au chargement) → inversions selon vh/hv.
        // L'auto-positionnement dynamique restitue le bon rangement (cf. export EV-B).
        source_side_locked: false,
        target_side_locked: false,
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
      // Orientation posée UNIQUEMENT pour un flux paramétrique. Un flux routé
      // (détour → waypoints ci-dessous) l'ignore (axe/côté dérivent de la route).
      const isRouted = isRoutedPolyline(graphicalArrow?.points ?? [])
      if (!isRouted && orientation !== 'hh') link.local.orientation = orientation
      // Label de valeur : REPRIS de la flèche e!Sankey quand elle affiche le
      // sien (`<sankeyArrowLabel visible showValue>`), mais UNIQUEMENT pour une
      // flèche MONO-matériau. Chez e!Sankey la quantité appartient à la FLÈCHE
      // (somme de ses matériaux, posée sur un segment) ; sur une flèche
      // multi-matériaux (N flux parallèles chez nous) chaque flux afficherait SA
      // part et les N valeurs se chevauchent (illisible) — celles-là restent
      // éteintes (manque « label agrégé par flèche », listé en #264). Les
      // réglages de style du label (#1287 : taille/couleur/offset ci-dessous)
      // sont posés dans tous les cas : ils s'appliquent aussi si l'utilisateur
      // réactive les valeurs à la main. e!Sankey affiche les valeurs TOUJOURS à
      // l'horizontale (jamais sur la tangente).
      link.local.value_label_is_visible = flows.length === 1 &&
        graphicalArrow !== null && graphicalArrow.labelVisible &&
        (graphicalArrow.showValue || graphicalArrow.showPercentage === 2)
      link.local.value_label_on_path = false
      // os#1304 — FORMAT NUMÉRIQUE de la valeur : le unitType du flow porte un
      // format .NET (`displayFormat`, ex. « 0.## ») → nombre de décimales posé
      // par flux (value_label_custom_digit + value_label_nb_digit ; format_value
      // fait alors `parseFloat(v.toFixed(nb_digit))`). Posé dans tous les cas,
      // même label éteint (mêmes conventions que les réglages #1287 : correct si
      // l'utilisateur réactive les valeurs à la main). Approximation assumée (≈) :
      // OpenSankey TRONQUE les zéros de fin (le parseFloat), donc les formats à
      // décimales FORCÉES (« 0.00 » → « 1,50 » chez e!Sankey) s'affichent « 1.5 »
      // chez nous ; le séparateur de milliers (`,`) n'est pas reproduit.
      const nbDecimals = netFormatDecimalCount(found?.unitType.displayFormat ?? '')
      if (nbDecimals !== null) {
        link.local.value_label_custom_digit = true
        link.local.value_label_nb_digit = nbDecimals
      }
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
        // COUDE (orientation mixte vh/hv) : la poignée de Bézier CÔTÉ SOURCE doit
        // atteindre le coin pour dessiner un angle net. Contrairement à l'intuition
        // « petit = serré », une tangente de départ PETITE raccourcit cette poignée
        // et la courbe file en diagonale molle (computeStartingBezierPoint :
        // P2 = P1 + (P5-P1)·starting_tangeant). On force donc la tangente de départ
        // à 1 sur les flux en coude (In→process = vh, process→Out = hv), le côté
        // cible gardant le petit virage. Les flux droits (hh) restent inchangés.
        const isElbow = orientation === 'vh' || orientation === 'hv'
        link.local.starting_tangeant = isElbow ? 1 : bend
        link.local.ending_tangeant = bend
        link.local.curvature = bend
        // opensankey#1301 — POINTS DE CONTRÔLE. La polyligne e!Sankey est SUR le tracé :
        // [ancre source, …coins…, ancre cible]. Le flux est ROUTÉ ssi elle fait un
        // DÉTOUR (isRoutedPolyline : ≥ 2 coudes quasi-orthogonaux OU rebroussement) —
        // vrai routage (escalier, boucle), même en 4 points ; un flux droit ou courbe
        // simple (segment milieu diagonal) reste paramétrique. Les waypoints sont les
        // COINS RECTIFIÉS de la polyligne (rectifyRoutedWaypoints), pas ses points
        // bruts : la route arrondie e!Sankey dérive de quelques px et ses sommets
        // repris tels quels dessinent des mini-S à rebours à chaque coin. Coords
        // doc e!Sankey → translatées avec les nœuds.
        if (isRouted) {
          const corners = rectifyRoutedWaypoints(graphicalArrow.points)
          link.local.shape_waypoints = corners.length > 0
            ? corners
            : graphicalArrow.points.slice(1, graphicalArrow.points.length - 1).map(p => ({ x: p.x, y: p.y }))
          link.local.left_horiz_shift = 0.01
          link.local.right_horiz_shift = 0.01
          // MAPPING EXACT des extrémités : sans offset d'ancre, OpenSankey ré-empile
          // l'ancre ailleurs que le port e!Sankey (P0/PN de la polyligne) et le
          // runtime ponte l'écart ancre↔coin en insérant un coude → dépassement puis
          // rebroussement visible au dernier coin. On épingle donc l'ancre au port,
          // comme pour les flux droits vv/hh ci-dessous. Axe de l'offset = transverse
          // à l'axe d'accroche (1er/dernier segment de la polyligne) ; segment
          // diagonal → pas d'offset (accroche paramétrique auto).
          const rpts = graphicalArrow.points
          const P0 = rpts[0], PN = rpts[rpts.length - 1]
          const srcAxis = routedSegAxis(P0, rpts[1])
          const tgtAxis = routedSegAxis(rpts[rpts.length - 2], PN)
          const srcN = nodes[sourceId], tgtN = nodes[targetId]
          if (srcN && srcAxis !== 'd') link.local.shape_source_anchor_offset = (srcAxis === 'v') ? (P0.x - srcN.x) : (P0.y - srcN.y)
          if (tgtN && tgtAxis !== 'd') link.local.shape_target_anchor_offset = (tgtAxis === 'v') ? (PN.x - tgtN.x) : (PN.y - tgtN.y)
        } else if (graphicalArrow.points.length >= 2 && (orientation === 'vv' || orientation === 'hh')) {
          // Flux DROIT (vv/hh, mêmes axes aux deux bouts) : aligner les ancres sur les
          // PORTS e!Sankey (P0/dernier point), sinon l'empilement OpenSankey les décentre
          // (un VV droit penche). RESTREINT aux flux droits : les coudes (vh/hv) et les
          // multi-flow non droits gardent le comportement paramétrique (pas d'offset,
          // sinon on les casse — cf. Bus Passengers). Offset = port − coin du nœud le long
          // du bord (axe transverse au côté). Différence → invariante par la normalisation.
          const pts = graphicalArrow.points
          const P0 = pts[0], PN = pts[pts.length - 1]
          const srcN = nodes[sourceId], tgtN = nodes[targetId]
          // Clé PRÉFIXÉE (shape_*), comme shape_waypoints : la persistance générique
          // ne lit que les clés du config, toutes préfixées 'shape'.
          if (srcN) link.local.shape_source_anchor_offset = (orientation[0] === 'v') ? (P0.x - srcN.x) : (P0.y - srcN.y)
          if (tgtN) link.local.shape_target_anchor_offset = (orientation[1] === 'v') ? (PN.x - tgtN.x) : (PN.y - tgtN.y)
        }
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
      // Unité du label (posée même quand le label reste éteint — flèche
      // multi-matériaux : si l'utilisateur active les valeurs, elle est déjà
      // correcte).
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
      // Label en % INTÉGRÉ (showPercentage=2 = {PercentModel} : % du plus gros
      // flux du même unitType, cf. pré-passe maxFlowByUnitType). Pas de mode
      // dynamique équivalent côté OpenSankey : reproduit STATIQUEMENT via
      // l'unité texte '%' + unit_factor = max/100 (format_value divise par le
      // facteur avant affichage → 2000/20 = « 100 % »). PRIORITAIRE sur showUnit
      // et labelFormat : quand showPercentage est actif, e!Sankey ignore le
      // gabarit sérialisé (vérifié sur « Efficiency diagram example », dont le
      // labelFormat contient {Quantity} alors que le rendu affiche « 100,0 % »).
      // Limite : format_value n'applique unit_factor que s'il est > 1 → repli
      // valeur brute si le max du modèle est <= 100 (aucun cas au corpus).
      const percentModelRef = (graphicalArrow?.showPercentage === 2 && found)
        ? (maxFlowByUnitType[found.unitType.id] ?? 0)
        : 0
      if (percentModelRef > 100) {
        link.local.value_label_unit_type = 'unit_name'
        link.local.label_unit = '%'
        link.local.label_unit_visible = true
        link.local.label_unit_factor = percentModelRef / 100
      }
      // OS#1287 — TAILLE, COULEUR et POSITION du label de VALEUR, repris du
      // `<sankeyArrowLabel>` graphique de la flèche (retrouvé via edgeMapping).
      // La visibilité est arbitrée PLUS HAUT (mono-matériau uniquement) : on se
      // contente, quand la flèche affiche sa valeur (`showValue`) ou son % intégré
      // (`showPercentage`), de préparer la mise en forme pour qu'un label activé
      // soit fidèle — sinon le style par défaut impose une police trop grosse
      // (~20 px) et un placement générique.
      if (graphicalArrow && (graphicalArrow.showValue !== false || graphicalArrow.showPercentage === 2)) {
        // TAILLE de police (<font size>). Absente (0) → le style décide.
        if (graphicalArrow.labelFontSize > 0) {
          link.local.value_label_font_size = graphicalArrow.labelFontSize
        }
        // COULEUR du texte (argb → hex).
        if (graphicalArrow.labelColor) {
          link.local.value_label_color = graphicalArrow.labelColor
        }
        // POSITION. e!Sankey sérialise la BOÎTE du label posée à l'écran
        // (locationX/Y + sizeW/H, coords document = repère des nœuds, cf.
        // EsGraphicalArrow.labelHasPos) : on la reporte via le mode ABSOLU
        // d'OpenSankey (getLabelPos : value_label_position_absolute, position_x
        // = bord GAUCHE — anchor 'start' —, position_y = CENTRE vertical —
        // baseline 'middle' —, coords monde ; même mécanique que le drag de
        // label). C'est exact au pixel près à l'import (indépendant de notre
        // reconstruction du tracé), au prix d'un label qui ne suit plus le flux
        // si l'utilisateur déplace les nœuds — même compromis, assumé, que les
        // labels de NOM des process (applyNameLabelPos). Translaté par la
        // normalisation des positions plus bas, comme les waypoints. RESTREINT
        // aux flèches mono-matériau : sur une flèche multi-flow, N labels au
        // même point exact se masqueraient l'un l'autre si réactivés à la main.
        if (graphicalArrow.labelHasPos && flows.length === 1) {
          link.local.value_label_position_absolute = true
          link.local.value_label_position_x = graphicalArrow.labelX
          link.local.value_label_position_y = graphicalArrow.labelY + graphicalArrow.labelH / 2
        } else {
          // REPLI sans locationX (aucun cas au corpus) : approximation par tiers
          // le long du tracé (segmentPercentage) + côté perpendiculaire (offsetH),
          // via les ancrages off-path value_label_horiz/vert de getLabelPos.
          if (Number.isFinite(graphicalArrow.labelSegmentPercentage)) {
            const seg = graphicalArrow.labelSegmentPercentage
            link.local.value_label_horiz = seg < 33 ? 'left' : seg > 66 ? 'right' : 'middle'
          }
          if (graphicalArrow.labelOffsetH !== 0) {
            link.local.value_label_vert = graphicalArrow.labelOffsetH >= 0 ? 'bottom' : 'top'
          }
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
      // Une flèche multi-matériaux → N flux au MÊME zorder : le tri stable
      // conserve leur ordre de déclaration entre eux.
      zOrderEntries.push({ id, z: graphicalArrow?.zorder ?? -1 })
      nodes[sourceId].outputLinksId.push(id)
      nodes[sourceId].output_value += link.value.data_value
      nodes[sourceId].links_order.push(id)
      nodes[targetId].inputLinksId.push(id)
      nodes[targetId].input_value += link.value.data_value
      nodes[targetId].links_order.push(id)
    })
  })

  // Zones libres (textes, images, rectangles) et légende.
  const { containers: labels, zorders: shapeZorders } = parseShapes(net, images, brushPalette)
  Object.entries(shapeZorders).forEach(([id, z]) => zOrderEntries.push({ id, z }))
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
    // opensankey#1301 — les points de contrôle des flux sont en coordonnées MONDE
    // (même repère que les nœuds) → translater du même dx/dy. Idem pour les
    // labels de valeur posés en ABSOLU (position monde reprise d'e!Sankey).
    Object.values(links).forEach(l => {
      const wps = l.local.shape_waypoints
      if (Array.isArray(wps)) {
        l.local.shape_waypoints = wps.map(p => ({ x: p.x + dx, y: p.y + dy }))
      }
      if (l.local.value_label_position_absolute === true) {
        l.local.value_label_position_x = (l.local.value_label_position_x as number) + dx
        l.local.value_label_position_y = (l.local.value_label_position_y as number) + dy
      }
    })
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
    fluxTags[ESANKEY_ENTRIES_TAGG_ID] = { name: 'Flux e!Sankey', banner: 'none', use_colors: true, tags }
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
  // os#1305 — plancher d'épaisseur des flux fins (seuil px, cf. calcul de
  // `minimumFlux` plus haut).
  if (minimumFlux !== null) {
    result.minimum_flux = minimumFlux
  }
  // os#1306 — masquage des zéros. e!Sankey : `net@hideZeroFlows` masque les
  // flux à quantité nulle, `net@hideZeroFlowProcesses` étend le masquage aux
  // process dont TOUS les flux sont nuls (attributs toujours EXPLICITES sur le
  // corpus : 14× / 5× true, les 5 hideZeroFlowProcesses=true étant un
  // sous-ensemble des hideZeroFlows=true). OpenSankey fait DÉJÀ les deux
  // d'office : la porte `is_not_zero` (Class_LinkElement) filtre les flux à 0,
  // et un nœud dont tous les flux sont nuls tombe avec eux
  // (Class_NodeElement.checkIfLinksVisibilitiesAreOK). Masquage DYNAMIQUE,
  // piloté par la valeur (le flux réapparaît si la donnée est éditée) — là où
  // un `is_visible=false` posé à l'import resterait figé, et où un seuil
  // `filter_link_value` epsilon (comparaison `valueCurrent >= seuil` au rendu)
  // masquerait aussi les petites valeurs 0 < v < epsilon. Donc :
  // hideZeroFlows=true → rien à poser (défaut fidèle) ; false (défaut
  // e!Sankey) → `show_zero_links: true` (option globale du drawing_area) pour
  // que les flux nuls restent tracés en trait fin comme chez e!Sankey — et
  // leurs process avec (couvre aussi hideZeroFlowProcesses=false).
  // Limite (≈, cf. NOTE-ESANKEY-MAPPING §4.4) : hideZeroFlows=true +
  // hideZeroFlowProcesses=false sur un process dont tous les flux sont nuls —
  // e!Sankey garde la boîte seule, chez nous elle disparaît avec ses flux.
  // Unique cas du corpus (« Bus Passengers », arrêt sans montée ni descente) :
  // process décor déjà `visible=false` → aucune différence visible.
  if (net.getAttribute('hideZeroFlows') !== 'true') {
    result.show_zero_links = true
  }
  // Ordre Z : zorder DÉCROISSANT (liste OpenSankey = 1er plan → fond). Tri
  // stable : les flux d'une même flèche (même zorder) gardent leur ordre de
  // déclaration. Les éléments SANS zorder (places, cf. zOrderEntries) passent
  // au 1er plan. N'est émis que si le fichier porte au moins un zorder — sinon
  // aucune info d'ordre, on laisse l'ordre de création par défaut.
  const zKnown = zOrderEntries.filter(e => e.z >= 0).sort((a, b) => b.z - a.z)
  if (zKnown.length > 0) {
    result.order_g_elements = [
      ...zOrderEntries.filter(e => e.z < 0).map(e => e.id),
      ...zKnown.map(e => e.id),
    ]
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

// Conversion TIFF → PNG À LA DEMANDE : les navigateurs ne rendent pas le TIFF.
// Le décodeur (utif2) est chargé en import DYNAMIQUE (jamais dans le bundle
// principal — uniquement quand un .sankey embarque une image TIFF), décodé puis
// rasterisé en PNG via un canvas. Renvoie null si indisponible (hors DOM, ex.
// tests) ou en cas d'échec — l'appelant retombe alors sur le TIFF brut.
const tiffToPngDataUri = async (bytes: Uint8Array): Promise<string | null> => {
  try {
    if (typeof document === 'undefined') return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('utif2')
    const UTIF = mod.default ?? mod
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    const ifds = UTIF.decode(buf)
    if (!ifds || ifds.length === 0) return null
    UTIF.decodeImage(buf, ifds[0])
    const rgba: Uint8Array = UTIF.toRGBA8(ifds[0])
    const w: number = ifds[0].width, h: number = ifds[0].height
    if (!w || !h) return null
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const img = ctx.createImageData(w, h)
    img.data.set(rgba)
    ctx.putImageData(img, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
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
        const mime = mimeFromMagic(base64)
        if (mime === 'image/tiff') {
          // TIFF non affichable tel quel : converti en PNG à la demande.
          const png = await tiffToPngDataUri(await f.async('uint8array'))
          images[f.name] = png ?? ('data:image/tiff;base64,' + base64)
        } else {
          images[f.name] = 'data:' + mime + ';base64,' + base64
        }
      })
  )
  return parseEsankeyXml(await xmlFile.async('string'), images)
}

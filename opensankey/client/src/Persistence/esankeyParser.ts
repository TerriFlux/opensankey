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
// légende, thème esankey.
// Hors périmètre (listé sur l'issue #264) : lignes libres, dégradé le long du
// flux, balance labels, pourcentages « Arrow »/« Model » (bascule simple
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
  /** Légende affichée si le fichier en contient une (mask_legend: false). */
  legend?: { mask_legend: boolean, legend_dx: number, legend_dy: number }
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

const attrNum = (el: Element | null, attr: string, fallback: number): number => {
  const raw = el?.getAttribute(attr)
  if (raw === null || raw === undefined) return fallback
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Couleurs e!Sankey : entier ARGB signé 32 bits (ex: -1073774768 = Coral
// avec alpha). On ne garde que le RGB.
const argbToHex = (argb: string | null): string | null => {
  if (argb === null) return null
  const parsed = parseInt(argb, 10)
  if (!Number.isFinite(parsed)) return null
  const rgb = (parsed >>> 0) & 0xFFFFFF
  return '#' + rgb.toString(16).padStart(6, '0').toUpperCase()
}

const normalizeStringToValidId = (text: string): string =>
  'id_' + text.replace(/[^0-9a-zA-Z]+/g, '_')

// Palette de couleurs partagée du document : les entries (et parfois process /
// shapes) ne portent pas toujours un <brushColor argb> en clair — souvent un
// <brushColorRef refId="…"> pointant une <brushColor id="…" argb="…"> définie
// ailleurs (démos « Bus Passengers » p.ex.). On indexe toutes les brushColor
// nommées (avec id) une fois, pour résoudre ces références.
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
const parseEntries = (entryGroup: Element, out: { [id: string]: EsEntry }, usedTagIds: Set<string>, palette: EsBrushPalette): void => {
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
      color: resolveBrushColorHex(entry, palette),
      tagId,
    }
  })
  const subGroups = childByTag(entryGroup, 'entryGroups')
  if (subGroups) childrenByTag(subGroups, 'entryGroup').forEach(g => parseEntries(g, out, usedTagIds, palette))
}

// ----------------------------------------------------------- Partie graphique

interface EsGraphicalProcess {
  x: number
  y: number
  color: string | null
  labelText: string
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

const parseGraphicalProcesses = (net: Element, palette: EsBrushPalette): { [id: string]: EsGraphicalProcess } => {
  const out: { [id: string]: EsGraphicalProcess } = {}
  const processes = childByTag(net, 'processes')
  if (!processes) return out
  childrenByTag(processes, 'process').forEach(p => {
    const label = childByTag(p, 'label')
    out[p.getAttribute('id') ?? ''] = {
      x: attrNum(p, 'locationX', 0),
      y: attrNum(p, 'locationY', 0),
      color: resolveBrushColorHex(p, palette),
      labelText: (label?.getAttribute('text') ?? '').replace(/\r?\n/g, ' ').trim(),
      visible: p.getAttribute('visible') !== 'false',
      imageFile: childByTag(p, 'image')?.getAttribute('filename') ?? '',
      shapeType: attrNum(p, 'shapeType', 0),
      arrowDirection: attrNum(p, 'arrowDirection', 2),
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
      base.x = Math.min(x1, x2)
      base.y = Math.min(y1, y2)
      base.label_width = Math.abs(x2 - x1) || 1
      base.label_height = Math.abs(y2 - y1) || 1
      base.shape_type = 'line'
      // '\' (flip false) = coin haut-gauche → bas-droit ; '/' (flip true) sinon.
      base.shape_line_flip = (x1 < x2) !== (y1 < y2)
      base.color_visible = false
      base.transparent_border = false
      const pen = childByTag(shape, 'penColor')
      const penHex = argbToHex(pen?.getAttribute('argb') ?? null)
      if (penHex) base.shape_border_color = penHex
      const penWidth = attrNum(pen, 'width', 1)
      if (penWidth) base.shape_border_thickness = penWidth
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

const parseLegendPosition = (net: Element): { x: number, y: number } | null => {
  const protos = childByTag(net, 'prototypes')
  const all = Array.from(net.getElementsByTagName('*'))
  const inProtos = protos ? new Set(Array.from(protos.getElementsByTagName('*'))) : new Set()
  const legend = all.find(el => el.localName === 'legend' && !inProtos.has(el))
  if (!legend) return null
  return { x: attrNum(legend, 'locationX', 0), y: attrNum(legend, 'locationY', 0) }
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

  // Palette de couleurs partagée : résout les <brushColorRef refId> (entries,
  // process, shapes) vers leur <brushColor argb>.
  const brushPalette = buildBrushColorPalette(root)

  const entries: { [id: string]: EsEntry } = {}
  const rootEntryGroup = childByTag(netModel, 'entryGroup')
  if (rootEntryGroup) parseEntries(rootEntryGroup, entries, new Set(), brushPalette)
  const graphicalProcesses = parseGraphicalProcesses(net, brushPalette)
  const graphicalArrows = parseGraphicalArrows(net)
  const nodeMapping = parseNodeMapping(root)
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
    // Process invisible (fréquent dans les diagrammes « décor » : seuls le
    // label et une icône libre marquent le nœud).
    if (graphical && !graphical.visible) nodes[id].local.shape_visible = false
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

  // Flux : un par flow de compartments (une flèche multi-matériaux e!Sankey
  // devient N flux parallèles même source/cible, chacun tagué par son entry).
  const links: { [id: string]: EsFlow } = {}
  const usedEntryIds = new Set<string>()
  const graphArrows = childByTag(netModel, 'graphArrows')
  const graphArrowList = graphArrows ? childrenByTag(graphArrows, 'graphArrow') : []
  graphArrowList.forEach(ga => {
    const fromEl = childByTag(ga, 'from')
    const toEl = childByTag(ga, 'to')
    const fromRef = fromEl ? childByTag(fromEl, 'graphProcessRef')?.getAttribute('refId') : null
    const toRef = toEl ? childByTag(toEl, 'graphProcessRef')?.getAttribute('refId') : null
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

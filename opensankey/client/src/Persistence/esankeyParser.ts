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
// Périmètre v1 : nœuds, flux, valeurs (convergées vers l'unité de base via le
// coefficient), positions/couleurs des process, couleurs par entry, échelle.
// Hors périmètre : shapes libres, images embarquées, légende/échelle
// graphiques, unitTypes multiples avec échelles indépendantes (le 1er
// unitType utilisé fixe l'échelle), export.

import JSZip from 'jszip'

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
  tags: { [id: string]: EsFluxTag }
}

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

// ------------------------------------------------------------- Modèle logique

interface EsUnit { coefficient: number }
interface EsUnitType { maximumFlow: number, width: number, used: boolean, units: { [id: string]: EsUnit } }
interface EsEntry { name: string, color: string | null, tagId: string }

const parseUnitTypes = (netModel: Element): { [id: string]: EsUnitType } => {
  const out: { [id: string]: EsUnitType } = {}
  const unitTypes = childByTag(netModel, 'unitTypes')
  if (!unitTypes) return out
  childrenByTag(unitTypes, 'unitType').forEach(ut => {
    const units: { [id: string]: EsUnit } = {}
    const unitsEl = childByTag(ut, 'units')
    if (unitsEl) childrenByTag(unitsEl, 'unit').forEach(u => {
      units[u.getAttribute('id') ?? ''] = { coefficient: attrNum(u, 'coefficient', 1) }
    })
    out[ut.getAttribute('id') ?? ''] = {
      maximumFlow: attrNum(ut, 'maximumFlow', 0),
      width: attrNum(ut, 'width', 0),
      used: ut.getAttribute('used') === 'true',
      units,
    }
  })
  return out
}

// Les entries (matériaux/énergies) peuvent être imbriquées dans des
// entryGroups : aplatissement récursif.
const parseEntries = (entryGroup: Element, out: { [id: string]: EsEntry }, usedTagIds: Set<string>): void => {
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
      color: argbToHex(childByTag(entry, 'brushColor')?.getAttribute('argb') ?? null),
      tagId,
    }
  })
  const subGroups = childByTag(entryGroup, 'entryGroups')
  if (subGroups) childrenByTag(subGroups, 'entryGroup').forEach(g => parseEntries(g, out, usedTagIds))
}

// ----------------------------------------------------------- Partie graphique

interface EsGraphicalProcess { x: number, y: number, color: string | null, labelText: string }

const parseGraphicalProcesses = (net: Element): { [id: string]: EsGraphicalProcess } => {
  const out: { [id: string]: EsGraphicalProcess } = {}
  const processes = childByTag(net, 'processes')
  if (!processes) return out
  childrenByTag(processes, 'process').forEach(p => {
    const label = childByTag(p, 'label')
    out[p.getAttribute('id') ?? ''] = {
      x: attrNum(p, 'locationX', 0),
      y: attrNum(p, 'locationY', 0),
      color: argbToHex(childByTag(p, 'brushColor')?.getAttribute('argb') ?? null),
      labelText: (label?.getAttribute('text') ?? '').replace(/\r?\n/g, ' ').trim(),
    }
  })
  return out
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
  color: '#888888',
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
  opacity: 0.85,
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
export const parseEsankeyXml = (xmlText: string): EsParsedDiagram => {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const root = doc.documentElement
  if (!root || root.localName !== 'document')
    throw new Error('Fichier e!Sankey invalide : élément <document> attendu dans esankey.xml')
  const netModel = childByTag(root, 'netModel')
  const net = childByTag(root, 'net')
  if (!netModel || !net)
    throw new Error('Fichier e!Sankey invalide : sections netModel/net absentes')

  const unitTypes = parseUnitTypes(netModel)
  const entries: { [id: string]: EsEntry } = {}
  const rootEntryGroup = childByTag(netModel, 'entryGroup')
  if (rootEntryGroup) parseEntries(rootEntryGroup, entries, new Set())
  const graphicalProcesses = parseGraphicalProcesses(net)
  const nodeMapping = parseNodeMapping(root)

  // Coefficient de conversion vers l'unité de base du unitType porteur.
  const unitCoefficient = (unitId: string | null): number => {
    if (unitId === null) return 1
    for (const ut of Object.values(unitTypes)) {
      if (unitId in ut.units) return ut.units[unitId].coefficient
    }
    return 1
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
    const compartments = childByTag(ga, 'compartments')
    const flows = compartments ? childrenByTag(compartments, 'flow') : []
    flows.forEach(flow => {
      const arrowId = ga.getAttribute('id') ?? ''
      const flowId = flow.getAttribute('id') ?? ''
      const quantity = attrNum(flow, 'quantity', 0)
      const coefficient = unitCoefficient(childByTag(flow, 'unitRef')?.getAttribute('refId') ?? null)
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
        tooltip_text: '',
        value: {
          id: id + '_v',
          data_value: quantity * coefficient,
          tags: {},
        },
      }
      if (entry) {
        link.value.tags[ESANKEY_ENTRIES_TAGG_ID] = [entry.tagId]
        usedEntryIds.add(entry.tagId)
        if (entry.color) link.local.color = entry.color
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

  // Normalisation des positions : e!Sankey stocke des coordonnées de document
  // potentiellement lointaines de l'origine ; on ramène le coin haut-gauche du
  // diagramme vers (50, 50).
  const nodeList = Object.values(nodes)
  if (nodeList.length > 0) {
    const minX = Math.min(...nodeList.map(n => n.x))
    const minY = Math.min(...nodeList.map(n => n.y))
    nodeList.forEach(n => {
      n.x = n.x - minX + 50
      n.y = n.y - minY + 50
    })
  }

  // Échelle : un unitType e!Sankey affiche `maximumFlow` (en unité de base)
  // sur `width` pixels. user_scale du front = unités pour 100 px.
  let userScale = 100
  const usedUnitType = Object.values(unitTypes).find(ut => ut.used && ut.maximumFlow > 0 && ut.width > 0)
  if (usedUnitType) userScale = (usedUnitType.maximumFlow / usedUnitType.width) * 100

  // Groupe de tags de flux : une entry = un tag (nom + couleur e!Sankey).
  // Seules les entries réellement portées par un flux sont conservées.
  const fluxTags: { [id: string]: EsFluxTagGroup } = {}
  const usedEntries = Object.values(entries).filter(e => usedEntryIds.has(e.tagId))
  if (usedEntries.length > 0) {
    const tags: { [id: string]: EsFluxTag } = {}
    usedEntries.forEach(e => {
      tags[e.tagId] = { name: e.name, selected: true, color: e.color ?? '#888888' }
    })
    fluxTags[ESANKEY_ENTRIES_TAGG_ID] = { name: 'Flux e!Sankey', banner: 'none', tags }
  }

  return {
    version: '0.9',
    nodes,
    links,
    user_scale: userScale,
    couleur_fond_sankey: argbToHex(net.getAttribute('backgroundColor')) ?? '#FFFFFF',
    style_node: { default: defaultNodeStyle() },
    style_link: { default: defaultLinkStyle() },
    grid_visible: false,
    fluxTags,
  }
}

/**
 * Dézippe un fichier `.sankey` (e!Sankey) et parse son `esankey.xml`.
 * La signature XML-DSig embarquée n'est pas vérifiée (lecture seule).
 */
export const loadEsankeyFile = async (data: ArrayBuffer): Promise<EsParsedDiagram> => {
  const zip = await JSZip.loadAsync(data)
  const xmlFile = zip.file('esankey.xml')
  if (!xmlFile)
    throw new Error('Fichier e!Sankey invalide : esankey.xml absent de l\'archive')
  return parseEsankeyXml(await xmlFile.async('string'))
}

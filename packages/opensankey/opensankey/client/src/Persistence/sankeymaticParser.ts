// Parseur SankeyMATIC natif, porté en TypeScript depuis le backend
// (server/sankeymatic.py + sankeymatic_utils.py). Produit la MÊME structure JSON
// (version 0.9) que le backend, consommée telle quelle par fromJSON du front.
// Objectif : charger le format natif SankeyMATIC 100 % côté front, sans Python.
//
// Syntaxe couverte : flux `source [valeur] cible` (avec couleur suffixe `#abc`),
// `[*]` (montant restant), lignes de couleur de nœud `:Nœud #couleur`, blocs de
// réglages (`size`, `node`, `flow`, `labels`, `labelname`, …), continuation `&`,
// retours ligne `\n` dans les noms, commentaires `//`.
//
// Le placement des nœuds (computeSankeyPosition) reproduit celui de SankeyMATIC.
// L'appelant peut, en option, relancer notre computeAutoSankey après fromJSON
// pour un rendu « OpenSankey » à la place.

type SmLocal = { [k: string]: string | number | boolean }

interface SmNode {
  id: string
  name: string
  svg_parent_group: string
  x: number
  y: number
  u: number
  v: number
  style: string
  local: SmLocal
  tags: Record<string, never>
  dimensions: Record<string, never>
  inputLinksId: string[]
  outputLinksId: string[]
  links_order: string[]
  input_value: number
  output_value: number
}

interface SmFlow {
  id: string
  is_visible: boolean
  svg_parent_group: string
  idSource: string
  idTarget: string
  style: string
  local: SmLocal
  displaying_order: number
  tooltip_text: string
  value: { id: string, data_value: number, tags: Record<string, never> }
}

type SmSettings = { [k: string]: string }

export interface SmParsedDiagram {
  version: string
  nodes: { [id: string]: SmNode }
  links: { [id: string]: SmFlow }
  user_scale: number
  couleur_fond_sankey: string
  style_node: { default: SmLocal }
  style_link: { default: SmLocal }
  grid_visible: boolean
}

// ---------------------------------------------------------------- Helpers

const randomId = (length = 5): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

const normalizeStringToValidId = (text: string): string =>
  'id_' + text.replace(/[^0-9a-zA-Z]+/g, '_')

const generateHexaColor = (): string => {
  const r = () => Math.floor(Math.random() * 256)
  const h = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return '#' + h(r()) + h(r()) + h(r())
}

const createJsonNode = (id: string, name: string): SmNode => ({
  id, name,
  svg_parent_group: 'g_nodes',
  x: 0, y: 0, u: 0, v: 0,
  style: 'default',
  local: {},
  tags: {},
  dimensions: {},
  inputLinksId: [],
  outputLinksId: [],
  links_order: [],
  input_value: 0,
  output_value: 0,
})

const createJsonFlow = (orgId: string, destId: string, value: number, color: string | null): SmFlow => {
  const flow: SmFlow = {
    id: orgId + '-->' + destId + '_' + randomId(),
    is_visible: true,
    svg_parent_group: 'g_links',
    idSource: orgId,
    idTarget: destId,
    style: 'default',
    local: {},
    displaying_order: 0,
    tooltip_text: '',
    value: { id: orgId + destId + '_' + randomId(), data_value: value, tags: {} },
  }
  if (color !== null) flow.local.color = color
  return flow
}

const sumNodeValueFromListNodeDict = (nodes: SmNode[]): number =>
  nodes.reduce((acc, n) => acc + Math.max(n.input_value, n.output_value), 0)

// ------------------------------------------------------- Regex de parsing

const ORIG_PATTERN = /.+\[/
const DEST_PATTERN = /\].+/
const VALUE_PATTERN = /\[[\d*.]+\]/
const FLOW_PATTERN = /.+\[[\d*.]+\].+/
const COLOR_PATTERN = /^:.+#[A-Za-z0-9]+\s?<{0,2}/
const COLOR_NODE_PATTERN = /^:.+#/
const COLOR_HEXA_PATTERN = /#[A-Za-z0-9]+\s?<{0,2}/

const parseSankeymaticFlow = (
  line: string
): [string, string, string, string | null] | null => {
  if (!FLOW_PATTERN.test(line)) return null
  const origs = line.match(ORIG_PATTERN)
  const dests = line.match(DEST_PATTERN)
  const values = line.match(VALUE_PATTERN)
  const colors = line.match(COLOR_HEXA_PATTERN)
  if (!origs || !dests || !values) return null
  let orig = origs[0].replace('[', ' ').replace('  ', '').replace(/\\n/g, ' ')
  let dest = dests[0].replace(']', ' ').replace('  ', '').replace(/\\n/g, ' ')
  orig = orig.replace(/\s?#[A-Za-z0-9]{3,6}/g, '')
  dest = dest.replace(/\s?#[A-Za-z0-9]{3,6}/g, '')
  const valeur = values[0].replace('[', '').replace(']', '')
  const colorFlow = colors ? colors[0] : null
  return [orig.trim(), dest.trim(), valeur, colorFlow ? colorFlow.trim() : null]
}

const parseSankeymaticNodeColor = (line: string): [string, string] | null => {
  if (!COLOR_PATTERN.test(line)) return null
  const nodePat = line.match(COLOR_NODE_PATTERN)
  const colorPat = line.match(COLOR_HEXA_PATTERN)
  if (nodePat && colorPat) {
    // Ne retirer que le ':' de tête : un ':' interne fait partie du nom.
    let nodeId = nodePat[0].slice(1).replace(' #', '').replace(/\\n/g, ' ')
    nodeId = normalizeStringToValidId(nodeId)
    const color = colorPat[0].replace('<<', ' ').replace(/\s/g, '')
    return [nodeId, color]
  }
  return null
}

// --------------------------------------------------- Parsing des réglages

const cleanListSetting = (lst: string[]): string[] => {
  const filtered = lst.filter(x => x !== '')
  if (filtered.length > 2) filtered.shift()
  return filtered
}

// Chaque groupe de réglages écrit ses clés dans l'objet setting.
const SETTING_PARSERS: { [group: string]: (lst: string[], obj: SmSettings) => void } = {
  size: (l, o) => { if (l[0] === 'w') o.size_width = l[1]; else if (l[0] === 'h') o.size_height = l[1] },
  margin: (l, o) => {
    if (l[0] === 'l') o.margin_left = l[1]
    else if (l[0] === 'r') o.margin_right = l[1]
    else if (l[0] === 't') o.margin_top = l[1]
    else if (l[0] === 'b') o.margin_bottom = l[1]
  },
  bg: (l, o) => { if (l[0] === 'color') o.bg_color = l[1]; else if (l[0] === 'transparent') o.bg_transparent = l[1] },
  node: (l, o) => {
    if (l[0] === 'color') o.node_color = l[1]
    else if (l[0] === 'w') o.node_width = l[1]
    else if (l[0] === 'h') o.node_height = l[1]
    else if (l[0] === 'spacing') o.node_spacing = l[1]
    else if (l[0] === 'border') o.node_border = l[1]
    else if (l[0] === 'theme') o.node_theme = l[1]
    else if (l[0] === 'opacity') o.node_opacity = l[1]
  },
  flow: (l, o) => {
    if (l[0] === 'color') o.flow_color = l[1]
    else if (l[0] === 'inheritfrom') o.flow_inheritfrom = l[1]
    else if (l[0] === 'opacity') o.flow_opacity = l[1]
    else if (l[0] === 'curvature') o.flow_curvature = l[1]
  },
  layout: (l, o) => {
    if (l[0] === 'order') o.layout_order = l[1]
    else if (l[0] === 'justifyorigins') o.layout_justifyorigins = l[1]
    else if (l[0] === 'justifyends') o.layout_justifyends = l[1]
    else if (l[0] === 'reversegraph') o.layout_reversegraph = l[1]
    else if (l[0] === 'attachincompletesto') o.layout_attachincompletesto = l[1]
  },
  labels: (l, o) => {
    if (l[0] === 'color') o.labels_color = l[1]
    else if (l[0] === 'hide') o.labels_hide = l[1]
    else if (l[0] === 'highlight') o.labels_highlight = l[1]
    else if (l[0] === 'fontface') o.labels_fontface = l[1]
    else if (l[0] === 'linespacing') o.labels_linespacing = l[1]
    else if (l[0] === 'relativesize') o.labels_relativesize = l[1]
    else if (l[0] === 'magnify') o.labels_magnify = l[1]
  },
  labelname: (l, o) => {
    if (l[0] === 'appears') o.label_name_appears = l[1]
    else if (l[0] === 'size') o.label_name_size = l[1]
    else if (l[0] === 'weight') o.label_name_weight = l[1]
  },
  labelvalue: (l, o) => {
    if (l[0] === 'appears') o.label_value_appears = l[1]
    else if (l[0] === 'fullprecision') o.label_value_fullprecision = l[1]
    else if (l[0] === 'position') o.label_value_position = l[1]
    else if (l[0] === 'weight') o.label_value_weight = l[1]
  },
  labelposition: (l, o) => {
    if (l[0] === 'autoalign') o.label_position_autoalign = l[1]
    else if (l[0] === 'scheme') o.label_position_scheme = l[1]
    else if (l[0] === 'first') o.label_position_first = l[1]
    else if (l[0] === 'breakpoint') o.label_position_breakpoint = l[1]
  },
  value: (l, o) => {
    if (l[0] === 'format') o.value_format = l[1]
    else if (l[0] === 'prefix') o.value_prefix = l.length === 2 ? l[1] : ''
    else if (l[0] === 'suffix') o.value_suffix = l.length === 2 ? l[1] : ''
  },
  themeoffset: (l, o) => {
    if (l[0] === 'a') o.theme_a = l[1]
    else if (l[0] === 'b') o.theme_b = l[1]
    else if (l[0] === 'c') o.theme_c = l[1]
    else if (l[0] === 'd') o.theme_d = l[1]
  },
  meta: (l, o) => {
    if (l[0] === 'mentionsankeymatic') o.meta_mentionsankeymatic = l[1]
    else if (l[0] === 'listimbalances') o.meta_listimbalances = l[1]
  },
}

// Le parsing des réglages est à état : un mot-clé de groupe (`node`, `flow`, …)
// active ce groupe pour les lignes suivantes jusqu'au prochain mot-clé ou ligne
// vide (blocs `node w 40 / h 30 / …`).
const makeSettingParser = () => {
  const tokens: { [group: string]: boolean } = {}
  Object.keys(SETTING_PARSERS).forEach(g => { tokens[g] = false })
  const disableAll = () => Object.keys(tokens).forEach(g => { tokens[g] = false })

  return (line: string, setting: SmSettings) => {
    let parts = line.split(' ')
    if (parts.length > 2 && tokens[parts[0]] !== undefined) {
      disableAll()
      tokens[parts[0]] = true
    }
    parts = cleanListSetting(parts)
    if (parts.length === 0) disableAll()
    Object.keys(tokens).forEach(g => {
      if (tokens[g]) SETTING_PARSERS[g](parts, setting)
    })
  }
}

const defaultSettings = (): SmSettings => ({
  size_width: '1000',
  size_height: '600',
  margin_left: '0',
  margin_right: '0',
  margin_top: '0',
  margin_bottom: '0',
  // Fond par défaut de SankeyMATIC : blanc (une ligne `bg color #…` l'écrase).
  bg_color: '#ffffff',
  bg_transparent: 'N',
  node_width: '20',
  node_height: '50',
  node_spacing: '50',
  node_border: '0',
  node_theme: 'none',
  node_color: '#888888',
  node_opacity: '1',
  flow_curvature: '0.5',
  flow_inheritfrom: 'outside-in',
  flow_color: '#999999',
  flow_opacity: '0.45',
  layout_order: 'automatic',
  layout_justifyorigins: 'N',
  layout_justifyends: 'N',
  layout_reversegraph: 'N',
  layout_attachincompletesto: 'nearest',
  labels_color: '#000000',
  labels_hide: 'N',
  labels_highlight: '0.8',
  labels_fontface: 'sans-serif',
  labels_linespacing: '0.2',
  labels_relativesize: '100',
  labels_magnify: '120',
  label_name_appears: 'Y',
  label_name_size: '25',
  label_name_weight: '400',
  label_value_appears: 'Y',
  label_value_fullprecision: 'Y',
  label_value_position: 'below',
  label_value_weight: '400',
  label_position_autoalign: '0',
  label_position_scheme: 'auto',
  label_position_first: 'before',
  label_position_breakpoint: '3',
  value_format: '",."',
  value_prefix: '',
  value_suffix: '',
  theme_a: '5',
  theme_b: '9',
  theme_c: '0',
  theme_d: '0',
  meta_mentionsankeymatic: 'Y',
  meta_listimbalances: 'Y',
})

// -------------------------------------------- Résolution des montants [*]

// SankeyMATIC : `[*]` = montant restant du nœud source (entrées connues moins
// sorties connues). On les résout en amont sur le texte, comme le fait le
// pré-traitement backend.
const resolveStarAmounts = (flowsText: string): string => {
  const flowRe = /^(.+?)\s*\[([^\]]+)\]\s*(.+)$/
  const inSum: { [k: string]: number } = {}
  const outSum: { [k: string]: number } = {}
  const starLines: [number, string][] = []
  const lines = flowsText.split('\n')
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('//') || line.startsWith(':')) return
    const m = line.match(flowRe)
    if (!m) return
    const src = m[1].replace(/\s*#[A-Za-z0-9]{3,8}$/, '').trim()
    const dst = m[3].replace(/\s*#[A-Za-z0-9]{3,8}$/, '').trim()
    if (m[2].trim() === '*') { starLines.push([i, src]); return }
    const v = parseFloat(m[2])
    if (isNaN(v)) return
    outSum[src] = (outSum[src] || 0) + v
    inSum[dst] = (inSum[dst] || 0) + v
  })
  starLines.forEach(([i, src]) => {
    let leftover = (inSum[src] || 0) - (outSum[src] || 0)
    leftover = Math.round(leftover * 1e6) / 1e6
    lines[i] = lines[i].replace('[*]', '[' + leftover + ']')
  })
  return lines.join('\n')
}

// --------------------------------------------------- Placement des nœuds

type NodeMap = { [id: string]: SmNode }
type FlowMap = { [id: string]: SmFlow }

const computeHorizontalIndex = (
  node: SmNode, nodes: NodeMap, links: FlowMap,
  startingIndex: number, visited: string[], indexes: { [id: string]: number }
) => {
  if (!(node.id in indexes)) indexes[node.id] = startingIndex
  else if (startingIndex > indexes[node.id]) indexes[node.id] = startingIndex
  node.outputLinksId.forEach(linkId => {
    const nextNode = nodes[links[linkId].idTarget]
    if (!visited.includes(nextNode.id)) {
      computeHorizontalIndex(nextNode, nodes, links, startingIndex + 1, [...visited, node.id], indexes)
    }
  })
}

// Placement fidèle à SankeyMATIC (port de computeSankeyPosition). Renvoie
// l'échelle (user_scale) attendue par le front.
const computeSankeyPosition = (nodes: NodeMap, links: FlowMap, setting: SmSettings): number => {
  const labelPosAutoalign = parseFloat(setting.label_position_autoalign)
  const labelPosScheme = setting.label_position_scheme
  const labelPosBreakpoint = parseFloat(setting.label_position_breakpoint)
  const labelPosFirst = setting.label_position_first
  const labelLinespacing = parseFloat(setting.labels_linespacing)
  const baseLabelSize = parseFloat(setting.label_name_size)
  const relativeLabelSize = parseFloat(setting.labels_relativesize)
  const fontSize = baseLabelSize * (relativeLabelSize / 100)
  const flowInheritance = setting.flow_inheritfrom
  const DAHeight = parseFloat(setting.size_height)
  const DAMarginTop = parseFloat(setting.margin_top)
  const DAMarginBottom = parseFloat(setting.margin_bottom)
  const nodeHeight = parseFloat(setting.node_height)

  const horizontalIndexes: { [id: string]: number } = {}
  Object.values(nodes).forEach(node => {
    if (node.inputLinksId.length === 0 && node.outputLinksId.length > 0) {
      computeHorizontalIndex(node, nodes, links, 0, [], horizontalIndexes)
    } else if (node.inputLinksId.length === 0 && node.outputLinksId.length === 0) {
      horizontalIndexes[node.id] = 0
    }
  })

  let maxHorizontalIndex = 0
  const nodesPerIndex: { [idx: number]: SmNode[] } = {}
  Object.values(nodes).forEach(node => {
    const idx = horizontalIndexes[node.id]
    if (!(idx in nodesPerIndex)) nodesPerIndex[idx] = []
    nodesPerIndex[idx].push(nodes[node.id])
    if (idx > maxHorizontalIndex) maxHorizontalIndex = idx
  })

  for (let horizontalIndex = 0; horizontalIndex < maxHorizontalIndex; horizontalIndex++) {
    if (!nodesPerIndex[horizontalIndex]) continue
    const toSplice: SmNode[] = []
    nodesPerIndex[horizontalIndex].forEach(node => {
      if (node.inputLinksId.length === 0) {
        let minNext = maxHorizontalIndex + 1
        for (const linkId of node.outputLinksId) {
          const targetNode = nodes[links[linkId].idTarget]
          if (targetNode == null) return
          if (horizontalIndexes[targetNode.id] < horizontalIndexes[node.id]) return
          if (horizontalIndexes[targetNode.id] < minNext) minNext = horizontalIndexes[targetNode.id]
        }
        if (horizontalIndexes[node.id] < minNext - 1) {
          toSplice.push(node)
          horizontalIndexes[node.id] = minNext - 1
          if (!nodesPerIndex[minNext - 1]) nodesPerIndex[minNext - 1] = []
          nodesPerIndex[minNext - 1].push(node)
        }
      }
    })
    toSplice.forEach(node => {
      nodesPerIndex[horizontalIndex] = nodesPerIndex[horizontalIndex].filter(n => n !== node)
    })
  }

  let nodeMaxValue = 0
  Object.values(nodes).forEach(v => {
    if (v.output_value > nodeMaxValue) nodeMaxValue = v.output_value
    if (v.input_value > nodeMaxValue) nodeMaxValue = v.input_value
  })

  const nodeSpacing = parseFloat(setting.node_spacing) / 100
  const greatestNodeCount = Math.max(...Object.values(nodesPerIndex).map(v => v.length))
  const vertSpace = DAHeight - DAMarginTop - DAMarginBottom
  const allAvailablePadding = Math.max(2, vertSpace - greatestNodeCount)
  const maximumNodeSpacing = ((1 - nodeHeight / 100) * allAvailablePadding) / (greatestNodeCount - 1)
  const actualNodeSpacing = maximumNodeSpacing * nodeSpacing

  const ky = Math.min(...Object.values(nodesPerIndex).map(v =>
    (vertSpace - (v.length - 1) * maximumNodeSpacing) / sumNodeValueFromListNodeDict(v)
  ))
  const DAScale = nodeMaxValue / (nodeMaxValue * ky)
  const lengthOfHorizIndex = Object.keys(nodesPerIndex).length
  const stagesMidpoint = (lengthOfHorizIndex - 1) / 2
  const horizontalColShift = parseFloat(setting.size_width) / lengthOfHorizIndex

  const firstStage = labelPosFirst === 'before' ? 'left' : 'right'
  const oppositeStage = firstStage === 'right' ? 'left' : 'left'

  const heightCumulPerIndexes: number[] = Object.values(nodesPerIndex).map(v => (v.length - 1) * actualNodeSpacing)
  const maxHeightCumul = Math.max(...heightCumulPerIndexes)

  Object.keys(nodesPerIndex).map(Number).forEach(k => {
    const ndesList = nodesPerIndex[k]
    const xShift = (k + 1) * horizontalColShift
    const uniqueSrc = new Set<string>()
    ndesList.forEach(node => node.inputLinksId.forEach(id => uniqueSrc.add(id)))
    const uniqueNodesInPrevCol = [...uniqueSrc].map(idLink => nodes[links[idLink].idSource])
    let yShift: number
    if (uniqueNodesInPrevCol.length > 0) {
      yShift = Math.min(...uniqueNodesInPrevCol.map(n => n.y)) - (heightCumulPerIndexes[k] / 2)
    } else {
      yShift = actualNodeSpacing + (maxHeightCumul - heightCumulPerIndexes[k]) / 2
    }
    ndesList.forEach(node => {
      node.x = xShift
      node.y = yShift
      yShift += Math.max(node.input_value, node.output_value) / DAScale + actualNodeSpacing
      node.local.label_vert = 'middle'
      node.local.label_vert_valeur = 'middle'
      if (labelPosScheme === 'auto') {
        if (node.inputLinksId.length === 0) {
          node.local.label_horiz = 'left'; node.local.label_horiz_valeur = 'left'
        } else if (node.outputLinksId.length === 0) {
          node.local.label_horiz = 'right'; node.local.label_horiz_valeur = 'right'
        } else if (labelPosAutoalign === -1) {
          node.local.label_horiz = 'left'; node.local.label_horiz_valeur = 'left'
        } else if (labelPosAutoalign === 0) {
          node.local.label_horiz = 'middle'; node.local.label_horiz_valeur = 'middle'
        } else if (labelPosAutoalign === 1) {
          node.local.label_horiz = 'right'; node.local.label_horiz_valeur = 'right'
        }
      } else if (labelPosScheme === 'per_stage') {
        if (k + 1 < labelPosBreakpoint || labelPosBreakpoint === 5) {
          node.local.label_horiz = firstStage; node.local.label_vert_valeur = firstStage
        } else if (k + 1 >= labelPosBreakpoint) {
          node.local.label_horiz = oppositeStage; node.local.label_vert_valeur = oppositeStage
        }
      }
    })
  })

  Object.values(nodes).forEach(node => {
    node.local.value_label_vert_shift = fontSize + fontSize * labelLinespacing
    if (!('color' in node.local)) node.local.color = generateHexaColor()
    if (setting.layout_order === 'automatic') {
      node.inputLinksId.sort((a, b) => nodes[links[a].idSource].y - nodes[links[b].idSource].y)
      node.outputLinksId.sort((a, b) => nodes[links[a].idTarget].y - nodes[links[b].idTarget].y)
      node.links_order = [...node.inputLinksId, ...node.outputLinksId]
    }
  })

  Object.values(links).forEach(link => {
    if (!('color' in link.local)) {
      if (flowInheritance === 'source') {
        link.local.color = nodes[link.idSource].local.color
      } else if (flowInheritance === 'target') {
        link.local.color = nodes[link.idTarget].local.color
      } else if (flowInheritance === 'outside-in') {
        const flowMidpoint = (horizontalIndexes[link.idSource] + horizontalIndexes[link.idTarget]) / 2
        const sourceColor = nodes[link.idSource].local.color
        link.local.color = (flowMidpoint <= stagesMidpoint) ? sourceColor : nodes[link.idTarget].local.color
      }
    }
  })

  return DAScale * 100
}

// -------------------------------------------------------- Styles par défaut

const defaultNodeStyle = (setting: SmSettings): SmLocal => {
  const baseLabelSize = parseFloat(setting.label_name_size)
  const relativeLabelSize = parseFloat(setting.labels_relativesize)
  const labelNameWeight = parseFloat(setting.label_name_weight)
  const labelValueWeight = parseFloat(setting.label_value_weight)
  const labelsHighlight = parseFloat(setting.labels_highlight)
  return {
    shape_visible: parseFloat(setting.node_opacity) > 0.5,
    shape: 'rect',
    node_width: parseFloat(setting.node_width),
    node_height: 0,
    color: '#888888',
    colorSustainable: false,
    node_arrow_angle_factor: 30,
    node_arrow_angle_direction: 'right',
    label_visible: setting.label_name_appears.toUpperCase() === 'Y',
    font_family: 'Arial,sans-serif',
    // labels_relativesize est un pourcentage : 110 => police de base x 1.1
    font_size: baseLabelSize * (relativeLabelSize / 100),
    uppercase: false,
    bold: labelNameWeight === 700,
    italic: false,
    label_box_width: 150,
    label_color: false,
    label_vert: 'bottom',
    name_label_vert_shift: 0,
    label_horiz: 'middle',
    name_label_horiz_shift: 0,
    show_value: setting.label_value_appears.toUpperCase() === 'Y',
    value_label_font_family: 'Arial,sans-serif',
    value_font_size: baseLabelSize / (100 / relativeLabelSize),
    value_label_uppercase: false,
    value_label_bold: labelValueWeight === 700,
    value_label_italic: false,
    value_label_box_width: 150,
    value_label_color: false,
    label_vert_valeur: 'top',
    value_label_vert_shift: 0,
    label_horiz_valeur: 'middle',
    value_label_horiz_shift: 0,
    value_label_background: labelsHighlight > 0.5,
    position: 'absolute',
    label_background: labelsHighlight > 0.5,
    name: 'Style par default',
  }
}

const defaultLinkStyle = (setting: SmSettings): SmLocal => {
  const flowCurvature = parseFloat(setting.flow_curvature)
  return {
    orientation: 'hh',
    left_horiz_shift: 0.05,
    starting_tangeant: flowCurvature / 2,
    ending_tangeant: flowCurvature / 2,
    right_horiz_shift: 0.05,
    curvature: 0.5,
    curved: flowCurvature !== 0,
    recycling: false,
    is_structur: false,
    arrow_size: 10,
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    label_on_path: true,
    label_pos_auto: false,
    arrow: false,
    color: '#999999',
    opacity: parseFloat(setting.flow_opacity),
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
  }
}

// ------------------------------------------------------------- Point d'entrée

/**
 * Parse un texte SankeyMATIC natif et renvoie la structure JSON (version 0.9)
 * prête pour fromJSON. Placement fidèle à SankeyMATIC ; l'appelant peut relancer
 * computeAutoSankey après fromJSON pour un rendu OpenSankey.
 */
export const parseSankeymaticText = (rawText: string): SmParsedDiagram => {
  const nodes: NodeMap = {}
  const links: FlowMap = {}
  const setting = defaultSettings()
  const parseSetting = makeSettingParser()
  const nodeColors: { [id: string]: string } = {}

  // Continuation `&` puis résolution des `[*]`.
  const linesCleared = resolveStarAmounts(rawText.replace(/&\n/g, ''))

  linesCleared.split('\n').forEach(line => {
    // Commentaires SankeyMATIC : ignorés (sinon un `//` contenant `[*]` ou
    // `[123]` serait pris pour un flux).
    if (line.trim().startsWith('//')) return
    const flow = parseSankeymaticFlow(line)
    if (flow) {
      const [orig, dest, value, color] = flow
      const orgId = normalizeStringToValidId(orig)
      const destId = normalizeStringToValidId(dest)
      const nodeOrg = nodes[orgId] || (nodes[orgId] = createJsonNode(orgId, orig))
      const nodeDest = nodes[destId] || (nodes[destId] = createJsonNode(destId, dest))
      const newFlow = createJsonFlow(nodeOrg.id, nodeDest.id, parseFloat(value), color)
      links[newFlow.id] = newFlow
      nodeOrg.outputLinksId.push(newFlow.id)
      nodeOrg.output_value += newFlow.value.data_value
      nodeOrg.links_order.push(newFlow.id)
      nodeDest.inputLinksId.push(newFlow.id)
      nodeDest.input_value += newFlow.value.data_value
      nodeDest.links_order.push(newFlow.id)
    }

    const colorRes = parseSankeymaticNodeColor(line)
    if (colorRes) nodeColors[colorRes[0]] = colorRes[1]

    parseSetting(line, setting)
  })

  // Couleurs de nœuds appliquées en seconde passe (déclaration possible avant le flux).
  Object.entries(nodeColors).forEach(([nodeId, color]) => {
    if (nodes[nodeId]) nodes[nodeId].local.color = color
  })

  if (setting.layout_reversegraph.toUpperCase() === 'Y') {
    Object.values(links).forEach(link => {
      const src = link.idSource, dst = link.idTarget
      const value = link.value.data_value
      const color = link.local.color as string
      delete links[link.id]
      const inv = createJsonFlow(dst, src, value, color)
      links[inv.id] = inv
    })
  }

  const DAScale = computeSankeyPosition(nodes, links, setting)

  return {
    version: '0.9',
    nodes,
    links,
    user_scale: DAScale,
    couleur_fond_sankey: setting.bg_color,
    style_node: { default: defaultNodeStyle(setting) },
    style_link: { default: defaultLinkStyle(setting) },
    grid_visible: false,
  }
}

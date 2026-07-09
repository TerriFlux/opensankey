// ==================================================================================================
// Parseur du format texte natif de SankeyMATIC — œuvre dérivée de
// https://github.com/nowthis/sankeymatic (syntaxe, expressions régulières,
// valeurs par défaut et sémantique des réglages).
//
// Copyright (c) 2014-2024, Steve Bogart, <sbogart@sankeymatic.com>
//
// ISC (Internet Software Consortium) License:
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS.
//
// IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING
// FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
// NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION
// WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
//
// Adaptations TypeScript : Copyright (c) 2026 TerriFlux (licence MIT du projet).
// ==================================================================================================
//
// Produit la MÊME structure JSON (version 0.9) que consommait l'ancien backend
// Python, directement digérée par `fromJSON` du front. Le format natif
// SankeyMATIC est ainsi chargé 100 % côté client, sans aller-retour serveur.
//
// Syntaxe couverte :
//   - flux  `source [valeur] cible`, avec couleur suffixe `#abc` sur la cible ;
//   - `[*]` = « le montant restant » du nœud source ;
//   - déclarations de nœud `:Nœud #couleur` avec marqueurs d'héritage `<<` / `>>` ;
//   - repositionnements manuels `move <nœud> <dx>, <dy>` (fractions de l'espace libre) ;
//   - blocs de réglages (`size`, `node`, `flow`, `labels`, `labelvalue`, …) ;
//   - `\n` dans les noms = saut de ligne, `&` en fin de ligne = continuation,
//     commentaires `//` et `'`.
//
// Le placement des nœuds est délégué à ./sankeymaticLayout (portage de sankey.js),
// nœuds fantômes et relaxation itérative compris. L'appelant peut, en option,
// relancer notre computeAutoSankey après fromJSON pour un rendu « OpenSankey ».
//
// Écart connu et assumé : `value prefix` est parsé mais non appliqué — nos labels
// de valeur ne connaissent qu'une unité SUFFIXE (`value_label_unit`). `value suffix`
// est, lui, correctement transposé.

import { computeSankeymaticLayout } from './sankeymaticLayout'
import type { Type_SmAttachIncompletes } from './sankeymaticLayout'
import { PALETTES, makeNodeColorPicker } from './sankeymaticThemes'
import { themeSankeymaticPalette } from '../types/Theme'
import type { Type_LinkColorRule, Type_StylePatch, Type_ThemeJSON } from '../types/Theme'

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
  theme: Type_ThemeJSON
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

/** `\n` dans la source SankeyMATIC = saut de ligne dans le libellé. */
const unescapeName = (text: string): string => text.replace(/\\n/g, '\n')

/** Réciproque de `unescapeName`, pour l'export. */
export const escapeName = (text: string): string => text.replace(/\n/g, '\\n')

const isYes = (v: string): boolean => /^(?:y|yes)/i.test(v.trim())

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

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

// ------------------------------------------------------- Regex de parsing

/** `source [valeur] cible` — la source est non gourmande, donc coupée au 1er `[`. */
const RE_FLOW = /^(.+?)\s*\[([^\]]+)\]\s*(.+)$/
/** Suffixe couleur sur la CIBLE d'un flux (SankeyMATIC : jamais sur la source). */
const RE_FLOW_TARGET_WITH_SUFFIX = /^(.+?)\s+(#\S+)$/
/** `:Nœud #rrggbb[.opacité] [<<|>>]` — le `#` est obligatoire, la couleur peut être vide. */
const RE_NODE_LINE = /^:(.+?)\s+#([a-f0-9]{0,6})?(\.\d{1,4})?\s*(>>|<<)?\s*(>>|<<)?\s*$/i
/** `move <nœud> <dx>, <dy>` — dx/dy sont des fractions de l'espace libre. */
const RE_MOVE_LINE = /^move\s+(.+?)\s+(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/i
/** Réglage « mot(s)-clés valeur » : `size h 600`, `flow inheritfrom outside-in`. */
const RE_SETTINGS_VALUE = /^((?:\w+\s*){1,2}) (#?[\w.$%€£-]+)$/
/** Réglage « mot(s)-clés 'texte' » : `value suffix 'M'`. Un `'` interne y est doublé. */
const RE_SETTINGS_TEXT = /^((?:\w+\s*){1,2}) '(.*)'$/
/** Une couleur SankeyMATIC valide : 3 ou 6 chiffres hexa. */
const RE_RGB_COLOR = /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i

// --------------------------------------------------- Parsing des réglages

/**
 * Table `groupe -> clé -> champ de réglage`. Le parsing est à état : un groupe
 * (`node`, `flow`, …) reste actif pour les lignes suivantes tant qu'un nouveau
 * groupe ou une ligne vide ne l'a pas remplacé — ce qui autorise les blocs
 * `node w 40` / ` h 30` / ` spacing 60`.
 */
const SETTING_FIELDS: { [group: string]: { [key: string]: string } } = {
  size: { w: 'size_width', h: 'size_height' },
  margin: { l: 'margin_left', r: 'margin_right', t: 'margin_top', b: 'margin_bottom' },
  bg: { color: 'bg_color', transparent: 'bg_transparent' },
  node: {
    color: 'node_color', w: 'node_width', h: 'node_height', spacing: 'node_spacing',
    border: 'node_border', theme: 'node_theme', opacity: 'node_opacity',
  },
  flow: {
    color: 'flow_color', inheritfrom: 'flow_inheritfrom',
    opacity: 'flow_opacity', curvature: 'flow_curvature',
  },
  layout: {
    order: 'layout_order', justifyorigins: 'layout_justifyorigins',
    justifyends: 'layout_justifyends', reversegraph: 'layout_reversegraph',
    attachincompletesto: 'layout_attachincompletesto',
  },
  labels: {
    color: 'labels_color', hide: 'labels_hide', highlight: 'labels_highlight',
    fontface: 'labels_fontface', linespacing: 'labels_linespacing',
    relativesize: 'labels_relativesize', magnify: 'labels_magnify',
  },
  labelname: { appears: 'label_name_appears', size: 'label_name_size', weight: 'label_name_weight' },
  labelvalue: {
    appears: 'label_value_appears', fullprecision: 'label_value_fullprecision',
    position: 'label_value_position', weight: 'label_value_weight',
  },
  labelposition: {
    autoalign: 'label_position_autoalign', scheme: 'label_position_scheme',
    first: 'label_position_first', breakpoint: 'label_position_breakpoint',
  },
  value: { format: 'value_format', prefix: 'value_prefix', suffix: 'value_suffix' },
  themeoffset: { a: 'theme_a', b: 'theme_b', c: 'theme_c', d: 'theme_d' },
  meta: { mentionsankeymatic: 'meta_mentionsankeymatic', listimbalances: 'meta_listimbalances' },
  // Réglages « internes » : jamais exportés par SankeyMATIC, mais importables.
  internal: { iterations: 'internal_iterations', revealshadows: 'internal_revealshadows' },
}

const makeSettingParser = () => {
  let currentGroup = ''
  return (rawLine: string, setting: SmSettings): void => {
    const line = rawLine.trim()
    if (!line) { currentGroup = ''; return }

    const textMatch = line.match(RE_SETTINGS_TEXT)
    const match = textMatch ?? line.match(RE_SETTINGS_VALUE)
    if (!match) return

    const words = match[1].trim().split(/\s+/)
    let key: string
    if (words.length === 2) { currentGroup = words[0].toLowerCase(); key = words[1].toLowerCase() }
    else if (words.length === 1) key = words[0].toLowerCase()
    else return
    if (!currentGroup) return

    const field = SETTING_FIELDS[currentGroup]?.[key]
    if (!field) return
    // Dans une valeur entre quotes, SankeyMATIC double les apostrophes internes.
    setting[field] = textMatch ? textMatch[2].replace(/''/g, "'") : match[2]
  }
}

/**
 * Valeurs par défaut. Ce ne sont PAS les planchers de `skmSettings` mais la
 * recette `default_budget` de SankeyMATIC — c'est-à-dire le diagramme que voit
 * réellement l'utilisateur qui arrive sur sankeymatic.com. C'est le bon repère :
 * notre éditeur texte n'émet aucun bloc de réglages, donc ces défauts SONT le rendu.
 */
const defaultSettings = (): SmSettings => ({
  size_width: '600',
  size_height: '600',
  margin_left: '12',
  margin_right: '12',
  margin_top: '18',
  margin_bottom: '20',
  bg_color: '#ffffff',
  bg_transparent: 'n',
  node_width: '12',
  node_height: '50',
  node_spacing: '75',
  node_border: '0',
  node_theme: 'a',
  node_color: '#777777',
  node_opacity: '1',
  flow_curvature: '0.5',
  flow_inheritfrom: 'outside-in',
  flow_color: '#999999',
  flow_opacity: '0.45',
  layout_order: 'automatic',
  layout_justifyorigins: 'n',
  layout_justifyends: 'n',
  layout_reversegraph: 'n',
  layout_attachincompletesto: 'nearest',
  labels_color: '#000000',
  labels_hide: 'n',
  labels_highlight: '0.8',
  labels_fontface: 'sans-serif',
  labels_linespacing: '0.15',
  labels_relativesize: '110',
  labels_magnify: '100',
  label_name_appears: 'y',
  label_name_size: '16',
  label_name_weight: '400',
  label_value_appears: 'y',
  label_value_fullprecision: 'y',
  label_value_position: 'below',
  label_value_weight: '400',
  label_position_autoalign: '0',
  label_position_scheme: 'auto',
  label_position_first: 'before',
  // MAXBREAKPOINT : sans `labelposition breakpoint` explicite, aucun étage ne bascule.
  label_position_breakpoint: '9999',
  value_format: ',.',
  value_prefix: '',
  value_suffix: '',
  theme_a: '6',
  theme_b: '0',
  theme_c: '0',
  theme_d: '0',
  meta_mentionsankeymatic: 'y',
  meta_listimbalances: 'y',
  internal_iterations: '25',
  internal_revealshadows: 'n',
})

// ------------------------------------------------- Patch de styles du thème

/**
 * L'apparence SankeyMATIC, exprimée en attributs MODERNES (clés de
 * `ALL_ATTRIBUTES_CONFIG`), destinée au patch `theme.styles`.
 *
 * Pourquoi en double avec `defaultNodeStyle` / `defaultLinkStyle` ? Parce que ces
 * deux-là écrivent les dicts `style_node` / `style_link` au format 0.9, qui est le
 * chemin de chargement éprouvé. Le patch, lui, sert à (RÉ)APPLIQUER le thème sur un
 * diagramme déjà ouvert, sans repasser par un import. Les deux dérivent des mêmes
 * `setting`, donc ne peuvent pas diverger sur le fond ; une fois la bascule de thème
 * validée à l'écran, les dicts 0.9 pourront disparaître au profit du seul patch.
 */
export const sankeymaticStylePatches = (
  setting: SmSettings,
  linkRule: Type_LinkColorRule
): { [style_id: string]: Type_StylePatch } => {
  const fontSize = parseFloat(setting.label_name_size) * (parseFloat(setting.labels_relativesize) / 100)
  const labelsHidden = isYes(setting.labels_hide)
  const highlighted = parseFloat(setting.labels_highlight) > 0.5
  const flowCurvature = parseFloat(setting.flow_curvature)

  const node: Type_StylePatch = {
    shape_visible: parseFloat(setting.node_opacity) > 0.5,
    shape_type: 'rect',
    shape_min_width: parseFloat(setting.node_width),
    shape_color: setting.node_color,
    shape_color_sustainable: false,
    name_label_is_visible: !labelsHidden && isYes(setting.label_name_appears),
    name_label_font_family: 'Arial,sans-serif',
    name_label_font_size: fontSize,
    name_label_bold: parseFloat(setting.label_name_weight) >= 600,
    name_label_box_width: 150,
    name_label_vert: 'middle',
    name_label_horiz: 'middle',
    name_label_background_visible: highlighted,
    value_label_is_visible: !labelsHidden && isYes(setting.label_value_appears),
    value_label_font_size: fontSize,
    value_label_background_color_visible: highlighted,
  }
  if (setting.value_suffix) {
    node.value_label_unit_visible = true
    node.value_label_unit_type = 'unit_name'
    node.value_label_unit = setting.value_suffix
  }

  const link: Type_StylePatch = {
    shape_color: setting.flow_color,
    shape_color_rule: linkRule,
    shape_opacity: parseFloat(setting.flow_opacity),
    // En deçà de 0.1, SankeyMATIC considère la courbure comme nulle.
    shape_is_curved: flowCurvature > 0.1,
    shape_curvature: 0.5,
    shape_starting_tangeant: flowCurvature / 2,
    shape_ending_tangeant: flowCurvature / 2,
    shape_starting_curve: 0.05,
    shape_ending_curve: 0.05,
    shape_orientation: 'hh',
    shape_is_arrow: false,
    shape_arrow_size: 10,
    // SankeyMATIC n'écrit jamais de valeur sur un flux.
    name_label_is_visible: false,
    value_label_is_visible: false,
  }

  return { NodeStyle: node, LinkStyle: link }
}

/**
 * Le thème `sankeymatic` complet. Appelé par le parseur avec les réglages du fichier
 * importé, et par le sélecteur de thème avec les réglages par défaut.
 */
export const buildSankeymaticTheme = (
  setting: SmSettings = defaultSettings(),
  linkRule: Type_LinkColorRule = 'source'
): Type_ThemeJSON => {
  const themeOffset = parseFloat(setting[`theme_${setting.node_theme.toLowerCase()}`] || '0') || 0
  return {
    id: 'sankeymatic',
    palette: themeSankeymaticPalette(setting.node_theme, themeOffset, linkRule),
    styles: sankeymaticStylePatches(setting, linkRule),
    globals: { couleur_fond_sankey: setting.bg_color },
  }
}

// -------------------------------------------- Résolution des montants [*]

/**
 * `[*]` = le montant restant du nœud source (entrées connues moins sorties
 * connues). Résolu en amont, sur le texte.
 *
 * Écart connu : SankeyMATIC résout ces inconnues itérativement (un `[*]` peut
 * en débloquer un autre) ; nous n'en faisons qu'une passe.
 */
const resolveStarAmounts = (flowsText: string): string => {
  const inSum: { [k: string]: number } = {}
  const outSum: { [k: string]: number } = {}
  const starLines: [number, string][] = []
  const lines = flowsText.split('\n')
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('//') || line.startsWith("'") || line.startsWith(':')) return
    const m = line.match(RE_FLOW)
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

// ------------------------------------------------------ Lignes du diagramme

interface RawFlow { src: string, dst: string, value: number, color: string | null, row: number }
/** `<<` = ce nœud peint ses flux ENTRANTS ; `>>` = ses flux SORTANTS. */
interface NodeDecl { color: string | null, paintBefore: boolean, paintAfter: boolean }

const parseFlowLine = (line: string, row: number): RawFlow | null => {
  const m = line.match(RE_FLOW)
  if (!m) return null
  const value = parseFloat(m[2])
  if (!Number.isFinite(value)) return null

  let target = m[3].trim()
  let color: string | null = null
  const suffixed = target.match(RE_FLOW_TARGET_WITH_SUFFIX)
  if (suffixed && RE_RGB_COLOR.test(suffixed[2])) {
    target = suffixed[1].trim()
    color = suffixed[2]
  }
  return { src: unescapeName(m[1].trim()), dst: unescapeName(target), value, color, row }
}

const parseNodeDeclLine = (line: string): { name: string, decl: NodeDecl } | null => {
  const m = line.match(RE_NODE_LINE)
  if (!m) return null
  const hex = m[2] ? '#' + m[2] : ''
  const markers = [m[4], m[5]]
  return {
    name: unescapeName(m[1].trim()),
    decl: {
      color: RE_RGB_COLOR.test(hex) ? hex : null,
      paintBefore: markers.includes('<<'),
      paintAfter: markers.includes('>>'),
    },
  }
}

// -------------------------------------------------------- Styles par défaut

const defaultNodeStyle = (setting: SmSettings): SmLocal => {
  const fontSize = parseFloat(setting.label_name_size) * (parseFloat(setting.labels_relativesize) / 100)
  const labelsHidden = isYes(setting.labels_hide)
  const style: SmLocal = {
    shape_visible: parseFloat(setting.node_opacity) > 0.5,
    shape: 'rect',
    node_width: parseFloat(setting.node_width),
    node_height: 0,
    color: setting.node_color,
    colorSustainable: false,
    node_arrow_angle_factor: 30,
    node_arrow_angle_direction: 'right',
    label_visible: !labelsHidden && isYes(setting.label_name_appears),
    font_family: 'Arial,sans-serif',
    font_size: fontSize,
    uppercase: false,
    bold: parseFloat(setting.label_name_weight) >= 600,
    italic: false,
    label_box_width: 150,
    label_color: false,
    label_vert: 'bottom',
    name_label_vert_shift: 0,
    label_horiz: 'middle',
    name_label_horiz_shift: 0,
    show_value: !labelsHidden && isYes(setting.label_value_appears),
    value_label_font_family: 'Arial,sans-serif',
    value_font_size: fontSize,
    value_label_uppercase: false,
    value_label_bold: parseFloat(setting.label_value_weight) >= 600,
    value_label_italic: false,
    value_label_box_width: 150,
    value_label_color: false,
    label_vert_valeur: 'top',
    value_label_vert_shift: 0,
    label_horiz_valeur: 'middle',
    value_label_horiz_shift: 0,
    value_label_background: parseFloat(setting.labels_highlight) > 0.5,
    position: 'absolute',
    label_background: parseFloat(setting.labels_highlight) > 0.5,
    name: 'Style par default',
  }
  // `value suffix` -> unité suffixe de nos labels de valeur. (`value prefix` n'a
  // pas d'équivalent : nos libellés ne savent pas préfixer.)
  if (setting.value_suffix) {
    style.value_label_unit_visible = true
    style.value_label_unit_type = 'unit_name'
    style.value_label_unit = setting.value_suffix
  }
  return style
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
    // SankeyMATIC : en deçà de 0.1, la courbe produit des artefacts — c'est « plat ».
    curved: flowCurvature > 0.1,
    recycling: false,
    is_structur: false,
    arrow_size: 10,
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    label_on_path: true,
    label_pos_auto: false,
    arrow: false,
    color: setting.flow_color,
    opacity: parseFloat(setting.flow_opacity),
    dashed: false,
    label_visible: false,
    // Nom d'attribut MODERNE, écrit tel quel. La table de renommage 0.91->0.92 des
    // styles de flux (SankeyPersistence.fromJSON_0_91) mappe `label_visible` vers
    // `name_label_is_visible` — la ligne vers `value_label_is_visible` y est commentée.
    // Les valeurs de flux resteraient donc affichées, contrairement à SankeyMATIC.
    // La fin de StylePersistence.fromJSON recopie verbatim toute clé de
    // ALL_ATTRIBUTES_CONFIG : on court-circuite la migration trouée.
    value_label_is_visible: false,
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

// ------------------------------------------------------- Placement des labels

/**
 * Ancrage horizontal du libellé, d'après `labelposition scheme`.
 * Chez SankeyMATIC, l'ancre SVG `end` place le texte À GAUCHE du nœud et `start`
 * à sa droite ; on traduit directement en `left` / `right`.
 */
const labelAnchor = (
  setting: SmSettings,
  stage: number,
  hasInputs: boolean,
  hasOutputs: boolean
): 'left' | 'middle' | 'right' => {
  if (setting.label_position_scheme === 'per_stage') {
    const bp = parseFloat(setting.label_position_breakpoint) - 1
    const anchorAtEnd = setting.label_position_first === 'before' ? stage < bp : stage >= bp
    return anchorAtEnd ? 'left' : 'right'
  }
  // Schéma « auto » : le libellé va du côté vide, s'il y en a un.
  if (!hasInputs) return 'left'
  if (!hasOutputs) return 'right'
  switch (parseFloat(setting.label_position_autoalign)) {
    case -1: return 'left'
    case 1: return 'right'
    default: return 'middle'
  }
}

// ------------------------------------------------------------- Point d'entrée

/**
 * Parse un texte SankeyMATIC natif et renvoie la structure JSON (version 0.9)
 * prête pour `fromJSON`. Placement fidèle à SankeyMATIC ; l'appelant peut relancer
 * `computeAutoSankey` après `fromJSON` pour un rendu OpenSankey.
 */
export const parseSankeymaticText = (rawText: string): SmParsedDiagram => {
  const setting = defaultSettings()
  const parseSetting = makeSettingParser()
  const decls = new Map<string, NodeDecl>()
  const moves = new Map<string, [number, number]>()
  const rawFlows: RawFlow[] = []

  // `&` en fin de ligne = continuation, puis résolution des `[*]`.
  const lines = resolveStarAmounts(rawText.replace(/&\n/g, '')).split('\n')

  lines.forEach((raw, row) => {
    const line = raw.trim()
    // Une ligne vide referme le bloc de réglages courant.
    if (!line) { parseSetting('', setting); return }
    if (line.startsWith('//') || line.startsWith("'")) return

    const mv = line.match(RE_MOVE_LINE)
    if (mv) { moves.set(unescapeName(mv[1].trim()), [Number(mv[2]), Number(mv[3])]); return }

    const nd = parseNodeDeclLine(line)
    if (nd) {
      // Un nœud peut être déclaré plusieurs fois : on fusionne.
      const prev = decls.get(nd.name)
      decls.set(nd.name, prev
        ? {
          color: nd.decl.color ?? prev.color,
          paintBefore: prev.paintBefore || nd.decl.paintBefore,
          paintAfter: prev.paintAfter || nd.decl.paintAfter,
        }
        : nd.decl)
      return
    }

    const fl = parseFlowLine(line, row)
    if (fl) { rawFlows.push(fl); return }

    parseSetting(line, setting)
  })

  const graphIsReversed = isYes(setting.layout_reversegraph)
  if (graphIsReversed) {
    // Inverser AVANT de bâtir le graphe : les listes de liens, les valeurs
    // entrantes/sortantes et les ids restent ainsi cohérents.
    rawFlows.forEach((f) => { const s = f.src; f.src = f.dst; f.dst = s })
  }

  // --------------------------------------------------- Construction du graphe

  const nodes: { [id: string]: SmNode } = {}
  const links: { [id: string]: SmFlow } = {}
  /** Ids des nœuds dans leur ordre d'apparition dans la source (= sourceRow). */
  const nodeOrder: string[] = []
  const nodeSourceRow = new Map<string, number>()
  const linkOrder: string[] = []

  const touchNode = (name: string, row: number): SmNode => {
    const id = normalizeStringToValidId(name)
    let node = nodes[id]
    if (!node) {
      node = nodes[id] = createJsonNode(id, name)
      nodeOrder.push(id)
      nodeSourceRow.set(id, row)
    }
    return node
  }

  rawFlows.forEach((f) => {
    const nodeOrg = touchNode(f.src, f.row)
    const nodeDest = touchNode(f.dst, f.row)
    const newFlow = createJsonFlow(nodeOrg.id, nodeDest.id, f.value, f.color)
    links[newFlow.id] = newFlow
    linkOrder.push(newFlow.id)
    nodeOrg.outputLinksId.push(newFlow.id)
    nodeOrg.output_value += f.value
    nodeDest.inputLinksId.push(newFlow.id)
    nodeDest.input_value += f.value
  })

  if (nodeOrder.length === 0) {
    return {
      version: '0.9',
      nodes, links,
      user_scale: 100,
      couleur_fond_sankey: setting.bg_color,
      style_node: { default: defaultNodeStyle(setting) },
      style_link: { default: defaultLinkStyle(setting) },
      grid_visible: false,
      theme: buildSankeymaticTheme(setting, 'flow'),
    }
  }

  // ------------------------------------------------------------- Placement

  const marginLeft = parseFloat(setting.margin_left)
  const marginTop = parseFloat(setting.margin_top)
  // La zone de dessin exclut les marges ; au moins 1px pour éviter une division nulle.
  const width = Math.max(1, parseFloat(setting.size_width) - marginLeft - parseFloat(setting.margin_right))
  const height = Math.max(1, parseFloat(setting.size_height) - marginTop - parseFloat(setting.margin_bottom))

  const nodeIndex = new Map(nodeOrder.map((id, i) => [id, i]))
  // Index d'un flux dans `layout.flows` (les ombres sont ajoutées ensuite, donc
  // les M premiers flux du layout correspondent à `linkOrder`, dans le même ordre).
  const linkIndex = new Map(linkOrder.map((id, i) => [id, i]))
  const layout = computeSankeymaticLayout(
    {
      nodes: nodeOrder.map((id) => ({ name: nodes[id].name, sourceRow: nodeSourceRow.get(id) as number })),
      flows: linkOrder.map((lid, row) => ({
        source: nodeIndex.get(links[lid].idSource) as number,
        target: nodeIndex.get(links[lid].idTarget) as number,
        value: links[lid].value.data_value,
        sourceRow: row,
      })),
    },
    {
      width,
      height,
      nodeWidth: parseFloat(setting.node_width),
      nodeHeightFactor: parseFloat(setting.node_height) / 100,
      nodeSpacingFactor: parseFloat(setting.node_spacing) / 100,
      leftJustifyOrigins: isYes(setting.layout_justifyorigins),
      rightJustifyEndpoints: isYes(setting.layout_justifyends),
      autoLayout: setting.layout_order === 'automatic',
      attachIncompletesTo: setting.layout_attachincompletesto as Type_SmAttachIncompletes,
      iterations: parseFloat(setting.internal_iterations),
    }
  )

  // Hauteur d'un nœud (px) = value * ky ; le front la recalcule via
  // `value / user_scale * 100`, d'où user_scale = 100 / ky.
  const userScale = 100 / layout.ky
  const stagesMidpoint = (layout.stages.length - 1) / 2

  const fontSize = parseFloat(setting.label_name_size) * (parseFloat(setting.labels_relativesize) / 100)
  const lineShift = fontSize + fontSize * parseFloat(setting.labels_linespacing)
  const valuePosition = setting.label_value_position

  nodeOrder.forEach((id, i) => {
    const ln = layout.nodes[i]
    const node = nodes[id]

    // `move <nœud> <dx>, <dy>` : fractions de l'espace libre, bornées au canvas.
    const mv = moves.get(node.name)
    if (mv) {
      const availableW = width - ln.dx
      const availableH = height - ln.dy
      const mx = mv[0] * (graphIsReversed ? -1 : 1)
      ln.x = clamp(ln.x + availableW * mx, 0, availableW)
      ln.y = clamp(ln.y + availableH * mv[1], 0, availableH)
    }

    node.x = marginLeft + ln.x
    node.y = marginTop + ln.y

    const anchor = labelAnchor(setting, ln.stage, ln.flowsIn.length > 0, ln.flowsOut.length > 0)
    node.local.label_vert = 'middle'
    node.local.label_vert_valeur = 'middle'
    node.local.label_horiz = anchor
    node.local.label_horiz_valeur = anchor
    // `labelvalue position` : la valeur se décale d'une ligne sous ou sur le nom.
    // (`before` / `after` la mettraient sur la même ligne : non transposable ici.)
    node.local.value_label_vert_shift
      = valuePosition === 'above' ? -lineShift : valuePosition === 'below' ? lineShift : 0

    // Ordre des liens autour du nœud = ordre vertical calculé par le layout.
    const flowOf = (lid: string) => layout.flows[linkIndex.get(lid) as number]
    node.inputLinksId.sort((a, b) => flowOf(a).ty - flowOf(b).ty)
    node.outputLinksId.sort((a, b) => flowOf(a).sy - flowOf(b).sy)
    node.links_order = [...node.inputLinksId, ...node.outputLinksId]
  })

  // ------------------------------------------------------------- Couleurs

  const themeOffset = parseFloat(setting[`theme_${setting.node_theme.toLowerCase()}`] || '0') || 0
  const palette = PALETTES[setting.node_theme.toLowerCase()] ?? []
  // `node theme none` (ou un thème inconnu) : pas de palette, tout le monde prend `node color`.
  const pickNodeColor = palette.length > 0
    ? makeNodeColorPicker(palette, themeOffset)
    : () => setting.node_color

  // DÉ-CUISSON (cf. NOTE-THEMES.md) : seules les couleurs DÉCLARÉES dans la source
  // descendent dans `node.local`, qui est le niveau de priorité le plus haut de la
  // cascade. Les autres sont dérivées à la volée par `Sankey.themeNodeColor`, qui
  // parcourt les nœuds dans le même ordre d'insertion et saute ceux qui portent une
  // couleur explicite : les deux attributions coïncident donc exactement.
  //
  // On calcule tout de même les teintes ici, car `outside-in` en a besoin ci-dessous.
  const nodeColorOf: { [id: string]: string } = {}
  nodeOrder.forEach((id) => {
    const node = nodes[id]
    const declared = decls.get(node.name)?.color
    if (declared) node.local.color = declared
    // Une couleur déclarée ne consomme pas de teinte de la palette (comme SankeyMATIC).
    nodeColorOf[id] = declared ?? pickNodeColor(node.name)
  })

  /** `<<`/`>>` sont relatifs au SENS DE LECTURE : un graphe inversé les échange. */
  const paints = (name: string) => {
    const d = decls.get(name)
    if (!d) return { before: false, after: false }
    return graphIsReversed
      ? { before: d.paintAfter, after: d.paintBefore }
      : { before: d.paintBefore, after: d.paintAfter }
  }

  const flowInheritance = setting.flow_inheritfrom
  // `source` / `target` deviennent une RÈGLE VIVANTE portée par le style de flux
  // (`shape_color_rule`), et non des couleurs recopiées. `outside-in` n'a pas
  // d'équivalent — il dépend des étages, que le modèle ne stocke pas — donc on le
  // cuit en couleurs locales. Idem pour `none`, qui laisse la couleur du style.
  const linkRule: Type_LinkColorRule
    = flowInheritance === 'source' ? 'source'
      : flowInheritance === 'target' ? 'target'
        : 'flow'

  /** Une couleur posée sur un flux n'est lue que si sa règle vaut `flow`. */
  const paintLink = (link: SmFlow, color: string) => {
    link.local.color = color
    link.local.color_rule = 'flow'
  }

  linkOrder.forEach((lid, i) => {
    const link = links[lid]
    const source = nodes[link.idSource]
    const target = nodes[link.idTarget]

    // Une couleur donnée directement au flux l'emporte sur tout — mais elle serait
    // court-circuitée par la règle `source`/`target`, d'où le `color_rule: 'flow'`.
    if ('color' in link.local) { link.local.color_rule = 'flow'; return }

    // Peinture explicite d'un nœud (`<<` / `>>`) : idem, c'est un choix local.
    if (paints(source.name).after) { paintLink(link, nodeColorOf[link.idSource]); return }
    if (paints(target.name).before) { paintLink(link, nodeColorOf[link.idTarget]); return }

    if (flowInheritance === 'outside-in') {
      const lf = layout.flows[i]
      const flowMidpoint = (lf.source.stage + lf.target.stage) / 2
      // Au milieu exact, SankeyMATIC prend la couleur de la source.
      paintLink(link, flowMidpoint <= stagesMidpoint ? nodeColorOf[link.idSource] : nodeColorOf[link.idTarget])
    }
    // `source` / `target` : rien en local, la règle du style s'en charge.
    // `none` : le flux garde la couleur par défaut du style.
  })

  const style_link = defaultLinkStyle(setting)
  style_link.color_rule = linkRule

  return {
    version: '0.9',
    nodes,
    links,
    user_scale: userScale,
    couleur_fond_sankey: setting.bg_color,
    style_node: { default: defaultNodeStyle(setting) },
    style_link: { default: style_link },
    grid_visible: false,
    theme: buildSankeymaticTheme(setting, linkRule),
  }
}

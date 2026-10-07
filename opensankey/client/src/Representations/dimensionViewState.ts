// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 06/10/2026 — LE MODÈLE COMMUN couronne · Sankey · tableau croisé (os#1511, refonte « rôles
// communs », lot 1 sur 5 : modèle pur, rien n'est branché).
//
// Trois représentations, une même grammaire (validée par Julien). Pour chaque dimension :
//   RÔLE      `none`  elle ne découpe pas : elle se lit au total, ou à sa portée ;
//             `parts` elle découpe À L'INTÉRIEUR de la figure ;
//             `cases` une figure par membre ;
//   VARIANTE  par représentation : couronne secteurs | sunburst ; Sankey bandes | nœuds | expansion ;
//             tableau lignes (dépliables). Une dimension garde la variante de chaque représentation :
//             passer de la couronne au Sankey et revenir rend le sunburst qu'on avait ;
//   MEMBRES   `focus` (portée), `shown` (antichaîne : mixte permis), `hidden` (décochés) ;
//   PROFONDEUR elle se LIT sur `shown` : les ancêtres stricts des montrés sous la portée sont les
//             OUVERTS (anneaux du sunburst, nœuds de l'expansion, lignes ouvertes du tableau). On
//             déplie nœud par nœud (`expandMember`) ou niveau par niveau (`showLevel`). Une seule
//             source : un `depth` stocké à côté de `shown` finirait par le contredire.
//   ORDRE     `order` : anneau intérieur → extérieur = regroupement par nœud → par membre =
//             lignes → colonnes. La dimension en `cases` passe en dernier.
//
// Correspondance des libellés actuels (on les GARDE dans l'interface, cf. `choiceOfLabel`) :
//   couronne  secteurs / sunburst = parts ; une couronne par membre = cases ;
//   Sankey    un membre à la fois = none ; bandes / nœuds / expansion = parts ;
//             un diagramme par membre = cases (nœuds rangés en bandes, une par membre) ;
//   tableau   lignes = parts ; colonnes = cases.
//
// L'état est une INTERFACE à trois sources :
//   - le DIAGRAMME, qui garde son état dans le modèle (bannière, sélection, nœuds porteurs,
//     `member_bands`) : `fromDiagram` le lit, `toDiagramPatch` DÉCRIT les écritures sans les faire ;
//   - la figure LIÉE (Suit / Épinglée) : membres montrés = la sélection du diagramme ;
//   - la figure DÉTACHÉE : tout est à elle, sous la clé `couronne` (`couronneState`), que
//     `fromFigure` / `toFigureOptions` lisent et écrivent (anciens formats compris).
// `planFor` dit ce que chaque représentation dessinerait de l'état.
//
// Module PUR : aucune classe instanciée, aucun React, aucun DOM.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { dimensionRootsOf, openedForSelection } from '../Charts/DataDimensionHierarchy'
import { drawPlanOf } from '../Charts/couronnePlan'
import type { Type_DrawPlan } from '../Charts/couronnePlan'
import { matrixCutOfCouronne } from '../Charts/DimensionMatrix'
import { memberSectorId } from '../Charts/memberSectorId'
import { isGeneratedMemberId } from '../Elements/GeneratedMemberMark'
import {
  antichainOf, COURONNE_KEY, readCouronneState, writeCouronneState
} from './couronneState'
import type { Type_CouronneDimensionState, Type_CouronneSankey, Type_CouronneState } from './couronneState'

// ── LES TYPES ────────────────────────────────────────────────────────────────────────────────────

export type Type_Representation = 'couronne' | 'sankey' | 'matrix'
export type Type_DimensionRole = 'none' | 'parts' | 'cases'
export type Type_CouronneVariant = 'sectors' | 'sunburst'
export type Type_SankeyVariant = 'bands' | 'nodes' | 'expansion'
export type Type_MatrixVariant = 'rows'
/** Le regroupement que l'ordre produit : par nœud (les parts dans chaque figure) ou par membre (les cases). */
export type Type_Grouping = 'by_node' | 'by_member'

export interface Type_DimensionVariants {
  couronne: Type_CouronneVariant
  sankey: Type_SankeyVariant
  matrix: Type_MatrixVariant
}

export const DEFAULT_VARIANTS: Type_DimensionVariants = { couronne: 'sectors', sankey: 'bands', matrix: 'rows' }

/** Ce que le diagramme porte d'une dimension et que le modèle commun ne sait pas déduire. */
export interface Type_DiagramExtras {
  /** La bannière (`one`, `multi`, `sequence`, `none`…), gardée pour ne pas réécrire une séquence en « un membre ». */
  banner: string
  /** Les nœuds qui la portent (`driving_dimension`), hors nœuds engendrés. */
  carriers: string[]
  /** `undefined` = automatique (bandes par membre dès deux porteurs). */
  member_bands: boolean | undefined
}

export interface Type_DimensionView {
  role: Type_DimensionRole
  /** Le rôle que reprend une dimension remise en jeu (couronne : désactivée, elle garde « une couronne par membre »). */
  resume: 'parts' | 'cases'
  variants: Type_DimensionVariants
  /** La portée (antichaîne) ; vide = la racine. En rôle `none`, c'est là que la dimension se lit. */
  focus: string[]
  /** Les membres montrés (antichaîne, mixte permis). Liée : la sélection du diagramme projetée. */
  shown: string[]
  /** Les décochés (⊂ `shown`), qui gardent leur ligne. */
  hidden: string[]
  /** Source diagramme seulement. */
  diagram?: Type_DiagramExtras
}

export type Type_ViewSource = 'diagram' | 'linked' | 'detached'

export interface Type_DimensionViewState {
  source: Type_ViewSource
  /** Membres montrés partagés avec le diagramme (diagramme lui-même, ou fenêtre Suit / Épinglée). */
  linked: boolean
  order: string[]
  dims: { [dimension_id: string]: Type_DimensionView }
}

/** Ce que ce module lit d'un Sankey : ses dimensions, et ses nœuds pour les porteurs. */
export interface Type_ViewSankey extends Type_CouronneSankey {
  nodes_list?: unknown[]
}

type Type_Options = { [key: string]: unknown }

// ── LES LIBELLÉS ACTUELS ↔ (RÔLE, VARIANTE, REGROUPEMENT) ────────────────────────────────────────

/** Les libellés du sélecteur de dessin, tels qu'ils sont aujourd'hui (clés `Banner.draw_*`). */
export type Type_CouronneLabel = 'sectors' | 'sunburst' | 'multiples'
/** `one` « Un membre à la fois », `bands`, `nodes`, `expansion` (à ajouter), `member_bands` « Un diagramme par membre ». */
export type Type_SankeyLabel = 'one' | 'bands' | 'nodes' | 'expansion' | 'member_bands'
/** Le tableau : la dimension en lignes ou en colonnes. */
export type Type_MatrixLabel = 'rows' | 'columns'
export type Type_DrawingLabel = Type_CouronneLabel | Type_SankeyLabel | Type_MatrixLabel

export const DRAWING_LABELS: { [r in Type_Representation]: readonly Type_DrawingLabel[] } = {
  couronne: ['sectors', 'sunburst', 'multiples'],
  sankey: ['one', 'bands', 'nodes', 'expansion', 'member_bands'],
  matrix: ['rows', 'columns']
}

export interface Type_DrawingChoice {
  role: Type_DimensionRole
  /** La variante de la représentation ; absente pour `none` et `cases` (hors Sankey, où les cases sont des nœuds). */
  variant?: Type_CouronneVariant | Type_SankeyVariant | Type_MatrixVariant
  grouping: Type_Grouping
}

/** Un libellé du sélecteur, traduit en rôle + variante + regroupement. `undefined` : libellé inconnu. */
export const choiceOfLabel = (representation: Type_Representation, label: string): Type_DrawingChoice | undefined => {
  if (!(DRAWING_LABELS[representation] as readonly string[]).includes(label)) return undefined
  switch (label) {
    case 'one': return { role: 'none', grouping: 'by_node' }
    case 'multiples':
    case 'columns': return { role: 'cases', grouping: 'by_member' }
    case 'member_bands': return { role: 'cases', variant: 'nodes', grouping: 'by_member' }
    default: return { role: 'parts', variant: label as Type_DrawingChoice['variant'], grouping: 'by_node' }
  }
}

/**
 * Le libellé qu'affiche le sélecteur d'une représentation pour une dimension. `null` : la
 * représentation n'a pas de libellé pour ce rôle (couronne ou tableau, dimension qui ne découpe pas).
 */
export const labelOfDimension = (representation: Type_Representation, d: Pick<Type_DimensionView, 'role' | 'variants'>): Type_DrawingLabel | null => {
  if (representation === 'sankey') {
    if (d.role === 'none') return 'one'
    if (d.role === 'cases') return 'member_bands'
    return d.variants.sankey
  }
  if (d.role === 'none') return null
  if (representation === 'couronne') return d.role === 'cases' ? 'multiples' : d.variants.couronne
  return d.role === 'cases' ? 'columns' : 'rows'
}

/**
 * Pose une variante, et aligne la PROFONDEUR des autres représentations : sunburst = expansion
 * (plusieurs niveaux dessinés) ; secteurs = bandes ou nœuds (la frontière seule). Le tableau montre
 * toujours ses lignes ouvertes.
 */
export const withVariant = (
  variants: Type_DimensionVariants, representation: Type_Representation, variant: string
): Type_DimensionVariants => {
  const out = { ...variants }
  if (representation === 'couronne' && (variant === 'sectors' || variant === 'sunburst')) {
    out.couronne = variant
    if (variant === 'sunburst') out.sankey = 'expansion'
    else if (out.sankey === 'expansion') out.sankey = 'bands'
  } else if (representation === 'sankey' && (variant === 'bands' || variant === 'nodes' || variant === 'expansion')) {
    out.sankey = variant
    out.couronne = variant === 'expansion' ? 'sunburst' : 'sectors'
  } else if (representation === 'matrix' && variant === 'rows') out.matrix = variant
  return out
}

/** Applique un libellé du sélecteur à une dimension : rôle, variante (alignée), rôle de reprise. */
export const applyLabel = (d: Type_DimensionView, representation: Type_Representation, label: string): Type_DimensionView => {
  const choice = choiceOfLabel(representation, label)
  if (choice === undefined) return d
  const variants = choice.variant !== undefined ? withVariant(d.variants, representation, choice.variant) : d.variants
  const resume = choice.role === 'none' ? d.resume : choice.role
  return { ...d, role: choice.role, resume, variants }
}

/** Le regroupement que produit un état : par membre dès qu'une dimension fait les cases. */
export const groupingOf = (state: Type_DimensionViewState): Type_Grouping =>
  state.order.some(id => state.dims[id]?.role === 'cases') ? 'by_member' : 'by_node'

// ── LA PROFONDEUR ────────────────────────────────────────────────────────────────────────────────

const memberOf = (dim: Class_DataTagGroup, id: string): Class_DataTag | undefined =>
  dim.tags_dict[id] as Class_DataTag | undefined

const childrenOf = (m: Class_DataTag): Class_DataTag[] => m.children as Class_DataTag[]

/** Les membres d'entrée : sous la portée, sinon sous la racine unique, sinon les racines. */
const entryOf = (dim: Class_DataTagGroup, focus: string[]): Class_DataTag[] => {
  const F = focus.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)
  if (F.length > 0) return F
  return dimensionRootsOf(dim)
}

/**
 * Les OUVERTS : ancêtres stricts des montrés, sous la portée (la portée elle-même et ce qui est
 * au-dessus n'en sont pas). Le sunburst en fait ses anneaux intérieurs, l'expansion ses nœuds
 * parents, le tableau ses sous-totaux.
 */
export const openedOf = (dim: Class_DataTagGroup, d: Pick<Type_DimensionView, 'focus' | 'shown'>): string[] => {
  const above = new Set<string>()
  d.focus.forEach(id => {
    for (let m = memberOf(dim, id); m !== undefined; m = m.parent as Class_DataTag | undefined) above.add(m.id)
  })
  const roots = dimensionRootsOf(dim)
  if (d.focus.length === 0 && roots.length === 1) above.add(roots[0].id)
  const opened = openedForSelection(dim, d.shown)
  return antichainSorted(dim, [...opened].filter(id => !above.has(id)))
}

/** Les profondeurs des montrés, croissantes ; plusieurs = MIXTE. */
export const depthsOf = (dim: Class_DataTagGroup, d: Pick<Type_DimensionView, 'shown'>): number[] =>
  [...new Set(d.shown.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)
    .map(m => dim.depthOf(m)))].sort((a, b) => a - b)

/** Des ids dans l'ordre de la dimension (sans réduire en antichaîne). */
const antichainSorted = (dim: Class_DataTagGroup, ids: string[]): string[] => {
  const rank = new Map<string, number>()
  const visit = (m: Class_DataTag) => { rank.set(m.id, rank.size); childrenOf(m).forEach(visit) }
  dimensionRootsOf(dim).forEach(visit)
  return [...new Set(ids)].filter(id => rank.has(id)).sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
}

/**
 * DÉPLIER UN NŒUD (mixte) : un membre montré cède sa place à ses enfants. Une feuille, ou un membre
 * non montré, ne change rien. Un décoché déplié donne des enfants décochés.
 */
export const expandMember = (dim: Class_DataTagGroup, d: Type_DimensionView, member_id: string): Type_DimensionView => {
  const m = memberOf(dim, member_id)
  if (m === undefined || !d.shown.includes(member_id) || childrenOf(m).length === 0) return d
  const kids = childrenOf(m).map(c => c.id)
  const shown = antichainOf(dim, [...d.shown.filter(id => id !== member_id), ...kids])
  const hidden = d.hidden.includes(member_id)
    ? [...d.hidden.filter(id => id !== member_id), ...kids]
    : d.hidden
  return { ...d, shown, hidden: antichainOf(dim, hidden).filter(id => shown.includes(id)) }
}

/** REPLIER UN NŒUD : ses descendants montrés cèdent la place au membre. La portée ne se replie pas. */
export const collapseMember = (dim: Class_DataTagGroup, d: Type_DimensionView, member_id: string): Type_DimensionView => {
  const m = memberOf(dim, member_id)
  if (m === undefined || d.focus.includes(member_id)) return d
  const under = d.shown.filter(id => { const s = memberOf(dim, id); return s !== undefined && s.hasAncestor(m) })
  if (under.length === 0) return d
  const shown = antichainOf(dim, [...d.shown.filter(id => !under.includes(id)), member_id])
  const all_hidden = under.every(id => d.hidden.includes(id))
  const hidden = d.hidden.filter(id => !under.includes(id))
  return { ...d, shown, hidden: all_hidden ? [...hidden, member_id] : hidden }
}

/**
 * UN NIVEAU ENTIER (niveau par niveau) : les membres de profondeur `depth` sous la portée ; une
 * branche plus courte s'arrête à sa feuille. Les décochés qui restent montrés le restent.
 */
export const showLevel = (dim: Class_DataTagGroup, d: Type_DimensionView, depth: number): Type_DimensionView => {
  const out: string[] = []
  const visit = (m: Class_DataTag) => {
    if (dim.depthOf(m) >= depth || childrenOf(m).length === 0) { out.push(m.id); return }
    childrenOf(m).forEach(visit)
  }
  entryOf(dim, d.focus).forEach(visit)
  const shown = antichainOf(dim, out)
  const hidden = d.hidden.filter(id => shown.includes(id))
  return { ...d, shown, hidden: hidden.length >= shown.length ? [] : hidden }
}

// ── LA FIGURE (couronne et tableau), LIÉE OU DÉTACHÉE ────────────────────────────────────────────

const roleOfCouronne = (c: Type_CouronneDimensionState): Type_DimensionRole =>
  !c.active ? 'none' : c.drawing === 'multiples' ? 'cases' : 'parts'

/** L'état d'une couronne (`couronneState`) dans le modèle commun. Sans perte : `toCouronneState` le rend. */
export const fromCouronneState = (
  cs: Type_CouronneState, variants?: { [dimension_id: string]: Partial<Type_DimensionVariants> }
): Type_DimensionViewState => {
  const dims: Type_DimensionViewState['dims'] = {}
  cs.order.forEach(id => {
    const c = cs.dims[id]
    if (c === undefined) return
    const stored = readVariants(variants?.[id] ?? {})
    // La variante de la couronne est son dessin ; les autres s'y alignent, sauf choix écrit.
    let v: Type_DimensionVariants = { ...DEFAULT_VARIANTS, ...stored }
    if (c.drawing !== 'multiples') {
      v = withVariant(v, 'couronne', c.drawing)
      if (stored.sankey !== undefined) v.sankey = stored.sankey
    }
    dims[id] = {
      role: roleOfCouronne(c),
      resume: c.drawing === 'multiples' ? 'cases' : 'parts',
      variants: v,
      focus: [...c.focus], shown: [...c.shown], hidden: [...c.hidden]
    }
  })
  return { source: cs.linked ? 'linked' : 'detached', linked: cs.linked, order: [...cs.order], dims }
}

/**
 * L'état commun vu par la couronne. Rôle `none` : la dimension est désactivée et se lit sur sa
 * portée — un état venu du DIAGRAMME (un membre à la fois, sans portée) y pose ses montrés.
 */
export const toCouronneState = (state: Type_DimensionViewState): Type_CouronneState => {
  const dims: Type_CouronneState['dims'] = {}
  state.order.forEach(id => {
    const d = state.dims[id]
    if (d === undefined) return
    const role = d.role === 'none' ? d.resume : d.role
    const focus = d.role === 'none' && d.focus.length === 0 && d.diagram !== undefined ? [...d.shown] : [...d.focus]
    dims[id] = {
      focus, shown: [...d.shown], hidden: [...d.hidden],
      active: d.role !== 'none',
      drawing: role === 'cases' ? 'multiples' : d.variants.couronne
    }
  })
  return { linked: state.linked, order: state.order.filter(id => dims[id] !== undefined), dims }
}

const readVariants = (raw: unknown): Partial<Type_DimensionVariants> => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const v = raw as Type_Options
  const out: Partial<Type_DimensionVariants> = {}
  if (v['couronne'] === 'sectors' || v['couronne'] === 'sunburst') out.couronne = v['couronne']
  if (v['sankey'] === 'bands' || v['sankey'] === 'nodes' || v['sankey'] === 'expansion') out.sankey = v['sankey']
  if (v['matrix'] === 'rows') out.matrix = v['matrix']
  return out
}

/** Les variantes écrites à côté de l'état de la couronne (clé `variants` de chaque dimension). */
const storedVariantsOf = (options: Type_Options | null | undefined): { [id: string]: Partial<Type_DimensionVariants> } => {
  const bag = options?.[COURONNE_KEY] as Type_Options | undefined
  const dims = bag?.['dims']
  if (dims === null || typeof dims !== 'object' || Array.isArray(dims)) return {}
  const out: { [id: string]: Partial<Type_DimensionVariants> } = {}
  Object.entries(dims as Type_Options).forEach(([id, d]) => {
    if (d !== null && typeof d === 'object') out[id] = readVariants((d as Type_Options)['variants'])
  })
  return out
}

/**
 * L'ÉTAT D'UNE FIGURE (couronne ou tableau, qui lisent le même sac) : la clé `couronne` et tous les
 * anciens formats (`readCouronneState`), plus les variantes des autres représentations.
 */
export const fromFigure = (
  options: Type_Options | null | undefined,
  linked: boolean | undefined,
  sankey: Type_CouronneSankey,
  declared_ids?: string[]
): Type_DimensionViewState =>
  fromCouronneState(readCouronneState(options, sankey, linked, declared_ids), storedVariantsOf(options))

/**
 * Le sac d'une figure qui porte `state` (`writeCouronneState` : anciennes clés retirées), les
 * variantes Sankey / tableau écrites à côté quand elles quittent le défaut.
 */
export const toFigureOptions = (options: Type_Options, state: Type_DimensionViewState): Type_Options => {
  const out = writeCouronneState(options, toCouronneState(state))
  const bag = out[COURONNE_KEY] as { dims: { [id: string]: Type_Options } }
  Object.entries(bag.dims).forEach(([id, d]) => {
    const v = state.dims[id]?.variants
    if (v !== undefined && (Object.keys(DEFAULT_VARIANTS) as (keyof Type_DimensionVariants)[]).some(k => v[k] !== DEFAULT_VARIANTS[k])) {
      d['variants'] = { ...v }
    }
  })
  return out
}

// ── LE DIAGRAMME ─────────────────────────────────────────────────────────────────────────────────

type Type_DiagramNode = { id: string, driving_dimension?: unknown }

const carriersOf = (sankey: Type_ViewSankey, dim: Class_DataTagGroup): string[] =>
  ((sankey.nodes_list ?? []) as Type_DiagramNode[])
    .filter(n => !isGeneratedMemberId(n.id) && n.driving_dimension === dim)
    .map(n => n.id)

/** Le même test que `DimensionDisaggregation.bandesParMembre` + `axesEnBandes`, sans l'importer. */
const inMemberBands = (dim: Class_DataTagGroup, carriers: number): boolean =>
  carriers >= 2 && (dim.member_bands ?? true)

/**
 * CE QUE LE DIAGRAMME DESSINE, lu dans le modèle : chaque dimension non vide, son rôle d'après
 * `drawing` (bannière et nœuds porteurs), ses montrés = sa sélection. Le diagramme n'a pas de portée.
 *  - en nœuds, deux porteurs ou plus rangés par membre (`member_bands`, automatique) : `cases` ;
 *  - en nœuds sinon : `parts` / nœuds ;
 *  - en bandes, la dimension qui découpe les flux (`draws_bands`, la première de la liste) :
 *    `parts` / bandes ; une autre en choix multiple se lit sur la SOMME de ses membres : `none` ;
 *  - un membre à la fois, séquence, aucune bannière : `none`, lue sur ses membres choisis.
 * Ordre : celui des dimensions du fichier, la dimension des cases en dernier.
 */
export const fromDiagram = (sankey: Type_ViewSankey): Type_DimensionViewState => {
  const dims: Type_DimensionViewState['dims'] = {}
  const order: string[] = []
  ;(sankey.data_taggs_list as Class_DataTagGroup[]).filter(d => d.tags_list.length > 0).forEach(dim => {
    const selection = antichainOf(dim, (dim.selected_tags_list as Class_DataTag[]).map(m => m.id))
    const carriers = carriersOf(sankey, dim)
    const drawing = dim.drawing
    let role: Type_DimensionRole = 'none'
    let variants: Type_DimensionVariants = { ...DEFAULT_VARIANTS }
    if (drawing === 'nodes') {
      role = inMemberBands(dim, carriers.length) ? 'cases' : 'parts'
      variants = withVariant(variants, 'sankey', 'nodes')
    } else if (drawing === 'multi' && dim.draws_bands) {
      role = 'parts'
    }
    order.push(dim.id)
    dims[dim.id] = {
      role,
      resume: role === 'cases' ? 'cases' : 'parts',
      variants,
      focus: role === 'none' ? [...selection] : [],
      shown: selection,
      hidden: [],
      diagram: { banner: dim.banner, carriers, member_bands: dim.member_bands }
    }
  })
  const cases = order.filter(id => dims[id].role === 'cases')
  return { source: 'diagram', linked: true, order: [...order.filter(id => !cases.includes(id)), ...cases], dims }
}

/** Une écriture dans le modèle, par dimension ; seuls les champs à changer sont présents. */
export interface Type_DiagramDimensionPatch {
  banner?: string
  /** Les nœuds qui doivent porter la dimension, exactement. */
  carriers?: string[]
  member_bands?: boolean | undefined
  /** Les membres à choisir (`selectMembers`). */
  selected?: string[]
}

export type Type_DiagramWarning =
  /** Une dimension lue à la somme de plusieurs membres : le diagramme ne le fait que si une autre prend les bandes. */
  | 'sum_needs_bands_elsewhere'
  /** En bandes, mais une dimension plus haut dans la liste les prend : elle se lira à la somme. */
  | 'bands_taken'
  /** En nœuds sans aucun nœud porteur connu : le modèle ne sait pas lesquels choisir. */
  | 'carriers_needed'
  /** Un diagramme par membre veut deux porteurs au moins. */
  | 'cases_need_two_carriers'
  /** L'expansion n'est pas encore dessinée par le Sankey : en nœuds à la place. */
  | 'expansion_unsupported'
  /** Le diagramme n'a pas de portée : seuls les montrés passent. */
  | 'focus_ignored'

export interface Type_DiagramPatch {
  dims: { [dimension_id: string]: Type_DiagramDimensionPatch }
  warnings: { dimension_id: string, code: Type_DiagramWarning }[]
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every(x => b.includes(x))

/**
 * LES ÉCRITURES qui feraient dessiner `state` au diagramme, décrites et non faites (le geste les
 * fera, en un pas d'historique). Seul ce qui change est décrit.
 */
export const toDiagramPatch = (state: Type_DimensionViewState, sankey: Type_ViewSankey): Type_DiagramPatch => {
  const now = fromDiagram(sankey)
  const patch: Type_DiagramPatch = { dims: {}, warnings: [] }
  const warn = (dimension_id: string, code: Type_DiagramWarning) => patch.warnings.push({ dimension_id, code })
  const list = (sankey.data_taggs_list as Class_DataTagGroup[]).map(d => d.id)
  const wants_bands = (id: string) => state.dims[id]?.role === 'parts' && state.dims[id].variants.sankey === 'bands'
  const any_bands = state.order.some(wants_bands)
  state.order.forEach(id => {
    const d = state.dims[id]
    const cur = now.dims[id]
    const dim = sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
    if (d === undefined || cur === undefined || dim === undefined || cur.diagram === undefined) return
    const p: Type_DiagramDimensionPatch = {}
    const banner = cur.diagram.banner
    const carriers_now = cur.diagram.carriers
    const known_carriers = d.diagram?.carriers.length ? d.diagram.carriers : carriers_now
    const parts = d.shown.filter(m => !d.hidden.includes(m))
    let selected: string[]
    if (d.role === 'none') {
      selected = d.focus.length > 0 ? [...d.focus] : (parts.length > 0 ? parts : dimensionRootsOf(dim).map(m => m.id))
      if (carriers_now.length > 0) p.carriers = []
      // Déjà lue sans découper (un membre à la fois, ou choix multiple sans les bandes) : la bannière
      // reste. Sinon, un membre : « un membre à la fois » ; plusieurs : leur somme, en choix multiple.
      if (cur.role !== 'none') {
        if (selected.length === 1) p.banner = 'one'
        else {
          p.banner = 'multi'
          if (!any_bands) warn(id, 'sum_needs_bands_elsewhere')
        }
      }
    } else {
      selected = parts
      if (d.focus.length > 0 && state.source === 'diagram') warn(id, 'focus_ignored')
      const variant = d.role === 'cases' ? 'nodes' : d.variants.sankey
      if (variant === 'bands') {
        if (banner !== 'multi') p.banner = 'multi'
        if (carriers_now.length > 0) p.carriers = []
        const before = list.slice(0, list.indexOf(id)).find(o => state.order.includes(o) ? wants_bands(o) : now.dims[o]?.diagram?.banner === 'multi')
        if (before !== undefined) warn(id, 'bands_taken')
      } else {
        if (variant === 'expansion') warn(id, 'expansion_unsupported')
        if (known_carriers.length === 0) warn(id, 'carriers_needed')
        else if (!sameSet(known_carriers, carriers_now)) p.carriers = [...known_carriers]
        const n = known_carriers.length
        if (d.role === 'cases') {
          if (n < 2) warn(id, 'cases_need_two_carriers')
          if (dim.member_bands === false) p.member_bands = true
        } else if (n >= 2 && (dim.member_bands ?? true)) p.member_bands = false
      }
    }
    if (!sameSet(selected, cur.shown)) p.selected = selected
    if (Object.keys(p).length > 0) patch.dims[id] = p
  })
  return patch
}

// ── LE PLAN DE CHAQUE REPRÉSENTATION ─────────────────────────────────────────────────────────────

export interface Type_MatrixAxisPlan {
  dimension_id: string
  /** Les membres de l'axe (parts ; une part unique s'ouvre d'un cran). */
  members: string[]
  /** Les ouverts (sous-totaux / en-têtes de groupe). */
  opened: string[]
}

export interface Type_MatrixPlan {
  rows: Type_MatrixAxisPlan
  columns: Type_MatrixAxisPlan | null
  /** Où se lisent les autres dimensions. */
  coordinates: { [dimension_id: string]: string[] }
}

export interface Type_SankeyPlan {
  /** La dimension qui découpe les flux en bandes (une seule). */
  bands: string | null
  /** Les dimensions dessinées en nœuds, dans l'ordre. */
  nodes: string[]
  /** Les dimensions en expansion (plusieurs niveaux, parents compris). */
  expansion: string[]
  /** La dimension « un diagramme par membre ». */
  per_member: string | null
  grouping: Type_Grouping
  /** Les membres dessinés de chaque dimension qui découpe (montrés − décochés). */
  members: { [dimension_id: string]: string[] }
  /** Les ouverts des dimensions en expansion. */
  opened: { [dimension_id: string]: string[] }
  /** Où se lisent les dimensions qui ne découpent pas. */
  coordinates: { [dimension_id: string]: string[] }
}

export type Type_RepresentationPlan =
  | { representation: 'couronne', plan: Type_DrawPlan }
  | { representation: 'matrix', plan: Type_MatrixPlan | null }
  | { representation: 'sankey', plan: Type_SankeyPlan }

/** Le plan du tableau : celui que dessine aujourd'hui `matrixCutOfCouronne`, en membres. */
const matrixPlanOf = (state: Type_DimensionViewState, sankey: Type_CouronneSankey): Type_MatrixPlan | null => {
  const cs = toCouronneState(state)
  const m = matrixCutOfCouronne(cs, drawPlanOf(cs, sankey), sankey)
  if (m === null) return null
  const axis = (id: string): Type_MatrixAxisPlan => {
    const dim = sankey.data_taggs_dict[id] as Class_DataTagGroup
    const opened = (dim.tags_list as Class_DataTag[]).filter(t => m.cut.opened.has(memberSectorId(id, t.id))).map(t => t.id)
    const hidden = new Set((dim.tags_list as Class_DataTag[]).filter(t => m.cut.hidden?.has(memberSectorId(id, t.id))).map(t => t.id))
    const members: string[] = []
    const visit = (t: Class_DataTag) => {
      if (hidden.has(t.id)) return
      if (opened.includes(t.id) && childrenOf(t).length > 0) childrenOf(t).forEach(visit)
      else members.push(t.id)
    }
    dimensionRootsOf(dim).forEach(visit)
    return { dimension_id: id, members, opened }
  }
  const coordinates: Type_MatrixPlan['coordinates'] = {}
  m.coordinates.forEach((v, k) => { coordinates[k] = v.map(t => t.id) })
  return { rows: axis(m.row_id), columns: m.col_id ? axis(m.col_id) : null, coordinates }
}

/** Le plan du Sankey : quelle dimension en bandes, en nœuds, en expansion, par membre. */
const sankeyPlanOf = (state: Type_DimensionViewState, sankey: Type_CouronneSankey): Type_SankeyPlan => {
  const plan: Type_SankeyPlan = {
    bands: null, nodes: [], expansion: [], per_member: null, grouping: 'by_node', members: {}, opened: {}, coordinates: {}
  }
  const list = (sankey.data_taggs_list as Class_DataTagGroup[]).map(d => d.id)
  const ids = state.order.filter(id => state.dims[id] !== undefined && sankey.data_taggs_dict[id] !== undefined)
  // Les bandes : comme `draws_bands`, la première DE LA LISTE DU FICHIER qui les veut.
  const bands = [...ids].sort((a, b) => list.indexOf(a) - list.indexOf(b))
    .find(id => state.dims[id].role === 'parts' && state.dims[id].variants.sankey === 'bands' && partsOf(state.dims[id]).length > 1)
  // Un diagramme par membre : la dernière qui le demande.
  const per_member = [...ids].reverse().find(id => state.dims[id].role === 'cases' && partsOf(state.dims[id]).length > 1)
  ids.forEach(id => {
    const d = state.dims[id]
    const dim = sankey.data_taggs_dict[id] as Class_DataTagGroup
    const parts = partsOf(d)
    if (id === per_member) { plan.per_member = id; plan.members[id] = parts; return }
    if (d.role === 'parts' && parts.length > 1) {
      if (d.variants.sankey === 'bands') {
        if (id === bands) { plan.bands = id; plan.members[id] = parts; return }
      } else {
        plan.members[id] = parts
        if (d.variants.sankey === 'expansion') { plan.expansion.push(id); plan.opened[id] = openedOf(dim, d) } else plan.nodes.push(id)
        return
      }
    }
    plan.coordinates[id] = d.role === 'none' && d.focus.length > 0 ? [...d.focus] : parts
  })
  plan.grouping = plan.per_member !== null ? 'by_member' : 'by_node'
  return plan
}

const partsOf = (d: Type_DimensionView) => d.shown.filter(id => !d.hidden.includes(id))

/**
 * CE QUE CHAQUE REPRÉSENTATION DESSINERAIT de l'état (généralise `drawPlanOf`) : la couronne (son
 * plan, inchangé), le tableau (lignes, colonnes, ouverts — celui d'aujourd'hui), le Sankey
 * (bandes, nœuds, expansion, un diagramme par membre, regroupement). Non branché.
 */
export const planFor = (
  state: Type_DimensionViewState,
  representation: Type_Representation,
  sankey: Type_CouronneSankey,
  subject?: { name: string }
): Type_RepresentationPlan => {
  if (representation === 'couronne') return { representation, plan: drawPlanOf(toCouronneState(state), sankey, subject) }
  if (representation === 'matrix') return { representation, plan: matrixPlanOf(state, sankey) }
  return { representation, plan: sankeyPlanOf(state, sankey) }
}

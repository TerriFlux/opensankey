// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 06/10/2026 — LE MODÈLE COMMUN couronne · Sankey · tableau croisé (os#1511, refonte « rôles
// communs », lot 1 sur 5 : modèle pur). Branchés depuis : la couronne et le tableau croisé
// (`fromFigure`, `toCouronneState`, `figureOptionsOf`, `planFor`).
//
// 11/10/2026 — LE SANKEY EST BRANCHÉ (décision de Julien, après un premier retrait le matin même) :
// le tableau de navigation du diagramme et ses lecteurs (colonnes surlignées, cases de zoom, mixte,
// ⇅, commandes du lecteur, sélecteur de dessin) lisent `fromDiagram` + `planFor(…, 'sankey')` ; ses
// gestes rendent un nouvel état (`diagramTableCut`, `diagramReader*`, `swapInOrder`…) que
// `toDiagramPatch` traduit en écritures, posées par UNE porte annulable (`applyDiagramPatch`,
// `dimensionDrawingHost`). L'ancienne « coupe en tableau » (`DimensionTableCut`) n'est plus qu'un
// détail interne de ce module.
//
// ⇅ SUR LE SANKEY = L'ORDRE DES DIMENSIONS, au sens « laquelle englobe l'autre » : dans l'ordre du
// modèle, la dimension en NŒUDS (les groupes) passe AVANT celle en BANDES, comme l'anneau intérieur
// avant l'extérieur et les lignes avant les colonnes. Sur le diagramme le dessin est attaché à la
// PLACE : échanger deux dimensions dans l'ordre leur fait échanger leur dessin (bandes ↔ nœuds,
// placement compris) — le geste validé au banc par Julien (sa!921), inchangé à l'écran.
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
//   tableau   plat / hiérarchique = parts (lignes, puis colonnes, dans l'ordre) ; un tableau par
//             membre = cases.
//
// L'état est une INTERFACE à trois sources :
//   - le DIAGRAMME, qui garde son état dans le modèle (bannière, sélection, nœuds porteurs,
//     `member_bands`, portée, décochés) : `fromDiagram` le lit, `toDiagramPatch` DÉCRIT les
//     écritures sans les faire ;
//   - la figure LIÉE (Suit / Épinglée) : membres montrés = la sélection du diagramme ;
//   - la figure DÉTACHÉE : tout est à elle, sous la clé `couronne` (`couronneState`), que
//     `fromFigure` / `toFigureOptions` lisent et écrivent (anciens formats compris).
// `planFor` dit ce que chaque représentation dessinerait de l'état.
//
// 07/10/2026 — LOT 2 : le TABLEAU CROISÉ est branché (`fromFigure` + `planFor(…, 'matrix')`, gestes de
// `couronneGestures`) : lignes = parts, colonnes = cases, axes dépliables comme le sunburst.
//
// 07/10/2026 — CORRECTION DE JULIEN (« si on sélectionne Sous-régions, on ne devrait pas voir les
// continents ») : colonnes ≠ cases.
//   - deux dimensions en PARTS croisées = LIGNES × COLONNES (la couronne croisée, anneau intérieur →
//     lignes, extérieur → colonnes ; ⇅ décide) ;
//   - CASES = PLUSIEURS TABLEAUX, un par membre (une couronne / un diagramme par membre), « Autres »
//     comme les cases de la couronne ;
//   - la VARIANTE du tableau, par dimension : PLAT (= secteurs : les membres montrés seuls, sans
//     ancêtres ni sous-totaux) ou HIÉRARCHIQUE (= sunburst : les ancêtres en en-têtes de groupes
//     dépliables, avec sous-totaux). Elle est ALIGNÉE sur celle de la couronne (même dessin écrit) :
//     changer de représentation dans une fenêtre fait sunburst ⇄ hiérarchique, secteurs ⇄ plat, une
//     couronne par membre ⇄ un tableau par membre. Défaut : plat.
//
// Module PUR : aucune classe instanciée, aucun React, aucun DOM.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { dimensionRootsOf, openedForSelection } from '../Charts/DataDimensionHierarchy'
import { drawPlanOf } from '../Charts/couronnePlan'
import type { Type_DrawPlan } from '../Charts/couronnePlan'
import { sankeyTableOf, tableFocusOf, tableGestureIds } from './sankeyTable'
import type { Type_SankeyTableDimension, Type_TableGesture } from './sankeyTable'
import {
  antichainOf, COURONNE_KEY, readCouronneState, writeCouronneState
} from './couronneState'
import type { Type_CouronneDimensionState, Type_CouronneReader, Type_CouronneSankey, Type_CouronneState } from './couronneState'

// ── LES TYPES ────────────────────────────────────────────────────────────────────────────────────

export type Type_Representation = 'couronne' | 'sankey' | 'matrix'
export type Type_DimensionRole = 'none' | 'parts' | 'cases'
export type Type_CouronneVariant = 'sectors' | 'sunburst'
export type Type_SankeyVariant = 'bands' | 'nodes' | 'expansion'
export type Type_MatrixVariant = 'flat' | 'hierarchical'
/** Le regroupement que l'ordre produit : par nœud (les parts dans chaque figure) ou par membre (les cases). */
export type Type_Grouping = 'by_node' | 'by_member'

export interface Type_DimensionVariants {
  couronne: Type_CouronneVariant
  sankey: Type_SankeyVariant
  matrix: Type_MatrixVariant
}

export const DEFAULT_VARIANTS: Type_DimensionVariants = { couronne: 'sectors', sankey: 'bands', matrix: 'flat' }

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
  /** Source diagramme seulement : ce que le modèle commun ne sait pas déduire. */
  diagram?: Type_DiagramExtras
}

/**
 * Ce que le diagramme porte d'une dimension et que le modèle commun ne sait pas déduire : le dessin
 * attaché à sa PLACE (bannière, nœuds porteurs, placement), et l'état tel qu'écrit (instantanés).
 */
export interface Type_DiagramExtras {
  /** La bannière (`one`, `multi`, `sequence`, `topbar`, `none`…), gardée pour ne pas réécrire une séquence. */
  banner: string
  /** Le dessin lu (`Class_DataTagGroup.drawing` : `one`, `multi`, `nodes`, `other`). */
  drawing: string
  /** Elle découpe les flux en bandes (`draws_bands`, la première de la liste qui le peut). */
  bands: boolean
  /** Les nœuds RÉGLÉS pour la porter (`own_driving_dimension`). */
  carriers: string[]
  /**
   * Les porteurs MIS DE CÔTÉ au passage en bandes (`parked_carrier_ids`, Julien 12/10) : une colonne
   * d'extrémité qui la portait s'efface en bandes, revenir en nœuds la rend.
   */
  parked: string[]
  /** Un diagramme par membre : `true` demandé, `undefined` non posé. */
  member_bands: boolean | undefined
  reference_node_id: string | undefined
  /** En nœuds, l'expansion aux extrémités (`nodes_expansion`). */
  expansion: boolean
  /** La sélection, dans l'ordre du modèle (« un membre à la fois » garde la première). */
  selection: string[]
  /** La portée et les décochés TELS QU'ÉCRITS (`stored_focus_ids`, `stored_hidden_ids`). */
  stored_focus: string[]
  stored_hidden: string[]
  /** Transitoire, posé par un geste : placement automatique (positions manuelles effacées). */
  auto_place?: boolean
}

export type Type_ViewSource = 'diagram' | 'linked' | 'detached'

export interface Type_DimensionViewState {
  source: Type_ViewSource
  /** Membres montrés partagés avec le diagramme (diagramme lui-même, ou fenêtre Suit / Épinglée). */
  linked: boolean
  order: string[]
  dims: { [dimension_id: string]: Type_DimensionView }
}

type Type_Options = { [key: string]: unknown }

// ── LES LIBELLÉS ACTUELS ↔ (RÔLE, VARIANTE, REGROUPEMENT) ────────────────────────────────────────

/** Les libellés du sélecteur de dessin, tels qu'ils sont aujourd'hui (clés `Banner.draw_*`). */
export type Type_CouronneLabel = 'sectors' | 'sunburst' | 'multiples'
/** `one` « Un membre à la fois », `bands`, `nodes`, `expansion` (à ajouter), `member_bands` « Un diagramme par membre ». */
export type Type_SankeyLabel = 'one' | 'bands' | 'nodes' | 'expansion' | 'member_bands'
/** Le tableau : plat, hiérarchique, un tableau par membre (07/10/2026). */
export type Type_MatrixLabel = 'flat' | 'hierarchical' | 'tables'
export type Type_DrawingLabel = Type_CouronneLabel | Type_SankeyLabel | Type_MatrixLabel

export const DRAWING_LABELS: { [r in Type_Representation]: readonly Type_DrawingLabel[] } = {
  couronne: ['sectors', 'sunburst', 'multiples'],
  sankey: ['one', 'bands', 'nodes', 'expansion', 'member_bands'],
  matrix: ['flat', 'hierarchical', 'tables']
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
    case 'tables': return { role: 'cases', grouping: 'by_member' }
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
  return d.role === 'cases' ? 'tables' : d.variants.matrix
}

/**
 * Pose une variante, et aligne la PROFONDEUR des autres représentations : sunburst = expansion =
 * hiérarchique (plusieurs niveaux dessinés) ; secteurs = plat = bandes ou nœuds (la frontière seule).
 */
export const withVariant = (
  variants: Type_DimensionVariants, representation: Type_Representation, variant: string
): Type_DimensionVariants => {
  const out = { ...variants }
  if (representation === 'couronne' && (variant === 'sectors' || variant === 'sunburst')) {
    out.couronne = variant
    out.matrix = variant === 'sunburst' ? 'hierarchical' : 'flat'
    if (variant === 'sunburst') out.sankey = 'expansion'
    else if (out.sankey === 'expansion') out.sankey = 'bands'
  } else if (representation === 'sankey' && (variant === 'bands' || variant === 'nodes' || variant === 'expansion')) {
    out.sankey = variant
    out.couronne = variant === 'expansion' ? 'sunburst' : 'sectors'
    out.matrix = variant === 'expansion' ? 'hierarchical' : 'flat'
  } else if (representation === 'matrix' && (variant === 'flat' || variant === 'hierarchical')) {
    out.matrix = variant
    out.couronne = variant === 'hierarchical' ? 'sunburst' : 'sectors'
    if (variant === 'hierarchical') out.sankey = 'expansion'
    else if (out.sankey === 'expansion') out.sankey = 'bands'
  }
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
    // Venue du diagramme, une dimension qui ne découpe pas (un membre à la fois) se lit à ses membres.
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
  // 'rows' (lot 1) ne se relit pas : la variante du tableau suit le dessin de la couronne.
  if (v['matrix'] === 'flat' || v['matrix'] === 'hierarchical') out.matrix = v['matrix']
  return out
}

/** Les variantes écrites à côté de l'état de la couronne (clé `variants` de chaque dimension). */
export const storedVariantsOf =(options: Type_Options | null | undefined): { [id: string]: Partial<Type_DimensionVariants> } => {
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
 * anciens formats (`readCouronneState`), plus les variantes des autres représentations. `reader` :
 * le tableau relit les sacs d'avant la version 2 avec leurs colonnes (`matrixLegacyColumns`).
 */
export const fromFigure = (
  options: Type_Options | null | undefined,
  linked: boolean | undefined,
  sankey: Type_CouronneSankey,
  declared_ids?: string[],
  reader: Type_CouronneReader = 'couronne'
): Type_DimensionViewState =>
  fromCouronneState(readCouronneState(options, sankey, linked, declared_ids, reader), storedVariantsOf(options))

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

/**
 * 09/10/2026 (lot 3) — LE SEUL ÉCRIVAIN du sac d'une figure : un état de couronne (celui que les gestes
 * manipulent) écrit par `toFigureOptions`, les variantes des autres représentations GARDÉES. Avant,
 * `writeCouronneState` réécrivait la clé sans elles : un geste de couronne effaçait la variante Sankey
 * ou tableau choisie dans la même fenêtre.
 */
export const figureOptionsOf = (options: Type_Options, cs: Type_CouronneState): Type_Options =>
  toFigureOptions(options, fromCouronneState(cs, storedVariantsOf(options)))

// ── LE DIAGRAMME ─────────────────────────────────────────────────────────────────────────────────

/** Ce que ce module lit d'un Sankey : ses dimensions, ses nœuds (porteurs) et l'ordre de ses lignes. */
export interface Type_ViewSankey extends Type_CouronneSankey {
  nodes_list?: unknown[]
  getTagGroupsOrder?: (type_group: 'data_taggs') => string[]
}

type Type_DiagramNode = { id: string, own_driving_dimension?: unknown }

/** Une bannière à choix unique ne lit qu'un membre (cf. `dimensionDrawingHost`). */
const UNIQUE_BANNERS = ['one', 'topbar', 'sequence']

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every(x => b.includes(x))
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => b[i] === x)

const diagramDims = (sankey: Type_CouronneSankey): Class_DataTagGroup[] =>
  (sankey.data_taggs_list as Class_DataTagGroup[]).filter(d => d.tags_list.length > 0)

/** Le rôle et la variante Sankey que DESSINENT ces extras. */
const roleOfExtras = (x: Pick<Type_DiagramExtras, 'drawing' | 'bands' | 'member_bands' | 'expansion'>):
  { role: Type_DimensionRole, sankey?: Type_SankeyVariant } => {
  if (x.drawing === 'nodes') {
    if (x.member_bands === true) return { role: 'cases', sankey: 'nodes' }
    return { role: 'parts', sankey: x.expansion ? 'expansion' : 'nodes' }
  }
  if (x.drawing === 'multi' && x.bands) return { role: 'parts', sankey: 'bands' }
  return { role: 'none' }
}

const viewOfExtras = (d: Omit<Type_DimensionView, 'role' | 'resume' | 'variants'> & Partial<Type_DimensionView>, x: Type_DiagramExtras): Type_DimensionView => {
  const { role, sankey } = roleOfExtras(x)
  const variants = sankey === undefined ? { ...(d.variants ?? DEFAULT_VARIANTS) } : withVariant(d.variants ?? DEFAULT_VARIANTS, 'sankey', sankey)
  return { ...d, role, resume: role === 'cases' ? 'cases' : 'parts', variants, diagram: x }
}

/**
 * LE RANG D'UNE DIMENSION DANS L'ORDRE DU MODÈLE (« laquelle englobe l'autre ») : en nœuds (les
 * groupes) d'abord, puis en bandes, puis celles qui ne découpent pas, la dimension des cases en dernier.
 */
const rankOf = (d: Type_DimensionView): number =>
  d.role === 'cases' ? 3 : d.role === 'none' ? 2 : d.variants.sankey === 'bands' ? 1 : 0

/**
 * CE QUE LE DIAGRAMME DESSINE, lu dans le modèle : chaque dimension non vide, son rôle d'après son
 * dessin (bannière, nœuds porteurs, un diagramme par membre), ses montrés = sa sélection et ses
 * décochés, sa portée = `focus_ids`.
 *  - en nœuds, un diagramme par membre demandé : `cases` ;
 *  - en nœuds sinon : `parts` / nœuds (expansion si demandée) ;
 *  - en bandes, la dimension qui découpe les flux (`draws_bands`) : `parts` / bandes ;
 *  - un membre à la fois, séquence, ou plusieurs lus à leur somme : `none`.
 * Ordre : nœuds, bandes, sans découpe, cases (`rankOf`), à rang égal celui des lignes du diagramme.
 */
export const fromDiagram = (sankey: Type_ViewSankey): Type_DimensionViewState => {
  const dims: Type_DimensionViewState['dims'] = {}
  const nodes = (sankey.nodes_list ?? []) as Type_DiagramNode[]
  const list = diagramDims(sankey)
  list.forEach(dim => {
    const selection = (dim.selected_tags_list as Class_DataTag[]).map(m => m.id)
    const hidden = dim.hidden_ids
    const x: Type_DiagramExtras = {
      banner: dim.banner,
      drawing: dim.drawing,
      bands: dim.draws_bands,
      carriers: nodes.filter(n => n.own_driving_dimension === dim).map(n => n.id),
      parked: [...(dim.parked_carrier_ids ?? [])],
      member_bands: dim.member_bands,
      reference_node_id: dim.reference_node_id,
      expansion: dim.nodes_expansion,
      selection,
      stored_focus: dim.stored_focus_ids,
      stored_hidden: dim.stored_hidden_ids
    }
    dims[dim.id] = viewOfExtras({ focus: dim.focus_ids, shown: antichainOf(dim, [...selection, ...hidden]), hidden: [...hidden] }, x)
  })
  const rows = list.map(d => d.id)
  const order = [...rows].sort((a, b) => rankOf(dims[a]) - rankOf(dims[b]) || rows.indexOf(a) - rows.indexOf(b))
  return { source: 'diagram', linked: true, order, dims }
}

/** Les montrés moins les décochés : ce que le diagramme sélectionne, dans l'ordre de sa sélection. */
const selectedOf = (d: Type_DimensionView): string[] => {
  const parts = d.shown.filter(id => !d.hidden.includes(id))
  const known = d.diagram?.selection.filter(id => parts.includes(id)) ?? []
  return [...known, ...parts.filter(id => !known.includes(id))]
}

/** La portée telle que le diagramme la lit : vide dès que la sélection en sort (cf. `focus_ids`). */
const effectiveFocus = (dim: Class_DataTagGroup, focus: string[], selected: string[]): string[] => {
  const F = focus.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)
  if (F.length === 0 || selected.length === 0) return []
  const inside = selected.every(id => { const m = memberOf(dim, id); return m !== undefined && F.some(f => m === f || m.hasAncestor(f)) })
  return inside ? F.map(m => m.id) : []
}

/**
 * Les rôles de toutes les dimensions, relus sur leurs extras après un geste : le dessin (nœuds dès un
 * porteur ou un diagramme par membre), la dimension en bandes (la première des lignes qui le peut).
 */
const withDiagramRoles = (state: Type_DimensionViewState, sankey: Type_CouronneSankey): Type_DimensionViewState => {
  const drawingOf = (x: Type_DiagramExtras) => x.member_bands === true || x.carriers.length > 0
    ? 'nodes' : x.banner === 'multi' ? 'multi' : UNIQUE_BANNERS.includes(x.banner) ? 'one' : 'other'
  const rows = diagramDims(sankey)
  const bands_id = rows.find(dim => {
    const x = state.dims[dim.id]?.diagram
    return x !== undefined && drawingOf(x) === 'multi' && dim.tags_list.length > 1
  })?.id
  const dims: Type_DimensionViewState['dims'] = {}
  Object.entries(state.dims).forEach(([id, d]) => {
    const x = d.diagram
    dims[id] = x === undefined ? d : viewOfExtras(d, { ...x, drawing: drawingOf(x), bands: id === bands_id })
  })
  return { ...state, dims }
}

const withDim = (state: Type_DimensionViewState, id: string, d: Type_DimensionView): Type_DimensionViewState =>
  ({ ...state, dims: { ...state.dims, [id]: d } })

/** Toute la sélection `ids` tient-elle sous la portée `focus` (non vide) ? */
const focusHolds = (dim: Class_DataTagGroup, focus: string[], ids: string[]): boolean => {
  const F = focus.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)
  if (F.length === 0) return false
  return ids.every(id => { const m = memberOf(dim, id); return m !== undefined && F.some(f => m === f || m.hasAncestor(f)) })
}

/**
 * Les décochés qui restent après une nouvelle sélection : ceux qui ne sont pas choisis et dont un frère
 * l'est (ils gardent leur ligne parmi les montrés) ; les autres tombent.
 */
const hiddenKept = (dim: Class_DataTagGroup, hidden: string[], ids: string[]): string[] => {
  const chosen = ids.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)
  return hidden.filter(h => {
    const m = memberOf(dim, h)
    return m !== undefined && !ids.includes(h) && chosen.some(c => c.parent === m.parent)
  })
}

/**
 * COUPER UNE DIMENSION DU DIAGRAMME : ses membres dessinés deviennent `ids` (l'état que posait
 * `applyDimensionCut`). `multi` : plusieurs membres sur une dimension qu'aucun nœud ne porte la font
 * passer en choix multiple. `focus` : la portée (absente, elle reste tant que la sélection y tient).
 * Les décochés frères d'un choisi restent.
 */
export const diagramCut = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, ids: string[],
  options: { multi?: boolean, focus?: string[] } = {}
): Type_DimensionViewState => {
  const d = state.dims[dimension_id]
  const x = d?.diagram
  const dim = sankey.data_taggs_dict[dimension_id] as Class_DataTagGroup | undefined
  if (d === undefined || x === undefined || dim === undefined || ids.length === 0) return state
  const banner = options.multi && x.carriers.length === 0 ? 'multi' : x.banner
  const focus = options.focus ?? (focusHolds(dim, x.stored_focus, ids) ? x.stored_focus : [])
  const stored_hidden = hiddenKept(dim, x.stored_hidden, ids)
  const next: Type_DimensionView = {
    ...d,
    shown: [...ids, ...stored_hidden.filter(h => !ids.includes(h))],
    hidden: [...stored_hidden],
    focus: effectiveFocus(dim, focus, ids),
    diagram: { ...x, banner, selection: [...ids], stored_focus: [...focus], stored_hidden }
  }
  return withDiagramRoles(withDim(state, dimension_id, next), sankey)
}

/**
 * UN DIAGRAMME PAR MEMBRE, ou non (`applyMemberBands`) : un seul à la fois, les autres le quittent ;
 * placement automatique de la dimension.
 */
export const diagramMemberBands = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, on: boolean
): Type_DimensionViewState => {
  const d = state.dims[dimension_id]
  if (d?.diagram === undefined) return state
  let out = withDim(state, dimension_id, { ...d, diagram: { ...d.diagram, member_bands: on, auto_place: true } })
  if (on) {
    Object.entries(out.dims).forEach(([id, o]) => {
      if (id !== dimension_id && o.diagram?.member_bands === true) out = withDim(out, id, { ...o, diagram: { ...o.diagram, member_bands: undefined } })
    })
  }
  return withDiagramRoles(out, sankey)
}

/**
 * ⇅ — ÉCHANGER DEUX DIMENSIONS DANS L'ORDRE. Sur le diagramme, le dessin est attaché à la place :
 * chacune prend celui de l'autre (le geste de sa!921) :
 *  - la bannière et les nœuds porteurs ; celle qui prend les nœuds garde sa bannière et TOUS ses
 *    membres ; celle qui quitte les nœuds pour une bannière à choix unique garde son premier membre ;
 *  - le placement des nœuds (`member_bands`, `reference_node_id`) ;
 *  - placement automatique pour celle qui arrive sur des porteurs (positions d'un autre dessin) ;
 * la portée et les décochés restent à chacune.
 */
export const swapInOrder = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, a: string, b: string
): Type_DimensionViewState => {
  if (a === b) return state
  const da = state.dims[a]
  const db = state.dims[b]
  const order = state.order.map(id => id === a ? b : id === b ? a : id)
  if (da?.diagram === undefined || db?.diagram === undefined) return { ...state, order }
  const take = (own: Type_DimensionView, other: Type_DiagramExtras): Type_DimensionView => {
    const x = own.diagram as Type_DiagramExtras
    const takes_nodes = other.carriers.length > 0
    const banner = takes_nodes ? x.banner : other.banner
    const selection = !takes_nodes && UNIQUE_BANNERS.includes(banner) ? x.selection.slice(0, 1) : x.selection
    return {
      ...own,
      shown: [...selection, ...own.hidden.filter(h => !selection.includes(h))],
      diagram: {
        ...x, banner, selection, carriers: [...other.carriers], member_bands: other.member_bands,
        // Les porteurs passent à l'autre dimension : rien à mettre de côté.
        parked: takes_nodes ? [] : [...x.parked],
        reference_node_id: other.reference_node_id, auto_place: takes_nodes || undefined
      }
    }
  }
  const out: Type_DimensionViewState = { ...state, order, dims: { ...state.dims, [a]: take(da, db.diagram), [b]: take(db, da.diagram) } }
  return withDiagramRoles(out, sankey)
}

/** Une écriture dans le modèle, par dimension ; seuls les champs à changer sont présents. */
export interface Type_DiagramDimensionPatch {
  banner?: string
  /** Les nœuds qui doivent la porter, exactement. */
  carriers?: string[]
  /** Les porteurs mis de côté (`parked_carrier_ids`). */
  parked?: string[]
  member_bands?: boolean | undefined
  reference_node_id?: string | undefined
  expansion?: boolean
  /** Les membres à choisir (`selectMembers`). */
  selected?: string[]
  /** La portée et les décochés, tels qu'écrits. */
  focus?: string[]
  hidden?: string[]
  /** Placement automatique : les positions manuelles de ses membres s'effacent. */
  auto_place?: boolean
}

export type Type_DiagramWarning =
  /** En nœuds sans aucun nœud porteur connu : le modèle ne sait pas lesquels choisir. */
  | 'carriers_needed'
  /** Une dimension lue à la somme de plusieurs membres : le diagramme ne le fait que si une autre prend les bandes. */
  | 'sum_needs_bands_elsewhere'

export interface Type_DiagramPatch {
  /** Le nouvel ordre des lignes (`setTagGroupsOrder('data_taggs')`), s'il change. */
  order?: string[]
  dims: { [dimension_id: string]: Type_DiagramDimensionPatch }
  warnings: { dimension_id: string, code: Type_DiagramWarning }[]
}

/**
 * Les extras que DESSINERAIT la dimension `d`. Venue d'un geste du diagramme, ses extras font foi ;
 * venue d'ailleurs (une figure, un libellé du sélecteur), ils se déduisent de son rôle et de sa
 * variante, sur ceux du diagramme `cur`.
 */
const targetExtrasOf = (
  d: Type_DimensionView, cur: Type_DiagramExtras, any_bands: boolean, warn: (code: Type_DiagramWarning) => void
): Type_DiagramExtras => {
  if (d.diagram !== undefined) {
    const r = roleOfExtras(d.diagram)
    if (r.role === d.role && (r.sankey === undefined || r.sankey === d.variants.sankey)) return d.diagram
  }
  const x: Type_DiagramExtras = { ...cur, ...(d.diagram ?? {}) }
  const parts = d.shown.filter(id => !d.hidden.includes(id))
  // Une dimension qui ne découpe pas se lit à ses membres : sa portée n'en est pas une sur le diagramme.
  x.stored_focus = d.role === 'none' && sameSet(d.focus, parts) ? cur.stored_focus : [...d.focus]
  x.stored_hidden = [...d.hidden]
  const variant = d.role === 'cases' ? 'nodes' : d.variants.sankey
  if (d.role === 'none') {
    x.carriers = []
    if (x.member_bands === true) x.member_bands = undefined
    if (roleOfExtras(cur).role !== 'none') {
      x.banner = parts.length === 1 ? 'one' : 'multi'
      if (parts.length > 1 && !any_bands) warn('sum_needs_bands_elsewhere')
    }
  } else if (d.role === 'parts' && variant === 'bands') {
    x.banner = 'multi'
    x.carriers = []
    if (x.member_bands === true) x.member_bands = undefined
  } else {
    const known = d.diagram?.carriers.length ? d.diagram.carriers : cur.carriers
    x.carriers = [...known]
    if (d.role === 'cases') x.member_bands = true
    else {
      if (known.length === 0) warn('carriers_needed')
      if (x.member_bands === true) x.member_bands = false
      x.expansion = variant === 'expansion'
    }
  }
  // Les porteurs quittés sont MIS DE CÔTÉ (cf. `applyDimensionBanner`) ; des porteurs posés vident la réserve.
  if (x.carriers.length > 0) x.parked = []
  else if (cur.carriers.length > 0) x.parked = [...cur.carriers]
  return x
}

/**
 * LES ÉCRITURES qui feraient dessiner `state` au diagramme, décrites et non faites (le geste les fera,
 * en un pas d'historique, `applyDiagramPatch`). Seul ce qui change est décrit. L'ORDRE : une
 * permutation de l'ordre du modèle permute de même les lignes du diagramme (⇅).
 */
export const toDiagramPatch = (state: Type_DimensionViewState, sankey: Type_ViewSankey): Type_DiagramPatch => {
  const now = fromDiagram(sankey)
  const patch: Type_DiagramPatch = { dims: {}, warnings: [] }
  const common = now.order.filter(id => state.order.includes(id))
  const target = state.order.filter(id => now.order.includes(id))
  if (!sameList(common, target)) {
    const sigma = new Map(common.map((id, k) => [id, target[k]] as [string, string]))
    const rows = sankey.getTagGroupsOrder?.('data_taggs') ?? []
    const next = rows.map(id => sigma.get(id) ?? id)
    if (!sameList(next, rows)) patch.order = next
  }
  const any_bands = state.order.some(id => state.dims[id]?.role === 'parts' && state.dims[id].variants.sankey === 'bands')
  state.order.forEach(id => {
    const d = state.dims[id]
    const cur = now.dims[id]?.diagram
    if (d === undefined || cur === undefined) return
    const x = targetExtrasOf(d, cur, any_bands, code => patch.warnings.push({ dimension_id: id, code }))
    const p: Type_DiagramDimensionPatch = {}
    if (x.banner !== cur.banner) p.banner = x.banner
    if (!sameSet(x.carriers, cur.carriers)) p.carriers = [...x.carriers]
    if (!sameList(x.parked, cur.parked)) p.parked = [...x.parked]
    if (x.member_bands !== cur.member_bands) p.member_bands = x.member_bands
    if (x.reference_node_id !== cur.reference_node_id) p.reference_node_id = x.reference_node_id
    if (x.expansion !== cur.expansion) p.expansion = x.expansion
    const selected = selectedOf(d.diagram === x ? d : { ...d, diagram: x })
    if (selected.length > 0 && !sameSet(selected, cur.selection)) p.selected = selected
    if (!sameList(x.stored_focus, cur.stored_focus)) p.focus = [...x.stored_focus]
    if (!sameList(x.stored_hidden, cur.stored_hidden)) p.hidden = [...x.stored_hidden]
    if (x.auto_place === true) p.auto_place = true
    if (Object.keys(p).length > 0) patch.dims[id] = p
  })
  return patch
}

/**
 * os#1511 (lot 5) — EN NŒUDS, L'EXPANSION AUX EXTRÉMITÉS, ou non (`nodes_expansion`) : le menu de la
 * dimension, et la couronne liée qui passe en sunburst (sunburst = expansion).
 */
export const diagramExpansion = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, on: boolean
): Type_DimensionViewState => {
  const d = state.dims[dimension_id]
  if (d?.diagram === undefined || d.diagram.expansion === on) return state
  return withDiagramRoles(withDim(state, dimension_id, { ...d, diagram: { ...d.diagram, expansion: on } }), sankey)
}

/** Un patch vide : rien à écrire. */
export const isEmptyDiagramPatch = (patch: Type_DiagramPatch): boolean =>
  patch.order === undefined && Object.keys(patch.dims).length === 0

// ── LE TABLEAU DU DIAGRAMME (os#1526) : la sélection lue en colonnes et zooms (`sankeyTable`) ─────

export { sankeyTableOf }
export type { Type_SankeyTableDimension, Type_SankeyTableLevel, Type_TableGesture } from './sankeyTable'

const uniques = <T>(xs: T[]): T[] => xs.filter((x, i) => xs.indexOf(x) === i)

const membersOfIds = (dim: Class_DataTagGroup, ids: string[]): Class_DataTag[] =>
  ids.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)

/**
 * UN GESTE DU TABLEAU DU DIAGRAMME : la nouvelle sélection, et la portée que le tableau montre (le zoom
 * au-dessus de la colonne ; ✕ : elle tombe). Plusieurs membres sur une dimension à choix unique la
 * passent en choix multiple.
 */
export const diagramTableCut = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, g: Type_TableGesture
): Type_DimensionViewState => {
  const d = state.dims[dimension_id]
  const dim = sankey.data_taggs_dict[dimension_id] as Class_DataTagGroup | undefined
  if (d === undefined || dim === undefined) return state
  const ids = tableGestureIds(dim, d, g)
  if (ids.length === 0) return state
  const focus = tableFocusOf(dim, ids)
  return diagramCut(state, sankey, dimension_id, ids, { multi: ids.length > 1, focus })
}

// ── LES COMMANDES DU LECTEUR (os#1511, Jean-Yves 09/10), sur l'état du diagramme ─────────────────

/** Le niveau courant : la profondeur du membre dessiné le plus fin (`current_level_index`). */
export const levelIndexOf = (dim: Class_DataTagGroup, d: Pick<Type_DimensionView, 'shown' | 'hidden'>): number => {
  const nb = dim.level_count
  if (nb === 0) return 0
  return membersOfIds(dim, d.shown.filter(id => !d.hidden.includes(id)))
    .reduce((max, m) => Math.max(max, Math.min(dim.depthOf(m), nb - 1)), 0)
}

/** Les membres du premier niveau dont descend la sélection (eux-mêmes s'ils en sont). */
export const readerRootsOf = (dim: Class_DataTagGroup, d: Type_DimensionView): string[] => uniques(
  membersOfIds(dim, selectedOf(d)).map(m => { let r = m; while (r.parent !== undefined) r = r.parent as Class_DataTag; return r.id }))

/** Les AUTRES dimensions qui superposent plusieurs membres en bandes (pas un diagramme par membre). */
const otherBandedOf = (state: Type_DimensionViewState, dimension_id: string): string[] =>
  Object.keys(state.dims).filter(id => {
    const x = state.dims[id].diagram
    return id !== dimension_id && x !== undefined && x.member_bands !== true && x.drawing === 'multi' && selectedOf(state.dims[id]).length > 1
  })

/**
 * La dimension qui superpose plusieurs membres en bandes SANS que le lecteur puisse la ramener à un
 * seul (elle n'a pas de commande) : la case « Distinguer… » des autres est alors GELÉE (règle de
 * Jean-Yves). os#1511 (Jean-Yves, 14/10) — une dimension qui A une commande ne gèle plus : cocher
 * l'autre case la ramène à un membre dans le même pas (`releaseOtherBands`).
 */
export const readerBlockerOf = (state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string): string | undefined =>
  otherBandedOf(state, dimension_id).find(id => (sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined)?.reader_control === undefined)

/**
 * os#1511 (14/10) — LES CASES « DISTINGUER… » S'EXCLUENT D'ELLES-MÊMES : avant de superposer les
 * membres de `dimension_id`, chaque autre dimension superposée qui a une commande revient à un membre,
 * comme toute autre case « Distinguer… » cochée — une case se décoche (premier niveau), un choix de
 * sous-membres revient à leur membre de tête.
 */
const releaseOtherBands = (state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string): Type_DimensionViewState => {
  const cochees = diagramDims(sankey)
    .filter(other => other.id !== dimension_id && other.reader_control?.kind === 'toggle' &&
      state.dims[other.id] !== undefined && levelIndexOf(other, state.dims[other.id]) > 0)
    .map(other => other.id)
  let out = state
  uniques([...otherBandedOf(state, dimension_id), ...cochees]).forEach(id => {
    const other = sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
    const kind = other?.reader_control?.kind
    if (other === undefined || out.dims[id] === undefined) return
    if (kind === 'toggle' || kind === 'level') out = diagramReaderLevel(out, sankey, id, 0)
    else if (kind === 'pick') out = diagramReaderPick(out, sankey, id, readerRootsOf(other, out.dims[id]).slice(0, 1))
  })
  return out
}

/** Le lecteur choisit des membres : choix multiple dès plusieurs, sans portée. */
export const diagramReaderPick = (state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, ids: string[]) =>
  diagramCut(state, sankey, dimension_id, ids, { multi: ids.length > 1, focus: [] })

/** Le lecteur choisit un NIVEAU entier. */
export const diagramReaderLevel = (state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, depth: number) => {
  const dim = sankey.data_taggs_dict[dimension_id] as Class_DataTagGroup | undefined
  return dim === undefined ? state : diagramReaderPick(state, sankey, dimension_id, (dim.membersAtLevel(depth) as Class_DataTag[]).map(m => m.id))
}

/**
 * Des SOUS-MEMBRES de `root` : aucun ou tous, c'est `root` ; plusieurs, ils se superposent en bandes et
 * les cases « Distinguer… » cochées des autres dimensions se décochent.
 */
export const diagramReaderSubPick = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, root_id: string, ids: string[]
): Type_DimensionViewState => {
  const dim = sankey.data_taggs_dict[dimension_id] as Class_DataTagGroup | undefined
  const root = dim === undefined ? undefined : memberOf(dim, root_id)
  if (dim === undefined || root === undefined) return state
  if (ids.length === 0 || ids.length === dim.childrenOf(root).length) return diagramReaderPick(state, sankey, dimension_id, [root_id])
  let out = diagramReaderPick(state, sankey, dimension_id, ids)
  if (ids.length < 2) return out
  diagramDims(sankey).forEach(other => {
    const o = out.dims[other.id]
    if (other.id !== dimension_id && other.reader_control?.kind === 'toggle' && o !== undefined && levelIndexOf(other, o) > 0) {
      out = diagramReaderLevel(out, sankey, other.id, 0)
    }
  })
  return out
}

/**
 * La case « Distinguer… » : cochée, le deuxième niveau, après avoir libéré les autres dimensions
 * superposées (`releaseOtherBands`) ; décochée, le premier.
 */
export const diagramReaderToggle = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, on: boolean
): Type_DimensionViewState => on
  ? diagramReaderLevel(releaseOtherBands(state, sankey, dimension_id), sankey, dimension_id, 1)
  : diagramReaderLevel(state, sankey, dimension_id, 0)

/**
 * os#1511 (Jean-Yves, 11/10) — « DISTINGUER LES SOUS-FILIÈRES » : cochée, les sous-membres de `root`
 * en bandes, après avoir libéré les autres dimensions superposées ; décochée (ou moins de deux
 * sous-membres), `root` seul.
 */
export const diagramReaderSubDistinguish = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, root_id: string, on: boolean
): Type_DimensionViewState => {
  const dim = sankey.data_taggs_dict[dimension_id] as Class_DataTagGroup | undefined
  const root = dim === undefined ? undefined : memberOf(dim, root_id)
  if (dim === undefined || root === undefined) return state
  const children = dim.childrenOf(root) as Class_DataTag[]
  if (!on || children.length < 2) return diagramReaderPick(state, sankey, dimension_id, [root_id])
  return diagramReaderPick(releaseOtherBands(state, sankey, dimension_id), sankey, dimension_id, children.map(c => c.id))
}

/**
 * « Sélectionner plusieurs » : cochée, un diagramme par membre sur les membres choisis — de n'importe
 * quel niveau, mélangés (Jean-Yves, 11/10) ; décochée, le premier.
 */
export const diagramReaderSeveral = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey, dimension_id: string, on: boolean
): Type_DimensionViewState => {
  const d = state.dims[dimension_id]
  const dim = sankey.data_taggs_dict[dimension_id] as Class_DataTagGroup | undefined
  if (d === undefined || dim === undefined) return state
  const chosen = selectedOf(d)
  return on
    ? diagramMemberBands(diagramReaderPick(state, sankey, dimension_id, chosen), sankey, dimension_id, true)
    : diagramReaderPick(diagramMemberBands(state, sankey, dimension_id, false), sankey, dimension_id, chosen.slice(0, 1))
}

/**
 * LE LIBELLÉ DU SÉLECTEUR DE DESSIN DU SANKEY (clés `Banner.draw_*`) pour une dimension du diagramme :
 * `one` (un membre à la fois, ou aucun dessin), `bands` (plusieurs, en bandes — y compris lus à leur
 * somme quand une autre prend les bandes), `nodes`, `expansion`, `member_bands`. `null` : ni l'un ni
 * l'autre (bannière sans dessin). Hors diagramme, celui de `labelOfDimension`.
 */
export const sankeyLabelOf = (d: Type_DimensionView): Type_SankeyLabel | null => {
  const x = d.diagram
  if (x === undefined) return labelOfDimension('sankey', d) as Type_SankeyLabel
  if (x.drawing === 'nodes') return x.member_bands === true ? 'member_bands' : x.expansion ? 'expansion' : 'nodes'
  if (x.drawing === 'multi') return 'bands'
  if (x.drawing === 'one') return 'one'
  return null
}

// ── LE PLAN DE CHAQUE REPRÉSENTATION ─────────────────────────────────────────────────────────────

export interface Type_MatrixAxisPlan {
  dimension_id: string
  /**
   * 07/10/2026 — PLAT (les membres seuls, à plat : `opened` vide, `entry` = `members`) ou
   * HIÉRARCHIQUE (les ancêtres en groupes, avec sous-totaux).
   */
  variant: Type_MatrixVariant
  /** Les membres de l'axe (parts ; une part unique s'ouvre d'un cran). */
  members: string[]
  /** Les ouverts (sous-totaux / en-têtes de groupe), sous la portée : ceux de `openedOf`. */
  opened: string[]
  /** 07/10/2026 (lot 2) — le premier niveau de l'axe : sous la portée, ce qui mène aux membres. */
  entry: string[]
  /**
   * Où se lit le Total de l'axe : la portée, quand les membres la couvrent toute (rien de décoché,
   * aucun trou) — la valeur déclarée fait foi ; `null` : la somme du premier niveau.
   */
  total: string[] | null
  /** La portée qui RESTREINT l'axe (« Céréales »), pour le titre ; vide à la racine. */
  scope: string[]
  /**
   * 09/10/2026 (lot 3) — LES DÉCOCHÉS de l'axe : ils gardent leur ligne, grisée et hors du Total,
   * comme dans la légende de la couronne (le tableau a ses cases à cocher).
   */
  hidden: string[]
}

export interface Type_MatrixPlan {
  rows: Type_MatrixAxisPlan
  columns: Type_MatrixAxisPlan | null
  /** 07/10/2026 — la dimension en CASES : un tableau par membre (ses membres, à plat). */
  cases: Type_MatrixAxisPlan | null
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
  /** 11/10/2026 — ce que le tableau de navigation montre de chaque dimension à niveaux. */
  table: { [dimension_id: string]: Type_SankeyTableDimension }
}

export type Type_RepresentationPlan =
  | { representation: 'couronne', plan: Type_DrawPlan }
  | { representation: 'matrix', plan: Type_MatrixPlan | null }
  | { representation: 'sankey', plan: Type_SankeyPlan }

/**
 * LES AXES DU TABLEAU PAR LES RÔLES (07/10/2026, correction de Julien) :
 *  - la dimension en `cases` (la dernière) fait UN TABLEAU PAR MEMBRE, dès qu'une autre est active ;
 *    seule active, elle découpe comme une part (la couronne fait de même) ;
 *  - les dimensions en `parts` font les LIGNES puis les COLONNES, dans l'ORDRE (anneau intérieur →
 *    lignes, extérieur → colonnes ; ⇅ les échange), celles qui découpent d'abord.
 */
export const matrixAxesOfState = (
  state: Type_DimensionViewState, sankey: Type_CouronneSankey
): { row_id: string, col_id: string | null, cases_id: string | null } | null => {
  const ids = state.order.filter(id => state.dims[id] !== undefined && sankey.data_taggs_dict[id] !== undefined)
  if (ids.length === 0) return null
  const actives = ids.filter(id => state.dims[id].role !== 'none')
  const divides = (id: string) => partsOf(state.dims[id]).length >= 2
  const last_cases = [...actives].reverse().find(id => state.dims[id].role === 'cases')
  const cases_id = last_cases !== undefined && actives.some(id => id !== last_cases) ? last_cases : null
  const parts = actives.filter(id => id !== cases_id)
  const chosen = [...parts.filter(divides), ...parts.filter(id => !divides(id))].slice(0, 2)
    .sort((a, b) => ids.indexOf(a) - ids.indexOf(b))
  return { row_id: chosen[0] ?? ids[0], col_id: chosen[1] ?? null, cases_id }
}

/**
 * UN AXE DU TABLEAU d'après la dimension : ses membres (montrés − décochés), ses ouverts (les mêmes
 * que les anneaux du sunburst, `openedOf`), son premier niveau sous la portée et son Total. Une part
 * unique qui a des enfants s'ouvre d'un cran (« Monde » en colonnes, ce sont ses continents) : elle
 * fait alors la portée.
 *
 * 07/10/2026 — PLAT : les membres seuls, sans leurs ancêtres (au niveau Sous-régions, pas de
 * continents ni de sous-totaux de continents) ; le Total reste celui de la portée quand les membres la
 * couvrent.
 */
export const matrixAxisOf = (
  dim: Class_DataTagGroup, d: Pick<Type_DimensionView, 'focus' | 'shown' | 'hidden'>, variant: Type_MatrixVariant = 'hierarchical'
): Type_MatrixAxisPlan => {
  let parts = antichainSorted(dim, d.shown.filter(id => !d.hidden.includes(id)))
  let focus = d.focus
  const one = parts.length === 1 ? memberOf(dim, parts[0]) : undefined
  if (one !== undefined && childrenOf(one).length > 0) {
    focus = [one.id]
    parts = childrenOf(one).map(c => c.id)
  }
  const opened = openedOf(dim, { focus, shown: parts })
  const roots = dimensionRootsOf(dim)
  const F = focus.map(id => memberOf(dim, id)).filter((m): m is Class_DataTag => m !== undefined)
  const scope = F.length > 0 ? F : roots.length === 1 ? roots : []
  const keep = new Set([...parts, ...opened])
  const starts = scope.length > 0 ? scope.flatMap(f => childrenOf(f).length > 0 ? childrenOf(f) : [f]) : roots
  const entry = starts.map(m => m.id).filter(id => keep.has(id))
  // Couvre-t-on la portée ? Rien de décoché, et sous chaque ouvert (et la portée) tous les enfants.
  const covers = d.hidden.length === 0 && scope.length > 0 &&
    [...scope, ...opened.map(id => memberOf(dim, id) as Class_DataTag)].every(m =>
      childrenOf(m).length === 0 ? keep.has(m.id) : childrenOf(m).every(c => keep.has(c.id)))
  const telling = F.filter(f => !(roots.length === 1 && roots[0] === f)).map(f => f.id)
  const total = covers ? scope.map(m => m.id) : null
  const hidden = antichainSorted(dim, d.hidden.filter(id => d.shown.includes(id)))
  if (variant === 'flat') {
    return { dimension_id: dim.id, variant, members: parts, opened: [], entry: [...parts], total, scope: telling, hidden }
  }
  return { dimension_id: dim.id, variant, members: parts, opened, entry, total, scope: telling, hidden }
}

/**
 * Le plan du tableau : les axes par les rôles, la coordonnée des autres dimensions celle de la
 * couronne. La dimension des cases se lit, dans le tableau d'ensemble, à son Total (sa portée, sinon
 * ses membres) ; chaque petit tableau la lit à son membre.
 */
const matrixPlanOf = (state: Type_DimensionViewState, sankey: Type_CouronneSankey): Type_MatrixPlan | null => {
  const axes = matrixAxesOfState(state, sankey)
  if (axes === null) return null
  const dimOf = (id: string) => sankey.data_taggs_dict[id] as Class_DataTagGroup
  const axis = (id: string, variant?: Type_MatrixVariant) =>
    matrixAxisOf(dimOf(id), state.dims[id], variant ?? state.dims[id].variants.matrix)
  const fixed = drawPlanOf(toCouronneState(state), sankey).fixed
  const cases = axes.cases_id ? axis(axes.cases_id, 'flat') : null
  const coordinates: Type_MatrixPlan['coordinates'] = {}
  state.order.filter(id => state.dims[id] !== undefined && sankey.data_taggs_dict[id] !== undefined)
    .filter(id => id !== axes.row_id && id !== axes.col_id)
    .forEach(id => {
      const dim = dimOf(id)
      const read = id === axes.cases_id && cases !== null ? (cases.total ?? cases.members) : (fixed[id] ?? partsOf(state.dims[id]))
      const ids = read.filter(m => memberOf(dim, m) !== undefined)
      if (ids.length > 0) coordinates[id] = ids
    })
  return { rows: axis(axes.row_id), columns: axes.col_id ? axis(axes.col_id) : null, cases, coordinates }
}

const partsOf = (d: Type_DimensionView) => d.shown.filter(id => !d.hidden.includes(id))

/**
 * Le plan du Sankey : quelle dimension en bandes, en nœuds, en expansion, par membre — lu sur les
 * rôles ; et la lecture en tableau de chaque dimension à niveaux (colonnes, zooms, mixte).
 */
const sankeyPlanOf = (state: Type_DimensionViewState, sankey: Type_CouronneSankey): Type_SankeyPlan => {
  const plan: Type_SankeyPlan = {
    bands: null, nodes: [], expansion: [], per_member: null, grouping: 'by_node', members: {}, opened: {}, coordinates: {}, table: {}
  }
  const ids = state.order.filter(id => state.dims[id] !== undefined && sankey.data_taggs_dict[id] !== undefined)
  ids.forEach(id => {
    const d = state.dims[id]
    const dim = sankey.data_taggs_dict[id] as Class_DataTagGroup
    const parts = partsOf(d)
    if (dim.is_hierarchical) plan.table[id] = sankeyTableOf(dim, d)
    if (d.role === 'cases' && plan.per_member === null) { plan.per_member = id; plan.members[id] = parts; return }
    if (d.role === 'parts') {
      plan.members[id] = parts
      if (d.variants.sankey === 'bands') { if (plan.bands === null) plan.bands = id } else if (d.variants.sankey === 'expansion') {
        plan.expansion.push(id)
        plan.opened[id] = openedOf(dim, d)
      } else plan.nodes.push(id)
      return
    }
    plan.coordinates[id] = d.role === 'none' && d.focus.length > 0 ? [...d.focus] : parts
  })
  plan.grouping = plan.per_member !== null ? 'by_member' : 'by_node'
  return plan
}

/**
 * CE QUE CHAQUE REPRÉSENTATION DESSINERAIT de l'état (généralise `drawPlanOf`) : la couronne (son
 * plan, inchangé), le tableau (lignes puis colonnes = parts, un tableau par membre = cases, plat ou
 * hiérarchique, portée), le Sankey (bandes, nœuds, expansion, un diagramme par membre, et la lecture
 * de son tableau de navigation).
 */
export function planFor (state: Type_DimensionViewState, representation: 'couronne', sankey: Type_CouronneSankey, subject?: { name: string }): { representation: 'couronne', plan: Type_DrawPlan }
export function planFor (state: Type_DimensionViewState, representation: 'matrix', sankey: Type_CouronneSankey, subject?: { name: string }): { representation: 'matrix', plan: Type_MatrixPlan | null }
export function planFor (state: Type_DimensionViewState, representation: 'sankey', sankey: Type_CouronneSankey, subject?: { name: string }): { representation: 'sankey', plan: Type_SankeyPlan }
export function planFor (state: Type_DimensionViewState, representation: Type_Representation, sankey: Type_CouronneSankey, subject?: { name: string }): Type_RepresentationPlan
export function planFor (
  state: Type_DimensionViewState,
  representation: Type_Representation,
  sankey: Type_CouronneSankey,
  subject?: { name: string }
): Type_RepresentationPlan {
  if (representation === 'couronne') return { representation, plan: drawPlanOf(toCouronneState(state), sankey, subject) }
  if (representation === 'matrix') return { representation, plan: matrixPlanOf(state, sankey) }
  return { representation, plan: sankeyPlanOf(state, sankey) }
}

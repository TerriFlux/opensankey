// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 06/10/2026 — LE MODÈLE COMMUN couronne · Sankey · tableau croisé (os#1511, refonte « rôles
// communs », lot 1 sur 5 : modèle pur). Branchés depuis : la couronne et le tableau croisé
// (`fromFigure`, `toCouronneState`, `figureOptionsOf`, `planFor`). 11/10/2026 (lot 6) — LE CÔTÉ
// SANKEY EST RETIRÉ (`fromDiagram`, `toDiagramPatch`, `planFor(…, 'sankey')`) : Julien a sauté son
// branchement (lot 5a), le ⇅ du Sankey faisant déjà « ordre + dessin » ; ses gestes restent ceux de
// `dimensionDrawingHost`. Les VARIANTES Sankey restent : elles s'écrivent dans le sac d'une figure.
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
// L'état est une INTERFACE à deux sources :
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
}

export type Type_ViewSource = 'linked' | 'detached'

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
    const focus = [...d.focus]
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

export type Type_RepresentationPlan =
  | { representation: 'couronne', plan: Type_DrawPlan }
  | { representation: 'matrix', plan: Type_MatrixPlan | null }

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
 * CE QUE CHAQUE REPRÉSENTATION DESSINERAIT de l'état (généralise `drawPlanOf`) : la couronne (son
 * plan, inchangé), le tableau (lignes puis colonnes = parts, un tableau par membre = cases, plat ou
 * hiérarchique, portée).
 */
export const planFor = (
  state: Type_DimensionViewState,
  representation: 'couronne' | 'matrix',
  sankey: Type_CouronneSankey,
  subject?: { name: string }
): Type_RepresentationPlan => {
  if (representation === 'couronne') return { representation, plan: drawPlanOf(toCouronneState(state), sankey, subject) }
  return { representation, plan: matrixPlanOf(state, sankey) }
}

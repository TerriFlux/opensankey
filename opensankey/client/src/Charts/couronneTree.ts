// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — L'ARBRE QUE LE TRACÉ DESSINE, BÂTI SUR LE PLAN (os#1511, refonte étape 2, lot 2).
//
// `drawPlanOf` dit QUE dessiner (les dimensions qui découpent, leurs parts, la coordonnée des
// autres) ; ce module en fait l'arbre de secteurs que lisent les deux tracés (`drawDonutChart` à plat,
// `drawSunburstChart` en anneaux), et rien d'autre ne le décide. Il ne choisit aucun membre : il
// LIT le cube (`valueForDataTags` par `linkValueUnder` / `sunburstNodeValue`) aux coordonnées que le
// plan donne.
//
// LA FORME est celle de l'ancien `buildNestedDimensionTree`, pour que les tracés, les parts et les
// gestes ne voient pas la différence : une racine (le sujet), puis les dimensions qui découpent
// emboîtées dans l'ordre du plan, chaque part posée au bout de ses anneaux depuis la portée
// (`pathFrom`) ; les identifiants de secteur sont des chemins de membres (`memberPathSectorId`),
// la portée en tête. Une dimension « en secteurs » se replie ensuite dans un anneau
// (`foldInPlaceLevels`), à la demande de l'appelant.

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { displayedNameOf } from '../Elements/ElementNaming'
import { resolvedMemberColors } from '../Algorithms/DimensionPalette'
import type { Type_CouronneState } from '../Representations/couronneState'
import { foldInPlaceLevels } from './DataDimensionHierarchy'
import type { Type_DataDimensionSubject } from './DataDimensionHierarchy'
import { linkValueUnder } from './FigureNavigation'
import type { Type_FigureNavigation } from './FigureNavigation'
import { SUNBURST_DEFAULT_MAX_DEPTH, sunburstNodeValue } from './SunburstHierarchy'
import type { Type_SunburstNode, Type_SunburstRing, Type_SunburstTree } from './SunburstHierarchy'
import { pathFrom } from './couronnePlan'
import type { Type_DrawPlan } from './couronnePlan'
import { memberPathSectorId, memberSectorId, parseMemberSectorId } from './memberSectorId'
import type { Type_MemberRef } from './memberSectorId'

export interface Type_PlanTreeOptions {
  /** Nombre d'anneaux au plus, centre non compris. */
  max_depth?: number
  /** 'sum' (défaut) : un parent vaut la somme de ses enfants ; 'declared' : ce que le cube porte. */
  value_mode?: 'sum' | 'declared'
  node_value_mode?: 'max' | 'inputs' | 'outputs'
  residual_label?: string
  /** Replier les niveaux des dimensions « en secteurs » dans un anneau (le dessin en anneaux). */
  levels_display_of?: (dimension_id: string) => 'in_place' | 'rings'
  /** Une case des petits multiples : la dimension des cases lue sur ces membres (leur somme). */
  at?: { dimension_id: string, member_ids: string[] }
}

/** Tolérance RELATIVE du bouclage parent ↔ Σ enfants (celle de la descente par nœuds). */
const BALANCE_TOLERANCE = 1e-6
const RESIDUAL_SUFFIX = '__residual__'

/** Une coordonnée : un membre, ou plusieurs dont la valeur est la somme. */
type Type_CoordValue = Class_DataTag | Class_DataTag[]

/** Un nœud du chemin des parts d'une dimension (préfixes communs fusionnés). */
interface Type_Trie {
  member: Class_DataTag
  children: Type_Trie[]
}

/** Le mode de dessin des anneaux d'un plan : sunburst pour la dimension qui le demande, secteurs sinon. */
export const planLevelsDisplayOf = (plan: Type_DrawPlan) => (dimension_id: string): 'in_place' | 'rings' =>
  plan.cut.find(c => c.dimension_id === dimension_id)?.drawing === 'sunburst' ? 'rings' : 'in_place'

/**
 * LE PLAN SE DESSINE-T-IL EN ANNEAUX ? Plusieurs dimensions qui découpent (un anneau chacune au moins),
 * ou une en sunburst ; rien ne découpe : seulement si la dimension du secteur unique est en sunburst.
 */
export const planDrawsRings = (plan: Type_DrawPlan, state: Type_CouronneState): boolean => {
  if (plan.cut.length === 0) return plan.whole !== null && state.dims[plan.whole.dimension_id]?.drawing === 'sunburst'
  return plan.cut.length > 1 || plan.cut.some(c => c.drawing === 'sunburst')
}

/**
 * L'ARBRE D'UN PLAN. `null` quand aucune dimension n'entre dans la figure (une couronne sur des
 * dimensions sans niveaux serait un mensonge visuel).
 */
/**
 * os#1511 (15/10) — LA LECTURE DES VALEURS D'UN PLAN : la coordonnée de base (dimensions fixées, portée
 * des dimensions qui découpent) et la valeur du sujet à une coordonnée. Extraite de `buildPlanTree`
 * pour servir aussi au repli des dimensions à un seul membre porteur (`singleValuedCuts`).
 */
const planValueReader = (
  subject: Type_DataDimensionSubject,
  plan: Type_DrawPlan,
  state: Type_CouronneState,
  nav: Type_FigureNavigation,
  options: Pick<Type_PlanTreeOptions, 'node_value_mode' | 'at'> = {}
) => {
  const element = subject.kind === 'node' ? subject.node : subject.link
  const sankey = element.sankey
  const groups = sankey.data_taggs_list as unknown as Class_DataTagGroup[]
  const dimOf = (id: string) => sankey.data_taggs_dict[id] as unknown as Class_DataTagGroup | undefined
  const membersOf = (d: Class_DataTagGroup, ids: readonly string[]) =>
    ids.map(id => d.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
  // Les dimensions de la figure, hors celle des cases (chaque case la lit sur son membre).
  const all = state.order
    .filter(id => id !== plan.cells_dimension_id)
    .map(dimOf).filter((d): d is Class_DataTagGroup => d !== undefined)
  const node_value_mode = options.node_value_mode ?? 'max'

  const focusOf = (d: Class_DataTagGroup) => membersOf(d, state.dims[d.id]?.focus ?? [])
  const asCoord = (ms: Class_DataTag[]): Type_CoordValue | undefined =>
    ms.length === 0 ? undefined : ms.length === 1 ? ms[0] : ms

  // LA COORDONNÉE DE BASE : les dimensions qui ne découpent pas, sur ce que le plan en retient ;
  // celles qui découpent, sur leur portée tant qu'on n'y est pas entré (sinon ce que suit la figure).
  const base = new Map<string, Type_CoordValue>()
  Object.entries(plan.fixed).forEach(([id, ids]) => {
    const d = dimOf(id)
    const c = d ? asCoord(membersOf(d, ids)) : undefined
    if (c !== undefined) base.set(id, c)
  })
  const cuts = plan.cut
    .map(c => ({ c, dim: dimOf(c.dimension_id) }))
    .filter((x): x is { c: Type_DrawPlan['cut'][number], dim: Class_DataTagGroup } => x.dim !== undefined)
  cuts.forEach(({ dim }) => {
    const c = asCoord(focusOf(dim))
    if (c !== undefined) base.set(dim.id, c)
  })
  if (options.at !== undefined) {
    const d = dimOf(options.at.dimension_id)
    const c = d ? asCoord(membersOf(d, options.at.member_ids)) : undefined
    if (c !== undefined) base.set(options.at.dimension_id, c)
  }

  /** La valeur du sujet à une coordonnée : les dimensions fixées, les autres suivies. */
  const valueAt = (coord: Map<string, Type_CoordValue>): number => {
    const multi = groups.find(group => Array.isArray(coord.get(group.id)))
    if (multi !== undefined) {
      return (coord.get(multi.id) as Class_DataTag[])
        .reduce((acc, m) => acc + valueAt(new Map(coord).set(multi.id, m)), 0)
    }
    const tags: Class_DataTag[] = []
    groups.forEach(group => {
      const fixed = coord.get(group.id) as Class_DataTag | undefined
      if (fixed !== undefined) { tags.push(fixed); return }
      const pinned = nav.data_tags?.filter(tag => tag.group.id === group.id) ?? []
      if (pinned.length > 0) { tags.push(...pinned); return }
      tags.push(...(group.selected_tags_list as Class_DataTag[]))
    })
    const at: Type_FigureNavigation = { ...nav, data_tags: tags }
    return subject.kind === 'node'
      ? sunburstNodeValue(subject.node, at, node_value_mode)
      : (linkValueUnder(subject.link, at) ?? 0)
  }

  return { element, dimOf, membersOf, all, focusOf, base, cuts, valueAt }
}

/**
 * os#1511 (Julien, 15/10 : « si une dimension n'a qu'un membre, elle n'est pas active ; c'est
 * perturbant sinon, même dans le tableau croisé on ne comprend rien ») — LES DIMENSIONS QUI DÉCOUPENT
 * SANS RIEN DÉCOUPER : un seul de leurs membres montrés porte une valeur pour ce sujet. Rend, pour
 * chacune, ce membre (ou le premier montré si aucun ne porte rien). Jamais toutes : il reste au moins
 * une dimension qui découpe, celle qui en découpe le plus.
 */
export const singleValuedCuts = (
  subject: Type_DataDimensionSubject,
  plan: Type_DrawPlan,
  state: Type_CouronneState,
  nav: Type_FigureNavigation,
  node_value_mode: Type_PlanTreeOptions['node_value_mode'] = 'max'
): { dimension_id: string, member_id: string }[] => {
  if (plan.cut.length < 2) return []
  const { cuts, base, valueAt, dimOf } = planValueReader(subject, plan, state, nav, { node_value_mode })
  const counted = cuts.map(({ c, dim }) => {
    const valued = c.parts
      .map(p => p.member_id)
      .filter(id => {
        const member = dimOf(dim.id)?.tags_dict[id] as Class_DataTag | undefined
        return member !== undefined && Math.abs(valueAt(new Map(base).set(dim.id, member))) > 0
      })
    return { dimension_id: dim.id, valued, first: c.parts[0]?.member_id }
  })
  const single = counted.filter(x => x.valued.length <= 1)
  if (single.length === 0) return []
  if (single.length === counted.length) {
    const keep = [...counted].sort((a, b) => b.valued.length - a.valued.length)[0]
    single.splice(single.indexOf(keep), 1)
  }
  return single
    .filter(x => (x.valued[0] ?? x.first) !== undefined)
    .map(x => ({ dimension_id: x.dimension_id, member_id: (x.valued[0] ?? x.first) as string }))
}

export const buildPlanTree = (
  subject: Type_DataDimensionSubject,
  plan: Type_DrawPlan,
  state: Type_CouronneState,
  nav: Type_FigureNavigation,
  options: Type_PlanTreeOptions = {}
): Type_SunburstTree | null => {
  const { element, dimOf, membersOf, all, focusOf, base, cuts, valueAt } =
    planValueReader(subject, plan, state, nav, options)
  if (all.length === 0) return null
  const value_mode = options.value_mode ?? 'sum'
  const residual_label = options.residual_label ?? 'Unallocated'
  const max_depth = Math.max(1, (options.max_depth ?? SUNBURST_DEFAULT_MAX_DEPTH) + 1)
  let mismatch_count = 0
  let is_truncated = false

  const colorOf = (dim: Class_DataTagGroup, member: Class_DataTag): string | null =>
    resolvedMemberColors(dim)[member.id] ?? member.color ?? null

  // LES ANNEAUX DE CHAQUE DIMENSION QUI DÉCOUPE : les chemins de ses parts depuis la portée,
  // fusionnés en arbre (ordre de la dimension, celui des parts).
  const tries = cuts.map(({ c, dim }) => {
    const focus = focusOf(dim)
    const roots: Type_Trie[] = []
    c.parts.forEach(p => {
      const m = dim.tags_dict[p.member_id] as Class_DataTag | undefined
      if (m === undefined) return
      let level = roots
      membersOf(dim, pathFrom(dim, m, focus)).forEach(step => {
        let t = level.find(x => x.member === step)
        if (t === undefined) { t = { member: step, children: [] }; level.push(t) }
        level = t.children
      })
    })
    return roots
  })

  // CE QUE LE PLAN NE DESSINE PAS d'une dimension (décochés, membres non choisis), rattaché au secteur
  // qui l'aurait porté : un anneau intermédiaire, ou l'entrée de la dimension. En régime 'declared',
  // il sort de la valeur du secteur, sinon il deviendrait du « non réparti ».
  const ENTRY = ''
  const missing = cuts.map(({ dim }, k) => {
    const on_paths = new Set<Class_DataTag>()
    const walk = (t: Type_Trie) => { on_paths.add(t.member); t.children.forEach(walk) }
    tries[k].forEach(walk)
    const parts = new Set(cuts[k].c.parts.map(p => p.member_id))
    const holds = (m: Class_DataTag): boolean => [...on_paths].some(o => o === m || o.hasAncestor(m))
    const out = new Map<string, Class_DataTag[]>()
    const visit = (m: Class_DataTag) => {
      if (parts.has(m.id)) return
      if (holds(m)) { (m.children as Class_DataTag[]).forEach(visit); return }
      const p = m.parent as Class_DataTag | undefined
      const key = p !== undefined && on_paths.has(p) ? p.id : ENTRY
      out.set(key, [...(out.get(key) ?? []), m])
    }
    const focus = focusOf(dim)
    ;(focus.length > 0 ? focus : (dim.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)).forEach(visit)
    return out
  })

  const nested_palettes = cuts.length > 1
  const withRef = (refs: Type_MemberRef[], dimension_id: string, member_id: string): Type_MemberRef[] =>
    [...refs.filter(r => r.dimension_id !== dimension_id), { dimension_id, member_id }]

  const ringOf = (
    k: number, coord: Map<string, Type_CoordValue>, refs: Type_MemberRef[], depth: number
  ): Type_SunburstNode[] => tries[k]
    .map(t => nodeOf(t, k, coord, refs, depth, t.member.id, depth))
    .filter(n => n.value > 0)

  const nodeOf = (
    t: Type_Trie, k: number, coord_in: Map<string, Type_CoordValue>, refs_in: Type_MemberRef[],
    depth: number, branch: string, entry_depth: number
  ): Type_SunburstNode => {
    const dim = cuts[k].dim
    const m = t.member
    const coord = new Map(coord_in).set(dim.id, m)
    const refs = withRef(refs_in, dim.id, m.id)
    const id = memberPathSectorId(refs)
    const own = t.children.length > 0
    const has_next = own || k + 1 < cuts.length
    const left_out = !has_next ? [] : own ? (missing[k].get(m.id) ?? []) : (missing[k + 1].get(ENTRY) ?? [])
    const left_dim = own ? dim : cuts[k + 1]?.dim
    const hidden_value = left_dim === undefined
      ? 0
      : left_out.reduce((acc, x) => acc + valueAt(new Map(coord).set(left_dim.id, x)), 0)
    const declared = valueAt(coord) - hidden_value
    const node: Type_SunburstNode = {
      id, label: m.name, value: declared, declared, color: colorOf(dim, m),
      depth, children: [], dimension_id: dim.id,
      ...(nested_palettes ? { palette: { index: k, branch_id: branch, depth: depth - entry_depth } } : {})
    }
    if (!has_next) return node
    if (depth + 1 >= max_depth) { is_truncated = true; return node }
    const children = own
      ? t.children.map(c => nodeOf(c, k, coord, refs, depth + 1, branch, entry_depth)).filter(c => c.value > 0)
      : ringOf(k + 1, coord, refs, depth + 1)
    if (children.length === 0) return node
    node.children = children
    const sum = children.reduce((acc, c) => acc + c.value, 0)
    const gap = declared - sum
    if (Math.abs(gap) > Math.max(BALANCE_TOLERANCE, Math.abs(declared) * BALANCE_TOLERANCE)) mismatch_count++
    if (value_mode === 'declared') {
      if (gap > BALANCE_TOLERANCE) {
        node.children = [...children, {
          id: `${id}${RESIDUAL_SUFFIX}`, label: residual_label, value: gap, declared: gap, color: null,
          depth: depth + 1, children: [], is_residual: true, dimension_id: dim.id
        }]
      }
    } else {
      node.value = sum
    }
    return node
  }

  // La portée en tête des identifiants (dans l'ordre de la figure), comme le foyer d'avant.
  const scope_refs: Type_MemberRef[] = all.flatMap(d => focusOf(d).map(f => ({ dimension_id: d.id, member_id: f.id })))
  let children: Type_SunburstNode[]
  if (cuts.length > 0) {
    children = ringOf(0, base, scope_refs, 1)
  } else {
    // RIEN NE DÉCOUPE : un seul secteur, ce que le plan nomme (plusieurs membres : leur somme).
    const whole_dim = plan.whole ? dimOf(plan.whole.dimension_id) : undefined
    const whole = whole_dim ? membersOf(whole_dim, plan.whole?.member_ids ?? []) : []
    const value = valueAt(base)
    children = whole_dim === undefined || whole.length === 0 || value <= 0 ? [] : [{
      id: memberSectorId(whole_dim.id, whole[0].id), label: whole.map(m => m.name).join(', '), value, declared: value,
      color: colorOf(whole_dim, whole[0]), depth: 1, children: [], dimension_id: whole_dim.id
    }]
  }
  const total = children.reduce((acc, c) => acc + c.value, 0)
  const built: Type_SunburstNode = {
    id: element.id,
    // Le centre : la portée (« Céréales, Lait »), sinon le sujet.
    label: plan.centre.scope.length > 0 ? plan.centre.label : displayedNameOf(element),
    value: total, declared: total, color: null, depth: 0, children, dimension_id: all[0].id
  }
  const root = options.levels_display_of ? foldInPlaceLevels(built, options.levels_display_of) : built

  // UN ANNEAU PAR PROFONDEUR, nommé par le premier secteur qui l'occupe : sa dimension, son niveau.
  const first_at: Type_SunburstNode[] = []
  const walk = (node: Type_SunburstNode) => {
    if (first_at[node.depth] === undefined) first_at[node.depth] = node
    node.children.forEach(walk)
  }
  walk(root)
  const rings: Type_SunburstRing[] = first_at.map((node, depth) => {
    const ref = depth === 0 ? null : parseMemberSectorId(node.id)
    const dim = all.find(d => d.id === (ref?.dimension_id ?? all[0].id)) ?? all[0]
    const member = ref !== null ? dim.tags_dict[ref.member_id] as Class_DataTag | undefined : undefined
    const rank = member !== undefined ? dim.depthOf(member) : 0
    return {
      dimension_id: dim.id,
      dimension_label: dim.name,
      level_label: depth === 0 ? '' : (dim.levels[rank] ?? ''),
      is_selected_level: dim.current_level_index === rank
    }
  })

  return {
    dimension_id: all[0].id,
    dimension_label: cuts.map(c => c.dim.name).join(' › ') || all[0].name,
    roots: [root],
    rings,
    total,
    mismatch_count,
    is_truncated
  }
}

// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — LE PLAN DE DESSIN D'UNE COURONNE SUR DIMENSIONS DE DONNÉES (os#1511, refonte étape 2,
// lot 1). « Que dessiner » se décidait à neuf endroits (`dataCutOf`, `smallMultiplesOf`,
// `analysisOf`, `ringsReadingOf`, clic, tableau, légende, centre, hôte des gestes) ; il se décide ICI,
// sur l'état de `couronneState`, et nulle part ailleurs.
//
// Le plan est STRUCTUREL : il dit quels membres se dessinent et comment, pas ce qu'ils valent. Les
// valeurs restent au cube (`valueForDataTags`), lues au dessin sur les coordonnées que le plan donne.
//
// Module PUR. Lot 2 : le dessin est branché dessus (`couronneTree`, `registerAnalysisRepresentations`).

import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Type_CouronneSankey, Type_CouronneState } from '../Representations/couronneState'
import { dimensionRootsOf } from './DataDimensionHierarchy'

/** Une part d'une dimension qui découpe. */
export interface Type_PlanPart {
  member_id: string
  /**
   * Les anneaux de la portée jusqu'à la part, en identifiants de membre : du premier membre sous la
   * portée (sous la racine unique, ou sous le membre de la portée) jusqu'à la part comprise. En
   * secteurs, la part seule. Les profondeurs peuvent différer d'une part à l'autre (mixte).
   */
  path: string[]
}

export interface Type_PlanCut {
  dimension_id: string
  drawing: 'sectors' | 'sunburst'
  /** Les parts (montrés − décochés), dans l'ordre de la dimension. */
  parts: Type_PlanPart[]
}

export interface Type_PlanLegendEntry {
  member_id: string
  label: string
  depth: number
  checked: boolean
}

export interface Type_PlanColumns {
  /** Les niveaux (profondeurs) présents dans `shown`, croissants. */
  depths: number[]
  /** Plusieurs niveaux à la fois. */
  mixed: boolean
}

export interface Type_DrawPlan {
  linked: boolean
  /** Les dimensions qui découpent, dans l'ordre d'emboîtement (la première = anneau intérieur). */
  cut: Type_PlanCut[]
  /**
   * La coordonnée des dimensions qui NE découpent PAS : leurs membres (plusieurs = leur somme).
   * Désactivée : sa portée (sa racine sans portée). Active avec une seule part : cette part.
   */
  fixed: { [dimension_id: string]: string[] }
  /** Les petites couronnes : une par membre (montrés − décochés), au moins deux ; `null` sinon. */
  cells: { dimension_id: string, members: string[] } | null
  /**
   * La dimension « une couronne par membre » quand elle s'applique (active, une autre dimension
   * active pour les parts), même à un seul membre — elle se lit alors sur lui (`fixed`). `null` sinon.
   */
  cells_dimension_id: string | null
  /**
   * Rien ne découpe : le disque (chaque case, avec des cases) est un seul secteur, ce membre. `null` sinon.
   */
  whole: { dimension_id: string, member_ids: string[] } | null
  /** Les candidats de légende de chaque dimension qui découpe ou fait les cases : les montrés, cochés ou non. */
  legend: { [dimension_id: string]: Type_PlanLegendEntry[] }
  /** Les colonnes du tableau à surligner, par dimension (toutes les dimensions de l'ordre). */
  columns: { [dimension_id: string]: Type_PlanColumns }
  centre: {
    /** Le nom au centre : la portée (« Céréales, Lait »), sinon le sujet. */
    label: string
    /** La portée de chaque dimension qui en a une, en noms. */
    scope: { dimension_id: string, names: string[] }[]
    /** Les dimensions qui ne découpent pas, et où elles se lisent. */
    context: { dimension_id: string, dimension_name: string, names: string[] }[]
  }
}

const nameOf = (dim: Class_DataTagGroup, id: string): string =>
  (dim.tags_dict[id] as Class_DataTag | undefined)?.name ?? id

/** Les anneaux de la portée jusqu'à `member` (compris), cf. `Type_PlanPart.path`. */
export const pathFrom = (dim: Class_DataTagGroup, member: Class_DataTag, focus: Class_DataTag[]): string[] => {
  const out: Class_DataTag[] = []
  const single_root = dimensionRootsOf(dim).length === 1
  for (let m: Class_DataTag | undefined = member; m !== undefined; m = m.parent as Class_DataTag | undefined) {
    if (focus.includes(m) && m !== member) break
    if (single_root && m.parent === undefined && m !== member) break
    out.unshift(m)
    if (focus.includes(m)) break
  }
  return out.map(m => m.id)
}

/**
 * LE PLAN DE DESSIN d'un état normalisé (`readCouronneState`). `subject` : ce que la couronne
 * décompose, pour nommer le centre sans portée.
 */
export const drawPlanOf = (
  state: Type_CouronneState,
  sankey: Type_CouronneSankey,
  subject?: { name: string }
): Type_DrawPlan => {
  const dims = state.order
    .map(id => sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined)
    .filter((d): d is Class_DataTagGroup => d !== undefined && state.dims[d.id] !== undefined)
  const st = (d: Class_DataTagGroup) => state.dims[d.id]
  const partsOf = (d: Class_DataTagGroup) => st(d).shown.filter(id => !st(d).hidden.includes(id))
  const members = (d: Class_DataTagGroup, ids: string[]) =>
    ids.map(id => d.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)

  // LES CASES : la dimension en `multiples`, active, une autre dimension active pour les parts, au
  // moins deux membres. Un seul : elle se lit sur ce membre.
  const multiples = dims.find(d => st(d).drawing === 'multiples' && st(d).active)
  const others_active = dims.some(d => d !== multiples && st(d).active)
  const cells_dim = multiples !== undefined && others_active ? multiples : undefined
  const cells = cells_dim !== undefined && partsOf(cells_dim).length > 1
    ? { dimension_id: cells_dim.id, members: partsOf(cells_dim) }
    : null

  const cut: Type_PlanCut[] = []
  const fixed: Type_DrawPlan['fixed'] = {}
  dims.forEach(d => {
    const s = st(d)
    if (d === cells_dim) {
      if (cells === null) fixed[d.id] = partsOf(d)
      return
    }
    const parts = partsOf(d)
    if (!s.active) { fixed[d.id] = s.focus.length > 0 ? [...s.focus] : dimensionRootsOf(d).map(m => m.id); return }
    if (parts.length < 2) { fixed[d.id] = parts; return }
    const focus = members(d, s.focus)
    const drawing = s.drawing === 'sunburst' ? 'sunburst' : 'sectors'
    cut.push({
      dimension_id: d.id,
      drawing,
      parts: members(d, parts).map(m => ({
        member_id: m.id,
        path: drawing === 'sunburst' ? pathFrom(d, m, focus) : [m.id]
      }))
    })
  })

  // RIEN NE DÉCOUPE : un seul secteur, la première dimension active lue ailleurs qu'à son tout (sa
  // portée, sa part unique), sinon la première dimension active à son tout. 04/10/2026 (lot 3) — avec
  // des cases aussi : chaque case dessine alors ce secteur (hors la dimension des cases).
  let whole: Type_DrawPlan['whole'] = null
  const whole_dims = cells === null ? dims : dims.filter(d => d.id !== cells.dimension_id)
  if (cut.length === 0 && whole_dims.length > 0) {
    const dims = whole_dims
    const actives = dims.filter(d => st(d).active)
    const roots = (d: Class_DataTagGroup) => dimensionRootsOf(d).map(m => m.id)
    const telling = actives.find(d => {
      const f = fixed[d.id] ?? []
      return f.length > 0 && (f.length !== roots(d).length || f.some(id => !roots(d).includes(id)))
    }) ?? actives[0] ?? dims[0]
    whole = { dimension_id: telling.id, member_ids: fixed[telling.id] ?? roots(telling) }
  }

  const legend: Type_DrawPlan['legend'] = {}
  const legend_dims = [...cut.map(c => c.dimension_id), ...(cells ? [cells.dimension_id] : [])]
  dims.filter(d => legend_dims.includes(d.id)).forEach(d => {
    legend[d.id] = members(d, st(d).shown).map(m => ({
      member_id: m.id, label: m.name, depth: d.depthOf(m), checked: !st(d).hidden.includes(m.id)
    }))
  })

  const columns: Type_DrawPlan['columns'] = {}
  dims.forEach(d => {
    const depths = [...new Set(members(d, st(d).shown).map(m => d.depthOf(m)))].sort((a, b) => a - b)
    columns[d.id] = { depths, mixed: depths.length > 1 }
  })

  // 05/10/2026 — une portée posée sur la racine unique (« Monde », pour qu'une dimension liée découpe
  // un niveau dessous) ne nomme rien : elle ne restreint rien.
  const telling_focus = (d: Class_DataTagGroup) => {
    const roots = dimensionRootsOf(d)
    return st(d).focus.filter(id => !(roots.length === 1 && roots[0].id === id))
  }
  const scope = dims
    .filter(d => telling_focus(d).length > 0 && d !== cells_dim)
    .map(d => ({ dimension_id: d.id, names: telling_focus(d).map(id => nameOf(d, id)) }))
  const context = dims
    .filter(d => fixed[d.id] !== undefined)
    .map(d => ({ dimension_id: d.id, dimension_name: d.name, names: (fixed[d.id] ?? []).map(id => nameOf(d, id)) }))
  const label = scope.length > 0
    ? scope.map(s => s.names.join(', ')).join(' · ')
    : whole !== null
      ? whole.member_ids.map(id => nameOf(sankey.data_taggs_dict[whole?.dimension_id ?? ''] as Class_DataTagGroup, id)).join(', ')
      : subject?.name ?? ''

  return {
    linked: state.linked, cut, fixed, cells, cells_dimension_id: cells_dim?.id ?? null, whole, legend, columns,
    centre: { label, scope, context }
  }
}

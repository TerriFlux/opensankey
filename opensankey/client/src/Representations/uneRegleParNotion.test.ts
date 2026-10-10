import { monterSocle } from '../Charts/__fixtures__/couronneSocle'
import { foldDonutParts } from '../Charts/NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from '../Charts/figureChartStyle'
import type { Type_StatSlice } from '../Charts/NodeStatsCharts'
import { OTHERS_ID } from '../Algorithms/DimensionOthers'
import { representation_registry } from './RepresentationRegistry'
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
import { COURONNE_KEY, couronneStateVersionOf, DONUT_REPRESENTATION, BARS_REPRESENTATION, MATRIX_REPRESENTATION } from './couronneState'
import { isFigureLinked } from './figureOpening'

// 10/10/2026 — os#1511, rationalisation, lot 4 : UNE REGLE PAR NOTION.

describe('os#1511 lot 4 — Autres : la regle commune', () => {
  const part = (id: string, value: number): Type_StatSlice => ({ id, label: id, value })
  test('la couronne ne replie jamais une part seule, et Autres porte l identifiant commun', () => {
    const st = { ...DONUT_STYLE_DEFAULTS, parts_order: 'value_desc' as const, parts_group_under: 1, parts_max: 0 }
    expect(foldDonutParts([part('a', 50), part('b', 49), part('c', 0.1)], st, 'Autres').map(s => s.id)).toEqual(['a', 'b', 'c'])
    const two = foldDonutParts([part('a', 50), part('b', 49), part('c', 0.1), part('d', 0.1)], st, 'Autres')
    expect(two.map(s => s.id)).toEqual(['a', 'b', OTHERS_ID])
  })
  test('le plafond compte Autres et choisit par valeur', () => {
    const st = { ...DONUT_STYLE_DEFAULTS, parts_order: 'name' as const, parts_group_under: 0, parts_max: 3 }
    const out = foldDonutParts([part('a', 1), part('b', 2), part('c', 30), part('d', 40)], st, 'Autres')
    // Les gardees dans l ordre du reglage, « Autres » en dernier.
    expect(out.slice(0, 2).map(s => s.id).sort()).toEqual(['c', 'd'])
    expect(out.map(s => s.id)[2]).toBe(OTHERS_ID)
  })
})

describe('os#1511 lot 4 — un diagramme par membre se demande', () => {
  test('draws_member_bands : seulement quand il est demande', () => {
    const s = monterSocle()
    expect(s.pays.draws_member_bands).toBe(false)
    s.pays.member_bands = true
    expect(s.pays.draws_member_bands).toBe(true)
    s.pays.member_bands = false
    expect(s.pays.draws_member_bands).toBe(false)
  })
})

describe('os#1511 lot 4 — liee, version', () => {
  test('liee : la cle, sinon l entree detache d avant, sinon liee', () => {
    expect(isFigureLinked({})).toBe(true)
    expect(isFigureLinked({ coordinates_linked: false })).toBe(false)
    expect(isFigureLinked({ hierarchy_expanded: ['detache'] })).toBe(false)
    expect(isFigureLinked({ coordinates_linked: true, hierarchy_expanded: ['detache'] })).toBe(true)
  })
  test('la version du sac : 0 sans cle, 1 sans version, sinon celle ecrite', () => {
    expect(couronneStateVersionOf({})).toBe(0)
    expect(couronneStateVersionOf({ [COURONNE_KEY]: { order: [] } })).toBe(1)
    expect(couronneStateVersionOf({ [COURONNE_KEY]: { version: 2 } })).toBe(2)
  })
})

describe('os#1511 lot 4 — un element engendre : l origine entiere, partout', () => {
  test('couronne, barres et tableau croise lisent l origine sans se restreindre au membre', () => {
    registerAnalysisRepresentations()
    ;[DONUT_REPRESENTATION, BARS_REPRESENTATION, MATRIX_REPRESENTATION].forEach(id => {
      expect(representation_registry.get(id)?.reads_generated_origin).toBe(true)
      expect(representation_registry.get(id)?.generated_origin_whole).toBe(true)
    })
  })
})

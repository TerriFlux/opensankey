import { memberPathSectorId } from '../Charts/memberSectorId'
import type { Type_MemberRef } from '../Charts/memberSectorId'
import { drawPlanOf } from '../Charts/couronnePlan'
import { matrixCutOfCouronne } from '../Charts/DimensionMatrix'
import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import type { Type_Socle } from '../Charts/__fixtures__/couronneSocle'
import { disaggregateDimensionNodes, isGeneratedMemberNode } from '../Algorithms/DimensionDisaggregation'
import type { Class_NodeElement } from '../Elements/Node'
import { readCouronneState } from './couronneState'
import {
  applyLabel, choiceOfLabel, collapseMember, depthsOf, DRAWING_LABELS, expandMember, fromCouronneState, fromDiagram,
  fromFigure, groupingOf, labelOfDimension, openedOf, planFor, showLevel, toCouronneState, toDiagramPatch,
  toFigureOptions, DEFAULT_VARIANTS
} from './dimensionViewState'
import type {
  Type_DimensionView, Type_DimensionViewState, Type_MatrixPlan, Type_Representation, Type_SankeyPlan
} from './dimensionViewState'
import type { Type_DrawPlan } from '../Charts/couronnePlan'

// 06/10/2026 — os#1511, refonte « roles communs », lot 1 : LE MODELE COMMUN couronne · Sankey ·
// tableau croise. Allers-retours des libelles, changement de representation, lie / detache,
// profondeur, anciens formats, et non-regression des plans couronne et tableau.

type Bag = { [k: string]: unknown }

const ref = (dimension_id: string, member_id: string): Type_MemberRef => ({ dimension_id, member_id })
const zoom = (...refs: Type_MemberRef[]) => [memberPathSectorId(refs)]
const croise = descripteur('filiere', 'pays')
const det = (o: Bag): Bag => ({ descriptor: croise, coordinates_linked: false, ...o })
const ouverts = { filiere: ['produits'], pays: ['monde'] }

const couronnePlan = (st: Type_DimensionViewState, s: Type_Socle) => planFor(st, 'couronne', s.sankey).plan as Type_DrawPlan
const matrixPlan = (st: Type_DimensionViewState, s: Type_Socle) => planFor(st, 'matrix', s.sankey).plan as Type_MatrixPlan
const sankeyPlan = (st: Type_DimensionViewState, s: Type_Socle) => planFor(st, 'sankey', s.sankey).plan as Type_SankeyPlan

/** Les reglages reels du filet de la couronne (anciens formats, liee et detachee). */
const CAS: { nom: string, options: Bag, diagramme?: { filiere?: string[], pays?: string[] } }[] = [
  { nom: 'neuve croisee', options: det({}) },
  { nom: 'neuve une dimension', options: { descriptor: descripteur('filiere'), coordinates_linked: false } },
  { nom: 'format detache dans hierarchy_expanded', options: { descriptor: croise, hierarchy_expanded: ['detache', 'membre:filiere/produits', 'membre:pays/monde'] } },
  { nom: 'croise filieres x continents', options: det({ dimension_opening: ouverts }) },
  { nom: 'mixte cereales en HS4', options: det({ dimension_opening: { filiere: ['produits', 'cereales'] } }) },
  { nom: 'decoche lait', options: det({ dimension_opening: ouverts, dimension_hidden: { filiere: ['lait'] } }) },
  { nom: 'pays desactive', options: det({ dimension_opening: ouverts, inactive_dimensions: ['pays'] }) },
  { nom: 'filieres en sunburst', options: det({ dimension_opening: { filiere: ['produits', 'cereales'], pays: ['monde'] }, levels_display_by: { filiere: 'rings' } }) },
  { nom: 'sunburst commun', options: det({ dimension_opening: { filiere: ['produits', 'cereales'] }, levels_display: 'rings' }) },
  { nom: 'zoom cereales', options: det({ dimension_opening: { filiere: ['produits'] }, hierarchy_focus: zoom(ref('filiere', 'cereales')) }) },
  { nom: 'multiples pays', options: det({ dimension_opening: ouverts, small_multiples_by: 'pays' }) },
  { nom: 'multiples pays zoome Europe', options: det({ dimension_opening: ouverts, small_multiples_by: 'pays', hierarchy_focus: zoom(ref('pays', 'europe')) }) },
  { nom: 'rien ne decoupe', options: det({ dimension_opening: {} }) },
  { nom: 'liee par defaut', options: { descriptor: croise } },
  { nom: 'liee croise', options: { descriptor: croise }, diagramme: { filiere: ['ble', 'mais', 'lait'], pays: ['europe', 'ameriques'] } },
  { nom: 'liee zoom cereales', options: { descriptor: croise, hierarchy_focus: zoom(ref('filiere', 'cereales')) }, diagramme: { filiere: ['ble', 'mais', 'lait'] } },
  { nom: 'liee filieres desactivees', options: { descriptor: croise, inactive_dimensions: ['filiere'] }, diagramme: { filiere: ['ble', 'mais'], pays: ['europe', 'ameriques'] } },
  { nom: 'liee multiples par pays', options: { descriptor: croise, small_multiples_by: 'pays' }, diagramme: { pays: ['europe', 'ameriques'] } },
  { nom: 'cle couronne ecrite', options: { couronne: { version: 1, order: ['pays', 'filiere'], dims: { pays: { focus: [], shown: ['europe', 'asie'], hidden: [], active: true, drawing: 'sunburst' }, filiere: { focus: [], shown: ['cereales', 'lait'], hidden: ['lait'], active: true, drawing: 'multiples' } } }, coordinates_linked: false } }
]

const monter = (diagramme?: { filiere?: string[], pays?: string[] }) => {
  const s = monterSocle()
  if (diagramme?.filiere) s.filiere.selectMembers(diagramme.filiere)
  if (diagramme?.pays) s.pays.selectMembers(diagramme.pays)
  return s
}

const vue = (o: Partial<Type_DimensionView> = {}): Type_DimensionView => ({
  role: 'parts', resume: 'parts', variants: { ...DEFAULT_VARIANTS }, focus: [], shown: [], hidden: [], ...o
})

describe('os#1511 modele commun — libelles du selecteur', () => {
  (Object.keys(DRAWING_LABELS) as Type_Representation[]).forEach(r => {
    DRAWING_LABELS[r].forEach(label => {
      test(`aller-retour ${r} ${label}`, () => {
        const d = applyLabel(vue(), r, label)
        expect(labelOfDimension(r, d)).toBe(label)
      })
    })
  })

  test('libelles traduits en role, variante, regroupement', () => {
    expect(choiceOfLabel('sankey', 'one')).toEqual({ role: 'none', grouping: 'by_node' })
    expect(choiceOfLabel('sankey', 'bands')).toEqual({ role: 'parts', variant: 'bands', grouping: 'by_node' })
    expect(choiceOfLabel('sankey', 'member_bands')).toEqual({ role: 'cases', variant: 'nodes', grouping: 'by_member' })
    expect(choiceOfLabel('couronne', 'multiples')).toEqual({ role: 'cases', grouping: 'by_member' })
    expect(choiceOfLabel('couronne', 'sunburst')).toEqual({ role: 'parts', variant: 'sunburst', grouping: 'by_node' })
    expect(choiceOfLabel('matrix', 'columns')).toEqual({ role: 'cases', grouping: 'by_member' })
    expect(choiceOfLabel('couronne', 'bands')).toBeUndefined()
  })

  test('sunburst et expansion sont la meme profondeur, chaque representation garde sa variante', () => {
    const sun = applyLabel(vue(), 'couronne', 'sunburst')
    expect(labelOfDimension('sankey', sun)).toBe('expansion')
    expect(labelOfDimension('matrix', sun)).toBe('rows')
    const nodes = applyLabel(sun, 'sankey', 'nodes')
    expect(labelOfDimension('couronne', nodes)).toBe('sectors')
    // Un membre a la fois dans le Sankey, puis retour : la dimension reprend son role.
    const cases = applyLabel(vue(), 'couronne', 'multiples')
    const one = applyLabel(cases, 'sankey', 'one')
    expect(labelOfDimension('couronne', one)).toBeNull()
    expect(toCouronneState({ source: 'detached', linked: false, order: ['x'], dims: { x: one } }).dims.x.drawing).toBe('multiples')
  })
})

describe('os#1511 modele commun — figure : relecture des anciens formats et non-regression', () => {
  CAS.forEach(c => {
    test(`sans perte et plans identiques : ${c.nom}`, () => {
      const s = monter(c.diagramme)
      const cs = readCouronneState(c.options, s.sankey)
      const st = fromFigure(c.options, undefined, s.sankey)
      // Sans perte : l etat commun rend l etat de la couronne.
      expect(toCouronneState(st)).toEqual(cs)
      // La couronne : le plan d aujourd hui.
      expect(couronnePlan(st, s)).toEqual(drawPlanOf(cs, s.sankey))
      // Le tableau : la coupe d aujourd hui.
      const m = matrixCutOfCouronne(cs, drawPlanOf(cs, s.sankey), s.sankey)
      const mp = matrixPlan(st, s)
      if (m === null) { expect(mp).toBeNull(); return }
      expect(mp.rows.dimension_id).toBe(m.row_id)
      expect(mp.columns?.dimension_id ?? null).toBe(m.col_id)
      const coords: Bag = {}
      m.coordinates.forEach((v, k) => { coords[k] = v.map(t => t.id) })
      expect(mp.coordinates).toEqual(coords)
      // Ecrit puis relu : le meme etat.
      const relu = fromFigure(toFigureOptions(c.options, st), undefined, s.sankey)
      expect(toCouronneState(relu)).toEqual(cs)
    })
  })

  test('roles lus dans les anciens formats', () => {
    const s = monterSocle()
    const mult = fromFigure(det({ dimension_opening: ouverts, small_multiples_by: 'pays' }), undefined, s.sankey)
    expect(mult.order).toEqual(['filiere', 'pays'])
    expect(mult.dims.pays.role).toBe('cases')
    expect(mult.dims.filiere.role).toBe('parts')
    expect(groupingOf(mult)).toBe('by_member')
    const off = fromFigure(det({ dimension_opening: ouverts, inactive_dimensions: ['pays'] }), undefined, s.sankey)
    expect(off.dims.pays.role).toBe('none')
    const rings = fromFigure(det({ dimension_opening: { filiere: ['produits', 'cereales'] }, levels_display_by: { filiere: 'rings' } }), undefined, s.sankey)
    expect(rings.dims.filiere.variants).toEqual({ couronne: 'sunburst', sankey: 'expansion', matrix: 'rows' })
  })

  test('la variante Sankey choisie dans une fenetre est ecrite et relue', () => {
    const s = monterSocle()
    const st = fromFigure(det({ dimension_opening: ouverts }), undefined, s.sankey)
    const nodes = { ...st, dims: { ...st.dims, filiere: applyLabel(st.dims.filiere, 'sankey', 'nodes') } }
    const bag = toFigureOptions(det({ dimension_opening: ouverts }), nodes)
    expect(bag.dimension_opening).toBeUndefined()
    const relu = fromFigure(bag, undefined, s.sankey)
    expect(labelOfDimension('sankey', relu.dims.filiere)).toBe('nodes')
    expect(labelOfDimension('couronne', relu.dims.filiere)).toBe('sectors')
  })
})

describe('os#1511 modele commun — changement de representation', () => {
  test('une couronne par pays, un diagramme par pays, pays en colonnes', () => {
    const s = monterSocle()
    const st = fromFigure(det({ dimension_opening: ouverts, small_multiples_by: 'pays' }), undefined, s.sankey)
    expect(labelOfDimension('couronne', st.dims.pays)).toBe('multiples')
    expect(labelOfDimension('sankey', st.dims.pays)).toBe('member_bands')
    expect(labelOfDimension('matrix', st.dims.pays)).toBe('columns')
    expect(labelOfDimension('sankey', st.dims.filiere)).toBe('bands')
    expect(labelOfDimension('matrix', st.dims.filiere)).toBe('rows')
    const cp = couronnePlan(st, s)
    expect(cp.cells).toEqual({ dimension_id: 'pays', members: ['europe', 'ameriques', 'asie'] })
    const sp = sankeyPlan(st, s)
    expect(sp).toMatchObject({ per_member: 'pays', bands: 'filiere', grouping: 'by_member' })
    expect(sp.members).toEqual({ pays: ['europe', 'ameriques', 'asie'], filiere: ['cereales', 'lait', 'viande'] })
    const mp = matrixPlan(st, s)
    expect(mp.rows).toMatchObject({ dimension_id: 'filiere', members: ['cereales', 'lait', 'viande'] })
    expect(mp.columns).toMatchObject({ dimension_id: 'pays', members: ['europe', 'ameriques', 'asie'] })
  })

  test('changer de representation dans une fenetre garde son etat', () => {
    const s = monterSocle()
    const options = det({ dimension_opening: { filiere: ['produits', 'cereales'], pays: ['monde'] }, levels_display_by: { filiere: 'rings' } })
    const st = fromFigure(options, false, s.sankey)
    // Couronne -> Sankey -> tableau -> couronne : l etat ne passe que par le plan, il ne change pas.
    const sp = sankeyPlan(st, s)
    expect(sp.expansion).toEqual(['filiere'])
    expect(sp.opened.filiere).toEqual(['cereales'])
    expect(matrixPlan(st, s).rows.opened).toContain('cereales')
    const back = fromFigure(toFigureOptions(options, st), false, s.sankey)
    expect(back).toEqual(st)
  })
})

describe('os#1511 modele commun — lie et detache', () => {
  test('deux fenetres detachees sont independantes', () => {
    const s = monterSocle()
    const a0 = det({ dimension_opening: ouverts })
    const b0 = det({ dimension_opening: ouverts })
    const a = fromFigure(a0, false, s.sankey)
    const a2 = { ...a, dims: { ...a.dims, filiere: expandMember(s.filiere, a.dims.filiere, 'cereales') } }
    const a_bag = toFigureOptions(a0, a2)
    expect(fromFigure(a_bag, false, s.sankey).dims.filiere.shown).toEqual(['ble', 'mais', 'lait', 'viande'])
    expect(fromFigure(b0, false, s.sankey).dims.filiere.shown).toEqual(['cereales', 'lait', 'viande'])
    // Le diagramme bouge : une detachee ne suit pas.
    s.filiere.selectMembers(['lait', 'viande'])
    expect(fromFigure(a_bag, false, s.sankey).dims.filiere.shown).toEqual(['ble', 'mais', 'lait', 'viande'])
  })

  test('une fenetre liee partage les membres montres du diagramme', () => {
    const s = monterSocle()
    const bag = { descriptor: croise }
    expect(fromFigure(bag, true, s.sankey).dims.filiere.shown).toEqual(['cereales', 'lait', 'viande'])
    s.filiere.selectMembers(['ble', 'mais', 'lait'])
    const st = fromFigure(bag, true, s.sankey)
    expect(st.source).toBe('linked')
    expect(st.dims.filiere.shown).toEqual(['ble', 'mais', 'lait'])
    // Meme sac, lu detache : son propre etat.
    expect(fromFigure({ ...bag, coordinates_linked: false }, false, s.sankey).dims.filiere.shown).toEqual(['cereales', 'lait', 'viande'])
  })
})

describe('os#1511 modele commun — profondeur', () => {
  test('nœud par nœud : deplier puis replier cereales', () => {
    const s = monterSocle()
    const d = vue({ shown: ['cereales', 'lait', 'viande'] })
    const e = expandMember(s.filiere, d, 'cereales')
    expect(e.shown).toEqual(['ble', 'mais', 'lait', 'viande'])
    expect(openedOf(s.filiere, e)).toEqual(['cereales'])
    expect(depthsOf(s.filiere, e)).toEqual([1, 2])
    expect(expandMember(s.filiere, e, 'viande')).toBe(e)
    expect(collapseMember(s.filiere, e, 'cereales').shown).toEqual(['cereales', 'lait', 'viande'])
  })

  test('niveau par niveau, sous la portee', () => {
    const s = monterSocle()
    const d = vue({ shown: ['cereales', 'lait', 'viande'] })
    expect(showLevel(s.filiere, d, 2).shown).toEqual(['ble', 'mais', 'lait_cru', 'beurre', 'viande'])
    expect(showLevel(s.filiere, d, 1).shown).toEqual(['cereales', 'lait', 'viande'])
    const z = vue({ focus: ['europe', 'ameriques'], shown: ['europe', 'ameriques'] })
    expect(showLevel(s.pays, z, 2).shown).toEqual(['fr', 'es', 'br', 'us'])
    expect(openedOf(s.pays, showLevel(s.pays, z, 2))).toEqual([])
  })

  test('un decoche deplie donne des enfants decoches', () => {
    const s = monterSocle()
    const d = vue({ shown: ['cereales', 'lait', 'viande'], hidden: ['lait'] })
    expect(expandMember(s.filiere, d, 'lait').hidden).toEqual(['lait_cru', 'beurre'])
    expect(collapseMember(s.filiere, expandMember(s.filiere, d, 'lait'), 'lait').hidden).toEqual(['lait'])
  })

  test('expansion mixte : sunburst, expansion Sankey et lignes ouvertes disent la meme chose', () => {
    const s = monterSocle()
    const base = fromFigure(det({ dimension_opening: ouverts }), false, s.sankey)
    const f = expandMember(s.filiere, applyLabel(base.dims.filiere, 'couronne', 'sunburst'), 'cereales')
    const st = { ...base, dims: { ...base.dims, filiere: f } }
    const cut = couronnePlan(st, s).cut.find(c => c.dimension_id === 'filiere')
    expect(cut?.parts.map(p => p.path)).toEqual([['cereales', 'ble'], ['cereales', 'mais'], ['lait'], ['viande']])
    expect(sankeyPlan(st, s)).toMatchObject({ expansion: ['filiere'], opened: { filiere: ['cereales'] } })
    expect(matrixPlan(st, s).rows.members).toEqual(['ble', 'mais', 'lait', 'viande'])
  })
})

describe('os#1511 modele commun — le diagramme', () => {
  const nœud = (s: Type_Socle, name: string) => s.sankey.nodes_list.find(n => n.name === name) as Class_NodeElement

  test('un membre a la fois : role none, lu sur le membre choisi', () => {
    const s = monterSocle()
    s.pays.selectMembers(['europe'])
    const st = fromDiagram(s.sankey)
    expect(st.source).toBe('diagram')
    expect(st.dims.pays).toMatchObject({ role: 'none', focus: ['europe'], shown: ['europe'] })
    expect(labelOfDimension('sankey', st.dims.pays)).toBe('one')
    expect(sankeyPlan(st, s).coordinates.pays).toEqual(['europe'])
    // Vu par la couronne : desactivee, lue sur sa portee.
    expect(couronnePlan(st, s).fixed.pays).toEqual(['europe'])
  })

  test('en bandes : la premiere dimension en choix multiple decoupe les flux', () => {
    const s = monterSocle()
    s.filiere.banner = 'multi'
    s.pays.banner = 'multi'
    s.pays.selectMembers(['europe', 'asie'])
    expect(s.filiere.draws_bands).toBe(true)
    expect(s.pays.draws_bands).toBe(false)
    const st = fromDiagram(s.sankey)
    expect(labelOfDimension('sankey', st.dims.filiere)).toBe('bands')
    // La seconde se lit a la somme de ses membres : le dessin d aujourd hui.
    expect(st.dims.pays.role).toBe('none')
    const sp = sankeyPlan(st, s)
    expect(sp.bands).toBe('filiere')
    expect(sp.coordinates.pays).toEqual(['europe', 'asie'])
    expect(toDiagramPatch(st, s.sankey)).toEqual({ dims: {}, warnings: [] })
  })

  test('en nœuds, un porteur : parts en nœuds, et le dessin engendre un nœud par membre', () => {
    const s = monterSocle()
    s.pays.selectMembers(['europe', 'ameriques', 'asie'])
    nœud(s, 'A').driving_dimension = s.pays
    s.pays.drawingChanged()
    const st = fromDiagram(s.sankey)
    expect(st.dims.pays.role).toBe('parts')
    expect(labelOfDimension('sankey', st.dims.pays)).toBe('nodes')
    expect(st.dims.pays.diagram?.carriers).toEqual([nœud(s, 'A').id])
    const sp = sankeyPlan(st, s)
    expect(sp).toMatchObject({ nodes: ['pays'], per_member: null, grouping: 'by_node' })
    disaggregateDimensionNodes(s.sankey)
    const engendres = s.sankey.nodes_list.filter(n => isGeneratedMemberNode(n)).length
    expect(engendres).toBe(sp.members.pays.length)
  })

  test('deux porteurs : un diagramme par membre, sauf member_bands faux', () => {
    const s = monterSocle()
    s.pays.selectMembers(['europe', 'ameriques'])
    nœud(s, 'A').driving_dimension = s.pays
    nœud(s, 'B').driving_dimension = s.pays
    s.pays.drawingChanged()
    const st = fromDiagram(s.sankey)
    expect(st.dims.pays.role).toBe('cases')
    expect(labelOfDimension('sankey', st.dims.pays)).toBe('member_bands')
    expect(labelOfDimension('couronne', st.dims.pays)).toBe('multiples')
    expect(labelOfDimension('matrix', st.dims.pays)).toBe('columns')
    expect(st.order[st.order.length - 1]).toBe('pays')
    expect(sankeyPlan(st, s)).toMatchObject({ per_member: 'pays', grouping: 'by_member' })
    expect(toDiagramPatch(st, s.sankey)).toEqual({ dims: {}, warnings: [] })
    // Rang « en nœuds » : le patch coupe les bandes par membre.
    const nodes = { ...st, dims: { ...st.dims, pays: applyLabel(st.dims.pays, 'sankey', 'nodes') } }
    expect(toDiagramPatch(nodes, s.sankey).dims.pays).toEqual({ member_bands: false })
    s.pays.member_bands = false
    expect(fromDiagram(s.sankey).dims.pays.role).toBe('parts')
  })

  test('le patch decrit les ecritures sans les faire', () => {
    const s = monterSocle()
    const st = fromDiagram(s.sankey)
    expect(st.dims.filiere.role).toBe('none')
    const bands = { ...st, dims: { ...st.dims, filiere: { ...applyLabel(st.dims.filiere, 'sankey', 'bands'), focus: [] } } }
    expect(toDiagramPatch(bands, s.sankey)).toEqual({ dims: { filiere: { banner: 'multi' } }, warnings: [] })
    expect(s.filiere.banner).toBe('one')
    const per_member = { ...st, dims: { ...st.dims, pays: { ...applyLabel(st.dims.pays, 'sankey', 'member_bands'), focus: [], shown: ['europe', 'asie'] } } }
    const p = toDiagramPatch(per_member, s.sankey)
    expect(p.dims.pays).toEqual({ selected: ['europe', 'asie'] })
    expect(p.warnings.map(w => w.code)).toEqual(['carriers_needed', 'cases_need_two_carriers'])
    const exp = { ...st, dims: { ...st.dims, filiere: { ...applyLabel(st.dims.filiere, 'couronne', 'sunburst'), focus: [] } } }
    expect(toDiagramPatch(exp, s.sankey).warnings.map(w => w.code)).toEqual(['expansion_unsupported', 'carriers_needed'])
  })

  test('du diagramme a la couronne : un diagramme par pays donne une couronne par pays', () => {
    const s = monterSocle()
    s.filiere.banner = 'multi'
    s.pays.selectMembers(['europe', 'ameriques'])
    nœud(s, 'A').driving_dimension = s.pays
    nœud(s, 'B').driving_dimension = s.pays
    s.pays.drawingChanged()
    const st = fromDiagram(s.sankey)
    const cp = couronnePlan(st, s)
    expect(cp.cut.map(c => c.dimension_id)).toEqual(['filiere'])
    expect(cp.cells).toEqual({ dimension_id: 'pays', members: ['europe', 'ameriques'] })
    expect(matrixPlan(st, s).columns?.dimension_id).toBe('pays')
    expect(fromCouronneState(toCouronneState(st)).dims.pays.role).toBe('cases')
  })
})

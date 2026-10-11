import { memberPathSectorId } from '../Charts/memberSectorId'
import type { Type_MemberRef } from '../Charts/memberSectorId'
import { drawPlanOf } from '../Charts/couronnePlan'
import { buildDimensionMatrix, matrixInputOfPlan, matrixOthersId } from '../Charts/DimensionMatrix'
import type { Type_DimensionMatrix } from '../Charts/DimensionMatrix'
import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import type { Type_Socle } from '../Charts/__fixtures__/couronneSocle'
import { readCouronneState } from './couronneState'
import type { Type_CouronneState } from './couronneState'
import {
  applyLabel, choiceOfLabel, collapseMember, depthsOf, DRAWING_LABELS, expandMember,
  fromFigure, groupingOf, labelOfDimension, openedOf, planFor, showLevel, toCouronneState,
  toFigureOptions, DEFAULT_VARIANTS
} from './dimensionViewState'
import type {
  Type_DimensionView, Type_DimensionViewState, Type_MatrixPlan, Type_Representation
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

/**
 * La lecture du tableau d AVANT les roles (sa!929, `matrixCutOfCouronne`), gardee comme reference : les
 * deux premieres dimensions actives, celles qui decoupent d abord, dans l ordre de l etat ; les autres a
 * la coordonnee du plan de la couronne, sinon a leurs parts.
 */
const ancienneLecture = (cs: Type_CouronneState, s: Type_Socle) => {
  const plan = drawPlanOf(cs, s.sankey)
  const order = cs.order.filter(id => cs.dims[id] !== undefined)
  if (order.length === 0) return null
  const actives = order.filter(id => cs.dims[id].active)
  const divides = (id: string) => plan.cut.some(c => c.dimension_id === id) || plan.cells?.dimension_id === id
  const chosen = [...actives.filter(divides), ...actives.filter(id => !divides(id))].slice(0, 2)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
  const row_id = chosen[0] ?? order[0]
  const col_id = chosen[1] ?? null
  const coordinates: { [id: string]: string[] } = {}
  order.filter(id => id !== row_id && id !== col_id).forEach(id => {
    const ids = plan.fixed[id] ?? cs.dims[id].shown.filter(m => !cs.dims[id].hidden.includes(m))
    if (ids.length > 0) coordinates[id] = ids
  })
  return { row_id, col_id, coordinates }
}

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
    expect(choiceOfLabel('matrix', 'tables')).toEqual({ role: 'cases', grouping: 'by_member' })
    expect(choiceOfLabel('matrix', 'hierarchical')).toEqual({ role: 'parts', variant: 'hierarchical', grouping: 'by_node' })
    expect(choiceOfLabel('couronne', 'bands')).toBeUndefined()
  })

  test('sunburst et expansion sont la meme profondeur, chaque representation garde sa variante', () => {
    const sun = applyLabel(vue(), 'couronne', 'sunburst')
    expect(labelOfDimension('sankey', sun)).toBe('expansion')
    expect(labelOfDimension('matrix', sun)).toBe('hierarchical')
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
      // Le tableau, relu comme avant la version 2 (une couronne par membre en colonnes) : les memes
      // axes que la lecture d avant.
      const m = ancienneLecture(cs, s)
      const mp = matrixPlan(fromFigure(c.options, undefined, s.sankey, undefined, 'matrix'), s)
      if (m === null) { expect(mp).toBeNull(); return }
      expect(mp.cases).toBeNull()
      expect(mp.rows.dimension_id).toBe(m.row_id)
      expect(mp.columns?.dimension_id ?? null).toBe(m.col_id)
      expect(mp.coordinates).toEqual(m.coordinates)
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
    expect(rings.dims.filiere.variants).toEqual({ couronne: 'sunburst', sankey: 'expansion', matrix: 'hierarchical' })
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
  test('une couronne par pays, un diagramme par pays, un tableau par pays', () => {
    const s = monterSocle()
    const st = fromFigure(det({ dimension_opening: ouverts, small_multiples_by: 'pays' }), undefined, s.sankey)
    expect(labelOfDimension('couronne', st.dims.pays)).toBe('multiples')
    expect(labelOfDimension('sankey', st.dims.pays)).toBe('member_bands')
    expect(labelOfDimension('matrix', st.dims.pays)).toBe('tables')
    expect(labelOfDimension('sankey', st.dims.filiere)).toBe('bands')
    expect(labelOfDimension('matrix', st.dims.filiere)).toBe('flat')
    const cp = couronnePlan(st, s)
    expect(cp.cells).toEqual({ dimension_id: 'pays', members: ['europe', 'ameriques', 'asie'] })
    const mp = matrixPlan(st, s)
    expect(mp.rows).toMatchObject({ dimension_id: 'filiere', members: ['cereales', 'lait', 'viande'] })
    expect(mp.columns).toBeNull()
    expect(mp.cases).toMatchObject({ dimension_id: 'pays', members: ['europe', 'ameriques', 'asie'] })
  })

  test('sunburst = hierarchique, secteurs = plat : un seul dessin ecrit, lu par les deux', () => {
    const s = monterSocle()
    const options = det({ dimension_opening: { filiere: ['produits', 'cereales'], pays: ['monde'] }, levels_display_by: { filiere: 'rings' } })
    const st = fromFigure(options, false, s.sankey)
    expect(labelOfDimension('couronne', st.dims.filiere)).toBe('sunburst')
    expect(labelOfDimension('matrix', st.dims.filiere)).toBe('hierarchical')
    expect(labelOfDimension('matrix', st.dims.pays)).toBe('flat')
    // Plat choisi dans le tableau : la couronne revient en secteurs.
    const flat = { ...st, dims: { ...st.dims, filiere: applyLabel(st.dims.filiere, 'matrix', 'flat') } }
    expect(toCouronneState(flat).dims.filiere.drawing).toBe('sectors')
    expect(labelOfDimension('sankey', flat.dims.filiere)).toBe('bands')
    // Un tableau par membre choisi dans le tableau : une couronne par membre.
    const tables = { ...st, dims: { ...st.dims, pays: applyLabel(st.dims.pays, 'matrix', 'tables') } }
    expect(toCouronneState(tables).dims.pays.drawing).toBe('multiples')
  })

  test('changer de representation dans une fenetre garde son etat', () => {
    const s = monterSocle()
    const options = det({ dimension_opening: { filiere: ['produits', 'cereales'], pays: ['monde'] }, levels_display_by: { filiere: 'rings' } })
    const st = fromFigure(options, false, s.sankey)
    // Couronne -> tableau -> couronne : l etat ne passe que par le plan, il ne change pas.
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

  test('expansion mixte : sunburst et lignes ouvertes disent la meme chose', () => {
    const s = monterSocle()
    const base = fromFigure(det({ dimension_opening: ouverts }), false, s.sankey)
    const f = expandMember(s.filiere, applyLabel(base.dims.filiere, 'couronne', 'sunburst'), 'cereales')
    const st = { ...base, dims: { ...base.dims, filiere: f } }
    const cut = couronnePlan(st, s).cut.find(c => c.dimension_id === 'filiere')
    expect(cut?.parts.map(p => p.path)).toEqual([['cereales', 'ble'], ['cereales', 'mais'], ['lait'], ['viande']])
    expect(matrixPlan(st, s).rows.members).toEqual(['ble', 'mais', 'lait', 'viande'])
  })
})

describe('os#1511 modele commun, lot 2 — le tableau croise par les roles', () => {
  const plan = (options: Bag, s: Type_Socle, linked = false) => matrixPlan(fromFigure(options, linked, s.sankey), s)
  const lignesDe = (st: Type_DimensionViewState, s: Type_Socle) => {
    const input = matrixInputOfPlan(matrixPlan(st, s), s.sankey)
    return buildDimensionMatrix(
      { kind: 'link', link: s.lien }, { linked: false, dims: [], dividing: [], opened: new Set<string>() }, { data_tags: null },
      { axes: { rows: input.rows, columns: input.columns }, coordinates: input.coordinates, total_label: 'Total' }
    ) as Type_DimensionMatrix
  }

  test('couronne croisee : filieres en lignes, continents en colonnes, totaux a la racine', () => {
    const s = monterSocle()
    const mp = plan(det({ dimension_opening: ouverts }), s)
    expect(mp.rows).toMatchObject({ dimension_id: 'filiere', entry: ['cereales', 'lait', 'viande'], total: ['produits'], scope: [] })
    expect(mp.columns).toMatchObject({ dimension_id: 'pays', entry: ['europe', 'ameriques', 'asie'], total: ['monde'] })
  })

  test('une couronne par pays : un tableau par pays (role cases) ; sac version 1 : pays en colonnes', () => {
    const s = monterSocle()
    const bag = det({ dimension_opening: ouverts, small_multiples_by: 'pays' })
    const st = fromFigure(toFigureOptions(bag, fromFigure(bag, false, s.sankey)), false, s.sankey, undefined, 'matrix')
    expect(st.dims.pays.role).toBe('cases')
    expect(matrixPlan(st, s).cases?.dimension_id).toBe('pays')
    expect(matrixPlan(st, s).columns).toBeNull()
    expect(matrixPlan(st, s).rows.dimension_id).toBe('filiere')
    // Le meme etat ecrit en version 1 (sa!936, « Colonnes : Pays ») : relu par le tableau, pays en colonnes.
    const v1 = { ...bag, couronne: { version: 1, order: ['filiere', 'pays'], dims: {
      filiere: { focus: [], shown: ['cereales', 'lait', 'viande'], hidden: [], active: true, drawing: 'sectors' },
      pays: { focus: [], shown: ['europe', 'ameriques', 'asie'], hidden: [], active: true, drawing: 'multiples' }
    } } }
    const lu = fromFigure(v1, false, s.sankey, undefined, 'matrix')
    expect(matrixPlan(lu, s).columns?.dimension_id).toBe('pays')
    expect(matrixPlan(lu, s).cases).toBeNull()
    // La couronne, elle, garde une couronne par pays.
    expect(fromFigure(v1, false, s.sankey).dims.pays.role).toBe('cases')
  })

  test('plat : pays au niveau des pays, ni continents ni sous-totaux ; hierarchique : les continents en groupes', () => {
    const s = monterSocle()
    const base = fromFigure(det({ dimension_opening: ouverts }), false, s.sankey)
    const st = { ...base, dims: { ...base.dims, pays: showLevel(s.pays, base.dims.pays, 2) } }
    const flat = lignesDe(st, s)
    expect(flat.columns.map(c => c.key)).toEqual(['c:fr', 'c:es', 'c:br', 'c:us', 'c:cn', 'c:__total__'])
    expect(flat.columns.every(c => !c.expanded && (c.depth ?? 0) === 0)).toBe(true)
    const mp = matrixPlan(st, s)
    expect(mp.columns).toMatchObject({ variant: 'flat', opened: [], total: ['monde'] })
    const hier = { ...st, dims: { ...st.dims, pays: applyLabel(st.dims.pays, 'matrix', 'hierarchical') } }
    const mh = lignesDe(hier, s)
    expect(mh.columns.filter(c => c.expanded).map(c => c.member_id)).toEqual(['europe', 'ameriques', 'asie'])
    // Meme Total general, plat ou hierarchique.
    expect(flat.rows[flat.rows.length - 1].cells.slice(-1)).toEqual(mh.rows[mh.rows.length - 1].cells.slice(-1))
  })

  test('un tableau par continent : memes lignes, memes colonnes, la somme des tableaux fait l ensemble', () => {
    const s = monterSocle()
    const base = fromFigure(det({ dimension_opening: ouverts }), false, s.sankey)
    const st = { ...base, dims: { ...base.dims, pays: applyLabel(base.dims.pays, 'couronne', 'multiples') } }
    const mp = matrixPlan(st, s)
    expect(mp.cases?.dimension_id).toBe('pays')
    const input = matrixInputOfPlan(mp, s.sankey)
    const mx = buildDimensionMatrix(
      { kind: 'link', link: s.lien }, { linked: false, dims: [], dividing: [], opened: new Set<string>() }, { data_tags: null },
      { axes: { rows: input.rows, columns: input.columns }, cases: input.cases, coordinates: input.coordinates, total_label: 'Total' }
    ) as Type_DimensionMatrix
    const tables = mx.cases?.tables ?? []
    expect(tables.map(tb => tb.member_id).sort()).toEqual(['ameriques', 'asie', 'europe'])
    tables.forEach(tb => expect(tb.cells.length).toBe(mx.rows.length))
    const total = (cells: (number | null)[][]) => cells[cells.length - 1][0] ?? 0
    expect(tables.reduce((acc, tb) => acc + total(tb.cells), 0)).toBeCloseTo(total(mx.rows.map(r => r.cells)))
  })

  test('zoom cereales : le tableau est restreint a la portee, son total a la portee', () => {
    const s = monterSocle()
    const mp = plan(det({ dimension_opening: { filiere: ['produits'] }, hierarchy_focus: zoom(ref('filiere', 'cereales')) }), s)
    expect(mp.rows).toMatchObject({ entry: ['ble', 'mais'], total: ['cereales'], scope: ['cereales'] })
  })

  test('une ligne decochee disparait, le total devient la somme', () => {
    const s = monterSocle()
    const mp = plan(det({ dimension_opening: ouverts, dimension_hidden: { filiere: ['lait'] } }), s)
    expect(mp.rows.entry).toEqual(['cereales', 'viande'])
    expect(mp.rows.total).toBeNull()
  })

  test('hierarchique : ouvrir une ligne ou une colonne = ouvrir le secteur du sunburst', () => {
    const s = monterSocle()
    const base = fromFigure(det({ dimension_opening: ouverts }), false, s.sankey)
    const hier = (d: Type_DimensionView) => applyLabel(d, 'matrix', 'hierarchical')
    const st = {
      ...base,
      dims: {
        ...base.dims,
        filiere: hier(expandMember(s.filiere, base.dims.filiere, 'cereales')),
        pays: hier(expandMember(s.pays, base.dims.pays, 'europe'))
      }
    }
    const mp = matrixPlan(st, s)
    expect(mp.rows).toMatchObject({ entry: ['cereales', 'lait', 'viande'], opened: ['cereales'], total: ['produits'] })
    expect(mp.columns).toMatchObject({ entry: ['europe', 'ameriques', 'asie'], opened: ['europe'], total: ['monde'] })
    const mx = lignesDe(st, s)
    expect(mx.columns.map(c => [c.key, c.depth ?? null, c.expanded ?? null])).toEqual([
      ['c:fr', 1, false], ['c:es', 1, false], ['c:europe', 0, true], ['c:ameriques', 0, false], ['c:asie', 0, false],
      ['c:__total__', null, null]
    ])
    // Sous-total Europe = France + Espagne, a droite ; le Total ne compte pas deux fois l Europe.
    const cereales = mx.rows.find(r => r.member_id === 'cereales')
    expect(cereales?.cells).toEqual([32, 34, 66, 74, 40, 180])
    expect(mx.rows.filter(r => r.depth === 1).map(r => r.member_id).sort()).toEqual(['ble', 'mais'])
  })
})

describe('os#1511 lot 2 — Autres dans le tableau, la regle de la couronne', () => {
  test('lignes en parts, colonnes en cases : les petits se replient en dernier, ouvrables', () => {
    const s = monterSocle()
    const st = fromFigure(det({ dimension_opening: { filiere: ['produits'], pays: ['monde'] } }), false, s.sankey)
    const input = matrixInputOfPlan(matrixPlan(st, s), s.sankey)
    const build = (opened?: Set<string>) => buildDimensionMatrix(
      { kind: 'link', link: s.lien }, { linked: false, dims: [], dividing: [], opened: new Set<string>() }, { data_tags: null },
      {
        axes: { rows: input.rows, columns: input.columns }, coordinates: input.coordinates, total_label: 'Total',
        others: { label: 'Autres', rows: { min_share_pct: 0, max_parts: 2 }, columns: { min_share_pct: 0, max_parts: 2 }, opened }
      }
    ) as Type_DimensionMatrix
    const mx = build()
    // Colonnes : 3 continents, plafond 2 -> le plus gros + Autres (Europe 315, Asie 175 ; Ameriques 335).
    expect(mx.columns.map(c => c.key)).toEqual(['c:ameriques', `c:${matrixOthersId('c', '')}`, 'c:__total__'])
    expect(mx.columns[1].folded_names).toEqual(['Europe', 'Asie'])
    // Lignes : 3 filieres, plafond 2 -> la plus grosse (Lait) + Autres, en dernier.
    const top = mx.rows.filter(r => r.depth === 0 && r.kind === 'member')
    expect(top.map(r => r.label)).toEqual(['Lait', 'Autres'])
    const total = mx.rows[mx.rows.length - 1].cells
    expect(top.reduce((acc, r) => acc + (r.cells[2] ?? 0), 0)).toBeCloseTo(total[2] ?? 0)
    // Ouvert, Autres montre ses membres sous lui ; les colonnes repliees viennent avant leur sous-total.
    const open = build(new Set([matrixOthersId('r', ''), matrixOthersId('c', '')]))
    expect(open.rows.filter(r => r.depth === 1).map(r => r.label).sort()).toEqual(['Cereales', 'Viande'])
    expect(open.columns.map(c => c.member_id)).toEqual(['ameriques', 'europe', 'asie', matrixOthersId('c', ''), null])
  })
})

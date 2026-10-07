import { memberPathSectorId } from '../Charts/memberSectorId'
import { drawPlanOf } from '../Charts/couronnePlan'
import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import {
  COURONNE_KEY, normalizeCouronneState, readCouronneState, writeCouronneState, type Type_CouronneState
} from './couronneState'

// 04/10/2026 — os#1511, refonte etape 2, lot 1 : L ETAT DE LA COURONNE, lu a un seul endroit.
// Chaque ancien format se convertit, l etat se normalise, et le plan en sort.

const P = (...ids: string[]) => ids
const parts = (plan: ReturnType<typeof drawPlanOf>, dim: string) =>
  plan.cut.find(c => c.dimension_id === dim)?.parts.map(p => p.member_id)
const croise = descripteur('filiere', 'pays')

describe('os#1511 couronneState — conversion des anciens formats', () => {
  test('figure neuve detachee : la premiere dimension decoupe d un cran, les autres a leur racine', () => {
    const s = monterSocle()
    const st = readCouronneState({ descriptor: croise, coordinates_linked: false }, s.sankey)
    expect(st.linked).toBe(false)
    expect(st.order).toEqual(['filiere', 'pays'])
    expect(st.dims.filiere).toEqual({ focus: [], shown: P('cereales', 'lait', 'viande'), hidden: [], active: true, drawing: 'sectors' })
    expect(st.dims.pays.shown).toEqual(['monde'])
    const plan = drawPlanOf(st, s.sankey)
    expect(plan.cut.map(c => c.dimension_id)).toEqual(['filiere'])
    expect(plan.fixed).toEqual({ pays: ['monde'] })
    expect(plan.centre.context).toEqual([{ dimension_id: 'pays', dimension_name: 'Pays partenaires', names: ['Monde'] }])
  })

  test('liee (aucune cle) : shown est la selection du diagramme, toutes les dimensions a niveaux entrent', () => {
    const s = monterSocle()
    const st = readCouronneState({ descriptor: descripteur('filiere') }, s.sankey)
    expect(st.linked).toBe(true)
    expect(st.order).toEqual(['filiere', 'pays'])
    expect(st.dims.filiere.shown).toEqual(P('cereales', 'lait', 'viande'))
    expect(st.dims.pays.shown).toEqual(['monde'])
  })

  test('le mode de fenetre prime sur la cle d avant', () => {
    const s = monterSocle()
    expect(readCouronneState({ descriptor: croise, coordinates_linked: false }, s.sankey, true).linked).toBe(true)
    expect(readCouronneState({ descriptor: croise }, s.sankey, false).linked).toBe(false)
  })

  test('format le plus ancien : detache et membre: dans hierarchy_expanded', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, hierarchy_expanded: ['detache', 'membre:filiere/produits', 'membre:pays/monde']
    }, s.sankey)
    expect(st.linked).toBe(false)
    expect(st.dims.filiere.shown).toEqual(P('cereales', 'lait', 'viande'))
    expect(st.dims.pays.shown).toEqual(P('europe', 'ameriques', 'asie'))
  })

  test('dimension_opening + dimension_hidden : les decoches gardent leur ligne (decision B)', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false,
      dimension_opening: { filiere: ['produits'], pays: ['monde'] }, dimension_hidden: { filiere: ['lait'] }
    }, s.sankey)
    expect(st.dims.filiere.shown).toEqual(P('cereales', 'lait', 'viande'))
    expect(st.dims.filiere.hidden).toEqual(['lait'])
    const plan = drawPlanOf(st, s.sankey)
    expect(parts(plan, 'filiere')).toEqual(['cereales', 'viande'])
    expect(plan.legend.filiere.map(e => [e.member_id, e.checked])).toEqual([['cereales', true], ['lait', false], ['viande', true]])
  })

  test('inactive_dimensions : la dimension garde ses parts et se lit sur sa portee', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false,
      dimension_opening: { filiere: ['produits'], pays: ['monde'] }, inactive_dimensions: ['pays']
    }, s.sankey)
    expect(st.dims.pays).toMatchObject({ active: false, shown: P('europe', 'ameriques', 'asie') })
    const plan = drawPlanOf(st, s.sankey)
    expect(plan.cut.map(c => c.dimension_id)).toEqual(['filiere'])
    expect(plan.fixed.pays).toEqual(['monde'])
  })

  test('toutes desactivees : la premiere reste active', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, inactive_dimensions: ['filiere', 'pays']
    }, s.sankey)
    expect(st.dims.filiere.active).toBe(true)
    expect(st.dims.pays.active).toBe(false)
  })

  test('hierarchy_focus en PILE : le dernier cran fait foi', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, dimension_opening: { filiere: ['produits'], pays: ['monde'] },
      hierarchy_focus: [
        memberPathSectorId([{ dimension_id: 'filiere', member_id: 'cereales' }]),
        memberPathSectorId([{ dimension_id: 'filiere', member_id: 'cereales' }, { dimension_id: 'pays', member_id: 'europe' }])
      ]
    }, s.sankey)
    // Le centre (pays, dernier ecrit) montre les enfants de l Europe ; les cereales ne sont pas
    // ouvertes dans la coupe : la filiere se lit sur elles.
    expect(st.dims.pays).toMatchObject({ focus: ['europe'], shown: P('fr', 'es') })
    expect(st.dims.filiere).toMatchObject({ focus: ['cereales'], shown: ['cereales'] })
    const plan = drawPlanOf(st, s.sankey)
    expect(plan.cut.map(c => c.dimension_id)).toEqual(['pays'])
    expect(plan.fixed.filiere).toEqual(['cereales'])
    expect(plan.centre.scope).toEqual([
      { dimension_id: 'filiere', names: ['Cereales'] }, { dimension_id: 'pays', names: ['Europe'] }
    ])
  })

  test('hierarchy_focus en ZOOM PAR DIMENSION a plusieurs membres (Cereales + Lait)', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, dimension_opening: { filiere: ['produits'] },
      hierarchy_focus: [memberPathSectorId([
        { dimension_id: 'filiere', member_id: 'cereales' }, { dimension_id: 'filiere', member_id: 'lait' }
      ])]
    }, s.sankey)
    expect(st.dims.filiere).toMatchObject({ focus: P('cereales', 'lait'), shown: P('ble', 'mais', 'lait_cru', 'beurre') })
    expect(drawPlanOf(st, s.sankey).centre.label).toBe('Cereales, Lait')
  })

  test('hierarchy_focus d une couronne de NOEUDS : ignore, et conserve a l ecriture', () => {
    const s = monterSocle()
    const options = { descriptor: croise, coordinates_linked: false, hierarchy_focus: ['noeud_42'] }
    expect(readCouronneState(options, s.sankey).dims.filiere.focus).toEqual([])
    const st = readCouronneState(options, s.sankey)
    expect(writeCouronneState(options, st).hierarchy_focus).toEqual(['noeud_42'])
  })

  test('levels_display commun = defaut, levels_display_by le remplace par dimension', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, levels_display: 'rings', levels_display_by: { pays: 'in_place' }
    }, s.sankey)
    expect(st.dims.filiere.drawing).toBe('sunburst')
    expect(st.dims.pays.drawing).toBe('sectors')
  })

  test('nested_tagg_ids donne l ordre ; small_multiples_by passe en dernier', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: descripteur('pays', 'filiere'), coordinates_linked: false,
      dimension_opening: { pays: ['monde'], filiere: ['produits'] }
    }, s.sankey)
    expect(st.order).toEqual(['pays', 'filiere'])
    const multi = readCouronneState({
      descriptor: descripteur('pays', 'filiere'), coordinates_linked: false,
      dimension_opening: { pays: ['monde'], filiere: ['produits'] }, small_multiples_by: 'pays'
    }, s.sankey)
    expect(multi.order).toEqual(['filiere', 'pays'])
    expect(multi.dims.pays.drawing).toBe('multiples')
  })
})

describe('os#1511 couronneState — les cas de Julien', () => {
  test('Cereales zoome + pays en multiples Europe + Ameriques', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, small_multiples_by: 'pays',
      dimension_opening: { filiere: ['produits'], pays: ['monde'] },
      hierarchy_focus: [memberPathSectorId([
        { dimension_id: 'pays', member_id: 'europe' }, { dimension_id: 'pays', member_id: 'ameriques' },
        { dimension_id: 'filiere', member_id: 'cereales' }
      ])]
    }, s.sankey)
    expect(st.dims.filiere).toMatchObject({ focus: ['cereales'], shown: P('ble', 'mais') })
    expect(st.dims.pays).toMatchObject({ focus: P('europe', 'ameriques'), shown: P('europe', 'ameriques'), drawing: 'multiples' })
    const plan = drawPlanOf(st, s.sankey)
    expect(parts(plan, 'filiere')).toEqual(['ble', 'mais'])
    expect(plan.cells).toEqual({ dimension_id: 'pays', members: ['europe', 'ameriques'] })
    expect(plan.centre.label).toBe('Cereales')
  })

  test('croise filieres x continents, en secteurs', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, dimension_opening: { filiere: ['produits'], pays: ['monde'] }
    }, s.sankey)
    const plan = drawPlanOf(st, s.sankey)
    expect(plan.cut.map(c => [c.dimension_id, c.drawing])).toEqual([['filiere', 'sectors'], ['pays', 'sectors']])
    expect(parts(plan, 'pays')).toEqual(['europe', 'ameriques', 'asie'])
    expect(plan.columns.pays).toEqual({ depths: [1], mixed: false })
  })

  test('mixte : Cereales depliee en HS4, les autres filieres au niveau 1', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, dimension_opening: { filiere: ['produits', 'cereales'] }
    }, s.sankey)
    const plan = drawPlanOf(st, s.sankey)
    expect(parts(plan, 'filiere')).toEqual(['ble', 'mais', 'lait', 'viande'])
    expect(plan.columns.filiere).toEqual({ depths: [1, 2], mixed: true })
  })

  test('multiselection Cereales + Lait, en secteurs puis en sunburst', () => {
    const s = monterSocle()
    const state: Type_CouronneState = {
      linked: false, order: ['filiere', 'pays'],
      dims: {
        filiere: { focus: [], shown: P('cereales', 'lait'), hidden: [], active: true, drawing: 'sectors' },
        pays: { focus: [], shown: ['monde'], hidden: [], active: true, drawing: 'sectors' }
      }
    }
    const secteurs = drawPlanOf(normalizeCouronneState(state, s.sankey), s.sankey)
    expect(secteurs.cut[0].parts).toEqual([{ member_id: 'cereales', path: ['cereales'] }, { member_id: 'lait', path: ['lait'] }])
    // Dans la portee Cereales + Lait, leurs HS4, un anneau sous la portee.
    const zoome = normalizeCouronneState({
      ...state, dims: { ...state.dims, filiere: { ...state.dims.filiere, focus: P('cereales', 'lait'), shown: P('ble', 'mais', 'lait_cru', 'beurre'), drawing: 'sunburst' } }
    }, s.sankey)
    expect(drawPlanOf(zoome, s.sankey).cut[0].parts.map(p => p.path)).toEqual([['ble'], ['mais'], ['lait_cru'], ['beurre']])
    // A la racine, en sunburst : Cereales puis ses HS4, Lait seul (profondeurs inegales).
    const sunburst = normalizeCouronneState({
      ...state, dims: { ...state.dims, filiere: { ...state.dims.filiere, shown: P('ble', 'mais', 'lait'), drawing: 'sunburst' } }
    }, s.sankey)
    expect(drawPlanOf(sunburst, s.sankey).cut[0].parts.map(p => p.path)).toEqual([['cereales', 'ble'], ['cereales', 'mais'], ['lait']])
  })

  test('croise en sunburst : filieres en anneaux, pays en secteurs', () => {
    const s = monterSocle()
    const st = readCouronneState({
      descriptor: croise, coordinates_linked: false, levels_display_by: { filiere: 'rings' },
      dimension_opening: { filiere: ['produits', 'cereales'], pays: ['monde'] }
    }, s.sankey)
    const plan = drawPlanOf(st, s.sankey)
    expect(plan.cut.map(c => c.drawing)).toEqual(['sunburst', 'sectors'])
    expect(plan.cut[0].parts.map(p => p.path)).toEqual([['cereales', 'ble'], ['cereales', 'mais'], ['lait'], ['viande']])
    expect(plan.cut[1].parts.map(p => p.path)).toEqual([['europe'], ['ameriques'], ['asie']])
  })

  // 07/10/2026 — REVIREMENT : liee, la portee est celle du DIAGRAMME (`focus_ids` de la dimension).
  test('liee : la portee est celle du diagramme ; une selection qui en sort la ramene a la racine', () => {
    const s = monterSocle()
    const options = { descriptor: croise }
    s.filiere.focus_ids = ['cereales']
    s.filiere.selectMembers(['ble', 'mais'])
    expect(readCouronneState(options, s.sankey, true).dims.filiere).toMatchObject({ focus: ['cereales'], shown: P('ble', 'mais') })
    // Le diagramme passe a Lait + Viande (la barre du haut) : il n est plus zoome.
    s.filiere.selectMembers(['lait', 'viande'])
    expect(readCouronneState(options, s.sankey, true).dims.filiere).toMatchObject({ focus: [], shown: P('lait', 'viande') })
  })

  test('liee : une portee propre ecrite par une figure d avant est ignoree (pas de zoom silencieux)', () => {
    const s = monterSocle()
    const options = { descriptor: croise }
    const st = readCouronneState(options, s.sankey, true)
    const zoome = writeCouronneState(options, { ...st, linked: false, dims: { ...st.dims, filiere: { ...st.dims.filiere, focus: ['cereales'] } } })
    const ancien = { ...zoome, coordinates_linked: undefined }
    expect(readCouronneState(ancien, s.sankey, true).dims.filiere.focus).toEqual([])
    expect(s.filiere.focus_ids).toEqual([])
  })

  test('liee zoomee : le diagramme montre le membre de la portee d un bloc, la couronne descend d un niveau', () => {
    // REGLE DE LA COURONNE LIEE (Julien, lot 2) : diagramme zoome sur Cereales, qu il montre d un bloc
    // -> la couronne montre ses HS4 ; zoome sur Europe seule -> ses pays.
    const s = monterSocle()
    const options = { descriptor: croise }
    s.filiere.focus_ids = ['cereales']
    s.filiere.selectMembers(['cereales'])
    s.pays.focus_ids = ['europe']
    s.pays.selectMembers(['europe'])
    const lu = readCouronneState(options, s.sankey, true)
    expect(lu.dims.filiere).toMatchObject({ focus: ['cereales'], shown: P('ble', 'mais') })
    expect(lu.dims.pays).toMatchObject({ focus: ['europe'], shown: P('fr', 'es') })
    // La legende : les parts ainsi calculees.
    const plan = drawPlanOf(lu, s.sankey)
    expect(plan.legend.filiere.map(e => e.member_id)).toEqual(P('ble', 'mais'))
  })

  test('liee, les decoches restent a la figure', () => {
    const s = monterSocle()
    const options = { descriptor: croise }
    const st = readCouronneState(options, s.sankey, true)
    const bag = writeCouronneState(options, { ...st, dims: { ...st.dims, filiere: { ...st.dims.filiere, hidden: ['lait'] } } })
    expect((bag[COURONNE_KEY] as { dims: { filiere: object } }).dims.filiere).not.toHaveProperty('shown')
    const plan = drawPlanOf(readCouronneState(bag, s.sankey, true), s.sankey)
    expect(parts(plan, 'filiere')).toEqual(['cereales', 'viande'])
    expect(plan.legend.filiere.find(e => e.member_id === 'lait')?.checked).toBe(false)
  })
})

describe('os#1511 couronneState — invariants', () => {
  const base = (): Type_CouronneState => ({
    linked: false, order: ['filiere', 'pays'],
    dims: {
      filiere: { focus: [], shown: P('cereales', 'lait', 'viande'), hidden: [], active: true, drawing: 'sectors' },
      pays: { focus: [], shown: ['monde'], hidden: [], active: true, drawing: 'sectors' }
    }
  })
  const avec = (filiere: Partial<Type_CouronneState['dims'][string]>) => {
    const b = base()
    return { ...b, dims: { ...b.dims, filiere: { ...b.dims.filiere, ...filiere } } }
  }

  test('antichaine : un ancetre et son descendant, l ancetre tombe', () => {
    const s = monterSocle()
    expect(normalizeCouronneState(avec({ shown: P('cereales', 'ble', 'lait') }), s.sankey).dims.filiere.shown).toEqual(P('ble', 'lait'))
    expect(normalizeCouronneState(avec({ focus: P('produits', 'cereales'), shown: ['ble'] }), s.sankey).dims.filiere.focus).toEqual(['cereales'])
  })

  test('shown dans la portee : hors portee sort, au-dessus se ramene a la portee', () => {
    const s = monterSocle()
    expect(normalizeCouronneState(avec({ focus: ['cereales'], shown: P('ble', 'lait') }), s.sankey).dims.filiere.shown).toEqual(['ble'])
    expect(normalizeCouronneState(avec({ focus: ['cereales'], shown: P('produits') }), s.sankey).dims.filiere.shown).toEqual(['cereales'])
    expect(normalizeCouronneState(avec({ focus: ['cereales'], shown: ['lait'] }), s.sankey).dims.filiere.shown).toEqual(['cereales'])
  })

  test('hidden dans shown, et jamais tout shown', () => {
    const s = monterSocle()
    expect(normalizeCouronneState(avec({ hidden: P('lait', 'ble') }), s.sankey).dims.filiere.hidden).toEqual(['lait'])
    expect(normalizeCouronneState(avec({ hidden: P('cereales', 'lait', 'viande') }), s.sankey).dims.filiere.hidden).toEqual([])
  })

  test('membres et dimensions inconnus retires', () => {
    const s = monterSocle()
    const st = normalizeCouronneState({ ...avec({ shown: P('lait', 'fantome') }), order: ['filiere', 'inconnue', 'pays'] }, s.sankey)
    expect(st.order).toEqual(['filiere', 'pays'])
    expect(st.dims.filiere.shown).toEqual(['lait'])
  })

  test('un seul multiples, en fin d ordre', () => {
    const s = monterSocle()
    const b = base()
    const st = normalizeCouronneState({
      ...b, dims: { filiere: { ...b.dims.filiere, drawing: 'multiples' }, pays: { ...b.dims.pays, drawing: 'multiples' } }
    }, s.sankey)
    expect([st.dims.filiere.drawing, st.dims.pays.drawing]).toEqual(['sectors', 'multiples'])
    const seul = normalizeCouronneState({ ...b, dims: { ...b.dims, filiere: { ...b.dims.filiere, drawing: 'multiples' } } }, s.sankey)
    expect(seul.order).toEqual(['pays', 'filiere'])
  })

  test('multiples sans autre dimension active : pas de cases', () => {
    const s = monterSocle()
    const b = base()
    const st = normalizeCouronneState({
      ...b, dims: { filiere: { ...b.dims.filiere, active: false }, pays: { ...b.dims.pays, shown: P('europe', 'asie'), drawing: 'multiples' } }
    }, s.sankey)
    const plan = drawPlanOf(st, s.sankey)
    expect(plan.cells).toBeNull()
  })
})

describe('os#1511 couronneState — ecriture', () => {
  test('n ecrit que couronne, retire les anciennes cles, et se relit a l identique', () => {
    const s = monterSocle()
    const options = {
      descriptor: croise, coordinates_linked: false, hierarchy_expanded: ['detache', 'membre:filiere/produits'],
      dimension_opening: { filiere: ['produits'], pays: ['monde'] }, dimension_hidden: { pays: ['asie'] },
      inactive_dimensions: [], levels_display: 'rings', levels_display_by: { pays: 'in_place' }, small_multiples_by: 'pays',
      hierarchy_focus: [memberPathSectorId([{ dimension_id: 'filiere', member_id: 'cereales' }])], legend_visible: true
    }
    const st = readCouronneState(options, s.sankey)
    const bag = writeCouronneState(options, st)
    ;['dimension_opening', 'dimension_hidden', 'inactive_dimensions', 'levels_display', 'levels_display_by',
      'small_multiples_by', 'hierarchy_focus', 'hierarchy_expanded'].forEach(k => expect(bag[k]).toBeUndefined())
    expect(bag.legend_visible).toBe(true)
    expect(bag.coordinates_linked).toBe(false)
    expect((bag.descriptor as { decompose: object }).decompose).toEqual({ kind: 'data_dimension', data_tagg_id: 'filiere' })
    expect(readCouronneState(bag, s.sankey)).toEqual(st)
    expect(drawPlanOf(readCouronneState(bag, s.sankey), s.sankey)).toEqual(drawPlanOf(st, s.sankey))
  })
})

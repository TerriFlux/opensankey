import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import { drawPlanOf } from '../Charts/couronnePlan'
import { memberPathSectorId } from '../Charts/memberSectorId'
import { couronneGesturesOf, type Type_CouronneGestures } from './couronneGestures'
import { COURONNE_KEY, LEGACY_COURONNE_KEYS, readCouronneState } from './couronneState'

// 04/10/2026 — os#1511, refonte etape 2, lot 3 : LES GESTES DE LA COURONNE ecrivent l etat unique.
// Chaque geste lit l etat, le modifie, l ecrit par `writeCouronneState` (detachee) et, liee, la
// selection du diagramme pour `shown`. Jamais une ancienne cle. 07/10/2026 : liee, le zoom est partage
// avec le diagramme ; detachee, il reste a la figure.

type Bag = { [k: string]: unknown }

const monter = (options: Bag) => {
  const s = monterSocle()
  const app = s.app as unknown as { runHeavyGesture: (w: () => void) => void }
  app.runHeavyGesture = (w: () => void) => w()
  const box = { options, writes: 0 }
  const g = (): Type_CouronneGestures => couronneGesturesOf({
    app: s.app, options: box.options, declared: ['filiere', 'pays'],
    write: o => { box.options = o; box.writes++ }
  }) as Type_CouronneGestures
  const state = () => readCouronneState(box.options, s.sankey)
  const plan = () => drawPlanOf(state(), s.sankey)
  const parts = (dim: string) => plan().cut.find(c => c.dimension_id === dim)?.parts.map(p => p.member_id)
  return { s, box, g, state, plan, parts }
}
const part = (...refs: [string, string][]) => memberPathSectorId(refs.map(([dimension_id, member_id]) => ({ dimension_id, member_id })))
const det = { descriptor: descripteur('filiere', 'pays'), coordinates_linked: false }
const lie = { descriptor: descripteur('filiere', 'pays') }
const sansAncienneCle = (o: Bag) => LEGACY_COURONNE_KEYS.every(k => o[k] === undefined)

describe('os#1511 couronneGestures — detachee', () => {
  test('en-tete : la colonne seule, les autres desactivees ; reclic la desactive (une reste active)', () => {
    const m = monter(det)
    m.g().chooseColumn('pays', 1, true)
    expect(m.parts('pays')).toEqual(['europe', 'ameriques', 'asie'])
    expect(m.state().dims.filiere.active).toBe(false)
    expect(m.box.options[COURONNE_KEY]).toBeDefined()
    expect(sansAncienneCle(m.box.options)).toBe(true)
    m.g().deactivate('pays')
    expect(m.state().dims.pays.active).toBe(false)
    expect(m.state().dims.filiere.active).toBe(true)
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
  test('ctrl+clic : la colonne s ajoute, croise', () => {
    const m = monter(det)
    m.g().chooseColumn('pays', 1, false)
    expect(m.plan().cut.map(c => c.dimension_id)).toEqual(['filiere', 'pays'])
  })
  test('deplie : la part cede sa place a ses enfants (mixte) ; shift+clic replie', () => {
    const m = monter(det)
    m.g().unfold(part(['filiere', 'cereales']))
    expect(m.parts('filiere')).toEqual(['ble', 'mais', 'lait', 'viande'])
    expect(m.plan().columns.filiere.mixed).toBe(true)
    m.g().fold(part(['filiere', 'ble']))
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
  test('zoom : la portee descend sous la part ; le centre remonte a la part', () => {
    const m = monter(det)
    m.g().zoomTo(part(['filiere', 'cereales']))
    expect(m.state().dims.filiere.focus).toEqual(['cereales'])
    expect(m.parts('filiere')).toEqual(['ble', 'mais'])
    m.g().back?.()
    expect(m.state().dims.filiere.focus).toEqual([])
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
  test('liste de zoom a plusieurs membres, puis le croix', () => {
    const m = monter(det)
    m.g().setFocus('filiere', ['cereales', 'lait'])
    expect(m.parts('filiere')).toEqual(['ble', 'mais', 'lait_cru', 'beurre'])
    m.g().setFocus('filiere', [])
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
  test('legende : decocher retire la part, la ligne reste', () => {
    const m = monter(det)
    m.g().toggleHidden('filiere', 'lait', false)
    expect(m.parts('filiere')).toEqual(['cereales', 'viande'])
    expect(m.plan().legend.filiere.map(e => [e.member_id, e.checked])).toEqual([['cereales', true], ['lait', false], ['viande', true]])
    m.g().toggleHidden('filiere', 'lait', true)
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
  test('arbre : les montres libres, a plusieurs niveaux', () => {
    const m = monter(det)
    m.g().setShown('filiere', ['ble', 'lait'])
    expect(m.parts('filiere')).toEqual(['ble', 'lait'])
  })
  test('dessin : une couronne par membre est exclusive et passe en bas ; les lignes s echangent', () => {
    const m = monter(det)
    m.g().setDrawing('filiere', 'multiples')
    expect(m.state().order).toEqual(['pays', 'filiere'])
    expect(m.plan().cells?.members).toEqual(['cereales', 'lait', 'viande'])
    m.g().move(['pays', 'filiere'], 'pays', 1)
    // La ligne du bas (pays) fait les cases : elle descend d un niveau pour en avoir plusieurs.
    expect(m.state().dims.pays.drawing).toBe('multiples')
    expect(m.state().dims.filiere.drawing).toBe('sectors')
    expect(m.plan().cells?.members).toEqual(['europe', 'ameriques', 'asie'])
    m.g().setDrawing('filiere', 'sunburst')
    expect(m.state().dims.filiere.drawing).toBe('sunburst')
  })
})

// 05/10/2026 — EN UNE COURONNE PAR MEMBRE, retirer une colonne active (ctrl+clic ou reclic) ne
// faisait rien : la dimension des cases ne comptait pas parmi les actives, et sa ligne n avait pas
// de ctrl+clic.
describe('os#1511 couronneGestures — une couronne par membre, retirer une colonne', () => {
  const enMultiples = (options: Bag) => {
    const m = monter(options)
    m.g().setDrawing('pays', 'multiples')
    expect(m.plan().cells?.members).toEqual(['europe', 'ameriques', 'asie'])
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
    return m
  }
  test.each([['detachee', det], ['liee', lie]])('%s : retirer la dimension des cases donne une seule couronne', (_n, o) => {
    const m = enMultiples(o)
    m.g().deactivate('pays')
    expect(m.plan().cells).toBeNull()
    expect(m.plan().cut.map(c => c.dimension_id)).toEqual(['filiere'])
    expect(m.state().dims.pays.drawing).toBe('multiples')
    // Elle revient (ctrl+clic sur un en-tete) : les cases reviennent.
    m.g().chooseColumn('pays', 1, false)
    expect(m.plan().cells?.members).toEqual(['europe', 'ameriques', 'asie'])
  })
  test.each([['detachee', det], ['liee', lie]])('%s : retirer la dimension des parts laisse les cases seules, en secteurs', (_n, o) => {
    const m = enMultiples(o)
    m.g().deactivate('filiere')
    expect(m.state().dims.filiere.active).toBe(false)
    expect(m.plan().cells).toBeNull()
    expect(m.parts('pays')).toEqual(['europe', 'ameriques', 'asie'])
    // Au moins une active : retirer la derniere reactive l autre.
    m.g().deactivate('pays')
    expect(m.state().dims.pays.active).toBe(false)
    expect(m.state().dims.filiere.active).toBe(true)
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
})

describe('os#1511 couronneGestures — liee', () => {
  // 07/10/2026 — REVIREMENT : lie, le zoom est partage. La portee vit sur la dimension du diagramme.
  test('zoom : le diagramme zoome aussi (portee + selection restreinte) ; le centre ramene tout', () => {
    const m = monter(lie)
    m.g().zoomTo(part(['filiere', 'cereales']))
    expect(m.s.filiere.focus_ids).toEqual(['cereales'])
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['ble', 'mais'])
    expect(m.parts('filiere')).toEqual(['ble', 'mais'])
    // La figure n ecrit pas sa portee : c est celle du diagramme.
    expect((m.box.options[COURONNE_KEY] as { dims: Bag }).dims.filiere).not.toHaveProperty('focus')
    m.g().back?.()
    expect(m.s.filiere.focus_ids).toEqual([])
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['cereales', 'lait', 'viande'])
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
  test('zoom : un seul pas d annulation, d ou que vienne le geste', () => {
    const m = monter(lie)
    m.g().zoomTo(part(['filiere', 'cereales']))
    m.s.app.history.applyUndo()
    expect(m.s.filiere.focus_ids).toEqual([])
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['cereales', 'lait', 'viande'])
    m.s.app.history.applyRedo()
    expect(m.s.filiere.focus_ids).toEqual(['cereales'])
  })
  test('une autre fenetre liee lit la meme portee', () => {
    const m = monter(lie)
    m.g().zoomTo(part(['filiere', 'cereales']))
    expect(readCouronneState(lie, m.s.sankey).dims.filiere.focus).toEqual(['cereales'])
  })
  test('detachee zoomee : le diagramme ne bouge pas', () => {
    const m = monter(det)
    m.g().zoomTo(part(['filiere', 'cereales']))
    expect(m.s.filiere.focus_ids).toEqual([])
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['cereales', 'lait', 'viande'])
  })
  test('migration : une portee propre d une figure liee est ignoree sans portee du diagramme', () => {
    const m = monter({ ...lie, [COURONNE_KEY]: { version: 1, order: ['filiere', 'pays'], dims: { filiere: { focus: ['cereales'] } } } })
    expect(m.state().dims.filiere.focus).toEqual([])
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['cereales', 'lait', 'viande'])
  })
  test('une selection qui sort de la portee defait le zoom', () => {
    const m = monter(lie)
    m.g().zoomTo(part(['filiere', 'cereales']))
    m.s.filiere.selectMembers(['lait'])
    expect(m.s.filiere.focus_ids).toEqual([])
  })
  test('legende : decocher garde la ligne et ne touche pas au diagramme', () => {
    const m = monter(lie)
    m.g().toggleHidden('filiere', 'lait', false)
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['cereales', 'lait', 'viande'])
    expect(m.parts('filiere')).toEqual(['cereales', 'viande'])
    expect(m.plan().legend.filiere.find(e => e.member_id === 'lait')?.checked).toBe(false)
  })
  test('deplie et en-tete ecrivent la selection du diagramme, en un pas', () => {
    const m = monter(lie)
    m.g().unfold(part(['filiere', 'cereales']))
    expect(m.s.filiere.selected_tags_list.map(t => t.id)).toEqual(['ble', 'mais', 'lait', 'viande'])
    m.g().chooseColumn('pays', 1, false)
    expect(m.s.pays.selected_tags_list.map(t => t.id)).toEqual(['europe', 'ameriques', 'asie'])
    expect(m.plan().cut.map(c => c.dimension_id)).toEqual(['filiere', 'pays'])
  })
  test('une couronne par membre sur un pays seul : la portee descend, le diagramme reste au monde', () => {
    const m = monter(lie)
    m.g().setDrawing('pays', 'multiples')
    expect(m.s.pays.selected_tags_list.map(t => t.id)).toEqual(['monde'])
    expect(m.plan().cells?.members).toEqual(['europe', 'ameriques', 'asie'])
  })
  test('detacher fige ce qui est montre', () => {
    const m = monter(lie)
    m.box.options = m.g().linkedOptions(false)
    expect(m.state().linked).toBe(false)
    m.s.filiere.selectMembers(['lait'])
    expect(m.parts('filiere')).toEqual(['cereales', 'lait', 'viande'])
  })
})

// 07/10/2026 — os#1511, lot 2 : LES GESTES DU TABLEAU CROISE ecrivent l etat commun.
describe('os#1511 couronneGestures — tableau croise', () => {
  const ouverts = { ...det, dimension_opening: { filiere: ['produits'], pays: ['monde'] } }
  const selection = (m: ReturnType<typeof monter>, dim: 'filiere' | 'pays') => m.s[dim].selected_tags_list.map(t => t.id)

  test('detachee : + ouvre un membre (mixte), - le referme', () => {
    const m = monter(ouverts)
    m.g().openMember('pays', 'europe')
    expect(m.state().dims.pays.shown).toEqual(['fr', 'es', 'ameriques', 'asie'])
    m.g().closeMember('pays', 'europe')
    expect(m.state().dims.pays.shown).toEqual(['europe', 'ameriques', 'asie'])
  })
  test('une part unique ouverte d un cran : + ouvre la route', () => {
    const m = monter({ ...det, dimension_opening: { filiere: ['produits'] } })
    expect(m.state().dims.pays.shown).toEqual(['monde'])
    m.g().openMember('pays', 'europe')
    expect(m.state().dims.pays.shown).toEqual(['fr', 'es', 'ameriques', 'asie'])
  })
  test('- ne replie pas la portee', () => {
    const m = monter(ouverts)
    m.g().setFocus('filiere', ['cereales'])
    const avant = m.state().dims.filiere.shown
    m.g().closeMember('filiere', 'cereales')
    expect(m.state().dims.filiere.shown).toEqual(avant)
  })
  test('maj+clic : tout le niveau', () => {
    const m = monter(ouverts)
    m.g().showLevel('pays', 2)
    expect(m.state().dims.pays.shown).toEqual(['fr', 'es', 'br', 'us', 'cn'])
  })
  test('colonnes = role cases : la couronne revient en une couronne par pays ; (aucune) les retire', () => {
    const m = monter(ouverts)
    m.g().setMatrixColumns('filiere', 'pays')
    expect(m.state().dims.pays.drawing).toBe('multiples')
    expect(m.state().order).toEqual(['filiere', 'pays'])
    expect(m.plan().cells).toEqual({ dimension_id: 'pays', members: ['europe', 'ameriques', 'asie'] })
    m.g().swap('filiere', 'pays')
    expect(m.state().dims.filiere.drawing).toBe('multiples')
    expect(m.state().order).toEqual(['pays', 'filiere'])
    m.g().setMatrixColumns('pays', null)
    expect(m.state().dims.filiere).toMatchObject({ active: false, drawing: 'sectors' })
    expect(m.plan().cells).toBeNull()
  })
  test('liee : + ouvre la selection du diagramme', () => {
    const m = monter(lie)
    expect(selection(m, 'pays')).toEqual(['monde'])
    m.g().openMember('pays', 'europe')
    expect(selection(m, 'pays').sort()).toEqual(['ameriques', 'asie', 'es', 'fr'])
    m.g().closeMember('pays', 'europe')
    expect(selection(m, 'pays').sort()).toEqual(['ameriques', 'asie', 'europe'])
  })
})

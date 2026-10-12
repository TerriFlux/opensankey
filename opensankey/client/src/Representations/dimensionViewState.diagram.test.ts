import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import {
  applyDimensionBanner, applyDimensionCarriers, applyDimensionCut, applyDimensionDrawing, applyDimensionFocus,
  applyDimensionHidden, applyDiagramPatch, applyMemberBands, applyNodesExpansion, applyReaderSeveral,
  applyReaderSubDistinguish, readerToggleBlocker, swapDimensionDrawings
} from '../components/ui/dimensionDrawingHost'
import {
  diagramTableCut, fromDiagram, fromFigure, planFor, sankeyLabelOf, swapInOrder, toDiagramPatch, toFigureOptions
} from './dimensionViewState'
import type { Type_DimensionViewState, Type_ViewSankey } from './dimensionViewState'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// 11/10/2026 — os#1511 : LE SANKEY BRANCHE SUR LE MODELE COMMUN. Non-regression : sur les scenarios
// courants (SOCLE reduit : produits en bandes, pays en noeuds), lire le diagramme dans le modele puis
// le reecrire ne change RIEN (fromDiagram -> planFor -> toDiagramPatch = patch vide) ; la double fleche
// est l ordre du modele (noeuds avant bandes) et echange le dessin ; un aller-retour par une figure
// garde les roles.

function socle() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  // Les dimensions existent AVANT les flux : leur arbre de valeurs les connait.
  const produit = sankey.addDataTagGroup('produit', 'Produits', false) as Class_DataTagGroup
  const tous = produit.addTag('Produits agricoles', 'tous') as Class_DataTag
  const cereales = produit.addTag('Cereales', 'cereales') as Class_DataTag
  const lait = produit.addTag('Lait', 'lait') as Class_DataTag
  const vin = produit.addTag('Vin', 'vin') as Class_DataTag
  const ble = produit.addTag('Ble', 'ble') as Class_DataTag
  const mais = produit.addTag('Mais', 'mais') as Class_DataTag
  ;[cereales, lait, vin].forEach(m => { m.parent = tous })
  ;[ble, mais].forEach(m => { m.parent = cereales })
  produit.levels = ['Tous', 'Filieres', 'Produits']
  tous.setSelected()
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  const france = pays.addTag('France', 'france') as Class_DataTag
  const espagne = pays.addTag('Espagne', 'espagne') as Class_DataTag
  const maroc = pays.addTag('Maroc', 'maroc') as Class_DataTag
  ;[europe, afrique].forEach(m => { m.parent = monde })
  ;[france, espagne].forEach(m => { m.parent = europe })
  maroc.parent = afrique
  pays.levels = ['Monde', 'Continents', 'Pays']
  monde.setSelected()
  const annee = sankey.addDataTagGroup('annee', 'Annee', false) as Class_DataTagGroup
  annee.addTag('2015', 'a2015').setSelected()
  annee.addTag('2016', 'a2016')
  annee.banner = 'sequence'
  const imp = sankey.addNewNodeWithName('Monde - Import')
  const centre = sankey.addNewNodeWithName('Produits agricoles')
  const exp = sankey.addNewNodeWithName('Monde - Export')
  sankey.addNewLink(imp, centre)
  sankey.addNewLink(centre, exp)
  sankey.setTagGroupsOrder('data_taggs', ['produit', 'pays', 'annee'])
  // Produits en bandes (les filieres), pays en noeuds sur Import / Export (le monde).
  applyDimensionDrawing(app, produit, 'multi')
  applyDimensionCut(app, produit, ['cereales', 'lait', 'vin'])
  applyDimensionCut(app, pays, ['monde'])
  applyDimensionCarriers(app, pays, [imp.id, exp.id])
  return { app, sankey: sankey as unknown as Type_ViewSankey, produit, pays, annee, imp, exp }
}

type Socle = ReturnType<typeof socle>

const identite = (s: Socle) => {
  const state = fromDiagram(s.sankey)
  planFor(state, 'sankey', s.sankey)
  return toDiagramPatch(state, s.sankey)
}

const selection = (d: Class_DataTagGroup) => d.selected_tags_list.map(t => t.id).sort()

/** Les scenarios courants, poses par les gestes de l hote. */
const SCENARIOS: { nom: string, poser: (s: Socle) => void }[] = [
  { nom: 'produits en bandes, pays en noeuds', poser: () => undefined },
  { nom: 'inverse par la double fleche', poser: s => swapDimensionDrawings(s.app, s.produit, s.pays) },
  { nom: 'un diagramme par pays', poser: s => { applyDimensionCut(s.app, s.pays, ['europe', 'afrique']); applyMemberBands(s.app, s.pays, true) } },
  { nom: 'zoom lie sur Cereales', poser: s => applyDimensionFocus(s.app, s.produit, ['cereales'], ['ble', 'mais']) },
  { nom: 'decoche Vin', poser: s => applyDimensionHidden(s.app, s.produit, ['vin'], ['cereales', 'lait']) },
  { nom: 'mixte (Cereales detaillees)', poser: s => applyDimensionCut(s.app, s.produit, ['ble', 'mais', 'lait', 'vin']) },
  { nom: 'expansion des pays', poser: s => { applyDimensionCut(s.app, s.pays, ['europe', 'afrique']); applyNodesExpansion(s.app, s.pays, true) } },
  { nom: 'pays passes en bandes, noeuds mis de cote', poser: s => applyDimensionBanner(s.app, s.pays, 'multi') },
  { nom: 'commande du lecteur : plusieurs filieres', poser: s => { s.produit.reader_control = { kind: 'pick' }; applyReaderSeveral(s.app, s.produit, true) } }
]

describe('os#1511 — le Sankey lu et reecrit par le modele commun', () => {
  test.each(SCENARIOS.map(c => [c.nom, c]))('identite : %s', (_nom, c) => {
    const s = socle()
    c.poser(s)
    const patch = identite(s)
    expect(patch.order).toBeUndefined()
    expect(patch.dims).toEqual({})
  })

  test('le plan du Sankey : bandes, noeuds, et l ordre noeuds avant bandes', () => {
    const s = socle()
    const state = fromDiagram(s.sankey)
    expect(state.order).toEqual(['pays', 'produit', 'annee'])
    const plan = planFor(state, 'sankey', s.sankey).plan
    expect(plan.bands).toBe('produit')
    expect(plan.nodes).toEqual(['pays'])
    expect(plan.grouping).toBe('by_node')
    expect(plan.table['produit'].depths).toEqual([1])
    expect(plan.table['pays'].depths).toEqual([])
    expect(sankeyLabelOf(state.dims['produit'])).toBe('bands')
    expect(sankeyLabelOf(state.dims['pays'])).toBe('nodes')
    expect(sankeyLabelOf(state.dims['annee'])).toBe('one')
  })

  test('un diagramme par membre = cases, en dernier ; l expansion est portee par le modele', () => {
    const s = socle()
    applyDimensionCut(s.app, s.pays, ['europe', 'afrique'])
    applyMemberBands(s.app, s.pays, true)
    let state = fromDiagram(s.sankey)
    expect(state.dims['pays'].role).toBe('cases')
    expect(state.order[state.order.length - 1]).toBe('pays')
    expect(planFor(state, 'sankey', s.sankey).plan.per_member).toBe('pays')
    expect(sankeyLabelOf(state.dims['pays'])).toBe('member_bands')
    applyMemberBands(s.app, s.pays, false)
    applyNodesExpansion(s.app, s.pays, true)
    state = fromDiagram(s.sankey)
    expect(state.dims['pays'].variants.sankey).toBe('expansion')
    expect(planFor(state, 'sankey', s.sankey).plan.expansion).toEqual(['pays'])
  })

  test('la double fleche est l ordre du modele : elle echange le dessin et les lignes', () => {
    const s = socle()
    const state = fromDiagram(s.sankey)
    const next = swapInOrder(state, s.sankey, 'produit', 'pays')
    expect(next.order).toEqual(['produit', 'pays', 'annee'])
    expect(next.dims['produit'].variants.sankey).toBe('nodes')
    expect(next.dims['pays'].variants.sankey).toBe('bands')
    const patch = toDiagramPatch(next, s.sankey)
    expect(patch.order).toEqual(['pays', 'produit', 'annee'])
    expect(patch.dims['produit'].carriers?.sort()).toEqual([s.imp.id, s.exp.id].sort())
    expect(patch.dims['produit'].auto_place).toBe(true)
    expect(patch.dims['pays'].carriers).toEqual([])
    applyDiagramPatch(s.app, patch)
    expect(s.produit.drawing).toBe('nodes')
    expect(s.pays.drawing).toBe('multi')
    expect(selection(s.produit)).toEqual(['cereales', 'lait', 'vin'])
    // Relu : nœuds toujours avant bandes, et rien a reecrire.
    expect(fromDiagram(s.sankey).order).toEqual(['produit', 'pays', 'annee'])
    expect(identite(s).dims).toEqual({})
    s.app.history.applyUndo()
    expect(s.pays.drawing).toBe('nodes')
    expect(s.sankey.getTagGroupsOrder?.('data_taggs')).toEqual(['produit', 'pays', 'annee'])
  })

  test('un geste du tableau : zoom Cereales au niveau des filieres, portee comprise', () => {
    const s = socle()
    applyDimensionCut(s.app, s.produit, ['ble', 'mais', 'lait', 'vin'].slice(0, 2))
    const next = diagramTableCut(fromDiagram(s.sankey), s.sankey, 'produit', { kind: 'level', depth: 1 })
    applyDiagramPatch(s.app, toDiagramPatch(next, s.sankey))
    expect(selection(s.produit)).toEqual(['cereales', 'lait', 'vin'])
    const zoom = diagramTableCut(fromDiagram(s.sankey), s.sankey, 'produit', { kind: 'zoom', depth: 1, ids: ['cereales'] })
    applyDiagramPatch(s.app, toDiagramPatch(zoom, s.sankey))
    expect(selection(s.produit)).toEqual(['cereales'])
    s.app.history.applyUndo()
    expect(selection(s.produit)).toEqual(['cereales', 'lait', 'vin'])
  })

  test('changer de representation garde les roles : noeuds / bandes / un diagramme par membre', () => {
    const allerRetour = (s: Socle): Type_DimensionViewState => {
      const state = fromDiagram(s.sankey)
      const bag = toFigureOptions({}, { ...state, source: 'detached', linked: false })
      return fromFigure(bag, false, s.sankey)
    }
    const s = socle()
    const back = allerRetour(s)
    // Noeuds -> anneau interieur, bandes -> exterieur, et retour.
    expect(back.order.slice(0, 2)).toEqual(['pays', 'produit'])
    expect(back.dims['pays'].variants.sankey).toBe('nodes')
    expect(back.dims['produit'].variants.sankey).toBe('bands')
    expect(toDiagramPatch(back, s.sankey).dims).toEqual({})
    // Un diagramme par pays -> une couronne par pays -> un diagramme par pays.
    applyDimensionCut(s.app, s.pays, ['europe', 'afrique'])
    applyMemberBands(s.app, s.pays, true)
    const back2 = allerRetour(s)
    expect(back2.dims['pays'].role).toBe('cases')
    expect(toDiagramPatch(back2, s.sankey).dims).toEqual({})
  })

  test('les noeuds mis de cote sont portes par le modele ; la double fleche les vide chez celle qui prend les noeuds', () => {
    const s = socle()
    applyDimensionBanner(s.app, s.pays, 'multi')
    expect(fromDiagram(s.sankey).dims['pays'].diagram?.parked.sort()).toEqual([s.imp.id, s.exp.id].sort())
    const s2 = socle()
    s2.pays.parked_carrier_ids = ['x']
    s2.produit.parked_carrier_ids = ['y']
    swapDimensionDrawings(s2.app, s2.produit, s2.pays)
    expect(s2.produit.parked_carrier_ids).toEqual([])
    expect(s2.pays.parked_carrier_ids).toEqual(['x'])
    expect(identite(s2).dims).toEqual({})
  })

  test('Distinguer les sous-filieres libere l autre dimension superposee, en un pas', () => {
    const s = socle()
    applyDimensionBanner(s.app, s.pays, 'multi')
    applyDimensionCut(s.app, s.pays, ['europe', 'afrique'], { multi: true })
    applyDimensionCut(s.app, s.produit, ['cereales'])
    s.produit.reader_control = { kind: 'pick' }
    // Sans commande, les pays superposes gelent la case ; avec, ils se liberent.
    expect(readerToggleBlocker(s.app, s.produit)?.id).toBe('pays')
    s.pays.reader_control = { kind: 'toggle' }
    expect(readerToggleBlocker(s.app, s.produit)).toBeUndefined()
    applyReaderSubDistinguish(s.app, s.produit, s.produit.tags_dict['cereales'] as Class_DataTag, true)
    expect(selection(s.produit)).toEqual(['ble', 'mais'])
    expect(selection(s.pays)).toEqual(['monde'])
    s.app.history.applyUndo()
    expect(selection(s.produit)).toEqual(['cereales'])
    expect(selection(s.pays)).toEqual(['afrique', 'europe'])
  })
})

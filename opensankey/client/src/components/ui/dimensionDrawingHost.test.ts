import { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTag } from '../../types/Tag'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import {
  applyDimensionBanner, applyDimensionCarriers, applyDimensionCut, applyDimensionDrawing, applyDimensionLevel, applyDisaggregationGap,
  applyMemberBands, applyReferenceNode, dimensionCarriersOf, dimensionDrawingOf, swapDimensionDrawings, toggleDimensionCarrier
} from './dimensionDrawingHost'
import { NodeElementPersistence } from '../../Persistence/SankeyPersistence'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — le dessin d une dimension se regle depuis son bouton de la barre du haut : un membre,
// plusieurs en bandes, ou plusieurs en noeuds (les noeuds qui la portent se desagregent).

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  pays.levels = ['monde', 'continents']
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b)
  return { app, pays, a, b }
}

describe('os#1511 — le dessin d une dimension depuis la barre du haut', () => {
  test('une dimension hierarchisee reste en choix multiple, son membre coche garde', () => {
    // os#1511, 07/10 : hiérarchisée = additive, « un membre à la fois » n'existe plus pour elle.
    const { app, pays } = monter()
    applyDimensionDrawing(app, pays, 'multi')
    expect(dimensionDrawingOf(app, pays)).toBe('multi')
    applyDimensionCut(app, pays, ['europe', 'afrique'])
    applyDimensionDrawing(app, pays, 'one')
    expect(dimensionDrawingOf(app, pays)).toBe('multi')
    expect(pays.selected_tags_list.map(t => t.id).sort()).toEqual(['afrique', 'europe'])
  })

  test('une sequence garde un membre a la fois', () => {
    const { app, pays } = monter()
    applyDimensionCut(app, pays, ['europe', 'afrique'])
    applyDimensionBanner(app, pays, 'sequence')
    expect(dimensionDrawingOf(app, pays)).toBe('one')
    expect(pays.selected_tags_list.length).toBe(1)
  })

  test('cocher un noeud le fait porter la dimension, et plusieurs peuvent la porter', () => {
    const { app, pays, a, b } = monter()
    toggleDimensionCarrier(app, pays, a.id)
    toggleDimensionCarrier(app, pays, b.id)
    expect(dimensionDrawingOf(app, pays)).toBe('nodes')
    expect(dimensionCarriersOf(app, pays).map(n => n.id).sort()).toEqual([a.id, b.id].sort())
    toggleDimensionCarrier(app, pays, a.id)
    expect(dimensionCarriersOf(app, pays).map(n => n.id)).toEqual([b.id])
  })

  test('un diagramme par membre fait porter la dimension par tous les noeuds, sans changer leur reglage', () => {
    // Julien, 07/10 : tous les noeuds representent la dimension en bandes, mais un noeud qui ne la
    // portait pas garde son parametre : revenir en arriere rend le diagramme d avant.
    const { app, pays, a, b } = monter()
    const c = app.drawing_area.sankey.addNewNodeWithName('C')
    const autre = app.drawing_area.sankey.addDataTagGroup('autre', 'Autre', false) as Class_DataTagGroup
    autre.addTag('X', 'x')
    c.driving_dimension = autre
    toggleDimensionCarrier(app, pays, a.id)
    applyMemberBands(app, pays, true)
    expect(b.driving_dimension).toBe(pays)
    expect(b.own_driving_dimension).toBeUndefined()
    // Un noeud regle sur une autre dimension la garde : il s y decoupe dans chaque bande.
    expect(c.driving_dimension).toBe(autre)
    expect(dimensionCarriersOf(app, pays).map(n => n.id)).toEqual([a.id])
    const ecrit: { [k: string]: unknown } = {}
    NodeElementPersistence.toJSON(b, ecrit as never)
    expect(ecrit['driving_dimension']).toBeUndefined()
    app.history.applyUndo()
    expect(b.driving_dimension).toBeUndefined()
    applyDimensionDrawing(app, pays, 'multi')
    expect(b.driving_dimension).toBeUndefined()
  })

  test('depuis des bandes de flux, un diagramme par membre dessine tous les noeuds, et une banniere en sort', () => {
    // Julien, 07/10, sur Filiere : la dimension n est portee par aucun noeud.
    const { app, pays, a, b } = monter()
    applyDimensionDrawing(app, pays, 'multi')
    applyMemberBands(app, pays, true)
    expect(dimensionDrawingOf(app, pays)).toBe('nodes')
    expect([a.driving_dimension, b.driving_dimension]).toEqual([pays, pays])
    expect(dimensionCarriersOf(app, pays)).toEqual([])
    applyDimensionDrawing(app, pays, 'multi')
    expect(pays.member_bands).toBeUndefined()
    expect(dimensionDrawingOf(app, pays)).toBe('multi')
    app.history.applyUndo()
    expect(pays.member_bands).toBe(true)
  })

  test('quitter en noeuds detache tous les porteurs, et l annulation les rend', () => {
    const { app, pays, a } = monter()
    toggleDimensionCarrier(app, pays, a.id)
    applyDimensionDrawing(app, pays, 'multi')
    expect(dimensionCarriersOf(app, pays)).toEqual([])
    app.history.applyUndo()
    expect(dimensionCarriersOf(app, pays).map(n => n.id)).toEqual([a.id])
  })

  test('os#1526 : la double fleche echange bandes et noeuds entre deux dimensions, en un pas', () => {
    const { app, pays, a } = monter()
    const produit = app.drawing_area.sankey.addDataTagGroup('produit', 'Produit', false) as Class_DataTagGroup
    produit.addTag('Ble', 'ble')
    produit.addTag('Mais', 'mais')
    toggleDimensionCarrier(app, pays, a.id)
    applyDimensionDrawing(app, produit, 'multi')
    expect(dimensionDrawingOf(app, pays)).toBe('nodes')
    expect(dimensionDrawingOf(app, produit)).toBe('multi')
    swapDimensionDrawings(app, pays, produit)
    expect(dimensionCarriersOf(app, produit).map(n => n.id)).toEqual([a.id])
    expect(dimensionCarriersOf(app, pays)).toEqual([])
    expect(dimensionDrawingOf(app, produit)).toBe('nodes')
    expect(dimensionDrawingOf(app, pays)).toBe('multi')
    app.history.applyUndo()
    expect(dimensionCarriersOf(app, pays).map(n => n.id)).toEqual([a.id])
    expect(dimensionDrawingOf(app, produit)).toBe('multi')
  })

  test('os#1526 : la double fleche emporte le placement des noeuds, garde les membres, efface les positions', () => {
    // Les deux dimensions existent AVANT le flux : son arbre de valeurs les connait.
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
    pays.addTag('Europe', 'europe').setSelected()
    pays.addTag('Afrique', 'afrique').setSelected()
    const produit = sankey.addDataTagGroup('produit', 'Produit', false) as Class_DataTagGroup
    const ble = produit.addTag('Ble', 'ble') as Class_DataTag
    produit.addTag('Mais', 'mais')
    const a = sankey.addNewNodeWithName('A')
    const b = sankey.addNewNodeWithName('B')
    sankey.addNewLink(a, b)
    applyDimensionDrawing(app, produit, 'multi')
    produit.tags_list.forEach(t => t.setSelected())
    ble.position = { x: 955, y: 30 }
    // pays en noeuds, banniere a choix unique, ecart constant (quitte les bandes par membre)
    applyDimensionCarriers(app, pays, [a.id, b.id])
    applyDisaggregationGap(app, 'constant', pays)
    expect(pays.member_bands).toBe(false)
    swapDimensionDrawings(app, pays, produit)
    expect(produit.selected_tags_list.map(t => t.id).sort()).toEqual(['ble', 'mais'])
    expect(produit.member_bands).toBe(false)
    expect(pays.member_bands).toBeUndefined()
    expect(ble.has_manual_position).toBe(false)
    app.history.applyUndo()
    expect(pays.member_bands).toBe(false)
    expect(produit.member_bands).toBeUndefined()
    expect(ble.position).toEqual({ x: 955, y: 30 })
  })

  test('l ecart vertical des enfants se regle d ici aussi, et s annule', () => {
    const { app } = monter()
    const avant = app.drawing_area.disaggregation_gap_mode
    applyDisaggregationGap(app, 'constant')
    expect(app.drawing_area.disaggregation_gap_mode).toBe('constant')
    app.history.applyUndo()
    expect(app.drawing_area.disaggregation_gap_mode).toBe(avant)
  })

  test('couper la dimension s annule, niveau compris', () => {
    const { app, pays } = monter()
    pays.selectAllAtLevel(0)
    applyDimensionCut(app, pays, ['afrique', 'europe'])
    expect(pays.selected_tags_list.map(t => t.id).sort()).toEqual(['afrique', 'europe'])
    expect(pays.current_level_index).toBe(1)
    app.history.applyUndo()
    expect(pays.selected_tags_list.map(t => t.id)).toEqual(['monde'])
    expect(pays.current_level_index).toBe(0)
  })

  test('un niveau entier, puis la couronne qui passe la dimension en choix multiple', () => {
    const { app, pays } = monter()
    applyDimensionLevel(app, pays, 1)
    expect(pays.isWholeLevelSelected(1)).toBe(true)
    applyDimensionLevel(app, pays, 0)
    applyDimensionCut(app, pays, ['europe', 'afrique'], { multi: true })
    expect(dimensionDrawingOf(app, pays)).toBe('multi')
    app.history.applyUndo()
    expect(pays.isWholeLevelSelected(0)).toBe(true)
  })

  test('les porteurs et le noeud de reference se posent et s annulent', () => {
    const { app, pays, a, b } = monter()
    applyDimensionCarriers(app, pays, [a.id, b.id])
    expect(dimensionCarriersOf(app, pays).length).toBe(2)
    applyReferenceNode(app, pays, b.id)
    expect(pays.reference_node_id).toBe(b.id)
    app.history.applyUndo()
    expect(pays.reference_node_id).toBeUndefined()
    app.history.applyUndo()
    expect(dimensionCarriersOf(app, pays)).toEqual([])
  })
})

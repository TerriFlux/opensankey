import { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTag } from '../../types/Tag'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import {
  applyDimensionCarriers, applyDimensionCut, applyDimensionDrawing, applyDimensionLevel, applyDisaggregationGap,
  applyReferenceNode, dimensionCarriersOf, dimensionDrawingOf, toggleDimensionCarrier
} from './dimensionDrawingHost'

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
  test('plusieurs en bandes, puis un seul membre', () => {
    const { app, pays } = monter()
    applyDimensionDrawing(app, pays, 'multi')
    expect(dimensionDrawingOf(app, pays)).toBe('multi')
    applyDimensionDrawing(app, pays, 'one')
    expect(dimensionDrawingOf(app, pays)).toBe('one')
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

  test('quitter en noeuds detache tous les porteurs, et l annulation les rend', () => {
    const { app, pays, a } = monter()
    toggleDimensionCarrier(app, pays, a.id)
    applyDimensionDrawing(app, pays, 'multi')
    expect(dimensionCarriersOf(app, pays)).toEqual([])
    app.history.applyUndo()
    expect(dimensionCarriersOf(app, pays).map(n => n.id)).toEqual([a.id])
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
    expect(dimensionDrawingOf(app, pays)).not.toBe('multi')
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

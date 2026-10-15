import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import type { Class_NodeElement } from '../Elements/Node'
import {
  applyDiagramGesture, applyDimensionExpansion, applyMemberFold, applyMemberUnfold, dimensionCanExpand,
  memberOpenedInDiagram
} from '../components/ui/dimensionDrawingHost'
import { readCouronneState } from './couronneState'
import { diagramTableCut, fromDiagram, sankeyLabelOf } from './dimensionViewState'
import type { Type_ViewSankey } from './dimensionViewState'

// 15/10/2026 — os#1511 : L EXPANSION DANS LE MENU DESSINER (decision de Julien du 06/10). Elle se choisit
// de n importe quel dessin, se deplie niveau par niveau (le tableau) et noeud par noeud (clic droit :
// Detailler / Replier), chaque geste en un pas d annulation ; la couronne liee la lit en sunburst.

const monter = () => {
  const s = monterSocle()
  const da = s.app.drawing_area
  const sankey = da.sankey as unknown as Type_ViewSankey
  // Les pays en bandes (plusieurs membres, aucun porteur) : l expansion doit choisir ses noeuds.
  s.pays.banner = 'multi'
  s.filiere.banner = 'one'
  da.rebuildDimensionNodes()
  const label = () => sankeyLabelOf(fromDiagram(sankey).dims['pays'])
  const selection = () => s.pays.selected_tags_list.map(t => t.id).sort()
  const porteurs = () => (da.sankey.nodes_list as Class_NodeElement[])
    .filter(n => n.own_driving_dimension === s.pays).map(n => n.name).sort()
  const visibles = () => da.sankey.nodes_list.filter(n => n.is_visible).map(n => n.id).sort()
  return { s, da, sankey, label, selection, porteurs, visibles }
}

describe('os#1511 — l expansion choisie dans Dessiner', () => {
  test('choisir l expansion depuis les bandes : porteurs d extremite, premier niveau ouvert, un pas', () => {
    const m = monter()
    expect(m.label()).toBe('bands')
    expect(dimensionCanExpand(m.s.app, m.s.pays)).toBe(true)
    applyDimensionExpansion(m.s.app, m.s.pays)
    expect(m.label()).toBe('expansion')
    expect(m.porteurs()).toEqual(['A', 'B'])
    expect(m.selection()).toEqual(['ameriques', 'asie', 'europe'])
    expect(m.visibles()).toContain('B--par--europe')
    // Une seule annulation rend les bandes, sans porteur, sur le monde.
    m.s.app.history.applyUndo()
    expect(m.label()).toBe('bands')
    expect(m.porteurs()).toEqual([])
    expect(m.selection()).toEqual(['monde'])
  })

  test('noeud par noeud : deplier l Europe la garde dessinee, replier la rend ; annulable', () => {
    const m = monter()
    applyDimensionExpansion(m.s.app, m.s.pays)
    applyMemberUnfold(m.s.app, m.s.pays, 'europe')
    expect(m.selection()).toEqual(['ameriques', 'asie', 'es', 'fr'])
    expect(memberOpenedInDiagram(m.s.app, m.s.pays, 'europe')).toBe(true)
    expect(m.visibles()).toEqual(expect.arrayContaining(['B--par--europe', 'B--par--fr', 'B--par--es', 'B--par--asie']))
    expect(m.visibles()).not.toContain('B--par--cn')
    applyMemberFold(m.s.app, m.s.pays, 'europe')
    expect(m.selection()).toEqual(['ameriques', 'asie', 'europe'])
    expect(memberOpenedInDiagram(m.s.app, m.s.pays, 'europe')).toBe(false)
    m.s.app.history.applyUndo()
    expect(m.selection()).toEqual(['ameriques', 'asie', 'es', 'fr'])
    m.s.app.history.applyUndo()
    expect(m.selection()).toEqual(['ameriques', 'asie', 'europe'])
    expect(m.label()).toBe('expansion')
  })

  test('niveau par niveau : le tableau descend toute la dimension, les continents restent ouverts', () => {
    const m = monter()
    applyDimensionExpansion(m.s.app, m.s.pays)
    applyDiagramGesture(m.s.app, (state, sankey) => diagramTableCut(state, sankey, 'pays', { kind: 'level', depth: 2 }))
    expect(m.selection()).toEqual(['br', 'cn', 'es', 'fr', 'us'])
    expect(m.label()).toBe('expansion')
    ;['europe', 'ameriques', 'asie'].forEach(id => expect(memberOpenedInDiagram(m.s.app, m.s.pays, id)).toBe(true))
    expect(m.visibles()).toEqual(expect.arrayContaining(['B--par--europe', 'B--par--cn', 'A--par--us']))
    m.s.app.history.applyUndo()
    expect(m.selection()).toEqual(['ameriques', 'asie', 'europe'])
  })

  test('la couronne liee se lit en sunburst tant que le diagramme est en expansion ; rechoisir revient en noeuds', () => {
    const m = monter()
    const options = { descriptor: descripteur('pays') }
    const dessin = () => readCouronneState(options, m.sankey, true).dims['pays']?.drawing
    expect(dessin()).toBe('sectors')
    applyDimensionExpansion(m.s.app, m.s.pays)
    expect(dessin()).toBe('sunburst')
    // Detachee, la figure garde son dessin.
    expect(readCouronneState(options, m.sankey, false).dims['pays']?.drawing).toBe('sectors')
    applyDimensionExpansion(m.s.app, m.s.pays)
    expect(m.label()).toBe('nodes')
    expect(dessin()).toBe('sectors')
  })
})

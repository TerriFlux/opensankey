import { descripteur, monterSocle } from '../Charts/__fixtures__/couronneSocle'
import { couronneGesturesOf, type Type_CouronneGestures } from '../Representations/couronneGestures'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import { expansionSideOf, expansionTreeOf } from './DimensionExpansion'

// 10/10/2026 — os#1511, lot 5 : L'EXPANSION D'UNE DIMENSION EN NOEUDS, AUX EXTREMITES (Julien :
// vers l exterieur, la ou le cote ne fait pas de doute ; un noeud du milieu ne s etend pas).

const monter = () => {
  const s = monterSocle()
  const da = s.app.drawing_area
  const noeud = (name: string) => da.sankey.nodes_list.find(n => n.name === name) as Class_NodeElement
  return { s, da, A: noeud('A'), B: noeud('B') }
}
const visibles = (m: ReturnType<typeof monter>) => m.da.sankey.nodes_list.filter(n => n.is_visible).map(n => n.id).sort()
const valeur = (l: Class_LinkElement) => l.value?.valueData ?? 0

describe('os#1511 lot 5 — expansion aux extremites', () => {
  test('le cote : a droite d un puits, a gauche d une source', () => {
    const m = monter()
    expect(expansionSideOf(m.B)).toBe('right')
    expect(expansionSideOf(m.A)).toBe('left')
  })

  test('l arbre : le premier niveau sous la racine, les ouverts et leurs enfants ; rien d ouvert, rien', () => {
    const m = monter()
    const p = m.s.pays
    const membres = (ids: string[]) => ids.map(id => p.tags_dict[id]) as never[]
    const t = expansionTreeOf(p, membres(['fr', 'es', 'ameriques', 'asie']))
    expect(t?.tops.map(x => x.id)).toEqual(['europe', 'ameriques', 'asie'])
    expect([...(t?.children.entries() ?? [])].map(([k, v]) => [k.id, v.map(x => x.id)])).toEqual([['europe', ['fr', 'es']]])
    expect(expansionTreeOf(p, membres(['europe', 'ameriques', 'asie']))).toBeNull()
  })

  test('sur le puits : Europe garde son noeud, ses pays s ouvrent a droite, la valeur se conserve', () => {
    const m = monter()
    m.B.driving_dimension = m.s.pays
    m.s.pays.banner = 'multi'
    m.s.pays.selectMembers(['fr', 'es', 'ameriques', 'asie'])
    m.s.pays.nodes_expansion = true
    m.da.rebuildDimensionNodes()
    expect(visibles(m)).toEqual(['A', 'B--par--ameriques', 'B--par--asie', 'B--par--es', 'B--par--europe', 'B--par--fr'])
    const europe = m.da.sankey.nodes_dict['B--par--europe']
    const fr = m.da.sankey.nodes_dict['B--par--fr']
    expect(fr.position_x).toBeGreaterThan(europe.position_x)
    const entree = europe.input_links_list.filter(l => l.is_visible).reduce((t, l) => t + valeur(l), 0)
    const sortie = europe.output_links_list.filter(l => l.is_visible).reduce((t, l) => t + valeur(l), 0)
    expect(entree).toBeGreaterThan(0)
    expect(sortie).toBeCloseTo(entree)
    // Sans expansion : en noeuds, les pays prennent la place de l Europe.
    m.s.pays.nodes_expansion = false
    m.da.rebuildDimensionNodes()
    expect(visibles(m)).toEqual(['A', 'B--par--ameriques', 'B--par--asie', 'B--par--es', 'B--par--fr'])
  })

  test('une couronne liee en sunburst met le diagramme en expansion, en secteurs la retire ; detachee, rien', () => {
    const m = monter()
    const app = m.s.app as unknown as { runHeavyGesture: (w: () => void) => void }
    app.runHeavyGesture = (w: () => void) => w()
    m.B.driving_dimension = m.s.pays
    m.s.pays.banner = 'multi'
    m.s.pays.selectMembers(['fr', 'es', 'ameriques', 'asie'])
    const box: { options: { [k: string]: unknown } } = { options: { descriptor: descripteur('pays') } }
    const g = (reader: 'couronne' = 'couronne') => couronneGesturesOf({
      app: m.s.app, options: box.options, declared: ['pays'], write: o => { box.options = o }, reader
    }) as Type_CouronneGestures
    g().setDrawing('pays', 'sunburst')
    expect(m.s.pays.nodes_expansion).toBe(true)
    g().setDrawing('pays', 'sectors')
    expect(m.s.pays.nodes_expansion).toBe(false)
    box.options = { ...box.options, coordinates_linked: false }
    g().setDrawing('pays', 'sunburst')
    expect(m.s.pays.nodes_expansion).toBe(false)
  })

  test('sur la source, a gauche ; un noeud du milieu ne s etend pas', () => {
    const m = monter()
    m.A.driving_dimension = m.s.pays
    m.s.pays.banner = 'multi'
    m.s.pays.selectMembers(['fr', 'es', 'ameriques', 'asie'])
    m.s.pays.nodes_expansion = true
    m.da.rebuildDimensionNodes()
    const europe = m.da.sankey.nodes_dict['A--par--europe']
    const es = m.da.sankey.nodes_dict['A--par--es']
    expect(es.position_x).toBeLessThan(europe.position_x)
    // Un noeud du milieu : ni puits ni source, l expansion ne s y pose pas.
    const C = m.da.sankey.addNewNodeWithName('C')
    m.da.sankey.addNewLink(m.B, C)
    expect(expansionSideOf(m.B)).toBeUndefined()
  })
})

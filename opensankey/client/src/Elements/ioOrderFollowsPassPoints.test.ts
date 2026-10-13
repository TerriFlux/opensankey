import { Class_ApplicationData } from '../types/ApplicationData'

// Ordre des flux d'un nœud et points de passage (Julien, 13/10, SOCLE transfo) : à l'arrivée, un
// flux est rangé d'après son DERNIER point de passage, pas d'après son nœud source. Un flux qui
// part d'un nœud plus haut mais passe par en dessous s'accroche sous l'autre, sans croisement.

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const build = (detour_v: number | null) => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const haut = sankey.addNewNodeWithName('Haut')
  const milieu = sankey.addNewNodeWithName('Milieu')
  const cible = sankey.addNewNodeWithName('Cible')
  haut.position_x = 0; haut.position_y = 0
  milieu.position_x = 400; milieu.position_y = 100
  cible.position_x = 800; cible.position_y = 100
  const depuis_haut = sankey.addNewLink(haut, cible)
  depuis_haut.valueCurrent = 10
  const depuis_milieu = sankey.addNewLink(milieu, cible)
  depuis_milieu.valueCurrent = 10
  if (detour_v !== null) depuis_haut.shape_pass_points = [{ u: 0.5, v: detour_v }]
  cible.reorganizeIOLinks()
  const order = cible.links_order.filter(l => l.target === cible)
  return { order, depuis_haut, depuis_milieu }
}

describe('ordre des flux E/S et points de passage', () => {
  it('sans point de passage, le flux venu du nœud le plus haut est accroché en haut', () => {
    const { order, depuis_haut, depuis_milieu } = build(null)
    expect(order).toEqual([depuis_haut, depuis_milieu])
  })

  it('avec un point de passage sous le nœud du milieu, il est accroché en dessous', () => {
    const { order, depuis_haut, depuis_milieu } = build(600)
    expect(order).toEqual([depuis_milieu, depuis_haut])
  })
})

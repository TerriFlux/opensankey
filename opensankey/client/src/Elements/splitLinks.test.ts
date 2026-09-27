import { Class_ApplicationData } from '../types/ApplicationData'
import { splitLinks, unsplitLinks } from '../Algorithms/Hierarchies'
import { splitLinkId } from './splitLinkId'

// ==================================================================================================
// FLUX ÉCLATÉS — le nœud reste agrégé, ses flux se divisent en bandes parallèles, une par enfant.
//
// Sur SOCLE pays partenaires : « Produits agricoles » garde sa place, mais son flux vers la Chine
// se divise en Céréales, Viandes porcines… Les bandes sont des flux parent↔X transitoires qui
// reproduisent les flux enfant↔X (valeurs, couleur de l'enfant) ; le flux agrégé parent↔X est
// masqué. Jamais enregistrées : le drapeau `split_links` de la dimension l'est, et elles sont
// reconstruites au chargement.
// ==================================================================================================

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/**
 * P (parent de c1, c2 sur l'axe « produit ») exporte vers X et importe de Y ; les flux existent
 * à chaque niveau : P→X (30), c1→X (10), c2→X (20), Y→P (7), Y→c1 (7). c2 n'importe rien de Y.
 */
function build() {
  const app = new Class_ApplicationData(false)
  const { sankey } = app.drawing_area
  const P = sankey.addNewNode('P', 'Produits agricoles')
  const c1 = sankey.addNewNode('c1', 'Cereales')
  const c2 = sankey.addNewNode('c2', 'Viandes')
  const X = sankey.addNewNode('X', 'Chine')
  const Y = sankey.addNewNode('Y', 'Bresil')
  c1._nodeDimensionsManager.getOrCreateLowerDimension(P, c1, 'produit')
  c2._nodeDimensionsManager.getOrCreateLowerDimension(P, c2, 'produit')
  c1.shape_color = '#ff0000'
  c2.shape_color = '#0000ff'
  const PX = sankey.addNewLink(P, X); PX.valueCurrent = 30
  const c1X = sankey.addNewLink(c1, X); c1X.valueCurrent = 10
  const c2X = sankey.addNewLink(c2, X); c2X.valueCurrent = 20
  const YP = sankey.addNewLink(Y, P); YP.valueCurrent = 7
  const Yc1 = sankey.addNewLink(Y, c1); Yc1.valueCurrent = 7
  const dim = P.dimensions_as_parent.find(d => d.id === 'produit')!
  // Vue agrégée : le parent se voit, pas les enfants.
  dim.setForceToShowParent()
  return { app, sankey, P, c1, c2, X, Y, PX, c1X, c2X, YP, Yc1, dim }
}

describe('flux eclates : le noeud reste, ses flux se divisent par enfant', () => {
  it('cree une bande par flux enfant et masque le flux agrege', () => {
    const { app, sankey, P, c1, c2, X, Y, PX, c1X, c2X, YP, Yc1, dim } = build()
    expect(splitLinks(app, P, 'c1')).toBe(true)
    expect(dim.split_links).toBe(true)
    const b1 = sankey.links_dict[splitLinkId(c1X.id, P.id)]
    const b2 = sankey.links_dict[splitLinkId(c2X.id, P.id)]
    const bY = sankey.links_dict[splitLinkId(Yc1.id, P.id)]
    expect(b1).toBeDefined()
    expect(b2).toBeDefined()
    expect(bY).toBeDefined()
    // Les bandes vont du parent au voisin, avec la valeur et la couleur de l'enfant.
    expect(b1.source).toBe(P); expect(b1.target).toBe(X)
    expect(b1.valueCurrent).toBe(10); expect(b2.valueCurrent).toBe(20)
    expect(b1.split_child).toBe(c1); expect(b2.split_child).toBe(c2)
    expect(b1.getShapeColorToUse()).toBe('#ff0000')
    expect(b2.getShapeColorToUse()).toBe('#0000ff')
    expect(bY.source).toBe(Y); expect(bY.target).toBe(P); expect(bY.valueCurrent).toBe(7)
    // Les flux agreges sont masques derriere leurs bandes, dans chaque sens.
    expect(PX.hidden_by_split).toBe(true); expect(PX.is_visible).toBe(false)
    expect(YP.hidden_by_split).toBe(true)
    expect(b1.is_visible).toBe(true)
    // Le parent reste visible, les enfants non.
    expect(P.is_visible).toBe(true)
    expect(c1.is_visible).toBe(false)
    // Idempotent.
    expect(splitLinks(app, P, 'c1')).toBe(false)
    expect(sankey.links_list.filter(l => l.is_split_link).length).toBe(3)
  })

  it('regrouper retire les bandes et demasque les flux agreges', () => {
    const { app, sankey, P, PX, YP, dim } = build()
    splitLinks(app, P, 'c1')
    expect(unsplitLinks(app, P, 'c2')).toBe(true)
    expect(dim.split_links).toBe(false)
    expect(sankey.links_list.some(l => l.is_split_link)).toBe(false)
    expect(PX.hidden_by_split).toBe(false); expect(PX.is_visible).toBe(true)
    expect(YP.hidden_by_split).toBe(false)
    expect(unsplitLinks(app, P, 'c1')).toBe(false)
  })

  it('desagreger le noeud retire les bandes', () => {
    const { app, sankey, P, PX, dim } = build()
    splitLinks(app, P, 'c1')
    dim.setForceToShowChildren()
    expect(dim.split_links).toBe(false)
    expect(sankey.links_list.some(l => l.is_split_link)).toBe(false)
    expect(PX.hidden_by_split).toBe(false)
  })

  it('n enregistre que le drapeau et reconstruit les bandes au chargement', () => {
    const { app, P, PX, c1X } = build()
    splitLinks(app, P, 'c1')
    const json = app.toJSON()
    const j = json as unknown as {
      links: Record<string, unknown>
      nodes: Record<string, { dimensions: Record<string, { split_links?: boolean }>, links_order?: string[] }>
    }
    expect(Object.keys(j.links).some(id => id.includes('#split:'))).toBe(false)
    expect(Object.keys(j.links)).toContain(PX.id)
    expect(j.nodes['c1'].dimensions['produit'].split_links).toBe(true)
    expect((j.nodes['P'].links_order ?? []).some(id => id.includes('#split:'))).toBe(false)

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(json)
    const sankey2 = app2.drawing_area.sankey
    const dim2 = sankey2.nodes_dict['P'].dimensions_as_parent.find(d => d.id === 'produit')!
    expect(dim2.split_links).toBe(true)
    const band = sankey2.links_dict[splitLinkId(c1X.id, 'P')]
    expect(band).toBeDefined()
    expect(band.valueCurrent).toBe(10)
    expect(sankey2.links_dict[PX.id].hidden_by_split).toBe(true)
  })
})

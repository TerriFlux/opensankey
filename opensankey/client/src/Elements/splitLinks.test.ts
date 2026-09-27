import { Class_ApplicationData } from '../types/ApplicationData'
import { regroupBand, splitBand, splitLinks, unsplitLinks } from '../Algorithms/Hierarchies'
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

/**
 * BANDES IMBRIQUÉES : c1 (Cereales) a deux enfants g1 (brutes) et g2 (transformees) sur l'axe
 * « transfo ». Flux à chaque niveau : P→X 30, c1→X 10, c2→X 20, g1→X 4, g2→X 6.
 */
function buildNested() {
  const base = build()
  const { sankey, c1, X } = base
  const g1 = sankey.addNewNode('g1', 'Cereales brutes')
  const g2 = sankey.addNewNode('g2', 'Cereales transformees')
  g1._nodeDimensionsManager.getOrCreateLowerDimension(c1, g1, 'transfo')
  g2._nodeDimensionsManager.getOrCreateLowerDimension(c1, g2, 'transfo')
  g1.shape_color = '#00ff00'
  const g1X = sankey.addNewLink(g1, X); g1X.valueCurrent = 4
  const g2X = sankey.addNewLink(g2, X); g2X.valueCurrent = 6
  const sub = c1.dimensions_as_parent.find(d => d.id === 'transfo')!
  return { ...base, g1, g2, g1X, g2X, sub }
}

describe('bandes imbriquees : une bande se re-eclate dans le meme faisceau', () => {
  it('eclater la bande Cereales la remplace par ses sous-bandes, sous le noeud visible', () => {
    const { app, sankey, P, c1, g1, g2, X, c1X, c2X, g1X, g2X, sub } = buildNested()
    splitLinks(app, P, 'c1')
    const band_c1 = sankey.links_dict[splitLinkId(c1X.id, P.id)]
    expect(splitBand(app, band_c1)).toBe(true)
    expect(sub.split_links).toBe(true)
    // La bande de Cereales disparait, ses deux sous-bandes la remplacent ; Viandes reste.
    expect(sankey.links_dict[splitLinkId(c1X.id, P.id)]).toBeUndefined()
    const b_g1 = sankey.links_dict[splitLinkId(g1X.id, P.id)]
    const b_g2 = sankey.links_dict[splitLinkId(g2X.id, P.id)]
    expect(b_g1).toBeDefined(); expect(b_g2).toBeDefined()
    expect(sankey.links_dict[splitLinkId(c2X.id, P.id)]).toBeDefined()
    // Sous le noeud visible, vers le meme voisin, avec la valeur et la couleur de la feuille.
    expect(b_g1.source).toBe(P); expect(b_g1.target).toBe(X)
    expect(b_g1.valueCurrent).toBe(4); expect(b_g2.valueCurrent).toBe(6)
    expect(b_g1.split_child).toBe(g1)
    expect(b_g1.getShapeColorToUse()).toBe('#00ff00')
    // Seul P se voit : ni Cereales ni ses enfants.
    expect(P.is_visible).toBe(true)
    expect(c1.is_visible).toBe(false)
    expect(g1.is_visible).toBe(false)
    expect(g2.is_visible).toBe(false)
    // Aucune bande n'est posee sur Cereales elle-meme.
    expect(c1.output_links_list.some(l => l.is_split_link)).toBe(false)
  })

  it('regrouper une sous-bande rend la bande de son parent', () => {
    const { app, sankey, P, c1X, g1X, sub } = buildNested()
    splitLinks(app, P, 'c1')
    splitBand(app, sankey.links_dict[splitLinkId(c1X.id, P.id)])
    expect(regroupBand(app, sankey.links_dict[splitLinkId(g1X.id, P.id)])).toBe(true)
    expect(sub.split_links).toBe(false)
    expect(sankey.links_dict[splitLinkId(g1X.id, P.id)]).toBeUndefined()
    expect(sankey.links_dict[splitLinkId(c1X.id, P.id)]).toBeDefined()
    // Une bande de tete ne se « regroupe » pas par ce geste (c'est « Regrouper les flux » du noeud).
    expect(regroupBand(app, sankey.links_dict[splitLinkId(c1X.id, P.id)])).toBe(false)
  })

  it('regrouper le noeud retire toutes les bandes, imbriquees comprises', () => {
    const { app, sankey, P, PX, c1X } = buildNested()
    splitLinks(app, P, 'c1')
    splitBand(app, sankey.links_dict[splitLinkId(c1X.id, P.id)])
    unsplitLinks(app, P, 'c2')
    expect(sankey.links_list.some(l => l.is_split_link)).toBe(false)
    expect(PX.hidden_by_split).toBe(false)
  })

  it('l imbrication survit a l enregistrement', () => {
    const { app, sankey, P, c1X, g1X, g2X } = buildNested()
    splitLinks(app, P, 'c1')
    splitBand(app, sankey.links_dict[splitLinkId(c1X.id, P.id)])
    const json = app.toJSON()
    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(json)
    const sankey2 = app2.drawing_area.sankey
    expect(sankey2.links_dict[splitLinkId(g1X.id, 'P')]).toBeDefined()
    expect(sankey2.links_dict[splitLinkId(g2X.id, 'P')]).toBeDefined()
    expect(sankey2.links_dict[splitLinkId(c1X.id, 'P')]).toBeUndefined()
    // Aucune bande posee sur le noeud intermediaire au chargement.
    expect(sankey2.nodes_dict['c1'].output_links_list.some(l => l.is_split_link)).toBe(false)
  })
})

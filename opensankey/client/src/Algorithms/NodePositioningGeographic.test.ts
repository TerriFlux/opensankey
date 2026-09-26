// os#1364 — Le mode géographique pose les nœuds coordonnés, et ne touche à rien d'autre.
//
// Faux léger plutôt que modèle réel : ce qu'on vérifie ici est une RÈGLE DE PLACEMENT — qui bouge,
// qui ne bouge pas, et vers où — et la faire tourner sur un vrai `Class_DrawingArea` demanderait de
// monter un Sankey, des styles et un DOM pour n'observer que quatre nombres.

import { NodePositioningGeographic } from './NodePositioningGeographic'
import { fitGeoReference, placeGeoPoint, Type_GeoReference } from './geoProjection'
import type { NodePositioning } from './NodePositioning'

const reference: Type_GeoReference = {
  projection: 'mercator',
  a: { latitude: 48.39, longitude: -4.49, x: 100, y: 100 },
  b: { latitude: 43.70, longitude: 7.27, x: 900, y: 500 }
}

type FakeNode = {
  id: string
  is_visible: boolean
  latitude: number | null
  longitude: number | null
  has_geo_position: boolean
  shape_position_type: string
  position_x: number
  position_y: number
  getShapeWidthToUse: () => number
  getShapeHeightToUse: () => number
  captureCenterFromCorner: () => void
  captured: number
}

const node = (over: Partial<FakeNode> & { id: string }): FakeNode => {
  const n: FakeNode = {
    is_visible: true,
    latitude: null,
    longitude: null,
    shape_position_type: 'geographic',
    position_x: 0,
    position_y: 0,
    getShapeWidthToUse: () => 20,
    getShapeHeightToUse: () => 40,
    captured: 0,
    has_geo_position: false,
    captureCenterFromCorner: () => { n.captured++ },
    ...over
  } as FakeNode
  // Le vrai getter du modèle : les deux coordonnées, jamais une seule.
  Object.defineProperty(n, 'has_geo_position', {
    get: () => n.latitude !== null && n.longitude !== null
  })
  return n
}

const layout = (nodes: FakeNode[], geo_reference: Type_GeoReference | null) =>
  new NodePositioningGeographic({
    drawingArea: { geo_reference, sankey: { nodes_list: nodes } }
  } as unknown as NodePositioning)

describe('os#1364 mode geographique', () => {
  it('pose le CENTRE du noeud sur le point projete, pas son coin', () => {
    const paris = node({ id: 'paris', latitude: 48.86, longitude: 2.35 })
    expect(layout([paris], reference).applyGeographicLayout()).toBe(1)
    const attendu = placeGeoPoint(48.86, 2.35, reference, fitGeoReference(reference)!)
    expect(paris.position_x + 20 / 2).toBeCloseTo(attendu.x, 9)
    expect(paris.position_y + 40 / 2).toBeCloseTo(attendu.y, 9)
  })

  it('commit le centre stocke, pour qu un fichier enregistre se rouvre au bon endroit', () => {
    const paris = node({ id: 'paris', latitude: 48.86, longitude: 2.35 })
    layout([paris], reference).applyGeographicLayout()
    expect(paris.captured).toBe(1)
  })

  it('repose les deux noeuds de calage EXACTEMENT la ou ils sont', () => {
    // C est ce qui rend le calage credible a l ecran : les deux noeuds sur lesquels on vient de
    // caler ne bougent pas d un pixel, et l utilisateur voit tout de suite que ca a pris.
    const brest = node({ id: 'brest', latitude: reference.a.latitude, longitude: reference.a.longitude })
    const nice = node({ id: 'nice', latitude: reference.b.latitude, longitude: reference.b.longitude })
    layout([brest, nice], reference).applyGeographicLayout()
    expect(brest.position_x + 10).toBeCloseTo(reference.a.x, 9)
    expect(brest.position_y + 20).toBeCloseTo(reference.a.y, 9)
    expect(nice.position_x + 10).toBeCloseTo(reference.b.x, 9)
    expect(nice.position_y + 20).toBeCloseTo(reference.b.y, 9)
  })

  it('ne touche a rien sans calage', () => {
    const paris = node({ id: 'paris', latitude: 48.86, longitude: 2.35, position_x: 42, position_y: 43 })
    expect(layout([paris], null).applyGeographicLayout()).toBe(0)
    expect(paris.position_x).toBe(42)
    expect(paris.position_y).toBe(43)
  })

  it('ne touche a rien avec un calage inexploitable', () => {
    const degenere: Type_GeoReference = { ...reference, b: { ...reference.b, x: reference.a.x, y: reference.a.y } }
    const paris = node({ id: 'paris', latitude: 48.86, longitude: 2.35, position_x: 42, position_y: 43 })
    expect(layout([paris], degenere).applyGeographicLayout()).toBe(0)
    expect(paris.position_x).toBe(42)
  })

  it('laisse en place un noeud SANS coordonnees, pour qu une carte a moitie faite reste utilisable', () => {
    const sans = node({ id: 'reste du monde', position_x: 42, position_y: 43 })
    const paris = node({ id: 'paris', latitude: 48.86, longitude: 2.35 })
    expect(layout([sans, paris], reference).applyGeographicLayout()).toBe(1)
    expect(sans.position_x).toBe(42)
    expect(sans.position_y).toBe(43)
    expect(sans.captured).toBe(0)
  })

  it('laisse en place un noeud a demi coordonne', () => {
    const demi = node({ id: 'demi', latitude: 48.86, position_x: 42 })
    expect(layout([demi], reference).applyGeographicLayout()).toBe(0)
    expect(demi.position_x).toBe(42)
  })

  it('laisse en place un noeud RELATIF, qui suit son voisin comme dans tous les modes', () => {
    const relatif = node({
      id: 'relatif', latitude: 48.86, longitude: 2.35,
      shape_position_type: 'relative', position_x: 42
    })
    expect(layout([relatif], reference).applyGeographicLayout()).toBe(0)
    expect(relatif.position_x).toBe(42)
  })

  it('laisse en place un noeud MASQUE', () => {
    const masque = node({ id: 'masque', latitude: 48.86, longitude: 2.35, is_visible: false, position_x: 42 })
    expect(layout([masque], reference).applyGeographicLayout()).toBe(0)
    expect(masque.position_x).toBe(42)
  })

  it('compte les noeuds visibles coordonnes et ceux qui ne le sont pas', () => {
    const nodes = [
      node({ id: 'a', latitude: 1, longitude: 2 }),
      node({ id: 'b', latitude: 3, longitude: 4 }),
      node({ id: 'c' }),
      node({ id: 'masque', latitude: 5, longitude: 6, is_visible: false })
    ]
    expect(layout(nodes, reference).geoPositionCount()).toEqual({ with_coordinates: 2, without: 1 })
  })
})

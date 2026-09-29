// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1364 (jalon 79, D3) — MODE DE POSITION « GÉOGRAPHIQUE ». Sixième mode, à côté de `absolute`,
// `relative`, `parametric`, `proportional` et `scale_adapted`, et construit comme eux : un fichier,
// une classe, un délégateur dans `NodePositioning`, une branche dans `_drawElementsBody`.
//
// POURQUOI UN MODE ET NON UNE REPRÉSENTATION. Une carte de flux n'est pas un autre dessin du même
// diagramme, comme le sont le camembert ou le sunburst : c'est LE MÊME DESSIN, avec les nœuds
// ailleurs. On veut y retrouver les rubans à épaisseur variable, le moteur de libellés, les
// gabarits, les points de passage, l'export et la publication. En faire une représentation qui
// dessine son propre SVG reviendrait à réécrire tout cela en petit — l'erreur que os#1390 vient
// justement de retirer à l'aperçu unitaire.
//
// CE QUE CE MODE AJOUTE, EXACTEMENT : les nœuds retrouvent leur place tout seuls, et la retrouvent
// encore si l'on change de fond, d'échelle ou de projection. Les deux cartes livrées avec
// l'application (`SankeyData/templates/maps/`) obtiennent aujourd'hui le même effet en posant
// vingt-neuf nœuds un par un à des coordonnées d'écran choisies à la main : rien ne s'y recalcule.

import type { Class_NodeElement } from '../Elements/Node'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { NodePositioning } from './NodePositioning'
import { fitGeoReference, placeGeoPoint, Type_GeoReference } from './geoProjection'
import { explodeAround, greatCircleKm, isExploded, Type_ExplodeItem } from './explodedGeoLayout'

export class NodePositioningGeographic {
  constructor(private readonly np: NodePositioning) { }

  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }

  /**
   * Pose sur le fond de carte tous les nœuds qui savent où ils sont.
   *
   * TROIS REFUS, et chacun vaut mieux qu'un déplacement :
   *   - pas de calage du fond, ou calage inexploitable (deux points confondus) : on ne sait pas
   *     encore où tombe le monde dans la case, et inventer une échelle ferait sauter tout le
   *     diagramme à la première ouverture ;
   *   - un nœud sans coordonnées : il garde sa position, et c'est ce qui rend le mode utilisable
   *     sur un diagramme À MOITIÉ géoréférencé — l'état normal pendant qu'on saisit les
   *     coordonnées, et l'état définitif d'un « Reste du monde » qui n'est nulle part ;
   *   - un nœud relatif : il suit son voisin, comme dans tous les autres modes.
   *
   * @returns le nombre de nœuds effectivement posés — zéro dit « rien n'a bougé », ce que
   * l'interface a besoin de savoir pour expliquer une carte qui ne se forme pas.
   */
  public applyGeographicLayout(): number {
    const reference = this.drawingArea.geo_reference
    if (reference === null) return 0
    const fit = fitGeoReference(reference)
    if (fit === null) return 0
    let placed = 0
    this.drawingArea.sankey.nodes_list.forEach((node: Class_NodeElement) => {
      if (!node.is_visible) return
      if (!node.has_geo_position) return
      if (node.shape_position_type === 'relative') return
      const point = placeGeoPoint(node.latitude as number, node.longitude as number, reference, fit)
      node.geo_point_px = point
      // os#1510 lot 3 — LE CONTOUR DU TERRITOIRE, projeté avec le même calage. Un nœud qui en
      // porte un occupe sa boîte englobante (son coin est celui de la boîte, pas le point moins
      // une demi-taille) : c'est le contour qui dit où le nœud est, le point n'en est que le
      // centre visuel, où le nom s'écrit et d'où partent les azimuts.
      // Le contour n'est QUE le lieu des ancres : le nœud garde sa taille propre, centrée sur son
      // point (27/09/2026). Lui donner la boîte de son territoire posait des rectangles invisibles
      // sur la carte — « France - Import » recouvrait le concentrateur et captait les clics.
      const ring = node.geo_ring
      node.geo_ring_px = (ring !== null && node.shape_anchor_mode === 'radial')
        ? ring.map(([la, lo]) => placeGeoPoint(la, lo, reference, fit))
        : null
      // Le point géographique est le CENTRE du nœud, jamais son coin haut-gauche : un nœud dont
      // la hauteur EST sa valeur change de taille au moindre changement de datatag, et caler son
      // coin le ferait glisser vers le bas à chaque fois — le lieu se déplacerait avec la
      // quantité, ce qui est le contraire d'une carte.
      node.position_x = point.x - node.getShapeWidthToUse() / 2
      node.position_y = point.y - node.getShapeHeightToUse() / 2
      // Le centre stocké suit, comme après tout geste explicite (cf. `captureCenterFromCorner`).
      // Conséquence voulue : un fichier enregistré en mode géographique porte des x/y JUSTES, donc
      // se rouvre au bon endroit MÊME en mode absolu, et même chez quelqu'un qui n'a pas le fond
      // de carte. Les coordonnées restent la vérité ; les pixels en sont une trace fidèle.
      node.captureCenterFromCorner()
      placed++
    })
    if (reference.exploded) this._explode(reference, fit)
    return placed
  }

  /**
   * CARTE ÉCLATÉE (cf. `explodedGeoLayout.ts`) : les nœuds déjà posés qui s'éclatent sont
   * déplacés autour du centre, leur contour suit (translaté et mis à l'échelle autour de leur
   * point). Le reste — le centre lui-même, ce qui l'entoure sans territoire — ne bouge pas.
   */
  private _explode(reference: Type_GeoReference, fit: NonNullable<ReturnType<typeof fitGeoReference>>) {
    const centre_geo = reference.exploded as { latitude: number, longitude: number }
    const centre = placeGeoPoint(centre_geo.latitude, centre_geo.longitude, reference, fit)
    const reach = (node: Class_NodeElement, point: { x: number, y: number }) => {
      const ring = node.geo_ring_px
      if (ring === null) return Math.max(node.getShapeWidthToUse(), node.getShapeHeightToUse()) / 2
      return Math.max(...ring.map(p => Math.hypot(p.x - point.x, p.y - point.y)))
    }
    const items: Type_ExplodeItem[] = []
    const nodes = new Map<string, Class_NodeElement>()
    let centre_radius = 0
    const centre_nodes: Class_NodeElement[] = []
    this.drawingArea.sankey.nodes_list.forEach((node: Class_NodeElement) => {
      const point = node.geo_point_px
      if (!node.is_visible || !node.has_geo_position || point === null) return
      if (node.shape_position_type === 'relative') return
      const km = greatCircleKm(node.latitude as number, node.longitude as number, centre_geo.latitude, centre_geo.longitude)
      if (!isExploded(km, node.geo_ring_px !== null)) {
        if (km <= 50) {
          centre_radius = Math.max(centre_radius, reach(node, point))
          if (node.geo_ring_px !== null) centre_nodes.push(node)
        }
        return
      }
      nodes.set(node.id, node)
      items.push({ id: node.id, x: point.x, y: point.y, radius: reach(node, point), scalable: node.geo_ring_px !== null })
    })
    if (items.length === 0) return
    const farthest = Math.max(...items.map(it => Math.hypot(it.x - centre.x, it.y - centre.y)))
    const { placements, centre_scale } = explodeAround(centre, items, {
      centre_radius: centre_radius > 0 ? centre_radius : 40,
      max_distance: 0.85 * farthest
    })
    // Le territoire du centre grandit comme ses voisins (cf. `centre_scale`) ; le nœud, lui, reste.
    centre_nodes.forEach(node => {
      const pt = node.geo_point_px as { x: number, y: number }
      node.geo_ring_px = (node.geo_ring_px as { x: number, y: number }[])
        .map(q => ({ x: pt.x + (q.x - pt.x) * centre_scale, y: pt.y + (q.y - pt.y) * centre_scale }))
    })
    placements.forEach((p, id) => {
      const node = nodes.get(id) as Class_NodeElement
      const old = node.geo_point_px as { x: number, y: number }
      const ring = node.geo_ring_px
      if (ring !== null) {
        node.geo_ring_px = ring.map(q => ({ x: p.x + (q.x - old.x) * p.scale, y: p.y + (q.y - old.y) * p.scale }))
      }
      node.geo_point_px = { x: p.x, y: p.y }
      node.position_x = p.x - node.getShapeWidthToUse() / 2
      node.position_y = p.y - node.getShapeHeightToUse() / 2
      node.captureCenterFromCorner()
    })
  }

  /**
   * Combien de nœuds VISIBLES portent des coordonnées, et combien n'en portent pas. Sert à
   * l'interface — dire « 12 nœuds sur 29 sont placés » plutôt que laisser deviner pourquoi la
   * carte est trouée — et à la capacité `geography` du registre des représentations.
   */
  public geoPositionCount(): { with_coordinates: number, without: number } {
    let with_coordinates = 0
    let without = 0
    this.drawingArea.sankey.nodes_list.forEach((node: Class_NodeElement) => {
      if (!node.is_visible) return
      if (node.has_geo_position) with_coordinates++
      else without++
    })
    return { with_coordinates, without }
  }
}

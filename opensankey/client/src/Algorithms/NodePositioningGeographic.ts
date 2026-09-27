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
import { fitGeoReference, placeGeoPoint } from './geoProjection'

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
    return placed
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

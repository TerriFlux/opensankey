// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Mode PROPORTIONNEL (%) extrait de NodePositioning (#243, split des modes). Comprime/dilate le
// diagramme verticalement autour d'une mediane fixe selon un facteur derive de l'element de
// reference (flux/noeud-stock) ou, a defaut, des sommes de hauteurs par colonne. Detient en propre
// l'etat `_prop_*` et le drapeau `suppressProportionalCompression` ; le mode parametrique (mode
// << ecart >>) le CONSOMME en lecture via `this.np.proportional` (medianY / hasReferenceFrame /
// proportionalFactor / proportionalEligibleNodes / captureProportionalReference).
//
// Sous-service compose : `drawingArea` et `reference` exposes en getters, corps deplaces VERBATIM.

import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { NodePositioning } from './NodePositioning'
import type { NodePositioningReference } from './NodePositioningReference'
import * as Geometry from './NodePositioningGeometry'

export class NodePositioningProportional {
  constructor(private readonly np: NodePositioning) { }

  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }
  private get reference(): NodePositioningReference { return this.np.reference }

  // #1231 — Mode proportionnel : cadre de référence capturé à l'entrée du mode
  // (et après drag / changement de vue). Trois repères : médiane (centre de gravité),
  // haut et bas. `_prop_ref_col_sums` = somme des hauteurs de nœuds par colonne au
  // datatag de référence ; sert à calculer le facteur de compression f = plus petit
  // ratio (somme courante / somme de référence) sur les colonnes. Transitoires.
  private _prop_median_y: number | undefined = undefined
  private _prop_top_y: number | undefined = undefined
  private _prop_bottom_y: number | undefined = undefined
  private _prop_ref_col_sums: Map<number, number> | undefined = undefined

  // #1231 — Drapeau de suppression de la compression proportionnelle pendant une
  // opération STRUCTURELLE (englobement, désagrégation, expansion…). Ces opérations
  // créent des états transitoires où une colonne contient à la fois le parent ET ses
  // enfants (ex. englobement : parent-cadre + enfants visibles) → la somme de colonne
  // double brièvement → f bondit (max ratio) → tout le diagramme se dilate, et la
  // re-capture en fin d'opération FIGE cet état dilaté. La compression ne doit réagir
  // qu'aux changements de datatag/vue, pas aux changements de structure. Posé autour de
  // l'opération, levé juste avant la re-capture finale (cf. NodeActions/Hierarchies).
  public suppressProportionalCompression = false

  /** #243 (split modes) — Mediane (centre de gravite) du cadre proportionnel courant ; undefined si non capture. */
  public get medianY(): number | undefined { return this._prop_median_y }

  /** #243 (split modes) — true si un cadre de reference proportionnel est capture (mediane + sommes par colonne). */
  public get hasReferenceFrame(): boolean { return this._prop_median_y !== undefined && !!this._prop_ref_col_sums }

  /**
   * #1231 — Nœuds « libres » éligibles au mode proportionnel : visibles, non-échange,
   * non-relatifs, hors cadres tied. (Filtre commun capture/replacement.)
   */
  public proportionalEligibleNodes(): Class_NodeElement[] {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    return this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.shape_position_type === 'relative') return false
      if (n.tied_to_nodes && n.attached_node.length > 0) return false
      // #1231 — un nœud DANS un cadre englobant (tied) suit le cadre : on l'exclut de la
      // compression proportionnelle indépendante. Sinon l'englobement (qui ajoute des
      // enfants éligibles et exclut le parent-cadre) faisait varier le facteur f et
      // re-spreadait les autres nœuds (ex. bois mort) → l'opération n'était pas
      // indépendante du mode (KO en %, OK en absolu).
      if (n.attached_container && n.attached_container.length > 0) return false
      return true
    })
  }

  /**
   * #1231 — Mode proportionnel : somme des hauteurs de nœuds par colonne (`position_u`)
   * au datatag courant. Proxy de la « somme des valeurs par colonne » (hauteur ∝ valeur
   * à échelle constante). Sert à calculer le facteur de compression f.
   */
  private proportionalColumnSums(nodes: Class_NodeElement[]): Map<number, number> {
    const sums = new Map<number, number>()
    nodes.forEach(n => {
      sums.set(n.position_u, (sums.get(n.position_u) ?? 0) + n.getShapeHeightToUse())
    })
    return sums
  }

  /**
   * #1231 — Réinitialise complètement l'état du mode proportionnel : retire le flux de
   * référence (et son marqueur persisté) et oublie le cadre de référence capturé (médiane,
   * sommes par colonne, épaisseur du flux). Les positions courantes des nœuds sont
   * conservées (elles deviennent les positions absolues). Appelé au passage en mode absolu :
   * on repart « propre », un futur retour en proportionnel re-capture tout.
   */
  public resetProportionalState() {
    this.reference.setProportionalReferenceLink(undefined)
    this._prop_median_y = undefined
    this._prop_top_y = undefined
    this._prop_bottom_y = undefined
    this._prop_ref_col_sums = undefined
  }

  /**
   * #1231 — Capture le cadre de référence du mode proportionnel sur l'état courant.
   * Deux régimes selon qu'un flux de référence est sélectionné ou non :
   *  - AVEC flux de référence : médiane (centre de gravité, FIXE) = centre vertical du flux
   *    à mi-parcours ; l'épaisseur du flux est mémorisée comme référence du facteur f.
   *  - SANS flux de référence (fallback) : médiane = moyenne, sur les colonnes, des **centres
   *    géométriques** de pile ; sommes de hauteurs par colonne mémorisées pour f (max ratio).
   * Dans les deux cas on capture le centre de référence de chaque nœud (pour le replacement).
   * Appelé à l'entrée du mode, après un drag et au changement de vue. `position_u` doit
   * être à jour (cf. `inferPositionUFromX`).
   */
  public captureProportionalReference() {
    const nodes = this.proportionalEligibleNodes()
    if (nodes.length === 0) {
      this._prop_median_y = undefined
      this._prop_top_y = undefined
      this._prop_bottom_y = undefined
      this._prop_ref_col_sums = undefined
      return
    }
    // Médiane = moyenne des centres géométriques de pile par colonne.
    const extents = Geometry.columnGeometricExtents(nodes)
    let top_y = Infinity
    let bottom_y = -Infinity
    let center_sum = 0
    extents.forEach(({ top, bottom, center }) => {
      center_sum += center
      if (top < top_y) top_y = top
      if (bottom > bottom_y) bottom_y = bottom
    })
    this._prop_median_y = center_sum / extents.size
    this._prop_top_y = top_y
    this._prop_bottom_y = bottom_y
    this._prop_ref_col_sums = this.proportionalColumnSums(nodes)
    nodes.forEach(n => n.captureProportionalCenterRef())

    // #1231 — Avec élément de référence : la médiane (centre de gravité fixe) se cale sur le
    // centre vertical de l'élément (flux à mi-parcours, ou centre du nœud-stock). Le facteur f
    // est value-based (cf. proportionalFactor) : rien à capturer ici pour f (il dérive du couple
    // élément/datatag de référence persisté).
    const ref_center = this.referenceCenterY()
    if (ref_center !== undefined) {
      this._prop_median_y = ref_center
    }
  }

  /** #1231b — Centre vertical de l'élément de référence (visibilité-gated). undefined si aucun. */
  private referenceCenterY(): number | undefined {
    const ref = this.reference.gatedReference
    if (!ref) return undefined
    const node = this.reference.rawReferenceNode
    if (node && ref === node) {
      return node.position_y + node.getShapeHeightToUse() / 2
    }
    return this.reference.fluxCenterY(ref as Class_LinkElement)
  }

  /**
   * #1231 — Facteur de compression/dilatation courant.
   *  - AVEC flux de référence : f = épaisseur courante du flux / épaisseur capturée. Tout le
   *    diagramme se comprime/dilate autour de la médiane (centre du flux) selon ce ratio.
   *  - SANS (fallback) : plus GRAND ratio (somme de hauteurs par colonne courante / référence)
   *    sur les colonnes communes.
   * 1 si pas de référence exploitable.
   */
  public proportionalFactor(nodes: Class_NodeElement[]): number {
    // #1231 — Régime « flux de référence » : f = ratio de VALEUR du flux de référence entre le
    // datatag courant et le datatag de référence (couple persisté flux/datatag). f=1 au datatag
    // de réf ; indépendant du moment où l'on (r)entre en mode %.
    // En mode vue, le flux de référence peut être masqué par le filtre → lien brut. Le facteur
    // est piloté par la valeur du CORRESPONDANT de la vue (somme des flux enfants visibles
    // portant l'étiquette sélectionnée) rapportée à la valeur du flux de référence : une vue
    // plus petite que le total donne f<1 → le diagramme se comprime (rétracte).
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this.reference.rawReference : this.reference.gatedReference
    if (ref) {
      const ref_val = this.reference.referenceFluxRefValue()
      const cur = view_active
        ? this.reference.referenceViewValue()
        : this.reference.referenceCurrentValue()
      if (ref_val && ref_val > 0 && cur > 0) {
        const f = cur / ref_val
        return (isFinite(f) && f > 0) ? f : 1
      }
      return 1
    }
    if (!this._prop_ref_col_sums) return 1
    const cur = this.proportionalColumnSums(nodes)
    let f = 0
    this._prop_ref_col_sums.forEach((ref_sum, u) => {
      if (ref_sum <= 0) return
      const cur_sum = cur.get(u) ?? 0
      const ratio = cur_sum / ref_sum
      if (ratio > f) f = ratio
    })
    if (!isFinite(f) || f <= 0) return 1
    return f
  }

  /**
   * #1231 — Mode proportionnel : comprime/dilate le diagramme verticalement autour de
   * la médiane (centre de gravité fixe) par le facteur de flux. Appelé en tête de
   * `drawElements` avant `_sankey.draw()`. Capture la référence au 1er appel si absente.
   */
  public anchorProportionalNodes() {
    // #1231 — Pendant une opération structurelle, ne pas comprimer : on laisse les
    // positions calculées par l'opération (remplissage du slot, etc.) telles quelles ;
    // la re-capture finale les fixera comme nouvelle référence (f=1).
    if (this.suppressProportionalCompression) return
    const nodes = this.proportionalEligibleNodes()
    if (nodes.length === 0) return
    if (this._prop_median_y === undefined || !this._prop_ref_col_sums) {
      this.captureProportionalReference()
      return
    }
    // #1231 (1.1.5) — anti-chevauchement GLOBAL : le facteur de compression effectif est
    // borné par le bas par le facteur minimal qui empêche TOUTE colonne de chevaucher
    // (proportionalMinFactor). Appliqué uniformément à tous les nœuds, c'est une
    // transformation linéaire autour de la médiane → l'ordre vertical par pourcentage est
    // préservé EXACTEMENT entre colonnes (un nœud plus haut le reste, gauche ou droite), et
    // la colonne la plus dense « tire » tout le diagramme. Plus de plancher par colonne.
    const f = this.proportionalFactor(nodes)
    // Plancher anti-chevauchement (écart minimum entre nœuds). En mode vue, les nœuds révélés par
    // le filtre n'ont pas de position verticale propre (le fichier les stocke empilés) : deux
    // peuvent se retrouver quasi collés et le facteur dépasserait 1, dilatant tout le diagramme à
    // l'infini. On le PLAFONNE donc à 1 en vue : on applique l'écart minimum tant qu'il « tient »
    // dans la disposition d'origine, mais on ne dilate jamais au-delà (pas d'explosion, et la vue
    // ne se contracte pas plus que nécessaire). Hors vue : comportement normal (ensemble fixe).
    const min_factor = this.proportionalMinFactor(nodes)
    const capped_min = this.drawingArea.sankey.view_mode_active ? Math.min(min_factor, 1) : min_factor
    const f_eff = Math.max(f, capped_min)
    nodes.forEach(n => n.applyProportionalCompression(this._prop_median_y!, f_eff))
  }

  /**
   * #1231 — Espacement des colonnes en mode proportionnel (option « écarts × f avec plancher »).
   * Raisonne en DISTANCES ENTRE CENTRES (et non en positions absolues) :
   *  - distance de référence entre deux nœuds voisins = écart de leurs centres capturés ;
   *  - distance voulue = max(distance_réf × f, ½h_haut + ½h_bas + écart_min) ;
   *  - la pile est centrée sur le centre comprimé de la colonne
   *    (médiane + (centre_réf_colonne − médiane) × f).
   * Propriétés :
   *  - à f = 1 et sans chevauchement de départ, reproduit EXACTEMENT le layout (centre de
   *    colonne = (cref_premier+cref_dernier)/2, indépendant de la médiane) → sélectionner/retirer
   *    le flux de référence ne bouge rien ;
   *  - garantit un écart ≥ écart_min entre voisins (jamais de chevauchement) ;
   *  - l'espacement suit le flux (× f) tant qu'il reste au-dessus du plancher.
   * `écart_min` = `shape_position_dy` GLOBAL (petit, ~50px) : un dy par-nœud aberrant (ex. 434)
   * forcerait un grand écart même quand le layout d'origine est plus serré → faux déplacements.
   */
  private proportionalMinFactor(nodes: Class_NodeElement[]): number {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    // Paires de centres de réf quasi confondus : aucun facteur fini ne les sépare (déjà
    // superposées en absolu) → ignorées, sinon f_min exploserait.
    const EPS = 1
    const cols = new Map<number, Class_NodeElement[]>()
    nodes.forEach(n => {
      const arr = cols.get(n.position_u) ?? []
      arr.push(n)
      cols.set(n.position_u, arr)
    })
    let f_min = 0
    cols.forEach(col => {
      if (col.length < 2) return
      const cref = (n: Class_NodeElement) => n.center_y ?? n._prop_center_ref ?? (n.position_y + n.getShapeHeightToUse() / 2)
      col.sort((a, b) => cref(a) - cref(b))
      for (let i = 0; i < col.length - 1; i++) {
        const gap_ref = cref(col[i + 1]) - cref(col[i])
        if (gap_ref <= EPS) continue
        // Facteur minimal pour que l'écart de centres comprimé reste ≥ ½h_haut+½h_bas+min_gap.
        const min_dist = col[i].getShapeHeightToUse() / 2 + col[i + 1].getShapeHeightToUse() / 2 + min_gap
        const need = min_dist / gap_ref
        if (need > f_min) f_min = need
      }
    })
    return f_min
  }
}

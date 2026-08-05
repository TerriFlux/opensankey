// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Mode « ECHELLE ADAPTEE » (#1231, lot #243 c5) — au lieu de bouger les noeuds pour absorber un
// changement de datatag, on ajuste l'ECHELLE (valeur -> px) pour que le DIAGRAMME garde la meme
// hauteur rendue. Les positions des noeuds ne sont pas touchees ; seul l'affichage est recale
// (anti-chevauchement par colonne), jamais persiste.
//
// #384 — La reference n'est plus un ELEMENT designe (flux / noeud-stock) mais la GRANDEUR DU
// DIAGRAMME ENTIER (cf. `diagramMagnitude`). Un element unique cassait dans deux cas d'usage :
// absent (ou nul) a certains datatags, l'echelle n'etait pas adaptee du tout, silencieusement ;
// et on ne pouvait pas s'adapter sur plusieurs flux a la fois. L'element de reference garde son
// role pour le mode PROPORTIONNEL et pour le plafond d'epaisseur par view tag ; ce mode-ci n'a
// plus AUCUN etat commun avec lui (le socle NodePositioningReference n'est plus lu ici).
//
// Sous-service compose : `drawingArea` est expose en getter pour que les corps de methodes
// soient deplaces VERBATIM depuis NodePositioning.

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { NodePositioning } from './NodePositioning'

export class NodePositioningScaleAdapted {
  constructor(private readonly np: NodePositioning) { }

  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }

  // #1231/#384 — Mode « échelle adaptée » : au lieu de bouger les nœuds, on ajuste l'échelle
  // (valeur→px) pour que le diagramme garde TOUJOURS la même hauteur. Comme la hauteur
  // ∝ grandeur / échelle, on garde `échelle / grandeur` constant : à chaque datatag,
  // échelle = échelle_ref × (grandeur_courante / grandeur_ref). On capture l'échelle et la
  // grandeur à l'entrée du mode. Transitoires.
  private _scale_adapted_ref_magnitude: number | undefined = undefined

  private _scale_adapted_ref_scale: number | undefined = undefined

  /**
   * #384 — Grandeur du diagramme au datatag/viewtag courant : la SOMME DE LA COLONNE LA PLUS
   * HAUTE, exprimée EN VALEURS et non en pixels (aucune circularité avec l'échelle qu'elle sert
   * à fixer). C'est bien elle qui détermine la hauteur rendue du diagramme : la hauteur d'un
   * nœud vaut sa valeur ÷ échelle, et la hauteur totale est celle de la colonne la plus chargée.
   *
   * Mêmes conventions de colonne que `resolveScaleAdaptedOverlaps` : groupage par `position_u`,
   * exclusion des nœuds `echange` (import/export, placés au niveau de leur flux — ils gonfleraient
   * artificiellement une colonne), des nœuds relatifs et des cadres tied. Seuls les éléments
   * VISIBLES comptent : le cas du mode vue se règle ainsi sans code séparé.
   *
   * 0 si le diagramme n'a aucune valeur (garde-fou de `applyAdaptedScale`).
   */
  public diagramMagnitude(): number {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const columns = new Map<number, number>()
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (echangeTag && n.hasGivenTag(echangeTag)) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      const v = this.nodeMagnitude(n)
      if (!(v > 0)) return
      columns.set(n.position_u, (columns.get(n.position_u) ?? 0) + v)
    })
    let max = 0
    columns.forEach(sum => { if (sum > max) max = sum })
    return max
  }

  /**
   * #384 — Valeur-équivalente de la hauteur d'un nœud : `max(Σ entrées, Σ sorties)`, augmentée
   * de la valeur de stock quand le nœud est dimensionné par son stock (miroir en valeurs de
   * `Node._getNaturalShapeHeight`, dont la hauteur-stock est divisée par
   * `stock_height_scale_factor`). Les planchers/plafonds en pixels (`minimum_flux`,
   * `maximum_node`) sont volontairement ignorés : ils ne suivent pas l'échelle, et les faire
   * entrer ici rendrait la grandeur dépendante de l'échelle courante.
   */
  private nodeMagnitude(n: Class_NodeElement): number {
    let sum_in = 0
    let sum_out = 0
    n.visible_input_links_list.forEach(l => { sum_in += this.linkMagnitude(l) })
    n.visible_output_links_list.forEach(l => { sum_out += this.linkMagnitude(l) })
    let magnitude = Math.max(sum_in, sum_out)
    if (n.use_stock_for_height) {
      const si = n.currentStockInitialForHeight()
      if (si !== null && isFinite(si)) {
        const factor = n.stock_height_scale_factor > 0 ? n.stock_height_scale_factor : 1
        magnitude = Math.max(magnitude, Math.abs(si) / factor)
      }
    }
    return magnitude
  }

  /**
   * #384 — Valeur-équivalente de l'épaisseur d'un flux. `shape_local_link_scale` divise
   * l'échelle du flux (cf. `Link.scaleValueToPx`) : un flux à l'échelle locale f rend f fois
   * plus fin, sa contribution à la hauteur de la colonne est donc valeur/f. Les flux portés par
   * un tag d'unité ont leur propre échelle, indépendante de celle du diagramme : ils comptent
   * ici pour leur valeur brute (limite assumée, cf. #382).
   */
  private linkMagnitude(l: Class_LinkElement): number {
    const v = l.valueCurrent
    if (v === null || v === undefined || !isFinite(v)) return 0
    const factor = l.shape_local_link_scale || 1
    return Math.abs(v) / factor
  }

  /**
   * #1231/#384 — Mode « échelle adaptée » : capture l'échelle courante et la grandeur du
   * diagramme. Sert de base au ratio appliqué ensuite (`applyAdaptedScale`). À l'entrée du
   * mode, grandeur_courante == grandeur_ref → échelle inchangée → pas de saut.
   */
  public captureScaleReference() {
    const m = this.diagramMagnitude()
    if (m > 0) {
      this._scale_adapted_ref_magnitude = m
      this._scale_adapted_ref_scale = this.drawingArea.scale
    } else {
      this._scale_adapted_ref_magnitude = undefined
      this._scale_adapted_ref_scale = undefined
    }
  }

  /**
   * #369 — Couple capturé du mode « échelle adaptée » (échelle de BASE + grandeur du diagramme),
   * exposé pour la PERSISTANCE. Le mode étant désormais restitué à l'ouverture (cf.
   * `positionModeOnLoad`), ce couple doit l'être aussi : le `user_scale` écrit dans le fichier
   * est l'échelle ADAPTÉE au datatag courant (base × grandeur_courante / grandeur_réf), pas
   * l'échelle de base. Le laisser recapturer au chargement prendrait donc l'échelle adaptée pour
   * base et composerait le ratio une seconde fois au dessin suivant → le diagramme changerait de
   * taille juste après l'ouverture. undefined tant que rien n'a été capturé (rien à écrire).
   */
  public get scaleAdaptedReference(): { scale: number, magnitude: number } | undefined {
    if (this._scale_adapted_ref_scale === undefined) return undefined
    if (this._scale_adapted_ref_magnitude === undefined) return undefined
    return { scale: this._scale_adapted_ref_scale, magnitude: this._scale_adapted_ref_magnitude }
  }

  /**
   * #369 — Restaure le couple capturé lu dans le fichier (cf. `scaleAdaptedReference`). Valeurs
   * aberrantes ignorées : la capture paresseuse de `applyAdaptedScale` reprend alors la main
   * (comportement d'un fichier antérieur, qui ne porte pas ces clés).
   */
  public restoreScaleReference(scale: number, magnitude: number) {
    if (!isFinite(scale) || scale <= 0) return
    if (!isFinite(magnitude) || magnitude <= 0) return
    this._scale_adapted_ref_scale = scale
    this._scale_adapted_ref_magnitude = magnitude
  }

  /**
   * #1231/#384 — Mode « échelle adaptée » : ajuste l'échelle (valeur→px) du diagramme pour qu'il
   * garde sa hauteur de référence à tous les datatags. Appelé en tête de `drawElements` avant
   * `_sankey.draw()`. Écrit directement `_scale` + le domaine de `_scaleValueToPx` (le setter
   * `scale` redraw → récursion ; on l'évite).
   */
  public applyAdaptedScale() {
    // Capture paresseuse (1er dessin / après chargement) : base = échelle + grandeur courantes
    // → ratio 1 à cette frame, pas de saut.
    if (this._scale_adapted_ref_magnitude === undefined || this._scale_adapted_ref_scale === undefined) {
      this.captureScaleReference()
      return
    }
    // Grandeur au datatag/viewtag courant. Nulle (datatag sans aucune valeur) : on garde
    // l'échelle précédente plutôt que de diviser par zéro.
    const m = this.diagramMagnitude()
    if (!(m > 0)) return
    const new_scale = this._scale_adapted_ref_scale * m / this._scale_adapted_ref_magnitude
    if (isFinite(new_scale) && new_scale > 0) {
      this.drawingArea._scale = new_scale
      this.drawingArea._scaleValueToPx.domain([0, new_scale])
    }
  }

  /**
   * #1231 — Sortie du mode « échelle adaptée » : restaure l'échelle de base capturée (pour
   * ne pas laisser le diagramme à une échelle adaptée d'un autre datatag) et oublie la
   * capture. L'échelle restaurée s'affiche au prochain dessin.
   */
  public clearScaleAdaptation() {
    if (this._scale_adapted_ref_scale !== undefined && this._scale_adapted_ref_scale > 0) {
      this.drawingArea._scale = this._scale_adapted_ref_scale
      this.drawingArea._scaleValueToPx.domain([0, this._scale_adapted_ref_scale])
    }
    this._scale_adapted_ref_magnitude = undefined
    this._scale_adapted_ref_scale = undefined
  }

  /**
   * #1231 — Mode « échelle adaptée » : dérive le coin de chaque nœud « libre » depuis son CENTRE
   * stocké, SANS jamais recommiter le coin dans le centre. Remplace `anchorAbsoluteNodesByCenter`
   * dans la branche scale_adapted de `drawElements` : on garde la même dérivation centre→coin,
   * mais on supprime la branche « taille inchangée → captureCenterFromCorner » qui figerait le
   * recalage d'affichage (anti-chevauchement / clamp, cf. `resolveScaleAdaptedOverlaps`) dans le
   * centre persisté → ce recalage se traînerait alors d'un viewtag/datatag à l'autre.
   *
   * Le centre reste la SEULE vérité : il n'est modifié que par les gestes utilisateur (drag,
   * resize → `settleCenterAnchor`) et les opérations structurelles, jamais par le dessin. À chaque
   * frame on repart donc du centre propre, et le recalage d'espacement est recalculé pour le
   * datatag/viewtag courant (transitoire, jamais persistant).
   *
   * Mêmes exclusions que `anchorAbsoluteNodesByCenter` : nœuds visibles, libres (non relatifs),
   * hors cadres tied. Lazy-init du centre au 1er dessin (fichier sans centre encore posé).
   */
  public deriveScaleAdaptedCornersFromCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      if (n.center_x === undefined || n.center_y === undefined) {
        n.captureCenterFromCorner() // init unique ; le coin est déjà cohérent
      } else {
        n.forceDeriveFromCenter() // coin = centre − taille/2, sans recommit du centre
      }
    })
  }

  /**
   * #1231 — Mode « échelle adaptée » : décale un nœud verticalement de `dy` POUR L'AFFICHAGE
   * seulement (coin `position_y`), SANS toucher au centre stocké. Le recalage d'espacement est
   * propre au datatag/viewtag courant : il est recalculé à chaque dessin à partir du centre
   * (cf. `deriveScaleAdaptedCornersFromCenter`) et ne doit donc jamais être persisté, sinon il se
   * traînerait d'un datatag/viewtag à l'autre. No-op si `dy` nul.
   */
  private shiftNodeY(n: Class_NodeElement, dy: number) {
    if (!dy) return
    n.position_y += dy
  }

  /**
   * #1231 — Mode « échelle adaptée » : anti-chevauchement par colonne (DEPUIS LE HAUT) + clamp
   * du haut du diagramme. Appelé après `deriveScaleAdaptedCornersFromCenter` dans la branche
   * scale_adapted de `drawElements`.
   *
   * En mode échelle, les nœuds grossissent autour de leur centre FIXE quand l'échelle monte
   * (bascule datatag/viewtag). Deux effets indésirables :
   *  - deux nœuds d'une même colonne peuvent se recouvrir ;
   *  - le nœud du haut, dont le coin = centre − hauteur/2, peut passer AU-DESSUS du haut du
   *    diagramme (y < 0).
   *
   * On ne re-layoute PAS le diagramme :
   *  1. anti-chevauchement : le nœud le plus haut de chaque colonne garde sa place, chaque nœud
   *     suivant est descendu juste assez pour rétablir l'écart minimal (push vers le bas only) ;
   *  2. clamp du haut : si le sommet de la colonne dépasse y=0, on décale TOUTE la colonne vers
   *     le bas pour que son sommet tienne pile au haut du diagramme.
   * Ces décalages sont D'AFFICHAGE (coin seulement, cf. `shiftNodeY`) : recalculés à chaque
   * dessin depuis le centre, donc propres au datatag/viewtag courant et jamais persistés.
   *
   * Mêmes conventions de colonne que `backCalculateShapePositionDyFromY` : groupage par
   * `position_u`, exclusion des nœuds `echange` (import/export, placés au niveau de leur flux),
   * des nœuds relatifs et des cadres tied. `écart_min` = `shape_position_dy` GLOBAL.
   */
  public resolveScaleAdaptedOverlaps() {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const columns = new Map<number, Class_NodeElement[]>()
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (echangeTag && n.hasGivenTag(echangeTag)) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      const arr = columns.get(n.position_u) ?? []
      arr.push(n)
      columns.set(n.position_u, arr)
    })
    columns.forEach(col => {
      // Ordre vertical = ordre LOGIQUE de la colonne (`position_v`), PAS la géométrie courante :
      // en échelle adaptée, position_y est dérivée du centre et peut différer d'un pouième entre
      // deux nœuds quasi alignés → un tri par position_y inverserait leur ordre (ex. v=1 au-dessus
      // de v=0) et le push figerait l'inversion. position_v est l'ordre stable (calculé au load,
      // u/v verrouillés). position_y en départage seulement les v égaux (ne devrait pas arriver).
      col.sort((a, b) => (a.position_v - b.position_v) || (a.position_y - b.position_y))
      // 1. anti-chevauchement, depuis le haut : descendre les nœuds qui se recouvrent.
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1]
        const curr = col[i]
        const min_top = prev.position_y + prev.getShapeHeightToUse() + min_gap
        if (curr.position_y < min_top) this.shiftNodeY(curr, min_top - curr.position_y)
      }
      // 2. clamp du haut : le sommet de la colonne (nœud le plus haut, jamais descendu) ne doit
      //    pas dépasser y=0. Sinon on décale toute la colonne vers le bas (affichage seulement).
      const top = col[0].position_y
      if (top < 0) col.forEach(n => this.shiftNodeY(n, -top))
    })
  }
}

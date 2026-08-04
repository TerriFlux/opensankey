// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Mode « ECHELLE ADAPTEE » (#1231, lot #243 c5) — au lieu de bouger les noeuds pour absorber un
// changement de datatag, on ajuste l'ECHELLE (valeur -> px) pour que l'element de reference garde
// une taille rendue constante. Les positions des noeuds ne sont pas touchees ; seul l'affichage
// est recale (anti-chevauchement par colonne), jamais persiste.
//
// Ne partage AUCUN etat avec le mode proportionnel : ses deux champs `_scale_adapted_*` lui
// appartiennent en propre. Le seul terrain commun est l'ELEMENT DE REFERENCE, lu via le socle
// NodePositioningReference (`this.reference`).
//
// Sous-service compose : `drawingArea` et `reference` sont exposes en getters pour que les corps
// de methodes soient deplaces VERBATIM depuis NodePositioning.

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { NodePositioning } from './NodePositioning'
import type { NodePositioningReference } from './NodePositioningReference'

export class NodePositioningScaleAdapted {
  constructor(private readonly np: NodePositioning) { }

  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }
  private get reference(): NodePositioningReference { return this.np.reference }

  // #1231 — Mode « échelle adaptée » : au lieu de bouger les nœuds, on ajuste l'échelle
  // (valeur→px) pour que le flux de référence garde TOUJOURS la même épaisseur. Comme
  // l'épaisseur ∝ valeur / échelle, on garde `échelle / valeur_flux` constant : à chaque
  // datatag, échelle = échelle_ref × (valeur_flux_courante / valeur_flux_ref). On capture
  // l'échelle et la valeur du flux à l'entrée du mode. Transitoires.
  private _scale_adapted_ref_value: number | undefined = undefined

  private _scale_adapted_ref_scale: number | undefined = undefined

  /**
   * #1231 — Mode « échelle adaptée » : capture l'échelle courante et la valeur du flux de
   * référence. Sert de base au ratio appliqué ensuite (`applyAdaptedScale`). À l'entrée du
   * mode, valeur_courante == valeur_ref → échelle inchangée → pas de saut.
   */
  public captureScaleReference() {
    // Élément brut : on doit pouvoir capturer la valeur de référence même si l'élément est
    // momentanément masqué par un filtre vue (cf. referenceFluxRefValue).
    const ref = this.reference.rawReference
    const v = ref ? this.reference.referenceFluxRefValue() : undefined
    if (ref && v && v > 0) {
      // Valeur au datatag de référence (couple flux/datatag) ; échelle de base = échelle courante.
      this._scale_adapted_ref_value = v
      this._scale_adapted_ref_scale = this.drawingArea.scale
    } else {
      this._scale_adapted_ref_value = undefined
      this._scale_adapted_ref_scale = undefined
    }
  }

  /**
   * #369 — Couple capturé du mode « échelle adaptée » (échelle de BASE + valeur de l'élément de
   * référence), exposé pour la PERSISTANCE. Le mode étant désormais restitué à l'ouverture
   * (cf. `positionModeOnLoad`), ce couple doit l'être aussi : le `user_scale` écrit dans le
   * fichier est l'échelle ADAPTÉE au datatag courant (base × valeur_courante / valeur_réf), pas
   * l'échelle de base. Le laisser recapturer au chargement prendrait donc l'échelle adaptée pour
   * base et composerait le ratio une seconde fois au dessin suivant → le diagramme changerait de
   * taille juste après l'ouverture. undefined tant que rien n'a été capturé (rien à écrire).
   */
  public get scaleAdaptedReference(): { scale: number, value: number } | undefined {
    if (this._scale_adapted_ref_scale === undefined) return undefined
    if (this._scale_adapted_ref_value === undefined) return undefined
    return { scale: this._scale_adapted_ref_scale, value: this._scale_adapted_ref_value }
  }

  /**
   * #369 — Restaure le couple capturé lu dans le fichier (cf. `scaleAdaptedReference`). Valeurs
   * aberrantes ignorées : la capture paresseuse de `applyAdaptedScale` reprend alors la main
   * (comportement d'un fichier antérieur, qui ne porte pas ces clés).
   */
  public restoreScaleReference(scale: number, value: number) {
    if (!isFinite(scale) || scale <= 0) return
    if (!isFinite(value) || value <= 0) return
    this._scale_adapted_ref_scale = scale
    this._scale_adapted_ref_value = value
  }

  /**
   * #1231 — Mode « échelle adaptée » : ajuste l'échelle (valeur→px) du diagramme pour que le
   * flux de référence garde sa taille de référence à tous les datatags. Appelé en tête de
   * `drawElements` avant `_sankey.draw()`. No-op sans flux de référence ou sans capture.
   * Écrit directement `_scale` + le domaine de `_scaleValueToPx` (le setter `scale` redraw →
   * récursion ; on l'évite).
   */
  public applyAdaptedScale() {
    // En mode vue, l'élément de référence peut être masqué par le filtre → on prend l'élément brut
    // (sa valeur de réf reste le « gabarit » de taille). Hors vue, version visibilité-gated.
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this.reference.rawReference : this.reference.gatedReference
    if (!ref) return
    // Capture paresseuse (1er dessin / après chargement) : base = échelle + valeur courantes
    // → ratio 1 à cette frame, pas de saut.
    if (this._scale_adapted_ref_value === undefined || this._scale_adapted_ref_scale === undefined) {
      this.captureScaleReference()
      return
    }
    // En mode vue : v = valeur du CORRESPONDANT de la vue (enfant visible portant l'étiquette
    // sélectionnée). new_scale = ref_scale × correspondant / valeur_réf → le correspondant est
    // dessiné à la taille de référence (une vue plus petite dilate l'échelle pour normaliser le
    // correspondant). Hors vue : valeur courante de l'élément de référence (datatags).
    const v = view_active
      ? this.reference.referenceViewValue()
      : this.reference.referenceCurrentValue()
    if (v <= 0) return
    const new_scale = this._scale_adapted_ref_scale * v / this._scale_adapted_ref_value
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
    this._scale_adapted_ref_value = undefined
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

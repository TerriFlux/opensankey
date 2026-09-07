// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « surcharges d'échelle » extrait de Class_DrawingArea : deux règles recalculent
// l'échelle valeur→px à chaque frame, l'une pour qu'un flux de référence atteigne une épaisseur
// cible (référence par view tag), l'autre pour qu'aucun nœud ne dépasse un plafond de hauteur
// (#1231b).
//
// os#1383 — Côté ZONE DE DESSIN, elles n'écrivent plus `_scale` (l'échelle absolue de
// l'utilisateur) mais l'ÉCHELLE EFFECTIVE de la frame (`DrawingArea.setEffectiveScale`), remise à
// la base en tête de chaque dessin. Il n'y a donc plus rien à « restaurer à la frame suivante »,
// et plus de garde « sauf si une autre source a recalculé depuis » — cette garde voyait la
// surcharge de l'AUTRE plafond, l'adoptait comme base, et l'échelle adaptée d'une vue finissait
// dans `user_scale`. Le protocole porteur/restauration ne subsiste que pour l'échelle PROPRE d'un
// tag (sa#283), qui n'a pas d'équivalent « effectif » et reste écrite en place.
//
// Appelées depuis drawElements, dans cet ordre : applyAdaptedScale → applyViewTagScaleReference →
// applyMaximumNodeScale, avant le positionnement des nœuds (qui lit l'échelle courante). Chacune
// lit l'échelle effective laissée par la précédente (`da.scale`) et ne peut que la relever
// (sémantique de MAXIMUM : on ne grossit jamais le diagramme) — sauf le plafond de hauteur en mode
// « échelle adaptée » sans élément de référence, qui devient EXACT (cf. `applyMaximumNodeScale`).

import type { Class_DrawingArea } from './DrawingArea'
import type { Class_DataTag } from './Tag'
import { resolveScaleCarrierTag } from './ScaleResolution'

export class Class_ScaleOverrides {

  // sa#283 — Tag porteur surchargé par la référence d'épaisseur : `original` = échelle propre à
  // restaurer à la frame suivante. Seul vestige du protocole porteur (cf. en-tête).
  private _scale_ref_carrier?: { tag_id: string, original: number }

  /** Défait la surcharge d'épaisseur posée sur un TAG à la frame précédente, sans condition. */
  private _restoreScaleRefCarrier(da: Class_DrawingArea) {
    const c = this._scale_ref_carrier
    if (!c) return
    // sa#283 — porteur généralisé : l'échelle PROPRE du tag (own_scale ≡ scale pour un tag
    // d'unité ; échelle posée par ce module pour un tag ordinaire porteur).
    const tag = this._findDataTag(da, c.tag_id)
    if (tag) tag.own_scale = c.original
    this._scale_ref_carrier = undefined
  }

  /**
   * os#1383 — Une échelle propre de tag posée DÉLIBÉRÉMENT dans l'interface devient la nouvelle
   * base : on OUBLIE la surcharge sans la défaire, sinon la frame suivante restaurerait
   * par-dessus le choix de l'utilisateur. Le setter `scale` de la zone de dessin l'appelle aussi,
   * par symétrie — pour la zone de dessin elle-même il n'y a plus rien à oublier.
   */
  public invalidate() {
    this._scale_ref_carrier = undefined
  }

  // sa#283 — cherche un tag par id dans TOUS les groupes de dataTags (porteur généralisé :
  // tag d'unité comme tag ordinaire à échelle propre — ex. la céréale sélectionnée).
  private _findDataTag(da: Class_DrawingArea, tag_id: string): Class_DataTag | undefined {
    for (const tagg of da.sankey.data_taggs_list) {
      const t = tagg.tags_dict[tag_id]
      if (t) return t as Class_DataTag
    }
    return undefined
  }

  /**
   * Recalcule l'échelle pour que le flux désigné comme référence du view tag COURANT atteigne son
   * épaisseur cible (px). Touche uniquement l'échelle du porteur effectif du flux (son data tag
   * unitaire s'il en a un, sinon l'échelle effective de la DA), avec prise en compte de son
   * `local_link_scale`. Les autres flux et la légende suivent.
   *
   * No-op sans référence pour le view tag courant, et no-op si le flux est DÉJÀ plus fin que le
   * seuil (sémantique « maximum » : l'épaisseur cible est un plafond).
   */
  public applyViewTagScaleReference(da: Class_DrawingArea) {
    // 1. Un tag surchargé à la frame précédente reprend son échelle propre.
    this._restoreScaleRefCarrier(da)
    // 2. Résout la référence du view tag courant.
    const vt_id = da.sankey.current_scale_reference_viewtag_id
    if (!vt_id) return
    const ref = da.scale_reference_by_viewtag[vt_id]
    if (!ref || !(ref.thickness > 0)) return
    const link = da.sankey.links_dict[ref.link_id]
    if (!link) return
    const v = Math.abs(link.valueCurrent ?? 0)
    if (!(v > 0)) return
    const factor = link.shape_local_link_scale || 1
    // thickness = v / (carrier_scale × factor) × 100 (range [0,100]) → carrier_scale = v×100 / (T×factor)
    const new_scale = v * 100 / (ref.thickness * factor)
    if (!(isFinite(new_scale) && new_scale > 0)) return
    // 3. Sémantique « maximum » : l'épaisseur cible est un SEUIL. On ne recale QUE si, à
    // l'échelle courante, l'épaisseur du flux DÉPASSE ce seuil (sinon le flux est déjà
    // plus fin que le seuil → on ne touche à rien). Augmenter l'échelle réduit l'épaisseur,
    // donc « épaisseur > seuil » ⟺ « new_scale > échelle courante du porteur ».
    // sa#283 — porteur GÉNÉRALISÉ, résolu par LA MÊME règle que le rendu
    // (Link.scaleValueToPx → ScaleResolution) : tag d'unité de la valeur du flux, ou
    // unique tag de dataTag sélectionné à échelle propre (le groupe le plus tardif de
    // taggs_order gagne), sinon la zone de dessin. Le recalage d'épaisseur de référence
    // écrit donc dans le tag de la tranche sélectionnée quand elle porte une échelle
    // (ex. la céréale courante) — l'UI existante devient per-tranche sans nouveau code.
    const unit_tag = link.value?.unit_data_tag()
    const carrier_tag = resolveScaleCarrierTag(da.sankey, unit_tag)
    const current = carrier_tag !== undefined ? (carrier_tag.own_scale as number) : da.scale
    if (!(new_scale > current)) return
    // 4. Applique sur le porteur effectif du flux (cf. Link.scaleValueToPx).
    if (carrier_tag !== undefined) {
      this._scale_ref_carrier = { tag_id: carrier_tag.id, original: current }
      carrier_tag.own_scale = new_scale
    } else {
      da.setEffectiveScale(new_scale)
    }
  }

  /**
   * #1231b — Plafond de taille de nœud (`maximum_node`, px) appliqué par l'ÉCHELLE et non par un
   * clamp individuel. Si le nœud le plus HAUT (hauteur naturelle non clampée = max(stock, bande de
   * flux)) dépasse `maximum_node` à l'échelle courante, on réduit l'échelle (valeur→px) pour qu'il
   * y rentre exactement. Tout le diagramme suit la même échelle → aucun flux entrant/sortant ne
   * dépasse de son nœud, et les proportions relatives sont conservées.
   *
   * `exact` (os#1383) — mode « échelle adaptée » SANS élément de référence : le plafond devient
   * l'adaptation elle-même. Le nœud le plus haut est amené À `maximum_node`, dans les deux sens.
   * C'est ce que faisait CARTOFOB sans le dire : son fichier ne désigne aucun élément de
   * référence, l'adaptation n'y calcule donc rien, et « le stock remplit l'écran à chaque région »
   * venait de ce que le plafond mordait à chaque frame sur une base assez petite. Dès qu'une
   * bascule laissait une base plus grande, il ne mordait plus (stock à 619 px au lieu de 1585) ;
   * et une vue dont aucun nœud n'atteint le plafond (peuplier, 228 px) ne remplissait jamais.
   *
   * Sinon (mode absolu, ou adapté avec référence) : no-op si aucun nœud ne dépasse — on ne
   * grossit jamais le diagramme. Le clamp par-nœud de `getShapeHeightToUse` devient alors un
   * no-op (natural == max_node) → pas de troncature.
   */
  public applyMaximumNodeScale(da: Class_DrawingArea, exact: boolean = false) {
    const max_node = da.maximum_node
    if (!max_node || !(max_node > 0)) return
    if (exact) {
      // EN VALEURS, pas en pixels : la hauteur rendue est plancher-ée (hauteur minimale de nœud,
      // `minimum_flux`), et un facteur pris sur un plancher n'amènerait jamais un petit nœud au
      // plafond. px = valeur / échelle × 100 → l'échelle qui rend la plus grande valeur à
      // `max_node` px vaut valeur × 100 / max_node.
      const magnitude = da.nodePositioning.tallestNodeMagnitude()
      if (!(magnitude > 0)) return
      da.setEffectiveScale(magnitude * 100 / max_node)
      return
    }
    // Hauteur naturelle (non clampée) du nœud le plus haut, à l'échelle courante.
    let tallest = 0
    da.sankey.visible_nodes_list.forEach(n => {
      const h = n.getNaturalShapeHeight()
      if (h > tallest) tallest = h
    })
    if (!(tallest > max_node)) return
    // scaleValueToPx ∝ 1/scale : multiplier l'échelle par tallest/max_node (> 1) réduit les
    // px/valeur → le plus haut nœud rend exactement à max_node.
    const new_scale = da.scale * (tallest / max_node)
    if (!(isFinite(new_scale) && new_scale > 0)) return
    da.setEffectiveScale(new_scale)
  }

}

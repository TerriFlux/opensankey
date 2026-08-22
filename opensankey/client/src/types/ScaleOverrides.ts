// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « surcharges transitoires d'échelle » extrait de Class_DrawingArea : deux règles
// recalculent l'échelle valeur→px à chaque frame, l'une pour qu'un flux de référence atteigne une
// épaisseur cible (référence par view tag), l'autre pour qu'aucun nœud ne dépasse un plafond de
// hauteur (#1231b).
//
// Les deux partagent le même protocole, et c'est lui qui justifie de les tenir ensemble : la valeur
// naturelle du PORTEUR (data tag unitaire du flux, ou échelle de la DA) est capturée avant d'être
// surchargée, puis restaurée à la frame suivante — mais UNIQUEMENT si le porteur vaut encore ce
// qu'on y avait posé. S'il a changé entre-temps (mode « échelle adaptée », édition utilisateur), sa
// valeur courante EST la nouvelle base : on ne l'écrase pas, la surcharge s'applique par-dessus.
// Cette classe possède donc les deux « porteurs » (état transitoire d'une frame à l'autre).
//
// Les deux règles ont une sémantique de MAXIMUM : elles ne font rien si la contrainte est déjà
// respectée (on ne grossit jamais le diagramme). Appelées depuis drawElements, dans cet ordre :
// applyAdaptedScale → applyViewTagScaleReference → applyMaximumNodeScale, avant le positionnement
// des nœuds (qui lit l'échelle courante).

import type { Class_DrawingArea } from './DrawingArea'
import type { Class_DataTag } from './Tag'
import { resolveScaleCarrierTag } from './ScaleResolution'

export class Class_ScaleOverrides {

  // Porteur surchargé par la référence d'épaisseur : `original` = valeur naturelle à restaurer,
  // `applied` = valeur posée (sert à détecter qu'une autre source a recalculé depuis).
  private _scale_ref_carrier?: { tag_id?: string, original: number, applied: number }
  // Porteur surchargé par le plafond de hauteur de nœud, séparé du précédent (même logique).
  private _max_node_scale_carrier?: { original: number, applied: number }

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
   * unitaire s'il en a un, sinon l'échelle de la DA), avec prise en compte de son
   * `local_link_scale`. Les autres flux et la légende suivent.
   *
   * No-op sans référence pour le view tag courant, et no-op si le flux est DÉJÀ plus fin que le
   * seuil (sémantique « maximum » : l'épaisseur cible est un plafond).
   */
  public applyViewTagScaleReference(da: Class_DrawingArea) {
    // 1. Restaure le porteur surchargé à la frame précédente, sauf si une autre source l'a
    // recalculé depuis (cf. doc du module → sa valeur courante devient la base).
    if (this._scale_ref_carrier) {
      const c = this._scale_ref_carrier
      const tag = c.tag_id ? this._findDataTag(da, c.tag_id) : undefined
      // sa#283 — porteur généralisé : l'échelle PROPRE du tag (own_scale ≡ scale pour un
      // tag d'unité ; échelle posée par ce module pour un tag ordinaire porteur).
      const current = c.tag_id ? tag?.own_scale : da._scale
      if (current !== undefined && Math.abs(current - c.applied) < 1e-9) {
        if (c.tag_id) {
          if (tag) tag.own_scale = c.original
        } else {
          da._scale = c.original
          da._scaleValueToPx.domain([0, c.original])
        }
      }
      this._scale_ref_carrier = undefined
    }
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
    // l'échelle naturelle, l'épaisseur du flux DÉPASSE ce seuil (sinon le flux est déjà
    // plus fin que le seuil → on ne touche à rien). Augmenter l'échelle réduit l'épaisseur,
    // donc « épaisseur naturelle > seuil » ⟺ « new_scale > échelle naturelle du porteur ».
    // sa#283 — porteur GÉNÉRALISÉ, résolu par LA MÊME règle que le rendu
    // (Link.scaleValueToPx → ScaleResolution) : tag d'unité de la valeur du flux, ou
    // unique tag de dataTag sélectionné à échelle propre (le groupe le plus tardif de
    // taggs_order gagne), sinon la zone de dessin. Le recalage d'épaisseur de référence
    // écrit donc dans le tag de la tranche sélectionnée quand elle porte une échelle
    // (ex. la céréale courante) — l'UI existante devient per-tranche sans nouveau code.
    const unit_tag = link.value?.unit_data_tag()
    const carrier_tag = resolveScaleCarrierTag(da.sankey, unit_tag)
    const carrier_original = carrier_tag !== undefined ? (carrier_tag.own_scale as number) : da._scale
    if (!(new_scale > carrier_original)) return
    // 4. Applique sur le porteur effectif du flux (cf. Link.scaleValueToPx).
    if (carrier_tag !== undefined) {
      this._scale_ref_carrier = { tag_id: carrier_tag.id, original: carrier_original, applied: new_scale }
      carrier_tag.own_scale = new_scale
    } else {
      this._scale_ref_carrier = { original: da._scale, applied: new_scale }
      da._scale = new_scale
      da._scaleValueToPx.domain([0, new_scale])
    }
  }

  /**
   * #1231b — Plafond de taille de nœud (`maximum_node`, px) appliqué par l'ÉCHELLE et non par un
   * clamp individuel. Si le nœud le plus HAUT (hauteur naturelle non clampée = max(stock, bande de
   * flux)) dépasse `maximum_node` à l'échelle courante, on réduit l'échelle (valeur→px) pour qu'il
   * y rentre exactement. Tout le diagramme suit la même échelle → aucun flux entrant/sortant ne
   * dépasse de son nœud, et les proportions relatives sont conservées.
   *
   * No-op si aucun nœud ne dépasse. Le clamp par-nœud de `getShapeHeightToUse` devient alors un
   * no-op (natural == max_node) → pas de troncature.
   */
  public applyMaximumNodeScale(da: Class_DrawingArea) {
    // 1. Restaure l'échelle de base posée à la frame précédente, sauf si une autre source l'a
    // recalculée entre-temps (sa valeur courante devient alors la nouvelle base).
    if (this._max_node_scale_carrier) {
      const c = this._max_node_scale_carrier
      if (Math.abs(da._scale - c.applied) < 1e-9) {
        da._scale = c.original
        da._scaleValueToPx.domain([0, c.original])
      }
      this._max_node_scale_carrier = undefined
    }
    const max_node = da.maximum_node
    if (!max_node || !(max_node > 0)) return
    // 2. Hauteur naturelle (non clampée) du nœud le plus haut, à l'échelle courante.
    let tallest = 0
    da.sankey.visible_nodes_list.forEach(n => {
      const h = n.getNaturalShapeHeight()
      if (h > tallest) tallest = h
    })
    if (!(tallest > max_node)) return
    // 3. scaleValueToPx ∝ 1/scale : multiplier l'échelle par tallest/max_node (> 1) réduit les
    // px/valeur → le plus haut nœud rend exactement à max_node.
    const new_scale = da._scale * (tallest / max_node)
    if (!(isFinite(new_scale) && new_scale > 0)) return
    this._max_node_scale_carrier = { original: da._scale, applied: new_scale }
    da._scale = new_scale
    da._scaleValueToPx.domain([0, new_scale])
  }

}

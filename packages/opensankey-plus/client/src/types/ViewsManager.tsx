// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import type { Class_DrawingArea } from '@terriflux/opensankey/src/types/DrawingArea'
import type { Type_JSON } from '@terriflux/opensankey/src/types/Utils'

// Miroir de `default_main_sankey_id` (OpenSankey/Utils). Redéclaré en local pour garder
// ViewsManager PUR : un import runtime de la couche OS tire d3 (via Utils → d3Modules), ce
// que le harnais jest d'OSP ne transforme pas → le service ne serait plus testable en
// isolation (cf. hereditedAttrMigration.test, même parti pris). C'est un id RÉSERVÉ et
// persisté (présent tel quel dans tous les fichiers) : sa valeur est figée.
export const MASTER_VIEW_ID = 'sankey_maitre'

/**
 * Entrée d'une vue OSP telle que stockée dans `views_dict`. Une vue porte un snapshot
 * gzip de sa DA (`json`) plus le concept unifié vue ⊕ viewtag :
 *  - `tag_selection` : sélection de visibilité { [view_tagg_id]: selected_label_id } ;
 *  - `is_light` : vue « light » (pas d'override géométrie propre, réutilise le maître) ;
 *  - `generated_from_group_id` : id du groupe de view tags dont la vue est auto-générée.
 */
export type Type_ViewEntry = {
  name: string
  json: Uint8Array
  tag_selection?: { [view_tagg_id: string]: string }
  is_light?: boolean
  generated_from_group_id?: string
}

/**
 * Surface minimale d'`ApplicationDataOSP` dont `ViewsManager` a besoin. La déclarer en
 * interface (plutôt que dépendre de la classe entière) rend le service testable avec un
 * mock léger : pas besoin de construire une `Class_ApplicationDataOSP` réelle (fetch de
 * préférences, DOM…) pour couvrir la logique de résolution de vues.
 */
export interface ViewsManagerHost {
  readonly views_dict: { [id: string]: Type_ViewEntry }
  readonly master_view_name: string
  readonly has_views: boolean
  readonly master_drawing_area: Class_DrawingArea | undefined
  readonly drawing_area: Class_DrawingArea
}

/**
 * Service de gestion des vues d'`ApplicationDataOSP` (#244). Extrait la logique de vues
 * de la classe (qui mélangeait vues / trial / préférences / clavier / persistance) pour
 * la rendre cohésive et testable. Première tranche : la résolution de vues (pure, à fort
 * branchement) + la lecture des champs unifiés. Le service lit l'état vivant via l'hôte
 * (`ViewsManagerHost`) ; les tranches suivantes migreront l'état et le switch de vue.
 */
export class ViewsManager {
  constructor(private readonly host: ViewsManagerHost) { }

  /**
   * Résout une valeur de sélection (nom OU id d'une vue) vers un id de vue. Fusion vue ⊕
   * viewtag : une vue se sélectionne par identité, indifféremment de son type (light/heavy),
   * comme le sélecteur de vue de la topbar. Ordre : id exact dans `views`, puis nom de vue,
   * puis maître (id réservé `MASTER_VIEW_ID` ou son libellé `master_view_name`).
   * `null` si rien ne correspond.
   */
  public resolveViewIdFromSelection(selection: string): string | null {
    if (selection === MASTER_VIEW_ID) return MASTER_VIEW_ID
    const views = this.host.views_dict
    if (views[selection]) return selection // id exact
    for (const [vid, v] of Object.entries(views)) {
      if (v.name === selection) return vid // par nom de vue
    }
    // Le maître n'est pas une entrée de views : match sur son libellé éditable.
    if (this.host.master_view_name && selection === this.host.master_view_name) return MASTER_VIEW_ID
    return null
  }

  /**
   * Résout un `view_tag_selection` de publication `{ groupe : tag }` (id OU nom) vers l'id
   * d'une VRAIE vue (heavy) si l'un des couples (groupe, tag) en désigne une. Deux stratégies :
   *   1) id déterministe des vues générées/promues depuis un groupe de view tags : `vt__<g>__<t>`.
   *   2) fallback : n'importe quelle vue heavy dont la `tag_selection` contient (group.id → tag.id).
   * Ne renvoie qu'une vue non-light (une vue light se comporte déjà comme un simple filtre
   * viewtag, géré par le chemin de base). `null` si aucune vue heavy ne correspond.
   */
  public resolveHeavyViewIdFromViewTagSelection(selection: Record<string, string>): string | null {
    if (!this.host.has_views) return null
    const views = this.host.views_dict
    const base_sankey = (this.host.master_drawing_area ?? this.host.drawing_area).sankey
    for (const [group_key, tag_key] of Object.entries(selection)) {
      const group = base_sankey.view_taggs_list.find(g => g.id === group_key || g.name === group_key)
      if (!group) continue
      const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
      if (!tag) continue
      // 1) id déterministe (migration/promotion depuis un groupe de view tags)
      const gen_id = `vt__${group.id}__${tag.id}`
      if (views[gen_id] && !views[gen_id].is_light) return gen_id
      // 2) fallback : vue heavy dont la sélection de visibilité désigne ce couple
      for (const [vid, v] of Object.entries(views)) {
        if (v.is_light) continue
        if (v.tag_selection && v.tag_selection[group.id] === tag.id) return vid
      }
    }
    return null
  }

  /**
   * Lit les champs du concept unifié (tag_selection / is_light / generated_from_group_id)
   * depuis le JSON d'une vue et les pose sur l'entrée `views` correspondante.
   */
  public parseViewExtraFields(view_id: string, view_json: Type_JSON) {
    const entry = this.host.views_dict[view_id]
    if (!entry) return
    const ts = view_json['tag_selection']
    if (ts && typeof ts === 'object' && !Array.isArray(ts)) {
      entry.tag_selection = ts as { [view_tagg_id: string]: string }
    }
    if (view_json['is_light']) entry.is_light = true
    const gfg = view_json['generated_from_group_id']
    if (typeof gfg === 'string') entry.generated_from_group_id = gfg
  }
}

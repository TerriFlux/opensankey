// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import { default_main_sankey_id } from './Utils'
import type { Class_DrawingArea } from './DrawingArea'
import type { Type_JSON } from './Utils'

// Id réservé du Sankey maître. Aliasé sur `default_main_sankey_id` (source unique OS) :
// c'est un id RÉSERVÉ et persisté (présent tel quel dans tous les fichiers), sa valeur est figée.
export const MASTER_VIEW_ID = default_main_sankey_id

/**
 * Entrée d'une vue OSP telle que stockée dans `views_dict`. Une vue porte un snapshot
 * gzip de sa DA (`json`) plus le concept unifié vue ⊕ viewtag :
 *  - `tag_selection` : sélection de visibilité { [view_tagg_id]: selected_label_id } ;
 *  - `is_light` : vue « light » (pas d'override géométrie propre, réutilise le maître) ;
 *  - `generated_from_group_id` : id du groupe de view tags dont la vue est auto-générée ;
 *  - `labels` : sa#396 — LABELS DE VUES, étiquettes libres posées par l'auteur pour
 *    SÉLECTIONNER des vues (publication, constructeur de sites). À ne JAMAIS confondre
 *    avec les view tags (`viewTags` / tag_selection ci-dessus), qui sont la dimension de
 *    GÉNÉRATION des vues par combinaison : un label n'a aucun effet sur la génération.
 */
export type Type_ViewEntry = {
  name: string
  json: Uint8Array
  tag_selection?: { [view_tagg_id: string]: string }
  is_light?: boolean
  generated_from_group_id?: string
  labels?: string[]
}

/**
 * Surface minimale (état de vues, en lecture) dont dépend la logique pure. Une interface
 * étroite plutôt que la classe `ApplicationDataOSP` entière : le service est ainsi testable
 * avec un mock léger, sans construire une app réelle ni tirer d3/chakra.
 */
export interface ViewsQueryHost {
  readonly views_dict: { [id: string]: Type_ViewEntry }
  // Ordre des vues (le maître n'y figure pas). Renvoyé par référence : les méthodes d'ordre
  // (push/move) mutent ce tableau en place.
  readonly views_order: string[]
  readonly current_view_id: string
  readonly master_view_name: string
  readonly show_master_in_views: boolean
  readonly master_drawing_area: Class_DrawingArea | undefined
  readonly drawing_area: Class_DrawingArea
  // sa#397 — label de vue imposé par la page publiée (window.sankey.view_label) : restreint
  // l'ordre de navigation aux vues portant ce label. Optionnel (null/absent = pas de filtre) :
  // seul le viewer publié le pose, l'éditeur n'est jamais filtré.
  readonly publish_view_label_filter?: string | null
}

/**
 * Logique PURE de vues (#244) : résolution d'une sélection vers un id de vue, lecture des
 * champs unifiés, requêtes de navigation et manipulation de l'ordre. Aucun effet de bord sur
 * la DA, aucune dépendance runtime OS → testable en isolation. `ViewsManager` la compose et
 * y ajoute le cluster switch/persistance (qui, lui, opère la DA).
 */
export class ViewsQuery {
  constructor(protected readonly host: ViewsQueryHost) { }

  // --- Résolution -------------------------------------------------------------------------

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
   * Ne renvoie qu'une vue non-light. `null` si aucune vue heavy ne correspond.
   */
  public resolveHeavyViewIdFromViewTagSelection(selection: Record<string, string>): string | null {
    if (!this.has_views) return null
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
    // sa#396 — labels de vues : lus si présents (tableau de chaînes non vides, dédoublonné).
    // Clé `view_labels`, PAS `labels` : au même niveau, `labels` est déjà la clé des zones de
    // texte du diagramme de la vue (DrawingArea) — la première version d'sa#396 l'écrasait à
    // chaque sauvegarde. Un fichier sans la clé passe ici sans bruit (entry.labels reste undefined).
    const labels = view_json['view_labels']
    if (Array.isArray(labels)) {
      const cleaned = [...new Set(
        labels.filter((l): l is string => typeof l === 'string' && l.trim() !== '')
      )]
      if (cleaned.length > 0) entry.labels = cleaned
    }
  }

  // --- Labels de vues (sa#396/397) ---------------------------------------------------------
  // Étiquettes libres de SÉLECTION posées sur les vues — rien à voir avec les view tags
  // (dimension de génération), qui ne sont pas touchés.

  /** Tous les labels utilisés dans le document (ordre de première apparition, dédoublonnés). */
  public get all_view_labels(): string[] {
    const seen = new Set<string>()
    this.host.views_order.forEach(id => {
      (this.host.views_dict[id]?.labels ?? []).forEach(l => seen.add(l))
    })
    return [...seen]
  }

  /** Ids des vues portant ce label, dans l'ordre des vues. Vide si aucun. */
  public viewIdsWithLabel(label: string): string[] {
    return this.host.views_order.filter(id =>
      (this.host.views_dict[id]?.labels ?? []).includes(label)
    )
  }

  // --- Requêtes / navigation --------------------------------------------------------------

  /** Multi-vues actif : au moins une vue est enregistrée (le maître ne compte pas). */
  public get has_views(): boolean {
    return this.host.views_order.length > 0
  }

  /**
   * Vue courante = maître (identité LOGIQUE, pas l'id du Sankey de la DA : une vue light
   * réutilise la DA maître mais n'EST pas le maître).
   */
  public get is_view_master(): boolean {
    return this.host.current_view_id === MASTER_VIEW_ID
  }

  /** Vue courante = vue light (visibilité seule, géométrie héritée du maître). */
  public get is_current_view_light(): boolean {
    return !!this.host.views_dict[this.host.current_view_id]?.is_light
  }

  /**
   * Ordre de navigation (flèches Préc./Suiv. + sélecteur) : le maître y figure en tête
   * UNIQUEMENT si show_master_in_views est actif (sinon atteignable via setCurrentViewToMaster).
   * sa#397 — si la page publiée impose un label de vue (publish_view_label_filter), l'ordre est
   * RESTREINT aux vues portant ce label (le maître, qui n'est pas une vue labellisable, est
   * exclu). Garde-fou : un filtre qui ne matche plus rien est ignoré (jamais de sélecteur vide).
   */
  public get views_navigation_order(): string[] {
    const label = this.host.publish_view_label_filter
    if (label) {
      const filtered = this.viewIdsWithLabel(label)
      if (filtered.length > 0) return filtered
    }
    return this.host.show_master_in_views
      ? [MASTER_VIEW_ID, ...this.host.views_order]
      : this.host.views_order
  }

  public get has_master_sankey(): boolean {
    return this.has_views && this.host.master_drawing_area != undefined
  }

  public get master_view(): Class_DrawingArea | undefined {
    if (this.has_views)
      return this.has_master_sankey ? this.host.master_drawing_area : undefined
    return this.host.drawing_area
  }

  public get has_view_before(): boolean {
    return this.has_views && this.views_navigation_order.indexOf(this.host.current_view_id) > 0
  }

  public get has_view_after(): boolean {
    if (!this.has_views) return false
    const order = this.views_navigation_order
    // indexOf === -1 (courant hors liste, ex. maître non affiché) => Suiv. va vers la 1re vue.
    return order.indexOf(this.host.current_view_id) < (order.length - 1)
  }

  /** Sources de mise en page disponibles (maître + vues nommées), pour les sélecteurs UI. */
  public get layout_view_sources(): Array<{ id: string, name: string }> {
    if (!this.has_views) return []
    const sources: Array<{ id: string, name: string }> = []
    if (this.host.master_drawing_area) {
      sources.push({ id: MASTER_VIEW_ID, name: 'Vue principale' })
    }
    this.host.views_order.forEach(id => {
      if (id !== MASTER_VIEW_ID && this.host.views_dict[id]) {
        sources.push({ id, name: this.host.views_dict[id].name })
      }
    })
    return sources
  }

  // --- Ordre des vues (mutation en place du tableau `views_order`) -------------------------

  /**
   * Pousse (ou re-pousse) un id en fin d'ordre. Dédoublonne d'abord : un id déjà présent
   * est retiré puis remis en queue (les doublons cassent la navigation).
   */
  public pushViewIdInViewOrder(id: string) {
    const order = this.host.views_order
    if (order.includes(id)) {
      order.splice(order.indexOf(id), 1)
    }
    order.push(id)
  }

  /** Remonte une vue d'un cran dans l'ordre (le maître, position 0, est immuable). */
  public moveViewUpInOrder(id: string) {
    if (id === MASTER_VIEW_ID) return // le maître ne bouge pas dans l'ordre
    const order = this.host.views_order
    const idx = order.indexOf(id)
    // > 1 : on ne peut pas remonter une vue avant le maître (idx 0).
    if (idx > 1) {
      order.splice(idx, 1)
      order.splice(idx - 1, 0, id)
    }
  }

  /** Descend une vue d'un cran dans l'ordre. */
  public moveViewDownInOrder(id: string) {
    if (id === MASTER_VIEW_ID) return // le maître ne bouge pas dans l'ordre
    const order = this.host.views_order
    const idx = order.indexOf(id)
    if (idx < order.length - 1) {
      order.splice(idx, 1)
      order.splice(idx + 1, 0, id)
    }
  }
}

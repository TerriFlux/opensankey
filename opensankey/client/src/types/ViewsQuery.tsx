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
  // os#1357 — depuis l'annuaire, ce sont des IDENTIFIANTS de label, plus des noms. Un
  // fichier antérieur porte des noms : ils sont migrés à la lecture (cf.
  // `parseViewExtraFields`), de façon transparente.
  labels?: string[]
  // os#1358 — Texte libre de l'auteur sur la vue. Page, section et site en ont un
  // (`WorkbookNode.doc`, `Workbook.doc`) ; la vue, qui est pourtant l'unité publiable,
  // n'en avait pas. Candidat naturel au texte d'accompagnement d'une page publiée.
  description?: string
  // os#1355 — LA REPRÉSENTATION de la vue : l'état de la grande zone figé avec elle.
  // os#1482 — HÉRITAGE, lu seulement : ce champ n'est plus ni posé ni écrit. Une disposition
  // figée est une TABLEAU DE BORD (Dashboards.ts, clé racine `dashboards`) ; `view_main_zone` d'un fichier
  // antérieur est lue ici puis MIGRÉE en tableau de bord par `migrateViewMainZonesToDashboards`, qui vide le
  // champ. Un document secondaire (feuille vivante) peut le garder rempli : personne ne le lit.
  main_zone?: Type_JSON
  /**
   * sa#566 — LE VOLET DE LA VUE : une vue et un volet sont le même objet, et une vue enregistrée
   * garde donc la nature, les réglages, la place et la géométrie du volet qu'elle est — sous la
   * forme d'une entrée de `main_zone.occupants` (cf. `Class_MenuConfig.mainZoneWindowToJSON`).
   *
   * À NE PAS CONFONDRE avec `main_zone` juste au-dessus : celle-là figeait TOUTE la grande zone
   * avec la vue (une disposition, devenue un tableau de bord), celui-ci ne porte qu'UN volet —
   * la vue elle-même. Rappeler la vue le pose à côté des autres ; rien d'autre ne bouge.
   *
   * Absent : la vue est le diagramme de la fenêtre principale, ce qu'étaient toutes les vues avant
   * sa#566 — d'où un fichier inchangé pour qui n'enregistre aucun volet.
   */
  window?: Type_JSON
  /**
   * sa#566 — UNE VUE QU'ON A CESSÉ D'ENREGISTRER PENDANT QU'ON LA REGARDAIT.
   *
   * « Ne plus enregistrer » ne doit rien changer à l'écran. Or supprimer la vue COURANTE ramène au
   * maître, donc repeint le diagramme. L'entrée reste donc en mémoire, le temps qu'on la regarde,
   * mais elle quitte l'ordre des vues — ni sélecteur, ni navigation, ni fichier — et elle est
   * oubliée dès qu'on bascule ailleurs (cf. `ApplicationData.applySavedViewWindowsOnSwitch`).
   * C'est littéralement un volet éphémère. JAMAIS écrit.
   */
  ephemeral?: boolean
}

/**
 * os#1357 — Définition d'un label de vue, dans l'annuaire de la racine du fichier.
 *
 * Un label était une chaîne libre, recopiée dans chaque vue : le renommer cassait
 * silencieusement toute publication qui le ciblait. Il porte désormais un identifiant
 * stable ; le nom devient un simple libellé, modifiable sans rien casser.
 *
 * `group` prépare le « public visé » (grand public / experts) : deux labels du même
 * groupe sont deux valeurs d'une même question, ce qu'une liste plate ne pouvait pas dire.
 */
export type Type_ViewLabelDef = {
  id: string
  name: string
  group?: string
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
  // os#1357 — Annuaire des labels, ordonné (l'ordre du tableau EST l'ordre d'affichage,
  // sans second registre qui pourrait le contredire). Muté en place à la lecture, lors de
  // la migration des fichiers antérieurs.
  readonly view_label_defs: Type_ViewLabelDef[]
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
      // os#1357 — Migration transparente : une entrée qui n'est pas un id connu de
      // l'annuaire est un NOM, écrit par une version antérieure. On lui donne (ou lui
      // retrouve) un identifiant, et la vue référence désormais celui-ci. Un fichier
      // ancien se relit donc sans intervention, et se réenregistre à la forme nouvelle.
      const ids = [...new Set(cleaned.map(l => this.labelIdFromIdOrName(l, true)))]
      if (ids.length > 0) entry.labels = ids
    }
    // os#1358 — description de la vue. Clé `view_description`, PAS `description` : au même
    // niveau, la racine du JSON d'une vue est celle d'une DrawingArea, et lui prendre un nom
    // générique est exactement ce qui avait détruit les zones de texte avec `labels`.
    const desc = view_json['view_description']
    if (typeof desc === 'string' && desc !== '') entry.description = desc
    // os#1355 — disposition de la grande zone figée avec la vue. Clé `view_main_zone`, PAS
    // `main_zone` : cette dernière est une clé RACINE du fichier, donc dans la base du delta —
    // chaque vue décodée en hérite, et la lire ici prendrait l'état du fichier pour celui de
    // la vue. Même piège que `labels` et `description`, même parade.
    const mz = view_json['view_main_zone']
    if (mz && typeof mz === 'object' && !Array.isArray(mz)) entry.main_zone = mz as Type_JSON
    // sa#566 — le volet de la vue. Clé `view_window`, PAS `window` : même parade que `view_main_zone`,
    // la racine du JSON d'une vue est celle d'une DrawingArea et ne doit pas se faire prendre un nom.
    const win = view_json['view_window']
    if (win && typeof win === 'object' && !Array.isArray(win)) entry.window = win as Type_JSON
  }

  // --- Annuaire des labels (os#1357) -------------------------------------------------------

  /** Définition d'un label par son identifiant. */
  public labelDefById(id: string): Type_ViewLabelDef | undefined {
    return this.host.view_label_defs.find(d => d.id === id)
  }

  /**
   * Résout un id OU un nom vers un identifiant de label.
   *
   * Accepter les deux n'est pas une commodité : les pages DÉJÀ publiées portent le nom en
   * clair (`window.sankey.view_label`), et le classeur le stocke tel quel côté serveur.
   * Résoudre par nom est ce qui permet de passer aux identifiants sans casser l'existant.
   *
   * @param create Crée la définition si le nom est inconnu — réservé à la lecture d'un
   *               fichier, jamais à la résolution d'une requête d'affichage.
   */
  public labelIdFromIdOrName(id_or_name: string, create: boolean = false): string {
    const defs = this.host.view_label_defs
    const by_id = defs.find(d => d.id === id_or_name)
    if (by_id) return by_id.id
    const by_name = defs.find(d => d.name === id_or_name)
    if (by_name) return by_name.id
    if (!create) return id_or_name
    // Identifiant dérivé du nom, donc lisible dans le fichier et dans une URL — mais
    // dédoublonné : deux labels peuvent porter le même nom sans se confondre.
    const base = 'vl_' + id_or_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    let candidate = base || 'vl'
    let n = 2
    while (defs.some(d => d.id === candidate)) { candidate = `${base}_${n}`; n += 1 }
    defs.push({ id: candidate, name: id_or_name })
    return candidate
  }

  /** Nom affichable d'un label, par son id. Repli sur l'id si l'annuaire l'ignore. */
  public labelNameOf(id: string): string {
    return this.labelDefById(id)?.name ?? id
  }

  /**
   * Renomme un label. C'est le geste que l'annuaire rend sûr : le nom change, l'identifiant
   * ne bouge pas, donc les vues qui le portent et les pages publiées qui le ciblent par id
   * suivent sans rien casser.
   *
   * Deux refus : un nom vide, et un nom déjà porté par un AUTRE label — deux définitions
   * homonymes rendraient la résolution par nom (celle des pages anciennes) ambiguë.
   * Renvoie `false` sans rien changer dans ces cas.
   */
  public renameViewLabel(id: string, raw_name: string): boolean {
    const name = raw_name.trim()
    if (name === '') return false
    const def = this.labelDefById(id)
    if (!def) return false
    if (def.name === name) return true
    if (this.host.view_label_defs.some(d => d.id !== id && d.name === name)) return false
    def.name = name
    return true
  }

  /**
   * Range un label dans un groupe, ou l'en sort (groupe vide).
   *
   * Le groupe est une DIMENSION de classement, pas une décoration : « Public visé » avec
   * « Grand public » et « Experts » dit qu'un lecteur choisit UNE valeur parmi celles du
   * groupe, là où deux labels sans groupe sont deux étiquettes sans rapport. C'est ce qui
   * distingue un annuaire d'une liste de mots-clés.
   */
  public setViewLabelGroup(id: string, raw_group: string): boolean {
    const def = this.labelDefById(id)
    if (!def) return false
    const group = raw_group.trim()
    if (group === '') delete def.group
    else def.group = group
    return true
  }

  /**
   * Retire une définition de l'annuaire — refusé tant qu'une vue la porte.
   *
   * Sans ce refus, la vue garderait un identifiant que plus rien ne nomme : l'étiquette
   * retomberait sur l'id brut, illisible. On ne supprime donc que ce que plus personne
   * n'utilise ; retirer le label des vues reste le geste préalable.
   */
  public deleteViewLabel(id: string): boolean {
    const defs = this.host.view_label_defs
    const idx = defs.findIndex(d => d.id === id)
    if (idx < 0) return false
    if (this.viewIdsWithLabel(id).length > 0) return false
    defs.splice(idx, 1)
    return true
  }

  /** Groupes déclarés dans l'annuaire, dédoublonnés, dans l'ordre où ils apparaissent. */
  public get view_label_groups(): string[] {
    const seen = new Set<string>()
    this.host.view_label_defs.forEach(d => { if (d.group) seen.add(d.group) })
    return [...seen]
  }

  /** Labels d'un groupe donné — les valeurs possibles de cette dimension. */
  public labelDefsInGroup(group: string): Type_ViewLabelDef[] {
    return this.host.view_label_defs.filter(d => (d.group ?? '') === group)
  }

  // --- Labels de vues (sa#396/397) ---------------------------------------------------------
  // Étiquettes libres de SÉLECTION posées sur les vues — rien à voir avec les view tags
  // (dimension de génération), qui ne sont pas touchés.

  /**
   * Tous les labels utilisés dans le document, **par leur NOM** (dédoublonnés).
   *
   * Renvoie des noms et non des identifiants : ses appelants sont des surfaces d'affichage
   * et de publication (liste de suggestions, sélecteur de page, constructeur de site) qui
   * manipulent du texte lisible. L'annuaire reste interne.
   */
  public get all_view_labels(): string[] {
    const seen = new Set<string>()
    this.host.views_order.forEach(id => {
      (this.host.views_dict[id]?.labels ?? []).forEach(l => seen.add(this.labelNameOf(l)))
    })
    return [...seen]
  }

  /** Les labels utilisés, en définitions complètes — pour qui a besoin du groupe ou de l'id. */
  public get used_view_label_defs(): Type_ViewLabelDef[] {
    const seen = new Set<string>()
    this.host.views_order.forEach(id => {
      (this.host.views_dict[id]?.labels ?? []).forEach(l => seen.add(l))
    })
    return [...seen].map(id => this.labelDefById(id) ?? { id, name: id })
  }

  /**
   * Ids des vues portant ce label, dans l'ordre des vues. Vide si aucun.
   *
   * Accepte un identifiant OU un nom : une page publiée avant l'annuaire cible le label par
   * son nom, et doit continuer de fonctionner sans être republiée.
   */
  public viewIdsWithLabel(label: string): string[] {
    const label_id = this.labelIdFromIdOrName(label)
    return this.host.views_order.filter(id =>
      (this.host.views_dict[id]?.labels ?? []).includes(label_id)
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

// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import pako from 'pako'
import { compressJSONToGzip } from '@terriflux/opensankey/src/Persistence/UniversalJSONCompression'
import { getBooleanFromJSON, getJSONOrUndefinedFromJSON, getStringFromJSON, makeId } from '@terriflux/opensankey/src/types/Utils'
import { updateFrom } from '@terriflux/opensankey/src/Algorithms/UpdateFrom'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from './DrawingAreaOSP'
import { migrateHereditedAttr, Type_ViewHereditedJSON } from './hereditedAttrMigration'
import { convert_data_plus_legacy } from '../components/UtilsOSP'
import { ViewsQuery, MASTER_VIEW_ID } from './ViewsQuery'
import type { Class_DrawingArea } from '@terriflux/opensankey/src/types/DrawingArea'
import type { Type_JSON } from '@terriflux/opensankey/src/types/Utils'
import type { Class_ApplicationDataOSP } from './ApplicationDataOSP'

// Ré-exports : ApplicationDataOSP (et le reste d'OSP) importent ces symboles depuis
// ViewsManager historiquement ; la logique pure vit désormais dans ViewsQuery.
export { MASTER_VIEW_ID } from './ViewsQuery'
export type { Type_ViewEntry } from './ViewsQuery'

/**
 * Service de gestion des vues d'`ApplicationDataOSP` (#244). Extrait la logique de vues de la
 * classe (qui mélangeait vues / trial / préférences / clavier / persistance). Compose
 * `ViewsQuery` (logique PURE : résolution, navigation, ordre — testée en isolation) et y
 * ajoute le cluster switch/persistance, qui opère la DA via l'hôte (`replaceDrawingArea`,
 * `createNewDrawingArea`, `resetHistory`, menus). L'ÉTAT des vues vit encore sur
 * `ApplicationDataOSP` (accédé via l'hôte) — prochaine étape éventuelle de l'extraction.
 */
export class ViewsManager {
  private readonly query: ViewsQuery

  constructor(private readonly host: Class_ApplicationDataOSP) {
    this.query = new ViewsQuery(host)
  }

  // --- Délégation de la logique pure (ViewsQuery) -----------------------------------------

  public resolveViewIdFromSelection(selection: string): string | null { return this.query.resolveViewIdFromSelection(selection) }
  public resolveHeavyViewIdFromViewTagSelection(selection: Record<string, string>): string | null { return this.query.resolveHeavyViewIdFromViewTagSelection(selection) }
  public parseViewExtraFields(view_id: string, view_json: Type_JSON) { this.query.parseViewExtraFields(view_id, view_json) }

  public get has_views(): boolean { return this.query.has_views }
  public get is_view_master(): boolean { return this.query.is_view_master }
  public get is_current_view_light(): boolean { return this.query.is_current_view_light }
  public get views_navigation_order(): string[] { return this.query.views_navigation_order }
  public get has_master_sankey(): boolean { return this.query.has_master_sankey }
  public get master_view(): Class_DrawingArea | undefined { return this.query.master_view }
  public get has_view_before(): boolean { return this.query.has_view_before }
  public get has_view_after(): boolean { return this.query.has_view_after }
  public get layout_view_sources(): Array<{ id: string, name: string }> { return this.query.layout_view_sources }

  public pushViewIdInViewOrder(id: string) { this.query.pushViewIdInViewOrder(id) }
  public moveViewUpInOrder(id: string) { this.query.moveViewUpInOrder(id) }
  public moveViewDownInOrder(id: string) { this.query.moveViewDownInOrder(id) }

  // ========================================================================================
  // CHARGEMENT / EXTRACTION DE VUES (persistance). Opèrent la DA via l'hôte.
  // ========================================================================================

  /**
   * Construit une DA à partir du JSON gzip d'une vue, SANS toucher l'état vivant (ni la DA
   * courante ni son rendu). Utilisé par le switch de vue (`extractViewFromJSON`, qui bascule
   * ensuite dessus) et par `_toJSON` en mode `save_only_visible_elements` (qui la sérialise
   * puis la jette). C'est la séparation qui supprime l'effet de bord de `_toJSON` (#244).
   */
  public buildDrawingAreaFromViewJSON(json_object: Uint8Array, view_id: string) {
    const drawing_area_view = this.host.createNewDrawingArea(view_id)
    drawing_area_view.bypass_redraws = true
    const decompressed_string = pako.inflate(new Uint8Array(json_object), { to: 'string' })
    DrawingAreaPersistenceOSP.fromJSON(drawing_area_view, JSON.parse(decompressed_string))
    // Le chemin de bascule/extraction de vue ne repasse PAS par _afterFromJSON (contrairement
    // à l'ouverture du fichier). Or les nœuds Import/Export d'échange sont TRANSITOIRES : non
    // sérialisés, ils sont régénérés à chaque chargement par splitTrade(). Sans ce split, un
    // simple arrangeTrade n'a rien à placer → les flux d'échange s'affichent sans leurs nœuds
    // Import/Export scindés (bug : ils disparaissent au retour sur une vue heavy). afterFromJSON
    // scinde (idempotent : un nœud d'échange déjà scindé n'a plus de lien) puis arrangeTrade.
    drawing_area_view.afterFromJSON()
    return drawing_area_view
  }

  /** Reconstruit la DA d'une vue heavy depuis son snapshot et bascule la DA courante dessus. */
  public extractViewFromJSON(json_object: Uint8Array, view_id: string) {
    const drawing_area_view = this.buildDrawingAreaFromViewJSON(json_object, view_id)
    this.host.replaceDrawingArea(drawing_area_view)
  }

  /**
   * Retourne une DA temporaire reconstruite depuis le snapshot d'une vue (source de mise en
   * page), SANS basculer la DA courante. `master` => la DA maître vivante.
   */
  public getDrawingAreaFromViewId(id: string): Class_DrawingArea | undefined {
    if (id === MASTER_VIEW_ID) return this.host.master_drawing_area
    if (!(id in this.host.views_dict)) return undefined
    const tmp_DA = this.host.createNewDrawingArea('__tmp_layout_source__')
    tmp_DA.bypass_redraws = true
    const decompressed_string = pako.inflate(new Uint8Array(this.host.views_dict[id].json), { to: 'string' })
    DrawingAreaPersistenceOSP.fromJSON(tmp_DA, JSON.parse(decompressed_string))
    return tmp_DA
  }

  private deleteCurrentOriginalView() {
    if (this.host.original_current_view !== undefined) {
      this.host.original_current_view.delete()
      this.host.original_current_view = undefined
    }
  }

  /** Charge les vues d'un fichier (clé `views`) et rouvre sur la vue active sauvegardée. */
  public viewsFromJSON(json_object: Type_JSON) {
    const views_json = getJSONOrUndefinedFromJSON(json_object, 'views')
    if (!views_json) {
      return
    }
    this.host.master_drawing_area = this.host.drawing_area
    this.host.drawing_area.sankey.setInvisible()
    this.host.drawing_area.purgeSelection()
    this.host.drawing_area.unDraw()

    // Option « maître dans la liste des vues » + libellé éditable (rétro-compat : défauts si absents).
    this.host.show_master_in_views = getBooleanFromJSON(json_object, 'show_master_in_views', false)
    this.host.master_view_name = getStringFromJSON(json_object, 'master_view_name', '')

    Object.entries(views_json)
      .forEach(([view_id, view_json]) => {
        this.pushViewIdInViewOrder(view_id)
        if (view_id == MASTER_VIEW_ID) return
        this.host.views_dict[view_id] = {
          name: (view_json as Type_JSON)['name'] as string,
          'json': compressJSONToGzip(view_json as Type_JSON) as Uint8Array
        }
        this.parseViewExtraFields(view_id, view_json as Type_JSON)
        this.host.heredited_attr[view_id] = migrateHereditedAttr(
          view_json as Type_ViewHereditedJSON,
          MASTER_VIEW_ID
        )
      })
    let active_view_id = getStringFromJSON(json_object, 'current_view', MASTER_VIEW_ID)
    if (this.host.is_static && active_view_id == MASTER_VIEW_ID) active_view_id = Object.keys(views_json)[0]
    // current_view peut pointer vers une vue absente (vieux fichier, vue supprimée) => master.
    if (active_view_id == MASTER_VIEW_ID || !this.host.views_dict[active_view_id]) {
      this.host.drawing_area.sankey.setVisible()
      return
    }
    // Rouvre le fichier sur la vue active sauvegardée. Vue light => pas de rebuild (réutilise
    // la DA maître) ; vue heavy => extraction du snapshot. Puis pose la sélection de visibilité.
    this.host.current_view_id = active_view_id
    if (this.host.views_dict[active_view_id].is_light) {
      this.host.drawing_area.sankey.setVisible()
    } else {
      this.extractViewFromJSON(this.host.views_dict[active_view_id].json, active_view_id)
    }
    this.applyViewTagSelection(this.host.views_dict[active_view_id].tag_selection)
    this.host.drawing_area.draw()
  }

  /**
   * Copie les vues d'un fichier source dans l'application courante. Les vues existantes
   * (même id) sont ignorées. Appelé après applySourceDA quand 'copyViews' est demandé.
   */
  public addViewsFromJSON(json_object: Type_JSON): number {
    // Apply OSP legacy conversion in-place before reading 'views'
    convert_data_plus_legacy(json_object)
    const views_json = getJSONOrUndefinedFromJSON(json_object, 'views')
    if (!views_json) {
      console.warn('[addViewsFromJSON] no views key found, aborting')
      return 0
    }
    let added = 0
    // Ensure master is set on current app
    if (!this.host.master_drawing_area) {
      this.host.master_drawing_area = this.host.drawing_area
    }
    // Register each sub-view from the source file
    Object.entries(views_json).forEach(([view_id, view_json]) => {
      if (view_id === MASTER_VIEW_ID) return
      if (this.host.views_dict[view_id]) {
        return
      }
      this.host.views_order.push(view_id)
      this.host.views_dict[view_id] = {
        name: (view_json as Type_JSON)['name'] as string,
        json: compressJSONToGzip(view_json as Type_JSON) as Uint8Array
      }
      this.parseViewExtraFields(view_id, view_json as Type_JSON)
      this.host.heredited_attr[view_id] = migrateHereditedAttr(
        view_json as Type_ViewHereditedJSON,
        MASTER_VIEW_ID
      )
      added++
    })
    // Switch to the active view from the source file if it exists in the imported views
    let active_view_id = getStringFromJSON(json_object, 'current_view', MASTER_VIEW_ID)
    if (active_view_id === MASTER_VIEW_ID) active_view_id = Object.keys(views_json).find(id => id !== MASTER_VIEW_ID) ?? MASTER_VIEW_ID
    if (active_view_id !== MASTER_VIEW_ID && this.host.views_dict[active_view_id]) {
      this.host.current_view_id = active_view_id
      if (this.host.views_dict[active_view_id].is_light) {
        this.host.drawing_area.sankey.setVisible()
      } else {
        this.extractViewFromJSON(this.host.views_dict[active_view_id].json, active_view_id)
      }
      this.applyViewTagSelection(this.host.views_dict[active_view_id].tag_selection)
      this.host.drawing_area.draw()
    }
    this.host.menu_configuration_osp.updateComponentRelatedToViews()
    return added
  }

  // ========================================================================================
  // CRÉATION / PROMOTION / MIGRATION DE VUES
  // ========================================================================================

  /** Crée une nouvelle vue (heavy) depuis le Sankey courant et bascule dessus. */
  public createNewView(view_id: string, view_name: string, copy: boolean) {
    // If no view existed previously, we add the active sankey as master sankey
    if (!this.has_views && !this.host.master_drawing_area) {
      this.host.master_drawing_area = this.host.drawing_area
    }
    // Create the new sankey
    const new_drawing_area = this.host.createNewDrawingArea(view_id)
    new_drawing_area.bypass_redraws = true
    if (copy) DrawingAreaPersistenceOSP.fromJSON(new_drawing_area, DrawingAreaPersistenceOSP.toJSON(this.host.drawing_area as Class_DrawingAreaOSP)) // /!\ CopyFrom overwrites drawing area's name
    new_drawing_area.name = 'Copie de ' + this.host.drawing_area.name
    new_drawing_area.sankey.id = view_id
    // Add new sankey to views
    this.host.views_dict[view_id] = {
      'name': view_name,
      'json': compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(new_drawing_area as Class_DrawingAreaOSP))
    }
    this.host.heredited_attr[view_id] = {}
    this.pushViewIdInViewOrder(new_drawing_area.id)
    this.host.drawing_area.sankey.setInvisible()
    this.host.drawing_area.purgeSelection()
    this.host.drawing_area.unDraw()
    this.host.replaceDrawingArea(new_drawing_area)
    // Nouvelle vue heavy (DA propre) : son identité logique = son id de Sankey.
    this.host.current_view_id = view_id
    return new_drawing_area
  }

  /**
   * Applique la sélection de visibilité d'une vue sur le Sankey OS courant : pour chaque
   * groupe de view tags, sélectionne l'étiquette demandée + active le mode filtre, ou éteint
   * le filtre si la vue ne contraint pas ce groupe (vue complète). Les groupes unitaires
   * câblés sont laissés à leur propre logique. Bumpe la réactivité OS.
   */
  public applyViewTagSelection(selection: { [view_tagg_id: string]: string } | undefined) {
    const sankey = this.host.drawing_area.sankey
    let changed = false
    Object.values(sankey.view_taggs_dict).forEach((group) => {
      if (group.id === 'unitary' || group.id === 'product_unitary' || group.id === 'sector_unitary') return
      const selected_label = selection ? selection[group.id] : undefined
      if (selected_label) {
        group.activated = true
        group.view_mode = true
        group.selectTagsFromIds([selected_label])
        changed = true
      } else if (group.view_mode) {
        group.view_mode = false
        changed = true
      }
    })
    if (changed) {
      // La visibilité d'un nœud dépend de celle de ses voisins : une seule passe ne suffit
      // pas à propager. Sans la stabilisation en 2 passes, la 1re sélection d'une vue light
      // depuis le maître dessinait une visibilité non stabilisée (switch « avalé »).
      sankey.nodeTagsUpdated()
      sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
      sankey.nodes_list.forEach(n => { void n.is_visible })
      sankey.nodes_list.forEach(n => { void n.is_visible })
    }
  }

  /**
   * Migration « tout est une vue nommée » : pour chaque groupe de view tags activé (hors
   * unitaires), génère une vue light par étiquette (visibilité seule, géométrie héritée du
   * maître). Additive et idempotente. Ne change PAS la vue courante.
   */
  public migrateViewTagsToViews() {
    // Les vues sont une feature OSP/plus : ne pas injecter de vues dans les fichiers des
    // utilisateurs sans licence (ils gardent le sélecteur viewtag historique).
    if (!this.host.has_sankey_plus) return
    const base_da = this.host.master_drawing_area ?? this.host.drawing_area
    if (!base_da) return
    const sankey = base_da.sankey
    const groups = Object.values(sankey.view_taggs_dict).filter((g) =>
      g.activated &&
      g.id !== 'unitary' && g.id !== 'product_unitary' && g.id !== 'sector_unitary' &&
      g.tags_list.length > 0
    )
    if (groups.length === 0) return
    // Bascule en mode multi-vues si nécessaire (le maître devient la DA de référence).
    if (!this.host.master_drawing_area) this.host.master_drawing_area = this.host.drawing_area
    groups.forEach((group) => {
      group.tags_list.forEach((tag) => {
        const view_id = `vt__${group.id}__${tag.id}`
        if (this.host.views_dict[view_id]) return // idempotent
        // Vue LIGHT : aucune géométrie propre (réutilise la DA maître en live) => json MINIMAL
        // (id + name), pas de copie du maître.
        const view_json = { id: view_id, name: tag.name }
        this.host.views_dict[view_id] = {
          name: tag.name,
          json: compressJSONToGzip(view_json) as Uint8Array,
          tag_selection: { [group.id]: tag.id },
          is_light: true,
          generated_from_group_id: group.id,
        }
        this.host.heredited_attr[view_id] = {}
        this.pushViewIdInViewOrder(view_id)
      })
    })
  }

  /** Action UI : (re)génère les vues light manquantes depuis les groupes de view tags activés. */
  public syncViewsFromViewTags() {
    this.migrateViewTagsToViews()
    this.host.menu_configuration_osp.updateComponentRelatedToViews()
  }

  /**
   * Promotion light → heavy (« convertir en vue complète »). Matérialise la géométrie
   * courante (celle du maître, qu'une vue light affiche en live) dans un snapshot propre à la
   * vue, puis la marque heavy. La sélection de visibilité (tag_selection) est conservée.
   */
  public promoteViewToFull(view_id: string) {
    const view = this.host.views_dict[view_id]
    if (!view || !view.is_light) return
    if (!this.host.master_drawing_area) return
    const snap = DrawingAreaPersistenceOSP.toJSON(this.host.master_drawing_area as Class_DrawingAreaOSP)
    view.json = compressJSONToGzip({ ...snap, id: view_id, name: view.name }) as Uint8Array
    view.is_light = false
    // Si la vue promue est la vue courante, la recharger via le chemin heavy pour que les
    // éditions visent désormais sa DA propre (et non le maître partagé).
    if (this.host.current_view_id === view_id) {
      this.setCurrentView(view_id)
    }
    this.host.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    this.host.menu_configuration_osp.updateComponentRelatedToViews()
  }

  // ========================================================================================
  // SWITCH DE VUE
  // ========================================================================================

  public setCurrentView(id: string) {
    this.setCurrentViewInternal(id)
  }

  protected setCurrentViewInternal(id: string) {
    // Case 1 : déclencher la pop-up de sauvegarde si des changements ont été faits sur une
    // vue qui n'est pas le maître.
    if (
      !this.is_view_master &&
      (this.host.original_current_view !== undefined) &&
      !this.host.menu_configuration.ref_to_save_in_cache_indicator_value.current
    ) {
      if (this.host.menu_configuration.ref_to_never_save_view_session_value.current) {
        // Session "ne jamais enregistrer" : discard silencieux + switch (pas de modale).
        this.host.waiting_to_set_view = id
        this.resetViewWithOriginal()
        return
      }
      // On empêche le switch immédiat et on demande à l'utilisateur s'il veut sauvegarder.
      this.host.waiting_to_set_view = id
      this.host.menu_configuration_osp.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current(true)
    }
    // Case 2 : sinon, on pose la nouvelle vue.
    else {
      // Mode de position (absolu / proportionnel / échelle adaptée) = état d'affichage GLOBAL
      // du viewer, pas une géométrie propre à la vue. On capture le mode courant (DA sortante)
      // pour le ré-appliquer sur la nouvelle DA plus bas.
      const prev_position_mode = this.host.drawing_area.sankey.styles_dict['default'].shape_position_type
      this.host.drawing_area.sankey.setInvisible()
      this.host.drawing_area.purgeSelection()
      this.host.drawing_area.unDraw()
      // Vue LIGHT = pas d'override géométrie/style propre : réutilise la DA maître (géométrie
      // héritée), AUCUN rebuild (pas d'extractViewFromJSON), seule la sélection de visibilité change.
      const is_light = id !== MASTER_VIEW_ID && !!this.host.views_dict[id]?.is_light
      // Set-up new sankey
      if (id == MASTER_VIEW_ID || is_light) {
        this.host.replaceDrawingArea(this.host.master_drawing_area!)
        // Le maître peut n'avoir jamais été scindé : quand le fichier s'ouvre directement sur
        // une vue, le _afterFromJSON d'ouverture s'applique à la DA de la vue, pas au maître.
        // On garantit ici la présence des nœuds Import/Export (splitTrade idempotent).
        this.host.drawing_area.afterFromJSON()
      }
      else this.extractViewFromJSON(this.host.views_dict[id].json, id)
      // Identité LOGIQUE de la vue courante (découplée de l'id du Sankey de la DA). Posée AVANT
      // applyViewTagSelection / les redraws.
      this.host.current_view_id = id
      this.host.drawing_area.sankey.setVisible()
      // Set original view in temporary var so it can be used when we change view and don't
      // want to save current modification
      if (id !== MASTER_VIEW_ID && !is_light) {
        // Update view with heredited attr from configured source (master by default)
        this.host.drawing_area.bypass_redraws = true
        const attrs_by_source = this.host.heredited_attr[id] ?? {}
        // Apply in cascade following views_order
        ;[MASTER_VIEW_ID, ...this.host.views_order].forEach((source_id: string) => {
          const attrs = attrs_by_source[source_id]
          if (attrs && attrs.length > 0) {
            const source_da = this.getDrawingAreaFromViewId(source_id)
            if (source_da) updateFrom(this.host.drawing_area, source_da, attrs)
          }
        })
        // Create a clone of current view's DA
        if (!this.host.is_static) {
          const clone_drawing_area = this.host.createNewDrawingArea(makeId(this.host.drawing_area.id))
          clone_drawing_area.bypass_redraws = true
          clone_drawing_area.copyFrom(this.host.drawing_area)
          this.deleteCurrentOriginalView()
          this.host.original_current_view = clone_drawing_area
        }
      } else if (is_light) {
        // Vue light : aucune géométrie propre à sauvegarder => pas de snapshot « original ».
        this.deleteCurrentOriginalView()
      }
      // Concept unifié vue ⊕ viewtag : applique la sélection de visibilité portée par la vue
      // sur le Sankey OS. Master / vue sans sélection => undefined => efface tout filtre.
      this.applyViewTagSelection(
        id === MASTER_VIEW_ID ? undefined : this.host.views_dict[id]?.tag_selection
      )
      // Reset to Edition mode
      this.host.drawing_area.setToModeEdition(false)
      // Préserver le mode de position global à travers le switch.
      const new_position_mode = this.host.drawing_area.sankey.styles_dict['default'].shape_position_type
      if (new_position_mode !== prev_position_mode) {
        if (prev_position_mode === 'scale_adapted') this.host.drawing_area.setScaleAdaptedMode()
        else if (prev_position_mode === 'proportional') this.host.drawing_area.setProportionalMode()
        else if (prev_position_mode === 'absolute') this.host.drawing_area.setAbsoluteMode()
      }
      // Draw new-sankey
      this.host.drawing_area.sankey.sortNodes()
      this.host.drawing_area.draw()
      this.host.drawing_area.recenter()
      this.host.drawing_area.orderElementOnDA()
      this.host.resetHistory()

      // Update components related to views
      this.host.menu_configuration.updateAllMenuComponents()
      this.host.menu_configuration_osp.updateComponentRelatedToViews()
      // Update menu save diagram JSON
      this.host.menu_configuration.updateComponentSaveDiagramJSON()
      this.host.menu_configuration.updateComponentLoadDiagramJSON()
    }
  }

  public setCurrentViewToMaster() {
    if (!this.is_view_master) {
      this.setCurrentView(MASTER_VIEW_ID)
    }
  }

  public setCurrentViewToNext() {
    if (this.has_views && this.has_view_after) {
      const order = this.views_navigation_order
      const idx = order.indexOf(this.host.current_view_id)
      this.setCurrentView(order[idx + 1])
    }
  }

  public setCurrentViewToPrev() {
    if (this.has_views && this.has_view_before) {
      const order = this.views_navigation_order
      const idx = order.indexOf(this.host.current_view_id)
      this.setCurrentView(order[idx - 1])
    }
  }

  // ========================================================================================
  // SUPPRESSION / SAUVEGARDE DE VUES
  // ========================================================================================

  public deleteCurrentView() {
    this.deleteView(this.host.current_view_id)
  }

  /** Supprime une vue de l'application & revient au maître. */
  public deleteView(id: string) {
    // Check if we are not trying to delete master
    if (this.host.views_dict[id] !== undefined) {
      // Une vue light réutilise la DA maître : capturer sa nature AVANT suppression de l'entrée
      // pour décider plus bas s'il faut détruire la DA (heavy) ou non (light).
      const was_light = !!this.host.views_dict[id].is_light
      // Clean
      delete this.host.views_dict[id]
      this.host.views_order.splice(this.host.views_order.indexOf(id), 1)
      delete this.host.heredited_attr[id]
      // Go to master (identité LOGIQUE : la DA d'une vue light est celle du maître)
      if (id == this.host.current_view_id) {
        this.deleteCurrentOriginalView()
        // NE PAS supprimer la DA d'une vue light (ce serait détruire le maître).
        if (!was_light) {
          this.host.drawing_area.delete()
        }
        this.setCurrentViewToMaster()
        this.host.menu_configuration.updateAllMenuComponents()
        this.host.menu_configuration_osp.updateComponentRelatedToViews()
      }
    }
  }

  /** Réinitialise la vue courante avec le snapshot « original » temporaire. */
  public resetViewWithOriginal() {
    if (
      (!this.is_view_master) &&
      (this.host.original_current_view !== undefined)
    ) {
      // Reset drawing area
      this.host.drawing_area.bypass_redraws = true
      this.host.drawing_area.sankey.copyFrom(this.host.original_current_view.sankey)
      this.host.drawing_area.legend.copyFrom(this.host.original_current_view.legend)
      // Update indicator
      this.host.menu_configuration.ref_to_save_in_cache_indicator.current(true)
      // Send to new view
      this.setCurrentView(this.host.waiting_to_set_view ?? MASTER_VIEW_ID)
      this.host.waiting_to_set_view = undefined
    }
  }

  /**
   * Rafraîchit le cache compressé de la vue courante. Appelé après des mutations in-place sur
   * la DA de la vue active (ex. réconciliation) pour que le cache reflète le dernier état.
   */
  public saveCurrentViewToCache(): void {
    if (!this.has_views) return
    if (this.is_view_master) return
    // Identité LOGIQUE ; une vue light n'a pas de json propre (géométrie = maître).
    const view_id = this.host.current_view_id
    if (!this.host.views_dict[view_id] || this.host.views_dict[view_id].is_light) return
    this.host.views_dict[view_id].json = compressJSONToGzip(
      DrawingAreaPersistenceOSP.toJSON(this.host.drawing_area as Class_DrawingAreaOSP)
    )
  }

  /** Sauvegarde la vue courante avant de basculer vers une autre. */
  public saveBeforeChangingView() {
    // Vue light : rien à sauvegarder (pas de json propre). Identité LOGIQUE pour la heavy.
    if (!this.is_view_master && !this.host.views_dict[this.host.current_view_id]?.is_light) {
      this.host.views_dict[this.host.current_view_id].json = compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(this.host.drawing_area as Class_DrawingAreaOSP))
      this.host.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    }
    this.setCurrentView(this.host.waiting_to_set_view ?? MASTER_VIEW_ID)
    this.host.waiting_to_set_view = undefined
  }

  /** Doc markdown `view://<id>` links : activer la vue ciblée (no-op si l'id n'existe plus). */
  public navigateToView(id: string): void {
    if (id === MASTER_VIEW_ID || this.host.views_dict[id]) {
      this.setCurrentView(id)
    }
  }
}

// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import pako from 'pako'
import { compressJSONToGzip } from '../Persistence/UniversalJSONCompression'
import { getBooleanFromJSON, getJSONOrUndefinedFromJSON, getStringFromJSON } from './Utils'
import { DrawingAreaPersistence } from '../Persistence/SankeyPersistence'
import { decodeViewsFromDelta } from './viewDelta'
import { ViewsQuery, MASTER_VIEW_ID } from './ViewsQuery'
import type { Class_DrawingArea } from './DrawingArea'
import type { Type_JSON } from './Utils'
import type { Class_ApplicationData } from './ApplicationData'

/**
 * #1316 — Viewer intégral : lecture des vues en OpenSankey (open source).
 *
 * `ViewsReader` porte le sous-ensemble LECTURE du système de vues (décodage `views` + delta
 * `__patch`, reconstruction de la drawing area d'une vue, bascule `current_view`, navigation,
 * application de la sélection de visibilité). Il compose `ViewsQuery` (logique pure) comme le
 * faisait `ViewsManager`, et opère la DA via l'hôte `Class_ApplicationData`.
 *
 * La CRÉATION / ÉDITION des vues (heredited_attr, snapshot « original », dialogues de
 * sauvegarde, promotion light→heavy, suppression, sync depuis les view tags) reste en
 * OpenSankey+ : `ViewsManager` (OSP) ÉTEND cette classe et
 *   - surcharge `fromViewJSON` pour reconstruire via `DrawingAreaPersistenceOSP` (fidélité
 *     édition + `name` + conversion legacy pré-0.9) ;
 *   - surcharge les hooks-gabarit de `setCurrentView` (`interceptViewChange`,
 *     `afterHeavyViewLoaded`, `afterLightViewLoaded`, `updateViewMenus`) et de `viewsFromJSON`
 *     (`onViewParsed`) pour y greffer la logique d'édition, SANS dupliquer le corps de lecture.
 *
 * Ainsi un viewer OS pur restitue un fichier multi-vues ; l'atelier d'édition reste OSP.
 */
export class ViewsReader {
  protected readonly query: ViewsQuery

  constructor(protected readonly host: Class_ApplicationData) {
    this.query = new ViewsQuery(host)
  }

  // --- Délégation de la logique pure (ViewsQuery) -----------------------------------------

  public resolveViewIdFromSelection(selection: string): string | null { return this.query.resolveViewIdFromSelection(selection) }
  public resolveHeavyViewIdFromViewTagSelection(selection: Record<string, string>): string | null { return this.query.resolveHeavyViewIdFromViewTagSelection(selection) }
  public parseViewExtraFields(view_id: string, view_json: Type_JSON) { this.query.parseViewExtraFields(view_id, view_json) }
  // sa#396/397 — labels de vues (étiquettes de SÉLECTION, distinctes des view tags de génération).
  public get all_view_labels(): string[] { return this.query.all_view_labels }
  public viewIdsWithLabel(label: string): string[] { return this.query.viewIdsWithLabel(label) }

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
  // HOOKS-GABARIT (surchargés par ViewsManager OSP pour l'édition ; no-op / lecture ici).
  // ========================================================================================

  /**
   * Reconstruit une DA depuis le JSON d'une vue. OS : persistance de LECTURE
   * (`DrawingAreaPersistence`). OSP surcharge pour `DrawingAreaPersistenceOSP` (ajoute le `name`
   * de la DA + la conversion legacy pré-0.9). C'est LE point de couplage persistance.
   */
  protected fromViewJSON(drawing_area: Class_DrawingArea, parsed_json: Type_JSON): void {
    DrawingAreaPersistence.fromJSON(drawing_area, parsed_json)
  }

  /**
   * Appelé pour chaque vue lue par `viewsFromJSON`, après `parseViewExtraFields`. OS : rien.
   * OSP y migre les `heredited_attr` (overrides d'attributs par source — concept d'édition).
   */
  protected onViewParsed(_view_id: string, _view_json: Type_JSON): void { /* lecture : no-op */ }

  /**
   * Intercepteur de bascule de vue (avant tout switch). OS : jamais (retourne false). OSP :
   * si la vue courante a des modifs non sauvegardées, déclenche la pop-up « sauvegarder ? » et
   * retourne true pour AVORTER le switch immédiat.
   */
  protected interceptViewChange(_id: string): boolean { return false }

  /** Après chargement d'une vue HEAVY. OS : rien. OSP : cascade heredited_attr + clone « original ». */
  protected afterHeavyViewLoaded(_id: string): void { /* lecture : no-op */ }

  /** Après chargement d'une vue LIGHT. OS : rien. OSP : purge le snapshot « original ». */
  protected afterLightViewLoaded(_id: string): void { /* lecture : no-op */ }

  /** Rafraîchit les composants de menu liés aux vues. OS : menus de base. OSP : + menus OSP. */
  protected updateViewMenus(): void {
    this.host.menu_configuration?.updateAllMenuComponents()
  }

  // ========================================================================================
  // CHARGEMENT / EXTRACTION DE VUES (lecture). Opèrent la DA via l'hôte.
  // ========================================================================================

  /**
   * Construit une DA à partir du JSON gzip d'une vue, SANS toucher l'état vivant (ni la DA
   * courante ni son rendu). Utilisé par le switch de vue (via `extractViewFromJSON`).
   */
  public buildDrawingAreaFromViewJSON(json_object: Uint8Array, view_id: string) {
    const drawing_area_view = this.host.createNewDrawingArea(view_id)
    drawing_area_view.bypass_redraws = true
    const decompressed_string = pako.inflate(new Uint8Array(json_object), { to: 'string' })
    this.fromViewJSON(drawing_area_view, JSON.parse(decompressed_string))
    // Le chemin de bascule/extraction de vue ne repasse PAS par _afterFromJSON (contrairement
    // à l'ouverture du fichier). Or les nœuds Import/Export d'échange sont TRANSITOIRES : non
    // sérialisés, ils sont régénérés à chaque chargement par splitTrade(). afterFromJSON scinde
    // (idempotent) puis arrangeTrade — sinon les flux d'échange s'affichent sans leurs nœuds.
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
    this.fromViewJSON(tmp_DA, JSON.parse(decompressed_string))
    return tmp_DA
  }

  /** Charge les vues d'un fichier (clé `views`) et rouvre sur la vue active sauvegardée. */
  public viewsFromJSON(json_object: Type_JSON) {
    // #254 — Ré-étend les vues encodées en delta vs le maître AVANT toute lecture : tout le code
    // aval voit des snapshots complets. Détection structurelle (`__patch`) : un fichier ancien
    // ou mixte se relit sans rien changer.
    decodeViewsFromDelta(json_object)
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
    // OS#1315 — Caméra conservée entre les vues (rétro-compat : conservée si absent).
    this.host.keep_camera_across_views = getBooleanFromJSON(json_object, 'keep_camera_across_views', true)

    Object.entries(views_json)
      .forEach(([view_id, view_json]) => {
        this.pushViewIdInViewOrder(view_id)
        if (view_id == MASTER_VIEW_ID) return
        this.host.views_dict[view_id] = {
          name: (view_json as Type_JSON)['name'] as string,
          'json': compressJSONToGzip(view_json as Type_JSON) as Uint8Array
        }
        this.parseViewExtraFields(view_id, view_json as Type_JSON)
        // Hook OSP : migration heredited_attr (édition). No-op en lecture OS.
        this.onViewParsed(view_id, view_json as Type_JSON)
      })
    let active_view_id = getStringFromJSON(json_object, 'current_view', MASTER_VIEW_ID)
    if (this.host.is_static && active_view_id == MASTER_VIEW_ID) active_view_id = Object.keys(views_json)[0]
    // current_view peut pointer vers une vue absente (vieux fichier, vue supprimée) => master.
    if (active_view_id == MASTER_VIEW_ID || !this.host.views_dict[active_view_id]) {
      this.host.drawing_area.sankey.setVisible()
      return
    }
    // Rouvre le fichier sur la vue active sauvegardée. Vue light => pas de rebuild (réutilise la
    // DA maître) ; vue heavy => extraction du snapshot. Puis pose la sélection de visibilité.
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
   * Applique la sélection de visibilité d'une vue sur le Sankey OS courant : pour chaque groupe
   * de view tags, sélectionne l'étiquette demandée + active le mode filtre, ou éteint le filtre
   * si la vue ne contraint pas ce groupe (vue complète). Les groupes unitaires câblés sont
   * laissés à leur propre logique.
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
      // La visibilité d'un nœud dépend de celle de ses voisins : une seule passe ne suffit pas à
      // propager. Sans la stabilisation en 2 passes, la 1re sélection d'une vue light depuis le
      // maître dessinait une visibilité non stabilisée (switch « avalé »).
      sankey.nodeTagsUpdated()
      sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
      sankey.nodes_list.forEach(n => { void n.is_visible })
      sankey.nodes_list.forEach(n => { void n.is_visible })
    }
  }

  // ========================================================================================
  // SWITCH DE VUE (méthode-gabarit : corps de lecture + hooks d'édition surchargeables)
  // ========================================================================================

  public setCurrentView(id: string) {
    // OSP peut intercepter (modifs non sauvegardées => pop-up) et avorter le switch immédiat.
    if (this.interceptViewChange(id)) return
    this.applyViewChange(id)
  }

  /** Corps du switch : pose la nouvelle vue (light/heavy), la visibilité, la caméra et redessine. */
  protected applyViewChange(id: string) {
    const host = this.host
    // Mode de position (absolu / proportionnel / échelle adaptée) = état d'affichage GLOBAL du
    // viewer, pas une géométrie propre à la vue : capturé sur la DA sortante, ré-appliqué plus bas.
    const prev_position_mode = host.drawing_area.sankey.styles_dict['default'].shape_position_type
    // #680 (revu) — Caméra de la vue SORTANTE, capturée avant unDraw : reportée sur la vue
    // entrante en mode 'none' (changer de vue ne recadre pas).
    const prev_camera = host.drawing_area.getCameraTransform()
    host.drawing_area.sankey.setInvisible()
    host.drawing_area.purgeSelection()
    host.drawing_area.unDraw()
    // Vue LIGHT = pas d'override géométrie/style propre : réutilise la DA maître (géométrie
    // héritée), AUCUN rebuild (pas d'extractViewFromJSON), seule la sélection de visibilité change.
    const is_light = id !== MASTER_VIEW_ID && !!host.views_dict[id]?.is_light
    if (id == MASTER_VIEW_ID || is_light) {
      host.replaceDrawingArea(host.master_drawing_area!)
      // Le maître peut n'avoir jamais été scindé : garantit la présence des nœuds Import/Export
      // (splitTrade idempotent) quand le fichier s'ouvre directement sur une vue.
      host.drawing_area.afterFromJSON()
    } else {
      this.extractViewFromJSON(host.views_dict[id].json, id)
    }
    // Identité LOGIQUE de la vue courante (découplée de l'id du Sankey de la DA). Posée AVANT
    // applyViewTagSelection / les redraws.
    host.current_view_id = id
    host.drawing_area.sankey.setVisible()
    // Hooks d'édition (OSP) : cascade heredited_attr + clone « original » (heavy) / purge (light).
    if (id !== MASTER_VIEW_ID && !is_light) {
      this.afterHeavyViewLoaded(id)
    } else if (is_light) {
      this.afterLightViewLoaded(id)
    }
    // Concept unifié vue ⊕ viewtag : applique la sélection de visibilité portée par la vue.
    // Master / vue sans sélection => undefined => efface tout filtre.
    this.applyViewTagSelection(
      id === MASTER_VIEW_ID ? undefined : host.views_dict[id]?.tag_selection
    )
    // Reset to Edition mode
    host.drawing_area.setToModeEdition(false)
    // Préserver le mode de position global à travers le switch.
    const new_position_mode = host.drawing_area.sankey.styles_dict['default'].shape_position_type
    if (new_position_mode !== prev_position_mode) {
      if (prev_position_mode === 'scale_adapted') host.drawing_area.setScaleAdaptedMode()
      else if (prev_position_mode === 'proportional') host.drawing_area.setProportionalMode()
      else if (prev_position_mode === 'absolute') host.drawing_area.setAbsoluteMode()
    }
    // Draw new-sankey
    host.drawing_area.sankey.sortNodes()
    host.drawing_area.draw()
    // Cadrage selon le mode de la vue (revu post-#680) : 'none' → caméra de la vue précédente
    // reportée telle quelle ; 'full'/largeur/hauteur → le mode s'applique. OS#1315 — si « caméra
    // conservée entre les vues » est désactivé, chaque vue applique son propre cadrage à l'arrivée.
    if (host.drawing_area.auto_fit_mode === 'none') {
      if (host.keep_camera_across_views && prev_camera) host.drawing_area.setCamera(prev_camera)
    } else host.drawing_area.applyAutoFitMode(false)
    host.drawing_area.orderElementOnDA()
    host.resetHistory()
    // Rafraîchit les composants de menu liés aux vues (base OS ; OSP ajoute ses propres menus).
    this.updateViewMenus()
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

  /** Doc markdown `view://<id>` links : activer la vue ciblée (no-op si l'id n'existe plus). */
  public navigateToView(id: string): void {
    if (id === MASTER_VIEW_ID || this.host.views_dict[id]) {
      this.setCurrentView(id)
    }
  }
}

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
import { implicitDashboardId, isImplicitDashboardId } from './Dashboards'
import type { Type_ViewLabelDef } from './ViewsQuery'
import { Class_ViewSwitchProgress, viewSwitchPath } from './viewSwitchProgress'
import { TUTORIAL_TOPIC } from './EventBus'
import { createViewSwitchOverlay } from './viewSwitchOverlay'
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

  /**
   * os#1368 — Ordonnanceur du switch INTERACTIF (cf. `requestViewChange`) : pose l'indicateur,
   * cède la main au navigateur, puis travaille. Non armé tant que personne ne demande de switch
   * interactif : `setCurrentView` (chemin programmatique, exports et options de publication)
   * n'en dépend pas et reste strictement synchrone.
   */
  protected switch_progress: Class_ViewSwitchProgress

  /**
   * Le même ordonnanceur, ouvert aux AUTRES gestes lourds (filtrage par dataTag, os#1369) via
   * `Class_ApplicationData.runHeavyGesture`. Partagé à dessein : un seul voile à l'écran, et
   * l'invariant d'ordre vaut alors ENTRE les gestes — un changement de dataTag demandé pendant
   * une bascule de vue cédée ne s'applique plus avant elle.
   */
  public get gesture_progress(): Class_ViewSwitchProgress { return this.switch_progress }

  constructor(protected readonly host: Class_ApplicationData) {
    this.query = new ViewsQuery(host)
    this.switch_progress = new Class_ViewSwitchProgress({
      indicator: createViewSwitchOverlay(
        // Relu à chaque affichage : la drawing area est remplacée au cours du switch.
        () => (typeof document === 'undefined')
          ? null
          : document.querySelector(this.host.drawing_area?.container_selector ?? '#sankey_app')
      )
    })
  }

  // --- Délégation de la logique pure (ViewsQuery) -----------------------------------------

  public resolveViewIdFromSelection(selection: string): string | null { return this.query.resolveViewIdFromSelection(selection) }
  public resolveHeavyViewIdFromViewTagSelection(selection: Record<string, string>): string | null { return this.query.resolveHeavyViewIdFromViewTagSelection(selection) }
  public parseViewExtraFields(view_id: string, view_json: Type_JSON) { this.query.parseViewExtraFields(view_id, view_json) }
  // sa#396/397 — labels de vues (étiquettes de SÉLECTION, distinctes des view tags de génération).
  public get all_view_labels(): string[] { return this.query.all_view_labels }
  public viewIdsWithLabel(label: string): string[] { return this.query.viewIdsWithLabel(label) }
  // os#1357 — annuaire des labels : résolution, libellé, renommage.
  public get used_view_label_defs(): Type_ViewLabelDef[] { return this.query.used_view_label_defs }
  public labelIdFromIdOrName(v: string, create: boolean = false): string { return this.query.labelIdFromIdOrName(v, create) }
  public labelNameOf(id: string): string { return this.query.labelNameOf(id) }
  public renameViewLabel(id: string, name: string): boolean { return this.query.renameViewLabel(id, name) }
  public setViewLabelGroup(id: string, group: string): boolean { return this.query.setViewLabelGroup(id, group) }
  public deleteViewLabel(id: string): boolean { return this.query.deleteViewLabel(id) }
  public get view_label_groups(): string[] { return this.query.view_label_groups }
  public labelDefsInGroup(group: string): Type_ViewLabelDef[] { return this.query.labelDefsInGroup(group) }

  public get has_views(): boolean { return this.query.has_views }
  public get is_view_master(): boolean { return this.query.is_view_master }
  public get is_current_view_light(): boolean { return this.query.is_current_view_light }
  public get views_navigation_order(): string[] { return this.query.views_navigation_order }
  public get views_arrow_order(): string[] { return this.query.views_arrow_order }
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

  /** Juste avant que la vue courante cède la place. OS : rien. OSP : la vignette de la vue quittée. */
  protected beforeViewLeft(): void { /* lecture : no-op */ }

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

    // os#1357 — Annuaire des labels, lu AVANT les vues : `parseViewExtraFields` s'en sert pour
    // résoudre — et au besoin compléter — les labels de chaque vue. Absent d'un fichier
    // antérieur : l'annuaire se reconstruit alors depuis les noms rencontrés dans les vues.
    // Sérialisé en DICTIONNAIRE indexé par identifiant, comme `views` et `contexts` : c'est la
    // seule forme d'objet que `Type_JSON` sait porter (pas de tableau d'objets), et l'unicité
    // de l'identifiant y est structurelle.
    const defs_raw = json_object['view_label_defs']
    const defs: Type_ViewLabelDef[] = []
    if (defs_raw && typeof defs_raw === 'object' && !Array.isArray(defs_raw)) {
      Object.entries(defs_raw as Type_JSON).forEach(([id, d]) => {
        if (id === '' || !d || typeof d !== 'object' || Array.isArray(d)) return
        const entry = d as Type_JSON
        const name = entry['name']
        if (typeof name !== 'string' || name === '') return
        const group = entry['group']
        defs.push(typeof group === 'string' && group !== ''
          ? { id, name, group }
          : { id, name })
      })
    }
    this.host.view_label_defs.length = 0
    this.host.view_label_defs.push(...defs)

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
    // os#1358 — Ordre explicite s'il est là ; sinon l'ordre des clés de `views` fait foi, ce
    // que la boucle ci-dessus vient d'établir — un fichier antérieur se relit donc à
    // l'identique. On ignore les ids inconnus et on garde en queue les vues absentes de la
    // liste : un fichier partiellement à jour ne perd aucune vue.
    const order_raw = json_object['views_order']
    if (Array.isArray(order_raw)) {
      const known = new Set(this.host.views_order)
      const explicit = [...new Set(
        order_raw.filter((id): id is string => typeof id === 'string' && known.has(id))
      )]
      const seen = new Set(explicit)
      const rest = this.host.views_order.filter(id => !seen.has(id))
      this.host.views_order.length = 0
      this.host.views_order.push(...explicit, ...rest)
    }

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
      // sa#581 — une vue légère à mise en page propre rouvre avec SA mise en page.
      this.host.afterViewChange(active_view_id)
    } else {
      this.extractViewFromJSON(this.host.views_dict[active_view_id].json, active_view_id)
    }
    this.applyViewTagSelection(this.host.views_dict[active_view_id].tag_selection)
    // os#1377 — pas ce dessin-ci quand la lecture en cours se termine par le sien
    // (`fromJSON(..., draw = true)`, cf. `from_json_will_draw`) : il serait intégralement
    // refait, et sur CARTOFOB il coûtait 70 des 211 dessins de flux du chargement — la
    // géométrie de la vue enregistrée, que les options de publication remplacent aussitôt.
    // Appelée hors chargement (ex. ModalCreateUnitaryViewOSP), la méthode dessine comme avant.
    if (!this.host.from_json_will_draw) this.host.drawing_area.draw()
  }

  /**
   * Applique la sélection de visibilité d'une vue sur le Sankey OS courant : pour chaque groupe
   * de view tags, sélectionne l'étiquette demandée + active le mode filtre, ou éteint le filtre
   * si la vue ne contraint pas ce groupe (vue complète).
   *
   * os#1382 : plus de cas particulier pour les groupes unitaires câblés — ils ne sont
   * plus créés, et un ancien fichier qui en porte les décrit avec view_mode=false, donc
   * la boucle les traverse sans rien changer.
   */
  public applyViewTagSelection(selection: { [view_tagg_id: string]: string } | undefined) {
    const sankey = this.host.drawing_area.sankey
    let changed = false
    Object.values(sankey.view_taggs_dict).forEach((group) => {
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

  /**
   * Bascule PROGRAMMATIQUE : strictement synchrone, inchangée. C'est le contrat dont dépendent les
   * appelants qui lisent la vue au retour — export de toutes les vues (`iterateAllViews`),
   * application des options de publication à l'ouverture, suites de tests.
   */
  public setCurrentView(id: string) {
    // sa#581 — une vue qui n'est qu'un volet ne change rien au diagramme : on rappelle son volet.
    if (this.host.isWindowOnlyView(id)) { this.host.placeViewOnPanes(id); return }
    // OSP peut intercepter (modifs non sauvegardées => pop-up) et avorter le switch immédiat.
    if (this.interceptViewChange(id)) return
    this.applyViewChange(id)
  }

  /**
   * sa#581 — LA BASCULE QU'UNE ACTIVATION DE VOLET SANKEY COMMANDE : le volet devient le vivant,
   * et le dessin passe sur sa vue. Sans interception — la mise en page du volet quitté est gardée
   * d'office (cf. `Class_SankeyPanes`), il n'y a rien à demander — et sans replacement de volets :
   * celui qui reçoit la vue est déjà choisi.
   */
  public switchViewForPane(id: string) {
    this.applyViewChange(id)
  }

  /**
   * sa#619 — LA BASCULE SANS DESSIN que commande l'échange de deux volets Sankey qui montrent le même
   * dessin sous deux vues (cf. `Class_SankeyPanes.swapLiveViews`) : la vue courante change de NOM,
   * pas de contenu — le maître ou une vue légère, sur la même zone de dessin. Le reste de la bascule
   * ordinaire, ce qui ne touche pas au dessin, est fait ici : la vignette de la vue quittée, le crochet
   * des vues légères, les menus. Le tableau de bord courant ne bouge pas : choisir un volet n'en sort
   * pas (cf. `applyViewChangeBody`).
   */
  public renameCurrentView(id: string) {
    this.beforeViewLeft()
    this.host.current_view_id = id
    this.followViewWithDashboard(id)
    this.afterLightViewLoaded(id)
    this.updateViewMenus()
  }

  /**
   * Le tableau de bord courant devient l'implicite de la vue `id` — sauf pendant l'activation d'un
   * tableau de bord, qui a déjà posé le sien, et, sa#619, quand c'est l'activation d'un volet Sankey
   * qui change la vue alors qu'un tableau de bord EXPLICITE est courant : depuis que tout volet est une
   * vue, passer d'un volet Sankey à l'autre change de vue, et cliquer dans un volet ne fait pas sortir
   * du tableau de bord qu'on regarde. Sur le principal seulement (cf. `applyViewChangeBody`).
   */
  protected followViewWithDashboard(id: string) {
    const host = this.host
    const dashboards = host.menu_configuration?.dashboards
    if (!dashboards || !host.is_main || dashboards.activating) return
    // sa#624 — quand l'écran est le tableau de bord courant, une vue qui change dans un volet change
    // ce tableau de bord, elle n'en fait pas sortir.
    if (host.dashboards_follow_screen) return
    const explicit = dashboards.current !== null && !isImplicitDashboardId(dashboards.current)
    if (host.sankey_panes.activating && explicit) return
    dashboards.current = implicitDashboardId(id)
  }

  /**
   * os#1368 — Bascule INTERACTIVE (geste d'utilisateur : sélecteur, bandeau, vignette, F7/F8/F9,
   * lien `view://`). Même corps que `setCurrentView`, seul l'ORDONNANCEMENT change : sur le chemin
   * heavy, un indicateur est posé, la main est rendue au navigateur le temps qu'il le peigne, puis
   * seulement le travail lourd démarre — et l'indicateur est retiré au retour, échec compris.
   *
   * L'interception OSP (« sauvegarder ? ») reste évaluée SYNCHRONEMENT, avant toute cession : un
   * switch avorté n'a pas d'indicateur à retirer.
   *
   * Le chemin light reste synchrone : il ne reconstruit rien, et lui coûter une frame pour un
   * clignotement serait pire que rien.
   */
  public requestViewChange(id: string): void | Promise<void> {
    // sa#581 — une vue qui n'est qu'un volet : son volet revient, le diagramme ne bouge pas.
    if (this.host.isWindowOnlyView(id)) {
      this.host.runAsViewGesture(() => this.host.placeViewOnPanes(id))
      return
    }
    if (this.interceptViewChange(id)) return
    const path = viewSwitchPath(id, MASTER_VIEW_ID, this.host.views_dict)
    return this.switch_progress.run(path, () => {
      // sa#581 — GESTE D'UTILISATEUR : la vue choisie trouve un volet où se montrer, quitte à en
      // ouvrir un (cf. `Class_ApplicationData.placeViewOnPanes`). Une bascule programmatique — un
      // export qui parcourt les vues — ne touche pas aux volets.
      this.host.runAsViewGesture(() => this.applyViewChange(id))
      this.noteTutorialStep(id)
    })
  }

  /**
   * sa#531 — Quand le document ouvert vient de `tutorials/`, un changement de vue n'est pas un
   * changement de vue : c'est le passage à l'étape suivante d'une leçon. Signalé ici et NULLE PART
   * ailleurs — sur le chemin INTERACTIF seulement, jamais sur `setCurrentView`, qui sert aussi à
   * l'export de toutes les vues et aux tests : y compter des étapes ferait « suivre » un tutoriel
   * à un export.
   *
   * Ne journalise pas : il signale. C'est la couche applicative qui décide (cf. TUTORIAL_TOPIC).
   *
   * ENTIÈREMENT DÉFENSIF, et c'est le point : ce n'est pas le switch de vue, c'est une mesure
   * greffée dessus. Elle s'exécute DANS le corps du switch interactif, donc tout ce qu'elle
   * laisserait passer casserait le geste de l'utilisateur — un tutoriel non mesuré est un
   * inconvénient, un changement de vue qui échoue est un bug. Le `menu_configuration` absent n'est
   * pas theorique : les doubles de test de `requestViewChange` n'en ont pas.
   */
  protected noteTutorialStep(id: string) {
    try {
      const menu = this.host.menu_configuration
      const file = menu?.current_tutorial
      if (!file) return
      // sa#581 — une étape de leçon est une vue SANS volet : les vues que l'ouverture du tutoriel a
      // créées pour ses volets (diagramme, tableur, leçon) viennent après, et ne sont pas des étapes.
      const order = (this.host.views_order ?? []).filter(v => !this.host.views_dict[v]?.window)
      const rank = order.indexOf(id)
      if (rank < 0) return
      menu.last_tutorial_step = { file, rank, last: rank === order.length - 1 }
      menu.notify(TUTORIAL_TOPIC)
    } catch { /* une mesure ne casse jamais le geste qu'elle observe */ }
  }

  /** Corps du switch : pose la nouvelle vue (light/heavy), la visibilité, la caméra et redessine. */
  protected applyViewChange(id: string) {
    // sa#581 — PENDANT LA BASCULE, LES VOLETS SANKEY NE SE RESYNCHRONISENT PAS. Elle change le volet
    // vivant, une coordonnée, le volet actif : autant de notifications de la grande zone, dont
    // chacune relancerait une activation de volet AU MILIEU de la bascule qui l'a causée.
    this.host.sankey_panes.hold(() => this.applyViewChangeBody(id))
  }

  protected applyViewChangeBody(id: string) {
    const host = this.host
    // Mode de position (absolu / proportionnel / échelle adaptée) = état d'affichage GLOBAL du
    // viewer, pas une géométrie propre à la vue : capturé sur la DA sortante, ré-appliqué plus bas.
    const prev_position_mode = host.drawing_area.sankey.styles_dict['default'].shape_position_type
    // #680 (revu) — Caméra de la vue SORTANTE, capturée avant unDraw : reportée sur la vue
    // entrante en mode 'none' (changer de vue ne recadre pas).
    const prev_camera = host.drawing_area.getCameraTransform()
    // sa#568 — le dessin qu'on quitte : l'historique ne repart que s'il est REMPLACÉ (cf. plus bas).
    const prev_drawing_area = host.drawing_area
    // sa#581 — la mise en page PROPRE du volet vivant est mise à l'abri avant que le dessin change.
    host.beforeViewChange()
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
    // os#1482 — UNE VUE NE REJOUE PLUS DE DISPOSITION : c'est le rôle d'une TABLEAU DE BORD (Dashboards.ts), et
    // les `view_main_zone` d'avant ont été migrées en tableaux de bord à la lecture. Une bascule de vue
    // qui n'est pas commandée par un tableau de bord fait de le tableau de bord courante l'implicite de cette vue,
    // pour que le sélecteur dise ce qu'on regarde — sauf pendant une activation, qui a déjà posé
    // la sienne. Sur le principal seulement : la vue d'un document de feuille ne dit rien de
    // l'écran.
    this.followViewWithDashboard(id)
    const dashboards = host.menu_configuration?.dashboards
    // sa#566 — UNE VUE EST UN VOLET ENREGISTRÉ : la bascule pose le sien. Pas pendant l'activation
    // d'un tableau de bord, qui pose lui-même toute la grille. sa#581 — ni pendant l'activation
    // d'un volet Sankey, qui a déjà choisi où la vue se montre.
    if (host.is_main && !dashboards?.activating && !host.sankey_panes.activating) host.placeViewOnPanes(id)
    host.drawing_area.sankey.setVisible()
    // Hooks d'édition (OSP) : cascade heredited_attr + clone « original » (heavy) / purge (light).
    if (id !== MASTER_VIEW_ID && !is_light) {
      this.afterHeavyViewLoaded(id)
    } else if (is_light) {
      this.afterLightViewLoaded(id)
    }
    // sa#581 — la mise en page qui convient : celle du volet vivant si la vue est la sienne, sinon
    // celle que la vue enregistre (vue légère à mise en page propre).
    host.afterViewChange(id)
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
      // os#1372 — `false` : le dessin suit immédiatement (sortNodes puis draw ci-dessous), celui
      // du setter serait intégralement refait.
      if (prev_position_mode === 'scale_adapted') host.drawing_area.setScaleAdaptedMode(false)
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
    // sa#568 — L'HISTORIQUE NE REPART QUE SI LE DESSIN A CHANGÉ D'OBJET (vue lourde, reconstruite
    // depuis son instantané) : ses entrées désigneraient des éléments morts. Le maître et les vues
    // légères gardent le même dessin — l'historique reste valable, et annuler / rétablir valent pour
    // toutes les actions du fichier, quel que soit le volet (Alexandre, 03/10).
    if (host.drawing_area !== prev_drawing_area) host.resetHistory()
    // Rafraîchit les composants de menu liés aux vues (base OS ; OSP ajoute ses propres menus).
    this.updateViewMenus()
  }

  // Navigation : gestes d'utilisateur (boutons de bandeau, F7 / F8 / F9) => chemin interactif.

  public setCurrentViewToMaster(): void | Promise<void> {
    if (!this.is_view_master) {
      return this.requestViewChange(MASTER_VIEW_ID)
    }
  }

  public setCurrentViewToNext(): void | Promise<void> {
    if (this.has_views && this.has_view_after) {
      const order = this.views_arrow_order
      const idx = order.indexOf(this.host.current_view_id)
      return this.requestViewChange(order[idx + 1])
    }
  }

  public setCurrentViewToPrev(): void | Promise<void> {
    if (this.has_views && this.has_view_before) {
      const order = this.views_arrow_order
      const idx = order.indexOf(this.host.current_view_id)
      return this.requestViewChange(order[idx - 1])
    }
  }

  /** Doc markdown `view://<id>` links : activer la vue ciblée (no-op si l'id n'existe plus). */
  public navigateToView(id: string): void | Promise<void> {
    if (id === MASTER_VIEW_ID || this.host.views_dict[id]) {
      return this.requestViewChange(id)
    }
  }
}

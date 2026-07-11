import * as d3 from '@terriflux/opensankey/src/d3Modules'
import { CreateToastFnReturn } from '@chakra-ui/react'
import pako from 'pako'
import { Class_ApplicationData } from '@terriflux/opensankey/src/types/ApplicationData'
import { default_main_sankey_id, getStringFromJSON, makeId, Type_JSON } from '@terriflux/opensankey/src/types/Utils'
import { serializeDocMarkdown, parseDocMarkdown } from '@terriflux/opensankey/src/Persistence/persistenceMigrations'
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { Class_ApplicationHistory } from '@terriflux/opensankey/src/types/ApplicationHistory'
import { Class_DrawingArea } from '@terriflux/opensankey/src/types/DrawingArea'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from './DrawingAreaOSP'
import { compressJSONToGzip } from '@terriflux/opensankey/src/Persistence/UniversalJSONCompression'
import { ViewsManager, Type_ViewEntry } from './ViewsManager'

/**
 * État d'essai gratuit côté client (poussé depuis AppSA via LoginComponent).
 * Structurellement compatible avec la réponse serveur (/auth/license → `trial`).
 */
export type TrialClientState = {
  plan: 'plus' | 'suite' | null
  days_remaining: number
  active_plus: boolean
  active_suite: boolean
  used_plus: boolean
  used_suite: boolean
  can_start_plus: boolean
  can_start_suite: boolean
}

export const EMPTY_TRIAL_CLIENT_STATE: TrialClientState = {
  plan: null,
  days_remaining: 0,
  active_plus: false,
  active_suite: false,
  used_plus: false,
  used_suite: false,
  can_start_plus: false,
  can_start_suite: false,
}

/**
 * Override some Class_ApplicationData behaviors for OpenSankey+
 * @export
 * @class Class_ApplicationDataOSP
 * @extends {Class_ApplicationData}
 */
export class Class_ApplicationDataOSP extends Class_ApplicationData {

  public override static_path: string = 'static/sankeyanimation'

  /**
   * Essai gratuit géré en base (colonnes trial_* côté serveur, jamais Stripe) :
   * tant que l'essai est actif, on débloque l'accès quel que soit le flag de
   * licence réelle. Une licence réelle (`has_sankey_plus = true` posé par la
   * couche auth) suffit à elle seule ; l'essai ne fait qu'AJOUTER l'accès.
   * L'objet complet est poussé depuis AppSA (LoginComponent → /auth/license).
   */
  protected _trial: TrialClientState = { ...EMPTY_TRIAL_CLIENT_STATE }
  public get trial(): TrialClientState { return this._trial }
  public set trial(_: TrialClientState) { this._trial = _ }
  public get trial_active_plus(): boolean { return this._trial.active_plus }
  public get trial_active_suite(): boolean { return this._trial.active_suite }
  public get trial_days_remaining(): number { return this._trial.days_remaining }
  public get trial_can_start_plus(): boolean { return this._trial.can_start_plus }
  public get trial_can_start_suite(): boolean { return this._trial.can_start_suite }
  public get trial_used_plus(): boolean { return this._trial.used_plus }
  public get trial_used_suite(): boolean { return this._trial.used_suite }

  public override get has_sankey_plus(): boolean {
    return this._has_sankey_plus || this.is_static || this._trial.active_plus
  }
  public override set has_sankey_plus(_: boolean) { this._has_sankey_plus = _ }

  /**
   * SankeySuite débloqué par un essai « suite » (couvre aussi OS+ côté serveur).
   * Comme pour OS+, l'essai n'ajoute que l'accès, sans toucher la licence réelle.
   */
  public override get has_sankey_afm(): boolean {
    return this._has_sankey_afm || this.is_static || this._trial.active_suite
  }
  public override set has_sankey_afm(_: boolean) { this._has_sankey_afm = _ }

  /**
   * True only when the user holds a real OS+ licence (or runs in static mode),
   * ignoring the free-trial bonus. Used by trial-related UI to decide whether
   * to nag the user about subscribing.
   */
  public get has_real_sankey_plus_licence(): boolean {
    return this._has_sankey_plus || this.is_static
  }

  /**
   * Concept unifié vue ⊕ viewtag : pour les utilisateurs plus, la visibilité passe par des
   * VUES nommées (cf. migration + chemin light in-place), donc on masque le sélecteur viewtag
   * historique de la topbar. Les non-plus gardent ce sélecteur (pas de feature Vues).
   */
  public override get views_replace_viewtag_topbar(): boolean { return this.has_sankey_plus }

  /**
   * True when the user holds a real SankeySuite licence (the tier above OS+, which
   * unlocks MFA/reconciliation) or runs in static mode. SankeySuite has no free trial,
   * so unlike OS+ there is no trial bonus to strip out. Used by the subscribe CTA to
   * decide whether to keep teasing the upgrade.
   */
  public get has_real_sankey_suite_licence(): boolean {
    return this._has_sankey_afm || this.is_static
  }

  // Service de gestion des vues (#244) : porte la logique de vues extraite de cette classe.
  // Première tranche = résolution de vues (pure/testable) ; l'état reste ici pour l'instant,
  // lu par le service via l'interface ViewsManagerHost (que cette classe satisfait).
  protected _views_manager = new ViewsManager(this)

  protected _master_drawing_area: Class_DrawingArea | undefined
  protected _views: { [id: string]: Type_ViewEntry }
  // heredited_attr[target_view_id][source_view_id] = string[] of attr keys to inherit from that source
  protected _heredited_attr: { [target_id: string]: { [source_id: string]: string[] } } = {}
  protected _views_order: string[] = []
  public get views_order() { return this._views_order }
  // Affiche le Sankey maître comme une entrée à part entière dans la liste des vues
  // (sélecteur topbar + table de config). Par défaut masqué (le maître n'était historiquement
  // pas une entrée sélectionnable). Libellé éditable stocké dans _master_view_name.
  protected _show_master_in_views: boolean = false
  protected _master_view_name: string = ''
  // Identité LOGIQUE de la vue courante, découplée de l'id du Sankey de la DA. Nécessaire
  // pour les vues light qui RÉUTILISENT la DA maître (pas de rebuild) : sans ce champ, une
  // vue light serait confondue avec le maître (is_view_master, navigation, suppression…).
  // Pour une vue heavy, vaut l'id du Sankey de la DA ; pour master, default_main_sankey_id.
  protected _current_view_id: string = default_main_sankey_id
  public get current_view_id() { return this._current_view_id }
  // Setters exposés pour ViewsManager (#244) : le service porte les méthodes de vues mais
  // l'état vit encore sur cette classe (accédé via l'interface hôte).
  public set current_view_id(v: string) { this._current_view_id = v }
  public get master_drawing_area() { return this._master_drawing_area }
  public set master_drawing_area(master) { this._master_drawing_area = master }

  protected _original_current_view: Class_DrawingArea | undefined
  public get original_current_view() { return this._original_current_view }
  public set original_current_view(v) { this._original_current_view = v }
  public get waiting_to_set_view() { return this._waiting_to_set_view }
  public set waiting_to_set_view(v: string | undefined) { this._waiting_to_set_view = v }

  /** Réinitialise l'historique undo/redo (appelé par ViewsManager au switch de vue). */
  public resetHistory(): void {
    this._history = new Class_ApplicationHistory(this._menu_configuration!)
  }

  protected _list_color_palette: string[] = [
    'custom',
    'jet',
    'hsv',
    'hot',
    'cool',
    'spring',
    'summer',
    'autumn',
    'winter',
    'bone',
    'copper',
    'greys',
    'YIGnBu',
    'greens',
    'YIOrRd',
    'bluered',
    'RdBu',
    'picnic',
    'rainbow',
    'portland',
    'blackbody',
    'earth',
    'electric',
    'viridis',
    'inferno',
    'magma',
    'plasma',
    'warm',
    'cool',
    'rainbow-soft',
    'bathymetry',
    'cdom',
    'chlorophyll',
    'density',
    'freesurface-blue',
    'freesurface-red',
    'oxygen',
    'par',
    'phase',
    'salinity',
    'temperature',
    'turbidity',
    'velocity-blue',
    'velocity-green',
    'cubehelix',
  ]


  /**
   * Override all possible attr to update in copyFrom
   *
   * @protected
   * @type {string[]}
   * @memberof Class_ApplicationDataOSP
   */
  protected get _transform_layout_all_attr(): string[] {
    return [...super._transform_layout_all_attr, ...this._layout_groups['allOSP']]
  }

  protected get _layout_groups(): Record<string, string[]> {
    return {
      ...super._layout_groups,
      allOSP: ['icon_catalog', 'copyViews'],
    }
  }

  // PRIVATE ATTRIBUTES =================================================================

  private _logo_sankey_plus: string = ''
  private _logo_sankey_suite: string = ''

  private _waiting_to_set_view: string | undefined

  private _user_preferences = { color: [] as { name: string, colors: string[] }[], tags: { nodeTaggs: {}, flowTaggs: {}, dataTaggs: {} } }


  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataOSP.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataOSP
   */
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    super(published_mode, options)

    // Assign master in views
    this._views = {}


    // Get OpenSankey+ logo
    this._logo_sankey_plus = 'logos/logo_opensankeyplus.png'
    // Get SankeySuite logo (next tier above OS+)
    this._logo_sankey_suite = 'logos/logo_OSS.png'

    if (this.has_sankey_plus && !this._drawing_area.static) {
      // Update user palette when connected
      const path = window.location.origin
      const url = path + '/user/get_preference'
      const fetchData = {
        method: 'POST',
      }
      fetch(url, fetchData).then(response => {
        response.text()
          .then(text => {
            if (text !== 'Not connected') {
              // En dev sans backend, /user/get_preference peut renvoyer l'index.html
              // du dev server (HTML) au lieu du JSON attendu : ne pas crasher.
              let json_dump
              try {
                json_dump = JSON.parse(text)
              } catch {
                return
              }
              if (json_dump['palette']) {
                this._user_preferences.color = json_dump['palette']
              }
              if (json_dump['icon_catalog']) {
                // Update imported icon in catalog to use user icons
                const ls = localStorage.getItem('icon_imported')
                const icon_ls: { [s: string]: { path: string, Vb: string } } = ls != null && ls !== '' ? JSON.parse(ls) : {}
                const cat_parsed = Object.fromEntries(Object.entries(json_dump['icon_catalog']).map(ent => [ent[0], { path: ent[1], Vb: '0 0 1000 1000' }]))
                const icons = { ...icon_ls, ...cat_parsed }
                localStorage.setItem('icon_imported', JSON.stringify(icons))
              }
            }
          })
      })
    }
  }

  public createNewMenuConfiguration(toast: CreateToastFnReturn | null = null) {
    this._toast = toast
    this._menu_configuration = new Class_MenuConfigOSP()
    this._history = new Class_ApplicationHistory(this._menu_configuration)

    return this._menu_configuration
  }

  public createNewDrawingArea(id?: string) {
    const drawing_area = new Class_DrawingAreaOSP(
      this,
      id
    )
    return drawing_area
  }

  /**
   * Override function from Class_ApplicationData, to reset views before reseting normally
   *
   * @memberof Class_ApplicationDataOSP
   */
  public reset(kwargs?: Type_JSON): void {
    if ((kwargs && kwargs['only_current_view']) && this.has_views && this._master_drawing_area != undefined && this._drawing_area.id != default_main_sankey_id) {
      this.drawing_area.purgeSelection()
      this.drawing_area.unDraw()
      this._drawing_area = this.createNewDrawingArea(this._drawing_area.id)
    } else {
      delete this._master_drawing_area
      this._views = {}
      this._views_order = []
      this._heredited_attr = {}
      this._current_view_id = default_main_sankey_id
      super.reset(kwargs)
    }
  }

  /**
   * Reset data & delete application data in navigator cache   *
   * @memberof Class_ApplicationDataOSP
   */
  public override reinitialization(redraw: boolean = true): void {
    super.reinitialization(redraw)
    localStorage.removeItem('icon_imported')
    sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
  }

  // SAVING METHODS =====================================================================

  /**
   * Convert application_data to JSON format,
   * if we are in a view switch to master then save master then the view
   *
   * @param {boolean} [with_view=true]
   * @return {*}
   * @memberof Class_ApplicationDataOSP
   */
  protected _toJSON(kwargs: Type_JSON) {
    let json_entry: Type_JSON = {}
    if (!this.has_views) {
      return super._toJSON(kwargs)
    }
    //save current view
    // Vue light : la DA courante EST le maître (pas d'entrée _views propre, pas de géométrie
    // propre) => on ne sauvegarde pas son json. Indexer par l'identité LOGIQUE, pas l'id DA.
    if (!this.is_view_master && !this._views[this._current_view_id]?.is_light) {
      this._views[this._current_view_id].json = compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(this._drawing_area as Class_DrawingAreaOSP, kwargs))
      this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    }

    // If we are in a view & the option only_current_view is at true then we export to JSON only the current view
    // (une vue light n'a pas de données propres => on retombe sur l'export complet master+vues)
    if (kwargs && kwargs['only_current_view'] &&
      !this.is_view_master && !this._views[this._current_view_id]?.is_light
    ) {
      json_entry = super._toJSON()
      json_entry.id = default_main_sankey_id
      return json_entry
    }
    // Herited toJSON to save master data
    json_entry = DrawingAreaPersistenceOSP.toJSON(this._master_drawing_area! as Class_DrawingAreaOSP, kwargs)
    // Champ doc markdown global (niveau application_data) : ce chemin « avec vues » n'appelle pas
    // super._toJSON, donc on le sérialise explicitement au niveau racine/master.
    const doc_serialized = serializeDocMarkdown(this._documentation_markdown)
    if (doc_serialized !== undefined) json_entry['documentation_markdown'] = doc_serialized
    if (Object.keys(this._documentation_images).length > 0) json_entry['documentation_images'] = this._documentation_images
    // Paramètres de publication (niveau application_data) : ce chemin « avec vues » n'appelle pas
    // super._toJSON, donc on les sérialise explicitement au niveau racine/master.
    if (Object.keys(this._publish_settings).length > 0) json_entry['publish_settings'] = this._publish_settings
    // État d'affichage de la grande zone (panneaux visibles + layout) : même raison, sérialisé ici.
    json_entry['main_zone'] = this.menu_configuration.mainZoneStateToJSON()
    // Vue active au moment de la sauvegarde : relue par viewsFromJSON pour la rouvrir/sélectionner
    // au chargement (sinon retombe toujours sur le master). id du master => default_main_sankey_id.
    json_entry['current_view'] = this._current_view_id
    // Option « maître dans la liste des vues » + son libellé éditable (métadonnées de niveau
    // application_data, comme current_view). Lues par viewsFromJSON.
    json_entry['show_master_in_views'] = this._show_master_in_views
    if (this._master_view_name) json_entry['master_view_name'] = this._master_view_name
    // If application_data has views then we save them in the JSON
    json_entry['views'] = {}
    const json_entry_views = json_entry['views']
    // Go throught all view (except first since it's master data & already parsed in JSON)
    this._views_order.forEach(id => {
      json_entry_views[id] = JSON.parse(pako.inflate(this._views[id].json, { to: 'string' }));
      (json_entry_views[id] as Type_JSON)['name'] = this._views[id].name
      if (Object.keys(this._heredited_attr[id] ?? {}).length > 0) (json_entry_views[id] as Type_JSON)['heredited_attr'] = this._heredited_attr[id]
      // Concept unifié vue ⊕ viewtag : sélection de visibilité + nature light de la vue.
      const tag_selection = this._views[id].tag_selection
      if (tag_selection && Object.keys(tag_selection).length > 0) (json_entry_views[id] as Type_JSON)['tag_selection'] = tag_selection
      if (this._views[id].is_light) (json_entry_views[id] as Type_JSON)['is_light'] = true
      if (this._views[id].generated_from_group_id) (json_entry_views[id] as Type_JSON)['generated_from_group_id'] = this._views[id].generated_from_group_id
      // Une vue light n'a pas de géométrie propre (json minimal) : pas d'extraction possible
      // ni utile en mode « visible only ». On conserve son json minimal + ses champs unifiés.
      if (kwargs && kwargs['save_only_visible_elements'] && !this._views[id].is_light) {
        // #244 : sérialiser une DA temporaire au lieu de basculer this._drawing_area.
        // L'ancien extractViewFromJSON en boucle laissait l'app pointée sur la dernière
        // vue itérée (et détruisait la DA affichée via unDraw) — une sauvegarde
        // « éléments visibles » corrompait donc la vue courante.
        const view_da = this._views_manager.buildDrawingAreaFromViewJSON(this._views[id].json, id)
        json_entry_views[id] = DrawingAreaPersistenceOSP.toJSON(view_da as Class_DrawingAreaOSP, kwargs)
        view_da.delete()
      }
    })

    return json_entry
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    if (kwargs && kwargs['only_current_view']) {
      // Vue light : pas de json propre (géométrie = maître) => rien à écrire. Indexer par
      // l'identité LOGIQUE, pas l'id du Sankey de la DA (qui vaut le maître pour une light).
      if (!this.is_view_master && !this._views[this._current_view_id]?.is_light) {
        const current_view_id = this._current_view_id
        json_object['id'] = current_view_id
        this.views_dict[current_view_id].json = compressJSONToGzip(json_object)
      }
    }
    //super._fromJSON(json_object, kwargs)
    DrawingAreaPersistenceOSP.fromJSON(this._drawing_area as Class_DrawingAreaOSP, json_object, kwargs)
    this._file_name = getStringFromJSON(json_object, 'name_file', this._file_name)
    // Champ global : on préserve la valeur courante si la clé est absente (ex. switch de vue avec
    // only_current_view où le json ne porte que la vue, pas les métadonnées master).
    if (json_object['documentation_markdown'] !== undefined) {
      this._documentation_markdown = parseDocMarkdown(
        json_object['documentation_markdown'],
        json_object['language'] as string | undefined
      )
    }
    const imgs = json_object['documentation_images']
    if (imgs && typeof imgs === 'object') this._documentation_images = imgs as { [id: string]: string }
    // Paramètres de publication : préservés si la clé est absente (ex. switch de vue only_current_view).
    const pub_opts = json_object['publish_settings']
    if (pub_opts && typeof pub_opts === 'object' && !Array.isArray(pub_opts)) {
      this._publish_settings = pub_opts as Type_JSON
    }
    // Restaure l'état d'affichage de la grande zone (absent => valeur courante préservée, ex. switch
    // de vue only_current_view qui ne porte pas les métadonnées master).
    const mz = json_object['main_zone']
    // Garde défensive (cf. ApplicationData._fromJSON) : menu_configuration peut ne pas être
    // encore initialisé (créé via un hook React) ; le `?.` évite d'avorter tout le chargement.
    if (mz && typeof mz === 'object') this.menu_configuration?.mainZoneStateFromJSON(mz as Type_JSON)

    if (kwargs && kwargs['only_current_view']) {
      return
    }
    this._views_manager.viewsFromJSON(json_object)
    // Migration « tout est une vue nommée » : génère les vues light manquantes depuis les
    // groupes de view tags activés. Lancée ici (et non dans viewsFromJSON qui retourne tôt
    // sans clé 'views') pour couvrir aussi les fichiers à viewtags sans vues OSP. Idempotente.
    this._views_manager.migrateViewTagsToViews()
  }
  public viewsFromJSON(json_object: Type_JSON) { this._views_manager.viewsFromJSON(json_object) }

  /**
   * Update current drawing area data from a json_object
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _updateFromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    super._updateFromJSON(json_object, kwargs)
    // Identité LOGIQUE (pas l'id du Sankey de la DA) ; une vue light n'a pas de json propre.
    if (!this.is_view_master && !this._views[this._current_view_id]?.is_light && (kwargs && kwargs['only_current_view'])) {
      this._views[this._current_view_id].json = compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(this.drawing_area as Class_DrawingAreaOSP, kwargs))
    }
  }

  /**
   * Copy views from a source file into the current application data.
   * Views that already exist (same id) are skipped.
   * Called after applySourceDA when 'copyViews' is in data_var_to_update.
   *
   * @param {Type_JSON} json_object - Raw source JSON (full file, including 'views' key)
   * @memberof Class_ApplicationDataOSP
   */
  public addViewsFromJSON(json_object: Type_JSON): number { return this._views_manager.addViewsFromJSON(json_object) }

  /**
   * Function to add views from a JSON file to current application data
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationDataOSP
   */
  public extractViewFromJSON(json_object: Uint8Array, view_id: string) { this._views_manager.extractViewFromJSON(json_object, view_id) }


  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {Class_ApplicationDataOSP} app_ref
   * @return {*}
   * @memberof Class_ApplicationDataOSP
   */
  protected _keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: Class_ApplicationDataOSP
  ) {
    // Apply first default OS key processing
    super._keyboardEventProcessing(evt, app_ref)

    // Events booleans ----------------------------------------------------------------

    const evtOnDrawingArea = this._isDrawingAreaActive() // Avoid using hotkeys in text-inputs
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const evtModifier = isMac ? evt.metaKey : evt.ctrlKey
    const evtCtrl = evtModifier && (!evt.shiftKey) && (!evt.altKey)
    const evtKeyF7 = (evt.key === 'F7')
    const evtKeyF8 = (evt.key === 'F8')
    const evtKeyF9 = (evt.key === 'F9')
    const evtKeyA = ((evt.key === 'a') || (evt.key === 'A')) && evtOnDrawingArea
    const evtKeyX = ((evt.key === 'x') || (evt.key === 'X')) && evtOnDrawingArea
    const evtCtrlA = evtCtrl && evtKeyA
    const evtCtrlX = evtCtrl && evtKeyX

    // Event to move all selected containers with keyboard arrows --------------------------
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
      evtOnDrawingArea // Avoid using this hotkey in text-inputs
    ) {

      // Deplace les containers sélectionné avec les flèches du clavier
      evt.preventDefault()
      if (evt.key == 'ArrowUp') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_y -= app_ref.drawing_area.grid_size
          container.draw()
        })
      } else if (evt.key == 'ArrowDown') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_y += app_ref.drawing_area.grid_size
          container.draw()
        })
      } else if (evt.key == 'ArrowLeft') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_x -= app_ref.drawing_area.grid_size
          container.draw()
        })
      } else if (evt.key == 'ArrowRight') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_x += app_ref.drawing_area.grid_size
          container.draw()
        })
      }
      // Move all elements so none of them are outside the DA
      this.drawing_area.areaAutoFit()
    }

    // Event to add all visible containers to selection -----------------------------------------

    if (evtCtrlA) {
      // Prevent default event on ctrl + a
      evt.preventDefault()
      // Select all node & links
      app_ref.drawing_area.addAllVisibleElementsToSelection()
    }

    // Event to clone current sankey into a new view --------------------------------------------

    if (this.has_sankey_plus && evtCtrlX) {
      // Prevent default event on ctrl + a
      evt.preventDefault()
      const view_id = makeId('view')
      this.createNewView(view_id, 'Copie de ' + this.drawing_area.name, true)
      this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
      //this._views[view_id].name = 'Copie de ' + this.drawing_area.name
      this.setCurrentView(view_id)
    }

    // Changing view to is_master ---------------------------------------------------------------

    if (evtKeyF7) {
      evt.preventDefault()
      this.setCurrentViewToMaster()
    }

    // Changing view to next or previous --------------------------------------------------------

    if (evtKeyF8) {
      evt.preventDefault()
      this.setCurrentViewToPrev()
    }

    if (evtKeyF9) {
      evt.preventDefault()
      this.setCurrentViewToNext()
    }
  }

  protected override _pre_process_export_svg(): d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | undefined {
    const svg_clone = super._pre_process_export_svg()

    svg_clone?.selectAll('.node_fo').raise() // place correctly image html in in node <g> to avoid problem at export

    return svg_clone
  }

  // SPECIFIC FUNCTIONS ******************************************************************/

  protected override _isDrawingAreaActive() {
    const superVal = super._isDrawingAreaActive()
    const inputs = ['ql-editor']
    if (
      document.activeElement &&
      inputs.indexOf(document.activeElement.className.toLowerCase()) !== -1
    ) {
      return false
    }
    return superVal

  }

  // PUBLIC METHODS =====================================================================

  /**
   * Create a new view (sankey) from given sankey
   *
   * @memberof Class_DrawingAreaOSP
   */
  public createNewView(view_id: string, view_name: string, copy: boolean) {
    return this._views_manager.createNewView(view_id, view_name, copy)
  }

  // ====================================================================================
  // CONCEPT UNIFIÉ VUE ⊕ VIEWTAG
  // ------------------------------------------------------------------------------------
  // Une Vue porte une « sélection de visibilité » (tag_selection). Light = seulement une
  // sélection héritée du maître ; heavy = en plus un delta d'override (heredited_attr).
  // Layering : le mécanisme de visibilité reste en OS (hook, via Sankey.view_taggs +
  // Node.viewTagVisibility) ; OSP porte le concept Vue et POSE le filtre au switch.
  // ====================================================================================

  /**
   * Lit les champs du concept unifié (tag_selection / is_light / generated_from_group_id)
   * depuis le JSON d'une vue et les pose sur l'entrée _views correspondante.
   * @protected
   */
  protected _parseViewExtraFields(view_id: string, view_json: Type_JSON) {
    this._views_manager.parseViewExtraFields(view_id, view_json)
  }

  /**
   * Résout un `view_tag_selection` de publication `{ groupe : tag }` (id OU nom) vers l'id d'une
   * VRAIE vue (heavy) si l'un des couples (groupe, tag) en désigne une. Deux stratégies :
   *   1) id déterministe des vues générées/promues depuis un groupe de view tags : `vt__<g>__<t>`.
   *   2) fallback : n'importe quelle vue heavy dont la `tag_selection` contient (group.id → tag.id).
   * Ne renvoie qu'une vue non-light (une vue light se comporte déjà comme un simple filtre viewtag,
   * géré par le chemin de base). `null` si aucune vue heavy ne correspond.
   * @protected
   */
  protected _resolveHeavyViewIdFromViewTagSelection(
    selection: Record<string, string>
  ): string | null {
    return this._views_manager.resolveHeavyViewIdFromViewTagSelection(selection)
  }

  /**
   * Résout une valeur de sélection (nom OU id d'une vue) vers un id de vue. Fusion vue ⊕ viewtag :
   * une vue se sélectionne par identité, indifféremment de son type (light/heavy), comme le
   * sélecteur de vue de la topbar. Ordre de résolution : id exact dans `_views`, puis nom de vue,
   * puis maître (id réservé `default_main_sankey_id` ou son libellé `master_view_name`). `null` si
   * rien ne correspond.
   * @protected
   */
  protected _resolveViewIdFromSelection(selection: string): string | null {
    return this._views_manager.resolveViewIdFromSelection(selection)
  }

  /**
   * Concept unifié vue ⊕ viewtag côté publication. `view_tag_selection` désigne, EXACTEMENT comme
   * le sélecteur de vue de la topbar (cf. `SankeyPlusViews`), une VUE à ouvrir — indifféremment de
   * son type (light/heavy). La valeur d'un couple `{ groupe : valeur }` est résolue en id de vue
   * (id OU nom, cf. `_resolveViewIdFromSelection`) puis ouverte via `setCurrentView`, qui pose déjà
   * la visibilité propre de la vue (tag_selection d'une light, effacement du filtre pour le maître
   * ou une heavy sans sélection). On n'exécute donc PAS en plus le filtre view-tag de base.
   * Replis si la valeur ne correspond à aucune vue : (1) vue heavy dont le couple {groupe:tag}
   * matche, sinon (2) simple filtre de visibilité du view tag (chemin de base) — et si on était sur
   * une autre vue (heavy ré-appliquée en place), on revient au maître pour ne pas superposer le
   * filtre sur la géométrie d'une vue.
   * @memberof Class_ApplicationDataOSP
   */
  public override applyPublishStateOptions(): void {
    const opts = this.publish_options
    let target_view_id: string | null = null
    let view_resolved = false // la valeur désignait une vue => visibilité déjà posée par setCurrentView
    if (opts.view_tag_selection) {
      // 1) valeur = VUE (id OU nom, light/heavy), résolue comme le sélecteur de vue
      for (const value of Object.values(opts.view_tag_selection)) {
        const vid = this._resolveViewIdFromSelection(value)
        if (vid) { target_view_id = vid; view_resolved = true; break }
      }
      // 2) repli : vue heavy désignée par un couple {groupe : tag}
      if (!target_view_id) {
        target_view_id = this._resolveHeavyViewIdFromViewTagSelection(opts.view_tag_selection)
        if (target_view_id) view_resolved = true
      }
      // 3) repli : simple filtre view-tag => si on est sur une AUTRE vue (heavy ré-appliquée en
      //    place), revenir au maître pour ne pas superposer le filtre sur la géométrie d'une vue.
      if (!target_view_id && !this.is_view_master) {
        target_view_id = default_main_sankey_id
      }
    }
    if (target_view_id && target_view_id !== this._current_view_id) {
      this.setCurrentView(target_view_id)
    }
    if (view_resolved) {
      // Vue ouverte comme le sélecteur : ne pas ré-appliquer un filtre view-tag de base par-dessus
      // (double application + warn « tag introuvable » quand la valeur est un id/nom de vue).
      const saved = opts.view_tag_selection
      opts.view_tag_selection = null
      super.applyPublishStateOptions()
      opts.view_tag_selection = saved
    } else {
      super.applyPublishStateOptions()
    }
  }

  /**
   * Action UI : (re)génère les vues light manquantes depuis les groupes de view tags activés
   * (idempotent). Utile après ajout d'une nouvelle étiquette de view tag.
   */
  public syncViewsFromViewTags() { this._views_manager.syncViewsFromViewTags() }

  /** True si la vue courante est une vue light (visibilité seule, géométrie héritée du maître). */
  public get is_current_view_light(): boolean { return this._views_manager.is_current_view_light }

  public promoteViewToFull(view_id: string) { this._views_manager.promoteViewToFull(view_id) }

  /**
   * Function to generate a unitary sankey from a node.
   * 
   * An unitary sankey is a sub-sankey containing one node and it's input/ouput
   *
   * @param {Class_NodeElement} node_ref
   * @memberof Class_ApplicationDataOSP
   */


  public setCurrentView(id: string) { this._views_manager.setCurrentView(id) }

  public setCurrentViewToMaster() {
    if (!this.is_view_master) {
      this.setCurrentView(default_main_sankey_id)
    }
  }

  public setCurrentViewToNext() {
    if (this.has_views && this.has_view_after) {
      const order = this.views_navigation_order
      const idx = order.indexOf(this._current_view_id)
      this.setCurrentView(order[idx + 1])
    }
  }

  public setCurrentViewToPrev() {
    if (this.has_views && this.has_view_before) {
      const order = this.views_navigation_order
      const idx = order.indexOf(this._current_view_id)
      this.setCurrentView(order[idx - 1])
    }
  }

  /**
   * Delete current view
   *
   * @memberof Class_ApplicationDataOSP
   */
  public deleteCurrentView() { this._views_manager.deleteCurrentView() }

  /** Delete view from applicationData & go to master */
  public deleteView(id: string) { this._views_manager.deleteView(id) }

  /**
   * Move up view id in _views_order
   *
   * @param {string} id id of the view to move
   * @memberof Class_ApplicationDataOSP
   */
  public moveViewUpInOrder(id: string) { this._views_manager.moveViewUpInOrder(id) }

  /**
   * Move down view id in _views_order
   *
   * @param {string} id id of the view to move
   * @memberof Class_ApplicationDataOSP
   */
  public moveViewDownInOrder(id: string) { this._views_manager.moveViewDownInOrder(id) }

  /**
   * Reset current view with the one in the temporary variable
   *
   * @memberof Class_ApplicationDataOSP
   */
  public resetViewWithOriginal() { this._views_manager.resetViewWithOriginal() }

  /**
   * Rafraîchit le cache compressé de la vue courante après des mutations in-place sur sa DA
   * (ex. réconciliation) pour que le cache utilisé par le switch/la sauvegarde soit à jour.
   */
  public override saveCurrentViewToCache(): void { this._views_manager.saveCurrentViewToCache() }

  public saveBeforeChangingView() { this._views_manager.saveBeforeChangingView() }

  /**e
   * Function used to push view id in order array,
   * it check if the id isn't already in order because duplicate id can cause so issue when navigating views
   *
   * @param {string} id
   * @memberof Class_ApplicationDataOSP
   */
  public pushViewIdInViewOrder(id: string) { this._views_manager.pushViewIdInViewOrder(id) }

  // GETTERS / SETTERS ==================================================================
  public get logo_sankey_plus(): string { return this._logo_sankey_plus }
  public get logo_sankey_suite(): string { return this._logo_sankey_suite }




  // Override getter & setter so we can get new type
  public get menu_configuration_osp(): Class_MenuConfigOSP { return this._menu_configuration as Class_MenuConfigOSP }
  public set menu_configuration_osp(_) { this._menu_configuration = _ }


  public get views_dict() { return this._views }
  public get heredited_attr() { return this._heredited_attr }

  public get show_master_in_views() { return this._show_master_in_views }
  public set show_master_in_views(v: boolean) { this._show_master_in_views = v }
  // Libellé brut du maître dans la liste des vues (vide = libellé par défaut appliqué côté UI).
  public get master_view_name() { return this._master_view_name }
  public set master_view_name(v: string) { this._master_view_name = v }

  // Ordre de navigation entre vues (flèches Préc./Suiv. + sélecteur) : le maître y figure en
  // tête UNIQUEMENT si show_master_in_views est actif. Sinon on garde la liste des vues seule
  // (le maître reste atteignable via setCurrentViewToMaster, mais n'est pas dans la liste).
  public get views_navigation_order(): string[] { return this._views_manager.views_navigation_order }

  public get master_view(): Class_DrawingArea | undefined { return this._views_manager.master_view }

  public get has_views(): boolean { return this._views_manager.has_views }

  public get is_view_master(): boolean { return this._views_manager.is_view_master }

  public get has_view_before(): boolean { return this._views_manager.has_view_before }

  public get has_view_after(): boolean { return this._views_manager.has_view_after }

  public get has_master_sankey(): boolean { return this._views_manager.has_master_sankey }

  public get list_color_palette(): string[] {
    return this._list_color_palette
  }

  public get user_preferences() { return this._user_preferences }

  public get layout_view_sources(): Array<{ id: string, name: string }> { return this._views_manager.layout_view_sources }

  /** Doc markdown `view://<id>` links : activer la vue ciblée (no-op si l'id n'existe plus). */
  public navigateToView(id: string): void { this._views_manager.navigateToView(id) }

  public getDrawingAreaFromViewId(id: string): Class_DrawingArea | undefined { return this._views_manager.getDrawingAreaFromViewId(id) }

  public loadDrawingAreaFromJSON(drawing_area: Class_DrawingArea, json_object: Type_JSON): void {
    DrawingAreaPersistenceOSP.fromJSON(drawing_area as Class_DrawingAreaOSP, json_object)
  }

}
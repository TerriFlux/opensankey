import * as d3 from '../deps/OpenSankey/d3Modules'
import { CreateToastFnReturn } from '@chakra-ui/react'
import pako from 'pako'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { default_main_sankey_id, getBooleanFromJSON, getJSONOrUndefinedFromJSON, getStringFromJSON, makeId, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { serializeDocMarkdown, parseDocMarkdown } from '../deps/OpenSankey/Persistence/persistenceMigrations'
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { Class_ApplicationHistory } from '../deps/OpenSankey/types/ApplicationHistory'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from './DrawingAreaOSP'
import { compressJSONToGzip } from '../deps/OpenSankey/Persistence/UniversalJSONCompression'
import { convert_data_plus_legacy } from '../components/UtilsOSP'
import { updateFrom } from '../deps/OpenSankey/Algorithms/UpdateFrom'
import { isTrialActive } from '../utils/trial'

/**
 * Override some Class_ApplicationData behaviors for OpenSankey+
 * @export
 * @class Class_ApplicationDataOSP
 * @extends {Class_ApplicationData}
 */
export class Class_ApplicationDataOSP extends Class_ApplicationData {

  public override static_path: string = 'static/sankeyanimation'

  /**
   * OpenSankey+ free trial: as long as the 30-day trial is active, grant OS+
   * access regardless of the underlying licence flag. A real licence (set via
   * `has_sankey_plus = true` from the auth layer) always wins on its own merit;
   * the trial only adds access, never removes it.
   */
  public override get has_sankey_plus(): boolean {
    return this._has_sankey_plus || this.is_static || isTrialActive()
  }
  public override set has_sankey_plus(_: boolean) { this._has_sankey_plus = _ }

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

  protected _master_drawing_area: Class_DrawingArea | undefined
  protected _views: {
    [id: string]: {
      name: string
      json: Uint8Array
      // Sélection de visibilité portée par la vue (concept unifié vue ⊕ viewtag).
      // { [view_tagg_id]: selected_label_id }. Absent/vide = vue complète (aucun filtre).
      // Appliquée sur le Sankey OS au switch via _applyViewTagSelection (le mécanisme de
      // visibilité reste en OS : hook ; le concept Vue/sélection vit ici, en OSP).
      tag_selection?: { [view_tagg_id: string]: string }
      // Vue « light » : pas d'override géométrie/style propre, seulement une sélection de
      // visibilité héritée du maître. Promotion light→heavy = acquisition d'un delta d'override.
      is_light?: boolean
      // Si la vue a été auto-générée par la migration depuis un groupe de view tags,
      // l'id de ce groupe (idempotence : ne pas régénérer).
      generated_from_group_id?: string
    }
  }
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
  public get master_drawing_area() { return this._master_drawing_area }
  public set master_drawing_area(master) { this._master_drawing_area = master }

  protected _original_current_view: Class_DrawingArea | undefined

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

  private deleteCurrentOriginalView() {
    if (this._original_current_view !== undefined) {
      this._original_current_view.delete()
      this._original_current_view = undefined
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
        this.extractViewFromJSON(this._views[id].json, id)
        json_entry_views[id] = DrawingAreaPersistenceOSP.toJSON(this._drawing_area as Class_DrawingAreaOSP, kwargs)
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
    this.viewsFromJSON(json_object)
    // Migration « tout est une vue nommée » : génère les vues light manquantes depuis les
    // groupes de view tags activés. Lancée ici (et non dans viewsFromJSON qui retourne tôt
    // sans clé 'views') pour couvrir aussi les fichiers à viewtags sans vues OSP. Idempotente.
    this._migrateViewTagsToViews()
  }
  public viewsFromJSON(json_object: Type_JSON) {
    const views_json = getJSONOrUndefinedFromJSON(json_object, 'views')
    if (!views_json) {
      return
    }
    this._master_drawing_area = this._drawing_area
    this._drawing_area.sankey.setInvisible()
    this._drawing_area.purgeSelection()
    this._drawing_area.unDraw()

    // Option « maître dans la liste des vues » + libellé éditable (rétro-compat : défauts si absents).
    this._show_master_in_views = getBooleanFromJSON(json_object, 'show_master_in_views', false)
    this._master_view_name = getStringFromJSON(json_object, 'master_view_name', '')

    Object.entries(views_json)
      .forEach(([view_id, view_json]) => {
        this.pushViewIdInViewOrder(view_id)
        if (view_id == default_main_sankey_id) return
        this._views[view_id] = {
          name: (view_json as Type_JSON)['name'] as string,
          'json': compressJSONToGzip(view_json as Type_JSON) as Uint8Array
        }
        this._parseViewExtraFields(view_id, view_json as Type_JSON)
        const raw_attr = (view_json as Type_JSON)['heredited_attr']
        if (Array.isArray(raw_attr)) {
          // migration ancien format: heredited_attr était string[], source dans heredited_source_id
          const legacy_src = ((view_json as Type_JSON)['heredited_source_id'] as string | undefined) ?? default_main_sankey_id
          this._heredited_attr[view_id] = { [legacy_src]: raw_attr as string[] }
        } else {
          this._heredited_attr[view_id] = (raw_attr as { [source_id: string]: string[] } | undefined) ?? {}
        }
      })
    let active_view_id = getStringFromJSON(json_object, 'current_view', default_main_sankey_id)
    if (this.is_static && active_view_id == default_main_sankey_id) active_view_id = Object.keys(views_json)[0]
    // current_view peut pointer vers une vue absente (vieux fichier, vue supprimée) => master.
    if (active_view_id == default_main_sankey_id || !this._views[active_view_id]) {
      this._drawing_area.sankey.setVisible()
      return
    }
    // Rouvre le fichier sur la vue active sauvegardée. Vue light => pas de rebuild (réutilise
    // la DA maître) ; vue heavy => extraction du snapshot. Puis pose la sélection de visibilité.
    this._current_view_id = active_view_id
    if (this._views[active_view_id].is_light) {
      this._drawing_area.sankey.setVisible()
    } else {
      this.extractViewFromJSON(this._views[active_view_id].json, active_view_id)
    }
    this._applyViewTagSelection(this._views[active_view_id].tag_selection)
    this._drawing_area.draw()
  }

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
  public addViewsFromJSON(json_object: Type_JSON): number {
    console.log('[addViewsFromJSON] called, json keys:', Object.keys(json_object))
    // Apply OSP legacy conversion in-place before reading 'views'
    convert_data_plus_legacy(json_object)
    console.log('[addViewsFromJSON] after legacy conversion, views key present:', 'views' in json_object)
    const views_json = getJSONOrUndefinedFromJSON(json_object, 'views')
    if (!views_json) {
      console.warn('[addViewsFromJSON] no views key found, aborting')
      return 0
    }
    let added = 0
    console.log('[addViewsFromJSON] views found:', Object.keys(views_json))
    // Ensure master is set on current app
    if (!this._master_drawing_area) {
      console.log('[addViewsFromJSON] setting master_drawing_area')
      this._master_drawing_area = this._drawing_area
    }
    // Register each sub-view from the source file
    Object.entries(views_json).forEach(([view_id, view_json]) => {
      if (view_id === default_main_sankey_id) return
      if (this._views[view_id]) {
        console.log('[addViewsFromJSON] view already exists, skipping:', view_id)
        return
      }
      console.log('[addViewsFromJSON] registering view:', view_id)
      this._views_order.push(view_id)
      this._views[view_id] = {
        name: (view_json as Type_JSON)['name'] as string,
        json: compressJSONToGzip(view_json as Type_JSON) as Uint8Array
      }
      this._parseViewExtraFields(view_id, view_json as Type_JSON)
      const raw_attr = (view_json as Type_JSON)['heredited_attr']
      if (Array.isArray(raw_attr)) {
        const legacy_src = ((view_json as Type_JSON)['heredited_source_id'] as string | undefined) ?? default_main_sankey_id
        this._heredited_attr[view_id] = { [legacy_src]: raw_attr as string[] }
      } else {
        this._heredited_attr[view_id] = (raw_attr as { [source_id: string]: string[] } | undefined) ?? {}
      }
      added++
    })
    // Switch to the active view from the source file if it exists in the imported views
    let active_view_id = getStringFromJSON(json_object, 'current_view', default_main_sankey_id)
    console.log('[addViewsFromJSON] current_view from JSON:', active_view_id)
    if (active_view_id === default_main_sankey_id) active_view_id = Object.keys(views_json).find(id => id !== default_main_sankey_id) ?? default_main_sankey_id
    console.log('[addViewsFromJSON] active_view_id resolved to:', active_view_id, '— exists:', active_view_id in this._views)
    if (active_view_id !== default_main_sankey_id && this._views[active_view_id]) {
      this._current_view_id = active_view_id
      if (this._views[active_view_id].is_light) {
        this._drawing_area.sankey.setVisible()
      } else {
        this.extractViewFromJSON(this._views[active_view_id].json, active_view_id)
      }
      this._applyViewTagSelection(this._views[active_view_id].tag_selection)
      this._drawing_area.draw()
    }
    ;(this.menu_configuration as Class_MenuConfigOSP).updateComponentRelatedToViews()
    console.log('[addViewsFromJSON] done, views_order:', this._views_order)
    return added
  }

  /**
   * Function to add views from a JSON file to current application data
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationDataOSP
   */
  public extractViewFromJSON(json_object: Uint8Array, view_id: string) {
    console.log('Charging ' + view_id)
    const drawing_area_view = this.createNewDrawingArea(view_id)
    drawing_area_view.bypass_redraws = true
    const decompressed_string = pako.inflate(new Uint8Array(json_object), { to: 'string' })
    DrawingAreaPersistenceOSP.fromJSON(drawing_area_view, JSON.parse(decompressed_string))
    //const visible_json = drawing_area_view.toJSON(false,true,false)
    //this._views[view_id].json = compressJSONToGzip(visible_json)
    //drawing_area_view.fromJSON(visible_json)
    // Le chemin de bascule/extraction de vue ne repasse PAS par _afterFromJSON (contrairement
    // à l'ouverture du fichier). Or les nœuds Import/Export d'échange sont TRANSITOIRES : non
    // sérialisés, ils sont régénérés à chaque chargement par splitTrade(). Sans ce split, un
    // simple arrangeTrade n'a rien à placer → les flux d'échange s'affichent sans leurs nœuds
    // Import/Export scindés (bug : ils disparaissent au retour sur une vue heavy). afterFromJSON
    // scinde (idempotent : un nœud d'échange déjà scindé n'a plus de lien) puis arrangeTrade.
    drawing_area_view.afterFromJSON()
    if (this._drawing_area.d3_selection_zoom_area != null) {
      this._drawing_area.unDraw()
    }
    this._drawing_area = drawing_area_view
  }


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
  public createNewView(
    view_id: string,
    view_name: string,
    copy: boolean
  ) {
    // If no view existed previously, we add the active sankey as master sankey
    if (!this.has_views && !this._master_drawing_area) {
      this._master_drawing_area = this._drawing_area//this.createNewDrawingArea(makeId(this._drawing_area.id))
      // this._master_drawing_area.bypass_redraws = true
      // this._master_drawing_area.copyFrom(this._drawing_area)
      // this._master_drawing_area = compressJSONToGzip(this._drawing_area.toJSON(false,false,true))
      // this.pushViewIdInViewOrder(default_main_sankey_id)
    }
    // Create the new sankey
    const new_drawing_area = this.createNewDrawingArea(view_id/*makeId('view')*/)
    new_drawing_area.bypass_redraws = true
    if (copy) DrawingAreaPersistenceOSP.fromJSON(new_drawing_area, DrawingAreaPersistenceOSP.toJSON(this.drawing_area as Class_DrawingAreaOSP)) // /!\ CopyFrom overwrites drawing area's name
    new_drawing_area.name = 'Copie de ' + this.drawing_area.name
    new_drawing_area.sankey.id = view_id
    // Add new sankey to views
    this._views[view_id] = {
      'name': view_name,
      'json': compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(new_drawing_area as Class_DrawingAreaOSP))
    }
    this._heredited_attr[view_id] = {}
    this.pushViewIdInViewOrder(new_drawing_area.id)
    this._drawing_area.sankey.setInvisible()
    this._drawing_area.purgeSelection()
    this._drawing_area.unDraw()
    this.drawing_area = new_drawing_area
    // Nouvelle vue heavy (DA propre) : son identité logique = son id de Sankey.
    this._current_view_id = view_id
    return new_drawing_area
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
    const ts = view_json['tag_selection']
    if (ts && typeof ts === 'object' && !Array.isArray(ts)) {
      this._views[view_id].tag_selection = ts as { [view_tagg_id: string]: string }
    }
    if (view_json['is_light']) this._views[view_id].is_light = true
    const gfg = view_json['generated_from_group_id']
    if (typeof gfg === 'string') this._views[view_id].generated_from_group_id = gfg
  }

  /**
   * Applique la sélection de visibilité d'une vue sur le Sankey OS courant : pour chaque
   * groupe de view tags, sélectionne l'étiquette demandée + active le mode filtre, ou
   * éteint le filtre si la vue ne contraint pas ce groupe (vue complète). Les groupes
   * unitaires câblés sont laissés à leur propre logique. Bumpe la réactivité OS pour
   * que le cache de visibilité des nœuds/liens soit recalculé.
   * @protected
   */
  protected _applyViewTagSelection(
    selection: { [view_tagg_id: string]: string } | undefined
  ) {
    const sankey = this._drawing_area.sankey
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
      // depuis le maître dessinait une visibilité non stabilisée (switch « avalé ») et il
      // fallait re-sélectionner. On reprend la stabilisation de applyViewTagFilterRedraw.
      sankey.nodeTagsUpdated()
      sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
      sankey.nodes_list.forEach(n => { void n.is_visible })
      sankey.nodes_list.forEach(n => { void n.is_visible })
    }
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
    if (!this.has_views) return null
    const base_sankey = (this._master_drawing_area ?? this._drawing_area).sankey
    for (const [group_key, tag_key] of Object.entries(selection)) {
      const group = base_sankey.view_taggs_list.find(g => g.id === group_key || g.name === group_key)
      if (!group) continue
      const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
      if (!tag) continue
      // 1) id déterministe (migration/promotion depuis un groupe de view tags)
      const gen_id = `vt__${group.id}__${tag.id}`
      if (this._views[gen_id] && !this._views[gen_id].is_light) return gen_id
      // 2) fallback : vue heavy dont la sélection de visibilité désigne ce couple
      for (const [vid, v] of Object.entries(this._views)) {
        if (v.is_light) continue
        if (v.tag_selection && v.tag_selection[group.id] === tag.id) return vid
      }
    }
    return null
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
    if (selection === default_main_sankey_id) return default_main_sankey_id
    if (this._views[selection]) return selection // id exact
    for (const [vid, v] of Object.entries(this._views)) {
      if (v.name === selection) return vid // par nom de vue
    }
    // Le maître n'est pas une entrée de _views : match sur son libellé éditable.
    if (this._master_view_name && selection === this._master_view_name) return default_main_sankey_id
    return null
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
   * Migration « tout est une vue nommée » : pour chaque groupe de view tags activé (hors
   * unitaires), génère une vue light par étiquette (visibilité seule, géométrie héritée du
   * maître). Additive et idempotente (id déterministe + garde d'existence). Bascule en mode
   * multi-vues si le fichier n'en avait pas. Ne change PAS la vue courante (le fichier reste
   * ouvert sur le maître / vue complète).
   * @protected
   */
  protected _migrateViewTagsToViews() {
    // Les vues sont une feature OSP/plus : ne pas injecter de vues dans les fichiers des
    // utilisateurs sans licence (ils gardent le sélecteur viewtag historique).
    if (!this.has_sankey_plus) return
    const base_da = this._master_drawing_area ?? this._drawing_area
    if (!base_da) return
    const sankey = base_da.sankey
    const groups = Object.values(sankey.view_taggs_dict).filter((g) =>
      g.activated &&
      g.id !== 'unitary' && g.id !== 'product_unitary' && g.id !== 'sector_unitary' &&
      g.tags_list.length > 0
    )
    if (groups.length === 0) return
    // Bascule en mode multi-vues si nécessaire (le maître devient la DA de référence).
    if (!this._master_drawing_area) this._master_drawing_area = this._drawing_area
    groups.forEach((group) => {
      group.tags_list.forEach((tag) => {
        const view_id = `vt__${group.id}__${tag.id}`
        if (this._views[view_id]) return // idempotent
        // Vue LIGHT : aucune géométrie propre (réutilise la DA maître en live) => json MINIMAL
        // (id + name), pas de copie du maître. La géométrie ne sera matérialisée qu'à la
        // promotion light→heavy (Phase 3).
        const view_json = { id: view_id, name: tag.name }
        this._views[view_id] = {
          name: tag.name,
          json: compressJSONToGzip(view_json) as Uint8Array,
          tag_selection: { [group.id]: tag.id },
          is_light: true,
          generated_from_group_id: group.id,
        }
        this._heredited_attr[view_id] = {}
        this.pushViewIdInViewOrder(view_id)
      })
    })
  }

  /**
   * Action UI : (re)génère les vues light manquantes depuis les groupes de view tags activés
   * (idempotent). Utile après ajout d'une nouvelle étiquette de view tag. Phase 2.
   */
  public syncViewsFromViewTags() {
    this._migrateViewTagsToViews()
    this.menu_configuration_osp.updateComponentRelatedToViews()
  }

  /** True si la vue courante est une vue light (visibilité seule, géométrie héritée du maître). */
  public get is_current_view_light(): boolean {
    return !!this._views[this._current_view_id]?.is_light
  }

  /**
   * Promotion light → heavy (Phase 3) : « convertir en vue complète ». Matérialise la
   * géométrie courante (celle du maître, qu'une vue light affiche en live) dans un snapshot
   * propre à la vue, puis la marque heavy. À partir de là, la vue a sa propre DA (chemin
   * extractViewFromJSON au switch) et ses éditions de géométrie/style lui sont propres.
   * La sélection de visibilité (tag_selection) est conservée.
   */
  public promoteViewToFull(view_id: string) {
    const view = this._views[view_id]
    if (!view || !view.is_light) return
    if (!this._master_drawing_area) return
    const snap = DrawingAreaPersistenceOSP.toJSON(this._master_drawing_area as Class_DrawingAreaOSP)
    view.json = compressJSONToGzip({ ...snap, id: view_id, name: view.name }) as Uint8Array
    view.is_light = false
    // Si la vue promue est la vue courante, la recharger via le chemin heavy pour que les
    // éditions visent désormais sa DA propre (et non le maître partagé).
    if (this._current_view_id === view_id) {
      this.setCurrentView(view_id)
    }
    this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration_osp.updateComponentRelatedToViews()
  }

  /**
   * Function to generate a unitary sankey from a node.
   * 
   * An unitary sankey is a sub-sankey containing one node and it's input/ouput
   *
   * @param {Class_NodeElement} node_ref
   * @memberof Class_ApplicationDataOSP
   */


  public setCurrentView(id: string) {
    this._setCurrentView(id)
  }

  protected _setCurrentView(id: string) {
    //if (id in this._views) {
    // Case 1 :
    // Trigger saving view pop-up if changes have been made on a view
    // that is not master view
    if (
      !this.is_view_master &&
      (this._original_current_view !== undefined) &&
      !this.menu_configuration.ref_to_save_in_cache_indicator_value.current
    ) {
      if (this.menu_configuration.ref_to_never_save_view_session_value.current) {
        // Session "ne jamais enregistrer" : discard unsaved changes silently and
        // switch — no modal. Reuse resetViewWithOriginal (restores the clean
        // snapshot, marks saved, then switches to _waiting_to_set_view).
        this._waiting_to_set_view = id
        this.resetViewWithOriginal()
        return
      }
      // In this instruction we prevent normal view changing & save the view we want but ask the user if he want to save current view
      this._waiting_to_set_view = id
      this.menu_configuration_osp.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current(true)
    }
    // Case 2 : Otherwise, just set new view
    else {
      // Mode de position (absolu / proportionnel / échelle adaptée) = état d'affichage GLOBAL
      // du viewer, pas une géométrie propre à la vue. Une vue heavy est reconstruite via
      // extractViewFromJSON et repart du mode persisté dans son JSON → sans ça, passer d'une
      // vue light en « échelle adaptée » à une vue complète perdait le mode. On capture le
      // mode courant (sur la DA sortante) pour le ré-appliquer sur la nouvelle DA plus bas.
      const prev_position_mode = this._drawing_area.sankey.styles_dict['default'].shape_position_type
      this._drawing_area.sankey.setInvisible()
      this._drawing_area.purgeSelection()
      this._drawing_area.unDraw()
      // Vue LIGHT = pas d'override géométrie/style propre : réutilise la DA maître (géométrie
      // héritée), AUCUN rebuild (pas d'extractViewFromJSON), seule la sélection de visibilité
      // change. C'est ce qui rend le switch d'une vue light aussi léger qu'un toggle viewtag.
      const is_light = id !== default_main_sankey_id && !!this._views[id]?.is_light
      // Set-up new sankey
      if (id == default_main_sankey_id || is_light) {
        this._drawing_area = this._master_drawing_area!
        // Le maître peut n'avoir jamais été scindé : quand le fichier s'ouvre directement sur
        // une vue, le _afterFromJSON d'ouverture s'applique à la DA de la vue, pas au maître.
        // On garantit ici la présence des nœuds Import/Export (splitTrade idempotent).
        this._drawing_area.afterFromJSON()
      }
      else this.extractViewFromJSON(this._views[id].json, id)
      //this._drawing_area = this._views[id].drawing_area!
      // Identité LOGIQUE de la vue courante (découplée de l'id du Sankey de la DA, car une
      // vue light réutilise la DA maître). Posée AVANT applyViewTagSelection / les redraws.
      this._current_view_id = id
      this._drawing_area.sankey.setVisible()
      // Set original view in temporary var so it can be used when
      // we change view and don't want to save current modification
      if (id !== default_main_sankey_id && !is_light) {
        // Update view with heredited attr from configured source (master by default)
        this._drawing_area.bypass_redraws = true
        const attrs_by_source = this._heredited_attr[id] ?? {}
        // Apply in cascade following views_order
        ;[default_main_sankey_id, ...this._views_order].forEach((source_id: string) => {
          const attrs = attrs_by_source[source_id]
          if (attrs && attrs.length > 0) {
            const source_da = this.getDrawingAreaFromViewId(source_id)
            if (source_da) updateFrom(this._drawing_area, source_da, attrs)
          }
        })
        // Create a clone of current view's DA
        if (!this.is_static) {
          const clone_drawing_area = this.createNewDrawingArea(makeId(this._drawing_area.id))
          clone_drawing_area.bypass_redraws = true
          clone_drawing_area.copyFrom(this._drawing_area)
          this.deleteCurrentOriginalView()
          this._original_current_view = clone_drawing_area
        }
      } else if (is_light) {
        // Vue light : aucune géométrie propre à sauvegarder => pas de snapshot « original »
        // (sinon le garde de sauvegarde déclencherait à tort une modale au prochain switch).
        this.deleteCurrentOriginalView()
      }
      // Concept unifié vue ⊕ viewtag : applique la sélection de visibilité portée par la
      // vue sur le Sankey OS (pose le filtre que le hook de visibilité OS consomme).
      // Master / vue sans sélection => undefined => efface tout filtre.
      this._applyViewTagSelection(
        id === default_main_sankey_id ? undefined : this._views[id]?.tag_selection
      )
      // Reset to Edition mode
      this._drawing_area.setToModeEdition(false)
      // Préserver le mode de position global à travers le switch : si la nouvelle DA repart
      // d'un mode différent (vue heavy reconstruite depuis son JSON), on ré-applique le mode
      // courant via le setter approprié (capture des références échelle/proportion incluse).
      const new_position_mode = this._drawing_area.sankey.styles_dict['default'].shape_position_type
      if (new_position_mode !== prev_position_mode) {
        if (prev_position_mode === 'scale_adapted') this._drawing_area.setScaleAdaptedMode()
        else if (prev_position_mode === 'proportional') this._drawing_area.setProportionalMode()
        else if (prev_position_mode === 'absolute') this._drawing_area.setAbsoluteMode()
      }
      // Draw new-sankey
      this._drawing_area.sankey.sortNodes()
      this._drawing_area.draw()
      this._drawing_area.recenter()
      //this._drawing_area.areaAutoFit()

      this._drawing_area.orderElementOnDA()
      this._history = new Class_ApplicationHistory(this._menu_configuration!)

      // Update components related to viewss
      this.menu_configuration.updateAllMenuComponents()
      this.menu_configuration_osp.updateComponentRelatedToViews()
      // Update menu save diagram JSON
      this.menu_configuration.updateComponentSaveDiagramJSON()
      this.menu_configuration.updateComponentLoadDiagramJSON()
    }
    //}
  }

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
  public deleteCurrentView() {
    this.deleteView(this._current_view_id) // Remove for view dict
  }

  /**
   * Delete view from applicationData & go to master
   *
   * @param {string} id
   * @memberof Class_ApplicationDataOSP
   */
  public deleteView(id: string) {
    // Check if we are not trying to delete master
    if (this._views[id] !== undefined) {
      // Une vue light réutilise la DA maître : capturer sa nature AVANT suppression de
      // l'entrée pour décider plus bas s'il faut détruire la DA (heavy) ou non (light).
      const was_light = !!this._views[id].is_light
      // Clean
      delete this._views[id] // Remove for view dict
      this._views_order.splice(this._views_order.indexOf(id), 1) // Remove id from view_order
      delete this._heredited_attr[id]
      // Go to master (identité LOGIQUE : la DA d'une vue light est celle du maître)
      if (id == this._current_view_id) {
        this.deleteCurrentOriginalView()
        // NE PAS supprimer la DA d'une vue light (ce serait détruire le maître).
        if (!was_light) {
          this._drawing_area.delete() // Delete view
        }
        this.setCurrentViewToMaster()
        this.menu_configuration.updateAllMenuComponents()
        this.menu_configuration_osp.updateComponentRelatedToViews()
      }
    }
  }

  /**
   * Move up view id in _views_order
   *
   * @param {string} id id of the view to move
   * @memberof Class_ApplicationDataOSP
   */
  public moveViewUpInOrder(id: string) {
    if (id !== default_main_sankey_id) {//Can't move position of master in _views_order
      const idx = this._views_order.indexOf(id)
      if (idx > 1) {//Can't move up a view before master so index of view must be > 1 (view to move up must be after the second element in _views_order)
        this._views_order.splice(idx, 1)
        this._views_order.splice(idx - 1, 0, id)
      }
    }
  }

  /**
   * Move down view id in _views_order
   *
   * @param {string} id id of the view to move
   * @memberof Class_ApplicationDataOSP
   */
  public moveViewDownInOrder(id: string) {
    if (id !== default_main_sankey_id) {//Can't move position of master in _views_order
      const idx = this._views_order.indexOf(id)
      if (idx < this._views_order.length - 1) {//Can't move down a view if it's the last in _views_order
        this._views_order.splice(idx, 1)
        this._views_order.splice(idx + 1, 0, id)
      }
    }
  }

  /**
   * Reset current view with the one in the temporary variable
   *
   * @memberof Class_ApplicationDataOSP
   */
  public resetViewWithOriginal() {
    if (
      (!this.is_view_master) &&
      (this._original_current_view !== undefined)
    ) {
      // Reset drawing area
      this._drawing_area.bypass_redraws = true
      this._drawing_area.sankey.copyFrom(this._original_current_view.sankey)
      this._drawing_area.legend.copyFrom(this._original_current_view.legend)
      // Update indicator
      this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
      // Send to new view
      this.setCurrentView(this?._waiting_to_set_view ?? default_main_sankey_id)
      delete this._waiting_to_set_view
    }
  }

  /**
   * Function to save the current view before changing active view to another one
   *
   * @memberof Class_ApplicationDataOSP
   */
  /**
   * Refresh the compressed per-view cache for the current drawing area. Called
   * after in-place mutations done on the active view's DA (e.g. reconciliation
   * applied via DrawingAreaPersistence.fromJSON) so that the cache used by
   * view-switching and saving reflects the latest state.
   *
   * @memberof Class_ApplicationDataOSP
   */
  public override saveCurrentViewToCache(): void {
    if (!this.has_views) return
    if (this.is_view_master) return
    // Identité LOGIQUE ; une vue light n'a pas de json propre (géométrie = maître).
    const view_id = this._current_view_id
    if (!this._views[view_id] || this._views[view_id].is_light) return
    this._views[view_id].json = compressJSONToGzip(
      DrawingAreaPersistenceOSP.toJSON(this._drawing_area as Class_DrawingAreaOSP)
    )
  }

  public saveBeforeChangingView() {
    // const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    // if (ev.onkeydown) {
    //   ev.onkeydown(tmp)
    // }
    // Vue light : rien à sauvegarder (pas de json propre). Identité LOGIQUE pour la heavy.
    if (!this.is_view_master && !this._views[this._current_view_id]?.is_light) {
      this._views[this._current_view_id].json = compressJSONToGzip(DrawingAreaPersistenceOSP.toJSON(this._drawing_area as Class_DrawingAreaOSP))
      this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    }
    this.setCurrentView(this?._waiting_to_set_view ?? default_main_sankey_id)
    delete this._waiting_to_set_view
  }

  /**e
   * Function used to push view id in order array,
   * it check if the id isn't already in order because duplicate id can cause so issue when navigating views
   *
   * @param {string} id
   * @memberof Class_ApplicationDataOSP
   */
  public pushViewIdInViewOrder(id: string) {
    if (this._views_order.includes(id)) {
      this._views_order.splice(this._views_order.indexOf(id), 1)
    }
    this._views_order.push(id)
  }

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
  public get views_navigation_order(): string[] {
    return this._show_master_in_views
      ? [default_main_sankey_id, ...this._views_order]
      : this._views_order
  }

  public get master_view(): Class_DrawingArea | undefined {
    if (this.has_views)
      if (this.has_master_sankey)
        return this._master_drawing_area
      else
        return undefined
    else
      return this._drawing_area
  }

  public get has_views(): boolean {
    //test if length of _views_order is sup. to 1 because by default there is master sankey
    return (this._views_order.length > 0)
  }

  public get is_view_master(): boolean {
    // Identité LOGIQUE (et non l'id du Sankey de la DA) : une vue light réutilise la DA
    // maître mais n'EST pas le maître.
    return (this._current_view_id === default_main_sankey_id)
  }

  public get has_view_before(): boolean {
    if (this.has_views)
      return (this.views_navigation_order.indexOf(this._current_view_id) > 0)
    else
      return false
  }

  public get has_view_after(): boolean {
    if (this.has_views) {
      const order = this.views_navigation_order
      // indexOf === -1 (courant hors liste, ex. maître non affiché) => Suiv. va vers la 1re vue.
      return (order.indexOf(this._current_view_id) < (order.length - 1))
    } else
      return false
  }

  public get has_master_sankey(): boolean {
    if (this.has_views && this._master_drawing_area != undefined)
      return true
    else
      return false
  }

  public get list_color_palette(): string[] {
    return this._list_color_palette
  }

  public get user_preferences() { return this._user_preferences }

  public get layout_view_sources(): Array<{ id: string, name: string }> {
    if (!this.has_views) return []
    const sources: Array<{ id: string, name: string }> = []
    if (this._master_drawing_area) {
      sources.push({ id: default_main_sankey_id, name: 'Vue principale' })
    }
    this._views_order.forEach(id => {
      if (id !== default_main_sankey_id && this._views[id]) {
        sources.push({ id, name: this._views[id].name })
      }
    })
    return sources
  }

  /** Doc markdown `view://<id>` links : activer la vue ciblée (no-op si l'id n'existe plus). */
  public navigateToView(id: string): void {
    if (id === default_main_sankey_id || this._views[id]) {
      this.setCurrentView(id)
    }
  }

  public getDrawingAreaFromViewId(id: string): Class_DrawingArea | undefined {
    if (id === default_main_sankey_id) return this._master_drawing_area
    if (!(id in this._views)) return undefined
    const tmp_DA = this.createNewDrawingArea('__tmp_layout_source__')
    tmp_DA.bypass_redraws = true
    const decompressed_string = pako.inflate(new Uint8Array(this._views[id].json), { to: 'string' })
    DrawingAreaPersistenceOSP.fromJSON(tmp_DA as Class_DrawingAreaOSP, JSON.parse(decompressed_string))
    return tmp_DA
  }

  public loadDrawingAreaFromJSON(drawing_area: Class_DrawingArea, json_object: Type_JSON): void {
    DrawingAreaPersistenceOSP.fromJSON(drawing_area as Class_DrawingAreaOSP, json_object)
  }

}
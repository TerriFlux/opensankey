// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================
import { useToast } from '@chakra-ui/react'
import pako from 'pako'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { default_main_sankey_id, getJSONOrUndefinedFromJSON, getStringFromJSON, makeId, Type_JSON, default_save_JSON_options, default_open_JSON_options } from '../deps/OpenSankey/types/Utils'
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { Class_ApplicationHistory } from '../deps/OpenSankey/types/ApplicationHistory'
import { Class_IconLibraryOSP } from './IconLibrairieOSP'
import { nodeStyleConfigs, linkStyleConfigs, node_unitary_styles, link_unitary_styles } from '../deps/OpenSankey/Elements/ElementStyle'

import { Type_OpenDiagramOptions, Type_SaveDiagramOptions } from '../deps/OpenSankey/Persistence/SankeyPersistenceTypes'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { Class_DrawingAreaOSP } from './DrawingAreaOSP'
import { Class_MenuConfig } from '../deps/OpenSankey/types/MenuConfig'
import { compressJSONToGzip } from '../deps/OpenSankey/Persistence/UniversalJSONCompression'
import { ExcelOptionType } from '../deps/OpenSankey/components/dialogs/ExcelModalSaver'
import { JSONtoExcel } from '../deps/OpenSankey/Persistence/SankeyPersistence'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      logo: string
    }
  }
export interface Type_SaveDiagramOptionsOSP extends Type_SaveDiagramOptions {
  only_current_view?: boolean
}
export interface Type_OpenDiagramOptionsOSP extends Type_OpenDiagramOptions {
  only_current_view?: boolean
}

// CLASS APPLICATION DATA PLUS **********************************************************

/**
 * Override some Class_ApplicationData behaviors for OpenSankey+
 * @export
 * @class Class_ApplicationDataOSP
 * @extends {Class_ApplicationData}
 */
export class Class_ApplicationDataOSP extends Class_ApplicationData {

  // PUBLIC ATTRIBUTES =================================================================

  // Save JSON options
  public override options_save_json: Type_SaveDiagramOptionsOSP = default_save_JSON_options
  public override options_open_json: Type_OpenDiagramOptionsOSP = {
    only_current_view: false
  }

  // Static path
  public override static_path: string = 'static/sankeyanimation'

  protected _has_sankey_plus: boolean = false
  protected _has_sankey_afm: boolean = false

  protected _master_drawing_area: Class_DrawingArea | undefined
  protected _views: {
    [id: string]: {
      name: string
      json: Uint8Array
    }
  }
  protected _views_order: string[] = []
  public get views_order() { return this._views_order }

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
  protected _transform_layout_all_attr: string[] = [...this.transform_layout_all_attr, 'freeLabels', 'icon_catalog']

  // PRIVATE ATTRIBUTES =================================================================

  private _logo_sankey_plus: string = ''

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
              const json_dump = JSON.parse(text)
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

  /**
   * Save to Excel format
   * @protected
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof Class_ApplicationData
   */
  protected _saveToExcel(
    url_prefix: string,
    save_options: ExcelOptionType
  ) {
    const cur_option = this.options_save_json.only_current_view
    this.options_save_json.only_current_view = true
    JSONtoExcel(
      this._toJSON(),
      url_prefix,
      this._file_name,
      save_options
    )
    this.options_save_json.only_current_view = cur_option
  }

  public createNewMenuConfiguration() {
    this._toast = useToast()
    this._menu_configuration = new Class_MenuConfig()
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
  public createNewIconLibrary() {
    return new Class_IconLibraryOSP()
  }

  /**
   * Override function from Class_ApplicationData, to reset views before reseting normally
   *
   * @memberof Class_ApplicationDataOSP
   */
  protected _reset(): void {
    if (this.options_open_json.only_current_view && this.has_views && this._master_drawing_area != undefined && this._drawing_area.id != default_main_sankey_id) {
      this.drawing_area.purgeSelection()
      this.drawing_area.unDraw()
      this._drawing_area = this.createNewDrawingArea(this._drawing_area.id)
    } else {
      delete this._master_drawing_area
      this._views = {}
      this._views_order = []
      super._reset()
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
  protected _toJSON() {
    let current_view = default_main_sankey_id
    let json_entry: Type_JSON = {}

    if (
      this.has_views &&
      this.options_save_json.only_current_view &&
      !this.is_view_master
    ) {
      // If we are in a view & the option only_current_view is at true then we export to JSON only the current view
      json_entry = super._toJSON()
      json_entry.id = default_main_sankey_id
    }
    else {
      // Else save master then views in a variable in JSON
      if (this.has_views && !this.is_view_master) {
        // Update _original_current_view
        // Since we update the view in master data the view become the 'original_view'
        this.deleteCurrentOriginalView()

        // Create & save a clone of current view's DA
        const clone_drawing_area = this.createNewDrawingArea(makeId(this._drawing_area.id))
        clone_drawing_area.bypass_redraws = true
        clone_drawing_area.copyFrom(this._drawing_area)
        this._original_current_view = clone_drawing_area

        // Save current view id so it we can reset active view as the current one before toJSON
        // It is done so we save first the master then the views in a JSON
        current_view = this._drawing_area.id
        // Set current DA to master so master is save in first
        this._drawing_area.sankey.setInvisible()
        this._drawing_area.purgeSelection()
        this._drawing_area.unDraw()
        this._drawing_area = this._master_drawing_area!
      }

      // Herited toJSON to save master data
      json_entry = super._toJSON()

      if (this.has_views) {
        // If application_data has views then we save them in the JSON
        json_entry['views'] = {}
        const json_entry_views = json_entry['views']
        // Go throught all view (except first since it's master data & already parsed in JSON)
        this._views_order.forEach(id => {
          json_entry_views[id] = JSON.parse(pako.inflate(this._views[id].json, { to: 'string' }))
          if (this.options_save_json.mode_visible_element) {
            this.extractViewFromJSON(this._views[id].json, id)
            json_entry_views[id] = this._drawing_area.toJSON(false, true, false)
          }
        })
        // Set current DA to active view before toJSON
        if (current_view == default_main_sankey_id) this._drawing_area = this._master_drawing_area!
        else this.extractViewFromJSON(this._views[current_view].json, current_view)
      }
    }

    // Add var to remember active view when saved
    if (current_view !== default_main_sankey_id) json_entry['current_view'] = current_view
    return json_entry
  }

  protected _fromJSON(json_object: Type_JSON) {
    if (this.options_open_json.only_current_view) {
      if (!this.is_view_master) {
        const current_view_id = this.drawing_area.id
        json_object['id'] = current_view_id
        this.views_dict[current_view_id ].json = compressJSONToGzip(json_object)
      }
    }
    super._fromJSON(json_object)
    if (this.options_open_json.only_current_view) {
      return
    }

    const views_json = getJSONOrUndefinedFromJSON(json_object, 'views')
    if (!views_json) {
      return
    }
    this._master_drawing_area = this._drawing_area
    this._drawing_area.sankey.setInvisible()
    this._drawing_area.purgeSelection()
    this._drawing_area.unDraw()

    Object.entries(views_json)
      .forEach(([view_id, view_json]) => {
        this.pushViewIdInViewOrder(view_id)
        if (view_id == default_main_sankey_id) return
        this._views[view_id] = {
          name: (view_json as Type_JSON)['name'] as string,
          'json': compressJSONToGzip(view_json as Type_JSON) as Uint8Array
        }
      })
    const active_view_id = getStringFromJSON(json_object, 'current_view', default_main_sankey_id)
    if (active_view_id == default_main_sankey_id) {
      this._drawing_area.sankey.setVisible()
      return
    }
    this.extractViewFromJSON(this._views[active_view_id].json, active_view_id)
  }

  /**
   * Update current drawing area data from a json_object
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _updateFromJSON(json_object: Type_JSON) {
    super._updateFromJSON(json_object)
    if (this.drawing_area.id != default_main_sankey_id && this.options_open_json.only_current_view) {
      this._views[this.drawing_area.id].json = compressJSONToGzip(this.drawing_area.toJSON(false, false, true))
    }
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
    drawing_area_view.fromJSON(JSON.parse(decompressed_string))
    //const visible_json = drawing_area_view.toJSON(false,true,false)
    //this._views[view_id].json = compressJSONToGzip(visible_json)
    //drawing_area_view.fromJSON(visible_json)
    drawing_area_view.nodePositioning.arrangeTrade(false)
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
    const evtCtrl = (evt.ctrlKey || evt.metaKey) && (!evt.shiftKey) && (!evt.altKey)
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
      this.drawing_area.checkAndUpdateAreaSize()
    }

    // Event to add all visible containers to selection -----------------------------------------

    if (evtCtrlA) {
      // Prevent default event on ctrl + a
      evt.preventDefault()
      // Select all node & links
      app_ref.drawing_area.addAllVisibleContainersToSelection()
    }

    // Event to clone current sankey into a new view --------------------------------------------

    if (this._has_sankey_plus && evtCtrlX) {
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
    if (copy) new_drawing_area.fromJSON(this.drawing_area.toJSON(false, false, true)) // /!\ CopyFrom overwrites drawing area's name
    new_drawing_area.name = "Copie de " + this.drawing_area.name
    new_drawing_area.sankey.id = view_id
    // Add new sankey to views
    this._views[view_id] = {
      'name': view_name,
      'json': compressJSONToGzip(new_drawing_area.toJSON(false, false, true))
    }
    this.pushViewIdInViewOrder(new_drawing_area.id)
    this._drawing_area.sankey.setInvisible()
    this._drawing_area.purgeSelection()
    this._drawing_area.unDraw()
    this.drawing_area = new_drawing_area
    return new_drawing_area
  }

  /**
   * Function to generate a unitary sankey from a node.
   * 
   * An unitary sankey is a sub-sankey containing one node and it's input/ouput
   *
   * @param {Class_NodeElement} node_ref
   * @memberof Class_ApplicationDataOSP
   */
  public createUnitaryNewView(node_ref: Class_NodeElement) {
    // If no base sankey is given, we take the currently active sankey
    const base_drawing_area = this._drawing_area
    base_drawing_area.purgeSelection()
    // If no view existed previously, we add the active sankey as master sankey
    if (!this.has_views && !this._master_drawing_area) {
      this._master_drawing_area = this._drawing_area
      this._drawing_area.sankey.setInvisible()
      this._drawing_area.purgeSelection()
      this._drawing_area.unDraw()
    }
    // Create the new sankey
    const new_drawing_area = this.createNewDrawingArea(makeId('unitary_view'))
    new_drawing_area.bypass_redraws = true
    // Copy current sankey
    const name = 'Unitary view of ' + node_ref.name
    const id = new_drawing_area.id
    const keep_siblings = true
    const copy = base_drawing_area.toJSON(keep_siblings, false, true)
    copy.id = id
    new_drawing_area.fromJSON(copy)
    new_drawing_area.name = name

    node_unitary_styles.forEach(style_id => new_drawing_area.sankey.create_node_internal_style(style_id, nodeStyleConfigs))
    link_unitary_styles.forEach(style_id => new_drawing_area.sankey.create_link_internal_style(style_id, linkStyleConfigs))

    new_drawing_area.removeMinimumLinkThickness()
    new_drawing_area.removeMaximumLinkThickness()

    new_drawing_area.filter_label = 0
    new_drawing_area.filter_link_value = 0

    new_drawing_area.containers_list.forEach(cont => {
      new_drawing_area.deleteContainer(cont)
    })

    //let link_value = 1
    new_drawing_area.sankey.links_list
      .forEach(link => {
        // Delete link node not attached to node_ref
        // Compare id instead of object because node_ref come from original DA while links come from copied DA
        // which wouldn't work as intended
        link.resetAttributes()
        if ((link.source.id !== node_ref.id && link.target.id !== node_ref.id) /*|| !visible_links.includes(link.id)*/) {
          new_drawing_area.deleteLink(link)
        } else {
          // Normalize attribute
          link.resetAttributes()
          if (link.source.id == node_ref.id) {
            link.style = [new_drawing_area.sankey.link_styles_dict['LinkOutUnitaryStyle']]
          } else {
            link.style = [new_drawing_area.sankey.link_styles_dict['LinkInUnitaryStyle']]
          }
          // Search for max link value in unitary sankey to re-scale sankey
          //const link_val = link.getMaxValue() ?? 1
          //maxLinkValue = (link_val > maxLinkValue) ? link_val : maxLinkValue
          link.shape_is_recycling = false
        }
      })

    let scale = 0
    new_drawing_area.sankey.nodes_dict[node_ref.id].input_links_list.forEach(l => scale += l.valueCurrent!)
    // Set new scale for unitary sankey
    new_drawing_area.scale = scale / 3

    new_drawing_area.sankey.nodes_list
      .forEach(node => {
        // Delete nodes without IO links
        if (node.links_order.length == 0) {
          new_drawing_area.deleteNode(node)
          return
        }
        if (node.input_links_list.length == 0) {
          node.style = [new_drawing_area.sankey.node_styles_dict['SankeyUnitaryNodeInputStyle']]
        } else if (node.output_links_list.length == 0) {
          node.style = [new_drawing_area.sankey.node_styles_dict['SankeyUnitaryNodeOutputStyle']]
        }
        node.resetAttributes()
        //node.resetPositionAttributes()
      })
    new_drawing_area.sankey.nodes_dict[node_ref.id].style = [new_drawing_area.sankey.node_styles_dict['SankeyUnitaryNodeStyle']]
    new_drawing_area.sankey.default_node_style.position_type = 'parametric'
    new_drawing_area.sankey.node_taggs_list.forEach(tagg => {
      new_drawing_area.sankey.removeTagGroup('node_taggs', tagg)
      tagg.use_colors = false
    })
    new_drawing_area.nodePositioning.computeAutoSankey(false, false)
    new_drawing_area.sankey.nodes_list
      .forEach(node => { node.position_v = -1 })

    new_drawing_area.nodePositioning.computeParametrization(true)
    new_drawing_area.container_activated = false
    // Remove tag group

    new_drawing_area.sankey.flux_taggs_list.forEach(tagg => {
      tagg.use_colors = false
    })
    // new_drawing_area.sankey.level_taggs_list.forEach(tagg => {
    //   new_drawing_area.sankey.removeTagGroup('level_taggs', tagg)
    // })
    new_drawing_area.sankey.data_taggs_list.forEach(tagg => {
      tagg.use_colors = false
    })

    new_drawing_area.sankey.nodes_dict[node_ref.id].resetAttributes()
    new_drawing_area.sankey.nodes_list
      .forEach(node => {

        // Normalize attribute
        node.resetAttributes()
        // Affect style depending on IO
        if (node.input_links_list.length == 0) {
          node.style = [new_drawing_area.sankey.node_styles_dict['SankeyUnitaryNodeInputStyle']]
        } else if (node.output_links_list.length == 0) {
          node.style = [new_drawing_area.sankey.node_styles_dict['SankeyUnitaryNodeOutputStyle']]
        }
        //node.dimensions_as_child.forEach(dim => node.removeDimensionAsChild(dim))
        //node.dimensions_as_parent.forEach(dim => node.removeDimensionAsParent(dim))

      })
    //new_drawing_area.sankey.default_node_style.position.auto_x = true

    new_drawing_area.sankey.nodes_list
      .forEach(node => {
        node.reorganizeIOLinks()
        node.position_y += 50
        node.position_x -= 100
      })
    new_drawing_area.legend.stick_to_drawing = false
    const cont = new_drawing_area.addNewFreeLabel('unitary_container_')

    cont.tied_to_nodes = true
    //cont.margin_from_attached_nodes = 100
    new_drawing_area.sankey.nodes_list.forEach(node => {
      new_drawing_area.attachNodeToCont(node, cont)
    })

    cont.content = '<p class="ql-align-center" style="font-size:40px">' + this.t('view.default_unit_view_name') + ' : <strong>' + node_ref.name + '</strong></p>'

    // Add new sankey to views
    this._views[new_drawing_area.id] = {
      'name' : new_drawing_area.name,
      'json' : compressJSONToGzip(new_drawing_area.toJSON(false, false, true))
    }
    this.pushViewIdInViewOrder(new_drawing_area.id)
    this.setCurrentView(new_drawing_area.id)
    this.menu_configuration_osp.updateComponentRelatedToViews()
  }

  public setCurrentView(id: string) {
    // Embedded in waiting function
    this.sendWaitingToast(
      () => {
        this._setCurrentView(id)
      },
      {
        success: {
          title: this.t('toast.set_view.success.title')
        },
        loading: {
          title: this.t('toast.set_view.loading.title')
        },
        error: {
          title: this.t('toast.set_view.error.title')
        }
      }
    )
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
      // In this instruction we prevent normal view changing & save the view we want but ask the user if he want to save current view
      this._waiting_to_set_view = id
      this.menu_configuration_osp.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current(true)
    }
    // Case 2 : Otherwise, just set new view
    else {
      this._drawing_area.sankey.setInvisible()
      this._drawing_area.purgeSelection()
      this._drawing_area.unDraw()
      // Set-up new sankey
      if (id == default_main_sankey_id) this._drawing_area = this._master_drawing_area!
      else this.extractViewFromJSON(this._views[id].json, id)
      //this._drawing_area = this._views[id].drawing_area!
      this._drawing_area.sankey.setVisible()
      // Set original view in temporary var so it can be used when
      // we change view and don't want to save current modification
      if (id !== default_main_sankey_id) {
        // Update view with attr heredited from master
        this._drawing_area.bypass_redraws = true
        this._drawing_area.updateFrom(this._master_drawing_area!, (this._drawing_area as Class_DrawingAreaOSP).heredited_attr)
        //this._drawing_area.bypass_redraws = false
        this.options_save_json = default_save_JSON_options
        // Create a clone of current view's DA
        if (!this.is_static) {
          const clone_drawing_area = this.createNewDrawingArea(makeId(this._drawing_area.id))
          clone_drawing_area.bypass_redraws = true
          clone_drawing_area.copyFrom(this._drawing_area)
          this.deleteCurrentOriginalView()
          this._original_current_view = clone_drawing_area
        }
      }
      // Reset to Edition mode
      this._drawing_area.setToModeEdition(false)
      // Draw new-sankey
      this._drawing_area.sankey.sortNodes()
      this._drawing_area.draw()
      //this._drawing_area.draw()

      this._drawing_area.legend.posIfFromLegacy() // Function do something only if JSON was from legacy
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
      const idx = this._views_order.indexOf(this._drawing_area.sankey.id)
      this.setCurrentView(this._views_order[idx + 1])
    }
  }

  public setCurrentViewToPrev() {
    if (this.has_views && this.has_view_before) {
      const idx = this._views_order.indexOf(this._drawing_area.sankey.id)
      this.setCurrentView(this._views_order[idx - 1])
    }
  }

  /**
   * Delete current view
   *
   * @memberof Class_ApplicationDataOSP
   */
  public deleteCurrentView() {
    this.deleteView(this._drawing_area.sankey.id) // Remove for view dict
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
      // Clean
      delete this._views[id] // Remove for view dict
      this._views_order.splice(this._views_order.indexOf(id), 1) // Remove id from view_order
      // Got to master
      if (!this.is_view_master) {
        this.deleteCurrentOriginalView()
        this._drawing_area.delete() // Delete view
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
  public saveBeforeChangingView() {
    // const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    // if (ev.onkeydown) {
    //   ev.onkeydown(tmp)
    // }
    this._views[this._drawing_area.id].json = compressJSONToGzip(this._drawing_area.toJSON(false, false, true))
    this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
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


  public get has_sankey_plus() { return this._has_sankey_plus || this.is_static }
  public set has_sankey_plus(_) { this._has_sankey_plus = _ }

  public get has_sankey_afm() { return this._has_sankey_afm || this.is_static }
  public set has_sankey_afm(_) { this._has_sankey_afm = _ }

  // Override getter & setter so we can get new type
  public get menu_configuration_osp(): Class_MenuConfigOSP { return this._menu_configuration as Class_MenuConfigOSP }
  public set menu_configuration_osp(_) { this._menu_configuration = _ }

  public get icon_library(): Class_IconLibraryOSP { return this._icon_library as Class_IconLibraryOSP }

  // Views
  public get views_dict() {
    return this._views
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
    return (this._drawing_area.sankey.id === default_main_sankey_id)
  }

  public get has_view_before(): boolean {
    if (this.has_views)
      return (this._views_order.indexOf(this._drawing_area.sankey.id) > 0)
    else
      return false
  }

  public get has_view_after(): boolean {
    if (this.has_views) {
      return (this._views_order.indexOf(this._drawing_area.sankey.id) < (this._views_order.length - 1))
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

}
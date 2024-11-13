// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// OpenSankey imports
import { Type_SaveDiagramOptions } from '../deps/OpenSankey/dialogs/types/SankeyPersistenceTypes'
import { default_save_JSON_options, isDrawingAreaActive } from '../deps/OpenSankey/types/ApplicationData'
import { default_main_sankey_id, getJSONOrUndefinedFromJSON, getStringFromJSON, makeId, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { Class_AbstractApplicationDataPlus } from './Abstract'

// Local imports
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_LinkElementPlus } from './LinkPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_NodeElementPlus } from './NodePlus'
import { Class_SankeyPlus } from './SankeyPlus'

export interface Type_SaveDiagramOptionsPlus extends Type_SaveDiagramOptions {
  only_current_view?: boolean
}

// CLASS APPLICATION DATA PLUS **********************************************************

/**
 * Override some Class_ApplicationData behaviors for OpenSankey+
 * @export
 * @class Class_ApplicationDataPlus
 * @extends {Class_ApplicationData}
 */
export abstract class Class_ApplicationDataPlus
  <
    Type_GenericDrawingArea extends Class_DrawingAreaPlus<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericSankey extends Class_SankeyPlus<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends Class_AbstractApplicationDataPlus
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {

  // PUBLIC ATTRIBUTES =================================================================

  // Save JSON options
  public override options_save_json: Type_SaveDiagramOptionsPlus = default_save_JSON_options

  // Static path
  public override static_path: string = 'static/sankeyanimation'

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_ApplicationData
   */
  protected _menu_configuration: Class_MenuConfigPlus

  protected _has_sankey_plus: boolean = true // token for sankeyplus (if user is connected with an account)

  protected _views: { [id: string]: Type_GenericDrawingArea } = {}
  protected _views_order: string[] = []

  protected _original_current_view: Type_GenericDrawingArea | undefined

  // PRIVATE ATTRIBUTES =================================================================

  private _logo_sankey_plus: string = ''

  private _waiting_to_set_view: string | undefined

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataPlus.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataPlus
   */
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    super(published_mode, options)

    // OVERRIDE some values for OpenSankey+ purpose
    this._menu_configuration = this.menu_configuration

    // Assign master in views
    this._views[this._drawing_area.id] = this._drawing_area
    this.pushViewIdInViewOrder(this._drawing_area.id)

    // Get OpenSankey+ logo
    let logo_sankey_plus = ''
    try {
      /* eslint-disable */
      // @ts-ignore
      logo_sankey_plus = require('../css/OSP.png')
      /* eslint-enable */
      const path = window.location.href
      if (!path.includes('localhost')) {
        logo_sankey_plus = logo_sankey_plus.replace('static/', this.static_path)
      }
    } catch (expt) {
      console.log('terriflux.png not found')
    }
    this._logo_sankey_plus = logo_sankey_plus
    this._logo = this._logo_sankey_plus
  }

  // PROTECTED METHODS =====================================================================

  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {Class_ApplicationDataPlus} app_ref
   * @return {*}
   * @memberof Class_ApplicationDataPlus
   */
  protected keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: Class_ApplicationDataPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
  ) {
    // Apply first default OS key processing
    super.keyboardEventProcessing(evt, app_ref)

    // Events booleans ----------------------------------------------------------------

    const evtOnDrawingArea = isDrawingAreaActive() // Avoid using hotkeys in text-inputs
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
      isDrawingAreaActive() // Avoid using this hotkey in text-inputs
    ) {

      // Deplace les containers sélectionné avec les flèches du clavier
      evt.preventDefault()
      if (evt.key == 'ArrowUp') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_y -= app_ref.drawing_area.grid_size
        })
      } else if (evt.key == 'ArrowDown') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_y += app_ref.drawing_area.grid_size
        })
      } else if (evt.key == 'ArrowLeft') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_x -= app_ref.drawing_area.grid_size
        })
      } else if (evt.key == 'ArrowRight') {
        app_ref.drawing_area.selected_containers_list.forEach(container => {
          container.position_x += app_ref.drawing_area.grid_size
        })
      }
      // Move all elements so none of them are outside the DA
      this.drawing_area.recenterElements()
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
      // Create a new view from current displayed sankey
      this.createNewView()
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

  // PUBLIC METHODS =====================================================================

  private deleteCurrentOriginalView() {
    if (this._original_current_view !== undefined) {
      this._original_current_view.delete()
      this._original_current_view = undefined
    }
  }

  /**
   * Extract application data attribute from JSON then extract info for  views
   *
   * @memberof Class_ApplicationDataPlus
   */
  public override fromJSON(json_object: Type_JSON): void {
    super.fromJSON(json_object)
    this._drawing_area.bypass_timeout = true
    if (this._drawtimeout !== null) clearTimeout(this._drawtimeout)
    const views = getJSONOrUndefinedFromJSON(json_object, 'views')
    this.deleteCurrentOriginalView()
    if (views) {
      // Save master in view
      this._views[default_main_sankey_id] = this._drawing_area
      this.pushViewIdInViewOrder(default_main_sankey_id)

      // Create other views
      Object.entries(views).forEach(ent_view => {
        const tmp = this.createNewDrawingArea(ent_view[0])
        tmp.bypass_timeout = true
        tmp.fromJSON(ent_view[1] as Type_JSON, false)
        tmp.bypass_timeout = false
        // Add new sankey to views
        this._views[ent_view[0]] = tmp
        this.pushViewIdInViewOrder(ent_view[0])
      })

      // Set view to the one active when saved
      const active_view = getStringFromJSON(json_object, 'current_view', default_main_sankey_id)
      if (active_view != default_main_sankey_id && active_view in this._views) {
        this._drawing_area.bypass_timeout = false
        const idx = this._views_order.indexOf(active_view)
        this.setCurrentView(this._views_order[idx])
      }
    }
    this._drawing_area.bypass_timeout = false
    this._drawing_area.drawElements()
    //this._drawing_area.checkAndUpdateAreaSize()
    this._drawing_area.areaAutoFit()
  }

  /**
   * Function to add views from a JSON file to current application data
   *
   * @param {Type_JSON} json_object
   * @return {*}  {{ [id: string]: Type_GenericDrawingArea }}
   * @memberof Class_ApplicationDataPlus
   */
  public extractViewsFromJSON(json_object: Type_JSON): { [id: string]: Type_GenericDrawingArea } {
    const views = getJSONOrUndefinedFromJSON(json_object, 'views')
    const dict_of_view: { [id: string]: Type_GenericDrawingArea } = {}

    if (views) {
      // Create other views
      Object.entries(views).filter(ent => ent[0] !== default_main_sankey_id).forEach(ent_view => {
        const tmp = this.createNewDrawingArea(ent_view[0])
        tmp.fromJSON(ent_view[1] as Type_JSON, false)
        // Add new DA to views
        this._views[ent_view[0]] = tmp
        this.pushViewIdInViewOrder(ent_view[0])
      })

      this._views_order = Array.from(new Set([...this._views_order]))
    }
    return dict_of_view
  }

  /**
   * Convert application_data to JSON format,
   * if we are in a view switch to master then save master then the view
   *
   * @param {boolean} [with_view=true]
   * @return {*}
   * @memberof Class_ApplicationDataPlus
   */
  public toJSON() {
    let current_view = default_main_sankey_id
    let json_entry: Type_JSON = {}

    if (
      this.has_views &&
      this.options_save_json.only_current_view &&
      !this.is_view_master
    ) {
      // If we are in a view & the option only_current_view is at true then we export to JSON only the current view
      json_entry = super.toJSON()
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
        clone_drawing_area.bypass_timeout = true
        clone_drawing_area.copyFrom(this._drawing_area)
        this._original_current_view = clone_drawing_area

        // Save current view id so it we can reset active view as the current one before toJSON
        // It is done so we save first the master then the views in a JSON
        current_view = this._drawing_area.id
        // Set current DA to master so master is save in first
        this._drawing_area = this._views[default_main_sankey_id]
      }

      // Herited toJSON to save master data
      json_entry = super.toJSON()

      if (this.has_views) {
        // If application_data has views then we save them in the JSON
        json_entry['views'] = {}
        const json_entry_views = json_entry['views']
        // Go throught all view (except first since it's master data & already parsed in JSON)
        this._views_order.filter((id, i) => i !== 0).forEach(id => {
          json_entry_views[id] = this._views[id].toJSON()
        })
        // Set current DA to active view before toJSON
        this._drawing_area = this._views[current_view]
      }
    }

    // Add var to remember active view when saved
    json_entry['current_view'] = current_view
    return json_entry
  }

  /**
   * Create a new view (sankey) from given sankey
   *
   * @memberof Class_DrawingAreaPlus
   */
  public createNewView(
    base_drawing_area: Type_GenericDrawingArea | undefined = undefined
  ) {
    // If no base sankey is given, we take the currently active sankey
    if (base_drawing_area === undefined)
      base_drawing_area = this._drawing_area
    // If no view existed previously, we add the active sankey as master sankey
    if (this.views.length === 0) {
      this._views[default_main_sankey_id] = this._drawing_area
      this.pushViewIdInViewOrder(default_main_sankey_id)
    }
    // Create the new sankey
    const new_drawing_area = this.createNewDrawingArea(makeId('view'))
    // Copy current sankey
    new_drawing_area.copyFrom(base_drawing_area)
    // Add new sankey to views
    this._views[new_drawing_area.id] = new_drawing_area
    this.pushViewIdInViewOrder(new_drawing_area.id)
    // In case we add a new view with an existing key it automatically change in the dict but we need to delete all duplicate in _views_order

    // Shown sankey = new sanke
    this.setCurrentView(new_drawing_area.id)
  }

  public setCurrentView(id: string) {
    if (id in this._views) {
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
        this.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current(true)
      }
      // Case 2 : Otherwise, just set new view
      else {
        // Hide previous diplayed sankey
        this._drawing_area.sankey.setInvisible()
        // Keep current mode in memory
        //const was_mode_edition = this._drawing_area.isInEditionMode()
        // Purge selections to avoid modifying unvisible view
        this._drawing_area.purgeSelection()
        // Undraw prev sankey
        this._drawing_area.unDraw()
        // Set-up new sankey
        this._drawing_area = this._views[id]
        this._drawing_area.sankey.setVisible()
        // Set original view in temporary var so it can be used when
        // we change view and don't want to save current modification
        if (id !== default_main_sankey_id) {
          // Update view with attr heredited from master
          this._drawing_area.updateFrom(this._views[default_main_sankey_id], this._drawing_area.heredited_attr)
          this.options_save_json = default_save_JSON_options
          // Create a clone of current view's DA
          const clone_drawing_area = this.createNewDrawingArea(makeId(this._drawing_area.id))
          clone_drawing_area.bypass_timeout = true
          clone_drawing_area.copyFrom(this._drawing_area)
          // Save clone
          this.deleteCurrentOriginalView()
          this._original_current_view = clone_drawing_area
        }
        // Draw new-sankey
        this._drawing_area.reset()
        this.drawing_area.areaAutoFit()
        // Set view mode_edition to previous value
        this._drawing_area.setToModeEdition(false)
        // Update components related to viewss
        this._menu_configuration.updateAllMenuComponents()
        this._menu_configuration.updateComponentRelatedToViews()
        // Update menu save diagram JSON
        this.menu_configuration.updateComponentSaveDiagramJSON()
      }
    }
  }

  public setCurrentViewToMaster() {
    if (this.has_views && !this.is_view_master) {
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
   * @memberof Class_ApplicationDataPlus
   */
  public deleteCurrentView() {
    this.deleteView(this._drawing_area.sankey.id) // Remove for view dict
  }

  /**
   * Delete view from applicationData & go to master
   *
   * @param {string} id
   * @memberof Class_ApplicationDataPlus
   */
  public deleteView(id: string) {
    // Check if we are not trying to delete master
    if (id in this._views) {
      // Clean
      delete this._views[id] // Remove for view dict
      this._views_order.splice(this._views_order.indexOf(id), 1) // Remove id from view_order
      // Got to master
      if (!this.is_view_master) {
        this.deleteCurrentOriginalView()
        this._drawing_area.delete() // Delete view
        this.setCurrentViewToMaster()
      }
    }
  }

  /**
   * Move up view id in _views_order
   *
   * @param {string} id id of the view to move
   * @memberof Class_ApplicationDataPlus
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
   * @memberof Class_ApplicationDataPlus
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
   * @memberof Class_ApplicationDataPlus
   */
  public resetViewWithOriginal() {
    if (
      (!this.is_view_master) &&
      (this._original_current_view !== undefined)
    ) {
      // Reset drawing area
      this._drawing_area.sankey.delete() // delete to avoid conflicts
      this._drawing_area.copyFrom(this._original_current_view)
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
   * @memberof Class_ApplicationDataPlus
   */
  public saveBeforeChangingView() {
    const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    if (ev.onkeydown) {
      ev.onkeydown(tmp)
    }
    this.setCurrentView(this?._waiting_to_set_view ?? default_main_sankey_id)
    delete this._waiting_to_set_view
  }

  /**
   * Function used to push view id in order array,
   * it check if the id isn't already in order because duplicate id can cause so issue when navigating views
   *
   * @param {string} id
   * @memberof Class_ApplicationDataPlus
   */
  public pushViewIdInViewOrder(id: string) {
    if (!this._views_order.includes(id)) {
      this._views_order.push(id)
    }
  }

  /**
   * Override function from Class_ApplicationData, to reset views before reseting normally
   *
   * @memberof Class_ApplicationDataPlus
   */
  reset(): void {
    this._views = {}
    this._views_order = []
    super.reset()
  }

  // GETTERS / SETTERS ==================================================================

  public get logo(): string { return this._logo_sankey_plus }
  public get logo_sankey_plus(): string { return this._logo_sankey_plus }

  public get has_sankey_plus(): boolean { return this._has_sankey_plus }

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigPlus { return this._menu_configuration as Class_MenuConfigPlus }
  public set menu_configuration(_: Class_MenuConfigPlus) { this._menu_configuration = _ }

  // Views
  public get views(): Type_GenericDrawingArea[] {
    return Object.values(this._views)
  }

  public get master_view(): Type_GenericDrawingArea | undefined {
    if (this.has_views)
      if (this.has_master_sankey)
        return this._views[default_main_sankey_id]
      else
        return undefined
    else
      return this._drawing_area
  }

  public get has_views(): boolean {
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
    if (this.has_views)
      return default_main_sankey_id in this._views
    else
      return false
  }

}
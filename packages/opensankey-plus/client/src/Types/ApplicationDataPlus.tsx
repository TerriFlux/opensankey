// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// OpenSankey imports
import { isDrawingAreaActive } from '../deps/OpenSankey/types/ApplicationData'
import { default_main_sankey_id, getJSONOrUndefinedFromJSON, getStringFromJSON, makeId, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { Class_AbstractApplicationDataPlus } from './Abstract'

// Local imports
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_LinkElementPlus } from './LinkPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_NodeElementPlus } from './NodePlus'
import { Class_SankeyPlus } from './SankeyPlus'

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

  /**
   * Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_ApplicationData
   */
  protected _menu_configuration: Class_MenuConfigPlus

  // PROTECTED ATTRIBUTES ===============================================================

  protected _has_sankey_plus: boolean = true // token for sankeyplus (if user is connected with an account)

  // PRIVATE ATTRIBUTES =================================================================

  private _logo_sankey_plus: string = ''

  protected _views: { [id: string]: Type_GenericDrawingArea } = {}
  protected _views_order: string[] = []

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataPlus.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataPlus
   */
  constructor(published_mode: boolean) {
    super(published_mode)

    // OVERRIDE Drawing_Area & MENU CONFIG TO TAKE INTO ACCOUNT ALL NEW VAR. & FUNCTIONS OF OSP
    // TODO : since we change reference of the app_data, verify we cut all link of previous DA & config with app_data
    this._menu_configuration = new Class_MenuConfigPlus()

    //let logo_sankey_plus = ''
    try {
      /* eslint-disable */
      // @ts-ignore
      _logo_sankey_plus = require('../css/OSP.png')
      /* eslint-enable */
      const path = window.location.href
      if (!path.includes('localhost')) {
        this._logo_sankey_plus = this._logo_sankey_plus.replace('static/', 'static/opensankey/')
      }
    } catch (expt) {
      console.log('terriflux.png not found')
    }
    this.logo = this._logo_sankey_plus
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
    const evtKeyF = ((evt.key === 'f') || (evt.key === 'F')) && evtOnDrawingArea
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

  /**
   * Extract application data attribute from JSON then extract info for  views
   *
   * @memberof Class_ApplicationDataPlus
   */
  public override fromJSON(json_object: Type_JSON): void {
    super.fromJSON(json_object)
    const views = getJSONOrUndefinedFromJSON(json_object, 'views')
    if (views) {
      // Save master in view
      this._views[default_main_sankey_id] = this._drawing_area
      this._views_order.push(default_main_sankey_id)

      // Create other views
      Object.entries(views).forEach(ent_view => {
        const tmp = this.createNewDrawingArea(ent_view[0])
        tmp.fromJSON(ent_view[1] as Type_JSON)
        // Add new sankey to views
        this._views[ent_view[0]] = tmp
        this._views_order.push(ent_view[0])
      })

      // Set view to the one active when saved
      const active_view = getStringFromJSON(json_object, 'current_view', default_main_sankey_id)
      if (active_view != default_main_sankey_id && active_view in this._views) {
        const idx = this._views_order.indexOf(active_view)
        this.setCurrentView(this._views_order[idx])
      }
    }
  }

  /**
   * Convert application_data to JSON format,
   * if we are in a view switch to master then save master then the view
   *
   * @param {boolean} [with_view=true]
   * @return {*} 
   * @memberof Class_ApplicationDataPlus
   */
  toJSON(with_view: boolean = true) {
    let current_view = default_main_sankey_id

    // Save current view id if it's not master
    if (this.has_views && !this.is_view_master) {
      current_view = this._drawing_area.id
      this.setCurrentViewToMaster()
    }
    // Herited toJSON
    const json_entry: Type_JSON = super.toJSON()

    if (this.views.length > 0 && with_view) {
      json_entry['views'] = {}
      const json_entry_views = json_entry['views']
      // Go throught all view (except first since it's master data & already parsed in JSON)
      this._views_order.filter((id, i) => i !== 0).forEach(id => {
        json_entry_views[id] = this._views[id].toJSON()
      })
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
    base_DA: Type_GenericDrawingArea | undefined = undefined
  ) {
    // If no base sankey is given, we take the currently active sankey
    if (base_DA === undefined)
      base_DA = this._drawing_area
    // If no view existed previously, we add the active sankey as master sankey
    if (this.views.length === 0) {
      this._views[default_main_sankey_id] = this._drawing_area
      this._views_order.push(default_main_sankey_id)
    }
    // Create the new sankey
    const new_id = makeId('view')
    const new_DA = this.createNewDrawingArea(new_id)
    // Add new sankey to views
    this._views[new_DA.id] = new_DA
    this._views_order.push(new_DA.id)
    // Shown sankey = new sankey
    this.setCurrentView(new_DA.id)
    // Copy base_DA to new view
    const copy = base_DA.toJSON()
    copy.id = new_id
    new_DA.fromJSON(copy)
  }

  public setCurrentView(id: string) {
    if (id in this._views) {
      // Hide previous diplayed sankey
      this._drawing_area.sankey.setInvisible()
      // this._drawing_area.reset()
      this._drawing_area.unDraw()
      // SHow new sankey
      this._drawing_area = this._views[id]
      this._drawing_area.sankey.setVisible()
      this._drawing_area.reset()
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
    if (this.has_views && !this.has_view_before) {
      const idx = this._views_order.indexOf(this._drawing_area.sankey.id)
      this.setCurrentView(this._views_order[idx - 1])
    }
  }

  public deleteCurrentView() {
    if (this.has_views && !this.is_view_master) {
      delete this._views[this._drawing_area.sankey.id] // Remove for view dict
      this._drawing_area.sankey.delete() // Delete view
      this._drawing_area = this._views[default_main_sankey_id] // Fall back to master view by defaut
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get logo_sankey_plus(): string { return this._logo_sankey_plus }
  public set logo_sankey_plus(value: string) { this._logo_sankey_plus = value }

  public get has_sankey_plus(): boolean { return this._has_sankey_plus }
  public set has_sankey_plus(value: boolean) { this._has_sankey_plus = value }

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigPlus {
    return this._menu_configuration as Class_MenuConfigPlus
  }
  public set menu_configuration(_: Class_MenuConfigPlus) { this._menu_configuration = _ }



  public get views(): Type_GenericDrawingArea[] {
    return Object.values(this._views)
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
    if (this.has_views)
      return (this._views_order.indexOf(this._drawing_area.sankey.id) < (this._views_order.length - 1))
    else
      return false
  }

}
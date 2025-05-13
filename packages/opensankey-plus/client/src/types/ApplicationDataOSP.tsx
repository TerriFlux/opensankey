// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================

// OpenSankey imports
import { Type_SaveDiagramOptions } from '../deps/OpenSankey/components/dialogs/types/SankeyPersistenceTypes'
import { default_save_JSON_options, OSColorPickerProps } from '../deps/OpenSankey/types/ApplicationData'
import { default_main_sankey_id, getJSONOrUndefinedFromJSON, getStringFromJSON, makeId, OSTooltip, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { GetOldDataFromView } from '../components/ConvertOSP'
import { getOldViewsFromJSON } from '../components/UtilsOSP'
import { ClassAbstract_ApplicationDataOSP } from './AbstractOSP'

// Local imports
import { ClassTemplate_DrawingAreaOSP } from './DrawingAreaOSP'
import { ViewType, OSPData } from './LegacyTypes'
import { ClassTemplate_LinkElementOSP } from './LinkOSP'
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { ClassTemplate_NodeElementOSP } from './NodeOSP'
import { ClassTemplate_SankeyOSP } from './SankeyOSP'
import { Class_ApplicationHistory } from '../deps/OpenSankey/types/ApplicationHistory'
import { Class_IconLibraryOSP } from './IconLibrairieOSP'
import { Type_GenericNodeElementOSP } from './TypesOSP'
import { Box } from '@chakra-ui/react'
import React, { CSSProperties, FunctionComponent, useState } from 'react'
import { ColorResult, SketchPicker, SwatchesPicker } from 'react-color'

export interface Type_SaveDiagramOptionsOSP extends Type_SaveDiagramOptions {
  only_current_view?: boolean
}

// CLASS APPLICATION DATA PLUS **********************************************************

/**
 * Override some ClassTemplate_ApplicationData behaviors for OpenSankey+
 * @export
 * @class ClassTemplate_ApplicationDataOSP
 * @extends {ClassTemplate_ApplicationData}
 */
export abstract class ClassTemplate_ApplicationDataOSP
  <
    Type_GenericDrawingArea extends ClassTemplate_DrawingAreaOSP<Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericSankey extends ClassTemplate_SankeyOSP<Type_GenericDrawingArea, Type_GenericNodeElement, Type_GenericLinkElement>,
    Type_GenericNodeElement extends ClassTemplate_NodeElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>,
    Type_GenericLinkElement extends ClassTemplate_LinkElementOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  >
  extends ClassAbstract_ApplicationDataOSP
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericNodeElement,
    Type_GenericLinkElement
  > {

  // PUBLIC ATTRIBUTES =================================================================

  // Save JSON options
  public override options_save_json: Type_SaveDiagramOptionsOSP = default_save_JSON_options

  // Static path
  public override static_path: string = 'static/sankeyanimation'

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof ClassTemplate_ApplicationData
   */
  protected _menu_configuration: Class_MenuConfigOSP

  protected _has_sankey_plus: boolean = true // token for sankeyplus (if user is connected with an account)

  protected _views: { [id: string]: Type_GenericDrawingArea } = {}
  protected _views_order: string[] = []

  protected _original_current_view: Type_GenericDrawingArea | undefined

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
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  protected _transform_layout_all_attr: string[] = [...this.transform_layout_all_attr, 'freeLabels', 'icon_catalog']

  // PRIVATE ATTRIBUTES =================================================================

  private _logo_sankey_plus: string = ''

  private _waiting_to_set_view: string | undefined

  private _user_preferences = { color: [] as { name: string, colors: string[] }[], tags: { nodeTaggs: {}, flowTaggs: {}, dataTaggs: {} } }


  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of ClassTemplate_ApplicationDataOSP.
   * @param {boolean} published_mode
   * @memberof ClassTemplate_ApplicationDataOSP
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
    this._logo_sankey_plus = 'logos/logo_opensankeyplus.png'
    this._logo = this._logo_sankey_plus

    if (this.has_sankey_plus) {
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

  // CLEANING METHODS ===================================================================

  /**
   * Override function from ClassTemplate_ApplicationData, to reset views before reseting normally
   *
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  protected _reset(): void {
    this._views = {}
    this._views_order = []
    super._reset()
  }

  private deleteCurrentOriginalView() {
    if (this._original_current_view !== undefined) {
      this._original_current_view.delete()
      this._original_current_view = undefined
    }
  }

  /**
   * Reset data & delete application data in navigator cache   *
   * @memberof ClassTemplate_ApplicationDataOSP
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
   * @memberof ClassTemplate_ApplicationDataOSP
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
        this._drawing_area = this._views[default_main_sankey_id]
      }

      // Herited toJSON to save master data
      json_entry = super._toJSON()

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

  protected _fromJSON(json_object: Type_JSON): void {
    // Read main json
    super._fromJSON(json_object)
    // Save master in view
    this._views[default_main_sankey_id] = this._drawing_area
    this.pushViewIdInViewOrder(default_main_sankey_id)
    // Read views parts
    // this.deleteCurrentOriginalView() // TODO est-ce vraiment necessaire ?
    this.extractViewsFromJSON(json_object)
    // Set view to the one active when saved
    const active_view_id = getStringFromJSON(json_object, 'current_view', default_main_sankey_id)
    if (
      (active_view_id !== default_main_sankey_id) &&
      (active_view_id in this._views)
    ) {
      this._drawing_area = this._views[active_view_id]
    }
  }


  /**
   * Function to add views from a JSON file to current application data
   *
   * @param {Type_JSON} json_object
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  public extractViewsFromJSON(json_object: Type_JSON) {
    let views = getJSONOrUndefinedFromJSON(json_object, 'views')

    if (!views) {
      const old_views = getOldViewsFromJSON(json_object, 'view') as ViewType[]
      if (old_views && old_views.length > 0) {
        views = {} as Type_JSON
        // Convert old views
        old_views.forEach((v) => {
          if (v.heredited_attr_from_master === undefined) {
            v.heredited_attr_from_master = []
          }
          // Convert old views that are diff to json
          const d_view = GetOldDataFromView(json_object as unknown as OSPData, v.id)
          if (d_view) {
            (views as Type_JSON)[v.id] = d_view as unknown as Type_JSON
          }

          // Set Name of view
          ((views as Type_JSON)[v.id] as Type_JSON).name = v.nom;
          // Set heredited from master attr
          ((views as Type_JSON)[v.id] as Type_JSON).heredited_attr = v.heredited_attr_from_master
        })
      }
    }
    if (views) {
      // Create other views
      Object.entries(views)
        .forEach(([view_id, view_json]) => {
          if (view_id !== default_main_sankey_id) {
            // Create and populate drawing area
            const drawing_area_view = this.createNewDrawingArea(view_id)
            drawing_area_view.bypass_redraws = this.drawing_area.bypass_redraws
            drawing_area_view.fromJSON(view_json as Type_JSON)
            drawing_area_view.arrangeTrade(false)
            // Add new drawing area to views
            this._views[view_id] = drawing_area_view
            this.pushViewIdInViewOrder(view_id)
          }
        })
    }
  }

  /**
 * Function to get a color picker, it override the one from OS by adding user custom palette
 *
 * @param {*} { initialColor, functionOnBlur, isDisabled, textDisabled = '' }
 * @type {FunctionComponent<OSColorPickerProps>}
 * @memberof Class_ApplicationDataSA
 */
  public override OSColorPicker: FunctionComponent<OSColorPickerProps> = ({ initialColor, functionOnBlur, isDisabled, textDisabled = '' }) => {
    const [displayColorPicker, setDisplayColorPicker] = useState(false)
    const [color, setColor] = useState(initialColor)

    // Update swatch color when we change color from outside picker
    if (!displayColorPicker && color !== initialColor) {
      setColor(initialColor)
    }

    /**
     *Event when we click on the 'button
     *
     * @private
     * @memberof OSColorPicker
     */
    const handleClick = () => {
      if (isDisabled !== true)
        setDisplayColorPicker(!displayColorPicker)
    }

    /**
     *Event when we close the picker
     *
     * @private
     * @memberof OSColorPicker
     */
    const handleClose = () => {
      setDisplayColorPicker(false)
      functionOnBlur(color)
    }

    /**
     * event when we change color of picker
     *
     * @private
     * @param {ColorResult} color
     * @memberof OSColorPicker
     */
    const handleChange = (color: ColorResult) => {
      setColor(color.hex)
    }

    // Style of button to open picker, popover containing picker & 'backgroung overlay' that close picker when clicked
    const styles: { [x: string]: CSSProperties; } = {
      color: {
        width: '100%',
        height: '1rem',
        borderRadius: '2px',
        background: `${color}`,
      },
      swatch: {
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        width: '100%',
        height: '1.5rem',
        padding: '5px',
        background: '#fff',
        borderRadius: '1px',
        boxShadow: '0 0 0 1px rgba(124, 104, 104, 0.1)',
        display: 'inline-block',
      },
      popover: {
        position: 'absolute',
        left: '-20%',
        top: '20%',
        zIndex: '2',
      },
      cover: {
        position: 'fixed',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    }
    const list_colors = this._user_preferences.color.map(palette => palette.colors)

    return (<Box>
      <OSTooltip label={isDisabled ? textDisabled : ''}>
        <Box style={styles.swatch} onClick={handleClick}>
          <Box style={styles.color} />
        </Box>
      </OSTooltip>
      {displayColorPicker ? <Box style={styles.popover}>
        <Box style={styles.cover} onClick={handleClose} />
        <Box display={'flex'}>
          <SketchPicker color={color} onChange={handleChange} />
          {this._user_preferences.color.length > 0 ? <SwatchesPicker colors={list_colors} onChange={handleChange} /> : <></>}
        </Box>
      </Box> : null}
    </Box>
    )
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Function to create custom application behavior when we press a key,
   *
   * Note : even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {ClassTemplate_ApplicationDataOSP} app_ref
   * @return {*}
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  protected _keyboardEventProcessing(
    evt: KeyboardEvent,
    app_ref: ClassTemplate_ApplicationDataOSP<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement, Type_GenericLinkElement>
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
   * @memberof ClassTemplate_DrawingAreaOSP
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
    const name = new_drawing_area.name
    new_drawing_area.copyFrom(base_drawing_area) // /!\ CopyFrom overwrites drawing area's name
    new_drawing_area.name = name
    // Add new sankey to views
    this._views[new_drawing_area.id] = new_drawing_area
    this.pushViewIdInViewOrder(new_drawing_area.id)
    // Shown sankey = new sanke
    this.setCurrentView(new_drawing_area.id)
  }

  /**
   * Function to generate a unitary sankey from a node.
   * 
   * An unitary sankey is a sub-sankey containing one node and it's input/ouput
   *
   * @param {Type_GenericNodeElementOSP} node_ref
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  public createUnitaryNewView(node_ref: Type_GenericNodeElementOSP) {
    // If no base sankey is given, we take the currently active sankey
    const base_drawing_area = this._drawing_area
    base_drawing_area.purgeSelection()
    // If no view existed previously, we add the active sankey as master sankey
    if (this.views.length === 0) {
      this._views[default_main_sankey_id] = this._drawing_area
      this.pushViewIdInViewOrder(default_main_sankey_id)
    }
    // Create the new sankey
    const new_drawing_area = this.createNewDrawingArea(makeId('unitary_view'))
    // Copy current sankey
    const name = 'Unitary view of ' + node_ref.name
    const id = new_drawing_area.id
    const copy = base_drawing_area.toJSON()
    copy.id = id
    new_drawing_area.fromJSON(copy) // /!\ CopyFrom overwrites drawing area's name
    new_drawing_area.name = name



    // Edit view

    new_drawing_area.removeMinimumLinkThickness()
    new_drawing_area.removeMaximumLinkThickness()

    new_drawing_area.filter_label = 0
    new_drawing_area.filter_link_value = 0

    new_drawing_area.sankey.containers_list.forEach(cont => {
      new_drawing_area.deleteContainer(cont)
    })



    // Create style for nodes linked to unitary node
    const InNodeStyle = new_drawing_area.sankey.addNewNodeStyle('SankeyUnitaryNodeInputStyle', 'Input node')
    InNodeStyle.name_label_horiz = 'left'
    InNodeStyle.name_label_vert = 'middle'
    InNodeStyle.name_label_font_size = 40
    InNodeStyle.shape_min_width = 1
    InNodeStyle.shape_min_height = 1
    InNodeStyle.shape_visible = false
    InNodeStyle.name_label_box_width = 300

    const OutNodeStyle = new_drawing_area.sankey.addNewNodeStyle('SankeyUnitaryNodeOutputStyle', 'Output node')
    OutNodeStyle.name_label_horiz = 'right'
    OutNodeStyle.name_label_vert = 'middle'
    OutNodeStyle.name_label_font_size = 40
    OutNodeStyle.shape_min_width = 1
    OutNodeStyle.shape_min_height = 1
    OutNodeStyle.shape_visible = false
    OutNodeStyle.name_label_box_width = 300

    const unitaryNode = new_drawing_area.sankey.addNewNodeStyle('SankeyUnitaryNodeStyle', 'Unitary node')
    unitaryNode.name_label_horiz = 'middle'
    unitaryNode.name_label_vert = 'bottom'
    unitaryNode.name_label_font_size = 40
    unitaryNode.shape_min_width = 200
    unitaryNode.name_label_bold = true
    unitaryNode.name_label_uppercase = true
    unitaryNode.name_label_box_width = 300

    const InLink = new_drawing_area.sankey.addNewLinkStyle('LinkInUnitaryStyle', 'Link In Unitary')
    InLink.name_label_font_size = 40
    InLink.value_label_horiz = 'left'
    InLink.value_label_pos_auto = true
    InLink.value_label_percent_input = true

    const OutLink = new_drawing_area.sankey.addNewLinkStyle('LinkOutUnitaryStyle', 'Link Out Unitary')
    OutLink.name_label_font_size = 40
    OutLink.value_label_horiz = 'right'
    OutLink.value_label_pos_auto = true
    OutLink.value_label_percent_output = true


    const visible_links = new_drawing_area.sankey.visible_links_list.map(l => l.id)
    let maxLinkValue = 1
    new_drawing_area.sankey.links_list
      .forEach(link => {
        // Delete link node not attached to node_ref
        // Compare id instead of object because node_ref come from original DA while links come from copied DA
        // which wouldn't work as intended
        if ((link.source.id !== node_ref.id && link.target.id !== node_ref.id) || !visible_links.includes(link.id)) {
          new_drawing_area.deleteLink(link)
        } else {
          // Normalize attribute
          link.resetAttributes()
          if (link.source.id == node_ref.id) {
            link.style = InLink
          } else {
            link.style = OutLink
          }
          // Search for max link value in unitary sankey to re-scale sankey
          const link_val = link.getMaxValue() ?? 1
          maxLinkValue = (link_val > maxLinkValue) ? link_val : maxLinkValue

        }
      })
    // Set new scale for unitary sankey
    new_drawing_area.scale = maxLinkValue / 2

    new_drawing_area.sankey.nodes_list
      .forEach(node => {
        // Delete nodes without IO links
        if (node.links_order.length == 0) {
          new_drawing_area.deleteNode(node)
        } else {
          // Normalize attribute
          node.resetAttributes()
          // Affect style depending on IO
          if (node.input_links_list.length == 0) {
            node.style = InNodeStyle
          } else if (node.output_links_list.length == 0) {
            node.style = OutNodeStyle
          }
        }
      })
    new_drawing_area.sankey.nodes_dict[node_ref.id].style = unitaryNode

    // Remove tag group
    new_drawing_area.sankey.node_taggs_list.forEach(tagg => {
      new_drawing_area.sankey.removeTagGroup('node_taggs', tagg)
      tagg.show_legend = false
    })
    new_drawing_area.sankey.flux_taggs_list.forEach(tagg => {
      tagg.show_legend = false
    })
    new_drawing_area.sankey.level_taggs_list.forEach(tagg => {
      new_drawing_area.sankey.removeTagGroup('level_taggs', tagg)
    })
    new_drawing_area.sankey.data_taggs_list.forEach(tagg => {
      tagg.show_legend = false
    })

    new_drawing_area.horizontal_spacing = 300
    new_drawing_area.callComputeAutoSankey(false)
    new_drawing_area.sankey.nodes_list
      .forEach(node => {
        node.reorganizeIOLinks()
        node.position_y += 50
        node.position_x -= 100
      })

    const cont = new_drawing_area.sankey.addNewFreeLabel('unitary_container_')

    cont.tied_to_nodes = true
    new_drawing_area.sankey.nodes_list.forEach(node => {
      new_drawing_area.sankey.attachNodeToCont(node, cont)
    })

    cont.content = '<p class="ql-align-center" style="font-size:40px">' + this.t('view.default_unit_view_name') + ' : <strong>' + node_ref.name + '</strong></p>'


    // Add new sankey to views
    this._views[new_drawing_area.id] = new_drawing_area
    this.pushViewIdInViewOrder(new_drawing_area.id)
    // Shown sankey = new sanke
    // this.setCurrentView(new_drawing_area.id)
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
          clone_drawing_area.bypass_redraws = true
          clone_drawing_area.copyFrom(this._drawing_area)
          // Save clone
          this.deleteCurrentOriginalView()
          this._original_current_view = clone_drawing_area
        }
        // Reset to Edition mode
        this._drawing_area.setToModeEdition(false)
        // Draw new-sankey
        this._drawing_area.draw()

        this._drawing_area.legend.posIfFromLegacy() // Function do something only if JSON was from legacy

        this._history = new Class_ApplicationHistory(this._menu_configuration)

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
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  public deleteCurrentView() {
    this.deleteView(this._drawing_area.sankey.id) // Remove for view dict
  }

  /**
   * Delete view from applicationData & go to master
   *
   * @param {string} id
   * @memberof ClassTemplate_ApplicationDataOSP
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
      }
    }
  }

  /**
   * Move up view id in _views_order
   *
   * @param {string} id id of the view to move
   * @memberof ClassTemplate_ApplicationDataOSP
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
   * @memberof ClassTemplate_ApplicationDataOSP
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
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  public resetViewWithOriginal() {
    if (
      (!this.is_view_master) &&
      (this._original_current_view !== undefined)
    ) {
      // Reset drawing area
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
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  public saveBeforeChangingView() {
    const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    if (ev.onkeydown) {
      ev.onkeydown(tmp)
    }
    this.setCurrentView(this?._waiting_to_set_view ?? default_main_sankey_id)
    delete this._waiting_to_set_view
  }

  /**e
   * Function used to push view id in order array,
   * it check if the id isn't already in order because duplicate id can cause so issue when navigating views
   *
   * @param {string} id
   * @memberof ClassTemplate_ApplicationDataOSP
   */
  public pushViewIdInViewOrder(id: string) {
    if (this._views_order.includes(id)) {
      this._views_order.splice(this._views_order.indexOf(id), 1)
    }
    this._views_order.push(id)
  }

  // GETTERS / SETTERS ==================================================================

  public get logo(): string { return this._logo_sankey_plus }
  public get logo_sankey_plus(): string { return this._logo_sankey_plus }

  public get has_sankey_plus() { return this._has_sankey_plus }
  public set has_sankey_plus(_) { this._has_sankey_plus = _ }

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigOSP { return this._menu_configuration as Class_MenuConfigOSP }
  public set menu_configuration(_: Class_MenuConfigOSP) { this._menu_configuration = _ }

  public get icon_library(): Class_IconLibraryOSP { return this._icon_library as Class_IconLibraryOSP }

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
    //test if length of _views_order is sup. to 1 because by default there is master sankey
    return (this._views_order.length > 1)
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

  public get list_color_palette(): string[] {
    return this._list_color_palette
  }

  public get user_preferences() { return this._user_preferences }

}
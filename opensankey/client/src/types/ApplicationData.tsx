// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import
import * as d3 from 'd3'
import LZString from 'lz-string'

// Local types
import { openRemoteUIElement } from '../functions/application/Menus'
import { Class_DrawingArea } from './DrawingArea'
import { Type_Structure } from './Utils'
import { Class_MenuConfig } from './MenuConfig'
import { uiElementsRefType } from './Types'
import { Class_LinkElement } from './Link'
import { ClickSaveDiagram } from '../dialogs/SankeyPersistence'


export const initial_window_width = window.innerWidth - 50 //TODO : replace 50 by width of toolbar
export const initial_window_height = window.innerHeight - 50 //TODO : replace 50 by height of top navbar & footer
const initial_show_structure = 'reconciled'
/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationData {

  // CONSTRUCTOR ========================================================================
  /**
    * Creates an instance of Class_ApplicationData.
    * @param {(Window & typeof globalThis)} window
    * @param {boolean} published_mode
    * @memberof Class_ApplicationData
    */
  constructor(window: Window & typeof globalThis, published_mode: boolean) {
    this.menu_configuration = new Class_MenuConfig

    this.drawing_area = new Class_DrawingArea(
      initial_window_height,
      initial_window_width,
      this)

    document.onkeydown = this.keyboardEventListener(this)

    // For published mode only
    this.drawing_area.static = published_mode
    this.fit_screen = published_mode
  }

  // DEFAULT ATTRIBUTES =================================================================
  // App version
  version: string = '0.8'

  // Dealing with menus
  accordeon_to_show: string[] = ['MEP']
  ui_elements: uiElementsRefType | null = null

  // Drawing area
  drawing_area: Class_DrawingArea

  // Configuration Menu
  menu_configuration: Class_MenuConfig

  // Display
  private _show_structure: Type_Structure = initial_show_structure

  fit_screen: boolean

  // Limitations
  private _maximum_flux?: number
  private _minimum_flux?: number

  private _filter_label: number = 0



  // OPTIONNAL ATTRIBUTES ===============================================================
  // File name
  file_name?: string
  // left_shift: 0,
  // right_shift: 1,
  // display_style: {
  //   filter: 0,
  //   filter_label: 0,
  //   font_family: ['Arial,sans-serif','Helvetica,sans-serif','Verdana,sans-serif','Calibri,sans-serif','Noto,sans-serif','Lucida Sans,sans-serif','Gill Sans,sans-serif','Century Gothic,sans-serif','Candara,sans-serif','Futara,sans-serif','Franklin Gothic Medium,sans-serif','Trebuchet MS,sans-serif','Geneva,sans-serif','Segoe UI,sans-serif','Optima,sans-serif','Avanta Garde,sans-serif',
  //     'Times New Roman,serif','Big Caslon,serif','Bodoni MT,serif','Book Antiqua,serif','Bookman,serif','New Century Schoolbook,serif','Calisto MT,serif','Cambria,serif','Didot,serif','Garamond,serif','Georgia,serif','Goudy Old Style,serif','Hoefler Text,serif','Lucida Bright,serif','Palatino,serif','Perpetua,serif','Rockwell,serif','Rockwell Extra Bold,serif','Baskerville,serif',
  //     'Consolas,monospace','Courier,monospace','Courier New,monospace','Lucida Console,monospace','Lucidatypewriter,monospace','Lucida Sans Typewriter,monospace','Monaco,monospace','Andale Mono,monospace',
  //     'Comic Sans,cursive','Comic Sans MS,cursive','Apple Chancery,cursive','Zapf Chancery,cursive','Bradley Hand,cursive','Brush Script MT,cursive','Brush Script Std,cursive','Snell Roundhan,cursive','URW Chancery,cursive','Coronet script,cursive','Florence,cursive','Parkavenue,cursive'
  //   ],
  // },

  // colorMap: 'no_colormap',
  // nodesColorMap: 'no_colormap',
  // linksColorMap: 'no_colormap',

  // legend_width:180,
  // legend_position: [0,0],
  // mask_legend:false,
  // display_legend_scale:false,
  // legend_police:16,
  // legend_bg_border:false,
  // legend_bg_color:default_element_color,
  // legend_bg_opacity:0,
  // legend_show_dataTags:false,
  // node_label_separator:''

  // PUBLIC METHODS =====================================================================
  // Deal with menus
  public closeAllMenus() { /* TODO */ }
  // Open accordion menu
  public openMenu() {
    if (this.ui_elements !== null)
      openRemoteUIElement(this.ui_elements.accordion_ref)
  }

  // GETTERS / SETTERS ==================================================================
  // TODO getter / setters for application data

  public get maximum_flux(): number | undefined { return this._maximum_flux }
  public set maximum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._maximum_flux = value
    }
  }

  public get minimum_flux(): number | undefined { return this._minimum_flux }
  public set minimum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._minimum_flux = value
    }
  }

  public get show_structure(): Type_Structure { return this._show_structure }
  public set show_structure(value: Type_Structure) { this._show_structure = value }

  public get filter_label(): number { return this._filter_label }
  public set filter_label(value: number) { this._filter_label = value }

  /**
   * Reset value of drawing_area and substructur with data from JSON
   * then assign newly created drawing_area as Class_ApplicationData currentdrawing_area attribute
   *
   * @param {{ [_: string]: any }} json_object
   * @memberof Class_ApplicationData
   */
  public new_drawing_area_fromJSON(json_object: { [_: string]: any }) {
    // TODO : define default value in case data is not in JSON

    this.reset()
    this.drawing_area.grid_size = json_object['grid_square_size'] ?? 50
    this.drawing_area.grid_visible = json_object['grid_visible'] ?? false

    this.drawing_area.horizontal_spacing = json_object['h_space'] ?? 150
    this.drawing_area.vertical_spacing = json_object['v_space'] ?? 150

    this.drawing_area.scale = json_object['user_scale'] ?? 50
    this.drawing_area.color = json_object['couleur_fond_sankey'] ?? 'whitesmoke'

    // draw_area.node_label_separator=json_object['node_label_separator']??''

    this.drawing_area.legend.fromJSON(json_object)

    // Set values for nodes,links,node_style,flux_style,node_taggs,flux_taggs,data_taggs and all their substructur
    this.drawing_area.sankey.fromJSON(json_object)
  }

  /**
   * Function to create custom application behavior when we press a key,
   *
   * even if this is a class method we have to ref the curr class in parametter because 'this' take another scope when it is called in onkeydown
   *
   * @private
   * @param {Class_ApplicationData} app_ref
   * @return {*}
   * @memberof Class_ApplicationData
   */
  private keyboardEventListener(app_ref: Class_ApplicationData) {
    return (evt: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
        (((document.activeElement?.tagName === 'INPUT') ?
          d3.select(document.activeElement).attr('value') === 'menuConfigButton' :
          true) &&
          (!document.activeElement?.className.includes('ql-editor')))
      ) {
        // Deplace les noeuds sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
        // (exemples : le input de la largeur minimal d'un noeud)
        if (evt.key == 'ArrowUp') {
          app_ref.drawing_area.selected_nodes_list.forEach(node => {
            node.position_y -= app_ref.drawing_area.grid_size
          })
        } else if (evt.key == 'ArrowDown') {
          app_ref.drawing_area.selected_nodes_list.forEach(node => {
            node.position_y += app_ref.drawing_area.grid_size
          })
        } else if (evt.key == 'ArrowLeft') {
          app_ref.drawing_area.selected_nodes_list.forEach(node => {
            node.position_x -= app_ref.drawing_area.grid_size
          })
        } else if (evt.key == 'ArrowRight') {
          app_ref.drawing_area.selected_nodes_list.forEach(node => {
            node.position_x += app_ref.drawing_area.grid_size
          })
        }

        let link_to_update: Class_LinkElement[] = []
        app_ref.drawing_area.selected_nodes_list.forEach(n => {
          link_to_update = link_to_update.concat(n.output_links_list)
          link_to_update = link_to_update.concat(n.input_links_list)
          n.draw()
        })
        link_to_update = [...new Set(link_to_update)]
        link_to_update.forEach(link => link.draw())

        this.drawing_area.checkAndUpdateAreaSize()
      }
      else if (evt.key == 'Escape') {
        // Set app in selection mode
        this.drawing_area.setSelectionMode()

        // Deselect all element
        app_ref.drawing_area.purgeSelection()

        // Close all menus
        app_ref.closeAllMenus()

      } else if (evt.key == 'Delete' && (!document.activeElement?.className.includes('ql-editor'))) {
        // Event to delete all selected elements

        // Check if we are not in an input so we don't modify the value of it
        if (document.activeElement?.tagName !== 'INPUT' || d3.select(document.activeElement).attr('value') == 'menuConfigButton') {

          // Delete selected elements
          app_ref.drawing_area.selected_nodes_list.forEach(node => app_ref.drawing_area.deleteNode(node))
          app_ref.drawing_area.selected_links_list.forEach(link => app_ref.drawing_area.deleteLink(link))

          // Redraw remaining elements since their presence shape their appearence one another
          app_ref.drawing_area.sankey.nodes_list.forEach(node => node.draw())
          app_ref.drawing_area.sankey.links_list.forEach(link => link.draw())

          // Update component
          app_ref.menu_configuration.ref_to_menu_config_node_updater.current()
          app_ref.menu_configuration.ref_to_menu_config_link_updater.current()
        }
      }
      else if (evt.key == 'a' && evt.ctrlKey) {
        // Event to select all elements

        // Prevent default event on ctrl + a
        evt.preventDefault()

        // Select all node & links
        app_ref.drawing_area.sankey.nodes_list.forEach(n => app_ref.drawing_area.addNodeToSelection(n))
        app_ref.drawing_area.sankey.links_list.forEach(l => app_ref.drawing_area.addLinkToSelection(l))

        // Update component
        app_ref.menu_configuration.ref_to_menu_config_node_updater.current()
        app_ref.menu_configuration.ref_to_menu_config_link_updater.current()
      } else if (evt.key == 'Enter' && document.activeElement?.tagName == 'INPUT' && (['form-control', 'chakra-numberinput__field', 'chakra-input', 'name_label_input'].some(r => document.activeElement?.className.includes(r)))) {
        // Event to blur the input we are currently focused on
        // (It's in adequation with event on input that update drawing area when we blur input)
        (document.activeElement as HTMLInputElement).blur()

      } else if (evt.key == 's' && evt.ctrlKey && !evt.shiftKey) {
        // Event to save current diagram in cache

        // Prevent default event on ctrl + s
        evt.preventDefault()

        // Save in cache
        localStorage.setItem('data', LZString.compress(JSON.stringify(app_ref.drawing_area.toJSON())))
        localStorage.setItem('last_save', 'true')

        // Update logo save in cache
        app_ref.menu_configuration.ref_to_save_in_cache_indicator.current(true)
      }
      else if ((evt.key == 's' && evt.ctrlKey && evt.shiftKey) || (evt.key == 'S' && evt.ctrlKey && evt.shiftKey)) {
        // event to download current sankey in JSON

        // Prevent default event on ctrl + shift + s
        evt.preventDefault()

        ClickSaveDiagram(app_ref, { mode_save: true, mode_visible_element: false })
      }
      else if ((evt.key === 'f') && !evt.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        if ((!d3.select(document.activeElement)?.attr('class')?.includes('ql-editor'))) {
          evt.preventDefault()
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
        }
      }
      else if (evt.key == 'Tab') {
        app_ref.menu_configuration.btn_toogle_menu.current?.click()
      }
    }

  }

  public reset() {
    this._show_structure = initial_show_structure
    delete this._maximum_flux
    delete this._minimum_flux
    this._filter_label = 0

    this.drawing_area.reinit()
    this.drawing_area = new Class_DrawingArea(
      initial_window_height,
      initial_window_width,
      this)

    this.menu_configuration.updateAllMenuComponent()
  }
}
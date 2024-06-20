// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types
import { openRemoteUIElement } from '../functions/application/Menus'
import { Class_DrawingArea } from './DrawingArea'
import { Type_Structure } from './Utils'
import { Class_MenuConfig } from './MenuConfig'
import { uiElementsRefType } from './Types'


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
      window.innerHeight - 50,
      window.innerWidth - 50,
      this)

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
  show_structure: Type_Structure = 'reconciled'
  fit_screen: boolean

  // Limitations
  private _maximum_flux?: number
  private _minimum_flux?: number


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

  public get maximum_flux(): number | undefined {
    return this._maximum_flux
  }
  public set maximum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._maximum_flux = value
    }
  }

  public get minimum_flux(): number | undefined {
    return this._minimum_flux
  }
  public set minimum_flux(value: number | undefined) {
    if (value === undefined || value > 0) {
      this._minimum_flux = value
    }
  }
}
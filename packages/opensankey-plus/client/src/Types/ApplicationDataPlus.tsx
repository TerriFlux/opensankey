// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// OpenSankey imports
import {
  Class_ApplicationData,
  initial_window_height,
  initial_window_width,
} from '../deps/OpenSankey/types/ApplicationData'

// Local imports
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_LinkElementPlus } from './LinkPlus'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_NodeElementPlus } from './NodePlus'
import { Class_SankeyPlus } from './SankeyPlus'
import { Class_ZoneSelectionPlus } from './Selection_ZonePlus'

// CLASS APPLICATION DATA PLUS **********************************************************

/**
 * Override some Class_ApplicationData behaviors for OpenSankey+
 * @export
 * @class Class_ApplicationDataPlus
 * @extends {Class_ApplicationData}
 */
export class Class_ApplicationDataPlus extends Class_ApplicationData<Class_DrawingAreaPlus, Class_SankeyPlus, Class_NodeElementPlus, Class_LinkElementPlus,Class_ZoneSelectionPlus> {

  // PUBLIC ATTRIBUTES =================================================================

  /**
   * Drawing area
   *
   * @protected
   * @type {Class_DrawingArea}
   * @memberof Class_ApplicationData
   */
  protected _drawing_area: Class_DrawingAreaPlus

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
    this._drawing_area = new Class_DrawingAreaPlus(
      this.drawing_area.getHeight(),
      this.drawing_area.getWidth(),
      this)

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

  // PUBLIC METHODS ====================================================================

  // PROTECTED METHODS ====================================================================

  public createNewDrawingArea(): Class_DrawingAreaPlus {
    const drawing_area = new Class_DrawingAreaPlus(
      initial_window_height,
      initial_window_width,
      this
    )
    return drawing_area
  }

  // GETTERS / SETTERS ==================================================================

  // Overrides --------------------------------------------------------------------------

  // DrawingArea
  public override get drawing_area() { return this._drawing_area }
  public override set drawing_area(_: Class_DrawingAreaPlus) { this._drawing_area = _ }

  // New -------------------------------------------------------------------------------

  public get logo_sankey_plus(): string { return this._logo_sankey_plus }
  public set logo_sankey_plus(value: string) { this._logo_sankey_plus = value }

  public get has_sankey_plus(): boolean { return this._has_sankey_plus }
  public set has_sankey_plus(value: boolean) { this._has_sankey_plus = value }

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigPlus {
    return this._menu_configuration as Class_MenuConfigPlus
  }
  public set menu_configuration(_: Class_MenuConfigPlus) { this._menu_configuration = _ }


}
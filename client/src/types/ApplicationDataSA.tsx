import { Class_ApplicationDataOSP } from '../deps/OpenSankey+/types/TypesOSP'
import { Class_IconLibrarySA } from './IconLibrarySA'
import { Class_MenuConfigSA } from './MenuConfigSA'

export class Class_ApplicationDataSA extends Class_ApplicationDataOSP {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _menu_configuration: Class_MenuConfigSA

  // PRIVATE ATTRIBUTES ===============================================================



  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataSA.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataSA
   */
  constructor(
    published_mode: boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    super(published_mode, options)
    // OVERRIDE
    this._menu_configuration = this.menu_configuration
    // Default confi
    // _plus = false

  }

  // PUBLIC METHODS =====================================================================

  public createNewMenuConfiguration(): Class_MenuConfigSA {
    return new Class_MenuConfigSA()
  }

  public createNewIconLibrary(): Class_IconLibrarySA {
    return new Class_IconLibrarySA()
  }



  // GETTERS / SETTERS ==================================================================

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigSA { return this._menu_configuration }
  public set menu_configuration(_: Class_MenuConfigSA) { this._menu_configuration = _ }

  public get icon_library(): Class_IconLibrarySA { return this._icon_library as Class_IconLibrarySA }

}
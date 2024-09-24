import { Class_ApplicationDataOSP } from './deps/OpenSankey+/types/TypesOSP'
import { Class_MenuConfigSA } from './MenuConfig'

export class Class_ApplicationDataSA extends Class_ApplicationDataOSP {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _menu_configuration: Class_MenuConfigSA

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataSA.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataSA
   */
  constructor(
    published_mode: boolean,
    options: {[_: string]: boolean | string} = {}
  ) {
    super(published_mode, options)
    // OVERRIDE
    this._menu_configuration = this.menu_configuration
  }
  public createNewMenuConfiguration(): Class_MenuConfigSA {
    return new Class_MenuConfigSA()
  }


  // GETTERS / SETTERS ==================================================================

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigSA { return this._menu_configuration }
  public set menu_configuration(_: Class_MenuConfigSA) { this._menu_configuration = _ }

}
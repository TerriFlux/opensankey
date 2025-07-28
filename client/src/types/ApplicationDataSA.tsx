
import { Class_MenuConfig } from '../deps/OpenSankey+/deps/OpenSankey/types/MenuConfig'
import { Class_ApplicationDataOSP } from '../deps/OpenSankey+/types/ApplicationDataOSP'
import { Class_IconLibrarySA } from './IconLibrarySA'
import { Class_MenuConfigSA } from './MenuConfigSA'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      logo: string
    }
  }
export class Class_ApplicationDataSA extends Class_ApplicationDataOSP {
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
    //this._menu_configuration = this.menu_configuration
    // Get MFA logo
    this._logo_mfa = 'logos/logo_OSS.png'

  }

  private _logo_mfa: string = ''

  // PUBLIC METHODS =====================================================================

  public createNewMenuConfiguration(): Class_MenuConfig {
    return new Class_MenuConfigSA() as Class_MenuConfig
  }

  public createNewIconLibrary(): Class_IconLibrarySA {
    return new Class_IconLibrarySA()
  }

 // Overrride logo
  public get logo() {
    if ( this.is_static && window.sankey && window.sankey.logo) {
      return window.sankey.logo
    }
    if (this.has_sankey_afm) {
      return this._logo_mfa
    }
    if (this.has_sankey_plus) {
      return this.logo_sankey_plus
    }
    return this.logo_opensankey
  }

  // GETTERS / SETTERS ==================================================================

  // Override getter & setter so we can get new type
  public get menu_configuration_sa(): Class_MenuConfigSA { return this._menu_configuration  as Class_MenuConfigSA }
  public set menu_configuration_sa(_) { this._menu_configuration = _ }

  public get icon_library(): Class_IconLibrarySA { return this._icon_library as Class_IconLibrarySA }

}

import { Class_MenuConfigSA } from './MenuConfigSA'
import { Class_ApplicationDataLoginComponent} from './deps/LoginComponent/ApplicationDataLoginComponent'
import { Class_MenuConfig } from './deps/LoginComponent/deps/OpenSankey+/deps/OpenSankey/types/MenuConfig'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      logo: string
    }
  }
export class Class_ApplicationDataSA extends Class_ApplicationDataLoginComponent {
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

  public createNewMenuConfiguration() {
    return new Class_MenuConfigSA() as Class_MenuConfig
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
  public get menu_configuration_sa() { return this._menu_configuration as Class_MenuConfigSA }
  public set menu_configuration_sa(_) { this._menu_configuration = _ }

}
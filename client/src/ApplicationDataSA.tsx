
import { CreateToastFnReturn } from '@chakra-ui/react'
import { Class_MenuConfigSA } from './MenuConfigSA'
import { Class_ApplicationHistory } from './deps/OpenSankey+/deps/OpenSankey/types/ApplicationHistory'
import { Class_ApplicationDataOSP } from './deps/OpenSankey+/types/ApplicationDataOSP'
import { LoginComponent } from './deps/LoginComponent/LoginComponent'

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
    this._login_component = new LoginComponent
  }

  public get login_component() { return this._login_component}
  private _login_component : LoginComponent

  private _logo_mfa: string = ''

  // PUBLIC METHODS =====================================================================

  public createNewMenuConfiguration(toast: CreateToastFnReturn | null = null) {
    this._toast = toast
    this._menu_configuration = new Class_MenuConfigSA()
    this._history = new Class_ApplicationHistory(this._menu_configuration)
    return this._menu_configuration
  }

  // Overrride logo
  public get logo() {
    if (this.is_static && this.publish_options.logo !== null) {
      return this.publish_options.logo
    }
    if (this.has_sankey_afm) {
      return this._logo_mfa
    }
    if (this.has_sankey_plus) {
      return this.logo_sankey_plus
    }
    return this.logo_opensankey
  }
  public get logo_osp(): string { return this._logo_mfa }
  // GETTERS / SETTERS ==================================================================

  // Override getter & setter so we can get new type
  public get menu_configuration_sa() { return this._menu_configuration as Class_MenuConfigSA }
  public set menu_configuration_sa(_) { this._menu_configuration = _ }

}
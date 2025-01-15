import { Class_ApplicationDataOSP } from '../deps/OpenSankey+/types/TypesOSP'
import { Class_MenuConfigSA } from './MenuConfigSA'

export class Class_ApplicationDataSA extends Class_ApplicationDataOSP {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _menu_configuration: Class_MenuConfigSA
  protected _has_account: boolean = false // token when user is connected with an account
  protected _ok_to_check_account = true
  protected _ok_to_check_account_timeout: NodeJS.Timeout | null = null

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
    // Default config on creation
    this._has_sankey_plus = false
  }

  // PUBLIC METHODS =====================================================================

  public createNewMenuConfiguration(): Class_MenuConfigSA {
    return new Class_MenuConfigSA()
  }

  public async checkTokens(force=false) {
    if (this._ok_to_check_account || force) {
      // Default token
      this._has_account = false
      this._has_sankey_plus = false
      // Update token
      await fetch(window.location.origin + '/auth/connected')
        .then((response) => {
          // Update booleans
          if (response.ok)
            this._has_account = true
        })
        .then(() => {
          // Update account token
          // Check licenses
          if (this._has_account)
            return fetch(window.location.origin + '/auth/license')
              .then((response) => {
                let has_license = false
                if (response.ok)
                  has_license = true
                return has_license
              })
              .then((has_license) => {
                this._has_sankey_plus = has_license
              })
        })
        .then(() => {
          this.menu_configuration.updateComponentsRelatedToSA()
          this.menu_configuration.updateAllMenuComponents()
        })
      // Cannot check for given time
      this._ok_to_check_account = false
      if (this._ok_to_check_account_timeout)
        clearTimeout(this._ok_to_check_account_timeout)
      this._ok_to_check_account_timeout = setTimeout(
        () => { this._ok_to_check_account = true },
        1800,
      )
    }
  }

  public unsetTokens() {
    this._has_account = false
    this._has_sankey_plus = false
    this._ok_to_check_account = true
    this.menu_configuration.updateComponentsRelatedToSA()
    this.menu_configuration.updateAllMenuComponents()
  }

  // GETTERS / SETTERS ==================================================================

  // Override getter & setter so we can get new type
  public get menu_configuration(): Class_MenuConfigSA { return this._menu_configuration }
  public set menu_configuration(_: Class_MenuConfigSA) { this._menu_configuration = _ }

  // Overrride logo
  public get logo() {
    if (!this._has_sankey_plus)
      return this.logo_opensankey
    else
      return this.logo_sankey_plus
  }

  public get has_account() { return this._has_account }
}
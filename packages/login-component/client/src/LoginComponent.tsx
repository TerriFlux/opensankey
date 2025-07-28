
import React from 'react'

export class LoginComponent {

  // PROTECTED ATTRIBUTES ===============================================================
  protected _has_account: boolean = false // token when user is connected with an account
  protected _has_licence: boolean = false
  protected _ok_to_check_account = true
  protected _ok_to_check_account_timeout: NodeJS.Timeout | null = null

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationDataSA.
   * @param {boolean} published_mode
   * @memberof Class_ApplicationDataSA
   */
  constructor() {
    // Default config on creation
    this._has_licence = false
  }

  public async checkTokens(
    setUpdate:React.MutableRefObject<() => void>,
    force=false
  ) {
    if (this._ok_to_check_account || force) {
      // Default token
      this._has_account = false
      //this._has_sankey_plus = false
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
                this._has_licence = has_license
              })
        })
        .then(() => {
          setUpdate.current()
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
    this._has_licence = false
    this._ok_to_check_account = true
  }

  public get has_account() { return this._has_account }
  public get has_licence() { return this._has_licence }
}

let _loginComponent : LoginComponent | undefined = undefined

export const loginComponent = () => {
  if (!_loginComponent) {
    _loginComponent = new LoginComponent()
  }
  return _loginComponent
}
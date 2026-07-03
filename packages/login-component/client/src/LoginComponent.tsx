
import React from 'react'

export class LoginComponent {

  // PROTECTED ATTRIBUTES ===============================================================
  protected _has_account: boolean = false // token when user is connected with an account
  protected _has_licence_sankeyplus: boolean = false
  protected _has_licence_sankeysuite: boolean = false
  protected _has_licence_dev: boolean = false
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
    this._has_licence_sankeyplus = false
    this._has_licence_sankeysuite = false
    this._has_licence_dev = false
  }

  public async checkTokens(
    setLicenses: React.MutableRefObject<() => void>,
    force = false
  ) {
  // Vérifier si on peut faire la vérification (throttling) ou si c'est forcé
    if (this._ok_to_check_account || force) {
    // Réinitialiser l'état par défaut - pas de compte connecté
      this._has_account = false

      // Vérifier si l'utilisateur est connecté via l'endpoint /auth/connected
      await fetch(window.location.origin + '/auth/connected')
        .then((response) => {
        // Si la réponse est OK, l'utilisateur a un compte valide
          if (response.ok) {
            this._has_account = true
          }
        })
        .then(() => {
        // Configuration pour l'appel POST vers /auth/license
          const fetchData = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
          }
          this._has_licence_sankeyplus = false
          this._has_licence_sankeysuite = false
          this._has_licence_dev = false
          // Si l'utilisateur a un compte, vérifier ses licences
          if (this._has_account) {
            return fetch(window.location.origin + '/auth/license', fetchData)
              .then((response) => {
                if (!response.ok) {
                  console.error('checkTokens: License check failed with status:', response.status)
                  throw new Error(`HTTP error! status: ${response.status}`)
                }
                // Parser la réponse JSON des licences
                return response.json()
                  .then(license => {
                  // Mettre à jour les états des licences spécifiques
                    this._has_licence_sankeyplus = Object.keys(license.licenses).some(k => k.startsWith('OpenSankey+') && license.licenses[k])
                    this._has_licence_sankeysuite = Object.keys(license.licenses).some(k => k.startsWith('SankeySuite') && license.licenses[k])
                    this._has_licence_dev = license.licenses['dev'] == true
                  })
              })
              .then(() => {
              // Déclencher la mise à jour des licences dans l'interface
                setLicenses.current()
              })
          } else {
            setLicenses.current()
          }

          // Activer le throttling - empêcher de nouvelles vérifications pendant 1.8s
          this._ok_to_check_account = false
          // Annuler le timeout précédent s'il existe
          if (this._ok_to_check_account_timeout)
            clearTimeout(this._ok_to_check_account_timeout)
          // Programmer la réactivation des vérifications après 1.8s
          this._ok_to_check_account_timeout = setTimeout(
            () => {
              this._ok_to_check_account = true
            },
            1800,
          )
        })
        .catch((error) => {
          console.error('checkTokens: Error during token/license check:', error)
        })
    }
  }

  public unsetTokens() {
    this._has_account = false
    this._has_licence_sankeyplus = false
    this._has_licence_sankeysuite = false
    this._ok_to_check_account = true
  }

  public get has_account() { return this._has_account }
  public get has_licence_sankeyplus() { return this._has_licence_sankeyplus }
  public get has_licence_sankeysuite() { return this._has_licence_sankeysuite }
  public get has_licence_dev() { return this._has_licence_dev }
}
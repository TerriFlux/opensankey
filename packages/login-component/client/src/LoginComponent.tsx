
import React from 'react'

export class LoginComponent {

  // PROTECTED ATTRIBUTES ===============================================================
  protected _has_account: boolean = false // token when user is connected with an account
  protected _has_licence_sankeyplus: boolean = false
  protected _has_licence_sankeysuite: boolean = false
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
  }

public async checkTokens(
  setLicenses: React.MutableRefObject<() => void>,
  force = false
) {
  // Vérifier si on peut faire la vérification (throttling) ou si c'est forcé
  if (this._ok_to_check_account || force) {
    console.log('checkTokens: Starting token verification, force =', force)
    
    // Réinitialiser l'état par défaut - pas de compte connecté
    this._has_account = false
    console.log('checkTokens: Reset account status to false')
    
    // Vérifier si l'utilisateur est connecté via l'endpoint /auth/connected
    await fetch(window.location.origin + '/auth/connected')
      .then((response) => {
        console.log('checkTokens: /auth/connected response status:', response.status)
        // Si la réponse est OK, l'utilisateur a un compte valide
        if (response.ok) {
          this._has_account = true
          console.log('checkTokens: User has valid account')
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
        
        // Si l'utilisateur a un compte, vérifier ses licences
        if (this._has_account) {
          console.log('checkTokens: Checking licenses for authenticated user')
          return fetch(window.location.origin + '/auth/license', fetchData)
            .then((response) => {
              if (!response.ok) {
                console.error('checkTokens: License check failed with status:', response.status)
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              console.log('checkTokens: License check successful')
              // Parser la réponse JSON des licences
              return response.json()
                .then(license => {
                  console.log('checkTokens: License data received:', license)
                  // Mettre à jour les états des licences spécifiques
                  this._has_licence_sankeyplus = license.licenses['OpenSankey+'] == true
                  this._has_licence_sankeysuite = license.licenses['terriflux'] == true
                  console.log('checkTokens: SankeyPlus license:', this._has_licence_sankeyplus)
                  console.log('checkTokens: TerriFlix license:', this._has_licence_sankeysuite)
                })
            })
            .then(() => {
              console.log('checkTokens: Calling setLicenses callback')
              // Déclencher la mise à jour des licences dans l'interface
              setLicenses.current()
            })
        } else {
          console.log('checkTokens: No account, skipping license check')
        }
        
        // Activer le throttling - empêcher de nouvelles vérifications pendant 1.8s
        console.log('checkTokens: Activating throttling for 1800ms')
        this._ok_to_check_account = false
        // Annuler le timeout précédent s'il existe
        if (this._ok_to_check_account_timeout)
          clearTimeout(this._ok_to_check_account_timeout)
        // Programmer la réactivation des vérifications après 1.8s
        this._ok_to_check_account_timeout = setTimeout(
          () => { 
            this._ok_to_check_account = true 
            console.log('checkTokens: Throttling period ended, checks enabled')
          },
          1800,
        )
      })
      .catch((error) => {
        console.error('checkTokens: Error during token/license check:', error)
      })
  } else {
    console.log('checkTokens: Skipped due to throttling (too soon since last check)')
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
}
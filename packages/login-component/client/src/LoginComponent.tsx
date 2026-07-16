
import React from 'react'

/** État d'essai gratuit renvoyé par le serveur (/auth/license → `trial`). */
export type TrialState = {
  plan: 'plus' | 'suite' | null
  ends_at: string | null
  days_remaining: number
  active_plus: boolean
  active_suite: boolean
  used_plus: boolean
  used_suite: boolean
  can_start_plus: boolean
  can_start_suite: boolean
}

/** État d'essai neutre (aucun essai) — utilisé hors compte / à la déconnexion. */
export const EMPTY_TRIAL_STATE: TrialState = {
  plan: null,
  ends_at: null,
  days_remaining: 0,
  active_plus: false,
  active_suite: false,
  used_plus: false,
  used_suite: false,
  can_start_plus: false,
  can_start_suite: false,
}

export class LoginComponent {

  // PROTECTED ATTRIBUTES ===============================================================
  protected _has_account: boolean = false // token when user is connected with an account
  protected _has_licence_sankeyplus: boolean = false
  protected _has_licence_sankeysuite: boolean = false
  protected _has_licence_dev: boolean = false
  // Essai gratuit géré en base (pas dans Stripe) : débloque le plan tant qu'actif.
  protected _trial: TrialState = { ...EMPTY_TRIAL_STATE }
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
          this._trial = { ...EMPTY_TRIAL_STATE }
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
                    // Essai gratuit (à part des licences réelles) : débloque le plan tant qu'actif.
                    if (license.trial) {
                      this._trial = { ...EMPTY_TRIAL_STATE, ...license.trial }
                    }
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
    this._trial = { ...EMPTY_TRIAL_STATE }
    this._ok_to_check_account = true
  }

  public get has_account() { return this._has_account }
  public get has_licence_sankeyplus() { return this._has_licence_sankeyplus }
  public get has_licence_sankeysuite() { return this._has_licence_sankeysuite }
  public get has_licence_dev() { return this._has_licence_dev }

  // Essai gratuit ------------------------------------------------------------
  public get trial() { return this._trial }
  /** Essai actif débloquant OpenSankey+ (essai « plus » ou « suite »). */
  public get trial_active_plus() { return this._trial.active_plus }
  /** Essai actif débloquant MFASankey (essai « suite »). */
  public get trial_active_suite() { return this._trial.active_suite }
}
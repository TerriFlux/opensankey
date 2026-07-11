// ==================================================================================================
// Essai gratuit 30 jours — flux de déclenchement côté client.
// --------------------------------------------------------------------------------------------------
// L'essai est géré en base (POST /trial/start), sans carte. Depuis le site, le CTA « Essayer 30
// jours » ouvre l'app sur #/license/trial?plan=plus|suite (UTM conservés en querystring). La route
// démarre l'essai si le compte est connecté, sinon elle mémorise l'intention et envoie créer/connecter
// le compte ; l'essai est repris automatiquement au retour dans l'app (consumePendingTrial).
// ==================================================================================================
import i18next from 'i18next'

export type TrialPlan = 'plus' | 'suite'

const PENDING_KEY = 'pending_trial_plan'

/** Normalise un paramètre `plan` arbitraire vers 'plus' | 'suite' (défaut 'plus'). */
export const normalizeTrialPlan = (raw: string | null | undefined): TrialPlan =>
  raw === 'suite' ? 'suite' : 'plus'

// localStorage (et non sessionStorage) : l'intention doit survivre à la création
// de compte puis au RETOUR depuis l'email de bienvenue, souvent dans un nouvel
// onglet/nouvelle session (sessionStorage y serait perdu → essai jamais démarré).
/** Mémorise l'intention d'essai (avant création/connexion de compte). */
export const setPendingTrial = (plan: TrialPlan): void => {
  try { localStorage.setItem(PENDING_KEY, plan) } catch { /* localStorage indisponible */ }
}

/** Lit l'intention d'essai en attente, ou null. */
export const getPendingTrial = (): TrialPlan | null => {
  try {
    const v = localStorage.getItem(PENDING_KEY)
    return v === 'plus' || v === 'suite' ? v : null
  } catch { return null }
}

/** Efface l'intention d'essai en attente. */
export const clearPendingTrial = (): void => {
  try { localStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
}

export type TrialStartResult = {
  ok: boolean
  reason: string
  trial?: unknown
}

/** Appelle POST /trial/start pour le plan donné (compte supposé connecté). */
export const postTrialStart = (plan: TrialPlan): Promise<TrialStartResult> =>
  fetch(window.location.origin + '/trial/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, lang: i18next.language }),
  })
    .then((r) => r.json())
    .catch(() => ({ ok: false, reason: 'network_error' }))

/**
 * Reprend un essai en attente après création/connexion du compte. À appeler une fois le compte
 * confirmé. Best-effort : efface l'intention AVANT l'appel (évite les doubles démarrages), démarre
 * l'essai puis relance la vérification des licences pour débloquer l'app.
 *
 * @returns true si un essai en attente a été consommé.
 */
export const consumePendingTrial = (
  onStarted: () => void,
): boolean => {
  const plan = getPendingTrial()
  if (!plan) return false
  clearPendingTrial()
  postTrialStart(plan).then((res) => {
    if (res.ok) onStarted()
  })
  return true
}

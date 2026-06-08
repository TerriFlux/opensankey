// ==================================================================================================
// OpenSankey+ free trial — client-side only, opt-in
// --------------------------------------------------------------------------------------------------
// 30-day trial period stored in localStorage. No fingerprinting.
// The trial *grants* OS+ access; it never revokes a real licence.
//
// Opt-in flow:
//   1. First load: no key set → "unseen" state → app shows the welcome modal.
//   2. User clicks "Start trial" → startTrial() persists start date + UUID + sends ping.
//   3. User clicks "Maybe later" → markTrialOffered() persists the "offered" flag (no trial,
//      no UUID generated, nothing sent to the server). The user can still start it later from
//      the bottom banner.
//
// Anonymous analytics (only when the trial is actually started):
//   - On startTrial(), an anonymous UUID is generated and a fire-and-forget POST is sent to
//     /api/trial/started so the server can count starts. The UUID lets us later match a
//     "converted" event without ever knowing who the user is.
//   - markTrialConverted() is called from the subscription success flow (LoginComponent's
//     PaiementReturn) to record conversion.
// ==================================================================================================

const TRIAL_OFFERED_KEY = 'os_plus_trial_offered'
const TRIAL_KEY = 'os_plus_trial_start'
const TRIAL_UUID_KEY = 'os_plus_trial_uuid'
const TRIAL_PINGED_KEY = 'os_plus_trial_pinged'
const TRIAL_CONVERTED_KEY = 'os_plus_trial_converted'
const TRIAL_EXPIRED_ACK_KEY = 'os_plus_trial_expired_ack'
const TRIAL_DURATION_DAYS = 30
const MS_PER_DAY = 1000 * 60 * 60 * 24

export type TrialState = {
  /** Has the welcome offer ever been presented to this browser. */
  is_offered: boolean
  /** Has the user actually started the trial (clicked the opt-in button). */
  is_started: boolean
  /** Timestamp (ms) when the trial started, or null if not started. */
  started_at: number | null
  /** Anonymous UUID for this browser, or null if trial not started. */
  uuid: string | null
  /** Whole days elapsed since trial start (0 if not started). */
  days_elapsed: number
  /** Remaining whole days (0 once expired or not started). */
  days_remaining: number
  /** Total trial duration in days. */
  duration_days: number
  /** True while the trial is started AND days_elapsed <= duration_days. */
  is_active: boolean
  /** True once a started trial passes its duration. */
  is_expired: boolean
}

// --------------------------------------------------------------------------------------------------
// Internal helpers

const safeGet = (key: string): string | null => {
  try { return localStorage.getItem(key) } catch { return null }
}

const safeSet = (key: string, value: string): void => {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}

/** Best-effort UUID v4 generator (uses crypto.randomUUID when available). */
const generateUUID = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch { /* fall through */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Fire-and-forget POST. Never throws, never blocks. */
const pingServer = (path: string, body: Record<string, unknown>): void => {
  try {
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => { /* network errors are expected and ignored */ })
  } catch {
    /* fetch unavailable — ignore */
  }
}

// --------------------------------------------------------------------------------------------------
// Public API

/** True if the welcome offer has already been shown to this browser. */
export const hasBeenOffered = (): boolean => safeGet(TRIAL_OFFERED_KEY) === '1'

/** True if the user has started a trial in this browser (regardless of whether it's still active). */
export const hasTrialStarted = (): boolean => !!safeGet(TRIAL_KEY)

/**
 * Mark the welcome offer as seen. Called when the user clicks "Maybe later".
 * No UUID is generated, no ping is sent — the user has explicitly declined for now.
 */
export const markTrialOffered = (): void => {
  safeSet(TRIAL_OFFERED_KEY, '1')
}

/**
 * Start the trial: persist the start date, generate the anonymous UUID, mark the offer as seen,
 * and send the analytics ping. Idempotent: a second call is a no-op.
 * Returns true if the trial was just started, false if it was already running.
 */
export const startTrial = (): boolean => {
  if (hasTrialStarted()) return false
  const started_at = Date.now()
  const uuid = generateUUID()
  safeSet(TRIAL_KEY, String(started_at))
  safeSet(TRIAL_UUID_KEY, uuid)
  safeSet(TRIAL_OFFERED_KEY, '1')
  // Mark before pinging so a hard refresh during the request doesn't double-count.
  safeSet(TRIAL_PINGED_KEY, '1')
  pingServer('/api/trial/started', { uuid, started_at })
  return true
}

/**
 * Read the current trial state. Pure read — never mutates localStorage.
 */
export const getTrialState = (): TrialState => {
  const is_offered = hasBeenOffered()
  const raw_start = safeGet(TRIAL_KEY)
  const started_at = raw_start ? parseInt(raw_start, 10) : NaN

  if (!Number.isFinite(started_at)) {
    return {
      is_offered,
      is_started: false,
      started_at: null,
      uuid: null,
      days_elapsed: 0,
      days_remaining: 0,
      duration_days: TRIAL_DURATION_DAYS,
      is_active: false,
      is_expired: false,
    }
  }

  const uuid = safeGet(TRIAL_UUID_KEY)
  const days_elapsed = Math.max(0, Math.floor((Date.now() - started_at) / MS_PER_DAY))
  const is_active = days_elapsed <= TRIAL_DURATION_DAYS
  return {
    is_offered,
    is_started: true,
    started_at,
    uuid,
    days_elapsed,
    days_remaining: Math.max(0, TRIAL_DURATION_DAYS - days_elapsed),
    duration_days: TRIAL_DURATION_DAYS,
    is_active,
    is_expired: !is_active,
  }
}

/** True while a started trial still grants OS+ access. */
export const isTrialActive = (): boolean => getTrialState().is_active

/** True once a started trial has expired. */
export const isTrialExpired = (): boolean => getTrialState().is_expired

/**
 * The expired modal is a one-shot nag: once the user has made a choice
 * (continue free / subscribe / dismiss), it must never reappear in this browser.
 */
export const hasExpiredBeenAcknowledged = (): boolean => safeGet(TRIAL_EXPIRED_ACK_KEY) === '1'

/** Persist that the user has acknowledged the expired modal. */
export const markExpiredAcknowledged = (): void => {
  safeSet(TRIAL_EXPIRED_ACK_KEY, '1')
}

/**
 * Notify the server that this anonymous trial UUID has converted to a paid licence.
 * Idempotent client-side: only pings once per browser.
 * Called from LoginComponent's PaiementReturn on Stripe success.
 */
export const markTrialConverted = (): void => {
  try {
    if (safeGet(TRIAL_CONVERTED_KEY)) return
    const uuid = safeGet(TRIAL_UUID_KEY)
    if (!uuid) return
    safeSet(TRIAL_CONVERTED_KEY, '1')
    pingServer('/api/trial/converted', { uuid, converted_at: Date.now() })
  } catch {
    /* ignore */
  }
}

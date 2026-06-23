// ==================================================================================================
// OpenSankey+ free-trial UI
// --------------------------------------------------------------------------------------------------
// Three pieces, all reading from utils/trial.ts:
//   - ModalTrialWelcomeOSP : shown once on first ever load to offer the 30-day trial.
//                            Two buttons: "Start trial" (opt-in) / "Maybe later".
//   - ModalTrialExpiredOSP : shown once when a started trial reaches day 31.
//                            Two buttons: "Continue free" / "Subscribe".
//   - BannerTrialOSP       : permanent button in the bottom bar that mirrors the trial state.
//                            Acts as the entry point to start the trial after the welcome modal
//                            was dismissed, and as the subscribe CTA otherwise.
// All three are no-ops as soon as the user holds a real OS+ licence.
// ==================================================================================================

import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
} from '@chakra-ui/react'

import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import {
  canStartTrial,
  getTrialState,
  hasBeenOffered,
  hasExpiredBeenAcknowledged,
  markExpiredAcknowledged,
  markTrialOffered,
  startTrial,
} from '../utils/trial'

interface TrialComponentProps {
  app_data: Class_ApplicationDataOSP
}

/** Force the menus and the banner to refresh after a trial state change. */
const refreshAfterTrialChange = (app_data: Class_ApplicationDataOSP) => {
  try {
    app_data.menu_configuration.updateAllMenuComponents()
  } catch { /* menus may not be ready in all contexts */ }
}

// --- Dev override: force the "has account" answer to preview both CTA destinations
//     (set by DevTrialDebugOSP). null = use the real login state. ---
let _dev_force_account: boolean | null = null
export const devSetForceAccount = (v: boolean | null): void => { _dev_force_account = v }
export const devGetForceAccount = (): boolean | null => _dev_force_account

/** Whether the user holds an account. `app_data` is the SA subclass at runtime
 *  (Class_ApplicationDataSA extends the OS+ one), which carries the login component. */
const readHasAccount = (app_data: Class_ApplicationDataOSP): boolean => {
  if (_dev_force_account !== null) return _dev_force_account
  return !!(app_data as unknown as
    { login_component?: { has_account?: boolean } }).login_component?.has_account
}

/** Where the subscribe CTA points. Two things to get right here:
 *  - The app runs under a HashRouter, so client routes live under `/#/...`. A bare
 *    `/license/checkout` hits the Flask server (which doesn't serve it) and lands
 *    nowhere — it must be `#/license/checkout`.
 *  - `/license/checkout` is a PrivateRoute: a user without an account is bounced back
 *    to `/`. So users without an account are sent to account creation instead, which
 *    is the real first step of the subscription funnel. */
export const resolveCheckoutDestination = (app_data: Class_ApplicationDataOSP): string =>
  readHasAccount(app_data) ? '#/license/checkout' : '#/register'

/** Subscribe action shared by the expired modal and the bottom-bar banner. */
export const goToCheckout = (app_data: Class_ApplicationDataOSP): void => {
  window.location.hash = resolveCheckoutDestination(app_data)
}

// --- Dev: force-open the trial modals on demand, bypassing their normal triggers. ---
type Type_TrialModalKind = 'welcome' | 'expired'
const _force_open_listeners: Record<Type_TrialModalKind, Array<() => void>> = { welcome: [], expired: [] }
export const devForceOpenTrialModal = (kind: Type_TrialModalKind): void => {
  _force_open_listeners[kind].forEach((fn) => { try { fn() } catch { /* ignore */ } })
}
const subscribeForceOpen = (kind: Type_TrialModalKind, fn: () => void): (() => void) => {
  _force_open_listeners[kind].push(fn)
  return () => {
    const i = _force_open_listeners[kind].indexOf(fn)
    if (i >= 0) _force_open_listeners[kind].splice(i, 1)
  }
}

// ==================================================================================================
// Welcome modal — first ever load, offers the 30-day opt-in trial
// ==================================================================================================

export const ModalTrialWelcomeOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (app_data.has_real_sankey_plus_licence) return
    // Enrolment closed (2026-06-22): never offer a new trial.
    if (!canStartTrial()) return
    if (hasBeenOffered()) return
    setShow(true)
  }, [app_data])

  // Dev panel can force this modal open regardless of the trigger conditions.
  useEffect(() => subscribeForceOpen('welcome', () => setShow(true)), [])

  const handleStart = () => {
    startTrial()
    setShow(false)
    refreshAfterTrialChange(app_data)
  }

  const handleLater = () => {
    markTrialOffered()
    setShow(false)
    refreshAfterTrialChange(app_data)
  }

  return (
    <Modal
      isCentered
      isOpen={show}
      onClose={handleLater}
      variant='modal_dialog'
    >
      <ModalOverlay />
      <ModalContent maxWidth='inherit'>
        <ModalHeader>{t('Trial.welcome_title')}</ModalHeader>
        <ModalBody textStyle='h4'>
          <Box>
            <Text mb='2'>{t('Trial.welcome_body')}</Text>
            <Text fontStyle='italic' opacity={0.8}>{t('Trial.welcome_hint')}</Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={handleLater}
            >
              {t('Trial.welcome_later')}
            </Button>
            <Button
              variant='menuconfigpanel_add_button'
              onClick={handleStart}
            >
              {t('Trial.welcome_start')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// ==================================================================================================
// Expired modal — shown once when a started trial reaches day 31
// ==================================================================================================

export const ModalTrialExpiredOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (app_data.has_real_sankey_plus_licence) return
    // One-shot: never show it again once the user has made a choice.
    if (hasExpiredBeenAcknowledged()) return
    const state = getTrialState()
    // Only nag users who actually started the trial. Users who declined never see this.
    if (state.is_started && state.is_expired) setShow(true)
  }, [app_data])

  // Dev panel can force this modal open regardless of the trigger conditions.
  useEffect(() => subscribeForceOpen('expired', () => setShow(true)), [])

  const dismiss = () => {
    markExpiredAcknowledged()
    setShow(false)
  }

  return (
    <Modal
      isCentered
      isOpen={show}
      onClose={dismiss}
      variant='modal_dialog'
    >
      <ModalOverlay />
      <ModalContent maxWidth='inherit'>
        <ModalHeader>{t('Trial.expired_title')}</ModalHeader>
        <ModalBody textStyle='h4'>
          <Box>
            <Text mb='2'>{t('Trial.expired_body')}</Text>
            <Text fontStyle='italic' opacity={0.8}>{t('Trial.expired_hint')}</Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant='menuconfigpanel_del_button'
              onClick={dismiss}
            >
              {t('Trial.continue_free')}
            </Button>
            <Button
              variant='menuconfigpanel_add_button'
              onClick={() => { dismiss(); goToCheckout(app_data) }}
            >
              {t('Trial.subscribe')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// ==================================================================================================
// Bottom-bar banner — permanent state-aware CTA
// --------------------------------------------------------------------------------------------------
// State machine:
//   - has real licence              → hidden
//   - trial active                  → "✦ OS+ trial — N days left"   click → /license/checkout
//   - trial expired (was started)   → "✦ Unlock OpenSankey+"        click → /license/checkout
//   - never started, was offered    → "✦ Start 30-day OS+ trial"    click → starts trial
//   - never started, never offered  → (welcome modal handles it; banner shows "Start trial" too
//                                     so users who closed the modal can still opt in)
// ==================================================================================================

/** A small ticking "version" so the banner re-renders when the user clicks on it. */
let _banner_revision = 0
const banner_listeners: Array<() => void> = []
const bumpBanner = () => {
  _banner_revision += 1
  banner_listeners.forEach((fn) => { try { fn() } catch { /* ignore */ } })
}

/** Refresh menus + bottom-bar banner after a trial state change (used by the dev panel). */
export const refreshTrialUI = (app_data: Class_ApplicationDataOSP): void => {
  refreshAfterTrialChange(app_data)
  bumpBanner()
}

export const BannerTrialOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = useTranslation()
  const [, setRev] = useState(0)

  useEffect(() => {
    const listener = () => setRev((r) => r + 1)
    banner_listeners.push(listener)
    return () => {
      const idx = banner_listeners.indexOf(listener)
      if (idx >= 0) banner_listeners.splice(idx, 1)
    }
  }, [])

  if (app_data.has_real_sankey_plus_licence) return <></>

  const state = getTrialState()

  // Compact icon CTA that matches the surrounding top-bar icon buttons. The
  // descriptive label lives in the tooltip so the button stays small.
  const iconCTA = (label: string, onClick: () => void) => (
    <Tooltip label={label} placement='top'>
      <IconButton
        aria-label={label}
        variant='button_banner_subscription'
        onClick={onClick}
        minW='1.7rem'
        w='1.7rem'
        h='1.7rem'
        p='0.2rem'
        icon={
          <Image
            src={app_data.logo_sankey_plus}
            alt=''
            h='100%'
            w='100%'
            objectFit='contain'
          />
        }
      />
    </Tooltip>
  )

  // Trial active — show countdown CTA pointing at the subscription page.
  // This is the ONLY case where the banner shows: it stays visible until the running
  // trial ends. New enrolment is closed (2026-06-22), so users who never started — and
  // users whose trial has expired — get no banner at all.
  if (state.is_active) {
    return iconCTA(
      t('Trial.banner_active', { days: state.days_remaining }),
      () => goToCheckout(app_data),
    )
  }

  return <></>
}

// Re-export the legacy name so existing imports keep working.
export const ModalTrialOSP = ModalTrialExpiredOSP

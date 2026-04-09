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
import {
  Box,
  Button,
  ButtonGroup,
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
  getTrialState,
  hasBeenOffered,
  hasTrialStarted,
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

/** Subscribe action shared by the welcome and expired modals. */
const goToCheckout = () => {
  // Same target as BannerSubscriptionSA / BannerTrialOSP.
  window.location.href = '/license/checkout'
}

// ==================================================================================================
// Welcome modal — first ever load, offers the 30-day opt-in trial
// ==================================================================================================

export const ModalTrialWelcomeOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = app_data
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (app_data.has_real_sankey_plus_licence) return
    if (hasBeenOffered()) return
    setShow(true)
  }, [app_data])

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
  const { t } = app_data
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (app_data.has_real_sankey_plus_licence) return
    const state = getTrialState()
    // Only nag users who actually started the trial. Users who declined never see this.
    if (state.is_started && state.is_expired) setShow(true)
  }, [app_data])

  return (
    <Modal
      isCentered
      isOpen={show}
      onClose={() => setShow(false)}
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
              onClick={() => setShow(false)}
            >
              {t('Trial.continue_free')}
            </Button>
            <Button
              variant='menuconfigpanel_add_button'
              onClick={() => { setShow(false); goToCheckout() }}
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

export const BannerTrialOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = app_data
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

  // Trial active — show countdown CTA pointing at the subscription page.
  if (state.is_active) {
    return (
      <Tooltip label={t('Trial.banner_active_tooltip')} placement='bottom'>
        <Button
          variant='button_banner_subscription'
          onClick={goToCheckout}
        >
          {t('Trial.banner_active', { days: state.days_remaining })}
        </Button>
      </Tooltip>
    )
  }

  // Trial expired (or trial active but at day 31) — fall back to plain "Unlock" CTA.
  if (hasTrialStarted()) {
    return (
      <Tooltip label={t('Menu.get_premium_tooltip')} placement='bottom'>
        <Button
          variant='button_banner_subscription'
          onClick={goToCheckout}
        >
          {t('Menu.get_premium')}
        </Button>
      </Tooltip>
    )
  }

  // Trial not started yet — offer the opt-in directly from the banner.
  const handleStart = () => {
    startTrial()
    refreshAfterTrialChange(app_data)
    bumpBanner()
  }
  return (
    <Tooltip label={t('Trial.banner_start_tooltip')} placement='bottom'>
      <Button
        variant='button_banner_subscription'
        onClick={handleStart}
      >
        {t('Trial.banner_start')}
      </Button>
    </Tooltip>
  )
}

// Re-export the legacy name so existing imports keep working.
export const ModalTrialOSP = ModalTrialExpiredOSP

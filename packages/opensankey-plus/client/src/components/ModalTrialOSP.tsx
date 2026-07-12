// ==================================================================================================
// Essai gratuit 30 jours — UI (piloté par la base, plus de localStorage)
// --------------------------------------------------------------------------------------------------
// L'état d'essai vient du serveur (/auth/license → `trial`), poussé sur app_data.trial par AppSA.
//   - BannerTrialOSP        : CTA de la topbar, reflète l'état d'essai/licence.
//       · essai actif                → « N jours restants » (décompte discret)   → abonnement
//       · licence OS+ (pas Suite)    → « Passer à SankeySuite »                   → abonnement
//       · peut démarrer un essai     → « Essayer 30 jours gratuitement »          → #/license/trial
//       · sinon (gratuit / expiré)   → « Obtenir une licence »                    → abonnement
//   - ModalTrialExpiredOSP  : message unique à l'expiration (projets payants en lecture seule),
//                             explique comment rouvrir (abonnement + « nous écrire pour un devis »).
// Toutes les pièces s'effacent dès que l'utilisateur détient la licence réelle correspondante.
// ==================================================================================================

import React, { FC, useEffect, useState } from 'react'
import { useModelBinding } from '@terriflux/opensankey/src/hooks/useModelBinding'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
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

interface TrialComponentProps {
  app_data: Class_ApplicationDataOSP
}

/** Adresse « nous écrire pour un devis » (mailto — pas de nouveau tunnel pour l'instant). */
const CONTACT_EMAIL = 'contact@terriflux.fr'

/** Petit helper bilingue local pour les libellés d'essai non encore traduits en 5 langues. */
const trLang = (fr: string, en: string): string =>
  ((i18next.language || 'fr').split('-')[0] === 'en' ? en : fr)

/** Le checkout est public (email collecté par Stripe, compte créé par webhook). */
export const resolveCheckoutDestination = (_app_data: Class_ApplicationDataOSP): string =>
  '#/license/checkout'

/** Abonnement (partagé par la modale d'expiration et le banner). */
export const goToCheckout = (app_data: Class_ApplicationDataOSP): void => {
  window.location.hash = resolveCheckoutDestination(app_data)
}

/** Démarrage d'essai depuis l'app (même mécanique que le site : route #/license/trial). */
export const goToTrial = (plan: 'plus' | 'suite'): void => {
  window.location.hash = `#/license/trial?plan=${plan}`
}

// --- Rafraîchissement du banner après un changement d'état (re-render forcé). ---
const banner_listeners: Array<() => void> = []
const bumpBanner = () => {
  banner_listeners.forEach((fn) => { try { fn() } catch { /* ignore */ } })
}

/** Rafraîchit menus + banner après un changement d'état d'essai. */
export const refreshTrialUI = (app_data: Class_ApplicationDataOSP): void => {
  try {
    app_data.menu_configuration.updateAllMenuComponents()
  } catch { /* menus may not be ready in all contexts */ }
  bumpBanner()
}

// ==================================================================================================
// Modale d'expiration — message unique quand l'essai vient d'expirer sans licence
// ==================================================================================================

/** Clé de session pour n'afficher la modale d'expiration qu'une fois par session. */
const EXPIRED_ACK_KEY = 'trial_expired_ack'

/** True si un essai a expiré et que l'utilisateur n'a pas de licence réelle (→ lecture seule). */
const isTrialExpiredNoLicence = (app_data: Class_ApplicationDataOSP): boolean => {
  if (app_data.has_real_sankey_plus_licence) return false
  const used = app_data.trial_used_plus || app_data.trial_used_suite
  const active = app_data.trial_active_plus || app_data.trial_active_suite
  return used && !active
}

export const ModalTrialExpiredOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isTrialExpiredNoLicence(app_data)) return
    try {
      if (sessionStorage.getItem(EXPIRED_ACK_KEY)) return
    } catch { /* sessionStorage indisponible : on affiche */ }
    setShow(true)
  }, [app_data, app_data.trial])

  const dismiss = () => {
    try { sessionStorage.setItem(EXPIRED_ACK_KEY, '1') } catch { /* ignore */ }
    setShow(false)
  }

  return (
    <Modal isCentered isOpen={show} onClose={dismiss} variant='modal_dialog'>
      <ModalOverlay />
      <ModalContent maxWidth='inherit'>
        <ModalHeader>{t('Trial.expired_title')}</ModalHeader>
        <ModalBody textStyle='h4'>
          <Box>
            <Text mb='2'>
              {trLang(
                'Votre essai gratuit est terminé. Vos projets utilisant des fonctions payantes ' +
                'passent en lecture seule — aucune donnée n’est supprimée. Abonnez-vous pour les rouvrir.',
                'Your free trial has ended. Projects using paid features are now read-only — ' +
                'no data is deleted. Subscribe to reopen them.',
              )}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              as='a'
              href={`mailto:${CONTACT_EMAIL}`}
              variant='menuconfigpanel_del_button'
            >
              {trLang('Nous écrire pour un devis', 'Contact us for a quote')}
            </Button>
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
// Banner topbar — CTA reflétant l'état d'essai/licence
// ==================================================================================================

export const BannerTrialOSP: FC<TrialComponentProps> = ({ app_data }) => {
  const { t } = useTranslation()
  // #247 — re-render forcé (identité stable) sur notification du bandeau ; désabonné au démontage.
  useModelBinding(undefined, refresh => {
    banner_listeners.push(refresh)
    return () => {
      const idx = banner_listeners.indexOf(refresh)
      if (idx >= 0) banner_listeners.splice(idx, 1)
    }
  })

  // Top tier (SankeySuite) déjà détenu → plus rien à vendre.
  if (app_data.has_real_sankey_suite_licence) return <></>

  const iconCTA = (label: string, onClick: () => void, logo: string = app_data.logo_sankey_plus) => (
    <Tooltip label={label} placement='top'>
      <IconButton
        aria-label={label}
        variant='button_banner_subscription'
        onClick={onClick}
        minW='1.7rem'
        w='1.7rem'
        h='1.7rem'
        p='0.2rem'
        icon={<Image src={logo} alt='' h='100%' w='100%' objectFit='contain' />}
      />
    </Tooltip>
  )

  const textCTA = (label: string, tooltip: string, logo: string, onClick: () => void) => (
    <Tooltip label={tooltip} placement='top'>
      <Button
        aria-label={label}
        variant='button_banner_subscription'
        onClick={onClick}
        h='1.7rem'
        leftIcon={<Image src={logo} alt='' h='1.2rem' w='1.2rem' objectFit='contain' />}
      >
        {label}
      </Button>
    </Tooltip>
  )

  // Décompte discret (essai en cours) pointant vers l'abonnement. L'icône et le
  // libellé reflètent le plan effectivement en essai (Suite ⊃ OS+).
  const countdownCTA = () => {
    const days = app_data.trial_days_remaining
    if (app_data.trial_active_suite) {
      return iconCTA(
        trLang(`Essai SankeySuite — ${days} j restants`, `SankeySuite trial — ${days} days left`),
        () => goToCheckout(app_data),
        app_data.logo_sankey_suite,
      )
    }
    return iconCTA(
      t('Trial.banner_active', { days }),
      () => goToCheckout(app_data),
      app_data.logo_sankey_plus,
    )
  }
  // Bouton « Essayer SankeySuite » (escalade depuis OS+).
  const suiteTrialCTA = () => textCTA(
    trLang('Essayer SankeySuite 30 j', 'Try SankeySuite for 30 days'),
    trLang('Essai gratuit de SankeySuite (AFM), sans carte', 'Free SankeySuite (MFA) trial, no credit card'),
    app_data.logo_sankey_suite,
    () => goToTrial('suite'),
  )

  // Essai SankeySuite actif → haut de l'échelle : juste le décompte.
  if (app_data.trial_active_suite) {
    return countdownCTA()
  }

  // Essai OpenSankey+ actif → décompte + proposer l'essai SankeySuite (inclut OS+),
  // tant qu'il n'a pas été consommé. Démarrer l'essai Suite remplace l'essai OS+
  // en cours (Suite ⊇ OS+ : aucun accès perdu, 30 nouveaux jours).
  if (app_data.trial_active_plus) {
    if (!app_data.trial_used_suite) {
      return (
        <HStack spacing='0.4rem'>
          {countdownCTA()}
          {suiteTrialCTA()}
        </HStack>
      )
    }
    return countdownCTA()
  }

  // CTA d'essai CONTEXTUEL : le plan dépend du niveau courant (escalade).
  //   - licence OS+ réelle (pas Suite) → proposer l'essai SankeySuite (inclut OS+)
  //   - sinon (gratuit / non connecté)  → proposer l'essai OpenSankey+
  // On propose tant que l'essai du plan n'a pas été consommé. Le clic ouvre
  // #/license/trial, qui gère l'inscription/connexion puis démarre l'essai.

  // Licence OS+ réelle (mais pas Suite) : escalade vers l'essai SankeySuite.
  if (app_data.has_real_sankey_plus_licence) {
    if (!app_data.trial_used_suite) {
      return suiteTrialCTA()
    }
    // Essai Suite déjà consommé → CTA abonnement Suite.
    return textCTA(
      t('Trial.banner_subscribe_suite'),
      t('Trial.banner_subscribe_suite_tooltip'),
      app_data.logo_sankey_suite,
      () => goToCheckout(app_data),
    )
  }

  // Gratuit / non connecté, essai OS+ jamais pris → proposer l'essai OpenSankey+.
  if (!app_data.trial_used_plus) {
    return textCTA(
      trLang('Essayer 30 jours gratuitement', 'Start your 30-day free trial'),
      trLang('Essai gratuit d’OpenSankey+, sans carte bancaire', 'Free OpenSankey+ trial, no credit card'),
      app_data.logo_sankey_plus,
      () => goToTrial('plus'),
    )
  }

  // Essai OS+ déjà consommé mais Suite jamais pris → enchaîner sur l'essai SankeySuite.
  if (!app_data.trial_used_suite) {
    return suiteTrialCTA()
  }

  // Les deux essais consommés → CTA abonnement toujours visible.
  return textCTA(
    t('Trial.banner_subscribe'),
    t('Trial.banner_subscribe_tooltip'),
    app_data.logo_sankey_plus,
    () => goToCheckout(app_data),
  )
}

// Alias legacy conservé pour les imports existants.
export const ModalTrialOSP = ModalTrialExpiredOSP

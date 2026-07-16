import React, { FC, useState, useEffect } from 'react'
import { Navigate, NavigateFunction, useNavigate, useSearchParams } from 'react-router-dom'
import i18next, { TFunction } from 'i18next'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  Spinner,
} from '@chakra-ui/react'

import { getStripeConfig } from './PaiementFunctions'
import { Presentation } from '../Register/Presentation'
import { LoginComponent } from '../LoginComponent'
import {
  normalizeTrialPlan,
  postTrialStart,
  setPendingTrial,
  clearPendingTrial,
} from './trialFlow'

/** Petit helper bilingue local pour le flux d'essai (évite d'éditer les gros bundles i18n). */
const trLang = (fr: string, en: string): string =>
  ((i18next.language || 'fr').split('-')[0] === 'en' ? en : fr)

// Déclarer le type pour le custom element Stripe. Le namespace global JSX est
// LE mécanisme prévu par React (≤18) pour enregistrer un custom element : pas
// d'équivalent en syntaxe module, d'où le disable ciblé.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'publishable-key'?: string
        'pricing-table-id'?: string
        'locale'?: string
        'customer-email'?: string
      };
    }
  }
}

/**
 * Component avec Pricing Table Stripe.
 * L'utilisateur choisit entre mensuel et annuel directement dans la table Stripe.
 */
export const PaiementCheckout = () => {
  const [publishableKey, setPublishableKey] = useState('')
  const [pricingTableId, setPricingTableId] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Utilisateur connecté : pré-remplir l'email dans le checkout Stripe.
    // Anonyme : 401 ignoré, Stripe collectera l'email sur sa page de paiement.
    fetch(window.location.origin + '/user/infos')
      .then((r) => (r.ok ? r.json() : null))
      .then((infos) => {
        if (infos && infos.email) setCustomerEmail(infos.email)
      })
      .catch(() => { /* anonyme : rien à pré-remplir */ })

    const loadStripeAndKey = async () => {
      try {
        // Récupérer la config Stripe (clé publique + pricing table ID)
        const cfg = await getStripeConfig()
        setPublishableKey(cfg.publicKey)
        setPricingTableId(cfg.pricingTableId)

        // Charger le script Stripe Pricing Table
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/pricing-table.js'
        script.async = true
        script.onload = () => setIsLoading(false)
        script.onerror = () => {
          console.error('Erreur lors du chargement du script Stripe')
          setIsLoading(false)
        }
        document.body.appendChild(script)

        // Cleanup: retirer le script quand le composant est démonté
        return () => {
          document.body.removeChild(script)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de Stripe:', error)
        setIsLoading(false)
      }
    }

    loadStripeAndKey()
  }, [])

  if (isLoading || !publishableKey) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size="xl" />
      </Box>
    )
  }

  // Langue courante (détectée par i18next) : pilote la locale Stripe et les
  // liens retour vers le site vitrine terriflux.com (source éditoriale unique).
  const lang = (i18next.language || 'fr').split('-')[0]
  const stripe_locale = ['en', 'fr', 'es', 'de', 'it'].includes(lang) ? lang : 'auto'
  const site_pricing_url = lang === 'fr' ? 'https://terriflux.com/fr/tarifs/' : 'https://terriflux.com/pricing/'

  return (
    <Box id="checkout" padding="2rem">
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        locale={stripe_locale}
        customer-email={customerEmail || undefined}
      >
      </stripe-pricing-table>
      <Box textAlign="center" marginTop="1rem" fontSize="0.9rem">
        <a href={site_pricing_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
          {i18next.t('Paiement.link_full_pricing')}
        </a>
        {' — '}
        <a href="https://terriflux.com/fr/mentions-legales/" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
          {i18next.t('Paiement.link_legal')}
        </a>
      </Box>
    </Box>
  )
}

/**
 * Create the right redirection after paiement.
 * Ie. if paiement succeeded or not.
 */
export const PaiementReturn = () => {
  const [status, setStatus] = useState(null)
  const [customerEmail, setCustomerEmail] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [searchParams,] = useSearchParams()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      fetch(`/stripe/session-status?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.status)
          setCustomerEmail(data.customer_email || '')
          setNeedsPassword(data.needs_password === true)
          // La conversion d'un essai en abonnement est journalisée côté serveur
          // (webhook Stripe → record_trial_conversion), pas depuis le navigateur.
        })
        .catch((error) => {
          console.error('Erreur lors de la vérification du statut:', error)
        })
    }
  }, [searchParams])

  if (status === 'open') {
    return <Navigate to="/license/checkout" />
  }

  if (status === 'complete') {
    // Checkout anonyme : le compte vient d'être créé par webhook, un email
    // « définissez votre mot de passe » est parti — la page de succès l'explique.
    const params = new URLSearchParams({ p: 'success' })
    if (needsPassword && customerEmail) {
      params.set('email', customerEmail)
      params.set('setpw', '1')
    }
    return <Navigate to={`/license?${params.toString()}`} />
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <Spinner size="xl" />
    </Box>
  )
}

/**
 * Route d'essai gratuit — #/license/trial?plan=plus|suite (ouverte depuis le site, UTM conservés).
 * Démarre l'essai 30 jours (POST /trial/start) si un compte est connecté ; sinon mémorise
 * l'intention et redirige vers la création/connexion de compte (repris au retour dans l'app).
 */
export const PaiementTrial: FC<{
  loginComponent: LoginComponent,
  setLicenses: React.MutableRefObject<() => void>,
  logo: string,
  returnToApp: (navigate: NavigateFunction) => void,
}> = ({ loginComponent, setLicenses, logo, returnToApp }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const plan = normalizeTrialPlan(searchParams.get('plan'))
  const product = plan === 'suite' ? 'MFASankey' : 'OpenSankey+'
  const [phase, setPhase] = useState<'checking' | 'starting' | 'started' | 'already' | 'error'>('checking')

  useEffect(() => {
    let cancelled = false
    fetch(window.location.origin + '/auth/connected')
      .then((r) => {
        if (!r.ok) {
          // Pas de compte connecté : mémoriser l'intention et aller créer/connecter le compte.
          setPendingTrial(plan)
          if (!cancelled) navigate('/register')
          return null
        }
        if (!cancelled) setPhase('starting')
        return postTrialStart(plan)
      })
      .then((res) => {
        if (cancelled || !res) return
        clearPendingTrial()
        if (res.ok) {
          // Rafraîchir les droits (l'essai débloque le plan) puis revenir à l'app.
          loginComponent.checkTokens(setLicenses, true).finally(() => {
            if (cancelled) return
            setPhase('started')
            setTimeout(() => returnToApp(navigate), 1600)
          })
        } else if (res.reason === 'already_used' || res.reason === 'has_license') {
          setPhase('already')
        } else {
          setPhase('error')
        }
      })
      .catch(() => { if (!cancelled) setPhase('error') })
    return () => { cancelled = true }
  }, [plan])

  let message = trLang('Vérification de votre compte…', 'Checking your account…')
  if (phase === 'starting') message = trLang('Activation de votre essai…', 'Activating your trial…')
  else if (phase === 'started') {
    message = trLang(
      `Votre essai gratuit de 30 jours de ${product} est activé. Redirection…`,
      `Your 30-day free trial of ${product} is active. Redirecting…`,
    )
  } else if (phase === 'already') {
    message = trLang(
      `Vous avez déjà utilisé l'essai gratuit de ${product}. Vous pouvez vous abonner.`,
      `You have already used the ${product} free trial. You can subscribe.`,
    )
  } else if (phase === 'error') {
    message = trLang(
      'Impossible de démarrer l’essai pour le moment.',
      'Could not start the trial right now.',
    )
  }

  const busy = phase === 'checking' || phase === 'starting'

  return (
    <div>
      <Box zIndex="1" position="fixed" top="0" width="100%">
        <Box layerStyle='menutop_layout_style' gridTemplateColumns='minmax(7vw, 150px) auto 11rem'>
          <Box margin='0.25rem' alignSelf='center' justifySelf='center'>
            <Image height='5rem' src={logo} alt='navigation logo' onClick={() => returnToApp(navigate)} />
          </Box>
          <Box></Box>
          <Button variant='btn_lone_navigation' onClick={() => returnToApp(navigate)}>
            {i18next.t('UserNav.to_app')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
          <CardHeader style={{ textAlign: 'center' }}>
            {trLang('Essai gratuit 30 jours', '30-day free trial')} — {product}
          </CardHeader>
          <CardBody>
            <div style={{ textAlign: 'center' }}>
              {busy ? <Spinner size="lg" /> : null}
              <Box marginTop="1rem">{message}</Box>
              {(phase === 'already' || phase === 'error') ? (
                <Box display="inline-grid" marginTop="1.5rem" gap="0.5rem">
                  <Button variant='btn_lone_navigation_tertiary' onClick={() => navigate('/license/checkout')}>
                    {trLang('M’abonner', 'Subscribe')}
                  </Button>
                  <Button variant='btn_lone_navigation' onClick={() => returnToApp(navigate)}>
                    {i18next.t('UserNav.to_app')}
                  </Button>
                </Box>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

/**
 * Component that displayed paiement pages :
 * Trigger buy, success paiement or error on paiement
 */
export const PaiementPage: FC<{
  t: TFunction,
  logo: string,
  logo_sankey_plus: string,
  returnToApp: (navigate: NavigateFunction) => void,
}> = ({
  t, logo, logo_sankey_plus, returnToApp
}) => {
  // App data
  const [searchParams,] = useSearchParams()

  // Initialise navigation function
  const navigate = useNavigate()
  const goToCheckout = () => { navigate('/license/checkout') }

  // Init what is displayed
  const status = searchParams.get('p')
  let content, header
  
  if (status === 'buy') {
    header = t('Paiement.win_header_buy')
    content = <>
      <Box>
        {t('Paiement.win_content_buy')}
      </Box>
      <Presentation
        t={t}
        logo_sankey_plus={logo_sankey_plus}
      />
      <Box display="inline-grid">
        <Button
          variant='btn_lone_navigation_tertiary'
          type="submit"
          onClick={goToCheckout}
        >
          {t('Paiement.btn_checkout')}
        </Button>
      </Box>
    </>
  }
  else if (status === 'success') {
    header = t('Paiement.win_header_success')
    const setpwEmail = searchParams.get('setpw') === '1' ? searchParams.get('email') : null
    content = <Box>
      {
        setpwEmail ?
          t('Paiement.win_content_success_setpw', { email: setpwEmail }) :
          t('Paiement.win_content_success')
      }
    </Box>
  }
  else {
    header = t('Paiement.win_header_error')
    content = <Box>
      {t('Paiement.win_content_error')}
    </Box>
  }

  // Page
  return (
    <div>
      <Box
        zIndex="1"
        position="fixed"
        top="0"
        width="100%"
      >
        <Box
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem'
        >
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='center'
          >
            <Image
              height='5rem'
              src={logo}
              alt='navigation logo'
              onClick={() => returnToApp(navigate)}
            />
          </Box>
          <Box></Box>
          <Button
            variant='btn_lone_navigation'
            onClick={() => returnToApp(navigate)}
          >
            {t('UserNav.to_app')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
          <CardHeader
            style={{ 'textAlign': 'center' }}
          >
            {header}
          </CardHeader>
          <CardBody>
            <div style={{ 'textAlign': 'center' }}>
              {content}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
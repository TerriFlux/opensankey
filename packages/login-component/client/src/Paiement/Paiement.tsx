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

  return (
    <Box id="checkout" padding="2rem">
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        locale={'fr'}
        customer-email={customerEmail || undefined}
      >
      </stripe-pricing-table>
    </Box>
  )
}

/**
 * Notify the OpenSankey+ trial analytics endpoint that the anonymous trial UUID stored in
 * this browser has just converted to a paid licence. Idempotent: only pings once per browser.
 *
 * Inlined here on purpose: LoginComponent must not depend on OpenSankey+. The localStorage
 * keys are documented in submodules/OpenSankey+/client/src/utils/trial.ts and must stay in sync.
 */
const notifyTrialConverted = (): void => {
  try {
    if (localStorage.getItem('os_plus_trial_converted')) return
    const uuid = localStorage.getItem('os_plus_trial_uuid')
    if (!uuid) return
    localStorage.setItem('os_plus_trial_converted', '1')
    fetch('/api/trial/converted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, converted_at: Date.now() }),
      keepalive: true,
    }).catch(() => { /* analytics ping is best-effort */ })
  } catch {
    // localStorage unavailable — ignore
  }
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
          if (data.status === 'complete') {
            notifyTrialConverted()
          }
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
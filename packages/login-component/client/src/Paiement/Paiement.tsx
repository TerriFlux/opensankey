import React, { FC, useState, useEffect } from 'react'
import { Navigate, NavigateFunction, useNavigate, useSearchParams } from 'react-router-dom'
import { TFunction } from 'i18next'

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

// Déclarer le type pour le custom element Stripe
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': any;
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
      >
      </stripe-pricing-table>
    </Box>
  )
}

/**
 * Create the right redirection after paiement.
 * Ie. if paiement succeeded or not.
 */
export const PaiementReturn = () => {
  const [status, setStatus] = useState(null)
  const [searchParams,] = useSearchParams()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      fetch(`/stripe/session-status?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.status)
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
    return <Navigate to="/license?p=success" />
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
    content = <Box>
      {t('Paiement.win_content_success')}
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
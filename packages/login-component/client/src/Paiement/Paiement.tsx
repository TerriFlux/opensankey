
import React, { FC, useState, useEffect, useMemo } from 'react'
import { Navigate, NavigateFunction, useNavigate, useSearchParams,useParams } from 'react-router-dom'
import { TFunction } from 'i18next'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  Spinner,
} from '@chakra-ui/react'

import {
  createSubscription,
  getStripePublishableKey,
  LicenseType
} from './PaiementFunctions'
import { Presentation } from '../Register/Presentation'

/**
 * Component that embed stripe paiement page.
 * @return {*}
 */
export const PaiementCheckout = () => {
  const { license } = useParams<{ license: LicenseType }>()
  
  // States
  const [publishableKey, setPublishableKey] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  
  // Créer stripePromise de manière stable
  const stripePromise = useMemo(() => {
    return publishableKey ? loadStripe(publishableKey) : undefined
  }, [publishableKey])

  // Effects
  const fetchPublishableKey = async () => {
    const key = await getStripePublishableKey()
    setPublishableKey(key)
  }

  const fetchClientSecret = async () => {
    if (license) {
      try {
        const secret = await createSubscription(license)
        setClientSecret(secret)
      } catch (error) {
        console.error('Erreur lors de la création de la souscription:', error)
      }
    }
  }

  useEffect(() => {
    fetchPublishableKey()
  }, [])

  useEffect(() => {
    if (license) {
      fetchClientSecret()
    }
  }, [license]) // Se déclenche quand 'license' change

  const options = { clientSecret  }

  return (
    <div id="checkout">
      {
        (stripePromise === undefined || !clientSecret) ?
          <Spinner /> :
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
      }
    </div>
  )
}

/**
 * Create the right redirection after paiement.
 * Ie. if paiement succeeded or not.
 *
 * @return {*}
 */
export const PaiementReturn = () => {
  const [status, setStatus] = useState(null)
  const [searchParams,] = useSearchParams()


  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    fetch(`/stripe/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status)
      })
  }, [])

  if (status === 'open') {
    return (
      <Navigate to="/checkout" />
    )
  }

  if (status === 'complete') {
    return (
      <Navigate to="/license?p=success" />
    )
  }

  return null
}

/**
 * Component that displayed paiement pages :
 * Trigger buy, succes paiement or error on paiement
 *
 * @param {*} {
 *   new_data_app
 * }
 * @return {*}
 */
export const PaiementPage: FC<{
  t: TFunction,
  logo: string,
  logo_sankey_plus:string,
  returnToApp: (navigate: NavigateFunction) => void,
}> = ({
  t,logo,logo_sankey_plus, returnToApp
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
      />,
      <Box
        display="inline-grid"
      >
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

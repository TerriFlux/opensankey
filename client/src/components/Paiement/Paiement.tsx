
import React, { FunctionComponent, useState, useEffect, useCallback } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  Spinner,
} from '@chakra-ui/react'

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { createSubscription, getStripePublishableKey } from './PaiementFunctions'


export const PaiementCheckout = () => {
  // States
  const [publishableKey, setPublishableKey] = useState('')
  let stripePromise = undefined
  if (publishableKey !== '')
    stripePromise = loadStripe(publishableKey)

  // Effects
  const fetchPublishableKey = async () => {
    const key = await getStripePublishableKey()
    setPublishableKey(key)
  }
  useEffect(() => {
    fetchPublishableKey();
  }, []);

  const fetchClientSecret = useCallback(createSubscription, [])

  const options = { fetchClientSecret };

  return (
    <div id="checkout">
      {
        (stripePromise === undefined) ?
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

export const PaiementReturn = () => {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [searchParams, ] = useSearchParams();


  useEffect(() => {
    const sessionId = searchParams.get("session_id")

    fetch(`/stripe/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status)
        setCustomerEmail(data.customer_email)
      });
  }, []);

  if (status === 'open') {
    return (
      <Navigate to="/checkout" />
    )
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
          We appreciate your business! A confirmation email will be sent to {customerEmail}.

          If you have any questions, please email <a href="mailto:contact@terriflux.fr">contact@terriflux.fr</a>.
        </p>
      </section>
    )
  }

  return null;
}

export const PaiementPage: FunctionComponent<{
  new_data_app: Class_ApplicationDataSA
}> = ({
  new_data_app
}) => {
    // App data
    const { t, logo } = new_data_app

    // // States
    // const [publishableKey, setPublishableKey] = useState('')


    // Initialise navigation function
    const navigate = useNavigate()
    const returnToApp = () => { navigate('/') }
    const goToCheckout = () => { navigate('/license/checkout') }

    // // Handler
    // const handleSubmit = async () => {
    //   // Get Stripe object
    //   getStripePublishableKey()
    //   .then(publishableKey => loadStripe(publishableKey))
    //   .then(stripe => {
    //     if (stripe !== null) {
    //     // Get Checkout Session ID
    //     checkoutLicense()
    //       .then((data) => {
    //         console.log(data);
    //         // Redirect to Stripe Checkout
    //         return stripe.redirectToCheckout({ sessionId: data.sessionId })
    //       })
    //       .then((res) => {
    //         console.log(res);
    //       });
    //     }
    //     else {
    //       return Promise.reject(stripe)
    //     }
    //   })
    // }

    // // Effects
    // const fetchPublishableKey = async () => {
    //   const key = await getStripePublishableKey()
    //   setPublishableKey(key)
    // }
    // useEffect(() => {
    //   fetchPublishableKey();
    // }, []);

    return (
      <div>
        <Box
          zIndex="1"
          position="fixed"
          top="0"
          width="100%"
        >
          <Box
            className='MenuNavigation'
            layerStyle='menutop_layout_style'
            gridTemplateColumns='minmax(7vw, 150px) auto 11rem'
          >
            <Box
              margin='0.25rem'
              alignSelf='center'
              justifySelf='center'
            >
              <Image
                height='4rem'
                src={logo}
                alt='navigation logo'
                onClick={() => returnToApp()}
              />
            </Box>
            <Box></Box>
            <Button
              variant='btn_lone_navigation'
              onClick={() => returnToApp()}
            >
              {t('UserPages.to_app')}
            </Button>
          </Box>
        </Box>

        <div className="login-wrapper">
          <Card variant='card_register' width='33vw'>
            <CardHeader
              style={{ 'textAlign': 'center' }}
            >
              {t('Paiement.license_checkout_win')}
            </CardHeader>
            <CardBody>
              <div style={{ 'textAlign': 'center' }}>
                <Button
                  variant='btn_lone_navigation_tertiary'
                  type="submit"
                  onClick={goToCheckout}
                >
                  {t('Paiement.checkout_btn')}
                </Button>
              </div>
              {/* <StripeProvider
              publishableKey={publishableKey}
              urlScheme="open-sankey" // required for 3D Secure and bank redirects
            >
            </StripeProvider> */}
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

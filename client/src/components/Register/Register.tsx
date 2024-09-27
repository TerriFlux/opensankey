
import * as d3 from 'd3'
import React, { FunctionComponent, useState, useRef } from 'react'
import i18next from 'i18next'

import ReCAPTCHA from 'react-google-recaptcha'
import { useNavigate } from 'react-router-dom'
import { FaCheck } from 'react-icons/fa'
import { LuBadgeAlert } from 'react-icons/lu'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  ChakraProvider,
  FormControl,
  FormErrorMessage,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  useDisclosure,
} from '@chakra-ui/react'

import { opensankey_theme } from '../../deps/OpenSankey+/deps/OpenSankey/chakra/Theme'

import TermsOfUse from './TermsOfUse'
import {
  registerNewLicenseOpenOSP,
  registerNewLicenseSankeySuite
} from './LicenseFunctions'
import { Class_ApplicationDataSA } from '../../ApplicationData'


// Check Licence and register account if everything is Ok
async function userSignUp(
  email: string,
  password: string,
  firstname: string,
  lastname: string,
  license_opensankeyplus: string,
  license_sankeysuite: string,
  navigate: (route: string) => void
) {

  d3.select('.LogError').selectAll('*').remove()
  // Enregistrement dans la base de donnée utilisateur
  fetch(window.location.origin + '/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      firstname: firstname,
      lastname: lastname,
      license_opensankeyplus: license_opensankeyplus,
      license_sankeysuite: license_sankeysuite
    })
  })
    .then((response) => response.json())
    .then((response) => {
      if (response['is_registered'] === true) {
        // Enregistrement licence OpenSankey+
        if (license_opensankeyplus !== '') {
          registerNewLicenseOpenOSP(license_opensankeyplus)
        }
        // Enregistrement licence SankeySuite
        if (license_sankeysuite !== '') {
          registerNewLicenseSankeySuite(license_sankeysuite)
        }
        // Envoi du mail de bienvenue
        sendWelcomeMail(email, firstname)
        // On retourne vers la page de login
        d3.select('.LogError')
          .html('<p style="color:green">' + i18next.t('msg.ok account created', { ns: 'register' }) + '</p>')
        setTimeout(() => {
          navigate('/login')
        }, 8000)
      }
      else {
        d3.select('.LogError')
          .html('<p style="color:red">' + i18next.t('err.' + response['message'], { ns: 'register' }) + '</p>')
      }
    })
    .catch(error =>
      console.log('POST signup : ERROR', error)
    )
}

// Check a license status
async function sendWelcomeMail(
  email: string,
  firstname: string
) {
  // Get server api url
  const path = window.location.origin
  const url = path + '/mail/send_welcome'
  // use server as proxy to fetch informations
  // -> Avoid "Same-Origin" problem with CORS
  const data = fetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'email': email,
        'firstname': firstname,
        'lang': i18next.language
      })
    }
  )
  return data
}

// UI : License checkin
export type RegisterType = {
  new_data_app: Class_ApplicationDataSA
}

const Register: FunctionComponent<RegisterType> = ({
  new_data_app,
}) => {

  // App data
  const { t, logo } = new_data_app

  // License registrering informations
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [firstname, setUserFirstName] = useState('')
  const [lastname, setUserLastName] = useState('')
  const [license_opensankeyplus, setUserLicenseOpenOSP] = useState('')
  // const [license_sankeysuite, setUserLicenseSankeySuite] = useState('')
  const captchaRef = useRef<ReCAPTCHA>(null)

  // Initialise navigation function
  const navigate = useNavigate()
  const returnToApp = () => {
    // set_update(!update)
    navigate('/')
  }
  // Terms of use modal
  const { isOpen, onOpen, onClose } = useDisclosure()
  // Ok for account creation
  const [okUserName, setOkUserName] = useState(0)
  const [okPassword, setOkPassword] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [okUserFirstName, setOkUserFirstName] = useState(0)
  const [okUserLastName, setOkUserLastName] = useState(0)
  const [okTermsOfUses, setOkTermsOfUses] = useState(false)
  const [okCaptcha, setOkCaptcha] = useState(false)
  const okAccountInfos =
    (okUserName > 1) &&
    (okPassword > 1) &&
    (okUserFirstName > 1) &&
    (okUserLastName > 1) &&
    okTermsOfUses &&
    okCaptcha

  // Handler : License registrering
  const handleSubmit = async () => {
    if (okAccountInfos) {
      await userSignUp(
        userName,
        password,
        firstname,
        lastname,
        license_opensankeyplus,
        '',
        navigate
      )
      // Enregistre les nom et prenom de l'utilisateurs dans un cookie
      const cook = 'info_log={"' + userName + '":{"lastname":"' + lastname + '","firstname":"' + firstname + '"}}'
      const expiration = 1000 * 60 * 60 * 24 * -3 //le temps pour que le cookie expire en ms (ms*secondes*minutes*heures*jours)
      const tmp = cook + ';path=/;+expires=' + new Date(Date.now() + expiration).toUTCString()
      document.cookie = tmp
      // suiteApplicationContext.has_free_account = false
      // setSuiteApplicationContext({ ...suiteApplicationContext })
    }
    else {
      d3.select('.LogError').html('<p style="color:red">' + t('err.captcha', { ns: 'register' }) + '</p>')
    }
  }

  return (<ChakraProvider resetCSS={false} theme={opensankey_theme}>
    <Box
      zIndex="1"
      position="fixed"
      top="0"
      width="100%"
    >
      <Box
        className='MenuNavigation'
        layerStyle='menutop_layout_style'
        gridTemplateColumns='minmax(7vw, 150px) auto 11rem 11rem'
      >
        <Box
          margin='0.25rem'
          alignSelf='center'
          justifySelf='left'
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
          onClick={() => { returnToApp() }}>
          {t('UserPages.to_app')}
        </Button>
        <Button
          variant='btn_lone_navigation_secondary'
          onClick={() => navigate('/login')}>
          {t('UserPages.to_con')}
        </Button>
      </Box>
    </Box>

    {/* Register form */}
    <div className="register-form-wrapper">
      <Card variant='card_register'>
        <CardHeader >
          {t('reg_win', { ns: 'register' })}
        </CardHeader>
        <CardBody>

          {/* User e-mail*/}
          <FormControl isInvalid={okUserName === 1}>
            <InputGroup>
              <InputLeftAddon width='25%'>
                {t('id.label', { ns: 'register' })}
              </InputLeftAddon>
              <Input
                isRequired
                type='email'
                placeholder={t('id.placeholder', { ns: 'register' })}
                onChange={e => {
                  // Control e-amil format
                  if (e.target.value.match('[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}') != null) {
                    setUserName(e.target.value)
                    setOkUserName(2)
                  }
                  else {
                    setUserName('')
                    setOkUserName(1)
                  }
                }}
              />
            </InputGroup>
            {(okUserName === 1) ? (
              <FormErrorMessage>{t('id.error', { ns: 'register' })}</FormErrorMessage>
            ) : (
              <></>
            )}
          </FormControl>

          {/* User password*/}
          <FormControl isInvalid={okPassword === 1}>
            <InputGroup>
              <InputLeftAddon width='25%'>
                {t('pwd.label', { ns: 'register' })}
              </InputLeftAddon>
              <Input
                isRequired
                type={showPassword ? 'text' : 'password'}
                placeholder={t('pwd.placeholder', { ns: 'register' })}
                onChange={e => {
                  if (e.target.value.match('^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\n\r\t]).{8,}$') != null) {
                    setPassword(e.target.value)
                    setOkPassword(2)
                  }
                  else {
                    setPassword('')
                    setOkPassword(1)
                  }
                }}
              />
              <InputRightElement width='4.5rem' marginRight='0.25em'>
                <Button
                  h='1.75rem'
                  size='sm'
                  border='0px'
                  bg='gray.50'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? t('pwd.hide', { ns: 'register' }) : t('pwd.show', { ns: 'register' })}
                </Button>
              </InputRightElement>
            </InputGroup>
            {(okPassword === 1) ? (
              <FormErrorMessage>
                {t('pwd.error', { ns: 'register' })}
              </FormErrorMessage>
            ) : (
              <></>
            )}
          </FormControl>

          {/* User first name  */}
          <FormControl isInvalid={okUserFirstName === 1}>
            <InputGroup>
              <InputLeftAddon width='25%'>
                {t('fn', { ns: 'register' })}
              </InputLeftAddon>
              <Input
                isRequired
                type='text'
                onChange={e => {
                  // Control format
                  if (e.target.value.match('^[a-zéèêïA-Z ,.\'-]+$') != null) {
                    setUserFirstName(e.target.value)
                    setOkUserFirstName(2)
                  }
                  else {
                    setUserFirstName('')
                    setOkUserFirstName(1)
                  }
                }}
              />
            </InputGroup>
          </FormControl>

          {/* User last name  */}
          <FormControl isInvalid={okUserLastName === 1}>
            <InputGroup>
              <InputLeftAddon width='25%'>
                {t('ln', { ns: 'register' })}
              </InputLeftAddon>
              <Input
                isRequired
                type='text'
                onChange={e => {
                  // Control format
                  if (e.target.value.match('^[a-zA-Z ,.\'-]+$') != null) {
                    setUserLastName(e.target.value)
                    setOkUserLastName(2)
                  }
                  else {
                    setUserLastName('')
                    setOkUserLastName(1)
                  }
                }}
              />
            </InputGroup>
          </FormControl>

          <Box as='span' textAlign='center' textStyle='h2'>
            {t('lic', { ns: 'register' })}
          </Box>

          {/* OpenSankey+ licence number  */}
          <FormControl>
            <InputGroup>
              <InputLeftAddon width='25%'>
                {t('OS+_lic', { ns: 'register' })}
              </InputLeftAddon>
              <Input
                type='text'
                onChange={e => {
                  // Control format
                  if (e.target.value.match('^([a-zA-Z0-9- ]{2,})$') != null) {
                    setUserLicenseOpenOSP(e.target.value)
                  }
                  else {
                    setUserLicenseOpenOSP('')
                  }
                }}
              />
              <InputRightElement width='4.5rem' marginRight='0.25em'>
                <Button
                  as='a'
                  h='1.75rem'
                  size='sm'
                  border='0px'
                  bg='gray.50'
                  href="https://terriflux.com/downloads/open-sankey-plus/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('OS+_link', { ns: 'register' })}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          {/* Sankey suite Licence number  */}
          {/* <FormControl>
              <InputGroup>
                <InputLeftAddon width='25%'>
                  {t('SS_lic', { ns: 'register' })}
                </InputLeftAddon>
                <Input
                  type='text'
                  onChange={e => {
                    // Control format
                    if (e.target.value.match('^([a-zA-Z0-9- ]{2,})$') != null) {
                      setUserLicenseSankeySuite(e.target.value)
                    }
                    else {
                      setUserLicenseSankeySuite('')
                    }
                  }}
                />
                <InputRightElement width='4.5rem' marginRight='0.25em'>
                  <Button
                    as='a'
                    h='1.75rem'
                    size='sm'
                    border='0px'
                    bg='gray.50'
                    href="https://terriflux.com/downloads/sankey-suite/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('SS_link', { ns: 'register' })}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl> */}

          {/* Acceptance of terms of uses */}
          <Button
            onClick={onOpen}
            leftIcon={(okTermsOfUses === true) ? <FaCheck /> : <LuBadgeAlert />}>
            {t('open', { ns: 'terms_of_uses' })}
          </Button>

          {/* Captcha */}
          <div
            className='form_group_recaptcha'>
            <ReCAPTCHA
              sitekey="6Les5JwmAAAAAOi3F8DLW4Z1aoqVMDBC9WpN1KFe"
              ref={captchaRef}
              onChange={() => {
                const token_captcha = captchaRef.current?.getValue()
                const fetchData = {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    'token': token_captcha
                  })
                }

                const path = window.location.origin
                const url = path + '/auth/check_captcha'
                fetch(url, fetchData).then(
                  r => r.json().then(t => {
                    setOkCaptcha(t['success'])
                  })
                ).catch(() => setOkCaptcha(false))
              }}
            />
          </div>

          <div className='LogError' style={{ 'color': 'red', 'textAlign': 'center' }}></div>

          <Box
            display="inline-grid"
          >
            <Button
              isDisabled={!okAccountInfos}
              variant='btn_lone_navigation_tertiary'
              type='submit'
              onClick={handleSubmit}>
              {t('UserPages.to_reg')}
            </Button>
          </Box>

        </CardBody>
      </Card>
    </div>

    {/* Pop up modal for terms of use  */}
    <TermsOfUse
      isOpen={isOpen}
      onClose={onClose}
      setOk={setOkTermsOfUses}
    />
  </ChakraProvider>
  )
}

export default Register

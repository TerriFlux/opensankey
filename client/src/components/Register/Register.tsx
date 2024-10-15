
import React, { FunctionComponent, useState, useRef } from 'react'

import ReCAPTCHA from 'react-google-recaptcha'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { returnToApp } from '../../SankeyAppSA'
import { logError, userSignUp, userValidate } from './RegisterFunctions'
import TermsOfUse from './TermsOfUse'
import { Presentation } from './Presentation'


export const email_regex_str = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]{2,4}$)'
export const pwd_regex_str = '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\n\r\t]).{8,}$'
export const name_regex_str = '^[a-zéèêïA-Z ,.\'-]+$'
export const lic_regex_str = '^([a-zA-Z0-9- ]{2,})$'

/**
 * Registering page
 * @param {*} {
 *   new_data_app
 * }
 * @return {*}
 */
const Register: FunctionComponent<{
  new_data_app: Class_ApplicationDataSA
}> = ({
  new_data_app
}) => {

  // App data
  const { t, logo } = new_data_app

  // Step to register
  const [registerStep, setRegisterStep] = useState(0)

  // License registrering informations
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [firstname, setUserFirstName] = useState('')
  const [lastname, setUserLastName] = useState('')
  const captchaRef = useRef<ReCAPTCHA>(null)

  // Initialise navigation function
  const navigate = useNavigate()

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
    // step 0 : License presentation
    if (registerStep === 0) {
      setRegisterStep(1)
    }
    // step 1 : Get user infos
    else if (registerStep === 1) {
      if (okAccountInfos) {
        // Enregistre les nom et prenom de l'utilisateurs dans un cookie
        const cook = 'info_log={"' + userName + '":{"lastname":"' + lastname + '","firstname":"' + firstname + '"}}'
        const expiration = 1000 * 60 * 60 * 24 * -3 //le temps pour que le cookie expire en ms (ms*secondes*minutes*heures*jours)
        const tmp = cook + ';path=/;+expires=' + new Date(Date.now() + expiration).toUTCString()
        document.cookie = tmp
        // backend SignUp
        await userSignUp(
          userName,
          password,
          firstname,
          lastname
        )
      }
      else {
        logError(t('Register.account.msg.err_captcha'))
      }
    }
  }

  // Token validation
  const [searchParams,] = useSearchParams()
  const token = searchParams.get('t')
  if (token && registerStep !== 2) {
    setRegisterStep(2)
    userValidate(
      token,
      new_data_app,
      navigate
    )
  }

  const log = <>
    <div className='LogInfo' style={{ 'color': 'green', 'textAlign': 'center' }}></div>
    <div className='LogError' style={{ 'color': 'red', 'textAlign': 'center' }}></div>
  </>

  const osplus_presentation = [
    <Presentation
      new_data_app={new_data_app}
    />,
    <Box
      display="inline-grid"
    >
      <Button
        variant='btn_lone_navigation_tertiary'
        maxWidth='inherit'
        width='fit-content'
        type='submit'
        onClick={handleSubmit}>
        {t('Register.presentation.btn_next')}
      </Button>
    </Box>
  ]

  const register_form = [
    // {/* User e-mail*/}
    <FormControl isInvalid={okUserName === 1}>
      <InputGroup
        variant='register_input'
      >
        <InputLeftAddon>
          {t('Register.account.id.label')}
        </InputLeftAddon>
        <Input
          isRequired
          type='email'
          placeholder={t('Register.account.id.placeholder')}
          onChange={e => {
            // Control e-amil format
            if (e.target.value.match(email_regex_str) != null) {
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
        <FormErrorMessage>{t('Register.account.id.error')}</FormErrorMessage>
      ) : (
        <></>
      )}
    </FormControl>,

    // {/* User password*/}
    <FormControl isInvalid={okPassword === 1}>
      <InputGroup
        variant='register_input'
      >
        <InputLeftAddon>
          {t('Register.account.pwd.label')}
        </InputLeftAddon>
        <Input
          isRequired
          type={showPassword ? 'text' : 'password'}
          placeholder={t('Register.account.pwd.placeholder')}
          onChange={e => {
            if (e.target.value.match(pwd_regex_str) != null) {
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
            {showPassword ? t('Register.account.pwd.hide') : t('Register.account.pwd.show')}
          </Button>
        </InputRightElement>
      </InputGroup>
      {(okPassword === 1) ? (
        <FormErrorMessage>
          {t('Register.account.pwd.error')}
        </FormErrorMessage>
      ) : (
        <></>
      )}
    </FormControl>,

    // {/* User first name  */}
    <FormControl isInvalid={okUserFirstName === 1}>
      <InputGroup
        variant='register_input'
      >
        <InputLeftAddon>
          {t('Register.account.fn')}
        </InputLeftAddon>
        <Input
          isRequired
          type='text'
          onChange={e => {
            // Control format
            if (e.target.value.match(name_regex_str) != null) {
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
    </FormControl>,

    // {/* User last name  */}
    <FormControl isInvalid={okUserLastName === 1}>
      <InputGroup
        variant='register_input'
      >
        <InputLeftAddon>
          {t('Register.account.ln')}
        </InputLeftAddon>
        <Input
          isRequired
          type='text'
          onChange={e => {
            // Control format
            if (e.target.value.match(name_regex_str) != null) {
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
    </FormControl>,

    // {/* Acceptance of terms of uses */}
    <Button
      onClick={onOpen}
      leftIcon={(okTermsOfUses === true) ? <FaCheck /> : <LuBadgeAlert />}>
      {t('Register.account.btn_terms')}
    </Button>,

    // {/* Captcha */}
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
          const url = path + '/auth/signup/check_captcha'
          fetch(url, fetchData).then(
            r => r.json().then(t => {
              setOkCaptcha(t['success'])
            })
          ).catch(() => setOkCaptcha(false))
        }}
      />
    </div>,

    // Info / Error logs
    log,

    // Validation button
    <Box
      display="inline-grid"
    >
      <Button
        isDisabled={!okAccountInfos}
        variant='btn_lone_navigation_tertiary'
        type='submit'
        onClick={handleSubmit}>
        {t('Register.account.btn_next')}
      </Button>
    </Box>,
  ]


  let header = '404 not found'
  let content = [<></>]
  if (registerStep === 0) {
    header = t('Register.presentation.title')
    content = osplus_presentation
  }
  else if (registerStep === 1) {
    header = t('Register.account.title')
    content = register_form
  }
  else if (registerStep === 2) {
    header = t('Register.validation.title')
    content = [log]
  }

  return (
    <ChakraProvider resetCSS={false} theme={opensankey_theme}>
      {/* Navbar */}
      <Box
        zIndex="1"
        position="fixed"
        top="0"
        width="100%"
      >
        <Box
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem 11rem'
        >
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='left'
          >
            <Image
              height='5rem'
              src={logo}
              alt='navigation logo'
              onClick={() => returnToApp(new_data_app, navigate)}
            />
          </Box>
          <Box></Box>
          <Button
            variant='btn_lone_navigation'
            onClick={() => { returnToApp(new_data_app, navigate) }}>
            {t('UserNav.to_app')}
          </Button>
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/login')}>
            {t('UserNav.to_con')}
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
            {content.map((e, i) => { return <React.Fragment key={i}>{e}</React.Fragment> })}
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

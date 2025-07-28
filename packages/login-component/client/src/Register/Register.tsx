
import React, { FunctionComponent, useState, useRef } from 'react'

import ReCAPTCHA from 'react-google-recaptcha'
import { useNavigate,NavigateFunction, useSearchParams } from 'react-router-dom'
import { FaCheck } from 'react-icons/fa'
import { LuBadgeAlert } from 'react-icons/lu'
import { TFunction } from 'i18next'

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
  Spinner,
  useDisclosure,
} from '@chakra-ui/react'

// import { Class_ApplicationDataSA } from '../../types/ApplicationDataSA'
// import { returnToApp } from '../../AppSA'
//import { Theme_SankeyApplication } from '../../chakra/Theme'
import { logError, userSignUp, userValidate } from './RegisterFunctions'
import TermsOfUse from './TermsOfUse'
import { Presentation } from './Presentation'
import { LoginComponent } from '../LoginComponent'


export const email_regex_str = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,})$'
export const pwd_regex_str = '^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\n\r\t]).{8,}$'
export const name_regex_str = '^[a-zéèêïA-Z]+([ ,.\'-][a-zéèêïA-Z]+)*[a-zéèêïA-Z]*$'
export const lic_regex_str = '^([a-zA-Z0-9- ]{2,})$'

/**
 * Registering page
 * @param {*} {
 *   new_data_app
 * }
 * @return {*}
 */
const Register: FunctionComponent<{
  t: TFunction,
  logo: string,
  logo_sankey_plus: string,
  loginComponent:()=>LoginComponent,
  noLicenceAccountRequired:boolean,
  setUpdate:React.MutableRefObject<() => void>,
  returnToApp: (navigate: NavigateFunction) => void,
  theme:Record<string, any>
}> = ({
  t, logo, logo_sankey_plus, loginComponent,noLicenceAccountRequired, setUpdate, returnToApp,theme
}) => {
  // Step to register
  const [on_wait, setOnWait] = useState(false)
  const [registerStep, setRegisterStep] = useState(0)

  // License registrering informations
  const [user_name, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [firstname, setUserFirstName] = useState('')
  const [lastname, setUserLastName] = useState('')
  const captchaRef = useRef<ReCAPTCHA>(null)

  // Initialise navigation function
  const navigate = useNavigate()

  // Terms of use modal
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Ok for account creation
  const [ok_email, setOkEmail] = useState(0)
  const [ok_password, setOkPassword] = useState(0)
  const [show_password, setShowPassword] = useState(false)
  const [ok_firstname, setOkFirstName] = useState(0)
  const [ok_lastname, setOkLastName] = useState(0)
  const [ok_terms_of_uses, setOkTermsOfUses] = useState(false)
  const [ok_captcha, setOkCaptcha] = useState(false)
  const [ok_account_created, setOkAccountCreated] = useState(false)
  const okAccountInfos =
      (ok_email > 1) &&
      (ok_password > 1) &&
      (ok_firstname > 1) &&
      (ok_lastname > 1) &&
      ok_terms_of_uses &&
      ok_captcha &&
      (!ok_account_created)

  // Handler : License registrering
  const handleSubmit = async () => {
    // step 0 : License presentation
    if (registerStep === 0) {
      setRegisterStep(1)
    }
    // step 1 : Get user infos
    else if (registerStep === 1) {
      if (okAccountInfos) {
        // backend SignUp
        setOnWait(true)
        await userSignUp(
          user_name,
          password,
          firstname,
          lastname,
          (ok: boolean) => {
            setOkAccountCreated(ok)
          }
        )
          .then(() =>
            setOnWait(false)
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
      loginComponent,
      navigate,
      setUpdate
    )
  }

  // Loging message
  const log = <>
    <div
      className='LogError'
      style={{
        'color': 'red',
        'justifySelf': 'center',
        'textAlign': 'center'
      }}>

    </div>
    <div
      className='LogInfo'
      style={{
        'color': 'green',
        'justifySelf': 'center',
        'textAlign': 'center'
      }}>
    </div>
  </>

  const osplus_presentation = [
    <Presentation
      t={t}
      logo_sankey_plus={logo_sankey_plus}
    />,
    <Box
      display="inline-grid"
    >
      {noLicenceAccountRequired ? <Button
        variant='btn_lone_navigation_tertiary'
        maxWidth='inherit'
        width='fit-content'
        onClick={() => window.location.href = 'mailto:contact@terriflux.fr?subject=Demande de devis'}>
        {t('Register.presentation.btn_next')}
      </Button> : <Button
        variant='btn_lone_navigation_tertiary'
        maxWidth='inherit'
        width='fit-content'
        type='submit'
        onClick={handleSubmit}>
        {t('Register.presentation.btn_next')}
      </Button>
      }
    </Box>
  ]

  const register_form = [
    // {/* User e-mail*/}
    <FormControl isInvalid={ok_email === 1}>
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
              setOkEmail(2)
            }
            else {
              setUserName('')
              setOkEmail(1)
            }
          }}
        />
      </InputGroup>
      {(ok_email === 1) ? (
        <FormErrorMessage>{t('Register.account.id.error')}</FormErrorMessage>
      ) : (
        <></>
      )}
    </FormControl>,

    // {/* User password*/}
    <FormControl isInvalid={ok_password === 1}>
      <InputGroup
        variant='register_input'
      >
        <InputLeftAddon>
          {t('Register.account.pwd.label')}
        </InputLeftAddon>
        <Input
          isRequired
          type={show_password ? 'text' : 'password'}
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
            onClick={() => setShowPassword(!show_password)}
          >
            {show_password ? t('Register.account.pwd.hide') : t('Register.account.pwd.show')}
          </Button>
        </InputRightElement>
      </InputGroup>
      {(ok_password === 1) ? (
        <FormErrorMessage>
          {t('Register.account.pwd.error')}
        </FormErrorMessage>
      ) : (
        <></>
      )}
    </FormControl>,

    // {/* User first name  */}
    <FormControl isInvalid={ok_firstname === 1}>
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
              setOkFirstName(2)
            }
            else {
              setUserFirstName('')
              setOkFirstName(1)
            }
          }}
        />
      </InputGroup>
    </FormControl>,

    // {/* User last name  */}
    <FormControl isInvalid={ok_lastname === 1}>
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
              setOkLastName(2)
            }
            else {
              setUserLastName('')
              setOkLastName(1)
            }
          }}
        />
      </InputGroup>
    </FormControl>,

    // {/* Acceptance of terms of uses */}
    <Button
      onClick={onOpen}
      leftIcon={(ok_terms_of_uses === true) ? <FaCheck /> : <LuBadgeAlert />}>
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
          fetch(url, fetchData)
            .then(r => {
              r.json()
                .then(t => {
                  setOkCaptcha(t['success'])
                })
            })
            .catch(error => {
              console.error('Error in checkCaptcha - ' + error.toString())
              setOkCaptcha(false)
            })
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
        isDisabled={!okAccountInfos || on_wait}
        variant='btn_lone_navigation_tertiary'
        type='submit'
        onClick={handleSubmit}
      >
        {
          on_wait ?
            <Spinner /> :
            t('Register.account.btn_next')
        }
      </Button>
    </Box>,
  ]


  let header = '404 not found'
  let content = [<></>]
  let width = '33vw'
  if (registerStep === 0) {
    header = t('Register.presentation.title')
    content = osplus_presentation
    width = '50vw'
  }
  else if (registerStep === 1) {
    header = t('Register.account.title')
    content = register_form
  }
  else if (registerStep === 2) {
    header = t('Register.validation.title')
    content = [log]
  }

  let template = 'minmax(7vw, 150px) auto 11rem 11rem'
  if (noLicenceAccountRequired) {
    template = 'minmax(7vw, 150px) auto 11rem'
  }
  
  return (
    <ChakraProvider
      theme={theme}
    >
      {/* Navbar */}
      <Box
        zIndex="1"
        position="fixed"
        top="0"
        width="100%"
      >
        <Box
          layerStyle='menutop_layout_style'
          gridTemplateColumns={template}
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
              onClick={() => returnToApp(navigate)}
            />
          </Box>
          <Box></Box>
          {!noLicenceAccountRequired ?<Button
            variant='btn_lone_navigation'
            onClick={() => { returnToApp(navigate) }}>
            {t('UserNav.to_app')}
          </Button> : <></>
          }
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/login')}>
            {t('UserNav.to_con')}
          </Button>
        </Box>
      </Box>


      <div className="login-wrapper">
        <Card variant='card_register' marginTop='100px' width={width}>
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

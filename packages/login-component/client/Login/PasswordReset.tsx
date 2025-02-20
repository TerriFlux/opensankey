import React, { FunctionComponent, useState } from 'react'
import { useNavigate, NavigateFunction,useParams } from 'react-router-dom'
import i18next from 'i18next'
import { TFunction } from 'i18next'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Spinner
} from '@chakra-ui/react'

import {
  email_regex_str,
  pwd_regex_str
} from '../Register/Register'
import {
  applyPasswordReset,
  triggerPasswordReset
} from './LoginFunctions'


type FCType_PasswordResetFromToken = {
  t: TFunction,
  logo: string,
  returnToApp: (navigate: NavigateFunction) => void,
}

// Password resetin page
export const PasswordResetFromToken: FunctionComponent<FCType_PasswordResetFromToken> = ({
  t,logo,returnToApp
}) => {

  // Get Token from param
  const { token } = useParams()

  // States
  const [on_wait, setOnWait] = useState(false)
  const [password, setPassword] = useState('')
  const [ok_password, setOkPassword] = useState(0)
  const [show_password, setShowPassword] = useState(false)

  // Initialise navigation function
  const navigate = useNavigate()

  // Handler
  const handleSubmit = async () => {
    if (token !== undefined) {
      setOnWait(true)
      const lang = i18next.language
      await applyPasswordReset(
        t,
        token,
        {
          password,
          lang
        },
        () => { navigate('/login') }
      )
        .then(() => setOnWait(false))
    }
  }

  // React output
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
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem 11rem'
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
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/login')}
          >
            {t('UserNav.to_con')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.forgot.title')}</CardHeader>
          <CardBody>

            {/* User password*/}
            <FormControl isInvalid={ok_password === 1}>
              <InputGroup variant='register_input'>
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
            </FormControl>

            <Button
              variant='btn_lone_navigation_tertiary'
              type="submit"
              onClick={() => {
                handleSubmit()
              }}>
              {t('Login.forgot.sub')}
            </Button>

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

            {
              on_wait ?
                <Spinner /> :
                <></>
            }
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

type PasswordResetFromMail = {
  t: TFunction,
  logo: string,
  returnToApp: (navigate: NavigateFunction) => void,
}

// Password resetin page
export const PasswordResetFromMail: FunctionComponent<PasswordResetFromMail> = ({
  t,logo,returnToApp
}) => {

  // States
  const [on_wait, setOnWait] = useState(false)
  const [email, setEmail] = useState('')
  const [ok_email, setOkEmail] = useState(0)

  // Initialise navigation function
  const navigate = useNavigate()

  // Handler
  const handleSubmit = async () => {
    const lang = i18next.language
    await triggerPasswordReset(
      t,
      {
        email,
        lang
      },
      () => { navigate('/login') }
    )
      .then(() => setOnWait(false))
  }

  // React output
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
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem 11rem'
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
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/login')}
          >
            {t('UserNav.to_con')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.forgot.title')}</CardHeader>
          <CardBody>
            {/* User e-mail*/}
            <FormControl isInvalid={ok_email === 1}>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('Login.id.label')}
                </InputLeftAddon>
                <Input
                  isRequired
                  type='email'
                  placeholder={t('Login.id.placeholder')}
                  onChange={e => {
                    // Control e-amil format
                    if (e.target.value.match(email_regex_str) != null) {
                      setEmail(e.target.value)
                      setOkEmail(2)
                    }
                    else {
                      setEmail('')
                      setOkEmail(1)
                    }
                  }}
                />
              </InputGroup>
              {(ok_email === 1) ? (
                <FormErrorMessage>{t('Login.id.error')}</FormErrorMessage>
              ) : (
                <></>
              )}
            </FormControl>

            <Button
              variant='btn_lone_navigation_tertiary'
              type="submit"
              onClick={() => {
                handleSubmit()
              }}>
              {t('Login.forgot.sub')}
            </Button>

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

            {
              on_wait ?
                <Spinner /> :
                <></>
            }
          </CardBody>
        </Card>
      </div>
    </div>
  )
}





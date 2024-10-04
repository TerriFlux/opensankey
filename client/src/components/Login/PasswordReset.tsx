import React, { FunctionComponent, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import i18next from 'i18next'

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
  InputRightElement
} from '@chakra-ui/react'

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { applyPasswordReset, triggerPasswordReset } from './LoginFunctions'
import { email_regex_str, pwd_regex_str } from '../Register/Register'


type FCType_PasswordResetFromToken = {
  new_data_app: Class_ApplicationDataSA
}

// Password resetin page
export const PasswordResetFromToken: FunctionComponent<FCType_PasswordResetFromToken> = ({
  new_data_app
}) => {

  // App data
  const { t, logo } = new_data_app

  // Get Token from param
  const { token } = useParams()

  // States
  const [password, setPassword] = useState('')
  const [okPassword, setOkPassword] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  // Initialise navigation function
  const navigate = useNavigate()
  const returnToApp = () => {
    navigate('/')
    new_data_app.menu_configuration.updateComponentsRelatedToSA()
  }

  // Handler
  const handleSubmit = async () => {
    if (token !== undefined){
      const lang = i18next.language
      await applyPasswordReset(
        new_data_app,
        token,
        {
          password,
          lang
        },
        navigate
      )
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
          className='MenuNavigation'
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem 11rem'
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
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/login')}
          >
            {t('UserPages.to_con')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.forgot_win')}</CardHeader>
          <CardBody>

            {/* User password*/}
            <FormControl isInvalid={okPassword === 1}>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('pwd.label', { ns: 'register' })}
                </InputLeftAddon>
                <Input
                  isRequired
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('pwd.placeholder', { ns: 'register' })}
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
            <div className='LogError' style={{ 'color': 'red', 'textAlign': 'center' }}></div>
            <div className='LogInfo' style={{ 'color': 'green', 'textAlign': 'center' }}></div>
            <div style={{ 'textAlign': 'center' }}>
              <Button
                variant='btn_lone_navigation_tertiary'
                type="submit"
                onClick={() => {
                  handleSubmit()
                }}>
                {t('Login.forgot_sub')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

type PasswordResetFromMail = {
  new_data_app: Class_ApplicationDataSA
}

// Password resetin page
export const PasswordResetFromMail: FunctionComponent<PasswordResetFromMail> = ({
  new_data_app
}) => {

  // App data
  const { t, logo } = new_data_app

  // States
  const [email, setEmail] = useState('')
  const [okEmail, setOkEmail] = useState(0)

  // Initialise navigation function
  const navigate = useNavigate()
  const returnToApp = () => {
    navigate('/')
    new_data_app.menu_configuration.updateComponentsRelatedToSA()
  }

  // Handler
  const handleSubmit = async () => {
    const lang = i18next.language
    await triggerPasswordReset(
      new_data_app,
      {
        email,
        lang
      },
      navigate
    )
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
          className='MenuNavigation'
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto 11rem 11rem'
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
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/login')}
          >
            {t('UserPages.to_con')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.forgot_win')}</CardHeader>
          <CardBody>
            {/* User e-mail*/}
            <FormControl isInvalid={okEmail === 1}>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('id.label', { ns: 'register' })}
                </InputLeftAddon>
                <Input
                  isRequired
                  type='email'
                  placeholder={t('id.placeholder', { ns: 'register' })}
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
              {(okEmail === 1) ? (
                <FormErrorMessage>{t('id.error', { ns: 'register' })}</FormErrorMessage>
              ) : (
                <></>
              )}
            </FormControl>
            <div className='LogError' style={{ 'color': 'red', 'textAlign': 'center' }}></div>
            <div className='LogInfo' style={{ 'color': 'green','textAlign': 'center' }}></div>
            <div style={{ 'textAlign': 'center' }}>
              <Button
                variant='btn_lone_navigation_tertiary'
                type="submit"
                onClick={() => {
                  handleSubmit()
                }}>
                {t('Login.forgot_sub')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}





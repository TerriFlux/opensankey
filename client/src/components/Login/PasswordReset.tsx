import React, { FunctionComponent, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import i18next from 'i18next'

import { Box, Button, Card, CardBody, CardHeader, Image } from '@chakra-ui/react'

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { applyPasswordReset, triggerPasswordReset } from './LoginFunctions'


type PasswordResetFromToken = {
  new_data_app: Class_ApplicationDataSA
}

// Password resetin page
export const PasswordResetFromToken: FunctionComponent<PasswordResetFromToken> = ({
  new_data_app
}) => {

  // App data
  const { t, logo } = new_data_app

  // Get Token from param
  const { token } = useParams()

  // States
  const [password, setPassword] = useState('')

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
        <Card variant='card_register'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.forgot_win')}</CardHeader>
          <CardBody>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name'>{t('UserPages.mdp')}</Box>
              <input type="password" onChange={e => setPassword(e.target.value)} />
            </Box>
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
        <Card variant='card_register'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.forgot_win')}</CardHeader>
          <CardBody>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name'>{t('UserPages.id')}</Box>
              <input type="text" onChange={e => setEmail(e.target.value)} />
            </Box>
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





import React, { FunctionComponent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, CardHeader, Image } from '@chakra-ui/react'

import { loginUser } from './LoginFunctions'

export type LoginTypes = {
  navbar_logo: string,
  set_update: (_: boolean) => void
  update: boolean
}

// Login, Register or Buy License
const Login: FunctionComponent<LoginTypes> = ({
  navbar_logo,
  set_update, update
}) => {
  const [email, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [remember] = useState(false)
  const state = {
    button: ''
  }

  // Initialise traduction function
  const { t } = useTranslation()
  // Initialise navigation function
  const navigate = useNavigate()
  const returnToApp = () => {
    set_update(!update)
    navigate('/')
  }

  // Handler : Si demande d'envoi vers page de création de compte
  const handleRegister = () => {
    navigate('/register')
  }

  // Handler : Si demande de connection
  const handleSubmit = async () => {
    if (state.button === 'login') {
      await loginUser(
        t,
        {
          email,
          password,
          remember
        },
        update,set_update,
        navigate
      )
      // set_update(!update)
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
          gridTemplateColumns='minmax(7vw, 150px) auto'
        >
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='center'
          >
            <Image
              height='4rem'
              src={navbar_logo}
              alt='navigation logo'
              onClick={() => returnToApp()}
            />
          </Box>
          <Button
            variant='btn_lone_navigation'
            alignSelf='center'
            justifySelf='right'
            onClick={() => {
              navigate('/')
              set_update(!update)
            }}>
            {t('UserPages.to_app')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.con_win')}</CardHeader>
          <CardBody>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name'>
                {t('UserPages.id')}
              </Box>
              <input type="text" onChange={e => setUserName(e.target.value)} />
            </Box>

            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name'>{t('UserPages.mdp')}</Box>
              <input type="password" onChange={e => setPassword(e.target.value)} />
            </Box>
            <div className='LogError' style={{ 'color': 'red' }}></div>
            <div style={{ 'textAlign': 'center' }}>
              <button
                style={{ 'marginTop': '15px' }}
                className='btn-login'
                type="submit"
                onClick={() => {
                  (state.button = 'login')
                  handleSubmit()
                }}>
                {t('Login.con')}
              </button>
            </div>
          </CardBody>
        </Card>
        <button
          style={{ 'marginTop': '15px' }}
          className='btn-login to-register'
          type="button"
          onClick={() => handleRegister()}>
          {t('UserPages.to_reg')}
        </button>
      </div>
    </div>
  )
}

export default Login





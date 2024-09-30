import React, { FunctionComponent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, CardHeader, Image } from '@chakra-ui/react'

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { loginUser } from './LoginFunctions'

export type LoginTypes = {
  new_data_app: Class_ApplicationDataSA
}

// Login, Register or Buy License
const Login: FunctionComponent<LoginTypes> = ({
  new_data_app,
}) => {

  // App data
  const { t, logo } = new_data_app

  // States
  const [email, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [remember] = useState(false)
  const state = {
    button: ''
  }

  // Initialise navigation function
  const navigate = useNavigate()
  const returnToApp = () => {
    navigate('/')
    new_data_app.menu_configuration.updateComponentsRelatedToSA()
  }

  // Handler : Si demande de connection
  const handleSubmit = async () => {
    if (state.button === 'login') {
      await loginUser(
        new_data_app,
        {
          email,
          password,
          remember
        },
        navigate
      )
    }
    if (state.button === 'forgot') {
      navigate('/login/forgot')
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
            onClick={() => navigate('/register')}
          >
            {t('UserPages.to_reg')}
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
              <Button
                variant='btn_lone_navigation_tertiary'
                type="submit"
                onClick={() => {
                  (state.button = 'login')
                  handleSubmit()
                }}>
                {t('Login.con')}
              </Button>
              <Button
                variant='btn_lone_navigation_tertiary' // TODO Changer variant
                type="submit"
                onClick={() => {
                  (state.button = 'forgot')
                  handleSubmit()
                }}>
                {t('Login.forgot_ask')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Login





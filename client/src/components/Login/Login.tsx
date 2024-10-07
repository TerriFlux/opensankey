import React, { FunctionComponent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, CardHeader, FormControl, Image, Input, InputGroup, InputLeftAddon, InputRightElement } from '@chakra-ui/react'

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { returnToApp } from '../../SankeyAppSA'
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
  const [showPassword, setShowPassword] = useState(false)
  const [remember] = useState(false)
  const state = {
    button: ''
  }

  // Initialise navigation function
  const navigate = useNavigate()

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
              onClick={() => returnToApp(new_data_app, navigate)}
            />
          </Box>
          <Box></Box>
          <Button
            variant='btn_lone_navigation'
            onClick={() => returnToApp(new_data_app, navigate)}
          >
            {t('UserNav.to_app')}
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
        <Card variant='card_register' width='33vw'>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.con_win')}</CardHeader>
          <CardBody>
            {/* User id */}
            <FormControl>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('id.label', { ns: 'register' })}
                </InputLeftAddon>
                <Input
                  isRequired
                  type='text'
                  placeholder={t('id.placeholder', { ns: 'register' })}
                  onChange={e => setUserName(e.target.value)}
                />
              </InputGroup>
            </FormControl>

            {/* Password */}
            <FormControl>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('pwd.label', { ns: 'register' })}
                </InputLeftAddon>
                <Input
                  isRequired
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('pwd.placeholder', { ns: 'register' })}
                  onChange={e => setPassword(e.target.value)}
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
            </FormControl>

            <div className='LogError' style={{ 'color': 'red' }}></div>

            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='0,25rem'
            >
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
                variant='btn_lone_navigation_tertiary_negative'
                type="submit"
                onClick={() => {
                  (state.button = 'forgot')
                  handleSubmit()
                }}>
                {t('Login.forgot_ask')}
              </Button>
            </Box>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Login





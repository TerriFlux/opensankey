import React, { FC, useRef, useState } from 'react'
import { useNavigate, NavigateFunction } from 'react-router-dom'
import { FaPowerOff } from 'react-icons/fa'
import { TFunction } from 'i18next'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Spinner,
  IconButton
} from '@chakra-ui/react'

import { loginOut, loginUser } from './LoginFunctions'
import { LoginComponent } from '../LoginComponent'
import { OSTooltip } from '../deps/OpenSankey+/deps/OpenSankey/components/configmenus/MenuCommon'

export const Login = ({
  t,
  logo,
  returnToApp,
  loginComponent,
  setLicenses
}:{
  t: TFunction
  logo: string,
  returnToApp: (navigate: NavigateFunction) => void,
  loginComponent: LoginComponent,
  setLicenses: React.MutableRefObject<() => void>}) => {
  // States
  const [on_wait, setOnWait] = useState(false)
  const [email, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [show_password, setShowPassword] = useState(false)
  const [remember] = useState(false)
  const state = {
    button: ''
  }

  // Login button ref
  const ref_login_btn = useRef<HTMLButtonElement>(null)

  // Initialise navigation function
  const navigate = useNavigate()

  // Handler : Si demande de connection
  const handleSubmit = async () => {
    if (state.button === 'login') {
      setOnWait(true)
      await loginUser(
        t,
        loginComponent,
        setLicenses,
        {
          email,
          password,
          remember
        },
        () => {
          returnToApp(navigate)
        }
      )
        .then(() => setOnWait(false))
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
          display='flex'
          flexWrap='wrap'
          alignItems='center'
          justifyContent='space-between'
          height='auto'
          minHeight='2.5rem'
          rowGap='0.25rem'
        >
          <Box
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
          <Box
            display='flex'
            flexWrap='wrap'
            justifyContent='flex-end'
            gap='0.25rem'
          >
            <Button
              variant='btn_lone_navigation'
              onClick={() => returnToApp(navigate)}
            >
              {t('UserNav.to_app')}
            </Button>
            <Button
              variant='btn_lone_navigation_secondary'
              onClick={() => navigate('/register')}
            >
              {t('UserNav.to_reg')}
            </Button>
          </Box>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width={{ base: '92vw', sm: '32rem' }}>
          <CardHeader style={{ 'textAlign': 'center' }}>{t('Login.title')}</CardHeader>
          <CardBody>
            {/* User id */}
            <FormControl>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('Login.id.label')}
                </InputLeftAddon>
                <Input
                  isRequired
                  type='text'
                  placeholder={t('Login.id.placeholder')}
                  onChange={e => setUserName(e.target.value)}
                />
              </InputGroup>
            </FormControl>

            {/* Password */}
            <FormControl>
              <InputGroup variant='register_input'>
                <InputLeftAddon>
                  {t('Login.pwd.label')}
                </InputLeftAddon>
                <Input
                  isRequired
                  type={show_password ? 'text' : 'password'}
                  placeholder={t('Login.pwd.placeholder')}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => { ref_login_btn.current?.click() }}
                />
                <InputRightElement width='4.5rem' marginRight='0.25em'>
                  <Button
                    h='1.75rem'
                    size='sm'
                    border='0px'
                    bg='gray.50'
                    onClick={() => setShowPassword(!show_password)}
                  >
                    {show_password ? t('Login.pwd.hide') : t('Login.pwd.show')}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='0,25rem'
            >
              <Button
                ref={ref_login_btn}
                variant='btn_lone_navigation_tertiary'
                type="submit"
                isDisabled={(
                  on_wait ||
                  (password.length === 0) ||
                  (email.length === 0))}
                onClick={() => {
                  (state.button = 'login')
                  handleSubmit()
                }}>
                {
                  on_wait ?
                    <Spinner /> :
                    t('Login.con')
                }
              </Button>
              <Button
                variant='btn_lone_navigation_tertiary_negative'
                type="submit"
                onClick={() => {
                  (state.button = 'forgot')
                  handleSubmit()
                }}>
                {t('Login.forgot.ask')}
              </Button>
            </Box>


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
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export const LoginOutButton = (
  { t, logo, returnToApp, loginComponent, setLicenses }:{
  t: TFunction
  logo: string,
  returnToApp: (navigate: NavigateFunction) => void,
  loginComponent: LoginComponent,
  setLicenses: React.MutableRefObject<() => void>,
}
) => {
  const navigate = useNavigate()

  const [on_wait, setOnWait] = useState(false)

  return <OSTooltip label={t('UserNav.tooltip.to_logout') || t('UserNav.to_logout') || 'Logout'}>
    <IconButton
      aria-label={t('UserNav.to_logout') || 'Logout'}
      icon={on_wait ? <Spinner /> : <FaPowerOff />}
      size='sm'
      boxSize='2rem'
      fontSize='1rem'
      bg='transparent'
      bgColor='transparent'
      borderColor='transparent'
      color='gray.700'
      _hover={{ bg: 'gray.100', bgColor: 'gray.100', color: 'gray.900' }}
      _active={{ bg: 'gray.200', bgColor: 'gray.200' }}
      disabled={on_wait}
      onClick={() => {
        setOnWait(true)
        loginOut(
          loginComponent,
          setLicenses,
          () => {
            setOnWait(false)
            returnToApp(navigate)
          })
      }}
    />
  </OSTooltip>
}






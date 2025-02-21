import React, { FunctionComponent, useRef, useState } from 'react'
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
  Spinner
} from '@chakra-ui/react'

import { loginOut, loginUser } from './LoginFunctions'
import { LoginComponent } from '../LoginComponent'

export type LoginTypes = {
  t: TFunction
  logo: string,
  returnToApp: (navigate: NavigateFunction) => void,
  loginComponent: () => LoginComponent,
  setUpdate: React.MutableRefObject<() => void>,
  compulsory_login?: boolean
}

// Login
export const Login: FunctionComponent<LoginTypes> = ({
  t,
  logo,
  returnToApp,
  loginComponent,
  setUpdate,
  compulsory_login
}) => {
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
        setUpdate,
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
          {!compulsory_login ? <Button
            variant='btn_lone_navigation'
            onClick={() => returnToApp(navigate)}
          >
            {t('UserNav.to_app')}
          </Button> : <></>
          }
          <Button
            variant='btn_lone_navigation_secondary'
            onClick={() => navigate('/register')}
          >
            {t('UserNav.to_reg')}
          </Button>
        </Box>
      </Box>

      <div className="login-wrapper">
        <Card variant='card_register' width='33vw'>
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

export const LoginOutButton: FunctionComponent<LoginTypes> = (
  { t, logo, returnToApp, loginComponent, setUpdate }
) => {
  const navigate = useNavigate()

  const [on_wait, setOnWait] = useState(false)

  return <Button
    variant='menutop_button_logout'
    disabled={on_wait}
    onClick={() => {
      setOnWait(true)
      loginOut(
        loginComponent,
        setUpdate,
        () => {
          setOnWait(false)
          returnToApp(navigate)
        })
    }}
  >
    {
      on_wait ?
        <Spinner /> :
        <FaPowerOff />
    }
  </Button>
}






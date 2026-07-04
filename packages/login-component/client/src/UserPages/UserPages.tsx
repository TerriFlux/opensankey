
import React from 'react'
import { useNavigate, NavigateFunction } from 'react-router-dom'
import {
  Button,
  ButtonGroup,
  IconButton,
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faRightToBracket } from '@fortawesome/free-solid-svg-icons'
import { LoginOutButton } from '../Login/Login'
import { OSTooltip } from 'open-sankey/src/components/configmenus/MenuCommon'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { LoginComponent } from '../LoginComponent'

export const UserPagesButtons = (
  { t: _t, show_splashscreen,logo,icon_user,login_component,setLicenses, returnToApp }: {
    t: TFunction,
    show_splashscreen: boolean,
    logo:string,
    icon_user: JSX.Element,
    login_component:LoginComponent,
    setLicenses: React.MutableRefObject<() => void>,
    returnToApp: (navigate: NavigateFunction) => void,
  }
) => {
  // useTranslation ensures re-render on language change
  const { t } = useTranslation()


  // If window.sankey.publish is at true : we don't use the function useNavigate because we can't it use this function outside BrowserRouter
  // and if the app is in publication mode we aren't in one
  const navigate = useNavigate()

  // const [count, setCount] = useState(0)
  //const refreshThis = () => { setCount(count + 1) }
  //new_data_app.menu_configuration_login_component.ref_to_additional_menus_updater.current = refreshThis

  // Either create a menu to select where we navigate to (login or register account)
  // or add a button to navigate to
  const ghost_icon_btn_style = {
    bg: 'transparent',
    bgColor: 'transparent',
    borderColor: 'transparent',
    color: 'gray.700',
    _hover: { bg: 'gray.100', bgColor: 'gray.100', color: 'gray.900' },
    _active: { bg: 'gray.200', bgColor: 'gray.200' },
  }

  const user_navigation_bar_free = <ButtonGroup spacing='0.25rem' size='sm'>
    <OSTooltip
      label={t('UserNav.tooltip.to_buy') || t('UserNav.to_buy')}
      isAlwaysOpen={show_splashscreen}>
      <IconButton
        aria-label={t('UserNav.to_buy')}
        icon={<FontAwesomeIcon icon={faUserPlus} />}
        size='sm'
        boxSize='2rem'
        fontSize='1rem'
        {...ghost_icon_btn_style}
        onClick={() => navigate('/register')}
      />
    </OSTooltip>
    <OSTooltip label={t('UserNav.to_con')}>
      <IconButton
        aria-label={t('UserNav.to_con')}
        icon={<FontAwesomeIcon icon={faRightToBracket} />}
        size='sm'
        boxSize='2rem'
        fontSize='1rem'
        {...ghost_icon_btn_style}
        onClick={() => navigate('/login')}
      />
    </OSTooltip>
  </ButtonGroup>

  const user_navigation_bar_connected = <ButtonGroup spacing='0.25rem' size='sm'>
    <OSTooltip label={t('UserNav.tooltip.to_dashboard') || t('UserNav.to_dashboard') || 'Dashboard'}>
      <IconButton
        aria-label={t('UserNav.to_dashboard') || 'Dashboard'}
        icon={icon_user}
        size='sm'
        boxSize='2rem'
        fontSize='1rem'
        {...ghost_icon_btn_style}
        onClick={() => {
          navigate('/account')
          // Save current json before moving to login page
          const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
          if (ev.onkeydown) {
            ev.onkeydown(tmp)
          }
        }}
      />
    </OSTooltip>
    <LoginOutButton
      t={t}
      logo={logo}
      returnToApp={returnToApp}
      loginComponent={login_component}
      setLicenses={setLicenses}
    />
  </ButtonGroup>

  return (!login_component.has_account ? user_navigation_bar_free : user_navigation_bar_connected)
}


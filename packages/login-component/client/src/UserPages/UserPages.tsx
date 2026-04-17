
import React from 'react'
import { useNavigate, NavigateFunction } from 'react-router-dom'
import {
  Button,
  ButtonGroup,
} from '@chakra-ui/react'
import { LoginOutButton } from '../Login/Login'
import { OSTooltip } from '../deps/OpenSankey+/deps/OpenSankey/components/configmenus/MenuCommon'
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
  const user_navigation_bar_free = <ButtonGroup
    // layerStyle='menutop_layout_style'
    // height='5rem'
    // gridTemplateColumns='11rem 11rem'
    isAttached
  >
    <OSTooltip
      label={t('UserNav.tooltip.to_buy')}
      isAlwaysOpen={show_splashscreen}>
      <Button
        variant='btn_lone_navigation_primary'
        size='sizeBtnTextLogin'
        onClick={() => navigate('/register')}
      >
        {t('UserNav.to_buy')}
      </Button></OSTooltip>
    <Button
      variant='btn_lone_navigation_secondary'
      size='sizeBtnTextLogin'
      onClick={() => navigate('/login')}
    >
      {t('UserNav.to_con')}
    </Button>
  </ButtonGroup>

  const user_navigation_bar_connected = <ButtonGroup
    isAttached
  >
    <Button
      variant={'menutop_button_goto_dashboard'}
      size='sizeBtnTextLogin'
      onClick={() => {
        navigate('/account')
        // Save current json before moving to login page
        const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
        if (ev.onkeydown) {
          ev.onkeydown(tmp)
        }
      }}>

      {icon_user}
    </Button>
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


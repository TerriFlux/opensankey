
import React, { FC, useState } from 'react'
import { useNavigate, NavigateFunction } from 'react-router-dom'
import {
  Button,
  ButtonGroup,
} from '@chakra-ui/react'
import { LoginOutButton } from '../Login/Login'
import { loginComponent } from '../LoginComponent'
import {Class_ApplicationDataLoginComponent} from '../ApplicationDataLoginComponent'
import { OSTooltip } from '../deps/OpenSankey+/deps/OpenSankey/components/configmenus/BaseComponents'

type FCType_UserPagesButtons = {
  new_data_app: Class_ApplicationDataLoginComponent
  setUpdate: React.MutableRefObject<() => void>,
    returnToApp: (navigate: NavigateFunction) => void,
}

export const UserPagesButtons: FC<FCType_UserPagesButtons> = (
  { new_data_app, setUpdate,returnToApp }
) => {
  // Traduction
  const { t } = new_data_app

  // If window.sankey.publish is at true : we don't use the function useNavigate because we can't it use this function outside BrowserRouter
  // and if the app is in publication mode we aren't in one
  const navigate = useNavigate()

  const [count, setCount] = useState(0)
  const refreshThis = () => { setCount(count + 1) }
  new_data_app.menu_configuration_login_component.ref_to_additional_menus_updater.current = refreshThis

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
      isAlwaysOpen={new_data_app.menu_configuration.show_splashscreen}>
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
      {new_data_app.icon_library.icon_user}
    </Button>
    <LoginOutButton
      t={new_data_app.t}
      logo={new_data_app.logo}
      returnToApp={returnToApp}
      loginComponent={loginComponent}
      setUpdate={setUpdate}
    />
  </ButtonGroup>


  return (!loginComponent().has_account ? user_navigation_bar_free : user_navigation_bar_connected)
}


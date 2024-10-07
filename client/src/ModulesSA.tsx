
import React, { FunctionComponent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  FaPowerOff,
  FaUser
} from 'react-icons/fa'

import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

import { CardsTemplateBuilder } from './deps/OpenSankey+/deps/OpenSankey/welcome/ModalWelcome'
import { Type_AdditionalMenus } from './deps/OpenSankey+/deps/OpenSankey/types/TypesOS'
import { Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'

import { initializeAdditionalMenusOSP } from './deps/OpenSankey+/OSPModule'

import { loginOut } from './components/Login/LoginFunctions'
import { Class_ApplicationDataSA } from './ApplicationData'
import { returnToApp } from './SankeyAppSA'


/**
 * Overrides : OS initializeApplicationData
 * Init data with JSON cache data if present.
 *
 * @param {Class_ApplicationDataSA} new_data_app
 * @param {(Type_JSON | undefined)} initial_data
 * @return {*}
 */
export const initializeApplicationDataSA = (
  new_data_app: Class_ApplicationDataSA,
  initial_data: Type_JSON | undefined
) => {
  // Read data from cache if it exist
  if (initial_data !== undefined) {
    new_data_app.fromJSON(initial_data)
  }
  return new_data_app
}

type FType_InitializeAdditionalMenusSA = (
  additional_menus: Type_AdditionalMenus,
  new_data: Class_ApplicationDataSA
) => void

/**
 * Since AdditionalMenus is an OS var specially created to add external element in menus
 * we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
 * @param {*} additionalMenus
 * @param {*} new_data_app
 */
export const initializeAdditionalMenusSA: FType_InitializeAdditionalMenusSA = (
  additionalMenus,
  new_data_app
) => {

  // No initialisation if static --------------------------------------------------------

  if (new_data_app.is_static) {
    return
  }

  // OpenSankey+ initialisation ----------------------------------------------------------

  initializeAdditionalMenusOSP(
    additionalMenus,
    new_data_app
  )

  // New modules -------------------------------------------------------------------------

  additionalMenus.additional_nav_item.push(
    <UserPagesButtons
      new_data_app={new_data_app}
    />
  )

  additionalMenus.cards_template = CardsTemplateBuilder(new_data_app)
}

type FCType_UserPagesButtons = {
  new_data_app: Class_ApplicationDataSA
}

const UserPagesButtons: FunctionComponent<FCType_UserPagesButtons> = (
  { new_data_app }
) => {
  // Traduction
  const { t } = new_data_app

  // If windowSankey.SankeyToolsStatic is at true : we don't use the function useNavigate because we can't it use this function outside BrowserRouter
  // and if the app is in publication mode we aren't in one
  const navigate = useNavigate()

  const [count, setCount] = useState(0)
  const refreshThis = () => {
    setCount(count + 1)
  }
  new_data_app.menu_configuration.ref_to_additional_menus_updater.current = refreshThis

  const indicateSankeyToSaveInCache = () => new_data_app.menu_configuration.ref_to_save_in_cache_indicator.current(false)

  // Either create a menu to select where we navigate to (login or register account)
  // or add a button to navigate to
  const user_navigation_bar_free = <Box
    layerStyle='menutop_layout_style'
    height='5rem'
    gridTemplateColumns='11rem 11rem'
  >
    <Button
      variant='btn_lone_navigation_primary'
      onClick={() => navigate('/license?buy')}
    >
      {t('UserNav.to_buy')}
    </Button>
    <Button
      variant='btn_lone_navigation_secondary'
      onClick={() => navigate('/login')}
    >
      {t('UserNav.to_con')}
    </Button>
  </Box>
  // const user_navigation_bar_free = <Menu
  //   variant='menu_button_subnav_account_style'
  //   placement='bottom-end'
  // >
  //   <MenuButton>
  //     <Box
  //       gridColumn='1'
  //       gridRow='1'
  //       justifySelf='end'
  //     >
  //       <FaUser
  //         style={{ 'height': '2rem', 'width': '2rem' }}
  //       />
  //     </Box>
  //     <Box
  //       gridColumn='2'
  //       gridRow='1'
  //       height='1rem'
  //       width='1rem'
  //       alignSelf='end'
  //     >
  //       <ChevronDownIcon
  //         style={{ 'height': '1rem', 'width': '1rem' }}
  //       />
  //     </Box>
  //   </MenuButton>
  //   <MenuList>
  //     <MenuItem
  //       onClick={() => {
  //         // applicationData.function_on_wait.current = () => {
  //         //   localStorage.setItem('data', LZString.compress(JSON.stringify((applicationData as suiteApplicationDataType).master_data)))
  //         //   localStorage.setItem('last_save', 'true')
  //         //   new_data_app.menu_configuration.ref_to_save_in_cache_indicator.current(true)
  //         //   navigate('/login')
  //         // }
  //         // dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()
  //         new_data_app.menu_configuration.function_on_wait.current = () => {
  //           indicateSankeyToSaveInCache()
  //           navigate('/login')
  //         }
  //         new_data_app.menu_configuration.ref_trigger_waiting_spinner_toast.current({ success: 'Layout Updated' })
  //       }}
  //     >
  //       {t('connect')}
  //     </MenuItem>
  //     <MenuItem
  //       onClick={() => navigate('/register')}
  //     >
  //       {t('UserPages.to_reg')}
  //     </MenuItem>
  //   </MenuList>
  // </Menu>

  const user_navigation_bar_connected = <Box
    alignSelf='center'
    justifySelf='center'
    display='grid'
    gridTemplateColumns='1fr 1fr'
    gridColumnGap='0.25rem'
  >
    <Button
      variant={'menutop_button_goto_dashboard'}
      onClick={() => {
        // applicationData.function_on_wait.current = () => {
        //   localStorage.setItem('data', LZString.compress(JSON.stringify((applicationData as suiteApplicationDataType).master_data)))
        //   localStorage.setItem('last_save', 'true')
        //   new_data_app.menu_configuration.ref_to_save_in_cache_indicator.current(true)
        //   navigate('/dashboard')
        // }
        // dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()
        new_data_app.menu_configuration.function_on_wait.current = () => {
          indicateSankeyToSaveInCache()
          navigate('/dashboard')
        }
        new_data_app.menu_configuration.ref_trigger_waiting_spinner_toast.current({ success: 'Layout Updated' })
      }}>
      <FaUser />
    </Button>
    <Button
      variant='menutop_button_logout'
      onClick={() => loginOut(
        () => { new_data_app.unsetTokens() },
        () => returnToApp(new_data_app, navigate)
      )}>
      <FaPowerOff />
    </Button>
  </Box>


  return (!new_data_app.has_free_account ? user_navigation_bar_free : user_navigation_bar_connected)
}
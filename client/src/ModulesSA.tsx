
import React, { FunctionComponent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  FaUser
} from 'react-icons/fa'

import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Image,
  Stack,
} from '@chakra-ui/react'

import { Type_AdditionalMenus } from './deps/OpenSankey+/deps/OpenSankey/types/TypesOS'
import { Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'
import ExempleItem from './deps/OpenSankey+/deps/OpenSankey/welcome/MenuExamples'

import { initializeAdditionalMenusOSP } from './deps/OpenSankey+/OSPModule'

import { Class_ApplicationDataSA } from './ApplicationData'
import { LoginOutButton } from './components/Login/Login'
import { ClickSaveExcel } from './deps/OpenSankey+/deps/OpenSankey/dialogs/SankeyPersistence'
import { Type_GenericApplicationDataOS } from './deps/OpenSankey+/deps/OpenSankey/types/TypesOS'


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
  initial_data: Type_JSON | undefined,

) => {
  // Read data from cache if it exist
  if (initial_data !== undefined) {
    new_data_app.fromJSON(initial_data)
  }
  return new_data_app
}

export type ExempleMenuTypes = { [_: string]: ExempleMenuTypes | string[] }

type FType_InitializeAdditionalMenusSA = (
  additional_menus: Type_AdditionalMenus,
  new_data: Class_ApplicationDataSA,
  example_menu: ExempleMenuTypes,
  formations_menu: ExempleMenuTypes,
  reinitialization: () => void
) => void

/**
 * Since AdditionalMenus is an OS var specially created to add external element in menus
 * we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
 * @param {*} additionalMenus
 * @param {*} new_data_app
 */
export const initializeAdditionalMenusSA: FType_InitializeAdditionalMenusSA = (
  additionalMenus,
  new_data_app,
  example_menu,
  formations_menu,
  reinitialization
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

  // Check if user is connected ----------------------------------------------------------

  new_data_app.checkTokens()

  // New modules -------------------------------------------------------------------------

  additionalMenus.additional_nav_item.push(
    <UserPagesButtons
      new_data_app={new_data_app}
    />
  )

  additionalMenus.formations_menu = formations_menu

  additionalMenus.externale_navbar_item['demo'] = <ExempleItem
    new_data={new_data_app}
    exemple_menu={example_menu}
    current_path={''}
    launch={new_data_app.processFunction.launch}
    Reinitialization={reinitialization}
    initial_list={true}
  />

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

  // const indicateSankeyToSaveInCache = () => new_data_app.menu_configuration.ref_to_save_in_cache_indicator.current(false)

  // Either create a menu to select where we navigate to (login or register account)
  // or add a button to navigate to
  const user_navigation_bar_free = <Box
    layerStyle='menutop_layout_style'
    height='5rem'
    gridTemplateColumns='11rem 11rem'
  >
    <Button
      variant='btn_lone_navigation_primary'
      onClick={() => navigate('/register')}
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
  //       {t('UserNav.to_reg')}
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
        navigate('/account')
        // Save current json before moving to login page
        const ev = document; const tmp = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
        if (ev.onkeydown) {
          ev.onkeydown(tmp)
        }
      }}>
      <FaUser />
    </Button>
    <LoginOutButton
      new_data_app={new_data_app}
    />
  </Box>


  return (!new_data_app.has_account ? user_navigation_bar_free : user_navigation_bar_connected)
}

export const CardsTemplateBuilder = (
  new_data: Type_GenericApplicationDataOS
) => {
  const { t, static_path } = new_data
  /* eslint-disable */
  // @ts-ignore
  const image_preview = require.context('./css/image_preview', true)
  // @ts-ignore
  const imageList = image_preview.keys().map(image => {
    let img = image_preview(image)
    const path = window.location.href
    if (!path.includes('localhost')) {
      img = img.replace('static/', static_path)
    }
    return img
  })
  // @ts-ignore
  const list_template = require.context('./css/easy_template', true)
  // @ts-ignore
  // Create the list of json associated to images
  const list_template_data = list_template.keys().filter(im => im.includes('.json')).map(path_to_file => {
    const d = list_template(path_to_file)
    return d
  })
  /* eslint-enable */
  return <>
    {(imageList as string[]).map((_, idx) => {
      // _ is the path to the image, it contain '/' because it is in a folder tree
      // so we take the name of file by removing the path & keeping the file name
      const tmp = _.split('/')
      // then since we use a require file name have number in their name (exemple : tolkien.556685563.png)
      // so we take only the name by removing extra (number + file extension)
      const title = tmp[tmp.length - 1].split('.')[0]
      return (
        <Card key={idx} variant='cards_template'>
          <CardBody>
            <Stack>
              <Heading variant='heading_template_dashboard'>{title.replaceAll('_', ' ')}</Heading>
              <Image
                className='img-card'
                src={_}
                style={{ 'objectFit': 'contain', 'maxHeight': '150px' }}
              />
            </Stack>

          </CardBody>
          <CardFooter>
            <ButtonGroup
              //ButtonGroup don't have variants theming so we modify directly the style
              style={{
                margin: 'auto'
              }}>
              <Button variant='menuconfigpanel_option_button'
                onClick={() => {
                  // Draw template
                  new_data.fromJSON(list_template_data[idx])
                }}>{t('useTemplate')}</Button>

              <Button variant='menuconfigpanel_option_button_secondary'
                onClick={() => {
                  // Dowload template to excel format
                  ClickSaveExcel('/opensankey/', list_template_data[idx])
                }}>{t('dl')}</Button>
            </ButtonGroup>
          </CardFooter>
        </Card>
      )
    }
    )}
  </>
}
// External imports
import  { Dispatch, MutableRefObject, SetStateAction, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useTranslation } from 'react-i18next'
// import {
//   FaPowerOff,
//   FaUser
// } from 'react-icons/fa'
// import LZString from 'lz-string'
// import {
//   Box,
//   Button,
//   MenuButton,
//   MenuItem,
//   MenuList,
//   Menu
// } from '@chakra-ui/react'
// import { ChevronDownIcon } from '@chakra-ui/icons'

// OpenSankey+ imports
import {
  Type_GenericApplicationDataOSP
} from './deps/OpenSankey+/types/TypesOSP'

// Local components / functions imports
// import {
//   loginOut
// } from './components/Login/LoginFunctions'
// import {
//   app_name_opensankeyplus,
//   app_name_sankeysuite
// } from './components/Register/LicenseFunctions'
import {
  welcomeModalBuilder
} from './welcome/ModalWelcome'

// declare const window: Window &
//   typeof globalThis & {
//     SankeyToolsStatic: boolean
//     sankey: {
//       filiere?: string,
//       header?: string,
//       has_header?: boolean,
//       footer?: boolean,
//       logo_width?: number,
//       excel?: string,
//       publish?: boolean
//       logo?: string,
//       has_welcome: boolean
//     }
//   }

// /*************************************************************************************************/
// //Search for licence logo
// let logo_OS = ''
// try {
//   /* eslint-disable */
//   // @ts-ignore
//   logo_OS = require('./css/Open_Sankey_logo.jpg')
//   /* eslint-enable */
//   const path = window.location.href
//   if (!path.includes('localhost')) {
//     logo_OS = logo_OS.replace('static/', 'static/sankeysuite/')
//   }
// } catch (expt) {
//   console.log('logo_OS not found')
// }

// let logo_OSP = ''
// try {
//   /* eslint-disable */
//   // @ts-ignore
//   logo_OSP = require('./css/OSP.png')
//   /* eslint-enable */
//   const path = window.location.href
//   if (!path.includes('localhost')) {
//     logo_OSP = logo_OSP.replace('static/', 'static/sankeysuite/')
//   }
// } catch (expt) {
//   console.log('logo_OSP not found')
// }

// let logo_OSS = ''
// try {
//   /* eslint-disable */
//   // @ts-ignore
//   logo_OSS = require('./css/OSS.png')
//   /* eslint-enable */
//   const path = window.location.href
//   if (!path.includes('localhost')) {
//     logo_OSS = logo_OSS.replace('static/', 'static/sankeysuite/')
//   }
// } catch (expt) {
//   console.log('logo_OSS not found')
// }

// let logo = ''

// try {
//   logo = require('./css/opensankey.png')
//   const path = window.location.href
//   if (!path.includes('localhost')) {
//     logo = logo.replace('static/', 'static/sankeysuite/')
//   }
// } catch (expt) {
//   console.log('opensankey.png not found')
// }

// let logo_terriflux = 'logo_terriflux.png'
// try {
//   logo_terriflux = require('./css/terriflux.png')
//   const path = window.location.href
//   if (!path.includes('localhost')) {
//     logo_terriflux = logo_terriflux.replace('static/', 'static/sankeysuite/')
//   }
// } catch (expt) {
//   console.log('terriflux.png not found')
// }
// // Logo, names, licences
// export const SuiteInitializeApplicationContext: SuiteInitializeApplicationContextType = (
//   blocker_token_OSP : boolean,
//   blocker_token_SSM : boolean
// ) => {
//   // Accounts token
//   let token_free_account = false
//   let has_sankey_suite = false
//   let has_open_sankey_plus = false
//   let has_sankeydev = false
//   if (window.SankeyToolsStatic) {
//     has_sankey_suite = true
//     has_open_sankey_plus = true
//     has_sankeydev = true
//   }

//   // const blockers=has_sankeydev?blockers_suite_sankey(
//   //   blocker_token_OSP,set_blocker_token_OSP,blocker_token_SSM,set_blocker_token_SSM):{}
//   // const token_sankey_suite = has_sankey_suite && !blocker_token_SSM

//   // If we are use the app as creation tool then some token depend of the user
//   // -------------Token for module of OpenSankey----------------------
//   // Search for saved token in localStorage added after login
//   const storage_token_plus = LZString.decompress(
//     sessionStorage.getItem(app_name_opensankeyplus) as string) as string
//   if (storage_token_plus !== null && storage_token_plus !== '' && !blocker_token_OSP) {
//     const d_t = JSON.parse(storage_token_plus)
//     has_open_sankey_plus = d_t
//   }

//   const storage_token_suite = LZString.decompress(
//     sessionStorage.getItem(app_name_sankeysuite) as string) as string
//   if (storage_token_suite !== null && storage_token_suite !== '' && !blocker_token_SSM) {
//     const d_t = JSON.parse(storage_token_suite)
//     if (d_t === true) {
//       has_open_sankey_plus = d_t
//     }
//     has_sankey_suite = d_t
//   }

//   const storage_token_dev = LZString.decompress(sessionStorage.getItem('SankeyDev') as string) as string
//   if (storage_token_dev !== null && storage_token_dev !== '') {
//     const d_t = JSON.parse(storage_token_dev)
//     has_sankeydev = d_t
//   }

//   let logo_application = logo

//   const storage_token = LZString.decompress(sessionStorage.getItem('token') as string) as string
//   if (storage_token !== null && storage_token !== '') {
//     const d_t = JSON.parse(storage_token)
//     token_free_account = d_t
//   }
//   if (has_open_sankey_plus) {
//     logo_application = logo_OSP
//   }
//   if (has_sankey_suite) {
//     logo_application = logo_OSS
//   }
//   const _ = {
//     t: useTranslation().t,
//     logo_OS,
//     logo_OSP,
//     logo_OSS,
//     logo_application,
//     logo_width: 100,
//     app_name: 'SankeySuite',
//     url_prefix: '/sankeytools/',
//     logo: logo_application,
//     logo_terriflux,
//     has_sankey_suite,
//     has_open_sankey_plus,
//     has_sankeydev,
//     unsetTokens: () => {
//       _.has_free_account = false
//       _.has_sankey_suite = false
//       _.has_open_sankey_plus = false
//       _.has_sankeydev = false
//     },
//     name_user: '',
//     has_free_account: token_free_account
//   } as suiteApplicationContextType
//   return _
// }

// // Global variables not stored in SankeyData
// // Mode, nodes and links selected, style selected...
// export const SuiteInitializeElementSelected: initializeElementSelectedType = () => { return {} as applicationStateType }

// // Réinitialise data et vide les noeud/liens sélectionnés
// export const SuiteInitializeReinitialization: initializeReinitializationType = () => () => { }

// // Data, displayed data, default data
// export const SuiteInitializeApplicationData: initializeApplicationDataType = () => { return {} as applicationDataType }

// // General functions necessay to draw the diagram
// export const SuiteInitializeApplicationDraw: initializeApplicationDrawType = () => { return {} as applicationDrawType }

// // Functions necessay to draw the links
// export const SuiteInitializeLinkFunctions: initializeLinkFunctionsType = () => { return {} as LinkFunctionTypes }

// // Functions necessay to draw the nodes
// export const SuiteInitializeNodeFunctions: initializeNodeFunctionsType = () => { return {} as NodeFunctionTypes }


// export const SuiteDrawAll: DrawAllType = () => { }


// export const SuiteInstallEventsOnSVG: InstallEventsOnSVGType = () => { }

// // Used to update the various component of the application
// export const SuiteInitializeComponentUpdater: () => ComponentUpdaterType = () => { return {} as ComponentUpdaterType }

// // Ref to some key ui element (accordion item) in the application
// export const SuiteInitializeUIElementsRef: initializeUIElementsRefType = () => { return {} as uiElementsRefType }

// export const SuiteInitializeAdditionalMenus: initializeAdditionalMenusType = (
//   additional_menus,
//   applicationContext,
//   applicationData,
//   appDraw,
//   ComponentUpdater,
//   appState,
//   uiElementsRef,
//   dict_hook_ref_setter_show_dialog_components
// ) => {
//   if (window.SankeyToolsStatic) {
//     return
//   }
//   const suiteApplicationContext = applicationContext as unknown as suiteApplicationContextType

//   // If windowSankey.SankeyToolsStatic is at true : we don't use the function useNavigate because we can't it use this function outside BrowserRouter
//   // and if the app is in publication mode we aren't in one
//   const navigate = useNavigate()
//   const returnToApp = () => {
//     navigate('/')
//     applicationData.set_data({ ...applicationData.data })
//   }

//   // Either create a menu to select where we navigate to (login or register account)
//   // or add a button to navigate to
//   const btn_navigate_to_login_register_dashboard = !suiteApplicationContext.has_free_account? <Menu
//     variant='menu_button_subnav_account_style'
//     placement='bottom-end'
//   >
//     <MenuButton>
//       <Box
//         gridColumn='1'
//         gridRow='1'
//         justifySelf='end'
//       >
//         <FaUser
//           style={{'height':'2rem', 'width':'2rem'}}
//         />
//       </Box>
//       <Box
//         gridColumn='2'
//         gridRow='1'
//         height='1rem'
//         width='1rem'
//         alignSelf='end'
//       >
//         <ChevronDownIcon
//           style={{'height':'1rem', 'width':'1rem'}}
//         />
//       </Box>
//     </MenuButton>
//     <MenuList>
//       <MenuItem
//         onClick={() => {
//           applicationData.function_on_wait.current = () => {
//             localStorage.setItem('data', LZString.compress(JSON.stringify((applicationData as suiteApplicationDataType).master_data)))
//             localStorage.setItem('last_save', 'true')
//             ComponentUpdater.updateComponenSaveInCache.current(true)
//             navigate('/login')
//           }
//           dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()
//         }}
//       >
//         {applicationContext.t('connect')}
//       </MenuItem>
//       <MenuItem
//         onClick={() => navigate('/register')}
//       >
//         {applicationContext.t('UserPages.to_reg')}
//       </MenuItem>
//     </MenuList>
//   </Menu>:<Box
//     alignSelf='center'
//     justifySelf='center'
//     display='grid'
//     gridTemplateColumns='1fr 1fr'
//     gridColumnGap='0.25rem'
//   >
//     <Button
//       variant={'menutop_button_goto_dashboard'}
//       onClick={() => {
//         applicationData.function_on_wait.current = () => {
//           localStorage.setItem('data', LZString.compress(JSON.stringify((applicationData as suiteApplicationDataType).master_data)))
//           localStorage.setItem('last_save', 'true')
//           ComponentUpdater.updateComponenSaveInCache.current(true)
//           navigate('/dashboard')
//         }
//         dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()
//       }}>
//       <FaUser />
//     </Button>
//     <Button
//       variant='menutop_button_logout'
//       onClick={() => loginOut(suiteApplicationContext.unsetTokens, returnToApp)}>
//       <FaPowerOff />
//     </Button>
//   </Box>

//   additional_menus.additional_nav_item.push(btn_navigate_to_login_register_dashboard)

//   additional_menus.cards_template = CardsTemplateBuilder(
//     appState as suiteElementsSelectedType,
//     applicationData as suiteApplicationDataType,
//     applicationContext as suiteApplicationContextType,
//     applicationData.convert_data as ConvertDataFuncType
//   )
// }

// Modal Dialogs
export const SuiteModuleDialogs = (
  new_data_plus: Type_GenericApplicationDataOSP,
  never_see_again: MutableRefObject<boolean>
) => {
  const active_page = useRef<Dispatch<SetStateAction<string>>>(() => null)
  if (new_data_plus.is_static) {
    return []
  }
  return [
    welcomeModalBuilder(
      new_data_plus,
      never_see_again,
      active_page
    )
  ]
}

// // Visibility states for the modal dialogs
// export const SuiteInitializeShowDialog: initializeShowDialogType = () => { return {} as dict_hook_ref_setter_show_dialog_componentsType }

// // Menu opening on RMB
// export const SuiteInitializeContextMenu: () => contextMenuType = () => { return {} as contextMenuType }
// export const SuiteInitializeCloseAllMenuContext: initializeCloseAllMenuContextType = () => { return () => { } }
// export const closeAllMenu = () => { }

// //- BackEnd
// export const SuiteInitializeProcessFunctions: () => processFunctionsType = () => { return {} as processFunctionsType }

// export const SuiteInitializeMenuConfiguration: initializeMenuConfigurationFuncType = () => { return [] as JSX.Element[] }

// export const SuiteInitializeKeyHandler: initializeKeyHandlerType = () => { }
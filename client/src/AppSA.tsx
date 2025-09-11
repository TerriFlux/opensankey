// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux
// ==================================================================================================

// External imports =================================================================================

import React, { FC, MutableRefObject, useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, NavigateFunction, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ButtonOpenUSerPreference, ModalPreference } from './deps/LoginComponent/Preferences/Preferences'

import {
  Box,
  Center,
  ChakraProvider,
  Spinner
} from '@chakra-ui/react'

import TextLoop from 'react-text-loop'


// OpenSankey imports ===============================================================================

import OpenSankeyApp from './deps/LoginComponent//deps/OpenSankey+/deps/OpenSankey/App'

// OpenSankey+ imports ===============================================================================

import {
  initializeAdditionalMenusOSP,
  moduleDialogsOSP,
} from './deps/LoginComponent//deps/OpenSankey+/ModulesOSP'
import { ModalWelcomeBuilderOSP } from './deps/LoginComponent//deps/OpenSankey+/components/ModalWelcomeOSP'
import { 
  createZDDModifierPlus,createNodeModifierPlus, 
  createZDDMenuConfigPlus, createLinkMenuConfigPlus, createNodeMenuConfigPlus 
} from './deps/LoginComponent/deps/OpenSankey+/components/ContextMenuConfigs'

import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { Theme_SankeyApplication } from './chakra/Theme'
import Account from './deps/LoginComponent/UserPages/Account'
import Dashboard from './deps/LoginComponent/UserPages/Dashboard'
import Register from './deps/LoginComponent/Register/Register'
import { Login } from './deps/LoginComponent/Login/Login'
import { PasswordResetFromMail, PasswordResetFromToken } from './deps/LoginComponent/Login/PasswordReset'
import { PublicRoute } from './deps/LoginComponent/Routes/PublicRoutes'
import { PaiementCheckout, PaiementPage, PaiementReturn } from './deps/LoginComponent/Paiement/Paiement'
import { MetaTags } from './components/MetaTags'
import i18next from 'i18next'
import { ButtonOpenModalSankeyTheque, ModalSankeyTheque } from './components/SankeyTheque'
import { UserPagesButtons } from './deps/LoginComponent/UserPages/UserPages'
import { Type_JSON, checkForUrlToJSON } from './deps/LoginComponent/deps/OpenSankey+/deps/OpenSankey/types/Utils'
import { FType_ModuleDialogs } from './deps/LoginComponent/deps/OpenSankey+/deps/OpenSankey/Modules'
import { Type_AdditionalMenus } from './deps/OpenSankey+/deps/OpenSankey/types/MenuConfig'
import { createLinkModifier } from './deps/OpenSankey+/deps/OpenSankey/components/dialogs/ContextLinkConfig'
import { PrivateRoute } from './deps/LoginComponent/Routes/PrivateRoutes'
import { Class_ApplicationData } from './deps/OpenSankey+/deps/OpenSankey/types/ApplicationData'


// Specific methods ==================================================================================

function shuffle(array: number[]) {
  let currentIndex = array.length

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]]
  }

  return array
}

type FType_InitializeAdditionalMenusSA = (
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  new_data: Class_ApplicationDataSA,
  setLicenses: React.MutableRefObject<() => void>
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
  setLicenses
) => {
  initializeAdditionalMenusOSP(
    additionalMenus,
    new_data_app
  )
  if (new_data_app.is_static) {
    return
  }

  // Check if user is connected ----------------------------------------------------------



  // New modules -------------------------------------------------------------------------

  additionalMenus.current.additional_nav_item.push(
    <UserPagesButtons
      new_data_app={new_data_app}
      setLicenses={setLicenses}
      returnToApp={returnToApp}
    />
  )

  // Index sankeytheque key in menu top order
  const idx_st = new_data_app.menu_configuration.menu_top_order.findIndex(el => el.includes('sankeytheque'))
  const idx_reg = new_data_app.menu_configuration.menu_top_order.findIndex(el => el.includes('setting'))
  if (new_data_app.has_sankey_plus) {
    // Check if sankeytheque is not already in menu top order
    if (idx_st == -1) new_data_app.menu_configuration.menu_top_order.push(['sankeytheque'])
    if (idx_reg == -1) new_data_app.menu_configuration.menu_top_order.push(['setting'])

    additionalMenus.current.external_top_buttons_item['sankeytheque'] = (<ButtonOpenModalSankeyTheque new_data={new_data_app as Class_ApplicationDataSA} />)
    additionalMenus.current.external_top_buttons_item['setting'] = (<ButtonOpenUSerPreference new_data={new_data_app} />)
  } else {
    if (idx_st !== -1) {
      new_data_app.menu_configuration.menu_top_order.splice(idx_st, 1)
    }
    if (idx_reg !== -1) {
      new_data_app.menu_configuration.menu_top_order.splice(idx_reg, 1)
    }
  }
}

export const moduleDialogsSA: FType_ModuleDialogs = (
  new_data,
  additional_menus,
  menu_configuration_nodes_attributes,
  processFunctions
) => {
  // OpenSankey Menu
  const dialogDialogsOSP = moduleDialogsOSP(
    new_data,
    additional_menus,
    menu_configuration_nodes_attributes,
    processFunctions
  )

  // Cast type
  const new_data_SA = new_data as unknown as Class_ApplicationDataSA

  const moduleDialogsSA: JSX.Element[] = []

  if (new_data_SA.has_sankey_plus) {
    moduleDialogsSA.push(
      <ModalSankeyTheque new_data={new_data_SA} />,
      <ModalPreference new_data={new_data_SA} additionalMenus={additional_menus} />
    )
  }

  return [
    ...dialogDialogsOSP,
    ...moduleDialogsSA
  ]
}

export const SankeyApp = ({ new_data_app } : {new_data_app: Class_ApplicationDataSA}) => {

  const setLicenses = useRef(() => {
    console.log('=== setLicenses function called ===')

    const log_component = new_data_app.login_component
    console.log('loginComponent result:', log_component)

    const has_account = log_component.has_account
    console.log('has_account:', has_account)
    console.log('log_component.has_licence_sankeyplus:', log_component.has_licence_sankeyplus)
    console.log('log_component.has_licence_sankeysuite:', log_component.has_licence_sankeysuite)

    new_data_app.has_sankey_plus = has_account && log_component.has_licence_sankeyplus
    console.log('new_data_app.has_sankey_plus set to:', new_data_app.has_sankey_plus)

    new_data_app.has_sankey_afm = has_account && log_component.has_licence_sankeysuite
    console.log('new_data_app.has_sankey_afm set to:', new_data_app.has_sankey_afm)

    console.log('Calling updateAllMenuComponents...')
    new_data_app.menu_configuration.updateAllMenuComponents()
    new_data_app.menu_configuration.ref_rerender_submodules_menus.current()
    console.log('=== setLicenses function completed ===')
  })

  // Minimal app ------------------------------------------------------------------------------------
  const sankeyApp =
    <OpenSankeyApp
      initializeApplicationData={() => new_data_app}
      initializeAdditionalMenus={(additionalMenus, new_data) => {
        initializeAdditionalMenusSA(
          additionalMenus,
          new_data as Class_ApplicationDataSA,
          setLicenses
        )
      }}
      moduleDialogs={moduleDialogsSA}
      ModalWelcome={ModalWelcomeBuilderOSP}
      createZDDModifier={(app_data) => createZDDModifierPlus(app_data as Class_ApplicationDataSA)}
      ZDD_MENU_CONFIG={createZDDMenuConfigPlus()}
      createLinkModifier={(app_data) => createLinkModifier(app_data as unknown as Class_ApplicationData)}
      LINK_MENU_CONFIG={createLinkMenuConfigPlus()}
      NODE_MENU_CONFIG={createNodeMenuConfigPlus()}
      createNodeModifier={(app_data) => createNodeModifierPlus(app_data as Class_ApplicationDataSA)}
    />

  if (new_data_app.is_static)
    return <ChakraProvider
      theme={Theme_SankeyApplication}
    >
      {sankeyApp}
    </ChakraProvider>

  // Full app ------------------------------------------------------------------------------------

  const start_sentence = shuffle([...Array(7).keys()])
  const end_sentence = shuffle([...Array(8).keys()])

  const [app, setApp] = useState(
    <HelmetProvider>
      <MetaTags
        new_data_app={new_data_app}
      />
      <ChakraProvider
        theme={Theme_SankeyApplication}
      >
        <Box
          height="100vh"
          backgroundImage={'url(./loading_screen/' + i18next.language + '/' + String(Math.ceil(Math.random() * 3)) + '.png)'}
          backgroundRepeat='no-repeat'
          backgroundPosition='center'
          backgroundSize="contain"
        >
          <Center
            height="100vh"
            display="grid"
            gridAutoFlow="row"
          >
            <Box
              as="span"
              textStyle="h1"
              textColor="black"
              fontSize="6vh"
            >
              {
                i18next.language !== 'fr' ? 'Simply ' : ''
              }
              <TextLoop
                springConfig={{ stiffness: 180, damping: 8 }}
              >
                {
                  start_sentence.map(i => {
                    return <Box
                      textColor={'primaire.' + String(Math.ceil(Math.random() * 6))}
                    >
                      {new_data_app.t('loading_screen.start.text_' + String(i))}
                    </Box>
                  })
                }
              </TextLoop>
              {
                i18next.language !== 'fr' ? ' your ' : ' simplement vos flux '
              }
              <TextLoop
                springConfig={{ stiffness: 180, damping: 8 }}
              >
                {
                  end_sentence.map(i => {
                    return <Box
                      textColor={'secondaire.' + String(Math.ceil(Math.random() * 6))}
                    >
                      {new_data_app.t('loading_screen.end.text_' + String(i))}
                    </Box>
                  })
                }
              </TextLoop>
              {
                i18next.language !== 'fr' ? ' flows' : ''
              }
            </Box>
          </Center>
          <Spinner
            width='50px'
            height='50px'
            borderWidth='5px'
            color='primaire.2'
            position='absolute'
            zIndex='1'
            bottom='50px'
            right='50%'
          />
        </Box>
      </ChakraProvider>
    </HelmetProvider>
  )
  const exemple_menu = {} as { [_: string]: JSX.Element }

  // if (!new_data_app?.is_static) {
  //   // Menus are not presents in mode publish
  //   const path = window.location.origin
  //   const url = path + '/opensankey/sankey/menu_examples'
  //   // let formations_menu = {} as { [_: string]: JSX.Element }
  //   fetch(url, fetchData).then(response => {
  //     response.text().then(text => {
  //       const json_data = JSON.parse(text)
  //       exemple_menu = json_data.exemples_menu
  //       if (Object.keys(json_data.exemples_menu['Formations']).length > 0) {
  //         // formations_menu = Object.fromEntries(
  //         //   Object.entries(json_data.exemples_menu['Formations']['Tutoriels']).filter(d => d[0] !== 'artifacts')
  //         // ) as { [_: string]: JSX.Element }
  //         delete json_data.exemples_menu['Formations']['Tutoriels']
  //       }
  //     }).catch(() => {
  //       exemple_menu = {}
  //       // formations_menu = {}
  //     }).then(() => {
  //       renderPage()
  //     })
  //   })
  // }

  const blockers = {}

  useEffect(() => {
    setTimeout(() => {
      new_data_app.login_component.checkTokens(setLicenses)
        .then(() => setApp(
          <HelmetProvider>
            <MetaTags
              new_data_app={new_data_app}
            />
            <ChakraProvider
              theme={Theme_SankeyApplication}
            >
              <HashRouter>
                <Routes>
                  <Route
                    path='/register'
                    element={
                      <PublicRoute
                        component={
                          <Register
                            t={new_data_app.t}
                            logo={new_data_app.logo}
                            logo_sankey_plus={new_data_app.logo_sankey_plus}
                            loginComponent={new_data_app.login_component}
                            setLicenses={setLicenses}
                            returnToApp={returnToApp}
                            theme={Theme_SankeyApplication}
                          />
                        }
                        loginComponent={new_data_app.login_component}
                      />
                    }
                  />
                  <Route
                    path='/login'
                  >
                    <Route
                      index
                      element={
                        <PublicRoute
                          component={
                            <Login
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              loginComponent={new_data_app.login_component}
                              setLicenses={setLicenses}
                              returnToApp={returnToApp}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                    <Route
                      path='forgot'
                      element={
                        <PublicRoute
                          component={
                            <PasswordResetFromMail
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              returnToApp={returnToApp}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                    <Route
                      path='reset/:token'
                      element={
                        <PublicRoute
                          component={
                            <PasswordResetFromToken
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              returnToApp={returnToApp}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                  </Route>
                  <Route
                    path='/dashboard'
                    element={
                      <PrivateRoute
                        component={
                          <Dashboard
                            t={new_data_app.t}
                            logo={new_data_app.logo}
                            returnToApp={returnToApp}
                            loginComponent={new_data_app.login_component}
                            setLicenses={setLicenses}
                            exemple_menu={exemple_menu}
                          />
                        }
                        loginComponent={new_data_app.login_component}
                      />
                    }
                  />
                  <Route
                    path='/license'
                  >
                    <Route
                      index
                      element={
                        <PrivateRoute
                          component={
                            <PaiementPage
                              t={new_data_app.t}
                              logo={new_data_app.logo}
                              returnToApp={returnToApp}
                              logo_sankey_plus={new_data_app.logo_sankey_plus}
                            />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                    <Route
                      path='checkout'
                      element={
                        <PrivateRoute
                          component={
                            <PaiementCheckout />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                    <Route
                      path='return'
                      element={
                        <PrivateRoute
                          component={
                            <PaiementReturn />
                          }
                          loginComponent={new_data_app.login_component}
                        />
                      }
                    />
                  </Route>
                  <Route
                    path='/account'
                    element={
                      <PrivateRoute
                        component={
                          <Account
                            t={new_data_app.t}
                            logo={new_data_app.logo}
                            logo_sankey_plus={new_data_app.logo_sankey_plus}
                            returnToApp={returnToApp}
                            loginComponent={new_data_app.login_component}
                            setLicenses={setLicenses}
                            blocker_suite_sankey={blockers}
                          />
                        }
                        loginComponent={new_data_app.login_component}
                      />
                    }
                  />
                  <Route path='/' element={sankeyApp} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </HashRouter>
            </ChakraProvider>
          </HelmetProvider>
        ))
    }, 1000)
  }, [])

  return app
}

export const returnToApp = (
  navigate: NavigateFunction
) => {
  navigate('/')
}

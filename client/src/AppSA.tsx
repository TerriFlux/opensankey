// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux
// ==================================================================================================

// External imports =================================================================================

import React, { FunctionComponent, useEffect, useState } from 'react'
import { HashRouter, Navigate, NavigateFunction, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import {
  Box,
  Center,
  ChakraProvider,
  Spinner
} from '@chakra-ui/react'

import TextLoop from "react-text-loop"


// OpenSankey imports ===============================================================================

import OpenSankeyApp from './deps/OpenSankey+/deps/OpenSankey/App'
import { ClickSaveDiagram } from './deps/OpenSankey+/deps/OpenSankey/components/dialogs/SankeyPersistence'
import { initializeMenuConfiguration } from './deps/OpenSankey+/deps/OpenSankey/Modules'

// OpenSankey+ imports ===============================================================================

import {
  initializeDiagrammSelectorOSP,
  initializeReinitializationOSP,
} from './deps/OpenSankey+/ModulesOSP'
import { ModalWelcomeBuilderOSP } from './deps/OpenSankey+/components/welcome/ModalWelcomeOSP'

// Local imports ====================================================================================

import { Class_ApplicationDataSA } from './types/ApplicationDataSA'
import { Theme_SankeyApplication } from './chakra/Theme'
import { initializeAdditionalMenusSA, initializeApplicationDataSA, moduleDialogsSA } from './ModulesSA'
import Account from './components/UserPages/Account'
import Dashboard from './components/UserPages/Dashboard'
import Register from './components/Register/Register'
import { Login } from './components/Login/Login'
import { PasswordResetFromMail, PasswordResetFromToken } from './components/Login/PasswordReset'
import { PrivateRoute } from './components/Routes/PrivateRoutes'
import { PublicRoute } from './components/Routes/PublicRoutes'
import { PaiementCheckout, PaiementPage, PaiementReturn } from './components/Paiement/Paiement'
import { MetaTags } from './components/MetaTags'
import i18next from 'i18next'

// Specific methods ==================================================================================

function shuffle(array: number[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array
}

// OpenSankeyApp for OpenSankey+ ========================================================================

type FCType_SankeyApp = {
  new_data_app: Class_ApplicationDataSA
}

export const SankeyApp: FunctionComponent<FCType_SankeyApp> = (
  { new_data_app }
) => {

  // Minimal app ------------------------------------------------------------------------------------
  const sankeyApp =
    <OpenSankeyApp
      initializeReinitialization={initializeReinitializationOSP}
      initializeApplicationData={
        (initial_data) => {
          return initializeApplicationDataSA(
            new_data_app,
            initial_data
          )
        }
      }
      initializeMenuConfiguration={initializeMenuConfiguration}
      initializeAdditionalMenus={(additionalMenus, new_data) => {
        initializeAdditionalMenusSA(
          additionalMenus,
          new_data as Class_ApplicationDataSA,
        )
      }}
      initializeDiagrammSelector={initializeDiagrammSelectorOSP}
      moduleDialogs={moduleDialogsSA}
      ModalWelcome={ModalWelcomeBuilderOSP}
      ClickSaveDiagram={
        (new_data_app) => { ClickSaveDiagram(new_data_app) }
      }
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
          backgroundImage={"url(./loading_screen/" + i18next.language + '/' + String(Math.ceil(Math.random() * 3)) + ".png)"}
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
  //         //   Object.entries(json_data.exemples_menu['Formations']['Tutoriels']).filter(d => d[0] !== 'artefacts')
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
      new_data_app.checkTokens()
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
                        new_data_app={new_data_app}
                        component={
                          <Register
                            new_data_app={new_data_app}
                          />
                        }
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
                          new_data_app={new_data_app}
                          component={
                            <Login
                              new_data_app={new_data_app}
                            />
                          }
                        />
                      }
                    />
                    <Route
                      path='forgot'
                      element={
                        <PublicRoute
                          new_data_app={new_data_app}
                          component={
                            <PasswordResetFromMail
                              new_data_app={new_data_app}
                            />
                          }
                        />
                      }
                    />
                    <Route
                      path='reset/:token'
                      element={
                        <PublicRoute
                          new_data_app={new_data_app}
                          component={
                            <PasswordResetFromToken
                              new_data_app={new_data_app}
                            />
                          }
                        />
                      }
                    />
                  </Route>
                  <Route
                    path='/dashboard'
                    element={
                      <PrivateRoute
                        new_data_app={new_data_app}
                        component={
                          <Dashboard
                            new_data_app={new_data_app}
                            exemple_menu={exemple_menu}
                          />
                        }
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
                          new_data_app={new_data_app}
                          component={
                            <PaiementPage
                              new_data_app={new_data_app}
                            />
                          }
                        />
                      }
                    />
                    <Route
                      path='checkout'
                      element={
                        <PrivateRoute
                          new_data_app={new_data_app}
                          component={
                            <PaiementCheckout />
                          }
                        />
                      }
                    />
                    <Route
                      path='return'
                      element={
                        <PrivateRoute
                          new_data_app={new_data_app}
                          component={
                            <PaiementReturn />
                          }
                        />
                      }
                    />
                  </Route>
                  <Route
                    path='/account'
                    element={
                      <PrivateRoute
                        new_data_app={new_data_app}
                        component={
                          <Account
                            new_data_app={new_data_app}
                            blocker_suite_sankey={blockers}
                          />
                        }
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

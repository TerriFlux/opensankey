// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports =================================================================================

import React, { FunctionComponent, useEffect, useState } from 'react'
import { HashRouter, Navigate, NavigateFunction, Route, Routes } from 'react-router-dom'
import { Center, ChakraProvider, Spinner } from '@chakra-ui/react'

// OpenSankey imports ===============================================================================

import SankeyApp from './deps/OpenSankey+/deps/OpenSankey/SankeyApp'
import { ClickSaveDiagram } from './deps/OpenSankey+/deps/OpenSankey/dialogs/SankeyPersistence'
import { initializeMenuConfiguration } from './deps/OpenSankey+/deps/OpenSankey/OSModule'

// OpenSankey+ imports ===============================================================================

import {
  initializeDiagrammSelectorOSP,
  initializeReinitializationOSP,
  moduleDialogsOSP
} from './deps/OpenSankey+/OSPModule'
import { ModalWelcomeBuilderOSP } from './deps/OpenSankey+/welcome/ModalWelcomeOSP'

// Local imports ====================================================================================

import { Class_ApplicationDataSA } from './ApplicationData'
import { Theme_SankeyApplication }  from './chakra/Theme'
import { ExempleMenuTypes, initializeAdditionalMenusSA, initializeApplicationDataSA } from './ModulesSA'
import Account from './components/UserPages/Account'
import Dashboard from './components/UserPages/Dashboard'
import Register from './components/Register/Register'
import { Login } from './components/Login/Login'
import { PasswordResetFromMail, PasswordResetFromToken } from './components/Login/PasswordReset'
import { PrivateRoute } from './components/Routes/PrivateRoutes'
import { PublicRoute } from './components/Routes/PublicRoutes'
import { PaiementCheckout, PaiementPage, PaiementReturn } from './components/Paiement/Paiement'

// SankeyApp for OpenSankey+ ========================================================================

type SankeyAppSAType = {
  example_menu: ExempleMenuTypes,
  formations_menu: ExempleMenuTypes,
  new_data_app:Class_ApplicationDataSA
}
export const SankeyAppSA: FunctionComponent<SankeyAppSAType> = (
  { example_menu, formations_menu,new_data_app }
) => {

  // Minimal app ------------------------------------------------------------------------------------

  

  const reinit = initializeReinitializationOSP(new_data_app)
  const sankeyApp =
    <SankeyApp
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
          example_menu,
          formations_menu,
          reinit
        )
      }}
      initializeDiagrammSelector={initializeDiagrammSelectorOSP}
      moduleDialogs={moduleDialogsOSP}
      ModalWelcome={ModalWelcomeBuilderOSP}
      ClickSaveDiagram={
        (new_data_app) => { ClickSaveDiagram(new_data_app) }
      }
    />

  if (new_data_app.is_static)
    return sankeyApp

  // Full app ------------------------------------------------------------------------------------

  const [app, setApp] = useState(
    <ChakraProvider
      theme={Theme_SankeyApplication}
    >
      <Center h={window.innerHeight} w={window.innerWidth}>
        <Spinner size='xl'/>
      </Center>
    </ChakraProvider>
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
    new_data_app.checkTokens()
      .then(() => setApp(
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
        </ChakraProvider>))
  }, []
  )

  return app
}

export const returnToApp = (
  navigate: NavigateFunction
) => {
  navigate('/')
}

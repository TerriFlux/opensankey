// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports =================================================================================

import React, { FunctionComponent} from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'

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
import { ExempleMenuTypes, initializeAdditionalMenusSA, initializeApplicationDataSA } from './ModulesSA'
import Account from './components/UserPages/Account'
import Dashboard from './components/UserPages/Dashboard'
import Register from './components/Register/Register'
import Login from './components/Login/Login'
import { PasswordResetFromMail, PasswordResetFromToken } from './components/Login/PasswordReset'
import {Theme_SankeyApplication}  from './chakra/Theme'
// SankeyApp for OpenSankey+ ========================================================================
type SankeyAppSAType={
  example_menu: ExempleMenuTypes,
  formations_menu: ExempleMenuTypes
}
export const SankeyAppSA: FunctionComponent<SankeyAppSAType> = ({example_menu,formations_menu}) => {

  const new_data_app = new Class_ApplicationDataSA(false)
  const reinit =initializeReinitializationOSP(new_data_app)
  const sankeyApp =<SankeyApp
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

  if (new_data_app.is_static)
    return <ChakraProvider
      theme={Theme_SankeyApplication}>
      {sankeyApp}
    </ChakraProvider>
  else
    return <ChakraProvider
      theme={Theme_SankeyApplication}
    >
      <HashRouter>
        <Routes>
          <Route
            path='/register'
            element={
              <Register
                new_data_app={new_data_app}
              />
            }
          />
          <Route
            path='/login'
          >
            <Route
              index
              element={
                <Login
                  new_data_app={new_data_app}
                />
              }
            />
            <Route
              path='forgot'
              element={
                <PasswordResetFromMail
                  new_data_app={new_data_app}
                />
              }
            />
            <Route
              path='reset/:token'
              element={
                <PasswordResetFromToken
                  new_data_app={new_data_app}
                />
              }
            />
          </Route>
          <Route
            path='/dashboard'
            element={
              <Dashboard
                new_data_app={new_data_app}
                exemple_menu={exemple_menu}
              />
            }
          />
          <Route
            path='/account'
            element={
              <Account
                new_data_app={new_data_app}
                blocker_suite_sankey={blockers}
              />
            }
          />
          <Route path='/' element={sankeyApp} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </ChakraProvider>

}
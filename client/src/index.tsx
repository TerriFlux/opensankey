// ================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
//
// Main for SankeyApplication
//
// All rights reserved for TerriFlux SARL
// ================================================================================================

// CSS ============================================================================================

import './deps/OpenSankey+/deps/OpenSankey/css/main.css'
import './deps/OpenSankey+/css/main.css'
import './deps/OpenSankey+/css/colors/red.css'
import './deps/OpenSankey+/css/style_elements_sankey.css'
import './deps/OpenSankey+/css/react-quill.css'
import './css/Login.css'
import './css/Register.css'

// External imports ===============================================================================

import React, { FunctionComponent, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Routes } from 'react-router-dom'
import { Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import './traduction'
import i18next from './traduction'

import { ChakraProvider } from '@chakra-ui/react'

// OpenSankey imports =============================================================================

import { opensankey_theme } from './deps/OpenSankey+/deps/OpenSankey/chakra/Theme'

// OpenSankey+ imports ===========================================================================

import { Class_ApplicationDataOSP } from './deps/OpenSankey+/types/TypesOSP'
import { SankeyAppOSP } from './deps/OpenSankey+/SankeyApp'

// Local modules =================================================================================

import Register from './components/Register/Register'
import Login from './components/Login/Login'
import Account from './components/UserPages/Account'
import Dashboard from './components/UserPages/Dashboard'

// Global variables ==============================================================================

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      filiere?: string,
      header?: string,
      has_header?: boolean,
      footer?: boolean,
      logo_width?: number,
      excel?: string,
      publish?: boolean
      logo?: string
    }
  }

window.React = React
i18next.changeLanguage(navigator.language.includes('fr') ? 'fr' : 'en')


const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)
const fetchData = { method: 'POST' }

let exemple_menu = {} as { [_: string]: JSX.Element }

if (!window.SankeyToolsStatic) {
  // Menus are not presents in mode publish
  const path = window.location.origin
  const url = path + '/opensankey/sankey/menu_examples'
  // let formations_menu = {} as { [_: string]: JSX.Element }
  fetch(url, fetchData).then(response => {
    response.text().then(text => {
      const json_data = JSON.parse(text)
      exemple_menu = json_data.exemples_menu
      if (Object.keys(json_data.exemples_menu['Formations']).length > 0) {
        // formations_menu = Object.fromEntries(
        //   Object.entries(json_data.exemples_menu['Formations']['Tutoriels']).filter(d => d[0] !== 'artefacts')
        // ) as { [_: string]: JSX.Element }
        delete json_data.exemples_menu['Formations']['Tutoriels']
      }
    }).catch(() => {
      exemple_menu = {}
      // formations_menu = {}
    }).then(() => {
      renderPage()
    })
  })
}

// const suite_converter = (data: SuiteSankeyData, DefaultData: () => SuiteSankeyData) => {
//   plus_convert_data(data, DefaultData)
//   dev_convert_data(data)
//   convert_data(data, DefaultData)
//   const special_data_cast = (data as AFMSankeyData)
//   if (special_data_cast.free_null_link_visible === undefined) {
//     special_data_cast.free_null_link_visible = true
//   }
// }

const SankeyApplicationComponent: FunctionComponent = () => {

  const [update, set_update] = useState<boolean>(true) // useState OK
  const new_data_plus = new Class_ApplicationDataOSP(window.SankeyToolsStatic) // TODO force static app here
  const Application = SankeyAppOSP

  const blockers = {}

  if (new_data_plus.is_static) {
    return Application
  }

  return <ChakraProvider
    resetCSS={false}
    theme={opensankey_theme}
  >
    <BrowserRouter>
      <Routes>
        <Route
          path='/register'
          element={
            <Register
              navbar_logo={new_data_plus.logo}
              update={update}
              set_update={set_update}
            />
          }
        />
        <Route
          path='/login'
          element={
            <Login
              navbar_logo={new_data_plus.logo}
              update={update}
              set_update={set_update}
            />
          }
        />
        <Route
          path='/dashboard'
          element={
            <Dashboard
              new_data={new_data_plus}
              navbar_logo={new_data_plus.logo}
              exemple_menu={exemple_menu}
              update={update}
              set_update={set_update}
            />
          }
        />
        <Route
          path='/account'
          element={
            <Account
              navbar_logo={new_data_plus.logo}
              new_data={new_data_plus}
              blocker_suite_sankey={blockers}
              update={update}
              set_update={set_update}
            />
          }
        />
        <Route path='/' element={Application} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </ChakraProvider>
}

const renderPage = () => {
  root.render(<SankeyApplicationComponent />)
}

if (window.SankeyToolsStatic) {
  renderPage()
}
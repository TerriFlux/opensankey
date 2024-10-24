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
import './deps/OpenSankey+/deps/OpenSankey/css/bootstrap.css'
import './deps/OpenSankey+/css/main.css'
import './deps/OpenSankey+/css/colors/red.css'
import './deps/OpenSankey+/css/style_elements_sankey.css'
import './deps/OpenSankey+/css/react-quill.css'
import './css/Login.css'
import './css/Register.css'
// External imports ===============================================================================

import React from 'react'
import { createRoot } from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
// import { Routes } from 'react-router-dom'
// import { Route } from 'react-router-dom'
// import { Navigate } from 'react-router-dom'
import './traduction'
import i18next from './traduction'

// import { ChakraProvider } from '@chakra-ui/react'

// OpenSankey+ imports ===========================================================================

// import { Class_ApplicationDataSA } from './deps/OpenSankey+/types/TypesOSP'

// Local modules =================================================================================

// import Register from './components/Register/Register'
// import Login from './components/Login/Login'
// import Account from './components/UserPages/Account'
// import Dashboard from './components/UserPages/Dashboard'
import { SankeyAppSA } from './SankeyAppSA'
import { ExempleMenuTypes } from './ModulesSA'

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


const fetchData = {
  method: 'POST'
}

let exemple_menu = {} as ExempleMenuTypes
let formations_menu = {} as ExempleMenuTypes

// Create a default sankey
// const data = DefaultSankeyData()
const path = window.location.origin
const url = path + '/opensankey/sankey/menu_examples'
fetch(url, fetchData)
  .then(response => {
    response
      .text()
      .then(text => {
        const json_data = JSON.parse(text)
        exemple_menu = json_data.exemples_menu
        if (Object.keys(json_data.exemples_menu['Formations']).length > 0) {
          formations_menu = Object.fromEntries(
            Object.entries(json_data.exemples_menu['Formations']['Tutoriels']).filter(d => d[0] !== 'artefacts')
          ) as { [_: string]: ExempleMenuTypes }
          delete json_data.exemples_menu['Formations']['Tutoriels']
        }
      })
      .then(() => {
        renderPage()
      })
      .catch((error) => {
        console.error('Error in fetchExamples - ' + error.toString())
        exemple_menu = {}
        formations_menu = {}
      })
  })


const renderPage = () => {
  root.render(
    <SankeyAppSA example_menu={exemple_menu} formations_menu={formations_menu} />
  )
}

// if (window.SankeyToolsStatic) {
// renderPage()
// }
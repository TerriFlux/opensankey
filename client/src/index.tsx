// ================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
//
// Main for SankeyApplication
//
// All rights reserved for TerriFlux
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

import React, { FunctionComponent } from 'react'
import { createRoot } from 'react-dom/client'
import './traductions/traduction'
import i18next from './traductions/traduction'

// Local modules =================================================================================

import { SankeyApp } from './AppSA'
import { Class_ApplicationDataSA } from './types/ApplicationDataSA'
import { Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'

// Global variables ==============================================================================

declare const window: Window &
  typeof globalThis & {
    sankey: {
      diagram?: string,
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

let initialRender: boolean = true
let dataApp: Class_ApplicationDataSA

const App: FunctionComponent = () => {
  if (initialRender) {
    initialRender = false
    dataApp = new Class_ApplicationDataSA(!!window.sankey?.publish)
  }
  return <SankeyApp
    new_data_app={dataApp}
  />
}

const renderPage = () => {
  root.render(<App />)
}

renderPage()

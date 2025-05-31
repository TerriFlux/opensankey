// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux
// ==================================================================================================

// CSS ==============================================================================================

import './deps/OpenSankey/css/main.css'
import './css/main.css'
import './css/colors/red.css'
import './css/style_elements_sankey.css'
import './css/react-quill.css'

// External imports =================================================================================

import React from 'react'
import { createRoot } from 'react-dom/client'

// Local imports ====================================================================================

import './traductions/traduction'
import { OpenSankeyPlusApp } from './AppOSP'

// CONSTANTS =========================================================================================

declare const window: Window &
  typeof globalThis & {
    sankey: {
      filiere?: string
      footer?: boolean
      header?: string
      logo?: string
    }
  }

window.React = React

const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)

root.render(OpenSankeyPlusApp)


// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// CSS ==============================================================================================

import './css/main.css'

// External imports =================================================================================

import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'

// Local imports ====================================================================================

import './traductions/traduction'

import OpenSankeyApp from './App'
import {
  initializeApplicationData,
  initializeAdditionalMenus,
  moduleDialogs
} from './Modules'
import {
  ClickSaveDiagram
} from './Persistence/SankeyPersistence'
import {
  ModalWelcomeBuilder
} from './components/welcome/ModalWelcome'
import { opensankey_theme } from './css/Theme'
import { createZDDModifier, ZDD_MENU_CONFIG } from './components/dialogs/ContextZDDConfig'
import { LINK_MENU_CONFIG } from './components/dialogs/ContextLinkConfig'

// CONSTANTS =========================================================================================

// Link with React
window.React = React

// Application container
const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)

// RENDERING ==========================================================================================
root.render(
  <ChakraProvider theme={opensankey_theme}>
    <OpenSankeyApp

      //- Data
      initializeApplicationData={initializeApplicationData} // Data, displayed data, default data

      // Ref to some key ui element in the application
      initializeAdditionalMenus={initializeAdditionalMenus}

      // Submenus to add in the application
      moduleDialogs={moduleDialogs}

      // Welcome modal
      ModalWelcome={ModalWelcomeBuilder}

      // BackEnd
      createZDDModifier={createZDDModifier}
      ZDD_MENU_CONFIG={ZDD_MENU_CONFIG}
      //@ts-expect-error xxx
      createLinkModifier={createLinkModifier}
      LINK_MENU_CONFIG={LINK_MENU_CONFIG}
    />
  </ChakraProvider>
)


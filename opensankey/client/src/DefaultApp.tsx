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

import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { opensankey_theme } from './css/Theme'
import { initializeAdditionalMenus, moduleDialogs } from './Modules'
import { ModalWelcomeBuilder } from './components/welcome/ModalWelcome'
import OpenSankeyApp from './App'
import { createZDDModifier, ZDD_MENU_CONFIG } from './components/dialogs/ContextZDDConfig'
import { createLinkModifier, LINK_MENU_CONFIG } from './components/dialogs/ContextLinkConfig'
import { NODE_MENU_CONFIG } from './components/dialogs/ContextNodeConfig'
import { createNodeModifier } from './components/dialogs/NodeActions'
import { Class_ApplicationData } from './types/ApplicationData'
/*************************************************************************************************/
export const DefaultOpenSankeyApp = <ChakraProvider theme={opensankey_theme}>
  <OpenSankeyApp

    //@ts-expect-error xxx
    initializeApplicationData={()=>new Class_ApplicationData(window.sankey?.publish ?? false)} // Data, displayed data, default data

    // Ref to some key ui element in the application
    initializeAdditionalMenus={initializeAdditionalMenus}

    // Submenus to add in the application
    moduleDialogs={moduleDialogs}

    // Welcome modal
    ModalWelcome={ModalWelcomeBuilder}

    // BackEnd
    createZDDModifier={(app_data) => createZDDModifier(app_data)}
    ZDD_MENU_CONFIG={ZDD_MENU_CONFIG}
    createLinkModifier={(app_data) => createLinkModifier(app_data)}
    LINK_MENU_CONFIG={LINK_MENU_CONFIG}
    NODE_MENU_CONFIG={NODE_MENU_CONFIG}
    createNodeModifier={(app_data) => createNodeModifier(app_data)}
  />
</ChakraProvider>



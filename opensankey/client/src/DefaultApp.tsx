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

import React, { useEffect, useState } from 'react'
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
import { useTranslation } from 'react-i18next'
import { INPUT_ATTRIBUTES_CONFIG, OUTPUT_ATTRIBUTES_CONFIG } from './components/dialogs/PersistenceProcessDialogConfigs'


export const DefaultOpenSankeyApp = () => {
  const [dataApp, setDataApp] = useState<Class_ApplicationData | null>(null)
  const translation = useTranslation('translation', { useSuspense: false })
  useEffect(() => {
    const initializeApp = async () => {
      const newDataApp = new Class_ApplicationData(false)
      newDataApp.t = translation.t
      newDataApp.i18n = translation.i18n
      setDataApp(newDataApp)
    }

    initializeApp()
  }, [])

  // Rendre SankeyApp une fois que tout est chargé
  return <ChakraProvider theme={opensankey_theme}>
    <OpenSankeyApp
      initializeApplicationData={() => {
        document.onkeydown = dataApp!.keyboardEventListener(dataApp!)
        return dataApp!
      }} // Data, displayed data, default data

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
      input_config={INPUT_ATTRIBUTES_CONFIG}
      output_config={OUTPUT_ATTRIBUTES_CONFIG}
    />
  </ChakraProvider>
}


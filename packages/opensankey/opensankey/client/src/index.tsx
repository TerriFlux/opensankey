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

import React, { FC, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'

import './traductions/traduction'
import { useTranslation } from 'react-i18next'
import i18next from './traductions/traduction'

import OpenSankeyApp from './App'
import {
  initializeAdditionalMenus,
  moduleDialogs
} from './Modules'
import {
  ModalWelcomeBuilder
} from './components/welcome/ModalWelcome'
import { opensankey_theme } from './css/Theme'
import { createZDDModifier, ZDD_MENU_CONFIG } from './components/dialogs/ContextZDDConfig'
import { createLinkModifier, LINK_MENU_CONFIG } from './components/dialogs/ContextLinkConfig'
import { createNodeModifier } from './components/dialogs/NodeActions'
import { NODE_MENU_CONFIG, STATIC_NODE_MENU_CONFIG } from './components/dialogs/ContextNodeConfig'
import { Class_ApplicationData } from './types/ApplicationData'
import { Type_JSON } from './types/Utils'
import { loadUniversalJSON } from './Persistence/UniversalJSONCompression'
import { INPUT_ATTRIBUTES_CONFIG, OUTPUT_ATTRIBUTES_CONFIG } from './components/dialogs/PersistenceProcessDialogConfigs'

// CONSTANTS =========================================================================================
// Link with React
window.React = React
const browserLang = navigator.language.slice(0, 2)
const supportedLangs = ['fr', 'en', 'es', 'de', 'it']
// Ne forcer la langue du navigateur qu'au premier lancement : si l'utilisateur a déjà choisi une
// langue, le LanguageDetector l'a mise en cache dans localStorage['i18nextLng'] et l'a restaurée à
// l'init. La réécraser ici réinitialisait la langue à chaque rechargement (bug). On respecte donc
// la préférence mémorisée et on ne retombe sur le navigateur que si elle est absente/invalide.
const savedLang = localStorage.getItem('i18nextLng')
if (!savedLang || !supportedLangs.includes(savedLang))
  i18next.changeLanguage(supportedLangs.includes(browserLang) ? browserLang : 'en')

// Application container
const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)
const App: FC = () => {
  const [dataApp, setDataApp] = useState<Class_ApplicationData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const translation = useTranslation('translation', { useSuspense: false })
  useEffect(() => {
    const initializeApp = async () => {
      const newDataApp = new Class_ApplicationData(!!window.sankey?.publish)
      newDataApp.t = translation.t
      newDataApp.i18n = translation.i18n
      // Debug : exposer app_data et sankey en globales en mode dev pour
      // permettre l'inspection via la console DevTools.
      if (newDataApp.has_sankey_dev) {
        (window as unknown as Record<string, unknown>)['app_data'] = newDataApp
        ;(window as unknown as Record<string, unknown>)['sankey_debug'] = newDataApp.drawing_area.sankey
      }
      const opts = newDataApp.publish_options
      if (opts.diagram) {
        setIsLoading(true)

        newDataApp.sendWaitingToast(() => {
          console.log('Chargement du diagramme en cours...')
        })

        try {
          if (typeof opts.diagram === 'string') {
            newDataApp.file_name = opts.diagram
            const data = await loadUniversalJSON(opts.diagram)
            newDataApp.fromJSON(data as Type_JSON)
            newDataApp.file_name = opts.diagram
          } else {
            // Objet JSON inline (use case embed HTML one-file)
            newDataApp.fromJSON(opts.diagram as unknown as Type_JSON)
          }

          if (opts.diagram_layout) {
            const layout_data = await loadUniversalJSON(opts.diagram_layout)
            newDataApp.updateFromJSON(layout_data as Type_JSON)
          }

          setDataApp(newDataApp)
        } catch (error) {
          console.error('Erreur lors du chargement du JSON:', error)
          // Gérer l'erreur si nécessaire
          setDataApp(newDataApp) // Ou gérer différemment selon vos besoins
        } finally {
          setIsLoading(false)
        }
      } else {
        // Pas de diagramme à charger, initialiser directement
        setDataApp(newDataApp)
      }
    }

    initializeApp()
  }, [])

  if (isLoading || !dataApp) {
    return (
      <>
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Chargement des données en cours...</p>
          </div>
        </div>
      </>
    )
  }

  // Rendre SankeyApp une fois que tout est chargé
  return   <ChakraProvider theme={opensankey_theme}>
    <OpenSankeyApp
      initializeApplicationData={()=>{
        document.onkeydown = dataApp!.keyboardEventListener(dataApp!)
        return dataApp
      }} // Data, displayed data, default data

      // Ref to some key ui element in the application
      initializeAdditionalMenus={initializeAdditionalMenus}

      // Submenus to add in the application
      moduleDialogs={moduleDialogs}

      // Welcome modal
      ModalWelcome={ModalWelcomeBuilder}

      createZDDModifier={createZDDModifier}
      ZDD_MENU_CONFIG={ZDD_MENU_CONFIG}
      createLinkModifier={createLinkModifier}
      LINK_MENU_CONFIG={LINK_MENU_CONFIG}
      NODE_MENU_CONFIG={dataApp.is_editable ? NODE_MENU_CONFIG : STATIC_NODE_MENU_CONFIG}
      createNodeModifier={(app_data) => createNodeModifier(app_data)}
      input_config={INPUT_ATTRIBUTES_CONFIG}
      output_config={OUTPUT_ATTRIBUTES_CONFIG}
    />
  </ChakraProvider>
}
const renderPage = () => {
  root.render(<App />)
}

renderPage()
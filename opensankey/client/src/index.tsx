// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// CSS ==============================================================================================

import './css/main.css'

// External imports =================================================================================

import React from 'react'
import { createRoot } from 'react-dom/client'

// Local imports ====================================================================================

import './traduction'
import SankeyApp from './SankeyApp'
import {
  initializeApplicationData,
  initializeReinitialization,
  initializeAdditionalMenus,
  moduleDialogs,
  initializeMenuConfiguration,
  initializeDiagrammSelector
} from './OSModule'
import {
  ClickSaveDiagram
} from './dialogs/SankeyPersistence'
import {
  ModalWelcomeBuilder
} from './welcome/ModalWelcome'
import { ChakraProvider } from '@chakra-ui/react'
import { opensankey_theme } from './chakra/Theme'

// CONSTANTS =========================================================================================

// Link with React
window.React = React

// Application container
const container=document.getElementById('react-container') as Element | DocumentFragment
const root=createRoot(container)

// RENDERING ==========================================================================================
root.render(
  <ChakraProvider theme={opensankey_theme}>
    <SankeyApp
      initializeReinitialization={initializeReinitialization}

      //- Data
      initializeApplicationData={initializeApplicationData} // Data, displayed data, default data

      //- UI
      initializeMenuConfiguration={initializeMenuConfiguration} // Function to create the configuration menu

      // Ref to some key ui element in the application
      initializeAdditionalMenus={initializeAdditionalMenus}

      // Input data used for updateLayout
      // (OS only use data from imported file
      // but OSP can use its view as imported data
      // )
      initializeDiagrammSelector={initializeDiagrammSelector}

      // Submenus to add in the application
      moduleDialogs={moduleDialogs}

      // Welcome modal
      ModalWelcome={ModalWelcomeBuilder}

      // BackEnd
      ClickSaveDiagram={ClickSaveDiagram}
    />
  </ChakraProvider>
)


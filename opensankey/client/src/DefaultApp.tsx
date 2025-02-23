import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { opensankey_theme } from './chakra/Theme'
import { initializeAdditionalMenus, initializeApplicationData, initializeDiagrammSelector, initializeMenuConfiguration, initializeReinitialization, moduleDialogs } from './Modules'
import { ClickSaveDiagram } from './components/dialogs/SankeyPersistence'
import { ModalWelcomeBuilder } from './components/welcome/ModalWelcome'
import OpenSankeyApp from './App'

/*************************************************************************************************/
export const DefaultOpenSankeyApp = <ChakraProvider theme={opensankey_theme}>
  <OpenSankeyApp
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



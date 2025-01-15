// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports =================================================================================

import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'

// Local imports ====================================================================================

import {
  initializeApplicationDataOSP,
  initializeReinitializationOSP,
  initializeAdditionalMenusOSP,
  initializeDiagrammSelectorOSP,
  moduleDialogsOSP,
} from './ModulesOSP'
import { ModalWelcomeBuilderOSP } from './components/welcome/ModalWelcomeOSP'
import { ThemeOSP } from './chakra/ThemeOSP'

// OpenSankey imports ===============================================================================

import OpenSankeyApp from './deps/OpenSankey/App'
import {
  initializeMenuConfiguration
} from './deps/OpenSankey/Modules'
import { ClickSaveDiagram } from './deps/OpenSankey/components/dialogs/SankeyPersistence'

// OpenSankeyApp for OpenSankey+ ========================================================================

export const OpenSankeyPlusApp = <ChakraProvider theme={ThemeOSP}>
  <OpenSankeyApp
    initializeReinitialization={initializeReinitializationOSP}
    initializeApplicationData={initializeApplicationDataOSP}
    initializeMenuConfiguration={initializeMenuConfiguration}
    initializeAdditionalMenus={initializeAdditionalMenusOSP}
    initializeDiagrammSelector={initializeDiagrammSelectorOSP}
    moduleDialogs={moduleDialogsOSP}
    ModalWelcome={ModalWelcomeBuilderOSP}
    ClickSaveDiagram={
      (new_data) => { ClickSaveDiagram(new_data) }
    }
  />
</ChakraProvider>
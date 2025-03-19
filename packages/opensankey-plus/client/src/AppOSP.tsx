// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux
// ==================================================================================================

// External imports =================================================================================

import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'

// Local imports ====================================================================================

import {
  initializeApplicationDataOSP,
  initializeAdditionalMenusOSP,
  initializeDiagrammSelectorOSP,
  moduleDialogsOSP,
} from './ModulesOSP'
import { ModalWelcomeBuilderOSP } from './components/welcome/ModalWelcomeOSP'
import { ThemeOSP } from './chakra/ThemeOSP'

// OpenSankey imports ===============================================================================

import OpenSankeyApp from './deps/OpenSankey/App'
import { ClickSaveDiagram } from './deps/OpenSankey/components/dialogs/SankeyPersistence'

// OpenSankeyApp for OpenSankey+ ========================================================================

export const OpenSankeyPlusApp = <ChakraProvider theme={ThemeOSP}>
  <OpenSankeyApp
    initializeApplicationData={initializeApplicationDataOSP}
    initializeAdditionalMenus={initializeAdditionalMenusOSP}
    initializeDiagrammSelector={initializeDiagrammSelectorOSP}
    moduleDialogs={moduleDialogsOSP}
    ModalWelcome={ModalWelcomeBuilderOSP}
    ClickSaveDiagram={
      (new_data) => { ClickSaveDiagram(new_data) }
    }
  />
</ChakraProvider>
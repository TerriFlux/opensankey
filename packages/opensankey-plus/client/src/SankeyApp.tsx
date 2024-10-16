// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports =================================================================================

import React from 'react'

// Local imports ====================================================================================

import {
  initializeApplicationDataOSP,
  initializeReinitializationOSP,
  initializeAdditionalMenusOSP,
  initializeDiagrammSelectorOSP,
  moduleDialogsOSP,
} from './OSPModule'
import { ModalWelcomeBuilderOSP } from './welcome/ModalWelcomeOSP'

// OpenSankey imports ===============================================================================

import SankeyApp from './deps/OpenSankey/SankeyApp'
import {
  initializeMenuConfiguration
} from './deps/OpenSankey/OSModule'
import { ClickSaveDiagram } from './deps/OpenSankey/dialogs/SankeyPersistence'
import { ChakraProvider } from '@chakra-ui/react'
import { Theme_SankeyPlus } from './chakra/Theme'

// SankeyApp for OpenSankey+ ========================================================================


export const SankeyAppOSP = <ChakraProvider theme={Theme_SankeyPlus}>
  <SankeyApp
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
  /></ChakraProvider>
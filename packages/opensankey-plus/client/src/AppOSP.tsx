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
  moduleDialogsOSP,
} from './ModulesOSP'
import { ModalWelcomeBuilderOSP } from './components/ModalWelcomeOSP'
import { ThemeOSP } from './css/ThemeOSP'

// OpenSankey imports ===============================================================================

import OpenSankeyApp from './deps/OpenSankey/App'
import { ClickSaveDiagram } from './deps/OpenSankey/Persistence/SankeyPersistence'
import { createZDDModifierPlus, LINK_MENU_CONFIG_PLUS, ZDD_MENU_CONFIG_PLUS } from './components/ContextMenuConfigs'
import { createLinkModifier } from './deps/OpenSankey/components/dialogs/ContextLinkConfig'

// OpenSankeyApp for OpenSankey+ ========================================================================

export const OpenSankeyPlusApp = <ChakraProvider theme={ThemeOSP}>
  <OpenSankeyApp
    initializeApplicationData={initializeApplicationDataOSP}
    initializeAdditionalMenus={initializeAdditionalMenusOSP}
    moduleDialogs={moduleDialogsOSP}
    ModalWelcome={ModalWelcomeBuilderOSP}
    ClickSaveDiagram={
      (new_data) => { ClickSaveDiagram(new_data) }
    }
    //@ts-expect-error xxx
    createZDDModifier={createZDDModifierPlus}
    ZDD_MENU_CONFIG={ZDD_MENU_CONFIG_PLUS()}
    //@ts-expect-error xxx
    createLinkModifier={createLinkModifier}
    LINK_MENU_CONFIG={LINK_MENU_CONFIG_PLUS()}
  />
</ChakraProvider>
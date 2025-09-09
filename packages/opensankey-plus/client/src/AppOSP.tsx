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

import { initializeApplicationDataOSP, initializeAdditionalMenusOSP, moduleDialogsOSP, } from './ModulesOSP'
import { ModalWelcomeBuilderOSP } from './components/ModalWelcomeOSP'

import OpenSankeyApp from './deps/OpenSankey/App'
import { createLinkMenuConfigPlus, createNodeMenuConfigPlus, createZDDMenuConfigPlus, createZDDModifierPlus, } from './components/ContextMenuConfigs'
import { createLinkModifier } from './deps/OpenSankey/components/dialogs/ContextLinkConfig'
import { opensankey_theme } from './deps/OpenSankey/css/Theme'

// OpenSankeyApp for OpenSankey+ ========================================================================

export const OpenSankeyPlusApp = <ChakraProvider theme={opensankey_theme}>
  <OpenSankeyApp
    initializeApplicationData={initializeApplicationDataOSP}
    initializeAdditionalMenus={initializeAdditionalMenusOSP}
    moduleDialogs={moduleDialogsOSP}
    ModalWelcome={ModalWelcomeBuilderOSP}
    //@ts-expect-error xxx
    createZDDModifier={(app_data) => createZDDModifierPlus(app_data)}
    ZDD_MENU_CONFIG={createZDDMenuConfigPlus()}
    createLinkModifier={(app_data) => createLinkModifier(app_data)}
    LINK_MENU_CONFIG={createLinkMenuConfigPlus()}
    NODE_MENU_CONFIG={createNodeMenuConfigPlus()}
    //@ts-expect-error xxx
    createNodeModifier={(app_data) => createNodeModifier(app_data as Class_ApplicationData)}
  />
</ChakraProvider>
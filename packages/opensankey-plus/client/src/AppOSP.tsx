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

import { initializeAdditionalMenusOSP, moduleDialogsOSP, } from './ModulesOSP'
import { ModalWelcomeBuilderOSP } from './components/ModalWelcomeOSP'

import OpenSankeyApp from 'open-sankey/src/App'
import { createLinkMenuConfigPlus, createNodeMenuConfigPlus, createZDDMenuConfigPlus, createZDDModifierPlus, } from './components/ContextMenuConfigs'
import { createLinkModifier } from 'open-sankey/src/components/dialogs/ContextLinkConfig'
import { opensankey_theme } from 'open-sankey/src/css/Theme'
import { Class_ApplicationDataOSP } from './types/ApplicationDataOSP'
import { OSP_INPUT_ATTRIBUTES_CONFIG, OSP_OUTPUT_ATTRIBUTES_CONFIG } from './components/UniversalConverterDialogConfig'

// OpenSankeyApp for OpenSankey+ ========================================================================

export const OpenSankeyPlusApp = <ChakraProvider theme={opensankey_theme}>
  <OpenSankeyApp
    //@ts-expect-error xxx
    initializeApplicationData={() => {
      const app_data = new Class_ApplicationDataOSP(!!window.sankey?.publish)
      // Link keyboard listener with app key down detection
      document.onkeydown = app_data.keyboardEventListener(app_data)      
    }}
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
    input_config={OSP_INPUT_ATTRIBUTES_CONFIG}
    output_config={OSP_OUTPUT_ATTRIBUTES_CONFIG}
  />
</ChakraProvider>
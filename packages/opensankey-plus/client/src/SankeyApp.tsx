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
  ModuleDialogsOSP,
} from './OSPModule'
import type { Type_GenericApplicationDataOSP } from './types/TypesOSP'


// OpenSankey imports ===============================================================================

import SankeyApp from './deps/OpenSankey/SankeyApp'
import {
  initializeAdditionalMenus,
  initializeMenuConfiguration,
  moduleDialogs
} from './deps/OpenSankey/OSModule'
import { OpenSankeyDiagramSelector } from './deps/OpenSankey/dialogs/SankeyMenuDialogs'
import { ClickSaveDiagram } from './deps/OpenSankey/dialogs/SankeyPersistence'

// SankeyApp for OpenSankey+ ========================================================================

export const SankeyAppOSP = <SankeyApp
  initializeReinitialization={initializeReinitializationOSP}
  initializeApplicationData={initializeApplicationDataOSP}
  initializeMenuConfiguration={initializeMenuConfiguration}
  initializeAdditionalMenus={
    (
      additionalMenus,
      new_data
    ) => {
      if (new_data.is_static) {
        return
      }
      initializeAdditionalMenus(
        additionalMenus,
        new_data
      )
      initializeAdditionalMenusOSP(
        additionalMenus,
        new_data
      )
    }
  }
  // Input data used for updateLayout
  // (OS only use data from imported file
  // but OSP can use its view as imported data
  // )
  initializeDiagrammSelector={(_new_data) => {
    // TODO a implementer ou non ?
    // const plus_app_data=applicationData as unknown as OSPApplicationDataType
    // return diagramSelectorOSP(
    //   plus_app_data
    // )
    return OpenSankeyDiagramSelector
  }}
  moduleDialogs={
    (
      new_data,
      additional_menus,
      menu_configuration_nodes_attributes,
      processFunctions
    ) => {
      return [
        ...moduleDialogs(
          new_data,
          additional_menus,
          menu_configuration_nodes_attributes,
          processFunctions
        ),
        ...ModuleDialogsOSP(
          new_data as Type_GenericApplicationDataOSP
        )
      ]
    }
  }
  ClickSaveDiagram={
    (new_data) => { ClickSaveDiagram(new_data) }
  }
/>
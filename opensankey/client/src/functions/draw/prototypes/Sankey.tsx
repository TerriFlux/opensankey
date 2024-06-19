// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import local types
import {
  Class_Sankey
} from '../../../types/Sankey'
import {
  Class_NodeElement
} from '../../../types/Node'
import { Class_MenuConfig } from '../../../types/MenuConfig'

export type FType_AddNewNodeToSankey = (
    sankey: Class_Sankey,
    menu_config: Class_MenuConfig,
    id: string,
    name: string
) => Class_NodeElement
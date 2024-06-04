// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Import local types
import {
    Class_Sankey
} from "../../../types/Sankey";
import {
    Class_Node
} from "../../../types/Node";

export type FType_AddNewNodeToSankey = (
    sankey: Class_Sankey,
    id: string,
    name: string
) => Class_Node
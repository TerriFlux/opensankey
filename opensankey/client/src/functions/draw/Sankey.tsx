// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Add local types
import {
  Class_Node
} from "../../types/Node"
import {
  FType_AddNewNodeToSankey
} from "./prototypes/Sankey"


/**
 * Create new node for sankey
 * @param {*} sankey
 * @param {*} id
 * @param {*} name
 * @return {*}
 */
export const addNewNodeToSankey: FType_AddNewNodeToSankey = (
  sankey,
  id,
  name
) => {
  const node = new Class_Node(id, name, sankey.drawing_area)
  sankey.addNode(node)
  return node
}
// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import { FType_OpenRemoteUIElement } from './prototypes/Menus'

/**
 * Open a given element
 *
 * @type {*}
 * */
export const openRemoteUIElement: FType_OpenRemoteUIElement = (
  element
) => {
  if ( d3.select(element.current).attr('aria-expanded') === 'false' )
  {
    element?.current?.click()
  }
}
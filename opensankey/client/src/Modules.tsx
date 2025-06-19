// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/*************************************************************************************************/

import {
  FType_InitializeAdditionalMenus,
  FType_InitializeApplicationData,
  FType_ModuleDialogs,
} from './types/FunctionTypes'
import {
  Class_ApplicationData} from './types/Types'

import { FType_InitializeDiagrammSelector } from './components/dialogs/types/SankeyMenuDialogsTypes'
import { OpenSankeyDiagramSelector } from './components/dialogs/SankeyMenuDialogs'
import { checkForUrlToJSON } from './types/Utils'


declare const window: Window &
  typeof globalThis & {
    sankey: {
      publish: boolean
    }
  }

/**
 * Set up data with initial value as Type_JSON
 *
 * @param {*} initial_data
 * @return {*}
 */
export const initializeApplicationData: FType_InitializeApplicationData = (
  initial_data
) => {
  console.log('initializeApplicationData')
  // Set openSankey
  const application_data = new Class_ApplicationData(!!window.sankey?.publish)

  const url_info = checkForUrlToJSON()
  if (url_info) {
    application_data.readUrlJSON(url_info)
  } else if (initial_data !== undefined) {
    application_data.fromJSON(initial_data)
  }
  return application_data
}


/**
 * Additional menus components.
 * @param {*} additional_menus
 * @param {*} new_data
 */
export const initializeAdditionalMenus: FType_InitializeAdditionalMenus = (
  _additional_menus,
  _new_data
) => {
  //  No menu is added in OS via this function
}

export const initializeDiagrammSelector: FType_InitializeDiagrammSelector = (
  _new_data
) => {
  return OpenSankeyDiagramSelector
}

// Modal Dialogs
export const moduleDialogs: FType_ModuleDialogs = () => { return [] }

/***************************************************************************************/





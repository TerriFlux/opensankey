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

import { Class_ApplicationData } from './types/ApplicationData'
import type { MutableRefObject } from 'react'
import { Type_AdditionalMenus } from './types/MenuConfig'
import { Dispatch, SetStateAction } from 'react'

export type FType_InitializeAdditionalMenus = (
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  new_data: Class_ApplicationData
) => void
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
export type FType_ProcessFunctions = {
  ref_processing: MutableRefObject<boolean>,
  ref_setter_processing: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  failure: MutableRefObject<boolean>,
  not_started: MutableRefObject<boolean>,
  ref_result: MutableRefObject<Dispatch<SetStateAction<string>>>,
  path: MutableRefObject<string>,
  launch: (path: string) => void
}

export type FType_ModuleDialogs = (
  new_data: Class_ApplicationData,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  menu_configuration_nodes_attributes: JSX.Element,
  processFunctions: FType_ProcessFunctions
) => JSX.Element[]

// Modal Dialogs
export const moduleDialogs: FType_ModuleDialogs = () => { return [] }

/***************************************************************************************/





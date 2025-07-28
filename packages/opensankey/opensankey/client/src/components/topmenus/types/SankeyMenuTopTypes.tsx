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

import { MutableRefObject } from 'react'
import {
  IType_DictHookRefSetterShowDialogComponents
} from '../../../types/MenuConfig'
import {
  Type_AdditionalMenus
} from '../../../types/Types'
import {
  FType_SetDiagram
} from './SankeyMenuBannerTypes'
import { Class_ApplicationData } from '../../../types/ApplicationData'

export type FCType_MenuDraggable = {
  dict_hook_ref_setter_show_dialog_components: IType_DictHookRefSetterShowDialogComponents,
  dialog_name: keyof IType_DictHookRefSetterShowDialogComponents,
  content: JSX.Element | JSX.Element[],
  title: string,
  maxW?: string,
  customPos?: {x:number,y:number}
}

export type FCType_OpenSankeySaveButton = {
  new_data: Class_ApplicationData,
}

export type FType_OpenSankeyMenusDictBuilder = (
  new_data: Class_ApplicationData,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  setDiagram: FType_SetDiagram,
) => { [s: string]: JSX.Element | JSX.Element[] }


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

import { Dispatch, MutableRefObject, SetStateAction, FunctionComponent } from 'react'

import {
  Type_AdditionalMenus,
  Type_GenericApplicationData
} from './Types'
import {
  Type_JSON
} from '../types/Utils'
import {
  FType_ClickSaveDiagram,
  FType_RetrieveExcelResults,
  FType_UploadExcelImpl
} from '../Persistence/SankeyPersistenceTypes'
import {
  FType_DiagramSelector,
  FType_InitializeDiagrammSelector
} from '../components/dialogs/types/SankeyMenuDialogsTypes'
import {
  FCType_ModalWelcomeBuilder
} from '../components/welcome/types/ModalWelcome'

// Function components prototypes =================================================================

export type FCType_OpenSankeyApp = {
  initializeApplicationData: FType_InitializeApplicationData,
  initializeAdditionalMenus: FType_InitializeAdditionalMenus,
  initializeDiagrammSelector: FType_InitializeDiagrammSelector,
  moduleDialogs: FType_ModuleDialogs,
  ModalWelcome: FunctionComponent<FCType_ModalWelcomeBuilder>,
  ClickSaveDiagram: FType_ClickSaveDiagram,
}

export type FCType_ExcelModal = {
  new_data: Type_GenericApplicationData,
  uploadExcelImpl: FType_UploadExcelImpl,
  launch: (path: string) => void,
}

export type FCType_SankeyLoad = {
  new_data: Type_GenericApplicationData,
  successAction: () => void,
  processFunctions: FType_ProcessFunctions
}

export type FCType_Menu = {
  new_data: Type_GenericApplicationData,
  diagramSelector: FType_DiagramSelector,
  external_modal: JSX.Element[],
  apply_transformation_additional_elements: JSX.Element[],
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}

export type FCType_MenuTop = {
  new_data: Type_GenericApplicationData,
  additionalMenus: MutableRefObject<Type_AdditionalMenus>,
}

/**
 *
 * @type {{ ref_setter_show_modal_json_saver: any; set_show_save_json: any; sankey_data: any; set_sankey_data: any; ClickSaveDiagram: any; }}
 */
export type FCType_ApplySaveJSONDialog = {
  new_data: Type_GenericApplicationData,
  ClickSaveDiagram: FType_ClickSaveDiagram
}

// Function prototypes =============================================================================

export type FType_InitializeApplicationData = (
  initial_data: Type_JSON | undefined
) => Type_GenericApplicationData

export type FType_InitializeAdditionalMenus = (
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  new_data: Type_GenericApplicationData
) => void


export type FType_ModuleDialogs = (
  new_data: Type_GenericApplicationData,
  additional_menus: MutableRefObject<Type_AdditionalMenus>,
  menu_configuration_nodes_attributes: JSX.Element,
  processFunctions: FType_ProcessFunctions
) => JSX.Element[]

export type FType_ProcessFunctions = {
  ref_processing: MutableRefObject<boolean>,
  ref_setter_processing: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
  failure: MutableRefObject<boolean>,
  not_started: MutableRefObject<boolean>,
  ref_result: MutableRefObject<Dispatch<SetStateAction<string>>>,
  path: MutableRefObject<string>,
  launch: (path: string) => void,
  retrieveExcelResults: FType_RetrieveExcelResults
}
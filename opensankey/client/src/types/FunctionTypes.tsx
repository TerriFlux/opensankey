
import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { CreateToastFnReturn } from '@chakra-ui/react'

import {
  Type_AdditionalMenus,
  Type_GenericApplicationDataOS
} from './TypesOS'
import {
  Type_JSON
} from './Utils'
import {
  textForToastPromiseType
} from './MenuConfig'
import {
  FType_ClickSaveDiagram,
  FType_RetrieveExcelResults,
  FType_UploadExcelImpl
} from '../dialogs/types/SankeyPersistenceTypes'
import {
  FType_OpenSankeyDiagramSelector,
  FType_InitializeDiagrammSelector
} from '../dialogs/types/SankeyMenuDialogsTypes'

// Function components prototypes =================================================================

export type FCType_SankeyApp = {
  initializeApplicationData: FType_InitializeApplicationData,
  initializeMenuConfiguration: FType_InitializeMenuConfiguration,
  initializeReinitialization: FType_InitializeReinitialization,
  initializeAdditionalMenus: FType_InitializeAdditionalMenus,
  initializeDiagrammSelector: FType_InitializeDiagrammSelector,
  moduleDialogs: FType_ModuleDialogs,
  ClickSaveDiagram: FType_ClickSaveDiagram,
}

export type FCType_ExcelModal = {
  new_data: Type_GenericApplicationDataOS,
  uploadExcelImpl: FType_UploadExcelImpl,
  launch: (path: string) => void,
  Reinitialization: () => void,
}

export type FCType_SankeyLoad = {
  new_data: Type_GenericApplicationDataOS,
  successAction: () => void,
  processFunctions: FType_ProcessFunctions
}

export type FCType_Menu = {
  new_data: Type_GenericApplicationDataOS,
  processFunctions: FType_ProcessFunctions,
  reinitialization: () => void,
  diagramSelector: FType_OpenSankeyDiagramSelector,
  configurations_menus: JSX.Element,
  menus: { [s: string]: JSX.Element[] | JSX.Element },
  cardsTemplate: JSX.Element,
  external_modal: JSX.Element[],
  apply_transformation_additional_elements: JSX.Element[],
  additional_nav_item: JSX.Element[],
  formations_menu: object,
  // postProcessLoadExcel: postProcessLoadExcelFuncType,
}

/**
 *
 * @type {{ ref_setter_show_modal_json_saver: any; set_show_save_json: any; sankey_data: any; set_sankey_data: any; ClickSaveDiagram: any; }}
 */
export type FCType_ApplySaveJSONDialog = {
  new_data: Type_GenericApplicationDataOS,
  additional_file_save_json_option: JSX.Element[],
  ClickSaveDiagram: FType_ClickSaveDiagram
}

// Function prototypes =============================================================================

export type FType_InitializeApplicationData = (
  initial_data: Type_JSON | undefined
) => Type_GenericApplicationDataOS

export type FType_LaunchToastConstructor = (
  new_data: Type_GenericApplicationDataOS,
  toast: CreateToastFnReturn,
  intake?: textForToastPromiseType
) => void

export type FType_InitializeReinitialization = (
  new_data: Type_GenericApplicationDataOS
) => (() => void)

export type FType_InitializeAdditionalMenus = (
  additional_menus: Type_AdditionalMenus,
  new_data: Type_GenericApplicationDataOS
) => void

export type FType_InitalizeSelectorDetailNodes = (
  new_data: Type_GenericApplicationDataOS
) => JSX.Element

export type FType_InitializeMenuConfiguration = (
  new_data: Type_GenericApplicationDataOS,
  additional_menus: Type_AdditionalMenus,
  config_link_data: JSX.Element,
  config_link_attr: JSX.Element,
  menu_configuration_nodes_attributes: JSX.Element,
) => JSX.Element

export type FType_ModuleDialogs = (
  new_data: Type_GenericApplicationDataOS,
  additional_menus: Type_AdditionalMenus,
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
import { TFunction } from 'i18next'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, SankeyData, applicationContextType, applicationDrawType, dict_hook_ref_setter_show_dialog_componentsType, applicationDataType } from '../../types/Types'
import { ConvertDataFuncType  } from '../../configmenus/types/SankeyConvertTypes'
import { DefaultSankeyDataFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { updateLayoutFuncType } from '../../draw/types/SankeyDrawLayoutTypes'
import { MutableRefObject } from 'react'

export type OpenSankeyDiagramSelectorFType = (
  applicationData:applicationDataType,
  applicationContext:applicationContextType,
  updateLayout: updateLayoutFuncType, 
  elementToDispose : MutableRefObject<string[]>,

) => JSX.Element

export type initializeDiagrammSelectorFType=(applicationData:applicationDataType)=>OpenSankeyDiagramSelectorFType

/**
 * Define ApplyLayoutDialog
 *
 * @type {{ ref_setter_show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
export type ApplyLayoutDialogTypes = {
  applicationContext:applicationContextType,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  applicationData:applicationDataType,
  applicationDraw:applicationDrawType,
  convert_data:ConvertDataFuncType,
  diagramSelector: OpenSankeyDiagramSelectorFType,
  apply_transformation_additional_elements: JSX.Element[],
  DefaultSankeyData: DefaultSankeyDataFuncType,
  ComponentUpdater:ComponentUpdaterType
}

export type popoverSelectorDetailNodesFType={
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  applicationDraw:applicationDrawType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes
}
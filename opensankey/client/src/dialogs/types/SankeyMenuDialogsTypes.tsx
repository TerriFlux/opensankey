import { TFunction } from 'i18next'
import { ComponentUpdaterType, SankeyData, applicationDrawType, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_application_dataType } from '../../types/Types'
import { ConvertDataFuncType  } from '../../configmenus/types/SankeyConvertTypes'
import { DefaultSankeyDataFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { updateLayoutFuncType } from '../../draw/types/SankeyDrawLayoutTypes'
import { MutableRefObject } from 'react'

export type OpenSankeyDiagramSelectorFType = (
  t: TFunction, 
  convert_data: ConvertDataFuncType,
  sankey_data: SankeyData,
  set_sankey_data: (s:SankeyData)=>void,
  prev_sankey_data: SankeyData,
  set_prev_sankey_data: (s:SankeyData)=>void, 
  updateLayout: updateLayoutFuncType, 
  elementToDispose : MutableRefObject<string[]>,
  DefaultSankeyData: ()=>SankeyData
) => JSX.Element

export type initializeDiagrammSelectorFType=(dict_variable_application_data:dict_variable_application_dataType)=>OpenSankeyDiagramSelectorFType

/**
 * Define ApplyLayoutDialog
 *
 * @type {{ ref_setter_show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
export type ApplyLayoutDialogTypes = {
  t:TFunction,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  dict_variable_application_data:dict_variable_application_dataType,
  applicationDraw:applicationDrawType,
  convert_data:ConvertDataFuncType,
  diagramSelector: OpenSankeyDiagramSelectorFType,
  apply_transformation_additional_elements: JSX.Element[],
  DefaultSankeyData: DefaultSankeyDataFuncType,
  ComponentUpdater:ComponentUpdaterType
}
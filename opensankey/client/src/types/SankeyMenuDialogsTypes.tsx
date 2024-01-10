import { TFunction } from 'i18next'
import { SankeyData, dict_hook_ref_setter_show_dialog_componentsType } from './Types'
import { ConvertDataFuncType  } from './SankeyConvertTypes'
import { DefaultSankeyDataFuncType, updateLayoutFuncType } from './SankeyUtilsTypes'
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


/**
 * Define ApplyLayoutDialog
 *
 * @type {{ ref_setter_show_apply_layout: any; set_show_apply_layout: any; sankey_data: any; set_sankey_data: any; }}
 */
export type ApplyLayoutDialogTypes = {
  t:TFunction,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  sankey_data : SankeyData,
  set_sankey_data : (_:SankeyData)=>void,
  updateLayout:updateLayoutFuncType,
  convert_data:ConvertDataFuncType,
  diagramSelector: OpenSankeyDiagramSelectorFType,
  elementToDispose:MutableRefObject<string[]>,
  apply_transformation_additional_elements: JSX.Element[],
  DefaultSankeyData: DefaultSankeyDataFuncType,
}
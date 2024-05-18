import { TFunction } from 'i18next'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, SankeyData, SankeyNode, applicationContextType, applicationDrawType, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'
import { ConvertDataFuncType } from './SankeyConvertTypes'
import { DefaultSankeyDataFuncType, GetSankeyMinWidthAndHeightFuncType } from './SankeyUtilsTypes'
import { MutableRefObject } from 'react'

export type setDiagramFuncType = (
  the_diagram: string, 
  set_data: (d: SankeyData) => void, 
  convert_data: ConvertDataFuncType, 
  DefaultSankeyData:DefaultSankeyDataFuncType
) => void

export type addSimpleLevelDropDownFType = (
  dict_variable_application_data:dict_variable_application_dataType
) => JSX.Element
 
export type col_title_level_filterFType=(
  t:TFunction,
  data:SankeyData
) => JSX.Element


export type addAllDropDownNodeFType = {
  applicationContext:applicationContextType,
  ComponentUpdater:ComponentUpdaterType,
  dict_variable_application_data:dict_variable_application_dataType,
  level:boolean,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  applicationDraw:applicationDrawType

}

/**
 * Fucntion to create the toolbar component, the toolbar is used to edit the sankey quicly
 */
export type ToolbarBuilderFType = {
  applicationContext:applicationContextType,
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  filter:number,
  set_current_filter:(n:number)=>void,
  detail_level: React.ReactElement,
  url_prefix: string,
  first_selected_node:{current:SankeyNode|undefined},
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again: MutableRefObject<boolean>,
  additional_link_visual_filter_content:JSX.Element[],
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  applicationDraw:applicationDrawType
}

export type stretchButtonsFType=(
  dict_variable_application_data : dict_variable_application_dataType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  t:TFunction
)=>JSX.Element

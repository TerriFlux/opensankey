import { TFunction } from 'i18next'
import { SankeyData, SankeyNode, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_elements_selectedType } from './Types'
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
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void
) => JSX.Element
 
export type col_title_level_filterFType=(
  t:TFunction,
  data:SankeyData
) => JSX.Element


export type addAllDropDownNodeFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  level:boolean
) => JSX.Element

export type ToolbarBuilderFType = (
  t:TFunction,
  data: SankeyData,
  set_data: (d:SankeyData)=>void,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  filter:number,
  set_current_filter:(n:number)=>void,
  detail_level: React.ReactElement,
  url_prefix: string,
  first_selected_node:{current:SankeyNode|undefined},
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  setDiagram: setDiagramFuncType,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again: MutableRefObject<boolean>,
  convert_data:ConvertDataFuncType,
  DefaultSankeyData: DefaultSankeyDataFuncType,
) => {[s:string] :JSX.Element}

export type stretchButtonsFType=(
  data:SankeyData,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  t:TFunction
)=>JSX.Element

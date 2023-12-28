import { TFunction } from 'i18next'
import { SankeyData } from './Types'
import { ConvertDataFuncType } from './SankeyConvertTypes'
import { DefaultSankeyDataFuncType, GetSankeyMinWidthAndHeightFuncType } from './SankeyUtilsTypes'

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

export type toolbar_builderFType = (
  t:TFunction,
  data: SankeyData,
  set_data: (d:SankeyData)=>void,
  mode_selection:{current:string},
  user_scale:number,
  set_user_scale:(n:number)=>void,
  filter:number,
  set_current_filter:(n:number)=>void,
  detail_level: React.ReactElement,
  url_prefix: string,
  first_selected_node:object,
  set_first_selected_node:(o:object)=>void,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  setDiagram: setDiagramFuncType,
  set_show_modal_welcome:(b:boolean)=>void,
  set_never_see_again:(b:boolean)=>void,
  convert_data:ConvertDataFuncType,
  maximum_flux:number | null | undefined,
  set_maximum_flux:(n:number)=>void,
  minimum_flux:number | null | undefined,
  set_minimum_flux:(n:number)=>void,
  DefaultSankeyData: DefaultSankeyDataFuncType,
) => {[s:string] :JSX.Element}

export type stretchButtonsFType=(
  data:SankeyData,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  t:TFunction
)=>JSX.Element

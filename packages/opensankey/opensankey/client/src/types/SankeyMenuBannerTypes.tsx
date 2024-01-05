import { TFunction } from 'i18next'
import { SankeyData, SankeyNode, showMenuComponentsType } from './Types'
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

export type ToolbarBuilderFType = (
  t:TFunction,
  data: SankeyData,
  set_data: (d:SankeyData)=>void,
  mode_selection:{current:string},
  userScaleRef : {current:number},
  filter:number,
  set_current_filter:(n:number)=>void,
  detail_level: React.ReactElement,
  url_prefix: string,
  first_selected_node:{current:SankeyNode|undefined},
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  setDiagram: setDiagramFuncType,
  showMenuComponents:showMenuComponentsType,
  set_never_see_again:(b:boolean)=>void,
  convert_data:ConvertDataFuncType,
  maximum_flux:{current:number | null | undefined},
  // set_maximum_flux:(n:number)=>void,
  minimum_flux:number | null | undefined,
  set_minimum_flux:(n:number)=>void,
  DefaultSankeyData: DefaultSankeyDataFuncType,
) => {[s:string] :JSX.Element}

export type stretchButtonsFType=(
  data:SankeyData,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  t:TFunction
)=>JSX.Element

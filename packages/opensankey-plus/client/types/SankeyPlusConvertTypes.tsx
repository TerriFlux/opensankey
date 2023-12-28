import { TFunction } from 'i18next'
import { SankeyPlusData } from './Types'
import { updateLayoutFuncType } from 'open-sankey/src/types/SankeyUtilsTypes'

export type plus_convert_dataFType = (
  data:SankeyPlusData,
  DefaultSankeyData: ()=>SankeyPlusData
)=> void

export type OpenSankeyPlusDiagramSelectorFType = (
  master_data : SankeyPlusData,
  set_master_data : (d:SankeyPlusData)=>void,
  view : string,
  view_selected:string,
  set_view_selected:(s:string)=>void,
  diagramType:string,
  setDiagramType:(s:string)=>void,
  DefaultSankeyData: ()=>SankeyPlusData
) => (
    t: TFunction, 
    convert_data: (s:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>null,
    sankey_data: SankeyPlusData,
    set_sankey_data: (s:SankeyPlusData)=>null,
    prev_sankey_data: SankeyPlusData,
    set_prev_sankey_data: (s:SankeyPlusData)=>void, 
    updateLayout: updateLayoutFuncType, 
    elementToDispose : string[]
  ) => JSX.Element

export type apply_transformation_opensankey_plus_elementsFType = (
  data:SankeyPlusData,
  t:TFunction,
  forceUpdate: boolean,
  setForceUpdate: (b:boolean)=>void,
  elementToDispose: string[]
) => JSX.Element[]

export type plus_sankey_layoutFType=(
  data:SankeyPlusData,
  new_layout:SankeyPlusData,
  mode:string[]
)=> void
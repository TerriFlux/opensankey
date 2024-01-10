import { TFunction } from 'i18next'
import { SankeyPlusData } from './Types'
import { OpenSankeyDiagramSelectorFType } from 'open-sankey/src/types/SankeyMenuDialogsTypes'
import { MutableRefObject } from 'react'

export type plus_convert_dataFType = (
  data:SankeyPlusData,
  DefaultSankeyData: ()=>SankeyPlusData
)=> void

export type SankeyPlusDiagramSelectorFType = (
  master_data : SankeyPlusData|undefined,
  set_master_data : (d:SankeyPlusData|undefined)=>void,
  view : string,
  view_selected:string,
  set_view_selected:(s:string)=>void,
  DefaultSankeyData: ()=>SankeyPlusData
) => OpenSankeyDiagramSelectorFType

export type apply_transformation_opensankey_plus_elementsFType = (
  data:SankeyPlusData,
  t:TFunction,
  elementToDispose: MutableRefObject<string[]>
) => JSX.Element[]

export type plus_sankey_layoutFType=(
  data:SankeyPlusData,
  new_layout:SankeyPlusData,
  mode:string[]
)=> void
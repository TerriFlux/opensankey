import { TFunction } from 'i18next'
import { SankeyPlusData, SankeyPlusLink, SankeyPlusNode } from './Types'

export type SankeyPlusMenuConfigurationNodesAgregationFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  parent_visible:boolean,
  set_parent_visible:(_:boolean)=>void,
  cube_dimension:string,
  set_cube_dimension:(_:string)=>void,
  SankeyPlusDefaultLink : (_:SankeyPlusData)=>SankeyPlusLink
) => JSX.Element


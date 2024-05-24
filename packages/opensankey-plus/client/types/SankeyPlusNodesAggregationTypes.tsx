import { TFunction } from 'i18next'
import { OSPData, OSPLink, OSPNode } from './Types'

export type OSPMenuConfigurationNodesAgregationFType = (
  t:TFunction,
  data:OSPData,
  set_data:(d:OSPData)=>void,
  multi_selected_nodes:{current:OSPNode[]},
  parent_visible:boolean,
  set_parent_visible:(_:boolean)=>void,
  cube_dimension:string,
  set_cube_dimension:(_:string)=>void,
  OSPDefaultLink : (_:OSPData)=>OSPLink
) => JSX.Element


import { GetLinkValueFuncType } from './SankeyUtilsTypes'
import { SankeyData, SankeyNode } from './Types'

export type OpenSankeyDrawNodesLabelFType = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current: SankeyNode[] },
  GetLinkValue:GetLinkValueFuncType
) => void


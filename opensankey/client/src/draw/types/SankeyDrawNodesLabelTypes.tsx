import { TFunction } from 'i18next'
import { GetLinkValueFuncType, LinkTextFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { NodeFunctionTypes, SankeyData, SankeyNode, applicationDataType } from '../../types/Types'

export type OpenSankeyDrawNodesLabelFType = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current: SankeyNode[] },
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void

export type DrawAllNodesLabelFType = (
  applicationData:applicationDataType,
  GetLinkValue:GetLinkValueFuncType,
  LinkText:LinkTextFuncType,
  t:TFunction,
  node_function:NodeFunctionTypes
) => void

export type DrawAddNodesFtype = (
  applicationData:applicationDataType,
  nodes_to_redraw:SankeyNode[],
  GetLinkValue:GetLinkValueFuncType,
  LinkText:LinkTextFuncType,
  t:TFunction,
  node_function:NodeFunctionTypes
) => void
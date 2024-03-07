import { TFunction } from 'i18next'
import { GetLinkValueFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyNode, dict_variable_application_dataType } from '../../types/Types'

export type OpenSankeyDrawNodesLabelFType = (
  data:SankeyData, 
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current: SankeyNode[] },
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void

export type DrawAllNodesLabelFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  multi_selected_nodes:{current: SankeyNode[] },
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void

export type DrawAddNodesFtype = (
  dict_variable_application_data:dict_variable_application_dataType,
  multi_selected_nodes:{current: SankeyNode[] },
  GetLinkValue:GetLinkValueFuncType,
  t:TFunction
) => void
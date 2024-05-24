
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType, applicationStateType } from '../../types/Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'

export type SankeyMenuConfigurationNodesIOFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  applicationState : applicationStateType,
  GetLinkValue:GetLinkValueFuncType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  menu_for_modal: boolean
}



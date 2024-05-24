
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType, dict_variable_elements_selectedType } from '../../types/Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'

export type SankeyMenuConfigurationNodesIOFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  GetLinkValue:GetLinkValueFuncType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  menu_for_modal: boolean
}



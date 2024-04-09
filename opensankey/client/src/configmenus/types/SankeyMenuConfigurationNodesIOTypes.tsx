
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'

export type SankeyMenuConfigurationNodesIOFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  GetLinkValue:GetLinkValueFuncType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  menu_for_modal ? : boolean
) => JSX.Element[]




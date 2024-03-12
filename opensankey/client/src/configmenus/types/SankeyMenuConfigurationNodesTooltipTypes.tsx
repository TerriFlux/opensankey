import { applicationContextType, dict_variable_elements_selectedType } from '../../types/Types'

export type SankeyMenuConfigurationNodesTooltipFType = (
  applicationContext : applicationContextType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  menu_for_modal:boolean
) => JSX.Element

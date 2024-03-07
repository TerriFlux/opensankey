import { applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'
import { package_for_drawLegend_FuncType } from '../../draw/types/SankeyDrawLegendTypes'

export type OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data: dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  extra_background_element:JSX.Element,
  package_for_draw_legend:package_for_drawLegend_FuncType
) => JSX.Element[]


import { MutableRefObject } from 'react'
import { applicationContextType, dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType } from '../../types/Types'

export type OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data: dict_variable_application_dataType,
  contextMenu : contextMenuType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  legend_clicked : MutableRefObject<boolean>,
  extra_background_element:JSX.Element
) => JSX.Element[]


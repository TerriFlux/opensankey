import { MutableRefObject } from 'react'
import { applicationContextType, dict_variable_application_dataType, contextMenuType } from './Types'

export type OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext : applicationContextType,
  dict_variable_application_data: dict_variable_application_dataType,
  contextMenu : contextMenuType,
  userScaleRef : {current:number},
  legend_clicked : MutableRefObject<boolean>,
  extra_background_element:JSX.Element
) => JSX.Element[]


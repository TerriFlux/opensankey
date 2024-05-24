import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType, applicationStateType } from '../../types/Types'

export type MenuConfigurationLinksDataFType = {
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes
}


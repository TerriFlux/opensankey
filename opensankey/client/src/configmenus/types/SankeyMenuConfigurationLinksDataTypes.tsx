import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType, applicationStateType } from '../../types/Types'

export type MenuConfigurationLinksDataFType = {
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  additional_data_element:JSX.Element[],
  ComponentUpdater:ComponentUpdaterType
}


import { 
  ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, 
  applicationDataType, applicationStateType 
} from '../../types/Types'

export type OpenSankeyMenuConfigurationLayoutFType ={
  applicationContext : applicationContextType,
  applicationData: applicationDataType,
  applicationState : applicationStateType,
  extra_background_element:JSX.Element,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  reDrawLegend:()=>void,
  ComponentUpdater:ComponentUpdaterType
}


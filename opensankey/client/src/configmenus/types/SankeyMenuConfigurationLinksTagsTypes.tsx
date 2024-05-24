import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType, applicationStateType } from '../../types/Types'

export type MenuConfigurationLinksTagsFType = {
 applicationData:applicationDataType,
 applicationState:applicationStateType,
 applicationContext:applicationContextType,
 menu_for_modal:boolean,
 ComponentUpdater:ComponentUpdaterType,
 node_function:NodeFunctionTypes,
 link_function:LinkFunctionTypes
}


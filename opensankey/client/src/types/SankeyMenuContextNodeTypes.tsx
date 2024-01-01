import { applicationContextType, applicationDataType, contextMenuType, elementsSelectedType, showMenuComponentsType } from './Types'

export type ContextMenuNodeFType = (
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  elementsSelected : elementsSelectedType,
  contextMenu : contextMenuType,
  showMenuComponents : showMenuComponentsType,
  set_show_agregation: (_:boolean)=>void,
  set_agregation_node:(_:string)=>void,
  set_is_agregation:(_:boolean)=>void,
  set_display_link_opacity:(_:string)=>void,
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[]
) => JSX.Element
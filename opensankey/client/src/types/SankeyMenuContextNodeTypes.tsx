import { 
  agregationType, applicationContextType, applicationDataType, 
  contextMenuType, elementsSelectedType, showMenuComponentsType 
} from './Types'

export type ContextMenuNodeFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  elementsSelected : elementsSelectedType,
  contextMenu : contextMenuType,
  showMenuComponents : showMenuComponentsType,
  agregation: agregationType,
  set_display_link_opacity:(_:string)=>void,
  additional_context_element_menu:JSX.Element[],
  additional_context_element_other:JSX.Element[],
 }
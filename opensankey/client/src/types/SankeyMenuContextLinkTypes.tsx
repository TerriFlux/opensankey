import { applicationContextType, applicationDataType, contextMenuType, elementsSelectedType, showMenuComponentsType } from './Types'

export type ContextMenuLinkFType = (
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  elementsSelected : elementsSelectedType,
  contextMenu : contextMenuType,
  showMenuComponents : showMenuComponentsType
) => JSX.Element
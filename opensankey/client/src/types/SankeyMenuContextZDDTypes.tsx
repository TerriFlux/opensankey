import { showMenuComponentsType, applicationContextType, applicationDataType, contextMenuType, applicationDrawType } from './Types'

export type ContextMenuZddFType = (
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  contextMenu : contextMenuType,
  showMenuComponents : showMenuComponentsType,
  applicationDrawVar:applicationDrawType,
)=> JSX.Element
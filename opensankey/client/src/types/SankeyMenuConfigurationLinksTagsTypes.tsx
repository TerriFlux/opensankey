import { applicationContextType, applicationDataType, elementsSelectedType } from './Types'

export type MenuConfigurationLinksTagsFType = (
 applicationData:applicationDataType,
 elementsSelected:elementsSelectedType,
 applicationContext:applicationContextType,
  tags_group_key:string,
  set_tags_group_key:(_:string)=>void,
)=> JSX.Element


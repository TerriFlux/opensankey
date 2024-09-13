import { OSPApplicationDataType } from './Types'


export type OSPNodeIconFType = {
  applicationData:OSPApplicationDataType,
  menu_for_modal:boolean,
}

export type OSPHyperLinkFType={
  applicationData:OSPApplicationDataType,
  is_activated:boolean,
}

export type ContextNodeIconFType = (
  application_data:OSPApplicationDataType
)=> JSX.Element


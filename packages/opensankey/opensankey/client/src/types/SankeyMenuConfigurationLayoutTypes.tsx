import { MutableRefObject } from 'react'
import { applicationContextType, applicationDataType, contextMenuType } from './Types'

export type OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext : applicationContextType,
  applicationData: applicationDataType,
  contextMenu : contextMenuType,
  userScaleRef : {current:number},
  legend_clicked : MutableRefObject<boolean>,
  extra_background_element:JSX.Element
) => JSX.Element[]


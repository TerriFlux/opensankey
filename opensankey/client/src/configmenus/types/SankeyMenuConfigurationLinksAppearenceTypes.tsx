import { ComponentUpdaterType, SankeyData, applicationContextType, applicationDataType, applicationStateType } from '../../types/Types'

export type MenuConfigurationLinksAppearenceFType = {
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  applicationContext:applicationContextType,
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean,
  ComponentUpdater:ComponentUpdaterType,
}

//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export type handleUpLinkFType = (data:SankeyData,i: string) => void

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export type handleDownLinkFType = (data:SankeyData,i: string) => void
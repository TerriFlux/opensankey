import {  SankeyData, applicationDataType } from '../../types/LegacyType'

export type MenuConfigurationLinksAppearenceFType = {
  applicationData:applicationDataType,
  
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean
}

//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export type handleUpLinkFType = (data:SankeyData,i: string) => void

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export type handleDownLinkFType = (data:SankeyData,i: string) => void
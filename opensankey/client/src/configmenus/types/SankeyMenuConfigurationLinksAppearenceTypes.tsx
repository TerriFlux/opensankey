import { SankeyData } from '../../types/LegacyType'
import { Type_AdditionalMenus, Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FCType_MenuConfigurationLinksAppearence = {
  new_data: Type_GenericApplicationDataOS,
  additionMenus:Type_AdditionalMenus,
  menu_for_style: boolean
}

//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export type handleUpLinkFType = (data: SankeyData, i: string) => void

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export type handleDownLinkFType = (data: SankeyData, i: string) => void
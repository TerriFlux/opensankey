import { ComponentUpdaterType, LinkFunctionTypes, SankeyData, applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType } from '../../types/Types'

export type MenuConfigurationLinksAppearenceFType = (
  dict_variable_application_data:dict_variable_application_dataType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  menu_for_modal? : boolean
) => JSX.Element

//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export type handleUpLinkFType = (data:SankeyData,i: string) => void

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export type handleDownLinkFType = (data:SankeyData,i: string) => void
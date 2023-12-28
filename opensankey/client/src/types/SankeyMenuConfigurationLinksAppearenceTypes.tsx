import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from './Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'

export type SankeyMenuConfigurationLinksAppearenceFType = (
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  t:TFunction,
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean,
  selected_style_link:string,
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
  GetLinkValue:GetLinkValueFuncType,
  menu_for_modal? : boolean
) => JSX.Element

//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export type handleUpLinkFType = (data:SankeyData,i: string) => void

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export type handleDownLinkFType = (data:SankeyData,i: string) => void
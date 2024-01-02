import { TFunction } from 'i18next'
import { SankeyData, applicationContextType, applicationDataType, elementsSelectedType } from 'open-sankey/src/types/Types'

export type SankeyModalStyleNodeFType = (
  t:TFunction,data:SankeyData,
  set_data:(d:SankeyData)=>void,
  showStyle:boolean,
  setShowStyle:(_:boolean)=>void,
  selected_style_node:string,
  set_selected_style_node:(_:string)=>void,
  additional_node_attribute:JSX.Element[],
  set_style_to_apply:(s:string)=>void,
) => JSX.Element

//Modal et fonctions pour l'edition et affectation des style de flux
export type SankeyModalStyleLinkFType = (
  applicationData:applicationDataType,
  applicationContext:applicationContextType,
  elementsSelected:elementsSelectedType,
  showStyleLink:boolean,
  setShowStyleLink:(_:boolean)=>void,
  additional_link_appearence_items:JSX.Element[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void
) => JSX.Element


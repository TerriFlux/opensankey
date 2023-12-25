import { TFunction } from "i18next"
import { SankeyData } from "./Types"


export type SankeyPlusModalStyleNodeFType = (
  t:TFunction,data:SankeyData,
  set_data:(d:SankeyData)=>void,
  showStyle:boolean,
  setShowStyle:React.Dispatch<React.SetStateAction<boolean>>,
  selected_style_node:string,
  set_selected_style_node:React.Dispatch<React.SetStateAction<string>>,
  additional_node_attribute:JSX.Element[],
  set_style_to_apply:(s:string)=>void,
) => JSX.Element

//Modal et fonctions pour l'edition et affectation des style de flux
export type SankeyPlusModalStyleLinkFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  showStyleLink:boolean,
  setShowStyleLink:React.Dispatch<React.SetStateAction<boolean>>,
  selected_style_link:string,
  set_selected_style_link:React.Dispatch<React.SetStateAction<string>>,
  additional_link_appearence_items:JSX.Element[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void
) => JSX.Element


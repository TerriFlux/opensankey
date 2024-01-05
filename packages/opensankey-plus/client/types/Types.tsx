import {
  SankeyData, SankeyLink, SankeyNode, 
  SankeyNodeStyle,SankeyLinkStyle,SankeyLinkAttrLocal,
  dict_hook_ref_setter_show_dialog_componentsType,
  dict_variable_application_dataType,
  dict_variable_elements_selectedType,
  contextMenuType
} from 'open-sankey/src/types/Types'
import { Dispatch, SetStateAction, MutableRefObject } from 'react'

export type DiffType={
    diff:{
      path:string[],
      kind:string,
      rhs:string
    }[]
  }

export type SankeyPlusNodeStyle = SankeyNodeStyle
export interface SankeyPlusLinkStyle extends SankeyLinkStyle{
  gradient:boolean,
}
export interface SankeyPlusNode extends SankeyNode {
  iconName: string,
  iconColor: string,
  iconVisible: boolean,
  iconViewBox?:string,

  has_FO:boolean,
  is_FO_raw:boolean,
  FO_content:string,

  is_image:boolean,
  image_src:string,

  hyperlink:string  
}

export interface SankeyPlusLinkAttrLocal extends SankeyLinkAttrLocal{
  gradient?:boolean,
}

interface SankeyPlusLinkIntern {
  local?:SankeyPlusLinkAttrLocal
}
export type SankeyPlusLink = SankeyLink & SankeyPlusLinkIntern

export type ViewType={
  id: string,
   view_data:  DiffType | Omit<SankeyPlusData, 'view'>,
   nom:string,
   details:string,
   heredited_attr_from_master:string[]
  
  }
export interface SankeyPlusData extends SankeyData {
  icon_catalog: { [x: string]: string | null | undefined},
  nodes:{[x: string]:SankeyPlusNode}
  links:{[x: string]:SankeyPlusLink}
  view:ViewType[],
  current_view:string
  labels:{[x: string]:SankeyPlusLabel}
  style_node:{[x: string]:SankeyPlusNodeStyle},
  style_link:{[x: string]:SankeyPlusLinkStyle},
  background_image:string
  is_catalog:boolean,
}

//export type SankeyPlusData = ISankeyPlusData & SankeyData

export interface SankeyPlusLabel {
    // identification
    idLabel: string,
    title:string,
    content: string,
    opacity:number,
    color:string,
    color_border:string,
    transparent_border:boolean,

    label_width: number,
    label_height: number,

    x: number,
    y: number,

    is_image:boolean,
    image_src:string
}

export interface differenceType{
    kind:string,
    path:string[],
    lhs?:object,
    item:{kind:string,lhs?:object}
  } 

export interface SankeyPlusShowMenuComponentsType extends dict_hook_ref_setter_show_dialog_componentsType {
  show_menu_node_icon : [boolean,(_:boolean)=>void],
  ref_setter_show_modal_import_icons : MutableRefObject<Dispatch<SetStateAction<boolean>>|undefined>,
  show_menu_zdt : [boolean,(_:boolean)=>void],
  ref_setter_show_modal_transparent_view_attr : MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>]| undefined>
  show_toast_new_view:MutableRefObject<Dispatch<SetStateAction<boolean>> | undefined>,
  show_toast_update_view:MutableRefObject<Dispatch<SetStateAction<boolean>> | undefined>,
}

export interface SankeyPlusApplicationDataType extends dict_variable_application_dataType {
  data : SankeyPlusData,
  display_nodes : { [idNode: string]: SankeyPlusNode; }
  display_links : { [idLink: string]: SankeyPlusLink; }
  master_data : SankeyPlusData|undefined,
  set_master_data : (_:SankeyPlusData|undefined)=>void,
  view : string,
  set_view : (_:string)=>void,
  get_default_data : () => SankeyPlusData
}

export interface PlusElementsSelectedType extends dict_variable_elements_selectedType{
  multi_selected_nodes:{current:SankeyPlusNode[]}
  multi_selected_links:{current:SankeyPlusLink[]}
  multi_selected_label:{current:SankeyPlusLabel[]}
}

export interface SankeyPlusContextMenuType extends contextMenuType {
  contextualised_zdt : React.MutableRefObject<React.Dispatch<React.SetStateAction<SankeyPlusLabel|undefined>>|undefined>
}
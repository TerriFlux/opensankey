import {
  SankeyData, SankeyLink, SankeyNode, 
  SankeyNodeStyle,SankeyLinkStyle,SankeyLinkAttrLocal,
  showMenuComponentsType
} from 'open-sankey/src/types/Types'

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

export interface SankeyPlusShowMenuComponentsType extends showMenuComponentsType {
  show_menu_node_icon : [boolean,(_:boolean)=>void],
  show_modal_import_icons : [boolean,(_:boolean)=>void],
  show_menu_zdt : [boolean,(_:boolean)=>void],
  show_modal_transparent_view_attr : [boolean,(_:boolean)=>void]
}
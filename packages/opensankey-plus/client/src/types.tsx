import {SankeyData, SankeyLink, SankeyNode, SankeyLinkValue, SankeyLinkValueDict, TagsGroup,TagsCatalog,SankeyNodeStyle,SankeyLinkStyle,SankeyLinkAttrLocal} from 'open-sankey/src/lib/types'
import {GetLinkValueFuncType, LinkTextFuncType} from 'open-sankey/src/lib/FunctionTypes'
export type {SankeyLinkValue,SankeyLinkValueDict,SankeyData,TagsGroup}

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

export type ViewType={
  id: string,
   view_data:  DiffType | Omit<SankeyPlusData, 'view'>,
   nom:string,
   details:string,
   heredited_attr_from_master:string[]
  
  }

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

export interface SankeyPlusNode extends SankeyNode{
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

export interface SankeyPlusLink extends SankeyLink{
  local?:SankeyPlusLinkAttrLocal

}

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

// Recration du type drawCureType d'opensankey pour qu'il puissr être utilisé avec des variable de type de sankeyplus
export type PlusDrawCurveType = (
    data: SankeyPlusData,
    nodes: { [node_id: string]: SankeyPlusNode },
    links: { [link_id: string]: SankeyPlusLink },
    display_style: { filter: number; filter_label: number; },
    nodeTags: TagsCatalog,
    link: SankeyPlusLink,
    error_msg: { text?: string } | undefined,
    multi_selected_links:{current: SankeyPlusLink[] },
    LinkText:LinkTextFuncType,
    GetSankeyMinWidthAndHeight:(d:SankeyPlusData)=>number[],
    GetLinkValue:GetLinkValueFuncType,
    DrawArrows:plusDrawArrowsType

) => string


// Recration du type drawArrowsType d'opensankey pour qu'il puissr être utilisé avec des variable de type de sankeyplus
export type plusDrawArrowsType = (
    n: SankeyPlusNode,
    selected_tags: { [tag_group: string]: string[] },
    data:SankeyPlusData,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
    GetLinkValue:GetLinkValueFuncType,
    display_style: {filter: number},
  ) => void

export interface differenceType{
    kind:string,
    path:string[],
    lhs?:object,
    item:{kind:string,lhs?:object}
  } 
import {SankeyData,SankeyLink,SankeyNode, SankeyLinkValue,SankeyLinkValueDict,TagsGroup,TagsCatalog,drawArrowsType} from 'open-sankey/src/lib/types'
import { InferProps } from 'prop-types'

export type {SankeyLinkValue,SankeyLinkValueDict,SankeyData,TagsGroup}


export interface SankeyPlusData extends SankeyData { 
    icon_catalog: { [x: string]: string | null | undefined},
    nodes:{[x: string]:SankeyPlusNode}
    links:{[x: string]:SankeyPlusLink}
    view:{id: string,view_data: object,nom:string,details:string}[],
    labels:{[x: string]:SankeyPlusLabel}
    style_node:{[x: string]:SankeyPlusNode},
    style_link:{[x: string]:SankeyPlusLink},

}

export interface SankeyPlusNode extends SankeyNode{
    iconName: string,
    iconColor: string,
    iconRatio: number,
    iconVisible: boolean,

    has_FO:boolean,
    FO_content:string,
}

export interface SankeyPlusLink extends SankeyLink{
  gradient:boolean,

}

export interface SankeyPlusLabel {
    // identification
    idLabel: string,
    name: string,
    transparent:boolean,
    color:string,
    color_border:string,
    transparent_border:boolean,
    position_vert:string,
    position_horiz:string,
    isTextHTML:boolean,
  
    font_size:number,
    font_weight:boolean,
    font_style:boolean,
    font_uppercase:boolean,
  
    label_width: number,
    label_height: number,
   
    x: number,
    y: number,
    x_label: number,
    y_label: number,
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
    link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
    min_width_and_height:(d:SankeyPlusData)=>number[],
    getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
    drawArrows:plusDrawArrowsType

) => string


// Recration du type drawArrowsType d'opensankey pour qu'il puissr être utilisé avec des variable de type de sankeyplus
export type plusDrawArrowsType = (
    n: SankeyPlusNode,
    selected_tags: { [tag_group: string]: string[] },
    data:SankeyPlusData,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
    display_style: {filter: number},
  ) => void

import {SankeyData,SankeyLink,SankeyNode, SankeyLinkValue,SankeyLinkValueDict,TagsGroup} from 'open-sankey/src/lib/types'

export type {SankeyLinkValue,SankeyLinkValueDict,SankeyData,TagsGroup}


export interface SankeyPlusData extends SankeyData { 
    icon_catalog: { [x: string]: string | null | undefined},
    nodes:{[x: string]:SankeyPlusNode}
    view:{id: string,view_data: object,nom:string,details:string}[],
    labels:{[x: string]:SankeyPlusLabel}

}

export interface SankeyPlusNode extends SankeyNode{
    iconName: string,
    iconColor: string,
    iconRatio: number,
    iconVisible: boolean,
}

export interface SankeyPlusLink extends SankeyLink{

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
  
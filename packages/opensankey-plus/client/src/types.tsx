import {SankeyData,SankeyLink,SankeyNode, SankeyLinkValue,SankeyLinkValueDict,TagsGroup} from 'open-sankey/src/lib/types'

export type {SankeyLinkValue,SankeyLinkValueDict,SankeyData,TagsGroup}


export interface SankeyPlusData extends SankeyData { 
    icon_catalog: { [x: string]: string | null | undefined},
    nodes:{[x: string]:SankeyPlusNode}
    view:{id: string,view_data: object,nom:string,details:string}[]

}

export interface SankeyPlusNode extends SankeyNode{
    iconName: string,
    iconColor: string,
    iconRatio: number,
    iconVisible: boolean,
}

export interface SankeyPlusLink extends SankeyLink{

}
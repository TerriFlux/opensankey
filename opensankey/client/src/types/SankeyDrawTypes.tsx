import { GetSankeyMinWidthAndHeightFuncType } from './SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, contextMenuType } from './Types'

export type keyHandlerFType = (
    e: KeyboardEvent,data:SankeyData,
    multi_selected_nodes:{current:SankeyNode[]},multi_selected_links:{current:SankeyLink[]},
    set_data:(d:SankeyData)=>void,
    mode_selection:{current : string},
    closeAllMenu:()=>void
) => void

export type SankeyDrawTypes = {
    contextMenu:contextMenuType,
    data: SankeyData,
    set_data: (_:SankeyData) => void,
    display_nodes : { [node_id: string]: SankeyNode },
    display_links : { [node_id: string]: SankeyLink },
    animation: boolean,
    mode_selection: {current : string},
    show_agregation:boolean, 
    set_show_agregation:(_:boolean)=>void,
    agregation_node:string,
    set_agregation_node:(_:string)=>void,
    is_agregation:boolean,
    set_alt_key_pressed:(_:boolean)=>void,
    GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  }
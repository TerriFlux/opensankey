import { GetSankeyMinWidthAndHeightFuncType } from './SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, agregationType } from './Types'

export type keyHandlerFType = (
    e: KeyboardEvent,data:SankeyData,
    multi_selected_nodes:{current:SankeyNode[]},multi_selected_links:{current:SankeyLink[]},
    set_data:(d:SankeyData)=>void,
    mode_selection:{current : string},
    closeAllMenu:()=>void
) => void

export type SankeyDrawTypes = {
    data: SankeyData,
    set_data: (_:SankeyData) => void,
    display_nodes : { [node_id: string]: SankeyNode },
    display_links : { [node_id: string]: SankeyLink },
    animation: boolean,
    mode_selection: {current : string},
    agregation:agregationType, 
    set_alt_key_pressed:(_:boolean)=>void,
    GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
    pointer_pos:{current: number[]},
    set_show_context_zdd:(_:boolean)=>void
  }
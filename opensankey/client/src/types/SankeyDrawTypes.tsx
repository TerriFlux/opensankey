import { SankeyData, SankeyLink, SankeyNode } from './Types'

export type keyHandlerFType = (
    e: KeyboardEvent,data:SankeyData,
    multi_selected_nodes:{current:SankeyNode[]},multi_selected_links:{current:SankeyLink[]},
    set_data:(d:SankeyData)=>void,
    mode_selection:{current : string},
    closeAllMenu:()=>void
) => void
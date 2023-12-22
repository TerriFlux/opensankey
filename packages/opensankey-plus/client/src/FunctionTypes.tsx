import { SankeyData, SankeyLink, SankeyNode} from 'open-sankey/src/lib/types'
import { LinkTextFuncType, GetLinkValueFuncType} from 'open-sankey/src/lib/FunctionTypes'
import { SankeyPlusLink,SankeyPlusLabel } from './types'

export type SankeyPlusNodeDragEventType=(
    data:SankeyData,
    display_nodes:{ [node_id: string]: SankeyNode },
    display_links:{ [link_id: string]: SankeyLink },
    multi_selected_nodes:{current: SankeyNode[] },
    mode_selection:{current:string},
    alt_key_pressed:boolean,
    set_data:(d:SankeyData)=>void,
    multi_selected_links:{current:SankeyPlusLink[]},
    LinkText: LinkTextFuncType,
    GetLinkValue:GetLinkValueFuncType,
    multi_selected_label:{current:SankeyPlusLabel[]},
    GetSankeyMinWidthAndHeight:(d:SankeyData)=>number[],
) => void
import { MutableRefObject } from 'react'
import { GetSankeyMinWidthAndHeightFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, agregationType, contextMenuType, dict_variable_elements_selectedType } from '../../types/Types'

export type keyHandlerFType = (
    e: KeyboardEvent,data:SankeyData,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    set_data:(d:SankeyData)=>void,
    closeAllMenu:()=>void
) => void

export type SankeyDrawTypes = {
    contextMenu:contextMenuType,
    data: SankeyData,
    set_data: (_:SankeyData) => void,
    display_nodes : { [node_id: string]: SankeyNode },
    display_links : { [node_id: string]: SankeyLink },
    animation: MutableRefObject<boolean>,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    agregation:agregationType, 
    ref_alt_key_pressed:MutableRefObject<boolean>,
    GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  }
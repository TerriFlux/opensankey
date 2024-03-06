import { MutableRefObject } from 'react'
import { GetSankeyMinWidthAndHeightFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { ComponentUpdaterType, LinkFunctionTypes, SankeyData, SankeyLink, SankeyNode, agregationType, applicationContextType, contextMenuType, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_application_dataType, dict_variable_elements_selectedType, uiElementsRefType } from '../../types/Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

export type keyHandlerFType = (
    dict_variable_application_data : dict_variable_application_dataType,
    uiElementsRef : uiElementsRefType,
    contextMenu : contextMenuType,
    e: KeyboardEvent,data:SankeyData,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    set_data:(d:SankeyData)=>void,
    closeAllMenu:()=>void,
    ref_alt_key_pressed:MutableRefObject<boolean>,
    accept_simple_click:{current:boolean},
    link_function:LinkFunctionTypes,
    NodeTooltipsContent:NodeTooltipsContentFType,
    ComponentUpdater:ComponentUpdaterType,
    dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
    applicationContext:applicationContextType,

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
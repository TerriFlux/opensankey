import { MutableRefObject } from 'react'
import { GetSankeyMinWidthAndHeightFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, agregationType, applicationContextType, applicationDrawType, contextMenuType, dict_hook_ref_setter_show_dialog_componentsType, applicationDataType, dict_variable_elements_selectedType, uiElementsRefType } from '../../types/Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

export type keyHandlerFType = (
    applicationData : applicationDataType,
    uiElementsRef : uiElementsRefType,
    contextMenu : contextMenuType,
    e: KeyboardEvent,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    closeAllMenu:()=>void,
    ref_alt_key_pressed:MutableRefObject<boolean>,
    accept_simple_click:{current:boolean},
    link_function:LinkFunctionTypes,
    NodeTooltipsContent:NodeTooltipsContentFType,
    ComponentUpdater:ComponentUpdaterType,
    dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
    applicationContext:applicationContextType,
    node_function:NodeFunctionTypes,
    applicationDraw:applicationDrawType,

) => void

export type SankeyDrawTypes = {
    contextMenu:contextMenuType,
    applicationData : applicationDataType,
    animation: MutableRefObject<boolean>,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    agregation:agregationType, 
    ref_alt_key_pressed:MutableRefObject<boolean>,
    GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  }
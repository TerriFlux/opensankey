import { RefObject } from 'react'
import { GetLinkValueFuncType, LinkTextFuncType } from './SankeyUtilsTypes'
import { dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, uiElementsRefType } from './Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

export type DrawNodesFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  NodeTooltipsContent: NodeTooltipsContentFType,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  accept_simple_click:{current:boolean},
) => void
  

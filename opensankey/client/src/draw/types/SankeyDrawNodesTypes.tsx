import { MutableRefObject} from 'react'
import { GetLinkValueFuncType, LinkTextFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, uiElementsRefType } from '../../types/Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

export type DrawNodesFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  alt_key_pressed:MutableRefObject<boolean>,
  NodeTooltipsContent: NodeTooltipsContentFType,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  accept_simple_click:{current:boolean},
) => void
  

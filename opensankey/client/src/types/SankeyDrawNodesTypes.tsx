import { RefObject } from 'react'
import { GetLinkValueFuncType, LinkTextFuncType } from './SankeyUtilsTypes'
import { applicationDataType, contextMenuType, elementsSelectedType, uiElementsRefType } from './Types'
import { NodeTooltipsContentFType } from './SankeyTooltipTypes'

export type DrawNodesFType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  elementsSelected:elementsSelectedType,
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  NodeTooltipsContent: NodeTooltipsContentFType,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  accept_simple_click:{current:boolean},
) => void
  

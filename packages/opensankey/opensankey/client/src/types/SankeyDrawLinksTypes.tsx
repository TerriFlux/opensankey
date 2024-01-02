import { RefObject } from 'react'
import { drawArrowsType } from './SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkColorFuncType, LinkTextFuncType } from './SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, applicationDataType, contextMenuType, elementsSelectedType, uiElementsRefType } from './Types'

export type LinkStrokeFuncType = (l: SankeyLink, data: SankeyData, GetLinkValue: GetLinkValueFuncType) => string

export type DrawLinksFType = (
  contextMenu:contextMenuType,
  applicationData:applicationDataType,
  uiElementsRef:uiElementsRefType,
  elementsSelected:elementsSelectedType,
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  LinkTooltipsContent:(data: SankeyData, l: SankeyLink, GetLinkValue:GetLinkValueFuncType) => string,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  LinkStroke:LinkStrokeFuncType,
  DrawArrows:drawArrowsType,
  set_display_link_opacity:(s:string)=>void,
  LinkSabotColor:LinkColorFuncType
) => JSX.Element




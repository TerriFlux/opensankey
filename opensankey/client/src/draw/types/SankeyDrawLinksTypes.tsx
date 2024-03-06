import { MutableRefObject } from 'react'
import { DrawArrowsType } from './SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkColorFuncType, LinkTextFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, uiElementsRefType, applicationContextType } from '../../types/Types'
import { TFunction } from 'i18next'

export type LinkStrokeFuncType = (l: SankeyLink, data: SankeyData, GetLinkValue: GetLinkValueFuncType) => string

export type DrawLinksFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  applicationContext:applicationContextType,
  alt_key_pressed:MutableRefObject<boolean>,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  LinkTooltipsContent:(data: SankeyData, l: SankeyLink, GetLinkValue:GetLinkValueFuncType,t:TFunction) => string,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  LinkStroke:LinkStrokeFuncType,
  DrawArrows:DrawArrowsType,
  LinkSabotColor:LinkColorFuncType
) => JSX.Element




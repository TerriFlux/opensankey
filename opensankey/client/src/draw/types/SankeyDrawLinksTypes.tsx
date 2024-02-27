import { MutableRefObject } from 'react'
import { DrawArrowsType } from './SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkColorFuncType, LinkTextFuncType } from '../../configmenus/types/SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode, dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, uiElementsRefType, LinkFunctionTypes } from '../../types/Types'

export type LinkStrokeFuncType = (l: SankeyLink, data: SankeyData, GetLinkValue: GetLinkValueFuncType) => string

export type DrawLinksFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  alt_key_pressed:MutableRefObject<boolean>,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  LinkTooltipsContent:(data: SankeyData, l: SankeyLink, GetLinkValue:GetLinkValueFuncType) => string,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  LinkStroke:LinkStrokeFuncType,
  DrawArrows:DrawArrowsType,
  LinkSabotColor:LinkColorFuncType
) => JSX.Element




export type DrawAllLinksFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  alt_key_pressed:MutableRefObject<boolean>,
  position:'absolute' | 'relative',
  link_functions : LinkFunctionTypes
) => JSX.Element

export type AddDrawLinksEventsFType = (
  contextMenu:contextMenuType,
  dict_variable_application_data:dict_variable_application_dataType,
  uiElementsRef:uiElementsRefType,
  dict_variable_elements_selected:dict_variable_elements_selectedType,
  link_functions : LinkFunctionTypes
) => void


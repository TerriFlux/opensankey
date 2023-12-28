import { drawArrowsType } from './SankeyDrawFunctionTypes'
import { GetLinkValueFuncType, LinkColorFuncType, LinkTextFuncType } from './SankeyUtilsTypes'
import { SankeyData, SankeyLink, SankeyNode } from './Types'

export type LinkStrokeFuncType = (l: SankeyLink, data: SankeyData, GetLinkValue: GetLinkValueFuncType) => string

export type OpenSankeyDrawLinksFType = (
  data:SankeyData,
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  links_accordion_ref:{ current: HTMLDivElement } | null,
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:{current:string},
  accordion_ref:{ current: HTMLDivElement } | null,
  button_ref:{ current: HTMLLabelElement} | null,
  alt_key_pressed:boolean,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  LinkTooltipsContent:(data: SankeyData, l: SankeyLink, GetLinkValue:GetLinkValueFuncType) => string,
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  set_data:(d:SankeyData)=>void,
  set_displayed_input_link_value:(s:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:(o:{[k: string]: string})=>void,
  LinkStroke:LinkStrokeFuncType,
  DrawArrows:drawArrowsType,
  set_display_link_opacity:(s:string)=>void,
  set_contextualised_link:(l:SankeyLink|undefined)=>void,
  pointer_pos:{current:number[]},
  LinkSabotColor:LinkColorFuncType
) => JSX.Element




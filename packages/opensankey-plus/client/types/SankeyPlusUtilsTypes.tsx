import { TFunction } from 'i18next'
import { SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusLinkAttrLocal, SankeyPlusLinkStyle, SankeyPlusNode } from './Types'
import { GetLinkValueFuncType } from 'open-sankey/src/types/FunctionTypes'

export type default_sankey_plus_style_linkFType = () => SankeyPlusLinkStyle

export  type drag_legend_plusFType = (data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]}
) => d3.DragBehavior<SVGGElement, unknown, unknown>

export type import_image_as_svg_BGFType = (
  t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  has_open_sankey_plus:boolean)=> JSX.Element

export type set_svg_bgFType = (
  data:SankeyPlusData
) => void

export type is_all_zdt_attr_same_valueFType = (
  data:SankeyPlusData,
  m_s_zdt:SankeyPlusLabel[],
  k:keyof SankeyPlusLabel
)=> null[] | (string | number | boolean)[]

export type PlusReturnValueLinkFType = (
  data:SankeyPlusData,
  l:SankeyPlusLink,
  k:keyof SankeyPlusLinkAttrLocal | keyof SankeyPlusLinkStyle
) => string | number | boolean

export type PlusAssignLinkValueToCorrectVarFType = (
  l:SankeyPlusLink|SankeyPlusLinkStyle,
  k:keyof SankeyPlusLinkAttrLocal,
  v:boolean|string|number,menu_for_style:boolean
)=>void

export type PlusLinkSabotColorFType = (
  l: SankeyPlusLink,data:SankeyPlusData,
  GetLinkValue:GetLinkValueFuncType
) => string

export type OSPIsAllNodeNotLocalAttrSameValueFType = (
  data:SankeyPlusData,
  m_s_n:SankeyPlusNode[],
  k_list:(keyof SankeyPlusNode)[]
)=> {
  [x: string]: [ValueOf<SankeyPlusNode>, boolean];
}

export type ValueOf<T>=T[keyof T]
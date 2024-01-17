import { TFunction } from 'i18next'
import { SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusLinkAttrLocal, SankeyPlusLinkStyle, SankeyPlusNode } from './Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'

export type DefaultSankeyPlusStyleLinkFType = () => SankeyPlusLinkStyle

export  type DragLegendPlusFType = (data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]}
) => d3.DragBehavior<SVGGElement, unknown, unknown>

export type ImportImageAsSvgBgFType = (
  t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  has_open_sankey_plus:boolean)=> JSX.Element

export type SetSvgBgFType = (
  data:SankeyPlusData
) => void

export type IsAllZdtAttrSameValueFType = (
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

export type ValueOf<T>=T[keyof T]

export type OSPIsAllNodeNotLocalAttrSameValueFType = (
  data:SankeyPlusData,
  m_s_n:SankeyPlusNode[],
  k_list:(keyof SankeyPlusNode)[]
) => { [x: string]: [ValueOf<SankeyPlusNode>|boolean, boolean]; }

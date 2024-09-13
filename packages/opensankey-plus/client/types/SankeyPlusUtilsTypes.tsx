import { OSPApplicationDataType, OSPData, OSPLabel, OSPLink, OSPLinkAttrLocal, OSPLinkStyle, OSPNode } from './Types'

export type DefaultOSPStyleLinkFType = () => OSPLinkStyle

export type ImportImageAsSvgBgFType = {
  applicationData:OSPApplicationDataType,
  has_open_sankey_plus:boolean
}

export type SetSvgBgFType = (
  data:OSPData
) => void

export type IsAllZdtAttrSameValueFType = (
  data:OSPData,
  m_s_zdt:OSPLabel[],
  k:keyof OSPLabel
)=> null[] | (string | number | boolean)[]

export type OSPReturnValueLinkFType = (
  data:OSPData,
  l:OSPLink,
  k:keyof OSPLinkAttrLocal | keyof OSPLinkStyle
) => string | number | boolean

export type OSPAssignLinkValueToCorrectVarFType = (
  l:OSPLink|OSPLinkStyle,
  k:keyof OSPLinkAttrLocal,
  v:boolean|string|number,menu_for_style:boolean
)=>void

export type ValueOf<T>=T[keyof T]

export type OSPIsAllNodeNotLocalAttrSameValueFType = (
  data:OSPData,
  m_s_n:OSPNode[],
  k_list:(keyof OSPNode)[]
) => { [x: string]: [ValueOf<OSPNode>|boolean, boolean]; }




export type clickSaveSVGFType = () => void

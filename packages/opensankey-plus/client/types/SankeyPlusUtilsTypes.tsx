import { TFunction } from 'i18next'
import { OSPApplicationDataType, OSPData, OSPLabel, OSPLink, OSPLinkAttrLocal, OSPLinkStyle, OSPNode } from './Types'
// import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
// import { ComponentUpdaterType } from 'open-sankey/src/types/Types'

export type DefaultOSPStyleLinkFType = () => OSPLinkStyle

// export  type DragLegendOSPFType = (data:OSPData,
//   multi_selected_label:{current:OSPLabel[]},
//   ComponentUpdater:ComponentUpdaterType,
//   resizeCanvas:()=>void,
//   node_function:OSPNodeFuntionType,
//   link_function:OSPLinkFuntionType,
//   applicationData:OSPApplicationDataType
// ) => d3.DragBehavior<SVGGElement, unknown, unknown>

export type ImportImageAsSvgBgFType = {
  t:TFunction,
  data:OSPData,set_data:(d:OSPData)=>void,
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

// export type OSPLinkSabotColorFType = (
//   l: OSPLink,data:OSPData,
//   GetLinkValue:GetLinkValueFuncType
// ) => string

export type ValueOf<T>=T[keyof T]

export type OSPIsAllNodeNotLocalAttrSameValueFType = (
  data:OSPData,
  m_s_n:OSPNode[],
  k_list:(keyof OSPNode)[]
) => { [x: string]: [ValueOf<OSPNode>|boolean, boolean]; }




export type clickSaveSVGFType = () => void
  
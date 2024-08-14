// import { TFunction } from 'i18next'
// import { SankeyData, SankeyLink, SankeyLinkAttrLocal, SankeyLinkStyle, SankeyLinkValue, SankeyLinkValueDict, SankeyNode, SankeyNodeAttrLocal, SankeyNodeStyle, applicationDataType } from '../../types/LegacyType'

import { PlacementWithLogical } from '@chakra-ui/react'
import { ReactNode } from 'react'

// export type CutNameFType = (t: string, n: number) => string

// // Create emptyicon for treefolder component
// export type FileIconFType = () => JSX.Element

// export type FolderIconFType = () => JSX.Element

// export type FolderOpenIconFType = () => JSX.Element

// // Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
// export type TooltipValueSurchargeFType =(k:string,t:TFunction)=> JSX.Element


// export type GetLinkValueFuncType=(data: SankeyData,idLink: string,up?:boolean)=> SankeyLinkValue


// export type FindMaxLinkValueFuncType = (max_node_value: number,value_dict: SankeyLinkValue | SankeyLinkValueDict)=> number

// export type DefaultSankeyDataFuncType = ()=>SankeyData

// export type DefaultNodeFuncType = (data: SankeyData) => SankeyNode

// export type DefaultNodeStyleFuncType = () => SankeyNodeStyle

// export type DefaultNodeSectorStyleFuncStyle = () => SankeyNodeStyle

// export type DefaultNodeProductStyleFuncStyle = () => SankeyNodeStyle

// export type DefaultLinkStyleFuncType = () => SankeyLinkStyle

// export type CreateObjectFuncType = (data: SankeyData, l: string[]) => SankeyLinkValueDict| SankeyLinkValue

// export type DefaultLinkFuncType = (data: SankeyData) => SankeyLink

// export type SetNodeStyleToTypeNode = (data:SankeyData)=> void

// export type SetNodeStyleToTypeNodeFuncType = (data:SankeyData)=>void

// export type GetSankeyMinWidthAndHeightFuncType = (applicationData:applicationDataType)=>number[]

// export type ToPrecisionFuncType = (v: number,t:TFunction,nb_scientific?:number)=> string | number

// export type LinkTextFuncType = (data: SankeyData,d: SankeyLink,GetLinkValue:GetLinkValueFuncType,t:TFunction)=>string

// export type ReturnValueNodeFuncType = (data:SankeyData,n:SankeyNode,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle)=>string | number | boolean

// export type ReturnLocalNodeValueFuncType = (n:SankeyNode,key:keyof SankeyNodeAttrLocal)=>string | number | boolean | null | undefined

// export type AssignNodeStyleAttributeFuncType = (n:SankeyNodeStyle,k:keyof SankeyNodeStyle,v:boolean|string|number)=>void

// export type ReturnValueLinkFuncType = (data:SankeyData,l:SankeyLink,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle)=>string | number | boolean

// export type GetLinkAttributeValueFromStyleFuncType  =(data:SankeyData,n:SankeyLinkStyle,k:keyof SankeyLinkStyle)=> string | number | boolean

// export type ReturnLocalLinkValueFuncType = (n:SankeyLink,key:keyof SankeyLinkAttrLocal)=>string | number | boolean | null | undefined

// export type AssignLinkValueToCorrectVarFuncType = (n:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal,v:boolean|string|number,menu_for_style:boolean)=> void

// export type ReturnCorrectLinkAttributeValueFuncType = (data:SankeyData,n:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle,menu_for_style:boolean)=>string | number | boolean

// export type AssignLinkLocalAttributeFuncType = (n:SankeyLink,k:keyof SankeyLinkAttrLocal,v:boolean|string|number)=> void

// export type AssignLinkStyleAttributeFuncType = (n:SankeyLinkStyle,k:keyof SankeyLinkStyle,v:boolean|string|number)=>void

// export type NodeContextHasAggregateFuncType = (n:SankeyNode,data:SankeyData)=>boolean

// export type  NodeContextHasDesaggregateFuncType = (n: SankeyNode, data: SankeyData) => boolean

export type OSTooltpFuncType={
  delay?:number,
  label:string,
  placement?:PlacementWithLogical
  children:ReactNode
}
import { TFunction } from "i18next"
import { SankeyData, SankeyNode } from "./Types"

export type CutNameFType = (t: string, n: number) => string

// Create emptyicon for treefolder component
export type FileIconFType = () => JSX.Element

export type FolderIconFType = () => JSX.Element

export type FolderOpenIconFType = () => JSX.Element

export type GetRandomIntFType =(max:number) => number

// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
export type TooltipValueSurchargeFType =(k:string,t:TFunction)=> JSX.Element

export type IsAllNodeNotLocalAttrSameValueFType =(data:SankeyData,m_s_n:SankeyNode[],k_list:(keyof SankeyNode)[])=>[boolean,boolean]

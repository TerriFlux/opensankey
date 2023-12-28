import { SankeyData, SankeyLink, SankeyNode } from './Types'

export type compute_initial_colorsFType = (
  data: SankeyData
) => void

export type convert_booleanFType = (
  data : SankeyData
) => void

export type compute_flux_maxFType = (
  data: SankeyData
) => void

export type ConvertDataFuncType = (data: SankeyData, DefaultSankeyData: () => SankeyData) => void

export type complete_sankey_dataFunctType = (
  data: SankeyData, DefaultSankeyData: () => SankeyData, 
  DefaultNode: (data: SankeyData) => SankeyNode, 
  DefaultLink: (data: SankeyData) => SankeyLink
) => void

export type convert_nodesFuncType = (data: SankeyData) => void

export type convert_linksFuncType = (data: SankeyData) => void

export type convert_tagsFuncType = (data: SankeyData) => void
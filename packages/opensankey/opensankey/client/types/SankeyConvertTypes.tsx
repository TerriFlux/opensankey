import { SankeyData } from './Types'

export type compute_initial_colorsFType = (
  data: SankeyData
) => void

export type convert_booleanFType = (
  data : SankeyData
) => void

export type compute_flux_maxFType = (
  data: SankeyData
) =>  number

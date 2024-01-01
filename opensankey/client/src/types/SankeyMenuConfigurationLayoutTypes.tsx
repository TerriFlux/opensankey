import { TFunction } from 'i18next'
import { SankeyData } from './Types'

export type OpenSankeyMenuConfigurationLayoutFType = (
  t:TFunction,
  data: SankeyData,
  set_data:(d:SankeyData)=>void,
  userScaleRef : {current:number},
  legend_position:number[],
  set_legend_position:(n:number[])=>void,
  extra_background_element:JSX.Element
) => JSX.Element[]


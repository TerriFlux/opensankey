import { TFunction } from 'i18next'
import { SankeyData, SankeyNode } from './Types'

export type SankeyMenuConfigurationNodesTooltipFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}
) => JSX.Element

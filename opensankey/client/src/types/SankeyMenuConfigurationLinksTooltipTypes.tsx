import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from './Types'

export type SankeyMenuConfigurationLinksTooltipFType = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction
) => JSX.Element

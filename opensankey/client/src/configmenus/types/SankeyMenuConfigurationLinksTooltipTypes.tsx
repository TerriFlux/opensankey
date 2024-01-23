import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from '../../types/Types'

export type MenuConfigurationLinksTooltipFType = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  menu_for_modal:boolean
) => JSX.Element

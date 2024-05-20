import { TFunction } from 'i18next'
import { ComponentUpdaterType, SankeyLink } from '../../types/Types'

export type MenuConfigurationLinksTooltipFType = {
  ComponentUpdater:ComponentUpdaterType,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  menu_for_modal:boolean
}

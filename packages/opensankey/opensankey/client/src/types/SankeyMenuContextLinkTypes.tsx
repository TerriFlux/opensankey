import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from './Types'

export type ContextMenuLinkFType = (
  contextualised_link:{ current : SankeyLink | undefined },
  set_show_menu_link_data:(b:boolean)=>void,
  set_show_menu_link_appearence:(b:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  tags_selected:{[k: string]: string},
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  pointer_pos:{current:number[]}
) => JSX.Element
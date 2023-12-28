import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from './Types'

export type SankeyMenuConfigurationLinksTagsFType = (
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  tags_group_key:string,
  set_tags_group_key:(_:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:(_:{[k: string]: string})=>void,
  t:TFunction
)=> JSX.Element


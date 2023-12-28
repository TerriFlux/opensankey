import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from './Types'
import { GetLinkValueFuncType } from './SankeyUtilsTypes'



export type OpenSankeyMenuConfigurationLinksFType = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  tags_group_key:string,
  set_tags_group_key:(_:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  additional_data_element:JSX.Element[],
  displayed_input_link_value:string,
  set_displayed_input_link_value:(s:string)=>void,
  additional_link_appearence_items:JSX.Element[],
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
  pre_idSource:string,
  set_pre_idSource:(s:string)=>void,
  pre_idTarget:string,
  set_pre_idTarget:(s:string)=>void,
  GetLinkValue:GetLinkValueFuncType,

) => { [s: string]: JSX.Element; }


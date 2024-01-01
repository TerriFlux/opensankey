import { TFunction } from 'i18next'
import { SankeyData, SankeyLink, SankeyNode } from './Types'
import { RefObject } from 'react'

export type OpenSankeyConfigurationsMenusFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  set_show_nav: (_:boolean)=>void,
  nav_item_active:string,
  set_nav_item_active:(d:string)=>void,
  sub_nav_item_active:string,
  set_sub_nav_item_active:(s:string)=>void,
  nodes_accordion_ref:{ current:HTMLDivElement},
  links_accordion_ref:{ current:HTMLDivElement},
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  set_style_to_apply:(s:string)=>void,
  menu_configuration_layout: JSX.Element[],
  menu_configuration_node_tags:JSX.Element,
  menu_configuration_link_tags:JSX.Element,
  menu_configuration_data_tags:JSX.Element,
  menu_configuration_nodes:{
    [s: string]: JSX.Element;
  },
  menu_configuration_links:{
    [s: string]: JSX.Element;
  },
  menu_configuration_free_labels:JSX.Element,
  token:boolean,
  displayedInputLinkValueRef: RefObject<HTMLInputElement>,
  tags_selected:{[k: string]: string},
  set_tags_selected:( s :{[k: string]: string} )=> void,
  set_display_link_opacity:(s:string)=>void,
  pre_idSource:string,
  pre_idTarget:string
) => JSX.Element[]


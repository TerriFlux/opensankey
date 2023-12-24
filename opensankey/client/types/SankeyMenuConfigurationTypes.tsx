import { TFunction } from "i18next";
import { SankeyData, SankeyLink, SankeyNode, showMenuComponentsType } from "./Types";

export type OpenSankeyConfigurationsMenusFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  nav_item_active:string,
  set_nav_item_active:(d:string)=>void,
  nodes_accordion_ref:{ current:HTMLDivElement},
  links_accordion_ref:{ current:HTMLDivElement},
  multi_selected_nodes:{current: SankeyNode[] },
  multi_selected_links:{current: SankeyLink[] },
  set_style_to_apply:(s:string)=>void,
  showMenuComponents: showMenuComponentsType,
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
  sub_nav_item_active:string,
  set_sub_nav_item_active:(s:string)=>void,
  token:boolean,
  set_displayed_input_link_value:(s:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:( s :{[k: string]: string} )=> void,
  set_display_link_opacity:(s:string)=>void,
  pre_idSource:string,
  pre_idTarget:string
) => JSX.Element[]


// /**
//  * Variable that define the Menu element, it's variable and function
//  *
//  * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
//  */
// const ConfigurationMenuPropTypes = {
//   accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}).isRequired,
//   nav_item_active: PropTypes.string.isRequired,
//   configuration_menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
// }
// /**
//  * Description placeholder
//  *
//  * @typedef {MenuTypes}
//  */
// type ConfigurationMenuTypes = InferProps<typeof ConfigurationMenuPropTypes>


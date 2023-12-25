

// const SankeyMenuConfigurationLinksPropTypes = {
//   t: PropTypes.func.isRequired,
//   data: PropTypes.shape(SankeyDataPropTypes).isRequired,
//   set_data: PropTypes.func.isRequired,
//   multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
//   multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
//   menu_configuration_links: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
//   set_displayed_input_link_value:PropTypes.func.isRequired,
//   tags_selected:PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
//   set_tags_selected:PropTypes.func.isRequired,
//   set_display_link_opacity:PropTypes.func.isRequired,
//   pre_idSource:PropTypes.string.isRequired,
//   pre_idTarget:PropTypes.string.isRequired,
// }

import { TFunction } from "i18next";
import { SankeyData, SankeyLink } from "./Types";
import { GetLinkValueFuncType } from "./FunctionTypes";

// type SankeyMenuConfigurationLinksTypes = InferProps<typeof SankeyMenuConfigurationLinksPropTypes>
export type OpenSankeyMenuConfigurationLinksFType = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  tags_group_key:string,
  set_tags_group_key:React.Dispatch<React.SetStateAction<string>>,
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

) => JSX.Element


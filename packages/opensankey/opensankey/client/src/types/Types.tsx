import PropTypes, { InferProps } from 'prop-types'

export const SankeyNodeAttrLocalTypes ={

  local_aggregation: PropTypes.bool,
  // Parameter of node shape
  shape_visible: PropTypes.bool,
  label_visible: PropTypes.bool,
  node_width: PropTypes.number,
  node_height: PropTypes.number,
  color: PropTypes.string,
  shape: PropTypes.oneOf(['ellipse', 'rect','arrow']),
  node_arrow_angle_factor:PropTypes.number,
  node_arrow_angle_direction:PropTypes.string,
  colorSustainable: PropTypes.bool,


  // Parameter of node label
  font_family: PropTypes.string,
  font_size: PropTypes.number,
  uppercase: PropTypes.bool,
  bold: PropTypes.bool,
  italic: PropTypes.bool,
  label_box_width: PropTypes.number,
  label_color: PropTypes.bool,
  label_vert: PropTypes.string,
  label_horiz: PropTypes.string,
  label_background:PropTypes.bool,

  // Parameter of node value label
  show_value: PropTypes.bool,
  label_vert_valeur: PropTypes.string,
  label_horiz_valeur: PropTypes.string,
  value_font_size: PropTypes.number,

}
export type SankeyNodeAttrLocal = InferProps<typeof SankeyNodeAttrLocalTypes>


// Same as Local node attribute but with required value as now style attributes is the default attributes of node
export const SankeyNodeStyleTypes ={
  idNode: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,

  // Parameter of node shape
  shape_visible: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  node_width: PropTypes.number.isRequired,
  node_height: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  shape: PropTypes.oneOf(['ellipse', 'rect','arrow']).isRequired,
  node_arrow_angle_factor:PropTypes.number.isRequired,
  node_arrow_angle_direction:PropTypes.string.isRequired,
  colorSustainable: PropTypes.bool.isRequired,

  // Parameter of node label
  font_family: PropTypes.string.isRequired,
  font_size: PropTypes.number.isRequired,
  uppercase: PropTypes.bool.isRequired,
  bold: PropTypes.bool.isRequired,
  italic: PropTypes.bool.isRequired,
  label_box_width: PropTypes.number.isRequired,
  label_color: PropTypes.bool.isRequired,
  label_vert: PropTypes.string.isRequired,
  label_horiz: PropTypes.string.isRequired,
  label_background:PropTypes.bool.isRequired,

  // Parameter of node value label
  show_value: PropTypes.bool.isRequired,
  label_vert_valeur: PropTypes.string.isRequired,
  label_horiz_valeur: PropTypes.string.isRequired,
  value_font_size: PropTypes.number.isRequired,
}
export type SankeyNodeStyle = InferProps<typeof SankeyNodeStyleTypes>


export const SankeyNodePropTypes = {
  // identification
  idNode: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,

  //- level attributes
  dimensions: PropTypes.objectOf(
    PropTypes.shape({
      parent_name: PropTypes.string,
      level: PropTypes.number,
    }).isRequired
  ).isRequired,

  local:PropTypes.shape(SankeyNodeAttrLocalTypes),

  colorParameter: PropTypes.string.isRequired,
  colorTag: PropTypes.string.isRequired,

  // geometry
  position: PropTypes.oneOf(['absolute', 'relative']).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  x_label: PropTypes.number,
  y_label: PropTypes.number,

  tooltip_text: PropTypes.string,

  // topology
  inputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  outputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired,
  style:PropTypes.string.isRequired,
}
export type SankeyNode = InferProps<typeof SankeyNodePropTypes>

export const SankeyLinkValueTypes =
{
  value: PropTypes.any,
  display_value: PropTypes.string.isRequired,
  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired,
  // for previous_value, data_value, data_source, data_period, mini, maxi ...
  extension: PropTypes.objectOf(PropTypes.string.isRequired)
}
export type SankeyLinkValue = InferProps<typeof SankeyLinkValueTypes>

export const SankeyLinkValueDictTypes = PropTypes.objectOf(PropTypes.shape(SankeyLinkValueTypes).isRequired).isRequired
export type SankeyLinkValueDict = InferProps<typeof SankeyLinkValueDictTypes>


export const SankeyLinkAttrLocalTypes ={
  // Geometry link
  orientation:PropTypes.string,
  left_horiz_shift: PropTypes.number,
  right_horiz_shift: PropTypes.number,
  vert_shift: PropTypes.number,
  curvature: PropTypes.number,
  curved: PropTypes.bool,
  recycling: PropTypes.bool,
  arrow_size:PropTypes.number,

  // Geometry link labels
  label_position:PropTypes.string,
  orthogonal_label_position:PropTypes.string,
  label_on_path:PropTypes.bool,

  //Attributes link
  arrow:PropTypes.bool,
  color:PropTypes.string,
  opacity:PropTypes.number,
  dashed: PropTypes.bool,
  //Attributes link labels
  label_visible:PropTypes.bool,
  label_font_size:PropTypes.number,
  text_color:PropTypes.string,
  to_precision:PropTypes.bool,
  scientific_precision:PropTypes.number,
  font_family: PropTypes.string,
  label_unit_visible:PropTypes.bool,
  label_unit:PropTypes.string,
  custom_digit:PropTypes.bool,
  nb_digit:PropTypes.number,
}
export type SankeyLinkAttrLocal = InferProps<typeof SankeyLinkAttrLocalTypes>

export const SankeyLinkStyleTypes ={
  idLink:PropTypes.string.isRequired,
  name:PropTypes.string.isRequired,

  // Geometry/appearence
  orientation: PropTypes.string.isRequired,
  arrow: PropTypes.bool.isRequired,
  color: PropTypes.string.isRequired,
  opacity: PropTypes.number.isRequired,
  left_horiz_shift: PropTypes.number.isRequired,
  right_horiz_shift: PropTypes.number.isRequired,
  vert_shift: PropTypes.number.isRequired,
  curvature: PropTypes.number.isRequired,
  curved: PropTypes.bool.isRequired,
  recycling: PropTypes.bool.isRequired,
  arrow_size:PropTypes.number.isRequired,
  dashed: PropTypes.bool.isRequired,
  // Label
  label_position: PropTypes.string.isRequired,
  orthogonal_label_position: PropTypes.string.isRequired,
  label_on_path: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  label_font_size: PropTypes.number.isRequired,
  text_color: PropTypes.string.isRequired,
  to_precision:PropTypes.bool.isRequired,
  scientific_precision:PropTypes.number.isRequired,
  font_family: PropTypes.string.isRequired,
  label_unit_visible:PropTypes.bool.isRequired,
  label_unit:PropTypes.string.isRequired,
  custom_digit:PropTypes.bool.isRequired,
  nb_digit:PropTypes.number.isRequired,
}
export type SankeyLinkStyle = InferProps<typeof SankeyLinkStyleTypes>

export const SankeyLinkPropTypes = {
  // identification
  idLink: PropTypes.string.isRequired,
  idSource: PropTypes.string.isRequired,
  idTarget: PropTypes.string.isRequired,
  colorTag: PropTypes.string.isRequired,

  value: PropTypes.oneOfType([SankeyLinkValueDictTypes, PropTypes.shape(SankeyLinkValueTypes).isRequired]).isRequired,

  tooltip_text: PropTypes.string,

  // geometry
  x_label: PropTypes.number,
  y_label: PropTypes.number,

  //style
  style:PropTypes.string.isRequired,

  local:PropTypes.shape(SankeyLinkAttrLocalTypes)
}

export type SankeyLink = InferProps<typeof SankeyLinkPropTypes>


export const TagsGroupPropTypes = {
  group_name: PropTypes.string.isRequired,
  show_legend: PropTypes.bool.isRequired,
  color_map: PropTypes.string.isRequired,
  tags: PropTypes.objectOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    shape: PropTypes.string,
    color: PropTypes.string,
    selected: PropTypes.bool.isRequired,
  }).isRequired).isRequired,
  banner: PropTypes.string.isRequired,
  activated: PropTypes.bool.isRequired,
  siblings: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
}
export type TagsGroup = InferProps<typeof TagsGroupPropTypes>

export const TagsCatalogPropTypes = PropTypes.objectOf(PropTypes.shape(TagsGroupPropTypes).isRequired).isRequired
export type TagsCatalog = InferProps<typeof TagsCatalogPropTypes>

//-------------------------

export const SankeyDataPropTypes = {
  version: PropTypes.string.isRequired,
  file_name: PropTypes.string,
  couleur_fond_sankey:PropTypes.string.isRequired,
  displayed_node_selector:PropTypes.bool.isRequired,
  displayed_link_selector:PropTypes.bool.isRequired,

  user_scale: PropTypes.number.isRequired,

  maximum_flux: PropTypes.number,
  minimum_flux: PropTypes.number,
  accordeonToShow:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  style_node:PropTypes.objectOf(PropTypes.shape(SankeyNodeStyleTypes).isRequired).isRequired,
  style_link:PropTypes.objectOf(PropTypes.shape(SankeyLinkStyleTypes).isRequired).isRequired,

  show_structure: PropTypes.oneOf(['structure','data','reconciled','free_value','free_interval']).isRequired,
  fit_screen: PropTypes.bool.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  h_space: PropTypes.number.isRequired,
  v_space: PropTypes.number.isRequired,
  left_shift: PropTypes.number.isRequired,
  right_shift: PropTypes.number.isRequired,

  legend_position: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  display_legend_scale:PropTypes.bool.isRequired,
  legend_police:PropTypes.number.isRequired,
  mask_legend:PropTypes.bool.isRequired,
  legend_bg_color:PropTypes.string.isRequired,
  legend_bg_opacity:PropTypes.number.isRequired,
  legend_bg_border:PropTypes.bool.isRequired,

  nodes: PropTypes.objectOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links: PropTypes.objectOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,
  display_style: PropTypes.shape({
    filter: PropTypes.number.isRequired,
    filter_label: PropTypes.number.isRequired,
    null_flux: PropTypes.bool.isRequired,
    font_family: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  }).isRequired,

  linkZIndex:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

  grid_square_size: PropTypes.number.isRequired,
  grid_visible: PropTypes.bool.isRequired,

  nodeTags: TagsCatalogPropTypes,
  dataTags: TagsCatalogPropTypes,
  fluxTags: TagsCatalogPropTypes,
  levelTags:TagsCatalogPropTypes,
  colorMap: PropTypes.string.isRequired,

  legend_width:PropTypes.number.isRequired,
  node_label_separator:PropTypes.string.isRequired
}

export type SankeyData = InferProps<typeof SankeyDataPropTypes>

export interface SankeyMenuState {
  processing: boolean
}

export interface SankeyAppState {
  show_readme: boolean
  show_legend: boolean
  show_entry: boolean

  data: SankeyData
}

export const SankeyDrawCurvePropType={
  curve:PropTypes.func.isRequired
}
export type SankeyDrawCurve = InferProps<typeof SankeyDrawCurvePropType>



export interface treeFolderType{
  id:string
  name:string,
  children?:treeFolderType[],
  checked?:1|0.5|0
}
export interface showMenuComponentsType {
  show_nav : [boolean,(_:boolean)=>void],
  show_menu_node_apparence : [boolean,(_:boolean)=>void],
  show_menu_node_io : [boolean,(_:boolean)=>void],
  show_menu_link_data : [boolean,(_:boolean)=>void],
  show_menu_link_appearence : [boolean,(_:boolean)=>void],
  show_menu_layout : [boolean,(_:boolean)=>void],
  show_modal_welcome : [boolean,(_:boolean)=>void],
  show_modale_tuto : [boolean,(_:boolean)=>void],
  show_modale_support : [boolean,(_:boolean)=>void],
  show_agregation : [boolean,(_:boolean)=>void],
  show_context_zdd : [boolean,(_:boolean)=>void],
  show_excel_dialog : [boolean,(_:boolean)=>void],
  show_save_json : [boolean,(_:boolean)=>void],
  show_apply_layout : [boolean,(_:boolean)=>void],
  ShowPreference : [boolean,(_:boolean)=>void],
  show_modalTemplate : [boolean,(_:boolean)=>void],
  show_welcome : [boolean,(_:boolean)=>void],
  show_load : [boolean,(_:boolean)=>void]
}

export const showMenuComponentsPropTypes = {
  show_nav : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_menu_node_apparence : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_menu_node_io : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_menu_link_data : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_menu_link_appearence : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_menu_layout : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_modal_welcome : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_modale_tuto : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_modale_support : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_agregation : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_context_zdd : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_excel_dialog : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_save_json : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_apply_layout : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  ShowPreference : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_modalTemplate : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_welcome : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired,
  show_load : PropTypes.shape({0 : PropTypes.bool.isRequired, 1 : PropTypes.func.isRequired}).isRequired
}

export const MenuPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  logo: PropTypes.string.isRequired,
  logo_terriflux: PropTypes.string.isRequired,
  logo_width: PropTypes.number,
  app_name: PropTypes.string.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}).isRequired,
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}).isRequired,

  example_menu: PropTypes.element,
  formations_menu: PropTypes.object.isRequired,
  url_prefix: PropTypes.string.isRequired,

  nav_item_active: PropTypes.string.isRequired,

  mode_selection: PropTypes.shape({current:PropTypes.string.isRequired}).isRequired,

  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,

  callback:PropTypes.func.isRequired,

  showMenuComponents: PropTypes.shape(showMenuComponentsPropTypes).isRequired,
  processing : PropTypes.bool.isRequired,
  setProcessing : PropTypes.func.isRequired,
  failure : PropTypes.bool.isRequired,
  setFailure : PropTypes.func.isRequired,
  not_started : PropTypes.bool.isRequired,
  setNotStarted : PropTypes.func.isRequired,
  result : PropTypes.string.isRequired,
  setResult : PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
  launch: PropTypes.func.isRequired,
  configurations_menus: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  menus: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,PropTypes.element.isRequired]).isRequired).isRequired,
  cardsTemplate:PropTypes.element.isRequired,
  external_modal:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  GetSankeyMinWidthAndHeight :PropTypes.func.isRequired,
  Reinitialization:PropTypes.func.isRequired,
  additional_nav_item:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,

  set_contextualised_node:PropTypes.func.isRequired,
  set_contextualised_link:PropTypes.func.isRequired,
  set_tag_contextualised:PropTypes.func.isRequired,
  updateLayout:PropTypes.func.isRequired,
  convert_data:PropTypes.func.isRequired,
  node_hspace:PropTypes.number.isRequired,
  set_node_hspace:PropTypes.func.isRequired,
  node_vspace:PropTypes.number.isRequired,
  set_node_vspace:PropTypes.func.isRequired, 
  elementToDispose:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  apply_transformation_additional_elements: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  DiagramSelector: PropTypes.func.isRequired,
  is_computing:PropTypes.bool.isRequired,
  setIsComputing:PropTypes.func.isRequired,
  set_tags_selected:PropTypes.func.isRequired,
  RetrieveExcelResults:PropTypes.func.isRequired,
  DefaultSankeyData: PropTypes.func.isRequired
}

/**
 * Description placeholder
 *
 * @typedef {MenuTypes}
 */
export type MenuTypes = InferProps<typeof MenuPropTypes>

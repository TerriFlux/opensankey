import PropTypes, { InferProps } from 'prop-types'

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

  // DISPLAY ATTRIBUTES
  // display controls the agregation desagregation process. 
  display: PropTypes.bool.isRequired,
  hide_lone_node:PropTypes.bool.isRequired,
  // node_visible controls the other process in particular tags manipulations
  node_visible: PropTypes.bool.isRequired,
  // shape_visible and label_visible control the visibility of the element of the node
  shape_visible: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,

  node_width: PropTypes.number.isRequired,
  node_height: PropTypes.number.isRequired,

  // iconName: PropTypes.string.isRequired,
  // iconColor: PropTypes.string.isRequired,
  // iconRatio: PropTypes.number.isRequired,
  // iconVisible: PropTypes.bool.isRequired,

  color: PropTypes.string.isRequired,
  colorParameter: PropTypes.string.isRequired,
  colorTag: PropTypes.string.isRequired,
  colorSustainable:PropTypes.bool.isRequired,
  // geometry
  position: PropTypes.oneOf(['absolute', 'relative']).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  x_label: PropTypes.number,
  y_label: PropTypes.number,
  show_value: PropTypes.bool.isRequired,
  
  not_to_scale:PropTypes.bool.isRequired,
  not_to_scale_direction:PropTypes.string.isRequired,

  tooltip_text: PropTypes.string,

  // topology
  inputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  outputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

  // semantic
  shape: PropTypes.oneOf(['ellipse', 'rect']).isRequired,
  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired,
  style:PropTypes.string.isRequired,
  //display
  display_style: PropTypes.shape({
    font_family:PropTypes.string.isRequired,
    font_size: PropTypes.number.isRequired,
    uppercase: PropTypes.bool.isRequired,
    bold: PropTypes.bool.isRequired,
    italic: PropTypes.bool.isRequired,
    //unit: PropTypes.bool.isRequired,
    //filter: PropTypes.number.isRequired,
    //filter_label: PropTypes.number.isRequired,
    //global_curvature: PropTypes.number.isRequired,
    //null_flux: PropTypes.bool.isRequired,
    label_vert: PropTypes.string.isRequired,
    label_horiz: PropTypes.string.isRequired,
    label_vert_valeur: PropTypes.string.isRequired,
    label_horiz_valeur: PropTypes.string.isRequired,
    value_font_size:PropTypes.number.isRequired,
    label_box_width: PropTypes.number.isRequired,
    label_color:PropTypes.bool.isRequired
  }).isRequired,
}
export type SankeyNode = InferProps<typeof SankeyNodePropTypes>

export const SankeyLinkValueTypes =
{
  value: PropTypes.any,
  is_percent:PropTypes.bool.isRequired,
  percent:PropTypes.number.isRequired,
  display_value: PropTypes.string.isRequired,
  // corresponding to tag_favorite. to be used in conjunction with colorTag
  //  const selected_tag = getLinkValue(data,l.idLink).tags[l.colorTag]
  tags: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
  // for previous_value, data_value, data_source, data_period, mini, maxi ...
  extension: PropTypes.objectOf(PropTypes.string.isRequired)
}
export type SankeyLinkValue = InferProps<typeof SankeyLinkValueTypes>

export const SankeyLinkValueDictTypes = PropTypes.objectOf(PropTypes.shape(SankeyLinkValueTypes).isRequired).isRequired
export type SankeyLinkValueDict = InferProps<typeof SankeyLinkValueDictTypes>

export const SankeyLinkPropTypes = {
  // identification
  idLink: PropTypes.string.isRequired,
  idSource: PropTypes.string.isRequired,
  idTarget: PropTypes.string.isRequired,

  // type of link
  recycling: PropTypes.bool.isRequired,
  orientation: PropTypes.string.isRequired,
  arrow: PropTypes.bool.isRequired,

  // display_attribute
  label_position: PropTypes.string.isRequired,
  orthogonal_label_position: PropTypes.string.isRequired,
  label_on_path: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  label_font_size:PropTypes.number.isRequired,
  text_color: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  colorParameter: PropTypes.string.isRequired,
  colorTag: PropTypes.string.isRequired,

  // Ajout
  gradient: PropTypes.bool.isRequired,
  dashed:PropTypes.bool.isRequired,
  to_precision:PropTypes.bool.isRequired,

  value: PropTypes.oneOfType([SankeyLinkValueDictTypes, PropTypes.shape(SankeyLinkValueTypes).isRequired]).isRequired,

  tooltip_text: PropTypes.string,

  // geometry
  x_label: PropTypes.number,
  y_label: PropTypes.number,

  left_horiz_shift: PropTypes.number.isRequired,
  right_horiz_shift: PropTypes.number.isRequired,
  vert_shift: PropTypes.number,

  curvature: PropTypes.number.isRequired,
  curved: PropTypes.bool.isRequired,

  //style
  style:PropTypes.string.isRequired
}

export type SankeyLink = InferProps<typeof SankeyLinkPropTypes>


export const SankeyLabelPropTypes = {
  // identification
  idLabel: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  transparent:PropTypes.bool.isRequired,
  color:PropTypes.string.isRequired,
  color_border:PropTypes.string.isRequired,
  transparent_border:PropTypes.bool.isRequired,
  position_vert:PropTypes.string.isRequired,
  position_horiz:PropTypes.string.isRequired,
  isTextHTML:PropTypes.bool.isRequired,

  font_size:PropTypes.number.isRequired,
  font_weight:PropTypes.bool.isRequired,
  font_style:PropTypes.bool.isRequired,
  font_uppercase:PropTypes.bool.isRequired,

  label_width: PropTypes.number.isRequired,
  label_height: PropTypes.number.isRequired,
 
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  x_label: PropTypes.number.isRequired,
  y_label: PropTypes.number.isRequired,
}

export type SankeyLabel = InferProps<typeof SankeyLabelPropTypes>

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
  accordeonToShow:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  style_node:PropTypes.objectOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  style_link:PropTypes.objectOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,

  // icon_catalog: PropTypes.objectOf(PropTypes.string).isRequired,

  show_structure: PropTypes.oneOf(['structure','data','reconciled','free']).isRequired,
  //show_data: PropTypes.bool.isRequired,
  fit_screen: PropTypes.bool.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  h_space: PropTypes.number.isRequired,
  v_space: PropTypes.number.isRequired,
  left_shift: PropTypes.number.isRequired,
  right_shift: PropTypes.number.isRequired,
  max_shift: PropTypes.number.isRequired,
  legend_position: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,

  //show_banner:PropTypes.bool.isRequired,

  nodes: PropTypes.objectOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links: PropTypes.objectOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,
  labels: PropTypes.objectOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired,
  display_style: PropTypes.shape({
    filter: PropTypes.number.isRequired,
    filter_label: PropTypes.number.isRequired,
    null_flux: PropTypes.bool.isRequired,
    font_family: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    node_font_family_selected: PropTypes.string.isRequired,
    link_font_family_selected: PropTypes.string.isRequired
  }).isRequired,

  grid_square_size: PropTypes.number.isRequired,
  grid_visible: PropTypes.bool.isRequired,

  static_sankey: PropTypes.bool.isRequired,

  nodeTags: TagsCatalogPropTypes,
  dataTags: TagsCatalogPropTypes,
  fluxTags: TagsCatalogPropTypes,
  colorMap: PropTypes.string.isRequired,

  legend_width:PropTypes.number.isRequired,
  
  view: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      view_data: PropTypes.object.isRequired,
      nom:PropTypes.string.isRequired,
      details:PropTypes.string.isRequired
      
    }).isRequired
  ).isRequired
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
export type drawCurveType = (
  data: SankeyData,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { filter: number; filter_label: number; },
  nodeTags: TagsCatalog,
  link: SankeyLink,
  error_msg: { text?: string } | undefined
) => string

export type drawArrowsType = (
  data: SankeyData,
  n: SankeyNode,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { filter?: number; filter_label?: number; },
  nodeTags: TagsCatalog,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number
) => void

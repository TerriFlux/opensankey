import PropTypes, { InferProps } from 'prop-types'

export const SankeyNodeAttrLocalTypes ={

  local_aggregation: PropTypes.bool,
  // Parameter of node shape
  shape_visible: PropTypes.bool,
  label_visible: PropTypes.bool,
  // node_width: PropTypes.number,
  // node_height: PropTypes.number,
  color: PropTypes.string,
  shape: PropTypes.oneOf(['ellipse', 'rect']),
  colorSustainable: PropTypes.bool,
  not_to_scale:PropTypes.bool,
  not_to_scale_direction:PropTypes.string,

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
  // local_aggregation: PropTypes.bool.isRequired,

  // Parameter of node shape
  shape_visible: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  // node_width: PropTypes.number.isRequired,
  // node_height: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  shape: PropTypes.oneOf(['ellipse', 'rect']).isRequired,
  colorSustainable: PropTypes.bool.isRequired,
  not_to_scale:PropTypes.bool.isRequired,
  not_to_scale_direction:PropTypes.string.isRequired,

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
  // is_percent:PropTypes.bool.isRequired,
  // percent:PropTypes.number.isRequired,
  display_value: PropTypes.string.isRequired,
  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired,
  // for previous_value, data_value, data_source, data_period, mini, maxi ...
  extension: PropTypes.objectOf(PropTypes.string.isRequired)
}
export type SankeyLinkValue = InferProps<typeof SankeyLinkValueTypes>

export const SankeyLinkValueDictTypes = PropTypes.objectOf(PropTypes.shape(SankeyLinkValueTypes).isRequired).isRequired
export type SankeyLinkValueDict = InferProps<typeof SankeyLinkValueDictTypes>


export const SankeyLinkAttrLocalTypes ={
  // Geometry/appearence
  orientation:PropTypes.string,
  arrow:PropTypes.bool,
  color:PropTypes.string,
  opacity:PropTypes.number,
  dashed:PropTypes.bool,
  left_horiz_shift: PropTypes.number,
  right_horiz_shift: PropTypes.number,
  vert_shift: PropTypes.number,
  curvature: PropTypes.number,
  curved: PropTypes.bool,
  recycling: PropTypes.bool,
  arrow_size:PropTypes.number,



  // Label
  label_position:PropTypes.string,
  orthogonal_label_position:PropTypes.string,
  label_on_path:PropTypes.bool,
  label_visible:PropTypes.bool,
  label_font_size:PropTypes.number,
  text_color:PropTypes.string,
  to_precision:PropTypes.bool,
  scientific_precision:PropTypes.number,
  font_family: PropTypes.string,

}
export type SankeyLinkAttrLocal = InferProps<typeof SankeyLinkAttrLocalTypes>

export const SankeyLinkStyleTypes ={
  idLink:PropTypes.string.isRequired,
  // Geometry/appearence
  orientation: PropTypes.string.isRequired,
  arrow: PropTypes.bool.isRequired,
  color: PropTypes.string.isRequired,
  opacity: PropTypes.number.isRequired,
  dashed: PropTypes.bool.isRequired,
  left_horiz_shift: PropTypes.number.isRequired,
  right_horiz_shift: PropTypes.number.isRequired,
  vert_shift: PropTypes.number.isRequired,
  curvature: PropTypes.number.isRequired,
  curved: PropTypes.bool.isRequired,
  recycling: PropTypes.bool.isRequired,
  arrow_size:PropTypes.number.isRequired,



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


}
export type SankeyLinkStyle = InferProps<typeof SankeyLinkStyleTypes>

export const SankeyLinkPropTypes = {
  // identification
  idLink: PropTypes.string.isRequired,
  idSource: PropTypes.string.isRequired,
  idTarget: PropTypes.string.isRequired,

  //colorParameter: PropTypes.string.isRequired,
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

  node_width: PropTypes.number.isRequired,
  node_height: PropTypes.number.isRequired,

  accordeonToShow:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  style_node:PropTypes.objectOf(PropTypes.shape(SankeyNodeStyleTypes).isRequired).isRequired,
  style_link:PropTypes.objectOf(PropTypes.shape(SankeyLinkStyleTypes).isRequired).isRequired,

  // icon_catalog: PropTypes.objectOf(PropTypes.string).isRequired,

  show_structure: PropTypes.oneOf(['structure','data','reconciled','free_value','free_interval']).isRequired,
  //show_data: PropTypes.bool.isRequired,
  fit_screen: PropTypes.bool.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  h_space: PropTypes.number.isRequired,
  v_space: PropTypes.number.isRequired,
  left_shift: PropTypes.number.isRequired,
  right_shift: PropTypes.number.isRequired,
  //max_shift: PropTypes.number.isRequired,

  legend_position: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  display_legend_scale:PropTypes.bool.isRequired,
  legend_police:PropTypes.number.isRequired,

  nodes: PropTypes.objectOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links: PropTypes.objectOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,
  display_style: PropTypes.shape({
    filter: PropTypes.number.isRequired,
    filter_label: PropTypes.number.isRequired,
    null_flux: PropTypes.bool.isRequired,
    font_family: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    // node_font_family_selected: PropTypes.string.isRequired,
    // link_font_family_selected: PropTypes.string.isRequired
  }).isRequired,

  grid_square_size: PropTypes.number.isRequired,
  grid_visible: PropTypes.bool.isRequired,


  nodeTags: TagsCatalogPropTypes,
  dataTags: TagsCatalogPropTypes,
  fluxTags: TagsCatalogPropTypes,
  levelTags:TagsCatalogPropTypes,
  colorMap: PropTypes.string.isRequired,

  legend_width:PropTypes.number.isRequired,
  
  // view: PropTypes.arrayOf(
  //   PropTypes.shape({
  //     id: PropTypes.string.isRequired,
  //     view_data: PropTypes.object.isRequired,
  //     nom:PropTypes.string.isRequired,
  //     details:PropTypes.string.isRequired
      
  //   }).isRequired
  // ).isRequired
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
  set_data:(d:SankeyData)=>void,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { filter: number; filter_label: number; },
  nodeTags: TagsCatalog,
  link: SankeyLink,
  error_msg: { text?: string } | undefined,
  multi_selected_links:{current: SankeyLink[] },
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:drawArrowsType
) => string


export type drawArrowsType = (
  n: SankeyNode,
  selected_tags: { [tag_group: string]: string[] },
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  display_style: { filter: number }
  //selection: d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
) => void



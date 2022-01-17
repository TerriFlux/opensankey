import PropTypes, { InferProps } from 'prop-types'

export const SankeyNodePropTypes = {
  // identification
  idNode: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,

  //- level attributes
  dimensions : PropTypes.objectOf(
    PropTypes.shape({
      parent_name : PropTypes.string,
      level       : PropTypes.number,
    }).isRequired
  ).isRequired,

  // DISPLAY ATTRIBUTES
  // display controls the agregation desagregation process. 
  display: PropTypes.bool.isRequired,
  // node_visible controls the other process in particular tags manipulations
  node_visible: PropTypes.bool.isRequired,
  // shape_visible and label_visible control the visibility of the element of the node
  shape_visible: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  
  color: PropTypes.string.isRequired,

  nodeParameter:PropTypes.string.isRequired,
  colorTag:PropTypes.string.isRequired,

  // geometry
  position: PropTypes.oneOf(['absolute','relative']).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  x_label: PropTypes.number,
  y_label: PropTypes.number,
  show_value: PropTypes.bool.isRequired,

  tooltip_text: PropTypes.string,

  // topology
  inputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  outputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

  // semantic
  type: PropTypes.oneOf(['product', 'sector']),
  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired
}
export type SankeyNode = InferProps<typeof SankeyNodePropTypes>

export const SankeyLinkValueTypes = 
    {
      value         : PropTypes.number.isRequired,
      display_value : PropTypes.string.isRequired,
      // corresponding to tag_favorite. to be used in conjunction with SankeyLink.tag_favorite
      //  const selected_tag = getLinkValue(data,l.idLink).color_tag[l.colormap]
      color_tag           : PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
      // for previous_value, data_value, data_source, data_period, mini, maxi ...
      extension     : PropTypes.objectOf(PropTypes.string.isRequired)
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
  recycling: PropTypes.bool,
  orientation: PropTypes.string.isRequired,
  arrow: PropTypes.bool.isRequired,

  // display_attribute
  label_position: PropTypes.string.isRequired,
  orthogonal_label_position : PropTypes.string.isRequired,
  label_on_path: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  text_color: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,

  value: PropTypes.oneOfType([SankeyLinkValueDictTypes,PropTypes.shape(SankeyLinkValueTypes).isRequired]).isRequired,

  tooltip_text: PropTypes.string,

  // geometry
  x_label: PropTypes.number,
  y_label: PropTypes.number,

  //NEW : Choix du group tag pour changement couleur palette 
  colormap:PropTypes.string.isRequired,

  left_horiz_shift  : PropTypes.number.isRequired,
  right_horiz_shift : PropTypes.number.isRequired,
  vert_shift        : PropTypes.number.isRequired,
  shift_gap         : PropTypes.number.isRequired,

  curvature: PropTypes.number.isRequired,
  curved: PropTypes.bool.isRequired
}

export type SankeyLink = InferProps<typeof SankeyLinkPropTypes>


export const TagsGroupPropTypes = {
  group_name: PropTypes.string.isRequired,
  show_legend: PropTypes.bool.isRequired,
  color_map:  PropTypes.string.isRequired,
  tags:PropTypes.objectOf(PropTypes.shape({
    name:PropTypes.string.isRequired,
    shape:PropTypes.string,
    color:PropTypes.string,
    selected:PropTypes.bool.isRequired,
  }).isRequired).isRequired,
  banner:PropTypes.string.isRequired
}
export type TagsGroup = InferProps<typeof TagsGroupPropTypes>

export const TagsCatalogPropTypes = PropTypes.objectOf(PropTypes.shape(TagsGroupPropTypes).isRequired).isRequired
export type TagsCatalog = InferProps<typeof TagsCatalogPropTypes>

//-------------------------

export const SankeyDataPropTypes = {
  version: PropTypes.string.isRequired,
  node_width: PropTypes.number.isRequired,
  user_scale: PropTypes.number.isRequired,
  //height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  h_space: PropTypes.number.isRequired,
  v_space: PropTypes.number.isRequired,
  left_shift: PropTypes.number.isRequired,
  right_shift: PropTypes.number.isRequired,
  max_shift: PropTypes.number.isRequired,
  legend_position: PropTypes.arrayOf( PropTypes.number.isRequired).isRequired,

  nodes: PropTypes.objectOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links: PropTypes.objectOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,
  display_style: PropTypes.shape({
    font_size: PropTypes.number.isRequired,
    sector_uppercase: PropTypes.bool.isRequired,
    sector_bold: PropTypes.bool.isRequired,
    sector_italic: PropTypes.bool.isRequired,
    product_uppercase: PropTypes.bool.isRequired,
    product_bold: PropTypes.bool.isRequired,
    product_italic: PropTypes.bool.isRequired,
    unit: PropTypes.bool.isRequired,
    filter: PropTypes.number.isRequired,
    filter_label: PropTypes.number.isRequired,
    global_curvature: PropTypes.number.isRequired,
    null_flux: PropTypes.bool.isRequired
  }).isRequired,
  
  static_sankey : PropTypes.bool.isRequired,

  tags_catalog:TagsCatalogPropTypes,

  dataTags:TagsCatalogPropTypes
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

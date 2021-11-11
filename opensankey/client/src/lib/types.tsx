import PropTypes, { InferProps } from 'prop-types'

export const SankeyNodePropTypes = {
  // identification
  id: PropTypes.number.isRequired,
  idNode: PropTypes.string,
  name: PropTypes.string.isRequired,

  parent_name : PropTypes.string,

  // display attributes
  visible: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  color: PropTypes.string.isRequired,
  colorFavoriteTags:PropTypes.objectOf(PropTypes.shape({
    tag_associated:PropTypes.string.isRequired,
    color:PropTypes.string
  }).isRequired
  ).isRequired,

  nodeParameter:PropTypes.string.isRequired,

  // geometry
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  x_label: PropTypes.number,
  y_label: PropTypes.number,

  tooltip_text: PropTypes.string,

  // topology
  inputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired),
  input_links: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  outputLinksId: PropTypes.arrayOf(PropTypes.string.isRequired),
  output_links: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,

  // semantic
  type: PropTypes.oneOf(['product', 'sector']),
  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired,
}
export type SankeyNode = InferProps<typeof SankeyNodePropTypes>

export const SankeyLinkPropTypes = {
  // identification
  idLink: PropTypes.string,
  source_name: PropTypes.string.isRequired,
  target_name: PropTypes.string.isRequired,

  // type of link
  recycling: PropTypes.bool,
  orientation: PropTypes.string.isRequired,
  arrow: PropTypes.bool.isRequired,

  // display_attribute
  label_position: PropTypes.string.isRequired,
  label_on_path: PropTypes.bool.isRequired,
  label_visible: PropTypes.bool.isRequired,
  text_color: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,

  // value
  value: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  display_value: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

  tooltip_text: PropTypes.string,

  // geometry
  x_label: PropTypes.number,
  y_label: PropTypes.number,
  left_horiz_shift: PropTypes.number.isRequired,
  right_horiz_shift: PropTypes.number.isRequired,
  vert_shift: PropTypes.number.isRequired,
  curvature: PropTypes.number.isRequired,
  curved: PropTypes.bool.isRequired,

  tags: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired).isRequired,
}

export type SankeyLink = InferProps<typeof SankeyLinkPropTypes>

export const TagsGroupPropTypes = {
  group_name: PropTypes.string.isRequired,
  tags:PropTypes.objectOf(PropTypes.shape({
    name:PropTypes.string.isRequired,
    color:PropTypes.string,
    selected:PropTypes.bool.isRequired,
  }).isRequired).isRequired,
  banner:PropTypes.string.isRequired
}
export type TagsGroup = InferProps<typeof TagsGroupPropTypes>

export const TagsCatalogV2PropTypes = PropTypes.objectOf(PropTypes.shape(TagsGroupPropTypes).isRequired).isRequired
export type TagsV2Catalog = InferProps<typeof TagsCatalogV2PropTypes>

//-------------------------

export const SankeyDataPropTypes = {
  version: PropTypes.string.isRequired,
  node_width: PropTypes.number.isRequired,
  user_scale: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,

  nodes: PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links: PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired,

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
    global_curvature: PropTypes.number.isRequired
  }).isRequired,

  tags_catalog_v2:TagsCatalogV2PropTypes,
  tags_group_idx: PropTypes.number.isRequired,
  tag_idx: PropTypes.number.isRequired
}

export type SankeyData = InferProps<typeof SankeyDataPropTypes>

export interface SankeyMenuState {
  processing: boolean
  show_excel_dialog: boolean
  show_publish_dialog: boolean
}

export interface ExcelModalState {
  sheet: string
}

export interface SankeyAppState {
  show_readme: boolean
  show_legend: boolean
  show_entry: boolean

  data: SankeyData
}

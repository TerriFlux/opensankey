import PropTypes,{InferProps} from 'prop-types'

export const SankeyNodePropTypes = {
  id : PropTypes.number.isRequired,
  name : PropTypes.string.isRequired,

  input_links : PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  output_links : PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,

  visible : PropTypes.bool.isRequired,
  label_visible : PropTypes.bool,

  x : PropTypes.number.isRequired,
  y : PropTypes.number.isRequired,
  x_label : PropTypes.number,
  y_label : PropTypes.number,

  type : PropTypes.oneOf(['product','sector']),
  subchain : PropTypes.string,
  color : PropTypes.string.isRequired
}
export type SankeyNode = InferProps<typeof SankeyNodePropTypes>

export const SankeyLinkPropTypes = {
  target : PropTypes.number,
  source : PropTypes.number,

  recycling : PropTypes.bool,
  orientation : PropTypes.string.isRequired,

  source_name : PropTypes.string.isRequired,
  target_name : PropTypes.string.isRequired,
  curvature : PropTypes.number.isRequired,
  curved : PropTypes.bool.isRequired,

  left_horiz_shift : PropTypes.number.isRequired,
  right_horiz_shift : PropTypes.number.isRequired,
  vert_shift : PropTypes.number.isRequired,

  value                 : PropTypes.number.isRequired,

  label_position        : PropTypes.string.isRequired,
  label_on_path         : PropTypes.bool.isRequired,
  label_visible         : PropTypes.bool.isRequired,

  text_color            : PropTypes.string.isRequired,
  color                 : PropTypes.string.isRequired,

  visible               : PropTypes.bool.isRequired,

  unbounded            : PropTypes.bool,
  display_value         : PropTypes.string.isRequired,
  tmp_display_value    : PropTypes.string,

  x_label              : PropTypes.number,
  y_label              : PropTypes.number,

  arrow                 : PropTypes.bool.isRequired,
}

export type SankeyLink = InferProps<typeof SankeyLinkPropTypes>

export const SankeyDataPropTypes = {
  version: PropTypes.string.isRequired,
  node_width: PropTypes.number.isRequired,
  user_scale: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,

  nodes : PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links : PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired).isRequired,

  region_name : PropTypes.string.isRequired,

  display_style : PropTypes.shape({
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

  subchains : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  use_flux_types : PropTypes.bool,
  region_names : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
}

export type SankeyData = InferProps<typeof SankeyDataPropTypes>

export interface SankeyMenuState {
  processing: boolean
  show_excel_dialog:boolean
  show_publish_dialog:boolean
}

export interface ExcelModalState {
  sheet : string
}

export interface SankeyAppState {
  show_readme : boolean
  show_legend : boolean
  show_entry : boolean

  subchain: string[]
  flux_types: string[]
  sous_filiere: string[]

  data : SankeyData
}

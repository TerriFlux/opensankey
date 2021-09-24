import PropTypes,{InferProps} from 'prop-types'
// export interface SankeyNode {
//     id : number
//     name : string
//     tooltip_text? : string
//     input_links : number[]
//     output_links : number[]
//     x_label? : number
//     y_label? : number
//     visible : boolean
//     type : string
//     label_visible? : boolean
//     total_input_offset? : number
//     total_output_offset? : number
//     text_visible? : number
//     x : number
//     y : number
//     //horizontal_index? : number

//     subchain? : string

//     color : string
//     old_color? : string
//     orientation? : string
// }

export const SankeyNodePropTypes = {
  id : PropTypes.number.isRequired,
  name : PropTypes.string.isRequired,
  tooltip_text : PropTypes.string,
  input_links : PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  output_links : PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  x_label : PropTypes.number,
  y_label : PropTypes.number,
  visible : PropTypes.bool.isRequired,
  type : PropTypes.string.isRequired,
  label_visible : PropTypes.bool,
  total_input_offset : PropTypes.number,
  total_output_offset : PropTypes.number,
  x : PropTypes.number.isRequired,
  y : PropTypes.number.isRequired,
  subchain : PropTypes.string,
  color : PropTypes.string.isRequired,
  old_color : PropTypes.string,
  orientation : PropTypes.string
}
export type SankeyNode = InferProps<typeof SankeyNodePropTypes>

// export interface SankeyLink {
//   target? : number,
//   source? : number,

//   tooltip_text? : string
//   recycling? : boolean
//   orientation : string

//   source_name : string
//   target_name : string
//   curvature : number
//   curved : boolean

//   left_horiz_shift : number
//   right_horiz_shift : number
//   vert_shift : number

//   value                 : number

//   label_position        : string
//   label_on_path         : boolean
//   label_visible         : boolean

//   color                 : string
//   old_color?            : string

//   visible               : boolean

//   unbounded?            : boolean
//   display_value         : string
//   tmp_display_value?    : string
//   natural_unit?         : string
//   conv?                 : number[]

//   data                  : boolean
//   agregated_data_value? : (number | string)[]
//   data_value?           : number[]
//   data_constraint?      : string[]
//   data_source?          : string
//   data_period?          : string

//   tooltips?             : string[]

//   x_label?              : number
//   y_label?              : number

//   arrow                 : boolean

//   mini?                 : number
//   maxi?                 : number

//   compatibility
//   frozen? : boolean
//   link_reverse? : boolean
//   display_unit? : string
//   type? : string
// }
export const SankeyLinkPropTypes = {
  target : PropTypes.number,
  source : PropTypes.number,

  tooltip_text : PropTypes.string,
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
  old_color             : PropTypes.string,

  visible               : PropTypes.bool.isRequired,

  unbounded            : PropTypes.bool,
  display_value         : PropTypes.string.isRequired,
  tmp_display_value    : PropTypes.string,
  natural_unit         : PropTypes.string,
  conv                 : PropTypes.arrayOf(PropTypes.number.isRequired),

  data                  : PropTypes.bool.isRequired,
  agregated_data_value  : PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number,PropTypes.string])),
  data_value            : PropTypes.arrayOf(PropTypes.number),
  data_constraint       : PropTypes.arrayOf(PropTypes.string),
  data_source           : PropTypes.string,
  data_period           : PropTypes.string,

  tooltips             : PropTypes.arrayOf(PropTypes.string),

  x_label              : PropTypes.number,
  y_label              : PropTypes.number,

  arrow                 : PropTypes.bool.isRequired,

  mini                 : PropTypes.number,
  maxi                 : PropTypes.number,

  // compatibility
  frozen : PropTypes.bool,
  link_reverse : PropTypes.bool,
  display_unit : PropTypes.string,
  type : PropTypes.string
}
export type SankeyLink = InferProps<typeof SankeyLinkPropTypes>

// export interface SankeyData {
//   version: string
//   file_path: string
//   node_width: number
//   user_scale: number
//   height: number
//   width: number

//   periods: boolean,

//   nodes : SankeyNode[]
//   links : { [region_name : string] : SankeyLink[] }

//   animation_tooltips : any
//   show_uncert: boolean

//   region_name : string
//   default_tooltip : boolean

//   trade? : string
//   trade_sectors? : string[];

//   display_style : {
//     font_size: number
//     sector_uppercase: boolean
//     sector_bold: boolean
//     sector_italic: boolean
//     product_uppercase: boolean
//     product_bold: boolean
//     product_italic: boolean
//     unit: boolean
//     filter: number
//     filter_label: number
//     global_curvature: number
//     trade_close: boolean
//   },

//   static_sankey  : boolean

//   subchains : string[]
//   use_flux_types : boolean
//   region_names : string[]
//   tooltip_names : string[]
//   tooltips : string[]

//   units_names : string[]

//   //max_vertical_offset? : number
//   old_user_scale? : number

//   error? : string

//   // compatibility
//   sankey_type? : string
// }

export const SankeyDataPropTypes = {
  version: PropTypes.string.isRequired,
  file_path: PropTypes.string.isRequired,
  node_width: PropTypes.number.isRequired,
  user_scale: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,

  periods: PropTypes.bool,

  nodes : PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired,
  links : PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired).isRequired,

  animation_tooltips : PropTypes.any,
  show_uncert: PropTypes.bool,

  region_name : PropTypes.string.isRequired,
  default_tooltip : PropTypes.bool.isRequired,

  trade : PropTypes.string,
  trade_sectors : PropTypes.arrayOf(PropTypes.string.isRequired),

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
    global_curvature: PropTypes.number.isRequired,
    trade_close: PropTypes.bool.isRequired
  }).isRequired,

  static_sankey : PropTypes.bool.isRequired,

  subchains : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  use_flux_types : PropTypes.bool,
  region_names : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  tooltip_names : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  tooltips : PropTypes.arrayOf(PropTypes.string.isRequired),

  units_names : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

  //max_vertical_offset? : PropTypes.number
  old_user_scale : PropTypes.number,

  error : PropTypes.string,

  // compatibility
  sankey_type : PropTypes.string,
}

export type SankeyData = InferProps<typeof SankeyDataPropTypes>

export interface SankeyMenuState {
  processing: boolean
  show_excel_dialog:boolean
  show_publish_dialog:boolean
}

export interface PublishModalState {
  file_path : string
}

export interface ExcelModalState {
  sheet : string
}

export interface SankeyAppState {
  show_readme : boolean
  show_legend : boolean
  show_entry : boolean
  
  advanced: boolean
  unit: string
  current_step: number

  subchain: string[]
  default_tooltip: boolean
  flux_types: string[]
  sous_filiere: string[]
  main_color : string

  data : SankeyData

  legend_average? : string
  legend_uncert? : string
  welcome_text? : string
  help_text?: string

  animation: boolean
}

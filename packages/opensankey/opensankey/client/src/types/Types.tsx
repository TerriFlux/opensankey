// import { ClickSaveDiagramFuncType, RetrieveExcelResultsFuncType } from '../dialogs/types/SankeyPersistenceTypes'
// import { OpenSankeyDiagramSelectorFType, initializeDiagrammSelectorFType } from '../dialogs/types/SankeyMenuDialogsTypes'
// import { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react'
// import { setDiagramFuncType } from '../configmenus/types/SankeyMenuBannerTypes'
// import { Class_ApplicationData } from './ApplicationData'
// import { Type_JSON } from './Utils'

// export type SankeyNodeAttrLocal ={
//   local_aggregation?: boolean,
//   // Parameter of node shape
//   shape_visible?: boolean,
//   label_visible?: boolean,
//   node_width?: number,
//   node_height?: number,
//   color?: string,
//   shape?: 'ellipse' | 'rect' | 'arrow',
//   node_arrow_angle_factor?: number,
//   node_arrow_angle_direction?: string,
//   colorSustainable?: boolean,

//   // Parameter of node label
//   font_family?: string,
//   font_size?: number,
//   uppercase?: boolean,
//   bold?: boolean,
//   italic?: boolean,
//   label_box_width?: number,
//   label_color?: boolean,
//   label_vert?: string,
//   label_horiz?: string,
//   label_background?: boolean,

//   // Parameter of node value label
//   show_value?: boolean,
//   label_vert_valeur?: string,
//   label_horiz_valeur?: string,
//   value_font_size?: number,
// }
// type ValueOf<T> = T[keyof T];
// export type KeysTypeSankeyNodeAttrLocal=keyof SankeyNodeAttrLocal
// export type ValuesTypeSankeyNodeAttrLocal=Exclude<ValueOf<SankeyNodeAttrLocal>,undefined>

// // Same as Local node attribute but with required value as now style attributes is the default attributes of node
// export type SankeyNodeStyle ={
//   idNode: string,
//   name: string,

//   // Parameter of node shape
//   shape_visible: boolean,
//   label_visible: boolean,
//   node_width: number,
//   node_height: number,
//   color: string,
//   shape: 'ellipse' | 'rect' | 'arrow',
//   node_arrow_angle_factor: number,
//   node_arrow_angle_direction: string,
//   colorSustainable: boolean,

//   // Parameter of node label
//   font_family: string,
//   font_size: number,
//   uppercase: boolean,
//   bold: boolean,
//   italic: boolean,
//   label_box_width: number,
//   label_color: boolean,
//   label_vert: string,
//   label_horiz: string,
//   label_background: boolean,

//   // Parameter of node value label
//   show_value: boolean,
//   label_vert_valeur: string,
//   label_horiz_valeur: string,
//   value_font_size: number,
// }


// export type SankeyNode = {
//   // identification
//   idNode: string,
//   name: string,

//   //- level attributes
//   dimensions: {
//     [_: string] : {
//       parent_name?: string,
//       level?: number,
//     }
//   },

//   local?: SankeyNodeAttrLocal,

//   colorParameter: string,
//   colorTag: string,

//   // geometry
//   position: 'absolute' | 'relative',
//   x: number,
//   y: number,
//   x_label?: number,
//   y_label?: number,

//   tooltip_text?: string,

//   // topology
//   inputLinksId: string[]
//   outputLinksId: string[]

//   tags: {[_: string]: string[]},
//   style: string,
// }

// export type SankeyLinkValue = {
//   value: number | string,
//   display_value: string,
//   tags: {[_: string]: string[]},
//   // for previous_value, data_value, data_source, mini, maxi ...
//   extension: {[_: string]: string}
// }

// export type SankeyLinkValueDict = {
//   [_: string]: SankeyLinkValue | SankeyLinkValueDict
// }

// export type SankeyLinkAttrLocal ={
//   // Geometry link
//   orientation?: string,
//   left_horiz_shift?: number,
//   right_horiz_shift?: number,
//   vert_shift?: number,
//   curvature?: number,
//   curved?: boolean,
//   recycling?: boolean,
//   arrow_size?: number,

//   // Geometry link labels
//   label_position?: string,
//   orthogonal_label_position?: string,
//   label_on_path?: boolean,
//   label_pos_auto?: boolean,

//   //Attributes link
//   arrow?: boolean,
//   color?: string,
//   opacity?: number,
//   dashed?: boolean,
//   //Attributes link labels
//   label_visible?: boolean,
//   label_font_size?: number,
//   text_color?: string,
//   to_precision?: boolean,
//   scientific_precision?: number,
//   font_family?: string,
//   label_unit_visible?: boolean,
//   label_unit?: string,
//   custom_digit?: boolean,
//   nb_digit?: number
// }

// export type SankeyLinkStyle ={
//   idLink: string,
//   name: string,

//   // Geometry/appearence
//   orientation: string,
//   arrow: boolean,
//   color: string,
//   opacity: number,
//   left_horiz_shift: number,
//   right_horiz_shift: number,
//   vert_shift: number,
//   curvature: number,
//   curved: boolean,
//   recycling: boolean,
//   arrow_size: number,
//   dashed: boolean,
//   // Label
//   label_position: string,
//   orthogonal_label_position: string,
//   label_on_path: boolean,
//   label_pos_auto: boolean,

//   label_visible: boolean,
//   label_font_size: number,
//   text_color: string,
//   to_precision: boolean,
//   scientific_precision: number,
//   font_family: string,
//   label_unit_visible: boolean,
//   label_unit: string,
//   custom_digit: boolean,
//   nb_digit: number,
// }

// export type SankeyLink = {
//   // identification
//   idLink: string,
//   idSource: string,
//   idTarget: string,
//   colorTag: string,

//   value: SankeyLinkValueDict | SankeyLinkValue,

//   tooltip_text?: string,

//   // geometry
//   x_label?: number,
//   y_label?: number,
//   drag_label_offset?: number

//   //style
//   style: string,

//   local?: SankeyLinkAttrLocal
// }

// export type TagsGroup = {
//   group_name: string,
//   show_legend: boolean,
//   color_map: string,
//   tags: {[_: string]: {
//     name: string,
//     shape?: string,
//     color?: string,
//     selected: boolean,
//   }},
//   banner: string,
//   activated: boolean,
//   siblings: string[]
// }


// export type TagsCatalog = {[_: string]: TagsGroup}

// //-------------------------
// export type display_styleType = {
//   filter: number,
//   filter_label: number,
//   // null_flux: boolean,
//   font_family: string[]
// }

// export type SankeyData = {
//   version: string,
//   file_name?: string,
//   couleur_fond_sankey: string,
//   displayed_node_selector: boolean,
//   displayed_link_selector: boolean,

//   user_scale: number,

//   maximum_flux ?: number|null,
//   minimum_flux ?: number|null,
//   accordeonToShow: string[]
//   style_node: {[_: string]: SankeyNodeStyle},
//   style_link: {[_: string]: SankeyLinkStyle},

//   show_structure: 'structure' | 'data' | 'reconciled' | 'free_value' | 'free_interval',
//   fit_screen: boolean,
//   height: number,
//   width: number,
//   h_space: number,
//   v_space: number,
//   left_shift: number,
//   right_shift: number,

//   legend_position: number[],
//   display_legend_scale: boolean,
//   legend_police: number,
//   mask_legend: boolean,
//   legend_bg_color: string,
//   legend_bg_opacity: number,
//   legend_bg_border: boolean,
//   legend_show_dataTags: boolean,

//   nodes: {[_: string]: SankeyNode},
//   links: {[_: string]: SankeyLink},
//   display_style: display_styleType,

//   linkZIndex: string[]

//   grid_square_size: number,
//   grid_visible: boolean,

//   nodeTags: TagsCatalog,
//   dataTags: TagsCatalog,
//   fluxTags: TagsCatalog,
//   levelTags: TagsCatalog,
//   colorMap: string,
//   nodesColorMap: string,
//   linksColorMap: string,

//   legend_width: number,
//   node_label_separator: string
// }

// export interface SankeyMenuState {
//   processing: boolean
// }

// export interface SankeyAppState {
//   show_readme: boolean
//   show_legend: boolean
//   show_entry: boolean

//   data: SankeyData
// }


// export interface treeFolderType{
//   id: string
//   name: string,
//   children?: treeFolderType[],
//   checked?: 1|0.5|0
// }

// export type textForToastPromiseType={
//   success?: string,
//   loading?: string
// }

// export interface dict_hook_ref_setter_show_dialog_componentsType {
//   ref_setter_show_menu_node_apparence: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_node_io: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_node_tooltip: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_node_tags: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_link_tags: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_link_data: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_link_appearence: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_link_tooltip: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_menu_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_welcome: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_tuto: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_support: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_excel_loader: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_json_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_getter_show_save_json: MutableRefObject<boolean>,
//   ref_setter_show_modal_apply_layout: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_preference: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_templates_lib: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_styles_nodes: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_styles_links: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_show_modal_excel_reading_process: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_trigger_waiting_spinner_toast: MutableRefObject<(intake?: textForToastPromiseType)=>void>,
//   ref_setter_show_modal_png_saver: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   ref_setter_png_saver_res_h: MutableRefObject<Dispatch<SetStateAction<number|undefined>>>,
//   ref_setter_png_saver_res_v: MutableRefObject<Dispatch<SetStateAction<number|undefined>>>,
// }






// export type initializeCloseAllMenuContextType =(
//   tagContext: RefObject<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>,
//   showContextZDDRef: MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>]|undefined>
// )=>()=>void



// export type processFunctionsType = {
//   ref_processing: MutableRefObject<boolean>,
//   ref_setter_processing: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
//   failure: MutableRefObject<boolean>,
//   not_started: MutableRefObject<boolean>,
//   ref_result: MutableRefObject<Dispatch<SetStateAction<string>>>,
//   path: MutableRefObject<string>,
//   launch: (path: string) => void,
//   // is_computing: MutableRefObject<boolean>,
//   RetrieveExcelResults: RetrieveExcelResultsFuncType
// }

// export type applicationDrawType = {
//   all_element_UpdateLayout: string[]
//   start_point: React.MutableRefObject<number[]>,
// }

// export type agregationType = {
//   showAgregationRef: RefObject<[boolean, Dispatch<SetStateAction<boolean>>][]>,
//   isAgregationRef: MutableRefObject<boolean>,
//   agregationNode: MutableRefObject<SankeyNode|undefined>
// }

// export type MenuTypes = {
//   applicationData: applicationDataType,
//   processFunctions: processFunctionsType,
//   reinitialization: () => void,
//   DiagramSelector: OpenSankeyDiagramSelectorFType,
//   configurations_menus: JSX.Element,
//   menus: {[s: string]: JSX.Element[] | JSX.Element},
//   cardsTemplate: JSX.Element,
//   external_modal: JSX.Element[],
//   apply_transformation_additional_elements: JSX.Element[],
//   additional_nav_item: JSX.Element[],
//   formations_menu: object,
//   // postProcessLoadExcel: postProcessLoadExcelFuncType,
// }

// export type postProcessLoadExcelFuncType = (server_data: SankeyData) => void
// /*****************************************************************************/


// export type initializeReinitializationType = (
//   applicationData : applicationDataType
// ) => ()=>void

// /*****************************************************************************/
// // Data
// export type OSGetDefaultData=()=>SankeyData

// export type applicationDataType = {
//   data: SankeyData,
//   set_data: (_: SankeyData)=>void,
//   get_default_data: OSGetDefaultData,
//   // convert_data: ConvertDataFuncType,
//   // display_nodes: {[_: string]: SankeyNode},
//   // display_links: {[_: string]: SankeyLink},
//   // min_link_thickness: number,
//   dataVarToUpdate: MutableRefObject<string[]>,
//   setDiagram: setDiagramFuncType,
//   new_data: Class_ApplicationData
// }

// export type initializeApplicationDataType = (
//   data: SankeyData,
//   set_data: (_: SankeyData)=>void,
//   get_default_data: OSGetDefaultData,
//   initial_data: Type_JSON | undefined
// )=>applicationDataType

// /*****************************************************************************/

// export type CreateLinksOnSVGFType=(links_to_update: SankeyLink[])=>void

// export type DrawAllType = (

// ) => void



// export type AdditionalMenusType = {
//   // Top Menu
//   external_edition_item: JSX.Element[],
//   external_file_item: JSX.Element[],
//   external_file_export_item: JSX.Element[],
//   externale_save_item: JSX.Element[],
//   externale_navbar_item: {[_: string]: JSX.Element}

//   // Mise en page
//   extra_background_element: JSX.Element
//   apply_transformation_additional_elements: JSX.Element[]
//   // Nodes
//   advanced_appearence_content: JSX.Element[],
//   advanced_label_content: JSX.Element[],
//   advanced_label_value_content: JSX.Element[],
//   additional_menu_configuration_nodes: {[_: string]: JSX.Element},
//   additional_context_element_menu: JSX.Element[],
//   additional_context_element_other: JSX.Element[],

//   // Links
//   additional_data_element: JSX.Element[],
//   additional_link_appearence_items: JSX.Element[],
//   additional_link_visual_filter_content: JSX.Element[],

//   // Preferences
//   additional_preferences: JSX.Element[],

//   // Configuration Menu
//   additional_configuration_menus: JSX.Element[]

//   // menu_style_add_node_appearence_attr: JSX.Element[]
//   // menu_style_add_node_label: JSX.Element[]
//   // menu_style_add_node_label_value: JSX.Element[],

//   additional_edition_item: JSX.Element[],
//   additional_file_save_json_option: JSX.Element[],
//   additional_file_item: JSX.Element[],
//   additional_file_export_item: JSX.Element[],

//   sankey_menus: {[_: string]: JSX.Element},

//   additional_nav_item: JSX.Element[],

//   example_menu: { [k: string]: JSX.Element; }
//   formations_menu: { [k: string]: JSX.Element; },

//   cards_template: JSX.Element
// }

// export type initializeAdditionalMenusType = (
//   additional_menus: AdditionalMenusType,
//   applicationData: applicationDataType
// ) => void

// export type module_dialogsType = (
//   applicationData: applicationDataType,
//   additional_menus: AdditionalMenusType,
//   menu_configuration_nodes_attributes: JSX.Element,
//   processFunctions: processFunctionsType
// ) => JSX.Element[]

// /*****************************************************************************/

// export type SankeyAppTypes = {
//   initial_sankey_data: SankeyData
//   get_default_data: OSGetDefaultData,
//   initializeApplicationData: initializeApplicationDataType,
//   initializeMenuConfiguration: initializeMenuConfigurationFuncType,
//   initializeReinitialization: initializeReinitializationType,
//   initializeAdditionalMenus: initializeAdditionalMenusType,
//   initializeDiagrammSelector: initializeDiagrammSelectorFType,
//   moduleDialogs: module_dialogsType,
//   ClickSaveDiagram: ClickSaveDiagramFuncType,
// }

// export type initializeMenuConfigurationFuncType=(
//   applicationData: applicationDataType,
//   additional_menus: AdditionalMenusType,
//   config_link_data: JSX.Element,
//   config_link_attr: JSX.Element,
//   menu_configuration_nodes_attributes: JSX.Element,
// ) => JSX.Element



// export type InitalizeSelectorDetailNodesType=(
//   applicationData: applicationDataType,
// )=>JSX.Element
import { TFunction } from 'i18next'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, SankeyData, TagsCatalog, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_application_dataType } from '../../types/Types'
import { MutableRefObject } from 'react'
import { setDiagramFuncType } from '../../configmenus/types/SankeyMenuBannerTypes'

/**
 * Function that generate dropdown for each groupTag of linkTags
 *
 * @param {TagsCatalog} fluxTags
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {(void) => any}
 */
export type AddAllDropDownFluxFType = (
  t:TFunction,
  fluxTags: TagsCatalog,
  dict_variable_application_data:dict_variable_application_dataType,
  reDrawLegend:()=>void,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  recomputeDisplayedElement:()=>void

) => JSX.Element

export type OpenSankeyMenusFType = (
  t:TFunction,
  Reinitialization:()=>void,
  DefaultSankeyData:()=>SankeyData,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again:MutableRefObject<boolean>,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  external_edition_item:JSX.Element[],
  external_file_item:JSX.Element[],
  external_file_export_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  convert_data:(d:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void,
  setDiagram: setDiagramFuncType,

) => {[s:string]:JSX.Element | JSX.Element[]}

export type SankeyModalWelcomeFType = (
  t:TFunction,
  active_page : string,
  set_active_page : (_:string)=>void,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again : MutableRefObject<boolean>,
  additional_shortcut_item:JSX.Element[],
  external_pagination:JSX.Element[],
  external_content:{
    read_me: string | JSX.Element | JSX.Element[];
    intro: JSX.Element;
    rc: JSX.Element;
    licence?: JSX.Element;
    news: JSX.Element;
  },
  exemple_menu: object
)=> JSX.Element

export type MenuDraggableFType = (
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  dialog_name: 'ref_setter_show_menu_node_apparence' | 'ref_setter_show_menu_node_io'| 'ref_setter_show_menu_node_tooltip' | 'ref_setter_show_menu_node_tags' 
  | 'ref_setter_show_menu_link_data' | 'ref_setter_show_menu_link_appearence' | 'ref_setter_show_menu_link_tags' |
  'ref_setter_show_menu_link_tooltip' |'ref_setter_show_menu_layout' |
    'ref_setter_show_modal_welcome' | 'ref_setter_show_modale_tuto' | 'ref_setter_show_modale_support' | 'ref_setter_show_excel_dialog' |
    'ref_setter_show_save_json' | 'ref_getter_show_save_json' | 'ref_setter_show_apply_layout' |'ref_setter_show_modal_preference' |
    'ref_setter_show_modal_template' |'ref_setter_show_load' |'ref_setter_show_menu_config' ,
  content:JSX.Element|JSX.Element[],
  pointer_pos:{current:number[]},
  title:string,
  width_menu?:number
)=> JSX.Element

export type OpenSankeySaveButtonFType = (t:TFunction) => JSX.Element
 
export type LastCheckpointTimeFType = (t:TFunction,ComponentUpdater:ComponentUpdaterType) => JSX.Element
export type SankeyMenuFileExportFType=(
  t:TFunction,
  data:SankeyData,
  additonal_export_item:JSX.Element[]
  )=> JSX.Element



import { TFunction } from 'i18next'
import { SankeyData, TagsCatalog, dict_hook_ref_setter_show_dialog_componentsType } from './Types'

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
  data: SankeyData,
  set_data: (data: SankeyData) => void
) => JSX.Element

export type OpenSankeyMenusFType = (
  t:TFunction,
  Reinitialization:()=>void,
  DefaultSankeyData:()=>SankeyData,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  showStyleEdition:()=>void,
  showStyleEditionLink:()=>void,
  set_never_see_again:(b:boolean)=>void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  external_edition_item:JSX.Element[],
  external_file_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  set_tags_selected:(o:{[x:string]:string})=>void,
  convert_data:(d:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void
) => {[s:string]:JSX.Element | JSX.Element[]}

export type SankeyModalWelcomeFType = (
  t:TFunction,
  active_page:string,
  set_active_page:(s:string)=>void,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again:boolean,
  set_never_see_again:(b:boolean)=>void,
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
  content:JSX.Element|JSX.Element[],
  pointer_pos:{current:number[]},
  title:string,
  set_display_menu:(b:boolean)=>void,
  width_menu?:number
)=> JSX.Element

export type OpenSankeySaveButtonFType = (t:TFunction) => JSX.Element
 
export type LastCheckpointTimeFType = (t:TFunction) => JSX.Element

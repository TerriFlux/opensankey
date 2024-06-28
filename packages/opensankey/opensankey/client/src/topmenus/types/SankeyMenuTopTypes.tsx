import { TFunction } from 'i18next'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, SankeyData, TagsCatalog, applicationContextType, dict_hook_ref_setter_show_dialog_componentsType, applicationDataType, applicationDrawType, processFunctionsType } from '../../types/Types'
import {MutableRefObject } from 'react'
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
  applicationData:applicationDataType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponenentUpdater:ComponentUpdaterType,
  applicationDraw:applicationDrawType

) => JSX.Element

export type OpenSankeyMenusFType = (
  t:TFunction,
  Reinitialization:()=>void,
  DefaultSankeyData:()=>SankeyData,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again:MutableRefObject<boolean>,
  applicationData:applicationDataType,
  external_edition_item:JSX.Element[],
  external_file_item:JSX.Element[],
  external_file_export_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  externale_navbar_item:{[_:string]:JSX.Element},
  convert_data:(d:SankeyData,DefaultSankeyData: ()=>SankeyData)=>void,
  setDiagram: setDiagramFuncType,

) => {[s:string]:JSX.Element | JSX.Element[]}

export type SankeyModalWelcomeFType = {
  t:TFunction,
  active_page : string,
  // set_active_page : (_:string)=>void,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again : MutableRefObject<boolean>,
  additional_shortcut_item:JSX.Element[],
  external_pagination:{[x:string]:JSX.Element},
  external_content:{
    read_me: string | JSX.Element | JSX.Element[];
    intro: JSX.Element;
    rc: JSX.Element;
    licence?: JSX.Element;
    news: JSX.Element;
    interface: JSX.Element;
  }
}

export type MenuDraggableFType = (
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  dialog_name: keyof dict_hook_ref_setter_show_dialog_componentsType,
  content:JSX.Element|JSX.Element[],
  pointer_pos:{current:number[]},
  title:string,
  width_menu?:number
)=> JSX.Element

export type OpenSankeySaveButtonFType = {
  ComponentUpdater:ComponentUpdaterType,
  applicationContext:applicationContextType
}
 
export type LastCheckpointTimeFType = (t:TFunction,ComponentUpdater:ComponentUpdaterType) => JSX.Element
export type SankeyMenuFileExportFType=(
  t:TFunction,
  data:SankeyData,
  additonal_export_item:JSX.Element[]
  )=> JSX.Element

export type ToastWaitFuncFType={
  applicationData:applicationDataType,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  applicationContext:applicationContextType
}

export type Modale_resolution_pngFType=(
  t:TFunction,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  applicationData:applicationDataType,
  pointer_pos:{current:number[]},


  )=> JSX.Element

export type ModalTutoType={
    applicationData:applicationDataType,
    applicationContext:applicationContextType,
    processFunctions:processFunctionsType,
    formations_menu: object,
    show_tuto:boolean,
    set_show_tuto:(b:boolean)=>void,
    Reinitialization:()=>void
  
  }
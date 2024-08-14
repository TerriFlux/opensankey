
import {MutableRefObject } from 'react'
import { TFunction } from 'i18next'

import {
  SankeyData,
  dict_hook_ref_setter_show_dialog_componentsType,
  applicationDataType,
  processFunctionsType
} from '../../types/LegacyType'

import { setDiagramFuncType } from '../../configmenus/types/SankeyMenuBannerTypes'

export type OpenSankeyMenusFType = (
  t:TFunction,
  Reinitialization:()=>void,
  DefaultSankeyData:()=>SankeyData,
  applicationData:applicationDataType,
  external_edition_item:JSX.Element[],
  external_file_item:JSX.Element[],
  external_file_export_item:JSX.Element[],
  externale_save_item:JSX.Element[],
  externale_navbar_item:{[_:string]:JSX.Element},
  setDiagram: setDiagramFuncType,

) => {[s:string]:JSX.Element | JSX.Element[]}

export type SankeyModalWelcomeFType = {
  applicationData:applicationDataType,
  t:TFunction,
  active_page : string,
  // set_active_page : (_:string)=>void,
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

export type MenuDraggableFType = {
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  dialog_name: keyof dict_hook_ref_setter_show_dialog_componentsType,
  content:JSX.Element|JSX.Element[],
  title:string,
}

export type OpenSankeySaveButtonFType = {
  applicationData:applicationDataType,
}

export type Modale_resolution_pngFType=(
  t:TFunction,
  applicationData:applicationDataType,

  )=> JSX.Element

export type ModalTutoType={
    applicationData:applicationDataType,
    processFunctions:processFunctionsType,
    formations_menu: object,
    show_tuto:boolean,
    set_show_tuto:(b:boolean)=>void,
    Reinitialization:()=>void

  }
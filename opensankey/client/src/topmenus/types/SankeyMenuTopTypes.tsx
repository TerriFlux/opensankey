
import { MutableRefObject } from 'react'
import { TFunction } from 'i18next'

import {
  applicationDataType
} from '../../types/LegacyType'
import {
  dict_hook_ref_setter_show_dialog_componentsType
} from '../../types/MenuConfig'
import {
  Type_GenericApplicationDataOS
} from '../../types/TypesOS'
import {
  FType_SetDiagram
} from '../../configmenus/types/SankeyMenuBannerTypes'
import { FType_ProcessFunctions } from '../../types/FunctionTypes'

export type FType_OpenSankeyMenus = (
  Reinitialization: () => void,
  new_data: Type_GenericApplicationDataOS,
  external_edition_item: JSX.Element[],
  external_file_item: JSX.Element[],
  external_file_export_item: JSX.Element[],
  externale_save_item: JSX.Element[],
  externale_navbar_item: { [_: string]: JSX.Element },
  setDiagram: FType_SetDiagram,
) => { [s: string]: JSX.Element | JSX.Element[] }

export type SankeyModalWelcomeFType = {
  applicationData: applicationDataType,
  t: TFunction,
  active_page: string,
  // set_active_page : (_:string)=>void,
  never_see_again: MutableRefObject<boolean>,
  additional_shortcut_item: JSX.Element[],
  external_pagination: { [x: string]: JSX.Element },
  external_content: {
    read_me: string | JSX.Element | JSX.Element[];
    intro: JSX.Element;
    rc: JSX.Element;
    licence?: JSX.Element;
    news: JSX.Element;
    interface: JSX.Element;
  }
}

export type MenuDraggableFType = {
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  dialog_name: keyof dict_hook_ref_setter_show_dialog_componentsType,
  content: JSX.Element | JSX.Element[],
  title: string,
}

export type FCType_OpenSankeySaveButton = {
  new_data: Type_GenericApplicationDataOS,
}

export type FType_ModalResolutionPNG = (
  new_data: Type_GenericApplicationDataOS
) => JSX.Element

export type FCType_ModalTuto = {
  new_data: Type_GenericApplicationDataOS,
  processFunctions: FType_ProcessFunctions,
  formations_menu: object,
  show_tuto: boolean,
  set_show_tuto: (b: boolean) => void,
  Reinitialization: () => void
}
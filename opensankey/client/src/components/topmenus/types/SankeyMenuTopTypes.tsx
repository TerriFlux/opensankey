import {
  IType_DictHookRefSetterShowDialogComponents
} from '../../../types/MenuConfig'
import {
  Type_AdditionalMenus,
  Type_GenericApplicationData
} from '../../../types/Types'
import {
  FType_SetDiagram
} from '../../configmenus/types/SankeyMenuBannerTypes'
import {
  FType_ProcessFunctions
} from '../../../types/FunctionTypes'

export type FCType_MenuDraggable = {
  dict_hook_ref_setter_show_dialog_components: IType_DictHookRefSetterShowDialogComponents,
  dialog_name: keyof IType_DictHookRefSetterShowDialogComponents,
  content: JSX.Element | JSX.Element[],
  title: string,
}

export type FCType_OpenSankeySaveButton = {
  new_data: Type_GenericApplicationData,
}

export type FCType_ModalTuto = {
  new_data: Type_GenericApplicationData,
  processFunctions: FType_ProcessFunctions,
  show_tuto: boolean,
  set_show_tuto: (b: boolean) => void,
  Reinitialization: () => void
}


export type FType_OpenSankeyMenusDictBuilder = (
  Reinitialization: () => void,
  new_data: Type_GenericApplicationData,
  additional_menus: Type_AdditionalMenus,
  // external_edition_item: JSX.Element[],
  // external_file_item: JSX.Element[],
  // external_file_export_item: JSX.Element[],
  // externale_save_item: JSX.Element[],
  // externale_navbar_item: { [_: string]: JSX.Element },
  setDiagram: FType_SetDiagram,
) => { [s: string]: JSX.Element | JSX.Element[] }

export type FType_ModalResolutionPNG = (
  new_data: Type_GenericApplicationData
) => JSX.Element

export type FCtype_ModalTemplate = {
  new_data: Type_GenericApplicationData,
  additionalMenu: Type_AdditionalMenus,
  Reinitialization: () => void
}
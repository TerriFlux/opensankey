// ==================================================================================================
// Author : Julien ALAPETITE & Vincent LE DOZE & Vincent CLAVEL for TerriFlux
// All rights reserved for TerriFlux
//
// ==================================================================================================

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

export type FCType_MenuDraggable = {
  dict_hook_ref_setter_show_dialog_components: IType_DictHookRefSetterShowDialogComponents,
  dialog_name: keyof IType_DictHookRefSetterShowDialogComponents,
  content: JSX.Element | JSX.Element[],
  title: string,
}

export type FCType_OpenSankeySaveButton = {
  new_data: Type_GenericApplicationData,
}

export type FType_OpenSankeyMenusDictBuilder = (
  Reinitialization: () => void,
  new_data: Type_GenericApplicationData,
  additional_menus: Type_AdditionalMenus,
  setDiagram: FType_SetDiagram,
) => { [s: string]: JSX.Element | JSX.Element[] }


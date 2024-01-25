import { TFunction } from 'i18next'
import {  DictSetterInputValueType, PlusApplicationContextType, PlusElementsSelectedType, PlusUiElementsRefType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusLabel, SankeyPlusShowMenuComponentsType } from './Types'
import ReactQuill from 'react-quill'
import { contextMenuType, uiElementsRefType } from 'open-sankey/src/types/Types'

export type SankeyPlusMenuPreferenceLabelsFType=(
  t:TFunction,
  data:SankeyPlusData,
  set_data:(data:SankeyPlusData)=>void
) => JSX.Element

export interface selected_type  {'label':string;'value':string}

export type SankeyPlusMenuConfigurationFreeLabelsFType = {
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]},
  t: TFunction,
  is_activated:boolean,
  d_setter_input_value:DictSetterInputValueType,
  r_editor_ZDT:{current:ReactQuill}
}


export type context_zdtFType=(
  contextMenu:contextMenuType,
  t:TFunction,
  dict_variable_application_data:SankeyPlusApplicationDataType,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  dict_variable_elements_selected:PlusElementsSelectedType
) => JSX.Element

export type blur_ZDT_wysiwygFType=(
  r_editor_ZDT:{current:ReactQuill}
) =>void

export type zdtMenuAsAccordeonItemType=(
  data:SankeyPlusData,
  uiElementsRef:PlusUiElementsRefType,
  applicationContext:PlusApplicationContextType,
  content_menu_zdt:JSX.Element)=>JSX.Element
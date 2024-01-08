import { TFunction } from 'i18next'
import {  DictSetterInputValueType, PlusApplicationContextType, SankeyPlusData, SankeyPlusLabel, SankeyPlusShowMenuComponentsType } from './Types'
import ReactQuill from 'react-quill'
import { contextMenuType, uiElementsRefType } from 'open-sankey/src/types/Types'

export type SankeyPlusMenuPreferenceLabelsFType=(
  t:TFunction,
  data:SankeyPlusData,
  set_data:(data:SankeyPlusData)=>void
) => JSX.Element

export interface selected_type  {'label':string;'value':string}

export type SankeyPlusMenuConfigurationFreeLabelsFType = (
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]},
  t: TFunction,
  is_activated:boolean,
  d_setter_input_value:DictSetterInputValueType,
  refWysiwygZDT:{current:ReactQuill}
) => JSX.Element


export type context_zdtFType=(
  contextMenu:contextMenuType,
  t:TFunction,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType
) => JSX.Element

export type blur_ZDT_wysiwygFType=(
  refWysiwygZDT:{current:ReactQuill}
) =>void

export type zdtMenuAsAccordeonItemType=(
  data:SankeyPlusData,
  uiElementsRef:uiElementsRefType,
  applicationContext:PlusApplicationContextType,
  content_menu_zdt:JSX.Element)=>JSX.Element
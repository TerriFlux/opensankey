import { TFunction } from 'i18next'
import {  SankeyPlusData, SankeyPlusLabel } from './Types'
import ReactQuill from 'react-quill'
import { contextMenuType } from 'open-sankey/src/types/Types'
import { MutableRefObject } from 'react'

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
  ref_nav_item_active:MutableRefObject<string>,
  is_activated:boolean,
  menu_for_modal:boolean,
  editor_content_fo_zdt:string,
  set_editor_content_fo_zdt:(s:string)=>void,
  refWysiwygZDT:{current:ReactQuill}
) => JSX.Element


export type context_zdtFType=(
  contextMenu:contextMenuType,
  t:TFunction,
  set_show_menu_zdt:(b:boolean)=>void
) => JSX.Element

export type blur_ZDT_wysiwygFType=(
  refWysiwygZDT:{current:ReactQuill}
) =>void
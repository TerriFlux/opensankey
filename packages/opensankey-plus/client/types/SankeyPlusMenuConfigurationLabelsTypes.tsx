import { TFunction } from 'i18next'
import { SankeyPlusData, SankeyPlusLabel } from './Types'
import ReactQuill from 'react-quill'

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
  forceUpdate:boolean,
  setForceUpdate:(_:boolean)=>void,
  nav_item_active:string,
  set_nav_item_active:(_:string)=>void,
  is_activated:boolean,
  menu_for_modal:boolean,
  editor_content_fo_zdt:string,
  set_editor_content_fo_zdt:(s:string)=>void,
  refWysiwygZDT:{current:ReactQuill}
) => JSX.Element


export type context_zdtFType=(
  show_context_zdt:boolean,
  set_show_context_zdt:(b:boolean)=>void,
  pointer_pos:{current:number[]},
  t:TFunction,
  set_show_menu_zdt:(b:boolean)=>void
) => JSX.Element

export type blur_ZDT_wysiwygFType=(
  refWysiwygZDT:{current:ReactQuill}
) =>void
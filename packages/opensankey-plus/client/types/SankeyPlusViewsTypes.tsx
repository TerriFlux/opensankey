import { TFunction } from 'i18next'
import { SankeyPlusData, SankeyPlusLabel, SankeyPlusLink, SankeyPlusNode, ViewType } from './Types'
import { SankeyLinkValueDict, TagsGroup } from 'open-sankey/src/types/Types'

export type setDiagramFType = (
  set_master_data: (d:SankeyPlusData | undefined)=>void,
  set_view: (s:string)=>void,
  DefaultSankeyData: ()=>SankeyPlusData
) => void

export type view_toastFType = JSX.Element

export type view_toast_update_viewFType = JSX.Element

export type setValueFType = (
  dataTags: TagsGroup[],
  v_target: SankeyLinkValueDict,
  v_source: SankeyLinkValueDict,
  depth: number
) => void

export type get_data_from_viewFType =(
  master_data:SankeyPlusData,
  id_view_to_see:string
)=> SankeyPlusData | undefined

export type filter_viewFType = (
  pre_diff:{path:string[],kind:string,item:{kind:string}}[]
) => {path:string[],kind:string,item:{kind:string}}

export type recompute_viewsFType = (
  new_master_data: SankeyPlusData,
  prev_master_data: SankeyPlusData,
  set_master_data: (d:SankeyPlusData)=>void
) => void

export type keyHandlerFType = (
  t:TFunction,
  e: KeyboardEvent,
  master:boolean,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  view:string,
  set_view:(_:string)=>void,
  multi_selected_labels:{current:SankeyPlusLabel[]},
  set_show_toast_new_view:(_:boolean)=>void,
  set_show_toast_updated_view:(_:boolean)=>void,
  connected:boolean,
  set_view_not_saved:(s:string)=>void,
) => void

export type selecteur_viewFType = (
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  set_view_not_saved:(s:string)=>void,
  connected:boolean,
  value_editor_name_view:string,
  set_value_editor_name_view:(s:string)=>void,
  select_or_edit:'select'|'edit',
  set_select_or_edit:(s:'select'|'edit')=>void
  // fullscreen=false
) => JSX.Element

export type viewsAccordionFType = (
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  nav_item_active: string,
  set_nav_item_active: (s:string)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  _load_json:{current:HTMLInputElement},
  t:TFunction,
  is_activated:boolean,
  set_view_not_saved:(s:string)=>void,
  convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void,
  value_editor_name_view:string,
  set_value_editor_name_view:(s:string)=>void,
  select_or_edit:'select'|'edit',
  set_select_or_edit:(s:'select'|'edit')=>void,
  DefaultSankeyData: ()=>SankeyPlusData
) => JSX.Element

// Function to check if the current data of the view is unsaved
// We compare the differences saved in the master_data with the current changement of the view
export type check_current_view_savedFType = (
  master_data:SankeyPlusData,
  data:SankeyPlusData,
  view:string
)=> string[]

// Function that return a toolbar to navigate,create or modify view, it contain :
// - a button to return to master data
// - a button to create a view if we are currently on master data
// - 2 button to navigate in the list of view
// - a dropdown to directly select the view we want to display (or select master data)
// Then if we are in a view there is additionnal button
// - a button to choose variable of the view that get their value from master
// - a button to clone the actual view
// a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'Type de noeud'
export type SankeyPlusBannerViewFType = (
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  connected:boolean,
  set_view_not_saved:(s:string)=>void,
  _load_json:{current:HTMLInputElement},
  _load_json_catalog:{current:HTMLInputElement},
  set_show_modal_transparent_view_attr:(b:boolean)=>void,
  value_editor_name_view:string,
  set_value_editor_name_view:(s:string)=>void,
  select_or_edit:'select'|'edit',
  set_select_or_edit:(s:'select'|'edit')=>void,
  convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void,
  DefaultSankeyData: ()=>SankeyPlusData,
)=> JSX.Element

export type SankeyPlusMenuPreferenceViewFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  preferenceCheck:(str: string, data: SankeyPlusData) => void
) => JSX.Element

// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export type modal_view_not_savedFType = (view_not_saved:string,set_view_not_saved:(s:string)=>void,t:TFunction,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string
)=> JSX.Element

export type modal_transparent_view_attrFType = (show_modal_transparent_view_attr:boolean,
  set_show_modal_transparent_view_attr:(b:boolean)=>void,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  current_view:ViewType,
  t:TFunction
)=> JSX.Element

export type MenuEnregistrerViewFType = (
  master_data:SankeyPlusData,
  t:TFunction,
  save_only_view:boolean,
  set_save_only_view:(b:boolean)=>void
)=> JSX.Element

export type OpenSankeyPlusCheckpointButtonFType = (
  master_data:SankeyPlusData,
  data:SankeyPlusData,
  view:string, 
  view_not_saved:string,
  connected:boolean,
  t:TFunction
)=> JSX.Element

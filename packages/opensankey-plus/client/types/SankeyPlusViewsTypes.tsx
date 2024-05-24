import { TFunction } from 'i18next'
import { Diff } from 'deep-diff'

import {
  OSPApplicationContextType,
  OSPComponentUpdaterType,
  OSPElementsSelectedType,
  OSPApplicationDataType,
  OSPData,
  OSPShowMenuComponentsType,
  reDrawOSPLabelsFType
} from './Types'

import {
  SankeyLinkValueDict,
  TagsGroup} from 'open-sankey/src/types/Types'
import {
  setDiagramFuncType
} from 'open-sankey/src/configmenus/types/SankeyMenuBannerTypes'


export type getSetDiagramFType = (
  set_master_data: (d:OSPData | undefined)=>void,
  set_view: (s:string)=>void,
  DefaultSankeyData: ()=>OSPData
) => setDiagramFuncType

export type ViewToastFType = {
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType
}

export type ViewToast_update_viewFType = {
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType
}

export type setValueFType = (
  dataTags: TagsGroup[],
  v_target: SankeyLinkValueDict,
  v_source: SankeyLinkValueDict,
  depth: number
) => void

export type GetDataFromViewFType =(
  master_data:OSPData| undefined,
  id_view_to_see:string
)=> OSPData | undefined

export type FilterViewFType = (
  pre_diff:Diff<undefined | OSPData, OSPData>[]
) => Diff<undefined | OSPData, OSPData>[]

export type RecomputeViewsFType = (
  new_master_data: OSPData | undefined,
  prev_master_data: OSPData | undefined,
  set_master_data: (d:OSPData | undefined)=>void
) => void

export type OSPKeyHandlerFType = (
  applicationContext:OSPApplicationContextType,
  e: KeyboardEvent,
  applicationData:OSPApplicationDataType,
  applicationState:OSPElementsSelectedType,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  reDrawOSPLabels:reDrawOSPLabelsFType,
  ComponentUpdater:OSPComponentUpdaterType
) => void

export type SelecteurViewFType = {
  applicationData:OSPApplicationDataType,
  applicationState:OSPElementsSelectedType,
  t:TFunction,
  set_view_not_saved:(s:string)=>void,
  connected:boolean,
}

export type viewsAccordionFType = (
  applicationData:OSPApplicationDataType,
  t:TFunction,
  is_activated:boolean,
  convert_data:(d:OSPData,DefaultSankeyData: ()=>OSPData)=>void,
  DefaultSankeyData: ()=>OSPData,
  view_selector:JSX.Element,
) => JSX.Element

// Function to check if the current data of the view is unsaved
// We compare the differences saved in the master_data with the current changement of the view
export type CheckCurrentViewSavedFType = (
  master_data: OSPData | undefined,
  data: OSPData,
  view: string
) => Diff<OSPData | undefined, OSPData | undefined>[]

// Function that return a toolbar to navigate,create or modify view, it contain :
// - a button to return to master data
// - a button to create a view if we are currently on master data
// - 2 button to navigate in the list of view
// - a dropdown to directly select the view we want to display (or select master data)
// Then if we are in a view there is additionnal button
// - a button to choose variable of the view that get their value from master
// - a button to clone the actual view
// a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'Type de noeud'
export type OSPBannerViewFType = {
  applicationData:OSPApplicationDataType,
  applicationContext:OSPApplicationContextType,
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  convert_data:(d:OSPData,DefaultSankeyData: ()=>OSPData)=>void,
  view_selector:JSX.Element
}

export type OSPMenuPreferenceViewFType = (
  t:TFunction,
  data:OSPData,
  set_data:(_:OSPData)=>void,
  preferenceCheck:(str: string, data: OSPData) => void
) => JSX.Element

// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export type modal_view_not_savedFType = (view_not_saved:string,set_view_not_saved:(s:string)=>void,t:TFunction,
  applicationData:OSPApplicationDataType
)=> JSX.Element

export type modal_transparent_view_attrFType = (
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType,
  applicationData:OSPApplicationDataType,
  t:TFunction
)=> JSX.Element

export type MenuEnregistrerViewFType = {
  t:TFunction,
  elementsSelected: OSPElementsSelectedType
}

export type OpenOSPCheckpointButtonFType = (
  master_data:OSPData| undefined,
  data:OSPData,
  view:string,
  view_not_saved:string,
  connected:boolean,
  t:TFunction
)=> JSX.Element

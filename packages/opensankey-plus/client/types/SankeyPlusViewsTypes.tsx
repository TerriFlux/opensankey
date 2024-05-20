import { TFunction } from 'i18next'
import { Diff } from 'deep-diff'

import {
  PlusApplicationContextType,
  PlusComponentUpdaterType,
  PlusElementsSelectedType,
  SankeyPlusApplicationDataType,
  SankeyPlusData,
  SankeyPlusShowMenuComponentsType,
  reDrawPlusLabelsFType
} from './Types'

import {
  SankeyLinkValueDict,
  TagsGroup} from 'open-sankey/src/types/Types'
import {
  setDiagramFuncType
} from 'open-sankey/src/configmenus/types/SankeyMenuBannerTypes'


export type getSetDiagramFType = (
  set_master_data: (d:SankeyPlusData | undefined)=>void,
  set_view: (s:string)=>void,
  DefaultSankeyData: ()=>SankeyPlusData
) => setDiagramFuncType

export type ViewToastFType = {
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType
}

export type ViewToast_update_viewFType = {
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType
}

export type setValueFType = (
  dataTags: TagsGroup[],
  v_target: SankeyLinkValueDict,
  v_source: SankeyLinkValueDict,
  depth: number
) => void

export type GetDataFromViewFType =(
  master_data:SankeyPlusData| undefined,
  id_view_to_see:string
)=> SankeyPlusData | undefined

export type FilterViewFType = (
  pre_diff:Diff<undefined | SankeyPlusData, SankeyPlusData>[]
) => Diff<undefined | SankeyPlusData, SankeyPlusData>[]

export type RecomputeViewsFType = (
  new_master_data: SankeyPlusData | undefined,
  prev_master_data: SankeyPlusData | undefined,
  set_master_data: (d:SankeyPlusData | undefined)=>void
) => void

export type OSPKeyHandlerFType = (
  applicationContext:PlusApplicationContextType,
  e: KeyboardEvent,
  dict_variable_application_data:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  reDrawPlusLabels:reDrawPlusLabelsFType,
  ComponentUpdater:PlusComponentUpdaterType
) => void

export type SelecteurViewFType = {
  dict_variable_application_data:SankeyPlusApplicationDataType,
  dict_variable_elements_selected:PlusElementsSelectedType,
  t:TFunction,
  set_view_not_saved:(s:string)=>void,
  connected:boolean,
}

export type viewsAccordionFType = (
  dict_variable_application_data:SankeyPlusApplicationDataType,
  t:TFunction,
  is_activated:boolean,
  convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void,
  DefaultSankeyData: ()=>SankeyPlusData,
  view_selector:JSX.Element,
) => JSX.Element

// Function to check if the current data of the view is unsaved
// We compare the differences saved in the master_data with the current changement of the view
export type CheckCurrentViewSavedFType = (
  master_data: SankeyPlusData | undefined,
  data: SankeyPlusData,
  view: string
) => Diff<SankeyPlusData | undefined, SankeyPlusData | undefined>[]

// Function that return a toolbar to navigate,create or modify view, it contain :
// - a button to return to master data
// - a button to create a view if we are currently on master data
// - 2 button to navigate in the list of view
// - a dropdown to directly select the view we want to display (or select master data)
// Then if we are in a view there is additionnal button
// - a button to choose variable of the view that get their value from master
// - a button to clone the actual view
// a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'Type de noeud'
export type SankeyPlusBannerViewFType = {
  dict_variable_application_data:SankeyPlusApplicationDataType,
  applicationContext:PlusApplicationContextType,
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  convert_data:(d:SankeyPlusData,DefaultSankeyData: ()=>SankeyPlusData)=>void,
  view_selector:JSX.Element
}

export type SankeyPlusMenuPreferenceViewFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  preferenceCheck:(str: string, data: SankeyPlusData) => void
) => JSX.Element

// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export type modal_view_not_savedFType = (view_not_saved:string,set_view_not_saved:(s:string)=>void,t:TFunction,
  dict_variable_application_data:SankeyPlusApplicationDataType
)=> JSX.Element

export type modal_transparent_view_attrFType = (
  dict_hook_ref_setter_show_dialog_components:SankeyPlusShowMenuComponentsType,
  dict_variable_application_data:SankeyPlusApplicationDataType,
  t:TFunction
)=> JSX.Element

export type MenuEnregistrerViewFType = {
  t:TFunction,
  elementsSelected: PlusElementsSelectedType
}

export type OpenSankeyPlusCheckpointButtonFType = (
  master_data:SankeyPlusData| undefined,
  data:SankeyPlusData,
  view:string,
  view_not_saved:string,
  connected:boolean,
  t:TFunction
)=> JSX.Element

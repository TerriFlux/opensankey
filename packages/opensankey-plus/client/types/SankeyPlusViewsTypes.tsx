import {
  OSPApplicationDataType,
  OSPShowMenuComponentsType,
} from './Types'

import {
  setDiagramFuncType
} from '../src/deps/OpenSankey/configmenus/types/SankeyMenuBannerTypes'
import { Type_GenericApplicationDataOSP } from '../src/types/TypesOSP'


export type ViewToastFType = {
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType
}

export type ViewToast_update_viewFType = {
  dict_hook_ref_setter_show_dialog_components:OSPShowMenuComponentsType
}

export type SelecteurViewFType = {
  new_data:Type_GenericApplicationDataOSP
}

export type viewsAccordionFType = {
  applicationData:OSPApplicationDataType,
}

/**
 * Fucntion that return a toolbar to navigate,create or modify view, it contain :
 * - a button to return to master data
 * - a button to create a view if we are currently on master data
 * - 2 button to navigate in the list of view
 * - a dropdown to directly select the view we want to display (or select master data)
 * Then if we are in a view there is additionnal button
 * - a button to choose variable of the view that get their value from master
 * - a button to clone the actual view
 * a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'Type de noeud'
 *
 * @param {*} {
 *   applicationData,
 *   applicationContext,
 *   dict_hook_ref_setter_show_dialog_components,
 *   convert_data,
 *   view_selector
 * }
 * @return {*}
 */
export type OSPBannerViewFType = {
  applicationData:OSPApplicationDataType
}

export type OSPMenuPreferenceViewFType = {
  applicationData:OSPApplicationDataType
}

// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export type modal_view_not_savedFType = {
  applicationData:OSPApplicationDataType
}

export type modal_transparent_view_attrFType = {
  applicationData: OSPApplicationDataType,
}

export type MenuEnregistrerViewFType = {
applicationData:OSPApplicationDataType
}

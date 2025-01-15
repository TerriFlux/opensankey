import { Type_GenericApplicationDataOSP } from '../../../types/TypesOSP'

export type FCType_SelecteurView = {
  new_data_plus: Type_GenericApplicationDataOSP
}

export type FCType_ViewAccordion = {
  new_data_plus: Type_GenericApplicationDataOSP
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
 * a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'type de noeud'
 *
 * @param {*} {
 *  new_data_plus
 * }
 * @return {*}
 */
export type FCType_BannerViewsOSP = {
  new_data_plus: Type_GenericApplicationDataOSP
}

export type FCType_MenuPreferenceViewOSP = {
  new_data_plus: Type_GenericApplicationDataOSP
}

// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export type FCType_ModalViewNotSavedOSP = {
  new_data_plus: Type_GenericApplicationDataOSP
}

export type FCType_ModalTransparentViewAttrOSP = {
  new_data_plus: Type_GenericApplicationDataOSP
}

export type FCType_MenuEnregistrerViewOSP = {
  new_data_plus: Type_GenericApplicationDataOSP
}

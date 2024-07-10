import { MutableRefObject } from 'react'
import {
  ComponentUpdaterType,
  LinkFunctionTypes,
  NodeFunctionTypes,
  applicationContextType, dict_hook_ref_setter_show_dialog_componentsType, applicationDataType, applicationStateType
} from '../../types/Types'

export type SankeyModalStyleNodeFType = {
    applicationContext:applicationContextType,
    applicationData:applicationDataType,
    applicationState:applicationStateType,
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
    ComponentUpdater:ComponentUpdaterType,
    pointer_pos:{current:number[]},
    node_attribute_tab:JSX.Element,
}

//Modal et fonctions pour l'edition et affectation des style de flux
export type SankeyModalStyleLinkFType = {
    applicationContext:applicationContextType,
    applicationData:applicationDataType,
    applicationState:applicationStateType,
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
    pointer_pos:{current:number[]},
    additional_link_appearence_items:JSX.Element[],
    ComponentUpdater:ComponentUpdaterType,
}


import { MutableRefObject } from 'react'
import { 
  ComponentUpdaterType,
  LinkFunctionTypes,
  NodeFunctionTypes,
  applicationContextType, dict_hook_ref_setter_show_dialog_componentsType, applicationDataType, dict_variable_elements_selectedType 
} from '../../types/Types'

export type SankeyModalStyleNodeFType = {
    applicationContext:applicationContextType,
    applicationData:applicationDataType,
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
    ref_selected_style_node:MutableRefObject<string>,
    ComponentUpdater:ComponentUpdaterType,
    node_function:NodeFunctionTypes,
    pointer_pos:{current:number[]},
    node_attribute_tab:JSX.Element,
}

//Modal et fonctions pour l'edition et affectation des style de flux
export type SankeyModalStyleLinkFType = {
    applicationContext:applicationContextType,
    applicationData:applicationDataType,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
    pointer_pos:{current:number[]},
    additional_link_appearence_items:JSX.Element[],
    link_function:LinkFunctionTypes,
    ComponentUpdater:ComponentUpdaterType,
}


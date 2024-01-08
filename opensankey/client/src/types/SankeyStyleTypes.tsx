import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { 
  applicationContextType, dict_variable_application_dataType, dict_variable_elements_selectedType 
} from './Types'

export type SankeyModalStyleNodeFType = (
    applicationContext:applicationContextType,
    dict_variable_application_data:dict_variable_application_dataType,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    ref_show_style_node:MutableRefObject<Dispatch<SetStateAction<boolean>>>,
    ref_selected_style_node:MutableRefObject<string>,
    additional_node_attribute:JSX.Element[]
) => JSX.Element

//Modal et fonctions pour l'edition et affectation des style de flux
export type SankeyModalStyleLinkFType = (
    applicationContext:applicationContextType,
    dict_variable_application_data:dict_variable_application_dataType,
    dict_variable_elements_selected:dict_variable_elements_selectedType,
    ref_show_style_link: MutableRefObject<Dispatch<SetStateAction<boolean>>>,
    additional_link_appearence_items:JSX.Element[]
) => JSX.Element


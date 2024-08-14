import {
  applicationDataType
} from '../../types/LegacyType'

export type SankeyModalStyleNodeFType = {
    
    applicationData:applicationDataType,
    node_attribute_tab:JSX.Element,
}

//Modal et fonctions pour l'edition et affectation des style de flux
export type SankeyModalStyleLinkFType = {
    
    applicationData:applicationDataType,
    additional_link_appearence_items:JSX.Element[],
}


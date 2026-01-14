
// import { LinkAttributeKey, LinkAttributeTypes, NodeAttributeKey, NodeAttributeTypes} from "./ElementsAttributesConfig"

import { ALL_ATTRIBUTES_CONFIG, ExtractConfigValue } from './ElementsAttributesConfig'


type ElementStyleConfig = Partial<{
  [K in keyof typeof ALL_ATTRIBUTES_CONFIG]: ExtractConfigValue<typeof ALL_ATTRIBUTES_CONFIG[K]>
}>

// Type pour les propriétés de position
// interface ElementStylePosition {
//   type?: 'relative' | 'parametric' | 'absolute'
//   dx?: number
//   dy?: number
// }

// Type pour un élément de configuration de style (sans id)
interface ElementStyleConfigItem {
  name: string,
  config: ElementStyleConfig
  //position?: ElementStylePosition
}

// Type pour le dictionnaire complet
export type ElementStyleConfigsDict = Record<string, ElementStyleConfigItem>



export const elementStyleConfigs: ElementStyleConfigsDict = {
  NodeStyle: {
    name: 'Style de noeud par défaut',
    config: { 
      'name_label_is_visible': true,
      //'value_label_is_visible': false 
    }
  },
  LinkStyle: {
    name: 'Style de flux par défaut',
    config: { 
      //'name_label_is_visible': false,
      'name_label_background_visible': false,
      'name_label_vert': 'top',
      'name_label_font_size': 20,
      'value_label_is_visible': true,
      'value_label_vert': 'middle',
      'value_label_font_size': 20
    }
  },
  ContainerStyle: {
    name: 'Style de container par défaut',
    config: { 
      'name_label_font_family': 'Arial,sans-serif',
      'name_label_is_visible': true,
      'name_label_inside_vert': true,
      'name_label_vert': 'top',      
      'shape_color':'white',
      'shape_border_visible': true,
      'shape_border_radius': 5,      
      'value_label_is_visible': false,
      'shape_min_height': 100,
      'shape_min_width': 100     
    }
  },  
  NodeProductStyle: {
    name: 'Produit',
    config: { 'shape_type': 'ellipse' }
  },
  NodeSectorStyle: {
    name: 'Secteur',
    config: { 'shape_type': 'rect' }
  },
  NodeImportExportCloseStyle: {
    name: 'Import export collés',
    config: {
      'name_label_is_visible': false,
      'shape_visible': false,
      'shape_min_width': 1,
      'name_label_box_width': 300,
      'name_label_separator': ' - ',
      'name_label_separator_part': 'before',
      'position_type': 'relative',
      'position_dy': 20,
    }
  },
  NodeImportExportAboveBelowStyle: {
    name: 'Import export dessus dessous',
    config: {
      'shape_min_width': 40,
      'name_label_is_visible': true,
      'shape_visible': false,
      'shape_min_height': 1,
      'value_label_is_visible': true,
      'value_label_vert': 'middle',
      'name_label_vert': 'middle',
      'name_label_separator': ' - ',
      'position_type': 'parametric'
    }
  },
  NodeImportCloseStyle: {
    name: 'Import collés',
    config: {
      'position_dx': -100,
      'position_dy': -50
    }
  },
  NodeImportAboveStyle: {
    name: 'Import au dessus',
    config: {
      'name_label_horiz': 'left',
      'value_label_horiz': 'left',
      'value_label_horiz_shift': 40,
      'position_dx': -200,
      'position_dy': 20
    }
  },
  NodeExportCloseStyle: {
    name: 'Export collés',
    config: {
      'name_label_vert': 'bottom',
      'position_dx': 100,
      'position_dy': 50
    }
  },
  NodeExportBelowStyle: {
    name: 'Export au dessous',
    config: {
      'name_label_horiz': 'right',
      'value_label_horiz': 'right',
      'value_label_horiz_shift': -40,
      'position_dx': 200,
      'position_dy': 20
    }
  },
  NodeUnitaryStyle: {
    name: 'Unitaire',
    config: {
      'name_label_is_visible': false
    }
  },
  SankeyUnitaryElementStyle: {
    name: 'Unitaire',
    config: {
      name_label_horiz: 'middle',
      name_label_vert: 'bottom',
      name_label_font_size: 40,
      shape_min_width: 200,
      shape_type: 'rect',
      name_label_bold: true,
      name_label_uppercase: true,
      name_label_box_width: 1000,
      position_dx: 300
    }
  },
  SankeyUnitaryNodeInputStyle: {
    name: 'Unitaire entrée',
    config: {
      name_label_horiz: 'left',
      name_label_vert: 'middle',
      name_label_font_size: 40,
      shape_min_width: 1,
      shape_min_height: 1,
      shape_visible: false,
      name_label_box_width: 1000,
      position_dx: 300
    }
  },
  SankeyUnitaryNodeOutputStyle: {
    name: 'Unitaire sortie',
    config: {
      name_label_horiz: 'right',
      name_label_vert: 'middle',
      name_label_font_size: 40,
      shape_min_width: 1,
      shape_min_height: 1,
      shape_visible: false,
      name_label_box_width: 1000,
      position_dx: 300
    }
  } as const,
  LinkInUnitaryStyle: {
    name: 'close import',
    config: {
      value_label_font_size: 40,
      value_label_bold: true,
      value_label_horiz: 'left',
      value_label_pos_auto: true,
      value_label_unit_visible: true,
      value_label_unit_type: '%OD',
      value_label_significant_digits: true,
      value_label_nb_significant_digits: 3
    }
  } as const,
  LinkOutUnitaryStyle: {
    name: 'close import',
    config: {
      value_label_font_size: 40,
      value_label_bold: true,
      value_label_horiz: 'right',
      value_label_pos_auto: true,
      value_label_unit_visible: true,
      value_label_unit_type: '%IS',
      value_label_significant_digits: true,
      value_label_nb_significant_digits: 3
    }
  } as const,
  LinkImportExportCloseStyle: {
    name: 'close import export',
    config: {
      'value_label_is_visible': true,
      'value_label_on_path': true,
    }
  },
  LinkImportCloseStyle: {
    name: 'close import',
    config: {
      'shape_orientation': 'vh',
      'shape_starting_tangeant': 1,
      'shape_ending_tangeant': 0.25
    }
  },
  LinkExportCloseStyle: {
    name: 'close import',
    config: {
      'shape_orientation': 'hv',
      'shape_starting_tangeant': 0.25,
      'shape_ending_tangeant': 1
    }
  },
  LinkImportExportAboveBelowStyle: {
    name: 'close import',
    config: {
      'shape_starting_curve': 0.25,
      'shape_starting_tangeant': 0.50,
      'shape_ending_tangeant': 0.50,
      'shape_ending_curve': 0.25,
      'value_label_is_visible': false,
      'value_label_on_path': true
    }
  },
  LinkImportAboveStyle: {
    name: 'close import',
    config: {}
  },
  LinkExportBelowStyle: {
    name: 'close import',
    config: {}
  },

}

export type ElementStyleKey = keyof typeof elementStyleConfigs
export const base_styles : readonly ElementStyleKey[] = ['NodeStyle', 'LinkStyle', 'ContainerStyle'] as const

export const product_sector_styles: readonly ElementStyleKey[] = ['NodeProductStyle', 'NodeSectorStyle'] as const
export const node_exchanges_style: readonly ElementStyleKey[] = [
  'NodeExportBelowStyle', 'NodeExportCloseStyle', 'NodeImportAboveStyle', 'NodeImportCloseStyle',
  'NodeImportExportAboveBelowStyle', 'NodeImportExportCloseStyle'
] as const
export const node_unitary_styles: readonly ElementStyleKey[] = [
  'SankeyUnitaryNodeOutputStyle', 'SankeyUnitaryNodeInputStyle', 'SankeyUnitaryElementStyle'] as const

export const link_exchanges_style: readonly ElementStyleKey[] = [
  'LinkImportExportAboveBelowStyle', 'LinkExportCloseStyle', 'LinkImportCloseStyle', 'LinkImportExportCloseStyle',
  'LinkImportAboveStyle', 'LinkExportBelowStyle'
] as const
export const link_unitary_styles: readonly ElementStyleKey[] = [
  'LinkInUnitaryStyle', 'LinkOutUnitaryStyle'
] as const

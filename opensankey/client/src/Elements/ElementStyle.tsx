import { ALL_ATTRIBUTES_CONFIG, ExtractConfigValue } from './ElementsAttributesConfig'

type ElementStyleConfig = Partial<{
  [K in keyof typeof ALL_ATTRIBUTES_CONFIG]: ExtractConfigValue<typeof ALL_ATTRIBUTES_CONFIG[K]>
}>

interface ElementStyleConfigItem {
  name: string,
  config: ElementStyleConfig
}

// Définir toutes les clés de styles comme constantes
export const NodeStyle = 'NodeStyle' as const
export const LinkStyle = 'LinkStyle' as const
export const ContainerStyle = 'ContainerStyle' as const
export const NodeProductStyle = 'NodeProductStyle' as const
export const NodeSectorStyle = 'NodeSectorStyle' as const
export const NodeImportExportCloseStyle = 'NodeImportExportCloseStyle' as const
export const NodeImportCloseStyle = 'NodeImportCloseStyle' as const
export const NodeExportCloseStyle = 'NodeExportCloseStyle' as const
export const NodeImportExportAboveBelowStyle = 'NodeImportExportAboveBelowStyle' as const
export const NodeImportAboveStyle = 'NodeImportAboveStyle' as const
export const NodeExportBelowStyle = 'NodeExportBelowStyle' as const
export const LinkImportExportCloseStyle = 'LinkImportExportCloseStyle' as const
export const LinkImportCloseStyle = 'LinkImportCloseStyle' as const
export const LinkExportCloseStyle = 'LinkExportCloseStyle' as const
export const LinkImportExportAboveBelowStyle = 'LinkImportExportAboveBelowStyle' as const
export const NodeUnitaryStyle = 'NodeUnitaryStyle' as const
export const SankeyUnitaryNodeStyle = 'SankeyUnitaryNodeStyle' as const
export const SankeyUnitaryNodeInputStyle = 'SankeyUnitaryNodeInputStyle' as const
export const SankeyUnitaryNodeOutputStyle = 'SankeyUnitaryNodeOutputStyle' as const
export const LinkInUnitaryStyle = 'LinkInUnitaryStyle' as const
export const LinkOutUnitaryStyle = 'LinkOutUnitaryStyle' as const

// Type union de toutes les clés
export type ElementStyleKey =
  | typeof NodeStyle
  | typeof LinkStyle
  | typeof ContainerStyle
  | typeof NodeProductStyle
  | typeof NodeSectorStyle
  | typeof NodeImportExportCloseStyle
  | typeof NodeImportCloseStyle
  | typeof NodeExportCloseStyle
  | typeof NodeImportExportAboveBelowStyle
  | typeof NodeImportAboveStyle
  | typeof NodeExportBelowStyle
  | typeof LinkImportExportCloseStyle
  | typeof LinkImportCloseStyle
  | typeof LinkExportCloseStyle
  | typeof LinkImportExportAboveBelowStyle
  | typeof NodeUnitaryStyle
  | typeof SankeyUnitaryNodeStyle
  | typeof SankeyUnitaryNodeInputStyle
  | typeof SankeyUnitaryNodeOutputStyle
  | typeof LinkInUnitaryStyle
  | typeof LinkOutUnitaryStyle

export type ElementStyleConfigsDict = Record<ElementStyleKey, ElementStyleConfigItem>
export const elementStyleConfigs = {} as ElementStyleConfigsDict

elementStyleConfigs[NodeStyle] = {
  name: 'Style de noeud par défaut',
  config: {
    'name_label_is_visible': true,
  }
}

elementStyleConfigs[LinkStyle] = {
  name: 'Style de flux par défaut',
  config: {
    'name_label_background_visible': false,
    'name_label_vert': 'top',
    'name_label_font_size': 20,
    'value_label_is_visible': true,
    'value_label_vert': 'middle',
    'value_label_font_size': 20
  }
}

elementStyleConfigs[ContainerStyle] = {
  name: 'Style de container par défaut',
  config: {
    'name_label_is_visible': true,
    'name_label_inside_vert': true,
    'name_label_vert': 'top',
    'shape_color': 'white',
    'shape_border_visible': true,
    'shape_border_radius': 5,
    'value_label_is_visible': false,
    'shape_min_height': 100,
    'shape_min_width': 100
  }
}

elementStyleConfigs[NodeProductStyle] = {
  name: 'Noeud produit',
  config: { 'shape_type': 'ellipse' }
}

elementStyleConfigs[NodeSectorStyle] = {
  name: 'Noeud secteur',
  config: { 'shape_type': 'rect' }
}

elementStyleConfigs[NodeImportExportCloseStyle] = {
  name: 'Noeud import export collé',
  config: {
    'name_label_is_visible': false,
    'shape_visible': false,
    'shape_min_width': 1,
    'name_label_box_width': 300,
    'name_label_separator': ' - ',
    'name_label_separator_part': 'before',
    'shape_position_type': 'relative',
    'shape_position_dy': 20,
  }
}

elementStyleConfigs[NodeImportCloseStyle] = {
  name: 'Noeud import collés',
  config: {
    'shape_position_dx': -100,
    'shape_position_dy': -50
  }
}

elementStyleConfigs[NodeExportCloseStyle] = {
  name: 'Noeud export collé',
  config: {
    'name_label_vert': 'bottom',
    'shape_position_dx': 100,
    'shape_position_dy': 50,
    'shape_orientation': 'hv',
    'shape_starting_tangeant': 0.25,
    'shape_ending_tangeant': 1
  }
}

elementStyleConfigs[NodeImportExportAboveBelowStyle] = {
  name: 'Noeud import export dessus dessous',
  config: {
    'shape_min_width': 40,
    'name_label_is_visible': true,
    'shape_visible': false,
    'shape_min_height': 1,
    'value_label_is_visible': true,
    'value_label_vert': 'middle',
    'name_label_vert': 'middle',
    'name_label_separator': ' - ',
    'shape_position_type': 'parametric'
  }
}

elementStyleConfigs[NodeImportAboveStyle] = {
  name: 'Noeud import au dessus',
  config: {
    'name_label_horiz': 'left',
    'value_label_horiz': 'left',
    'value_label_horiz_shift': 40,
    'shape_position_dx': -200,
    'shape_position_dy': 20,
    'shape_orientation': 'vh',
    'shape_starting_tangeant': 1,
    'shape_ending_tangeant': 0.25
  }
}

elementStyleConfigs[NodeExportBelowStyle] = {
  name: 'Noeud export au dessous',
  config: {
    'name_label_horiz': 'right',
    'value_label_horiz': 'right',
    'value_label_horiz_shift': -40,
    'shape_position_dx': 200,
    'shape_position_dy': 20
  }
}

elementStyleConfigs[LinkImportExportCloseStyle] = {
  name: 'Flux import export collé',
  config: {
    'shape_orientation': 'hv',
    'value_label_is_visible': true,
    'value_label_on_path': true,
  }
}

elementStyleConfigs[LinkImportCloseStyle] = {
  name: 'Flux import collé',
  config: {
    'shape_orientation': 'vh',
    'value_label_is_visible': true,
    'value_label_on_path': true,
    'value_label_horiz': 'right',
    'value_label_vert': 'middle'
  }
}

elementStyleConfigs[LinkExportCloseStyle] = {
  name: 'Flux export collé',
  config: {
    'shape_orientation': 'hv',
    'value_label_is_visible': true,
    'value_label_on_path': true,
    'value_label_horiz': 'left',
    'value_label_vert': 'middle'
  }
}

elementStyleConfigs[LinkImportExportAboveBelowStyle] = {
  name: 'Flux export haut bas',
  config: {
    'shape_starting_curve': 0.25,
    'shape_starting_tangeant': 0.50,
    'shape_ending_tangeant': 0.50,
    'shape_ending_curve': 0.25,
    'value_label_is_visible': false,
    'value_label_on_path': true
  }
}

elementStyleConfigs[SankeyUnitaryNodeStyle] = {
  name: 'Unitaire noeud',
  config: {
    name_label_text_align: 'middle',
    name_label_horiz: 'middle',
    name_label_vert: 'bottom',
    name_label_font_size: 40,

    shape_min_width: 200,
    shape_color_visible: false,
    shape_border_visible: true,
    shape_border_color: 'black',
    shape_border_thickness: 3,
    shape_border_dashed: true,
    name_label_bold: true,
    name_label_uppercase: true,
    name_label_box_width: 350,
    name_label_background_visible: false,

    shape_position_dx: 500
  }
}

elementStyleConfigs[SankeyUnitaryNodeInputStyle] = {
  name: 'Unitaire noeud entrée',
  config: {
    name_label_horiz: 'left',
    name_label_vert: 'middle',
    name_label_text_align: 'right',
    name_label_font_size: 40,
    shape_min_width: 1,
    shape_min_height: 1,
    shape_visible: false,
    name_label_box_width: 500,
    shape_position_dx: 500,
    shape_position_dy: 50
  }
}

elementStyleConfigs[SankeyUnitaryNodeOutputStyle] = {
  name: 'Unitaire noeud sortie',
  config: {
    name_label_horiz: 'right',
    name_label_vert: 'middle',
    name_label_font_size: 40,
    shape_min_width: 1,
    shape_min_height: 1,
    shape_visible: false,
    name_label_box_width: 500,
    shape_position_dx: 500,
    shape_position_dy: 50
  }
} as const

elementStyleConfigs[LinkInUnitaryStyle] = {
  name: 'Unitaire flux entrée',
  config: {
    shape_orientation: 'hh',
    shape_is_arrow: false,
    value_label_font_size: 40,
    value_label_bold: true,
    value_label_horiz: 'left',
    value_label_on_path: false,
    value_label_pos_auto: false,
    value_label_unit_visible: true,
    value_label_unit_type: '%ID',
    value_label_significant_digits: true,
    value_label_nb_significant_digits: 3,
    value_label_background_visible: true,
    value_label_background_color_visible: true,
    value_label_background_color: 'white',
    value_label_custom_digit: true,
    value_label_nb_digit: 0
  }
} as const

elementStyleConfigs[LinkOutUnitaryStyle] = {
  name: 'Unitaire flux sortie',
  config: {
    shape_orientation: 'hh',
    value_label_font_size: 40,
    value_label_bold: true,
    value_label_horiz: 'right',
    value_label_vert: 'middle',
    value_label_on_path: false,
    value_label_pos_auto: false,
    value_label_unit_visible: true,
    value_label_unit_type: '%OS', 
    value_label_significant_digits: true,
    value_label_nb_significant_digits: 3,
    value_label_background_visible: true,
    value_label_background_color_visible: true,
    value_label_background_color: 'white',
    value_label_custom_digit: true,
    value_label_nb_digit: 0
  }
} as const


export const base_styles: readonly ElementStyleKey[] = [NodeStyle, LinkStyle, ContainerStyle] as const
export const product_sector_styles: readonly ElementStyleKey[] = [NodeProductStyle, NodeSectorStyle] as const
export const node_exchanges_style: readonly ElementStyleKey[] = [
  NodeExportBelowStyle, NodeExportCloseStyle, NodeImportAboveStyle, NodeImportCloseStyle,
  NodeImportExportAboveBelowStyle, NodeImportExportCloseStyle, LinkImportExportAboveBelowStyle,
  LinkImportExportCloseStyle, LinkImportCloseStyle, LinkExportCloseStyle
] as const
export const node_unitary_styles: readonly ElementStyleKey[] = [
  SankeyUnitaryNodeOutputStyle, SankeyUnitaryNodeInputStyle, SankeyUnitaryNodeStyle,
  LinkInUnitaryStyle, LinkOutUnitaryStyle
] as const

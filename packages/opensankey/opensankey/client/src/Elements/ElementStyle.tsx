import { getNumberOrUndefinedFromJSON, getStringOrUndefinedFromJSON, Type_ElementPositionOptionnal, Type_JSON, Type_Position } from '../types/Utils'
import { Class_LinkElement } from './Link'
import { Class_LinkAttribute, AttributeKey as LinkAttributeKey } from './LinkAttributes'
import { AttributeTypes as LinkAttributeTypes, LINKS_ATTRIBUTES_CONFIG } from './LinkAttributesConfig'
import { Class_NodeElement } from './Node'
import { Class_NodeAttribute, default_dx, default_dy } from './NodeAttributes'
import { AttributeTypes as NodeAttributeTypes, AttributeKey as NodeAttributeKey, NODES_ATTRIBUTES_CONFIG, AttributeKey } from './NodeAttributesConfig'


export class Class_LinkStyle extends Class_LinkAttribute {
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Class_LinkElement } = {}
  private _customisable_attribute: {
    [K in LinkAttributeKey]: boolean
  }

  constructor(id: string, name: string, is_deletable: boolean = true) {
    super()
    this._id = id
    this._name = name
    this._is_deletable = is_deletable

    // Initialiser les attributs customisables
    this._customisable_attribute = {} as {
      [K in LinkAttributeKey]: boolean
    }
    Object.keys(LINKS_ATTRIBUTES_CONFIG).forEach(key => {
      this._customisable_attribute[key as LinkAttributeKey] = !is_deletable
    })

    // Initialiser les valeurs par défaut si non deletable
    if (!is_deletable) {
      Object.entries(LINKS_ATTRIBUTES_CONFIG).forEach(([key, config]) => {
        //@ts-expect-error xxx
        this._attributes[key as AttributeKey] = config.default
      })
    }
  }

  public copyFrom(element: Class_LinkStyle) {
    Object.keys(element._attributes).forEach(key => {
      //@ts-expect-error xxx
      this._attributes[key as AttributeKey] = element._attributes[key as AttributeKey]
    })
    this._customisable_attribute = {...element._customisable_attribute}
  }


  protected shouldSaveAttribute(
    key: LinkAttributeKey,
    value: number | string | boolean | undefined,
    link: Class_LinkElement | null,
    default_style: Class_LinkStyle | null
  ) {
    if (default_style) {
      return value !== undefined && this._customisable_attribute[key] && value !== default_style[key]
    }
    return value !== undefined && this._customisable_attribute[key] && value !== LINKS_ATTRIBUTES_CONFIG[key].default
  }

  public delete() {
    if (this._is_deletable) {
      Object.values(this._references).forEach(ref => ref.useDefaultStyle())
      this._references = {}
    }
  }

  public addReference(ref: Class_LinkElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_LinkElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  public fromJSON(json_local_object: Type_JSON, link: Class_LinkElement | null, default_style: Class_LinkStyle | null) {
    super.fromJSON(json_local_object, link, default_style)
    Object.keys(this._attributes).forEach(key => {
      if (this._attributes[key as LinkAttributeKey] !== undefined) {
        this._customisable_attribute[key as LinkAttributeKey] = true
      }
    })
  }

  protected update() {
    this.updateReferencesDraw()
  }

  protected updateLinkAndSourceTarget() {
    this.updateNodeReferencesDraw()
  }

  private updateReferencesDraw() {
    Object.values(this._references).forEach(ref => ref.drawElements())
  }

  private updateNodeReferencesDraw() {
    Object.values(this._references).forEach(ref => {
      ref.setDomainLocalScale(ref.shape_local_link_scale)
      ref.source.draw()
      ref.target.draw()
    })
  }

  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }
  public get customisable_attribute() { return this._customisable_attribute }
}
// ==================================================================================================
// CLASSE STYLE RATIONALISÉE
// ==================================================================================================

export class Class_NodeStyle extends Class_NodeAttribute {
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Class_NodeElement } = {}
  private _customisable_attribute: {
    [K in NodeAttributeKey]: boolean
  }
  private _position: Type_ElementPositionOptionnal = {}

  constructor(id: string, name: string, is_deletable: boolean = true) {
    super()
    this._id = id
    this._name = name
    this._is_deletable = is_deletable

    // Initialiser les attributs customisables
    this._customisable_attribute = {} as {
      [K in NodeAttributeKey]: boolean
    }
    Object.keys(NODES_ATTRIBUTES_CONFIG).forEach(key => {
      this._customisable_attribute[key as NodeAttributeKey] = !is_deletable
    })

    // Initialiser les valeurs par défaut si non deletable
    if (!is_deletable) {
      this._position = {
        type: 'absolute',
        x: 10,
        y: 10,
        u: 0,
        v: 0,
        dx: default_dx,
        dy: default_dy
      }

      Object.entries(NODES_ATTRIBUTES_CONFIG).forEach(([key, config]) => {
        //@ts-expect-error Default initialization
        this._attributes[key as NodeAttributeKey] = config.default
      })
    }
  }

  public copyFrom(element: Class_NodeStyle) {
    Object.keys(element._attributes).forEach(key => {
      //@ts-expect-error xxx
      this._attributes[key as NodeAttributeKey] = element._attributes[key as NodeAttributeKey]
    })
    this._customisable_attribute = {...element._customisable_attribute}

    this._position.type = element.position.type
    this._position.dx = element.position.dx
    this._position.dy = element.position.dy
  }

  // =================== OVERRIDE METHODS ===================
  /**
   * Override: condition spécifique pour les styles
   */
  protected shouldSaveAttribute(
    key: NodeAttributeKey,
    value: string | number | boolean | undefined,
    node: Class_NodeElement | null,
    default_style: Class_NodeStyle | null
  ) {
    if (default_style) {
      return value !== undefined && this._customisable_attribute[key] //&& value !== default_style[key]
    }
    return value !== undefined && this._customisable_attribute[key] && value !== NODES_ATTRIBUTES_CONFIG[key].default
  }

  /**
   * Override: fromJSON avec gestion des customisable_attribute + position
   */
  public fromJSON(json_local_object: Type_JSON, node: Class_NodeElement | null, default_style: Class_NodeStyle | null): void {
    // 1. Appeler la logique parente (fait tout le mapping)
    super.fromJSON(
      json_local_object,
      null,
      default_style
    )

    // 2. Gestion spécifique des positions
    this._position.type = getStringOrUndefinedFromJSON(json_local_object, 'position') as Type_Position
    this._position.dx = getNumberOrUndefinedFromJSON(json_local_object, 'dx')
    this._position.dy = getNumberOrUndefinedFromJSON(json_local_object, 'dy')

    // 3. Marquer comme customisables les attributs chargés
    Object.keys(this._attributes).forEach(key => {
      if (this._attributes[key as NodeAttributeKey] !== undefined) {
        this._customisable_attribute[key as NodeAttributeKey] = true
      }
    })
  }

  /**
   * Override: toJSON avec ajout des informations de position
   */
  public toJSON(node: Class_NodeElement | null, default_style: Class_NodeStyle | null): Type_JSON {
    const json_object = super.toJSON(null, default_style)

    // Ajouter les informations de position
    if (this.position.type != undefined) json_object['position'] = this.position.type
    if (this.position.dx != undefined) json_object['dx'] = this.position.dx
    if (this.position.dy != undefined ) json_object['dy'] = this.position.dy
    if (this.position.auto_x != undefined) json_object['auto_x'] = this.position.auto_x
    if (this.position.auto_y != undefined) json_object['auto_y'] = this.position.auto_y

    return json_object
  }

  // =================== SPECIFIC METHODS ===================
  public delete() {
    if (this._is_deletable) {
      Object.values(this._references).forEach(ref => ref.useDefaultStyle())
      this._references = {}
    }
  }

  public addReference(ref: Class_NodeElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_NodeElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  protected update() {
    this.updateReferencesDraw()
  }

  private updateReferencesDraw() {
    Object.values(this._references).forEach(ref => ref.draw())
  }

  // Getters/Setters
  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }
  public get customisable_attribute() { return this._customisable_attribute }
  public get position() { return this._position }
  public set position(value: Type_ElementPositionOptionnal) { this._position = value }
  public get position_type() { return this._position.type }
  public set position_type(_) { this._position.type = _ }
  public get position_dx() { return this._position.dx }
  public set position_dx(_) { this._position.dx = _ }
  public get position_dy() { return this._position.dy }
  public set position_dy(_) { this._position.dy = _ }
}

type NodeStyleConfig = Partial<{
  [K in NodeAttributeKey]: NodeAttributeTypes[K]
}>

// Type pour les propriétés de position
interface NodeStylePosition {
  type?: 'relative' | 'parametric' | 'absolute'
  dx?: number
  dy?: number
}

// Type pour un élément de configuration de style (sans id)
interface NodeStyleConfigItem {
  name: string,
  config: NodeStyleConfig
  position?: NodeStylePosition
}

// Type pour le dictionnaire complet
export type NodeStyleConfigsDict = Record<string, NodeStyleConfigItem>



export const nodeStyleConfigs: NodeStyleConfigsDict = {
  NodeProductStyle: {
    name: 'Produit',
    config: { 'shape_type': 'ellipse' },
    position: {}
  },
  NodeSectorStyle: {
    name: 'Secteur',
    config: { 'shape_type': 'rect' },
    position: {}
  },
  NodeImportExportCloseStyle: {
    name: 'Import export collés',
    config: {
      'name_label_is_visible': false,
      'shape_visible': false,
      'shape_min_width': 1,
      'name_label_box_width': 300,
      'name_label_separator': ' - ',
      'name_label_separator_part': 'before'
    },
    position: {
      'type': 'relative',
      'dy': 20,
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
      'name_label_separator': ' - '
    },
    position: {
      'type': 'parametric'
    }
  },
  NodeImportCloseStyle: {
    name: 'Import collés',
    config: {},
    position: {
      'dx': -100,
      'dy': -50
    }
  },
  NodeImportAboveStyle: {    
    name: 'Import au dessus',
    config: {
      'name_label_horiz': 'left',
      'value_label_horiz': 'left',
      'value_label_horiz_shift': 40,
    },
    position: {
      'dx': -200,
      'dy': 20
    }
  },
  NodeExportCloseStyle: {
    name: 'Export collés',
    config: {
      'name_label_vert': 'bottom'
    },
    position: {
      'dx': 100,
      'dy': 50
    }
  },
  NodeExportBelowStyle: {
    name: 'Export au dessous',
    config: {
      'name_label_horiz': 'right',
      'value_label_horiz': 'right',
      'value_label_horiz_shift': -40,
    },
    position: {
      'dx': 200,
      'dy': 20
    }
  },
  NodeUnitaryStyle: {
    name: 'Unitaire',
    config: {
      'name_label_is_visible': false
    }
  },
  SankeyUnitaryNodeStyle: {    
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
    },
    position: {
      dx: 300
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
    },
    position: {
      dx: 300
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
      name_label_box_width: 1000
    },
    position: {
      dx: 300
    }
  } as const
}

export type NodeStyleKey = keyof typeof nodeStyleConfigs
export const product_sector_styles: readonly NodeStyleKey[] = ['NodeProductStyle', 'NodeSectorStyle'] as const
export const node_exchanges_style: readonly NodeStyleKey[] = [
  'NodeExportBelowStyle', 'NodeExportCloseStyle', 'NodeImportAboveStyle', 'NodeImportCloseStyle',
  'NodeImportExportAboveBelowStyle', 'NodeImportExportCloseStyle'
] as const
export const node_unitary_styles: readonly NodeStyleKey[] = [
  'SankeyUnitaryNodeOutputStyle', 'SankeyUnitaryNodeInputStyle', 'SankeyUnitaryNodeStyle'] as const

// Vous aurez besoin d'un équivalent de LINKS_ATTRIBUTES_CONFIG pour les liens
// En supposant qu'il existe, sinon remplacez par le type approprié
type LinkStyleConfig = Partial<{
  [K in LinkAttributeKey]: LinkAttributeTypes[K] // Adaptez selon votre config de liens
}>

// Type pour un élément de configuration de style de lien (sans id)
interface LinkStyleConfigItem {
  config: LinkStyleConfig
}

// Type pour le dictionnaire complet
export type LinkStyleConfigsDict = Record<string, LinkStyleConfigItem>

export const linkStyleConfigs: LinkStyleConfigsDict = {
  LinkImportExportCloseStyle: {
    config: {
      'value_label_is_visible': true,
      'value_label_on_path': true,
    }
  },
  LinkImportCloseStyle: {
    config: {
      'shape_orientation': 'vh',
      'shape_starting_tangeant': 1,
      'shape_ending_tangeant': 0.25
    }
  },
  LinkExportCloseStyle: {
    config: {
      'shape_orientation': 'hv',
      'shape_starting_tangeant': 0.25,
      'shape_ending_tangeant': 1
    }
  },
  LinkImportExportAboveBelowStyle: {
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
    config: {}
  },
  LinkExportBelowStyle: {
    config: {}
  },
  LinkInUnitaryStyle: {
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
  },
  LinkOutUnitaryStyle: {
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
  }
} as const

// Type des clés disponibles pour les liens
export type LinkStyleKey = keyof typeof linkStyleConfigs
export const link_exchanges_style: readonly NodeStyleKey[] = [
  'LinkImportExportAboveBelowStyle', 'LinkExportCloseStyle', 'LinkImportCloseStyle', 'LinkImportExportCloseStyle',
  'LinkImportAboveStyle', 'LinkExportBelowStyle'
] as const
export const link_unitary_styles: readonly NodeStyleKey[] = [
  'LinkInUnitaryStyle', 'LinkOutUnitaryStyle'
] as const
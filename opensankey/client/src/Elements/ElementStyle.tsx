import { getNumberFromJSON, getStringOrUndefinedFromJSON, Type_ElementPositionOptionnal, Type_JSON, Type_Position } from '../types/Utils';
import { Class_LinkElement } from './Link';
import { Class_LinkAttribute, AttributeKey as LinkAttributeKey } from './LinkAttributes';
import { LINKS_ATTRIBUTES_CONFIG } from './LinkAttributesConfig';
import { Class_NodeElement } from './Node';
import { Class_NodeAttribute, default_dx, default_dy } from './NodeAttributes';
import { AttributeKey as NodeAttributeKey, NODES_ATTRIBUTES_CONFIG } from './NodeAttributesConfig';


export class Class_LinkStyle extends Class_LinkAttribute {
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Class_LinkElement}  = {};
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

  // ✅ OVERRIDE: Condition personnalisée pour Class_LinkStyle
  protected shouldSaveAttribute(key: LinkAttributeKey, value: any): boolean {
    return value !== undefined &&
      this._customisable_attribute[key] &&
      value != LINKS_ATTRIBUTES_CONFIG[key].default
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

  public fromJSON(json_local_object: Type_JSON): void {
    super.fromJSON(json_local_object)
    Object.keys(this._attributes).forEach(([jsonKey, attrKey]) => {
      if (json_local_object[jsonKey] !== undefined) {
        this._customisable_attribute[attrKey as LinkAttributeKey] = true
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
  private _references: { [_: string]: Class_NodeElement}  = {};
  private _customisable_attribute: {
    [K in NodeAttributeKey]: boolean
  }
  private _position: Type_ElementPositionOptionnal = {};

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
        this._attributes[key as AttributeKey] = config.default
      })
    }
  }

  // =================== OVERRIDE METHODS ===================
  /**
   * Override: condition spécifique pour les styles
   */
  protected shouldSaveAttribute(key: NodeAttributeKey, value: any): boolean {
    return value !== undefined &&
      this._customisable_attribute[key] &&
      value !== NODES_ATTRIBUTES_CONFIG[key].default
  }

  /**
   * Override: fromJSON avec gestion des customisable_attribute + position
   */
  public fromJSON(json_local_object: Type_JSON): void {
    // 1. Appeler la logique parente (fait tout le mapping)
    super.fromJSON(json_local_object)

    // 2. Gestion spécifique des positions
    this._position.type = getStringOrUndefinedFromJSON(json_local_object, 'position') as Type_Position
    this._position.dx = getNumberFromJSON(json_local_object, 'dx', default_dx)
    this._position.dy = getNumberFromJSON(json_local_object, 'dy', default_dy)

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
  public toJSON(): Type_JSON {
    const json_object = super.toJSON()

    // Ajouter les informations de position
    if (this.position.type) json_object['position'] = this.position.type
    if (this.position.dx) json_object['dx'] = this.position.dx
    if (this.position.dy) json_object['dy'] = this.position.dy
    if (this.position.auto_x) json_object['auto_x'] = this.position.auto_x

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


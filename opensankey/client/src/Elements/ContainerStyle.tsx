// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

import { Type_JSON } from '../types/Utils'
import { Class_ContainerElement } from './TextZone'
import { Class_ContainerAttribute, AttributeKey } from './ContainerAttributes'
import { ContainerAttributeTypes, CONTAINERS_ATTRIBUTES_CONFIG } from './ContainerAttributesConfig'

/**
 * Classe représentant un style de container pouvant être partagé entre plusieurs containers
 */
export class Class_ContainerStyle extends Class_ContainerAttribute {
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Class_ContainerElement } = {}
  private _customisable_attribute: {
    [K in AttributeKey]: boolean
  }

  constructor(id: string, name: string, is_deletable: boolean = true) {
    super()
    this._id = id
    this._name = name
    this._is_deletable = is_deletable

    // Initialiser les attributs customisables
    this._customisable_attribute = {} as {
      [K in AttributeKey]: boolean
    }
    Object.keys(CONTAINERS_ATTRIBUTES_CONFIG).forEach(key => {
      this._customisable_attribute[key as AttributeKey] = !is_deletable
    })

    // Initialiser les valeurs par défaut si non deletable (style par défaut)
    if (!is_deletable) {
      Object.entries(CONTAINERS_ATTRIBUTES_CONFIG).forEach(([key, config]) => {
        //@ts-expect-error xxx
        this._attributes[key as AttributeKey] = config.default
      })
    }
  }

  public copyFrom(element: Class_ContainerStyle) {
    Object.keys(element._attributes).forEach(key => {
      //@ts-expect-error xxx
      this._attributes[key as AttributeKey] = element._attributes[key as AttributeKey]
    })
    this._customisable_attribute = { ...element._customisable_attribute }
  }

  protected shouldSaveAttribute(
    key: AttributeKey,
    value: number | string | boolean | undefined,
    container: Class_ContainerElement | null,
    default_style: Class_ContainerStyle | null
  ): boolean {
    if (default_style) {
      return value !== undefined && this._customisable_attribute[key] && value !== default_style[key]
    }
    return value !== undefined && this._customisable_attribute[key] && value !== CONTAINERS_ATTRIBUTES_CONFIG[key].default
  }

  public delete() {
    if (this._is_deletable) {
      // Faire en sorte que tous les containers utilisant ce style reviennent au style par défaut
      Object.values(this._references).forEach(ref => {
        // Implémenter useDefaultStyle dans Class_ContainerElement
        // ref.useDefaultStyle()
      })
      this._references = {}
    }
  }

  public addReference(ref: Class_ContainerElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_ContainerElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  public fromJSON(
    json_local_object: Type_JSON,
    container: Class_ContainerElement | null,
    default_style: Class_ContainerStyle | null
  ) {
    super.fromJSON(json_local_object, container, default_style)
    
    // Marquer comme customisable tous les attributs qui ont été chargés
    Object.keys(this._attributes).forEach(key => {
      if (this._attributes[key as AttributeKey] !== undefined) {
        this._customisable_attribute[key as AttributeKey] = true
      }
    })
  }

  protected update() {
    this.updateReferencesDraw()
  }

  protected updateSizeAndPosition() {
    this.updateReferencesPosition()
  }

  protected updateLabelDimensions() {
    this.updateReferencesDraw()
  }

  private updateReferencesDraw() {
    Object.values(this._references).forEach(ref => {
      ref.draw()
    })
  }

  private updateReferencesPosition() {
    Object.values(this._references).forEach(ref => {
      if (ref.tied_to_nodes) {
        // Recalculer la position depuis les nœuds attachés
        ref.computeSizeAndPositionFromAttachedNodes()
      }
      ref.draw()
    })
  }

  // Getters
  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }
  public get customisable_attribute() { return this._customisable_attribute }
  public get is_deletable() { return this._is_deletable }
  public get references() { return this._references }
  public get reference_count() { return Object.keys(this._references).length }
}

/**
 * Classe pour gérer une collection de styles de containers
 */
export class Class_ContainerStyleManager {
  private _styles: Map<string, Class_ContainerStyle> = new Map()
  private _default_style: Class_ContainerStyle

  constructor() {
    // Créer le style par défaut (non supprimable)
    this._default_style = new Class_ContainerStyle('default', 'Default', false)
    this._styles.set('default', this._default_style)
  }

  public createStyle(id: string, name: string): Class_ContainerStyle {
    const style = new Class_ContainerStyle(id, name, true)
    this._styles.set(id, style)
    return style
  }

  public getStyle(id: string): Class_ContainerStyle | undefined {
    return this._styles.get(id)
  }

  public deleteStyle(id: string): boolean {
    const style = this._styles.get(id)
    if (style && style.is_deletable) {
      style.delete()
      this._styles.delete(id)
      return true
    }
    return false
  }

  public get default_style() {
    return this._default_style
  }

  public get styles() {
    return Array.from(this._styles.values())
  }

  public get deletable_styles() {
    return this.styles.filter(s => s.is_deletable)
  }

  public toJSON(): Type_JSON {
    const json: Type_JSON = {}
    this.deletable_styles.forEach(style => {
      json[style.id] = {
        name: style.name,
        attributes: style.toJSON()
      }
    })
    return json
  }

  public fromJSON(json: Type_JSON) {
    Object.entries(json).forEach(([id, styleData]) => {
      if (typeof styleData === 'object' && styleData !== null) {
        const data = styleData as Type_JSON
        const style = this.createStyle(id, data.name as string)
        style.fromJSON(data.attributes as Type_JSON, null, this._default_style)
      }
    })
  }
}

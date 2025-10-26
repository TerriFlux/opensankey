// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Local imports
import {
  Type_JSON,
  getBooleanFromJSON,
  getNumberFromJSON,
  getStringFromJSON
} from '../types/Utils'
import { 
  ContainerAttributeTypeScript, 
  CONTAINERS_ATTRIBUTES_CONFIG,
  ContainerSetterGenerator,
  Type_VerticalAlignment,
  Type_ExtremityPosition
} from './ContainerAttributesConfig'
import { Class_ContainerElement } from './TextZone'
import { Class_ContainerStyle } from './ContainerStyle'

// SPECIFIC TYPES ***********************************************************************

export type Type_customisable_container_attr = keyof typeof CONTAINERS_ATTRIBUTES_CONFIG

export type AttributeKey = keyof typeof CONTAINERS_ATTRIBUTES_CONFIG

// Génération automatique des types à partir de la config
export type ContainerAttributeTypes = {
  [K in AttributeKey]: ReturnType<typeof CONTAINERS_ATTRIBUTES_CONFIG[K]['type']>
}

export class Class_ContainerAttribute extends ContainerAttributeTypeScript {
  protected _attributes: { [K in AttributeKey]?: ContainerAttributeTypes[K] } = {}

  constructor() {
    super()
    // Utiliser le générateur automatique au lieu de createDynamicProperties
    ContainerSetterGenerator.generateSetters(this, this._attributes)
  }

  public delete_attribute(k: keyof typeof CONTAINERS_ATTRIBUTES_CONFIG) {
    delete this._attributes[k]
  }

  protected shouldSaveAttribute(
    key: AttributeKey,
    value: number | string | boolean | undefined,
    container: Class_ContainerElement | null,
    default_style: Class_ContainerStyle | null
  ): boolean {
    if (default_style) {
      return value !== undefined && value !== default_style[key]
    }
    return value !== undefined && value !== CONTAINERS_ATTRIBUTES_CONFIG[key].default
  }

  public toJSON(
    container: Class_ContainerElement | null = null,
    default_style: Class_ContainerStyle | null = null
  ): Type_JSON {
    const json_object: Type_JSON = {}
    
    Object.keys(this._attributes).forEach(key => {
      const typedKey = key as AttributeKey
      const value = this._attributes[typedKey]
      
      if (this.shouldSaveAttribute(typedKey, value, container, default_style)) {
        //@ts-expect-error xxx
        json_object[key] = value
      }
    })
    
    return json_object
  }

  public fromJSON(
    json_local_object: Type_JSON,
    container: Class_ContainerElement | null = null,
    default_style: Class_ContainerStyle | null = null
  ) {
    Object.keys(CONTAINERS_ATTRIBUTES_CONFIG).forEach(key => {
      const typedKey = key as AttributeKey
      const config = CONTAINERS_ATTRIBUTES_CONFIG[typedKey]
      
      if (json_local_object[key] !== undefined) {
        const type = typeof config.default
        
        if (type === 'boolean') {
          //@ts-expect-error xxx
          this._attributes[typedKey] = getBooleanFromJSON(json_local_object, key, config.default)
        } else if (type === 'number') {
          //@ts-expect-error xxx
          this._attributes[typedKey] = getNumberFromJSON(json_local_object, key, config.default)
        } else if (type === 'string') {
          //@ts-expect-error xxx
          this._attributes[typedKey] = getStringFromJSON(json_local_object, key, config.default)
        }
      }
    })
  }

  public copyFrom(element: Class_ContainerAttribute) {
    Object.keys(element._attributes).forEach(key => {
      //@ts-expect-error xxx
      this._attributes[key as AttributeKey] = element._attributes[key as AttributeKey]
    })
  }

  // Getters pour récupérer les valeurs avec fallback sur default
  protected getAttributeValue<K extends AttributeKey>(key: K): ContainerAttributeTypes[K] {
    return this._attributes[key] ?? CONTAINERS_ATTRIBUTES_CONFIG[key].default as ContainerAttributeTypes[K]
  }
}
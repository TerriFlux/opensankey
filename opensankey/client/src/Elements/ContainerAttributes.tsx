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
import { Class_ContainerStyle } from './ElementStyle'

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
    this.createDynamicProperties()
  }

  private createDynamicProperties() {
    // Création automatique de TOUTES les propriétés en une seule boucle
    (Object.keys(CONTAINERS_ATTRIBUTES_CONFIG) as AttributeKey[]).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this._attributes[key],
        //@ts-expect-error xxx
        set: (value: AttributeTypes[key]) => {
          //@ts-expect-error xxx
          const config = CONTAINERS_ATTRIBUTES_CONFIG[key] as AttributeTypes[key]
          if (config.setter && typeof this[config.setter as keyof this] === 'function') {
            //@ts-expect-error xxx
            (this[config.setter as keyof this]).call(this, value)
          } else {
            this._attributes[key] = value
            if (config.callback) {
              //@ts-expect-error xxx
              (this[config.callback as keyof this]).call(this)
            } /*else {
              this.update()
            }*/
          }
        },
        enumerable: true,
        configurable: true
      })
    })
  }


  public delete_attribute(k: keyof typeof CONTAINERS_ATTRIBUTES_CONFIG) {
    delete this._attributes[k]
  }

  protected shouldSaveAttribute(
    key: AttributeKey,
    value: number | string | boolean | undefined,
    default_style: Class_ContainerStyle | null
  ): boolean {
    if (default_style) {
      return value !== undefined && value !== default_style[key]
    }
    return value !== undefined && value !== CONTAINERS_ATTRIBUTES_CONFIG[key].default
  }

  public toJSON(
    json_object: Type_JSON,
    default_style: Class_ContainerStyle | null = null
  ): Type_JSON {
    Object.keys(this._attributes).forEach(key => {
      const typedKey = key as AttributeKey
      const value = this._attributes[typedKey]
      
      if (this.shouldSaveAttribute(typedKey, value, default_style)) {
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
    // Traitement des attributs directs (même nom)
    (Object.keys(CONTAINERS_ATTRIBUTES_CONFIG) as [AttributeKey]).forEach(key => {
      if (json_local_object[key] !== undefined) {
        if ((container != null && json_local_object[key] !== container.getStyleProperty(key))) {
          //@ts-expect-error JSON assignment    
          this._attributes[key] = json_local_object[key]
        } else if (container == null && default_style && json_local_object[key] !== default_style[key]) {
          //@ts-expect-error JSON assignment    
          this._attributes[key] = json_local_object[key]
        } else if (container == null && json_local_object[key] !== CONTAINERS_ATTRIBUTES_CONFIG[key].default) {
          //@ts-expect-error JSON assignment    
          this._attributes[key] = json_local_object[key]
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
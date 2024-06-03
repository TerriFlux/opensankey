// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports

// Local types
import {
  Type_ElementShape,
  default_element_shape
} from './Element'

// Local functions


/**
 * Class that define a Tag object
 *
 * @class Class_Tag
 */
export class Class_Tag {
  // Constructor =================================================
  constructor(id: string, name: string, group: Class_Tagg) {
    this.id = id
    this.name = name
    this.group = group
  }
  // Mandatory Attributes ========================================
  // Name
  id: string
  name: string
  // Group where it belong
  group: Class_Tagg
  // Others Attributes ============================================
  // Display attributes
  shape: Type_ElementShape = structuredClone(default_element_shape)
}

export class Class_Tagg {
  // Constructor =================================================
  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.tags = {}
    this.addTag('etiquette0', 'Etiquette 0')
  }
  // Mandatory Attributes ========================================
  // Name
  id: string
  name: string
  // List of tags
  tags: {[_: string] : Class_Tag}
  public addTag(id: string, name: string) {
    const tag = new Class_Tag(id, name, this)
    this.tags[id] = tag
  }
}

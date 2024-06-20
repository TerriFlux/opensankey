// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

import { Class_LinkElement } from "./Link"
import { Class_NodeElement } from "./Node"

// External imports

// Local types
// import { Class_ElementShape } from './Element'
// import { Class_NodeShape } from './Node'

// Local functions
export type tag_banner_type='none'|'one'|'multi'


/**
 * Class that define a Tag object
 *
 * @class Class_Tag
 */
export class Class_Tag {
  // Mandatory Attributes ========================================
  // Name
  private _id: string

  private _name: string

  // Group where it belong
  private _group: Class_TagGroup
  // Color of tag
  private _color: string
  // Boolean to show elements that are assigned to this tag
  private _selected: boolean
  private list_ref:(Class_LinkElement|Class_NodeElement)[] 

  
  // Constructor =================================================
  constructor(id: string, name: string, group: Class_TagGroup) {
    this._id = id
    this._name = name
    this._group = group
    this._color='grey'
    this._selected=true
    this.list_ref=[]
  }

  // Others Attributes ============================================
  // Display attributes
  // shape: Type_ElementShape = structuredClone(default_element_shape)
  // shape: Class_ElementShape = new Class_NodeShape

  public deReferencement(){
    this.list_ref.forEach(element=>{
      element.deRefTag(this)
    })
  }

  // =========== Getter & Setter ===================
  public get id(): string {return this._id}
  
  public get color(): string {return this._color}
  public set color(value: string) {this._color = value}

  public get selected(): boolean {return this._selected}
  public set selected(value: boolean) {this._selected = value}

  public get name(): string {return this._name}
  public set name(value: string) {this._name = value}
}

export class Class_TagGroup {
  // Mandatory Attributes ========================================
  // Name
  private _id: string
  private _name: string

  // List of tags
  private _tags: { [_: string]: Class_Tag} 

  private _show_legend: boolean
  private _banner: tag_banner_type


  // Constructor =================================================
  constructor(id: string, name: string) {
    this._id = id
    this._name = name
    this._tags = {}
    this._show_legend=false
    this._banner='one'

    this.addTag('etiquette0', 'Etiquette 0')
  }

  public addTag(id: string, name: string) {
    const tag = new Class_Tag(id, name, this)
    this._tags[id] = tag
  }

  public deleteRef(){
    Object.values(this._tags).forEach(tag=>tag.deReferencement())
  }

  // =========== Getter & Setter ===================
  public get id(): string {return this._id}
  public set id(value: string) {this._id = value}

  public get name(): string {return this._name}
  public set name(value: string) {this._name = value}

  public get tags(): { [_: string]: Class_Tag}  {return this._tags}
  public set tags(value: { [_: string]: Class_Tag} ) {this._tags = value}

  public get banner(): tag_banner_type {return this._banner}
  public set banner(value: tag_banner_type) {this._banner = value}
}

// SPECIAL TAG GROUP FOR NODE LEVEL
export class Class_TagGroupNodeLevel extends Class_TagGroup{
  // Class Attributes====================
  private _siblings:string[]
  private _activated:boolean

  // Constructor=======================
  constructor(id: string, name: string){
    super(id,name)
    this._siblings=[]
    this._activated=false
  }
}

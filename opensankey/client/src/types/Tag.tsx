// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'
import { default_grey_color } from './Utils'


// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type='none'|'one'|'multi'

type Type_TagReference = Class_NodeElement | Class_LinkElement


// CLASS TAG ****************************************************************************
/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export class Class_Tag {
  // PRIVATE ATTRIBUTES =================================================================
  // Name
  private _id: string

  private _name: string

  // Group where it belong
  private _group: Class_TagGroup

  // List of elements that relates to this tag
  private _references: {[_: string]: Type_TagReference} = {}

  // Color of tag
  private _color: string = default_grey_color

  // Boolean to show elements that are assigned to this tag
  private _selected: boolean = true

  // Constructor ========================================================
  constructor(id: string, name: string, group: Class_TagGroup) {
    this._id = id
    this._name = name
    this._group = group
    this._color
  }

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  public delete() {
    // Unref this tag from all references
    Object.values(this._references)
      .forEach(element=>{
        element.removeTag(this)
      })
    this._references = {}
    // Garbage collection will do the rest
  }

  // GETTERS / SETTERS ==================================================================

  public get id() {return this._id}

  public get name() {return this._name}
  public set name(value: string) {this._name = value}

  public get color() {return this._color}
  public set color(value: string) {this._color = value}

  public get selected() {return this._selected}
  public set selected(value: boolean) {this._selected = value}

  // PUBLIC METHODS =====================================================================
  public addReference(_: Type_TagReference) {
    if (!this._references[_.id]) this._references[_.id] = _
  }

  public removeReference(_: Type_TagReference) {
    if (this._references[_.id] !== undefined) {
      delete this._references[_.id]
      _.removeTag(this)
    }
  }
}

// CLASS TAGGROUP ***********************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export class Class_TagGroup {

  // PRIVATE ATTRIBUTES =================================================================
  // Name
  private _id: string
  private _name: string

  // List of tags
  private _tags: {[_: string]: Class_Tag} = {}

  // Display attributes
  private _show_legend: boolean = false
  private _banner: tag_banner_type = 'one'


  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string) {
    this._id = id
    this._name = name
    // Create a first default tag
    this.addTag('etiquette0', 'Etiquette 0')
  }

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  public delete() {
    // Unref this tag from all references
    Object.values(this._tags)
      .forEach(element=>{
        element.delete()
      })
    this._tags = {}
    // Garbage collection will do the rest ...
  }

  // GETTERS / SETTERS ==================================================================

  public get id(): string {return this._id}
  public set id(value: string) {this._id = value}

  public get name(): string {return this._name}
  public set name(value: string) {this._name = value}

  public get tags(): { [_: string]: Class_Tag}  {return this._tags}
  public set tags(value: { [_: string]: Class_Tag} ) {this._tags = value}

  public get banner(): tag_banner_type {return this._banner}
  public set banner(value: tag_banner_type) {this._banner = value}

  public get show_legend(): boolean {return this._show_legend}
  public set show_legend(value: boolean) {this._show_legend = value}

  // PUBLIC METHODS =====================================================================

  public addTag(id: string, name: string) {
    if (!this._tags[id]) {
      const tag = new Class_Tag(id, name, this)
      this._tags[id] = tag
    }
    else {
      this.addTag(id+'_0', name+'_0')
    }
  }

  public addDefaultTag() {
    const n = String(Object.values(this._tags).length)
    const id = 'etiquette' + n
    const name = 'Etiquette ' + n
    this.addTag(id, name)
  }

  public removeTag(_: Class_Tag) {
    if (this._tags[_.id] !== undefined) {
      _.delete()
      delete this._tags[_.id]
    }
  }
}

// CLASS TAGGROUP FOR NODES LEVELS ******************************************************

export class Class_TagGroupNodeLevel extends Class_TagGroup{

  // PRIVATE ATTRIBUTES==================================================================
  private _siblings: string[] = []
  private _activated: boolean = false

  // GETTERS / SETTERS ==================================================================

  public get siblings(): string[] {return this._siblings}
  public set siblings(value: string[]) {this._siblings = value}

  public get activated(): boolean {return this._activated}
  public set activated(value: boolean) {this._activated = value}
}

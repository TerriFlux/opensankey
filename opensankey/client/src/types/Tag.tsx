// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types
import { Class_LinkValue } from './Link'
import { Class_NodeElement } from './Node'
import { default_grey_color, makeId } from './Utils'


// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type= 'none' | 'one' | 'multi' | 'level'

type Type_TagReference = Class_NodeElement | Class_LinkValue


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
  private _references: { [_: string]: Type_TagReference } = {}

  // Color of tag
  private _color: string = default_grey_color

  // Boolean
  private _is_selected: boolean = true

  /**
   * True if tag is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_Tag
   */
  private _is_currently_deleted = false

  // Constructor ========================================================================

  constructor(
    name: string,
    group: Class_TagGroup,
    id: string | undefined = undefined
  ) {
    this._id = id ?? makeId(name)
    this._name = name
    this._group = group
    this._color
  }

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Unref this from tag group
      this.group.removeTag(this)
      // Unref this tag from all references
      Object.values(this._references)
        .forEach(element => {
          element.removeTag(this)
        })
      this._references = {}
      // Garbage collection will do the rest
    }
  }

  // PUBLIC METHODS =====================================================================

  public hasGivenRef(_: Type_TagReference) {
    return (this._references[_.id] !== undefined)
  }

  public addReference(_: Type_TagReference) {
    if (!this.hasGivenRef(_)) {
      this._references[_.id] = _
      _.addTag(this)
    }
  }

  public removeReference(_: Type_TagReference) {
    if (this.hasGivenRef(_)) {
      delete this._references[_.id]
      _.removeTag(this)
    }
  }

  public updateReferences() {
    Object.values(this._references)
      .forEach(element => {
        element.draw()
      })
  }

  public setSelected() {
    // Set attributes
    this._is_selected = true
    // Redraw all related elements
    this.updateReferences()
  }

  public setUnSelected() {
    // Set attributes
    this._is_selected = false
    // Redraw all related elements
    this.updateReferences()
  }

  public toogleSelected() {
    // Set attributes
    this._is_selected = !this._is_selected
    // Redraw all related elements
    this.updateReferences()
  }

  public toJSON() {
    const json_object = {} as { [_: string]: any }
    json_object['id'] = this._id
    json_object['name'] = this._name
    json_object['selected'] = this._is_selected
    json_object['color'] = this._color

    return json_object
  }

  /**
   *Set Tag value from JSON
   *
   * @param {{[_:string]:any}} json_object
   * @memberof Class_Tag
   */
  public fromJSON(json_object: { [_: string]: any }) {
    this._is_selected = json_object['selected'] ?? false
    this._color = json_object['color'] ?? 'grey'
  }

  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  public get name() { return this._name }
  public set name(value: string) { this._name = value }

  public get color() { return this._color }
  public set color(value: string) {
    // Set attributes
    this._color = value
    // Redraw all related elements
    this.updateReferences()
  }

  // Selection
  public get is_selected() { return this._is_selected }

  public get group() { return this._group }
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
  private _tags: { [_: string]: Class_Tag } = {}
  private _tag_count: number = 0

  // Display attributes
  private _activated: boolean = false
  private _show_legend: boolean = false
  private _banner: tag_banner_type = 'one'

  /**
   * True if tag is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_TagGroup
   */
  private _is_currently_deleted = false

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
    this.addTag('Etiquette 0')
  }

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Set as currently deleted
      this._is_currently_deleted = true
      // Delete all tags properly
      Object.values(this._tags)
        .forEach(tag => {
          tag.delete()
        })
      this._tags = {}
      // Garbage collection will do the rest ...
    }
  }

  // PUBLIC METHODS =====================================================================

  public addTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_Tag(name, this, id)
    this._tags[tag.id] = tag
    this._tag_count = this._tag_count + 1
    return tag
  }

  public addDefaultTag() {
    const n = String(this._tag_count)
    const name = 'Etiquette ' + n
    this.addTag(name)
  }

  public removeTag(_: Class_Tag) {
    if (this._tags[_.id] !== undefined) {
      _.delete()
      delete this._tags[_.id]
    }
  }

  public updateTagsReferences() {
    Object.values(this._tags)
      .forEach(tag => tag.updateReferences())
  }

  public toJSON() {
    const json_object = {} as { [_: string]: any }

    json_object['group_name'] = this._name
    json_object['show_legend'] = this._show_legend
    json_object['banner'] = this._banner

    json_object['tags'] = {}
    Object.entries(this._tags).forEach(ent_tags => {
      json_object['tags'][ent_tags[0]] = ent_tags[1].toJSON()
    })

    return json_object
  }

  /**
   *Set Tag_group value & substructur from JSON
   *
   * @param {{[_:string]:any}} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(json_object: { [_: string]: any }) {
    this._show_legend = json_object['show_legend'] ?? false
    this._banner = json_object['banner'] ?? 'one'

    Object.entries(json_object['tags']).forEach(ent_tags => {
      const new_tag = this.addTag((ent_tags[1] as { name: string }).name, ent_tags[0])
      new_tag.fromJSON((ent_tags[1] as { [x: string]: any }))
    })

    // Set level_taggs value from json
    this._activated = json_object['activated'] ?? true
  }

  // GETTERS ============================================================================

  /**
   * Id of tag group
   * @readonly
   * @type {string}
   * @memberof Class_TagGroup
   */
  public get id(): string { return this._id }

  /**
   * Name of tag group (!= id)
   * @type {string}
   * @memberof Class_TagGroup
   */
  public get name(): string { return this._name }

  public get activated(): boolean { return this._activated }

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_TagGroup
   */
  public get tags_dict(): { [_: string]: Class_Tag } { return this._tags }

  /**
  * Return list tag from the current group
  * @readonly
  * @memberof Class_TagGroup
  */
  public get tags_list() { return Object.values(this._tags) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_TagGroup
   */
  public get selected_tags_list() { return Object.values(this._tags).filter(t => t.is_selected) }

  /**
   * True if tag group has tags
   * @readonly
   * @memberof Class_TagGroup
   */
  public get has_tags() { return this.tags_list.length > 0 }

  /**
   * True if tag group has tags selected
   * @readonly
   * @memberof Class_TagGroup
   */
  public get has_selected_tags() { return this.selected_tags_list.length > 0 }

  public get first_selected_tags() {
    if (this.has_tags)
      if (this.has_selected_tags)
        return this.selected_tags_list[0]
      else
        return this.tags_list[0]
    else
      return undefined
  }

  public get banner(): tag_banner_type { return this._banner }
  public set banner(value: tag_banner_type) { this._banner = value }

  public get show_legend(): boolean { return this._show_legend }
  public set show_legend(value: boolean) { this._show_legend = value }

  // SETTERS ============================================================================

  public set name(value: string) { this._name = value }
  public set activated(value: boolean) { this._activated = value }
}


// CLASS TAGGROUP FOR NODES LEVELS ******************************************************

export class Class_TagGroupNodeLevel extends Class_TagGroup {

  // PRIVATE ATTRIBUTES==================================================================
  private _siblings: string[] = []

  // PUBLIC METHODS =====================================================================

  public fromJSON(json_object: { [_: string]: any }) {
    // Call fromJSON of  Class_TagGroup
    super.fromJSON(json_object)

    this._siblings = json_object['sibling'] ?? []
  }

  // GETTERS / SETTERS ==================================================================

  public get siblings(): string[] { return this._siblings }
  public set siblings(value: string[]) { this._siblings = value }
}

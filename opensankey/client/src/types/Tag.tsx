// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types
import { Class_LinkElement, Class_LinkValue } from './Link'
import { Class_NodeElement } from './Node'
import { Class_Sankey } from './Sankey'
import { default_grey_color, makeId } from './Utils'


// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type= 'none' | 'one' | 'multi' | 'level'

type Type_TagReference = Class_NodeElement | Class_LinkValue
type Type_DataTagReference = Class_LinkElement


// CLASS PROTO TAG ***********************************************************************
/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // Name
  private _id: string

  private _name: string

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

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected abstract _group: any

  // CONSTRUCTOR ========================================================================

  constructor(
    name: string,
    id: string | undefined = undefined
  ) {
    this._id = id ?? makeId(name)
    this._name = name
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
      // Clean the rest
      this.cleanForDeletion()
      // Garbage collection will do the rest
    }
  }

  // PUBLIC METHODES ==================================================================

  public  abstract update(): void

  public setSelected() {
    // Set attributes
    this._is_selected = true
    // Redraw all related elements
    this.update()
  }

  public setUnSelected() {
    // Set attributes
    this._is_selected = false
    // Redraw all related elements
    this.update()
  }

  public toogleSelected() {
    // Set attributes
    this._is_selected = !this._is_selected
    // Redraw all related elements
    this.update()
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

  // PROTECTED METHODS ==================================================================

  protected abstract cleanForDeletion(): void

  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  public get name() { return this._name }
  public set name(value: string) { this._name = value }

  public get color() { return this._color }
  public set color(value: string) {
    // Set attributes
    this._color = value
    // Redraw all related elements
    this.update()
  }

  // Selection
  public get is_selected() { return this._is_selected }

  public get group() { return this._group }
}

// CLASS TAG ****************************************************************************
/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export class Class_Tag extends Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  private _references: { [_: string]: Type_TagReference } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_TagGroup

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_Tag.
   * @param {string} name
   * @param {Class_TagGroup} group
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_DataTag
   */
  constructor(
    name: string,
    group: Class_TagGroup,
    id: string | undefined = undefined
  ) {
    super(name, id)
    this._group = group
  }

  // PUBLIC METHODS =====================================================================

  public update() {
    Object.values(this._references)
      .forEach(element => {
        element.draw()
      })
  }

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

  // PROTECTED METHODS ==================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Unref this tag from all references
    Object.values(this._references)
      .forEach(element => {
        element.removeTag(this)
      })
    this._references = {}
  }

}

// CLASS DATATAG ************************************************************************

export class Class_DataTag extends Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  private _references: { [_: string]: Type_DataTagReference } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_DataTagGroup

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DataTag.
   * @param {string} name
   * @param {Class_TagGroup} group
   * @param {Class_Sankey} sankey
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_DataTag
   */
  constructor(
    name: string,
    group: Class_DataTagGroup,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, id)
    this._group = group
    this._references = sankey.links_dict
  }

  // PUBLIC METHODS =====================================================================

  public update() {
    Object.values(this._references)
      .forEach(element => {
        element.draw()
      })
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Unref references
    this._references = {}
  }

}

// CLASS PROTO TAGGROUP ***********************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export abstract class Class_ProtoTagGroup {

  // PRIVATE ATTRIBUTES =================================================================

  // Name
  private _id: string
  private _name: string

  // List of tags
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

  // PROTECTED ATTRIBUTES ===============================================================

  protected abstract _tags: { [_: string]: Class_ProtoTag }

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
  }

  /**
   * Define deletion behavior
   * @memberof Class_ProtoTagGroup
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
    const tag = this.createTag(name, id)
    this._tags[tag.id] = tag
    this._tag_count = this._tag_count + 1
    return tag
  }

  public addDefaultTag() {
    const n = String(this._tag_count)
    const name = 'Etiquette ' + n
    this.addTag(name)
  }

  public removeTag(_: Class_ProtoTag) {
    if (this._tags[_.id] !== undefined) {
      _.delete()
      delete this._tags[_.id]
    }
  }

  public updateTagsReferences() {
    Object.values(this._tags)
      .forEach(tag => tag.update())
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

  // PROTECTED METHODS ==================================================================

  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_ProtoTag

  // GETTERS ============================================================================

  /**
   * Id of tag group
   * @readonly
   * @type {string}
   * @memberof Class_ProtoTagGroup
   */
  public get id(): string { return this._id }

  /**
   * Name of tag group (!= id)
   * @type {string}
   * @memberof Class_ProtoTagGroup
   */
  public get name(): string { return this._name }

  public get activated(): boolean { return this._activated }

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_ProtoTag }}
   * @memberof Class_ProtoTagGroup
   */
  public abstract get tags_dict() :  { [_: string]: Class_ProtoTag }

  /**
  * Return list tag from the current group
  * @readonly
  * @memberof Class_ProtoTagGroup
  */
  public abstract get tags_list() : Class_ProtoTag[]

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public abstract get selected_tags_list() : Class_ProtoTag[]

  /**
   * True if tag group has tags
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public get has_tags() { return this.tags_list.length > 0 }

  /**
   * True if tag group has tags selected
   * @readonly
   * @memberof Class_ProtoTagGroup
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

// CLASS TAGGROUP ***********************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export class Class_TagGroup extends Class_ProtoTagGroup {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _tags: { [_: string]: Class_Tag } = {}

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string) {
    super(id, name)
    // Create a first default tag
    this.addTag('Etiquette 0')
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    return new Class_Tag(name, this, id)
  }

  // GETTER =============================================================================

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_TagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_Tag }}
   * @memberof Class_TagGroup
   */
  public get tags_list() { return Object.values(this.tags_dict) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_TagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }
}

// CLASS DATATAGGROUP ***********************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export class Class_DataTagGroup extends Class_ProtoTagGroup {

  // PRIVATE ATTRIBUTES =================================================================

  private _sankey: Class_Sankey

  // PROTECTED ATTRIBUTES ===============================================================

  protected _tags: { [_: string]: Class_DataTag } = {}

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string, sankey: Class_Sankey) {
    super(id, name)
    this._sankey = sankey
    // Create a first default tag
    this.addTag('Etiquette 0')
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    return new Class_DataTag(name, this, this._sankey, id)
  }

  // GETTER =============================================================================

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_ProtoTag }}
   * @memberof Class_DataTagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return dict tag from the current group
   * @type {Class_ProtoTag[]}
   * @memberof Class_DataTagGroup
   */
  public get tags_list() { return Object.values(this.tags_dict) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_DataTagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }
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

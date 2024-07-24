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
  private _is_selected: boolean = false

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
    // Avoid useless update
    if (this._is_selected === false) {
      // Set attributes
      this._is_selected = true
      // Redraw all related elements
      this.update()
    }
  }

  public setUnSelected() {
    // Avoid useless update
    if (this._is_selected === true) {
      // Set attributes
      this._is_selected = false
      // Redraw all related elements
      this.update()
    }
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
    // Avoid useless updates
    if (this._color !== value) {
      // Set attributes
      this._color = value
      // Redraw all related elements
      this.update()
    }
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
    // Update all links
    Object.values(this._references)
      .forEach(link => link.addDataTag(this))
  }

  // PUBLIC METHODS =====================================================================

  public update() {
    Object.values(this._references)
      .forEach(element => {
        element.drawWithNodes()
      })
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Update all links
    Object.values(this._references)
      .forEach(link => link.removeDataTag(this))
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

  // Type of banne
  private _banner: tag_banner_type = 'one'

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
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

  public selectTagsFromId(
    id: string
  ) {
    this.tags_list
      .forEach(tag => {
        if (tag.id === id) {
          tag.setSelected()
        }
        else {
          tag.setUnSelected()
        }
      })
  }

  public selectTagsFromIds(
    ids: string[]
  ) {
    this.tags_list
      .forEach(tag => {
        if (ids.includes(tag.id)) {
          tag.setSelected()
        }
        else {
          tag.setUnSelected()
        }
      })
  }

  public updateTagsReferences() {
    Object.values(this._tags)
      .forEach(tag => tag.update())
  }

  public toJSON() {
    const json_object = {} as { [_: string]: any }
    json_object['group_name'] = this._name
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
    this._name = json_object['group_name'] ?? this._name
    this._banner = json_object['banner'] ?? 'one'
    Object.entries(json_object['tags']).forEach(ent_tags => {
      const new_tag = this.addTag((ent_tags[1] as { name: string }).name, ent_tags[0])
      new_tag.fromJSON((ent_tags[1] as { [x: string]: any }))
    })
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

  // SETTERS ============================================================================

  public set name(value: string) { this._name = value }
  public set banner(value: tag_banner_type) { this._banner = value }
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

  // PRIVATE ATTRIBUTES =================================================================

  // Display attributes
  private _show_legend: boolean = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string) {
    super(id, name)
    // Default banner as multi
    this.banner = 'multi'
    // Create a first default tag
    this.addTag('Etiquette 0')

  }

  // PUBLIC METHODS =====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    json_object['show_legend'] = this._show_legend
    return json_object
  }

  /**
   *Set Tag_group value & substructur from JSON
   *
   * @param {{[_:string]:any}} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(json_object: { [_: string]: any }) {
    super.fromJSON(json_object)
    this._show_legend = json_object['show_legend'] ?? false
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_Tag(name, this, id)
    tag.setSelected()
    return tag
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

  public get show_legend(): boolean { return this._show_legend }

  // SETTER ==============================================================================

  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
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

  // Display attributes
  private _show_legend: boolean = false

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
    // Create and select a first default tag
    const tag = this.addTag('Etiquette 0')
    tag.setSelected()
  }

  // PUBLIC METHODS =====================================================================

  public selectTagsFromId(
    id: string
  ) {
    super.selectTagsFromId(id)
    this.checkSelectionCoherence()
  }

  public selectTagsFromIds(
    ids: string[]
  ) {
    super.selectTagsFromIds(ids)
    this.checkSelectionCoherence()
  }

  public toJSON() {
    const json_object = super.toJSON()
    json_object['show_legend'] = this._show_legend
    return json_object
  }

  /**
   *Set Tag_group value & substructur from JSON
   *
   * @param {{[_:string]:any}} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(json_object: { [_: string]: any }) {
    super.fromJSON(json_object)
    this._show_legend = json_object['show_legend'] ?? false
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    return new Class_DataTag(name, this, this._sankey, id)
  }

  // PRIVATE METHODES ===================================================================

  /**
   * Permet d'eviter de désélectionner tous les dataTags ce qui créerait une erreur
   * @private
   * @memberof Class_DataTagGroup
   */
  private checkSelectionCoherence() {
    if (this.selected_tags_list.length === 0) {
      this.tags_list[0]?.setSelected()
    }
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

  public get show_legend(): boolean { return this._show_legend }

  // SETTER ==============================================================================

  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
}


// CLASS TAGGROUP FOR NODES LEVELS ******************************************************

export class Class_TagGroupNodeLevel extends Class_TagGroup {

  // PRIVATE ATTRIBUTES==================================================================
  private _activated: boolean = false
  private _siblings: string[] = []

  // PUBLIC METHODS =====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    json_object['activated'] = this._activated
    json_object['sibling'] = this._siblings
    return json_object
  }

  public fromJSON(json_object: { [_: string]: any }) {
    super.fromJSON(json_object)
    this._activated = json_object['activated'] ?? true
    this._siblings = json_object['sibling'] ?? []
  }

  // GETTERS / SETTERS ==================================================================

  public get activated(): boolean { return this._activated }
  public set activated(value: boolean) {
    // Avoid useless updates
    if (this._activated !== value) {
      this._activated = value
      this.updateTagsReferences()
    }
  }

  public get siblings(): string[] { return this._siblings }
  public set siblings(value: string[]) {
    this._siblings = value
    this.updateTagsReferences()
  }
}

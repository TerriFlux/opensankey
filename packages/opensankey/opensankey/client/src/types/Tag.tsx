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

// Local types
import { Class_LinkElement } from '../Elements/Link'
import { Class_LinkValue } from '../Elements/LinkValues'
import { Class_NodeElement } from '../Elements/Node'
import {
  Class_NodeDimension
} from '../Elements/NodeDimension'
import {
  Type_JSON,
  default_grey_color,
  getBooleanFromJSON,
  getNumberFromJSON,
  getStringFromJSON,
  makeId
} from '../types/Utils'
import { Class_Sankey } from './Sankey'
import { Class_ProtoTagGroup, Class_TagGroup, Class_DataTagGroup, Class_LevelTagGroup } from './TagGroup'

// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type = 'none' | 'one' | 'multi' | 'sequence'

// CLASS PROTO TAG ***********************************************************************

/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // Unique ID
  private _id: string

  // Name
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
  protected abstract _group: Class_ProtoTagGroup

  // Sankey in which it applies
  protected _ref_sankey: Class_Sankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ProtoTag.
   * @param {string} name
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_ProtoTag
   */
  constructor(
    name: string,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    this._id = id ?? makeId(name)
    this._name = name
    this._ref_sankey = sankey
  }

  public abstract setReferenceFromIds(list_id: string[]): void

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

  // COPY METHODS =======================================================================

  /**
   * Copy given tag
   * @param {Class_ProtoTag} tag_to_copy
   * @memberof Class_ProtoTag
   */
  public copyFrom(tag_to_copy: Class_ProtoTag) {
    // Get infos
    this._copyFrom(tag_to_copy)
  }

  /**
   * Overridable method to copy a given tag
   * @protected
   * @param {Class_ProtoTag} tag_to_copy
   * @memberof Class_ProtoTag
   */
  protected _copyFrom(tag_to_copy: Class_ProtoTag) {
    this._name = tag_to_copy._name
    this._color = tag_to_copy._color
    this._is_selected = tag_to_copy._is_selected
    // Groups are switched from related group class
  }

  /**
   * Convert element to JSON
   * @param {Type_JSON} [kwargs]
   * @return {*}
   * @memberof Class_ProtoTag
   */
  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Init output JSON
    const json_object: Type_JSON = {}
    // Fill data
    this._toJSON(json_object, kwargs)
    // Return
    return json_object
  }

  /**
   * Overridable method for JSON conversion
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [_kwargs]
   * @memberof Class_ProtoTag
   */
  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    json_object['name'] = this._name
    json_object['selected'] = this._is_selected
    json_object['color'] = this._color
  }

  /**
   *
   *
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [kwargs]
   * @memberof Class_ProtoTag
   */
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    // Get infos
    this._fromJSON(json_object, kwargs)
  }

  /**
   * Set Tag value from JSON
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [_kwargs]
   * @memberof Class_ProtoTag
   */
  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): void {
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._is_selected = getBooleanFromJSON(json_object, 'selected', false)
    this._color = getStringFromJSON(json_object, 'color', this._color)
  }

  // PUBLIC METHODES ==================================================================

  public setSelected(
    update: boolean = true
  ) {
    // Avoid useless update
    if (this._is_selected === false) {
      // Set attributes
      this._is_selected = true
      // Update this fingerprint
      this.updateFingerprint()
      // Redraw all related elements
      if (update) this.update()
    }
  }

  public setUnSelected(
    update: boolean = true
  ) {
    // Avoid useless update
    if (this._is_selected === true) {
      // Set attributes
      this._is_selected = false
      // Update this fingerprint
      this.updateFingerprint()
      // Redraw all related elements
      if (update) this.update()
    }
  }

  public toogleSelected() {
    // Set attributes
    this._is_selected = !this._is_selected
    // Redraw all related elements
    this.update()
  }

  // PROTECTED METHODS ==================================================================

  protected abstract cleanForDeletion(): void
  protected abstract update(): void
  protected abstract updateFingerprint(): void

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
  public set is_selected(_: boolean) { this._is_selected = _ }

  // Group
  public abstract get group(): Class_ProtoTagGroup
}

// CLASS TAG ****************************************************************************

/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_Tag extends Class_ProtoTag {

  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  protected _references: { [_: string]: Class_NodeElement | Class_LinkElement | Class_LinkValue } = {}

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
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, sankey, id)
    this._group = group
  }

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

  // PUBLIC METHODS =====================================================================

  public update() {
    // Redraw elements
    Object.values(this._references)
      .forEach(element => {
        element.draw()
      })
    // Update legend
    this._ref_sankey.drawing_area.legend.draw()
  }

  public hasGivenReference(_: Class_NodeElement | Class_LinkElement | Class_LinkValue) {
    return (this._references[_.id] !== undefined)
  }

  public addReference(_: Class_NodeElement | Class_LinkElement | Class_LinkValue) {
    if (!this.hasGivenReference(_)) {
      this._references[_.id] = _
      _.addTag(this)
    }
  }

  public removeReference(_: Class_NodeElement | Class_LinkElement | Class_LinkValue) {
    if (this.hasGivenReference(_)) {
      delete this._references[_.id]
      _.removeTag(this)
    }
  }

  // PROTECTED METHODS ==================================================================

  protected abstract updateFingerprint(): void

  // GETTERS ============================================================================

  public get group() { return this._group }

  public get references() { return Object.values(this._references) }

}

// CLASS NODETAG ****************************************************************************

/**
 * Class that define a node tag object
 * @class Class_Tag
 */
export class Class_NodeTag extends Class_Tag {
  // PROTECTED METHODS ==================================================================

  /**
   * Assign tag to node from list 
   *
   * @param {string[]} list_id
   * @memberof Class_NodeTag
   */
  public setReferenceFromIds(list_id: string[]): void {
    // go throught list of node referenced & add this tag 
    list_id.forEach(nid => {
      const node_ref = this._ref_sankey.nodes_dict[nid]
      if (!this.hasGivenReference(node_ref)) {
        this._references[nid] = node_ref
        node_ref.addTag(this)
      }
    })
  }

  // PROTECTED METHODS ==================================================================

  protected updateFingerprint() {
    this._ref_sankey.nodeTagsUpdated()
  }

}

// CLASS FLUXTAG ****************************************************************************

/**
 * Class that define a node tag object
 * @class Class_Tag
 */
export class Class_FluxTag extends Class_Tag {


  // PUBLIC METHODS =====================================================================

  /**
   * Assign tag to links from list 
   *
   * @param {string[]} list_id_link_val
   * @memberof Class_FluxTag
   */
  public setReferenceFromIds(list_id_link_val: string[]): void {
    // Go throught all link
    this._ref_sankey.links_list.forEach(link => {
      const l_values= link.getAllValues()
      // if a link value id is in list_id_link_val then add tag to link value
      list_id_link_val.forEach(lid=>{
        if(lid in l_values){
          l_values[lid][0].addTag(this)
        }
      })
    })
  }


  // PROTECTED METHODS ==================================================================

  protected updateFingerprint() {
    this._ref_sankey.fluxTagsUpdated()
  }

}

// CLASS DATATAG ************************************************************************

export class Class_DataTag extends Class_ProtoTag {
  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  private _references: { [_: string]: Class_LinkElement } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_DataTagGroup

  private _scale: number
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
    super(name, sankey, id)
    this._group = group
    this._references = sankey.links_dict
    // Indicate that we will need to recompute visibility
    this._ref_sankey.dataTagsUpdated()
    // Update all links
    Object.values(this._references)
      .forEach(ref => ref.addDataTag(this))
    this._scale = 10
  }


protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    super._toJSON(json_object,_kwargs)
    json_object['scale'] = this._scale
  }

  /**
   * Overridable method to copy a given tag
   * @protected
   * @param {Class_ProtoTag} tag_to_copy
   * @memberof Class_ProtoTag
   */
  protected _copyFrom(tag_to_copy: Class_ProtoTag) {
    super._copyFrom(tag_to_copy)
    this._scale = (tag_to_copy as Class_DataTag)._scale
  }

  /**
   * Set Tag value from JSON
   * @protected
   * @param {Type_JSON} json_object
   * @param {Type_JSON} [_kwargs]
   * @memberof Class_ProtoTag
   */
  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object,_kwargs)
    this._scale = getNumberFromJSON(json_object, 'scale', this._scale)
  }


  public update() { } // Does nothing - never called

  public override setSelected(): void {
    // Avoid useless update
    if (this.is_selected === false) {
      // Set attributes
      this.is_selected = true
      // Indicate that we will need to recompute visibility
      this.updateFingerprint()
    }
  }

  public override setUnSelected(): void {
    // Avoid useless update
    if (this.is_selected === true) {
      // Set attributes
      this.is_selected = false
      // Indicate that we will need to recompute visibility
      this.updateFingerprint()
    }
  }

  // Implement function so we can use it in config tags
  // we don't need to ref elements in this function because for DataTag it reference all links (done in constructor)
  public setReferenceFromIds(): void {
    // TODO : Not implemented yet
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
    // Indicate that we will need to recompute visibility
    this._ref_sankey.dataTagsUpdated()
    // Unref references
    this._references = {}
  }

  // PROTECTED METHODS ==================================================================

  protected updateFingerprint() {
    this._ref_sankey.dataTagsUpdated()
  }

  // GETTERS ============================================================================

  public get group() { return this._group }

  public get references() { return Object.values(this._references) }

  public get scale() {
    if (this.group.is_unit) return this._scale
    return this._ref_sankey.drawing_area.scale
  }
  public set scale(_) {
    if (this.group.is_unit) this._scale = _
    else this._scale = _
  }
}

// CLASS LEVELTAG ***********************************************************************
/**
 * Class that define a Level Tag object - Fusionné avec Class_ProtoLevelTag
 * @export
 * @class Class_LevelTag
 */
export class Class_LevelTag {

  // PRIVATE ATTRIBUTES =================================================================

  // Unique ID
  private _id: string

  // Name
  private _name: string

  // Color of tag
  private _color: string = default_grey_color

  // Boolean
  private _is_selected: boolean = false

  /**
   * True if tag is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_LevelTag
   */
  private _is_currently_deleted = false

  // List of elements that relates to this tag
  private _dimensions_as_tag_for_parent: { [_: string]: Class_NodeDimension } = {}
  private _dimensions_as_tag_for_children: { [_: string]: Class_NodeDimension } = {}
  private _references: { [_: string]: Class_NodeElement | Class_LinkElement | Class_LinkValue } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_LevelTagGroup

  // Sankey in which it applies
  protected _ref_sankey: Class_Sankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LevelTag.
   * @param {string} name
   * @param {Class_LevelTagGroup} group
   * @param {Class_Sankey} sankey
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_LevelTag
   */
  constructor(
    name: string,
    group: Class_LevelTagGroup,
    sankey: Class_Sankey,
    id: string | undefined = undefined
  ) {
    this._id = id ?? makeId(name)
    this._name = name
    this._ref_sankey = sankey
    this._group = group
  }

  // CLEANING METHODS ====================================================================

  /**
   * Define deletion behavior
   * @memberof Class_LevelTag
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

  protected cleanForDeletion() {
    // Need to delete references
    this.dimensions_list_as_tag_for_children.forEach(dim => dim.delete())
    this._dimensions_as_tag_for_children = {}
    this.dimensions_list_as_tag_for_parent.forEach(dim => dim.delete())
    this._dimensions_as_tag_for_parent = {}
    // Let the garbage collector do the rest
  }

  // COPY METHODS =====================================================================

  public copyFrom(tag_to_copy: Class_LevelTag) {
    // Get infos
    this._copyFrom(tag_to_copy)
  }

  protected _copyFrom(tag_to_copy: Class_LevelTag) {
    this._name = tag_to_copy._name
    this._color = tag_to_copy._color
    this._is_selected = tag_to_copy._is_selected
    // Groups are switched from related group class
  }

  // JSON METHODS =======================================================================

  public toJSON(kwargs?: Type_JSON) {
    const json_object = {} as Type_JSON
    this._toJSON(json_object, kwargs)
    return json_object
  }

  protected _toJSON(json_object: Type_JSON, _kwargs?: Type_JSON) {
    json_object['name'] = this._name
    if (!this._is_selected) json_object['selected'] = this._is_selected
    if (this._color) json_object['color'] = this._color
  }

  public fromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    // Get infos
    this._fromJSON(json_object, kwargs)
  }

  protected _fromJSON(json_object: Type_JSON, _kwargs?: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._is_selected = getBooleanFromJSON(json_object, 'selected', true)
    this._color = getStringFromJSON(json_object, 'color', this._color)
  }

  // PUBLIC METHODES ====================================================================

  public update() {
    this._ref_sankey.showAccordingToLevelTags()
  }

  public setSelected() {
    // Avoid useless update
    if (this._is_selected === false) {
      // Exclude other levels tags from selection and reinit dimension to default behavior
      this._group.tags_list
        .filter(tag => tag !== this)
        .forEach(tag => tag.setUnSelected())
      // Set attributes
      this._is_selected = true
      // Redraw all related elements
      this.update()
    }
  }

  public setUnSelected() {
    // run it even if this._is_selected is already false
    // as update hides force node
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

  public getOrCreateLowerDimension(
    parent: Class_NodeElement,
    child: Class_NodeElement,
    child_tag: Class_LevelTag
  ) {
    // Try to find matching dimension with :
    // - this as parent tag
    // - input child_tag as child tag
    // - parent node as parent
    let dimension_found: Class_NodeDimension | undefined
    this.dimensions_list_as_tag_for_parent.forEach(dimension => {
      // Match dimension if all these conditions are true
      // - Parent are the same
      // - Parent level tags are the same
      // - child level tag is the same
      if (
        (dimension.parent_level_tag === this) &&
        (dimension.child_level_tag == child_tag) &&
        (dimension.parent === parent)
      ) {
        dimension_found = dimension
      }
    })
    
    // If found - just add child
    if (dimension_found) {
      dimension_found.addNodeAsChild(child)
    }
    // If no dimension has been found, create a new one
    else {
      dimension_found = new Class_NodeDimension(
        parent,
        [child],
        this,
        child_tag
      )
    }
    return dimension_found
  }

  public isLevelForChildren(_: Class_NodeDimension) {
    return (this._dimensions_as_tag_for_children[_.id] !== undefined)
  }

  public isLevelForParent(_: Class_NodeDimension) {
    return (this._dimensions_as_tag_for_parent[_.id] !== undefined)
  }

  public addAsChildrenLevel(_: Class_NodeDimension) {
    if (!this.isLevelForChildren(_)) {
      this._dimensions_as_tag_for_children[_.id] = _
      _.child_level_tag = this
    }
  }

  public addAsParentLevel(_: Class_NodeDimension) {
    if (!this.isLevelForParent(_)) {
      this._dimensions_as_tag_for_parent[_.id] = _
      _.parent_level_tag = this
    }
  }

  public removeChildrenLevel(_: Class_NodeDimension) {
    if (this.isLevelForChildren(_)) {
      delete this._dimensions_as_tag_for_children[_.id]
      _.delete()
    }
  }

  public removeParentLevel(_: Class_NodeDimension) {
    if (this.isLevelForParent(_)) {
      delete this._dimensions_as_tag_for_parent[_.id]
      _.delete()
    }
  }

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
  public set is_selected(_: boolean) {
    // Only one level tag per group can be selected
    if (_ == true)
      this._group.tags_list.forEach(tag => tag.is_selected = false)
    this._is_selected = _
  }

  // Group
  public get group() { return this._group }

  // Dimensions
  public get has_upper_dimensions() {
    return (this.dimensions_list_as_tag_for_children.length > 0)
  }

  public get has_lower_dimensions() {
    return (this.dimensions_list_as_tag_for_parent.length > 0)
  }

  public get dimensions_list_as_tag_for_parent() {
    return Object.values(this._dimensions_as_tag_for_parent)
  }

  public get dimensions_list_as_tag_for_children() {
    return Object.values(this._dimensions_as_tag_for_children)
  }

  public get references() { return Object.values(this._references) }
}
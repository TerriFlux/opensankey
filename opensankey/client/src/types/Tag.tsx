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
import {
  Class_NodeDimension
} from '../Elements/NodeDimension'
import {
  ClassAbstract_DrawingArea,
  ClassAbstract_ProtoLevelTag,
  ClassAbstract_ProtoLevelTagGroup,
  ClassAbstract_Sankey,
  ClassAbstract_ProtoTag,
  ClassAbstract_ProtoTagGroup
} from '../types/Abstract'
import {
  ClassAbstract_NodeElement
} from '../types/AbstractNode'
import {
  ClassAbstract_LinkElement,
  ClassAbstract_LinkValue
} from './AbstractLink'
import {
  Type_JSON,
  default_grey_color,
  getBooleanFromJSON,
  getStringFromJSON,
  getStringListFromJSON,
  makeId
} from '../types/Utils'
import colormap from 'colormap'

// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type = 'none' | 'one' | 'multi' | 'level'

type TypeAbstract_NodeElement = ClassAbstract_NodeElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
export type TypeAbstract_TagReference = TypeAbstract_NodeElement | ClassAbstract_LinkValue | TypeAbstract_DataTagReference
type TypeAbstract_DataTagReference = ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>

// CLASS PROTO TAG ***********************************************************************

/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoTag extends ClassAbstract_ProtoTag {

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
  protected _ref_sankey: ClassAbstract_Sankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ProtoTag.
   * @param {string} name
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_ProtoTag
   */
  constructor(
    name: string,
    sankey: ClassAbstract_Sankey,
    id: string | undefined = undefined
  ) {
    super()
    this._id = id ?? makeId(name)
    this._name = name
    this._ref_sankey = sankey
  }

  // CLEANING METHODS ===================================================================

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
  protected _references: { [_: string]: TypeAbstract_TagReference } = {}

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
    sankey: ClassAbstract_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, sankey, id)
    this._group = group
  }

  // CLEANING METHODS ===================================================================

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

  public hasGivenReference(_: TypeAbstract_TagReference) {
    return (this._references[_.id] !== undefined)
  }

  public addReference(_: TypeAbstract_TagReference) {
    if (!this.hasGivenReference(_)) {
      this._references[_.id] = _
      _.addTag(this)
    }
  }

  public removeReference(_: TypeAbstract_TagReference) {
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
  private _references: { [_: string]: TypeAbstract_DataTagReference } = {}

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong
  protected _group: Class_DataTagGroup

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_DataTag.
   * @param {string} name
   * @param {Class_TagGroup} group
   * @param {ClassAbstract_Sankey} sankey
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_DataTag
   */
  constructor(
    name: string,
    group: Class_DataTagGroup,
    sankey: ClassAbstract_Sankey,
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
  }

  // PUBLIC METHODS =====================================================================

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
}

// CLASS PROTO LEVEL TAG ****************************************************************
/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoLevelTag extends ClassAbstract_ProtoLevelTag {

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
  protected abstract _group: Class_ProtoLevelTagGroup

  // Sankey in which it applies
  protected _ref_sankey: ClassAbstract_Sankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ProtoTag.
   * @param {string} name
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_ProtoTag
   */
  constructor(
    name: string,
    sankey: ClassAbstract_Sankey,
    id: string | undefined = undefined
  ) {
    super()
    this._id = id ?? makeId(name)
    this._name = name
    this._ref_sankey = sankey
  }

  // CLEANING METHODS ====================================================================

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

  protected abstract cleanForDeletion(): void

  // COPY METHODS =====================================================================

  public copyFrom(tag_to_copy: Class_ProtoLevelTag) {
    // Get infos
    this._copyFrom(tag_to_copy)
  }

  protected _copyFrom(tag_to_copy: Class_ProtoLevelTag) {
    this._name = tag_to_copy._name
    this._color = tag_to_copy._color
    this._is_selected = tag_to_copy._is_selected
    // Groups are switched from related group class
  }

  public toJSON(
    kwargs?: Type_JSON
  ) {
    const json_object = {} as Type_JSON
    this._toJSON(json_object, kwargs)
    return json_object
  }

  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    json_object['name'] = this._name
    json_object['selected'] = this._is_selected
    json_object['color'] = this._color
  }

  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // Get infos
    this._fromJSON(json_object, kwargs)
  }

  protected _fromJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._is_selected = getBooleanFromJSON(json_object, 'selected', false)
    this._color = getStringFromJSON(json_object, 'color', this._color)
  }

  // PUBLIC METHODES ==================================================================

  public abstract update(): void

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
  public abstract get group(): Class_ProtoLevelTagGroup
}

// CLASS LEVELTAG ***********************************************************************

export class Class_LevelTag extends Class_ProtoLevelTag {

  // PROTECTED ATTRIBUTES ===============================================================

  // Group where it belong

  protected _group: Class_LevelTagGroup

  private _references: { [_: string]: TypeAbstract_TagReference } = {}

  // PRIVATE ATTRIBUTES =================================================================

  // List of elements that relates to this tag
  private _dimensions_as_tag_for_parent: { [_: string]: Class_NodeDimension } = {}
  private _dimensions_as_tag_for_children: { [_: string]: Class_NodeDimension } = {}

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_LevelTag.
   * @param {string} name
   * @param {Class_LevelTagGroup} group
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_LevelTag
   */
  constructor(
    name: string,
    group: Class_LevelTagGroup,
    sankey: ClassAbstract_Sankey,
    id: string | undefined = undefined
  ) {
    super(name, sankey, id)
    this._group = group
  }

  // CLEANING METHODS ===================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Need to delete references
    this.dimensions_list_as_tag_for_children
      .forEach(dim => dim.delete())
    this._dimensions_as_tag_for_children = {}
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => dim.delete())
    this._dimensions_as_tag_for_parent = {}
    // Let the garbage collector do the rest
  }

  // COPY METHODS =======================================================================

  // /**
  //  * Copy all attributes from input tags + Set the same refs
  //  *
  //  * @param {Class_DataTag} tag
  //  * @memberof Class_DataTag
  //  */
  // protected _copyFrom(tag_to_copy: Class_LevelTag) {
  //   // Copy herited attributes
  //   super._copyFrom(tag_to_copy)
  //   // Get all existing references ------------------------------------------------------
  //   // Create a dict of all existing node in this related sankey
  //   const all_existing_nodes = this._ref_sankey.nodes_dict
  //   // Create a dict of all existing dimensions in this related sankey
  //   const all_existing_dim: { [_: string]: Class_NodeDimension } = {}
  //   this._ref_sankey.level_taggs_list
  //     .forEach(tagg => {
  //       (tagg as Class_LevelTagGroup).tags_list
  //         .forEach(tag => {
  //           // Check children dimensions
  //           tag.dimensions_list_as_tag_for_children
  //             .filter(dim => !(dim.id in all_existing_dim))
  //             .forEach(dim => all_existing_dim[dim.id] = dim)
  //           // Check parent dimensions
  //           tag.dimensions_list_as_tag_for_parent
  //             .filter(dim => !(dim.id in all_existing_dim))
  //             .forEach(dim => all_existing_dim[dim.id] = dim)
  //         })
  //     })
  //   // Synchro dimensions where tag is for children -------------------------------------
  //   // Add missing but existing dimensions where this is a tag for children
  //   tag_to_copy.dimensions_list_as_tag_for_children
  //     .filter(dim => {
  //       return (
  //         (dim.id in all_existing_dim) &&
  //         !(dim.id in this._dimensions_as_tag_for_children)
  //       )
  //     })
  //     .forEach(dim => {
  //       this.addAsChildrenLevel(all_existing_dim[dim.id])
  //     })
  //   // Add missing and non-existing dimensions where this is a tag for children
  //   tag_to_copy.dimensions_list_as_tag_for_children
  //     .filter(dim => {
  //       // Verify if there is at least one child that exist in related sankey
  //       let at_least_one_match_for_children = false
  //       dim.children
  //         .forEach(child => at_least_one_match_for_children = (
  //           (at_least_one_match_for_children) ||
  //           (child.id in all_existing_nodes)))
  //       // And verify that parent also exists in related sankey
  //       // And that related tag for parent is in the same group
  //       return (
  //         !(dim.id in all_existing_dim) &&
  //         (dim.parent.id in all_existing_nodes) &&
  //         (at_least_one_match_for_children) &&
  //         (dim.parent_level_tag.id in this.group.tags_dict)
  //       )
  //     })
  //     .forEach(dim => {
  //       const parent = all_existing_nodes[dim.parent.id]
  //       const children = dim.children.map(_ => all_existing_nodes[_.id])
  //       const parent_level_tag = this.group.tags_dict[dim.parent_level_tag.id]
  //       const new_dim = new Class_NodeDimension(
  //         parent,
  //         children,
  //         parent_level_tag as ClassAbstract_ProtoLevelTag,
  //         [this] as ClassAbstract_ProtoLevelTag[],
  //         dim.id
  //       )
  //       this.addAsChildrenLevel(new_dim)
  //     })
  //   // Remove existing dimension where this tag is no more
  //   this.dimensions_list_as_tag_for_children
  //     .filter(dim => {
  //       return (
  //         !(dim.id in tag_to_copy._dimensions_as_tag_for_children)
  //       )
  //     })
  //     .forEach(dim => this.removeChildrenLevel(dim))
  //   // Synchro dimensions where tag is for parents --------------------------------------
  //   // Add missing but existing dimensions where this is a tag for parent
  //   tag_to_copy.dimensions_list_as_tag_for_parent
  //     .filter(dim => {
  //       return (
  //         (dim.id in all_existing_dim) &&
  //         !(dim.id in this._dimensions_as_tag_for_parent)
  //       )
  //     })
  //     .forEach(dim => {
  //       this.addAsParentLevel(all_existing_dim[dim.id])
  //     })
  //   // Add missing and non-existing dimensions where this is a tag for parent
  //   tag_to_copy.dimensions_list_as_tag_for_parent
  //     .filter(dim => {
  //       // Verify if there is at least one child that exist in related sankey
  //       let ok_for_children_nodes = false
  //       dim.children
  //         .forEach(child => ok_for_children_nodes = (
  //           (ok_for_children_nodes) ||
  //           (child.id in all_existing_nodes)))
  //       // And that related tag for parent is in the same group
  //       let ok_children_level_tags = false
  //       dim.children_level_tags
  //         .forEach(tag => ok_children_level_tags = (
  //           (ok_children_level_tags) ||
  //           (tag.id in this.group.tags_dict)
  //         ))
  //       // And verify that parent also exists in related sankey
  //       return (
  //         !(dim.id in all_existing_dim) &&
  //         (dim.parent.id in all_existing_nodes) &&
  //         (ok_for_children_nodes) &&
  //         (ok_children_level_tags)
  //       )
  //     })
  //     .forEach(dim => {
  //       const parent = all_existing_nodes[dim.parent.id]
  //       const children = dim.children.map(_ => all_existing_nodes[_.id])
  //       const children_level_tag = dim.children_level_tags
  //         .filter(tag => tag.id in this.group.tags_dict)
  //         .map(tag => this.group.tags_dict[tag.id])
  //       const new_dim = new Class_NodeDimension(
  //         parent,
  //         children,
  //         this as ClassAbstract_ProtoLevelTag,
  //         children_level_tag,
  //         dim.id
  //       )
  //       this.addAsParentLevel(new_dim)
  //     })
  //   // Remove existing dimension where this tag is no more
  //   this.dimensions_list_as_tag_for_parent
  //     .filter(dim => {
  //       return (
  //         !(dim.id in tag_to_copy._dimensions_as_tag_for_parent)
  //       )
  //     })
  //     .forEach(dim => this.removeParentLevel(dim))
  // }

  // PUBLIC METHODS =====================================================================

  public setSelected() {
    // Exclude other levels tags from selection and reinit dimension to default dehavior
    this._group.tags_list
      .filter(tag => tag !== this)
      .forEach(tag => tag.setUnSelected())
    // Apply selection
    super.setSelected()
  }

  public setUnSelected() {
    // Reinit dimension to default dehavior
    // Apply unselection
    super.setUnSelected()
  }

  public update() {
    this.dimensions_list_as_tag_for_children
      .forEach(dim => {
        if (dim.parent_level_tag.group.activated) {
          dim.showAccordingToLevelTags()
        }
      })
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => {
        if (dim.parent_level_tag.group.activated) {
          dim.showAccordingToLevelTags()
        }
      })
  }

  public getOrCreateLowerDimension(
    parent: TypeAbstract_NodeElement,
    child: TypeAbstract_NodeElement,
    child_tag: Class_LevelTag
  ) {

    // Try to find matching dimension with :
    // - this as parent tag
    // - input child_tag as child tag
    // - parent node as parent
    let dimension_found: Class_NodeDimension | undefined
    this.dimensions_list_as_tag_for_parent
      .forEach(dimension => {
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
        this as ClassAbstract_ProtoLevelTag,
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

  // GETTERS ============================================================================

  public get group() { return this._group }

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

// CLASS PROTO TAGGROUP *****************************************************************

/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export abstract class Class_ProtoTagGroup extends ClassAbstract_ProtoTagGroup {

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

  protected abstract _tags: { [id: string]: Class_ProtoTag }

  protected _ref_sankey: ClassAbstract_Sankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string, sankey: ClassAbstract_Sankey) {
    super()
    this._id = id
    this._name = name
    this._ref_sankey = sankey
  }

  // CLEANING METHODS ===================================================================

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

  // COPY METHODS =======================================================================

  public copyFrom(
    tagg_to_copy: Class_ProtoTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    this._copyFrom(tagg_to_copy, matching_tags_id)
  }

  protected _copyFrom(
    tagg_to_copy: Class_ProtoTagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    const revert_matching_id: { [id: string]: string } = {}
    Object.entries(matching_tags_id).forEach(([k, v]) => revert_matching_id[v] = k)
    // Common attributes
    this._name = tagg_to_copy._name
    this._banner = tagg_to_copy._banner
    this._tag_count = tagg_to_copy._tag_count

    // Synchro current tags
    this.tags_list
      .forEach(tag => {
        // Delete tags not present in new layout but present in curr
        if (!((matching_tags_id[tag.id] ?? tag.id) in tagg_to_copy.tags_dict))
          this.removeTag(tag)
        // Transfer tags attr present in new layout and in curr
        else
          tag.copyFrom(tagg_to_copy.tags_dict[(matching_tags_id[tag.id] ?? tag.id)])
      })

    // Add missing tags
    tagg_to_copy.tags_list
      .forEach(tag => {
        if (!((revert_matching_id[tag.id] ?? tag.id) in this.tags_dict))
          this.addTag(tag.name, tag.id).copyFrom(tag)
      })
  }

  public toJSON(
    kwargs?: Type_JSON
  ) {
    // Create empty structs
    const json_object = {} as Type_JSON
    this._toJSON(json_object, kwargs)
    return json_object
  }

  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    // Fill group attributes
    json_object['name'] = this._name
    json_object['banner'] = this._banner
    // Update tags infos
    const json_object_tags = {} as Type_JSON
    this.tags_list
      .forEach(tag => {
        json_object_tags[tag.id] = tag.toJSON()
      })
    json_object['tags'] = json_object_tags
  }

  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    this._fromJSON(json_object, kwargs)
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    // Read group attributes
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._banner = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
    // Create new tags & read their attributes
    const matching_tags_id: { [_: string]: string } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: string } : {}
    Object.entries(json_object['tags'])
      .forEach(([_, tag_json]) => {
        // Get or Create tag
        const tag_id = matching_tags_id[_] ?? _
        const tag = this._tags[_] ?? this.addTag(tag_id, tag_id) // Tag will be renamed in fromJSON method
        // Update tag with json
        tag.fromJSON(tag_json as Type_JSON)
      })

  }

  private fromLegacyJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'group_name', this._name)
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
    return this.addTag(name)
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
    const _selectTagsFromId = (_: string) => {
      this.tags_list
        .forEach(tag => {
          if (tag.id === _) {
            tag.setSelected()
          }
          else {
            tag.setUnSelected()
          }
        })
      this.updateTagsReferences()
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToTags()
    }

    const old_selected = this.selected_tags_list[0].id
    this._ref_sankey.drawing_area.application_data.history.saveUndo(() => _selectTagsFromId(old_selected))
    this._ref_sankey.drawing_area.application_data.history.saveRedo(() => _selectTagsFromId(id))
    _selectTagsFromId(id)
  }

  public selectTagsFromIds(
    ids: string[]
  ) {
    this.tags_list
      .forEach(tag => {
        if (ids.includes(tag.id)) {
          tag.setSelected(false)
        }
        else {
          tag.setUnSelected(false)
        }
      })
    this.updateTagsReferences()
  }

  public abstract updateTagsReferences(): void

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
  public abstract get tags_dict(): { [_: string]: Class_ProtoTag }

  /**
  * Return list tag from the current group
  * @readonly
  * @memberof Class_ProtoTagGroup
  */
  public abstract get tags_list(): Class_ProtoTag[]

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public abstract get selected_tags_list(): Class_ProtoTag[]

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
export abstract class Class_TagGroup extends Class_ProtoTagGroup {

  // PROTECTED ATTRIBUTES ===============================================================

  protected abstract _tags: { [_: string]: Class_Tag }

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
  constructor(
    id: string,
    name: string,
    sankey: ClassAbstract_Sankey,
  ) {
    super(id, name, sankey)
    // Default banner as multi
    this.banner = 'multi'
  }

  // CLEANING METHODS ==================================================================

  // COPY METHODS =====================================================================

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['show_legend'] = this._show_legend
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._show_legend = getBooleanFromJSON(json_object, 'show_legend', this._show_legend)
    const nb_tags = Object.values(this._tags).length
    if (Object.values(this._tags).filter(tag => tag.color != '').length == 0) {
      // if tags has no colors they are generated from the defaut color map
      const colors = colormap({
        colormap: 'jet',
        nshades: Math.max(11, nb_tags),
        format: 'hex',
        alpha: 1
      })
      let step = 1
      if (nb_tags < 11) {
        // colormap is sampled uniformly between the first index and the last
        step = Math.round(11 / nb_tags)
      }
      Object.values(this._tags).forEach((tag, i) => tag.color = colors[i * step])
    }
  }

  protected _copyFrom(
    tagg_to_copy: Class_TagGroup,
    matching_tags_id: { [_: string]: string; } = {}
  ) {
    super._copyFrom(tagg_to_copy, matching_tags_id)
    this._show_legend = tagg_to_copy.show_legend
  }

  // PUBLIC METHODS =====================================================================

  public updateTagsReferences(): void {
    const ref_updated: TypeAbstract_TagReference[] = []
    Object.values(this._tags)
      .forEach(tag => {
        tag.references
          .forEach(ref => {
            if (ref_updated.indexOf(ref) < 0) {
              ref.draw()
              ref_updated.push(ref)
            }
          })
      })
    this._ref_sankey.drawing_area.checkAndUpdateAreaSize()
  }

  // PROTECTED METHODS ==================================================================

  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_Tag

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

  // SETTER =============================================================================

  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
}

// CLASS NODETAGGROUP *******************************************************************

/**
 * Class that define a Node TagGroup object
 * @export
 * @class Class_TagGroup
 */
export class Class_NodeTagGroup extends Class_TagGroup {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _tags: { [_: string]: Class_NodeTag }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: ClassAbstract_Sankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Init dict of tags
    this._tags = {}
    // Create a first default tag
    if (with_a_tag) this.addTag('Etiquette 0')
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_NodeTag(name, this, this._ref_sankey, id)
    tag.setSelected()
    return tag
  }

}

// CLASS FLUXTAGGROUP *******************************************************************

/**
 * Class that define a Flux TagGroup object
 * @export
 * @class Class_TagGroup
 */
export class Class_FluxTagGroup extends Class_TagGroup {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _tags: { [_: string]: Class_FluxTag }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: ClassAbstract_Sankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Init dict of tags
    this._tags = {}
    // Create a first default tag
    if (with_a_tag) this.addTag('Etiquette 0')
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_FluxTag(name, this, this._ref_sankey, id)
    tag.setSelected()
    return tag
  }

}

// CLASS DATATAGGROUP *******************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export class Class_DataTagGroup extends Class_ProtoTagGroup {

  // PRIVATE ATTRIBUTES =================================================================

  // Display attributes
  private _show_legend: boolean = false

  private _is_sequence: boolean = false

  // PROTECTED ATTRIBUTES ===============================================================

  protected _tags: { [_: string]: Class_DataTag }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(
    id: string,
    name: string,
    sankey: ClassAbstract_Sankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Init dict of tags
    this._tags = {}
    // Create and select a first default tag
    if (with_a_tag) {
      const tag = this.addTag('Etiquette 0')
      tag.setSelected()
    }
  }

  // COPY METHODS =======================================================================

  protected _copyFrom(
    tagg_to_copy: Class_DataTagGroup
  ) {
    super._copyFrom(tagg_to_copy)
    this._show_legend = tagg_to_copy.show_legend
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['show_legend'] = this._show_legend
    json_object['is_sequence'] = this._is_sequence
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._show_legend = getBooleanFromJSON(json_object, 'show_legend', this._show_legend)
    this._is_sequence = getBooleanFromJSON(json_object, 'is_sequence', this._is_sequence)
  }

  // PUBLIC METHODS =====================================================================

  public selectTagsFromId(
    id: string
  ) {

    const old_selected = this.selected_tags_list[0].id
    const _selectTagsFromId = (_: string) => {
      this.tags_list
        .forEach(tag => {
          if (tag.id === _) {
            tag.setSelected()
          }
          else {
            tag.setUnSelected()
          }
        })
      this.checkSelectionCoherence()
      this.updateTagsReferences()
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToDataTags()
    }

    this._ref_sankey.drawing_area.application_data.history.saveUndo(() => _selectTagsFromId(old_selected))
    this._ref_sankey.drawing_area.application_data.history.saveRedo(() => _selectTagsFromId(id))
    _selectTagsFromId(id)
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
    this.checkSelectionCoherence()
    this.updateTagsReferences()
  }

  public updateTagsReferences(): void {
    // On datatags update everything is impacted
    this._ref_sankey.drawing_area.draw()
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    return new Class_DataTag(name, this, this._ref_sankey, id)
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
   * @type {{ [_: string]: Class_DataTag }}
   * @memberof Class_DataTagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return dict tag from the current group
   * @type {Class_DataTag[]}
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
  public get is_sequence(): boolean { return this._is_sequence }

  // SETTER ==============================================================================

  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
  public set is_sequence(value: boolean) { this._is_sequence = value }
}

// CLASS PROTO TAGGROUP *****************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export abstract class Class_ProtoLevelTagGroup extends ClassAbstract_ProtoLevelTagGroup {

  // PRIVATE ATTRIBUTES =================================================================

  // Name
  private _id: string
  private _name: string

  // List of tags
  private _tag_count: number = 0

  // Type of banne
  private _banner: tag_banner_type = 'one'

  // PROTECTED ATTRIBUTES ===============================================================

  protected abstract _tags: { [id: string]: Class_ProtoLevelTag }

  protected _ref_sankey: ClassAbstract_Sankey

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_TagGroup
   */
  protected _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string, sankey: ClassAbstract_Sankey) {
    super()
    this._id = id
    this._name = name
    this._ref_sankey = sankey
  }

  // CLEANING METHODS ====================================================================

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

  // COPY METHODS ========================================================================

  public copyFrom(
    tagg_to_copy: Class_ProtoLevelTagGroup
  ) {
    this._copyFrom(tagg_to_copy)
  }

  protected _copyFrom(
    tagg_to_copy: Class_ProtoLevelTagGroup
  ) {
    // Common attributes
    this._name = tagg_to_copy._name
    this._banner = tagg_to_copy._banner
    this._tag_count = tagg_to_copy._tag_count

    // Synchronize tags
    // Synchronise current tag group's tag with tag groupto copy
    this.tags_list
      .forEach(tag => {
        // Delete tags not present in new layout but present in curr
        if (!(tag.id in tagg_to_copy.tags_dict))
          this.removeTag(tag)
        // Transfer tags attr present in new layout and in curr
        else
          tag.copyFrom(tagg_to_copy.tags_dict[tag.id])
      })
    // Add tag present in tagg_to_copy but not this
    tagg_to_copy.tags_list
      .forEach(tag => {
        if (!(tag.id in this.tags_dict))
          this.addTag(tag.name, tag.id).copyFrom(tag)
      })
  }

  public toJSON(
    kwargs?: Type_JSON
  ) {
    const json_object = {} as Type_JSON
    this._toJSON(json_object, kwargs)
    return json_object
  }

  protected _toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    // Fill group attributes
    json_object['name'] = this._name
    json_object['banner'] = this._banner
    // Update tags infos
    const json_object_tags = {} as Type_JSON
    this.tags_list
      .forEach(tag => {
        json_object_tags[tag.id] = tag.toJSON()
      })
    json_object['tags'] = json_object_tags
  }

  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    this._fromJSON(json_object, kwargs)
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    // Read group attributes
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._banner = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
    // Create new tags & read their attributes
    const matching_tags_id: { [_: string]: string } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: string } : {}
    Object.entries(json_object['tags'])
      .forEach(([_, tag_json]) => {
        // Get or Create tag
        const tag_id = matching_tags_id[_] ?? _
        const tag = this._tags[_] ?? this.addTag(tag_id, tag_id) // Tag will be renamed in fromJSON method
        // Update tag with json
        tag.fromJSON(tag_json as Type_JSON)
      })
  }

  private fromLegacyJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'group_name', this._name)
  }

  // PUBLIC METHODS =====================================================================

  public addTag(
    name: string,
    id: string | undefined = undefined
  ): Class_ProtoLevelTag {
    const tag = this.createTag(name, id)
    this._tags[tag.id] = tag
    this._tag_count = this._tag_count + 1
    return tag
  }

  public addDefaultTag(): Class_ProtoLevelTag {
    const n = String(this._tag_count)
    const name = 'Etiquette ' + n
    return this.addTag(name)
  }

  public removeTag(_: Class_ProtoLevelTag) {
    if (this._tags[_.id] !== undefined) {
      _.delete()
      delete this._tags[_.id]
    }
  }

  public selectTagsFromId(
    id: string
  ) {
    // Change selection but do not redraw
    const _selectTagsFromId = (_: string) => {
      this.tags_list
        .forEach(tag => {
          if (tag.id === _) {
            tag.setSelected()
          }
          else {
            tag.setUnSelected()
          }
        })
      this._ref_sankey.drawing_area.application_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
    }
    const old_selected = this.selected_tags_list[0].id
    this._ref_sankey.drawing_area.application_data.history.saveUndo(() => _selectTagsFromId(old_selected))
    this._ref_sankey.drawing_area.application_data.history.saveRedo(() => _selectTagsFromId(id))
    _selectTagsFromId(id)
  }

  public selectTagsFromIds(
    ids: string[]
  ) {
    // Change selection but do not redraw
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

  // PROTECTED METHODS ==================================================================

  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_ProtoLevelTag

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
   * @type {{ [_: string]: Class_ProtoLevelTag }}
   * @memberof Class_ProtoTagGroup
   */
  public abstract get tags_dict(): { [id: string]: Class_ProtoLevelTag }

  /**
  * Return list tag from the current group
  * @readonly
  * @memberof Class_ProtoTagGroup
  */
  public abstract get tags_list(): Class_ProtoLevelTag[]

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_ProtoTagGroup
   */
  public abstract get selected_tags_list(): Class_ProtoLevelTag[]

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

// CLASS LEVEL TAGGROUP *****************************************************************
/**
 * Tag group for node level
 * TODO fonctionnement à completer // dimension dans nodes
 * @export
 * @class Class_LevelTagGroup
 * @extends {Class_TagGroup}
 */
export class Class_LevelTagGroup extends Class_ProtoLevelTagGroup {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _tags: { [_: string]: Class_LevelTag } = {}

  // PRIVATE ATTRIBUTES==================================================================

  private _activated: boolean = false
  private _siblings: string[] = []
  private _antitagged_refs: TypeAbstract_NodeElement[] = []

  // CLEANING METHODS ===================================================================

  /**
   * Define deletion behavior
   * @memberof Class_ProtoTagGroup
   */
  public delete() {
    if (!this._is_currently_deleted) {
      // Super deletion
      super.delete()
      // Unref antitags
      this._antitagged_refs.forEach(ref => this.removeAntiTaggedRef(ref))
      this._antitagged_refs = []
    }
  }

  // COPY METHODS =======================================================================

  protected _copyFrom(
    tagg_to_copy: Class_LevelTagGroup
  ) {
    super._copyFrom(tagg_to_copy)
    this._activated = tagg_to_copy._activated
    this._siblings = tagg_to_copy._siblings
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['activated'] = this._activated
    json_object['siblings'] = this._siblings
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._fromJSON(json_object, kwargs)
    this._activated = getBooleanFromJSON(json_object, 'activated', this._activated)
    this._siblings = getStringListFromJSON(json_object, 'siblings', this._siblings)
  }

  // PUBLIC METHODS =====================================================================

  public sibling_activated() {
    return this._siblings.filter(tagg => {
      return this._ref_sankey.level_taggs_dict[tagg].activated
    }).map(tagg => this._ref_sankey.level_taggs_dict[tagg])
  }

  public addAntiTaggedRef(_: TypeAbstract_NodeElement) {
    if (!this._antitagged_refs.includes(_)) {
      this._antitagged_refs.push(_)
      _.addAsAntiTagged(this)
    }
  }

  public removeAntiTaggedRef(_: TypeAbstract_NodeElement) {
    if (this._antitagged_refs.includes(_)) {
      const idx = this._antitagged_refs.indexOf(_)
      this._antitagged_refs.splice(idx, 1)
      _.removeAsAntiTagged(this)
    }
  }

  /**
   * Function to add sibling to current group and referenced group,
   * because they mutually interact at some mechanic
   *
   * @param {Class_LevelTagGroup} _
   * @memberof Class_LevelTagGroup
   */
  public addSibling(_: Class_LevelTagGroup) {
    // Add antagonist grp id to sibling
    if (!this._siblings.includes(_.id)) {
      this._siblings.push(_.id)
    }

    // Add this grp id to sibling antagonist list
    if (!_._siblings.includes(this.id)) {
      _._siblings.push(this.id)
    }
  }

  /**
   * Function to remove sibling to current group and referenced group,
   * because they mutually interact at some mechanic
   *
   * @param {Class_LevelTagGroup} _
   * @memberof Class_LevelTagGroup
   */
  public removeSibling(_: Class_LevelTagGroup) {
    // remove antagonist grp id from sibling
    if (this._siblings.includes(_.id)) {
      const idx = this._siblings.indexOf(_.id)
      this._siblings.splice(idx, 1)
    }

    // remove this grp id from sibling antagonist list
    if (_._siblings.includes(this.id)) {
      const idx = _._siblings.indexOf(this.id)
      _._siblings.splice(idx, 1)
    }
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ): Class_LevelTag {
    const tag = new Class_LevelTag(name, this, this._ref_sankey, id)
    if (Object.keys(this._tags).length == 0) {
      tag.setSelected()
    } else {
      tag.setUnSelected()
    }
    return tag
  }

  // GETTERS / SETTERS ==================================================================

  public get activated(): boolean { return this._activated }
  public set activated(value: boolean) {
    // Avoid useless updates
    if (this._activated !== value) {
      this._activated = value
      if (this._activated === true) {
        this._siblings
          .forEach(sib_tagg_id => {
            if (this._ref_sankey.level_taggs_dict[sib_tagg_id])
              this._ref_sankey.level_taggs_dict[sib_tagg_id].activated = false
          })
      }
      this._ref_sankey.draw()
    }
  }

  public get siblings(): string[] { return this._siblings }
  public set siblings(value: string[]) {
    this._siblings = value
    this._ref_sankey.draw()
  }

  /**
   * Return dict tag from the current group
   * @type {{ [_: string]: Class_DataTag }}
   * @memberof Class_DataTagGroup
   */
  public get tags_dict() { return this._tags }

  /**
   * Return dict tag from the current group
   * @type {Class_DataTag[]}
   * @memberof Class_DataTagGroup
   */
  public get tags_list() { return Object.values(this.tags_dict) }

  /**
   * Return list of selected tag from the current group
   * @readonly
   * @memberof Class_DataTagGroup
   */
  public get selected_tags_list() { return this.tags_list.filter(t => t.is_selected) }

  public get antitagged_refs() { return this._antitagged_refs }
}

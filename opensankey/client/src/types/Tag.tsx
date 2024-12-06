// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local types
import {
  Class_NodeDimension
} from './NodeDimension'
import {
  Class_AbstractDrawingArea,
  Class_AbstractLevelTag,
  Class_AbstractLevelTagGroup,
  Class_AbstractSankey,
  Class_AbstractTag,
  Class_AbstractTagGroup
} from './Abstract'
import {
  Class_AbstractNodeElement
} from './AbstractNode'
import {
  Class_AbstractLinkElement,
  Class_AbstractLinkValue
} from './AbstractLink'
import {
  Type_JSON,
  default_grey_color,
  getBooleanFromJSON,
  getStringFromJSON,
  getStringListFromJSON,
  makeId
} from './Utils'

// SPECIFIC TYPES ***********************************************************************

export type tag_banner_type = 'none' | 'one' | 'multi' | 'level'

type Type_AbstractNodeElement = Class_AbstractNodeElement<Class_AbstractDrawingArea, Class_AbstractSankey>
type Type_TagReference = Type_AbstractNodeElement | Class_AbstractLinkValue
type Type_DataTagReference = Class_AbstractLinkElement<Class_AbstractDrawingArea, Class_AbstractSankey>

// CLASS PROTO TAG ***********************************************************************
/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoTag extends Class_AbstractTag {

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
  protected _ref_sankey: Class_AbstractSankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ProtoTag.
   * @param {string} name
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_ProtoTag
   */
  constructor(
    name: string,
    sankey: Class_AbstractSankey,
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
    this._ref_sankey.drawing_area.bypass_redraws = true // Security
    this._copyFrom(tag_to_copy)
    this._ref_sankey.drawing_area.bypass_redraws = false // Security
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
    this._ref_sankey = tag_to_copy._ref_sankey
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
    this._ref_sankey.drawing_area.bypass_redraws = true // Security
    this._fromJSON(json_object, kwargs)
    this._ref_sankey.drawing_area.bypass_redraws = false // Security
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
  public set is_selected(_: boolean) { this._is_selected = _ }

  // Group
  public abstract get group(): Class_ProtoTagGroup
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
    sankey: Class_AbstractSankey,
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
    Object.values(this._references)
      .forEach(element => {
        element.draw()
      })
    this._ref_sankey.drawing_area.legend.draw()
  }

  public hasGivenReference(_: Type_TagReference) {
    return (this._references[_.id] !== undefined)
  }

  public addReference(_: Type_TagReference) {
    if (!this.hasGivenReference(_)) {
      this._references[_.id] = _
      _.addTag(this)
    }
  }

  public removeReference(_: Type_TagReference) {
    if (this.hasGivenReference(_)) {
      delete this._references[_.id]
      _.removeTag(this)
    }
  }

  // GETTERS ============================================================================

  public get group() { return this._group }
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
   * @param {Class_AbstractSankey} sankey
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_DataTag
   */
  constructor(
    name: string,
    group: Class_DataTagGroup,
    sankey: Class_AbstractSankey,
    id: string | undefined = undefined
  ) {
    super(name, sankey, id)
    this._group = group
    this._references = sankey.links_dict
    // Update all links
    Object.values(this._references)
      .forEach(ref => ref.addDataTag(this))
  }

  // PUBLIC METHODS =====================================================================

  public update() {
    // List of nodes affected by the update of tag variable
    const nodes_to_redraw:Type_AbstractNodeElement[]=[]
    Object.values(this._references)
      .forEach(element => {
        nodes_to_redraw.push(element.source)
        nodes_to_redraw.push(element.target)
      });
    [...new Set(nodes_to_redraw)] //remove duplicate to avoid draw multiple time the same node
      .forEach(n => n.draw())
    this._ref_sankey.drawing_area.legend.draw()
  }

  public override setSelected(): void {
    // Avoid useless update
    if (this.is_selected === false) {
      // Set attributes
      this.is_selected = true
    }
  }
  public override setUnSelected(): void {
    // Avoid useless update
    if (this.is_selected === true) {
      // Set attributes
      this.is_selected = false
    }
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

  // GETTERS ============================================================================

  public get group() { return this._group }
}

// CLASS PROTO LEVEL TAG ****************************************************************
/**
 * Class that define a Tag object
 * @class Class_Tag
 */
export abstract class Class_ProtoLevelTag extends Class_AbstractLevelTag {

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
  protected _ref_sankey: Class_AbstractSankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ProtoTag.
   * @param {string} name
   * @param {(string | undefined)} [id=undefined]
   * @memberof Class_ProtoTag
   */
  constructor(
    name: string,
    sankey: Class_AbstractSankey,
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
    this._ref_sankey.drawing_area.bypass_redraws = true // Security
    this._copyFrom(tag_to_copy)
    this._ref_sankey.drawing_area.bypass_redraws = false // Security
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
    this._ref_sankey.drawing_area.bypass_redraws = true // Security
    this._fromJSON(json_object, kwargs)
    this._ref_sankey.drawing_area.bypass_redraws = false // Security
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
    sankey: Class_AbstractSankey,
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
  //         parent_level_tag as Class_AbstractLevelTag,
  //         [this] as Class_AbstractLevelTag[],
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
  //         this as Class_AbstractLevelTag,
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
        dim.showAccordingToLevelTags()
      })
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => {
        dim.showAccordingToLevelTags()
      })
  }

  public getOrCreateLowerDimension(
    parent: Type_AbstractNodeElement,
    child: Type_AbstractNodeElement,
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
          this as Class_AbstractLevelTag,
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
}

// CLASS PROTO TAGGROUP *****************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export abstract class Class_ProtoTagGroup extends Class_AbstractTagGroup {

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

  protected _ref_sankey: Class_AbstractSankey

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_TagGroup.
   * @param {string} id
   * @param {string} name
   * @memberof Class_TagGroup
   */
  constructor(id: string, name: string, sankey: Class_AbstractSankey) {
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
    tags_synchro = true
  ) {
    this._ref_sankey.drawing_area.bypass_redraws = true
    this._copyFrom(tagg_to_copy, tags_synchro)
    this._ref_sankey.drawing_area.bypass_redraws = false
  }

  protected _copyFrom(
    tagg_to_copy: Class_ProtoTagGroup,
    tags_synchro = true
  ) {
    // Common attributes
    this._name = tagg_to_copy._name
    this._banner = tagg_to_copy._banner
    this._tag_count = tagg_to_copy._tag_count

    // Synchronize tags
    if (tags_synchro) {

      // Synchro current tags
      this.tags_list
        .forEach(tag => {
          // Delete tags not present in new layout but present in curr
          if (!(tag.id in tagg_to_copy.tags_dict))
            this.removeTag(tag)
          // Transfer tags attr present in new layout and in curr
          else
            tag.copyFrom(tagg_to_copy.tags_dict[tag.id])
        })

      // Add missing tags
      tagg_to_copy.tags_list
        .forEach(tag => {
          if (!(tag.id in this.tags_dict))
            this.addTag(tag.name, tag.id).copyFrom(tag)
        })
    }
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
    this._ref_sankey.drawing_area.bypass_redraws = true
    this._fromJSON(json_object, kwargs)
    this._ref_sankey.drawing_area.bypass_redraws = false
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
  constructor(
    id: string,
    name: string,
    sankey: Class_AbstractSankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Default banner as multi
    this.banner = 'multi'
    // Create a first default tag
    if (with_a_tag) this.addTag('Etiquette 0')
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
  }

  protected _copyFrom(
    tagg_to_copy: Class_TagGroup,
    tags_synchro = true
  ) {
    super._copyFrom(tagg_to_copy, tags_synchro)
    this._show_legend = tagg_to_copy.show_legend
  }

  // PROTECTED METHODS ==================================================================

  protected createTag(
    name: string,
    id: string | undefined = undefined
  ) {
    const tag = new Class_Tag(name, this, this._ref_sankey, id)
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

  protected _tags: { [_: string]: Class_DataTag } = {}

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
    sankey: Class_AbstractSankey,
    with_a_tag: boolean = true
  ) {
    super(id, name, sankey)
    // Create and select a first default tag
    if (with_a_tag) {
      const tag = this.addTag('Etiquette 0')
      tag.setSelected()
    }
  }

  // COPY METHODS =======================================================================

  protected _copyFrom(
    tagg_to_copy: Class_DataTagGroup,
    tags_synchro = true
  ) {
    super._copyFrom(tagg_to_copy, tags_synchro)
    this._show_legend = tagg_to_copy.show_legend
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['show_legend'] = this._show_legend
    json_object['is_sequence']=this._is_sequence
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
    super.selectTagsFromId(id)
    this.first_selected_tags?.update()
    this.checkSelectionCoherence()
    this._ref_sankey.drawing_area.checkAndUpdateAreaSize()
  }

  public selectTagsFromIds(
    ids: string[]
  ) {
    super.selectTagsFromIds(ids)
    this.first_selected_tags?.update()
    this.checkSelectionCoherence()
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
  public get is_sequence(): boolean {return this._is_sequence}

  // SETTER ==============================================================================

  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
  public set is_sequence(value: boolean) {this._is_sequence = value}
}

// CLASS PROTO TAGGROUP *****************************************************************
/**
 * Class that define a TagGroup object
 * @export
 * @class Class_TagGroup
 */
export abstract class Class_ProtoLevelTagGroup extends Class_AbstractLevelTagGroup {

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

  protected _ref_sankey: Class_AbstractSankey

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
  constructor(id: string, name: string, sankey: Class_AbstractSankey) {
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
    tagg_to_copy: Class_ProtoLevelTagGroup,
    tags_synchro = true
  ) {
    this._ref_sankey.drawing_area.bypass_redraws = true
    this._copyFrom(tagg_to_copy, tags_synchro)
    this._ref_sankey.drawing_area.bypass_redraws = false
  }

  protected _copyFrom(
    tagg_to_copy: Class_ProtoLevelTagGroup,
    tags_synchro = true
  ) {
    // Common attributes
    this._name = tagg_to_copy._name
    this._banner = tagg_to_copy._banner
    this._tag_count = tagg_to_copy._tag_count

    // Synchronize tags
    if (tags_synchro) {
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
    this._ref_sankey.drawing_area.bypass_redraws = true
    this._fromJSON(json_object, kwargs)
    this._ref_sankey.drawing_area.bypass_redraws = false
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
  private _antitagged_refs: Type_AbstractNodeElement[] = []

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
    tagg_to_copy: Class_LevelTagGroup,
    tags_synchro = true
  ) {
    super._copyFrom(tagg_to_copy, tags_synchro)
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

  public addAntiTaggedRef(_: Type_AbstractNodeElement) {
    if (!this._antitagged_refs.includes(_)) {
      this._antitagged_refs.push(_)
      _.addAsAntiTagged(this)
    }
  }

  public removeAntiTaggedRef(_: Type_AbstractNodeElement) {
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
    tag.setUnSelected()
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
      this.updateTagsReferences()
    }
  }

  public get siblings(): string[] { return this._siblings }
  public set siblings(value: string[]) {
    this._siblings = value
    this.updateTagsReferences()
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

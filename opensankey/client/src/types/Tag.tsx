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

  public abstract update(): void

  public copyFrom(element: Class_ProtoTag) {
    this._name = element._name
    this._color = element._color
    this._is_selected = element._is_selected
    this._ref_sankey = element._ref_sankey
    // Groups are switched from related group class
  }

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
    const json_object = {} as Type_JSON
    json_object['name'] = this._name
    json_object['selected'] = this._is_selected
    json_object['color'] = this._color
    return json_object
  }

  /**
   *Set Tag value from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_Tag
   */
  public fromJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._is_selected = getBooleanFromJSON(json_object, 'selected', false)
    this._color = getStringFromJSON(json_object, 'color', this._color)
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

  /**
   * Copy attributes from external tag
   *
   * @param {Class_Tag} element
   * @memberof Class_Tag
   */
  public copyFrom(tag: Class_Tag) {
    super.copyFrom(tag)
    // Synchronize references
    let all_possible_reference: { [x: string]: Type_TagReference } = { ... this._ref_sankey.nodes_dict }
    this._ref_sankey.links_list
      .map(link => all_possible_reference = {
        ...all_possible_reference,
        ...Object.fromEntries(Object.entries(link.getAllValues()).map(([id, list]) => [id, list[0]]))
      })
    Object.keys(tag._references) // Add missing refs
      .filter(ref_id => ref_id in all_possible_reference)
      .forEach(ref_id => this.addReference(all_possible_reference[ref_id]))
    Object.keys(this._references) // Remove extra refs
      .filter(ref_id => !tag._references[ref_id])
      .forEach(ref_id => this.removeReference(this._references[ref_id]))
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
    Object.values(this._references)
      .forEach(element => {
        element.drawWithNodes()
      })
    this._ref_sankey.drawing_area.legend.draw()
  }

  /**
   * Copy all attributes from input tags + Set the same refs
   *
   * @param {Class_DataTag} tag
   * @memberof Class_DataTag
   */
  public copyFrom(tag: Class_DataTag) {
    super.copyFrom(tag)
    // No need for reference synchro here
    // -> will be done from new links creation / removal
    // + will be done from new datatags creation / removal
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

  public abstract update(): void

  public copyFrom(element: Class_ProtoLevelTag) {
    this._name = element._name
    this._color = element._color
    this._is_selected = element._is_selected
    // Groups are switched from related group class
  }

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
    const json_object = {} as Type_JSON
    json_object['name'] = this._name
    json_object['selected'] = this._is_selected
    json_object['color'] = this._color
    return json_object
  }

  /**
   *Set Tag value from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_Tag
   */
  public fromJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._is_selected = getBooleanFromJSON(json_object, 'selected', false)
    this._color = getStringFromJSON(json_object, 'color', this._color)
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

  // PROTECTED METHODS ==================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Tag
   */
  protected cleanForDeletion() {
    // Need to delete references
    this.dimensions_list_as_tag_for_children
      .forEach(dim => dim.removeTagFromChildrenLevelTag(this))
    this._dimensions_as_tag_for_children = {}
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => dim.delete())
    this._dimensions_as_tag_for_parent = {}
    // Let the garbage collector do the rest
  }

  /**
   * Copy all attributes from input tags + Set the same refs
   *
   * @param {Class_DataTag} tag
   * @memberof Class_DataTag
   */
  public copyFrom(other_tag: Class_LevelTag) {
    // Copy herited attributes
    super.copyFrom(other_tag)
    // Get all existing references ------------------------------------------------------
    // Create a dict of all existing node in this related sankey
    const all_existing_nodes = this._ref_sankey.nodes_dict
    // Create a dict of all existing dimensions in this related sankey
    const all_existing_dim: { [_: string]: Class_NodeDimension } = {}
    this._ref_sankey.level_taggs_list
      .forEach(tagg => {
        (tagg as Class_LevelTagGroup).tags_list
          .forEach(tag => {
            // Check children dimensions
            tag.dimensions_list_as_tag_for_children
              .filter(dim => !(dim.id in all_existing_dim))
              .forEach(dim => all_existing_dim[dim.id] = dim)
            // Check parent dimensions
            tag.dimensions_list_as_tag_for_parent
              .filter(dim => !(dim.id in all_existing_dim))
              .forEach(dim => all_existing_dim[dim.id] = dim)
          })
      })
    // Synchro dimensions where tag is for children -------------------------------------
    // Add missing but existing dimensions where this is a tag for children
    other_tag.dimensions_list_as_tag_for_children
      .filter(dim => {
        return (
          (dim.id in all_existing_dim) &&
          !(dim.id in this._dimensions_as_tag_for_children)
        )
      })
      .forEach(dim => {
        this.addAsChildrenLevel(all_existing_dim[dim.id])
      })
    // Add missing and non-existing dimensions where this is a tag for children
    other_tag.dimensions_list_as_tag_for_children
      .filter(dim => {
        // Verify if there is at least one child that exist in related sankey
        let at_least_one_match_for_children = false
        dim.children
          .forEach(child => at_least_one_match_for_children = (
            (at_least_one_match_for_children) ||
            (child.id in all_existing_nodes)))
        // And verify that parent also exists in related sankey
        // And that related tag for parent is in the same group
        return (
          !(dim.id in all_existing_dim) &&
          (dim.parent.id in all_existing_nodes) &&
          (at_least_one_match_for_children) &&
          (dim.parent_level_tag.id in this.group.tags_dict)
        )
      })
      .forEach(dim => {
        const parent = all_existing_nodes[dim.parent.id]
        const children = dim.children.map(_ => all_existing_nodes[_.id])
        const parent_level_tag = this.group.tags_dict[dim.parent_level_tag.id]
        const new_dim = new Class_NodeDimension(
          parent,
          children,
          parent_level_tag as Class_AbstractLevelTag,
          [this] as Class_AbstractLevelTag[],
          dim.id
        )
        this.addAsChildrenLevel(new_dim)
      })
    // Remove existing dimension where this tag is no more
    this.dimensions_list_as_tag_for_children
      .filter(dim => {
        return (
          !(dim.id in other_tag._dimensions_as_tag_for_children)
        )
      })
      .forEach(dim => this.removeChildrenLevel(dim))
    // Synchro dimensions where tag is for parents --------------------------------------
    // Add missing but existing dimensions where this is a tag for parent
    other_tag.dimensions_list_as_tag_for_parent
      .filter(dim => {
        return (
          (dim.id in all_existing_dim) &&
          !(dim.id in this._dimensions_as_tag_for_parent)
        )
      })
      .forEach(dim => {
        this.addAsParentLevel(all_existing_dim[dim.id])
      })
    // Add missing and non-existing dimensions where this is a tag for parent
    other_tag.dimensions_list_as_tag_for_parent
      .filter(dim => {
        // Verify if there is at least one child that exist in related sankey
        let ok_for_children_nodes = false
        dim.children
          .forEach(child => ok_for_children_nodes = (
            (ok_for_children_nodes) ||
            (child.id in all_existing_nodes)))
        // And that related tag for parent is in the same group
        let ok_children_level_tags = false
        dim.children_level_tags
          .forEach(tag => ok_children_level_tags = (
            (ok_children_level_tags) ||
            (tag.id in this.group.tags_dict)
          ))
        // And verify that parent also exists in related sankey
        return (
          !(dim.id in all_existing_dim) &&
          (dim.parent.id in all_existing_nodes) &&
          (ok_for_children_nodes) &&
          (ok_children_level_tags)
        )
      })
      .forEach(dim => {
        const parent = all_existing_nodes[dim.parent.id]
        const children = dim.children.map(_ => all_existing_nodes[_.id])
        const children_level_tag = dim.children_level_tags
          .filter(tag => tag.id in this.group.tags_dict)
          .map(tag => this.group.tags_dict[tag.id])
        const new_dim = new Class_NodeDimension(
          parent,
          children,
          this as Class_AbstractLevelTag,
          children_level_tag,
          dim.id
        )
        this.addAsParentLevel(new_dim)
      })
    // Remove existing dimension where this tag is no more
    this.dimensions_list_as_tag_for_parent
      .filter(dim => {
        return (
          !(dim.id in other_tag._dimensions_as_tag_for_parent)
        )
      })
      .forEach(dim => this.removeParentLevel(dim))
  }

  // PUBLIC METHODS =====================================================================

  public setSelected() {
    // Exclude other levels tags from selection and reinit dimension to default dehavior
    this._group.tags_list
      .filter(tag => tag !== this)
      .forEach(tag => tag.setUnSelected())
    this.dimensions_list_as_tag_for_children
      .forEach(dim => dim.showFromLevelTags())
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => dim.showFromLevelTags())
    // Apply selection
    super.setSelected()
  }

  public setUnSelected() {
    // Reinit dimension to default dehavior
    this.dimensions_list_as_tag_for_children
      .forEach(dim => dim.showFromLevelTags())
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => dim.showFromLevelTags())
    // Apply unselection
    super.setUnSelected()
  }

  public update() {
    this.dimensions_list_as_tag_for_children
      .forEach(dim => {
        dim.children
          .forEach(child => child.draw())
      })
    this.dimensions_list_as_tag_for_parent
      .forEach(dim => dim.parent.draw())
  }

  public getOrCreateLowerDimension(
    parent: Type_AbstractNodeElement,
    child: Type_AbstractNodeElement,
    child_tags: Class_LevelTag[]
  ) {
    // First check if tags are from the same group
    let same_group = true
    child_tags
      .forEach(_ => {
        same_group = (same_group && this.group === _.group)})
    if (same_group) {
      // Try to find matching dimension with :
      // - this as parent tag
      // - input child_tag as children tag
      // - parent node as parent
      let dimension_found: Class_NodeDimension | undefined
      this.dimensions_list_as_tag_for_parent
        .forEach(dimension => {
          // Check if children tag list contains the same tags as in dimensions children tag list
          let ok_children_level_tags = true
          dimension.children_level_tags
            .forEach(tag => ok_children_level_tags = ok_children_level_tags && child_tags.includes(tag as Class_LevelTag))
          child_tags
            .forEach(tag => ok_children_level_tags = ok_children_level_tags && dimension.children_level_tags.includes(tag))
          // Match dimension if all these conditions are true
          // - Parent are the same
          // - Parent level tags are the same
          // - All children level tags are the same
          if (
            (dimension.parent_level_tag === this) &&
            (ok_children_level_tags) &&
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
          child_tags
        )
      }
      // Return
      return dimension_found
    }
    return null
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
      _.addTagAsChildrenLevelTag(this)
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
      _.removeTagFromChildrenLevelTag(this)
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
    // Create empty structs
    const json_object = {} as Type_JSON
    const json_object_tags = {} as Type_JSON
    // Fill group attributes
    json_object['name'] = this._name
    json_object['banner'] = this._banner
    // Update tags infos
    this.tags_list
      .forEach(tag => {
        json_object_tags[tag.id] = tag.toJSON()
      })
    json_object['tags'] = json_object_tags
    // Out
    return json_object
  }

  /**
   * Set Tag_group value & substructure from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_tags_id: { [_: string]: string } = {}
  ) {
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    // Read group attributes
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._banner = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
    // Create new tags & read their attributes
    Object.entries(json_object['tags'])
      .forEach(([_, tag_json]) => {
        // Get or Create tag
        const tag_id = matching_tags_id[_] ?? _
        const tag = this._tags[_] ?? this.addTag(tag_id, tag_id) // Tag will be renamed in fromJSON method
        // Update tag with json
        tag.fromJSON(tag_json as Type_JSON)
      })
  }

  public copyFrom(
    element: Class_ProtoTagGroup,
    tags_synchro = true
  ) {
    // Common attributes
    this._name = element._name
    this._banner = element._banner
    this._tag_count = element._tag_count

    // Synchronize tags
    if (tags_synchro) {

      // Delete tags not present in new layout but present in curr
      this.tags_list
        .filter(tag => !(tag.id in element.tags_dict))
        .forEach(tag => {
          this.removeTag(tag)
        })

      // Transfer tags attr present in new layout and in curr
      this.tags_list
        .filter(tag => (tag.id in element.tags_dict))
        .forEach(tag => {
          tag.copyFrom(element.tags_dict[tag.id])
        })

      // Add tag present in element but not this
      element.tags_list
        .filter(tag => !(tag.id in this.tags_dict))
        .forEach(tag => {
          this.addTag(tag.name, tag.id).copyFrom(tag)
        })
    }
  }

  // PROTECTED METHODS ==================================================================

  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_ProtoTag

  // PRIVATE METHODS ====================================================================

  private fromLegacyJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'group_name', this._name)
  }

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

  // PUBLIC METHODS =====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    json_object['show_legend'] = this._show_legend
    return json_object
  }

  /**
   *Set Tag_group value & substructur from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_tags_id: { [_: string]: string } = {}
  ) {
    super.fromJSON(json_object, matching_tags_id)
    this._show_legend = getBooleanFromJSON(json_object, 'show_legend', this._show_legend)
  }

  /**
   * Copy tags group attributes from element to current & copy tags
   *
   * @param {Class_TagGroup} element
   * @memberof Class_TagGroup
   */
  public copyFrom(element: Class_TagGroup) {
    super.copyFrom(element)
    this._show_legend = element.show_legend
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
   * Set Tag_group value & substructure from JSON
   * @param {Type_JSON} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_tags_id: { [_: string]: string } = {}
  ) {
    super.fromJSON(json_object, matching_tags_id)
    this._show_legend = getBooleanFromJSON(json_object, 'show_legend', this._show_legend)
  }

  public copyFrom(element: Class_DataTagGroup) {
    super.copyFrom(element, true)
    this._show_legend = element.show_legend
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

  // SETTER ==============================================================================

  public set show_legend(value: boolean) {
    // Avoid useless updates
    if (this._show_legend !== value) {
      this._show_legend = value
      this.updateTagsReferences()
    }
  }
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

  /**
   * True if tag is currently on a deletion process
   * Avoid infinite calls of delete() method
   * @private
   * @memberof Class_TagGroup
   */
  private _is_currently_deleted = false

  // PROTECTED ATTRIBUTES ===============================================================

  protected abstract _tags: { [id: string]: Class_ProtoLevelTag }

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

  public toJSON() {
    // Create empty structs
    const json_object = {} as Type_JSON
    const json_object_tags = {} as Type_JSON
    // Fill group attributes
    json_object['name'] = this._name
    json_object['banner'] = this._banner
    // Update tags infos
    this.tags_list
      .forEach(tag => {
        json_object_tags[tag.id] = tag.toJSON()
      })
    json_object['tags'] = json_object_tags
    // Out
    return json_object
  }

  /**
   * Set Tag_group value & substructure from JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_TagGroup
   */
  public fromJSON(
    json_object: Type_JSON,
    matching_tags_id: { [id: string]: string } = {}
  ) {
    // Read legacy JSON
    this.fromLegacyJSON(json_object)
    // Read group attributes
    this._name = getStringFromJSON(json_object, 'name', this._name)
    this._banner = getStringFromJSON(json_object, 'banner', this._banner) as tag_banner_type
    // Create new tags & read their attributes
    Object.entries(json_object['tags'])
      .forEach(([_, tag_json]) => {
        // Get or Create tag
        const tag_id = matching_tags_id[_] ?? _
        const tag = this._tags[_] ?? this.addTag(tag_id, tag_id) // Tag will be renamed in fromJSON method
        // Update tag with json
        tag.fromJSON(tag_json as Type_JSON)
      })
  }

  public copyFrom(
    element: Class_ProtoLevelTagGroup,
    tags_synchro = true
  ) {
    // Common attributes
    this._name = element._name
    this._banner = element._banner
    this._tag_count = element._tag_count

    // Synchronize tags
    if (tags_synchro) {

      // Delete tags not present in new layout but present in curr
      this.tags_list
        .filter(tag => !(tag.id in element.tags_dict))
        .forEach(tag => {
          this.removeTag(tag)
        })

      // Transfer tags attr present in new layout and in curr
      this.tags_list
        .filter(tag => (tag.id in element.tags_dict))
        .forEach(tag => {
          tag.copyFrom(element.tags_dict[tag.id])
        })

      // Add tag present in element but not this
      element.tags_list
        .filter(tag => !(tag.id in this.tags_dict))
        .forEach(tag => {
          this.addTag(tag.name, tag.id).copyFrom(tag)
        })
    }
  }

  // PROTECTED METHODS ==================================================================

  protected abstract createTag(
    name: string,
    id: string | undefined
  ): Class_ProtoLevelTag

  // PRIVATE METHODS ====================================================================

  private fromLegacyJSON(json_object: Type_JSON) {
    this._name = getStringFromJSON(json_object, 'group_name', this._name)
  }

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
  private _antitag =  new Class_LevelTag('0',this,this._ref_sankey,'0')

  // PUBLIC METHODS =====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    json_object['activated'] = this._activated
    json_object['siblings'] = this._siblings
    return json_object
  }

  public get antitag() {return this._antitag}

  public sibling_activated() {
    return this._siblings.filter(tagg => {
      return this._ref_sankey.level_taggs_dict[tagg].activated
    }).map(tagg => this._ref_sankey.level_taggs_dict[tagg])
  }
  public fromJSON(
    json_object: Type_JSON,
    matching_tags_id: { [_: string]: string } = {}
  ) {
    super.fromJSON(json_object, matching_tags_id)
    this._activated = getBooleanFromJSON(json_object, 'activated', this._activated)
    this._siblings = getStringListFromJSON(json_object, 'siblings', this._siblings)
  }

  public copyFrom(element: Class_LevelTagGroup) {
    super.copyFrom(element)
    this._activated = element._activated
    this._siblings = element._siblings
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
}

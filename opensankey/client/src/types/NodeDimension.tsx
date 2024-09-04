// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Internal imports
import { makeId } from './Utils';
import {
  Class_AbstractLevelTagGroup,
  Class_AbstractLevelTag,
  Class_AbstractDrawingArea,
  Class_AbstractSankey
} from './Abstract';
import {
  Class_AbstractNodeElement,
  Class_AbstractNodeDimension
} from "./AbstractNode";

// SPECIFIC TYPES ***********************************************************************

type Type_AbstractNodeElement = Class_AbstractNodeElement<Class_AbstractDrawingArea, Class_AbstractSankey>

// CLASS NODE DIMENSION *****************************************************************

export class Class_NodeDimension extends Class_AbstractNodeDimension {

  // PRIVATE ATTRIBUTES =================================================================
  // Unique id
  private _id: string;

  // Structure
  private _parent: Type_AbstractNodeElement;
  private _children: Type_AbstractNodeElement[];

  // Tags relations
  private _parent_level_tag: Class_AbstractLevelTag;
  private _children_level_tags: Class_AbstractLevelTag[];

  // Dimension selected
  private _show_parent: boolean = false;
  private _show_children: boolean = false;

  /**
   * True if element is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_Element
   */
  private _is_currently_deleted = false;

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_NodeDimension.
   * @param {Class_AbstractNodeElement<Type_GenericDrawingArea>} parent
   * @param {Class_AbstractNodeElement[]} children
   * @param {Class_AbstractLevelTag} parent_level_tag
   * @param {Class_AbstractLevelTag} children_level_tag
   * @memberof Class_NodeDimension
   */
  constructor(
    parent: Type_AbstractNodeElement,
    children: Type_AbstractNodeElement[],
    parent_level_tag: Class_AbstractLevelTag,
    children_level_tags: Class_AbstractLevelTag[],
    id?: string
  ) {
    super()
    // Create unique id
    if (id)
      this._id = id;

    else
      this._id = makeId(
        parent_level_tag.id +
        '_' +
        children_level_tags
          .map(_ => _.id)
          .join('')
      );
    // Set parenthood reference
    this._parent = parent;
    this._children = children;
    this._parent.addNewDimensionAsParent(this);
    this._children
      .forEach(_ => _.addNewDimensionAsChild(this));
    // Set leveltags references
    this._parent_level_tag = parent_level_tag;
    this._parent_level_tag.addAsParentLevel(this);
    this._children_level_tags = children_level_tags;
    this._children_level_tags
      .forEach(_ => _.addAsChildrenLevel(this));
    // Sanity checks
    // Immediatly delete for any of this conditions :
    // - Parent is in children list
    // - Children tag are not of the same group
    // - Parent & children tags groups are not the same
    // - Children list is empty
    let same_group: boolean = true;
    let prev_group: undefined | Class_AbstractLevelTagGroup = undefined;
    this._children_level_tags
      .forEach(tag => {
        if (prev_group)
          same_group = (same_group && (tag.group === prev_group));
        prev_group = tag.group;
      });
    if ((children.includes(parent)) ||
      (!same_group) ||
      (parent_level_tag.group !== this.children_level_tagg) ||
      (!this.has_children)) {
      this.delete();
    }
  }

  /**
   * Define deletion behavior
   * @memberof Class_NodeDimension
   */
  public delete() {
    // Cross-calls protection
    if (!this._is_currently_deleted) {
      this._is_currently_deleted = true;
      // Remove cross references with nodes
      this._parent.removeDimensionAsParent(this);
      this._children
        .forEach(_ => _.removeDimensionAsChild(this));
      this._children = [];
      // Remove cross references with leveltags
      this._parent_level_tag.removeParentLevel(this);
      this._children_level_tags
        .forEach(_ => _.removeChildrenLevel(this));
      this._children_level_tags = [];
      // Garbage collector will do the rest ...
    }
  }

  // PUBLIC METHODS =====================================================================
  public synchroWith(dim: Class_NodeDimension) {
    // Get list of all nodes
    const nodes_dict = this.parent.main_sankey.nodes_dict;
    const level_taggs_dict = this.parent.main_sankey.level_taggs_dict;
    // Sync references with parent nodes
    if (dim.parent.id in nodes_dict) {
      this.parent = nodes_dict[dim.parent.id];
    }
    else { // parent node does not exits -> delete this
      this.delete();
    }
    // Sync reference with parent tag
    if ((dim.parent_level_tag.group.id in level_taggs_dict) &&
      (dim.parent_level_tag.id in level_taggs_dict[dim.parent_level_tag.group.id].tags_dict)) {
      this.parent_level_tag = level_taggs_dict[dim.parent_level_tag.group.id].tags_dict[dim.parent_level_tag.id];
    }
    else { // parent level tag does not exits -> delete this
      this.delete();
    }
    // Sync references with children
    dim._children // Append all missing children
      .filter(child => child.id in nodes_dict)
      .forEach(child => this.addNodeAsChild(nodes_dict[child.id]));
    this._children // Remove all unnecessary children
      .filter(child => !(dim._children.map(_ => _.id).includes(child.id)))
      .forEach(child => this.removeNodeFromChildren(child));
    // Sync reference with children tags
    dim._children_level_tags // Append all missing children tags
      .filter(tag => {
        (tag.group.id in level_taggs_dict) &&
          (tag.id in level_taggs_dict[tag.group.id].tags_dict);
      })
      .forEach(tag => this.addTagAsChildrenLevelTag(level_taggs_dict[tag.group.id].tags_dict[tag.id]));
    this._children_level_tags
      .filter(tag => !(dim._children_level_tags.map(_ => _.id).includes(tag.id)))
      .forEach(tag => this.removeTagFromChildrenLevelTag(tag));
  }

  public removeNodeAsParent(_: Type_AbstractNodeElement) {
    if (this._parent === _) {
      this.delete(); // Simply delete because dimension can not exist without parent
    }
  }

  public addNodeAsChild(_: Type_AbstractNodeElement) {
    if ((this._parent !== _) &&
      !(this._children.includes(_))) {
      this._children.push(_);
      _.addNewDimensionAsChild(this);
    }
  }

  public removeNodeFromChildren(_: Type_AbstractNodeElement) {
    const idx = this._children.indexOf(_);
    if (idx !== undefined) {
      this._children.splice(idx, 1);
      // If all children has been deleted, clear this
      if (!this.has_children)
        this.delete();
    }
  }

  public getLevel() {
    if (!this._parent_level_tag.has_upper_dimensions) {
      return 1;
    }
    else {
      let level = 2;
      this._parent_level_tag.dimensions_list_as_tag_for_children
        .forEach(upper_dimension => level = Math.max(level, upper_dimension.getLevel() + 1));
      return level;
    }
  }

  public addTagAsChildrenLevelTag(_: Class_AbstractLevelTag) {
    if (!this._children_level_tags.includes(_) &&
      _.group === this.children_level_tagg) {
      this._children_level_tags.push(_);
      _.addAsChildrenLevel(this);
    }
  }

  public removeTagFromChildrenLevelTag(_: Class_AbstractLevelTag) {
    const idx = this._children_level_tags.indexOf(_);
    if (idx !== undefined) {
      this._children_level_tags.splice(idx, 1);
      // If all children level tags has been deleted, clear this
      if (!(this._children_level_tags.length > 0))
        this.delete();
    }
  }

  public forceShowParent() {
    this._show_parent = true;
    this._show_children = false;
    this.drawElements();
  }

  public forceShowChildren() {
    this._show_parent = false;
    this._show_children = true;
    this.drawElements();
  }

  public showFromLevelTags() {
    this._show_parent = false;
    this._show_children = false;
    this.drawElements();
  }

  // PRIVATE METHODS ====================================================================
  private drawElements() {
    this._parent.draw();
    this._children.forEach(child => child.draw());
  }

  // GETTERS / SETTERS ==================================================================
  public get id() { return this._id; }

  public get parent_level_tag() { return this._parent_level_tag; }
  public set parent_level_tag(_: Class_AbstractLevelTag) {
    // Do modification only if there is a change & if parent/children tag group are matching
    if ((_ !== this._parent_level_tag) &&
      (this.children_level_tagg === _.group)) {
      const old = this._parent_level_tag;
      this._parent_level_tag = _;
      _.addAsParentLevel(this);
      old.removeParentLevel(this);
    }
  }

  public get children_level_tags() { return this._children_level_tags; }
  public get children_level_tagg() { return this._children_level_tags[0]?.group ?? undefined; }

  public get parent() { return this._parent; }
  public set parent(_: Type_AbstractNodeElement) {
    if ((this._parent !== _) &&
      !(this._children.includes(_))) {
      const old_parent = this._parent;
      this._parent = _;
      _.addNewDimensionAsParent(this);
      old_parent.removeDimensionAsParent(this);
    }
  }

  public get has_children() { return (this._children.length > 0); }
  public get children() { return this._children; }

  public get show_parent() {
    return (
      (!this._show_children) &&
      ((this._show_parent) || (this.parent_level_tag.is_selected))
    );
  }
  public get show_children() {
    let ok_children_level_tags = false;
    this.children_level_tags
      .forEach(tag => ok_children_level_tags = (ok_children_level_tags || tag.is_selected));
    return (
      (!this._show_parent) &&
      ((this._show_children) || (ok_children_level_tags))
    );
  }
}

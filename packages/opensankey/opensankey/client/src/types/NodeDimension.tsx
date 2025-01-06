// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Internal imports
import {
  Class_AbstractLevelTag,
  Class_AbstractDrawingArea,
  Class_AbstractSankey
} from './Abstract'
import {
  Class_AbstractNodeElement,
  Class_AbstractNodeDimension
} from './AbstractNode'

// SPECIFIC TYPES ***********************************************************************

type Type_AbstractNodeElement = Class_AbstractNodeElement<Class_AbstractDrawingArea, Class_AbstractSankey>

// CLASS NODE DIMENSION *****************************************************************

export class Class_NodeDimension extends Class_AbstractNodeDimension {

  // PRIVATE ATTRIBUTES =================================================================
  // Unique id
  private _id: string

  // Structure
  private _parent: Type_AbstractNodeElement
  private _children: Type_AbstractNodeElement[]

  // Tags relations
  private _parent_level_tag: Class_AbstractLevelTag
  private _child_level_tag: Class_AbstractLevelTag

  // Forcing
  private _force_show_children: boolean = false
  private _force_show_parent: boolean = false

  /**
   * True if element is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_Element
   */
  private _is_currently_deleted = false
  private _is_currently_in_unsetting_recursion = false

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
    child_level_tag: Class_AbstractLevelTag,
    id?: string
  ) {
    super()
    // Create unique id
    if (id)
      this._id = id

    else
      this._id = (
        parent_level_tag.group.id +
        '_' +
        parent.id +
        '_' +
        parent_level_tag.id +
        '_' +
        child_level_tag.id
      )
    // Set parenthood reference
    this._parent = parent
    this._children = children
    this._parent.addNewDimensionAsParent(this)
    this._children
      .forEach(_ => _.addNewDimensionAsChild(this))
    // Set leveltags references
    this._parent_level_tag = parent_level_tag
    this._parent_level_tag.addAsParentLevel(this)
    this._child_level_tag = child_level_tag
    this._child_level_tag.addAsChildrenLevel(this)
    // Sanity checks
    // Immediatly delete for any of this conditions :
    // - Parent is in children list
    // - Children tag are not of the same group
    // - Parent & children tags groups are not the same
    // - Children list is empty

    if (
      (parent_level_tag.group !== this.child_level_tag.group) ||
      (!this.has_children)) {
      this.delete()
    }
  }

  /**
   * Define deletion behavior
   * @memberof Class_NodeDimension
   */
  public delete() {
    // Cross-calls protection
    if (!this._is_currently_deleted) {
      this._is_currently_deleted = true
      // Remove cross references with nodes
      this._parent.removeDimensionAsParent(this)
      this._children
        .forEach(_ => _.removeDimensionAsChild(this))
      this._children
        .forEach(_ => this.removeNodeFromChildren(_))
      this._children = []
      // Remove cross references with leveltags
      this._parent_level_tag.removeParentLevel(this)
      this._child_level_tag.removeChildrenLevel(this)
      //this._child_level_tag = ''
      // Garbage collector will do the rest ...
    }
  }

  // PUBLIC METHODS =====================================================================

  public synchroWith(dim: Class_NodeDimension) {
    // Get list of all nodes
    const nodes_dict = this.parent.sankey.nodes_dict
    const level_taggs_dict = this.parent.sankey.level_taggs_dict
    // Sync references with parent nodes
    if (dim.parent.id in nodes_dict) {
      this.parent = nodes_dict[dim.parent.id]
    }
    else { // parent node does not exits -> delete this
      this.delete()
    }
    // Sync reference with parent tag
    if ((dim.parent_level_tag.group.id in level_taggs_dict) &&
      (dim.parent_level_tag.id in level_taggs_dict[dim.parent_level_tag.group.id].tags_dict)) {
      this.parent_level_tag = level_taggs_dict[dim.parent_level_tag.group.id].tags_dict[dim.parent_level_tag.id]
    }
    else { // parent level tag does not exits -> delete this
      this.delete()
    }
    // Sync references with children
    dim._children // Append all missing children
      .filter(child => child.id in nodes_dict)
      .forEach(child => this.addNodeAsChild(nodes_dict[child.id]))
    this._children // Remove all unnecessary children
      .filter(child => !(dim._children.map(_ => _.id).includes(child.id)))
      .forEach(child => this.removeNodeFromChildren(child))

  }

  public removeNodeAsParent(_: Type_AbstractNodeElement) {
    if (this._parent === _) {
      this.delete() // Simply delete because dimension can not exist without parent
    }
  }

  public addNodeAsChild(_: Type_AbstractNodeElement) {
    if (!(this._children.includes(_))) {
      this._children.push(_)
      _.addNewDimensionAsChild(this)
    }
  }

  public removeNodeFromChildren(_: Type_AbstractNodeElement) {
    const idx = this._children.indexOf(_)
    if (idx !== undefined) {
      this._children.splice(idx, 1)
      // If all children has been deleted, clear this
      if (!this.has_children)
        this.delete()
    }
  }

  public getLevel() {
    if (!this._parent_level_tag.has_upper_dimensions) {
      return 1
    }
    else {
      let level = 2
      this._parent_level_tag.dimensions_list_as_tag_for_children
        .forEach(upper_dimension => level = Math.max(level, upper_dimension.getLevel() + 1))
      return level
    }
  }

  public showAccordingToLevelTags() {
    // Unset booleans
    const nodes_to_redraw = this._unsetForcingToShow()
    // Redraw
    nodes_to_redraw
      .forEach(node => node.draw())
  }

  /**
   * Force to set this dimension's parent as visible
   * @memberof Class_NodeDimension
   */
  public setForceToShowParent() {
    // Speed-up computation
    if (this._force_show_parent && !this._force_show_children)
      return
    // Protection against infinite recursion
    if (this._is_currently_in_unsetting_recursion)
      return
    // Otherwise - continue
    // Set protection
    this._is_currently_in_unsetting_recursion = true
    // Set booleans accordingly
    this._force_show_children = false
    this._force_show_parent = true
    this._updated()
    // Unset all other children node's dimensions
    const nodes_to_redraw = new Set([
      this._parent,
      ...this._children
    ])
    // this._children
    //   .forEach(child => {
    //     child.dimensions_as_child
    //       .forEach(dim => {
    //         if (dim !== this) {
    //           nodes_to_redraw = nodes_to_redraw.union((dim as Class_NodeDimension)._unsetForcingToShow())
    //         }
    //       })
    //   })
    // Redraw
    nodes_to_redraw
      .forEach(node => node.draw())
    // Unset protection
    this._is_currently_in_unsetting_recursion = false
  }

  /**
   * Force to set this dimension's children as visibles
   * @memberof Class_NodeDimension
   */
  public setForceToShowChildren(fromJSON:boolean=false) {
    // Speed-up computation
    if (this._force_show_children && !this._force_show_parent)
      return
    // Protection against infinite recursion
    if (this._is_currently_in_unsetting_recursion)
      return
    // Otherwise - continue
    // Set protection
    this._is_currently_in_unsetting_recursion = true
    // Set booleans accordingly
    this._force_show_children = true
    this._force_show_parent = false
    this._updated()
    // Unset other dimensions
    let nodes_to_redraw = new Set([
      this._parent,
      ...this._children
    ])
    // Unset forcing to show children on all other parent node's dimensions where he is parent
    this.parent.dimensions_as_parent
      .forEach(dim => {
        if (dim !== this) {
          nodes_to_redraw = nodes_to_redraw.union((dim as Class_NodeDimension)._unsetForcingToShow())
        }
      })
    // Redraw
    if (!fromJSON) { //when called in dimensionsFromJSON, we don't reorganise link order as it's informed by node json
      nodes_to_redraw
        .forEach(node => {
          node.reorganizeIOLinks()
          node.output_links_list.forEach(l => l.target.reorganizeIOLinks())
          node.input_links_list.forEach(l => l.source.reorganizeIOLinks())
        })
    }
    // Unset protection
    this._is_currently_in_unsetting_recursion = false
  }

  // PROTECTED METHODS ==================================================================

  protected _updated() {
    this._parent.dimensionsUpdated()
    this._children.forEach(child => child.dimensionsUpdated())
  }

  protected _unsetForcingToShow() {
    // Protection against infinite recursion
    if (this._is_currently_in_unsetting_recursion)
      return new Set([])
    // Otherwise - continue
    // Set protection
    this._is_currently_in_unsetting_recursion = true
    // Set booleans accordingly
    this._force_show_children = false
    this._force_show_parent = false
    this._updated()
    // Unsetting boolean are propagated through childrens
    let nodes_to_redraw = new Set([
      this._parent,
      ...this._children
    ])
    if (this.children[0].id !== this.parent.id) {
      this._children
        .forEach(child => {
          child.dimensions_as_child
            .forEach(dim => {
              if (dim !== this && dim.parent_level_tag.group.activated) {
                nodes_to_redraw = nodes_to_redraw.union((dim as Class_NodeDimension)._unsetForcingToShow())
              }
            })
        })
    }
    // Unset protection
    this._is_currently_in_unsetting_recursion = false
    // Return set of all nodes that need to be redrawn
    return nodes_to_redraw
  }

  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  /**
   * Level tag group reference is from parent level tag
   * @readonly
   * @memberof Class_NodeDimension
   */
  public get related_level_tagg() { return this.parent_level_tag.group }

  public get parent_level_tag() { return this._parent_level_tag }
  public set parent_level_tag(_: Class_AbstractLevelTag) {
    // Do modification only if there is a change & if parent/children tag group are matching
    if ((_ !== this._parent_level_tag) &&
      (this.child_level_tagg === _.group)) {
      const old = this._parent_level_tag
      this._parent_level_tag = _
      _.addAsParentLevel(this)
      old.removeParentLevel(this)
    }
  }

  public get child_level_tag() { return this._child_level_tag }
  public set child_level_tag(_: Class_AbstractLevelTag) {
    // Do modification only if there is a change & if parent/children tag group are matching
    if ((_ !== this._child_level_tag) &&
      (this.child_level_tagg === _.group)) {
      const old = this._child_level_tag
      this._child_level_tag = _
      _.addAsChildrenLevel(this)
      old.removeParentLevel(this)
    }
  }
  public get child_level_tagg() { return this._child_level_tag?.group ?? undefined }

  public get parent() { return this._parent }
  public set parent(_: Type_AbstractNodeElement) {
    if ((this._parent !== _) &&
      !(this._children.includes(_))) {
      const old_parent = this._parent
      this._parent = _
      _.addNewDimensionAsParent(this)
      old_parent.removeDimensionAsParent(this)
    }
  }

  public get has_children() { return (this._children.length > 0) }
  public get children() { return this._children }

  public get show_parent() {
    // Forcing to show children
    if (this._force_show_children)
      return false
    // Forcing to show parents
    if (this._force_show_parent)
      return true
    // Otherwise show if parent tags is selected
    return this.parent_level_tag.is_selected
  }

  public get force_show_parent() { return this._force_show_parent }

  public get show_children() {
    // Forcing to show children
    if (this._force_show_children)
      return true
    // Forcing to show parents
    if (this._force_show_parent)
      return false
    // Otherwise, check if related children level tags are all selected
    return this.child_level_tag.is_selected
  }

  public get force_show_children() { return this._force_show_children }
}

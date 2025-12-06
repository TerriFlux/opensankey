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

// Internal imports

import { Class_NodeElement } from './Node'

export class Class_NodeDimension {

  // PRIVATE ATTRIBUTES =================================================================
  // Unique id
  private _id: string

  // Structure
  private _parent: Class_NodeElement
  private _children: Class_NodeElement[]

  // Forcing
  private _force_show_children: boolean = false
  private _force_show_parent: boolean = false

  /**
   * True if element is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof ClassTemplate_Element
   */
  private _is_currently_deleted = false
  private _is_currently_in_unsetting_recursion = false

  // CONSTRUCTOR ========================================================================
  /**
   * Creates an instance of Class_NodeDimension.
   * @param {ClassAbstract_NodeElement<Class_DrawingArea>} parent
   * @param {ClassAbstract_NodeElement[]} children
   * @param {Class_LevelTag} parent_level_tag
   * @param {Class_LevelTag} children_level_tag
   * @memberof Class_NodeDimension
   */
  constructor(
    parent: Class_NodeElement,
    children: Class_NodeElement[],
    dimension_id: string
  ) {
    this._id = (
      // parent.id +
      // '_' +
      dimension_id
    )
    // Set parenthood reference
    this._parent = parent
    this._children = children
    this._parent.addNewDimensionAsParent(this)
    this._children
      .forEach(_ => _.addNewDimensionAsChild(this))
    this.parent.sankey.addNodeDimension(this)
    if (
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
      this.parent.sankey.removeNodeDimension(this)
    }
  }

  // PUBLIC METHODS =====================================================================

  public synchroWith(dim: Class_NodeDimension) {
    // Get list of all nodes
    const nodes_dict = this.parent.sankey.nodes_dict
    // Sync references with parent nodes
    if (dim.parent.id in nodes_dict) {
      this.parent = nodes_dict[dim.parent.id]
    }
    else { // parent node does not exits -> delete this
      this.delete()
    }
    dim._children // Append all missing children
      .filter(child => child.id in nodes_dict)
      .forEach(child => this.addNodeAsChild(nodes_dict[child.id]))
    this._children // Remove all unnecessary children
      .filter(child => !(dim._children.map(_ => _.id).includes(child.id)))
      .forEach(child => this.removeNodeFromChildren(child))

  }

  public removeNodeAsParent(_: Class_NodeElement) {
    if (this._parent === _) {
      this.delete() // Simply delete because dimension can not exist without parent
    }
  }

  public addNodeAsChild(_: Class_NodeElement) {
    if (!(this._children.includes(_))) {
      this._children.push(_)
      _.addNewDimensionAsChild(this)
    }
  }

  public removeNodeFromChildren(_: Class_NodeElement) {
    const idx = this._children.indexOf(_)
    if (idx !== undefined) {
      this._children.splice(idx, 1)
      // If all children has been deleted, clear this
      if (!this.has_children)
        this.delete()
    }
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
  public setForceToShowChildren(fromJSON: boolean = false) {
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
    const nodes_to_redraw = new Set([
      this._parent,
      ...this._children
    ])
    // Unset forcing to show children on all other parent node's dimensions where he is parent
    // this.parent.dimensions_as_parent
    //   .forEach(dim => {
    //     if (dim !== this) {
    //       nodes_to_redraw = nodes_to_redraw.union((dim as Class_NodeDimension)._unsetForcingToShow())
    //     }
    //   })
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

  public unsetForcingToShow() {

    this._force_show_children = false
    this._force_show_parent = false
    this._updated()
  }




  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  public get name() {
    return this.parent.name + '->(' + this.children.map(c=>c.name+' ')+')'    
  }

  public get short_name() {
    return '->(' + this.children.map(c=>c.name+' ')+')'.substring(0,30)
  }

  public get children_name() {
    return this.children.map(c=>c.name+' ').join().substring(0,30)
  }


  public get parent() { return this._parent }
  public set parent(_: Class_NodeElement) {
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


  public get force_show_parent() { return this._force_show_parent }


  public get force_show_children() { return this._force_show_children }
}

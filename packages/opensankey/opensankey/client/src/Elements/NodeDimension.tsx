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

import { Class_Tag } from '../types/Tag'
import { Class_LevelTagGroup } from '../types/TagGroup'
import { getBooleanFromJSON, getJSONOrUndefinedFromJSON, getStringOrUndefinedFromJSON, Type_JSON } from '../types/Utils'
import { Class_NodeElement } from './Node'
import { NodeContainerStyle } from './ElementStyle'
import { NodePositioning } from '../Algorithms/NodePositioning'

/**
 * Container display mode for a dimension.
 * When non-null, both parent and children are visible simultaneously; the
 * parent is rendered as an envelope around the children, and links are
 * filtered per side (see Link.is_visible).
 *
 * - 'in_children_out_parent': incoming links land on children, outgoing links leave from parent
 * - 'in_parent_out_children': incoming links land on parent, outgoing links leave from children
 */
export type Type_ContainerMode = null | 'in_children_out_parent' | 'in_parent_out_children'

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
  private _container_mode: Type_ContainerMode = null

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
    if (idx !== -1) {
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
    if (this._force_show_parent && !this._force_show_children && !this._container_mode)
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
    this._container_mode = null
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
    if (this._force_show_children && !this._force_show_parent && !this._container_mode)
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
    this._container_mode = null
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

  /**
   * Activate container display mode: parent and children are shown at the
   * same time, the parent surrounds the children, and links are filtered
   * per side according to the mode variant.
   */
  public setContainerMode(
    mode: Exclude<Type_ContainerMode, null>,
    fromJSON: boolean = false
  ) {
    if (this._container_mode === mode) return
    if (this._is_currently_in_unsetting_recursion) return
    this._is_currently_in_unsetting_recursion = true
    const entering = !this._container_mode
    this._force_show_children = false
    this._force_show_parent = false
    this._container_mode = mode
    // Snapshot the parent's geometry before the envelope overrides it, so
    // that unsetContainerMode can restore it exactly. First-call-wins, so
    // a second container-mode dimension on the same parent does not
    // clobber the original values.
    this._parent.saveGeometryForContainerMode()
    // Apply the container style to the parent node so it renders as an
    // enclosing dashed rectangle with its label in the top-left corner.
    const container_style = this._parent.sankey.styles_dict[NodeContainerStyle]
    if (container_style && !this._parent.style.includes(container_style)) {
      this._parent.addStyle(container_style)
    }
    // Bump visibility fingerprints and reset the cached
    // _are_related_dimensions_selected on parent and children BEFORE the
    // initial stack, so that child.getShapeHeightToUse() — which sums
    // link thicknesses — sees the freshly visible links instead of
    // their stale "source/target invisible" cache.
    this._updated()
    // Initial vertical stack of children, anchored at the parent's current
    // position. Only runs on the user-triggered null → mode transition,
    // NOT on load from JSON (where children positions must be preserved)
    // and not on a variant switch.
    if (entering && !fromJSON) {
      const anchor_x = this._parent.position_x
      this._children.forEach(child => { child.position_x = anchor_x })
      NodePositioning.stackNodesVertically(
        this._children as Class_NodeElement[],
        this._parent.position_y
      )
    }
    // When loading from JSON we skip the per-dimension reorganize+draw;
    // the caller triggers a single full draw at the end of load, which
    // handles nested container dimensions correctly regardless of the
    // order in which they are processed.
    if (!fromJSON) {
      const nodes_to_redraw = new Set([
        this._parent,
        ...this._children
      ])
      nodes_to_redraw.forEach(node => {
        node.reorganizeIOLinks()
        node.output_links_list.forEach(l => l.target.reorganizeIOLinks())
        node.input_links_list.forEach(l => l.source.reorganizeIOLinks())
      })
      nodes_to_redraw.forEach(node => node.draw())
      // After the first synchronous draw pass the children's SVG (shape
      // AND labels) is in the DOM, so getBBox returns the real extents.
      // A setTimeout(0) lets the browser flush that layout before we
      // recompute the parent envelope a second time — this is what
      // allows the container to grow to include label overhang.
      // In a nested hierarchy (container inside container) we then
      // walk up the chain: the just-grown parent pushes its siblings
      // down in the ancestor's restack, the ancestor's envelope
      // re-fits, and so on until the outermost container.
      const parent = this._parent
      setTimeout(() => {
        if (parent.applyContainerEnvelopeIfNeeded()) {
          parent.applyPosition()
          parent.drawShape()
        }
        parent.restackAncestorContainers()
      }, 0)
    }
    this._is_currently_in_unsetting_recursion = false
  }

  /**
   * Set the container_mode flag in place, without any side effect:
   * no style application, no geometry snapshot, no redraw, no link
   * reorganization. Used by view-switch sync (UpdateFrom), where the
   * visual style is already transferred via replaceStyles and the
   * caller will trigger a full draw afterwards.
   */
  public setContainerModeQuiet(mode: Type_ContainerMode) {
    this._container_mode = mode
    if (mode) {
      this._force_show_children = false
      this._force_show_parent = false
    }
  }

  /**
   * Exit container display mode and reset to a neutral state (no forcing).
   */
  public unsetContainerMode() {
    if (!this._container_mode) return
    this._container_mode = null
    // Remove the container style and restore the pre-container geometry,
    // but only if no other dimension still wants this node to be an
    // enclosing container.
    const still_container = this._parent.dimensions_as_parent
      .some(dim => dim !== this && dim.container_mode)
    if (!still_container) {
      this._parent.removeStyleById(NodeContainerStyle)
      this._parent.restoreGeometryAfterContainerMode()
    }
    this._updated()
    const nodes_to_redraw = new Set([
      this._parent,
      ...this._children
    ])
    nodes_to_redraw.forEach(node => {
      node.reorganizeIOLinks()
    })
    nodes_to_redraw.forEach(node => node.draw())
  }

  // PROTECTED METHODS ==================================================================

  protected _updated() {
    this._parent.dimensionsUpdated()
    this._children.forEach(child => child.dimensionsUpdated())
  }

  public unsetForcingToShow() {

    this._force_show_children = false
    this._force_show_parent = false
    this._container_mode = null
    this._updated()
  }




  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  public get name() {
    return this.parent.name + '->(' + this.children.map(c => c.name + ' ') + ')'
  }

  public get short_name() {
    return '->(' + this.children.map(c => c.name + ' ') + ')'.substring(0, 30)
  }

  public get children_name() {
    return this.children.map(c => c.name + ' ').join().substring(0, 30)
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

  public get container_mode(): Type_ContainerMode { return this._container_mode }

  public normalize() {
    const group = this.parent.sankey.level_taggs_dict[this.id]
    if (!group) {
      return
    }
    const last_tag = group.tags_list.at(-1)
    this.children.forEach(c => {
      const dim_as_parent = c.dimensions_as_parent.filter(dim => dim.id == this.id)[0]
      if (dim_as_parent) {
        dim_as_parent.normalize()
        return
      }
      const last_child_tag = c.tags_list.filter(tag => tag.group.id == this.id).at(-1)
      if (!last_child_tag) {
        return
      }
      if (last_child_tag == last_tag) {
        return
      }
      const idx = group.tags_list.indexOf(last_child_tag!)
      for (let i = idx; i < group.tags_list.length; i++) {
        c.addTag(group.tags_list[i])
      }
    })
  }
}


/**
 * Class that handles all dimension management operations for NodeElement
 */
export class NodeDimensionsManager {

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  // CLEANUP METHODS ====================================================================

  public cleanForDeletion() {
    const dimensionsData = this._node.internalDimensionsData

    // Remove dims

    dimensionsData.dimensions_as_parent = {}
    dimensionsData.dimensions_as_child = {}
  }

  // COPY METHODS =======================================================================

  public copyDimensionsFrom(node_to_copy: Class_NodeElement) {
    // Create a dict of all existing dimensions in this related sankey
    //const all_existing_dim: { [_: string]: Class_NodeDimension } = {}
    // this.level_taggs_list.filter(tagg=>!tagg.is_view_tagg)
    //   .forEach(tagg => {
    //     (tagg as Class_LevelTagGroup).tags_list
    //       .forEach(tag => {
    //         // Check children dimensions
    //         tag.dimensions_list_as_tag_for_children
    //           .forEach(dim => {
    //             if (!(dim.id in all_existing_dim))
    //               all_existing_dim[dim.id] = dim
    //           })
    //         // Check parent dimensions
    //         tag.dimensions_list_as_tag_for_parent
    //           .forEach(dim => {
    //             if (!(dim.id in all_existing_dim))
    //               all_existing_dim[dim.id] = dim
    //           })
    //       })
    //   })

    // Add existing and missing child dimensions
    Object.values(node_to_copy.dimensions_as_child)
      .forEach(dim_to_copy => {
        // if (
        //   (dim_to_copy.id in all_existing_dim)
        // ) {
        this.addNewDimensionAsChild(dim_to_copy)
      }
      )
    //   else {
    //     // Get possible parent
    //     const parent = this._node.sankey.nodes_dict[dim_to_copy.parent.id]
    //     if (parent !== undefined) {
    //       // Get possible level tagg
    //       const level_tagg = this._node.sankey.level_taggs_dict[dim_to_copy.child_level_tagg.id]
    //       if (level_tagg !== undefined) {
    //         // Get possible parent tagg
    //         const parent_tag = level_tagg.tags_dict[dim_to_copy.parent_level_tag.id]
    //         if (parent_tag !== undefined) {
    //           // Get possible children taggs
    //           const tag_to_copy = level_tagg.tags_dict[dim_to_copy.child_level_tag.id]
    //           if (tag_to_copy) {
    //             // Create new dim if everything is ok
    //             const new_dim = new Class_NodeDimension(parent, [this._node], parent_tag, tag_to_copy, dim_to_copy.id)
    //             if (dim_to_copy.force_show_children) {
    //               new_dim.setForceToShowChildren(true)
    //             }
    //             if (dim_to_copy.force_show_parent) {
    //               new_dim.setForceToShowParent()
    //             }
    //             all_existing_dim[dim_to_copy.id] = new_dim
    //           }
    //         }
    //       }
    //     }
    //   }
    // })

    // Add existing and missing parent dimensions
    // Object.values(node_to_copy.dimensions_as_parent)
    //   .forEach(dim_to_copy => {
    //     if (!(dim_to_copy.id in all_existing_dim)) {
    //       // Get relative leveltag
    //       const level_tagg = this._node.sankey.level_taggs_dict[dim_to_copy.parent_level_tag.group.id]
    //       if (level_tagg !== undefined) {
    //         const parent_tag = level_tagg.tags_dict[dim_to_copy.parent_level_tag.id]
    //         if (parent_tag !== undefined) {
    //           // Get possible childrens
    //           const children: Class_NodeElement[] = []
    //           dim_to_copy.children
    //             .forEach(child_to_copy => {
    //               const child = this._node.sankey.nodes_dict[child_to_copy.id]
    //               if (child !== undefined)
    //                 children.push(child as Class_NodeElement)
    //             })
    //           // Get possible children tags
    //           const tag = level_tagg.tags_dict[dim_to_copy.child_level_tag.id]

    //           // Create new dim if everything is ok
    //           if ((children.length > 0) && tag != undefined) {
    //             const new_dim = new Class_NodeDimension(this._node, children, parent_tag, tag, dim_to_copy.id)
    //             if (dim_to_copy.force_show_children) {
    //               new_dim.setForceToShowChildren(true)
    //             }
    //             if (dim_to_copy.force_show_parent) {
    //               new_dim.setForceToShowParent()
    //             }
    //             all_existing_dim[dim_to_copy.id] = new_dim
    //           }
    //         }
    //       }
    //     }
    //   })

    // Check antitags
    node_to_copy.taggs_list
      .forEach((level_tagg_to_copy) => {
        const level_tagg = this._node.sankey.level_taggs_dict[level_tagg_to_copy.id]
        if (level_tagg) {
          if ((level_tagg_to_copy as unknown as Class_LevelTagGroup).antitagged_refs.indexOf(node_to_copy) >= 0) {
            (level_tagg as Class_LevelTagGroup).addAntiTaggedRef(this._node)
          }
        }
      })
  }

  // JSON METHODS =======================================================================

  public toJSON(json_object: Type_JSON) {
    const dimensionsData = this._node.internalDimensionsData

    let dimensions: { [_: string]: Type_JSON } = {}

    // On parse les tags groupes et on écrit la dimension pour ce tag groupe.
    // Pour une dimension dans le json peut correspondre plusieurs class_NodeDimension correspondant aux noeuds multi niveaux
    const all_child_taggs = [...new Set(Object.values(dimensionsData.dimensions_as_child).map(dim => dim.id))]
    all_child_taggs.forEach(tagg_id => {
      Object.values(dimensionsData.dimensions_as_child).filter(dim => dim.id == tagg_id)
        .forEach(dimension => {
          if (!(dimension.id in dimensions)) {
            dimensions[dimension.id] = {
              'parent_name': dimension.parent.id,
            }
            if (dimension.force_show_children) dimensions[dimension.id].force_show_children = true
            if (dimension.force_show_parent) dimensions[dimension.id].force_show_parent = true
            if (dimension.container_mode) dimensions[dimension.id].container_mode = dimension.container_mode
          } else {
            const cur_children_tags = dimensions[dimension.id].children_tags as string[]
            dimensions[dimension.id].children_tags = [...cur_children_tags, dimension.id]
          }
        })
    })

    // we write parent dimensions for which the node is a root.
    const parent_dimensions = Object.fromEntries(
      Object.values(dimensionsData.dimensions_as_parent).filter(dim => !all_child_taggs.includes(dim.id))
        .map(dimension => [
          dimension.id,
          {}
        ])
    )
    dimensions = { ...dimensions, ...parent_dimensions }



    // Dimension
    if (Object.keys(dimensions).length > 0) json_object['dimensions'] = dimensions
  }

  public fromJSON(
    json_node_object: Type_JSON,
    create_tag: boolean,
    matching_nodes_id: { [_: string]: string } = {},
    _matching_taggs_id: { [_: string]: string } = {},
    __matching_tags_id: { [_: string]: { [_: string]: string } } = {},

  ) {
    // Extract dimensions JSON struct from node JSON Struct
    const dimensions_as_JSON = getJSONOrUndefinedFromJSON(json_node_object, 'dimensions')
    if (dimensions_as_JSON && Object.keys(dimensions_as_JSON).length > 1) {
      delete dimensions_as_JSON['Primaire']
    }

    // For each dimension in dimensions JSON Struct, create the parent / child relation
    if (dimensions_as_JSON) {
      Object.keys(dimensions_as_JSON)
        .forEach(_ => {
          //const tagg_id = matching_taggs_id[_] ?? _
          const dimension_as_json = getJSONOrUndefinedFromJSON(dimensions_as_JSON, _)
          if (dimension_as_json) {
            // Get level tag group from id
            // const tagg = this._node.sankey.level_taggs_dict[tagg_id] as Class_LevelTagGroup
            // // Continue only in level tag group exists
            // if (tagg) {
            // Get parents and leveltags ids
            let parent_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_name')
            // const children_tags_ids = getStringListOrUndefinedFromJSON(dimension_as_json, 'children_tags')
            //const parent_tag_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_tag')
            const anti_tag = getBooleanFromJSON(dimension_as_json, 'antitag', false)

            // Case 1 : We found parent and level ids -> get or create related tags
            if (
              (parent_id !== undefined) &&
              // (children_tags_ids !== undefined) &&
              // (parent_tag_id !== undefined) &&
              (!anti_tag)
            ) {
              // Get parent
              parent_id = matching_nodes_id[parent_id] ?? parent_id
              const parent = this._node.sankey.nodes_dict[parent_id] ?? this._node.sankey.addNewNode(parent_id, parent_id)

              // Get child & parent tags
              if (parent) {

                // let children_tags: Class_LevelTag[] | undefined
                // let parent_tag: Class_LevelTag | undefined

                // Use tags id in priority if existing
                // const children_tags_ids = getStringListOrUndefinedFromJSON(dimension_as_json, 'children')
                // //const parent_tag_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_tag')
                // if (children_tags_ids && parent_tag_id) {
                //   children_tags = children_tags_ids
                //     .map(_ => {
                //       const child_tag_id = matching_tags_id[tagg_id] ? matching_tags_id[tagg_id][_] ?? _ : _
                //       if (tagg.tags_dict[child_tag_id] === undefined)
                //         tagg.addTag(child_tag_id, child_tag_id)
                //       return tagg.tags_dict[child_tag_id]
                //     })
                //   parent_tag = tagg.tags_dict[(matching_tags_id[tagg_id] ? matching_tags_id[tagg_id][parent_tag_id] ?? parent_tag_id : parent_tag_id)]

                //   // If tags has been found,
                //   // create a new dimension OR add parent & child relation to an existing dimension
                //   if (children_tags && parent_tag) {
                //     let cur_parent_tag = parent_tag
                const cur_parent = parent
                // children_tags_ids.forEach(child_tag => {
                const childDim = this.getOrCreateLowerDimension(cur_parent, this._node, _)
                if (dimension_as_json.container_mode === 'in_children_out_parent' ||
                  dimension_as_json.container_mode === 'in_parent_out_children') {
                  childDim?.setContainerMode(dimension_as_json.container_mode as Exclude<Type_ContainerMode, null>, true)
                } else if (dimension_as_json.force_show_children) {
                  const nodeDimParent = parent.nodeDimensionAsParent(this._node)!
                  nodeDimParent.setForceToShowChildren(true)
                } else if (dimension_as_json.force_show_parent) {
                  childDim?.setForceToShowParent()
                }
                if (this._node.sankey.level_taggs_dict[_]) {
                  let level = 0
                  let ancestor = parent
                  while (ancestor) {
                    level++
                    if (ancestor.dimensions_as_child.length == 0) {
                      break
                    }
                    if (!ancestor.dimensions_as_child.some(dim => dim.id == _ && dim.parent)) {
                      break
                    }
                    ancestor = ancestor.dimensions_as_child.filter(dim => dim.id == _)[0].parent

                  }
                  if (create_tag) {
                    this._node.addTag(this._node.sankey.level_taggs_dict[_].tags_list.filter(tag=>tag.name != '0')[level] as unknown as Class_Tag)
                    if (level == 1) {
                      parent.addTag(this._node.sankey.level_taggs_dict[_].tags_list.filter(tag=>tag.name != '0')[0] as unknown as Class_Tag)
                    }
                  }
                }
              }
              //

            }

            //}
            //}
            // Case 2 : We only found anti-tag
            else if (
              //   (parent_id === undefined) &&
              //   (children_tags_ids === undefined) &&
              //   (parent_tag_id === undefined) &&
              (anti_tag)
            ) {
              if (!this._node.sankey.level_taggs_dict[_]) {
                console.log('tutu')
              } else {
                this._node._nodeTagsManager.addAsAntiTagged(this._node.sankey.level_taggs_dict[_])
              }
            }
          }
          //}
        })
    }
  }

  // DIMENSION MANAGEMENT METHODS =======================================================
  public getOrCreateLowerDimension(
    parent: Class_NodeElement,
    child: Class_NodeElement,
    dimension_id: string
  ) {
    if (!parent) {
      return undefined
    }
    let dimension_found: Class_NodeDimension | undefined
    this._node.sankey.dimensions_list.forEach(dimension => {
      // Match dimension if all these conditions are true
      // - Parent are the same
      // - Parent level tags are the same
      // - child level tag is the same
      if (
        //(dimension.parent_level_tag === this) &&
        (dimension.id == dimension_id &&
          (dimension.parent === parent)
        )) {
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
        dimension_id
      )
    }
    return dimension_found
  }

  public addNewDimensionAsParent(_: Class_NodeDimension) {
    const dimensionsData = this._node.internalDimensionsData
    if (!dimensionsData.dimensions_as_parent[_.id]) {
      dimensionsData.dimensions_as_parent[_.id] = _
      _.parent = this._node
    }
  }

  public addNewDimensionAsChild(_: Class_NodeDimension) {
    const dimensionsData = this._node.internalDimensionsData
    if (!dimensionsData.dimensions_as_child[_.id]) {
      dimensionsData.dimensions_as_child[_.id] = _
      _.addNodeAsChild(this._node)
    }
  }



  public removeDimensionAsParent(_: Class_NodeDimension) {
    const dimensionsData = this._node.internalDimensionsData
    if (dimensionsData.dimensions_as_parent[_.id]) {
      delete dimensionsData.dimensions_as_parent[_.id]
      if (!this._node.master_node) {
        _.removeNodeAsParent(this._node)
      }
      // //if (this._node.master_node == undefined) {
      // _.removeNodeAsParent(this._node)
      // //}
    }
  }

  public removeDimensionAsChild(_: Class_NodeDimension) {
    const dimensionsData = this._node.internalDimensionsData
    if (dimensionsData.dimensions_as_child[_.id]) {
      delete dimensionsData.dimensions_as_child[_.id]
      if (!this._node.master_node) {
        _.removeNodeFromChildren(this._node)
      }
      // //if (this._node.master_node == undefined) {
      // _.removeNodeFromChildren(this._node)
      // //}
    }
  }

  public nodeDimensionAsParent(child: Class_NodeElement) {
    const dimensionsData = this._node.internalDimensionsData
    const _ = Object.values(dimensionsData.dimensions_as_parent)
      .filter(dimension => dimension.children.includes(child))
    return _.length > 0 ? _[0] : null
  }

  public nodeDimensionAsChild(parent: Class_NodeElement) {
    const dimensionsData = this._node.internalDimensionsData
    const _ = Object.values(dimensionsData.dimensions_as_child)
      .filter(dimension => dimension.parent == parent)
    return _.length > 0 ? _[0] : null
  }

  // VISIBILITY METHODS =================================================================

  /**
   * Check if, based on level tags or dimension, we must show or hide this node
   */
  public checkIfRelatedDimensionsAreSelected(): boolean {
    const dimensionsData = this._node.internalDimensionsData
    const tagData = this._node.internalTagsData
    // Draw by default if there is no dimensions
    // that relates to this node
    if (
      !this.is_child &&
      !this.is_parent &&
      (tagData.leveltaggs_as_antitagged.length === 0)
    ) {
      return true
    }

    // First check if activated tag group is in antitaggs
    const is_antitagged = (tagData.leveltaggs_as_antitagged
      .filter(tagg => tagg.activated)
      .length > 0)
    if (is_antitagged) {
      return false
    }

    // Container mode on any related dimension makes this node visible
    // (both parent and children are displayed simultaneously).
    const in_container_mode_as_child = Object.values(dimensionsData.dimensions_as_child)
      .some(dim => dim.container_mode)
    const in_container_mode_as_parent = this.dimensions_as_parent
      .some(dim => dim.container_mode)
    if (in_container_mode_as_child || in_container_mode_as_parent) {
      return true
    }

    let has_forced_dimensions: boolean = false
    let ok_forced_dimensions = true
    Object.values(dimensionsData.dimensions_as_child).forEach(dim => {
      if (dim.force_show_parent || dim.force_show_children) {
        has_forced_dimensions = true
        ok_forced_dimensions = ok_forced_dimensions && dim.force_show_children
      }
    })

    // Check dimensions where node is tagged as a parent
    this.dimensions_as_parent
      .forEach(dim => {
        if (dim.force_show_parent || dim.force_show_children) {
          has_forced_dimensions = true
          ok_forced_dimensions = ok_forced_dimensions && dim.force_show_parent
        }
      })

    // First check if dimension is not forced
    if (has_forced_dimensions) {
      return ok_forced_dimensions
    }
    const available_view_tags = this._node.tags_list.filter(level_tag => {
      const level_tagg = this._node.sankey.level_taggs_dict[level_tag.group.id]
      return level_tagg
    })
    if (available_view_tags.length == 0) return true
    const activated_tags = available_view_tags.filter(tag => (tag.group as Class_LevelTagGroup).activated)
    if (activated_tags.length == 0) return true
    let display = true
    Object.entries(this._node.grouped_taggs_dict).filter(([key, _]) =>
      this._node.sankey.level_taggs_dict[key] && this._node.sankey.level_taggs_dict[key].activated
    ).forEach(([_, tag_list]) => {
      display = (tag_list.filter(tag => tag.is_selected).length > 0) ? display : false
    })
    //let view_tag_display = activated_tags.every(view_tag => view_tag.is_selected)
    return display


  }



  // SPECIAL IMPORT/EXPORT METHODS =====================================================

  public setTradeDimensions(importation: boolean) {
    const root_name = this._node.id.split('-')[1];
    (importation ? this._node.output_links_list : this._node.input_links_list).forEach((input_or_output_link) => {
      const extremity_node = importation ? input_or_output_link.target : input_or_output_link.source
      Object.values(extremity_node.dimensions_as_child)
        .forEach(dim => {
          const extremity_node_parent = dim.parent
          this.getOrCreateLowerDimension(
            this._node.sankey.nodes_dict[extremity_node_parent.id + '-' + root_name],
            this._node,
            dim.id
          )
        })
      Object.values(extremity_node.dimensions_as_parent)
        .forEach(dim => {
          const extremity_node_children = dim.children.filter(n =>
            this._node.sankey.nodes_dict[n.id + '-' + root_name] != undefined
          ).map(n =>
            this._node.sankey.nodes_dict[n.id + '-' + root_name]
          )
          new Class_NodeDimension(
            this._node,
            extremity_node_children,
            dim.id
          )
        })
    })
  }


  /**
   * Check if node is child in any dimension
   */
  public get is_child() {
    return (Object.values(this._node.internalDimensionsData.dimensions_as_child).length > 0)
  }

  /**
   * Check if node is parent in any dimension
   */
  public get is_parent() {
    return (Object.values(this._node.internalDimensionsData.dimensions_as_parent).length > 0)
  }

  /**
   * Return true if node is in multiple nodeDimension as a parent
   */
  public get is_multi_parent() {
    return (Object.values(this._node.internalDimensionsData.dimensions_as_parent).length > 1)
  }

  /**
   * Return list of dimensions where this node is the parent
   */
  public get dimensions_as_parent() {
    return Object.values(this._node.internalDimensionsData.dimensions_as_parent)
  }

  /**
   * Return true if node is in multiple nodeDimension as a child
   */
  public get is_multi_children() {
    return (Object.values(this._node.internalDimensionsData.dimensions_as_child).length > 1)
  }

  /**
   * Return list of dimensions where this node is a child
   */
  public get dimensions_as_child() {
    return Object.values(this._node.internalDimensionsData.dimensions_as_child)
  }
}
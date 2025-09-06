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

// Local modules
import { Class_NodeElement } from './Node'
import { 
  Class_LevelTag} from '../types/Tag'
import { Class_LevelTagGroup } from '../types/TagGroup'
import { Class_NodeDimension } from './NodeDimension'
import { 
  Type_JSON, 
  getBooleanFromJSON, 
  getJSONOrUndefinedFromJSON, 
  getStringListOrUndefinedFromJSON, 
  getStringOrUndefinedFromJSON 
} from '../types/Utils'

/**
 * Class that handles all dimension management operations for NodeElement
 */
export class NodeDimensionsManager{

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  // CLEANUP METHODS ====================================================================

  public cleanForDeletion() {
    const dimensionsData = this._node.internalDimensionsData
    
    // Remove dims
    dimensionsData.leveltaggs_as_antitagged.forEach(tag => tag.removeAntiTaggedRef(this._node))
    dimensionsData.leveltaggs_as_antitagged = []
    dimensionsData.dimensions_as_parent = {}
    dimensionsData.dimensions_as_child = {}
  }

  // COPY METHODS =======================================================================

  public copyDimensionsFrom(node_to_copy: Class_NodeElement) {
    // Create a dict of all existing dimensions in this related sankey
    const all_existing_dim: { [_: string]: Class_NodeDimension } = {}
    this.level_taggs_list
      .forEach(tagg => {
        (tagg as Class_LevelTagGroup).tags_list
          .forEach(tag => {
            // Check children dimensions
            tag.dimensions_list_as_tag_for_children
              .forEach(dim => {
                if (!(dim.id in all_existing_dim))
                  all_existing_dim[dim.id] = dim
              })
            // Check parent dimensions
            tag.dimensions_list_as_tag_for_parent
              .forEach(dim => {
                if (!(dim.id in all_existing_dim))
                  all_existing_dim[dim.id] = dim
              })
          })
      })

    // Add existing and missing child dimensions
    Object.values(node_to_copy.dimensions_as_child)
      .forEach(dim_to_copy => {
        if (
          (dim_to_copy.id in all_existing_dim)
        ) {
          this.addNewDimensionAsChild(all_existing_dim[dim_to_copy.id])
        }
        else {
          // Get possible parent
          const parent = this._node.sankey.nodes_dict[dim_to_copy.parent.id]
          if (parent !== undefined) {
            // Get possible level tagg
            const level_tagg = this._node.sankey.level_taggs_dict[dim_to_copy.child_level_tagg.id]
            if (level_tagg !== undefined) {
              // Get possible parent tagg
              const parent_tag = level_tagg.tags_dict[dim_to_copy.parent_level_tag.id]
              if (parent_tag !== undefined) {
                // Get possible children taggs
                const tag_to_copy = level_tagg.tags_dict[dim_to_copy.child_level_tag.id]
                if (tag_to_copy) {
                  // Create new dim if everything is ok
                  const new_dim = new Class_NodeDimension(parent, [this._node], parent_tag, tag_to_copy, dim_to_copy.id)
                  if (dim_to_copy.force_show_children) {
                    new_dim.setForceToShowChildren(true)
                  }
                  if (dim_to_copy.force_show_parent) {
                    new_dim.setForceToShowParent()
                  }
                  all_existing_dim[dim_to_copy.id] = new_dim
                }
              }
            }
          }
        }
      })

    // Add existing and missing parent dimensions
    Object.values(node_to_copy.dimensions_as_parent)
      .forEach(dim_to_copy => {
        if (!(dim_to_copy.id in all_existing_dim)) {
          // Get relative leveltag
          const level_tagg = this._node.sankey.level_taggs_dict[dim_to_copy.parent_level_tag.group.id]
          if (level_tagg !== undefined) {
            const parent_tag = level_tagg.tags_dict[dim_to_copy.parent_level_tag.id]
            if (parent_tag !== undefined) {
              // Get possible childrens
              const children: Class_NodeElement[] = []
              dim_to_copy.children
                .forEach(child_to_copy => {
                  const child = this._node.sankey.nodes_dict[child_to_copy.id]
                  if (child !== undefined)
                    children.push(child as Class_NodeElement)
                })
              // Get possible children tags
              const tag = level_tagg.tags_dict[dim_to_copy.child_level_tag.id]

              // Create new dim if everything is ok
              if ((children.length > 0) && tag != undefined) {
                const new_dim = new Class_NodeDimension(this._node, children, parent_tag, tag, dim_to_copy.id)
                if (dim_to_copy.force_show_children) {
                  new_dim.setForceToShowChildren(true)
                }
                if (dim_to_copy.force_show_parent) {
                  new_dim.setForceToShowParent()
                }
                all_existing_dim[dim_to_copy.id] = new_dim
              }
            }
          }
        }
      })
    
    // Check antitags
    node_to_copy.level_taggs_list
      .forEach((level_tagg_to_copy) => {
        const level_tagg = this._node.sankey.level_taggs_dict[level_tagg_to_copy.id]
        if (level_tagg) {
          if ((level_tagg_to_copy as Class_LevelTagGroup).antitagged_refs.indexOf(node_to_copy) >= 0) {
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
    const all_child_taggs = [...new Set(Object.values(dimensionsData.dimensions_as_child).map(dim => dim.related_level_tagg.id))]
    all_child_taggs.forEach(tagg_id => {
      Object.values(dimensionsData.dimensions_as_child).filter(dim => dim.related_level_tagg.id == tagg_id)
        .forEach(dimension => {
          if (!(dimension.related_level_tagg.id in dimensions)) {
            dimensions[dimension.related_level_tagg.id] = {
              'parent_name': dimension.parent.id,
              'parent_tag': dimension.parent_level_tag.id,
              'children_tags': [dimension.child_level_tag.id],
            }
            if (dimension.force_show_children) dimensions[dimension.related_level_tagg.id].force_show_children = true
            if (dimension.force_show_parent) dimensions[dimension.related_level_tagg.id].force_show_parent = true
          } else {
            const cur_children_tags = dimensions[dimension.related_level_tagg.id].children_tags as string[]
            dimensions[dimension.related_level_tagg.id].children_tags = [...cur_children_tags, dimension.child_level_tag.id]
          }
        })
    })
    
    // we write parent dimensions for which the node is a root.
    const parent_dimensions = Object.fromEntries(
      Object.values(dimensionsData.dimensions_as_parent).filter(dim => !all_child_taggs.includes(dim.parent_level_tag.group.id))
        .map(dimension => [
          dimension.parent_level_tag.group.id,
          {}
        ])
    )
    dimensions = { ...dimensions, ...parent_dimensions }
    
    // Dimensions - antitag
    dimensionsData.leveltaggs_as_antitagged
      .forEach(leveltagg => {
        if (!dimensions[leveltagg.id]) {
          dimensions[leveltagg.id] = {}
        }
        dimensions[leveltagg.id]['antitag'] = true
      })
    
    // Dimension
    if (Object.keys(dimensions).length > 0) json_object['dimensions'] = dimensions
  }

  public fromJSON(
    json_node_object: Type_JSON,
    matching_nodes_id: { [_: string]: string } = {},
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
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
          const tagg_id = matching_taggs_id[_] ?? _
          const dimension_as_json = getJSONOrUndefinedFromJSON(dimensions_as_JSON, _)
          if (dimension_as_json) {
            // Get level tag group from id
            const tagg = this._node.sankey.level_taggs_dict[tagg_id] as Class_LevelTagGroup
            // Continue only in level tag group exists
            if (tagg) {
              // Get parents and leveltags ids
              let parent_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_name')
              const children_tags_ids = getStringListOrUndefinedFromJSON(dimension_as_json, 'children_tags')
              const parent_tag_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_tag')
              const anti_tag = getBooleanFromJSON(dimension_as_json, 'antitag', false)
              
              // Case 1 : We found parent and level ids -> get or create related tags
              if (
                (parent_id !== undefined) &&
                (children_tags_ids !== undefined) &&
                (parent_tag_id !== undefined) &&
                (!anti_tag)
              ) {
                // Get parent
                parent_id = matching_nodes_id[parent_id] ?? parent_id
                const parent = this._node.sankey.nodes_dict[parent_id] ?? this._node.sankey.addNewNode(parent_id, parent_id)
                
                // Get child & parent tags
                if (parent) {
                  let children_tags: Class_LevelTag[] | undefined
                  let parent_tag: Class_LevelTag | undefined
                  
                  // Use tags id in priority if existing
                  const children_tags_ids = getStringListOrUndefinedFromJSON(dimension_as_json, 'children_tags')
                  const parent_tag_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_tag')
                  if (children_tags_ids && parent_tag_id) {
                    children_tags = children_tags_ids
                      .map(_ => {
                        const child_tag_id = matching_tags_id[tagg_id] ? matching_tags_id[tagg_id][_] ?? _ : _
                        if (tagg.tags_dict[child_tag_id] === undefined)
                          tagg.addTag(child_tag_id, child_tag_id)
                        return tagg.tags_dict[child_tag_id]
                      })
                    parent_tag = tagg.tags_dict[(matching_tags_id[tagg_id] ? matching_tags_id[tagg_id][parent_tag_id] ?? parent_tag_id : parent_tag_id)]
                    
                    // If tags has been found,
                    // create a new dimension OR add parent & child relation to an existing dimension
                    if (children_tags && parent_tag) {
                      let cur_parent_tag = parent_tag
                      let cur_parent = parent
                      children_tags.forEach(child_tag => {
                        const childDim = cur_parent_tag.getOrCreateLowerDimension(cur_parent, this._node, child_tag)
                        if (dimension_as_json.force_show_children) {
                          const nodeDimParent = parent.nodeDimensionAsParent(cur_parent_tag.group)!
                          nodeDimParent.setForceToShowChildren(true)
                        } else if (dimension_as_json.force_show_parent) {
                          childDim?.setForceToShowParent()
                        }
                        cur_parent_tag = child_tag
                        cur_parent = this._node
                      })
                    }
                  }
                }
              }
              // Case 2 : We only found anti-tag
              else if (
                (parent_id === undefined) &&
                (children_tags_ids === undefined) &&
                (parent_tag_id === undefined) &&
                (anti_tag)
              ) {
                this.addAsAntiTagged(tagg)
              }
            }
          }
        })
    }
  }

  // DIMENSION MANAGEMENT METHODS =======================================================

  /**
   * Check if given level tag is referenced by node
   */
  public hasGivenLevelTag(tag: Class_LevelTag) {
    return (this.level_tags_list.includes(tag))
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

  public addAsAntiTagged(_: Class_LevelTagGroup) {
    const dimensionsData = this._node.internalDimensionsData
    if (!dimensionsData.leveltaggs_as_antitagged.includes(_)) {
      dimensionsData.leveltaggs_as_antitagged.push(_)
      _.addAntiTaggedRef(this._node)
    }
  }

  public removeDimensionAsParent(_: Class_NodeDimension) {
    const dimensionsData = this._node.internalDimensionsData
    if (dimensionsData.dimensions_as_parent[_.id]) {
      delete dimensionsData.dimensions_as_parent[_.id]
      if (!this._node.master_node) {
        _.removeNodeAsParent(this._node)
      }
    }
  }

  public removeDimensionAsChild(_: Class_NodeDimension) {
    const dimensionsData = this._node.internalDimensionsData
    if (dimensionsData.dimensions_as_child[_.id]) {
      delete dimensionsData.dimensions_as_child[_.id]
      if (!this._node.master_node) {
        _.removeNodeFromChildren(this._node)
      }
    }
  }

  public removeAsAntiTagged(_: Class_LevelTagGroup) {
    const dimensionsData = this._node.internalDimensionsData
    if (dimensionsData.leveltaggs_as_antitagged.includes(_)) {
      const idx = dimensionsData.leveltaggs_as_antitagged.indexOf(_)
      dimensionsData.leveltaggs_as_antitagged.splice(idx, 1)
      _.removeAntiTaggedRef(this._node)
    }
  }

  public nodeDimensionAsParent(tagGroup: Class_LevelTagGroup) {
    const dimensionsData = this._node.internalDimensionsData
    const _ = Object.values(dimensionsData.dimensions_as_parent)
      .filter(dimension => dimension.parent_level_tag.group.id == tagGroup.id)
    return _.length > 0 ? _[0] : null
  }

  public nodeDimensionAsChild(tagGroup: Class_LevelTagGroup) {
    const dimensionsData = this._node.internalDimensionsData
    const _ = Object.values(dimensionsData.dimensions_as_child)
      .filter(dimension => dimension.parent_level_tag.group.id == tagGroup.id)
    return _.length > 0 ? _[0] : null
  }

  // VISIBILITY METHODS =================================================================

  /**
   * Check if, based on level tags or dimension, we must show or hide this node
   */
  public checkIfRelatedDimensionsAreSelected(): boolean {
    const dimensionsData = this._node.internalDimensionsData
    
    // Draw by default if there is no dimensions
    // that relates to this node
    if (
      !this.is_child &&
      !this.is_parent &&
      (dimensionsData.leveltaggs_as_antitagged.length === 0)
    ) {
      return true
    }
    
    // First check if activated tag group is in antitaggs
    const is_antitagged = (dimensionsData.leveltaggs_as_antitagged
      .filter(tagg => tagg.activated)
      .length > 0)
    
    // If there is any dimension - check them
    let has_activated_dimensions: boolean = false
    let ok_activated_dimensions: boolean = true
    let has_forced_dimensions: boolean = false
    let ok_forced_dimensions: boolean = true
    
    // Check dimensions where node is tagged as a child
    const group_to_children_dim: { [_: string]: Class_NodeDimension[] } = {}
    const all_child_taggs = [...new Set(Object.values(dimensionsData.dimensions_as_child)
      .filter(dim => dim.related_level_tagg.activated || dim.force_show_children)
      .map(dim => {
        if (group_to_children_dim[dim.related_level_tagg.id] == undefined) {
          group_to_children_dim[dim.related_level_tagg.id] = [dim]
        } else {
          group_to_children_dim[dim.related_level_tagg.id].push(dim)
        }
        return dim.related_level_tagg.id
      }))]
    
    all_child_taggs.forEach(child_tagg => {
      let child_tag_activated_dimensions = false
      let child_ok_forced_dimensions = true
      group_to_children_dim[child_tagg]
        .forEach(dim => {
          if (dim.force_show_parent || dim.force_show_children) {
            has_forced_dimensions = true
            child_ok_forced_dimensions = child_ok_forced_dimensions && dim.force_show_children
          }
          if (dim.related_level_tagg.activated) {
            child_tag_activated_dimensions = child_tag_activated_dimensions || dim.child_level_tag.is_selected
            has_activated_dimensions = true
          }
        })
      ok_activated_dimensions = ok_activated_dimensions && child_tag_activated_dimensions
      ok_forced_dimensions = ok_forced_dimensions && child_ok_forced_dimensions
    })
    
    // Check dimensions where node is tagged as a parent
    this.dimensions_as_parent_pure
      .forEach(dim => {
        if (dim.force_show_parent || dim.force_show_children) {
          has_forced_dimensions = true
          ok_forced_dimensions = ok_forced_dimensions && dim.force_show_parent
        }
        if (dim.related_level_tagg.activated) {
          ok_activated_dimensions = ok_activated_dimensions && dim.show_parent
          has_activated_dimensions = true
        }
      })

    // First check if dimension is not forced
    if (has_forced_dimensions) {
      return ok_forced_dimensions
    }
    // Otherwise use default leveltag filtering logic
    else {
      // Cannot show if node's dimensions are not forced and node is antitagged
      // on currently activated leveltaggroup
      if (is_antitagged) {
        return false
      }
      else {
        // If no related level tag group is activated &&
        // this node is not set as antittagged for activated level tagg group
        // Then it ok to show
        if (!has_activated_dimensions) {
          return true
        } else {
          return ok_activated_dimensions
        }
      }
    }
  }

  // SPECIAL IMPORT/EXPORT METHODS =====================================================

  public setTradeDimensions(importation: boolean) {
    const root_name = this._node.id.split('-')[1];
    (importation ? this._node.output_links_list : this._node.input_links_list).forEach((input_or_output_link) => {
      const extremity_node = importation ? input_or_output_link.target : input_or_output_link.source
      Object.values(extremity_node.dimensions_as_child)
        .forEach(dim => {
          const extremity_node_parent = dim.parent;
          (dim.parent_level_tag as Class_LevelTag).getOrCreateLowerDimension(
            this._node.sankey.nodes_dict[extremity_node_parent.id + '-' + root_name],
            this._node,
            dim.child_level_tag as Class_LevelTag
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
            dim.parent_level_tag,
            dim.child_level_tag
          )
        })
    })
  }

  // GETTERS ============================================================================

  /**
   * List of level tags related to node
   */
  public get level_tags_list() {
    const dimensionsData = this._node.internalDimensionsData
    const level_tags_list: Class_LevelTag[] = []
    
    Object.values(dimensionsData.dimensions_as_parent)
      .forEach(dimension => {
        level_tags_list.push(dimension.parent_level_tag as Class_LevelTag)
      })
    Object.values(dimensionsData.dimensions_as_child)
      .forEach(dimension => {
        level_tags_list.push(dimension.child_level_tag as Class_LevelTag)
      })
    
    return [...new Set(level_tags_list)]
  }

  /**
   * Dict of level taggs related to node
   */
  public get level_taggs_dict() {
    const level_taggs_dict: { [id: string]: Class_LevelTagGroup } = {}
    this.level_tags_list
      .forEach(tag => { level_taggs_dict[tag.group.id] = tag.group })
    return level_taggs_dict
  }

  /**
   * List of level taggs related to node
   */
  public get level_taggs_list() {
    return Object.values(this.level_taggs_dict)
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
   * Return list of dimensions where this node is the parent (pure - no self-references)
   */
  public get dimensions_as_parent_pure() {
    return Object.values(this._node.internalDimensionsData.dimensions_as_parent).filter(dim => !dim.children.includes(dim.parent))
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

  /**
   * Return list of dimensions where this node is a child (pure - no self-references)
   */
  public get dimensions_as_child_pure() {
    return Object.values(this._node.internalDimensionsData.dimensions_as_child).filter(dim => !dim.children.includes(dim.parent))
  }
}
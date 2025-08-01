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
import { Class_Tag } from '../types/Tag'
import { Type_JSON } from '../types/Utils'

/**
 * Class that handles all tag management operations for NodeElement
 */
export class NodeTagsManager {

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  // CLEANUP METHODS ====================================================================

  public cleanForDeletion() {
    const tagsData = this._node.internalTagsData
    
    // Remove reference of self in related tags
    tagsData.tags.forEach(tag => tag.removeReference(this._node))
    tagsData.tags = []
    tagsData.taggs_dict = {}
  }

  // COPY METHODS =======================================================================

  public copyTagsFrom(node_to_copy: Class_NodeElement) {
    this.addTagsReferencingFrom(node_to_copy)
  }

  public copyTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string },
    matching_tags: { [_: string]: { [_: string]: string } }
  ) {
    // Copy tags ------------------------------------------------------------------------
    // Clear all tags
    this._node.tags_list
      .forEach(tag => this.removeTag(tag))
    // Add missing tags
    this.addTagsReferencingFrom(node_to_copy, matching_tagg, matching_tags)
  }

  private addTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string } = {},
    matching_tags: { [_: string]: { [_: string]: string } } = {}
  ) {
    const revert_matching_taggs_id: { [id: string]: string } = {}
    Object.entries(matching_tagg).forEach(([k, v]) => revert_matching_taggs_id[v] = k)

    // Add missing tags
    node_to_copy.tags_list
      .forEach(tag_to_copy => {
        const revert_matching_tags_id: { [id: string]: string } = {}
        Object.entries(matching_tags[revert_matching_taggs_id[tag_to_copy.group.id] ?? tag_to_copy.group.id] ?? []).forEach(([k, v]) => revert_matching_tags_id[v] = k)

        const tagg = this._node.sankey.node_taggs_dict[revert_matching_taggs_id[tag_to_copy.group.id] ?? tag_to_copy.group.id]
        if (tagg !== undefined) {
          const tag = tagg.tags_dict[revert_matching_tags_id[tag_to_copy.id] ?? tag_to_copy.id]
          if (tag !== undefined)
            this.addTag(tag as Class_Tag)
        }
      })
  }

  // JSON METHODS =======================================================================

  public toJSON(json_object: Type_JSON) {
    // Tags
    if (this._node.taggs_list.length > 0) {
      json_object['tags'] = Object.fromEntries(
        this._node.taggs_list
          .map(tagg => [
            tagg.id,
            this._node.tags_list
              .filter(tag => (tag.group === tagg))
              .map(tag => tag.id)
          ])
      )
    }
  }

  public fromJSON(
    json_node_object: Type_JSON,
    matching_taggs_id: { [_: string]: string },
    matching_tags_id: { [_: string]: { [_: string]: string } }
  ) {
    // Node Tags
    //   In JSON here are how supposed tags var is :
    //   tags:{key_grp_tag:string[] (key_tag_selected) }
    //   where 'key_grp_tag' represent the id of a node_taggs group
    //   &  'key_tag_selected' represent the array of id of tag selected for that node_taggs group
    Object.entries(json_node_object['tags'] ?? {})
      .forEach(([tagg_id, tag_ids]) => {
        const tagg = this._node.sankey.node_taggs_dict[matching_taggs_id[tagg_id] ?? tagg_id]
        if (tagg !== undefined) {
          (tag_ids as string[])
            .forEach(tag_id => {
              const tag = tagg.tags_dict[matching_tags_id[tagg_id][tag_id] ?? tag_id]
              if (tag !== undefined)
                this.addTag(tag as Class_Tag)
            })
        }
      })
  }

  // TAG MANAGEMENT METHODS =============================================================

  /**
   * Check if given tag is referenced by node
   */
  public hasGivenTag(tag: Class_Tag) {
    return this._node.internalTagsData.tags.includes(tag)
  }

  /**
   * Add and cross-reference a Tag with node
   */
  public addTag(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    if (!tagsData.tags.includes(tag)) {
      tagsData.tags.push(tag)
      this.addTagToGroupTagDict(tag)
      tag.addReference(this._node)
    }
  }

  /**
   * Remove tag and its cross-reference from node
   */
  public removeTag(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    if (tagsData.tags.includes(tag)) {
      const idx = tagsData.tags.indexOf(tag)
      tagsData.tags.splice(idx, 1)
      this.removeTagFromGroupTagDict(tag)
      tag.removeReference(this._node)
    }
  }

  // PRIVATE HELPER METHODS =============================================================

  /**
   * Add tag to dict of tag sorted by group
   */
  private addTagToGroupTagDict(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    const grp_id = tag.group.id
    
    if (grp_id in tagsData.taggs_dict) {
      if (!(tagsData.taggs_dict[grp_id].includes(tag)))
        tagsData.taggs_dict[grp_id].push(tag)
    }
    else {
      tagsData.taggs_dict[grp_id] = [tag]
    }
  }

  /**
   * Remove tag from dict of tag sorted by group
   */
  private removeTagFromGroupTagDict(tag: Class_Tag) {
    const tagsData = this._node.internalTagsData
    const grp_id = tag.group.id
    
    if (grp_id in tagsData.taggs_dict) {
      const idx = tagsData.taggs_dict[grp_id].indexOf(tag)
      tagsData.taggs_dict[grp_id].splice(idx, 1)

      // After removing a tag check if the node has other tag from the group,
      //  if not remove tag group entries from node so are_related_node_tags_selected don't take into account groupTag not linked to node
      if (Object.values(tagsData.taggs_dict[grp_id]).length == 0) {
        delete tagsData.taggs_dict[grp_id]
      }
    }
  }
}
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

import * as d3 from 'd3'
import { Class_NodeBase } from './NodeBase'

import {
  Class_LinkElement,
  sortLinksElementsByRelativeNodesPositions
} from './Link'
import { Class_Handler } from './Handler'
import { format_value, Type_JSON } from '../types/Utils'
import { default_element_color } from './ElementsAttributesConfig'
import { SankeyAnimation } from '../Algorithms/SankeyAnimation'
import { draw_arrow_part } from './NodeDrawShape'
import { Class_Sankey } from '../types/Sankey'
import { Class_Tag } from '../types/Tag'
import { NodeTooltip } from './TooltipsNode'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeDimension, NodeDimensionsManager } from './NodeDimension'
import { Class_LevelTagGroup, Class_TagGroup } from '../types/TagGroup'
import { NodeTagsManager } from './NodeTagsManager'
import { NodeDrawValueLabel } from './DrawLabel'
import { Type_Side } from './ElementsAttributesConfig'
// 
// CLASSE PRINCIPALE AVEC LIENS RÉINTÉGRÉS *********************************************

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {ClassAbstract_NodeElement}
 */
export class Class_NodeElement extends Class_NodeBase {
  public _nodeTooltip: NodeTooltip
  public _nodeDimensionsManager: NodeDimensionsManager
  protected _dimensions_as_parent: { [id: string]: Class_NodeDimension } = {}
  protected _dimensions_as_child: { [id: string]: Class_NodeDimension } = {}
  protected _leveltaggs_as_antitagged: Class_LevelTagGroup[] = []
  protected _nodeDrawValueLabel: NodeDrawValueLabel
  protected d3_selection_g_value_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected _sibling_node: Class_NodeElement | undefined = undefined
  protected _master_node: Class_NodeElement | undefined = undefined
  protected _slave_nodes: Class_NodeElement[] = []
  public _nodeTagsManager: NodeTagsManager
  protected _tags: Class_Tag[] = []
  protected _taggs_dict: { [x: string]: Class_Tag[] } = {}
  protected _are_related_node_tags_selected: boolean | undefined = undefined
  protected _node_tags_fingerprint: string = ''
  protected _are_related_dimensions_selected: boolean | undefined = undefined
  protected _tooltip_text: string = ''
  /**
   * Creates an instance of Class_NodeBase.
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea
  ) {
    // Init parent class attributes
    //super(id, drawing_area, drawing_area.sankey, 'g_elements_sankey')
    const default_node_style = drawing_area.sankey.styles_dict['NodeStyle']
    super(id, name, drawing_area, default_node_style)
    this._nodeTooltip = new NodeTooltip(this)

    this._nodeDimensionsManager = new NodeDimensionsManager(this)
    this._nodeDrawValueLabel = new NodeDrawValueLabel(this)
    this._nodeTagsManager = new NodeTagsManager(this)
    drawing_area.list_g_element.unshift(this.id)
  }

  protected _links_visibilities_fingerprint: string = ''
  protected _are_links_visibilities_ok: boolean | undefined = undefined

  private _input_links: { [id: string]: Class_LinkElement } = {}
  private _output_links: { [id: string]: Class_LinkElement } = {}
  private _links_order: Class_LinkElement[] = []
  private _input_links_ending_point: { [id: string]: { x: number, y: number } } = {}
  private _output_links_starting_point: { [id: string]: { x: number, y: number } } = {}
  private _input_links_handle: { [x: string]: Class_Handler } = {}
  private _output_links_handle: { [x: string]: Class_Handler } = {}
  private _link_dragged: Class_LinkElement | undefined

  public resetLinkVisibilitiesMemorization() {
    this._are_links_visibilities_ok = undefined
  }

  protected _orderD3Elements() {
    super._orderD3Elements()
    this._nodeDrawValueLabel.d3_selection?.raise()
  }

  public copyTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string },
    matching_tags: { [_: string]: { [_: string]: string } }
  ) {
    this._nodeTagsManager.copyTagsReferencingFrom(node_to_copy, matching_tagg, matching_tags)
  }

  /**
   * Select the right color to use for this node (attribute / style / tags / ...)
   */
  public getShapeColorToUse() {
    // Default color
    let shape_color = default_element_color
    if (
      (this.shape_color_sustainable)
    ) {
      return this.shape_color
    }
    if (!this.sankey.node_taggs_list.some(tagg => tagg.use_colors)) {
      return this.shape_color
    }
    // Is the color defined by tags
    const taggs_activated = this.taggs_list
      .filter(tagg => tagg.use_colors)
    if (
      (taggs_activated.length > 0)
    ) {
      const tagg_for_colormap = taggs_activated[0]
      const tags_for_colormap = this.tags_list
        .filter(tag => (tag.group === tagg_for_colormap))
      const selected_tags_for_colormap = tags_for_colormap
        .filter(tag => tag.is_selected)

      if (selected_tags_for_colormap.length > 0) {
        shape_color = selected_tags_for_colormap[0].color
      }
    }

    return shape_color
  }


  protected override cleanForDeletion() {
    this._nodeDimensionsManager.cleanForDeletion()
    this._nodeTagsManager.cleanForDeletion()
    // Cleanup links (lignes 282-297)
    this._links_order = []
    Object.values(this._input_links).forEach(link => {
      this.removeInputLink(link)
      link.delete()
    })
    Object.values(this._output_links).forEach(link => {
      this.removeOutputLink(link)
      link.delete()
    })
    this._input_links = {}
    this._output_links = {}
    this._links_order = []
    this._input_links_handle = {}
    this._output_links_handle = {}

    // Call parent
    super.cleanForDeletion()
  }
  protected _copyFrom(_: Class_NodeElement): void {
    super._copyFrom(_)
    this.copyDimensionsFrom(_ as Class_NodeElement)
    this._tooltip_text = _._tooltip_text
    this._nodeTagsManager.copyTagsFrom(_)
  }

  public copyDimensionsFrom(node_to_copy: Class_NodeElement) {
    const json_object = {}
    node_to_copy._nodeDimensionsManager.toJSON(json_object)
    this._nodeDimensionsManager.fromJSON(json_object)
    //this.copyDimensionsFrom(node_to_copy)
    //this._nodeDimensionsManager.copyDimensionsFrom(node_to_copy)
  }

  // 🔄 LINK COPY METHODS - RÉINTÉGRÉS DIRECTEMENT
  public keepLinkOrderingFrom(
    node_to_copy: Class_NodeElement,
    matching_link_id: { [_: string]: string; }
  ) {
    const prev_links_order = [...this._links_order]
    this._links_order = []

    // Fill with link that exist in current sankey and avoid duplicates in link order list
    node_to_copy.links_order
      .forEach(link_to_copy => {
        const link = this.drawing_area.sankey.links_dict[matching_link_id[link_to_copy.id] ?? link_to_copy.id] as Class_LinkElement
        if ((link !== undefined) && (!this._links_order.includes(link)))
          this._links_order.push(link)
      })

    // after copying node_to_copy._link_orders add the remaining links
    const to_keep = prev_links_order.filter(l => !this._links_order.includes(l))
    to_keep.forEach(l => this._links_order.push(l))
  }
  public dimensionsFromJSON(
    json_node_object: Type_JSON,
    matching_nodes_id: { [_: string]: string } = {},
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    this._nodeDimensionsManager.fromJSON(json_node_object, matching_nodes_id, matching_taggs_id, matching_tags_id)
  }

  public get master_node() { return this._master_node }
  public set master_node(_) {
    this._master_node = _
    _?.add_slave_nodes(this)
  }
  public get slave_nodes() { return this._slave_nodes }
  public add_slave_nodes(_: Class_NodeElement) { this._slave_nodes.push(_) }
  public get sibling() { return this._sibling_node }
  public set sibling(_) { this._sibling_node = _ }
  /**
   * Draw given node on drawing area
   */
  protected _draw() {
    super._draw()
    this._nodeDrawValueLabel.drawGenericLabel()
  }
  //public get value_label() { return this._nodeDrawValueLabel.getValueLabel() }
  public drawValueLabel() {
    this._nodeDrawValueLabel.drawGenericLabel()
    this._orderD3Elements()
  }

  /**
   * Recursive function to return list of descendant nodes
   */
  public getListDescendantOfNode(): Class_NodeElement[] {
    let nodeList: Class_NodeElement[] = []

    this.dimensions_as_parent.forEach(dim => {
      nodeList = [...nodeList, ...(dim.children as Class_NodeElement[])]
      dim.children.forEach(child => {
        const castChild = child as Class_NodeElement
        nodeList = [...nodeList, ...castChild.getListDescendantOfNode()]
      })
    })

    return [...new Set(nodeList)]
  }

  // TAGS METHODS =======================================================================
  public hasGivenTag(tag: Class_Tag) { return this._nodeTagsManager.hasGivenTag(tag) }
  public tagsUpdated() { this._are_related_node_tags_selected = undefined }
  public addTag(tag: Class_Tag) {
    this._nodeTagsManager.addTag(tag)
    this.tagsUpdated()
    this.draw()
  }
  public removeTag(tag: Class_Tag) {
    this._nodeTagsManager.removeTag(tag)
    this.tagsUpdated()
    this.draw()
  }

  public get grouped_taggs_dict() { return this._taggs_dict }
  public get tags_list() { return this._tags }
  public get taggs_dict() {
    const taggs: { [_: string]: Class_TagGroup } = {}
    this.tags_list.forEach(tag => {
      if (!taggs[tag.group.id])
        taggs[tag.group.id] = tag.group
    })
    return taggs
  }
  public get taggs_list() { return Object.values(this.taggs_dict) }

  public dimensionsUpdated() {
    this._are_related_dimensions_selected = undefined
    this.updateVisibilityFingerprint()
  }

  public addNewDimensionAsParent(_: Class_NodeDimension) {
    this._nodeDimensionsManager.addNewDimensionAsParent(_)
    this.dimensionsUpdated()
  }

  public addNewDimensionAsChild(_: Class_NodeDimension) {
    this._nodeDimensionsManager.addNewDimensionAsChild(_)
    this.dimensionsUpdated()
  }

  public addAsAntiTagged(_: Class_LevelTagGroup) {
    this._nodeTagsManager.addAsAntiTagged(_)
    this.dimensionsUpdated()
  }

  public removeDimensionAsParent(_: Class_NodeDimension) {
    this._nodeDimensionsManager.removeDimensionAsParent(_)
    this.dimensionsUpdated()
  }

  public removeDimensionAsChild(_: Class_NodeDimension) {
    this._nodeDimensionsManager.removeDimensionAsChild(_)
    this.dimensionsUpdated()
  }

  public removeAsAntiTagged(_: Class_LevelTagGroup) {
    this._nodeTagsManager.removeAsAntiTagged(_)
    this.dimensionsUpdated()
  }

  public nodeDimensionAsParent(child: Class_NodeElement) {
    return this._nodeDimensionsManager.nodeDimensionAsParent(child)
  }

  public nodeDimensionAsChild(parent: Class_NodeElement) {
    return this._nodeDimensionsManager.nodeDimensionAsChild(parent)
  }

  // PUBLIC DRAWING METHODS =============================================================

  public unDraw() {
    super.unDraw()
    // 🔄 UNDRAW HANDLES - RÉINTÉGRÉ DIRECTEMENT
    this._links_order
      .forEach(link => {
        link.unDraw()
        if (link.source === this) this._output_links_handle[link.id].unDraw()
        if (link.target === this) this._input_links_handle[link.id].unDraw()
      })
  }

  public drawAsSelected() {
    super.drawAsSelected()
    this.links_order_visible
      .forEach(link => {
        if (link.source === this) this._output_links_handle[link.id].draw()
        if (link.target === this) this._input_links_handle[link.id].draw()
      })
  }

  // 🔄 DRAW LINKS - RÉINTÉGRÉ DIRECTEMENT
  public drawLinks() {
    this._process_or_bypass(() => this._drawLinks())
  }

  // 🔄 DRAW LINKS ARROW - RÉINTÉGRÉ DIRECTEMENT
  public drawLinksArrow() {
    this._process_or_bypass(() => {
      this._drawLinksArrow()
      this._orderD3Elements()
    })
  }

  /**
   * Launch animation from this node
   */
  public launchAnimation() {
    const animation = new SankeyAnimation(this.drawing_area, this)
    animation.launchAnimation()
  }

  // 🔄 SHAPE SIZE METHODS - RÉINTÉGRÉS DIRECTEMENT
  public getShapeWidthToUse() {
    // Compute sum of thickness on each sides
    const sum_of_top_thickness = this.getSumOfLinksThickness('top')
    const sum_of_bottom_thickness = this.getSumOfLinksThickness('bottom')
    // Return max thickness
    return Math.max(sum_of_top_thickness, sum_of_bottom_thickness, this.shape_min_width)
  }

  public getShapeHeightToUse() {
    // Compute sum of thickness on each sides
    const sum_of_left_thickness = this.getSumOfLinksThickness('left')
    const sum_of_right_thickness = this.getSumOfLinksThickness('right')
    // Return max thickness
    const echangeTag = this.sankey.node_taggs_dict['type de noeud'] ? this.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] as Class_Tag : undefined
    if (echangeTag && this.hasGivenTag(echangeTag)) {
      // TODO code to be rewritten when rearchitecturing code for Import Export
      return Math.max(sum_of_left_thickness, sum_of_right_thickness, 3)
    }
    return Math.max(sum_of_left_thickness, sum_of_right_thickness, this.shape_min_height)
  }

  // 🔄 LINKS METHODS - RÉINTÉGRÉS DIRECTEMENT ========================================

  public hasInputLinks() { return (this.input_links_list.length > 0) }
  public hasOutputLinks() { return (this.output_links_list.length > 0) }

  public addInputLink(link: Class_LinkElement) {
    if (!this._input_links[link.id]) {
      this._input_links[link.id] = link
      if (this._links_order.includes(link)) {
        console.log('this._links_order.includes(link)')
      } else {
        this._links_order.push(link)
      }
      this.addMovingHandleForGivenLink(link, 'input')
      link.target = this
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public addOutputLink(link: Class_LinkElement) {
    if (!this._output_links[link.id]) {
      this._output_links[link.id] = link
      if (this._links_order.includes(link)) {
        console.log('this._links_order.includes(link)')
      } else {
        this._links_order.push(link)
      }
      this.addMovingHandleForGivenLink(link, 'output')
      link.source = this
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public deleteInputLink(link: Class_LinkElement) {
    if (this._input_links[link.id] !== undefined) {
      this.removeInputLink(link)
      link.delete()
      this.draw()
    }
  }

  public deleteOutputLink(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      link.delete()
      this.draw()
    }
  }

  public deleteRecyclingLinkOnSameNode(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined && this._input_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      this.removeInputLink(link)
      link.delete()
      this.draw()
    }
  }

  public removeInputLink(link: Class_LinkElement) {
    this._input_links_handle[link.id]?.unDraw()
    delete this._input_links_handle[link.id]
    delete this._input_links_ending_point[link.id]
    delete this._input_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  public removeOutputLink(link: Class_LinkElement) {
    this._output_links_handle[link.id]?.unDraw()
    delete this._output_links_handle[link.id]
    delete this._output_links_starting_point[link.id]
    delete this._output_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  public swapInputLink(link: Class_LinkElement, node: Class_NodeElement) {
    if (this._input_links[link.id] !== undefined) {
      this.removeInputLink(link)
      node.addInputLink(link)
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public swapOutputLink(link: Class_LinkElement, node: Class_NodeElement) {
    if (this._output_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      node.addOutputLink(link)
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  public getFirstInputLink() {
    if (this.hasInputLinks()) return this.input_links_list[0]
    else return undefined
  }

  public getFirstOutputLink() {
    if (this.hasOutputLinks()) return this.output_links_list[0]
    else return undefined
  }

  public getInputLinksForGivenSide(_: Type_Side) {
    const links_for_side = this.getLinksOrdered(_)
    const input_links_for_side = links_for_side
      .filter(link => link.id in this._input_links)
    return input_links_for_side
  }

  public getOutputLinksForGivenSide(_: Type_Side) {
    const links_for_side = this.getLinksOrdered(_)
    const output_links_for_side = links_for_side
      .filter(link => link.id in this._output_links)
    return output_links_for_side
  }

  public getLinksOrdered(_: Type_Side) {
    const doublon: Class_LinkElement[] = []
    return this._links_order.filter(link => {
      const check = !doublon.includes(link) &&
        ((link.target === this && link.target_side === _) ||
          (link.source === this && link.source_side === _))
      doublon.push(link)
      return (check)
    })
  }

  public getInputLinkEndingPoint(link: Class_LinkElement) {
    if (this._input_links[link.id] !== undefined) {
      if (!this._input_links_ending_point[link.id]) {
        this.drawLinks()
        return undefined
      }
      else {
        return this._input_links_ending_point[link.id]
      }
    }
    return undefined
  }

  public getOutputLinkStartingPoint(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined) {
      if (!this._output_links_starting_point[link.id]) {
        this.drawLinks()
        return undefined
      }
      else {
        return this._output_links_starting_point[link.id]
      }
    }
    return undefined
  }

  public reorganizeIOLinks() {
    const echangeTag = this.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const import_links = this.input_links_list.filter(l => l.source.hasGivenTag(echangeTag as Class_Tag))
    const export_links = this.output_links_list.filter(l => l.target.hasGivenTag(echangeTag as Class_Tag))
    const recycling_links = this._links_order.filter(l => l.shape_is_recycling)

    // Rebuild links_order array safely
    const newLinksOrder = this._links_order
      .filter(l => !import_links.includes(l) && !export_links.includes(l) && !recycling_links.includes(l))
      .sort((link_a, link_b) => sortLinksElementsByRelativeNodesPositions(link_a, link_b, this))

    this._links_order = [...import_links, ...newLinksOrder, ...recycling_links, ...export_links]
    this.draw()
  }

  public reorganizeIOFromListIds(l: string[]) {
    this._links_order.sort((link_a, link_b) => l.indexOf(link_a.id) - l.indexOf(link_b.id))
  }

  public moveLinkToPositionInOrderBefore(
    link_to_move: Class_LinkElement,
    link_target_pos: Class_LinkElement
  ) {
    if (
      this._links_order.includes(link_to_move) &&
      this._links_order.includes(link_target_pos)
    ) {
      const idx_link_to_move = this._links_order.indexOf(link_to_move)
      this._links_order.splice(idx_link_to_move, 1)
      const idx_link_trgt = this._links_order.indexOf(link_target_pos)
      this._links_order.splice(idx_link_trgt, 0, link_to_move)
      this.draw()
    }
  }

  public moveLinkToPositionInOrderAfter(
    link_to_move: Class_LinkElement,
    link_target_pos: Class_LinkElement
  ) {
    if (
      this._links_order.includes(link_to_move) &&
      this._links_order.includes(link_target_pos)
    ) {
      const idx_link_to_move = this._links_order.indexOf(link_to_move)
      this._links_order.splice(idx_link_to_move, 1)
      const idx_link_trgt = this._links_order.indexOf(link_target_pos)
      this._links_order.splice(idx_link_trgt + 1, 0, link_to_move)
      this.draw()
    }
  }

  protected drawElements() {
    super.drawElements()
    this._nodeDrawValueLabel.drawGenericLabel()
  }
  /**
   * Apply node position to it shape in d3
   */
  public applyPosition() {
    if (this.d3_selection !== null) {
      // 🔄 APPLY POSITIONING - RÉINTÉGRÉ DIRECTEMENT
      if (
        (
          (this.shape_position_type === 'relative') ||
          (this.shape_position_type === 'parametric')
        ) &&
        (!this._drag) && (!this.sankey.drawing_area.ghost_link)
      ) {
        // Apply relative position
        if (this.shape_position_type === 'relative') {
          if (this.hasInputLinks()) {
            // Node is export
            const input_link = this.getFirstInputLink()
            const source_node = input_link!.source
            this._position.x = source_node.position_x + this.shape_position_dx + source_node.getShapeWidthToUse()
            this._position.y = source_node.position_y + this.shape_position_dy + source_node.getShapeHeightToUse()
          }
          else if (this.hasOutputLinks()) {
            // Node is import
            const output_link = this.getFirstOutputLink()
            const target_node = output_link!.target
            this._position.x = target_node.position_x + this.shape_position_dx - this.getShapeWidthToUse()
            this._position.y = target_node.position_y + this.shape_position_dy
          }
        }
        // Apply parametric position
        else { // if (this.shape_position_type === 'parametric')
          const process_nodes = this.sankey.visible_nodes_list
          const echangeTag = this.sankey.node_taggs_dict['type de noeud'] ? this.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] as Class_Tag : undefined
          const same_u_import = process_nodes.filter(n => n.output_links_list.length > 0 && n.hasGivenTag(echangeTag!) && n.position_u === this.position_u)
          const same_u_export = process_nodes.filter(n => n.input_links_list.length > 0 && n.hasGivenTag(echangeTag!) && n.position_u === this.position_u)
          const same_u_other = process_nodes.filter(n => !n.hasGivenTag(echangeTag!) && n.position_u === this.position_u)
          if (echangeTag && this.hasGivenTag(echangeTag) && this.output_links_list.length > 0) {
            // Importations
            const firstNonEchangeNodeBelow = same_u_other.filter(n => !n.hasGivenTag(echangeTag)).sort((n1, n2) => n1.position_y - n2.position_y)[0]
            //same_u = same_u.filter(n => n.hasGivenTag(echangeTag) && n.output_links_list.length > 0)
            const nodeAbove = same_u_import[same_u_import.indexOf(this) - 1]
            if (nodeAbove) {
              this._position.y = nodeAbove.position_y
                + nodeAbove.getShapeHeightToUse()
                + this.shape_position_dy
            } else {
              // position of the first import node
              this._position.y = firstNonEchangeNodeBelow.position_y - 100 - this.getShapeHeightToUse() - (same_u_import.length - 1) * this.shape_position_dy
            }
            // if (firstNonEchangeNodeBelow && firstNonEchangeNodeBelow.position_y < this.position_y + 200) {
            //   // The import nodes must be above the rest of the diagram. It is pushed downward.
            //   const shift = 200 + this.position_y - firstNonEchangeNodeBelow.position_y
            //   this.sankey.nodes_list.filter(n => !n.hasGivenTag(echangeTag)).forEach(n => n.shiftVertically(shift))
            //   this.sankey.nodes_list.filter(n => !n.hasGivenTag(echangeTag)).forEach(n => n.draw())
            // }
          }
          else if (echangeTag && this.hasGivenTag(echangeTag) && this.input_links_list.length > 0) {
            // Exportations
            const nodeAbove = same_u_export[same_u_export.indexOf(this) - 1]
            if (nodeAbove) {
              this._position.y = nodeAbove.position_y
                + nodeAbove.getShapeHeightToUse()
                + this.shape_position_dy
            } else {
              let max_vertical_offset = 0
              this.sankey.visible_nodes_list.filter(n => !n.hasGivenTag(echangeTag)).forEach(n => {
                max_vertical_offset = Math.max(n.position_y + n.getShapeHeightToUse(), max_vertical_offset)
              })
              this._position.y = max_vertical_offset + 100
            }
          }
          else {
            const nodeAbove = same_u_other[same_u_other.indexOf(this) - 1]
            if (nodeAbove) {
              const same_container = nodeAbove._attached_container.length == 0 || nodeAbove._attached_container.some(item =>
                this._attached_container.includes(item)
              )
              if (same_container) {
                this._position.y = nodeAbove.position_y
                  + nodeAbove.getShapeHeightToUse()
                  + this.shape_position_dy
              }
            } else {
              // if (this.position_auto_y) {
              //   this._position.y = 0
              // }
            }
            // if (this.position_auto_x) {
            //   this._position.x = this. position_u * this.shape_position_dx
            // }
          }
        }
      }

      this.input_links_list.filter(l => l.source.shape_position_type == 'relative').forEach(l => l.source.applyPosition())
      this.output_links_list.filter(l => l.target.shape_position_type == 'relative').forEach(l => l.target.applyPosition())

      super.applyPosition()
    }
    // Redraw links
    this._drawLinks()
  }

  // 🔄 PRIVATE DRAWING METHODS - RÉINTÉGRÉS DIRECTEMENT ===========================

  /**
   * Call what is necessary each time a link is modified
   */
  private _drawLinks() {
    // Links positions are modified by nodes's position changes
    if (!this.sankey.drawing_area.bypass_compute_positions)
      this.updateLinksPositions()
    else
      this.sankey.visible_links_list.forEach(l => l.draw())
    // Node shape -> affected if links are added or removed, or if links values change
    this.drawShape()
  }

  /**
   * Function that draw all the arrow of link visible linked to this node
   */
  private _drawLinksArrow() {
    const list_link_to_add_arrow = this.input_links_list
      .filter(link => {
        return link.is_visible
          && link.shape_is_arrow
          && link.isRelatedD3SelectionPresentAndSynced
      })
      .sort((l1, l2) => this._links_order.indexOf(l1) - this._links_order.indexOf(l2))

    let cum_v_left = 0
    let cum_h_top = 0
    let cum_v_right = 0
    let cum_h_bottom = 0
    const node_height = this.getShapeHeightToUse()
    const node_width = this.getShapeWidthToUse()

    // Vars to keep track of sum of stacking links
    const sumLinkLeft = this.getSumOfLinksThickness('left')
    const sumLinkRight = this.getSumOfLinksThickness('right')
    const sumLinkTop = this.getSumOfLinksThickness('top')
    const sumLinkBottom = this.getSumOfLinksThickness('bottom')

    // Loop on all visible input links
    list_link_to_add_arrow
      .forEach(link => {
        // Some variable parameters for arrow
        const arrow_length = link.shape_arrow_size
        const node_arrow_shift = 0
        const arrows_adjustment = 0

        // Get side of target node from which arrow as to be drawn
        const link_arrow_side_right = link.target_side == 'right'
        const link_arrow_side_left = link.target_side == 'left'
        const link_arrow_side_top = link.target_side == 'top'
        const link_arrow_side_bottom = link.target_side == 'bottom'

        // Thickness of the link influence arrow size
        const link_value = link.thickness

        let xt: number
        let yt: number
        let current_cumul_of_side = 0 // sum of link thickness we already draw a arrow on , for this side of the node
        let total_cumul_of_side = 0 // Maximum sum of link thickness, for this side of the node

        if (link_arrow_side_left) {
          xt = + this.position_x
          yt = + this.position_y + node_height / 2
          current_cumul_of_side = cum_v_left
          total_cumul_of_side = sumLinkLeft
        }
        else if (link_arrow_side_right) {
          xt = + this.position_x + node_width
          yt = + this.position_y + node_height / 2
          current_cumul_of_side = cum_v_right
          total_cumul_of_side = sumLinkRight
        }
        else if (link_arrow_side_top) {
          xt = + this.position_x + node_width / 2
          yt = + this.position_y
          current_cumul_of_side = cum_h_top
          total_cumul_of_side = sumLinkTop

        }
        else { // if (link_arrow_side_bottom)
          xt = + this.position_x + node_width / 2
          yt = + this.position_y + node_height
          current_cumul_of_side = cum_h_bottom
          total_cumul_of_side = sumLinkBottom
        }

        const p5 = [xt, yt] // Starting point of arrow

        // Some variables parameters influencing arrow shape processing
        const is_horizontal_at_target = link.is_horizontal || link.is_vertical_horizontal
        const is_revert = (is_horizontal_at_target && link_arrow_side_right) || (!is_horizontal_at_target && link_arrow_side_bottom)

        // Draw arrow on link
        link.shape_arrow_path = draw_arrow_part(
          total_cumul_of_side / 2,
          p5,
          +link_value,
          current_cumul_of_side,
          is_horizontal_at_target,
          is_revert,
          arrow_length,
          node_arrow_shift,
          arrows_adjustment
        )

        // Increment side cumul of drawn arrow to influence next arrow starting position
        if (link_arrow_side_left) {
          cum_v_left += link_value
        }
        else if (link_arrow_side_right) {
          cum_v_right += link_value
        }
        else if (link_arrow_side_top) {
          cum_h_top += link_value
        }
        else if (link_arrow_side_bottom) {
          cum_h_bottom += link_value
        }
      })
  }

  /**
   * Redraw links to recolor them
   */
  protected updateLinksColor() { this._links_order.forEach(link => { if (link.is_visible) link.drawShape() }) }



  // 🔄 PRIVATE HELPER METHODS - RÉINTÉGRÉS DIRECTEMENT ============================

  private getSumOfLinksThickness(side: Type_Side) {
    let sum = 0
    this.getLinksOrdered(side)
      .filter(link => link.is_visible)
      .forEach(link => {
        sum = sum + link.thickness
      })
    return sum
  }

  private getLinksStartingPositionOffSet(side: Type_Side) {
    if (side === 'left' || side === 'right') {
      return Math.max(0, (this.getShapeHeightToUse() - this.getSumOfLinksThickness(side)) / 2)
    }
    else {
      return Math.max(0, (this.getShapeWidthToUse() - this.getSumOfLinksThickness(side)) / 2)
    }
  }

  private removeLinkFromOrderingLinksList(link: Class_LinkElement) {
    this._links_order = this._links_order.filter(l => l.id !== link.id)
  }

  private addMovingHandleForGivenLink(
    link: Class_LinkElement,
    type: 'input' | 'output'
  ) {
    const handle = new Class_Handler(
      ('handle_' + this.id + type + '_' + link.id),
      this.drawing_area,
      this,
      this.dragStartHandlerMoveLink,
      this.dragHandlerMoveLink,
      this.dragEndHandlerMoveLink,
      {
        filled: true,
        color: '#F7AD7C',
        class: 'node_io'
      },
      link
    )
    if (type === 'input')
      this._input_links_handle[link.id] = handle
    else // type === 'output'
      this._output_links_handle[link.id] = handle
  }

  private updateLinksPositions() {
    // Reference position
    const x0 = this.position_x
    const y0 = this.position_y
    // Compute width & Height (based on links values)
    const width = this.getShapeWidthToUse()
    const height = this.getShapeHeightToUse()
    // Offsets positions : based on others links + node's heigth / width
    let dy_right = this.getLinksStartingPositionOffSet('right')
    let dy_left = this.getLinksStartingPositionOffSet('left')
    let dx_top = this.getLinksStartingPositionOffSet('top')
    let dx_bottom = this.getLinksStartingPositionOffSet('bottom')
    // List of links to redraw
    const link_to_redraw: Class_LinkElement[] = [] // avoid recomputation

    const doublon: Class_LinkElement[] = []

    // Loop on all links to compute starting / ending position
    this._links_order
      .forEach(link => {
        // Filter out and undraw unvisible links
        if (!link.is_visible) {
          link.unDraw()
          if (link.source === this) {
            delete this._output_links_starting_point[link.id]
            this._output_links_handle[link.id].unDraw()
          }
          if (link.target === this) {
            delete this._input_links_ending_point[link.id]
            this._input_links_handle[link.id].unDraw()
          }
          return
        }
        // Get positioning parameters
        const thickness = link.thickness
        const handle_position_shift = 5
        // Current node is link's source
        if (link.source === this && !doublon.includes(link)) {
          let link_starting_point: { x: number, y: number } = { x: x0, y: y0 }
          let link_starting_handle_point: { x: number, y: number } = { x: x0, y: y0 }
          if (link.source_side === 'right') {
            link_starting_point = { x: (x0 + width), y: (y0 + dy_right + thickness / 2) }
            link_starting_handle_point = { x: (link_starting_point.x + handle_position_shift), y: link_starting_point.y }
            dy_right = dy_right + thickness
          }
          else if (link.source_side === 'left') {
            link_starting_point = { x: x0, y: (y0 + dy_left + thickness / 2) }
            link_starting_handle_point = { x: (link_starting_point.x - handle_position_shift), y: link_starting_point.y }
            dy_left = dy_left + thickness
          }
          else if (link.source_side === 'top') {
            link_starting_point = { x: (x0 + dx_top + thickness / 2), y: y0 }
            link_starting_handle_point = { x: link_starting_point.x, y: link_starting_point.y - handle_position_shift }
            dx_top = dx_top + thickness
          }
          else {  // link.source_side === 'bottom'
            link_starting_point = { x: (x0 + dx_bottom + thickness / 2), y: (y0 + height) }
            link_starting_handle_point = { x: link_starting_point.x, y: link_starting_point.y + handle_position_shift }
            dx_bottom = dx_bottom + thickness
          }
          // Draw link if position has not been set before
          let need_to_draw = (
            (this._output_links_starting_point[link.id] === undefined) ||
            (!link.isRelatedD3SelectionPresentAndSynced())
          )
          if (!need_to_draw) {
            // Or if diff is at least one pixel
            const dx = this._output_links_starting_point[link.id].x - link_starting_point.x
            const dy = this._output_links_starting_point[link.id].y - link_starting_point.y
            need_to_draw = ((Math.abs(dx) >= 1) || (Math.abs(dy) >= 1))
          }
          // If one of these two conditions match, add link to redraw list
          if (need_to_draw) {
            // Will redraw if it's the case
            link_to_redraw.push(link)
            // Save position
            this._output_links_starting_point[link.id] = link_starting_point
            // Update handle
            if (this._output_links_handle[link.id] !== undefined) {
              this._output_links_handle[link.id]
                .setPosXY(
                  link_starting_handle_point.x,
                  link_starting_handle_point.y)
              // Set a class to the handler corresponding to the source side of link, it is use for css cursor
              this._output_links_handle[link.id]
                .d3_selection?.attr('class', 'node_io ' + link.source_side)
            }
          }
          doublon.push(link)
        }
        // Or current node is link's target
        else if (link.target === this) {
          let link_ending_point: { x: number, y: number } = { x: x0, y: y0 }
          let link_ending_handle_point: { x: number, y: number } = { x: x0, y: y0 }
          if (link.target_side === 'right') {
            link_ending_point = { x: (x0 + width), y: (y0 + dy_right + thickness / 2) }
            link_ending_handle_point = { x: (link_ending_point.x + handle_position_shift), y: link_ending_point.y }
            dy_right = dy_right + thickness
          }
          else if (link.target_side === 'left') {
            link_ending_point = { x: x0, y: (y0 + dy_left + thickness / 2) }
            link_ending_handle_point = { x: (link_ending_point.x - handle_position_shift), y: link_ending_point.y }
            dy_left = dy_left + thickness
          }
          else if (link.target_side === 'top') {
            link_ending_point = { x: (x0 + dx_top + thickness / 2), y: y0 }
            link_ending_handle_point = { x: link_ending_point.x, y: (link_ending_point.y - handle_position_shift) }
            dx_top = dx_top + thickness
          }
          else {  // link.target_side === 'bottom'
            link_ending_point = { x: (x0 + dx_bottom + thickness / 2), y: (y0 + height) }
            link_ending_handle_point = { x: link_ending_point.x, y: (link_ending_point.y + handle_position_shift) }
            dx_bottom = dx_bottom + thickness
          }
          // Draw link if position has not been set before
          let need_to_draw = (
            (this._input_links_ending_point[link.id] === undefined) ||
            (!link.isRelatedD3SelectionPresentAndSynced())
          )
          if (!need_to_draw) {
            // Or if diff is at least one pixel
            const dx = this._input_links_ending_point[link.id].x - link_ending_point.x
            const dy = this._input_links_ending_point[link.id].y - link_ending_point.y
            need_to_draw = ((Math.abs(dx) >= 1) || (Math.abs(dy) >= 1))
          }
          // If one of these two conditions match, add link to redraw list
          if (need_to_draw) {
            link_to_redraw.push(link)
            // Save position
            this._input_links_ending_point[link.id] = link_ending_point
            // Update handle
            if (this._input_links_handle[link.id] !== undefined) {
              this._input_links_handle[link.id]
                .setPosXY(
                  link_ending_handle_point.x,
                  link_ending_handle_point.y)
              // Set a class to the handler corresponding to the target side of link, it is use for css cursor
              this._input_links_handle[link.id]
                .d3_selection?.attr('class', 'node_io ' + link.target_side)
            }
          }
        }
      })

    // Loop on all visible link to draw
    // Note : Two loops is best because link drawing can trigger other nodes drawLink() methode
    // -> So to avoid mutual blocking between node, it's best to compute first all links positions and then loop
    //    again on links to draw them
    link_to_redraw
      .forEach(link => {
        link.draw()
        //if (link.source === this && this._output_links_handle[link.id]) this._output_links_handle[link.id].draw()
        //if (link.target === this && this._input_links_handle[link.id]) this._input_links_handle[link.id].draw()
      })
  }

  // 🔄 DRAG EVENT HANDLERS FOR LINK HANDLES - RÉINTÉGRÉS DIRECTEMENT =============

  private dragHandlerMoveLink = (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
    if (this._link_dragged && (event.dy !== 0 || event.dx !== 0)) {
      // Get link currently dragged
      const link_dragged = this._link_dragged as Class_LinkElement
      // Search if handler is for a link incoming or outcoming from the node
      const handle_src_or_trgt = (link_dragged.target === this) ? 'target' : 'source'
      const dragged_side = (handle_src_or_trgt === 'target') ? link_dragged.target_side : link_dragged.source_side
      const node_ref_io = (handle_src_or_trgt === 'target') ? this.input_links_list : this.output_links_list

      // Create an array from links_order with only the links in or out the same side of the dragged link
      const list_links_node_side = this._links_order
        .filter(link => {
          const curr_link_side = (handle_src_or_trgt === 'source') ? link.source_side : link.target_side
          return node_ref_io.includes(link) && (curr_link_side == dragged_side)
        })

      // Get index of dragged link in this filtered array
      const idx_drgd_link = list_links_node_side.indexOf(link_dragged)

      // Variable to know in which directions we move the mouse
      const move_to_the_top = Math.sign(event.dy) == -1
      const move_to_the_left = Math.sign(event.dx) == -1

      // If we move the mouse vertically then this variable should be true,
      // it will allow to swap dragged link with previous/next link coming/going on the same side (left/right) to the node_ref
      const is_handler_on_horiz_side = (
        ((handle_src_or_trgt === 'target') && (link_dragged.is_horizontal || link_dragged.is_vertical_horizontal)) ||
        ((handle_src_or_trgt === 'source') && (link_dragged.is_horizontal || link_dragged.is_horizontal_vertical)))

      // If we move the mouse horizontally then this variable should be true ,
      // it will allow to swap dragged link with previous/next link coming/going on the same side (below/above) to the node_ref
      const is_handler_on_vert_side = (
        ((handle_src_or_trgt === 'target') && (link_dragged.is_vertical || link_dragged.is_horizontal_vertical)) ||
        ((handle_src_or_trgt === 'source') && (link_dragged.is_vertical || link_dragged.is_vertical_horizontal)))

      // Move link to the above / left
      if ((
        (move_to_the_top && is_handler_on_horiz_side) ||
        (move_to_the_left && is_handler_on_vert_side)) &&
        idx_drgd_link > 0
      ) {
        // Move dragged link before the previous link coming/going th the node
        const prev_link = list_links_node_side[idx_drgd_link - 1]
        this.moveLinkToPositionInOrderBefore(link_dragged, prev_link)
      }
      // Move link to the below / right
      else if ((
        (!move_to_the_top && is_handler_on_horiz_side) ||
        (!move_to_the_left && is_handler_on_vert_side)) &&
        (idx_drgd_link < list_links_node_side.length - 1)
      ) {
        // Move dragged link after the next link coming/going th the node
        const next_link = list_links_node_side[idx_drgd_link + 1]
        this.moveLinkToPositionInOrderAfter(link_dragged, next_link)
      }
    }
  }

  private dragStartHandlerMoveLink = (_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
    const handler = _event.subject as Class_Handler
    const link_ref = handler.ref_element_optional
    if (link_ref && link_ref instanceof Class_LinkElement) {
      this._link_dragged = link_ref as Class_LinkElement

      const saveCurrOder = this._links_order.map(l => l.id)
      this.drawing_area.application_data.history.saveUndo(() => {
        this.reorganizeIOFromListIds(saveCurrOder)
        this.draw()
      })
    }
  }

  private dragEndHandlerMoveLink = (_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
    this._link_dragged = undefined

    const saveCurrOder = this._links_order.map(l => l.id)
    this.drawing_area.application_data.history.saveRedo(() => {
      this.reorganizeIOFromListIds(saveCurrOder)
      this.draw()
    })
  }
  public get are_related_node_tags_selected(): boolean {
    if (
      (this._are_related_node_tags_selected === undefined) ||
      (this.sankey.node_tags_fingerprint !== this._node_tags_fingerprint)
    ) {
      let are_related_node_tags_selected: boolean
      const list_tag = this.tags_list
      if (list_tag.length > 0) {
        let display = true
        Object.entries(this._taggs_dict).filter(([key, _]) => this.sankey.node_taggs_dict[key]).forEach(([_, tag_list]) => {
          display = (tag_list.filter(tag => tag.is_selected).length > 0) ? display : false
        })
        are_related_node_tags_selected = display
      } else {
        are_related_node_tags_selected = true
      }

      if (are_related_node_tags_selected !== this._are_related_node_tags_selected) {
        this.updateVisibilityFingerprint()
      }

      this._are_related_node_tags_selected = are_related_node_tags_selected
      this._node_tags_fingerprint = this.sankey.node_tags_fingerprint
    }
    return this._are_related_node_tags_selected
  }

  public get is_visible() {
    return (
      super.is_visible &&
      this.are_related_node_tags_selected &&
      this.are_related_dimensions_selected &&
      this.are_links_visibilities_ok &&
      this.orphan_visible
    )
  }
  public get is_visible_without_orphan() {
    return (
      super.is_visible &&
      this.are_related_node_tags_selected &&
      this.are_related_dimensions_selected &&
      this.are_links_visibilities_ok
    )
  }

  public get links_order_visible(): Class_LinkElement[] { return this._links_order.filter(link => link.is_visible) }
  public get links_order(): Class_LinkElement[] { return this._links_order }

  // TAGS GETTERS =======================================================================


  public get input_links_dict() { return this._input_links }
  public get input_links_list() { return Object.values(this._input_links) }
  public get visible_input_links_list() { return Object.values(this._input_links).filter(l => l.is_visible) }
  public get output_links_dict() { return this._output_links }
  public get output_links_list() { return Object.values(this._output_links) }
  public get visible_output_links_list() { return Object.values(this._output_links).filter(l => l.is_visible) }
  public get link_dragged(): Class_LinkElement | undefined { return this._link_dragged }
  public set link_dragged(value: Class_LinkElement | undefined) { this._link_dragged = value }


  // 🔄 LINKS VISIBILITY - RÉINTÉGRÉ DIRECTEMENT
  private get are_links_visibilities_ok() {
    const links_visibilities_fingerprint = this.getLinksVisibilitiesFingerprint()
    if (
      (this._are_links_visibilities_ok === undefined ||
        links_visibilities_fingerprint !== this._links_visibilities_fingerprint)
    ) {
      const are_links_visibilities_ok = this.checkIfLinksVisibilitiesAreOK()

      if (are_links_visibilities_ok !== this._are_links_visibilities_ok) {
        this.updateVisibilityFingerprint()
      }

      this._are_links_visibilities_ok = are_links_visibilities_ok
      this._links_visibilities_fingerprint = links_visibilities_fingerprint
    }
    return this._are_links_visibilities_ok
  }

  private getLinksVisibilitiesFingerprint() {
    let links_visibilities_fingerprint = ''
    this._links_order
      .forEach(link => links_visibilities_fingerprint = links_visibilities_fingerprint + link.visibility_fingerprint + link.source.visibility_fingerprint + link.target.visibility_fingerprint)
    return links_visibilities_fingerprint + '_' + this.sankey.data_tags_fingerprint
  }

  private get orphan_visible() {
    if (this.visible_input_links_list.length + this.visible_output_links_list.length == 0) {
      if (this.shape_orphan_node_visible) return true
      else return false
    }
    return true
  }

  private checkIfLinksVisibilitiesAreOK() {
    if (this.input_links_list.length + this.output_links_list.length == 0) {
      return true
    }
    const input_links_visible = this.input_links_list.filter(link =>
      link.is_not_zero &&
      link.are_related_flux_tags_selected &&
      link.source.are_related_node_tags_selected &&
      link.source.are_related_dimensions_selected
    )
    if (input_links_visible.length > 0) {
      return true
    }
    const output_links_visible = this.output_links_list.filter(link =>
      link.is_not_zero &&
      link.are_related_flux_tags_selected &&
      link.target.are_related_node_tags_selected &&
      link.target.are_related_dimensions_selected
    )
    if (output_links_visible.length > 0) {
      return true
    }
    return false
  }

  // SPECIAL METHODS FOR IMPORT/EXPORT =================================================

  // 🔄 SPLIT IMPORT EXPORT - RÉINTÉGRÉ DIRECTEMENT
  public SplitIOrE(importation: boolean) {
    (importation ? this.output_links_list : this.input_links_list).forEach((input_or_output_link) => {
      const extremity_node = importation ? input_or_output_link.target : input_or_output_link.source
      const le_nom = this.name + ' - ' + (importation ? 'Importations' : 'Exportations') + ' - ' + extremity_node.name
      let idTrade = extremity_node.id + '-' + this.id + (importation ? 'Importations' : 'Exportations')
      idTrade = idTrade.replaceAll(' ', '')

      const new_node = (this.sankey as Class_Sankey).addNewNode(idTrade, le_nom)
      new_node.sibling = this

      // Handle dimensions and tags...
      Object.values(this.dimensions_as_child)
        .forEach(dim => {
          const node_parent = dim.parent
          const name = extremity_node.id + '-' + node_parent.id + (importation ? 'Importations' : 'Exportations')
          this._nodeDimensionsManager.getOrCreateLowerDimension(
            this.sankey.nodes_dict[name],
            new_node,
            dim.id
          )
        })

      // Continue with rest of the implementation...
      this.tags_list.forEach(tag => {
        new_node.addTag(tag)
      })

      // Style handling
      const node_importation_style = this.shape_position_type !== 'parametric' ? 'NodeImportCloseStyle' : 'NodeImportAboveStyle'
      const node_exportation_style = this.shape_position_type !== 'parametric' ? 'NodeExportCloseStyle' : 'NodeExportBelowStyle'
      const node_importexport_style = this.shape_position_type !== 'parametric' ? 'NodeImportExportCloseStyle' : 'NodeImportExportAboveBelowStyle'
      const link_importation_style = this.shape_position_type !== 'parametric' ? 'LinkImportCloseStyle' : ''
      const link_exportation_style = this.shape_position_type !== 'parametric' ? 'NodeExportCloseStyle' : ''
      const link_importexport_style = this.shape_position_type !== 'parametric' ? 'LinkImportExportCloseStyle' : 'LinkImportExportAboveBelowStyle'

      new_node.style = [
        new_node.sankey.styles_dict['NodeSectorStyle'],
        new_node.sankey.styles_dict[node_importexport_style],
        importation ?
          new_node.sankey.styles_dict[node_importation_style] :
          new_node.sankey.styles_dict[node_exportation_style]
      ]

      input_or_output_link.style = [
        new_node.sankey.styles_dict[link_importexport_style]
      ]
      if (this.shape_position_type == 'parametric') {
        input_or_output_link.style.push(
          importation ?
            new_node.sankey.styles_dict[link_importation_style] :
            new_node.sankey.styles_dict[link_exportation_style]
        )
      }

      input_or_output_link.shape_is_recycling = false

      extremity_node.tags_list.forEach(tag => {
        if (tag.group.id === 'type de noeud') {
          return
        }
        new_node.addTag(tag)
      })

      if (importation) {
        input_or_output_link.source = new_node
        new_node.addOutputLink(input_or_output_link)
      } else {
        input_or_output_link.target = new_node
        new_node.addInputLink(input_or_output_link)
      }
    })
  }

  public setTradeDimensions(importation: boolean) { this._nodeDimensionsManager.setTradeDimensions(importation) }

  public eventSimpleLMBCLick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventSimpleLMBCLick(event)
    this._nodeEventsHandler.handleSimpleLMBClick(event)
    // OSP Extension - Ajouter cette section
    if (this.hyperlink) {
      window.open(this.hyperlink)
    }
  }
  protected eventMaintainedClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMaintainedClick(event)
    this._nodeEventsHandler.handleMaintainedClick(event)
  }

  public drawTooltip() {
    this._nodeTooltip.drawTooltip()
  }

  public get is_child() { return this._nodeDimensionsManager.is_child }
  public get is_parent() { return this._nodeDimensionsManager.is_parent }
  public get is_multi_parent() { return this._nodeDimensionsManager.is_multi_parent }
  public get dimensions_as_parent() { return this._nodeDimensionsManager.dimensions_as_parent }
  public get is_multi_children() { return this._nodeDimensionsManager.is_multi_children }
  public get dimensions_as_child() { return this._nodeDimensionsManager.dimensions_as_child }

  public get are_related_dimensions_selected(): boolean {
    if (this._are_related_dimensions_selected === undefined) {
      const are_related_dimensions_selected = this._nodeDimensionsManager.checkIfRelatedDimensionsAreSelected()

      if (are_related_dimensions_selected !== this._are_related_dimensions_selected) {
        this.updateVisibilityFingerprint()
      }

      this._are_related_dimensions_selected = are_related_dimensions_selected
    }
    return this._are_related_dimensions_selected
  }

  // REMAINING MANAGERS DATA ACCESS =====================================================

  public get internalTagsData() {
    return {
      tags: this._tags,
      taggs_dict: this._taggs_dict,
      leveltaggs_as_antitagged: this._leveltaggs_as_antitagged
    }
  }

  public get internalDimensionsData() {
    return {
      dimensions_as_parent: this._dimensions_as_parent,
      dimensions_as_child: this._dimensions_as_child,

    }
  }

  public get tooltip_text() { return this._tooltip_text }
  public set tooltip_text(_: string) { this._tooltip_text = _ }

  public get data_value() {
    let input_val = 0
    let output_val = 0

    // Éviter les problèmes de float
    let max_digit_in = 0
    const link_in = this.input_links_list
      .filter(link => link.is_visible)
      .map(link => {
        const decimal_digit = String(link.valueCurrent).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_in = Math.max(max_digit_in, decimal_digit.length)
        }
        return link
      })

    const pow_in = Math.pow(10, max_digit_in)
    link_in.forEach(link => input_val += (link.valueCurrent ?? 0) * pow_in)

    let max_digit_out = 0
    const link_out = this.output_links_list
      .filter(link => link.is_visible)
      .map(link => {
        const decimal_digit = String(link.valueCurrent).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_out = Math.max(max_digit_out, decimal_digit.length)
        }
        return link
      })

    const pow_out = Math.pow(10, max_digit_out)
    link_out.forEach(link => output_val += (link.valueCurrent ?? 0) * pow_out)
    return Math.max(input_val / pow_in, output_val / pow_out)
  }

  public get data_label(): string {
    let input_val = 0
    let output_val = 0

    // Éviter les problèmes de float
    let max_digit_in = 0
    const link_in = this.input_links_list
      .filter(link => link.is_visible)
      .map(link => {
        const decimal_digit = String(link.valueCurrent).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_in = Math.max(max_digit_in, decimal_digit.length)
        }
        return link
      })

    const pow_in = Math.pow(10, max_digit_in)
    link_in.forEach(link => input_val += (link.valueCurrent ?? 0) * pow_in)

    let max_digit_out = 0
    const link_out = this.output_links_list
      .filter(link => link.is_visible)
      .map(link => {
        const decimal_digit = String(link.valueCurrent).split('.')[1]
        if (decimal_digit !== undefined) {
          max_digit_out = Math.max(max_digit_out, decimal_digit.length)
        }
        return link
      })

    const pow_out = Math.pow(10, max_digit_out)
    link_out.forEach(link => output_val += (link.valueCurrent ?? 0) * pow_out)

    return format_value(
      this.sankey.drawing_area.type_data,
      Math.max(input_val / pow_in, output_val / pow_out),
      this,
      this.value_label_unit,
      'value_label'
    )
  }
  public get selected_elements_list() {
    return this.sankey.drawing_area.selected_nodes_list
  }
  public set_contextualized_element(element: Class_NodeBase) {
    this.drawing_area.node_contextualised = element as Class_NodeElement
  }
}
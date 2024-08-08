// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import * as SankeyShapes from '../draw/SankeyDrawShapes'
// Local types
import {
  Type_ElementPosition,
  Type_JSON,
  Type_Position,
  default_element_color,
  default_element_position,
  default_font,
  getBooleanFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringListFromJSON,
  getStringListOrUndefinedFromJSON,
  getStringOrUndefinedFromJSON,
  makeId,
} from './Utils'
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  default_style_id
} from './Sankey'
import {
  Class_Element
} from './Element'
import {
  Class_Tag,
  Class_TagGroup,
  Class_LevelTagGroup,
  Class_LevelTag
} from './Tag'
import {
  Class_LinkElement,
  Type_Side,
  Class_GhostLinkElement,
  sortLinksElementsByRelativeNodesPositions
} from './Link'
import {
  Class_Handler
} from './Handler'



// SPECIFIC TYPES ***********************************************************************

type Type_Shape = 'ellipse' | 'rect' | 'arrow'
type Type_TextHPos = 'left' | 'middle' | 'right' | 'dragged'
type Type_TextVPos = 'top' | 'middle' | 'bottom' | 'dragged'

// SPECIFIC CONSTANTS *******************************************************************

export const default_shape_type: Type_Shape = 'rect'
export const default_shape_arrow_angle_factor = 30
export const default_shape_arrow_angle_direction: Type_Side = 'right'
export const default_shape_visible = true
export const default_shape_min_width = 40
export const default_shape_min_height = 40
export const default_shape_color = default_element_color
export const default_shape_color_sustainable = false
export const default_label_font_family = default_font
export const default_label_font_size = 14
export const default_label_color = false
export const default_label_uppercase = false
export const default_label_bold = false
export const default_label_italic = false
export const default_label_background = false
export const default_name_label_visible = true
export const default_name_label_vert: Type_TextVPos = 'bottom'
export const default_name_label_horiz: Type_TextHPos = 'middle'
export const default_value_label_visible = false
export const default_value_label_vert: Type_TextVPos = 'top'
export const default_value_label_horiz: Type_TextHPos = 'middle'
export const default_label_box_width = 150

const default_selected_stroke_width = 3

// SPECIFIC FUNCTIONS *******************************************************************

export function sortNodesElements(
  a: Class_NodeElement | Class_NodeStyle,
  b: Class_NodeElement | Class_NodeStyle
) {
  if (a.id > b.id) return 1
  else if (a.id < b.id) return -1
  else return 0
}

export function isAttributeOverloaded(
  nodes: Class_NodeElement[],
  attr: keyof Class_NodeAttribute
) {
  let overloaded = false
  nodes.forEach(node => overloaded = (overloaded || node.isAttributeOverloaded(attr)))
  return overloaded
}

// CLASS NODE_ELEMENT *******************************************************************

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {Class_Element}
 */
export class Class_NodeElement extends Class_Element {

  // PUBLIC ATTRIBUTES ==================================================================

  // Nothing ...

  // PROTECTED ATTRIBUTE ================================================================

  // Definition of abstract attribut from Class_Element
  protected _display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    style: Class_NodeStyle,
    attributes: Class_NodeAttribute
    position_x_label?: number// Relative x position of label when dragged (optionnal)
    position_y_label?: number// Relative y position of label when dragged (optionnal)
  }

  // PRIVATE ATTRIBUTES =================================================================

  // Name
  private _name: string

  // Name Labels
  // TODO get from application data
  private _name_label_separator: string = ''

  // Related IO links
  private _input_links: { [id: string]: Class_LinkElement } = {}
  private _output_links: { [id: string]: Class_LinkElement } = {}

  // Ordering for related IO Links
  private _links_order: Class_LinkElement[] = []

  // Value of node
  private _input_data_value: number = 0
  private _output_data_value: number = 0

  // Handles used to move related IO links relativly to eachother
  private _handle_input_links: { [x: string]: Class_Handler } = {}
  private _handle_output_links: { [x: string]: Class_Handler } = {}

  // Node tags
  private _tags: { [id: string]: Class_Tag } = {}

  // Dimensions (level tags)
  private _dimensions_as_parent: { [id: string]: Class_NodeDimension } = {}
  private _dimensions_as_child: { [id: string]: Class_NodeDimension } = {}

  // Reference to link dragged when we drag a handle
  private _link_dragged: Class_LinkElement | undefined

  // Tooltips
  private _tooltip_text?: string

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_NodeElement.
   * @param {string} id
   * @param {string} name
   * @param {Class_DrawingArea} drawing_area
   * @memberof Class_NodeElement
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Init parent class attributes
    super(id, menu_config, 'g_nodes')
    // Init other class attributes
    this._name = name
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
      style: drawing_area.sankey.default_node_style,
      attributes: new Class_NodeAttribute()
    }
    // Link with default style
    this._display.style.addReference(this)
  }

  // CLEANING ===========================================================================

  /**
   * Define deletion behavior
   * @memberof Class_Node
   */
  protected cleanForDeletion() {
    // Delete all related links
    this._links_order = []
    Object.values(this._input_links)
      .forEach(link => {
        this.removeInputLink(link)
        link.delete()
      })
    Object.values(this._output_links)
      .forEach(link => {
        this.removeOutputLink(link)
        link.delete()
      })
    this._input_links = {}
    this._output_links = {}
    this._links_order = []
    this._handle_input_links = {}
    this._handle_output_links = {}
    // Remove reference of self in related tags
    this.tags_list.forEach(tag => tag.removeReference(this))
    this._tags = {}
    // Remove reference of self in style
    this.style.removeReference(this)
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Copy attributes from a given node & create/copy ref to current sankey (ref to node_taggs & style)
   *
   * @param {Class_NodeElement} node_to_copy
   * @memberof Class_NodeElement
   */
  public copyFrom(node_to_copy: Class_NodeElement) {
    // Copy attributes ------------------------------------------------------------------
    // Name
    this._name = node_to_copy.name
    this._name_label_separator = node_to_copy._name_label_separator
    // Display
    this._display.position = structuredClone(node_to_copy._display.position)
    this._display.position_x_label = node_to_copy._display.position_x_label
    this._display.position_y_label = node_to_copy._display.position_y_label
    // Copy local attributes
    this._display.attributes.copyFrom(node_to_copy._display.attributes)
    // Set node style to node_to_copy style if they have the same id & existing in current data (style should have been updated with new layout when we do this function)
    if (this.drawing_area.sankey.node_styles_list.map(ns => ns.id).includes(node_to_copy._display.style.id)) {
      const new_style_id = this.drawing_area.sankey.node_styles_list.map(ns => ns.id).filter(ns => ns.includes(node_to_copy._display.style.id))[0]
      this._display.style = this.drawing_area.sankey.node_styles_dict[new_style_id]
      this._display.style.addReference(this)
    }
    // Copy input links ------------------------------------------------------------------
    // Add missing input links
    node_to_copy.input_links_list
      .filter(link => {
        return (
          (link.id in this.main_sankey.links_dict) &&
          !(link.id in this.input_links_dict)
        )
      })
      .forEach(link => {
        this.addInputLink(this.main_sankey.links_dict[link.id])
      })
    // Create missing input link from existing source node
    node_to_copy.input_links_list
      .filter(link => {
        return (
          !(link.id in this.main_sankey.links_dict) &&
          (link.source.id in this.main_sankey.nodes_dict)
        )
      })
      .forEach(link => {
        const new_link = new Class_LinkElement(
          link.id,
          this.main_sankey.nodes_dict[link.source.id],
          this,
          this.drawing_area,
          this.menu_config
        )
        this.addInputLink(new_link)
      })
    // Remove input link that are not input links on node to copy from
    this.input_links_list
      .filter(link => {
        return (
          !(link.id in node_to_copy.input_links_dict)
        )
      })
      .forEach(link => this.deleteInputLink(link))
    // Copy output links ------------------------------------------------------------------
    // Add missing output links
    node_to_copy.output_links_list
      .filter(link => {
        return (
          (link.id in this.main_sankey.links_dict) &&
          !(link.id in this.output_links_dict)
        )
      })
      .forEach(link => {
        this.addOutputLink(this.main_sankey.links_dict[link.id])
      })
    // Create missing input link from existing source node
    node_to_copy.output_links_list
      .filter(link => {
        return (
          !(link.id in this.main_sankey.links_dict) &&
          (link.target.id in this.main_sankey.nodes_dict)
        )
      })
      .forEach(link => {
        const new_link = new Class_LinkElement(
          link.id,
          this,
          this.main_sankey.nodes_dict[link.target.id],
          this.drawing_area,
          this.menu_config
        )
        this.addInputLink(new_link)
      })
    // Remove input link that are not input links on node to copy from
    this.output_links_list
      .filter(link => {
        return (
          !(link.id in node_to_copy.output_links_dict)
        )
      })
      .forEach(link => this.deleteInputLink(link))
    // Copy links orders ----------------------------------------------------------------
    this._links_order = []  // Empty current link order list
    // Fill with link that exist in current sankey and avoid duplicates in link ordre list
    node_to_copy._links_order
      .filter(link_to_copy => link_to_copy.id in this.drawing_area.sankey.links_dict)
      .forEach(link_to_copy => {
        const link = this.drawing_area.sankey.links_dict[link_to_copy.id]
        if (!this._links_order.includes(link))
          this._links_order.push(link)
      })
    // Copy tags ------------------------------------------------------------------------
    let all_existing_tags: { [_: string]: Class_Tag } = {}
    this.main_sankey.node_taggs_list
      .forEach(tagg => {
        all_existing_tags = {
          ...all_existing_tags,
          ...tagg.tags_dict
        }
      })
    // Add missing tags
    node_to_copy.tags_list
      .filter(tag => {
        return (
          (tag.id in all_existing_tags) &&
          !(tag.id in this.tags_dict)
        )
      })
      .forEach(tag => {
        this.addTag(tag)
      })
    // Remove tags that are not present on node to copy from
    this.tags_list
      .filter(tag => {
        return (
          !(tag.id in node_to_copy.tags_dict)
        )
      })
      .forEach(tag => this.removeTag(tag))
    // Copy dimensions ------------------------------------------------------------------
    // Create a dict of all existing dimensions in this related sankey
    const all_existing_dim: { [_: string]: Class_NodeDimension } = {}
    this.main_sankey.level_taggs_list
      .forEach(tagg => {
        tagg.tags_list
          .forEach(tag => {
            // Chech children dimensions
            tag.dimensions_list_as_tag_for_children
              .filter(dim => !(dim.id in all_existing_dim))
              .forEach(dim => all_existing_dim[dim.id] = dim)
            // Check parent dimensions
            tag.dimensions_list_as_tag_for_parent
              .filter(dim => !(dim.id in all_existing_dim))
              .forEach(dim => all_existing_dim[dim.id] = dim)
          })
      })
    // Add existing and missing child dimensions
    Object.values(node_to_copy._dimensions_as_child)
      .filter(dim => {
        return (
          (dim.id in all_existing_dim) &&
          !(dim.id in this._dimensions_as_child)
        )
      })
      .forEach(dim => {
        this.addNewDimensionAsChild(all_existing_dim[dim.id])
      })
    // Add existing and missing parent dimensions
    Object.values(node_to_copy._dimensions_as_parent)
      .filter(dim => {
        return (
          (dim.id in all_existing_dim) &&
          !(dim.id in this._dimensions_as_parent)
        )
      })
      .forEach(dim => {
        this.addNewDimensionAsParent(all_existing_dim[dim.id])
      })
    // TODO Create non-existing and missing child & parent dimensions
    // Delete unnecessary child dimensions
    Object.values(this._dimensions_as_child)
      .filter(dim => {
        return (
          !(dim.id in node_to_copy._dimensions_as_child)
        )
      })
      .forEach(dim => this.removeDimensionAsChild(dim))
    // Delete unnecessary parent dimensions
    Object.values(this._dimensions_as_parent)
      .filter(dim => {
        return (
          !(dim.id in node_to_copy._dimensions_as_parent)
        )
      })
      .forEach(dim => this.removeDimensionAsParent(dim))
    // Sync child dimensions
    Object.values(this._dimensions_as_child)
      .forEach(dim => dim.synchroWith(node_to_copy._dimensions_as_child[dim.id]))
    // Sync parent dimensions
    Object.values(this._dimensions_as_parent)
      .forEach(dim => dim.synchroWith(node_to_copy._dimensions_as_parent[dim.id]))
  }

  // Drawing methods --------------------------------------------------------------------

  /**
   * Draw given node on drawing area
   *
   * @protected
   * @memberof Class_NodeElement
   */
  public draw() {
    // Heritance of draw function
    super.draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_nodes')
    // Apply styles
    this.d3_selection?.style('display', this.getDisplayValue())
    this.d3_selection?.style('font-family', this.name_label_font_family)
    // Draw shape
    this.drawShape()
    // Draw label
    this.drawNameLabel()
    this.drawValueLabel()
    this.drawLinks()

  }

  public drawAsSelected() {
    this.draw()
  }

  // Styles / attributes related methods ------------------------------------------------

  public useDefaultStyle() {
    this.style = this.main_sankey.default_node_style
  }

  public resetAttributes() {
    this._display.attributes = new Class_NodeAttribute()
    this.draw()
  }

  public isAttributeOverloaded(attr: keyof Class_NodeAttribute) {
    return this._display.attributes[attr] !== undefined
  }

  public isEqual(_: Class_NodeElement) {

    if (this.shape_visible !== _.shape_visible) {
      return false
    }
    if (this.name_label_visible !== _.name_label_visible) {
      return false
    }
    if (this.shape_min_width !== _.shape_min_width) {
      return false
    }
    if (this.shape_min_height !== _.shape_min_height) {
      return false
    }
    if (this.shape_color !== _.shape_color) {
      return false
    }
    if (this.shape_type !== _.shape_type) {
      return false
    }
    if (this.shape_arrow_angle_factor !== _.shape_arrow_angle_factor) {
      return false
    }
    if (this.shape_arrow_angle_direction !== _.shape_arrow_angle_direction) {
      return false
    }
    if (this.shape_color_sustainable !== _.shape_color_sustainable) {
      return false
    }
    if (this.name_label_font_family !== _.name_label_font_family) {
      return false
    }
    if (this.name_label_font_size !== _.name_label_font_size) {
      return false
    }
    if (this.name_label_uppercase !== _.name_label_uppercase) {
      return false
    }
    if (this.name_label_bold !== _.name_label_bold) {
      return false
    }
    if (this.name_label_italic !== _.name_label_italic) {
      return false
    }
    if (this.name_label_box_width !== _.name_label_box_width) {
      return false
    }
    if (this.name_label_color !== _.name_label_color) {
      return false
    }
    if (this.name_label_vert !== _.name_label_vert) {
      return false
    }
    if (this.name_label_horiz !== _.name_label_horiz) {
      return false
    }
    if (this.name_label_background !== _.name_label_background) {
      return false
    }
    if (this.value_label_visible !== _.value_label_visible) {
      return false
    }
    if (this.value_label_vert !== _.value_label_vert) {
      return false
    }
    if (this.value_label_horiz !== _.value_label_horiz) {
      return false
    }
    if (this.value_label_font_size !== _.value_label_font_size) {
      return false
    }
    return true
  }

  /**
   * Get the width to apply on shape
   * @readonly
   * @memberof Class_NodeElement
   */
  public getShapeWidthToUse() {
    // Compute sum of thickness on each sides
    const sum_of_top_thickness = this.getSumOfLinksThickness('top')
    const sum_of_bottom_thickness = this.getSumOfLinksThickness('bottom')
    // Return max thickness
    return Math.max(sum_of_top_thickness, sum_of_bottom_thickness, this.shape_min_width)
  }

  /**
   * Get the height to apply on shape
   * @readonly
   * @memberof Class_NodeElement
   */
  public getShapeHeightToUse() {
    // Compute sum of thickness on each sides
    const sum_of_left_thickness = this.getSumOfLinksThickness('left')
    const sum_of_right_thickness = this.getSumOfLinksThickness('right')
    // Return max thickness
    return Math.max(sum_of_left_thickness, sum_of_right_thickness, this.shape_min_height)
  }

  // Nodes tags related methods ----------------------------------------------------------

  /**
   * Check if given tag is referenced by node
   * @param {Class_Tag} tag
   * @return {*}
   * @memberof Class_LinkElement
   */
  public hasGivenTag(tag: Class_Tag) {
    return (this._tags[tag.id] !== undefined)
  }

  /**
   * Add and cross-reference a Tag with node
   * @param {Class_Tag} tag
   * @memberof Class_LinkElement
   */
  public addTag(tag: Class_Tag) {
    if (!this.hasGivenTag(tag)) {
      this._tags[tag.id] = tag
      tag.addReference(this)
      this.draw()
    }
  }

  /**
   * Remove tag and its cross-reference from node
   *
   * @param {Class_Tag} tag
   * @memberof Class_NodeElement
   */
  public removeTag(tag: Class_Tag) {
    if (this.hasGivenTag(tag)) {
      delete this._tags[tag.id]
      tag.removeReference(this)
      this.draw()
    }
  }

  // Level tags related methods ---------------------------------------------------------

  /**
   * Check if given level tag is referenced by node
   * @param {Class_Tag} tag
   * @return {*}
   * @memberof Class_LinkElement
   */
  public hasGivenLevelTag(tag: Class_LevelTag) {
    return (this.level_tags_dict[tag.id] !== undefined)
  }

  public addNewDimensionAsParent(_: Class_NodeDimension) {
    if (
      (!_.children.includes(this)) &&
      (!this._dimensions_as_parent[_.id])
    ) {
      this._dimensions_as_parent[_.id] = _
      _.parent = this
    }
  }

  public addNewDimensionAsChild(_: Class_NodeDimension) {
    if (
      (_.parent !== this) &&
      (!this._dimensions_as_child[_.id])
    ) {
      this._dimensions_as_child[_.id] = _
      _.addNodeAsChild(this)
    }
  }

  public removeDimensionAsParent(_: Class_NodeDimension) {
    if (this._dimensions_as_parent[_.id]) {
      delete this._dimensions_as_parent[_.id]
      _.removeNodeAsParent(this)
    }
  }

  public removeDimensionAsChild(_: Class_NodeDimension) {
    if (this._dimensions_as_child[_.id]) {
      delete this._dimensions_as_child[_.id]
      _.removeNodeFromChildren(this)
    }
  }

  public drawParent() {
    if (this.is_child) {
      Object.values(this._dimensions_as_child)[0].forceShowParent()
    }
  }

  public drawChildren() {
    if (this.is_parent) {
      Object.values(this._dimensions_as_parent)[0].forceShowChildren()
    }
  }

  // Links related methods --------------------------------------------------------------

  /**
   * Return true if this node hase at least one input link
   * @return {*}
   * @memberof Class_NodeElement
   */
  public hasInputLinks() { return (this.input_links_list.length > 0) }

  /**
   * Return true if this node hase at least one output link
   * @return {*}
   * @memberof Class_NodeElement
   */
  public hasOutputLinks() { return (this.output_links_list.length > 0) }

  /**
   * Add given link as input
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  public addInputLink(link: Class_LinkElement) {
    if (!this._input_links[link.id]) {
      this._input_links[link.id] = link
      this._links_order.push(link)
      link.target = this
      this.addMovingHandleForGivenLink(link, 'input')
      this.updateInputValue()
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  /**
   * Add given link as output
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  public addOutputLink(link: Class_LinkElement) {
    if (!this._output_links[link.id]) {
      this._output_links[link.id] = link
      this._links_order.push(link)
      link.source = this
      this.addMovingHandleForGivenLink(link, 'output')
      this.updateOutputValue()
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  /**
   * Remove and delete given input link if it exists
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  public deleteInputLink(link: Class_LinkElement) {
    if (this._input_links[link.id] !== undefined) {
      this.removeInputLink(link)
      link.delete()
      this.draw()
    }
  }

  /**
   * Remove and delete given output link if it exists
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  public deleteOutputLink(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      link.delete()
      this.draw()
    }
  }

  /**
   * Move given input link to a given node
   * @param {Class_LinkElement} link
   * @param {Class_NodeElement} node
   * @memberof Class_NodeElement
   */
  public swapInputLink(link: Class_LinkElement, node: Class_NodeElement) {
    if (this._input_links[link.id] !== undefined) {
      this.removeInputLink(link)
      node.addInputLink(link)
      this.updateInputValue()
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  /**
   * Move given output link to a given node
   * @param {Class_LinkElement} link
   * @param {Class_NodeElement} node
   * @memberof Class_NodeElement
   */
  public swapOutputLink(link: Class_LinkElement, node: Class_NodeElement) {
    if (this._output_links[link.id] !== undefined) {
      this.removeOutputLink(link)
      node.addOutputLink(link)
      this.updateOutputValue()
      this.drawLinks()
      this.drawValueLabel()
    }
  }

  // Get links
  public getFirstInputLink() {
    if (this.hasInputLinks()) return this.input_links_list[0] // TODO pas bon
    else return undefined
  }

  public getFirstOutputLink() {
    if (this.hasOutputLinks()) return this.output_links_list[0] // TODO pas bon
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

  /**
   * Get list of link in order for a given side
   * @param {Type_Side} _
   * @return {*}
   * @memberof Class_NodeElement
   */
  public getLinksOrdered(_: Type_Side) {
    return this._links_order.filter(link => {
      return (
        (link.target === this && link.target_side === _) ||
        (link.source === this && link.source_side === _))
    })
  }

  /**
   * Function to reorganize links_order depending of source/target position
   *
   * @memberof Class_NodeElement
   */
  public reorganizeIOLinks() {
    this._links_order = this._links_order
      .sort((link_a, link_b) =>
        sortLinksElementsByRelativeNodesPositions(link_a, link_b, this))
    this.draw()
  }

  /**
   * Place first link just before target link
   *
   * @param {Class_LinkElement} link_to_move
   * @param {Class_LinkElement} link_target_pos
   * @memberof Class_NodeElement
   */
  public moveLinkToPositionInOrderBefore(
    link_to_move: Class_LinkElement,
    link_target_pos: Class_LinkElement
  ) {
    // Check we don't try to swap 2 links that aren"t connected to the same node
    if (
      this._links_order.includes(link_to_move) &&
      this._links_order.includes(link_target_pos)
    ) {
      // Remove link to move from the array of link order
      const idx_link_to_move = this._links_order.indexOf(link_to_move)
      this._links_order.splice(idx_link_to_move, 1)
      // Get the position in link order of the link we want the first link to move to
      const idx_link_trgt = this._links_order.indexOf(link_target_pos)
      // Add the link before the link target in the order array
      this._links_order.splice(idx_link_trgt, 0, link_to_move)
      // Redraw
      this.draw()
    }
  }

  /**
   * Place first link just after target link
   *
   * @param {Class_LinkElement} link_to_move
   * @param {Class_LinkElement} link_target_pos
   * @memberof Class_NodeElement
   */
  public moveLinkToPositionInOrderAfter(
    link_to_move: Class_LinkElement,
    link_target_pos: Class_LinkElement
  ) {
    // Check we don't try to swap 2 links that aren"t connected to the same node
    if (
      this._links_order.includes(link_to_move) &&
      this._links_order.includes(link_target_pos)
    ) {
      // Remove link to move from the array of link order
      const idx_link_to_move = this._links_order.indexOf(link_to_move)
      this._links_order.splice(idx_link_to_move, 1)
      // Get the position in link order of the link we want the first link to move to
      const idx_link_trgt = this._links_order.indexOf(link_target_pos)
      // Add the link after the link target in the order array
      this._links_order.splice(idx_link_trgt + 1, 0, link_to_move)
      // Redraw
      this.draw()
    }
  }

  // Values related methods -------------------------------------------------------------

  /**
   * Recompute the sum of all input links' value
   * @memberof Class_NodeElement
   */
  public updateInputValue() {
    this._input_data_value = 0
    this.input_links_list.forEach(link => {
      const data_value = link.data_value
      if (data_value !== null)
        this._input_data_value = this._input_data_value + data_value
    })
    this.draw()
  }

  /**
   * Recompute the sum of all output links' value
   * @memberof Class_NodeElement
   */
  public updateOutputValue() {
    this._output_data_value = 0
    this.output_links_list.forEach(link => {
      const data_value = link.data_value
      if (data_value !== null)
        this._output_data_value = this._output_data_value + data_value
    })
    this.draw()
  }

  /**
   * Hide the name label of the node & set visible the input to modify it
   * @memberof Class_NodeElement
   */
  public setInputLabelVisible() {
    this.d3_selection?.select('.name_label_text').style('display', 'none')
    this.d3_selection?.select('.name_label_fo_input').style('display', 'inline-block')
    document.getElementById('name_label_input_' + this.id)?.focus()
  }

  /**
   * Hide the input label of the node & set visible the name
   * @memberof Class_NodeElement
   */
  public setInputLabelInvisible() {
    this.d3_selection?.select('.name_label_fo_input').style('display', 'none')
    this.d3_selection?.select('.name_label_text').style('display', 'inline-block')
    this.drawNameLabel()
  }

  // JSON files read / write related methods --------------------------------------------

  /**
   * Convert node to JSON
   *
   *
   * @return {*}
   * @memberof Class_NodeElement
   */
  public toJSON() {
    // Extract root attributes
    const json_object = super.toJSON()
    json_object['name'] = this._name
    // Fill displaying values
    json_object['position'] = this.position_type
    json_object['x'] = this.position_x
    json_object['y'] = this.position_y
    if (this._display.position_x_label) json_object['x_label'] = this._display.position_x_label
    if (this._display.position_y_label) json_object['y_label'] = this._display.position_y_label
    // Fill style & local attributes
    json_object['style'] = this.style.id
    json_object['local'] = this._display.attributes.toJSON()
    // Tooltip
    if (this._tooltip_text) json_object['tooltip_text'] = this._tooltip_text
    // Tags
    json_object['tags'] = Object.fromEntries(
      this.taggs_list
        .map(tagg => [
          tagg.id,
          this.tags_list
            .filter(tag => (tag.group === tagg))
            .map(tag => tag.id)
        ])
    )
    // Dimension
    json_object['dimensions'] = Object.fromEntries(
      Object.values(this._dimensions_as_child)
        .map(dimension => [
          dimension.parent_level_tag.group.id,
          {
            'parent_name': dimension.parent.id,
            'parent_tag': dimension.parent_level_tag.id,
            'child_tags': dimension.children_level_tags.map(_ => _.id),
            'level': dimension.getLevel()
          }
        ])
    )
    // Links
    json_object['inputLinksId'] = this.input_links_list.map(l => l.id)
    json_object['outputLinksId'] = this.output_links_list.map(l => l.id)
    json_object['links_order'] = this._links_order.map(link => link.id)
    // Return
    return json_object
  }

  /**
   * Assign to node implementation values from json,
   * Does not assign links -> need to read links from JSON before
   *
   * @param {Type_JSON} json_node_object
   * @memberof Class_NodeElement
   */
  public fromJSON(
    json_node_object: Type_JSON,
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    // Get root attributes
    super.fromJSON(json_node_object)
    this._name = getStringFromJSON(json_node_object, 'name', this._name)
    // Update displaying values
    this._display.position.type = getStringFromJSON(json_node_object, 'position', this._display.position.type) as Type_Position
    this._display.position.x = getNumberFromJSON(json_node_object, 'x', this._display.position.x)
    this._display.position.y = getNumberFromJSON(json_node_object, 'y', this._display.position.y)
    this._display.position_x_label = getNumberOrUndefinedFromJSON(json_node_object, 'x_label')
    this._display.position_y_label = getNumberOrUndefinedFromJSON(json_node_object, 'y_label')
    // Update style & local attributes
    const style_id = getStringFromJSON(json_node_object, 'style', default_style_id)
    this._display.style = this.main_sankey.node_styles_dict[style_id]
    const json_local_object = getJSONOrUndefinedFromJSON(json_node_object, 'local')
    if (json_local_object) {
      this._display.attributes.fromJSON(json_local_object)
    }
    // Tooltip
    this._tooltip_text = getStringFromJSON(json_node_object, 'tooltip_text', '')
    // Node Tags
    //   In JSON here are how supposed tags var is :
    //   tags:{key_grp_tag:string[] (key_tag_selected) }
    //   where 'key_grp_tag' represent the id of a node_taggs group
    //   &  'key_tag_selected' represent the array of id of tag selected for that node_taggs group
    Object.entries(json_node_object['tags'] ?? {})
      .filter(([_tagg_id, _tag_ids]) => {
        const tagg_id = matching_taggs_id[_tagg_id] ?? _tagg_id
        const tag_ids = (_tag_ids as string[]).map(_ => matching_tags_id[_tagg_id][_] ?? _)
        return (
          (tagg_id in this.main_sankey.node_taggs_dict) &&
          ((tag_ids as string[]).length > 0)
        )
      })
      .forEach(([_tagg_id, _tag_ids]) => {
        const tagg_id = matching_taggs_id[_tagg_id] ?? _tagg_id
        const tag_ids = (_tag_ids as string[]).map(_ => matching_tags_id[_tagg_id][_] ?? _)
        const tagg = this.main_sankey.node_taggs_dict[tagg_id]
        tagg.tags_list
          .filter(tag => tag_ids.includes(tag.id))
          .forEach(tag => this.addTag(tag))
      })
  }

  /**
   * When reading JSON, we must wait for all links to be created in ordre
   * to correctly set input & output link for each nodes
   * @param {Type_JSON} json_node_object
   * @memberof Class_NodeElement
   */
  public linksFromJSON(
    json_node_object: Type_JSON,
    matching_links_id: { [_: string]: string } = {}
  ) {
    // Input links
    const input_link_ids = getStringListFromJSON(json_node_object, 'inputLinksId', [])
    input_link_ids
      .forEach(_ => {
        const link_id = matching_links_id[_] ?? _
        this.addInputLink(this.main_sankey.links_dict[link_id])
      })
    // Output links
    const output_link_ids = getStringListFromJSON(json_node_object, 'outputLinksId', [])
    output_link_ids
      .forEach(_ => {
        const link_id = matching_links_id[_] ?? _
        this.addOutputLink(this.main_sankey.links_dict[link_id])
      })
    // Ordering
    const ordered_link_ids = getStringListFromJSON(json_node_object, 'links_order', [])
    if (ordered_link_ids.length === this._links_order.length) { // Avoid creation of loose links on node
      this._links_order = ordered_link_ids
        .map(_ => {
          const link_id = matching_links_id[_] ?? _
          return this.main_sankey.links_dict[link_id]
        })
    }
  }

  /**
   * When reading JSON, we must wait for all nodes to be created in order
   * to correctly set dimensions for each nodes
   * @param {Type_JSON} json_node_object
   * @memberof Class_NodeElement
   */
  public dimensionsFromJSON(
    json_node_object: Type_JSON,
    matching_nodes_id: { [_: string]: string } = {},
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    // Extract dimensions JSON struct from node JSON Struct
    const dimensions_as_JSON = getJSONOrUndefinedFromJSON(json_node_object, 'dimensions')
    // For each dimension in dimensions JSON Struct, create the parent / child relation
    if (dimensions_as_JSON) {
      Object.keys(dimensions_as_JSON)
        .forEach(_ => {
          const tagg_id = matching_taggs_id[_] ?? _
          const dimension_as_json = getJSONOrUndefinedFromJSON(dimensions_as_JSON, _)
          if (dimension_as_json) {
            // Get level tag group from id
            const tagg = this.main_sankey.level_taggs_dict[tagg_id]
            // Continue only in level tag group exists
            if (tagg) {
              // Continue only if we can find related parent
              let parent_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_name')
              if (parent_id) {
                parent_id = matching_nodes_id[parent_id] ?? parent_id
                const parent = this.main_sankey.nodes_dict[parent_id]
                if (parent) {
                  // Read infos from dimension json struct
                  // Get child & parent tags
                  let child_tags: Class_LevelTag[] | undefined
                  let parent_tag: Class_LevelTag | undefined
                  // Use tags id in priority if existing
                  const child_tags_ids = getStringListOrUndefinedFromJSON(dimension_as_json, 'child_tags')
                  const parent_tag_id = getStringOrUndefinedFromJSON(dimension_as_json, 'parent_tag')
                  if (child_tags_ids && parent_tag_id) {
                    child_tags = child_tags_ids
                      .map(_ => {
                        const child_tag_id = matching_tags_id[tagg_id][_] ?? _
                        return tagg.tags_dict[child_tag_id]
                      })
                    parent_tag = tagg.tags_dict[(matching_tags_id[tagg_id][parent_tag_id] ?? parent_tag_id)]
                  }
                  // If no tags ids - use level to find matchin tags
                  else {
                    const level = getNumberOrUndefinedFromJSON(dimension_as_json, 'level')
                    if (level && level > 1) {
                      // Careful here : levels start from 1
                      child_tags = [tagg.tags_list[level - 1]]
                      parent_tag = tagg.tags_list[level - 2]
                    }
                  }
                  // If tags has been found,
                  // create a new dimension OR add parent & child relation to an existing dimension
                  if (child_tags && parent_tag) {
                    parent_tag.getOrCreateLowerDimension(parent, this, child_tags)
                  }
                }
              }
            }

          }
        })
    }
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Apply node position to it shape in d3
   * @protected
   * @return {*}
   * @memberof Class_Node
   */
  protected applyPosition() {
    if (this.d3_selection !== null) {
      // Default positions
      let x = this.position_x
      let y = this.position_y
      // Deal with import / export nodes
      if (this.position_type === 'relative') {
        if (this.hasInputLinks()) {
          // Node is export
          const input_link = this.getFirstInputLink()
          // if (!input_link?.display.shape_type.getVisible()) {
          //   return 'translate(0, 0)'
          // }

          // use '!.source' because linter think it input_link can be undefined but we verified with hasInputLinks()
          const source_node = input_link!.source
          // if (!source_node.display.shape_type.getVisible()) {
          if (!source_node.shape_visible) {
            return 'translate(0, 0)'
          }
          x = source_node.position_x + this.position_x
          y = source_node.position_y + this.position_y
        }
        else if (this.hasOutputLinks()) {
          // Node is import
          const output_link = this.getFirstOutputLink()
          // if (!output_link?.display.shape_type.getVisible()) {
          //   return 'translate(0,0)'
          // }

          // use '!.target' because linter think it outputlink can be undefined but we verified with hasOutputLinks()
          const target_node = output_link!.target
          if (!target_node.shape_visible) {
            return 'translate(0,0)'
          }
          x = target_node.position_x + this.position_x
          y = target_node.position_y + this.position_y
        }
      }
      this.d3_selection.attr('transform', 'translate(' + x + ', ' + y + ')')
    }
    // Update also position for links
    this.drawLinks()
  }

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Node
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventSimpleLMBCLick(event)
    // Get related drawing area
    const drawing_area = this.drawing_area
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.application_data.menu_configuration.CloseConfigMenu()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode() && event.button === 0) {
      // SHIFT
      if (event.shiftKey) {
        // Add node to selection
        drawing_area.addNodeToSelection(this)
        // Open related menu
        this.menu_config.OpenConfigMenuElementsNodes()
        // Update components related to node edition
        this.menu_config.updateAllComponentsRelatedToNodes()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add node to selection
        drawing_area.addNodeToSelection(this)
        // Update components related to node edition
        this.menu_config.updateAllComponentsRelatedToNodes()
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add node to selection
        drawing_area.addNodeToSelection(this)
      }
    }
  }

  /**
   * Define event when mouse drag element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    // Apply parent behavior first
    super.eventMouseDrag(event)
    // Get related drawing area
    const drawing_area = this.drawing_area
    const nodes_selected = drawing_area.selected_nodes_list

    if (nodes_selected.length == 0) {
      if (drawing_area.isInSelectionMode()) {
        this.setPosXY(this.position_x + event.dx, this.position_y + event.dy)
        this.drawing_area.checkAndUpdateAreaSize()
      }
    } else if (nodes_selected.includes(this)) { // Only trigger the drag if we drag a selected node
      // EDITION MODE ===========================================================
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        // Update node position
        nodes_selected
          .forEach(n => {
            n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
          })
        this.drawing_area.checkAndUpdateAreaSize()
      }
    }
  }

  protected eventMouseDragEnd(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // Apply parent behavior first
    super.eventMouseDragEnd(event)
    // Get related elements in drawing area
    const drawing_area = this.drawing_area
    const nodes_selected = drawing_area.selected_nodes_list
    // Only trigger the drag if we drag a selected node
    if (nodes_selected.includes(this)) {
      // EDITION MODE ===========================================================
      if (drawing_area.isInEditionMode() && nodes_selected.length > 0) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // redraw node on target of output links
        nodes_selected
          .forEach(n => {
            n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
            n.output_links_list.forEach(link => {
              link.target.applyPosition()
            })
          })
        this.drawing_area.checkAndUpdateAreaSize()
      }
    }
  }

  /**
   *
   *
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_NodeElement
   */
  protected eventMaintainedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMaintainedClick(event)
    // EDITION MODE =============================================================
    // event.button==0 check if we use LMB
    if (this.drawing_area.isInEditionMode() && event.button == 0) {
      // Get mouse position
      // Create default source node
      // Position center of source node to pointer pos
      // Create default target node
      const target = this.main_sankey.addNewDefaultNode()
      target.setPosXY(this.position_x, this.position_y)
      // Make target a 'ghost' node
      target.setInvisible()
      // Ref newly created link this var to be used in other mouse event
      this.drawing_area.ghost_link = new Class_GhostLinkElement(
        'ghost_link',
        this,
        target,
        this.drawing_area, this.menu_config)
    }
  }

  protected eventSimpleRMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventSimpleRMBCLick(event)
    // SELECTION MODE =========================================================
    if (this.drawing_area.isInSelectionMode()) {
      event.preventDefault()
      this.drawing_area.pointer_pos = [event.pageX, event.pageY]
      if (!this.drawing_area.selected_nodes_list.includes(this)) {
        this.drawing_area.addNodeToSelection(this)
      }
      this.menu_config.updateAllComponentsRelatedToNodes()
      this.drawing_area.node_contextualised = this
      this.menu_config.ref_to_menu_context_nodes_updater.current()
    }
  }

  /**
   * Define event when mouse moves over element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseOver(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMouseOver(event)
    // ALT
    if (event.altKey) {
      // Show tooltip
      this.drawTooltip()
    }
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw node shape on d3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawShape() {
    // Clean previous shape
    this.d3_selection?.selectAll('.node_shape').remove()
    // Do the rest only if shape is visible
    if (this.shape_visible) {
      // Compute shape attributes
      const width = this.getShapeWidthToUse()
      const height = this.getShapeHeightToUse()
      const color = this.getShapeColorToUse()
      // Apply shape value
      if (this.shape_type === 'rect') {
        this.d3_selection?.append('rect')
          .classed('node', true)
          .classed('node_shape', true)
          .attr('width', width)
          .attr('height', height)
      }
      else if (this.shape_type === 'ellipse') {
        this.d3_selection?.append('ellipse')
          .classed('node', true)
          .classed('node_shape', true)
          .attr('cx', width / 2)
          .attr('cy', height / 2)
          .attr('rx', width / 2)
          .attr('ry', height / 2)
      }
      else if (this.shape_type === 'arrow') {
        this.d3_selection?.append('path')
          .classed('node', true)
          .classed('node_shape', true)
          .attr('d', this.getArrowPath())
      }
      // Apply common properties
      this.d3_selection?.selectAll('.node_shape')
        .attr('id', this.id)
        .attr('fill-opacity', this.shape_visible ? '1' : '0')
        .attr('fill', color)
        .style('stroke', 'black')
        .style('stroke-width', this.is_selected ? default_selected_stroke_width : 0)
    }
  }

  /**
   * Draw node label on D3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawNameLabel() {
    // Clean previous label
    this.d3_selection?.selectAll('.name_label').remove()
    // Add name label
    if (this.name_label_visible) {
      // Box position is set by label position. For text / shape ref point is not the same
      // - Text : ref point is bottom of text + right/middle/left depending on anchor
      // - Shape : ref point if top-left corner
      const box_width = Math.min(
        this.name_label.length * this.name_label_font_size,
        this.name_label_box_width)
      const box_height = this.name_label_font_size

      // Add name label background
      if (this.name_label_background) {
        this.d3_selection?.append('rect')
          .classed('name_label', true)
          .classed('name_label_background', true)
          .attr('id', 'name_label_background_' + this.id)
          .attr('width', box_width)
          .attr('height', box_height)
          .attr('fill', 'white')
          .attr('fill-opacity', 0.55)
          .attr('rx', 4)
          .style('stroke', 'none')
      }
      // Add name label text
      const wrapper = textwrap()
        .bounds({ height: 100, width: this.name_label_box_width })
        .method('tspans')

      const label_text = this.d3_selection?.append('text')
        .classed('name_label', true)
        .classed('name_label_text', true)
        .attr('fill', this.name_label_color ? 'white' : 'black')
        .attr('id', 'name_label_text_' + this.id)
        .style('font-weight', this.name_label_bold ? 'bold' : 'normal')
        .style('font-style', this.name_label_italic ? 'italic' : 'normal')
        .style('font-size', String(this.name_label_font_size) + 'px')
        .style('font-family', this.name_label_font_family)
        .style('stroke', 'none')
        .style('text-transform', this.name_label_uppercase ? 'uppercase' : 'none')
        .text(this.name_label)
        .call(wrapper)

      // Position label & return it coord_x, coord_y & it text anchor for use in other element (label bg, label fo)
      const [label_pos_x, label_pos_y, label_anchor] = this.updateNameLabelPos()

      let box_pos_x = label_pos_x
      const box_pos_y = label_pos_y - this.name_label_font_size
      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      }
      else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width / 2
      }

      if (this.name_label_background) {
        // Update label bg with computed label size
        this.d3_selection?.select('.name_label_background')
          .attr('x', box_pos_x)
          .attr('y', box_pos_y)
      }

      // Add an input to change the name of the node
      // The input appear when we double click on the label
      if (!this.drawing_area.static) {
        this.d3_selection?.append('foreignObject')
          .classed('name_label', true)
          .classed('name_label_fo_input', true)
          .attr('x', box_pos_x)
          .attr('y', box_pos_y)
          .attr('width', box_width)
          .attr('height', box_height + 2)
          .style('display', 'none')
          .append('xhtml:div')
          .append('input')
          .classed('name_label', true)
          .classed('name_label_input', true)
          .attr('id', 'name_label_input_' + this.id)
          .attr('type', 'text')
          .attr('value', this._name)
          .style('font-size', String(this.name_label_font_size) + 'px')
          .on('input', (evt) => { this._name = evt.target.value })
          .on('blur', () => this.setInputLabelInvisible())



        label_text?.call(d3.drag<SVGTextElement, this>()
          .filter(evt => (evt.which == 1) && this.drawing_area.isInSelectionMode()) // only trigger drag when LMB drag & DA is in mode selection
          .on('start', ev => this.dragTextStart(ev))
          .on('drag', ev => this.dragTextMove(ev))
          .on('end', ev => this.dragTextend(ev))
        )

      }
    }
  }

  /**
   * Function triggered when we start dragging node name label, it initialise relative position if undefined
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,Class_NodeElement,Class_NodeElement>} event
   * @memberof Class_NodeElement
   */
  private dragTextStart(_event: d3.D3DragEvent<SVGTextElement, Class_NodeElement, Class_NodeElement>) {

    //if position_x_label is undefined init position_x_label pos whith current fixed x position value
    if (this._display.position_x_label === undefined) {
      const shape_width = this.getShapeWidthToUse()
      const label_pos_dx = this.is_selected ? default_selected_stroke_width : 0

      let label_pos_x = shape_width + label_pos_dx
      if (this.name_label_horiz === 'left') { label_pos_x = -label_pos_dx }
      else if (this.name_label_horiz === 'middle') { label_pos_x = shape_width / 2 }

      this._display.position_x_label = label_pos_x
    }

    //if position_y_label is undefined init position_y_label pos whith current fixed y position value
    if (this._display.position_y_label === undefined) {
      const shape_height = this.getShapeHeightToUse()
      const label_pos_dy = this.is_selected ? default_selected_stroke_width : 0

      let label_pos_y = label_pos_dy + shape_height
      if (this.name_label_vert === 'top') { label_pos_y = -label_pos_dy }
      else if (this.name_label_vert === 'middle') { label_pos_y = shape_height / 2 }

      this._display.position_y_label = label_pos_y
    }

    this.name_label_horiz = 'dragged'
    this.name_label_vert = 'dragged'

  }

  /**
   *Function triggered when we move the node name label, it update relative node position & redraw the name slabel
   *
   * @private
   * @param {d3.D3DragEvent<SVGTextElement,Class_NodeElement,Class_NodeElement>} event
   * @memberof Class_NodeElement
   */
  private dragTextMove(event: d3.D3DragEvent<SVGTextElement, Class_NodeElement, Class_NodeElement>) {

    this._display.position_x_label = ((this._display.position_x_label !== undefined) ? this._display.position_x_label : 0) + event.dx // there is a security that check if label relative pos is not undefind, if so it use 0 but shouldn't be triggered since we initialize value in dragTextStart
    this._display.position_y_label = ((this._display.position_y_label !== undefined) ? this._display.position_y_label : 0) + event.dy // there is a security that check if label relative pos is not undefind, if so it use 0 but shouldn't be triggered since we initialize value in dragTextStart

    this.updateNameLabelPos()
  }

  private dragTextend(_event: d3.D3DragEvent<SVGTextElement, Class_NodeElement, Class_NodeElement>) {
    this.drawNameLabel()
    this.menu_config.updateAllComponentsRelatedToNodes()
  }

  /**
   *  Function that update name label position & return var used for drawNameLabel()
   *
   * @private
   * @return {*}  {[number, number, string]}
   * @memberof Class_NodeElement
   */
  private updateNameLabelPos(): [number, number, string] {
    // x position
    let label_anchor = 'start'
    let label_align = 'start'
    let label_pos_x = 0
    if (this._display.position_x_label !== undefined) {
      label_pos_x = (this._display.position_x_label !== undefined) ? this._display.position_x_label : 0
      label_anchor = 'middle'
      label_align = 'center'
    } else {
      const shape_width = this.getShapeWidthToUse()
      const label_pos_dx = this.is_selected ? default_selected_stroke_width : 0
      label_pos_x = shape_width + label_pos_dx
      if (this.name_label_horiz === 'left') {
        label_pos_x = -label_pos_dx
        label_anchor = 'end'
        label_align = 'end'
      }
      else if (this.name_label_horiz === 'middle') {
        label_pos_x = shape_width / 2
        label_anchor = 'middle'
        label_align = 'center'
      }
    }

    // y position
    const label_pos_dy = this.is_selected ? default_selected_stroke_width : 0
    const shape_height = this.getShapeHeightToUse()

    let label_pos_y = label_pos_dy + shape_height
    let label_baseline = 'text-before-edge'
    if (this._display.position_y_label! != undefined) {
      label_pos_y = (this._display.position_y_label !== undefined) ? this._display.position_y_label : 0
      label_baseline = 'middle'
    } else {
      if (this.name_label_vert === 'top') {
        label_pos_y = -label_pos_dy
        label_baseline = 'text-after-edge'
      }
      else if (this.name_label_vert === 'middle') {
        label_pos_y = shape_height / 2
        label_baseline = 'middle'
      }
    }

    this.d3_selection?.select('.name_label_text')
      .attr('x', label_pos_x)
      .attr('y', label_pos_y)
      .attr('dominant-baseline', label_baseline)
      .attr('text-anchor', label_anchor)
      .style('text-align', label_align)

    return [label_pos_x, label_pos_y, label_anchor]
  }

  /**
   * Draw node label on D3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawValueLabel() {
    // Clean previous label
    this.d3_selection?.selectAll('.value_label').remove()
    // Add name label
    if (this.value_label_visible) {
      // Get variable property for node label
      const shape_width = this.getShapeWidthToUse()
      const shape_height = this.getShapeHeightToUse()
      // Label X position is set by text relative position / shape + text anchor
      let label_pos_x = shape_width
      let label_anchor = 'start'
      let label_align = 'start'
      if (this.value_label_horiz === 'left') {
        label_pos_x = 0
        label_anchor = 'end'
        label_align = 'end'
      }
      else if (this.value_label_horiz === 'middle') {
        label_pos_x = shape_width / 2
        label_anchor = 'middle'
        label_align = 'center'
      }
      // Label Y position is only set by text relative position / shape
      const label_pos_dy = this.is_selected ? default_selected_stroke_width : 0
      let label_pos_y = label_pos_dy + shape_height + this.value_label_font_size
      if (this.value_label_vert === 'top') {
        label_pos_y = -label_pos_dy
      }
      else if (this.value_label_vert === 'middle') {
        label_pos_y = (shape_height / 2) + (this.value_label_font_size / 2)
      }
      // Box position is set by label position. For text / shape ref point is not the same
      // - Text : ref point is bottom of text + right/middle/left depending on anchor
      // - Shape : ref point if top-left corner
      const box_width = this.value_label.length * this.value_label_font_size
      const box_height = this.value_label_font_size
      const box_pos_y = label_pos_y - this.value_label_font_size
      let box_pos_x = label_pos_x
      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      }
      else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width / 2
      }
      // Add name label background
      if (this.value_label_background) {
        this.d3_selection?.append('rect')
          .classed('value_label', true)
          .classed('value_label_background', true)
          .attr('id', 'value_label_background_' + this.id)
          .attr('x', box_pos_x)
          .attr('y', box_pos_y)
          .attr('width', box_width)
          .attr('height', box_height)
          .attr('fill', 'white')
          .attr('fill-opacity', 0.55)
          .attr('rx', 4)
          .style('stroke', 'none')
      }
      // Add name label text
      this.d3_selection?.append('text')
        .classed('value_label', true)
        .classed('value_label_text', true)
        .attr('fill', this.value_label_color ? 'white' : 'black')
        .attr('id', 'value_label_text_' + this.id)
        .attr('x', label_pos_x)
        .attr('y', label_pos_y)
        .attr('text-anchor', label_anchor)
        .style('text-align', label_align)
        .style('font-weight', this.value_label_bold ? 'bold' : 'normal')
        .style('font-style', this.value_label_italic ? 'italic' : 'normal')
        .style('font-size', String(this.value_label_font_size) + 'px')
        .style('font-family', this.value_label_font_family)
        .style('stroke', 'none')
        .style('text-transform', this.value_label_uppercase ? 'uppercase' : 'none')
        .text(this.value_label)
    }
  }


  /**
   * Call what is necessary each time a link is modified
   * @private
   * @memberof Class_NodeElement
   */
  private drawLinks() {
    Object.values(this._input_links).filter(link => !link.is_visible).forEach(link => {
      link.draw()
      this._handle_input_links[link.id].draw()
    })
    Object.values(this._output_links).filter(link => !link.is_visible).forEach(link => {
      link.draw()
      this._handle_output_links[link.id].draw()
    })
    this.drawShape()  // Node shape can be modified by link's changes
    this.applyPositionOnLinks()  // Links positions can be modified by link's changes
  }

  /**
   * Function that draw all the arrow of link visible linked to this node (if the link have shape_is_arrow at true)
   *
   * @private
   * @memberof Class_NodeElement
   */
  public drawLinksArrow() {

    const list_link_to_add_arrow = this.input_links_list.map(link => {
      link.d3_selection?.select('.link_arrow').remove()
      return link
    }).filter(link => {
      return link.is_visible
        && link.shape_is_arrow
        && link.d3_selection !== undefined
    })

    let cum_v_left = 0
    let cum_h_top = 0
    let cum_v_right = 0
    let cum_h_bottom = 0
    const node_height = this.getShapeHeightToUse() // height of node taking into account link size in/out
    const node_width = this.getShapeWidthToUse() // width of node taking into account link size in/out
    const node_shape = this.shape_type
    // const is_exportation_node = false // TODO Maybe useful when MFA will be implemented

    const sumLinkLeft = this.getSumOfLinksThickness('left')
    const sumLinkRight = this.getSumOfLinksThickness('right')
    const sumLinkTop = this.getSumOfLinksThickness('top')
    const sumLinkBottom = this.getSumOfLinksThickness('bottom')


    list_link_to_add_arrow.forEach(link => {

      // Some variable parameters for arrow
      const arrow_length = link.shape_arrow_size
      const link_color = link.getPathColorToUse()
      let node_arrow_shift = 0
      let arrows_adjustment = 0

      // Get side of target node from which arrow as to be drawn
      const link_arrow_side_right = link.target_side == 'right'
      const link_arrow_side_left = link.target_side == 'left'
      const link_arrow_side_top = link.target_side == 'top'
      const link_arrow_side_bottom = link.target_side == 'bottom'

      const link_direction_same_as_node_arrow = link_arrow_side_right || link_arrow_side_left || link_arrow_side_top || link_arrow_side_bottom

      // Thicknen of the link influence arrow size
      const link_value = link.thickness

      // If the node target is in arrow shape then we have to modify some variable beforehand
      if (node_shape === 'arrow') {
        const node_angle_direction = this.shape_arrow_angle_direction
        const node_angle_factor = this.shape_arrow_angle_factor
        if (link_direction_same_as_node_arrow) {
          // If the incoming link go in the same direction as the node shaped as arrow then we 'imbricate' the link arrow in the node angle
          let node_face_size = Math.max(sumLinkLeft, sumLinkRight)
          switch (node_angle_direction) {
          case 'left':
            node_face_size = Math.max(sumLinkLeft, sumLinkRight)
            break
          case 'top':
            node_face_size = sumLinkBottom
            break
          case 'bottom':
            node_face_size = sumLinkTop
            break
          }
          node_arrow_shift = Math.tan(node_angle_factor * Math.PI / 180) * (node_face_size / 2)

          let node_face_size2 = sumLinkLeft
          switch (node_angle_direction) {
          case 'left':
            node_face_size2 = sumLinkRight
            break
          case 'top':
            node_face_size2 = sumLinkBottom
            break
          case 'bottom':
            node_face_size2 = sumLinkTop
            break
          }
          arrows_adjustment = Math.tan(node_angle_factor * Math.PI / 180) * (node_face_size2 / 2)
          arrows_adjustment = node_arrow_shift - arrows_adjustment
        }
      }

      link.d3_selection?.append('path')
        .attr('class', 'link_arrow')
        .attr('d', () => {

          let xt: number = 0 // x coord where link path end
          let yt: number = 0 // y coord where link path end
          let current_cumul_of_side = 0 // sum of link thickness we already draw a arrow on , for this side of the node
          let total_cumul_of_side = 0 // Maximum sum of link thickness, for this side of the node

          if (link_arrow_side_left) {
            xt = +this.position_x
            yt = +this.position_y + node_height / 2
            current_cumul_of_side = cum_v_left
            total_cumul_of_side = sumLinkLeft

          } else if (link_arrow_side_right) {
            xt = +this.position_x + node_width
            yt = +this.position_y + node_height / 2
            current_cumul_of_side = cum_v_right
            total_cumul_of_side = sumLinkRight

          } else if (link_arrow_side_top) {
            xt = +this.position_x + node_width / 2
            yt = +this.position_y
            current_cumul_of_side = cum_h_top
            total_cumul_of_side = sumLinkTop

          } else if (link_arrow_side_bottom) {
            xt = +this.position_x + node_width / 2
            yt = +this.position_y + node_height
            current_cumul_of_side = cum_h_bottom
            total_cumul_of_side = sumLinkBottom
          }

          const p5 = [xt, yt] // Starting point of arrow

          // Some variables parameters influencing arrow shape processing
          const is_horizontal_at_target = link.is_horizontal || link.is_vertical_horizontal
          const is_revert = (is_horizontal_at_target && link_arrow_side_right) || (!is_horizontal_at_target && link_arrow_side_bottom)

          return SankeyShapes.draw_arrow_part(
            total_cumul_of_side / 2,
            p5,
            +link_value,
            current_cumul_of_side,
            is_horizontal_at_target,
            is_revert,
            arrow_length,
            node_arrow_shift,
            arrows_adjustment,
            node_shape === 'arrow'
          )

        })
        .attr('fill', link_color)
        .attr('fill-opacity', link.shape_opacity)
        .attr('stroke', link_color)
        .attr('stroke-width', 0.1)

      // Increment side cumul of drawn arrow to influence next arrow starting position
      if (link_arrow_side_left) {
        cum_v_left += link_value
      } else if (link_arrow_side_right) {
        cum_v_right += link_value
      } else if (link_arrow_side_top) {
        cum_h_top += link_value
      } else if (link_arrow_side_bottom) {
        cum_h_bottom += link_value
      }
    })

  }

  private getArrowPath() {
    // Compute height & width
    const width = this.getShapeWidthToUse()
    const height = this.getShapeHeightToUse()
    // Svg path to construct
    let path = ''
    // Arrow toward the right side
    if (this.shape_arrow_angle_direction === 'right') {
      const opp = Math.tan(this.shape_arrow_angle_factor * Math.PI / 180) * (height / 2)
      const p0: string = '0,0'
      const p1: string = (width - opp) + ',0'
      const p2: string = width + ',' + (height / 2)
      const p3: string = (width - opp) + ',' + height
      const p4: string = '0,' + height
      const p5: string = opp + ',' + (height / 2)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the left side
    else if (this.shape_arrow_angle_direction === 'left') {
      const opp = Math.tan((this.shape_arrow_angle_factor * Math.PI / 180)) * (height / 2)
      const p0: string = opp + ',0'
      const p1: string = width + ',0'
      const p2: string = width - opp + ',' + (height / 2)
      const p3: string = width + ',' + height
      const p4: string = opp + ',' + height
      const p5: string = '0,' + (height / 2)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the top
    else if (this.shape_arrow_angle_direction === 'top') {
      const opp = Math.tan((this.shape_arrow_angle_factor * Math.PI / 180)) * (width / 2)
      const p0: string = '0,' + opp
      const p1: string = width / 2 + ',0'
      const p2: string = width + ',' + opp
      const p3: string = width + ',' + height
      const p4: string = width / 2 + ',' + (height - opp)
      const p5: string = '0,' + height
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the bottom
    else {
      const opp = Math.tan((this.shape_arrow_angle_factor * Math.PI / 180)) * (width / 2)
      const p0: string = '0,0'
      const p1: string = (width / 2) + ',' + opp
      const p2: string = width + ',0'
      const p3: string = width + ',' + (height - opp)
      const p4: string = (width / 2) + ',' + height
      const p5: string = '0,' + (height - opp)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    return path
  }

  /**
   * Draw all related links
   * @private
   * @memberof Class_NodeElement
   */
  private applyPositionOnLinks() {
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
    // Loop on all links
    this.links_order_visible.forEach(link => {
      const thickness = link.thickness
      const handle_position_shift = 5
      // Current node is link's source
      if (link.source === this) {
        if (link.source_side === 'right') {
          link.setPosXYStartingPoint(x0 + width, y0 + dy_right + thickness / 2)
          this._handle_output_links[link.id].setPosXY(link.position_x_start + handle_position_shift, link.position_y_start)
          dy_right = dy_right + thickness
        }
        else if (link.source_side === 'left') {
          link.setPosXYStartingPoint(x0, y0 + dy_left + thickness / 2)
          this._handle_output_links[link.id].setPosXY(link.position_x_start - handle_position_shift, link.position_y_start)
          dy_left = dy_left + thickness
        }
        else if (link.source_side === 'top') {
          link.setPosXYStartingPoint(x0 + dx_top + thickness / 2, y0)
          this._handle_output_links[link.id].setPosXY(link.position_x_start, link.position_y_start - handle_position_shift)
          dx_top = dx_top + thickness
        }
        else {  // link.source_side === 'bottom'
          link.setPosXYStartingPoint(x0 + dx_bottom + thickness / 2, y0 + height)
          this._handle_output_links[link.id].setPosXY(link.position_x_start, link.position_y_start + handle_position_shift)
          dx_bottom = dx_bottom + thickness
        }

        link.target.drawLinksArrow() //redraw arrow of node target of output links visible

      }
      // Or current node is link's target
      if (link.target === this) {

        if (link.target_side === 'right') {
          link.setPosXYEndingPoint(x0 + width, y0 + dy_right + thickness / 2)
          this._handle_input_links[link.id].setPosXY(link.position_x_end + handle_position_shift, link.position_y_end)
          dy_right = dy_right + thickness
        }
        else if (link.target_side === 'left') {
          link.setPosXYEndingPoint(x0, y0 + dy_left + thickness / 2)
          this._handle_input_links[link.id].setPosXY(link.position_x_end - handle_position_shift, link.position_y_end)
          dy_left = dy_left + thickness
        }
        else if (link.target_side === 'top') {
          link.setPosXYEndingPoint(x0 + dx_top + thickness / 2, y0)
          this._handle_input_links[link.id].setPosXY(link.position_x_end, link.position_y_end - handle_position_shift)
          dx_top = dx_top + thickness
        }
        else {  // link.target_side === 'bottom'
          link.setPosXYEndingPoint(x0 + dx_bottom + thickness / 2, y0 + height)
          this._handle_input_links[link.id].setPosXY(link.position_x_end, link.position_y_end + handle_position_shift)
          dx_bottom = dx_bottom + thickness
        }
      }
    })
    this.drawLinksArrow()

  }

  /**
   * Display the tooltip on drawing area
   *
   * @private
   * @memberof Class_NodeElement
   */
  private drawTooltip() {
    // Clean previous label
    d3.selectAll('.sankey-tooltip').remove()
    d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('opacity', 1)
      .style('top', this.position_y + 'px')
      .style('left', this.position_x + 'px')
      .html(this.tooltip_html)
  }

  /**
   * Select the right color to use for this node (attribute / style / tags / ...)
   * @private
   * @return {*}
   * @memberof Class_NodeElement
   */
  private getShapeColorToUse() {
    // Default color
    let shape_color = this.shape_color
    // Is the color defined by tags
    const taggs_activated = this.taggs_list
      .filter(tagg => tagg.show_legend)
    if (
      (!this.shape_color_sustainable) &&
      (taggs_activated.length > 0)
    ) {
      const tagg_for_colormap = taggs_activated[0]
      const tags_for_colormap = this.tags_list
        .filter(tag => (tag.group === tagg_for_colormap))
        .filter(tag => tag.is_selected)
      if (tags_for_colormap.length > 0)
        shape_color = tags_for_colormap[0].color
    }
    return shape_color
  }

  // Get display value
  private getDisplayValue() {
    // On gere la visibilité directement sur gg_nodes avec un display <inline />
    // Cela permettra de mieux gérer des zooms sur les éléments visibles
    // if (HasLinksZero(data,node_element_d3)) {
    //   return 'none'
    // }
    if (this.position_type === 'relative') {
      return 'none'
    }
    return 'inline'
  }

  /**
   * For a given side, compute sum of all links thickness.
   * Helps to compute min height & width for node
   * @private
   * @param {Type_Side} side
   * @return {*}
   * @memberof Class_NodeElement
   */
  private getSumOfLinksThickness(side: Type_Side) {
    let sum = 0
    this.getLinksOrdered(side)
      .filter(link => link.is_visible)
      .forEach(link => {
        sum = sum + link.thickness
      })
    return sum
  }

  /**
   * For a given side, compute the offset to apply when positionning links
   * Helps to correctly draw links.
   * @private
   * @param {Type_Side} side
   * @return {*}
   * @memberof Class_NodeElement
   */
  private getLinksStartingPositionOffSet(side: Type_Side) {
    if (side === 'left' || side === 'right') {
      return Math.max(0, (this.getShapeHeightToUse() - this.getSumOfLinksThickness(side)) / 2)
    }
    else {
      return Math.max(0, (this.getShapeWidthToUse() - this.getSumOfLinksThickness(side)) / 2)
    }
  }

  /**
   * Remove link reference from all related attributes it this node.
   * /!\ Keep as private method. This can create dangling ref for links
   *
   * @private
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  private removeInputLink(link: Class_LinkElement) {
    this._handle_input_links[link.id]?.delete()
    delete this._handle_input_links[link.id]
    delete this._input_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  /**
   * Remove link reference from all related attributes it this node.
   * /!\ Keep as private method. This can create dangling ref for links
   * @private
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  private removeOutputLink(link: Class_LinkElement) {
    this._handle_output_links[link.id]?.delete()
    delete this._handle_output_links[link.id]
    delete this._output_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  /**
   * Remove link from ordering list
   * /!\ Keep as private method. This can create dangling ref for links
   * @private
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  private removeLinkFromOrderingLinksList(link: Class_LinkElement) {
    const idx = this._links_order.indexOf(link)
    if (idx !== undefined) {
      this._links_order.splice(idx, 1)
    }
  }

  /**
   * Create a handler element able to drag position of link
   * @private
   * @param {Class_LinkElement} link
   * @param {boolean} input
   * @memberof Class_NodeElement
   */
  private addMovingHandleForGivenLink(
    link: Class_LinkElement,
    type: 'input' | 'output'
  ) {
    const handle = new Class_Handler(
      ('handle_' + this.id + type + '_' + link.id),
      this.drawing_area,
      this.menu_config,
      this,
      this.dragStartHandlerMoveLink,
      this.dragHandlerMoveLink,
      this.dragEndHandlerMoveLink,
      {
        filled: false,
        color: '#78C2AD',
        class: 'node_io'
      },
      link
    )
    if (type === 'input')
      this._handle_input_links[link.id] = handle
    else // type === 'output'
      this._handle_output_links[link.id] = handle
  }

  /**
   * Event listener for drag start on link moving handler
   * This method will not be called inside a Class_NodeElement object,
   * but instead inside Class_Handler object
   * @private
   * @param {d3.D3DragEvent<SVGGElement, unknown, unknown>} event
   * @memberof Class_NodeElement
   */
  private dragHandlerMoveLink(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    // Since we pass this func to a Class_Handler (without executing it)
    // 'this' take the scope of the handler so we have to cast it here for compilation
    const handler = this as unknown as Class_Handler
    // Get node from the handler
    const node_ref = handler.ref_element as Class_NodeElement
    if (
      (node_ref.link_dragged) &&
      (event.dy !== 0 || event.dx !== 0)
    ) {
      // Get link currently dragged
      const link_dragged = (node_ref.link_dragged as Class_LinkElement)
      // Search if handler is for a link incoming or outcoming from the node
      const handle_src_or_trgt = (link_dragged.target === node_ref) ? 'target' : 'source'
      const dragged_side = (handle_src_or_trgt === 'target') ? link_dragged.target_side : link_dragged.source_side
      const node_ref_io = (handle_src_or_trgt === 'target') ? node_ref.input_links_list : node_ref.output_links_list

      // Create an array from links_order with only the links in or out the same side of the dragged link
      const list_links_node_side = node_ref._links_order
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
      // it will allow to swap dragged link with previous/next link coming/going on the same side (bottom/top) to the node_ref
      const is_handler_on_vert_side = (
        ((handle_src_or_trgt === 'target') && (link_dragged.is_vertical || link_dragged.is_horizontal_vertical)) ||
        ((handle_src_or_trgt === 'source') && (link_dragged.is_vertical || link_dragged.is_vertical_horizontal)))

      // Move link to the top / left
      if ((
        (move_to_the_top && is_handler_on_horiz_side) ||
        (move_to_the_left && is_handler_on_vert_side)) &&
        idx_drgd_link > 0
      ) {
        // Move dragged link before the previous link coming/going th the node
        const prev_link = list_links_node_side[idx_drgd_link - 1]
        node_ref.moveLinkToPositionInOrderBefore(link_dragged, prev_link)
      }
      // Move link to the bottom / right
      else if ((
        (!move_to_the_top && is_handler_on_horiz_side) ||
        (!move_to_the_left && is_handler_on_vert_side)) &&
        (idx_drgd_link < list_links_node_side.length - 1)
      ) {
        // Move dragged link after the next link coming/going th the node
        const next_link = list_links_node_side[idx_drgd_link + 1]
        node_ref.moveLinkToPositionInOrderAfter(link_dragged, next_link)
      }
    }
  }

  private dragStartHandlerMoveLink(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    const handler = this as unknown as Class_Handler
    const node_ref_handler = handler.ref_element as Class_NodeElement
    const link_ref = (handler.ref_element as Class_NodeElement).getLinkFromHandler(handler)
    if (link_ref && link_ref instanceof Class_LinkElement) {
      node_ref_handler.link_dragged = link_ref
    }
  }

  private dragEndHandlerMoveLink(_event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    const handler = this as unknown as Class_Handler
    const node_ref_handler = handler.ref_element as Class_NodeElement
    node_ref_handler.link_dragged = undefined
  }

  private getLinkFromHandler(handler: Class_Handler) {
    return handler.ref_element_optional
  }

  // GETTERS / SETTERS ==================================================================

  public get is_visible() {
    return (
      this.are_related_tags_selected &&
      this.is_related_level_selected &&
      this._is_visible
    )
  }

  /**
   * Get node name
   * @memberof Class_NodeElement
   */
  public get name() {
    return this._name
  }

  /**
   * Set node name
   * @memberof Class_NodeElement
   */
  public set name(_: string) {
    // TODO update id
    this._name = _
    this.drawNameLabel()
  }

  /**
   * Get node name formated as label
   * @readonly
   * @memberof Class_NodeElement
   */
  public get name_label() {
    if (this._name_label_separator !== '') {
      return this._name.split(this._name_label_separator)[0]
    }
    return this._name
  }

  /**
   * Get links order of only visible links
   *
   * @readonly
   * @memberof Class_NodeElement
   */
  public get links_order_visible() {
    return this._links_order.filter(link => link.is_visible)
  }

  // Tags related -----------------------------------------------------------------------

  /**
   * Dict as [id: tag] of tags related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get tags_dict() {
    return this._tags
  }

  /**
   * Array of tags related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get tags_list() {
    return Object.values(this._tags)
  }

  /**
   * Dict as [id: tag group] of tag groups related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get taggs_dict() {
    const taggs: { [_: string]: Class_TagGroup } = {}
    this.tags_list
      .forEach(tag => {
        if (!taggs[tag.group.id])
          taggs[tag.group.id] = tag.group
      })
    return taggs
  }

  /**
   * Array of tag groups related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get taggs_list() {
    return Object.values(this.taggs_dict)
  }

  // Level related ----------------------------------------------------------------------

  /**
   * Dict of level tags related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get level_tags_dict() {
    const level_tags_dict: { [id: string]: Class_LevelTag } = {}
    Object.values(this._dimensions_as_parent)
      .forEach(dimension => {
        level_tags_dict[dimension.parent_level_tag.id] = dimension.parent_level_tag
      })
    Object.values(this._dimensions_as_child)
      .forEach(dimension => {
        dimension.children_level_tags
          .forEach(children_level_tag => {
            level_tags_dict[children_level_tag.id] = children_level_tag
          })
      })
    return level_tags_dict
  }

  /**
   * List of level tags related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get level_tags_list() {
    return Object.values(this.level_tags_dict)
  }

  /**
   * Dict of level taggs related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get level_taggs_dict() {
    const level_taggs_dict: { [id: string]: Class_LevelTagGroup } = {}
    this.level_tags_list
      .forEach(tag => { level_taggs_dict[tag.group.id] = tag.group })
    return level_taggs_dict
  }

  /**
   * List of level taggs related to node
   * @readonly
   * @memberof Class_NodeElement
   */
  public get level_taggs_list() {
    return Object.values(this.level_taggs_dict)
  }

  /**
   * TODO Description
   * @readonly
   * @memberof Class_NodeElement
   */
  public get is_child() {
    return (Object.values(this._dimensions_as_child).length > 0)
  }

  /**
   * TODO description
   * @readonly
   * @memberof Class_NodeElement
   */
  public get is_parent() {
    return (Object.values(this._dimensions_as_parent).length > 0)
  }

  // Links related ----------------------------------------------------------------------

  /**
   * Get node value formatted as label
   * @readonly
   * @memberof Class_NodeElement
   */
  public get value_label() {
    return String(Math.max(this._input_data_value, this._output_data_value))
  }

  /**
   * Get dict of input links
   *
   * @readonly
   * @memberof Class_NodeElement
   */
  public get input_links_dict() {
    return this._input_links
  }

  /**
   * Get list of all input link
   * @readonly
   * @memberof Class_NodeElement
   */
  public get input_links_list() {
    return Object.values(this._input_links)
  }

  /**
   * Get dict of output links
   * @readonly
   * @memberof Class_NodeElement
   */
  public get output_links_dict() {
    return this._output_links
  }

  /**
   * Get list of all output link
   * @readonly
   * @memberof Class_NodeElement
   */
  public get output_links_list() {
    return Object.values(this._output_links)
  }

  /**
   * Get current link element that is dragged through a link handler
   * @type {(Class_LinkElement | undefined)}
   * @memberof Class_NodeElement
   */
  public get link_dragged(): Class_LinkElement | undefined { return this._link_dragged }

  /**
   * Indicate that a given link element is dragged through a link handler
   * @memberof Class_NodeElement
   */
  public set link_dragged(value: Class_LinkElement | undefined) { this._link_dragged = value }

  // Style / Local attributes related ---------------------------------------------------

  /**
   * Get style key of node
   * @return {string}
   * @memberof Class_Node
   */
  public get style() {
    return this._display.style
  }

  /**
  * Set style key of node
  * @memberof Class_Node
  */
  public set style(_: Class_NodeStyle) {
    this._display.style.removeReference(this)
    this._display.style = _
    _.addReference(this)
    this.draw()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_visible() {
    if (this._display.attributes.shape_visible !== undefined) {
      return this._display.attributes.shape_visible
    }
    else if (this._display.style.shape_visible !== undefined) {
      return this._display.style.shape_visible
    }
    return default_shape_visible
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_visible(_: boolean) {
    this._display.attributes.shape_visible = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_min_width() {
    if (this._display.attributes.shape_min_width !== undefined) {
      return this._display.attributes.shape_min_width
    } else if (this._display.style.shape_min_width !== undefined) {
      return this._display.style.shape_min_width
    }
    return default_shape_min_width
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_min_width(_: number) {
    this._display.attributes.shape_min_width = _
    this.draw() // Redraw all because it can impact everything
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_min_height() {
    if (this._display.attributes.shape_min_height !== undefined) {
      return this._display.attributes.shape_min_height
    } else if (this._display.style.shape_min_height !== undefined) {
      return this._display.style.shape_min_height
    }
    return default_shape_min_height
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_min_height(_: number) {
    this._display.attributes.shape_min_height = _
    this.draw() // Redraw all because it can impact everything
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_color() {
    if (this._display.attributes.shape_color !== undefined) {
      return this._display.attributes.shape_color
    } else if (this._display.style.shape_color !== undefined) {
      return this._display.style.shape_color
    }
    return default_shape_color
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_color(_: string) {
    this._display.attributes.shape_color = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_type() {
    if (this._display.attributes.shape_type !== undefined) {
      return this._display.attributes.shape_type
    } else if (this._display.style.shape_type !== undefined) {
      return this._display.style.shape_type
    }
    return default_shape_type
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_type(_: Type_Shape) {
    this._display.attributes.shape_type = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_arrow_angle_factor() {
    if (this._display.attributes.shape_arrow_angle_factor !== undefined) {
      return this._display.attributes.shape_arrow_angle_factor
    } else if (this._display.style.shape_arrow_angle_factor !== undefined) {
      return this._display.style.shape_arrow_angle_factor
    }
    return default_shape_arrow_angle_factor
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_arrow_angle_factor(_: number) {
    this._display.attributes.shape_arrow_angle_factor = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_arrow_angle_direction() {
    if (this._display.attributes.shape_arrow_angle_direction !== undefined) {
      return this._display.attributes.shape_arrow_angle_direction
    } else if (this._display.style.shape_arrow_angle_direction !== undefined) {
      return this._display.style.shape_arrow_angle_direction
    }
    return default_shape_arrow_angle_direction
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_arrow_angle_direction(_: Type_Side) {
    this._display.attributes.shape_arrow_angle_direction = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_color_sustainable() {
    if (this._display.attributes.shape_color_sustainable !== undefined) {
      return this._display.attributes.shape_color_sustainable
    } else if (this._display.style.shape_color_sustainable !== undefined) {
      return this._display.style.shape_color_sustainable
    }
    return default_shape_color_sustainable
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_color_sustainable(_: boolean) {
    this._display.attributes.shape_color_sustainable = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_visible() {
    if (this._display.attributes.name_label_visible !== undefined) {
      return this._display.attributes.name_label_visible
    } else if (this._display.style.name_label_visible !== undefined) {
      return this._display.style.name_label_visible
    }
    return default_name_label_visible
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_visible(_: boolean) {
    this._display.attributes.name_label_visible = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_font_family() {
    if (this._display.attributes.name_label_font_family !== undefined) {
      return this._display.attributes.name_label_font_family
    } else if (this._display.style.name_label_font_family !== undefined) {
      return this._display.style.name_label_font_family
    }
    return default_label_font_family
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_font_family(_: string) {
    this._display.attributes.name_label_font_family = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_font_size() {
    if (this._display.attributes.name_label_font_size !== undefined) {
      return this._display.attributes.name_label_font_size
    } else if (this._display.style.name_label_font_size !== undefined) {
      return this._display.style.name_label_font_size
    }
    return default_label_font_size
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_font_size(_: number) {
    this._display.attributes.name_label_font_size = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_uppercase() {
    if (this._display.attributes.name_label_uppercase !== undefined) {
      return this._display.attributes.name_label_uppercase
    } else if (this._display.style.name_label_uppercase !== undefined) {
      return this._display.style.name_label_uppercase
    }
    return default_label_uppercase
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_uppercase(_: boolean) {
    this._display.attributes.name_label_uppercase = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_bold() {
    if (this._display.attributes.name_label_bold !== undefined) {
      return this._display.attributes.name_label_bold
    } else if (this._display.style.name_label_bold !== undefined) {
      return this._display.style.name_label_bold
    }
    return default_label_bold
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_bold(_: boolean) {
    this._display.attributes.name_label_bold = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_italic() {
    if (this._display.attributes.name_label_italic !== undefined) {
      return this._display.attributes.name_label_italic
    } else if (this._display.style.name_label_italic !== undefined) {
      return this._display.style.name_label_italic
    }
    return default_label_italic
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_italic(_: boolean) {
    this._display.attributes.name_label_italic = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_box_width() {
    if (this._display.attributes.name_label_box_width !== undefined) {
      return this._display.attributes.name_label_box_width
    } else if (this._display.style.name_label_box_width !== undefined) {
      return this._display.style.name_label_box_width
    }
    return default_label_box_width
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_box_width(_: number) {
    this._display.attributes.name_label_box_width = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_color() {
    if (this._display.attributes.name_label_color !== undefined) {
      return this._display.attributes.name_label_color
    } else if (this._display.style.name_label_color !== undefined) {
      return this._display.style.name_label_color
    }
    return default_label_color
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_color(_: boolean) {
    this._display.attributes.name_label_color = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_vert() {
    if (this._display.attributes.name_label_vert !== undefined) {
      return this._display.attributes.name_label_vert
    } else if (this._display.style.name_label_vert !== undefined) {
      return this._display.style.name_label_vert
    }
    return default_name_label_vert
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_vert(_: Type_TextVPos) {
    if (_ !== 'dragged') delete this._display.position_y_label
    this._display.attributes.name_label_vert = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_horiz() {
    if (this._display.attributes.name_label_horiz !== undefined) {
      return this._display.attributes.name_label_horiz
    } else if (this._display.style.name_label_horiz !== undefined) {
      return this._display.style.name_label_horiz
    }
    return default_name_label_horiz
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_horiz(_: Type_TextHPos) {
    if (_ !== 'dragged') delete this._display.position_x_label
    this._display.attributes.name_label_horiz = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get name_label_background() {
    if (this._display.attributes.name_label_background !== undefined) {
      return this._display.attributes.name_label_background
    } else if (this._display.style.name_label_background !== undefined) {
      return this._display.style.name_label_background
    }
    return default_label_background
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set name_label_background(_: boolean) {
    this._display.attributes.name_label_background = _
    this.drawNameLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_visible() {
    if (this._display.attributes.value_label_visible !== undefined) {
      return this._display.attributes.value_label_visible
    } else if (this._display.style.value_label_visible !== undefined) {
      return this._display.style.value_label_visible
    }
    return default_value_label_visible
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_visible(_: boolean) {
    this._display.attributes.value_label_visible = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_vert() {
    if (this._display.attributes.value_label_vert !== undefined) {
      return this._display.attributes.value_label_vert
    } else if (this._display.style.value_label_vert !== undefined) {
      return this._display.style.value_label_vert
    }
    return default_value_label_vert
  }

  /** Set value for value_label_vert
   *
   TODO Description * @memberof Class_NodeElement
   */
  public set value_label_vert(_: Type_TextVPos) {
    this._display.attributes.value_label_vert = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_horiz() {
    if (this._display.attributes.value_label_horiz !== undefined) {
      return this._display.attributes.value_label_horiz
    } else if (this._display.style.value_label_horiz !== undefined) {
      return this._display.style.value_label_horiz
    }
    return default_value_label_horiz
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_horiz(_: Type_TextHPos) {
    this._display.attributes.value_label_horiz = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_font_size() {
    if (this._display.attributes.value_label_font_size !== undefined) {
      return this._display.attributes.value_label_font_size
    } else if (this._display.style.value_label_font_size !== undefined) {
      return this._display.style.value_label_font_size
    }
    return default_label_font_size
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_font_size(_: number) {
    this._display.attributes.value_label_font_size = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_background() {
    if (this._display.attributes.value_label_background !== undefined) {
      return this._display.attributes.value_label_background
    } else if (this._display.style.value_label_background !== undefined) {
      return this._display.style.value_label_background
    }
    return default_label_background
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_background(_: boolean) {
    this._display.attributes.value_label_background = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_color() {
    if (this._display.attributes.value_label_color !== undefined) {
      return this._display.attributes.value_label_color
    } else if (this._display.style.value_label_color !== undefined) {
      return this._display.style.value_label_color
    }
    return default_label_color
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_color(_: boolean) {
    this._display.attributes.value_label_color = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_uppercase() {
    if (this._display.attributes.value_label_uppercase !== undefined) {
      return this._display.attributes.value_label_uppercase
    } else if (this._display.style.value_label_uppercase !== undefined) {
      return this._display.style.value_label_uppercase
    }
    return default_label_uppercase
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_uppercase(_: boolean) {
    this._display.attributes.value_label_uppercase = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_bold() {
    if (this._display.attributes.value_label_bold !== undefined) {
      return this._display.attributes.value_label_bold
    } else if (this._display.style.value_label_bold !== undefined) {
      return this._display.style.value_label_bold
    }
    return default_label_bold
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_bold(_: boolean) {
    this._display.attributes.value_label_bold = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_italic() {
    if (this._display.attributes.value_label_italic !== undefined) {
      return this._display.attributes.value_label_italic
    } else if (this._display.style.value_label_italic !== undefined) {
      return this._display.style.value_label_italic
    }
    return default_label_italic
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_italic(_: boolean) {
    this._display.attributes.value_label_italic = _
    this.drawValueLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_label_font_family() {
    if (this._display.attributes.value_label_font_family !== undefined) {
      return this._display.attributes.value_label_font_family
    } else if (this._display.style.value_label_font_family !== undefined) {
      return this._display.style.value_label_font_family
    }
    return default_label_font_family
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_label_font_family(_: string) {
    this._display.attributes.value_label_font_family = _
    this.drawValueLabel()
  }

  // Tooltip related --------------------------------------------------------------------

  public get tooltip_text() {
    return this._tooltip_text
  }

  public set tooltip_text(_: string | undefined) {
    this._tooltip_text = _
  }

  // PRIVATE GETTER / SETTER ============================================================

  /**
   * Function used in element_displayed tho check if at least one of the tag associated to the node is selected,
   * We draw the node only if this is the case
   *
   * @private
   * @return {*}
   * @memberof Class_NodeElement
   */
  private get are_related_tags_selected() {
    // Check if all node tags are selected = ok to display
    let to_display = true
    this.tags_list
      .forEach(tag => to_display = (to_display && tag.is_selected))
    return to_display
  }

  private get is_related_level_selected() {
    // Draw by default if there is no dimensions
    if (!this.is_child && !this.is_parent)
      return true
    // If there is any dimension - check them
    let ok_dimension: boolean = false
    // Check dimensions where node is tagged as a child
    Object.values(this._dimensions_as_child)
      .forEach(dim => ok_dimension = (ok_dimension || dim.show_children))
    // Check dimensions where node is tagged as a parent
    if (!ok_dimension) {
      Object.values(this._dimensions_as_parent)
        .forEach(dim => ok_dimension = ok_dimension || dim.show_parent)
    }
    return ok_dimension
  }

  private get tooltip_html() {
    // Title
    let tooltip_html = '<p class="title" style="margin-bottom: 5px;">' +
      this.name.split('\\n').join(' ') +
      '</p>'
    // Subtitle
    if (this._tooltip_text)
      tooltip_html += '<p class="subtitle" style="	margin-bottom: 5px;">' + this._tooltip_text.split('\n').join('<br>') + '</p>'
    tooltip_html += '<div style="padding-left :5px;padding-right :5px">'
    // Input links
    if (this.hasInputLinks()) {
      tooltip_html += '<p class="tab-title" style="margin-bottom: 5px;">' + 'Entrées' + '</p>' // TODO traduction manquante sur "entrées"
      tooltip_html += '<table class="table" style="margin-bottom: 5px;">'
      tooltip_html += '  <thead>'
      tooltip_html += '    <tr>'
      tooltip_html += '      <th>' + 'Provenances' + '</th>' // TODO traduction manquante
      tooltip_html += '      <th>' + 'Valeurs' + '</th>' // TODO traduction manquante
      tooltip_html += '      <th>' + 'Ratios' + '</th>' // TODO traduction manquante
      this.main_sankey.flux_taggs_list
        .forEach(tagg =>
          tooltip_html += '      <th>' + tagg.name + '</th>')
      tooltip_html += '    </tr>'
      tooltip_html += '  </thead>'
      tooltip_html += '  </tbody>'
      // Fill input link table
      this.input_links_list
        .filter(link => link.is_visible)
        .forEach(link => {
          // Source
          tooltip_html += '    <tr>'
          tooltip_html += '      <td style="white-space: nowrap;">' + link.source.name + '</td>'
          // With values
          tooltip_html += '      <td>' + link.data_label + '</td>'
          if (this._input_data_value > 0)  // avoid div / 0
            tooltip_html += '      <td>' + Math.round(((link.data_value ?? 0) / this._input_data_value) * 100).toPrecision(3) + '%</td>'
          else
            tooltip_html += '      <td></td>'
          // And flux tag for each values
          this.main_sankey.flux_taggs_list
            .forEach(tagg => {
              const _: string[] = []
              link.flux_tags_list
                .forEach(tag => {
                  if (tag.group === tagg)
                    _.push(tag.name)
                })
              tooltip_html += '      <td style="white-space: nowrap;">' + _.join() + '</td>'
            })
          tooltip_html += '   </tr>'
        })
      tooltip_html += '    <tr>'
      tooltip_html += '       <th>' + 'Total' + '</th>'
      tooltip_html += '       <td>' + this._input_data_value.toPrecision() + '</td>' // TODO manque traduction virgule + nombre de chiffre signification cohérent avec valuer flux
      tooltip_html += '    </tr>'
      tooltip_html += '  </tbody>'
      tooltip_html += '</table>'
    }
    // Output links
    if (this.hasOutputLinks()) {
      tooltip_html += '<p class="tab-title" style="margin-bottom: 5px;">' + 'Sortie' + '</p>' // TODO traduction manquante sur "sorties"
      tooltip_html += '<table class="table" style="margin-bottom: 5px;">'
      tooltip_html += '  <thead>'
      tooltip_html += '    <tr>'
      tooltip_html += '      <th>' + 'Destinations' + '</th>' // TODO traduction manquante
      tooltip_html += '      <th>' + 'Valeurs' + '</th>' // TODO traduction manquante
      tooltip_html += '      <th>' + 'Ratios' + '</th>' // TODO traduction manquante
      this.main_sankey.flux_taggs_list
        .forEach(tagg =>
          tooltip_html += '      <th>' + tagg.name + '</th>')
      tooltip_html += '    </tr>'
      tooltip_html += '  </thead>'
      // Fill input link table
      this.output_links_list
        .filter(link => link.is_visible)
        .forEach(link => {
          // Source
          tooltip_html += '    <tr>'
          tooltip_html += '      <td style="white-space: nowrap;">' + link.target.name + '</td>'
          // With values
          tooltip_html += '      <td>' + link.data_label + '</td>'
          if (this._output_data_value > 0)  // avoid div / 0
            tooltip_html += '      <td>' + Math.round(((link.data_value ?? 0) / this._output_data_value) * 100).toPrecision(3) + '%</td>'
          else
            tooltip_html += '      <td></td>'
          // And flux tag for each values
          this.main_sankey.flux_taggs_list
            .forEach(tagg => {
              const _: string[] = []
              link.flux_tags_list
                .forEach(tag => {
                  if (tag.group === tagg)
                    _.push(tag.name)
                })
              tooltip_html += '      <td style="white-space: nowrap;">' + _.join() + '</td>'
            })
          tooltip_html += '    </tr>'
        })
      tooltip_html += '    <tr>'
      tooltip_html += '      <th>' + 'Total' + '</th>'
      tooltip_html += '      <td>' + this._output_data_value.toPrecision() + '</td>' // TODO manque traduction virgule + nombre de chiffre signification cohérent avec valuer flux
      tooltip_html += '    </tr>'
      tooltip_html += '  </tbody>'
      tooltip_html += '</table>'
    }
    tooltip_html += '</div>'
    return tooltip_html
  }
}

// CLASS NODE ATTRIBUTES ****************************************************************

/**
 * Define all attributes that can be apply to a node
 *
 * @export
 * @class Class_NodeAttribute
 */
export class Class_NodeAttribute {

  // PROTECTED ATTRIBUTES ===============================================================

  // Parameters for shape
  protected _shape_visible?: boolean
  protected _shape_type?: Type_Shape
  protected _shape_min_width?: number
  protected _shape_min_height?: number
  protected _shape_color?: string
  protected _shape_color_sustainable?: boolean
  protected _shape_arrow_angle_factor?: number
  protected _shape_arrow_angle_direction?: Type_Side

  // Parameter of node label
  protected _name_label_visible?: boolean
  protected _name_label_font_family?: string
  protected _name_label_font_size?: number
  protected _name_label_uppercase?: boolean
  protected _name_label_bold?: boolean
  protected _name_label_italic?: boolean
  protected _name_label_box_width?: number
  protected _name_label_color?: boolean
  protected _name_label_vert?: Type_TextVPos
  protected _name_label_horiz?: Type_TextHPos
  protected _name_label_background?: boolean

  // Parameter of node value label
  protected _value_label_visible?: boolean
  protected _value_label_font_family?: string
  protected _value_label_font_size?: number
  protected _value_label_uppercase?: boolean
  protected _value_label_bold?: boolean
  protected _value_label_italic?: boolean
  protected _value_label_box_width?: number
  protected _value_label_color?: boolean
  protected _value_label_vert?: Type_TextVPos
  protected _value_label_horiz?: Type_TextHPos
  protected _value_label_background?: boolean

  // CONSTRUCTOR ========================================================================
  constructor() { }

  // PUBLIC METHODS =====================================================================

  public toJSON() {
    const json_object = {} as Type_JSON

    // One line 'if' to add local attribute to json object if they're not undefined
    // TODO delete code as comment when saved variable name will be defined (old vs new)

    // Parameters for shape
    if (this._shape_visible !== undefined) json_object['shape_visible'] = this._shape_visible
    // if (this._shape_type !== undefined) json_object['shape_type'] = this._shape_type
    if (this._shape_type !== undefined) json_object['shape'] = this._shape_type
    // if (this._shape_min_width !== undefined) json_object['shape_min_width'] = this._shape_min_width
    if (this._shape_min_width !== undefined) json_object['node_width'] = this._shape_min_width
    // if (this._shape_min_height !== undefined) json_object['shape_min_height'] = this._shape_min_height
    if (this._shape_min_height !== undefined) json_object['node_height'] = this._shape_min_height
    // if (this._shape_color !== undefined) json_object['shape_color'] = this._shape_color
    if (this._shape_color !== undefined) json_object['color'] = this._shape_color
    // if (this._shape_color_sustainable !== undefined) json_object['shape_color_sustainable'] = this._shape_color_sustainable
    if (this._shape_color_sustainable !== undefined) json_object['colorSustainable'] = this._shape_color_sustainable
    // if (this._shape_arrow_angle_factor !== undefined) json_object['shape_arrow_angle_factor'] = this._shape_arrow_angle_factor
    if (this._shape_arrow_angle_factor !== undefined) json_object['node_arrow_angle_factor'] = this._shape_arrow_angle_factor
    // if (this._shape_arrow_angle_direction !== undefined) json_object['shape_arrow_angle_direction'] = this._shape_arrow_angle_direction
    if (this._shape_arrow_angle_direction !== undefined) json_object['node_arrow_angle_direction'] = this._shape_arrow_angle_direction

    // Parameter of node label
    // if (this._name_label_visible !== undefined) json_object['name_label_visible'] = this._name_label_visible
    if (this._name_label_visible !== undefined) json_object['label_visible'] = this._name_label_visible
    // if (this._name_label_font_family !== undefined) json_object['name_label_font_family'] = this._name_label_font_family
    if (this._name_label_font_family !== undefined) json_object['font_family'] = this._name_label_font_family
    // if (this._name_label_font_size !== undefined) json_object['name_label_font_size'] = this._name_label_font_size
    if (this._name_label_font_size !== undefined) json_object['font_size'] = this._name_label_font_size
    // if (this._name_label_uppercase !== undefined) json_object['name_label_uppercase'] = this._name_label_uppercase
    if (this._name_label_uppercase !== undefined) json_object['uppercase'] = this._name_label_uppercase
    // if (this._name_label_bold !== undefined) json_object['name_label_bold'] = this._name_label_bold
    if (this._name_label_bold !== undefined) json_object['bold'] = this._name_label_bold
    // if (this._name_label_italic !== undefined) json_object['name_label_italic'] = this._name_label_italic
    if (this._name_label_italic !== undefined) json_object['italic'] = this._name_label_italic
    // if (this._name_label_box_width !== undefined) json_object['name_label_box_width'] = this._name_label_box_width
    if (this._name_label_box_width !== undefined) json_object['label_box_width'] = this._name_label_box_width
    // if (this._name_label_color !== undefined) json_object['name_label_color'] = this._name_label_color
    if (this._name_label_color !== undefined) json_object['label_color'] = this._name_label_color
    // if (this._name_label_vert !== undefined) json_object['name_label_vert'] = this._name_label_vert
    if (this._name_label_vert !== undefined) json_object['label_vert'] = this._name_label_vert
    // if (this._name_label_horiz !== undefined) json_object['name_label_horiz'] = this._name_label_horiz
    if (this._name_label_horiz !== undefined) json_object['label_horiz'] = this._name_label_horiz
    // if (this._name_label_background !== undefined) json_object['name_label_background'] = this._name_label_background
    if (this._name_label_background !== undefined) json_object['label_background'] = this._name_label_background

    // Parameter of node value label
    // if (this._value_label_visible !== undefined) json_object['value_label_visible'] = this._value_label_visible
    if (this._value_label_visible !== undefined) json_object['show_value'] = this._value_label_visible
    if (this._value_label_font_family !== undefined) json_object['value_label_font_family'] = this._value_label_font_family
    // if (this._value_label_font_size !== undefined) json_object['value_label_font_size'] = this._value_label_font_size
    if (this._value_label_font_size !== undefined) json_object['value_font_size'] = this._value_label_font_size
    if (this._value_label_uppercase !== undefined) json_object['value_label_uppercase'] = this._value_label_uppercase
    if (this._value_label_bold !== undefined) json_object['value_label_bold'] = this._value_label_bold
    if (this._value_label_italic !== undefined) json_object['value_label_italic'] = this._value_label_italic
    if (this._value_label_box_width !== undefined) json_object['value_label_box_width'] = this._value_label_box_width
    if (this._value_label_color !== undefined) json_object['value_label_color'] = this._value_label_color
    // if (this._value_label_vert !== undefined) json_object['value_label_vert'] = this._value_label_vert
    if (this._value_label_vert !== undefined) json_object['label_vert_valeur'] = this._value_label_vert
    // if (this._value_label_horiz !== undefined) json_object['value_label_horiz'] = this._value_label_horiz
    if (this._value_label_horiz !== undefined) json_object['label_horiz_valeur'] = this._value_label_horiz
    if (this._value_label_background !== undefined) json_object['value_label_background'] = this._value_label_background

    return json_object
  }

  public fromJSON(json_local_object: Type_JSON) {
    // if attribute object has these variable then add it to local
    // this function is also called when creating style from json and should trigger all if, because in style all attribute are defined

    if (json_local_object['shape_visible'] !== undefined) this._shape_visible = getBooleanFromJSON(json_local_object, 'shape_visible', default_shape_visible)
    if (json_local_object['shape'] !== undefined) this._shape_type = getStringFromJSON(json_local_object, 'shape', default_shape_type) as Type_Shape
    if (json_local_object['node_width'] !== undefined) this._shape_min_width = getNumberFromJSON(json_local_object, 'node_width', default_shape_min_width)
    if (json_local_object['node_height'] !== undefined) this._shape_min_height = getNumberFromJSON(json_local_object, 'node_height', default_shape_min_height)
    if (json_local_object['color'] !== undefined) this._shape_color = getStringFromJSON(json_local_object, 'color', default_shape_color)
    if (json_local_object['colorSustainable'] !== undefined) this._shape_color_sustainable = getBooleanFromJSON(json_local_object, 'colorSustainable', default_shape_color_sustainable)
    if (json_local_object['node_arrow_angle_factor'] !== undefined) this._shape_arrow_angle_factor = getNumberFromJSON(json_local_object, 'node_arrow_angle_factor', default_shape_arrow_angle_factor)
    if (json_local_object['node_arrow_angle_direction'] !== undefined) this._shape_arrow_angle_direction = getStringFromJSON(json_local_object, 'node_arrow_angle_direction', default_shape_arrow_angle_direction) as Type_Side

    if (json_local_object['label_visible'] !== undefined) this._name_label_visible = getBooleanFromJSON(json_local_object, 'label_visible', default_name_label_visible)
    if (json_local_object['font_family'] !== undefined) this._name_label_font_family = getStringFromJSON(json_local_object, 'font_family', default_label_font_family)
    if (json_local_object['font_size'] !== undefined) this._name_label_font_size = getNumberFromJSON(json_local_object, 'font_size', default_label_font_size)
    if (json_local_object['uppercase'] !== undefined) this._name_label_uppercase = getBooleanFromJSON(json_local_object, 'uppercase', default_label_uppercase)
    if (json_local_object['bold'] !== undefined) this._name_label_bold = getBooleanFromJSON(json_local_object, 'bold', default_label_bold)
    if (json_local_object['italic'] !== undefined) this._name_label_italic = getBooleanFromJSON(json_local_object, 'italic', default_label_italic)
    if (json_local_object['label_box_width'] !== undefined) this._name_label_box_width = getNumberFromJSON(json_local_object, 'label_box_width', default_label_box_width)
    if (json_local_object['label_color'] !== undefined) this._name_label_color = getBooleanFromJSON(json_local_object, 'label_color', default_label_color)
    if (json_local_object['label_vert'] !== undefined) this._name_label_vert = getStringFromJSON(json_local_object, 'label_vert', default_name_label_vert) as Type_TextVPos
    if (json_local_object['label_horiz'] !== undefined) this._name_label_horiz = getStringFromJSON(json_local_object, 'label_horiz', default_name_label_horiz) as Type_TextHPos
    if (json_local_object['label_background'] !== undefined) this._name_label_background = getBooleanFromJSON(json_local_object, 'label_background', default_label_background)

    if (json_local_object['show_value'] !== undefined) this._value_label_visible = getBooleanFromJSON(json_local_object, 'show_value', default_value_label_visible)
    if (json_local_object['value_label_font_family'] !== undefined) this._value_label_font_family = getStringFromJSON(json_local_object, 'value_label_font_family', default_label_font_family)
    if (json_local_object['value_font_size'] !== undefined) this._value_label_font_size = getNumberFromJSON(json_local_object, 'value_font_size', default_label_font_size)
    if (json_local_object['value_label_uppercase'] !== undefined) this._value_label_uppercase = getBooleanFromJSON(json_local_object, 'value_label_uppercase', default_label_uppercase)
    if (json_local_object['value_label_bold'] !== undefined) this._value_label_bold = getBooleanFromJSON(json_local_object, 'value_label_bold', default_label_bold)
    if (json_local_object['value_label_italic'] !== undefined) this._value_label_italic = getBooleanFromJSON(json_local_object, 'value_label_italic', default_label_italic)
    if (json_local_object['value_label_box_width'] !== undefined) this._value_label_box_width = getNumberFromJSON(json_local_object, 'value_label_box_width', default_label_box_width)
    if (json_local_object['value_label_color'] !== undefined) this._value_label_color = getBooleanFromJSON(json_local_object, 'value_label_color', default_label_color)
    if (json_local_object['label_vert_valeur'] !== undefined) this._value_label_vert = getStringFromJSON(json_local_object, 'label_vert_valeur', default_value_label_vert) as Type_TextVPos
    if (json_local_object['label_horiz_valeur'] !== undefined) this._value_label_horiz = getStringFromJSON(json_local_object, 'label_horiz_valeur', default_value_label_horiz) as Type_TextHPos
    if (json_local_object['value_label_background'] !== undefined) this._value_label_background = getBooleanFromJSON(json_local_object, 'value_label_background', default_label_background)
  }

  public copyFrom(element: Class_NodeAttribute) {
    this._shape_visible = element._shape_visible
    this._shape_type = element._shape_type
    this._shape_min_width = element._shape_min_width
    this._shape_min_height = element._shape_min_height
    this._shape_color = element._shape_color
    this._shape_color_sustainable = element._shape_color_sustainable
    this._shape_arrow_angle_factor = element._shape_arrow_angle_factor
    this._shape_arrow_angle_direction = element._shape_arrow_angle_direction
    this._name_label_visible = element._name_label_visible
    this._name_label_font_family = element._name_label_font_family
    this._name_label_font_size = element._name_label_font_size
    this._name_label_uppercase = element._name_label_uppercase
    this._name_label_bold = element._name_label_bold
    this._name_label_italic = element._name_label_italic
    this._name_label_box_width = element._name_label_box_width
    this._name_label_color = element._name_label_color
    this._name_label_vert = element._name_label_vert
    this._name_label_horiz = element._name_label_horiz
    this._name_label_background = element._name_label_background
    this._value_label_visible = element._value_label_visible
    this._value_label_font_family = element._value_label_font_family
    this._value_label_font_size = element._value_label_font_size
    this._value_label_uppercase = element._value_label_uppercase
    this._value_label_bold = element._value_label_bold
    this._value_label_italic = element._value_label_italic
    this._value_label_box_width = element._value_label_box_width
    this._value_label_color = element._value_label_color
    this._value_label_vert = element._value_label_vert
    this._value_label_horiz = element._value_label_horiz
    this._value_label_background = element._value_label_background
  }

  // PROTECTED METHODS ==================================================================

  protected update() { }

  // GETTERS ============================================================================

  // Parameters for shape
  public get shape_visible() { return this._shape_visible }
  public get shape_type() { return this._shape_type }
  public get shape_min_width() { return this._shape_min_width }
  public get shape_min_height() { return this._shape_min_height }
  public get shape_color() { return this._shape_color }
  public get shape_color_sustainable() { return this._shape_color_sustainable }
  public get shape_arrow_angle_factor() { return this._shape_arrow_angle_factor }
  public get shape_arrow_angle_direction() { return this._shape_arrow_angle_direction }

  // Parameter of node label
  public get name_label_visible() { return this._name_label_visible }
  public get name_label_font_family() { return this._name_label_font_family }
  public get name_label_font_size() { return this._name_label_font_size }
  public get name_label_uppercase() { return this._name_label_uppercase }
  public get name_label_bold() { return this._name_label_bold }
  public get name_label_italic() { return this._name_label_italic }
  public get name_label_box_width() { return this._name_label_box_width }
  public get name_label_color() { return this._name_label_color }
  public get name_label_vert() { return this._name_label_vert }
  public get name_label_horiz() { return this._name_label_horiz }
  public get name_label_background() { return this._name_label_background }

  // Parameter of node value label
  public get value_label_visible() { return this._value_label_visible }
  public get value_label_font_family() { return this._value_label_font_family }
  public get value_label_font_size() { return this._value_label_font_size }
  public get value_label_uppercase() { return this._value_label_uppercase }
  public get value_label_bold() { return this._value_label_bold }
  public get value_label_italic() { return this._value_label_italic }
  public get value_label_box_width() { return this._value_label_box_width }
  public get value_label_color() { return this._value_label_color }
  public get value_label_vert() { return this._value_label_vert }
  public get value_label_horiz() { return this._value_label_horiz }
  public get value_label_background() { return this._value_label_background }

  // SETTERS ============================================================================

  // Parameters for shape
  public set shape_visible(_: boolean | undefined) { this._shape_visible = _; this.update() }
  public set shape_type(_: Type_Shape | undefined) { this._shape_type = _; this.update() }
  public set shape_min_width(_: number | undefined) { this._shape_min_width = _; this.update() }
  public set shape_min_height(_: number | undefined) { this._shape_min_height = _; this.update() }
  public set shape_color(_: string | undefined) { this._shape_color = _; this.update() }
  public set shape_color_sustainable(_: boolean | undefined) { this._shape_color_sustainable = _; this.update() }
  public set shape_arrow_angle_factor(_: number | undefined) { this._shape_arrow_angle_factor = _; this.update() }
  public set shape_arrow_angle_direction(_: Type_Side | undefined) { this._shape_arrow_angle_direction = _; this.update() }

  // Parameter of node label
  public set name_label_visible(_: boolean | undefined) { this._name_label_visible = _; this.update() }
  public set name_label_font_family(_: string | undefined) { this._name_label_font_family = _; this.update() }
  public set name_label_font_size(_: number | undefined) { this._name_label_font_size = _; this.update() }
  public set name_label_uppercase(_: boolean | undefined) { this._name_label_uppercase = _; this.update() }
  public set name_label_bold(_: boolean | undefined) { this._name_label_bold = _; this.update() }
  public set name_label_italic(_: boolean | undefined) { this._name_label_italic = _; this.update() }
  public set name_label_box_width(_: number | undefined) { this._name_label_box_width = _; this.update() }
  public set name_label_color(_: boolean | undefined) { this._name_label_color = _; this.update() }
  public set name_label_vert(_: Type_TextVPos | undefined) { this._name_label_vert = _; this.update() }
  public set name_label_horiz(_: Type_TextHPos | undefined) { this._name_label_horiz = _; this.update() }
  public set name_label_background(_: boolean | undefined) { this._name_label_background = _; this.update() }

  // Parameter of node value label
  public set value_label_visible(_: boolean | undefined) { this._value_label_visible = _; this.update() }
  public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _; this.update() }
  public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _; this.update() }
  public set value_label_uppercase(_: boolean | undefined) { this._value_label_uppercase = _; this.update() }
  public set value_label_bold(_: boolean | undefined) { this._value_label_bold = _; this.update() }
  public set value_label_italic(_: boolean | undefined) { this._value_label_italic = _; this.update() }
  public set value_label_box_width(_: number | undefined) { this._value_label_box_width = _; this.update() }
  public set value_label_color(_: boolean | undefined) { this._value_label_color = _; this.update() }
  public set value_label_vert(_: Type_TextVPos | undefined) { this._value_label_vert = _; this.update() }
  public set value_label_horiz(_: Type_TextHPos | undefined) { this._value_label_horiz = _; this.update() }
  public set value_label_background(_: boolean | undefined) { this._value_label_background = _; this.update() }
}

// CLASS NODE STYLE *********************************************************************

/**
 * Define style for nodes
 *
 * @export
 * @class Class_NodeStyle
 * @extends {Class_NodeAttribute}
 */
export class Class_NodeStyle extends Class_NodeAttribute {

  // PRIVATE ATTRIBUTES =================================================================

  private _id: string

  private _name: string

  private _is_deletable: boolean

  private _references: { [_: string]: Class_NodeElement } = {}

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    name: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super()

    // Set id
    this._id = id

    // Set name
    this._name = name

    // Set as deletable or not
    this._is_deletable = is_deletable

    // Parameters for shape
    this._shape_visible = default_shape_visible
    this._shape_type = default_shape_type
    this._shape_min_width = default_shape_min_width
    this._shape_min_height = default_shape_min_height
    this._shape_color = default_shape_color
    this._shape_color_sustainable = default_shape_color_sustainable
    this._shape_arrow_angle_factor = default_shape_arrow_angle_factor
    this._shape_arrow_angle_direction = default_shape_arrow_angle_direction

    // Parameter of node label
    this._name_label_visible = default_name_label_visible
    this._name_label_font_family = default_label_font_family
    this._name_label_font_size = default_label_font_size
    this._name_label_uppercase = default_label_uppercase
    this._name_label_bold = default_label_bold
    this._name_label_italic = default_label_italic
    this._name_label_box_width = default_label_box_width
    this._name_label_color = default_label_color
    this._name_label_vert = default_name_label_vert
    this._name_label_horiz = default_name_label_horiz
    this._name_label_background = default_label_background

    // Parameter of node value label
    this._value_label_visible = default_value_label_visible
    this._value_label_font_family = default_label_font_family
    this._value_label_font_size = default_label_font_size
    this._value_label_uppercase = default_label_uppercase
    this._value_label_bold = default_label_bold
    this._value_label_italic = default_label_italic
    this._value_label_box_width = default_label_box_width
    this._value_label_color = default_label_color
    this._value_label_vert = default_value_label_vert
    this._value_label_horiz = default_value_label_horiz
    this._value_label_background = default_label_background
  }

  // CLEANING ===========================================================================

  public delete() {
    if (this._is_deletable) {
      // Switch all refs to default style
      Object.values(this._references)
        .forEach(ref => ref.useDefaultStyle())
      this._references = {}
      // Garbage collector will do the rest....
    }
  }

  // PUBLIC METHODS =======================================================================

  public addReference(_: Class_NodeElement) {
    if (!this._references[_.id]) {
      this._references[_.id] = _
    }
  }

  public removeReference(_: Class_NodeElement) {
    if (this._references[_.id] !== undefined) {
      delete this._references[_.id]
    }
  }

  // PROTECTED METHODS ==================================================================

  protected update() {
    this.updateReferencesDraw()
  }

  // PRIVATE METHODS ======================================================================

  private updateReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => ref.draw())
  }

  // GETTERS ============================================================================

  /**
   * get id of style
   * @readonly
   * @memberof Class_NodeStyle
   */
  public get id() { return this._id }

  /**
   * Get name of style != id
   * @memberof Class_NodeStyle
   */
  public get name() { return this._name }

  // SETTERS =============================================================================

  /**
   * Set name of style != id
   * @memberof Class_NodeStyle
   */
  public set name(_: string) { this._name = _ }
}

// CLASS NODE DIMENSION *****************************************************************

export class Class_NodeDimension {

  // PRIVATE ATTRIBUTES =================================================================

  // Unique id
  private _id: string

  // Structure
  private _parent: Class_NodeElement
  private _children: Class_NodeElement[]

  // Tags relations
  private _parent_level_tag: Class_LevelTag
  private _children_level_tags: Class_LevelTag[]

  // Dimension selected
  private _show_parent: boolean = false
  private _show_children: boolean = false

  /**
   * True if element is currently on a deletion process
   * Avoid cross calls of delete() method
   * @private
   * @memberof Class_Element
   */
  private _is_currently_deleted = false

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_NodeDimension.
   * @param {Class_NodeElement} parent
   * @param {Class_NodeElement[]} children
   * @param {Class_LevelTag} parent_level_tag
   * @param {Class_LevelTag} children_level_tag
   * @memberof Class_NodeDimension
   */
  constructor(
    parent: Class_NodeElement,
    children: Class_NodeElement[],
    parent_level_tag: Class_LevelTag,
    children_level_tags: Class_LevelTag[],
    id?: string
  ) {
    // Create unique id
    if (id)
      this._id = id
    else
      this._id = makeId(
        parent_level_tag.id +
        '_' +
        children_level_tags
          .map(_ => _.id)
          .join('')
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
    this._children_level_tags = children_level_tags
    this._children_level_tags
      .forEach(_ => _.addAsChildrenLevel(this))
    // Sanity checks
    // Immediatly delete for any of this conditions :
    // - Parent is in children list
    // - Children tag are not of the same group
    // - Parent & children tags groups are not the same
    // - Children list is empty
    let same_group: boolean = true
    let prev_group: undefined | Class_LevelTagGroup = undefined
    this._children_level_tags
      .forEach(tag => {
        if (prev_group)
          same_group = (same_group && (tag.group === prev_group))
        prev_group = tag.group
      })
    if (
      (children.includes(parent)) ||
      (!same_group) ||
      (parent_level_tag.group !== this.children_level_tagg) ||
      (!this.has_children)
    ) {
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
      this._children = []
      // Remove cross references with leveltags
      this._parent_level_tag.removeParentLevel(this)
      this._children_level_tags
        .forEach(_ => _.removeChildrenLevel(this))
      this._children_level_tags = []
      // Garbage collector will do the rest ...
    }
  }

  // PUBLIC METHODS =====================================================================

  public synchroWith(dim: Class_NodeDimension) {
    // Get list of all nodes
    const nodes_dict = this.parent.main_sankey.nodes_dict
    const level_taggs_dict = this.parent.main_sankey.level_taggs_dict
    // Sync references with parent nodes
    if (dim.parent.id in nodes_dict) {
      this.parent = nodes_dict[dim.parent.id]
    }
    else { // parent node does not exits -> delete this
      this.delete()
    }
    // Sync reference with parent tag
    if (
      (dim.parent_level_tag.group.id in level_taggs_dict) &&
      (dim.parent_level_tag.id in level_taggs_dict[dim.parent_level_tag.group.id].tags_dict)
    ) {
      this.parent_level_tag = level_taggs_dict[dim.parent_level_tag.group.id].tags_dict[dim.parent_level_tag.id]
    }
    else { // parent level tag does not exits -> delete this
      this.delete()
    }
    // Sync references with children
    dim._children  // Append all missing children
      .filter(child => child.id in nodes_dict)
      .forEach(child => this.addNodeAsChild(nodes_dict[child.id]))
    this._children // Remove all unnecessary children
      .filter(child => !(dim._children.map(_ => _.id).includes(child.id)))
      .forEach(child => this.removeNodeFromChildren(child))
    // Sync reference with children tags
    dim._children_level_tags // Append all missing children tags
      .filter(tag => {
        (tag.group.id in level_taggs_dict) &&
          (tag.id in level_taggs_dict[tag.group.id].tags_dict)
      })
      .forEach(tag => this.addTagAsChildrenLevelTag(level_taggs_dict[tag.group.id].tags_dict[tag.id]))
    this._children_level_tags
      .filter(tag => !(dim._children_level_tags.map(_ => _.id).includes(tag.id)))
      .forEach(tag => this.removeTagFromChildrenLevelTag(tag))
  }

  public removeNodeAsParent(_: Class_NodeElement) {
    if (this._parent === _) {
      this.delete()  // Simply delete because dimension can not exist without parent
    }
  }

  public addNodeAsChild(_: Class_NodeElement) {
    if (
      (this._parent !== _) &&
      !(this._children.includes(_))
    ) {
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

  public addTagAsChildrenLevelTag(_: Class_LevelTag) {
    if (
      !this._children_level_tags.includes(_) &&
      _.group === this.children_level_tagg
    ) {
      this._children_level_tags.push(_)
      _.addAsChildrenLevel(this)
    }
  }

  public removeTagFromChildrenLevelTag(_: Class_LevelTag) {
    const idx = this._children_level_tags.indexOf(_)
    if (idx !== undefined) {
      this._children_level_tags.splice(idx, 1)
      // If all children level tags has been deleted, clear this
      if (!(this._children_level_tags.length > 0))
        this.delete()
    }
  }

  public forceShowParent() {
    this._show_parent = true
    this._show_children = false
    this.drawElements()
  }

  public forceShowChildren() {
    this._show_parent = false
    this._show_children = true
    this.drawElements()
  }

  public showFromLevelTags() {
    this._show_parent = false
    this._show_children = false
    this.drawElements()
  }

  // PRIVATE METHODS ====================================================================

  private drawElements() {
    this._parent.draw()
    this._children.forEach(child => child.draw())
  }

  // GETTERS / SETTERS ==================================================================

  public get id() { return this._id }

  public get parent_level_tag() { return this._parent_level_tag }
  public set parent_level_tag(_: Class_LevelTag) {
    // Do modification only if there is a change & if parent/children tag group are matching
    if (
      (_ !== this._parent_level_tag) &&
      (this.children_level_tagg === _.group)
    ) {
      const old = this._parent_level_tag
      this._parent_level_tag = _
      _.addAsParentLevel(this)
      old.removeParentLevel(this)
    }
  }

  public get children_level_tags() { return this._children_level_tags }
  public get children_level_tagg() { return this._children_level_tags[0]?.group ?? undefined }

  public get parent() { return this._parent }
  public set parent(_: Class_NodeElement) {
    if (
      (this._parent !== _) &&
      !(this._children.includes(_))
    ) {
      const old_parent = this._parent
      this._parent = _
      _.addNewDimensionAsParent(this)
      old_parent.removeDimensionAsParent(this)
    }
  }

  public get has_children() { return (this._children.length > 0) }
  public get children() { return this._children }

  public get show_parent() {
    return (
      (!this._show_children) &&
      ((this._show_parent) || (this.parent_level_tag.is_selected))
    )
  }
  public get show_children() {
    let ok_children_level_tags = false
    this.children_level_tags
      .forEach(tag => ok_children_level_tags = (ok_children_level_tags || tag.is_selected))
    return (
      (!this._show_parent) &&
      ((this._show_children) || (ok_children_level_tags))
    )
  }
}

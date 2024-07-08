// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'

// Local types
import {
  Type_ElementPosition,
  default_element_color,
  default_element_position,
  default_font,
} from './Utils'
import {
  Class_MenuConfig
} from './MenuConfig'
import {
  Class_DrawingArea
} from './DrawingArea'
import {
  Class_Element,
} from './Element'
import {
  Class_Tag
} from './Tag'
import {
  Class_LinkElement,
  Type_Side
} from './Link'



// SPECIFIC TYPES ***********************************************************************

type Type_Shape = 'ellipse' | 'rect' | 'arrow'
type Type_TextHPos = 'left' | 'middle' | 'right'
type Type_TextVPos = 'top' | 'middle' | 'bottom'

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

  // Tooltips
  tooltip?: Class_Element
  tooltip_text?: string

  // PROTECTED ATTRIBUTE ================================================================

  // Definition of abstract attribut from Class_Element
  protected _display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
    style: Class_NodeStyle,
    attributes: Class_NodeAttribute
  }

  // PRIVATE ATTRIBUTES =================================================================

  // Name
  private _name: string

  // Name Labels
  private _name_label_separator: string = ''

  // Related links
  private _input_links: { [_: string]: Class_LinkElement } = {}
  private _output_links: { [_: string]: Class_LinkElement } = {}

  // Links orderings
  private _links_order: Class_LinkElement[] = []

  // Value of node
  private _input_data_value: number = 0
  private _output_data_value: number = 0

  // Node tags
  private _tags: { [_: string]: Class_Tag[] } = {}

  // Level & Parent
  // Dimensions
  private _dimensions: {
    [_: string]: {
      parent_name: Class_NodeElement
    }
  } = {}

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
        link.delete()
      })
    this._input_links = {}
    Object.values(this._output_links)
      .forEach(link => {
        link.delete()
      })
    this._output_links = {}
    // Remove reference of self in related tags
    Object.values(this._tags)
      .forEach(tag => {
        tag.forEach(t => t.removeReference(this))
      })
    this._tags = {}
    // Remove reference of self in style
    this.style.removeReference(this)
  }

  /**
   * TODO
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  public deleteInputLink(link: Class_LinkElement) {
    if (this._input_links[link.id] !== undefined) {
      delete this._input_links[link.id]
      link.delete()
    }
  }

  /**
   * TODO
   * @param {Class_LinkElement} link
   * @memberof Class_NodeElement
   */
  public deleteOutputLink(link: Class_LinkElement) {
    if (this._output_links[link.id] !== undefined) {
      delete this._output_links[link.id]
      link.delete()
    }
  }

  // PUBLIC METHODS =====================================================================

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
  }

  public useDefaultStyle() {
    this.style = this.drawing_area.sankey.default_node_style
  }

  public updateInputValue() {
    this._input_data_value = 0
    this.input_links_list.forEach(link => {
      const data_value = link.data_value
      if (data_value !== null)
        this._input_data_value = this._input_data_value + data_value
    })
    this.draw()
  }

  public updateOutputValue() {
    this._output_data_value = 0
    this.output_links_list.forEach(link =>{
      const data_value = link.data_value
      if (data_value !== null)
        this._output_data_value = this._output_data_value + data_value
    })
    this.draw()
  }

  public resetAttributes() {
    this._display.attributes = new Class_NodeAttribute()
    this.draw()
  }

  public isAttributeOverloaded(attr: keyof Class_NodeAttribute) {
    return this._display.attributes[attr] !== undefined
  }

  public removeTag(tag: Class_Tag) {
    if (this._tags[tag.id] !== undefined) {
      delete this._tags[tag.id]
      tag.removeReference(this)
    }
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

  // Check links
  public hasInputLinks() { return (this.input_links_list.length > 0) }
  public hasOutputLinks() { return (this.output_links_list.length > 0) }

  // Add links
  public addInputLink(link: Class_LinkElement) {
    if (!this._input_links[link.id]) {
      this._input_links[link.id] = link
      this._links_order.push(link)
      this.updateInputValue()
      this.drawLinks()
      this.drawValueLabel()
    }
  }
  public addOutputLink(link: Class_LinkElement) {
    if (!this._output_links[link.id]) {
      this._output_links[link.id] = link
      this._links_order.push(link)
      this.updateOutputValue()
      this.drawLinks()
      this.drawValueLabel()
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
      delete this._input_links[link.id]
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
      delete this._output_links[link.id]
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

  /**
   * Convert node to JSON
   *
   *
   * @return {*}
   * @memberof Class_NodeElement
   */
  public toJSON() {
    const json_object = {} as { [_: string]: unknown }

    json_object['idNode'] = this.id
    json_object['name'] = this.name
    json_object['position'] = this.position_type
    json_object['x'] = this.position_x
    json_object['y'] = this.position_y
    json_object['tooltip_text'] = this.tooltip_text
    json_object['inputLinksId'] = this.input_links_list.map(l => l.id)
    json_object['outputLinksId'] = this.output_links_list.map(l => l.id)
    json_object['style'] = Object.entries(this.drawing_area.sankey.node_styles_dict).filter(stl => stl[1] === (this.style))[0][0]
    json_object['dimensions'] = Object.fromEntries(Object.entries(this.dimensions).map(ent_dim => [ent_dim[0], ent_dim[1].parent_name?.id]))

    json_object['local'] = this._display.attributes.toJSON()
    json_object['tags'] = Object.fromEntries(Object.entries(this._tags).map(ent => [ent[0], ent[1].map(nt => nt.id)]))

    return json_object
  }

  /**
   * Assign to node implementation values from json,
   * json_node_object is a json of 1 node
   *
   *
   * @param {{ [x: string]: any }} json_node_object
   * @memberof Class_NodeElement
   */
  public fromJSON(json_node_object: { [x: string]: any }) {

    this._display.position.type = json_node_object['position'] ?? ''
    this._display.position.x = json_node_object['x'] ?? 10
    this._display.position.y = json_node_object['y'] ?? 10
    this.tooltip_text = json_node_object['tooltip_text'] ?? ''

    //  Input & output link should be automatically added when we create link from json

    this._display.style = this.drawing_area.sankey.node_styles_dict[json_node_object['style'] ?? 'default'] // if json_node_object['style'] is undefined assign default style

    if (json_node_object['local']) {
      this._display.attributes.fromJSON(json_node_object['local'])
    }
    // In JSON here are how supposed tags var is :
    // tags:{key_grp_tag:string[] (key_tag_selected) }
    // where 'key_grp_tag' represent the id of a node_taggs group
    // &  'key_tag_selected' represent the array of id of tag selected for that node_taggs group
    Object.entries(json_node_object['tags'] ?? {})
      .filter(ent => (ent[0] in this.drawing_area.sankey.node_taggs_dict) && (ent[1] as string[]).length > 0)
      .forEach(ent_nodetag => {
        if (ent_nodetag.length > 0) {
          const list_id_tag = ent_nodetag[1] as string[]
          this._tags[ent_nodetag[0]] = list_id_tag.map(key_tag => {
            return this.drawing_area.sankey.node_taggs_dict[ent_nodetag[0]].tags[key_tag]
          })
        }

      })

    // Same thing but for level tag
    Object.entries(json_node_object['tags'] ?? {})
      .filter(ent => (ent[0] in this.drawing_area.sankey.level_taggs_dict) && (ent[1] as string[]).length > 0)
      .forEach(ent_lvltag => {
        if (ent_lvltag.length > 0) {
          const list_id_tag = ent_lvltag[1] as string[]
          this._tags[ent_lvltag[0]] = list_id_tag.map(key_tag => {
            return this.drawing_area.sankey.level_taggs_dict[ent_lvltag[0]].tags[key_tag]
          })
        }

      })
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
    this.applyPositionOnLinks()
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
    // Get related drawing area
    const drawing_area = this.drawing_area
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.application_data.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode()) {
      // ALT
      if (event.altKey) {
        // Purge selection list
        drawing_area.purgeSelection()
        // Show tooltip
        this.drawTooltip()
      }
      // SHIFT
      else if (event.shiftKey) {
        // Add node to selection
        drawing_area.addNodeToSelection(this)

        // Open related menu
        this.menu_config.OpenConfigMenu()
        this.menu_config.OpenConfigMenuElements()
        this.menu_config.OpenConfigMenuElementsNodes()
        // Update components related to node edition
        this.menu_config.updateMenuEditionNode()

      } else if (event.ctrlKey) {
        // Add node to selection
        drawing_area.addNodeToSelection(this)

        // Update components related to node edition
        this.menu_config.updateMenuEditionNode()
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
    // Get related drawing area
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
      // Get drawing scale
      const scale = d3.scaleLinear()
        .range([0, 100])
        .domain([0, this.drawing_area.scale])
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
      // Get variable property for node label
      const shape_width = this.getShapeWidthToUse()
      const shape_height = this.getShapeHeightToUse()
      // Label X position is set by text relative position / shape + text anchor
      let label_pos_dx = this.is_selected ? default_selected_stroke_width : 0
      let label_pos_x = shape_width + label_pos_dx
      let label_anchor = 'start'
      let label_align = 'start'
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
      // Label Y position is only set by text relative position / shape
      let label_pos_dy = this.is_selected ? default_selected_stroke_width : 0
      let label_pos_y = label_pos_dy + shape_height + this.name_label_font_size
      if (this.name_label_vert === 'top') {
        label_pos_y = -label_pos_dy
      }
      else if (this.name_label_vert === 'middle') {
        label_pos_y = shape_height/2
      }
      // Box position is set by label position. For text / shape ref point is not the same
      // - Text : ref point is bottom of text + right/middle/left depending on anchor
      // - Shape : ref point if top-left corner
      const box_width = Math.min(
        this.name_label.length * this.name_label_font_size,
        this.name_label_box_width)
      const box_height = this.name_label_font_size
      const box_pos_y = label_pos_y - this.name_label_font_size
      let box_pos_x = label_pos_x
      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      }
      else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width/2
      }
      // Add name label background
      if (this.name_label_background) {
        this.d3_selection?.append('rect')
          .classed('name_label', true)
          .classed('name_label_background', true)
          .attr('id', 'name_label_background_' + this.id)
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
      const wrapper = textwrap()
        .bounds({ height: 100, width: this.name_label_box_width })
        .method('tspans')
      this.d3_selection?.append('text')
        .classed('name_label', true)
        .classed('name_label_text', true)
        .attr('fill', this.name_label_color ? 'white' : 'black')
        .attr('id', 'name_label_text_' + this.id)
        .attr('x', label_pos_x)
        .attr('y', label_pos_y)
        .attr('text-anchor', label_anchor)
        .style('text-align', label_align)
        .style('font-weight', this.name_label_bold ? 'bold' : 'normal')
        .style('font-style', this.name_label_italic ? 'italic' : 'normal')
        .style('font-size', String(this.name_label_font_size) + 'px')
        .style('font-family', this.name_label_font_family)
        .style('stroke', 'none')
        .style('text-transform', this.name_label_uppercase ? 'uppercase' : 'none')
        .text(this.name_label)
        .call(wrapper)

      // TODO add text wrap -> .each(n => TextNodeWrap((n as SankeyNode),data))
      // Add an input to change the name of the node
      // The input appear when we double click on the label
      if (!this.drawing_area.static) {
        this.d3_selection?.append('foreignObject')
          .classed('name_label', true)
          .classed('name_label_fo_input', true)
          .attr('x', box_pos_x)
          .attr('y', box_pos_y)
          .attr('width', box_width)
          .attr('height', box_height)
          .style('display', 'none')
          .append('xhtml:div')
          .append('input')
          .classed('name_label', true)
          .classed('name_label_input', true)
          .attr('id', 'name_label_input_' + this.id)
          .attr('type', 'text')
          .attr('value', this._name)
          .style('font-size', String(this.name_label_font_size) + 'px')
      }
    }
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
      let label_pos_dy = this.is_selected ? default_selected_stroke_width : 0
      let label_pos_y = label_pos_dy + shape_height + this.value_label_font_size
      if (this.value_label_vert === 'top') {
        label_pos_y = -label_pos_dy
      }
      else if (this.value_label_vert === 'middle') {
        label_pos_y = (shape_height/2) + (this.value_label_font_size/2)
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
        box_pos_x = box_pos_x - box_width/2
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
    this.drawShape()  // Node shape can be modified by link's changes
    this.applyPositionOnLinks()  // Links positions can be modified by link's changes
  }

  private getArrowPath() {
    // Compute height & width
    const width = this.getShapeWidthToUse()
    const height = this.getShapeHeightToUse()
    // Svg path to construct
    let path = ''
    // Arrow toward the right side
    if(this.shape_arrow_angle_direction  ===  'right') {
      const opp = Math.tan(this.shape_arrow_angle_factor*Math.PI/180)*(height/2)
      const p0: string = '0,0'
      const p1: string = (width-opp) + ',0'
      const p2: string = width + ',' + (height/2)
      const p3: string = (width-opp) + ',' + height
      const p4: string = '0,' + height
      const p5: string = opp + ',' + (height/2)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the left side
    else if(this.shape_arrow_angle_direction  ===  'left') {
      const opp = Math.tan((this.shape_arrow_angle_factor*Math.PI/180))*(height/2)
      const p0: string = opp + ',0'
      const p1: string = width + ',0'
      const p2: string = width-opp + ',' + (height/2)
      const p3: string = width + ',' + height
      const p4: string = opp + ',' + height
      const p5: string = '0,' + (height/2)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the top
    else if(this.shape_arrow_angle_direction  ===  'top') {
      const opp = Math.tan((this.shape_arrow_angle_factor*Math.PI/180))*(width/2)
      const p0: string = '0,' + opp
      const p1: string = width/2 + ',0'
      const p2: string = width + ',' + opp
      const p3: string = width + ',' + height
      const p4: string = width/2 + ',' + (height-opp)
      const p5: string = '0,' + height
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the bottom
    else {
      const opp = Math.tan((this.shape_arrow_angle_factor*Math.PI/180))*(width/2)
      const p0: string = '0,0'
      const p1: string = (width/2) + ',' + opp
      const p2: string = width + ',0'
      const p3: string = width + ',' + (height-opp)
      const p4: string = (width/2) + ',' + height
      const p5: string = '0,' + (height-opp)
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
    this._links_order.forEach(link => {
      const thickness = link.thickness
      // Current node is link's source
      if (link.source === this) {
        if (link.source_side === 'right') {
          link.setPosXYStartingPoint(x0 + width, y0 + dy_right + thickness/2)
          dy_right = dy_right + thickness
        }
        else if (link.source_side === 'left') {
          link.setPosXYStartingPoint(x0, y0 + dy_left + thickness/2)
          dy_left = dy_left + thickness
        }
        else if (link.source_side === 'top') {
          link.setPosXYStartingPoint(x0 + dx_top + thickness/2, y0)
          dx_top = dx_top + thickness
        }
        else {  // link.source_side === 'bottom'
          link.setPosXYStartingPoint(x0 + dx_bottom + thickness/2, y0 + height)
          dy_left = dy_left + thickness
        }
      }
      // Or current node is link's target
      else if (link.target === this) {
        if (link.target_side === 'right') {
          link.setPosXYEndingPoint(x0 + width, y0 + dy_right + thickness/2)
          dy_right = dy_right + thickness
        }
        else if (link.target_side === 'left') {
          link.setPosXYEndingPoint(x0, y0 + dy_left + thickness/2)
          dy_left = dy_left + thickness
        }
        else if (link.target_side === 'top') {
          link.setPosXYEndingPoint(x0 + dx_top + thickness/2, y0)
          dx_top = dx_top + thickness
        }
        else {  // link.target_side === 'bottom'
          link.setPosXYEndingPoint(x0 + dx_bottom + thickness/2, y0 + height)
          dy_left = dy_left + thickness
        }
      }
    })
  }

  // Display tooltip
  private drawTooltip() {
    const sankeyTooltip = d3.select('.sankey-tooltip')
    const h_tooltip = Number(sankeyTooltip.style('height').replace('px', ''))
    const pos_tooltip_y = this.position_y
    const size_browser = window.innerHeight
    // pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY

    const w_tooltip = Number(sankeyTooltip.style('width').replace('px', ''))
    const pos_tooltip_x = this.position_x
    const size_browser_w = window.innerWidth
    // pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30
    sankeyTooltip
      .style('top', pos_tooltip_y + 'px')
      .style('left', pos_tooltip_x + 'px')
    sankeyTooltip
      .style('opacity', 1)
      .html(this?.tooltip_text ?? '')
  }

  /**
   * Get the width to apply on shape
   * @readonly
   * @memberof Class_NodeElement
   */
  public getShapeWidthToUse() {
    // Compute sum of thickness on each sides
    let sum_of_top_thickness = this.getSumOfLinksThickness('top')
    let sum_of_bottom_thickness = this.getSumOfLinksThickness('bottom')
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
    let sum_of_left_thickness = this.getSumOfLinksThickness('left')
    let sum_of_right_thickness = this.getSumOfLinksThickness('right')
    // Return max thickness
    return Math.max(sum_of_left_thickness, sum_of_right_thickness, this.shape_min_height)
  }

  private getShapeColorToUse() {
    if (
      (!this.shape_color_sustainable) &&
      (this.drawing_area.sankey.nodesColorMap !== 'no_colormap') &&
      (this.drawing_area.sankey.nodesColorMap in this._tags) &&
      (this._tags[this.drawing_area.sankey.nodesColorMap].length > 0)
    ) {
      const list_tag_from_grp_to_use_color = this._tags[this.drawing_area.sankey.nodesColorMap]
      return list_tag_from_grp_to_use_color[0].color
    }
    else {
      return this.shape_color
    }
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
   * For a given side, compute sum of all links thickness.
   * Helps to compute min height & width for node
   * @private
   * @param {Type_Side} side
   * @return {*}
   * @memberof Class_NodeElement
   */
  private getSumOfLinksThickness(side: Type_Side){
    let sum = 0
    this.getLinksOrdered(side).forEach(link => {
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
      return Math.max(0, (this.shape_min_height - this.getSumOfLinksThickness(side))/2)
    }
    else {
      return Math.max(0, (this.shape_min_width - this.getSumOfLinksThickness(side)/2))
    }
  }

  // GETTERS / SETTERS ==================================================================

  public get is_visible() {
    return(
      this.are_related_tags_selected &&
      this.is_related_level_selected &&
      this._is_visible
    )
  }

  public get dimensions(): { [_: string]: { parent_name: Class_NodeElement } } {
    return this._dimensions
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

  public get tags() {
    // TODO faire autrement
    return this._tags
  }

  public deRefTag(tag: Class_Tag) {
    delete this._tags[tag.id]
  }

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

  // PRIVATE GETTER / SETTER ============================================================

  /**
   * Function used in element_displayed tho check if at least one of the tag associated to the node is selected at false,
   * if that the case then we don't draw the node
   *
   * @private
   * @return {*}
   * @memberof Class_NodeElement
   */
  private get are_related_tags_selected() {
    let to_display = true

    Object.entries(this.drawing_area.sankey.node_taggs_dict).filter(nt => nt[0] !== 'Type de noeud' && Object.keys(this._tags).includes(nt[0])).forEach(nt => {
      // Check tags from the group attribued to the node
      // If the node don't have tag attribued from the group then it is not affected by filter and we display it
      const node_tags_attr = this._tags[nt[0]]

      if (node_tags_attr != undefined && node_tags_attr.length != 0) {
        // If the node has at least 1 tag from the selected tag of the group then we display it
        // If the node has tag from the group attribued to it but are not selected then we don't display it
        if (!nt[1].tags) {
          return
        }
        const tags_from_grp_to_display = Object.entries(nt[1].tags).filter(t => t[1].selected).map(t => t[1])
        to_display = (node_tags_attr.filter(t => tags_from_grp_to_display.includes(t)).length > 0) ? to_display : false
      }
    })
    return to_display
  }

  private get is_related_level_selected() {
    let to_display = true
    const lvl_ent = Object.entries(this.drawing_area.sankey.level_taggs_dict)
    // Check if there is other aggregation tags than 'Primaire',
    const multi_level = lvl_ent.filter(nt => nt[0] !== 'Primaire').map(nt => nt[0]).length > 0

    const only_one_activated = lvl_ent.filter(nt => nt[1].activated).length == 1
    const only_primaire_activated = lvl_ent.filter(nt => nt[1].activated).map(nt => nt[0])[0] == 'Primaire'

    const multy_but_only_primaire = multi_level && only_one_activated && only_primaire_activated

    // To display a node according to level tag we search if:
    // - The node.nodeTags have more level grp tag than 'Primaire', if that's the case we don't use grp tag 'Primaire' in the filter of node grp tag
    // - The node grp tag is activated (variable is set false if we activate another grp tag that has this grp tag in variable sibling)
    // - The node has the grp tag name in his tags
    lvl_ent.filter(nt => ((multi_level && !multy_but_only_primaire) ? nt[0] !== 'Primaire' : true) && nt[1].activated && Object.keys(this._tags).includes(nt[0])).forEach(nt => {
      // Check tags from the group attribued to the node
      // If the node don't have tag attribued from the group then it is not affected by filter and we display it
      const node_tags_attr = this._tags[nt[0]]
      if (node_tags_attr != undefined) {
        // If the node has at least 1 tag from the selected tag of the group then we display it
        // If the node has tag from the group attribued to it but are not selected then we don't display it
        const tags_from_grp_to_display = Object.values(nt[1].tags).filter(t => t.selected).map(t => t)
        to_display = (node_tags_attr.filter(t => tags_from_grp_to_display.includes(t)).length > 0) ? to_display : false
        // to_display=tags_from_grp_to_display.includes(node_tags_attr)?to_display:false

      }
    })
    return to_display
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
  constructor() {}

  // PUBLIC METHODS =====================================================================

  public toJSON() {
    const json_object = {} as { [_: string]: any }

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

  public fromJSON(json_local_object: { [x: string]: any }) {
    // if attribute object has these variable then add it to local
    // this function is also called when creating style from json and should trigger all if, because in style all attribute are defined

    if (json_local_object['shape_visible'] !== undefined) this._shape_visible = json_local_object['shape_visible']
    if (json_local_object['shape'] !== undefined) this._shape_type = json_local_object['shape']
    if (json_local_object['node_width'] !== undefined) this._shape_min_width = json_local_object['node_width']
    if (json_local_object['node_height'] !== undefined) this._shape_min_height = json_local_object['node_height']
    if (json_local_object['color'] !== undefined) this._shape_color = json_local_object['color']
    if (json_local_object['colorSustainable'] !== undefined) this._shape_color_sustainable = json_local_object['colorSustainable']
    if (json_local_object['node_arrow_angle_factor'] !== undefined) this._shape_arrow_angle_factor = json_local_object['node_arrow_angle_factor']
    if (json_local_object['node_arrow_angle_direction'] !== undefined) this._shape_arrow_angle_direction = json_local_object['node_arrow_angle_direction']

    if (json_local_object['label_visible'] !== undefined) this._name_label_visible = json_local_object['label_visible']
    if (json_local_object['font_family'] !== undefined) this._name_label_font_family = json_local_object['font_family']
    if (json_local_object['font_size'] !== undefined) this._name_label_font_size = json_local_object['font_size']
    if (json_local_object['uppercase'] !== undefined) this._name_label_uppercase = json_local_object['uppercase']
    if (json_local_object['bold'] !== undefined) this._name_label_bold = json_local_object['bold']
    if (json_local_object['italic'] !== undefined) this._name_label_italic = json_local_object['italic']
    if (json_local_object['label_box_width'] !== undefined) this._name_label_box_width = json_local_object['label_box_width']
    if (json_local_object['label_color'] !== undefined) this._name_label_color = json_local_object['label_color']
    if (json_local_object['label_vert'] !== undefined) this._name_label_vert = json_local_object['label_vert']
    if (json_local_object['label_horiz'] !== undefined) this._name_label_horiz = json_local_object['label_horiz']
    if (json_local_object['label_background'] !== undefined) this._name_label_background = json_local_object['label_background']

    if (json_local_object['show_value'] !== undefined) this._value_label_visible = json_local_object['show_value']
    if (json_local_object['value_label_font_family'] !== undefined) this._value_label_font_family = json_local_object['value_label_font_family']
    if (json_local_object['value_font_size'] !== undefined) this._value_label_font_size = json_local_object['value_font_size']
    if (json_local_object['value_label_uppercase'] !== undefined) this._value_label_uppercase = json_local_object['value_label_uppercase']
    if (json_local_object['value_label_bold'] !== undefined) this._value_label_bold = json_local_object['value_label_bold']
    if (json_local_object['value_label_italic'] !== undefined) this._value_label_italic = json_local_object['value_label_italic']
    if (json_local_object['value_label_box_width'] !== undefined) this._value_label_box_width = json_local_object['value_label_box_width']
    if (json_local_object['value_label_color'] !== undefined) this._value_label_color = json_local_object['value_label_color']
    if (json_local_object['label_vert_valeur'] !== undefined) this._value_label_vert = json_local_object['label_vert_valeur']
    if (json_local_object['label_horiz_valeur'] !== undefined) this._value_label_horiz = json_local_object['label_horiz_valeur']
    if (json_local_object['value_label_background'] !== undefined) this._value_label_background = json_local_object['value_label_background']
  }

  // PROTECTED METHODS ==================================================================

  protected update() {}

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

  private _is_deletable: boolean

  private _references: { [_: string]: Class_NodeElement } = {}

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super()

    // Set id
    this._id = id

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
      _.useDefaultStyle()
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
   *
   * @readonly
   * @memberof Class_NodeStyle
   */
  public get id() { return this._id }
}

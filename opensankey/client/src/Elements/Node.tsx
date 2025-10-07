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

import type { Type_Side } from './LinkAttributes'
import type { Class_LinkStyle } from './ElementStyle'
import type {
  Class_Tag,
  Class_LevelTag,
} from '../types/Tag'
import type {
  Class_TagGroup,
  Class_LevelTagGroup
} from '../types/TagGroup'
import {
  Class_LinkElement,
  sortLinksElementsByRelativeNodesPositions
} from './Link'
import {
  Type_ElementPosition,
  Type_Position,
  default_element_position,
  default_style_id,
  getJSONOrUndefinedFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  getStringListFromJSON,
  Type_JSON,
  Type_ElementPositionOptionnal,
} from '../types/Utils'
import {
  Class_NodeAttribute, default_dx, default_dy, Type_TextHPos, Type_TextVPos,
  default_position_type,
  default_auto_x
} from './NodeAttributes'
import { Class_NodeStyle } from './ElementStyle'
import { Class_NodeDimension } from './NodeDimension'
import { ClassTemplate_Handler } from './Handler'

import { draw_arrow_part, NodeDrawShape } from './NodeDrawShape'
import { NodeDrawNameLabel } from './NodeDrawLabel'
import { NodeDrawValueLabel } from './NodeDrawValue'
import { NodeTooltip } from './NodeTooltip'
import { NodeEventsHandler } from './NodeEventsHandler'
import { NodeTagsManager } from './NodeTagsManager'
import { NodeDimensionsManager } from './NodeDimensionsManager'
import { Class_ContainerElement } from './TextZone'
import { SankeyAnimation } from '../Algorithms/SankeyAnimation'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_Sankey } from '../types/Sankey'
import { ClassTemplate_Element } from './Element'
import { AttributeTypes as NodeAttributeTypes, NODES_ATTRIBUTES_CONFIG, NodeSetterGenerator } from './NodeAttributesConfig'
import { OSPFormatConverter } from '../Persistence/OSPFormatConverter'

export const default_selected_stroke_width = 3
export const label_margin = 5

// SPECIFIC FUNCTIONS *******************************************************************

export function sortNodesElements(
  a: Class_NodeElement | Class_NodeStyle,
  b: Class_NodeElement | Class_NodeStyle
) {
  if (a.name > b.name) return 1
  else if (a.name < b.name) return -1
  else return 0
}

export function isPositionOverloaded(
  nodes: Class_NodeElement[],
  attr: keyof Type_ElementPosition
) {
  let overloaded = false
  nodes.forEach(node => overloaded = (overloaded || node.isPositionOverloaded(attr)))
  return overloaded
}

// CLASSE PRINCIPALE AVEC LIENS RÉINTÉGRÉS *********************************************

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {ClassAbstract_NodeElement}
 */
export class Class_NodeElement extends ClassTemplate_Element {
  // Shape attributes
  shape_visible!: NodeAttributeTypes['shape_visible']
  orphan_node_visible!: NodeAttributeTypes['orphan_node_visible']
  shape_type!: NodeAttributeTypes['shape_type']
  shape_arrow_angle_factor!: NodeAttributeTypes['shape_arrow_angle_factor']
  shape_arrow_angle_direction!: NodeAttributeTypes['shape_arrow_angle_direction']
  shape_min_width!: NodeAttributeTypes['shape_min_width']
  shape_min_height!: NodeAttributeTypes['shape_min_height']
  shape_color!: NodeAttributeTypes['shape_color']
  shape_opacity!: NodeAttributeTypes['shape_opacity']
  shape_color_sustainable!: NodeAttributeTypes['shape_color_sustainable']
  // Name label attributes
  name_label_is_visible!: NodeAttributeTypes['name_label_is_visible']
  name_label_font_family!: NodeAttributeTypes['name_label_font_family']
  name_label_font_size!: NodeAttributeTypes['name_label_font_size']
  name_label_uppercase!: NodeAttributeTypes['name_label_uppercase']
  name_label_bold!: NodeAttributeTypes['name_label_bold']
  name_label_italic!: NodeAttributeTypes['name_label_italic']
  name_label_color!: NodeAttributeTypes['name_label_color']
  name_label_horiz!: NodeAttributeTypes['name_label_horiz']
  name_label_vert!: NodeAttributeTypes['name_label_vert']
  name_label_background!: NodeAttributeTypes['name_label_background']
  name_label_background_color!: NodeAttributeTypes['name_label_background_color']
  name_label_horiz_shift!: NodeAttributeTypes['name_label_horiz_shift']
  name_label_vert_shift!: NodeAttributeTypes['name_label_vert_shift']
  name_label_box_width!: NodeAttributeTypes['name_label_box_width']
  name_label_separator!: NodeAttributeTypes['name_label_separator']
  name_label_separator_part!: NodeAttributeTypes['name_label_separator_part']
  // Value label attributes
  value_label_is_visible!: NodeAttributeTypes['value_label_is_visible']
  value_label_font_family!: NodeAttributeTypes['value_label_font_family']
  value_label_font_size!: NodeAttributeTypes['value_label_font_size']
  value_label_uppercase!: NodeAttributeTypes['value_label_uppercase']
  value_label_bold!: NodeAttributeTypes['value_label_bold']
  value_label_italic!: NodeAttributeTypes['value_label_italic']
  value_label_color!: NodeAttributeTypes['value_label_color']
  value_label_horiz!: NodeAttributeTypes['value_label_horiz']
  value_label_vert!: NodeAttributeTypes['value_label_vert']
  value_label_background!: NodeAttributeTypes['value_label_background']
  value_label_background_color!: NodeAttributeTypes['value_label_background_color']
  value_label_horiz_shift!: NodeAttributeTypes['value_label_horiz_shift']
  value_label_vert_shift!: NodeAttributeTypes['value_label_vert_shift']
  value_label_box_width!: NodeAttributeTypes['value_label_box_width']
  value_label_scientific_notation!: NodeAttributeTypes['value_label_scientific_notation']
  value_label_significant_digits!: NodeAttributeTypes['value_label_significant_digits']
  value_label_nb_significant_digits!: NodeAttributeTypes['value_label_nb_significant_digits']
  value_label_custom_digit!: NodeAttributeTypes['value_label_custom_digit']
  value_label_nb_digit!: NodeAttributeTypes['value_label_nb_digit']
  value_label_unit_type!: NodeAttributeTypes['value_label_unit_type']
  value_label_unit_visible!: NodeAttributeTypes['value_label_unit_visible']
  value_label_unit!: NodeAttributeTypes['value_label_unit']
  value_label_unit_factor!: NodeAttributeTypes['value_label_unit_factor']
  //Icon attributes
  icon_name!: NodeAttributeTypes['icon_name']
  icon_color!: NodeAttributeTypes['icon_color']
  icon_visible!: NodeAttributeTypes['icon_visible']
  icon_view_box!: NodeAttributeTypes['icon_view_box']
  icon_color_sustainable!: NodeAttributeTypes['icon_color_sustainable']
  //Foreign Object attributes
  has_fo!: NodeAttributeTypes['has_fo']
  is_fo_raw!: NodeAttributeTypes['is_fo_raw']
  fo_content!: NodeAttributeTypes['fo_content']
  //Image attributes
  is_image!: NodeAttributeTypes['is_image']
  image_src!: NodeAttributeTypes['image_src']
  // Hyperlink attribute
  hyperlink!: NodeAttributeTypes['hyperlink']

  public d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_name_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_value_label: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_FO_illustration: d3.Selection<SVGForeignObjectElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_image: d3.Selection<SVGImageElement, unknown, SVGGElement, unknown> | null = null
  protected d3_selection_g_icon: d3.Selection<SVGPathElement, unknown, SVGGElement, unknown> | null = null
  protected _sibling_node: Class_NodeElement | undefined = undefined
  protected _master_node: Class_NodeElement | undefined = undefined
  protected _slave_nodes: Class_NodeElement[] = []

  public _display: {
    position: Type_ElementPosition,
    style: Class_NodeStyle[],
    attributes: Class_NodeAttribute
    position_x_label?: number
    position_y_label?: number
  }

  // Visibility memorized
  protected _are_related_node_tags_selected: boolean | undefined = undefined
  protected _node_tags_fingerprint: string = ''
  protected _are_related_dimensions_selected: boolean | undefined = undefined
  protected _links_visibilities_fingerprint: string = ''
  protected _are_links_visibilities_ok: boolean | undefined = undefined

  private _name: string

  private _nodeDrawShape: NodeDrawShape
  private _nodeDrawNameLabel: NodeDrawNameLabel
  private _nodeDrawValueLabel: NodeDrawValueLabel
  public _nodeTooltip: NodeTooltip
  public _nodeEventsHandler: NodeEventsHandler
  public _nodeTagsManager: NodeTagsManager
  private _nodeDimensionsManager: NodeDimensionsManager

  private _input_links: { [id: string]: Class_LinkElement } = {}
  private _output_links: { [id: string]: Class_LinkElement } = {}
  private _links_order: Class_LinkElement[] = []
  private _input_links_ending_point: { [id: string]: { x: number, y: number } } = {}
  private _output_links_starting_point: { [id: string]: { x: number, y: number } } = {}
  private _input_links_handle: { [x: string]: ClassTemplate_Handler } = {}
  private _output_links_handle: { [x: string]: ClassTemplate_Handler } = {}
  private _link_dragged: Class_LinkElement | undefined

  private _tags: Class_Tag[] = []
  private _taggs_dict: { [x: string]: Class_Tag[] } = {}
  private _dimensions_as_parent: { [id: string]: Class_NodeDimension } = {}
  private _dimensions_as_child: { [id: string]: Class_NodeDimension } = {}
  private _leveltaggs_as_antitagged: Class_LevelTagGroup[] = []

  private _tooltip_text: string = ''
  private _drag: boolean = false
  private _drag_start_pos: { [x: string]: [number, number] } = {}
  private first_drag_move = true
  private _node_current_dx = 0
  private _node_current_dy = 0

  private _attached_container: Class_ContainerElement[] = []

  /**
   * Creates an instance of Class_NodeElement.
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingArea
  ) {
    // Init parent class attributes
    super(id, drawing_area, drawing_area.sankey, 'g_elements_sankey')

    NodeSetterGenerator.generateSetters(this)

    // Init attributes
    this._name = name
    this._display = {
      position: structuredClone(default_element_position),
      style: [drawing_area.sankey.default_node_style],
      attributes: new Class_NodeAttribute()
    }
    this._display.style[0].addReference(this)

    // Init specialized components (SAUF NodeLinksManager)
    this._nodeDrawShape = new NodeDrawShape(this)
    this._nodeDrawNameLabel = new NodeDrawNameLabel(this)
    this._nodeDrawValueLabel = new NodeDrawValueLabel(this)
    this._nodeTooltip = new NodeTooltip(this)
    this._nodeEventsHandler = new NodeEventsHandler(this)
    this._nodeTagsManager = new NodeTagsManager(this)
    this._nodeDimensionsManager = new NodeDimensionsManager(this)

    drawing_area.list_g_element.unshift(this.id)
  }

  // CLEANING METHODS ===================================================================

  /**
   * Define deletion behavior
   */
  protected cleanForDeletion() {
    // 🔄 LINKS CLEANUP - RÉINTÉGRÉ DIRECTEMENT
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
    this._input_links_handle = {}
    this._output_links_handle = {}

    this._nodeTagsManager.cleanForDeletion()
    this._nodeDimensionsManager.cleanForDeletion()
    this.style.forEach(s => s.removeReference(this))
  }

  // COPY METHODS =======================================================================

  /**
   * Full copy
   */
  protected _copyFrom(_: Class_NodeElement): void {
    this.copyAttrFrom(_)
    this._tooltip_text = _._tooltip_text
    this._nodeTagsManager.copyTagsFrom(_)
    this.copyDimensionsFrom(_)
  }

  /**
   * Copy attributes from a given node
   */
  public copyAttrFrom(_: Class_NodeElement): void {
    super._copyFrom(_)
    this._name = _.name
    this._display.style = _._display.style
    this._display.attributes.copyFrom(_._display.attributes)
    this._display.position_x_label = _._display.position_x_label
    this._display.position_y_label = _._display.position_y_label
    this._display.position.u = _._display.position.u
    this._display.position.v = _._display.position.v
    this._display.position.x = _._display.position.x
    this._display.position.y = _._display.position.y
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

  public copyTagsReferencingFrom(
    node_to_copy: Class_NodeElement,
    matching_tagg: { [_: string]: string },
    matching_tags: { [_: string]: { [_: string]: string } }
  ) {
    this._nodeTagsManager.copyTagsReferencingFrom(node_to_copy, matching_tagg, matching_tags)
  }

  public copyDimensionsFrom(node_to_copy: Class_NodeElement) {
    const json_object = {}
    node_to_copy._nodeDimensionsManager.toJSON(json_object)
    this._nodeDimensionsManager.fromJSON(json_object)
    //this.copyDimensionsFrom(node_to_copy)
    //this._nodeDimensionsManager.copyDimensionsFrom(node_to_copy)
  }

  // SAVING METHODS =====================================================================

  /**
   * Convert node to JSON
   */
  protected _toJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    super._toJSON(json_object, kwargs)
    json_object['name'] = this._name

    if (this._display.position_x_label) json_object['x_label'] = this._display.position_x_label
    if (this._display.position_y_label) json_object['y_label'] = this._display.position_y_label


    if (this.style.length > 0) json_object['style'] = this.style.map(s => s.id)
    json_object['local'] = this._display.attributes.toJSON(this, null)
    if (this._display.position.dx) json_object['local']['dx'] = this._display.position.dx
    if (this._display.position.dy) json_object['local']['dy'] = this._display.position.dy

    if (this._tooltip_text) json_object['tooltip_text'] = this._tooltip_text

    // Délégation aux managers
    this._nodeTagsManager.toJSON(json_object)
    this._nodeDimensionsManager.toJSON(json_object)

    // 🔄 LINKS JSON - RÉINTÉGRÉ DIRECTEMENT  
    if (kwargs && kwargs['only_visible_elements']) {
      json_object['inputLinksId'] = this.input_links_list.filter(l => l.is_visible).map(l => l.id)
      json_object['outputLinksId'] = this.output_links_list.filter(l => l.is_visible).map(l => l.id)
      json_object['links_order'] = this._links_order.filter(l => l.is_visible).map(link => link.id)
    } else {
      json_object['inputLinksId'] = this.input_links_list.map(l => l.id)
      json_object['outputLinksId'] = this.output_links_list.map(l => l.id)
      json_object['links_order'] = this._links_order.map(link => link.id)
    }
  }

  /**
   * Assign to node implementation values from json
   */
  protected _fromJSON(json_node_object: Type_JSON, kwargs?: Type_JSON) {
    super._fromJSON(json_node_object, kwargs)

    const matching_taggs_id: { [_: string]: string } = (kwargs && kwargs['matching_taggs_id']) ? kwargs['matching_taggs_id'] as { [_: string]: string } : {}
    const matching_tags_id: { [_: string]: { [_: string]: string } } = (kwargs && kwargs['matching_tags_id']) ? kwargs['matching_tags_id'] as { [_: string]: { [_: string]: string } } : {}

    this._name = getStringFromJSON(json_node_object, 'name', this._name)
    this._display.position_x_label = getNumberOrUndefinedFromJSON(json_node_object, 'x_label')
    this._display.position_y_label = getNumberOrUndefinedFromJSON(json_node_object, 'y_label')

    if (!Array.isArray(json_node_object.style)) {
      const style_id = getStringFromJSON(json_node_object, 'style', default_style_id)
      this.style = [this.sankey.node_styles_dict[style_id]]
    } else {
      const style_id = getStringListFromJSON(json_node_object, 'style', [default_style_id])
      this.style = style_id.map(s_id => this.sankey.node_styles_dict[s_id]) as Class_NodeStyle[]
    }

    OSPFormatConverter.convertNodeFromOSPFormat(json_node_object)
    const json_local_object = getJSONOrUndefinedFromJSON(json_node_object, 'local')
    if (json_local_object) {
      this._display.attributes.fromJSON(json_local_object, this, null)
      this._display.position.dx = getNumberOrUndefinedFromJSON(json_local_object, 'dx')
      this._display.position.dy = getNumberOrUndefinedFromJSON(json_local_object, 'dy')
      const relative_dx = getNumberOrUndefinedFromJSON(json_local_object, 'relative_dx')
      if (relative_dx) {
        this._display.position.dx = relative_dx
      }
      const relative_dy = getNumberOrUndefinedFromJSON(json_local_object, 'relative_dy')
      if (relative_dy) {
        this._display.position.dy = relative_dy
      }
    }


    this._tooltip_text = getStringFromJSON(json_node_object, 'tooltip_text', '')

    // Délégation aux managers
    this._nodeTagsManager.fromJSON(json_node_object, matching_taggs_id, matching_tags_id)
  }

  // 🔄 LINKS JSON METHODS - RÉINTÉGRÉS DIRECTEMENT
  public linksFromJSON(json_node_object: Type_JSON, matching_links_id: { [_: string]: string } = {}) {
    // Input links
    getStringListFromJSON(json_node_object, 'inputLinksId', [])
      .forEach(l_id => {
        if (l_id !== 'ghost_link') {
          const link_id = matching_links_id[l_id] ?? l_id
          this.addInputLink(this.sankey.links_dict[link_id] as Class_LinkElement)
        }
      })
    // Output links
    getStringListFromJSON(json_node_object, 'outputLinksId', [])
      .forEach(l_id => {
        if (l_id !== 'ghost_link') {
          const link_id = matching_links_id[l_id] ?? l_id
          this.addOutputLink(this.sankey.links_dict[link_id] as Class_LinkElement)
        }
      })
    // Ordering
    const ordered_link_ids = getStringListFromJSON(json_node_object, 'links_order', [])
    if (ordered_link_ids.length === this._links_order.length) {
      this._links_order = ordered_link_ids
        .map(_ => {
          const link_id = matching_links_id[_] ?? _
          return this.sankey.links_dict[link_id]
        }) as Class_LinkElement[]
    }
  }

  public dimensionsFromJSON(
    json_node_object: Type_JSON,
    matching_nodes_id: { [_: string]: string } = {},
    matching_taggs_id: { [_: string]: string } = {},
    matching_tags_id: { [_: string]: { [_: string]: string } } = {},
  ) {
    this._nodeDimensionsManager.fromJSON(json_node_object, matching_nodes_id, matching_taggs_id, matching_tags_id)
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
    this._nodeDrawShape.drawShape()
    this._nodeDrawShape.updateSelectedStroke(this.is_selected)
    // 🔄 DRAW HANDLES FOR VISIBLE LINKS - RÉINTÉGRÉ DIRECTEMENT
    this.links_order_visible
      .forEach(link => {
        if (link.source === this) this._output_links_handle[link.id].draw()
        if (link.target === this) this._input_links_handle[link.id].draw()
      })
  }

  public drawShape() {
    this._process_or_bypass(() => {
      this._nodeDrawShape.drawShape()
      this._orderD3Elements()
    })
  }

  public drawNameLabel() {
    this._process_or_bypass(() => {
      this._nodeDrawNameLabel.drawNameLabel()
      this._orderD3Elements()
    })
  }

  public drawValueLabel() {
    this._process_or_bypass(() => {
      this._nodeDrawValueLabel.drawValueLabel()
      this._orderD3Elements()
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

  public drawTooltip() {
    this._nodeTooltip.drawTooltip()
  }

  // Ajouter ces méthodes dans la section PUBLIC DRAWING METHODS

  /**
   * Draw foreign object on node
   */
  public drawFO() {
    this._process_or_bypass(() => this._drawFO())
  }

  /**
   * Draw illustration on node
   */
  public drawIllustration() {
    this._process_or_bypass(() => this._drawIllustration())
  }

  /**
   * Draw image illustration on node
   */
  public drawIllustrationImage() {
    this._process_or_bypass(() => this._drawIllustrationImage())
  }

  /**
   * Draw icon illustration on node
   */
  public drawIllustrationIcon() {
    this._process_or_bypass(() => this._drawIllustrationIcon())
  }

  /**
   * Launch animation from this node
   */
  public launchAnimation() {
    const animation = new SankeyAnimation(this.drawing_area, this)
    animation.launchAnimation()
  }

  /**
   * Recursive function to return list of descendant nodes
   */
  public getListDescendantOfNode(): Class_NodeElement[] {
    let nodeList: Class_NodeElement[] = []

    this.dimensions_as_parent_pure.forEach(dim => {
      nodeList = [...nodeList, ...(dim.children as Class_NodeElement[])]
      dim.children.forEach(child => {
        const castChild = child as Class_NodeElement
        nodeList = [...nodeList, ...castChild.getListDescendantOfNode()]
      })
    })

    return [...new Set(nodeList)]
  }
  // STYLE / ATTRIBUTES METHODS =========================================================

  public useDefaultStyle() {
    this.style = [this.sankey.default_node_style as Class_NodeStyle]
  }

  public resetAttributes() {
    this._display.attributes = new Class_NodeAttribute()
    this.draw()
  }

  public resetPositionAttributes() {
    this._display.position = default_element_position
    this.draw()
  }

  public isAttributeOverloaded(attr: keyof Class_NodeAttribute) {
    if (this._display.attributes[attr] === undefined) return false
    if (this._display.attributes[attr] === this.getStyleWithAttr(attr)[attr]) return false
    return true
  }

  public isPositionOverloaded(attr: keyof Type_ElementPosition) {
    return this._display.position[attr] !== undefined
  }

  public resetPositionAttribute(attr: keyof Type_ElementPosition) {
    delete this._display.position[attr]
  }

  public isEqual(_: Class_NodeElement) {
    // Implementation de comparaison des attributs
    const compareAttrs = [
      'shape_visible', 'name_label_is_visible', 'shape_min_width', 'shape_min_height',
      'shape_color', 'shape_type', 'shape_arrow_angle_factor', 'shape_arrow_angle_direction',
      'shape_color_sustainable', 'name_label_font_family', 'name_label_font_size',
      'name_label_uppercase', 'name_label_bold', 'name_label_italic', 'name_label_box_width',
      'name_label_color', 'name_label_vert', 'name_label_vert_shift', 'name_label_horiz',
      'name_label_horiz_shift', 'value_label_is_visible', 'value_label_vert',
      'value_label_vert_shift', 'value_label_horiz', 'value_label_horiz_shift', 'value_label_font_size'
    ] as const

    return compareAttrs.every(attr => this[attr] === _[attr])
  }

  public getShapeColorToUse() { return this._nodeDrawShape.getShapeColorToUse() }

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

  // DIMENSIONS METHODS =================================================================

  public hasGivenLevelTag(tag: Class_LevelTag) {
    return this._nodeDimensionsManager.hasGivenLevelTag(tag)
  }

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
    this._nodeDimensionsManager.addAsAntiTagged(_)
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
    this._nodeDimensionsManager.removeAsAntiTagged(_)
    this.dimensionsUpdated()
  }

  public nodeDimensionAsParent(tagGroup: Class_LevelTagGroup) {
    return this._nodeDimensionsManager.nodeDimensionAsParent(tagGroup)
  }

  public nodeDimensionAsChild(tagGroup: Class_LevelTagGroup) {
    return this._nodeDimensionsManager.nodeDimensionAsChild(tagGroup)
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
    this._input_links_handle[link.id]?.delete()
    delete this._input_links_handle[link.id]
    delete this._input_links_ending_point[link.id]
    delete this._input_links[link.id]
    this.removeLinkFromOrderingLinksList(link)
  }

  public removeOutputLink(link: Class_LinkElement) {
    this._output_links_handle[link.id]?.delete()
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


  public setInputLabelVisible() { this._nodeDrawNameLabel.setInputLabelVisible() }
  public setInputLabelInvisible() { this._nodeDrawNameLabel.setInputLabelInvisible() }

  public shiftVertically(shift: number) { this._display.position.y += shift }

  /**
   * Draw given node on drawing area
   */
  protected _draw() {
    super._draw()
    this._nodeDrawNameLabel.drawNameLabel()
    this._nodeDrawValueLabel.drawValueLabel()
    this._drawIllustration()  // Ajouter cette ligne
    this._drawFO()           // Ajouter cette ligne
  }

  protected _initDraw() {
    super._initDraw()
    this.d3_selection?.attr('class', 'gg_nodes').datum(this)
    this.d3_selection?.style('display', 'inline')
    this.d3_selection?.attr('font-family', this.name_label_font_family)
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'g_node_shape') ?? null
  }

  // Ajouter ces méthodes dans la section PROTECTED METHODS

  protected _drawFO() {
    if (!this.d3_selection) return
    this.d3_selection?.select('.node_fo').remove()
    if (!this.has_fo || !this.fo_content) return
    this.d3_selection_g_FO_illustration = this.d3_selection?.append('foreignObject')
      .attr('id', this.id + '_fo')
      .attr('class', 'node_fo')
      .attr('width', this.getShapeWidthToUse())
      .attr('height', this.getShapeHeightToUse())
    this.d3_selection_g_FO_illustration?.append('xhtml:div')
      .attr('class', 'ql-editor')
      .html(this.fo_content)
  }

  protected _drawIllustration() {
    this.d3_selection?.select('.illustration').remove()
    if (this.is_image) this._drawIllustrationImage()
    if (this.icon_visible) this._drawIllustrationIcon()
  }

  protected _drawIllustrationImage() {
    if (!this.d3_selection || !this.image_src) return
    this.d3_selection_g_image = this.d3_selection?.append('image')
      .attr('id', 'image_node_' + this.id)
      .attr('class', 'illustration image')
      .attr('xlink:href', this.image_src)
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('height', this.getShapeHeightToUse() + 'px')
      .attr('width', this.getShapeWidthToUse() + 'px')
      .style('height', this.getShapeHeightToUse() + 'px')
      .style('width', this.getShapeWidthToUse() + 'px')
  }

  protected _drawIllustrationIcon() {
    if (!this.d3_selection || !this.icon_name || !this.icon_color) return
    this.d3_selection_g_icon = this.d3_selection?.append('svg')
      .attr('id', 'icon_node_' + this.id)
      .attr('class', 'illustration icon_node')
      .attr('viewBox', this.icon_view_box ? this.icon_view_box : '0 0 1000 1000')
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', this.icon_color_sustainable ? this.icon_color : this.getShapeColorToUse())
      .attr('d', this.sankey.getIconFromCatalog(this.icon_name))
  }

  /**
   * Put d3 elements in correct display order
   */
  protected _orderD3Elements() {
    this.d3_selection_g_shape?.raise()
    this.d3_selection_g_name_label?.raise()
    this.d3_selection_g_value_label?.raise()
    this.d3_selection_g_FO_illustration?.raise()
    this.d3_selection_g_image?.raise()
    this.d3_selection_g_icon?.raise()
  }

  /**
   * Apply node position to it shape in d3
   */
  protected _applyPosition() {
    if (this.d3_selection !== null) {
      // 🔄 APPLY POSITIONING - RÉINTÉGRÉ DIRECTEMENT
      if (
        (
          (this.position_type === 'relative') ||
          (this.position_type === 'parametric')
        ) &&
        (!this._drag) && (!this.sankey.drawing_area.ghost_link)
      ) {
        // Apply relative position
        if (this.position_type === 'relative') {
          if (this.hasInputLinks()) {
            // Node is export
            const input_link = this.getFirstInputLink()
            const source_node = input_link!.source
            this._display.position.x = source_node.position_x + this.position_dx + source_node.getShapeWidthToUse()
            this._display.position.y = source_node.position_y + this.position_dy + source_node.getShapeHeightToUse()
          }
          else if (this.hasOutputLinks()) {
            // Node is import
            const output_link = this.getFirstOutputLink()
            const target_node = output_link!.target
            this._display.position.x = target_node.position_x + this.position_dx - this.getShapeWidthToUse()
            this._display.position.y = target_node.position_y + this.position_dy
          }
        }
        // Apply parametric position
        else { // if (this.position_type === 'parametric')
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
              this._display.position.y = nodeAbove.position_y
                + nodeAbove.getShapeHeightToUse()
                + this.position_dy
            } else {
              // position of the first import node
              this._display.position.y = firstNonEchangeNodeBelow.position_y - 100 - this.getShapeHeightToUse() - (same_u_import.length - 1) * this.position_dy
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
              this._display.position.y = nodeAbove.position_y
                + nodeAbove.getShapeHeightToUse()
                + this.position_dy
            } else {
              let max_vertical_offset = 0
              this.sankey.visible_nodes_list.filter(n => !n.hasGivenTag(echangeTag)).forEach(n => {
                max_vertical_offset = Math.max(n.position_y + n.getShapeHeightToUse(), max_vertical_offset)
              })
              this._display.position.y = max_vertical_offset + 100
            }
          }
          else {
            const nodeAbove = same_u_other[same_u_other.indexOf(this) - 1]
            if (nodeAbove) {
              this._display.position.y = nodeAbove.position_y
                + nodeAbove.getShapeHeightToUse()
                + this.position_dy
            } else {
              if (!this.sankey.drawing_area.bypass_autoy) {
                this._display.position.y = 0
              }
            }
            if (this.position_auto_x) {
              this._display.position.x = this._display.position.u * this.position_dx
            }
          }
        }
      }

      this.input_links_list.filter(l => l.source.position_type == 'relative').forEach(l => l.source.applyPosition())
      this.output_links_list.filter(l => l.target.position_type == 'relative').forEach(l => l.target.applyPosition())

      super._applyPosition()
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
    this.updateLinksPositions()
    // Node shape -> affected if links are added or removed, or if links values change
    this._nodeDrawShape.drawShape()
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
    const node_shape = this.shape_type

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
        let node_arrow_shift = 0
        let arrows_adjustment = 0

        // Get side of target node from which arrow as to be drawn
        const link_arrow_side_right = link.target_side == 'right'
        const link_arrow_side_left = link.target_side == 'left'
        const link_arrow_side_top = link.target_side == 'top'
        const link_arrow_side_bottom = link.target_side == 'bottom'
        const link_direction_same_as_node_arrow = link_arrow_side_right || link_arrow_side_left || link_arrow_side_top || link_arrow_side_bottom

        // Thickness of the link influence arrow size
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
          arrows_adjustment,
          node_shape === 'arrow'
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
  protected updateLinksColor() { this._links_order.forEach(link => { if (link.is_visible) link.drawPath() }) }

  // EVENT HANDLING =====================================================================

  public eventSimpleLMBCLick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventSimpleLMBCLick(event)
    this._nodeEventsHandler.handleSimpleLMBClick(event)
    // OSP Extension - Ajouter cette section
    if (this.hyperlink) {
      window.open(this.hyperlink)
    }
  }

  public eventDoubleLMBCLick() {
    if (this.hyperlink) {
      window.open(this.hyperlink, '_blank', 'noopener,noreferrer')
    }
  }

  protected eventMouseDragStart(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDragStart(event)
    this._nodeEventsHandler.handleMouseDragStart(event)
  }

  protected eventMouseDrag(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDrag(event)
    if (this.drawing_area.isInSelectionMode()) {
      this.drawing_area.moveSelectedContainerFromDragEvent(event)
    }
    this._nodeEventsHandler.handleMouseDrag(event)
  }

  public eventMouseDragEnd(event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
    super.eventMouseDragEnd(event)
    if (this.drawing_area.isInSelectionMode()) {
      this._attached_container.forEach(cont => cont.draw())
      this.drawing_area.orderElementOnDA()
    }
    this._nodeEventsHandler.handleMouseDragEnd(event)
  }

  protected eventMaintainedClick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMaintainedClick(event)
    this._nodeEventsHandler.handleMaintainedClick(event)
  }

  protected eventSimpleRMBCLick(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventSimpleRMBCLick(event)
    this._nodeEventsHandler.handleSimpleRMBClick(event)
  }

  public eventMouseOver(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOver(event)
    this._nodeEventsHandler.handleMouseOver(event)
  }

  public eventMouseMove(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseMove(event)
    this._nodeEventsHandler.handleMouseMove()
  }

  public eventMouseOut(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    super.eventMouseOut(event)
    this._nodeEventsHandler.handleMouseOut()
  }

  // HISTORY METHODS ====================================================================

  public saveUndo(f: (_: Class_NodeElement) => void) {
    this.drawing_area.application_data.history.saveUndo(() => { f(this) })
  }

  public saveRedo(f: (_: Class_NodeElement) => void) {
    this.drawing_area.application_data.history.saveRedo(() => { f(this) })
  }

  // UTILITY METHODS ====================================================================

  public getStyleWithAttr(k: keyof Class_NodeStyle) {
    return this._display.style.slice().reverse().find(s => s[k] !== undefined) ?? this.sankey.default_node_style as Class_NodeStyle
  }

  public getStyleWithPositionAttr(k: keyof Type_ElementPositionOptionnal) {
    return this._display.style.slice().reverse().find(s => s.position[k as keyof Type_ElementPositionOptionnal] !== undefined) ?? this.sankey.default_node_style as Class_NodeStyle
  }

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
    const handle = new ClassTemplate_Handler(
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
        if (link.source === this && this._output_links_handle[link.id]) this._output_links_handle[link.id].draw()
        if (link.target === this && this._input_links_handle[link.id]) this._input_links_handle[link.id].draw()
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
    const handler = _event.subject as ClassTemplate_Handler
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

  public get display() { return this._display }

  public get is_visible() {
    return (
      super.is_visible &&
      this.are_related_node_tags_selected &&
      this.are_related_dimensions_selected &&
      this.are_links_visibilities_ok &&
      this.orphan_visible
    )
  }

  public get name() { return this._name }
  public set name(_: string) { this._name = _; this.drawNameLabel() }
  public get name_label() {
    if (this.name_label_separator !== '') {
      const splitted_label = this._name.split(this.name_label_separator)
      return (splitted_label.length > 1 && this.name_label_separator_part == 'after') ? splitted_label[splitted_label.length - 1] : splitted_label[0]
    }
    return this._name
  }

  public get links_order_visible(): Class_LinkElement[] { return this._links_order.filter(link => link.is_visible) }
  public get links_order(): Class_LinkElement[] { return this._links_order }

  // TAGS GETTERS =======================================================================

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
  public get level_tags_list() { return this._nodeDimensionsManager.level_tags_list }
  public get level_taggs_dict() { return this._nodeDimensionsManager.level_taggs_dict }
  public get level_taggs_list() { return this._nodeDimensionsManager.level_taggs_list }
  public get is_child() { return this._nodeDimensionsManager.is_child }
  public get is_parent() { return this._nodeDimensionsManager.is_parent }
  public get is_multi_parent() { return this._nodeDimensionsManager.is_multi_parent }
  public get dimensions_as_parent() { return this._nodeDimensionsManager.dimensions_as_parent }
  public get dimensions_as_parent_pure() { return this._nodeDimensionsManager.dimensions_as_parent_pure }
  public get is_multi_children() { return this._nodeDimensionsManager.is_multi_children }
  public get dimensions_as_child() { return this._nodeDimensionsManager.dimensions_as_child }
  public get dimensions_as_child_pure() { return this._nodeDimensionsManager.dimensions_as_child_pure }
  public get value_label() { return this._nodeDrawValueLabel.getValueLabel() }
  public get input_links_dict() { return this._input_links }
  public get input_links_list() { return Object.values(this._input_links) }
  public get output_links_dict() { return this._output_links }
  public get output_links_list() { return Object.values(this._output_links) }
  public get link_dragged(): Class_LinkElement | undefined { return this._link_dragged }
  public set link_dragged(value: Class_LinkElement | undefined) { this._link_dragged = value }
  public get style() { return this._display.style as Class_NodeStyle[] }

  public set style(_: Class_NodeStyle[]) {
    if (!_) return
    this._display.style.forEach(style => style.removeReference(this))
    this._display.style = _
    _.forEach(style => style.addReference(this))
    this.draw()
  }

  // POSITION GETTERS/SETTERS ===========================================================

  public get position_type() {
    if (this._display.position.type !== undefined) {
      return this._display.position.type
    }
    const valueOfStyle = this.getStyleWithPositionAttr('type')
    if (valueOfStyle.position.type !== undefined) {
      return valueOfStyle.position.type
    }
    return default_position_type
  }

  public set position_type(_: Type_Position) {
    this._display.position.type = _
  }

  public get position_dx() {
    if (this._display.position.dx !== undefined) {
      return this._display.position.dx
    }
    const valueOfStyle = this.getStyleWithPositionAttr('dx')
    if (valueOfStyle.position.dx !== undefined) {
      return valueOfStyle.position.dx
    }
    return default_dx
  }

  public set position_dx(_: number) {
    this._display.position.dx = _
  }

  public get position_dy() {
    if (this._display.position.dy !== undefined) {
      return this._display.position.dy
    }
    const valueOfStyle = this.getStyleWithPositionAttr('dy')
    if (valueOfStyle.position.dy !== undefined) {
      return valueOfStyle.position.dy
    }
    return default_dy
  }

  public set position_dy(_: number) {
    this._display.position.dy = _
  }

  public get position_auto_x() {
    if (this._display.position.auto_x !== undefined) {
      return this._display.position.auto_x
    }
    const valueOfStyle = this.getStyleWithPositionAttr('auto_x')
    if (valueOfStyle.position.auto_x !== undefined) {
      return valueOfStyle.position.auto_x
    }
    return default_auto_x
  }

  public set position_auto_x(_: boolean) {
    this._display.position.auto_x = _
    this.applyPosition()
  }

  public getNodeProperty(propertyName: keyof typeof NODES_ATTRIBUTES_CONFIG) {
    if (this._display.attributes[propertyName] !== undefined) {
      return this._display.attributes[propertyName]
    }
    return this.getStyleProperty(propertyName)
  }

  public getStyleProperty(propertyName: keyof typeof NODES_ATTRIBUTES_CONFIG) {
    const valueOfStyle = this.getStyleWithAttr(propertyName as keyof Class_NodeStyle)
    if (valueOfStyle[propertyName] !== undefined) {
      return valueOfStyle[propertyName]
    }
    return NODES_ATTRIBUTES_CONFIG[propertyName].default
  }

  /**
   * Setter personnalisé pour name_label_horiz avec logique spéciale
   */
  customNameLabelHoriz(value: Type_TextHPos) {
    if (value !== 'dragged') delete this._display.position_x_label
    this._display.attributes.name_label_horiz = value
  }

  /**
   * Setter personnalisé pour name_label_vert avec logique spéciale
   */
  customNameLabelVert(value: Type_TextVPos) {
    if (value !== 'dragged') delete this._display.position_y_label
    this._display.attributes.name_label_vert = value
  }

  /**
   * Setter personnalisé pour value_label_horiz avec logique spéciale
   */
  customValueLabelHoriz(value: Type_TextHPos) {
    this._display.attributes.value_label_horiz = value
    this._display.attributes.value_label_vert = (this._display.attributes.value_label_vert == 'dragged' && value !== 'dragged') ? 'middle' : this._display.attributes.value_label_vert
  }

  /**
   * Setter personnalisé pour value_label_vert avec logique spéciale
   */
  customValueLabelVert(value: Type_TextVPos) {
    this._display.attributes.value_label_vert = value
    this._display.attributes.value_label_horiz = (this._display.attributes.value_label_horiz == 'dragged' && value !== 'dragged') ? 'middle' : this._display.attributes.value_label_horiz
  }

  public get tooltip_text() { return this._tooltip_text }
  public set tooltip_text(_: string) { this._tooltip_text = _ }

  public get attached_container(): Class_ContainerElement[] { return this._attached_container }

  public get master_node() { return this._master_node }
  public set master_node(_) {
    this._master_node = _
    _?.add_slave_nodes(this)
  }
  public get slave_nodes() { return this._slave_nodes }
  public add_slave_nodes(_: Class_NodeElement) { this._slave_nodes.push(_) }
  public get sibling() { return this._sibling_node }
  public set sibling(_) { this._sibling_node = _ }

  public get are_related_node_tags_selected(): boolean {
    if (
      (this._are_related_node_tags_selected === undefined) ||
      (this.sankey.node_tags_fingerprint !== this._node_tags_fingerprint)
    ) {
      let are_related_node_tags_selected: boolean
      const list_tag = this.tags_list
      if (list_tag.length > 0) {
        let display = true
        Object.values(this._taggs_dict).forEach(tag_list => {
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
    if (this.input_links_list.length + this.output_links_list.length == 0) {
      if (this.orphan_node_visible) return true
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
          const name = extremity_node.id + '-' + node_parent.id + (importation ? 'Importations' : 'Exportations');
          (dim.parent_level_tag as Class_LevelTag).getOrCreateLowerDimension(
            this.sankey.nodes_dict[name],
            new_node,
            dim.child_level_tag as Class_LevelTag
          )
        })

      // Continue with rest of the implementation...
      this.tags_list.forEach(tag => {
        new_node.addTag(tag)
      })

      // Style handling
      const node_importation_style = this.position_type !== 'parametric' ? 'NodeImportCloseStyle' : 'NodeImportAboveStyle'
      const node_exportation_style = this.position_type !== 'parametric' ? 'NodeExportCloseStyle' : 'NodeExportBelowStyle'
      const node_importexport_style = this.position_type !== 'parametric' ? 'NodeImportExportCloseStyle' : 'NodeImportExportAboveBelowStyle'
      const link_importation_style = this.position_type !== 'parametric' ? 'LinkImportCloseStyle' : 'LinkImportAboveStyle'
      const link_exportation_style = this.position_type !== 'parametric' ? 'LinkExportCloseStyle' : 'LinkExportBelowStyle'
      const link_importexport_style = this.position_type !== 'parametric' ? 'LinkImportExportCloseStyle' : 'LinkImportExportAboveBelowStyle'

      new_node.style = [
        new_node.sankey.node_styles_dict['NodeSectorStyle'] as Class_NodeStyle,
        new_node.sankey.node_styles_dict[node_importexport_style] as Class_NodeStyle,
        importation ?
          new_node.sankey.node_styles_dict[node_importation_style] as Class_NodeStyle :
          new_node.sankey.node_styles_dict[node_exportation_style] as Class_NodeStyle
      ]

      input_or_output_link.style = [
        new_node.sankey.link_styles_dict[link_importexport_style] as Class_LinkStyle,
        importation ?
          new_node.sankey.link_styles_dict[link_importation_style] as Class_LinkStyle :
          new_node.sankey.link_styles_dict[link_exportation_style] as Class_LinkStyle
      ]

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

  // DRAG STATE MANAGEMENT ==============================================================

  public setDragStartPositions(positions: { [x: string]: [number, number] }) { this._drag_start_pos = positions }
  public getDragStartPositions(): { [x: string]: [number, number] } { return this._drag_start_pos }
  public setDragState(drag: boolean) { this._drag = drag }
  public getDragState(): boolean { return this._drag }
  public setLinkDragged(link: Class_LinkElement | undefined) { this._link_dragged = link }
  public getLinkDragged(): Class_LinkElement | undefined { return this._link_dragged }
  public setFirstDragMove(value: boolean) { this.first_drag_move = value }
  public getFirstDragMove(): boolean { return this.first_drag_move }
  public updateNodeCurrentDelta(dx: number, dy: number) { this._node_current_dx += dx; this._node_current_dy += dy }
  public resetNodeCurrentDelta() { this._node_current_dx = 0; this._node_current_dy = 0 }
  public getNodeCurrentDeltas(): { dx: number, dy: number } {
    return { dx: this._node_current_dx, dy: this._node_current_dy }
  }

  // REMAINING MANAGERS DATA ACCESS =====================================================

  public get internalTagsData() { return { tags: this._tags, taggs_dict: this._taggs_dict } }
  public get internalDimensionsData() {
    return {
      dimensions_as_parent: this._dimensions_as_parent,
      dimensions_as_child: this._dimensions_as_child,
      leveltaggs_as_antitagged: this._leveltaggs_as_antitagged
    }
  }
  public get internalDrawingElements() {
    return {
      d3_selection_g_shape: this.d3_selection_g_shape,
      d3_selection_g_name_label: this.d3_selection_g_name_label,
      d3_selection_g_value_label: this.d3_selection_g_value_label
    }
  }
  public setInternalDrawingElements(elements: {
    d3_selection_g_shape?: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null,
    d3_selection_g_name_label?: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null,
    d3_selection_g_value_label?: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null
  }) {
    if (elements.d3_selection_g_shape !== undefined) this.d3_selection_g_shape = elements.d3_selection_g_shape
    if (elements.d3_selection_g_name_label !== undefined) this.d3_selection_g_name_label = elements.d3_selection_g_name_label
    if (elements.d3_selection_g_value_label !== undefined) this.d3_selection_g_value_label = elements.d3_selection_g_value_label
  }
}
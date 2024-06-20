// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

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
  Class_LinkElement
} from './Link'

// Local functions
import {
  PathNodeArrowShape
} from '../draw/SankeyDrawFunction'


// SPECIFIC TYPES ***********************************************************************

type Type_Shape = 'ellipse' | 'rect' | 'arrow'

// SPECIFIC CONSTANTS *******************************************************************

const default_shape_type: Type_Shape = 'rect'
const default_shape_arrow_angle_factor = 30
const default_shape_arrow_angle_direction = 'right'
const default_shape_visible = true
const default_shape_min_width = 40
const default_shape_min_height = 40
const default_shape_color = default_element_color
const default_shape_color_sustainable = false
const default_label_font_family = default_font
const default_label_font_size = 14
const default_label_color = false
const default_label_uppercase = false
const default_label_bold = false
const default_label_italic = false
const default_label_background = false
const default_name_label_visible = true
const default_name_label_vert = 'bottom'
const default_name_label_horiz = 'middle'
const default_value_label_visible = false
const default_value_label_vert = 'top'
const default_value_label_horiz  = 'middle'
const default_label_box_width = 150

// CLASS NODE_ELEMENT *******************************************************************

/**
 * Class that define a node element and how to interact with it
 *
 * @class Class_NodeElement
 * @extends {Class_Element}
 */
export class Class_NodeElement extends Class_Element {

  // PUBLIC ATTRIBUTES ==================================================================

  // Level & Parent
  // TODO link with other nodes directly
  dimensions: {
    [_: string]: {
      parent_name?: string,
      level?: number,
    }
  } = {}

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

  // Tags
  private _tags: { [_: string]: Class_Tag } = {}

  // Arrows
  // TODO deplacer dans shape
  private arrow_angle_factor: number = 10
  private arrow_angle_direction: string = 'hh'

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
  }

  /**
   * Define deletion behavior
   * @memberof Class_Node
   */
  public delete() {
    // Delete on drawing area
    this.unDraw()
    // Delete related links
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
    // Unref tag
    Object.values(this._tags)
      .forEach(tag => {
        tag.removeReference(this)
      })
    this._tags = {}
  }

  // GETTERS / SETTERS ==================================================================

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
    this.drawLabel()
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
   * Get node value formatted as label
   * @readonly
   * @memberof Class_NodeElement
   */
  public get value_label() {
    // TODO compute value
    return 'NO VALUE'
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
   * Get list of all input link
   * @readonly
   * @memberof Class_NodeElement
   */
  public get input_links_list() {
    return Object.values(this._input_links)
  }

  /**
   * TODO Description
   * @readonly
   * @memberof Class_NodeElement
   */
  public get width() {
    /*
    TODO : the width depend of the sum of input/output links from top or bottom of the node
    if the sum is superior to node width the use the max of input/output

    (to see exemple, look function SetNodeHeight )

    */
    return this.shape_min_width
  }

  /**
   * TODO Description
   * @readonly
   * @memberof Class_NodeElement
   */
  public get height() {
    /*
    TODO : the height depend of the sum of input/output links from left or right of the node
    if the sum is superior to node height the use the max of input/output

    (to see exemple, look function SetNodeHeight )

    */
    return this.shape_min_height
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
    this.reset()
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
    this.drawShape()
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
    this.drawShape()
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
  public set shape_arrow_angle_direction(_: string) {
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
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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
  public set name_label_vert(_: string) {
    this._display.attributes.name_label_vert = _
    this.drawLabel()
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
  public set name_label_horiz(_: string) {
    this._display.attributes.name_label_horiz = _
    this.drawLabel()
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
    this.drawLabel()
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
    this.drawLabel()
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

  /**
   *
   TODO Description * @memberof Class_NodeElement
   */
  public set value_label_vert(_: string) {
    this._display.attributes.value_label_vert = _
    this.drawLabel()
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
  public set label_horiz_valeur(_: string) {
    this._display.attributes.value_label_horiz = _
    this.drawLabel()
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
    this.drawLabel()
  }

  // PROTECTED METHODS ==================================================================

  /**
   * Draw given node on drawing area
   *
   * @protected
   * @memberof Class_NodeElement
   */
  protected draw() {
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
    this.drawLabel()
  }

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
        this.showTooltip()
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
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Get related drawing area
    const drawing_area = this.drawing_area
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      /* TODO définir  */
    }
    // SELECTION MODE =========================================================
    else {
      // Set position
      const mouse_position = d3.pointer(event)
      // Update node position
      this.setPosXY(mouse_position[0], mouse_position[1])
    }
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw node shape on d3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawShape() {
    const node_shape = this.shape_type
    const min_width = this.width
    const min_height = this.height
    const node_visible = this.shape_visible
    const node_color = this.shape_color
    // Get drawing scale
    const scale = d3.scaleLinear()
      .range([0, 100])
      .domain([0, this.drawing_area.scale])
    // Clean previous shape
    this.d3_selection?.selectAll(' .node_shape').remove()
    // Apply shape value
    if (node_shape === 'rect') {
      this.d3_selection?.append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('width', min_width)
        .attr('height', min_height)
    }
    else if (node_shape === 'ellipse') {
      this.d3_selection?.append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', min_width / 2)
        .attr('cy', min_height / 2)
        .attr('rx', min_width / 2)
        .attr('ry', min_height / 2)
    }
    else if (node_shape === 'arrow') {
      this.d3_selection?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', () => {
          const n_w = min_width
          const n_h = min_height
          const k_angle = this.arrow_angle_factor
          const angle_direction = this.arrow_angle_direction
          const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction, scale)
          return path
        })
    }
    // Apply common properties
    this.d3_selection?.selectAll('.node_shape')
      .attr('id', this.id)
      .attr('fill-opacity', node_visible ? '1' : '0')
      .attr('fill', node_color)
      .style('stroke', 'black')
  }

  /**
   * Draw node label on D3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawLabel() {
    // Get variable property for node label
    // Clean previous label
    this.d3_selection?.selectAll('.label').remove()
    // Add name label
    if (this.name_label_visible) {
      const width = this.width as number
      const height = this.height as number

      // ================================================================
      // Create some variable that depend on the value of some of the above
      // ================================================================

      // Init pos_x_label as if it was at the right of the node
      let pos_x_label = width
      if (this.name_label_horiz === 'left') {
        pos_x_label = 0
      } else if (this.name_label_horiz === 'middle') {
        pos_x_label = width / 2
      }

      // Init text_anchor_label as if it was at the rights of the node
      let text_anchor_label = 'start'
      if (this.name_label_horiz == 'left') {
        text_anchor_label = 'end'
      } else if (this.name_label_horiz == 'middle') {
        text_anchor_label = 'middle'
      }

      // Init pos_y_label as if it was at the bottom of the node
      let pos_y_label = height + this.name_label_font_size
      if (this.name_label_vert === 'top') {
        pos_y_label = 0
      } else if (this.name_label_vert === 'middle') {
        pos_y_label = height / 2
      }

      // Add name label background
      if (this.name_label_background) {
        this.d3_selection?.append('rect')
          .classed('label', true)
          .classed('label_background', true)
          .attr('id', 'label_background_' + this.id)
          .attr('x', pos_x_label)
          .attr('y', pos_y_label)
          .attr('width', this.name_label.length * (this.name_label_font_size as number))
          .attr('height', (this.name_label_font_size as number))
          .attr('fill', 'white')
          .attr('fill-opacity', 0.55)
          .attr('rx', 4)
          .style('stroke', 'none')
      }
      // Add name label text
      this.d3_selection?.append('text')
        .classed('label', true)
        .classed('label_text', true)
        .attr('fill', this.name_label_color ? 'white' : 'black')
        .attr('id', 'label_text_' + this.id)
        .attr('x', pos_x_label)
        .attr('y', pos_y_label)
        .attr('text-anchor', text_anchor_label)
        .style('text-align', 'center')
        .style('font-weight', this.name_label_bold ? 'bold' : 'normal')
        .style('font-style', this.name_label_italic ? 'italic' : 'normal')
        .style('font-size', String(this.name_label_font_size) + 'px')
        .style('font-family', this.name_label_font_family)
        .style('stroke', 'none')
        .style('text-transform', this.name_label_uppercase ? 'uppercase' : 'none')
        .text(this.name_label)
      // TODO add text wrap -> .each(n => TextNodeWrap((n as SankeyNode),data))
      // Add an input to change the name of the node
      // The input appear when we double click on the label
      if (!this.drawing_area.static) {
        this.d3_selection?.append('foreignObject')
          .classed('label', true)
          .classed('label_fo_input', true)
          .attr('x', width)
          .attr('y', height)
          .style('width', String(this._name.length) + 'rem')
          .attr('height', Number(this.name_label_font_size) + 2)
          .style('display', 'none')
          .append('xhtml:div')
          .append('input')
          .classed('label', true)
          .classed('label_input', true)
          .attr('id', 'input_label_' + this.id)
          .attr('type', 'text')
          .attr('value', this._name)
          .style('font-size', String(this.name_label_font_size) + 'px')
      }
    }
  }

  // Display tooltip
  private showTooltip() {
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

  // PUBLIC METHODS =====================================================================

  public removeTag(tag: Class_Tag) {
    if (this._tags[tag.id] !== undefined) {
      delete this._tags[tag.id]
      tag.removeReference(this)
    }
  }

  public useDefaultStyle() {
    this.style = this.drawing_area.sankey.default_node_style
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
    if (!this._input_links[link.id]) this._input_links[link.id] = link
  }
  public addOutputLink(link: Class_LinkElement) {
    if (!this._output_links[link.id]) this._output_links[link.id] = link
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
}

// CLASS NODE ATTRIBUTES ****************************************************************

/**
 * Define all attributes that can be apply to a node
 *
 * @export
 * @class Class_NodeAttribute
 */
export class Class_NodeAttribute {

  // PUBLIC ATTRIBUTES ==================================================================

  // Parameters for shape
  protected _shape_visible?: boolean
  protected _shape_type?: Type_Shape
  protected _shape_min_width?: number
  protected _shape_min_height?: number
  protected _shape_color?: string
  protected _shape_color_sustainable?: boolean
  protected _shape_arrow_angle_factor?: number
  protected _shape_arrow_angle_direction?: string

  // Parameter of node label
  protected _name_label_visible?: boolean
  protected _name_label_font_family?: string
  protected _name_label_font_size?: number
  protected _name_label_uppercase?: boolean
  protected _name_label_bold?: boolean
  protected _name_label_italic?: boolean
  protected _name_label_box_width?: number
  protected _name_label_color?: boolean
  protected _name_label_vert?: string
  protected _name_label_horiz?: string
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
  protected _value_label_vert?: string
  protected _value_label_horiz?: string
  protected _value_label_background?: boolean

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
  public set shape_visible(_: boolean | undefined) { this._shape_visible = _ }
  public set shape_type(_: Type_Shape | undefined) { this._shape_type = _ }
  public set shape_min_width(_: number | undefined) { this._shape_min_width = _ }
  public set shape_min_height(_: number | undefined) { this._shape_min_height = _ }
  public set shape_color(_: string | undefined) { this._shape_color = _ }
  public set shape_color_sustainable(_: boolean | undefined) { this._shape_color_sustainable = _ }
  public set shape_arrow_angle_factor(_: number | undefined) { this._shape_arrow_angle_factor = _ }
  public set shape_arrow_angle_direction(_: string | undefined) { this._shape_arrow_angle_direction = _ }

  // Parameter of node label
  public set name_label_visible(_: boolean | undefined) { this._name_label_visible = _ }
  public set name_label_font_family(_: string | undefined) { this._name_label_font_family = _ }
  public set name_label_font_size(_: number | undefined) { this._name_label_font_size = _ }
  public set name_label_uppercase(_: boolean | undefined) { this._name_label_uppercase = _ }
  public set name_label_bold(_: boolean | undefined) { this._name_label_bold = _ }
  public set name_label_italic(_: boolean | undefined) { this._name_label_italic = _ }
  public set name_label_box_width(_: number | undefined) { this._name_label_box_width = _ }
  public set name_label_color(_: boolean | undefined) { this._name_label_color = _ }
  public set name_label_vert(_: string | undefined) { this._name_label_vert = _ }
  public set name_label_horiz(_: string | undefined) { this._name_label_horiz = _ }
  public set name_label_background(_: boolean | undefined) { this._name_label_background = _ }

  // Parameter of node value label
  public set value_label_visible(_: boolean | undefined) { this._value_label_visible = _ }
  public set value_label_font_family(_: string | undefined) { this._value_label_font_family = _ }
  public set value_label_font_size(_: number | undefined) { this._value_label_font_size = _ }
  public set value_label_uppercase(_: boolean | undefined) { this._value_label_uppercase = _ }
  public set value_label_bold(_: boolean | undefined) { this._value_label_bold = _ }
  public set value_label_italic(_: boolean | undefined) { this._value_label_italic = _ }
  public set value_label_box_width(_: number | undefined) { this._value_label_box_width = _ }
  public set value_label_color(_: boolean | undefined) { this._value_label_color = _ }
  public set value_label_vert(_: string | undefined) { this._value_label_vert = _ }
  public set value_label_horiz(_: string | undefined) { this._value_label_horiz = _ }
  public set value_label_background(_: boolean | undefined) { this._value_label_background = _ }
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

  private _is_deletable: boolean

  private _references: {[_: string]: Class_NodeElement} = {}

  // CONSTRUCTOR ========================================================================
  constructor(
    is_deletable: boolean = true
  ) {
    super()
    // Set as deletable or not
    this._is_deletable = is_deletable

    // Parameters for shape
    this.shape_visible = default_shape_visible
    this.shape_type = default_shape_type
    this.shape_min_width = default_shape_min_width
    this.shape_min_height = default_shape_min_height
    this.shape_color = default_shape_color
    this.shape_color_sustainable = default_shape_color_sustainable
    this.shape_arrow_angle_factor = default_shape_arrow_angle_factor
    this.shape_arrow_angle_direction = default_shape_arrow_angle_direction

    // Parameter of node label
    this.name_label_visible = default_name_label_visible
    this.name_label_font_family = default_label_font_family
    this.name_label_font_size = default_label_font_size
    this.name_label_uppercase = default_label_uppercase
    this.name_label_bold = default_label_bold
    this.name_label_italic = default_label_italic
    this.name_label_box_width = default_label_box_width
    this.name_label_color = default_label_color
    this.name_label_vert = default_name_label_vert
    this.name_label_horiz = default_name_label_horiz
    this.name_label_background = default_label_background

    // Parameter of node value label
    this.value_label_visible = default_value_label_visible
    this.value_label_font_family = default_label_font_family
    this.value_label_font_size = default_label_font_size
    this.value_label_uppercase = default_label_uppercase
    this.value_label_bold = default_label_bold
    this.value_label_italic = default_label_italic
    this.value_label_box_width = default_label_box_width
    this.value_label_color = default_label_color
    this.value_label_vert = default_value_label_vert
    this.value_label_horiz = default_value_label_horiz
    this.value_label_background = default_label_background
  }

  public delete() {
    // Switch all refs to default style
    Object.values(this._references)
      .forEach(ref => ref.useDefaultStyle())
    this._references = {}
    // Garbage collector will do the rest....
  }

  // SETTERS ============================================================================

  // Parameters for shape
  public set shape_visible(_: boolean) { this._shape_visible = _; this.updateReferencesDraw() }
  public set shape_type(_: Type_Shape) { this._shape_type = _; this.updateReferencesDraw() }
  public set shape_min_width(_: number) { this._shape_min_width = _; this.updateReferencesDraw() }
  public set shape_min_height(_: number) { this._shape_min_height = _; this.updateReferencesDraw() }
  public set shape_color(_: string) { this._shape_color = _; this.updateReferencesDraw() }
  public set shape_color_sustainable(_: boolean) { this._shape_color_sustainable = _; this.updateReferencesDraw() }
  public set shape_arrow_angle_factor(_: number) { this._shape_arrow_angle_factor = _; this.updateReferencesDraw() }
  public set shape_arrow_angle_direction(_: string) { this._shape_arrow_angle_direction = _; this.updateReferencesDraw() }

  // Parameter of node label
  public set name_label_visible(_: boolean) { this._name_label_visible = _; this.updateReferencesDraw() }
  public set name_label_font_family(_: string) { this._name_label_font_family = _; this.updateReferencesDraw() }
  public set name_label_font_size(_: number) { this._name_label_font_size = _; this.updateReferencesDraw() }
  public set name_label_uppercase(_: boolean) { this._name_label_uppercase = _; this.updateReferencesDraw() }
  public set name_label_bold(_: boolean) { this._name_label_bold = _; this.updateReferencesDraw() }
  public set name_label_italic(_: boolean) { this._name_label_italic = _; this.updateReferencesDraw() }
  public set name_label_box_width(_: number) { this._name_label_box_width = _; this.updateReferencesDraw() }
  public set name_label_color(_: boolean) { this._name_label_color = _; this.updateReferencesDraw() }
  public set name_label_vert(_: string) { this._name_label_vert = _; this.updateReferencesDraw() }
  public set name_label_horiz(_: string) { this._name_label_horiz = _; this.updateReferencesDraw() }
  public set name_label_background(_: boolean) { this._name_label_background = _; this.updateReferencesDraw() }

  // Parameter of node value label
  public set value_label_visible(_: boolean) { this._value_label_visible = _; this.updateReferencesDraw() }
  public set value_label_font_family(_: string) { this._value_label_font_family = _; this.updateReferencesDraw() }
  public set value_label_font_size(_: number) { this._value_label_font_size = _; this.updateReferencesDraw() }
  public set value_label_uppercase(_: boolean) { this._value_label_uppercase = _; this.updateReferencesDraw() }
  public set value_label_bold(_: boolean) { this._value_label_bold = _; this.updateReferencesDraw() }
  public set value_label_italic(_: boolean) { this._value_label_italic = _; this.updateReferencesDraw() }
  public set value_label_box_width(_: number) { this._value_label_box_width = _; this.updateReferencesDraw() }
  public set value_label_color(_: boolean) { this._value_label_color = _; this.updateReferencesDraw() }
  public set value_label_vert(_: string) { this._value_label_vert = _; this.updateReferencesDraw() }
  public set value_label_horiz(_: string) { this._value_label_horiz = _; this.updateReferencesDraw() }
  public set value_label_background(_: boolean) { this._value_label_background = _; this.updateReferencesDraw() }

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

  // PRIVATE METHODS ======================================================================

  private updateReferencesDraw() {
    Object.values(this._references)
      .forEach(ref => ref.reset())
  }
}

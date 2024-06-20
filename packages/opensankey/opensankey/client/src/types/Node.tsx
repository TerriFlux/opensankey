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
    local: Class_NodeAttribute
    style: Class_NodeAttribute
  }

  // PRIVATE ATTRIBUTES =================================================================

  // Name
  private _name: string

  // Name Labels
  private _name_label_separator: string = ''

  // Tags
  private _tags: { [_: string]: Class_Tag } = {}

  // Related links
  private _input_links: { [_: string]: Class_LinkElement } = {}
  private _output_links: { [_: string]: Class_LinkElement } = {}

  // Arrows
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
      style: default_node_style,
      local: new Class_NodeAttribute()
    }
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
    return this.min_width
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
    return this.min_height
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
  public set style(new_style: Class_NodeStyle) {
    this._display.style = new_style
    this.reset()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape_visible() {
    if (this._display.local.shape_visible !== undefined) {
      return this._display.local.shape_visible
    } else if (this._display.style.shape_visible !== undefined) {
      return this._display.style.shape_visible
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape_visible(_: boolean) {
    this._display.local.shape_visible = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get min_width() {
    if (this._display.local.min_width !== undefined) {
      return this._display.local.min_width
    } else if (this._display.style.min_width !== undefined) {
      return this._display.style.min_width
    }
    return 0
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set min_width(_: number) {
    this._display.local.min_width = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get min_height() {
    if (this._display.local.min_height !== undefined) {
      return this._display.local.min_height
    } else if (this._display.style.min_height !== undefined) {
      return this._display.style.min_height
    }
    return 0
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set min_height(_: number) {
    this._display.local.min_height = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get color() {
    if (this._display.local.color !== undefined) {
      return this._display.local.color
    } else if (this._display.style.color !== undefined) {
      return this._display.style.color
    }
    return ''
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set color(_: string) {
    this._display.local.color = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get shape() {
    if (this._display.local.shape !== undefined) {
      return this._display.local.shape
    } else if (this._display.style.shape !== undefined) {
      return this._display.style.shape
    }
    return 'rect'
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set shape(_: 'ellipse' | 'rect' | 'arrow') {
    this._display.local.shape = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get node_arrow_angle_factor() {
    if (this._display.local.node_arrow_angle_factor !== undefined) {
      return this._display.local.node_arrow_angle_factor
    } else if (this._display.style.node_arrow_angle_factor !== undefined) {
      return this._display.style.node_arrow_angle_factor
    }
    return 0
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set node_arrow_angle_factor(_: number) {
    this._display.local.node_arrow_angle_factor = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get node_arrow_angle_direction() {
    if (this._display.local.node_arrow_angle_direction !== undefined) {
      return this._display.local.node_arrow_angle_direction
    } else if (this._display.style.node_arrow_angle_direction !== undefined) {
      return this._display.style.node_arrow_angle_direction
    }
    return 'right'
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set node_arrow_angle_direction(_: string) {
    this._display.local.node_arrow_angle_direction = _
    this.drawShape()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get color_sustainable() {
    if (this._display.local.color_sustainable !== undefined) {
      return this._display.local.color_sustainable
    } else if (this._display.style.color_sustainable !== undefined) {
      return this._display.style.color_sustainable
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set color_sustainable(_: boolean) {
    this._display.local.color_sustainable = _
    this.drawShape()
  }


  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_visible() {
    if (this._display.local.label_visible !== undefined) {
      return this._display.local.label_visible
    } else if (this._display.style.label_visible !== undefined) {
      return this._display.style.label_visible
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_visible(_: boolean) {
    this._display.local.label_visible = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get font_family() {
    if (this._display.local.font_family !== undefined) {
      return this._display.local.font_family
    } else if (this._display.style.font_family !== undefined) {
      return this._display.style.font_family
    }
    return ''
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set font_family(_: string) {
    this._display.local.font_family = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get font_size() {
    if (this._display.local.font_size !== undefined) {
      return this._display.local.font_size
    } else if (this._display.style.font_size !== undefined) {
      return this._display.style.font_size
    }
    return 10
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set font_size(_: number) {
    this._display.local.font_size = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get uppercase() {
    if (this._display.local.uppercase !== undefined) {
      return this._display.local.uppercase
    } else if (this._display.style.uppercase !== undefined) {
      return this._display.style.uppercase
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set uppercase(_: boolean) {
    this._display.local.uppercase = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get bold() {
    if (this._display.local.bold !== undefined) {
      return this._display.local.bold
    } else if (this._display.style.bold !== undefined) {
      return this._display.style.bold
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set bold(_: boolean) {
    this._display.local.bold = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get italic() {
    if (this._display.local.italic !== undefined) {
      return this._display.local.italic
    } else if (this._display.style.italic !== undefined) {
      return this._display.style.italic
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set italic(_: boolean) {
    this._display.local.italic = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_box_width() {
    if (this._display.local.label_box_width !== undefined) {
      return this._display.local.label_box_width
    } else if (this._display.style.label_box_width !== undefined) {
      return this._display.style.label_box_width
    }
    return 0
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_box_width(_: number) {
    this._display.local.label_box_width = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_color() {
    if (this._display.local.label_color !== undefined) {
      return this._display.local.label_color
    } else if (this._display.style.label_color !== undefined) {
      return this._display.style.label_color
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_color(_: boolean) {
    this._display.local.label_color = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_vert() {
    if (this._display.local.label_vert !== undefined) {
      return this._display.local.label_vert
    } else if (this._display.style.label_vert !== undefined) {
      return this._display.style.label_vert
    }
    return ''
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_vert(_: string) {
    this._display.local.label_vert = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_horiz() {
    if (this._display.local.label_horiz !== undefined) {
      return this._display.local.label_horiz
    } else if (this._display.style.label_horiz !== undefined) {
      return this._display.style.label_horiz
    }
    return ''
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_horiz(_: string) {
    this._display.local.label_horiz = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_background() {
    if (this._display.local.label_background !== undefined) {
      return this._display.local.label_background
    } else if (this._display.style.label_background !== undefined) {
      return this._display.style.label_background
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_background(_: boolean) {
    this._display.local.label_background = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get show_value() {
    if (this._display.local.show_value !== undefined) {
      return this._display.local.show_value
    } else if (this._display.style.show_value !== undefined) {
      return this._display.style.show_value
    }
    return false
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set show_value(_: boolean) {
    this._display.local.show_value = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_vert_valeur() {
    if (this._display.local.label_vert_valeur !== undefined) {
      return this._display.local.label_vert_valeur
    } else if (this._display.style.label_vert_valeur !== undefined) {
      return this._display.style.label_vert_valeur
    }
    return ''
  }

  /**
   *
   TODO Description * @memberof Class_NodeElement
   */
  public set label_vert_valeur(_: string) {
    this._display.local.label_vert_valeur = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get label_horiz_valeur() {
    if (this._display.local.label_horiz_valeur !== undefined) {
      return this._display.local.label_horiz_valeur
    } else if (this._display.style.label_horiz_valeur !== undefined) {
      return this._display.style.label_horiz_valeur
    }
    return ''
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set label_horiz_valeur(_: string) {
    this._display.local.label_horiz_valeur = _
    this.drawLabel()
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public get value_font_size() {
    if (this._display.local.value_font_size !== undefined) {
      return this._display.local.value_font_size
    } else if (this._display.style.value_font_size !== undefined) {
      return this._display.style.value_font_size
    }
    return 0
  }

  /**
   * TODO Description
   * @memberof Class_NodeElement
   */
  public set value_font_size(_: number) {
    this._display.local.value_font_size = _
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
    this.d3_selection?.style('font-family', this.font_family)
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
          // if (!input_link?.display.shape.getVisible()) {
          //   return 'translate(0, 0)'
          // }

          // use '!.source' because linter think it input_link can be undefined but we verified with hasInputLinks()
          const source_node = input_link!.source
          // if (!source_node.display.shape.getVisible()) {
          if (!source_node.shape_visible) {
            return 'translate(0, 0)'
          }
          x = source_node.position_x + this.position_x
          y = source_node.position_y + this.position_y
        }
        else if (this.hasOutputLinks()) {
          // Node is import
          const output_link = this.getFirstOutputLink()
          // if (!output_link?.display.shape.getVisible()) {
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
    /* TODO définir  */
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Draw node shape on d3 svg
   * @private
   * @memberof Class_NodeElement
   */
  private drawShape() {
    const node_shape = this.shape
    const min_width = this.width
    const min_height = this.height
    const node_visible = this.shape_visible
    const node_color = this.color
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
    if (this.label_visible) {
      const width = this.width as number
      const height = this.height as number

      // ================================================================
      // Create some variable that depend on the value of some of the above
      // ================================================================

      // Init pos_x_label as if it was at the right of the node
      let pos_x_label = width
      if (this.label_horiz === 'left') {
        pos_x_label = 0
      } else if (this.label_horiz === 'middle') {
        pos_x_label = width / 2
      }

      // Init text_anchor_label as if it was at the rights of the node
      let text_anchor_label = 'start'
      if (this.label_horiz == 'left') {
        text_anchor_label = 'end'
      } else if (this.label_horiz == 'middle') {
        text_anchor_label = 'middle'
      }

      // Init pos_y_label as if it was at the bottom of the node
      let pos_y_label = height + this.font_size
      if (this.label_vert === 'top') {
        pos_y_label = 0
      } else if (this.label_vert === 'middle') {
        pos_y_label = height / 2
      }

      // Add name label background
      if (this.label_background) {
        this.d3_selection?.append('rect')
          .classed('label', true)
          .classed('label_background', true)
          .attr('id', 'label_background_' + this.id)
          .attr('x', pos_x_label)
          .attr('y', pos_y_label)
          .attr('width', this.name_label.length * (this.font_size as number))
          .attr('height', (this.font_size as number))
          .attr('fill', 'white')
          .attr('fill-opacity', 0.55)
          .attr('rx', 4)
          .style('stroke', 'none')
      }
      // Add name label text
      this.d3_selection?.append('text')
        .classed('label', true)
        .classed('label_text', true)
        .attr('fill', this.label_color ? 'white' : 'black')
        .attr('id', 'label_text_' + this.id)
        .attr('x', pos_x_label)
        .attr('y', pos_y_label)
        .attr('text-anchor', text_anchor_label)
        .style('text-align', 'center')
        .style('font-weight', this.bold ? 'bold' : 'normal')
        .style('font-style', this.italic ? 'italic' : 'normal')
        .style('font-size', String(this.font_size) + 'px')
        .style('font-family', this.font_family)
        .style('stroke', 'none')
        .style('text-transform', this.uppercase ? 'uppercase' : 'none')
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
          .attr('height', Number(this.font_size) + 2)
          .style('display', 'none')
          .append('xhtml:div')
          .append('input')
          .classed('label', true)
          .classed('label_input', true)
          .attr('id', 'input_label_' + this.id)
          .attr('type', 'text')
          .attr('value', this._name)
          .style('font-size', String(this.font_size) + 'px')
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

  public deRefTag(tag: Class_Tag) {
    delete this._tags[tag.id]
  }

  public isEqual(_: Class_NodeElement) {

    if (this.shape_visible !== _.shape_visible) {
      return false
    }
    if (this.label_visible !== _.label_visible) {
      return false
    }
    if (this.min_width !== _.min_width) {
      return false
    }
    if (this.min_height !== _.min_height) {
      return false
    }
    if (this.color !== _.color) {
      return false
    }
    if (this.shape !== _.shape) {
      return false
    }
    if (this.node_arrow_angle_factor !== _.node_arrow_angle_factor) {
      return false
    }
    if (this.node_arrow_angle_direction !== _.node_arrow_angle_direction) {
      return false
    }
    if (this.color_sustainable !== _.color_sustainable) {
      return false
    }
    if (this.font_family !== _.font_family) {
      return false
    }
    if (this.font_size !== _.font_size) {
      return false
    }
    if (this.uppercase !== _.uppercase) {
      return false
    }
    if (this.bold !== _.bold) {
      return false
    }
    if (this.italic !== _.italic) {
      return false
    }
    if (this.label_box_width !== _.label_box_width) {
      return false
    }
    if (this.label_color !== _.label_color) {
      return false
    }
    if (this.label_vert !== _.label_vert) {
      return false
    }
    if (this.label_horiz !== _.label_horiz) {
      return false
    }
    if (this.label_background !== _.label_background) {
      return false
    }
    if (this.show_value !== _.show_value) {
      return false
    }
    if (this.label_vert_valeur !== _.label_vert_valeur) {
      return false
    }
    if (this.label_horiz_valeur !== _.label_horiz_valeur) {
      return false
    }
    if (this.value_font_size !== _.value_font_size) {
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


/**
 * Define all attributes that can be apply to a node
 *
 * @export
 * @class Class_NodeAttribute
 */
export class Class_NodeAttribute {
  // idNode?: string
  // name?: string

  // Parameter of node shape
  shape_visible?: boolean
  label_visible?: boolean
  min_width?: number
  min_height?: number
  color?: string
  shape?: 'ellipse' | 'rect' | 'arrow'
  node_arrow_angle_factor?: number
  node_arrow_angle_direction?: string
  color_sustainable?: boolean

  // Parameter of node label
  font_family?: string
  font_size?: number
  uppercase?: boolean
  bold?: boolean
  italic?: boolean
  label_box_width?: number
  label_color?: boolean
  label_vert?: string
  label_horiz?: string
  label_background?: boolean

  // Parameter of node value label
  show_value?: boolean
  label_vert_valeur?: string
  label_horiz_valeur?: string
  value_font_size?: number
}

/**
 * Define style for nodes
 *
 * @export
 * @class Class_NodeStyle
 * @extends {Class_NodeAttribute}
 */
export class Class_NodeStyle extends Class_NodeAttribute {
  constructor() {
    super()
    this.shape_visible = default_node_style['shape_visible']
    this.label_visible = default_node_style['label_visible']
    this.min_width = default_node_style['min_width']
    this.min_height = default_node_style['min_height']
    this.color = default_node_style['color']
    this.shape = default_node_style['shape']
    this.node_arrow_angle_factor = default_node_style['node_arrow_angle_factor']
    this.node_arrow_angle_direction = default_node_style['node_arrow_angle_direction']
    this.color_sustainable = default_node_style['color_sustainable']
    this.font_family = default_node_style['font_family']
    this.font_size = default_node_style['font_size']
    this.uppercase = default_node_style['uppercase']
    this.bold = default_node_style['bold']
    this.italic = default_node_style['italic']
    this.label_box_width = default_node_style['label_box_width']
    this.label_color = default_node_style['label_color']
    this.label_vert = default_node_style['label_vert']
    this.label_horiz = default_node_style['label_horiz']
    this.label_background = default_node_style['label_background']
    this.show_value = default_node_style['show_value']
    this.label_vert_valeur = default_node_style['label_vert_valeur']
    this.label_horiz_valeur = default_node_style['label_horiz_valeur']
    this.value_font_size = default_node_style['value_font_size']
  }
}

export type Type_Node_Style = {
  idNode: string,
  name: string,

  // Parameter of node shape
  shape_visible: boolean,
  label_visible: boolean,
  min_width: number,
  min_height: number,
  color: string,
  shape: 'ellipse' | 'rect' | 'arrow',
  node_arrow_angle_factor: number,
  node_arrow_angle_direction: string,
  color_sustainable: boolean,

  // Parameter of node label
  font_family: string,
  font_size: number,
  uppercase: boolean,
  bold: boolean,
  italic: boolean,
  label_box_width: number,
  label_color: boolean,
  label_vert: string,
  label_horiz: string,
  label_background: boolean,

  // Parameter of node value label
  show_value: boolean,
  label_vert_valeur: string,
  label_horiz_valeur: string,
  value_font_size: number,
}

export const default_node_style: Type_Node_Style = {
  idNode: 'default',
  name: 'Style par défaut',
  shape: 'rect',
  node_arrow_angle_factor: 30,
  node_arrow_angle_direction: 'right',
  shape_visible: true,
  label_visible: true,
  min_width: 40,
  min_height: 40,
  color: default_element_color,
  color_sustainable: false,

  font_family: 'Cormorant',
  font_size: 14,
  uppercase: false,
  bold: false,
  italic: false,
  label_vert: 'bottom',
  label_horiz: 'middle',
  label_background: false,

  show_value: false,
  label_vert_valeur: 'top',
  label_horiz_valeur: 'middle',
  value_font_size: 14,
  label_box_width: 150,
  label_color: false,
}
// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux
// ==================================================================================================

// OpenSankey imports
import {
  ClassTemplate_Element
} from '../deps/OpenSankey/Elements/Element'
import {
  ClassTemplate_Handler
} from '../deps/OpenSankey/Elements/Handler'
import {
  Type_ElementPosition,
  Type_JSON,
  default_element_position,
  getBooleanFromJSON,
  getNumberFromJSON,
  getStringFromJSON,
  getStringListFromJSON
} from '../deps/OpenSankey/types/Utils'

// Local imports
import {
  ClassAbstract_DrawingAreaOSP,
  ClassAbstract_SankeyOSP
} from './AbstractOSP'
import { Class_MenuConfigOSP } from './MenuConfigOSP'
import { ClassTemplate_NodeElementOSP } from './NodeOSP'
import { Type_GenericDrawingAreaOSP, Type_GenericLinkElementOSP, Type_GenericSankeyOSP } from './TypesOSP'


export const default_container_content = 'Text Label ...'
export const default_container_label_width = 100
export const default_container_label_height = 25
export const default_container_color = 'white'
export const default_container_color_visible = true
export const default_container_color_border = 'black'
export const default_container_opacity = 100
export const default_container_transparent_border = false
export const default_container_is_image = false
export const default_container_image_src = ''


export type Type_AnyContainerElement = Class_ContainerElement<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP>

/**
 * Allow to sort  by their z-ordre on the drawing area
 * @export
 * @param {Type_AnyContainerElement} a
 * @param {Type_AnyContainerElement} b
 * @return {*}
 */
export function sortElementsContainersByDisplayingOrders(
  a: Type_AnyContainerElement,
  b: Type_AnyContainerElement
) {
  if (a.displaying_order > b.displaying_order) return 1
  else if (a.displaying_order < b.displaying_order) return -1
  else return 0
}

// CLASS FREE LABEL ELEMENT *************************************************************

export class Class_ContainerElement
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingAreaOSP<any, any, any>, // eslint-disable-line
    Type_GenericSankey extends ClassAbstract_SankeyOSP<any, any, any> // eslint-disable-line
  >
  extends ClassTemplate_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {

  // PUBLIC ATTRIBUTES ==================================================================

  // Nothing ...

  // PROTECTED ATTRIBUTES ===============================================================

  protected d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null

  /**
   * Display attributes
   * @protected
   * @type {{
   *     drawing_area: Type_GenericDrawingArea,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof Class_ContainerElement
   */
  protected _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
    position: Type_ElementPosition,
    displaying_order: number,

  }

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {string}
   * @memberof ClassTemplate_Element
   */
  declare protected _menu_config: Class_MenuConfigOSP

  // PRIVATE ATTRIBUTES =================================================================

  private _title: string
  private _content: string
  private _opacity: number
  private _color: string
  private _color_visible: boolean
  private _color_border: string
  private _transparent_border: boolean
  private _is_image: boolean
  private _image_src: string
  private _label_width: number

  private _label_height: number

  private _tied_to_nodes: boolean
  private _attached_node: ClassTemplate_NodeElementOSP<Type_GenericDrawingAreaOSP, Type_GenericSankeyOSP, Type_GenericLinkElementOSP>[]
  private _margin_from_attached_nodes: number
  private _at_extremity_of_attached_nodes: boolean
  private _extremity_position: 'top' | 'bottom'


  private _drag_handler: {
    top: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    bottom: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    left: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    right: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
  }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ContainerElement.
   * @param {string} id
   * @param {Class_MenuConfigOSP} menu_config
   * @param {Type_GenericDrawingArea} drawing_area
   * @memberof Class_ContainerElement
   */
  constructor(id: string,
    menu_config: Class_MenuConfigOSP,
    drawing_area: Type_GenericDrawingArea,
  ) {
    super(id, menu_config, 'g_labels')
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey,
      position: structuredClone(default_element_position as Type_ElementPosition),
      displaying_order: drawing_area.addContainerElement()
    }
    // Free labels attributs
    this._title = 'Zone de texte ' + this.id
    this._content = default_container_content
    this._label_width = default_container_label_width
    this._label_height = default_container_label_height
    this._color = default_container_color
    this._color_visible = default_container_color_visible
    this._color_border = default_container_color_border
    this._opacity = default_container_opacity
    this._transparent_border = default_container_transparent_border
    this._is_image = default_container_is_image
    this._image_src = default_container_image_src

    this._tied_to_nodes = false
    this._attached_node = []
    this._margin_from_attached_nodes = 50
    this._at_extremity_of_attached_nodes = false
    this._extremity_position = 'top'

    // Free labels drag handlers
    this._drag_handler = {
      top: new ClassTemplate_Handler(
        'zdt_top_handle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragTopHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_top_handle' }),
      bottom: new ClassTemplate_Handler(
        'zdt_bottom_handle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragBottomHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_bottom_handle' }),
      left: new ClassTemplate_Handler(
        'zdt_left_handle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragLeftHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_left_handle' }),
      right: new ClassTemplate_Handler(
        'zdt_right_handle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragRightHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_right_handle' }),
    }
  }


  // CLEANING METHODS ===================================================================

  /**
   * Define deletion behavior
   * @memberof Class_ContainerElement
   */
  protected cleanForDeletion() {
    // Delete control points
    this._drag_handler.top.delete()
    this._drag_handler.bottom.delete()
    this._drag_handler.right.delete()
    this._drag_handler.left.delete()
  }

  // COPY METHODS =======================================================================

  /**
   * Extract attribute from another Class_ContainerElement
   *
   * @param {Class_ContainerElement<Type_GenericDrawingArea, Type_GenericSankey>} container_to_copy
   * @memberof Class_ContainerElement<Type_GenericDrawingArea, Type_GenericSankey>
   */
  protected _copyFrom(container_to_copy: Class_ContainerElement<Type_GenericDrawingArea, Type_GenericSankey>) {
    super._copyFrom(container_to_copy)
    this._title = container_to_copy._title
    this._content = container_to_copy._content
    this._opacity = container_to_copy._opacity
    this._color = container_to_copy._color
    this._color_visible = container_to_copy._color_visible
    this._color_border = container_to_copy._color_border
    this._transparent_border = container_to_copy._transparent_border
    this._is_image = container_to_copy._is_image
    this._image_src = container_to_copy._image_src
    this._label_width = container_to_copy._label_width
    this._label_height = container_to_copy._label_height
  }

  // SAVING METHODS =====================================================================

  /**
   * Save value of container to JSON
   *
   * @return {*}
   * @memberof Class_ContainerElement
   */
  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['title'] = this._title
    json_object['content'] = this._content
    json_object['opacity'] = this._opacity
    json_object['color'] = this._color
    json_object['color_visible'] = this._color_visible
    json_object['color_border'] = this._color_border
    json_object['transparent_border'] = this._transparent_border
    json_object['is_image'] = this._is_image
    json_object['image_src'] = this._image_src
    json_object['label_width'] = this._label_width
    json_object['label_height'] = this._label_height
    json_object['displaying_order'] = this._display.displaying_order
    json_object['tiedToNode'] = this._tied_to_nodes
    json_object['margin'] = this._margin_from_attached_nodes
    json_object['attachedNodes'] = this._attached_node.map(n => n.id)

  }

  /**
   * Extract container attributes form JSON
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ContainerElement
   */
  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object, kwargs)
    this._title = getStringFromJSON(json_object, 'title', this.title)
    this._content = getStringFromJSON(json_object, 'content', this.content)
    this._opacity = getNumberFromJSON(json_object, 'opacity', this.opacity)
    this._color = getStringFromJSON(json_object, 'color', this.color)
    this._color_visible = getBooleanFromJSON(json_object, 'color_visible', this._color_visible)
    this._color_border = getStringFromJSON(json_object, 'color_border', this.color_border)
    this._transparent_border = getBooleanFromJSON(json_object, 'transparent_border', this.transparent_border)
    this._is_image = getBooleanFromJSON(json_object, 'is_image', this.is_image)
    this._image_src = getStringFromJSON(json_object, 'image_src', this.image_src)
    this._label_width = getNumberFromJSON(json_object, 'label_width', this.label_width)
    this._label_height = getNumberFromJSON(json_object, 'label_height', this.label_height)
    this._display.displaying_order = getNumberFromJSON(json_object, 'displaying_order', this._display.displaying_order)
    this._tied_to_nodes = getBooleanFromJSON(json_object, 'tiedToNode', this._tied_to_nodes)
    this._margin_from_attached_nodes = getNumberFromJSON(json_object, 'margin', this._margin_from_attached_nodes)
    const list_id_nodes = getStringListFromJSON(json_object, 'attachedNodes', [])
    const present_node_id = this.drawing_area.sankey.nodes_dict
    list_id_nodes.forEach(id_n => {
      if (id_n in present_node_id) {
        this._attached_node.push(this.drawing_area.sankey.nodes_dict[id_n])
      }
    })
  }


  // History saving ----------------------------------------------------------------------



  // PUBLIC METHODS =====================================================================

  protected _draw() {
    super._draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_labels')
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'label_shape') ?? null
    this._drawShape()
    this._drawContent()
    this.drawing_area.orderElementsConatianer()
  }
  /**
   * Draw ZDT shape (a rectangle with custom size,bg color, bg opacity,border color, ...)
   *
   * @memberof Class_ContainerElement
   */
  public _drawShape() {
    // Clean previous shape
    this.d3_selection_g_shape?.selectAll('.zdt_shape').remove()
    if (this._tied_to_nodes && this._attached_node.filter(node => node.is_visible).length > 0) {
      this.computeSizeAndPositionFromAttachedNodes()
    }
    if (this._is_selected) {
      this.drawDragHandlers()
    }

    // Apply shape value
    this.d3_selection_g_shape?.append('rect')
      .classed('zdt_shape', true)
      .attr('width', this._label_width)
      .attr('height', this._label_height)
      .attr('rx', 5)

    // Apply common properties
    this.d3_selection_g_shape?.selectAll('.zdt_shape')
      .attr('id', this.id)
      .attr('fill-opacity', this._color_visible ? this._opacity / 100 : 0)
      .attr('fill', this._color)
      .attr('stroke', this._color_border)
      .attr('stroke-opacity', (this._transparent_border) ? 0 : 1)
  }

  /**
   * Draw the content of the ZDT wich can be formated text or image
   *
   * @memberof Class_ContainerElement
   */
  public _drawContent() {
    // Clean svg group before (re)drawing zdt content
    this.d3_selection?.selectAll('.content').remove()

    if (this._is_image) {
      this.drawContentImage()
    } else {
      this.drawContentText()
    }
  }

  /**
   * Function triggered when element is (un)selected
   *
   * @memberof Class_ContainerElement
   */
  public drawAsSelected() {
    this.draw()
    this.drawDragHandlers()
  }

  /**
   * Draw all control points
   *
   * @private
   * @memberof Class_ContainerElement
   */
  public drawDragHandlers() {
    // Compute positions
    this.computeTopHandlerPos()
    this.computeBottomHandlerPos()
    this.computeLeftHandlerPos()
    this.computeRightHandlerPos()
    // Draw
    this._drag_handler.top.draw()
    this._drag_handler.bottom.draw()
    this._drag_handler.left.draw()
    this._drag_handler.right.draw()
  }

  public increaseDisplayOrder() {
    this._display.displaying_order = this._display.displaying_order + 3
    this.draw()
  }

  public decreaseDisplayOrder() {
    this._display.displaying_order = this._display.displaying_order - 3
    this.draw()
  }


  // PRIVATE METHODS ====================================================================

  /**
   * Draw the content of the zdt when it is a formated text
   *
   * (Souldn't be called outside this class, to draw content use drawContent() )
   *
   * @private
   * @memberof Class_ContainerElement
   */
  private drawContentText() {
    this.d3_selection?.append('foreignObject')
      .classed('content', true)
      .attr('width', this._label_width + 'px')
      .attr('height', this._label_height + 'px')
      .attr('id', this.id + '_text')
      .append('xhtml:div')
      .attr('class', 'ql-editor')
      .html(this._content)
  }

  /**
   * Draw the content of the zdt when it is an image
   *
   * (Souldn't be called outside this class, to draw content use drawContent() )
   *
   * @private
   * @memberof Class_ContainerElement
   */
  private drawContentImage() {
    this.d3_selection?.append('image')
      .classed('content', true)
      .attr('width', this._label_width + 'px')
      .attr('height', this._label_height + 'px')
      .style('width', this._label_width + 'px')
      .style('height', this._label_height + 'px')
      .attr('id', this.id + '_img')
      .attr('xlink:href', this._image_src)
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  }

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  private dragHandleStart() {
    return () => {
      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this._label_width,
        h: this._label_height,
      }
      this.drawing_area.application_data.history.saveUndo(() => {
        this._label_width = old_val.w
        this._label_height = old_val.h
        this._display.position.x = old_val.x
        this._display.position.y = old_val.y
        this.draw()
      })
    }
  }

  /**
    * Deactivate the control points alignement guide
    * @private
    * @return {*}
    * @memberof Class_ContainerElement
    */
  private dragHandleEnd() {
    return () => {
      this.menu_config.ref_to_menu_config_containers_updater.current()

      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this._label_width,
        h: this._label_height,
      }
      this.drawing_area.application_data.history.saveRedo(() => {
        this._label_width = old_val.w
        this._label_height = old_val.h
        this._display.position.x = old_val.x
        this._display.position.y = old_val.y
        this.draw()
      })
    }
  }

  /**
   * Event when we drag the top handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  private dragTopHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._label_height -= event.dy
      this.position_y = this.position_y + event.dy
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the bottom handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  private dragBottomHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._label_height += event.dy
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the left handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  private dragLeftHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._label_width -= event.dx
      this.setPosXY(this.position_x + event.dx, this.position_y)
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
   * Event when we drag the right handle
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  private dragRightHandler() {
    return (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
      this._label_width += event.dx
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  private computeTopHandlerPos() {
    // Top handle pos
    this._drag_handler.top.position_x = this.position_x + this._label_width / 2
    this._drag_handler.top.position_y = this.position_y + 0
  }

  private computeBottomHandlerPos() {
    // bottom handle pos
    this._drag_handler.bottom.position_x = this.position_x + this._label_width / 2
    this._drag_handler.bottom.position_y = this.position_y + this._label_height
  }

  private computeLeftHandlerPos() {
    // left handle pos
    this._drag_handler.left.position_x = this.position_x + 0
    this._drag_handler.left.position_y = this.position_y + this._label_height / 2
  }

  private computeRightHandlerPos() {
    // right handle pos
    this._drag_handler.right.position_x = this.position_x + this._label_width
    this._drag_handler.right.position_y = this.position_y + this._label_height / 2
  }

  /**
   * Compute position & size of container according to nodes tied to it, 
   * it also add a margin to compute size that can be modified 
   *
   * @private
   * @memberof Class_ContainerElement
   */
  private computeSizeAndPositionFromAttachedNodes() {
    let min_x = this.drawing_area.width, min_y = this.drawing_area.height, max_x = 0, max_y = 0

    this._attached_node.forEach(node => {
      if (node.is_visible) {
        // Use bbox to take into account he label of the node
        const bbox = node.d3_selection?.node()?.getBBox() ?? { x: 0, y: 0, width: 0, height: 0 }

        const node_topiest_pos = node.position_y + bbox.y
        const node_leftiest_pos = node.position_x + bbox.x
        const node_righiest_pos = node.position_x + bbox.width
        const node_bottomiest_pos = node.position_y + bbox.height

        min_x = (node_leftiest_pos < min_x) ? node_leftiest_pos : min_x
        min_y = (node_topiest_pos < min_y) ? node_topiest_pos : min_y
        max_x = (node_righiest_pos > max_x) ? node_righiest_pos : max_x
        max_y = (node_bottomiest_pos > max_y) ? node_bottomiest_pos : max_y
      }
    })

    if (this._at_extremity_of_attached_nodes) {
      const bbox = this.drawing_area.d3_selection_nodes?.node()?.getBBox() ?? undefined

      // No bounding box -> return
      if (bbox == undefined)
        return

      // compute position x of container so that it center is aligned with the center of the group of nodes attached 
      const center_pox_x = ((min_x + max_x) / 2) - this._label_width / 2
      if (this._extremity_position == 'top') {
        this.setPosXY(center_pox_x, bbox.y - this._label_height - this._margin_from_attached_nodes)
      } else if (this._extremity_position == 'bottom') {
        this.setPosXY(center_pox_x, bbox.y + bbox.height + this._margin_from_attached_nodes)
      }

    } else {
      this.setPosXY(min_x - this._margin_from_attached_nodes, min_y - this._margin_from_attached_nodes)
      this._label_width = (max_x - min_x) + (this._margin_from_attached_nodes * 2) // margin * 2 to compensate margin reduction in setPosXY
      this._label_height = (max_y - min_y) + (this._margin_from_attached_nodes * 2) // margin * 2 to compensate margin reduction in setPosXY
    }
  }

  // PROTECTED METHODS ==================================================================

  // Mouse Events -----------------------------------------------------------------------

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventSimpleLMBCLick(event)

    // Get related drawing area
    const drawing_area = this.drawing_area
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode() && event.button === 0) {
      // SHIFT
      if (event.shiftKey) {
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
        // Open related menu
        this.menu_config.openConfigMenuElementsContainers()
        // Update components related to free label edition
        this.menu_config.ref_to_menu_config_containers_updater.current()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
        // Update components related to free label edition
        this.menu_config.ref_to_menu_config_containers_updater.current()
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
      }
    }
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventDoubleLMBCLick(_event)
  }

  /**
   * Deal with simple right Mouse Button (RMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventSimpleRMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventSimpleRMBCLick(_event)
    if (this.drawing_area.isInSelectionMode()) {
      _event.preventDefault()
      this.drawing_area.pointer_pos = [_event.pageX, _event.pageY]
      if (!this.drawing_area.selected_containers_list.includes(this)) {
        this.drawing_area.addContainerToSelection(this)
      }
      this.menu_config.ref_to_menu_config_containers_updater.current();
      this.drawing_area.contextualised_container = this
      this.menu_config.ref_to_menu_context_container_updater.current()
    }
  }

  /**
   * Define maintained left mouse button click for free labels
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMaintainedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMaintainedClick(_event)
  }

  /**
   * Define released left mouse button click for drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventReleasedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMaintainedClick(_event)
  }

  /**
   * Define event when mouse moves over drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOver(_event)
  }

  /**
   * Define event when mouse moves out of drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseOut(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseOut(_event)
  }

  /**
   * Define event when mouse moves in drawing area
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseMove(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventMouseMove(_event)
  }

  /**
   * Define event when mouse drag starts
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    super.eventMouseDragStart(_event)

    const drawing_area = this.drawing_area
    const containers_selected = drawing_area.selected_containers_list
    if (containers_selected.includes(this)) {
      drawing_area.saveUndoLabelSelectedPos()
      drawing_area.checkAndUpdateAreaSize()
    } else if (!this._tied_to_nodes) {
      // Memorize for undo
      const old_x = this._display.position.x
      const old_y = this._display.position.y
      // Undo function
      const undo = () => {
        this.setPosXY(old_x, old_y)
        drawing_area.checkAndUpdateAreaSize()
      }
      this.drawing_area.application_data.history.saveUndo(undo)
    }
  }

  /**
   * Define event when mouse drag element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    super.eventMouseDrag(event)

    // Get related drawing area
    const drawing_area = this.drawing_area
    const zdt_selected = drawing_area.selected_containers_list

    if (zdt_selected.length == 0) {
      if (drawing_area.isInSelectionMode() && !this.tied_to_nodes) {
        this.setPosXY(this.position_x + event.dx, this.position_y + event.dy)
        this.drawing_area.checkAndUpdateAreaSize()
      }
    }
    else if (zdt_selected.includes(this)) { // Only trigger the drag if we drag a selected free label
      // EDITION MODE ===========================================================
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        // Update free label position
        zdt_selected
          .forEach(zdt => {
            if (!zdt._tied_to_nodes) {
              zdt.setPosXY(zdt.position_x + event.dx, zdt.position_y + event.dy)
            }
          })
        this.drawing_area.moveSelectedNodesFromDragEvent(event)
      }
    }
  }

  /**
   * Define event when mouse drag ends
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_Element
   */
  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    if (this.drawing_area.isInSelectionMode()) {
      this.drawing_area.checkAndUpdateAreaSize()

      // Save redo label pos
      const drawing_area = this.drawing_area
      const containers_selected = drawing_area.selected_containers_list
      if (containers_selected.includes(this)) {
        drawing_area.saveRedoLabelSelectedPos()
      } else if (!this._tied_to_nodes) {
        // Memorize for redo
        const old_x = this._display.position.x
        const old_y = this._display.position.y
        // redo function
        const redo = () => {
          this.setPosXY(old_x, old_y)
        }
        this.drawing_area.application_data.history.saveRedo(redo)
      }
    }
  }

  protected override _applyPosition(): void {
    super._applyPosition()
    this.drawDragHandlers()
  }


  // GETTERS / SETTERS ==================================================================

  // Overrides --------------------------------------------------------------------------

  public override get menu_config() { return this._menu_config }

  // New --------------------------------------------------------------------------------

  public get is_visible() { return super.is_visible }

  public get title(): string { return this._title }
  public set title(value: string) { this._title = value }

  public get content(): string { return this._content }
  public set content(value: string) { this._content = value }

  public get opacity(): number { return this._opacity }
  public set opacity(value: number) { this._opacity = value }

  public get color(): string { return this._color }
  public set color(value: string) { this._color = value }

  public get color_visible(): boolean { return this._color_visible }
  public set color_visible(value: boolean) { this._color_visible = value }

  public get color_border(): string { return this._color_border }
  public set color_border(value: string) { this._color_border = value }

  public get transparent_border(): boolean { return this._transparent_border }
  public set transparent_border(value: boolean) { this._transparent_border = value }

  public get is_image(): boolean { return this._is_image }
  public set is_image(value: boolean) { this._is_image = value }

  public get image_src(): string { return this._image_src }
  public set image_src(value: string) { this._image_src = value }

  public get label_width(): number { return this._label_width }
  public set label_width(value: number) { this._label_width = value }

  public get label_height(): number { return this._label_height }
  public set label_height(value: number) { this._label_height = value }

  public get attached_node() { return this._attached_node }

  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }

  public get displaying_order() { return this._display.displaying_order }
  public set displaying_order(_: number) { this._display.displaying_order = _ }

  public get margin_from_attached_nodes(): number { return this._margin_from_attached_nodes }
  public set margin_from_attached_nodes(value: number) { this._margin_from_attached_nodes = value }

  public get at_extremity_of_attached_nodes(): boolean { return this._at_extremity_of_attached_nodes }
  public set at_extremity_of_attached_nodes(value: boolean) { this._at_extremity_of_attached_nodes = value }

  public get extremity_position(): 'top' | 'bottom' { return this._extremity_position }
  public set extremity_position(value: 'top' | 'bottom') { this._extremity_position = value }
}
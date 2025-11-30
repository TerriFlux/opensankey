import * as d3 from 'd3'

import { ClassTemplate_Handler } from './Handler'
import { Type_ElementPosition, Type_JSON, default_element_position, default_style_id, getBooleanFromJSON, getStringFromJSON, getStringListFromJSON, } from '../types/Utils'
import { Class_MenuConfig } from '../types/MenuConfig'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_NodeElement } from './Node'
import { ClassTemplate_Element } from './Element'
import { Class_ContainerAttribute } from './ContainerAttributes'
import { CONTAINERS_ATTRIBUTES_CONFIG, ContainerSetterGenerator } from './ContainerAttributesConfig'
import { Class_ContainerStyle } from './ElementStyle'

export const default_container_content = 'Text Label ...'
export const default_container_is_image = false
export const default_container_image_src = ''

// 🆕 TextZone hérite de ClassTemplate_Element et utilise Class_ContainerAttribute en composition
export class Class_ContainerElement extends ClassTemplate_Element {
  protected d3_selection_g_shape: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null

  protected _display: {
    position: Type_ElementPosition,
  }

  // 🆕 Utiliser Class_ContainerAttribute en composition au lieu de _attributes brut
  private _container_attributes: Class_ContainerAttribute
  private _style: Class_ContainerStyle[]

  private _title: string
  private _content: string
  private _is_image: boolean
  private _image_src: string
  private _tied_to_nodes: boolean
  private _attached_node: Class_NodeElement[]
  private _at_extremity_of_attached_nodes: boolean
  private _extremity_position: 'top' | 'bottom' | 'left' | 'right'

  private _drag_handler: {
    top: ClassTemplate_Handler,
    bottom: ClassTemplate_Handler,
    left: ClassTemplate_Handler,
    right: ClassTemplate_Handler,
  }

  // Déclarations pour les propriétés générées automatiquement
  vertical_text!: boolean
  vertical_alignment!: 'left' | 'right'
  label_width!: number
  label_height!: number
  color!: string
  color_visible!: boolean
  color_border!: string
  transparent_border!: boolean
  thickness!: number
  dashed!: boolean
  opacity!: number
  margin_left!: number
  margin_right!: number
  margin_top!: number
  margin_bottom!: number

  constructor(id: string,
    menu_config: Class_MenuConfig,
    drawing_area: Class_DrawingArea,
  ) {
    super(id, drawing_area, drawing_area.sankey, 'g_elements_sankey')

    // 🆕 Créer l'instance de Class_ContainerAttribute
    this._container_attributes = new Class_ContainerAttribute()
    this._style = [drawing_area.sankey.default_container_style],
    this._display = {
      position: structuredClone(default_element_position as Type_ElementPosition),
    }
    this._title = 'Zone de texte ' + this.id
    this._content = default_container_content
    this._is_image = default_container_is_image
    this._image_src = default_container_image_src
    this._tied_to_nodes = false
    this._attached_node = []
    this._at_extremity_of_attached_nodes = false
    this._extremity_position = 'top'

    ContainerSetterGenerator.generateSetters(this)

    // Initialize title AFTER setters are generated
    this.title = 'Zone de texte ' + this.id

    // Free labels drag handlers
    this._drag_handler = {
      top: new ClassTemplate_Handler(
        'zdt_top_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragTopHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_top_handle' }),
      bottom: new ClassTemplate_Handler(
        'zdt_bottom_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragBottomHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_bottom_handle' }),
      left: new ClassTemplate_Handler(
        'zdt_left_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragLeftHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_left_handle' }),
      right: new ClassTemplate_Handler(
        'zdt_right_handle_' + id,
        drawing_area,
        this,
        this.dragHandleStart(),
        this.dragRightHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_right_handle' }),
    }
    drawing_area.list_g_element.push(this.id)

    // Launch timer to reorder element on DA
    this.drawing_area.application_data._add_waiting_process('order_elements_on_da', () => {
      this.drawing_area.orderElementOnDA()
    })
  }

  // 🆕 METHODS CALLED BY CONFIGURED ACTIONS IN ContainerAttributesConfig
  // These methods are called automatically when attributes change

  /**
   * Action: drawContent - Redraw only the content
   * Called by: content, vertical_text, vertical_alignment
   */
  public drawContent() {
    this._drawContent()
  }

  /**
   * Action: drawBorder - Redraw only the border
   * Called by: color_border, transparent_border, thickness, dashed
   */
  public drawBorder() {
    this._drawShape()
  }

  /**
   * Action: updateSizeAndPosition - Recalculate from attached nodes
   * Called by: tied_to_nodes, at_extremity_of_attached_nodes, extremity_position, margins
   */
  public updateSizeAndPosition() {
    if (this.tied_to_nodes && this._attached_node.length > 0) {
      this.computeSizeAndPositionFromAttachedNodes()
    }
    this.draw()
  }

  protected cleanForDeletion() {
    // Delete control points
    this._drag_handler.top.delete()
    this._drag_handler.bottom.delete()
    this._drag_handler.right.delete()
    this._drag_handler.left.delete()

    // Remove from style references
    if (this._style) {
      this._style.forEach(_ => _.removeReference(this))
    }
  }

  protected _copyFrom(container_to_copy: Class_ContainerElement) {
    super._copyFrom(container_to_copy)
    this._title = container_to_copy._title
    this._content = container_to_copy._content
    this._is_image = container_to_copy._is_image
    this._image_src = container_to_copy._image_src

    this._tied_to_nodes = container_to_copy._tied_to_nodes
    this._at_extremity_of_attached_nodes = container_to_copy._at_extremity_of_attached_nodes
    this._extremity_position = container_to_copy._extremity_position

    // 🆕 Utiliser la méthode copyFrom de Class_ContainerAttribute
    this._container_attributes.copyFrom(container_to_copy._container_attributes)

    container_to_copy._attached_node.forEach(n => {
      const node = this.drawing_area.sankey.nodes_dict[n.id]
      this.drawing_area.attachContToNode(this, node)
    })
  }

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super._toJSON(json_object, kwargs)
    json_object['title'] = this._title
    json_object['content'] = this._content
    json_object['is_image'] = this._is_image
    json_object['image_src'] = this._image_src
    json_object['tiedToNode'] = this._tied_to_nodes

    // Save all attributes
    this.attributes.toJSON(json_object,this.style[0])

    if (this.style!.length > 0) json_object['style'] = this.style.map(s => s.id)

    // Save attached nodes
    json_object['attachedNodes'] = this._attached_node.map(n => n.id)
    json_object['attachedNodesExtremity'] = this._at_extremity_of_attached_nodes
    json_object['extremityPos'] = this._extremity_position
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object, kwargs)
    this._title = getStringFromJSON(json_object, 'title', this.title)
    this._content = getStringFromJSON(json_object, 'content', this.content)
    this._is_image = getBooleanFromJSON(json_object, 'is_image', this.is_image)
    this._image_src = getStringFromJSON(json_object, 'image_src', this.image_src)
    this._tied_to_nodes = getBooleanFromJSON(json_object, 'tiedToNode', this._tied_to_nodes)

    const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])
    this._style = style_id.map(s_id => this.sankey.container_styles_dict[s_id]) as Class_ContainerStyle[]

    this.attributes.fromJSON(json_object,this,this._style[0])

    // Load attached nodes
    const list_id_nodes = (json_object['attachedNodes'] as string[]) || []
    const present_node_id = this.drawing_area.sankey.nodes_dict
    list_id_nodes.forEach(id_n => {
      if (id_n in present_node_id) {
        this.drawing_area.attachContToNode(this, this.drawing_area.sankey.nodes_dict[id_n])
      }
    })
    this._at_extremity_of_attached_nodes = getBooleanFromJSON(json_object, 'attachedNodesExtremity', this._at_extremity_of_attached_nodes)
    this._extremity_position = getStringFromJSON(json_object, 'extremityPos', this._extremity_position) as 'top' | 'bottom' | 'left' | 'right'
  }

  public getStyleWithAttr(k: keyof Class_ContainerStyle) {
    return this.style.slice().reverse().find(s => s[k] !== undefined) ?? this.sankey.default_container_style as Class_ContainerStyle
  }

  public isAttributeOverloaded(attr: keyof Class_ContainerAttribute) {
    if (this.attributes[attr] === undefined) return false
    if (this.attributes[attr] === this.getStyleWithAttr(attr)[attr]) return false
    return true
  }

  protected _draw() {
    super._draw()
    this.d3_selection?.attr('class', 'gg_labels').datum(this)
    this.d3_selection_g_shape = this.d3_selection?.append('g').attr('class', 'label_shape') ?? null
    this._drawShape()
    this._drawContent()
    this.d3_selection?.lower()
  }

  public setEventsListeners() {
    if (this.drawing_area.container_activated) {
      super.setEventsListeners()
    }
  }

  /**
   * Draw ZDT shape (a rectangle with custom size,bg color, bg opacity,border color, ...)
   *
   * @memberof Class_ContainerElement
   */
  public _drawShape() {
    // Clean previous shape
    this.d3_selection_g_shape?.selectAll('.zdt_shape').remove()
    if (this.tied_to_nodes && this._attached_node.filter(node => node.is_visible).length > 0) {
      this.computeSizeAndPositionFromAttachedNodes()
      this.applyPosition()
    }
    if (this._is_selected) {
      this.drawDragHandlers()
    }

    // Apply shape value
    this.d3_selection_g_shape?.append('rect')
      .classed('zdt_shape', true)
      .attr('width', this.label_width)
      .attr('height', this.label_height)
      .attr('rx', 5)

    // Apply common properties
    this.d3_selection_g_shape?.selectAll('.zdt_shape')
      .attr('id', this.id)
      .attr('fill-opacity', this.color_visible ? this.opacity / 100 : 0)
      .attr('fill', this.color)
      .attr('stroke', this.color_border)
      .attr('stroke-width', this.thickness)
      .attr('stroke-dasharray', this.dashed ? '10,3' : '')
      .attr('stroke-opacity', (this.transparent_border) ? 0 : 1)
  }

  private unescapeHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.documentElement.textContent || ''
  }

  /**
   * Draw the content of the ZDT wich can be formated text or image
   *
   * @memberof Class_ContainerElement
   */
  public _drawContent() {
    // Clean svg group before (re)drawing zdt content
    this.d3_selection?.selectAll('.content').remove()

    if (this.is_image) {
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
    if (!this.d3_selection) return
    const foreignObject = this.d3_selection.append('foreignObject')
      .classed('content', true)
      .attr('id', this.id + '_text')
    if (this.vertical_text) {
      // Mode vertical: inverser width et height
      foreignObject
        .attr('width', this.label_height + 'px')
        .attr('height', this.label_width + 'px')

      // Calculer la position et rotation selon l'alignement
      if (this.vertical_alignment === 'left') {
        // Texte vertical à gauche
        foreignObject.attr('transform', `rotate(-90) translate(${-this.label_height}, 0)`)
      } else {
        // Texte vertical à droite
        foreignObject.attr('transform', `rotate(-90) translate(${-this.label_height}, ${this.label_width - this.label_width})`)
      }
    } else {
      // Mode horizontal normal
      foreignObject
        .attr('width', this.label_width + 'px')
        .attr('height', this.label_height + 'px')
    }

    foreignObject
      .append('xhtml:div')
      .attr('class', 'ql-editor')
      .html(this.content)
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
      .attr('width', this.label_width + 'px')
      .attr('height', this.label_height + 'px')
      .style('width', this.label_width + 'px')
      .style('height', this.label_height + 'px')
      .attr('id', this.id + '_img')
      .attr('xlink:href', this.image_src)
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
        w: this.label_width,
        h: this.label_height,
      }
      this.drawing_area.application_data.history.saveUndo(() => {
        this.label_width = old_val.w
        this.label_height = old_val.h
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
      this.drawing_area.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()

      const old_val = {
        x: this.position_x,
        y: this.position_y,
        w: this.label_width,
        h: this.label_height,
      }
      this.drawing_area.application_data.history.saveRedo(() => {
        this.label_width = old_val.w
        this.label_height = old_val.h
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
      // Early return if tied to nodes
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
        return

      this.label_height -= event.dy
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
      // Early return if tied to nodes
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['left', 'right'].includes(this.extremity_position))
        return

      this.label_height += event.dy
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
      // Early return if tied to nodes
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
        return

      this.label_width -= event.dx
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
      // Early return if tied to nodes
      if (this.tied_to_nodes && this.at_extremity_of_attached_nodes && ['top', 'bottom'].includes(this.extremity_position))
        return

      this.label_width += event.dx
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  private computeTopHandlerPos() {
    // Top handle pos
    this._drag_handler.top.position_x = this.position_x + this.label_width / 2
    this._drag_handler.top.position_y = this.position_y + 0
  }

  private computeBottomHandlerPos() {
    // bottom handle pos
    this._drag_handler.bottom.position_x = this.position_x + this.label_width / 2
    this._drag_handler.bottom.position_y = this.position_y + this.label_height
  }

  private computeLeftHandlerPos() {
    // left handle pos
    this._drag_handler.left.position_x = this.position_x + 0
    this._drag_handler.left.position_y = this.position_y + this.label_height / 2
  }

  private computeRightHandlerPos() {
    // right handle pos
    this._drag_handler.right.position_x = this.position_x + this.label_width
    this._drag_handler.right.position_y = this.position_y + this.label_height / 2
  }

  /**
   * Compute position & size of container according to nodes tied to it, 
   * it also add a margin to compute size that can be modified 
   *
   * @private
   * @memberof Class_ContainerElement
   */
  public computeSizeAndPositionFromAttachedNodes() {
    let min_x = this.drawing_area.width, min_y = this.drawing_area.height, max_x = 0, max_y = 0

    this._attached_node.forEach(node => {
      if (node.is_visible) {
        const bbox = node.d3_selection?.node()?.getBBox() ?? { x: 0, y: 0, width: 0, height: 0 }
        const node_topiest_pos = node.position_y + bbox.y
        const node_leftiest_pos = node.position_x + bbox.x
        const node_rightest_pos = node.position_x + bbox.x + bbox.width
        const node_bottomiest_pos = node.position_y + bbox.y + bbox.height

        min_x = (node_leftiest_pos < min_x) ? node_leftiest_pos : min_x
        min_y = (node_topiest_pos < min_y) ? node_topiest_pos : min_y
        max_x = (node_rightest_pos > max_x) ? node_rightest_pos : max_x
        max_y = (node_bottomiest_pos > max_y) ? node_bottomiest_pos : max_y
      }
    })

    // Appliquer les marges selon la position
    if (this.at_extremity_of_attached_nodes) {
      switch (this.extremity_position) {
      case 'top':
        this._display.position.y = min_y - this.label_height - this.margin_bottom
        this._display.position.x = min_x - this.margin_left
        this.attributes.label_width = max_x - min_x + this.margin_left + this.margin_right
        break
      case 'bottom':
        this._display.position.y = max_y + this.margin_top
        this._display.position.x = min_x - this.margin_left
        this.attributes.label_width = max_x - min_x + this.margin_left + this.margin_right
        break
      case 'left':
        this._display.position.x = min_x - this.label_width - this.margin_right
        this._display.position.y = min_y - this.margin_top
        this.attributes.label_height = max_y - min_y + this.margin_top + this.margin_bottom
        break
      case 'right':
        this._display.position.x = max_x + this.margin_left
        this._display.position.y = min_y - this.margin_top
        this.attributes.label_height = max_y - min_y + this.margin_top + this.margin_bottom
        break
      }
    } else {
      // Mode englobant : appliquer les marges sur tous les côtés
      this._display.position.x = min_x - this.margin_left
      this._display.position.y = min_y - this.margin_top
      this.attributes.label_width = max_x - min_x + this.margin_left + this.margin_right
      this.attributes.label_height = max_y - min_y + this.margin_top + this.margin_bottom
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
    if (drawing_area.application_data.is_static) {
      drawing_area.purgeSelection()
      return
    }
    // EDITION MODE ===========================================================
    if (drawing_area.isInEditionMode()) {
      // Purge selection list
      drawing_area.purgeSelection()
      // Close all menus
      drawing_area.closeAllMenus()
    }
    // SELECTION MODE =========================================================
    else if (drawing_area.isInSelectionMode() && event.button === 0) {
      // Close context menu of node & flow
      this.drawing_area.node_contextualised = undefined
      this.drawing_area.link_contextualised = undefined
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_links_updater.current()
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
      this.drawing_area.contextualised_container = undefined
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_container_updater.current()
      // SHIFT
      if (event.shiftKey) {
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
        // Open related menu
        this.drawing_area.application_data.menu_configuration.openConfigMenuElementsContainers()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection()
        // Add free label to selection
        drawing_area.addContainerToSelection(this)
      }
      // Update components related to free label edition
      this.drawing_area.application_data.menu_configuration.updateComponentRelatedToContainers()

      this.drawing_area.orderElementOnDA()
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
      this.drawing_area.application_data.menu_configuration.ref_to_menu_config_containers_updater.current()
      this.drawing_area.contextualised_container = this
      this.drawing_area.application_data.menu_configuration.ref_to_menu_context_container_updater.current()
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
    } else {
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
    const drawing_area = this.drawing_area
    if (drawing_area.isInSelectionMode()) {
      this.setPosXY(this.position_x + event.dx, this.position_y + event.dy)
      this._attached_node.filter(n => n.is_visible).sort((n1, n2) => n1.position_y - n2.position_y).forEach((n, i) => {
        n.position_x = n.position_x + event.dx
        n.position_y = n.position_y + event.dy
        if (i == 0) {
          n.position_dy = n.position_dy + event.dy
        }
        n.applyPosition()
      })
      this.drawing_area.checkAndUpdateAreaSize()
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
      } else {
        // Memorize for redo
        const old_x = this._display.position.x
        const old_y = this._display.position.y
        // redo function
        const redo = () => {
          this.setPosXY(old_x, old_y)
        }
        this.drawing_area.application_data.history.saveRedo(redo)
        this.drawing_area.orderElementOnDA()
      }
    }
  }

  protected _applyPosition(): void {
    super._applyPosition()
    this.drawDragHandlers()
  }

  public getContainerProperty(propertyName: keyof typeof CONTAINERS_ATTRIBUTES_CONFIG) {
    if (this.attributes[propertyName] !== undefined) {
      return this.attributes[propertyName]
    }
    return this.getStyleProperty(propertyName)
  }

  public getStyleProperty(propertyName: keyof typeof CONTAINERS_ATTRIBUTES_CONFIG) {
    const valueOfStyle = this.getStyleWithAttr(propertyName as keyof Class_ContainerStyle)
    if (valueOfStyle[propertyName] !== undefined) {
      return valueOfStyle[propertyName]
    }
    return CONTAINERS_ATTRIBUTES_CONFIG[propertyName].default
  }

  public get style() { return this._style }
  public set style(_) { this._style = _ }

  public get is_visible() { return super.is_visible }
  public get title(): string { return this._title }
  public set title(value: string) { this._title = value }

  public get content(): string { return this._content }
  public set content(value: string) { this._content = value }

  public get is_image(): boolean { return this._is_image }
  public set is_image(value: boolean) { this._is_image = value }

  public get image_src(): string { return this._image_src }
  public set image_src(value: string) { this._image_src = value }
  public get attached_node() { return this._attached_node }

  public get tied_to_nodes(): boolean { return this._tied_to_nodes }
  public set tied_to_nodes(b: boolean) { this._tied_to_nodes = b }

  public get at_extremity_of_attached_nodes(): boolean { return this._at_extremity_of_attached_nodes }
  public set at_extremity_of_attached_nodes(value: boolean) { this._at_extremity_of_attached_nodes = value }

  public get extremity_position(): 'top' | 'bottom' | 'left' | 'right' { return this._extremity_position }
  public set extremity_position(value: 'top' | 'bottom' | 'left' | 'right') { this._extremity_position = value }

  public get attributes() { return this._container_attributes }
}
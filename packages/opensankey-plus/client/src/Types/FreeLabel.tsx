// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// OpenSankey imports
import { Class_Element } from '../deps/OpenSankey/types/Element'
import { Type_ElementPosition } from '../deps/OpenSankey/types/Utils'
import { default_element_position } from '../deps/OpenSankey/types/Utils'
import { default_selected_stroke_width } from '../deps/OpenSankey/types/Node'
import { Class_Handler } from '../deps/OpenSankey/types/Handler'

// Local imports
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_SankeyPlus } from './SankeyPlus'

// CLASS FREE LABEL ELEMENT *************************************************************

export class Class_ContainerElement extends Class_Element<Class_DrawingAreaPlus>
{

  // PUBLIC ATTRIBUTES ==================================================================

  // Nothing ...

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes
   * @protected
   * @type {{
   *     drawing_area: Class_DrawingAreaPlus,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof Class_ContainerElement
   */
  protected _display: {
    drawing_area: Class_DrawingAreaPlus,
    position: Type_ElementPosition,
  }

  /**
   * List of Sankey in which element appear
   *
   * @private
   * @type {Class_Sankey[]}
   * @memberof Class_ProtoElement
   */
  declare protected _sankeys: { [_: string]: Class_SankeyPlus }

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {string}
   * @memberof Class_Element
   */
  declare protected _menu_config: Class_MenuConfigPlus

  // PRIVATE ATTRIBUTES =================================================================

  private _title: string
  private _content: string
  private _opacity: number
  private _color: string
  private _color_border: string
  private _transparent_border: boolean
  private _is_image: boolean
  private _image_src: string
  private _label_width: number

  private _label_height: number

  private _drag_handler: {
    top: Class_Handler<Class_DrawingAreaPlus>,
    bottom: Class_Handler<Class_DrawingAreaPlus>,
    left: Class_Handler<Class_DrawingAreaPlus>,
    right: Class_Handler<Class_DrawingAreaPlus>,
  }

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ContainerElement.
   * @param {string} id
   * @param {Class_MenuConfigPlus} menu_config
   * @param {Class_DrawingAreaPlus} drawing_area
   * @memberof Class_ContainerElement
   */
  constructor(id: string,
    menu_config: Class_MenuConfigPlus,
    drawing_area: Class_DrawingAreaPlus,
  ) {
    super(id, menu_config, 'g_labels')
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position as Type_ElementPosition),
    }
    // Free labels attributs
    this._title = 'Zone de texte ' + this.id
    this._content = 'Text Label ...'
    this._label_width = 100
    this._label_height = 25
    this._color = 'white'
    this._color_border = 'black'
    this._opacity = 100
    this._transparent_border = false

    this._is_image = false
    this._image_src = ''

    // Free labels drag handlers
    this._drag_handler = {
      top: new Class_Handler<Class_DrawingAreaPlus>(
        'zdt_top_handle_' + id,
        drawing_area,
        menu_config,
        this ,
        this.dragHandleStart(),
        this.dragTopHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_top_handle' }),
      bottom: new Class_Handler<Class_DrawingAreaPlus>(
        'zdt_bottom_handle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragBottomHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_bottom_handle' }),
      left: new Class_Handler<Class_DrawingAreaPlus>(
        'zdt_left_handle_' + id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragLeftHandler(),
        this.dragHandleEnd(),
        { class: 'zdt_left_handle' }),
      right: new Class_Handler<Class_DrawingAreaPlus>(
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

  // PUBLIC METHODS =====================================================================

  public draw() {
    super.draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_labels')
    this.drawShape()
    this.drawContent()
  }

  /**
   * Draw ZDT shape (a rectangle with custom size,bg color, bg opacity,border color, ...)
   *
   * @memberof Class_ContainerElement
   */
  public drawShape() {
    // Clean previous shape
    this.d3_selection?.selectAll('.zdt_shape').remove()

    // Apply shape value
    this.d3_selection?.append('rect')
      .classed('zdt_shape', true)
      .attr('width', this._label_width)
      .attr('height', this._label_height)
      .attr('rx', 5)

    // Apply common properties
    this.d3_selection?.selectAll('.zdt_shape')
      .attr('id', this.id)
      .attr('fill-opacity', this._opacity / 100)
      .attr('fill', this._color)
      .style('stroke', this._color_border)
      .style('stroke-width', this.is_selected ? default_selected_stroke_width : ((this._transparent_border) ? 0 : 1))
  }

  /**
   * Draw the content of the ZDT wich can be formated text or image
   *
   * @memberof Class_ContainerElement
   */
  public drawContent() {
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
    this.drawShape()
    this.drawDragHandlers()
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
      .attr('width', this._label_width)
      .attr('height', this._label_height)
      .style('width', this._label_width)
      .style('height', this._label_height)
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
      .attr('width', this._label_width)
      .attr('height', this._label_height)
      .style('width', this._label_width)
      .style('height', this._label_height)
      .attr('id', this.id + '_img')
      .attr('href', this._image_src)
  }

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_LinkElement
   */
  private dragHandleStart() {
    return () => {
    }
  }

  /**
    * Deactivate the control points alignement guide
    * @private
    * @return {*}
    * @memberof Class_LinkElement
    */
  private dragHandleEnd() {
    return () => {
      this.menu_config.ref_to_menu_config_free_label_updater.current()
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
      this._label_width -= event.dy
      this.setPosXY(this.position_x, this.position_y + event.dy)
      this.drawShape()

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
      this.setPosXY(this.position_x, this.position_y + event.dy)
      this.drawShape()

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
      this.drawShape()

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
      this.setPosXY(this.position_x + event.dx, this.position_y)
      this.drawShape()

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
   * Draw all control points
   *
   * @private
   * @memberof Class_ContainerElement
   */
  private drawDragHandlers() {

    this.computeTopHandlerPos()
    this.computeBottomHandlerPos()
    this.computeLeftHandlerPos()
    this.computeRightHandlerPos()

    // Draw control handler
    this._drag_handler.top.draw()
    this._drag_handler.bottom.draw()
    this._drag_handler.left.draw()
    this._drag_handler.right.draw()
  }

  // PROTECTED METHODS ==================================================================

  // Mouse Events -----------------------------------------------------------------------

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
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
        (drawing_area as Class_DrawingAreaPlus).addFreeLabelToSelection(this)
        // Open related menu
        this.menu_config.openConfigMenuElementsFreeLabels()
        // Update components related to free label edition
        this.menu_config.ref_to_menu_config_free_label_updater.current()
      }
      // CTRL
      else if (event.ctrlKey) {
        // Add free label to selection
        (drawing_area as Class_DrawingAreaPlus).addFreeLabelToSelection(this)
        // Update components related to free label edition
        this.menu_config.ref_to_menu_config_free_label_updater.current()
      }
      // OTHERS
      else {
        // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
        // Purge selection list
        drawing_area.purgeSelection();
        // Add free label to selection
        (drawing_area as Class_DrawingAreaPlus).addFreeLabelToSelection(this)
      }
    }
  }

  /**
   * Deal with double left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
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
   * @memberof Class_Element
   */
  protected eventSimpleRMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventSimpleRMBCLick(_event)
  }

  /**
   * Define maintained left mouse button click for free labels
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
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
   * @memberof Class_Element
   */
  protected eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    super.eventMouseDragStart(_event)
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
    super.eventMouseDrag(event)

    // Get related drawing area
    const drawing_area = this.drawing_area as Class_DrawingAreaPlus
    const zdt_selected = drawing_area.selected_free_labels_list

    if (zdt_selected.length == 0) {
      if (drawing_area.isInSelectionMode()) {
        this.setPosXY(this.position_x + event.dx, this.position_y + event.dy)
        this.drawDragHandlers()
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
          .forEach(n => {
            n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
          })
        this.drawDragHandlers()
      }
    }
  }

  /**
   * Define event when mouse drag ends
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    if (this.drawing_area.isInSelectionMode()) {
      this.drawing_area.checkAndUpdateAreaSize()
    }
  }


  // GETTERS / SETTERS ==================================================================

  // Overrides --------------------------------------------------------------------------

  public override get menu_config() { return this._menu_config }
  // public override get drawing_area() { return this._display.drawing_area }

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

}
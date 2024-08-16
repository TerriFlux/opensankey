import { Class_Element } from 'open-sankey/dist/types/Element'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Type_ElementPosition } from 'open-sankey/src/types/Utils'
import { default_element_position  } from 'open-sankey/dist/types/Utils'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { default_selected_stroke_width } from 'open-sankey/dist/types/Node'



export class Class_FreeLabel extends Class_Element {
  // Attributes ========================

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



  //   label_width: number,
  //   label_height: number,

  //   x: number,
  //   y: number,



  protected _display: {
    drawing_area: Class_DrawingAreaPlus,
    position: Type_ElementPosition,

  }

  // Constructor ====================================
  constructor(id: string,
    menu_config: Class_MenuConfigPlus,
    drawing_area: Class_DrawingAreaPlus,

  ) {
    super(id, menu_config, 'g_labels')
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position as Type_ElementPosition),
    }

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
  }

  // PUBLIC METHOD ==========================
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
   * @memberof Class_FreeLabel
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
      .attr('fill-opacity', this._opacity/100)
      .attr('fill', this._color)
      .style('stroke', this._color_border)
      .style('stroke-width', this.is_selected ? default_selected_stroke_width : ((this._transparent_border) ? 0 : 1))
  }

  /**
   * Draw the content of the ZDT wich can be formated text or image
   *
   * @memberof Class_FreeLabel
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
   * @memberof Class_FreeLabel
   */
  public drawAsSelected() {
    this.draw()
  }

  /**
   * Draw the content of the zdt when it is a formated text
   * 
   * (Souldn't be called outside this class, to draw content use drawContent() )
   *
   * @private
   * @memberof Class_FreeLabel
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
   * @memberof Class_FreeLabel
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


  // MOUSE EVENT ======================

  /**
   * Deal with simple left Mouse Button (LMB) click on given element
   * @protected
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof Class_Element
   */
  protected eventSimpleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    super.eventSimpleLMBCLick(_event)
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
   * Define maintained left mouse button click for drawing area
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
        this.drawing_area.checkAndUpdateAreaSize()
      }
    } else if (zdt_selected.includes(this)) { // Only trigger the drag if we drag a selected node
      // EDITION MODE ===========================================================
      if (drawing_area.isInEditionMode()) {
        // /* TODO définir  */
      }
      // SELECTION MODE =========================================================
      else {
        // Set position
        // Update node position
        zdt_selected
          .forEach(n => {
            n.setPosXY(n.position_x + event.dx, n.position_y + event.dy)
          })
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

  // ============GETTER && SETTER ==================

  public get is_visible() {
    return super.is_visible
  }

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
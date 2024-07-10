import { Class_DrawingArea } from "./DrawingArea"
import { Class_Element } from "./Element"
import { Class_MenuConfig } from "./MenuConfig"
import { Type_ElementPosition, default_element_position } from "./Utils"

export class Class_ZoneSelection extends Class_Element {
  private _width: number = 0
  private _height: number = 0

  private _starting_x_point: number = 0

  private _starting_y_point: number = 0


  protected _display: {
    drawing_area: Class_DrawingArea,
    position: Type_ElementPosition,
  }

  constructor(
    drawing_area: Class_DrawingArea,
    menu_config: Class_MenuConfig,
  ) {

    // Init parent class attributes
    super('selection_zone', menu_config, 'g_select_zone')
    this._is_visible = false

    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      position: structuredClone(default_element_position),
    }

  }

  // public set is_visible(_:boolean){this._is_visible=_}

  // ================= METHOD ==================

  public draw() {
    super.draw()

    this.d3_selection?.append('rect')
      .attr('class', 'zone_selection')
      .attr('width', this._width)
      .attr('height', this._height)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('stroke-dasharray', '5,5')
  }
  /**
   * Set the width & height of the selection zone
   *
   * @param {number} width
   * @param {number} height
   * @memberof Class_ZoneSelection
   */
  public setSize() {

    this.d3_selection
      ?.select('.zone_selection')
      .attr('width', this._width)
      .attr('height', this._height)
  }

  /**
   * Function to select elements present in the selection zone,
   * 
   * (nodes has to be fully inside the zone to be selected)
   *
   * @memberof Class_ZoneSelection
   */
  public selectElementsInside() {
    this.drawing_area.sankey.visible_nodes_list.filter(n => {
      // Check if node is horizontally in selection zone
      const is_node_horizontally_in_zone = (n.position_x >= this.position_x) && (n.position_x <= (this.position_x + this._width)) && ((n.position_x + n.getShapeWidthToUse()) <= (this.position_x + this._width))

      // Check if node is vertically in selection zone
      const is_node_vertically_in_zone = (n.position_y >= this.position_y) && (n.position_y <= (this.position_y + this._height)) && ((n.position_y + n.getShapeHeightToUse()) <= (this.position_y + this._height))
      return is_node_horizontally_in_zone && is_node_vertically_in_zone
    })
      .forEach(n => {
        this.drawing_area.addNodeToSelection(n)
      })
  }

  /**
   * Reset selection zone by invisibilizing it and resetting it position & size
   *
   * @memberof Class_ZoneSelection
   */
  public reset() {
    this.setPosXY(0, 0)
    this._width = 0
    this._height = 0
    this.starting_x_point = 0
    this.starting_y_point = 0
    this._is_visible = false
    this.draw()
  }
  // ===================GETTER & SETTERS=====================

  public get width(): number { return this._width }
  public set width(value: number) { this._width = value }

  public get height(): number { return this._height }
  public set height(value: number) { this._height = value }

  public get starting_x_point(): number { return this._starting_x_point }
  public set starting_x_point(value: number) { this._starting_x_point = value }

  public get starting_y_point(): number { return this._starting_y_point }
  public set starting_y_point(value: number) { this._starting_y_point = value }
}
import { Class_DrawingArea } from 'open-sankey/src/types/DrawingArea'
import { Class_SankeyPlus } from './SankeyPlus'
import { Class_ApplicationDataPlus } from './ApplicationDataPlus'
import { Class_NodePlusElement } from './NodePlus'
import { initial_window_width, initial_window_height } from 'open-sankey/src/types/ApplicationData'
import { Class_FreeLabel } from './FreeLabel'
import { Class_ProtoElement } from 'open-sankey/src/types/Element'


export class Class_DrawingAreaPlus extends Class_DrawingArea {

  private _contextualised_free_label: Class_FreeLabel | undefined=undefined


  /**
   * d3 selection of svg group that contains drawing area free labels
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_free_label: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null



  constructor(height: number, width: number, application_data: Class_ApplicationDataPlus) {
    super(height, width, application_data)
  }


  // Public Method =======================

  /**
   * Override Reset drawing area from OS
   * @memberof Class_DrawingArea
   */
  public reset() {
    super.reset()
    // Add specific groups for free_labels, link and others
    this.d3_selection_free_label = this.d3_selection?.append('g').attr('id', 'g_labels') ?? null
    this.drawElements()
  }

  public drawElements(): void {
    this.sankey.free_labels_list.forEach(zdt => zdt.draw())
  }

  /**
   * Override checkAndUpdateAreaSize so it take into account free labels
   *
   * @memberof Class_DrawingAreaPlus
   */
  public checkAndUpdateAreaSize() {
    super.checkAndUpdateAreaSize()

    let max_free_label_pos_x = 0
    let max_free_label_pos_y = 0
    this.sankey.visible_free_labels_list.filter(free_label => free_label.position_type === 'absolute').map(free_label => {
      const free_label_rightest_pos = free_label.position_x + free_label.label_width
      const free_label_bottomest_pos = free_label.position_y + free_label.label_height
      max_free_label_pos_x = Math.max(max_free_label_pos_x, free_label_rightest_pos)
      max_free_label_pos_y = Math.max(max_free_label_pos_y, free_label_bottomest_pos)
    })

    // If righest free_label is too close to right drawing area border then enlarege DA
    // else reduce DA until window init witdh
    // (init DA size is computed with a sankey at scale 1 )
    if ((max_free_label_pos_x > this._width - this.grid_size) || ((max_free_label_pos_x + this._grid_size <= this._width) && (this._width > initial_window_width))) {
      this.setWidth(max_free_label_pos_x + this._grid_size)
      this.drawGrid()
    }

    // If bottomiest free_label is too close to the bottom of drawing area border then enlarege DA
    // else reduce DA until window init height
    // (init DA size is computed with a sankey at scale 1 )
    if (max_free_label_pos_y > this._height - this.grid_size || ((max_free_label_pos_y + this._grid_size <= this._height) && (this._height > initial_window_height))) {
      this.setHeight(max_free_label_pos_y + this._grid_size)
      this.drawGrid()
    }
  }
  /**
   * add a free labels from a selection set
   *
   * @param {Class_FreeLabel} zdt
   * @memberof Class_DrawingAreaPlus
   */
  public addFreeLabelToSelection(zdt: Class_FreeLabel) {
    this._selection[zdt.id] = zdt as Class_ProtoElement
    zdt.setSelected()
  }


  /**
   * remove a zdt from a selection set
   * @param {Class_FreeLabel} node
   * @memberof Class_DrawingAreaPlus
   */
  public removeFreeLabelFromSelection(zdt: Class_FreeLabel) {
    if (this._selection[zdt.id] !== undefined) {
      delete this._selection[zdt.id]
      zdt.setUnSelected()
    }
  }
  // ============GETTER && SETTER ==================

  override get sankey(): Class_SankeyPlus { return this._sankey as Class_SankeyPlus }

  public get selected_nodes_list_plus(): Class_NodePlusElement[] { return this.selected_nodes_list as Class_NodePlusElement[] }

  public get selected_free_labels_list() { return this.sankey.free_labels_list.filter(zdt => zdt.is_selected) }
  public get selected_free_labels_list_sorted() { return this.selected_free_labels_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get contextualised_free_label(): Class_FreeLabel | undefined {return this._contextualised_free_label}
  public set contextualised_free_label(value: Class_FreeLabel | undefined) {this._contextualised_free_label = value}
}
import { Class_DrawingArea } from 'open-sankey/dist/types/DrawingArea'
import { Class_SankeyPlus } from './SankeyPlus'
import { Class_ApplicationDataPlus } from './ApplicationDataPlus'
import { Class_NodePlusElement } from './NodePlus'
import { initial_window_width, initial_window_height, Class_ApplicationData } from 'open-sankey/dist/types/ApplicationData'
import { Class_FreeLabel } from './FreeLabel'
import { Class_Sankey } from 'open-sankey/dist/types/Sankey'


export class Class_DrawingAreaPlus extends Class_DrawingArea {

  private _contextualised_free_label: Class_FreeLabel | undefined = undefined
  // override _sankey:Class_SankeyPlus
  // private _sankey_plus:Class_SankeyPlus=this._sankey

  /**
   * d3 selection of svg group that contains drawing area free labels
   * @type {(d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null)}
   * @memberof Class_DrawingArea
   */
  public d3_selection_free_label: d3.Selection<SVGGElement, unknown, HTMLElement, unknown> | null = null
  constructor(height: number, width: number, application_data: Class_ApplicationDataPlus) {
    super(height, width, application_data as Class_ApplicationData)
    this._sankey = (new Class_SankeyPlus(this, this.application_data.menu_configuration)) as unknown as Class_Sankey
  }


  // Public Method =======================

  /**
   * Override Reset drawing area from OS
   * @memberof Class_DrawingArea
   */
  public reset() {
    super.reset()
    // Add specific groups for free_labels, link and others
    this.d3_selection_free_label = this.d3_selection?.insert('g','#g_links').attr('id','g_labels') ?? null
    this.drawElements()
  }

  public drawElements(): void {
    super.drawElements()
    this.sankey_plus.free_labels_list.forEach(zdt => zdt.draw())
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
    this.sankey_plus.visible_free_labels_list.filter(free_label => free_label.position_type === 'absolute').map(free_label => {
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
    this._selection[zdt.id] = zdt
    zdt.setSelected()
  }

  public addNewDefaultNodeToSankey() {
    return this.sankey.addNewDefaultNode()
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

  /**
   * override purgeSelection to include event for OSP DA
   *
   * @memberof Class_DrawingAreaPlus
   */
  override purgeSelection() {
    super.purgeSelection()
    this.application_data_plus.menu_configuration.ref_to_menu_config_free_label_updater.current()

  }
  // ============GETTER && SETTER ==================

  public get sankey_plus() { return this._sankey as unknown as Class_SankeyPlus }
  override get sankey() { return this._sankey as Class_SankeyPlus }
  override set sankey(_: Class_SankeyPlus) { this._sankey = _ }

  public get application_data_plus():Class_ApplicationDataPlus{
    return this.application_data as Class_ApplicationDataPlus
  }

  public get selected_nodes_list_plus(): Class_NodePlusElement[] { return this.selected_nodes_list as unknown as Class_NodePlusElement[] }

  public get selected_free_labels_list() { return this.sankey_plus.free_labels_list.filter(zdt => zdt.is_selected) }
  public get selected_free_labels_list_sorted() { return this.selected_free_labels_list.sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)) }

  public get contextualised_free_label(): Class_FreeLabel | undefined { return this._contextualised_free_label }
  public set contextualised_free_label(value: Class_FreeLabel | undefined) { this._contextualised_free_label = value }
}
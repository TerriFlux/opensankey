import { Class_NodeElement } from 'open-sankey/dist/types/Node'
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import * as d3 from 'd3'
import { Class_SankeyPlus } from './SankeyPlus'

export class Class_NodePlusElement extends Class_NodeElement {

  private _iconName: string
  private _iconColor: string
  private _iconVisible: boolean
  private _iconViewBox?: string | undefined
  private _iconColorSustainable: boolean

  private _has_FO: boolean
  private _is_FO_raw: boolean
  private _FO_content: string

  private _is_image: boolean
  private _image_src: string

  private _hyperlink: string
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingAreaPlus,
    menu_config: Class_MenuConfigPlus) {

    super(id, name, drawing_area, menu_config)

    this._iconName = ''
    this._iconColor = ''
    this._iconVisible = false
    this._iconViewBox = ''
    this._iconColorSustainable = false
    this._has_FO = false
    this._is_FO_raw = false
    this._FO_content = ''
    this._is_image = false
    this._image_src = ''
    this._hyperlink = ''
  }

  // PUBLIC METHOD =================================
  override draw() {
    super.draw()
    this.drawIllustration()
  }

  public drawIllustration() {
    this.d3_selection_plus?.selectAll('.illustartion').remove()
    if (this._is_image) {
      this.drawIllustrationImage()
    }
    if (this._iconVisible) {
      this.drawIllustrationIcon()
    }
  }

  public isEqualPlus(element:Class_NodePlusElement){
    this.isEqual(element as Class_NodeElement)
  }
  // PRIVATE ===========================
  private drawIllustrationImage() {
    this.d3_selection_plus?.append('image')
      .attr('id', n => 'image_node_' + n.id)
      .attr('class', 'illustartion')
      .attr('href', n => n.image_src)
      .attr('height', n => this.getShapeHeightToUse())
      .attr('width', n => this.getShapeWidthToUse())

  }

  private drawIllustrationIcon() {
    this.d3_selection_plus?.append('svg')
      .attr('id', n => 'icon_node_' + n.id)
      .attr('class', 'icon_node')
      .attr('viewBox', d => d.iconViewBox ? d.iconViewBox : '0 0 1000 1000')
      .attr('height', n => n.getShapeHeightToUse())
      .attr('width', n => n.getShapeWidthToUse())
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', this.iconColor)
      .attr('d', n => (this.drawing_area.sankey as Class_SankeyPlus).getIconFromCatalog(n.iconName))
  }


  // ============GETTER && SETTER ==================
  public get iconName(): string { return this._iconName }
  public set iconName(value: string) { this._iconName = value }

  public get d3_selection_plus(){return this.d3_selection as d3.Selection<SVGGElement, this, SVGGElement, unknown> | null}

  public get iconColor(): string { return this._iconColor }
  public set iconColor(value: string) { this._iconColor = value }

  public get iconVisible(): boolean { return this._iconVisible }
  public set iconVisible(value: boolean) { this._iconVisible = value }

  public get iconViewBox(): string | undefined { return this._iconViewBox }
  public set iconViewBox(value: string | undefined) { this._iconViewBox = value }

  public get iconColorSustainable(): boolean { return this._iconColorSustainable }
  public set iconColorSustainable(value: boolean) { this._iconColorSustainable = value }

  public get is_image(): boolean { return this._is_image }
  public set is_image(value: boolean) { this._is_image = value }

  public get image_src(): string { return this._image_src }
  public set image_src(value: string) { this._image_src = value }

}
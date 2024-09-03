// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// OpenSankey imports
import {
  Class_NodeAttribute,
  Class_NodeElement,
  Class_NodeStyle
} from '../deps/OpenSankey/types/Node'
import {
  Type_ElementPosition
} from '../deps/OpenSankey/types/Utils'
import {
  default_main_sankey_id
} from '../deps/OpenSankey/types/Sankey'

// Local imports
import { Class_MenuConfigPlus } from './MenuConfigPlus'
import { Class_DrawingAreaPlus } from './DrawingAreaPlus'
import { Class_SankeyPlus } from './SankeyPlus'

// CLASS NODE ELEMENT PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 * @export
 * @class Class_NodeElementPlus
 * @extends {Class_NodeElement}
 */
export class Class_NodeElementPlus extends Class_NodeElement<Class_DrawingAreaPlus> {

  // PUBLIC ATTRIBUTES ==================================================================

  // /**
  //  * D3 selection that contains related svg element
  //  * @type {(d3.Selection<SVGGElement, Class_Element, SVGGElement, unknown> | null)}
  //  * @memberof Class_Element
  //  */
  // declare public d3_selection: d3.Selection<SVGGElement, Class_NodeElement, SVGGElement, unknown> | null

  // PROTECTED ATTRIBUTE ================================================================

  // Definition of abstract attribut from Class_Element
  protected _display: {
    drawing_area: Class_DrawingAreaPlus,
    position: Type_ElementPosition,
    style: Class_NodeStyle,
    attributes: Class_NodeAttribute
    position_x_label?: number// Relative x position of label when dragged (optionnal)
    position_y_label?: number// Relative y position of label when dragged (optionnal)
  }

  /**
   * List of Sankey in which element appear
   * @private
   * @type {Class_SankeyPlus[]}
   * @memberof Class_ProtoElement
   */
  protected _sankeys: { [_: string]: Class_SankeyPlus }

  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {Class_MenuConfigPlus}
   * @memberof Class_Element
   */
  protected _menu_config: Class_MenuConfigPlus

  // PRIVATE ATTRIBUTES =================================================================

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

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_NodeElementPlus.
   * @param {string} id
   * @param {string} name
   * @param {Class_DrawingAreaPlus} drawing_area
   * @param {Class_MenuConfigPlus} menu_config
   * @memberof Class_NodeElementPlus
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Class_DrawingAreaPlus,
    menu_config: Class_MenuConfigPlus
  ) {
    // Heritance
    super(id, name, drawing_area, menu_config)
    // Overrides
    this._display = {
      drawing_area: this.display.drawing_area,
      position: this.display.position,
      style: this.display.drawing_area.sankey.default_node_style,
      attributes: new Class_NodeAttribute()
    }
    this._sankeys = {}
    this._menu_config = menu_config
    // New attributes
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

  // PUBLIC METHOD ======================================================================

  // Overrides --------------------------------------------------------------------------

  public override draw() {
    super.draw()
    this.drawIllustration()
    this.drawFO()
  }


  public override isEqual(_: Class_NodeElementPlus): boolean {
    const super_equal = super.isEqual(_)
    if (super_equal == false) {
      return false
    }

    if (this._iconName != _._iconName) {
      return false
    }
    if (this._iconColor != _._iconColor) {
      return false
    }
    if (this._iconVisible != _._iconVisible) {
      return false
    }
    if (this._iconViewBox != _._iconViewBox) {
      return false
    }
    if (this._iconColorSustainable != _._iconColorSustainable) {
      return false
    }
    if (this._has_FO != _._has_FO) {
      return false
    }
    if (this._is_FO_raw != _._is_FO_raw) {
      return false
    }
    if (this._FO_content != _._FO_content) {
      return false
    }
    if (this._is_image != _._is_image) {
      return false
    }
    if (this._image_src != _._image_src) {
      return false
    }
    if (this._hyperlink != _._hyperlink) {
      return false
    }
    return true
  }

  // New --------------------------------------------------------------------------------

  public drawIllustration() {
    this.d3_selection_plus?.selectAll('.illustration').remove()
    if (this._is_image) {
      this.drawIllustrationImage()
    }
    if (this._iconVisible) {
      this.drawIllustrationIcon()
    }
  }

  public drawFO() {
    this.d3_selection_plus?.select('.node_fo').remove()

    this.d3_selection_plus?.append('foreignObject')
      .attr('id', this.id + '_fo')
      .attr('class', 'node_fo')
      .attr('width', this.getShapeWidthToUse())
      .attr('height', this.getShapeHeightToUse())
      .append('xhtml:div')
      .attr('class', 'ql-editor')
      .html(this._FO_content)
  }

  // PROTECTED METHODS ====================================================================
  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventSimpleLMBCLick(event)
    if (this._display.drawing_area.static) {
      if (this._hyperlink != '') {
        window.open(this._hyperlink)
      }
    }
  }
  // PRIVATE METHODS ====================================================================

  private drawIllustrationImage() {
    this.d3_selection_plus?.append('image')
      .attr('id', n => 'image_node_' + n.id)
      .attr('class', 'illustration')
      .attr('href', n => n.image_src)
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
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
      .attr('d', n => this.main_sankey.getIconFromCatalog(n.iconName))
  }

  // GETTERS / SETTERS ==================================================================

  // Overrides --------------------------------------------------------------------------

  // // DrawingArea
  // public override get drawing_area() { return this._display.drawing_area }

  // Sankey
  public override get main_sankey(): Class_SankeyPlus {
    if (!this._sankeys[default_main_sankey_id]) {
      this._sankeys[default_main_sankey_id] = this.drawing_area.sankey
    }
    return this._sankeys[default_main_sankey_id]
  }

  // Get application config menu
  protected override get menu_config(): Class_MenuConfigPlus { return this._menu_config }

  // New ---------------------------------------------------------------------------------

  public get iconName(): string { return this._iconName }
  public set iconName(value: string) { this._iconName = value }

  public get d3_selection_plus() { return this.d3_selection as d3.Selection<SVGGElement, this, SVGGElement, unknown> | null }

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

  public get hyperlink(): string { return this._hyperlink }
  public set hyperlink(value: string) { this._hyperlink = value }

  public get has_FO(): boolean { return this._has_FO }
  public set has_FO(value: boolean) { this._has_FO = value }

  public get is_FO_raw(): boolean { return this._is_FO_raw }
  public set is_FO_raw(value: boolean) { this._is_FO_raw = value }

  public get FO_content(): string { return this._FO_content }
  public set FO_content(value: string) { this._FO_content = value }

}
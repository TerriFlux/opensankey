// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local imports
import {
  Class_AbstractNodeElementPlus,
  type Class_AbstractDrawingAreaPlus,
  type Class_AbstractSankeyPlus
} from './Abstract'
import type { Class_MenuConfigPlus } from './MenuConfigPlus'
import type { Class_LinkElementPlus } from './LinkPlus'
import {
  type Type_JSON,
  getBooleanFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON
} from '../deps/OpenSankey/types/Utils'

// CLASS NODE ELEMENT PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 * @export
 * @class Class_NodeElementPlus
 * @extends {Class_AbstractNodeElementPlus}
 */
export abstract class Class_NodeElementPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
  >
  extends Class_AbstractNodeElementPlus
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericLinkElement
  > {

  // PROTECTED ATTRIBUTE ================================================================

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
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {Class_MenuConfigPlus} menu_config
   * @memberof Class_NodeElementPlus
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfigPlus
  ) {
    // Heritance
    super(id, name, drawing_area, menu_config)
    // Overrides
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

  // ABSTRACT METHODS ===================================================================

  // Nothing ...

  // PUBLIC METHOD ======================================================================

  // Overrides --------------------------------------------------------------------------

  public override draw() {
    super.draw()
    this.drawIllustration()
    this.drawFO()
  }

  /**
   *Extract node attributes from json
   *
   * @param {Type_JSON} json_node_object
   * @param {{ [_: string]: string }} [matching_taggs_id]
   * @param {{ [_: string]: { [_: string]: string } }} [matching_tags_id]
   * @memberof Class_NodeElementPlus
   */
  public override fromJSON(
    json_node_object: Type_JSON,
    matching_taggs_id?: { [_: string]: string },
    matching_tags_id?: { [_: string]: { [_: string]: string } }
  ): void {
    super.fromJSON(json_node_object, matching_taggs_id, matching_tags_id)
    this._iconName = getStringFromJSON(json_node_object, 'iconName', this._iconName)
    this._iconColor = getStringFromJSON(json_node_object, 'iconColor', this._iconColor)
    this._iconVisible = getBooleanFromJSON(json_node_object, 'iconVisible', this._iconVisible)
    this._iconViewBox = getStringOrUndefinedFromJSON(json_node_object, 'iconViewBox')
    this._iconColorSustainable = getBooleanFromJSON(json_node_object, 'iconColorSustainable', this._iconColorSustainable)
    this._has_FO = getBooleanFromJSON(json_node_object, 'has_FO', this._has_FO)
    this._is_FO_raw = getBooleanFromJSON(json_node_object, 'is_FO_raw', this._is_FO_raw)
    this._FO_content = getStringFromJSON(json_node_object, 'FO_content', this._FO_content)
    this._is_image = getBooleanFromJSON(json_node_object, 'is_image', this._is_image)
    this._image_src = getStringFromJSON(json_node_object, 'image_src', this._image_src)
    this._hyperlink = getStringFromJSON(json_node_object, 'hyperlink', this._hyperlink)
  }

  /**
   * Convert node to JSON
   *
   * @return {*}  {Type_JSON}
   * @memberof Class_NodeElementPlus
   */
  public override toJSON(): Type_JSON {
    const json_entry = super.toJSON()

    json_entry['iconName'] = this._iconName
    json_entry['iconColor'] = this._iconColor
    json_entry['iconVisible'] = this._iconVisible
    if (this._iconViewBox) json_entry['iconViewBox'] = this._iconViewBox
    json_entry['iconColorSustainable'] = this._iconColorSustainable
    json_entry['has_FO'] = this._has_FO
    json_entry['is_FO_raw'] = this._is_FO_raw
    json_entry['FO_content'] = this._FO_content
    json_entry['is_image'] = this._is_image
    json_entry['image_src'] = this._image_src
    json_entry['hyperlink'] = this._hyperlink

    return json_entry
  }

  /**
   * Copy attributes from a given node & create/copy ref to current sankey (ref to node_taggs & style)
   *
   * @param {Class_NodeElementPlus} node_to_copy
   * @memberof Class_NodeElementPlus
   */
  public copyAttrFrom(
    node_to_copy: Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>
  ): void {
    super.copyAttrFrom(node_to_copy)

    this._iconName = node_to_copy._iconName
    this._iconColor = node_to_copy._iconColor
    this._iconVisible = node_to_copy._iconVisible
    this._iconViewBox = node_to_copy._iconViewBox
    this._iconColorSustainable = node_to_copy._iconColorSustainable
    this._has_FO = node_to_copy._has_FO
    this._is_FO_raw = node_to_copy._is_FO_raw
    this._FO_content = node_to_copy._FO_content
    this._is_image = node_to_copy._is_image
    this._image_src = node_to_copy._image_src
    this._hyperlink = node_to_copy._hyperlink
  }

  public override isEqual(
    _: Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>
  ): boolean {
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
    this.d3_selection?.selectAll('.illustration').remove()
    if (this._is_image) {
      this.drawIllustrationImage()
    }
    if (this._iconVisible) {
      this.drawIllustrationIcon()
    }
  }

  public drawFO() {
    this.d3_selection?.select('.node_fo').remove()

    this.d3_selection?.append('foreignObject')
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
    this.d3_selection?.append('image')
      .attr('id', 'image_node_' + this.id)
      .attr('class', 'illustration')
      .attr('href', this.image_src)
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
  }

  private drawIllustrationIcon() {
    this.d3_selection?.append('svg')
      .attr('id', 'icon_node_' + this.id)
      .attr('class', 'icon_node')
      .attr('viewBox', this.iconViewBox ? this.iconViewBox : '0 0 1000 1000')
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', this.iconColor)
      .attr('d', this.sankey.getIconFromCatalog(this.iconName))
  }

  // GETTERS / SETTERS ==================================================================

  // Overrides --------------------------------------------------------------------------

  // Get application config menu
  protected override get menu_config(): Class_MenuConfigPlus { return this._menu_config }

  // New ---------------------------------------------------------------------------------

  public get iconName(): string { return this._iconName }
  public set iconName(value: string) { this._iconName = value }

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
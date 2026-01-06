// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import * as d3 from 'd3'
import { MouseEvent } from 'react'

import {
  getBooleanFromJSON,
  Type_JSON,
  const_default_position_x,
  const_default_position_y,
  getStringFromJSON,
  randomId,
  Type_BaseElementPosition,
  default_style_id,
  getStringListFromJSON,
  getJSONOrUndefinedFromJSON
} from '../types/Utils'
import { Class_DrawingArea } from '../types/DrawingArea'
import {
  AttributeConfig, 
  IconLabelAttributeTypes,
  LinkLabelSpecificValues, LINKS_ATTRIBUTES_CONFIG, LinkShapeSpecificValues,
  NameLabelAttributeTypes, NODES_ATTRIBUTES_CONFIG, NodeShapeSpecificAttributeTypes, ShapeAttributeTypes,
  Type_Orientation, Type_PathLabelHPosition, Type_PathLabelVPosition, Type_TextHPos, Type_TextVPos, ValueLabelAttributeTypes
} from './ElementsAttributesConfig'
import { AttributeMappings } from '../Persistence/SankeyPersistence'

export abstract class Class_BaseElement {
  public d3_selection: d3.Selection<SVGGElement, unknown, SVGGElement, unknown> | null = null
  private _drawing_area: Class_DrawingArea
  protected _is_visible: boolean = false
  protected _visibility_fingerprint: string

  private _is_currently_deleted = false

  protected _position: Type_BaseElementPosition
  protected _is_selected: boolean = false
  protected _svg_parent_group: string
  protected _id: string
  protected _is_mouse_over: boolean = false
  protected _is_mouse_grabbed: boolean = false

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    is_visible: boolean,
    svg_parent_group: string,
  ) {
    this._id = id
    this._is_visible = is_visible
    this._svg_parent_group = svg_parent_group

    this._drawing_area = drawing_area
    this._position = {
      x: const_default_position_x,
      y: const_default_position_y
    }
    this._visibility_fingerprint = randomId()
  }

  public setEventsListeners() {
    this.d3_selection?.on(
      'contextmenu',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventSimpleRMBCLick(event))
    // Right mouse button clicks
    this.d3_selection?.on(
      'click',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventSimpleLMBCLick(event))
    if (!this.drawing_area.static) {

      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBCLick(event))
      // Left mouse button click

      // Changed call of drag, we have to use only on time call because otherwise each .call erase the previous .call event
      if (this.drawing_area.isInSelectionMode()) {
        this.d3_selection?.call(
          d3.drag<SVGGElement, unknown>()
            .on('start',
              (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
                this.eventMouseDragStart(event))
            .on('drag',
              (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
                this.eventMouseDrag(event))
            .on('end',
              (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) =>
                this.eventMouseDragEnd(event))
        )
      }
      // In edition mode we don't use drag event on elements
      else if (this.drawing_area.isInEditionMode()) {
        this.d3_selection?.on('mousedown.drag', null) // Remove dag event
      }
    }
    // Right mouse button maintained
    this.d3_selection?.on(
      'mousedown',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMaintainedClick(event))
    this.d3_selection?.on(
      'mouseup',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventReleasedClick(event))
    // Mouse cursor goes over this
    this.d3_selection?.on(
      'mouseover',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMouseOver(event))
    this.d3_selection?.on(
      'mouseout',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMouseOut(event))
    // Mouse cursor move
    this.d3_selection?.on(
      'mousemove',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventMouseMove(event))
  }
  public delete() {
    if (this._is_currently_deleted === false) {
      // Set deletion boolean to true
      this._is_currently_deleted = true
      // Remove from drawing area
      this.unDraw()
      // Abstract method for cleaning relations between elements
      this.cleanForDeletion()
    }
  }
  protected cleanForDeletion() {
    // Does nothing here
  }

  public copyFrom(element_to_copy: Class_BaseElement) {
    // Remove from drawing area
    this.unDraw()
    // Copy intrasect values
    this._copyFrom(element_to_copy)
    // We will need to check all visibility tests after copy
    this.updateVisibilityFingerprint()
  }

  protected _copyFrom(element: Class_BaseElement) {
    this._is_visible = element._is_visible
    this._is_selected = element._is_selected
    this._position.x = element.position_x
    this._position.y = element.position_y
    this._svg_parent_group = element._svg_parent_group;
  }

  public draw() {
    this.unDraw()
    if (this.is_visible && !this._is_currently_deleted)
      this._draw()
  }
  protected _draw() {
    this._initDraw()
    this.setEventsListeners()
  }

  public unDraw() {
    if (this.d3_selection !== null) {
      this.d3_selection.remove()
      this.d3_selection = null
    }
  }

  protected _initDraw() {
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      const d3_drawing_area_selection = d3_drawing_area.selectAll(' #' + this._svg_parent_group)
      if (d3_drawing_area_selection.nodes().length > 0) {
        this.d3_selection = d3_drawing_area_selection.append('g')
        this.d3_selection.attr('id', this.svg_group)
      }
    }
  }
  public setPosXY(x: number, y: number) {
    this._position.x = x; this._position.y = y; this.applyPosition()
  }
  protected applyPosition() {
    this.d3_selection?.attr(
      'transform',
      'translate(' + this.position_x + ', ' + this.position_y + ')')
  }
  public get position_x() { return this._position.x }
  public set position_x(_) { this._position.x = _ }
  public get position_y() { return this._position.y }
  public set position_y(_) { this._position.y = _ }

  public get drawing_area() { return this._drawing_area }
  public get is_visible() {
    return (this.sankey.is_visible && this._is_visible)
  }
  public get visibility_fingerprint() { return this._visibility_fingerprint }
  public setVisible() { this._is_visible = true; this.updateVisibilityFingerprint(); this.draw() }
  public setInvisible() { this._is_visible = false; this.updateVisibilityFingerprint(); this.draw() }
  public updateVisibilityFingerprint() { this._visibility_fingerprint = randomId() }

  public setSelected() { this._is_selected = true; this.drawAsSelected() }
  public setUnSelected() { this._is_selected = false; this.drawAsSelected() }
  public get is_selected() { return this._is_selected }
  protected drawAsSelected() { }

  public get id() { return this._id }
  public get sankey() { return this.drawing_area.sankey }
  public get svg_parent_group() { return this._svg_parent_group }
  public get svg_group() { return 'gg_' + this._id.replace(/[^a-zA-Z0-9]/g, '') }

  public isMouseOver() { return this._is_mouse_over }
  public setMouseOver() { this._is_mouse_over = true }
  public unsetMouseOver() { this._is_mouse_over = false }

  protected eventSimpleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO do something
  }

  protected eventDoubleLMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Ajouter déclemenchement editeur nom de noeud
  }

  protected eventSimpleRMBCLick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO Ajouter ouverture menu contextuel (clic droit) sur noeud
  }

  protected eventMaintainedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
    this._is_mouse_grabbed = true
  }

  protected eventReleasedClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir clique gauche sur element */
    this._is_mouse_grabbed = false
  }

  protected eventMouseOver(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    this.sankey.nodes_list.forEach(n => n.unsetMouseOver())
    this.sankey.links_list.forEach(l => l.unsetMouseOver())
    // Update mouse over indicator for element
    this.setMouseOver()
  }

  protected eventMouseOut(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Update mouse left indicator for element
    this.unsetMouseOver()
  }

  protected eventMouseMove(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    /* TODO définir  */
  }

  protected eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  protected eventMouseDrag(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }

  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    /* TODO définir  */
  }
}
export abstract class Class_ProtoElement<
  CONFIG extends Record<string, AttributeConfig<unknown>>,
  STYLE_TYPE extends Class_ElementStyle = Class_ElementStyle
> extends Class_BaseElement {

  private _storage: StorageType<CONFIG> = {}
  private _config: CONFIG
  protected _jsonMapping: AttributeMappings

  protected _position: Type_BaseElementPosition
  protected _style: STYLE_TYPE[]

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    config: CONFIG,
    default_style: STYLE_TYPE,
    jsonMapping: AttributeMappings
  ) {
    super(id, drawing_area, true, svg_parent_group)

    this._jsonMapping = jsonMapping
    this._position = {
      x: const_default_position_x,
      y: const_default_position_y
    }
    this._style = [default_style]
    this._config = config
    this.style[0].addReference(this)
    this.createDynamicProperties()
  }

  protected createDynamicProperties() {
    (Object.keys(this._config) as Array<keyof CONFIG>).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.getElementProperty(key as keyof CONFIG),
        set: (value: ExtractAttributeValue<CONFIG[typeof key]>) => {
          const attribute = this._config[key]

          if (attribute.setter) {
            const setter = this[attribute.setter as keyof this]
            if (typeof setter === 'function') {
              setter.call(this, value)
            }
          } else {
            this._storage[key] = value
          }

          if (attribute.callback) {
            const callback = this[attribute.callback as keyof this]
            if (typeof callback === 'function') {
              callback.call(this)
            }
          }
          if (attribute.actions) {
            attribute.actions.forEach(action => {
              const actionMethod = this[action as keyof this]
              if (typeof actionMethod === 'function') {
                actionMethod.call(this)
              }
            })
          }
        },
        enumerable: true,
        configurable: true
      })
    })
  }

  public get attributes() {
    return this._storage
  }
  public set attributes(_) {
    this._storage = _
  }
  public getStyleWithAttr(k: keyof CONFIG) {
    return this._style.slice().reverse().find(s => s[k as keyof STYLE_TYPE] !== undefined) ?? this._style[0]
  }

  public getStyleProperty(k: keyof CONFIG) {
    const valueOfStyle = this.getStyleWithAttr(k)
    if (valueOfStyle[k as keyof STYLE_TYPE] !== undefined) {
      return valueOfStyle[k as keyof STYLE_TYPE]
    }
    return this._config[k].default
  }
  public getElementProperty(k: keyof CONFIG) {
    if (this._storage[k] !== undefined) {
      return this._storage[k]
    }
    return this.getStyleProperty(k)
  }

  public get style() {
    return this._style
  }

  public set style(_: STYLE_TYPE[]) {
    if (!_) return
    this._style.forEach(style => style.removeReference(this))
    this._style = _
    _.forEach(style => style.addReference(this))

    this.draw()
  }

  public resetAttributes() {
    this._storage = {}
    this.draw()
  }

  protected shouldSaveAttribute(
    key: keyof CONFIG,
    value: string | number | boolean | undefined
  ): boolean {
    return value !== undefined && value !== '' && value !== this.getStyleProperty(key)
    // else if (default_style) return value !== undefined && value !== default_style[key]
    // else return value !== undefined && value !== this._config[key].default
  }

  public useDefaultStyle() {
  }

  public isAttributeOverloaded(attr: keyof CONFIG) {
    if (this._storage[attr] === undefined) return false
    if (this._storage[attr] === this.getStyleWithAttr(attr)[attr as keyof STYLE_TYPE]) return false
    return true
  }

  public delete_attribute(k: keyof CONFIG) {
    delete this._storage[k]
  }

  protected cleanForDeletion() {
    this.style.forEach(s => s.removeReference(this))
  }

  public isEqual(_: this) {
    return Object.keys(this._config).every(attr => this[attr as keyof Class_ProtoElement<CONFIG>] === _[attr as keyof Class_ProtoElement<CONFIG>])
  }

  public copyAttrFrom(element_to_copy: Class_ProtoElement<CONFIG>) {
    this._storage = {};
    (Object.keys(element_to_copy._storage) as Array<keyof CONFIG>).forEach(key => {
      if (element_to_copy._storage[key] !== this.getStyleProperty(key as keyof CONFIG)) {
        this._storage[key] = element_to_copy._storage[key]
      }
    })
  }
  protected _copyFrom(element_to_copy: Class_ProtoElement<CONFIG>) {
    super._copyFrom(element_to_copy)
    this.copyAttrFrom(element_to_copy)
    this.updateVisibilityFingerprint()
  }

  public toJSON(
    json_object: Type_JSON,
    _kwargs?: Type_JSON
  ) {
    json_object['id'] = this._id
    if (!this._is_visible) json_object['is_visible'] = this._is_visible;

    // Fill style & local attributes
    if (this.style.length > 0) json_object['style'] = this.style.map(s => s.id)
    //const attr_json = this._display.attributes.toJSON(this, null)
    if (Object.keys(this._storage).length > 0) {
      json_object['local'] = {} as Type_JSON
      const toJsonMapping = this._jsonMapping.getToJsonMapping();
      (Object.entries(this._storage) as Array<[keyof CONFIG, any]>).forEach(([key, value]) => {
        if (this.shouldSaveAttribute(key as keyof CONFIG, value)) {
          const jsonKey = toJsonMapping[key as string] || (key as string);
          (json_object['local'] as Type_JSON)[jsonKey] = value
        }
      })
    }

    return json_object
  }

  public fromJSON(json_object: Type_JSON, _kwargs?: Type_JSON) {
    this.unDraw()

    this._id = getStringFromJSON(json_object, 'id', this._id)
    this._is_visible = getBooleanFromJSON(json_object, 'is_visible', this._is_visible)

    const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])

    // this.style = style_id.map(s_id => this.sankey.link_styles_dict[s_id])
    // if (!Array.isArray(json_object.style)) {
    //   const style_id = getStringFromJSON(json_object, 'style', default_style_id)
    //   this.style = [this.sankey.node_styles_dict[style_id]]
    // } else {
    //   const style_id = getStringListFromJSON(json_object, 'style', [default_style_id])
    //   this.style = style_id.map(s_id => this.sankey.node_styles_dict[s_id]) as Class_ElementStyle[]
    // }

    const json_local_object = getJSONOrUndefinedFromJSON(json_object, 'local')
    if (json_local_object) {
      // this._display.attributes.fromJSON(json_local_object, this, null)
      // If local attribute have key local_scale then update local scale domain


      const fromJsonMapping = this._jsonMapping.getFromJsonMapping()

      // ✅ Typage correct
      Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
        if (json_object[jsonKey] !== undefined) {
          const key = attrKey as keyof CONFIG
          if (json_object[jsonKey] !== this.getStyleProperty(key as keyof CONFIG)) {
            this._storage[key] = json_object[jsonKey] as ExtractAttributeValue<CONFIG[typeof key]>
          }
        }
      });

      // Traitement des attributs directs (même nom)
      (Object.keys(this._config) as Array<keyof CONFIG>).forEach(key => {
        if (json_object[key as string] !== undefined) {
          if (json_object[key as string] !== this.getStyleProperty(key as keyof CONFIG)) {
            this._storage[key] = json_object[key as string] as ExtractAttributeValue<CONFIG[typeof key]>
          }
        }
      })
    }

    this.updateVisibilityFingerprint()
  }

  public isRelatedD3SelectionPresentAndSynced() {
    const d3_drawing_area = this.drawing_area.d3_selection
    if (d3_drawing_area !== null) {
      const d3_drawing_area_selection = d3_drawing_area.selectAll(' #' + this._svg_parent_group)
      if (d3_drawing_area_selection.nodes().length > 0) {
        const d3_selection = d3_drawing_area_selection.selectAll(' #' + this.svg_group)
        if (d3_selection && d3_selection.nodes().length > 0)
          return true
      }
    }
    return false
  }

  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this.drawing_area.bypass_redraws)
      return
    process_func()
  }

  public saveUndo(f: (_: Class_ProtoElement<CONFIG>) => void) {
    this.drawing_area.application_data.history.saveUndo(() => { f(this) })
  }

  public saveRedo(f: (_: Class_ProtoElement<CONFIG>) => void) {
    this.drawing_area.application_data.history.saveRedo(() => { f(this) })
  }
}
export abstract class Class_BaseShape<
  CONFIG extends Record<string, AttributeConfig<any>>,
  STYLE_TYPE extends Class_ElementStyle = Class_ElementStyle
> extends Class_ProtoElement<CONFIG, STYLE_TYPE> {
  // =================== SHAPE ATTRIBUTES (shape_*) ===================
  shape_visible!: ShapeAttributeTypes['visible']
  shape_type!: ShapeAttributeTypes['type']
  shape_min_width!: ShapeAttributeTypes['min_width'] //only nodes
  shape_min_height!: ShapeAttributeTypes['min_height'] //only nodes
  shape_color_visible!: ShapeAttributeTypes['color_visible']
  shape_color!: ShapeAttributeTypes['color']
  shape_opacity!: ShapeAttributeTypes['opacity']
  shape_color_sustainable!: ShapeAttributeTypes['color_sustainable']

  // =================== BORDER ATTRIBUTES (border_*) ===================
  shape_border_visible!: ShapeAttributeTypes['border_visible']
  shape_border_color!: ShapeAttributeTypes['border_color']
  shape_border_thickness!: ShapeAttributeTypes['border_thickness']
  shape_border_dashed!: ShapeAttributeTypes['border_dashed']
  shape_border_radius!: ShapeAttributeTypes['border_radius']

  // =================== NAME LABEL ATTRIBUTES (name_label_*) ===================
  // Visibility & Font
  name_label_has_fo!: NameLabelAttributeTypes['has_fo']
  name_label_fo_content!: NameLabelAttributeTypes['fo_content']

  name_label_is_visible!: NameLabelAttributeTypes['is_visible']
  name_label_font_family!: NameLabelAttributeTypes['font_family']
  name_label_font_size!: NameLabelAttributeTypes['font_size']
  name_label_uppercase!: NameLabelAttributeTypes['uppercase']
  name_label_bold!: NameLabelAttributeTypes['bold']
  name_label_italic!: NameLabelAttributeTypes['italic']
  name_label_color!: NameLabelAttributeTypes['color']
  // Separator
  name_label_separator!: NameLabelAttributeTypes['separator']
  name_label_separator_part!: NameLabelAttributeTypes['separator_part']

  // Position
  name_label_horiz!: NameLabelAttributeTypes['horiz']
  name_label_vert!: NameLabelAttributeTypes['vert']
  name_label_horiz_shift!: NameLabelAttributeTypes['horiz_shift']
  name_label_vert_shift!: NameLabelAttributeTypes['vert_shift']
  name_label_box_width!: NameLabelAttributeTypes['box_width'] // same as name_label_background_min_width ?
  name_label_vertical_text!: NameLabelAttributeTypes['vertical_text']
  name_label_position_x!: NameLabelAttributeTypes['position_x']
  name_label_position_y!: NameLabelAttributeTypes['position_y']
  name_label_position_offset!: NameLabelAttributeTypes['position_offset']
  name_label_text_align!: NameLabelAttributeTypes['text_align']
  name_label_inside_horiz!: NameLabelAttributeTypes['inside_horiz']
  name_label_inside_vert!: NameLabelAttributeTypes['inside_vert']
  // Background
  name_label_background_visible!: NameLabelAttributeTypes['background_visible']
  name_label_background_color!: NameLabelAttributeTypes['background_color']
  name_label_background_opacity!: NameLabelAttributeTypes['background_opacity']
  name_label_background_type!: NameLabelAttributeTypes['background_type']
  name_label_background_min_width!: NameLabelAttributeTypes['background_min_width']
  name_label_background_min_height!: NameLabelAttributeTypes['background_min_height']
  name_label_background_color_visible!: NameLabelAttributeTypes['background_color_visible']
  name_label_background_color_sustainable!: NameLabelAttributeTypes['background_color_sustainable']
  name_label_background_border_visible!: NameLabelAttributeTypes['background_border_visible']
  name_label_background_border_color!: NameLabelAttributeTypes['background_border_color']
  name_label_background_border_thickness!: NameLabelAttributeTypes['background_border_thickness']
  name_label_background_border_dashed!: NameLabelAttributeTypes['background_border_dashed']
  name_label_background_border_radius!: NameLabelAttributeTypes['background_border_radius']


  // =================== VALUE LABEL ATTRIBUTES (value_label_*) ===================
  // Visibility & Font
  value_label_has_fo!: ValueLabelAttributeTypes['has_fo']
  value_label_fo_content!: ValueLabelAttributeTypes['fo_content']

  value_label_is_visible!: ValueLabelAttributeTypes['is_visible']
  value_label_font_family!: ValueLabelAttributeTypes['font_family']
  value_label_font_size!: ValueLabelAttributeTypes['font_size']
  value_label_uppercase!: ValueLabelAttributeTypes['uppercase']
  value_label_bold!: ValueLabelAttributeTypes['bold']
  value_label_italic!: ValueLabelAttributeTypes['italic']
  value_label_color!: ValueLabelAttributeTypes['color']

  // Position
  value_label_horiz!: ValueLabelAttributeTypes['horiz']
  value_label_vert!: ValueLabelAttributeTypes['vert']
  value_label_horiz_shift!: ValueLabelAttributeTypes['horiz_shift']
  value_label_vert_shift!: ValueLabelAttributeTypes['vert_shift']
  value_label_box_width!: ValueLabelAttributeTypes['box_width']
  value_label_vertical_text!: ValueLabelAttributeTypes['vertical_text']
  value_label_position_x!: ValueLabelAttributeTypes['position_x']
  value_label_position_y!: ValueLabelAttributeTypes['position_y']
  value_label_position_offset!: ValueLabelAttributeTypes['position_offset']
  value_label_text_align!: ValueLabelAttributeTypes['text_align']
  value_label_inside_horiz!: ValueLabelAttributeTypes['inside_horiz']
  value_label_inside_vert!: ValueLabelAttributeTypes['inside_vert']
  // Background
  value_label_background_visible!: ValueLabelAttributeTypes['background_visible']
  value_label_background_color!: ValueLabelAttributeTypes['background_color']
  value_label_background_opacity!: ValueLabelAttributeTypes['background_opacity']
  value_label_background_type!: ValueLabelAttributeTypes['background_type']
  value_label_background_min_width!: ValueLabelAttributeTypes['background_min_width']
  value_label_background_min_height!: ValueLabelAttributeTypes['background_min_height']
  value_label_background_color_visible!: ValueLabelAttributeTypes['background_color_visible']
  value_label_background_color_sustainable!: ValueLabelAttributeTypes['background_color_sustainable']
  value_label_background_border_visible!: ValueLabelAttributeTypes['background_border_visible']
  value_label_background_border_color!: ValueLabelAttributeTypes['background_border_color']
  value_label_background_border_thickness!: ValueLabelAttributeTypes['background_border_thickness']
  value_label_background_border_dashed!: ValueLabelAttributeTypes['background_border_dashed']
  value_label_background_border_radius!: ValueLabelAttributeTypes['background_border_radius']

  // Formatting
  value_label_scientific_notation!: ValueLabelAttributeTypes['scientific_notation']
  value_label_significant_digits!: ValueLabelAttributeTypes['significant_digits']
  value_label_nb_significant_digits!: ValueLabelAttributeTypes['nb_significant_digits']
  value_label_custom_digit!: ValueLabelAttributeTypes['custom_digit']
  value_label_nb_digit!: ValueLabelAttributeTypes['nb_digit']

  // Units
  value_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  value_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  value_label_unit!: ValueLabelAttributeTypes['unit']
  value_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

  // =================== ICON ATTRIBUTES (icon_*) ===================
  icon_color!: IconLabelAttributeTypes['color']
  icon_is_visible!: IconLabelAttributeTypes['is_visible']
  icon_icon_name!: IconLabelAttributeTypes['icon_name']
  icon_view_box!: IconLabelAttributeTypes['view_box']
  icon_color_sustainable!: IconLabelAttributeTypes['color_sustainable']
  icon_horiz!: IconLabelAttributeTypes['horiz']
  icon_vert!: IconLabelAttributeTypes['vert']
  icon_horiz_shift!: IconLabelAttributeTypes['horiz_shift']
  icon_vert_shift!: IconLabelAttributeTypes['vert_shift']
  icon_is_image!: IconLabelAttributeTypes['is_image']
  icon_image_src!: IconLabelAttributeTypes['image_src']

  hyperlink!: string | undefined
}

export abstract class Class_NodeAttribute extends Class_BaseShape<typeof NODES_ATTRIBUTES_CONFIG, Class_ElementStyle> {
  orphan_node_visible!: boolean
  position_type!: NodeShapeSpecificAttributeTypes['position_type']
  position_dx!: NodeShapeSpecificAttributeTypes['position_dx']
  position_dy!: NodeShapeSpecificAttributeTypes['position_dy']
  margin_bottom!: NodeShapeSpecificAttributeTypes['margin_bottom']
  margin_top!: NodeShapeSpecificAttributeTypes['margin_top']
  margin_left!: NodeShapeSpecificAttributeTypes['margin_left']
  margin_right!: NodeShapeSpecificAttributeTypes['margin_right']

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    attributeMappings: AttributeMappings,
    default_style: Class_ElementStyle
  ) {
    super(
      id, drawing_area, svg_parent_group,
      NODES_ATTRIBUTES_CONFIG, default_style, attributeMappings
    )
  }

}

export abstract class Class_LinkAttribute extends Class_BaseShape<typeof LINKS_ATTRIBUTES_CONFIG, Class_ElementStyle> {
  shape_local_link_scale!: LinkShapeSpecificValues['local_link_scale']
  shape_is_curved!: LinkShapeSpecificValues['is_curved']
  shape_curvature!: LinkShapeSpecificValues['curvature']
  shape_is_recycling!: LinkShapeSpecificValues['is_recycling']
  shape_is_structure!: LinkShapeSpecificValues['is_structure']
  shape_orientation!: LinkShapeSpecificValues['orientation']
  shape_starting_curve!: LinkShapeSpecificValues['starting_curve']
  shape_ending_curve!: LinkShapeSpecificValues['ending_curve']
  shape_starting_tangeant!: LinkShapeSpecificValues['starting_tangeant']
  shape_ending_tangeant!: LinkShapeSpecificValues['ending_tangeant']
  shape_middle_recycling!: LinkShapeSpecificValues['middle_recycling']
  shape_is_arrow!: LinkShapeSpecificValues['is_arrow']
  shape_arrow_size!: LinkShapeSpecificValues['arrow_size']
  shape_is_dashed!: LinkShapeSpecificValues['is_dashed']
  shape_color_rule!: LinkShapeSpecificValues['color_rule']

  value_label_on_path!: LinkLabelSpecificValues['on_path']
  value_label_pos_auto!: LinkLabelSpecificValues['pos_auto']

  name_label_on_path!: LinkLabelSpecificValues['on_path']
  name_label_pos_auto!: LinkLabelSpecificValues['pos_auto']

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    attributeMappings: AttributeMappings,
    default_style: Class_ElementStyle
  ) {
    super(
      id, drawing_area, svg_parent_group,
      LINKS_ATTRIBUTES_CONFIG, default_style, attributeMappings
    )
  }

  // Setters personnalisés pour la logique complexe
  private customShapeOrientation(value: Type_Orientation) {
    if ((!this.shape_is_recycling) && (
      ((this.shape_orientation === 'vh') || (this.shape_orientation === 'hv')) &&
      ((value === 'hh') || (value === 'vv'))
    )) {
      if (this.shape_starting_curve !== undefined) this.attributes.shape_starting_curve = this.shape_starting_curve / 2
      if (this.shape_ending_curve !== undefined) this.attributes.shape_ending_curve = this.shape_ending_curve / 2
    }
    this.attributes.shape_orientation = value
    this.updateLinkAndSourceTarget()
  }

  private customStartingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this.shape_is_recycling) {
        if ((this.shape_orientation === 'vh') || (this.shape_orientation === 'hv')) {
          this.attributes.shape_starting_curve = value <= 1.0 ? value : 1.0
        } else {
          const endingCurve = this.shape_ending_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_ending_curve.default
          this.attributes.shape_starting_curve = (value + endingCurve) <= 1.0 ? value : 1.0 - endingCurve
        }
      } else {
        this.attributes.shape_starting_curve = value
      }
    } else {
      this.attributes.shape_starting_curve = value
    }
  }

  private customEndingCurve(value: number) {
    if (value !== undefined && value >= 0) {
      if (!this.shape_is_recycling) {
        if ((this.shape_orientation === 'vh') || (this.shape_orientation === 'hv')) {
          this.attributes.shape_ending_curve = value <= 1.0 ? value : 1.0
        } else {
          const startingCurve = this.shape_starting_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_starting_curve.default
          this.attributes.shape_ending_curve = (value + startingCurve) <= 1.0 ? value : 1.0 - startingCurve
        }
      } else {
        this.attributes.shape_ending_curve = value
      }
    } else {
      this.attributes.shape_ending_curve = value
    }
  }

  private customStartingTangeant(value: number) {
    this.attributes['shape_starting_tangeant'] = (value !== undefined && value > 0) ? value : value

  }

  private customEndingTangeant(value: number) {
    this.attributes['shape_ending_tangeant'] = (value !== undefined && value > 0) ? value : value

  }

  private customShapeIsRecycling(value: boolean) {
    // En mode recycling, pas de limite supérieure pour starting & ending
    // En mode normal, on a des limites, donc on doit les appliquer
    if (!value && this.attributes.shape_is_recycling) {
      this.shape_starting_curve = Math.min(this.shape_starting_curve, 0.25)
      this.shape_ending_curve = Math.min(this.shape_ending_curve, 0.25)
    }
    this.attributes.shape_is_recycling = value
  }


  // Méthodes abstraites
  // protected update() { }
  protected updateLinkAndSourceTarget() { }
}

// Type helper pour extraire le type de valeur d'un AttributeConfig
type ExtractAttributeValue<T> = T extends AttributeConfig<infer U> ? U : never

// Type pour le storage basé sur CONFIG
export type StorageType<CONFIG extends Record<string, AttributeConfig<unknown>>> = {
  -readonly [K in keyof CONFIG]?: ExtractAttributeValue<CONFIG[K]>
}
export class Class_ElementStyle {
  shape_visible!: ShapeAttributeTypes['visible']
  shape_type!: ShapeAttributeTypes['type']
  shape_min_width!: ShapeAttributeTypes['min_width'] //only nodes
  shape_min_height!: ShapeAttributeTypes['min_height'] //only nodes
  shape_color_visible!: ShapeAttributeTypes['color_visible']
  shape_color!: ShapeAttributeTypes['color']
  shape_opacity!: ShapeAttributeTypes['opacity']
  shape_color_sustainable!: ShapeAttributeTypes['color_sustainable']

  // =================== BORDER ATTRIBUTES (border_*) ===================
  shape_border_visible!: ShapeAttributeTypes['border_visible']
  shape_border_color!: ShapeAttributeTypes['border_color']
  shape_border_thickness!: ShapeAttributeTypes['border_thickness']
  shape_border_dashed!: ShapeAttributeTypes['border_dashed']
  shape_border_radius!: ShapeAttributeTypes['border_radius']

  // =================== NAME LABEL ATTRIBUTES (name_label_*) ===================
  // Visibility & Font
  name_label_has_fo!: NameLabelAttributeTypes['has_fo']
  name_label_fo_content!: NameLabelAttributeTypes['fo_content']

  name_label_is_visible!: NameLabelAttributeTypes['is_visible']
  name_label_font_family!: NameLabelAttributeTypes['font_family']
  name_label_font_size!: NameLabelAttributeTypes['font_size']
  name_label_uppercase!: NameLabelAttributeTypes['uppercase']
  name_label_bold!: NameLabelAttributeTypes['bold']
  name_label_italic!: NameLabelAttributeTypes['italic']
  name_label_color!: NameLabelAttributeTypes['color']
  // Separator
  name_label_separator!: NameLabelAttributeTypes['separator']
  name_label_separator_part!: NameLabelAttributeTypes['separator_part']

  // Position
  name_label_horiz!: NameLabelAttributeTypes['horiz']
  name_label_vert!: NameLabelAttributeTypes['vert']
  name_label_horiz_shift!: NameLabelAttributeTypes['horiz_shift']
  name_label_vert_shift!: NameLabelAttributeTypes['vert_shift']
  name_label_box_width!: NameLabelAttributeTypes['box_width'] // same as name_label_background_min_width ?
  name_label_vertical_text!: NameLabelAttributeTypes['vertical_text']
  name_label_position_x!: NameLabelAttributeTypes['position_x']
  name_label_position_y!: NameLabelAttributeTypes['position_y']
  name_label_position_offset!: NameLabelAttributeTypes['position_offset']
  name_label_position_absolute!: NameLabelAttributeTypes['position_absolute']
  name_label_text_align!: NameLabelAttributeTypes['text_align']
  name_label_inside_horiz!: NameLabelAttributeTypes['inside_horiz']
  name_label_inside_vert!: NameLabelAttributeTypes['inside_vert']
  // Background
  name_label_background_visible!: NameLabelAttributeTypes['background_visible']
  name_label_background_color!: NameLabelAttributeTypes['background_color']
  name_label_background_opacity!: NameLabelAttributeTypes['background_opacity']
  name_label_background_type!: NameLabelAttributeTypes['background_type']
  name_label_background_min_width!: NameLabelAttributeTypes['background_min_width']
  name_label_background_min_height!: NameLabelAttributeTypes['background_min_height']
  name_label_background_color_visible!: NameLabelAttributeTypes['background_color_visible']
  name_label_background_color_sustainable!: NameLabelAttributeTypes['background_color_sustainable']
  name_label_background_border_visible!: NameLabelAttributeTypes['background_border_visible']
  name_label_background_border_color!: NameLabelAttributeTypes['background_border_color']
  name_label_background_border_thickness!: NameLabelAttributeTypes['background_border_thickness']
  name_label_background_border_dashed!: NameLabelAttributeTypes['background_border_dashed']
  name_label_background_border_radius!: NameLabelAttributeTypes['background_border_radius']


  // =================== VALUE LABEL ATTRIBUTES (value_label_*) ===================
  // Visibility & Font
  value_label_has_fo!: ValueLabelAttributeTypes['has_fo']
  value_label_fo_content!: ValueLabelAttributeTypes['fo_content']

  value_label_is_visible!: ValueLabelAttributeTypes['is_visible']
  value_label_font_family!: ValueLabelAttributeTypes['font_family']
  value_label_font_size!: ValueLabelAttributeTypes['font_size']
  value_label_uppercase!: ValueLabelAttributeTypes['uppercase']
  value_label_bold!: ValueLabelAttributeTypes['bold']
  value_label_italic!: ValueLabelAttributeTypes['italic']
  value_label_color!: ValueLabelAttributeTypes['color']

  // Position
  value_label_horiz!: ValueLabelAttributeTypes['horiz']
  value_label_vert!: ValueLabelAttributeTypes['vert']
  value_label_horiz_shift!: ValueLabelAttributeTypes['horiz_shift']
  value_label_vert_shift!: ValueLabelAttributeTypes['vert_shift']
  value_label_box_width!: ValueLabelAttributeTypes['box_width']
  value_label_vertical_text!: ValueLabelAttributeTypes['vertical_text']
  value_label_position_x!: ValueLabelAttributeTypes['position_x']
  value_label_position_y!: ValueLabelAttributeTypes['position_y']
  value_label_position_offset!: ValueLabelAttributeTypes['position_offset']
  value_label_position_absolute!: ValueLabelAttributeTypes['position_absolute']
  value_label_text_align!: ValueLabelAttributeTypes['text_align']
  value_label_inside_horiz!: ValueLabelAttributeTypes['inside_horiz']
  value_label_inside_vert!: ValueLabelAttributeTypes['inside_vert']
  // Background
  value_label_background_visible!: ValueLabelAttributeTypes['background_visible']
  value_label_background_color!: ValueLabelAttributeTypes['background_color']
  value_label_background_opacity!: ValueLabelAttributeTypes['background_opacity']
  value_label_background_type!: ValueLabelAttributeTypes['background_type']
  value_label_background_min_width!: ValueLabelAttributeTypes['background_min_width']
  value_label_background_min_height!: ValueLabelAttributeTypes['background_min_height']
  value_label_background_color_visible!: ValueLabelAttributeTypes['background_color_visible']
  value_label_background_color_sustainable!: ValueLabelAttributeTypes['background_color_sustainable']
  value_label_background_border_visible!: ValueLabelAttributeTypes['background_border_visible']
  value_label_background_border_color!: ValueLabelAttributeTypes['background_border_color']
  value_label_background_border_thickness!: ValueLabelAttributeTypes['background_border_thickness']
  value_label_background_border_dashed!: ValueLabelAttributeTypes['background_border_dashed']
  value_label_background_border_radius!: ValueLabelAttributeTypes['background_border_radius']

  // Formatting
  value_label_scientific_notation!: ValueLabelAttributeTypes['scientific_notation']
  value_label_significant_digits!: ValueLabelAttributeTypes['significant_digits']
  value_label_nb_significant_digits!: ValueLabelAttributeTypes['nb_significant_digits']
  value_label_custom_digit!: ValueLabelAttributeTypes['custom_digit']
  value_label_nb_digit!: ValueLabelAttributeTypes['nb_digit']

  // Units
  value_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  value_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  value_label_unit!: ValueLabelAttributeTypes['unit']
  value_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

  // =================== ICON ATTRIBUTES (icon_*) ===================
  icon_color!: IconLabelAttributeTypes['color']
  icon_is_visible!: IconLabelAttributeTypes['is_visible']
  icon_icon_name!: IconLabelAttributeTypes['icon_name']
  icon_view_box!: IconLabelAttributeTypes['view_box']
  icon_color_sustainable!: IconLabelAttributeTypes['color_sustainable']
  icon_horiz!: IconLabelAttributeTypes['horiz']
  icon_vert!: IconLabelAttributeTypes['vert']
  icon_horiz_shift!: IconLabelAttributeTypes['horiz_shift']
  icon_vert_shift!: IconLabelAttributeTypes['vert_shift']
  icon_is_image!: IconLabelAttributeTypes['is_image']
  icon_image_src!: IconLabelAttributeTypes['image_src']

  // =================== HYPERLINK ATTRIBUTES ===================
  hyperlink!: string | undefined

  shape_local_link_scale!: LinkShapeSpecificValues['local_link_scale']
  shape_is_curved!: LinkShapeSpecificValues['is_curved']
  shape_curvature!: LinkShapeSpecificValues['curvature']
  shape_is_recycling!: LinkShapeSpecificValues['is_recycling']
  shape_is_structure!: LinkShapeSpecificValues['is_structure']
  shape_orientation!: LinkShapeSpecificValues['orientation']
  shape_starting_curve!: LinkShapeSpecificValues['starting_curve']
  shape_ending_curve!: LinkShapeSpecificValues['ending_curve']
  shape_starting_tangeant!: LinkShapeSpecificValues['starting_tangeant']
  shape_ending_tangeant!: LinkShapeSpecificValues['ending_tangeant']
  shape_middle_recycling!: LinkShapeSpecificValues['middle_recycling']
  shape_is_arrow!: LinkShapeSpecificValues['is_arrow']
  shape_arrow_size!: LinkShapeSpecificValues['arrow_size']
  shape_is_dashed!: LinkShapeSpecificValues['is_dashed']
  shape_color_rule!: LinkShapeSpecificValues['color_rule']

  value_label_on_path!: LinkLabelSpecificValues['on_path']
  value_label_pos_auto!: LinkLabelSpecificValues['pos_auto']

  name_label_on_path!: LinkLabelSpecificValues['on_path']
  name_label_pos_auto!: LinkLabelSpecificValues['pos_auto']

  orphan_node_visible!: boolean
  position_type!: NodeShapeSpecificAttributeTypes['position_type']
  position_dx!: NodeShapeSpecificAttributeTypes['position_dx']
  position_dy!: NodeShapeSpecificAttributeTypes['position_dy']
  margin_bottom!: NodeShapeSpecificAttributeTypes['margin_bottom']
  margin_top!: NodeShapeSpecificAttributeTypes['margin_top']
  margin_left!: NodeShapeSpecificAttributeTypes['margin_left']
  margin_right!: NodeShapeSpecificAttributeTypes['margin_right']

  private _storage: Record<string,unknown> = {}
  private _config: Record<string, AttributeConfig<unknown>>
  private _id: string
  private _name: string
  private _is_deletable: boolean
  private _references: { [_: string]: Class_BaseElement} = {}
  private _customisable_attribute: { -readonly [K in string]: boolean } = {}
  private _attributeMappings: AttributeMappings
  private _default_style: Class_ElementStyle
  private _drawing_area: Class_DrawingArea

  constructor(
    config: Record<string, AttributeConfig<unknown>>,
    id: string,
    name: string,
    is_deletable: boolean,
    attributeMappings: AttributeMappings,
    default_style: Class_ElementStyle,
    drawing_area: Class_DrawingArea
  ) {
    this._config = config
    this._id = id
    this._name = name
    this._is_deletable = is_deletable;
    this._attributeMappings = attributeMappings
    this._default_style = default_style;
    this._drawing_area = drawing_area;
      // Initialiser les attributs customisables
      Object.keys(this._config).forEach(key => {
        this._customisable_attribute[key] = !is_deletable
      })

    if (!is_deletable) {
      Object.entries(this._config).forEach(([key, config]) => {
        this._storage[key] = config.default
      })
    }
  }
  // Getter typé
  public get(key: string) {
    return this._storage[key]
  }

  // Setter typé
  public set(key:string,value: string): void {
    this._storage[key] = value
  }

  public deleteAttribute(key: string): void {
    delete this._storage[key]
  }

  public copyFrom(element: Class_ElementStyle) {
    Object.keys(element._storage).forEach(key => {
      this._storage[key] = element._storage[key]
    })
    this._customisable_attribute = { ...element._customisable_attribute }
  }

  protected shouldSaveAttribute(
    key: string,
    value: number | string | boolean | undefined,
    default_style: Class_ElementStyle | null
  ) {
    if (default_style) {
      return value !== undefined && this._customisable_attribute[key] && value !== default_style[key as keyof Class_ElementStyle]
    }
    return value !== undefined && this._customisable_attribute[key] && value !== this._config[key].default
  }

  public delete() {
    if (this._is_deletable) {
      //Object.values(this._references).forEach(ref => ref.useDefaultStyle())
      this._references = {}
    }
  }

  public addReference(ref: Class_BaseElement) {
    if (!this._references[ref.id]) {
      this._references[ref.id] = ref
    }
  }

  public removeReference(ref: Class_BaseElement) {
    if (this._references[ref.id] !== undefined) {
      delete this._references[ref.id]
    }
  }

  protected update() {
    Object.values(this._references).forEach(ref => ref.draw())
  }

  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }
  public get customisable_attribute() { return this._customisable_attribute }

  public toJSON(): Type_JSON {
    const json_object = {} as Type_JSON
    const jsonMapping = this._attributeMappings.getToJsonMapping()
    Object.entries(this).forEach(([key, value]) => {
      if (this.shouldSaveAttribute(key, value, this._default_style)) {
        const jsonKey = jsonMapping[key] || key
        json_object[jsonKey] = value
      }
    })
    return json_object
  }

  public fromJSON(
    json_local_object: Type_JSON
  ) {
    Object.keys(this._storage).forEach(key => {
      if (this._storage[key] !== undefined) {
        this._customisable_attribute[key] = true
      }
    })
    const fromJsonMapping = this._attributeMappings.getFromJsonMapping()
    // Mapping principal depuis JSON (inclut OSP et legacy)
    Object.entries(fromJsonMapping).forEach(([jsonKey, attrKey]) => {
      if (this._default_style && json_local_object[jsonKey] !== this._default_style[attrKey as keyof Class_ElementStyle]) {
        this._storage[attrKey] = json_local_object[jsonKey]
      } else if (json_local_object[jsonKey] !== this._config[attrKey].default) {
        this._storage[attrKey] = json_local_object[jsonKey]
      }
    }
    )

    // Attributs directs (même nom)
    Object.keys(this._config).forEach(key => {
      if (json_local_object[key] !== undefined) {
        if (this._default_style && json_local_object[key] !== this._default_style[key as keyof Class_ElementStyle]) {
          this._storage[key] = json_local_object[key]
        } else if (json_local_object[key] !== this._config[key].default) {
          this._storage[key] = json_local_object[key]
        }
      }
    })
  }
  public get drawing_area() { return this._drawing_area}
}
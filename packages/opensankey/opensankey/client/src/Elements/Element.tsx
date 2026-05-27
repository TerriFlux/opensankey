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
  const_default_position_x,
  const_default_position_y,
  randomId,
  Type_BaseElementPosition,
  default_style_id
} from '../types/Utils'
import { Class_DrawingArea } from '../types/DrawingArea'
import {
  AttributeConfig,
  IconLabelAttributeTypes,
  LinkLabelSpecificValues, ALL_ATTRIBUTES_CONFIG, LinkShapeSpecificValues,
  NameLabelAttributeTypes, NodeShapeSpecificAttributeTypes, ShapeAttributeTypes, StockLabelAttributeTypes,
  Type_Orientation, ValueLabelAttributeTypes,
  ConfigType
} from './ElementsAttributesConfig'

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

  protected _process_or_bypass(
    process_func: () => void
  ) {
    if (this._drawing_area.bypass_redraws)
      return
    process_func()
  }

  public setEventsListeners() {
    this.d3_selection?.on(
      'contextmenu',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
        this.eventSimpleRMBClick(event))
    // Right mouse button clicks
    this.d3_selection?.on(
      'click',
      (event: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        // Prevent browser default on Cmd+Click (Mac opens new tab)
        if (event.metaKey) {
          event.preventDefault()
        }
        if (this.drawing_area.isInStylePaintMode()) {
          d3.selectAll('.sankey-tooltip').remove()
          if (this instanceof Class_ProtoElement)
            this.drawing_area.applyStyleFromPaintSource(this)
          if (!event.ctrlKey && !event.metaKey)
            this.drawing_area.exitStylePaintMode()
          return
        }
        this.eventSimpleLMBClick(event)
      })
    if (this.drawing_area.editable) {

      this.d3_selection?.on(
        'dblclick',
        (event: MouseEvent<HTMLButtonElement, MouseEvent>) =>
          this.eventDoubleLMBClick(event))
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
      // In style paint mode we don't use drag event on elements
      else if (this.drawing_area.isInStylePaintMode()) {
        this.d3_selection?.on('mousedown.drag', null)
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
    this._svg_parent_group = element._svg_parent_group
  }

  public draw() {
    this._process_or_bypass(() => {
      this.unDraw()
      if (this.is_visible && !this._is_currently_deleted)
        this._draw()
    })
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

  protected eventSimpleLMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Clear tooltips presents
    d3.selectAll('.sankey-tooltip').remove()
    // TODO do something
  }

  protected eventDoubleLMBClick(
    _event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // TODO Ajouter déclemenchement editeur nom de noeud
  }

  protected eventSimpleRMBClick(
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
export abstract class Class_ProtoElement extends Class_BaseElement {

  protected _clickTimer: NodeJS.Timeout | null = null
  protected _clickDelay: number = 250 // ms - délai pour distinguer simple/double clic
  protected _storage: StorageType<ConfigType> = {}
  protected _config: ConfigType

  // Suspend les actions des setters dynamiques pendant la chaîne de
  // construction. Indispensable car Babel CRA loose émet pour chaque
  // déclaration `prop!:` de Class_BaseShape un `this.prop = void 0` au
  // début du constructeur de la classe, ce qui passe par le dynamic
  // setter installé par createDynamicProperties() AVANT que les feuilles
  // (NodeBase, Node, Link, Legend...) n'aient assigné leurs helpers
  // (_nodeDrawShape, _link_shape, _stock_values, ...). Tant que ce flag
  // est true, les actions (drawShape, drawElements, drawStockBox, ...)
  // sont skippées. Chaque feuille remet ce flag à false à la fin de son
  // constructeur (cf. NodeBase, Link).
  protected _suspend_actions: boolean = true


  protected _position: Type_BaseElementPosition
  protected _style: Class_ElementStyle[]

  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    style: Class_ElementStyle
  ) {
    super(id, drawing_area, true, svg_parent_group)

    this._position = {
      x: const_default_position_x,
      y: const_default_position_y
    }
    const default_style = drawing_area.sankey.default_style
    if (style.id == default_style_id) {
      this._style = [default_style]
    } else {
      this._style = [default_style, style]
    }
    this._config = ALL_ATTRIBUTES_CONFIG
    this._style.forEach(s => s.addReference(this))
    this.createDynamicProperties()
  }

  protected createDynamicProperties() {
    (Object.keys(this._config) as Array<keyof ConfigType>).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.getElementProperty(key as keyof ConfigType),
        set: (value: ExtractAttributeValue<ConfigType[typeof key]>) => {
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
          if (attribute.actions && !this._suspend_actions) {
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
  public getStyleWithAttr(k: keyof ConfigType) {
    return this._style.slice().reverse().find(s => s[k as keyof Class_ElementStyle] !== undefined) ?? this._style[0]
  }

  public getStylesWithAttr(k: keyof ConfigType) {
    return this._style.filter(s => s[k as keyof Class_ElementStyle] !== undefined)
  }

  public getStyleProperty(k: keyof ConfigType) {
    const valueOfStyle = this.getStyleWithAttr(k)
    if (valueOfStyle && valueOfStyle[k as keyof Class_ElementStyle] !== undefined) {
      return valueOfStyle[k as keyof Class_ElementStyle]
    }
    return this._config[k].default
  }
  public getElementProperty(k: keyof ConfigType) {
    if (this._storage[k] !== undefined) {
      return this._storage[k]
    }
    return this.getStyleProperty(k)
  }

  public get style(): readonly Class_ElementStyle[] {
    return this._style
  }

  /**
   * Ajoute un style à l'élément
   * Le style est ajouté en fin de liste (donc prioritaire)
   */
  public addStyle(style: Class_ElementStyle): void {
    if (!style) return

    // Vérifier que le style n'est pas déjà présent
    if (this._style.some(s => s.id === style.id)) {
      console.warn(`Style ${style.id} is already applied to element ${this.id}`)
      return
    }

    this._style.push(style)
    style.addReference(this)
    this.draw()
  }

  /**
   * Retire un style de l'élément par son instance
   */
  public removeStyle(style: Class_ElementStyle): void {
    if (!style) return
    this.removeStyleById(style.id)
  }

  /**
   * Retire un style de l'élément par son ID
   */
  public removeStyleById(styleId: string): void {
    // Vérifier si le style existe
    const stylesToRemove = this._style.filter(s => s.id === styleId)

    if (stylesToRemove.length === 0) {
      console.warn(`Style ${styleId} not found on element ${this.id}`)
      return
    }

    // Vérifier si le style par défaut est concerné
    if (this._style[0]?.id === styleId) {
      console.warn(`Cannot remove default style from element ${this.id}`)
      return
    }

    // Filtrer tous les styles avec cet id sauf le premier (default)
    this._style = this._style.filter((s, index) => s.id !== styleId || index === 0)

    // Nettoyer les références pour tous les styles retirés
    stylesToRemove.forEach(style => {
      if (style !== this._style[0]) {
        style.removeReference(this)
      }
    })

    this.draw()
  }

  /**
   * Retire tous les styles sauf le style par défaut
   */
  public removeAllStyles(): void {
    // Conserver uniquement le premier style (style par défaut)
    const stylesToRemove = this._style.slice(1)
    this._style = [this._style[0]]

    stylesToRemove.forEach(style => style.removeReference(this))
    this.draw()
  }

  /**
   * Remplace tous les styles (sauf le défaut) par de nouveaux styles
   * Utile pour des opérations en batch
   */
  public replaceStyles(styles: Class_ElementStyle[]): void {
    if (!styles || styles.length === 0) return

    // Retirer tous les styles actuels sauf le défaut
    const stylesToRemove = this._style.slice(1)
    stylesToRemove.forEach(style => style.removeReference(this))

    // Garder le style par défaut et ajouter les nouveaux
    this._style = [this._style[0], ...styles]
    styles.forEach(style => style.addReference(this))

    this.draw()
  }

  /**
   * Vérifie si un style est appliqué à l'élément
   */
  public hasStyle(styleId: string): boolean {
    return this._style.some(s => s.id === styleId)
  }

  /**
   * Obtient un style par son ID
   */
  public getStyleById(styleId: string): Class_ElementStyle | undefined {
    return this._style.find(s => s.id === styleId)
  }

  /**
   * Obtient tous les styles sauf le style par défaut
   */
  public getCustomStyles(): Class_ElementStyle[] {
    return this._style.slice(1)
  }

  public resetAttributes() {
    this._storage = {}
    this.draw()
  }

  public shouldSaveAttribute(
    key: keyof ConfigType,
    value: string | number | boolean | undefined
  ): boolean {
    return this.getStylesWithAttr(key).length > 1 || (value !== undefined && value !== this.getStyleProperty(key))
  }

  public useDefaultStyle() {
  }

  public isAttributeOverloaded(attr: keyof ConfigType) {
    if (this._storage[attr] === undefined) return false
    if (this._storage[attr] === this.getStyleWithAttr(attr)[attr as keyof Class_ElementStyle]) return false
    return true
  }

  public delete_attribute(k: keyof ConfigType) {
    delete this._storage[k]
  }

  protected cleanForDeletion() {
    this.style.forEach(s => s.removeReference(this))
  }

  public isEqual(_: this) {
    return Object.keys(this._config).every(attr => this[attr as keyof Class_ProtoElement] === _[attr as keyof Class_ProtoElement])
  }

  public copyAttrFrom(element_to_copy: Class_ProtoElement) {
    this._storage = {};
    (Object.keys(element_to_copy._storage) as Array<keyof ConfigType>).forEach(key => {
      if (element_to_copy._storage[key] !== this.getStyleProperty(key as keyof ConfigType)) {
        this._storage[key] = element_to_copy._storage[key]
      }
    })
  }

  public snapshotStorage(): Partial<ConfigType> {
    return { ...this._storage } as Partial<ConfigType>
  }

  public restoreStorage(snapshot: Partial<ConfigType>): void {
    this._storage = { ...snapshot } as Partial<ConfigType>
  }
  protected _copyFrom(element_to_copy: Class_ProtoElement) {
    super._copyFrom(element_to_copy)
    this.copyAttrFrom(element_to_copy)
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

  public saveUndo(f: (_: Class_ProtoElement) => void) {
    this.drawing_area.application_data.history.saveUndo(() => { f(this) })
  }

  public saveRedo(f: (_: Class_ProtoElement) => void) {
    this.drawing_area.application_data.history.saveRedo(() => { f(this) })
  }

}
export abstract class Class_BaseShape extends Class_ProtoElement {
  // Sous-sélection : préfixe du label actuellement focus (clic sur le <text>
  // du label). Sert à n'afficher les poignées de redimensionnement du label
  // que quand l'utilisateur a cliqué sur le label lui-même, pas sur la forme.
  // null si aucun label n'est sub-sélectionné.
  public selected_label_prefix: 'name_label' | 'value_label' | 'icon' | null = null

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
  shape_border_color_sustainable!: ShapeAttributeTypes['border_color_sustainable']
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

  name_label_scientific_notation!: ValueLabelAttributeTypes['scientific_notation']
  name_label_significant_digits!: ValueLabelAttributeTypes['significant_digits']
  name_label_nb_significant_digits!: ValueLabelAttributeTypes['nb_significant_digits']
  name_label_custom_digit!: ValueLabelAttributeTypes['custom_digit']
  name_label_nb_digit!: ValueLabelAttributeTypes['nb_digit']

  // Units
  name_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  name_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  name_label_unit!: ValueLabelAttributeTypes['unit']
  name_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

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
  name_label_background_border_color_sustainable!: NameLabelAttributeTypes['background_border_color_sustainable']
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
  value_label_stick_to_label!: ValueLabelAttributeTypes['stick_to_label']
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
  value_label_in_out_display_mode!: ValueLabelAttributeTypes['in_out_display_mode']

  // Units
  value_label_unit_visible!: ValueLabelAttributeTypes['unit_visible']
  value_label_unit_type!: ValueLabelAttributeTypes['unit_type']
  value_label_unit!: ValueLabelAttributeTypes['unit']
  value_label_unit_factor!: ValueLabelAttributeTypes['unit_factor']

  value_label_on_path!: LinkLabelSpecificValues['on_path']
  value_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  value_label_text_source!: LinkLabelSpecificValues['text_source']

  name_label_on_path!: LinkLabelSpecificValues['on_path']
  name_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  name_label_text_source!: LinkLabelSpecificValues['text_source']

  // =================== STOCK LABEL ATTRIBUTES (stock_label_*) ===================
  stock_label_is_visible!: StockLabelAttributeTypes['is_visible']
  stock_label_font_family!: StockLabelAttributeTypes['font_family']
  stock_label_font_size!: StockLabelAttributeTypes['font_size']
  stock_label_color!: StockLabelAttributeTypes['color']
  stock_label_horiz!: StockLabelAttributeTypes['horiz']
  stock_label_vert!: StockLabelAttributeTypes['vert']
  stock_label_inside_horiz!: StockLabelAttributeTypes['inside_horiz']
  stock_label_inside_vert!: StockLabelAttributeTypes['inside_vert']
  stock_label_box_width!: StockLabelAttributeTypes['box_width']
  stock_label_background_visible!: StockLabelAttributeTypes['background_visible']
  stock_label_background_color!: StockLabelAttributeTypes['background_color']
  stock_label_background_opacity!: StockLabelAttributeTypes['background_opacity']
  stock_label_background_color_visible!: StockLabelAttributeTypes['background_color_visible']
  stock_label_background_color_sustainable!: StockLabelAttributeTypes['background_color_sustainable']
  stock_label_background_border_visible!: StockLabelAttributeTypes['background_border_visible']
  stock_label_background_border_color!: StockLabelAttributeTypes['background_border_color']
  stock_label_background_border_color_sustainable!: StockLabelAttributeTypes['background_border_color_sustainable']
  stock_label_background_border_thickness!: StockLabelAttributeTypes['background_border_thickness']
  stock_label_background_border_dashed!: StockLabelAttributeTypes['background_border_dashed']
  stock_label_background_border_radius!: StockLabelAttributeTypes['background_border_radius']
  // Number formatting & units
  stock_label_scientific_notation!: StockLabelAttributeTypes['scientific_notation']
  stock_label_significant_digits!: StockLabelAttributeTypes['significant_digits']
  stock_label_nb_significant_digits!: StockLabelAttributeTypes['nb_significant_digits']
  stock_label_custom_digit!: StockLabelAttributeTypes['custom_digit']
  stock_label_nb_digit!: StockLabelAttributeTypes['nb_digit']
  stock_label_unit_visible!: StockLabelAttributeTypes['unit_visible']
  stock_label_unit_type!: StockLabelAttributeTypes['unit_type']
  stock_label_unit!: StockLabelAttributeTypes['unit']
  stock_label_unit_factor!: StockLabelAttributeTypes['unit_factor']

  shape_orphan_node_visible!: boolean
  shape_position_type!: NodeShapeSpecificAttributeTypes['position_type']
  shape_position_dx!: NodeShapeSpecificAttributeTypes['position_dx']
  shape_position_dy!: NodeShapeSpecificAttributeTypes['position_dy']
  shape_position_u_locked!: boolean
  shape_position_v_locked!: boolean
  shape_margin_bottom!: ShapeAttributeTypes['margin_bottom']
  shape_margin_top!: ShapeAttributeTypes['margin_top']
  shape_margin_left!: ShapeAttributeTypes['margin_left']
  shape_margin_right!: ShapeAttributeTypes['margin_right']

  // =================== ICON ATTRIBUTES (icon_*) ===================
  icon_color!: IconLabelAttributeTypes['color']
  icon_is_visible!: IconLabelAttributeTypes['is_visible']
  icon_icon_name!: IconLabelAttributeTypes['icon_name']
  icon_box_width!: IconLabelAttributeTypes['box_width']
  icon_view_box!: IconLabelAttributeTypes['view_box']
  icon_color_sustainable!: IconLabelAttributeTypes['color_sustainable']
  icon_horiz!: IconLabelAttributeTypes['horiz']
  icon_vert!: IconLabelAttributeTypes['vert']
  icon_horiz_shift!: IconLabelAttributeTypes['horiz_shift']
  icon_vert_shift!: IconLabelAttributeTypes['vert_shift']
  icon_inside_horiz!: IconLabelAttributeTypes['inside_horiz']
  icon_inside_vert!: IconLabelAttributeTypes['inside_vert']
  icon_is_image!: IconLabelAttributeTypes['is_image']
  icon_image_src!: IconLabelAttributeTypes['image_src']

  hyperlink!: string | undefined

  shape_local_link_scale!: LinkShapeSpecificValues['local_link_scale']
  shape_is_curved!: LinkShapeSpecificValues['is_curved']
  shape_curvature!: LinkShapeSpecificValues['curvature']
  shape_is_recycling!: LinkShapeSpecificValues['is_recycling']
  shape_is_recycling_locked!: LinkShapeSpecificValues['is_recycling_locked']
  shape_is_structure!: LinkShapeSpecificValues['is_structure']
  shape_must_stay_straight!: LinkShapeSpecificValues['must_stay_straight']
  shape_straight_include_children!: LinkShapeSpecificValues['straight_include_children']
  shape_is_reference_flux!: LinkShapeSpecificValues['is_reference_flux']
  shape_show_as_path_locked!: LinkShapeSpecificValues['show_as_path_locked']
  shape_orientation!: LinkShapeSpecificValues['orientation']
  shape_starting_curve!: LinkShapeSpecificValues['starting_curve']
  shape_ending_curve!: LinkShapeSpecificValues['ending_curve']
  shape_starting_tangeant!: LinkShapeSpecificValues['starting_tangeant']
  shape_ending_tangeant!: LinkShapeSpecificValues['ending_tangeant']
  shape_middle_recycling!: LinkShapeSpecificValues['middle_recycling']
  shape_is_arrow!: LinkShapeSpecificValues['is_arrow']
  shape_is_arrow_reversed!: LinkShapeSpecificValues['is_arrow_reversed']
  shape_arrow_size!: LinkShapeSpecificValues['arrow_size']
  shape_is_dashed!: LinkShapeSpecificValues['is_dashed']
  shape_color_rule!: LinkShapeSpecificValues['color_rule']

  public getShapeColorToUse() {
    return this.shape_color
  }
}

export abstract class Class_LinkAttribute extends Class_BaseShape {
  constructor(
    id: string,
    drawing_area: Class_DrawingArea,
    svg_parent_group: string,
    default_style: Class_ElementStyle
  ) {
    super(
      id, drawing_area, svg_parent_group,
      default_style,
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
          const endingCurve = this.shape_ending_curve ?? this._config.shape_ending_curve.default
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
          const startingCurve = this.shape_starting_curve ?? this._config.shape_starting_curve.default
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
    const was_recycling = this.attributes.shape_is_recycling ?? false
    // Flip the flag first so any draw triggered by the outer dynamic-setter
    // actions (drawWithNodes, drawElements, drawControlPoint — see
    // is_recycling.actions) reads the new state. fromJSON writes directly
    // into `attributes` and never reaches this setter, so user-saved
    // tangent values are preserved on load.
    this.attributes.shape_is_recycling = value
    // Transition false → true: collapse Bézier tangent handles to 1% so the
    // recycling loop is tight. The 25% default (= shape_*_tangeant default)
    // would balloon the loop out.
    if (value && !was_recycling) {
      this.attributes.shape_starting_tangeant = 0.01
      this.attributes.shape_ending_tangeant = 0.01
    }
    // Transition true → false: restore tangent handles to their default so
    // the normal Bézier renders with its usual curvature. Without this the
    // tangents stay at 1%, producing a near-degenerate path whose control
    // points sit on top of the endpoints (issue #140). Direct attribute
    // writes — the per-attribute draw actions would fire mid-transition;
    // the link path is redrawn cleanly by the outer is_recycling actions.
    else if (!value && was_recycling) {
      this.attributes.shape_starting_tangeant = this._config.shape_starting_tangeant.default
      this.attributes.shape_ending_tangeant = this._config.shape_ending_tangeant.default
      // Recycling mode lifts the per-axis curve clamp; bring each curve
      // back to at most 25% so a normal flow doesn't render with the
      // wide curves that only make sense for a recycling loop.
      this.attributes.shape_starting_curve = Math.min(
        this.shape_starting_curve ?? this._config.shape_starting_curve.default,
        0.25
      )
      this.attributes.shape_ending_curve = Math.min(
        this.shape_ending_curve ?? this._config.shape_ending_curve.default,
        0.25
      )
    }
  }


  // Méthodes abstraites
  // protected update() { }
  protected updateLinkAndSourceTarget() { }
}

// Type helper pour extraire le type de valeur d'un AttributeConfig
export type ExtractAttributeValue<T> = T extends AttributeConfig<infer U> ? U : never

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
  value_label_in_out_display_mode!: ValueLabelAttributeTypes['in_out_display_mode']

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
  icon_inside_horiz!: IconLabelAttributeTypes['inside_horiz']
  icon_inside_vert!: IconLabelAttributeTypes['inside_vert']

  icon_is_image!: IconLabelAttributeTypes['is_image']
  icon_image_src!: IconLabelAttributeTypes['image_src']

  // =================== HYPERLINK ATTRIBUTES ===================
  hyperlink!: string | undefined

  shape_local_link_scale!: LinkShapeSpecificValues['local_link_scale']
  shape_is_curved!: LinkShapeSpecificValues['is_curved']
  shape_curvature!: LinkShapeSpecificValues['curvature']
  shape_is_recycling!: LinkShapeSpecificValues['is_recycling']
  shape_is_recycling_locked!: LinkShapeSpecificValues['is_recycling_locked']
  shape_is_structure!: LinkShapeSpecificValues['is_structure']
  shape_must_stay_straight!: LinkShapeSpecificValues['must_stay_straight']
  shape_straight_include_children!: LinkShapeSpecificValues['straight_include_children']
  shape_is_reference_flux!: LinkShapeSpecificValues['is_reference_flux']
  shape_show_as_path_locked!: LinkShapeSpecificValues['show_as_path_locked']
  shape_orientation!: LinkShapeSpecificValues['orientation']
  shape_starting_curve!: LinkShapeSpecificValues['starting_curve']
  shape_ending_curve!: LinkShapeSpecificValues['ending_curve']
  shape_starting_tangeant!: LinkShapeSpecificValues['starting_tangeant']
  shape_ending_tangeant!: LinkShapeSpecificValues['ending_tangeant']
  shape_middle_recycling!: LinkShapeSpecificValues['middle_recycling']
  shape_is_arrow!: LinkShapeSpecificValues['is_arrow']
  shape_is_arrow_reversed!: LinkShapeSpecificValues['is_arrow_reversed']
  shape_arrow_size!: LinkShapeSpecificValues['arrow_size']
  shape_is_dashed!: LinkShapeSpecificValues['is_dashed']
  shape_color_rule!: LinkShapeSpecificValues['color_rule']

  value_label_on_path!: LinkLabelSpecificValues['on_path']
  value_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  value_label_text_source!: LinkLabelSpecificValues['text_source']

  name_label_on_path!: LinkLabelSpecificValues['on_path']
  name_label_pos_auto!: LinkLabelSpecificValues['pos_auto']
  name_label_text_source!: LinkLabelSpecificValues['text_source']

  // =================== STOCK LABEL ATTRIBUTES (stock_label_*) ===================
  stock_label_is_visible!: StockLabelAttributeTypes['is_visible']
  stock_label_font_size!: StockLabelAttributeTypes['font_size']
  stock_label_color!: StockLabelAttributeTypes['color']
  stock_label_horiz!: StockLabelAttributeTypes['horiz']
  stock_label_vert!: StockLabelAttributeTypes['vert']
  stock_label_inside_horiz!: StockLabelAttributeTypes['inside_horiz']
  stock_label_inside_vert!: StockLabelAttributeTypes['inside_vert']
  stock_label_background_color!: StockLabelAttributeTypes['background_color']
  stock_label_background_border_color!: StockLabelAttributeTypes['background_border_color']

  shape_orphan_node_visible!: boolean
  shape_position_type!: NodeShapeSpecificAttributeTypes['position_type']
  shape_position_dx!: NodeShapeSpecificAttributeTypes['position_dx']
  shape_position_dy!: NodeShapeSpecificAttributeTypes['position_dy']
  shape_position_u_locked!: boolean
  shape_position_v_locked!: boolean
  shape_margin_bottom!: ShapeAttributeTypes['margin_bottom']
  shape_margin_top!: ShapeAttributeTypes['margin_top']
  shape_margin_left!: ShapeAttributeTypes['margin_left']
  shape_margin_right!: ShapeAttributeTypes['margin_right']

  private _storage: Record<string, unknown> = {}
  private _config: Record<string, AttributeConfig<unknown>>
  private _id: string
  private _name: string
  private _references: { [_: string]: Class_BaseElement } = {}

  private _default_style: Class_ElementStyle
  private _drawing_area: Class_DrawingArea

  constructor(
    config: Record<string, AttributeConfig<unknown>>,
    id: string,
    name: string,
    is_deletable: boolean,
    default_style: Class_ElementStyle,
    drawing_area: Class_DrawingArea
  ) {
    this._config = config
    this._id = id
    this._name = name
    this._default_style = default_style
    this._drawing_area = drawing_area

    if (!is_deletable) {
      Object.entries(this._config).forEach(([key, config]) => {
        this._storage[key] = config.default
      })
    }
    this.createDynamicProperties()
  }
  public getElementProperty(k: keyof ConfigType) {
    if (this._storage[k] !== undefined) {
      return this._storage[k]
    }
    return undefined
  }
  protected createDynamicProperties() {
    (Object.keys(this._config) as Array<keyof ConfigType>).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.getElementProperty(key as keyof ConfigType),
        set: (value: ExtractAttributeValue<ConfigType[typeof key]>) => {
          this._storage[key] = value
          Object.values(this._references).forEach(ref => ref.draw())
        },
        enumerable: true,
        configurable: true
      })
    })
  }

  public deleteAttribute(key: string): void {
    delete this._storage[key]
  }

  public copyFrom(element: Class_ElementStyle) {
    Object.keys(element._storage).forEach(key => {
      this._storage[key] = element._storage[key]
    })
  }

  public isAttributeOverloaded(
    attr: keyof ConfigType
  ) {
    if (!this._default_style ) {
      return this._storage[attr] !== undefined && this._storage[attr] !== this._config[attr].default
    }
    return true
  }

  public delete() {
    // if (this._is_deletable) {
    //   //Object.values(this._references).forEach(ref => ref.useDefaultStyle())
    this._references = {}
    // }
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
  public get attributes() { return this._storage }
  public get id() { return this._id }
  public get name() { return this._name }
  public set name(value: string) { this._name = value }

  public get drawing_area() { return this._drawing_area }
}
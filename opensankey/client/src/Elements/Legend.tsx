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

// External imports
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import { MouseEvent } from 'react'

// Local types imports
import type {
  ClassAbstract_DrawingArea,
  ClassAbstract_Sankey
} from '../types/Abstract'
import type {
  Class_MenuConfig
} from '../types/MenuConfig'

// Local modules imports
import {
  ClassTemplate_Element
} from '../Elements/Element'
import {
  Type_ElementPosition,
  default_element_color,
  getBooleanFromJSON,
  getNumberFromJSON,
  getStringFromJSON,
  Type_JSON,
  getStringListFromJSON,
  getJSONFromJSON,
  const_default_position_x,
} from '../types/Utils'
import {
  Type_GenericNodeElement
} from '../types/Types'
import {
  ClassTemplate_Handler
} from './Handler'
import { Class_DataTag } from '../types/Tag'


// CLASS LEGEND *************************************************************************

/**
 * Class that define how we draw legend for a Sankey
 *
 * @export
 * @class ClassTemplate_Legend
 * @extends {ClassTemplate_Element}
 */
export class ClassTemplate_Legend
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
    Type_GenericSankey extends ClassAbstract_Sankey
  >
  extends ClassTemplate_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {

  // PRIVATE ATTRIBUTES =================================================================

  private _pos_from_legacy = false

  // Legend Class attributes
  private _masked: boolean = true
  private _display_legend_scale: boolean = false
  private _legend_police: number = 16
  private _legend_bg_border: boolean = false
  private _legend_bg_color: string = default_element_color
  private _legend_bg_opacity: number = 0
  private _legend_show_dataTags: boolean = false
  private _node_label_separator: string = ''
  private _width: number = 180
  private _info_link_value_void: boolean = false

  private _drag_handler: {
    left: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
    right: ClassTemplate_Handler<Type_GenericDrawingArea, Type_GenericSankey>,
  }

  /**
   * Attribute for legend content positionning.
   * Souldn't have getter & setter public because the variable is only use & computed when we draw the legend
   * @private
   * @type {number}
   * @memberof ClassTemplate_Legend
   */
  private _dx: number = 0

  /**
   * Attribute for legend content positionning.
   * Souldn't have getter & setter public because the variable is only use & computed when we draw the legend
   * @private
   * @type {number}
   * @memberof ClassTemplate_Legend
   */
  private _dy: number = 0

  /**
   * Attribute used for the scale of the legend
   * so the legend can still be visible when we de-zoom DA.
   * The attr is automaticaly updated when we zoom/de-zooom on the DA (see setter)
   *
   * @private
   * @type {number}
   * @memberof ClassTemplate_Legend
   */
  private _scale: number = 1

  /**
   * Text wrapper function
   * @private
   * @memberof ClassTemplate_Legend
   */
  private _wrapper = textwrap()
    .bounds({ height: 100, width: this._width })
    .method('tspans')

  // PROTECTED ATTRIBUTES ===============================================================

  /**
   * Display attributes for legend
   * @protected
   * @type {{
   *     drawing_area: Type_GenericDrawingArea,
   *     position: Type_ElementPosition,
   *   }}
   * @memberof ClassTemplate_Legend
   */
  protected _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
    position: Type_ElementPosition,
  }

  // CONSTRUCTOR ========================================================================

  constructor(
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfig,
  ) {
    // Init parent class attributes

    //TODO : rename grp_legend to g_legend when legacy code will be deleted as for now some legacy functions might be tirgered when interactiong with DA and look for g_legend
    super('legend', menu_config, 'grp_legend')
    // Init other class attributes
    this._display = {
      drawing_area: drawing_area,
      sankey: drawing_area.sankey as Type_GenericSankey,
      position: {
        x: const_default_position_x,
        y: drawing_area.getNavBarHeight() + 50,
        u: 0,
        v: 0
      }
    }

    this._drag_handler = {
      left: new ClassTemplate_Handler(
        'legend_left_handle_' + this.id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragLeftHandler(),
        this.dragHandleEnd(),
        { class: 'legend_left_handle' },
        undefined,
        'grp_legend',
      ),
      right: new ClassTemplate_Handler(
        'legend_right_handle_' + this.id,
        drawing_area,
        menu_config,
        this,
        this.dragHandleStart(),
        this.dragRightHandler(),
        this.dragHandleEnd(),
        { class: 'legend_right_handle' },
        undefined,
        'grp_legend',
      ),

    }
  }

  // COPY METHODS =======================================================================

  protected _copyFrom(_: ClassTemplate_Legend<Type_GenericDrawingArea, Type_GenericSankey>): void {
    super._copyFrom(_)
    this._masked = _._masked
    this._dx = _._dx
    this._dy = _._dy
    this._scale = _._scale
    this._width = _._width
    this._display_legend_scale = _._display_legend_scale
    this._legend_police = _._legend_police
    this._legend_bg_border = _._legend_bg_border
    this._legend_bg_color = _._legend_bg_color
    this._legend_bg_opacity = _._legend_bg_opacity
    this._legend_show_dataTags = _._legend_show_dataTags
    this._node_label_separator = _._node_label_separator
    this._info_link_value_void = _._info_link_value_void
    this._pos_from_legacy = _._pos_from_legacy
  }

  // SAVING METHODS =====================================================================

  protected _toJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    // we need to create an entry legend to do this
    super._toJSON(json_object, kwargs)
    json_object['legend'] = {}
    const json_legend = json_object['legend']
    json_legend['legend_position'] = [String(this.position_x), String(this.position_y)]
    json_legend['mask_legend'] = this._masked
    json_legend['legend_dx'] = this._dx
    json_legend['legend_dy'] = this._dy
    json_legend['legend_scale'] = this._scale
    json_legend['legend_width'] = this._width
    json_legend['display_legend_scale'] = this._display_legend_scale
    json_legend['legend_police'] = this._legend_police
    json_legend['legend_bg_border'] = this._legend_bg_border
    json_legend['legend_bg_color'] = this._legend_bg_color
    json_legend['legend_bg_opacity'] = this._legend_bg_opacity
    json_legend['legend_show_dataTags'] = this._legend_show_dataTags
    json_legend['node_label_separator'] = this._node_label_separator
    json_legend['info_link_value_void'] = this._info_link_value_void
  }

  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ): void {
    super._fromJSON(json_object, kwargs)
    const json_legend = getJSONFromJSON(json_object, 'legend', {})

    const legend_position = getStringListFromJSON(json_legend, 'legend_position', ['0', String(this.drawing_area.getNavBarHeight())])
    this._display.position.x = +legend_position[0]
    const tmp_y = +legend_position[1]
    this._display.position.y = (tmp_y < this.drawing_area.getNavBarHeight()) ? this.drawing_area.getNavBarHeight() : tmp_y //fix legend position by putting it position just under the navbar
    this._masked = getBooleanFromJSON(json_legend, 'mask_legend', this._masked)
    this._dx = getNumberFromJSON(json_legend, 'legend_dx', this._dx)
    this._dy = getNumberFromJSON(json_legend, 'legend_dy', this._dy)
    this._scale = getNumberFromJSON(json_legend, 'legend_scale', this._scale)
    this._width = getNumberFromJSON(json_legend, 'legend_width', this._width)
    this._display_legend_scale = getBooleanFromJSON(json_legend, 'display_legend_scale', this._display_legend_scale)
    this._legend_police = getNumberFromJSON(json_legend, 'legend_police', this._legend_police)
    this._legend_bg_border = getBooleanFromJSON(json_legend, 'legend_bg_border', this._legend_bg_border)
    this._legend_bg_color = getStringFromJSON(json_legend, 'legend_bg_color', this._legend_bg_color)
    this._legend_bg_opacity = getNumberFromJSON(json_legend, 'legend_bg_opacity', this._legend_bg_opacity)
    this._legend_show_dataTags = getBooleanFromJSON(json_legend, 'legend_show_dataTags', this._legend_show_dataTags)
    this._node_label_separator = getStringFromJSON(json_legend, 'node_label_separator', this._node_label_separator)
    this._info_link_value_void = getBooleanFromJSON(json_legend, 'info_link_value_void', this._info_link_value_void)

    // Var only present if json is legacy
    this._pos_from_legacy = getBooleanFromJSON(json_legend, 'legacy_legend', this._pos_from_legacy)

  }

  // PUBLIC METHODS =====================================================================

  /**
   * Function called in _afterFromJSON in ApplicationData,
   * the function correctly place legend as if it was in legacy despite being not anymore relative to DA
   *
   * @memberof ClassTemplate_Legend
   */
  public posIfFromLegacy() {
    if (this._pos_from_legacy) {
      let x = 0, y = 0, k = 1
      const tmp = this.drawing_area.d3_selection_zoom_area?.node()
      if (tmp && tmp !== null) {
        x = d3.zoomTransform(tmp).x
        y = d3.zoomTransform(tmp).y
        k = d3.zoomTransform(tmp).k
      }
      //Set pos of legend like it was in legacy (so we have to take into account old pos of legend & scale of DA)
      this.setPosXY((this.display.position.x * k) + x, (this.display.position.y * k) + y)
      this._pos_from_legacy = false
    }

  }

  /**
   * _drawLegendBg with timeout
   *
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawLegendBg() {
    this._process_or_bypass(() => this._drawLegendBg())
  }

  /**
   * _drawTagDisplayed with timeout
   *
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawTagDisplayed() {
    this._process_or_bypass(() => this._drawTagDisplayed())
  }

  /**
   * _drawInfoDataType with timeout
   *
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawInfoDataType() {
    this._process_or_bypass(() => this._drawInfoDataType())
  }

  /**
   * _drawInfoDashedLink with timeout
   *
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawInfoDashedLink() {
    this._process_or_bypass(() => this._drawInfoDashedLink())
  }

  /**
   * _drawSankeyScale with timeout
   *
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawSankeyScale() {
    this._process_or_bypass(() => this._drawSankeyScale())
  }

  /**
     * Function triggered when element is (un)selected
     *
     * @memberof Class_ContainerElement
     */
  public drawAsSelected() {
    this.draw()
    this.drawDragHandlers()
  }


  // PROTECTED METHODS ==================================================================

  protected eventMouseOver(_event: MouseEvent<HTMLButtonElement, MouseEvent<Element, globalThis.MouseEvent>>): void {
    this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', '6,6')
    this.d3_selection?.select('.zone_for_dragging').attr('stroke', this._legend_bg_color)
  }

  protected eventMouseOut(_event: MouseEvent<HTMLButtonElement, MouseEvent<Element, globalThis.MouseEvent>>): void {
    this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', this.is_selected ? '6,6' : 'unherit')
    this.d3_selection?.select('.zone_for_dragging').attr('stroke', (this._legend_bg_border || this.is_selected) ? this._legend_bg_color : 'none')
  }

  protected eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
  }

  protected eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ): void {
    this._display.position.x += (event.sourceEvent.movementX)
    if (this._display.position.x < 0) this._display.position.x = 0
    this._display.position.y += (event.sourceEvent.movementY)
    if (this._display.position.y < 0) this._display.position.y = 0

    this.setPosXY(this._display.position.x, this._display.position.y)
    this.drawDragHandlers()
  }

  protected eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.draw()
    this.drawDragHandlers()
  }

  protected override _initDraw() {
    const d3_svg = this.drawing_area.d3_selection_zoom_area
    if (d3_svg !== null) {
      const d3_drawing_area_selection = d3_svg.selectAll(' #' + this._svg_parent_group)
      if (d3_drawing_area_selection.nodes().length > 0) {
        this.d3_selection = d3_drawing_area_selection.append('g')
        this.d3_selection.attr('id', this.svg_group)
          .attr('transform', 'translate(' + 0 + ',' + this.drawing_area.getNavBarHeight() + ')') // init drawing area zone with a margin for taking into account the navbar
      }
    }
  }

  protected _draw() {
    // Heritance of draw function
    super._draw()
    // Update class attributes
    this.d3_selection?.attr('class', 'gg_legend')
    // Draw Background
    this._drawLegendBg()
    // Reset content positionning
    this._dx = 0
    this._dy = 0
    // Rebounds text wrapper with width of legend when drawed at this moment
    this._wrapper.bounds({ height: 100, width: this._width })
    // Draw tag color pallette applied to sankey
    this._drawTagDisplayed()
    // Draw explication for data type
    const sankey_has_interval_value = d3.selectAll('.link_value').nodes().filter(lv => d3.select(lv).html().includes('*')).length > 0
    if (sankey_has_interval_value) {
      this._drawInfoDataType()
    }
    // Draw explication for dashed links
    const sankey_has_dashed_links = this.drawing_area.sankey.links_list.filter(l => l.value!.data_value == null).length > 0
    if (sankey_has_dashed_links && this._info_link_value_void) {
      this._drawInfoDashedLink()
    }
    if (this._display_legend_scale) {
      this._drawSankeyScale()
    }
    this._updateLegendHeight()
  }

  /**
 * Override applyPosition for legend so it take into accound scale transformation
 * @protected
 * @return {*}
 * @memberof Class_Node
 */
  protected override _applyPosition() {
    if (this.d3_selection !== null) {
      this.d3_selection.attr(
        'transform',
        'translate(' + this.position_x + ', ' + this.position_y + ')')
    }
  }

  protected override eventMaintainedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventMaintainedClick(event)
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
      // if we're here then it's a simple click (no ctrl,alt or shift key pressed) - purge
      // Add node to selection
      drawing_area.addLegendToSelection()

      // If shift key is pressed then open config menu to type config context & sub menu graph
      if (event.shiftKey) {
        this.drawing_area.application_data.menu_configuration.openConfigMenu()
        this.drawing_area.application_data.menu_configuration.type_menu_configuration_selected = 'context'
        this.drawing_area.application_data.menu_configuration.elements_configurable_selected.context = ['DA']
        this.drawing_area.application_data.menu_configuration.ref_to_menu_config_updater.current()
      }
    }
  }

  // PRIVATE METHODS ====================================================================

  /**
   * Activate the control points alignement guide
   *
   * @private
   * @return {*}
   * @memberof Class_ContainerElement
   */
  private dragHandleStart() {
    return () => {
    }
  }

  /**
    * Deactivate the control points alignement guide
    * @private
    * @return {*}
    * @memberof Class_ContainerElement
    */
  private dragHandleEnd() {
    return () => {
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
      this._width -= event.dx
      this.setPosXY(this.position_x + event.dx, this.position_y)
      this.draw()

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
      this._width += event.dx
      this.draw()

      // Reposition drag handler with updated with & pos of the free label
      this.drawDragHandlers()
    }
  }

  /**
 * Draw all control points
 *
 * @private
 * @memberof Class_ContainerElement
 */
  public drawDragHandlers() {
    // Compute positions
    this.computeLeftHandlerPos()
    this.computeRightHandlerPos()
    // Draw
    this._drag_handler.left.draw()
    this._drag_handler.right.draw()
  }

  private computeLeftHandlerPos() {
    // left handle pos
    this._drag_handler.left.position_x = this.position_x + 0
    this._drag_handler.left.position_y = this.position_y + this._dy / 2
  }

  private computeRightHandlerPos() {
    // right handle pos
    this._drag_handler.right.position_x = this.position_x + this._width
    this._drag_handler.right.position_y = this.position_y + this._dy / 2
  }

  /**
   * Function that draw the background of the legend, it is also used as draggable
   * element to move the legend
   * @private
   * @memberof ClassTemplate_Legend
   */
  private _drawLegendBg() {
    this.d3_selection?.select('.g_drag_zone_leg').remove()
    this.d3_selection?.append('g')
      .attr('class', 'g_drag_zone_leg')
      .append('rect')
      .attr('class', 'zone_for_dragging')
      .attr('width', this._width)
      .attr('height', '0px')
      .attr('rx', '2px')
      .attr('ry', '2px')
      .attr('stroke-dasharray', () => '')
      .attr('stroke', (this._legend_bg_border || this.is_selected) ? this._legend_bg_color : 'none')
      .attr('stroke-width', (this._legend_bg_border || this.is_selected) ? 1 : 0)
      .attr('stroke-dasharray', (this.is_selected) ? '6,6' : 'unherit')
      .attr('fill', this._legend_bg_color)
      .attr('fill-opacity', this._legend_bg_opacity / 100)
  }

  /**
   * Function to draw tags in legend that are used in the sankey
   * (when they're activated in the toolbar)
   * @private
   * @memberof ClassTemplate_Legend
   */
  private _drawTagDisplayed() {
    const node_taggs = this.drawing_area.sankey.node_taggs_list
    const flux_taggs = this.drawing_area.sankey.flux_taggs_list
    const data_taggs = this.drawing_area.sankey.data_taggs_list
    const flux_list = this.drawing_area.sankey.visible_links_list
    const node_list = this.drawing_area.sankey.visible_nodes_list

    // Get all grp tag insind one variable
    const all_tags = [...node_taggs, ...flux_taggs, ...data_taggs]
    all_tags
      .filter(tag_group => tag_group.show_legend)
      .forEach(tag_group => {
        // Tag froup id can have caracter that 'break' html id selection so we normalize it
        const id_to_use = tag_group.id.replaceAll(' ', '_').replaceAll('\'', '_')

        // Ajout du tagGroup.name
        this.d3_selection?.append('text')
          .attr('id', 'GrpTag_title_' + id_to_use)
          .attr('transform', 'translate(' + this._dx + ',' + this._dy + ' )')
          .attr('x', 0)
          .attr('y', this._legend_police)
          .text(tag_group.name)
          .attr('style', 'font-weight:bold;font-size:' + this._legend_police + 'px')
          .call(this._wrapper)

        if (document.getElementById('GrpTag_title_' + id_to_use)?.getElementsByTagName('tspan')[0].innerHTML === '') {
          document.getElementById('GrpTag_title_' + id_to_use)?.setAttribute('y', '5')
        }

        this._dy += ((this.d3_selection?.select('#GrpTag_title_' + id_to_use).selectAll('tspan').nodes().length ?? 0) * this.legend_police) + 4

        const legendElements2 = this.d3_selection?.append('g').attr('transform', 'translate(0,' + this._legend_police + ')')

        tag_group.selected_tags_list.filter(tag => {
          // Filter tag that doens't have element visible on the drawing_area (or display them if it's a data_tag since if it's selected it is visible)
          return node_list.filter(n => n.hasGivenTag(tag)).length !== 0 || flux_list.filter(f => f.hasGivenTag(tag)).length !== 0 || tag instanceof Class_DataTag
        })
          .forEach((tag) => {
            const tagElement = legendElements2?.append('g')
              .attr('id', 'tag_' + tag.name.replaceAll(' ', '__')
              )
              .attr('transform', () => 'translate(' + this._dx + ',' + (this._dy) + ')')
              .on('mouseover', () => {
                //Add event on hovering tag in legend that allow to highlight elemnt of the sankey that have the tag we are hovering

                const nodes_tied_to_link_with_tag_hovered = ([] as Type_GenericNodeElement[])
                //Get nodes tied to links who have the tag we hovering & get the list of links that have the tag hovered
                flux_list
                  .filter(l => {
                    if (l.hasGivenTag(tag)) {
                      nodes_tied_to_link_with_tag_hovered.push(l.source as Type_GenericNodeElement)
                      nodes_tied_to_link_with_tag_hovered.push(l.target as Type_GenericNodeElement)
                      return true
                    } else if (l.source.hasGivenTag(tag) && l.target.hasGivenTag(tag)) {
                      nodes_tied_to_link_with_tag_hovered.push(l.source as Type_GenericNodeElement)
                      nodes_tied_to_link_with_tag_hovered.push(l.target as Type_GenericNodeElement)
                      return true
                    }
                    l.d3_selection?.attr('opacity', 0.1)
                    return false
                  })

                //Reduce opacity of all node that doesn't have the tag hovered or aren't tied to a link that have the tag hovered
                node_list
                  .forEach(n => {
                    if (!nodes_tied_to_link_with_tag_hovered.includes(n as Type_GenericNodeElement)) {
                      n.d3_selection?.attr('opacity', 0.1)
                    }
                  })

              })
              .on('mouseout', () => {
                // Reset opacity of visible element
                node_list.forEach(node => node.d3_selection?.attr('opacity', ''))
                flux_list.forEach(flux => flux.d3_selection?.attr('opacity', ''))

              })

            // Ajout du shape
            tagElement?.append('rect')
              .attr('width', this._legend_police)
              .attr('height', this._legend_police)
              .attr('x', 0)
              .attr('y', -0.75 * this._legend_police)
              .attr('rx', 3)
              .attr('ry', 3)
              .style('fill', () => tag.color)
              .style('fill-opacity', 1)

            // Ajout du label
            tagElement?.append('text')
              .attr('class', 'name_tag')
              .attr('x', 35)
              .attr('y', 0)
              .attr('font-size', this._legend_police + 'px')
              .text(tag.name)
              .call(this._wrapper)

            this._dy += ((tagElement?.select('.name_tag').selectAll('tspan').nodes().length ?? 0) * this.legend_police) + 2
          })
      })
    // Show wich data_tag are selected by group
    if (this._legend_show_dataTags) {
      this._dy += this._legend_police
      Object.entries(data_taggs).forEach(tag_group => {
        // Ajout du tagGroup.name
        this.d3_selection?.append('text')
          .attr('id', 'leg_dataTag_' + tag_group[0])
          .attr('transform', 'translate(0,' + this._dy + ' )')
          .attr('x', 0)
          .attr('y', 0)
          .text((tag_group[1].name + ' : ' + tag_group[1].selected_tags_list.map(t => t.name).join(', ')))
          .attr('style', ('font-size:' + this._legend_police + 'px;'))
          .call(this._wrapper)
        this._dy += ((this.d3_selection?.select('#leg_dataTag_' + tag_group[0]).selectAll('tspan').nodes().length ?? 0) * this.legend_police) + 2
      })
    }
  }

  /**
   * Add text to describe why there is * in some link value
   * @private
   * @memberof ClassTemplate_Legend
   */
  private _drawInfoDataType() {
    // Write information in the legend depending to the diagram representation:
    // - when diagramme type is : data reconciled + indetermined links (values), we explain the meaning of "*" in the link label
    // - when diagramme type is : data collected or data reconciled, we explain the meaning of dashed links
    this._dy += this._legend_police
    const free_value = this.d3_selection?.append('g')
      .attr('id', 'gg_legend_free_value')
      .attr('transform', 'translate(0,' + (this._dy) + ')')
      .attr('font-size', this._legend_police + 'px')

    free_value?.append('text')
      .text('*')
      .attr('x', '5')


    free_value?.append('text')
      .attr('x', '35')
      .text('MEP.show_legend_free_value')
      .call(this._wrapper)
  }

  /**
   * Add text to describe why some link are dashed
   * (because their value are undefined, only appear when data_type
   * is set to anything but structur)
   * @private
   * @memberof ClassTemplate_Legend
   */
  private _drawInfoDashedLink() {
    this._dy += this._legend_police

    // Create info zone
    const dashed_link = this.d3_selection?.append('g')
      .attr('id', 'gg_legend_dashed_links')
      .attr('transform', 'translate(0,' + this._dy + ')')
      .attr('font-size', this._legend_police + 'px')
    // Create path as exemple
    dashed_link?.append('path')
      .attr('d', 'M 0 0 L 25 0  Z')
      .attr('fill', 'none')
      .attr('stroke-width', '5')
      .attr('stroke', default_element_color)
      .attr('stroke-opacity', 0.85)
      .attr('stroke-dasharray', '3,3')
    // Set explanation text for path as dashed
    dashed_link?.append('text')
      .text(this.drawing_area.application_data.t('MEP.legend_dashed_links'))
      .call(this._wrapper)
    // Correct text position // font size
    dashed_link?.select('text')
      .attr('x', '35')
      .attr('y', this._legend_police / 2)
  }

  /**
   * Add info zone in legend for "Sankey scale"
   * @private
   * @memberof ClassTemplate_Legend
   */
  private _drawSankeyScale() {
    // Update vertical offset
    this._dy += this._legend_police + 15 //(50 is the height of the draggable scale)
    // Remove previous info zone for scale
    d3.selectAll(' .opensankey #svg .g_scale').remove()
    // Create info zone for scale
    const g_scale = this.d3_selection?.append('g')
      .attr('class', 'g_scale')
      .attr('transform', 'translate(0,' + (this._dy) + ')')

    // Add explanation text
    g_scale?.append('text')
      .text(this.drawing_area.application_data.t('scale') + ':')
      .style('font-size', this._legend_police + 'px')

    const g_draggable = g_scale?.append('g')
      .attr('class', 'g_draggable_scale')
      .style('cursor', 'grab')
      .attr('transform', 'translate(' + (7 * (this._legend_police * 0.75)) + ', -30)')
    g_draggable?.append('rect')
      .attr('width', '3px')
      .attr('height', '50px')
      .attr('fill', 'black')
    g_draggable?.append('text')
      .attr('class', 'measurment_scale')
      .attr('transform', 'translate(5,25)')
      .text(Math.round((this.drawing_area.scale / 2)))


    // Add drag event for the scale representation
    g_draggable?.call(d3.drag<SVGGElement, unknown, unknown>()
      .subject(Object)
      .on('drag', function (event) {
        g_draggable.attr('transform', 'translate(' + (event.x) + ',' + (event.y) + ')')
      }))

    this._dy += 20
  }

  private _updateLegendHeight() {
    d3.select('.zone_for_dragging').attr('height', this._dy + 5)
  }

  /**
   * _updateLegendHeight with timeout
   *
   * @private
   * @memberof ClassTemplate_Legend
   */
  private updateLegendHeight() {
    this._process_or_bypass(() => this.updateLegendHeight())
  }

  // GETTERS / SETTERS ==================================================================

  public get is_visible(): boolean {
    return (
      super.is_visible &&
      (!this._masked)
    )
  }

  public get masked(): boolean { return this._masked }
  public set masked(value: boolean) { this._masked = value; this.draw(); this.drawing_area.checkAndUpdateAreaSize() }

  public get display_legend_scale(): boolean { return this._display_legend_scale }
  public set display_legend_scale(value: boolean) { this._display_legend_scale = value; this.draw() }

  public get legend_police(): number { return this._legend_police }
  public set legend_police(value: number) { this._legend_police = value; this.draw() }

  public get legend_bg_border(): boolean { return this._legend_bg_border }
  public set legend_bg_border(value: boolean) { this._legend_bg_border = value; this.draw() }

  public get legend_bg_color(): string { return this._legend_bg_color }
  public set legend_bg_color(value: string) { this._legend_bg_color = value; this.draw() }

  public get legend_bg_opacity(): number { return this._legend_bg_opacity }
  public set legend_bg_opacity(value: number) { this._legend_bg_opacity = value; this.draw() }

  public get legend_show_dataTags(): boolean { return this._legend_show_dataTags }
  public set legend_show_dataTags(value: boolean) { this._legend_show_dataTags = value; this.draw() }

  public get node_label_separator(): string { return this._node_label_separator }
  public set node_label_separator(value: string) { this._node_label_separator = value; this.draw() }

  public get width(): number { return this._width }
  public set width(value: number) { this._width = value; this.draw() }

  public get info_link_value_void(): boolean { return this._info_link_value_void }
  public set info_link_value_void(value: boolean) { this._info_link_value_void = value; this.draw() }


}
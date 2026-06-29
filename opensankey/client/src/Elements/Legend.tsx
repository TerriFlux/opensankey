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
import { textwrap } from 'd3-textwrap'
import { MouseEvent } from 'react'

import {
  default_display_legend_scale, default_element_color, default_info_link_value_void, default_legend_bg_border,
  default_legend_bg_color, default_legend_bg_opacity, default_legend_horizontal, default_legend_police,
  default_legend_show_constraints, default_legend_show_dataTags, default_masked, default_scale_legend_ratio,
  default_scale_legend_unit, default_stick_to_drawing, default_width
} from './ElementsAttributesConfig'

import { Class_DataTag, Class_Tag } from '../types/Tag'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_Sankey } from '../types/Sankey'
import { Class_NodeElement } from './Node'
import { Class_NodeBase } from './NodeBase'
export class ClassTemplate_Legend extends Class_NodeBase {
  private _stick_to_drawing = default_stick_to_drawing
  private _masked: boolean = default_masked
  private _display_legend_scale: boolean = default_display_legend_scale
  private _scale_legend_unit: string = default_scale_legend_unit
  private _scale_legend_ratio: number = default_scale_legend_ratio
  private _legend_police: number = default_legend_police
  private _legend_bg_border: boolean = default_legend_bg_border
  private _legend_bg_color: string = default_legend_bg_color
  private _legend_bg_opacity: number = default_legend_bg_opacity
  private _legend_show_dataTags: boolean = default_legend_show_dataTags
  private _legend_show_constraints: boolean = default_legend_show_constraints
  private _legend_horizontal: boolean = default_legend_horizontal
  private _width: number = default_width
  private _info_link_value_void: boolean = default_info_link_value_void
  private _legend_show_data_type: boolean = false

  private _dx: number = 0
  private _dy: number = 0
  private _scale: number = 1

  private _wrapper = textwrap()
    .bounds({ height: 100, width: this._width })
    .method('tspans')

  constructor(
    drawing_area: Class_DrawingArea,
    sankey: Class_Sankey
  ) {
    super('legend', '', drawing_area, sankey.default_style, 'grp_legend')
  }

  public copyFrom(_: Class_NodeBase): void {
    super.copyFrom(_)
    const cast_copy = _ as unknown as ClassTemplate_Legend
    this._masked = cast_copy._masked
    this._dx = cast_copy._dx
    this._dy = cast_copy._dy
    this._scale = cast_copy._scale
    this._width = cast_copy._width
    this._display_legend_scale = cast_copy._display_legend_scale
    this._scale_legend_unit = cast_copy._scale_legend_unit
    this._scale_legend_ratio = cast_copy._scale_legend_ratio
    this._legend_police = cast_copy._legend_police
    this._legend_bg_border = cast_copy._legend_bg_border
    this._legend_bg_color = cast_copy._legend_bg_color
    this._legend_bg_opacity = cast_copy._legend_bg_opacity
    this._legend_show_dataTags = cast_copy._legend_show_dataTags
    this._legend_show_constraints = cast_copy._legend_show_constraints
    this._legend_horizontal = cast_copy._legend_horizontal
    this._info_link_value_void = cast_copy._info_link_value_void
    this._legend_show_data_type = cast_copy._legend_show_data_type
    this._stick_to_drawing = cast_copy._stick_to_drawing
  }

  public drawAsSelected() {
    this.draw()
    this.drawDragHandlers()
  }

  public eventMouseOver(_event: MouseEvent<HTMLButtonElement, MouseEvent<Element, globalThis.MouseEvent>>): void {
    this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', '6,6')
    this.d3_selection?.select('.zone_for_dragging').attr('stroke', this._legend_bg_color)
  }

  public eventMouseOut(_event: MouseEvent<HTMLButtonElement, MouseEvent<Element, globalThis.MouseEvent>>): void {
    this.d3_selection?.select('.zone_for_dragging').attr('stroke-dasharray', this.is_selected ? '6,6' : 'unherit')
    this.d3_selection?.select('.zone_for_dragging').attr('stroke', (this._legend_bg_border || this.is_selected) ? this._legend_bg_color : 'none')
  }

  public eventMouseDragStart(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
  }

  public eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ): void {
    this._position.x += (event.dx)
    if (!this.stick_to_drawing) {
      if (this._position.x < 0) this._position.x = 0
    }
    this._position.y += (event.dy)
    if (!this.stick_to_drawing) {
      if (this._position.y < 0) this._position.y = 0
    }

    this.setPosXY(this._position.x, this._position.y)
    this.drawDragHandlers()
  }

  public eventMouseDragEnd(
    _event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ) {
    this.draw()
    this.drawDragHandlers()
    this.drawing_area.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  protected override _initDraw() {
    if (!this.stick_to_drawing) {
      const d3_svg = this.drawing_area.d3_selection_zoom_area
      if (d3_svg !== null) {
        const d3_drawing_area_selection = d3_svg.selectAll(' #' + this._svg_parent_group)
        // Supprimer l'élément existant s'il existe
        d3_drawing_area_selection.selectAll('#' + this.svg_group).remove()
        this.d3_selection = d3_drawing_area_selection.append('g')
        this.d3_selection.attr('id', this.svg_group)
        //.attr('transform', 'translate(' + 0 + ',' + this.drawing_area.getNavBarHeight() + ')')  // init drawing area zone with a margin for taking into account the navbar
      }

    } else {
      const d3_svg = this.drawing_area.d3_selection
      if (d3_svg !== null) {
        const d3_drawing_area_selection = d3_svg.selectAll(' #' + this._svg_parent_group)
        // Supprimer l'élément existant s'il existe
        d3_drawing_area_selection.selectAll('#' + this.svg_group).remove()
        this.d3_selection = d3_drawing_area_selection.append('g')
        this.d3_selection.attr('id', this.svg_group)
          .attr('transform', 'translate(' + 0 + ',' + this.drawing_area.getNavBarHeight() + ')')
      }
    }

  }

  public draw() {
    this._process_or_bypass(() => {
      // Heritance of draw function
      super.draw()
      // UpdZte class attributes
      this.d3_selection?.attr('class', 'gg_legend')
      // Draw Background
      this.drawLegendBg()
      // Reset content positionning
      this._dx = 0
      this._dy = 0
      // Rebounds text wrapper with width of legend when drawed at this moment
      this._wrapper.bounds({ height: 100, width: this._width })
      // Draw data type label
      this.drawDataTypeLabel()
      // Draw tag color pallette applied to sankey
      this.drawTagDisplayed()
      // Draw explication for data type
      const sankey_has_interval_value = d3.selectAll('.link_value').nodes().filter(lv => d3.select(lv).html().includes('*')).length > 0
      if (sankey_has_interval_value) {
        this.drawInfoDataType()
      }
      // Draw explication for dashed links
      const sankey_has_dashed_links = this.drawing_area.sankey.links_list.filter(l => l.valueCurrent == null).length > 0
      if (sankey_has_dashed_links && this._info_link_value_void) {
        this.drawInfoDashedLink()
      }
      if (this._display_legend_scale) {
        this.drawSankeyScale()
      }
      if (this._legend_show_constraints) {
        this.drawInfoConstraintLink()
      }
      // IMPORTANT: Créer la zone de drag APRÈS avoir dessiné tout le contenu
      requestAnimationFrame(() => {
        this.updateDragZone()
      })
    })
  }

  public applyPosition() {
    if (this.d3_selection !== null) {
      const position_y = this.position_y //+ this.drawing_area.getNavBarHeight()
      let transform = 'translate(' + this.position_x + ', ' + position_y + ')'
      // Issue #165 — Quand la legend est stick_to_drawing, elle vit dans le
      // groupe SVG zoomé par d3 (facteur k). À grand _scale (k ≈ 1e-4) ou en
      // zoom, le contenu varierait/serait invisible. En mode verrouillé, on
      // contre-scale par font_compensation (= 1/k live) pour que les dimensions
      // internes (police, espacements, rects) rendent à taille constante à
      // l'écran. La position (position_x/y) reste en coords locales, donc la
      // legend reste « attachée » à son ancrage dans le dessin. En mode
      // déverrouillé (ou hors stick_to_drawing) : pas de compensation.
      if (this.stick_to_drawing && this.drawing_area.font_size_locked) {
        const comp = this.drawing_area.font_compensation
        if (comp > 0 && comp !== 1) {
          transform += ' scale(' + comp + ')'
        }
      }
      this.d3_selection.attr('transform', transform)
    }
    this.drawDragHandlers()
  }



  protected override eventMaintainedClick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    if (!this.drawing_area.editable) return
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
        this.drawing_area.application_data.menu_configuration.type_menu_configuration_selected = 'style'
        this.drawing_area.application_data.menu_configuration.elements_configurable_selected.context = ['legend']
        this.drawing_area.application_data.menu_configuration.ref_to_menu_config_updater.current()
      }
    }
  }

  public drawLegendBg() {
    this.d3_selection?.select('.g_drag_zone_leg').remove()
    const legendBbox = this.drawing_area.d3_selection_legend?.node()?.getBBox()
    this.d3_selection?.append('g')
      .attr('class', 'g_drag_zone_leg')
      .append('rect')
      .attr('class', 'zone_for_dragging')
      .attr('width', legendBbox ? legendBbox.width! : null)
      .attr('height', legendBbox ? legendBbox.height! : null)
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
  public drawTagDisplayed() {
    const node_taggs = this.drawing_area.sankey.node_taggs_list
    const flux_taggs = this.drawing_area.sankey.flux_taggs_list
    const data_taggs = this.drawing_area.sankey.data_taggs_list
    const flux_list = this.drawing_area.sankey.visible_links_list
    const node_list = this.drawing_area.sankey.visible_nodes_list

    // Get all grp tag insind one variable
    const all_tags = [...node_taggs, ...flux_taggs, ...data_taggs]
    all_tags
      .filter(tag_group => tag_group.use_colors)
      .forEach(tag_group => {
        // Tag froup id can have caracter that 'break' html id selection so we normalize it
        const id_to_use = tag_group.id.replaceAll(' ', '_').replaceAll('\'', '_')

        const selected_tags_list = tag_group.selected_tags_list.filter(tag => {
          // Filter tag that doens't have element visible on the drawing_area (or display them if it's a data_tag since if it's selected it is visible)
          return node_list.filter(n => n.hasGivenTag(tag as Class_Tag)).length !== 0 || flux_list.filter(f => f.hasGivenTag(tag as Class_Tag)).length !== 0 || tag instanceof Class_DataTag
        })
        if (selected_tags_list.length > 0) {
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
        }
        const legendElements2 = this.d3_selection?.append('g').attr('transform', 'translate(0,' + this._legend_police + ')')

        tag_group.selected_tags_list.filter(tag => {
          // Filter tag that doens't have element visible on the drawing_area (or display them if it's a data_tag since if it's selected it is visible)
          return node_list.filter(n => n.hasGivenTag(tag as Class_Tag)).length !== 0 || flux_list.filter(f => f.hasGivenTag(tag as Class_Tag)).length !== 0 || tag instanceof Class_DataTag
        })
          .forEach((tag) => {
            const tagElement = legendElements2?.append('g')
              .attr('id', 'tag_' + tag.name.replaceAll(' ', '__')
              )
              .attr('transform', () => 'translate(' + this._dx + ',' + (this._dy) + ')')
              .on('mouseover', () => {
                //Add event on hovering tag in legend that allow to highlight elemnt of the sankey that have the tag we are hovering

                const nodes_tied_to_link_with_tag_hovered = ([] as Class_NodeElement[])
                //Get nodes tied to links who have the tag we hovering & get the list of links that have the tag hovered
                flux_list
                  .filter(l => {
                    if (l.hasGivenTag(tag as Class_Tag)) {
                      nodes_tied_to_link_with_tag_hovered.push(l.source as Class_NodeElement)
                      nodes_tied_to_link_with_tag_hovered.push(l.target as Class_NodeElement)
                      return true
                    } else if (l.source.hasGivenTag(tag as Class_Tag) || l.target.hasGivenTag(tag as Class_Tag)) {
                      nodes_tied_to_link_with_tag_hovered.push(l.source as Class_NodeElement)
                      nodes_tied_to_link_with_tag_hovered.push(l.target as Class_NodeElement)
                      return true
                    }
                    l.d3_selection?.attr('opacity', 0.1)
                    return false
                  })

                //Reduce opacity of all node that doesn't have the tag hovered or aren't tied to a link that have the tag hovered
                node_list
                  .forEach(n => {
                    if (!nodes_tied_to_link_with_tag_hovered.includes(n as Class_NodeElement)) {
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
            const tag_label = tagElement?.append('text')
              .attr('class', 'name_tag')
              .attr('x', this._legend_police + 5)
              .attr('y', 0)
              .attr('font-size', this._legend_police + 'px')
              .text(tag.display_name)
            // En mode horizontal on garde le label sur une seule ligne (pas de wrap)
            if (!this._legend_horizontal) {
              tag_label?.call(this._wrapper)
            }

            if (this._legend_horizontal) {
              // Avance horizontale : largeur du carré + espace + largeur du texte + marge
              const text_node = tag_label?.node() as SVGTextContentElement | null | undefined
              const text_width = text_node?.getComputedTextLength?.() ?? 0
              this._dx += this._legend_police + 5 + text_width + 14
            } else {
              this._dy += ((tagElement?.select('.name_tag').selectAll('tspan').nodes().length ?? 0) * this.legend_police) + 2
            }
          })
        // Fin du groupe : en mode horizontal, retour à la ligne pour le groupe suivant
        if (this._legend_horizontal && this._dx > 0) {
          this._dx = 0
          this._dy += this._legend_police + 4
        }
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
          .text((tag_group[1].name + ' : ' + tag_group[1].selected_tags_list.map(t => t.display_name).join(', ')))
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
  public drawDataTypeLabel() {
    if (!this._legend_show_data_type) return
    // Only show if there are computed results (otherwise there's nothing to distinguish)
    let has_results = false
    this.drawing_area.sankey.links_list.forEach(l => has_results = has_results || l.has_result)
    if (!has_results) return

    const { t } = this.drawing_area.application_data
    const da = this.drawing_area
    const label = da.data_source === 'data'
      ? t('MEP.leg_data_collected')
      : t('MEP.leg_data_calculated')

    this._dy += this._legend_police
    const g = this.d3_selection?.append('g')
      .attr('id', 'gg_legend_data_type')
      .attr('transform', 'translate(0,' + this._dy + ')')
      .attr('font-size', this._legend_police + 'px')
    g?.append('text')
      .attr('x', '5')
      .attr('font-weight', 'bold')
      .text(label)
      .call(this._wrapper)
    this._dy += this._legend_police
  }

  public drawInfoDataType() {
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
      .text('MEP.use_colors_free_value')
      .call(this._wrapper)
  }

  /**
   * Add text to describe why some link are dashed
   * (because their value are undefined, only appear when data_type
   * is set to anything but structur)
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawInfoDashedLink() {
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

  public drawInfoConstraintLink() {
    this._dy += this._legend_police

    const dashed_link = this.d3_selection?.append('g')
      .attr('id', 'gg_legend_constraint_links')
      .attr('transform', 'translate(0,' + this._dy + ')')
      .attr('font-size', this._legend_police + 'px')

    // Données du tableau
    const tableData = [
      { symbol: '→↕ x%', description: '% ∑ entrées source' },
      { symbol: '↕→ %x', description: '% ∑ sorties source' },
      { symbol: 'x% ↕→', description: '% ∑ entrées destination' },
      { symbol: 'x% →↕', description: '% ∑ sorties destination' },
      { symbol: '↑→ x%', description: '% flux parent (source)' },
      { symbol: 'x% ↑→', description: '% flux parent (destination)' }
    ]

    // Dimensions du tableau
    const rowHeight = 25
    const colWidth1 = 80  // largeur colonne symbole
    const colWidth2 = 200 // largeur colonne description
    const padding = 8

    // Fond du tableau
    dashed_link?.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', colWidth1 + colWidth2)
      .attr('height', (tableData.length + 1) * rowHeight)
      .attr('fill', '#f8f9fa')
      .attr('stroke', '#dee2e6')
      .attr('stroke-width', 1)

    // En-têtes
    dashed_link?.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', colWidth1 + colWidth2)
      .attr('height', rowHeight)
      .attr('fill', '#e9ecef')
      .attr('stroke', '#dee2e6')
      .attr('stroke-width', 1)

    // Séparateur vertical en-tête
    dashed_link?.append('line')
      .attr('x1', colWidth1)
      .attr('y1', 0)
      .attr('x2', colWidth1)
      .attr('y2', rowHeight)
      .attr('stroke', '#dee2e6')
      .attr('stroke-width', 1)

    // Texte en-têtes
    dashed_link?.append('text')
      .text('Symbole')
      .attr('x', colWidth1 / 2)
      .attr('y', rowHeight / 2 + this._legend_police / 3)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('fill', '#495057')

    dashed_link?.append('text')
      .text('Description')
      .attr('x', colWidth1 + colWidth2 / 2)
      .attr('y', rowHeight / 2 + this._legend_police / 3)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('fill', '#495057')

    // Lignes du tableau
    tableData.forEach((row, index) => {
      const yPos = (index + 1) * rowHeight

      // Ligne horizontale
      dashed_link?.append('line')
        .attr('x1', 0)
        .attr('y1', yPos + rowHeight)
        .attr('x2', colWidth1 + colWidth2)
        .attr('y2', yPos + rowHeight)
        .attr('stroke', '#dee2e6')
        .attr('stroke-width', 1)

      // Ligne verticale séparatrice
      dashed_link?.append('line')
        .attr('x1', colWidth1)
        .attr('y1', yPos)
        .attr('x2', colWidth1)
        .attr('y2', yPos + rowHeight)
        .attr('stroke', '#dee2e6')
        .attr('stroke-width', 1)

      // Texte symbole
      dashed_link?.append('text')
        .text(row.symbol)
        .attr('x', colWidth1 / 2)
        .attr('y', yPos + rowHeight / 2 + this._legend_police / 3)
        .attr('text-anchor', 'middle')
        .attr('fill', '#212529')
        .attr('font-family', 'monospace')

      // Texte description
      dashed_link?.append('text')
        .text(row.description)
        .attr('x', colWidth1 + padding)
        .attr('y', yPos + rowHeight / 2 + this._legend_police / 3)
        .attr('fill', '#495057')
    })
    this._dy += 160
    // // Correct text position // font size
    // dashed_link?.select('text')
    //   .attr('x', '35')
    //   .attr('y', this._legend_police / 2)
  }

  /**
   * Add info zone in legend for "Sankey scale"
   * @private
   * @memberof ClassTemplate_Legend
   */
  public drawSankeyScale() {
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

    let scale = this.drawing_area.scale / 2
    const unit_tagg = this.drawing_area.sankey.data_taggs_list.find(tagg => tagg.is_unit)
    let unit = ''
    if (unit_tagg) {
      const selected_unit = unit_tagg.selected_tags_list.find(t => t.is_selected)
      if (selected_unit) {
        scale = selected_unit.scale / 2
      }
      unit = selected_unit ? ' ' + selected_unit.name : ''
    }
    // Apply user-defined ratio and unit on the scale legend
    scale = scale / this._scale_legend_ratio
    if (this._scale_legend_unit !== '') {
      unit = ' ' + this._scale_legend_unit
    }

    const g_draggable = g_scale?.append('g')
      .attr('class', 'g_draggable_scale')
      .style('cursor', 'grab')
      .attr('transform', 'translate(' + (7 * (this._legend_police * 0.75)) + ', -30)')
    g_draggable?.append('rect')
      .attr('width', '3px')
      .attr('height', '50px')
      .attr('fill', 'black')
    // Auto format: integer when >= 1, significant digits when fractional
    const abs_scale = Math.abs(scale)
    let formatted_scale: string
    if (abs_scale >= 1) formatted_scale = String(Number(scale.toFixed(2)))
    else if (abs_scale > 0) formatted_scale = String(Number(scale.toPrecision(3)))
    else formatted_scale = '0'
    g_draggable?.append('text')
      .attr('class', 'measurment_scale')
      .attr('transform', 'translate(5,25)')
      .text(formatted_scale + ' ' + unit)

    // const that = this
    // // Add drag event for the scale representation
    // g_draggable?.call(d3.drag<SVGGElement, unknown, unknown>()
    //   .subject(Object)
    //   .on('drag', function (event) {
    //     //g_draggable.attr('transform', 'translate(' + (event.x) + ',' + (event.y) + ')')
    //     that.position_x += event.dx
    //     that.position_y += event.dy
    //   }))

    this._dy += 20
  }

  // private _updateLegendHeight() {
  //       let legendBbox = this.drawing_area.d3_selection_legend?.node()?.getBBox()
  //   this.d3_selection?.append('g')
  //     .attr('class', 'g_drag_zone_leg')
  //     .append('rect')
  //     .attr('class', 'zone_for_dragging')
  //     .attr('width', legendBbox?.width!)
  //   //d3.select('.zone_for_dragging').attr('height', this._dy + 5)
  // }

  // private _updateLegendSize() {
  //   d3.select('.zone_for_dragging').attr('width', 0)
  //   d3.select('.zone_for_dragging').attr('height', 0)
  //   let legendBbox = this.drawing_area.d3_selection_legend?.node()?.getBBox()
  //   d3.select('.zone_for_dragging').attr('width', legendBbox?.width!)
  //   d3.select('.zone_for_dragging').attr('height', legendBbox?.height!)
  //   requestAnimationFrame(() => {
  //       this.drawing_area.checkAndUpdateAreaSize()
  //   })
  // }

  // /**
  //  * _updateLegendHeight with timeout
  //  *
  //  * @private
  //  * @memberof ClassTemplate_Legend
  //  */
  // private updateLegendHeight() {
  //   this.updateLegendHeight()
  // }

  /**
 * Met à jour la taille de la zone de dragging après le rendu complet
 */
  private updateDragZone(): void {
    // S'assurer qu'on a une sélection valide
    if (!this.d3_selection) return

    // Supprimer l'ancienne zone
    this.d3_selection.select('.g_drag_zone_leg').remove()

    // Calculer la bbox du contenu réel (sans la zone de drag)
    const contentBbox = this.d3_selection.node()?.getBBox()
    if (!contentBbox) return

    // Créer la nouvelle zone avec les bonnes dimensions
    const dragZone = this.d3_selection.insert('g', ':first-child') // Insérer en premier pour être en arrière-plan
      .attr('class', 'g_drag_zone_leg')

    dragZone.append('rect')
      .attr('class', 'zone_for_dragging')
      .attr('width', contentBbox.width + 10) // Petit padding
      .attr('height', contentBbox.height + 10)
      .attr('x', contentBbox.x - 5)
      .attr('y', contentBbox.y - 5)
      .attr('rx', '2px')
      .attr('ry', '2px')
      .attr('stroke-dasharray', this.is_selected ? '6,6' : 'unherit')
      .attr('stroke', (this._legend_bg_border || this.is_selected) ? this._legend_bg_color : 'none')
      .attr('stroke-width', (this._legend_bg_border || this.is_selected) ? 1 : 0)
      .attr('fill', this._legend_bg_color)
      .attr('fill-opacity', this._legend_bg_opacity / 100)
  }
  // GETTERS / SETTERS ==================================================================

  public get is_visible(): boolean {
    return (
      super.is_visible &&
      (!this._masked)
    )
  }

  public get masked(): boolean { return this._masked }
  public set masked(_) { this._masked = _; this.draw(); this.drawing_area.areaAutoFit() }

  public get display_legend_scale(): boolean { return this._display_legend_scale }
  public set display_legend_scale(_) { this._display_legend_scale = _; this.draw() }

  public get scale_legend_unit(): string { return this._scale_legend_unit }
  public set scale_legend_unit(_) { this._scale_legend_unit = _; this.draw() }

  public get scale_legend_ratio(): number { return this._scale_legend_ratio }
  public set scale_legend_ratio(_) { this._scale_legend_ratio = (_ && _ !== 0) ? _ : 1; this.draw() }

  public get legend_police(): number { return this._legend_police }
  public set legend_police(_) { this._legend_police = _; this.draw() }

  public get legend_bg_border(): boolean { return this._legend_bg_border }
  public set legend_bg_border(_) { this._legend_bg_border = _; this.draw() }

  public get legend_bg_color(): string { return this._legend_bg_color }
  public set legend_bg_color(_) { this._legend_bg_color = _; this.draw() }

  public get legend_bg_opacity(): number { return this._legend_bg_opacity }
  public set legend_bg_opacity(_) { this._legend_bg_opacity = _; this.draw() }

  public get legend_show_dataTags(): boolean { return this._legend_show_dataTags }
  public set legend_show_dataTags(_) { this._legend_show_dataTags = _; this.draw() }

  public get legend_show_constraints(): boolean { return this._legend_show_constraints }
  public set legend_show_constraints(_) { this._legend_show_constraints = _; this.draw() }

  public get legend_horizontal(): boolean { return this._legend_horizontal }
  public set legend_horizontal(_) { this._legend_horizontal = _; this.draw(); this.drawing_area.areaAutoFit() }

  public get width(): number { return this._width }
  public set width(_) { this._width = _; this.draw() }

  public get info_link_value_void(): boolean { return this._info_link_value_void }
  public set info_link_value_void(_) { this._info_link_value_void = _; this.draw() }

  public get legend_show_data_type(): boolean { return this._legend_show_data_type }
  public set legend_show_data_type(_) { this._legend_show_data_type = _; this.draw() }

  public get stick_to_drawing(): boolean { return this._stick_to_drawing }
  public set stick_to_drawing(stick) {
    if (stick) {
      if (this.drawing_area.d3_selection) {
        this.drawing_area.d3_selection_zoom_area?.select('#grp_legend').remove()
        this.drawing_area.d3_selection_legend = this.drawing_area.d3_selection.append('g').attr('id', 'grp_legend')
        let x = 0, y = 0, k = 1
        const tmp = this.drawing_area.d3_selection_zoom_area?.node()
        if (tmp && tmp !== null) {
          x = d3.zoomTransform(tmp).x
          y = d3.zoomTransform(tmp).y
          k = d3.zoomTransform(tmp).k
        }
        // Convertit la position actuelle vers le format legacy
        // Position legacy = (position actuelle - offset) / scale
        this._position.x = (this._position.x - x) / k
        this._position.y = (this._position.y - y) / k
      }
    } else if (this.drawing_area.d3_selection_zoom_area) {
      this.drawing_area.d3_selection?.select('#grp_legend').remove()
      this.drawing_area.d3_selection_legend = this.drawing_area.d3_selection_zoom_area.append('g').attr('id', 'grp_legend')
      let x = 0, y = 0, k = 1
      const tmp = this.drawing_area.d3_selection_zoom_area?.node()
      if (tmp && tmp !== null) {
        x = d3.zoomTransform(tmp).x
        y = d3.zoomTransform(tmp).y
        k = d3.zoomTransform(tmp).k
      }
      //Set pos of legend like it was in legacy (so we have to take into account old pos of legend & scale of DA)
      this.setPosXY((this._position.x * k) + x, (this._position.y * k) + y)
    }
    this._stick_to_drawing = stick; this.draw()
  }
}
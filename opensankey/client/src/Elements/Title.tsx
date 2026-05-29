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
// Author        : TerriFlux
// ==================================================================================================

import * as d3 from 'd3'

import {
  default_title_bold, default_title_color, default_title_font_size,
  default_title_masked, default_title_source, default_title_stick_to_drawing
} from './ElementsAttributesConfig'
import { Class_DrawingArea } from '../types/DrawingArea'
import { Class_Sankey } from '../types/Sankey'
import { Class_NodeBase } from './NodeBase'

export type Type_TitleSource = 'custom' | 'datatag'

/**
 * Titre du diagramme. Élément texte unique par diagramme, positionné par
 * défaut en haut et centré sur le contenu Sankey, en gras. Le texte affiché
 * est soit un texte personnalisé, soit le libellé de la valeur sélectionnée
 * d'un data tag group. Modélisé comme la légende (ClassTemplate_Legend) :
 * élément autonome rattaché à drawing_area, qui gère son propre groupe SVG.
 */
export class ClassTemplate_DrawingTitle extends Class_NodeBase {
  private _masked: boolean = default_title_masked
  private _title_source: Type_TitleSource = default_title_source as Type_TitleSource
  private _custom_text: string = ''
  private _datatag_group_id: string = ''
  private _font_size: number = default_title_font_size
  private _bold: boolean = default_title_bold
  private _color: string = default_title_color
  private _stick_to_drawing: boolean = default_title_stick_to_drawing
  // Tant que true, la position est recalculée à chaque dessin pour rester
  // centrée en haut du diagramme. Le premier déplacement à la souris la fige.
  private _auto_center: boolean = true

  constructor(
    drawing_area: Class_DrawingArea,
    sankey: Class_Sankey
  ) {
    super('drawing_title', '', drawing_area, sankey.default_style, 'grp_title')
  }

  public copyFrom(_: Class_NodeBase): void {
    super.copyFrom(_)
    const cast_copy = _ as unknown as ClassTemplate_DrawingTitle
    this._masked = cast_copy._masked
    this._title_source = cast_copy._title_source
    this._custom_text = cast_copy._custom_text
    this._datatag_group_id = cast_copy._datatag_group_id
    this._font_size = cast_copy._font_size
    this._bold = cast_copy._bold
    this._color = cast_copy._color
    this._stick_to_drawing = cast_copy._stick_to_drawing
    this._auto_center = cast_copy._auto_center
  }

  /**
   * Texte effectivement affiché : texte personnalisé, ou libellé de la (des)
   * valeur(s) sélectionnée(s) du data tag group choisi.
   */
  public getDisplayedText(): string {
    if (this._title_source === 'datatag') {
      const grp = this.drawing_area.sankey.data_taggs_list.find(g => g.id === this._datatag_group_id)
      if (!grp) return ''
      return grp.selected_tags_list.map(tag => tag.display_name).join(', ')
    }
    return this._custom_text
  }

  protected override _initDraw() {
    const parent = this._stick_to_drawing
      ? this.drawing_area.d3_selection
      : this.drawing_area.d3_selection_zoom_area
    if (!parent) return
    // Cast pour unifier les deux types de parent (SVGGElement / SVGSVGElement)
    // sans casser la résolution de selectAll.
    const grp = (parent as unknown as d3.Selection<SVGGElement, unknown, HTMLElement, unknown>)
      .selectAll<SVGGElement, unknown>(' #grp_title')
    if (grp.nodes().length === 0) return
    grp.selectAll('#' + this.svg_group).remove()
    this.d3_selection = grp.append('g')
      .attr('id', this.svg_group) as unknown as d3.Selection<SVGGElement, unknown, SVGGElement, unknown>
  }

  // On NE dessine PAS la forme de nœud héritée : on rend uniquement le texte
  // du titre. Appelé par Class_NodeBase._draw().
  protected override drawElements() {
    const text = this.getDisplayedText()
    if (!text || !this.d3_selection) return
    this.d3_selection
      .append('text')
      .attr('class', 'drawing_title_text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'hanging')
      .style('font-size', this._font_size + 'px')
      .style('font-weight', this._bold ? 'bold' : 'normal')
      .style('font-family', this.name_label_font_family)
      .style('fill', this._color)
      .style('cursor', this.drawing_area.editable ? 'move' : 'default')
      .text(text)
  }

  public override applyPosition() {
    if (this._auto_center) {
      const center = this._computeDefaultPosition()
      if (center) {
        this._position.x = center.x
        this._position.y = center.y
      }
    }
    this.d3_selection?.attr(
      'transform',
      'translate(' + this.position_x + ', ' + this.position_y + ')'
    )
  }

  /**
   * Position par défaut : centré horizontalement sur le bbox du contenu Sankey,
   * juste au-dessus de celui-ci.
   */
  private _computeDefaultPosition(): { x: number, y: number } | null {
    const bbox = this.drawing_area.d3_selection_elements_sankey_group?.node()?.getBBox()
    if (!bbox || (bbox.width === 0 && bbox.height === 0)) return null
    return {
      x: bbox.x + bbox.width / 2,
      y: Math.max(0, bbox.y - this._font_size - 20)
    }
  }

  public override drawAsSelected() {
    this.draw()
  }

  // Le titre se déplace à la souris (drag) ; le premier déplacement fige la
  // position (désactive le recentrage automatique).
  protected override eventMouseDrag(
    event: d3.D3DragEvent<SVGGElement, unknown, unknown>
  ): void {
    if (!this.drawing_area.editable) return
    this._auto_center = false
    this._position.x += event.dx
    this._position.y += event.dy
    this.setPosXY(this._position.x, this._position.y)
  }

  protected override eventMouseDragStart() { /* no-op */ }

  public override eventMouseDragEnd(): void {
    this.draw()
    this.drawing_area.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  }

  // Neutralise les comportements de nœud hérités (qui supposent un nœud du
  // Sankey) : le titre n'a ni sélection de nœud ni survol de liens.
  public override eventSimpleLMBClick() { /* no-op */ }
  public override eventMouseOver() { /* no-op */ }
  public override eventMouseOut() { /* no-op */ }
  protected override eventSimpleRMBClick() { /* no-op */ }
  protected override eventMaintainedClick() { /* no-op */ }

  // GETTERS / SETTERS ==================================================================

  public get is_visible(): boolean {
    return super.is_visible && !this._masked && this.getDisplayedText().length > 0
  }

  public get masked(): boolean { return this._masked }
  public set masked(_) {
    this._masked = _
    // Réafficher = recentrer par défaut
    if (!_) this._auto_center = true
    this.draw()
  }

  public get title_source(): Type_TitleSource { return this._title_source }
  public set title_source(_) { this._title_source = _; this.draw() }

  public get custom_text(): string { return this._custom_text }
  public set custom_text(_) { this._custom_text = _; this.draw() }

  public get datatag_group_id(): string { return this._datatag_group_id }
  public set datatag_group_id(_) { this._datatag_group_id = _; this.draw() }

  public get title_font_size(): number { return this._font_size }
  public set title_font_size(_) { this._font_size = _; this.draw() }

  public get bold(): boolean { return this._bold }
  public set bold(_) { this._bold = _; this.draw() }

  public get title_color(): string { return this._color }
  public set title_color(_) { this._color = _; this.draw() }

  public get stick_to_drawing(): boolean { return this._stick_to_drawing }
  public set stick_to_drawing(_) { this._stick_to_drawing = _; this.draw() }

  public get auto_center(): boolean { return this._auto_center }
  public set auto_center(_) { this._auto_center = _; this.draw() }
}

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

// Local modules
import { ClassTemplate_LinkElement } from './Link'
import { ClassAbstract_DrawingArea, ClassAbstract_Sankey } from '../types/Abstract'
import { ClassAbstract_NodeElement } from '../types/AbstractNode'

/**
 * Class that handles all drawing and rendering operations for LinkElement
 */
export class LinkTooltip<
  Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
  Type_GenericSankey extends ClassAbstract_Sankey,
  Type_GenericNodeElement extends ClassAbstract_NodeElement<Type_GenericDrawingArea, Type_GenericSankey>
> {
  /**
   * Value of tooltip text associated to link
   * @private
   * @type {string}
   * @memberof ClassTemplate_LinkElement
   */
  private _tooltip_text: string = ''

  private _link: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  
  constructor(
    link: ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericNodeElement>
  ) {
    this._link = link
  }

  /**
   * Display the tooltip on drawing area
   *
   * @private
   * @memberof ClassTemplate_LinkElement
   */
  public drawTooltip() {
    // Clean previous label
    d3.selectAll('.sankey-tooltip').remove()
    d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('opacity', 1)
      .style('top', (this._link.source.position_y + this._link.target.position_y) / 2 + 'px')
      .style('left', (this._link.source.position_x + this._link.target.position_x) / 2 + 'px')
      .html(this.tooltip_html)
  }

  
  /**
   * Event when we move the mouse over the link and the tooltip is shown,
   * we simply move the tooltip to current cursor location
   *
   * @private
   * @param {React.MouseEvent<HTMLButtonElement, React.MouseEvent>} event
   * @memberof ClassTemplate_LinkElement
   */
  public moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    d3.selectAll('.sankey-tooltip')
      .style('top', event.pageY + 'px')
      .style('left', event.pageX + 'px')
  }

  private get tooltip_html() {
    // Title
    let tooltip_html = '<p class="title" style="margin-bottom: 5px;">' +
      this._link.source.name.split('\\n').join(' ') +
      ' → ' +
      this._link.target.name.split('\\n').join(' ') +
      '</p>'
    // Subtitle
    if (this.tooltip_text) {
      tooltip_html += '<p class="subtitle" style="	margin-bottom: 5px;">' +
        this.tooltip_text.split('\n').join('</br>') +
        '</p>'
    }
    // Create table
    tooltip_html += '<div style="padding-left :5px;padding-right :5px">'
    tooltip_html += '<table class="table" style="margin-bottom: 5px;">'
    tooltip_html += '  <tbody>'
    // Show data
    tooltip_html += '    <tr>'
    tooltip_html += '      <th>' + this._link.drawing_area.application_data.t('Noeud.drawing_area_tooltip.val') + '</th>'
    tooltip_html += '      <td>' + this._link.data_label + '</td>'
    tooltip_html += '    </tr>'
    // Show flux tags
    const flux_tags = this._link.flux_tags_list // avoid hidden recomputing
    this._link.flux_taggs_list
      .forEach(tagg => {
        const flux_tags_names = flux_tags
          .filter(tag => tag.group === tagg)
          .map(tag => tag.name)
        tooltip_html += '    <tr>'
        tooltip_html += '      <th> ' + tagg.name + ' </th>'
        tooltip_html += '      <td>' + flux_tags_names.join() + '</td>'
        tooltip_html += '    </tr>'
      })
    tooltip_html += '  </tbody>'
    tooltip_html += '</table>'
    tooltip_html += '</div>'
    return tooltip_html
  }

  /**
   * Set tooltip text
   * @memberof ClassTemplate_LinkElement
   */
  public get tooltip_text() { return this._tooltip_text }

  /**
   * Get tooltip text
   * @memberof ClassTemplate_LinkElement
   */
  public set tooltip_text(_: string) {
    this._tooltip_text = _
    // TODO redraw ?
  }
}
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
import { ClassTemplate_NodeElement } from './Node'
import { ClassAbstract_DrawingArea, ClassAbstract_Sankey } from '../types/Abstract'
import { ClassTemplate_LinkElement } from './Link'

/**
 * Class that handles all tooltip operations for NodeElement
 */
export class NodeTooltip<
  Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
  Type_GenericSankey extends ClassAbstract_Sankey,
  Type_GenericLinkElement extends ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
> {

  private _node: ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>

  constructor(node: ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>) {
    this._node = node
  }

  /**
   * Display the tooltip on drawing area
   */
  public drawTooltip() {
    // Clean previous label
    d3.selectAll('.sankey-tooltip').remove()
    d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .attr('opacity', 1)
      .style('top', this._node.position_y + 'px')
      .style('left', this._node.position_x + 'px')
      .html(this.getTooltipHTML())
  }

  /**
   * Move tooltip to follow mouse cursor
   */
  public moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    d3.selectAll('.sankey-tooltip')
      .style('top', event.pageY + 'px')
      .style('left', event.pageX + 'px')
  }

  /**
   * Remove tooltip from display
   */
  public removeTooltip() {
    d3.selectAll('.sankey-tooltip').remove()
    this._node.d3_selection?.classed('tooltip_shown', false)
  }

  /**
   * Generate HTML content for tooltip
   */
  private getTooltipHTML() {
    let input_val = 0
    let output_val = 0
    this._node.input_links_list.filter(link => link.is_visible).forEach(link => input_val += link.value?.valueResult ?? 0)
    this._node.output_links_list.filter(link => link.is_visible).forEach(link => output_val += link.value?.valueResult ?? 0)
    
    // Title
    let tooltip_html = '<p class="title" style="margin-bottom: 5px;">' +
      this._node.name.split('\\n').join(' ') +
      '</p>'
    
    // Subtitle
    if (this._node.tooltip_text)
      tooltip_html += '<p class="subtitle" style="margin-bottom: 5px;">' + this._node.tooltip_text.split('\n').join('<br>') + '</p>'
    
    tooltip_html += '<div style="padding-left :5px;padding-right :5px">'
    
    // Input links
    if (this._node.hasInputLinks()) {
      tooltip_html += '<p class="tab-title" style="margin-bottom: 5px;">' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.inputs') + '</p>'
      tooltip_html += '<table class="table" style="margin-bottom: 5px;">'
      tooltip_html += '  <thead>'
      tooltip_html += '    <tr>'
      tooltip_html += '      <th>' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.prov') + '</th>'
      tooltip_html += '      <th>' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.val') + '</th>'
      tooltip_html += '      <th>' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.rat') + '</th>'
      this._node.sankey.flux_taggs_list
        .forEach(tagg =>
          tooltip_html += '      <th>' + tagg.name + '</th>')
      tooltip_html += '    </tr>'
      tooltip_html += '  </thead>'
      tooltip_html += '  </tbody>'
      
      // Fill input link table
      this._node.input_links_list
        .filter(link => link.is_visible)
        .forEach(link => {
          // Source
          tooltip_html += '    <tr>'
          tooltip_html += '      <td style="white-space: nowrap;">' + link.source.name + '</td>'
          // With values
          tooltip_html += '      <td>' + link.data_label + '</td>'
          if (input_val > 0)  // avoid div / 0
            tooltip_html += '      <td>' + Math.round(((link.valueResult ?? 0) / input_val) * 100).toPrecision(3) + '%</td>'
          else
            tooltip_html += '      <td></td>'
          // And flux tag for each values
          this._node.sankey.flux_taggs_list
            .forEach(tagg => {
              const _: string[] = []
              link.flux_tags_list
                .forEach(tag => {
                  if (tag.group === tagg)
                    _.push(tag.name)
                })
              tooltip_html += '      <td style="white-space: nowrap;">' + _.join() + '</td>'
            })
          tooltip_html += '   </tr>'
        })
      tooltip_html += '    <tr>'
      tooltip_html += '       <th>' + 'Total' + '</th>'
      tooltip_html += '       <td>' + input_val.toPrecision() + '</td>' // TODO manque traduction virgule + nombre de chiffre signification cohérent avec valuer flux
      tooltip_html += '    </tr>'
      tooltip_html += '  </tbody>'
      tooltip_html += '</table>'
    }
    
    // Output links
    if (this._node.hasOutputLinks()) {
      tooltip_html += '<p class="tab-title" style="margin-bottom: 5px;">' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.outputs') + '</p>'
      tooltip_html += '<table class="table" style="margin-bottom: 5px;">'
      tooltip_html += '  <thead>'
      tooltip_html += '    <tr>'
      tooltip_html += '      <th>' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.dest') + '</th>'
      tooltip_html += '      <th>' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.val') + '</th>'
      tooltip_html += '      <th>' + this._node.drawing_area.application_data.t('Noeud.drawing_area_tooltip.rat') + '</th>'
      this._node.sankey.flux_taggs_list
        .forEach(tagg =>
          tooltip_html += '      <th>' + tagg.name + '</th>')
      tooltip_html += '    </tr>'
      tooltip_html += '  </thead>'
      
      // Fill input link table
      this._node.output_links_list
        .filter(link => link.is_visible)
        .forEach(link => {
          // Source
          tooltip_html += '    <tr>'
          tooltip_html += '      <td style="white-space: nowrap;">' + link.target.name + '</td>'
          // With values
          tooltip_html += '      <td>' + link.data_label + '</td>'
          if (output_val > 0)  // avoid div / 0
            tooltip_html += '      <td>' + Math.round(((link.valueResult ?? 0) / output_val) * 100).toPrecision(3) + '%</td>'
          else
            tooltip_html += '      <td></td>'
          // And flux tag for each values
          this._node.sankey.flux_taggs_list
            .forEach(tagg => {
              const _: string[] = []
              link.flux_tags_list
                .forEach(tag => {
                  if (tag.group === tagg)
                    _.push(tag.name)
                })
              tooltip_html += '      <td style="white-space: nowrap;">' + _.join() + '</td>'
            })
          tooltip_html += '    </tr>'
        })
      tooltip_html += '    <tr>'
      tooltip_html += '      <th>' + 'Total' + '</th>'
      tooltip_html += '      <td>' + output_val.toPrecision() + '</td>' // TODO manque traduction virgule + nombre de chiffre signification cohérent avec valuer flux
      tooltip_html += '    </tr>'
      tooltip_html += '  </tbody>'
      tooltip_html += '</table>'
    }
    
    tooltip_html += '</div>'
    return tooltip_html
  }
}
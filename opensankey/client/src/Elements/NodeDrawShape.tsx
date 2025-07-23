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

// Local modules
import { ClassTemplate_NodeElement } from './Node'
import { ClassAbstract_DrawingArea, ClassAbstract_Sankey } from '../types/Abstract'
import { ClassTemplate_LinkElement } from './Link'
import { default_element_color } from '../types/Utils'
import { default_selected_stroke_width } from './Node'

/**
 * Class that handles all drawing and rendering operations for NodeElement shapes
 */
export class NodeDrawShape<
  Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
  Type_GenericSankey extends ClassAbstract_Sankey,
  Type_GenericLinkElement extends ClassTemplate_LinkElement<Type_GenericDrawingArea, Type_GenericSankey, ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
> {

  private _node: ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>

  constructor(node: ClassTemplate_NodeElement<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>) {
    this._node = node
  }

  /**
   * Draw node shape on d3 svg
   */
  public drawShape() {
    // Speed-up computing
    if (!this._node.d3_selection)
      return
    
    const drawingElements = this._node.internalDrawingElements
    
    // Clean previous shape
    drawingElements.d3_selection_g_shape?.selectAll('.node_shape').remove()
    
    // Do the rest only if shape is visible
    // Compute shape attributes
    const width = this._node.getShapeWidthToUse()
    const height = this._node.getShapeHeightToUse()
    const color = this.getShapeColorToUse()
    
    // Apply shape value
    if (this._node.shape_type === 'rect') {
      drawingElements.d3_selection_g_shape?.append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('width', width)
        .attr('height', height)
    }
    else if (this._node.shape_type === 'ellipse') {
      drawingElements.d3_selection_g_shape?.append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('rx', width / 2)
        .attr('ry', height / 2)
    }
    else if (this._node.shape_type === 'arrow') {
      drawingElements.d3_selection_g_shape?.append('path')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('d', this.getArrowPath())
    }
    
    // Apply common properties
    drawingElements.d3_selection_g_shape?.selectAll('.node_shape')
      .attr('id', this._node.id)
      .attr('fill-opacity', this._node.shape_visible ? this._node.shape_opacity : '0')
      .attr('fill', color)
      .attr('stroke', 'black')
      .attr('stroke-width', this._node.is_selected ? default_selected_stroke_width : 0)
      .attr('stroke-opacity', this._node.is_selected ? 1 : 0)
  }

  /**
   * Update stroke width for selected state
   */
  public updateSelectedStroke(isSelected: boolean) {
    const drawingElements = this._node.internalDrawingElements
    drawingElements.d3_selection_g_shape?.selectAll('.node_shape')
      .attr('stroke-width', isSelected ? default_selected_stroke_width : 0)
      .attr('stroke-opacity', isSelected ? 1 : 0)
  }

  /**
   * Select the right color to use for this node (attribute / style / tags / ...)
   */
  public getShapeColorToUse() {
    // Default color
    let shape_color = this._node.shape_color
    
    // Is the color defined by tags
    const taggs_activated = this._node.taggs_list
      .filter(tagg => tagg.show_legend)
    
    if (
      (!this._node.shape_color_sustainable) &&
      (taggs_activated.length > 0)
    ) {
      const tagg_for_colormap = taggs_activated[0]
      const tags_for_colormap = this._node.tags_list
        .filter(tag => (tag.group === tagg_for_colormap))
      const selected_tags_for_colormap = tags_for_colormap
        .filter(tag => tag.is_selected)
      
      if (selected_tags_for_colormap.length > 0 ) {
        // if a node has several tags we take the first one. The logic is given
        // by the following example. Meuble en hêtre has two tags hêtre and feuillu
        // we put hêtre first as it is the most desagregated. This way we can display
        // the nodes with different colors depending of the level of detail selected.
        shape_color = selected_tags_for_colormap[0].color
      } else {
        shape_color = default_element_color
      }
    }
    
    return shape_color
  }

  /**
   * Generate arrow path for arrow-shaped nodes
   */
  private getArrowPath() {
    // Compute height & width
    const width = this._node.getShapeWidthToUse()
    const height = this._node.getShapeHeightToUse()
    // Svg path to construct
    let path = ''
    
    // Arrow toward the right side
    if (this._node.shape_arrow_angle_direction === 'right') {
      const opp = Math.tan(this._node.shape_arrow_angle_factor * Math.PI / 180) * (height / 2)
      const p0: string = '0,0'
      const p1: string = (width - opp) + ',0'
      const p2: string = width + ',' + (height / 2)
      const p3: string = (width - opp) + ',' + height
      const p4: string = '0,' + height
      const p5: string = opp + ',' + (height / 2)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the left side
    else if (this._node.shape_arrow_angle_direction === 'left') {
      const opp = Math.tan((this._node.shape_arrow_angle_factor * Math.PI / 180)) * (height / 2)
      const p0: string = opp + ',0'
      const p1: string = width + ',0'
      const p2: string = width - opp + ',' + (height / 2)
      const p3: string = width + ',' + height
      const p4: string = opp + ',' + height
      const p5: string = '0,' + (height / 2)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the top
    else if (this._node.shape_arrow_angle_direction === 'top') {
      const opp = Math.tan((this._node.shape_arrow_angle_factor * Math.PI / 180)) * (width / 2)
      const p0: string = '0,' + opp
      const p1: string = width / 2 + ',0'
      const p2: string = width + ',' + opp
      const p3: string = width + ',' + height
      const p4: string = width / 2 + ',' + (height - opp)
      const p5: string = '0,' + height
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    // Arrow toward the bottom
    else {
      const opp = Math.tan((this._node.shape_arrow_angle_factor * Math.PI / 180)) * (width / 2)
      const p0: string = '0,0'
      const p1: string = (width / 2) + ',' + opp
      const p2: string = width + ',0'
      const p3: string = width + ',' + (height - opp)
      const p4: string = (width / 2) + ',' + height
      const p5: string = '0,' + (height - opp)
      path = 'M' + p0 + 'L' + p1 + 'L' + p2 + 'L' + p3 + 'L' + p4 + 'L' + p5 + 'z'
    }
    
    return path
  }
}
// ==================================================================================================
// Author : Vincent LE DOZE for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import * as d3 from 'd3'

// Local types
import {
  FType_ApplyPositionToNodeElement,
  FType_UpdateDrawNodeElementShape,
  FType_UpdateDrawNodeElementLabel
} from './prototypes/Nodes'
import { PathNodeArrowShape } from '../../draw/SankeyDrawFunction'

// ==================================================================================================
/**
 * Apply node position to it shape in d3
 *
 * @param {Class_Node} node
 */
export const applyPositionToNodeElement: FType_ApplyPositionToNodeElement = (
  node
)=>{
  if (node.d3_selection !== null) {
    // Default positions
    let x = node.getPosX()
    let y = node.getPosY()
    // Deal with import / export nodes
    if (node.getPosType() === 'relative') {
      if (node.hasInputLinks()) {
        // Node is export
        const input_link = node.getFirstInputLink()
        if (!input_link?.getShapeVisible()) {
          return 'translate(0, 0)'
        }
        const source_node = input_link.source
        if ( !source_node.getShapeVisible()) {
          return 'translate(0, 0)'
        }
        x = source_node.getPosX() + node.getPosX()
        y = source_node.getPosY() + node.getPosY()
      }
      else if (node.hasOutputLinks()) {
        // Node is import
        const output_link = node.getFirstOutputLink()
        if ( !output_link?.getShapeVisible()) {
          return 'translate(0,0)'
        }
        const target_node = output_link.target
        if ( !target_node.getShapeVisible()) {
          return 'translate(0,0)'
        }
        x = target_node.getPosX() + node.getPosX()
        y = target_node.getPosY() + node.getPosY()
      }
    }
    node.d3_selection.attr('transform', 'translate(' + x + ', ' + y + ')')
  }
}

/**
 * Update visual elements linked to the shape of nodes
 */
export const updateDrawNodeElementShape: FType_UpdateDrawNodeElementShape = (
  node
) =>{
  // Get drawing scale
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, node.display.drawing_area.scale])
  // Clean previous shape
  node.d3_selection?.selectAll(' .node_shape').remove()
  // Apply shape value
  if (node.display.shape.type === 'rect') {
    node.d3_selection?.append('rect')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('width', node.display.shape.width)
      .attr('height', node.display.shape.height)
  }
  else if (node.display.shape.type === 'ellipse') {
    node.d3_selection?.append('ellipse')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('cx', node.display.shape.width / 2)
      .attr('cy', node.display.shape.height / 2)
      .attr('rx', node.display.shape.width / 2)
      .attr('ry', node.display.shape.height / 2)
  }
  else if (node.display.shape.type === 'arrow') {
    node.d3_selection?.append('path')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('d', () => {
        const n_w = node.display.shape.width
        const n_h = node.display.shape.height
        const k_angle = node.arrow_angle_factor
        const angle_direction = node.arrow_angle_direction
        // const path='M0,0L'+n_w*(1-k_angle)+',0L'+n_w+','+n_h/2+'L'+n_w*(1-k_angle)+','+n_h+'L0,'+n_h+'L'+n_w*k_angle+','+n_h/2
        const path = PathNodeArrowShape(n_w, n_h, k_angle, angle_direction, scale)
        return path
      })
  }
  // Apply common properties
  node.d3_selection?.selectAll(' .node_shape')
    .attr('id', node.id)
    .attr('fill-opacity', node.getShapeVisible() ? '1' : '0')
    .attr('fill', node.display.shape.color)
    .style('stroke', 'black')
    // .style('stroke-width', d => {
    //   const dd = (d as SankeyNode)
    //   return NodeStrokeWidth(dd,multi_selected_nodes)
    // }
}

/**
 * Update visual elements linked to the labels of nodes
 */
export const updateDrawNodeElementLabel : FType_UpdateDrawNodeElementLabel = (
  node
) => {
  // Clean previous label
  // TODO
  // Add name label
  if (node.name_label.visible) {
    // Add name label background
    if (node.name_label.background) {
      node.d3_selection?.append('rect')
        .classed('label', true)
        .classed('label_background', true)
        .attr('id', 'label_background_' + node.id)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.55)
        .attr('rx', 4)
    }
    // Add name label text
    node.d3_selection?.append('text')
      .classed('label', true)
      .classed('label_text',true)
      .attr('fill', node.name_label.color? 'white' : 'black')
      .attr('id', 'label_text_' + node.id)
      .attr('x', node.name_label.position.x)
      .attr('y', node.name_label.position.y)
      .attr('text-anchor', node.name_label.horiz)
      .style('text-align', 'center')
      .style('font-weight', node.name_label.bold ? 'bold' : 'normal')
      .style('font-style', node.name_label.italic ? 'italic' : 'normal')
      .style('font-size', String(node.name_label.font_size) + 'px')
      .style('font-family', node.name_label.font_family)
      .style('text-transform', node.name_label.uppercase ? 'uppercase' : 'none')
      .text(node.getNameLabelText())
      // TODO add text wrap -> .each(n => TextNodeWrap((n as SankeyNode),data))
    // Add an input to change the name of the node
    // The input appear when we double click on the label
    if(!node.display.drawing_area.static){
      node.d3_selection?.append('foreignObject')
        .classed('label', true)
        .classed('label_fo_input', true)
        .attr('x', node.name_label.position.x)
        .attr('y', node.name_label.position.y)
        .style('width', String(node.name.length) + 'rem')
        .attr('height', node.name_label.font_size + 2)
        .style('display','none')
        .append('xhtml:div')
        .append('input')
        .classed('label', true)
        .classed('label_input', true)
        .attr('id', 'input_label_' + node.id)
        .attr('type', 'text')
        .attr('value', node.name)
        .style('font-size', String(node.name_label.font_size) + 'px')
        // // TODO Deplacer la suite ailleurs
        // .on('input',(evt,d)=>{d.name=evt.target.value})
        // .style('background-color', 'white')
        // .style('border', 'none')
        // .style('border-color', 'transparent')
        // .style('height', String(node.name_label.font_size) + 'px')
        // .style('outline', 'none')
        // .on('blur', (evt, n) => {
        //   // TODO completer
        //   node_function.RedrawNodes([n])
    }
  }
}
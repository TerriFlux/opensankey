
import { SankeyNode, SankeyLink, SankeyData } from './types'
import { cloneSelection } from './SankeyUtils'
import * as d3 from 'd3'

export const add_tooltips = (
  data: SankeyData,
  gg_elements: d3.Selection<SVGGElement, SankeyNode & SankeyLink, SVGGElement, SankeyNode & SankeyLink>,
  suffix: string,
  elements: SankeyNode[] | SankeyLink[],
  g_elements_origin: SVGGElement | null,
  node_tooltip: (data: SankeyData, d: SankeyNode | SankeyLink) => string,
  link_tooltip: (data: SankeyData, d: SankeyNode | SankeyLink) => string
) => {
  gg_elements
    .on('mouseover', (event, d) => {
      const element_id = elements.indexOf(d)
      show_node_or_link_tooltip(data, d, suffix, element_id, suffix === 'node' ? node_tooltip : link_tooltip)
      d3.select('#tooltip_' + suffix + element_id)
        .attr('transform', 'translate(' + String(d3.pointer(event, g_elements_origin)[0] + 20) + ',' + String(d3.pointer(event, g_elements_origin)[1] + 20) + ')')
      cloneSelection(d3.select('#tooltip_' + suffix + element_id), 1)
    })
    .on('mouseout', (_, d) => {
      if (d.tooltip_text) {
        const id = elements.indexOf(d)
        const tooltip_lines = d.tooltip_text.split('\\n')
        tooltip_lines.forEach((_, r) => d3.select('#text_tooltip_' + suffix + id + 'span' + r).remove())
        //delete d.tooltip_text
      }
      d3.selectAll('#front-0').remove()
    })

  // .on('mouseover',(_,d)=>{
  //   if ( !d.visible ) {
  //     return
  //   }
  //   show_node_or_link_tooltip(data,d,'node',d.id,default_node_tooltip)
  //   d3.select('#tooltip_node'+d.id)
  //     .attr('transform','translate(' + (d.x+50) + ',' + (d.y+20) + ')')
  //   cloneSelection(d3.select('#tooltip_node'+d.id), 1)
  // })
  // .on('mouseout',(_,node)=> {
  //   if ( node.tooltip_text !== undefined ) {
  //     const tooltip_lines = node.tooltip_text.split('\\n')
  //     tooltip_lines.forEach( (_,r) => d3.selectAll('#text_tooltip_'+'node'+node.id+'span'+r).remove() )
  //     delete node.tooltip_text
  //   }
  //   d3.selectAll('#front-0').remove()
  // })    

  d3.selectAll('.' + suffix + '_value')
    .on('mouseover', (e, d) => {
      const node_or_link = d as SankeyNode & SankeyLink
      const link_id = elements.indexOf(node_or_link)
      //if (!node_or_link.tooltip_text ) {
      show_node_or_link_tooltip(data, node_or_link, suffix, link_id, suffix === 'node' ? node_tooltip : link_tooltip)
      //}
      d3.select('#tooltip_link' + link_id)
        .attr('transform', 'translate(' + String(d3.pointer(e, g_elements_origin)[0] + 20) + ',' + String(d3.pointer(e, g_elements_origin)[1] + 20) + ')')
      cloneSelection(d3.select('#tooltip_' + suffix + link_id), 1)
    })
    .on('mouseout', (_, d) => {
      const node_or_link = d as SankeyNode & SankeyLink
      if (node_or_link.tooltip_text) {
        const id = elements.indexOf(node_or_link)
        const tooltip_lines = node_or_link.tooltip_text.split('\\n')
        tooltip_lines.forEach((e, r) => d3.select('#text_tooltip_' + 'link' + id + 'span' + r).remove())
        //delete node_or_link.tooltip_text
      }
      d3.selectAll('#front-0').remove()
    })

  const tooltips = gg_elements.append('g')
    .attr('class', 'tooltip')
    .attr('id', (d, i) => {
      return 'tooltip_' + suffix + i
    })

  tooltips.append('rect')
    .attr('class', 'rect_tooltip')
    .attr('id', (d, i) => {
      return 'rect_tooltip_' + suffix + i
    })
    .attr('rx', 5)
    .attr('height', (d) => {
      if (d.tooltip_text === null || d.tooltip_text === undefined) { // null or undefined
        return 50
      }
      else {
        d.tooltip_text = d.tooltip_text.split('<br>').join('\\n')
        const count_br = (d.tooltip_text.match(/\\n/g) || []).length + 1
        return Math.max(50, count_br * 15)
      }
    })

  tooltips.append('text')
    .attr('class', 'text_tooltip')
    .attr('id', (d, i) => {
      return 'text_tooltip_' + suffix + i
    })
}

export const show_tooltip = (shift: string) => {
  d3.select('#main_tooltip' + shift)
    .attr('transform', 'translate(' + shift + ',' + 10 + ')')
  cloneSelection(
    d3.select('#main_tooltip' + shift), 1
  )
  //tooltip.attr('visibility', 'visible').attr('top',50).attr('left',50)
  //   .on('mouseover', () => {return tooltip.style('visibility', 'visible')})
}

export const hide_tooltip = () => {
  d3.selectAll('#front-0').remove()
}

export const show_node_or_link_tooltip = (
  data: SankeyData,
  d: SankeyNode | SankeyLink,
  suffix: string,
  id: number,
  default_tooltip_callback: (arg0: SankeyData, arg1: SankeyLink | SankeyNode) => string
) => {
  let tooltip_text = d.tooltip_text
  if (tooltip_text === undefined || tooltip_text === '') {
    tooltip_text = default_tooltip_callback(data, d)
    d.tooltip_text = tooltip_text
  }
  let max_text_length = 0
  const tooltip_lines: string[] = d.tooltip_text ? d.tooltip_text.split('\\n') : []
  let dy = '1em'
  tooltip_lines.forEach(
    (e: string, r: number) => {
      let tooltip_class = 'text_tooltip'
      if (e.includes('<b>')) {
        e = e.substring(3)
        tooltip_class = 'text_tooltip_title'
      }
      if (e === '') {
        dy = '2em'
        return
      }
      const el = d3.select('#text_tooltip_' + suffix + id)
        .append('tspan')
        .attr('id', 'text_tooltip_' + suffix + id + 'span' + r)
        .attr('x', 10)
        .attr('dy', dy)
        .attr('class', tooltip_class)
        .text(e)
      const el_node = el.node()
      const text_length = el_node ? el_node.getComputedTextLength() : 0
      if (text_length >= max_text_length) {
        max_text_length = text_length
      }
      dy = '1em'
    }
  )
  if (tooltip_lines.length > 1 || tooltip_lines[0] !== '') {
    d3.select('#rect_tooltip_' + suffix + id)
      .attr('width', max_text_length + 80)
      .attr('height', () => {
        const tooltip_text = d.tooltip_text ? d.tooltip_text.split('<br>').join('\\n') : ''
        const count_br = (tooltip_text.match(/\\n/g) || []).length
        return Math.max(50, count_br * 15)
      })
  }
}

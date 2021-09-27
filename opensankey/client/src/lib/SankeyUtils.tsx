import { SankeyLink, SankeyNode } from './types'
import * as d3 from 'd3'

export const normalize_name = (name: string) =>{
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const find_link = ( 
  source_name: string, 
  target_name: string,
  region_name: string, 
  links: { [region_name: string]: SankeyLink[] } 
) =>{
  for (let i=0; i<links[region_name].length; i++) {
    const link = links[region_name][i]
    if ( normalize_name(link.source_name) === normalize_name(source_name) && 
         normalize_name(link.target_name) === normalize_name(target_name) 
    ) {
      return [links[region_name][i],i]
    }
  }
  return undefined
}

export const find_node = (
  node_name: string,
  nodes: SankeyNode[]
) =>{
  for (let i=0; i<nodes.length; i++) {
    if ( normalize_name(nodes[i].name) === normalize_name(node_name) ) {
      return nodes[i]
    }
  }
  return undefined
}

export const computeTotalOffsets = (
  node: SankeyNode,
  links: SankeyLink[],
  unused: unknown
) => {
  let total_output_offset = 0
  node.output_links.forEach(
    (id) => {
      const link = links[id]
      if ( link.visible || link.visible === undefined ) {
        total_output_offset += +link.value
      }
    }
  )
  let total_input_offset = 0
  node.input_links.forEach(
    (id) => {
      const link = links[id]
      if ( link.visible || link.visible === undefined ) {
        total_input_offset += +links[id].value
      }          
    }
  )
  return [total_input_offset,total_output_offset]
}

export const toPrecision = (
  v : number
) => {
  if (v < 1) {
    return String(v.toFixed(1))
  }
  let new_v = v.toPrecision(3).replace(/\.0+$/,'')
  if ( new_v.includes('e+3')) {
    new_v = String(parseFloat(new_v))
  }
  return new_v
}

export const cloneSelection = (
  toCopy: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>,
  times: number
) =>{
  toCopy.each(function() {
    for (let i = 0; i < times; i++) {
      const n = (d3.select('svg') as d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>).node() 
      if (n) {
        const clone = n.appendChild((this as HTMLElement).cloneNode(true)) as HTMLElement
        d3.select(clone).attr('class', 'clone').attr('id', 'front-' + i)
      }
    }
  })
}

export const isExport = (
  node : SankeyNode
) => {
  if (node.name.includes('(E') && !node.name.includes('(EA)')) {
    return true
  }
  return false
}

export const link_text = (
  d: SankeyLink,
  link_value: number,
  display_style: { font_size?: string; filter?: number; filter_label?: number; unit?: boolean }
) => {
  const str_display = String(d.display_value)
  // Test free variables
  if (str_display.includes('[') ) {
    return ''
  }    
  //let unit_name = ''
  const the_link_value = toPrecision(link_value)
  // if ( display_style.unit ) {
  //   if ( d.natural_unit ) {
  //     unit_name = d.natural_unit
  //     the_link_value = toPrecision(link_value * (d.conv ? d.conv[1] : 1) )
  //   }
  // }


  return the_link_value
}
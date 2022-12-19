/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { Requireable } from 'react'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData,  SankeyLinkValue, SankeyLabel } from './types'
import { InferProps } from 'prop-types'
import { compute_total_offsets, getLinkValue,test_link_value,link_color,delete_node,delete_link,default_node,default_link } from './SankeyUtils'
import { desagregation, agregation } from './SankeyLayout'
import LZString from 'lz-string'

export const strokeDasharray =(d:SankeyLink,data:SankeyData)=>{
  if (data.show_structure === 'structure') {
    return '5, 5'
  }
  if (data.show_structure === 'data' ) {
    const link_value = getLinkValue(data, d.idLink)
    if (!(link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return '5, 5'
    }
  }
  const link_value = getLinkValue(data, d.idLink)
  if (link_value === undefined) {
    return ''
  }
  const display_value = getLinkValue(data, d.idLink).display_value
  if (display_value.includes('*') && data.show_structure != 'structure' ) {
    return '40, 5'
  }
  const is_free = getLinkValue(data, d.idLink).extension!.free_mini !== undefined && +getLinkValue(data, d.idLink).extension!.free_mini == 0 && data.show_structure !== 'free'
  if (d.dashed || is_free) {
    return '5, 5'
  } else {
    return ''
  }
}
export const textLinkPosDY=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number)=>{
  if (l.orthogonal_label_position === 'middle') {
    return '0.3em'
  } else if (l.orthogonal_label_position === 'below') {
    const tmp=getLinkValue(data, l.idLink).value

    return scale((tmp)?tmp:0) / 2 + 10 + 'px'
  } else if (l.orthogonal_label_position === 'above') {
    const tmp=getLinkValue(data, l.idLink).value

    return -scale((tmp)?tmp:0) / 2 + 'px'
  }
  return '0.3em'
}

export const textLinkSide=(link:SankeyLink,data:SankeyData)=>{
  if (link.recycling) {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    } else if (link.label_position === 'middle' && link.orientation === 'hh') {
      return 'right'
    }
    return 'left'
  } else {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    } else {
      return 'right'
    }
    return 'left'
  }
}

export const linkStrokeWidth=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number,inv_scale:(t:number)=>number,min_thickness:number,display_nodes:{ [node_id: string]: SankeyNode })=>{


  const node = data.nodes[l.idSource]
  // const links = data.links
  const nodes = data.nodes
  // const stream_io = node.inputLinksId.concat(node.outputLinksId)
  //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs  
  //position noeud source ou target
  let pos_x_src, pos_y_src
  if (node.idNode == nodes[l.idSource].idNode) {
    pos_x_src = nodes[l.idTarget].x
    pos_y_src = nodes[l.idTarget].y
  } else {
    pos_x_src = nodes[l.idSource].x
    pos_y_src = nodes[l.idSource].y
  }
  const is_free = getLinkValue(data, l.idLink).extension!.free_mini !== undefined && +getLinkValue(data, l.idLink).extension!.free_mini == 0 && data.show_structure !== 'free'
  if (is_free) {
    return 5
  }  
  let link_value = test_link_value(data, nodes, l)
  link_value=(+link_value==0||(+link_value>=inv_scale(2)))?+link_value:inv_scale(2)  
  //Zones limite à ne pas êtres
  const limit_x = [pos_x_src - scale(link_value / 2), pos_x_src + node.node_width + scale(link_value / 2)]
  const limit_y = [pos_y_src - scale(link_value / 2), pos_y_src + scale(link_value / 2)]  
  let draw_warning = false  
  //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
  //si partie gauche du noeud ne se situe pas dans les coord du noeud source
  const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
  //si partie droite du noeud ne se situe pas dans le noeud source
  const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
  //si partie haute du noeud ne se situe pas dans le noeud source
  const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
  // const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]  
  if (l.orientation == 'hh') {
    //orientation hh
    draw_warning = left_in_src || right_in_src
  } else if (l.orientation == 'vv') {
    //orientation vv
    draw_warning = top_in_src
  } else if (l.orientation == 'vh') {
    draw_warning = left_in_src || right_in_src || top_in_src
  } else {
    //orientation hv 
    //draw_warning = node_in_src_hh || node_in_src_vv
    draw_warning = left_in_src || right_in_src || top_in_src
  }  
  if (draw_warning && !l.recycling) {
    return '1px'
  } else {  
    const link_value = test_link_value(data, display_nodes, l)
    const tmp =(link_value=='')?1:link_value
    // console.log(scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0)))
    return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))  
  }
}

export const linkStroke=(l:SankeyLink,data:SankeyData,defGradient:d3.Selection<SVGDefsElement,unknown,HTMLElement,unknown>)=>{
  const width_src = +d3.select('#' + l.idSource).attr('width')
  const height_src = +d3.select('#' + l.idSource).attr('height')
  const width_trgt = +d3.select('#' + l.idTarget).attr('width')
  // const height_trgt = +d3.select('#' + l.idTarget).attr('height')  
  const gradient = defGradient.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
    .attr('gradientUnits', 'userSpaceOnUse')  
  gradient.append('stop')
    .attr('id', 'stop-start')
    .attr('offset', '0%')
    .attr('stop-color', () => {  
      if (data.nodes[l.idSource].x <= data.nodes[l.idTarget].x) {
        const n = data.nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        const n = data.nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    })
    .attr('stop-opacity', 1)  
  gradient.append('stop')
    .attr('id', 'stop-end')
    .attr('offset', '100%')
    .attr('stop-color', () => {
      if (data.nodes[l.idSource].x <= data.nodes[l.idTarget].x) {
        const n = data.nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        const n = data.nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    })
    .attr('stop-opacity', 1)  
  const nodes = data.nodes  
  if (l.orientation == 'hh' || l.orientation == 'hv') {
    d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].x < nodes[l.idTarget].x) {
        d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idSource].x + width_src)
          .attr('y1', '0')
          .attr('x2', nodes[l.idTarget].x)
          .attr('y2', 0)
        const n = data.nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idTarget].x + width_trgt)
          .attr('y1', '0')
          .attr('x2', nodes[l.idSource].x)
          .attr('y2', 0)
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )  
    d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].x > nodes[l.idTarget].x) {
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )
  } else if (l.orientation == 'vv' || l.orientation == 'hv') {
    //orientation vert-vert
    d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].y < nodes[l.idTarget].y) {
        d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[l.idSource].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[l.idTarget].y)  
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[l.idTarget].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[l.idSource].y)  
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )  
    d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].y > nodes[l.idTarget].y) {
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )
  } else if (l.orientation == 'vh') {  
    d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].x < nodes[l.idTarget].x) {
        d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idSource].x + width_src - 10)
          .attr('y1', '0')
          .attr('x2', nodes[l.idTarget].x)
          .attr('y2', 0)
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idTarget].x + width_trgt + 10)
          .attr('y1', '0')
          .attr('x2', nodes[l.idSource].x)
          .attr('y2', 0)
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )  
    d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].x > nodes[l.idTarget].x) {
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color as string
        } else {
          return n.iconColor as string
        }
      } else {
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color as string
        } else {
          return n.iconColor as string
        }
      }
    }
    )  
  }
  
  return (l.gradient && l.colorParameter==='local') ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : link_color(l,data) as string
}   

export const eventLinkClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyLink,mode_visualisation:boolean,sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,multi_selected_links:{current: SankeyLink[] },links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,select_link:(n: SankeyLink) => void)=>{
  if ((event.ctrlKey || event.metaKey) && !mode_visualisation) {
    sankeyTooltip.style('opacity', 0)
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
      button_ref.current.click()
    }
    multi_selected_links.current = multi_selected_links.current.filter(d => (d != null && d.idLink != ''))
    if (multi_selected_links.current.includes(d)) {
      multi_selected_links.current.splice(multi_selected_links.current.indexOf(d), 1)
      d3.selectAll('#gg_' + d.idLink + ' rect.handle').attr('fill-opacity', '0')
      d3.selectAll('#gg_' + d.idLink + ' rect.handle').attr('cursor', 'pointer')
      d3.selectAll('#gg_' + d.idLink + ' .drag_zone').attr('cursor', 'pointer')
      d3.selectAll('#gg_' + d.idLink + ' .drag_zone').attr('stroke-opacity', '0')
      d3.selectAll('#gg_' + d.idLink + ' .center_handle').attr('stroke-opacity', '0')
      d3.selectAll('#gg_' + d.idLink + ' .center_handle').attr('fill-opacity', '0')
    } else {
      multi_selected_links.current.push(d)
      d3.selectAll('#gg_' + d.idLink + ' rect.handle').attr('fill-opacity', '1')
      d3.selectAll('#gg_' + d.idLink + ' rect.handle').attr('cursor', 'ew-resize')
      d3.selectAll('#gg_' + d.idLink + ' .drag_zone').attr('cursor', 'ns-resize')
      d3.selectAll('#gg_' + d.idLink + ' .drag_zone').attr('stroke-opacity', '1')
      d3.selectAll('#gg_' + d.idLink + ' .center_handle').attr('stroke-opacity', '1')
      d3.selectAll('#gg_' + d.idLink + ' .center_handle').attr('fill-opacity', '1')
    }
    if ( accordion_ref && accordion_ref.current) {
      for ( const child in accordion_ref.current.children) {
        if (accordion_ref.current.children[child].id === 'Flux') {
          (accordion_ref.current.children[0] as HTMLLabelElement).click();
          (accordion_ref.current.children[child] as HTMLLabelElement).click()
        }
      }
    }
    if ( links_accordion_ref && links_accordion_ref.current) {
      (links_accordion_ref.current.children[0] as HTMLLabelElement).click();
      (links_accordion_ref.current.children[1] as HTMLLabelElement).click()
    }
    select_link(d)
  }
} 

export const compute_end_points = (
  source_node: SankeyNode,
  target_node: SankeyNode,
  link: SankeyLink,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  selected_tags: { [tag_group: string]: string[] },
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number
) => {
  if (!links) {
    return [0, 0, 0, 0]
  }
  let link_value = test_link_value(data, nodes, link)
  if (link_value === undefined) {
    return [0, 0, 0, 0]
  }
  //inv_scale(2) = epaisseur minimum d'un flux
  link_value=(link_value==0 || (+link_value>=inv_scale(2)))?+link_value:inv_scale(2)
  let res = compute_total_offsets(inv_scale,source_node, data, selected_tags, test_link_value)
  const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res
  res = compute_total_offsets(inv_scale,target_node, data, selected_tags, test_link_value)
  const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res
  let node_size_s_width = inv_scale(source_node.node_width)
  let node_size_t_width = inv_scale(target_node.node_width)
  if (data.show_structure !== 'structure') {
    node_size_s_width = Math.max(
      inv_scale(source_node.node_width), s_total_offset_width_bottom, s_total_offset_width_top
    )
    node_size_t_width = Math.max(
      inv_scale(target_node.node_width), t_total_offset_width_bottom, t_total_offset_width_top
    )
  }
  let node_size_s_height = inv_scale(source_node.node_width)
  let node_size_t_height = inv_scale(target_node.node_width)
  if (data.show_structure !== 'structure') {
    node_size_s_height = Math.max(
      inv_scale(source_node.node_height), s_total_offset_height_left, s_total_offset_height_right
    )
    node_size_t_height = Math.max(
      inv_scale(target_node.node_height), t_total_offset_height_left, t_total_offset_height_right
    )
  }
  res = compute_total_offsets(inv_scale,source_node, data, selected_tags, test_link_value, link)
  const [s_offset_height_left, s_offset_height_right, s_offset_width_top, s_offset_width_bottom] = res
  res = compute_total_offsets(inv_scale,target_node, data, selected_tags, test_link_value, link)
  const [t_offset_height_left, t_offset_height_right, t_offset_width_top, t_offset_width_bottom] = res
  const delta_s_width_bottom = Math.max(0, (node_size_s_width - s_total_offset_width_bottom) / 2)
  const delta_s_width_top = Math.max(0, (node_size_s_width - s_total_offset_width_top) / 2)
  const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
  const delta_s_height_left = Math.max(0, (node_size_s_height - s_total_offset_height_left) / 2)
  const delta_t_width_bottom = Math.max(0, (node_size_t_width - t_total_offset_width_bottom) / 2)
  const delta_t_width_top = Math.max(0, (node_size_t_width - t_total_offset_width_top) / 2)
  const delta_t_height_right = Math.max(0, (node_size_t_height - t_total_offset_height_right) / 2)
  const delta_t_height_left = Math.max(0, (node_size_t_height - t_total_offset_height_left) / 2)
  const source_node_x = source_node.position === 'absolute' ? +source_node.x : +target_node.x + +source_node.x - +d3.select('#' + source_node.idNode).attr('width')
  const source_node_y = source_node.position === 'absolute' ? +source_node.y : +target_node.y + +source_node.y - +d3.select('#' + source_node.idNode).attr('height')
  const target_node_x = target_node.position === 'absolute' ? +target_node.x : +source_node.x + +target_node.x + +d3.select('#' + source_node.idNode).attr('width')
  const target_node_y = target_node.position === 'absolute' ? +target_node.y : +source_node.y + +target_node.y + +d3.select('#' + source_node.idNode).attr('height')
  let xs = source_node_x
  let ys = source_node_y
  let xt = target_node_x
  let yt = target_node_y
  const tmp=getLinkValue(data, link.idLink).value
  if (link.orientation === 'hh') {
    //side to side
    if (source_node_x > target_node_x && !link.recycling || source_node_x < target_node_x && link.recycling) {
      // source is after target arrow point leftward. Start is on the left of side of source
      // source -> left
      ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
      // target -> right
      xt += scale(node_size_t_width)
      yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
      if (link.arrow && tmp !== ''  && tmp!=0) {
        xt = xt + 10
      }
    } else {
      // source is before target arrow point rightward. Start is on the right of side of source
      const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
      xs += scale(node_size_s_width)
      ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
      yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
      if (link.arrow && tmp !== ''  && tmp!=0 ) {
        xt = xt - 10
      }
    }
  }
  if (link.orientation === 'vv') {
    //side to side
    if (source_node_y > target_node_y) {
      // source is bottom target. Flux goes up
      xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
      //ys = ys
      xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
      yt += scale(node_size_t_height)
      if (link.arrow && tmp !== ''  && tmp!=0) {
        yt = yt + 10
      }
    } else {
      // source is top target. Flux goes down
      xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
      ys += scale(node_size_s_height)
      xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
      if (link.arrow && tmp !== ''  && tmp!=0) {
        yt = yt - 10
      }
    }
  }
  if (link.orientation === 'hv') {
    //vertical to horizontal
    if (source_node_x > target_node_x) {
      if (source_node_y > target_node_y) {
        //source is bottom right target. left and up  
        ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
        xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
        yt += scale(node_size_t_height)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          yt = yt + 10
        }
      } else {
        //source is top right target. left and down
        ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
        xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          yt = yt - 10
        }
      }
    } else {
      if (source_node_y > target_node_y) {
        //source is bottom left target. right and up
        xs += scale(node_size_s_width)
        ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
        xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
        yt += scale(node_size_t_height)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          yt = yt + 10
        }
      } else {
        //source is top left target. right and down
        xs += scale(node_size_s_width)
        ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
        xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          yt = yt - 10
        }
      }
    }
  }
  if (link.orientation === 'vh') {
    //vertical to horizontal
    if (source_node_x > target_node_x) {
      if (source_node_y > target_node_y) {
        //source is bottom right target. up and left
        xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
        xt += scale(node_size_t_width)
        yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          xt += 10
        }
      } else {
        //source is top right target. down and left
        xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
        ys += scale(node_size_s_height)
        xt += scale(node_size_t_width)
        yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          xt += 10
        }
      }
    } else {
      if (source_node_y > target_node_y) {
        //source is bottom left target. Arrow goes left and go down to the top side 
        xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
        yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          xt = xt - 10
        }
      } else {
        //source is top left target. Arrow goes left and go down to the top side 
        xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
        ys += scale(node_size_s_height)
        yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
        if (link.arrow && tmp !== ''  && tmp!=0) {
          xt = xt - 10
        }
      }
    }
  }
  return [xs, ys, xt, yt]
}

export const nodeTransform=(d:SankeyNode,display_nodes:{[node_id:string]:SankeyNode},display_links:{[ink_id:string]:SankeyLink})=>{
  if (d.position === 'relative') {
    if (d.inputLinksId.length > 0) {
      const source_node = display_nodes[display_links[d.inputLinksId[0]].idSource]
      const x = source_node.x + d.x
      const y = source_node.y + d.y
      return 'translate(' + x + ', ' + y + ')'
    } else if (d.outputLinksId.length > 0) {
      const target_node = display_nodes[display_links[d.outputLinksId[0]].idTarget]
      const x = target_node.x + d.x
      const y = target_node.y + d.y
      return 'translate(' + x + ', ' + y + ')'            
    }
    return 'translate(' + 10 + ', ' + 10 + ')'
  } else {
    return 'translate(' + d.x + ', ' + d.y + ')'
  }
}

export const eventNodeClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode,mode_visualisation:boolean,sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,multi_selected_nodes:{current: SankeyNode[] },nodes_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,select_node:(n: SankeyNode) => void,static_sankey:boolean)=>{
  if (!static_sankey && !mode_visualisation &&  (event.ctrlKey || event.metaKey)) {
    sankeyTooltip.style('opacity', 0)
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
      button_ref.current.click()
    }
    multi_selected_nodes.current = multi_selected_nodes.current.filter(d => (d != null && d.name != ''))
    if (multi_selected_nodes.current.includes(d)) {
      multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(d), 1)
      d3.select('#' + d.idNode).attr('stroke-width',0)
      d3.select('#ggg_' + d.idNode+' .box_width_threshold').attr('visibility','hidden')
    } else {
      multi_selected_nodes.current.push(d)
      d3.select('#' + d.idNode).attr('stroke-width',2)
      d3.select('#ggg_' + d.idNode+' .box_width_threshold').attr('visibility','visible')
    }
    select_node(d)
    if ( accordion_ref && accordion_ref.current) {
      for ( const child in accordion_ref.current.children) {
        if (accordion_ref.current.children[child].id === 'Nodes') {
          (accordion_ref.current.children[0] as HTMLLabelElement).click();
          (accordion_ref.current.children[child] as HTMLLabelElement).click()
        }
      }
    }
    if ( nodes_accordion_ref && nodes_accordion_ref.current) {
      (nodes_accordion_ref.current.children[0] as HTMLLabelElement).click();
      (nodes_accordion_ref.current.children[1] as HTMLLabelElement).click()
    }
  }
} 

export const eventNodeContextMenu=(ev:React.MouseEvent<HTMLButtonElement>,n:SankeyNode,data:SankeyData,set_agregation_node:React.Dispatch<React.SetStateAction<string>>,set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,set_data:React.Dispatch<React.SetStateAction<SankeyData>>)=>{  
  ev.preventDefault()
  if (!n.dimensions) {
    return
  }
  if (ev.altKey) {
    const child_names: string[] = []
    const dim_names: string[] = []
    Object.values(data.nodes).forEach(n2 => {
      for (const dim in n2.dimensions) {
        if (n2.dimensions[dim].parent_name == n.idNode) {
          if (dim_names.indexOf(dim) === -1) {
            child_names.push(n2.idNode)
            dim_names.push(dim)
          }
        }
      }
      return false
    })
    if (child_names.length === 0) {
      return
    }
    if (child_names.length > 1) {
      set_agregation_node(n.idNode)
      set_is_agregation(false)
      set_show_agregation(true)
    } else {
      desagregation(data, n.idNode, dim_names[0])
    }
  } else {
    const parent_names: string[] = []
    const dim_names: string[] = []
    Object.keys(n.dimensions).forEach(
      dim => {
        if (n.dimensions[dim].parent_name) {
          parent_names.push(n.dimensions[dim].parent_name as string)
          dim_names.push(dim)
        }
      }
    )
    if (parent_names.length === 0) {
      return
    }
    if (parent_names.length > 1) {
      set_agregation_node(n.idNode)
      set_is_agregation(true)
      set_show_agregation(true)
    } else {
      agregation(data, n.idNode, dim_names[0])
    }
  }
  set_data({ ...data })

}

export const textNodeWrap=(d:SankeyNode,data:SankeyData)=>{
    
  const wrap = textwrap()
    .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
    .method('tspans')
  d3.select('#ggg_' + d.idNode + ' text')
    .call(wrap)
  if (!d.x_label || data.show_structure == 'structure') {
    d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
      const width = +d3.select('#' + d.idNode).attr('width')

      if (d.display_style.label_horiz == 'milieu') {
        return width / 2
      } else if (d.display_style.label_horiz == 'droite') {
        return d.display_style.label_vert == 'milieu' ? width : 0
      } else {
        return 0
      }
    })
  }

  d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
    const width = +d3.select('#' + d.idNode).attr('width')
    if (d.x_label) {
      return d.x_label
    } else if (d.display_style.label_horiz == 'milieu') {
      return width / 2
    } else if (d.display_style.label_horiz == 'droite') {
      return width
    } else {
      return 0
    }
  })
  //Nombre de tspan dans la balise text
  const nb_tspan = d3.selectAll('#ggg_' + d.idNode + ' text tspan').nodes().length
  if (d.display_style.label_vert == 'milieu') {
    d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (0.25 - 0.5 * (nb_tspan - 1)) + 'em)')
  } else if (d.display_style.label_vert == 'bas') {
    d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(1em)')
  } else if (d.display_style.label_vert == 'haut') {
    d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (-(nb_tspan - 1)) + 'em)')

  }

}

export const textNodeValue=(d:SankeyNode,data:SankeyData,display_links:{[link_id:string]:SankeyLink},display_nodes:{[nodes_id:string]:SankeyNode})=>{
  let total = 0
      
  if (d.show_value) {
    if (d.outputLinksId.length > 0) {
      for (let i = 0; i < d.outputLinksId.length; i++) {
        const link = display_links[d.outputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          return ''
        }  
        let tmp=getLinkValue(data, link.idLink).value
        tmp=(tmp)?tmp:0
        if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
          total += tmp
        }
      }
    }
    if (total === 0) {
      if (d.inputLinksId.length > 0) {
        for (let i = 0; i < d.inputLinksId.length; i++) {
          const link = display_links[d.inputLinksId[i]]
          if (link === undefined) {
            //alert('Corruption du diagramme')
            return ''
          }
          let tmp=getLinkValue(data, link.idLink).value
          tmp=(tmp)?tmp:0
          if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
            total += tmp
          }
        }
      }
    }
    return total  
  } else {
    return ''
  }
}

export const setNodeHeight = (
  n: SankeyNode,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  selected_tags: TagsCatalog,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
) => {
  const res = compute_total_offsets(inv_scale,n, data, selected_tags, test_link_value)  
  const [total_offset_height_left, total_offset_height_right, total_offset_width_top, total_offset_width_bottom] = res
  let node_size_s_height = Math.max(
    inv_scale(n.node_height), total_offset_height_left, total_offset_height_right
  )  
  let node_size_s_width = Math.max(
    inv_scale(n.node_width), total_offset_width_top, total_offset_width_bottom
  )
  //Hauteur des noeuds
  if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0 || data.show_structure == 'structure') {
    // Hauteur des noeuds
    node_size_s_height = inv_scale(n.node_height)
    node_size_s_width = inv_scale(n.node_width)
  }  
  d3.select('#' + n.idNode).attr('width', scale(node_size_s_width))  
  d3.select('#' + n.idNode).attr('height', scale(node_size_s_height))  
  if (n.tags['Type de noeud'] && n.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[n.tags['Type de noeud'][0]].shape === 'ellipse') {
    d3.select('#' + n.idNode).attr('rx', scale(node_size_s_width / 2))
    d3.select('#' + n.idNode).attr('cx', scale(node_size_s_width / 2))
    d3.select('#' + n.idNode).attr('ry', scale(node_size_s_height / 2))
    d3.select('#' + n.idNode).attr('cy', scale(node_size_s_height / 2))
  }
}


export const node_color = (n: SankeyNode,data:SankeyData) => {
  let colorNode
  if (n.colorParameter === 'groupTag' || data.show_structure === 'structure' ) {
    //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
    //on controle ici qu'il y a bien un favorite tag
    if (n.colorTag !== undefined && n.colorTag !== '') {
      const tagGroup = n.colorTag
      if (n.tags[tagGroup] === undefined) {
        colorNode = 'grey'
        colorNode=(n.colorSustainable)? n.color:colorNode
      } else if (n.tags[tagGroup].length > 0) {  
        if (data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]]) {
          colorNode = data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]].color
        } else {
          colorNode = 'grey'
          colorNode=(n.colorSustainable)? n.color:colorNode
        }
      } else {
        colorNode = 'grey'
      }
    } else {
      colorNode = 'grey'
    }
  }
  if (n.colorParameter === 'local') {
    // Le couleur est définie dans les parametres locaux du noeud
    colorNode = n.color
  }  
  return colorNode
}

export const removeAnimate = () => {
  // Si il y a des .tmp (notamment issus des animations)
  if (d3.selectAll('.tmp').nodes().length > 0) {
    // On remove tous les éléments temporaires
    d3.selectAll('.tmp').remove()
    // Et on supprime tous les styles pour retrouver les valeurs par default qui sont dans attr
    d3.select('#svg').selectAll('.node_shape').style('fill', null)
    d3.select('#svg').selectAll('.link').style('stroke', null)
    d3.select('#svg').selectAll('.arrow').style('fill', null)
    d3.select('#svg').selectAll('.link_value').style('display', null)
    d3.select('#svg').selectAll('.node_text').style('fill', null)
  }
}

const intersection = function (cp1: number[], cp2: number[], e: number[], s: number[]) {
  const dc = [cp1[0] - cp2[0], cp1[1] - cp2[1]],
    dp = [s[0] - e[0], s[1] - e[1]],
    n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0],
    n2 = s[0] * e[1] - s[1] * e[0],
    n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0])
  return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3]
}

const inside = function (p: number[], cp1: number[], cp2: number[]) {
  return (
    (cp2[0] - cp1[0]) * (p[1] - cp1[1]) > (cp2[1] - cp1[1]) * (p[0] - cp1[0])
  )
}
const clip = (subjectPolygon: number[][], clipPolygon: number[][]) => {
  const outputList = JSON.parse(JSON.stringify(subjectPolygon))
  let outputList2 =[]
  let cp1 = JSON.parse(JSON.stringify(clipPolygon[clipPolygon.length - 1]))
  for (const j in clipPolygon) {
    const cp2 = JSON.parse(JSON.stringify(clipPolygon[j]))
    const inputList = JSON.parse(JSON.stringify(outputList))
    outputList2 = []
    let s = JSON.parse(JSON.stringify(inputList[inputList.length - 1])) //last on the input list
    for (const i in inputList) {
      const e2 = inputList[i]
      if (inside(e2, cp1, cp2)) {
        if (!inside(s, cp1, cp2)) {
          outputList2.push(intersection(cp1, cp2, e2, s))
        }
        outputList2.push(e2)
      } else if (inside(s, cp1, cp2)) {
        outputList2.push(intersection(cp1, cp2, e2, s))
      }
      s = e2
    }
    cp1 = cp2
  }
  return outputList2
}
  
export const drawArrows = (
  data: SankeyData,
  n: SankeyNode,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { node_font_size: number; link_font_size: number; filter?: number; filter_label?: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },
  nodeTags: TagsCatalog,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number
) => {
  //Cette version de drawArrows ne calcul plus les formes de morceau de flêche mais utilise l'algorithme de 
  //Sutherland-Hodgman pour couper les morceau de flêche


  Object.values(links).filter(l=>n.inputLinksId.includes(l.idLink)).map(l=>{
  //console.log(l)
    d3.selectAll('.defsArrow marker#arrow_'+l.idLink).remove()
  })


  const res = compute_total_offsets(inv_scale,n, data, nodeTags, test_link_value)
  // const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

  const arr = d3.select('#svg .defsArrow')
  const left_height = res[0] / (data.user_scale / 100)
  const right_height = res[1] / (data.user_scale / 100)
  const top_height = res[2] / (data.user_scale / 100)
  const bottom_height = res[3] / (data.user_scale / 100)

  const arrow_int_left = [[0, 0], [0, left_height], [10, left_height / 2]].map(d1=>d1.map(d2=>d2*10))
  const arrow_int_right = [[10, 0], [10, right_height], [0, right_height / 2]].map(d1=>d1.map(d2=>d2*10))
  const arrow_int_top = [[10, 0], [10, top_height], [0, top_height / 2]].map(d1=>d1.map(d2=>d2*10))
  const arrow_int_bottom = [[0, 0], [0, bottom_height], [10, bottom_height / 2]].map(d1=>d1.map(d2=>d2*10))
  const nb_input_tot = n.inputLinksId.length

  let start_point_left = 0
  let start_point_right = 0
  let start_point_top = 0
  let start_point_bottom = 0

  for (let i = 0; i < nb_input_tot; i++) {
    const l = links[n.inputLinksId[i]]
    if (!data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible) {
      continue
    }
    if (!data.nodes[l.idSource].display && !data.nodes[l.idTarget].display) {
      continue
    }
    const link_value = test_link_value(data,nodes, l)
    if (link_value === undefined || link_value == '') {
      continue
    }

    const source_node = nodes[l.idSource]
    const source_node_x = source_node.position === 'absolute' ? source_node.x : +n.x + +source_node.x
    const source_node_y = source_node.position === 'absolute' ? source_node.y : +n.y + +source_node.y
    const node_x = n.position === 'absolute' ? n.x : +source_node.x + +n.x + +d3.select('#' + source_node.idNode).attr('width')
    const node_y = n.position === 'absolute' ? n.y : +source_node.y + +n.y + +d3.select('#' + source_node.idNode).attr('height')
    let refX = 0
    let orient = 'auto-start-reverse'

    //Épaisseur du flux déssiné selon l'échelle de data
    const thickness_link = scale(Math.max(inv_scale(min_thickness), link_value))

    let clipped = [] as number[][]
    if ((l.orientation === 'hh' || l.orientation === 'vh') && (node_x <= source_node_x && l.recycling || node_x > source_node_x && !l.recycling)) {
      //Si le lien entre à gauche
      const zone_arrow = [[0, start_point_left], [10, start_point_left], [10, start_point_left + thickness_link], [0, start_point_left + thickness_link]].map(d1=>d1.map(d2=>d2*10))
      clipped = clip(JSON.parse(JSON.stringify(arrow_int_left)), zone_arrow)
      clipped.map(d => d[1] = d[1] - start_point_left*10)
      start_point_left += thickness_link
    } else if ((l.orientation === 'hh' || l.orientation === 'vh') && (node_x >= source_node_x && l.recycling || node_x < source_node_x && !l.recycling)) {
      const zone_arrow = [[0, start_point_right], [10, start_point_right], [10, start_point_right + thickness_link], [0, start_point_right + thickness_link]].map(d1=>d1.map(d2=>d2*10))
      clipped = clip(arrow_int_right, zone_arrow)
      clipped.map(d => {
        d[1] = d[1] - start_point_right*10
        return d
      })
      refX = 10
      orient = '0'
      start_point_right += thickness_link
    } else if ((l.orientation === 'vv' || l.orientation === 'hv') && (node_y > source_node_y)) {
      //Si le lien entre en haut
      const zone_arrow = [[0, start_point_top], [10, start_point_top], [10, start_point_top + thickness_link], [0, start_point_top + thickness_link]].map(d1=>d1.map(d2=>d2*10))

      clipped = clip(arrow_int_top, zone_arrow)
      clipped.map(d => d[1] = d[1] - start_point_top*10)
      start_point_top += (thickness_link)
      refX = 100
      orient = '270'
        
    } else if ((l.orientation === 'vv' || l.orientation === 'hv') && (node_y < source_node_y)) {
      //Si le lien entre en bas
      const zone_arrow = [[0, start_point_bottom], [10, start_point_bottom], [10, start_point_bottom + thickness_link], [0, start_point_bottom + thickness_link]].map(d1=>d1.map(d2=>d2*10))
      clipped = clip(JSON.parse(JSON.stringify(arrow_int_bottom)), zone_arrow)
      clipped.map(d => d[1] = d[1] - start_point_bottom*10)
      start_point_bottom += thickness_link

    }

    if (!display_style.filter || link_value >= display_style.filter) {
      const colorArrow=(data.nodes[l.idTarget].shape_visible || data.nodes[l.idTarget].iconName === 'none')?(node_color(data.nodes[l.idTarget] as SankeyNode,data) as string):data.nodes[l.idTarget].iconColor
      const n = JSON.parse(JSON.stringify(clipped))
      const point = d3.line()(n)
      arr.append('marker').attr('id', 'arrow_' + l.idLink)
        .attr('viewBox', [0, 0, thickness_link*10, thickness_link*10])
        .attr('refY', (thickness_link*10) / 2)
        .attr('refX', refX)
        .attr('markerWidth', (thickness_link*10<0.5)?5:2000)
        .attr('markerHeight', 1)
        .attr('orient', orient)
        .append('path')
        .attr('d', point)
        .attr('stroke', 'black')
        .attr('fill', () => {
          return (l.gradient && l.colorParameter==='local') ? colorArrow : link_color(l,data) as string
        })
        .attr('stroke-width', '0px')
        .attr('stroke-opacity', 0.85)
        .attr('opacity', 0.85)

      d3.select('#' + l.idLink)
        .attr('marker-end', () => 'url(#arrow_' + l.idLink + ')')
    }
  }
}

export const eventLabelClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyLabel,data:SankeyData,mode_visualisation:boolean,sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref: InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,multi_selected_label:{current:SankeyLabel[]},set_data:React.Dispatch<React.SetStateAction<SankeyData>>)=>{
  if ((event.ctrlKey || event.metaKey )&& !mode_visualisation) {
    sankeyTooltip.style('opacity', 0)
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
      button_ref.current.click()
    }
    d3.select(d.idLabel+ ' rect').attr('stroke-width',(multi_selected_label.current.includes(d))?3:1)
    if (multi_selected_label.current.includes(d)) {
      multi_selected_label.current.splice(multi_selected_label.current.indexOf(d), 1)
    } else {
      multi_selected_label.current.push(d)
    }

    //set_multi_selected_label(multi_selected_label)
    set_data({ ...data })
    if ( accordion_ref && accordion_ref.current) {
      let index_LL=-1
      //Loop sur le tableau d'item via un for car les HTMLCollection ressemblent à des tableaux mais n'en sont pas (on peut pas faire de map,filter,join ...)
      for (let i = 0; i < accordion_ref.current.children.length; i++) {
        index_LL=(accordion_ref.current.children[i]==(accordion_ref.current.children as HTMLCollection).namedItem('LL'))?i:index_LL
      }
      if(index_LL!=-1){
        (accordion_ref.current.children[index_LL] as HTMLLabelElement).click()
      }
    }
  }
}

export const dragNodeRedrawGradient=(nodes:{ [node_id: string]: SankeyNode },
  link:SankeyLink,
  data:SankeyData
)=>{
  const width_src = +d3.select('#' + link.idSource).attr('width')
  const height_src = +d3.select('#' + link.idSource).attr('height')
  const width_trgt = +d3.select('#' + link.idTarget).attr('width')
  //const height_trgt = +d3.select('#' + link.idTarget).attr('height')


  if (link.orientation == 'hh' || link.orientation == 'hv') {
    d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].x < nodes[link.idTarget].x) {
        d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idSource].x + width_src)
          .attr('y1', '0')
          .attr('x2', nodes[link.idTarget].x)
          .attr('y2', 0)
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }else {
        d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idTarget].x + width_trgt)
          .attr('y1', '0')
          .attr('x2', nodes[link.idSource].x)
          .attr('y2', 0)
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )

    d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].x > nodes[link.idTarget].x) {
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )
  } else if (link.orientation == 'vv' || link.orientation == 'hv') {
    //orientation vert-vert
    d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].y < nodes[link.idTarget].y) {
        d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[link.idSource].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[link.idTarget].y)
  
        return nodes[link.idSource].color
      } else {
        d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[link.idTarget].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[link.idSource].y)

        return nodes[link.idTarget].color
      }
    }
    )
  
    d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].y > nodes[link.idTarget].y) {
        return nodes[link.idSource].color
      } else {
        return nodes[link.idTarget].color
      }
    }
    )
  } else if (link.orientation == 'vh') {

    d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].x < nodes[link.idTarget].x) {
        d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idSource].x + width_src - 10)
          .attr('y1', '0')
          .attr('x2', nodes[link.idTarget].x)
          .attr('y2', 0)
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idTarget].x + width_trgt + 10)
          .attr('y1', '0')
          .attr('x2', nodes[link.idSource].x)
          .attr('y2', 0)
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )

    d3.select('#gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].x > nodes[link.idTarget].x) {
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      } else {
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        if (n.shape_visible || n.iconName === 'none') {
          return n.color
        } else {
          return n.iconColor
        }
      }
    }
    )

  }
}

export const keyHandler = (e: KeyboardEvent,current:boolean,data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},multi_selected_links:{current:SankeyLink[]},
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  set_show_toast:React.Dispatch<React.SetStateAction<boolean>>,
  view:string,
  set_view:React.Dispatch<React.SetStateAction<string>>,
  animate_view_changement:(data_v1:SankeyData,data_v2:SankeyData)=>number,
  nextView : (data: SankeyData, views: { id: string, view_data: SankeyData, nom: string }[], new_view: string)=>void
) => {
  if (current) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && document.activeElement?.tagName!=='INPUT') {
      if (e.key == 'ArrowUp') {
        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
          if (d != undefined) {
            return d.name
          }
        }).includes(f.name)).map(d => {
          if (d.position === 'relative') {
            return
          }
          if (e.shiftKey) {
            d.y = d.y - data.grid_square_size
          } else {
            const n_pos = Math.trunc(d.y / data.grid_square_size)
            d.y = (n_pos * data.grid_square_size == d.y) ? (n_pos - 1) * data.grid_square_size : n_pos * data.grid_square_size
          }
          let y_max = 0
          Object.values(data.nodes).map(d => {
            y_max = (d.y > y_max) ? d.y : y_max
          })
          //Diminue hauteur svg si le noeud est près du bord
          if (y_max < data.height - 100 && data.height - 100 >= window.innerHeight) {
            data.height -= 90
          }
        })
      } else if (e.key == 'ArrowDown') {
        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
          if (d != undefined) {
            return d.name
          }
        }).includes(f.name)).map(d => {
          if (d.position === 'relative') {
            return
          }
          if (e.shiftKey) {
            d.y = d.y + data.grid_square_size
          } else {
            const n_pos = Math.trunc(d.y / data.grid_square_size)
            d.y = (n_pos + 1) * data.grid_square_size
          }
          //Augumente hauteur svg si le noeud est près du bord
          if (d.y > data.height - 100) {
            data.height += 100
          }
        })
      } else if (e.key == 'ArrowLeft') {
        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
          if (d != undefined) {
            return d.name
          }
        }).includes(f.name)).map(d => {
          if (d.position === 'relative') {
            return
          }
          if (e.shiftKey) {
            d.x = d.x - data.grid_square_size
          } else {
            const n_pos = Math.trunc(d.x / data.grid_square_size)
            d.x = (n_pos * data.grid_square_size == d.x) ? (n_pos - 1) * data.grid_square_size : n_pos * data.grid_square_size
          }
          //Diminue largeur svg si le noeud est près du bord
          if (d.x < data.width - 100 && data.width - 100 >= window.innerWidth - 40) {
            data.width -= 50
          }
        })
      } else if (e.key == 'ArrowRight') {
        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
          if (d != undefined) {
            return d.name
          }
        }).includes(f.name)).map(d => {
          if (d.position === 'relative') {
            return
          }
          if (e.shiftKey) {
            d.x = d.x + data.grid_square_size
          } else {
            const n_pos = Math.trunc(d.x / data.grid_square_size)
            d.x = (n_pos + 1) * data.grid_square_size
          }
          //Augumente largeur svg si le noeud est près du bord
          if (d.x > data.width - 100) {
            data.width += 100
          }
        })
      }
      set_data({ ...data })
    } else if (e.key == 'Escape') {
      if ( button_ref && button_ref.current && accordion_ref ) {
        button_ref.current.click()
      }
      //set_show_nav(false)
    } else if (e.key == 's' && (e.ctrlKey||e.metaKey)) {
      e.preventDefault()
      if (current) {
        const new_ind = 'view_' + String(new Date().getTime())
        const copy = JSON.parse(JSON.stringify(data))
        copy.view = []
        data.view.push({
          id: new_ind,
          view_data: copy,
          nom: 'data_' + new_ind,
          details: ''
        })
        set_show_toast(true)
        setTimeout(function () {
          set_show_toast(false)
        }, 3000)
      }
    } else if (e.key == 'z' && (e.ctrlKey||e.metaKey)) {
      e.preventDefault()
      //va chercher les différences sauvegardées dans le localStorage
      // const differences = JSON.parse(localStorage.getItem('diff') as string)
      const differences_str = LZString.decompress(localStorage.getItem('diff') as string) as string
      const differences = (differences_str != '') ? JSON.parse(differences_str) : undefined
      //Si il y a des différences, prend la dernière effectuée
      if (differences !== undefined && differences.length != 0) {
        type difference_type = {
          kind: string,
          path: string[],
          item: {
            rhs: string,
            kind: string
          },
          rhs: string,
          index: string
        }
        const difference = differences.pop() as difference_type[]
        //On crée une copie de data que l'on utilise ensuite pour pouvoir le parcourir et modifié
        //La copie nous permet de reffecter une variable avec d'autre type d'objet
        //Nous ne pouvons pas prendre ddirectement data car c'est un composant régis par des paramètre obligatoire
        //element_to_delete change de type au fur et à mesure qu'il parcours les chemins des différences
        let dt = JSON.parse(JSON.stringify(data))
        //Parcours les dernières modifications à effectuer
        //D : Supprime un objet qui a été ajouté
        //N : Rajoute un objet qui a été supprimé avec les mêmes propriétés
        //A : Annule des moddification faites à des array
        //E : Annule des modifications faites à des propriétées de l'objet
        //path : Tableau contenant le chemin vers la propriété modifié/ajouté/supprimé 
        // Exemple : path=['P1','P2'] --> {P1:{P2:Propriété modifié}}
        difference.map(d => {
          let element_to_delete = dt
          if (d['kind'] == 'D') {
            let cpt = 0
            d.path.map(dd => {
              cpt++
              if (cpt == d['path'].length) {
                delete element_to_delete[dd]
              } else {
                element_to_delete = element_to_delete[dd]
              }
            })
          } else if (d['kind'] == 'N') {
            let cpt = 0
            d.path.map(dd => {
              cpt++
              if (cpt == d['path'].length) {
                element_to_delete[dd] = d['rhs']
              } else {
                element_to_delete = element_to_delete[dd]
              }
            })
          } else if (d['kind'] == 'A') {
            let cpt = 0
            d.path.map(dd => {
              cpt++
              if (cpt == d['path'].length) {
                if (d['item']['kind'] == 'N') {
                  element_to_delete[dd].splice(d['index'], 0, d['item']['rhs'])
                } else if (d['item']['kind'] == 'D') {
                  element_to_delete[dd].splice(d['index'], 1)
                }
              } else {
                element_to_delete = element_to_delete[dd]
              }
            })
          } else if (d['kind'] == 'E') {
            let cpt = 0
            if (d.path !== null && d.path !== undefined) {
              d.path.map(dd => {
                cpt++
                if (cpt == d['path'].length) {
                  element_to_delete[dd] = d['rhs']
                } else {
                  element_to_delete = element_to_delete[dd]
                }
              })
            } else {
              dt = d['rhs']
            }
          }
        })
        data = dt
        localStorage.setItem('diff', JSON.stringify(differences))
        try {
          //Permet d'éviter qu'une vue soit stocké en tant que données dans la naviguateur 
          if (current) {
            localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
          }
        } catch (e) {
          localStorage.clear()
        }
        set_data({ ...data })
      } else {
        console.log('Aucune action en mémoire pour un retour en arrière')
      }
    } else if(e.key=='Delete'){
      if(document.activeElement?.tagName!=='INPUT')
      {   
        multi_selected_nodes.current.forEach(el=>{
          delete_node(data,el)
        })
        multi_selected_links.current.forEach(el=>{
          delete_link(data,el)
        })
        multi_selected_nodes.current=[]
        multi_selected_links.current=[]
        set_data({...data})
      }
    }
  } else {
    //Si nous somme dans une vue les action du clavier sont différentes :
    //-Flêche du haut : Anime la vue vers la vue précédente
    //-Flêche du bas : Anime la vue vers la suivante
    //-P : Parcours les vues suvants tout en les animants
    if (['ArrowUp', 'ArrowDown', 'p'].includes(e.key)) {
      if (e.key == 'ArrowUp') {
        //Cherche la position de la vue sélectionné dans le tableau de vue
        const v1 = data.view.filter(d => d.id == view)[0].id
        let ind = -1
        data.view.map((v, i) => {
          ind = (v.id == v1) ? i : ind
        })
        //si la vue est trouvé alors on lance l'animation entre cette vue et la précédente
        if (ind > 0) {
          const copy = data.view[ind - 1].view_data as SankeyData
          const time_to_set_view = animate_view_changement(data, copy)
          setTimeout(function () {
            set_view(data.view[ind - 1].id)
          }, time_to_set_view)
        }
      } else if (e.key == 'ArrowDown') {
        //Cherche la position de la vue sélectionné dans le tableau de vue
        const v1 = data.view.filter(d => d.id == view)[0].id
        let ind = -1
        data.view.map((v, i) => {
          ind = (v.id == v1) ? i : ind
        })
        //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante
        if (ind < Object.keys(data.view).length - 1) {
          const copy = data.view[ind + 1].view_data as SankeyData
          const time_to_set_view = animate_view_changement(data, copy)
          setTimeout(function () {
            set_view(data.view[ind + 1].id)
          }, time_to_set_view)
        }
      } else if (e.key == 'p') {
        //appelle une fonction qui anime la vue suivante puis s'appelle recursivement jusqu'a ce qu'il n'y ai plus de vue
        nextView(data, (data.view as { id: string, view_data: SankeyData, nom: string }[]), view)
      }
      set_data({ ...data })
    }
  }
}

export const eventOnSankeyZone =(svgSankey:d3.Selection<d3.BaseType,unknown,HTMLElement,unknown>,
  mode_selection:string,
  current:boolean,
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_links:{current:SankeyLink[]},
  first_selected_node:Record<string,unknown>
)=>{
  svgSankey.on('click', ev => {
    if ((!ev.ctrlKey && !ev.metaKey)&& mode_selection == 'n' && current) {
      const new_node1 = default_node(data)
      const listId: number[] = []
      Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
      const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
      new_node1.idNode = 'node' + idNode
      new_node1.name = new_node1.idNode
      if (Object.keys(data.nodes).length < 5) {
        new_node1.x = Object.keys(data.nodes).length * 200 + 200
      } else {
        new_node1.x = 200
      }
      data.nodes[new_node1.idNode] = new_node1    
      // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
      const pos = d3.pointer(event)
      new_node1.x = pos[0]
      new_node1.y = pos[1]
      
      multi_selected_nodes.current=[new_node1]
      
      set_data({...data})
    }
    //  else { ev.preventDefault() }
  })
    .on('mousedown', evt => {
      //si le mode de souris est noeud+liens alors crée le premier noeuds 
      if(d3.select(evt.target).attr('class')!='node node_shape'){    
        if ((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'ln' && current) {
          // isDown = true    
          // creation nouveau noeud
          const new_node1 = default_node(data)
          const listId: number[] = []
          Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
          const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
          new_node1.idNode = 'node' + idNode
          new_node1.name = 'node_tmp'    
          data.nodes[new_node1.idNode] = new_node1
          // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
          const pos = d3.pointer(event)
          new_node1.x = pos[0]
          new_node1.y = pos[1]
          first_selected_node={new_node1}
          set_data({ ...data })
        }
      }     
    })
    .on('mousemove', evt => {
      //si le mode de souris est noeud+liens et que le bouton de la souris est toujours pressé
      // alors crée une droite entre le premier noeud clické et le pointeur du curseur
         
      if ((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'ln' && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
        const pos = d3.pointer(event)    
        const node_keys = Object.keys(data.nodes)
        const last_node = data.nodes[node_keys[node_keys.length - 1]]
        if (d3.selectAll('#svg #path-flux').nodes().length == 0) {
          d3.select('#svg').append('line').attr('id', 'path-flux')
            .attr('x1', last_node.x + last_node.node_width / 2)
            .attr('y1', last_node.y + last_node.node_height / 2)
            .attr('x2', pos[0])
            .attr('y2', pos[1])
            .style('stroke', '#d9af58')
            .style('stroke-width', '2px')
        } else {
          d3.selectAll('#svg #path-flux')
            .attr('x2', pos[0])
            .attr('y2', pos[1])
        }    
      }    
      if (Object.keys(first_selected_node).length != 0) {
        const pos = d3.pointer(event)
        const fsn = (first_selected_node as SankeyNode)    
        if (d3.selectAll('#svg #path-flux').nodes().length == 0) {
          d3.select('#svg').append('line').attr('id', 'path-flux')
            .attr('x1', fsn.x + fsn.node_width / 2)
            .attr('y1', fsn.y + fsn.node_height / 2)
            .attr('x2', pos[0])
            .attr('y2', pos[1])
            .style('stroke', 'red')
            .style('stroke-width', '2px')
        } else {
          d3.selectAll('#svg #path-flux')
            .attr('x2', pos[0])
            .attr('y2', pos[1] - 5)
        }
      }    
      
    })
    .on('mouseup', evt => {
      //si le mode de souris est noeud+liens alors crée un second noeud au relachement 
      //et crée un lien entre le premier noeud crée lors du click et ce dernier     
      if ((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'ln' && current && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && d3.select(evt.target).attr('class')!='node node_shape') {
        // isDown = false
        d3.selectAll('#svg #path-flux').remove()
        Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)    
        //Création second noeud
        const new_node1 = default_node(data)
        const listId: number[] = []
        Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
        const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
        new_node1.idNode = 'node' + idNode
        new_node1.name = new_node1.idNode
        if (Object.keys(data.nodes).length < 5) {
          new_node1.x = Object.keys(data.nodes).length * 200 + 200
        } else {
          new_node1.x = 200
        }
        data.nodes[new_node1.idNode] = new_node1
        // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
        const pos = d3.pointer(event)
        new_node1.x = pos[0]
        new_node1.y = pos[1]    
        //Ajout du lien entre les deux noeuds créés
        const new_link = default_link(data)
        const listIdLink: number[] = []
        Object.keys(data.links).forEach(elt => listIdLink.push(Number(elt.replace('link', ''))))
        const idLink = listIdLink.length > 0 ? Math.max(...listIdLink) + 1 : 0
        new_link.idLink = 'link' + idLink
        data.links[new_link.idLink] = new_link
        const node_keys = Object.keys(data.nodes)
        new_link.idSource = data.nodes[node_keys[node_keys.length - 2]].idNode
        new_link.idTarget = data.nodes[node_keys[node_keys.length - 1]].idNode
        if (new_link.idSource === new_link.idTarget) {
          new_link.recycling = true
        }    
        data.nodes[node_keys[node_keys.length - 2]].outputLinksId.push(new_link.idLink)
        data.nodes[node_keys[node_keys.length - 1]].inputLinksId.push(new_link.idLink)    
        set_data({...data})    
      }else if((!evt.ctrlKey && !evt.metaKey) && mode_selection == 'ln' && current && Object.keys(first_selected_node).length > 0 && d3.select(evt.target).attr('class')!='node node_shape'){
        d3.selectAll('#svg #path-flux').remove()
        const n_link = default_link(data)
        const n_node = default_node(data)
        const listIdN: number[] = []
        Object.keys(data.nodes).forEach(elt => listIdN.push(Number(elt.replace('node', ''))))
        const idNode = listIdN.length > 0 ? Math.max(...listIdN) + 1 : 0
        n_node.idNode = 'node' + idNode
        n_node.name = 'node'+idNode
        data.nodes[n_node.idNode] = n_node
        // console.log(d3.event.pageX - document.getElementById('svg').getBoundingClientRect().x + 10)
        const pos = d3.pointer(event)
        n_node.x = pos[0]
        n_node.y = pos[1]
      
        const { links } = data
        const fsn = (first_selected_node as SankeyNode)
        const listId: number[] = []
        Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))    
        const idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
        n_link.idLink = 'link' + idLink
        links[n_link.idLink] = n_link    
        n_link.idSource = fsn.idNode
        n_link.idTarget = n_node.idNode
        if (n_link.idSource === n_link.idTarget) {
          n_link.recycling = true
        }    
        fsn.outputLinksId.push(n_link.idLink)
        n_node.inputLinksId.push(n_link.idLink)    
        multi_selected_links.current=[n_link]    
        set_data({ ...data })
      }
      
      
    })
}

export const eventOnMouseUpAddNodesAndLink=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode,data:SankeyData,set_data:React.Dispatch<React.SetStateAction<SankeyData>>,first_selected_node:{},multi_selected_links:{current:SankeyLink[]},accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref: InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null)=>{
  if ((!event.ctrlKey && !event.metaKey)&& Object.keys(first_selected_node).length != 0) {
    d3.selectAll('#svg #path-flux').remove()
    const n_link = default_link(data)
    const { links } = data
    const fsn = (first_selected_node as SankeyNode)
    const listId: number[] = []
    Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))

    const idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
    n_link.idLink = 'link' + idLink
    links[n_link.idLink] = n_link

    n_link.idSource = fsn.idNode
    n_link.idTarget = d.idNode
    if (n_link.idSource === n_link.idTarget) {
      n_link.recycling = true
    }

    fsn.outputLinksId.push(n_link.idLink)
    d.inputLinksId.push(n_link.idLink)


    multi_selected_links.current=[n_link]

    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {        
      button_ref.current.click()
    }
    if ( accordion_ref && accordion_ref.current) {
      for ( const child in accordion_ref.current.children) {
        if (accordion_ref.current.children[child].id === 'Flux') {
          (accordion_ref.current.children[0] as HTMLLabelElement).click();
          (accordion_ref.current.children[child] as HTMLLabelElement).click()
        }
      }
    }
    if ( links_accordion_ref && links_accordion_ref.current) {
      (links_accordion_ref.current.children[0] as HTMLLabelElement).click();
      (links_accordion_ref.current.children[1] as HTMLLabelElement).click()
    }

    set_data({ ...data })
  }else if(Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0){
    const tmp=Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0]
    //Ajout du lien entre les deux noeuds créés
    const new_link = default_link(data)
    const listIdLink: number[] = []
    Object.keys(data.links).forEach(elt => listIdLink.push(Number(elt.replace('link', ''))))
    const idLink = listIdLink.length > 0 ? Math.max(...listIdLink) + 1 : 0
    new_link.idLink = 'link' + idLink
    data.links[new_link.idLink] = new_link
    new_link.idSource = tmp.idNode
    new_link.idTarget = d.idNode
    if (new_link.idSource === new_link.idTarget) {
      new_link.recycling = true
    }
    tmp.name='node_'+Object.keys(data.nodes).length
    tmp.outputLinksId.push(new_link.idLink)
    d.inputLinksId.push(new_link.idLink)
    d3.selectAll('#svg #path-flux').remove()

    set_data({...data})
  }
}
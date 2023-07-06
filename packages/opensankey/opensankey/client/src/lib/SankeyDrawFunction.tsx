/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { Requireable } from 'react'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData,  SankeyLinkValue,SankeyDrawCurve,drawArrowsType } from './types'
import { InferProps } from 'prop-types'
import { compute_total_offsets, test_link_value,link_color,default_node,default_link,link_visible,node_color,get_vertical_marfin_for_sankey_zone,node_displayed} from './SankeyUtils'
import { desagregation, agregation } from './SankeyLayout'
import { BaseType } from 'd3'
import {dragLinkCenterHandleEvent,dragLinkShiftHandleEvent,add_drag_link_zone} from './SankeyDrag'

import * as SankeyShapes from './SankeyShapes'
// Function that create the dashed pattern on links

const default_handle_size = 10
const default_horiz_shift = 50
const min_thickness = 2

declare const window: Window &
   typeof globalThis & {
    SankeyToolsStatic: boolean
   }

export const strokeDasharray =(d:SankeyLink,data:SankeyData,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  if (data.show_structure === 'structure') {
    return '5, 5'
  }
  const link_values = getLinkValue(data, d.idLink)
  if (link_values === undefined) {
    return ''
  }
  if (data.show_structure === 'data' ) {
    if (!(link_values as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return '5, 5'
    }
  }

  const display_value = link_values.display_value
  if (display_value.includes('*') && data.show_structure != 'structure' ) {
    return '40, 5'
  }
  const is_free = link_values.extension?.free_mini !== undefined &&
                 data.show_structure !== 'free_value' &&
                 data.show_structure !== 'free_interval'  &&
                 !link_values.extension?.free_visible
  if (d.dashed || is_free || link_values.extension?.display_thin) {
    return '5, 5'
  } else {
    return ''
  }
}

// Function that return the Y position of link label
export const textLinkPosDY=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
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
// Function that return the side of link label
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

// Function that return the link color
// the color depend of if a tag is selected (nodeTAgs,linkTags or dataTags)
export const linkStroke=(l:SankeyLink,data:SankeyData,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  return link_color(l,data,getLinkValue) as string
}
// Function that compute th position of the begining of the link and the position of where it end
export const compute_end_points = (
  source_node: SankeyNode,
  target_node: SankeyNode,
  link: SankeyLink,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  selected_tags: { [tag_group: string]: string[] },
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  if (!links) {
    return [0, 0, 0, 0]
  }
  let link_value = test_link_value(data, nodes, link,getLinkValue)
  if (link_value === undefined) {
    return [0, 0, 0, 0]
  }
  //inv_scale(2) = epaisseur minimum d'un flux
  link_value=(link_value==0 || (+link_value>=inv_scale(2)))?+link_value:inv_scale(2)

  const theLinkValue = getLinkValue(data, link.idLink)
  let is_structure = false
  if (source_node.position !== 'relative' && target_node.position !== 'relative' ) {
    if (data.show_structure === 'data' ) {
      if (!(theLinkValue as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
        is_structure = true
      }
    } else if ( data.show_structure === 'reconciled' ) {
      is_structure = theLinkValue.extension?.free_mini !== undefined //&& +(getLinkValue(data, link.idLink).extension?.free_mini ??false) == 0
    }
    if (theLinkValue.extension?.display_thin) {
      is_structure = true
    }
  }
  if (is_structure) {
    link_value = inv_scale(5)
  }

  let res = compute_total_offsets(inv_scale,source_node, data, selected_tags, test_link_value,undefined,getLinkValue)
  const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res
  res = compute_total_offsets(inv_scale,target_node, data, selected_tags, test_link_value,undefined,getLinkValue)
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
  let node_size_s_height = inv_scale(source_node.node_height)
  let node_size_t_height = inv_scale(target_node.node_height)
  if (data.show_structure !== 'structure') {
    node_size_s_height = Math.max(
      inv_scale(source_node.node_height), s_total_offset_height_left, s_total_offset_height_right
    )
    node_size_t_height = Math.max(
      inv_scale(target_node.node_height), t_total_offset_height_left, t_total_offset_height_right
    )
  }
  res = compute_total_offsets(inv_scale,source_node, data, selected_tags, test_link_value, link,getLinkValue)
  const [s_offset_height_left, s_offset_height_right, s_offset_width_top, s_offset_width_bottom] = res
  res = compute_total_offsets(inv_scale,target_node, data, selected_tags, test_link_value, link,getLinkValue)
  const [t_offset_height_left, t_offset_height_right, t_offset_width_top, t_offset_width_bottom] = res
  const delta_s_width_bottom = Math.max(0, (node_size_s_width - s_total_offset_width_bottom) / 2)
  const delta_s_width_top = Math.max(0, (node_size_s_width - s_total_offset_width_top) / 2)
  const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
  const delta_s_height_left = Math.max(0, (node_size_s_height - s_total_offset_height_left) / 2)
  const delta_t_width_bottom = Math.max(0, (node_size_t_width - t_total_offset_width_bottom) / 2)
  const delta_t_width_top = Math.max(0, (node_size_t_width - t_total_offset_width_top) / 2)
  const delta_t_height_right = Math.max(0, (node_size_t_height - t_total_offset_height_right) / 2)
  const delta_t_height_left = Math.max(0, (node_size_t_height - t_total_offset_height_left) / 2)
  const source_node_x = source_node.position === 'absolute' ? +source_node.x : +target_node.x + +source_node.x - +d3.select(' .opensankey #' + source_node.idNode).attr('width')
  const source_node_y = source_node.position === 'absolute' ? +source_node.y : +target_node.y + +source_node.y - +d3.select(' .opensankey #' + source_node.idNode).attr('height')
  const target_node_x = target_node.position === 'absolute' ? +target_node.x : +source_node.x + +target_node.x + +d3.select(' .opensankey #' + source_node.idNode).attr('width')
  const target_node_y = target_node.position === 'absolute' ? +target_node.y : +source_node.y + +target_node.y + +d3.select(' .opensankey #' + source_node.idNode).attr('height')
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
// Function to place the node on the draw zone
export const nodeTransform=(d:SankeyNode,display_nodes:{[node_id:string]:SankeyNode},display_links:{[ink_id:string]:SankeyLink})=>{
  if (d.position === 'relative') {
    if (d.inputLinksId.length > 0) {
      if ( !display_links[d.inputLinksId[0]]) {
        return 'translate(0,0)'
      }
      const source_node = display_nodes[display_links[d.inputLinksId[0]].idSource]
      if ( !source_node) {
        return 'translate(0,0)'
      }
      const x = source_node.x + d.x
      const y = source_node.y + d.y
      return 'translate(' + x + ', ' + y + ')'
    } else if (d.outputLinksId.length > 0) {
      if ( !display_links[d.outputLinksId[0]]) {
        return 'translate(0,0)'
      }
      const target_node = display_nodes[display_links[d.outputLinksId[0]].idTarget]
      if ( !target_node) {
        return 'translate(0,0)'
      }
      const x = target_node.x + d.x
      const y = target_node.y + d.y
      return 'translate(' + x + ', ' + y + ')'
    }
    return 'translate(' + 10 + ', ' + 10 + ')'
  } else {
    return 'translate(' + d.x + ', ' + d.y + ')'
  }
}
// Function triggerd on click on nodes
// Add or delete visual element to show that the node is selected like a thickker border
export const eventNodeClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  multi_selected_nodes:{current: SankeyNode[] },
  nodes_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  select_node:(n: SankeyNode) => void,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  mode_selection:{current:string}
)=>{
  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) &&  (event.ctrlKey || event.metaKey)) {
    mode_selection.current='s'
    d3.select(' .opensankey #svg').attr('class','mode_selection')
    sankeyTooltip.style('opacity', 0)
    if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
      button_ref.current.click()
    }
    multi_selected_nodes.current = multi_selected_nodes.current.filter(d => (d != null && d.name != ''))
    if (multi_selected_nodes.current.includes(d)) {
      multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(d), 1)
      deselect_visualy_nodes(d)
    } else {
      multi_selected_nodes.current.push(d)
      d3.select(' .opensankey #' + d.idNode).attr('stroke-width',2)
      d3.select(' .opensankey #ggg_' + d.idNode+' .box_width_threshold').attr('visibility','visible')
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
  }else if(!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false) &&  !event.ctrlKey){
    multi_selected_nodes.current = multi_selected_nodes.current.filter(d => (d != null && d.name != ''))
    if (multi_selected_nodes.current.includes(d)) {
      multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(d), 1)
      deselect_visualy_nodes(d)
    } else {
      multi_selected_nodes.current.push(d)
      d3.select(' .opensankey #' + d.idNode).attr('stroke-width',2)
      d3.select(' .opensankey #ggg_' + d.idNode+' .box_width_threshold').attr('visibility','visible')
    }
    set_data({...data})
  }
}

export const eventNodeContextMenu=(ev:React.MouseEvent<HTMLButtonElement>,n:SankeyNode,data:SankeyData,set_agregation_node:React.Dispatch<React.SetStateAction<string>>,set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,set_data:(d:SankeyData)=>void)=>{
  ev.preventDefault()
  if (!n.dimensions) {
    return
  }
  if (ev.altKey) {
    const child_names: string[] = []
    const dim_names: string[] = []
    Object.values(data.nodes).forEach(n2 => {
      for (const dim in n2.dimensions) {
        if ( dim === 'Primaire') {
          if ( data.nodeTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
            child_names.push(n2.idNode)
            dim_names.push(dim)
          }
        } else if (!data.nodeTags['Primaire'].activated && n2.dimensions[dim].parent_name == n.idNode) {
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
        if (dim === 'Primaire') {
          if (data.nodeTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
            parent_names.push(n.idNode)
            dim_names.push(dim)
          }
        } else if (!data.nodeTags['Primaire'].activated && n.dimensions[dim].parent_name) {
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
// Function that wrap node text when the length of the label exceed the limit
export const textNodeWrap=(d:SankeyNode,data:SankeyData)=>{

  const wrap = textwrap()
    .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
    .method('tspans')
  d3.select(' .opensankey #ggg_' + d.idNode + ' text')
    .call(wrap)
  if (!d.x_label || data.show_structure == 'structure') {
    d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
      const width = +d3.select(' .opensankey #' + d.idNode).attr('width')

      if (d.display_style.label_horiz == 'middle') {
        return width / 2
      } else if (d.display_style.label_horiz == 'right') {
        return d.display_style.label_vert == 'middle' ? width : 0
      } else {
        return 0
      }
    })
  }

  d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
    const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
    if (d.x_label) {
      return d.x_label
    } else if (d.display_style.label_horiz == 'middle') {
      return width / 2
    } else if (d.display_style.label_horiz == 'right') {
      return width
    } else {
      return 0
    }
  })
  //Nombre de tspan dans la balise text
  const ts_span_void=(d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text').html().indexOf('></tspan>')>0?1:0)
  const nb_tspan = d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').nodes().length
  if (d.display_style.label_vert == 'middle') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> {
      const size_text=(n as SankeyNode).display_style.font_size
      const shift=(0.25 *(size_text))
      return'translate(0,' +(shift+(nb_tspan-1)*(-size_text/2)) + ')'})
  } else if (d.display_style.label_vert == 'bottom') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> 'translate(0,'+((n as SankeyNode).display_style.font_size*(1-ts_span_void))+')')
  } else if (d.display_style.label_vert == 'top') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> 'translate(0,' + ((n as SankeyNode).display_style.font_size*(-(nb_tspan - 1))) + ')')
  }

}

// Function that compute the height and width of the node
// if the sum of input/output links values is inferior to the min_height/min_width of the node then it return the min_width/height
// if the sum of input/output links values is supperior to the min_height/min_width of the node then it return the maximum between the outputs and inputs link values scaled to the graph
export const setNodeHeight = (
  n: SankeyNode,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  selected_tags: TagsCatalog,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  const res = compute_total_offsets(inv_scale,n, data, selected_tags, test_link_value,undefined,getLinkValue)
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
  d3.select(' .opensankey #' + n.idNode).attr('width', scale(node_size_s_width))
  d3.select(' .opensankey #' + n.idNode).attr('height', scale(node_size_s_height))
  if (n.tags['Type de noeud'] && n.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[n.tags['Type de noeud'][0]].shape === 'ellipse') {
    d3.select(' .opensankey #' + n.idNode).attr('rx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #' + n.idNode).attr('cx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #' + n.idNode).attr('ry', scale(node_size_s_height / 2))
    d3.select(' .opensankey #' + n.idNode).attr('cy', scale(node_size_s_height / 2))
  }
}


// Function that remove animation (shift+click on node)
export const removeAnimate = () => {
  // Si il y a des .tmp (notamment issus des animations)
  if (d3.selectAll(' .opensankey .tmp').nodes().length > 0) {
    // On remove tous les éléments temporaires
    d3.selectAll(' .opensankey .tmp').remove()
    // Et on supprime tous les styles pour retrouver les valeurs par default qui sont dans attr
    d3.select(' .opensankey #svg').selectAll('.node_shape').style('fill', null)
    d3.select(' .opensankey #svg').selectAll('.link').style('stroke', null)
    d3.select(' .opensankey #svg').selectAll('.arrow').style('fill', null)
    d3.select(' .opensankey #svg').selectAll('.link_value').style('display', null)
    d3.select(' .opensankey #svg').selectAll('.node_text').style('fill', null)
  }
}
// Function used for the clipping of link arrow when there is multiple link incoming to a node
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
export const clip = (subjectPolygon: number[][], clipPolygon: number[][]) => {
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

// Function that add marker at the end of links, those marker are arrow
export const drawArrows = (
  n: SankeyNode,
  selected_tags: { [tag_group: string]: string[] },
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  display_style: {filter: number}
) => {
  let cum_v_left = 0
  let cum_h_top = 0
  let cum_v_right = 0
  let cum_h_bottom = 0
  let is_v = true

  // a quoi ca sert ?
  // const tmp = selection.selectAll('path')
  // tmp.remove()
  const res = compute_total_offsets(inv_scale,n, data, selected_tags, test_link_value,undefined,getLinkValue)
  //const res = compute_total_offsets(n, nodes, links, tags_catalog, test_link_value)
  const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

  for (let i = 0; i < n.inputLinksId.length; i++) {
    const l = data.links[n.inputLinksId[i]]
    if (!link_visible(l, data,getLinkValue)) {
      continue
    }
    if(!l.arrow){
      continue
    }
    let link_value = test_link_value(data,data.nodes, l, getLinkValue)
    if (link_value === undefined) {
      continue
    }
    const extension = getLinkValue(data, n.inputLinksId[i]).extension
    if (extension) {
      const display_free_as_dashed = data.show_structure !== 'free_interval' && data.show_structure !== 'free_value'
      if (display_free_as_dashed) {
        // Generale settings: free link value are displayed dashed without text without witdh
        const link_value_is_free = extension?.free_mini !== undefined ??false
        if (link_value_is_free) {
          // Link value is free should be displayed dashed without text
          if (extension?.free_visible) {
            //treated as not free
          } else {
            link_value = inv_scale(5)
          }
        }
      }
      if (extension.display_thin) {
        link_value = inv_scale(5)
      }
    }

    const source_node = data.nodes[l.idSource]
    if (l.orientation === 'hh' || l.orientation === 'vh') {
      is_v = true
    } else {
      is_v = false
    }
    if (!display_style.filter || link_value >= display_style.filter) {
      //selection
      d3.select('#gg_' + l.idLink + ' .arrow').remove() // supression dans le cas du drag notamment
      //setNodeHeight(n, nodes, links, tags_catalog)
      setNodeHeight(n, data.nodes, data.links, data.nodeTags,data,scale,inv_scale,getLinkValue)
      d3.select('#gg_' + l.idLink)
        .append('path')
        .attr('class', 'arrow')
        .attr('id', l.idLink + '_arrow')
        .attr('d', () => {
          let xt
          let yt
          let p5
          if (l.orientation === 'hh' || l.orientation === 'vh') {
            if (n.x <= source_node.x && l.recycling || n.x > source_node.x && !l.recycling) {
              xt = +n.x
              yt = +n.y + +d3.select('#' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return SankeyShapes.draw_arrow(scale(total_height_left) / 2, p5, scale(link_value), scale(cum_v_left), true, false)
            } else {
              xt = +n.x + +d3.select('#' + n.idNode).attr('width')
              yt = +n.y + +d3.select('#' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return SankeyShapes.draw_arrow(scale(total_height_right) / 2, p5, scale(link_value), scale(cum_v_right), true, true)
            }
          } else if (l.orientation === 'vv' || l.orientation === 'hv') {
            if (n.y > source_node.y) {
              xt = +n.x + +d3.select('#' + n.idNode).attr('width') / 2
              yt = +n.y
              p5 = [xt, yt]
              is_v = false
              return SankeyShapes.draw_arrow(scale(total_width_top) / 2, p5, scale(link_value), scale(cum_h_top), false, false)
            } else {
              xt = +n.x + +d3.select('#' + n.idNode).attr('width') / 2
              yt = +n.y + +d3.select('#' + n.idNode).attr('height')
              p5 = [xt, yt]
              is_v = false
              return SankeyShapes.draw_arrow(scale(total_width_bottom) / 2, p5, scale(link_value), scale(cum_h_bottom), false, true)
            }
          }
          return ''
        })
        // .attr('transform', () => 'translate(' + -(n.x) + ', ' + -(n.y) + ')')
        .attr('fill', () => link_color(l, data,getLinkValue)??'none')
        .attr('fill-opacity', () => {
          //const opacity = String(l.display_value[value_index]).includes('[') ? 0.3 : 0.95
          return l.opacity //opacity
        })
    }
    if ((is_v && !l.recycling && n.x > source_node.x ) || (is_v && l.recycling && n.x < source_node.x) ) {
      cum_v_left += link_value
    } else if ((is_v && !l.recycling &&n.x < source_node.x) || (is_v && l.recycling && n.x > source_node.x)) {
      cum_v_right += link_value
    } else if ((!is_v && !l.recycling && n.y > source_node.y) || (!is_v && l.recycling && n.y < source_node.y)) {
      cum_h_top += link_value
    } else if ((!is_v && !l.recycling && n.y < source_node.y) || (!is_v && l.recycling && n.y > source_node.y)) {
      cum_h_bottom += link_value
    }
  }
}



// Function that is triggered when some event occure on the sankey zone like :
// - a simple click on the sankey zone (not on link or node) deselect all elements
// - if we are in mouse mode add node + link : on mousedown add a node, while we dragg the mouse after clicking on the sankey zone a line will appear between the first added node and the mouse
// until the mouse is released wich add a second node and add a link between these 2 nodes
export const eventOnSankeyZone =(svgSankey:d3.Selection<d3.BaseType,unknown,HTMLElement,unknown>,
  mode_selection:{current:string},
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_links:{current:SankeyLink[]},
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  token:boolean,
  set_show_toast_limit_node:(b:boolean)=>void,
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }> | null,

)=>{
  const open_links_menu=()=>{
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
  }

  svgSankey.on('mousedown', evt => {
    //si le mode de souris est noeud+flux alors crée le premier noeuds

    if(d3.select(evt.target).attr('class')!='node node_shape'){

      if ((!evt.ctrlKey && !evt.metaKey) && mode_selection.current == 'ln') {
        if(!token && Object.keys(data.nodes).length>15){
          set_show_toast_limit_node(true)
          setTimeout(function () {
            set_show_toast_limit_node(false)
          }, 3000)
        }else{
          // isDown = true
          // creation nouveau noeud
          const new_node1 = default_node(data)
          const listId: number[] = []
          Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
          const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
          new_node1.idNode = 'node' + idNode
          new_node1.name = 'node_tmp'
          data.nodes[new_node1.idNode] = new_node1
          const pos = d3.pointer(event)
          new_node1.x = pos[0]-(new_node1.node_width/2)
          new_node1.y = pos[1]-(new_node1.node_height/2)
          set_first_selected_node(new_node1)
          set_data({ ...data })
        }
      }
    }
  })
    .on('mousemove', evt => {
      //Empêche lors du drag de la souris d'avoir
      // l'effet sélection de texte sur les labels des éléments de diagramme

      //si le mode de souris est noeud+flux et que le bouton de la souris est toujours pressé
      // alors crée une droite entre le premier noeud clické et le pointeur du curseur
      window.event?.stopPropagation()
      window.event?.preventDefault()

      if(mode_selection.current=='s' && (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 || Object.keys(first_selected_node).length != 0)){
        data.nodes=Object.fromEntries(Object.entries(data.nodes).filter(n=>n[1].name!='node_tmp'))
        set_first_selected_node({})
      }
      if(evt.buttons ==0 && d3.selectAll(' .opensankey #svg #path-flux').nodes().length>0){
        d3.selectAll(' .opensankey #svg #path-flux').remove()
      }
      if( mode_selection.current == 'ln' && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && evt.buttons ==0){
        // Si par erreur on un noeud temporaire est crée mais que l'on est plus en train de presser le bouton de la souris
        // alors corrige en nommant le noeud temporaire et supprimant le ligne de liaison
        set_first_selected_node({})
        Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0].name=Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0].idNode
      }else if ((!evt.ctrlKey && !evt.metaKey) && mode_selection.current == 'ln' && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
        const pos = d3.pointer(event)
        const node_keys = Object.keys(data.nodes)
        const last_node = data.nodes[node_keys[node_keys.length - 1]]
        // Lors du drag de la souris, dessine une ligne entre le noeud de départ et la souris
        if (d3.selectAll(' .opensankey #svg #path-flux').nodes().length == 0) {
          d3.select(' .opensankey #svg').append('line').attr('id', 'path-flux')
            .attr('x1', last_node.x + last_node.node_width / 2)
            .attr('y1', last_node.y + last_node.node_height / 2)
            .attr('x2', pos[0])
            .attr('y2', pos[1])
            .style('stroke', '#d9af58')
            .style('stroke-width', '2px')
        } else {
          d3.selectAll(' .opensankey #svg #path-flux')
            .attr('x2', pos[0])
            .attr('y2', pos[1])
        }
      }
      if (Object.keys(first_selected_node).length != 0) {
        const pos = d3.pointer(event)
        const fsn = (first_selected_node as SankeyNode)
        if (d3.selectAll(' .opensankey #svg #path-flux').nodes().length == 0) {
          // Lors du drag de la souris, dessine une ligne entre le noeud de départ et la souris
          d3.select(' .opensankey #svg').append('line').attr('id', 'path-flux')
            .attr('x1', fsn.x + fsn.node_width / 2)
            .attr('y1', fsn.y + fsn.node_height / 2)
            .attr('x2', pos[0])
            .attr('y2', pos[1])
            .style('stroke', 'red')
            .style('stroke-width', '2px')
        } else {
          d3.selectAll(' .opensankey #svg #path-flux')
            .attr('x2', pos[0]-5)
            .attr('y2', pos[1]-5)
        }
      }

    })
    .on('mouseup', evt => {
      // si le token de connexion est à false alors ne crée pas de second noeud
      //si le mode de souris est noeud+flux alors crée un second noeud au relachement
      //et crée un lien entre le premier noeud crée lors du click et ce dernier
      if(!token && Object.keys(data.nodes).length>15 && mode_selection.current == 'ln'){
        Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)
        d3.selectAll(' .opensankey #svg #path-flux').remove()
        set_first_selected_node({})
        set_show_toast_limit_node(true)
        setTimeout(function () {
          set_show_toast_limit_node(false)
        }, 3000)
      }else if ((!evt.ctrlKey && !evt.metaKey) && mode_selection.current == 'ln' && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && d3.select(evt.target).attr('class')!='node node_shape') {
        // isDown = false
        d3.selectAll(' .opensankey #svg #path-flux').remove()
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
        const pos = d3.pointer(event)
        new_node1.x = pos[0]-(new_node1.node_width/2)
        new_node1.y = pos[1]-(new_node1.node_height/2)
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
        open_links_menu()
        set_first_selected_node({})
        set_data({...data})
      }else if((!evt.ctrlKey && !evt.metaKey) && mode_selection.current == 'ln' && Object.keys(first_selected_node).length > 0 && d3.select(evt.target).attr('class')!='node node_shape'){


        const n_link = default_link(data)
        const n_node = default_node(data)
        const listIdN: number[] = []
        Object.keys(data.nodes).forEach(elt => listIdN.push(Number(elt.replace('node', ''))))
        const idNode = listIdN.length > 0 ? Math.max(...listIdN) + 1 : 0
        n_node.idNode = 'node' + idNode
        n_node.name = 'node'+idNode
        data.nodes[n_node.idNode] = n_node
        const pos = d3.pointer(event)
        n_node.x = pos[0]-(n_node.node_width/2)
        n_node.y = pos[1]-(n_node.node_height/2)

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
        open_links_menu()

        set_first_selected_node({})
        set_data({ ...data })

      }


    })


}

// Similar to eventOnSankeyZone for the addition of 2 nodes + a link, this one trigger when the click is made on a already existing node. It allow us to link 2 already existings nodes,
// or creating a nodes at first click then linking it to a already existing one or the opposite
export const eventOnMouseUpAddNodesAndLink=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyNode,data:SankeyData,set_data:(d:SankeyData)=>void,first_selected_node:object,set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,multi_selected_links:{current:SankeyLink[]},accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,button_ref: InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null)=>{
  if ((!event.ctrlKey && !event.metaKey)&& Object.keys(first_selected_node).length != 0) {

    if(d.name.includes('_tmp')){
      d3.selectAll(' .opensankey #svg #path-flux').remove()

      d.name=d.idNode
    }else{
      d3.selectAll(' .opensankey #svg #path-flux').remove()
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
      if(Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0){
        const tmp=Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0]
        tmp.name='node'+(Object.keys(data.nodes).length-1)
      }
    }

    set_first_selected_node({})
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
    d3.selectAll(' .opensankey #svg #path-flux').remove()

    set_first_selected_node({})
    set_data({...data})
  }
}
// Function to draw nodes with a particular shape
export const addNodesNotToScale=(nodes_not_to_scale:d3.Selection<SVGGElement,SankeyNode,BaseType,unknown>,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

)=>{
  const display_nodes=data.nodes
  const display_links=data.links
  Object.values(display_nodes).filter(n=>n.not_to_scale).map(n=>{
    setNodeHeight(n, display_nodes, display_links, data.nodeTags,data,scale,inv_scale,getLinkValue)
    d3.select(' .opensankey #' + n.idNode)
      .attr('fill-opacity',0)
  })
  // 1
  nodes_not_to_scale.append('rect')
    .classed('node_not_to_scale',true)
    .classed('node_sub_shape', true)
    .attr('x',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }
      return (n.not_to_scale_direction=='left')?width_node-(width_node/50):0
    })
    .attr('y',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }
      return (n.not_to_scale_direction=='top')?(height_node-height_node/50):0})
    .attr('width',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/50})
    .attr('height',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/50:height_node})
    .attr('fill',d => node_color(d as SankeyNode,data) as string)

  // 2
  nodes_not_to_scale.append('rect')
    .classed('node_not_to_scale',true)
    .classed('node_sub_shape', true)
    .attr('x',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      if(n.not_to_scale_direction=='right'){
        return width_node/25
      }else if(n.not_to_scale_direction=='left'){
        return width_node-width_node/10
      }else{
        return 0
      }
    })
    .attr('y',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      if(n.not_to_scale_direction=='bottom'){
        return height_node/25
      }else if(n.not_to_scale_direction=='top'){
        return height_node-height_node/10
      }else{
        return 0
      }
    })
    .attr('height',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/20:height_node})
    .attr('width',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/20})
    .attr('fill',d => node_color(d as SankeyNode,data) as string)

  // 3
  nodes_not_to_scale.append('rect')
    .classed('node_not_to_scale',true)
    .classed('node_sub_shape', true)
    .attr('x',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      if(n.not_to_scale_direction=='right'){
        return width_node/8.5
      }else if(n.not_to_scale_direction=='left'){
        return width_node-width_node/4.3
      }else{
        return 0
      }
    })
    .attr('y',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      if(n.not_to_scale_direction=='bottom'){
        return height_node/8.5
      }else if(n.not_to_scale_direction=='top'){
        return height_node-height_node/4.3
      }else{
        return 0
      }
    })
    .attr('height',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/9:height_node})
    .attr('width',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/9})
    .attr('fill',d => node_color(d as SankeyNode,data) as string)

  // 4
  nodes_not_to_scale.append('rect')
    .classed('node_not_to_scale',true)
    .classed('node_sub_shape', true)
    .attr('x',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      if(n.not_to_scale_direction=='right'){
        return width_node/4
      }else if(n.not_to_scale_direction=='left'){
        return width_node-width_node/2.1
      }else{
        return 0
      }
    })
    .attr('y',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      if(n.not_to_scale_direction=='bottom'){
        return height_node/4
      }else if(n.not_to_scale_direction=='top'){
        return height_node-height_node/2.1
      }else{
        return 0
      }
    })
    .attr('width',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/4.5})
    .attr('height',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/4.5:height_node})
    .attr('fill',d => node_color(d as SankeyNode,data) as string)

  // 5
  nodes_not_to_scale.append('rect')
    .classed('node_not_to_scale',true)
    .classed('node_sub_shape', true)
    .attr('x',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      return (n.not_to_scale_direction=='right')?(width_node/2):0})
    .attr('y',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      return (n.not_to_scale_direction=='bottom')?(height_node/2):0})
    .attr('width',n=>{
      let width_node=0
      if(n.shape=='rect'){
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('width')
      }else{
        width_node=+d3.select(' .opensankey #' + n.idNode).attr('rx')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?width_node:width_node/2})
    .attr('height',n=>{
      let height_node=0
      if(n.shape=='rect'){
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('height')
      }else{
        height_node=+d3.select(' .opensankey #' + n.idNode).attr('ry')*2
      }

      return ['top','bottom'].includes(n.not_to_scale_direction)?height_node/2:height_node})
    .attr('fill',d => node_color(d as SankeyNode,data) as string)
}

export const scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])

export const inv_scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])



export const setNodesHeight = (
  data:SankeyData,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  d: SankeyLink,
  nodeTags: TagsCatalog,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  let source_node = nodes[d.idSource]
  let target_node = nodes[d.idTarget]
  if (target_node === undefined) {
    target_node = nodes[d.idTarget]
  }
  if (source_node === undefined) {
    const filter_idSource = d.idSource
    source_node = nodes[filter_idSource]
  }

  const res_source = compute_total_offsets(inv_scale,source_node, data, nodeTags, test_link_value,undefined,getLinkValue)
  const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res_source
  const res_target = compute_total_offsets(inv_scale,target_node, data, nodeTags, test_link_value,undefined,getLinkValue)
  const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res_target

  let node_size_s_height = Math.max(
    inv_scale(source_node.node_height), s_total_offset_height_left, s_total_offset_height_right
  )
  let node_size_t_height = Math.max(
    inv_scale(target_node.node_height), t_total_offset_height_left, t_total_offset_height_right
  )
  let node_size_s_width = Math.max(
    inv_scale(source_node.node_width), s_total_offset_width_top, s_total_offset_width_bottom
  )
  let node_size_t_width = Math.max(
    inv_scale(target_node.node_width), t_total_offset_width_top, t_total_offset_width_bottom
  )
  // Hauteur des noeuds
  if ((res_source[0] === 0 && res_source[1] === 0 && res_source[2] === 0 && res_source[3] === 0) || data.show_structure == 'structure') {
    node_size_s_height = inv_scale(source_node.node_height)
    node_size_s_width = inv_scale(source_node.node_width)
  }
  if ((res_target[0] === 0 && res_target[1] === 0 && res_target[2] === 0 && res_target[3] === 0) || data.show_structure == 'structure') {
    node_size_t_height = inv_scale(target_node.node_height)
    node_size_t_width = inv_scale(target_node.node_width)
  }

  d3.select(' .opensankey #' + source_node.idNode).attr('width', scale(node_size_s_width))
  d3.select(' .opensankey #' + source_node.idNode).attr('height', scale(node_size_s_height))
  if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[source_node.tags['Type de noeud'][0]].shape === 'ellipse' || !source_node.tags['Type de noeud'] && source_node.shape=='ellipse' ) {
    d3.select(' .opensankey #' + source_node.idNode).attr('rx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #' + source_node.idNode).attr('cx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #' + source_node.idNode).attr('ry', scale(node_size_s_height / 2))
    d3.select(' .opensankey #' + source_node.idNode).attr('cy', scale(node_size_s_height / 2))
  }

  d3.select(' .opensankey #' + target_node.idNode).attr('width', scale(node_size_t_width))
  d3.select(' .opensankey #' + target_node.idNode).attr('height', scale(node_size_t_height))
  if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[target_node.tags['Type de noeud'][0]].shape === 'ellipse'|| !target_node.tags['Type de noeud'] && target_node.shape=='ellipse') {
    d3.select(' .opensankey #' + target_node.idNode).attr('rx', scale(node_size_t_width / 2))
    d3.select(' .opensankey #' + target_node.idNode).attr('cx', scale(node_size_t_width / 2))
    d3.select(' .opensankey #' + target_node.idNode).attr('ry', scale(node_size_t_height / 2))
    d3.select(' .opensankey #' + target_node.idNode).attr('cy', scale(node_size_t_height / 2))
  }
}

// drawLinkText
// Affichage de la valeur du flux dans le link en fonction des options
// Position latérale ; middle, beginning, end et frozen
const drawLinkText = (
  data: SankeyData,
  link: SankeyLink,
  links: { [link_id: string]: SankeyLink },
  link_value: number,
  display_style: { node_font_size: number;  filter: number; filter_label: number },
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  let x_pos = 0
  let y_pos = 0

  // middle : valeur par défault
  // est-ce necessaire car on force l'option middle à la création du flux
  if (!link.label_position) {
    link.label_position = 'middle'
  }

  if (link.label_position === 'beginning') {
    x_pos = xs + (xt - xs) / 10
  } else if (link.label_position === 'middle') {
    const handles = handles_positions(data,links, link, xs, ys, xt, yt,getLinkValue)
    if (handles.length >= 2) {
      const left_xpos = +handles[0].split(',')[0].substring(10)
      const right_xpos = +handles[1].split(',')[0].substring(10)
      x_pos = (left_xpos + right_xpos) / 2 - 5
    } else {
      x_pos = +handles[0].split(',')[0].substring(10)
    }
  } else if (link.label_position === 'end') {//end
    x_pos = xt - (xt - xs) / 10
  }

  if (link.label_position === 'beginning') {
    y_pos = ys - 6
  } else if (link.label_position === 'middle') {
    const handles = handles_positions(data,links, link, xs, ys, xt, yt,getLinkValue)
    if (handles.length >= 2) {
      const left_y_pos_str = handles[0].split(',')[1]
      const left_y_pos = +left_y_pos_str.substring(0, left_y_pos_str.length - 1)
      const right_y_pos_str = handles[1].split(',')[1]
      const right_y_pos = +right_y_pos_str.substring(0, right_y_pos_str.length - 1)
      y_pos = (left_y_pos + right_y_pos) / 2
    } else {
      const y_pos_str = handles[0].split(',')[1]
      y_pos = +y_pos_str.substring(0, y_pos_str.length - 1)
    }
  } else if (link.label_position === 'end') { //end
    y_pos = yt - 6
  }
  if (link.label_position !== 'frozen') {
    link.x_label = x_pos
    link.y_label = y_pos
  }

  scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
  if(link.orthogonal_label_position=='above'){
    y_pos-=scale(link_value)/2
  }else if(link.orthogonal_label_position=='below'){
    y_pos+=scale(link_value)/2
  }

  if (link.label_position === 'frozen' && link.x_label ||
      !link.label_on_path || link.label_on_path === undefined) {

    (d3.select(' .opensankey #' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .attr('x', () => link.label_position === 'frozen' && link.x_label ? link.x_label : x_pos)
    // .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
      .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label : y_pos)
      .text(d => link_text(data, d,getLinkValue ))
      .attr('visibility', link.label_visible ? 'visible' : 'hidden');
    (d3.select(' .opensankey #' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>).attr('dy',()=>{
      if(link.orthogonal_label_position=='above'){
        return '-1em'
      }else if(link.orthogonal_label_position=='below'){
        return '0.3em'
      }
      return '0em'
    })
  } else {
    const positions: { [label_position: string]: string[] } = {
      'frozen': ['50%', 'start'],
      'beginning': ['10px', 'start'],
      'middle': ['50%', 'middle'],
      'end': ['100%', 'end']
    };

    (d3.select(' .opensankey #' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .attr('startOffset', positions[link.label_position][0])
      .attr('text-anchor', positions[link.label_position][1])
      .text(d => link_text(data, d,getLinkValue))
      .attr('visibility', link.label_visible ? 'visible' : 'hidden')
  }
}


// Draw the center handle of each selected links
const add_center_handle=(
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  link:SankeyLink,
  multi_selected_links:{current: SankeyLink[] },
  selected_tags: { [tag_group: string]: string[] },
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  d3.selectAll(' .opensankey #center_handle_' + link.idLink).remove()
  if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)  && !link.recycling ) {

    const source_node=data.nodes[link.idSource]
    const target_node=data.nodes[link.idTarget]
    if (isNaN(source_node.x)) {
      source_node.x = 100
    }
    if (isNaN(source_node.y)) {
      source_node.y = 100
    }
    if (isNaN(target_node.x)) {
      target_node.x = 100
    }
    if (isNaN(target_node.y)) {
      target_node.y = 100
    }
    const res = compute_end_points(source_node, target_node, link, data.nodes, data.links, (data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue)
    const [, ys, xt, ] = res
    let [xs, , , yt] = res
    if (data.show_structure == 'structure') {
      [xs, yt] = [source_node.x + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
    }
    const pos_d=center_handle_position(data,link,xs,ys,xt,yt,getLinkValue)
    d3.select(' .opensankey #gg_' + link.idLink)
      .append('circle')
      .attr('id', 'center_handle_' + link.idLink)
      .attr('class','center_handle')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('r','5')
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('transform',pos_d[0])
      .attr('cursor',(multi_selected_links.current.includes(link) && (link.orientation=='vv' ||link.orientation=='hh'))?'ew-resize':'pointer')
      .call(dragLinkCenterHandleEvent(multi_selected_links,link,data,set_data,selected_tags,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurveFunction,link_text,getLinkValue)
      )
  }

}

// Compute the position of the center handle of links
const center_handle_position=(data:SankeyData,link:SankeyLink,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

)=>{
  const center_handle = 1/2

  const handle_pos = handles_positions(data,data.links, link, xs, ys, xt, yt,getLinkValue)

  if((link.orientation=='hh' || link.orientation=='vv')){
    const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
    const [xt2,yt2]=(handle_pos[1].replace('translate(','').replace(')','').split(','))
    const sx=Number(xs2)
    const sy=Number(ys2)
    const tx=Number(xt2)
    const ty=Number(yt2)
    if (link.orientation === 'hh') {

      const shift_left = 'translate(' + (sx + (tx - sx) * center_handle) + ', ' + (sy + (ty - sy) * center_handle+default_handle_size/2) + ')'
      return [shift_left]
    } else if (link.orientation === 'vv') {

      const shift_left = 'translate(' + (sx + (tx - sx) * center_handle+default_handle_size/2) + ', ' + (sy + (ty - sy) * center_handle) + ')'
      return [shift_left]

    }
  }else{
    const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
    const sx=Number(xs2)
    const sy=Number(ys2)

    const center = 'translate(' + (sx ) + ', ' + (sy) + ')'
    return [center]

  }

  return ['']
}


// Draw the shift handle of each selected links
const add_shift_handle = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  link: SankeyLink,
  multi_selected_links:{current: SankeyLink[] },
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { node_font_size: number;  filter: number; filter_label: number },
  selected_tags: { [tag_group: string]: string[] },
  shift_name: string,
  position: string,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)) {
    d3.select(' .opensankey #gg_' + link.idLink)
      .append('rect')
      .attr('id', shift_name + link.idLink)
      .attr('class','handle')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('width', default_handle_size)
      .attr('height', default_handle_size)
      .attr('cursor',(multi_selected_links.current.includes(link)&& !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?'ew-resize':'pointer')
      .call(dragLinkShiftHandleEvent(multi_selected_links,link,nodes,links,display_style,selected_tags,position,data,set_data,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurveFunction,link_text,getLinkValue)
      )
  }

}

// Function that change the scale of the graph
export const update_scale = (user_scale: number) => {
  scale.domain([0, user_scale])
  inv_scale.range([0, user_scale])
}

// Function that call add_shift_handle for the shift handle of each side of the links
const add_shift_handles = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  link: SankeyLink,
  multi_selected_links:{current: SankeyLink[] },
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { node_font_size: number;  filter: number; filter_label: number },
  selected_tags: { [tag_group: string]: string[] },
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue


) => {
  let shift_handles
  if (link.recycling) {
    shift_handles = [
      ['vert_shift', 'vert'],
      ['left_horiz_shift', 'left'],
      ['right_horiz_shift', 'right']
    ]
  } else {
    shift_handles = [
      ['left_horiz_shift', 'left'],
      ['right_horiz_shift', 'right']
    ]
  }
  for (let i = 0; i < shift_handles.length; i++) {
    const selection = d3.select(' .opensankey #' + shift_handles[i][0] + link.idLink)
    if (selection.empty()) { // if the handle do not exist, create it
      add_shift_handle(data,set_data,
        link, multi_selected_links,nodes, links, display_style, selected_tags, shift_handles[i][0], shift_handles[i][1],link_text,min_width_and_height,getLinkValue
      )
    }
  }
  for (let i = 0; i < shift_handles.length; i++) {
    // Draw handle at the correct position
    d3.select(' .opensankey #' + shift_handles[i][0] + link.idLink)
      .attr('transform', () => {
        const handle_pos = handles_positions(data,links, link, xs, ys, xt, yt,getLinkValue)
        return handle_pos[i] // 0 => vertical handle
      })
  }


}

// DRAW LINK
const drawCurve = (
  data: SankeyData,
  set_data:(d:SankeyData)=>void,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  display_style: { node_font_size: number;  filter: number; filter_label: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },
  nodeTags: TagsCatalog,
  link: SankeyLink,
  error_msg: { text?: string } | undefined,
  multi_selected_links:{current: SankeyLink[] },
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyData)=>number[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:drawArrowsType


): string => {
  if (!link_visible(link, data,getLinkValue)) {
    return ''
  }
  // const link_value = test_link_value(data, nodes, link)
  const link_value = test_link_value(data, nodes, link,getLinkValue)
  const val=getLinkValue(data,link.idLink)
  // if(val.is_percent){
  //   const total=getTotalInputLink(data,data.nodes[link.idSource])
  //   link_value=total*(val.percent/100)
  // }

  const source_node = nodes[link.idSource]
  const target_node = nodes[link.idTarget]
  if (isNaN(source_node.x)) {
    source_node.x = 100
  }
  if (isNaN(source_node.y)) {
    source_node.y = 100
  }
  if (isNaN(target_node.x)) {
    target_node.x = 100
  }
  if (isNaN(target_node.y)) {
    target_node.y = 100
  }

  const inputLinksId = target_node.inputLinksId
  const outputLinksId = source_node.outputLinksId
  if (outputLinksId === undefined || inputLinksId === undefined) {
    return ''
  }

  let [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, nodeTags,data,scale,inv_scale,getLinkValue)
  // handles_positions(links, link, xs, ys, xt, yt)
  if(link.orientation=='vv' ||link.orientation=='hh'){
    add_shift_handles(data,set_data,link,multi_selected_links, nodes, links,display_style, nodeTags, xs, ys, xt, yt,link_text,min_width_and_height,getLinkValue)
    add_drag_link_zone(link,nodes,data,set_data,multi_selected_links,data.nodes,data.links,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurveFunction,link_text,getLinkValue,drawArrows)
  }
  add_center_handle(data,set_data,link,multi_selected_links,nodeTags,link_text,min_width_and_height,getLinkValue)


  if (link_value > display_style.filter_label || val.extension?.free_visible) {
    drawLinkText(data, link, links, link_value, display_style, xs, ys, xt, yt,link_text,getLinkValue)
  }

  if (link.orientation === 'vh' && !link.recycling) {
    if (data.show_structure == 'structure') {
      [xs, yt] = [source_node.x + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
      if (source_node.x > target_node.x) {
        xt = xt + 30
      }
    }
    return SankeyShapes.bezier_link_classic_hv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      link.curvature !== undefined ? link.curvature : 0.5,
      link.curved,
      error_msg
    )
  }
  if (link.orientation === 'hv' && !link.recycling) {
    if (data.show_structure == 'structure') {
      [ys, xt] = [source_node.y + 5, target_node.x + 5]
      if (source_node.y > target_node.y) {
        yt = yt + 30
      }
    }
    return SankeyShapes.bezier_link_classic_vh(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      link.curvature !== undefined ? link.curvature : 0.5,
      link.curved,
      error_msg
    )
  }
  if (link.orientation === 'hh' && !link.recycling) {
    if (data.show_structure == 'structure' ) {
      [ys, yt] = [source_node.y + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
      if (source_node.x > target_node.x) {
        xt = xt + target_node.node_width
      }
    }
    const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
    const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
    return SankeyShapes.bezier_link_classic_vv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      left_horiz_shift,
      right_horiz_shift,
      link.curvature !== undefined ? link.curvature : 0.5,
      false,
      link.curved,
      error_msg
    )
  }
  if (link.orientation === 'vv' && !link.recycling) {
    if (data.show_structure == 'structure' ) {
      [xs, xt] = [source_node.x + source_node.node_width / 2, target_node.x + target_node.node_width / 2]
      if (source_node.y > target_node.y) {
        yt = yt + 30
      }
    }
    const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
    const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
    return SankeyShapes.bezier_link_classic_vv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      left_horiz_shift, right_horiz_shift,
      link.curvature !== undefined ? link.curvature : 0.5,
      true,
      link.curved,
      error_msg
    )
  }
  if (link.recycling) {
    const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
    const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
    const vert_shift = link.vert_shift ? link.vert_shift : 0
    if (data.show_structure == 'structure' ) {
      [ys, yt] = [source_node.y + 5, target_node.y + 5]
    }
    return SankeyShapes.bezier_link_classic_recycling(
      link.idSource, link.idTarget,
      link_value,
      [xs, ys], [xt, yt],
      left_horiz_shift, right_horiz_shift, vert_shift,
      data.show_structure == 'structure' ? false : link.curved,
      link.orientation === 'vv',
      error_msg, scale
    )
  }
  return ''
}

export const drawCurveFunction:SankeyDrawCurve ={curve:drawCurve}

// Returns the x/y position of link_center / left/right/vert_shift
const handles_positions = (
  data:SankeyData,
  links: { [link_id: string]: SankeyLink },
  link: SankeyLink,
  xs: number,
  ys: number,
  xt: number,
  yt: number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  let tmp=getLinkValue(data, link.idLink).value
  tmp=(tmp)?tmp:0

  if (link.orientation === 'hh' && link.recycling) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!link.left_horiz_shift) {
      link.left_horiz_shift = 0
    }
    if (!link.right_horiz_shift) {
      link.right_horiz_shift = 0
    }
    if (!link.vert_shift) {
      link.vert_shift = 0
    }

    if (xt < xs) {
      const x_left = xt - default_horiz_shift + link.left_horiz_shift // x14
      const x_right = xs + default_horiz_shift + link.right_horiz_shift  // x2
      const y_vert = Math.max(ys, yt) + scale(2 * tmp) + link.vert_shift // y8
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
    } else {
      const x_right = xt + default_horiz_shift + link.right_horiz_shift  // x14
      const x_left = xs - default_horiz_shift + link.left_horiz_shift // x2
      const y_vert = Math.max(ys, yt) + scale(2 * tmp) + link.vert_shift // y8
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
    }
  } else if (link.orientation === 'vv' && link.recycling) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!link.left_horiz_shift) {
      link.left_horiz_shift = 0
    }
    if (!link.right_horiz_shift) {
      link.right_horiz_shift = 0
    }
    if (!link.vert_shift) {
      link.vert_shift = 0
    }
    const y_left = yt - default_horiz_shift + link.left_horiz_shift - scale(tmp) // x14
    const y_right = ys + default_horiz_shift + link.right_horiz_shift + scale(tmp) // x2
    const x_vert = Math.max(xs, xt) + scale(2 * tmp) + link.vert_shift // y8
    const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
    const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
    const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
    return [vert, left, right]
  } else if (link.orientation === 'hh') {
    if (link.left_horiz_shift === undefined) {
      link.left_horiz_shift = 0
    }
    if (!link.right_horiz_shift) {
      link.right_horiz_shift = 1
    }
    const shift_left = 'translate(' + (xs + (xt - xs) * link.left_horiz_shift) + ', ' + (ys - default_handle_size / 2) + ')'
    const shift_right = 'translate(' + (xs + (xt - xs) * link.right_horiz_shift) + ', ' + (yt - default_handle_size / 2) + ')'
    return [shift_left, shift_right]
  } else if (link.orientation === 'vv') {
    if (link.left_horiz_shift === undefined) {
      link.left_horiz_shift = 0
    }
    if (!link.right_horiz_shift) {
      link.right_horiz_shift = 1
    }
    const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * link.left_horiz_shift) + ')'
    const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * link.right_horiz_shift) + ')'
    return [shift_left, shift_right]

  } else if (link.orientation === 'vh') {
    const x_center_draw = xs
    const y_center_draw = yt
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  } else if (link.orientation === 'hv') {
    const x_center_draw = xt
    const y_center_draw = ys
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  }
  return ['']
}

// Function that compute the size of the snakey zone,it has minimum height and width but can grow if the node or free labels are too close of the border
export const min_width_and_height = (data:SankeyData) => {
  let height = 0
  let width = 0
  Object.values(data.nodes).filter(n => node_displayed(data,n)).forEach(n => {
    // Get the width of the node's label then proceed to apply a value modification according to the label postion from the node
    let width_label=(d3.select('#ggg_'+n.idNode+ ' text').node() as SVGTextElement)?.getBoundingClientRect().width??0
    if(n.display_style.label_horiz=='left'){
      width_label/=2
    }else if(n.display_style.label_horiz=='middle'){
      width_label=0
    }
    let node_height = 0
    let node_width = 0
    if (!d3.select(' .opensankey #' + n.idNode).empty()) {
      node_height = +d3.select(' .opensankey #' + n.idNode).attr('height')
      node_width = +d3.select(' .opensankey #' + n.idNode).attr('width')
    }

    height = (n.y ) ? Math.max(height, n.y + node_height) : height
    width = (n.x ) ? Math.max(width, n.x+node_width+width_label) : width
  })


  height = height + 100
  width = width + 100
  Object.values(data.links).forEach(l => {
    if (l.recycling) {
      height = (l.vert_shift && node_displayed(data,data.nodes[l.idSource]) && node_displayed(data,data.nodes[l.idTarget]) ) ? Math.max(data.nodes[l.idSource].y + l.vert_shift + 100, data.nodes[l.idTarget].y + l.vert_shift + 100, height) : height
    }
  })

  Object.values(data.links).forEach(l => {
    if (l.recycling) {
      width = (data.nodes[l.idTarget].x && node_displayed(data,data.nodes[l.idTarget]) && l.right_horiz_shift) ? Math.max(width, data.nodes[l.idSource].x + l.right_horiz_shift + default_horiz_shift + 150) : width
    }
  })
  const vertical_shift=  get_vertical_marfin_for_sankey_zone()

  const has_scroll_bar=window.innerHeight-document.getElementsByTagName('html')[0].clientHeight

  return [Math.max(width, window.innerWidth - 60 - has_scroll_bar), Math.max(height, window.innerHeight - 20 - (vertical_shift))]
}

// Function that draw the grid in the background of the sankey zone
// The grid help to align sankey elements and the step of nodes shift when we press arrow  on the keyboard
export const drawGrid = (data:SankeyData) => {

  d3.select(' .opensankey #svg #grid').selectAll('.line').remove()
  if (data.grid_visible && !window.SankeyToolsStatic ) {
    const numberLineH = data.height / data.grid_square_size
    for (let row = 0; row < numberLineH; row++) {
      d3.select(' .opensankey #svg #grid').append('line')
        .attr('class', 'line line-horiz')
        .style('stroke', '#d3d3d3')
        .style('stroke-dasharray', 4)
        .attr('x1', '0')
        .attr('x2', data.width)
        .attr('y1', row * data.grid_square_size)
        .attr('y2', row * data.grid_square_size)

    }

    const numberLineV = data.width / data.grid_square_size

    for (let column = 0; column < numberLineV; column++) {
      d3.select(' .opensankey #svg #grid').append('line')

        .attr('class', 'line line-vert')
        .style('stroke-dasharray', 4)
        .style('stroke', '#d3d3d3')
        .attr('x1', column * data.grid_square_size)
        .attr('x2', column * data.grid_square_size)
        .attr('y1', 0)
        .attr('y2', data.height)
    }
  }

}
export const node_stroke_width=(d:SankeyNode,multi_selected_nodes:{current:SankeyNode[]})=>{
  if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
    return 2
  } else {
    return 0
  }
}

export const textNodeValue=(d:SankeyNode,data:SankeyData,display_links:{[link_id:string]:SankeyLink},display_nodes:{[nodes_id:string]:SankeyNode},
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
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
        if (node_displayed(data,display_nodes[link.idSource]) && node_displayed(data,display_nodes[link.idTarget]) ) {
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
          if (node_displayed(data,display_nodes[link.idSource]) && node_displayed(data,display_nodes[link.idTarget]) ) {
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



export const node_label_posX=(n:SankeyNode)=>{
  const width = +d3.select(' .opensankey #' + n.idNode).attr('width')
  if (n.x_label) {
    return n.x_label
  } else if (n.display_style.label_horiz == 'middle') {
    return width / 2
  } else if (n.display_style.label_horiz == 'left') {
    return 0
  } else if (n.display_style.label_horiz == 'right') {
    return n.display_style.label_vert == 'middle' ? width : 0
  } else {
    return 0
  }
}
export const node_label_posY=(n:SankeyNode,data:SankeyData)=>{
  const height = +d3.select(' .opensankey #' + n.idNode).attr('height')
  if (n.y_label && data.show_structure !== 'structure') {
    return n.y_label
  } else if (n.display_style.label_vert == 'middle') {
    return height / 2
  } else if (n.display_style.label_vert == 'top') {
    return -4
  } else if (n.display_style.label_vert == 'bottom') {
    return height
  } else {
    return 0
  }
}
export const node_value_posX=(n:SankeyNode)=>{
  const width = +d3.select(' .opensankey #' + n.idNode).attr('width')
  // const _text = document.getElementById(n.idNode + '_text')
  // const width_text = (_text) ? _text.getBoundingClientRect().width : 0
  if (n.display_style.label_horiz_valeur == 'middle') {
    return width / 2
  } else if (n.display_style.label_horiz_valeur == 'left') {
    return 0
  } else if (n.display_style.label_horiz_valeur == 'right') {
    return width 
  } else {
    return 0
  }
}

export const node_value_posY=(n:SankeyNode)=>{
  const height = +d3.select(' .opensankey #' + n.idNode).attr('height')
  const _text = document.getElementById(n.idNode + '_text')
  const height_text = (_text) ? _text.getBoundingClientRect().height : 0
  if (n.display_style.label_vert_valeur == 'middle') {
    // return height / 2 + height_text / 2
    return height / 2 + ((node_value_and_text_same_pos(n))?n.display_style.font_size:0)
  } else if (n.display_style.label_vert_valeur == 'top') {
    return 0+ ((node_value_and_text_same_pos(n))?-height_text*1.5:0)
  } else if (n.display_style.label_vert_valeur == 'bottom') {
    return height+((node_value_and_text_same_pos(n))?height_text*1.8:n.display_style.font_size)
  } else {
    return 0
  }
}

const node_value_and_text_same_pos=(node :SankeyNode)=>{
  return (node.label_visible && node.display_style.label_horiz_valeur==node.display_style.label_horiz && node.display_style.label_vert_valeur==node.display_style.label_vert)
}



export const node_label_text=(
  data:SankeyData,
  d:SankeyNode
)=>{
  if ('Type de noeud' in d.tags && d.tags['Type de noeud'][0] == 'échange' && (data as unknown as {trade_label:string}).trade_label) {
    return d.name.split(' - ')[1]
  }
  if (!isNaN(parseInt(d.name.split(' - ')[0]))) {
    return d.name
  }
  // console.log((d.name.split(' - ')[0].replace('-', ' '))[0])
  return d.name.split(' - ')[0]
}

export const value_selected_parameter = (data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  tags_selected:{[k: string]: string},
): SankeyLinkValue => {
  if(multi_selected_links.current.length==0){
    return ({} as SankeyLinkValue)
  }else{
    if ( Object.keys(data.links).length === 0 || !(multi_selected_links.current[0].idLink in data.links) ) {
      let val = JSON.parse(JSON.stringify(Object(multi_selected_links.current[0].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {}
        }
        val = val[tag_selected]
      })
      return val
    }
    let val = JSON.parse(JSON.stringify(Object(data.links[multi_selected_links.current[0].idLink].value)))
    Object.values(tags_selected).map(tag_selected => {
      if (val[tag_selected] === undefined) {
        val[tag_selected] = {'display_value': '',tags:{},value:0}
      }
      val = val[tag_selected]
    })
    return val
  }

}

export const deselect_visualy_links=(d:SankeyLink)=>{
  d3.selectAll(' .opensankey #gg_' + d.idLink + ' rect.handle').attr('fill-opacity', '0')
  d3.selectAll(' .opensankey #gg_' + d.idLink + ' rect.handle').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('fill-opacity', '0')
  
}

export const deselect_visualy_nodes=(n:SankeyNode)=>{
  d3.select(' .opensankey #' + n.idNode).attr('stroke-width',0)
  d3.select(' .opensankey #ggg_' + n.idNode+' .box_width_threshold').attr('visibility','hidden')
}

export const repositionne_sidebar=()=>{
  const has_scrollbar_shift=window.innerHeight-document.getElementsByTagName('html')[0].clientHeight
  const menu_open=d3.select('.offcanvas-body').node()
  d3.select('.sideBar').style('left',(window.innerWidth-40-has_scrollbar_shift-(menu_open?540:0))+'px')  
}
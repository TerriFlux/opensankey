/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { Requireable } from 'react'
import { SankeyNode, SankeyLink,  TagsCatalog, SankeyData,  SankeyLinkValue,SankeyDrawCurve,drawArrowsType } from './types'
import { InferProps } from 'prop-types'
import { compute_total_offsets, test_link_value,link_color,default_node,default_link,link_visible,get_vertical_marfin_for_sankey_zone,node_displayed,return_value_node,return_value_link, assign_link_local_attribute, toPrecision} from './SankeyUtils'
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
  if (return_value_link(data,d,'dashed') || is_free || link_values.extension?.display_thin) {
    return '5, 5'
  } else {
    return ''
  }
}

// Function that return the Y position of link label
export const textLinkPosDY=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  const orth_pos=return_value_link(data,l,'orthogonal_label_position')
  if (orth_pos === 'middle') {
    return '0.3em'
  } else if (orth_pos === 'below') {
    const tmp=getLinkValue(data, l.idLink).value

    return scale((tmp)?tmp:0) / 2 + 10 + 'px'
  } else if (orth_pos === 'above') {
    const tmp=getLinkValue(data, l.idLink).value

    return -scale((tmp)?tmp:0) / 2 + 'px'
  }
  return '0.3em'
}
// Function that return the side of link label
export const textLinkSide=(link:SankeyLink,data:SankeyData)=>{
  const recy=return_value_link(data,link,'recycling')
  const ori=return_value_link(data,link,'label_position')
  const lab_pos=return_value_link(data,link,'orientation')

  if (recy) {
    if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
      return 'left'
    } else if (lab_pos === 'middle' && ori === 'hh') {
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
  // let node_size_s_width = inv_scale((return_value_node(data,source_node,'node_width') as number))
  let node_size_s_width = inv_scale(data.node_width)
  // let node_size_t_width = inv_scale(return_value_node(data,target_node,'node_width') as number)
  let node_size_t_width = inv_scale(data.node_width)
  if (data.show_structure !== 'structure') {
    node_size_s_width = Math.max(
      // inv_scale((return_value_node(data,source_node,'node_width') as number)), s_total_offset_width_bottom, s_total_offset_width_top
      inv_scale(data.node_width), s_total_offset_width_bottom, s_total_offset_width_top
    )
    node_size_t_width = Math.max(
      // inv_scale(return_value_node(data,target_node,'node_width') as number), t_total_offset_width_bottom, t_total_offset_width_top
      inv_scale(data.node_width), t_total_offset_width_bottom, t_total_offset_width_top
    )
  }
  // let node_size_s_height = inv_scale((return_value_node(data,source_node,'node_height') as number))
  let node_size_s_height = inv_scale(data.node_height)
  // let node_size_t_height = inv_scale((return_value_node(data,target_node,'node_height') as number))
  let node_size_t_height = inv_scale(data.node_height)
  if (data.show_structure !== 'structure') {
    node_size_s_height = Math.max(
      // inv_scale((return_value_node(data,source_node,'node_height') as number)), s_total_offset_height_left, s_total_offset_height_right
      inv_scale(data.node_height), s_total_offset_height_left, s_total_offset_height_right
    )
    node_size_t_height = Math.max(
      // inv_scale((return_value_node(data,target_node,'node_height') as number)), t_total_offset_height_left, t_total_offset_height_right
      inv_scale(data.node_height), t_total_offset_height_left, t_total_offset_height_right
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
  const source_node_x = source_node.position === 'absolute' ? +source_node.x : +target_node.x + +source_node.x - +d3.select(' .opensankey #shape_' + source_node.idNode).attr('width')
  const source_node_y = source_node.position === 'absolute' ? +source_node.y : +target_node.y + +source_node.y - +d3.select(' .opensankey #shape_' + source_node.idNode).attr('height')
  const target_node_x = target_node.position === 'absolute' ? +target_node.x : +source_node.x + +target_node.x + +d3.select(' .opensankey #shape_' + source_node.idNode).attr('width')
  const target_node_y = target_node.position === 'absolute' ? +target_node.y : +source_node.y + +target_node.y + +d3.select(' .opensankey #shape_' + source_node.idNode).attr('height')
  let xs = source_node_x
  let ys = source_node_y
  let xt = target_node_x
  let yt = target_node_y
  const tmp=getLinkValue(data, link.idLink).value
  const ori=return_value_link(data,link,'orientation')
  const recy=return_value_link(data,link,'recycling')
  const l_arrow=return_value_link(data,link,'arrow')
  const l_arrow_size=return_value_link(data,link,'arrow_size') as number 

  if (ori === 'hh') {
    //side to side
    if (source_node_x > target_node_x && !recy || source_node_x < target_node_x && recy) {
      // source is after target arrow point leftward. Start is on the left of side of source
      // source -> left
      ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
      // target -> right
      xt += scale(node_size_t_width)
      yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
      if (l_arrow && tmp !== ''  && tmp!=0) {
        xt = xt + 10
      }
    } else {
      // source is before target arrow point rightward. Start is on the right of side of source
      const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
      xs += scale(node_size_s_width)
      ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
      yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
      if (l_arrow && tmp !== ''  && tmp!=0 ) {
        xt = xt - l_arrow_size
      }
    }
  }
  if (ori === 'vv') {
    //side to side
    if (source_node_y > target_node_y) {
      // source is bottom target. Flux goes up
      xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
      //ys = ys
      xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
      yt += scale(node_size_t_height)
      if (l_arrow && tmp !== ''  && tmp!=0) {
        yt = yt + 10
      }
    } else {
      // source is top target. Flux goes down
      xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
      ys += scale(node_size_s_height)
      xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
      if (l_arrow && tmp !== ''  && tmp!=0) {
        yt = yt - l_arrow_size
      }
    }
  }
  if (ori === 'hv') {
    //vertical to horizontal
    if (source_node_x > target_node_x) {
      if (source_node_y > target_node_y) {
        //source is bottom right target. left and up
        ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
        xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
        yt += scale(node_size_t_height)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          yt = yt + 10
        }
      } else {
        //source is top right target. left and down
        ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
        xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          yt = yt - 30
        }
      }
    } else {
      if (source_node_y > target_node_y) {
        //source is bottom left target. right and up
        xs += scale(node_size_s_width)
        ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
        xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
        yt += scale(node_size_t_height)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          yt = yt + 10
        }
      } else {
        //source is top left target. right and down
        xs += scale(node_size_s_width)
        ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
        xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          yt = yt - l_arrow_size
        }
      }
    }
  }
  if (ori === 'vh') {
    //vertical to horizontal
    if (source_node_x > target_node_x) {
      if (source_node_y > target_node_y) {
        //source is bottom right target. up and left
        xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
        xt += scale(node_size_t_width)
        yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          xt += 10
        }
      } else {
        //source is top right target. down and left
        xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
        ys += scale(node_size_s_height)
        xt += scale(node_size_t_width)
        yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          xt += 10
        }
      }
    } else {
      if (source_node_y > target_node_y) {
        //source is bottom left target. Arrow goes left and go down to the top side
        xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
        yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          xt = xt - l_arrow_size
        }
      } else {
        //source is top left target. Arrow goes left and go down to the top side
        xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
        ys += scale(node_size_s_height)
        yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
        if (l_arrow && tmp !== ''  && tmp!=0) {
          xt = xt - l_arrow_size
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
      d3.select(' .opensankey #shape_' + d.idNode).attr('stroke-width',2)
      multi_selected_nodes.current.push(d)
      if(multi_selected_nodes.current.length==1){
        d3.select(' .opensankey #ggg_' + d.idNode+' .box_width_threshold').attr('visibility','visible')
      }
    }
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
      d3.select(' .opensankey #shape_' + d.idNode).attr('stroke-width',2)
      if(multi_selected_nodes.current.length==1){
        d3.select(' .opensankey #ggg_' + d.idNode+' .box_width_threshold').attr('visibility','visible')
      } 
    }
    set_data({...data})
  }
}

export const eventNodeContextMenu=(ev:React.MouseEvent<HTMLButtonElement>,n:SankeyNode,
  set_contextualised_node:(n:SankeyNode)=>void,pointer_pos:{current:number[]},
  multi_selected_nodes:{current: SankeyNode[] },              
)=>{
  ev.preventDefault()
  pointer_pos.current=[ev.pageX,ev.pageY]
  if(multi_selected_nodes.current.includes(n)){
    set_contextualised_node(n)
  }else{
    multi_selected_nodes.current.forEach(nn=>deselect_visualy_nodes(nn))
    multi_selected_nodes.current=[]
    select_visualy_nodes(n)
    multi_selected_nodes.current.push(n)
    set_contextualised_node(n)
  }
}

export const eventLinkContextMenu=(ev:React.MouseEvent<HTMLButtonElement>,l:SankeyLink,set_contextualised_link:(l:SankeyLink)=>void,pointer_pos:{current:number[]},
  data:SankeyData,set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  set_displayed_input_link_value:(s:string)=>void,
  tags_selected:{[k: string]: string},
  set_tags_selected:(o:{[k: string]: string})=>void,
  set_display_link_opacity:(s:string)=>void,

)=>{
  ev.preventDefault()
  pointer_pos.current=[ev.pageX,ev.pageY]
  if(multi_selected_links.current.includes(l)){
    set_contextualised_link(l)
  }else{
    multi_selected_links.current.forEach(ll=>deselect_visualy_links(ll))
    multi_selected_links.current=[]
    select_visualy_links(l)
    multi_selected_links.current.push(l)
    set_contextualised_link(l)
  }
  const link_data_ref=l.idLink
  let new_tags_selected=tags_selected
  if(link_data_ref.includes('_')){
    const index_grp_tag=link_data_ref.split('_')
    // Supprime le première élément du tableau qui ne contient que l'id du flux
    index_grp_tag.shift()
    new_tags_selected={}
    // On fabrique un tags_selected pour récupérer la bonne valeur pour value_selected_parameter
    for(const i in index_grp_tag){
      const key=Object.keys(data.dataTags)[Number(i)]
      new_tags_selected[key]=Object.keys(Object.values(data.dataTags)[Number(i)].tags)[Number(index_grp_tag[i])]
    }
    set_tags_selected(new_tags_selected)
    set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,new_tags_selected).value)
  }else if(Object.values(data.dataTags).length>0){
    // Dans le cas où il n'y a pas de '_' ce qui implique que les datatags sont en mode selection simple
    const tmp=[] as string[]
    Object.values(data.dataTags).forEach(dt=>{
      tmp.push(Object.entries(dt.tags).filter(t=>t[1].selected)[0][0])
    })
    const n_t_s={} as {[x:string]:string}
    Object.keys(data.dataTags).forEach((dt,i)=>{
      n_t_s[dt]=tmp[i]
    })
    set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,n_t_s).value)
  }else{
    set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,new_tags_selected).value)
  }


  set_display_link_opacity(return_value_link(data,l,'opacity') as string)
  set_data({...data})
}
// export const eventNodeContextMenu=(ev:React.MouseEvent<HTMLButtonElement>,n:SankeyNode,data:SankeyData,set_agregation_node:React.Dispatch<React.SetStateAction<string>>,set_is_agregation:React.Dispatch<React.SetStateAction<boolean>>,set_show_agregation:React.Dispatch<React.SetStateAction<boolean>>,set_data:(d:SankeyData)=>void)=>{
//   ev.preventDefault()
//   if (!n.dimensions) {
//     return
//   }
//   if (ev.altKey) {
//     const child_names: string[] = []
//     const dim_names: string[] = []
//     Object.values(data.nodes).forEach(n2 => {
//       for (const dim in n2.dimensions) {
//         if ( dim === 'Primaire') {
//           if ( data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
//             child_names.push(n2.idNode)
//             dim_names.push(dim)
//           }
//         } else if (!data.levelTags['Primaire'].activated && n2.dimensions[dim].parent_name == n.idNode) {
//           if (dim_names.indexOf(dim) === -1) {
//             child_names.push(n2.idNode)
//             dim_names.push(dim)
//           }
//         }
//       }
//       return false
//     })
//     if (child_names.length === 0) {
//       return
//     }
//     if (child_names.length > 1) {
//       set_agregation_node(n.idNode)
//       set_is_agregation(false)
//       set_show_agregation(true)
//     } else {
//       desagregation(data, n.idNode, dim_names[0])
//     }
//   } else {
//     const parent_names: string[] = []
//     const dim_names: string[] = []
//     Object.keys(n.dimensions).forEach(
//       dim => {
//         if (dim === 'Primaire') {
//           if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
//             parent_names.push(n.idNode)
//             dim_names.push(dim)
//           }
//         } else if (!data.levelTags['Primaire'].activated && n.dimensions[dim].parent_name) {
//           parent_names.push(n.dimensions[dim].parent_name as string)
//           dim_names.push(dim)
//         }
//       }
//     )
//     if (parent_names.length === 0) {
//       return
//     }
//     if (parent_names.length > 1) {
//       set_agregation_node(n.idNode)
//       set_is_agregation(true)
//       set_show_agregation(true)
//     } else {
//       agregation(data, n.idNode, dim_names[0])
//     }
//   }
//   set_data({ ...data })

// }
// Function that wrap node text when the length of the label exceed the limit
export const textNodeWrap=(d:SankeyNode,data:SankeyData)=>{
  const wrap = textwrap()
    .bounds({ height: 100, width: ((return_value_node(data,d,'label_box_width') as number) != 0) ? (return_value_node(data,d,'label_box_width') as number) : 110 })
    .method('tspans')
  d3.select(' .opensankey #ggg_' + d.idNode + ' text')
    .call(wrap)
  if (!d.x_label || data.show_structure == 'structure') {
    d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
      const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')

      if (return_value_node(data,d,'label_horiz')  == 'middle') {
        return width / 2
      } else if (return_value_node(data,d,'label_horiz')  == 'right') {
        return return_value_node(data,d,'label_vert')  == 'middle' ? width : 0
      } else {
        return 0
      }
    })
  }

  d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
    const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')
    if (d.x_label) {
      return d.x_label
    } else if (return_value_node(data,d,'label_horiz')  == 'middle') {
      return width / 2
    } else if (return_value_node(data,d,'label_horiz')  == 'right') {
      return width
    } else {
      return 0
    }
  })
  //Nombre de tspan dans la balise text
  const ts_span_void=(d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text').html().indexOf('></tspan>')>0?1:0)
  const nb_tspan = d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').nodes().length
  if (return_value_node(data,d,'label_vert')  == 'middle') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> {
      const size_text=(return_value_node(data,(n as SankeyNode),'font_size') as number)
      const shift=(0.25 *(size_text))
      return'translate(0,' +(shift+(nb_tspan-1)*(-size_text/2)) + ')'})
  } else if (return_value_node(data,d,'label_vert')  == 'bottom') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> 'translate(0,'+((return_value_node(data,(n as SankeyNode),'font_size') as number)*(1-ts_span_void))+')')
  } else if (return_value_node(data,d,'label_vert')  == 'top') {
    d3.select(' .opensankey #ggg_' + d.idNode + ' .node_text').attr('transform',n=> 'translate(0,' + ((return_value_node(data,(n as SankeyNode),'font_size') as number)*(-(nb_tspan - 1))) + ')')
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
    // inv_scale((return_value_node(data,n,'node_height') as number)), total_offset_height_left, total_offset_height_right
    inv_scale(data.node_height), total_offset_height_left, total_offset_height_right
  )
  let node_size_s_width = Math.max(
    // inv_scale((return_value_node(data,n,'node_width') as number)), total_offset_width_top, total_offset_width_bottom
    inv_scale(data.node_width), total_offset_width_top, total_offset_width_bottom
  )
  //Hauteur des noeuds
  if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0 || data.show_structure == 'structure') {
    // Hauteur des noeuds
    // node_size_s_height = inv_scale((return_value_node(data,n,'node_height') as number))
    node_size_s_height = inv_scale(data.node_height)
    // node_size_s_width = inv_scale((return_value_node(data,n,'node_width') as number))
    node_size_s_width = inv_scale(data.node_width)
  }
  d3.select(' .opensankey #shape_' + n.idNode).attr('width', scale(node_size_s_width))
  d3.select(' .opensankey #shape_' + n.idNode).attr('height', scale(node_size_s_height))
  if (n.tags['Type de noeud'] && n.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[n.tags['Type de noeud'][0]].shape === 'ellipse') {
    d3.select(' .opensankey #shape_' + n.idNode).attr('rx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #shape_' + n.idNode).attr('cx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #shape_' + n.idNode).attr('ry', scale(node_size_s_height / 2))
    d3.select(' .opensankey #shape_' + n.idNode).attr('cy', scale(node_size_s_height / 2))
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
    const ori=return_value_link(data,l,'orientation')
    const recy=return_value_link(data,l,'recycling')
    const l_arrow=return_value_link(data,l,'arrow')
    if (!link_visible(l, data,getLinkValue)) {
      continue
    }
    if(!l_arrow){
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
    if (ori === 'hh' || ori === 'vh') {
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
        .attr('id', 'path_'+l.idLink + '_arrow')
        .attr('d', () => {
          let xt
          let yt
          let p5
          const arrow_length=return_value_link(data,l,'arrow_size') as number
          if (ori === 'hh' || ori === 'vh') {
            if (n.x <= source_node.x && recy || n.x > source_node.x && !recy) {
              xt = +n.x
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return SankeyShapes.draw_arrow(scale(total_height_left) / 2, p5, scale(link_value), scale(cum_v_left), true, false,arrow_length)
            } else {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width')
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height') / 2
              p5 = [xt, yt]
              is_v = true
              return SankeyShapes.draw_arrow(scale(total_height_right) / 2, p5, scale(link_value), scale(cum_v_right), true, true,arrow_length)
            }
          } else if (ori === 'vv' || ori === 'hv') {
            if (n.y > source_node.y) {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2
              yt = +n.y
              p5 = [xt, yt]
              is_v = false
              return SankeyShapes.draw_arrow(scale(total_width_top) / 2, p5, scale(link_value), scale(cum_h_top), false, false,arrow_length)
            } else {
              xt = +n.x + +d3.select('#shape_' + n.idNode).attr('width') / 2
              yt = +n.y + +d3.select('#shape_' + n.idNode).attr('height')
              p5 = [xt, yt]
              is_v = false
              return SankeyShapes.draw_arrow(scale(total_width_bottom) / 2, p5, scale(link_value), scale(cum_h_bottom), false, true,arrow_length)
            }
          }
          return ''
        })
        .attr('fill', () => link_color(l, data,getLinkValue)??'none')
        .attr('fill-opacity', () => {
          // return l.opacity //opacity
          return return_value_link(data,l,'opacity')

        })
    }
    if ((is_v && !recy && n.x > source_node.x ) || (is_v && recy && n.x < source_node.x) ) {
      cum_v_left += link_value
    } else if ((is_v && !recy &&n.x < source_node.x) || (is_v && recy && n.x > source_node.x)) {
      cum_v_right += link_value
    } else if ((!is_v && !recy && n.y > source_node.y) || (!is_v && recy && n.y < source_node.y)) {
      cum_h_top += link_value
    } else if ((!is_v && !recy && n.y < source_node.y) || (!is_v && recy && n.y > source_node.y)) {
      cum_h_bottom += link_value
    }
  }
}



export const eventOnSankeyZoneMouseDown=(
  mode_selection:{current:string},
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  token:boolean,
  set_show_toast_limit_node:(b:boolean)=>void,
  evt2:unknown,
  // set_start_point:React.Dispatch<React.SetStateAction<number[]>>
  start_point:{current:number[]},
  closeAllMenuContext:()=>void
)=>{
  closeAllMenuContext()
  const evt=evt2 as {target:string,ctrlKey:boolean,metaKey:boolean,which:number} 
  //si le mode de souris est noeud+flux alors crée le premier noeuds
  if(evt.which==1){

    if(d3.select(evt.target).attr('class')!='node node_shape' && mode_selection.current == 'ln'){

      if ((!evt.ctrlKey && !evt.metaKey) ) {
        if(!token && Object.keys(data.nodes).length>15){
          set_show_toast_limit_node(true)
          setTimeout(function () {
            set_show_toast_limit_node(false)
          }, 3000)
        }else{
          // isDown = true
          // creation nouveau noeud
          const new_node1 = default_node(data)
          let idNode = Object.keys(data.nodes).length
          while (data.nodes['node'+idNode]) {
            idNode = idNode+1
          }
          new_node1.idNode = 'node' + idNode
          new_node1.name = 'node_tmp'
          data.nodes[new_node1.idNode] = new_node1
          const pos = d3.pointer(event)
          // new_node1.x = pos[0]-(return_value_node(data,new_node1,'node_width') as number/2)
          new_node1.x = pos[0]-(data.node_width/2)
          // new_node1.y = pos[1]-(return_value_node(data,new_node1,'node_height') as number/2)
          new_node1.y = pos[1]-(data.node_height/2)
          set_first_selected_node(new_node1)
          set_data({ ...data })
        }
      }
    }else if(mode_selection.current=='s' && !evt.ctrlKey){
      const pos = d3.pointer(evt)
      start_point.current=pos
      d3.select('#svg').append('g').attr('class','selection_zone')
        .append('rect').attr('x',pos[0]).attr('y',pos[1]).attr('width',2).attr('height',2).attr('fill','none').attr('stroke','black').attr('stroke-width','2px').attr('stroke-dasharray','5,5')
    }
  }
 

}
export const eventOnSankeyZoneMouseMove=(
  mode_selection:{current:string},
  data:SankeyData,
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  evt:MouseEvent,
  start_point:{current:number[]}
  
)=>{
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
  if(mode_selection.current=='s' && d3.selectAll('.selection_zone').nodes().length>0){
    // Create change the size of the selection zone according to the mouse
    const pos = d3.pointer(evt)
    const new_x=(pos[0]>start_point.current[0])?start_point.current[0]:pos[0]
    const new_w=(pos[0]>start_point.current[0])?(pos[0]-start_point.current[0]):start_point.current[0]-pos[0]

    const new_y=(pos[1]>start_point.current[1])?start_point.current[1]:pos[1]
    const new_h=(pos[1]>start_point.current[1])?(pos[1]-start_point.current[1]):start_point.current[1]-pos[1]

    d3.select('.selection_zone rect').attr('x',new_x)
    d3.select('.selection_zone rect').attr('y',new_y)
    d3.select('.selection_zone rect').attr('width',Math.abs(new_w))
    d3.select('.selection_zone rect').attr('height',Math.abs(new_h))
  }else if( mode_selection.current == 'ln'){
    if(Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && evt.buttons ==0){
      // Si par erreur on un noeud temporaire est crée mais que l'on est plus en train de presser le bouton de la souris
      // alors corrige en nommant le noeud temporaire et supprimant le ligne de liaison
      set_first_selected_node({})
      Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0].name=Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0].idNode
    }else if ((!evt.ctrlKey && !evt.metaKey) && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
      const pos = d3.pointer(evt)
      const node_keys = Object.keys(data.nodes)
      const last_node = data.nodes[node_keys[node_keys.length - 1]]
      // Lors du drag de la souris, dessine une ligne entre le noeud de départ et la souris
      if (d3.selectAll(' .opensankey #svg #path-flux').nodes().length == 0) {
        d3.select(' .opensankey #svg').append('line').attr('id', 'path-flux')
          // .attr('x1', last_node.x + (return_value_node(data,last_node,'node_width') as number / 2))
          .attr('x1', last_node.x + (data.node_width / 2))
          // .attr('y1', last_node.y + (return_value_node(data,last_node,'node_height') as number / 2))
          .attr('y1', last_node.y + (data.node_height / 2))
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
  }
  
  if (Object.keys(first_selected_node).length != 0) {
    const pos = d3.pointer(event)
    const fsn = (first_selected_node as SankeyNode)
    if (d3.selectAll(' .opensankey #svg #path-flux').nodes().length == 0) {
      // Lors du drag de la souris, dessine une ligne entre le noeud de départ et la souris
      d3.select(' .opensankey #svg').append('line').attr('id', 'path-flux')
        // .attr('x1', fsn.x + (return_value_node(data,fsn,'node_width') as number / 2))
        // .attr('y1', fsn.y + (return_value_node(data,fsn,'node_height') as number / 2))
        .attr('x1', fsn.x + (data.node_width / 2))
        .attr('y1', fsn.y + (data.node_height / 2))
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
}
export const eventOnSankeyZoneMouseUp=(
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
  set_displayed_input_link_value:(s:string)=>void,
  evt:MouseEvent,
  // set_start_point:React.Dispatch<React.SetStateAction<number[]>>,
  start_point:{current:number[]}

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

  const evt_recast=((evt as unknown) as {target:string}).target

  if(mode_selection.current=='s' && d3.selectAll('.selection_zone').nodes().length>0){
    node_visible_on_svg().forEach(k=>deselect_visualy_nodes(data.nodes[k]))

    const z_x=Number(d3.select('.selection_zone rect').attr('x'))
    const z_y=Number(d3.select('.selection_zone rect').attr('y'))
    const z_w=Number(d3.select('.selection_zone rect').attr('width'))
    const z_h=Number(d3.select('.selection_zone rect').attr('height'))
    const node_visible=node_visible_on_svg()
    if(evt.shiftKey){
      Object.values(data.nodes).filter(n=>!multi_selected_nodes.current.includes(n) && node_visible.includes(n.idNode) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h)).forEach(n=>multi_selected_nodes.current.push(n))
    }else{
      multi_selected_nodes.current=Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && n.x>=z_x && n.x<=(z_x+z_w) && n.y>=z_y && n.y<=(z_y+z_h))
    }
    multi_selected_nodes.current.forEach(n=>select_visualy_nodes(n))
    multi_selected_links.current.forEach(l=>deselect_visualy_links(l))
    multi_selected_links.current=[]
    start_point.current=[0,0]
    
    d3.selectAll('.selection_zone').remove()
    set_data(data)
  }
  // si le token de connexion est à false alors ne crée pas de second noeud
  //si le mode de souris est noeud+flux alors crée un second noeud au relachement
  //et crée un lien entre le premier noeud crée lors du click et ce dernier
  if(mode_selection.current=='ln'){
    if(!token && Object.keys(data.nodes).length>15 ){
      Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      set_first_selected_node({})
      set_show_toast_limit_node(true)
      setTimeout(function () {
        set_show_toast_limit_node(false)
      }, 3000)
    }else if ((!evt.ctrlKey && !evt.metaKey) && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && d3.select(evt_recast).attr('class')!='node node_shape') {
      // isDown = false
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)
      //Création second noeud
      const new_node1 = default_node(data)
      let idNode = Object.keys(data.nodes).length
      while (data.nodes['node'+idNode]) {
        idNode = idNode+1
      }
      new_node1.idNode = 'node' + idNode
      new_node1.name = new_node1.idNode
      if (Object.keys(data.nodes).length < 5) {
        new_node1.x = Object.keys(data.nodes).length * 200 + 200
      } else {
        new_node1.x = 200
      }
      data.nodes[new_node1.idNode] = new_node1
      const pos = d3.pointer(evt)
      // new_node1.x = pos[0]-(return_value_node(data,new_node1,'node_width') as number/2)
      // new_node1.y = pos[1]-(return_value_node(data,new_node1,'node_height') as number/2)
      new_node1.x = pos[0]-(data.node_width/2)
      new_node1.y = pos[1]-(data.node_height/2)
      //Ajout du lien entre les deux noeuds créés
      const new_link = default_link(data)
      let idLink = Object.keys(data.links).length
      while (data.links['link'+idLink]) {
        idLink = idLink+1
      }
      new_link.idLink = 'link' + idLink
      data.links[new_link.idLink] = new_link
      const node_keys = Object.keys(data.nodes)
      new_link.idSource = data.nodes[node_keys[node_keys.length - 2]].idNode
      new_link.idTarget = data.nodes[node_keys[node_keys.length - 1]].idNode
      if (new_link.idSource === new_link.idTarget) {
        // new_link.recycling = true
        assign_link_local_attribute(new_link,'recycling',true)
        
      }
      data.nodes[node_keys[node_keys.length - 2]].outputLinksId.push(new_link.idLink)
      data.nodes[node_keys[node_keys.length - 1]].inputLinksId.push(new_link.idLink)
      multi_selected_links.current=[new_link]
      set_displayed_input_link_value('')
      open_links_menu()
      set_first_selected_node({})
      set_data({...data})
    }else if((!evt.ctrlKey && !evt.metaKey) && Object.keys(first_selected_node).length > 0 && d3.select(evt_recast).attr('class')!='node node_shape'){


      const n_link = default_link(data)
      const n_node = default_node(data)
      let idNode = Object.keys(data.nodes).length
      while (data.nodes['node'+idNode]) {
        idNode = idNode+1
      }
      n_node.idNode = 'node' + idNode
      n_node.name = 'node'+idNode
      data.nodes[n_node.idNode] = n_node
      const pos = d3.pointer(event)
      // n_node.x = pos[0]-(return_value_node(data,n_node,'node_width') as number/2)
      // n_node.y = pos[1]-(return_value_node(data,n_node,'node_height') as number/2)
      n_node.x = pos[0]-(data.node_width/2)
      n_node.y = pos[1]-(data.node_height/2)

      const { links } = data
      const fsn = (first_selected_node as SankeyNode)
      let idLink = Object.keys(data.links).length
      while (data.links['link'+idLink]) {
        idLink = idLink+1
      }
      n_link.idLink = 'link' + idLink
      links[n_link.idLink] = n_link
      n_link.idSource = fsn.idNode
      n_link.idTarget = n_node.idNode
      if (n_link.idSource === n_link.idTarget) {
        // n_link.recycling = true
        assign_link_local_attribute(n_link,'recycling',true)

      }
      fsn.outputLinksId.push(n_link.idLink)
      fsn.outputLinksId=sort_outputLinksId_by_YPos(data,fsn)
      n_node.inputLinksId.push(n_link.idLink)
      set_displayed_input_link_value('')
      multi_selected_links.current=[n_link]
      open_links_menu()

      set_first_selected_node({})
      set_data({ ...data })

    }
  }
}

// Sort the outputLinksId tab of the node by using position of output node
export const sort_outputLinksId_by_YPos=(data:SankeyData,n:SankeyNode)=>{
  return n.outputLinksId.filter(idL=>data.nodes[data.links[idL].idTarget].position!=='relative')
    .sort((a,b)=>data.nodes[data.links[a].idTarget].y - data.nodes[data.links[b].idTarget].y 
    )
  
}

// Similar to eventOnSankeyZone for the addition of 2 nodes + a link, this one trigger when the click is made on a already existing node. It allow us to link 2 already existings nodes,
// or creating a nodes at first click then linking it to a already existing one or the opposite
export const eventOnMouseUpAddNodesAndLink=(event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,data:SankeyData,
  set_data:(d:SankeyData)=>void,
  first_selected_node:object,
  set_first_selected_node:React.Dispatch<React.SetStateAction<object>>,
  multi_selected_links:{current:SankeyLink[]},
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  button_ref: InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  set_displayed_input_link_value:(s:string)=>void,
)=>{
  if ((!event.ctrlKey && !event.metaKey)&& Object.keys(first_selected_node).length != 0) {

    if(d.name.includes('_tmp')){
      d3.selectAll(' .opensankey #svg #path-flux').remove()

      d.name=d.idNode
    }else{
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      const n_link = default_link(data)
      const { links } = data
      const fsn = (first_selected_node as SankeyNode)
      let idLink = Object.keys(data.links).length
      while (data.links['link'+idLink]) {
        idLink = idLink+1
      }
      n_link.idLink = 'link' + idLink
      links[n_link.idLink] = n_link

      n_link.idSource = fsn.idNode
      n_link.idTarget = d.idNode
      if (n_link.idSource === n_link.idTarget) {
        // n_link.recycling = true
        assign_link_local_attribute(n_link,'recycling',true)

      }
      fsn.outputLinksId.push(n_link.idLink)
      d.inputLinksId.push(n_link.idLink)

      set_displayed_input_link_value('')
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
    let idLink = Object.keys(data.links).length
    while (data.links['link'+idLink]) {
      idLink = idLink+1
    }
    new_link.idLink = 'link' + idLink
    data.links[new_link.idLink] = new_link
    new_link.idSource = tmp.idNode
    new_link.idTarget = d.idNode
    if (new_link.idSource === new_link.idTarget) {
      // new_link.recycling = true
      assign_link_local_attribute(new_link,'recycling',true)

    }
    tmp.name='node_'+Object.keys(data.nodes).length
    tmp.outputLinksId.push(new_link.idLink)
    d.inputLinksId.push(new_link.idLink)
    d3.selectAll(' .opensankey #svg #path-flux').remove()

    set_first_selected_node({})
    set_data({...data})
  }
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
    // // inv_scale((return_value_node(data,source_node,'node_height') as number)), s_total_offset_height_left, s_total_offset_height_right
    inv_scale(data.node_height), s_total_offset_height_left, s_total_offset_height_right
  )
  let node_size_t_height = Math.max(
    // // inv_scale((return_value_node(data,target_node,'node_height') as number)), t_total_offset_height_left, t_total_offset_height_right
    inv_scale(data.node_height), t_total_offset_height_left, t_total_offset_height_right
  )
  let node_size_s_width = Math.max(
    // inv_scale((return_value_node(data,source_node,'node_width') as number)), s_total_offset_width_top, s_total_offset_width_bottom
    inv_scale(data.node_width), s_total_offset_width_top, s_total_offset_width_bottom
  )
  let node_size_t_width = Math.max(
    // inv_scale(return_value_node(data,target_node,'node_width') as number), t_total_offset_width_top, t_total_offset_width_bottom
    inv_scale(data.node_width), t_total_offset_width_top, t_total_offset_width_bottom
  )
  // Hauteur des noeuds
  if ((res_source[0] === 0 && res_source[1] === 0 && res_source[2] === 0 && res_source[3] === 0) || data.show_structure == 'structure') {
    // node_size_s_height = inv_scale((return_value_node(data,source_node,'node_height') as number))
    node_size_s_height = inv_scale(data.node_height)
    // node_size_s_width = inv_scale((return_value_node(data,source_node,'node_width') as number))
    node_size_s_width = inv_scale(data.node_width)
  }
  if ((res_target[0] === 0 && res_target[1] === 0 && res_target[2] === 0 && res_target[3] === 0) || data.show_structure == 'structure') {
    // node_size_t_height = inv_scale((return_value_node(data,target_node,'node_height') as number))
    // node_size_t_width = inv_scale(return_value_node(data,target_node,'node_width') as number)
    node_size_t_height = inv_scale(data.node_height)
    node_size_t_width = inv_scale(data.node_width)
  }

  d3.select(' .opensankey #shape_' + source_node.idNode).attr('width', scale(node_size_s_width))
  d3.select(' .opensankey #shape_' + source_node.idNode).attr('height', scale(node_size_s_height))
  if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[source_node.tags['Type de noeud'][0]].shape === 'ellipse' || !source_node.tags['Type de noeud'] && return_value_node(data,source_node,'shape')=='ellipse' ) {
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('rx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('cx', scale(node_size_s_width / 2))
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('ry', scale(node_size_s_height / 2))
    d3.select(' .opensankey #shape_' + source_node.idNode).attr('cy', scale(node_size_s_height / 2))
  }

  d3.select(' .opensankey #shape_' + target_node.idNode).attr('width', scale(node_size_t_width))
  d3.select(' .opensankey #shape_' + target_node.idNode).attr('height', scale(node_size_t_height))
  if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[target_node.tags['Type de noeud'][0]].shape === 'ellipse'|| !target_node.tags['Type de noeud'] && return_value_node(data,target_node,'shape')=='ellipse') {
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('rx', scale(node_size_t_width / 2))
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('cx', scale(node_size_t_width / 2))
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('ry', scale(node_size_t_height / 2))
    d3.select(' .opensankey #shape_' + target_node.idNode).attr('cy', scale(node_size_t_height / 2))
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
  const lab_pos=return_value_link(data,link,'label_position') as string
  const orth_lab_pos=return_value_link(data,link,'orthogonal_label_position')
  const label_on_path=return_value_link(data,link,'label_on_path')
  const label_visible=return_value_link(data,link,'label_visible')

  // middle : valeur par défault
  // est-ce necessaire car on force l'option middle à la création du flux
  if (!lab_pos) {
    // lab_pos = 'middle'
    assign_link_local_attribute(link,'label_position','middle')

  }

  if (lab_pos === 'beginning') {
    x_pos = xs + (xt - xs) / 10
  } else if (lab_pos === 'middle') {
    const handles = handles_positions(data,links, link, xs, ys, xt, yt,getLinkValue)
    if (handles.length >= 2) {
      const left_xpos = +handles[0].split(',')[0].substring(10)
      const right_xpos = +handles[1].split(',')[0].substring(10)
      x_pos = (left_xpos + right_xpos) / 2 - 5
    } else {
      x_pos = +handles[0].split(',')[0].substring(10)
    }
  } else if (lab_pos === 'end') {//end
    x_pos = xt - (xt - xs) / 10
  }

  if (lab_pos === 'beginning') {
    y_pos = ys - 6
  } else if (lab_pos === 'middle') {
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
  } else if (lab_pos === 'end') { //end
    y_pos = yt - 6
  }
  if (lab_pos !== 'frozen') {
    link.x_label = x_pos
    link.y_label = y_pos
  }

  scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
  if(orth_lab_pos=='above'){
    y_pos-=scale(link_value)/2
  }else if(orth_lab_pos=='below'){
    y_pos+=scale(link_value)/2
  }

  if (lab_pos === 'frozen' && link.x_label ||
      !label_on_path || label_on_path === undefined) {

    (d3.select(' .opensankey #text_' + link.idLink) as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .attr('x', () => lab_pos === 'frozen' && link.x_label ? link.x_label : x_pos)
    // .attr('y', () => lab_pos === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
      .attr('y', () => lab_pos === 'frozen' && link.y_label ? link.y_label : y_pos)
      .text(d => link_text(data, d,getLinkValue ))
      .attr('visibility', label_visible ? 'visible' : 'hidden');
    (d3.select(' .opensankey #text_' + link.idLink) as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>).attr('dy',()=>{
      if(orth_lab_pos=='above'){
        return '-1em'
      }else if(orth_lab_pos=='below'){
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

    (d3.select(' .opensankey #text_' + link.idLink) as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .attr('startOffset', positions[lab_pos][0])
      .attr('text-anchor', positions[lab_pos][1])
      .text(d => link_text(data, d,getLinkValue))
      .attr('visibility', label_visible ? 'visible' : 'hidden')
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
  const recy=return_value_link(data,link,'recycling') as boolean
  const ori=return_value_link(data,link,'orientation')

  d3.selectAll(' .opensankey #center_handle_' + link.idLink).remove()
  if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)  && !recy ) {

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
      // [xs, yt] = [source_node.x + (return_value_node(data,source_node,'node_height') as number) / 2, target_node.y + (return_value_node(data,target_node,'node_height') as number) / 2]
      [xs, yt] = [source_node.x + (data.node_width) / 2, target_node.y + (data.node_height) / 2]
    }
    const pos_d=center_handle_position(data,link,xs,ys,xt,yt,getLinkValue)
    d3.select(' .opensankey #gg_link_handle_'+link.idLink)
      .append('circle')
      .attr('id', 'center_handle_' + link.idLink)
      .attr('class','center_handle')
      .attr('fill-opacity', (multi_selected_links.current.includes(link) && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false))?1:0)
      .attr('r','5')
      .attr('stroke','black')
      .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
      .attr('fill','black')
      .attr('transform',pos_d[0])
      .attr('cursor',(multi_selected_links.current.includes(link) && (ori=='vv' ||ori=='hh'))?'ew-resize':'pointer')
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
  const ori=return_value_link(data,link,'orientation')

  if((ori=='hh' || ori=='vv')){
    const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
    const [xt2,yt2]=(handle_pos[1].replace('translate(','').replace(')','').split(','))
    const sx=Number(xs2)
    const sy=Number(ys2)
    const tx=Number(xt2)
    const ty=Number(yt2)
    if (ori === 'hh') {

      const shift_left = 'translate(' + (sx + (tx - sx) * center_handle) + ', ' + (sy + (ty - sy) * center_handle+default_handle_size/2) + ')'
      return [shift_left]
    } else if (ori === 'vv') {

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
    d3.select(' .opensankey #gg_link_handle_'+link.idLink)
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
  const recy=return_value_link(data,link,'recycling') as boolean
  d3.select('.opensankey #g_link_handles').append('g').attr('class','gg_link_handles').attr('id','gg_link_handle_'+link.idLink)
  let shift_handles
  if (recy) {
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
  const recy=return_value_link(data,link,'recycling') as boolean
  const curved=return_value_link(data,link,'curved') as boolean
  const ori=return_value_link(data,link,'orientation')
  const curvature=return_value_link(data,link,'curvature') as number
  const l_h_s=return_value_link(data,link,'left_horiz_shift') as number
  const r_h_s=return_value_link(data,link,'right_horiz_shift') as number
  const v_s=return_value_link(data,link,'vert_shift') as number

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
  if(ori=='vv' ||ori=='hh'){
    add_shift_handles(data,set_data,link,multi_selected_links, nodes, links,display_style, nodeTags, xs, ys, xt, yt,link_text,min_width_and_height,getLinkValue)
    add_drag_link_zone(link,nodes,data,set_data,multi_selected_links,data.nodes,data.links,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurveFunction,link_text,getLinkValue,drawArrows)
    add_center_handle(data,set_data,link,multi_selected_links,nodeTags,link_text,min_width_and_height,getLinkValue)
  }


  if (link_value > display_style.filter_label || val.extension?.free_visible) {
    drawLinkText(data, link, links, link_value, display_style, xs, ys, xt, yt,link_text,getLinkValue)
  }

  if (ori === 'vh' && !recy) {
    if (data.show_structure == 'structure') {
      // [xs, yt] = [source_node.x + (return_value_node(data,source_node,'node_height') as number) / 2, target_node.y + (return_value_node(data,target_node,'node_height') as number) / 2]
      [xs, yt] = [source_node.x + (data.node_width) / 2, target_node.y + (data.node_height) / 2]

      if (source_node.x > target_node.x) {
        xt = xt + 30
      }
    }
    return SankeyShapes.bezier_link_classic_hv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      curvature !== undefined ? curvature : 0.5,
      curved,
      error_msg
    )
  }
  if (ori === 'hv' && !recy) {
    if (data.show_structure == 'structure') {
      [ys, xt] = [source_node.y + 5, target_node.x + 5]
      if (source_node.y > target_node.y) {
        yt = yt + 30
      }
    }
    return SankeyShapes.bezier_link_classic_vh(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      curvature !== undefined ? curvature : 0.5,
      curved,
      error_msg
    )
  }
  if (ori === 'hh' && !recy) {
    if (data.show_structure == 'structure' ) {
      // [ys, yt] = [source_node.y + (return_value_node(data,source_node,'node_height') as number) / 2, target_node.y + (return_value_node(data,target_node,'node_height') as number) / 2]
      [ys, yt] = [source_node.y + (data.node_width) / 2, target_node.y + (data.node_height) / 2]
      if (source_node.x > target_node.x) {
        // xt = xt + (return_value_node(data,target_node,'node_width') as number)
        xt = xt + (data.node_width)
      }
    }
    const left_horiz_shift = l_h_s ? l_h_s : 0
    const right_horiz_shift = r_h_s ? r_h_s : 0
    return SankeyShapes.bezier_link_classic_vv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      left_horiz_shift,
      right_horiz_shift,
      curvature !== undefined ? curvature : 0.5,
      false,
      curved,
      error_msg
    )
  }
  if (ori === 'vv' && !recy) {
    if (data.show_structure == 'structure' ) {
      // [xs, xt] = [source_node.x + (return_value_node(data,source_node,'node_width') as number) / 2, target_node.x + (return_value_node(data,target_node,'node_width') as number / 2)]
      [xs, xt] = [source_node.x + (data.node_width) / 2, target_node.x + (data.node_width/ 2)]
      if (source_node.y > target_node.y) {
        yt = yt + 30
      }
    }
    const left_horiz_shift = l_h_s ? l_h_s : 0
    const right_horiz_shift = r_h_s ? r_h_s : 0
    return SankeyShapes.bezier_link_classic_vv(
      link.idSource, link.idTarget,
      [xs, ys], [xt, yt],
      left_horiz_shift, right_horiz_shift,
      curvature !== undefined ? curvature : 0.5,
      true,
      curved,
      error_msg
    )
  }
  if (recy) {
    const left_horiz_shift = l_h_s ? l_h_s : 0
    const right_horiz_shift = r_h_s ? r_h_s : 0
    const vert_shift = v_s ? v_s : 0
    if (data.show_structure == 'structure' ) {
      [ys, yt] = [source_node.y + 5, target_node.y + 5]
    }
    return SankeyShapes.bezier_link_classic_recycling(
      link.idSource, link.idTarget,
      link_value,
      [xs, ys], [xt, yt],
      left_horiz_shift, right_horiz_shift, vert_shift,
      data.show_structure == 'structure' ? false : curved,
      ori === 'vv',
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
  const recy=return_value_link(data,link,'recycling') as boolean
  const ori=return_value_link(data,link,'orientation')
  const l_h_s=return_value_link(data,link,'left_horiz_shift') as number
  const r_h_s=return_value_link(data,link,'right_horiz_shift') as number
  const v_s=return_value_link(data,link,'vert_shift') as number

  if (ori === 'hh' && recy) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!l_h_s) {
      assign_link_local_attribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      assign_link_local_attribute(link,'right_horiz_shift',0)
    }
    if (!v_s) {
      assign_link_local_attribute(link,'vert_shift',0)

    }
    const thick=linkStrokeWidth(link,data,scale,inv_scale,min_thickness,data.nodes,getLinkValue)
    const thickness=(thick === '1px')?1:thick
    if (xt < xs) {
      const x_left = xt - default_horiz_shift + l_h_s - (thickness) // x14
      const x_right = xs + default_horiz_shift + r_h_s  + (thickness) // x2
      const y_vert = Math.max(ys, yt) + scale(2 * tmp) + v_s // y8
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left - (default_handle_size / 2) ) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right + (default_handle_size / 2) ) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
    } else {
      const x_right = xt + default_horiz_shift + r_h_s  + (thickness)// x14
      const x_left = xs - default_horiz_shift + l_h_s - (thickness) // x2
      const y_vert = Math.max(ys, yt) + scale(2 * tmp) + v_s // y8
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left ) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right ) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
    }
  } else if (ori === 'vv' && recy) {
    // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
    if (!l_h_s) {
      assign_link_local_attribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      assign_link_local_attribute(link,'right_horiz_shift',0)
    }
    if (!v_s) {
      assign_link_local_attribute(link,'vert_shift',0)
    }
    const y_left = yt - default_horiz_shift + l_h_s - scale(tmp) // x14
    const y_right = ys + default_horiz_shift + r_h_s + scale(tmp) // x2
    const x_vert = Math.max(xs, xt) + scale(2 * tmp) + v_s // y8
    const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
    const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
    const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
    return [vert, left, right]
  } else if (ori === 'hh') {
    if (l_h_s === undefined) {
      assign_link_local_attribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      assign_link_local_attribute(link,'right_horiz_shift',1)
    }
    const shift_left = 'translate(' + (xs + (xt - xs) * l_h_s) + ', ' + (ys - default_handle_size / 2) + ')'
    const shift_right = 'translate(' + (xs + (xt - xs) * r_h_s) + ', ' + (yt - default_handle_size / 2) + ')'
    return [shift_left, shift_right]
  } else if (ori === 'vv') {
    if (l_h_s === undefined) {
      assign_link_local_attribute(link,'left_horiz_shift',0)
    }
    if (!r_h_s) {
      assign_link_local_attribute(link,'right_horiz_shift',1)
    }
    const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * l_h_s) + ')'
    const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * r_h_s) + ')'
    return [shift_left, shift_right]

  } else if (ori === 'vh') {
    const x_center_draw = xs
    const y_center_draw = yt
    return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
  } else if (ori === 'hv') {
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
    if((return_value_node(data,n,'label_horiz') as string)=='left'){
      width_label/=2
    }else if((return_value_node(data,n,'label_horiz') as string)=='middle'){
      width_label=0
    }
    let node_height = 0
    let node_width = 0
    if (!d3.select(' .opensankey #shape_' + n.idNode).empty()) {
      node_height = +d3.select(' .opensankey #shape_' + n.idNode).attr('height')
      node_width = +d3.select(' .opensankey #shape_' + n.idNode).attr('width')
    }

    height = (n.y ) ? Math.max(height, n.y + node_height) : height
    width = (n.x ) ? Math.max(width, n.x+node_width+width_label) : width
  })


  height = height + 100
  width = width + 100
  Object.values(data.links).forEach(l => {
    const recy=return_value_link(data,l,'recycling') as boolean
    if (recy) {
      const v_s=return_value_link(data,l,'vert_shift') as number
      const r_h_s=return_value_link(data,l,'right_horiz_shift') as number
      height = (v_s && node_displayed(data,data.nodes[l.idSource]) && node_displayed(data,data.nodes[l.idTarget]) ) ? Math.max(data.nodes[l.idSource].y + v_s + 100, data.nodes[l.idTarget].y + v_s + 100, height) : height
      width = (data.nodes[l.idTarget].x && node_displayed(data,data.nodes[l.idTarget]) && r_h_s) ? Math.max(width, data.nodes[l.idSource].x + r_h_s + default_horiz_shift + 150) : width
    }
  })

  // Object.values(data.links).forEach(l => {
  //   if (l.recycling) {
  //     width = (data.nodes[l.idTarget].x && node_displayed(data,data.nodes[l.idTarget]) && l.right_horiz_shift) ? Math.max(width, data.nodes[l.idSource].x + l.right_horiz_shift + default_horiz_shift + 150) : width
  //   }
  // })
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
  const node_visible=node_visible_on_svg()
  if (return_value_node(data,d,'show_value')) {
    let scientific_precision = 0
    if (d.outputLinksId.length > 0) {
      for (let i = 0; i < d.outputLinksId.length; i++) {
        const link = display_links[d.outputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          return ''
        }
        if (scientific_precision === 0 && return_value_link(data,link,'to_precision')) {
          scientific_precision = return_value_link(data,link,'scientific_precision') as number
        }
        let tmp=getLinkValue(data, link.idLink).value
        tmp=(tmp)?tmp:0
        if (node_visible.includes(link.idSource) && node_visible.includes(link.idTarget) ) {
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
          if (scientific_precision === 0 && return_value_link(data,link,'to_precision')) {
            scientific_precision = return_value_link(data,link,'scientific_precision') as number
          }
          let tmp=getLinkValue(data, link.idLink).value
          tmp=(tmp)?tmp:0
          if (node_visible.includes(link.idSource) && node_visible.includes(link.idTarget) ) {
            total += tmp
          }
        }
      }
    }
    if (scientific_precision !==0) {
      return toPrecision(total,scientific_precision)
    }
    return total
  } else {
    return ''
  }
}



export const node_label_posX=(data:SankeyData,n:SankeyNode)=>{
  if (d3.select(' .opensankey #shape_' + n.idNode).empty()) {
    return 0
  }
  const width = +d3.select(' .opensankey #shape_' + n.idNode).attr('width')
  if (n.x_label) {
    return n.x_label
  } else if ((return_value_node(data,n,'label_horiz') as string) == 'middle') {
    return width / 2
  } else if ((return_value_node(data,n,'label_horiz') as string) == 'left') {
    return 0
  } else if ((return_value_node(data,n,'label_horiz') as string) == 'right') {
    return (return_value_node(data,n,'label_vert') as string) == 'middle' ? width : 0
  } else {
    return 0
  }
}
export const node_label_posY=(n:SankeyNode,data:SankeyData)=>{
  if (d3.select(' .opensankey #shape_' + n.idNode).empty()) {
    return 0
  }
  const height = +d3.select(' .opensankey #shape_' + n.idNode).attr('height')
  if (n.y_label && data.show_structure !== 'structure') {
    return n.y_label
  } else if ((return_value_node(data,n,'label_vert') as string) == 'middle') {
    return height / 2
  } else if ((return_value_node(data,n,'label_vert') as string) == 'top') {
    return -4
  } else if ((return_value_node(data,n,'label_vert') as string) == 'bottom') {
    return height
  } else {
    return 0
  }
}
export const node_value_posX=(data:SankeyData,n:SankeyNode)=>{
  const width = +d3.select(' .opensankey #shape_' + n.idNode).attr('width')
  const val=(return_value_node(data,n,'label_horiz_valeur') as string)
  if (val== 'middle') {
    return width / 2
  } else if (val == 'left') {
    return 0
  } else if (val == 'right') {
    return width 
  } else {
    return 0
  }
}

export const node_value_posY=(data:SankeyData,n:SankeyNode)=>{
  const height = +d3.select(' .opensankey #shape_' + n.idNode).attr('height')
  const _text = document.getElementById('text_'+n.idNode)
  const height_text = (_text) ? _text.getBoundingClientRect().height : 0
  const val=(return_value_node(data,n,'label_vert_valeur') as string)
  const val_font_size=(return_value_node(data,n,'font_size') as number)
  const is_same_pos=node_value_and_text_same_pos(data,n)
  if (val == 'middle') {
    // return height / 2 + height_text / 2
    return height / 2 + ((is_same_pos)?val_font_size:0)
  } else if (val == 'top') {
    return 0+ ((is_same_pos)?-height_text*1.5:0)
  } else if (val == 'bottom') {
    return height+((is_same_pos)?height_text*1.8:val_font_size)
  } else {
    return 0
  }
}

const node_value_and_text_same_pos=(data:SankeyData,node :SankeyNode)=>{
  const val_visible=(return_value_node(data,node,'label_visible') as number)
  const val_l_h_v=(return_value_node(data,node,'label_horiz_valeur') as string)
  const val_l_h=(return_value_node(data,node,'label_horiz') as string)
  const val_l_v_v=(return_value_node(data,node,'label_vert_valeur') as string)
  const val_l_v=(return_value_node(data,node,'label_vert') as string)

  return (val_visible && val_l_h_v==val_l_h && val_l_v_v==val_l_v)
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
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' rect.handle').attr('fill-opacity', '0')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' rect.handle').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .drag_zone').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .drag_zone').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('fill-opacity', '0')
  
}
export const select_visualy_links=(d:SankeyLink)=>{
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' rect.handle').attr('fill-opacity', '1')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .drag_zone').attr('stroke-opacity', '1')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('stroke-opacity', '1')
  d3.selectAll(' .opensankey #gg_link_handle_'+d.idLink + ' .center_handle').attr('fill-opacity', '1')
}

export const deselect_visualy_nodes=(n:SankeyNode)=>{
  d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',0)
  d3.select(' .opensankey #ggg_' + n.idNode+' .box_width_threshold').attr('visibility','hidden')
}
export const select_visualy_nodes=(n:SankeyNode)=>{
  d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',2)
}

export const repositionne_sidebar=()=>{
  const has_scrollbar_shift=window.innerWidth-document.getElementsByTagName('html')[0].clientWidth
  const menu_open=d3.select('.offcanvas-body').node()
  d3.select('.sideBar').style('left',(window.innerWidth-40-has_scrollbar_shift-(menu_open?540:0))+'px')  
}

// Function that compute the link width
export const linkStrokeWidth=(l:SankeyLink,
  data:SankeyData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  min_thickness:number,
  display_nodes:{ [node_id: string]: SankeyNode},
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
)=>{
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
  const link_values = getLinkValue(data, l.idLink)
  const display_free_as_dashed = data.show_structure !== 'free_interval' && data.show_structure !== 'free_value'
  if (display_free_as_dashed) {
    // Generale settings: free link value are displayed dashed without text without witdh
    const link_value_is_free = link_values.extension && link_values.extension?.free_mini !== undefined
    if (link_value_is_free) {
      if (link_values.extension?.free_visible && link_values.value === 0 ) {
        // zero value of free variables are displayed when free_visible is set to true
        return 5
      } else if (link_values.extension?.free_visible && link_values.value !== 0 ) {
        // Not treated as free
      } else if (!link_values.extension?.free_visible) {
        // Link value is free should be displayed dashed without text without witdh
        return 5
      }
    }
  }
  if (link_values.extension && link_values.extension?.display_thin) {
    // if flux is displayed thin
    return 5
  }
  let link_value = test_link_value(data, nodes, l,getLinkValue)
  link_value=(+link_value==0||(+link_value>=inv_scale(2)))?+link_value:inv_scale(2)
  //Zones limite à ne pas êtres
  // const limit_x = [pos_x_src - scale(link_value / 2), pos_x_src + node.node_width + scale(link_value / 2)]
  // const limit_x = [pos_x_src - scale(link_value / 2), pos_x_src + (return_value_node(data,node,'node_width') as number) + scale(link_value / 2)]
  const limit_x = [pos_x_src - scale(link_value / 2), pos_x_src + data.node_width + scale(link_value / 2)]
  const limit_y = [pos_y_src - scale(link_value / 2), pos_y_src + scale(link_value / 2)]
  let draw_warning = false
  //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
  //si partie gauche du noeud ne se situe pas dans les coord du noeud source
  const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
  //si partie droite du noeud ne se situe pas dans le noeud source
  // const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
  // const right_in_src = node.x + (return_value_node(data,node,'node_width') as number) > limit_x[0] && node.x + (return_value_node(data,node,'node_width') as number) < limit_x[1]
  const right_in_src = node.x + (data.node_width) > limit_x[0] && node.x + (data.node_width) < limit_x[1]
  //si partie haute du noeud ne se situe pas dans le noeud source
  const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
  // const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]
  if (return_value_link(data,l,'orientation') == 'hh') {
    //orientation hh
    draw_warning = left_in_src || right_in_src
  } else if (return_value_link(data,l,'orientation') == 'vv') {
    //orientation vv
    draw_warning = top_in_src
  } else if (return_value_link(data,l,'orientation') == 'vh') {
    draw_warning = left_in_src || right_in_src || top_in_src
  } else {
    //orientation hv
    //draw_warning = node_in_src_hh || node_in_src_vv
    draw_warning = left_in_src || right_in_src || top_in_src
  }
  if (draw_warning && !return_value_link(data,l,'recycling')) {
    return '1px'
  } else {
    const link_value = test_link_value(data, display_nodes, l,getLinkValue)
    const tmp =(link_value=='')?1:link_value
    return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))
  }
}

export const svgDragMiddleMouseStart=()=>{
  d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('fill-opacity', '0')
  d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('cursor', 'pointer')
  d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('stroke-opacity', '0')
  d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('fill-opacity', '0')
}

export const svgDragMiddleMouseMove=(event:d3.D3DragEvent<Element, unknown, unknown>,data:SankeyData)=>{
  d3.selectAll('.ggg_nodes').filter(n=>(n as SankeyNode).position!=='relative').attr('transform',(d)=>{
    const n=d as SankeyNode
    n.x+=event.dx
    n.y+=event.dy
    return 'translate('+n.x+','+n.y+')'
  })
  d3.selectAll('.link').attr('d',(d)=>{
    const l=d as SankeyLink
    // Get the path of each displayed link
    const path=d3.select('#path_'+l.idLink).attr('d').split(' ')

    // Each path is splitted into small part of the path then depending on the small part :
    //  - If it's a letter then do nothing
    //  - If it's a string that contains ',' then it's a coordinate of a point as [x,y] and we apply the shift to these values
    //  - If it's a Number alone then it mean that it's either a vertical shift or a horizontale one,
    //    therefore we search the previous element in the path to see if the shift is vertical 'V' or horizontal 'H'
    //
    // Then once the subpart of the path are modified, we join the array to reform the path
    const new_path=path.map((p,i)=>{
      // Case when it's a [x,y] coordinates
      if(p.includes(',')){
        const pos=p.split(',')
        const newPosX=Number(pos[0])+event.dx
        const newPosY=Number(pos[1])+event.dy
        p=''+newPosX+','+newPosY
      }
      // Case when it's a number alone so we search the previous element to know wich shift
      if(Number(p)){
        if(path[i-1]=='H'){
          p=String(Number(p)+event.x)
        }else if(path[i-1]=='V'){
          p=String(Number(p)+event.y)
        }
      }
      return p
    })
    return new_path.join(' ')
  })
  d3.selectAll('.arrow').attr('d',(d)=>{
    const l=d as SankeyLink
    // Get the path of each displayed link
    const path=d3.select('#path_'+l.idLink+'_arrow').attr('d').split(' ')

    // Each path is splitted into small part of the path then depending on the small part :
    //  - If it's a letter then do nothing
    //  - If it's a string that contains ',' then it's a coordinate of a point as [x,y] and we apply the shift to these values
    //  - If it's a Number alone then it mean that it's either a vertical shift or a horizontale one,
    //    therefore we search the previous element in the path to see if the shift is vertical 'V' or horizontal 'H'
    //
    // Then once the subpart of the path are modified, we join the array to reform the path
    const new_path=path.map((p,i)=>{
    // Case when it's a [x,y] coordinates
      if(p.includes(',')){
        const pos=p.split(',')
        const newPosX=Number(pos[0])+event.dx
        const newPosY=Number(pos[1])+event.dy
        p=''+newPosX+','+newPosY
      }
      // Case when it's a number alone so we search the previous element to know wich shift
      if(Number(p)){
        if(path[i-1]=='H'){
          p=String(Number(p)+event.x)
        }else if(path[i-1]=='V'){
          p=String(Number(p)+event.y)
        }
      }
      return p
    })
    return new_path.join(' ')
  })

  const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
  const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
  const scale_for_legend=(scale_svg<1?(1/scale_svg):1)
  data.legend_position[0]+=event.dx
  data.legend_position[1]+=event.dy
  d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+scale_for_legend+')')
  
}
export const node_visible_on_svg=()=>d3.selectAll('.node_shape').nodes().map(element => {
  return d3.select(element).attr('id').replace('shape_','')
})

export const zoom_function=(evt:d3.D3ZoomEvent<SVGElement,unknown>,data:SankeyData)=>{

  const t='translate(0,0) scale('+evt.transform.k+')'
  const svgSankey = d3.select('.opensankey #svg')
  svgSankey
    .attr('transform', t)
  // Change the width of scrollable zone if the menu is open so we can scroll until the menu is not on the sankey zone
  if(d3.select('.offcanvas-body').node()){
    d3.select('.scroll_zone').style('width',((data.width+600)*evt.transform.k-(600*(evt.transform.k-1.1)))+'px')
  }
  //Compensate the scale of the legend when we dezoom so the legend has alway a readable size 
  const scale_legend=1/((evt.transform.k<1)?evt.transform.k:1)
  svgSankey
    .style('border', Math.max(1,Math.round(2 / evt.transform.k)) + 'px solid #d3d3d3')
  d3.select(' .opensankey #svg #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+(scale_legend)+')')
  d3.select(' .opensankey #svg #g_legend .measurment_scale').html(String(Math.round((data.user_scale/2)*scale_legend)))

  repositionne_sidebar()
}
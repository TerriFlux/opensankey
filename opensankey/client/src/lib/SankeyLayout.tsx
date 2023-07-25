import { SankeyNode, SankeyLink, SankeyData, SankeyDataPropTypes} from './types'
import { findMaxLinkValue,node_displayed,assign_link_local_attribute,return_value_link } from './SankeyUtils'
import React,{ FunctionComponent, useState } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Modal, Form, Row, Col, Button } from 'react-bootstrap'

export const reorganize_node_inputLinksId = (
  data:SankeyData,
  node: SankeyNode,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {
  const input_links = Object.values(links).filter(
    l => l.idTarget === node.idNode
  )
  input_links.sort((l1, l2) => {
    const n1Id = l1.idSource
    const n2Id = l2.idSource
    const l1_recy=return_value_link(data,l1,'recycling')
    const l2_recy=return_value_link(data,l2,'recycling')
    const l1_v_s=return_value_link(data,l1,'vert_shift') as number
    const l2_v_s=return_value_link(data,l2,'vert_shift') as number
    const l1_ori=return_value_link(data,l1,'orientation')
    const l2_ori=return_value_link(data,l2,'orientation')

    if (n1Id !== n2Id) {
      const n1 = nodes[n1Id]
      const n2 = nodes[n2Id]
      if (n2.position == 'relative') {
        return 1
      }
      if (n1.position == 'relative') {
        return -1
      }
      if ( l1_recy && !l2_recy) {
        if (l1_v_s && l1_v_s < 0) {
          return -1
        }
        return 1        
      }
      if ( !l1_recy && l2_recy) {
        if (l2_v_s && l2_v_s < 0) {
          return 1
        }
        return -1       
      } 
      if (l1_ori === 'vh' && l2_ori === 'vh' || l1_ori === 'vv' && l2_ori === 'vv') {
        if (n1 && n2 && n1.x < n2.x) {
          return -1
        }
        return 1
      }
      if (n1 && n2 && n1.y < n2.y) {
        return -1
      }
      return 1
    } else {
      const n1 = nodes[n1Id]
      if (n1) {
        const output_l1_index = n1.outputLinksId.indexOf(l1.idLink)
        const output_l2_index = n1.outputLinksId.indexOf(l2.idLink)
        const l1_index = input_links.indexOf(l1)
        const l2_index = input_links.indexOf(l1)
        if ((output_l1_index < output_l2_index && l1_index < l2_index) ||
          (output_l1_index > output_l2_index && l1_index > l2_index)) {
          return 1
        }
        return -1
      } else {
        return 1
      }
    }
  })
  node.inputLinksId = input_links.map(l=>l.idLink)
}

export const reorganize_node_outputLinksId = (
  data:SankeyData,
  node: SankeyNode,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {
  const output_links = Object.values(links).filter(
    l => l.idSource === node.idNode
  )
  output_links.sort((l1, l2) => {
    const n1Id = l1.idTarget
    const n2Id = l2.idTarget
    const l1_recy=return_value_link(data,l1,'recycling')
    const l2_recy=return_value_link(data,l2,'recycling')
    const l1_v_s=return_value_link(data,l1,'vert_shift') as number
    const l2_v_s=return_value_link(data,l2,'vert_shift') as number
    const l1_ori=return_value_link(data,l1,'orientation')
    const l2_ori=return_value_link(data,l2,'orientation')

    if (n1Id !== n2Id) {
      const n1 = nodes[n1Id]
      const n2 = nodes[n2Id]
      if (n2.position == 'relative') {
        return -1
      }
      if (n1.position == 'relative') {
        return 1
      }
      if ( l1_recy && !l2_recy) {
        if (l1_v_s && l1_v_s < 0) {
          return 1
        }
        return -1        
      }
      if ( !l1_recy && l2_recy) {
        if (l2_v_s && l2_v_s < 0) {
          return 1
        }
        return -1       
      }      
      if (l1_ori === 'vh' && l2_ori === 'vh' || l1_ori === 'vv' && l2_ori === 'vv') {
        if (n1 && n2 && n1.x < n2.x) {
          return -1
        }
        return 1
      }
      if (n1 && n2 && n1.y < n2.y) {
        return -1
      }
      return 1
    } else {
      const n1 = nodes[n1Id]
      if (n1) {
        const input_l1_index = n1.inputLinksId.indexOf(l1.idLink)
        const input_l2_index = n1.inputLinksId.indexOf(l2.idLink)
        const l1_index = output_links.indexOf(l1)
        const l2_index = output_links.indexOf(l1)
        if ((input_l1_index < input_l2_index && l1_index < l2_index) ||
          (input_l1_index > input_l2_index && l1_index > l2_index)) {
          return 1
        }
        return -1
      } else {
        return 1
      }
    }
  })
  node.outputLinksId = output_links.map(l=>l.idLink)
}

export const reorganize_inputLinksId = (
  data:SankeyData,
  node: SankeyNode,
  input: boolean,
  output: boolean,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {

  if (input) {
    reorganize_node_inputLinksId(data,node, nodes, links)
  }
  if (output) {
    reorganize_node_outputLinksId(data,node, nodes, links)
  }
}

export const compute_default_input_outputLinksId = (
  nodes: { [node_id : string]:SankeyNode},
  links: { [link_id : string]:SankeyLink},
) => {
  Object.values(nodes).forEach( n => {
    n.inputLinksId = []
    n.outputLinksId = []
  })
  Object.values(links).forEach(link => {
    nodes[link.idTarget].inputLinksId.push(link.idLink)
    nodes[link.idSource].outputLinksId.push(link.idLink)
  })
}
const normalize_name = (name: string) => {
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const apply_input_outputLinksId = (
  ref_nodes: { [node_id : string]:SankeyNode},
  data: SankeyData
) => {
  Object.values(ref_nodes).forEach(
    (ref_node) => {
      const node = data.nodes[ref_node.idNode]
      if (!node) {
        return
      }
      const new_inputLinksId: string[] = []
      ref_node.inputLinksId.forEach(
        (idLink) => {
          const ref_link = data.links[idLink]
          if (ref_link === undefined) {
            return
          }
          new_inputLinksId.push(idLink)
        }
      )
      node.inputLinksId = new_inputLinksId //result_inputLinksId.filter(function (item, pos) {return node.inputLinksId.indexOf(item) == pos})
      const new_outputLinksId: string[] = []
      ref_node.outputLinksId.forEach(
        (idLink) => {
          const ref_link = data.links[idLink]
          if (ref_link === undefined) {
            return
          }
          new_outputLinksId.push(idLink)
        }
      )
      node.outputLinksId = new_outputLinksId//result_outputLinksId.filter(function (item, pos) {return node.outputLinksId.indexOf(item) == pos})
    }
  )
}

export const explore_branch = (
  idNode: string,
  current_length: number,
  visited_nodes: string[],
  links: { [link_id : string]:SankeyLink},
  nodes: { [node_id : string]:SankeyNode},
  data:SankeyData
) => {
  let no_input_link = true
  let highest_branch_length = current_length
  Object.values(links).forEach(link => {
    if (link.idTarget === idNode && node_displayed(data,nodes[link.idSource]) ) {
      if (visited_nodes.indexOf(idNode) === -1) {
        no_input_link = false
        const branch_length = explore_branch(link.idSource, current_length + 1, [...visited_nodes,idNode], links,nodes,data)
        if (branch_length > highest_branch_length) {
          highest_branch_length = branch_length
        }
      }
    }
  })
  if (no_input_link === true) {
    return current_length
  }
  else {
    return highest_branch_length
  }
}

export const arrangeNodes = (
  data: SankeyData
) => {
  Object.values(data.nodes).forEach(node => {
    if ( !node_displayed(data,node) || node.position === 'relative' ) {
      return
    }
    const x = Math.round(node.x / data.grid_square_size) * data.grid_square_size
    const y = Math.round(node.y / data.grid_square_size) * data.grid_square_size
    node.x = x
    node.y = y
  })
}

export const compute_auto_sankey = (
  data: SankeyData,
  h_space : number
) => {
  
  let max_horizontal_index = 0
  let max_link_value = 0
  Object.values(data.links).forEach(link => {
    const new_max_link_value  = findMaxLinkValue(
      max_link_value, 
      link.value
    )
    max_link_value = new_max_link_value > max_link_value ? new_max_link_value : max_link_value
  })
  max_link_value += 1
  if (max_link_value !== 1) {
    data.user_scale = max_link_value
  }

  const vspace = data.v_space
  const horizontal_indices: { [node_id:string]:number} = {}
  Object.values(data.nodes).filter(n=>node_displayed(data,n)).forEach(node => {
    const horizontal_index = explore_branch(node.idNode, 0, [], data.links, data.nodes,data)
    horizontal_indices[node.idNode] = horizontal_index
    if (horizontal_index > max_horizontal_index) {
      max_horizontal_index = horizontal_index
    }
  })
  Object.values(data.links).filter(l=>node_displayed(data,data.nodes[l.idSource]) && node_displayed(data,data.nodes[l.idTarget])).forEach(l => {
    if (horizontal_indices[l.idSource] >= horizontal_indices[l.idTarget]) {
      // l.recycling = true
      assign_link_local_attribute(l,'recycling',true)

    }
  })

  const width = max_horizontal_index* h_space 

  Object.values(data.nodes).forEach(node => {
    if (!node_displayed(data,node)) {
      return
    }
    node.x = max_horizontal_index !== 0 ? 50 + horizontal_indices[node.idNode] / max_horizontal_index * width : 50 //* 0.9
  })

  // Reorder links using the x of source name as criteria 
  // Compute input_outputLinksId
  Object.values(data.nodes).filter(n=>node_displayed(data,n)).forEach(n => data.nodes[n.idNode] = {...n})
  compute_default_input_outputLinksId(data.nodes, data.links)

  // Vertical position of vertical nodes
  // compute total height of nodes that belong to the same column, then compute the spaces between them and their positions.
  let max_vertical_offset = 0
  for (let i = 0; i <= max_horizontal_index; i++) {
    let vertical_space: number
    let vertical_offset = 0
    const the_nodes = Object.values(data.nodes).filter(n => node_displayed(data,n) && horizontal_indices[n.idNode] === i)
    if (the_nodes.length > 1) {
      vertical_space = vspace //(200 - total_height) / (total_nb - 1)
    }
    else {
      vertical_space = 0
    }

    the_nodes.forEach((node, node_id) => {
  
      if (node_id === 0) {
        node.y = 200//0.2 * height;
        vertical_offset = 200 + vertical_space
      }
      else {
        node.y = vertical_offset
        vertical_offset += vertical_space
      }
    })
    if (max_vertical_offset < vertical_offset) {
      max_vertical_offset = vertical_offset
    }
  }
  for (let i = 0; i <= max_horizontal_index; i++) {
    const the_nodes = Object.values(data.nodes).filter(n => node_displayed(data,n) && horizontal_indices[n.idNode] === i)
    let total_nb_outputLinksId_up = 0
    let total_nb_outputLinksId_down = 0
    the_nodes.forEach((node) => {
      node.outputLinksId.forEach(
        (idLink) => {
          if ( node_displayed(data,data.nodes[data.links[idLink].idSource]) && node_displayed(data,data.nodes[data.links[idLink].idTarget])) {
            const target_node = data.nodes[data.links[idLink].idTarget]
            if (target_node === undefined ) {
              return
            }
            if ( target_node.y < node.y ) {
              total_nb_outputLinksId_up += 1
            } else {
              total_nb_outputLinksId_down += 1              
            }
          }
        }
      )
    })
    let current_output_link_up = 0
    let current_output_link_down = 0
    the_nodes.forEach(node => {
      node.outputLinksId.forEach(
        (idLink) => {
          if ( node_displayed(data,data.nodes[data.links[idLink].idSource]) && node_displayed(data,data.nodes[data.links[idLink].idTarget]) ) {
            const target_node = data.nodes[data.links[idLink].idTarget]
            if (target_node === undefined ) {
              return
            }
            if ( target_node.y < node.y ) {
              assign_link_local_attribute(data.links[idLink],'left_horiz_shift',data.left_shift + (current_output_link_up/total_nb_outputLinksId_up)*data.max_shift)
              assign_link_local_attribute(data.links[idLink],'right_horiz_shift',data.right_shift + (current_output_link_up/total_nb_outputLinksId_up)*data.max_shift)
              // data.links[idLink].left_horiz_shift = data.left_shift + (current_output_link_up/total_nb_outputLinksId_up)*data.max_shift
              // data.links[idLink].right_horiz_shift = data.right_shift + (current_output_link_up/total_nb_outputLinksId_up)*data.max_shift
              current_output_link_up += 1
            } else {
              assign_link_local_attribute(data.links[idLink],'left_horiz_shift',data.left_shift - (current_output_link_down/total_nb_outputLinksId_down)*data.max_shift)
              assign_link_local_attribute(data.links[idLink],'right_horiz_shift',data.right_shift - (current_output_link_down/total_nb_outputLinksId_down)*data.max_shift)
              // data.links[idLink].left_horiz_shift = data.left_shift - (current_output_link_down/total_nb_outputLinksId_down)*data.max_shift
              // data.links[idLink].right_horiz_shift = data.right_shift - (current_output_link_down/total_nb_outputLinksId_down)*data.max_shift
              current_output_link_down += 1
            }

          }
        }
      )
    })
  }
  

  data.width = width + h_space
  
  reorganize_all_input_outputLinksId(data,data.nodes, data.links)

  return []
}

export const reorganize_all_input_outputLinksId = (
  data:SankeyData,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {
  Object.values(nodes).forEach( node => {
    reorganize_node_inputLinksId(data,node, nodes, links)
    reorganize_node_outputLinksId(data,node, nodes, links)
  })
}

export const updateLayout = (
  data: SankeyData,
  new_layout: SankeyData,
  mode:string[]
) => {
  let max_vertical_offset = 0
  const compute_offset = (node: SankeyNode) => {
    if (!node_displayed(data,node)) {
      return
    }
    max_vertical_offset = Math.max(node.y, max_vertical_offset)
  }
  Object.values(data.nodes).forEach(compute_offset)
  max_vertical_offset = max_vertical_offset + 200

  let idNode = Object.keys(data.nodes).length
  while (data.nodes['node'+idNode]) {
    idNode = idNode+1
  }

  //- Stores a mapping between idNode of initial data and layout idNodes
  const idNodesMap: {[s:string]:string} = {}
  Object.values(data.nodes).forEach( n => {
    const layout_nodes = Object.values(new_layout.nodes).filter(node_layout=>normalize_name(n.name) === normalize_name(node_layout.name))
    if (layout_nodes.length === 0) {
      idNode = idNode+1
      idNodesMap[n.idNode] = 'node'+idNode
      return
    }
    const layout_node = layout_nodes[0]
    idNodesMap[n.idNode] = layout_node.idNode
  })
  Object.values(data.nodes).forEach(n=>{
    n.idNode=idNodesMap[n.idNode]
    Object.keys(n.dimensions).forEach(dim => {
      if (n.dimensions[dim].parent_name) {
        //parent_names.push(n.dimensions[dim].parent_name as string)
        n.dimensions[dim].parent_name = idNodesMap[n.dimensions[dim].parent_name??0]
      }
    })})
  data.nodes = Object.assign({}, ...Object.values(data.nodes).map(n => ({ [n.idNode]: { ...n } })))
  Object.values(data.links).forEach(l=>{
    l.idSource=idNodesMap[l.idSource]
    l.idTarget=idNodesMap[l.idTarget]    
  })

  //let idLink = Object.keys(data.links).length
  // while (data.links[idLink]) {
  //   idLink = idLink+1
  // }
  //- Stores a mapping between idLink of initial data and layout idLinks
  const idLinksMap: {[s:string]:string} = {}
  const links_with_no_match : SankeyLink [] = []
  Object.values(data.links).forEach( l => {
    const layout_link = new_layout.links[l.idLink]
    if (!layout_link || layout_link.idSource !== l.idSource || layout_link.idTarget !== l.idTarget) {
      links_with_no_match.push(l)
      return
    }
    idLinksMap[l.idLink] = layout_link.idLink
  })
  links_with_no_match.forEach( l => {       
    const layout_links = Object.values(new_layout.links).filter(link_layout => 
      l.idSource === link_layout.idSource && l.idTarget === link_layout.idTarget
    )
    if (layout_links.length === 0) {
      //idLink = idLink+1
      idLinksMap[l.idLink] = l.idSource+'---'+l.idTarget
      return
    }
    const layout_link = layout_links[0]
    idLinksMap[l.idLink] = layout_link.idLink
  })
  Object.values(data.links).forEach(l=>l.idLink=idLinksMap[l.idLink])
  data.links = Object.assign({}, ...Object.values(data.links).map(l => ({ [l.idLink]: { ...l } })))

  compute_default_input_outputLinksId(data.nodes, data.links)


  //data.node_width = new_layout.node_width
  // Apply nodes layout
  for (const node_layout_key in new_layout.nodes) {
    const node = data.nodes[node_layout_key]
    //const nodes = Object.values(data.nodes).filter(n=>normalize_name(n.name) === normalize_name(node_layout.name) )
    //let node : SankeyNode | undefined
    // if (nodes.length === 0) {
    //   if (node_layout.inputLinksId.length === 0 && node_layout.outputLinksId.length === 0 && node_layout.shape_visible === false && node_layout.label_visible === true) {
    //     // Case of not a label
    //     node = {...node_layout}
    //     // Méthode pour incrementer idNode
    // let idLink = Object.keys(data.links).length
    // while (data.links['link'+idLink]) {
    //   idLink = idLink+1
    // }
    //     node.idNode = 'idNode'+idNode
    //     data.nodes[node.idNode]
    //   } else {
    //     continue
    //   }
    // }
    //node = nodes[0]
    if (!node) {
      continue
    }
    const node_layout = new_layout.nodes[node_layout_key]
    if(mode.includes('posNode')){
      node.name = node_layout.name
      if(node.local===undefined || node.local===null){
        node.local={}
      }
      node.position = node_layout.position
      node.local.node_width = node_layout.local?.node_width
      node.local.node_height = node_layout.local?.node_height
      node.local.show_value = node_layout.local?.show_value
      node.local.shape = node_layout.local?.shape
      if (node_layout.x !== 0 && node_layout.y != 0) { 
        node.x = node_layout.x
        node.y = node_layout.y
      }
      if (node.y + 200 > max_vertical_offset) {
        max_vertical_offset = node.y + 200
      }
      node.x_label = node_layout.x_label
      node.y_label = node_layout.y_label
    }
    if(mode.includes('attrNode')){
      node.local=node_layout?.local

      // node.iconName = node_layout.iconName ? node_layout.iconName : node.iconName
      // node.iconColor = node_layout.iconColor ? node_layout.iconColor : node.iconColor
      // node.iconRatio = node_layout.iconRatio ? node_layout.iconRatio : node.iconRatio
      // node.iconVisible= node_layout.iconVisible ? node_layout.iconVisible : node.iconVisible
  
      node.colorTag = node_layout.colorTag
      node.colorParameter = node_layout.colorParameter
      // node.color = node_layout.color

      
      // node.shape_visible = node_layout.shape_visible
      // node.label_visible = node_layout.label_visible
    }
    // if(mode.includes('tagNode')){
    //   for (const node_tag_key in node_layout.tags) {
    //     node.tags[node_tag_key] = JSON.parse(JSON.stringify(node_layout.tags[node_tag_key]))
    //   }
    // }    
  }
  
  // (data as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels = {}
  // for (const layout_label in (new_layout as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels) {
  //   (data as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels[layout_label] = 
  //     (new_layout as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels[layout_label]
  // }

  if (mode.includes('attrFlux')){
    apply_input_outputLinksId(
      new_layout.nodes,
      data
    )
    for (const link_layout_key in new_layout.links) {
      const link_layout = new_layout.links[link_layout_key]
      const link = data.links[link_layout_key]  
      if (!link) {
        continue
      }
      if(link.local===undefined || link.local===null){
        link.local={}
      }
      // const { x_label, y_label, label_position, label_visible, recycling, curved, curvature, arrow,orthogonal_label_position,label_font_size } = link_layout
      link.local.curvature = link_layout.local?.curvature
      link.local.curved = link_layout.local?.curved
      link.local.arrow = link_layout.local?.arrow
      link.local.text_color = link_layout.local?.text_color
      link.local.label_position = link_layout.local?.label_position
      link.local.label_visible = link_layout.local?.label_visible
      link.local.label_font_size = link_layout.local?.label_font_size
      link.x_label = link_layout.x_label
      link.y_label = link_layout.y_label
      link.local.left_horiz_shift = link_layout.local?.left_horiz_shift
      link.local.right_horiz_shift = link_layout.local?.right_horiz_shift
      link.local.orientation = link_layout.local?.orientation
      link.local.recycling = link_layout.local?.recycling
      link.local.orthogonal_label_position = link_layout.local?.orthogonal_label_position
  
      link.colorTag = link_layout.colorTag
      link.colorParameter = link_layout.colorParameter
      link.local.color = link_layout.local?.color
  
      if (link_layout.local?.vert_shift) {
        link.local.left_horiz_shift = link_layout.local?.left_horiz_shift
        link.local.right_horiz_shift = link_layout.local?.right_horiz_shift
        link.local.vert_shift = link_layout.local?.vert_shift
      }
    }
    
  }

  if ((new_layout as unknown as {view : {id: string,view_data: object,nom:string,details:string}[]}).view) {
    if (!(data as unknown as {view : {id: string,view_data: object,nom:string,details:string}[]}).view) {
      (data as unknown as {view : {id: string,view_data: object,nom:string,details:string}[]}).view = []
    }
    if ((data as unknown as {view : {id: string,view_data: object,nom:string,details:string}[]}).view.length == 0) {
      (new_layout as unknown as {view : {id: string,view_data: object,nom:string,details:string}[]}).view .forEach(
        v=>(data as unknown as {view : {id: string,view_data: object,nom:string,details:string}[]}).view.push(v)
      )
    }
  }


  // Always assign level tag from new layout
  const new_layout_level_tag=Object.fromEntries(Object.entries(new_layout.levelTags))
  for (const tag_group_key in new_layout_level_tag) {
    if (tag_group_key in data.levelTags) {
      continue
    }
    data.levelTags[tag_group_key] = JSON.parse(JSON.stringify(new_layout_level_tag[tag_group_key]))
  }
  for (const tag_group_key in data.levelTags) {
    if (!(tag_group_key in new_layout_level_tag)) {
      continue
    }
    data.levelTags[tag_group_key].show_legend = new_layout_level_tag[tag_group_key].show_legend
    data.levelTags[tag_group_key].banner = new_layout_level_tag[tag_group_key].banner
    for (const tag in data.levelTags[tag_group_key].tags) {
      if (!(tag in new_layout_level_tag[tag_group_key].tags)) {
        continue
      }
      data.levelTags[tag_group_key].tags[tag].color = new_layout_level_tag[tag_group_key].tags[tag].color
      if (tag !== 'échange') {
        data.levelTags[tag_group_key].tags[tag].selected = new_layout_level_tag[tag_group_key].tags[tag].selected
      }
    }
  }


  if(mode.includes('tagNode')){
    for (const tag_group_key in new_layout.nodeTags) {
      if (tag_group_key in data.nodeTags) {
        continue
      }
      data.nodeTags[tag_group_key] = JSON.parse(JSON.stringify(new_layout.nodeTags[tag_group_key]))
    }
    for (const tag_group_key in data.nodeTags) {
      if (!(tag_group_key in new_layout.nodeTags)) {
        continue
      }
      data.nodeTags[tag_group_key].show_legend = new_layout.nodeTags[tag_group_key].show_legend
      data.nodeTags[tag_group_key].banner = new_layout.nodeTags[tag_group_key].banner
      for (const tag in data.nodeTags[tag_group_key].tags) {
        if (!(tag in new_layout.nodeTags[tag_group_key].tags)) {
          continue
        }
        data.nodeTags[tag_group_key].tags[tag].color = new_layout.nodeTags[tag_group_key].tags[tag].color
        if (tag !== 'échange') {
          data.nodeTags[tag_group_key].tags[tag].selected = new_layout.nodeTags[tag_group_key].tags[tag].selected
        }
      }
    }
  }
  
  if(mode.includes('tagFlux')){
    for (const tag_group_key in new_layout.fluxTags) {
      data.fluxTags[tag_group_key] = JSON.parse(JSON.stringify(new_layout.fluxTags[tag_group_key]))
    }
    for (const tag_group_key in data.fluxTags) {
      if (!(tag_group_key in new_layout.fluxTags)) {
        continue
      }
      data.fluxTags[tag_group_key].show_legend = new_layout.fluxTags[tag_group_key].show_legend
      data.fluxTags[tag_group_key].banner = new_layout.fluxTags[tag_group_key].banner
      for (const tag in data.fluxTags[tag_group_key].tags) {
        if (!(tag in new_layout.fluxTags[tag_group_key].tags)) {
          continue
        }
        data.fluxTags[tag_group_key].tags[tag].color = new_layout.fluxTags[tag_group_key].tags[tag].color
        data.fluxTags[tag_group_key].tags[tag].selected = new_layout.fluxTags[tag_group_key].tags[tag].selected
      }
    }
  }

  if(mode.includes('tagData')){
    for (const tag_group_key in new_layout.dataTags) {
      data.dataTags[tag_group_key] = JSON.parse(JSON.stringify(new_layout.dataTags[tag_group_key]))
    }
    for (const tag_group_key in data.dataTags) {
      if (!(tag_group_key in new_layout.dataTags)) {
        continue
      }
      data.dataTags[tag_group_key].show_legend = new_layout.dataTags[tag_group_key].show_legend
      data.dataTags[tag_group_key].banner = new_layout.dataTags[tag_group_key].banner
      for (const tag in data.dataTags[tag_group_key].tags) {
        if (!(tag in new_layout.dataTags[tag_group_key].tags)) {
          continue
        }
        data.dataTags[tag_group_key].tags[tag].color = new_layout.dataTags[tag_group_key].tags[tag].color
        data.dataTags[tag_group_key].tags[tag].selected = new_layout.dataTags[tag_group_key].tags[tag].selected
      }
    }
  }
  
  


  // data.agregation.level = new_layout.agregation.level
  // data.agregation.dimension = new_layout.agregation.dimension

  if(mode.includes('attrGeneral')){
    // data.icon_catalog = new_layout.icon_catalog
    data.colorMap = new_layout.colorMap
    data.user_scale = new_layout.user_scale
    data.legend_position = new_layout.legend_position;
    ((data as unknown) as {welcome_text:string}).welcome_text = ((new_layout as unknown)  as {welcome_text:string}).welcome_text
  
    data.accordeonToShow = new_layout.accordeonToShow
  
    if ('width' in new_layout) {
      data.width = new_layout.width
    }
    if (new_layout.maximum_flux) {
      data.maximum_flux = new_layout.maximum_flux
    }
    Object.keys(new_layout.display_style).forEach(
      key => ((data.display_style as unknown) as Record<string, unknown>)[key] = ((new_layout.display_style as unknown) as Record<string, unknown>)[key]
    )
    if (data.display_style.filter === undefined) {
      data.display_style.filter = 0
    }
    if (data.display_style.filter_label === undefined) {
      data.display_style.filter_label = 0
    }
  }
  
}

export const desagregation = (
  data: SankeyData,   
  idNode: string, 
  cur_dimension: string,
) => {
  const dim_desagregate_nodes = Object.values(data.nodes).filter( n => n.dimensions[cur_dimension] && n.dimensions[cur_dimension].parent_name === idNode )
  if (dim_desagregate_nodes.length == 0) {
    return
  }
  const nb_desagregated = dim_desagregate_nodes.length
  let current_y = data.v_space/2
  const delta_y = data.v_space / (nb_desagregated-1)
  dim_desagregate_nodes.forEach(n => {
    if ((n.x === undefined || (n.x === 0 || n.y === 0)) && (data.nodes[idNode].x !==0 && data.nodes[idNode].y !==0 )) {
      n.x = data.nodes[idNode].x
      n.y = data.nodes[idNode].y - current_y
    }
    current_y = current_y - delta_y

    if(n.local==undefined || n.local==null){
      n.local={local_aggregation:true}
    }else{
      if(n.local){
        n.local.local_aggregation=true
      }
    }
  })
  const clicked_node=data.nodes[idNode]
  if(clicked_node.local==undefined || clicked_node.local==null){
    clicked_node.local={local_aggregation:false}
  }else{
    if(clicked_node.local){
      clicked_node.local.local_aggregation=false
    }
  }
}

export const agregation = (
  data : SankeyData, 
  idNode: string,
  cur_dimension: string,
) =>  {
  if ( !(cur_dimension in data.nodes[idNode].dimensions)) {
    return
  }
  const desagregated_node = data.nodes[idNode]
  const parent_node = data.nodes[desagregated_node.dimensions[cur_dimension].parent_name??'']
  if (!parent_node) {
    return
  }
  const cur_parentId = desagregated_node.dimensions[cur_dimension].parent_name
  const dim_desagregated_nodes = Object.values(data.nodes).filter( n => {
    const cur_n_dim = n.dimensions[cur_dimension]
    return cur_n_dim && (
      cur_n_dim.parent_name === cur_parentId ||
        (cur_n_dim.parent_name && data.nodes[cur_n_dim.parent_name].dimensions[cur_dimension] && data.nodes[cur_n_dim.parent_name].dimensions[cur_dimension].parent_name === cur_parentId)
    )
  })


  if (dim_desagregated_nodes.length === 0) {
    return
  }

  let mean_x = 0
  let mean_y = 0
  dim_desagregated_nodes.forEach(n => {
    if (n.x) {
      mean_x += n.x  
      mean_y += n.y
    }
    if(n.local==undefined || n.local==null){
      n.local={local_aggregation:false}
    }else{
      if(n.local){
        n.local.local_aggregation=false
      }
    }

  })
  mean_x = mean_x/dim_desagregated_nodes.length
  mean_y = mean_y/dim_desagregated_nodes.length

  if (parent_node.x === undefined || (parent_node.x === 0 && parent_node.y === 0) ) {
    parent_node.x = mean_x
    parent_node.y = mean_y
  }
  if(parent_node.local==undefined || parent_node.local==null){
    parent_node.local={local_aggregation:true}
  }else{
    if(parent_node.local){
      parent_node.local.local_aggregation=true
    }
  }
}

const AgregationModalPropTypes = {
  data : PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data : PropTypes.func.isRequired,
  agregation_node : PropTypes.string.isRequired,
  set_show_agregation : PropTypes.func.isRequired,
  show_agregation : PropTypes.bool.isRequired,
  is_agregation: PropTypes.bool.isRequired
}

type  AgregationModalTypes = InferProps<typeof  AgregationModalPropTypes>

export const AgregationModal : FunctionComponent<AgregationModalTypes> = (
  {data, set_data, agregation_node, set_show_agregation,show_agregation,is_agregation}
) => {
  const n = data.nodes[agregation_node]
  const [dim_name,set_dim_name] = useState('')
  const [child_names,set_child_names] = useState<string[]>([])
  const dim_names: string[] = []
  if ( is_agregation ) {
    Object.keys(n.dimensions).forEach(
      dim => {
        if (Object.keys(n.dimensions).length > 1 && dim === 'Primaire') {
          return
        }
        if (n.dimensions[dim].parent_name) {
          //parent_names.push(n.dimensions[dim].parent_name as string)
          dim_names.push(dim)
        }
      }
    )
    if (dim_name === '') {
      if (dim_names.length === 0) {
        return <></>
      }
      set_dim_name(dim_names[0])
    }
    return (
      <Modal 
        show={show_agregation} 
        onHide={ () => {
          set_show_agregation(false)
          set_dim_name('')
        } } >
        <Modal.Header closeButton>
          <Modal.Title>Dimension d'agrégation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Row>
                <Col>    
                  <Form.Select
                    onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> set_dim_name(evt.target.value)}
                  >
                    {dim_names.map(
                      (cur_dir_name, i) => <option key={i} value={cur_dir_name} selected={dim_name === cur_dir_name} >{cur_dir_name}</option>
                    )}
                  </Form.Select>
                  <Form.Label>{dim_name !== '' && data.nodes[n.dimensions[dim_name].parent_name??0] ? data.nodes[n.dimensions[dim_name].parent_name??0].name : ''}</Form.Label>
                </Col>
              </Row>      
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={()=> {
              agregation(data,agregation_node,dim_name)
              set_data({...data})
              set_show_agregation(false)
              set_dim_name('')
            }}
          >Agrégation</Button>
          <Button variant="secondary" onClick={() => {
            set_show_agregation(false)
            set_dim_name('')
          }}>Annuler</Button>
        </Modal.Footer>
      </Modal>
    )
  } else {
    Object.values(data.nodes).forEach(n2 => {
      for (const dim in n2.dimensions) {
        if (Object.keys(n2.dimensions).length > 1 && dim === 'Primaire') {
          continue
        }
        if (dim in n2.dimensions && n2.dimensions[dim].parent_name == n.idNode) {
          if (dim_names.indexOf(dim) === -1) {
            dim_names.push(dim)
          }
        }
      }
      return false
    })
    if ( dim_name === '') {
      const the_child_names: string[] = []
      Object.values(data.nodes).forEach(n2 => {
        if (dim_names[0] in n2.dimensions && n2.dimensions[dim_names[0]].parent_name == n.idNode) {
          the_child_names.push(n2.name)
        }
      }
      )
      set_dim_name(dim_names[0])
      set_child_names(the_child_names)
    }
    return (
      <Modal 
        show={show_agregation} 
        onHide={ () => {
          set_show_agregation(false)
          set_dim_name('')
        }} >
        <Modal.Header closeButton>
          <Modal.Title>Dimension desagrégation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Row>
                <Col>    
                  <Form.Select
                    onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> {
                      set_dim_name(evt.target.value)
                      const the_child_names: string[] = []
                      Object.values(data.nodes).forEach(n2 => {
                        if (evt.target.value in n2.dimensions && n2.dimensions[evt.target.value].parent_name == n.idNode) {
                          the_child_names.push(n2.name)
                        }
                      }
                      )
                      set_child_names(the_child_names)
                    }}
                  >
                    {dim_names.map(
                      (cur_dim_name, i) => <option key={i} value={cur_dim_name} selected={dim_name === cur_dim_name} >{cur_dim_name}</option>
                    )}
                  </Form.Select>
                  {child_names.map(child_name=><Form.Label>{child_name}</Form.Label>)}
                </Col>
              </Row>      
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={()=> {
              desagregation(data,agregation_node,dim_name)
              set_data({...data})
              set_show_agregation(false)
              set_dim_name('')
            }}
          >Désagrégation</Button>
          <Button variant="secondary" onClick={() => {
            set_show_agregation(false)
            set_dim_name('')
          }}>Annuler</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
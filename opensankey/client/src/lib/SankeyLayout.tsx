import * as d3 from 'd3'
import { SankeyNode, SankeyLink, SankeyData, SankeyDataPropTypes, SankeyLinkValue} from './types'
import { findMaxLinkValue,node_displayed,assign_link_local_attribute,return_value_link, assign_node_local_attribute, compute_total_offsets, test_link_value, getLinkValue,return_value_node } from './SankeyUtils'
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
      node.inputLinksId = new_inputLinksId 
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
      node.outputLinksId = new_outputLinksId
    }
  )
}

export const explore_branch = (
  idNode: string,
  current_length: number,
  visited_nodes: string[],
  links: { [link_id : string]:SankeyLink},
  nodes: { [node_id : string]:SankeyNode},
  visible_nodes: string[],
  data:SankeyData
) => {
  let no_input_link = true
  let highest_branch_length = current_length
  nodes[idNode].inputLinksId.filter(linkId =>visible_nodes.includes(links[linkId].idSource)).forEach(linkId => {
    if (visited_nodes.indexOf(idNode) === -1) {
      no_input_link = false
      const branch_length = explore_branch(links[linkId].idSource, current_length + 1, [...visited_nodes,idNode], links,nodes,visible_nodes,data)
      if (branch_length > highest_branch_length) {
        highest_branch_length = branch_length
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

export const nodeHeight = (
  n: SankeyNode,
  data:SankeyData,
  inv_scale:(t:number)=>number,
  scale:(t:number)=>number,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  const res = compute_total_offsets(inv_scale,n, data, data.nodes, test_link_value,undefined,getLinkValue)
  const [total_offset_height_left, total_offset_height_right] = res
  const node_size_s_height = Math.max(total_offset_height_left, total_offset_height_right)
  //Hauteur des noeuds
  if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0 || data.show_structure == 'structure') {
    // Hauteur des noeuds
    // return data.node_height
    return return_value_node(data,n,'node_height') as number
  }
  return scale(node_size_s_height)
}

export const compute_auto_sankey = (
  data: SankeyData,
  h_space : number,
  set_is_computing:(b:boolean)=>void,
) => {
  set_is_computing(true)
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
    data.user_scale = Math.min(data.maximum_flux ? data.maximum_flux : max_link_value ,max_link_value)
  }

  compute_default_input_outputLinksId(data.nodes, data.links)

  const vspace = data.v_space
  let max_nodes_on_vertical = 0
  const nodes2horizontal_indices: { [node_id:string] : number   } = {}
  const horizontal_indices2nodes: { [i      :number] : SankeyNode[] } = {}
  const visible_nodes = Object.values(data.nodes).filter(n=>node_displayed(data,n) && n.position !== 'relative' ).map(n=>n.idNode)
  Object.values(visible_nodes).forEach(idNode => {
    const horizontal_index = explore_branch(idNode, 0, [], data.links, data.nodes,visible_nodes, data)
    nodes2horizontal_indices[idNode] = horizontal_index
    if (!horizontal_indices2nodes[horizontal_index]) {
      horizontal_indices2nodes[horizontal_index] = []
    }
    horizontal_indices2nodes[horizontal_index].push(data.nodes[idNode])
    if (horizontal_indices2nodes[horizontal_index].length > max_nodes_on_vertical ) {
      max_nodes_on_vertical = horizontal_indices2nodes[horizontal_index].length
    }
    if (horizontal_index > max_horizontal_index) {
      max_horizontal_index = horizontal_index
    }
  })


  const width = max_horizontal_index* h_space 
  
  for (let i = max_horizontal_index; i >= 0; i--) {
    if (!horizontal_indices2nodes[i]) {
      continue
    } 
    const to_splice : SankeyNode[] = []
    horizontal_indices2nodes[i].forEach(node => {
      if (node.outputLinksId.length === 0) {
        assign_node_local_attribute(node,'label_horiz', 'right')
        assign_node_local_attribute(node,'label_vert', 'middle')
      } else if (node.inputLinksId.length === 0) {
        assign_node_local_attribute(node,'label_horiz', 'left')
        assign_node_local_attribute(node,'label_vert', 'middle')
      } else {
        assign_node_local_attribute(node,'label_horiz', 'left')
        assign_node_local_attribute(node,'label_vert', 'middle')
        assign_node_local_attribute(node,'label_background', true)        
      }
      if (node.inputLinksId.length === 0) {
        let min_next_horizontal_index = max_horizontal_index+1
        node.outputLinksId.forEach(
          (idLink) => {
            if ( node_displayed(data,data.nodes[data.links[idLink].idSource]) && node_displayed(data,data.nodes[data.links[idLink].idTarget])) {
              const target_node = data.nodes[data.links[idLink].idTarget]
              if (target_node === undefined ) {
                return
              }
              if (nodes2horizontal_indices[target_node.idNode] < nodes2horizontal_indices[node.idNode]) {
                return
              }
              if (nodes2horizontal_indices[target_node.idNode]<min_next_horizontal_index) {
                min_next_horizontal_index = nodes2horizontal_indices[target_node.idNode]
              }
            }
          })
        if (nodes2horizontal_indices[node.idNode]<min_next_horizontal_index-1) {
          to_splice.push(node)
          // Il semblerait que dans certains cas nodes2horizontal_indices de certains noeuds peuvent devenir négatif
          // ce qui lors de l'affectation d'une position x, ceux-ci sont négatif
          nodes2horizontal_indices[node.idNode] = min_next_horizontal_index - 1
          if (!horizontal_indices2nodes[min_next_horizontal_index - 1]) {
            horizontal_indices2nodes[min_next_horizontal_index - 1] = []
          }
          horizontal_indices2nodes[min_next_horizontal_index - 1].push(node)
        }
      }
    })
    to_splice.forEach(node=>horizontal_indices2nodes[i].splice(horizontal_indices2nodes[i].indexOf(node),1))
  }

  for (let i =0 ; i <= max_horizontal_index; i++) {
    if (!horizontal_indices2nodes[i] || (horizontal_indices2nodes[i] && horizontal_indices2nodes[i].length === 0)) {
      for (let ii=i;ii<max_horizontal_index;ii++) {
        if ( horizontal_indices2nodes[ii+1] && horizontal_indices2nodes[ii+1].length>0) {
          horizontal_indices2nodes[i] = horizontal_indices2nodes[ii+1]
          delete horizontal_indices2nodes[ii+1]
          if (ii+1 === max_horizontal_index) {
            max_horizontal_index = i
          }
          break
        }
      }
    }
  }
  Object.entries(horizontal_indices2nodes).forEach(([key,val])=>val.forEach(n=>nodes2horizontal_indices[n.idNode]= +key))

  // // Correction post indexation de la profondeur des noeud pour mettre tous les index positif (en additionnant tous les indices par le mini si il y en a un négatif,
  // // par exemple :  si nodes2horizontal_indices[n.idNode]=2 et que le min est -2 alors le nouveau nodes2horizontal_indices[n.idNode]=4)
  // if(Object.values(nodes2horizontal_indices).filter(x_i=>x_i<0).length>0){
  //   const min_x=Object.values(nodes2horizontal_indices).sort()[0]
  //   Object.entries(nodes2horizontal_indices).forEach(n=>nodes2horizontal_indices[n[0]]=n[1]+Math.abs(min_x))
  // }
  
  Object.values(data.nodes).filter(n=>node_displayed(data,n)).forEach(n =>{
    n.x = max_horizontal_index !== 0 ? 50 + nodes2horizontal_indices[n.idNode] / max_horizontal_index * width : 50
  }
  )

  Object.values(data.links).filter(l=>node_displayed(data,data.nodes[l.idSource]) && node_displayed(data,data.nodes[l.idTarget])).forEach(l => {
    if (nodes2horizontal_indices[l.idSource] >= nodes2horizontal_indices[l.idTarget]) {
      assign_link_local_attribute(l,'recycling',true)
    }
  })

  // Vertical position of vertical nodes
  // compute total height of nodes that belong to the same column, then compute the spaces between them and their positions.
  let max_vertical_offset = 0
  for (let i = 0; i <= max_horizontal_index; i++) {
    if (!horizontal_indices2nodes[i]) {
      continue
    } 
    let vertical_space: number
    let vertical_offset = 0
    if (horizontal_indices2nodes[i].length > 0) {
      vertical_space = vspace 
    }
    else {
      vertical_space = 0
    }

    const diff_nb_nodes = (max_nodes_on_vertical - horizontal_indices2nodes[i].length)/2
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, data.user_scale])
    const scale = d3.scaleLinear()
      .range([0, 100])
      .domain([0, data.user_scale])
    horizontal_indices2nodes[i].forEach((node, node_id) => {
      if (node_id === 0) {
        data.nodes[node.idNode].y = 200 + diff_nb_nodes*vertical_space//0.2 * height;
        const node_h = nodeHeight(data.nodes[node.idNode],data,inv_scale,scale,getLinkValue)
        vertical_offset = 200 + node_h + diff_nb_nodes*vertical_space + vertical_space
      }
      else {
        data.nodes[node.idNode].y = vertical_offset
        const node_h = nodeHeight(data.nodes[node.idNode],data,inv_scale,scale,getLinkValue)
        vertical_offset += vertical_space + node_h
      }
    })
    if (max_vertical_offset < vertical_offset) {
      max_vertical_offset = vertical_offset
    }
  }

  Object.values(data.nodes).filter(n=>node_displayed(data,n)).forEach(n =>
    desagregation(data,n.idNode, Object.keys(n.dimensions).length == 1 ? 'Primaire' : Object.keys(n.dimensions).filter(dim=>dim !== 'Primaire')[0], true )
  )
  


  data.width = width + h_space
  
  reorganize_all_input_outputLinksId(data,data.nodes, data.links)
  set_is_computing(false)
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

export const synchronizeNodesandLinksId = (
  dataModify: SankeyData,
  dataRef: SankeyData
) => {
  //- Stores a mapping between idNode of initial data and layout idNodes
  const idNodesMap: {[s:string]:string} = {}
  Object.values(dataModify.nodes).forEach( nodeModify => {
    const nodesRef = Object.values(dataRef.nodes).filter(nodeRef=>normalize_name(nodeModify.name) === normalize_name(nodeRef.name))
    if (nodesRef.length === 0) {
      idNodesMap[nodeModify.idNode] = nodeModify.idNode
      return
    }
    const nodeRef = nodesRef[0]
    idNodesMap[nodeModify.idNode] = nodeRef.idNode
  })
  Object.values(dataModify.nodes).forEach(nodeModify=>{
    nodeModify.idNode=idNodesMap[nodeModify.idNode]
    Object.keys(nodeModify.dimensions).forEach(dim => {
      if (nodeModify.dimensions[dim].parent_name) {
        nodeModify.dimensions[dim].parent_name = idNodesMap[nodeModify.dimensions[dim].parent_name??0]
      }
    })})
  dataModify.nodes = Object.assign({}, ...Object.values(dataModify.nodes).map(n => ({ [n.idNode]: { ...n } })))

  Object.values(dataModify.links).forEach(lModify=>{
    lModify.idSource=idNodesMap[lModify.idSource]
    lModify.idTarget=idNodesMap[lModify.idTarget]    
  })

  //- Stores a mapping between idLink of initial data and layout idLinks
  const idLinksMap: {[s:string]:string} = {}
  const links_with_no_match : SankeyLink [] = []
  Object.values(dataModify.links).forEach( lModify => {
    const lRef = dataRef.links[lModify.idLink]
    if (!lRef || lRef.idSource !== lModify.idSource || lRef.idTarget !== lModify.idTarget) {
      links_with_no_match.push(lModify)
      return
    }
    idLinksMap[lModify.idLink] = lRef.idLink
  })
  links_with_no_match.forEach( l => {       
    const linksRef = Object.values(dataRef.links).filter(lRef => 
      l.idSource === lRef.idSource && l.idTarget === lRef.idTarget
    )
    if (linksRef.length === 0) {
      idLinksMap[l.idLink] = l.idSource+'---'+l.idTarget
      return
    }
    const layout_link = linksRef[0]
    idLinksMap[l.idLink] = layout_link.idLink
  })

  const newLinkZIndex : string[]= []
  dataModify.linkZIndex.forEach(idLink=>newLinkZIndex.push(idLinksMap[idLink]))
  dataModify.linkZIndex = newLinkZIndex

  Object.values(dataModify.links).forEach(l=>l.idLink=idLinksMap[l.idLink])
  dataModify.links = Object.assign({}, ...Object.values(dataModify.links).map(lModify => ({ [lModify.idLink]: { ...lModify } })))

  compute_default_input_outputLinksId(dataModify.nodes, dataModify.links)
}

export const updateLayout = (
  data: SankeyData,
  new_layout: SankeyData,
  mode:string[]
) => {

  synchronizeNodesandLinksId(data, new_layout)
  /* eslint-disable */
  // @ts-ignore
  const deep_diff = require('deep-diff')
  /* eslint-enable */
  
  if(mode.includes('attrGeneral')) {
    let difference = deep_diff.diff(data, new_layout)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => d.kind === 'E' && d.path.length ===1 )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data, {}, diff))
    }
  }

  if(mode.includes('addNode')) {
    let difference = deep_diff.diff(data.nodes, new_layout.nodes)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => (d.kind === 'N') && d.path.length ===1 )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.nodes, {}, diff))
    }
  }
  if(mode.includes('removeNode')) {
    let difference = deep_diff.diff(data.nodes, new_layout.nodes)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => (d.kind === 'D') && d.path.length ===1 )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.nodes, {}, diff))
    }
  }

  if(mode.includes('addFlux')) {
    let difference = deep_diff.diff(data.links, new_layout.links)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => (d.kind === 'N') && d.path.length ===1 )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.links, {}, diff))
    }
  }

  if(mode.includes('removeFlux')) {
    let difference = deep_diff.diff(data.links, new_layout.links)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => (d.kind === 'D') && d.path.length ===1 )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.links, {}, diff))
    }
  }

  if(mode.includes('posNode')){
    let difference = deep_diff.diff(data.nodes, new_layout.nodes)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => d.kind === 'E' && ['x','y','x_label','y_label'].includes(d.path[1]) )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.nodes, {}, diff))
    }  
  }

  if (mode.includes('posFlux')) {
    const geometry_attributes = [    
      'orientation',
      'left_horiz_shift',
      'right_horiz_shift',
      'vert_shift',
      'curvature',
      'curved',
      'recycling',
      'arrow_size',
      // Geometry link labels
      'x_label',
      'y_label',  
      'label_position',
      'orthogonal_label_position',
      'label_on_path'
    ]
    let difference = deep_diff.diff(data.links, new_layout.links)
    if (difference) {
      difference = difference.filter((d :{path:string[],kind:string}) => 
        (d.kind === 'D' || d.kind === 'N') && d.path.length === 3 && d.path[1] === 'local' && geometry_attributes.includes(d.path[2]) ||
      (d.kind === 'E' && geometry_attributes.includes(d.path[1]))
      )
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.links, {}, diff))
    }
    Object.entries(data.nodes).forEach( ([key,node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }
      const commonInputLinksId = layoutNode.inputLinksId.filter(id=>node.inputLinksId.indexOf(id) !== -1)
      let justInNode = node.inputLinksId.filter(id=>layoutNode.inputLinksId.indexOf(id) === -1)
      const newInputLinksId = commonInputLinksId.concat(justInNode)
      node.inputLinksId = newInputLinksId
      const commonOutputLinksId = layoutNode.outputLinksId.filter(id=>node.outputLinksId.indexOf(id) !== -1)
      justInNode = node.inputLinksId.filter(id=>layoutNode.inputLinksId.indexOf(id) === -1)
      const newOutputLinksId = commonOutputLinksId.concat(justInNode)
      node.outputLinksId = newOutputLinksId
    })
  }

  if (mode.includes('attrNode')) {
    Object.entries(data.nodes).forEach( ([key,node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }
      if (!node.local) {
        node.local = {}
      }
      if (!layoutNode.local) {
        layoutNode.local = {}
      }
      const difference = deep_diff.diff(node.local, layoutNode.local)
      if (difference) {
        difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(node.local, {}, diff))
      } 
    })
  }
  if (mode.includes('attrFlux')){
    Object.entries(data.links).forEach( ([key,link]) => {
      const layoutLink = new_layout.links[key]
      if (!layoutLink) {
        return
      }
      if (!link.local) {
        link.local = {}
      }
      if (!layoutLink.local) {
        layoutLink.local = {}
      }
      const difference = deep_diff.diff(link.local, layoutLink.local)
      if (difference) {
        difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(link.local, {}, diff))
      }  
    })
  }

  if (mode.includes('Values')){
    Object.entries(data.links).forEach( ([key,link]) => {
      const layoutLink = new_layout.links[key]
      if (!layoutLink) {
        return
      }
      const difference = deep_diff.diff(link.value, layoutLink.value)
      if (difference) {
        difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(link.value, {}, diff))
      }  
    })
  }

  if (mode.includes('tagLevel')) {
    const difference = deep_diff.diff(data.levelTags, new_layout.levelTags)
    if (difference) {
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.levelTags, {}, diff))
    }
  }
  if (mode.includes('tagNode')) {
    const difference = deep_diff.diff(data.nodeTags, new_layout.nodeTags)
    if (difference) {
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.nodeTags, {}, diff))
    }
    Object.entries(data.nodes).forEach( ([key,node]) => {
      const layoutNode = new_layout.nodes[key]
      if (!layoutNode) {
        return
      }
      const difference = deep_diff.diff(node.tags, layoutNode.tags)
      if (difference) {
        difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(node.tags, {}, diff))
      } 
    })
  }
  if(mode.includes('tagFlux')){
    const difference = deep_diff.diff(data.fluxTags, new_layout.fluxTags)
    if (difference) {
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.fluxTags, {}, diff))
    }
  }

  if(mode.includes('tagData')){
    const difference = deep_diff.diff(data.dataTags, new_layout.dataTags)
    if (difference) {
      difference.forEach((diff :{path:string[],kind:string}) => deep_diff.applyChange(data.dataTags, {}, diff))
    }
  }
  
}

export const desagregation = (
  data: SankeyData,   
  idNode: string, 
  cur_dimension: string,
  compute_auto_sankey=false
) => {
  const dim_desagregate_nodes = Object.values(data.nodes).filter( n => n.dimensions[cur_dimension] && n.dimensions[cur_dimension].parent_name === idNode )
  if (dim_desagregate_nodes.length == 0) {
    return
  }
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  const nb_desagregated = dim_desagregate_nodes.length
  let nodes_heights = 0
  dim_desagregate_nodes.forEach(n=>nodes_heights+=nodeHeight(n,data,inv_scale,scale,getLinkValue))
  const start_point = data.nodes[idNode].y+nodeHeight(data.nodes[idNode],data,inv_scale,scale,getLinkValue)/2 - (data.v_space*0.9+nodes_heights)/2
  let delta_y = 0
  dim_desagregate_nodes.forEach(n => {
    if ((n.x === undefined || (n.x === 0 || n.y === 0)) && (data.nodes[idNode].x !==0 && data.nodes[idNode].y !==0 )) {
      n.x = data.nodes[idNode].x
      n.y = start_point + delta_y
    }
    delta_y += data.v_space*0.9 / (nb_desagregated-1) + nodeHeight(n,data,inv_scale,scale,getLinkValue)

    if(n.local==undefined || n.local==null) {
      n.local = {}
    }
    setLocalAgregation(n, data, true)
    if (compute_auto_sankey) {
      if (n.outputLinksId.length === 0) {
        assign_node_local_attribute(n,'label_horiz', 'right')
        assign_node_local_attribute(n,'label_vert', 'middle')
      } else if (n.inputLinksId.length === 0) {
        assign_node_local_attribute(n,'label_horiz', 'left')
        assign_node_local_attribute(n,'label_vert', 'middle')
      } else {
        assign_node_local_attribute(n,'label_horiz', 'left')
        assign_node_local_attribute(n,'label_vert', 'middle')
        assign_node_local_attribute(n,'label_background', true)        
      }
    }
  })
  const clicked_node=data.nodes[idNode]
  if(clicked_node.local==undefined || clicked_node.local==null) {
    clicked_node.local = {}
  }
  setLocalAgregation(clicked_node, data, false)
  if (compute_auto_sankey && nb_desagregated > 0) {
    agregation(data,dim_desagregate_nodes[0].idNode,cur_dimension)
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
    if(n.local==undefined || n.local==null) {
      n.local = {}
    }
    setLocalAgregation(n, data, false)
  })
  mean_x = mean_x/dim_desagregated_nodes.length
  mean_y = mean_y/dim_desagregated_nodes.length

  if (parent_node.x === undefined || (parent_node.x === 0 && parent_node.y === 0) ) {
    parent_node.x = mean_x
    parent_node.y = mean_y
  }
  if(parent_node.local==undefined || parent_node.local==null){
    parent_node.local={}
  }
  setLocalAgregation(parent_node, data, true)
}

const AgregationModalPropTypes = {
  data : PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data : PropTypes.func.isRequired,
  agregation_node : PropTypes.string.isRequired,
  set_agregation_node : PropTypes.func.isRequired,
  set_show_agregation : PropTypes.func.isRequired,
  show_agregation : PropTypes.bool.isRequired,
  is_agregation: PropTypes.bool.isRequired
}

type  AgregationModalTypes = InferProps<typeof  AgregationModalPropTypes>

export const AgregationModal : FunctionComponent<AgregationModalTypes> = (
  {data, set_data, agregation_node,set_agregation_node, set_show_agregation,show_agregation,is_agregation}
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
                    value={dim_name}
                  >
                    {dim_names.map(
                      (cur_dir_name, i) => <option key={i} value={cur_dir_name}>{cur_dir_name}</option>
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
          set_agregation_node('')
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
                    value={dim_name}
                  >
                    {dim_names.map(
                      (cur_dim_name, i) => <option key={i} value={cur_dim_name} >{cur_dim_name}</option>
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

const setLocalAgregation = (
  n: SankeyNode, 
  data: SankeyData,
  local_aggregation: boolean
) => {
  if (!n.local) {
    n.local={}
  }
  n.local['local_aggregation'] = local_aggregation
  n.inputLinksId.forEach(linkId => {
    const node_types = data.nodes[data.links[linkId].idSource].tags['Type de noeud']
    if (node_types && node_types.includes('echange')) {
      data.nodes[data.links[linkId].idSource].local = { local_aggregation: local_aggregation }
    }
  })
  n.outputLinksId.forEach(linkId => {
    const node_types = data.nodes[data.links[linkId].idTarget].tags['Type de noeud']
    if (node_types && node_types.includes('echange')) {
      data.nodes[data.links[linkId].idTarget].local = { local_aggregation: local_aggregation }
    }
  })
}

import { SankeyNode, SankeyLink, SankeyData, SankeyDataPropTypes } from './types'
import { convert_data } from './SankeyConvert'
import { findMaxLinkValue } from './SankeyUtils'
import React,{ FunctionComponent } from 'react'
import PropTypes, { InferProps } from 'prop-types'
import { Modal, Form, Row, Col, Button } from 'react-bootstrap'

export const reorganize_node_inputLinksId = (
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
    if (n1Id !== n2Id) {
      const n1 = nodes[n1Id]
      const n2 = nodes[n2Id]
      if (n2.position == 'relative') {
        return 1
      }
      if (n1.position == 'relative') {
        return -1
      }
      if ( l1.recycling && !l2.recycling) {
        if (l1.vert_shift && l1.vert_shift < 0) {
          return -1
        }
        return 1        
      }
      if ( !l1.recycling && l2.recycling) {
        if (l2.vert_shift && l2.vert_shift < 0) {
          return 1
        }
        return -1       
      } 
      if (l1.orientation === 'vh' && l2.orientation === 'vh' || l1.orientation === 'vv' && l2.orientation === 'vv') {
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
    if (n1Id !== n2Id) {
      const n1 = nodes[n1Id]
      const n2 = nodes[n2Id]
      if (n2.position == 'relative') {
        return -1
      }
      if (n1.position == 'relative') {
        return 1
      }
      if ( l1.recycling && !l2.recycling) {
        if (l1.vert_shift && l1.vert_shift < 0) {
          return 1
        }
        return -1        
      }
      if ( !l1.recycling && l2.recycling) {
        if (l2.vert_shift && l2.vert_shift < 0) {
          return 1
        }
        return -1       
      }      
      if (l1.orientation === 'vh' && l2.orientation === 'vh' || l1.orientation === 'vv' && l2.orientation === 'vv') {
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
  node: SankeyNode,
  input: boolean,
  output: boolean,
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {

  if (input) {
    reorganize_node_inputLinksId(node, nodes, links)
  }
  if (output) {
    reorganize_node_outputLinksId(node, nodes, links)
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
  ref_links: { [link_id : string]:SankeyLink},
  data: SankeyData
) => {
  const display_nodes = data.nodes
  const display_links = data.links

  Object.values(ref_nodes).forEach(
    (ref_node) => {
      const nodes_found = Object.values(display_nodes).filter(
        n=> {
          return normalize_name(ref_node.name) === normalize_name(n.name) 
        }
      )
      if (nodes_found.length === 0) {
        return
      }
      const node = nodes_found[0]
      const new_inputLinksId: string[] = []
      ref_node.inputLinksId.forEach(
        (idLink) => {
          const ref_link = ref_links[idLink]
          if (ref_link === undefined) {
            return
          }
          const links = Object.values(display_links).filter(
            l=> {
              return normalize_name(data.nodes[l.idSource].name) === normalize_name(ref_nodes[ref_link.idSource].name) && 
                     normalize_name(data.nodes[l.idTarget].name) === normalize_name(ref_nodes[ref_link.idTarget].name)
            }
          )
          if (links.length === 0) {
            return
          }
          new_inputLinksId.push(links[0].idLink)
        }
      )
      node.inputLinksId = new_inputLinksId //result_inputLinksId.filter(function (item, pos) {return node.inputLinksId.indexOf(item) == pos})
      const new_outputLinksId: string[] = []
      ref_node.outputLinksId.forEach(
        (idLink) => {
          const ref_link = ref_links[idLink]
          if (ref_link === undefined) {
            return
          }
          const links = Object.values(display_links).filter(
            l => {
              return normalize_name(data.nodes[l.idSource].name) === normalize_name(ref_nodes[ref_link.idSource].name) && 
                     normalize_name(data.nodes[l.idTarget].name) === normalize_name(ref_nodes[ref_link.idTarget].name)
            }
          )
          if (links.length === 0) {
            return
          }
          new_outputLinksId.push(links[0].idLink)
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
  nodes: { [node_id : string]:SankeyNode}
) => {
  let no_input_link = true
  let highest_branch_length = current_length
  Object.values(links).forEach(link => {
    if (link.idTarget === idNode && nodes[link.idSource].node_visible ) {
      if (visited_nodes.indexOf(idNode) === -1) {
        no_input_link = false
        const branch_length = explore_branch(link.idSource, current_length + 1, [...visited_nodes,idNode], links,nodes)
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
    if ( !node.node_visible || node.position === 'relative' ) {
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
  data.user_scale = max_link_value

  const vspace = data.v_space
  const horizontal_indices: { [node_id:string]:number} = {}
  Object.values(data.nodes).filter(n=>n.node_visible).forEach(node => {
    const horizontal_index = explore_branch(node.idNode, 0, [], data.links, data.nodes)
    horizontal_indices[node.idNode] = horizontal_index
    if (horizontal_index > max_horizontal_index) {
      max_horizontal_index = horizontal_index
    }
  })
  Object.values(data.links).filter(l=>data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible).forEach(l => {
    if (horizontal_indices[l.idSource] >= horizontal_indices[l.idTarget]) {
      l.recycling = true
    }
  })

  const width = max_horizontal_index * h_space


  Object.values(data.nodes).forEach(node => {
    if (!node.node_visible) {
      return
    }
    node.x = 50 + horizontal_indices[node.idNode] / max_horizontal_index * width //* 0.9
  })

  // Reorder links using the x of source name as criteria 
  // Compute input_outputLinksId
  Object.values(data.nodes).filter(n=>n.node_visible).forEach(n => data.nodes[n.idNode] = {...n})
  compute_default_input_outputLinksId(data.nodes, data.links)

  // Vertical position of vertical nodes
  // compute total height of nodes that belong to the same column, then compute the spaces between them and their positions.
  let max_vertical_offset = 0
  for (let i = 0; i <= max_horizontal_index; i++) {
    let vertical_space: number
    let vertical_offset = 0
    const the_nodes = Object.values(data.nodes).filter(n => n.node_visible && horizontal_indices[n.idNode] === i)
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
    const the_nodes = Object.values(data.nodes).filter(n => n.node_visible && horizontal_indices[n.idNode] === i)
    let total_nb_outputLinksId_up = 0
    let total_nb_outputLinksId_down = 0
    the_nodes.forEach((node) => {
      node.outputLinksId.forEach(
        (idLink) => {
          if ( data.nodes[data.links[idLink].idSource].node_visible && data.nodes[data.links[idLink].idTarget].node_visible ) {
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
          if ( data.nodes[data.links[idLink].idSource].node_visible && data.nodes[data.links[idLink].idTarget].node_visible ) {
            const target_node = data.nodes[data.links[idLink].idTarget]
            if (target_node === undefined ) {
              return
            }
            if ( target_node.y < node.y ) {
              data.links[idLink].left_horiz_shift = data.left_shift + (current_output_link_up/total_nb_outputLinksId_up)*data.max_shift
              data.links[idLink].right_horiz_shift = data.right_shift + (current_output_link_up/total_nb_outputLinksId_up)*data.max_shift
              current_output_link_up += 1
            } else {
              data.links[idLink].left_horiz_shift = data.left_shift - (current_output_link_down/total_nb_outputLinksId_down)*data.max_shift
              data.links[idLink].right_horiz_shift = data.right_shift - (current_output_link_down/total_nb_outputLinksId_down)*data.max_shift
              current_output_link_down += 1
            }

          }
        }
      )
    })
  }
  

  data.width = width + h_space
  
  reorganize_all_input_outputLinksId(data.nodes, data.links)

  return []
}

export const reorganize_all_input_outputLinksId = (
  nodes: { [idNode:string]:SankeyNode},
  links: { [idLink:string]:SankeyLink}
) => {
  Object.values(nodes).forEach( node => {
    reorganize_node_inputLinksId(node, nodes, links)
    reorganize_node_outputLinksId(node, nodes, links)
  })
}

export const updateLayout = (
  data: SankeyData,
  new_layout: SankeyData
) => {
  convert_data(new_layout)

  let max_vertical_offset = 0
  const compute_offset = (node: SankeyNode) => {
    if (!node.node_visible) {
      return
    }
    max_vertical_offset = Math.max(node.y, max_vertical_offset)
  }
  Object.values(data.nodes).forEach(compute_offset)
  max_vertical_offset = max_vertical_offset + 200

  //data.node_width = new_layout.node_width
  // Apply nodes layout
  for (const node_layout_key in new_layout.nodes) {
    const node_layout = new_layout.nodes[node_layout_key]
    const nodes = Object.values(data.nodes).filter(n=>normalize_name(n.name) === normalize_name(node_layout.name) )
    let node : SankeyNode | undefined
    if (nodes.length === 0) {
      if (node_layout.inputLinksId.length === 0 && node_layout.outputLinksId.length === 0 && node_layout.shape_visible === false && node_layout.label_visible === true) {
        // Case of not a label
        node = {...node_layout}
        // Méthode pour incrementer idNode
        const listId : number[] = []
        Object.keys(data.nodes).forEach(elt => listId.push(Number(elt.replace('node', ''))))
        const idNode = listId.length > 0 ? Math.max(...listId) + 1 : 0
        node.idNode = 'idNode'
        data.nodes[node.idNode]
      } else {
        continue
      }
    }
    node = nodes[0]
    if (!node) {
      continue
    }

    node.name = node_layout.name
    node.node_width = node_layout.node_width
    node.node_height = node_layout.node_height    
    node.x = node_layout.x
    node.y = node_layout.y
    if (node.y + 200 > max_vertical_offset) {
      max_vertical_offset = node.y + 200
    }
    node.x_label = node_layout.x_label
    node.y_label = node_layout.y_label

    node.display_style = {...node_layout.display_style}

    node.iconName = node_layout.iconName ? node_layout.iconName : node.iconName
    node.iconColor = node_layout.iconColor ? node_layout.iconColor : node.iconColor
    node.iconRatio = node_layout.iconRatio ? node_layout.iconRatio : node.iconRatio
    node.iconVisible= node_layout.iconVisible ? node_layout.iconVisible : node.iconVisible

    node.colorTag = node_layout.colorTag
    node.colorParameter = node_layout.colorParameter
    node.color = node_layout.color

    // for (const node_tag_key in node_layout.tags) {
    //   node.tags[node_tag_key] = JSON.parse(JSON.stringify(node_layout.tags[node_tag_key]))
    // }
    
    node.shape_visible = node_layout.shape_visible
    node.node_visible = node_layout.node_visible
    node.label_visible = node_layout.label_visible
  }
  apply_input_outputLinksId(
    new_layout.nodes,
    new_layout.links,
    data
  )


  for (const link_layout_key in new_layout.links) {
    const link_layout = new_layout.links[link_layout_key]
    const links = Object.values(data.links).filter(
      l=> {
        return normalize_name(data.nodes[l.idSource].name) === normalize_name(new_layout.nodes[link_layout.idSource].name) && 
        normalize_name(data.nodes[l.idTarget].name) === normalize_name(new_layout.nodes[link_layout.idTarget].name)
      }
    )


    if (links.length === 0) {
      continue
    }
    const link = links[0]

    const { x_label, y_label, label_position, label_visible, recycling, curved, curvature, arrow,orthogonal_label_position,gradient } = link_layout
    link.curvature = curvature
    link.curved = curved
    link.arrow = arrow
    link.text_color = link_layout.text_color
    link.label_position = label_position
    link.label_visible = label_visible
    link.x_label = x_label
    link.y_label = y_label
    link.left_horiz_shift = link_layout.left_horiz_shift
    link.right_horiz_shift = link_layout.right_horiz_shift
    link.orientation = link_layout.orientation
    link.recycling = recycling
    link.orthogonal_label_position = orthogonal_label_position
    link.gradient = gradient

    link.colorTag = link_layout.colorTag
    link.colorParameter = link_layout.colorParameter

    if (link_layout.vert_shift) {
      link.left_horiz_shift = link_layout.left_horiz_shift
      link.right_horiz_shift = link_layout.right_horiz_shift
      link.vert_shift = link_layout.vert_shift
    }
  }

  // for (const tag_group_key in new_layout.nodeTags) {
  //   data.nodeTags[tag_group_key] = JSON.parse(JSON.stringify(new_layout.nodeTags[tag_group_key]))
  //   // if (tag_group_key in new_layout.nodeTags) {
  //   //   data.nodeTags[tag_group_key].color_map = new_layout.nodeTags[tag_group_key].color_map
  //   //   for ( const tag_key in data.nodeTags[tag_group_key].tags) {
  //   //     data.nodeTags[tag_group_key].tags[tag_key].color = new_layout.nodeTags[tag_group_key].tags[tag_key].color
  //   //   }
  //   // }
  // }
  // for (const tag_group_key in new_layout.fluxTags) {
  //   data.fluxTags[tag_group_key] = JSON.parse(JSON.stringify(new_layout.fluxTags[tag_group_key]))
  // }

  data.icon_catalog = new_layout.icon_catalog
  Object.assign(data.labels,new_layout.labels)
  data.colorMap = new_layout.colorMap
  data.user_scale = new_layout.user_scale
  data.legend_position = new_layout.legend_position;
  ((data as unknown) as {welcome_text:string}).welcome_text = ((new_layout as unknown)  as {welcome_text:string}).welcome_text

  if ('width' in new_layout) {
    data.width = new_layout.width
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

export const desagregation = (
  data: SankeyData,   
  idChildNode: string, 
  cur_dimension: string,
  control_display = true
) => {
  console.log('--')

  const idParent = data.nodes[idChildNode].dimensions[cur_dimension].parent_name
  if (!idParent) {
    return
  }
  const desagregate_nodes = Object.values(data.nodes).filter( n => n.dimensions[cur_dimension] && n.dimensions[cur_dimension].parent_name === idParent )
  if (control_display) {
    desagregate_nodes.forEach( n => {
      n.display = true
      n.node_visible = true
    })
  }
  const nb_desagregated = desagregate_nodes.length
  let current_y = data.v_space/2
  const delta_y = data.v_space / (nb_desagregated-1)
  desagregate_nodes.forEach(n => {
    if (n.x === undefined || (n.x === 0 && n.y === 0)) {
      n.x = data.nodes[idParent].x
      n.y = data.nodes[idParent].y - current_y
    }
    current_y = current_y - delta_y
  })
  if (control_display) {
    // Hides agregated nodes
    data.nodes[idParent].display = false
    data.nodes[idParent].node_visible = false
  }
}

export const agregation = (
  data : SankeyData, 
  idParent: string,
  cur_dimension: string,
  control_display = true
) =>  {
  const agregated_node = data.nodes[idParent]    
  const desagregate_nodes = Object.values(data.nodes).filter( n => n.dimensions[cur_dimension] && n.dimensions[cur_dimension].parent_name === agregated_node.idNode )

  if (desagregate_nodes.length === 0) {
    return
  }
  if (control_display) {
    // show agregated node
    agregated_node.display = true
    agregated_node.node_visible = true
  }

  let mean_x = 0
  let mean_y = 0
  desagregate_nodes.forEach(n => {
    if (control_display) {
      data.nodes[n.idNode].display = false
      data.nodes[n.idNode].node_visible = false
    }
    if (n.x) {
      mean_x += n.x  
      mean_y += n.y
    }
  })
  mean_x = mean_x/desagregate_nodes.length
  mean_y = mean_y/desagregate_nodes.length

  if (agregated_node.x === undefined || (agregated_node.x === 0 && agregated_node.y === 0) ) {
    agregated_node.x = mean_x
    agregated_node.y = mean_y
  }
}

const AgregationModalPropTypes = {
  data : PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data : PropTypes.func.isRequired,
  parent_names : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  dimension_names : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  set_show_agregation : PropTypes.func.isRequired,
  show_agregation : PropTypes.bool.isRequired,
  is_agregation: PropTypes.bool.isRequired
}

type  AgregationModalTypes = InferProps<typeof  AgregationModalPropTypes>

export const AgregationModal : FunctionComponent<AgregationModalTypes> = (
  {data, set_data, parent_names, dimension_names, set_show_agregation,show_agregation,is_agregation}
) => {
  let idParent = parent_names[0]

  return (
    <Modal 
      show={show_agregation} 
      onHide={ () => set_show_agregation(false) } >
      <Modal.Header closeButton>
        <Modal.Title>{is_agregation ? 'Noeuds agrégation' : 'Noeuds desagrégation'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Row>
              <Col>    
                <Form.Select
                  onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=> idParent = evt.target.value}
                >
                  {parent_names.map(
                    (curIdParent, i) => <option key={i} value={curIdParent} selected={idParent === curIdParent} >{data.nodes[curIdParent].name}</option>
                  )}
                </Form.Select>
              </Col>
            </Row>      
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={()=> {
            if (is_agregation) {
              agregation(data,idParent,dimension_names[parent_names.indexOf(idParent)])
            } else {
              desagregation(data,idParent,dimension_names[parent_names.indexOf(idParent)])
            }
            set_data({...data})
            set_show_agregation(false)
          }}
        >{is_agregation ? 'Agrégation' : 'Désagrégation'}</Button>
        <Button variant="secondary" onClick={() => set_show_agregation(false)}>Annuler</Button>
      </Modal.Footer>
    </Modal>
  )
}
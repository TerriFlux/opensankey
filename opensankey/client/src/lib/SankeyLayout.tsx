import { SankeyNode, SankeyLink, SankeyData, } from './types'
import { find_link, find_node, normalize_name } from './SankeyUtils'
import { convert_data } from './SankeyConvert'
import * as d3 from 'd3'

interface ExtendedSankeyLink {
  target?: number
  source?: number
}

export const reorganize_node_input_links = (
  node: SankeyNode,
  nodes: SankeyNode[],
  links: SankeyLink[]
) => {
  const input_links = links.filter(
    l => l.target_name === node.name
  )
  const input_links_indices: number[] = []
  input_links.forEach(
    ol => {
      const idx = links.indexOf(ol)
      input_links_indices.push(idx)
    }
  )

  node.input_links = input_links_indices
  node.input_links.sort((l1, l2) => {
    const l1_index = node.input_links.indexOf(l1)
    const l2_index = node.input_links.indexOf(l2)
    const link1 = links[node.input_links[l1_index]]
    const link2 = links[node.input_links[l2_index]]
    if (link1 === undefined || link2 === undefined) {
      return 1
    }
    const n1_name = links[node.input_links[l1_index]].source_name
    const n2_name = links[node.input_links[l2_index]].source_name
    if (n1_name !== n2_name) {
      const n1 = find_node(n1_name, nodes)
      const n2 = find_node(n2_name, nodes)
      if (n1 && n2 && n1.y < n2.y) {
        return -1
      }
      return 1
    } else {
      const n1 = find_node(n1_name, nodes)
      if (n1) {
        const output_l1_index = n1.output_links.indexOf(l1)
        const output_l2_index = n1.output_links.indexOf(l2)
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
}

export const reorganize_node_output_links = (
  node: SankeyNode,
  nodes: SankeyNode[],
  links: SankeyLink[]
) => {
  const output_links = links.filter(
    l => l.source_name === node.name
  )
  const output_links_indices: number[] = []

  output_links.forEach(
    ol => {
      const idx = links.indexOf(ol)
      output_links_indices.push(idx)
    }
  )

  node.output_links = output_links_indices
  node.output_links.sort((l1, l2) => {
    const l1_index = node.output_links.indexOf(l1)
    const l2_index = node.output_links.indexOf(l2)
    const link1 = links[node.output_links[l1_index]]
    const link2 = links[node.output_links[l2_index]]
    if (link1 === undefined || link2 === undefined) {
      return 1
    }
    const n1_name = links[node.output_links[l1_index]].target_name
    const n2_name = links[node.output_links[l2_index]].target_name
    if (n1_name !== n2_name) {
      const n1 = find_node(n1_name, nodes)
      const n2 = find_node(n2_name, nodes)
      if (n1 && n2 && n1.y < n2.y) {
        return -1
      }
      return 1
    } else {
      const n1 = find_node(n1_name, nodes)
      if (n1) {
        const input_l1_index = n1.input_links.indexOf(l1)
        const input_l2_index = n1.input_links.indexOf(l2)
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
}

export const reorganize_input_links = (
  node_id: number,
  input: boolean,
  output: boolean,
  nodes: SankeyNode[],
  links: SankeyLink[]
) => {
  const node = nodes[node_id]

  if (input) {
    reorganize_node_input_links(node, nodes, links)
  }
  if (output) {
    reorganize_node_output_links(node, nodes, links)
  }
}

export const reorder_links = (
  nodes: SankeyNode[],
  links: SankeyLink[]
) => {
  const prev_link = [...links]
  const new_links = prev_link.sort(
    (l1, l2) => {
      const node1 = nodes.filter(n => normalize_name(n.name) === normalize_name(l1.source_name))[0]
      const node2 = nodes.filter(n => normalize_name(n.name) === normalize_name(l2.source_name))[0]
      if (node1.x < node2.x) {
        return -1
      } else {
        return 1
      }
    }
  )
  links = [...new_links]
}

export const compute_default_input_output_links = (
  nodes: SankeyNode[],
  links: SankeyLink[]
) => {
  nodes.forEach(node => {
    node.input_links = []
    node.output_links = []
    links.forEach((link, link_id) => {
      if (normalize_name(link.target_name) === normalize_name(node.name)) {
        node.input_links.push(link_id)
      }
      if (normalize_name(link.source_name) === normalize_name(node.name)) {
        node.output_links.push(link_id)
      }
    })
  })
}

export const apply_input_output_links = (
  ref_nodes: SankeyNode[],
  ref_links: SankeyLink[],
  data: SankeyData
) => {
  const { nodes, links } = data
  const display_nodes : SankeyNode[] = nodes.filter( n=> n.display )
  const display_links : SankeyLink[] = links.filter( l=> {
    const source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    return source_node.display &&  target_node.display
  })

  ref_nodes.forEach(
    (ref_node) => {
      const node = display_nodes.filter(n2 => normalize_name(n2.name) === normalize_name(ref_node.name))[0]
      if (node === undefined) {
        return
      }
      const new_input_links: number[] = []
      ref_node.input_links.forEach(
        (link_id) => {
          const ref_link = ref_links[link_id]
          if (ref_link === undefined) {
            return
          }
          const link_and_idx = find_link(
            ref_link.source_name,
            ref_link.target_name,
            display_links
          )
          if (link_and_idx === undefined) {
            return
          }
          new_input_links.push(link_and_idx[1] as number)
        }
      )
      const result_input_links = node.input_links.concat(new_input_links)
      node.input_links = result_input_links.filter(function (item, pos) {return node.input_links.indexOf(item) == pos})
      const new_output_links: number[] = []
      ref_node.output_links.forEach(
        (link_id) => {
          const ref_link = ref_links[link_id]
          if (ref_link === undefined) {
            return
          }
          const link_and_idx = find_link(
            ref_link.source_name,
            ref_link.target_name,
            display_links
          )
          if (link_and_idx === undefined) {
            return
          }
          new_output_links.push(link_and_idx[1] as number)
        }
      )
      const result_output_links = node.output_links.concat(new_output_links)
      node.output_links = result_output_links.filter(function (item, pos) {return node.output_links.indexOf(item) == pos})
    }
  )
}

export const explore_branch = (
  node_name: string,
  current_length: number,
  visited_nodes: string[],
  //trade_sectors: string[],
  links: (SankeyLink & ExtendedSankeyLink)[],
  nodes: SankeyNode[]
) => {
  let no_input_link = true
  let highest_branch_length = current_length
  links.forEach(link => {
    if (link.target_name === node_name && link.source !== undefined && nodes[link.source].visible ) {
      //if (link.target === node_id && !trade_sectors.includes(link.source_name) ) {
      //if (link.target === node_id ) {
      // if the node has never been visited, continue to explore the branch, otherwise stop (for recycling flows).
      if (visited_nodes.indexOf(node_name) === -1) {
        no_input_link = false
        const new_visited_nodes = visited_nodes.slice()
        new_visited_nodes.push(node_name)
        const branch_length = link.source !== undefined && link.source !== null ? explore_branch(link.source_name, current_length + 1, new_visited_nodes, links,nodes) : 0
        //const branch_length = link.source !== undefined && link.source !== null ? explore_branch(link.source, current_length + 1, new_visited_nodes,trade_sectors,region_name,links) : 0
        if (branch_length > highest_branch_length) {
          highest_branch_length = branch_length
        }
      }
    }
  })
  //    console.log('end_explore: ' + node_id);
  if (no_input_link === true) {
    return current_length
  }
  else {
    return highest_branch_length
  }
}

export const arrangeNodes = (
  data: SankeyData,
  h_space: number,
  v_space: number
) => {
  //const { nodes } = data
  const display_nodes : SankeyNode[] = data.nodes.filter( n=> n.display )
  display_nodes.forEach(node => {
    if ( !node.visible ) {
      return
    }
    const x = Math.round(node.x / h_space) * h_space
    const y = Math.round(node.y / v_space) * v_space
    node.x = x
    node.y = y
  })
}

export const compute_auto_sankey = (
  data: SankeyData,
  h_space : number
) => {
  //const { nodes, links } = data
  const display_nodes : SankeyNode[] = data.nodes.filter( n=> n.display )
  const display_links : SankeyLink[] = data.links.filter( l=> {
    const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    return source_node.display &&  target_node.display
  })

  const extended_links = display_links as (SankeyLink & ExtendedSankeyLink)[]
  //sankey.update_scale(data.user_scale)
  // var alerte = false
  // var message = ''
  let max_node_value = 0
  // Horizontal position of vertical nodes
  let max_horizontal_index = 0
  // var list_of_x_before : number[] = []
  // var list_of_x_after : number[] = []
  // var the_nodes_min : SankeyNode[] = []
  // var the_nodes_max : SankeyNode[] = []  
  // var default_node_size = sankey.get_default_node_size() 

  // if (!positions) {
  //   return
  // }


  // Use a relevant scale
  display_links.forEach(link => link.value.forEach(v => max_node_value = v > max_node_value ? v : max_node_value))
  data.user_scale = max_node_value
  const scale = d3.scaleLinear()
    .domain([0, data.user_scale])
    .range([0, 100])
  const vspace = data.v_space
  //sankey.update_scale(max_node_value)
  //const set_horizontal_indices : Set<number> = new Set()
  extended_links.forEach(l => {
    let n = display_nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    l.source = display_nodes.indexOf(n)
    n = display_nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    l.target = display_nodes.indexOf(n)
  })
  const horizontal_indices: number[] = []
  display_nodes.forEach((node) => {
    const horizontal_index = explore_branch(node.name, 0, [], extended_links,display_nodes)
    //const horizontal_index = explore_branch(node.id, 0, [],trade_sectors,region_name,links)
    horizontal_indices.push(horizontal_index)
    //set_horizontal_indices.add(horizontal_index)
    if (horizontal_index > max_horizontal_index) {
      max_horizontal_index = horizontal_index
    }
  })
  extended_links.forEach(l => {
    if (l.source && l.target && horizontal_indices[l.source] >= horizontal_indices[l.target]) {
      //if (l.source && l.target && horizontal_indices[l.source] >= horizontal_indices[l.target]  && !trade_sectors.includes(l.source_name)) {
      l.recycling = true
    }
    delete l.source
    delete l.target
  })

  const width = max_horizontal_index * h_space
  // const array_horizontal_indices = Array.from(set_horizontal_indices)
  // array_horizontal_indices.sort((a, b) => a - b)
  // nodes.forEach((node)=>{
  //   node.horizontal_index = array_horizontal_indices.indexOf(node.horizontal_index )
  // })

  display_nodes.forEach((node, i) => {
    if (!node.visible) {
      return
    }
    node.x = 50 + horizontal_indices[i] / max_horizontal_index * width //* 0.9
  })

  // Reorder links using the x of source name as criteria 
  // Compute input_output_links

  //reorder_links(nodes, links)
  compute_default_input_output_links(display_nodes, display_links)

  // Vertical position of vertical nodes
  // compute total height of nodes that belong to the same column, then compute the spaces between them and their positions.
  let max_vertical_offset = 0
  for (let i = 0; i <= max_horizontal_index; i++) {
    let vertical_space: number
    let vertical_offset = 0
    const the_nodes = display_nodes.filter((n, ii) => n.visible && horizontal_indices[ii] === i)
    if (the_nodes.length > 1) {
      //vertical_space = (0.6 * height - total_height) / (total_nb - 1)
      vertical_space = vspace //(200 - total_height) / (total_nb - 1)
    }
    else {
      vertical_space = 0
    }

    the_nodes.forEach((node, node_id) => {
      let total_input_offset = 0
      node.input_links.forEach(
        (id) => total_input_offset += +display_links[id].value[0]
      )
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
    const the_nodes = display_nodes.filter((n, ii) => n.visible && horizontal_indices[ii] === i)
    let total_nb_output_links_up = 0
    let total_nb_output_links_down = 0
    the_nodes.forEach((node) => {

      node.output_links.forEach(
        id => {
          if ( display_links[id].visible ) {
            const target_node = display_nodes.filter(n=>normalize_name(n.name) === normalize_name(display_links[id].target_name))[0]
            if (target_node === undefined ) {
              console.log(display_links[id].target_name)
              return
            }
            if ( target_node.y < node.y ) {
              total_nb_output_links_up += 1
            } else {
              total_nb_output_links_down += 1              
            }
          }
        }
      )
    })
    let current_output_link_up = 0
    let current_output_link_down = 0
    the_nodes.forEach(node => {
      node.output_links.forEach(
        id => {
          if ( display_links[id].visible ) {
            const target_node = display_nodes.filter(n=>normalize_name(n.name) === normalize_name(display_links[id].target_name))[0]
            if (target_node === undefined ) {
              console.log(display_links[id].target_name)
              return
            }
            if ( target_node.y < node.y ) {
              display_links[id].left_horiz_shift = data.left_shift + (current_output_link_up/total_nb_output_links_up)*data.max_shift
              display_links[id].right_horiz_shift = data.right_shift + (current_output_link_up/total_nb_output_links_up)*data.max_shift
              current_output_link_up += 1
            } else {
              display_links[id].left_horiz_shift = data.left_shift - (current_output_link_down/total_nb_output_links_down)*data.max_shift
              display_links[id].right_horiz_shift = data.right_shift - (current_output_link_down/total_nb_output_links_down)*data.max_shift
              current_output_link_down += 1
            }

          }
        }
      )
    })
  }
  // Vertical position of horizontal nodes
  // nodes.forEach(node => {
  //   if (node.orientation === 'horizontal') {
  //     if (that.explore_branch(node.id,0,[node.id]) === 0,trade_sectors) {
  //       node.x = 50
  //       node.y = 100//0.05 * height;
  //     }
  //     else {
  //       node.y = max_vertical_offset//0.95 * height;
  //     }
  //   }
  // })
  // Horizontal position of horizontal nodes
  // associate position constraint to each horizontal node and order nodes by constraints   
  // nodes.forEach(node => {
  //   if (node.orientation === 'horizontal') {
  //     if (node.output_links.length > 0) {
  //       var min_x = width
  //       node.output_links.forEach(output_link=>{
  //         var output_node = nodes.filter(n=>normalize_name(n.name)===normalize_name(output_link.target_name))[0]
  //         if (output_node.x < min_x) {
  //           min_x = output_node.x
  //         }
  //       })
  //       node.x_before = min_x
  //       if (list_of_x_before.indexOf(min_x) === -1) {
  //         list_of_x_before.push(min_x)
  //         the_nodes_min[min_x] = []
  //       }
  //       the_nodes_min[min_x].push(node)
  //     }        
  //     else if (node.input_links.length > 0) {
  //       var max_x = 0
  //       node.input_links.forEach(input_link=>{
  //         var input_node = nodes.filter(n=>normalize_name(n.name)===normalize_name(input_link.source_name))[0]
  //         if (nodes[input_node].x > max_x) {
  //           max_x = nodes[input_node].x
  //         }
  //       })
  //       node.x_after = max_x
  //       if (list_of_x_after.indexOf(max_x) === -1) {
  //         list_of_x_after.push(max_x)
  //         the_nodes_max[max_x] = []
  //       }
  //       the_nodes_max[max_x].push(node)
  //     }
  //   }
  // })
  // give x position to horiz nodes
  // list_of_x_before.forEach(x_before => {
  //   var horizontal_offset = x_before - 3 * default_node_size
  //   the_nodes_min[x_before].forEach(
  //     node => {
  //       let total_output_offset = 0
  //       node.output_links.forEach(
  //         (id) => total_output_offset += +links[id].value
  //       )
  //       node.x = horizontal_offset - that.sankey.scale(total_output_offset)
  //       horizontal_offset -= that.sankey.scale(total_output_offset) + 3 * default_node_size
  //     }
  //   )
  // })    

  // list_of_x_after.forEach( x_after => {
  //   var horizontal_offset = x_after + 3 * default_node_size
  //   the_nodes_max[x_after].forEach(node => {
  //     let total_input_offset = 0
  //     node.input_links.forEach(
  //       (id) => total_input_offset += +links[id].value
  //     )
  //     node.x = horizontal_offset
  //     horizontal_offset += that.sankey.scale(total_input_offset) + 3 * default_node_size
  //   })
  // })
  //data.max_vertical_offset = max_vertical_offset

  reorganize_all_input_output_links(display_nodes, display_links)
  data.width = width + h_space
  data.height = Math.max(1500,max_vertical_offset + 100)
  return []
}

export const reorganize_all_input_output_links = (
  nodes: SankeyNode[],
  links: SankeyLink[]
) => {
  nodes.forEach((node) => {
    reorganize_node_input_links(node, nodes, links)
    reorganize_node_output_links(node, nodes, links)
  })
}

export const updateLayout = (
  data: SankeyData,
  new_layout: SankeyData
) => {
  convert_data(new_layout)
  //const { nodes, links } = data
  const display_nodes = data.nodes.filter( n=> n.display )
  const display_links = data.links.filter( l=> {
    const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    return source_node.display &&  target_node.display
  })

  let max_vertical_offset = 0
  const compute_offset = (node: SankeyNode) => {
    if (node.tags['Exchanges'].includes('Importations') || node.tags['Exchanges'].includes('Exportations')) {
      return
    }
    if (!node.visible) {
      return
    }
    max_vertical_offset = Math.max(node.y, max_vertical_offset)
  }
  display_nodes.forEach(compute_offset)
  max_vertical_offset = max_vertical_offset + 200

  data.node_width = new_layout.node_width
  // Apply nodes layout
  for (let i = 0; i < new_layout.nodes.length; i++) {
    const node_layout = new_layout.nodes[i]
    let node = find_node(node_layout.name, display_nodes)

    if (node === undefined) {
      if (node_layout.input_links.length === 0 && node_layout.output_links.length === 0 && node_layout.visible === false && node_layout.label_visible === true) {
        // Case of not a label
        node = {...node_layout}
        data.nodes.push(node)
      } else {
        continue
      }
    }
    if (!node.visible) {
      continue
    }
    node.name = node_layout.name
    node.x = node_layout.x
    node.y = node_layout.y
    if (!node.tags['Exchanges'].includes('Exportations') && node.y + 200 > max_vertical_offset) {
      max_vertical_offset = node.y + 200
    }
    //node.color = node_layout.color
    node.x_label = node_layout.x_label
    node.y_label = node_layout.y_label
    node.label_visible = node_layout.label_visible
  }
  apply_input_output_links(
    new_layout.nodes,
    new_layout.links,
    data
  )


  for (let i = 0; i < new_layout.links.length; i++) {
    const link_layout = new_layout.links[i]
    const link_and_idx = find_link(
      link_layout.source_name,
      link_layout.target_name,
      display_links
    )
    if (link_and_idx === undefined) {
      continue
    }
    const link = link_and_idx[0] as SankeyLink
    // if ( link_layout.display_value !== 'default' && 
    //     !String(link_layout.display_value).includes('[') ) {
    //   link.value = link_layout.value
    // }
    const node_source = find_node(link_layout.source_name, display_nodes)
    const node_target = find_node(link_layout.target_name, display_nodes)
    if (node_source && node_target) {
      link.source_name = node_source.name
      link.target_name = node_target.name
    }
    const { x_label, y_label, label_position, label_visible, recycling, curved, curvature, arrow } = link_layout
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
    if (String(link.display_value).includes('*')) {
      link.value[0] = link_layout.value[0]
    }

    if (link_layout.vert_shift) {
      link.left_horiz_shift = link_layout.left_horiz_shift
      link.right_horiz_shift = link_layout.right_horiz_shift
      link.vert_shift = link_layout.vert_shift
    }
  }

  //data.animation_tooltips = new_layout.animation_tooltips
  data.user_scale = new_layout.user_scale
  if ('height' in new_layout) {
    data.height = new_layout.height
  }
  if ('width' in new_layout) {
    data.width = new_layout.width
  }
  data.display_style = new_layout.display_style
  if (data.display_style.filter === undefined) {
    data.display_style.filter = 0
  }
  if (data.display_style.filter_label === undefined) {
    data.display_style.filter_label = 0
  }
}

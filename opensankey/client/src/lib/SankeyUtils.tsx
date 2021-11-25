import { SankeyData, SankeyLink, SankeyNode } from './types'
import FileSaver from 'file-saver'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey, compute_default_input_outputLinksId, updateLayout, reorganize_node_inputLinksId, reorganize_node_outputLinksId } from './SankeyLayout'
import { linkHorizontal } from 'd3-shape'

// Getter pour récupérer la valeur du link
// utile pour pouvoir ensuite gérer les dataTag
export const getLinkValue = (
  data: SankeyData,
  idLink: string
) => {
  const { links } = data
  return links[idLink].value[0]
}

export const getTotalLinks = (
  data: SankeyData,
  Links: string[],
) => {
  const { links } = data
  let total = 0
  Links.forEach(element => {
    // On vérifie que le lien est affiché, cad que le noeud source et le noeud target sont
    if (data.nodes[data.links[element].idSource].node_visible && data.nodes[data.links[element].idTarget].node_visible) {
      const tmp = links[element].value[0]
      total += tmp
    }
  })
  return total
}

export const compute_total_offsets = (
  node: SankeyNode,
  nodes: { [node_id: string]: SankeyNode },
  links: { [link_id: string]: SankeyLink },
  selected_tags: { [tag_group: string]: string[] },
  test_link_value: (node: { [node_id: string]: SankeyNode }, d: SankeyLink, selected_tags: { [tag_group: string]: string[] }) => string,
  ref_link: SankeyLink | undefined = undefined
) => {
  let offset_height_left = 0
  let offset_height_right = 0
  let offset_width_top = 0
  let offset_width_bottom = 0

  const left_flux: string[] = []
  const right_flux: string[] = []
  const top_flux: string[] = []
  const bottom_flux: string[] = []

  //const link_id = link ? links.indexOf(link) : -1

  node.outputLinksId.forEach(
    (idLink) => {
      const link = links[idLink]
      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
        let target_node
        try {
          target_node = nodes[link.idTarget]
        } catch {
          return
        }
        if (link.orientation === 'hh') {
          if (target_node.x > node.x && !link.recycling || target_node.x <= node.x && link.recycling) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (link.orientation === 'vv') {
          if (target_node.y > node.y) {
            bottom_flux.push(idLink)
          } else {
            top_flux.push(idLink)
          }
        } else if (link.orientation === 'hv') {
          if (target_node.x > node.x) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (link.orientation === 'vh') {
          if (target_node.y > node.y) {
            bottom_flux.push(idLink)
          } else {
            top_flux.push(idLink)
          }
        }
      }
    }
  )

  node.inputLinksId.forEach(
    (idLink) => {
      const link = links[idLink]
      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
        let source_node
        try {
          source_node = nodes[link.idSource]
        } catch {
          return
        }
        if (link.orientation === 'vv') {
          if (source_node.y < node.y) {
            // flux goes down
            top_flux.push(idLink)
          } else {
            // flux goes up
            bottom_flux.push(idLink)
          }
        } else if (link.orientation === 'hh') {
          if (source_node.x >= node.x && link.recycling || source_node.x < node.x && !link.recycling) {
            // flux goes right
            left_flux.push(idLink)
          } else {
            // flux goes left
            right_flux.push(idLink)
          }
        } else if (link.orientation === 'hv') {
          if (source_node.y < node.y) {
            // flux goes right
            top_flux.push(idLink)
          } else {
            // flux goes left
            bottom_flux.push(idLink)
          }
        } else if (link.orientation === 'vh') {
          if (source_node.x < node.x) {
            // flux goes right
            left_flux.push(idLink)
          } else {
            // flux goes left
            right_flux.push(idLink)
          }
        }
      }
    }
  )

  let top_order = -1
  if (ref_link) {
    top_order = top_flux.indexOf(ref_link.idLink)
  }
  top_flux.forEach(
    (id, i) => {
      if (top_order !== -1 && (i > top_order || i === 0)) {
        return
      }
      let the_id = id
      if (top_order !== -1) {
        the_id = top_flux[i - 1]
      }
      const v = test_link_value(nodes, links[the_id], selected_tags)
      console.log(v)
      if (v === undefined) {
        return
      }
      offset_width_top += +v
    }
  )
  let bottom_order = -1
  if (ref_link) {
    bottom_order = bottom_flux.indexOf(ref_link.idLink)
  }
  bottom_flux.forEach(
    (id, i) => {
      if (bottom_order !== -1 && (i > bottom_order || i === 0)) {
        return
      }
      let the_id = id
      if (bottom_order !== -1) {
        the_id = bottom_flux[i - 1]
      }
      const v = test_link_value(nodes, links[the_id], selected_tags)
      if (v === undefined) {
        return
      }
      offset_width_bottom += +v
    }
  )

  let left_order = -1
  if (ref_link) {
    left_order = left_flux.indexOf(ref_link.idLink)
  }
  left_flux.forEach(
    (id, i) => {
      if (left_order !== -1 && (i > left_order || i === 0)) {
        return
      }
      let the_id = id
      if (left_order !== -1) {
        the_id = left_flux[i - 1]
      }
      const v = test_link_value(nodes, links[the_id], selected_tags)
      if (v === undefined) {
        return
      }
      offset_height_left += +v
    }
  )

  let right_order = -1
  if (ref_link) {
    right_order = right_flux.indexOf(ref_link.idLink)
  }
  right_flux.forEach(
    (id, i) => {
      if (right_order !== -1 && (i > right_order || i === 0)) {
        return
      }
      let the_id = id
      if (right_order !== -1) {
        the_id = right_flux[i - 1]
      }
      const v = test_link_value(nodes, links[the_id], selected_tags)
      if (v === undefined) {
        return
      }
      offset_height_right += +v
    }
  )

  return [offset_height_left, offset_height_right, offset_width_top, offset_width_bottom]
}

export const toPrecision = (
  v: number
) => {
  if (v < 1) {
    return String(v.toFixed(1))
  }
  let new_v = v.toPrecision(3).replace(/\.0+$/, '')
  if (new_v.includes('e+3')) {
    new_v = String(parseFloat(new_v))
  }
  return new_v
}

export const link_text = (
  d: SankeyLink,
  link_value: number,
  display_style: { font_size?: string; filter?: number; filter_label?: number; unit?: boolean },
  reg_index: number
) => {
  const str_display = String(d.display_value[reg_index])
  if (str_display !== 'default') {
    return str_display
  }
  const the_link_value = toPrecision(link_value)
  return the_link_value
}

export const default_sankey_data = (): SankeyData => {
  return {
    version: '0.5',

    nodes: {},
    links: {},
    user_scale: 100,
    height: 1500,
    width: 2150,
    node_width: 10,
    h_space: 200,
    v_space: 100,

    left_shift: 0.4,
    right_shift: 0.5,
    max_shift: 0.2,

    display_style: {
      font_size: 11,
      sector_uppercase: true,
      sector_bold: true,
      sector_italic: false,
      product_uppercase: false,
      product_bold: false,
      product_italic: true,
      unit: false,
      filter: 0,
      filter_label: 0,
      global_curvature: 0.5,
      null_flux: false
    },

    tags_catalog: {},
    tags_group_idx: 1,
    tag_idx: 1,
    node_idx: 1,
    link_idx: 1
  }
}

export const default_node = (): SankeyNode => {
  return {
    name: '',
    idNode: 'node0',
    type: 'sector',
    display: true,
    node_visible: true,
    shape_visible: true,
    label_visible: true,
    color: '#a9a9a9',
    node_parameter: 'Général',
    x: 100,
    y: 100,
    inputLinksId: [],
    outputLinksId: [],
    tags: {},
    colorFavoriteTags: {},
    dimensions: { 'Primaire': { parent_name: undefined } }
  }
}

export const default_link = (): SankeyLink => {
  return {
    idSource: 'node0',
    idTarget: 'node1',
    idLink: 'link0',
    value: [10],
    display_value: ['default'],
    color: '#a9a9a9',
    curved: false,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    orientation: 'hh',
    left_horiz_shift: 0,
    right_horiz_shift: 0,
    vert_shift: 0,
    shift_gap: 0.1,
    tags: {}
  }
}

export const delete_link = (
  data: SankeyData,
  link: SankeyLink
) => {
  const source_node = data.nodes[link.idSource]
  let idx = source_node.outputLinksId.findIndex(idLink => idLink === link.idLink)
  source_node.outputLinksId.splice(idx, 1)

  const target_node = data.nodes[link.idTarget]
  idx = target_node.inputLinksId.findIndex(idLink => idLink === link.idLink)
  target_node.inputLinksId.splice(idx, 1)

  delete data.links[link.idLink]
}

export const delete_node = (
  data: SankeyData,
  node: SankeyNode
) => {
  node.inputLinksId.forEach(idLink => delete_link(data, data.links[idLink]))
  node.outputLinksId.forEach(idLink => delete_link(data, data.links[idLink]))
  delete data.nodes[node.idNode]
}

export const setSelectedTags = (
  sankey_data: SankeyData
) => {

  const { tags_catalog } = sankey_data
  const display_nodes: SankeyNode[] = Object.values(sankey_data.nodes).filter(n => n.display)

  display_nodes.forEach(node => {
    node.node_visible = true
    let break_loop = false
    let no_tag = true
    Object.keys(tags_catalog).forEach(tags_group_key => {
      if (break_loop) {
        return
      }
      const tags_group = tags_catalog[tags_group_key]
      if (!node.tags[tags_group_key] || node.tags[tags_group_key].length === 0) {
        // tags do not apply to node
        return
      }
      no_tag = false
      const visible = Object.keys(tags_group.tags).filter(tag_key => tags_group.tags[tag_key].selected && node.tags[tags_group_key].includes(tag_key)).length > 0
      if (!visible) {
        node.node_visible = false
        break_loop = true
      }
    })
    // for the labels
    if (no_tag && !node.shape_visible && !node.label_visible) {
      node.node_visible = true
    }
  })

}

const downloadExamples = (
  file_name: string,
  the_url_prefix: string,
  filetype: string
) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && the_url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
  const url = root + the_url_prefix + 'sankey/download_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }
  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: filetype })
    FileSaver.saveAs(newBlob, file_name)
  }
  fetch(url, fetchData).then(
    response => {
      if (response.ok) {
        response.blob().then(showFile)
      }
    })
}



export const uploadExemple = (
  file_name: string,
  the_url_prefix: string,
  data: SankeyData,
  set_data: (data: SankeyData) => void,
  example_callback: (data: SankeyData) => void
) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && the_url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
  const url = root + the_url_prefix + 'sankey/upload_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }
  let file_type = 'text/plain'
  set_data({ ...default_sankey_data() })

  file_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      // try {
      const server_data = JSON.parse(text)
      Object.assign(data, server_data)
      convert_data(data)
      // data.left_shift = 0.40
      // data.right_shift = 0.50
      data.node_idx = Object.keys(data.nodes).length
      data.link_idx = Object.keys(data.nodes).length
      example_callback(data)
      set_data({ ...data })
      downloadExamples(file_name, the_url_prefix, file_type)
      // } catch (err) {
      //   alert(err)
      // }
    })
  })
}

export const set_nodes_level = (
  display_nodes: { [key : string] : SankeyNode },
  level: number
) => {
  Object.values(display_nodes).forEach(node => {
    if (!node.dimensions['Primaire'] || !node.dimensions['Primaire'].level) {
      node.display = false
      node.node_visible = false
      return
    }
    if (node.dimensions['Primaire'].level === level) {
      node.node_visible = true
      node.display = true
      Object.keys(node.dimensions).forEach(dim => {
        const idParent = node.dimensions[dim].parent_name
        if (idParent !== null && idParent !== undefined) {
          display_nodes[idParent].node_visible = false
          display_nodes[idParent].display = false
        }
      })
    } else if (node.dimensions['Primaire'].level > level) {
      node.node_visible = false
      node.display = false
    }
  })
}

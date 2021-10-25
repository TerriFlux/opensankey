import { SankeyData, SankeyLink, SankeyNode } from './types'
import FileSaver from 'file-saver'
import { convert_data } from './SankeyConvert'
import { compute_auto_sankey } from './SankeyLayout'


// Getter pour récupérer la valeur du link
// utile pour pouvoir ensuite gérer les dataTag
export const getLinkValue = (
  data: SankeyData,
  idLink: string
) => {
  const { links } = data
  return links.filter(element => { return element.idLink === idLink })[0].value[0]
}

export const getTotalLinks = (
  data: SankeyData,
  Links: string[],
) => {
  const { links } = data
  let total = 0
  Links.forEach( element => {
    const tmp = links.filter(element1 => {
      return (element1.idLink == element)
    })[0].value[0]
    total += tmp
  })
  return total

  //   console.log(idNode)
  //   console.log(element.idLink)
  //   console.log(links.filter(element => { return (element.idLink as any).includes(idNode) }))
  // })
  return 'test'
}

export const normalize_name = (name: string) => {
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const find_link = (
  source_name: string,
  target_name: string,
  links: SankeyLink[]
) => {
  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    if (normalize_name(link.source_name) === normalize_name(source_name) &&
      normalize_name(link.target_name) === normalize_name(target_name)
    ) {
      return [links[i], i]
    }
  }
  return undefined
}

export const find_node = (
  node_name: string,
  nodes: SankeyNode[]
) => {
  for (let i = 0; i < nodes.length; i++) {
    if (normalize_name(nodes[i].name) === normalize_name(node_name)) {
      return nodes[i]
    }
  }
  return undefined
}

export const compute_total_offsets = (
  node: SankeyNode,
  nodes: SankeyNode[],
  links: SankeyLink[],
  selected_tags: { [tag_group: string]: string[] },
  test_link_value: (nodes: SankeyNode[], d: SankeyLink, selected_tags: { [tag_group: string]: string[] }) => string,
  link_id = -1
) => {
  let offset_height_left = 0
  let offset_height_right = 0
  let offset_width_top = 0
  let offset_width_bottom = 0

  const left_flux: number[] = []
  const right_flux: number[] = []
  const top_flux: number[] = []
  const bottom_flux: number[] = []
  node.output_links.forEach(
    (id) => {
      let target_node
      try {
        target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(links[id].target_name))[0]
      } catch {
        return
      }
      if (links[id].visible) {
        if (links[id].orientation === 'hh') {
          if (target_node.x > node.x && !links[id].recycling || target_node.x <= node.x && links[id].recycling) {
            right_flux.push(id)
          } else {
            left_flux.push(id)
          }
        } else if (links[id].orientation === 'vv') {
          if (target_node.y > node.y) {
            bottom_flux.push(id)
          } else {
            top_flux.push(id)
          }
        } else if (links[id].orientation === 'hv') {
          if (target_node.x > node.x) {
            right_flux.push(id)
          } else {
            left_flux.push(id)
          }
        } else if (links[id].orientation === 'vh') {
          if (target_node.y > node.y) {
            bottom_flux.push(id)
          } else {
            top_flux.push(id)
          }
        }
      }
    }
  )

  node.input_links.forEach(
    (id) => {
      let source_node
      try {
        source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(links[id].source_name))[0]
      } catch {
        return
      }
      if (links[id].visible) {
        if (links[id].orientation === 'vv') {
          if (source_node.y < node.y) {
            // flux goes down
            top_flux.push(id)
          } else {
            // flux goes up
            bottom_flux.push(id)
          }
        } else if (links[id].orientation === 'hh') {
          if (source_node.x >= node.x && links[id].recycling || source_node.x < node.x && !links[id].recycling) {
            // flux goes right
            left_flux.push(id)
          } else {
            // flux goes left
            right_flux.push(id)
          }
        } else if (links[id].orientation === 'hv') {
          if (source_node.y < node.y) {
            // flux goes right
            top_flux.push(id)
          } else {
            // flux goes left
            bottom_flux.push(id)
          }
        } else if (links[id].orientation === 'vh') {
          if (source_node.x < node.x) {
            // flux goes right
            left_flux.push(id)
          } else {
            // flux goes left
            right_flux.push(id)
          }
        }
      }
    }
  )

  let top_order = -1
  if (link_id != -1) {
    top_order = top_flux.indexOf(link_id)
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
      if (v === undefined) {
        return
      }
      offset_width_top += +v
    }
  )
  let bottom_order = -1
  if (link_id != -1) {
    bottom_order = bottom_flux.indexOf(link_id)
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
  if (link_id != -1) {
    left_order = left_flux.indexOf(link_id)
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
  if (link_id != -1) {
    right_order = right_flux.indexOf(link_id)
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
  link_value: number
  /*display_style: { font_size?: string; filter?: number; filter_label?: number; unit?: boolean }*/,
) => {
  const str_display = String(d.display_value)
  if (str_display !== 'default') {
    return str_display
  }
  const the_link_value = toPrecision(link_value)
  return the_link_value
}

export const default_sankey_data = (): SankeyData => {
  return {
    version: '0.4',

    nodes: [],
    links: [],
    user_scale: 100,
    height: 1500,
    width: 2150,
    node_width: 10,

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
      global_curvature: 0.5
    },

    tags_catalog: []
  }
}

export const default_node = (): SankeyNode => {
  return {
    id: 0,
    name: '',
    type: 'sector',
    visible: true,
    label_visible: true,
    color: 'darkgrey',
    x: 100,
    y: 100,
    input_links: [],
    output_links: [],
    tags: {}
  }
}

export const default_link = (): SankeyLink => {
  return {
    source_name: '',
    target_name: '',
    value: [10],
    display_value: ['default'],
    color: 'darkgrey',
    curved: false,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    orientation: 'hh',
    visible: true,
    left_horiz_shift: 0,
    right_horiz_shift: 0,
    vert_shift: 0,
    tags: {}
  }
}

export const delete_link = (
  data: SankeyData,
  deleted_link_id: number
) => {

  const { links, nodes } = data
  links.splice(deleted_link_id, 1)

  nodes.forEach(node => {
    for (let i = node.input_links.length - 1; i >= 0; i--) {
      const link_id = node.input_links[i]
      if (link_id === deleted_link_id) {
        node.input_links.splice(i, 1)
      }
    }
    for (let i = node.output_links.length - 1; i >= 0; i--) {
      const link_id = node.output_links[i]
      if (link_id === deleted_link_id) {
        node.output_links.splice(i, 1)
      }
    }
    node.input_links.forEach((link_id, i) => {
      if (link_id > deleted_link_id) {
        node.input_links[i] = link_id - 1
      }
    })
    node.output_links.forEach((link_id, i) => {
      if (link_id > deleted_link_id) {
        node.output_links[i] = link_id - 1
      }
    })
  })
  //set_data({...data})
}

export const delete_node = (
  data: SankeyData,
  node_id: number
) => {

  const { nodes, links } = data

  // delete links originating from / going to the deleted node
  let i = 0
  while (i < links.length) {
    if (links[i].source_name === nodes[node_id].name) {
      console.log('link' + i)
      console.log(1)
      delete_link(data, i)
      i -= 1
    }
    else if (links[i].target_name === nodes[node_id].name) {
      console.log('link' + i)
      console.log(2)
      delete_link(data, i)
      i -= 1
    }
    i += 1
  }

  // delete node and shift numerotation
  nodes.splice(node_id, 1)
  nodes.forEach((node, i) => node.id = i)

  // shift source and target of links and update links
  // region_names.forEach(region_name => {
  //   links[region_name].forEach(link =>{
  //     if (link.source > node_id) {
  //       link.source -= 1
  //     }
  //     if (link.target > node_id) {
  //       link.target -= 1
  //     }
  //   })
  // })
  //set_data({...data})
}

export const setSelectedTags = (
  sankey_data: SankeyData
) => {

  const { nodes, links,tags_catalog } = sankey_data

  // specific to filiere paille
  // if ((new_tags[0] === 'Usages' || 
  //     new_tags[0] === 'Logistique' ||
  //     new_tags[0] === 'Energie' ||
  //     new_tags[0] === 'Autres') && sankey_data.old_user_scale === undefined
  // ) {
  //   sankey_data.old_user_scale = sankey_data.user_scale
  //   sankey_data.user_scale = sankey_data.user_scale/4
  //   nodes.forEach((n)=>n.x -= 800)
  // } else if (sankey_data.old_user_scale  && new_tags.includes('Champs')) {
  //   sankey_data.old_user_scale = undefined
  //   sankey_data.user_scale = sankey_data.user_scale*4
  //   nodes.forEach((n)=>n.x += 800)      
  // }

  nodes.forEach(node => {
    node.visible = true
    node.label_visible = true
    for (const i in tags_catalog) {
      const group_name = tags_catalog[i].group_name
      if (!node.tags[group_name] || node.tags[group_name].length === 0) {
        // tags do not apply to node
        continue
      }
      const visible = tags_catalog[i].selected_tags.filter(selected_tag => node.tags[group_name].includes(selected_tag)).length > 0
      if (!visible) {
        node.visible = false
        node.label_visible = false
        break
      }
    }
  })

  links.forEach(link => {
    link.visible = true
    link.label_visible = true
    for (const i in tags_catalog) {
      const group_name = tags_catalog[i].group_name
      if (!link.tags[group_name] || link.tags[group_name].length === 0) {
        // tags do not apply to node
        continue
      }
      const visible = tags_catalog[i].selected_tags.filter(selected_tag => link.tags[group_name].includes(selected_tag)).length > 0
      if (!visible) {
        link.visible = false
        link.label_visible = false
        break
      }
    }
    const source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.source_name))[0]
    const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.target_name))[0]
    if (!source_node.visible && !source_node.label_visible && !target_node.visible && !target_node.label_visible) {
      link.visible = false
      link.label_visible = false      
    }
  })
}
const downloadExamples = (
  file_name: string,
  filetype: string
) => {
  const path = window.location.href
  const url = path + 'sankey/download_examples'
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
  set_data: any
) => {
  const path = window.location.href
  const url = path + the_url_prefix + 'sankey/upload_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }
  let file_type = 'text/plain'
  set_data({ ... default_sankey_data() })

  file_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const callback = (server_data: SankeyData) => {
    Object.assign(data, server_data)
    convert_data(data)
    compute_auto_sankey(data, 200)
    set_data({ ...data })
  }

  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      try {
        const json_data = JSON.parse(text)
        callback(json_data)
        downloadExamples(file_name, file_type)
      } catch (err) {
        alert(err)
      }
    })
  })
}
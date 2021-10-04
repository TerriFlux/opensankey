import { SankeyData, SankeyLink, SankeyNode } from './types'
import * as d3 from 'd3'

export const normalize_name = (name: string) =>{
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const find_link = ( 
  source_name: string, 
  target_name: string,
  links: SankeyLink[]
) =>{
  for (let i=0; i<links.length; i++) {
    const link = links[i]
    if ( normalize_name(link.source_name) === normalize_name(source_name) && 
         normalize_name(link.target_name) === normalize_name(target_name) 
    ) {
      return [links[i],i]
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
  _: unknown
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
  link_value: number
  /*display_style: { font_size?: string; filter?: number; filter_label?: number; unit?: boolean }*/,
) => {
  const str_display = String(d.display_value)
  if (str_display !== 'default' ) {
    return str_display
  }
  const the_link_value = toPrecision(link_value)
  return the_link_value
}

export const default_sankey_data = () : SankeyData => {
  return {
    version: '0.4',

    nodes: [],
    links: [],
    user_scale : 100,
    height: 1500,
    width: 2150,
    node_width: 10,

    display_style : {
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

    tags: [],
    selected_tags: {}
  }
}

export const default_node = () : SankeyNode =>  {
  return {
    id           : 0,
    name         : '',
    type         : 'sector',
    visible      : true,
    label_visible: true,
    color        : 'darkgrey',
    x            : 100,
    y            : 100,
    input_links  : [],
    output_links : [],
    tags         : {}
  }
}

export const default_link = () : SankeyLink => {
  return {
    source_name     : '',
    target_name     : '',
    value           : [10],
    display_value   : ['default'],
    color           : 'darkgrey',
    curved          : false,
    arrow           : true,
    text_color      : 'black',
    label_position  : 'middle',
    curvature       : 0.5,
    label_visible   : true,
    label_on_path   : true,
    orientation     : 'hh',
    visible         : true,
    left_horiz_shift : 0,
    right_horiz_shift : 0,
    vert_shift : 0,
    tags: {} 
  }
}

export const delete_link = (
  data: SankeyData,
  deleted_link_id : number
) => {
  
  const { links,nodes} = data
  links.splice(deleted_link_id,1)

  nodes.forEach(node => {
    for (let i = node.input_links.length - 1; i >= 0; i--) {
      const link_id = node.input_links[i]
      if (link_id === deleted_link_id) {
        node.input_links.splice(i,1)
      }
    }
    for (let i = node.output_links.length - 1; i >= 0; i--) {
      const link_id = node.output_links[i]
      if (link_id === deleted_link_id) {
        node.output_links.splice(i,1)
      }
    }
    node.input_links.forEach((link_id,i) => {
      if (link_id > deleted_link_id) {
        node.input_links[i] = link_id - 1
      }
    })
    node.output_links.forEach((link_id,i)=>{
      if (link_id > deleted_link_id) {
        node.output_links[i] = link_id - 1
      }
    })
  })
  //set_data({...data})
}

export const delete_node = (
  data: SankeyData,
  node_id : number
) => {
  
  const {nodes, links} = data

  // delete links originating from / going to the deleted node
  let i=0
  while (i < links.length) {
    if (links[i].source_name === nodes[node_id].name) {
      console.log('link'+i)
      console.log(1)
      delete_link(data,i)
      i -= 1
    }
    else if (links[i].target_name === nodes[node_id].name) {
      console.log('link'+i)
      console.log(2)
      delete_link(data,i)
      i -= 1
    }
    i += 1
  }

  // delete node and shift numerotation
  nodes.splice(node_id,1)
  nodes.forEach( (node,i) => node.id = i )

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
  sankey_data: SankeyData,
  new_tags: {[tag_group:string]:string[]}
) => {  
    
  const {nodes, links} = sankey_data

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

  nodes.forEach( node => {
    node.visible = true
    node.label_visible = true 
    const node_tags = node.tags
    for (const tag_group in new_tags) {
      if ( !node_tags[tag_group] ) {
        continue
      }
      for (let i=0; i< new_tags[tag_group].length; i++) {
        let found = false
        for (let j=0; j< node_tags[tag_group].length; j++) {
          if ( new_tags[tag_group].includes(node_tags[tag_group][j])) {
            found = true
            break
          }
        }
        node.visible = found
        node.label_visible = found
      }
    }
  })

  links.forEach( link => {
    link.visible = true
    link.label_visible = true 
    const link_tags = link.tags
    for (const tag_group in new_tags) {
      if ( !link_tags[tag_group] ) {
        continue
      }
      for (let i=0; i< new_tags[tag_group].length; i++) {
        let found = false
        for (let j=0; j< link_tags[tag_group].length; j++) {
          if ( new_tags[tag_group].includes(link_tags[tag_group][j])) {
            found = true
            break
          }
        }
        link.visible = found
        link.label_visible = found
      }
    }
  })
}
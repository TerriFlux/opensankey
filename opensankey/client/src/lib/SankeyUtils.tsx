import { SankeyData, SankeyLink, SankeyNode } from './types'
import * as d3 from 'd3'

export const normalize_name = (name: string) =>{
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const find_link = ( 
  source_name: string, 
  target_name: string,
  region_name: string, 
  links: { [region_name: string]: SankeyLink[] } 
) =>{
  for (let i=0; i<links[region_name].length; i++) {
    const link = links[region_name][i]
    if ( normalize_name(link.source_name) === normalize_name(source_name) && 
         normalize_name(link.target_name) === normalize_name(target_name) 
    ) {
      return [links[region_name][i],i]
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
  /*display_style: { font_size?: string; filter?: number; filter_label?: number; unit?: boolean }*/
) => {
  const str_display = String(d.display_value)
  if (str_display !== 'default' ) {
    return str_display
  }
  const the_link_value = toPrecision(link_value)
  return the_link_value
}

export const default_node = () => {
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

export const default_link = () => {
  return {
    source_name     : '',
    target_name     : '',
    value           : 10,
    display_value   : 'default',
    color           : 'darkgrey',
    curved          : false,
    arrow           : true,
    text_color : 'black',
    label_position  : 'middle',
    curvature       : 0.5,
    label_visible   : true,
    label_on_path   : true,
    orientation     : 'hh',
    visible         : true,
    data            : false,
    left_horiz_shift : 0,
    right_horiz_shift : 0,
    vert_shift : 0
  }
}

export const delete_link = (
  data: SankeyData,
  deleted_link_id : number
) => {
  
  const { links,nodes} = data
  const region_names = Object.keys(links)
  region_names.forEach(
    reg_name => links[reg_name].splice(deleted_link_id,1)
  )
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
  const region_names = Object.keys(links)
  if (!region_names.includes(data.region_name)) {
    data.region_name = region_names[0]
  }
  // delete links originating from / going to the deleted node
  let i=0
  while (i < links[data.region_name].length) {
    if (links[data.region_name][i].source_name === nodes[node_id].name) {
      console.log('link'+i)
      console.log(1)
      delete_link(data,i)
      i -= 1
    }
    else if (links[data.region_name][i].target_name === nodes[node_id].name) {
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
  const region_names = Object.keys(links)

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
      for (let i=0; i< new_tags[tag_group].length; i++) {
        if (!new_tags[tag_group].includes(node_tags[tag_group][i])) {
          node.visible = false
          node.label_visible = false
        }
      }
    }
  })

  region_names.forEach(region_name =>{
    links[region_name].forEach((link)=>{
      const source_node = nodes.filter(n=>normalize_name(n.name)===normalize_name(link.source_name))[0]
      const target_node = nodes.filter(n=>normalize_name(n.name)===normalize_name(link.target_name))[0]
      if (source_node.visible  && target_node.visible ) {
        link.visible = true
        link.label_visible = true
      } else {
        link.visible = false
        link.label_visible = false        
      }
    })
  })
  // localStorage.setItem('data',JSON.stringify(sankey_data))
  // set_data({...sankey_data})
}
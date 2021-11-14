import { SankeyData, SankeyLink } from './types'
import { normalize_name, setSelectedTags } from './SankeyUtils'

interface ConvertSankeyNode {
  id?: string
  orientation?: string,
  subchain?: string,
  tooltips: any,
  total_input_offset: any,
  input_offsets: any,
  total_output_offset: any,
  input_links?: number[],
  output_links?: number[],
  output_offsets: any,
  horizontal_index: any,
  visible: number | boolean,
  display: number | boolean,
  label_visible: number | boolean,
  trade_close: boolean
}
interface ConvertSankeyLink {
  classif?: any
  title_length?: any
  raw_value?: any
  old_display_value?: any
  old_color?: any
  y_sd_label?: any
  x_sd_label?: any
  visible?: boolean
  label_visible?: boolean
  text_same_color?: boolean | string
  frozen?: boolean,
  link_reverse?: boolean,
  display_unit?: string,
  type?: string
  tooltip_text?: string
  data_value?: number | number[]
  data_source?: string | string[]
  data_period?: string | string[]
  agregated_data_value?: number
  conv?: number[]
  natural_unit?: string
  value: number | number[]
  display_value: string | string[]
  data?: boolean
  unbounded?: boolean,
  subchain?: string,
  mini?: number | number[],
  maxi?: number | number[]
}
interface ConvertSankeyData {
  units_names: string[]
  display_style: {
    trade_close?: boolean
  }
  show_uncert?: boolean
  sankey_type?: string,
  flux_types?: string[],
  use_flux_types?: boolean
  subchains?: string[]
  links?: { [region_name: string]: ConvertSankeyLink[] }
  nodes2tooltips: any,
  nodes2units_conv: any
  error: any,
  max_vertical_offset: any,
  region_names?: string[],
  region_name?: string,
  nodes_names: string[],
  filtered_nodes: any,
  filtered_nodes_names: string[],
  filtered_links: any,
  previous_filter: any,
  periods?: boolean
  tags_catalog: { group_name : string, tags: string[],selected_tags: string[]}[]
}


export const convert_data = (
  data_to_convert: SankeyData
): void => {
  const data = data_to_convert as SankeyData & ConvertSankeyData
  if (!data.display_style) {
    (data.display_style as any) = {}
  }
  if (data_to_convert.tags_catalog === undefined ) {
    data_to_convert.tags_catalog = {}
  }

  if (Array.isArray(data.tags_catalog)) {
    data_to_convert.tags_catalog = Object.assign({}, ...data.tags_catalog.map((tags_group) => (
      {[tags_group.group_name] : {
        group_name:tags_group.group_name,
        tags: Object.assign({}, ...tags_group.tags.map((tag_name) => ({[tag_name]: {name:tag_name,color:'',selected:tags_group.selected_tags.includes(tag_name)}}))),
        banner: tags_group.group_name === 'Regions' || tags_group.group_name === 'Periods' || tags_group.group_name === 'dimension' ? 'one' : 'multi'
      }
      }
    )))
  }
  if (!Array.isArray(data.links)) {
    const key_names = Object.keys(data.links)
    const new_links = JSON.parse(JSON.stringify(data.links[key_names[0]])) as SankeyLink[]
    new_links.forEach(
      (link, i) => {
        link.value = []
        link.display_value = []
        const convert_link = link as ConvertSankeyLink
        if (convert_link.mini !== undefined && convert_link.maxi !== undefined) {
          convert_link.mini = []
          convert_link.maxi = []
        }
        if (convert_link.data_value !== undefined ) {
          convert_link.data_value = []
        }
        if (convert_link.data_source !== undefined ) {
          convert_link.data_source = []
        }
        if (convert_link.data_period !== undefined ) {
          convert_link.data_period = []
        }
        key_names.forEach(
          cur_key_name => {
            link.value.push(data.links[cur_key_name][i].value as number)
            link.display_value.push(data.links[cur_key_name][i].display_value as string)
            if (convert_link.mini !== undefined && convert_link.maxi !== undefined) {
              (convert_link.mini as number[]).push(data.links[cur_key_name][i].mini as number);
              (convert_link.maxi as number[]).push(data.links[cur_key_name][i].maxi as number)
            }
            if (convert_link.data_value !== undefined) {
              (convert_link.data_value as number[]).push(data.links[cur_key_name][i].data_value as number)
            }
            if (convert_link.data_source !== undefined) {
              (convert_link.data_source as string[]).push(data.links[cur_key_name][i].data_source as string)
            }
            if (convert_link.data_period !== undefined) {
              (convert_link.data_period as string[]).push(data.links[cur_key_name][i].data_period as string)
            }
          }
        )
      }
    )
    data_to_convert.links = new_links
    if ( key_names.length > 1 && !data.periods && data.region_names) {
      data.tags_catalog['Regions'] = {
        group_name: 'Regions',
        tags: Object.assign({}, ...data.region_names.map((region_name) => ({[region_name]: {name:region_name,color:'',selected:region_name===data.region_name}}))),
        banner: 'one'
      }
    }
    if ( key_names.length > 1 && data.periods) {
      data.tags_catalog['Periods'] = {
        group_name: 'Periods',
        tags: Object.assign({}, ...key_names.map((key_name) => ({[key_name]: {name:key_name,color:'',selected:key_names[0]}}))),
        banner: 'one'
      }
    }
    delete data.periods
    delete data.region_names
    delete data.region_name
  }
  if (data.links.length > 0 && !data.links[0].idLink) {  
    data.links.forEach((l, i) => l.idLink = 'link' + i)
    data.nodes.forEach((n) => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
    data.nodes.forEach( n => {
      n.inputLinksId = []
      n.outputLinksId = []
      if (!((n as unknown) as ConvertSankeyNode).input_links) {
        return
      }
      (((n as unknown) as ConvertSankeyNode).input_links as number[]).forEach( link_idx => {
        n.inputLinksId.push(data.links[link_idx].idLink)
      });
      (((n as unknown) as ConvertSankeyNode).output_links as number[]).forEach( link_idx => {
        n.outputLinksId.push(data.links[link_idx].idLink)
      })
      delete ((n as unknown) as ConvertSankeyNode).output_links
      delete ((n as unknown) as ConvertSankeyNode).input_links
      delete ((n as unknown) as ConvertSankeyNode).id
    })
  }
  const { display_style, nodes, links, node_width, units_names } = data


  if (display_style.filter === undefined) {
    display_style.filter = 0
  }
  if (display_style.global_curvature === undefined) {
    display_style.global_curvature = 0.99
  }
  if (display_style.trade_close === undefined && (data.version === '0.2' || data.version === '0.3') ) {
    display_style.trade_close = true
  }
  if (data.version === '0.1') {
    display_style.sector_uppercase = true
    display_style.sector_bold = true
    display_style.trade_close = false
    if (node_width === undefined) {
      data.node_width = 40
    }
    data.show_uncert = false
  }
  if (data.version === '0.2') {
    display_style.sector_uppercase = true
    display_style.sector_bold = true
    if (node_width === undefined) {
      data.node_width = 40
    }
    data.show_uncert = false
  }
  if (data.version === '0.3') {
    data.show_uncert = false
  }

  if (data.node_width === undefined) {
    data.node_width = 10
  }

  if (!data_to_convert.tags_catalog) {
    data_to_convert.tags_catalog = {}
  }
  if (data.h_space === undefined) {
    data.h_space = 200
  }
  if (data.v_space === undefined) {
    data.v_space = 100
  }
  if (data.left_shift === undefined) {
    data.left_shift = 0.4
  }
  if (data.right_shift === undefined) {
    data.right_shift = 0.5
  }
  if (data.dimension_name === undefined) {
    data.dimension_name = 'Primaire'
  }

  const attributes_to_remove = ['previous_filter', 'filtered_links', 'filtered_nodes_names', 'filtered_nodes', 'nodes_names', 'max_vertical_offset', 'error', 'nodes2units_conv', 'nodes2tooltips']
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data) {
      delete (data as any)[attributes_to_remove[attr]]
    }
  }

  let import_export = false
  const subchains: string[] = []
  nodes.forEach(
    n => {
      const n_convert = (n as unknown) as ConvertSankeyNode
      if (!n.tags) {
        n.tags = {}
      }
      if (n_convert.subchain && n_convert.subchain !== '') {
        n.tags['SubChain'] = n_convert.subchain.split(',')
        n_convert.subchain.split(',').forEach(s => {
          if (!subchains.includes(s)) {
            subchains.push(s)
          }
        })
        delete n_convert.subchain
      }

      if (n.visible === undefined) {
        n.visible = true
      }
      if (n_convert.visible === 1) {
        n.visible = true
      }
      if (n_convert.visible === 0) {
        n.visible = false
      }
      if (n_convert.label_visible === 1) {
        n.label_visible = true
      }
      if (n_convert.label_visible === 0) {
        n.label_visible = false
      }
      if (n.label_visible === undefined) {
        n.label_visible = n.visible
      }
      if (n_convert.display === 1) {
        n.display = true
      }
      if (n_convert.display === 0) {
        n.display = false
      }
      if (n.display === undefined) {
        n.display = true
      }

      const attributes_to_remove = ['tooltips','total_input_offset','input_offsets','total_output_offset','output_offsets','horizontal_index','title_length','old_color']
      for (const attr in attributes_to_remove) {
        if (attributes_to_remove[attr] in n_convert) {
          delete (n_convert as any)[attributes_to_remove[attr]]
        }
      }
      if (n.name.includes('(I') && n.outputLinksId.length > 0) {
        import_export = true
        n.visible = true
        n.tags['Exchanges'] = ['Importations']
        const l = links[links.findIndex(l=>l.idLink === n.outputLinksId[0])]
        if (!l.tags) {
          l.tags = {}
        }
        l.tags['Exchanges'] = ['Importations']
        if (data.display_style.trade_close !== undefined ) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } else if (n.name.includes('(E')) {
        import_export = true
        n.visible = true
        n.tags['Exchanges'] = ['Exportations']
        const l = links[links.findIndex(l=>l.idLink === n.inputLinksId[0])]
        if (!l.tags) {
          l.tags = {}
        }
        l.tags['Exchanges'] = ['Exportations']
        if (data.display_style.trade_close !== undefined ) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } //else if (!n.tags['Exchanges']) {
      //   n.tags['Exchanges'] = ['Other']
      // }
      if (n.dimensions === undefined) {
        n.dimensions = {'Primaire':{parent_name: undefined}}
      }
    }
  )

  if ( 'trade_close' in data.display_style) {
    delete data.display_style.trade_close
  }

  if (import_export) {

    // if (data.tags_catalog.filter(tag => tag.group_name === 'Exchanges').length === 0) {
    //   data.tags_catalog.push({
    //     group_name: 'Exchanges',
    //     tags: ['Importations', 'Exportations', 'Other'],
    //     selected_tags: ['Importations', 'Exportations', 'Other']
    //   })
    // }

    //TC v2
    if (Object.entries(data.tags_catalog).filter(tag => tag[0] === 'Exchanges').length === 0) {
      data.tags_catalog['Exchanges'] = {
        group_name: 'Echanges',
        tags: {
          'Importations': { name: 'Importations', selected: true }
          , 'Exportations': { name: 'Exportations', selected: true }
          , 'Other': { name: 'Other', selected: true }
        },
        banner: 'multi'
      }
    }
  }

  if (data.subchains && data.subchains[0] !== '') {
    const cpySbchaine = data.subchains
    if (Object.entries(data.tags_catalog).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      const tags_dict = Object.assign({}, ...cpySbchaine.map((subchain) => ({[subchain]: {name:subchain,color:'red',selected:true}})))
      data.tags_catalog['SubChain']={
        group_name: 'Sous-Filières',
        tags: tags_dict,
        banner: 'multi'
      }
      delete data.subchains
    }
  } else if (subchains.length > 0) {
    const tags_dict = Object.assign({}, ...subchains.map((subchain) => ({[subchain]: {name:subchain,color:'red',selected:true}})))
    if (Object.entries(data.tags_catalog).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      data.tags_catalog['SubChain']={
        group_name: 'Sous-Filières',
        tags: tags_dict,
        banner: 'multi'
      }
    }
  }

  if (data.flux_types || data.use_flux_types) {
    if (!data.tags_catalog['flux_types']) {
      data.tags_catalog['flux_types'] = {
        group_name: 'Types de donnée',
        tags: {
          'null_data': { name: 'null_data', selected: true },
          'initial_data': { name: 'initial_data', selected: false },
          'computed_data': { name: 'computed_data',selected: true },
          'adjusted_data': { name: 'adjusted_data', selected: true },
          'unbounded': { name: 'unbounded', selected: false },
        },
        banner: 'multi'
      }
      delete data.flux_types
      delete data.use_flux_types
    }
  }

  let flux_max = 0
  links.forEach(
    (l) => {
      const l_convert = (l as unknown) as ConvertSankeyLink

      l.value.forEach(v => {
        v = +v
        if (flux_max < v) {
          flux_max = v
        }
      })
      const source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
      const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
      if (!source_node || !target_node) {
        return
      }
      if (l.label_visible === undefined) {
        l.label_visible = true
      }
      if (l.visible === undefined) {
        l.visible = true
      }
      if (l.color === undefined) {
        l.color = source_node.color
      }
      if (!l.tags) {
        l.tags = {}
      }
      if (l_convert.subchain && l_convert.subchain !== '' ) {
        l.tags['SubChain'] = l_convert.subchain.split(',')
        l_convert.subchain.split(',').forEach(s => {
          if (!subchains.includes(s)) {
            subchains.push(s)
          }
        })
        delete l_convert.subchain
      }
      if (!('orientation' in l)) {
        (l as SankeyLink).orientation = 'hh'
        if (((source_node as unknown) as ConvertSankeyNode).orientation === 'horizontal' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'vertical') {
          (l as SankeyLink).orientation = 'vh'
        } else if (((source_node as unknown) as ConvertSankeyNode).orientation === 'vertical' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'horizontal') {
          (l as SankeyLink).orientation = 'hv'
        }
      }
      if (!('display_value' in l)) {
        (l as SankeyLink).display_value = ['default']
      }
      if (!('arrow' in l)) {
        (l as SankeyLink).arrow = true
      }
      if (!('curved' in l)) {
        (l as SankeyLink).curved = true
      }
      if (!('label_on_path' in l)) {
        (l as SankeyLink).label_on_path = true
      }
      if (l_convert.frozen) {
        l.label_position = 'frozen'
      }
      if ('frozen' in l) {
        delete l_convert.frozen
      }
      if ('link_reverse' in l) {
        delete l_convert.link_reverse
      }
      // if ( 'tooltip_text' in l_convert ) {
      //   delete l_convert.tooltip_text
      // }
      if ('display_unit' in l_convert) {
        l_convert.natural_unit = l_convert.display_unit
        delete l_convert.display_unit
      }
      if (('agregated_data_value' in l_convert)) {
        l_convert.data_value = l_convert.agregated_data_value
        delete l_convert.agregated_data_value
      }
      // if (!('visible' in l_convert)) {
      //   l.visible = (source_node.visible || source_node.label_visible) && (target_node.visible || target_node.label_visible)
      // }
      // if (!('label_visible' in l_convert)) {
      //   l.label_visible = (source_node.visible || source_node.label_visible) && (target_node.visible || target_node.label_visible)
      // }
      if (l_convert.type === 'short_link_arrow') {
        l.curved = false
        l.arrow = true
      } else if (l_convert.type === 'bezier_link_arrow') {
        l.curved = true
        l.arrow = true
      } else if (l_convert.type === 'bezier_link_classic') {
        l.curved = true
        l.arrow = false
      }
      const attributes_to_remove = ['source', 'target', 'id', 'classif', 'title_length', 'raw_value', 'old_display_value', 'old_color', 'y_sd_label', 'x_sd_label', 'type']
      for (const attr in attributes_to_remove) {
        if (attributes_to_remove[attr] in l) {
          delete (l as any)[attributes_to_remove[attr]]
        }
      }

      if (data.version === '0.1') {
        const unit_index = l_convert.natural_unit ? units_names.indexOf(l_convert.natural_unit) : -1
        if (l_convert.conv && unit_index !== -1) {
          const natural_conv = l_convert.conv[unit_index]
          l_convert.conv.splice(1, 0, natural_conv)
        }
        l.curved = true
        l.curvature = 1
        if (l_convert.text_same_color === true) {
          l.text_color = l.color
        } else {
          l.text_color = 'white'
        }
        delete l_convert.text_same_color
        if (target_node.x < source_node.x) {
          l.recycling = true
        }
      } else if (!('curvature' in l)) {
        (l as SankeyLink).curvature = 0.5
      }
      if (data.version === '0.2') {
        if (target_node.x < source_node.x) {
          l.recycling = true
        }
      }
      if (data.version === '0.1' || data.version === '0.2') {
        if (l_convert.natural_unit) {
          if (l_convert.natural_unit.includes('tonne')) {
            l_convert.natural_unit = l_convert.natural_unit.replace('tonne', 't')
            if (l_convert.natural_unit === 'k t') {
              l_convert.natural_unit = 'kt'
            }
          }
        }
        delete l.tooltip_text
      }
      if (!('text_color' in l) || l_convert.text_same_color === false) {
        l.text_color = 'black'
      } else if (l_convert.text_same_color === true) {
        l.text_color = l.color
      } else if (l_convert.text_same_color === 'same_color') {
        l.text_color = l.color
      }
      delete l_convert.text_same_color

      // if (Object.values(data.tags_catalog).filter(tags_group => tags_group.group_name === 'Exchanges').length > 0) {
      //   if (!l.tags['Exchanges']) {
      //     l.tags['Exchanges'] = ['Other']
      //   }
      // }

      if (Object.entries(data.tags_catalog).filter(tags_group => tags_group[0] === 'flux_types').length > 0) {
        if (!l.tags['flux_types']) {
          if (l_convert.data && l_convert.data_value !== undefined) {
            l.tags['flux_types'] = ['initial_data', 'adjusted_data']
            delete l_convert.data
          } else {
            l.tags['flux_types'] = ['computed_data']
          }
          if (l_convert.unbounded) {
            l.tags['flux_types'] = ['unbounded']
          }
          if ('unbounded' in l_convert) {
            delete l_convert.unbounded
          }
          if (l_convert.value === 0) {
            l.tags['flux_types'] = ['null_data']
          }

          source_node.tags['flux_types'] = source_node.tags['flux_types'] ? [...new Set(
            [...source_node.tags['flux_types'], ...l.tags['flux_types']]
          )] : [...l.tags['flux_types']]

          target_node.tags['flux_types'] = target_node.tags['flux_types'] ? [...new Set(
            [...target_node.tags['flux_types'], ...l.tags['flux_types']]
          )] : [...l.tags['flux_types']]
        } else if (l.tags['flux_types'].includes('initial_data') && l_convert.data_value === undefined) {
          l.tags['flux_types'].splice(l.tags['flux_types'].indexOf('initial_data'))
        }
      }
    }
  )

  if (!data_to_convert.tags_catalog['dimensions']) {
    data_to_convert.tags_catalog['dimensions'] = {
      group_name: 'Dimensions',
      tags: {'Primaire' : {
        name: 'Primaire',
        selected: true,
        color: ''
      }},
      banner: 'one'
    }
  }

  if ('sankey_type' in data) {
    delete (data as ConvertSankeyData).sankey_type
  }

  if (display_style.filter_label === undefined) {
    display_style.filter_label = flux_max / 10
  }

  if (data.version === '0.1') {
    units_names.splice(1, 0, 'natural')
  }

  data.version = '0.4'
  setSelectedTags(data)
}
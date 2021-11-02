import { SankeyData, SankeyLink } from './types'
import { normalize_name, setSelectedTags } from './SankeyUtils'

interface ConvertSankeyNode {
  orientation?: string,
  subchain?: string,
  tooltips: any,
  total_input_offset: any,
  input_offsets: any,
  total_output_offset: any,
  output_offsets: any,
  horizontal_index: any,
  visible: number | boolean,
  trade_close: boolean
}
interface ConvertSankeyLink {
  classif: any
  title_length: any
  raw_value: any
  old_display_value: any
  old_color: any
  y_sd_label: any
  x_sd_label: any
  visible?: boolean
  label_visible?: boolean
  text_same_color?: boolean | string
  frozen?: boolean,
  link_reverse?: boolean,
  display_unit?: string,
  type?: string
  tooltip_text?: string
  data_value?: number
  agregated_data_value?: number
  conv?: number[]
  natural_unit?: string
  value: number
  display_value: string
  data?: boolean
  unbounded?: boolean,
  subchain?: string
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
  region_names: any,
  region_name: any,
  nodes_names: any,
  filtered_nodes: any,
  filtered_nodes_names: any,
  filtered_links: any,
  previous_filter: any
}


export const convert_data = (
  data_to_convert: SankeyData
): void => {
  const data = data_to_convert as SankeyData & ConvertSankeyData
  if (!data.display_style) {
    (data.display_style as any) = {}
  }
  if (data.tags_catalog === undefined ) {
    data.tags_catalog = []
  }
  if (!Array.isArray(data.links)) {
    const region_names = Object.keys(data.links)
    const new_links = JSON.parse(JSON.stringify(data.links[region_names[0]])) as SankeyLink[]
    new_links.forEach(
      (link, i) => {
        link.value = []
        link.display_value = []
        region_names.forEach(
          cur_region_name => {
            link.value.push(data.links[cur_region_name][i].value)
            link.display_value.push(data.links[cur_region_name][i].display_value)
          }
        )
      }
    )
    data_to_convert.links = new_links
    if ( region_names.length > 1) {
      data.tags_catalog.push({
        group_name: 'Regions',
        tags: region_names,
        selected_tags: [data.region_name !== undefined ? data.region_name : region_names[0]]
      })
    }
    delete data.region_names
    delete data.region_name
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
  if (data.h_space === undefined) {
    data.h_space = 200
  }
  if (data.v_space === undefined) {
    data.v_space = 100
  }
  if (data.left_shift === undefined) {
    data.left_shift = 1/3
  }
  if (data.right_shift === undefined) {
    data.right_shift = 2/3
  }

  if (data.flux_types || data.use_flux_types) {
    if (data.tags_catalog.filter(tags_group => tags_group.group_name === 'flux_types').length === 0) {
      data.tags_catalog.push({
        group_name: 'flux_types',
        tags: ['null_data', 'initial_data', 'computed_data', 'adjusted_data', 'unbounded'],
        selected_tags: ['null_data', 'computed_data', 'adjusted_data']
      })
      delete data.flux_types
      delete data.use_flux_types
    }
  }

  const attributes_to_remove = ['previous_filter','filtered_links','filtered_nodes_names','filtered_nodes','nodes_names','max_vertical_offset','error','nodes2units_conv','nodes2tooltips']
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data) {
      delete (data as any)[attributes_to_remove[attr]]
    }
  }

  let import_export = false
  const subchains : string[] = []
  nodes.forEach(
    n => {
      const n_convert = (n as unknown) as ConvertSankeyNode
      if (!n.tags) {
        n.tags = {}
      }
      if (n_convert.subchain && n_convert.subchain !== '') {
        n.tags['SubChain'] = n_convert.subchain.split(',')
        n_convert.subchain.split(',').forEach( s => {
          if ( !subchains.includes(s) ) {
            subchains.push(s)
          }
        })
        delete n_convert.subchain
      }
      if (n.label_visible === undefined) {
        n.label_visible = true
      }
      if (n.visible === undefined) {
        n.visible = true
      }
      if (n_convert.visible === 1) {
        n.visible = true
      }
      const attributes_to_remove = ['tooltips','total_input_offset','input_offsets','total_output_offset','output_offsets','horizontal_index','title_length','old_color']
      for (const attr in attributes_to_remove) {
        if (attributes_to_remove[attr] in n_convert) {
          delete (n_convert as any)[attributes_to_remove[attr]]
        }
      }
      if (n.name.includes('(I')) {
        import_export = true
        n.tags['Exchanges'] = ['Importations']
        if (!links[n.output_links[0]].tags) {
          links[n.output_links[0]].tags = {}
        }
        links[n.output_links[0]].tags['Exchanges'] = ['Importations']
        if (data.display_style.trade_close !== undefined ) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } else if (n.name.includes('(E')) {
        import_export = true
        n.tags['Exchanges'] = ['Exportations']
        if (!links[n.input_links[0]].tags) {
          links[n.input_links[0]].tags = {}
        }
        links[n.input_links[0]].tags['Exchanges'] = ['Exportations']
        if (data.display_style.trade_close !== undefined ) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } else if (!n.tags['Exchanges']) {
        n.tags['Exchanges'] = ['Other']
      }
    }
  )

  if ( 'trade_close' in data.display_style) {
    delete data.display_style.trade_close
  }

  if (import_export) {
    if (data.tags_catalog.filter(tag => tag.group_name === 'Exchanges').length === 0) {
      data.tags_catalog.push({
        group_name: 'Exchanges',
        tags: ['Importations', 'Exportations', 'Other'],
        selected_tags: ['Importations', 'Exportations', 'Other']
      })
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
        l_convert.subchain.split(',').forEach( s => {
          if ( !subchains.includes(s) ) {
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
      if (!('agregated_data_value' in l_convert)) {
        l_convert.agregated_data_value = l_convert.data_value
      }
      if (!('visible' in l_convert)) {
        l.visible = true
      }
      if (!('label_visible' in l_convert)) {
        l.label_visible = true
      }
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
      const attributes_to_remove = ['source','target','id','classif','title_length','raw_value','old_display_value','old_color','y_sd_label','x_sd_label','type']
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

      if (data.tags_catalog.filter(tags_group => tags_group.group_name === 'Exchanges').length > 0) {
        if (!l.tags['Exchanges']) {
          l.tags['Exchanges'] = ['Other']
        }
      }
      if (data.tags_catalog.filter(tags_group => tags_group.group_name === 'flux_types').length > 0) {
        if (!l.tags['flux_types']) {
          if (l_convert.data) {
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
        }
      }
    }
  )

  if (data.subchains && data.subchains[0] !== '') {
    if (data.tags_catalog.filter(tags_group => tags_group.group_name === 'SubChain').length === 0) {
      data.tags_catalog.push({
        group_name: 'SubChain',
        tags: [...data.subchains],
        selected_tags: [...data.subchains]
      })
      delete data.subchains
    }
  } else if (subchains.length > 0) {
    if (data.tags_catalog.filter(tags_group => tags_group.group_name === 'SubChain').length === 0) {
      data.tags_catalog.push({
        group_name: 'SubChain',
        tags: [...subchains],
        selected_tags: [...subchains]
      })
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
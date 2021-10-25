import { SankeyData, SankeyLink } from './types'
import { normalize_name } from './SankeyUtils'

interface ConvertSankeyNode {
  orientation?: string,
  subchain?: string[]
}
interface ConvertSankeyLink {
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
  unbounded?: boolean
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
}


export const convert_data = (
  data_to_convert: SankeyData
): void => {
  const data = data_to_convert as SankeyData & ConvertSankeyData
  if (!data.display_style) {
    (data.display_style as any) = {}
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
  }
  const { display_style, nodes, links, node_width, units_names } = data


  if (display_style.filter === undefined) {
    display_style.filter = 0
  }
  if (display_style.global_curvature === undefined) {
    display_style.global_curvature = 0.99
  }
  if (display_style.trade_close === undefined && data.version !== '0.1') {
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
  if (!data.tags) {
    data.tags = []
  }
  if (!data.selected_tags) {
    data.selected_tags = {}
  }

  if (data.flux_types || data.use_flux_types) {
    if (data.tags.filter(tag => tag.tags_group_name === 'flux_types').length === 0) {
      data.tags.push({
        tags_group_name: 'flux_types',
        tags_group: ['null_data', 'initial_data', 'computed_data', 'adjusted_data', 'unbounded']
      })
      data.selected_tags['flux_types'] = ['null_data', 'computed_data', 'adjusted_data']
      delete data.flux_types
    }
  }
  if (data.subchains) {
    if (data.tags.filter(tag => tag.tags_group_name === 'SubChain').length === 0) {
      data.tags.push({
        tags_group_name: 'SubChain',
        tags_group: data.subchains
      })
      delete data.subchains
    }
  }

  let import_export = false
  nodes.forEach(
    n => {
      const n_convert = n as ConvertSankeyNode
      if (!n.tags) {
        n.tags = {}
      }
      if (n_convert.subchain) {
        n.tags['Subchain'] = n_convert.subchain
      }
      if (n.label_visible === undefined) {
        n.label_visible = true
      }
      if (n.visible === undefined) {
        n.visible = true
      }
      if (n.name.includes('(I')) {
        import_export = true
        n.tags['Exchanges'] = ['Importations']
        if (!links[n.output_links[0]].tags) {
          links[n.output_links[0]].tags = {}
        }
        links[n.output_links[0]].tags['Exchanges'] = ['Importations']
      } else if (n.name.includes('(E')) {
        import_export = true
        n.tags['Exchanges'] = ['Exportations']
        if (!links[n.input_links[0]].tags) {
          links[n.input_links[0]].tags = {}
        }
        links[n.input_links[0]].tags['Exchanges'] = ['Exportations']
      } else if (!n.tags['Exchanges']) {
        n.tags['Exchanges'] = ['Other']
      }
    }
  )

  if (import_export) {
    if (data.tags.filter(tag => tag.tags_group_name === 'Exchanges').length === 0) {
      data.tags.push({
        tags_group_name: 'Exchanges',
        tags_group: ['Importations', 'Exportations', 'Other']
      })
      data.selected_tags['Exchanges'] = ['Importations', 'Exportations', 'Other']
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
      if (!('orientation' in l)) {
        (l as SankeyLink).orientation = 'hh'
        if ((source_node as ConvertSankeyNode).orientation === 'horizontal' && (target_node as ConvertSankeyNode).orientation === 'vertical') {
          (l as SankeyLink).orientation = 'vh'
        } else if ((source_node as ConvertSankeyNode).orientation === 'vertical' && (target_node as ConvertSankeyNode).orientation === 'horizontal') {
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
      if ('type' in l) {
        delete l_convert.type
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
      }
      if (!('text_color' in l) || l_convert.text_same_color === false) {
        l.text_color = 'black'
      } else if (l_convert.text_same_color === true) {
        l.text_color = l.color
      } else if (l_convert.text_same_color === 'same_color') {
        l.text_color = l.color
      }
      if (!l.tags) {
        l.tags = {}
      }
      if (data.tags.filter(tag => tag.tags_group_name === 'Exchanges').length > 0) {
        if (!l.tags['Exchanges']) {
          l.tags['Exchanges'] = ['Other']
        }
      }
      if (data.tags.filter(tag => tag.tags_group_name === 'flux_types').length > 0) {
        if (!l.tags['flux_types']) {
          if (l_convert.data) {
            l.tags['flux_types'] = ['initial_data', 'computed_data']
            delete l_convert.data
          } else {
            l.tags['flux_types'] = ['adjusted_data']
          }
          if (l_convert.unbounded) {
            l.tags['flux_types'] = ['unbounded']
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
}
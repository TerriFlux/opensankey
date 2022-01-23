import { SankeyData, SankeyLink, SankeyNode } from './types'
import {compute_default_input_outputLinksId} from './SankeyLayout'

interface ConvertSankeyNode {
  id?: string
  orientation?: string,
  subchain?: string,
  tooltips: string[],
  total_input_offset: number,
  input_offsets: number[],
  total_output_offset: number,
  input_links?: number[],
  output_links?: number[],
  output_offsets: number[],
  horizontal_index: number,
  visible?: number | boolean,
  display: number | boolean,
  label_visible: number | boolean,
  shape_visible: number | boolean,
  node_visible: number | boolean,  
  trade_close: boolean,
  show_value: number | boolean
}
interface ConvertSankeyLink {
  classif?: string
  title_length?: number
  raw_value?: number
  old_display_value?: string
  old_color?: string
  y_sd_label?: string
  x_sd_label?: string
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
  display_value?: string | string[]
  data?: boolean
  //unbounded?: boolean,
  subchain?: string,
  mini?: number | number[],
  maxi?: number | number[]
}
interface ConvertSankeyData {
  units_names: string[]
  display_style: {
    trade_close?: boolean,
    unit?: boolean | number
  }
  show_uncert?: boolean
  sankey_type?: string,
  flux_types?: string[],
  use_flux_types?: boolean
  subchains?: string[]
  links?: { [region_name: string]: ConvertSankeyLink[] }
  nodes2tooltips: unknown,
  nodes2units_conv: unknown,
  error: string,
  max_vertical_offset: number,
  region_names?: string[],
  region_name?: string,
  nodes_names: string[],
  filtered_nodes: SankeyNode[],
  filtered_nodes_names: string[],
  filtered_links: SankeyLink[],
  previous_filter: number,
  trade_hspace?: number
  trade_close_hspace?: number
  trade_close_vspace?: number
  periods?: boolean
  tags_catalog: { group_name: string, show_legend: boolean, tags: string[], selected_tags: string[] }[]
}

const normalize_name = (name: string) => {
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}

export const convert_data = (
  data_to_convert: SankeyData
): void => {
  const data = data_to_convert as SankeyData & ConvertSankeyData
  
  console.log('FUNCTION : convert_data')

  if (!data.display_style) {
    (data.display_style as Record<string,unknown> ) = {}
  }
  if (data_to_convert.tags_catalog === undefined) {
    data_to_convert.tags_catalog = {}
  }
  if (data_to_convert.dataTags === undefined) {
    data_to_convert.dataTags = {}
  }
  if (data.width === undefined) {
    data.width = 1500
  }

  if (Array.isArray(data.tags_catalog)) {
    data_to_convert.tags_catalog = Object.assign({}, ...data.tags_catalog.map((tags_group) => (
      {
        [tags_group.group_name]: {
          group_name: tags_group.group_name,
          show_legend: tags_group.show_legend,
          tags: Object.assign({}, ...tags_group.tags.map((tag_name) => ({ [tag_name]: { name: tag_name, color: '', selected: tags_group.selected_tags.includes(tag_name) } }))),
          banner: tags_group.group_name === 'Regions' || tags_group.group_name === 'Periods' || tags_group.group_name === 'dimension' ? 'one' : 'multi'
        }
      }
    )))
  }

  Object.values(data_to_convert.tags_catalog).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
    }
  )
  if (data_to_convert.tags_catalog['Regions']) {
    data_to_convert.dataTags['Regions'] = JSON.parse(JSON.stringify(data_to_convert.tags_catalog['Regions']))
    delete data_to_convert.tags_catalog['Regions']
  }
  if (data_to_convert.tags_catalog['Periods']) {
    data_to_convert.dataTags['Periods'] = JSON.parse(JSON.stringify(data_to_convert.tags_catalog['Periods']))
    delete data_to_convert.tags_catalog['Periods']
  }
  if (data_to_convert.tags_catalog['flux_types']) {
    data_to_convert.dataTags['flux_types'] = {
      group_name : 'Type de donnée',
      show_legend: false,
      color_map: 'custom',
      tags : {
        initial_data  : { name : 'Données collectées' , selected: true, color : 'cyan' },
        computed_data : { name : 'Données calculées'  , selected: true, color : 'blue' },
      },
      banner : 'display'
    }
    delete data_to_convert.tags_catalog['flux_types']
  }
  if (data_to_convert.tags_catalog['Uncert']) {
    data_to_convert.dataTags['Uncert'] = JSON.parse(JSON.stringify(data_to_convert.tags_catalog['Uncert']))
    data_to_convert.dataTags['Uncert'].banner = 'display'
    delete data_to_convert.tags_catalog['Uncert']
  }
  if (data_to_convert.tags_catalog['SubChain']) {
    data_to_convert.tags_catalog['SubChain'].group_name = 'Sous-Filières'
  }
  if (data_to_convert.tags_catalog['Exchanges']) {
    data_to_convert.tags_catalog['Exchanges'].group_name = 'Echanges'
  }
  if (!Array.isArray(data.links) && data.version !== '0.5' && data.version !== '0.6') {
    const key_names = Object.keys(data.links)
    const new_links = JSON.parse(JSON.stringify(data.links[key_names[0]])) as SankeyLink[]
    new_links.forEach(
      (link, i) => {
        (link as any).value = [];
        (link as any).display_value = []
        const convert_link = (link as unknown) as ConvertSankeyLink
        if (convert_link.mini !== undefined && convert_link.maxi !== undefined) {
          convert_link.mini = []
          convert_link.maxi = []
        }
        if (convert_link.data_value !== undefined) {
          convert_link.data_value = []
        }
        if (convert_link.data_source !== undefined) {
          convert_link.data_source = []
        }
        if (convert_link.data_period !== undefined) {
          convert_link.data_period = []
        }

        key_names.forEach(
          cur_key_name => {
            (link.value as any).push(data.links[cur_key_name][i].value as number);
            (link as any).display_value.push(data.links[cur_key_name][i].display_value as string)
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
    new_links.forEach((l, i) => l.idLink = 'link' + i)
    data_to_convert.links = Object.assign({}, ...new_links.map(l => ({ [l.idLink]: { ...l } })));
    ((data_to_convert.nodes as unknown) as SankeyNode[]).forEach((n: SankeyNode, i: number) => n.idNode = 'node' + i)
    data_to_convert.nodes = Object.assign({}, ...((data_to_convert.nodes as unknown) as SankeyNode[]).map((n: SankeyNode) => ({ [n.idNode]: { ...n } })))
    if (key_names.length > 1 && !data.periods && data.region_names) {
      data.dataTags['Regions'] = {
        group_name: 'Regions',
        color_map: 'jet',
        show_legend: false,
        tags: Object.assign({}, ...data.region_names.map((region_name) => ({ [region_name]: { name: region_name, color: '', selected: region_name === data.region_name } }))),
        banner: 'one'
      }
    }
    if (key_names.length > 1 && data.periods) {
      data.dataTags['Periods'] = {
        group_name: 'Periods',
        color_map: 'jet',
        show_legend: false,
        tags: Object.assign({}, ...key_names.map((key_name) => ({ [key_name]: { name: key_name, color: '', selected: key_names[0] } }))),
        banner: 'one'
      }
    }
    delete data.periods
    delete data.region_names
    delete data.region_name
  }

  if (Array.isArray(data.links) && (data.version === '0.5' || data.version === '0.4' || !data.version)) {
    if (((data.links as unknown) as SankeyLink[] ).length > 0 && !data.links[0].idLink) {
      ((data.links as unknown) as SankeyLink[]).forEach((l: SankeyLink, i: number) => l.idLink = 'link' + i)
    }
    if (((data.nodes as unknown) as SankeyNode[] ).length > 0 && !data.nodes[0].idNode) {
      ((data.nodes as unknown) as SankeyNode[] ).forEach((n: SankeyNode) => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
    }
    data_to_convert.links = Object.assign({}, ...((data.links as unknown) as SankeyLink[]).map((l: SankeyLink) => ({ [l.idLink]: { ...l } })))
    data_to_convert.nodes = Object.assign({}, ...((data.nodes as unknown) as SankeyNode[]).map((n: SankeyNode) => ({ [n.idNode]: { ...n } })))
  }
  if (Object.keys(data.links).length > 0 && !Object.values(data.links)[0].idLink) {
    Object.values(data.links).forEach((l, i) => l.idLink = 'link' + i)
  }
  if (Object.keys(data.nodes).length > 0 && !Object.values(data.nodes)[0].idNode) {
    Object.values(data.nodes).forEach(n => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
  }
  Object.values(data.links).forEach(l => {
    if (((l  as unknown) as {source_name:string}).source_name) {
      const source_node = Object.values(data.nodes).filter(n => normalize_name(n.name) === normalize_name(((l  as unknown) as {source_name:string}).source_name))[0]
      const target_node = Object.values(data.nodes).filter(n => normalize_name(n.name) === normalize_name(((l  as unknown) as {target_name:string}).target_name))[0]
      l.idSource = source_node.idNode
      l.idTarget = target_node.idNode
      delete ((l  as unknown) as {source_name?:string}).source_name
      delete ((l  as unknown) as {target_name?:string}).target_name
    }
  })

  if (!data_to_convert.tags_catalog) {
    data_to_convert.tags_catalog = {}
  }

  Object.values(data.nodes).forEach( n => {
    if (((n as unknown) as ConvertSankeyNode).input_links) {
      n.inputLinksId = []
      n.outputLinksId = [];
      (((n as unknown) as ConvertSankeyNode).input_links as number[]).forEach(link_idx => {
        n.inputLinksId.push(data.links['link' + link_idx].idLink)
      });
      (((n as unknown) as ConvertSankeyNode).output_links as number[]).forEach(link_idx => {
        n.outputLinksId.push(data.links['link' + link_idx].idLink)
      })
      delete ((n as unknown) as ConvertSankeyNode).output_links
      delete ((n as unknown) as ConvertSankeyNode).input_links
      delete ((n as unknown) as ConvertSankeyNode).id
    }
  })
  let recompute_input_output_links = true
  Object.values(data.nodes).forEach(n => {
    if (n.inputLinksId || n.outputLinksId) {
      recompute_input_output_links = false
    }
    if (!n.inputLinksId) {
      n.inputLinksId = []
    }
    if (!n.outputLinksId) {
      n.outputLinksId = []
    }
  })
  if (recompute_input_output_links) {
    compute_default_input_outputLinksId(data.nodes,data.links)
  }
  const { display_style, nodes, links, node_width, units_names } = data


  if (display_style.filter === undefined) {
    display_style.filter = 0
  }
  if (display_style.global_curvature === undefined) {
    display_style.global_curvature = 0.99
  }
  if (display_style.trade_close === undefined && (data.version === '0.2' || data.version === '0.3')) {
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

  if ((data.display_style.unit as unknown) as number === 1) {
    data.display_style.unit = true
  }

  if (data.node_width === undefined) {
    data.node_width = 10
  }
  if (data.display_style.null_flux === undefined) {
    data.display_style.null_flux = false
  }

  if (data.h_space === undefined) {
    data.h_space = 200
  }
  if (data.v_space === undefined) {
    data.v_space = 100
  }
  if (data.trade_hspace === undefined) {
    data.trade_hspace = 200
  }
  if (data.left_shift === undefined) {
    data.left_shift = 0.4
  }
  if (data.right_shift === undefined) {
    data.right_shift = 0.5
  }
  if (data.trade_close_hspace === undefined) {
    data.trade_close_hspace = 50
  }
  if (data.trade_close_vspace === undefined) {
    data.trade_close_vspace = 20
  }
  if (data.legend_position === undefined) {
    data.legend_position = [0,100]
  }

  const attributes_to_remove = ['previous_filter', 'filtered_links', 'filtered_nodes_names', 'filtered_nodes', 'nodes_names', 'max_vertical_offset', 'error', 'nodes2units_conv', 'nodes2tooltips']
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data) {
      delete ((data as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
    }
  }

  let import_export = false
  const subchains: string[] = []
  Object.values(nodes).forEach(
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
      if (n.x === undefined) {
        n.x = 0
      }
      if (n.y === undefined) {
        n.y = 0
      }
      if (n_convert.visible === undefined && !n.node_visible && data.version !== '0.5' ) {
        n.shape_visible = true
      }
      if (n_convert.visible === 1) {
        n.shape_visible = true
      }
      if (n_convert.visible === 0) {
        n.shape_visible = false
      }
      if (n_convert.show_value === 0 || n_convert.show_value === undefined) {
        n.show_value = false
      }
      if (n_convert.show_value === 1) {
        n.show_value = true
      }
      if (n_convert.label_visible === 1) {
        n.label_visible = true
      }
      if (n_convert.label_visible === 0) {
        n.label_visible = false
      }
      if (n.label_visible === undefined || n_convert.label_visible === 1) {
        n.label_visible = true
      }
      if (n.shape_visible === undefined || n_convert.shape_visible === 1) {
        n.shape_visible =true
      }
      if (n.nodeParameter === undefined) {
        n.nodeParameter = 'general'
      }
      delete n_convert.visible
      if (n.node_visible === undefined) {
        n.node_visible = n.shape_visible || n.label_visible
      }
      if (n_convert.node_visible === 1) {
        n.node_visible = true
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

      if (n.colorTag === undefined) {
        n.colorTag = ''
      }

      delete n_convert.visible

      n.name = n.name.split('\\n').join(' ')

      const attributes_to_remove = ['tooltips','total_input_offset','input_offsets','total_output_offset','output_offsets','horizontal_index','title_length','old_color']
      for (const attr in attributes_to_remove) {
        if (attributes_to_remove[attr] in n_convert) {
          delete ((n_convert as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
        }
      }
      if (n.name.includes('(I') && n.outputLinksId.length > 0) {
        import_export = true
        n.node_visible = true
        n.tags['Exchanges'] = ['import']
        //const l = links[n.outputLinksId[0]]
        // if (!l.tags) {
        //   l.tags = {}
        // }
        //l.tags['Exchanges'] = ['import']
        if (data.display_style.trade_close !== undefined) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } else if (n.name.includes('(E')) {
        import_export = true
        n.node_visible = true
        n.tags['Exchanges'] = ['export']
        //const l = links[n.inputLinksId[0]]
        // if (!l.tags) {
        //   l.tags = {}
        // }
        //l.tags['Exchanges'] = ['export']
        if (data.display_style.trade_close !== undefined) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } //else if (!n.tags['Exchanges']) {
      //   n.tags['Exchanges'] = ['interior']
      // }
      if (n.tags && n.tags['Exchanges'] && (n.tags['Exchanges'][0].includes('mport') || n.tags['Exchanges'][0].includes('xport')) && n_convert.trade_close && !n.position) {
        n.position = 'relative'
        n.x = n.tags['Exchanges'][0].includes('import') ? -(data.trade_close_hspace as number) : data.trade_close_hspace as number
        n.y = n.tags['Exchanges'][0].includes('import') ? -(data.trade_close_vspace as number) : data.trade_close_vspace as number      
      }
      if (!n.position) {
        n.position = 'absolute'        
      }
      if (!n.dimensions) {
        n.dimensions = { 'Primaire': { level : 1, parent_name: undefined } }      
      }
      
    }
  )

  if ('trade_close' in data.display_style) {
    delete data.display_style.trade_close
  }

  if (import_export) {
    if (Object.entries(data.tags_catalog).filter(tag => tag[0] === 'Exchanges').length === 0) {
      data.tags_catalog['Exchanges'] = {
        group_name: 'Echanges',
        show_legend: false,
        color_map: 'jet',
        tags: {
          'import': { name: 'Importations', selected: true },
          'export': { name: 'Exportations', selected: true },
          'interior' : { name: 'Intérieur', selected: true }
        },
        banner: 'multi'
      }
    }
  }

  if (data.subchains && data.subchains[0] !== '') {
    const cpySbchaine = data.subchains
    if (Object.entries(data.tags_catalog).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      const tags_dict = Object.assign({}, ...cpySbchaine.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
      data.tags_catalog['SubChain'] = {
        group_name: 'Sous-Filières',
        color_map: 'jet',
        show_legend: false,
        tags: tags_dict,
        banner: 'multi'
      }
      delete data.subchains
    }
  } else if (subchains.length > 0) {
    const tags_dict = Object.assign({}, ...subchains.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
    if (Object.entries(data.tags_catalog).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      data.tags_catalog['SubChain'] = {
        group_name: 'Sous-Filières',
        show_legend: false,
        color_map: 'jet',
        tags: tags_dict,
        banner: 'multi'
      }
    }
  }

  if (data.flux_types || data.use_flux_types) {
    if (!data.dataTags['flux_types']) {
      data.dataTags['flux_types'] = {
        group_name: 'Type de donnée',
        show_legend: false,
        color_map: 'custom',
        tags: {
          'initial_data' : { name: 'Données collectées', selected: true, color:'cyan' },
          'computed_data': { name: 'Données calculées' , selected: true, color:'blue' },
        },
        banner: 'display'
      }
      delete data.flux_types
      delete data.use_flux_types
    }
  }

  let flux_max = 0
  Object.values(links).forEach(
    l => {
      const l_convert = (l as unknown) as ConvertSankeyLink
      if (data.version !== '0.6' ) {
        (l_convert.value as number[]).forEach(v => {
          v = +v
          if (flux_max < v) {
            flux_max = v
          }
        })
        delete (((l as unknown) as { tags : { Exchanges? : string } } ).tags)['Exchanges']
      }
      const source_node = nodes[l.idSource]
      const target_node = nodes[l.idTarget]
      if (!source_node || !target_node) {
        return
      }
      if (l.label_visible === undefined) {
        l.label_visible = true
      }

      if (l.color === undefined) {
        l.color = source_node.color
      }
      if (l.shift_gap === undefined) {
        if (l.left_horiz_shift && l.right_horiz_shift && !l.recycling) {
          l.shift_gap = (l.right_horiz_shift - l.left_horiz_shift)/2
        } else {
          l.shift_gap = 0.1
        }
      }
      if (l_convert.subchain && l_convert.subchain !== '' ) {
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
      // if (!('display_value' in l)) {
      //   (l as SankeyLink).display_value = ['default']
      // }
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
          delete ((l as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
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
    }
  )
  if (data.version !== '0.6') {
    const links_no_type = data.links as any
    Object.values(links_no_type).forEach(
      (link : any) => {
        links_no_type[link.idLink].value2     = {}
        //links_no_type[link.idLink].display_value2 = {}
      }
    )

    let region_names : string[] = []
    let period_names : string[] = []
    if (data_to_convert.dataTags['Regions']) {
      region_names = Object.keys(data_to_convert.dataTags['Regions'].tags)
      region_names.forEach(region_name => 
        Object.values(links_no_type).forEach((link : any)=> links_no_type[link.idLink].value2[region_name] = {} )
      )
    } else if (data_to_convert.dataTags['Periods']) {
      period_names = Object.keys(data_to_convert.dataTags['Periods'].tags)
      period_names.forEach(period_name => 
        Object.values(links_no_type).forEach((link : any) => links_no_type[link.idLink].value2[period_name] = {} )
      )           
    }

    if ( region_names.length > 0 || period_names.length > 0) {
      const reg_or_period_names = region_names.length > 0 ? region_names : period_names
      reg_or_period_names.forEach((region_name,value_index) => {
        Object.values(links_no_type).forEach(
          (link : any)=> {
            const editable_link = links_no_type[link.idLink]
            editable_link.value2[region_name] = {
              value          : (link.value as any)[value_index],
              display_value  : ((link as any).display_value as any)[value_index],
              color_tag            : {},
              extension : {}
            }
            if (editable_link.mini !== undefined && editable_link.mini !== null) {
              editable_link.value2[region_name].extension.mini = editable_link.mini
              editable_link.value2[region_name].extension.maxi = editable_link.maxi
              editable_link.value2[region_name]['color_tag']['Uncert'] = {}
              const p = (editable_link.maxi[value_index] - editable_link.mini[value_index])/editable_link.value[value_index]
              if (p <= 0.1) {
                editable_link.value2[region_name]['color_tag']['Uncert'] ='10_percent'
              } else if (p <= 0.25) {
                editable_link.value2[region_name]['color_tag']['Uncert'] ='25_percent'
              } else if (p <= 0.5) {
                editable_link.value2[region_name]['color_tag']['Uncert'] ='50_percent'
              } else {
                editable_link.value2[region_name]['color_tag']['Uncert'] ='50+_percent'
              }
            }
            if (data_to_convert.dataTags['flux_types']) {
              editable_link.value2[region_name]['color_tag']['flux_types'] = 'computed_data'
            }
            if (editable_link.data_value !== undefined && editable_link.data_value !== null ) {
              editable_link.value2[region_name].extension.data_value  = editable_link.data_value
              editable_link.value2[region_name].extension.data_source = editable_link.data_source
              editable_link.value2[region_name].extension.data_period = editable_link.data_period
              editable_link.value2[region_name]['color_tag']['flux_types'] = 'initial_data'
            }
          }
        )               
      })
    } else {
      Object.values(links_no_type).forEach(
        (link : any) => {
          const editable_link = links_no_type[link.idLink]
          editable_link.value2 = {
            value : (link.value as any)[0],
            display_value : ((link as any).display_value as any)[0],
            color_tag            : {},
            extension : {}
          }
          if (editable_link.mini !== undefined && editable_link.mini !== null) {
            editable_link.value2.extension.mini = editable_link.mini
            editable_link.value2.extension.maxi = editable_link.maxi
            editable_link.value2['color_tag']['Uncert'] = {}
            const p = (editable_link.maxi[0] - editable_link.mini[0])/editable_link.value[0]
            if (p <= 0.1) {
              editable_link.value2['color_tag']['Uncert'] ='10_percent'
            } else if (p <= 0.25) {
              editable_link.value2['color_tag']['Uncert'] ='25_percent'
            } else if (p <= 0.5) {
              editable_link.value2['color_tag']['Uncert'] ='50_percent'
            } else {
              editable_link.value2['color_tag']['Uncert'] ='50+_percent'
            }
          }
          if (data_to_convert.dataTags['flux_types']) {
            editable_link.value2['color_tag']['flux_types'] = 'computed_data'
          }
          if (editable_link.data_value !== undefined && editable_link.data_value !== null ) {
            editable_link.value2.extension.data_value  = editable_link.data_value
            editable_link.value2.extension.data_source = editable_link.data_source
            editable_link.value2.extension.data_period = editable_link.data_period
            editable_link.value2['color_tag']['flux_types'] = 'initial_data'
          }
        }
      )          
    }
    Object.values(data.links).forEach(
      link => {    
        (data.links[link.idLink] as any).value = (data.links[link.idLink] as any).value2
        delete (data.links[link.idLink] as any).value2
      }
    )
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

  data.version = '0.6'
}
import { SankeyData, SankeyLink, SankeyLinkValue, SankeyLinkValueDict, SankeyNode,TagsCatalog,TagsGroup } from './types'
import {compute_default_input_outputLinksId} from './SankeyLayout'
import colormap from 'colormap'

interface ConvertSankeyNode {
  id?: string
  orientation?: string,
  subchain?: string,
  definition?: string,
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
  show_value: number | boolean,
  type?: string
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
  frozen?: boolean
  link_reverse?: boolean
  display_unit?: string
  type?: string
  tooltip_text?: string
  data_value?: number | number[]
  data_source?: string | string[]
  data_period?: string | string[]
  agregated_data_value?: number
  conv?: number[]
  natural_unit?: string
  value: number | number[]
  value2: {[key:string]:SankeyLinkValue} | {[key:string]:SankeyLinkValueDict}
  display_value?: string | string[]
  data?: boolean
  //unbounded?: boolean
  subchain?: string
  mini?: number | number[]
  maxi?: number | number[]
}
interface ConvertSankeyData {
  units_names: string[]
  display_style: {
    trade_close?: boolean
    unit?: boolean | number
    font_family_selected?: string
    font_size: number
  }
  node_width: number
  node_height: number
  show_uncert?: boolean
  tags_catalog?: TagsCatalog
  sankey_type?: string
  flux_types?: string[]
  use_flux_types?: boolean
  subchains?: string[]
  links?: { [region_name: string]: ConvertSankeyLink[] }
  nodes2tooltips: unknown
  nodes2units_conv: unknown
  error: string
  max_vertical_offset: number
  region_names?: string[]
  region_name?: string
  nodes_names: string[]
  filtered_nodes: SankeyNode[]
  filtered_nodes_names: string[]
  filtered_links: SankeyLink[]
  previous_filter: number
  trade_hspace?: number
  trade_close_hspace?: number
  trade_close_vspace?: number
  trade_sectors?: string[]
  periods?: boolean
  nodeTags: { group_name: string, show_legend: boolean, tags: string[], selected_tags: string[] }[]
  agregated_level?: number
}

interface ConvertSankeyValue {
  color_tag? : { [key:string]: string}
  extension : {
    mini: number
    maxi: number
    free_mini: number,
    free_maxi: number
  }
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

  // if ( 'layout' in data) {
  //   type layout_type = {
  //     layout?: SankeyData
  //   }
  //   delete (data as unknown as layout_type).layout
  // }
  if (!data.display_style) {
    (data.display_style as Record<string,unknown> ) = {}
  }
  if (!data.grid_visible) {
    data.grid_visible = true
  }
  if (data.tags_catalog) {
    data_to_convert.nodeTags = Object.assign(data.tags_catalog)
  }
  if (data_to_convert.dataTags === undefined) {
    data_to_convert.dataTags = {}
  }
  if (data_to_convert.fluxTags === undefined) {
    data_to_convert.fluxTags = {}
  }
  if (data_to_convert.nodeTags === undefined) {
    data_to_convert.nodeTags = {}
  }
  if (data.labels === undefined) {
    data.labels = {}
  }
  delete data.tags_catalog

  if (Array.isArray(data.nodeTags)) {
    data_to_convert.nodeTags = Object.assign({}, ...data.nodeTags.map((tags_group) => (
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

  Object.values(data_to_convert.nodeTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
      if(tags_group.color_map === undefined) { tags_group.color_map='jet'}
      if(Object.values(tags_group.tags).filter(tag=>tag.color !== '').length === 0) {
        const nb_tags = Object.keys(tags_group.tags).length
        if (tags_group.color_map === 'custom') {
          return
        }
        const colors = colormap({
          colormap: tags_group.color_map,
          nshades: Math.max(11, nb_tags),
          format: 'hex',
          alpha: 1
        })
        let step = 1
        if (nb_tags < 11) {
          step = Math.round(11 / nb_tags)
        }
        Object.keys(tags_group.tags).forEach(
          (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
        )
      }
    }
  )
  Object.values(data_to_convert.fluxTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
      if(tags_group.color_map === undefined) { tags_group.color_map='jet'}
      if(Object.values(tags_group.tags).filter(tag=>tag.color !== '').length === 0) {
        const nb_tags = Object.keys(tags_group.tags).length
        if (tags_group.color_map === 'custom') {
          return
        }
        const colors = colormap({
          colormap: tags_group.color_map,
          nshades: Math.max(11, nb_tags),
          format: 'hex',
          alpha: 1
        })
        let step = 1
        if (nb_tags < 11) {
          step = Math.round(11 / nb_tags)
        }
        Object.keys(tags_group.tags).forEach(
          (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
        )
      }
    }
  )
  Object.values(data_to_convert.dataTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
      if(tags_group.color_map === undefined) { tags_group.color_map='jet'}
    }
  )
  if (data_to_convert.nodeTags['Regions']) {
    data_to_convert.dataTags['Regions'] = JSON.parse(JSON.stringify(data_to_convert.nodeTags['Regions']))
    delete data_to_convert.nodeTags['Regions']
  }
  if (data_to_convert.nodeTags['Periods']) {
    data_to_convert.dataTags['Periods'] = JSON.parse(JSON.stringify(data_to_convert.nodeTags['Periods']))
    delete data_to_convert.nodeTags['Periods']
  }
  if (data_to_convert.nodeTags['flux_types']) {
    data_to_convert.fluxTags['flux_types'] = {
      group_name : 'Type de donnée',
      show_legend: false,
      color_map: 'custom',
      tags : {
        initial_data  : { name : 'Données collectées' , selected: true, color : 'cyan' },
        computed_data : { name : 'Données calculées'  , selected: true, color : 'blue' },
      },
      banner : 'multi'
    }
    delete data_to_convert.nodeTags['flux_types']
  }
  if (data_to_convert.nodeTags['Uncert']) {
    data_to_convert.fluxTags['Uncert'] = JSON.parse(JSON.stringify(data_to_convert.nodeTags['Uncert']))
    data_to_convert.fluxTags['Uncert'].banner = 'multi'
    delete data_to_convert.nodeTags['Uncert']
  }
  if (data_to_convert.nodeTags['SubChain']) {
    data_to_convert.nodeTags['SubChain'].group_name = 'Sous-Filières'
  }

  Object.entries(data_to_convert.dataTags).forEach(
    ([key,tags_group]) => {
      if (tags_group.banner === 'display'|| key === 'flux_types' || key ==='Uncert' ) {
        data.fluxTags[key] = {...tags_group}
        data.fluxTags[key].banner = 'none'
      }
    }
  )
  const new_dataTags = Object.entries(data_to_convert.dataTags).filter(([key,tag_group])=>tag_group.banner !== 'display' && key !== 'flux_types' && key !=='Uncert')
  data.dataTags = Object.assign({}, ...new_dataTags.map(([key,v]) => ({ [key]: { ...v } })))

  if (!Array.isArray(data.links) && data.version !== '0.5' && data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
    const key_names = Object.keys(data.links)
    const new_links = JSON.parse(JSON.stringify(data.links[key_names[0]])) as SankeyLink[]
    new_links.forEach(
      (link, i) => {
        (link as unknown as ConvertSankeyLink).value = [];
        (link as unknown as ConvertSankeyLink).display_value = []
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
            ((link as unknown as ConvertSankeyLink).value as number[]).push(data.links[cur_key_name][i].value as number);
            ((link as unknown as ConvertSankeyLink).display_value as string[]).push(data.links[cur_key_name][i].display_value as string)
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

  if (!data_to_convert.nodeTags) {
    data_to_convert.nodeTags = {}
  }
  if (!data_to_convert.accordeonToShow) {
    data_to_convert.accordeonToShow = ['MEP']
  }
  if (!data_to_convert.icon_catalog) {
    data_to_convert.icon_catalog = {}
  }
  if (!data_to_convert.agregation) {
    data_to_convert.agregation = {
      dimension:'Primaire',
      level:1
    }
  }
  if (data_to_convert.agregation.level === 0) {
    data_to_convert.agregation.level = 1
  }
  if (!data_to_convert.agregation.dimension) {
    data_to_convert.agregation.dimension = 'Primaire'
  }
  if (data.agregated_level) {
    delete data.agregated_level
  } 
  if (!data_to_convert.style_node) {
    data_to_convert.style_node = {
      'default': {
        name: 'par défaut',
        idNode: 'default',
        display: true,
        node_visible: true,
        shape_visible: true,
        label_visible: true,
        node_width: 40,
        node_height: 40,
        iconName: 'none',
        iconColor: '#fff',
        iconRatio: 80,
        iconVisible: true,

        shape: 'rect',
        color: '#a9a9a9',
        colorParameter: 'local',
        position: 'absolute',
        x: 100,
        y: 100,
        inputLinksId: [],
        outputLinksId: [],
        show_value: false,
        tags: {},
        colorTag: '',
        dimensions: {},
        style: '',
        display_style: {
          font_family: 'Cormorant',
          font_size: 14,
          uppercase: false,
          bold: false,
          italic: false,
          unit: false,
          filter: 0,
          filter_label: 0,
          global_curvature: 0.5,
          null_flux: false,
          label_vert: 'bas',
          label_horiz: 'milieu',
          label_vert_valeur: 'milieu',
          label_horiz_valeur: 'milieu',
          value_font_size:14,
          label_box_width: 110,
        }
      }
    }
  }
  if (!data_to_convert.style_link) {
    data_to_convert.style_link = {
      'default': {
        idLink: 'par défaut',
        idSource: 'None',
        idTarget: 'None',

        // type of link
        recycling: false,
        orientation: 'hh',
        arrow: true,

        // display_attribute
        label_position: 'middle',
        orthogonal_label_position: 'middle',
        label_on_path: true,
        label_visible: true,
        text_color: 'black',
        color: '#a9a9a9',
        colorParameter: '',
        colorTag: '',
        // Ajout
        gradient: false,
        dashed:false,

        value: {},

        tooltip_text: '',

        // geometry
        x_label: 0,
        y_label: 0,

        vert_shift: 0,
        shift_gap: 0.1,

        curvature: 0.5,
        curved: false,
        style:''
      }
    }
  }
  if (!data.nodeTags.Dimensions) {
    data.nodeTags.Dimensions = {
      group_name : 'Dimensions',
      color_map: 'jet',
      show_legend: false,
      tags : {
        Primaire : {
          name : 'Primaire',
          selected: true
        }
      },
      banner: 'none'
    }
  }
  data.nodeTags.Dimensions.banner = 'none'

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
  const { display_style, nodes, links, units_names } = data


  if (display_style.filter === undefined) {
    display_style.filter = 0
  }
  if (display_style.font_family === undefined) {
    display_style.font_family = ['Arial','Roboto','Cormorant','Cantarell']
    if (display_style.font_family_selected) {
      display_style.node_font_family_selected = display_style.font_family_selected
      display_style.link_font_family_selected = display_style.font_family_selected
    } else {
      display_style.node_font_family_selected = 'Arial'
      display_style.link_font_family_selected = 'Arial'      
    }
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

    data.show_uncert = false
  }
  if (data.version === '0.2') {
    display_style.sector_uppercase = true
    display_style.sector_bold = true
    
    data.show_uncert = false
  }
  if (data.version === '0.3') {
    data.show_uncert = false
  }

  if ((data.display_style.unit as unknown) as number === 1) {
    data.display_style.unit = true
  }
  
  if (data.display_style.null_flux === undefined) {
    data.display_style.null_flux = false
  }
  if (data.display_style.node_font_size === undefined) {
    data.display_style.node_font_size = data.display_style.font_size 
  }
  if (data.display_style.link_font_size === undefined) {
    data.display_style.link_font_size = data.display_style.font_size
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
    data.legend_position = [0,10]
  }
  if (data.legend_width === undefined) {
    data.legend_width = 180
  }

  const attributes_to_remove = ['previous_filter', 'filtered_links', 'filtered_nodes_names', 'filtered_nodes', 'nodes_names', 'max_vertical_offset', 'error', 'nodes2units_conv', 'nodes2tooltips']
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data) {
      delete ((data as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
    }
  }

  const has_product = Object.values(nodes).filter(n => ((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
  if (has_product) {
    if (!('Type de noeud' in data.nodeTags)) {
      data.nodeTags['Type de noeud'] = {
        group_name : 'Type de noeud',
        tags : {
          'produit' : {
            name : 'produit',
            selected : true,
            color: '',
            shape: 'ellipse'
          },
          'secteur' : {
            name : 'secteur',
            selected : true,
            color: '',
            shape: 'rect'
          },
          'échange' : {
            name : 'échange',
            selected : true,
            color: '',
            shape: 'rect'
          }
        },
        color_map : '',
        show_legend : false,
        banner: 'none'
      }
    }
  }
  if ( data.nodeTags['Type de noeud'] ) {
    data.nodeTags['Type de noeud'].banner = 'none' 
    if (!data.nodeTags['Type de noeud'].tags.produit.shape) {
      data.nodeTags['Type de noeud'].tags.produit.shape = 'ellipse'
    }
    if (!data.nodeTags['Type de noeud'].tags.secteur.shape) {
      data.nodeTags['Type de noeud'].tags.secteur.shape = 'rect'
    }
    if ('échange' in data.nodeTags['Type de noeud'].tags && !data.nodeTags['Type de noeud'].tags['échange'].shape) {
      data.nodeTags['Type de noeud'].tags['échange'].shape = 'rect'
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
      if (n.display_style === undefined ) {
        n.display_style = {
          font_family:'Cormorant',
          font_size: data.display_style.node_font_size,
          uppercase: false,
          bold: false,
          italic: false,
          unit: false,
          filter: 0,
          filter_label: 0,
          global_curvature: 0.5,
          null_flux: false,
          label_vert:'bas',
          label_horiz:'milieu',
          label_vert_valeur: 'bas',
          label_horiz_valeur: 'milieu',
          value_font_size:14,
          label_box_width:110,
        }
      }
      if (n.display_style.label_vert === 'bas' && n.display_style.label_horiz === 'droite') {
        n.display_style.label_horiz = 'milieu'
      }
      if (n.display_style.font_family === undefined) {
        n.display_style.font_family = 'Cormorant'
      }
      if (n.node_width === undefined) {
        if ( data.node_width) {
          n.node_width = data.node_width
        } else {
          n.node_width = 10
        }
      }
      if (n.node_height === undefined) {
        if ( data.node_height) {
          n.node_height = data.node_height
        } else {
          n.node_height = 10
        }
      }
      if (n_convert.definition) {
        n.tooltip_text = n_convert.definition
        delete n_convert.definition
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
      // if (n_convert.visible === undefined && !n.node_visible && data.version !== '0.5' ) {
      //   n.shape_visible = true
      // }
      if (n_convert.visible === 1) {
        n.shape_visible = true
      }
      if (n_convert.visible === 0) {
        n.shape_visible = false
      }
      if (n_convert.node_visible === 0) {
        n.node_visible = false
      }
      if (n_convert.node_visible === 1) {
        n.node_visible = true
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
      if (n.colorParameter === undefined) {
        n.colorParameter = 'local'
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

      if (n.iconName === undefined) {
        n.iconName = 'none'
      }
      if (n.iconColor === undefined) {
        n.iconColor = '#fff'
      }
      if (n.iconRatio === undefined) {
        n.iconRatio = 80
      }
      if (n.iconVisible === undefined) {
        n.iconVisible = true
      }
      if (n_convert.type) {
        n.shape = n_convert.type === 'product' ? 'ellipse' : 'rect'
        if ( has_product && !n.tags['Type de noeud']) {
          n.tags['Type de noeud'] = []
        } 
        if (has_product && n.tags['Type de noeud'].length === 0 ) {
          n.tags['Type de noeud'].push(n_convert.type === 'product' ? 'produit' : 'secteur' )
        }
        delete n_convert.type
      }
      if (!n.shape) {
        n.shape = 'rect'
      }
      delete n_convert.visible

      n.name = n.name.split('\\n').join(' ')

      const attributes_to_remove = ['tooltips','total_input_offset','input_offsets','total_output_offset','output_offsets','horizontal_index','title_length','old_color']
      for (const attr in attributes_to_remove) {
        if (attributes_to_remove[attr] in n_convert) {
          delete ((n_convert as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
        }
      }
      if ( 'Type de noeud' in n.tags && n.tags['Type de noeud'][0] == 'échange' ) {
        import_export = true
      }
      if (n.name.includes('(I') && n.outputLinksId.length > 0 && data.nodeTags['Exchanges']) {
        import_export = true
        n.node_visible = true        
        if (data.display_style.trade_close !== undefined) {
          n_convert.trade_close = data.display_style.trade_close
        }
      } else if (n.name.includes('(E') && !n.name.includes('(EA)') && data.nodeTags['Exchanges']) {
        import_export = true
        n.node_visible = true       
        if (data.display_style.trade_close !== undefined) {
          n_convert.trade_close = data.display_style.trade_close
        }
      }
      if (n.tags && n.tags['Exchanges'] && n.tags['Exchanges'].length > 0 &&(n.tags['Exchanges'][0].includes('mport') || n.tags['Exchanges'][0].includes('xport')) && n_convert.trade_close && !n.position) {
        import_export = true
        n.position = 'relative'
        n.x = n.tags['Exchanges'][0].includes('import') ? -(data.trade_close_hspace as number) : data.trade_close_hspace as number
        n.y = n.tags['Exchanges'][0].includes('import') ? -(data.trade_close_vspace as number) : data.trade_close_vspace as number      
      }
      if (n.tags['Exchanges'] && n.tags['Exchanges'][0] !== 'interior' ) {
        import_export = true
        n.tags['Type de noeud'] = ['échange']
        if (!n.dimensions) {
          n.dimensions = {}
        }
        if (n.tags['Exchanges'][0].includes((data.trade_sectors as string[])[0].split(' - ')[0])) {
          n.dimensions = { 'Echanges': { level : 1, parent_name: undefined } }
          n.dimensions = { 'Primaire' : { level : 1, parent_name: undefined } } 
          if (!('Dimensions' in n.tags)) {
            n.tags.Dimensions = []
          }
          if (!('Echanges' in n.tags.Dimensions)) {
            n.tags.Dimensions.push('Echanges')
          }
          if (!('Primaire' in n.tags.Dimensions)) {
            n.tags.Dimensions.push('Primaire')
          }          
        } else {
          const names = n.name.split(' - ')
          names[1] = (data.trade_sectors as string[])[0].split(' - ')[0]
          const parent_name = names.join(' - ')
          const parent_node = Object.values(nodes).filter( n => n.name === parent_name)[0]
          n.dimensions = { 'Echanges': { level : 2, parent_name: parent_node.idNode } }
          if ( 'Primaire' in n.dimensions) {
            delete n.dimensions.Primaire
          }
          if (!('Dimensions' in n.tags)) {
            n.tags.Dimensions = []
          }
          if (!('Echanges' in n.tags.Dimensions)) {
            n.tags.Dimensions.push('Echanges')
          }
          if ( 'Primaire' in n.tags.Dimensions) {
            n.tags.Dimensions = n.tags.Dimensions.filter(dim=>dim!=='Primaire')
          }
        }  
      }
      delete n.tags['Exchanges']
      if (!n.position) {
        n.position = 'absolute'        
      }
      if (!n.dimensions) {
        n.dimensions = { 'Primaire': { level : 1, parent_name: undefined } }      
      }
      // if (!n.dimensions.Primaire) {
      //   n.dimensions.Primaire = { level : 1, parent_name: undefined }  
      // }
      // if (!n.dimensions.Primaire.level) {
      //   n.dimensions.Primaire.level = 1  
      // }
      if (n.style === undefined) {
        n.style = 'default'
      }  
    }
  )

  if (import_export) {
    Object.values(data_to_convert.nodes).forEach(n=>{
      if (!('Dimensions' in n.tags)) {
        n.tags.Dimensions = ['Primaire']
      }
      if (!('Echanges' in n.tags.Dimensions)) {
        n.tags.Dimensions.push('Echanges')
      }      
    })
  }

  if (data_to_convert.nodeTags['Exchanges']) {
    //data_to_convert.nodeTags['Exchanges'].group_name = 'Echanges'
    delete data_to_convert.nodeTags['Exchanges']
    if (!('Echanges' in data.nodeTags.Dimensions.tags)) {
      data.nodeTags.Dimensions.tags['Echanges'] = {
        name : 'Echanges',
        selected: false
      }
    }
  }

  if ('trade_close' in data.display_style) {
    delete data.display_style.trade_close
  }

  if (data.subchains && data.subchains[0] !== '') {
    const cpySbchaine = data.subchains
    if (Object.entries(data.nodeTags).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      const tags_dict = Object.assign({}, ...cpySbchaine.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
      data.nodeTags['SubChain'] = {
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
    if (Object.entries(data.nodeTags).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      data.nodeTags['SubChain'] = {
        group_name: 'Sous-Filières',
        show_legend: false,
        color_map: 'jet',
        tags: tags_dict,
        banner: 'multi'
      }
    }
  }

  if ((data.flux_types || data.use_flux_types) && data.version !== '0.7' && data.version !== '0.8') {
    if (!data.fluxTags['flux_types']) {
      data.fluxTags['flux_types'] = {
        group_name: 'Type de donnée',
        show_legend: false,
        color_map: 'custom',
        tags: {
          'initial_data' : { name: 'Données collectées', selected: true, color:'#696969' },
          'computed_data': { name: 'Données calculées' , selected: true, color:'#D3D3D3' },
        },
        banner: 'multi'
      }
      delete data.flux_types
      delete data.use_flux_types
    }
  }
  if (data.fluxTags['flux_types']) {
    if (data.fluxTags['flux_types'].tags.initial_data.color === '') {
      data.fluxTags['flux_types'].tags.initial_data.color = '#696969' //DimGray
    }
    if (data.fluxTags['flux_types'].tags.computed_data.color === '') {
      data.fluxTags['flux_types'].tags.computed_data.color = '#D3D3D3' //LightGray
    }
  }

  let flux_max = 0
  Object.values(links).forEach(
    l => {
      const l_convert = (l as unknown) as ConvertSankeyLink
      if (l.colorParameter === undefined) {
        l.colorParameter = 'groupTag'
        l.colorTag = 'no_colormap'
      }
      if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
        if ( Array.isArray(l_convert.value) ) {
          (l_convert.value as number[]).forEach(v => {
            v = +v
            if (flux_max < v) {
              flux_max = v
            }
          })
        } else {
          if (flux_max < l_convert.value) {
            flux_max = l_convert.value
          }          
        }
        if ('tags' in l) {
          delete (((l as unknown) as { tags : { Exchanges? : string } } ).tags)['Exchanges']
        }
      }
      const source_node = nodes[l.idSource]
      const target_node = nodes[l.idTarget]
      if (!source_node || !target_node) {
        return
      }
      if (l.label_visible === undefined) {
        l.label_visible = true
      }
      
      if (l.orthogonal_label_position === undefined) {
        l.orthogonal_label_position = 'default'
      }
      if (l.dashed === undefined) {
        l.dashed = false
      }
      if (l.label_position === undefined) {
        l.label_position = 'middle'
      }
      if (l.gradient === undefined) {
        l.gradient = false
      }
      l.label_visible = Boolean(l.label_visible)
      if (l.style === undefined) {
        l.style = 'default'
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

      if (!('arrow' in l)) {
        (l as SankeyLink).arrow = true
      }
      if (!('curved' in l)) {
        (l as SankeyLink).curved = true
      }
      if (!('label_on_path' in l)) {
        (l as SankeyLink).label_on_path = true
      }

      if ('frozen' in l) {
        delete l_convert.frozen
      }
      if ('link_reverse' in l) {
        delete l_convert.link_reverse
      }

      if ('display_unit' in l_convert) {
        l_convert.natural_unit = l_convert.display_unit
        delete l_convert.display_unit
      }
      if (('agregated_data_value' in l_convert)) {
        l_convert.data_value = l_convert.agregated_data_value
        delete l_convert.agregated_data_value
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
  if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
    const links_no_type = data.links as unknown as {[key:string]:ConvertSankeyLink & SankeyLink}
    Object.values(links_no_type).forEach(
      (link) => {
        links_no_type[link.idLink].value2     = {}
      }
    )

    let region_names : string[] = []
    let period_names : string[] = []
    if (data_to_convert.dataTags['Regions']) {
      region_names = Object.keys(data_to_convert.dataTags['Regions'].tags)
      region_names.forEach(region_name => 
        Object.values(links_no_type).forEach((link)=> links_no_type[link.idLink].value2[region_name] = {} )
      )
    } else if (data_to_convert.dataTags['Periods']) {
      period_names = Object.keys(data_to_convert.dataTags['Periods'].tags)
      period_names.forEach(period_name => 
        Object.values(links_no_type).forEach((link) => links_no_type[link.idLink].value2[period_name] = {} )
      )           
    }

    if ( region_names.length > 0 || period_names.length > 0) {
      const reg_or_period_names = region_names.length > 0 ? region_names : period_names
      reg_or_period_names.forEach((region_name,value_index) => {
        Object.values(links_no_type).forEach(
          (link)=> {
            const editable_link = links_no_type[link.idLink]
            editable_link.value2[region_name] = {
              value          : (link.value as number[])[value_index],
              display_value  : (link.display_value as string[])[value_index],
              tags            : {},
              extension : {}
            }
            const sankey_link_value = editable_link.value2[region_name] as SankeyLinkValue
            if (editable_link.mini !== undefined && editable_link.mini !== null) {
              if (!sankey_link_value.extension) {
                sankey_link_value.extension = {}
              }
              if (sankey_link_value.extension) {
                sankey_link_value.extension.mini = (editable_link.mini as number[])[value_index] as unknown as string
                sankey_link_value.extension.maxi = (editable_link.maxi as number[])[value_index]as unknown as string
              }
              //sankey_link_value['tags']['Uncert'] = ''
              const p = ((editable_link.maxi as number[])[value_index] - (editable_link.mini as number[])[value_index])/(editable_link.value as number[])[value_index]
              if (p <= 0.1) {
                sankey_link_value['tags']['Uncert'] ='10_percent'
              } else if (p <= 0.25) {
                sankey_link_value['tags']['Uncert'] ='25_percent'
              } else if (p <= 0.5) {
                sankey_link_value['tags']['Uncert'] ='50_percent'
              } else {
                sankey_link_value['tags']['Uncert'] ='50+_percent'
              }
            }
            if (data_to_convert.dataTags['flux_types']) {
              sankey_link_value['tags']['flux_types'] = 'computed_data'
            }
            if (editable_link.data_value !== undefined && editable_link.data_value !== null && sankey_link_value.extension) {
              sankey_link_value.extension.data_value  = (editable_link.data_value as number[])[value_index] as unknown as string
              if ( 'data_source' in editable_link) {
                sankey_link_value.extension.data_source = (editable_link.data_source as string[])[value_index]
              }
              if ( 'data_period' in editable_link) {
                sankey_link_value.extension.data_period = (editable_link.data_period as string[])[value_index]
              }
              sankey_link_value['tags']['flux_types'] = 'initial_data'
            }
          }
        )               
      })
    } else {
      Object.values(links_no_type).forEach(
        (link) => {
          const editable_link = links_no_type[link.idLink]
          let the_value : number | number[] = link.value
          let the_display_value = link.display_value as string
          if ( the_display_value == undefined ) {
            the_display_value = ''
          }
          if ( Array.isArray(link.value) ) {
            the_value = (link.value as number[])[0]
            the_display_value = (link.display_value as string[])[0] as string
          }
          editable_link.value2 = {
            value : the_value,
            display_value : the_display_value as string,
            tags            : {},
            extension : {}
          }
          const sankey_link_value = editable_link.value2 as unknown as (ConvertSankeyValue & SankeyLinkValue)
          if (the_display_value.includes('[')) {
            // Variables libres
            let tmp 
            if (the_display_value.includes('-')) {
              tmp = the_display_value.split('-')
            } else if (the_display_value.includes(',')) {
              tmp = the_display_value.split(',')                
            } else if (the_display_value.includes('...')) {
              tmp = the_display_value.split('...')           
            } else if (the_display_value.includes('  ')) {
              tmp = the_display_value.split('  ')    
            } else {
              tmp = the_display_value.split(' ')          
            }
            const free_mini = Number(tmp[0].substring(1))
            const free_maxi = Number(tmp[1].substring(0,tmp[1].length -1))
            sankey_link_value.extension.free_mini = free_mini
            sankey_link_value.extension.free_maxi = free_maxi 
            editable_link.value2.display_value = ''           
          }
          if (editable_link.mini !== undefined && editable_link.mini !== null) {
            let the_mini = editable_link.mini as number
            let the_maxi = editable_link.maxi as number
            if ( Array.isArray(editable_link.mini) ) {
              the_mini = editable_link.mini[0]
              the_maxi = (editable_link.maxi as number[])[0]
            }
            if (sankey_link_value.extension ) {
              sankey_link_value.extension.mini = the_mini
              sankey_link_value.extension.maxi = the_maxi
            }
            //editable_link.value2['tags']['Uncert'] = {}
            const p = (the_maxi - the_mini)/(the_value as number)
            if (p <= 0.1) {
              sankey_link_value['tags']['Uncert'] ='10_percent'
            } else if (p <= 0.25) {
              sankey_link_value['tags']['Uncert'] ='25_percent'
            } else if (p <= 0.5) {
              sankey_link_value['tags']['Uncert'] ='50_percent'
            } else {
              sankey_link_value['tags']['Uncert'] ='50+_percent'
            }
          }
          if (data_to_convert.dataTags['flux_types']) {
            sankey_link_value['tags']['flux_types'] = 'computed_data'
          }
          if (editable_link.data_value !== undefined && editable_link.data_value !== null && sankey_link_value.extension) {
            sankey_link_value.extension.data_value  = (editable_link.data_value as number[])[0] as unknown as string
            sankey_link_value['tags']['flux_types'] = 'initial_data'
          }
          if ( 'data_source' in editable_link && sankey_link_value.extension) {
            sankey_link_value.extension.data_source = (editable_link.data_source as string[])[0]
          }
          if ( 'data_period' in editable_link && sankey_link_value.extension) {
            sankey_link_value.extension.data_period = (editable_link.data_period as string[])[0]
          }
        }
      )          
    }
    Object.values(data.links).forEach(
      link => {    
        (data.links[link.idLink]).value = (data.links[link.idLink] as unknown as ConvertSankeyLink).value2 as unknown as SankeyLinkValueDict
        if ((data.links[link.idLink] as unknown as ConvertSankeyLink).value2 ) {
          delete (data.links[link.idLink] as unknown as {value2?:SankeyLinkValueDict}).value2
        }
      }
    )
  }

  const convert_display =(
    dataTags: TagsGroup[],
    v: SankeyLinkValue,
    depth:number,
    flux_max:number  
  ) => {
    if (dataTags.length == 0 || depth === dataTags.length ) {
      if (v.display_value === undefined) {
        v.display_value = ''
      } else if (v.display_value === 'default') {
        v.display_value = ''
      } else if (v.display_value.includes('[')) {
        // Variables libres
        let tmp 
        if (v.display_value.includes('-')) {
          tmp = v.display_value.split('-')
        } else if (v.display_value.includes(',')) {
          tmp = v.display_value.split(',')                
        } else if (v.display_value.includes('...')) {
          tmp = v.display_value.split('...')           
        } else if (v.display_value.includes('  ')) {
          tmp = v.display_value.split('  ')          
        } else {
          tmp = v.display_value.split(' ')          
        }
        const free_mini = Number(tmp[0].substring(1))
        const free_maxi = Number(tmp[1].substring(0,tmp[1].length -1))
        if (!v.extension) {
          v.extension = {}
        }
        if (v.extension) {
          v.extension.free_mini = free_mini as unknown as string
          v.extension.free_maxi = free_maxi as unknown as string
        }
        v.display_value = ''   
      }
      const col_tag = (v as unknown as ConvertSankeyValue).color_tag
      if ( col_tag) {
        v.tags = {...col_tag}
        if ( Array.isArray(v.tags['Uncert']) ) {
          v.tags['Uncert'] = v.tags['Uncert'][0]
        }
        delete (v as unknown as ConvertSankeyValue).color_tag
      }
      if (v.tags === undefined ) {
        v.tags = {}
      }
      if ( !v.extension) {
        v.extension = {}
      }
      if (data_to_convert.fluxTags['flux_types'] && !('flux_types' in v['tags'])) {
        if ( v.extension.data_value ) {
          v['tags']['flux_types'] = 'initial_data'
        } else {
          v['tags']['flux_types'] = 'computed_data'
        }
      }
      if (v.value > flux_max) {
        flux_max = v.value
      }
      return flux_max
    }
    const dataTag = Object.values(dataTags)[depth]
    const listKey = Object.keys(dataTag.tags)

    for (const i in listKey) {
      if ((v as { [key: string]: SankeyLinkValueDict })[listKey[i]]) {
        if ( v === undefined) {
          console.log(listKey[i] + ' not found in v')
          break
        }
        flux_max = convert_display(dataTags,(v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]],depth+1,flux_max)
      }
    }
    return flux_max
  }

  const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
  flux_max=0
  Object.values(data.links).forEach(
    l=> {
      flux_max = convert_display(dataTagsArray,l.value as SankeyLinkValue,0,flux_max)
    }
  )

  if ('sankey_type' in data) {
    delete (data as ConvertSankeyData).sankey_type
  }

  if ( data.agregation.level === -1 ) {
    data.agregation.level = 1
  }

  if (display_style.filter_label === undefined) {
    display_style.filter_label = flux_max / 10
  }

  if (data.version === '0.1') {
    units_names.splice(1, 0, 'natural')
  }

  if (!data.colorMap) {
    data.colorMap === 'no_colormap'
  }
  if (data.colorMap === 'no_colormap' ) {
    Object.values(data.links).forEach(el => {
      el.colorParameter = 'local'
      el.colorTag = 'no_colormap'
    })
  }

  data.version = '0.8'
}
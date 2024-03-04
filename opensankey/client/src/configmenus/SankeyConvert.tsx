/* eslint @typescript-eslint/no-var-requires: "off" */
import { SankeyData, SankeyLink, SankeyLinkStyle, SankeyLinkValue, SankeyLinkValueDict, SankeyNode,TagsCatalog,TagsGroup,SankeyNodeStyle,SankeyLinkAttrLocal, SankeyNodeAttrLocal} from '../types/Types'
import colormap from 'colormap'
import { DefaultNode,AssignLinkLocalAttribute, ReturnValueLink, DefaultLinkStyle,DefaultNodeStyle,DefaultNodeProductStyle,DefaultNodeSectorStyle} from './SankeyUtils'

import { ConvertDataFuncType, complete_sankey_dataFunctType, compute_flux_maxFType, compute_initial_colorsFType, convert_booleanFType, convert_linksFuncType, convert_nodesFuncType, convert_tagsFuncType } from './types/SankeyConvertTypes'
import {
  DefaultSankeyDataFuncType
} from './types/SankeyUtilsTypes'

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
  node_visible?:boolean,
  label_visible?: boolean,
  shape_visible?: number | boolean,
  trade_close: boolean,
  show_value: number | boolean,
  type?: string,
  node_width?:number,
  node_height?:number,
  shape?:string,
  color?:string,
  colorSustainable?:boolean,
  not_to_scale?:boolean,
  not_to_scale_direction?:string,
  display?:boolean,
  display_style?:{
    label_vert:string,
    label_horiz:string,
    font_family:string,
    font_size:number,
    uppercase:boolean,
    bold:boolean,
    italic:boolean,
    label_vert_valeur:string,
    label_horiz_valeur:string,
    value_font_size:number,
    label_box_width:number,
    label_color:boolean,

  }
}
type layout_type = {
  layout: SankeyData
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
  value2: SankeyLinkValue | SankeyLinkValueDict
  display_value?: string | string[]
  data?: boolean
  subchain?: string
  mini?: number | number[]
  maxi?: number | number[]
  dashed:number | boolean
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
  show_structure: boolean | string
  show_data?: boolean
  view:{id: string,view_data: object,nom:string,details:string}[]
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

export const complete_sankey_data:complete_sankey_dataFunctType = (
  data: SankeyData,
  DefaultSankeyData: DefaultSankeyDataFuncType,
  DefaultNode: (data:SankeyData)=>SankeyNode,
  DefaultLink: (data:SankeyData)=>SankeyLink
): void => {
  const { nodes, links } = data
  const the_data = DefaultSankeyData()
  Object.assign(the_data,data)
  Object.assign(data,the_data)
  Object.values(nodes).forEach(
    n => {
      const nn = DefaultNode(data);
      (nn as unknown as {x:undefined}).x = undefined;
      (nn as unknown as {y:undefined}).y = undefined
      Object.assign(nn, n)
      Object.assign(n, nn)
    }
  )

  Object.values(links).forEach(
    l => {
      const ll = DefaultLink(data)
      Object.assign(ll, l)
      Object.assign(l, ll)
    }
  )

  Object.values(data.nodeTags).forEach(
    tags_group => {
      if (tags_group.activated == undefined) {
        tags_group.activated = true
      }
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
      if(tags_group.color_map === undefined) { tags_group.color_map='jet'}
    }
  )

  Object.values(data.fluxTags).forEach(
    tags_group => {
      if (tags_group.activated == undefined) {
        tags_group.activated = true
      }
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
      if(tags_group.color_map === undefined) { tags_group.color_map='jet'}
    }
  )
  Object.values(data.dataTags).forEach(
    tags_group => {
      if (tags_group.activated == undefined) {
        tags_group.activated = true
      }
      if(tags_group.show_legend === undefined) { tags_group.show_legend=false}
      if(tags_group.color_map === undefined) { tags_group.color_map='jet'}
    }
  )
  if ( data.nodeTags['Type de noeud'] ) {
    data.nodeTags['Type de noeud'].banner = 'none'
    if (data.nodeTags['Type de noeud'].tags.produit && !data.nodeTags['Type de noeud'].tags.produit.shape) {
      data.nodeTags['Type de noeud'].tags.produit.shape = 'ellipse'
    }
    if (data.nodeTags['Type de noeud'].tags.secteur && !data.nodeTags['Type de noeud'].tags.secteur.shape) {
      data.nodeTags['Type de noeud'].tags.secteur.shape = 'rect'
    }
    if ('echange' in data.nodeTags['Type de noeud'].tags && !data.nodeTags['Type de noeud'].tags['echange'].shape) {
      data.nodeTags['Type de noeud'].tags['echange'].shape = 'rect'
    }
    if ('échange' in data.nodeTags['Type de noeud'].tags) {
      data.nodeTags['Type de noeud'].tags['echange'] = JSON.parse(JSON.stringify(data.nodeTags['Type de noeud'].tags['échange']))
      delete data.nodeTags['Type de noeud'].tags['échange']
    }
  }
  compute_initial_colors(data)
  convert_boolean(data)
  compute_flux_max(data)

  if ((data as unknown as ConvertSankeyData).show_structure == 'free') {
    data.show_structure = 'free_interval'
  }
}

export const compute_initial_colors : compute_initial_colorsFType = (
  data: SankeyData
) =>{
  Object.values(data.nodeTags).forEach(
    tags_group => {
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

  Object.values(data.fluxTags).forEach(
    tags_group => {
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

  Object.values(data.dataTags).forEach(
    tags_group => {
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
}

export const convert_boolean : convert_booleanFType = (
  data : SankeyData
) =>{
  
  Object.values(data.nodeTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      tags_group.activated = Boolean(tags_group.activated)
    }
  )
  Object.values(data.fluxTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      tags_group.activated = Boolean(tags_group.activated)
    }
  )
  Object.values(data.dataTags).forEach(
    tags_group => {
      Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
      tags_group.activated = Boolean(tags_group.activated)
    }
  )
}

export const compute_flux_max : compute_flux_maxFType = (
  data: SankeyData
) : void => {
  let flux_max = 0
  const compute_flux_max_internal =(
    dataTags: TagsGroup[],
    v: SankeyLinkValue | SankeyLinkValueDict,
    depth:number,
    flux_max:number
  ) => {
    if (dataTags.length == 0 || depth === dataTags.length ) {
      if (v.value && v.value as number > flux_max) {
        flux_max = v.value as number
      }
      return flux_max
    }
    const dataTag = Object.values(dataTags)[depth]
    const listKey = Object.keys(dataTag.tags)

    for (const i in listKey) {
      if ((v as SankeyLinkValueDict )[listKey[i]]) {
        if ( v === undefined) {
          //console.log(listKey[i] + ' not found in v')
          break
        }
        flux_max = compute_flux_max_internal(dataTags,(v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]],depth+1,flux_max)
      }
    }
    return flux_max
  }

  const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
  Object.values(data.links).forEach(
    l=> {
      flux_max = compute_flux_max_internal(dataTagsArray,l.value as SankeyLinkValue,0,flux_max)
    }
  )
  if (data.display_style.filter_label === undefined) {
    data.display_style.filter_label = flux_max / 10
  }
}

export const convert_tags:convert_tagsFuncType = (
  data: SankeyData
): void => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  if (data_to_convert.tags_catalog) {
    data.nodeTags = Object.assign(data_to_convert.tags_catalog)
  }
  delete data_to_convert.tags_catalog

  if (Array.isArray(data_to_convert.nodeTags)) {
    data.nodeTags = Object.assign({}, ...data_to_convert.nodeTags.map((tags_group) => (
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

  if (data.nodeTags['Regions']) {
    data.dataTags['Regions'] = JSON.parse(JSON.stringify(data.nodeTags['Regions']))
    delete data.nodeTags['Regions']
  }
  if (data.nodeTags['Periods']) {
    data.dataTags['Periods'] = JSON.parse(JSON.stringify(data.nodeTags['Periods']))
    delete data.nodeTags['Periods']
  }
  if (data.nodeTags['flux_types']) {
    data.fluxTags['flux_types'] = {
      group_name : 'Type de donnée',
      show_legend: false,
      color_map: 'custom',
      tags : {
        initial_data  : { name : 'Données collectées' , selected: true, color : 'cyan' },
        computed_data : { name : 'Données calculées'  , selected: true, color : 'blue' },
      },
      banner : 'multi',
      activated: true,
      siblings: []
    }
    delete data.nodeTags['flux_types']
  }
  if (data.nodeTags['Uncert']) {
    data.fluxTags['Uncert'] = JSON.parse(JSON.stringify(data.nodeTags['Uncert']))
    data.fluxTags['Uncert'].banner = 'multi'
    delete data.nodeTags['Uncert']
  }
  if (data.nodeTags['SubChain']) {
    data.nodeTags['SubChain'].group_name = 'Sous-Filières'
  }

  Object.entries(data.dataTags).forEach(
    ([key,tags_group]) => {
      if (tags_group.banner === 'display'|| key === 'flux_types' || key ==='Uncert' ) {
        data.fluxTags[key] = {...tags_group}
        data.fluxTags[key].banner = 'none'
      }
    }
  )
  const new_dataTags = Object.entries(data.dataTags).filter(([key,tag_group])=>tag_group.banner !== 'display' && key !== 'flux_types' && key !=='Uncert')
  data.dataTags = Object.assign({}, ...new_dataTags.map(([key,v]) => ({ [key]: { ...v } })))

  const has_product = Object.values(data.nodes).filter(n => ((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
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
          'echange' : {
            name : 'échange',
            selected : true,
            color: '',
            shape: 'rect'
          }
        },
        color_map : '',
        show_legend : false,
        banner: 'none',
        activated: true,
        siblings: []
      }
    }
  }
  if ( data.nodeTags['Type de noeud'] ) {
    data.nodeTags['Type de noeud'].banner = 'none'
    if (data.nodeTags['Type de noeud'].tags.produit && !data.nodeTags['Type de noeud'].tags.produit.shape) {
      data.nodeTags['Type de noeud'].tags.produit.shape = 'ellipse'
    }
    if (data.nodeTags['Type de noeud'].tags.secteur && !data.nodeTags['Type de noeud'].tags.secteur.shape) {
      data.nodeTags['Type de noeud'].tags.secteur.shape = 'rect'
    }
    if ('echange' in data.nodeTags['Type de noeud'].tags && !data.nodeTags['Type de noeud'].tags['echange'].shape) {
      data.nodeTags['Type de noeud'].tags['echange'].shape = 'rect'
    }
    if ('échange' in data.nodeTags['Type de noeud'].tags) {
      data.nodeTags['Type de noeud'].tags['echange'] = JSON.parse(JSON.stringify(data.nodeTags['Type de noeud'].tags['échange']))
      delete data.nodeTags['Type de noeud'].tags['échange']
    }

    // Delete residue of old key for sector & product style to avoid redondance in list of node style 
    if(Object.keys(data.style_node).includes('style_node_prod')){
      delete data.style_node['style_node_prod']
    }
    if(Object.keys(data.style_node).includes('style_node_sect')){
      delete data.style_node['style_node_sect']
    }

    // If data has NodeTags 'Type de noeud' but not the style associated to it
    // then add it
    if(!Object.keys(data.style_node).includes('NodeProductStyle')){
      data.style_node['NodeProductStyle']=DefaultNodeProductStyle()
    }
    if(!Object.keys(data.style_node).includes('NodeSectorStyle')){
      data.style_node['NodeSectorStyle']=DefaultNodeSectorStyle()
    }
  }

  if (data.nodeTags.Dimensions) {
    Object.keys(data.nodeTags.Dimensions.tags).forEach(tag=>{
      data.nodeTags[tag] = {
        group_name : data.nodeTags.Dimensions.tags[tag].name,
        color_map: 'jet',
        show_legend: false,
        banner: 'level',
        tags: {},
        activated: true,
        siblings: []
      }
      Object.values(data.nodes).forEach(n=>{
        if (n.dimensions[tag]) {
          n.tags[tag] = [String((n.dimensions[tag].level??0))]
        }
        if ('Dimensions' in n.tags) {
          delete n.tags.Dimensions
        }
      })

      let max_level = 1
      Object.values(data.nodes).forEach(n=>{
        if (n.dimensions[tag] && (n.dimensions[tag].level??0) > max_level) {
          max_level = n.dimensions[tag].level??0
        }
      })
      Object.values(data.nodes).forEach(n=>{
        if (n.dimensions[tag]) {
          const dim_desagregate_nodes = Object.values(data.nodes).filter( n2=> n2.dimensions[tag] && n2.dimensions[tag].parent_name === n.idNode )
          if (dim_desagregate_nodes.length == 0) {
            for (let level = 2; level<=max_level;level++) {
              n.tags[tag].push(String(level))
            }
          }
        }
      })
      for (let level = 1; level<=max_level;level++) {
        data.nodeTags[tag]['tags'][String(level)] = {
          name : String(level),
          selected : level == 1
        }
      }
    })
    delete data.nodeTags.Dimensions
  }
  if (data_to_convert.nodeTags['Exchanges']) {
    delete data_to_convert.nodeTags['Exchanges']
  }
  const subchains: string[] = []
  Object.values(data.links).forEach(
    l => {
      const l_convert = (l as unknown) as ConvertSankeyLink
      const source_node = data.nodes[l.idSource]
      const target_node = data.nodes[l.idTarget]
      if (!source_node || !target_node) {
        return
      }
      if (l_convert.subchain && l_convert.subchain !== '' ) {
        l_convert.subchain.split(',').forEach(s => {
          if (!subchains.includes(s)) {
            subchains.push(s)
          }
        })
        delete l_convert.subchain
      }
    }
  )
  Object.values(data.nodes).forEach(
    n => {
      const n_convert = (n as unknown) as ConvertSankeyNode
      if (n_convert.subchain && n_convert.subchain !== '') {
        n.tags['SubChain'] = n_convert.subchain.split(',')
        n_convert.subchain.split(',').forEach(s => {
          if (!subchains.includes(s)) {
            subchains.push(s)
          }
        })
        delete n_convert.subchain
      }
      if ( 'Type de noeud' in n.tags && n.tags['Type de noeud'].includes('échange')) {
        n.tags['Type de noeud'].push('echange')
        n.tags['Type de noeud'].splice(n.tags['Type de noeud'].indexOf('échange'),1)
      }
      if ( 'Type de noeud' in n.tags && n.tags['Type de noeud'].includes('echange')) {
        if (n.inputLinksId.length === 0) {
          const link =  data.links[n.outputLinksId[0]]
          if (!link) {
            return
          }
          //link.idSource = new_node.idNode
          const target_node = data.nodes[link.idTarget]
          Object.keys(target_node.dimensions).forEach(dim_key => {
            n.dimensions[dim_key] = JSON.parse(JSON.stringify(target_node.dimensions[dim_key]))
          })
    
          Object.keys(target_node.tags).forEach(tag_key => {
            if ( tag_key === 'Type de noeud' ) {
              return
            }
            //const tags = [...target_node.tags[tag_key]]
            if (tag_key in n.tags) {
              n.tags[tag_key] = JSON.parse(JSON.stringify(target_node.tags[tag_key]))
            } 
          })   
        } else {
          const link = data.links[n.inputLinksId[0]]
          if (!link) {
            return
          }
          link.idTarget = n.idNode
          const source_node = data.nodes[link.idSource]
          Object.keys(source_node.dimensions).forEach(dim_key => {
            n.dimensions[dim_key] = JSON.parse(JSON.stringify(source_node.dimensions[dim_key]))
          })
    
          Object.keys(source_node.tags).forEach(tag_key => {
            if ( tag_key === 'Type de noeud' ) {
              return
            }
            if (tag_key in n.tags) {
              n.tags[tag_key] = JSON.parse(JSON.stringify(source_node.tags[tag_key]))
            }
          })
        }
      }
    }
  )

  if (data_to_convert.subchains && data_to_convert.subchains[0] !== '') {
    const cpySbchaine = data_to_convert.subchains
    if (Object.entries(data.nodeTags).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      const tags_dict = Object.assign({}, ...cpySbchaine.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
      data.nodeTags['SubChain'] = {
        group_name: 'Sous-Filières',
        color_map: 'jet',
        show_legend: false,
        tags: tags_dict,
        banner: 'multi',
        activated: true,
        siblings: []
      }
      delete data_to_convert.subchains
    }
  } else if (subchains.length > 0) {
    const tags_dict = Object.assign({}, ...subchains.map((subchain) => ({ [subchain]: { name: subchain, color: 'red', selected: true } })))
    if (Object.entries(data.nodeTags).filter(tags_group => tags_group[0] === 'SubChain').length === 0) {
      data.nodeTags['SubChain'] = {
        group_name: 'Sous-Filières',
        show_legend: false,
        color_map: 'jet',
        tags: tags_dict,
        banner: 'multi',
        activated: true,
        siblings: []
      }
    }
  }

  if ((data_to_convert.flux_types || data_to_convert.use_flux_types) && data.version !== '0.7' && data.version !== '0.8') {
    if (!data.fluxTags['flux_types']) {
      data.fluxTags['flux_types'] = {
        group_name: 'Type de donnée',
        show_legend: false,
        color_map: 'custom',
        tags: {
          'initial_data' : { name: 'Données collectées', selected: true, color:'#696969' },
          'computed_data': { name: 'Données calculées' , selected: true, color:'#D3D3D3' },
        },
        banner: 'multi',
        activated: true,
        siblings: []
      }
      delete data_to_convert.flux_types
      delete data_to_convert.use_flux_types
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
  if (!data.levelTags) {
    data.levelTags = {}
  }
  if (!('Primaire' in data.levelTags) && !('Primaire' in data.levelTags)) {
    data.levelTags['Primaire'] = {
      group_name: 'Primaire',
      show_legend: false,
      color_map: 'custom',
      tags: {
        '1' : { name: '1', selected: true, color:'#696969' }
      },
      banner: 'level',
      activated: true,
      siblings:[]
    }
  }
  // Convertie les anciens groupTag des données issu d'un excel qui ont pour valeur 1 ou 0 pour signifier un boolean
  Object.values(data.nodeTags).forEach(t=>{
    t.show_legend=typeof(t.show_legend)=='boolean'?t.show_legend:((t.show_legend===1))
    t.siblings=t.siblings?t.siblings:[]
  })
  Object.values(data.fluxTags).forEach(t=>{
    t.show_legend=typeof(t.show_legend)=='boolean'?t.show_legend:((t.show_legend===1))
    t.siblings=t.siblings?t.siblings:[]
  })
  Object.values(data.dataTags).forEach(t=>{
    t.show_legend=typeof(t.show_legend)=='boolean'?t.show_legend:((t.show_legend===1))
    t.siblings=t.siblings?t.siblings:[]    
  })

  // Convertie les nodeTags avec pour bannière 'level' en levelTags 
  if(has_not_converted_nodeTags_as_levelTags(data)){
    data.levelTags = Object.assign({},data.levelTags,Object.fromEntries(Object.entries(data.nodeTags).filter(nt => nt[1].banner === 'level')))
    data.nodeTags=Object.fromEntries(Object.entries(data.nodeTags).filter(nt=>nt[1].banner!=='level'))
  }


}

export const convert_nodes:convert_nodesFuncType = (
  data: SankeyData
) => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  const default_n=DefaultNode(data)

  // If node has old 'id' attribute, convert it to new one 'idNode' 
  if (Object.keys(data.nodes).length > 0 && !Object.values(data.nodes)[0].idNode) {
    Object.values(data.nodes).forEach(n => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
  }
  
  const has_product = Object.values(data.nodes).filter(n =>((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
  const list_key_nodes=Object.values(data.nodes).map(n=>n.idNode)

  Object.values(data.nodes).forEach( n => {
    const n_depreciated = (n as unknown) as ConvertSankeyNode

    if (n_depreciated.input_links) {
      n.inputLinksId = []
      n.outputLinksId = [];
      (n_depreciated.input_links as number[]).forEach(link_idx => {
        n.inputLinksId.push(data.links['link' + link_idx].idLink)
      });
      (n_depreciated.output_links as number[]).forEach(link_idx => {
        n.outputLinksId.push(data.links['link' + link_idx].idLink)
      })
      delete n_depreciated.output_links
      delete n_depreciated.input_links
      delete n_depreciated.id
    }

    // ==================================================================
    // CONVERSION D'ATTRIBUT OBLIGATOIRE DES NOEUDS EN VARIABLES LOCAL
    if(n_depreciated.display_style!==undefined){
      n.local=(n.local!=undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      if (n_depreciated.display_style?.label_vert === 'haut' ) {
        n_depreciated.display_style.label_vert = 'top'
      }
      if (n_depreciated.display_style?.label_vert === 'milieu' ) {
        n_depreciated.display_style.label_vert = 'middle'
      }
      if (n_depreciated.display_style?.label_vert === 'bas' ) {
        n_depreciated.display_style.label_vert = 'bottom'
      }
      if (n_depreciated.display_style?.label_horiz === 'droite' ) {
        n_depreciated.display_style.label_horiz = 'right'
      }
      if (n_depreciated.display_style?.label_horiz === 'milieu' ) {
        n_depreciated.display_style.label_horiz = 'middle'
      }
      if (n_depreciated.display_style?.label_horiz === 'gauche' ) {
        n_depreciated.display_style.label_horiz = 'left'
      }
      if (n_depreciated.display_style && n_depreciated.display_style?.font_family === undefined) {
        n_depreciated.display_style.font_family = 'Arial,serif'
      }

      n.local.font_family = n_depreciated.display_style?.font_family
      n.local.label_vert = n_depreciated.display_style?.label_vert
      n.local.label_horiz = n_depreciated.display_style?.label_horiz
      n.local.font_size=Number(n_depreciated.display_style?.font_size)
      n.local.value_font_size=Number(n_depreciated.display_style?.value_font_size)
      n.local.bold=n_depreciated.display_style?.bold
      n.local.uppercase=n_depreciated.display_style?.uppercase
      n.local.italic=n_depreciated.display_style?.italic
      n.local.label_box_width=n_depreciated.display_style?.label_box_width
      n.local.label_color=n_depreciated.display_style?.label_color
      n.local.value_font_size=n_depreciated.display_style?.value_font_size
      n.local.label_horiz_valeur=n_depreciated.display_style?.label_horiz_valeur
      n.local.label_vert_valeur=n_depreciated.display_style?.label_vert_valeur
        

      delete n_depreciated.display_style
    }

    // Assign ancienement attribut de noeud obligatoires en tant que var local 
    if (n_depreciated.visible === 1) {
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.shape_visible = true
    }
    if (n_depreciated.visible === 0) {
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.shape_visible = false
    }
    if(n_depreciated.shape_visible || n_depreciated.display){
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.shape_visible=(n_depreciated.shape_visible as boolean)
      delete n_depreciated.shape_visible
      //delete n_depreciated.display
    }
    if(n_depreciated.shape && ((n.local && n.local.shape==undefined) || n.local===undefined)){
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.shape=n_depreciated.shape as 'ellipse' | 'rect' | 'arrow'
      delete n_depreciated.shape

    }
    if(n_depreciated.node_width && ((n.local && n.local.node_width==undefined) || n.local===undefined)){
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.node_width=(n_depreciated.node_width)
      delete n_depreciated.node_width

    }
    if(n_depreciated.node_height && ((n.local && n.local.node_height==undefined) || n.local===undefined)){
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.node_height=(n_depreciated.node_height)
      delete n_depreciated.node_height
    }

    if(n_depreciated.color && ((n.local && n.local.color==undefined) || n.local===undefined)){
      n.local=(n.local!==undefined && n.local!==null)?n.local:{}
      n.local.color=(n_depreciated.color)
      delete n_depreciated.color
    }
    if(n_depreciated.colorSustainable && ((n.local && n.local.colorSustainable==undefined) || n.local===undefined)){
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.colorSustainable=(n_depreciated.colorSustainable)
      delete n_depreciated.colorSustainable
    }
    if (n_depreciated.type) {
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.shape = n_depreciated.type === 'product' ? 'ellipse' : 'rect'
      if ( has_product && !n.tags['Type de noeud']) {
        n.tags['Type de noeud'] = []
      }
      if (has_product && n.tags['Type de noeud'].length === 0 ) {
        n.tags['Type de noeud'].push(n_depreciated.type === 'product' ? 'produit' : 'secteur' )
      }
      delete n_depreciated.type
    }
    if (n_depreciated.label_visible && ((n.local && n.local.label_visible==undefined) || n.local===undefined)) {
      n.local=(n.local!==undefined && n.local!==null)?n.local:{} as SankeyNodeAttrLocal
      n.local.label_visible=(n_depreciated.label_visible as boolean)
    }
    if (n_depreciated.node_visible !== undefined && n_depreciated.display !== undefined) {
      // if (NodeDisplayed(data,n,false) !== (n_depreciated.node_visible&&n_depreciated.display) ) {
      //   n.local=(n.local!==undefined && n.local!==null)?n.local:{}
      //   n.local.local_aggregation = (n_depreciated.node_visible&&n_depreciated.display)
      // }
      delete n_depreciated.node_visible
      delete n_depreciated.display
    }

    // FIN CONVERSION EN ATTRIBUT LOCAL
    // ==================================================================

    
    if (n_depreciated.definition) {
      n.tooltip_text = n_depreciated.definition
      delete n_depreciated.definition
    }
    if (n.x === undefined) {
      n.x = 0
    }
    if (n.y === undefined) {
      n.y = 0
    }

    delete n_depreciated.visible

    n.name = n.name.split('\\n').join(' ')

    const attributes_to_remove = ['tooltips','total_input_offset','input_offsets','total_output_offset','output_offsets','horizontal_index','title_length','old_color']
    for (const attr in attributes_to_remove) {
      if (attributes_to_remove[attr] in n_depreciated) {
        delete ((n_depreciated as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
      }
    }

    if (n.name.includes('(I') && n.outputLinksId.length > 0 && data.nodeTags['Exchanges']) {
      if (data_to_convert.display_style.trade_close !== undefined) {
        n_depreciated.trade_close = data_to_convert.display_style.trade_close
      }
    } else if (n.name.includes('(E') && !n.name.includes('(EA)') && data.nodeTags['Exchanges']) {
      if (data_to_convert.display_style.trade_close !== undefined) {
        n_depreciated.trade_close = data_to_convert.display_style.trade_close
      }
    }
    if (n.tags && n.tags['Exchanges'] && n.tags['Exchanges'].length > 0 &&(n.tags['Exchanges'][0].includes('mport') || n.tags['Exchanges'][0].includes('xport')) && n_depreciated.trade_close && !n.position) {
      n.position = 'relative'
      n.x = n.tags['Exchanges'][0].includes('import') ? -(data_to_convert.trade_close_hspace as number) : data_to_convert.trade_close_hspace as number
      n.y = n.tags['Exchanges'][0].includes('import') ? -(data_to_convert.trade_close_vspace as number) : data_to_convert.trade_close_vspace as number
    }
    if ( !('Primaire' in n.dimensions) ) {
      n.dimensions['Primaire'] = { level : 1, parent_name: undefined }
    }
    if (n.tags['Exchanges'] && n.tags['Exchanges'][0] !== 'interior' ) {
      n.tags['Type de noeud'] = ['echange']
      if (!n.dimensions) {
        n.dimensions = {}
      }
      if (data_to_convert.trade_sectors) {
        if (n.tags['Exchanges'][0].includes((data_to_convert.trade_sectors as string[])[0].split(' - ')[0])) {
          n.dimensions = { 'Echanges': { level : 1, parent_name: undefined } }
          if (!('Echanges' in n.tags)) {
            n.tags.Echanges = []
          }
        } else {
          const names = n.name.split(' - ')
          names[1] = (data_to_convert.trade_sectors as string[])[0].split(' - ')[0]
          const parent_name = names.join(' - ')
          const parent_node = Object.values(data.nodes).filter( n => n.name === parent_name)[0]
          if (parent_node) {
            n.dimensions = { 'Echanges': { level : 2, parent_name: parent_node.idNode } }
          }
          if (!('Echanges' in n.tags)) {
            n.tags.Echanges = []
          }
        }
      }
    }
    delete n.tags['Exchanges']

    // Nodes with type Echanges did not have the correct dimensions
    if ( n.tags['Echanges'] ) {
      const new_dimensions = {
        'Primaire' : n.dimensions['Primaire'],
        'Echanges' : n.dimensions['Echanges']
      }
      n.dimensions = new_dimensions
    }

    
    // Filter out variable in the node that are null or undefined so they can be attribued the default value
    n=(Object.fromEntries(Object.entries(n).filter(kn=>kn[1]!==null && kn[1]!==undefined)) as SankeyNode)

    // Fill missing variable from incoming node with default value so the node has the required structure 
    n=Object.assign(JSON.parse(JSON.stringify(default_n)),n)

    // Search if nodes reference parent that doesn't exist
    if(n.dimensions){
      Object.entries(n.dimensions).filter(nd=>nd[1].parent_name && !list_key_nodes.includes(nd[1].parent_name)).forEach(nd=>{
        delete n.dimensions[nd[0]]
      })
    }
    // Change style if node has default style & 'Type de noeud' tags
    if(n.tags['Type de noeud'] && n.style==='default'){
      if(n.tags['Type de noeud'].includes('produit')){
        n.style='NodeProductStyle'
      }else if(n.tags['Type de noeud'].includes('secteur')){
        n.style='NodeSectorStyle'
      }
    }
    data.nodes[n.idNode]=n
  }
  )
}

export const convert_links:convert_linksFuncType = (
  data: SankeyData
) => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
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
            ((link as unknown as ConvertSankeyLink).value as number[]).push(data_to_convert.links[cur_key_name][i].value as number);
            ((link as unknown as ConvertSankeyLink).display_value as string[]).push(data_to_convert.links[cur_key_name][i].display_value as string)
            if (convert_link.mini !== undefined && convert_link.maxi !== undefined) {
              (convert_link.mini as number[]).push(data_to_convert.links[cur_key_name][i].mini as number);
              (convert_link.maxi as number[]).push(data_to_convert.links[cur_key_name][i].maxi as number)
            }
            if (convert_link.data_value !== undefined) {
              (convert_link.data_value as number[]).push(data_to_convert.links[cur_key_name][i].data_value as number)
            }
            if (convert_link.data_source !== undefined) {
              (convert_link.data_source as string[]).push(data_to_convert.links[cur_key_name][i].data_source as string)
            }
            if (convert_link.data_period !== undefined) {
              (convert_link.data_period as string[]).push(data_to_convert.links[cur_key_name][i].data_period as string)
            }
          }
        )
      }
    )
    new_links.forEach((l, i) => l.idLink = 'link' + i)
    data.links = Object.assign({}, ...new_links.map(l => ({ [l.idLink]: { ...l } })));
    ((data.nodes as unknown) as SankeyNode[]).forEach((n: SankeyNode, i: number) => n.idNode = 'node' + i)
    data.nodes = Object.assign({}, ...((data.nodes as unknown) as SankeyNode[]).map((n: SankeyNode) => ({ [n.idNode]: { ...n } })))
    if (key_names.length > 1 && !data_to_convert.periods && data_to_convert.region_names) {
      data.dataTags['Regions'] = {
        group_name: 'Regions',
        color_map: 'jet',
        show_legend: false,
        tags: Object.assign({}, ...data_to_convert.region_names.map((region_name) => ({ [region_name]: { name: region_name, color: '', selected: region_name === data_to_convert.region_name } }))),
        banner: 'one',
        activated: true,
        siblings: []
      }
    }
    if (key_names.length > 1 && data_to_convert.periods) {
      data.dataTags['Periods'] = {
        group_name: 'Periods',
        color_map: 'jet',
        show_legend: false,
        tags: Object.assign({}, ...key_names.map((key_name) => ({ [key_name]: { name: key_name, color: '', selected: key_names[0] } }))),
        banner: 'one',
        activated: true,
        siblings: []
      }
    }
    delete data_to_convert.periods
    delete data_to_convert.region_names
    delete data_to_convert.region_name
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
  const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
  const convert_display =(
    dataTags: TagsGroup[],
    v: SankeyLinkValue | SankeyLinkValueDict,
    depth:number
  ) => {
    if (dataTags.length == 0 || depth === dataTags.length ) {
      if (v.display_value === undefined) {
        v.display_value = ''
      } else if (v.display_value === 'default') {
        v.display_value = ''
      } else if ((v.display_value as string).includes('[')) {
        // Variables libres
        let tmp
        if ((v.display_value as string).includes('-')) {
          tmp = (v.display_value as string).split('-')
        } else if ((v.display_value as string).includes(',')) {
          tmp = (v.display_value as string).split(',')
        } else if ((v.display_value as string).includes('...')) {
          tmp = (v.display_value as string).split('...')
        } else if ((v.display_value as string).includes('  ')) {
          tmp = (v.display_value as string).split('  ')
        } else {
          tmp = (v.display_value as string).split(' ')
        }
        const free_mini = Number(tmp[0].substring(1))
        const free_maxi = Number(tmp[1].substring(0,tmp[1].length -1))
        if (!v.extension) {
          v.extension = {}
        }
        if (v.extension) {
          (v as SankeyLinkValue).extension.free_mini = free_mini as unknown as string
          (v as SankeyLinkValue).extension.free_maxi = free_maxi as unknown as string
        }
        v.display_value = ''
      }
      const col_tag = (v as unknown as ConvertSankeyValue).color_tag
      if ( col_tag) {
        Object.keys(col_tag).forEach(tags_group_key=>{
          if (!(tags_group_key in v.tags)) {
            (v as SankeyLinkValue).tags[tags_group_key] = []
          }
          (v as SankeyLinkValue).tags[tags_group_key].push(col_tag[tags_group_key])
        })
        delete (v as unknown as ConvertSankeyValue).color_tag
      }
      if (v.tags === undefined ) {
        v.tags = {}
      }
      Object.keys(v.tags).forEach(key=> {
        if ( !Array.isArray((v as SankeyLinkValue).tags[key]) ) {
          (v as SankeyLinkValue).tags[key] = [(v as SankeyLinkValue).tags[key] as unknown as string]
        }
      })
      if ( !v.extension) {
        v.extension = {}
      }
      if (data_to_convert.fluxTags['flux_types'] && !('flux_types' in v['tags'])) {
        if ( (v as SankeyLinkValue).extension.data_value ) {
          (v as SankeyLinkValue)['tags']['flux_types'] = ['initial_data']
        } else {
          (v as SankeyLinkValue)['tags']['flux_types'] = ['computed_data']
        }
      }
      return
    }
    const dataTag = Object.values(dataTags)[depth]
    const listKey = Object.keys(dataTag.tags)

    for (const i in listKey) {
      if ((v as SankeyLinkValueDict)[listKey[i]]) {
        if ( v === undefined) {
          //console.log(listKey[i] + ' not found in v')
          break
        }
        convert_display(dataTags,(v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]],depth+1)
      }
    }
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

    const l_convert = (l as unknown) as ConvertSankeyLink
    if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
      if ('tags' in l) {
        delete (((l as unknown) as { tags : { Exchanges? : string } } ).tags)['Exchanges']
      }
    }
    const source_node = data.nodes[l.idSource]
    const target_node = data.nodes[l.idTarget]
    if (!source_node || !target_node) {
      return
    }
    if (l && l.local && !('orientation' in l.local)) {
      AssignLinkLocalAttribute(l,'orientation','hh')
      if (((source_node as unknown) as ConvertSankeyNode).orientation === 'horizontal' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'vertical') {
        AssignLinkLocalAttribute(l,'orientation','vh')
      } else if (((source_node as unknown) as ConvertSankeyNode).orientation === 'vertical' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'horizontal') {
        AssignLinkLocalAttribute(l,'orientation','hv')
      }
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
      AssignLinkLocalAttribute(l,'curved',false)
      AssignLinkLocalAttribute(l,'arrow', true)
    } else if (l_convert.type === 'bezier_link_arrow') {
      AssignLinkLocalAttribute(l,'curved',true)
      AssignLinkLocalAttribute(l,'arrow', true)
    } else if (l_convert.type === 'bezier_link_classic') {
      AssignLinkLocalAttribute(l,'curved',true)
      AssignLinkLocalAttribute(l,'arrow', false)
    }
    const attributes_to_remove = ['source', 'target', 'id', 'classif', 'title_length', 'raw_value', 'old_display_value', 'old_color', 'y_sd_label', 'x_sd_label', 'type']
    for (const attr in attributes_to_remove) {
      if (attributes_to_remove[attr] in l) {
        delete ((l as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
      }
    }

    if (data.version === '0.1') {
      const unit_index = l_convert.natural_unit ? data_to_convert.units_names.indexOf(l_convert.natural_unit) : -1
      if (l_convert.conv && unit_index !== -1) {
        const natural_conv = l_convert.conv[unit_index]
        l_convert.conv.splice(1, 0, natural_conv)
      }
      AssignLinkLocalAttribute(l,'curved',true)
      AssignLinkLocalAttribute(l,'curvature',1)
      if (l_convert.text_same_color === true) {
        AssignLinkLocalAttribute(l,'text_color',ReturnValueLink(data,l,'color'))

      } else {
        AssignLinkLocalAttribute(l,'text_color','white')
      }
      delete l_convert.text_same_color
      if (target_node.x < source_node.x) {
        AssignLinkLocalAttribute(l,'recycling',true)

      }
    } else if (!('curvature' in l)) {
      AssignLinkLocalAttribute(l,'curvature',0.5)

    }
    if (data.version === '0.2') {
      if (target_node.x < source_node.x) {
        // l.recycling = true
        AssignLinkLocalAttribute(l,'recycling',true)

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
    if (l_convert.text_same_color === false) {
      AssignLinkLocalAttribute(l,'text_color','black')
    } else if (l_convert.text_same_color === true) {
      AssignLinkLocalAttribute(l,'text_color',ReturnValueLink(data,l,'color'))
    } else if (l_convert.text_same_color === 'same_color') {
      AssignLinkLocalAttribute(l,'text_color',ReturnValueLink(data,l,'color'))
    }
    delete l_convert.text_same_color

    convert_display(dataTagsArray,l.value as SankeyLinkValue,0)
    if(!ReturnValueLink(data,l,'opacity')){
      AssignLinkLocalAttribute(l,'opacity',0.85)

    }

    if(l_convert.dashed===0){
      AssignLinkLocalAttribute(l,'dashed',false)
    }else if(l_convert.dashed==1){
      AssignLinkLocalAttribute(l,'dashed',true)
    }

    const tmp : SankeyLinkAttrLocal = {
      // Geometry link
      orientation:'',
      left_horiz_shift: 0,
      right_horiz_shift: 0,
      vert_shift: 0,
      curvature: 0,
      curved: true,
      recycling: true,
      arrow_size:0,

      // Geometry link labels
      label_position:'',
      orthogonal_label_position:'',
      label_on_path:true,

      //Attributes link
      arrow:true,
      color:'',
      opacity:0,
      dashed: true,
      //Attributes link labels
      label_visible:true,
      label_font_size:0,
      text_color:'',
      to_precision:true,
      scientific_precision:0,
      font_family: '',
      label_unit_visible:true,
      label_unit:'',
      custom_digit:true,
      nb_digit:0
    }

    // Assign missing variable
    Object.keys(tmp).forEach((k) =>{
      const kl=k as keyof SankeyLinkAttrLocal
      if(Object.keys(l).includes(k)){
        l.local=l.local?l.local:{};
        (l.local[kl] as unknown)=((l as SankeyLink)[(k as keyof SankeyLink)] as boolean | string | number)
        delete l[(k as keyof SankeyLink)] 
      }
    })
    if (l.local && (l.local.color === '#808080' || l.local.color === 'grey' || l.local.color === DefaultLinkStyle().color) ) {
      delete l.local.color
    }
  })

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
        Object.values(links_no_type).forEach((link)=> (links_no_type[link.idLink].value2 as SankeyLinkValueDict)[region_name] = {} )
      )
    } else if (data_to_convert.dataTags['Periods']) {
      period_names = Object.keys(data_to_convert.dataTags['Periods'].tags)
      period_names.forEach(period_name =>
        Object.values(links_no_type).forEach((link) => (links_no_type[link.idLink].value2 as SankeyLinkValueDict)[period_name] = {} )
      )
    }

    if ( region_names.length > 0 || period_names.length > 0) {
      const reg_or_period_names = region_names.length > 0 ? region_names : period_names
      reg_or_period_names.forEach((region_name,value_index) => {
        Object.values(links_no_type).forEach(
          (link)=> {
            const editable_link = links_no_type[link.idLink];
            (editable_link.value2 as SankeyLinkValueDict)[region_name] = {
              value          : (link.value as number[])[value_index],
              display_value  : (link.display_value as string[])[value_index],
              tags            : {},
              extension : {}
            }
            const sankey_link_value = (editable_link.value2 as SankeyLinkValueDict)[region_name] as SankeyLinkValue
            if (editable_link.mini !== undefined && editable_link.mini !== null) {
              if (!sankey_link_value.extension) {
                sankey_link_value.extension = {}
              }
              if (sankey_link_value.extension) {
                sankey_link_value.extension.mini = (editable_link.mini as number[])[value_index] as unknown as string
                sankey_link_value.extension.maxi = (editable_link.maxi as number[])[value_index]as unknown as string
              }
              const p = ((editable_link.maxi as number[])[value_index] - (editable_link.mini as number[])[value_index])/(editable_link.value as number[])[value_index]
              if (p <= 0.1) {
                sankey_link_value['tags']['Uncert'] = ['10_percent']
              } else if (p <= 0.25) {
                sankey_link_value['tags']['Uncert'] = ['25_percent']
              } else if (p <= 0.5) {
                sankey_link_value['tags']['Uncert'] = ['50_percent']
              } else {
                sankey_link_value['tags']['Uncert'] = ['50+_percent']
              }
            }
            if (data_to_convert.dataTags['flux_types']) {
              sankey_link_value['tags']['flux_types'] = ['computed_data']
            }
            if (editable_link.data_value !== undefined && editable_link.data_value !== null && sankey_link_value.extension) {
              sankey_link_value.extension.data_value  = (editable_link.data_value as number[])[value_index] as unknown as string
              if ( 'data_source' in editable_link) {
                sankey_link_value.extension.data_source = (editable_link.data_source as string[])[value_index]
              }
              if ( 'data_period' in editable_link) {
                sankey_link_value.extension.data_period = (editable_link.data_period as string[])[value_index]
              }
              sankey_link_value['tags']['flux_types'] = ['initial_data']
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
          (editable_link.value2 as SankeyLinkValue) = {
            value : the_value as number,
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
            sankey_link_value.extension.free_maxi = free_maxi;
            (editable_link.value2 as SankeyLinkValue).display_value = ''
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
            const p = (the_maxi - the_mini)/(the_value as number)
            if (p <= 0.1) {
              sankey_link_value['tags']['Uncert'] = ['10_percent']
            } else if (p <= 0.25) {
              sankey_link_value['tags']['Uncert'] = ['25_percent']
            } else if (p <= 0.5) {
              sankey_link_value['tags']['Uncert'] = ['50_percent']
            } else {
              sankey_link_value['tags']['Uncert'] = ['50+_percent']
            }
          }
          if (data_to_convert.dataTags['flux_types']) {
            sankey_link_value['tags']['flux_types'] = ['computed_data']
          }
          if (editable_link.data_value !== undefined && editable_link.data_value !== null && sankey_link_value.extension) {
            sankey_link_value.extension.data_value  = (editable_link.data_value as number[])[0] as unknown as string
            sankey_link_value['tags']['flux_types'] = ['initial_data']
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
  

}

export const convert_data:ConvertDataFuncType = (
  data: SankeyData,
  DefaultSankeyData: ()=>SankeyData,
): void => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  const { display_style,units_names } = data_to_convert

  display_style.font_family=['Arial,sans-serif','Helvetica,sans-serif','Verdana,sans-serif','Calibri,sans-serif','Noto,sans-serif','Lucida Sans,sans-serif','Gill Sans,sans-serif','Century Gothic,sans-serif','Candara,sans-serif','Futara,sans-serif','Franklin Gothic Medium,sans-serif','Trebuchet MS,sans-serif','Geneva,sans-serif','Segoe UI,sans-serif','Optima,sans-serif','Avanta Garde,sans-serif',
    'Times New Roman,serif','Big Caslon,serif','Bodoni MT,serif','Book Antiqua,serif','Bookman,serif','New Century Schoolbook,serif','Calisto MT,serif','Cambria,serif','Didot,serif','Garamond,serif','Georgia,serif','Goudy Old Style,serif','Hoefler Text,serif','Lucida Bright,serif','Palatino,serif','Perpetua,serif','Rockwell,serif','Rockwell Extra Bold,serif','Baskerville,serif',
    'Consolas,monospace','Courier,monospace','Courier New,monospace','Lucida Console,monospace','Lucidatypewriter,monospace','Lucida Sans Typewriter,monospace','Monaco,monospace','Andale Mono,monospace',
    'Comic Sans,cursive','Comic Sans MS,cursive','Apple Chancery,cursive','Zapf Chancery,cursive','Bradley Hand,cursive','Brush Script MT,cursive','Brush Script Std,cursive','Snell Roundhan,cursive','URW Chancery,cursive','Coronet script,cursive','Florence,cursive','Parkavenue,cursive'
  ]

  if (display_style.trade_close === undefined && (data.version === '0.2' || data.version === '0.3')) {
    display_style.trade_close = true
  }
  if (data.version === '0.1') {
    display_style.trade_close = false
  }
  if ((data_to_convert.display_style.unit as unknown) as number === 1) {
    data_to_convert.display_style.unit = true
  }
  // Assign default value to missing variable
  const defaut_data=DefaultSankeyData()
  Object.entries(data.style_link).forEach(s=>{
    s[1]=Object.assign(JSON.parse(JSON.stringify(defaut_data.style_link['default'])),s[1])
    data.style_link[s[0]]=s[1]
    if (s[1].idLink === 'par défaut') {
      s[1].idLink = 'default'
    }
  })
  Object.entries(data.style_node).forEach(s=>{
    s[1]=Object.assign(JSON.parse(JSON.stringify(defaut_data.style_node['default'])),s[1])
    data.style_node[s[0]]=s[1]
    if (s[1].idNode === 'par défaut') {
      s[1].idNode = 'default'
    }
  })

  const attributes_to_remove = ['agregated_level','show_data','trade_close','sankey_type','previous_filter', 'filtered_links', 'filtered_nodes_names', 'filtered_nodes', 'nodes_names', 'max_vertical_offset', 'error', 'nodes2units_conv', 'nodes2tooltips']
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data) {
      delete ((data as unknown) as {[key:string]:unknown})[attributes_to_remove[attr]]
    }
  }
  if ((data.show_structure as unknown as  boolean) === false || (data.show_structure as unknown as  boolean) === true ) {
    data.show_structure = 'reconciled'
  }
  if (data.version === '0.1') {
    units_names.splice(1, 0, 'natural')
  }
  convert_tags(data)
  convert_nodes(data)
  convert_links(data)

  if(data.linkZIndex===undefined || (data.linkZIndex.length!=Object.keys(data.links).length)){
    data.linkZIndex=Object.values(data.links).map(l=>l.idLink)
    if((data as SankeyData & layout_type).layout){
      data.linkZIndex=Object.values((data as SankeyData & layout_type).layout.links).map(l=>l.idLink)
    }
  }

  const tmp1 : SankeyLinkStyle = {
    idLink:'',
    name:'',
  
    // Geometry/appearence
    orientation: '',
    arrow: true,
    color: '',
    opacity: 0,
    left_horiz_shift: 0,
    right_horiz_shift: 0,
    vert_shift: 0,
    curvature: 0,
    curved: true,
    recycling: true,
    arrow_size:0,
    dashed: true,
    // Label
    label_position: '',
    orthogonal_label_position: '',
    label_on_path: true,
    label_visible: true,
    label_font_size: 0,
    text_color: '',
    to_precision:true,
    scientific_precision:0,
    font_family: '',
    label_unit_visible:true,
    label_unit:'',
    custom_digit:true,
    nb_digit:0,
  }
  const tmp2 : SankeyNodeStyle = {
    idNode: '',
    name: '',
  
    // Parameter of node shape
    shape_visible: true,
    label_visible: true,
    node_width: 0,
    node_height: 0,
    color: '',
    shape: 'ellipse',
    node_arrow_angle_factor:0,
    node_arrow_angle_direction:'',
    colorSustainable: true,
  
    // Parameter of node label
    font_family: '',
    font_size: 0,
    uppercase: true,
    bold: true,
    italic: true,
    label_box_width: 0,
    label_color: true,
    label_vert: '',
    label_horiz: '',
    label_background:true,
  
    // Parameter of node value label
    show_value: true,
    label_vert_valeur: '',
    label_horiz_valeur: '',
    value_font_size: 0,
  }

  // Convert style of node and link
  // Previously tehy were object identical to SankeyNode or SankeyLink, now they are like local attribute  
  if(Object.keys(data_to_convert.style_link['default'])!== Object.keys(tmp1) ){
    data.style_link['default'] = DefaultLinkStyle()
  }
  if(Object.keys(data_to_convert.style_node['default'])!== Object.keys(tmp2) ){
    data.style_node['default'] = DefaultNodeStyle()
  }

  if(!data.accordeonToShow.includes('EN') && Object.keys(data.nodeTags).length>0){
    data.accordeonToShow.push('EN')
  }
  if(!data.accordeonToShow.includes('EF') && Object.keys(data.fluxTags).length>0){
    data.accordeonToShow.push('EF')
  }
  if(!data.accordeonToShow.includes('ED') && Object.keys(data.dataTags).length>0){
    data.accordeonToShow.push('ED')
  }

  if(data.node_label_separator===undefined || data.node_label_separator===null){
    data.node_label_separator=''
  }

  clean_data_local(data)
}
const has_not_converted_nodeTags_as_levelTags=(data:SankeyData)=>{
  return Object.values(data.nodeTags).filter(nt=>nt.banner=='level').length>0
}
// Function to clean local variable of nodes and links by deleting local variable if they have the same value as the style
// they're associated with
const clean_data_local=(data:SankeyData)=>{
  // Clean nodes local
  Object.values(data.nodes).forEach(n=>{
    if(n.local!==undefined && n.local!==null){
      Object.keys(n.local).forEach((k_l : string)=>{
        const k_l_c=k_l as keyof SankeyNodeAttrLocal
        const k_s_c=k_l as keyof SankeyNodeStyle

        if(n.local && n.local[k_l_c]==data.style_node[n.style][k_s_c]){
          delete n.local[k_l_c]
        } 
      })
    }
  })

  // Clean links local
  Object.values(data.links).forEach(l=>{
    if(l.local!==undefined && l.local!==null){
      Object.keys(l.local).forEach((k_l : string)=>{
        const k_l_c=k_l as keyof SankeyLinkAttrLocal
        const k_s_c=k_l as keyof SankeyLinkStyle

        if(l.local && l.local[k_l_c]==data.style_link[l.style][k_s_c]){
          delete l.local[k_l_c]
        } 
      })
    }
  })
}
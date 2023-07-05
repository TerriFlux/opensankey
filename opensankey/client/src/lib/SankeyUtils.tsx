import { SankeyData, SankeyLink, SankeyLinkValue, SankeyLinkValueDict, SankeyNode, TagsGroup,SankeyNodeAttrLocal } from './types'
import FileSaver from 'file-saver'
import { complete_sankey_data, convert_data } from './SankeyConvert'
import {  compute_auto_sankey, updateLayout,compute_default_input_outputLinksId } from './SankeyLayout'
import * as d3 from 'd3'
import colormap from 'colormap'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }
/**
 *
 * @param {TagsGroup[]} dataTags
 * @param {{[key:string] : SankeyLinkValue}} v
 * @param {number} depth
 */
export const addDataTags = (
  dataTags: TagsGroup[],
  v: {[key:string] : SankeyLinkValue},
  depth: number
) => {
  const dataTag = Object.values(dataTags)[depth]
  const listKey = Object.keys(dataTag.tags)
  for (const i in listKey) {
    if (depth === dataTags.length - 1 ) {
      try {
        if ( v[listKey[i]] !== undefined) {
          continue
        }
      } catch {
        return
      }
      // const the_val = v.value as unknown as number
      v[listKey[i]] = {
        value: v.value as unknown as number,
        display_value: v.display_value as unknown as string,
        // is_percent:false as unknown as boolean,
        // percent:0 as unknown as number,
        tags: {},
        extension: {}
      }
    } else {
      if ( v[listKey[i]] == undefined ) {
        (v[listKey[i]] as SankeyLinkValueDict) = {}        
      }
      addDataTags(dataTags, v[listKey[i]] as unknown as {[key:string] : SankeyLinkValue}, depth + 1)
    }
  }
}


export const cut_name = (t: string, n: number) => {
  return (t.length > n) ? t.slice(0, n) + '...' : t
}


/**
 * Return link value, determined by selected dataTag (if there is)
 * Sometime the link can be duplicate when we choose to select multiple dataTag 
 * therefore to access the right value of the link we search in the id the right value
 * @param {SankeyData} data
 * @param {string} idLink
 * @param {boolean} [up=false]
 * @returns {*}
 */
export const getLinkValue = (
  data: SankeyData,
  idLink: string,
  up = false
) => {
  const { links, dataTags } = data
  // Split the id and search for value after the original link id
  //  each value represent wich dataTag to choose among those where selected is at true in link.value 
  // If there no dataTag (or no multiple dataTag selected then it take the first selected)
  const idDt=idLink.split('_')
  idDt.splice(0,1)
  const defaultInd=Object.values(data.dataTags)
    .map(d=>{
      return Object.values((d as {tags:Record<string,unknown>}).tags).filter(t=>(t  as {selected:boolean}).selected).map((dd,i)=>i)[0]
    })
  
  const index_dataTag=(idDt.length==0)?defaultInd:idDt.map(d=>Number(d))
  
  if (!(idLink in links)) {

    return {
      value: 0,
      display_value: '',
      // is_percent:false,
      // percent:0,
      tags: {},
      extension: {}
    }
  }
  let val = ((links[idLink].value as unknown) as { [key: string]: SankeyLinkValueDict })
  const listKey = [] as string[]
  let missing_key = false
  Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).forEach((dataTag,i) => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[index_dataTag[i]][0])
  })
  if (missing_key) {
    return {
      value: 0,
      display_value: '',
      tags: {},
      // is_percent:false,
      // percent:0,
      extension: {}
    }
  }

  for (const i in listKey) {
    if (up && +i === (listKey.length - 1)) {
      break
    }
    val = val[listKey[i]]
    if (val === undefined) {
      //console.log(listKey[i] + ' not in val')
      return {
        value: 0,
        display_value: '',
        tags: {},
        // is_percent:false,
        // percent:0,
        extension: {}
      }      
    }
  }
  return (val as unknown) as SankeyLinkValue
}

/**
 * 
 * @param {number} max_node_value
 * @param {SankeyLinkValueDict} value_dict
 * @returns {number}
 */
export const findMaxLinkValue = (
  max_node_value: number,
  value_dict: SankeyLinkValueDict
) => {
  let new_max_node_value = max_node_value
  if (value_dict === undefined || Object.values(value_dict).length == 0) {
    return new_max_node_value
  }
  const child = Object.values(value_dict)[0]
  if (typeof child === 'object') {
    Object.values(value_dict).forEach(v => {
      const cur_max_value = findMaxLinkValue(new_max_node_value, (v as unknown) as SankeyLinkValueDict)
      new_max_node_value = cur_max_value > new_max_node_value ? cur_max_value : new_max_node_value
    })
  } else {
    const tmp=(value_dict as SankeyLinkValue).value
    new_max_node_value = (tmp && (tmp > new_max_node_value)) ? tmp : new_max_node_value
    
  }
  return new_max_node_value
}



/**
 *  Compute the sum of all link visible
 *
 * @param {SankeyData} data
 * @param {string[]} Links
 * @returns {number}
 */
export const getTotalLinks = (
  data: SankeyData,
  Links: string[],
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  let total = 0
  Links.forEach(element => {
    // On vérifie que le lien est affiché, cad que le noeud source et le noeud target sont
    if (node_displayed(data,data.nodes[data.links[element].idSource]) && node_displayed(data,data.nodes[data.links[element].idTarget])) {
      const tmp = getLinkValue(data, element).value
      
      total += (tmp)?tmp:0
    }
  })
  return total
}


export const compute_total_offsets = (
  inv_scale:(t:number)=>number,
  node: SankeyNode,
  data: SankeyData,
  selected_tags: { [tag_group: string]: string[] },
  test_link_value: (data:SankeyData, nodes: { [node_id: string]: SankeyNode }, d: SankeyLink,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
  ) => SankeyLinkValue | object | string,
  ref_link: SankeyLink | undefined = undefined,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue

) => {
  const { nodes, links} = data

  let offset_height_left = 0
  let offset_height_right = 0
  let offset_width_top = 0
  let offset_width_bottom = 0

  const left_flux: string[] = []
  const right_flux: string[] = []
  const top_flux: string[] = []
  const bottom_flux: string[] = []

  node.outputLinksId.forEach(
    (idLink) => {
      const link = links[idLink]
      if (link === undefined) {

        return
      }
      if (nodes[link.idSource] && node_displayed(data,nodes[link.idSource]) && nodes[link.idTarget] && node_displayed(data,nodes[link.idTarget])) {
        let target_node
        try {
          target_node = nodes[link.idTarget]
        } catch {
          return
        }

        const node_x = node.position === 'absolute' ? +node.x : +target_node.x + +node.x
        const node_y = node.position === 'absolute' ? +node.y : +target_node.y + +node.y
        const target_node_x = target_node.position === 'absolute' ? +target_node.x : +node.x + +target_node.x
        const target_node_y = target_node.position === 'absolute' ? +target_node.y : +node.y + +target_node.y
        if (link.orientation === 'hh') {
          if (target_node_x > node_x && !link.recycling || target_node_x <= node_x && link.recycling) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (link.orientation === 'vv') {
          if (target_node_y > node_y) {
            bottom_flux.push(idLink)
          } else {
            top_flux.push(idLink)
          }
        } else if (link.orientation === 'hv') {
          if (target_node_x > node_x) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (link.orientation === 'vh') {
          if (target_node_y > node_y) {
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
      if (link === undefined) {

        return
      }
      if (nodes[link.idSource] && node_displayed(data,nodes[link.idSource]) && nodes[link.idTarget] && node_displayed(data,nodes[link.idTarget])) {
        let source_node
        try {
          source_node = nodes[link.idSource]
        } catch {
          return
        }
        const source_node_x = source_node.position === 'absolute' ? +source_node.x : +node.x + +source_node.x
        const source_node_y = source_node.position === 'absolute' ? +source_node.y : +node.y + +source_node.y
        const node_x = node.position === 'absolute' ? +node.x : +source_node.x + +node.x
        const node_y = node.position === 'absolute' ? +node.y : +source_node.y + +node.y
        if (link.orientation === 'vv') {
          if (source_node_y < node_y) {
            // flux goes down
            top_flux.push(idLink)
          } else {
            // flux goes up
            bottom_flux.push(idLink)
          }
        } else if (link.orientation === 'hh') {
          if (source_node_x >= node_x && link.recycling || source_node_x < node_x && !link.recycling) {
            // flux goes right
            left_flux.push(idLink)
          } else {
            // flux goes left
            right_flux.push(idLink)
          }
        } else if (link.orientation === 'hv') {
          if (source_node_y < node_y) {
            // flux goes right
            top_flux.push(idLink)
          } else {
            // flux goes left
            bottom_flux.push(idLink)
          }
        } else if (link.orientation === 'vh') {
          if (source_node_x < node_x) {
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
      const v = test_link_value(data, nodes, links[the_id],getLinkValue)
      if (v === undefined || v=='') {
        return
      }
      const extension = getLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined && 
                      data.show_structure !== 'free_interval' && 
                      data.show_structure !== 'free_value' &&
                      !extension.free_visible
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_width_top += inv_scale(5)
      } else {
        offset_width_top += +v
      }
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
      const v = test_link_value(data, nodes, links[the_id],getLinkValue)
      if (v === undefined || v=='') {
        return
      }
      const extension = getLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined && 
                      data.show_structure !== 'free_interval' && 
                      data.show_structure !== 'free_value' &&
                      !extension.free_visible
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_width_bottom += inv_scale(5)
      } else {
        offset_width_bottom += +v
      }
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
      const v = test_link_value(data, nodes, links[the_id],getLinkValue)
      if (v === undefined || v=='') {
        return
      }
      const extension = getLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined && 
                      data.show_structure !== 'free_interval' && 
                      data.show_structure !== 'free_value' &&
                      !extension.free_visible
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_height_left += inv_scale(5)
      } else {
        offset_height_left += +v
      }
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
      const v = test_link_value(data, nodes, links[the_id],getLinkValue)
      if (v === undefined || v=='') {
        return
      }
      const extension = getLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined && 
                      data.show_structure !== 'free_interval' && 
                      data.show_structure !== 'free_value' &&
                      !extension.free_visible
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_height_right += inv_scale(5)
      } else {
        offset_height_right += +v
      }
    }
  )

  return [offset_height_left, offset_height_right, offset_width_top, offset_width_bottom]
}
/**
 * Transform the value with scientific display
 *
 * @param {number} v
 * @returns {*}
 */
export const toPrecision = (
  v: number
) => {
  if (v < 1) {
    return String(v.toFixed(1).replace(/\.0+$/, ''))
  }
  let new_v = v.toPrecision(3).replace(/\.0+$/, '')
  if (new_v.includes('e+3')) {
    new_v = String(parseFloat(new_v))
  }
  return new_v
}
/**
 * Return the value of the link if the display value is empty either way it return display_value
 *
 * @param {SankeyData} data
 * @param {SankeyLink} d
 * @returns {*}
 */
export const link_text = (
  data: SankeyData,
  d: SankeyLink,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  if(getLinkValue===undefined){
    console.log('stop')
  }
  let the_link_value = getLinkValue(data, d.idLink).value
  const str_display = String(getLinkValue(data, d.idLink).display_value)
  if (str_display !== '' && str_display!=='*') {
    return str_display
  }
  if (data.show_structure == 'structure' ) {
    return
  }
  if (data.show_structure == 'data' ) {
    const link_value = getLinkValue(data, d.idLink)
    if ((link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return (link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value 
    } else {
      return
    }
  }
  the_link_value = (d.to_precision)?toPrecision(the_link_value):the_link_value
  return the_link_value
}


export const test_link_value = (data:SankeyData, nodes: { [node_id: string]: SankeyNode }, d: SankeyLink,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  const { dataTags } = data
  if (data.show_structure == 'structure' ) {
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, data.user_scale])
    return inv_scale(5)
  }
  if (data.show_structure == 'data' ) {
    const link_value = getLinkValue(data, d.idLink)
    if ((link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return (link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value 
    } else {
      const inv_scale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, data.user_scale])
      return inv_scale(5)
    }
  }
  let val = ((d.value as unknown) as { [key: string]: SankeyLinkValueDict })
  const listKey: string[] = []
  const idDt=d.idLink.split('_')
  idDt.splice(0,1)
  const defaultInd=Object.values(data.dataTags)
    .map(d=>{
      return Object.values((d as {tags:Record<string,unknown>}).tags).filter(t=>(t  as {selected:boolean}).selected).map((dd,i)=>i)[0]
    })
  
  const index_dataTag=(idDt.length==0)?defaultInd:idDt.map(d=>Number(d))
  let missing_key = false
  Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).forEach((dataTag,i) => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[index_dataTag[i]][0])
  })
  if (missing_key) {
    return {
      value: 0,
      display_value: '',
      tags: {},
      extension: {}
    }
  }
  // //Récupère la liste des tags selectionné pour chaque dataTags ayant au moins un groupe tag

  for (const i in listKey) {
    if ( val === undefined) {
      //console.log(listKey[i] + ' not found in val')
      break
    }
    val = ((val as unknown) as { [key: string]: SankeyLinkValueDict })[listKey[i]]
  }
  if (val === undefined) {
    return 0
  }
  if ( data.maximum_flux && ((val as unknown) as SankeyLinkValue).value > data.maximum_flux) {
    return data.maximum_flux
  }
  return ((val as unknown) as SankeyLinkValue).value
}
/**
 * return a default sankey_data, use at the initialisation or re-initialisation of the application
 *
 * @returns {SankeyData}
 */
export const default_sankey_data = (): SankeyData => {
  const data : Omit<SankeyData,'style_node' | 'style_link'> = {
    version: '0.8',
    couleur_fond_sankey:'#f2f2f2',
    displayed_node_selector:false,
    displayed_link_selector:false,
    nodes: {},
    links: {},
    user_scale: 20,

    accordeonToShow: ['MEP'],

    width: window.innerWidth - 50,
    height: window.innerHeight - 50,

    h_space: 200,
    v_space: 100,

    show_structure: 'reconciled',
    fit_screen: window.SankeyToolsStatic,

    // icon_catalog: {},

    left_shift: 0.4,
    right_shift: 0.5,
    max_shift: 0.2,

    display_style: {
      filter: 0,
      filter_label: 0,
      null_flux: false,
      font_family: ['Arial,sans-serif','Helvetica,sans-serif','Verdana,sans-serif','Calibri,sans-serif','Noto,sans-serif','Lucida Sans,sans-serif','Gill Sans,sans-serif','Century Gothic,sans-serif','Candara,sans-serif','Futara,sans-serif','Franklin Gothic Medium,sans-serif','Trebuchet MS,sans-serif','Geneva,sans-serif','Segoe UI,sans-serif','Optima,sans-serif','Avanta Garde,sans-serif',
        'Times New Roman,serif','Big Caslon,serif','Bodoni MT,serif','Book Antiqua,serif','Bookman,serif','New Century Schoolbook,serif','Calisto MT,serif','Cambria,serif','Didot,serif','Garamond,serif','Georgia,serif','Goudy Old Style,serif','Hoefler Text,serif','Lucida Bright,serif','Palatino,serif','Perpetua,serif','Rockwell,serif','Rockwell Extra Bold,serif','Baskerville,serif', 
        'Consolas,monospace','Courier,monospace','Courier New,monospace','Lucida Console,monospace','Lucidatypewriter,monospace','Lucida Sans Typewriter,monospace','Monaco,monospace','Andale Mono,monospace',
        'Comic Sans,cursive','Comic Sans MS,cursive','Apple Chancery,cursive','Zapf Chancery,cursive','Bradley Hand,cursive','Brush Script MT,cursive','Brush Script Std,cursive','Snell Roundhan,cursive','URW Chancery,cursive','Coronet script,cursive','Florence,cursive','Parkavenue,cursive'
      ],
      node_font_family_selected: 'Arial,serif',
      link_font_family_selected: 'Arial,serif'
    },
    grid_square_size: 50,
    grid_visible: true,

    static_sankey: false,

    nodeTags: {},
    dataTags: {},
    fluxTags: {},

    colorMap: 'no_colormap', 

    legend_width:180,
    // legend_position initial : largeur ecran - legend_width - marge du svg - largeur bouton menu
    legend_position: [window.innerWidth-240, 10],
    display_legend_scale:false,
    legend_police:16,
    
    // view: []
  }
  const default_data = {
    ...data,
    style_node: { 'default' : default_node(data as SankeyData) },
    style_link: { 'default' : default_link(data as SankeyData) }
  }
  return (default_data as unknown as SankeyData)
}
/**
 * Return the color of the link wich depend of the groupTag selected and the color attribued to the link
 *
 * @param {SankeyLink} l
 * @param {SankeyData} data_s
 * @returns {*}
 */
export const link_color = (l: SankeyLink,data_s:SankeyData,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  let colorLink
  if (l.colorParameter === 'groupTag') {
    //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
    //on controle ici qu'il y a bien un favorite tag
    if (l.colorTag !== undefined && l.colorTag !== '') {
      if (l.colorTag !== 'no_colormap') {
        const tagGroup = l.colorTag
        const v = getLinkValue(data_s, l.idLink)
        if (v === undefined) {
          return l.color
        }
        if (tagGroup in data_s.fluxTags && v.tags[tagGroup] in data_s.fluxTags[tagGroup].tags) {
          colorLink = data_s.fluxTags[tagGroup].tags[v.tags[tagGroup]].color
        } else {
          colorLink = 'grey'
        }
      } else if(Object.keys(data_s.dataTags).map(d=>'dataTags_'+d).includes(data_s.colorMap)){
        const idDt=l.idLink.split('_')
        const colorMapFilterd=data_s.colorMap.slice(9,data_s.colorMap.length)
        const ind_str=(idDt.length>1)?idDt.slice(idDt.length-1,idDt.length)[0]:0

        const ind=Number(ind_str)
        // Sélectionne les tags du dataTag le plus imbirqué (Le dernier de la liste des dataTags)
        const tagsOfDT=data_s.dataTags[colorMapFilterd].tags
        colorLink=Object.values(tagsOfDT).filter(d=>d.selected)[ind].color
      
      } else {
        const source_node = data_s.nodes[l.idSource]
        const target_node = data_s.nodes[l.idTarget]
        let selected_tag = ''
        if (source_node.colorParameter !== 'local' && target_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && target_node.colorTag in target_node.tags) {
          const common_tags = source_node.tags[source_node.colorTag].filter(value => target_node.tags[target_node.colorTag].includes(value))
          if (common_tags.length > 0 && common_tags[0] in data_s.nodeTags[source_node.colorTag].tags) {
            return data_s.nodeTags[source_node.colorTag].tags[common_tags[0]].color
          }
        }
        // if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'échange' && 
        // source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags ) {
        //   selected_tag = source_node.tags[source_node.colorTag][0]
        //   if (selected_tag in data_s.nodeTags[source_node.colorTag].tags) {
        //     return data_s.nodeTags[source_node.colorTag].tags[selected_tag].color
        //   } else {
        //     return l.color
        //   }
        // }
        // if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'échange' && 
        // target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags ) {
        //   selected_tag = target_node.tags[target_node.colorTag][0]
        //   if (selected_tag in data_s.nodeTags[target_node.colorTag].tags) {
        //     return data_s.nodeTags[target_node.colorTag].tags[selected_tag].color
        //   } else {
        //     return l.color
        //   }
        // }
        if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit' && 
          target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit' &&
          target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
          selected_tag = target_node.tags[target_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[target_node.colorTag].tags) {
            return data_s.nodeTags[target_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        }
        if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit' && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
          selected_tag = source_node.tags[source_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[source_node.colorTag].tags) {
            return data_s.nodeTags[source_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit' && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
          selected_tag = target_node.tags[target_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[target_node.colorTag].tags) {
            return data_s.nodeTags[target_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        } else if ((!source_node.tags['Type de noeud'] || (source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] !== 'produit')) && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
          selected_tag = source_node.tags[source_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[source_node.colorTag].tags) {
            return data_s.nodeTags[source_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        } else if ((!target_node.tags['Type de noeud'] || (target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] !== 'produit')) && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
          selected_tag = target_node.tags[target_node.colorTag][0]
          if (data_s.nodeTags[target_node.colorTag].tags[selected_tag]) {
            return data_s.nodeTags[target_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        } else if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit') {
          return source_node.color
        } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit') {
          return target_node.color
        } else {
          return l.color
        }
      }
    } else {
      colorLink = l.color
    }
  }
  if (l.colorParameter === 'local') {
    // Le couleur est définie dans les parametres locaux du noeud
    colorLink = l.color
  }

  return colorLink
}


/**
 * Test if the link is visible
 * it do so by testing the value of the link with parameter selected for the sankey (exemple if the link doesn't have a tag displayed by the sanke, it return false)
 * if one of the source or target node is a not visible, it return false
 * if it value is inferior to the link threshold then it return false
 *
 * @param {SankeyLink} l
 * @param {SankeyData} data_s
 * @returns {boolean}
 */
export const link_visible = (l: SankeyLink, data_s: SankeyData,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  const { dataTags, fluxTags } = data_s
  if (data_s.show_structure === 'structure') {
    if (data_s.nodes[l.idSource].position === 'relative' || data_s.nodes[l.idTarget].position === 'relative') {
      return false
    }
  }
  if (!l) {
    return false
  }
  if (!data_s.nodes[l.idSource] || !node_displayed(data_s,data_s.nodes[l.idSource]) || !data_s.nodes[l.idTarget] || !node_displayed(data_s,data_s.nodes[l.idTarget])) {
    return false
  }
  let val = ((l.value as unknown) as { [key: string]: SankeyLinkValueDict })
  const listKey = [] as string[]
  let missing_key = false
  const idDt=l.idLink.split('_')
  idDt.splice(0,1)
  const defaultInd=Object.values(data_s.dataTags)
    .map(d=>{
      return Object.values((d as {tags:Record<string,unknown>}).tags).filter(t=>(t  as {selected:boolean}).selected).map((dd,i)=>i)[0]
    })
  
  const index_dataTag=(idDt.length==0)?defaultInd:idDt.map(d=>Number(d))
  Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).forEach((dataTag,i) => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[index_dataTag[i]][0])
  })
  if (missing_key) {
    return false
  }

  for (const i in listKey) {
    val = ((val as unknown) as { [key: string]: SankeyLinkValueDict })[listKey[i]]
    if ( val === undefined) {
      break
    }
  }
  if ( val === undefined) {
    return false
  }
  const v = (val as unknown) as SankeyLinkValue
  let visible = true
  Object.keys(data_s.fluxTags).forEach(tag_group => {
    const selected_tag = v.tags[tag_group]
    if (selected_tag && selected_tag in fluxTags[tag_group].tags  && !fluxTags[tag_group].tags[selected_tag].selected) {
      visible = false
    }
  })
  if (!visible) {
    return false
  }
  const link_values = getLinkValue(data_s,l.idLink)
  const is_free = link_values.extension?.free_mini !== undefined &&
                  data_s.show_structure !== 'free_interval' &&
                  data_s.show_structure !== 'free_value' &&
                  !link_values.extension?.free_visible
  if (link_values.extension?.free_visible) {
    return true
  }
  if (!is_free && test_link_value(data_s, data_s.nodes, l,getLinkValue) === 0) {
    if (data_s.display_style.null_flux) {
      return true
    } 
    return false
  }
  return true
}

/**
 * Return a default_node, used at the creation of a new node
 *
 * @param {SankeyData} data
 * @returns {SankeyNode}
 */
export const default_node = (
  data: SankeyData
): SankeyNode => {
  const defaultNode :  SankeyNode = {
    name: '',
    idNode: 'default',
    shape: 'rect',
    shape_visible: true,
    label_visible: true,
    node_width: 40,
    node_height: 40,
    // iconName: 'none',
    // iconColor: '#fff',
    // iconRatio: 80,
    // iconVisible: true,
    not_to_scale:false,
    not_to_scale_direction:'right',

    color: '#a9a9a9',
    colorParameter: 'local',
    colorSustainable:false,

    position: 'absolute',
    x: 100,
    y: 100,
    inputLinksId: [],
    outputLinksId: [],
    show_value: false,
    tags: {},
    colorTag: '',
    dimensions: {},
    style: 'default',
    display_style: {
      font_family: 'Cormorant',
      font_size: 14,
      uppercase: false,
      bold: false,
      italic: false,
      label_vert: 'bottom',
      label_horiz: 'middle',
      label_vert_valeur: 'middle',
      label_horiz_valeur: 'middle',
      value_font_size:14,
      label_box_width: 110,
      label_color:false
    },
  }
  for (const tag_group_key in data.nodeTags) {
    defaultNode.tags[tag_group_key]  = []
  }
  return defaultNode
}
/**
 *
 * @param {SankeyData} data
 * @param {string[]} l
 * @returns {*}
 */
const create_object = (data: SankeyData, l: string[]) => {
  const { dataTags } = data
  if (l.length == 0) {
    const obj = Object.create({})
    obj['value'] = ''
    obj['display_value'] = ''
    obj['tags'] = {}
    obj['extension'] = {}

    return obj
  } else {
    const i = l[0]
    if (i !== undefined) {
      const o = Object.create({})
      Object.keys(dataTags[i].tags).forEach(tag_key => {
        const obj = Object.create({})
        const ob = create_object(data, l.slice(1))
        obj[tag_key] = ob
        Object.assign(o, obj)
      })
      return o
    }
  }
}
/**
 * Return a default link, used at the creation of a new link
 *
 * @param {SankeyData} data
 * @returns {SankeyLink}
 */
export const default_link = (data: SankeyData): SankeyLink => {
  const { dataTags } = data
  let nObjet = Object.create({})
  const listK = Object.keys(dataTags).filter(d => {

    if (Object.keys(dataTags[d].tags).length != 0) {
      return true
    } else {
      return false
    }
  })


  nObjet = create_object(data, listK)

  return {
    idSource: 'node0',
    idTarget: 'node1',
    idLink: 'link0',
    value: nObjet,
    color: '#a9a9a9',
    recycling:false,
    curved: true,
    arrow: true,
    text_color: 'black',
    label_position: 'end',
    orthogonal_label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    label_font_size:20,
    orientation: 'hh',
    left_horiz_shift: 0,
    right_horiz_shift: 1,
    vert_shift: 0,
    colorTag: '',
    colorParameter: 'local',
    style:'default',
    dashed:true,
    to_precision:true,
    opacity:0.85
  }
}
/**
 * Delete a link and trace of the said link in the source and target nodes
 *
 * @param {SankeyData} data
 * @param {SankeyLink} link
 */
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
/**
 * Delete node and all links linked to it
 *
 * @param {SankeyData} data
 * @param {SankeyNode} node
 */
export const delete_node = (
  data: SankeyData,
  node: SankeyNode
) => {

  //Ne fait plus appel à delete_link car la fonction modifie le tableau des output/input du node 
  //et ne supprime pas des flux qui devrait l'être 

  node.inputLinksId.forEach(idLink => {
    Object.values(data.nodes).map((k) => {
      k.outputLinksId = k.outputLinksId.filter(function (value) {
        return value != idLink
      })
    })
    delete data.links[idLink]
  })

  node.outputLinksId.forEach(idLink => {
    Object.values(data.nodes).map((k) => {
      k.inputLinksId = k.inputLinksId.filter(function (value) {
        return value != idLink
      })
    })
    delete data.links[idLink]
  })
  // The case below is not expected. The target and the source of the Links should have the link in inputLinksId  or outputLinksIdµ.
  // However this code avoids the crash
  const links_to_delete = Object.values(data.links).filter(l=>l.idSource === node.idNode || l.idTarget === node.idNode).map(l=>l.idLink)
  for (const id in  links_to_delete) {
    delete data.links[links_to_delete[id]]
    Object.values(data.nodes).map((k) => {
      k.inputLinksId = k.inputLinksId.filter(function (value) {
        return value != links_to_delete[id]
      })
    })
    Object.values(data.nodes).map((k) => {
      k.outputLinksId = k.outputLinksId.filter(function (value) {
        return value != links_to_delete[id]
      })
    })
  }

  delete data.nodes[node.idNode]
}



/**
 *
 * @typedef {layout_type}
 */
type layout_type = {
  layout: SankeyData
}
// Download example from server
/**
 *
 * @param {string} file_name
 * @param {string} the_url_prefix
 * @param {string} filetype
 */
export const downloadExamples = (
  file_name: string,
  the_url_prefix: string,
  filetype: string
) => {
  const root = window.location.href
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

/**
 *
 * @param {SankeyData} server_data
 * @returns {*}
 */
export const processExample = (server_data: SankeyData ) => {
  const data = default_sankey_data()
  Object.assign(data, server_data)
  //convert_data(data)
  complete_sankey_data(data,default_sankey_data,default_node,default_link)
  if ( (data as SankeyData & layout_type).layout === undefined) {
    compute_auto_sankey(data, data.h_space ? data.h_space : 200)
  } else {
    convert_data((data as SankeyData & layout_type).layout)
    complete_sankey_data((data as SankeyData & layout_type).layout,default_sankey_data,default_node,default_link)
    compute_default_input_outputLinksId(data.nodes, data.links)
    updateLayout(data, (data as SankeyData & layout_type).layout,['posNode','attrNode','attrFlux','tagNode','tagFlux','tagData','attrGeneral'])
    delete (data as SankeyData & { layout?: SankeyData }).layout
  }
  d3.select('.loading_auto_compute').remove()

  return data
}

/**
 *
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @param {(b: boolean) => void} set_show_excel_dialog
 * @param {Blob} input_file
 * @param {string} the_url_prefix
 * @returns {void, set_show_excel_dialog: (b: boolean) => void, input_file: any, the_url_prefix: string) => void}
 */
export const uploadExcelImpl = (
  data: SankeyData,
  set_data: (data: SankeyData) => void,
  set_show_excel_dialog: (b: boolean) => void,
  input_file: Blob,
  the_url_prefix: string
) => {
  const root = window.location.href
  const url = root + the_url_prefix + 'sankey/upload_excel'
  const form_data = new FormData()
  form_data.append(
    'file', input_file
  )
  const fetchData = {
    method: 'POST',
    body: form_data
  }
  fetch(url, fetchData)
  set_show_excel_dialog(false)
}

/**
 *
 * @param {string} file_name
 * @param {string} the_url_prefix
 * @param {SankeyData} data
 * @param {(data: SankeyData) => void} set_data
 * @returns {void) => void}
 */
export const uploadExemple = (
  file_name: string,
  the_url_prefix: string,
  data: SankeyData,
  set_data: (data: SankeyData) => void,
  reinitialization: ()=>void,

) => {
  let root = window.location.href
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  
  const url = root + the_url_prefix + '/sankey/upload_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }
  //set_data({ ...default_sankey_data() })

  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      const server_data = JSON.parse(text)
      const error = server_data['error']
      if (error && error.length != 0) {
        alert(error)
        return
      }
      
      if (file_name.includes('.xlsx')) {
        // Object.assign(data,processExample(server_data))
        // callback(data)
        // set_data({ ...data })
        //downloadExamples(file_name, the_url_prefix, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      } else {
        reinitialization()
        Object.assign(data,server_data)
        convert_data(data)
        complete_sankey_data(data,default_sankey_data,default_node,default_link)
        set_data({ ...data})
      }
    })
  })
}

export const downloadExempleExcel = (
  file_name: string,
) => {
  let root = window.location.href
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  
  const url = root + '/opensankey/sankey/upload_examples'
  const fetchData = {
    method: 'POST',
    body: file_name
  }
  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      const server_data = JSON.parse(text)
      const error = server_data['error']
      if (error && error.length != 0) {
        alert(error)
        return
      }
      clickSaveExcel('/opensankey/',server_data)

    })
  })
}
export const clickSaveExcel = (url_prefix:string,data:SankeyData) => {
  let root = window.location.href
  if (root.includes('dashboard')) {
    root = root.replace('dashboard', '')
  }
  let url = root + url_prefix + 'sankey/save_excel'
  
  const fetchData = {
    method: 'POST',
    body: JSON.stringify(data)
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    FileSaver.saveAs(newBlob, 'sankey.xlsx')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = root + url_prefix + 'sankey/clean_excel'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}




// Function that return the color that the node has to display
// It depend of if a tags is selected, if the persistent variable is at true and the color we gived to the node
export const node_color = (n: SankeyNode,data:SankeyData) => {
  let colorNode
  if (n.colorParameter === 'groupTag' || data.show_structure === 'structure' ) {
    //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
    //on controle ici qu'il y a bien un favorite tag
    if (n.colorTag !== undefined && n.colorTag !== '') {
      const tagGroup = n.colorTag
      if (n.tags[tagGroup] === undefined) {
        colorNode = 'grey'
        colorNode=(n.colorSustainable)? n.color:colorNode
      } else if (n.tags[tagGroup].length == 1 ) {  
        if (data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]]) {
          colorNode = data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]].color
        } else {
          colorNode = 'grey'
          colorNode=(n.colorSustainable)? n.color:colorNode
        }
      } else {
        colorNode = 'grey'
      }
    } else {
      colorNode = 'grey'
    }
  }
  if (n.colorParameter === 'local') {
    // Le couleur est définie dans les parametres locaux du noeud
    colorNode = n.color
  }  
  return colorNode
}

export const get_vertical_marfin_for_sankey_zone=()=>{
  // Get height of elements ahead and below the sankeydraw zone 
  const shift_top=document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height
  const footer_size=document.getElementsByClassName('sankeyFooter')[0]?.getBoundingClientRect().height
  return shift_top+footer_size
}
export const adjust_sankey_zone=(data:SankeyData,min_width_and_height:(data:SankeyData)=>number[],show_nav=false,vertical=false)=>{
  [data.width, data.height] = min_width_and_height(data)
  let size_menu=0
  if(show_nav){
    size_menu=540
  }
  // Width of the screen minus the margin of the sankey zone minus the width of the configuration menu if it's open
  const has_scroll_bar=window.innerHeight-document.getElementsByTagName('html')[0].clientHeight
  const is_fullscreen=d3.selectAll('.opensankey .fullscreen_toolbar').nodes().length>0?35:0


  const visible_size=window.innerWidth -size_menu - has_scroll_bar - (is_fullscreen?-50:50)
  
  const vertical_margin=get_vertical_marfin_for_sankey_zone()


  const vertical_visible_size=window.innerHeight - 50 - (vertical_margin) - is_fullscreen
  const scale=vertical?(vertical_visible_size/data.height):(visible_size/data.width)
  const zoomed=()=> {
    d3.select(' .opensankey #svg').attr('transform', 'scale('+scale+')')
    d3.select(' .opensankey #svg #g_legend').style('transform', 'translate(' + (data.legend_position[0]) + 'px,' + data.legend_position[1] + 'px) scale('+(1/((scale<1)?scale:1))+')')
    d3.select(' .opensankey #svg #g_legend .measurment_scale').html(String(Math.round((data.user_scale/2)/((scale<1)?scale:1))))
    d3.select(' .opensankey #svg')
      .style('border', Math.round(2 ) + 'px solid #d3d3d3')
      .style('width', data.width + 'px')
  }
  const zoom = d3.zoom()
    .on('zoom', zoomed)
  zoom.scaleTo(d3.select(' .opensankey #svg'),scale)
  document.getElementsByTagName ('html')[0]?.scrollTo(0,0)
}

export const clickSaveDiagram = (data:SankeyData,name='sankey_diagram') => {
  const data_to_save = { ...data }
  const str_data = JSON.stringify(data_to_save, null, 2)

  const blob = new Blob([str_data], { type: 'text/plain;charset=utf-8' })
  FileSaver.saveAs(blob, name+'.json')
}

export const add_tag=(data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string)=>{
  const elementTagName = type_tag_name
  // Méthode pour incrementer idElement
  const listId: number[] = []
  Object.keys(data[elementTagName][tags_group_key].tags).forEach(elt => listId.push(Number(elt.replace('element', ''))))
  const idElement = listId.length > 0 ? Math.max(...listId) + 1 : 0
  data[elementTagName][tags_group_key].tags['element' + idElement] = { name: 'étiquette' + idElement, color: '#000000', selected: true }
  const nb_tags = Object.keys(data[elementTagName][tags_group_key].tags).length
  const colors = colormap({
    colormap: data[elementTagName][tags_group_key].color_map,
    nshades: Math.max(11, nb_tags),
    format: 'hex',
    alpha: 1
  })
  let step = 1
  if (nb_tags < 11) {
    step = Math.round(11 / nb_tags)
  }
  Object.keys(data[elementTagName][tags_group_key].tags).forEach(
    (tag_key, i) => data[elementTagName][tags_group_key].tags[tag_key].color = colors[i * step]
  )
} 

export const add_grp_tag=(data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string,elementNameProp:string)=>{
  const elementTagName = type_tag_name
  const elementName = elementNameProp === 'nodes' ? 'nodes' : 'links'
  // Méthode pour incrementer idGroup
  const idGroup = Object.keys(data[elementTagName]).length+1
  //la clé est unique grâce au timestamp mais le nom est liée au nombre de grouptag
  const k='tag_group_' + String(new Date().getTime())
  data[elementTagName][k] = {
    group_name: 'Étiquette Group ' + idGroup,
    show_legend: false,
    color_map: 'jet',
    tags: {},
    banner: 'multi',
    activated: true,
    siblings: []
  }
  if (elementName === 'nodes' ) {
    Object.values(data[elementName]).forEach(n => n.tags[k] = [])
  }
  if (Object.keys(data[elementTagName]).length === 1) {
    Object.values(data[elementName]).forEach(n => n.colorTag = Object.keys(data[elementTagName])[0])
  }
    
  // Add an element to the group newly created
  // Méthode pour incrementer idElement
    
  add_tag(data,type_tag_name,k)
  return k
}

// Return value of local node variable attribute that can be undefined ('local' and 'local[key]' can be undefined) 
export const return_local_node_var=(n:SankeyNode,key:keyof SankeyNodeAttrLocal)=>{
  if(n.local==undefined){
    return undefined
  }else{
    return n.local[key]
  }
}

// The node is displayed if the tags attribued are also selected and either it has the general aggregation level selected 
// or it can have a local aggregation level selected that doesn't require the verify the general level selected  
export const node_displayed=(data:SankeyData,n:SankeyNode)=>{
  const has_local_level=return_local_node_var(n,'local_aggregation')
  let local_level=node_has_displayed_level(data,n)
  if(has_local_level!==undefined && has_local_level!==null){
    local_level=has_local_level
  }
  return node_has_displayed_tags(data,n) && ( local_level ) && has_links_zero(data,n)
}

export const node_has_displayed_tags=(data:SankeyData,n:SankeyNode)=>{
  let to_display=true

  Object.entries(data.nodeTags).filter(nt=>nt[1].banner!='level' && nt[0] !== 'Type de noeud' && Object.keys(n.tags).includes(nt[0])).forEach(nt=>{
    // Check tags from the group attribued to the node
    // If the node don't have tag attribued from the group then it is not affected by filter and we display it
    const node_tags_attr=n.tags[nt[0]]

    if(node_tags_attr.length!=0){
      // If the node has at least 1 tag from the selected tag of the group then we display it
      // If the node has tag from the group attribued to it but are not selected then we don't display it
      const tags_from_grp_to_display=Object.values(nt[1].tags).filter(t=>t.selected).map(t=>t.name)
      to_display=(node_tags_attr.filter(t=>tags_from_grp_to_display.includes(t)).length>0)?to_display:false
    }
  })
  return to_display
}

export const node_has_displayed_level=(data:SankeyData,n:SankeyNode)=>{
  let to_display=true
  // Check if there is other aggregation tags than 'Primaire',
  const multi_level=Object.entries(data.nodeTags).filter(nt=>nt[1].banner=='level' && nt[0]!=='Primaire').map(nt=>nt[0]).length>0

  // To display a node according to level tag we search if:
  // - The node grp tag banner is 'level'
  // - The node.nodeTags have more level grp tag than 'Primaire', if that's the case we don't use grp tag 'Primaire' in the filter of node grp tag
  // - The node grp tag is activated (variable is set false if we activate another grp tag that has this grp tag in variable sibling)
  // - The node has the grp tag name in his tags
  Object.entries(data.nodeTags).filter(nt=>nt[1].banner=='level'&& (multi_level?nt[0]!=='Primaire':true) && nt[1].activated && Object.keys(n.tags).includes(nt[0])).forEach(nt=>{
    // Check tags from the group attribued to the node
    // If the node don't have tag attribued from the group then it is not affected by filter and we display it
    const node_tags_attr=n.tags[nt[0]]
    if(node_tags_attr.length!=0){
      // If the node has at least 1 tag from the selected tag of the group then we display it
      // If the node has tag from the group attribued to it but are not selected then we don't display it
      const tags_from_grp_to_display=Object.values(nt[1].tags).filter(t=>t.selected).map(t=>t.name)
      to_display=(node_tags_attr.filter(t=>tags_from_grp_to_display.includes(t)).length>0)?to_display:false

    }
  })
  return to_display
}

// Check if incoming and/or outgoing links have all 0 for value, if that the case we we returne false
// We can short-circuit the function if the variable null_flux is true or the variable is show_structur is 'structure' (doesn't care about links value)
export const has_links_zero=(data:SankeyData,node:SankeyNode)=>{
  if((node.outputLinksId.length==0 && node.inputLinksId.length==0)|| data.display_style.null_flux || data.show_structure == 'structure'){
    return true
  }else{
    let total_input = 0
    if (node.inputLinksId.length > 0) {
      for (let i = 0; i < node.inputLinksId.length; i++) {
        const link = data.links[node.inputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          return ''
        }
        if (data.nodes[link.idSource]  && data.nodes[link.idTarget]) {
          const val = getLinkValue(data, link.idLink)
          if (val.extension?.free_visible) {
            total_input +=1
            continue
          }
          if (val && val.value!=undefined) {
            total_input += val.value
          } else {
            console.log('val is undefined')
          }
        }
      }
    }
    let total_output = 0
    if (node.outputLinksId.length > 0) {
      for (let i = 0; i < node.outputLinksId.length; i++) {
        const link = data.links[node.outputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          return ''
        }
        if (data.nodes[link.idSource] && data.nodes[link.idTarget]) {
          const val = getLinkValue(data, link.idLink)
          if (val.extension?.free_visible) {
            total_input +=1
            continue
          }
          if (val && val.value!=undefined ) {
            total_output += val.value
          } else {
            console.log('val is undefined')
          }
        }
      }
    }
    return (total_input + total_output) !== 0
  }
}
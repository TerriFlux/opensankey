import { SankeyData, SankeyLink, SankeyLinkValue, SankeyLinkValueDict, SankeyNode, TagsGroup,SankeyNodeAttrLocal,SankeyNodeStyle,SankeyLinkAttrLocal,SankeyLinkStyle, TagsCatalog } from './types'
import FileSaver from 'file-saver'
import { complete_sankey_data } from './SankeyConvert'
import {  compute_auto_sankey,compute_default_input_outputLinksId,agregation,desagregation} from './SankeyLayout'
import * as d3 from 'd3'
import colormap from 'colormap'
import { menu_config_width } from './SankeyMenu'

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
      v[listKey[i]] = {
        value: v.value as unknown as number,
        display_value: v.display_value as unknown as string,
        tags: {},
        extension: {}
      }
    } else {
      if ( v[listKey[i]] === undefined ) {
        (v[listKey[i]] as SankeyLinkValueDict) = {}
      }
      addDataTags(dataTags, v[listKey[i]] as unknown as {[key:string] : SankeyLinkValue}, depth + 1)
    }
  }
}


export const cut_name = (t: string, n: number) => {
  return (t && t.length > n) ? t.slice(0, n) + '...' : t
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

      extension: {}
    }
  }

  for (const i in listKey) {
    if (up && +i === (listKey.length - 1)) {
      break
    }
    val = val[listKey[i]]
    if (val === undefined) {
      return {
        value: 0,
        display_value: '',
        tags: {},
        extension: {}
      }
    }
  }
  return (val as unknown) as SankeyLinkValue
}

/**
 * Outputs max value from a given link dict.
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
  // If input does not exist or does not contain any info, return
  if (value_dict === undefined || Object.values(value_dict).length === 0) {
    return new_max_node_value
  }
  // We need a recurrence here, because values are at the bottom of nested dicts (datatags)
  // Such as :
  // 'value': {
  //   'value': {
  //     ... {
  //           'value': float
  //           ... }
  //     ... }
  //   ... }
  const child = Object.values(value_dict)[0]
  if (typeof child === 'object') {
    // Each link can contain multiple values, so we loop on each dict entry
    Object.values(value_dict).forEach(v => {
      const cur_max_value = findMaxLinkValue(new_max_node_value, (v as unknown) as SankeyLinkValueDict)
      new_max_node_value = (cur_max_value > new_max_node_value) ? cur_max_value : new_max_node_value
    })
  }
  else { // If we reached the value, we can compare with ref max value
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
  display_nodes:{ [node_id: string]: SankeyNode },
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
      if (display_nodes[link.idSource] && display_nodes[link.idTarget]) {
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
        if (return_value_link(data,link,'orientation') === 'hh') {
          if (target_node_x > node_x && !return_value_link(data,link,'recycling') || target_node_x <= node_x && return_value_link(data,link,'recycling')) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (return_value_link(data,link,'orientation') === 'vv') {
          if (target_node_y > node_y) {
            bottom_flux.push(idLink)
          } else {
            top_flux.push(idLink)
          }
        } else if (return_value_link(data,link,'orientation') === 'hv') {
          if (target_node_x > node_x) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (return_value_link(data,link,'orientation') === 'vh') {
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
      if (display_nodes[link.idSource] && display_nodes[link.idTarget]) {
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
        if (return_value_link(data,link,'orientation') === 'vv') {
          if (source_node_y < node_y) {
            // flux goes down
            top_flux.push(idLink)
          } else {
            // flux goes up
            bottom_flux.push(idLink)
          }
        } else if (return_value_link(data,link,'orientation') === 'hh') {
          if (source_node_x >= node_x && return_value_link(data,link,'recycling') || source_node_x < node_x && !return_value_link(data,link,'recycling')) {
            // flux goes right
            left_flux.push(idLink)
          } else {
            // flux goes left
            right_flux.push(idLink)
          }
        } else if (return_value_link(data,link,'orientation') === 'hv') {
          if (source_node_y < node_y) {
            // flux goes right
            top_flux.push(idLink)
          } else {
            // flux goes left
            bottom_flux.push(idLink)
          }
        } else if (return_value_link(data,link,'orientation') === 'vh') {
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
  v: number,
  nb_scientific=3
) => {
  if(!isNaN(v)) {
    if (v > Math.pow(10,nb_scientific)){
      return v.toExponential(nb_scientific)
    }
    return parseFloat(v.toPrecision(nb_scientific))
  }
  return v
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

  if(isNaN(the_link_value)){
    return the_link_value
  }else{
    const nb_sign=(return_value_link(data,d,'scientific_precision') as number)
    if(nb_sign>0){
      the_link_value=parseFloat(the_link_value.toPrecision(nb_sign))
    }

    if((return_value_link(data,d,'to_precision'))){
      the_link_value =toPrecision(the_link_value,nb_sign)
    }else if (return_value_link(data,d,'custom_digit')){
      the_link_value =(the_link_value as number).toFixed((return_value_link(data,d,'nb_digit') as number))
    }
    const unit=return_value_link(data,d,'label_unit_visible')?return_value_link(data,d,'label_unit'):''
    return the_link_value+unit
  }
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
  // Récupère la liste des tags selectionné pour chaque dataTags ayant au moins un groupe tag

  for (const i in listKey) {
    if ( val === undefined) {
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
  if ( data.minimum_flux && ((val as unknown) as SankeyLinkValue).value < data.minimum_flux) {
    return data.minimum_flux
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
    linkZIndex:[],

    h_space: 200,
    v_space: 50,

    show_structure: 'reconciled',
    fit_screen: window.SankeyToolsStatic,

    left_shift: 0,
    right_shift: 1,
    display_style: {
      filter: 0,
      filter_label: 0,
      null_flux: false,
      font_family: ['Arial,sans-serif','Helvetica,sans-serif','Verdana,sans-serif','Calibri,sans-serif','Noto,sans-serif','Lucida Sans,sans-serif','Gill Sans,sans-serif','Century Gothic,sans-serif','Candara,sans-serif','Futara,sans-serif','Franklin Gothic Medium,sans-serif','Trebuchet MS,sans-serif','Geneva,sans-serif','Segoe UI,sans-serif','Optima,sans-serif','Avanta Garde,sans-serif',
        'Times New Roman,serif','Big Caslon,serif','Bodoni MT,serif','Book Antiqua,serif','Bookman,serif','New Century Schoolbook,serif','Calisto MT,serif','Cambria,serif','Didot,serif','Garamond,serif','Georgia,serif','Goudy Old Style,serif','Hoefler Text,serif','Lucida Bright,serif','Palatino,serif','Perpetua,serif','Rockwell,serif','Rockwell Extra Bold,serif','Baskerville,serif',
        'Consolas,monospace','Courier,monospace','Courier New,monospace','Lucida Console,monospace','Lucidatypewriter,monospace','Lucida Sans Typewriter,monospace','Monaco,monospace','Andale Mono,monospace',
        'Comic Sans,cursive','Comic Sans MS,cursive','Apple Chancery,cursive','Zapf Chancery,cursive','Bradley Hand,cursive','Brush Script MT,cursive','Brush Script Std,cursive','Snell Roundhan,cursive','URW Chancery,cursive','Coronet script,cursive','Florence,cursive','Parkavenue,cursive'
      ],
    },
    grid_square_size: 50,
    grid_visible: true,


    nodeTags: {},
    dataTags: {},
    fluxTags: {},
    levelTags: {},

    colorMap: 'no_colormap',

    legend_width:180,
    legend_position: [0,0],
    mask_legend:false,
    display_legend_scale:false,
    legend_police:16,
    node_label_separator:' - '

  }
  const default_data = {
    ...data,
    style_node: { 'default' : default_node_style() },
    style_link: { 'default' : default_link_style() }
  }
  return (default_data as unknown as SankeyData)
}
/**
 * Return the color of the link wich depend of the groupTag selected and the color attribued to the link
 *
 * @param {SankeyLink} l
 * @param {SankeyData} data
 * @returns {*}
 */
export const link_color = (l: SankeyLink,data:SankeyData,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  let colorLink

  if(Object.keys(data.dataTags).map(d=>'dataTags_'+d).includes(data.colorMap)){
    const idDt=l.idLink.split('_')
    const colorMapFilterd=data.colorMap.slice(9,data.colorMap.length)
    const ind_str=(idDt.length>1)?idDt.slice(idDt.length-1,idDt.length)[0]:0

    const ind=Number(ind_str)
    // Sélectionne les tags du dataTag le plus imbirqué (Le dernier de la liste des dataTags)
    const tagsOfDT=data.dataTags[colorMapFilterd].tags
    colorLink=Object.values(tagsOfDT).filter(d=>d.selected)[ind].color
    return colorLink
  }



  if (l.colorTag) {
    const tagGroup = l.colorTag
    const v = getLinkValue(data, l.idLink)
    if (v === undefined) {
      return return_value_link(data,l,'color')
    }

    if (tagGroup in data.fluxTags && v.tags[tagGroup] && v.tags[tagGroup].filter(tag=>tag in data.fluxTags[tagGroup].tags).length > 0) {
      colorLink = data.fluxTags[tagGroup].tags[v.tags[tagGroup].filter(
        tag=>tag in data.fluxTags[tagGroup].tags
      )[0]].color
      return colorLink
    }
  }

  const source_node = data.nodes[l.idSource]
  const target_node = data.nodes[l.idTarget]
  let selected_tag = ''
  if (source_node.colorParameter !== 'local' && target_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && target_node.colorTag in target_node.tags) {
    const common_tags = source_node.tags[source_node.colorTag].filter(value => target_node.tags[target_node.colorTag].includes(value))
    if (common_tags.length > 0 && common_tags[0] in data.nodeTags[source_node.colorTag].tags) {
      return data.nodeTags[source_node.colorTag].tags[common_tags[0]].color
    }
  }
  if (l.local && l.local.color && l.local.color !== '#808080' && l.local.color !== default_link_style().color) {
    return return_value_link(data,l,'color')
  }

  if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit' && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
    selected_tag = source_node.tags[source_node.colorTag][0]
    if (selected_tag in data.nodeTags[source_node.colorTag].tags) {
      return data.nodeTags[source_node.colorTag].tags[selected_tag].color
    }
  } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit' && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
    selected_tag = target_node.tags[target_node.colorTag][0]
    if (selected_tag in data.nodeTags[target_node.colorTag].tags) {
      return data.nodeTags[target_node.colorTag].tags[selected_tag].color
    }
  } else if ((!source_node.tags['Type de noeud'] || (source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] !== 'produit')) && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
    selected_tag = source_node.tags[source_node.colorTag][0]
    if (selected_tag in data.nodeTags[source_node.colorTag].tags) {
      return data.nodeTags[source_node.colorTag].tags[selected_tag].color
    }
  } else if ((!target_node.tags['Type de noeud'] || (target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] !== 'produit')) && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
    selected_tag = target_node.tags[target_node.colorTag][0]
    if (data.nodeTags[target_node.colorTag].tags[selected_tag]) {
      return data.nodeTags[target_node.colorTag].tags[selected_tag].color
    }
  } else if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit') {
    return return_value_node(data,source_node,'color') as string
  } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit') {
    return return_value_node(data,target_node,'color') as string
  }
  return node_color(data.nodes[l.idSource],data)
}


/**
 * Test if the link is visible
 * it do so by testing the value of the link with parameter selected for the sankey (exemple if the link doesn't have a tag displayed by the sanke, it return false)
 * if one of the source or target node is a not visible, it return false
 * if it value is inferior to the link threshold then it return false
 *
 * @param {SankeyLink} l
 * @param {SankeyData} data
 * @returns {boolean}
 */
export const link_visible = (l: SankeyLink, data: SankeyData,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue
) => {
  const { dataTags, fluxTags } = data
  if (!l) {
    return false
  }
  if (data.show_structure === 'structure') {
    if (data.nodes[l.idSource].position === 'relative' || data.nodes[l.idTarget].position === 'relative') {
      return false
    }
  }
  if (!data.nodes[l.idSource] || !node_displayed(data,data.nodes[l.idSource]) || !data.nodes[l.idTarget] || !node_displayed(data,data.nodes[l.idTarget])) {
    return false
  }
  let val = ((l.value as unknown) as { [key: string]: SankeyLinkValueDict })
  const listKey = [] as string[]
  let missing_key = false
  const idDt=l.idLink.split('_')
  idDt.splice(0,1)
  const defaultInd=Object.values(data.dataTags)
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
  Object.keys(data.fluxTags).forEach(tag_group => {
    const v_tags = v.tags[tag_group]
    if (!v_tags) {
      return
    }
    const selected_tags = v_tags.filter(tag=>tag in fluxTags[tag_group].tags)
    if (v_tags.length > 0 && selected_tags.length>0  && selected_tags.filter(selected_tag => fluxTags[tag_group].tags[selected_tag].selected).length == 0) {
      visible = false
    }
  })
  if (!visible) {
    return false
  }
  const link_values = getLinkValue(data,l.idLink)
  const is_free = link_values.extension?.free_mini !== undefined &&
                  data.show_structure !== 'free_interval' &&
                  data.show_structure !== 'free_value' &&
                  !link_values.extension?.free_visible
  if (link_values.extension?.free_visible) {
    return true
  }
  if (!is_free && test_link_value(data, data.nodes, l,getLinkValue) === 0) {
    if (data.display_style.null_flux) {
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
    name: 'default',
    idNode: 'default',

    colorParameter: 'local',
    position: 'absolute',
    x: 100,
    y: 100,
    inputLinksId: [],
    outputLinksId: [],
    tags: {},
    colorTag: '',
    dimensions: {},
    style: 'default',

  }
  for (const tag_group_key in data.nodeTags) {
    defaultNode.tags[tag_group_key]  = []
  }
  return defaultNode
}
// Return default style configuration for node
export const default_node_style=()=>{
  return {
    idNode:'default',
    name:'Style par défaut',
    shape: 'rect',
    shape_visible: true,
    label_visible: true,
    node_width: 40,
    node_height: 40,
    color: '#a9a9a9',
    colorSustainable:false,
    not_to_scale:false,
    not_to_scale_direction:'right',

    font_family: 'Cormorant',
    font_size: 14,
    uppercase: false,
    bold: false,
    italic: false,
    label_vert: 'bottom',
    label_horiz: 'middle',
    label_background:false,

    show_value: false,
    label_vert_valeur: 'top',
    label_horiz_valeur: 'middle',
    value_font_size:14,
    label_box_width: 110,
    label_color:false,

  }
}
// Return default style configuration for link
export const default_link_style=()=>{
  return {
    idLink:'default',
    name:'Style par défaut',
    color: '#a9a9a9',
    recycling:false,
    curved: true,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    label_font_size:20,
    orientation: 'hh',
    left_horiz_shift: 0.05,
    right_horiz_shift: 0.95,
    vert_shift: 0,
    opacity:0.85,
    to_precision:false,
    scientific_precision:5,
    arrow_size:10,
    font_family: 'Arial,serif',
    label_unit_visible:false,
    label_unit:'',
    custom_digit:false,
    nb_digit:0,

  }
}

/**
 *
 * @param {SankeyData} data
 * @param {string[]} l
 * @returns {*}
 */
const create_object = (data: SankeyData, l: string[]) => {
  const { dataTags,fluxTags } = data
  if (l.length == 0) {
    const obj = Object.create({})
    obj['value'] = ''
    obj['display_value'] = ''
    obj['tags'] = {}
    obj['extension'] = {}
    Object.entries(fluxTags).forEach(ft=>{
      obj.tags[ft[0]]=[]
    })
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

    colorTag: '',
    style:'default',
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

/**
 * Download examples from server
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
export const processExample = (server_data: SankeyData,updateLayout:(data: SankeyData,new_layout: SankeyData,mode:string[],synchronize:boolean)=>void,
  convert_data:(d:SankeyData)=>void,

) => {
  const data = default_sankey_data()
  Object.assign(data, server_data)
  complete_sankey_data(data,default_sankey_data,default_node,default_link)
  convert_data(data)
  if ( (data as SankeyData & layout_type).layout === undefined) {
    compute_auto_sankey(data, data.h_space ? data.h_space : 200)
  } else {
    convert_data((data as SankeyData & layout_type).layout)
    complete_sankey_data((data as SankeyData & layout_type).layout,default_sankey_data,default_node,default_link)
    compute_default_input_outputLinksId(data.nodes, data.links)
    const data_layout = JSON.parse(JSON.stringify((data as SankeyData & { layout?: SankeyData }).layout)) as SankeyData
    delete (data as SankeyData & { layout?: SankeyData }).layout
    updateLayout(data, data_layout,['posNode','posFlux','attrNode','attrFlux','tagNode','tagFlux','tagData','attrGeneral','freeLabels','Views'],true)
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
  convert_data:(d:SankeyData)=>void
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

  fetch(url, fetchData).then((response) => {
    response.text().then((text) => {
      const server_data = JSON.parse(text)
      const error = server_data['error']
      if (error && error.length != 0) {
        alert(error)
        return
      }

      if (!file_name.includes('.xlsx')) {
        reinitialization()
        complete_sankey_data(server_data,default_sankey_data,default_node,default_link)
        convert_data(server_data)
        set_data({ ...server_data})
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
        colorNode=(return_value_node(data,n,'colorSustainable'))? return_value_node(data,n,'color'):colorNode
      } else if (n.tags[tagGroup].length == 1 ) {
        if (data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]]) {
          colorNode = data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]].color
        } else {
          colorNode = 'grey'
          colorNode=(return_value_node(data,n,'colorSustainable'))? return_value_node(data,n,'color'):colorNode
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
    colorNode = return_value_node(data,n,'color')
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
    size_menu=menu_config_width
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
    d3.select(' .opensankey #svg #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+(1/((scale<1)?scale:1))+')')
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
interface DataSuiteType{
  is_catalog?:boolean,
  view?:{id: string,view_data: object,nom:string,details:string}[],
} 

export const clickSaveDiagram = (data:SankeyData,name='sankey_diagram') => {
  const data_to_save = { ...data }
  const str_data = JSON.stringify(data_to_save)

  const blob = new Blob([str_data], { type: 'text/plain;charset=utf-8' })
  const dataAsSuite=(data as DataSuiteType)
  if(dataAsSuite.view && dataAsSuite.view.length>0 && !dataAsSuite.is_catalog){
    name='Diagramme de Sankey avec vues'
  }else if(dataAsSuite.is_catalog===true){
    name='Catalogue de vues de diagrammes de Sankey'
  }else{
    name='Diagramme de Sankey'
  }
  FileSaver.saveAs(blob, name+'.json')
}

export const add_tag=(data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string)=>{
  const elementTagName = type_tag_name
  // Méthode pour incrementer idElement
  let idElement = Object.keys(data[elementTagName][tags_group_key].tags).length
  while (data[elementTagName][tags_group_key].tags['element' + idElement]) {
    idElement = idElement+1
  }
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

// Return the value of an attribute from node :
// - If the node has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the node has (a node always has a style )
export const return_value_node=(data:SankeyData,n:SankeyNode,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle)=>{
  let value=return_local_node_value(n,k as keyof SankeyNodeAttrLocal)
  if(value === undefined || value === null){
    const ks=k as keyof SankeyNodeStyle
    value= n.style in data.style_node ? data.style_node[n.style][ks] : data.style_node['default'][ks]
  }
  return value
}

// Get the variable value of an attribut from style
export const get_node_attribute_value_from_style=(data:SankeyData,n:SankeyNodeStyle,k:keyof SankeyNodeStyle)=>{
  return data.style_node[n.idNode][k]
}

// Return value of local node variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const return_local_node_value=(n:SankeyNode,key:keyof SankeyNodeAttrLocal)=>{
  if(n.local==undefined){
    return undefined
  }else{
    return n.local[key]
  }
}

// Check if all value of the attribute "k" is the same in the selected nodes (or selected style)
// If the value come from local attribute or the style of the node does'nt matter, we look only the value
export const is_all_node_attr_same_value=(data:SankeyData,m_s_n:SankeyNode[]|SankeyNodeStyle[],k:keyof SankeyNodeAttrLocal,menu_for_style:boolean)=>{
  if(m_s_n.length==0){
    return null
  }
  const first_value=return_correct_node_attribute_value(data,m_s_n[0],k,menu_for_style)
  let all_same=true
  m_s_n.forEach(n=>{
    all_same=return_correct_node_attribute_value(data,n,k,menu_for_style)!==first_value?false:all_same
  })
  return (all_same?first_value:0)
}

// Check if the value used is the local one or the one that come from the style
export const is_node_diplaying_value_local=(m_s_n:{current:SankeyNode[]},k:keyof SankeyNodeAttrLocal,menu_for_style:boolean)=>{
  if(menu_for_style){
    return false
  }
  let is_local=false
  m_s_n.current.forEach(n=>{
    if(n.local && Object.keys(n.local).includes(k)){
      is_local=true
    }
  })
  return is_local

}

// Assign the value to the corresponding variable (in the style or in the variable local of node)
export const assign_node_value_to_correct_var=(n:SankeyNode|SankeyNodeStyle,k:keyof SankeyNodeAttrLocal,v:boolean|string|number,menu_for_style:boolean)=>{
  const nn=(n as SankeyNode)
  const ns=(n as SankeyNodeStyle)
  const ks=(k as keyof SankeyNodeStyle)
  const kl=(k as keyof SankeyNodeAttrLocal);
  (menu_for_style)?assign_node_style_attribute(ns,ks,v):assign_node_local_attribute(nn,kl,v)
}
// Return the value to the corresponding variable (in the style or in the variable local of node)
export const return_correct_node_attribute_value=(data:SankeyData,n:SankeyNode|SankeyNodeStyle,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle,menu_for_style:boolean)=>{
  const ks=(k as keyof SankeyNodeStyle)
  const kl=(k as keyof SankeyNodeAttrLocal)
  const nn=(n as SankeyNode)
  const ns=(n as SankeyNodeStyle)
  return (menu_for_style)?get_node_attribute_value_from_style(data,ns,ks):return_value_node(data,nn,kl)
}

// Assign the value to local attribute (create local attribute if it doesn't exist and "k" attribute if it doesn't either)
export const assign_node_local_attribute=(n:SankeyNode,k:keyof SankeyNodeAttrLocal,v:boolean|string|number)=>{
  if(n.local === undefined || n.local === null){
    n.local={} as SankeyNodeAttrLocal
  }
  Object.assign(n.local,{[k.toString()]:v})
}
// Assign the value to attribute of node style "n"
export const assign_node_style_attribute=(n:SankeyNodeStyle,k:keyof SankeyNodeStyle,v:boolean|string|number)=>{
  (n[k] as unknown)=v
}


//

/**
 * The node is displayed if the tags attribued are also selected
 * and either it has the general aggregation level selected or
 * it can have a local aggregation level selected that
 * doesn't require the verify the general level selected
 *
 * @param {SankeyData} data Data structure for Sankey
 * @param {SankeyNode} node Node to check
 * @param {boolean} skip_link_zero
 */
export const node_displayed=(
  data:SankeyData,
  node:SankeyNode,
  skip_link_zero=false
)=>{
  const has_local_level=return_local_node_value(node,'local_aggregation') as boolean | undefined
  let local_level=node_has_displayed_level(data,node)
  if(has_local_level!==undefined && has_local_level!==null){
    local_level=has_local_level
  }
  return node_has_displayed_tags(data,node) && ( local_level ) && ( skip_link_zero || has_links_zero(data,node))
}

export const node_has_displayed_tags=(data:SankeyData,n:SankeyNode)=>{
  let to_display=true

  Object.entries(data.nodeTags).filter(nt=> nt[0] !== 'Type de noeud' && Object.keys(n.tags).includes(nt[0])).forEach(nt=>{
    // Check tags from the group attribued to the node
    // If the node don't have tag attribued from the group then it is not affected by filter and we display it
    const node_tags_attr=n.tags[nt[0]]

    if(node_tags_attr.length!=0){
      // If the node has at least 1 tag from the selected tag of the group then we display it
      // If the node has tag from the group attribued to it but are not selected then we don't display it

      const tags_from_grp_to_display=Object.entries(nt[1].tags).filter(t=>t[1].selected).map(t=>t[0])
      to_display=(node_tags_attr.filter(t=>tags_from_grp_to_display.includes(t)).length>0)?to_display:false

    }
  })
  return to_display
}

export const node_has_displayed_level=(data:SankeyData,n:SankeyNode)=>{
  let to_display=true
  // Check if there is other aggregation tags than 'Primaire',
  const multi_level=Object.entries(data.levelTags).filter(nt=> nt[0]!=='Primaire').map(nt=>nt[0]).length>0

  const only_one_activated= Object.entries(data.levelTags).filter(nt=> nt[1].activated).length==1
  const only_primaire_activated= Object.entries(data.levelTags).filter(nt=> nt[1].activated).map(nt=>nt[0])[0]=='Primaire'

  const multy_but_only_primaire=multi_level && only_one_activated && only_primaire_activated

  // To display a node according to level tag we search if:
  // - The node grp tag banner is 'level'
  // - The node.nodeTags have more level grp tag than 'Primaire', if that's the case we don't use grp tag 'Primaire' in the filter of node grp tag
  // - The node grp tag is activated (variable is set false if we activate another grp tag that has this grp tag in variable sibling)
  // - The node has the grp tag name in his tags
  Object.entries(data.levelTags).filter(nt=>((multi_level && !multy_but_only_primaire)?nt[0]!=='Primaire':true) && nt[1].activated && Object.keys(n.tags).includes(nt[0])).forEach(nt=>{
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
        if (!node_displayed(data,data.nodes[link.idSource],true) || !node_displayed(data,data.nodes[link.idTarget],true)) {
          continue
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
        if (!node_displayed(data,data.nodes[link.idSource],true) || !node_displayed(data,data.nodes[link.idTarget],true)) {
          continue
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



// Return the value of an attribute from link :
// - If the link has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the link has (a link always has a style )
export const return_value_link=(data:SankeyData,l:SankeyLink,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle)=>{
  let value=return_local_link_value(l,k as keyof SankeyLinkAttrLocal)
  if(value === undefined || value === null){
    const ks=k as keyof SankeyLinkStyle
    value= l.style in data.style_link ? data.style_link[l.style][ks] : data.style_link['default'][ks]
  }
  return value
}

// Get the variable value of an attribut from style
export const get_link_attribute_value_from_style=(data:SankeyData,l:SankeyLinkStyle,k:keyof SankeyLinkStyle)=>{
  return data.style_link[l.idLink][k]
}

// Return value of local link variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const return_local_link_value=(l:SankeyLink,key:keyof SankeyLinkAttrLocal)=>{
  if (l===undefined) {
    return undefined
  }
  if(l.local===undefined || l.local===null){
    return undefined
  }else{
    return l.local[key]
  }
}

// Check if all value of the attribute "k" is the same in the selected links (or selected style)
// If the value come from local attribute or the style of the link does'nt matter, we look only the value
export const is_all_link_attr_same_value=(data:SankeyData,m_s_l:SankeyLink[]|SankeyLinkStyle[],k:keyof SankeyLinkAttrLocal,menu_for_style:boolean)=>{
  if(m_s_l.length==0){
    return null
  }
  const first_value=return_correct_link_attribute_value(data,m_s_l[0],k,menu_for_style)
  let all_same=true
  m_s_l.forEach(l=>{
    all_same=return_correct_link_attribute_value(data,l,k,menu_for_style)!==first_value?false:all_same
  })
  return (all_same?first_value:0)
}

// Check if the value used is the local one or the one that come from the style
export const is_link_diplaying_value_local=(m_s_l:{current:SankeyLink[]},k:keyof SankeyLinkAttrLocal,menu_for_style:boolean)=>{
  if(menu_for_style){
    return false
  }
  let is_local=false
  m_s_l.current.forEach(l=>{
    if(l.local && Object.keys(l.local).includes(k)){
      is_local=true
    }
  })
  return is_local

}

// Assign the value to the corresponding variable (in the style or in the variable local of link)
export const assign_link_value_to_correct_var=(l:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal,v:boolean|string|number,menu_for_style:boolean)=>{
  const nn=(l as SankeyLink)
  const ns=(l as SankeyLinkStyle)
  const ks=(k as keyof SankeyLinkStyle)
  const kl=(k as keyof SankeyLinkAttrLocal);
  (menu_for_style)?assign_link_style_attribute(ns,ks,v):assign_link_local_attribute(nn,kl,v)
}
// Return the value to the corresponding variable (in the style or in the variable local of link)
export const return_correct_link_attribute_value=(data:SankeyData,l:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle,menu_for_style:boolean)=>{
  const ks=(k as keyof SankeyLinkStyle)
  const kl=(k as keyof SankeyLinkAttrLocal)
  const nn=(l as SankeyLink)
  const ns=(l as SankeyLinkStyle)
  return (menu_for_style)?get_link_attribute_value_from_style(data,ns,ks):return_value_link(data,nn,kl)
}

// Assign the value to local attribute (create local attribute if it doesn't exist and "k" attribute if it doesn't either)
export const assign_link_local_attribute=(l:SankeyLink,k:keyof SankeyLinkAttrLocal,v:boolean|string|number)=>{
  if(l.local === undefined || l.local === null){
    l.local={} as SankeyLinkAttrLocal
  }
  Object.assign(l.local,{[k.toString()]:v})
}
// Assign the value to attribute of link style "l"
export const assign_link_style_attribute=(l:SankeyLinkStyle,k:keyof SankeyLinkStyle,v:boolean|string|number)=>{
  (l[k] as unknown)=v
}
export const node_context_has_aggregate=(n:SankeyNode,data:SankeyData)=>{
  if (!n.dimensions) {
    return false
  }

  const parent_names: string[] = []
  const dim_names: string[] = []
  Object.keys(n.dimensions).forEach(
    dim => {
      if (dim === 'Primaire') {
        if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          parent_names.push(n.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n.dimensions[dim].parent_name) {
        parent_names.push(n.dimensions[dim].parent_name as string)
        dim_names.push(dim)
      }
    }
  )

  if (parent_names.length > 0) {
    return true
  } else {
    return false
  }

}
export const aggregate=(n:SankeyNode,data:SankeyData,set_agregation_node:(s:string)=>void,set_is_agregation:(b:boolean)=>void,set_show_agregation:(b:boolean)=>void)=>{
  const parent_names: string[] = []
  const dim_names: string[] = []
  Object.keys(n.dimensions).forEach(
    dim => {
      if (dim === 'Primaire') {
        if (data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          parent_names.push(n.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n.dimensions[dim].parent_name) {
        parent_names.push(n.dimensions[dim].parent_name as string)
        dim_names.push(dim)
      }
    }
  )
  if (parent_names.length === 0) {
    return
  }
  if (parent_names.length > 1) {
    set_agregation_node(n.idNode)
    set_is_agregation(true)
    set_show_agregation(true)
  } else {
    agregation(data, n.idNode, dim_names[0])
  }

}

export const desaggregate=(n:SankeyNode,data:SankeyData,set_agregation_node:(s:string)=>void,set_is_agregation:(b:boolean)=>void,set_show_agregation:(b:boolean)=>void)=>{
  const child_names: string[] = []
  const dim_names: string[] = []
  Object.values(data.nodes).forEach(n2 => {
    for (const dim in n2.dimensions) {
      if ( dim === 'Primaire') {
        if ( data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n2.dimensions[dim].parent_name == n.idNode) {
        if (dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      }
    }
    return false
  })
  if (child_names.length === 0) {
    return
  }
  if (child_names.length > 1) {
    set_agregation_node(n.idNode)
    set_is_agregation(false)
    set_show_agregation(true)
  } else {
    desagregation(data, n.idNode, dim_names[0])
  }

}

export const node_context_has_desaggregate=(n:SankeyNode,data:SankeyData)=>{
  if (!n.dimensions) {
    return false
  }

  const child_names: string[] = []
  const dim_names: string[] = []
  Object.values(data.nodes).forEach(n2 => {
    for (const dim in n2.dimensions) {
      if ( dim === 'Primaire') {
        if ( data.levelTags['Primaire'].activated && dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      } else if (!data.levelTags['Primaire'].activated && n2.dimensions[dim].parent_name == n.idNode) {
        if (dim_names.indexOf(dim) === -1) {
          child_names.push(n2.idNode)
          dim_names.push(dim)
        }
      }
    }
    return false
  })

  if (child_names.length > 0) {
    return true
  } else {
    return false
  }

}

export const apply_style_to_nodes = (data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}) => {
  multi_selected_nodes.current.map(d => {
    // Delete local value so the used value come from the style
    delete d.local
  })
  set_data({ ...data })
}

export const add_new_node = (data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}) => {
  const { nodes } = data
  const node: SankeyNode = default_node(data)

  // Méthode pour incrementer idNode
  let idNode = Object.keys(data.nodes).length
  while (data.nodes['node'+idNode]) {
    idNode = idNode+1
  }
  node.idNode = 'node' + idNode
  node.name = node.idNode
  if (Object.keys(nodes).length < 5) {
    node.x = Object.keys(nodes).length * 200 + 200
  } else {
    node.x = 200
  }
  nodes[node.idNode] = node
  for (const tag_group_key in data.nodeTags) {
    node.tags[tag_group_key] = []
  }
  //WARNING : le set_multi_select ne semble pas changer les noeuds sélectionnés avant d'appliquer le style
  multi_selected_nodes.current = [node]
  apply_style_to_nodes(data,set_data,multi_selected_nodes)
  set_data({...data})
}

// Recursive function to create multiple copy of a link,according to the number of dataTags selected, to display the different value of a same link
export const recursionDataTag=(data:SankeyData,DT:TagsCatalog,ind:number,suffix:string,link_to_copy:SankeyLink,new_links:{ [link_id: string]: SankeyLink })=>{
  const DT_l=Object.values(DT).length
  Object.values((Object.values(DT)[ind] as {group_name:string,show_legend:boolean,color_map:string,tags:Record<string,unknown>}).tags)
    .filter(t=>(t  as {selected:boolean}).selected).forEach((d,i)=>{
      const n_suffix= suffix+'_'+i
      // Depth search of group_dataTag, if it the deepest, a link is created with a specific id to retrieve the right value of the link in getLinkValue
      // (Deepest= last group_dataTag )
      if(ind==DT_l-1){
        const n_l=JSON.parse(JSON.stringify(link_to_copy))
        n_l.idLink=n_l.idLink+n_suffix
        new_links[n_l.idLink]=n_l

        //Ajoute dans les noeuds source/target les id de flux
        const ind_in_src=data.nodes[link_to_copy.idSource].outputLinksId.indexOf(link_to_copy.idLink)
        if(ind_in_src>=0){
          data.nodes[link_to_copy.idSource].outputLinksId.splice(ind_in_src,1)
        }
        const ind_in_trgt=data.nodes[link_to_copy.idTarget].inputLinksId.indexOf(link_to_copy.idLink)
        if(ind_in_trgt>=0){
          data.nodes[link_to_copy.idTarget].inputLinksId.splice(ind_in_trgt,1)
        }
        data.nodes[link_to_copy.idSource].outputLinksId.push(n_l.idLink)
        data.nodes[link_to_copy.idTarget].inputLinksId.push(n_l.idLink)
      }
      else {
        recursionDataTag(data,DT,ind+1,n_suffix,link_to_copy,new_links)
      }

    })
}
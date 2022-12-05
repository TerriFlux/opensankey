import { SankeyData, SankeyLink, SankeyLinkValue, SankeyLinkValueDict, SankeyNode, TagsGroup } from './types'
import FileSaver from 'file-saver'
import { convert_data } from './SankeyConvert'
import { agregation, compute_auto_sankey, desagregation, updateLayout } from './SankeyLayout'
import * as d3 from 'd3'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const addDataTags = (
  dataTags: TagsGroup[],
  v: {[key:string] : SankeyLinkValue},
  depth: number
) => {
  const dataTag = Object.values(dataTags)[depth]
  const listKey = Object.keys(dataTag.tags)
  for (const i in listKey) {
    if (depth === dataTags.length - 1) {
      v[listKey[i]] = {
        value: v.value as unknown as number,
        display_value: v.display_value as unknown as string,
        tags: {},
        extension: {}
      }
    } else {
      addDataTags(dataTags, v[listKey[i]] as unknown as {[key:string] : SankeyLinkValue}, depth + 1)
    }
  }
}

// Getter pour récupérer la valeur du link
// utile pour pouvoir ensuite gérer les dataTag
export const getLinkValue = (
  data: SankeyData,
  idLink: string,
  up = false
) => {
  const { links, dataTags } = data
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
  Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).map(dataTag => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[0][0])
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
      console.log(listKey[i] + ' not in val')
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

export const getTotalLinks = (
  data: SankeyData,
  Links: string[],
) => {
  let total = 0
  Links.forEach(element => {
    // On vérifie que le lien est affiché, cad que le noeud source et le noeud target sont
    if (data.nodes[data.links[element].idSource].node_visible && data.nodes[data.links[element].idTarget].node_visible) {
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
  test_link_value: (data:SankeyData, node: { [node_id: string]: SankeyNode }, d: SankeyLink, selected_tags: { [tag_group: string]: string[] }) => string,
  ref_link: SankeyLink | undefined = undefined
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
      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
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
      if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
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
      const v = test_link_value(data, nodes, links[the_id], selected_tags)

      if (v === undefined || v=='') {
        return
      }
      offset_width_top += ((+v==0)||+v>inv_scale(2))?+v:(inv_scale(2))
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
      const v = test_link_value(data, nodes, links[the_id], selected_tags)
      if (v === undefined) {
        return
      }
      offset_width_bottom += ((+v==0)||+v>inv_scale(2))?+v:(inv_scale(2))
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
      const v = test_link_value(data, nodes, links[the_id], selected_tags)
      if (v === undefined) {
        return
      }
      offset_height_left += ((+v==0)||+v>inv_scale(2))?+v:(inv_scale(2))
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
      const v = test_link_value(data, nodes, links[the_id], selected_tags)
      if (v === undefined) {
        return
      }
      offset_height_right += ((+v==0)||+v>inv_scale(2))?+v:(inv_scale(2))
    }
  )

  return [offset_height_left, offset_height_right, offset_width_top, offset_width_bottom]
}

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

export const link_text = (
  data: SankeyData,
  d: SankeyLink,
  link_value: number
) => {
  let the_link_value = getLinkValue(data, d.idLink).value
  const str_display = String(getLinkValue(data, d.idLink).display_value)
  if (str_display !== '' && str_display!=='*') {
    return str_display
  }
  if (data.show_structure) {
    return
  }
  if (data.show_data ) {
    const link_value = getLinkValue(data, d.idLink)
    if ((link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return (link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value 
    } else {
      return
    }
  }
  the_link_value = toPrecision(the_link_value)
  return the_link_value
}

export const test_link_value = (data:SankeyData, nodes: { [node_id: string]: SankeyNode }, d: SankeyLink) => {
  const { dataTags } = data
  if (data.show_structure) {
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, data.user_scale])
    return inv_scale(5)
  }
  if (data.show_data ) {
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

  let missing_key = false
  Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).map(dataTag => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[0][0])
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
      console.log(listKey[i] + ' not found in val')
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

export const default_sankey_data = (): SankeyData => {
  return {
    version: '0.8',

    nodes: {},
    links: {},
    user_scale: 20,

    accordeonToShow: ['MEP'],
    style_node: {
      'default': {
        name: 'par défaut',
        idNode: 'default',
        shape: 'rect',
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

    },

    style_link: {
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
        dashed:true,

        value: {},

        tooltip_text: '',

        // geometry
        x_label: 0,
        y_label: 0,

        // left_horiz_shift: 0,
        // right_horiz_shift: 0,
        // vert_shift: 0,
        vert_shift: 0,
        shift_gap: 0.1,

        curvature: 0.5,
        curved: false,
        style:''
      }
    },


    show_banner:false,
    width: window.innerWidth - 40,
    height: window.innerHeight - 40,

    h_space: 200,
    v_space: 100,
    legend_position: [0, 10],

    show_structure: false,
    show_data: true,
    fit_screen: window.SankeyToolsStatic,

    icon_catalog: {},
    labels: {},

    left_shift: 0.4,
    right_shift: 0.5,
    max_shift: 0.2,

    display_style: {
      node_font_size: 14,
      link_font_size: 14,
      sector_uppercase: true,
      sector_bold: true,
      sector_italic: false,
      product_uppercase: false,
      product_bold: false,
      product_italic: true,
      unit: false,
      filter: 0,
      filter_label: 0,
      global_curvature: 0.5,
      null_flux: false,
      font_family: ['Arial', 'Roboto', 'Cormorant', 'Cantarell'],
      node_font_family_selected: 'Cormorant',
      link_font_family_selected: 'Cormorant'
    },
    grid_square_size: 50,
    grid_visible: true,

    static_sankey: false,

    nodeTags: {},
    dataTags: {},
    fluxTags: {},

    colorMap: 'no_colormap', 

    legend_width:180,
    
    view: []
  }
}

export   const link_color = (l: SankeyLink,data_s:SankeyData) => {
  let colorNode
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
          colorNode = data_s.fluxTags[tagGroup].tags[v.tags[tagGroup]].color
        } else {
          colorNode = 'grey'
        }
      } else {
        const source_node = data_s.nodes[l.idSource]
        const target_node = data_s.nodes[l.idTarget]
        let selected_tag = ''
        if (source_node.colorParameter !== 'local' && target_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && target_node.colorTag in target_node.tags) {
          const common_tags = source_node.tags[source_node.colorTag].filter(value => target_node.tags[target_node.colorTag].includes(value))
          if (common_tags.length > 0) {
            return data_s.nodeTags[source_node.colorTag].tags[common_tags[0]].color
          }
        }
        if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'échange' && 
        source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
          selected_tag = source_node.tags[source_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[source_node.colorTag].tags) {
            return data_s.nodeTags[source_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        }
        if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'échange' && 
        target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
          selected_tag = target_node.tags[target_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[target_node.colorTag].tags) {
            return data_s.nodeTags[target_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        }
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
        } else if ((!source_node.tags['Type de noeud'] || (source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'secteur')) && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
          selected_tag = source_node.tags[source_node.colorTag][0]
          if (selected_tag in data_s.nodeTags[source_node.colorTag].tags) {
            return data_s.nodeTags[source_node.colorTag].tags[selected_tag].color
          } else {
            return l.color
          }
        } else if ((!target_node.tags['Type de noeud'] || (target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'secteur')) && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
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
      colorNode = l.color
    }
  }
  if (l.colorParameter === 'local') {
    // Le couleur est définie dans les parametres locaux du noeud
    colorNode = l.color
  }

  return colorNode
}


export const link_visible = (l: SankeyLink, data_s: SankeyData) => {
  const { dataTags, fluxTags } = data_s
  if (data_s.show_structure) {
    if (data_s.nodes[l.idSource].position === 'relative' || data_s.nodes[l.idTarget].position === 'relative') {
      return false
    }
  }
  if (!data_s.nodes[l.idSource].node_visible || !data_s.nodes[l.idTarget].node_visible) {
    return false
  }
  let val = ((l.value as unknown) as { [key: string]: SankeyLinkValueDict })
  const listKey = [] as string[]
  let missing_key = false
  Object.values(dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false }).map(dataTag => {
    const selected_tags = Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })
    if (selected_tags.length == 0 || missing_key) {
      missing_key = true
      return
    }
    listKey.push(Object.entries(dataTag.tags).filter(([, tag]) => { return tag.selected })[0][0])
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
  if (test_link_value(data_s, data_s.nodes, l) === 0) {
    if (data_s.display_style.null_flux) {
      return true
    }
    return false
  }
  return true
}

export const default_node = (
  data: SankeyData
): SankeyNode => {
  const defaultNode :  SankeyNode = {
    name: '',
    idNode: 'default',
    shape: 'rect',
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
    style: 'default',
    display_style: {
      font_family: 'Cormorant',

      font_size: data.display_style.node_font_size,
      uppercase: data.display_style.sector_uppercase,
      bold: data.display_style.sector_bold,
      italic: data.display_style.sector_italic,
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
    },
  }
  for (const tag_group_key in data.nodeTags) {
    defaultNode.tags[tag_group_key]  = []
  }
  return defaultNode
}
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
    gradient: false,
    curved: false,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    orientation: 'hh',
    left_horiz_shift: 0,
    right_horiz_shift: 0,
    vert_shift: 0,
    shift_gap: 0.1,
    colorTag: '',
    colorParameter: 'local',
    style:'default',
    dashed:true
  }
}

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


  delete data.nodes[node.idNode]
}

export const setSelectedTags = (
  sankey_data: SankeyData
) => {

  const { nodeTags } = sankey_data
  const display_nodes: SankeyNode[] = Object.values(sankey_data.nodes)

  display_nodes.forEach(node => {
    node.node_visible = node.display && true
    let break_loop = false
    let no_tag = true
    Object.keys(nodeTags).filter(tag=>nodeTags[tag].banner !== 'level').forEach(tags_group_key => {
      if (break_loop) {
        return
      }
      const tags_group = nodeTags[tags_group_key]
      if (!node.tags[tags_group_key] || node.tags[tags_group_key].length === 0) {
        // tags do not apply to node
        return
      }
      no_tag = false
      const visible = Object.keys(tags_group.tags).filter(tag_key => tags_group.tags[tag_key].selected && node.tags[tags_group_key].includes(String(tag_key))).length > 0
      if (!visible) {
        node.node_visible = false
        break_loop = true
      }
    })
    // for the labels
    if (no_tag && !node.shape_visible && !node.label_visible) {
      node.node_visible = node.display && true
    }
  })
  if (!sankey_data.show_structure) {
    hideNullFluxNodes(sankey_data)
  }
}

type layout_type = {
  layout: SankeyData
}

export const downloadExamples = (
  file_name: string,
  the_url_prefix: string,
  filetype: string
) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && the_url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
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

export const processExample = (server_data: SankeyData ) => {
  const data = default_sankey_data()
  Object.assign(data, server_data)
  convert_data(data)


  set_nodes_level(data)
  if ( (data as SankeyData & layout_type).layout === undefined) {
    compute_auto_sankey(data, data.h_space ? data.h_space : 200)
  } else {
    convert_data((data as SankeyData & layout_type).layout)
    updateLayout(data, (data as SankeyData & layout_type).layout)
    delete (data as SankeyData & { layout?: SankeyData }).layout
  }

  return data
}

export const uploadExcelImpl = (
  data: SankeyData,
  set_data: (data: SankeyData) => void,
  set_show_excel_dialog: (b: boolean) => void,
  input_file: Blob,
  the_url_prefix: string
) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && the_url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
  const url = root + 'sankey/upload_excel'
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

export const uploadExemple = (
  file_name: string,
  the_url_prefix: string,
  data: SankeyData,
  set_data: (data: SankeyData) => void
) => {
  let root = window.location.href
  if (root.includes('sankey-diagrams') && the_url_prefix !== '') {
    root = root.replace('sankey-diagrams/', '')
  }
  const url = root + 'sankey/upload_examples'
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
        Object.assign(data,server_data)
        convert_data(data)
        set_data({ ...data})
      }
    })
  })
}

export const set_nodes_level = (
  sankey_data: SankeyData
) => {

  const { nodeTags } = sankey_data
  const display_nodes: SankeyNode[] = Object.values(sankey_data.nodes)

  const levelTags = Object.keys(nodeTags).filter(key=>nodeTags[key].banner === 'level' && nodeTags[key].activated)

  display_nodes.filter(n=>n.display).forEach(n=>{
    levelTags.forEach(tags_group_key => {
      desagregation(sankey_data,n.idNode,tags_group_key,false)
      agregation(sankey_data,n.idNode,tags_group_key,false)
    })
  })

  display_nodes.forEach(node => {
    node.display = true
    node.node_visible = true
    let break_loop = false
    levelTags.forEach(tags_group_key => {
      if (break_loop) {
        return
      }
      const tags_group = nodeTags[tags_group_key]
      if (!node.tags[tags_group_key] || node.tags[tags_group_key].length === 0) {
        // tags do not apply to node
        return
      }
      const visible = Object.keys(tags_group.tags).filter(tag_key => tags_group.tags[tag_key].selected && node.tags[tags_group_key].includes(String(tag_key))).length > 0
      if (!visible) {
        node.display = false
        node.node_visible = false
        break_loop = true
      }
    })
  })
  //setSelectedTags(sankey_data)
}

export const hideNullFluxNodes = (
  sankey_data: SankeyData
) => {
  const { nodes, links } = sankey_data
  const display_nodes: SankeyNode[] = Object.values(nodes).filter(n => n.display)
  if (display_nodes.length == 0) {
    return
  }
  display_nodes.forEach(node => {
    let total_input = 0
    if (node.inputLinksId.length > 0) {
      for (let i = 0; i < node.inputLinksId.length; i++) {
        const link = links[node.inputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          return ''
        }
        if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
          const val = getLinkValue(sankey_data, link.idLink)
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
        const link = sankey_data.links[node.outputLinksId[i]]
        if (link === undefined) {
          //alert('Corruption du diagramme')
          return ''
        }
        if (nodes[link.idSource].node_visible && nodes[link.idTarget].node_visible) {
          const val = getLinkValue(sankey_data, link.idLink)
          
          if (val && val.value!=undefined ) {
            total_output += val.value
          } else {
            console.log('val is undefined')
          }
        }
      }
    }
    

    //Ne cache plus les noeuds qui ont des liens entrant/sortant à 0 
    //Voir avec julien 
    if ((node.inputLinksId.length > 0 || node.outputLinksId.length > 0) && total_input === 0 && total_output === 0 && !sankey_data.display_style.null_flux) {
      nodes[node.idNode].node_visible = false
    }
  })
}
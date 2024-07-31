import { SankeyData,
  SankeyLink,
  SankeyLinkValue,
  SankeyLinkValueDict,
  SankeyNode,
  TagsGroup,
  SankeyNodeAttrLocal,
  SankeyNodeStyle,
  SankeyLinkAttrLocal,
  SankeyLinkStyle,
  TagsCatalog,
  applicationDataType,
  applicationStateType} from '../types/Types'
import * as d3 from 'd3'
import colormap from 'colormap'
import { menu_config_width } from '../topmenus/SankeyMenuTop'
import React, { CSSProperties, FunctionComponent } from 'react'
import { FaCaretRight } from 'react-icons/fa'
import { TFunction } from 'i18next'
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  AddDataTagsFuncType, AddGroupTagFuncType, AddNewNodeFuncType, AddTagFuncType, AdjustSankeyZoneFuncType,
  ApplyStyleToNodesFuncType, AssignLinkLocalAttributeFuncType, AssignLinkStyleAttributeFuncType,
  AssignLinkValueToCorrectVarFuncType, AssignNodeLocalAttributeFuncType, AssignNodeStyleAttributeFuncType,
  AssignNodeValueToCorrectVarFuncType, ComputeTotalOffsetsFuncType,
  CreateObjectFuncType, DefaultLinkFuncType, DefaultLinkStyleFuncType, DefaultNodeFuncType, DefaultNodeProductStyleFuncStyle,
  DefaultNodeSectorStyleFuncStyle, DefaultNodeStyleFuncType, DefaultSankeyDataFuncType, DeleteLinkFuncType,
  DeleteNodeFuncType,
  FindMaxLinkValueFuncType, GetLinkAttributeValueFromStyleFuncType, GetLinkValueFuncType,
  GetNodeAttributeValueFromStyleFuncType, GetVerticalMarginForSankeyZoneFuncType, IsAllLinkAttrSameValueFuncType,
  IsAllNodeAttrSameValueFuncType, IsLinkDisplayingValueLocalFuncType, IsNodeDisplayingValueLocalFuncType,
  LinkColorFuncType, LinkTextFuncType, LinkVisibleFunctType, NodeColorFuncType, NodeContextHasAggregateFuncType,
  NodeContextHasDesaggregateFuncType, NodeDisplayedFuncType, OSTooltpFuncType, RecursionDataTagFuncType,
  ReturnCorrectLinkAttributeValueFuncType, ReturnCorrectNodeAttributeValueFuncType, ReturnLocalLinkValueFuncType,
  ReturnLocalNodeValueFuncType, ReturnValueLinkFuncType, ReturnValueNodeFuncType, SetNodeStyleToTypeNodeFuncType,
  TestLinkValueFuncType, ToPrecisionFuncType, createDefaultLinkValueForNewDataTagType} from './types/SankeyUtilsTypes'
import { DeleteGLinks } from '../draw/SankeyDrawLinks'
import { DeleteGNodes } from '../draw/SankeyDrawNodes'
import { Tooltip } from '@chakra-ui/react'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const defaultElementColor='#a9a9a9'
/**
 *
 * @param {TagsGroup[]} dataTags
 * @param {{[key:string] : SankeyLinkValue}} v
 * @param {number} depth
 */
export const AddDataTags:AddDataTagsFuncType = (
  dataTags: TagsGroup[],
  v: {[key:string] : SankeyLinkValue | SankeyLinkValueDict },
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
        value: '',
        display_value: '',
        tags: {},
        extension: {}
      }
    } else {
      if ( v[listKey[i]] === undefined ) {
        (v[listKey[i]] as SankeyLinkValueDict) = {}
      }
      AddDataTags(dataTags, v[listKey[i]] as unknown as {[key:string] : SankeyLinkValue}, depth + 1)
    }
  }
}


export const CutName = (t: string, n: number): string => {
  return (t && t.length > n) ? t.slice(0, n) + '...' : t
}



export const GetLinkValue:GetLinkValueFuncType = (
  data: SankeyData,
  idLink: string,
  up = false
): SankeyLinkValue => {
  const { links, dataTags } = data
  // Split the id and search for value after the original link id
  //  each value represent wich dataTag to choose among those where selected is at true in link.value
  // If there no dataTag (or no multiple dataTag selected then it take the first selected)
  let idDt : string[] = []
  if ( Object.values(dataTags).filter(tagGroup=>tagGroup.banner === 'multi').length > 0) {
    idDt = idLink.split('_')
    idDt.splice(0,1)
  }

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
  let val = links[idLink].value
  const listKey = [] as string[]
  let missing_key = false
  Object.values(dataTags).filter(dataTag =>(Object.keys(dataTag.tags).length != 0)).forEach((dataTag,i) => {
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
    val = (val as SankeyLinkValueDict)[listKey[i]]
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
export const FindMaxLinkValue:FindMaxLinkValueFuncType = (
  max_node_value: number,
  value_dict: SankeyLinkValueDict | SankeyLinkValue
): number => {
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
      const cur_max_value = FindMaxLinkValue(new_max_node_value, (v as unknown) as SankeyLinkValueDict)
      new_max_node_value = (cur_max_value > new_max_node_value) ? cur_max_value : new_max_node_value
    })
  }
  else { // If we reached the value, we can compare with ref max value
    const tmp=(value_dict as SankeyLinkValue).value as number
    new_max_node_value = (tmp && (tmp > new_max_node_value)) ? tmp : new_max_node_value
  }
  return new_max_node_value
}

export const ComputeTotalOffsets:ComputeTotalOffsetsFuncType = (
  inv_scale:(t:number)=>number,
  node: SankeyNode,
  applicationData:applicationDataType,
  TestLinkValue: TestLinkValueFuncType,
  ref_link: SankeyLink | undefined = undefined,
  GetLinkValue:GetLinkValueFuncType
): number[] => {
  if (node == undefined) {
    return [0,0,0,0]
  }
  const { data, display_links, display_nodes } = applicationData
  const { nodes, links} = data
  let offset_height_left = 0
  let offset_height_right = 0
  let offset_width_top = 0
  let offset_width_bottom = 0

  const left_flux: string[] = []
  const right_flux: string[] = []
  const top_flux: string[] = []
  const bottom_flux: string[] = []

  node.outputLinksId.filter(lid=>display_links[lid]).forEach(
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

        const node_x = node.position !== 'relative' ? +node.x : +target_node.x + +node.x
        const node_y = node.position !== 'relative' ? +node.y : +target_node.y + +node.y
        const target_node_x = target_node.position !== 'relative' ? +target_node.x : +node.x + +target_node.x
        const target_node_y = target_node.position !== 'relative' ? +target_node.y : +node.y + +target_node.y
        if (ReturnValueLink(data,link,'orientation') === 'hh') {
          if (target_node_x > node_x && !ReturnValueLink(data,link,'recycling') || target_node_x <= node_x && ReturnValueLink(data,link,'recycling')) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (ReturnValueLink(data,link,'orientation') === 'vv') {
          if (target_node_y > node_y) {
            bottom_flux.push(idLink)
          } else {
            top_flux.push(idLink)
          }
        } else if (ReturnValueLink(data,link,'orientation') === 'hv') {
          if (target_node_x > node_x) {
            right_flux.push(idLink)
          } else {
            left_flux.push(idLink)
          }
        } else if (ReturnValueLink(data,link,'orientation') === 'vh') {
          if (target_node_y > node_y) {
            bottom_flux.push(idLink)
          } else {
            top_flux.push(idLink)
          }
        }
      }
    }
  )

  node.inputLinksId.filter(lid=>display_links[lid]).forEach(
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
        const source_node_x = source_node.position !== 'relative' ? +source_node.x : +node.x + +source_node.x
        const source_node_y = source_node.position !== 'relative' ? +source_node.y : +node.y + +source_node.y
        const node_x = node.position !== 'relative' ? +node.x : +source_node.x + +node.x
        const node_y = node.position !== 'relative' ? +node.y : +source_node.y + +node.y
        const ori_link = ReturnValueLink(data,link,'orientation')
        if (ori_link === 'vv') {
          if (source_node_y < node_y) {
            // flux goes down
            top_flux.push(idLink)
          } else {
            // flux goes up
            bottom_flux.push(idLink)
          }
        } else if (ori_link === 'hh') {
          if (source_node_x >= node_x && ReturnValueLink(data,link,'recycling') || source_node_x < node_x && !ReturnValueLink(data,link,'recycling')) {
            // flux goes right
            left_flux.push(idLink)
          } else {
            // flux goes left
            right_flux.push(idLink)
          }
        } else if (ori_link === 'hv') {
          if (source_node_y < node_y) {
            // flux goes right
            top_flux.push(idLink)
          } else {
            // flux goes left
            bottom_flux.push(idLink)
          }
        } else if (ori_link === 'vh') {
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

      let v = TestLinkValue(applicationData, links[the_id],GetLinkValue)
      if (v === undefined) {
        return
      }
      v=((v!=='' && +v==0)||(+v>=inv_scale(applicationData.min_link_thickness)))?+v:inv_scale(applicationData.min_link_thickness)

      const extension = GetLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined &&
                      data.show_structure !== 'free_interval' &&
                      data.show_structure !== 'free_value' &&
                      !(nodes[links[the_id].idTarget].position == 'relative')
      if (extension.display_thin || is_free ) {
        // if flux is displayed thin
        offset_width_top += inv_scale(applicationData.min_link_thickness)
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
      let v = TestLinkValue(applicationData, links[the_id],GetLinkValue)
      if (v === undefined) {
        return
      }
      v=((v!=='' && +v==0)||(+v>=inv_scale(applicationData.min_link_thickness)))?+v:inv_scale(applicationData.min_link_thickness)

      const extension = GetLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined &&
                      data.show_structure !== 'free_interval' &&
                      data.show_structure !== 'free_value' &&
                      !(nodes[links[the_id].idTarget].position == 'relative')
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_width_bottom += inv_scale(applicationData.min_link_thickness)
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
      let v = TestLinkValue(applicationData, links[the_id],GetLinkValue)
      if (v === undefined) {
        return
      }
      v=((v!=='' && +v==0)||(+v>=inv_scale(applicationData.min_link_thickness)))?+v:inv_scale(applicationData.min_link_thickness)

      const extension = GetLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined &&
                      data.show_structure !== 'free_interval' &&
                      data.show_structure !== 'free_value' &&
                      !(nodes[links[the_id].idTarget].position == 'relative')
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_height_left += inv_scale(applicationData.min_link_thickness)
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
      let v = TestLinkValue(applicationData, links[the_id],GetLinkValue)
      if (v === undefined) {
        return
      }
      v=((v!=='' && +v==0)||(+v>=inv_scale(applicationData.min_link_thickness)))?+v:inv_scale(applicationData.min_link_thickness)
      const extension = GetLinkValue(data, links[the_id].idLink).extension
      if (!extension) {
        return
      }
      const is_free = extension.free_mini !== undefined &&
                      data.show_structure !== 'free_interval' &&
                      data.show_structure !== 'free_value' &&
                      !(nodes[links[the_id].idTarget].position == 'relative')
      if (extension.display_thin || is_free) {
        // if flux is displayed thin
        offset_height_right += inv_scale(applicationData.min_link_thickness)
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
export const ToPrecision:ToPrecisionFuncType = (
  v: number,
  t,
  nb_scientific=3
): string | number=> {
  if(!isNaN(v)) {
    if (v > Math.pow(10,nb_scientific)){
      return v.toPrecision(nb_scientific)
    }
    return String(parseFloat(v.toPrecision(nb_scientific))).replace('.',t('sep_decimal'))
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
export const LinkText:LinkTextFuncType = (
  data: SankeyData,
  d: SankeyLink,
  GetLinkValue:GetLinkValueFuncType,
  t
): string=> {

  let the_link_value = GetLinkValue(data, d.idLink).value
  const str_display = String(GetLinkValue(data, d.idLink).display_value)
  if (str_display !== '' && str_display!=='*') {
    return str_display
  }
  if (data.show_structure == 'structure' ) {
    return ''
  }
  if (data.show_structure == 'data' ) {
    const link_value = GetLinkValue(data, d.idLink)
    if ((link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return (link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value
    } else {
      return ''
    }
  }

  if(isNaN(the_link_value as number)){
    return the_link_value as string
  }else{
    const nb_sign=(ReturnValueLink(data,d,'scientific_precision') as number)
    if(nb_sign>0){
      the_link_value=parseFloat((the_link_value as number).toPrecision(nb_sign as number))
    }

    if((ReturnValueLink(data,d,'to_precision'))){
      the_link_value =ToPrecision(the_link_value as number,t,nb_sign)
    }else if (ReturnValueLink(data,d,'custom_digit')){
      the_link_value =(the_link_value as number).toFixed((ReturnValueLink(data,d,'nb_digit') as number))
    }
    const unit=ReturnValueLink(data,d,'label_unit_visible')?ReturnValueLink(data,d,'label_unit') as string:''
    return (String(the_link_value).replace('.',t('sep_decimal')))+unit
  }
}



export const TestLinkValue:TestLinkValueFuncType = (
  applicationData,
  d: SankeyLink,
  GetLinkValue:GetLinkValueFuncType
) => {
  const {data}=applicationData
  const { dataTags } = data
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])
  if (data.show_structure == 'structure' ) {
    return inv_scale(applicationData.min_link_thickness)
  }
  if (data.show_structure == 'data' ) {
    const link_value = GetLinkValue(data, d.idLink)
    if ((link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
      return (link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value
    } else {
      const inv_scale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, data.user_scale])
      return inv_scale(applicationData.min_link_thickness)
    }
  }
  let val = d.value
  const listKey: string[] = []
  let idDt : string[] = []
  if ( Object.values(dataTags).filter(tagGroup=>tagGroup.banner === 'multi').length > 0) {
    idDt = d.idLink.split('_')
    idDt.splice(0,1)
  }
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
    val = (val as SankeyLinkValueDict)[listKey[i]]
  }
  if (val === undefined) {
    return 0
  }
  if (val.value === '') {
    return val.value
  }
  if ( data.maximum_flux && scale((val as SankeyLinkValue).value as number) > data.maximum_flux) {
    return inv_scale(data.maximum_flux)
  }
  if ( data.minimum_flux && scale((val as SankeyLinkValue).value as number) < data.minimum_flux) {
    return inv_scale(data.minimum_flux)
  }
  return ((val as unknown) as SankeyLinkValue).value
}
/**
 * return a default sankey_data, use at the initialisation or re-initialisation of the application
 *
 * @returns {SankeyData}
 */
export const DefaultSankeyData: DefaultSankeyDataFuncType = (): SankeyData => {
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
    nodesColorMap: 'no_colormap',
    linksColorMap: 'no_colormap',

    legend_width:180,
    legend_position: [0,0],
    mask_legend:false,
    display_legend_scale:false,
    legend_police:16,
    legend_bg_border:false,
    legend_bg_color:defaultElementColor,
    legend_bg_opacity:0,
    legend_show_dataTags:false,
    node_label_separator:' - ',

    parametric_mode : false
  }
  const node_style_sect=DefaultNodeSectorStyle()
  const node_style_prod=DefaultNodeProductStyle()
  const default_data = {
    ...data,
    style_node: { 'default' : DefaultNodeStyle(),'NodeSectorStyle':node_style_sect,'NodeProductStyle':node_style_prod },
    style_link: { 'default' : DefaultLinkStyle() }
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
export const LinkColor:LinkColorFuncType = (
  l: SankeyLink,
  data:SankeyData,
  GetLinkValue:GetLinkValueFuncType
): string => {
  let colorLink=''

  if(Object.keys(data.dataTags).map(d=>'dataTags_'+d).includes(data.linksColorMap)){
    let idDt : string[] = []
    if ( Object.values(data.dataTags).filter(tagGroup=>tagGroup.banner === 'multi').length > 0) {
      idDt = l.idLink.split('_')
    }
    const colorMapFilterd=data.linksColorMap.slice(9,data.linksColorMap.length)
    const ind_str=(idDt.length>1)?idDt.slice(idDt.length-1,idDt.length)[0]:0

    const ind=Number(ind_str)
    // Sélectionne les tags du dataTag le plus imbirqué (Le dernier de la liste des dataTags)
    const tagsOfDT=data.dataTags[colorMapFilterd].tags
    colorLink=Object.values(tagsOfDT).filter(d=>d.selected)[ind].color??''
    return colorLink
  }



  if (data.linksColorMap!=='no_colormap') {
    const tagGroup = l.colorTag
    const v = GetLinkValue(data, l.idLink)
    if (v === undefined) {
      return ReturnValueLink(data,l,'color') as string
    }

    if (tagGroup in data.fluxTags && v.tags[tagGroup] && v.tags[tagGroup].filter(tag=>tag in data.fluxTags[tagGroup].tags).length > 0) {
      colorLink = data.fluxTags[tagGroup].tags[v.tags[tagGroup].filter(
        tag=>tag in data.fluxTags[tagGroup].tags
      )[0]].color??''
      return colorLink
    }
  }

  const source_node = data.nodes[l.idSource]
  const target_node = data.nodes[l.idTarget]
  let selected_tag = ''
  if (source_node.colorParameter !== 'local' && target_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && target_node.colorTag in target_node.tags) {
    const common_tags = source_node.tags[source_node.colorTag].filter(value => target_node.tags[target_node.colorTag].includes(value))
    if (common_tags.length > 0 && common_tags[0] in data.nodeTags[source_node.colorTag].tags) {
      return data.nodeTags[source_node.colorTag].tags[common_tags[0]].color ??''
    }
  }

  if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit' && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
    selected_tag = source_node.tags[source_node.colorTag][0]
    if (selected_tag in data.nodeTags[source_node.colorTag].tags) {
      return data.nodeTags[source_node.colorTag].tags[selected_tag].color ??''
    }
  } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit' && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
    selected_tag = target_node.tags[target_node.colorTag][0]
    if (selected_tag in data.nodeTags[target_node.colorTag].tags) {
      return data.nodeTags[target_node.colorTag].tags[selected_tag].color ??''
    }
  } else if ((!source_node.tags['Type de noeud'] || (source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] !== 'produit')) && source_node.colorParameter !== 'local' && source_node.colorTag in source_node.tags && source_node.tags[source_node.colorTag].length === 1) {
    selected_tag = source_node.tags[source_node.colorTag][0]
    if (selected_tag in data.nodeTags[source_node.colorTag].tags) {
      return data.nodeTags[source_node.colorTag].tags[selected_tag].color ??''
    }
  } else if ((!target_node.tags['Type de noeud'] || (target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] !== 'produit')) && target_node.colorParameter !== 'local' && target_node.colorTag in target_node.tags && target_node.tags[target_node.colorTag].length === 1) {
    selected_tag = target_node.tags[target_node.colorTag][0]
    if (data.nodeTags[target_node.colorTag].tags[selected_tag]) {
      return data.nodeTags[target_node.colorTag].tags[selected_tag].color ??''
    }
  } else if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && source_node.tags['Type de noeud'][0] === 'produit') {
    return ReturnValueNode(data,source_node,'color') as string
  } else if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && target_node.tags['Type de noeud'][0] === 'produit') {
    return ReturnValueNode(data,target_node,'color') as string
  }
  return ReturnValueLink(data,l,'color') as string
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
export const LinkVisible: LinkVisibleFunctType=(
  l: SankeyLink,
  data: SankeyData,
  display_nodes : { [node_id: string]: SankeyNode }
): boolean => {
  const { dataTags, fluxTags } = data

  if (!l) {
    return false
  }
  if (data.show_structure === 'structure') {
    if (data.nodes[l.idSource].position === 'relative' || data.nodes[l.idTarget].position === 'relative') {
      return false
    }
  }
  if (!data.nodes[l.idSource] || !display_nodes[l.idSource] || !data.nodes[l.idTarget] || !display_nodes[l.idTarget]) {
    return false
  }
  let val = l.value
  const listKey = [] as string[]
  let missing_key = false
  let idDt : string[] = []
  if ( Object.values(dataTags).filter(tagGroup=>tagGroup.banner === 'multi').length > 0) {
    idDt = l.idLink.split('_')
    idDt.splice(0,1)
  }
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
    val = (val as SankeyLinkValueDict)[listKey[i]]
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
  return true
}


/**
 * Return a Sankey Node, used at the creation of a new node
 *
 * @param {SankeyData} data
 * @returns {SankeyNode}
 */
export const DefaultNode:DefaultNodeFuncType = (
  data: SankeyData
): SankeyNode => {
  const defaultNode :  SankeyNode = {
    name: 'default',
    idNode: 'default',

    colorParameter: 'local',
    position: 'absolute',
    x: 100,
    y: 100,
    u:0,
    v:0,
    dy:0,
    inputLinksId: [],
    outputLinksId: [],
    tags: {},
    colorTag: '',
    dimensions: {},
    style: 'default'
  }
  for (const tag_group_key in data.nodeTags) {
    defaultNode.tags[tag_group_key]  = []
  }
  return defaultNode
}

// Return default style configuration for node
export const DefaultNodeStyle:DefaultNodeStyleFuncType=()=>{
  return {
    idNode:'default',
    name:'Style par défaut',
    shape: 'rect',
    node_arrow_angle_factor:30,
    node_arrow_angle_direction:'right',
    shape_visible: true,
    label_visible: true,
    node_width: 40,
    node_height: 40,
    color: defaultElementColor,
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
    label_box_width: 150,
    label_color:false,

  }
}

export const DefaultNodeSectorStyle:DefaultNodeSectorStyleFuncStyle=()=>{
  const node_style=DefaultNodeStyle()
  node_style.idNode='NodeSectorStyle'
  node_style.name='Noeud de type secteur'
  return node_style
}


export const DefaultNodeProductStyle:DefaultNodeProductStyleFuncStyle=(): SankeyNodeStyle=>{
  const node_style=DefaultNodeStyle()
  node_style.shape='ellipse'
  node_style.idNode='NodeProductStyle'
  node_style.name='Noeud de type produit'
  return node_style
}
// Return default style configuration for link
export const DefaultLinkStyle:DefaultLinkStyleFuncType=()=>{
  return {
    idLink:'default',
    name:'Style par défaut',
    color: defaultElementColor,
    recycling:false,
    curved: true,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    label_pos_auto:false,
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
    dashed:false

  }
}


/**
 *
 * @param {SankeyData} data
 * @param {string[]} l
 * @returns {*}
 */
const CreateObject:CreateObjectFuncType = (data: SankeyData, l: string[]): SankeyLinkValueDict| SankeyLinkValue => {
  const { dataTags,fluxTags } = data
  if (l.length == 0) {
    const obj = Object.create({}) as SankeyLinkValue
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
    const o = Object.create({}) as SankeyLinkValue

    if (i !== undefined) {
      Object.keys(dataTags[i].tags).forEach(tag_key => {
        const obj = Object.create({})
        const ob = CreateObject(data, l.slice(1))
        obj[tag_key] = ob
        Object.assign(o, obj)
      })
    }
    return o
  }
}

/**
 * Return a default link, used at the creation of a new link
 *
 * @param {SankeyData} data
 * @returns {SankeyLink}
 */
export const DefaultLink :DefaultLinkFuncType= (data: SankeyData): SankeyLink => {
  const { dataTags } = data
  let nObjet = Object.create({})
  const listK = Object.keys(dataTags).filter(d => Object.keys(dataTags[d].tags).length != 0)


  nObjet = CreateObject(data, listK)

  return {
    idSource: 'node0',
    idTarget: 'node1',
    idLink: 'link0',
    value: nObjet,

    colorTag: '',
    style:'default',
    local:{}
  }
}
/**
 * Delete a link and trace of the said link in the source and target nodes
 *
 * @param {SankeyData} data
 * @param {SankeyLink} link
 */
export const DeleteLink:DeleteLinkFuncType = (
  data: SankeyData,
  link: SankeyLink
): void => {
  const source_node = data.nodes[link.idSource]
  let idx = source_node.outputLinksId.findIndex(idLink => idLink === link.idLink)
  source_node.outputLinksId.splice(idx, 1)

  const target_node = data.nodes[link.idTarget]
  idx = target_node.inputLinksId.findIndex(idLink => idLink === link.idLink)
  target_node.inputLinksId.splice(idx, 1)

  // Delete link in linkZIndex tab
  idx = data.linkZIndex.findIndex(idLink => idLink === link.idLink)
  data.linkZIndex.splice(idx, 1)

  delete data.links[link.idLink]
}
/**
 * Delete node and all links linked to it
 *
 * @param {SankeyData} data
 * @param {SankeyNode} node
 */
export const DeleteNode:DeleteNodeFuncType = (
  data: SankeyData,
  node: SankeyNode
) => {

  //Ne fait plus appel à DeleteLink car la fonction modifie le tableau des output/input du node
  //et ne supprime pas des flux qui devrait l'être

  node.inputLinksId.forEach(idLink => {
    Object.values(data.nodes).map((k) => {
      k.outputLinksId = k.outputLinksId.filter(function (value) {
        return value != idLink
      })
    })
    delete data.links[idLink]
    DeleteGLinks([idLink])
  })

  node.outputLinksId.forEach(idLink => {
    Object.values(data.nodes).map((k) => {
      k.inputLinksId = k.inputLinksId.filter(function (value) {
        return value != idLink
      })
    })
    delete data.links[idLink]
    DeleteGLinks([idLink])
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

  // Delete refrence to son nodes
  Object.values(data.nodes)
    .filter(n=>n.dimensions)
    .forEach(n=>{
      Object.entries(n.dimensions).filter(nd=>nd[1].parent_name && nd[1].parent_name==node.idNode).forEach(nd=>{
        delete n.dimensions[nd[0]]
      })
    })
  DeleteGNodes([node.idNode])
  delete data.nodes[node.idNode]

}



/**
 *
 * @typedef {layout_type}
 */
export type layout_type = {
  layout: SankeyData
}

export const SetNodeStyleToTypeNode:SetNodeStyleToTypeNodeFuncType=(data:SankeyData): void=>{
  if(Object.keys(data.nodeTags).includes('Type de noeud')){
    Object.values(data.nodes).forEach(node=>{
      if(node.tags['Type de noeud']){
        if(node.tags['Type de noeud'].includes('secteur')){
          node.style='NodeSectorStyle'
        }else if(node.tags['Type de noeud'].includes('produit')){
          node.style='NodeProductStyle'
        }
      }
    })
  }
}


// Function that return the color that the node has to display
// It depend of if a tags is selected, if the persistent variable is at true and the color we gived to the node
export const NodeColor:NodeColorFuncType = (n: SankeyNode,data:SankeyData): string => {
  if (n.colorParameter === 'groupTag' || data.show_structure === 'structure' ) {
    //Le couleur est définie dans les parametres du groupTag pour le favoriteTag
    //on controle ici qu'il y a bien un favorite tag
    if (n.colorTag !== undefined && n.colorTag !== '' && n.colorTag !=='no_colormap') {
      const tagGroup = n.colorTag
      if (n.tags[tagGroup] === undefined) {
        return (ReturnValueNode(data,n,'colorSustainable'))? ReturnValueNode(data,n,'color') as string:defaultElementColor
      } else if (n.tags[tagGroup].length == 1 ) {
        if ( (ReturnValueNode(data,n,'colorSustainable'))) {
          return ReturnValueNode(data,n,'color') as string
        }
        if (data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]]) {
          return data.nodeTags[tagGroup].tags[n.tags[tagGroup][0]].color??''
        } else {
          return (ReturnValueNode(data,n,'colorSustainable'))? ReturnValueNode(data,n,'color') as string:defaultElementColor
        }
      } else {
        return defaultElementColor
      }
    } else {
      return defaultElementColor
    }
  }
  if (n.colorParameter === 'local') {
    // Le couleur est définie dans les parametres locaux du noeud
    return ReturnValueNode(data,n,'color') as string
  }
  return defaultElementColor
}

export const GetVerticalMarginForSankeyZone:GetVerticalMarginForSankeyZoneFuncType=(): number=>{
  // Get height of elements ahead and below the sankeydraw zone
  let shift_top=document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height
  if (shift_top == undefined) {
    shift_top = 0
  }
  let footer_size=document.getElementsByClassName('sankeyFooter')[0]?.getBoundingClientRect().height
  if (footer_size == undefined) {
    footer_size = 0
  }
  return shift_top+footer_size
}
/**
 *Function used to fit the sankey in the visibiel screen
 *
 * @param {*} applicationData dict containing var concerning the data of the sankey
 * @param {*} GetSankeyMinWidthAndHeight return the size of the sankey (max position to the right & bottom)
 * @param {boolean} [show_nav=false] if the config menu is open then we take it into account
 * @param {boolean} [vertical=false] Var to fit the sankey vertically instead of horizontally
 */
export const AdjustSankeyZone:AdjustSankeyZoneFuncType =(
  applicationData,
  GetSankeyMinWidthAndHeight,
  show_nav=false,vertical=false
): void=>{
  const {data}=applicationData;
  [applicationData.data.width, applicationData.data.height] = GetSankeyMinWidthAndHeight(applicationData)
  let size_menu=0
  if(show_nav){
    size_menu=menu_config_width
  }
  // Width of the screen minus the margin of the sankey zone minus the width of the configuration menu if it's open
  const has_scroll_bar=window.innerHeight-document.getElementsByTagName('html')[0].clientHeight
  const is_fullscreen=d3.selectAll('.opensankey .fullscreen_toolbar').nodes().length>0?35:0


  const visible_size=window.innerWidth -size_menu - has_scroll_bar - (is_fullscreen?-50:50)

  const vertical_margin=GetVerticalMarginForSankeyZone()


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
export interface DataSuiteType{
  is_catalog?:boolean,
  view?:{id: string,view_data: object,nom:string,details:string}[],
}
/**
 *
 * @param data
 * @param type_tag_name
 * @param tags_group_key
 * @param is_auto_from_add_grp_tag variable used to avoid redondancie when we add a new group data tag
 */
export const AddTag:AddTagFuncType =(
  data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',
  tags_group_key:string,
  is_auto_from_add_grp_tag=false
): void=>{
  // Méthode pour incrementer idElement
  let idElement = Object.keys(data[type_tag_name][tags_group_key].tags).length
  while (data[type_tag_name][tags_group_key].tags['element' + idElement]) {
    idElement = idElement+1
  }

  const nb_tags = Object.keys(data[type_tag_name][tags_group_key].tags).length+1
  const colors = colormap({
    colormap: data[type_tag_name][tags_group_key].color_map,
    nshades: Math.max(11, nb_tags),
    format: 'hex',
    alpha: 1
  })
  let step = 1
  if (nb_tags < 11) {
    step = Math.round(11 / nb_tags)
  }
  // Object.keys(data[type_tag_name][tags_group_key].tags).forEach(
  //   (tag_key, i) => data[type_tag_name][tags_group_key].tags[tag_key].color = colors[i * step]
  // )
  data[type_tag_name][tags_group_key].tags['element' + idElement] = { 
    name: 'étiquette' + idElement, 
    color: colors[(nb_tags-1) * step], 
    selected: true 
  }
  // If we create a data tags then we redesign link value object
  // Since dataTags is a tree structure adding a new tag can lead to 2 transformation:
  //  - If the group is a branch then we need to create it sub tree with the layout of all sub datatags
  //  - If the group is a leaf then we just add a new entrie to the last subtree
  if(type_tag_name==='dataTags' && !is_auto_from_add_grp_tag){
    const listK = Object.keys(data.dataTags).filter(d => Object.keys(data.dataTags[d].tags).length != 0)
    const nObjet = CreateObject(data, listK)
    const depth_of_tag_grp= Object.keys(data.dataTags).findIndex(kl=>kl===tags_group_key)
    const new_link_value_tag=createDefaultLinkValueForNewDataTag(nObjet as SankeyLinkValueDict,depth_of_tag_grp,0)
    Object.values(data.links).forEach(link=>{
      addNewSubTreeValueToLink(link.value as SankeyLinkValueDict,depth_of_tag_grp,0,new_link_value_tag)
    })
  }
}

/**
 * Create a subtree value for link, this function is used when we add a new tag to an existing data tag group
 * It allow to get a default subtree that we add to each link value at the correct depth
 * Ex : - we have 2 grp : grp1 and group2 with each one have at least 1 tag already wich give us link value like : value :{ tag1_grp1:{tag1_grp2:{value:x,display_value:y,...}}}
 *
 * - if we add a new tag to a group branch (grp1) we have to recreate subtree to be similar to other tag of the same grp wich give us :
 *  value :{ tag1_grp1:{tag1_grp2:{value:x,display_value:y,...}},
 *          tag2_grp1:{tag1_grp2:{value:'',display_value:'',...}}
 *           }
 *
 *  - if we add a new tag to a group leaf (in that case grp2) we just add a new value possible :
 *  value :{ tag1_grp1:{tag1_grp2:{value:x,display_value:y,...}, tag2_grp2:{value:'',display_value:'',...}}}
 */
const createDefaultLinkValueForNewDataTag:createDefaultLinkValueForNewDataTagType=(
  link_value:SankeyLinkValueDict,
  index_of_grp_tag:number,
  current_index:number
)=>{
  if(current_index<index_of_grp_tag){
    const next_link_value_depth=Object.values(link_value)[0] as SankeyLinkValueDict
    return createDefaultLinkValueForNewDataTag(next_link_value_depth,index_of_grp_tag,current_index+1)
  }else{
    const entries_of_values= Object.entries(link_value)
    const last_entrie=entries_of_values[entries_of_values.length-1]
    return last_entrie
  }
}

/**
 * Add a the new value subtree to the link value
 */
const addNewSubTreeValueToLink=(link_value:SankeyLinkValueDict,index_of_grp_tag:number,current_index:number,new_value:[string, SankeyLinkValueDict | SankeyLinkValue])=>{
  if(current_index<index_of_grp_tag){
    Object.values(link_value).forEach(lv=>
      addNewSubTreeValueToLink(lv as SankeyLinkValueDict,index_of_grp_tag,current_index+1,new_value)
    )
  }else{
    link_value[new_value[0]]=JSON.parse(JSON.stringify(new_value[1]))
  }
}

export const AddGroupTag:AddGroupTagFuncType = (data:SankeyData,type_tag_name:'nodeTags' | 'fluxTags' | 'dataTags',tags_group_key:string,elementNameProp:string): string=>{
  const elementName = elementNameProp === 'nodes' ? 'nodes' : 'links'
  // Méthode pour incrementer idGroup
  const idGroup = Object.keys(data[type_tag_name]).length+1
  //la clé est unique grâce au timestamp mais le nom est liée au nombre de grouptag
  const k='tag_group_' + String(new Date().getTime())
  data[type_tag_name][k] = {
    group_name: 'Étiquette Group ' + idGroup,
    show_legend: false,
    color_map: 'jet',
    tags: {},
    banner:  type_tag_name==='dataTags'?'one':'multi',
    activated: true,
    siblings: []
  }
  if (elementName === 'nodes' ) {
    Object.values(data[elementName]).forEach(n => n.tags[k] = [])
  }
  if (Object.keys(data[type_tag_name]).length === 1) {
    Object.values(data[elementName]).forEach(n => n.colorTag = Object.keys(data[type_tag_name])[0])
  }

  // Add a tag to the group
  AddTag(data,type_tag_name,k,true)

  // If we create a group of data tags then we redesign link value object
  // Since dataTags is a tree structure adding a new group reshape the tree and the previous values are 'lost'
  if(elementName === 'links' && type_tag_name==='dataTags'){
    addDepthLinkValueWithNewDTGrp(data)
  }
  return k
}

export const resetLinkValueAfterDeleteDTGrp=(data:SankeyData)=>{
  const listK = Object.keys(data.dataTags).filter(d => Object.keys(data.dataTags[d].tags).length != 0)
  const nObjet = CreateObject(data, listK)
  Object.entries(data.links).forEach(l=>{
    // We parse a stringified version of the object to make a copy of it
    // if we didn't do it all link value would reference the same object therefore modifying one link value would modify all of them
    l[1].value=JSON.parse(JSON.stringify(nObjet))
  })
}


export const addDepthLinkValueWithNewDTGrp=(data:SankeyData)=>{
  const listK = Object.keys(data.dataTags).filter(d => Object.keys(data.dataTags[d].tags).length != 0)
  const first_tag_of_last_grp=Object.keys(data.dataTags[listK[listK.length-1]].tags)[0]
  Object.entries(data.links).forEach(l=>{
    //For eack link we go through each value and add a new depath to the value with the first tag of the new dataTagGrp
    l[1].value=updateLinkValueDepthWithNewDTGrp(l[1].value,first_tag_of_last_grp)
  })
}

// Recursive func that search if we are at the data level of link value ({value:x,display_value:y,extensions:...})
// and if we are then change it by adding a new depth with the new tag of the new grp ({new_tag_of_new_grp:{value:x,display_value:y,extensions:...}})
// If current prev_l is like {tag_x_of_grp_a:{...},tag_y_of_grp_a:{...}} then we call the func updateLinkValueDepthWithNewDTGrp on each entries of prev_l
const updateLinkValueDepthWithNewDTGrp=(prev_l:SankeyLinkValueDict|SankeyLinkValue,new_tag_of_new_grp:string)=>{
  if(prev_l.value===undefined){
    const tmp=Object.entries(prev_l).map(next_depth=>{
      next_depth[1]=updateLinkValueDepthWithNewDTGrp(next_depth[1],new_tag_of_new_grp)
      return next_depth
    })
    prev_l=Object.fromEntries(tmp)
  }else{
    const copy_last_value=JSON.parse(JSON.stringify(prev_l))
    prev_l={}  as SankeyLinkValueDict
    prev_l[new_tag_of_new_grp]=copy_last_value as SankeyLinkValueDict
  }
  return prev_l

}

// Return the value of an attribute from node :
// - If the node has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the node has (a node always has a style )
export const ReturnValueNode:ReturnValueNodeFuncType=(data:SankeyData,n:SankeyNode,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle): string | number | boolean=>{
  let value=ReturnLocalNodeValue(n,k as keyof SankeyNodeAttrLocal)
  if(value === undefined || value === null){
    const ks=k as keyof SankeyNodeStyle
    value= n.style in data.style_node ? data.style_node[n.style][ks] : data.style_node['default'][ks]
  }
  return value
}

// Get the variable value of an attribut from style
export const GetNodeAttributeValueFromStyle:GetNodeAttributeValueFromStyleFuncType=(data:SankeyData,n:SankeyNodeStyle,k:keyof SankeyNodeStyle): string | number | boolean=>{
  return data.style_node[n.idNode][k]
}

// Return value of local node variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const ReturnLocalNodeValue:ReturnLocalNodeValueFuncType=(n:SankeyNode,key:keyof SankeyNodeAttrLocal): string | number | boolean | null | undefined=>{
  return n.local?.[key]
}

// Check if all value of the attribute "k" is the same in the selected nodes (or selected style)
// If the value come from local attribute or the style of the node doesn't matter, we look only the value
export const IsAllNodeAttrSameValue:IsAllNodeAttrSameValueFuncType=(data:SankeyData,m_s_n:SankeyNode[]|SankeyNodeStyle[],k_list:(keyof SankeyNodeAttrLocal)[],menu_for_style:boolean): { [x: string]: [string | number | boolean, boolean] }=>{
  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  const store_value={} as {[x:string]:[(string | number | boolean),boolean]}

  if(m_s_n.length>0){
    // For each selected nodes
    m_s_n.forEach((node,i)=>{
      // For each attributes we want to check
      k_list.forEach(k => {
        // Get the value of the node attribute(k)
        const val=ReturnCorrectNodeAttributeValue(data,node,k,menu_for_style)

        // Store first value of each node attribute
        if(i===0){
          store_value[k]=[val,false]
        }else{
          // Check if other nodes selected have the same value, if not we set the 2nd value of the array at true
          store_value[k][1]=val!==store_value[k][0]?true:store_value[k][1]
        }
      })
    })
  }else{
    k_list.forEach(k => {
      store_value[k]=[false,false]
    })
  }
  return store_value
}

// Check if the value used is the local one or the one that come from the style
export const IsNodeDisplayingValueLocal:IsNodeDisplayingValueLocalFuncType=(m_s_n:{current:SankeyNode[]},k:keyof SankeyNodeAttrLocal,menu_for_style:boolean): boolean=>{
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
export const AssignNodeValueToCorrectVar:AssignNodeValueToCorrectVarFuncType=(n:SankeyNode|SankeyNodeStyle,k:keyof SankeyNodeAttrLocal,v:boolean|string|number,menu_for_style:boolean): void=>{
  const nn=(n as SankeyNode)
  const ns=(n as SankeyNodeStyle)
  const ks=(k as keyof SankeyNodeStyle)
  const kl=(k as keyof SankeyNodeAttrLocal);
  (menu_for_style)?AssignNodeStyleAttribute(ns,ks,v):AssignNodeLocalAttribute(nn,kl,v)
}
// Return the value to the corresponding variable (in the style or in the variable local of node)
export const ReturnCorrectNodeAttributeValue:ReturnCorrectNodeAttributeValueFuncType=(data:SankeyData,n:SankeyNode|SankeyNodeStyle,k:keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle,menu_for_style:boolean): string | number | boolean=>{
  const ks=(k as keyof SankeyNodeStyle)
  const kl=(k as keyof SankeyNodeAttrLocal)
  const nn=(n as SankeyNode)
  const ns=(n as SankeyNodeStyle)
  return (menu_for_style)?GetNodeAttributeValueFromStyle(data,ns,ks):ReturnValueNode(data,nn,kl)
}

// Assign the value to local attribute (create local attribute if it doesn't exist and "k" attribute if it doesn't either)
export const AssignNodeLocalAttribute:AssignNodeLocalAttributeFuncType = (n:SankeyNode,k:keyof SankeyNodeAttrLocal,v:boolean|string|number): void=>{
  if(n.local === undefined || n.local === null){
    n.local={} as SankeyNodeAttrLocal
  }
  Object.assign(n.local,{[k.toString()]:v})
}
// Assign the value to attribute of node style "n"
export const AssignNodeStyleAttribute:AssignNodeStyleAttributeFuncType = (n:SankeyNodeStyle,k:keyof SankeyNodeStyle,v:boolean|string|number): void=>{
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
export const NodeDisplayed:NodeDisplayedFuncType = (
  data:SankeyData,
  node:SankeyNode
): boolean=>{
  const has_local_level=ReturnLocalNodeValue(node,'local_aggregation') as boolean | undefined
  const local_level=has_local_level ?? NodeHasDisplayedLevel(data,node)
  return NodeHasDisplayedTags(data,node) && ( local_level )
}

const NodeHasDisplayedTags=(data:SankeyData,n:SankeyNode): boolean=>{
  let to_display=true

  Object.entries(data.nodeTags).filter(nt=> nt[0] !== 'Type de noeud' && Object.keys(n.tags).includes(nt[0])).forEach(nt=>{
    // Check tags from the group attribued to the node
    // If the node don't have tag attribued from the group then it is not affected by filter and we display it
    const node_tags_attr=n.tags[nt[0]]

    if(node_tags_attr!= undefined && node_tags_attr.length!=0){
      // If the node has at least 1 tag from the selected tag of the group then we display it
      // If the node has tag from the group attribued to it but are not selected then we don't display it
      if (!nt[1].tags) {
        return
      }
      const tags_from_grp_to_display=Object.entries(nt[1].tags).filter(t=>t[1].selected).map(t=>t[0])
      to_display=(node_tags_attr.filter(t=>tags_from_grp_to_display.includes(t)).length>0)?to_display:false

    }
  })
  return to_display
}

const NodeHasDisplayedLevel=(data:SankeyData,n:SankeyNode)=>{
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
    if(node_tags_attr != undefined && node_tags_attr.length!=0){
      // If the node has at least 1 tag from the selected tag of the group then we display it
      // If the node has tag from the group attribued to it but are not selected then we don't display it
      const tags_from_grp_to_display=Object.values(nt[1].tags).filter(t=>t.selected).map(t=>t.name)
      to_display=(node_tags_attr.filter(t=>tags_from_grp_to_display.includes(t)).length>0)?to_display:false

    }
  })
  return to_display
}

// Return the value of an attribute from link :
// - If the link has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the link has (a link always has a style )
export const ReturnValueLink:ReturnValueLinkFuncType=(data:SankeyData,l:SankeyLink,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle): string | number | boolean=>{
  let value=ReturnLocalLinkValue(l,k as keyof SankeyLinkAttrLocal)
  if(value === undefined || value === null){
    const ks=k as keyof SankeyLinkStyle
    value= l.style in data.style_link ? data.style_link[l.style][ks] : data.style_link['default'][ks]
  }
  return value
}

// Get the variable value of an attribut from style
export const GetLinkAttributeValueFromStyle:GetLinkAttributeValueFromStyleFuncType=(data:SankeyData,l:SankeyLinkStyle,k:keyof SankeyLinkStyle)=>{
  return data.style_link[l.idLink][k]
}

// Return value of local link variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const ReturnLocalLinkValue:ReturnLocalLinkValueFuncType=(l:SankeyLink,key:keyof SankeyLinkAttrLocal)=>{
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
// If the value come from local attribute or the style of the link doesn't matter, we look only the value
export const IsAllLinkAttrSameValue:IsAllLinkAttrSameValueFuncType=(data:SankeyData,m_s_l:SankeyLink[]|SankeyLinkStyle[],k_list:(keyof SankeyLinkAttrLocal)[],menu_for_style:boolean)=>{

  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  const store_value={} as {[x:string]:[(string | number | boolean),boolean]}
  if(m_s_l.length>0){
    // For each selected nodes
    m_s_l.forEach((link,i)=>{
      // For each attributes we want to check
      k_list.forEach(k => {
        // Get the value of the node attribute(k)
        const val=ReturnCorrectLinkAttributeValue(data,link,k,menu_for_style)

        // Store first value of each node attribute
        if(i===0){
          store_value[k]=[val,false]
        }else{
          // Check if other nodes selected have the same value, if not we set the 2nd value of the array at true
          store_value[k][1]=val!==store_value[k][0]?true:store_value[k][1]
        }
      })
    })
  }else{
    k_list.forEach(k => {
      store_value[k]=[false,false]
    })
  }
  return store_value
}

// Check if the value used is the local one or the one that come from the style
export const IsLinkDiplayingValueLocal:IsLinkDisplayingValueLocalFuncType=(m_s_l:{current:SankeyLink[]},k:keyof SankeyLinkAttrLocal,menu_for_style:boolean)=>{
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
export const AssignLinkValueToCorrectVar:AssignLinkValueToCorrectVarFuncType=(l:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal,v:boolean|string|number,menu_for_style:boolean)=>{
  const nn=(l as SankeyLink)
  const ns=(l as SankeyLinkStyle)
  const ks=(k as keyof SankeyLinkStyle)
  const kl=(k as keyof SankeyLinkAttrLocal);
  (menu_for_style)?AssignLinkStyleAttribute(ns,ks,v):AssignLinkLocalAttribute(nn,kl,v)
}
// Return the value to the corresponding variable (in the style or in the variable local of link)
export const ReturnCorrectLinkAttributeValue:ReturnCorrectLinkAttributeValueFuncType=(data:SankeyData,l:SankeyLink|SankeyLinkStyle,k:keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle,menu_for_style:boolean)=>{
  const ks=(k as keyof SankeyLinkStyle)
  const kl=(k as keyof SankeyLinkAttrLocal)
  const nn=(l as SankeyLink)
  const ns=(l as SankeyLinkStyle)
  return (menu_for_style)?GetLinkAttributeValueFromStyle(data,ns,ks):ReturnValueLink(data,nn,kl)
}

// Assign the value to local attribute (create local attribute if it doesn't exist and "k" attribute if it doesn't either)
export const AssignLinkLocalAttribute:AssignLinkLocalAttributeFuncType=(l:SankeyLink,k:keyof SankeyLinkAttrLocal,v:boolean|string|number)=>{
  if(l.local === undefined || l.local === null){
    l.local={} as SankeyLinkAttrLocal
  }
  Object.assign(l.local,{[k.toString()]:v})
}
// Assign the value to attribute of link style "l"
export const AssignLinkStyleAttribute:AssignLinkStyleAttributeFuncType=(l:SankeyLinkStyle,k:keyof SankeyLinkStyle,v:boolean|string|number)=>{
  (l[k] as unknown)=v
}
export const NodeContextHasAggregate:NodeContextHasAggregateFuncType = (n:SankeyNode,data:SankeyData)=>{
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
export const NodeContextHasDesaggregate:NodeContextHasDesaggregateFuncType = (n:SankeyNode,data:SankeyData)=>{
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

export const ApplyStyleToNodes:ApplyStyleToNodesFuncType = (
  multi_selected_nodes:{current:SankeyNode[]},
  node_function
) => {
  multi_selected_nodes.current.map(d => {
    // Delete local value so the used value come from the style
    delete d.local
  })
  node_function.RedrawNodes(multi_selected_nodes.current)

}

export const AddNewNode:AddNewNodeFuncType = (applicationData,
  multi_selected_nodes:{current:SankeyNode[]},
  node_function
) => {
  const {data}=applicationData
  const { nodes } = data
  const node: SankeyNode = DefaultNode(data)

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
  ApplyStyleToNodes(multi_selected_nodes,node_function)
  applicationData.display_nodes[node.idNode]=node
  node_function.CreateNodesOnSVG([node])
}

// Recursive function to create multiple copy of a link,according to the number of dataTags selected, to display the different value of a same link
export const RecursionDataTag:RecursionDataTagFuncType=(data:SankeyData,DT:TagsCatalog,ind:number,suffix:string,link_to_copy:SankeyLink,new_links:{ [link_id: string]: SankeyLink })=>{
  const DT_l=Object.values(DT).length
  Object.values((Object.values(DT)[ind] as {group_name:string,show_legend:boolean,color_map:string,tags:Record<string,unknown>}).tags)
    .filter(t=>(t  as {selected:boolean}).selected).forEach((d,i)=>{
      const n_suffix= suffix+'_'+i
      // Depth search of group_dataTag, if it the deepest, a link is created with a specific id to retrieve the right value of the link in GetLinkValue
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
        RecursionDataTag(data,DT,ind+1,n_suffix,link_to_copy,new_links)
      }

    })
}

// Create emptyicon for treefolder component
export const FileIcon = () => {
  return <FaCaretRight style={{opacity:0}}/>
}
export const FolderIcon = () => {
  return <></>
}
export const FolderOpenIcon = () => {
  return <></>
}

export const list_palette_color=[d3.interpolateBlues,d3.interpolateBrBG,d3.interpolateBuGn,d3.interpolatePiYG,d3.interpolatePuOr,
  d3.interpolatePuBu,d3.interpolateRdBu,d3.interpolateRdGy,d3.interpolateRdYlBu,d3.interpolateRdYlGn,d3.interpolateSpectral,
  d3.interpolateTurbo,d3.interpolateViridis,d3.interpolateInferno,d3.interpolateMagma,d3.interpolatePlasma,d3.interpolateCividis,
  d3.interpolateWarm,d3.interpolateCool,d3.interpolateCubehelixDefault,d3.interpolateRainbow,d3.interpolateSinebow]

export const GetRandomInt=(max:number) =>{
  return Math.floor(Math.random() * max)
}

/**
 * Function that return a style for title of subsection in menu configuration
 * Attributes modified :
 * - font_size:14px
 * - font_weight:bold
 * - text-decoration:underline (possible to not underline it)7
 * - max-width:'100%'
 */
export const StyleTitleSubSectionMenuEditionElements=({
  v_font_size='14px',
  v_font_weight='bold',
  underline=false,
  v_max_width='100%',
})=>{
  return {fontSize:v_font_size ,
    fontWeight:v_font_weight,
    textDecoration:underline?'underline':'',
    maxWidth:v_max_width,
    display:'block',
    textAlign:'center'} as CSSProperties
}

// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
export const TooltipValueSurcharge=(k:string,t:TFunction)=>{
  return <OSTooltip label={t('Menu.overcharge_style_value')}>
    <FontAwesomeIcon style={{color:'#6cc3d5',height:'12',width:'12',float:'right'}} icon={faCircleInfo}/>
  </OSTooltip>
}

type ValueOf<T>=T[keyof T]
export const IsAllNodeNotLocalAttrSameValue=(
  data:SankeyData,
  m_s_n:SankeyNode[],
  k_list:(keyof SankeyNode)[]
)=>{
  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  const store_value={} as { [x: string]: [ValueOf<SankeyNode>|boolean, boolean]; }

  if(m_s_n.length>0){
    // For each selected nodes
    m_s_n.forEach((node,i)=>{
      // For each attributes we want to check
      k_list.forEach(k => {
        // Get the value of the node attribute(k)
        const val=node[k]

        // Store first value of each node attribute
        if(i===0){
          store_value[k]=[val,false]
        }else{
          // Check if other nodes selected have the same value, if not we set the 2nd value of the array at true
          store_value[k][1]=val!==store_value[k][0]?true:store_value[k][1]
        }
      })
    })
  }else{
    k_list.forEach(k => {
      store_value[k]=[false,false]
    })
  }
  return store_value
}

export const IsAllLinkNotLocalAttrSameValue=(
  data:SankeyData,
  m_s_l:SankeyLink[],
  k_list:(keyof SankeyLink)[]
)=>{
// store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected links attribute
  // In second position it contain a boolean that return true if all selected links have the same value for the key
  const store_value={} as { [x: string]: [ValueOf<SankeyLink>|boolean, boolean]; }

  if(m_s_l.length>0){
    // For each selected links
    m_s_l.forEach((link,i)=>{
      // For each attributes we want to check
      k_list.forEach(k => {
        // Get the value of the link attribute(k)
        const val=link[k]

        // Store first value of each link attribute
        if(i===0){
          store_value[k]=[val,false]
        }else{
          // Check if other links selected have the same value, if not we set the 2nd value of the array at true
          store_value[k][1]=val!==store_value[k][0]?true:store_value[k][1]
        }
      })
    })
  }else{
    k_list.forEach(k => {
      store_value[k]=[false,false]
    })
  }
  return store_value
}

export const windowSankey = window as Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
  sankey: {
    sankey_data_file:RequestInfo
    sous_filieres : { [ key : string ] : string }
    units: string[]
    flask_logo? : string
    flask_header? : string
    logo_width? : number
    legend_average : string
    legend_uncert : string
    help_text : string
    welcome_text: string
    excel : string
    logo: string,
    advanced: boolean,
    intro: string
  }
}
export const styleRowInput=()=>{
  return {marginLeft:'-0.5rem'}
}

export const updateLinkTagValue=(d:SankeyLink,
  tags_selected: {[k: string]: string},
  tags_group_key:string,
  tag_key:string,
  visible:boolean
)=>{
  let val = Object(d.value)
  Object.values(tags_selected).forEach(tag => {
    if (val[tag] === undefined) {
      val[tag] = {}
    }
    val = val[tag]
  })
  if(val.tags[tags_group_key]===undefined){
    val.tags[tags_group_key]=[]
  }
  if (visible) {
    val.tags[tags_group_key].push(tag_key)
  } else {
    val.tags[tags_group_key].splice(val.tags[tags_group_key].indexOf(tag_key),1)
  }
}

export const deleteSelectedNodeFromData=(
  applicationData:applicationDataType,
  applicationState:applicationStateType
)=>{
  const {data} = applicationData
  const {multi_selected_nodes}=applicationState
  multi_selected_nodes.current.map(d => DeleteNode(data, d))
  multi_selected_nodes.current = []
  const tmp_node=Object.keys(data.nodes)
  Object.entries(applicationData.display_nodes).filter(n=>{
    return !tmp_node.includes(n[0])
  }).forEach(n=>{
    DeleteGNodes([n[0]])
    delete applicationData.display_nodes[n[0]]
  })

  const tmp_link=Object.keys(data.links)
  Object.entries(applicationData.display_links).filter(l=>{
    return !tmp_link.includes(l[0])
  }).forEach(l=>{
    DeleteGLinks([l[0]])
    delete applicationData.display_links[l[0]]
  })
}



export const OSTooltip:FunctionComponent<OSTooltpFuncType>=(
  {
    label,
    delay=500,
    placement='top',
    children
  }
)=>{
  if (label === undefined) {
    return <>{children}</>
  }
  return <Tooltip
    key={label.split(' ').join('_')}
    openDelay={delay}
    placement={placement}
    label={label}
    closeDelay={100}
  >
    {children}
  </Tooltip>
}
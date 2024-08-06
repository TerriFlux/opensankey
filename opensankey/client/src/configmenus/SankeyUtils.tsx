import { SankeyData,
  SankeyLink,
  SankeyLinkValue,
  SankeyLinkValueDict,
  SankeyNode,
  SankeyNodeAttrLocal,
  SankeyNodeStyle,
  SankeyLinkAttrLocal,
  SankeyLinkStyle} from '../types/Types'
import * as d3 from 'd3'
import React, { FunctionComponent } from 'react'
import { FaCaretRight } from 'react-icons/fa'
import { TFunction } from 'i18next'
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  
  AssignLinkLocalAttributeFuncType, AssignLinkStyleAttributeFuncType,
  AssignNodeStyleAttributeFuncType,
  
  CreateObjectFuncType, DefaultLinkFuncType, DefaultLinkStyleFuncType, DefaultNodeFuncType, DefaultNodeProductStyleFuncStyle,
  DefaultNodeSectorStyleFuncStyle, DefaultNodeStyleFuncType, DefaultSankeyDataFuncType, 
  GetLinkValueFuncType,
  
  
  NodeContextHasAggregateFuncType,
  NodeContextHasDesaggregateFuncType, OSTooltpFuncType, 
  ReturnLocalLinkValueFuncType,
  ReturnLocalNodeValueFuncType, ReturnValueLinkFuncType, ReturnValueNodeFuncType, SetNodeStyleToTypeNodeFuncType,
  ToPrecisionFuncType} from './types/SankeyUtilsTypes'
import { Tooltip } from '@chakra-ui/react'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const default_element_color='#a9a9a9'



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
// export const FindMaxLinkValue:FindMaxLinkValueFuncType = (
//   max_node_value: number,
//   value_dict: SankeyLinkValueDict | SankeyLinkValue
// ): number => {
//   let new_max_node_value = max_node_value
//   // If input does not exist or does not contain any info, return
//   if (value_dict === undefined || Object.values(value_dict).length === 0) {
//     return new_max_node_value
//   }
//   // We need a recurrence here, because values are at the bottom of nested dicts (datatags)
//   // Such as :
//   // 'value': {
//   //   'value': {
//   //     ... {
//   //           'value': float
//   //           ... }
//   //     ... }
//   //   ... }
//   const child = Object.values(value_dict)[0]
//   if (typeof child === 'object') {
//     // Each link can contain multiple values, so we loop on each dict entry
//     Object.values(value_dict).forEach(v => {
//       const cur_max_value = FindMaxLinkValue(new_max_node_value, (v as unknown) as SankeyLinkValueDict)
//       new_max_node_value = (cur_max_value > new_max_node_value) ? cur_max_value : new_max_node_value
//     })
//   }
//   else { // If we reached the value, we can compare with ref max value
//     const tmp=(value_dict as SankeyLinkValue).value as number
//     new_max_node_value = (tmp && (tmp > new_max_node_value)) ? tmp : new_max_node_value
//   }
//   return new_max_node_value
// }


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
    legend_bg_color:default_element_color,
    legend_bg_opacity:0,
    legend_show_dataTags:false,
    node_label_separator:' - '

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
    color: default_element_color,
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
    color: default_element_color,
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

export interface DataSuiteType{
  is_catalog?:boolean,
  view?:{id: string,view_data: object,nom:string,details:string}[],
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

// Return value of local node variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const ReturnLocalNodeValue:ReturnLocalNodeValueFuncType=(n:SankeyNode,key:keyof SankeyNodeAttrLocal): string | number | boolean | null | undefined=>{
  return n.local?.[key]
}


// Assign the value to attribute of node style "n"
export const AssignNodeStyleAttribute:AssignNodeStyleAttributeFuncType = (n:SankeyNodeStyle,k:keyof SankeyNodeStyle,v:boolean|string|number): void=>{
  (n[k] as unknown)=v
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

// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
export const TooltipValueSurcharge=(k:string,t:TFunction)=>{
  return <OSTooltip label={t('Menu.overcharge_style_value')}>
    <FontAwesomeIcon style={{color:'#6cc3d5',height:'12',width:'12',float:'right'}} icon={faCircleInfo}/>
  </OSTooltip>
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
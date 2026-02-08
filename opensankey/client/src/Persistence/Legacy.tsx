// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import * as d3 from 'd3'
import { makeId, Type_JSON } from '../types/Utils'
import {
  SankeyNode,
  SankeyNodeStyle,
  ConvertDataLegacyFuncType,
  SankeyNodeAttrLocal,
  SankeyLinkAttrLocal,
  SankeyLink,
  SankeyLinkValue,
  SankeyLinkValueDict,
  TagsGroup,
  SankeyData,
  ConvertSankeyData,
  SankeyLinkStyle,
  convert_linksFuncType,
  convert_nodesFuncType,
  convert_tagsFuncType,
  ReturnValueNodeFuncType,
  AssignLinkLocalAttributeFuncType,
  CreateObjectFuncType,
  DefaultLinkFuncType,
  DefaultLinkStyleFuncType,
  DefaultNodeFuncType,
  DefaultNodeProductStyleFuncStyle,
  DefaultNodeSectorStyleFuncStyle,
  DefaultNodeStyleFuncType,
  ReturnLocalLinkValueFuncType,
  ReturnLocalNodeValueFuncType,
  ConvertSankeyLink,
  ConvertSankeyNode,
  ConvertSankeyValue,
  TagsCatalog
} from './LegacyType'
import { default_dx, default_dy } from '../Elements/ElementsAttributesConfig'


const default_element_color = '#a9a9a9'

// NODES *******************************************************************************************

/**
 * Return a Sankey Node, used at the creation of a new node
 * @param {SankeyData} data
 * @returns {SankeyNode}
 */
export const DefaultNode: DefaultNodeFuncType = (
  data: SankeyData
): SankeyNode => {
  const defaultNode: SankeyNode = {
    name: 'default',
    idNode: 'default',

    colorParameter: 'local',
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
    defaultNode.tags[tag_group_key] = []
  }
  return defaultNode
}

export const GetLinkValue = (
  data: SankeyData,
  idLink: string,
  up = false
): SankeyLinkValue => {
  const { links, dataTags } = data
  // Split the id and search for value after the original link id
  //  each value represent wich dataTag to choose among those where selected is at true in link.value
  // If there no dataTag (or no multiple dataTag selected then it take the first selected)
  let idDt: string[] = []
  if (Object.values(dataTags).filter(tagGroup => tagGroup.banner === 'multi').length > 0) {
    idDt = idLink.split('_')
    idDt.splice(0, 1)
  }

  const defaultInd = Object.values(data.dataTags)
    .map(d => {
      return Object.values((d as { tags: Record<string, unknown> }).tags).filter(t => (t as { selected: boolean }).selected).map((dd, i) => i)[0]
    })

  const index_dataTag = (idDt.length == 0) ? defaultInd : idDt.map(d => Number(d))

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
  Object.values(dataTags).filter(dataTag => (Object.keys(dataTag.tags).length != 0)).forEach((dataTag, i) => {
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
 * Return default style configuration for node
 * @return {*}
 */
const DefaultNodeStyle: DefaultNodeStyleFuncType = () => {
  return {
    idNode: 'default',
    name: 'Style par défaut',
    shape: 'rect',
    node_arrow_angle_factor: 30,
    node_arrow_angle_direction: 'right',
    shape_visible: true,
    label_visible: true,
    node_width: 40,
    node_height: 40,
    color: default_element_color,
    colorSustainable: false,
    not_to_scale: false,
    not_to_scale_direction: 'right',

    font_family: 'Cormorant',
    font_size: 14,
    uppercase: false,
    bold: false,
    italic: false,
    label_vert: 'bottom',
    label_horiz: 'middle',
    label_background: false,

    show_value: false,
    label_vert_valeur: 'top',
    label_horiz_valeur: 'middle',
    value_font_size: 14,
    label_box_width: 150,
    label_color: false,

    position: 'absolute',
    dy: default_dy,
    dx: default_dx,

    value_label_horiz_shift: 0,
    label_horiz_valeur_shift: 0,
    value_label_vert_shift: 0,
    label_vert_valeur_shift: 0,

    label_vert_shift: 0,
    name_label_vert_shift: 0,
    label_horiz_shift: 0,
    name_label_horiz_shift: 0
  }
}

/**
 * Return default style configuration for sector node
 * @return {*}
 */
export const DefaultNodeSectorStyle: DefaultNodeSectorStyleFuncStyle = () => {
  const node_style = DefaultNodeStyle()
  node_style.idNode = 'NodeSectorStyle'
  node_style.name = 'Noeud de type secteur'
  return node_style
}

/**
 * Return default style configuration for product node
 * @return {*}  {SankeyNodeStyle}
 */
export const DefaultNodeProductStyle: DefaultNodeProductStyleFuncStyle = (): SankeyNodeStyle => {
  const node_style = DefaultNodeStyle()
  node_style.shape = 'ellipse'
  node_style.idNode = 'NodeProductStyle'
  node_style.name = 'Noeud de type produit'
  return node_style
}

/**
 * Return default style configuration for exchange import node
 * @return {*}
 */
export const DefaultNodeImportCloseStyle: DefaultNodeSectorStyleFuncStyle = () => {
  const node_style = JSON.parse(JSON.stringify(DefaultNodeStyle())) as SankeyNodeStyle
  node_style.idNode = 'NodeImportCloseStyle'
  node_style.name = 'Noeuds de type importations'
  // relative
  node_style.position = 'relative'
  // parametric
  node_style.dy = 20
  // common import export
  node_style.label_visible = false
  node_style.shape_visible = false
  node_style.node_width = 1
  node_style.label_box_width = 300
  node_style.label_vert = 'middle'
  // label
  node_style.label_horiz = 'left'
  return node_style
}

/**
 * Return default style configuration for exchange export node
 * @return {*}
 */
export const DefaultNodeExportCloseStyle: DefaultNodeSectorStyleFuncStyle = () => {
  const node_style = JSON.parse(JSON.stringify(DefaultNodeStyle())) as SankeyNodeStyle
  node_style.idNode = 'NodeExportCloseStyle'
  node_style.name = 'Noeuds de type exportations'
  // relative
  node_style.position = 'relative'
  // parametric
  node_style.dy = 20
  // common import export
  node_style.label_visible = false
  node_style.shape_visible = false
  node_style.label_vert = 'middle'
  node_style.node_width = 0
  node_style.label_box_width = 300
  // label
  node_style.label_horiz = 'right'

  return node_style
}

// LINKS ******************************************************************************************

/**
 * Return default style configuration for link
 * @return {*}
 */
const DefaultLinkStyle: DefaultLinkStyleFuncType = () => {
  return {
    idLink: 'default',
    name: 'Style par défaut',
    color: default_element_color,
    recycling: false,
    curved: true,
    arrow: true,
    text_color: 'black',
    label_position: 'middle',
    orthogonal_label_position: 'middle',
    curvature: 0.5,
    label_visible: true,
    label_on_path: true,
    label_pos_auto: false,
    label_font_size: 20,
    orientation: 'hh',
    left_horiz_shift: 0.05,
    right_horiz_shift: 0.05,
    vert_shift: 0,
    opacity: 0.85,
    to_precision: false,
    scientific_precision: true,
    nb_scientific_precision: 5,
    arrow_size: 10,
    font_family: 'Arial,serif',
    label_unit_visible: false,
    label_unit: '',
    custom_digit: false,
    nb_digit: 0,
    dashed: false,

    starting_tangeant: 0.25,
    ending_tangeant: 0.25,
    color_rule: 'auto'
  }
}



// CONVERSIONS ************************************************************************************

/**
 * Permet de convertir les fichier de sauvegarde JSON pré-classes vers un standard attendu.
 *
 * (Code repris de convert_data du fichier SankeyConvert.tsx)
 *
 * @param {Type_JSON} json_object
 */
export const convert_data_legacy: ConvertDataLegacyFuncType = (
  json_object: Type_JSON,
): void => {
  const data_to_convert = json_object as unknown as SankeyData & ConvertSankeyData
  const { display_style, units_names } = data_to_convert
  if (display_style !== undefined) {
    display_style.font_family = [
      'Arial,sans-serif',
      'Helvetica,sans-serif',
      'Verdana,sans-serif',
      'Calibri,sans-serif',
      'Noto,sans-serif',
      'Lucida Sans,sans-serif',
      'Gill Sans,sans-serif',
      'Century Gothic,sans-serif',
      'Candara,sans-serif',
      'Futara,sans-serif',
      'Franklin Gothic Medium,sans-serif',
      'Trebuchet MS,sans-serif',
      'Geneva,sans-serif',
      'Segoe UI,sans-serif',
      'Optima,sans-serif',
      'Avanta Garde,sans-serif',
      'Times New Roman,serif',
      'Big Caslon,serif',
      'Bodoni MT,serif',
      'Book Antiqua,serif',
      'Bookman,serif',
      'New Century Schoolbook,serif',
      'Calisto MT,serif',
      'Cambria,serif',
      'Didot,serif',
      'Garamond,serif',
      'Georgia,serif',
      'Goudy Old Style,serif',
      'Hoefler Text,serif',
      'Lucida Bright,serif',
      'Palatino,serif',
      'Perpetua,serif',
      'Rockwell,serif',
      'Rockwell Extra Bold,serif',
      'Baskerville,serif',
      'Consolas,monospace',
      'Courier,monospace',
      'Courier New,monospace',
      'Lucida Console,monospace',
      'Lucidatypewriter,monospace',
      'Lucida Sans Typewriter,monospace',
      'Monaco,monospace',
      'Andale Mono,monospace',
      'Comic Sans,cursive',
      'Comic Sans MS,cursive',
      'Apple Chancery,cursive',
      'Zapf Chancery,cursive',
      'Bradley Hand,cursive',
      'Brush Script MT,cursive',
      'Brush Script Std,cursive',
      'Snell Roundhan,cursive',
      'URW Chancery,cursive',
      'Coronet script,cursive',
      'Florence,cursive',
      'Parkavenue,cursive'
    ]
    if (display_style.trade_close === undefined && (data_to_convert.version === '0.2' || data_to_convert.version === '0.3')) {
      display_style.trade_close = true
    }
    if (data_to_convert.version === '0.1') {
      display_style.trade_close = false
    }
    if ((data_to_convert.display_style.unit as unknown) as number === 1) {
      data_to_convert.display_style.unit = true
    }
  }
  if (data_to_convert.style_link === undefined) {
    data_to_convert.style_link = {}
  }
  Object.entries(data_to_convert.style_link).forEach(s => {
    //s[1] = Object.assign(JSON.parse(JSON.stringify(defaut_data.style_link['default'])), s[1])
    //data_to_convert.style_link[s[0]] = s[1]
    if (s[1].idLink === 'par défaut') {
      s[1].idLink = 'default'
    }
    // Change default behavior on right shift for link
    s[1].right_horiz_shift = 1.0 - s[1].right_horiz_shift
    //s[1].scientific_precision = true
    //@ts-expect-error xxx
    s[1].gradient = false
    //@ts-expect-error xxx
    s[1].name_label_vert = 'middle'
    //s[1].nb_digit = 0
  })
  if (data_to_convert.style_node === undefined) {
    data_to_convert.style_node = {}
  }
  Object.entries(data_to_convert.style_node).forEach(s => {
    //s[1] = Object.assign(JSON.parse(JSON.stringify(defaut_data.style_node['default'])), s[1])
    //data_to_convert.style_node[s[0]] = s[1]
    if (s[1].idNode === 'par défaut') {
      s[1].idNode = 'default'
    }
    //s[1].label_background = true
    if (s[1].label_horiz_valeur_shift) {
      s[1].value_label_horiz_shift = s[1].label_horiz_valeur_shift
    }
    if (s[1].label_vert_valeur_shift) {
      s[1].value_label_vert_shift = s[1].label_vert_valeur_shift
    }
    if (s[1].label_vert_shift) {
      s[1].name_label_vert_shift = s[1].label_vert_shift
    }
    if (s[1].label_horiz_shift) {
      s[1].name_label_horiz_shift = s[1].label_horiz_shift
    }
    //@ts-expect-error xxx
    s[1].name_label_separator = data_to_convert.node_label_separator
    //@ts-expect-error xxx
    s[1].name_label_separator_part = data_to_convert.node_label_separator_first == true |  data_to_convert.node_label_separator_first == undefined ? 'before' : 'after'
    if (s[1].label_color) {
      //@ts-expect-error xxx
      s[1].label_color = 'white'
    }
  })

  const attributes_to_remove = [
    'agregated_level',
    'show_data',
    'trade_close',
    'sankey_type',
    'previous_filter',
    'filtered_links',
    'filtered_nodes_names',
    'filtered_nodes',
    'nodes_names',
    'max_vertical_offset',
    'error',
    'nodes2units_conv',
    'nodes2tooltips'
  ]
  for (const attr in attributes_to_remove) {
    if (attributes_to_remove[attr] in data_to_convert) {
      delete ((data_to_convert as unknown) as { [key: string]: unknown })[attributes_to_remove[attr]]
    }
  }
  if ((data_to_convert.show_structure as unknown as boolean) === false || (data_to_convert.show_structure as unknown as boolean) === true) {
    data_to_convert.show_structure = 'reconciled'
  }
  if (data_to_convert.version === '0.1') {
    units_names.splice(1, 0, 'natural')
  }

  convert_tags(data_to_convert)
  convert_nodes(data_to_convert)
  convert_links(data_to_convert)

  let defaut_style = Object.values(data_to_convert.style_link).filter(s => s.name === 'Style par défaut') as SankeyLinkStyle & SankeyLinkStyle[]
  if (defaut_style.length > 0) {
    defaut_style = defaut_style[0] as SankeyLinkStyle & SankeyLinkStyle[]
    defaut_style.idLink = 'default'
  }

  if (data_to_convert.node_label_separator === undefined || data_to_convert.node_label_separator === null) {
    data_to_convert.node_label_separator = ' - '
  }
  if (data_to_convert.node_label_separator_first == undefined) {
    data_to_convert.node_label_separator_part = 'before'
  } else {
    data_to_convert.node_label_separator_part = data_to_convert.node_label_separator_first ? 'before' : 'after'
  }

  // Convert name variable for data version>0.9
  if (data_to_convert.display_style) {
    data_to_convert.filter_link_value = data_to_convert.display_style.filter
    data_to_convert.filter_label = data_to_convert.display_style.filter_label
  }

  // If data doesn't have var mask legend but show color palette of some grp tag then show legend
  if (data_to_convert.mask_legend === undefined) {
    const super_grp_tag = { ...data_to_convert.nodeTags, ...data_to_convert.fluxTags, ...data_to_convert.dataTags } as TagsCatalog
    if (Object.values(super_grp_tag).filter(grp => grp.show_legend).length > 0) {
      data_to_convert.mask_legend = false
    }
  } else {
    data_to_convert.mask_legend = !data_to_convert.mask_legend
  }

  // Group legend attr in a var
  const list_legacy_legend_var = [
    'legend_width',
    'legend_position',
    'mask_legend',
    'display_legend_scale',
    'legend_police',
    'legend_bg_border',
    'legend_bg_color',
    'legend_bg_opacity',
    'legend_show_dataTags']


  json_object.legend = {}
  const legend_var = json_object.legend
  for (const i in list_legacy_legend_var) {
    if (json_object[list_legacy_legend_var[i]] !== undefined) {
      legend_var[list_legacy_legend_var[i]] = json_object[list_legacy_legend_var[i]]
    }
  }
  json_object.legend['legacy_legend'] = true

  clean_data_local(data_to_convert)
  delete data_to_convert.style_link['LinkExportStyle']
  delete data_to_convert.style_link['LinkImportStyle']

  Object.values(data_to_convert.nodes).forEach(n => {
    // Change style if node has default style & 'Type de noeud' tags
    if (n.tags['type de noeud']) {
      if (n.tags['type de noeud'].includes('produit')) {
        //@ts-expect-error xxx
        n.style = ['NodeProductStyle']
      } else if (n.tags['type de noeud'].includes('secteur')) {
        //@ts-expect-error xxx
        n.style = ['NodeSectorStyle']
      } else if (n.tags['type de noeud'].includes('echange')) {
        const close = (n.trade_close && !data_to_convert.style_node['NodeImportStyle']) ||  (n.trade_close && data_to_convert.style_node['NodeImportStyle'] && data_to_convert.style_node['NodeImportStyle'].position === 'relative')
        if (close) {
          //@ts-expect-error xxx
          n.style = ['NodeSectorStyle', 'NodeImportExportCloseStyle']
        } else {
          //@ts-expect-error xxx
          n.style = ['NodeSectorStyle'/*, 'NodeImportExportAboveBelowStyle'*/]
          if (!n.local) n.local = {}
          // if (data_to_convert.style_node['NodeImportStyle'] && data_to_convert.style_node['NodeImportStyle'].label_visible == false && n.local!.label_visible != true) {
          //   n.local!.label_visible = false
          // }
          // if (data_to_convert.style_node['NodeImportStyle'] && data_to_convert.style_node['NodeImportStyle'].show_value == false && n.local!.show_value != true) {
          //   n.local!.show_value = false
          // }
          n.tags['type de noeud'] = ['secteur']

          n.local.shape_visible = false
          n.local.label_vert = 'middle'
          n.local.node_width = 0
          //n.local.label_box_width = 500

        }
        if (n.inputLinksId.length > 0) {
          if (close) {
            //@ts-expect-error xxx
            data_to_convert.links[n.inputLinksId[0]].style = ['LinkImportExportCloseStyle', 'LinkExportCloseStyle']
            //@ts-expect-error xxx
            n.style.push('NodeExportCloseStyle')
            delete data_to_convert.links[n.inputLinksId[0]].local!['left_horiz_shift']
            delete data_to_convert.links[n.inputLinksId[0]].local!['right_horiz_shift']
            delete data_to_convert.links[n.inputLinksId[0]].local!['starting_curve']
            delete data_to_convert.links[n.inputLinksId[0]].local!['ending_curve']
            delete data_to_convert.links[n.inputLinksId[0]].local!['starting_tangeant']
            delete data_to_convert.links[n.inputLinksId[0]].local!['ending_tangeant']
          } else {
            if (!n.local) n.local = {}
            n.local.label_horiz = 'right'
            if (data_to_convert.style_node['NodeExportStyle']) {
              const values = ["label_vert_valeur", "label_vert_valeur_shift", "label_horiz_valeur", "bold", "label_visible", "show_value", "value_font_size", ""]
              values.forEach(v => {
                //@ts-expect-error xxx
                if (n.local[v] == undefined)
                  //@ts-expect-error xxx
                  n.local[v] = data_to_convert.style_node['NodeExportStyle'][v]
              })
              n.local.name_label_horiz_shift = data_to_convert.style_node['NodeExportStyle'].label_horiz_shift
            }
            data_to_convert.links[n.inputLinksId[0]].local!.value_label_is_visible = false
            data_to_convert.links[n.inputLinksId[0]].local!.label_unit_visible = false

          }
        } else {
          if (!data_to_convert.links[n.outputLinksId[0]]) {
            return
          }
          if (close) {
            //@ts-expect-error xxx
            data_to_convert.links[n.outputLinksId[0]].style = ['LinkImportExportCloseStyle', 'LinkImportCloseStyle']
            //@ts-expect-error xxx
            n.style.push('NodeImportCloseStyle')
            delete data_to_convert.links[n.outputLinksId[0]].local!['left_horiz_shift']
            delete data_to_convert.links[n.outputLinksId[0]].local!['right_horiz_shift']
            delete data_to_convert.links[n.outputLinksId[0]].local!['starting_curve']
            delete data_to_convert.links[n.outputLinksId[0]].local!['ending_curve']
            delete data_to_convert.links[n.outputLinksId[0]].local!['starting_tangeant']
            delete data_to_convert.links[n.outputLinksId[0]].local!['ending_tangeant']
          } else {
            if (!n.local) n.local = {}
            n.local.label_horiz = 'left'
            if (data_to_convert.style_node['NodeImportStyle']) {
              const values = ["label_vert_valeur", "label_vert_valeur_shift", "label_horiz_valeur", "bold", "label_visible", "show_value", "value_font_size", ""]
              values.forEach(v => {
                //@ts-expect-error xxx
                if (n.local[v] == undefined)
                  //@ts-expect-error xxx
                  n.local[v] = data_to_convert.style_node['NodeImportStyle'][v]
              })
              n.local.name_label_horiz_shift = data_to_convert.style_node['NodeImportStyle'].label_horiz_shift
            }
            data_to_convert.links[n.outputLinksId[0]].local!.value_label_is_visible = false
            data_to_convert.links[n.outputLinksId[0]].local!.label_unit_visible = false


            // //@ts-expect-error xxx
            // data_to_convert.links[n.outputLinksId[0]].style = ['LinkImportExportAboveBelowStyle', 'LinkImportAboveStyle']
            // //@ts-expect-error xxx
            // n.style.push('NodeImportAboveStyle')
          }
        }
      }
    }
  })
  delete data_to_convert.style_node['NodeExportStyle']
  delete data_to_convert.style_node['NodeImportStyle']
}

/**
 * Function to clean local variable of nodes and links by
 * deleting local variable if they have the same value as the style
 * they're associated with
 * @param {SankeyData} data
 */
const clean_data_local = (data: SankeyData) => {
  // Clean nodes local
  Object.values(data.nodes).forEach(n => {
    if (n.local !== undefined && n.local !== null) {
      Object.keys(n.local).forEach((k_l: string) => {
        const k_l_c = k_l as keyof SankeyNodeAttrLocal
        const k_s_c = k_l as keyof SankeyNodeStyle
        // if (!data.style_node[n.style]) {
        //   console.log('Node style ' + n.style)
        //   console.log('Styles ' + Object.values(data.style_node).map(s=>s.idNode))
        //   return          
        // }

        if (data.style_node[n.style] && n.local && n.local[k_l_c] == data.style_node[n.style][k_s_c]) {
          delete n.local[k_l_c]
        }
      })
    }
  })
  // Clean links local
  Object.values(data.links).forEach(l => {
    if (l.local !== undefined && l.local !== null && l.style !== undefined) {
      Object.keys(l.local).forEach((k_l: string) => {
        const k_l_c = k_l as keyof SankeyLinkAttrLocal
        const k_s_c = k_l as keyof SankeyLinkStyle
        if (data.style_link[l.style] && l.local && (l.local[k_l_c] == data.style_link[l.style][k_s_c])) {
          delete l.local[k_l_c]
        }
      })
    }
  })
}

/**
 *
 * @param {SankeyData} data
 * @param {string[]} l
 * @returns {*}
 */
const CreateObject: CreateObjectFuncType = (data: SankeyData, l: string[]): SankeyLinkValueDict | SankeyLinkValue => {
  const { dataTags, fluxTags } = data
  if (l.length == 0) {
    const obj = Object.create({}) as SankeyLinkValue
    obj['value'] = ''
    obj['display_value'] = ''
    obj['tags'] = {}
    obj['extension'] = {}
    Object.entries(fluxTags).forEach(ft => {
      obj.tags[ft[0]] = []
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
export const DefaultLink: DefaultLinkFuncType = (data: SankeyData): SankeyLink => {
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
    style: 'default',
    local: {}
  }
}


// Return the value of an attribute from node :
// - If the node has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the node has (a node always has a style )
export const ReturnValueNode: ReturnValueNodeFuncType = (
  data: SankeyData,
  n: SankeyNode,
  k: keyof SankeyNodeAttrLocal | keyof SankeyNodeStyle
): string | number | boolean => {
  let value = ReturnLocalNodeValue(n, k as keyof SankeyNodeAttrLocal)
  if (value === undefined || value === null) {
    const ks = k as keyof SankeyNodeStyle
    value = n.style in data.style_node ? data.style_node[n.style][ks] : data.style_node['default'][ks]
  }
  return value
}

// Return value of local node variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
export const ReturnLocalNodeValue: ReturnLocalNodeValueFuncType = (n: SankeyNode, key: keyof SankeyNodeAttrLocal): string | number | boolean | null | undefined => {
  return n.local?.[key]
}

// Return the value of an attribute from link :
// - If the link has local attribute and local has "k" attribute then it return the local attribute (local or k can be undefined)
// - Else it return the attribute from the style the link has (a link always has a style )
export const ReturnValueLink = (data: SankeyData, l: SankeyLink, k: keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle): string | number | boolean => {
  let value = ReturnLocalLinkValue(l, k as keyof SankeyLinkAttrLocal)
  if (value === undefined || value === null) {
    const ks = k as keyof SankeyLinkStyle
    value = l.style in data.style_link ? data.style_link[l.style][ks] : (data.style_link['default'] ? data.style_link['default'][ks] : null)
  }
  //@ts-expect-error xxx
  return value
}

// Return value of local link variable attribute that can be undefined ('local' and 'local[key]' can be undefined)
const ReturnLocalLinkValue: ReturnLocalLinkValueFuncType = (l: SankeyLink, key: keyof SankeyLinkAttrLocal) => {
  if (l === undefined) {
    return undefined
  }
  if (l.local === undefined || l.local === null) {
    return undefined
  } else {
    return l.local[key]
  }
}

// Assign the value to local attribute (create local attribute if it doesn't exist and "k" attribute if it doesn't either)
export const AssignLinkLocalAttribute: AssignLinkLocalAttributeFuncType = (l: SankeyLink, k: keyof SankeyLinkAttrLocal, v: boolean | string | number) => {
  if (l.local === undefined || l.local === null) {
    l.local = {} as SankeyLinkAttrLocal
  }
  Object.assign(l.local, { [k.toString()]: v })
}

// TODO Remove if useless
// const compute_initial_colors: compute_initial_colorsFType = (
//   data: SankeyData
// ) => {
//   Object.values(data.nodeTags).forEach(
//     tags_group => {
//       if (Object.values(tags_group.tags).filter(tag => tag.color !== '').length === 0) {
//         const nb_tags = Object.keys(tags_group.tags).length
//         if (tags_group.color_map === 'custom') {
//           return
//         }
//         const colors = colormap({
//           colormap: tags_group.color_map,
//           nshades: Math.max(11, nb_tags),
//           format: 'hex',
//           alpha: 1
//         })
//         let step = 1
//         if (nb_tags < 11) {
//           step = Math.round(11 / nb_tags)
//         }
//         Object.keys(tags_group.tags).forEach(
//           (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
//         )
//       }
//     }
//   )

//   Object.values(data.fluxTags).forEach(
//     tags_group => {
//       if (Object.values(tags_group.tags).filter(tag => tag.color !== '').length === 0) {
//         const nb_tags = Object.keys(tags_group.tags).length
//         if (tags_group.color_map === 'custom') {
//           return
//         }
//         const colors = colormap({
//           colormap: tags_group.color_map,
//           nshades: Math.max(11, nb_tags),
//           format: 'hex',
//           alpha: 1
//         })
//         let step = 1
//         if (nb_tags < 11) {
//           step = Math.round(11 / nb_tags)
//         }
//         Object.keys(tags_group.tags).forEach(
//           (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
//         )
//       }
//     }
//   )

//   Object.values(data.dataTags).forEach(
//     tags_group => {
//       if (Object.values(tags_group.tags).filter(tag => tag.color !== '').length === 0) {
//         const nb_tags = Object.keys(tags_group.tags).length
//         if (tags_group.color_map === 'custom') {
//           return
//         }
//         const colors = colormap({
//           colormap: tags_group.color_map,
//           nshades: Math.max(11, nb_tags),
//           format: 'hex',
//           alpha: 1
//         })
//         let step = 1
//         if (nb_tags < 11) {
//           step = Math.round(11 / nb_tags)
//         }
//         Object.keys(tags_group.tags).forEach(
//           (tag_key, i) => tags_group.tags[tag_key].color = colors[i * step]
//         )
//       }
//     }
//   )
// }

// const convert_boolean: convert_booleanFType = (
//   data: SankeyData
// ) => {

//   Object.values(data.nodeTags).forEach(
//     tags_group => {
//       Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
//       tags_group.activated = Boolean(tags_group.activated)
//     }
//   )
//   Object.values(data.fluxTags).forEach(
//     tags_group => {
//       Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
//       tags_group.activated = Boolean(tags_group.activated)
//     }
//   )
//   Object.values(data.dataTags).forEach(
//     tags_group => {
//       Object.values(tags_group.tags).forEach(tag => tag.selected = Boolean(tag.selected))
//       tags_group.activated = Boolean(tags_group.activated)
//     }
//   )
// }

// const compute_flux_max: compute_flux_maxFType = (
//   data: SankeyData
// ): void => {
//   let flux_max = 0
//   const compute_flux_max_internal = (
//     dataTags: TagsGroup[],
//     v: SankeyLinkValue | SankeyLinkValueDict,
//     depth: number,
//     flux_max: number
//   ) => {
//     if (dataTags.length == 0 || depth === dataTags.length) {
//       if (v.value && v.value as number > flux_max) {
//         flux_max = v.value as number
//       }
//       return flux_max
//     }
//     const dataTag = Object.values(dataTags)[depth]
//     const listKey = Object.keys(dataTag.tags)

//     for (const i in listKey) {
//       if ((v as SankeyLinkValueDict)[listKey[i]]) {
//         if (v === undefined) {
//           break
//         }
//         flux_max = compute_flux_max_internal(dataTags, (v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]], depth + 1, flux_max)
//       }
//     }
//     return flux_max
//   }

//   const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
//   Object.values(data.links).forEach(
//     l => {
//       flux_max = compute_flux_max_internal(dataTagsArray, l.value as SankeyLinkValue, 0, flux_max)
//     }
//   )
//   if (data.display_style.filter_label === undefined) {
//     data.display_style.filter_label = flux_max / 10
//   }
// }


const convert_tags: convert_tagsFuncType = (
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
      group_name: 'Type de donnée',
      show_legend: false,
      color_map: 'custom',
      tags: {
        initial_data: { name: 'Données collectées', selected: true, color: 'cyan' },
        computed_data: { name: 'Données calculées', selected: true, color: 'blue' },
      },
      banner: 'multi',
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
    ([key, tags_group]) => {
      if (tags_group.banner === 'display' || key === 'flux_types' || key === 'Uncert') {
        data.fluxTags[key] = { ...tags_group }
        data.fluxTags[key].banner = 'none'
      }
      if (tags_group.banner == 'movie') {
        tags_group.banner = 'sequence'
        Object.values(tags_group.tags).forEach((tag, idx) => {
          tag.selected = idx == 0
        })
      }
    }
  )
  const new_dataTags = Object.entries(data.dataTags).filter(([key, tag_group]) => tag_group.banner !== 'display' && key !== 'flux_types' && key !== 'Uncert')
  data.dataTags = Object.assign({}, ...new_dataTags.map(([key, v]) => ({ [key]: { ...v } })))

  const has_product = Object.values(data.nodes).filter(n => ((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
  if (has_product) {
    if (!('Type de noeud' in data.nodeTags)) {
      data.nodeTags['Type de noeud'] = {
        group_name: 'Type de noeud',
        tags: {
          'produit': {
            name: 'produit',
            selected: true,
            color: '',
            shape: 'ellipse'
          },
          'secteur': {
            name: 'secteur',
            selected: true,
            color: '',
            shape: 'rect'
          },
          'echange': {
            name: 'échange',
            selected: true,
            color: '',
            shape: 'rect'
          }
        },
        color_map: '',
        show_legend: false,
        banner: 'none',
        activated: true,
        siblings: []
      }
    }
  }
  if (data.nodeTags['Type de noeud']) {
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
    if (Object.keys(data.style_node).includes('style_node_prod')) {
      delete data.style_node['style_node_prod']
    }
    if (Object.keys(data.style_node).includes('style_node_sect')) {
      delete data.style_node['style_node_sect']
    }
    // // If data has NodeTags 'Type de noeud' but not the style associated to it
    // // then add it
    // if (!Object.keys(data.style_node).includes('NodeProductStyle')) {
    //   data.style_node['NodeProductStyle'] = DefaultNodeProductStyle()
    // }
    // if (!Object.keys(data.style_node).includes('NodeSectorStyle')) {
    //   data.style_node['NodeSectorStyle'] = DefaultNodeSectorStyle()
    // }
  }

  if (data.nodeTags.Dimensions) {
    Object.keys(data.nodeTags.Dimensions.tags).forEach(tag => {
      // Protection
      if (data.levelTags === undefined)
        data.levelTags = {} as TagsCatalog
      // Creating leveltag
      data.levelTags[tag] = {
        group_name: data.nodeTags.Dimensions.tags[tag].name,
        color_map: 'jet',
        show_legend: false,
        banner: 'level',
        tags: {},
        activated: true,
        siblings: []
      }
      Object.values(data.nodes).forEach(n => {
        if (n.dimensions[tag]) {
          n.tags[tag] = [String((n.dimensions[tag].level ?? 0))]
        }
        if ('Dimensions' in n.tags) {

          delete n.tags.Dimensions
        }
      })

      let max_level = 1
      Object.values(data.nodes).forEach(n => {
        if (n.dimensions[tag] && (n.dimensions[tag].level ?? 0) > max_level) {
          max_level = n.dimensions[tag].level ?? 0
        }
      })
      Object.values(data.nodes).forEach(n => {
        if (n.dimensions[tag]) {
          const dim_desagregate_nodes = Object.values(data.nodes).filter(n2 => n2.dimensions[tag] && n2.dimensions[tag].parent_name === n.idNode)
          if (dim_desagregate_nodes.length == 0) {
            for (let level = 2; level <= max_level; level++) {
              n.tags[tag].push(String(level))
            }
          }
        }
      })
      for (let level = 1; level <= max_level; level++) {
        data.levelTags[tag]['tags'][String(level)] = {
          name: String(level),
          selected: level == 1
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
      if (l_convert.subchain && l_convert.subchain !== '') {
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
      if ('Type de noeud' in n.tags && n.tags['Type de noeud'].includes('échange')) {
        n.tags['Type de noeud'].push('echange')
        n.tags['Type de noeud'].splice(n.tags['Type de noeud'].indexOf('échange'), 1)
      }
      if ('Type de noeud' in n.tags && n.tags['Type de noeud'].includes('echange')) {
        if (n.inputLinksId.length === 0) {
          const link = data.links[n.outputLinksId[0]]
          if (!link) {
            return
          }
          const target_node = data.nodes[link.idTarget]

          Object.keys(target_node.tags).forEach(tag_key => {
            if (tag_key === 'Type de noeud') {
              return
            }
            n.tags[tag_key] = JSON.parse(JSON.stringify(target_node.tags[tag_key]))
          })
        } else {
          const link = data.links[n.inputLinksId[0]]
          if (!link) {
            return
          }
          link.idTarget = n.idNode
          const source_node = data.nodes[link.idSource]
          Object.keys(source_node.tags).forEach(tag_key => {
            if (tag_key === 'Type de noeud') {
              return
            }
            n.tags[tag_key] = JSON.parse(JSON.stringify(source_node.tags[tag_key]))
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
          'initial_data': { name: 'Données collectées', selected: true, color: '#696969' },
          'computed_data': { name: 'Données calculées', selected: true, color: '#D3D3D3' },
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
  // if (!('Primaire' in data.levelTags)) {
  //   data.levelTags['Primaire'] = {
  //     group_name: 'Primaire',
  //     show_legend: false,
  //     color_map: 'custom',
  //     tags: {
  //       '1': { name: '1', selected: true, color: '#696969' }
  //     },
  //     banner: 'level',
  //     activated: true,
  //     siblings: []
  //   }
  // }
  // if (Object.values(data.levelTags).length > 1) {
  //   data.levelTags['Primaire'].activated = false
  // }
  if (('Primaire' in data.levelTags) && Object.values(data.levelTags).length > 1) {
    delete data.levelTags['Primaire']
  }
  // Convertie les anciens groupTag des données issu d'un excel qui ont pour valeur 1 ou 0 pour signifier un boolean
  Object.values(data.nodeTags).forEach(t => {
    t.show_legend = typeof (t.show_legend) == 'boolean' ? t.show_legend : ((t.show_legend === 1))
    t.siblings = t.siblings ? t.siblings : []
  })
  Object.values(data.fluxTags).forEach(t => {
    t.show_legend = typeof (t.show_legend) == 'boolean' ? t.show_legend : ((t.show_legend === 1))
    t.siblings = t.siblings ? t.siblings : []
  })
  Object.values(data.dataTags).forEach(t => {
    t.show_legend = typeof (t.show_legend) == 'boolean' ? t.show_legend : ((t.show_legend === 1))
    t.siblings = t.siblings ? t.siblings : []
  })

  // Convertie les nodeTags avec pour bannière 'level' en levelTags
  if (has_not_converted_nodeTags_as_levelTags(data) || 'Primaire' in data.nodeTags) {
    data.levelTags = Object.assign({}, data.levelTags, Object.fromEntries(Object.entries(data.nodeTags).filter(nt => nt[1].banner === 'level' || nt[0] == 'Primaire')))
    Object.values(data.levelTags).forEach(tag => tag.banner = 'level')
    data.nodeTags = Object.fromEntries(Object.entries(data.nodeTags).filter(nt => nt[1].banner !== 'level' && nt[0] !== 'Primaire'))
  }
  Object.entries(data.nodeTags).forEach(tagg => {
    // happen for RefFlux volaille
    if ('siblings' in tagg[1] && tagg[1].siblings.length > 0) {
      data.levelTags[tagg[0]] = tagg[1]
      delete data.nodeTags[tagg[0]]
    } else if (Object.keys(data.nodeTags[tagg[0]].tags)[0] == '1') {
      data.levelTags[tagg[0]] = tagg[1]
      delete data.nodeTags[tagg[0]]
    }
  })

  // Assign colorMap to either fluxTags or nodesTags since now we can display color palette of both at the same time
  const list_fluxTag = Object.entries(data.fluxTags).filter(ft => ft[1].show_legend)
  const list_nodeTag = Object.entries(data.nodeTags).filter(ft => ft[1].show_legend)
  if (list_fluxTag.length > 0) {
    data.linksColorMap = list_fluxTag[0][0]
  }
  if (list_nodeTag.length > 0) {
    data.nodesColorMap = list_nodeTag[0][0]
  }

  if (data.nodeTags['Type de noeud'] != undefined) {
    data.nodeTags['type de noeud'] = JSON.parse(JSON.stringify(data.nodeTags['Type de noeud']))
    delete data.nodeTags['Type de noeud']
    Object.values(data.nodes).forEach(n => {
      if (n.tags['Type de noeud'] !== undefined) {
        n.tags['type de noeud'] = JSON.parse(JSON.stringify(n.tags['Type de noeud']))
        delete n.tags['Type de noeud']
        // if (n.tags['type de noeud'][0] == 'echange') {
        //   if (n.style == 'default') {
        //   if (n.inputLinksId.length === 0) {
        //     n.style = 'NodeImportCloseStyle'
        //     if (n.outputLinksId.length !== 0) {
        //       data.links[n.outputLinksId[0]].style = 'LinkImportCloseStyle'
        //     }
        //   } else if (n.outputLinksId.length === 0) {
        //     n.style = 'NodeImportCloseStyle'
        //     if (n.inputLinksId.length !== 0) {
        //       data.links[n.inputLinksId[0]].style = 'LinkExportCloseStyle'
        //     }
        //   }
        // }
      }
    })
  }
  Object.values(data.nodeTags).forEach(t => {
    t.use_colors = t.show_legend
  })
  Object.values(data.fluxTags).forEach(t => {
    t.use_colors = t.show_legend
  })
  Object.values(data.dataTags).forEach(t => {
    t.use_colors = t.show_legend
  })
  Object.values(data.levelTags).forEach(t => {
    t.use_colors = t.show_legend
    t.banner = 'one'
  })
}

export const NodeHasDisplayedLevel = (
  data: SankeyData,
  n: SankeyNode
) => {
  let to_display = true
  // Check if there is other aggregation tags than 'Primaire',
  //const multi_level=Object.entries(data.levelTags).filter(nt=> nt[0]!=='Primaire').map(nt=>nt[0]).length>0

  //const only_one_activated= Object.entries(data.levelTags).filter(nt=> nt[1].activated).length==1
  //const only_primaire_activated= Object.entries(data.levelTags).filter(nt=> nt[1].activated).map(nt=>nt[0])[0]=='Primaire'

  //onst multy_but_only_primaire=multi_level && only_one_activated && only_primaire_activated

  // To display a node according to level tag we search if:
  // - The node grp tag banner is 'level'
  // - The node.nodeTags have more level grp tag than 'Primaire', if that's the case we don't use grp tag 'Primaire' in the filter of node grp tag
  // - The node grp tag is activated (variable is set false if we activate another grp tag that has this grp tag in variable sibling)
  // - The node has the grp tag name in his tags
  Object.entries(data.levelTags).filter(nt => nt[1].activated).forEach(nt => {
    // Check tags from the group attribued to the node
    // If the node don't have tag attribued from the group then it is not affected by filter and we display it
    const node_tags_attr = n.tags[nt[0]]
    if (node_tags_attr != undefined && node_tags_attr.length != 0) {
      // If the node has at least 1 tag from the selected tag of the group then we display it
      // If the node has tag from the group attribued to it but are not selected then we don't display it
      const tags_from_grp_to_display = Object.values(nt[1].tags).filter(t => t.selected).map(t => t.name)
      to_display = (node_tags_attr.filter(t => tags_from_grp_to_display.includes(t)).length > 0) ? to_display : false
    } else if (n.dimensions[nt[0]] && n.dimensions[nt[0]].children_tags != undefined && n.dimensions[nt[0]].children_tags!.length != 0) {
      const tags_from_grp_to_display = Object.values(nt[1].tags).filter(t => t.selected).map(t => t.name)
      to_display = (n.dimensions[nt[0]].children_tags!.filter(t => tags_from_grp_to_display.includes(t)).length > 0) ? to_display : false
    } else if (n.dimensions[nt[0]] && n.dimensions[nt[0]].force_show_children) {
      to_display = false
    }
  })
  return to_display
}

const convert_nodes: convert_nodesFuncType = (
  data: SankeyData
) => {
  const data_to_convert = data as SankeyData & ConvertSankeyData
  const default_n = DefaultNode(data)

  // If node has old 'id' attribute, convert it to new one 'idNode'
  if (Object.keys(data.nodes).length > 0 && !Object.values(data.nodes)[0].idNode) {
    Object.values(data.nodes).forEach(n => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
  }

  const has_product = Object.values(data.nodes).filter(n => ((n as unknown) as ConvertSankeyNode).type === 'product').length > 0
  const list_key_nodes = Object.values(data.nodes).map(n => n.idNode)

  Object.values(data.nodes).forEach(n => {
    const n_depreciated = (n as unknown) as ConvertSankeyNode

    if (n_depreciated.input_links) {
      n.inputLinksId = []
      n.outputLinksId = [];
      (n_depreciated.input_links as number[]).forEach(link_idx => {
        n.inputLinksId.push('link' + link_idx)
      });
      (n_depreciated.output_links as number[]).forEach(link_idx => {
        n.outputLinksId.push('link' + link_idx)
      })
      delete n_depreciated.output_links
      delete n_depreciated.input_links
      delete n_depreciated.id
    }

    // ==================================================================
    // CONVERSION D'ATTRIBUT OBLIGATOIRE DES NOEUDS EN VARIABLES LOCAL
    if (n_depreciated.display_style !== undefined) {
      n.local = (n.local != undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      if (n_depreciated.display_style?.label_vert === 'haut') {
        n_depreciated.display_style.label_vert = 'top'
      }
      if (n_depreciated.display_style?.label_vert === 'milieu') {
        n_depreciated.display_style.label_vert = 'middle'
      }
      if (n_depreciated.display_style?.label_vert === 'bas') {
        n_depreciated.display_style.label_vert = 'bottom'
      }
      if (n_depreciated.display_style?.label_horiz === 'droite') {
        n_depreciated.display_style.label_horiz = 'right'
      }
      if (n_depreciated.display_style?.label_horiz === 'milieu') {
        n_depreciated.display_style.label_horiz = 'middle'
      }
      if (n_depreciated.display_style?.label_horiz === 'gauche') {
        n_depreciated.display_style.label_horiz = 'left'
      }
      if (n_depreciated.display_style && n_depreciated.display_style?.font_family === undefined) {
        n_depreciated.display_style.font_family = 'Arial,serif'
      }

      n.local.font_family = n_depreciated.display_style?.font_family
      n.local.label_vert = n_depreciated.display_style?.label_vert
      n.local.label_horiz = n_depreciated.display_style?.label_horiz
      n.local.font_size = Number(n_depreciated.display_style?.font_size)
      n.local.value_font_size = Number(n_depreciated.display_style?.value_font_size)
      n.local.bold = n_depreciated.display_style?.bold
      n.local.uppercase = n_depreciated.display_style?.uppercase
      n.local.italic = n_depreciated.display_style?.italic
      n.local.label_box_width = n_depreciated.display_style?.label_box_width
      n.local.label_color = n_depreciated.display_style?.label_color
      n.local.value_font_size = n_depreciated.display_style?.value_font_size
      n.local.label_horiz_valeur = n_depreciated.display_style?.label_horiz_valeur
      n.local.label_vert_valeur = n_depreciated.display_style?.label_vert_valeur

      n.local.label_box_width == 0 ? n.local.label_box_width = 150 : n.local.label_box_width


      delete n_depreciated.display_style
    }

    // Assign ancienement attribut de noeud obligatoires en tant que var local
    if (n_depreciated.visible === 1) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape_visible = true
    }
    if (n_depreciated.visible === 0) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape_visible = false
    }
    if (n_depreciated.shape_visible || n_depreciated.display) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape_visible = (n_depreciated.shape_visible as boolean)
      delete n_depreciated.shape_visible
      //delete n_depreciated.display
    }
    if (n_depreciated.shape && ((n.local && n.local.shape == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape = n_depreciated.shape as 'ellipse' | 'rect' | 'arrow'
      delete n_depreciated.shape

    }
    if (n_depreciated.node_width && ((n.local && n.local.node_width == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.node_width = (n_depreciated.node_width)
      delete n_depreciated.node_width

    }
    if (n_depreciated.node_height && ((n.local && n.local.node_height == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.node_height = (n_depreciated.node_height)
      delete n_depreciated.node_height
    }

    if (n_depreciated.color && ((n.local && n.local.color == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {}
      n.local.color = (n_depreciated.color)
      delete n_depreciated.color
    }
    if (n_depreciated.colorSustainable && ((n.local && n.local.colorSustainable == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.colorSustainable = (n_depreciated.colorSustainable)
      delete n_depreciated.colorSustainable
    }
    if (n_depreciated.type) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.shape = n_depreciated.type === 'product' ? 'ellipse' : 'rect'
      if (has_product && !n.tags['Type de noeud']) {
        n.tags['Type de noeud'] = []
      }
      if (has_product && n.tags['Type de noeud'].length === 0) {
        n.tags['Type de noeud'].push(n_depreciated.type === 'product' ? 'produit' : 'secteur')
      }
      delete n_depreciated.type
    }
    if (n_depreciated.label_visible && ((n.local && n.local.label_visible == undefined) || n.local === undefined)) {
      n.local = (n.local !== undefined && n.local !== null) ? n.local : {} as SankeyNodeAttrLocal
      n.local.label_visible = (n_depreciated.label_visible as boolean)
    }
    if (n_depreciated.node_visible !== undefined && n_depreciated.display !== undefined) {
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
    if ('position' in n) {
      if (n.local == undefined) {
        n.local = {}
      }
      n.local.position = n.position as 'absolute' | 'relative' | 'parametric' | undefined
      delete n.position
    }

    // if (n.tags['type de noeud'] && n.tags['type de noeud'] && n.tags['type de noeud'][0]=='echange' && n.local != undefined) {
    //   if (n.local.position=='absolute' && !trade_set) {
    //     trade_set = true
    //     setTrade(data)
    //   } else if (n.local.position == undefined && !n.trade_close ) {
    //     trade_set = true
    //     setTrade(data)
    //   }
    // }

    delete n_depreciated.visible

    n.name = n.name.split('\\n').join(' ')

    const attributes_to_remove = ['tooltips', 'total_input_offset', 'input_offsets', 'total_output_offset', 'output_offsets', 'horizontal_index', 'title_length', 'old_color']
    for (const attr in attributes_to_remove) {
      if (attributes_to_remove[attr] in n_depreciated) {
        delete ((n_depreciated as unknown) as { [key: string]: unknown })[attributes_to_remove[attr]]
      }
    }

    if (n.tags && n.tags['Exchanges'] && n.tags['Exchanges'].length > 0 && (n.tags['Exchanges'][0].includes('mport') || n.tags['Exchanges'][0].includes('xport')) && n_depreciated.trade_close) {
      //n.position = 'relative'
      n.x = n.tags['Exchanges'][0].includes('import') ? -(data_to_convert.trade_close_hspace as number) : data_to_convert.trade_close_hspace as number
      n.y = n.tags['Exchanges'][0].includes('import') ? -(data_to_convert.trade_close_vspace as number) : data_to_convert.trade_close_vspace as number
    }
    // if (!('Primaire' in n.dimensions)) {
    //   n.dimensions['Primaire'] = { level: 1, parent_name: undefined }
    // }
    if (n.tags['Exchanges'] && n.tags['Exchanges'][0] !== 'interior') {
      n.tags['type de noeud'] = ['echange']
      if (n.outputLinksId.length > 0) {
        n.style = 'NodeImportCloseStyle'
        data.links[n.outputLinksId[0]].style = 'LinkImportCloseStyle'
      } else {
        n.style = 'NodeImportCloseStyle'
        data.links[n.inputLinksId[0]].style = 'LinkExportCloseStyle'
      }

      if (!n.dimensions) {
        n.dimensions = {}
      }
      if (data_to_convert.trade_sectors) {
        if (n.tags['Exchanges'][0].includes((data_to_convert.trade_sectors as string[])[0].split(' - ')[0])) {
          n.dimensions = { 'Echanges': { level: 1, parent_name: undefined } }
          if (!('Echanges' in n.tags)) {
            n.tags.Echanges = []
          }
        } else {
          const names = n.name.split(' - ')
          names[1] = (data_to_convert.trade_sectors as string[])[0].split(' - ')[0]
          const parent_name = names.join(' - ')
          const parent_node = Object.values(data.nodes).filter(n => n.name === parent_name)[0]
          if (parent_node) {
            n.dimensions = { 'Echanges': { level: 2, parent_name: parent_node.idNode } }
          }
          if (!('Echanges' in n.tags)) {
            n.tags.Echanges = []
          }
        }
      }
    }
    delete n.tags['Exchanges']

    // Nodes with type Echanges did not have the correct dimensions
    if (n.tags['Echanges']) {
      const new_dimensions = {
        //'Primaire': n.dimensions['Primaire'],
        'Echanges': n.dimensions['Echanges']
      }
      n.dimensions = new_dimensions
    }


    // Filter out variable in the node that are null or undefined so they can be attribued the default value
    n = (Object.fromEntries(Object.entries(n).filter(kn => kn[1] !== null && kn[1] !== undefined)) as SankeyNode)

    // Fill missing variable from incoming node with default value so the node has the required structure
    n = Object.assign(JSON.parse(JSON.stringify(default_n)), n)

    // Search if nodes reference parent that doesn't exist
    if (n.dimensions) {
      Object.entries(n.dimensions).filter(nd => !nd[1] || (nd[1].parent_name && !list_key_nodes.includes(nd[1].parent_name))).forEach(nd => {
        delete n.dimensions[nd[0]]
      })
    }

    type OSP_type = {
      FO_content: string,
      has_FO: boolean,
      is_FO_raw: boolean,

      image?: string
      is_image: boolean,
      image_src: string,
    }

    const nn = n as unknown as OSP_type
    if (nn.image != undefined && nn.FO_content == nn.image) {
      nn.has_FO = false
      nn.FO_content = ''
      nn.is_image = true
      nn.image_src = nn.image.split('\'')[1]
      delete nn.image
    }



    data.nodes[n.idNode] = n

    // if (n.local?.local_aggregation == false && !NodeHasDisplayedLevel(data,n)){
    //   delete n.local?.local_aggregation
    // } else if (n.local?.local_aggregation == true && NodeHasDisplayedLevel(data,n)){
    //   delete n.local?.local_aggregation
    // }
    const forceShowParent = (
      data: SankeyData,
      node: SankeyNode,
      dim: string
    ) => {
      let children = Object.values(data.nodes).filter(nn => dim in nn.dimensions)
      children = children.filter(nn => nn.dimensions[dim].parent_name == node.idNode)
      children.forEach(child => {
        if (child == node) return
        child.dimensions[dim].force_show_parent = true
        treatExchangeNodes(data, child, dim, false)
        if (!NodeHasDisplayedLevel(data, child)) {
          forceShowParent(data, child, dim)
        }
      })
    }

    const forceShowChildren = (
      data: SankeyData,
      node: SankeyNode,
      dim: string
    ) => {
      // quand un neoud est à force_children il faut remonter tous ces ancêtres
      // jusqu'à celui qui est normalement visible d'aprés les tags de niveaux
      const parents = Object.entries(node.dimensions).filter(cur_dim => cur_dim[0] == dim && cur_dim[1].parent_name != undefined)
      if (parents.length == 0) {
        return
      }
      const parent = parents[0][1].parent_name!
      data.nodes[parent].dimensions[dim].force_show_children = true
      if (!NodeHasDisplayedLevel(data, data.nodes[parent])) {
        forceShowChildren(data, data.nodes[parent], dim)
      }
    }

    const treatExchangeNodes = (
      data: SankeyData,
      node: SankeyNode,
      dim: string,
      set_children: boolean
    ) => {
      // Check if there are possible Exchange nodes
      if (!data.nodeTags['type de noeud']) {
        return
      }

      // All input exchange nodes must also be desaggregated
      node.inputLinksId
        .forEach(lid => {
          const input_node = data.nodes[data.links[lid].idSource]
          if (input_node.tags['type de noeud'][0] == 'echange') {
            if (set_children) {
              input_node.dimensions[dim].force_show_children = true
            } else {
              input_node.dimensions[dim].force_show_parent = true
            }
          }
        })

      // All input exchange nodes must also be desaggregated
      node.outputLinksId
        .forEach(lid => {
          if (!data.links[lid]) {
            console.log(lid)
            console.log(Object.values(data.links).filter(l => l.idLink.includes('Ethanol')))
            return
          }
          const output_node = data.nodes[data.links[lid].idTarget]
          if (output_node.tags['type de noeud'] == undefined) {
            output_node.tags['type de noeud'] = []
          }
          if (output_node.tags['type de noeud'][0] == 'echange') {
            if (set_children) {
              output_node.dimensions[dim].force_show_children = true
            } else {
              output_node.dimensions[dim].force_show_parent = true
            }
          }
        })
    }

    const is_exchange = data.nodeTags['type de noeud'] && n.tags['type de noeud'] && (n.tags['type de noeud'][0] == 'echange')
    const local_aggregation = n.local?.local_aggregation
    if (local_aggregation != undefined && !is_exchange) {
      Object.entries(n.dimensions).forEach(dim => {
        if (!data.levelTags[dim[0]]) {
          return
        }
        // if (!data.levelTags[dim[0]].activated) {
        //   return
        // }
        const node_tags_attr = n.tags[dim[0]]
        if (node_tags_attr != undefined && node_tags_attr.length != 0) {
          // If the node has at least 1 tag from the selected tag of the group then we display it
          // If the node has tag from the group attribued to it but are not selected then we don't display it
          const tags_from_grp_to_display = Object.values(data.levelTags[dim[0]].tags).filter(t => t.selected).map(t => t.name)
          const tag_visible = data.levelTags[dim[0]].activated && node_tags_attr.filter(t => tags_from_grp_to_display.includes(t)).length > 0
          if (!tag_visible && local_aggregation) {
            // Force to show this node
            if ((data.levelTags[dim[0]].activated || +node_tags_attr[0] > +tags_from_grp_to_display[0]) &&
              dim[1].parent_name &&
              data.nodes[dim[1].parent_name!].local &&
              data.nodes[dim[1].parent_name!].local!.local_aggregation == false
            ) {
              dim[1].force_show_children = true
              forceShowChildren(data, n, dim[0])
              treatExchangeNodes(data, n, dim[0], true)
            } else {
              forceShowParent(data, n, dim[0])
            }
          } /*else if (tag_visible && !local_aggregation) {
            if (+node_tags_attr[0] <= +tags_from_grp_to_display[0]) {
              dim[1].force_show_children = true
            }
          }*/
        }
      })
    }

    // ================================================
    // Convert dimension for application version >= 0.9
    const tmp = Object.entries(n.tags)
      .filter(nt => nt[0] in data_to_convert.levelTags)
    tmp.forEach(nt => {
      const leveltagg_tags_ids = nt[1]
      const leveltagg_id = nt[0]
      if (!n.dimensions[leveltagg_id]) {
        n.dimensions[leveltagg_id] = {}
      }
      if (leveltagg_tags_ids.includes('0')) {
        // if level is 0 we craate the dimension with antitag set_to_true.
        // in old version the dimensions was not existing as the visibility was
        // handled with the tag mechanism
        n.dimensions[leveltagg_id] = {}
        n.dimensions[leveltagg_id].antitag = true
      } else if (n.dimensions[leveltagg_id]) {
        const all_leveltagg_tags_ids = Object.keys(data_to_convert.levelTags[leveltagg_id].tags)
        if (all_leveltagg_tags_ids.indexOf(leveltagg_tags_ids[0]) == -1) {
          leveltagg_tags_ids[0] = String(+leveltagg_tags_ids[0] - 1)
        }
        // Dimension detection
        const parent_id = n.dimensions[leveltagg_id]['parent_name']
        if (parent_id) {
          if (!(leveltagg_id in data.nodes[parent_id].dimensions)) {
            // the condition above allows to correct bad parentship relation in legacy files
            return
          }
          let possible_parent_tag = ''
          possible_parent_tag = all_leveltagg_tags_ids[all_leveltagg_tags_ids.indexOf(leveltagg_tags_ids[0]) - 1]
          n.dimensions[leveltagg_id].children_tags = leveltagg_tags_ids
          n.dimensions[leveltagg_id].parent_tag = possible_parent_tag
        } else if (
          Object.keys(n.dimensions[leveltagg_id]).length == 0 && n.tags[leveltagg_id] &&
          Object.keys(data_to_convert.levelTags[leveltagg_id].tags).indexOf(n.tags[leveltagg_id][0]) >= 1
        ) {
          if (n.dimensions['Primaire'] && n.dimensions['Primaire'].parent_name) {
            let parent_tag: number | undefined
            const parent_dimensions = data.nodes[n.dimensions['Primaire'].parent_name!].dimensions
            if (leveltagg_id in parent_dimensions && parent_dimensions[leveltagg_id].level) {
              parent_tag = data.nodes[n.dimensions['Primaire'].parent_name!].dimensions[leveltagg_id].level
            } else if (leveltagg_id in parent_dimensions && parent_dimensions[leveltagg_id].children_tags) {
              parent_tag = +data.nodes[n.dimensions['Primaire'].parent_name!].dimensions[leveltagg_id].children_tags![0]
            } else if (leveltagg_id in parent_dimensions && !parent_dimensions[leveltagg_id].level) {
              parent_tag = 1
            }
            if (parent_tag) {
              const curLevelTag = n.tags[leveltagg_id]
              let children_tags = [String(+parent_tag + 1)]
              if (+curLevelTag[0] == +parent_tag + 2) {
                // in old file the continuity between levels could be missing
                // Exemple in Carbone 4 we were jumping from 2 to 4 so we correct
                // by 3:4
                children_tags = [...children_tags, ...curLevelTag]
              }
              n.dimensions[leveltagg_id] = {
                parent_tag: String(parent_tag),
                parent_name: n.dimensions['Primaire'].parent_name,
                children_tags: children_tags
              }
            }
          } else if (!(n.tags['Primaire'] as string[]).includes('1') && (n.dimensions['Primaire'] && !n.dimensions['Primaire'].parent_name)) {
            n.dimensions[leveltagg_id] = {}
            n.dimensions[leveltagg_id].antitag = true
          }
        }
      }


      // Code below is to correct bad parentship relation coming from legacy
      // Get lists of parents
      // const node_parents_id = (node: SankeyNode) => {
      //   return Object.values(node.dimensions).filter(dim => dim.parent_name).map(dim => dim.parent_name)
      // }
      // for a given parent retrieves the corresponding dim
      // const parent_dim = (node: SankeyNode, parent_id: string) => {
      //   return Object.entries(node.dimensions).filter(dim => data.levelTags[dim[0]].activated && dim[1].parent_name == parent_id).map(dim => dim[0])
      // }
      const pid = n.dimensions[leveltagg_id].parent_name
      if (!pid) {
        return
      }
      Object.entries(data.nodes[pid].dimensions).forEach(([pk, pdim]) => {
        if (!data.levelTags[pk]) {
          return
        }
        if (!data.levelTags[pk].activated) {
          return
        }
        if (pdim.antitag || (data.nodes[pid].tags[pk] && data.nodes[pid].tags[pk][0] == '0')) {
          return
        }
        const grand_parent_id = pdim.parent_name
        if (grand_parent_id == undefined) {
          return
        }
        Object.entries(n.dimensions).forEach(([k, dim]) => {
          if (data.levelTags[k] == undefined) {
            delete n.dimensions[k]
            return
          }
          if (!data.levelTags[k].activated) {
            return
          }
          if (grand_parent_id == dim.parent_name) {
            delete n.dimensions[k]
          }
        })
      })

    })
    // tmp.forEach(nt => {
    //   const leveltagg_id = nt[0]
    //   delete n.tags[leveltagg_id]
    // })
    // //remove tags which are not in data.NodeTags
    // const tags_to_remove: string[] = []
    // for (const tag in n.tags) {
    //   if (!(tag in data.nodeTags) && !(tag in data.levelTags)) {
    //     tags_to_remove.push(tag)
    //   }
    // }
    // tags_to_remove.forEach(tag => { delete n.tags[tag] })

    // Convert name of some local variables
    if (n.local) {
      if (n.local.label_vert_shift !== undefined) {
        n.local.name_label_vert_shift = n.local.label_vert_shift
      }
      if (n.local.label_horiz_valeur_shift) {
        n.local.value_label_horiz_shift = n.local?.label_horiz_valeur_shift
      }
      if (n.local.label_vert_valeur_shift) {
        n.local.value_label_vert_shift = n.local.label_vert_valeur_shift
      }
      if (n.local.label_horiz_shift !== undefined) {
        n.local.name_label_horiz_shift = n.local.label_horiz_shift
      }
      if (n.local.label_color) {
        //@ts-expect-error xxx
        n.local.label_color = 'white'
      }
    }
    if (!Array.isArray(n.style)) {
      //@ts-expect-error xxx
      n.style = [n.style]
    }
  }
  )
}

/**
 * Conversion oldest JSON to new JSON format for links
 * @param {SankeyData} data
 */
const convert_links: convert_linksFuncType = (
  data: SankeyData
) => {
  const data_to_convert = data as SankeyData & ConvertSankeyData

  if (
    !Array.isArray(data.links) &&
    (data.version !== '0.5') &&
    (data.version !== '0.6') &&
    (data.version !== '0.7') &&
    (data.version !== '0.8')
  ) {
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
    if (((data.links as unknown) as SankeyLink[]).length > 0 && !data.links[0].idLink) {
      ((data.links as unknown) as SankeyLink[]).forEach((l: SankeyLink, i: number) => l.idLink = 'link' + i)
    }
    if (((data.nodes as unknown) as SankeyNode[]).length > 0 && !data.nodes[0].idNode) {
      ((data.nodes as unknown) as SankeyNode[]).forEach((n: SankeyNode) => n.idNode = 'node' + ((n as unknown) as ConvertSankeyNode).id)
    }
    data_to_convert.links = Object.assign({}, ...((data.links as unknown) as SankeyLink[]).map((l: SankeyLink) => ({ [l.idLink]: { ...l } })))
    data_to_convert.nodes = Object.assign({}, ...((data.nodes as unknown) as SankeyNode[]).map((n: SankeyNode) => ({ [n.idNode]: { ...n } })))
  }

  const mapper: { [_: string]: string } = {}
  Object.values(data.links).forEach(l => {
    const previous_link_id = l.idLink
    const new_link_id = previous_link_id + makeId('_idLink')
    l.idLink = new_link_id
    mapper[previous_link_id] = l.idLink
  })
  data_to_convert.links = Object.assign({}, ...(Object.values(data.links)).map((l: SankeyLink) => ({ [l.idLink]: { ...l } })))
  Object.values(data.nodes).forEach(n => {
    const newInputLinksId: string[] = []
    n.inputLinksId.forEach(id => {
      if (mapper[id]) newInputLinksId.push(mapper[id])
    })
    n.inputLinksId = newInputLinksId

    const newOutputLinksId: string[] = []
    n.outputLinksId.forEach(id => {
      if (mapper[id]) newOutputLinksId.push(mapper[id])
    })
    n.outputLinksId = newOutputLinksId

    // Add links_order to node by combining input/outputs id (for version>=0.9)
    const n_tmp = (n as Type_JSON)
    n_tmp.links_order = n.inputLinksId.concat(n.outputLinksId)

    // Add in links_order links not in links_order but that reference this node
    // list_links
    //   .filter(l => (l.idTarget == n.idNode || l.idSource == n.idNode) && !(n_tmp.links_order as string[]).includes(l.idLink))
    //   .forEach(l => (n_tmp.links_order as string[]).push(l.idLink))

  })

  if (Object.keys(data.links).length > 0 && !Object.values(data.links)[0].idLink) {
    Object.values(data.links).forEach((l, i) => l.idLink = 'link' + i)
  }


  const dataTagsArray = Object.values(data.dataTags).filter(dataTag => { return (Object.keys(dataTag.tags).length != 0) ? true : false })
  const convert_display = (
    dataTags: TagsGroup[],
    v: SankeyLinkValue | SankeyLinkValueDict,
    depth: number,
    returnObj: Type_JSON
  ) => {
    if (dataTags.length == 0 || depth === dataTags.length) {
      if (v.display_value === undefined) {
        v.display_value = ''
      } else if (v.display_value === 'default') {
        v.display_value = ''
      } else if ((v.display_value as string).includes('[')) {
        // Variables libres
        let tmp
        if ((v.display_value as string).includes('-')) {
          tmp = (v.display_value as string).split('-')
        }
        else if ((v.display_value as string).includes(',')) {
          tmp = (v.display_value as string).split(',')
        }
        else if ((v.display_value as string).includes(';')) {
          tmp = (v.display_value as string).split(';')
        }
        else if ((v.display_value as string).includes('...')) {
          tmp = (v.display_value as string).split('...')
        }
        else if ((v.display_value as string).includes('  ')) {
          tmp = (v.display_value as string).split('  ')
        }
        else {
          tmp = (v.display_value as string).split(' ')
        }
        const free_mini = Number(tmp[0].substring(1))
        const free_maxi = Number(tmp[1].substring(0, tmp[1].length - 1))
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
      if (col_tag) {
        Object.keys(col_tag).forEach(tags_group_key => {
          if (!(tags_group_key in v.tags)) {
            (v as SankeyLinkValue).tags[tags_group_key] = []
          }
          (v as SankeyLinkValue).tags[tags_group_key].push(col_tag[tags_group_key])
        })
        delete (v as unknown as ConvertSankeyValue).color_tag
      }
      if (v.tags === undefined) {
        v.tags = {}
      }
      Object.keys(v.tags).forEach(key => {
        if (!Array.isArray((v as SankeyLinkValue).tags[key])) {
          (v as SankeyLinkValue).tags[key] = [(v as SankeyLinkValue).tags[key] as unknown as string]
        }
      })
      if (!v.extension) {
        v.extension = {}
      }
      if (data_to_convert.fluxTags['flux_types'] && !('flux_types' in v['tags'])) {
        if ((v as SankeyLinkValue).extension.data_value) {
          (v as SankeyLinkValue)['tags']['flux_types'] = ['initial_data']
        } else {
          (v as SankeyLinkValue)['tags']['flux_types'] = ['computed_data']
        }
      }

      if (v.display_value !== '') {
        returnObj['hide_value'] = true
      }
      return
    }
    const dataTag = Object.values(dataTags)[depth]
    const listKey = Object.keys(dataTag.tags)

    for (const i in listKey) {
      if ((v as SankeyLinkValueDict)[listKey[i]]) {
        if (v === undefined) {
          break
        }
        convert_display(dataTags, (v as unknown as { [key: string]: SankeyLinkValue })[listKey[i]], depth + 1, returnObj)
      }
    }
  }
  const defaultLinkStyle = DefaultLinkStyle()
  defaultLinkStyle.color_rule = 'auto'

  Object.values(data.links).forEach(l => {
    if (((l as unknown) as { source_name: string }).source_name) {
      const source_node = Object.values(data.nodes).filter(n => normalizeName(n.name) === normalizeName(((l as unknown) as { source_name: string }).source_name))[0]
      const target_node = Object.values(data.nodes).filter(n => normalizeName(n.name) === normalizeName(((l as unknown) as { target_name: string }).target_name))[0]
      l.idSource = source_node.idNode
      l.idTarget = target_node.idNode
      delete ((l as unknown) as { source_name?: string }).source_name
      delete ((l as unknown) as { target_name?: string }).target_name
    }

    const l_convert = (l as unknown) as ConvertSankeyLink
    if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
      if ('tags' in l) {
        delete (((l as unknown) as { tags: { Exchanges?: string } }).tags)['Exchanges']
      }
    }
    const source_node = data.nodes[l.idSource]
    const target_node = data.nodes[l.idTarget]
    if (!source_node || !target_node) {
      return
    }

    const l_depreciated = (l as Type_JSON)

    // CONVERSION D'ATTRIBUT OBLIGATOIRE DES NOEUDS EN VARIABLES LOCAL
    l.local = (l.local != undefined && l.local !== null) ? l.local : {} as SankeyLinkStyle
    Object.entries(defaultLinkStyle).filter(ent => ent[0] != 'idLink').forEach(ent => {
      if (l_depreciated[ent[0]] !== undefined) {
        AssignLinkLocalAttribute(l, (ent[0] as keyof SankeyLinkAttrLocal), ent[1])//either take value link attr directly from link to put it in local attr
      }
    })

    // Deletet display unit entry
    if ('display_unit' in l_convert) {
      l_convert.natural_unit = l_convert.display_unit
      delete l_convert.display_unit
    }

    if ('natural_unit' in l_convert && l_convert.natural_unit !== '') {
      // natural unit is now stored in label_unit
      // conversion factor is stored in label_unit_factor which is the invert of conv
      l.local!.label_unit_visible = true
      l.local!.label_unit = l_convert.natural_unit
      delete l_convert.display_unit
      l.local!.label_unit_factor = 1 / l_convert.conv![1]
    }

    // Delete agregated data value entry
    if (('agregated_data_value' in l_convert)) {
      l_convert.data_value = l_convert.agregated_data_value
      delete l_convert.agregated_data_value
    }

    // Rename orientation mode
    // if (l && l.local && !('orientation' in l.local)) {
    //   if (((source_node as unknown) as ConvertSankeyNode).orientation === 'horizontal' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'vertical') {
    //     AssignLinkLocalAttribute(l, 'orientation', 'vh')
    //   }
    //   else if (((source_node as unknown) as ConvertSankeyNode).orientation === 'vertical' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'horizontal') {
    //     AssignLinkLocalAttribute(l, 'orientation', 'hv')
    //   }
    //   else if (((source_node as unknown) as ConvertSankeyNode).orientation === 'vertical' && ((target_node as unknown) as ConvertSankeyNode).orientation === 'vertical') {
    //     AssignLinkLocalAttribute(l, 'orientation', 'vv')
    //   }
    //   else {
    //     AssignLinkLocalAttribute(l, 'orientation', 'hh')
    //   }
    // }

    // Delete link reverse entry
    if ('link_reverse' in l) {
      delete l_convert.link_reverse
    }

    // Convert old shape attributes
    if (l_convert.type === 'short_link_arrow') {
      AssignLinkLocalAttribute(l, 'curved', false)
      AssignLinkLocalAttribute(l, 'arrow', true)
    }
    else if (l_convert.type === 'bezier_link_arrow') {
      AssignLinkLocalAttribute(l, 'curved', true)
      AssignLinkLocalAttribute(l, 'arrow', true)
    }
    else if (l_convert.type === 'bezier_link_classic') {
      AssignLinkLocalAttribute(l, 'curved', true)
      AssignLinkLocalAttribute(l, 'arrow', false)
    }

    if (data.version === '0.1') {
      const unit_index = l_convert.natural_unit ? data_to_convert.units_names.indexOf(l_convert.natural_unit) : -1
      if (l_convert.conv && unit_index !== -1) {
        const natural_conv = l_convert.conv[unit_index]
        l_convert.conv.splice(1, 0, natural_conv)
      }
      AssignLinkLocalAttribute(l, 'curved', true)
      AssignLinkLocalAttribute(l, 'curvature', 1)
      if (l_convert.text_same_color === true) {
        AssignLinkLocalAttribute(l, 'text_color', ReturnValueLink(data, l, 'color'))

      } else {
        AssignLinkLocalAttribute(l, 'text_color', 'white')
      }
      delete l_convert.text_same_color

      if (target_node.x < source_node.x) {
        AssignLinkLocalAttribute(l, 'recycling', true)
      }
    }
    else if (!('curvature' in l)) {
      AssignLinkLocalAttribute(l, 'curvature', 0.5)
    }
    if (data.version === '0.2') {
      if (target_node.x < source_node.x) {
        AssignLinkLocalAttribute(l, 'recycling', true)
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

    // Remove no more necessayr attributes
    const attributes_to_remove = ['source', 'target', 'id', 'classif', 'title_length', 'raw_value', 'old_display_value', 'old_color', 'y_sd_label', 'x_sd_label', 'type']
    for (const attr in attributes_to_remove) {
      if (attributes_to_remove[attr] in l) {
        delete ((l as unknown) as { [key: string]: unknown })[attributes_to_remove[attr]]
      }
    }

    // Convert text color old attributes -> new attribute
    if (l_convert.text_same_color === false) {
      AssignLinkLocalAttribute(l, 'text_color', 'black')
    }
    else if (l_convert.text_same_color === true) {
      AssignLinkLocalAttribute(l, 'text_color', ReturnValueLink(data, l, 'color'))
    }
    else if (l_convert.text_same_color === 'same_color') {
      AssignLinkLocalAttribute(l, 'text_color', ReturnValueLink(data, l, 'color'))
    }
    delete l_convert.text_same_color
    const objectReturn: Type_JSON = {}
    // Values ?
    convert_display(dataTagsArray, l.value as SankeyLinkValue, 0, objectReturn)

    // Add opacity attribute
    if (!ReturnValueLink(data, l, 'opacity')) {
      AssignLinkLocalAttribute(l, 'opacity', 0.85)
    }

    // Dashed attribute conversion int -> boolean
    if (l_convert.dashed === 0) {
      AssignLinkLocalAttribute(l, 'dashed', false)
    }
    else if (l_convert.dashed == 1) {
      AssignLinkLocalAttribute(l, 'dashed', true)
    }

    const tmp: SankeyLinkAttrLocal = {
      // Geometry link
      orientation: '',
      left_horiz_shift: 0,
      right_horiz_shift: 0,
      vert_shift: 0,
      curvature: 0.5,
      curved: true,
      recycling: true,
      arrow_size: 0,

      // Geometry link labels
      label_position: '',
      orthogonal_label_position: '',
      label_on_path: true,

      //Attributes link
      arrow: true,
      color: '',
      opacity: 0,
      dashed: true,
      //Attributes link labels
      label_visible: true,
      label_font_size: 0,
      text_color: '',

      to_precision: true,
      scientific_precision: true,
      nb_scientific_precision: 5,
      custom_digit: true,
      nb_digit: 0,

      font_family: '',
      label_unit_visible: true,
      label_unit: '',

      gradient: false
    }

    // Move link attr to local sub strcut
    Object.keys(tmp).forEach((k) => {
      const kl = k as keyof SankeyLinkAttrLocal
      if (Object.keys(l).includes(k)) {
        l.local = l.local ? l.local : {};
        (l.local[kl] as unknown) = ((l as SankeyLink)[(k as keyof SankeyLink)] as boolean | string | number)
        delete l[(k as keyof SankeyLink)]
      }
    })

    const isEchange = (node: SankeyNode) => {
      return node.tags['type de noeud'] != undefined && node.tags['type de noeud'][0] == 'echange'
    }
    /**
     * Détermine la règle de couleur d'une liaison (link) en fonction des propriétés
     * des nœuds source et cible.
     * 
     * Priorité des règles :
     * 1. Nœud "produit" avec tag de couleur unique et valide
     * 2. Nœud non-"produit" avec tag de couleur unique et valide
     * 3. Nœud "produit" par défaut (sans condition sur les tags de couleur)
     * 
     * @param {Object} source_node - Le nœud source de la liaison
     * @param {Object} target_node - Le nœud cible de la liaison
     * @param {Object} l - L'objet liaison à modifier
     * @param {Object} data - L'objet contenant les définitions de tags
     */

    // Fonctions utilitaires
    const isProductNode = (node: SankeyNode) => {
      return node.tags['type de noeud']?.length > 0
        && node.tags['type de noeud'][0] === 'produit'
    }

    const hasValidColorTag = (node: SankeyNode, data: SankeyData) => {
      // Vérifie si le nœud a un paramètre de couleur non-local
      if (node.colorParameter === 'local') return false

      // Vérifie si le tag de couleur existe sur le nœud
      if (!(node.colorTag in node.tags)) return false

      // Vérifie si le nœud a exactement un tag de couleur
      if (node.tags[node.colorTag].length !== 1) return false

      const selectedTag = node.tags[node.colorTag][0]

      // Vérifie si le tag sélectionné existe dans les définitions de tags
      return selectedTag in data.nodeTags[node.colorTag].tags
    }

    // Logique principale
    const determineColorRule = (source_node: SankeyNode, target_node: SankeyNode, data: SankeyData, l: SankeyLink) => {
      // Priorité 1 : Nœud "produit" avec tag de couleur valide
      if (isProductNode(source_node) && hasValidColorTag(source_node, data)) {
        if (!l.local) l.local = {}
        l.local.color_rule = 'auto'//'source'
        return
      }

      if (isProductNode(target_node) && hasValidColorTag(target_node, data)) {
        if (!l.local) l.local = {}
        l.local.color_rule = 'auto'//'target'
        return
      }

      // Priorité 2 : Nœud NON-"produit" avec tag de couleur valide
      if (!isProductNode(source_node) && hasValidColorTag(source_node, data)) {
        if (!l.local) l.local = {}
        l.local.color_rule = 'auto'//'source'
        return
      }

      if (!isProductNode(target_node) && hasValidColorTag(target_node, data)) {
        if (!l.local) l.local = {}
        l.local.color_rule = 'auto'//'target'
        return
      }

      // Priorité 3 : Nœud "produit" par défaut (fallback)
      if (isProductNode(source_node)) {
        if (!l.local) l.local = {}
        l.local.color_rule = 'auto'//source'
        return
      }

      if (isProductNode(target_node)) {
        if (!l.local) l.local = {}
        l.local.color_rule = 'auto'//'target'
        return
      }
    }

    // Utilisation
    determineColorRule(source_node, target_node, data, l)

    // Convert legacy recycling position -> new positions
    if (l.local) {
      if (l.local.user_scale) {
        l.local.user_scale = l.local.user_scale / data.user_scale
      }

      if (!l.local.recycling) {
        if (l.local.right_horiz_shift !== undefined)
          if (l.local.right_horiz_shift >= 0 && l.local.right_horiz_shift <= 1) {
            AssignLinkLocalAttribute(l, 'right_horiz_shift', (1.0 - l.local.right_horiz_shift)) // We have inversed that
          } else {
            delete l.local.right_horiz_shift
          }
        if (l.local.curvature) {
          if (l.local.orientation && ((l.local.orientation == 'vh') || (l.local.orientation == 'hv'))) {
            // I made an approx. here because we can't have a direct transform from old behavior (Cubic / Bezier) to new (Quadratic) for path drawing
            if (!isEchange(data.nodes[l.idSource]) && !isEchange(data.nodes[l.idTarget])) {
              AssignLinkLocalAttribute(l, 'starting_curve', 0.05)
              AssignLinkLocalAttribute(l, 'ending_curve', 0.95)
              AssignLinkLocalAttribute(l, 'starting_tangeant', l.local.orientation == 'vh' ? 0.05 : 0.95)
              AssignLinkLocalAttribute(l, 'ending_tangeant', 0.95)
            }
          }
          else {
            AssignLinkLocalAttribute(l, 'starting_tangeant', l.local.curvature / 2)
            AssignLinkLocalAttribute(l, 'ending_tangeant', l.local.curvature / 2)
          }
        }
      }
      else {
        const scale = d3.scaleLinear()
          .range([0, 100])
          .domain([0, data.user_scale])
        // In old file, for recycling only, shift are not relative but are absolute distances between source & target nodes
        // So we need to get dist between source & target node to recompute relative parameters for recyling link
        let dist: number
        if (l.local.orientation && ((l.local.orientation == 'vh') || (l.local.orientation == 'hv'))) {
          // In old file, for recycling only, shift are not relative but are absolute distances from nodes
          dist = Math.max(20, Math.sqrt(
            (target_node.x - source_node.x) * (target_node.x - source_node.x) +
            (target_node.y - source_node.y) * (target_node.y - source_node.y))) // Avoid div per 0
        }
        else if ((l.local.orientation && l.local.orientation == 'vv')) {
          // In old file, for recycling only, shift are not relative but are absolute distances from nodes
          dist = Math.max(20, Math.abs(target_node.y - source_node.y)) // Avoid div per 0
        }
        else {  // eqv. if (!l.local.orientation || (l.local.orientation && l.local.orientation == 'hh')) {
          dist = Math.max(20, Math.abs(target_node.x - (source_node.x + +ReturnValueNode(data, source_node, 'node_width')))) // Avoid div per 0
        }

        //const shift_dist_max = 200
        const left_horiz_shift = l.local.left_horiz_shift ? l.local.left_horiz_shift - 50 : -50
        const right_horiz_shift = l.local.right_horiz_shift ? l.local.right_horiz_shift + 50 : 50
        let original_dist = Math.abs(left_horiz_shift) + scale(+GetLinkValue(data, l.idLink).value)
        //let shift_dist = Math.min(shift_dist_max, original_dist) // Approx to keep general shape
        AssignLinkLocalAttribute(l, 'right_horiz_shift', original_dist / dist) // value in [0; +oo]
        AssignLinkLocalAttribute(l, 'ending_tangeant', 0.001) // value in [0; +oo]
        // }

        original_dist = Math.abs(right_horiz_shift) + scale(+GetLinkValue(data, l.idLink).value)
        //curve_dist = Math.max(curve_dist_min, Math.min(curve_dist_max, original_dist * curve_coef)) // Approx to keep general shape
        //shift_dist = Math.min(shift_dist_max, original_dist) // Approx to keep general shape
        AssignLinkLocalAttribute(l, 'left_horiz_shift', original_dist / dist) // value in [0; +oo]
        AssignLinkLocalAttribute(l, 'starting_tangeant', 0.001) // value in [0; +oo]
      }
    }

    // Delete color attribute if unecessary
    if (l.local && (l.local.color === '#808080' || l.local.color === 'grey' || l.local.color === DefaultLinkStyle().color)) {
      delete l.local.color
    }
    if (l.drag_label_offset) {
      l.position_offset_label = l.drag_label_offset
    }
    if (l.local.label_position == 'frozen') {
      //@ts-expect-error xxx
      l.local.name_label_pos_auto = false
    }
    if (l.x_label) {
      //@ts-expect-error xxx
      l.position_x_label = l.x_label
    }
    if (l.y_label) {
      //@ts-expect-error xxx
      l.position_y_label = l.y_label
    }
    if (objectReturn['hide_value'] === true) {
      l.local['value_label_is_visible'] = false
    }

  })

  if (data.version !== '0.6' && data.version !== '0.7' && data.version !== '0.8') {
    const links_no_type = data.links as unknown as { [key: string]: ConvertSankeyLink & SankeyLink }
    Object.values(links_no_type).forEach(
      (link) => {
        links_no_type[link.idLink].value2 = {}
      }
    )

    let region_names: string[] = []
    let period_names: string[] = []
    if (data_to_convert.dataTags['Regions']) {
      region_names = Object.keys(data_to_convert.dataTags['Regions'].tags)
      region_names.forEach(region_name =>
        Object.values(links_no_type).forEach((link) => (links_no_type[link.idLink].value2 as SankeyLinkValueDict)[region_name] = {})
      )
    } else if (data_to_convert.dataTags['Periods']) {
      period_names = Object.keys(data_to_convert.dataTags['Periods'].tags)
      period_names.forEach(period_name =>
        Object.values(links_no_type).forEach((link) => (links_no_type[link.idLink].value2 as SankeyLinkValueDict)[period_name] = {})
      )
    }

    if (region_names.length > 0 || period_names.length > 0) {
      const reg_or_period_names = region_names.length > 0 ? region_names : period_names
      reg_or_period_names.forEach((region_name, value_index) => {
        Object.values(links_no_type).forEach(
          (link) => {
            const editable_link = links_no_type[link.idLink];
            (editable_link.value2 as SankeyLinkValueDict)[region_name] = {
              value: (link.value as number[])[value_index],
              display_value: (link.display_value as string[])[value_index],
              tags: {},
              extension: {}
            }
            const sankey_link_value = (editable_link.value2 as SankeyLinkValueDict)[region_name] as SankeyLinkValue
            if (editable_link.mini !== undefined && editable_link.mini !== null) {
              if (!sankey_link_value.extension) {
                sankey_link_value.extension = {}
              }
              if (sankey_link_value.extension) {
                sankey_link_value.extension.mini = (editable_link.mini as number[])[value_index] as unknown as string
                sankey_link_value.extension.maxi = (editable_link.maxi as number[])[value_index] as unknown as string
              }
              const p = ((editable_link.maxi as number[])[value_index] - (editable_link.mini as number[])[value_index]) / (editable_link.value as number[])[value_index]
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
              sankey_link_value.extension.data_value = (editable_link.data_value as number[])[value_index] as unknown as string
              if ('data_source' in editable_link) {
                sankey_link_value.extension.data_source = (editable_link.data_source as string[])[value_index]
              }
              sankey_link_value['tags']['flux_types'] = ['initial_data']
            }
          }
        )
      })
    }
    else {
      Object.values(links_no_type).forEach(
        (link) => {
          const editable_link = links_no_type[link.idLink]
          let the_value: number | number[] = link.value
          let the_display_value = link.display_value as string
          if (the_display_value == undefined) {
            the_display_value = ''
          }
          if (Array.isArray(link.value)) {
            the_value = (link.value as number[])[0]
            the_display_value = (link.display_value as string[])[0] as string
          }
          (editable_link.value2 as SankeyLinkValue) = {
            value: the_value as number,
            display_value: the_display_value == 'default' ? '' : the_display_value,
            tags: {},
            extension: {}
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
            const free_maxi = Number(tmp[1].substring(0, tmp[1].length - 1))
            sankey_link_value.extension.free_mini = free_mini
            sankey_link_value.extension.free_maxi = free_maxi;
            (editable_link.value2 as SankeyLinkValue).display_value = ''
          }
          if (editable_link.mini !== undefined && editable_link.mini !== null) {
            let the_mini = editable_link.mini as number
            let the_maxi = editable_link.maxi as number
            if (Array.isArray(editable_link.mini)) {
              the_mini = editable_link.mini[0]
              the_maxi = (editable_link.maxi as number[])[0]
            }
            if (sankey_link_value.extension) {
              sankey_link_value.extension.mini = the_mini
              sankey_link_value.extension.maxi = the_maxi
            }
            const p = (the_maxi - the_mini) / (the_value as number)
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
            sankey_link_value.extension.data_value = (editable_link.data_value as number[])[0] as unknown as string
            sankey_link_value['tags']['flux_types'] = ['initial_data']
          }
          if ('data_source' in editable_link && sankey_link_value.extension) {
            sankey_link_value.extension.data_source = (editable_link.data_source as string[])[0]
          }
        }
      )
    }
    Object.values(data.links).forEach(
      link => {
        (data.links[link.idLink]).value = (data.links[link.idLink] as unknown as ConvertSankeyLink).value2 as unknown as SankeyLinkValueDict
        if ((data.links[link.idLink] as unknown as ConvertSankeyLink).value2) {
          delete (data.links[link.idLink] as unknown as { value2?: SankeyLinkValueDict }).value2
        }
        if (link.style == 'LinkExportStyle') link.style = 'LinkExportCloseStyle'
        if (link.style == 'LinkImportStyle') link.style = 'LinkImportCloseStyle'
      }
    )
  }
  delete data_to_convert.style_node['exprt']
}

const has_not_converted_nodeTags_as_levelTags = (data: SankeyData) => {
  return Object.values(data.nodeTags).filter(nt => nt.banner == 'level').length > 0
}

/**
 * Return name without EOL
 * @param {string} name
 * @return {*}
 */
const normalizeName = (name: string) => {
  const new_name = name.split('\\n').join('').split(' ').join('')
  return new_name
}


/**
 * Convert JSON from App that are previous to 0.91,
 *
 * Since 0.91 :
 *  - link attribute/style label_position & orthogonal_label_position  value have changed :
 *
 *    - start -> left
 *
 *    - end -> right
 *
 *    - above -> top
 *
 *    - below -> bottom
 *
 * This is due to the creation of a component to modify value attriubtes for nodes AND links so we have normalised some attributes values
 *
 * @param {Type_JSON} data
 * @return {*}
 */
export const convert_pre_v_0_91 = (data: Type_JSON) => {
  Object.values(data.links).forEach(link => {
    if (link.local !== undefined) {
      if (link.local['label_position'] !== undefined) {
        if (link.local['label_position'] == 'start') {
          link.local['label_position'] = 'left'
        } else if (link.local['label_position'] == 'end') {
          link.local['label_position'] = 'right'
        }
      }
      if (link.local['orthogonal_label_position'] !== undefined) {
        if (link.local['orthogonal_label_position'] == 'above') {
          link.local['orthogonal_label_position'] = 'top'
        } else if (link.local['orthogonal_label_position'] == 'below') {
          link.local['orthogonal_label_position'] = 'bottom'
        }
      }
    }
  })

  Object.values(data.style_link).forEach(style_link => {
    if (style_link !== undefined) {
      if (style_link['label_position'] == 'start') {
        style_link['label_position'] = 'left'
      } else if (style_link['label_position'] == 'end') {
        style_link['label_position'] = 'right'
      }
      if (style_link['orthogonal_label_position'] == 'above') {
        style_link['orthogonal_label_position'] = 'top'
      } else if (style_link['orthogonal_label_position'] == 'below') {
        style_link['orthogonal_label_position'] = 'bottom'
      }
    }
  })

  return data
}
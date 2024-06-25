// External libs
import React, { ChangeEvent, FunctionComponent, useRef } from 'react'
import * as d3 from 'd3'
import { FaEye, FaEyeSlash, FaFileImport } from 'react-icons/fa'
import FileSaver from 'file-saver'
import {
  Box,
  Button,
  Checkbox,
  Input,
  MenuItem
} from '@chakra-ui/react'

// Internal imports
import {
  OSPData,
  OSPLabel,
  OSPLink,
  OSPLinkAttrLocal,
  OSPLinkStyle,
  OSPNode,
  OSPNodeVar,
} from '../types/Types'
import {
  DefaultOSPStyleLinkFType,
  ImportImageAsSvgBgFType,
  IsAllZdtAttrSameValueFType,
  OSPIsAllNodeNotLocalAttrSameValueFType,
  OSPAssignLinkValueToCorrectVarFType,
  OSPLinkSabotColorFType,
  OSPReturnValueLinkFType,
  SetSvgBgFType,
  ValueOf,
  clickSaveSVGFType,
} from '../types/SankeyPlusUtilsTypes'
import {
  AssignLinkValueToCorrectVar,
  DefaultLinkStyle,
  DefaultNode,
  LinkColor,
  NodeColor,
  OSTooltip,
  ReturnValueLink,
} from './import/OpenSankey'

// OpenSankey types
import { SankeyLinkAttrLocal, SankeyLinkStyle } from 'open-sankey/src/types/Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'

// OpenSankey js-code
import { pre_process_export_svg, post_process_export_svg } from 'open-sankey/dist/topmenus/SankeyMenuTop'



// Local imports
// import { OSPData,OSPNode, } from './types'
import SankeyListIcons from './icons/lib_of_icons.json'



export const DefaultOSPStyleLink: DefaultOSPStyleLinkFType = () => {
  const style = DefaultLinkStyle() as OSPLinkStyle
  style.gradient = false
  return style
}

// export const DragLegendOSP: DragLegendOSPFType = (
//   data: OSPData,
//   multi_selected_label: { current: OSPLabel[] },
//   ComponentUpdater,
//   resizeCanvas,
//   node_function,
//   link_function,
//   applicationData
// ) => d3
//   .drag<SVGGElement, unknown>()
//   .subject(Object).on('drag', function (event) {
//     if (d3.select('.opensankey #svg').nodes().length > 0) {
//       DragLegendGElementOSTyped(data, event)
//       if (data.legend_position[0] === 0 || data.legend_position[1] === 0) {
//         OpposingDragElementsPlus(
//           [({ x: data.legend_position[0], y: data.legend_position[1] } as OSPNode)],
//           event,
//           ({} as OSPNode), applicationData, { current: [] },
//           multi_selected_label)
//       }
//     }
//   })
//   .on('end', () => {
//     ComponentUpdater.updateComponentMenuConfigLayout.current()
//     node_function.RedrawNodes(Object.values(applicationData.display_nodes))
//     link_function.RedrawLinks(Object.values(applicationData.display_links))
//     resizeCanvas()
//   })

export const ImportImageAsSvgBg: FunctionComponent<ImportImageAsSvgBgFType> = ({
  t,
  data,
  set_data,
  has_open_sankey_plus,
}) => {
  const _load_image = useRef<HTMLInputElement>(null)

  const content_image = <>
    {/* Import image */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.show_background_image}
        isDisabled={!has_open_sankey_plus}
        icon={data.show_background_image ? <FaEye /> : <FaEyeSlash />}
        onChange={(evt) => {
          data.show_background_image = evt.target.checked
          set_data({ ...data })
        }}
      >
        {t('MEP.show_image')}
      </Checkbox>
      <OSTooltip label={!has_open_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box>
          <Button
            variant='menuconfigpanel_option_button'
            isDisabled={!data.show_background_image || !has_open_sankey_plus}
            onClick={() => {
              if (_load_image.current) {
                _load_image.current.name = ''
                _load_image.current.click()
              }
            }}
          >
            <FaFileImport />
          </Button>
          <Input
            ref={_load_image}
            style={{ display: 'none' }}
            accept='image/*'
            type="file"
            value={''}
            disabled={!has_open_sankey_plus}
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (() => {
                return (e: ProgressEvent<FileReader>) => {
                  const resultat = (e.target as FileReader).result
                  const res = resultat?.toString().replaceAll('=', '')
                  data.background_image = (res as string)
                  set_data({ ...data })
                }
              })()
              reader.readAsDataURL(files[0])
            }}
          />
        </Box>
      </OSTooltip>
    </Box>
  </>
  return content_image
}

export const SetSvgBg: SetSvgBgFType = (data: OSPData) => {

  d3.select('#svg')
    .filter(() => !data.show_background_image || data.background_image === undefined || data.background_image === '')
    .style('background-image', null)
    .style('background-size', 'contain')
    .style('background-repeat', 'no-repeat')

  d3.select('#svg')
    .filter(() => data.show_background_image && data.background_image !== undefined && data.background_image !== '')
    .style('background-image', 'url(' + data.background_image + ')')
    .style('background-size', 'contain')
    .style('background-repeat', 'no-repeat')
}

export const IsAllZdtAttrSameValue: IsAllZdtAttrSameValueFType = (
  data: OSPData,
  m_s_zdt: OSPLabel[],
  k: keyof OSPLabel
) => {
  if (m_s_zdt.length === 0) {
    return [null, null]
  }
  const first_value = m_s_zdt[0][k]
  let all_same = true
  m_s_zdt.forEach(l => {
    all_same = l[k] !== first_value ? false : all_same
  })
  return (all_same ? [first_value, false] : [0, true])
}
// export const PlusIsAllNodeNotLocalAttrSameValue=(data:OSPData,m_s_n:OSPNode[],k_list:(keyof OSPNode)[])=>{
// return IsAllNodeNotLocalAttrSameValue(data,m_s_n,k_list)
// }
export const OSPIsAllNodeNotLocalAttrSameValue: OSPIsAllNodeNotLocalAttrSameValueFType = (
  data: OSPData,
  m_s_n: OSPNode[],
  k_list: (keyof OSPNode)[]
) => {
  // store_value : variable that contain an array forEach key we are looking for
  // Each array contain in first position the value of the selected nodes attribute
  // In second position it contain a boolean that return true if all selected nodes have the same value for the key
  const store_value = {} as { [x: string]: [ValueOf<OSPNode> | false, boolean] }

  if (m_s_n.length > 0) {
    // For each selected nodes
    m_s_n.forEach((node, i) => {
      // For each attributes we want to check
      k_list.forEach(k => {
        // Get the value of the node attribute(k)
        const val = node[k]

        // Store first value of each node attribute
        if (i === 0) {
          store_value[k] = [val, false]
        } else {
          // Check if other nodes selected have the same value, if not we set the 2nd value of the array at true
          store_value[k][1] = val !== store_value[k][0] ? true : store_value[k][1]
        }
      })
    })
  } else {
    k_list.forEach(k => {
      store_value[k] = [false, false]
    })
  }
  return store_value
}

export const OSPReturnValueLink: OSPReturnValueLinkFType = (
  data: OSPData,
  l: OSPLink,
  k: keyof OSPLinkAttrLocal | keyof OSPLinkStyle
) => {
  return ReturnValueLink(data, l, ((k as unknown) as (keyof SankeyLinkAttrLocal | keyof SankeyLinkStyle)))
}
export const OSPAssignLinkValueToCorrectVar: OSPAssignLinkValueToCorrectVarFType = (l: OSPLink | OSPLinkStyle, k: keyof OSPLinkAttrLocal, v: boolean | string | number, menu_for_style: boolean) => {
  return AssignLinkValueToCorrectVar(l, k as unknown as keyof SankeyLinkAttrLocal, v, menu_for_style)
}

/**
 * Function to color node sabot (only for node with arrow shape)
 * override OS function by adding behavior of when the link is gradient
 * nevertheless if the link take the color of tag associated then it use the color of the tag instead of the gradient
 * @param {OSPLink} l link sabot to color
 * @param {OSPData} data sankey data
 * @param {GetLinkValueFuncType} GetLinkValue
 * @return {string} color (hex) to use 
 */
export const OSPLinkSabotColor: OSPLinkSabotColorFType = (
  l: OSPLink,
  data: OSPData,
  GetLinkValue: GetLinkValueFuncType
) => {
  let chooseNodeColor = false
  if (data.linksColorMap === 'no_colormap') {
    chooseNodeColor = OSPReturnValueLink(data, l, 'gradient') === true
  }
  return chooseNodeColor ? NodeColor(data.nodes[l.idSource], data) : LinkColor(l, data, GetLinkValue)
}

// Function used before exporting a sankey to svg format
// It add used attribute from css file in the html tag attribute 'style', because otherwise the foreignObject element doesn't have proper css
const addStyleInlineSVG = () => {
  d3.selectAll('#svg foreignObject *:not(br)').nodes().forEach(el => {
    const elements_for_style = getComputedStyle(el as Element)
    Object.values(elements_for_style).forEach(ks => {
      // Get css properties of the element in the navigator
      const val = elements_for_style.getPropertyValue(ks)
      if (val !== undefined && val !== '' && !ks.includes('webkit')) {
        // Add the css propertie in the attribute style so it is used in the svg file
        d3.select(el).style(ks, val)
      }
    })
  })
}


export const clickSaveSVG: clickSaveSVGFType = () => {

  const svg = pre_process_export_svg()
  addStyleInlineSVG()

  const html = ((svg.attr('title', 'test2')
    .attr('version', 1.1)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .node() as HTMLElement).parentNode as HTMLElement).innerHTML

  const blob = new Blob([html], { type: 'image/svg+xml' })
  const form_data = new FormData()
  form_data.append('html', blob)

  post_process_export_svg()

  const path = window.location.href
  let url = path + '/opensankey/sankey/save_svg'
  const fetchData = {
    method: 'POST',
    body: form_data
  }

  const showFile = (blob: BlobPart) => {
    const newBlob = new Blob([blob], { type: 'application/svg' })
    FileSaver.saveAs(newBlob, 'sankey_diagram.svg')
  }

  const cleanFile = () => {
    const fetchData = {
      method: 'POST'
    }
    url = path + '/opensankey/sankey/clean_svg'
    fetch(url, fetchData)
  }

  fetch(url, fetchData).then(
    r => r.blob()
  )
    .then(showFile).then(cleanFile)
}

export const OSPItemExport: FunctionComponent = (
) => {
  return <MenuItem onClick={clickSaveSVG} >SVG</MenuItem>
}

export const OSPDefaultNode = (data: OSPData) => {
  const os_def_node = DefaultNode(data)
  const def_plus_data_var: OSPNodeVar = {
    iconName: '',
    iconColor: '',
    iconVisible: false,
    iconColorSustainable:false,

    has_FO: false,
    is_FO_raw: false,
    FO_content: '',

    is_image: false,
    image_src: '',

    hyperlink: ''
  }
  const osp_def_node = { ...os_def_node, ...def_plus_data_var }
  return osp_def_node
}




type KeysOfIcon = keyof typeof SankeyListIcons

export const generate_data_example_icons = (get_default_data: () => OSPData) => {
  const data_sankey = get_default_data() as OSPData
  data_sankey.icon_catalog = {}
  data_sankey.style_node['default'].node_height = 100
  data_sankey.style_node['default'].node_width = 100
  data_sankey.style_node['default'].shape_visible = false

  Object.keys(SankeyListIcons).forEach((cki, nki) => {
    const ki = cki as KeysOfIcon
    Object.entries(SankeyListIcons[ki]).forEach((i, n) => {
      data_sankey.icon_catalog[i[0]] = i[1] as string
      const node = OSPDefaultNode(data_sankey)

      node.idNode = 'key_' + i[0]
      node.name = i[0]


      node.iconName = i[0]
      node.iconVisible = true
      node.iconColor = 'black'
      node.x = (n * 150) + 50
      node.y = (nki * 200) + 100

      data_sankey.nodes[node.idNode] = node
    })
  })
  return data_sankey

}


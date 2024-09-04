// // External imports
// import * as d3 from 'd3'

import React,{ FunctionComponent, useState } from "react"
import { MenuConfLinkApparenceGradientFType } from "../types/SankeyPlusGradientTypes"
import { Class_LinkElementPlus, Class_LinkStylePlus } from "./Types/LinkPlus"
import { OSTooltip, TooltipValueSurcharge } from "./deps/OpenSankey/types/Utils"
import { Checkbox } from "@chakra-ui/react"
import { isAttributeOverloaded } from "./deps/OpenSankey/types/Link"

// import { Checkbox } from '@chakra-ui/react'

// // Local imports
// import { OSPReturnValueLink, OSPAssignLinkValueToCorrectVar } from './SankeyPlusUtils'
// import { OSPData, OSPNode, OSPLink } from '../types/Types'
// import {
//   OSPLinkStrokeFType,
//   dragNodeRedrawGradientFType,
//   MenuConfLinkApparenceGradientFType
// } from '../types/SankeyPlusGradientTypes'
// import {
//   ReturnValueLink,
//   IsAllLinkAttrSameValue,
//   ReturnValueNode,
//   IsLinkDiplayingValueLocal,
//   NodeColor,
//   LinkStrokeOSTyped,
//   DrawArrows,
//   OSTooltip
// } from './import/OpenSankey'

// // OpenSankey types
// import {
//   SankeyData,
//   SankeyLink,
//   SankeyLinkAttrLocal,
//   SankeyNode,
//   display_styleType
// } from './deps/OpenSankey/types/Types'
// import { GetLinkValueFuncType } from './deps/OpenSankey/configmenus/types/SankeyUtilsTypes'

// // OpenSankey ts-code
// import {TooltipValueSurcharge} from './deps/OpenSankey/configmenus/SankeyUtils'
// import { DrawArrowsType } from './deps/OpenSankey/draw/types/SankeyDrawFunctionTypes'


export const MenuConfLinkApparenceGradient: FunctionComponent<MenuConfLinkApparenceGradientFType> = ({
  applicationData,
  is_activated,
  menu_for_style,
}) => {

    // Get data
    const { new_data } = applicationData
    const { ref_selected_style_link } = new_data.menu_configuration
  
  const { t } = new_data
  const [forceUpdate, setForceUpdate] = useState(false)
  // I have to do this because when we change selected_style_link it only re-render SankeyModalStyleLink
  // who re-render MenuConfigurationLinksAppearence
  // but MenuConfLinkApparenceGradient is rendered outside the scope of SankeyModalStyleLink
  // so selected_style_link can be out of sync with the real selected_style_link
  // if (menu_for_style && !Object.keys(data.style_link).includes(selected_style_link.current)) {
  //   selected_style_link.current = (Object.keys(data.style_link)[0])
  // }

  // Selected links
  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStylePlus[] | Class_LinkElementPlus[]
  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.link_styles_dict[ref_selected_style_link.current]]
  }
  else {
    elements = selected_links
  }
  const check_indeterminate = (curr: Class_LinkElementPlus) => {
    return (selected_links[0].shape_is_gradient== curr.shape_is_gradient)
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)

  const gradChecked = elements[0]
  return (<OSTooltip label={!is_activated ? t('Menu.sankeyOSPDisabled') : ''} >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isDisabled={!is_activated}
        isIndeterminate={is_indeterminate}
        isChecked={elements[0].shape_is_gradient}
        iconColor={is_indeterminate ? '#78C2AD' : 'white'}
        onChange={(evt) => {

          elements.forEach(element => element.shape_is_gradient = evt.target.checked)
          new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

          setForceUpdate(!forceUpdate)
        }}>
        {t('Flux.apparence.grad')}
        {(!menu_for_style) &&
            isAttributeOverloaded(selected_links, 'value_label_on_path') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>}
      </Checkbox>
    </OSTooltip>)
  
}

// export const OSPLinkStroke : OSPLinkStrokeFType =(l:SankeyLink,data:SankeyData,GetLinkValue:GetLinkValueFuncType)=>{
//   const data_plus=data as OSPData
//   const defGradient = d3.select(' .opensankey #svg #sankey_def')
//   const nodes = data.nodes
//   const n_source=nodes[l.idSource]
//   const n_source_color=ReturnValueNode(data,n_source,'color')

//   const n_target=nodes[l.idTarget]
//   const n_target_color=ReturnValueNode(data,n_target,'color')
//   const l_ori=ReturnValueLink(data,l,'orientation')
//   const l_grad=OSPReturnValueLink(data_plus,l,'gradient')
//   const l_recy=ReturnValueLink(data,l,'recycling')
//   const source_svg = +d3.select(' .opensankey #shape_' + l.idSource)
//   const target_svg = +d3.select(' .opensankey #shape_' + l.idTarget)
//   if (source_svg == null || target_svg == null) {
//     return LinkStrokeOSTyped(l,data,GetLinkValue)
//   }

//   const width_src = +d3.select(' .opensankey #shape_' + l.idSource).attr('width')
//   const height_src = +d3.select(' .opensankey #shape_' + l.idSource).attr('height')
//   const width_trgt = +d3.select(' .opensankey #shape_' + l.idTarget).attr('width')
//   // const height_trgt = +d3.select(' .opensankey #shape_' + l.idTarget).attr('height')
//   const gradient = defGradient.append('defs')
//     .append('linearGradient')
//     .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
//     .attr('gradientUnits', 'userSpaceOnUse')

//   gradient.append('stop')
//     .attr('id', 'stop-start')
//     .attr('offset', '0%')
//     .attr('stop-color', () => {
//       if (nodes[l.idSource].x <= nodes[l.idTarget].x) {
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     })
//     .attr('stop-opacity', 1)

//   gradient.append('stop')
//     .attr('id', 'stop-end')
//     .attr('offset', '100%')
//     .attr('stop-color', () => {
//       if (nodes[l.idSource].x <= nodes[l.idTarget].x) {
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       } else {
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       }
//     })
//     .attr('stop-opacity', 1)
//   if (l_ori === 'hh' || l_ori === 'hv') {
//     d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//       if ( (!l_recy && nodes[l.idSource].x < nodes[l.idTarget].x) || (l_recy && nodes[l.idSource].x >= nodes[l.idTarget].x ) ) {
//         d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//           .attr('x1', nodes[l.idSource].x + width_src)
//           .attr('y1', '0')
//           .attr('x2', nodes[l.idTarget].x)
//           .attr('y2', 0)
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//           .attr('x1', nodes[l.idTarget].x + width_trgt)
//           .attr('y1', '0')
//           .attr('x2', nodes[l.idSource].x)
//           .attr('y2', 0)
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//     d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//       if ( (!l_recy && nodes[l.idSource].x > nodes[l.idTarget].x) || (l_recy && nodes[l.idSource].x <= nodes[l.idTarget].x)) {
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         const n = n_target
//         if ((ReturnValueNode(data, n, 'colorSustainable'))) {
//           return ReturnValueNode(data, n, 'color')
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//   } else if (l_ori === 'vv' || l_ori === 'hv') {
//     //orientation vert-vert
//     d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//       if (nodes[l.idSource].y < nodes[l.idTarget].y) {
//         d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//           .attr('x1', 0)
//           .attr('y1', nodes[l.idSource].y + height_src)
//           .attr('x2', 0)
//           .attr('y2', nodes[l.idTarget].y)
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//           .attr('x1', 0)
//           .attr('y1', nodes[l.idTarget].y + height_src)
//           .attr('x2', 0)
//           .attr('y2', nodes[l.idSource].y)
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//     d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//       if (nodes[l.idSource].y > nodes[l.idTarget].y) {
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//   } else if (l_ori === 'vh') {
//     d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//       if (nodes[l.idSource].x < nodes[l.idTarget].x) {
//         d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//           .attr('x1', nodes[l.idSource].x + width_src - 10)
//           .attr('y1', '0')
//           .attr('x2', nodes[l.idTarget].x)
//           .attr('y2', 0)
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//           .attr('x1', nodes[l.idTarget].x + width_trgt + 10)
//           .attr('y1', '0')
//           .attr('x2', nodes[l.idSource].x)
//           .attr('y2', 0)
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//     d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//       if (nodes[l.idSource].x > nodes[l.idTarget].x) {
//         const n = n_source
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         const n = n_target
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//   }
//   return (data.linksColorMap==='no_colormap' && l_grad) ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : LinkStrokeOSTyped(l,data,GetLinkValue)
// }

// // Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
// export const dragNodeRedrawGradient : dragNodeRedrawGradientFType =(
//   nodes:{ [node_id: string]: OSPNode },
//   link:OSPLink,
//   data:OSPData
// )=>{
//   const width_src = +d3.select(' .opensankey #shape_' + link.idSource).attr('width')
//   const height_src = +d3.select(' .opensankey #shape_' + link.idSource).attr('height')
//   const width_trgt = +d3.select(' .opensankey #shape_' + link.idTarget).attr('width')
//   //const height_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('height')


//   const n_source=nodes[link.idSource]
//   const n_source_color=ReturnValueNode(data,n_source,'color')

//   const n_target=nodes[link.idTarget]
//   const n_target_color=ReturnValueNode(data,n_target,'color')

//   const l_ori=ReturnValueLink(data,link,'orientation')


//   if (l_ori === 'hh' || l_ori === 'hv') {
//     d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//       if (nodes[link.idSource].x < nodes[link.idTarget].x) {
//         d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
//           .attr('x1', data.nodes[link.idSource].x + width_src)
//           .attr('y1', '0')
//           .attr('x2', nodes[link.idTarget].x)
//           .attr('y2', 0)
//         const n = nodes[link.idSource]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       }else {
//         d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
//           .attr('x1', data.nodes[link.idTarget].x + width_trgt)
//           .attr('y1', '0')
//           .attr('x2', nodes[link.idSource].x)
//           .attr('y2', 0)
//         const n = nodes[link.idTarget]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )

//     d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//       if (nodes[link.idSource].x > nodes[link.idTarget].x) {
//         const n = nodes[link.idSource]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         const n = nodes[link.idTarget]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )
//   } else if (l_ori === 'vv' || l_ori === 'hv') {
//     //orientation vert-vert
//     d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//       if (nodes[link.idSource].y < nodes[link.idTarget].y) {
//         d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
//           .attr('x1', 0)
//           .attr('y1', data.nodes[link.idSource].y + height_src)
//           .attr('x2', 0)
//           .attr('y2', data.nodes[link.idTarget].y)

//         return n_source_color
//       } else {
//         d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
//           .attr('x1', 0)
//           .attr('y1', data.nodes[link.idTarget].y + height_src)
//           .attr('x2', 0)
//           .attr('y2', data.nodes[link.idSource].y)

//         return n_target_color
//       }
//     }
//     )

//     d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//       if (nodes[link.idSource].y > nodes[link.idTarget].y) {
//         return n_source_color
//       } else {
//         return n_target_color
//       }
//     }
//     )
//   } else if (l_ori === 'vh') {

//     d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//       if (nodes[link.idSource].x < nodes[link.idTarget].x) {
//         d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
//           .attr('x1', data.nodes[link.idSource].x + width_src - 10)
//           .attr('y1', '0')
//           .attr('x2', nodes[link.idTarget].x)
//           .attr('y2', 0)
//         const n = nodes[link.idSource]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
//           .attr('x1', data.nodes[link.idTarget].x + width_trgt + 10)
//           .attr('y1', '0')
//           .attr('x2', nodes[link.idSource].x)
//           .attr('y2', 0)
//         const n = nodes[link.idTarget]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )

//     d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//       if (nodes[link.idSource].x > nodes[link.idTarget].x) {
//         const n = nodes[link.idSource]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_source_color
//       } else {
//         const n = nodes[link.idTarget]
//         if ( (ReturnValueNode(data,n,'colorSustainable'))) {
//           return ReturnValueNode(data,n,'color') as string
//         }
//         if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
//           const selected_tag = n.tags[n.colorTag][0]
//           const tag = data.nodeTags[n.colorTag].tags[selected_tag]
//           if (tag) {
//             return tag.color as string
//           }
//         }
//         return n_target_color
//       }
//     }
//     )

//   }
// }

// export const OSPDrawArrows : DrawArrowsType = (
//   n: SankeyNode,
//   applicationData,
//   scale:(t:number)=>number,
//   inv_scale:(t:number)=>number,
//   GetLinkValue:GetLinkValueFuncType,
//   display_style: display_styleType,

// ) => {
//   const {data}=applicationData
//   DrawArrows(n,applicationData,scale,inv_scale,GetLinkValue,display_style)
//   for (const id_link of n.inputLinksId) {
//     if ( data.links[id_link] ==undefined ) {
//       continue
//     }
//     const l_arrow=ReturnValueLink(data,data.links[id_link],'arrow')
//     const l_grad=OSPReturnValueLink(data as OSPData,data.links[id_link] as OSPLink,'gradient')
//     if(l_arrow && l_grad && data.linksColorMap==='no_colormap'){
//       d3.selectAll(' .opensankey #path_'+id_link+'_arrow').attr('fill',NodeColor(n,data)??'')
//     }
//   }
// }
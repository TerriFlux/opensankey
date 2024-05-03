// External imports
import React, { useState } from 'react'
import * as d3 from 'd3'

import { Badge } from 'react-bootstrap'
import { Checkbox } from '@chakra-ui/react'

// Local imports
import { PlusReturnValueLink, PlusAssignLinkValueToCorrectVar } from './SankeyPlusUtils'
import { SankeyPlusData, SankeyPlusNode, SankeyPlusLink } from '../types/Types'
import {
  LinkStrokeFType,
  dragNodeRedrawGradientFType,
  menu_conf_link_apparence_gradientFType
} from '../types/SankeyPlusGradientTypes'
import {
  ReturnValueLink,
  IsAllLinkAttrSameValue,
  ReturnValueNode,
  IsLinkDiplayingValueLocal,
  NodeColor,
  LinkStrokeOSTyped,
  DrawArrows,
  OSTooltip
} from './import/OpenSankey'

// OpenSankey types
import {
  SankeyLinkAttrLocal,
  SankeyNode,
  display_styleType
} from 'open-sankey/src/types/Types'
import { GetLinkValueFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'

// OpenSankey js-code
import {TooltipValueSurcharge} from 'open-sankey/dist/configmenus/SankeyUtils'
import { DrawArrowsType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'


export const menu_conf_link_apparence_gradient : menu_conf_link_apparence_gradientFType =(
  applicationContext,
  ComponentUpdater,
  multi_selected_links:{current:SankeyPlusLink[]},
  data:SankeyPlusData,
  link_function,
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_link,
)=>{
  const {t}=applicationContext
  const [forceUpdate,setForceUpdate]=useState(false)
  // I have to do this because when we change selected_style_link it only re-render SankeyModalStyleLink
  // who re-render MenuConfigurationLinksAppearence
  // but menu_conf_link_apparence_gradient is rendered outside the scope of SankeyModalStyleLink
  // so selected_style_link can be out of sync with the real selected_style_link
  if(menu_for_style && !Object.keys(data.style_link).includes(selected_style_link.current)){
    selected_style_link.current=(Object.keys(data.style_link)[0])
  }
  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[selected_style_link.current]]:multi_selected_links.current

  const k_list=['gradient'] as unknown as (keyof SankeyLinkAttrLocal)[]
  const gradChecked=IsAllLinkAttrSameValue(data,selected_parameter,k_list,menu_for_style)['gradient'] as boolean[]
  return <>

    <OSTooltip label={!is_activated?t('Menu.sankeyPlusDisabled'):''} >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isDisabled={!is_activated}
        isIndeterminate={gradChecked[1]}
        isChecked={gradChecked[0]}
        iconColor={gradChecked[1]?'#78C2AD':'white'}
        onChange={(evt) => {
          Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
            PlusAssignLinkValueToCorrectVar(d,'gradient',evt.target.checked,menu_for_style)
          })
          link_function.RedrawLinks(multi_selected_links.current)
          ComponentUpdater.updateComponenSaveInCache.current(false)

          setForceUpdate(!forceUpdate)
        }}>
        {t('Flux.apparence.grad')}
        {(!is_activated)?<Badge pill bg="info" style={{marginLeft:'auto'}}>{t('Menu.featureLocked')}</Badge>:<></>}
        {(IsLinkDiplayingValueLocal(multi_selected_links,(('gradient' as unknown) as (keyof SankeyLinkAttrLocal )),menu_for_style)?TooltipValueSurcharge('link_plus_var_',t):<></>)}

      </Checkbox>
    </OSTooltip>
  </>
}

export const PlusLinkStroke : LinkStrokeFType =(l:SankeyPlusLink,data:SankeyPlusData,GetLinkValue:GetLinkValueFuncType)=>{

  const defGradient = d3.select(' .opensankey #svg #sankey_def')
  const nodes = data.nodes

  const n_source=nodes[l.idSource]
  const n_source_color=ReturnValueNode(data,n_source,'color')

  const n_target=nodes[l.idTarget]
  const n_target_color=ReturnValueNode(data,n_target,'color')
  const l_ori=ReturnValueLink(data,l,'orientation')
  const l_grad=PlusReturnValueLink(data,l,'gradient')
  const l_recy=ReturnValueLink(data,l,'recycling')
  const source_svg = +d3.select(' .opensankey #shape_' + l.idSource)
  const target_svg = +d3.select(' .opensankey #shape_' + l.idTarget)
  if (source_svg == null || target_svg == null) {
    return LinkStrokeOSTyped(l,data,GetLinkValue)
  }

  const width_src = +d3.select(' .opensankey #shape_' + l.idSource).attr('width')
  const height_src = +d3.select(' .opensankey #shape_' + l.idSource).attr('height')
  const width_trgt = +d3.select(' .opensankey #shape_' + l.idTarget).attr('width')
  // const height_trgt = +d3.select(' .opensankey #shape_' + l.idTarget).attr('height')
  const gradient = defGradient.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
    .attr('gradientUnits', 'userSpaceOnUse')

  gradient.append('stop')
    .attr('id', 'stop-start')
    .attr('offset', '0%')
    .attr('stop-color', () => {
      if (nodes[l.idSource].x <= nodes[l.idTarget].x) {
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    })
    .attr('stop-opacity', 1)

  gradient.append('stop')
    .attr('id', 'stop-end')
    .attr('offset', '100%')
    .attr('stop-color', () => {
      if (nodes[l.idSource].x <= nodes[l.idTarget].x) {
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      } else {
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      }
    })
    .attr('stop-opacity', 1)
  if (l_ori === 'hh' || l_ori === 'hv') {
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if ( (!l_recy && nodes[l.idSource].x < nodes[l.idTarget].x) || (l_recy && nodes[l.idSource].x >= nodes[l.idTarget].x ) ) {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', nodes[l.idSource].x + width_src)
          .attr('y1', '0')
          .attr('x2', nodes[l.idTarget].x)
          .attr('y2', 0)
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', nodes[l.idTarget].x + width_trgt)
          .attr('y1', '0')
          .attr('x2', nodes[l.idSource].x)
          .attr('y2', 0)
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if ( (!l_recy && nodes[l.idSource].x > nodes[l.idTarget].x) || (l_recy && nodes[l.idSource].x <= nodes[l.idTarget].x)) {
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
  } else if (l_ori === 'vv' || l_ori === 'hv') {
    //orientation vert-vert
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].y < nodes[l.idTarget].y) {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', nodes[l.idSource].y + height_src)
          .attr('x2', 0)
          .attr('y2', nodes[l.idTarget].y)
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', nodes[l.idTarget].y + height_src)
          .attr('x2', 0)
          .attr('y2', nodes[l.idSource].y)
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].y > nodes[l.idTarget].y) {
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
  } else if (l_ori === 'vh') {
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].x < nodes[l.idTarget].x) {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', nodes[l.idSource].x + width_src - 10)
          .attr('y1', '0')
          .attr('x2', nodes[l.idTarget].x)
          .attr('y2', 0)
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', nodes[l.idTarget].x + width_trgt + 10)
          .attr('y1', '0')
          .attr('x2', nodes[l.idSource].x)
          .attr('y2', 0)
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].x > nodes[l.idTarget].x) {
        const n = n_source
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        const n = n_target
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
  }
  return (data.linksColorMap==='no_colormap' && l_grad) ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : LinkStrokeOSTyped(l,data,GetLinkValue)
}

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export const dragNodeRedrawGradient : dragNodeRedrawGradientFType =(
  nodes:{ [node_id: string]: SankeyPlusNode },
  link:SankeyPlusLink,
  data:SankeyPlusData
)=>{
  const width_src = +d3.select(' .opensankey #shape_' + link.idSource).attr('width')
  const height_src = +d3.select(' .opensankey #shape_' + link.idSource).attr('height')
  const width_trgt = +d3.select(' .opensankey #shape_' + link.idTarget).attr('width')
  //const height_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('height')


  const n_source=nodes[link.idSource]
  const n_source_color=ReturnValueNode(data,n_source,'color')

  const n_target=nodes[link.idTarget]
  const n_target_color=ReturnValueNode(data,n_target,'color')

  const l_ori=ReturnValueLink(data,link,'orientation')


  if (l_ori === 'hh' || l_ori === 'hv') {
    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].x < nodes[link.idTarget].x) {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idSource].x + width_src)
          .attr('y1', '0')
          .attr('x2', nodes[link.idTarget].x)
          .attr('y2', 0)
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      }else {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idTarget].x + width_trgt)
          .attr('y1', '0')
          .attr('x2', nodes[link.idSource].x)
          .attr('y2', 0)
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )

    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].x > nodes[link.idTarget].x) {
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )
  } else if (l_ori === 'vv' || l_ori === 'hv') {
    //orientation vert-vert
    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].y < nodes[link.idTarget].y) {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[link.idSource].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[link.idTarget].y)

        return n_source_color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[link.idTarget].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[link.idSource].y)

        return n_target_color
      }
    }
    )

    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].y > nodes[link.idTarget].y) {
        return n_source_color
      } else {
        return n_target_color
      }
    }
    )
  } else if (l_ori === 'vh') {

    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].x < nodes[link.idTarget].x) {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idSource].x + width_src - 10)
          .attr('y1', '0')
          .attr('x2', nodes[link.idTarget].x)
          .attr('y2', 0)
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', data.nodes[link.idTarget].x + width_trgt + 10)
          .attr('y1', '0')
          .attr('x2', nodes[link.idSource].x)
          .attr('y2', 0)
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )

    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].x > nodes[link.idTarget].x) {
        const n = nodes[link.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_source_color
      } else {
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n_target_color
      }
    }
    )

  }
}

export const SankeyPlusDrawArrows : DrawArrowsType = (
  n: SankeyNode,
  dict_variable_application_data,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  GetLinkValue:GetLinkValueFuncType,
  display_style: display_styleType,

) => {
  const {data}=dict_variable_application_data
  DrawArrows(n,dict_variable_application_data,scale,inv_scale,GetLinkValue,display_style)
  for (const id_link of n.inputLinksId) {
    const l_arrow=ReturnValueLink(data,data.links[id_link],'arrow')
    const l_grad=PlusReturnValueLink(data as SankeyPlusData,data.links[id_link] as SankeyPlusLink,'gradient')
    if(l_arrow && l_grad && data.linksColorMap==='no_colormap'){
      d3.selectAll(' .opensankey #path_'+id_link+'_arrow').attr('fill',NodeColor(n,data)??'')
    }
  }
}
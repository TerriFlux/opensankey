import React from 'react'
import { SankeyLinkValue} from 'open-sankey/src/lib/types'
import * as d3 from 'd3'
import { OverlayTrigger, Tooltip, InputGroup, Button, Badge} from 'react-bootstrap'
import {SankeyPlusData,SankeyPlusNode,SankeyPlusLink} from './types'
import { TFunction } from 'i18next'
import * as OpensankeyDrawFunction  from 'open-sankey/dist/SankeyDrawFunction'
import * as OpensankeyUtils from 'open-sankey/dist/SankeyUtils'
import { FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'


export const menu_conf_link_apparence_gradient=(
  t:TFunction,
  multi_selected_links:{current:SankeyPlusLink[]},
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_link:string,
)=>{

  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[selected_style_link]]:multi_selected_links.current
  const gradChecked=OpensankeyUtils.is_all_link_attr_same_value(data,selected_parameter,'gradient',menu_for_style)

  return <OverlayTrigger
      key={'gradiantDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'gradiantDisabled'}>{t('Menu.sankeyPlusDisabled')}</Tooltip>):<></>}
    >
    <InputGroup>
      <InputGroup.Text
        style={{
          color:(!is_activated)?'#666666':'',
          backgroundColor:(!is_activated)?'#cccccc':'',
          width:'40%'}}
      >
        {t('Flux.apparence.grad')+(OpensankeyUtils.is_link_diplaying_value_local(multi_selected_links,'gradient',menu_for_style)?'*':'')}
        {(!is_activated)?<Badge pill bg="info" style={{marginLeft:'auto'}}>{t('Menu.featureLocked')}</Badge>:<></>}
      </InputGroup.Text>
      <Button
        style={{width:'60%'}}
        className='btn_menu_config'
        disabled={!is_activated}
        variant={gradChecked?'primary':'outline-primary'}
        onClick={
          () => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
              OpensankeyUtils.assign_link_value_to_correct_var(d,'gradient',!gradChecked,menu_for_style)
            })
            set_data({ ...data })
          }
        }
      >{gradChecked?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
    </InputGroup>
  </OverlayTrigger>
}

export const linkStroke=(l:SankeyPlusLink,data:SankeyPlusData,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue)=>{

  const defGradient = d3.select(' .opensankey #svg #sankey_def')

  const nodes = data.nodes

  const n_source=nodes[l.idSource]
  const n_source_color=OpensankeyUtils.return_value_node(data,n_source,'color')

  const n_target=nodes[l.idTarget]
  const n_target_color=OpensankeyUtils.return_value_node(data,n_target,'color')

  const l_ori=OpensankeyUtils.return_value_link(data,l,'orientation')
  const l_grad=OpensankeyUtils.return_value_link(data,l,'gradient')
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
      if (nodes[l.idSource].x < nodes[l.idTarget].x) {
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
  return (l_grad) ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : OpensankeyDrawFunction.linkStroke(l,data,getLinkValue)
}

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export const dragNodeRedrawGradient=(nodes:{ [node_id: string]: SankeyPlusNode },
  link:SankeyPlusLink,
  data:SankeyPlusData
)=>{
  const width_src = +d3.select(' .opensankey #shape_' + link.idSource).attr('width')
  const height_src = +d3.select(' .opensankey #shape_' + link.idSource).attr('height')
  const width_trgt = +d3.select(' .opensankey #shape_' + link.idTarget).attr('width')
  //const height_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('height')


  const n_source=nodes[link.idSource]
  const n_source_color=OpensankeyUtils.return_value_node(data,n_source,'color')

  const n_target=nodes[link.idTarget]
  const n_target_color=OpensankeyUtils.return_value_node(data,n_target,'color')

  const l_ori=OpensankeyUtils.return_value_link(data,link,'orientation')


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


export const SankeyPlusDrawArrows = (
  n: SankeyPlusNode,
  data:SankeyPlusData,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  display_style: {filter: number},

) => {
  OpensankeyDrawFunction.drawArrows(n,data,display_nodes,scale,inv_scale,getLinkValue,display_style)
  for (let i = 0; i < n.inputLinksId.length; i++) {
    const l_arrow=OpensankeyUtils.return_value_link(data,data.links[n.inputLinksId[i]],'arrow')
    const l_grad=OpensankeyUtils.return_value_link(data,data.links[n.inputLinksId[i]],'gradient')
    if(l_arrow && l_grad){
      d3.selectAll(' .opensankey #path_'+n.inputLinksId[i]+'_arrow').attr('fill',OpensankeyUtils.node_color(n,data))
    }
  }
}
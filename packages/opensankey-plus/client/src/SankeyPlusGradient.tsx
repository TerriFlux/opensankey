import React from 'react'
import { SankeyLinkValue, TagsCatalog, SankeyData} from 'open-sankey/src/lib/types'
import * as d3 from 'd3'
import {  Col, Form, FormLabel, Row, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {SankeyPlusData,SankeyPlusNode,SankeyPlusLink, PlusDrawCurveType} from './types'
import { TFunction } from 'i18next'
import * as OpensankeyDrawFunction  from 'open-sankey/dist/SankeyDrawFunction'
import * as OpensankeyUtils from 'open-sankey/dist/SankeyUtils'

export const menu_conf_link_apparence_gradient=(t:TFunction,
  multi_selected_links:{current:SankeyPlusLink[]},
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  is_activated:boolean
)=>{
  const gradChecked = () => {
    let gradChecked = true
    multi_selected_links.current.map(d => {
      gradChecked = (d.gradient) ? gradChecked : false
    })
    return gradChecked
  }
  return <OverlayTrigger
    key={'gradiantDisabled'}
    placement={'top'}
    delay={500}
    overlay={(!is_activated)?(<Tooltip id={'gradiantDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
  >
    <Form.Group as={Row} >
      <Col>
        <FormLabel style={{color:(!is_activated)?'grey':'#555555'}} >{t('Flux.apparence.grad')}:</FormLabel>
      </Col>
      <Col>
        <Form.Check
          inline
          disabled={!is_activated}
          type="checkbox"
          checked={
            gradChecked()
          }
          onChange={
            evt => {
              // selected_link.gradient = evt.target.checked
              Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.gradient = evt.target.checked)
              set_data({ ...data })
            }
          }
        />
      </Col>
    </Form.Group></OverlayTrigger>
}

export const linkStroke=(l:SankeyPlusLink,data:SankeyPlusData,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue)=>{
  const defGradient = d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')



  const width_src = +d3.select(' .opensankey #' + l.idSource).attr('width')
  const height_src = +d3.select(' .opensankey #' + l.idSource).attr('height')
  const width_trgt = +d3.select(' .opensankey #' + l.idTarget).attr('width')
  // const height_trgt = +d3.select(' .opensankey #' + l.idTarget).attr('height')
  const gradient = defGradient.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
    .attr('gradientUnits', 'userSpaceOnUse')
  gradient.append('stop')
    .attr('id', 'stop-start')
    .attr('offset', '0%')
    .attr('stop-color', () => {
      if (data.nodes[l.idSource].x <= data.nodes[l.idTarget].x) {
        const n = data.nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        const n = data.nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    })
    .attr('stop-opacity', 1)
  gradient.append('stop')
    .attr('id', 'stop-end')
    .attr('offset', '100%')
    .attr('stop-color', () => {
      if (data.nodes[l.idSource].x <= data.nodes[l.idTarget].x) {
        const n = data.nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        const n = data.nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    })
    .attr('stop-opacity', 1)
  const nodes = data.nodes
  if (l.orientation === 'hh' || l.orientation === 'hv') {
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].x < nodes[l.idTarget].x) {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idSource].x + width_src)
          .attr('y1', '0')
          .attr('x2', nodes[l.idTarget].x)
          .attr('y2', 0)
        const n = data.nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idTarget].x + width_trgt)
          .attr('y1', '0')
          .attr('x2', nodes[l.idSource].x)
          .attr('y2', 0)
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].x > nodes[l.idTarget].x) {
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
  } else if (l.orientation === 'vv' || l.orientation === 'hv') {
    //orientation vert-vert
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].y < nodes[l.idTarget].y) {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[l.idSource].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[l.idTarget].y)
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[l.idTarget].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[l.idSource].y)
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].y > nodes[l.idTarget].y) {
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
  } else if (l.orientation === 'vh') {
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[l.idSource].x < nodes[l.idTarget].x) {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idSource].x + width_src - 10)
          .attr('y1', '0')
          .attr('x2', nodes[l.idTarget].x)
          .attr('y2', 0)
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
          .attr('x1', data.nodes[l.idTarget].x + width_trgt + 10)
          .attr('y1', '0')
          .attr('x2', nodes[l.idSource].x)
          .attr('y2', 0)
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
    d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[l.idSource].x > nodes[l.idTarget].x) {
        const n = nodes[l.idSource]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      } else {
        const n = nodes[l.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
  }
  return (l.gradient && l.colorParameter==='local') ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : OpensankeyDrawFunction.linkStroke(l,data,getLinkValue)
}

// Function used to create gradient for each link, but are used only if the link has the gradient varibale at true
export const dragNodeRedrawGradient=(nodes:{ [node_id: string]: SankeyPlusNode },
  link:SankeyPlusLink,
  data:SankeyPlusData
)=>{
  const width_src = +d3.select(' .opensankey #' + link.idSource).attr('width')
  const height_src = +d3.select(' .opensankey #' + link.idSource).attr('height')
  const width_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('width')
  //const height_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('height')


  if (link.orientation === 'hh' || link.orientation === 'hv') {
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
        return n.color
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
        return n.color
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
        return n.color
      } else {
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )
  } else if (link.orientation === 'vv' || link.orientation === 'hv') {
    //orientation vert-vert
    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
      if (nodes[link.idSource].y < nodes[link.idTarget].y) {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[link.idSource].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[link.idTarget].y)

        return nodes[link.idSource].color
      } else {
        d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
          .attr('x1', 0)
          .attr('y1', data.nodes[link.idTarget].y + height_src)
          .attr('x2', 0)
          .attr('y2', data.nodes[link.idSource].y)

        return nodes[link.idTarget].color
      }
    }
    )

    d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
      if (nodes[link.idSource].y > nodes[link.idTarget].y) {
        return nodes[link.idSource].color
      } else {
        return nodes[link.idTarget].color
      }
    }
    )
  } else if (link.orientation === 'vh') {

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
        return n.color
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
        return n.color
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
        return n.color
      } else {
        const n = nodes[link.idTarget]
        if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag) {
            return tag.color as string
          }
        }
        return n.color
      }
    }
    )

  }
}


export const SankeyPlusDrawArrows = (
  n: SankeyPlusNode,
  selected_tags: { [tag_group: string]: string[] },
  data:SankeyPlusData,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  display_style: {filter: number},

) => {
  OpensankeyDrawFunction.drawArrows(n,selected_tags,data,scale,inv_scale,getLinkValue,display_style)
  for (let i = 0; i < n.inputLinksId.length; i++) {
    if(data.links[n.inputLinksId[i]].arrow && data.links[n.inputLinksId[i]].gradient){
      d3.selectAll(' .opensankey #'+n.inputLinksId[i]+'_arrow').attr('fill',OpensankeyUtils.node_color(n,data))
    }
  }
}
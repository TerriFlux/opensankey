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

export const dragging=(node:SankeyPlusNode,
  nodes: { [node_id: string]: SankeyPlusNode },
  links: { [link_id: string]: SankeyPlusLink },
  display_style: { filter: number; filter_label: number },
  nodeTags: TagsCatalog,
  event: { dx: number; dy: number },
  data:SankeyPlusData,
  min_width_and_height:(d:SankeyData)=>number[],
  drawGrid:(d:SankeyPlusData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  min_thickness:number,
  drawCurveFunction : {curve:PlusDrawCurveType},
  multi_selected_links:{current: SankeyPlusLink[] },
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,
    getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
)=>{
  const old_x = +node.x
  const old_y = +node.y
  const new_x = old_x + event.dx
  const new_y = old_y + event.dy


  if (new_x < 0 || new_x > (data.width - node.node_width) || new_y < 0 || new_y > (data.height - node.node_height)) {
    return
  }

  node.x = new_x
  node.y = new_y;



  [data.width, data.height] = min_width_and_height(data)
  if (data.fit_screen) {
    const svgSankey = d3.select(' .opensankey #svg')
    svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
  } else {
    d3.select(' .opensankey #svg').style('width', data.width + 'px')
  }



  d3.select(' .opensankey #svg').style('height', data.height + 'px')
  drawGrid(data)

  const stream_io = node.inputLinksId.concat(node.outputLinksId)
  //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs
  for (const i in stream_io) {
    const l = links[stream_io[i]]
    if ( !data.nodes[l.idSource].display && !data.nodes[l.idTarget].display) {
      continue
    }

    //position noeud source ou target
    let pos_x_src, pos_y_src
    if (node.idNode === nodes[l.idSource].idNode) {
      pos_x_src = nodes[l.idTarget].x
      pos_y_src = nodes[l.idTarget].y
    } else {
      pos_x_src = nodes[l.idSource].x
      pos_y_src = nodes[l.idSource].y
    }


    const link_value = OpensankeyUtils.test_link_value(data, nodes, l,getLinkValue)
    //Zones limite à ne pas êtres
    const limit_x = [pos_x_src - scale(link_value), pos_x_src + node.node_width + scale(link_value)]
    const limit_y = [pos_y_src - scale(link_value), pos_y_src + scale(link_value)]

    let draw_warning = false

    //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
    //si partie gauche du noeud ne se situe pas dans les coord du noeud source
    const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
    //si partie droite du noeud ne se situe pas dans le noeud source
    const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
    //si partie haute du noeud ne se situe pas dans le noeud source
    const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
    //const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]

    if (l.orientation === 'hh') {
      //orientation hh
      draw_warning = left_in_src || right_in_src
    } else if (l.orientation === 'vv') {
      //orientation vv
      draw_warning = top_in_src
    } else if (l.orientation === 'vh') {
      draw_warning = left_in_src || right_in_src || top_in_src
    } else {
      //orientation hv
      draw_warning = left_in_src || right_in_src || top_in_src
    }

    if (draw_warning && !l.recycling) {
      d3.select(' .opensankey #' + l.idLink).attr('stroke-width', '1px')
    } else {
      //retour à la normal
      d3.select(' .opensankey #' + l.idLink).attr('stroke-width', d => {
        const link_value = OpensankeyUtils.test_link_value(data, nodes, (d as SankeyPlusLink),getLinkValue)
        const tmp=(link_value === '')?1:link_value
        return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))
      })
    }
  }

  sankeyTooltip.style('opacity', 0) // Fermeture de la tooltip au click

  d3.select(' .opensankey #ggg_'+node.idNode).attr('transform', 'translate(' + new_x + ',' + new_y + ')')
  d3.select(' .opensankey #tooltip_node' + node.idNode).attr('transform', 'translate(' + (new_x + 50) + ',' + (new_y + 20) + ')')
  const error_msg: { [text: string]: string } = {}
  Object.values(links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display).forEach(
    link => {


      //Redessine les gradients correctement si la pos du noeud source passe de l'autre coté du noeud target
      if (link.gradient) {
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
            } else {
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

      if (link.label_on_path) {
        if (link.recycling) {
          if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
            d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'left')
          } else if (link.label_position === 'middle' && link.orientation === 'hh') {
            d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'right')
          }
        } else {
          if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
            d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'left')
          } else if (link.label_position === 'middle' /*&& link.orientation === 'hh'*/) {
            d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'right')
          }
        }

        if (link.orthogonal_label_position === 'middle') {
          d3.select(' .opensankey #' + link.idLink + '_text').attr('dy', '0.3em')
        } else if (link.orthogonal_label_position === 'below') {
          let tmp=getLinkValue(data, link.idLink).value
          tmp=(tmp)?tmp:0
          // return scale(getLinkValue(data, link.idLink).value) / 2 + 10 + 'px'
          d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 10 + 'px')
          d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 10 + 'px')

        } else if (link.orthogonal_label_position === 'above') {
          let tmp=getLinkValue(data, link.idLink).value
          tmp=(tmp)?tmp:0
          // return -scale(getLinkValue(data, link.idLink).value) / 2 + 'px'
          d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 'px')

        }

      }

      if (link.idSource === node.idNode || link.idTarget === node.idNode) {
        // Redraw link
        const old_x_pos = +d3.select(' .opensankey #' + link.idLink + '_text').attr('x')
        const old_y_pos = +d3.select(' .opensankey #' + link.idLink + '_text').attr('y')
        if (!(link.label_position === 'frozen')) {
          d3.select(' .opensankey #' + link.idLink + '_text').attr('x', old_x_pos + 1 / 2 * (new_x - old_x))
          d3.select(' .opensankey #' + link.idLink + '_text').attr('y', old_y_pos + 1 / 2 * (new_y - old_y))
        }
        // select allows to redraw directly without refreshing
        d3.select(' .opensankey #' + link.idLink)
          .attr('d', () => {
            return drawCurveFunction.curve(data,nodes, links, display_style,data.nodeTags,link,error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue,SankeyPlusDrawArrows)
          })
        const target_node = nodes[link.idTarget]
        if (link.arrow) {
          //const selection = (d3.select(this!) as unknown) as d3.Selection<d3.BaseType, SankeyPlusNode, HTMLElement, SankeyPlusNode>
          //const node_select = d3.select('#ggg_' + target_node.idNode) as d3.Selection<d3.BaseType, SankeyPlusNode, HTMLElement, SankeyPlusNode>
          SankeyPlusDrawArrows(target_node as SankeyPlusNode,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
        }
        for (let i = 0; i < target_node.inputLinksId.length; i++) {
          d3.select(' .opensankey #' + target_node.inputLinksId[i])
            .attr('d', (link => {
              return drawCurveFunction.curve(data,
                nodes, links, display_style,
                nodeTags,
                  link as SankeyPlusLink,
                  error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue,SankeyPlusDrawArrows
              )
            }))
        }
        for (let i = 0; i < target_node.outputLinksId.length; i++) {
          d3.select(' .opensankey #' + target_node.outputLinksId[i])
            .attr('d', link => {
              return drawCurveFunction.curve(data,
                nodes, links, display_style,
                nodeTags,
                  link as SankeyPlusLink,
                  error_msg,
                  multi_selected_links,
                  link_text,min_width_and_height,getLinkValue,SankeyPlusDrawArrows
              )
            })

        }
      }
    })

  if (error_msg.text !== undefined) {
    alert(error_msg)
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
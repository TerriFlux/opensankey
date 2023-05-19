import React from 'react'
import { Col, Form, FormCheck, FormLabel, Row,Tab,OverlayTrigger,Tooltip,Badge } from 'react-bootstrap'
import {  SankeyLink,TagsCatalog,SankeyDrawCurve} from 'open-sankey/src/lib/types'
import { TFunction } from 'i18next'
import {removeAnimate} from 'open-sankey/dist/SankeyDrawFunction'
import { SankeyPlusDrawArrows,dragNodeRedrawGradient } from './SankeyPlusGradient'


import * as d3 from 'd3'
import {SankeyPlusData,SankeyPlusNode,SankeyPlusLink} from './types'
import {  getLinkValue,test_link_value } from 'open-sankey/dist/SankeyUtils'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodeFO = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean
)=> {

  const isAllFOVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.has_FO) ? true : visible)
    return visible
  }

  return <Tab eventKey="node_fo" title={<>{t('Noeud.FO.FO')} <Badge pill bg="info" style={{marginLeft:'auto'}}>Beta</Badge></>} >
    <OverlayTrigger
      key={'foDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'foDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <Form>
        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:(is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Visibilité')}</FormLabel>
          </Col>
          <Col xs={8}>
            <FormCheck inline
              type='switch'
              checked={isAllFOVisible()}
              disabled={!is_activated}
              onChange={evt => {

                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.has_FO = evt.target.checked)
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>


        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:((is_activated)?isAllFOVisible():false)?'#555555':'#DADADA'}}>{t('Noeud.FO.content')}</FormLabel>
          </Col>
          <Col xs={8}>
            <Form.Control
              as="textarea"
              rows={5}
              disabled={!is_activated?true:!isAllFOVisible()}
              value={multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].FO_content:''}
              onChange={(evt) => {
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.FO_content = evt.target.value
                })
                set_data({ ...data })
              }}
            />
          
          </Col>
        </Form.Group>
     
      </Form></OverlayTrigger>
  </Tab>
}






export const SankeyPlusDrawNodesFO = (
  data:SankeyPlusData, 
  mode_selection:string,
  static_sankey:boolean,
  nodeTooltipsContent: (data: SankeyPlusData, d: SankeyPlusNode) => string,
  
) => {

  
  const node_mouse_over=(data:SankeyPlusData,t:d3.BaseType,mode_selection:string,static_sankey:boolean,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    d3.select(t).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
    if ((d as SankeyPlusNode).display && (window.SankeyToolsStatic || event.shiftKey)) {
      sankeyTooltip
        .style('opacity', 1)
        .html(nodeTooltipsContent(data, d as SankeyPlusNode))
    }
  }
        
  const node_mouse_move=(static_sankey:boolean,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    if (((d as SankeyPlusNode).display) && (window.SankeyToolsStatic || event.shiftKey)) {
      const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))     
      let pos_tooltip_y= event.clientY
      const size_browser=window.innerHeight 
      pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY
        
      const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))     
      let pos_tooltip_x= event.clientX
      const size_browser_w=window.innerWidth 
      pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30
            
      sankeyTooltip
        .style('top',pos_tooltip_y + 'px')
        .style('left',pos_tooltip_x + 'px')
    }
  }
        




    

    
  const add_nodes_fo = (
  ) => {
    //----------------ICON-----------------
        
    // Add icon to node (if there is one associated to it)
    // then apply selected parameter
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

    const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyPlusNode, d3.BaseType, unknown>)

    ggg_nodes.filter((d)=>{
      return d.has_FO
    }) .append('foreignObject')
      .attr('width',(n)=>+d3.select(' .opensankey #' + n.idNode).attr('width'))
      .attr('height',(n)=>+d3.select(' .opensankey #' + n.idNode).attr('height'))
      .attr('id',(d)=> d.idNode + '_fo')
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,static_sankey,event,d,sankeyTooltip)
      })
      .on('mousemove', function (event,d) {
        node_mouse_move(static_sankey,event,d,sankeyTooltip)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .append('xhtml:div')
      .html((d)=>d.FO_content)

  }
  add_nodes_fo()
  
}

export  const SankeyPlusDrag_nodes = (
  nodes: { [node_id: string]: SankeyPlusNode },
  links: { [link_id: string]: SankeyPlusLink },
  display_style: { italic?: boolean; bold?: boolean; node_font_size: number;  uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },
  nodeTags: TagsCatalog,
  dragged:Element,
  event: { dx: number; dy: number },
  data:SankeyPlusData,
  multi_selected_nodes:{current: SankeyPlusNode[] },
  min_width_and_height:(d:SankeyPlusData)=>number[],
  drawGrid:(d:SankeyPlusData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  min_thickness:number,
  drawCurveFunction : SankeyDrawCurve,
  multi_selected_links:{current: SankeyLink[] },
  link_text:(data: SankeyPlusData, d: SankeyLink) => unknown


) => {
  const { width } = data
  removeAnimate()
  
  if(multi_selected_nodes.current.length>0){
    multi_selected_nodes.current.map(node=>{
  
      const old_x = +node.x
      const old_y = +node.y
      const new_x = old_x + event.dx
      const new_y = old_y + event.dy
  
  
      if (new_x < 0 || new_x > (width - node.node_width) || new_y < 0 || new_y > (data.height - node.node_height)) {
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
        if (node.idNode == nodes[l.idSource].idNode) {
          pos_x_src = nodes[l.idTarget].x
          pos_y_src = nodes[l.idTarget].y
        } else {
          pos_x_src = nodes[l.idSource].x
          pos_y_src = nodes[l.idSource].y
        }
        const link_value = test_link_value(data, nodes, l)
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
        if (l.orientation == 'hh') {
        //orientation hh
          draw_warning = left_in_src || right_in_src
        } else if (l.orientation == 'vv') {
        //orientation vv
          draw_warning = top_in_src
        } else if (l.orientation == 'vh') {
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
            const link_values = getLinkValue(data, (d as SankeyLink).idLink)
            const is_free = link_values.extension!.free_mini !== undefined && 
                            data.show_structure !== 'free_interval' &&
                            data.show_structure !== 'free_value' &&
                            !link_values.extension!.free_visible
            if (is_free) {
              return 5
            }
            const link_value = test_link_value(data, nodes, (d as SankeyLink))
            const tmp=(link_value=='')?1:link_value
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
            dragNodeRedrawGradient(nodes,link,data)
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
                return drawCurveFunction.curve(data,
                  nodes, links, display_style,
                  data.nodeTags,
                  link,
                  error_msg,multi_selected_links,link_text
                )
              })
            const target_node = nodes[link.idTarget]
            if (link.arrow) {
              SankeyPlusDrawArrows(target_node,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
            }
            for (let i = 0; i < target_node.inputLinksId.length; i++) {
              d3.select(' .opensankey #' + target_node.inputLinksId[i])
                .attr('d', (link => {
                  return drawCurveFunction.curve(data,
                    nodes, links, display_style,
                    nodeTags,
                      link as SankeyLink,
                      error_msg,multi_selected_links,link_text
                  )
                }))
            }
            for (let i = 0; i < target_node.outputLinksId.length; i++) {
              d3.select(' .opensankey #' + target_node.outputLinksId[i])
                .attr('d', link => {
                  return drawCurveFunction.curve(data,
                    nodes, links, display_style,
                    nodeTags,
                      link as SankeyLink,
                      error_msg,multi_selected_links,link_text
                  )
                })
  
            }
          }
        })
  
      if (error_msg.text !== undefined) {
        alert(error_msg)
      }
  
    })
  }else{
    const idNode = dragged.id.substring(4)
    const node=nodes[idNode]

    const old_x = +node.x
    const old_y = +node.y
    const new_x = old_x + event.dx
    const new_y = old_y + event.dy

  
    if (new_x < 0 || new_x > (width - node.node_width) || new_y < 0 || new_y > (data.height - node.node_height)) {
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
      if (node.idNode == nodes[l.idSource].idNode) {
        pos_x_src = nodes[l.idTarget].x
        pos_y_src = nodes[l.idTarget].y
      } else {
        pos_x_src = nodes[l.idSource].x
        pos_y_src = nodes[l.idSource].y
      }
  
  
      const link_value = test_link_value(data, nodes, l)
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
  
      if (l.orientation == 'hh') {
        //orientation hh
        draw_warning = left_in_src || right_in_src
      } else if (l.orientation == 'vv') {
        //orientation vv
        draw_warning = top_in_src
      } else if (l.orientation == 'vh') {
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
          const link_value = test_link_value(data, nodes, (d as SankeyLink))
          const tmp=(link_value=='')?1:link_value
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
  
  
          if (link.orientation == 'hh' || link.orientation == 'hv') {
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
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
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
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
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
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              } else {
                const n = nodes[link.idTarget]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              }
            }
            )
          } else if (link.orientation == 'vv' || link.orientation == 'hv') {
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
          } else if (link.orientation == 'vh') {
  
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
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
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
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
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
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              } else {
                const n = nodes[link.idTarget]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
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
              return drawCurveFunction.curve(data,nodes, links, display_style,data.nodeTags,link,error_msg,multi_selected_links,link_text)
            })
          const target_node = nodes[link.idTarget]
          if (link.arrow) {
            SankeyPlusDrawArrows(target_node,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
          }
          for (let i = 0; i < target_node.inputLinksId.length; i++) {
            d3.select(' .opensankey #' + target_node.inputLinksId[i])
              .attr('d', (link => {
                return drawCurveFunction.curve(data,
                  nodes, links, display_style,
                  nodeTags,
                  link as SankeyLink,
                  error_msg,multi_selected_links,link_text
                )
              }))
          }
          for (let i = 0; i < target_node.outputLinksId.length; i++) {
            d3.select(' .opensankey #' + target_node.outputLinksId[i])
              .attr('d', link => {
                return drawCurveFunction.curve(data,
                  nodes, links, display_style,
                  nodeTags,
                  link as SankeyLink,
                  error_msg,
                  multi_selected_links,
                  link_text
                )
              })
  
          }
        }
      })
  
    if (error_msg.text !== undefined) {
      alert(error_msg)
    }
  }

}
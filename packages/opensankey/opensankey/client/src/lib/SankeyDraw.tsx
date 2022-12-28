/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { SankeyNode, SankeyLink, SankeyDataPropTypes, TagsCatalog, SankeyData, SankeyNodePropTypes, SankeyLinkPropTypes, SankeyLabelPropTypes, SankeyLinkValue } from './types'
import PropTypes, { InferProps } from 'prop-types'
import * as SankeyShapes from './SankeyShapes'
import { compute_total_offsets, getLinkValue, setSelectedTags, link_visible,test_link_value,link_color } from './SankeyUtils'
import { AgregationModal } from './SankeyLayout'
import {strokeDasharray,textLinkPosDY,textLinkSide,linkStrokeWidth,linkStroke,eventLinkClick,
  compute_end_points,nodeTransform,eventNodeClick,eventNodeContextMenu,textNodeWrap,textNodeValue,
  setNodeHeight,node_color,removeAnimate,drawArrows,eventLabelClick,keyHandler,eventOnSankeyZone,eventOnMouseUpAddNodesAndLink,addNodesNotToScale} from './SankeyDrawFunction'
import {dragLinkEvent,dragLinkTextEvent,dragLinkCenterHandleEvent,dragLinkShiftHandleEvent,dragNodeEvent,
  dragNodeTextEventWidthBoxEvent,dragNodeTextEvent,dragLabelEventTextEvent,dragLabelEvent,dragLabelWidthHeightEvent,add_drag_link_zone} from './SankeyDrag'

window.d3 = d3

const SankeyDrawPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  select_node: PropTypes.func.isRequired,
  node_arrow_visible: PropTypes.func.isRequired,

  select_link: PropTypes.func.isRequired,
  link_text: PropTypes.func.isRequired,
  // test_link_value: PropTypes.func.isRequired,

  button_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLLabelElement)}),
  accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),
  nodes_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),
  links_accordion_ref: PropTypes.shape({current:PropTypes.instanceOf(HTMLDivElement)}),

  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  multi_selected_label: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLabelPropTypes).isRequired).isRequired}).isRequired,

  nodeTooltipsContent: PropTypes.func.isRequired,
  linkTooltipsContent: PropTypes.func.isRequired,

  set_show_toast: PropTypes.func.isRequired,
  current: PropTypes.bool.isRequired,

  mode_selection: PropTypes.string.isRequired,
  set_mode_selection: PropTypes.func.isRequired,

  view: PropTypes.string.isRequired,
  set_view: PropTypes.func.isRequired,

  mode_visualisation:PropTypes.bool.isRequired,
}

export const SankeyDrawDefaultProps = {
  set_data: () => null,
  select_node: () => null,
  node_arrow_visible: () => true,

  select_link: () => null,

  // set_show_nav: () => null,
  // set_nav_item_active: () => null,
  // set_sub_nav_item_active: () => null,
  button_ref: null,
  accordion_ref: null,
  nodes_accordion_ref: null,
  links_accordion_ref: null,

  nodeTooltipsContent: () => null,
  linkTooltipsContent: () => null,

  multi_selected_nodes: {current : []},
  multi_selected_links: {current : []},
  multi_selected_label: {current : []},

  set_show_toast: () => null,
  current: true,

  mode_selection: '',
  set_mode_selection: () => null,

  view: '',
  set_view: () => null,

  mode_visualisation:false,

}

type SankeyDrawTypes = InferProps<typeof SankeyDrawPropTypes>

const SankeyDraw: FunctionComponent<SankeyDrawTypes> = ({
  data,
  link_text,
  // test_link_value,
  set_data = SankeyDrawDefaultProps.set_data,
  select_node = SankeyDrawDefaultProps.select_node,
  node_arrow_visible = SankeyDrawDefaultProps.node_arrow_visible,
  select_link = SankeyDrawDefaultProps.select_link,
  button_ref = SankeyDrawDefaultProps.button_ref,
  accordion_ref = SankeyDrawDefaultProps.accordion_ref,
  nodes_accordion_ref = SankeyDrawDefaultProps.nodes_accordion_ref,
  links_accordion_ref = SankeyDrawDefaultProps.links_accordion_ref,

  nodeTooltipsContent = SankeyDrawDefaultProps.nodeTooltipsContent,
  linkTooltipsContent = SankeyDrawDefaultProps.linkTooltipsContent,
  multi_selected_nodes = SankeyDrawDefaultProps.multi_selected_nodes,
  multi_selected_links = SankeyDrawDefaultProps.multi_selected_links,
  multi_selected_label = SankeyDrawDefaultProps.multi_selected_label,
  set_show_toast,
  current,
  mode_selection,
  view, set_view,
  mode_visualisation

}) => {

  const [show_agregation, set_show_agregation] = useState(false)
  const [agregation_node, set_agregation_node] = useState('')
  const [is_agregation, set_is_agregation] = useState(true)

  // const default_node_size = data.node_width
  const default_handle_size = 10
  const default_horiz_shift = 50
  const min_thickness = 2

  const display_nodes = data.nodes
  const display_links = data.links
  let first_selected_node = {}
  // const diff=require('deep-diff')

  // Il faut détruire les tooltips à chaque passage dans le draw
  d3.selectAll('.sankey-tooltip').remove()

  const sankeyTooltip = d3.select('body')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sankey-tooltip')

  let alt_key_pressed = false

  setSelectedTags(data)

  const min_width_and_height = () => {
    let height = 0
    let width = 0
    Object.values(data.nodes).filter(n => n.node_visible).forEach(n => {
      height = (n.y && n.node_visible) ? Math.max(height, n.y) : height
      width = (n.x && n.node_visible) ? Math.max(width, n.x) : width
    })

    Object.values(data.labels).forEach(n => {
      height = (n.y) ? Math.max(height, n.y) : height
      width = (n.x ) ? Math.max(width, n.x) : width
    })

    height = height + 200
    width = width + 200
    Object.values(data.links).forEach(l => {
      if (l.recycling) {
        height = (l.vert_shift && data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible) ? Math.max(data.nodes[l.idSource].y + l.vert_shift + 100, data.nodes[l.idTarget].y + l.vert_shift + 100, height) : height
      }
    })

    Object.values(data.links).forEach(l => {
      if (l.recycling) {
        width = (data.nodes[l.idTarget].x && data.nodes[l.idTarget].node_visible && l.right_horiz_shift) ? Math.max(width, data.nodes[l.idSource].x + l.right_horiz_shift + default_horiz_shift + 150) : width
      }
    })
    return [Math.max(width, window.innerWidth - 40), Math.max(height, window.innerHeight - 40)]
  }


  const add_links = (
    static_sankey: boolean,
    remove_previous_links = false
  ) => {
    // Structure svg du link
    //- link : 
    //- text : 
    //- rect :
    //- rect :
    //- arrow :       
    d3.selectAll('#svg #sankey_def').remove()
    const defGradient = d3.select('#svg').append('defs').attr('id', 'sankey_def')


    const { display_style } = data
    if (remove_previous_links) {
      d3.select('#g_links').selectAll('.gg_links').remove()
    }
    d3.select('#svg').selectAll('.link_value').remove()

    if (display_links === undefined) {
      return
    }
    const gg_links = d3
      .select('#g_links')
      .selectAll('.gg_links')
      .data(Object.values(display_links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display))
      .enter()
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d, data)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')
      .attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
      .attr('stroke-dasharray', d => {
        return strokeDasharray(d,data)
      })

    const paths = gg_links.append('path')
    if (!static_sankey && !mode_visualisation) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(dragLinkEvent(multi_selected_links,data,display_nodes,display_links,error_msg,display_style,drawCurve,scale,inv_scale,min_thickness)
      )

    }
    gg_links
      .filter(
        d => d.label_position !== 'frozen' && d.label_on_path === true
      )
      .append('text')
      .attr('pointer-events', 'none')
      // .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
      .attr('style',d=> 'font-weight: bold; font-size:' + d.label_font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color) {
          return link_color(l,data) as string
        }
        return l.text_color
      })
      .attr('dy', l =>textLinkPosDY(l,data,scale))
      .append('textPath')
      .attr('id', d => d.idLink + '_text')
      .attr('side', link => textLinkSide(link,data))
      .attr('class', 'link_value')
      .attr('href', d => '#' + d.idLink)


    const select2 = gg_links
      .filter(d => d.label_position === 'frozen' || !d.label_on_path || d.label_on_path === undefined)
      .append('text')


    select2
      .attr('href', d => '#' + d.idLink)
      .attr('id', d => d.idLink + '_text')
      .attr('pointer-events',d=>(d.label_position!=='frozen')?'none':'auto')
      .attr('class', 'link_value')
      .attr('style',d=> 'font-weight: bold;font-size:' + d.label_font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
          return 'white'
        }
        return l.text_color
      })
      .attr('visibility', d => {
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        
        return  link_visible(d, data) && tmp >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden'
      })

    if (!static_sankey && !mode_visualisation) {
      // A voir avec Julien
      select2.call(dragLinkTextEvent(alt_key_pressed)
      )
        .on('click', (event, d) => {
          const source_node = display_nodes[d.idSource]
          const target_node = display_nodes[d.idTarget]
          select_link(d)
          // if classic link
          if (d.orientation === 'hh' && source_node.x < target_node.x) {
            d3.select('#link_center' + d.idLink).attr('fill-opacity', 0.7)
          }
        })
    }

    if (!static_sankey) {
      
      select2.call(dragLinkTextEvent(alt_key_pressed))
    }
    let error_msg: { text?: string | undefined } | undefined
    paths
      .attr('class', 'link')
      .attr('id', d => d.idLink)
      .attr('fill', 'none')
      .attr('stroke-opacity', d => {
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        return data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && tmp >= display_style.filter ? (!((data as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data, d.idLink).display_value).includes('[')) ? 0.85 : 0.85) : 0})
      .attr('stroke-width', l =>linkStrokeWidth(l,data,scale,inv_scale,min_thickness,display_nodes))

      .attr('stroke', l => linkStroke(l,data,defGradient)
      )
      .on('mouseover', function (event, d) {
        if (!event.shiftKey && !static_sankey) {
          return
        }
        sankeyTooltip
          .html(linkTooltipsContent(data, d))
        
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible  && tmp >= display_style.filter) {
          d3.select('#arrow_'+d.idLink).attr('opacity','0.5')
          return d3.select(this).attr('stroke-opacity', '0.5')
        }
      })
      .on('mousemove', (event) => {
        if (!event.shiftKey && !static_sankey) {
          return
        }
        sankeyTooltip
          .style('opacity', 1)
          .style('top', Math.max(margin_top + 50, event.pageY - 10) + 'px')
          .style('left', (event.pageX + 30) + 'px')
      })
      .on('mouseout', function (event, d) {
        sankeyTooltip.style('opacity', 0)
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && tmp >= display_style.filter) {
          const opacity = String(getLinkValue(data, d.idLink).display_value).includes('[') ? 0.85 : 0.85
          d3.select('#arrow_'+d.idLink).attr('opacity','1')
          return d3.select(this).attr('stroke-opacity', opacity)
        }
      })

    paths.on('click', (event, d) =>eventLinkClick(event,d,mode_visualisation,sankeyTooltip,accordion_ref,button_ref,multi_selected_links,links_accordion_ref,select_link))
    const arrowVisible=(l :SankeyLink)=>{
      return  data.nodes[l.idSource].display && data.nodes[l.idTarget].display && l.arrow

    }
    //Creation des Arrows associés au link
    d3.selectAll('.ggg_nodes')
      .filter(n => node_arrow_visible(n))      
    //   .each(function (n) {
    //     drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags)
    //   })


    d3.selectAll('.gg_links')
      .filter(l=>arrowVisible(l as SankeyLink))
      .each(function (l) {
        const n =data.nodes[(l as SankeyLink).idTarget]
        drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags,scale,inv_scale,min_thickness)
      })

    paths.attr('d', d => {
      setNodesHeight(display_nodes, display_links, d, data.nodeTags)
      return drawCurve(data,
        display_nodes, display_links, display_style,
        data.nodeTags, d, error_msg
      )
    })

    d3.selectAll('.gg_links')
      .filter(l=>{
        return Number(d3.select('#'+(l as SankeyLink).idLink).attr('stroke-opacity'))!=0
      })
      .each(function (l) {
        if((l as SankeyLink).orientation=='vv' ||(l as SankeyLink).orientation=='hh'){
          add_drag_link_zone((l as SankeyLink),data.nodes,data,multi_selected_links,mode_visualisation,display_nodes,display_links,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurve)
        }
      })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
    }
  }



  const update_scale = (user_scale: number) => {
    scale.domain([0, user_scale])
    inv_scale.range([0, user_scale])
  }

 

  

  



  


  

  const center_handle_position=(link:SankeyLink,
    xs: number,
    ys: number,
    xt: number,
    yt: number
  )=>{      
    const center_handle = 1/2

    const handle_pos = handles_positions(data.links, link, xs, ys, xt, yt)

    if((link.orientation=='hh' || link.orientation=='vv')){
      const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
      const [xt2,yt2]=(handle_pos[1].replace('translate(','').replace(')','').split(','))
      const sx=Number(xs2)
      const sy=Number(ys2)
      const tx=Number(xt2)
      const ty=Number(yt2)
      if (link.orientation === 'hh') {
  
        const shift_left = 'translate(' + (sx + (tx - sx) * center_handle) + ', ' + (sy + (ty - sy) * center_handle+default_handle_size/2) + ')'
        return [shift_left]
      } else if (link.orientation === 'vv') {
        
        const shift_left = 'translate(' + (sx + (tx - sx) * center_handle+default_handle_size/2) + ', ' + (sy + (ty - sy) * center_handle) + ')'
        return [shift_left]
  
      }
    }else{
      const [xs2,ys2]=handle_pos[0].replace('translate(','').replace(')','').split(',')
      const sx=Number(xs2)
      const sy=Number(ys2)

      const center = 'translate(' + (sx ) + ', ' + (sy) + ')'
      return [center]
    
    }
    
    return ['']
  }

  const add_center_handle=(link:SankeyLink,
    selected_tags: { [tag_group: string]: string[] },
  )=>{
    d3.selectAll('#center_handle_' + link.idLink).remove()
    if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)  && !link.recycling ) {
    
      const source_node=data.nodes[link.idSource]
      const target_node=data.nodes[link.idTarget]
      const [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, data.nodes, data.links, (data.nodeTags as TagsCatalog),data,scale,inv_scale)

      const pos_d=center_handle_position(link,xs,ys,xt,yt)
      d3.select('#gg_' + link.idLink)
        .append('circle')
        .attr('id', 'center_handle_' + link.idLink)
        .attr('class','center_handle')
        .attr('fill-opacity', (multi_selected_links.current.includes(link) && !mode_visualisation)?1:0)
        .attr('r','5')
        .attr('stroke','black')
        .attr('stroke-opacity',(multi_selected_links.current.includes(link))?1:0)
        .attr('fill','black')
        .attr('transform',pos_d[0])
        .attr('cursor',(multi_selected_links.current.includes(link) && (link.orientation=='vv' ||link.orientation=='hh'))?'ew-resize':'pointer')
        .call(dragLinkCenterHandleEvent(multi_selected_links,link,data,selected_tags,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurve)
        )
    }

  }
  const add_shift_handle = (
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number;  filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    shift_name: string,
    position: string
  ) => {
    if (Object.values(data.links).map(d => d.idLink).includes(link.idLink)) {
      d3.select('#gg_' + link.idLink)
        .append('rect')
        .attr('id', shift_name + link.idLink)
        .attr('class','handle')
        .attr('fill-opacity', (multi_selected_links.current.includes(link) && !mode_visualisation)?1:0)
        .attr('width', default_handle_size)
        .attr('height', default_handle_size)
        .attr('cursor',(multi_selected_links.current.includes(link)&& !mode_visualisation)?'ew-resize':'pointer')
        .call(dragLinkShiftHandleEvent(multi_selected_links,link,mode_visualisation,nodes,links,display_style,selected_tags,position,data,min_width_and_height,default_horiz_shift,drawGrid,scale,inv_scale,drawCurve)
        )
    }

  }

  const add_shift_handles = (
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number;  filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    let shift_handles
    if (link.recycling) {
      shift_handles = [
        ['vert_shift', 'vert'],
        ['left_horiz_shift', 'left'],
        ['right_horiz_shift', 'right']
      ]
    } else {
      shift_handles = [
        ['left_horiz_shift', 'left'],
        ['right_horiz_shift', 'right']
      ]
    }
    for (let i = 0; i < shift_handles.length; i++) {
      const selection = d3.select('#' + shift_handles[i][0] + link.idLink)
      if (selection.empty()) { // if the handle do not exist, create it
        add_shift_handle(
          link, nodes, links, display_style, selected_tags, shift_handles[i][0], shift_handles[i][1]
        )
      }
    }
    for (let i = 0; i < shift_handles.length; i++) {
      // Draw handle at the correct position
      d3.select('#' + shift_handles[i][0] + link.idLink)
        .attr('transform', () => {
          const handle_pos = handles_positions(links, link, xs, ys, xt, yt)
          return handle_pos[i] // 0 => vertical handle
        })
    }
    
    
  }

  // drawLinkText
  // Affichage de la valeur du flux dans le link en fonction des options
  // Position latérale ; middle, beginning, end et frozen
  const drawLinkText = (
    data: SankeyData,
    link: SankeyLink,
    links: { [link_id: string]: SankeyLink },
    link_value: number,
    display_style: { node_font_size: number;  filter: number; filter_label: number },
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    let x_pos = 0
    let y_pos = 0

    // middle : valeur par défault
    // est-ce necessaire car on force l'option middle à la création du flux
    if (!link.label_position) {
      link.label_position = 'middle'
    }

    if (link.label_position === 'beginning') {
      x_pos = xs + (xt - xs) / 10
    } else if (link.label_position === 'middle') {
      const handles = handles_positions(links, link, xs, ys, xt, yt)
      if (handles.length >= 2) {
        const left_xpos = +handles[0].split(',')[0].substring(10)
        const right_xpos = +handles[1].split(',')[0].substring(10)
        x_pos = (left_xpos + right_xpos) / 2 - 5
      } else {
        x_pos = +handles[0].split(',')[0].substring(10)
      }
    } else if (link.label_position === 'end') {//end
      x_pos = xt - (xt - xs) / 10
    }

    if (link.label_position === 'beginning') {
      y_pos = ys - 6
    } else if (link.label_position === 'middle') {
      const handles = handles_positions(links, link, xs, ys, xt, yt)
      if (handles.length >= 2) {
        const left_y_pos_str = handles[0].split(',')[1]
        const left_y_pos = +left_y_pos_str.substring(0, left_y_pos_str.length - 1)
        const right_y_pos_str = handles[1].split(',')[1]
        const right_y_pos = +right_y_pos_str.substring(0, right_y_pos_str.length - 1)
        y_pos = (left_y_pos + right_y_pos) / 2
      } else {
        const y_pos_str = handles[0].split(',')[1]
        y_pos = +y_pos_str.substring(0, y_pos_str.length - 1)
      }
    } else if (link.label_position === 'end') { //end
      y_pos = yt - 6
    }
    if (link.label_position !== 'frozen') {
      link.x_label = x_pos
      link.y_label = y_pos
    }
    
    scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
    if(link.orthogonal_label_position=='above'){
      y_pos-=scale(link_value)/2
    }else if(link.orthogonal_label_position=='below'){
      y_pos+=scale(link_value)/2
    }

    if (link.label_position === 'frozen' && link.x_label ||
      !link.label_on_path || link.label_on_path === undefined) {
        
      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
        .attr('x', () => link.label_position === 'frozen' && link.x_label ? link.x_label : x_pos)
        // .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
        .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
        .text(d => link_text(data, d, link_value, display_style))
        .attr('visibility', link.label_visible ? 'visible' : 'hidden');
      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>).attr('dy',()=>{
        if(link.orthogonal_label_position=='above'){
          return '-1em'
        }else if(link.orthogonal_label_position=='below'){
          return '0.3em'
        }
        return '0em'
      })
    } else {
      const positions: { [label_position: string]: string[] } = {
        'frozen': ['50%', 'start'],
        'beginning': ['10px', 'start'],
        'middle': ['50%', 'middle'],
        'end': ['100%', 'end']
      };

      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
        .attr('startOffset', positions[link.label_position][0])
        .attr('text-anchor', positions[link.label_position][1])
        .text(d => link_text(data, d, link_value, display_style))
        .attr('visibility', link.label_visible ? 'visible' : 'hidden')
    }
  }

  

  const setNodesHeight = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    d: SankeyLink,
    nodeTags: TagsCatalog
  ) => {
    let source_node = nodes[d.idSource]
    let target_node = nodes[d.idTarget]
    if (target_node === undefined) {
      target_node = nodes[d.idTarget]
    }
    if (source_node === undefined) {
      const filter_idSource = d.idSource
      source_node = nodes[filter_idSource]
    }

    const res_source = compute_total_offsets(inv_scale,source_node, data, nodeTags, test_link_value)
    const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res_source
    const res_target = compute_total_offsets(inv_scale,target_node, data, nodeTags, test_link_value)
    const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res_target

    let node_size_s_height = Math.max(
      inv_scale(source_node.node_height), s_total_offset_height_left, s_total_offset_height_right
    )
    let node_size_t_height = Math.max(
      inv_scale(target_node.node_height), t_total_offset_height_left, t_total_offset_height_right
    )
    let node_size_s_width = Math.max(
      inv_scale(source_node.node_width), s_total_offset_width_top, s_total_offset_width_bottom
    )
    let node_size_t_width = Math.max(
      inv_scale(target_node.node_width), t_total_offset_width_top, t_total_offset_width_bottom
    )
    // Hauteur des noeuds
    if ((res_source[0] === 0 && res_source[1] === 0 && res_source[2] === 0 && res_source[3] === 0) || data.show_structure == 'structure') {
      node_size_s_height = inv_scale(source_node.node_height)
      node_size_s_width = inv_scale(source_node.node_width)
    }
    if ((res_target[0] === 0 && res_target[1] === 0 && res_target[2] === 0 && res_target[3] === 0) || data.show_structure == 'structure') {
      node_size_t_height = inv_scale(target_node.node_height)
      node_size_t_width = inv_scale(target_node.node_width)
    }

    d3.select('#' + source_node.idNode).attr('width', scale(node_size_s_width))
    d3.select('#' + source_node.idNode).attr('height', scale(node_size_s_height))
    if (source_node.tags['Type de noeud'] && source_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[source_node.tags['Type de noeud'][0]].shape === 'ellipse' || !source_node.tags['Type de noeud'] && source_node.shape=='ellipse' ) {
      d3.select('#' + source_node.idNode).attr('rx', scale(node_size_s_width / 2))
      d3.select('#' + source_node.idNode).attr('cx', scale(node_size_s_width / 2))
      d3.select('#' + source_node.idNode).attr('ry', scale(node_size_s_height / 2))
      d3.select('#' + source_node.idNode).attr('cy', scale(node_size_s_height / 2))
    }

    d3.select('#' + target_node.idNode).attr('width', scale(node_size_t_width))
    d3.select('#' + target_node.idNode).attr('height', scale(node_size_t_height))
    if (target_node.tags['Type de noeud'] && target_node.tags['Type de noeud'].length > 0 && data.nodeTags['Type de noeud'].tags[target_node.tags['Type de noeud'][0]].shape === 'ellipse'|| !target_node.tags['Type de noeud'] && target_node.shape=='ellipse') {
      d3.select('#' + target_node.idNode).attr('rx', scale(node_size_t_width / 2))
      d3.select('#' + target_node.idNode).attr('cx', scale(node_size_t_width / 2))
      d3.select('#' + target_node.idNode).attr('ry', scale(node_size_t_height / 2))
      d3.select('#' + target_node.idNode).attr('cy', scale(node_size_t_height / 2))
    }
  }

  

  const node_value_and_text_same_pos=(node :SankeyNode)=>{
    return (node.label_visible && node.display_style.label_horiz_valeur==node.display_style.label_horiz && node.display_style.label_vert_valeur==node.display_style.label_vert)
  }

  // DRAW LINK   
  const drawCurve = (
    data: SankeyData,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { node_font_size: number;  filter: number; filter_label: number; italic?: boolean; bold?: boolean; uppercase?: boolean; },
    nodeTags: TagsCatalog,
    link: SankeyLink,
    error_msg: { text?: string } | undefined
  ): string => {
    if (!link_visible(link, data)) {
      return ''
    }
    const link_value = test_link_value(data, nodes, link)

    const source_node = nodes[link.idSource]
    const target_node = nodes[link.idTarget]

    const inputLinksId = target_node.inputLinksId
    const outputLinksId = source_node.outputLinksId
    if (outputLinksId === undefined || inputLinksId === undefined) {
      return ''
    }

    let [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, nodeTags,data,scale,inv_scale)
    // handles_positions(links, link, xs, ys, xt, yt)
    if(link.orientation=='vv' ||link.orientation=='hh'){
      add_shift_handles(link, nodes, links,display_style, nodeTags, xs, ys, xt, yt)
      add_drag_link_zone(link,nodes,data,multi_selected_links,mode_visualisation,display_nodes,display_links,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurve)
    }
    add_center_handle(link,nodeTags)


    if (link_value > display_style.filter_label) {
      drawLinkText(data, link, links, link_value, display_style, xs, ys, xt, yt)
    }

    const theLinkValue = getLinkValue(data, link.idLink)
    let is_structure = false
    if (source_node.position !== 'relative' && target_node.position !== 'relative' ) {
      if (data.show_structure === 'data' ) {
        if (!(theLinkValue as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
          is_structure = true
        }
      } else if ( data.show_structure === 'reconciled' ) {
        is_structure = theLinkValue.extension!.free_mini !== undefined && +getLinkValue(data, link.idLink).extension!.free_mini == 0 
      }
    }
    if (link.orientation === 'vh' && !link.recycling) {
      if (data.show_structure == 'structure' || is_structure) {
        [xs, yt] = [source_node.x + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
        if (source_node.x > target_node.x) {
          xt = xt + 30
        }
      }
      return SankeyShapes.bezier_link_classic_hv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hv' && !link.recycling) {
      if (data.show_structure == 'structure' || is_structure) {
        [ys, xt] = [source_node.y + 5, target_node.x + 5]
        if (source_node.y > target_node.y) {
          yt = yt + 30
        }
      }
      return SankeyShapes.bezier_link_classic_vh(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hh' && !link.recycling) {
      if (data.show_structure == 'structure' || is_structure ) {
        [ys, yt] = [source_node.y + source_node.node_height / 2, target_node.y + target_node.node_height / 2]
        if (source_node.x > target_node.x) {
          xt = xt + target_node.node_width
        }
      }
      const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
      const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
      return SankeyShapes.bezier_link_classic_vv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        left_horiz_shift,
        right_horiz_shift,
        link.curvature !== undefined ? link.curvature : 0.5,
        false,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'vv' && !link.recycling) {
      if (data.show_structure == 'structure' || is_structure) {
        [xs, xt] = [source_node.x + source_node.node_width / 2, target_node.x + target_node.node_width / 2]
        if (source_node.y > target_node.y) {
          yt = yt + 30
        }
      }
      const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
      const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
      return SankeyShapes.bezier_link_classic_vv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        left_horiz_shift, right_horiz_shift,
        link.curvature !== undefined ? link.curvature : 0.5,
        true,
        link.curved,
        error_msg
      )
    }
    if (link.recycling) {
      const left_horiz_shift = link.left_horiz_shift ? link.left_horiz_shift : 0
      const right_horiz_shift = link.right_horiz_shift ? link.right_horiz_shift : 0
      const vert_shift = link.vert_shift ? link.vert_shift : 0
      if (data.show_structure == 'structure' || is_structure) {
        [ys, yt] = [source_node.y + 5, target_node.y + 5]
      }
      return SankeyShapes.bezier_link_classic_recycling(
        link.idSource, link.idTarget,
        link_value,
        [xs, ys], [xt, yt],
        left_horiz_shift, right_horiz_shift, vert_shift,
        data.show_structure == 'structure' ? false : link.curved,
        link.orientation === 'vv',
        error_msg, scale
      )
    }
    return ''
  }

  // Returns the x/y position of link_center / left/right/vert_shift
  const handles_positions = (
    links: { [link_id: string]: SankeyLink },
    link: SankeyLink,
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    let tmp=getLinkValue(data, link.idLink).value
    tmp=(tmp)?tmp:0

    if (link.orientation === 'hh' && link.recycling) {
      // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 0
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 0
      }
      if (!link.vert_shift) {
        link.vert_shift = 0
      }
      
      if (xt < xs) {
        const x_left = xt - default_horiz_shift + link.left_horiz_shift // x14 
        const x_right = xs + default_horiz_shift + link.right_horiz_shift  // x2 
        const y_vert = Math.max(ys, yt) + scale(2 * tmp) + link.vert_shift // y8 
        const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
        const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
        const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
        return [vert, left, right]
      } else {
        const x_right = xt + default_horiz_shift + link.right_horiz_shift  // x14 
        const x_left = xs - default_horiz_shift + link.left_horiz_shift // x2 
        const y_vert = Math.max(ys, yt) + scale(2 * tmp) + link.vert_shift // y8 
        const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
        const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
        const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
        return [vert, left, right]
      }
    } else if (link.orientation === 'vv' && link.recycling) {
      // Recycling: 3 handles = left_horiz_shift, right_horiz_shif, vert_shift
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 0
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 0
      }
      if (!link.vert_shift) {
        link.vert_shift = 0
      }
      const y_left = yt - default_horiz_shift + link.left_horiz_shift - scale(tmp) // x14 
      const y_right = ys + default_horiz_shift + link.right_horiz_shift + scale(tmp) // x2 
      const x_vert = Math.max(xs, xt) + scale(2 * tmp) + link.vert_shift // y8 
      const vert = 'translate(' + (x_vert - default_handle_size / 2) + ', ' + (y_left + (y_right - y_left) / 2 - default_handle_size / 2) + ')'
      const left = 'translate(' + (xt + (x_vert - xt) / 2 - default_handle_size / 2) + ' ,' + (y_left - default_handle_size / 2) + ')'
      const right = 'translate(' + (xs + (x_vert - xs) / 2 - default_handle_size / 2) + ' ,' + (y_right - default_handle_size / 2) + ')'
      return [vert, left, right]
    } else if (link.orientation === 'hh') {
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 1 / 3
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 2 / 3
      }
      const shift_left = 'translate(' + (xs + (xt - xs) * link.left_horiz_shift) + ', ' + (ys - default_handle_size / 2) + ')'
      const shift_right = 'translate(' + (xs + (xt - xs) * link.right_horiz_shift) + ', ' + (yt - default_handle_size / 2) + ')'
      return [shift_left, shift_right]
    } else if (link.orientation === 'vv') {
      if (!link.left_horiz_shift) {
        link.left_horiz_shift = 1 / 3
      }
      if (!link.right_horiz_shift) {
        link.right_horiz_shift = 2 / 3
      }
      const shift_left = 'translate(' + (xs - default_handle_size / 2) + ', ' + (ys + (yt - ys) * link.left_horiz_shift) + ')'
      const shift_right = 'translate(' + (xt - default_handle_size / 2) + ', ' + (ys + (yt - ys) * link.right_horiz_shift) + ')'
      return [shift_left, shift_right]

    } else if (link.orientation === 'vh') {
      const x_center_draw = xs
      const y_center_draw = yt
      return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
    } else if (link.orientation === 'hv') {
      const x_center_draw = xt
      const y_center_draw = ys
      return ['translate(' + x_center_draw + ', ' + y_center_draw + ')']
    }
    return ['']
  }

 

 
  

  const add_nodes = (
    static_sankey: boolean,
    remove_previous_nodes = false
  ) => {
    const { display_style } = data
    if (remove_previous_nodes) {
      d3.selectAll('.gg_nodes').remove()
    }
    const gg_nodes = d3.select('#g_nodes').selectAll('.gg_nodes').data(Object.values(display_nodes).filter(n=>n.display)).enter().append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.node_visible && d.position === 'absolute' ) { display = 'inline' } else { display = 'none' }
        return display
      })
      .style('font-family', d => d.display_style.font_family)

    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d =>nodeTransform(d,display_nodes,display_links))



    // Gestion du click  
    ggg_nodes.on('click', (event, d) => eventNodeClick(event,d,mode_visualisation,sankeyTooltip,accordion_ref,button_ref,multi_selected_nodes,nodes_accordion_ref,select_node,static_sankey))

    if (mode_selection == 'ln') {
      ggg_nodes.on('mousedown', function (event, d) {
        if (!event.ctrlKey && !event.metaKey) {
          first_selected_node = d
        }
      })
        .on('mouseup',  (event, d) =>eventOnMouseUpAddNodesAndLink(event,d,data,set_data,first_selected_node,multi_selected_links,accordion_ref,button_ref,links_accordion_ref))

    }

    ggg_nodes.on('contextmenu', (ev, n) => eventNodeContextMenu(ev,n,data,set_agregation_node,set_is_agregation,set_show_agregation,set_data) )

    ggg_nodes.call(d3.drag<SVGGElement, SankeyNode>()
      .subject(Object).on('drag', function (event,node) {

        if(mode_selection=='s'){
          if(event.subject.sourceEvent.path[0].tagName=='tspan' && alt_key_pressed && !static_sankey){
            drag_node_text(node, event)
          }else if(event.subject.sourceEvent.path[0].tagName=='tspan' && !alt_key_pressed){
            drag_nodes(
              display_nodes, display_links,
              display_style,
              data.nodeTags,this,
              event
            )
          }
          if(event.subject.sourceEvent.path[0].tagName=='rect' || event.subject.sourceEvent.path[0].tagName=='ellipse'){
            drag_nodes(
              display_nodes, display_links,
              display_style,
              data.nodeTags,this,
              event
            )
          }
        }

      }))

    if ( data.nodeTags['Type de noeud'] ) {
      Object.entries(data.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
        ggg_nodes
          .filter(d =>d.tags['Type de noeud'].includes(key))
          .append(tag.shape as string)
          .classed('node', true)
          .classed('node_shape', true)
        //   .attr('height', d => d.node_height)
        //   .attr('width', d => d.node_width)
        // if ( tag.shape === 'ellipse' ) {
        //   current_selection
        //     .attr('cx', d => d.node_width / 2)
        //     .attr('cy', d => d.node_height / 2)
        //     .attr('rx', d => d.node_width / 2)
        //     .attr('ry', d => d.node_height / 2)
        // }
      })
      ggg_nodes
        .filter(d =>d.tags['Type de noeud'].length === 0)
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        // .attr('height', d => d.node_height)
        // .attr('width', d => d.node_width)
    } else {
      ggg_nodes
        .filter(d => d.shape === 'rect')
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        // .attr('height', d => d.node_height)
        // .attr('width', d => d.node_width)      

      ggg_nodes
        .filter(d => d.shape === 'ellipse')
        .append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', d => d.node_width / 2)
        .attr('cy', d => d.node_height / 2)
        .attr('rx', d => d.node_width / 2)
        .attr('ry', d => d.node_height / 2)
        
      
    }

   
    const nodes_not_to_scale=ggg_nodes
      .filter(d=>d.not_to_scale)
      .append('g')
    addNodesNotToScale(nodes_not_to_scale,data)

    d3.selectAll('.node')
      .attr('id', d => (d as SankeyNode).idNode)
      // .attr('visibility', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? 'visible' : 'hidden')
      .attr('fill-opacity', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? '1' : '0')
      .attr('fill', d => node_color(d as SankeyNode,data) as string)
      .attr('stroke', 'black')
      .attr('stroke-width', d => {
        d = (d as SankeyNode)
        if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
          return 2
        } else {
          return 0
        }
      }
      )
      // Gestion de la tooltip
      .on('mouseover', function (event, d) {
        //d3.select(this).attr('cursor', 'grab')
        d3.select(this).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
        if ((d as SankeyNode).shape_visible && (static_sankey || event.shiftKey)) {
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode))
        }
      })
      .on('mousemove', function (event, d) {
        if ((d as SankeyNode).shape_visible && (static_sankey || event.shiftKey)) {
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
      })
      .on('mouseout', function (event, d) {
        if ((d as SankeyNode).shape_visible) {
          sankeyTooltip.style('opacity', 0)
        }
      })
      .on('click', (event, d) => {

        if (!data.static_sankey && event.shiftKey || data.static_sankey) {
          event.preventDefault()
          // Animation des flux du Sankey
          sankeyTooltip.style('opacity', 0)
          //d3.selectAll('#svg .tmp').remove()
          // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey       
          // d3.select('#svg').selectAll('.arrow').style('fill', '#dddddd')
          d3.select('#svg').selectAll('.defsArrow path').style('fill', '#dddddd')

          // d3.select('#svg').selectAll('.link').style('stroke-opacity', '0.2')
          d3.select('#svg').selectAll('.link').style('stroke', '#dddddd')
          d3.select('#svg').selectAll('.node').style('fill', '#dddddd')
          d3.select('#svg').selectAll('.link_value').style('display', 'none')
          const nodeDisplay = [(d as SankeyNode).idNode]
          branchAnimate((d as SankeyNode), nodeDisplay)
        }
      })

    //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

    Object.values(display_nodes).map(n => setNodeHeight(n, display_nodes, display_links, data.nodeTags,data,scale,inv_scale))
    Object.values(display_nodes).filter(n=>n.not_to_scale).map(n=>{
      d3.select('#' + n.idNode)
        .attr('fill-opacity',0)
    })

    //----------------ICON-----------------
    

    ggg_nodes
      .filter(d => d.iconName != 'none' && d.iconVisible)
      .append('svg')
      .attr('viewBox', '0, 0, 1000, 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select('#' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
        const shiftH = (+d3.select('#' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select('#' + n.idNode).attr('height') * (n.iconRatio) / 100)
      .attr('width', n => +d3.select('#' + n.idNode).attr('width') * (n.iconRatio) / 100)
      .attr('x', 0)
      .append('g')
      .append('path')
      .on('mouseover', function (event, d) {
        //d3.select(this).attr('cursor', 'grab')
        d3.select(this).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
        if ((static_sankey || event.shiftKey)) {
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode))
        }
      })
      .on('mousemove', function (event,) {
        if ((static_sankey || event.shiftKey)) {
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
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .style('fill', n => {
        if (n.colorTag in n.tags && n.colorTag in n.tags && n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data.nodeTags[n.colorTag].tags[selected_tag]
          if (tag && !n.shape_visible) {
            return tag.color as string
          } else {
            //console.log('tutu')
          }
        }
        return n.iconColor
      })
      .attr('d', n => {
        const icon = data.icon_catalog[n.iconName]
        if (icon != undefined) {
          return icon
        } else {
          return ''
        }
      })

    //------------------LABEL------------------------
    ggg_nodes
      .append('text')
      .attr('fill',n=>(n.display_style.label_color)?'white':'black')
      .classed('node', true)
      .classed('node_text', true)
      .attr('id', n => n.idNode + '_text')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        if (n.x_label) {
          return n.x_label
        } else if (n.display_style.label_horiz == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz == 'gauche') {
          return 0
        } else if (n.display_style.label_horiz == 'droite') {
          return n.display_style.label_vert == 'milieu' ? width : 0
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        if (n.y_label && data.show_structure !== 'structure') {
          return n.y_label
        } else if (n.display_style.label_vert == 'milieu') {
          return height / 2
        } else if (n.display_style.label_vert == 'haut') {
          return -4
        } else if (n.display_style.label_vert == 'bas') {
          return height
        } else {
          return 0
        }
      })
      .attr('text-anchor', n => {
        if (n.x_label && data.show_structure !== 'structure') {
          return 'center'
        } else if (n.display_style.label_horiz == 'milieu') {
          return 'middle'
        } else if (n.display_style.label_horiz == 'gauche') {
          return 'end'
        } else if (n.display_style.label_horiz == 'droite') {
          return 'start'
        } else {
          return 'start'
        }
      })
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      .style('text-align', 'center')
      .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.font_size + 'px')
      .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {
        if ('Type de noeud' in d.tags && d.tags['Type de noeud'][0] == 'échange') {
          return d.name.split(' - ')[1]
        }
        return d.name.split(' - ')[0].replace('-', ' ')
      })
      .each(d => textNodeWrap(d,data))

    //Affiche valueur Noeud
    ggg_nodes.append('text')
      .attr('fill',n=>(n.display_style.label_color)?'white':'black')
      .classed('node', true)
      .classed('node_text_value', true)
      .attr('id', n => n.idNode + '_text_value')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        const _text = document.getElementById(n.idNode + '_text')
        const width_text = (_text) ? _text.getBoundingClientRect().width : 0
        if (n.display_style.label_horiz_valeur == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz_valeur == 'gauche') {
          return -width / 2
        } else if (n.display_style.label_horiz_valeur == 'droite') {
          return width + width_text / 2
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        const _text = document.getElementById(n.idNode + '_text')
        const height_text = (_text) ? _text.getBoundingClientRect().height : 0
        if (n.display_style.label_vert_valeur == 'milieu') {
          // return height / 2 + height_text / 2
          return height / 2 + ((node_value_and_text_same_pos(n))?n.display_style.font_size:0)
        } else if (n.display_style.label_vert_valeur == 'haut') {
          return -n.display_style.font_size+ ((node_value_and_text_same_pos(n))?-height_text*1.5:0)
        } else if (n.display_style.label_vert_valeur == 'bas') {
          return height+((node_value_and_text_same_pos(n))?height_text*1.8:n.display_style.font_size)
        } else {
          return 0
        }
      })
      .attr('text-anchor', () => 'middle')
      .attr('visibility', n => n.node_visible && n.show_value ? 'visible' : 'hidden')
      // .style('text-align', 'center')
      // .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      // .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.value_font_size + 'px')
      // .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => textNodeValue(d,data,display_links,display_nodes))
    // ZONE DE DRAGGAGE POUR CHANGER LA LARGEUR DES TEXT DE LABELS
    ggg_nodes
      .append('rect')
      .attr('class','box_width_threshold')
      .attr('x',n=>{
        const width = +d3.select('#' + n.idNode).attr('width')
        if (n.x_label) {
          return n.x_label
        } else if (n.display_style.label_horiz == 'milieu') {
          return width/2-n.display_style.label_box_width/2
        } else if (n.display_style.label_horiz == 'gauche') {
          return -n.display_style.label_box_width
        } else if (n.display_style.label_horiz == 'droite') {
          return width
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        if (n.y_label && data.show_structure !== 'structure') {
          return n.y_label
        } else if (n.display_style.label_vert == 'milieu') {
          return 0
        } else if (n.display_style.label_vert == 'haut') {
          return -4
        } else if (n.display_style.label_vert == 'bas') {
          return height
        } else {
          return 0
        }
      })
      .attr('width',n=>n.display_style.label_box_width)
      .attr('height',n=>{
        const h=document.getElementById(n.idNode+'_text')?.getBoundingClientRect().height
        return (h!=undefined)?h:25
        
      })
      .attr('fill','none')
      .attr('stroke','grey')
      // .attr('stroke-dasharray',('3,2'))
      .attr('stroke-width','1px')
      .attr('cursor','ew-resize')
      .attr('visibility',d=>(multi_selected_nodes.current.includes(d)?'visible':'hidden'))
      .call(dragNodeTextEventWidthBoxEvent(data,set_data)
      )

  }

  const animate_view_changement = (
    data_v1: SankeyData,
    data_v2: SankeyData,
  ) => {
    //Cette fonction reprend le code executé pour l'affichage des noeuds et lien tout en  ajoutant une animation
    //Elle est executé avant de changé de vue (variable view) afin de pouvoir faire les animations puis ensuites 



    // Supprime les noeuds non présent dans la vu suivante avec une transition
    Object.keys(data_v1.nodes).filter(d => !Object.keys(data_v2.nodes).includes(d)).map(d => {
      d3.select('#gg_' + d).transition().duration(500).style('opacity', 0).remove()

    })


    // Supprime les liens non présent dans la vu suivante avec une transition
    Object.keys(data_v1.links).filter(d => !Object.keys(data_v2.links).includes(d)).map(d => {
      d3.select('#gg_' + d).transition().duration(500).style('opacity', 0).remove()
    })

    //Récupère les noeuds et liens présent uniquement dans la nouvelle data 
    const new_nodes = Object.fromEntries(Object.entries(data_v2.nodes).filter(d => !Object.keys(data_v1.nodes).includes(d[0])))
    const new_links = Object.fromEntries(Object.entries(data_v2.links).filter(d => !Object.keys(data_v1.links).includes(d[0])))
    const k_links = Object.keys(new_links)


    //=================AJOUT NOUEVEAUX NOEUDS========================================
    const gg_nodes = d3.select('#view_div #g_nodes').selectAll('.gg_nodes').data(Object.values(data_v2.nodes)).enter().filter(d => Object.keys(new_nodes).includes(d.idNode)).append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.node_visible) { display = 'inline' } else { display = 'none' }
        return display
      })
      .style('font-family', d => d.display_style.font_family)


    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => {
        return 'translate(' + d.x + ', ' + d.y + ')'

      })


    if ( data.nodeTags['Type de noeud'] ) {
      Object.entries(data.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
        const current_selection = ggg_nodes
          .filter(d =>d.tags['Type de noeud'].includes(key))
          .append(tag.shape as string)
          .classed('node', true)
          .classed('node_shape', true)
          .attr('height', d => d.node_height)
          .attr('width', d => d.node_width)
        if ( tag.shape === 'ellipse' ) {
          current_selection
            .attr('cx', d => d.node_width / 2)
            .attr('cy', d => d.node_height / 2)
            .attr('rx', d => d.node_width / 2)
            .attr('ry', d => d.node_height / 2)
        }
      })
      ggg_nodes
        .filter(d =>d.tags['Type de noeud'].length === 0)
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('height', d => d.node_height)
        .attr('width', d => d.node_width)
    } else {
      ggg_nodes
        .filter(d => d.shape === 'rect')
        .append('rect')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('height', d => d.node_height)
        .attr('width', d => d.node_width)      

      ggg_nodes
        .filter(d => d.shape === 'ellipse')
        .append('ellipse')
        .classed('node', true)
        .classed('node_shape', true)
        .attr('cx', d => d.node_width / 2)
        .attr('cy', d => d.node_height / 2)
        .attr('rx', d => d.node_width / 2)
        .attr('ry', d => d.node_height / 2)
        .attr('height', d => d.node_height)
        .attr('width', d => d.node_width)
    }


    d3.selectAll('.node')
      .filter(d => Object.keys(new_nodes).includes((d as SankeyNode).idNode))
      .attr('id', d => (d as SankeyNode).idNode)
      // // .attr('visibility', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? 'visible' : 'hidden')
      // .style('opacity', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? '1' : '0')
      .style('opacity', 0)
      .attr('fill', d => node_color(d as SankeyNode,data) as string)
      .attr('stroke', 'black')
      .attr('stroke-width', d => {
        d = (d as SankeyNode)
        if (multi_selected_nodes.current.map(d => { if (d != undefined) { return d.idNode } else { return '' } }).includes((d as SankeyNode).idNode)) {
          return 2
        } else {
          return 0
        }
      }

      )

    //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

    Object.values(new_nodes).map(n => setNodeHeight(n, data_v2.nodes, data_v2.links, data_v2.nodeTags,data,scale,inv_scale))

    //----------------ICON-----------------


    ggg_nodes
      .filter(d => d.iconName != 'none' && d.iconVisible)
      .append('svg')
      .attr('viewBox', '0, 0, 1000, 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select('#' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
        const shiftH = (+d3.select('#' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select('#' + n.idNode).attr('height') * (n.iconRatio) / 100)
      .attr('width', n => +d3.select('#' + n.idNode).attr('width') * (n.iconRatio) / 100)
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', (n) => {
        if (n.colorParameter === 'groupTag') {
          const selected_tag = n.tags[n.colorTag][0]
          const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
          if (tag && !n.shape_visible) {
            return tag.color as string
          } else {
            //console.log('tutu')
          }
        }
        return n.iconColor
      })
      .attr('d', n => {
        const icon = data_v2.icon_catalog[n.iconName]
        if (icon != undefined) {
          return icon
        } else {
          return ''
        }
      })

    //------------------LABEL------------------------
    ggg_nodes
      .append('text')
      .classed('node', true)
      .classed('node_text', true)
      .attr('id', n => n.idNode + '_text')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        if (n.x_label) {
          return n.x_label
        } else if (n.display_style.label_horiz == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz == 'gauche') {
          return 0
        } else if (n.display_style.label_horiz == 'droite') {
          return n.display_style.label_vert == 'milieu' ? width : 0
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        if (n.y_label && data_v2.show_structure !== 'structure') {
          return n.y_label
        } else if (n.display_style.label_vert == 'milieu') {
          return height / 2
        } else if (n.display_style.label_vert == 'haut') {
          return -4
        } else if (n.display_style.label_vert == 'bas') {
          return height
        } else {
          return 0
        }
      })
      .attr('text-anchor', n => {
        if (n.x_label && data_v2.show_structure !== 'structure') {
          return 'center'
        } else if (n.display_style.label_horiz == 'milieu') {
          return 'middle'
        } else if (n.display_style.label_horiz == 'gauche') {
          return 'end'
        } else if (n.display_style.label_horiz == 'droite') {
          return 'start'
        } else {
          return 'start'
        }
      })
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      .style('text-align', 'center')
      .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.font_size + 'px')
      .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {
        return d.name.split(' - ')[0].replace('-', ' ')
      })
      .each(d => {

        const wrap = textwrap()
          .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
          .method('tspans')
        d3.select('#ggg_' + d.idNode + ' text')
          .call(wrap)
        if (!d.x_label || data_v2.show_structure === 'structure') {
          d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
            const width = +d3.select('#' + d.idNode).attr('width')

            if (d.display_style.label_horiz == 'milieu') {
              return width / 2
            } else if (d.display_style.label_horiz == 'droite') {
              return d.display_style.label_vert == 'milieu' ? width : 0
            } else {
              return 0
            }
          })
        }

        d3.selectAll('#ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
          const width = +d3.select('#' + d.idNode).attr('width')
          if (d.x_label) {
            return d.x_label
          } else if (d.display_style.label_horiz == 'milieu') {
            return width / 2
          } else if (d.display_style.label_horiz == 'droite') {
            return width
          } else {
            return 0
          }
        })
        //Nombre de tspan dans la balise text
        const nb_tspan = d3.selectAll('#ggg_' + d.idNode + ' text tspan').nodes().length
        if (d.display_style.label_vert == 'milieu') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (0.25 - 0.5 * (nb_tspan - 1)) + 'em)')
        } else if (d.display_style.label_vert == 'bas') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(1em)')
        } else if (d.display_style.label_vert == 'haut') {
          d3.select('#ggg_' + d.idNode + ' .node_text').style('transform', 'translateY(' + (-(nb_tspan - 1)) + 'em)')

        }

      })

    //Affiche valueur Noeud
    ggg_nodes.append('text')
      .classed('node', true)
      .classed('node_text_value', true)
      .attr('id', n => n.idNode + '_text_value')
      .attr('x', (n) => {
        const width = +d3.select('#' + n.idNode).attr('width')
        const _text = document.getElementById(n.idNode + '_text')
        const width_text = (_text) ? _text.getBoundingClientRect().width : 0
        if (n.display_style.label_horiz == 'milieu') {
          return width / 2
        } else if (n.display_style.label_horiz == 'gauche') {
          return -width / 2
        } else if (n.display_style.label_horiz == 'droite') {
          return width + width_text / 2
        } else {
          return 0
        }
      })
      .attr('y', n => {
        const height = +d3.select('#' + n.idNode).attr('height')
        const _text = document.getElementById(n.idNode + '_text')
        const height_text = (_text) ? _text.getBoundingClientRect().height : 0
        if (n.display_style.label_vert == 'milieu') {
          return height / 2 + height_text / 2
        } else if (n.display_style.label_vert == 'haut') {
          return '-2em'
        } else if (n.display_style.label_vert == 'bas') {
          return height + height_text * 0.8
        } else {
          return 0
        }
      })
      .attr('text-anchor', () => 'middle')
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      // .style('text-align', 'center')
      // .style('font-weight', d => (d.display_style.bold) ? 'bold' : 'normal')
      // .style('font-style', d => (d.display_style.italic) ? 'italic' : 'normal')
      .style('font-size', d => d.display_style.font_size + 'px')
      // .style('text-transform', d => (d.display_style.uppercase) ? 'uppercase' : 'none')
      .text(d => {
        let total = 0

        if (d.show_value) {
          if (d.outputLinksId.length > 0) {
            for (let i = 0; i < d.outputLinksId.length; i++) {
              const link = new_links[d.outputLinksId[i]]
              if (link === undefined) {
                //alert('Corruption du diagramme')
                return ''
              }
              let tmp=getLinkValue(data_v2, link.idLink).value
              tmp=(tmp)?tmp:0
              if (new_nodes[link.idSource].node_visible && new_nodes[link.idTarget].node_visible) {
                total += tmp
              }
            }
          }

          if (total === 0) {
            if (d.inputLinksId.length > 0) {
              for (let i = 0; i < d.inputLinksId.length; i++) {
                const link = new_links[d.inputLinksId[i]]
                if (link === undefined) {
                  //alert('Corruption du diagramme')
                  return ''
                }
                let tmp=getLinkValue(data_v2, link.idLink).value
                tmp=(tmp)?tmp:0
                if (new_nodes[link.idSource].node_visible && new_nodes[link.idTarget].node_visible) {
                  total += tmp
                }
              }
            }
          }
          return total

        } else {
          return ''
        }

      })

    Object.values(new_nodes).map(d => {
      d3.select('#gg_' + d.idNode).selectAll('*').transition().duration(500).style('opacity', 1)
    })


    //==================MODIFICATION NOEUD========================================
    const edit_nodes = Object.fromEntries(Object.entries(data_v2.nodes).filter(d => Object.keys(data_v1.nodes).includes(d[0])))

    Object.values(edit_nodes).map(d => {
      d3.select('#ggg_' + d.idNode).transition().duration(500).attr('transform', 'translate(' + d.x + ',' + d.y + ')')
    })

    //====================AJOUT LIENS============================================

    d3.selectAll('#svg #sankey_def').remove()
    const defGradient = d3.select('#svg').append('defs').attr('id', 'sankey_def')

    const gg_links = d3
      .select('#g_links')
      .selectAll('.gg_links')
      .data(Object.values(data_v2.links))
      .enter()
      .filter(l => Object.keys(new_links).includes(l.idLink))
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d, data_v2)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')
      .attr('stroke-dasharray', d => {
        if (data.show_structure === 'structure') {
          return '5, 5'
        }
        if (data.show_structure === 'data' ) {
          const link_value = getLinkValue(data, d.idLink)
          if (!(link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
            return '5, 5'
          }
        }
        const link_value = getLinkValue(data_v2, d.idLink)
        if (link_value === undefined) {
          return ''
        }
        //const display_value = getLinkValue(data_v2, d.idLink).display_value
        const is_free = getLinkValue(data, d.idLink).extension!.free_mini !== undefined && +getLinkValue(data, d.idLink).extension!.free_mini == 0 && data.show_structure !== 'free'
        if (is_free) {
          return '5, 5'
        }
        if (d.dashed || is_free) {
          return '40, 5'
        } else {
          return ''
        }
      })

    const paths = gg_links.append('path')
    const positions: { [label_position: string]: string[] } = {
      'frozen': ['50%', 'start'],
      'beginning': ['10px', 'start'],
      'middle': ['50%', 'start'],
      'end': ['100%', 'end']
    }
    gg_links
      .filter(
        d => d.label_position !== 'frozen' 
      )
      .append('text')
      .attr('pointer-events', 'none')
      // .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + data_v2.display_style.font_size + 'px;')
      .attr('style',d=> 'font-weight: bold; font-size:' + d.label_font_size + 'px;')
      .attr('fill', l => {

        return l.text_color
      })
      .attr('dy', l => {
        if (l.orthogonal_label_position === 'middle') {
          return '0.3em'
        } else if (l.orthogonal_label_position === 'below') {
          const tmp=getLinkValue(data_v2, l.idLink).value
          return scale((tmp)?tmp:0) / 2 + 10 + 'px'
        } else if (l.orthogonal_label_position === 'above') {
          const tmp=getLinkValue(data_v2, l.idLink).value

          return -scale((tmp)?tmp:0) / 2 + 'px'
        }
        return '0.3em'
      })
      .append('textPath')
      .attr('id', d => d.idLink + '_text')
      .attr('side', link => {
        if (link.recycling) {
          if (data_v2.nodes[link.idSource].x < data_v2.nodes[link.idTarget].x) {
            return 'left'
          } else if (link.label_position === 'middle' && link.orientation === 'hh') {
            return 'right'
          }
          return 'left'
        } else {
          if (data_v2.nodes[link.idSource].x < data_v2.nodes[link.idTarget].x) {
            return 'left'
          } else {
            return 'right'
          }
          return 'left'
        }
      })
      .attr('class', 'link_value')
      .attr('href', d => '#' + d.idLink)
      .attr('startOffset', l=>positions[l.label_position][0])
      .attr('text-anchor', l=>positions[l.label_position][1])


    const select2 = gg_links
      .filter(d => d.label_position === 'frozen' || !d.label_on_path || d.label_on_path === undefined)
      .append('text')


    select2
      .attr('href', d => '#' + d.idLink)
      .attr('id', d => d.idLink + '_text')
      .attr('class', 'link_value')
      .attr('style',d=> 'font-weight: bold;font-size:' + d.label_font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
          return 'white'
        }
        return l.text_color
      })
      .attr('visibility', d => {
        let tmp=getLinkValue(data_v2, d.idLink).value
        tmp=(tmp)?tmp:0
        return link_visible(d, data_v2) && tmp >= Math.max(data_v2.display_style.filter, data_v2.display_style.filter_label) ? 'visible' : 'hidden'
      })

    let error_msg: { text?: string | undefined } | undefined
    paths
      .attr('class', 'link')
      .attr('id', d => d.idLink)
      .attr('fill', 'none')
      // .attr('stroke-opacity', d => data_v2.nodes[d.idSource].node_visible && data_v2.nodes[d.idTarget].node_visible && getLinkValue(data_v2, d.idLink).value >= data_v2.display_style.filter ? (!((data_v2 as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data_v2, d.idLink).display_value).includes('[')) ? 0.85 : 0.85) : 0)
      .attr('stroke-opacity', d => {
        let tmp=getLinkValue(data_v2, d.idLink).value
        tmp=(tmp)?tmp:0
        return data_v2.nodes[d.idTarget].node_visible && tmp >= data_v2.display_style.filter ? 0.5 : 0})
      .attr('stroke-width', l => {


        const node = data_v2.nodes[l.idSource]
        // const links = data_v2.links
        const nodes = data_v2.nodes
        // const stream_io = node.inputLinksId.concat(node.outputLinksId)
        //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs

        //position noeud source ou target
        let pos_x_src, pos_y_src
        if (node.name == nodes[l.idSource].name) {
          pos_x_src = nodes[l.idTarget].x
          pos_y_src = nodes[l.idTarget].y
        } else {
          pos_x_src = nodes[l.idSource].x
          pos_y_src = nodes[l.idSource].y
        }

        const is_free = getLinkValue(data, l.idLink).extension!.free_mini !== undefined && +getLinkValue(data, l.idLink).extension!.free_mini == 0 && data.show_structure !== 'free'
        if (is_free) {
          return 5
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
        // const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]

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
          //draw_warning = node_in_src_hh || node_in_src_vv
          draw_warning = left_in_src || right_in_src || top_in_src
        }

        if (draw_warning && !l.recycling) {
          return '1px'
        } else {

          const link_value = test_link_value(data_v2, data_v2.nodes, l)
          return scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))

        }

      })

      .attr('stroke', l => {
        const width_src = +d3.select('#' + l.idSource).attr('width')
        const height_src = +d3.select('#' + l.idSource).attr('height')
        const width_trgt = +d3.select('#' + l.idTarget).attr('width')
        //const height_trgt = +d3.select('#' + l.idTarget).attr('height')

        const gradient = defGradient.append('defs')
          .append('linearGradient')
          .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
          .attr('gradientUnits', 'userSpaceOnUse')



        gradient.append('stop')
          .attr('id', 'stop-start')
          .attr('offset', '0%')
          .attr('stop-color', () => {

            if (data_v2.nodes[l.idSource].x <= data_v2.nodes[l.idTarget].x) {
              const n = data_v2.nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              const n = data_v2.nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
          })
          .attr('stop-opacity', 1)

        gradient.append('stop')
          .attr('id', 'stop-end')
          .attr('offset', '100%')
          .attr('stop-color', () => {
            if (data_v2.nodes[l.idSource].x <= data_v2.nodes[l.idTarget].x) {
              const n = data_v2.nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              const n = data_v2.nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
          })
          .attr('stop-opacity', 1)


        const nodes = data_v2.nodes

        if (l.orientation == 'hh' || l.orientation == 'hv') {
          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].x < nodes[l.idTarget].x) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idSource].x + width_src)
                .attr('y1', '0')
                .attr('x2', nodes[l.idTarget].x)
                .attr('y2', 0)
              const n = data_v2.nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idTarget].x + width_trgt)
                .attr('y1', '0')
                .attr('x2', nodes[l.idSource].x)
                .attr('y2', 0)
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].x > nodes[l.idTarget].x) {
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
        } else if (l.orientation == 'vv' || l.orientation == 'hv') {
          //orientation vert-vert
          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].y < nodes[l.idTarget].y) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', 0)
                .attr('y1', data_v2.nodes[l.idSource].y + height_src)
                .attr('x2', 0)
                .attr('y2', data_v2.nodes[l.idTarget].y)

              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', 0)
                .attr('y1', data_v2.nodes[l.idTarget].y + height_src)
                .attr('x2', 0)
                .attr('y2', data_v2.nodes[l.idSource].y)

              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].y > nodes[l.idTarget].y) {
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
        } else if (l.orientation == 'vh') {

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
            if (nodes[l.idSource].x < nodes[l.idTarget].x) {
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idSource].x + width_src - 10)
                .attr('y1', '0')
                .attr('x2', nodes[l.idTarget].x)
                .attr('y2', 0)
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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
              d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
                .attr('x1', data_v2.nodes[l.idTarget].x + width_trgt + 10)
                .attr('y1', '0')
                .attr('x2', nodes[l.idSource].x)
                .attr('y2', 0)
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
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

          d3.select('#gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
            if (nodes[l.idSource].x > nodes[l.idTarget].x) {
              const n = nodes[l.idSource]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color as string
              } else {
                return n.iconColor as string
              }
            } else {
              const n = nodes[l.idTarget]
              if (n.colorParameter === 'groupTag') {
                const selected_tag = n.tags[n.colorTag][0]
                const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
                if (tag) {
                  return tag.color as string
                }
              }
              if (n.shape_visible || n.iconName === 'none') {
                return n.color as string
              } else {
                return n.iconColor as string
              }
            }
          }
          )

        }
        return (l.gradient && l.colorParameter==='local') ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : link_color(l,data_v2) as string
      }
      )


    //Creation des Arrows associés au link
    d3.selectAll('.ggg_nodes')
      .filter(m => {
        const n = Object.values(data_v2.nodes).filter(d => d.idNode === (m as SankeyNode).idNode)[0]
        //test si les noeuds ont des les flux sortant, qu'il y a des flux sortant et que les noeuds sont présents dans la vue suivantes
        //car les noeuds sélectionnés par d3.selectAll('.ggg_nodes') contient les noeuds qui sont en train d'être supprimé (cela est dût à la transition au debut de la fonction)
        if (n !== undefined && n.inputLinksId.length != 0 && Object.keys(data_v2.links).length != 0 && Object.values(data_v2.nodes).map(d => d.idNode).includes(n.idNode)) {
          return !n.node_visible || (!data_v2.links[n.inputLinksId[0]].arrow) ? false : true
        } else {
          return false
        }
      })
      .each(function (m) {
        const n = Object.values(data_v2.nodes).filter(d => d.idNode === (m as SankeyNode).idNode)[0]
        drawArrows(data_v2, n as SankeyNode, data_v2.nodes, data_v2.links, data_v2.display_style, data_v2.nodeTags,scale,inv_scale,min_thickness)
      })

    gg_links.filter(d => k_links.includes(d.idLink)).selectAll('.arrow').style('opacity', '0')



    paths.attr('d', d => {
      setNodesHeight(data_v2.nodes, new_links, d, data_v2.nodeTags)
      return drawCurve(data_v2,
        data_v2.nodes, new_links, data_v2.display_style,
        data_v2.nodeTags, d, error_msg
      )
    })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
    }

    //===================MODIFICATION FLUX NOUVELLE VUE =======================
    const edit_links = Object.fromEntries(Object.entries(data_v2.links).filter(d => Object.keys(data_v1.links).includes(d[0])))
    const edit_arrow = d3.selectAll('.ggg_nodes')
      .filter(m => {
        const incl = (el: string) => Object.values(edit_links).map(d => d.idLink).includes(el)

        const n = m as SankeyNode
        if (n.inputLinksId.length != 0 && Object.keys(data_v2.links).length != 0 && Object.values(data_v2.nodes).map(d => d.idNode).includes(n.idNode) && n.inputLinksId.some(incl)) {
          return !n.node_visible || (!data_v2.links[n.inputLinksId[0]].arrow) ? false : true
        } else {
          return false
        }
      })

    // edit_arrow.selectAll('.arrow').remove()
    //Déplace les flêchesdéjà existant vers leur nouvelle position
    edit_arrow
      .each(n => {
        const new_n = Object.values(data_v2.nodes).filter(d => d.idNode === (n as SankeyNode).idNode)[0]
        drawArrows(data_v2, new_n as SankeyNode, data_v2.nodes, data_v2.links, data_v2.display_style, data_v2.nodeTags,scale,inv_scale,min_thickness)
      })

    //Déplace les flux déjà existant vers leur nouvelle position
    Object.values(edit_links).map(d => {
      d3.select('#' + d.idLink).transition().duration(500).attr('d', l => {
        const d = l as SankeyLink
        const p = drawCurve(data_v2, data_v2.nodes, edit_links, data_v2.display_style, data_v2.nodeTags, d, error_msg)
        return p
      })
    })



    //Récupère parmi les noeuds, tous ceux qui emettent un nouveau flux sans en recevoir de nouveau
    const start_point = Object.values(data_v2.nodes).filter(f => (f.inputLinksId.filter(i => k_links.includes(i)).length == 0) && (f.outputLinksId.filter(i => k_links.includes(i)).length > 0))
    let time_to_animate = 500
    //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
    if (start_point.length > 0) {
      let nb_animation = calcPath(data_v2.nodes, start_point[0], new_links)

      nb_animation = (nb_animation !== undefined) ? nb_animation : 0
      time_to_animate += nb_animation * 2000
    }
    const glinks = (d3.select('#svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .filter(function (d) {
        return k_links.includes(d.idLink)
      })

    glinks.selectAll('.link').style('stroke-opacity', 0)
    glinks.selectAll('text').style('opacity', 0)

    setTimeout(function () {
      start_point.map(s => {
        branchAnimateForView(data_v2, s, [s.idNode], new_links)
      })
    }, 500)

    return time_to_animate

  }

  //Fonction permettant de calculer la profondeur max de nouveaux liens
  const calcPath = (
    nodes: { [node_id: string]: SankeyNode },
    node: SankeyNode,
    new_links: { [link_id: string]: SankeyLink },
  ) => {
    const keys_links = Object.keys(new_links)
    // let number_new_path=0
    let long = 0
    const links_present = node.outputLinksId.filter(o => keys_links.includes(o))

    if (links_present.length > 0) {
      long += 1
      links_present.map(d => {
        const n = nodes[new_links[d].idTarget]
        const lng = calcPath(nodes, n, new_links) as number
        long += isNaN(lng) ? 0 : lng

      })
      return long
    }
  }

  
  const direct_son_as_distant_sibling=(n:SankeyNode,target:SankeyNode,deep:number,link_to_avoid:string[])=>{
    //Cherche à savoir si un noeud qui recoit directement le flux de n ai aussi un path inderectement vers ce meme noeud 
    //exemple : n0 -> n1  et n0 -> n2 -> n1
    //fonction utilisé pour que le noeud qui recoit le liens direct attend les chemin indirect avant de lancer les animations suivantes
    // console.log(target)
    const next_link = n.outputLinksId.filter(f=>(!data.links[f].recycling && !Object.values(link_to_avoid).includes(f)))
    let max=0

    if(n.idNode==target.idNode){
      return deep-1
    }else if(next_link.length>0) {
      next_link.map(id=>{
        const next_node=data.nodes[data.links[id].idTarget]
        //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
        const to_avoid=link_to_avoid.concat([id])
        const tmp=direct_son_as_distant_sibling(next_node,target,deep+1,to_avoid)
        max=(tmp>max)?tmp:max
      })
    }

    return max
  
    
  }
  //fonction pour animer que les nouveaux liens 
  const branchAnimateForView = (
    data: SankeyData,
    nodeData: SankeyNode,
    nodeDisplay: string[],
    new_links: { [link_id: string]: SankeyLink },
  ) => {

    // console.log('branchAnimate')


    // Permet la progation de l'animation sur l'ensemble du Sankey
    const nodeStart = nodeData.idNode
    const keys_links = Object.keys(new_links)

    // on pourrait aussi evnetuellement faire un clone des noeuds
    d3.select('#' + nodeData.idNode).style('fill', d3.select('#' + nodeData.idNode).attr('fill'))
    d3.select('#' + nodeData.idNode + '_text').style('fill', d3.select('#' + nodeData.idNode).attr('fill'))

    const glinks = (d3.select('#svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .filter(function (d) {
        return d.idSource == nodeStart && keys_links.includes(d.idLink)
      })
    // console.log('gLink', glinks)
    // glinks.select('.link').style('stroke-opacity',0.2)
    // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
    const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')


    tmpLinks.selectAll('.link').style('stroke-opacity', 1)
    tmpLinks.selectAll('text').style('opacity', 0)


    tmpLinks.selectAll('.link')
      .each(function (this) {
        const totalLength = (this as SVGGeometryElement).getTotalLength()

        d3.select(this)
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .style('stroke', function (this) {
            // on recupere les paramêtres initiaux du stroke
            return d3.select(this).attr('stroke')
          })
          .style('stroke-opacity', 1)


      })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0)
      .on('end', function (this) {
        const idLink = d3.select(this).attr('id')
        const idTarget = data.links[idLink].idTarget
        // Modification des arrows après l'animation
        const arrowInitColor = d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow').attr('fill')
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow')
          .style('fill', arrowInitColor)
          .style('opacity', 1)

        // reaffichage des link value après l'animation
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
          .style('display', 'inline')
        //Propagration de l'animation sur les flux sortant du target_node
        // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
        if (!nodeDisplay.includes(idTarget)) {
          nodeDisplay.push(idTarget)
          branchAnimateForView(data, data.nodes[idTarget], nodeDisplay, new_links)
        }
      })
  }


  const branchAnimate = (
    nodeData: SankeyNode,
    nodeDisplay: string[]
  ) => {

    // Permet la progation de l'animation sur l'ensemble du Sankey
    const nodeStart = nodeData.idNode

    // on pourrait aussi evnetuellement faire un clone des noeuds
    d3.select('#' + nodeData.idNode).style('fill', d3.select('#' + nodeData.idNode).attr('fill'))
    d3.select('#' + nodeData.idNode + '_text').style('fill', d3.select('#' + nodeData.idNode).attr('fill'))

    const glinks = (d3.select('#svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
      .filter(function (d) {
        return d.idSource == nodeStart
      })

    // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
    const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')
    tmpLinks.selectAll('.link')
      .each(function (this) {
        const totalLength = (this as SVGGeometryElement).getTotalLength()

        d3.select(this)
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .style('stroke', function (this) {
            // on recupere les paramêtres initiaux du stroke
            return d3.select(this).attr('stroke')
          })

      })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0)
      .on('end', function (this) {
        const idLink = d3.select(this).attr('id')
        const idTarget = data.links[idLink].idTarget
        // Modification des arrows après l'animation
        const arrow=d3.select('#arrow_'+idLink)
        if(arrow!==undefined && arrow!= null){        
          const colorTarget=(data.nodes[idTarget].shape_visible)?node_color(data.nodes[idTarget],data):((data.nodes[idTarget].iconVisible)?data.nodes[idTarget].iconColor:'grey')
          const t=(data.links[idLink].gradient && data.colorMap=='no_colormap')?colorTarget:d3.select(this).attr('stroke')
          if(t){
            arrow.select('path').style('fill',t)
          }
        }
        // reaffichage des link value après l'animation
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
          .style('display', 'inline')
        //Propagration de l'animation sur les flux sortant du target_node
        // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
        if (!nodeDisplay.includes(idTarget)) {
          nodeDisplay.push(idTarget)
          let max=0
          const tmp=direct_son_as_distant_sibling(nodeData,data.nodes[idTarget],0,[idLink])
          max=(tmp>max)?tmp:max
          setTimeout(()=>{
            branchAnimate(data.nodes[idTarget], nodeDisplay)
          },max*2000)
        }
      })
  }

  
 
  const scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 100])

  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, 100])

  // ALT KEY INTERACTION: MOVE LABELS
  alt_key_pressed = false

  window.focus()
  d3.select(window).on('keydown', (event) => {
    if (event.keyCode === 18) {
      alt_key_pressed = true
      window.focus()
    }
  })
  d3.select(window).on('keyup', (event) => {
    if (event.keyCode === 18) {
      alt_key_pressed = false
      window.focus()
    }
  })

  const drawLegend = () => {
    // Dans le menu tags, les éléments affichés dans la légende sont :
    // les tagGroup pour lesquelles Legend est à true 
    // le selected du tags à true
    // dx permet de faire en décalage vers la gauche lorsque l'on change de groupTags
    let dx = 0
    const pas = data.legend_width


    d3.select('#g_legend').selectAll('*').remove()

    const legend = d3.select('#g_legend').style('transform', 'translate(' + (data.legend_position[0] + 25) + 'px,' + data.legend_position[1] + 'px)').append('g')

    const wrap = textwrap()
      .bounds({ height: 100, width: pas - 40 })
      .method('tspans')

    const all_tags = Object.assign({},data.nodeTags,data.fluxTags)
    Object.entries(all_tags).filter(tag_group => tag_group[1].show_legend).forEach(tag_group => {
      
      // Ajout du tagGroup.name  
      legend.append('text')
        .attr('transform', function () {
          return 'translate(' + dx + ', 0 )'
        })
        .attr('x', 0)
        .attr('y', 20)
        .text(tag_group[1].group_name)
        .attr('style', 'font-weight:bold')
        .call(wrap)

      const legendElements = legend.append('g')
        .selectAll('g')
        // je comprends pas trop avant on utilisait d3.entries il semble etre remplacé par Object.entries(), mais ca ne donne pas la même chose
        .data(Object.entries(tag_group[1].tags)
          .filter(tag=>{
            if(Object.keys(data.fluxTags).includes(tag_group[0])){
              const t=Object.values(data.links).filter(l=>{
                const tmp=getLinkValue(data,l.idLink)
                return link_visible(l,data) && tmp.tags[data.colorMap] && tmp.tags[data.colorMap]==tag[0]
              }).length
              return t>0
            }else if(Object.keys(data.nodeTags).includes(tag_group[0])){
              const t2=Object.values(data.nodes).filter(n=>{
                return n.tags[data.colorMap] && n.tags[data.colorMap].includes(tag[0]) && (n.node_visible ) && n.display && n.position !== 'relative'
              }).length
              return t2>0
            }
            return  false
          })
        )
        .enter()
        .append('svg:g')
        // on filtre les tags avec selected à true (Visible)
        .filter(function (d) { return d[1].selected })
        .attr('id',d=>{
          return 'tag_'+d[1].name.replaceAll(' ','__')
        })
        .attr('transform', function (d, i) {
          return 'translate(' + dx + ',' + (i * 30 + 30) + ')'
        })
        .on('mouseover',(event,d)=>{

          //Recherche les noeuds liés à des flux dont on survole la légende d'étiquette
          const nodes_tied_to_link_hovered=([] as string [])
          Object.values(data.links).filter(l=>{
            const tmp=getLinkValue(data,l.idLink)
            return tmp.tags[tag_group[0]]==d[0]
          }).forEach(el=>{
            nodes_tied_to_link_hovered.push(el.idSource)
            nodes_tied_to_link_hovered.push(el.idTarget)
          })
          //Reduit l'opacité de tous les flux qui n'ont pas l'étiquette survolé
          Object.values(data.links).filter(l=>{
            const tmp=getLinkValue(data,l.idLink)
            return tmp.tags[tag_group[0]]!=d[0]
          }).forEach(el=>{
            d3.selectAll('#'+el.idLink).attr('stroke-opacity',0.1)
            d3.selectAll('#gg_'+el.idLink+' text').style('opacity',0.1)
            d3.selectAll('#arrow_'+el.idLink+' path').attr('stroke-opacity',0.1)
            d3.selectAll('#arrow_'+el.idLink+' path').attr('opacity',0.1)
          })

          //Recupère le groupTag actif, si il existe, en régardant lequel a sa légende d'afficher (pour le moment il ne peut y avoir que un groupTag de sélectionné à a fois)
          const tmp=Object.entries(data.nodeTags).filter(n=>{
            return n[1].show_legend
          })

          let link_tied_to_node_hovered=([] as string[])
          const tmp2=(tmp.length>0)?tmp[0][0]:''

          if(tmp.length>0){
            //Récupère les liens entrant/sortant  des noeuds dont on survole l'étiquette
            Object.values(data.nodes).filter(n=>{
              return (n.tags[tmp2] && n.tags[tmp2].includes(d[0]))
            }).forEach(el=>{
              link_tied_to_node_hovered=link_tied_to_node_hovered.concat(el.outputLinksId)
              link_tied_to_node_hovered=link_tied_to_node_hovered.concat(el.inputLinksId)
            })

            //Reduit l'opacité de tous les flux qui ne sont pas rattaché à un noeuds survolé par l'étiquette
            Object.values(data.links).filter(l=>{
              return link_tied_to_node_hovered.includes(l.idLink)
            }).forEach(el=>{
              d3.selectAll('#'+el.idLink).attr('stroke-opacity',0.85)
              d3.selectAll('#arrow_'+el.idLink+' path').attr('stroke-opacity',0.85)
              d3.selectAll('#arrow_'+el.idLink+' path').attr('opacity',0.85)
              d3.selectAll('#gg_'+el.idLink+' text').style('opacity',1)

            })

            //Reduit l'opacité de tous les noeuds qui n'ont pas l'étiquette
            Object.values(data.nodes).filter(n=>{
              return ((n.tags[tmp2] && !n.tags[tmp2].includes(d[0]) && !nodes_tied_to_link_hovered.includes(n.idNode))||(!n.tags[tmp2]))
            }).forEach(el=>{
              d3.selectAll('#ggg_'+el.idNode).attr('opacity',0.1)

            })
          }else{
            Object.values(data.nodes)
              .filter(n=>!nodes_tied_to_link_hovered.includes(n.idNode))
              .forEach(el=>{

                d3.selectAll('#ggg_'+el.idNode).attr('opacity',0.1)
              })
          }
          
        })
        .on('mouseout',()=>{
          d3.selectAll('.link').attr('stroke-opacity',0.85)
          d3.selectAll('.defsArrow path').attr('stroke-opacity',0.85)
          d3.selectAll('.defsArrow path').attr('opacity',0.85)
          d3.selectAll('.gg_links text').style('opacity',1)
          d3.selectAll('.ggg_nodes').attr('opacity',1)
        })

      // Ajout du shape  
      legendElements.append('rect')
        .attr('width', 20)
        .attr('height', 20)
        .attr('x', 0)
        .attr('y', 10)
        .attr('rx', 3)
        .attr('ry', 3)
        .style('fill', (d) => { return (d as [string, { color: string }])[1].color })
        .style('fill-opacity', 1)
      // Ajout du label
      legendElements.append('text')
        .attr('x', 35)
        .attr('y', 20)
        .text(function (d) { return d[1].name })
        .call(wrap)

      dx = dx + pas

    })
  }

  const add_labels = () => {
    d3.selectAll('#svg #g_label g').remove()
    const g_label = d3.select('#svg #g_label')
    Object.values(data.labels).map(d => {
      const gg_label = g_label.append('g').attr('x', d.x).attr('y', d.y)
        .attr('id', d.idLabel)
        .attr('class', 'gg_label')
        .attr('transform', 'translate(' + d.x + ',' + d.y + ')')

      gg_label.append('rect')
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', d.color)
        .style('fill-opacity', d.transparent ? 0 : 1)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', (d.transparent_border && !multi_selected_label.current.includes(d)) ? 0 : 1)
        .attr('stroke-width', (multi_selected_label.current.includes(d))?3:1)
        .attr('rx', 5)



      gg_label.on('click', (event) => eventLabelClick(event,d,data,mode_visualisation,sankeyTooltip,accordion_ref,button_ref,multi_selected_label,set_data))

      // Traite les labels qui sont dans des foreignObject
      gg_label.filter(()=>{
        return d.isTextHTML
      }) .append('foreignObject')
        .attr('width',d.label_width)
        .attr('height',d.label_height)
        .attr('id', d.idLabel + '_text')
        .append('xhtml:div')
        .html(d.name)

      // Traite les labels qui sont simplementdu text
      const label_text = gg_label.filter(()=>{
        return !d.isTextHTML
      })
        .append('text')
        .attr('id', d.idLabel + '_text')
        .attr('x', d.x_label)
        .attr('y', d.y_label)
        .style('text-anchor', 'middle')
        .style('font-weight', () => (d.font_weight) ? 'bold' : 'normal')
        .style('font-style', () => (d.font_style) ? 'italic' : 'normal')
        .style('font-size', () => d.font_size + 'px')
        .style('text-transform', () => (d.font_uppercase) ? 'uppercase' : 'none')
        .style('text-align', 'center')
        .text(d.name)


      label_text.call(dragLabelEventTextEvent(alt_key_pressed,d))

      const wrap = textwrap()
        .bounds({ height: 100, width: d.label_width })
        .method('tspans')

      if(d.position_horiz!==''&&d.position_vert!==''){
        //Appel wrap seulement si le label n'a pas été drag 
        //pour éviter que cela cause quelques probleme de position de label drag
        d3.select('#' + d.idLabel + ' text').call(wrap)
      }

      d3.select('#' + d.idLabel + ' text').select('tspan')
        .attr('dy',()=>{
          if((d.position_vert=='bas') && d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp+'em'
          }else if((d.position_vert=='milieu') && d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length >0){
            const tmp=d3.select('#' + d.idLabel + ' text').selectAll('tspan').nodes().length -1
            return -tmp/2+'em'
          }
          return 0
        })

      d3.select('#' + d.idLabel + ' text').selectAll('tspan').attr('dx',2)
        .attr('x',()=>{
          let tmp=0

          switch(d.position_horiz){
          case 'gauche':
            tmp= 0
            break
          case 'centre':
            tmp=d.label_width/2
            break
          case 'droite':
            tmp=d.label_width
            break
          }
          return tmp
        })
        .attr('text-anchor',()=>{
          let tmp='gauche'

          switch(d.position_horiz){
          case 'gauche':
            tmp= 'start'
            break
          case 'centre':
            tmp='middle'
            break
          case 'droite':
            tmp='end'
            break
          }
          return tmp
        })


      gg_label.call(dragLabelEvent(multi_selected_label,d,data,min_width_and_height,drawGrid)
      )
      gg_label.append('rect')
        .attr('id','drag_zone_'+d.idLabel)
        .attr('width', d.label_width).attr('height', d.label_height)
        .attr('fill', 'none')
        .style('fill-opacity', 0)
        .attr('stroke', d.color_border)
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 2)
        .attr('rx', 5)
        .attr('cursor','all-scroll')
        .call(dragLabelWidthHeightEvent(d,data,set_data))
    })
  }

  const drawGrid = () => {

    d3.select('#svg #grid').selectAll('.line').remove()
    if (data.grid_visible && !data.static_sankey && !mode_visualisation) {
      const numberLineH = data.height / data.grid_square_size
      for (let row = 0; row < numberLineH; row++) {
        d3.select('#svg #grid').append('line')
          .attr('class', 'line line-horiz')
          .style('stroke', '#d3d3d3')
          .style('stroke-dasharray', 4)
          .attr('x1', '0')
          .attr('x2', data.width)
          .attr('y1', row * data.grid_square_size)
          .attr('y2', row * data.grid_square_size)

      }

      const numberLineV = data.width / data.grid_square_size

      for (let column = 0; column < numberLineV; column++) {
        d3.select('#svg #grid').append('line')

          .attr('class', 'line line-vert')
          .style('stroke-dasharray', 4)
          .style('stroke', '#d3d3d3')
          .attr('x1', column * data.grid_square_size)
          .attr('x2', column * data.grid_square_size)
          .attr('y1', 0)
          .attr('y2', data.height)
      }
    }

  }

  const position = data.static_sankey ? 'relative' : 'absolute'
  //const node_font = data.display_style.node_font_family_selected
  const link_font = data.display_style.link_font_family_selected
  const test = document.getElementsByClassName('navbar')
  let margin_top = 0
  if (test && test.length > 0) {
    margin_top = test[0].getBoundingClientRect().height -20
  }

  // Reformat la fonction pour qu'elle puisse être envoyé à document.onkeydown qui n'accepte les fonction que si elles ont pour paramètres
  //  event de type KeyBoardEvent
  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,current,data,multi_selected_nodes,multi_selected_links,set_data,accordion_ref,button_ref,set_show_toast,view,set_view,animate_view_changement,nextView)
  }
  // const get_diff = () => {
  //   const diff = require('deep-diff')
  //   const old_data_str = LZString.decompress(localStorage.getItem('data') as string) as string
  //   //Si data existe dans le localStorage 
  //   if (old_data_str != '') {
  //     //On le parse en JSON
  //     const old_data = JSON.parse(old_data_str)
  //     //on va chercher les anciennes différences
  //     // let old_diff = JSON.parse(localStorage.getItem('diff') as string)
  //     const old_diff_str = LZString.decompress(localStorage.getItem('diff') as string) as string
  //     let old_diff = (old_diff_str != '') ? JSON.parse(old_diff_str) : null
  //     const difference = diff(data, old_data)

  //     //Si il y des différences et que le tableau des anciennes différences existes alors on push dedans la nouvelles différence
  //     //sinon on créer un tableau ne contenant que la nouvelle différence
  //     if (difference !== undefined) {
  //       if (old_diff !== undefined && old_diff !== null) {
  //         old_diff.push(difference)
  //       } else {
  //         old_diff = [difference]
  //       }
  //     }

  //     const cmp = LZString.compress(JSON.stringify(old_diff))
  //     if (old_diff !== undefined) {
  //       localStorage.setItem('diff', cmp)
  //     }
  //   }

  // }

  //Fonction appelé lorsque les vue s'enchaien automatiquement (via le bouton play ou lorsqu'on appuye sur la touche 'p')
  const nextView = (data: SankeyData, views: { id: string, view_data: SankeyData, nom: string }[], new_view: string) => {
    const v1 = views.filter(d => d.id == new_view)[0].id
    let ind = -1
    views.map((v, i) => {
      ind = (v.id == v1) ? i : ind
    })
    if (ind < Object.keys(views).length - 1) {
      const copy = views[ind + 1].view_data as SankeyData
      const time_to_set_view = animate_view_changement(data, copy)

      setTimeout(function () {
        set_view(views[ind + 1].id)
        set_data({ ...data })
      }, time_to_set_view)
      setTimeout(function () {
        nextView(copy, views, views[ind + 1].id)
      }, time_to_set_view + 1000)
    }
  }

  useEffect(() => {
    [data.width, data.height] = min_width_and_height()
    removeAnimate()
    d3.select('body').style('background-color',data.couleur_fond_sankey)
    // let isDown = false
    // Permet d'affecter une class au svg selon le mode
    if (mode_selection=='s') {
      d3.select('#svg').attr('class','mode_selection')
    }
    if (mode_selection=='n') {
      d3.select('#svg').attr('class','mode_add_node')
    }
    
    if (mode_selection=='ln') {
      d3.select('#svg').attr('class','mode_add_flux')
    }

    const svgSankey = d3.select('#svg')
    if (data.fit_screen) {
      svgSankey.attr('viewBox', [0, 0, data.width , data.height] as unknown as string)
      svgSankey.style('width', window.screen.width*0.975)
    } else {
      svgSankey.attr('viewBox', null)
      svgSankey.style('width', data.width + 'px')
    }
    svgSankey.style('height', data.height + 'px');
    (svgSankey as d3.Selection<Element, unknown, HTMLElement, unknown>)
      .call(d3.zoom()
        .filter(ev => { // Permet d'obliger Crtl pour activer le zoom
          return (ev.ctrlKey || ev.metaKey) && ev.buttons == 0
        })
        .wheelDelta(ev => { // Permet de regler la vitesse du zoom
          return -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002)
        })
        .on('zoom', function (evt) {
          data.fit_screen = false
          evt.transform.x = 0
          evt.transform.y = 0
          d3.select('#svg')
            .attr('transform', evt.transform).attr('transform-origin', '0 0')
          svgSankey.attr('viewBox', null)
          if (evt.transform.k < 1 && !data.fit_screen) {
            d3.select('#svg')
              .style('border', Math.round(2 / evt.transform.k) + 'px solid #78c2ad')
              .style('width', data.width + 'px')
          } else {
            d3.select('#svg')
              .style('border', Math.max(1,Math.round(2 / evt.transform.k)) + 'px solid #78c2ad')        
          }
          
          // data.width=data.width / evt.transform.k
          // data.height=data.height/ evt.transform.k
          // drawGrid()
        })).on('dblclick.zoom', null)

    //Ajout des events sur les l'ajout des noeuds aux click 
    eventOnSankeyZone(svgSankey,mode_selection,current,data,set_data,multi_selected_nodes,multi_selected_links,first_selected_node)

    drawGrid()
    //Event listener sur les touche du clavier
    //Réagis à :
    //-Flêches qui déplace les noeuds sélectionnés
    //-Echape qui ferme la navbar
    //-Ctrl+S qui sauvegarde une vue 
    document.onkeydown = formatKeyHandler

    update_scale(data.user_scale)


    d3.select('#svg').selectAll('.defsArrow').remove()
    d3.select('#svg').append('defs').attr('class', 'defsArrow')


    add_nodes(data.static_sankey, true)
    add_links(data.static_sankey, true)
    add_labels()

    drawLegend()

    const test = document.getElementsByClassName('navbar')
    let margin_top = 0
    if (test && test.length > 0) {
      margin_top = test[0].getBoundingClientRect().height
      d3.select('#svg-container').style('margin-top',margin_top+'px')
    }
    // try {
    //   //Permet d'éviter qu'une vue soit stocké en tant que données dans la naviguateur 
    //   if (current) {
    //     get_diff()
    //     const cmp = LZString.compress(JSON.stringify(data))
    //     localStorage.setItem('data', cmp)
    //   }
    // } catch (e) {
    //   console.log(e)
    //   localStorage.clear()
    // }


  })
  let border = '0px'
  if (!data.static_sankey) {
    border = (current) ? '2px solid #78c2ad' : '2px solid red'
  }



  return (
    <>
      <div className="span12" style={{ 'color': 'black', 'marginLeft': '10px', 'display': 'inline' }} id={(current) ? 'visualization_div' : 'view_div'} >
        <div id="svg-container" style={{ 'position': position, 'marginTop': margin_top + 'px' }}>
          <svg id='svg' style={{ 'margin': '20px', 'height': data.height, 'width': data.fit_screen ? '98.5%' : data.width, 'border': border }} preserveAspectRatio="xMidYMin meet" onClick={(ev) => {
            if ((!ev.ctrlKey && !ev.metaKey) && !ev.shiftKey && mode_selection=='s') {
              removeAnimate()
              multi_selected_nodes.current = []
              multi_selected_links.current = []
              multi_selected_label.current = []
              Object.values(data.nodes).filter(n=>n.node_visible).forEach(n=>d3.select('#' + n.idNode).attr('stroke-width',0))
              Object.values(data.labels).forEach(l=>d3.select('#' + l.idLabel + ' rect').attr('stroke-width',(l.transparent_border)?0:1))
              const visible_links = Object.values(data.links)
              visible_links.forEach(l=> {
                const sel = d3.selectAll('#gg_' + l.idLink+ ' rect')
                sel.attr('fill-opacity', '0')
              })
              set_data({...data})

            }
          }}>
            <g className='grid' id='grid'></g>
            <g className='g_label' id='g_label'></g>

            <g className='g_legend' id='g_legend'></g>
            <g className='g_links' id='g_links' style={{ 'position': position, 'marginTop': margin_top + 'px', 'fontFamily': link_font }} ></g>
            <g className='g_nodes' id='g_nodes' style={{ 'position': position, 'marginTop': margin_top + 'px', /*'fontFamily': node_font */ }} ></g>

          </svg>
        </div>
      </div>
      { agregation_node !== '' ?
        <AgregationModal
          show_agregation={show_agregation}
          data={data}
          set_data={set_data}
          agregation_node={agregation_node}
          set_show_agregation={set_show_agregation}
          is_agregation={is_agregation}
        /> : <></>}
    </>
  )
}

SankeyDraw.propTypes = SankeyDrawPropTypes
SankeyDraw.defaultProps = SankeyDrawDefaultProps

export default SankeyDraw

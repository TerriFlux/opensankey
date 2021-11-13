import * as d3 from 'd3'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { SankeyNode, SankeyLink, SankeyData, SankeyDataPropTypes, TagsCatalog } from './types'
import PropTypes, { InferProps } from 'prop-types'
import * as SankeyShapes from './SankeyShapes'
import { compute_total_offsets } from './SankeyUtils'
import { desagregation,agregation } from './SankeyLayout'

window.d3 = d3

const SankeyDrawPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  select_node: PropTypes.func.isRequired,
  nodeContextMenu: PropTypes.func.isRequired,
  node_color: PropTypes.func.isRequired,
  node_label_visible: PropTypes.func.isRequired,
  node_visible: PropTypes.func.isRequired,
  node_arrow_visible: PropTypes.func.isRequired,

  select_link: PropTypes.func.isRequired,
  linkContextMenu: PropTypes.func.isRequired,
  link_color: PropTypes.func.isRequired,
  link_text: PropTypes.func.isRequired,
  link_visible: PropTypes.func.isRequired,
  test_link_value: PropTypes.func.isRequired,

  more_processing: PropTypes.func.isRequired,

  set_show_nav: PropTypes.func.isRequired,
  set_nav_item_active: PropTypes.func.isRequired,

  nodeTooltipsContent: PropTypes.func.isRequired,
  linkTooltipsContent: PropTypes.func.isRequired,
  getValueIndex: PropTypes.func.isRequired
}

type SankeyDrawTypes = InferProps<typeof SankeyDrawPropTypes>

const SankeyDraw: FunctionComponent<SankeyDrawTypes> = ({
  data,
  set_data,
  select_node,
  nodeContextMenu,
  node_color,
  node_visible,
  node_label_visible,
  node_arrow_visible,
  select_link,
  linkContextMenu,
  link_color,
  link_text,
  link_visible,
  test_link_value,
  more_processing,
  set_show_nav,
  set_nav_item_active,
  nodeTooltipsContent,
  linkTooltipsContent,
  getValueIndex
}) => {
  /* const [show, setShow] = useState(false)
  const toggleShow = () => { setShow((s) => !s) }
  const [checked, setChecked] = useState(false) */
  const default_node_size = data.node_width
  const default_handle_size = 10
  const default_horiz_shift = 50
  const min_thickness = 1

  const normalize_name = (name: string) => {
    const new_name = name.split('\\n').join('').split(' ').join('')
    return new_name
  }

  const display_nodes : SankeyNode [] = data.nodes.filter( n=> n.display )
  const display_links : SankeyLink [] = data.links.filter( l=> {
    const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    return source_node.display &&  target_node.display
  })

  const handles_visible = [...(new Array(display_links.length).fill(false))]

  const sankeyTooltip = d3.select('#visualization_div')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sankey-tooltip')
    .style('background-color', '#1abc9c')
    .style('border', 'solid')
    .style('border-width', '0px')
    .style('border-radius', '5px')
    .style('padding', '5px')
    .style('z-index', 100)
    .style('position', 'absolute')
    .style('pointer-events', 'none')

  let alt_key_pressed = false

  const value_index = getValueIndex(data)

  const add_links = (
    static_sankey: boolean,
    remove_previous_links = false
  ) => {
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
      .data(display_links)
      .enter()
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (d.visible) { display = 'inline' } else { display = 'none' }
        return display
      })

    const paths = gg_links.append('path')

    if (!static_sankey) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(d3.drag<SVGPathElement, SankeyLink>()
        .subject(Object)
        .on('drag', function (event) {
          drag_link(display_nodes, display_links, display_style, data.tags_catalog, this, event)
          display_links.forEach(
            (link: SankeyLink) => {
              d3.select('#' + link.idLink).attr('d',
                () => {
                  return drawCurve(
                    display_nodes, display_links, display_style,
                    data.tags_catalog, link,
                    error_msg
                  )
                }
              )
            }
          )
        })
      )
      paths.on('contextmenu', (event, l) => {
        event.preventDefault()
        sankeyTooltip.style('opacity', 0)
        sankeyTooltip.style('opacity', 0)
        linkContextMenu(l)
      })
    }

    // link value
    // const select = gg_links
    //   .filter(d => d.label_position !== 'frozen' && d.label_on_path === true)
    //   .append('text')
    //   .append('textPath')

    gg_links
      .filter(
        d => d.label_position !== 'frozen' && d.label_on_path === true
      )
      .append('text')
      .attr('pointer-events', 'none')
      .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
      .attr('fill', d => d.text_color)
      //.attr('visibility', d => link_visible(d))
      .attr('dy', '0.3em')
      .append('textPath')
      .attr('id', d => d.idLink+'_text')
      .attr('class', 'link_value')
      .attr('href', d => '#' + d.idLink)


    const select2 = gg_links
      .filter(d => d.label_position === 'frozen' || !d.label_on_path || d.label_on_path === undefined)
      .append('text')

    // select
    //   .attr('href', d => '#link' + links.indexOf(d))
    //   .attr('id', d => 'link_value' + links.indexOf(d))
    //   .attr('class', 'link_value')
    //   .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
    //   .attr('fill', d => d.text_color)
    //   .attr('visibility', d => link_visible(d))


    select2
      .attr('href', d => '#' + d.idLink)
      .attr('id', d => d.idLink+'_text')
      .attr('class', 'link_value')
      .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
      .attr('fill', d => d.text_color)
      .attr('visibility', d => link_visible(d) && d.value[value_index] >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden' )

    if (!static_sankey) {
      select2.call(d3.drag<SVGTextElement, SankeyLink>()
        .subject(Object).on('drag', function (event,link) {
          if (alt_key_pressed) {
            drag_link_text(link, event)
          }
        })
      )
        .on('click', (event, d) => {
          const source_node = display_nodes.filter(n => normalize_name(n.name) === normalize_name(d.source_name))[0]
          const target_node = display_nodes.filter(n => normalize_name(n.name) === normalize_name(d.target_name))[0]
          select_link(d)
          // if classic link
          if (d.orientation === 'hh' && source_node.x < target_node.x) {
            d3.select('#link_center' + d.idLink).attr('fill-opacity', 0.7)
          }
        })
    }
    if (!static_sankey) {
      select2.call(d3.drag<SVGTextElement, SankeyLink>()
        .subject(Object).on('drag', function (event,link) {
          if (alt_key_pressed) {
            drag_link_text(link, event)
          } else {
            const text_id = d3.select(this).attr('id')
            const link_to_drag = text_id.substring(text_id.length-5)
            drag_link(display_nodes, display_links, display_style, data.tags_catalog, (d3.select(link_to_drag).node() as SVGPathElement), event)
          }
        })
      )
    }

    let error_msg: { text?: string | undefined } | undefined
    paths
      .attr('class', 'link')
      .attr('id', d => d.idLink)
      .attr('fill', 'none')
      .attr('stroke-opacity', d => d.visible && d.value[value_index] >= display_style.filter ? ((String(d.display_value[value_index]).includes('[')) ? 0.3 :0.95) : 0)
      .attr('stroke-width', d => {
        const link_value = test_link_value(display_nodes, d, data.tags_catalog)
        return scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
      })
      //.attr('stroke',d => d.unbounded ? 'darkred' : d.color)
      .attr('stroke', l => link_color(l,value_index))
      .on('mouseover', function (event, d) {
        if ( !event.shiftKey ) {
          return
        }
        sankeyTooltip
          .style('opacity', 1)
          .html(linkTooltipsContent(data, d,getValueIndex))
        if (d.visible && d.value[value_index] >= display_style.filter) {
          return d3.select(this).attr('stroke-opacity', '0.5')
        }
      })
      .on('mousemove', (event) => {
        if ( !event.shiftKey ) {
          return
        }
        sankeyTooltip
          .style('top', (event.layerY - 10) + 'px')
          .style('left', (event.layerX + 10) + 'px')
      })
      .on('mouseout', function (event, d) {
        sankeyTooltip.style('opacity', 0)
        if (d.visible && d.value[value_index] >= display_style.filter) {
          const opacity = String(d.display_value[value_index]).includes('[') ? 0.3 : 0.95
          return d3.select(this).attr('stroke-opacity', opacity)
        }
      })
    let firing = false
    const singleClick = (link: SankeyLink) => {
      select_link(link)
    }
    const doubleClick = (link: SankeyLink) => {
      const id = display_links.indexOf(link)
      handles_visible[id] = !handles_visible[id]
      let shift_handles
      if (display_links[id].recycling) {
        shift_handles = ['#vert_shift', '#left_horiz_shift', '#right_horiz_shift']
      } else {
        shift_handles = ['#left_horiz_shift', '#right_horiz_shift']
      }
      for (let i = 0; i < shift_handles.length; i++) {
        const str = shift_handles[i] + link.idLink
        const sel = d3.select(str)
        if (handles_visible[id]) {
          sel.attr('fill-opacity', '0.7')
        } else {
          sel.attr('fill-opacity', '0')
        }
      }
    }
    let firingFunc = singleClick
    paths.on('dblclick', () => {
      firingFunc = doubleClick
    })
    paths.on('click', function (event, d) {
      if (event.ctrlKey) {
        // set_selected_node(nodes.filter(f => { return f.name == event.target.value })[0].id)
        sankeyTooltip.style('opacity', 0)
        select_link(d)
        set_nav_item_active('3')
        //set_show_nav(false)
        set_show_nav(true)
      } else {
        sankeyTooltip.style('opacity', 0)
        if (firing) {
          return
        }
        firing = true
        //const i = display_links.indexOf(d)
        setTimeout(() => {
          firingFunc(d)
          firingFunc = singleClick
          firing = false
        }, 300)
      }
    })


    paths.attr('d', d => {
      setNodesHeight(display_nodes, display_links, d, data.tags_catalog)
      return drawCurve(
        display_nodes, display_links, display_style,
        data.tags_catalog, d, error_msg
      )
    })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
    }

    // if (document.getElementById('front-0')){
    //   document.getElementById('svg').appendChild(document.getElementById('front-0'))
    // }

    // move_links_values_forward(links.length)
  }



  const update_scale = (user_scale: number) => {
    scale.domain([0, user_scale])
    inv_scale.range([0, user_scale])
    //link_default_width = user_scale/20
  }

  const deselect_nodes_and_links = () => {
    d3.select('#g_nodes').selectAll('.selected_node').attr('class', 'node')
    d3.select('#g_links').selectAll('path').attr('class', 'link')
  }

  const drag_node = (
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { sector_italic?: boolean; product_italic?: boolean; sector_bold?: boolean; product_bold?: boolean; font_size: number; sector_uppercase?: boolean; product_uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },
    tags_catalog:TagsCatalog,
    dragged: Element,
    event: { dx: number; dy: number }
  ) => {
    const { width, height } = data

    //- ggg_node5 -> node5
    const idNode = dragged.id.substring(4)
    const node = nodes[nodes.findIndex(d => d.idNode === idNode)]

    const old_x = +node.x
    const old_y = +node.y
    const new_x = old_x + event.dx
    const new_y = old_y + event.dy

    if (new_x < 0 || new_x > (width - default_node_size) || new_y < 0 || new_y > (height - default_node_size)) {
      return
    }


    node.x = new_x
    node.y = new_y

    sankeyTooltip.style('opacity', 0) // Fermeture de la tooltip au click

    d3.select(dragged).attr('transform', 'translate(' + new_x + ',' + new_y + ')')
    d3.select('#tooltip_node' + idNode).attr('transform', 'translate(' + (new_x + 50) + ',' + (new_y + 20) + ')')

    const error_msg: { [text: string]: string } = {}
    links.forEach(
      (link: SankeyLink, i: number) => {
        if (link.source_name === node.name || link.target_name === node.name) {
          // Redraw link
          const old_x_pos = +d3.select('#' + link.idLink+'_text').attr('x')
          const old_y_pos = +d3.select('#' + link.idLink+'_text').attr('y')
          if (!(link.label_position === 'frozen')) {
            d3.select('#' + link.idLink+'_text').attr('x', old_x_pos + 1 / 2 * (new_x - old_x))
            d3.select('#' + link.idLink+'_text').attr('y', old_y_pos + 1 / 2 * (new_y - old_y))
          }
          // select allows to redraw directly without refreshing
          d3.select('#' + link.idLink)
            .attr('d', () => {
              return drawCurve(
                nodes, links, display_style,
                data.tags_catalog,
                link,
                error_msg
              )
            })
          const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.target_name))[0]
          if (link.arrow) {
            const node_select = d3.select('#ggg_' + target_node.idNode) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
            drawArrows(target_node, nodes, links, display_style, tags_catalog, node_select)
          }
          for (let i = 0; i < target_node.inputLinksId.length; i++) {
            d3.select('#' + target_node.inputLinksId[i])
              .attr('d', (link => {
                return drawCurve(
                  nodes, links, display_style,
                  tags_catalog,
                  link as SankeyLink,
                  error_msg
                )
              }))
          }
          for (let i = 0; i < target_node.outputLinksId.length; i++) {
            d3.select('#' + target_node.outputLinksId[i])
              .attr('d', link => {
                return drawCurve(
                  nodes, links, display_style,
                  tags_catalog,
                  link as SankeyLink,
                  error_msg
                )
              })
          }
        }
      })

    if (error_msg.text !== undefined) {
      alert(error_msg)
    }
  }


  const drag_link = (
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { font_size: number; filter: number; filter_label: number },
    tags_catalog: TagsCatalog,
    dragged: SVGPathElement | null,
    event: d3.D3DragEvent<Element, SankeyLink, unknown>
  ) => {
    const idLink = d3.select(dragged).attr('id')
    const p2 = d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))
    const linked_node = identify_node(nodes, links, links[links.findIndex(l=>l.idLink === idLink)], p2)
    if (linked_node === undefined) {
      return
    }
    const node = nodes[nodes.findIndex(n=>n.idNode === linked_node.node_id)]

    if (linked_node.type === 'source') {
      const source_order = node.outputLinksId.indexOf(idLink)
      let output_offset = 0
      for (let i = 1; i < node.outputLinksId.length; i++) {
        const link_id = links.findIndex(l=>l.idLink === node.outputLinksId[i - 1])
        if (i > source_order) {
          break
        }
        output_offset += links[link_id].value[value_index]
      }
      const number_of_links = node.outputLinksId.length
      const id = links.findIndex(l=>l.idLink === idLink)
      const value = links[id].value
      if (links[id].orientation === 'hh') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + value[value_index])) {
          swap(node.outputLinksId, source_order, source_order + 1)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, source_order, source_order - 1)
        }
      } else if (links[id].orientation === 'vv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(output_offset + value[value_index])) {
          swap(node.outputLinksId, source_order, source_order + 1)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, source_order, source_order - 1)
        }
      }
    }
    if (linked_node.type === 'target') {
      const target_order = node.inputLinksId.indexOf(idLink)
      let input_offset = 0
      for (let i = 1; i < node.inputLinksId.length; i++) {
        const link_id = links.findIndex(l=>l.idLink === node.inputLinksId[i - 1])
        if (i > target_order) {
          break
        }
        input_offset += links[link_id].value[value_index]
      }
      const number_of_links = node.inputLinksId.length
      const id = links.findIndex(l=>l.idLink === idLink)
      const value = links[id].value
      if (links[id].orientation === 'hh') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + value[value_index])) {
          swap(node.inputLinksId, target_order, target_order + 1)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, target_order, target_order - 1)
        }
      } else if (links[id].orientation === 'vv') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + value[value_index])) {
          swap(node.inputLinksId, target_order, target_order + 1)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, target_order, target_order - 1)
        }
      }
      const node_select = d3.select('#ggg_' + node.idNode) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
      drawArrows(node, nodes, links, display_style, tags_catalog, node_select)
    }
  }

  const drag_handle = (
    link: SankeyLink,
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { font_size: number; filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    dragged: Element,
    handle_type: string,
    the_event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const { width, height } = data

    const old_x = +d3.select(dragged).attr('transform').split(',')[0].substring(10)
    const old_y_str = d3.select(dragged).attr('transform').split(',')[1]
    const old_y = +old_y_str.substring(0, old_y_str.length - 1)
    const new_x = old_x + the_event.dx
    const new_y = old_y + the_event.dy
    const d: SankeyLink = d3.select(dragged).data()[0] as SankeyLink
    let u_center_new = -1
    const source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(d.source_name))[0]
    const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(d.target_name))[0]

    const [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, selected_tags)

    if (!d.recycling) {
      if (d.orientation === 'hh') {
        const link_x_length = Math.abs(xt - xs)
        u_center_new = Math.abs(new_x - xs) / link_x_length
      } else if (d.orientation === 'vv') {
        const link_y_length = Math.abs(yt - ys)
        u_center_new = Math.abs(new_y - ys) / link_y_length
      }
      if (u_center_new >= 0 && u_center_new <= 1) {
        if (handle_type === 'left') {
          d.left_horiz_shift = u_center_new
        } else {
          d.right_horiz_shift = u_center_new
        }
      } else {
        return
      }
    } else if (handle_type === 'vert') {
      //if (d.vert_shift + event.dy > -0.5 * scale(d.value[value_index]) && new_y < height - scale(d.value[value_index])/2) {
      if (new_y < height - scale(d.value[value_index]) / 2) {
        d.vert_shift += the_event.dy
      } else {
        return
      }
    } else if (handle_type === 'left') {
      if (d.left_horiz_shift + the_event.dx < default_horiz_shift && new_x > scale(d.value[value_index]) / 2) {
        d.left_horiz_shift += the_event.dx
      } else {
        return
      }
    } else if (handle_type === 'right') {
      if (d.right_horiz_shift + the_event.dx > -default_horiz_shift && new_x < width - scale(d.value[value_index]) / 2) {
        d.right_horiz_shift += the_event.dx
      } else {
        return
      }
    }
    //links[link_id] = d // Update data then update viz
    d3.select('#' + d.idLink).attr('d', () => {
      let error_msg
      return drawCurve(
        nodes, links, display_style,
        data.tags_catalog, d,error_msg
      )
    })
  }

  // Identify the node that is the closest from mouse click (either source or target).
  const identify_node = (
    nodes: SankeyNode[],
    links: SankeyLink[],
    link: SankeyLink,
    mouse_coord: number[]
  ) => {
    const source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.source_name))[0]
    const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.target_name))[0]

    const source_x_min = source_node.x
    const source_x_max = source_x_min + parseInt(d3.select('#' + source_node.idNode).attr('width'))
    const source_y_min = source_node.y
    const source_y_max = source_y_min + parseInt(d3.select('#' + source_node.idNode).attr('height'))
    const target_x_min = target_node.x
    const target_x_max = target_x_min + parseInt(d3.select('#' + target_node.idNode).attr('width'))
    const target_y_min = target_node.y
    const target_y_max = target_y_min + parseInt(d3.select('#' + target_node.idNode).attr('height'))
    const tolerance = 3 * default_node_size

    if (link.orientation === 'hh' && mouse_coord[1] >= source_y_min && mouse_coord[1] <= source_y_max && (mouse_coord[0] <= source_x_max + tolerance)) {
      return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_y_min }
    }
    if (link.orientation === 'hh' && mouse_coord[1] >= target_y_min && mouse_coord[1] <= target_y_max && (mouse_coord[0] >= target_x_min - tolerance)) {
      return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_y_min }
    }
    if (link.orientation === 'vv' && mouse_coord[0] >= source_x_min && mouse_coord[0] <= source_x_max && (mouse_coord[1] <= source_y_max + tolerance)) {
      return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_x_min }
    }
    if (link.orientation === 'vv' && mouse_coord[0] >= target_x_min && mouse_coord[0] <= target_x_max && (mouse_coord[1] >= target_y_min - tolerance)) {
      return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_x_min }
    }
  }

  const add_shift_handle = (
    link: SankeyLink,
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { font_size: number; filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    shift_name: string,
    position: string
  ) => {
    d3.select('#gg_' + link.idLink)
      .append('rect')
      .attr('id', shift_name + link.idLink)
      .attr('fill-opacity', '0')
      .attr('width', default_handle_size)
      .attr('height', default_handle_size)
      .on('mouseover', function () {
        d3.select(this).attr('fill-opacity', '0.7')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill-opacity', '0')
      })
      .call(d3.drag<SVGRectElement, unknown>()
        .subject(Object).on('drag', function (event) {
          drag_handle(
            link, nodes, links, display_style,
            selected_tags,
            this, position, event
          )
        })
      )
  }

  const add_shift_handles = (
    link: SankeyLink,
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { font_size: number; filter: number; filter_label: number },
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

  const drawLinkText = (
    link: SankeyLink,
    links: SankeyLink[],
    link_value: number,
    display_style: { font_size: number; filter: number; filter_label: number },
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    let x_pos = 0
    let y_pos = 0

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

    if (link.label_position === 'frozen' && link.x_label ||
      !link.label_on_path || link.label_on_path === undefined) {
      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
        .attr('x', d => link.label_position === 'frozen' && link.x_label ? link.x_label : x_pos)
        .attr('y', d => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
        .text(d => link_text(d, link_value, display_style,value_index))
        .attr('visibility', link.label_visible ? 'visible' : 'hidden')
    } else {
      const positions: { [label_position: string]: string[] } = {
        'frozen': ['50%', 'start'],
        'beginning': ['10px', 'start'],
        'middle': ['50%', 'start'],
        'end': ['100%', 'end']
      };

      (d3.select('#' + link.idLink + '_text') as d3.Selection<SVGSVGElement, SankeyLink, HTMLElement, SankeyLink>)
        .attr('startOffset', positions[link.label_position][0])
        .attr('text-anchor', positions[link.label_position][1])
        //.text(d => ' → ' +link_text(d, link_value, display_style) + ' → ')
        .text(d => link_text(d, link_value, display_style,value_index) )
        .attr('visibility', link.label_visible ? 'visible' : 'hidden')
    }
  }

  const setNodeHeight = (
    n: SankeyNode,
    nodes: SankeyNode[],
    links: SankeyLink[],
    selected_tags:TagsCatalog
  ) => {
    const res = compute_total_offsets(n, nodes, links, selected_tags, test_link_value)

    const [total_offset_height_left, total_offset_height_right, total_offset_width_top, total_offset_width_bottom] = res

    // Hauteur des noeuds
    const node_size_s_height = Math.max(
      inv_scale(3), total_offset_height_left, total_offset_height_right
    )
    const node_size_s_width = Math.max(
      inv_scale(default_node_size), total_offset_width_top, total_offset_width_bottom
    )
    d3.select('#' + n.idNode).attr('width', scale(node_size_s_width))
    d3.select('#' + n.idNode).attr('height', scale(node_size_s_height))
    if (n.type === 'product') {
      d3.select('#' + n.idNode).attr('rx', scale(node_size_s_width / 2))
      d3.select('#' + n.idNode).attr('cx', scale(node_size_s_width / 2))
      d3.select('#' + n.idNode).attr('ry', scale(node_size_s_height / 2))
      d3.select('#' + n.idNode).attr('cy', scale(node_size_s_height / 2))
    }
  }

  const setNodesHeight = (
    nodes: SankeyNode[],
    links: SankeyLink[],
    d: SankeyLink,
    tags_catalog:TagsCatalog
  ) => {
    let source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(d.source_name))[0]
    let target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(d.target_name))[0]
    if (target_node === undefined) {
      target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(d.target_name))[0]
    }
    if (source_node === undefined) {
      const filter_source_name = normalize_name(d.source_name)
      const filter_nodes = nodes.filter(n => normalize_name(n.name) === filter_source_name)
      source_node = filter_nodes[0]
    }

    let res = compute_total_offsets(source_node, nodes, links, tags_catalog, test_link_value)
    const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res
    res = compute_total_offsets(target_node, nodes, links, tags_catalog, test_link_value)
    const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res

    // Hauteur des noeuds
    const node_size_s_height = Math.max(
      inv_scale(3), s_total_offset_height_left, s_total_offset_height_right
    )
    const node_size_t_height = Math.max(
      inv_scale(3), t_total_offset_height_left, t_total_offset_height_right
    )
    const node_size_s_width = Math.max(
      inv_scale(default_node_size), s_total_offset_width_top, s_total_offset_width_bottom
    )
    const node_size_t_width = Math.max(
      inv_scale(default_node_size), t_total_offset_width_top, t_total_offset_width_bottom
    )
    d3.select('#' + source_node.idNode).attr('width', scale(node_size_s_width))
    d3.select('#' + source_node.idNode).attr('height', scale(node_size_s_height))
    if (source_node.type === 'product') {
      d3.select('#' + source_node.idNode).attr('rx', scale(node_size_s_width / 2))
      d3.select('#' + source_node.idNode).attr('cx', scale(node_size_s_width / 2))
      d3.select('#' + source_node.idNode).attr('ry', scale(node_size_s_height / 2))
      d3.select('#' + source_node.idNode).attr('cy', scale(node_size_s_height / 2))
    }
    d3.select('#' + target_node.idNode).attr('width', scale(node_size_t_width))
    d3.select('#' + target_node.idNode).attr('height', scale(node_size_t_height))
    if (target_node.type === 'product') {
      d3.select('#' + target_node.idNode).attr('rx', scale(node_size_t_width / 2))
      d3.select('#' + target_node.idNode).attr('cx', scale(node_size_t_width / 2))
      d3.select('#' + target_node.idNode).attr('ry', scale(node_size_t_height / 2))
      d3.select('#' + target_node.idNode).attr('cy', scale(node_size_t_height / 2))
    }
  }

  const compute_end_points = (
    source_node: SankeyNode,
    target_node: SankeyNode,
    link: SankeyLink,
    nodes: SankeyNode[],
    links: SankeyLink[],
    selected_tags: { [tag_group: string]: string[] },

  ) => {
    if (!links) {
      return [0, 0, 0, 0]
    }

    const link_value = test_link_value(nodes, link, selected_tags)
    if (link_value === undefined) {
      return [0, 0, 0, 0]
    }
    let res = compute_total_offsets(source_node, nodes, links, selected_tags, test_link_value)
    const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res

    res = compute_total_offsets(target_node, nodes, links, selected_tags, test_link_value)
    const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res


    const node_size_s_width = Math.max(
      inv_scale(default_node_size), s_total_offset_width_bottom, s_total_offset_width_top
    )
    const node_size_t_width = Math.max(
      inv_scale(default_node_size), t_total_offset_width_bottom, t_total_offset_width_top
    )
    const node_size_s_height = Math.max(
      inv_scale(3), s_total_offset_height_left, s_total_offset_height_right
    )
    const node_size_t_height = Math.max(
      inv_scale(3), t_total_offset_height_left, t_total_offset_height_right
    )

    res = compute_total_offsets(source_node, nodes, links, selected_tags, test_link_value, link)
    const [s_offset_height_left, s_offset_height_right, s_offset_width_top, s_offset_width_bottom] = res
    res = compute_total_offsets(target_node, nodes, links, selected_tags, test_link_value, link)
    const [t_offset_height_left, t_offset_height_right, t_offset_width_top, t_offset_width_bottom] = res

    const delta_s_width_bottom = Math.max(0, (node_size_s_width - s_total_offset_width_bottom) / 2)
    const delta_s_width_top = Math.max(0, (node_size_s_width - s_total_offset_width_top) / 2)
    const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
    const delta_s_height_left = Math.max(0, (node_size_s_height - s_total_offset_height_left) / 2)

    const delta_t_width_bottom = Math.max(0, (node_size_t_width - t_total_offset_width_bottom) / 2)
    const delta_t_width_top = Math.max(0, (node_size_t_width - t_total_offset_width_top) / 2)
    const delta_t_height_right = Math.max(0, (node_size_t_height - t_total_offset_height_right) / 2)
    const delta_t_height_left = Math.max(0, (node_size_t_height - t_total_offset_height_left) / 2)

    let xs = +source_node.x
    let ys = +source_node.y
    let xt = +target_node.x
    let yt = +target_node.y

    if (link.orientation === 'hh') {
      //side to side
      if (source_node.x > target_node.x && !link.recycling || source_node.x < target_node.x && link.recycling) {
        // source is after target arrow point leftward. Start is on the left of side of source
        // source -> left
        //xs = xs
        ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)
        // target -> right
        xt += scale(node_size_t_width)
        yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
        if (link.arrow) {
          xt = xt + 10
        }
      } else {
        // source is before target arrow point rightward. Start is on the right of side of source
        const delta_s_height_right = Math.max(0, (node_size_s_height - s_total_offset_height_right) / 2)
        xs += scale(node_size_s_width)
        ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)
        //xt = xt
        yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
        if (link.arrow) {
          xt = xt - 10
        }
      }
    }

    if (link.orientation === 'vv') {
      //side to side
      if (source_node.y > target_node.y) {
        // source is bottom target. Flux goes up
        xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
        //ys = ys
        xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
        yt += scale(node_size_t_height)
        if (link.arrow) {
          yt = yt + 10
        }
      } else {
        // source is top target. Flux goes down
        xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
        ys += scale(node_size_s_height)
        xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
        //yt += scale(node_size_t_height)
        if (link.arrow) {
          yt = yt - 10
        }
      }
    }

    if (link.orientation === 'hv') {
      //vertical to horizontal
      if (source_node.x > target_node.x) {
        if (source_node.y > target_node.y) {
          //source is bottom right target. left and up  
          //xs = xs
          ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)

          xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
          yt += scale(node_size_t_height)

          if (link.arrow) {
            yt = yt + 10
          }
        } else {
          //source is top right target. left and down
          //xs = xs
          ys += scale(delta_s_height_left + s_offset_height_left + link_value / 2)

          xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
          //yt = yt

          if (link.arrow) {
            yt = yt - 10
          }
        }
      } else {
        if (source_node.y > target_node.y) {
          //source is bottom left target. right and up
          xs += scale(node_size_s_width)
          ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)

          xt += scale(delta_t_width_bottom + t_offset_width_bottom + link_value / 2)
          yt += scale(node_size_t_height)

          if (link.arrow) {
            yt = yt + 10
          }
        } else {
          //source is top left target. right and down
          xs += scale(node_size_s_width)
          ys += scale(delta_s_height_right + s_offset_height_right + link_value / 2)

          xt += scale(delta_t_width_top + t_offset_width_top + link_value / 2)
          //yt = yt

          if (link.arrow) {
            yt = yt - 10
          }
        }
      }
    }

    if (link.orientation === 'vh') {
      //vertical to horizontal
      if (source_node.x > target_node.x) {
        if (source_node.y > target_node.y) {
          //source is bottom right target. up and left
          xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
          //ys = ys
          xt += scale(node_size_t_width)
          yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
          if (link.arrow) {
            xt += 10
          }
        } else {
          //source is top right target. down and left
          xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
          ys += scale(node_size_s_height)
          xt += scale(node_size_t_width)
          yt += scale(delta_t_height_right + t_offset_height_right + link_value / 2)
          if (link.arrow) {
            xt += 10
          }
        }
      } else {
        if (source_node.y > target_node.y) {
          //source is bottom left target. Arrow goes left and go down to the top side 
          xs += scale(delta_s_width_top + s_offset_width_top + link_value / 2)
          //ys = ys
          //xt = xt
          yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
          if (link.arrow) {
            xt = xt - 10
          }
        } else {
          //source is top left target. Arrow goes left and go down to the top side 
          xs += scale(delta_s_width_bottom + s_offset_width_bottom + link_value / 2)
          ys += scale(node_size_s_height)
          //xt = xt
          yt += scale(delta_t_height_left + t_offset_height_left + link_value / 2)
          if (link.arrow) {
            xt = xt - 10
          }
        }
      }
    }
    return [xs, ys, xt, yt]
  }
  const move_node_and_link = (
    node: SankeyNode,
    node_x: number,
    node_y: number,
    node_x_label: number,
    node_y_label: number,
    node_label_visible: boolean,
    link: SankeyLink,
    link_x: number,
    link_y: number
  ) => {
    d3.select('#ggg_'+ node.idNode)
      .attr('transform', 'translate(' + node_x + ',' + node_y + ')')
    d3.select('#ggg_'+ node.idNode + ' rect')
      .attr('fill-opacity', 0)
    const visible = node_label_visible ? 'visible' : 'hidden'
    d3.select('#ggg_' + node.idNode + ' text')
      .attr('x', node_x_label)
      .attr('y', node_y_label)
      .attr('visibility', visible)
      .selectAll('tspan')
      .attr('x', node_x_label)
    d3.select('#' + link.idLink).attr('d', d => {
      let error_msg
      return drawCurve(
        display_nodes,
        display_links,
        data.display_style,
        data.tags_catalog,
        d as SankeyLink,
        error_msg
      )
    })
    const s = d3.select('#' + link.idLink + '_text')
    s.attr('x', link_x).attr('y', link_y)
  }


  // DRAW LINK   
  const drawCurve = (
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { font_size: number; filter: number; filter_label: number; sector_italic?: boolean; product_italic?: boolean; sector_bold?: boolean; product_bold?: boolean; sector_uppercase?: boolean; product_uppercase?: boolean },
    tags_catalog: TagsCatalog,
    link: SankeyLink,
    error_msg: { text?: string } | undefined
  ): string => {
    if (!link_visible(link)) {
      return ''
    }
    const link_value = test_link_value(nodes, link, tags_catalog)

    const source_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.source_name))[0]
    const target_node = nodes.filter(n => normalize_name(n.name) === normalize_name(link.target_name))[0]

    const inputLinksId = target_node.inputLinksId
    const outputLinksId = source_node.outputLinksId
    if (outputLinksId === undefined || inputLinksId === undefined) {
      return ''
    }

    const [xs, ys, xt, yt] = compute_end_points(source_node, target_node, link, nodes, links, tags_catalog)

    if (link.orientation === 'hh' || link.orientation === 'vv') {
      add_shift_handles(
        link, nodes, links,
        display_style, tags_catalog, xs, ys, xt, yt
      )
    }

    if (link_value > display_style.filter_label ) {
      drawLinkText(link, links, link_value, display_style, xs, ys, xt, yt)
    }

    if (link.orientation === 'vh' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_hv(
        link.source_name, link.target_name,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hv' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_vh(
        link.source_name, link.target_name,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hh' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_vv(
        link.source_name, link.target_name,
        [xs, ys], [xt, yt],
        link.left_horiz_shift, link.right_horiz_shift,
        link.curvature !== undefined ? link.curvature : 0.5,
        false,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'vv' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_vv(
        link.source_name, link.target_name,
        [xs, ys], [xt, yt],
        link.left_horiz_shift, link.right_horiz_shift,
        link.curvature !== undefined ? link.curvature : 0.5,
        true,
        link.curved,
        error_msg
      )
    }
    if (link.recycling) {
      return SankeyShapes.bezier_link_classic_recycling(
        link.source_name, link.target_name,
        link_value,
        [xs, ys], [xt, yt],
        link.left_horiz_shift, link.right_horiz_shift, link.vert_shift,
        link.curved,
        link.orientation === 'vv',
        error_msg, scale
      )
    }
    return ''
  }

  // Returns the x/y position of link_center / left/right/vert_shift
  const handles_positions = (
    links: SankeyLink[],
    link: SankeyLink,
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    // let source_node = nodes.filter(n=> normalize_name(n.name) === normalize_name(link.source_name))[0]
    // let target_node = nodes.filter(n=> normalize_name(n.name) === normalize_name(link.target_name))[0]

    // let [xs,ys,xt,yt] = compute_end_points(source_node,target_node,lid,nodes,links,selected_tags)

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
      const x_left = xt - default_horiz_shift + link.left_horiz_shift - scale(link.value[value_index]) // x14 
      const x_right = xs + default_horiz_shift + link.right_horiz_shift + scale(link.value[value_index]) // x2 
      const y_vert = Math.max(ys, yt) + scale(2 * link.value[value_index]) + link.vert_shift // y8 
      const vert = 'translate(' + (x_left + (x_right - x_left) / 2 - default_handle_size / 2) + ', ' + (y_vert - default_handle_size / 2) + ')'
      const left = 'translate(' + (x_left - default_handle_size / 2) + ' ,' + (yt + (y_vert - yt) / 2 - default_handle_size / 2) + ')'
      const right = 'translate(' + (x_right - default_handle_size / 2) + ' ,' + (ys + (y_vert - ys) / 2 - default_handle_size / 2) + ')'
      return [vert, left, right]
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
      const y_left = yt - default_horiz_shift + link.left_horiz_shift - scale(link.value[value_index]) // x14 
      const y_right = ys + default_horiz_shift + link.right_horiz_shift + scale(link.value[value_index]) // x2 
      const x_vert = Math.max(xs, xt) + scale(2 * link.value[value_index]) + link.vert_shift // y8 
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

  const swap = (array: string[], x: number, y: number) => {
    const temp = array[x]
    array[x] = array[y]
    array[y] = temp
  }

  const drag_node_text = (
    node: SankeyNode,
    event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const old_x = +d3.select('#'+node.idNode+'_text').attr('x'),
      old_y = +d3.select('#'+node.idNode+'_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select('#'+node.idNode+'_text').attr('x', new_x)
    d3.select('#'+node.idNode+'_text').attr('y', new_y)

    node.x_label = new_x
    node.y_label = new_y
    d3.select('#'+node.idNode+'_text').selectAll('tspan').attr('x', new_x)
  }

  const drag_link_text = (
    link: SankeyLink,
    event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {  
    const old_x = +d3.select('#'+link.idLink+'_text').attr('x'),
      old_y = +d3.select('#'+link.idLink+'_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select('#'+link.idLink+'_text').attr('x', new_x)
    d3.select('#'+link.idLink+'_text').attr('y', new_y)
    link.x_label = new_x
    link.y_label = new_y
    link.label_position = 'frozen'
  }

  const add_nodes = (
    static_sankey: boolean,
    remove_previous_nodes = false
  ) => {
    const { display_style } = data
    if (remove_previous_nodes) {
      d3.selectAll('.gg_nodes').remove()
    }
    const gg_nodes = d3.select('#g_nodes').selectAll('.gg_nodes').data(display_nodes).enter().append('g')
      .attr('id', d => {
        return 'gg_' + d.idNode
      })
      .attr('class', 'gg_nodes')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      // Cela permettra de mieux gérer des zooms sur les éléments visibles
      .style('display', (d) => {
        let display: string
        if (d.visible) { display = 'inline' } else { display = 'none' }
        return display
      })

    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => {
        return 'translate(' + d.x + ', ' + d.y + ')'
      })

    if (!static_sankey) {
      // Gestion du drag 
      ggg_nodes.call(d3.drag<SVGGElement, SankeyNode>()
        .subject(Object).on('drag', function (event) {
          drag_node(
            display_nodes, display_links,
            display_style,
            data.tags_catalog,
            this, event
          )
          localStorage.setItem('data', JSON.stringify(data))
        })
      )
      // Gestion du click  
      ggg_nodes.on('click', (event, d) => {
        /* sankeyTooltip.style('opacity', 0) // Fermeture de la tooltip au click
        select_node(d.id)
        deselect_nodes_and_links()
        const node_to_select = '#ggg_node' + node_idx + ' rect'
        d3.select(node_to_select).attr('class', 'selected_node')
        return */
        if (event.ctrlKey) {
          // set_selected_node(nodes.filter(f => { return f.name == event.target.value })[0].id)
          sankeyTooltip.style('opacity', 0)
          select_node(d)
          set_nav_item_active('2')
          set_show_nav(true)
        }       
      })
      ggg_nodes.on('dblclick', (ev,n) => {
        if (ev.altKey) {
          desagregation(n,data)
        } else {
          agregation(n,data)          
        }
        set_data({...data})
      }) 
    }
    // Gestion du contextMenu 
    ggg_nodes.on('contextmenu', (event, node) => {
      event.preventDefault()
      sankeyTooltip.style('opacity', 0)
      nodeContextMenu(node)
    })

    // Gestion du shape (rect ou cicle)
    // A reprendre
    ggg_nodes
      .filter(d => d.type === 'sector')
      .append('rect')
      .attr('class', 'node')
      .attr('width', default_node_size)
      .attr('height', default_node_size)

    ggg_nodes
      .filter(d => d.type === 'product')
      .append('ellipse')
      .attr('class', 'node')
      .attr('stroke-opacity', 0)
      .attr('cx', default_node_size / 2)
      .attr('cy', default_node_size / 2)
      .attr('rx', default_node_size / 2)
      .attr('ry', default_node_size / 2)
      .attr('height', default_node_size)
      .attr('width', default_node_size)


    d3.selectAll('.node')
      .attr('id', d => (d as SankeyNode).idNode)
      .attr('visibility', d => node_visible(d))
      .attr('fill', d => node_color(d))
      //.attr('fill-opacity', d => (d as SankeyNode).visible ? 0.9 : 0)
      .attr('stroke', 'black')
      .attr('stroke-width', '0')
      // Gestion de la tooltip
      .on('mouseover', function (event, d) {
        if (node_label_visible(d) && event.shiftKey ) {
          d3.select(this).attr('class', 'selected_node')
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode,getValueIndex))
        }
      })
      .on('mousemove', function (event, d) {
        if (node_label_visible(d) && event.shiftKey) {
          sankeyTooltip
            .style('top', (event.layerY - 10) + 'px')
            .style('left', (event.layerX + 10) + 'px')
        }
      })
      .on('mouseout', function (event, d) {
        if (node_label_visible(d)) {
          d3.select(this).attr('class', 'node')
          sankeyTooltip.style('opacity', 0)
        }
      })

    ggg_nodes
      .filter(n => node_arrow_visible(n))
      .each(function (n) {
        const selection = (d3.select(this) as unknown) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
        drawArrows(n, display_nodes, display_links, display_style, data.tags_catalog, selection)
      })


    // Gestion des nodes label
    // A reprendre peut-être avec des foreignObjects
    const select = ggg_nodes
      .append('text')
      .attr('id', (d) => 'text_' + d.idNode)
      .attr('x', d => d.x_label ? d.x_label : 0)
      .attr('y', d => d.y_label ? d.y_label : -6)
      .attr('visibility', n => node_label_visible(n))
      .attr('style', d => {
        const font = d.type === 'product' ? 'Arial' : 'Calibri'
        const font_style =
          d.type === 'sector' && display_style.sector_italic ||
            d.type === 'product' && display_style.product_italic
            ? 'italic' : 'normal'
        const font_weight =
          d.type === 'sector' && display_style.sector_bold ||
            d.type === 'product' && display_style.product_bold
            ? 'bold' : 'normal'
        return 'font-family:' + font + ';font-size:' + display_style.font_size + 'px;font-style: ' + font_style + ';font-weight: ' + font_weight + ';'
      })
      .each(d => {
        const node_idx = display_nodes.indexOf(d)
        if (d.name.indexOf('\\n') === -1) {
          if (d.type === 'sector' && display_style.sector_uppercase ||
            d.type === 'product' && display_style.product_uppercase
          ) {
            // d3.select('#ggg_node' + d.id + ' text').append('tspan').text(d.name.toUpperCase())
            d3.select('#ggg_' + d.idNode + ' text').append('tspan').text(d.name.split(' - ')[0].toUpperCase())

          } else {
            // d3.select('#ggg_node' + d.id + ' text').append('tspan').text(d.name)
            d3.select('#ggg_' + d.idNode + ' text').append('tspan').text(d.name.split(' - ')[0])
          }
        } else {
          const text_anchor = 'middle'
          const name_lines = d.name.split('\\n')
          // if (d.type ==='sector') {
          //   name_lines = dname.split('<BR>')
          // }
          // const x = +d3.select('#ggg_node' + d.id + ' text').attr('x')
          const x = +d3.select('#ggg_' + d.idNode + ' text').attr('x')

          //y = +d3.select('#ggg_node' + d.id + ' text').attr('y'),
          const line_break = 15
          name_lines.forEach((line, i) => {
            if (d.type === 'sector' && display_style.sector_uppercase ||
              d.type === 'product' && display_style.product_uppercase
            ) {
              line = line.toUpperCase()
            }
            if (i === 0) {
              if (d.type === 'sector') {
                // d3.select('#ggg_node' + d.id + ' text')
                d3.select('#ggg_' + d.idNode + ' text')

                  .append('tspan')
                  //.attr('dy',(d.name.includes('(I') || isExport(d)) ? -15 : 0) // TODO
                  .attr('text-anchor', text_anchor)
                  .text(line)
              } else {
                // d3.select('#ggg_node' + d.id + ' text')
                d3.select('#ggg_' + d.idNode + ' text')

                  .append('tspan')
                  .attr('text-anchor', text_anchor)
                  .text(line)
              }
            } else {
              if (d.type === 'sector') {
                // d3.select('#ggg_node' + d.id + ' text')
                d3.select('#ggg_' + d.idNode + ' text')

                  .append('tspan')
                  .attr('x', x)
                  .attr('dy', line_break)
                  .attr('text-anchor', text_anchor)
                  .text(line)
              } else {
                // d3.select('#ggg_node' + d.id + ' text')
                d3.select('#ggg_' + d.idNode + ' text')

                  .append('tspan')
                  .attr('x', x)
                  .attr('dy', line_break)
                  .attr('text-anchor', text_anchor)
                  .text(line)
              }
            }
          })
        }
        return
      })
      .on('mouseover', function (event, d) {
        if (node_label_visible(d) && event.shiftKey) {
          d3.select(this).attr('class', 'selected_node')
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode,getValueIndex))
        }
      })
      .on('mousemove', function (event, d) {
        if (node_label_visible(d) && event.shiftKey ) {
          sankeyTooltip
            .style('top', (event.layerY - 10) + 'px')
            .style('left', (event.layerX + 10) + 'px')
        }
      })
      .on('mouseout', function (event, d) {
        if (node_label_visible(d)) {
          d3.select(this).attr('class', 'node')
          sankeyTooltip.style('opacity', 0)
        }
      })
    if (!static_sankey) {
      select.on('click', (event, d) => {
        const node_idx = display_nodes.indexOf(d)
        select_node(node_idx)
        deselect_nodes_and_links()
        // const node_to_select = '#ggg_node' + d.id + ' rect'
        const node_to_select = '#ggg_' + d.idNode + ' rect'

        d3.select(node_to_select).attr('class', 'selected_node')
        return
      })
        .call(d3.drag<SVGTextElement, SankeyNode>()
          .subject(Object).on('drag', function (event,node) {
            if (alt_key_pressed === true) {
              drag_node_text(node, event)
            }
            else {
              const node_to_drag = 'ggg_node' + d3.select(this).attr('id').substring(4, 6)
              const el = document.getElementById(node_to_drag)
              if (el) {
                drag_node(
                  display_nodes, display_links,
                  display_style,
                  data.tags_catalog,
                  el,
                  event
                )
              }
            }
          })
        )
    }
  }

  const drawArrows = (
    n: SankeyNode,
    nodes: SankeyNode[],
    links: SankeyLink[],
    display_style: { font_size: number; filter?: number; filter_label?: number; sector_italic?: boolean; product_italic?: boolean; sector_bold?: boolean; product_bold?: boolean; sector_uppercase?: boolean; product_uppercase?: boolean },
    tags_catalog: TagsCatalog,
    selection: d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
  ) => {
    let cum_v_left = 0
    let cum_h_top = 0
    let cum_v_right = 0
    let cum_h_bottom = 0
    let is_v = true

    const tmp = selection.selectAll('path')
    tmp.remove()

    const res = compute_total_offsets(n, nodes, links, tags_catalog, test_link_value)
    const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

    for (let i = 0; i < n.inputLinksId.length; i++) {
      const l = links[links.findIndex(l=>l.idLink===n.inputLinksId[i])]
      if (!l.visible) {
        continue
      }
      const link_value = test_link_value(nodes, l, tags_catalog)
      if (link_value === undefined) {
        continue
      }
      const source_node = nodes.filter(the_node => normalize_name(the_node.name) === normalize_name(l.source_name))[0]
      if (l.orientation === 'hh' || l.orientation === 'vh') {
        is_v = true
      } else {
        is_v = false
      }
      if (!display_style.filter || link_value >= display_style.filter) {
        selection
          .append('path')
          .attr('d', () => {
            setNodeHeight(n, nodes, links, tags_catalog)
            let xt
            let yt
            let p5
            if (l.orientation === 'hh' || l.orientation === 'vh') {
              if (n.x <= source_node.x && l.recycling || n.x > source_node.x && !l.recycling) {
                xt = +n.x
                yt = +n.y + +d3.select('#' + n.idNode).attr('height') / 2
                p5 = [xt, yt]
                is_v = true
                return SankeyShapes.draw_arrow(scale(total_height_left) / 2, p5, scale(link_value), scale(cum_v_left), true, false)
              } else {
                xt = +n.x + +d3.select('#' + n.idNode).attr('width')
                yt = +n.y + +d3.select('#' + n.idNode).attr('height') / 2
                p5 = [xt, yt]
                is_v = true
                return SankeyShapes.draw_arrow(scale(total_height_right) / 2, p5, scale(link_value), scale(cum_v_right), true, true)
              }
            } else if (l.orientation === 'vv' || l.orientation === 'hv') {
              if (n.y > source_node.y) {
                xt = +n.x + +d3.select('#' + n.idNode).attr('width') / 2
                yt = +n.y
                p5 = [xt, yt]
                is_v = false
                return SankeyShapes.draw_arrow(scale(total_width_top) / 2, p5, scale(link_value), scale(cum_h_top), false, false)
              } else {
                xt = +n.x + +d3.select('#' + n.idNode).attr('width') / 2
                yt = +n.y + +d3.select('#' + n.idNode).attr('height')
                p5 = [xt, yt]
                is_v = false
                return SankeyShapes.draw_arrow(scale(total_width_bottom) / 2, p5, scale(link_value), scale(cum_h_bottom), false, true)
              }
            }
            return ''
          })
          .attr('transform', () => 'translate(' + -(n.x) + ', ' + -(n.y) + ')')
          .attr('fill', () => link_color(l,value_index))
          .attr('fill-opacity', () => {
            const opacity = String(l.display_value[value_index]).includes('[') ? 0.3 : 0.95
            return opacity
          })
      }
      if (is_v && n.x > source_node.x) {
        cum_v_left += link_value
      } else if (is_v && n.x < source_node.x) {
        cum_v_right += link_value
      } else if (!is_v && n.y > source_node.y) {
        cum_h_top += link_value
      } else if (!is_v && n.y < source_node.y) {
        cum_h_bottom += link_value
      }
    }
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

  useEffect(() => {

    const svgSankey = (d3.select('#svg') as any)
    svgSankey
      .attr('viewBox', [0, 0, data.width, data.height])
      .attr('cursor', 'grab')
      .call(d3.zoom()
        .filter(function filter(event) { // Permet d'obliger Crtl pour activer le zoom
          return event.ctrlKey
        })
        .wheelDelta(function wheelDelta(event) { // Permet de regler la vitesse du zoom
          return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
        })
        .on('zoom', function (transform) {
          d3.selectAll('svg > *') // permet de sélectionner l'ensemble des éléments de la balise svg
            .attr('transform', transform.transform)
          d3.selectAll('text')
            .style('font-size', (data.display_style.font_size / transform.transform.k) + 'px') // Permet de maintenir une taille de police constante
          // A voir si il ne faut pas la réduire quand le zomm est <1
        })
      )

    update_scale(data.user_scale)

    add_nodes(false, true)
    add_links(false, true)
    const gg_nodes = d3.select('#g_nodes').selectAll('.gg_nodes') as d3.Selection<SVGGElement, SankeyNode & SankeyLink, SVGGElement, SankeyNode & SankeyLink>
    gg_nodes.attr('cursor', 'zoom-in')
    const gg_links = d3.select('#g_links').selectAll('.gg_links') as d3.Selection<SVGGElement, SankeyNode & SankeyLink, SVGGElement, SankeyNode & SankeyLink>
    gg_links.attr('cursor', 'zoom-in')

    more_processing(scale, move_node_and_link)
    localStorage.setItem('data', JSON.stringify(data))
  })

  return (
    <div className="span12" style={{ 'color': 'black', 'backgroundColor': 'WhiteSmoke', 'marginLeft': '10px' }} id="visualization_div" >
      <svg height={data.height} width='100%' id='svg' >
        <g className='g_nodes' id='g_nodes' ></g>
        <g className='g_links' id='g_links' ></g>
      </svg>
    </div>
  )
}

SankeyDraw.propTypes = SankeyDrawPropTypes

export default SankeyDraw
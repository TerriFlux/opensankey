import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { SankeyNode, SankeyLink, SankeyDataPropTypes, TagsCatalog, SankeyData } from './types'
import PropTypes, { InferProps } from 'prop-types'
import * as SankeyShapes from './SankeyShapes'
import { compute_total_offsets, default_sankey_data, getLinkValue, setSelectedTags, toPrecision } from './SankeyUtils'
import { desagregation, agregation, AgregationModal } from './SankeyLayout'

window.d3 = d3

const SankeyDrawPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  select_node: PropTypes.func.isRequired,
  node_color: PropTypes.func.isRequired,
  node_arrow_visible: PropTypes.func.isRequired,

  select_link: PropTypes.func.isRequired,
  link_color: PropTypes.func.isRequired,
  link_text: PropTypes.func.isRequired,
  link_visible: PropTypes.func.isRequired,
  test_link_value: PropTypes.func.isRequired,

  set_show_nav: PropTypes.func.isRequired,
  set_nav_item_active: PropTypes.func.isRequired,

  nodeTooltipsContent: PropTypes.func.isRequired,
  linkTooltipsContent: PropTypes.func.isRequired
}

export const SankeyDrawDefaultProps = {
  //data: default_sankey_data(),
  set_data: () => null,
  select_node: () => null,
  node_color: (n: SankeyNode) => n.color,
  node_arrow_visible: (n: SankeyNode) => true,

  select_link: () => null,
  link_color: (l: SankeyLink) => l.color,
  //link_text: (l:SankeyLink) => getLinkValue(data,l).value,
  link_visible: (l: SankeyLink) => true,
  //test_link_value: (nodes: { [node_id: string]: SankeyNode }, l: SankeyLink) => getLinkValue(data,l).value,

  set_show_nav: () => null,
  set_nav_item_active: () => null,

  nodeTooltipsContent: () => null,
  linkTooltipsContent: () => null
}

type SankeyDrawTypes = InferProps<typeof SankeyDrawPropTypes>

const SankeyDraw: FunctionComponent<SankeyDrawTypes> = ({
  data,
  link_text,
  test_link_value,
  set_data = SankeyDrawDefaultProps.set_data,
  select_node = SankeyDrawDefaultProps.select_node,
  node_color = SankeyDrawDefaultProps.node_color,
  node_arrow_visible = SankeyDrawDefaultProps.node_arrow_visible,
  select_link = SankeyDrawDefaultProps.select_link,
  link_color = SankeyDrawDefaultProps.link_color,
  link_visible = SankeyDrawDefaultProps.link_visible,
  set_show_nav = SankeyDrawDefaultProps.set_show_nav,
  set_nav_item_active = SankeyDrawDefaultProps.set_nav_item_active,
  nodeTooltipsContent = SankeyDrawDefaultProps.nodeTooltipsContent,
  linkTooltipsContent = SankeyDrawDefaultProps.linkTooltipsContent,
}) => {
  const [show_agregation, set_show_agregation] = useState(false)
  const [agregation_parent_names, set_agregation_parent_names] = useState<string[]>([])
  const [agregation_dimension_names, set_agregation_dimension_names] = useState<string[]>([])
  const [is_agregation, set_is_agregation] = useState(true)

  const default_node_size = data.node_width
  const default_handle_size = 10
  const default_horiz_shift = 50
  const min_thickness = 1

  const display_nodes = data.nodes
  const display_links = data.links

  const handles_visible = [...(new Array(Object.keys(display_links).length).fill(false))]

  const sankeyTooltip = d3.select('body')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '3px')
    .style('border-radius', '5px')
    .style('padding', '5px')
    .style('max-width', '50%')
    .style('font-size', '12px')
    .style('z-index', 100)
    .style('position', 'absolute')
    .style('pointer-events', 'none')

  let alt_key_pressed = false

  setSelectedTags(data)

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
      .data(Object.values(display_links))
      .enter()
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')

    const paths = gg_links.append('path')

    if (!static_sankey) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(d3.drag<SVGPathElement, SankeyLink>()
        .subject(Object)
        .on('drag', function (event) {
          drag_link(display_nodes, display_links, display_style, data.tags_catalog, this, event)
          Object.values(display_links).forEach(
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
      // paths.on('contextmenu', (event, l) => {
      //   event.preventDefault()
      //   sankeyTooltip.style('opacity', 0)
      //   sankeyTooltip.style('opacity', 0)
      //   linkContextMenu(l)
      // })
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
      .attr('fill', l => {
        if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
          return 'white'
        }
        return l.text_color
      })
      //.attr('visibility', d => link_visible(d))
      .attr('dy', l => {
        if (l.orthogonal_label_position === 'middle') {
          return '0.3em'
        } else if (l.orthogonal_label_position === 'below') {
          return scale(getLinkValue(data, l.idLink).value) / 2 + 10 + 'px'
        } else if (l.orthogonal_label_position === 'above') {
          return -scale(getLinkValue(data, l.idLink).value) / 2 + 'px'
        }
        return '0.3em'
      })
      .append('textPath')
      .attr('id', d => d.idLink + '_text')
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
      .attr('id', d => d.idLink + '_text')
      .attr('class', 'link_value')
      .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + display_style.font_size + 'px;')
      .attr('fill', l => {
        if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
          return 'white'
        }
        return l.text_color
      })
      .attr('visibility', d => link_visible(d) && getLinkValue(data, d.idLink).value >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden')

    if (!static_sankey) {
      // A voir avec Julien
      select2.call(d3.drag<SVGTextElement, SankeyLink>()
        .subject(Object).on('drag', function (event, link) {
          if (alt_key_pressed) {
            drag_link_text(link, event)
          }
        })
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
      select2.call(d3.drag<SVGTextElement, SankeyLink>()
        .subject(Object).on('drag', function (event, link) {
          if (alt_key_pressed) {
            drag_link_text(link, event)
          } else {
            const text_id = d3.select(this).attr('id')
            const link_to_drag = text_id.substring(text_id.length - 5)
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
      .attr('stroke-opacity', d => data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && getLinkValue(data, d.idLink).value >= display_style.filter ? (!((data as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data, d.idLink).display_value).includes('[')) ? 0.85 : 0.85) : 0)
      .attr('stroke-width', d => {
        const link_value = test_link_value(display_nodes, d, data.tags_catalog)
        return scale(Math.max(inv_scale(min_thickness), link_value ? link_value : 0))
      })
      //.attr('stroke',d => d.unbounded ? 'darkred' : d.color)
      .attr('stroke', l => link_color(l))
      .on('mouseover', function (event, d) {
        if (!static_sankey && !event.shiftKey) {
          return
        }
        sankeyTooltip
          .style('opacity', 1)
          .html(linkTooltipsContent(data, d))
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && getLinkValue(data, d.idLink).value >= display_style.filter) {
          return d3.select(this).attr('stroke-opacity', '0.5')
        }
      })
      .on('mousemove', (event) => {
        if (!static_sankey && !event.shiftKey) {
          return
        }
        sankeyTooltip
          .style('top', (event.layerY - 10) + 'px')
          .style('left', (event.layerX + 10) + 'px')
      })
      .on('mouseout', function (event, d) {
        sankeyTooltip.style('opacity', 0)
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && getLinkValue(data, d.idLink).value >= display_style.filter) {
          const opacity = String(getLinkValue(data, d.idLink).display_value).includes('[') ? 0.85 : 0.85
          return d3.select(this).attr('stroke-opacity', opacity)
        }
      })
    let firing = false
    const singleClick = (link: SankeyLink) => {
      select_link(link)
    }
    const doubleClick = (link: SankeyLink) => {
      const id = Object.values(display_links).indexOf(link)
      handles_visible[id] = !handles_visible[id]
      let shift_handles
      if (Object.values(display_links)[id].recycling) {
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

    //Creation des Arrows associés au link
    d3.selectAll('.ggg_nodes')
      .filter(n => node_arrow_visible(n))
      .each(function (n) {
        const selection = (d3.select(this) as unknown) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
        drawArrows(n as SankeyNode, display_nodes, display_links, display_style, data.tags_catalog, selection)
      })

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
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { sector_italic?: boolean; product_italic?: boolean; sector_bold?: boolean; product_bold?: boolean; font_size: number; sector_uppercase?: boolean; product_uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },
    tags_catalog: TagsCatalog,
    dragged: Element,
    event: { dx: number; dy: number }
  ) => {
    const { width } = data

    //- ggg_node5 -> node5
    const idNode = dragged.id.substring(4)
    const node = nodes[idNode]

    removeAnimate()

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
    Object.values(links).forEach(
      link => {
        if (link.idSource === node.idNode || link.idTarget === node.idNode) {
          // Redraw link
          const old_x_pos = +d3.select('#' + link.idLink + '_text').attr('x')
          const old_y_pos = +d3.select('#' + link.idLink + '_text').attr('y')
          if (!(link.label_position === 'frozen')) {
            d3.select('#' + link.idLink + '_text').attr('x', old_x_pos + 1 / 2 * (new_x - old_x))
            d3.select('#' + link.idLink + '_text').attr('y', old_y_pos + 1 / 2 * (new_y - old_y))
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
          const target_node = nodes[link.idTarget]
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
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { font_size: number; filter: number; filter_label: number },
    tags_catalog: TagsCatalog,
    dragged: SVGPathElement | null,
    event: d3.D3DragEvent<Element, SankeyLink, unknown>
  ) => {
    const idLink = d3.select(dragged).attr('id')
    const p2 = d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))
    const linked_node = identify_node(nodes, links, links[idLink], p2)
    if (linked_node === undefined) {
      return
    }
    const node = nodes[linked_node.node_id]

    if (linked_node.type === 'source') {
      const source_order = node.outputLinksId.indexOf(idLink)
      let output_offset = 0
      for (let i = 1; i < node.outputLinksId.length; i++) {
        const link = links[node.outputLinksId[i - 1]]
        if (i > source_order) {
          break
        }
        output_offset += getLinkValue(data, link.idLink).value
      }
      const number_of_links = node.outputLinksId.length
      const value = getLinkValue(data, idLink).value
      if (links[idLink].orientation === 'hh') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + value)) {
          swap(node.outputLinksId, source_order, source_order + 1)
        }
        if (source_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
          swap(node.outputLinksId, source_order, source_order - 1)
        }
      } else if (links[idLink].orientation === 'vv') {
        if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(output_offset + value)) {
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
        if (i > target_order) {
          break
        }
        input_offset += getLinkValue(data, node.inputLinksId[i - 1]).value
      }
      const number_of_links = node.inputLinksId.length
      const value = getLinkValue(data, idLink).value
      if (links[idLink].orientation === 'hh') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + value)) {
          swap(node.inputLinksId, target_order, target_order + 1)
        }
        if (target_order > 0 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
          swap(node.inputLinksId, target_order, target_order - 1)
        }
      } else if (links[idLink].orientation === 'vv') {
        if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select('#g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + value)) {
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
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { font_size: number; filter: number; filter_label: number },
    selected_tags: { [tag_group: string]: string[] },
    dragged: Element,
    handle_type: string,
    the_event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const { width } = data

    const old_x = +d3.select(dragged).attr('transform').split(',')[0].substring(10)
    const old_y_str = d3.select(dragged).attr('transform').split(',')[1]
    const old_y = +old_y_str.substring(0, old_y_str.length - 1)
    const new_x = old_x + the_event.dx
    const new_y = old_y + the_event.dy
    const d: SankeyLink = d3.select(dragged).data()[0] as SankeyLink
    let u_center_new = -1
    const source_node = nodes[d.idSource]
    const target_node = nodes[d.idTarget]

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
      //if (d.vert_shift + event.dy > -0.5 * scale(getLinkValue(data,d.idLink)) && new_y < height - scale(getLinkValue(data,d.idLink))/2) {
      if (new_y < height - scale(getLinkValue(data, d.idLink).value) / 2) {
        d.vert_shift += the_event.dy
      } else {
        return
      }
    } else if (handle_type === 'left') {
      if (d.left_horiz_shift + the_event.dx < default_horiz_shift && new_x > scale(getLinkValue(data, d.idLink).value) / 2) {
        d.left_horiz_shift += the_event.dx
      } else {
        return
      }
    } else if (handle_type === 'right') {
      if (d.right_horiz_shift + the_event.dx > -default_horiz_shift && new_x < width - scale(getLinkValue(data, d.idLink).value) / 2) {
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
        data.tags_catalog, d, error_msg
      )
    })
  }

  // Identify the node that is the closest from mouse click (either source or target).
  const identify_node = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    link: SankeyLink,
    mouse_coord: number[]
  ) => {
    const source_node = nodes[link.idSource]
    const target_node = nodes[link.idTarget]

    const source_x_min = source_node.x
    const source_x_max = source_x_min + parseInt(d3.select('#' + source_node.idNode).attr('width'))
    const source_y_min = source_node.y
    const source_y_max = source_y_min + parseInt(d3.select('#' + source_node.idNode).attr('height'))
    const target_x_min = target_node.x
    const target_x_max = target_x_min + parseInt(d3.select('#' + target_node.idNode).attr('width'))
    const target_y_min = target_node.y
    const target_y_max = target_y_min + parseInt(d3.select('#' + target_node.idNode).attr('height'))
    const tolerance = 3 * default_node_size

    if ((link.orientation === 'hh' || link.orientation === 'hv') && mouse_coord[1] >= source_y_min && mouse_coord[1] <= source_y_max && (mouse_coord[0] <= source_x_max + tolerance)) {
      return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_y_min }
    }
    if ((link.orientation === 'hh' || link.orientation === 'hv') && mouse_coord[1] >= target_y_min && mouse_coord[1] <= target_y_max && (mouse_coord[0] >= target_x_min - tolerance)) {
      return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_y_min }
    }
    if ((link.orientation === 'vv' || link.orientation === 'vh') && mouse_coord[0] >= source_x_min && mouse_coord[0] <= source_x_max && (mouse_coord[1] <= source_y_max + tolerance)) {
      return { 'node_id': source_node.idNode, 'type': 'source', 'origin': source_x_min }
    }
    if ((link.orientation === 'vv' || link.orientation === 'vh') && mouse_coord[0] >= target_x_min && mouse_coord[0] <= target_x_max && (mouse_coord[1] >= target_y_min - tolerance)) {
      return { 'node_id': target_node.idNode, 'type': 'target', 'origin': target_x_min }
    }
  }

  const add_shift_handle = (
    link: SankeyLink,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
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
        d3.select(this).attr('cursor', 'grab')
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
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
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
    data: SankeyData,
    link: SankeyLink,
    links: { [link_id: string]: SankeyLink },
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
        .attr('x', () => link.label_position === 'frozen' && link.x_label ? link.x_label : x_pos)
        .attr('y', () => link.label_position === 'frozen' && link.y_label ? link.y_label + default_handle_size : y_pos + default_handle_size)
        .text(d => link_text(data, d, link_value, display_style))
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
        .text(d => link_text(data, d, link_value, display_style))
        .attr('visibility', link.label_visible ? 'visible' : 'hidden')
    }
  }

  const setNodeHeight = (
    n: SankeyNode,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    selected_tags: TagsCatalog
  ) => {
    const res = compute_total_offsets(n, nodes, links, selected_tags, test_link_value)

    const [total_offset_height_left, total_offset_height_right, total_offset_width_top, total_offset_width_bottom] = res
    let node_size_s_height = Math.max(
      inv_scale(3), total_offset_height_left, total_offset_height_right
    )
    let node_size_s_width = Math.max(
      inv_scale(default_node_size), total_offset_width_top, total_offset_width_bottom
    )
    //Hauteur des noeuds
    if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0) {
      // Hauteur des noeuds
      node_size_s_height = Math.max(
        inv_scale(40), total_offset_height_left, total_offset_height_right
      )
      node_size_s_width = Math.max(
        inv_scale(40), total_offset_width_top, total_offset_width_bottom
      )
    }

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
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    d: SankeyLink,
    tags_catalog: TagsCatalog
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

    let res = compute_total_offsets(source_node, nodes, links, tags_catalog, test_link_value)
    const [s_total_offset_height_left, s_total_offset_height_right, s_total_offset_width_top, s_total_offset_width_bottom] = res
    res = compute_total_offsets(target_node, nodes, links, tags_catalog, test_link_value)
    const [t_total_offset_height_left, t_total_offset_height_right, t_total_offset_width_top, t_total_offset_width_bottom] = res

    let node_size_s_height = Math.max(
      inv_scale(3), s_total_offset_height_left, s_total_offset_height_right
    )
    let node_size_t_height = Math.max(
      inv_scale(3), t_total_offset_height_left, t_total_offset_height_right
    )
    // Hauteur des noeuds
    if (res === [0, 0, 0, 0]) {
      node_size_s_height = Math.max(
        inv_scale(40), s_total_offset_height_left, s_total_offset_height_right
      )
      node_size_t_height = Math.max(
        inv_scale(40), t_total_offset_height_left, t_total_offset_height_right
      )
    }
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
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
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

    const source_node_x = source_node.position === 'absolute' ? +source_node.x : +target_node.x + +source_node.x - +d3.select('#' + source_node.idNode).attr('width')
    const source_node_y = source_node.position === 'absolute' ? +source_node.y : +target_node.y + +source_node.y
    const target_node_x = target_node.position === 'absolute' ? +target_node.x : +source_node.x + +target_node.x + +d3.select('#' + source_node.idNode).attr('width')
    const target_node_y = target_node.position === 'absolute' ? +target_node.y : +source_node.y + +target_node.y + +d3.select('#' + source_node.idNode).attr('height')

    let xs = source_node_x
    let ys = source_node_y
    let xt = target_node_x
    let yt = target_node_y

    if (link.orientation === 'hh') {
      //side to side
      if (source_node_x > target_node_x && !link.recycling || source_node_x < target_node_x && link.recycling) {
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
      if (source_node_y > target_node_y) {
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
      if (source_node_x > target_node_x) {
        if (source_node_y > target_node_y) {
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
        if (source_node_y > target_node_y) {
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
      if (source_node_x > target_node_x) {
        if (source_node_y > target_node_y) {
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
        if (source_node_y > target_node_y) {
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

  // DRAW LINK   
  const drawCurve = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { font_size: number; filter: number; filter_label: number; sector_italic?: boolean; product_italic?: boolean; sector_bold?: boolean; product_bold?: boolean; sector_uppercase?: boolean; product_uppercase?: boolean },
    tags_catalog: TagsCatalog,
    link: SankeyLink,
    error_msg: { text?: string } | undefined
  ): string => {
    if (!link_visible(link)) {
      return ''
    }
    const link_value = test_link_value(nodes, link, tags_catalog)

    const source_node = nodes[link.idSource]
    const target_node = nodes[link.idTarget]

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

    if (link_value > display_style.filter_label) {
      drawLinkText(data, link, links, link_value, display_style, xs, ys, xt, yt)
    }

    if (link.orientation === 'vh' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_hv(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hv' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_vh(
        link.idSource, link.idTarget,
        [xs, ys], [xt, yt],
        link.curvature !== undefined ? link.curvature : 0.5,
        link.curved,
        error_msg
      )
    }
    if (link.orientation === 'hh' && !link.recycling) {
      return SankeyShapes.bezier_link_classic_vv(
        link.idSource, link.idTarget,
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
        link.idSource, link.idTarget,
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
        link.idSource, link.idTarget,
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
    links: { [link_id: string]: SankeyLink },
    link: SankeyLink,
    xs: number,
    ys: number,
    xt: number,
    yt: number
  ) => {
    // let source_node = nodes.filter(n=> n.idNode === link.idSource)[0]
    // let target_node = nodes.filter(n=> n.idNode === link.idTarget)[0]

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
      const x_left = xt - default_horiz_shift + link.left_horiz_shift - scale(getLinkValue(data, link.idLink).value) // x14 
      const x_right = xs + default_horiz_shift + link.right_horiz_shift + scale(getLinkValue(data, link.idLink).value) // x2 
      const y_vert = Math.max(ys, yt) + scale(2 * getLinkValue(data, link.idLink).value) + link.vert_shift // y8 
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
      const y_left = yt - default_horiz_shift + link.left_horiz_shift - scale(getLinkValue(data, link.idLink).value) // x14 
      const y_right = ys + default_horiz_shift + link.right_horiz_shift + scale(getLinkValue(data, link.idLink).value) // x2 
      const x_vert = Math.max(xs, xt) + scale(2 * getLinkValue(data, link.idLink).value) + link.vert_shift // y8 
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
    const old_x = +d3.select('#' + node.idNode + '_text').attr('x'),
      old_y = +d3.select('#' + node.idNode + '_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select('#' + node.idNode + '_text').attr('x', new_x)
    d3.select('#' + node.idNode + '_text').attr('y', new_y)

    node.x_label = new_x
    node.y_label = new_y
    d3.select('#' + node.idNode + '_text').selectAll('tspan').attr('x', new_x)
  }

  const drag_link_text = (
    link: SankeyLink,
    event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const old_x = +d3.select('#' + link.idLink + '_text').attr('x'),
      old_y = +d3.select('#' + link.idLink + '_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select('#' + link.idLink + '_text').attr('x', new_x)
    d3.select('#' + link.idLink + '_text').attr('y', new_y)
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
    const gg_nodes = d3.select('#g_nodes').selectAll('.gg_nodes').data(Object.values(display_nodes)).enter().append('g')
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

    const ggg_nodes = gg_nodes.append('g')
      .attr('id', d => 'ggg_' + d.idNode)
      .attr('class', 'ggg_nodes')
      .attr('transform', d => {
        //   // if (d.position === 'absolute' || !d.node_visible) {
        return 'translate(' + d.x + ', ' + d.y + ')'
        //   // }
        //   // try {
        //   //   setNodeHeight(d,display_nodes,display_links,data.tags_catalog)
        //   //   const other_node = d.inputLinksId.length > 0 ? data.nodes[data.links[d.inputLinksId[0]].idSource] : data.nodes[data.links[d.outputLinksId[0]].idTarget]
        //   //   const x = d.inputLinksId.length > 0 ? other_node.x + d.x - +d3.select('#' + d.idNode).attr('width'): other_node.x + d.x - +d3.select('#' + d.idNode).attr('width')
        //   //   const y = d.inputLinksId.length > 0 ? other_node.y + d.y + +d3.select('#' + other_node.idNode).attr('height'): other_node.y + d.y
        //   //   return 'translate(' + x + ', ' + y + ')'
        //   // } catch (e) {
        //   return 'translate(' + d.x + ', ' + d.y + ')'
        //   // }
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
          try {
            localStorage.setItem('data', JSON.stringify(data))
          } catch (e) {
            localStorage.clear()
          }
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
      ggg_nodes.on('dblclick', (ev, n) => {
        if (!n.dimensions) {
          return
        }
        if (ev.altKey) {
          const child_names: string[] = []
          const dim_names: string[] = []
          Object.values(data.nodes).forEach(n2 => {
            for (const dim in n2.dimensions) {
              if (n2.dimensions[dim].parent_name == n.idNode) {
                if (dim_names.indexOf(dim) === -1) {
                  child_names.push(n2.idNode)
                  dim_names.push(dim)
                }
              }
            }
            return false
          })
          if (child_names.length === 0) {
            return
          }
          if (child_names.length > 1) {
            set_agregation_parent_names(child_names)
            set_agregation_dimension_names(dim_names)
            set_is_agregation(false)
            set_show_agregation(true)
          } else {
            desagregation(data, child_names[0], dim_names[0])
          }
        } else {
          const parent_names: string[] = []
          const dim_names: string[] = []
          Object.keys(n.dimensions).forEach(
            dim => {
              if (n.dimensions[dim].parent_name) {
                parent_names.push(n.dimensions[dim].parent_name as string)
                dim_names.push(dim)
              }
            }
          )
          if (parent_names.length === 0) {
            return
          }
          if (parent_names.length > 1) {
            set_agregation_parent_names(parent_names)
            set_agregation_dimension_names(dim_names)
            set_is_agregation(true)
            set_show_agregation(true)
          } else {
            agregation(data, parent_names[0], dim_names[0])
          }
        }
        set_data({ ...data })
      })
    }
    // Gestion du contextMenu 
    // ggg_nodes.on('contextmenu', (event, node) => {
    //   event.preventDefault()
    //   sankeyTooltip.style('opacity', 0)
    //   nodeContextMenu(node)
    // })

    // Gestion du shape (rect ou cicle)
    // A reprendre
    ggg_nodes
      .filter(d => d.type === 'sector')
      .append('rect')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('width', default_node_size)
      .attr('height', default_node_size)

    ggg_nodes
      .filter(d => d.type === 'product')
      .append('ellipse')
      .classed('node', true)
      .classed('node_shape', true)
      .attr('stroke-opacity', 0)
      .attr('cx', default_node_size / 2)
      .attr('cy', default_node_size / 2)
      .attr('rx', default_node_size / 2)
      .attr('ry', default_node_size / 2)
      .attr('height', default_node_size)
      .attr('width', default_node_size)


    d3.selectAll('.node')
      .attr('id', d => (d as SankeyNode).idNode)
      .attr('visibility', d => (d as SankeyNode).node_visible && (d as SankeyNode).shape_visible ? 'visible' : 'hidden')
      .attr('fill', d => node_color(d))
      //.attr('fill-opacity', d => (d as SankeyNode).visible ? 0.9 : 0)
      .attr('stroke', 'black')
      .attr('stroke-width', '0')
      // Gestion de la tooltip
      .on('mouseover', function (event, d) {
        d3.select(this).attr('cursor', 'grab')
        if ((d as SankeyNode).shape_visible && (event.shiftKey || static_sankey)) {
          //d3.select(this).attr('class', 'selected_node')
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode))
        }
      })
      .on('mousemove', function (event, d) {
        if ((d as SankeyNode).shape_visible && (event.shiftKey || static_sankey)) {
          sankeyTooltip

            .style('top', (event.layerY - 10) + 'px')
            .style('left', (event.layerX + 10) + 'px')
        }
      })
      .on('mouseout', function (event, d) {
        if ((d as SankeyNode).shape_visible) {
          //d3.select(this).attr('class', 'node')
          sankeyTooltip.style('opacity', 0)
        }
      })
      .on('click', (event, d) => {

        if (event.shiftKey) {
          // Animation des flux du Sankey
          sankeyTooltip.style('opacity', 0)
          d3.selectAll('#svg .tmp').remove()
          // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey       
          d3.select('#svg').selectAll('.arrow').style('fill', '#dddddd')
          d3.select('#svg').selectAll('.link').style('stroke', '#dddddd')
          d3.select('#svg').selectAll('.node').style('fill', '#dddddd')
          d3.select('#svg').selectAll('.link_value').style('display', 'none')
          const nodeDisplay = [(d as SankeyNode).idNode]
          branchAnimate(data.nodes, (d as SankeyNode), nodeDisplay)
        }
      })

    // Creation des Arrows 
    // -> deplacer dans le add_link 
    // ggg_nodes
    //   .filter(n => node_arrow_visible(n))
    //   .each(function (n) {
    //     const selection = (d3.select(this) as unknown) as d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
    //     drawArrows(n, display_nodes, display_links, display_style, data.tags_catalog, selection)
    //   })


    // Gestion des nodes label
    // A reprendre peut-être avec des foreignObjects
    const select = ggg_nodes
      .append('text')
      .classed('node', true)
      .classed('node_text', true)
      .attr('id', n => n.idNode + '_text')
      .attr('x', n => n.x_label ? n.x_label : 0)
      .attr('y', n => {
        if (n.y_label) {
          return n.y_label
        }
        setNodeHeight(n, display_nodes, display_links, data.tags_catalog)
        const height = +d3.select('#' + n.idNode).attr('height')
        return height + 13
      })
      .attr('text-anchor', 'center')
      .attr('visibility', n => n.node_visible && n.label_visible ? 'visible' : 'hidden')
      .style('text-align', 'center')
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
      .text(d => {
        let total = 0
        if (d.show_value) {
          if (d.outputLinksId.length > 0) {
            for (let i = 0; i < d.outputLinksId.length; i++) {
              const link = display_links[d.outputLinksId[i]]
              if (link === undefined) {
                //alert('Corruption du diagramme')
                return ''
              }
              if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
                total += getLinkValue(data, link.idLink).value
              }
            }
          }
          if (total === 0) {
            if (d.inputLinksId.length > 0) {
              for (let i = 0; i < d.inputLinksId.length; i++) {
                const link = display_links[d.inputLinksId[i]]
                if (link === undefined) {
                  //alert('Corruption du diagramme')
                  return ''
                }
                if (display_nodes[link.idSource].node_visible && display_nodes[link.idTarget].node_visible) {
                  total += getLinkValue(data, link.idLink).value
                }
              }
            }
          }
        }
        if (d.type === 'sector' && display_style.sector_uppercase ||
          d.type === 'product' && display_style.product_uppercase
        ) {
          if (d.show_value) {
            return d.name.split(' - ')[0].replace('-', ' ').replace('Transformation', 'Transfo').toUpperCase() + ' : ' + toPrecision(total) + ((data as unknown) as { [key: string]: string[] }).units_names[0]
          } else {
            return d.name.split(' - ')[0].replace('-', ' ').replace('Transformation', 'Transfo').toUpperCase()
          }
        } else {
          if (d.show_value) {
            return d.name.split(' - ')[0].replace('-', ' ').replace('Transformation', 'Transfo') + ' : ' + toPrecision(total) + ((data as unknown) as { [key: string]: string[] }).units_names[0]
          } else {
            return d.name.split(' - ')[0].replace('-', ' ').replace('Transformation', 'Transfo')
          }
        }
      })
      .each(d => {
        let width = 110
        if (d.name.split(' - ').length === 3) {
          width = 250
        }
        const wrap = textwrap()
          .bounds({ height: 100, width: width })
          .method('tspans')
        d3.select('#ggg_' + d.idNode + ' text')
          .call(wrap)
      })
      .on('mouseover', function (event, d) {
        d3.select(this).attr('cursor', 'grab')
        if (d.label_visible && (static_sankey || event.shiftKey)) {
          //d3.select(this).attr('class', 'selected_node')
          sankeyTooltip
            .style('opacity', 1)
            .html(nodeTooltipsContent(data, d as SankeyNode))
        }
      })
      .on('mousemove', function (event, d) {
        if (d.label_visible && (static_sankey || event.shiftKey)) {
          sankeyTooltip
            .style('top', (event.layerY - 10) + 'px')
            .style('left', (event.layerX + 10) + 'px')
        }
      })
      .on('mouseout', function (event, d) {
        if (d.label_visible) {
          //d3.select(this).attr('class', 'node')
          sankeyTooltip.style('opacity', 0)
        }
      })
    if (!static_sankey) {
      select.on('click', (event, n) => {
        select_node(n)
        deselect_nodes_and_links()
        d3.select('#ggg_' + n.idNode + ' rect').attr('class', 'selected_node')
        return
      })
        .call(d3.drag<SVGTextElement, SankeyNode>()
          .subject(Object).on('drag', function (event, node) {
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

  const branchAnimate = (
    nodes: { [node_id: string]: SankeyNode },
    nodeData: SankeyNode,
    nodeDisplay: string[]
  ) => {
    // Permet la progation de l'animation sur l'ensemble du Sankey
    const nodeStart = nodeData.idNode
    //console.log('Click on gg.node ' + nodeStart)
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
        const arrowInitColor = d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow').attr('fill')
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow')
          .style('fill', arrowInitColor)
        // reaffichage des link value après l'animation
        d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
          .style('display', 'inline')
        //Propagration de l'animation sur les flux sortant du target_node
        // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
        if (!nodeDisplay.includes(idTarget)) {
          nodeDisplay.push(idTarget)
          branchAnimate(nodes, nodes[idTarget], nodeDisplay)
        }
      })
  }

  const removeAnimate = () => {
    // Si il y a des .tmp (notamment issus des animations)
    if (d3.selectAll('.tmp').nodes().length > 0) {
      // On remove tous les éléments temporaires
      d3.selectAll('.tmp').remove()
      // Et on supprime tous les styles pour retrouver les valeurs par default qui sont dans attr
      d3.select('#svg').selectAll('.node_shape').style('fill', null)
      d3.select('#svg').selectAll('.link').style('stroke', null)
      d3.select('#svg').selectAll('.arrow').style('fill', null)
      d3.select('#svg').selectAll('.link_value').style('display', null)
      d3.select('#svg').selectAll('.node_text').style('fill', null)
    }
  }


  const drawArrows = (
    n: SankeyNode,
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { font_size: number; filter?: number; filter_label?: number; sector_italic?: boolean; product_italic?: boolean; sector_bold?: boolean; product_bold?: boolean; sector_uppercase?: boolean; product_uppercase?: boolean },
    tags_catalog: TagsCatalog,
    selection: d3.Selection<d3.BaseType, SankeyNode, HTMLElement, SankeyNode>
  ) => {
    let cum_v_left = 0
    let cum_h_top = 0
    let cum_v_right = 0
    let cum_h_bottom = 0
    let is_v = true

    // a quoi ca sert ?
    const tmp = selection.selectAll('path')
    tmp.remove()

    const res = compute_total_offsets(n, nodes, links, tags_catalog, test_link_value)
    const [total_height_left, total_height_right, total_width_top, total_width_bottom] = res

    for (let i = 0; i < n.inputLinksId.length; i++) {
      const l = links[n.inputLinksId[i]]
      if (!data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible) {
        continue
      }
      const link_value = test_link_value(nodes, l, tags_catalog)
      if (link_value === undefined) {
        continue
      }
      const source_node = nodes[l.idSource]
      if (l.orientation === 'hh' || l.orientation === 'vh') {
        is_v = true
      } else {
        is_v = false
      }
      const source_node_x = source_node.position === 'absolute' ? source_node.x : +n.x + +source_node.x
      const source_node_y = source_node.position === 'absolute' ? source_node.y : +n.y + +source_node.y
      const node_x = n.position === 'absolute' ? n.x : +source_node.x + +n.x + +d3.select('#' + source_node.idNode).attr('width')
      const node_y = n.position === 'absolute' ? n.y : +source_node.y + +n.y + +d3.select('#' + source_node.idNode).attr('height')
      if (!display_style.filter || link_value >= display_style.filter) {
        //selection
        d3.select('#gg_' + l.idLink + ' .arrow').remove() // supression dans le cas du drag notamment
        setNodeHeight(n, nodes, links, tags_catalog)

        d3.select('#gg_' + l.idLink)
          .append('path')
          .attr('class', 'arrow')
          .attr('id', l.idLink + '_arrow')
          .attr('d', () => {
            let xt
            let yt
            let p5
            if (l.orientation === 'hh' || l.orientation === 'vh') {
              if (node_x <= source_node_x && l.recycling || node_x > source_node_x && !l.recycling) {
                xt = +node_x
                yt = +node_y + +d3.select('#' + n.idNode).attr('height') / 2
                p5 = [xt, yt]
                is_v = true
                return SankeyShapes.draw_arrow(scale(total_height_left) / 2, p5, scale(link_value), scale(cum_v_left), true, false)
              } else {
                xt = +node_x + +d3.select('#' + n.idNode).attr('width')
                yt = +node_y + +d3.select('#' + n.idNode).attr('height') / 2
                p5 = [xt, yt]
                is_v = true
                return SankeyShapes.draw_arrow(scale(total_height_right) / 2, p5, scale(link_value), scale(cum_v_right), true, true)
              }
            } else if (l.orientation === 'vv' || l.orientation === 'hv') {
              if (node_y > source_node_y) {
                xt = +node_x + +d3.select('#' + n.idNode).attr('width') / 2
                yt = +node_y
                p5 = [xt, yt]
                is_v = false
                return SankeyShapes.draw_arrow(scale(total_width_top) / 2, p5, scale(link_value), scale(cum_h_top), false, false)
              } else {
                xt = +node_x + +d3.select('#' + n.idNode).attr('width') / 2
                yt = +node_y + +d3.select('#' + n.idNode).attr('height')
                p5 = [xt, yt]
                is_v = false
                return SankeyShapes.draw_arrow(scale(total_width_bottom) / 2, p5, scale(link_value), scale(cum_h_bottom), false, true)
              }
            }
            return ''
          })
          // .attr('transform', () => 'translate(' + -(n.x) + ', ' + -(n.y) + ')')
          .attr('fill', () => link_color(l))
          .attr('fill-opacity', () => {
            const opacity = String(!((data as unknown) as { show_uncert: boolean }).show_uncert && getLinkValue(data, l.idLink).display_value).includes('[') ? 0.85 : 0.85
            return opacity
          })
      }
      if (is_v && (node_x > source_node_x && !l.recycling || node_x < source_node_x && l.recycling)) {
        cum_v_left += link_value
        cum_v_right += link_value
      } else if (!is_v && node_y > source_node_y) {
        cum_h_top += link_value
      } else if (!is_v && node_y < source_node_y) {
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

  const drawLegend = () => {
    // Dans le menu tags, les éléments affichés dans la légende sont :
    // les tagGroup pour lesquelles Legend est à true 
    // le selected du tags à true
    //console.log('FUNCTION : drawLegend')

    // dx permet de faire en décalage vers la gauche lorsque l'on change de groupTags
    let dx = 0
    const pas = 180


    d3.select('#g_legend').selectAll('*').remove()

    const legend = d3.select('#g_legend').style('transform', 'translate(' + data.legend_position[0] + 'px,' + data.legend_position[1] + 'px)').append('g')

    const wrap = textwrap()
      .bounds({ height: 100, width: pas - 40 })
      .method('tspans')

    Object.values(data.tags_catalog).filter(tag_group => tag_group.show_legend).forEach(tag_group => {

      // Ajout du tagGroup.name  
      legend.append('text')
        .attr('transform', function () {
          return 'translate(' + dx + ', 0 )'
        })
        .attr('x', 0)
        .attr('y', 0)
        .text(tag_group.group_name)
        .attr('style', 'font-weight:bold')
        .call(wrap)

      const legendElements = legend.append('g')
        .selectAll('g')
        // je comprends pas trop avant on utilisait d3.entries il semble etre remplacé par Object.entries(), mais ca ne donne pas la même chose
        .data(Object.entries(tag_group.tags))
        .enter()
        .append('svg:g')
        // on filtre les tags avec selected à true (Visible)
        .filter(function (d) { return d[1].selected })
        .attr('transform', function (d, i) {
          return 'translate(' + dx + ',' + i * 30 + ')'
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

    // On translateY #g_nodes et #g_links de la hauteur de la légende
    //d3.select('#g_nodes').style('transform', 'translateY(50px)')
    //d3.select('#g_links').style('transform', 'translateY(50px)')
  }

  useEffect(() => {

    //d3.selectAll('.tmp').remove()
    removeAnimate()

    let height = 0
    Object.values(data.nodes).forEach(n => height = (n.y && n.node_visible) ? Math.max(height, n.y) : height)
    let min_height = 2000
    Object.values(data.nodes).forEach(n => min_height = (n.y && n.node_visible) ? Math.min(min_height, n.y) : min_height)
    let max_vert_shift = 0
    Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

    height = Math.max(500, height + max_vert_shift + 200)

    const svgSankey = (d3.select('#svg') as any)
    svgSankey
      .attr('viewBox', [0, 0, data.width, height])
      //.attr('cursor', 'grab')
      .call(d3.zoom()
        .filter(function filter(event) { // Permet d'obliger Crtl pour activer le zoom
          return event.ctrlKey
        })
        .wheelDelta(function wheelDelta(event) { // Permet de regler la vitesse du zoom
          return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
        })
        .on('zoom', function (transform) {
          //d3.selectAll('svg > *') // permet de sélectionner l'ensemble des éléments de la balise svg
          d3.select('#g_nodes')
            .attr('transform', transform.transform)
          d3.select('#g_links')
            .attr('transform', transform.transform)
          d3.selectAll('#g_nodes text')
            .style('font-size', function () {
              return data.display_style.font_size / transform.transform.k + 'px' // Permet de maintenir une taille de police constante
              // A voir si il ne faut pas la réduire quand le zomm est <1
            })
          d3.selectAll('#g_links text')
            .style('font-size', function () {
              return data.display_style.font_size / transform.transform.k + 'px' // Permet de maintenir une taille de police constante
              // A voir si il ne faut pas la réduire quand le zomm est <1
            })
        })
      )

    update_scale(data.user_scale)

    add_nodes(data.static_sankey, true)
    add_links(data.static_sankey, true)
    const gg_nodes = d3.select('#g_nodes').selectAll('.gg_nodes') as d3.Selection<SVGGElement, SankeyNode & SankeyLink, SVGGElement, SankeyNode & SankeyLink>
    //gg_nodes.attr('cursor', 'zoom-in')
    const gg_links = d3.select('#g_links').selectAll('.gg_links') as d3.Selection<SVGGElement, SankeyNode & SankeyLink, SVGGElement, SankeyNode & SankeyLink>
    //gg_links.attr('cursor', 'zoom-in')

    drawLegend()

    try {
      localStorage.setItem('data', JSON.stringify(data))
    } catch (e) {
      localStorage.clear()
    }
    console.log(data)
  })
  let height = 0
  Object.values(data.nodes).forEach(n => height = n.y && n.node_visible ? Math.max(height, n.y) : height)
  let max_vert_shift = 0
  Object.values(data.links).forEach(l => max_vert_shift = l.vert_shift ? Math.max(max_vert_shift, l.vert_shift) : max_vert_shift)

  height = Math.max(500, height + max_vert_shift + 200)
  return (
    <>
      <div className="span12" style={{ 'color': 'black', 'backgroundColor': 'WhiteSmoke', 'marginLeft': '10px' }} id="visualization_div" >
        <svg height={height} width='100%' id='svg' >
          <g className='g_legend' id='g_legend'></g>
          <g className='g_nodes' id='g_nodes' ></g>
          <g className='g_links' id='g_links' ></g>
        </svg>
      </div>
      <AgregationModal
        show_agregation={show_agregation}
        data={data}
        set_data={set_data}
        parent_names={agregation_parent_names}
        dimension_names={agregation_dimension_names}
        set_show_agregation={set_show_agregation}
        is_agregation={is_agregation}
      />
    </>
  )
}

SankeyDraw.propTypes = SankeyDrawPropTypes
SankeyDraw.defaultProps = SankeyDrawDefaultProps

export default SankeyDraw
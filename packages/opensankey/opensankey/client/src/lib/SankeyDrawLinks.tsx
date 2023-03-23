import  { InferProps } from 'prop-types'
import { SankeyLink, SankeyData, SankeyNode, SankeyDrawCurve,TagsCatalog,SankeyLinkValue} from './types'
import React, { useEffect,Requireable } from 'react'
import * as d3 from 'd3'
import {  test_link_value,link_color,link_visible} from './SankeyUtils'
import { drawArrows,drawCurveFunction,scale,inv_scale,setNodesHeight,strokeDasharray, min_width_and_height } from './SankeyDrawFunction'
import {add_drag_link_zone} from './SankeyDrag'
import {value_selected_parameter} from './SankeyDrawFunction'


export const OpenSankeyDrawLinks = (
  data:SankeyData, 
  links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }> | null,
  multi_selected_links:{current: SankeyLink[] },
  mode_selection:string,

  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement> }> | null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>}> | null,

  select_link:(l: SankeyLink) => void,
  
  alt_key_pressed:boolean,
  static_sankey:boolean,
  position:'absolute' | 'relative',
  node_arrow_visible:(data:SankeyData,n: SankeyNode)=>boolean,
  linkTooltipsContent:(data: SankeyData, l: SankeyLink,
    getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  link_text:(data: SankeyData, d: SankeyLink,getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  set_displayed_value:(s:string)=>void,
  tags_selected:{[k: string]: string},


) => {

  const display_nodes=data.nodes
  const display_links=data.links
  const default_handle_size = 10
  const default_horiz_shift = 50

  const min_thickness=2

 
  // Function triggerd when a link is clicked, based on if it's to select or deselect a link, some elment will appear or disappear (center handle,shift handles,drag zone) and add pointer event to those element
  const eventLinkClick=(event:React.MouseEvent<HTMLButtonElement>,d:SankeyLink,
    mode_visualisation:boolean,sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
    accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
    button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
    multi_selected_links:{current: SankeyLink[] },
    links_accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
    select_link:(n: SankeyLink) => void,
    set_data:React.Dispatch<React.SetStateAction<SankeyData>>
    )=>{
    if (!mode_visualisation) {
      sankeyTooltip.style('opacity', 0)
      if ( button_ref && button_ref.current && accordion_ref && accordion_ref.current==null) {
        button_ref.current.click()
      }
      multi_selected_links.current = multi_selected_links.current.filter(d => (d != null && d.idLink != ''))
      if (multi_selected_links.current.includes(d)) {
        multi_selected_links.current.splice(multi_selected_links.current.indexOf(d), 1)
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' rect.handle').attr('fill-opacity', '0')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' rect.handle').attr('cursor', 'pointer')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('cursor', 'pointer')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('stroke-opacity', '0')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('stroke-opacity', '0')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('fill-opacity', '0')
      } else {
        multi_selected_links.current.push(d)
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' rect.handle').attr('fill-opacity', '1')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' rect.handle').attr('cursor', 'ew-resize')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('cursor', 'ns-resize')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .drag_zone').attr('stroke-opacity', '1')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('stroke-opacity', '1')
        d3.selectAll(' .opensankey #gg_' + d.idLink + ' .center_handle').attr('fill-opacity', '1')
      }
      if((event.ctrlKey || event.metaKey)){
        if ( accordion_ref && accordion_ref.current) {
          for ( const child in accordion_ref.current.children) {
            if (accordion_ref.current.children[child].id === 'Flux') {
              (accordion_ref.current.children[0] as HTMLLabelElement).click();
              (accordion_ref.current.children[child] as HTMLLabelElement).click()
            }
          }
        }
        if ( links_accordion_ref && links_accordion_ref.current) {
          (links_accordion_ref.current.children[0] as HTMLLabelElement).click();
          (links_accordion_ref.current.children[1] as HTMLLabelElement).click()
        }
      }
      if(multi_selected_links.current.length>0){
        set_displayed_value(value_selected_parameter(data,multi_selected_links,tags_selected).value)
      }else{
        set_displayed_value('')
      }
      
      select_link(d)
      set_data({...data})
    }
  }

  // Function that return the link color
  // the color depend of if a tag is selected (nodeTAgs,linkTags or dataTags), if it's a gradient between the source node color and it's target node color
  const linkStroke=(l:SankeyLink,data:SankeyData,defGradient:d3.Selection<SVGDefsElement,unknown,HTMLElement,unknown>)=>{
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
    if (l.orientation == 'hh' || l.orientation == 'hv') {
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
    } else if (l.orientation == 'vv' || l.orientation == 'hv') {
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
    } else if (l.orientation == 'vh') {  
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
    return (l.gradient && l.colorParameter==='local') ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : link_color(l,data,getLinkValue) as string
  } 

  // Function that compute the link width
  const linkStrokeWidth=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number,inv_scale:(t:number)=>number,min_thickness:number,display_nodes:{ [node_id: string]: SankeyNode })=>{
    const node = data.nodes[l.idSource]
    // const links = data.links
    const nodes = data.nodes
    // const stream_io = node.inputLinksId.concat(node.outputLinksId)
    //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs  
    //position noeud source ou target
    let pos_x_src, pos_y_src
    if (node.idNode == nodes[l.idSource].idNode) {
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
    let link_value = test_link_value(data, nodes, l,getLinkValue)
    link_value=(+link_value==0||(+link_value>=inv_scale(2)))?+link_value:inv_scale(2)  
    //Zones limite à ne pas êtres
    const limit_x = [pos_x_src - scale(link_value / 2), pos_x_src + node.node_width + scale(link_value / 2)]
    const limit_y = [pos_y_src - scale(link_value / 2), pos_y_src + scale(link_value / 2)]  
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
      const link_value = test_link_value(data, display_nodes, l,getLinkValue)
      const tmp =(link_value=='')?1:link_value
      return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))  
    }
  }

  // Function that return the side of link label
  const textLinkSide=(link:SankeyLink,data:SankeyData)=>{
    if (link.recycling) {
      if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
        return 'left'
      } else if (link.label_position === 'middle' && link.orientation === 'hh') {
        return 'right'
      }
      return 'left'
    } else {
      if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
        return 'left'
      } else {
        return 'right'
      }
      return 'left'
    }
  }

  // Function that return the Y position of link label
  const textLinkPosDY=(l:SankeyLink,data:SankeyData,scale:(t:number)=>number)=>{
    if (l.orthogonal_label_position === 'middle') {
      return '0.3em'
    } else if (l.orthogonal_label_position === 'below') {
      const tmp=getLinkValue(data, l.idLink).value

      return scale((tmp)?tmp:0) / 2 + 10 + 'px'
    } else if (l.orthogonal_label_position === 'above') {
      const tmp=getLinkValue(data, l.idLink).value

      return -scale((tmp)?tmp:0) / 2 + 'px'
    }
    return '0.3em'
  }



  const add_links = (
    static_sankey: boolean,
    remove_previous_links = true
  ) => {
    // Structure svg du link
    //- link : 
    //- text : 
    //- rect :
    //- rect :
    //- arrow :       
    d3.selectAll(' .opensankey #svg #sankey_def').remove()
    const defGradient = d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')

    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

    const { display_style } = data
    if (remove_previous_links) {
      d3.select(' .opensankey #g_links').selectAll('.gg_links').remove()
    }
    d3.select(' .opensankey #svg').selectAll('.link_value').remove()

    if (display_links === undefined) {
      return
    }
    const gg_links = d3
      .select('.opensankey #g_links')
      .selectAll('.gg_links')
      .data(Object.values(display_links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display))
      .enter()
      .append('g')
      .attr('id', d => 'gg_' + d.idLink)
      .attr('class', 'gg_links')
      // On gere la visibilité directement sur gg_nodes avec un display <inline />
      .style('display', (d) => {
        let display: string
        if (link_visible(d, data,getLinkValue)) { display = 'inline' } else { display = 'none' }
        return display
      })
      .attr('pointer-events', 'auto')
      .attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
      .attr('stroke-dasharray', d => {
        return strokeDasharray(d,data,getLinkValue)
      })

    const paths = gg_links.append('path')
    if (!static_sankey ) {
      let error_msg: { text: string | undefined } | undefined
      paths.call(dragLinkEvent(multi_selected_links,data,display_nodes,display_links,error_msg,display_style,drawCurveFunction,scale,inv_scale,min_thickness)
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
          return link_color(l,data,getLinkValue) as string
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
        
        return  link_visible(d, data,getLinkValue) && tmp >= Math.max(data.display_style.filter, data.display_style.filter_label) ? 'visible' : 'hidden'
      })

    if (!static_sankey ) {
      // A voir avec Julien
      select2.call(dragLinkTextEvent(alt_key_pressed)
      )
        .on('click', (event, d) => {
          const source_node = display_nodes[d.idSource]
          const target_node = display_nodes[d.idTarget]
          select_link(d)
          // if classic link
          if (d.orientation === 'hh' && source_node.x < target_node.x) {
            d3.select(' .opensankey #link_center' + d.idLink).attr('fill-opacity', 0.7)
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
        // Quand on survole des flux petit : aggrandi la taille du flux pour être plus facile sélectionnable
        if(linkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes)<15){
          d3.select('.link#'+d.idLink).attr('stroke-width','15')
          if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
            d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','10, 5')
          }
        }
        if (!event.shiftKey && !static_sankey) {
          return
        }
        sankeyTooltip
          .html(linkTooltipsContent(data, d,getLinkValue))
        
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible  && tmp >= display_style.filter) {
          d3.select(' .opensankey #arrow_'+d.idLink).attr('opacity','0.5')
          return d3.select(this).attr('stroke-opacity', '0.5')
        }
      })
      .on('mousemove', (event) => {
        if (!event.shiftKey && !static_sankey) {
          return
        }
        sankeyTooltip
          .style('opacity', 1)
          .style('top', Math.max(50, event.pageY - 10) + 'px')
          .style('left', (event.pageX + 30) + 'px')
      })
      .on('mouseout', function (event, d) {
        // Quand on quitte le survole des flux petit : remet la taille du flux a sa valeur originel
        if(linkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes)<15){
          d3.select('.link#'+d.idLink).attr('stroke-width',linkStrokeWidth(d,data,scale,inv_scale,min_thickness,display_nodes))
          if(d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray')!=''){
            d3.select('.gg_links#gg_'+d.idLink).attr('stroke-dasharray','5, 5')
          }
        }
        sankeyTooltip.style('opacity', 0)
        let tmp=getLinkValue(data, d.idLink).value
        tmp=(tmp)?tmp:0
        if (data.nodes[d.idSource].node_visible && data.nodes[d.idTarget].node_visible && tmp >= display_style.filter) {
          const opacity = String(getLinkValue(data, d.idLink).display_value).includes('[') ? 0.85 : 0.85
          d3.select(' .opensankey #arrow_'+d.idLink).attr('opacity','1')
          return d3.select(this).attr('stroke-opacity', opacity)
        }
      })

    paths.on('click', (event, d) =>eventLinkClick(event,d,data.static_sankey,sankeyTooltip,accordion_ref,button_ref,multi_selected_links,links_accordion_ref,select_link,set_data))
    const arrowVisible=(l :SankeyLink)=>{
      return  data.nodes[l.idSource].display && data.nodes[l.idTarget].display && l.arrow

    }
    //Creation des Arrows associés au link
    d3.selectAll(' .opensankey .ggg_nodes')
      .filter((n) => node_arrow_visible(data,(n as SankeyNode)))      
    //   .each(function (n) {
    //     drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags)
    //   })


    d3.selectAll(' .opensankey .gg_links')
      .filter(l=>arrowVisible(l as SankeyLink))
      .each(function (l) {
        const n =data.nodes[(l as SankeyLink).idTarget]
        drawArrows(data, n as SankeyNode, display_nodes, display_links, display_style, data.nodeTags,scale,inv_scale,min_thickness,getLinkValue)
      })

    paths.attr('d', d => {
      setNodesHeight(data,display_nodes, display_links, d, data.nodeTags,getLinkValue)
      return drawCurveFunction.curve(data,
        display_nodes, display_links, display_style,
        data.nodeTags, d, error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
      )
    })

    d3.selectAll(' .opensankey .gg_links')
      .filter(l=>{
        return Number(d3.select(' .opensankey #'+(l as SankeyLink).idLink).attr('stroke-opacity'))!=0
      })
      .each(function (l) {
        if((l as SankeyLink).orientation=='vv' ||(l as SankeyLink).orientation=='hh'){
          add_drag_link_zone((l as SankeyLink),data.nodes,data,multi_selected_links,data.static_sankey,display_nodes,display_links,default_handle_size,default_horiz_shift,scale,inv_scale,min_thickness,drawCurveFunction,link_text,getLinkValue)
        }
      })
    if (error_msg && error_msg.text) {
      alert(error_msg.text)
    }
  }

  /**
   *  Function that allow us to change link position in target or source nodes
   *
   * @param {{current: SankeyLink[]}} multi_selected_links
   * @param {SankeyData} data
   * @param {{ [node_id: string]: SankeyNode }} display_nodes
   * @param {{ [link_id: string]: SankeyLink }} display_links
   * @param {({ text: string | undefined } | undefined)} error_msg
   * @param {{node_font_size: number,sector_uppercase: boolean,sector_bold: boolean,sector_italic: boolean,product_uppercase: boolean,product_bold: boolean,product_italic: boolean,unit: boolean,filter: number,filter_label: number,global_curvature: number,null_flux: boolean,font_family: string[],node_font_family_selected: string,link_font_family_selected: string}} display_style
   * @param {SankeyDrawCurve} drawCurveFunction
   * @param {(t:number)=>number} scale
   * @param {(t:number)=>number} inv_scale
   * @param {number} min_thickness
   * @returns
   */
  const dragLinkEvent=(multi_selected_links:{current: SankeyLink[]},
    data:SankeyData,
    display_nodes:{ [node_id: string]: SankeyNode },
    display_links:{ [link_id: string]: SankeyLink },
    error_msg: { text: string | undefined } | undefined,
    display_style: {filter: number,filter_label: number,font_family: string[],node_font_family_selected: string,link_font_family_selected: string},
    drawCurveFunction : SankeyDrawCurve,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
    min_thickness:number
  )=>{
    return d3.drag<SVGPathElement, SankeyLink>()
      .subject(Object)
      .on('drag', function (event,l) {
        if(multi_selected_links.current.includes(l)){
          drag_link(display_nodes, display_links, display_style, data.nodeTags, this, event,data,scale,inv_scale,min_thickness)
          Object.values(display_links).forEach(
            (link: SankeyLink) => {
              d3.select(' .opensankey #' + link.idLink).attr('d',
                () => {
                  return drawCurveFunction.curve(data,
                    display_nodes, display_links, display_style,
                    data.nodeTags, link,
                    error_msg,multi_selected_links,link_text,min_width_and_height,getLinkValue
                  )
                }
              )
            }
          )
        }
      })
  }







  
  
  
   
  
  

  
  

  

  /**
 * Function triggerd when a link is dragged, it identify if the mouse is closer of the target or the source and return the closest node of the two
 *
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {SankeyLink} link
 * @param {number[]} mouse_coord
 * @returns {{ node_id: any; type: string; origin: any; }}
 */
  const identify_node = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    link: SankeyLink,
    mouse_coord: number[]
  ) => {
    const source_node = nodes[link.idSource]
    const target_node = nodes[link.idTarget]
    const source_x_min = source_node.x
    const source_x_max = source_x_min + parseInt(d3.select(' .opensankey #' + source_node.idNode).attr('width'))
    const source_y_min = source_node.y
    const source_y_max = source_y_min + parseInt(d3.select(' .opensankey #' + source_node.idNode).attr('height'))
    const target_x_min = target_node.x
    const target_x_max = target_x_min + parseInt(d3.select(' .opensankey #' + target_node.idNode).attr('width'))
    const target_y_min = target_node.y
    const target_y_max = target_y_min + parseInt(d3.select(' .opensankey #' + target_node.idNode).attr('height'))
    const tolerance = 3 * source_node.node_width
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

  /**
   * Description placeholder
   *
   * @param {string[]} array
   * @param {number} x
   * @param {number} y
   */
  const swap = (array: string[], x: number, y: number) => {
    const temp = array[x]
    array[x] = array[y]
    array[y] = temp
  }
  /**
   * Function that change link position in target's inputLinksId or source's outputLinksId
   *
   * @param {{ [node_id: string]: SankeyNode }} nodes
   * @param {{ [link_id: string]: SankeyLink }} links
   * @param {{ node_font_size: number;  filter: number; filter_label: number }} display_style
   * @param {TagsCatalog} nodeTags
   * @param {(SVGPathElement | null)} dragged
   * @param {d3.D3DragEvent<Element, SankeyLink, unknown>} event
   * @param {SankeyData} data
   * @param {(t:number)=>number} scale
   * @param {(t:number)=>number} inv_scale
   * @param {number} min_thickness
   * @returns {number, inv_scale: (t: number) => number, min_thickness: number) => void}
   */
  const drag_link = (
    nodes: { [node_id: string]: SankeyNode },
    links: { [link_id: string]: SankeyLink },
    display_style: { filter: number; filter_label: number },
    nodeTags: TagsCatalog,
    dragged: SVGPathElement | null,
    event: d3.D3DragEvent<Element, SankeyLink, unknown>,
    data:SankeyData,
    scale:(t:number)=>number,
    inv_scale:(t:number)=>number,
    min_thickness:number
  ) => {
    //Peut etre appelé sur un drag de path qui a directement l'id du link 
    //ou bien peut etre appelé par le rect de drag qui a l'id du link après un prefix
    const idLink = d3.select(dragged).attr('id').replace('drag_zone_s_','').replace('drag_zone_t_','')
    const p2 = d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))
    const linked_node = identify_node(nodes, links, links[idLink], p2)
    if (linked_node === undefined) {
      return
    }
    const node = nodes[linked_node.node_id]
    let id_input_filtered=node.inputLinksId.filter(id=>{return id && data.links[id] && link_visible(data.links[id],data,getLinkValue) })
    let id_output_filtered=node.outputLinksId.filter(id=>link_visible(data.links[id],data,getLinkValue))
    const link_dragged=data.links[idLink]
    let io=''
        
    if (linked_node.type === 'source') {
        
      if(link_dragged.orientation=='hh' ||link_dragged.orientation=='hv' ){
        if((!link_dragged.recycling && data.nodes[link_dragged.idTarget].x>data.nodes[linked_node.node_id].x) ||(link_dragged.recycling && data.nodes[link_dragged.idTarget].x<data.nodes[linked_node.node_id].x) ){
          io='right'
        }else{
          io='left'
        }
      }else if(link_dragged.orientation=='vv' ||link_dragged.orientation=='vh'){
        if(data.nodes[link_dragged.idTarget].y<data.nodes[linked_node.node_id].y){
          io='top'
        }else{
          io='bottom'
        }
      }
      //Filtre les flux qui arrivent du même coté que le flux dragged
      id_output_filtered=id_output_filtered.filter(id=>{
        let good_orientation=false
        if(io=='right'){
          good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x) || (data.links[id].recycling && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
        }else if(io=='left'){
          good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idTarget].x<=data.nodes[linked_node.node_id].x)|| (data.links[id].recycling && data.nodes[data.links[id].idTarget].x>data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
        }else if (io=='top'){
          good_orientation=data.nodes[data.links[id].idTarget].y<data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
        }else if(io=='bottom'){
          good_orientation=data.nodes[data.links[id].idTarget].y>=data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
        }
        return good_orientation 
      })
      const true_source_order = node.outputLinksId.indexOf(idLink)
      const source_order = id_output_filtered.indexOf(idLink)
      let output_offset = 0
      for (let i = 1; i < id_output_filtered.length; i++) {
        const link = links[id_output_filtered[i - 1]]
        if (i > source_order) {
          break
        }
        let tmp=getLinkValue(data, link.idLink).value
        tmp=(tmp)?tmp:0
        output_offset += tmp
      }
      const number_of_links = id_output_filtered.length
      const value = getLinkValue(data, idLink).value
      let next_link_index=-1
      let prec_link_index=-1
      if(source_order>0){
        prec_link_index=node.outputLinksId.indexOf(id_output_filtered[source_order-1])
      }
      if(source_order<number_of_links-1){
        next_link_index=node.outputLinksId.indexOf(id_output_filtered[source_order+1])
      }
      if(value){
        if (links[idLink].orientation === 'hh' || links[idLink].orientation === 'hv') {
          if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(output_offset + value)) {
            swap(node.outputLinksId, true_source_order, next_link_index)
          }
          if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(output_offset)) {
            swap(node.outputLinksId, true_source_order, prec_link_index)
          }
        } else if (links[idLink].orientation === 'vv') {
          if (source_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(output_offset + value)) {
            swap(node.outputLinksId, true_source_order, next_link_index)
          }
          if (source_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(output_offset)) {
            swap(node.outputLinksId, true_source_order, prec_link_index)
          }
        }
      }
        
    }
    if (linked_node.type === 'target') {
      if(link_dragged.orientation=='hh' ||link_dragged.orientation=='hv' ){
        if((!link_dragged.recycling && data.nodes[link_dragged.idSource].x>data.nodes[linked_node.node_id].x) ||(link_dragged.recycling && data.nodes[link_dragged.idSource].x<data.nodes[linked_node.node_id].x)){
          io='right'
        }else{
          io='left'
        }
      }else if(link_dragged.orientation=='vv' ||link_dragged.orientation=='vh'){
        if(data.nodes[link_dragged.idSource].y<data.nodes[linked_node.node_id].y){
          io='top'
        }else{
          io='bottom'
        }
      }
      //Filtre les flux qui arrivent du même coté que le flux dragged
        
      id_input_filtered=id_input_filtered.filter(id=>{
        let good_orientation=false
        if(io=='right'){
          good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x) || (data.links[id].recycling && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
        }else if(io=='left'){
          good_orientation=((!data.links[id].recycling && data.nodes[data.links[id].idSource].x<=data.nodes[linked_node.node_id].x)|| (data.links[id].recycling && data.nodes[data.links[id].idSource].x>data.nodes[linked_node.node_id].x)) && (data.links[id].orientation=='hh' || data.links[id].orientation=='hv')
        }else if (io=='top'){
          good_orientation=data.nodes[data.links[id].idSource].y<data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
        }else if(io=='bottom'){
          good_orientation=data.nodes[data.links[id].idSource].y>=data.nodes[linked_node.node_id].y && (data.links[id].orientation=='vv' || data.links[id].orientation=='vh')
        }
        return good_orientation 
      })
      const true_target_order = node.inputLinksId.indexOf(idLink)
      const target_order = id_input_filtered.indexOf(idLink)
      let input_offset = 0
      for (let i = 1; i < node.inputLinksId.length; i++) {
        if (i > target_order) {
          break
        }
        let tmp=getLinkValue(data,node.inputLinksId[i - 1]).value
        tmp=(tmp)?tmp:0
        input_offset +=tmp
      }
      const number_of_links = id_input_filtered.length
      const value = getLinkValue(data, idLink).value
      //Recheche la les flux suivant et précédent qui sont du même coté pour pour ensuite les swap
      let next_link_index=-1
      let prec_link_index=-1
      if(target_order>0){
        prec_link_index=node.inputLinksId.indexOf(id_input_filtered[target_order-1])
      }
      if(target_order<number_of_links-1){
        next_link_index=node.inputLinksId.indexOf(id_input_filtered[target_order+1])
      }
      if(value){
        if (links[idLink].orientation === 'hh') {
          if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy >= linked_node.origin + scale(input_offset + value)) {
            swap(node.inputLinksId, true_target_order, next_link_index)
          }
          if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[1] + event.dy <= linked_node.origin + scale(input_offset)) {
            swap(node.inputLinksId, true_target_order, prec_link_index)
          }
        } else if (links[idLink].orientation === 'vv') {
          if (target_order < number_of_links - 1 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx >= linked_node.origin + scale(input_offset + value)) {
            swap(node.inputLinksId, true_target_order, next_link_index)
          }
          if (target_order > 0 && d3.pointer(event, (d3.select(' .opensankey #g_links').node() as SVGGElement))[0] + event.dx <= linked_node.origin + scale(input_offset)) {
            swap(node.inputLinksId, true_target_order, prec_link_index)
          }
        }
      }
      drawArrows(data, node, nodes, links, display_style, nodeTags,scale,inv_scale,min_thickness,getLinkValue)
    }
  }

 



  /**
 *  Function to freely move the link label if the alt key is pressed
 *
 * @param {boolean} alt_key_pressed
 * @returns {*}
 */
  const dragLinkTextEvent=(alt_key_pressed:boolean,
  )=>{
    return d3.drag<SVGTextElement, SankeyLink>()
      .subject(Object).on('drag', function (event, link) {
        if (alt_key_pressed) {
          drag_link_text(link, event)
        }
      })
  }
  
  /**
  *
  * @param {SankeyLink} link
  * @param {d3.D3DragEvent<Element, unknown, unknown>} event
  */
  const  drag_link_text = (
    link: SankeyLink,
    event: d3.D3DragEvent<Element, unknown, unknown>
  ) => {
    const old_x = +d3.select(' .opensankey #' + link.idLink + '_text').attr('x'),
      old_y = +d3.select(' .opensankey #' + link.idLink + '_text').attr('y'),
      new_x = old_x + event.dx,
      new_y = old_y + event.dy
    d3.select(' .opensankey #' + link.idLink + '_text').attr('x', new_x)
    d3.select(' .opensankey #' + link.idLink + '_text').attr('y', new_y)
    link.x_label = new_x
    link.y_label = new_y
    link.label_position = 'frozen'
  }
  
  



  useEffect(()=>{
    add_links(static_sankey)
  })  
  return (<>
    <g className='g_links' id='g_links' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
  </>
  )
}




import { InferProps} from 'prop-types'
import React, { ChangeEvent, Requireable } from 'react'
import {SankeyLinkValue, SankeyLinkValueDict, TagsGroup,differenceType} from 'open-sankey/src/lib/types'
import { FaArrowDown, FaArrowUp, FaMinus, FaSave,FaCopy, FaFileExport, FaFileImport, FaFileInvoice} from 'react-icons/fa'
import { convert_data } from 'open-sankey/dist/SankeyConvert'
import * as d3 from 'd3'
import { TFunction } from 'i18next'
import { Accordion, Button, ButtonGroup, Col, Form, FormControl, FormLabel, Row, Table, Toast,FormGroup,OverlayTrigger,Tooltip,Badge,Popover,Modal } from 'react-bootstrap'
import {SankeyPlusData,SankeyPlusNode,SankeyPlusLink,SankeyPlusLabel} from './types'
import { FaHome,FaCaretSquareRight,FaCaretSquareLeft} from 'react-icons/fa'
import {  node_color,clickSaveDiagram,adjust_sankey_zone,set_nodes_level } from 'open-sankey/dist/SankeyUtils'
import { updateLayout, apply_input_outputLinksId } from 'open-sankey/dist/SankeyLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileCirclePlus,faFileCircleExclamation,faFileCircleCheck } from '@fortawesome/free-solid-svg-icons'

//Fonction permettant de calculer la profondeur max de nouveaux liens
const calcPath = (
  data: SankeyPlusData,
  nodes: { [node_id: string]: SankeyPlusNode },
  node: SankeyPlusNode,
  new_links: string[],
) => {
  // let number_new_path=0
  let long = 0
  const links_present = node.outputLinksId.filter(o => new_links.includes(o) )
  if (links_present.length > 0) {
    long += 1
    let lng = 0
    links_present.forEach(d => {
      const n = nodes[data.links[d].idTarget]
      const new_lng = calcPath(data, nodes, n, new_links)
      lng = isNaN(new_lng) ? lng : Math.max(lng,new_lng)
    })
    long += lng
    return long
  }
  return NaN
}

export const setDiagram = (
  set_current_data: (d:SankeyPlusData)=>void,
  set_view: (s:string)=>void
) => {
  return (
    the_diagram : string,
    data : SankeyPlusData,
    set_data : (d:SankeyPlusData)=>void
  ) => {
  //const the_diagram = evt.target.value as string
    const sous_filieres = window.sankey.sous_filieres

    const new_data = JSON.parse(
      JSON.stringify(
        window.sankey[sous_filieres[the_diagram]]
      )
    ) as SankeyPlusData
    //Object.assign(sankey_data, new_data)
    convert_data(new_data)
    new_data.static_sankey = true
    // if (!is_split) {
    //   set_diagram(the_diagram)
    // }

    Object.values(data.nodes).forEach(node => {
      node.node_visible = true
      node.display = true
    })
    set_nodes_level(data)
    // new_data.fit_screen = true
    d3.select(' .opensankey #svg').on('.zoom', null)
    set_current_data({...new_data })
    if (window.SankeyToolsStatic && new_data.view.length > 0) {
      set_view(new_data.view[0].id)
      // set_data({...new_data.view[0].view_data as SankeyPlusData})
      set_data({...get_data_from_view(new_data,new_data.view[0].id)})
    } else {
      set_data({ ...new_data })
    }
  }
}

export const view_toast = (<Toast bg='success' className='toastView' style={{ 'position': 'absolute', 'marginTop': '300px', 'marginLeft': '250px', 'zIndex': 1 }}>
  <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Enregistrement</small> </Toast.Header>
  <Toast.Body>Vue sauvegardée</Toast.Body>
</Toast>)

export const view_toast_update_view = (<Toast bg='info' className='toastView' style={{ 'position': 'absolute', 'marginTop': window.innerHeight/4,'marginLeft': window.innerWidth/2, 'zIndex': 100 }}>
  <Toast.Header closeButton={false}><FaSave /> <small className='me-auto'>Mise à jour</small> </Toast.Header>
  <Toast.Body>Vue mise à jour</Toast.Body>
</Toast>)

// }

//Fonction appelé lorsque les vue s'enchaien automatiquement (via le bouton play ou lorsqu'on appuye sur la touche 'F6')
export const nextView = (
  master_data: SankeyPlusData,
  set_data:(s:SankeyPlusData)=>void,
  new_view: string,
  set_view:(s:string)=>void,
  set_animating: (b:boolean)=>void
) => {
  //const v1 = data.view[].filter(d => d.id === new_view)[0].id
  let ind = -1
  master_data.view.forEach((v, i) => {
    ind = (v.id === new_view) ? i : ind
  })
  set_animating(true)
  // const view_data = master_data.view[ind].view_data as SankeyPlusData
  const view_data = get_data_from_view(master_data,master_data.view[ind].id)
  const time_to_set_view = animate_view_changement(view_data)
  if (ind === master_data.view.length -1) {
    set_animating(false)
    return
  }
  setTimeout(function () {
    set_view(master_data.view[ind + 1].id)
    // set_data({ ...master_data.view[ind+1].view_data as SankeyPlusData })
    set_data({ ...get_data_from_view(master_data,master_data.view[ind+1].id)})
    setTimeout(function () {
      nextView(master_data,set_data,master_data.view[ind+1].id,set_view,set_animating)
      set_animating(false)
    }, 500)
  }, time_to_set_view)
}

// const animate_view_changement = (
//   data   :SankeyPlusData,
//   data_v1: SankeyPlusData,
//   data_v2: SankeyPlusData,
//   node_color: (node:SankeyPlusNode,data:SankeyPlusData)=>string,
//   link_color: (link:SankeyPlusLink,data:SankeyPlusData)=>string,
//   scale:(t:number)=>number,inv_scale:(t:number)=>number,
//   getLinkValue: (data: SankeyPlusData, idLink: string, up? : boolean)=>SankeyLinkValue,
//   multi_selected_nodes:{current:SankeyPlusNode[]},
//   setNodeHeight:(n: SankeyPlusNode,nodes: { [node_id: string]: SankeyPlusNode },links: { [link_id: string]: SankeyPlusLink },selected_tags: TagsCatalog,data:SankeyPlusData,scale:(t:number)=>number,inv_scale:(t:number)=>number,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) =>void,
//   setNodesHeight:(data:SankeyPlusData,nodes: { [node_id: string]: SankeyPlusNode },links: { [link_id: string]: SankeyPlusLink },d: SankeyPlusLink,nodeTags: TagsCatalog,getLinkValue: (data: SankeyPlusData, idLink: string, up? : boolean)=>SankeyLinkValue) =>void,
//   link_visible: (l: SankeyPlusLink, data_s: SankeyPlusData)=>boolean,
//   test_link_value: (data:SankeyPlusData, node: { [node_id: string]: SankeyPlusNode }, d: SankeyPlusLink) => string,
//   min_thickness: number,
//   drawArrows:plusDrawArrowsType,
//   drawCurve:PlusDrawCurveType,
//   link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
// ) => {

//Cette fonction reprend le code executé pour l'affichage des noeuds et lien tout en  ajoutant une animation
//Elle est executé avant de changé de vue (variable view) afin de pouvoir faire les animations puis ensuites
// Supprime les noeuds non présent dans la vu suivante avec une transition
// Object.keys(data_v1.nodes).filter(d => !Object.keys(data_v2.nodes).includes(d)).forEach(d => {
//   d3.select(' .opensankey #gg_' + d).transition().duration(500).style('opacity', 0).remove()
// })

// // Supprime les liens non présent dans la vu suivante avec une transition
// Object.keys(data_v1.links).filter(d => !Object.keys(data_v2.links).includes(d)).forEach(d => {
//   d3.select(' .opensankey #gg_' + d).transition().duration(500).style('opacity', 0).remove()
// })
// //Récupère les noeuds et liens présent uniquement dans la nouvelle data
// const new_nodes = Object.fromEntries(Object.entries(data_v2.nodes).filter(d => !Object.keys(data_v1.nodes).includes(d[0])))
// const new_links = Object.fromEntries(Object.entries(data_v2.links).filter(d => !Object.keys(data_v1.links).includes(d[0])))
// const k_links = Object.keys(new_links)
// const node_data=Object.values(data_v2.nodes).filter(d=>Object.keys(new_nodes).includes(d.idNode))

// //=================AJOUT NOUEVEAUX NOEUDS========================================
// const gg_nodes = d3.select(' .opensankey #g_nodes').selectAll('.gg_nodes').data(node_data).append('g')
//   .attr('id', d => {
//     return 'gg_' + d.idNode
//   })
//   .attr('class', 'gg_nodes')
// // On gere la visibilité directement sur gg_nodes avec un display <inline />
// // Cela permettra de mieux gérer des zooms sur les éléments visibles
//   .style('display', (d) => {
//     let display: string
//     if (d.node_visible) { display = 'inline' } else { display = 'none' }
//     return display
//   })
//   .style('font-family', d => d.display_style.font_family)


// const ggg_nodes = gg_nodes.append('g')
//   .attr('id', d => 'ggg_' + d.idNode)
//   .attr('class', 'ggg_nodes')
//   .attr('transform', d =>nodeTransform(d,data_v2.nodes,data_v2.links))


// if ( data_v2.nodeTags['Type de noeud'] ) {
//   Object.entries(data_v2.nodeTags['Type de noeud'].tags).forEach( ([key,tag])=> {
//     ggg_nodes
//       .filter(d =>d.tags['Type de noeud'].includes(key))
//       .append(tag.shape as string)
//       .classed('node', true)
//       .classed('node_shape', true)
//   })
//   ggg_nodes
//     .filter(d =>d.tags['Type de noeud'].length === 0)
//     .append('rect')
//     .classed('node', true)
//     .classed('node_shape', true)
//   // .attr('height', d => d.node_height)
//   // .attr('width', d => d.node_width)
// } else {
//   ggg_nodes
//     .filter(d => d.shape === 'rect')
//     .append('rect')
//     .classed('node', true)
//     .classed('node_shape', true)
//   // .attr('height', d => d.node_height)
//   // .attr('width', d => d.node_width)

//   ggg_nodes
//     .filter(d => d.shape === 'ellipse')
//     .append('ellipse')
//     .classed('node', true)
//     .classed('node_shape', true)
//     .attr('cx', d => d.node_width / 2)
//     .attr('cy', d => d.node_height / 2)
//     .attr('rx', d => d.node_width / 2)
//     .attr('ry', d => d.node_height / 2)


// }


// d3.selectAll(' .opensankey .node')
//   .filter(d => Object.keys(new_nodes).includes((d as SankeyPlusNode).idNode))
//   .attr('id', d => (d as SankeyPlusNode).idNode)
//   .attr('fill-opacity', d => (d as SankeyPlusNode).node_visible && (d as SankeyPlusNode).shape_visible ? '1' : '0')
//   .attr('fill', d => node_color(d as SankeyPlusNode,data) as string)
//   .attr('stroke', 'black')
//   .attr('stroke-width', d => {
//     const dd = (d as SankeyPlusNode)
//     return node_stroke_width(dd,multi_selected_nodes)
//   }
//   )

// //---------VERSION AVEC STYLE PROPRE A CHAQUE NOEUD---------------

// Object.values(new_nodes).map(n => setNodeHeight(n, data_v2.nodes, data_v2.links, data_v2.nodeTags,data,scale,inv_scale,getLinkValue))

// //----------------ICON-----------------


// ggg_nodes
//   .filter(d => d.iconName != 'none' && d.iconVisible)
//   .append('svg')
//   .attr('viewBox', '0, 0, 1000, 1000')
//   .attr('transform', n => {
//     const shiftV = (+d3.select(' .opensankey #' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
//     const shiftH = (+d3.select(' .opensankey #' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
//     return 'translate(' + shiftH + ',' + shiftV + ')'
//   })
//   .attr('height', n => +d3.select(' .opensankey #' + n.idNode).attr('height') * (n.iconRatio) / 100)
//   .attr('width', n => +d3.select(' .opensankey #' + n.idNode).attr('width') * (n.iconRatio) / 100)
//   .attr('x', 0)
//   .append('g')
//   .append('path')
//   .style('fill', n =>node_icon_fill_color(data,n))
//   .attr('d', n =>node_icon_path(data,n))

// //------------------LABEL------------------------
// ggg_nodes
//   .append('text')
//   .attr('fill',n=>((n as SankeyPlusNode).display_style.label_color)?'white':'black')
//   .classed('node', true)
//   .classed('node_text', true)
//   .classed('test_new_file',true)
//   .attr('id', n => (n as SankeyPlusNode).idNode + '_text')
//   .attr('x',n => node_label_posX(n as SankeyPlusNode))
//   .attr('y', n => node_label_posY((n as SankeyPlusNode),data))
//   .attr('text-anchor', n => {
//     if ((n as SankeyPlusNode).x_label && data_v2.show_structure !== 'structure') {
//       return 'center'
//     } else if ((n as SankeyPlusNode).display_style.label_horiz  ===  'middle') {
//       return 'middle'
//     } else if ((n as SankeyPlusNode).display_style.label_horiz  ===  'left') {
//       return 'end'
//     } else if ((n as SankeyPlusNode).display_style.label_horiz  ===  'right') {
//       return 'start'
//     } else {
//       return 'start'
//     }
//   })
//   .attr('visibility', n => (n as SankeyPlusNode).node_visible && (n as SankeyPlusNode).label_visible ? 'visible' : 'hidden')
//   .style('text-align', 'center')
//   .style('font-weight', n => ((n as SankeyPlusNode).display_style.bold) ? 'bold' : 'normal')
//   .style('font-style', n => ((n as SankeyPlusNode).display_style.italic) ? 'italic' : 'normal')
//   .style('font-size', n => (n as SankeyPlusNode).display_style.font_size + 'px')
//   .style('text-transform', n => ((n as SankeyPlusNode).display_style.uppercase) ? 'uppercase' : 'none')
//   .text(n => node_label_text((n as SankeyPlusNode)))
//   .each(n => textNodeWrap((n as SankeyPlusNode),data))

// // Display value of nodes
// // Value of nodes are the maximum between the sum of input links and the sum of output links
// ggg_nodes.append('text')
//   .attr('fill',n=>((n as SankeyPlusNode).display_style.label_color)?'white':'black')
//   .classed('node', true)
//   .classed('node_text_value', true)
//   .attr('id', n => (n as SankeyPlusNode).idNode + '_text_value')
//   .attr('x', n =>node_value_posX(n as SankeyPlusNode))
//   .attr('y', n => node_value_posY(n as SankeyPlusNode))
//   .attr('text-anchor', () => 'middle')
//   .attr('visibility', n => (n as SankeyPlusNode).node_visible && (n as SankeyPlusNode).show_value ? 'visible' : 'hidden')
//   // .style('text-align', 'center')
//   // .style('font-weight', n => ((n as SankeyPlusNode).display_style.bold) ? 'bold' : 'normal')
//   // .style('font-style', n => ((n as SankeyPlusNode).display_style.italic) ? 'italic' : 'normal')
//   .style('font-size', n => (n as SankeyPlusNode).display_style.value_font_size + 'px')
//   // .style('text-transform', n => ((n as SankeyPlusNode).display_style.uppercase) ? 'uppercase' : 'none')
//   .text(n => textNodeValue((n as SankeyPlusNode),data,data_v2.links,data_v2.nodes))


// Object.values(new_nodes).map(d => {
//   d3.select(' .opensankey #gg_' + d.idNode).selectAll('*').transition().duration(500).style('opacity', 1)
// })


// //==================MODIFICATION NOEUD========================================
// const edit_nodes = Object.fromEntries(Object.entries(data_v2.nodes).filter(d => Object.keys(data_v1.nodes).includes(d[0])))

// Object.values(edit_nodes).map(d => {
//   d3.select(' .opensankey #ggg_' + d.idNode).transition().duration(500).attr('transform', 'translate(' + d.x + ',' + d.y + ')')
// })

// //====================AJOUT LIENS============================================

// d3.selectAll(' #svg #sankey_def').remove()
// const defGradient = d3.select(' #svg').append('defs').attr('id', 'sankey_def')

// const gg_links = d3
//   .select('.opensankey #g_links')
//   .selectAll('.gg_links')
//   .data(Object.values(data_v2.links))
//   .enter()
//   .filter(l => Object.keys(new_links).includes(l.idLink))
//   .append('g')
//   .attr('id', d => 'gg_' + d.idLink)
//   .attr('class', 'gg_links')
// // On gere la visibilité directement sur gg_nodes avec un display <inline />
//   .style('display', (d) => {
//     let display: string
//     if (link_visible(d, data_v2)) { display = 'inline' } else { display = 'none' }
//     return display
//   })
//   .attr('pointer-events', 'auto')
//   .attr('stroke-dasharray', d => {
//     return strokeDasharray(d,data,getLinkValue)
//   })

// const paths = gg_links.append('path')
// const positions: { [label_position: string]: string[] } = {
//   'frozen': ['50%', 'start'],
//   'beginning': ['10px', 'start'],
//   'middle': ['50%', 'start'],
//   'end': ['100%', 'end']
// }
// gg_links
//   .filter(
//     d => d.label_position !== 'frozen'
//   )
//   .append('text')
//   .attr('pointer-events', 'none')
// // .attr('style', 'font-weight: bold;font-family:Arial; font-size:' + data_v2.display_style.font_size + 'px;')
//   .attr('style',d=> 'font-weight: bold; font-size:' + d.label_font_size + 'px;')
//   .attr('fill', l => {

//     return l.text_color
//   })
//   .attr('dy', l => {
//     if (l.orthogonal_label_position === 'middle') {
//       return '0.3em'
//     } else if (l.orthogonal_label_position === 'below') {
//       const tmp=getLinkValue(data_v2, l.idLink).value
//       return scale((tmp)?tmp:0) / 2 + 10 + 'px'
//     } else if (l.orthogonal_label_position === 'above') {
//       const tmp=getLinkValue(data_v2, l.idLink).value

//       return -scale((tmp)?tmp:0) / 2 + 'px'
//     }
//     return '0.3em'
//   })
//   .append('textPath')
//   .attr('id', d => d.idLink + '_text')
//   .attr('side', link => {
//     if (link.recycling) {
//       if (data_v2.nodes[link.idSource].x < data_v2.nodes[link.idTarget].x) {
//         return 'left'
//       } else if (link.label_position === 'middle' && link.orientation === 'hh') {
//         return 'right'
//       }
//       return 'left'
//     } else {
//       if (data_v2.nodes[link.idSource].x < data_v2.nodes[link.idTarget].x) {
//         return 'left'
//       } else {
//         return 'right'
//       }
//       return 'left'
//     }
//   })
//   .attr('class', 'link_value')
//   .attr('href', d => '#' + d.idLink)
//   .attr('startOffset', l=>positions[l.label_position][0])
//   .attr('text-anchor', l=>positions[l.label_position][1])


// const select2 = gg_links
//   .filter(d => d.label_position === 'frozen' || !d.label_on_path || d.label_on_path === undefined)
//   .append('text')


// select2
//   .attr('href', d => '#' + d.idLink)
//   .attr('id', d => d.idLink + '_text')
//   .attr('class', 'link_value')
//   .attr('style',d=> 'font-weight: bold;font-size:' + d.label_font_size + 'px;')
//   .attr('fill', l => {
//     if (l.text_color === l.color && l.orthogonal_label_position === 'middle') {
//       return 'white'
//     }
//     return l.text_color
//   })
//   .attr('visibility', d => {
//     let tmp=getLinkValue(data_v2, d.idLink).value
//     tmp=(tmp)?tmp:0
//     return link_visible(d, data_v2) && tmp >= Math.max(data_v2.display_style.filter, data_v2.display_style.filter_label) ? 'visible' : 'hidden'
//   })

// paths
//   .attr('class', 'link')
//   .attr('id', d => {
//     return d.idLink})
//   .attr('fill', 'none')
// // .attr('stroke-opacity', d => data_v2.nodes[d.idSource].node_visible && data_v2.nodes[d.idTarget].node_visible && getLinkValue(data_v2, d.idLink).value >= data_v2.display_style.filter ? (!((data_v2 as unknown) as { show_uncert: boolean }).show_uncert && (String(getLinkValue(data_v2, d.idLink).display_value).includes('[')) ? 0.85 : 0.85) : 0)
//   .attr('stroke-opacity', d => {
//     let tmp=getLinkValue(data_v2, d.idLink).value
//     tmp=(tmp)?tmp:0
//     return data_v2.nodes[d.idTarget].node_visible && tmp >= data_v2.display_style.filter ? 0.5 : 0})
//   .attr('stroke-width', l => {


//     const node = data_v2.nodes[l.idSource]
//     const nodes = data_v2.nodes
//     //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs

//     //position noeud source ou target
//     let pos_x_src, pos_y_src
//     if (node.name === nodes[l.idSource].name) {
//       pos_x_src = nodes[l.idTarget].x
//       pos_y_src = nodes[l.idTarget].y
//     } else {
//       pos_x_src = nodes[l.idSource].x
//       pos_y_src = nodes[l.idSource].y
//     }
//     const link_values = getLinkValue(data, l.idLink)
//     const is_free = link_values.extension!.free_mini !== undefined &&
//                     data_v2.show_structure !== 'free_interval' &&
//                     data.show_structure !== 'free_value' &&
//                     !link_values.extension!.free_visible
//     if (is_free) {
//       return 5
//     }

//     const link_value = test_link_value(data, nodes, l)
//     //Zones limite à ne pas êtres
//     const limit_x = [pos_x_src - scale(+link_value), pos_x_src + node.node_width + scale(+link_value)]
//     const limit_y = [pos_y_src - scale(+link_value), pos_y_src + scale(+link_value)]

//     let draw_warning = false

//     //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
//     //si partie gauche du noeud ne se situe pas dans les coord du noeud source
//     const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
//     //si partie droite du noeud ne se situe pas dans le noeud source
//     const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
//     //si partie haute du noeud ne se situe pas dans le noeud source
//     const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
//     // const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]

//     if (l.orientation === 'hh') {
//       //orientation hh
//       draw_warning = left_in_src || right_in_src
//     } else if (l.orientation === 'vv') {
//       //orientation vv
//       draw_warning = top_in_src
//     } else if (l.orientation === 'vh') {
//       draw_warning = left_in_src || right_in_src || top_in_src
//     } else {
//       //orientation hv
//       //draw_warning = node_in_src_hh || node_in_src_vv
//       draw_warning = left_in_src || right_in_src || top_in_src
//     }

//     if (draw_warning && !l.recycling) {
//       return '1px'
//     } else {

//       const link_value = test_link_value(data_v2, data_v2.nodes, l)
//       return scale(Math.max(inv_scale(min_thickness), +link_value ? +link_value : 0))

//     }

//   })

//   .attr('stroke', l => {
//     if (d3.select(' .opensankey #' + l.idSource).empty()) {
//       return link_color(l,data_v2)
//     }
//     if (d3.select(' .opensankey #' + l.idTarget).empty()) {
//       return link_color(l,data_v2)
//     }
//     const width_src = +d3.select(' .opensankey #' + l.idSource).attr('width')
//     const height_src = +d3.select(' .opensankey #' + l.idSource).attr('height')
//     const width_trgt = +d3.select(' .opensankey #' + l.idTarget).attr('width')
//     //const height_trgt = +d3.select(' .opensankey #' + l.idTarget).attr('height')

//     const gradient = defGradient.append('defs')
//       .append('linearGradient')
//       .attr('id', 'gradient-' + l.idSource + '-' + l.idTarget)
//       .attr('gradientUnits', 'userSpaceOnUse')



//     gradient.append('stop')
//       .attr('id', 'stop-start')
//       .attr('offset', '0%')
//       .attr('stop-color', () => {

//         if (data_v2.nodes[l.idSource].x <= data_v2.nodes[l.idTarget].x) {
//           const n = data_v2.nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           const n = data_v2.nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       })
//       .attr('stop-opacity', 1)

//     gradient.append('stop')
//       .attr('id', 'stop-end')
//       .attr('offset', '100%')
//       .attr('stop-color', () => {
//         if (data_v2.nodes[l.idSource].x <= data_v2.nodes[l.idTarget].x) {
//           const n = data_v2.nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           const n = data_v2.nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       })
//       .attr('stop-opacity', 1)


//     const nodes = data_v2.nodes

//     if (l.orientation === 'hh' || l.orientation === 'hv') {
//       d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//         if (nodes[l.idSource].x < nodes[l.idTarget].x) {
//           d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//             .attr('x1', data_v2.nodes[l.idSource].x + width_src)
//             .attr('y1', '0')
//             .attr('x2', nodes[l.idTarget].x)
//             .attr('y2', 0)
//           const n = data_v2.nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//             .attr('x1', data_v2.nodes[l.idTarget].x + width_trgt)
//             .attr('y1', '0')
//             .attr('x2', nodes[l.idSource].x)
//             .attr('y2', 0)
//           const n = nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       }
//       )

//       d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//         if (nodes[l.idSource].x > nodes[l.idTarget].x) {
//           const n = nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           const n = nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       }
//       )
//     } else if (l.orientation === 'vv' || l.orientation === 'hv') {
//       //orientation vert-vert
//       d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//         if (nodes[l.idSource].y < nodes[l.idTarget].y) {
//           d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//             .attr('x1', 0)
//             .attr('y1', data_v2.nodes[l.idSource].y + height_src)
//             .attr('x2', 0)
//             .attr('y2', data_v2.nodes[l.idTarget].y)

//           const n = nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//             .attr('x1', 0)
//             .attr('y1', data_v2.nodes[l.idTarget].y + height_src)
//             .attr('x2', 0)
//             .attr('y2', data_v2.nodes[l.idSource].y)

//           const n = nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       }
//       )

//       d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//         if (nodes[l.idSource].y > nodes[l.idTarget].y) {
//           const n = nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           const n = nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       }
//       )
//     } else if (l.orientation === 'vh') {

//       d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
//         if (nodes[l.idSource].x < nodes[l.idTarget].x) {
//           d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//             .attr('x1', data_v2.nodes[l.idSource].x + width_src - 10)
//             .attr('y1', '0')
//             .attr('x2', nodes[l.idTarget].x)
//             .attr('y2', 0)
//           const n = nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         } else {
//           d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode)
//             .attr('x1', data_v2.nodes[l.idTarget].x + width_trgt + 10)
//             .attr('y1', '0')
//             .attr('x2', nodes[l.idSource].x)
//             .attr('y2', 0)
//           const n = nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color
//           } else {
//             return n.iconColor
//           }
//         }
//       }
//       )

//       d3.select(' .opensankey #gradient-' + nodes[l.idSource].idNode + '-' + nodes[l.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
//         if (nodes[l.idSource].x > nodes[l.idTarget].x) {
//           const n = nodes[l.idSource]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color as string
//           } else {
//             return n.iconColor as string
//           }
//         } else {
//           const n = nodes[l.idTarget]
//           if (n.colorParameter === 'groupTag') {
//             const selected_tag = n.tags[n.colorTag][0]
//             const tag = data_v2.nodeTags[n.colorTag].tags[selected_tag]
//             if (tag) {
//               return tag.color as string
//             }
//           }
//           if (n.shape_visible || n.iconName === 'none') {
//             return n.color as string
//           } else {
//             return n.iconColor as string
//           }
//         }
//       }
//       )

//     }
//     return (l.gradient && l.colorParameter==='local') ? 'url(#gradient-' + l.idSource + '-' + l.idTarget + ')' : link_color(l,data_v2) as string
//   }
//   )


// //Creation des Arrows associés au link
// d3.selectAll(' .opensankey .ggg_nodes')
//   .filter(m => {
//     const n = Object.values(data_v2.nodes).filter(d => d.idNode === (m as SankeyPlusNode).idNode)[0]
//     //test si les noeuds ont des les flux sortant, qu'il y a des flux sortant et que les noeuds sont présents dans la vue suivantes
//     //car les noeuds sélectionnés par d3.selectAll(' .opensankey .ggg_nodes') contient les noeuds qui sont en train d'être supprimé (cela est dût à la transition au debut de la fonction)
//     if (n !== undefined && n.inputLinksId.length != 0 && Object.keys(data_v2.links).length != 0 && Object.values(data_v2.nodes).map(d => d.idNode).includes(n.idNode)) {
//       return !n.node_visible || (!data_v2.links[n.inputLinksId[0]].arrow) ? false : true
//     } else {
//       return false
//     }
//   })
//   .each(function (m) {
//     const n = Object.values(data_v2.nodes).filter(d => d.idNode === (m as SankeyPlusNode).idNode)[0]
//     drawArrows(data_v2, n as SankeyPlusNode, data_v2.nodes, data_v2.links, data_v2.display_style, data_v2.nodeTags,scale,inv_scale,min_thickness,getLinkValue)
//   })

// Object.keys(new_links).forEach(l=>{
//   d3.select('.opensankey .defsArrow #arrow_'+l+' path').attr('opacity','0')
// })

// // gg_links.filter(d => k_links.includes(d.idLink)).selectAll('.arrow').style('opacity', '0')


// let error_msg: { text?: string | undefined } | undefined

// paths.attr('d', d => {
//   setNodesHeight(data_v2,data_v2.nodes, new_links, d, data_v2.nodeTags,getLinkValue)
//   return drawCurve(data_v2,
//     data_v2.nodes, new_links, data_v2.display_style,
//     data_v2.nodeTags, d, error_msg,{current:([] as SankeyPlusLink[])},link_text,sankey_plus_min_width_and_height,getLinkValue,drawArrows
//   )
// })
// if (error_msg && error_msg.text) {
//   alert(error_msg.text)
// }

// //===================MODIFICATION FLUX NOUVELLE VUE =======================
// const edit_links = Object.fromEntries(Object.entries(data_v2.links).filter(d => Object.keys(data_v1.links).includes(d[0])))
// const edit_arrow = d3.selectAll(' .opensankey .ggg_nodes')
//   .filter(m => {
//     const incl = (el: string) => Object.values(edit_links).map(d => d.idLink).includes(el)

//     const n = m as SankeyPlusNode
//     if (n.inputLinksId.length != 0 && Object.keys(data_v2.links).length != 0 && Object.values(data_v2.nodes).map(d => d.idNode).includes(n.idNode) && n.inputLinksId.some(incl)) {
//       return !n.node_visible || (!data_v2.links[n.inputLinksId[0]].arrow) ? false : true
//     } else {
//       return false
//     }
//   })

// // edit_arrow.selectAll('.arrow').remove()
// //Déplace les flêchesdéjà existant vers leur nouvelle position
// edit_arrow
//   .each(n => {
//     const new_n = Object.values(data_v2.nodes).filter(d => d.idNode === (n as SankeyPlusNode).idNode)[0]
//     drawArrows(data_v2, new_n as SankeyPlusNode, data_v2.nodes, data_v2.links, data_v2.display_style, data_v2.nodeTags,scale,inv_scale,min_thickness,getLinkValue)
//   })

// //Déplace les flux déjà existant vers leur nouvelle position
// Object.values(edit_links).map(d => {
//   d3.select(' .opensankey #' + d.idLink).transition().duration(500).attr('d', l => {
//     const d = l as SankeyPlusLink

//     const p = drawCurve(data_v2, data_v2.nodes, edit_links, data_v2.display_style, data_v2.nodeTags, d, error_msg,{current:([] as SankeyPlusLink[])},link_text,sankey_plus_min_width_and_height,getLinkValue,drawArrows)
//     return p
//   })
// })


const animate_view_changement = (views_data:SankeyPlusData) => {
  //Récupère parmi les noeuds, tous ceux qui emettent un nouveau flux sans en recevoir de nouveau
  const visible_links = Object.values(views_data.links).filter(l=>views_data.nodes[l.idSource].node_visible && views_data.nodes[l.idTarget].node_visible )
  const visible_linksId = visible_links.map(l=>l.idLink)
  const start_point = Object.values(views_data.nodes).filter(f =>
    (f.inputLinksId.filter(i => visible_linksId.includes(i)).length === 0) &&
    (f.outputLinksId.filter(i => visible_linksId.includes(i)).length > 0) &&
    (!('Type de noeud' in f.tags) || f.tags['Type de noeud'][0] !== 'échange')
  )
  let time_to_animate = 500
  Object.values(views_data.nodes).filter(f => {
    return (f.inputLinksId.filter(i => visible_linksId.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_linksId.includes(i)).length > 0)})
  //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
  if (start_point.length > 0) {
    let nb_animation = calcPath(views_data,views_data.nodes, start_point[0], visible_linksId)

    nb_animation = (nb_animation !== undefined) ? nb_animation : 0
    time_to_animate += nb_animation * 2000
  }
  // const glinks = (d3.select(' .opensankey #svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyPlusLink, HTMLElement, SankeyPlusLink>)
  //   .filter(function (d) {
  //     return visible_linksId.includes(d.idLink)
  //   })

  // glinks.selectAll('.link').style('stroke-opacity', 0)
  // glinks.selectAll('text').style('opacity', 0)
  // Animation des flux du Sankey
  //sankeyTooltip.style('opacity', 0)
  // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey
  setTimeout(function () {
    d3.select(' .opensankey #svg').selectAll('.defsArrow path').style('fill', '#dddddd')
    d3.select(' .opensankey #svg').selectAll('.link').style('stroke', '#dddddd')
    d3.select(' .opensankey #svg').selectAll('.node').style('fill', '#dddddd')
    d3.select(' .opensankey #svg').selectAll('.link_value').style('display', 'none')
    start_point.map(s => {
      branchAnimateForView(views_data, s, [s.idNode], visible_linksId)
    })
  }, 100)

  return time_to_animate

}

//fonction pour animer que les nouveaux liens
const branchAnimateForView = (
  data: SankeyPlusData,
  nodeData: SankeyPlusNode,
  nodeDisplay: string[],
  keys_links: string[]
) => {


  // Permet la progation de l'animation sur l'ensemble du Sankey
  const nodeStart = nodeData.idNode
  //const keys_links = Object.keys(new_links)
  const selection = d3.select(' .opensankey #' + nodeData.idNode)
  // on pourrait aussi evnetuellement faire un clone des noeuds
  if (selection.empty()) {
    return
  }
  d3.select(' .opensankey #' + nodeData.idNode).style('fill', d3.select(' .opensankey #' + nodeData.idNode).attr('fill'))
  d3.select(' .opensankey #' + nodeData.idNode + '_text').style('fill', d3.select(' .opensankey #' + nodeData.idNode).attr('fill'))
  // Animation des flux du Sankey
  //sankeyTooltip.style('opacity', 0)
  // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey


  const glinks = (d3.select(' .opensankey #svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyPlusLink, HTMLElement, SankeyPlusLink>)
    .filter(function (d) {
      return d.idSource === nodeStart && keys_links.includes(d.idLink)
    })
  // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
  const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')

  tmpLinks.selectAll('.link').style('stroke-opacity', 1)
  tmpLinks.selectAll('text').style('opacity', 0)

  // console.log(tmpLinks.nodes().map(d=>d3.select(d).attr('id')))

  // tmpLinks.selectAll('.link')
  //   .each(function (this) {
  //     const id=d3.select(this).attr('id')
  //     d3.select('.opensankey .defsArrow #arrow_'+id+' path').attr('opacity','0')
  //   })

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
        .style('stroke-opacity', 0.8)

      // const id=d3.select(this).attr('id')
      // d3.select('.opensankey .defsArrow #arrow_'+id+' path').attr('opacity','1')

    })
    .transition()
    .duration(2000)
    .attr('stroke-dashoffset', 0)
    .on('end', function (this) {
      const idLink = d3.select(this).attr('id')
      const idTarget = data.links[idLink].idTarget
      const id=d3.select(this).attr('id')
      d3.select('.opensankey .defsArrow #arrow_'+id+' path').attr('opacity',0.8)
      // Modification des arrows après l'animation
      // console.log(d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode))
      // const arrowInitColor = d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow').attr('fill')
      // d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.arrow')
      //   .style('fill', arrowInitColor)
      //   .style('opacity', 1)
      // Modification des arrows après l'animation
      const arrow=d3.select(' .opensankey #arrow_'+idLink)
      if(arrow !== undefined && arrow!= null){
        const colorTarget=(data.nodes[idTarget].shape_visible)?node_color(data.nodes[idTarget],data):((data.nodes[idTarget].iconVisible)?data.nodes[idTarget].iconColor:'grey')
        const t=(data.links[idLink].gradient && data.colorMap === 'no_colormap')?colorTarget:d3.select(this).attr('stroke')
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
        branchAnimateForView(data, data.nodes[idTarget], nodeDisplay, keys_links)
      }
    })
}

export const setValue = (
  dataTags: TagsGroup[],
  v_target: {[key:string] : SankeyLinkValue},
  v_source: {[key:string] : SankeyLinkValue},
  depth: number
) => {
  const dataTag = Object.values(dataTags)[depth]
  const listKey = Object.keys(dataTag.tags)
  for (const i in listKey) {
    if (depth === dataTags.length - 1 ) {
      v_target[listKey[i]] = v_source[listKey[i]]
    } else {
      if ( v_target[listKey[i]] === undefined ) {
        (v_target[listKey[i]] as SankeyLinkValueDict) = {}
      }
      setValue(
        dataTags,
        v_target[listKey[i]] as unknown as {[key:string] : SankeyLinkValue},
        v_source[listKey[i]] as unknown as {[key:string] : SankeyLinkValue},
        depth + 1)
    }
  }
}


export const get_data_from_view=(master_data:SankeyPlusData,id_view_to_see:string)=>{
  const applyChange = require('deep-diff').applyChange
  // Copy master data
  const data_init=JSON.parse(JSON.stringify(master_data))
  // Get the difference from the view
  const diff_view=master_data.view.filter(v=>v.id === id_view_to_see)[0].view_data.diff

  //const del_views = diff_view.filter((d : {path:string[],kind:string})=>((d.path[0] == 'nodes' || d.path[0] == 'links') && d.kind != 'D'))
  // Apply the changements saved in the view to the copy of master then return 'master data + modification saved in the view'
  //diff_view.filter((d : {path:string[],kind:string})=>((d.path[0] != 'nodes' && d.path[0] != 'links') || d.kind != 'D')).forEach((d : object)=>applyChange(data_init,{},d))
  return data_init
}

export const keyHandler = (
  e: KeyboardEvent,
  master:boolean,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  view:string,
  set_view:React.Dispatch<React.SetStateAction<string>>,
  set_animating:(b:boolean)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  set_show_toast_new_view:React.Dispatch<React.SetStateAction<boolean>>,
  set_show_toast_updated_view:React.Dispatch<React.SetStateAction<boolean>>,
  mode_selection:{current : string},
  OpenSankey_keyHandler:(
    e:KeyboardEvent,
    data:SankeyPlusData,
    multi_selected_nodes:{current:SankeyPlusNode[]},
    multi_selected_links:{current:SankeyPlusLink[]},
    set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
    accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
    button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
    mode_selection:{current : string})=>void,
  connected:boolean,
  min_width_and_height:(data:SankeyPlusData)=>number[],
  set_view_not_saved:(s:string)=>void
) => {
  // Applique le control de touche issu de opensankey (pour eviter de copier/coller et avoir de potentiel différence)
  // Apply keyHandling from opensankey (to avoid copy/paste that can generate error)
  OpenSankey_keyHandler(
    e, data,
    multi_selected_nodes,
    multi_selected_links,
    set_data,
    accordion_ref,
    button_ref,
    mode_selection)

  // if we have opensankey+ then we can save and modify view with CTRL+S
  if (connected && e.key === 's' && (e.ctrlKey||e.metaKey)) {
    e.preventDefault()
    const deep_diff = require('deep-diff')

    if (master) {
      // If we do a control+S while we are on master data, we create view empty
      // data is master data and master_data might not be  set
      const new_ind = 'view_' + String(new Date().getTime())
      const copy_data = {diff:[]}
      data.view.push({
        id: new_ind,
        view_data: copy_data,
        nom: 'data_' + new_ind,
        details: ''
      })
      // master data is now set
      set_master_data({...JSON.parse(JSON.stringify(data))})
      // at this stage data is a view and is equal with master data
      set_show_toast_new_view(true)
      setTimeout(function () {
        set_show_toast_new_view(false)
      }, 3000)
    } else {
      // If we do a control+S while we are on a view, we save the difference between the data we are handling
      // and the master data. These difference are the saved the view we are currently on

      // Get difference between master_data and the current data then save it in view
      let difference = deep_diff.diff(master_data, data)
      difference=(difference !== undefined)?difference:[]
      difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
      difference=JSON.parse(JSON.stringify(difference)).map((d:{path:string[],kind:string,item:{kind:string}})=>{
        if(d.kind === 'D'){
          delete ((d as unknown) as differenceType).lhs
        }
        if(d.kind === 'A' && d.item.kind === 'D'){
          delete ((d as unknown) as differenceType).item.lhs
        }
        if(d.kind === 'E'){
          delete ((d as unknown) as differenceType).lhs
        }
        return d
      })
      master_data.view.filter(v => v.id === view)[0].view_data = {diff:difference}

      // Save master data with the view we are currently working on updated
      set_master_data({...master_data})

      // set_data({...data})
      set_show_toast_updated_view(true)
      setTimeout(function () {
        set_show_toast_updated_view(false)
      }, 3000)
    }
  }
  if (!master && e.key === 'F6') {
    //appelle une fonction qui anime la vue suivante puis s'appelle recursivement jusqu'a ce qu'il n'y ai plus de vue
    let ind = 0
    if (master) {
      //data is master data
      set_master_data({...master_data})
      set_view(master_data.view[ind].id)
      // set_data({ ...master_data.view[ind].view_data as SankeyPlusData})
      set_data(get_data_from_view(master_data,master_data.view[ind].id))

      setTimeout(function () {
        nextView(master_data,set_data,master_data.view[ind].id,set_view,set_animating)
      }, 500)
    } else {
      // data is view data
      master_data.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante
      nextView(master_data, set_data,master_data.view[ind].id,set_view,set_animating)
    }
  }
  if (!master && e.key === 'F7') {

    // Check if there is unsaved change before we switch view
    // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
    let saved=true
    if(view !== 'none' && connected){
      const diff=check_current_view_saved(master_data,data,view)
      if(diff.length>0){
        saved=false
        set_view_not_saved(view)
        set_view('none')
      }
    }

    if(saved){
      set_view('none')
      set_data({ ...master_data })
    }
  }


  if ([ 'F8', 'F9'].includes(e.key)) {
    if (e.key === 'F8') {
      //Cherche la position de la vue sélectionné dans le tableau de vue
      let ind = -1
      master_data.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      if (ind === -1) {
        ind = 1
      } else if (ind===0) {
        ind = Object.keys(master_data.view).length
      }
      const data_view=get_data_from_view(master_data,master_data.view[ind-1].id) as SankeyPlusData
      const filtered_nodes = Object.values(data_view.nodes).filter(n=>n.idNode !== undefined)
      data_view.nodes = Object.assign({}, ...filtered_nodes.map(n => ({ [n.idNode]: { ...n } })))
      const filtered_links = Object.values(data_view.links).filter(l=>l.idLink !== undefined)
      data_view.links = Object.assign({}, ...filtered_links.map(l => ({ [l.idLink]: { ...l } })))
      apply_input_outputLinksId(
        data_view.nodes,
        data_view
      )
      const deep_diff = require('deep-diff')
      let difference = deep_diff.diff(master_data, data_view)
      difference=(difference!==undefined)?difference:[]
      difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
      master_data.view[ind+1].view_data = {diff:difference}
      set_data(data_view as SankeyPlusData)
      set_master_data(master_data as SankeyPlusData)

      // Check if there is unsaved change before we switch view
      // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
      let saved=true
      if(view !== 'none' &&  connected){
        const diff=check_current_view_saved(master_data,data,view)
        if(diff.length>0){
          saved=false
          set_view_not_saved(view)
          set_view(master_data.view[ind-1].id)
        }
      }
      if(saved){
        set_view(master_data.view[ind-1].id)
        // adjust_sankey_zone(master_data.view[ind-1].view_data as SankeyPlusData,min_width_and_height)
        adjust_sankey_zone(get_data_from_view(master_data,master_data.view[ind-1].id),min_width_and_height)
      }

    } else if (e.key === 'F9') {
      //Cherche la position de la vue sélectionné dans le tableau de vue
      let ind = -1
      master_data.view.map((v, i) => {
        ind = (v.id === view) ? i : ind
      })
      //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante
      if (ind === Object.keys(master_data.view).length - 1) {
        ind = -1
      } else if (ind === -1) {
        ind = -1
      }
      const data_view=get_data_from_view(master_data,master_data.view[ind+1].id) as SankeyPlusData
      const filtered_nodes = Object.values(data_view.nodes).filter(n=>n.idNode !== undefined) 
      data_view.nodes = Object.assign({}, ...filtered_nodes.map(n => ({ [n.idNode]: { ...n } })))
      const filtered_links = Object.values(data_view.links).filter(l=>l.idLink !== undefined)
      data_view.links = Object.assign({}, ...filtered_links.map(l => ({ [l.idLink]: { ...l } })))
      apply_input_outputLinksId(
        data_view.nodes,
        data_view
      )      
      set_data({...data_view as SankeyPlusData})
      const deep_diff = require('deep-diff')
      let difference = deep_diff.diff(master_data, data_view)
      difference=(difference!==undefined)?difference:[]
      difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
      master_data.view[ind+1].view_data = {diff:difference}
      set_master_data({...master_data as SankeyPlusData})
      // Check if there is unsaved change before we switch view
      // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
      let saved=true
      if(view !== 'none' && connected){
        const diff=check_current_view_saved(master_data,data,view)
        if(diff.length>0){
          saved=false
          set_view_not_saved(view)
          set_view(master_data.view[ind+1].id)
        }
      }
      if(saved){
        // adjust_sankey_zone(master_data.view[ind+1].view_data as SankeyPlusData,min_width_and_height)
        adjust_sankey_zone(get_data_from_view(master_data,master_data.view[ind+1].id),min_width_and_height)
        set_view(master_data.view[ind+1].id)
      }
      //}
    }
  }
}

const selecteur_view=(data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  set_view_not_saved:(s:string)=>void
)=>{
  return <Form.Select id="selectionNode" size='sm'
    onChange={
      (evt: React.ChangeEvent<HTMLSelectElement>) => {
        multi_selected_nodes.current = []
        multi_selected_links.current = []
        multi_selected_label.current = []
        // Depending on the value selected we :
        //  - If we select a view :Get a modified version of master data according to the modifications saved in the view selected
        //      and save original master data in a variable that the view can't modify
        //  - If we select master('none'): Get the data we are workinkg on to be the master data

        // Verify if we saved the view before changing the view
        // If not, we display a modal that will warn the user with the possibility to save before exit
        let saved=true
        if(view !== 'none'){
          const difference=check_current_view_saved(master_data,data,view)
          if(difference.length !== 0){
            saved=false
            set_view_not_saved(view)
            set_view(evt.target.value)
          }
        }

        if(saved){
          if (evt.target.value === '') {
            return
          }else if(evt.target.value !== 'none'){
            set_view(evt.target.value)

            const data_view=get_data_from_view(master_data,evt.target.value)
            if(view === 'none'){
              set_master_data({...JSON.parse(JSON.stringify(data))})
            }
            set_data(data_view as SankeyPlusData)

          } else if(evt.target.value === 'none'){
            set_view(evt.target.value)
            set_data({...master_data})
          }
        }
      }
    }
  >
    <option selected={view === 'none'} value={'none'}>{t('view.actual')}</option>
    {master_data ? master_data.view.map(d => {
      return <option key={d.id} selected={view === d.id} value={d.id}>{d.nom}</option>
    }) : <></>}
  </Form.Select>
}
export const viewsAccordion = (
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  nav_item_active: string,
  set_nav_item_active: (s:string)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  _load_json:{current:HTMLInputElement},
  t:TFunction,
  is_activated:boolean,
  set_view_not_saved:(s:string)=>void


) => {
  const selector=selecteur_view(data,set_data,view,set_view,multi_selected_nodes,multi_selected_links,multi_selected_label,master_data,set_master_data,t,set_view_not_saved)
  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)
  const popover_for_apply_display_from_view=<Popover id="popover-apply_display" style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{t('view.applyDisplayFromView')}</Popover.Header>
    <Popover.Body >
      <Form.Select id="selectionNode"
        onChange={
          (evt: React.ChangeEvent<HTMLSelectElement>) => {
            multi_selected_nodes.current = []
            multi_selected_links.current = []
            multi_selected_label.current = []

            const paramerters=['posNode','attrNode','attrFlux','tagNode','tagFlux','attrGeneral']

            if (evt.target.value === '') {
              return
            }else if(evt.target.value !== 'none'){
              const data_view=get_data_from_view(master_data,evt.target.value)
              data_view.view=[]
              updateLayout(data,data_view,paramerters)
              set_data({...data})
            } else if(evt.target.value === 'none'){
              const copy_master=JSON.parse(JSON.stringify(master_data))
              copy_master.view=[]
              updateLayout(data,copy_master,paramerters)
              set_data({...data})
            }
          }
        }
      >
        {view !== 'none'}<option disabled={view === 'none'} selected={view === 'none'} value={'none'}>{t('view.actual')}</option>
        {master_data ? master_data.view.map(d => {
          return <option key={d.id} disabled={view === d.id} selected={view === d.id} value={d.id}>{d.nom}</option>
        }) : <></>}
      </Form.Select>
    </Popover.Body>
  </Popover>

  return <><Accordion.Item
    id='Visualisation'
    eventKey="Visualisation"
    style={{ 'display': 'block' }}
    onClick={
      evt => {
        if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === 'Visualisation') {
          set_nav_item_active('')
        } else {
          set_nav_item_active('Visualisation')
        }
      }
    }>
    <Accordion.Header>Storytelling <Badge pill bg='info' style={{marginLeft:'auto'}}>Beta</Badge></Accordion.Header>
    <Accordion.Body>
      <OverlayTrigger
        key={'textZoneDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'textZoneDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <Form>
          <Row>
            <Col xs={3}>
              <FormLabel>{t('view.select')}</FormLabel>
            </Col>
            <Col xs={7}>
              <>{selector}</>
            </Col>
            <Col xs={2}>
              <OverlayTrigger
                key={'tooltip-apply_display'}
                placement={'left'}
                trigger={'click'}
                rootClose
                overlay={popover_for_apply_display_from_view}>
                <Button variant='danger' id='button-apply_display' >
                  <FaFileInvoice/>
                </Button>
              </OverlayTrigger>
            </Col>

          </Row>

          <Table bordered size='sm'>
            <thead>
              <tr>
                <th>{t('view.name')}</th>
                <th>Position</th>
                <th>{t('view.delete')}</th>
                <th>{t('view.copy')}</th>
                <th>{t('view.import')}</th>
                <th>{t('view.export')}</th>
              </tr>
            </thead>
            <tbody>
              {master_data ? Object.values(master_data.view).map(d => {
                return (
                  <tr style={{ 'border': (d.id === view) ? '2px solid red' : 'none' }}>
                    <td><FormControl size='sm'
                      value={d.nom}
                      disabled={!is_activated}
                      onChange={evt => {
                        // Change the name of the view
                        master_data.view.filter(v => v.id === d.id)[0].nom = evt.target.value
                        set_master_data({...master_data})

                      }}
                    /></td>
                    <td>
                      {/* Change the position of the view in the liste of view from master data */}
                      <ButtonGroup className="button_position" size="sm">
                        <Button
                          size="sm"
                          variant="success"
                          disabled={!is_activated}
                          onClick={
                            () => {
                              let ind = -1
                              master_data.view.map((v, i) => {
                                ind = (v.id === d.id) ? i : ind
                              })
                              const toShift = master_data.view[ind]
                              master_data.view.splice(ind, 1)
                              master_data.view.splice(ind - 1, 0, toShift)
                              set_master_data({...master_data})
                              set_data({ ...data })

                            }
                          }
                        ><FaArrowUp /></Button><Button
                          size="sm"
                          variant="success"
                          disabled={!is_activated}
                          onClick={
                            () => {
                              let ind = -1
                              master_data.view.map((v, i) => {
                                ind = (v.id === d.id) ? i : ind
                              })
                              const toShift = master_data.view[ind]
                              master_data.view.splice(ind, 1)
                              master_data.view.splice(ind + 1, 0, toShift)
                              set_master_data({...master_data})
                              set_data({ ...data })
                            }
                          }
                        ><FaArrowDown /></Button>
                      </ButtonGroup>

                    </td>
                    <td><Button
                      size="sm"
                      variant='danger'
                      disabled={!is_activated}
                      onClick={
                        // Delete the view
                        () => {
                          let ind = -1
                          master_data.view.map((v, i) => {
                            ind = (v.id === d.id) ? i : ind
                          })
                          master_data.view.splice(ind, 1)
                          set_view('none')
                          set_master_data({...master_data})
                          set_data({ ...master_data })
                        }
                      }
                    ><FaMinus /></Button></td>
                    <td><Button
                      disabled={!is_activated}
                      size="sm"
                      variant='success'
                      onClick={
                        () => {
                          // Create a copy of the view
                          const cur_view = d
                          const copy_view_data = JSON.parse(JSON.stringify(cur_view.view_data))
                          const new_ind = 'view_' + String(new Date().getTime())

                          copy_view_data.view = []
                          master_data.view.push({
                            id: new_ind,
                            view_data: copy_view_data,
                            nom: 'copy of ' + cur_view.nom,
                            details: ''
                          })
                          set_view(new_ind)
                          set_master_data({...master_data})
                          set_data(get_data_from_view(master_data,new_ind))
                        }
                      }
                    ><FaCopy /></Button></td>
                    <td><Button
                      size="sm"
                      variant='secondary'
                      onClick={
                        () => {
                          // Allow us to import a view by loading a sankey then updating the view like if we did a Ctrl+S
                          if (_load_json.current) {
                        _load_json.current!.name = ''
                        _load_json.current.click()
                        _load_json.current.id = d.id
                          }
                        }
                      }
                    ><FaFileImport /></Button></td>
                    <td>
                      <Button variant='warning'
                        onClick={()=>{
                          const to_download=get_data_from_view(master_data,d.id)
                          to_download.view=[]
                          clickSaveDiagram(to_download)
                        }}
                      ><FaFileExport/></Button>
                    </td>

                  </tr>
                )
              }) : <></>}
            </tbody>
          </Table>
          <Button onClick={()=>{
            master_data.view.forEach(v=>{
              const to_download=get_data_from_view(master_data,v.id)
              to_download.view=[]
              clickSaveDiagram(to_download)
            })
            }}>
              {t('view.exportAll')}
          </Button>
        </Form></OverlayTrigger>
    </Accordion.Body>
  </Accordion.Item>
  <Form.Control
    type="file"
    ref={_load_json}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files
      const reader = new FileReader()
      const deep_diff = require('deep-diff')

      reader.onload = (() => {
        return (e: ProgressEvent<FileReader>) => {
          const result = String((e.target as FileReader).result)
          const result_data = JSON.parse(result)
          let ind = -1
          master_data.view.map((v, i) => {
            ind = (v.id === _load_json.current!.id) ? i : ind
          })
          const cur_view = master_data.view[ind]
          const imported_data=JSON.parse(JSON.stringify(result_data))
          imported_data.view=[]
          convert_data(imported_data)
          let difference = deep_diff.diff(master_data,imported_data)
          difference=JSON.parse(JSON.stringify((difference !== undefined)?difference:[]))
          difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
          cur_view.view_data = {diff:difference}

          cur_view.nom = (files[0].name).replace('.json','')

          set_master_data({...master_data})
          set_data({...imported_data})
          set_view(cur_view.id)

        }
      })()
      reader.readAsText(files[0])
    }}
  />

  </>
}

// Function to check if the current data of the view is unsaved
// We compare the differences saved in the master_data with the current changement of the view
const check_current_view_saved=(master_data:SankeyPlusData,data:SankeyPlusData,view:string)=>{

  const deep_diff = require('deep-diff')
  const original_diff=get_data_from_view(master_data,view)
  let difference = deep_diff.diff(original_diff, data)
  difference=(difference !== undefined)?difference:[]
  difference=difference.filter((d:{path:string[],kind:string,item:{kind:string}})=>{
    // Ne prend pas en compte les modif de vue, de la largeur ou hauteur du sankey
    return d.path[0] !== 'view'  && (d.kind === 'E' && d.path[0] !== 'width') && (d.kind === 'E' && d.path[0] !== 'height')
  })

  return difference
}



declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: SankeyPlusData }
  }

// Fucntion that return a toolbar to navigate,create or modify view, it contain :
// - a button to return to master data
// - a button to create a view if we are currently on master data
// - 2 button to navigate in the list of view
// - a dropdown to directly select the view we want to display (or select master data)
export const SankeyPlusBannerView=(data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string,
  set_view:(s:string)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_links:{current:SankeyPlusLink[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  t:TFunction,
  connected:boolean,
  set_view_not_saved:(s:string)=>void

)=>{

  // const elementNavBar=document.getElementsByClassName('bg-light')[0]
  //const elementHerowrap=document.getElementsByClassName('herowrap')[0]

  // const height_Herowrap=(elementHerowrap)?elementHerowrap.getBoundingClientRect().height:0

  const m_d=master_data?master_data:data



  // Boolean used to change the logo of the button to save the current view :
  //  - if there is no differences between the the saved view and the current view, then the logo has a check
  //  - else if it contain difference, the logo contain an exclamation point
  let is_different=false
  if(view !== 'none' && connected){
    const diff=check_current_view_saved(master_data,data,view)
    if(diff.length>0){
      is_different=true
    }
  }



  return <><Button size='sm' variant= 'secondary' onClick={() => {
              const ev = document
              const tmp = { key: 'F7' }
              if (ev.onkeydown) {
                ev.onkeydown(tmp as KeyboardEvent)
              }
            }}>
              <FaHome />
            </Button>

            {!window.SankeyToolsStatic?<OverlayTrigger
              key={'buttonSaveViewDisabled'}
              placement={'bottom'}
              delay={500}
              overlay={(!connected)?(<Tooltip id={'buttonSaveViewDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
            >
              <Button size='sm' disabled={!connected} variant={'info'}
                onClick={() => {
                  const ev = document
                  const t=new KeyboardEvent('keydown',{key:'s',ctrlKey:true})
                  if (ev.onkeydown) {
                    ev.onkeydown(t)
                  }
                }}
              >{view === 'none'?<FontAwesomeIcon icon={faFileCirclePlus} />:(is_different?<FontAwesomeIcon icon={faFileCircleExclamation} />:<FontAwesomeIcon icon={faFileCircleCheck} />)}</Button>
            </OverlayTrigger>:<></>}

            <Button size='sm' variant={'success'}
              disabled={ m_d.view && (m_d.view.map(d=>d.id).indexOf(view) === 0 || view === 'none')}
              onClick={() => {
                const ev = document
                const tmp = { key: 'F8' }
                if (ev.onkeydown) {
                  ev.onkeydown(tmp as KeyboardEvent)
                }
              }}>
              <FaCaretSquareLeft />
            </Button>
            <Button size='sm' variant={'success'}
              disabled={m_d.view && (m_d.view.map(d=>d.id).indexOf(view) === m_d.view.length-1)}
              onClick={() => {
                const ev = document
                const tmp = { key: 'F9'}
                if (ev.onkeydown) {
                  ev.onkeydown(tmp as KeyboardEvent)
                }
              }}>
              <FaCaretSquareRight />
            </Button>
            {(master_data?master_data:{view:[] as string[]}).view.length>0?<>{selecteur_view(data,set_data,view,set_view,multi_selected_nodes,multi_selected_links,multi_selected_label,master_data,set_master_data,t,set_view_not_saved)}</>:<></>}
          
            </>
}

export const SankeyPlusMenuPreferenceView=(data:SankeyPlusData,set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,preferenceCheck:(str: string, data: SankeyPlusData) => void)=>{
  return <Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('Vis')} type="checkbox" label="Storytelling" onChange={() => {
    preferenceCheck('Vis',data)
    set_data({ ...data })
  }} />
}


// Modal used when we want to switch to master or a view without saving some changements we made on the current view
// It give the option save or not the changements made
export const modal_view_not_saved=(view_not_saved:string,set_view_not_saved:(s:string)=>void,t:TFunction,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  view:string

)=>{
  return (
    <Modal
      size="lg"
      show={view_not_saved !== ''}
      backdrop={'static'}
      centered>
      <Modal.Header>
        <Modal.Title>{t('view.ns')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {t('view.warn_ns')}
      </Modal.Body>
      <Modal.Footer>
        <Button variant='danger'
          onClick={()=>{
            // Don't save the view before changing to the selected one
            if(view !== 'none'){
              const data_view=get_data_from_view(master_data,view)
              set_data(data_view as SankeyPlusData)
            } else if(view === 'none'){
              set_data({...master_data})
            }
            set_view_not_saved('')
          }}
        >{t('view.dont_save')}</Button>
        <Button variant='success'
          onClick={()=>{
            // Save the view before changing to the selected one
            const deep_diff = require('deep-diff')
            let difference = deep_diff.diff(master_data, data)
            difference=(difference !== undefined)?difference:[]
            difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
            master_data.view.filter(v => v.id === view_not_saved)[0].view_data = {diff:difference}

            if(view !== 'none'){
              const data_view=get_data_from_view(master_data,view)
              set_master_data({...JSON.parse(JSON.stringify(data))})
              set_data(data_view as SankeyPlusData)

            } else if(view === 'none'){
              set_data({...master_data})
            }
            set_view_not_saved('')
          }}
        >{t('view.save')}</Button>
      </Modal.Footer>
    </Modal>)
}
import * as d3 from 'd3'
import { MutableRefObject } from 'react'
import { ReturnValueNode, AssignNodeLocalAttribute } from '../configmenus/SankeyUtils'
import { LinkTextFuncType, GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType } from '../configmenus/types/SankeyUtilsTypes'
import { dict_variable_application_dataType, dict_variable_elements_selectedType, SankeyNode, SankeyData } from '../types/Types'
import { RemoveAnimate, GetSankeyMinWidthAndHeight, DrawArrows, drawCurveFunction, LinkStrokeWidth } from './SankeyDrawFunction'
import { DragGNodeEventFType, dragNodeTextEventWidthBoxEventFType, DragNodesFType, drag_node_textFuncType, ReturnOutOfBoundElementFuncType, opposing_DragElementsFuncType, DragElementsFuncType } from './types/SankeyDragTypes'
import { DrawArrowsType } from './types/SankeyDrawFunctionTypes'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
  sankey: {
    sankey_data_file:RequestInfo
    sous_filieres : { [ key : string ] : string }
    units: string[]
    flask_logo? : string
    flask_header? : string
    logo_width? : number
    legend_average : string
    legend_uncert : string
    help_text : string
    welcome_text: string
    excel : string
    logo: string,
    advanced: boolean
  }
}

export const DragGNodeEvent: DragGNodeEventFType = (
  dict_variable_application_data: dict_variable_application_dataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  mode_selection: { current: string} ,
  alt_key_pressed: MutableRefObject<boolean>,
  LinkText: LinkTextFuncType,
  GetLinkValue: GetLinkValueFuncType,
  scale: (t: number) => number,
  inv_scale: (t: number) => number
) => {
  const { data, set_data } = dict_variable_application_data
  const node_visible = [] as string[]
  return d3.drag<SVGGElement, SankeyNode>()
    .subject(Object)
    .on('start', () => {
      RemoveAnimate()
      d3.selectAll('.node_shape').nodes().forEach(element => {
        node_visible.push(d3.select(element).attr('id'))
      })
    })
    .on('drag', function (event, node) {
      if (mode_selection.current == 's') {
        if (d3.select(event.subject.sourceEvent.target).node().tagName == 'tspan' && alt_key_pressed.current && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
          drag_node_text(node, event)
        } else if (d3.select(event.subject.sourceEvent.target).node().tagName == 'tspan' && !alt_key_pressed.current) {
          DragNodes(node, event, dict_variable_application_data, dict_variable_elements_selected, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows, scale, inv_scale, node_visible
          )
        }
        if (d3.select(event.subject.sourceEvent.target).node().tagName == 'rect' || d3.select(event.subject.sourceEvent.target).node().tagName == 'ellipse') {
          DragNodes(node, event, dict_variable_application_data, dict_variable_elements_selected, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows, scale, inv_scale, node_visible
          )
        }
      }
    }).on('end', () => {
      if (d3.select(document.activeElement).attr('class') !== 'input_label') {
        set_data(data)
      }
    })
}
/**
 *  Function to modify the label length threshold
 *The label length threshold is the max width a node label can have, if the label is wider then a line break
 * To change the label threshold on the sankey draw zone, select a node and a rectangle should appear around the label then drag the left or right face of this rectangle
 *
 * @param {SankeyData} data
 * @param {React.Dispatch<React.SetStateAction<SankeyData>>} set_data
 * @returns {*}
 */
export const dragNodeTextEventWidthBoxEvent: dragNodeTextEventWidthBoxEventFType = (
  data: SankeyData, set_data: (d: SankeyData) => void
) => {
  return d3.drag<SVGRectElement, SankeyNode>()
    .subject(Object).on('drag', function (event, node) {
      if (event.dx < 100) {
        // let pos_node=d3.select(' .opensankey #ggg_' + node.idNode).attr('transform').replace('translate(','')
        const pos_node = Number(d3.select(' .opensankey #shape_' + node.idNode).attr('width')) / 2
        d3.select(' .opensankey #ggg_' + node.idNode)
        // pos_node=pos_node.split(',')[0]
        const tmp = ReturnValueNode(data, data.nodes[node.idNode], 'label_box_width') as number
        const old_x = Number(d3.select(' .opensankey #ggg_' + node.idNode + ' .box_width_threshold').attr('x'))
        if (event.x < pos_node) {
          d3.select(' .opensankey #ggg_' + node.idNode + ' .box_width_threshold').attr('x', old_x + event.dx / 2)
          d3.select(' .opensankey #ggg_' + node.idNode + ' .box_width_threshold').attr('width', tmp + event.dx / 2)
          AssignNodeLocalAttribute(data.nodes[node.idNode], 'label_box_width', tmp - event.dx)
        } else {
          d3.select(' .opensankey #ggg_' + node.idNode + ' .box_width_threshold').attr('x', old_x - event.dx / 2)
          d3.select(' .opensankey #ggg_' + node.idNode + ' .box_width_threshold').attr('width', tmp - event.dx / 2)
          AssignNodeLocalAttribute(data.nodes[node.idNode], 'label_box_width', tmp + event.dx)
        }
      }
    }).on('end', () => {
      set_data({ ...data })
    })
}
/**
 * Function that shift the node when dragged (function called by dragGnodeEvent)
 *
 * @param {{ [node_id: string]: SankeyNode }} nodes
 * @param {{ [link_id: string]: SankeyLink }} links
 * @param {{ italic?: boolean; bold?: boolean; node_font_size: number;  uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number }} display_style
 * @param {TagsCatalog} nodeTags
 * @param {Element} dragged
 * @param {{ dx: number; dy: number }} event
 * @param {SankeyData} data
 * @param {{current: SankeyNode[] }} multi_selected_nodes
 * @param {()=>number[]} GetSankeyMinWidthAndHeight
 * @param {()=>void} DrawGrid
 * @param {(t:number)=>number} scale
 * @param {(t:number)=>number} inv_scale
 * @param {d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>} sankeyTooltip
 * @param {number} min_thickness
 * @param {SankeyDrawCurve} drawCurveFunction
 * @returns
 */


export const DragNodes: DragNodesFType = (
  node: SankeyNode,
  event: { dx: number; dy: number; x: number; y: number} ,
  dict_variable_application_data: dict_variable_application_dataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  LinkText: LinkTextFuncType,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue: GetLinkValueFuncType,
  DrawArrows: DrawArrowsType,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  node_visible: string[]
) => {
  const { data } = dict_variable_application_data
  const { multi_selected_nodes } = dict_variable_elements_selected
  // Cherche si des element seront hors zone si on les drag 
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
  const out_of_zone_item = ReturnOutOfBoundElement(node, data, event, multi_selected_nodes, node_visible)
  // Pousse les element non sélectionnés dans la direction opposé
  if (out_of_zone_item.length > 0) {
    OpposingDragElements(out_of_zone_item, event, node, data, multi_selected_nodes)
  }

  DragElements(node, dict_variable_application_data, dict_variable_elements_selected, event, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows, scale, inv_scale)

}/**
 * Function that shift node text when triggered
 *
 * @param {SankeyNode} node
 * @param {d3.D3DragEvent<Element, unknown, unknown>} event
 */
export const drag_node_text: drag_node_textFuncType = (
  node: SankeyNode,
  event: d3.D3DragEvent<Element, unknown, unknown>
) => {
  const old_x = +d3.select(' .opensankey #text_' + node.idNode).attr('x'), old_y = +d3.select(' .opensankey #text_' + node.idNode).attr('y'), new_x = old_x + event.dx, new_y = old_y + event.dy
  d3.select(' .opensankey #text_' + node.idNode).attr('x', new_x)
  d3.select(' .opensankey #text_' + node.idNode).attr('y', new_y)
  node.x_label = new_x
  node.y_label = new_y
  d3.select(' .opensankey #text_' + node.idNode).selectAll('tspan').attr('x', new_x)
}
export const ReturnOutOfBoundElement: ReturnOutOfBoundElementFuncType = (
  dragged: SankeyNode, data: SankeyData, event: { dx: number; dy: number; x: number; y: number} ,
  multi_selected_nodes: { current: SankeyNode[]} , node_visible: string[]
) => {
  // Cherche si des noeuds seront hors zone si on les drag 
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé


  const node = Object.keys(dragged).includes('idNode') ? dragged as SankeyNode : {} as SankeyNode

  const out_of_zone_item: (SankeyNode)[] = Object.values(data.nodes).filter(d => {
    const n = d as SankeyNode
    // Don't take into account node with relative position because they aren't reliable  
    if (n.position == 'relative' || !node_visible.includes('shape_' + n.idNode)) {
      return false
    }
    if (multi_selected_nodes.current.filter(n => n.position !== 'relative').length > 0) {
      return (n.x <= 0 && event.dx < 0) || (n.y <= 0 && event.dy < 0) || (n.x <= 0 && event.x < 0) || (n.y <= 0 && event.y < 0)
    } else if (Object.keys(node).length > 0 && node.position !== 'relative') {
      return node == n && (n.x <= 0 && event.dx < 0) || (n.y <= 0 && event.dy < 0) || (n.x <= 0 && event.x < 0) || (n.y <= 0 && event.y < 0)
    } else {
      return false
    }
  })

  return out_of_zone_item

}
export const OpposingDragElements: opposing_DragElementsFuncType = (out_of_zone_item: (SankeyNode)[],
  event: { dx: number; dy: number; x: number; y: number} ,
  dragged: SankeyNode,
  data: SankeyData,
  multi_selected_nodes: { current: SankeyNode[]} 
) => {
  const node = Object.keys(dragged).includes('idNode') ? dragged as SankeyNode : {} as SankeyNode

  if ((out_of_zone_item[0].x <= 0 && event.x < 0) || (out_of_zone_item[0].x <= 0 && event.dx < 0)) {
    // Shift not selected nodes to opposing direction
    Object.values(data.nodes).filter(nf => (multi_selected_nodes.current.length > 0 ? !multi_selected_nodes.current.includes(nf) : (Object.keys(node).length == 0 || nf !== node)) && nf.position !== 'relative').forEach(n_shift => {
      n_shift.x += 5
      d3.selectAll('#ggg_' + n_shift.idNode).attr('transform', 'translate(' + n_shift.x + ',' + n_shift.y + ')')
    })



    // Shift legend x 
    const transform_svg = d3.select('.opensankey #svg')?.attr('transform') ?? ''
    const scale_svg = (transform_svg) ? +transform_svg.split('scale(')[1].replace(')', '') : 1
    const scale_for_legend = (scale_svg < 1 ? (1 / scale_svg) : 1)
    data.legend_position[0] += 5
    d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale(' + scale_for_legend + ')')

  }


  if ((out_of_zone_item[0].y <= 0 && event.y < 0) || (out_of_zone_item[0].y <= 0 && event.dy < 0)) {
    // Shift not selected nodes to opposing direction
    Object.values(data.nodes).filter(nf => (multi_selected_nodes.current.length > 0 ? !multi_selected_nodes.current.includes(nf) : (Object.keys(node).length == 0 || nf !== node)) && nf.position !== 'relative').forEach(n_shift => {
      n_shift.y += 5
      d3.selectAll('#ggg_' + n_shift.idNode).attr('transform', 'translate(' + n_shift.x + ',' + n_shift.y + ')')
    })

    // Shift legend y 
    const transform_svg = d3.select('.opensankey #svg')?.attr('transform') ?? ''
    const scale_svg = (transform_svg) ? +transform_svg.split('scale(')[1].replace(')', '') : 1
    const scale_for_legend = (scale_svg < 1 ? (1 / scale_svg) : 1)
    data.legend_position[1] += 5
    d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale(' + scale_for_legend + ')')



  }
}
export const DragElements: DragElementsFuncType = (
  dragged: SankeyNode,
  dict_variable_application_data,
  dict_variable_elements_selected,
  event: { dx: number; dy: number; x: number; y: number} ,
  LinkText: LinkTextFuncType,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue: GetLinkValueFuncType,
  DrawArrows: DrawArrowsType,
  scale: (t: number) => number,
  inv_scale: (t: number) => number
) => {
  const { data, display_nodes, display_links } = dict_variable_application_data
  const { multi_selected_nodes } = dict_variable_elements_selected
  let error_msg: { text: string | undefined}  | undefined
  const node = Object.keys(dragged).includes('idNode') ? dragged as SankeyNode : {} as SankeyNode
  d3.selectAll('.ggg_nodes').filter((d) => {
    const n = d as SankeyNode
    // Filtre les neouds en position fix (géneralement les noeuds qui ne sont pas import/export)
    // Soit applique le changement au neouds sélectionnés si il y en a sinon, applique le changement au noeud draggé
    if (multi_selected_nodes.current.filter(n => n.position !== 'relative').length > 0) {
      return multi_selected_nodes.current.filter(n => n.position !== 'relative').includes(n)
    } else if (Object.keys(node).length > 0 && node.position !== 'relative') {
      return node == n
    } else {
      return false
    }
  }).attr('transform', (d) => {
    const n = d as SankeyNode
    n.x += event.dx
    n.y += event.dy
    if (n.x < 0) {
      n.x = 0
    }
    if (n.y < 0) {
      n.y = 0
    }
    return 'translate(' + n.x + ',' + n.y + ')'
  })


  if (multi_selected_nodes.current.length > 0) {
    // We redraw each arrows linked to a selected nodes after shifting it
    multi_selected_nodes.current.filter(n => n.position !== 'relative').forEach(n => [
      DrawArrows(n as SankeyNode, data, display_nodes, display_links, scale, inv_scale, GetLinkValue, data.display_style)
    ])
    // we redraw link linked to dragged nodes
    multi_selected_nodes.current.forEach(n => {
      Object.values(data.links).filter(l => n.outputLinksId.includes(l.idLink) || n.inputLinksId.includes(l.idLink)).forEach(l => {
        d3.select(' .opensankey #path_' + l.idLink).attr('d',
          drawCurveFunction.curve(
            dict_variable_application_data,
            dict_variable_elements_selected,
            data.display_style,
            data.nodeTags, l, error_msg, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue,
            DrawArrows
          )
        )
      })
    })
  } else if (Object.keys(node).length > 0) {

    DrawArrows(node as SankeyNode, data, display_nodes, display_links, scale, inv_scale, GetLinkValue, data.display_style)
    Object.values(data.links).filter(l => node.outputLinksId.includes(l.idLink) || node.inputLinksId.includes(l.idLink)).forEach(l => {
      d3.select(' .opensankey #path_' + l.idLink).attr('d',
        drawCurveFunction.curve(
          dict_variable_application_data,
          dict_variable_elements_selected,
          data.display_style,
          data.nodeTags, l, error_msg, LinkText,
          GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows
        )
      )
      d3.select(' .opensankey #path_' + l.idLink).attr('stroke-width', LinkStrokeWidth(l, data, scale, inv_scale, 2, data.nodes, GetLinkValue))
      // if the target is an export node and it has trad_close variable at true then we redraw this node arrow too
      const node_t = (data.nodes[l.idTarget] as unknown as { trade_close: boolean} )
      if (node_t !== undefined && node_t.trade_close) {
        DrawArrows(node_t as unknown as SankeyNode, data, display_nodes, display_links, scale, inv_scale, GetLinkValue, data.display_style)

      }
    })
  }
}


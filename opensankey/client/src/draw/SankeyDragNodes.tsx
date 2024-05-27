import * as d3 from 'd3'
import { ReturnValueNode, AssignNodeLocalAttribute } from '../configmenus/SankeyUtils'
import { LinkTextFuncType, GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType } from '../configmenus/types/SankeyUtilsTypes'
import { applicationDataType, applicationStateType, SankeyNode, SankeyData, SankeyLink } from '../types/Types'
import { RemoveAnimate, DrawArrows, drawCurveFunction, LinkStrokeWidth, returnScaleOfDrawArea, sizeOfNodeInDrawArea, DrawGrid } from './SankeyDrawFunction'
import { DragGNodeEventFType, dragNodeTextEventWidthBoxEventFType, DragNodesFType, drag_node_textFuncType, ReturnOutOfBoundElementFuncType, opposing_DragElementsFuncType, DragElementsFuncType } from './types/SankeyDragTypes'
import { DrawArrowsType } from './types/SankeyDrawFunctionTypes'
import { shiftAllArrowPath, shiftAllLinkPath } from './SankeyDrawEventFunction'

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
  applicationData,
  applicationState,
  applicationContext,
  alt_key_pressed,
  LinkText,
  GetLinkValue,
  scale,
  inv_scale,
  ComponentUpdater,
  node_function,
  link_function,
  GetSankeyMinWidthAndHeight,
  resizeCanvas
) => {
  const {ref_getter_mode_selection}=applicationState
  const {data} = applicationData
  const node_visible = [] as string[]
  return d3.drag<SVGGElement, SankeyNode>()
    .subject(Object)
    .on('start', () => {

      RemoveAnimate()
      d3.selectAll('.node_shape').nodes().forEach(element => {
        node_visible.push(d3.select(element).attr('id'))
      })
      //hideLinkOnDragElement(applicationData)
    })
    .on('drag', function (event, node) {
      if (ref_getter_mode_selection.current == 's') {
        // If we drag the node label we check if we press 'alt' key
        // If true then we only drag the label and 'detach' it from the node 
        // (the position of the label is not by label_vert & label_horiz, but by coordinate relative to the node )
        // Else if we don't press 'alt' we drag the node (with the label)
        if (d3.select(event.subject.sourceEvent.target).node().tagName == 'tspan' && alt_key_pressed.current && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
          drag_node_text(node, event)
        } else if (d3.select(event.subject.sourceEvent.target).node().tagName == 'tspan' && !alt_key_pressed.current) {
          DragNodes(node, event, applicationData, applicationState,applicationContext, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows, scale, inv_scale, node_visible,
            ComponentUpdater
          )
        }
        if (d3.select(event.subject.sourceEvent.target).node().tagName == 'rect' || d3.select(event.subject.sourceEvent.target).node().tagName == 'ellipse' || d3.select(event.subject.sourceEvent.target).node().tagName == 'path') {
          DragNodes(node, event, applicationData, applicationState,applicationContext, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows, scale, inv_scale, node_visible,
            ComponentUpdater
          )
        }
      }
    }).on('end', function(_,node){
      if (d3.select(document.activeElement).attr('class') !== 'input_label') {
        // update all nodes connected to dragged node & all links connected to these nodes
        const node_to_update:SankeyNode[]=[node]
        node.outputLinksId.forEach(lid=>node_to_update.push(data.nodes[data.links[lid].idTarget]))
        node.inputLinksId.forEach(lid=>node_to_update.push(data.nodes[data.links[lid].idSource]))

        let link_to_update:SankeyLink[]=[]
        node_to_update.forEach(node=>{
          link_to_update=link_to_update.concat(node.outputLinksId.map(lid=>data.links[lid]))
          link_to_update=link_to_update.concat(node.inputLinksId.map(lid=>data.links[lid]))
        })
        // Seems not necessary and if decommented it desactivates the click
        // node_function.RedrawNodes(node_to_update)
        //link_function.RedrawLinks(link_to_update)
        ComponentUpdater.updateComponenSaveInCache.current(false)
        resizeCanvas(applicationData)
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
  data: SankeyData
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
  applicationData: applicationDataType,
  applicationState: applicationStateType,
  applicationContext,
  LinkText,
  GetSankeyMinWidthAndHeight,
  GetLinkValue,
  DrawArrows,
  scale,
  inv_scale,
  node_visible,
  ComponentUpdater
) => {
  // const { data } = applicationData
  // const { multi_selected_nodes } = applicationState
  // Cherche si des element seront hors zone si on les drag 
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
  // const out_of_zone_item = ReturnOutOfBoundElement(node, data, event, multi_selected_nodes, node_visible)
  // // Pousse les element non sélectionnés dans la direction opposé
  // if (out_of_zone_item.length > 0) {
  //   OpposingDragElements(out_of_zone_item, event, node, applicationData, multi_selected_nodes)
  // }

  DragElements(
    node, applicationData, 
    applicationState,applicationContext, 
    event, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue, 
    DrawArrows, scale, inv_scale,ComponentUpdater
  )

}

/**
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

/**
 * Shift all node not selected to the opposing direction of the event
 *
 * @param {(SankeyNode)[]} out_of_zone_item
 * @param {{ dx: number; dy: number; x: number; y: number}} event
 * @param {SankeyNode} dragged
 * @param {SankeyData} data
 * @param {{ current: SankeyNode[]}} multi_selected_nodes
 */
export const OpposingDragElements: opposing_DragElementsFuncType = (out_of_zone_item: (SankeyNode)[],
  event: { dx: number; dy: number; x: number; y: number} ,
  dragged: SankeyNode,
  applicationData:applicationDataType,
  multi_selected_nodes: { current: SankeyNode[]} 
) => {
  const {data,display_links}=applicationData
  const node = Object.keys(dragged).includes('idNode') ? dragged as SankeyNode : {} as SankeyNode

  if ((out_of_zone_item[0].x <= 0 && event.x < 0) || (out_of_zone_item[0].x <= 0 && event.dx < 0)) {
    // Shift not selected nodes to opposing direction
    Object.values(data.nodes).filter(nf => (multi_selected_nodes.current.length > 0 ? !multi_selected_nodes.current.includes(nf) : (Object.keys(node).length == 0 || nf !== node)) && nf.position !== 'relative').forEach(n_shift => {
      n_shift.x -= event.dx
      d3.selectAll('#ggg_' + n_shift.idNode).attr('transform', 'translate(' + n_shift.x + ',' + n_shift.y + ')')
    })

    if(Object.values(applicationData.display_links).length<20){
      const couter_event={x:event.x,y:event.y,dx:-event.dx,dy:0} as d3.D3DragEvent<Element, unknown, unknown>
      shiftAllLinkPath(couter_event)
      shiftAllArrowPath(couter_event)
    }

    // Shift free label of links x_label
    Object.values(display_links).filter(l=>l.x_label!==undefined).forEach(l=>{
      (l.x_label as number)-=event.dx
    })

    // Shift legend x 
    const scale_svg=returnScaleOfDrawArea()
    const scale_for_legend = (scale_svg < 1 ? (1 / scale_svg) : 1)
    data.legend_position[0] -= event.dx
    d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale(' + scale_for_legend + ')')
  }

  if ((out_of_zone_item[0].y <= 0 && event.y < 0) || (out_of_zone_item[0].y <= 0 && event.dy < 0)) {
    // Shift not selected nodes to opposing direction
    Object.values(data.nodes).filter(nf => (multi_selected_nodes.current.length > 0 ? !multi_selected_nodes.current.includes(nf) : (Object.keys(node).length == 0 || nf !== node)) && nf.position !== 'relative').forEach(n_shift => {
      n_shift.y -= event.dy
      d3.selectAll('#ggg_' + n_shift.idNode).attr('transform', 'translate(' + n_shift.x + ',' + n_shift.y + ')')
    })

    if(Object.values(applicationData.display_links).length<20){
      const couter_event={x:event.x,y:event.y,dx:0,dy:-event.dy} as d3.D3DragEvent<Element, unknown, unknown>
      shiftAllLinkPath(couter_event)
      shiftAllArrowPath(couter_event)
    }

    // Shift free label of links y_label
    Object.values(display_links).filter(l=>l.y_label!==undefined).forEach(l=>{
      (l.y_label as number)-=event.dy
    })

    // Shift legend y 
    const scale_svg=returnScaleOfDrawArea()
    const scale_for_legend = (scale_svg < 1 ? (1 / scale_svg) : 1)
    data.legend_position[1] -= event.dy
    d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale(' + scale_for_legend + ')')
  }


}
export const DragElements: DragElementsFuncType = (
  dragged: SankeyNode,
  applicationData,
  applicationState,
  applicationContext,
  event: { dx: number; dy: number; x: number; y: number} ,
  LinkText: LinkTextFuncType,
  GetSankeyMinWidthAndHeight: GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue: GetLinkValueFuncType,
  DrawArrows: DrawArrowsType,
  scale: (t: number) => number,
  inv_scale: (t: number) => number,
  ComponentUpdater

) => {
  const { data } = applicationData
  const { multi_selected_nodes } = applicationState
  let error_msg: { text: string | undefined}  | undefined
  const node = Object.keys(dragged).includes('idNode') ? dragged as SankeyNode : {} as SankeyNode
  d3.selectAll('.ggg_nodes').filter((d) => {
    const n = d as SankeyNode
    // Filtre les neouds en position fix (géneralement les noeuds qui ne sont pas import/export)
    // Soit applique le changement au neouds sélectionnés si il y en a sinon, applique le changement au noeud draggé
    if (multi_selected_nodes.current.includes(node) && multi_selected_nodes.current.filter(n => n.position !== 'relative').length > 0) {
      return multi_selected_nodes.current.filter(n => n.position !== 'relative').includes(n)
    } else if (multi_selected_nodes.current.length==0 && (Object.keys(node).length > 0 && node.position !== 'relative')) {
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

    const pos_n=sizeOfNodeInDrawArea(n,applicationData)
    const margin=data.grid_square_size*2
    if((pos_n[0]+margin)>applicationData.data.width){
      const svgSankey = d3.select('.opensankey #svg')
      svgSankey.style('width', (pos_n[0]+margin) + 'px')
      applicationData.data.width = pos_n[0]+margin
      DrawGrid(data)
    }
    if((pos_n[1]+margin)>applicationData.data.height){
      const svgSankey = d3.select('.opensankey #svg')
      svgSankey.style('height', (pos_n[1]+margin) + 'px')
      applicationData.data.height = pos_n[1]+margin
      DrawGrid(data)
    }
    return 'translate(' + n.x + ',' + n.y + ')'
  })


  if (multi_selected_nodes.current.length > 1) {
    // We redraw each arrows linked to a selected nodes after shifting it
    multi_selected_nodes.current.filter(n => n.position !== 'relative').forEach(n => [
      DrawArrows(n as SankeyNode, applicationData, scale, inv_scale, GetLinkValue, data.display_style)
    ])
    // we redraw link linked to dragged nodes
    multi_selected_nodes.current.forEach(n => {
      Object.values(data.links).filter(l => n.outputLinksId.includes(l.idLink) || n.inputLinksId.includes(l.idLink)).forEach(l => {
        d3.select(' .opensankey #path_' + l.idLink).attr('d',
          drawCurveFunction.curve(
            applicationData,
            applicationState,
            applicationContext,
            data.display_style,
            data.nodeTags, l, error_msg, LinkText, GetSankeyMinWidthAndHeight, GetLinkValue,
            DrawArrows,ComponentUpdater,scale,inv_scale
          )
        )
      })
    })
  } else if (Object.keys(node).length > 0 || (multi_selected_nodes.current.length==1 && multi_selected_nodes.current[0]==node)) {
    DrawArrows(node as SankeyNode, applicationData, scale, inv_scale, GetLinkValue, data.display_style)
    Object.values(data.links).filter(l => node.outputLinksId.includes(l.idLink) || node.inputLinksId.includes(l.idLink)).forEach(l => {
      d3.select(' .opensankey #path_' + l.idLink).attr('d',
        drawCurveFunction.curve(
          applicationData,
          applicationState,
          applicationContext,
          data.display_style,
          data.nodeTags, l, error_msg, LinkText,
          GetSankeyMinWidthAndHeight, GetLinkValue, DrawArrows,ComponentUpdater,scale,inv_scale
        )
      )
      d3.select(' .opensankey #path_' + l.idLink).attr('stroke-width', LinkStrokeWidth(l,applicationData, scale, inv_scale, GetLinkValue))
      // if the target is an export node and it has trad_close variable at true then we redraw this node arrow too
      const node_t = (data.nodes[l.idTarget] as unknown as { trade_close: boolean} )
      if (node_t !== undefined && node_t.trade_close) {
        DrawArrows(node_t as unknown as SankeyNode, applicationData, scale, inv_scale, GetLinkValue, data.display_style)

      }
    })
  }
}

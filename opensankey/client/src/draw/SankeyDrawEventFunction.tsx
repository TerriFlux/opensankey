import * as d3 from 'd3'
import {
  ReturnValueLink,
  DefaultNode,
  ReturnValueNode,
  DefaultLink,
  AssignLinkLocalAttribute
} from '../configmenus/SankeyUtils'
import {
  SankeyData,
  SankeyLink,
  SankeyLinkValue,
  SankeyNode,
} from '../types/Types'
import {
  DeselectVisualyLinks,
  DeselectVisualyNodes,
  LinkVisibleOnSvg,
  NodeStrokeWidth,
  NodeVisibleOnsSvg,
  SelectVisualyLinks,
  SelectVisualyNodes,
  SortOutputLinksIdByYPos,
  ValueSelectedParameter,
  returnScaleOfDrawArea,
} from './SankeyDrawFunction'
import { draw_legend_handles } from './SankeyDrawLegend'
import {
  EventLinkContextMenuFType,
  EventNodeClickFType,
  EventNodeContextMenuFType,
  EventOnMouseUpAddNodesAndLinkFType,
  EventOnZoneMouseDownFuncType,
  EventOnZoneMouseMoveFuncType,
  EventOnZoneMouseUpFuncType,
  EventZDDContextMenuFType,
  SimpleGNodeClickFuncType,
  SvgDragMiddleMouseMoveFuncType,
  SvgDragMiddleMouseStartFuncType,
  ZoomFunctionFuncType,
  actualizeDrawAreaFrameFType,
  applyZoomEventFType,
  selectOpenSankeyElementsInSelectionZoneFType
} from './types/SankeyDrawEventFunctionTypes'
import { RedrawNodesLabel } from './SankeyDrawNodesLabel'




/**
 * Function triggerd on click on nodes
 * Add or delete visual element to show that the node is selected like a thickker border
 *
 * @param applicationData
 * @param uiElementsRef
 * @param applicationState
 * @param event
 * @param d
 * @param sankeyTooltip
 */
export const EventNodeClick : EventNodeClickFType =(
  //applicationData,
  uiElementsRef,
  applicationState,
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  ComponentUpdater,
)=>{
  const {ref_getter_mode_selection, multi_selected_nodes}=applicationState
  const {nodes_accordion_ref,accordion_ref,button_ref}=uiElementsRef
  const {updateComponentMenuConfigNode,updateComponentMenuConfigNodeAppearence,updateComponentMenuNodeIOSelectSideNode,updateMenuConfigTextNodeTooltip}=ComponentUpdater
  multi_selected_nodes.current.forEach(n=>DeselectVisualyNodes(n))
  if (  (event.ctrlKey || event.metaKey)) {
    ref_getter_mode_selection.current='s'
    d3.select(' .opensankey #svg').attr('class','mode_selection')
    sankeyTooltip.style('opacity', 0)
    multi_selected_nodes.current = multi_selected_nodes.current.filter(d => (d != null && d.name != ''))
    if (multi_selected_nodes.current.includes(d)) {
      multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(d), 1)
    } else {
      multi_selected_nodes.current.push(d)
      if(multi_selected_nodes.current.length==1){
        d3.select(' .opensankey #ggg_' + d.idNode+' .box_width_threshold').attr('visibility','visible')
      }
    }

    if (button_ref && button_ref.current && accordion_ref && accordion_ref.current == null) {
      button_ref.current.click()
    }
    // Open element accordion if not already openend
    if (
      accordion_ref &&
      accordion_ref.current &&
      d3.select(accordion_ref.current).attr('aria-expanded')==='false'
    ) {
      accordion_ref.current.click()
    }

    // Open node accordion if not already openend
    if (
      nodes_accordion_ref &&
      nodes_accordion_ref.current &&
      d3.select(nodes_accordion_ref.current).attr('aria-expanded')==='false'
    ) {
      nodes_accordion_ref.current.click()
    }

    d3.select(' .opensankey #ggg_' + d.idNode + ' rect')
      .style('stroke-width', d => {
        const dd = (d as SankeyNode)
        return NodeStrokeWidth(dd,multi_selected_nodes)
      })
    multi_selected_nodes.current.forEach(n=>SelectVisualyNodes(n))

  }else if(!event.ctrlKey){
    // If we click a node without pressing Ctrl then we select only the node cliked
    multi_selected_nodes.current = multi_selected_nodes.current.filter(d => (d != null && d.name != ''))
    if (multi_selected_nodes.current.includes(d)) {
      multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(d), 1)
    } else {
      multi_selected_nodes.current=[d]
    }
    d3.select(' .opensankey #ggg_' + d.idNode + ' rect')
      .style('stroke-width', d => {
        const dd = (d as SankeyNode)
        return NodeStrokeWidth(dd,multi_selected_nodes)
      })
    multi_selected_nodes.current.forEach(n=>SelectVisualyNodes(n))
  }
  updateComponentMenuConfigNode.current()
  updateComponentMenuConfigNodeAppearence.current()
  updateComponentMenuNodeIOSelectSideNode.current.forEach(f => f())
  updateMenuConfigTextNodeTooltip.current.forEach(f=>f())
}

export const EventNodeContextMenu: EventNodeContextMenuFType = (
  ev,
  n,
  contextMenu,
  multi_selected_nodes
) => {
  const { pointer_pos, ref_setter_contextualised_node, ref_contextualised_node } = contextMenu
  ev.preventDefault()
  pointer_pos.current = [ev.pageX, ev.pageY]
  if (multi_selected_nodes.current.includes(n)) {
    ref_setter_contextualised_node.current!(n)
    ref_contextualised_node.current = n
  } else {
    multi_selected_nodes.current.forEach(nn => DeselectVisualyNodes(nn))
    multi_selected_nodes.current = []
    SelectVisualyNodes(n)
    multi_selected_nodes.current.push(n)
    ref_setter_contextualised_node.current!(n)
    ref_contextualised_node.current = n
  }
  //const style_c_n=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  //ontextNodeRef.current!.attributes[4].value = 'max-width: 100%; position: absolute; inset: '+style_c_n
  //contextNodeRef.current!.hidden = false
  //updateStatecontextNode.current![0][1](!updateStatecontextNode.current![0][0])
}

export const EventLinkContextMenu: EventLinkContextMenuFType = (
  applicationData,
  ev,
  l: SankeyLink,
  ref_setter_contextualised_link,
  pointer_pos,
  applicationState,
  tags_selected,
) => {
  const { data } = applicationData
  const {displayedInputLinkValueSetterRef,displayedInputLinkDataTagSetterRef,multi_selected_links,ref_display_link_opacity}=applicationState
  ev.preventDefault()
  pointer_pos.current = [ev.pageX, ev.pageY]
  if (multi_selected_links.current.includes(l)) {
    ref_setter_contextualised_link.current!(l)
  } else {
    multi_selected_links.current.forEach(ll => DeselectVisualyLinks(ll))
    multi_selected_links.current = []
    SelectVisualyLinks(l)
    multi_selected_links.current.push(l)
    ref_setter_contextualised_link.current!(l)
  }
  const link_data_ref = l.idLink
  let new_tags_selected = tags_selected

  let valueLinkInContext:SankeyLinkValue=ValueSelectedParameter(
    applicationData,
    multi_selected_links,
    new_tags_selected
  )

  if (link_data_ref.includes('_')) {
    const index_grp_tag = link_data_ref.split('_')
    // Supprime le première élément du tableau qui ne contient que l'id du flux
    index_grp_tag.shift()
    new_tags_selected = {}
    // On fabrique un tags_selected pour récupérer la bonne valeur pour ValueSelectedParameter
    for (const i in index_grp_tag) {
      const key = Object.keys(data.dataTags)[Number(i)]
      new_tags_selected[key] = Object.keys(Object.values(data.dataTags)[Number(i)].tags)[Number(index_grp_tag[i])]
    }

    valueLinkInContext=ValueSelectedParameter(
      applicationData,
      multi_selected_links,
      tags_selected
    )
    displayedInputLinkDataTagSetterRef.current.forEach(setter => setter(
      new_tags_selected
    ))

    displayedInputLinkValueSetterRef.current.forEach(setter => setter(
      valueLinkInContext.value as string
    ))
  } else if (Object.values(data.dataTags).length > 0) {
    // Dans le cas où il n'y a pas de '_' ce qui implique que les datatags sont en mode selection simple
    const tmp = [] as string[]
    Object.values(data.dataTags).forEach(dt => {
      tmp.push(Object.entries(dt.tags).filter(t => t[1].selected)[0][0])
    })
    const n_t_s = {} as { [x: string]: string}
    Object.keys(data.dataTags).forEach((dt, i) => {
      n_t_s[dt] = tmp[i]
    })
    valueLinkInContext=ValueSelectedParameter(
      applicationData,
      multi_selected_links,
      n_t_s
    )
    displayedInputLinkDataTagSetterRef.current.forEach(setter => setter(
      n_t_s
    ))

    displayedInputLinkValueSetterRef.current.forEach(setter => setter(
      valueLinkInContext.value as string
    ))
  } else {
    displayedInputLinkValueSetterRef.current.forEach(setter => setter(
      valueLinkInContext.value as string
    ))
  }

  ref_display_link_opacity.current.forEach(setter => setter(ReturnValueLink(data, l, 'opacity') as string))
}

export const EventZDDContextMenu: EventZDDContextMenuFType = (
  ev,
  contextMenu
) => {
  const { pointer_pos } = contextMenu
  ev.preventDefault()
  pointer_pos.current = [ev.pageX, ev.pageY]
  contextMenu.showContextZDDRef.current![1](true)
  //contextZDDRef.current!.hidden = false
  //const style_c_n=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  //contextZDDRef.current!.attributes[4].value = 'max-width: 100%; position: absolute; inset: '+style_c_n
}

export const EventOnZoneMouseDown: EventOnZoneMouseDownFuncType = (
  applicationData,
  applicationState,
  dict_hook_ref_setter_show_dialog_components,
  token,
  evt,
  start_point,
  closeAllMenuContext,
  node_function
) => {
  // Special cast usefull for when the app is used in SankeySuiteManager
  const setter_limited_application = (dict_hook_ref_setter_show_dialog_components as unknown as { ref_setter_show_toast_limit_node?: React.MutableRefObject<React.Dispatch<React.SetStateAction<boolean>> | undefined>} )
  const { data } = applicationData
  const { ref_getter_mode_selection, first_selected_node } = applicationState
  closeAllMenuContext()
  const evt2=evt as unknown as {target:string,ctrlKey:boolean,metaKey:boolean,which:number}

  //si le mode de souris est noeud+flux alors crée le premier noeuds
  if (evt.which == 1) {

    // blur all the input of the config menu in case we modify a value from an input (where the value is truly apply on blur)
    // and click on the drawing zone wich normally doesn't count as a blur of the input
    for (const item of document.getElementsByTagName('input')) {
      if ((['form-control','chakra-numberinput__field','chakra-input','input_label'].some(r=> item.className.includes(r)))) {
        item.blur()
      }
    }
    if (d3.select(evt2.target).attr('class') != 'node node_shape' && ref_getter_mode_selection.current == 'ln') {

      if ((!evt.ctrlKey && !evt.metaKey)) {
        if (!token && Object.keys(data.nodes).length > 15) {
          if (setter_limited_application?.ref_setter_show_toast_limit_node) setter_limited_application.ref_setter_show_toast_limit_node.current!(true)

          setTimeout(function () {
            if (setter_limited_application?.ref_setter_show_toast_limit_node) setter_limited_application.ref_setter_show_toast_limit_node.current!(false)
          }, 3000)
        } else {
          const new_node1 = DefaultNode(data)
          let idNode = Object.keys(data.nodes).length
          while (data.nodes['node' + idNode]) {
            idNode = idNode + 1
          }
          new_node1.idNode = 'node' + idNode
          new_node1.name = 'node_tmp'
          data.nodes[new_node1.idNode] = new_node1
          const pos = d3.pointer(event)
          new_node1.x = pos[0] - ((ReturnValueNode(data, new_node1, 'node_width') as number) / 2)
          new_node1.y = pos[1] - ((ReturnValueNode(data, new_node1, 'node_height') as number) / 2)
          start_point.current = pos
          first_selected_node.current = new_node1
          applicationData.display_nodes[new_node1.idNode]=new_node1

          node_function.CreateNodesOnSVG([new_node1])

        }
      }
    } else if (d3.select(evt2.target).attr('class') != 'node node_shape' &&  ref_getter_mode_selection.current == 's' && !evt.ctrlKey) {
      const pos = d3.pointer(evt)
      start_point.current = pos
      d3.select('#svg').append('g').attr('class', 'selection_zone')
        .append('rect').attr('x', pos[0]).attr('y', pos[1]).attr('width', 2).attr('height', 2).attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', '2px').attr('stroke-dasharray', '5,5')
    }
  }


}
export const EventOnZoneMouseMove: EventOnZoneMouseMoveFuncType = (
  applicationData,
  applicationState,
  evt: MouseEvent,
  start_point: { current: number[]}
) => {
  const { data } = applicationData
  const { ref_getter_mode_selection,first_selected_node } = applicationState
  //Empêche lors du drag de la souris d'avoir
  // l'effet sélection de texte sur les labels des éléments de diagramme
  //si le mode de souris est noeud+flux et que le bouton de la souris est toujours pressé
  // alors crée une droite entre le premier noeud clické et le pointeur du curseur
  evt.stopPropagation()
  evt.preventDefault()

  if (ref_getter_mode_selection.current == 's' && (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 || first_selected_node.current)) {
    data.nodes = Object.fromEntries(Object.entries(data.nodes).filter(n => n[1].name != 'node_tmp'))
    first_selected_node.current = undefined
  }
  if (evt.buttons == 0 && d3.selectAll(' .opensankey #svg #path-flux').nodes().length > 0) {
    d3.selectAll(' .opensankey #svg #path-flux').remove()
  }
  if (ref_getter_mode_selection.current == 's' && d3.selectAll('.selection_zone').nodes().length > 0) {
    // Create change the size of the selection zone according to the mouse
    const pos = d3.pointer(evt)
    const new_x = (pos[0] > start_point.current[0]) ? start_point.current[0] : pos[0]
    const new_w = (pos[0] > start_point.current[0]) ? (pos[0] - start_point.current[0]) : start_point.current[0] - pos[0]

    const new_y = (pos[1] > start_point.current[1]) ? start_point.current[1] : pos[1]
    const new_h = (pos[1] > start_point.current[1]) ? (pos[1] - start_point.current[1]) : start_point.current[1] - pos[1]

    d3.select('.selection_zone rect').attr('x', new_x)
    d3.select('.selection_zone rect').attr('y', new_y)
    d3.select('.selection_zone rect').attr('width', Math.abs(new_w))
    d3.select('.selection_zone rect').attr('height', Math.abs(new_h))
  } else if (ref_getter_mode_selection.current == 'ln') {
    if (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && evt.buttons == 0) {
      // Si par erreur on un noeud temporaire est crée mais que l'on est plus en train de presser le bouton de la souris
      // alors corrige en nommant le noeud temporaire et supprimant le ligne de liaison
      first_selected_node.current = undefined
      Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0].name = Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0].idNode
    } else if ((!evt.ctrlKey && !evt.metaKey) && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
      const pos = d3.pointer(evt)
      const node_keys = Object.keys(data.nodes)
      const last_node = data.nodes[node_keys[node_keys.length - 1]]
      // Lors du drag de la souris, dessine une ligne entre le noeud de départ et la souris
      if (d3.selectAll(' .opensankey #svg #path-flux').nodes().length == 0) {
        d3.select(' .opensankey #svg').append('line').attr('id', 'path-flux')
          .attr('x1', last_node.x + ((ReturnValueNode(data, last_node, 'node_width') as number) / 2))
          .attr('y1', last_node.y + ((ReturnValueNode(data, last_node, 'node_height') as number) / 2))
          .attr('x2', pos[0])
          .attr('y2', pos[1])
          .style('stroke', '#d9af58')
          .style('stroke-width', '2px')
      } else {
        d3.selectAll(' .opensankey #svg #path-flux')
          .attr('x2', pos[0])
          .attr('y2', pos[1])
      }
    }
  }

  if (first_selected_node.current) {
    const pos = d3.pointer(event)
    const fsn = first_selected_node.current!
    if (d3.selectAll(' .opensankey #svg #path-flux').nodes().length == 0) {
      // Lors du drag de la souris, dessine une ligne entre le noeud de départ et la souris
      d3.select(' .opensankey #svg').append('line').attr('id', 'path-flux')
        .attr('x1', fsn.x + ((ReturnValueNode(data, fsn, 'node_width') as number) / 2))
        .attr('y1', fsn.y + ((ReturnValueNode(data, fsn, 'node_height') as number) / 2))
        .attr('x2', pos[0])
        .attr('y2', pos[1])
        .style('stroke', 'red')
        .style('stroke-width', '2px')
    } else {
      d3.selectAll(' .opensankey #svg #path-flux')
        .attr('x2', pos[0] - 5)
        .attr('y2', pos[1] - 5)
    }
  }
}
export const EventOnZoneMouseUp: EventOnZoneMouseUpFuncType = (
  applicationData,
  uiElementsRef,
  applicationState,
  dict_hook_ref_setter_show_dialog_components,
  token,
  evt,
  start_point,
  legend_clicked,
  link_function,
  ComponentUpdater,
  node_function,
  reDrawLegend,
  resizeCanvas
) => {
  const { data, display_links } = applicationData
  const { ref_getter_mode_selection,multi_selected_links, multi_selected_nodes, first_selected_node, displayedInputLinkValueSetterRef } = applicationState
  const { links_accordion_ref, button_ref, accordion_ref } = uiElementsRef
  const {updateComponentMenuConfigNode,updateComponentMenuConfigLink,updateComponentMenuConfigNodeAppearence,updateComponentMenuNodeIOSelectSideNode,updateComponenSaveInCache}=ComponentUpdater
  // Special cast usefull for when the app is used in SankeySuiteManager
  const setter_limited_application = (dict_hook_ref_setter_show_dialog_components as unknown as { ref_setter_show_toast_limit_node?: React.MutableRefObject<React.Dispatch<React.SetStateAction<boolean>> | undefined>} )

  legend_clicked.current = false
  d3.select('.opensankey #g_legend .drag_zone_leg').attr('stroke-dasharray', () => '')
  let h = document.getElementById('g_legend')?.getBoundingClientRect().height
  h = h ? h : 50
  draw_legend_handles(applicationData, legend_clicked.current, h,ComponentUpdater,reDrawLegend,resizeCanvas)

  const OpenLinksMenu = () => {
    if (button_ref && button_ref.current && accordion_ref && accordion_ref.current == null) {
      button_ref.current.click()
    }
    // Open element accordion if not already openend
    if (
      accordion_ref &&
      accordion_ref.current &&
      d3.select(accordion_ref.current).attr('aria-expanded')==='false'
    ) {
      accordion_ref.current.click()
    }

    // Open link accordion if not already openend
    if (
      links_accordion_ref &&
      links_accordion_ref.current &&
      d3.select(links_accordion_ref.current).attr('aria-expanded')==='false'
    ) {
      links_accordion_ref.current.click()
    }
  }

  const evt_recast = ((evt as unknown) as { target: string} ).target

  if (ref_getter_mode_selection.current == 's' && d3.selectAll('.selection_zone').nodes().length > 0) {
    NodeVisibleOnsSvg().forEach(k => DeselectVisualyNodes(data.nodes[k]))
    Object.keys(display_links).forEach(k => DeselectVisualyLinks(data.links[k]))
    const scale_svg=returnScaleOfDrawArea()
    const z_x = Number(d3.select('.selection_zone rect').attr('x'))
    const z_y = Number(d3.select('.selection_zone rect').attr('y'))
    const z_w = Number(d3.select('.selection_zone rect').attr('width'))
    const z_h = Number(d3.select('.selection_zone rect').attr('height'))
    const node_visible = NodeVisibleOnsSvg()
    const link_visible_svg = LinkVisibleOnSvg()
    if (evt.shiftKey) {
      Object.values(data.nodes).filter(n => {
        const width_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().width ?? 0) / scale_svg
        const height_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().height ?? 0) / scale_svg

        return !multi_selected_nodes.current.includes(n) && node_visible.includes(n.idNode) && n.x >= z_x && n.x <= (z_x + z_w) && n.y >= z_y && n.y <= (z_y + z_h) && n.x + width_n >= z_x && n.x + width_n <= (z_x + z_w) && n.y + height_n >= z_y && n.y + height_n <= (z_y + z_h)
      }
      ).forEach(n => multi_selected_nodes.current.push(n))
      const id_node_selected = multi_selected_nodes.current.map(n => n.idNode)
      const id_link_selected = multi_selected_links.current.map(l => l.idLink)
      // Select links who have both nodeSource and nodeTarget selected
      link_visible_svg.filter(lid => id_node_selected.includes(data.links[lid].idSource) && id_node_selected.includes(data.links[lid].idTarget) && !id_link_selected.includes(lid)).forEach(lid => multi_selected_links.current.push(data.links[lid]))

    } else {
      multi_selected_nodes.current = Object.values(data.nodes).filter(n => {
        const width_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().width ?? 0) / scale_svg
        const height_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().height ?? 0) / scale_svg
        return node_visible.includes(n.idNode) && n.x >= z_x && n.x <= (z_x + z_w) && n.y >= z_y && n.y <= (z_y + z_h) && n.x + width_n >= z_x && n.x + width_n <= (z_x + z_w) && n.y + height_n >= z_y && n.y + height_n <= (z_y + z_h)

      })
      const id_node_selected = multi_selected_nodes.current.map(n => n.idNode)
      // Select links who have both nodeSource and nodeTarget selected
      multi_selected_links.current = link_visible_svg.filter(lid => id_node_selected.includes(data.links[lid].idSource) && id_node_selected.includes(data.links[lid].idTarget)).map(lid => data.links[lid])
    }
    start_point.current = [0, 0]

    d3.selectAll('.selection_zone').remove()
    multi_selected_nodes.current.forEach(n=>SelectVisualyNodes(n))
    multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
    updateComponentMenuConfigNode.current()
    updateComponentMenuConfigNodeAppearence.current()
    updateComponentMenuConfigLink.current()
    updateComponentMenuNodeIOSelectSideNode.current.forEach(f => f() )
    updateComponenSaveInCache.current(true)
  }
  // si le token de connexion est à false alors ne crée pas de second noeud
  //si le mode de souris est noeud+flux alors crée un second noeud au relachement
  //et crée un lien entre le premier noeud crée lors du click et ce dernier
  const pos = d3.pointer(evt)
  if (ref_getter_mode_selection.current == 'ln') {
    if (!token && Object.keys(data.nodes).length > 15) {
      Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      first_selected_node.current = undefined
      if (setter_limited_application?.ref_setter_show_toast_limit_node) setter_limited_application.ref_setter_show_toast_limit_node.current!(true)
      setTimeout(function () {
        if (setter_limited_application?.ref_setter_show_toast_limit_node) setter_limited_application.ref_setter_show_toast_limit_node.current!(false)
      }, 3000)
    } else if ((pos[0] === start_point.current[0] && pos[1] === start_point.current[1])) {
      // If we release the mouse at the same point of when we pressed it then don't create a second node,
      // it can happend when we click just to create 1 node and the application think we release the button on the draw zone (the first node didn't have time to appear and trigger the mouse release on the first node created)
      if (d3.selectAll('.opensankey #svg #path-flux').nodes().length > 0) {
        d3.selectAll('.opensankey #svg #path-flux').remove()
      }
    } else if ((!evt.ctrlKey && !evt.metaKey) && Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0 && d3.select(evt_recast).attr('class') != 'node node_shape') {
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      Object.values(data.nodes).filter(d => d.name == 'node_tmp').map(d => d.name = d.idNode)
      //Création second noeud
      const new_node1 = DefaultNode(data)
      let idNode = Object.keys(data.nodes).length
      while (data.nodes['node' + idNode]) {
        idNode = idNode + 1
      }
      new_node1.idNode = 'node' + idNode
      new_node1.name = new_node1.idNode
      if (Object.keys(data.nodes).length < 5) {
        new_node1.x = Object.keys(data.nodes).length * 200 + 200
      } else {
        new_node1.x = 200
      }
      data.nodes[new_node1.idNode] = new_node1
      new_node1.x = pos[0] - ((ReturnValueNode(data, new_node1, 'node_width') as number) / 2)
      new_node1.y = pos[1] - ((ReturnValueNode(data, new_node1, 'node_height') as number) / 2)
      //Ajout du lien entre les deux noeuds créés
      const new_link = DefaultLink(data)
      let idLink = Object.keys(data.links).length
      while (data.links['link' + idLink]) {
        idLink = idLink + 1
      }
      new_link.idLink = 'link' + idLink
      data.links[new_link.idLink] = new_link
      const node_keys = Object.keys(data.nodes)
      new_link.idSource = data.nodes[node_keys[node_keys.length - 2]].idNode
      new_link.idTarget = data.nodes[node_keys[node_keys.length - 1]].idNode
      if (new_link.idSource === new_link.idTarget) {
        AssignLinkLocalAttribute(new_link, 'recycling', true)

      }
      data.nodes[node_keys[node_keys.length - 2]].outputLinksId.push(new_link.idLink)
      data.nodes[node_keys[node_keys.length - 1]].inputLinksId.push(new_link.idLink)
      multi_selected_links.current = [new_link]
      data.linkZIndex.push(new_link.idLink)
      displayedInputLinkValueSetterRef.current.forEach(setter => setter(''))
      OpenLinksMenu()
      first_selected_node.current = undefined
      // Deselect old selected links to then only select the new one
      Object.values(display_links).forEach(l=>DeselectVisualyLinks(l))

      applicationData.display_nodes[new_node1.idNode]=new_node1
      applicationData.display_links[new_link.idLink]=new_link

      node_function.RedrawNodes([data.nodes[new_link.idSource]])
      node_function.CreateNodesOnSVG([new_node1])
      link_function.CreateLinksOnSVG([new_link])
      // update link congig panel
      updateComponentMenuConfigLink.current()
    } else if ((!evt.ctrlKey && !evt.metaKey) && first_selected_node.current && d3.select(evt_recast).attr('class') != 'node node_shape') {

      const n_link = DefaultLink(data)
      const n_node = DefaultNode(data)
      let idNode = Object.keys(data.nodes).length
      while (data.nodes['node' + idNode]) {
        idNode = idNode + 1
      }
      n_node.idNode = 'node' + idNode
      n_node.name = 'node' + idNode
      data.nodes[n_node.idNode] = n_node
      const pos = d3.pointer(event)
      n_node.x = pos[0] - ((ReturnValueNode(data, n_node, 'node_width') as number) / 2)
      n_node.y = pos[1] - ((ReturnValueNode(data, n_node, 'node_height') as number) / 2)

      const { links } = data
      const fsn = first_selected_node.current!
      let idLink = Object.keys(data.links).length
      while (data.links['link' + idLink]) {
        idLink = idLink + 1
      }
      n_link.idLink = 'link' + idLink
      links[n_link.idLink] = n_link
      n_link.idSource = fsn.idNode
      n_link.idTarget = n_node.idNode
      if (n_link.idSource === n_link.idTarget) {
        AssignLinkLocalAttribute(n_link, 'recycling', true)
      }
      fsn.outputLinksId.push(n_link.idLink)
      fsn.outputLinksId = SortOutputLinksIdByYPos(data, fsn)
      n_node.inputLinksId.push(n_link.idLink)
      data.linkZIndex.push(n_link.idLink)
      displayedInputLinkValueSetterRef.current.forEach(setter => setter(''))
      multi_selected_links.current = [n_link]
      OpenLinksMenu()
      // Deselect old selected links to then only select the new one
      Object.values(display_links).forEach(l=>DeselectVisualyLinks(l))

      first_selected_node.current = undefined
      applicationData.display_nodes[n_node.idNode]=n_node
      applicationData.display_links[n_link.idLink]=n_link

      node_function.CreateNodesOnSVG([n_node])
      link_function.CreateLinksOnSVG([n_link])
      updateComponentMenuConfigLink.current()
    }
  }
}
// Similar to eventOnSankeyZone for the addition of 2 nodes + a link, this one trigger when the click is made on a already existing node. It allow us to link 2 already existings nodes,
// or creating a nodes at first click then linking it to a already existing one or the opposite

export const EventOnMouseUpAddNodesAndLink: EventOnMouseUpAddNodesAndLinkFType = (
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  applicationData,
  applicationState,
  uiElementsRef,
  applicationContext,
  ComponentUpdater,
  link_function,
  node_function
) => {
  const { data,display_links } = applicationData
  const { first_selected_node, multi_selected_links, displayedInputLinkValueSetterRef,ref_getter_mode_selection} = applicationState
  const { accordion_ref, links_accordion_ref,button_ref } = uiElementsRef
  const {GetLinkValue}=link_function
  const {updateComponentMenuConfigLink}=ComponentUpdater
  if ((!event.ctrlKey && !event.metaKey && event.button != 2) && first_selected_node.current && ref_getter_mode_selection.current=='ln') {
    if (d.name.includes('_tmp')) {
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      d.name = d.idNode
      RedrawNodesLabel(applicationData,[d],GetLinkValue,applicationContext.t,node_function)
    } else {
      d3.selectAll(' .opensankey #svg #path-flux').remove()
      const n_link = DefaultLink(data)
      const { links } = data
      const fsn = first_selected_node.current!
      let idLink = Object.keys(data.links).length
      while (data.links['link' + idLink]) {
        idLink = idLink + 1
      }
      n_link.idLink = 'link' + idLink
      links[n_link.idLink] = n_link

      n_link.idSource = fsn.idNode
      n_link.idTarget = d.idNode
      if (n_link.idSource === n_link.idTarget) {
        AssignLinkLocalAttribute(n_link, 'recycling', true)
      }
      fsn.outputLinksId.push(n_link.idLink)
      d.inputLinksId.push(n_link.idLink)
      data.linkZIndex.push(n_link.idLink)
      displayedInputLinkValueSetterRef.current.forEach(setter => setter(''))
      multi_selected_links.current = [n_link]

      // Deselect old selected links to then only select the new one
      Object.values(display_links).forEach(l=>DeselectVisualyLinks(l))

      first_selected_node.current = undefined
      applicationData.display_links[n_link.idLink]=n_link

      link_function.CreateLinksOnSVG([n_link])

      if (button_ref && button_ref.current && accordion_ref && accordion_ref.current == null) {
        button_ref.current.click()
      }
      // Open element accordion if not already openend
      if (
        accordion_ref &&
      accordion_ref.current &&
      d3.select(accordion_ref.current).attr('aria-expanded')==='false'
      ) {
        accordion_ref.current.click()
      }

      // Open link accordion if not already openend
      if (
        links_accordion_ref &&
      links_accordion_ref.current &&
      d3.select(links_accordion_ref.current).attr('aria-expanded')==='false'
      ) {
        links_accordion_ref.current.click()
      }
      if (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {
        const tmp = Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0]
        tmp.name = 'node' + (Object.keys(data.nodes).length - 1)
      }
      updateComponentMenuConfigLink.current()
    }

    first_selected_node.current = undefined

  } else if (Object.values(data.nodes).filter(d => d.name == 'node_tmp').length > 0) {

    const tmp = Object.values(data.nodes).filter(d => d.name == 'node_tmp')[0]
    //Ajout du lien entre les deux noeuds créés
    const new_link = DefaultLink(data)
    let idLink = Object.keys(data.links).length
    while (data.links['link' + idLink]) {
      idLink = idLink + 1
    }
    new_link.idLink = 'link' + idLink
    data.links[new_link.idLink] = new_link
    new_link.idSource = tmp.idNode
    new_link.idTarget = d.idNode
    if (new_link.idSource === new_link.idTarget) {
      AssignLinkLocalAttribute(new_link, 'recycling', true)
    }
    tmp.name = 'node_' + Object.keys(data.nodes).length
    tmp.outputLinksId.push(new_link.idLink)
    d.inputLinksId.push(new_link.idLink)
    d3.selectAll(' .opensankey #svg #path-flux').remove()
    data.linkZIndex.push(new_link.idLink)
    first_selected_node.current = undefined

    // Deselect old selected links to then only select the new one
    Object.values(display_links).forEach(l=>DeselectVisualyLinks(l))

    applicationData.display_links[new_link.idLink]=new_link

    link_function.CreateLinksOnSVG([new_link])

  }
}
export const ZoomFunction: ZoomFunctionFuncType = (evt: d3.D3ZoomEvent<SVGElement, unknown>,
  applicationData,
  GetSankeyMinWidthAndHeight
) => {

  const t = 'translate(0,0) scale(' + evt.transform.k + ')'
  const svgSankey = d3.select('.opensankey #svg')
  const {data}=applicationData
  svgSankey
    .attr('transform', t)
  //Compensate the scale of the legend when we dezoom so the legend has alway a readable size
  const scale_legend = 1 / ((evt.transform.k < 1) ? evt.transform.k : 1)
  svgSankey
    .style('border', Math.max(1, Math.round(2 / evt.transform.k)) + 'px solid #d3d3d3')
  d3.select(' .opensankey #svg #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale(' + (scale_legend) + ')')
  d3.select(' .opensankey #svg #g_legend .measurment_scale').html(String(Math.round((data.user_scale / 2) * scale_legend)))
  actualizeDrawAreaFrame(applicationData,GetSankeyMinWidthAndHeight)

}

export const SimpleGNodeClick: SimpleGNodeClickFuncType = (
  uiElementsRef,
  applicationState,
  event,
  d,
  accept_simple_click,
  ComponentUpdater,
) => {
  const sankeyTooltip = (d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
  if ((event.target as HTMLSpanElement).tagName === 'tspan') {
    setTimeout(() => {
      if (accept_simple_click.current) {
        EventNodeClick( uiElementsRef, applicationState, event, d, sankeyTooltip,ComponentUpdater)
      }
    }, 200)
  } else {
    EventNodeClick(uiElementsRef, applicationState, event, d, sankeyTooltip,ComponentUpdater)
  }
}

export const SvgDragMiddleMouseStart: SvgDragMiddleMouseStartFuncType = () => {
  d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('display', 'none')
  d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('display', 'none')
  d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('display', 'none')
}

export const SvgDragMiddleMouseMove: SvgDragMiddleMouseMoveFuncType = (event: d3.D3DragEvent<Element, unknown, unknown>, data: SankeyData) => {
  d3.selectAll('.ggg_nodes').filter(n => (n as SankeyNode).position !== 'relative').attr('transform', (d) => {
    const n = d as SankeyNode
    n.x += event.dx
    n.y += event.dy
    return 'translate(' + n.x + ',' + n.y + ')'
  })

  shiftAllLinkPath(event)

  shiftAllArrowPath(event)

  const scale_svg=returnScaleOfDrawArea()
  const scale_for_legend = (scale_svg < 1 ? (1 / scale_svg) : 1)
  data.legend_position[0] += event.dx
  data.legend_position[1] += event.dy
  d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale(' + scale_for_legend + ')')

}

export const actualizeDrawAreaFrame:actualizeDrawAreaFrameFType=(applicationData,GetSankeyMinWidthAndHeight)=>{
  [applicationData.data.width, applicationData.data.height] = GetSankeyMinWidthAndHeight(applicationData)
  const scale_svg=returnScaleOfDrawArea()
  d3.select('.scroll_zone').style('width',((applicationData.data.width+600)*scale_svg-(600*(scale_svg-1.1)))+'px')
  d3.select('.scroll_zone').style('height',((applicationData.data.height+200)*scale_svg-(200*(scale_svg-1.1)))+'px')

  d3.select('#svg').style('width',applicationData.data.width+'px')
  d3.select('#svg').style('height',applicationData.data.height+'px')
}


export const selectOpenSankeyElementsInSelectionZone:selectOpenSankeyElementsInSelectionZoneFType=(
  applicationData,
  applicationState,
  ComponentUpdater,
  evt,
  start_point
)=>{
  const {data,display_links}=applicationData
  const {multi_selected_nodes,multi_selected_links}=applicationState
  const {updateComponentMenuConfigNode,
    updateComponentMenuConfigNodeAppearence,
    updateComponentMenuConfigLink,
    updateComponentMenuNodeIOSelectSideNode,
    updateComponenSaveInCache}=ComponentUpdater
  NodeVisibleOnsSvg().forEach(k => DeselectVisualyNodes(data.nodes[k]))
  Object.keys(display_links).forEach(k => DeselectVisualyLinks(data.links[k]))
  const scale_svg=returnScaleOfDrawArea()
  const z_x = Number(d3.select('.selection_zone rect').attr('x'))
  const z_y = Number(d3.select('.selection_zone rect').attr('y'))
  const z_w = Number(d3.select('.selection_zone rect').attr('width'))
  const z_h = Number(d3.select('.selection_zone rect').attr('height'))
  const node_visible = NodeVisibleOnsSvg()
  const link_visible_svg = LinkVisibleOnSvg()
  if (evt.shiftKey) {
    Object.values(data.nodes).filter(n => {
      const width_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().width ?? 0) / scale_svg
      const height_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().height ?? 0) / scale_svg

      return !multi_selected_nodes.current.includes(n) && node_visible.includes(n.idNode) && n.x >= z_x && n.x <= (z_x + z_w) && n.y >= z_y && n.y <= (z_y + z_h) && n.x + width_n >= z_x && n.x + width_n <= (z_x + z_w) && n.y + height_n >= z_y && n.y + height_n <= (z_y + z_h)
    }
    ).forEach(n => multi_selected_nodes.current.push(n))
    const id_node_selected = multi_selected_nodes.current.map(n => n.idNode)
    const id_link_selected = multi_selected_links.current.map(l => l.idLink)
    // Select links who have both nodeSource and nodeTarget selected
    link_visible_svg.filter(lid => id_node_selected.includes(data.links[lid].idSource) && id_node_selected.includes(data.links[lid].idTarget) && !id_link_selected.includes(lid)).forEach(lid => multi_selected_links.current.push(data.links[lid]))

  } else {
    multi_selected_nodes.current = Object.values(data.nodes).filter(n => {
      const width_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().width ?? 0) / scale_svg
      const height_n = (document.getElementById('shape_' + n.idNode)?.getBoundingClientRect().height ?? 0) / scale_svg
      return node_visible.includes(n.idNode) && n.x >= z_x && n.x <= (z_x + z_w) && n.y >= z_y && n.y <= (z_y + z_h) && n.x + width_n >= z_x && n.x + width_n <= (z_x + z_w) && n.y + height_n >= z_y && n.y + height_n <= (z_y + z_h)

    })
    const id_node_selected = multi_selected_nodes.current.map(n => n.idNode)
    // Select links who have both nodeSource and nodeTarget selected
    multi_selected_links.current = link_visible_svg.filter(lid => id_node_selected.includes(data.links[lid].idSource) && id_node_selected.includes(data.links[lid].idTarget)).map(lid => data.links[lid])
  }
  start_point.current = [0, 0]

  d3.selectAll('.selection_zone').remove()
  multi_selected_nodes.current.forEach(n=>SelectVisualyNodes(n))
  multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
  updateComponentMenuConfigNode.current()
  updateComponentMenuConfigNodeAppearence.current()
  updateComponentMenuConfigLink.current()
  updateComponentMenuNodeIOSelectSideNode.current.forEach(f => f() )
  updateComponenSaveInCache.current(true)
}

export const applyZoomEvent:applyZoomEventFType=(applicationData,GetSankeyMinWidthAndHeight)=>{
  // Zoom Behavior
  const svgSankey = d3.select('.opensankey #svg');
  (svgSankey as d3.Selection<Element, unknown, HTMLElement, unknown>)
    .call(d3.zoom()
      .filter(ev => { // Permet d'obliger Crtl pour activer le zoom
        return (ev.ctrlKey || ev.metaKey) && ev.buttons === 0
      })
      .wheelDelta(ev => { // Permet de regler la vitesse du zoom
        return -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002)
      })
      .on('zoom', function (evt) {
        ZoomFunction(evt,applicationData,GetSankeyMinWidthAndHeight)
      }))
    .on('dblclick.zoom', null)
}
/**
 * Shift all link path present on the svg to the direction on the event
 *
 * @param {d3.D3DragEvent<Element, unknown, unknown>} event
 */
export const shiftAllLinkPath=(event:d3.D3DragEvent<Element, unknown, unknown>)=>{
  d3.selectAll('.link').attr('d', (d) => {
    const l=d as SankeyLink

    // Get the path of each displayed link
    const path = d3.select('#path_' + l.idLink).attr('d').split(' ')

    // Each path is splitted into small part of the path then depending on the small part :
    //  - If it's a letter then do nothing
    //  - If it's a string that contains ',' then it's a coordinate of a point as [x,y] and we apply the shift to these values
    //  - If it's a Number alone then it mean that it's either a vertical shift or a horizontale one,
    //    therefore we search the previous element in the path to see if the shift is vertical 'V' or horizontal 'H'
    //
    // Then once the subpart of the path are modified, we join the array to reform the path
    const new_path = path.map((p, i) => {
    // Case when it's a [x,y] coordinates
      if (p.includes(',')) {
        const pos = p.split(',')
        const newPosX = Number(pos[0]) + event.dx
        const newPosY = Number(pos[1]) + event.dy
        p = '' + newPosX + ',' + newPosY
      }
      // Case when it's a number alone so we search the previous element to know wich shift
      if (Number(p)) {
        if (path[i - 1] == 'H') {
          p = String(Number(p) + event.x)
        } else if (path[i - 1] == 'V') {
          p = String(Number(p) + event.y)
        }
      }
      return p
    })
    return new_path.join(' ')
  })

}
/**
 * Shift all arrow path present on the svg to the direction on the event
 *
 *
 * @param {d3.D3DragEvent<Element, unknown, unknown>} event
 */
export const shiftAllArrowPath=(event:d3.D3DragEvent<Element, unknown, unknown>)=>{
  d3.selectAll('.arrow').attr('d', (d) => {
    const l = d as SankeyLink
    // Get the path of each displayed link
    const path = d3.select('#path_' + l.idLink + '_arrow').attr('d').split(' ')

    // Each path is splitted into small part of the path then depending on the small part :
    //  - If it's a letter then do nothing
    //  - If it's a string that contains ',' then it's a coordinate of a point as [x,y] and we apply the shift to these values
    //  - If it's a Number alone then it mean that it's either a vertical shift or a horizontale one,
    //    therefore we search the previous element in the path to see if the shift is vertical 'V' or horizontal 'H'
    //
    // Then once the subpart of the path are modified, we join the array to reform the path
    const new_path = path.map((p, i) => {
      // Case when it's a [x,y] coordinates
      if (p.includes(',')) {
        const pos = p.split(',')
        const newPosX = Number(pos[0]) + event.dx
        const newPosY = Number(pos[1]) + event.dy
        p = '' + newPosX + ',' + newPosY
      }
      // Case when it's a number alone so we search the previous element to know wich shift
      if (Number(p)) {
        if (path[i - 1] == 'H') {
          p = String(Number(p) + event.x)
        } else if (path[i - 1] == 'V') {
          p = String(Number(p) + event.y)
        }
      }
      return p
    })
    return new_path.join(' ')
  })
}
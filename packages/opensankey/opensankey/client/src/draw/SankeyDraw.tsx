/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { FunctionComponent, useEffect } from 'react'
import { SankeyData } from '../types/Types'
import {  DeleteLink,DeleteNode,windowSankey} from '../configmenus/SankeyUtils'
import { ClickSaveDiagram } from '../dialogs/SankeyPersistence'
import { AgregationModal } from './SankeyDrawLayout'
import { RemoveAnimate,
  DrawGrid,
  update_scale,
  SelectVisualyLinks,
  DeselectVisualyLinks,
  DeselectVisualyNodes,
  SelectVisualyNodes} from './SankeyDrawFunction'
import LZString from 'lz-string'
import { SankeyDrawTypes, keyHandlerFType } from './types/SankeyDrawTypes'
import { SvgDragMiddleMouseStart, SvgDragMiddleMouseMove, EventZDDContextMenu } from './SankeyDrawEventFunction'
import { AddDrawNodesEvent } from './SankeyDrawNodes'
declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}
const SankeyDraw: FunctionComponent<SankeyDrawTypes> = ({
  contextMenu,
  data,
  set_data,
  display_nodes,
  display_links,
  animation,
  dict_variable_elements_selected,
  agregation,
  ref_alt_key_pressed,
  GetSankeyMinWidthAndHeight,
}) => {

  const {ref_getter_mode_selection,ref_setter_mode_selection}=dict_variable_elements_selected
  // Il faut détruire les tooltips à chaque passage dans le draw
  d3.selectAll('.sankey-tooltip').remove()

  d3.select('body')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sankey-tooltip')

  window.focus()
  d3.select(window).on('keydown', (event) => {
    if (event.keyCode === 18) {
      ref_alt_key_pressed.current = true
      window.focus()
    }
  })
  d3.select(window).on('keyup', (event) => {
    if (event.keyCode === 18) {
      ref_alt_key_pressed.current = false
      window.focus()
    }
  })


  const position = (windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute'
 
  useEffect(() => {
    if (animation.current) {
      return
    }
    [data.width, data.height] = GetSankeyMinWidthAndHeight(data)
    RemoveAnimate()
    d3.select('body').style('background-color',data.couleur_fond_sankey)
    // Permet d'affecter une class au svg selon le mode
    if (ref_getter_mode_selection.current=='s') {
      d3.select(' .opensankey #svg').attr('class','mode_selection')
    }

    if (ref_getter_mode_selection.current=='ln') {
      d3.select(' .opensankey #svg').attr('class','mode_add_flux')
    }
    // Disable zoom outside of the sankey draw zone
    (d3.select('body') as d3.Selection<Element, unknown, HTMLElement, unknown>)
      .call(d3.zoom()
        .filter(ev => { // Permet d'obliger Crtl pour activer le zoom
          return (ev.ctrlKey || ev.metaKey) && ev.buttons == 0
        })
        .wheelDelta(ev => { // Permet de regler la vitesse du zoom
          return -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002)
        })
        .on('zoom', function () {
          null
        })
      )
      .on('dblclick.zoom', null)


    const svgSankey = d3.select('.opensankey #svg')

    svgSankey.style('width', data.width + 'px')

    svgSankey.style('height', data.height + 'px');

    


    // Fonction permettant de déplacer les éléments dans la zone de dessin, seulement quand on drag avec le boutons du milieu de la souris
    (svgSankey as d3.Selection<Element, unknown, HTMLElement, unknown>)
      .call(d3.drag<Element, unknown, HTMLElement>()
        .subject(Object)
        .filter(evt=>{
          evt.stopPropagation()
          evt.preventDefault()

          return d3.select(evt.target).attr('id')=='svg' && evt.which==2
        })
        .on('start',()=>{
        // Cache les handles des liens
          SvgDragMiddleMouseStart()
        })
        .on('drag', function (event) {
          SvgDragMiddleMouseMove(event,data)
        })
        .on('end',()=>{
          set_data({...data})
        })

      )
    svgSankey.on('contextmenu',(evt)=>{
      if(!window.SankeyToolsStatic && d3.select(evt.target).attr('class')=='mode_selection'){return EventZDDContextMenu(evt,contextMenu)}
    })

    DrawGrid(data)

    update_scale(data.user_scale)
    const shift_top=document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height

    d3.select('#svg-container').style('margin-top',shift_top+'px')

    d3.select(' .opensankey #svg').selectAll('.defsArrow').remove()
    d3.select(' .opensankey #svg').append('defs').attr('class', 'defsArrow')

    d3.selectAll('.navbar').on('mouseup',()=>{
      if(ref_getter_mode_selection.current=='ln'){
        ref_setter_mode_selection.current('s')
      }
    })
    d3.select('.sankey-menu').on('click',e=>{
      if(ref_getter_mode_selection.current=='ln' && d3.select(e.target).attr('class')!=='accordion-item'){
        ref_setter_mode_selection.current('s')
      }
    })


  })
  let border = '0px'
  if (!(windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false)) {
    border = '2px solid #d3d3d3'
  }


  const width_to_display=((data.width) ? data.width : window.innerWidth*0.975)
  return (
    <>
      <div className="span12" id='visualization_div' >
        <div id="svg-container" className='opensankey' style={{ 'position': position }}>
          <div className='scroll_zone' >
            <svg id='svg' transform-origin='0 0' style={{margin:'10px', 'height': data.height, 'width': width_to_display, 'border': border,boxShadow:'2px 2px 2px #d3d3d3,-2px -2px 2px #d3d3d3' }} preserveAspectRatio="xMidYMin meet">
              <g className='grid' id='grid'></g>
              <g className='g_links' id='g_links' style={{ 'position': position }} ></g>
              <g className='g_nodes' id='g_nodes' style={{ 'position': position }} ></g>
              <g className='g_link_handles' id='g_link_handles'></g>
              <g className='g_legend' id='g_legend'></g>
            </svg>
          </div>
        </div>
      </div>
      <AgregationModal
        agregationRef={agregation}
        data={data}
        set_data={set_data}
        display_nodes={display_nodes}
        display_links={display_links}
      />
    </>
  )
}


// Function used to handle event when some key are pressed
// If the keyboard arrows are pressed it shift the selected nodes according to the arrow direction and the grid square
// Escape key open and close configuration sankey menu
// ctrl + s save a view of the data
// Delete key allow us to delete selected elments (nodes,links, free label)
export const keyHandler : keyHandlerFType = (
  dict_variable_application_data,
  uiElementsRef,
  contextMenu,
  e: KeyboardEvent,data:SankeyData,
  dict_variable_elements_selected,
  set_data:(d:SankeyData)=>void,
  closeAllMenu:()=>void,
  ref_alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  applicationContext
) => {
  const {multi_selected_nodes,multi_selected_links,ref_setter_mode_selection}=dict_variable_elements_selected
  const{ref_get_update_menu_config_node,ref_set_update_menu_config_node,ref_get_update_menu_config_link,ref_set_update_menu_config_link,ref_get_update_menu_config_node_appearence,ref_set_update_menu_config_node_appearence}=ComponentUpdater
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ((document.activeElement?.tagName==='INPUT')? d3.select(document.activeElement).attr('value')==='menuConfigButton':true && (!document.activeElement?.className.includes('ql-editor')))) {
    // Deplace les noeuds sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
    // (exemples : le input de la largeur minimal d'un noeud)
    if (e.key == 'ArrowUp') {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
        if (d != undefined) {
          return d.idNode
        }
      }).includes(f.idNode)).map(d => {
        if (d.position === 'relative') {
          return
        }

        d.y = d.y - data.grid_square_size

        let y_max = 0
        Object.values(data.nodes).map(d => {
          y_max = (d.y > y_max) ? d.y : y_max
        })
        //Diminue hauteur svg si le noeud est près du bord
        if (y_max < data.height - 100 && data.height - 100 >= window.innerHeight) {
          data.height -= 90
        }
      })
    } else if (e.key == 'ArrowDown') {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
        if (d != undefined) {
          return d.idNode
        }
      }).includes(f.idNode)).map(d => {
        if (d.position === 'relative') {
          return
        }

        d.y = d.y + data.grid_square_size

        //Augumente hauteur svg si le noeud est près du bord
        if (d.y > data.height - 100) {
          data.height += 100
        }
      })
    } else if (e.key == 'ArrowLeft') {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
        if (d != undefined) {
          return d.idNode
        }
      }).includes(f.idNode)).map(d => {
        if (d.position === 'relative') {
          return
        }

        d.x = d.x - data.grid_square_size

        //Diminue largeur svg si le noeud est près du bord
        if (d.x < data.width - 100 && data.width - 100 >= window.innerWidth - 50) {
          data.width -= 50
        }
      })
    } else if (e.key == 'ArrowRight') {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
        if (d != undefined) {
          return d.idNode
        }
      }).includes(f.idNode)).map(d => {
        if (d.position === 'relative') {
          return
        }

        d.x = d.x + data.grid_square_size

        //Augumente largeur svg si le noeud est près du bord
        if (d.x > data.width - 100) {
          data.width += 100
        }
      })
    }
    set_data({ ...data })
  } else if (e.key == 'Escape') {
    ref_setter_mode_selection.current('s')
    d3.select(' .opensankey #svg').attr('class','mode_selection')

    // Visualy deselect nodes then deselect in the app data
    multi_selected_nodes.current.forEach(d => {
      DeselectVisualyNodes(d)
    })
    multi_selected_nodes.current=[]


    multi_selected_links.current.forEach(l=>{
      DeselectVisualyLinks(l)
    })
    multi_selected_links.current=[]

    closeAllMenu()
    AddDrawNodesEvent(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,ref_alt_key_pressed,accept_simple_click,link_function,NodeTooltipsContent,ComponentUpdater,  dict_hook_ref_setter_show_dialog_components)
    ref_set_update_menu_config_node.current(!ref_get_update_menu_config_node.current)
    ref_set_update_menu_config_node_appearence.current(!ref_get_update_menu_config_node_appearence.current)

    ref_set_update_menu_config_link.current(!ref_get_update_menu_config_link.current)
  }else if(e.key=='Delete' && (!document.activeElement?.className.includes('ql-editor'))){
    
    if(document.activeElement?.tagName!=='INPUT' || d3.select(document.activeElement).attr('value')=='menuConfigButton')
    {
      multi_selected_links.current.forEach(el=>{
        DeleteLink(data,el)
      })
      multi_selected_nodes.current.forEach(el=>{
        DeleteNode(data,el)
      })
      multi_selected_nodes.current=[]
      multi_selected_links.current=[]
      set_data({...data})
    }
  }else if(e.key=='a' && e.ctrlKey){
    e.preventDefault()
    multi_selected_nodes.current=Object.values(data.nodes)
    multi_selected_nodes.current.forEach(n=>{
      SelectVisualyNodes(n)
    })
    multi_selected_links.current=Object.values(data.links)
    multi_selected_links.current.forEach(l=>{
      SelectVisualyLinks(l)
    })

  }else if(e.key=='Enter' && document.activeElement?.tagName=='INPUT' && (document.activeElement?.className.includes('form-control') || document.activeElement?.className.includes('chakra-numberinput__field'))){
    for(const item of document.getElementsByTagName('input')){

      if((item.className.includes('form-control') || item.className.includes('chakra-numberinput__field')) && item.type=='text'){
        item.blur()
      }
    }
  }else if(e.key=='s' && e.ctrlKey && !e.shiftKey){
    e.preventDefault()
    localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
    const time_save=new Date()
    const parsed_time_save=time_save.toLocaleDateString() +' - ' + time_save.toLocaleTimeString()
    localStorage.setItem('last_save', parsed_time_save)
    set_data({...data})
  }else if((e.key=='s' && e.ctrlKey && e.shiftKey)||(e.key=='S' && e.ctrlKey && e.shiftKey)){
    e.preventDefault()
    set_data({...data})
    ClickSaveDiagram(data)
  }else  if((e.key==='f') && !e.ctrlKey && document.activeElement?.tagName!=='INPUT'){
    if((!d3.select(document.activeElement)?.attr('class')?.includes('ql-editor')??true)){
      e.preventDefault()
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    
  }
}

export default SankeyDraw

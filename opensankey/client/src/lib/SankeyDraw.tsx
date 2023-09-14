/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { FunctionComponent, useEffect } from 'react'
import { SankeyNode, SankeyLink, SankeyDataPropTypes,  SankeyData} from './types'
import PropTypes, { InferProps } from 'prop-types'
import {  delete_link,delete_node,clickSaveDiagram} from './SankeyUtils'
import { AgregationModal } from './SankeyLayout'
import { removeAnimate,drawGrid,update_scale,deselect_visualy_links,deselect_visualy_nodes,svgDragMiddleMouseStart,svgDragMiddleMouseMove, select_visualy_nodes} from './SankeyDrawFunction'
import LZString from 'lz-string'


window.d3 = d3
declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

const SankeyDrawPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  animation:PropTypes.bool.isRequired,
  mode_selection: PropTypes.shape({current:PropTypes.string.isRequired}).isRequired,
  show_agregation:PropTypes.bool.isRequired, set_show_agregation:PropTypes.func.isRequired,
  agregation_node:PropTypes.string.isRequired,
  set_agregation_node:PropTypes.func.isRequired,
  is_agregation:PropTypes.bool.isRequired,
  set_alt_key_pressed:PropTypes.func.isRequired,
  min_width_and_height:PropTypes.func.isRequired,
  pointer_pos:PropTypes.shape({current:PropTypes.arrayOf(PropTypes.number.isRequired).isRequired}).isRequired,
  set_show_context_zdd:PropTypes.func.isRequired

}

export const SankeyDrawDefaultProps = {
  set_data: () => null,
  animation: false,

  multi_selected_label: {current : []},
  mode_selection: {current:'s'},

  show_agregation:false, set_show_agregation:()=>false,
  agregation_node:'',
  set_agregation_node:()=>false,
  is_agregation:false,

  set_alt_key_pressed:()=>false,
  min_width_and_height:()=>[],
  set_show_toast_limit_node:()=>false,
  pointer_pos:{current:[]},
  set_show_context_zdd:()=>false

}

type SankeyDrawTypes = InferProps<typeof SankeyDrawPropTypes>

const SankeyDraw: FunctionComponent<SankeyDrawTypes> = ({
  data,
  set_data = SankeyDrawDefaultProps.set_data,
  animation,
  mode_selection,
  show_agregation, set_show_agregation,
  agregation_node,
  set_agregation_node,
  is_agregation,
  set_alt_key_pressed,min_width_and_height,
  pointer_pos,
  set_show_context_zdd
}) => {

  // Il faut détruire les tooltips à chaque passage dans le draw
  d3.selectAll('.sankey-tooltip').remove()

  d3.select('body')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sankey-tooltip')

  window.focus()
  d3.select(window).on('keydown', (event) => {
    if (event.keyCode === 18) {
      set_alt_key_pressed(true)
      window.focus()
    }
  })
  d3.select(window).on('keyup', (event) => {
    if (event.keyCode === 18) {
      set_alt_key_pressed(false)
      window.focus()
    }
  })


  const position = (window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ? 'relative' : 'absolute'
 



  useEffect(() => {
    if (animation) {
      return
    }
    [data.width, data.height] = min_width_and_height(data)
    removeAnimate()
    d3.select('body').style('background-color',data.couleur_fond_sankey)
    // Permet d'affecter une class au svg selon le mode
    if (mode_selection.current=='s') {
      d3.select(' .opensankey #svg').attr('class','mode_selection')
    }

    if (mode_selection.current=='ln') {
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
          svgDragMiddleMouseStart()
        })
        .on('drag', function (event) {
          svgDragMiddleMouseMove(event,data)
        })
        .on('end',()=>{
          set_data({...data})
        })

      )
    svgSankey.on('contextmenu',(evt)=>{
      evt.preventDefault()
      pointer_pos.current=[evt.pageX,evt.pageY]
      if(d3.select(evt.target).attr('class')=='mode_selection'){
        set_show_context_zdd(true)
      }
    })

    drawGrid(data)

    update_scale(data.user_scale)
    const shift_top=document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().y+document.getElementsByClassName('MenuNavigation')[0]?.getBoundingClientRect().height

    d3.select('#svg-container').style('margin-top',shift_top+'px')

    d3.select(' .opensankey #svg').selectAll('.defsArrow').remove()
    d3.select(' .opensankey #svg').append('defs').attr('class', 'defsArrow')

    d3.select('.div-Menu').on('mouseup',()=>{
      if(mode_selection.current=='ln'){
        mode_selection.current='s'
        set_data({...data})
      }
    })
    d3.select('.sankey-menu').on('click',e=>{
      if(mode_selection.current=='ln' && d3.select(e.target).attr('class')!=='accordion-item'){
        mode_selection.current='s'
        set_data({...data})
      }
    })


  })
  let border = '0px'
  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
    border = '2px solid #d3d3d3'
  }


  const width_to_display=((data.width) ? data.width : window.innerWidth*0.975)
  return (
    <>
      <div className="span12" style={{ 'color': 'black','display': 'inline' }} id='visualization_div' >
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
      { agregation_node !== '' && data.nodes[agregation_node] ?
        <AgregationModal
          show_agregation={show_agregation}
          data={data}
          set_data={set_data}
          agregation_node={agregation_node}
          set_agregation_node={set_agregation_node}
          set_show_agregation={set_show_agregation}
          is_agregation={is_agregation}
        /> : <></>}
    </>
  )
}


// Function used to handle event when some key are pressed
// If the keyboard arrows are pressed it shift the selected nodes according to the arrow direction and the grid square
// Escape key open and close configuration sankey menu
// ctrl + s save a view of the data
// Delete key allow us to delete selected elments (nodes,links, free label)
export const keyHandler = (e: KeyboardEvent,data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  mode_selection:{current : string},
  closeAllMenu:()=>void

) => {
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
    mode_selection.current = 's'
    d3.select(' .opensankey #svg').attr('class','mode_selection')

    // Visualy deselect nodes then deselect in the app data
    multi_selected_nodes.current.forEach(d => {
      deselect_visualy_nodes(d)
    })
    multi_selected_nodes.current=[]


    multi_selected_links.current.forEach(l=>{
      deselect_visualy_links(l)
    })
    multi_selected_links.current=[]

    closeAllMenu()


  }else if(e.key=='Delete' && (!document.activeElement?.className.includes('ql-editor'))){
    
    if(document.activeElement?.tagName!=='INPUT' || d3.select(document.activeElement).attr('value')=='menuConfigButton')
    {
      multi_selected_links.current.forEach(el=>{
        delete_link(data,el)
      })
      multi_selected_nodes.current.forEach(el=>{
        delete_node(data,el)
      })
      multi_selected_nodes.current=[]
      multi_selected_links.current=[]
      set_data({...data})
    }
  }else if(e.key=='a' && e.ctrlKey){
    e.preventDefault()
    multi_selected_nodes.current=Object.values(data.nodes)
    multi_selected_nodes.current.forEach(n=>{
      select_visualy_nodes(n)
    })

  }else if(e.key=='Enter' && document.activeElement?.tagName=='INPUT' && document.activeElement?.className.includes('form-control')){
    for(const item of document.getElementsByTagName('input')){
      if(item.className.includes('form-control') && item.type=='text'){
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
    clickSaveDiagram(data)
  }else  if((e.key==='f') && e.ctrlKey && document.activeElement?.tagName!=='INPUT'){
    e.preventDefault()

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}





SankeyDraw.propTypes = SankeyDrawPropTypes
SankeyDraw.defaultProps = SankeyDrawDefaultProps

export default SankeyDraw

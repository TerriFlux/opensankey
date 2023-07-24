/* eslint @typescript-eslint/no-var-requires: "off" */
import * as d3 from 'd3'
import React, { FunctionComponent, useEffect,Requireable } from 'react'
import { SankeyNode, SankeyLink, SankeyDataPropTypes,  SankeyData} from './types'
import PropTypes, { InferProps } from 'prop-types'
import {  delete_link,delete_node,clickSaveDiagram} from './SankeyUtils'
import { AgregationModal } from './SankeyLayout'
import { removeAnimate,drawGrid,update_scale,deselect_visualy_links,deselect_visualy_nodes,repositionne_sidebar} from './SankeyDrawFunction'
import LZString from 'lz-string'
import {SankeyPlusLabel}  from 'sankeyanimation/src/types'

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
  is_agregation:PropTypes.bool.isRequired,

  set_alt_key_pressed:PropTypes.func.isRequired,

  min_width_and_height:PropTypes.func.isRequired,
  additional_draw_element:PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
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
  is_agregation:false,

  set_alt_key_pressed:()=>false,
  min_width_and_height:()=>[],
  set_show_toast_limit_node:()=>false,
  additional_draw_element:[],
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
  is_agregation,
  set_alt_key_pressed,min_width_and_height,
  additional_draw_element,
  pointer_pos,
  set_show_context_zdd
}) => {

  // const [first_selected_node,set_first_selected_node] = useState({})
  // const diff=require('deep-diff')

  // Il faut détruire les tooltips à chaque passage dans le draw
  d3.selectAll('.sankey-tooltip').remove()

  const sankeyTooltip = d3.select('body')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'sankey-tooltip')


  sankeyTooltip



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
  //const node_font = data.display_style.node_font_family_selected
  // const link_font = data.display_style.link_font_family_selected
  // const test = document.getElementsByClassName('navbar')
  // let margin_top = 0
  // if (test && test.length > 0) {
  //   margin_top = test[0].getBoundingClientRect().height -20
  // }


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



  useEffect(() => {
    if (animation) {
      return
    }
    [data.width, data.height] = min_width_and_height(data)
    removeAnimate()
    d3.select('body').style('background-color',data.couleur_fond_sankey)
    // let isDown = false
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

    svgSankey.attr('viewBox', null)
    svgSankey.style('width', data.width + 'px')

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
          evt.transform.x = 0
          evt.transform.y = 0
          d3.select(' .opensankey #svg')
            .attr('transform', evt.transform).attr('transform-origin', '0 0')
          svgSankey.attr('viewBox', null)
          // Change the width of scrollable zone if the menu is open so we can scroll until the menu is not on the sankey zone
          if(d3.select('.offcanvas-body').node()){
            d3.select('.scroll_zone').style('width',((data.width+600)*evt.transform.k-(600*(evt.transform.k-1.1)))+'px')
          }
          //Compensate the scale of the legend when we dezoom so the legend has alway a readable size 
          const scale_legend=1/((evt.transform.k<1)?evt.transform.k:1)
          d3.select(' .opensankey #svg')
            .style('border', Math.max(1,Math.round(2 / evt.transform.k)) + 'px solid #d3d3d3')
          d3.select(' .opensankey #svg #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+(scale_legend)+')')
          d3.select(' .opensankey #svg #g_legend .measurment_scale').html(String(Math.round((data.user_scale/2)*scale_legend)))

          repositionne_sidebar()
        }))
      .on('dblclick.zoom', null);


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
          d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('fill-opacity', '0')
          d3.selectAll(' .opensankey .gg_link_handles rect.handle').attr('cursor', 'pointer')
          d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('cursor', 'pointer')
          d3.selectAll(' .opensankey .gg_link_handles .drag_zone').attr('stroke-opacity', '0')
          d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('stroke-opacity', '0')
          d3.selectAll(' .opensankey .gg_link_handles .center_handle').attr('fill-opacity', '0')
        })
        .on('drag', function (event) {
          d3.selectAll('.ggg_nodes').filter(n=>(n as SankeyNode).position!=='relative').attr('transform',(d)=>{
            const n=d as SankeyNode
            n.x+=event.dx
            n.y+=event.dy
            return 'translate('+n.x+','+n.y+')'
          })
          d3.selectAll('.link').attr('d',(d)=>{
            const l=d as SankeyLink
            // Get the path of each displayed link
            const path=d3.select('#'+l.idLink).attr('d').split(' ')

            // Each path is splitted into small part of the path then depending on the small part :
            //  - If it's a letter then do nothing
            //  - If it's a string that contains ',' then it's a coordinate of a point as [x,y] and we apply the shift to these values
            //  - If it's a Number alone then it mean that it's either a vertical shift or a horizontale one,
            //    therefore we search the previous element in the path to see if the shift is vertical 'V' or horizontal 'H'
            //
            // Then once the subpart of the path are modified, we join the array to reform the path
            const new_path=path.map((p,i)=>{
            // Case when it's a [x,y] coordinates
              if(p.includes(',')){
                const pos=p.split(',')
                const newPosX=Number(pos[0])+event.dx
                const newPosY=Number(pos[1])+event.dy
                p=''+newPosX+','+newPosY
              }
              // Case when it's a number alone so we search the previous element to know wich shift
              if(Number(p)){
                if(path[i-1]=='H'){
                  p=Number(p)+event.x
                }else if(path[i-1]=='V'){
                  p=Number(p)+event.y
                }
              }
              return p
            })
            return new_path.join(' ')
          })
          d3.selectAll('.arrow').attr('d',(d)=>{
            const l=d as SankeyLink
            // Get the path of each displayed link
            const path=d3.select('#'+l.idLink+'_arrow').attr('d').split(' ')

            // Each path is splitted into small part of the path then depending on the small part :
            //  - If it's a letter then do nothing
            //  - If it's a string that contains ',' then it's a coordinate of a point as [x,y] and we apply the shift to these values
            //  - If it's a Number alone then it mean that it's either a vertical shift or a horizontale one,
            //    therefore we search the previous element in the path to see if the shift is vertical 'V' or horizontal 'H'
            //
            // Then once the subpart of the path are modified, we join the array to reform the path
            const new_path=path.map((p,i)=>{
            // Case when it's a [x,y] coordinates
              if(p.includes(',')){
                const pos=p.split(',')
                const newPosX=Number(pos[0])+event.dx
                const newPosY=Number(pos[1])+event.dy
                p=''+newPosX+','+newPosY
              }
              // Case when it's a number alone so we search the previous element to know wich shift
              if(Number(p)){
                if(path[i-1]=='H'){
                  p=Number(p)+event.x
                }else if(path[i-1]=='V'){
                  p=Number(p)+event.y
                }
              }
              return p
            })
            return new_path.join(' ')
          })

          // Drag ZDT too
          Object.values((data as unknown as {labels:SankeyPlusLabel[]}).labels).forEach(lb=>{
            const new_pos_x = lb.x + event.dx
            const new_pos_y = lb.y + event.dy
            lb.x = new_pos_x
            lb.y = new_pos_y
            d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
          })

          const transform_svg=d3.select('.opensankey #svg')?.attr('transform')??''
          const scale_svg=(transform_svg)?+transform_svg.split('scale(')[1].replace(')',''):1
          const scale_for_legend=(scale_svg<1?(1/scale_svg):1)
          data.legend_position[0]+=event.dx
          data.legend_position[1]+=event.dy
          d3.select(' .opensankey #g_legend').attr('transform', 'translate(' + (data.legend_position[0]) + ',' + data.legend_position[1] + ') scale('+scale_for_legend+')')
          
        })
        .on('end',()=>{
          set_data({...data})
        })

      )
    svgSankey.on('contextmenu',(evt)=>{
      evt.preventDefault()
      pointer_pos.current=[evt.pageX,evt.pageY]
      console.log(d3.select(evt.target).attr('class'))
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
    // d3.select('body')


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
  if (!(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)) {
    border = '2px solid #d3d3d3'
  }


  const width_to_display=((data.width) ? data.width : window.innerWidth*0.975)
  return (
    <>
      <div className="span12" style={{ 'color': 'black','display': 'inline' }} id='visualization_div' >
        {additional_draw_element}
        <div id="svg-container" className='opensankey' style={{ 'position': position }}>
          <div className='scroll_zone' >
            <svg id='svg' transform-origin='0 0' style={{margin:'10px', 'height': data.height, 'width': width_to_display, 'border': border,boxShadow:'2px 2px 2px #d3d3d3,-2px -2px 2px #d3d3d3' }} preserveAspectRatio="xMidYMin meet">
              <g className='grid' id='grid'></g>
              <g className='g_nodes' id='g_nodes' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
              <g className='g_links' id='g_links' style={{ 'position': position,  /*'fontFamily': node_font */ }} ></g>
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
  accordion_ref:InferProps<{ current: Requireable<HTMLDivElement>; }>| null,
  button_ref:InferProps<{ current: Requireable<HTMLLabelElement>; }>| null,
  set_show_nav:React.Dispatch<React.SetStateAction<boolean>>,
  mode_selection:{current : string},
  set_show_menu_node_apparence:(b:boolean)=>void,
  set_show_menu_node_label:(b:boolean)=>void,
  set_show_menu_node_io:(b:boolean)=>void,
  set_show_menu_link_data:(b:boolean)=>void,
  set_show_menu_link_appearence:(b:boolean)=>void,
  set_show_menu_link_label:(b:boolean)=>void,

) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ((document.activeElement?.tagName==='INPUT')? d3.select(document.activeElement).attr('value')==='menuConfigButton':true)) {
    // Deplace les noeuds sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
    // (exemples : le input de la largeur minimal d'un noeud)
    if (e.key == 'ArrowUp') {
      Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => {
        if (d != undefined) {
          return d.name
        }
      }).includes(f.name)).map(d => {
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
          return d.name
        }
      }).includes(f.name)).map(d => {
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
          return d.name
        }
      }).includes(f.name)).map(d => {
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
          return d.name
        }
      }).includes(f.name)).map(d => {
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

    set_show_nav(false)
    set_show_menu_node_apparence(false)
    set_show_menu_node_label(false)
    set_show_menu_node_io(false)
    set_show_menu_link_data(false)
    set_show_menu_link_appearence(false)
    set_show_menu_link_label(false)
    // set_mode_selection('s')
    // if ( button_ref && button_ref.current && accordion_ref ) {
    //   button_ref.current.click()
    // }

  } /*else if (e.key == 'z' && (e.ctrlKey||e.metaKey)) {
    e.preventDefault()
    //va chercher les différences sauvegardées dans le localStorage
    // const differences = JSON.parse(localStorage.getItem('diff') as string)
    const differences_str = LZString.decompress(localStorage.getItem('diff') as string) as string
    const differences = (differences_str != '') ? JSON.parse(differences_str) : undefined
    //Si il y a des différences, prend la dernière effectuée
    if (differences !== undefined && differences.length != 0) {
      type difference_type = {
        kind: string,
        path: string[],
        item: {
          rhs: string,
          kind: string
        },
        rhs: string,
        index: string
      }
      const difference = differences.pop() as difference_type[]
      //On crée une copie de data que l'on utilise ensuite pour pouvoir le parcourir et modifié
      //La copie nous permet de reffecter une variable avec d'autre type d'objet
      //Nous ne pouvons pas prendre ddirectement data car c'est un composant régis par des paramètre obligatoire
      //element_to_delete change de type au fur et à mesure qu'il parcours les chemins des différences
      let dt = JSON.parse(JSON.stringify(data))
      //Parcours les dernières modifications à effectuer
      //D : Supprime un objet qui a été ajouté
      //N : Rajoute un objet qui a été supprimé avec les mêmes propriétés
      //A : Annule des moddification faites à des array
      //E : Annule des modifications faites à des propriétées de l'objet
      //path : Tableau contenant le chemin vers la propriété modifié/ajouté/supprimé
      // Exemple : path=['P1','P2'] --> {P1:{P2:Propriété modifié}}
      difference.map(d => {
        let element_to_delete = dt
        if (d['kind'] == 'D') {
          let cpt = 0
          d.path.map(dd => {
            cpt++
            if (cpt == d['path'].length) {
              delete element_to_delete[dd]
            } else {
              element_to_delete = element_to_delete[dd]
            }
          })
        } else if (d['kind'] == 'N') {
          let cpt = 0
          d.path.map(dd => {
            cpt++
            if (cpt == d['path'].length) {
              element_to_delete[dd] = d['rhs']
            } else {
              element_to_delete = element_to_delete[dd]
            }
          })
        } else if (d['kind'] == 'A') {
          let cpt = 0
          d.path.map(dd => {
            cpt++
            if (cpt == d['path'].length) {
              if (d['item']['kind'] == 'N') {
                element_to_delete[dd].splice(d['index'], 0, d['item']['rhs'])
              } else if (d['item']['kind'] == 'D') {
                element_to_delete[dd].splice(d['index'], 1)
              }
            } else {
              element_to_delete = element_to_delete[dd]
            }
          })
        } else if (d['kind'] == 'E') {
          let cpt = 0
          if (d.path !== null && d.path !== undefined) {
            d.path.map(dd => {
              cpt++
              if (cpt == d['path'].length) {
                element_to_delete[dd] = d['rhs']
              } else {
                element_to_delete = element_to_delete[dd]
              }
            })
          } else {
            dt = d['rhs']
          }
        }
      })
      data = dt
      localStorage.setItem('diff', JSON.stringify(differences))
      try {
        //Permet d'éviter qu'une vue soit stocké en tant que données dans la naviguateur
        localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
      } catch (e) {
        localStorage.clear()
      }
      set_data({ ...data })
    } else {
      console.log('Aucune action en mémoire pour un retour en arrière')
    }
  }*/
  else if(e.key=='Delete'){
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
    set_data({...data})

  }else if(e.key=='Enter' && document.activeElement?.tagName=='INPUT' && document.activeElement?.className.includes('form-control')){
    for(const item of document.getElementsByTagName('input')){
      if(item.className.includes('form-control') && item.type=='text'){
        item.blur()
      }
    }
  }else if(e.key=='s' && e.ctrlKey && !e.shiftKey){
    e.preventDefault()
    localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  }else if((e.key=='s' && e.ctrlKey && e.shiftKey)||(e.key=='S' && e.ctrlKey && e.shiftKey)){
    e.preventDefault()
    set_data({...data})
    clickSaveDiagram(data)
  }
}





SankeyDraw.propTypes = SankeyDrawPropTypes
SankeyDraw.defaultProps = SankeyDrawDefaultProps

export default SankeyDraw

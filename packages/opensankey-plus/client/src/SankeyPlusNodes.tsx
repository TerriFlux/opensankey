import React from 'react'
import { Form, Tab, OverlayTrigger,Tooltip, Button, InputGroup, Badge } from 'react-bootstrap'
import { SankeyLinkValue } from 'open-sankey/src/lib/types'
import { TFunction } from 'i18next'
import {removeAnimate, drawArrows,svgDragMiddleMouseStart,svgDragMiddleMouseMove,node_visible_on_svg} from 'open-sankey/dist/SankeyDrawFunction'

import * as d3 from 'd3'
import {SankeyPlusData,SankeyPlusNode} from './types'
import {  getLinkValue,node_color,link_color,return_value_node,return_value_link, } from 'open-sankey/dist/SankeyUtils'
import { SankeyPlusLabel,SankeyPlusLink,plusDrawArrowsType} from './types'
import {opposing_drag_elements,drag_elements,drag_node_text,return_out_of_bound_element} from 'open-sankey/dist/SankeyDrag'

import { FaEyeSlash, FaEye} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare} from '@fortawesome/free-solid-svg-icons'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodeIcon = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  radio_selected:string,
  is_activated:boolean,
  menu_for_modal=false
)=> {
  data.icon_catalog=(data.icon_catalog)?data.icon_catalog:{}

  const valueAllIconRatio = () => {
    let display_ratio = true
    let ratio = 100
    if (multi_selected_nodes.current.length !== 0) {
      ratio = multi_selected_nodes.current[0].iconRatio
    }
    multi_selected_nodes.current.map((d) => {
      display_ratio = (d.iconRatio === ratio) ? display_ratio : false
    })
    const d = (ratio === 0) ? '' : ratio
    return (display_ratio) ? d : 100
  }
  const isAllIconVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(
      d => visible = (d.iconVisible) ? true : visible)
    return visible
  }

  const content_tab=<>
    <OverlayTrigger
      key={'iconDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'iconDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'75%'}}
        >
          {t('Noeud.apparence.Visibilité')}
          {(!is_activated)?<Badge pill bg="info" style={{marginLeft:'auto'}}>{t('Menu.featureLocked')}</Badge>:<></>}
        </InputGroup.Text>

        <Button
          style={{width:'25%'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={isAllIconVisible()?'primary':'outline-primary'}
          onClick={
            () => {
              Object.values(data.nodes).filter(
                f => multi_selected_nodes.current.map(
                  d => d.idNode).includes(f.idNode)).map(
                d => d.iconVisible = !isAllIconVisible())
              set_data({ ...data })
            }
          }
        >
          {isAllIconVisible()?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>
    </OverlayTrigger>

    {isAllIconVisible()?<>
      <OverlayTrigger
        key={'iconDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'iconDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <InputGroup>
          <InputGroup.Text
            style={{
              color:(!is_activated)?'#666666':'',
              backgroundColor:(!is_activated)?'#cccccc':'',
              width:(!is_activated)?'60%':'40%'}}
          >
            {t('Noeud.icon.si')}
            {(!is_activated)?<Badge pill bg="info" style={{marginLeft:'auto'}}>{t('Menu.featureLocked')}</Badge>:<></>}
          </InputGroup.Text>
          <Form.Select
            style={{width:(!is_activated)?'40%':'60%'}}
            disabled={!is_activated}
            onChange={(evt : React.ChangeEvent<HTMLSelectElement>) => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                d.iconName = evt.target.value
              })
              set_data({ ...data })
            }}
            value={multi_selected_nodes.current.length>0?multi_selected_nodes.current[0].iconName:'None'}
          >
            <option key={0} value={'none'}>{t('Noeud.icon.Aucun')}</option>
            {Object.keys(data.icon_catalog).map((n, i) => {
              return <option key={i + 1} value={n}>{n}</option>
            })}
          </Form.Select>
        </InputGroup>
      </OverlayTrigger>

      <OverlayTrigger
        key={'iconDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'iconDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <InputGroup>
          <InputGroup.Text
            style={{
              color:(!is_activated)?'#666666':'',
              backgroundColor:(!is_activated)?'#cccccc':'',
              width:'40%'}}
          >
            {t('Noeud.apparence.Couleur')}
            {(!is_activated)?<Badge pill bg="info" style={{marginLeft:'auto'}}>{t('Menu.featureLocked')}</Badge>:<></>}
          </InputGroup.Text>

          <Form.Control
            style={{width:'60%'}}
            type='color'
            disabled={!is_activated?true:(radio_selected !== 'local')}
            value={(multi_selected_nodes.current.length === 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff'}
            onChange={evt => {
              const color = evt.target.value
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconColor = color)
              set_data({ ...data })
            }}
          />
        </InputGroup>
      </OverlayTrigger>

      <OverlayTrigger
        key={'iconDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'iconDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <InputGroup>
          <InputGroup.Text
            style={{
              color:(!is_activated)?'#666666':'',
              backgroundColor:(!is_activated)?'#cccccc':'',
              width:(!is_activated)?'70%':'50%'}}
          >
            {t('Noeud.icon.rIN')}
            {(!is_activated)?<Badge pill bg="info" style={{marginLeft:'auto'}}>{t('Menu.featureLocked')}</Badge>:<></>}
          </InputGroup.Text>
          <Form.Control
            type='number'
            disabled={!is_activated?true:(radio_selected !== 'local')}
            value={valueAllIconRatio()}
            onChange={evt => {
              let ratio = +evt.target.value
              ratio = (ratio > 100) ? 100 : ratio
              ratio = (ratio < 0) ? 0 : ratio
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconRatio = ratio)
              set_data({ ...data })
            }}
          />
          <InputGroup.Text
            style={{
              color:(!is_activated)?'#666666':'',
              backgroundColor:(!is_activated)?'#cccccc':'',
              width:'10%'}}
          >
            %
          </InputGroup.Text>
        </InputGroup>
      </OverlayTrigger>
    </>:<></>}
  </>

  return menu_for_modal?content_tab:<Tab eventKey="node_icon" title={t('Noeud.icon.icon')}>{content_tab}</Tab>
}

const calcPath = (
  data: SankeyPlusData,
  nodes: { [node_id: string]: SankeyPlusNode },
  node: SankeyPlusNode,
  new_links: string[],
) => {
  // let number_new_path=0
  let long = 0
  const links_present = node.outputLinksId.filter(o => new_links.includes(o))

  if (links_present.length > 0) {
    long += 1
    links_present.forEach(d => {
      const n = nodes[data.links[d].idTarget]
      const lng = calcPath(data,nodes, n, new_links.filter(i=>!return_value_link(data,data.links[i],'recycling'))) as number
      long += isNaN(lng) ? 0 : lng

    })
    return long
  }
}

const node_mouse_click=(
  data:SankeyPlusData,
  set_animating:(b:boolean)=>void,
  event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
  if (event.shiftKey) {
    event.preventDefault()
    set_animating(true)
    // Animation des flux du Sankey
    sankeyTooltip.style('opacity', 0)
    // on donne ici un style temporaire, les parametres initiaux restent dans le attr que l'on pourra récupérer plus tard pour la remise en état du sankey
    d3.select(' .opensankey #svg').selectAll('.arrow').attr('fill', '#dddddd')

    d3.select(' .opensankey #svg').selectAll('.link').style('stroke', '#dddddd')
    d3.select(' .opensankey #svg').selectAll('.node').style('fill', '#dddddd')
    d3.select(' .opensankey #svg').selectAll('.link_value').style('display', 'none')
    const dd=(d as SankeyPlusNode)
    const nodeDisplay = [(d as SankeyPlusNode).idNode]
    branchAnimate(data,dd,nodeDisplay)
    const node_visible=node_visible_on_svg()
    const visible_links = Object.values(data.links).filter(l=>node_visible.includes(l.idSource) && node_visible.includes(l.idTarget)).map(l=>l.idLink)
    const start_point = Object.values(data.nodes).filter(f => (f.inputLinksId.filter(i => visible_links.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0))
    let time_to_animate = 500
    Object.values(data.nodes).filter(f => {
      return (f.inputLinksId.filter(i => visible_links.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0)})
    //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
    if (start_point.length > 0) {
      let nb_animation = calcPath(data,data.nodes, dd, visible_links)
      nb_animation = (nb_animation !== undefined) ? nb_animation : 0
      time_to_animate += nb_animation * 2000
    }
    setTimeout(function () {
      set_animating(false)
    }, time_to_animate)
  }
}

const branchAnimate = (
  data:SankeyPlusData,
  nodeData: SankeyPlusNode,
  nodeDisplay: string[]
) => {

  // Permet la progation de l'animation sur l'ensemble du Sankey
  const nodeStart = nodeData.idNode

  // on pourrait aussi evnetuellement faire un clone des noeuds
  d3.select(' .opensankey #shape_' + nodeData.idNode).style('fill', d3.select(' .opensankey #shape_' + nodeData.idNode).attr('fill'))
  d3.select(' .opensankey #text_' + nodeData.idNode ).style('fill', d3.select(' .opensankey #shape_' + nodeData.idNode).attr('fill'))

  const glinks = (d3.select(' .opensankey #svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyPlusLink, HTMLElement, SankeyPlusLink>)
    .filter(function (d) {
      return d.idSource === nodeStart
    })

  // On fait une copie du link pour son animation, celle-ci sera supprimé après l'animation  (classe .tmp)
  const tmpLinks = glinks.clone(true).raise().attr('class', 'tmp')
  tmpLinks.selectAll('.link')
    .each(function () {
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
      const idLink = d3.select(this).attr('id').replace('path_','')
      const idTarget = data.links[idLink].idTarget
      // Modification des arrows après l'animation
      const arrow=d3.selectAll(' .opensankey #path_'+idLink+'_arrow')
      if(arrow!==undefined && arrow!= null){
        const colorTarget=(return_value_node(data,data.nodes[idTarget],'shape_visible'))?node_color(data.nodes[idTarget],data):((data.nodes[idTarget].iconVisible)?data.nodes[idTarget].iconColor:'grey')
        // const t=(data.links[idLink].gradient && data.colorMap=='no_colormap')?colorTarget:d3.select(this).attr('stroke')
        const l_grad=return_value_link(data,data.links[idLink],'gradient')
        const t=(l_grad)?colorTarget:link_color(data.links[idLink],data,getLinkValue)
        if(t){
          arrow.attr('fill',t)
          arrow.attr('opacity',0.85)
        }
      }

      // reaffichage des link value après l'animation
      d3.select(((this as unknown) as { parentNode: d3.BaseType }).parentNode).select('.link_value')
        .style('display', 'inline')
      //Propagration de l'animation sur les flux sortant du target_node
      // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
      if (!nodeDisplay.includes(idTarget)) {
        nodeDisplay.push(idTarget)
        let max=0
        const tmp=direct_son_as_distant_sibling(data,nodeData,data.nodes[idTarget],0,[idLink])
        max=(tmp>max)?tmp:max
        setTimeout(()=>{
          branchAnimate(data,data.nodes[idTarget], nodeDisplay)
        },max*2000)
      }
    })
}

const direct_son_as_distant_sibling=(data:SankeyPlusData,n:SankeyPlusNode,target:SankeyPlusNode,deep:number,link_to_avoid:string[])=>{
  //Cherche à savoir si un noeud qui recoit directement le flux de n ai aussi un path inderectement vers ce meme noeud
  //exemple : n0 -> n1  et n0 -> n2 -> n1
  //fonction utilisé pour que le noeud qui recoit le flux direct attend les chemin indirect avant de lancer les animations suivantes
  const next_link = n.outputLinksId.filter(f=>(!return_value_link(data,data.links[f],'recycling') && !Object.values(link_to_avoid).includes(f)))
  let max=0

  if(n.idNode === target.idNode){
    return deep-1
  }else if(next_link.length>0) {
    next_link.map(id=>{
      const next_node=data.nodes[data.links[id].idTarget]
      //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
      const to_avoid=link_to_avoid.concat([id])
      const tmp=direct_son_as_distant_sibling(data,next_node,target,deep+1,to_avoid)
      max=(tmp>max)?tmp:max
    })
  }

  return max


}

export const SankeyPlusNodeClickEvent=(
  data:SankeyPlusData,
  set_animating:(b:boolean)=>void,
  sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>
)=>{
  d3.selectAll(' .opensankey .node')
    .on('click', (event, d) => {
      // Apply some style change to element before starting the animation
      node_mouse_click(data,set_animating,event,d,sankeyTooltip)
    })
}

export const node_icon_fill_color=(data:SankeyPlusData,n:SankeyPlusNode)=>{
  if (n.colorTag in n.tags && n.colorTag in n.tags && n.colorParameter === 'groupTag') {
    const selected_tag = n.tags[n.colorTag][0]
    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
    if (tag && !return_value_node(data,n,'shape_visible')) {
      return tag.color as string
    } else {
      //console.log('tutu')
    }
  }
  return n.iconColor
}

export const node_icon_path=(data:SankeyPlusData,n:SankeyPlusNode)=>{
  const icon = data.icon_catalog[n.iconName]
  if (icon !== undefined) {
    return icon
  } else {
    return ''
  }
}

export const SankeyPlusDrawNodesIcon = (
  data:SankeyPlusData,
  mode_selection:string,
  nodeTooltipsContent: (data: SankeyPlusData, d: SankeyPlusNode) => string,

) => {



  const node_mouse_over=(data:SankeyPlusData,t:d3.BaseType,mode_selection:string,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    d3.select(t).attr('cursor', (mode_selection === 's')? 'pointer' : 'unset')
    if (return_value_node(data,d,'shape_visible') && (window.SankeyToolsStatic || event.shiftKey)) {
      sankeyTooltip
        .style('opacity', 1)
        .html(nodeTooltipsContent(data, d as SankeyPlusNode))
    }
  }

  const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,over_icon:boolean)=>{
    if ((return_value_node(data,d,'shape_visible') ||over_icon) && (window.SankeyToolsStatic || event.shiftKey)) {
      const h_tooltip=Number(sankeyTooltip.style('height').replace('px',''))
      let pos_tooltip_y= event.clientY
      const size_browser=window.innerHeight
      pos_tooltip_y=((h_tooltip+pos_tooltip_y)>size_browser)?event.pageY+(size_browser-(pos_tooltip_y+h_tooltip))-5:event.pageY

      const w_tooltip=Number(sankeyTooltip.style('width').replace('px',''))
      let pos_tooltip_x= event.clientX
      const size_browser_w=window.innerWidth
      pos_tooltip_x=((w_tooltip+pos_tooltip_x)>size_browser_w)?event.pageX-w_tooltip-30:event.pageX+30

      sankeyTooltip
        .style('top',pos_tooltip_y + 'px')
        .style('left',pos_tooltip_x + 'px')
    }
  }



  // const direct_son_as_distant_sibling=(data:SankeyPlusData,n:SankeyPlusNode,target:SankeyPlusNode,deep:number,link_to_avoid:string[])=>{
  //   //Cherche à savoir si un noeud qui recoit directement le flux de n ai aussi un path inderectement vers ce meme noeud
  //   //exemple : n0 -> n1  et n0 -> n2 -> n1
  //   //fonction utilisé pour que le noeud qui recoit le flux direct attend les chemin indirect avant de lancer les animations suivantes
  //   const next_link = n.outputLinksId.filter(f=>(!data.links[f].recycling && !Object.values(link_to_avoid).includes(f)))
  //   let max=0

  //   if(n.idNode==target.idNode){
  //     return deep-1
  //   }else if(next_link.length>0) {
  //     next_link.map(id=>{
  //       const next_node=data.nodes[data.links[id].idTarget]
  //       //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
  //       const to_avoid=link_to_avoid.concat([id])
  //       const tmp=direct_son_as_distant_sibling(data,next_node,target,deep+1,to_avoid)
  //       max=(tmp>max)?tmp:max
  //     })
  //   }

  //   return max


  // }




  const add_nodes_icon = (
  ) => {
    //----------------ICON-----------------

    // Add icon to node (if there is one associated to it)
    // then apply selected parameter
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)

    const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyPlusNode, d3.BaseType, unknown>)

    ggg_nodes
      .filter(d => d.iconName !== 'none' && d.iconVisible)
      .append('svg')
      .attr('viewBox', '0, 0, 1000, 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select(' .opensankey #shape_' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
        const shiftH = (+d3.select(' .opensankey #shape_' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select(' .opensankey #shape_' + n.idNode).attr('height') * (n.iconRatio) / 100)
      .attr('width', n => +d3.select(' .opensankey #shape_' + n.idNode).attr('width') * (n.iconRatio) / 100)
      .attr('x', 0)
      .append('g')
      .append('path')
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,event,d,sankeyTooltip)
      })
      .on('mousemove', function (event,d) {
        node_mouse_move(event,d,sankeyTooltip,true)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .style('fill', n =>node_icon_fill_color(data,n))
      .attr('d', n =>node_icon_path(data,n))

  }

  add_nodes_icon()

}

export const context_node_icon=(contextualised_node:SankeyPlusNode,
  set_show_menu_node_icon:(b:boolean)=>void,
  set_contextualised_node:(b:SankeyPlusNode|undefined)=>void,
  t:TFunction
)=>{

  const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />


  return contextualised_node!==undefined?<Button onClick={()=>{
    set_show_menu_node_icon(true)
    set_contextualised_node(undefined)
  }} variant='light'>{t('Noeud.icon.icon')} {icon_open_modal}</Button>:<></>

}

export const opposing_drag_elements_plus=(out_of_zone_item:(SankeyPlusNode|SankeyPlusLabel)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
)=>{


  opposing_drag_elements(out_of_zone_item,event,dragged,data,multi_selected_nodes)

  // const zdt=Object.keys(dragged).includes('idLabel')?dragged as SankeyPlusLabel:{} as SankeyPlusLabel

  if((out_of_zone_item[0].x<=0 && event.x<0) || (out_of_zone_item[0].x<=0 && event.dx<0)){
    // Shift not selected zdt to opposing direction
    Object.values((data as unknown as {labels:SankeyPlusLabel[]}).labels).forEach(lb=>{
      if(!multi_selected_label.current.includes(lb)){
        const new_pos_x = lb.x + 5
        lb.x = new_pos_x
        d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
      }
    })
  }


  if((out_of_zone_item[0].y<=0 && event.y<0) || (out_of_zone_item[0].y<=0 && event.dy<0)){

    // Shift zdt to opposing direction
    Object.values((data as unknown as {labels:SankeyPlusLabel[]}).labels).forEach(lb=>{
      if(!multi_selected_label.current.includes(lb)){
        const new_pos_y = lb.y + 5
        lb.y = new_pos_y
        d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
      }
    })

  }
}

export const SankeyPlusNodeDragEvent=(
  data:SankeyPlusData,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_links:{current:SankeyPlusLink[]},
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  multi_selected_label:{current:SankeyPlusLabel[]},
  min_width_and_height:(d:SankeyPlusData)=>number[],

)=>{
  if(mode_selection.current==='s'){
    (d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement,SankeyPlusNode,d3.BaseType, unknown> ).call(
      SankeyPlusdragGNodeEvent(
        data,multi_selected_nodes,mode_selection,alt_key_pressed,set_data,display_nodes,display_links,
        multi_selected_links,link_text,getLinkValue,scale,inv_scale,multi_selected_label,min_width_and_height
      )
    )
  }
  (d3.select('.opensankey #svg') as d3.Selection<Element, unknown, HTMLElement, unknown>).call(d3.drag<Element, unknown, HTMLElement>()
    .subject(Object)
    .filter(evt=>{
      evt.stopPropagation()
      evt.preventDefault()

      return d3.select(evt.target).attr('id')==='svg' && evt.which===2
    })
    .on('start',()=>svgDragMiddleMouseStart())
    .on('drag',evt=>{
      svgDragMiddleMouseMove(evt,data)
      // Drag ZDT too
      Object.values((data as unknown as {labels:SankeyPlusLabel[]}).labels).forEach(lb=>{
        const new_pos_x = lb.x + evt.dx
        const new_pos_y = lb.y + evt.dy
        lb.x = new_pos_x
        lb.y = new_pos_y
        d3.select(' .opensankey #' + lb.idLabel).attr('transform', 'translate(' + lb.x + ',' + lb.y + ')')
      })
    }).on('end',()=>set_data({...data}))

  )

}

export const SankeyPlusdragGNodeEvent=(
  data:SankeyPlusData,
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current:SankeyPlusLink[]},
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  multi_selected_label:{current:SankeyPlusLabel[]},
  min_width_and_height:(d:SankeyPlusData)=>number[],

)=>{
  const node_visible=[] as string[]
  return d3.drag<SVGGElement, SankeyPlusNode>()
    .subject(Object)
    .on('start',()=>{
      d3.selectAll('.node_shape').nodes().forEach(element => {
        node_visible.push(d3.select(element).attr('id'))
      })
    })
    .on('drag', function (event,node) {
      if(mode_selection.current==='s'){
        if(d3.select(event.subject.sourceEvent.target).node().tagName==='tspan' && alt_key_pressed && !(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)){
          drag_node_text(node, event)
        }else if(d3.select(event.subject.sourceEvent.target).node().tagName==='tspan' && !alt_key_pressed){
          drag_nodes_plus(node,event,multi_selected_nodes,data,
            set_data,display_nodes,display_links,multi_selected_links,link_text,min_width_and_height,getLinkValue,drawArrows,scale,inv_scale,multi_selected_label,node_visible
          )
        }
        if(d3.select(event.subject.sourceEvent.target).node().tagName==='rect' || d3.select(event.subject.sourceEvent.target).node().tagName==='ellipse'){
          drag_nodes_plus(node,event,multi_selected_nodes,data,
            set_data,display_nodes,display_links,multi_selected_links,link_text,min_width_and_height,getLinkValue,drawArrows,scale,inv_scale,multi_selected_label,node_visible
          )
        }
      }
    }).on('end',()=>{
      set_data(data)
    })
}

export  const drag_nodes_plus = (node:SankeyPlusNode,
  event: { dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current: SankeyPlusNode[] },
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current: SankeyPlusLink[] },
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyPlusData)=>number[],
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:plusDrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  multi_selected_label:{current:SankeyPlusLabel[]},
  node_visible:string[]
) => {
  removeAnimate()

  // Cherche si des element seront hors zone si on les drag
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
  const out_of_zone_item=return_out_of_bound_element_plus(node,data,event,multi_selected_nodes,node_visible)
  // Pousse les element non sélectionnés dans la direction opposé
  if(out_of_zone_item.length>0){
    opposing_drag_elements_plus(out_of_zone_item,event,node,data,multi_selected_nodes,multi_selected_label)
  }

  drag_elements_plus(node,data,event,multi_selected_nodes,multi_selected_label,set_data,display_nodes,display_links,multi_selected_links,link_text,min_width_and_height,getLinkValue,drawArrows,scale,inv_scale)

}

export const drag_elements_plus=(
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyPlusData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current: SankeyPlusLink[] },
  link_text:(data: SankeyPlusData, d: SankeyPlusLink,getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue) => string,
  min_width_and_height:(d:SankeyPlusData)=>number[],
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
  drawArrows:plusDrawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number
)=>{
  // const node=Object.keys(dragged).includes('idNode')?dragged as SankeyPlusNode:{} as SankeyPlusNode
  // const zdt=Object.keys(dragged).includes('idLabel')?dragged as SankeyPlusLabel:{} as SankeyPlusLabel
  drag_elements(dragged,data,event,multi_selected_nodes,set_data,display_nodes,display_links,multi_selected_links,link_text,min_width_and_height,getLinkValue,drawArrows,scale,inv_scale)


  // Drag zdt too
  multi_selected_label.current.map(l=>{
    const new_pos_x = l.x + event.dx
    const new_pos_y = l.y + event.dy
    l.x = (new_pos_x>=0)?new_pos_x:0
    l.y = (new_pos_y>0)?new_pos_y:0
    d3.select(' .opensankey #' + l.idLabel).attr('transform', 'translate(' + l.x + ',' + l.y + ')')

    d3.selectAll('.opensankey #gg_zdt_handles_'+l.idLabel+' .zdt_handles').nodes().forEach(el=>{
      const new_cx=Number(d3.select(el).attr('x'))
      const new_cy=Number(d3.select(el).attr('y'))
      d3.select(el).attr('x',(l.x<=0)?new_cx:(new_cx+event.dx))
      d3.select(el).attr('y',(l.y<=0)?new_cy:(new_cy+event.dy))
    })

  })
  // if(multi_selected_label.current.length===0 && Object.keys(zdt).length>0){
  //   const new_pos_x = zdt.x + event.dx
  //   const new_pos_y = zdt.y + event.dy
  //   zdt.x = (new_pos_x>=0)?new_pos_x:0
  //   zdt.y = (new_pos_y>0)?new_pos_y:0
  //   d3.select(' .opensankey #' + zdt.idLabel).attr('transform', 'translate(' + zdt.x + ',' + zdt.y + ')')
  // }
}

export const return_out_of_bound_element_plus=(dragged:SankeyPlusNode|SankeyPlusLabel,data:SankeyPlusData,event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},node_visible:string[]
)=>{

  // Cherche si des noeuds seront hors zone si on les drag
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé


  const out_of_zone_item:(SankeyPlusNode|SankeyPlusLabel)[]=return_out_of_bound_element(dragged,data,event,multi_selected_nodes,node_visible)


  Object.values((data as unknown as {labels:SankeyPlusLabel[]}).labels).filter(lb=>{
    return (lb.x<=0 && event.dx<0) || (lb.y<=0 && event.dy<0) || (lb.x<=0 && event.x<0) || (lb.y<=0 && event.y<0)
  }).forEach(lb=>out_of_zone_item.push(lb))


  return out_of_zone_item

}
import React from 'react'
import { Col, Form, FormCheck, FormLabel, Row,Tab,OverlayTrigger,Tooltip } from 'react-bootstrap'
import {  SankeyLink,TagsCatalog,SankeyDrawCurve} from 'open-sankey/src/lib/types'
import { TFunction } from 'i18next'
import {removeAnimate} from 'open-sankey/dist/SankeyDrawFunction'
import * as d3 from 'd3'
import {SankeyPlusData,SankeyPlusNode,SankeyPlusLink} from './types'
import {  getLinkValue,test_link_value,node_color,link_color } from 'open-sankey/dist/SankeyUtils'
import { SankeyPlusDrawArrows,dragNodeRedrawGradient } from './SankeyPlusGradient'

export const SankeyPlusNodesAttributes = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean
) => {
  const isAllNodeVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.shape_visible || d.not_to_scale) ? true : visible)
    return visible
  }
  const isAllNodeToScale = () => {
    let toScale = false
    multi_selected_nodes.current.map(d => toScale = (d.not_to_scale) ? true : toScale)
    return toScale
  }
  const isAllNodeNotToScaleOrientation = (orientation:string) => {
    let same_orientation = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => same_orientation = (d.not_to_scale_direction !== orientation) ? false : same_orientation)
    } else {
      same_orientation = false
    }
    return same_orientation
  }
  const form_elements= [
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.toScale')}</FormLabel>
      </Col>
      <Col xs={1}>
        <FormCheck inline
          type='switch'
          checked={isAllNodeToScale()}
          disabled={!is_activated}
          onChange={evt => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale = evt.target.checked)
            set_data({ ...data })
          }}
        />
      </Col>

    </Form.Group>,
    <Col xs={5}>
      <FormLabel style={{color:(isAllNodeVisible() && is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Orientation')}</FormLabel>
    </Col>,
    <Form.Group as={Row} >       
      <Col  xs={3}>
        <FormCheck
          value="left"
          type='radio'
          label={t('Noeud.apparence.toScaleLeft')}
          disabled={(!is_activated)?true:!isAllNodeToScale()}
          checked={isAllNodeNotToScaleOrientation('left')}
          onChange={evt => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            set_data({ ...data })
          }}
        />
      </Col>
      <Col xs={3}>
        <FormCheck
          value="right"
          type='radio'
          label={t('Noeud.apparence.toScaleRight')}
          disabled={(!is_activated)?true:!isAllNodeToScale()}
          checked={isAllNodeNotToScaleOrientation('right')}
          onChange={evt => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            set_data({ ...data })
          }}
        />
      </Col>
      <Col xs={3}>
        <FormCheck
          value="top"
          type='radio'
          label={t('Noeud.apparence.toScaleTop')}
          disabled={(!is_activated)?true:!isAllNodeToScale()}
          checked={isAllNodeNotToScaleOrientation('top')}
          onChange={evt => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            set_data({ ...data })
          }}
        />
      </Col>
      <Col xs={3}>
        <FormCheck
          value="bottom"
          type='radio'
          label={t('Noeud.apparence.toScaleBottom')}
          disabled={(!is_activated)?true:!isAllNodeToScale()}
          checked={isAllNodeNotToScaleOrientation('bottom')}
          onChange={evt => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            set_data({ ...data })
          }}
        />
      </Col>
    </Form.Group>]

  if(is_activated){
    return form_elements
  }else{
    return form_elements.map((e,i)=>{
      return <React.Fragment key={i}><OverlayTrigger
        key={'SankeyPlusNodesAttributes'+i}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'SankeyPlusNodesAttributes'+i}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >{e}</OverlayTrigger></React.Fragment>
    })
  }
}

export const SankeyPlusNodeIcon = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  radio_selected:string,
  is_activated:boolean
)=> {
  data.icon_catalog=(data.icon_catalog)?data.icon_catalog:{}
  const isAllIconSame = (param: string) => {
    let icon = true
    multi_selected_nodes.current.map(d => {
      icon = (d.iconName == param) ? icon : false
    })
    return icon
  }
  const valueAllIconRatio = () => {
    let display_ratio = true
    let ratio = 100
    if (multi_selected_nodes.current.length != 0) {
      ratio = multi_selected_nodes.current[0].iconRatio
    }
    multi_selected_nodes.current.map((d) => {
      display_ratio = (d.iconRatio == ratio) ? display_ratio : false
    })
    const d = (ratio == 0) ? '' : ratio
    return (display_ratio) ? d : 100
  }
  const isAllIconVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.iconVisible) ? true : visible)
    return visible
  }

  return <Tab eventKey="node_icon" title={t('Noeud.icon.icon')}>
    <OverlayTrigger
      key={'iconDisabled'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'iconDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <Form>
        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:(is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Visibilité')}</FormLabel>
          </Col>
          <Col xs={5}>
            <FormCheck inline
              type='switch'
              checked={isAllIconVisible()}
              disabled={!is_activated}
              onChange={evt => {

                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconVisible = evt.target.checked)
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>


        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:((is_activated)?isAllIconVisible():false)?'#555555':'#DADADA'}}>{t('Noeud.icon.si')}</FormLabel>
          </Col>
          <Col xs={5}>
            <Form.Select
              disabled={!is_activated?true:!isAllIconVisible()}
              onChange={(evt : React.ChangeEvent<HTMLSelectElement>) => {
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                  d.iconName = evt.target.value
                })
                set_data({ ...data })
              }}
            >
              <option key={0} value={'none'} selected={isAllIconSame('none')}>{t('Noeud.icon.Aucun')}</option>

              {Object.keys(data.icon_catalog).map((n, i) => {

                return <option key={i + 1} value={n} selected={isAllIconSame(n)}>{n}</option>
              })}
            </Form.Select>
          </Col>
        </Form.Group>
        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:((is_activated)?isAllIconVisible():false)?'#555555':'#DADADA'}} >{t('Noeud.apparence.Couleur')}</FormLabel>
          </Col>
          <Col xs={3}>
            <Form.Control
              type='color'
              disabled={!is_activated?true:(radio_selected !== 'local' || !isAllIconVisible())}
              value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff'}
              onChange={evt => {
                const color = evt.target.value
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconColor = color)
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row}>
          <Col xs={4}>
            <FormLabel style={{color:((is_activated)?isAllIconVisible():false)?'#555555':'#DADADA'}} >{t('Noeud.icon.rIN')}</FormLabel>
          </Col>
          <Col xs={3}>
            <Form.Control
              type='number'
              disabled={!is_activated?true:(radio_selected !== 'local' || !isAllIconVisible())}
              value={valueAllIconRatio()}
              onChange={evt => {
                let ratio = +evt.target.value
                ratio = (ratio > 100) ? 100 : ratio
                ratio = (ratio < 0) ? 0 : ratio
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconRatio = ratio)
                set_data({ ...data })
              }}
            />
          </Col>
          <Col xs={4}>
            <FormLabel style={{color:((is_activated)?isAllIconVisible():false)?'#555555':'#DADADA'}} >%</FormLabel>
          </Col>
        </Form.Group>
      </Form></OverlayTrigger>
  </Tab>
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
      const lng = calcPath(data,nodes, n, new_links) as number
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

    const visible_links = Object.values(data.links).filter(l=>data.nodes[l.idSource].node_visible && data.nodes[l.idTarget].node_visible ).map(l=>l.idLink)
    const start_point = Object.values(data.nodes).filter(f => (f.inputLinksId.filter(i => visible_links.includes(i)).length == 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0))
    let time_to_animate = 500
    Object.values(data.nodes).filter(f => {
      return (f.inputLinksId.filter(i => visible_links.includes(i)).length == 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0)})
    //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
    if (start_point.length > 0) {
      let nb_animation = calcPath(data,data.nodes, start_point[0], visible_links)
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
  d3.select(' .opensankey #' + nodeData.idNode).style('fill', d3.select(' .opensankey #' + nodeData.idNode).attr('fill'))
  d3.select(' .opensankey #' + nodeData.idNode + '_text').style('fill', d3.select(' .opensankey #' + nodeData.idNode).attr('fill'))
      
  const glinks = (d3.select(' .opensankey #svg').selectAll('.gg_links') as d3.Selection<SVGElement, SankeyLink, HTMLElement, SankeyLink>)
    .filter(function (d) {
      return d.idSource == nodeStart
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
      const idLink = d3.select(this).attr('id')
      const idTarget = data.links[idLink].idTarget
      // Modification des arrows après l'animation
      const arrow=d3.selectAll(' .opensankey #'+idLink+'_arrow')
      if(arrow!==undefined && arrow!= null){        
        const colorTarget=(data.nodes[idTarget].shape_visible)?node_color(data.nodes[idTarget],data):((data.nodes[idTarget].iconVisible)?data.nodes[idTarget].iconColor:'grey')
        // const t=(data.links[idLink].gradient && data.colorMap=='no_colormap')?colorTarget:d3.select(this).attr('stroke')
        const t=(data.links[idLink].gradient)?colorTarget:link_color(data.links[idLink],getLinkValue)
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
  const next_link = n.outputLinksId.filter(f=>(!data.links[f].recycling && !Object.values(link_to_avoid).includes(f)))
  let max=0
  
  if(n.idNode==target.idNode){
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
    if (tag && !n.shape_visible) {
      return tag.color as string
    } else {
      //console.log('tutu')
    }
  }
  return n.iconColor
}
  
export const node_icon_path=(data:SankeyPlusData,n:SankeyPlusNode)=>{
  const icon = data.icon_catalog[n.iconName]
  if (icon != undefined) {
    return icon
  } else {
    return ''
  }
}

export const SankeyPlusDrawNodesIcon = (
  data:SankeyPlusData, 
  mode_selection:string,
  static_sankey:boolean,
  nodeTooltipsContent: (data: SankeyPlusData, d: SankeyPlusNode) => string,
  
) => {


  
  const node_mouse_over=(data:SankeyPlusData,t:d3.BaseType,mode_selection:string,static_sankey:boolean,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)=>{
    d3.select(t).attr('cursor', (mode_selection == 's')? 'pointer' : 'unset')
    if ((d as SankeyPlusNode).shape_visible && event.shiftKey) {
      sankeyTooltip
        .style('opacity', 1)
        .html(nodeTooltipsContent(data, d as SankeyPlusNode))
    }
  }
        
  const node_mouse_move=(static_sankey:boolean,event:React.MouseEvent<HTMLButtonElement>,d:unknown,sankeyTooltip:d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,over_icon:boolean)=>{
    if (((d as SankeyPlusNode).shape_visible ||over_icon) && event.shiftKey) {
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
      .filter(d => d.iconName != 'none' && d.iconVisible)
      .append('svg')
      .attr('viewBox', '0, 0, 1000, 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select(' .opensankey #' + n.idNode).attr('height') * (100 - n.iconRatio) / 100) / 2
        const shiftH = (+d3.select(' .opensankey #' + n.idNode).attr('width') * (100 - n.iconRatio) / 100) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select(' .opensankey #' + n.idNode).attr('height') * (n.iconRatio) / 100)
      .attr('width', n => +d3.select(' .opensankey #' + n.idNode).attr('width') * (n.iconRatio) / 100)
      .attr('x', 0)
      .append('g')
      .append('path')
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,static_sankey,event,d,sankeyTooltip)
      })
      .on('mousemove', function (event,d) {
        node_mouse_move(static_sankey,event,d,sankeyTooltip,true)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .style('fill', n =>node_icon_fill_color(data,n))
      .attr('d', n =>node_icon_path(data,n))

  }
  // useEffect(()=>{
  //   console.log('test')
  //   add_nodes_icon()
  //   console.log('test2')

  // })
  add_nodes_icon()
  
}

export  const SankeyPlusDrag_nodes = (
  nodes: { [node_id: string]: SankeyPlusNode },
  links: { [link_id: string]: SankeyPlusLink },
  display_style: { italic?: boolean; bold?: boolean; node_font_size: number;  uppercase?: boolean; trade_close?: boolean; filter: number; filter_label: number },
  nodeTags: TagsCatalog,
  dragged:Element,
  event: { dx: number; dy: number },
  data:SankeyPlusData,
  multi_selected_nodes:{current: SankeyPlusNode[] },
  min_width_and_height:(d:SankeyPlusData)=>number[],
  drawGrid:(d:SankeyPlusData)=>void,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  sankeyTooltip:d3.Selection<HTMLDivElement,unknown,HTMLElement,unknown>,
  min_thickness:number,
  drawCurveFunction : SankeyDrawCurve,
  multi_selected_links:{current: SankeyLink[] },
  link_text:(data: SankeyPlusData, d: SankeyLink) => unknown,


) => {
  const { width } = data
  removeAnimate()
  
  if(multi_selected_nodes.current.length>0){
    multi_selected_nodes.current.map(node=>{
  
      const old_x = +node.x
      const old_y = +node.y
      const new_x = old_x + event.dx
      const new_y = old_y + event.dy
  
  
      if (new_x < 0 || new_x > (width - node.node_width) || new_y < 0 || new_y > (data.height - node.node_height)) {
        return
      }
  
      node.x = new_x
      node.y = new_y;
  
  
  
      [data.width, data.height] = min_width_and_height(data)
      if (data.fit_screen) {
        const svgSankey = d3.select(' .opensankey #svg')
        svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
      } else {
        d3.select(' .opensankey #svg').style('width', data.width + 'px')
      }
  
  
  
      d3.select(' .opensankey #svg').style('height', data.height + 'px')
      drawGrid(data)
  
      const stream_io = node.inputLinksId.concat(node.outputLinksId)
      //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs
      for (const i in stream_io) {
        const l = links[stream_io[i]]
        if ( !data.nodes[l.idSource].display && !data.nodes[l.idTarget].display) {
          continue
        }
        //position noeud source ou target
        let pos_x_src, pos_y_src
        if (node.idNode == nodes[l.idSource].idNode) {
          pos_x_src = nodes[l.idTarget].x
          pos_y_src = nodes[l.idTarget].y
        } else {
          pos_x_src = nodes[l.idSource].x
          pos_y_src = nodes[l.idSource].y
        }
        const link_value = test_link_value(data, nodes, l)
        //Zones limite à ne pas êtres
        const limit_x = [pos_x_src - scale(link_value), pos_x_src + node.node_width + scale(link_value)]
        const limit_y = [pos_y_src - scale(link_value), pos_y_src + scale(link_value)]
        let draw_warning = false
        //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
        //si partie gauche du noeud ne se situe pas dans les coord du noeud source
        const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
        //si partie droite du noeud ne se situe pas dans le noeud source
        const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
        //si partie haute du noeud ne se situe pas dans le noeud source
        const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
        //const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]
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
          draw_warning = left_in_src || right_in_src || top_in_src
        }
        if (draw_warning && !l.recycling) {
          d3.select(' .opensankey #' + l.idLink).attr('stroke-width', '1px')
        } else {
        //retour à la normal
          d3.select(' .opensankey #' + l.idLink).attr('stroke-width', d => {
            const link_values = getLinkValue(data, (d as SankeyLink).idLink)
            const is_free = link_values.extension!.free_mini !== undefined && 
                            data.show_structure !== 'free_interval' &&
                            data.show_structure !== 'free_value' &&
                            !link_values.extension!.free_visible
            if (is_free) {
              return 5
            }
            const link_value = test_link_value(data, nodes, (d as SankeyLink))
            const tmp=(link_value=='')?1:link_value
            return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))
          })
        }
      }
  
      sankeyTooltip.style('opacity', 0) // Fermeture de la tooltip au click
  
      d3.select(' .opensankey #ggg_'+node.idNode).attr('transform', 'translate(' + new_x + ',' + new_y + ')')
      d3.select(' .opensankey #tooltip_node' + node.idNode).attr('transform', 'translate(' + (new_x + 50) + ',' + (new_y + 20) + ')')
      const error_msg: { [text: string]: string } = {}
      Object.values(links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display).forEach(
        link => {
  
  
          //Redessine les gradients correctement si la pos du noeud source passe de l'autre coté du noeud target
          if (link.gradient) {
            dragNodeRedrawGradient(nodes,link,data)
          }
  
          if (link.label_on_path) {
            if (link.recycling) {
              if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
                d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'left')
              } else if (link.label_position === 'middle' && link.orientation === 'hh') {
                d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'right')
              }
            } else {
              if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
                d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'left')
              } else if (link.label_position === 'middle' /*&& link.orientation === 'hh'*/) {
                d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'right')
              }
            }
              
            if (link.orthogonal_label_position === 'middle') {
              d3.select(' .opensankey #' + link.idLink + '_text').attr('dy', '0.3em')
            } else if (link.orthogonal_label_position === 'below') {
              let tmp=getLinkValue(data, link.idLink).value
              tmp=(tmp)?tmp:0
              // return scale(getLinkValue(data, link.idLink).value) / 2 + 10 + 'px'
              d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 10 + 'px')
              d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 10 + 'px')
  
            } else if (link.orthogonal_label_position === 'above') {
              let tmp=getLinkValue(data, link.idLink).value
              tmp=(tmp)?tmp:0
              // return -scale(getLinkValue(data, link.idLink).value) / 2 + 'px'
              d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 'px')
  
            }
          
          }
  
          if (link.idSource === node.idNode || link.idTarget === node.idNode) {
            // Redraw link
            const old_x_pos = +d3.select(' .opensankey #' + link.idLink + '_text').attr('x')
            const old_y_pos = +d3.select(' .opensankey #' + link.idLink + '_text').attr('y')
            if (!(link.label_position === 'frozen')) {
              d3.select(' .opensankey #' + link.idLink + '_text').attr('x', old_x_pos + 1 / 2 * (new_x - old_x))
              d3.select(' .opensankey #' + link.idLink + '_text').attr('y', old_y_pos + 1 / 2 * (new_y - old_y))
            }
            // select allows to redraw directly without refreshing
            d3.select(' .opensankey #' + link.idLink)
              .attr('d', () => {
                return drawCurveFunction.curve(data,
                  nodes, links, display_style,
                  data.nodeTags,
                  link,
                  error_msg,multi_selected_links,link_text
                )
              })
            const target_node = nodes[link.idTarget]
            if (link.arrow) {
              //const node_select = d3.select('#ggg_' + target_node.idNode) as d3.Selection<d3.BaseType, SankeyPlusNode, HTMLElement, SankeyPlusNode>
              SankeyPlusDrawArrows(target_node as SankeyPlusNode,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
              //SankeyPlusDrawArrows(data, target_node, nodes, links, display_style, nodeTags,scale,inv_scale,min_thickness)
            }
            for (let i = 0; i < target_node.inputLinksId.length; i++) {
              d3.select(' .opensankey #' + target_node.inputLinksId[i])
                .attr('d', (link => {
                  return drawCurveFunction.curve(data,
                    nodes, links, display_style,
                    nodeTags,
                      link as SankeyLink,
                      error_msg,multi_selected_links,link_text
                  )
                }))
            }
            for (let i = 0; i < target_node.outputLinksId.length; i++) {
              d3.select(' .opensankey #' + target_node.outputLinksId[i])
                .attr('d', link => {
                  return drawCurveFunction.curve(data,
                    nodes, links, display_style,
                    nodeTags,
                      link as SankeyLink,
                      error_msg,multi_selected_links,link_text
                  )
                })
  
            }
          }
        })
  
      if (error_msg.text !== undefined) {
        alert(error_msg)
      }
  
    })
  }else{
    const idNode = dragged.id.substring(4)
    const node=nodes[idNode]

    const old_x = +node.x
    const old_y = +node.y
    const new_x = old_x + event.dx
    const new_y = old_y + event.dy

  
    if (new_x < 0 || new_x > (width - node.node_width) || new_y < 0 || new_y > (data.height - node.node_height)) {
      return
    }
  
    node.x = new_x
    node.y = new_y;



    [data.width, data.height] = min_width_and_height(data)
    if (data.fit_screen) {
      const svgSankey = d3.select(' .opensankey #svg')
      svgSankey.attr('viewBox', [0, 0, data.width, data.height] as unknown as string)
    } else {
      d3.select(' .opensankey #svg').style('width', data.width + 'px')
    }
  
  
  
    d3.select(' .opensankey #svg').style('height', data.height + 'px')
    drawGrid(data)

    const stream_io = node.inputLinksId.concat(node.outputLinksId)
    //Met les flux entre les noeuds qui sont 'invalides' en mode fin pour afficehr erreurs
    for (const i in stream_io) {
      const l = links[stream_io[i]]
      if ( !data.nodes[l.idSource].display && !data.nodes[l.idTarget].display) {
        continue
      }
  
      //position noeud source ou target
      let pos_x_src, pos_y_src
      if (node.idNode == nodes[l.idSource].idNode) {
        pos_x_src = nodes[l.idTarget].x
        pos_y_src = nodes[l.idTarget].y
      } else {
        pos_x_src = nodes[l.idSource].x
        pos_y_src = nodes[l.idSource].y
      }
  
  
      const link_value = test_link_value(data, nodes, l)
      //Zones limite à ne pas êtres
      const limit_x = [pos_x_src - scale(link_value), pos_x_src + node.node_width + scale(link_value)]
      const limit_y = [pos_y_src - scale(link_value), pos_y_src + scale(link_value)]
  
      let draw_warning = false
  
      //verifie que la position du noeud drag n'est pas au même niveau que ses noeuds traget
      //si partie gauche du noeud ne se situe pas dans les coord du noeud source
      const left_in_src = node.x > limit_x[0] && node.x < limit_x[1]
      //si partie droite du noeud ne se situe pas dans le noeud source
      const right_in_src = node.x + node.node_width > limit_x[0] && node.x + node.node_width < limit_x[1]
      //si partie haute du noeud ne se situe pas dans le noeud source
      const top_in_src = node.y > limit_y[0] && node.y < limit_y[1]
      //const bottom_in_src = node.y + scale(link_value) > limit_y[0] && node.y + scale(link_value) < limit_y[1]
  
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
        draw_warning = left_in_src || right_in_src || top_in_src
      }
  
      if (draw_warning && !l.recycling) {
        d3.select(' .opensankey #' + l.idLink).attr('stroke-width', '1px')
      } else {
        //retour à la normal
        d3.select(' .opensankey #' + l.idLink).attr('stroke-width', d => {
          const link_value = test_link_value(data, nodes, (d as SankeyLink))
          const tmp=(link_value=='')?1:link_value
          return scale(Math.max(inv_scale(min_thickness), tmp ? tmp : 0))
        })
      }
    }
  
    sankeyTooltip.style('opacity', 0) // Fermeture de la tooltip au click

    d3.select(' .opensankey #ggg_'+node.idNode).attr('transform', 'translate(' + new_x + ',' + new_y + ')')
    d3.select(' .opensankey #tooltip_node' + node.idNode).attr('transform', 'translate(' + (new_x + 50) + ',' + (new_y + 20) + ')')
    const error_msg: { [text: string]: string } = {}
    Object.values(links).filter(l=>data.nodes[l.idSource].display && data.nodes[l.idTarget].display).forEach(
      link => {
  
  
        //Redessine les gradients correctement si la pos du noeud source passe de l'autre coté du noeud target
        if (link.gradient) {
          const width_src = +d3.select(' .opensankey #' + link.idSource).attr('width')
          const height_src = +d3.select(' .opensankey #' + link.idSource).attr('height')
          const width_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('width')
          //const height_trgt = +d3.select(' .opensankey #' + link.idTarget).attr('height')
  
  
          if (link.orientation == 'hh' || link.orientation == 'hv') {
            d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
              if (nodes[link.idSource].x < nodes[link.idTarget].x) {
                d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                  .attr('x1', data.nodes[link.idSource].x + width_src)
                  .attr('y1', '0')
                  .attr('x2', nodes[link.idTarget].x)
                  .attr('y2', 0)
                const n = nodes[link.idSource]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              } else {
                d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                  .attr('x1', data.nodes[link.idTarget].x + width_trgt)
                  .attr('y1', '0')
                  .attr('x2', nodes[link.idSource].x)
                  .attr('y2', 0)
                const n = nodes[link.idTarget]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              }
            }
            )
  
            d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
              if (nodes[link.idSource].x > nodes[link.idTarget].x) {
                const n = nodes[link.idSource]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              } else {
                const n = nodes[link.idTarget]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              }
            }
            )
          } else if (link.orientation == 'vv' || link.orientation == 'hv') {
            //orientation vert-vert
            d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
              if (nodes[link.idSource].y < nodes[link.idTarget].y) {
                d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                  .attr('x1', 0)
                  .attr('y1', data.nodes[link.idSource].y + height_src)
                  .attr('x2', 0)
                  .attr('y2', data.nodes[link.idTarget].y)
  
                return nodes[link.idSource].color
              } else {
                d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                  .attr('x1', 0)
                  .attr('y1', data.nodes[link.idTarget].y + height_src)
                  .attr('x2', 0)
                  .attr('y2', data.nodes[link.idSource].y)
  
                return nodes[link.idTarget].color
              }
            }
            )
  
            d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
              if (nodes[link.idSource].y > nodes[link.idTarget].y) {
                return nodes[link.idSource].color
              } else {
                return nodes[link.idTarget].color
              }
            }
            )
          } else if (link.orientation == 'vh') {
  
            d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-start').attr('stop-color', () => {
              if (nodes[link.idSource].x < nodes[link.idTarget].x) {
                d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                  .attr('x1', data.nodes[link.idSource].x + width_src - 10)
                  .attr('y1', '0')
                  .attr('x2', nodes[link.idTarget].x)
                  .attr('y2', 0)
                const n = nodes[link.idSource]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              } else {
                d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode)
                  .attr('x1', data.nodes[link.idTarget].x + width_trgt + 10)
                  .attr('y1', '0')
                  .attr('x2', nodes[link.idSource].x)
                  .attr('y2', 0)
                const n = nodes[link.idTarget]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              }
            }
            )
  
            d3.select(' .opensankey #gradient-' + nodes[link.idSource].idNode + '-' + nodes[link.idTarget].idNode + ' #stop-end').attr('stop-color', () => {
              if (nodes[link.idSource].x > nodes[link.idTarget].x) {
                const n = nodes[link.idSource]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              } else {
                const n = nodes[link.idTarget]
                if (n.colorTag in n.tags && n.colorParameter === 'groupTag') {
                  const selected_tag = n.tags[n.colorTag][0]
                  const tag = data.nodeTags[n.colorTag].tags[selected_tag]
                  if (tag) {
                    return tag.color as string
                  }
                }
                if (n.shape_visible || n.iconName === 'none') {
                  return n.color
                } else {
                  return n.iconColor
                }
              }
            }
            )
  
          }
  
        }
  
        if (link.label_on_path) {
          if (link.recycling) {
            if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
              d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'left')
            } else if (link.label_position === 'middle' && link.orientation === 'hh') {
              d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'right')
            }   
          } else {
            if (data.nodes[link.idSource].x < data.nodes[link.idTarget].x) {
              d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'left')
            } else if (link.label_position === 'middle' /*&& link.orientation === 'hh'*/) {
              d3.select(' .opensankey #' + link.idLink + '_text').attr('side', 'right')
            }
          }
          
          if (link.orthogonal_label_position === 'middle') {
            d3.select(' .opensankey #' + link.idLink + '_text').attr('dy', '0.3em')
          } else if (link.orthogonal_label_position === 'below') {
            let tmp=getLinkValue(data, link.idLink).value
            tmp=(tmp)?tmp:0
            // return scale(getLinkValue(data, link.idLink).value) / 2 + 10 + 'px'
            d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 10 + 'px')
            d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 10 + 'px')
  
          } else if (link.orthogonal_label_position === 'above') {
            let tmp=getLinkValue(data, link.idLink).value
            tmp=(tmp)?tmp:0
            // return -scale(getLinkValue(data, link.idLink).value) / 2 + 'px'
            d3.select(' .opensankey #' + link.idLink + '_text').attr('dy',scale(tmp) / 2 + 'px')
  
          }
          
        }
  
        if (link.idSource === node.idNode || link.idTarget === node.idNode) {
          // Redraw link
          const old_x_pos = +d3.select(' .opensankey #' + link.idLink + '_text').attr('x')
          const old_y_pos = +d3.select(' .opensankey #' + link.idLink + '_text').attr('y')
          if (!(link.label_position === 'frozen')) {
            d3.select(' .opensankey #' + link.idLink + '_text').attr('x', old_x_pos + 1 / 2 * (new_x - old_x))
            d3.select(' .opensankey #' + link.idLink + '_text').attr('y', old_y_pos + 1 / 2 * (new_y - old_y))
          }
          // select allows to redraw directly without refreshing
          d3.select(' .opensankey #' + link.idLink)
            .attr('d', () => {
              return drawCurveFunction.curve(data,nodes, links, display_style,data.nodeTags,link,error_msg,multi_selected_links,link_text)
            })
          const target_node = nodes[link.idTarget]
          if (link.arrow) {
            //SankeyPlusDrawArrows(data, target_node, nodes, links, display_style, nodeTags,scale,inv_scale,min_thickness)
            //const node_select = d3.select('#ggg_' + target_node.idNode) as d3.Selection<d3.BaseType, SankeyPlusNode, HTMLElement, SankeyPlusNode>
            SankeyPlusDrawArrows(target_node as SankeyPlusNode,(data.nodeTags as TagsCatalog),data,scale,inv_scale,getLinkValue,display_style)
          }
          for (let i = 0; i < target_node.inputLinksId.length; i++) {
            d3.select(' .opensankey #' + target_node.inputLinksId[i])
              .attr('d', (link => {
                return drawCurveFunction.curve(data,
                  nodes, links, display_style,
                  nodeTags,
                  link as SankeyLink,
                  error_msg,multi_selected_links,link_text
                )
              }))
          }
          for (let i = 0; i < target_node.outputLinksId.length; i++) {
            d3.select(' .opensankey #' + target_node.outputLinksId[i])
              .attr('d', link => {
                return drawCurveFunction.curve(data,
                  nodes, links, display_style,
                  nodeTags,
                  link as SankeyLink,
                  error_msg,
                  multi_selected_links,
                  link_text
                )
              })
  
          }
        }
      })
  
    if (error_msg.text !== undefined) {
      alert(error_msg)
    }
  }

}
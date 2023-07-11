import React from 'react'
import { Col, Form, FormCheck, FormLabel, Row,Tab,OverlayTrigger,Tooltip } from 'react-bootstrap'
import {  SankeyLink} from 'open-sankey/src/lib/types'
import { TFunction } from 'i18next'

import * as d3 from 'd3'
import {SankeyPlusData,SankeyPlusNode} from './types'
import {  getLinkValue,node_color,link_color,node_displayed,is_all_node_attr_same_value,return_correct_node_attribute_value,assign_node_value_to_correct_var,return_value_node,is_node_diplaying_value_local,return_value_link } from 'open-sankey/dist/SankeyUtils'


declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodesAttributes = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean,
  menu_for_style:boolean,
  selected_style_node:string
) => {
  const parameter_to_modify=(menu_for_style)?data.style_node:data.nodes
  const selected_parameter=(menu_for_style)?[data.style_node[selected_style_node]]:multi_selected_nodes.current

  const isAllNodeVisible = () => {
    let visible = false
    selected_parameter.map(d => visible = (return_correct_node_attribute_value(data,d,'shape_visible',menu_for_style) || return_correct_node_attribute_value(data,d,'not_to_scale',menu_for_style)) ? true : visible)
    return visible
  }
  

  // const isAllNodeToScale = () => {
  //   let toScale = false
  //   selected_parameter.map(d => toScale = (d.not_to_scale) ? true : toScale)
  //   return toScale
  // }
  const isAllNodeToScale=is_all_node_attr_same_value(data,selected_parameter,'not_to_scale',menu_for_style) as boolean

  const isAllNodeNotToScaleOrientation = (orientation:string) => {
    let same_orientation = true
    if (selected_parameter.length > 0) {
      selected_parameter.map(d => same_orientation = (return_correct_node_attribute_value(data,d,'not_to_scale_direction',menu_for_style) !== orientation) ? false : same_orientation)
    } else {
      same_orientation = false
    }
    return same_orientation
  }
  const form_elements= [
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.toScale')+(is_node_diplaying_value_local(multi_selected_nodes,'not_to_scale',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={1}>
        <FormCheck inline
          type='switch'
          checked={isAllNodeToScale}
          disabled={!is_activated}
          onChange={evt => {
            // Object.values(data.nodes).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale = evt.target.checked)
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d =>assign_node_value_to_correct_var(d,'not_to_scale',evt.target.checked,menu_for_style))
            set_data({ ...data })
          }}
        />
      </Col>

    </Form.Group>,
    <Col xs={5}>
      <FormLabel style={{color:(isAllNodeVisible() && is_activated)?'#555555':'#DADADA'}}>{t('Noeud.apparence.Orientation')+(is_node_diplaying_value_local(multi_selected_nodes,'not_to_scale_direction',menu_for_style)?'*':'')}</FormLabel>
    </Col>,
    <Form.Group as={Row} >
      <Col  xs={3}>
        <FormCheck
          value="left"
          type='radio'
          label={t('Noeud.apparence.toScaleLeft')}
          disabled={(!is_activated)?true:!isAllNodeToScale}
          checked={isAllNodeNotToScaleOrientation('left')}
          onChange={evt => {
            // Object.values(data.nodes).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d =>assign_node_value_to_correct_var(d,'not_to_scale_direction',evt.target.value,menu_for_style))

            set_data({ ...data })
          }}
        />
      </Col>
      <Col xs={3}>
        <FormCheck
          value="right"
          type='radio'
          label={t('Noeud.apparence.toScaleRight')}
          disabled={(!is_activated)?true:!isAllNodeToScale}
          checked={isAllNodeNotToScaleOrientation('right')}
          onChange={evt => {
            // Object.values(data.nodes).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d =>assign_node_value_to_correct_var(d,'not_to_scale_direction',evt.target.value,menu_for_style))
            set_data({ ...data })
          }}
        />
      </Col>
      <Col xs={3}>
        <FormCheck
          value="top"
          type='radio'
          label={t('Noeud.apparence.toScaleTop')}
          disabled={(!is_activated)?true:!isAllNodeToScale}
          checked={isAllNodeNotToScaleOrientation('top')}
          onChange={evt => {
            // Object.values(data.nodes).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d =>assign_node_value_to_correct_var(d,'not_to_scale_direction',evt.target.value,menu_for_style))

            set_data({ ...data })
          }}
        />
      </Col>
      <Col xs={3}>
        <FormCheck
          value="bottom"
          type='radio'
          label={t('Noeud.apparence.toScaleBottom')}
          disabled={(!is_activated)?true:!isAllNodeToScale}
          checked={isAllNodeNotToScaleOrientation('bottom')}
          onChange={evt => {
            // Object.values(data.nodes).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idNode).includes(f.idNode)).map(d =>assign_node_value_to_correct_var(d,'not_to_scale_direction',evt.target.value,menu_for_style))
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
      icon = (d.iconName === param) ? icon : false
    })
    return icon
  }
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
              value={(multi_selected_nodes.current.length === 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff'}
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

    const visible_links = Object.values(data.links).filter(l=>node_displayed(data,data.nodes[l.idSource]) && node_displayed(data,data.nodes[l.idTarget]) ).map(l=>l.idLink)
    const start_point = Object.values(data.nodes).filter(f => (f.inputLinksId.filter(i => visible_links.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0))
    let time_to_animate = 500
    Object.values(data.nodes).filter(f => {
      return (f.inputLinksId.filter(i => visible_links.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0)})
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
      const idLink = d3.select(this).attr('id')
      const idTarget = data.links[idLink].idTarget
      // Modification des arrows après l'animation
      const arrow=d3.selectAll(' .opensankey #'+idLink+'_arrow')
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
  // useEffect(()=>{
  //   console.log('test')
  //   add_nodes_icon()
  //   console.log('test2')

  // })
  add_nodes_icon()

}


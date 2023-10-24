import React,{ChangeEvent, useState,useRef} from 'react'
import { Form, Tab, OverlayTrigger,Tooltip, Button, InputGroup, Badge,Dropdown,ButtonGroup, Container} from 'react-bootstrap'
import { SankeyLinkValue } from 'open-sankey/src/lib/types'
import { TFunction } from 'i18next'
import * as d3 from 'd3'
import { MultiSelect } from 'react-multi-select-component'

import {removeAnimate, drawArrows,svgDragMiddleMouseStart,svgDragMiddleMouseMove,node_visible_on_svg,simpleGNodeClick} from 'open-sankey/dist/SankeyDrawFunction'
import {  getLinkValue,node_color,link_color,return_value_node,return_value_link,node_displayed,link_text,link_visible,is_node_diplaying_value_local,is_all_node_attr_same_value,assign_node_value_to_correct_var,compute_total_offsets, test_link_value} from 'open-sankey/dist/SankeyUtils'
import {opposing_drag_elements,drag_elements,drag_node_text,return_out_of_bound_element} from 'open-sankey/dist/SankeyDrag'
import { menu_draggable} from 'open-sankey/dist/SankeyMenu'
import {compute_auto_sankey} from 'open-sankey/dist/SankeyLayout'
import { SankeyPlusLabel,SankeyPlusLink,plusDrawArrowsType,DiffType, SankeyPlusData,SankeyPlusNode, ViewType} from './types'
import { filter_view,get_data_from_view } from './SankeyPlusViews'

import { FaEyeSlash, FaEye,FaFileImport} from 'react-icons/fa'
import { faIcons} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare, faLock,faDeleteLeft } from '@fortawesome/free-solid-svg-icons'

/* eslint-disable */
// @ts-ignore
const deep_diff = require('deep-diff')
/* eslint-enable */

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
  menu_for_modal=false,
  set_show_modal_import_icons:(b:boolean)=>void
)=> {
  const [button_icon_or_image,set_button_icon_or_image]=useState<'icon'|'image'>('image')
  data.icon_catalog=(data.icon_catalog)?data.icon_catalog:{}
  const _load_image = useRef<HTMLInputElement>(null)


  const isAllIconVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(
      d => visible = (d.iconVisible) ? true : visible)
    return visible
  }
  const isAllNodeVisible=is_all_node_attr_same_value(data,multi_selected_nodes.current,'shape_visible',false) as boolean

  
  // Content if we want to add icon to node
  const content_icon=<>
    <OverlayTrigger
      key={'iconDisabled1'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'iconDisabled1'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'75%'}}
        >
          {t('Noeud.icon.Visibilité')}
        </InputGroup.Text>

        <Button
          style={{width:'25%'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={isAllIconVisible()?'primary':'outline-primary'}
          onClick={
            () => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
                .forEach(d => {
                  d.iconVisible = !isAllIconVisible()
                  d.is_image=false
                })
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
        key={'iconDisabled2'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'iconDisabled2'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <InputGroup>
          <InputGroup.Text
            style={{
              color:(!is_activated)?'#666666':'',
              backgroundColor:(!is_activated)?'#cccccc':'',
              width:'75%'}}
          >
            {t('Noeud.icon.icon_catalog')}
          </InputGroup.Text>

          <Button style={{width:'25%'}}
            className='btn_menu_config'
            disabled={!is_activated}
            variant={'outline-primary'}
            onClick={() => { set_show_modal_import_icons(true) }}>{<FontAwesomeIcon icon={faIcons} />}</Button>
        </InputGroup>
      </OverlayTrigger>
      <OverlayTrigger
        key={'iconDisabled3'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'iconDisabled3'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <InputGroup>
          <InputGroup.Text
            style={{
              color:(!is_activated)?'#666666':'',
              backgroundColor:(!is_activated)?'#cccccc':'',
              width:'40%'}}
          >
            {t('Noeud.apparence.Couleur')}
          </InputGroup.Text>
          <Form.Label htmlFor="form_color_icon" style={{width:'60%',
            'background':(multi_selected_nodes.current.length === 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff',
            border:'1px solid #ced4da',
            borderTopRightRadius:'4px',
            borderBottomRightRadius:'4px',
          }}/>
          <Form.Control
            style={{display:'none'}}
            type='color'
            id='form_color_icon'
            name='form_color_icon'
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


    </>:<></>}
  </>

  const isAllNodeImage = () => {
    let visible = false
    multi_selected_nodes.current.map(
      d => visible = (d.is_image) ? true : visible)
    return visible
  }
  const allNodeImage=isAllNodeImage()

  // Content if we want to add image to node
  const content_image=<>
    <OverlayTrigger
      key={'imageDisabled1'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'imageDisabled1'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'40%'}}
        >
          {t('Noeud.img_visibility')}
        </InputGroup.Text>

        <Button
          style={{width:'60%'}}
          className='btn_menu_config'
          disabled={!is_activated}
          variant={allNodeImage?'primary':'outline-primary'}
          onClick={
            () => {
              Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
                .forEach(d => {
                  d.is_image = !allNodeImage
                  d.iconVisible=false
                })
              set_data({ ...data })
            }
          }
        >
          {allNodeImage?<FaEye/>:<FaEyeSlash/>}
        </Button>
      </InputGroup>
    </OverlayTrigger>

    {/* Import image */}
    {allNodeImage?<OverlayTrigger
      key={'imageDisabled2'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'imageDisabled2'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'40%'}}
        >
          {t('Noeud.img_src')}
        </InputGroup.Text>

        <Button
          variant='outline-primary'
          style={{width:'30%'}}
          className='btn_menu_config'
          onClick={()=>{
            if (_load_image.current) {
              _load_image.current.name = ''
              _load_image.current.click()
            }
          }}
        ><FaFileImport/></Button>
        <Button
          variant='outline-primary'
          style={{width:'30%'}}
          className='btn_menu_config'
          onClick={()=>{
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
              .forEach(n=>n.image_src='')
            set_data({...data})
          }}
        ><FontAwesomeIcon icon={faDeleteLeft}/></Button>

        <Form.Control
          ref={_load_image}
          style={{display:'none'}}
          accept='image/*'
          type="file"
          disabled={!is_activated}
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                const resultat = (e.target as FileReader).result
                const res=resultat?.toString().replaceAll('=','')
                Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
                  .forEach(n=>n.image_src=(res as string))

                set_data({...data})

              }
            })()
            reader.readAsDataURL(files[0])
          }}
        />
      </InputGroup>
    </OverlayTrigger>:<></>}
    
  </>

  // Content of the tab that change depending on the illustration we want to make
  const content_tab=<>
    {/* Visibilite du noeud */}
    <OverlayTrigger
      key={'noeud.apparence.tooltips.1'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'noeud.apparence.tooltips.1'}>{t('Noeud.apparence.tooltips.Visibilité')} </Tooltip>}>
      <InputGroup key={'node_visibility'} >
        <InputGroup.Text style={{width:'40%'}}>
          {t('Noeud.apparence.Visibilité')+(is_node_diplaying_value_local(multi_selected_nodes,'shape_visible',false)?'*':'')}
        </InputGroup.Text><Button
          className='btn_menu_config'
          style={{width:'60%'}}
          //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
          variant={isAllNodeVisible?'primary':'outline-primary'}
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).forEach(d => assign_node_value_to_correct_var(d,'shape_visible',!isAllNodeVisible,false))
            set_data({ ...data })
          }}>{isAllNodeVisible?<FaEye/>:<FaEyeSlash/>}</Button>
      </InputGroup>
    </OverlayTrigger>

    <InputGroup key={'node_illustration_type'} >
      <InputGroup.Text style={{width:'40%'}}>
        {t('Noeud.illustration_type')}
      </InputGroup.Text>
      <Button
        className='btn_menu_config'
        style={{width:'30%'}}
        variant={button_icon_or_image==='icon'?'primary':'outline-primary'}
        onClick={() => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
            .forEach(d => {
              d.is_image = false
              d.iconVisible=true
            })

          set_button_icon_or_image('icon')
          set_data({...data})
        }}>{t('Noeud.icon.icon')}</Button>

      <Button
        className='btn_menu_config'
        style={{width:'30%'}}
        variant={button_icon_or_image==='image'?'primary':'outline-primary'}
        onClick={() => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
            .forEach(d => {
              d.is_image=true
              d.iconVisible = false
            })
          set_button_icon_or_image('image')
          set_data({...data})
        }}>Image</Button>
    </InputGroup>
    {button_icon_or_image==='icon'?content_icon:content_image}
  </>



  return menu_for_modal?content_tab:<Tab
    key="node_icon"
    eventKey="node_icon"
    title={<>
      {t('Noeud.illustration')}
      {(!is_activated)?
        <OverlayTrigger
          key={'textZoneDisabled'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'textZoneDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>}
        >
          <Badge pill
            bg="white"
            style={{marginLeft:'5px', fontSize:'1.3em'}}>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Badge>
        </OverlayTrigger>:<Badge pill bg="info" style={{marginLeft:'5px'}}>Beta</Badge>}
    </>}
  >
    {content_tab}
  </Tab>
}

export const SankeyPlusHyperLink=( t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean)=>{

  const hasHyperLink = () => {
    let visible = ''
    visible=multi_selected_nodes.current[0]?.hyperlink??''
    return visible
  }
  const node_hyperlink=hasHyperLink()

  const content_image_tab=multi_selected_nodes.current.length>0?<>

    <OverlayTrigger
      key={'imageDisabledHL'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'imageDisabledHL'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'40%'}}
        >
          {t('Noeud.HL')}
        </InputGroup.Text>

        <Form.Control value={node_hyperlink} type='text' onChange={(evt)=>{
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).forEach(d => d.hyperlink=evt.target.value)
          set_data({ ...data })
        }}/>
      </InputGroup>
    </OverlayTrigger>

    {/* Open Hyperlink */}
    <OverlayTrigger
      key={'imageDisabledOHL'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'imageDisabledOHL'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(!is_activated)?'#666666':'',
            backgroundColor:(!is_activated)?'#cccccc':'',
            width:'40%'}}
        >
          {t('Noeud.open_HL')}
        </InputGroup.Text>
        <Button variant='outline-primary' style={{width:'60%'}} onClick={()=>{
          window.open(node_hyperlink)
        }}>
          <FontAwesomeIcon icon={faUpRightFromSquare} />
        </Button>


      </InputGroup>
    </OverlayTrigger>
  </>:<></>

  return <Tab
    key="hyperlink"
    eventKey="hyperlink"
    title={<>
      {t('Noeud.HL')}
      {(!is_activated)?
        <OverlayTrigger
          key={'textZoneDisabled'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'textZoneDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>}
        >
          <Badge pill
            bg="white"
            style={{marginLeft:'5px', fontSize:'1.3em'}}>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Badge>
        </OverlayTrigger>:<Badge pill bg="info" style={{marginLeft:'5px'}}>Beta</Badge>}
    </>}
  >
    {content_image_tab}
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
      const lng = calcPath(data,nodes, n, new_links.filter(i=>!return_value_link(data,data.links[i],'recycling'))) as number
      long += isNaN(lng) ? 0 : lng

    })
    return long
  }
}

const node_mouse_click=(
  data:SankeyPlusData,
  set_animating:(b:boolean)=>void,
  event:React.MouseEvent<HTMLButtonElement>,d:unknown,
  set_data:(d:SankeyPlusData)=>void,
  nodes_accordion_ref:{ current: HTMLDivElement }| null,
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  accordion_ref:{ current: HTMLDivElement},
  button_ref:{ current: HTMLLabelElement},
  accept_simple_click:{current:boolean},
  
)=>{
  const sankeyTooltip=d3.select('.sankey-tooltip')

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
  }else if(window.SankeyToolsStatic===true){
    const n=d as SankeyPlusNode
    if(n.hyperlink!==undefined && n.hyperlink!==''){
      window.open(n.hyperlink)
    }
  }else if(window.SankeyToolsStatic===false && event.altKey) {
    const n=d as SankeyPlusNode
    if(n.hyperlink!==undefined && n.hyperlink!==''){
      window.open(n.hyperlink)
    }
  }else{
    simpleGNodeClick(event,d,data,set_data,nodes_accordion_ref,multi_selected_nodes,mode_selection,accordion_ref,button_ref,accept_simple_click)

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
  set_data:(d:SankeyPlusData)=>void,
  nodes_accordion_ref:{ current: HTMLDivElement }| null,
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  accordion_ref:{ current: HTMLDivElement},
  button_ref:{ current: HTMLLabelElement},
  accept_simple_click:{current:boolean},
)=>{
  d3.selectAll(' .opensankey .ggg_nodes')
    .on('click', (event, d) => {
      // Apply some style change to element before starting the animation
      node_mouse_click(data,set_animating,event,d,set_data,
        nodes_accordion_ref,
        multi_selected_nodes,
        mode_selection,
        accordion_ref,
        button_ref,
        accept_simple_click)
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



  const node_mouse_over=(data:SankeyPlusData,t:d3.BaseType,mode_selection:string,event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
    d3.select(t).attr('cursor', (mode_selection === 's')? 'pointer' : 'unset')
    if ( (window.SankeyToolsStatic || event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')

      sankeyTooltip
        .style('opacity', 1)
        .html(nodeTooltipsContent(data, d as SankeyPlusNode))
    }
  }

  const node_mouse_move=(event:React.MouseEvent<HTMLButtonElement>)=>{
    if ((window.SankeyToolsStatic || event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')

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
      .attr('viewBox',d=> d.iconViewBox?d.iconViewBox:'0 0 1000 1000')
      .attr('transform', n => {
        const shiftV = (+d3.select(' .opensankey #shape_' + n.idNode).attr('height') ) / 2
        const shiftH = (+d3.select(' .opensankey #shape_' + n.idNode).attr('width') ) / 2
        return 'translate(' + shiftH + ',' + shiftV + ')'
      })
      .attr('height', n => +d3.select(' .opensankey #shape_' + n.idNode).attr('height'))
      .attr('width', n => +d3.select(' .opensankey #shape_' + n.idNode).attr('width'))
      .attr('x', 0)
      .append('g')
      .append('path')
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,event,d)
      })
      .on('mousemove', function (event) {
        node_mouse_move(event)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })
      .style('fill', n =>node_icon_fill_color(data,n))
      .attr('d', n =>node_icon_path(data,n))

  }


  const add_nodes_image = (
  ) => {
    //----------------ICON-----------------
  
    // Add icon to node (if there is one associated to it)
    // then apply selected parameter
    const sankeyTooltip=(d3.select('div.sankey-tooltip') as d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>)
  
    const ggg_nodes=(d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement, SankeyPlusNode, d3.BaseType, unknown>)
  
    ggg_nodes
      .filter(d => d.is_image)
      .append('image')
      .attr('href',n=>n.image_src)
      .attr('height', n => +d3.select(' .opensankey #shape_' + n.idNode).attr('height') )
      .attr('width', n => +d3.select(' .opensankey #shape_' + n.idNode).attr('width') )
      .on('mouseover', function (event, d) {
        node_mouse_over(data,this,mode_selection,event,d)
      })
      .on('mousemove', function (event) {
        node_mouse_move(event)
      })
      .on('mouseout', function () {
        sankeyTooltip.style('opacity', 0)
      })

  }

  add_nodes_icon()
  add_nodes_image()
  

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
  if(mode_selection.current==='s' && window.SankeyToolsStatic!==true){
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
        }else {
          drag_nodes_plus(node,event,multi_selected_nodes,data,
            set_data,display_nodes,display_links,multi_selected_links,link_text,min_width_and_height,getLinkValue,drawArrows,scale,inv_scale,multi_selected_label,node_visible
          )
        }
      }
    }).on('end',()=>{
      if(d3.select(document.activeElement).attr('class')!=='input_label'){
        set_data(data)
      }
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




export const context_node_view_node_unitary=(
  multi_selected_nodes:{current:SankeyPlusNode[]},
  contextualised_node:SankeyPlusNode,
  set_contextualised_node:(n:SankeyPlusNode|undefined)=>void,
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  master_data:SankeyPlusData,
  set_master_data:(d:SankeyPlusData)=>void,
  set_view:(s:string)=>void,
  t:TFunction,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
)=>{
 
  // Search if master data has view with unitary sankey
  const has_unitary_view=master_data.view.filter(v=>{
    if((v.view_data as DiffType).diff!==undefined){
      return (v.view_data as DiffType).diff.filter(vo=>vo.path.includes('unitary_node')).length>0
    }else{
      return (v.view_data as SankeyPlusData).unitary_node.length>0
    }}).length>0

  const is_unitary_view=(v:ViewType)=>{
    if((v.view_data as DiffType).diff!==undefined){
      return (v.view_data as DiffType).diff.filter(vo=>vo.path.includes('unitary_node')).length>0
    }else{
      return (v.view_data as SankeyPlusData).unitary_node.length>0
    }
  }

  const dropdown_c_n_explore_node_add_to_view=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('view.in_existing')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {master_data.view.filter(v=>is_unitary_view(v)).map(v=>{
        
        return <Dropdown.Item as={Button} variant='light' 
          onClick={()=>{
            create_view_node_unitary(t,data,set_data,master_data,set_master_data,contextualised_node,set_view,display_nodes,v.id)
            set_contextualised_node(undefined)
          }}
        >
          {v.nom}
        </Dropdown.Item>
      })}
    </Dropdown.Menu></Dropdown>:<></>



  const dropdown_c_n_explore_node=contextualised_node!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('view.unit_node')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item  as={Button} variant='light' onClick={()=>{
        create_view_node_unitary(t,data,set_data,master_data,set_master_data,contextualised_node,set_view,display_nodes)
      }}>{t('view.in_new')}</Dropdown.Item>
      {has_unitary_view?dropdown_c_n_explore_node_add_to_view:<></>}

    </Dropdown.Menu>
  </Dropdown>:<></>


  if(contextualised_node!==undefined && multi_selected_nodes.current.length===1 && data.unitary_node && data.unitary_node.length===0){
    return dropdown_c_n_explore_node
  }else if(contextualised_node!==undefined && data.unitary_node && data.unitary_node.length>0) {
    return <Button onClick={()=>{
      data.unitary_node=[]
      set_data({...data})
    }} variant='light'>{t('view.to_normal_view')} </Button>
  }else{
    return <></>
  }
  

}

export const SankeyPlus_link_text=(data:SankeyPlusData,d:SankeyPlusLink,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue,
)=>{
  const k_n_u=data.unitary_node.filter(kn=>kn===d.idTarget || kn===d.idSource)[0]
  const link_ref=Object.keys(data.process_transfo_ref).filter(k=>k===k_n_u && data.process_transfo_ref[k].length>0).map(k=>k)
  const link_unit=return_value_link(data,d,'label_unit')
  if(getLinkValue===undefined){
    return
  }
  const the_link_value = getLinkValue(data, d.idLink)
  
  // Si le flux n'est pas relié à un noeud unitaire alors sa valeur est de 100% 
  if(k_n_u===undefined){
    return '100%'
  }else if(data.nodes[k_n_u].tags['Type de noeud'] && data.nodes[k_n_u].tags['Type de noeud'].includes('produit')){
  // Si le flux est relié à un noeud unitaire et que ce noeud est un produit
  // alors sa valeur est en % par rapport à la somme des flux entrant ou sortant

    // Calcul le total des flux entrants entre eux et de même pour les sortants
    const total_io=calc_total_input_output(data.nodes[k_n_u],data,getLinkValue)

    if (data.show_structure === 'structure' ) {
      return
    }
    if (data.show_structure === 'data' ) {
      if ((the_link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value) {
        return (the_link_value as SankeyLinkValue & {extension: {data_value : string}} ).extension.data_value
      } else {
        return
      }
    }
    if(!isNaN(the_link_value.value)){
      // Return value of link in %
      // If the value has decimal, then fix it to 2 decimal
      const val=(data.unitary_node.includes(d.idSource)?((the_link_value.value/total_io[1])*100):((the_link_value.value/total_io[0])*100))
      return (Number.isInteger(val)?Math.round(val):(val).toFixed(2))+'%'
    }else{
      return '0%'
    }

  }else if(data.nodes[k_n_u].tags['Type de noeud'] && data.nodes[k_n_u].tags['Type de noeud'].includes('secteur') && link_ref.length>0){
  // Si le flux est relié à un noeud unitaire et que ce noeud est un secteur
  // alors 1 ou + flux peuvent être des références et sont utilisés pour normalisé les valeurs

    // Les flux sont normalisé selont la somme des flux de référence
    let sum=0
    data.process_transfo_ref[k_n_u].forEach(p=>{
      sum+=getLinkValue(data,p).value
    })

    const part_value=(the_link_value.value/sum)
    const formated_value=(Number.isInteger(part_value)?Math.round(part_value):(part_value).toFixed(3))
    return formated_value+link_unit

  }else{
    // le noeud unitaire est un secteur mais qu'il n'a pas de flux de référence ou qu'il n'ai pas l'étiquette 'Type de noeud'
    // alors il les affiche normalement 
    return link_text(data,d,getLinkValue)
  }

    
}

const calc_total_input_output=(n:SankeyPlusNode,data:SankeyPlusData,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{

  
  // const selected_lvl_tags={} as {[x:string]:string}
  // Object.values(data.levelTags).forEach(gt=>{
  //   selected_lvl_tags[gt.group_name]=Object.values(gt.tags).filter(t=>t.selected).map(t=>t.name)[0]
  // })

  const filtered_input_links=n.inputLinksId.filter(lid=>{
    const node_to_test=data.nodes[data.links[lid].idSource]
    return node_displayed(data,node_to_test)
  }).map(id=>id)

  let total_input=0
  for(const i in filtered_input_links){
    const val=getLinkValue(data,filtered_input_links[i]).value
    total_input+=(!isNaN(val)?val:0)
  }

  const filtered_output_links=n.outputLinksId.filter(lid=>{
    const node_to_test=data.nodes[data.links[lid].idTarget]
    return node_displayed(data,node_to_test)
  }).map(id=>id)

  let total_output=0
  for(const i in filtered_output_links){
    const val=getLinkValue(data,filtered_output_links[i]).value
    total_output+=(!isNaN(val)?val:0)
  }
  return [total_input,total_output]
}

const return_aggregation_tree_of_node=(n:SankeyPlusNode,nodes:{[x:string]:SankeyPlusNode})=>{
  const siblings=[] as string[]
  return_aggregation_parents_of_node(n,nodes,siblings)
  return_aggregation_sons_of_node(n,nodes,siblings)
  return siblings
}

const return_aggregation_parents_of_node=(n:SankeyPlusNode,nodes:{[x:string]:SankeyPlusNode},found_fathers:string[])=>{
  if(n.dimensions){
    Object.entries(n.dimensions).forEach(nd=>{
      if(nd[1].parent_name!==undefined && nd[1].parent_name!==null  && nd[0]!=='Primaire'){
        found_fathers.push(nd[1].parent_name)
        return_aggregation_parents_of_node(nodes[nd[1].parent_name],nodes,found_fathers)
      }
    })
  }
}

const return_aggregation_sons_of_node=((n:SankeyPlusNode,nodes:{[x:string]:SankeyPlusNode},found_sons:string[])=>{
  // Parcours tous les noeuds à la recherche des enfants de n 
  Object.values(nodes).forEach(nn=>{
    if(nn.dimensions){
      // Si le noeud (nn) a pour parents le noeud que l'on recherche (n) alors on l'ajoute à found_sons puis recherche les enfants de ce noeud là (nn)
      Object.entries(nn.dimensions).forEach(nd=>{
        if( nd[1].parent_name===n.idNode && nd[0]!=='Primaire' ){
          found_sons.push(nn.idNode)
          return_aggregation_sons_of_node(nn,nodes,found_sons)
        }

      })
    }
  })
  
})

export const modal_unitary_sankey_sector_node=(data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  show_modal_selection_link_ref_in_unitary_sankey:boolean,set_show_modal_selection_link_ref_in_unitary_sankey:(b:boolean)=>void,
  t:TFunction,
  selected_node_to_configure:string,
  set_selected_node_to_configure:(s:string)=>void,
  search_in_input_or_output:'inputLinksId'|'outputLinksId',
  set_search_in_input_or_output:(s:string)=>void,
  getLinkValue:(data: SankeyPlusData, idLink: string, up?: boolean) => SankeyLinkValue
)=>{
  // Modale used to chose link as ref in the to unitary sankey view, those links come are linked to the unitary node
  // We can select multiple links but only if they're all input or output (we can't select some input links and output link to be reference a the same )
  let selected_id = [] as {label:string,value:string}[]
  let option = [] as {label:string,value:string}[]

  if(selected_node_to_configure && selected_node_to_configure!=='None'){
    selected_id=data.process_transfo_ref[selected_node_to_configure]?data.process_transfo_ref[selected_node_to_configure].map(lidref=>{return{ 'label': lidref, 'value': lidref }} ):selected_id

    option=data.nodes[selected_node_to_configure][search_in_input_or_output].filter(lid=>link_visible(data.links[lid],data,getLinkValue)).map(lid=>{
      return { 'label': lid, 'value': lid }
    })
  }

  const content_slectlink_ref=<Container style={{height:'400px'}}>
    
    <InputGroup>
      <InputGroup.Text style={{width:'50%'}}>{t('view.chose_node_to_configure')}</InputGroup.Text>
      <Form.Select
        onChange={(evt)=>{
          set_selected_node_to_configure(evt.target.value)
        }}
      >
        <option value={undefined}>None</option>
        {data.unitary_node.map(nid=>{

          return <option value={data.nodes[nid].idNode}>{data.nodes[nid].name}</option>
        })}
      </Form.Select>
    </InputGroup>
    {
      selected_node_to_configure && selected_node_to_configure!=='None' ?<>
        <InputGroup>
          <InputGroup.Text style={{width:'50%'}}>{t('view.chose_io')}</InputGroup.Text>
          <Button style={{width:'25%'}} variant={search_in_input_or_output==='inputLinksId'?'primary':'outline-primary'}
            onClick={()=>{
              data.process_transfo_ref[selected_node_to_configure]=[]
              set_search_in_input_or_output('inputLinksId')}}
          >Input</Button>
          
          <Button style={{width:'25%'}} variant={search_in_input_or_output==='outputLinksId'?'primary':'outline-primary'}
            onClick={()=>{
              data.process_transfo_ref[selected_node_to_configure]=[]
              set_search_in_input_or_output('outputLinksId')}}
          >Output</Button>
        </InputGroup>

        <InputGroup>
          <InputGroup.Text style={{width:'50%'}}>{t('view.chose_link_ref')}</InputGroup.Text>
          <div  style={{width:'50%'}}>
            <MultiSelect
              className={'multidropdown_select_link_ref'}
              // style={{ width:'50%' }}
              labelledBy={'dropdown_link_filter'}
              overrideStrings={{
                'selectAll': 'Tout sélectionner',
              }}
              value={selected_id}
              options={option}
              onChange={(selected: [{ label: string, value: string }]) => {
                data.process_transfo_ref[selected_node_to_configure]=[]

                selected.forEach(s=>{
                  data.process_transfo_ref[selected_node_to_configure].push(s.value)
                })
                set_data({...data})
              }} />
          </div>
        </InputGroup>
      </>:<></>
    }
    

  </Container>

  const dragLayout=show_modal_selection_link_ref_in_unitary_sankey?menu_draggable(content_slectlink_ref,{current:[window.innerWidth/4,window.innerHeight/4]},t('view.view_title_modal_select_link_ref_in_unitary_sankey'),set_show_modal_selection_link_ref_in_unitary_sankey,40):<></>
  return dragLayout
}

export const scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])

export const inv_scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])

export const create_view_node_unitary=(t:TFunction,
  data:SankeyPlusData,set_data:(d:SankeyPlusData)=>void,
  master_data:SankeyPlusData,set_master_data:(d:SankeyPlusData)=>void,
  contextualised_node:SankeyPlusNode,
  set_view:(s:string)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  view_name='')=>{

  const new_unitary_sankey=JSON.parse(JSON.stringify(data)) as SankeyPlusData

  const n_link_s=Object.values(new_unitary_sankey.links).filter(l=>contextualised_node.inputLinksId.includes(l.idLink)).map(l=>l.idSource)
  const n_link_t=Object.values(new_unitary_sankey.links).filter(l=>contextualised_node.outputLinksId.includes(l.idLink)).map(l=>l.idTarget)

  const nodes_visible_to_keep= Object.fromEntries(Object.entries(new_unitary_sankey.nodes).filter(ne=>{
    // Keep only the node contextualised,
    // or the node linked to it (and visible on the svg)
    return ne[1].idNode===contextualised_node.idNode || ((n_link_s.includes(ne[1].idNode) || n_link_t.includes(ne[1].idNode) ) )
  }).map(n=>n))



  // Get all the parents & sons (aggregation speaking) of all_nodes_in_unitary_sankey
  let center_sankey_node_unitary=[contextualised_node.idNode]
  let aggregate_nodes_to_keep=[] as string[]
  Object.entries(nodes_visible_to_keep).forEach(ne=>{
    
    const parent=return_aggregation_tree_of_node(ne[1],data.nodes)
    aggregate_nodes_to_keep=[...aggregate_nodes_to_keep,...JSON.parse(JSON.stringify(parent))]
    // Add parents & sons to node reference 
    if(ne[1].idNode===contextualised_node.idNode){
      center_sankey_node_unitary=[...center_sankey_node_unitary,...parent]
    }
  })
  aggregate_nodes_to_keep=[...new Set(aggregate_nodes_to_keep)]

  // Add nodes not visible but that have an aggregation link to one visible

  const all_nodes_in_unitary_sankey=JSON.parse(JSON.stringify(nodes_visible_to_keep)) as {[x:string]:SankeyPlusNode}
  aggregate_nodes_to_keep.forEach(kn=>{
    all_nodes_in_unitary_sankey[kn]=new_unitary_sankey.nodes[kn]
  })

  const key_of_nodes_in_unitary_sankey=Object.values(all_nodes_in_unitary_sankey).map(n=>n.idNode)


  // Get key of link that are connected to 2 nodes of the nodes to keep  
  const n_link:string[]=[]
  Object.values(new_unitary_sankey.links).filter(l=>key_of_nodes_in_unitary_sankey.includes(l.idSource) && key_of_nodes_in_unitary_sankey.includes(l.idTarget) ).forEach(l=>{
    
    n_link.push(l.idSource)
    n_link.push(l.idTarget)
  
    if(center_sankey_node_unitary.includes(l.idTarget)){
      assign_node_value_to_correct_var(all_nodes_in_unitary_sankey[l.idSource],'label_horiz','left',false)
    }else if(center_sankey_node_unitary.includes(l.idSource)){
      assign_node_value_to_correct_var(all_nodes_in_unitary_sankey[l.idTarget],'label_horiz','right',false)
    }
    
  })

  const links_to_keep=Object.fromEntries(Object.entries(new_unitary_sankey.links).filter(l=>n_link.includes(l[1].idSource) && n_link.includes(l[1].idTarget)).map(l=>{
    l[1].value=getLinkValue(new_unitary_sankey,l[1].idLink)
    l[1].colorTag='no_colormap'
    return l
  }))
  const k_l_t_k=Object.keys(links_to_keep)

  // Key levelTag
  const k_level_tag=Object.keys(new_unitary_sankey.levelTags)


  Object.entries(all_nodes_in_unitary_sankey).map(n=>{
    // Filter output/input link id by removing link no longer present in data
    n[1].outputLinksId=n[1].outputLinksId.filter(ol=>k_l_t_k.includes(ol))
    n[1].inputLinksId=n[1].inputLinksId.filter(il=>k_l_t_k.includes(il))

    // Keep tag that refernece levelTag && tag of group tag 'Type de noeud'
    n[1].tags=Object.fromEntries(Object.entries(n[1].tags).filter(nt=>nt[0]==='Type de noeud' || k_level_tag.includes(nt[0])))

    n[1].colorTag='no_colormap'
    n[1].colorParameter='local'

    return n
  })

  const nodes_to_keep=all_nodes_in_unitary_sankey

  // Normalize data
  new_unitary_sankey.nodeTags=Object.fromEntries(Object.entries(new_unitary_sankey.nodeTags).filter(nt=>nt[0]==='Type de noeud').map(nt=>nt))
  new_unitary_sankey.fluxTags={}
  new_unitary_sankey.dataTags={}
  new_unitary_sankey.labels={}
  new_unitary_sankey.colorMap='no_colormap'
  new_unitary_sankey.linkZIndex=new_unitary_sankey.linkZIndex.filter(lz=>k_l_t_k.includes(lz)).map(l=>l)
  new_unitary_sankey.nodes=nodes_to_keep


  new_unitary_sankey.links=links_to_keep
  
  // Reposition visible node 
  compute_auto_sankey(new_unitary_sankey, new_unitary_sankey.h_space ? new_unitary_sankey.h_space : 200)

  // ======Add ZDT====== 
  // Get dimensions for labels

  // Get the node the most at left
  const min_x_node=Object.values(nodes_to_keep).filter(n=>n.position==='absolute').sort((a,b)=>{
    return (a.x)-(b.x)
  })[0]


  const min_x=min_x_node.x

  // Get the node the most at top
  const min_y_node=Object.values(nodes_to_keep).filter(n=>n.position==='absolute').sort((a,b)=>{
    return (a.y)-(b.y)
  
  })[0]
  const min_y=min_y_node.y

  let max_x=min_x
  let max_y=min_y
  Object.values(nodes_to_keep).filter(n=>n.position==='absolute').forEach(n=>{
    const boxX=n.x
    const boxY=n.y

    const res = compute_total_offsets(inv_scale,n, data, display_nodes, test_link_value,undefined,getLinkValue)
    const [total_offset_height_left, total_offset_height_right, total_offset_width_top, total_offset_width_bottom] = res
    let node_size_s_height = Math.max(
      inv_scale((return_value_node(data,n,'node_height') as number)), total_offset_height_left, total_offset_height_right
    )
    let node_size_s_width = Math.max(
      inv_scale((return_value_node(data,n,'node_width') as number)), total_offset_width_top, total_offset_width_bottom
    )
    //Hauteur des noeuds
    if (res[0] === 0 && res[1] === 0 && res[2] === 0 && res[3] === 0 || data.show_structure === 'structure') {
      node_size_s_height = inv_scale((return_value_node(data,n,'node_height') as number))
      node_size_s_width = inv_scale((return_value_node(data,n,'node_width') as number))
    }

    const boxW=node_size_s_width
    const boxH=node_size_s_height
    

    max_x=((boxX+boxW)>max_x)?(boxX+boxW):max_x
    max_y=((boxY+boxH)>max_y)?(boxY+boxH):max_y
  })

  // Info from data source in ZDT

  // customize the info to add in the zdt
  let content_zdt=''
  const type_node=(contextualised_node.tags['Type de noeud']!==undefined && contextualised_node.tags['Type de noeud'].length>0)?(contextualised_node.tags['Type de noeud'][0]):undefined
  let type_process=''
  if(type_node==='produit' || type_node==='secteur'){
    if(type_node==='produit'){
      type_process='Process de marché'
    }else{
      type_process='Process de transformation'
    }
  }else{
    type_process=t('view.template_unitary_zdt_content_of_node')
  }

  // Add the info to the zdt
  const name_view=(master_data.current_view && master_data.current_view!=='none')?master_data.view.filter(v=>v.id===master_data.current_view)[0].nom:t('Menu.home')
  content_zdt+='<p class="ql-align-center"><u>'+type_process+': <strong>'+contextualised_node.name+'</strong></u></p>'
  content_zdt+='<p>'+t('view.template_unitary_zdt_content')+' <strong>'+name_view+' </strong></p>'

  // Add additional info concerning the dataTag at the moment of the creation of the unitary sankey
  // because once the unitary sankey is created, we delete the datatags  
  const data_tags = Object.assign({},data.dataTags)
  Object.entries(data_tags).forEach(tag_group => {
    const intro_group_data_tags=' : '+Object.values(tag_group[1].tags).filter(t=>t.selected).map(t=>t.name).join(', ')
    content_zdt+='<p>'+tag_group[1].group_name+intro_group_data_tags+'</p>'
  })


  // Create the zdt  
  const n_label={
    idLabel: 'label_' + String(new Date().getTime()),
    title:'Description',
    content: content_zdt,
    label_width: ((max_x-min_x)+10),
    label_height: ((max_y-min_y)+10),
    color: 'white',
    color_border: 'black',
    opacity: 100,
    transparent_border: false,
    x: min_x-5,
    y: min_y-5,
    is_image:false,
    image_src:''

  }

  // Perform some configuration if the unitary go to a new view or an existing view
  if(view_name===''){

    new_unitary_sankey.labels[n_label.idLabel]=n_label

    // Add the contextualised node to list of explored nodes (to use in the process of link_text)
    new_unitary_sankey.unitary_node=[...new_unitary_sankey.unitary_node,...center_sankey_node_unitary]

    let difference = deep_diff.diff(master_data, new_unitary_sankey)
    difference=(difference !== undefined)?difference:[]
    difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
    difference=filter_view(difference)

    const new_id='view_' + String(new Date().getTime())
    master_data.view.push({
      id: new_id,
      view_data: {diff:difference},
      nom: 'Exploration view of node '+contextualised_node.name,
      details: '',
      heredited_attr_from_master:[]
    })

    set_view(new_id)
    set_data({...new_unitary_sankey})


  }else{
    // If the unitary sankey go to an existing view then we perform some ajustement :
    // - We change the id of links and nodes to avoid corruption of the other unitary sankey in the view
    // - We shift the explainatory ZDT  and new unitary sankey under the existing one 

    // Search for the view to add the new exploration node
    let ind = -1
    master_data.view.map((v, i) => {
      ind = (v.id === view_name) ? i : ind
    })
    const data_view=get_data_from_view(master_data,master_data.view[ind].id) as SankeyPlusData

    // =====Update data icon catalog=====
    Object.entries(new_unitary_sankey.icon_catalog).forEach(i=>{
      data_view.icon_catalog[i[0]]=i[1]
    })
    
    // =====Update the ZDT to verticaly align it with the last one in the view=====
    const last_label_pos_in_view=Object.values(data_view.labels)[Object.values(data_view.labels).length-1]
    n_label.x=last_label_pos_in_view.x
    n_label.y=last_label_pos_in_view.y+last_label_pos_in_view.label_height+5


    // =====Update nodes & links=====
    // Create unique key to use in the suffix
    const unique_key=String(new Date().getTime())
    // Add a unique suffix to nodes & links in case we add node/link who have the same id of some in the view
    Object.entries(new_unitary_sankey.nodes).map(n=>{
      n[0]=n[0]+'_'+unique_key
      n[1].idNode=n[0]
      n[1].inputLinksId=n[1].inputLinksId.map(l=>l+'_'+unique_key)
      n[1].outputLinksId=n[1].outputLinksId.map(l=>l+'_'+unique_key)

      n[1].x-=(min_x-n_label.x)
      n[1].y-=(min_y-n_label.y)

      n[1].style=n[1].style+'_'+unique_key

      return n
    }).forEach(n=>{
      data_view.nodes[n[0]]=n[1]
    })

    Object.entries(new_unitary_sankey.links).map(l=>{
      l[0]=l[0]+'_'+unique_key
      l[1].idLink=l[0]
      l[1].idSource=l[1].idSource+'_'+unique_key
      l[1].idTarget=l[1].idTarget+'_'+unique_key

      l[1].style=l[1].style+'_'+unique_key

      return l
    }).forEach(l=>{
      data_view.linkZIndex.push(l[1].idLink)
      data_view.links[l[0]]=l[1]
    })

    // Update style ID in case it has different value with the samez id 
    Object.entries(new_unitary_sankey.style_node).forEach(ns=>{
      data_view.style_node[ns[0]+'_'+unique_key]=ns[1]
    })

    Object.entries(new_unitary_sankey.style_link).forEach(ls=>{
      data_view.style_link[ls[0]+'_'+unique_key]=ls[1]
    })

    // =====Add the new ZDT=====
    data_view.labels[n_label.idLabel]=n_label

    // =====Add the contextualised node to list of explored nodes (to use in the process of link_text)=====
    const process_name_unitary_node=center_sankey_node_unitary.map(k=>k+'_'+unique_key)
    data_view.unitary_node=[...data_view.unitary_node,...process_name_unitary_node]


    // ------------------------------------------------------------
    // =====Update the view=====
    let difference = deep_diff.diff(master_data, data_view)
    difference=(difference !== undefined)?difference:[]
    difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'))
    difference=filter_view(difference)

    master_data.view[ind].view_data={diff:difference}
  
    set_view(view_name)
    set_data({...data_view})

  }

  // Save master data with the view we are currently working on updated
  set_master_data({...master_data})

    
}
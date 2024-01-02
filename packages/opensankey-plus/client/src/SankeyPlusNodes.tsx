import React,{ChangeEvent, useState, useRef} from 'react'
import { FaFileImport} from 'react-icons/fa'
import { faIcons} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare, faLock,faDeleteLeft } from '@fortawesome/free-solid-svg-icons'
import { Checkbox } from '@chakra-ui/react'
import * as d3 from 'd3'
import { Form, Tab, OverlayTrigger,Tooltip, Button, InputGroup, Badge} from 'react-bootstrap'
import { TFunction } from 'i18next'

import { SankeyPlusLabel,SankeyPlusLink, SankeyPlusData,SankeyPlusNode,} from '../types/Types'
import  {OSPIsAllNodeNotLocalAttrSameValue, PlusReturnValueLink} from './SankeyPlusUtils'
import {RemoveAnimate,
  DrawArrows,
  SvgDragMiddleMouseStart,
  SvgDragMiddleMouseMove,
  SimpleGNodeClick,NodeColor,
  LinkStrokeOSTyped,
  ReturnValueNode,
  ReturnValueLink,
  IsNodeDisplayingValueLocal,
  IsAllNodeAttrSameValue,
  AssignNodeValueToCorrectVar,
  OpposingDragElements,
  drag_elements,
  drag_node_text,
  return_out_of_bound_element
} from './import/OpenSankey'

import { SmoothClasses,TooltipValueSurcharge} from 'open-sankey/dist/lib/SankeyUtils'
import { SankeyData, SankeyLink, SankeyNode } from 'open-sankey/src/types/Types'
import { GetLinkValueFuncType, GetSankeyMinWidthAndHeightFuncType, LinkTextFuncType } from 'open-sankey/src/types/SankeyUtilsTypes'
import { 
  SankeyPlusDrawNodesIconFType, SankeyPlusHyperLinkFType, PlusNodeClickEventFType, PlusNodeDragEventFType, 
  SankeyPlusNodeIconFType, ContextNodeIconFType, drag_elements_plusFType, node_icon_fill_colorFType, 
  node_icon_pathFType, OpposingDragElementsPlusFType, return_out_of_bound_element_plusFType
} from '../types/SankeyPlusNodesTypes'
import { NodeTooltipsContentFType } from 'open-sankey/src/types/SankeyTooltipTypes'
import { drawArrowsType } from 'open-sankey/src/types/SankeyDrawFunctionTypes'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}

export const SankeyPlusNodeIcon : SankeyPlusNodeIconFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  radio_selected:string,
  is_activated:boolean,
  menu_for_modal=false,
  set_show_modal_import_icons:(b:boolean)=>void
)=> {
  const [button_icon_or_image,set_button_icon_or_image]=useState<'icon'|'image'>('image')
  const data_plus=data as SankeyPlusData
  data_plus.icon_catalog=(data_plus.icon_catalog)?data_plus.icon_catalog:{}
  const _load_image = useRef<HTMLInputElement>(null)
  const multi_selected_nodes_plus=multi_selected_nodes as {current:SankeyPlusNode[]}

  const isAllNodeVisible=IsAllNodeAttrSameValue(data,multi_selected_nodes.current,['shape_visible'],false)['shape_visible'] as boolean[]
  const value_of_key=OSPIsAllNodeNotLocalAttrSameValue(data_plus,multi_selected_nodes_plus.current,['is_image','iconVisible'])

  // Change type of illustration if all selected nodes have the same type of illustration 
  // and the button isn't set to type of illustration of the nodes
  if(value_of_key['iconVisible'][0] && !value_of_key['iconVisible'][1] && button_icon_or_image==='image'){
    set_button_icon_or_image('icon')
  }else if(value_of_key['is_image'][0] && !value_of_key['is_image'][1] && button_icon_or_image==='icon'){
    set_button_icon_or_image('image')
  }
  // Content if we want to add icon to node
  const content_icon=<>
    <OverlayTrigger
      key={'iconDisabled1'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'iconDisabled1'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'40%'}
          iconColor={value_of_key['iconVisible'][1]?'#78C2AD':'white'}
          isIndeterminate={value_of_key['iconVisible'][1]}
          isDisabled={!is_activated}
          isChecked={value_of_key['iconVisible'][0] as boolean}
          onChange={(evt) => {
            Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
              .forEach(d => {
                d.iconVisible = evt.target.checked
                d.is_image=false
              })
            set_data({ ...data })
          }}>
          {t('Noeud.icon.Visibilité')}
        </Checkbox>
      </InputGroup>
    </OverlayTrigger>

   
    {value_of_key['iconVisible'][0]?<>
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
            'background':(multi_selected_nodes.current.length === 1) ? multi_selected_nodes_plus.current[0].iconColor : '#ffffff',
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
            value={(multi_selected_nodes.current.length === 1) ? multi_selected_nodes_plus.current[0].iconColor : '#ffffff'}
            onChange={evt => {
              const color = evt.target.value
              Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconColor = color)
              set_data({ ...data })
            }}
          />
        </InputGroup>
      </OverlayTrigger>


    </>:<></>}
  </>


  // Content if we want to add image to node
  const content_image=<>
    <OverlayTrigger
      key={'imageDisabled1'}
      placement={'top'}
      delay={500}
      overlay={(!is_activated)?(<Tooltip id={'imageDisabled1'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <Checkbox 
          sx={SmoothClasses({})}
          maxW={'40%'}
          iconColor={value_of_key['is_image'][1]?'#78C2AD':'white'}
          isDisabled={!is_activated}
          isIndeterminate={value_of_key['is_image'][1]}
          isChecked={value_of_key['is_image'][0] as boolean}
          onChange={(evt) => {
            Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
              .forEach(d => {
                d.iconVisible = evt.target.checked
                d.is_image=false
              })
            set_data({ ...data })
          }}>
          {t('Noeud.img_visibility')}
        </Checkbox>
      </InputGroup>
    </OverlayTrigger>

    {/* Import image */}
    {value_of_key['is_image'][0]?<OverlayTrigger
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
            Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
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
                Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
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
        <Checkbox 
          sx={SmoothClasses({})}
          iconColor={isAllNodeVisible[1]?'#78C2AD':'white'}
          maxW={'40%'}
          isIndeterminate={isAllNodeVisible[1]}
          isChecked={isAllNodeVisible[0]}
          onChange={(evt) => {
            Object.values(data.nodes)
              .filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
              .forEach(d => AssignNodeValueToCorrectVar(d,'shape_visible',evt.target.checked,false))
            set_data({ ...data })
          }}>
          {t('Noeud.apparence.Visibilité')}
        </Checkbox>
        {(IsNodeDisplayingValueLocal(multi_selected_nodes,'shape_visible',false)?TooltipValueSurcharge('node_plus_var',t):<></>)}
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
          Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
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
          Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode))
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

export const SankeyPlusHyperLink : SankeyPlusHyperLinkFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void,
  multi_selected_nodes:{current:SankeyPlusNode[]},
  is_activated:boolean)=>{
  
  const multi_selected_nodes_plus=multi_selected_nodes as {current:SankeyPlusNode[]}

  const hasHyperLink = () => {
    let visible = ''
    visible=multi_selected_nodes_plus.current[0]?.hyperlink??''
    return visible
  }
  const node_hyperlink=hasHyperLink()
  const data_plus =data as SankeyPlusData
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
          Object.values(data_plus.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).forEach(d => d.hyperlink=evt.target.value)
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
  data: SankeyData,
  nodes: { [node_id: string]: SankeyNode },
  node: SankeyNode,
  new_links: string[],
) => {
  // let number_new_path=0
  let long = 0
  const links_present = node.outputLinksId.filter(o => new_links.includes(o))
  if (links_present.length > 0) {
    long += 1
    links_present.forEach(d => {
      const n = nodes[data.links[d].idTarget]
      const lng = calcPath(data,nodes, n, new_links.filter(i=>!ReturnValueLink(data,data.links[i],'recycling'))) as number
      long += isNaN(lng) ? 0 : lng

    })
    return long
  }
}

const node_mouse_click=(
  data:SankeyData,
  set_animating:(b:boolean)=>void,
  event:React.MouseEvent<HTMLButtonElement>,
  d:SankeyNode,
  set_data:(d:SankeyData)=>void,
  nodes_accordion_ref:{current:HTMLDivElement},
  multi_selected_nodes:{current: SankeyNode[] },
  mode_selection:{current:string},
  accordion_ref:{current : HTMLDivElement},
  button_ref:{current : HTMLLabelElement},
  accept_simple_click:{current:boolean},
  display_nodes:{ [node_id: string]: SankeyNode },
  display_links:{ [link_id: string]: SankeyLink },
  GetLinkValue:GetLinkValueFuncType
)=>{
  const sankeyTooltip=d3.select('.sankey-tooltip')
  const data_plus =data as SankeyPlusData
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
    const nodeDisplay = [d.idNode]
    const node_visible=Object.values(display_nodes).map(n=>n.idNode)

    branchAnimate(data,d,nodeDisplay,node_visible,GetLinkValue)
    const visible_links = Object.values(display_links).map(l=>l.idLink)
    const start_point = Object.values(data.nodes).filter(f => (f.inputLinksId.filter(i => visible_links.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0))
    let time_to_animate = 500
    Object.values(data.nodes).filter(f => {
      return (f.inputLinksId.filter(i => visible_links.includes(i)).length === 0) && (f.outputLinksId.filter(i => visible_links.includes(i)).length > 0)})
    //calcul la profondeur max de nouveau flux (le nombre de nouveau flux consecutif ) afin de calculer le temps qu'il faut avant de changer la variable set_view
    if (start_point.length > 0) {
      let nb_animation = calcPath(data,data_plus.nodes, d, visible_links)
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
    SimpleGNodeClick(event,d,data,set_data,nodes_accordion_ref,multi_selected_nodes,mode_selection,accordion_ref,button_ref,accept_simple_click)

  }
}

const branchAnimate = (
  data:SankeyData,
  nodeData: SankeyNode,
  nodeDisplay: string[],
  node_visible: string[],
  GetLinkValue:GetLinkValueFuncType
) => {
  const data_plus = data as SankeyPlusData

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
        const colorTarget=(ReturnValueNode(data,data.nodes[idTarget],'shape_visible'))?NodeColor(data.nodes[idTarget],data):((data_plus.nodes[idTarget].iconVisible)?data_plus.nodes[idTarget].iconColor:'grey')
        // const t=(data.links[idLink].gradient && data.colorMap=='no_colormap')?colorTarget:d3.select(this).attr('stroke')
        const l_grad=PlusReturnValueLink(data_plus,data_plus.links[idLink],'gradient')
        const t=(l_grad)?colorTarget:LinkStrokeOSTyped(data.links[idLink],data,GetLinkValue)
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
        const tmp=direct_son_as_distant_sibling(data,nodeData,data_plus.nodes[idTarget],0,[idLink],node_visible)

        max=(tmp>max)?tmp:max
        setTimeout(()=>{
          branchAnimate(data,data_plus.nodes[idTarget], nodeDisplay,node_visible,GetLinkValue)
        },max*2000)
      }
    })
}

const direct_son_as_distant_sibling=(data:SankeyData,n:SankeyNode,target:SankeyNode,deep:number,link_to_avoid:string[],
  display_nodes_id:string[],
  
)=>{
  //Cherche à savoir si un noeud qui recoit directement le flux de n ai aussi un path inderectement vers ce meme noeud
  //exemple : n0 -> n1  et n0 -> n2 -> n1
  //fonction utilisé pour que le noeud qui recoit le flux direct attend les chemin indirect avant de lancer les animations suivantes
  const next_link = n.outputLinksId.filter(f=>(!ReturnValueLink(data,data.links[f],'recycling') && !Object.values(link_to_avoid).includes(f) && display_nodes_id.includes(data.links[f].idTarget)))
  let max=0
  const data_plus = data as SankeyPlusData

  if(n.idNode === target.idNode){
    return deep-1
  }else if(next_link.length>0) {
    next_link.map(id=>{
      const next_node=data_plus.nodes[data.links[id].idTarget]
      //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
      const to_avoid=link_to_avoid.concat([id])
      const tmp=direct_son_as_distant_sibling(data,next_node,target,deep+1,to_avoid,display_nodes_id)
      max=(tmp>max)?tmp:max
    })
  }

  return max


}

export const PlusNodeClickEvent : PlusNodeClickEventFType =(
  applicationData,
  elementsSelected,
  uiElementsRef,
  set_animating:(_:boolean)=>void,
  mode_selection:{current:string},
  accept_simple_click:{current:boolean},
  GetLinkValue:GetLinkValueFuncType
)=>{
  const {data,set_data,display_nodes,display_links}=applicationData
  const {multi_selected_nodes}=elementsSelected
  const {nodes_accordion_ref,accordion_ref,button_ref}=uiElementsRef
  d3.selectAll(' .opensankey .ggg_nodes')
    .on('click', (event, d) => {
      // Apply some style change to element before starting the animation
      node_mouse_click(
        data,
        set_animating,
        event,
        (d as SankeyPlusNode),
        set_data as (_:SankeyData)=>void,
        nodes_accordion_ref,
        multi_selected_nodes,
        mode_selection,
        accordion_ref,
        button_ref,
        accept_simple_click,
        display_nodes,display_links,
        GetLinkValue
      )
    })
}

export const node_icon_fill_color : node_icon_fill_colorFType = (
  data:SankeyData,n:SankeyNode
)=>{
  if (n.colorTag in n.tags && n.colorTag in n.tags && n.colorParameter === 'groupTag') {
    const selected_tag = n.tags[n.colorTag][0]
    const tag = data.nodeTags[n.colorTag].tags[selected_tag]
    if (tag && !ReturnValueNode(data,n,'shape_visible')) {
      return tag.color as string
    } else {
      //console.log('tutu')
    }
  }
  return (n as SankeyPlusNode).iconColor
}

export const node_icon_path : node_icon_pathFType =(
  data:SankeyData,
  n:SankeyNode
)=>{
  const icon = (data as SankeyPlusData).icon_catalog[(n as SankeyPlusNode).iconName]
  if (icon !== undefined && icon !== null) {
    return icon
  }
  return ''
}

export const SankeyPlusDrawNodesIcon : SankeyPlusDrawNodesIconFType = (
  data:SankeyPlusData,
  display_nodes : { [node_id: string]: SankeyPlusNode },
  mode_selection: {current:string},
  NodeTooltipsContent: NodeTooltipsContentFType,
  GetLinkValue:GetLinkValueFuncType
) => {
  const node_mouse_over=(data:SankeyData,t:d3.BaseType,mode_selection:{current:string},event:React.MouseEvent<HTMLButtonElement>,d:unknown)=>{
    d3.select(t).attr('cursor', (mode_selection.current === 's')? 'pointer' : 'unset')
    if ( (window.SankeyToolsStatic || event.shiftKey)) {
      const sankeyTooltip=d3.select('.sankey-tooltip')

      sankeyTooltip
        .style('opacity', 1)
        .html(NodeTooltipsContent((data as SankeyPlusData),display_nodes, d as SankeyPlusNode,GetLinkValue))
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



  // const direct_son_as_distant_sibling=(data:SankeyData,n:SankeyNode,target:SankeyNode,deep:number,link_to_avoid:string[])=>{
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


export const ContextNodeIcon : ContextNodeIconFType = (
  contextualised_node,
  set_show_menu_node_icon:(_:boolean)=>void,
  t:TFunction
)=>{
  const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
  return <Button onClick={()=>{
    set_show_menu_node_icon(true)
    contextualised_node.current = undefined
  }} variant='light'>{t('Noeud.icon.icon')} {icon_open_modal}</Button>

}

export const OpposingDragElementsPlus : OpposingDragElementsPlusFType = (
  out_of_zone_item:(SankeyNode|SankeyPlusLabel)[],
  event:{ dx: number; dy: number,x:number,y:number },
  dragged:SankeyNode|SankeyPlusLabel,
  data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
)=>{


  OpposingDragElements(out_of_zone_item as SankeyNode[],event,dragged as SankeyNode,data,multi_selected_nodes)

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

export const PlusNodeDragEvent : PlusNodeDragEventFType =(
  applicaTionData,
  elementsSelected,
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  LinkText: LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType
)=>{
  const {data,set_data,display_nodes,display_links}=applicaTionData
  const {multi_selected_nodes,multi_selected_links,multi_selected_label}=elementsSelected
  
  const inv_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, data.user_scale])
  const scale = d3.scaleLinear()
    .range([0, 100])
    .domain([0, data.user_scale])

  if(mode_selection.current==='s' && window.SankeyToolsStatic!==true){
    (d3.selectAll('.ggg_nodes') as d3.Selection<SVGGElement,SankeyPlusNode,d3.BaseType, unknown> ).call(
      SankeyPlusdragGNodeEvent(
        data,multi_selected_nodes,mode_selection,alt_key_pressed,set_data,display_nodes,display_links,
        multi_selected_links,LinkText,GetLinkValue,scale,inv_scale,multi_selected_label,GetSankeyMinWidthAndHeight
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
    .on('start',()=>SvgDragMiddleMouseStart())
    .on('drag',evt=>{
      SvgDragMiddleMouseMove(evt,data)
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

const SankeyPlusdragGNodeEvent = (
  data:SankeyPlusData,
  multi_selected_nodes:{current: SankeyPlusNode[] },
  mode_selection:{current:string},
  alt_key_pressed:boolean,
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current:SankeyPlusLink[]},
  LinkText:LinkTextFuncType,
  GetLinkValue:GetLinkValueFuncType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  multi_selected_label:{current:SankeyPlusLabel[]},
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType
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
            set_data,display_nodes,display_links,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,scale,inv_scale,multi_selected_label,node_visible
          )
        }
      }
    }).on('end',()=>{
      if(d3.select(document.activeElement).attr('class')!=='input_label'){
        set_data(data)
      }
    })
}

const drag_nodes_plus = (
  node:SankeyPlusNode,
  event: { dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current: SankeyPlusNode[] },
  data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current: SankeyPlusLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number,
  multi_selected_label:{current:SankeyPlusLabel[]},
  node_visible:string[]
) => {
  RemoveAnimate()

  // Cherche si des element seront hors zone si on les drag
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé
  const out_of_zone_item=return_out_of_bound_element_plus(node,data,event,multi_selected_nodes,node_visible)
  // Pousse les element non sélectionnés dans la direction opposé
  if(out_of_zone_item.length>0){
    OpposingDragElementsPlus(out_of_zone_item,event,node,data,multi_selected_nodes,multi_selected_label)
  }

  drag_elements_plus(
    node,data,event,multi_selected_nodes,multi_selected_label,set_data,display_nodes,display_links,
    multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,GetLinkValue,DrawArrows,scale,inv_scale
  )

}

export const drag_elements_plus : drag_elements_plusFType = (
  dragged:SankeyPlusNode|SankeyPlusLabel,
  data:SankeyData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyPlusNode[]},
  multi_selected_label:{current:SankeyPlusLabel[]},
  set_data:(d:SankeyPlusData)=>void,
  display_nodes:{ [node_id: string]: SankeyPlusNode },
  display_links:{ [link_id: string]: SankeyPlusLink },
  multi_selected_links:{current: SankeyPlusLink[] },
  LinkText:LinkTextFuncType,
  GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
  GetLinkValue:GetLinkValueFuncType,
  DrawArrows:drawArrowsType,
  scale:(t:number)=>number,
  inv_scale:(t:number)=>number
)=>{
  // const node=Object.keys(dragged).includes('idNode')?dragged as SankeyPlusNode:{} as SankeyPlusNode
  // const zdt=Object.keys(dragged).includes('idLabel')?dragged as SankeyPlusLabel:{} as SankeyPlusLabel
  drag_elements(
    dragged as SankeyNode,data,event,multi_selected_nodes,set_data as (_:SankeyData)=>void,
    display_nodes,display_links,multi_selected_links,LinkText,GetSankeyMinWidthAndHeight,
    GetLinkValue,DrawArrows,scale,inv_scale
  )


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

export const return_out_of_bound_element_plus : return_out_of_bound_element_plusFType = (
  dragged:SankeyNode|SankeyPlusLabel,
  data:SankeyData,
  event:{ dx: number; dy: number,x:number,y:number },
  multi_selected_nodes:{current:SankeyNode[]},node_visible:string[]
)=>{

  // Cherche si des noeuds seront hors zone si on les drag
  // Si c'est le cas, pousse les éléments qui ne sont pas sélectionnés dans la direction opposé


  const out_of_zone_item:(SankeyPlusNode|SankeyPlusLabel)[]=return_out_of_bound_element(dragged as SankeyNode,data,event,multi_selected_nodes,node_visible) as (SankeyPlusNode|SankeyPlusLabel)[]


  Object.values((data as unknown as {labels:SankeyPlusLabel[]}).labels).filter(lb=>{
    return (lb.x<=0 && event.dx<0) || (lb.y<=0 && event.dy<0) || (lb.x<=0 && event.x<0) || (lb.y<=0 && event.y<0)
  }).forEach(lb=>out_of_zone_item.push(lb))


  return out_of_zone_item

}

export const scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])

export const inv_scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 100])



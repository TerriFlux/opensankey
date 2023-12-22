import React, { FunctionComponent, useState,useRef} from 'react'
import { Tabs, Button, FormControl, FormLabel, OverlayTrigger, Tooltip, InputGroup,Overlay,Popover, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps, ReactElementLike } from 'prop-types'
import { SankeyData, SankeyDataPropTypes,  SankeyNode, SankeyNodePropTypes,SankeyLink,treeFolderType} from './types'
import { DeleteNode,ReturnValueNode,ApplyStyleToNodes,AddNewNode,CutName,FolderIcon,FolderOpenIcon,FileIcon} from './SankeyUtils'
import * as d3 from 'd3'
import { FaPlus, FaMinus, FaEye,} from 'react-icons/fa'
// import { MultiSelect } from 'react-multi-select-component'
// import { selected_type } from './SankeyMenu'
import { SankeyMenuConfigurationNodesIO } from './SankeyMenuConfigurationNodesIO'
import {SankeyMenuConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {SankeyMenuConfigurationNodesTags} from './SankeyMenuConfigurationNodesTags'
import {SankeyMenuConfigurationNodesTooltip} from './SankeyMenuConfigurationNodesTooltip'
import { textwrap } from 'd3-textwrap'
import { TFunction } from 'i18next'
import { NodeVisibleOnsSvg } from './SankeyDrawFunction'
import FolderTree from 'react-folder-tree'
import 'react-folder-tree/dist/style.css'
import { GetLinkValueFuncType } from './FunctionTypes'

const SankeyNodeEditionPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  set_style_to_apply: PropTypes.func.isRequired,
  menu_configuration_nodes: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  token:PropTypes.bool.isRequired,
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

export const OpenSankeyMenuConfigurationNodes = (
  t:TFunction<"translation", undefined>,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  display_nodes: { [node_id: string]: SankeyNode },
  multi_selected_nodes:{current:SankeyNode[]},
  menu_configuration_nodes_attributes:JSX.Element[],
  link_io:string,set_link_io:React.Dispatch<React.SetStateAction<string>>,
  link_pos:string,set_link_pos:React.Dispatch<React.SetStateAction<string>>,
  tab_colored:boolean,set_tab_colored:React.Dispatch<React.SetStateAction<boolean>>,
  GetLinkValue:GetLinkValueFuncType,
  multi_selected_links: {current:SankeyLink[]},
  set_display_link_opacity:React.Dispatch<React.SetStateAction<string>>,
) => {
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data.nodeTags).length > 0 ? Object.keys(data.nodeTags)[0] : '')
  const ui : {[s:string] : JSX.Element}= {
    'Attributes'      : SankeyMenuConfigurationNodesAttributes(t,menu_configuration_nodes_attributes),
    'Tooltip'         : SankeyMenuConfigurationNodesTooltip(t,data,set_data,multi_selected_nodes),
  }

  if (Object.keys(data.nodeTags).length > 0 && data.accordeonToShow.includes('EN') ) {
    ui['Tags'] = SankeyMenuConfigurationNodesTags(t,data,set_data,multi_selected_nodes,tags_group_key,set_tags_group_key)
  }
  
  ui['Entrées Sorties'] = SankeyMenuConfigurationNodesIO(t,data,set_data,display_nodes,multi_selected_nodes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,GetLinkValue,multi_selected_links,set_display_link_opacity)
  
  return ui
}

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = (
  {t,data, set_data, multi_selected_nodes,set_style_to_apply, menu_configuration_nodes,token }
) => {
  const [forceUpdate, setForceUpdate] = useState(false)
  // const tmpNodes = Object.fromEntries(Object.entries(data.nodes).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  // const INITIAL_OPTIONS = Object.values(tmpNodes).filter(d=>(data.displayed_node_selector)?node_visible.includes(d.idNode):true).map((d) => { return { 'label': d.name, 'value': d.idNode } })
  const target_node_selector=useRef(null)
  const [show_node_selector,set_show_node_selector]=useState(false)

  const has_node_type=Object.values(data.nodeTags).filter(t=>t.group_name==='Type de noeud').length>0
  const pre_filter_node=(has_node_type)?Object.keys(data.nodeTags['Type de noeud'].tags):[]
  const [filter_node_selector,set_filter_node_selector]=useState<string[]>(pre_filter_node)

  const tree_of_nodes=tree_data_nodes(t as TFunction<"translation", undefined>,data,multi_selected_nodes,NodeVisibleOnsSvg(),filter_node_selector)

  // const selected : selected_type[] = multi_selected_nodes.current.map((d) => { return { 'label': d.name, 'value': d.idNode } })
  //Renvoie le menu déroulant pour la sélection des noeuds
  // const dropdownMultiNode = () => {
  //   const DD = (
  //     <div id='DD_multi_node' style={{width:'70%',zIndex:3}}>
  //       <MultiSelect
  //         valueRenderer={(selected: selected_type[]) => {
  //           return selected.length ? selected.map(({ label })=> label + ', ') : t('Noeud.NS')
  //         }}
  //         options={INITIAL_OPTIONS}
  //         value={selected}
  //         overrideStrings={{
  //           'selectAll': t('Noeud.TS'),
  //         }}
  //         onChange={(selected: [{ label: string, value: string }]) => {
  //           const new_sel = selected.map(d => d.value)
  //           const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.idNode)))
  //           multi_selected_nodes.current = m_s
  //           Object.values(data.nodes).forEach( n =>
  //             d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',0)
  //           )
  //           multi_selected_nodes.current.forEach( n =>
  //             d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',2)
  //           )
  //           setForceUpdate(!forceUpdate)
  //           set_data({...data})
  //         }}
  //         labelledBy={'hello'}/>
  //     </div>)
  //   return DD
  // }



  const overlayNodeSlector= <Overlay
    key={'popover-nodes-level'}
    placement={'left'}
    target={target_node_selector}
    rootClose
    show={show_node_selector}
    onHide={()=>{set_show_node_selector(false)}}
  >
    <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{t('Noeud.selector')}</Popover.Header>
      <Popover.Body style={{  marginLeft: '5px',maxHeight:'500px',overflowY:'auto' }}>
        {has_node_type?<InputGroup style={{width:'100%'}} as={ButtonGroup}>
          {pre_filter_node.includes('produit')?<Button className='btn_menu_config' variant={filter_node_selector.includes('produit')?'primary':'outline-primary'} onClick={()=>{
            if(!filter_node_selector.includes('produit')){
              filter_node_selector.push('produit')
            }else{
              filter_node_selector.splice(filter_node_selector.indexOf('produit'), 1)
            }
            set_filter_node_selector(filter_node_selector)
            set_data({...data})
          }}>{t('Noeud.product')}</Button>:<></>}

          {pre_filter_node.includes('secteur')?<Button className='btn_menu_config' variant={filter_node_selector.includes('secteur')?'primary':'outline-primary'} onClick={()=>{
            if(!filter_node_selector.includes('secteur')){
              filter_node_selector.push('secteur')
            }else{
              filter_node_selector.splice(filter_node_selector.indexOf('secteur'), 1)
            }
            set_filter_node_selector(filter_node_selector)
            set_data({...data})
          }}>{t('Noeud.sector')}</Button>:<></>}

          {pre_filter_node.includes('echange')?<Button className='btn_menu_config' variant={filter_node_selector.includes('echange')?'primary':'outline-primary'} onClick={()=>{
            if(!filter_node_selector.includes('echange')){
              filter_node_selector.push('echange')
            }else{
              filter_node_selector.splice(filter_node_selector.indexOf('echange'), 1)
            }
            set_filter_node_selector(filter_node_selector)
            set_data({...data})
          }}>{t('Noeud.exchange')}</Button>:<></>}

        </InputGroup>:<></>}

        <FolderTree
          iconComponents={{
            FileIcon,
            FolderIcon,
            FolderOpenIcon
          }}
          initCheckedStatus='custom'
          indentPixels={20}
          onNameClick={()=>{
            // For now nothing happen when we click on node name
            null
          }}
          
          data={ tree_of_nodes }
          onChange={ (state, event) => {
            const ev=event as {type:string,path:number[],params:number[]}
            const node_visible=NodeVisibleOnsSvg()
            const root_is_checked=Object.values(data.nodes).filter(n=>(data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)).map(n=>n).length===multi_selected_nodes.current.length
            if(state.checked===0.5){
              state.checked=0
            }
            if(ev.path && ev.path.length>0 && ev.type==='checkNode'){
              // check or uncheck node in tree folder depending on if it's already selected
              const idNodeSelected=getNodeFromTree(ev.path,tree_of_nodes)
              if(idNodeSelected.checked!==0.5){
                const newNodeSelected=data.nodes[idNodeSelected.id]
                if(ev.params[0]===1){
                  multi_selected_nodes.current.push(newNodeSelected)
                }else{
                  multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(newNodeSelected), 1)
                }
              }
              set_data({...data})
              
            }else if(ev.type==='checkNode' &&ev.path && ev.path.length==0 && state.checked===1 && !root_is_checked){
              // select all nodes
              multi_selected_nodes.current=Object.values(data.nodes).filter(n=>(data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)).map(n=>n)
              set_data({...data})
            }else if(ev.type==='checkNode' &&ev.path && ev.path.length==0 && state.checked===0 && root_is_checked){
              // Deselect all nodes
              multi_selected_nodes.current=[]
              set_data({...data})
            }
          } }
        />
      </Popover.Body>
    </Popover>
  </Overlay>


  return (<>
    {
      (token==false && Object.keys(data.nodes).length>15)?
        <>
          <FormLabel style={{'color':'red'}}>{t('Menu.warningLimitNode')}</FormLabel>
        </>
        :
        <></>
    }

    <InputGroup>
      {/* Boutton pour ajouter un noeud */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.1'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.1'}>{t('Menu.tooltips.noeud.plus')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant='outline-primary'
          className='btn_menu_config'
          disabled={token==false && Object.keys(data.nodes).length>15}
          onClick={() => {
            set_style_to_apply('default')
            AddNewNode(data,set_data,multi_selected_nodes)
            ApplyStyleToNodes(data,set_data,multi_selected_nodes)
          }}>
          <FaPlus/>
        </Button>
      </OverlayTrigger>

      
          

      {/* Liste déroulante pour selectionner un noeud */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.2'}>{t('Menu.tooltips.noeud.slct')} </Tooltip>}>
        {/* {dropdownMultiNode()} */}
        <Button style={{width:'70%'}} ref={target_node_selector} variant='outline-primary' id='button-node_selector' onClick={()=>{set_show_node_selector(!show_node_selector)}} >
          {multi_selected_nodes.current.length>0?CutName(multi_selected_nodes.current.map(n => n.name).join(','), 25 ):'None'}
        </Button>
      </OverlayTrigger>
      {overlayNodeSlector}
      {/* Boutton pour supprimer le noeud selectionné */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.3'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.3'}>{t('Menu.tooltips.noeud.rm')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant='outline-primary'
          className='btn_menu_config'
          disabled={multi_selected_nodes.current.length == 0}
          onClick={
            () => {
              multi_selected_nodes.current.map(d => DeleteNode(data, d))
              multi_selected_nodes.current = []
              set_data({ ...data })
            }}>
          <FaMinus />
        </Button>
      </OverlayTrigger>

      {/* Checkbox permettant d'afficher que les noeuds visibles dans le selecteur */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.4'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.4'}>{t('Menu.tooltips.noeud.dns')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant={data.displayed_node_selector?'primary':'outline-primary'}
          className='btn_menu_config'
          onClick={
            () => {
              data.displayed_node_selector=!data.displayed_node_selector
              set_data({...data})
            }}>
          <FaEye />
        </Button>
      </OverlayTrigger>
    </InputGroup>

    {/* Affichage du nom des noeuds selectionnés */}
    <InputGroup>
      <InputGroup.Text>{t('Noeud.Nom')}</InputGroup.Text>
      <OverlayTrigger
        key={'menu.tooltips.noeud.6'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.6'}>{t('Noeud.tooltips.Nom')} </Tooltip>}>
        <FormControl
          value={
            (multi_selected_nodes.current.length != 1) ? '' : multi_selected_nodes.current[0].name
          }
          onChange={evt => {
            if (multi_selected_nodes.current.length != 1) {
              return
            }
            multi_selected_nodes.current[0].name = evt.target.value
            const d = multi_selected_nodes.current[0]
            d3.select(' .opensankey #text_' + d.idNode).text(evt.target.value)
            const wrap = textwrap()
              .bounds({ height: 100, width: (ReturnValueNode(data,d,'label_box_width') as number != 0) ? ReturnValueNode(data,d,'label_box_width') as number : 110 })
              .method('tspans')
            d3.select(' .opensankey #ggg_' + d.idNode + ' text')
              .call(wrap)
            if (!d.x_label || data.show_structure === 'structure') {
              d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')
                if (ReturnValueNode(data,d,'label_horiz') == 'middle') {
                  return width / 2
                } else if (ReturnValueNode(data,d,'label_horiz') == 'right') {
                  return ReturnValueNode(data,d,'label_vert') == 'middle' ? width : 0
                } else {
                  return 0
                }
              })
            }
            d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
              const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')
              if (d.x_label) {
                return d.x_label
              } else if (ReturnValueNode(data,d,'label_horiz') == 'middle') {
                return width / 2
              } else if (ReturnValueNode(data,d,'label_horiz') == 'right') {
                return width
              } else {
                return 0
              }
            })
            setForceUpdate(!forceUpdate)
          }}
          disabled={(multi_selected_nodes.current.length == 1) ? false : true} />
      </OverlayTrigger>
    </InputGroup>

    {/* Declenché si des neouds sont selectionnées */}
    {(multi_selected_nodes.current.length !== 0) ? (
      <>
        <Tabs defaultActiveKey="nodes_desc" id="node_attributes" fill={true}>
          {menu_configuration_nodes.map((c: ReactElementLike)=>{
            return c})}
        </Tabs>
      </>) : (<></>)}
  </>
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition




export const tree_data_nodes=(t:TFunction<"translation", undefined>,data:SankeyData,multi_selected_nodes:{current:SankeyNode[]},node_visible:string[],
  filter_node_selector:string[]
)=>{

  const root_checked=(Object.values(data.nodes).filter(n=>(data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)).map(n=>n).length===multi_selected_nodes.current.length)?1:0
  const tree:treeFolderType={id:'root',name:t('Noeud.TS'),children:[],checked:root_checked}
  Object.values(data.nodes).filter(n=>check_node_has_no_valid_dimensions(n) && check_node_has_node_type(n,filter_node_selector)).forEach(n=>{
    const sub_tree={id:n.idNode,name:n.name,checked:multi_selected_nodes.current.includes(n)?1:0} as treeFolderType

    if(data.displayed_node_selector && !node_visible.includes(n.idNode)){
      sub_tree.checked=0.5
    }
    tree.children?tree.children.push(sub_tree):tree.children=[sub_tree]})

  tree.children?.forEach(t=>{
    const child_t=add_children(data.nodes,data.nodes[t.id],multi_selected_nodes,data.displayed_node_selector,node_visible,filter_node_selector)
    if(child_t.length>0){
      t.children=child_t
    }
  })
  return tree
}

const check_node_has_no_valid_dimensions=(n:SankeyNode)=>{
  if(!n.dimensions){
    return true
  }
  let invalid=true
  Object.entries(n.dimensions).filter(nd=>nd[0]!=='Primaire').forEach(value_dim=>{
    if(value_dim[1].parent_name!==undefined){
      invalid=false
    }

  })
  return invalid
}

export const add_children=(nodes:{[x:string]:SankeyNode},n:SankeyNode,multi_selected_nodes:{current:SankeyNode[]},displayed_node_selector:boolean,node_visible:string[],filter_node_selector:string[])=>{
  const children:treeFolderType[]=[]
  Object.entries(nodes)
    .filter(nd=> check_node_has_node_type(nd[1] as SankeyNode,filter_node_selector))
    .forEach(nn=>{
      if(nn[1].dimensions){
        Object.entries(nn[1].dimensions).filter(nd=>nd[0]!=='Primaire' && nd[1].parent_name===n.idNode ).forEach(()=>{
          const c:treeFolderType={id:nn[0],name:nn[1].name,checked:multi_selected_nodes.current.includes(nn[1])?1:0}        
          const child=add_children(nodes,nn[1],multi_selected_nodes,displayed_node_selector,node_visible,filter_node_selector)
          if(child.length!=0){
            c.children=child
          }
          if(displayed_node_selector && !node_visible.includes(nn[0])){
            c.checked=0.5
          }
          children.push(c)

        })
      }
    })
  return children
}

export const getNodeFromTree=(path:number[],tree:treeFolderType):{id:string,checked?:number}=>{
      
  if(tree.children && path.length>0){
    const index=path.shift()??-1
    const sub_tree=tree.children[index]
    return getNodeFromTree(path,sub_tree)
  }else{
    const id=tree.id,checked=tree.checked
    return {id,checked}
  }
}

export const check_node_has_node_type=(n:SankeyNode,filter_node_selector:string[])=>{
  if(n.tags && n.tags['Type de noeud'] && n.tags['Type de noeud'].length>0 && filter_node_selector.length>0){
    return (filter_node_selector.includes(n.tags['Type de noeud'][0]))
  }else{
    return true
  }
}
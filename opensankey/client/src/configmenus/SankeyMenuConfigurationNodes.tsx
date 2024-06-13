import React, { FunctionComponent, useState } from 'react'
import { ReactElementLike } from 'prop-types'
import { FaPlus, FaMinus, FaEye } from 'react-icons/fa'
import { MultiSelect } from 'react-multi-select-component'

import * as d3 from 'd3'
import { textwrap } from 'd3-textwrap'
import { TFunction } from 'i18next'

import {
  Box,
  Button,
  InputGroup,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab
} from '@chakra-ui/react'

/*************************************************************************************************/
import {
  ComponentUpdaterType,
  LinkFunctionTypes,
  NodeFunctionTypes,
  SankeyData,
  SankeyNode,
  applicationContextType,
  applicationDataType,
  applicationStateType,
  treeFolderType
} from '../types/Types'
import { GetLinkValueFuncType } from './types/SankeyUtilsTypes'
import {
  add_childrenFType,
  check_node_has_node_typeFType,
  getNodeFromTreeFType,
  OpenSankeyMenuConfigurationNodesFType,
  tree_data_nodesFType,
} from './types/SankeyMenuConfigurationNodesTypes'

/*************************************************************************************************/
import {
  ReturnValueNode,AddNewNode, deleteSelectedNodeFromData,
  OSTooltip} from './SankeyUtils'
import { SankeyMenuConfigurationNodesIO } from './SankeyMenuConfigurationNodesIO'
import { SankeyWrapperConfigInModalOrMenu } from './SankeyMenuConfigurationNodesAttributes'
import { SankeyMenuConfigurationNodesTags } from './SankeyMenuConfigurationNodesTags'
import { SankeyMenuConfigurationNodesTooltip } from './SankeyMenuConfigurationNodesTooltip'
import { DeselectVisualyNodes, NodeVisibleOnsSvg, SelectVisualyNodes } from '../draw/SankeyDrawFunction'
import { selected_type } from '../topmenus/SankeyMenuTop'


/*************************************************************************************************/
type SankeyEditionTypes = {
  applicationContext:applicationContextType,
  applicationData:applicationDataType,
  applicationState:applicationStateType,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_configuration_nodes : {[s:string]: JSX.Element},
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  node_function:NodeFunctionTypes
}

/*************************************************************************************************/
export const OpenSankeyMenuConfigurationNodes : OpenSankeyMenuConfigurationNodesFType = (
  applicationContext,
  applicationData,
  applicationState,
  menu_configuration_nodes_attributes,
  GetLinkValue:GetLinkValueFuncType,
  node_function,link_function,
  ComponentUpdater
) => {
  const { data } = applicationData

  const ui : {[s:string] : JSX.Element}= {
    'Noeud.tabs.apparence': <SankeyWrapperConfigInModalOrMenu
      menu_to_wrap = {menu_configuration_nodes_attributes}
      for_modal = {false}
      idTab={'node_attr'}
    />,
    'Noeud.tabs.infos': <SankeyMenuConfigurationNodesTooltip
      applicationContext={applicationContext}
      applicationState ={applicationState}
      ComponentUpdater={ComponentUpdater}
      menu_for_modal = {false}
    />
  }

  if (Object.keys(data.nodeTags).length > 0 && data.accordeonToShow.includes('EN') ) {
    ui['Noeud.tabs.tags'] = <SankeyMenuConfigurationNodesTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      applicationState={applicationState}
      node_function={node_function}
      ComponentUpdater={ComponentUpdater}
      menu_for_modal={false}
    />
  }

  ui['Noeud.tabs.io'] = <SankeyMenuConfigurationNodesIO
    applicationContext={applicationContext}
    applicationData={applicationData}
    applicationState={applicationState}
    GetLinkValue={GetLinkValue}
    node_function={node_function}
    link_function={link_function}
    ComponentUpdater={ComponentUpdater}
    menu_for_modal={false}
  />

  return ui
}

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = (
  {
    applicationContext,
    applicationData,
    applicationState,
    multi_selected_nodes,
    menu_configuration_nodes,
    link_function,
    ComponentUpdater,
    node_function
  }
) => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const {
    updateComponentMenuConfigNode,updateComponentMenuNodeIOSelectSideNode,
    updateComponentMenuConfigLink,updateMenuConfigTextNodeTooltip
  }=ComponentUpdater
  updateComponentMenuConfigNode.current=()=>setForceUpdate(!forceUpdate)
  
  const {data}=applicationData
  const {t}=applicationContext
  const node_visible=NodeVisibleOnsSvg()

  const tmpNodes = Object
    .fromEntries(
      Object.entries(data.nodes)
        .sort(([, a], [, b]) =>
          (a.name > b.name) ?
            1 :
            ((b.name > a.name) ?
              -1 :
              0)
        ))
  const INITIAL_OPTIONS = Object
    .values(tmpNodes)
    .filter(d => (
      data.displayed_node_selector)?
      node_visible.includes(d.idNode):
      true)
    .map(d => {
      return { 'label': d.name, 'value': d.idNode }
    })

  // const tree_of_nodes=tree_data_nodes(t as TFunction<'translation', undefined>,data,multi_selected_nodes,NodeVisibleOnsSvg(),filter_node_selector)

  const selected : selected_type[] = multi_selected_nodes.current.map((d) => { return { 'label': d.name, 'value': d.idNode } })

  // Renvoie le menu déroulant pour la sélection des noeuds
  const dropdownMultiNode = () => {
    const DD = (
      <Box
        layerStyle='submenuconfig_droplist'
      >
        {/* Position custom pour MultiSelect */}
        <Box
          height='2rem'
          width='14.75rem'
        >
          <MultiSelect
            options={INITIAL_OPTIONS}
            value={selected}
            labelledBy={t('Noeud.TS')}
            onChange={(selected: [{ label: string, value: string }]) => {
              const new_sel = selected.map(d => d.value)
              const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.idNode)))
              multi_selected_nodes.current = m_s
              Object.values(data.nodes).forEach( n =>
                d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',0)
              )
              multi_selected_nodes.current.forEach( n =>
                d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',2)
              )
              setForceUpdate(!forceUpdate)
              multi_selected_nodes.current.forEach(d=>SelectVisualyNodes(d))
              updateComponentMenuNodeIOSelectSideNode.current()
              updateMenuConfigTextNodeTooltip.current.forEach(f=>f())

            }}
            valueRenderer={(selected: selected_type[]) => {
              return selected.length ? selected.map(({ label })=> label + ', ') : t('Noeud.NS')
            }}
          />
        </Box>
      </Box>)
    return DD
  }


  // Commented for now awaiting the redesign of nodes tree structur
  // const overlayNodeSlector= <Overlay
  //   key={'popover-nodes-level'}
  //   placement={'left'}
  //   target={target_node_selector}
  //   rootClose
  //   show={show_node_selector}
  //   onHide={()=>{set_show_node_selector(false)}}
  // >
  //   <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
  //     <Popover.Header as="h3">{t('Noeud.selector')}</Popover.Header>
  //     <Popover.Body style={{  marginLeft: '5px',maxHeight:'500px',overflowY:'auto' }}>
  //       {has_node_type?<InputGroup style={{width:'100%'}} as={ButtonGroup}>
  //         {pre_filter_node.includes('produit')?<Button className='btn_menu_config' variant={filter_node_selector.includes('produit')?'primary':'outline-primary'} onClick={()=>{
  //           if(!filter_node_selector.includes('produit')){
  //             filter_node_selector.push('produit')
  //           }else{
  //             filter_node_selector.splice(filter_node_selector.indexOf('produit'), 1)
  //           }
  //           set_filter_node_selector(filter_node_selector)
  //           set_data({...data})
  //         }}>{t('Noeud.product')}</Button>:<></>}

  //         {pre_filter_node.includes('secteur')?<Button className='btn_menu_config' variant={filter_node_selector.includes('secteur')?'primary':'outline-primary'} onClick={()=>{
  //           if(!filter_node_selector.includes('secteur')){
  //             filter_node_selector.push('secteur')
  //           }else{
  //             filter_node_selector.splice(filter_node_selector.indexOf('secteur'), 1)
  //           }
  //           set_filter_node_selector(filter_node_selector)
  //           set_data({...data})
  //         }}>{t('Noeud.sector')}</Button>:<></>}

  //         {pre_filter_node.includes('echange')?<Button className='btn_menu_config' variant={filter_node_selector.includes('echange')?'primary':'outline-primary'} onClick={()=>{
  //           if(!filter_node_selector.includes('echange')){
  //             filter_node_selector.push('echange')
  //           }else{
  //             filter_node_selector.splice(filter_node_selector.indexOf('echange'), 1)
  //           }
  //           set_filter_node_selector(filter_node_selector)
  //           set_data({...data})
  //         }}>{t('Noeud.exchange')}</Button>:<></>}

  //       </InputGroup>:<></>}

  //       <FolderTree
  //         iconComponents={{
  //           FileIcon,
  //           FolderIcon,
  //           FolderOpenIcon
  //         }}
  //         initCheckedStatus='custom'
  //         indentPixels={20}
  //         onNameClick={()=>{
  //           // For now nothing happen when we click on node name
  //           null
  //         }}
  //         data={ tree_of_nodes }
  //         onChange={ (state, event) => {
  //           const ev=event as {type:string,path:number[],params:number[]}
  //           const node_visible=NodeVisibleOnsSvg()
  //           const root_is_checked=Object.values(data.nodes).filter(n=>(data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)).map(n=>n).length===multi_selected_nodes.current.length
  //           if(state.checked===0.5){
  //             state.checked=0
  //           }
  //           if(ev.path && ev.path.length>0 && ev.type==='checkNode'){
  //             // check or uncheck node in tree folder depending on if it's already selected
  //             const idNodeSelected=getNodeFromTree(ev.path,tree_of_nodes)
  //             if(idNodeSelected.checked!==0.5){
  //               const newNodeSelected=data.nodes[idNodeSelected.id]
  //               if(ev.params[0]===1){
  //                 multi_selected_nodes.current.push(newNodeSelected)
  //               }else{
  //                 multi_selected_nodes.current.splice(multi_selected_nodes.current.indexOf(newNodeSelected), 1)
  //               }
  //             }
  //             set_data({...data})

  //           }else if(ev.type==='checkNode' &&ev.path && ev.path.length==0 && state.checked===1 && !root_is_checked){
  //             // select all nodes
  //             multi_selected_nodes.current=Object.values(data.nodes).filter(n=>(data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)).map(n=>n)
  //             set_data({...data})
  //           }else if(ev.type==='checkNode' &&ev.path && ev.path.length==0 && state.checked===0 && root_is_checked){
  //             // Deselect all nodes
  //             multi_selected_nodes.current=[]
  //             set_data({...data})
  //           }
  //         } }
  //       />
  //     </Popover.Body>
  //   </Popover>
  // </Overlay>


  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {
        (!applicationContext.has_free_account && Object.keys(data.nodes).length>15)?
          <Box
            as='span'
            layerStyle='menuconfigpanel_warn_msg'
          >
            {t('Menu.warningLimitNode')}
          </Box>
          :
          <></>
      }

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_droplist'
      >
        {/* Boutton pour ajouter un noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.plus')}>
          <Button
            variant='menuconfigpanel_add_button'
            isDisabled={!applicationContext.has_free_account && Object.keys(data.nodes).length>15}
            onClick={() => {
              Object.values(applicationData.display_nodes).forEach(n=>DeselectVisualyNodes(n))
              AddNewNode(applicationData,multi_selected_nodes,node_function)
              ComponentUpdater.updateComponenSaveInCache.current(false)
              SelectVisualyNodes(multi_selected_nodes.current[0])
              updateMenuConfigTextNodeTooltip.current.forEach(f=>f())
              setForceUpdate(!forceUpdate)
            }}>
            <FaPlus/>
          </Button>
        </OSTooltip>

        {/* Liste déroulante pour selectionner un noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.slct')}>
          {dropdownMultiNode()}
        </OSTooltip>

        {/* Boutton pour supprimer le noeud selectionné */}
        <OSTooltip label={t('Menu.tooltips.noeud.rm')}>
          <Button
            variant='menuconfigpanel_del_button'
            isDisabled={multi_selected_nodes.current.length == 0}
            onClick={
              () => {
                deleteSelectedNodeFromData(applicationData,applicationState)

                node_function.recomputeDisplayedElement()
                node_function.RedrawNodes(Object.values(applicationData.display_nodes))
                link_function.RedrawLinks(Object.values(applicationData.display_links))
                updateComponentMenuConfigNode.current()
                updateComponentMenuConfigLink.current()
                ComponentUpdater.updateComponenSaveInCache.current(false)

              }}>
            <FaMinus />
          </Button>
        </OSTooltip>

        {/* Checkbox permettant d'afficher que les noeuds visibles dans le selecteur */}
        <OSTooltip label={t('Menu.tooltips.noeud.dns')}>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={
              () => {
                data.displayed_node_selector=!data.displayed_node_selector
                setForceUpdate(!forceUpdate)
              }}>
            <FaEye />
          </Button>
        </OSTooltip>
      </Box>

      {/* Affichage du nom des noeuds selectionnés */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
        gridTemplateColumns='1fr 9fr'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
          textStyle='h3'
        >
          {t('Noeud.Nom')}
        </Box>
        <Box>
          <OSTooltip label={t('Noeud.tooltips.Nom')}>
            <InputGroup
              variant='menuconfigpanel_option_input'
            >
              <Input
                variant='menuconfigpanel_option_input'
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
                isDisabled={(multi_selected_nodes.current.length == 1) ? false : true}
              />
            </InputGroup>
          </OSTooltip>
        </Box>
      </Box>

      {/* Declenché si des neouds sont selectionnées */}
      {
        (multi_selected_nodes.current.length !== 0) ?
          <Tabs>
            <TabList>
              {
                Object
                  .keys(menu_configuration_nodes)
                  .map((key) => {
                    return <Tab> 
                      <Box layerStyle='submenuconfig_tab' >
                        {t(key)}
                      </Box>
                    </Tab>
                  }
                  )
              }
            </TabList>
            <TabPanels>
              {
                Object
                  .values(menu_configuration_nodes)
                  .map((c: ReactElementLike) => {
                    return c
                  })
              }
            </TabPanels>
          </Tabs>:
          <></>
      }
    </Box>
  )
}

export default SankeyNodeEdition

export const tree_data_nodes : tree_data_nodesFType =(
  t:TFunction<'translation', undefined>,
  data:SankeyData,
  multi_selected_nodes:{current:SankeyNode[]},
  node_visible:string[],
  filter_node_selector:string[]
)=>{

  const root_checked=(Object.values(data.nodes).filter(n=>
    (data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)
  ).map(n=>n).length===multi_selected_nodes.current.length)?1:0
  const tree:treeFolderType={id:'root',name:t('Noeud.TS'),children:[],checked:root_checked}

  //const roots_nodes = Object.values(data.nodes).filter(n=>n.tags['Primaire'].includes('1'))

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
  Object.entries(n.dimensions).filter(nd=>nd[0]==='Primaire').forEach(value_dim=>{
    if(value_dim[1].parent_name!==undefined){
      invalid=false
    }

  })
  return invalid
}

export const add_children : add_childrenFType =(
  nodes:{[x:string]:SankeyNode},n:SankeyNode,
  multi_selected_nodes:{current:SankeyNode[]},
  displayed_node_selector:boolean,
  node_visible:string[],filter_node_selector:string[]
)=> {
  const children:treeFolderType[]=[]
  Object.entries(nodes)
    .filter(nd=> check_node_has_node_type(nd[1] as SankeyNode,filter_node_selector))
    .forEach(nn=>{
      if(nn[1].dimensions['Primaire'].parent_name===n.idNode ) {
        const c:treeFolderType={id:nn[0],name:nn[1].name,checked:multi_selected_nodes.current.includes(nn[1])?1:0}
        const child=add_children(nodes,nn[1],multi_selected_nodes,displayed_node_selector,node_visible,filter_node_selector)
        if(child.length!=0){
          c.children=child
        }
        if(displayed_node_selector && !node_visible.includes(nn[0])){
          c.checked=0.5
        }
        children.push(c)
      }})
  return children
}

export const getNodeFromTree : getNodeFromTreeFType =(
  path:number[],tree:treeFolderType):{id:string,checked?:number}=>{

  if(tree.children && path.length>0){
    const index=path.shift()??-1
    const sub_tree=tree.children[index]
    return getNodeFromTree(path,sub_tree)
  }else{
    const id=tree.id,checked=tree.checked
    return {id,checked}
  }
}

export const check_node_has_node_type : check_node_has_node_typeFType =(
  n:SankeyNode,filter_node_selector:string[]
)=>{
  if(n.tags && n.tags['Type de noeud'] && n.tags['Type de noeud'].length>0 && filter_node_selector.length>0){
    return (filter_node_selector.includes(n.tags['Type de noeud'][0]))
  }else{
    return true
  }
}
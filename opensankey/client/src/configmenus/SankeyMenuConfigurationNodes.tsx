import React, { FunctionComponent, useState } from 'react'
import { ReactElementLike } from 'prop-types'
import { FaPlus, FaMinus, FaEye, FaEyeSlash } from 'react-icons/fa'
import { MultiSelect } from 'react-multi-select-component'

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
  AdditionalMenusType,
  applicationDataType,
} from '../types/LegacyType'
import { Type_MenuSelectionEntry } from '../topmenus/SankeyMenuTop'

/*************************************************************************************************/

import {
  OSTooltip
} from '../types/Utils'
import { SankeyMenuConfigurationNodesIO } from './SankeyMenuConfigurationNodesIO'
import { SankeyWrapperConfigInModalOrMenu } from './SankeyMenuConfigurationNodesAttributes'
import { SankeyMenuConfigurationNodesTags } from './SankeyMenuConfigurationNodesTags'
import { SankeyMenuConfigurationNodesTooltip } from './SankeyMenuConfigurationNodesTooltip'
import { Type_NodeElement } from '../types/Node'


/*************************************************************************************************/

type SankeyEditionTypes = {
  applicationData: applicationDataType,
  menu_configuration_nodes_attributes:JSX.Element,
  additionalMenus : AdditionalMenusType
}

/*************************************************************************************************/

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = (
  {
    applicationData,
    menu_configuration_nodes_attributes,
    additionalMenus
  }
) => {

  // Datas ------------------------------------------------------------------------------

  // Traduction
  const { t } = applicationData.new_data
  // Data class
  const { new_data } = applicationData

  // Nodes to select --------------------------------------------------------------------

  let nodes: Type_NodeElement[]
  let selected_nodes: Type_NodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    nodes = new_data.drawing_area.sankey.nodes_list_sorted
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    nodes = new_data.drawing_area.sankey.visible_nodes_list_sorted
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }
  const entries_for_nodes: Type_MenuSelectionEntry[] = nodes.map((d) => { return { 'label': d.name, 'value': d.id } })
  const entries_for_selected_nodes: Type_MenuSelectionEntry[] = selected_nodes.map((d) => { return { 'label': d.name, 'value': d.id } })

  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_config_nodes_selection_updater.current = ()=>setCount(a=>a+1)

  // Function used to reset menu UI -----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    setCount(a=>a+1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for link's configuration
    new_data.menu_configuration.updateAllComponentsRelatedToNodesConfig()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // JSX Components ---------------------------------------------------------------------

  const ui: { [s: string]: JSX.Element } = {
    'Noeud.tabs.apparence': <SankeyWrapperConfigInModalOrMenu
      menu_to_wrap={menu_configuration_nodes_attributes}
      for_modal={false}
      idTab={'node_attr'}
    />,
    'Noeud.tabs.infos': <SankeyMenuConfigurationNodesTooltip
      applicationData={applicationData}
      menu_for_modal={false}
    />,
    ...additionalMenus.additional_menu_configuration_nodes
  }

  if (new_data.drawing_area.sankey.node_taggs_list.length > 0 ) {
    ui['Noeud.tabs.tags'] = <SankeyMenuConfigurationNodesTags
      applicationData={applicationData}
      menu_for_modal={false}
    />
  }

  ui['Noeud.tabs.io'] = <SankeyMenuConfigurationNodesIO
    applicationData={applicationData}
    menu_for_modal={false}
  />

  // Object.assign(ui,additionalMenus.additional_menu_configuration_nodes)
  // ui={...ui,...additionalMenus.additional_menu_configuration_nodes}
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
            options={entries_for_nodes}
            value={entries_for_selected_nodes}
            labelledBy={t('Noeud.TS')}
            onChange={(entries: Type_MenuSelectionEntry[]) => {
              // Update selection list
              const entries_values = entries.map(d => d.value)
              nodes.forEach(n => {
                if (entries_values.includes(n.id)) {
                  new_data.drawing_area.addNodeToSelection(n)
                }
                else {
                  new_data.drawing_area.removeNodeFromSelection(n)
                }
              })
              // Update all menus
              refreshThisAndUpdateRelatedComponents()
            }}
            valueRenderer={(entries_for_selected_nodes: Type_MenuSelectionEntry[]) => {
              return entries_for_selected_nodes.length ? entries_for_selected_nodes.map(({ label }) => label + ', ') : t('Noeud.NS')
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
  //             // check or uncheck node in tree folder depending on if it's already entries_for_selected_nodes
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
        (!applicationData.new_data.has_free_account && new_data.drawing_area.sankey.nodes_list.length > 15) ?
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
            isDisabled={!applicationData.new_data.has_free_account && nodes.length > 15}
            onClick={() => {
              // Create default node
              const new_node = new_data.drawing_area.addNewDefaultNodeToSankey()
              // Add node to selection
              new_data.drawing_area.addNodeToSelection(new_node)
              // Update all menus
              refreshThisAndUpdateRelatedComponents()
            }}>
            <FaPlus />
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
            isDisabled={selected_nodes.length === 0}
            onClick={
              () => {
                // Delete all selected nodes
                applicationData.new_data.drawing_area.deleteSelectedNodes()
                // Update all menus
                refreshThisAndUpdateRelatedComponents()
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
                // Update indicator (only visible nodes / all nodes)
                new_data.menu_configuration.toggle_selector_on_visible_nodes()
              }}>
            {new_data.menu_configuration.is_selector_only_for_visible_nodes ? <FaEye /> : <FaEyeSlash />}
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
                  (selected_nodes.length != 1) ? '' : selected_nodes[0].name
                }
                onChange={evt => {
                  // Update selected nodes' name
                  if (selected_nodes.length != 1) {
                    return
                  }
                  selected_nodes[0].name = evt.target.value
                  // Refresh and toggle saving
                  refreshThisAndToggleSaving()
                }}
                isDisabled={(selected_nodes.length == 1) ? false : true}
              />
            </InputGroup>
          </OSTooltip>
        </Box>
      </Box>

      {/* Declenché si des neouds sont selectionnées */}
      {
        (selected_nodes.length !== 0) ?
          <Tabs>
            <TabList>
              {
                Object
                  .keys(ui)
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
                  .values(ui)
                  .map((c: ReactElementLike) => {
                    return c
                  })
              }
            </TabPanels>
          </Tabs> :
          <></>
      }
    </Box>
  )
}

export default SankeyNodeEdition

// export const tree_data_nodes : tree_data_nodesFType =(
//   t:TFunction<'translation', undefined>,
//   data:SankeyData,
//   multi_selected_nodes:{current:SankeyNode[]},
//   node_visible:string[],
//   filter_node_selector:string[]
// )=>{

//   const root_checked=(Object.values(data.nodes).filter(n=>(data.displayed_node_selector?node_visible.includes(n.idNode):true) && check_node_has_node_type(n,filter_node_selector)).map(n=>n).length===multi_selected_nodes.current.length)?1:0
//   const tree:treeFolderType={id:'root',name:t('Noeud.TS'),children:[],checked:root_checked}
//   Object.values(data.nodes).filter(n=>check_node_has_no_valid_dimensions(n) && check_node_has_node_type(n,filter_node_selector)).forEach(n=>{
//     const sub_tree={id:n.idNode,name:n.name,checked:multi_selected_nodes.current.includes(n)?1:0} as treeFolderType

//     if(data.displayed_node_selector && !node_visible.includes(n.idNode)){
//       sub_tree.checked=0.5
//     }
//     tree.children?tree.children.push(sub_tree):tree.children=[sub_tree]})

//   tree.children?.forEach(t=>{
//     const child_t=add_children(data.nodes,data.nodes[t.id],multi_selected_nodes,data.displayed_node_selector,node_visible,filter_node_selector)
//     if(child_t.length>0){
//       t.children=child_t
//     }
//   })
//   return tree
// }

// const check_node_has_no_valid_dimensions=(n:SankeyNode)=>{
//   if(!n.dimensions){
//     return true
//   }
//   let invalid=true
//   Object.entries(n.dimensions).filter(nd=>nd[0]==='Primaire').forEach(value_dim=>{
//     if(value_dim[1].parent_name!==undefined){
//       invalid=false
//     }

//   })
//   return invalid
// }

// export const add_children : add_childrenFType =(
//   nodes:{[x:string]:SankeyNode},n:SankeyNode,
//   multi_selected_nodes:{current:SankeyNode[]},
//   displayed_node_selector:boolean,
//   node_visible:string[],filter_node_selector:string[]
// )=> {
//   const children:treeFolderType[]=[]
//   Object.entries(nodes)
//     .filter(nd=> check_node_has_node_type(nd[1] as SankeyNode,filter_node_selector))
//     .forEach(nn=>{
//       if(nn[1].dimensions['Primaire'].parent_name===n.idNode ) {
//         const c:treeFolderType={id:nn[0],name:nn[1].name,checked:multi_selected_nodes.current.includes(nn[1])?1:0}
//         const child=add_children(nodes,nn[1],multi_selected_nodes,displayed_node_selector,node_visible,filter_node_selector)
//         if(child.length!=0){
//           c.children=child
//         }
//         if(displayed_node_selector && !node_visible.includes(nn[0])){
//           c.checked=0.5
//         }
//         children.push(c)
//       }})
//   return children
// }

// export const getNodeFromTree : getNodeFromTreeFType =(
//   path:number[],tree:treeFolderType):{id:string,checked?:number}=>{

//   if(tree.children && path.length>0){
//     const index=path.shift()??-1
//     const sub_tree=tree.children[index]
//     return getNodeFromTree(path,sub_tree)
//   }else{
//     const id=tree.id,checked=tree.checked
//     return {id,checked}
//   }
// }

// export const check_node_has_node_type : check_node_has_node_typeFType =(
//   n:SankeyNode,filter_node_selector:string[]
// )=>{
//   if(n.tags && n.tags['Type de noeud'] && n.tags['Type de noeud'].length>0 && filter_node_selector.length>0){
//     return (filter_node_selector.includes(n.tags['Type de noeud'][0]))
//   }else{
//     return true
//   }
// }
// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { FC, useRef, useState } from 'react'

import {
  Box,
  Button
} from '@chakra-ui/react'

import { ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { OSMultiSelect, typeElementSelectable } from './MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import { OSTooltip } from './MenuCommon'


/*************************************************************************************************/

type FCType_SankeyNodeEdition = {
  new_data: Class_ApplicationData,
}

/*************************************************************************************************/

export const SankeyNodeSelection: FC<FCType_SankeyNodeEdition> = (
  {
    new_data,
  }
) => {

  // Datas ------------------------------------------------------------------------------

  // Traduction
  const { t, icon_library } = new_data
  const { icon_add_element, icon_remove_element, icon_element_visible, icon_element_invisible } = icon_library
  // Nodes to select --------------------------------------------------------------------

  let nodes: Class_NodeElement[]
  let selected_nodes: Class_NodeElement[]
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
  const entries_for_nodes: typeElementSelectable = nodes.map((d) => { return { 'label': d.name, 'value': d.id, selected: selected_nodes.includes(d) } })
  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  // Link this menu's update function to ref
  new_data.menu_configuration.ref_to_menu_config_nodes_selection_updater.current = () => {
    const value_to_show = (new_data.drawing_area.selected_nodes_list.length != 1) ? '' : new_data.drawing_area.selected_nodes_list[0].name
    // Update text input of node name
    ref_set_text_value_input.current(String(value_to_show))
    setCount(a => a + 1)
  }

  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Function used to reset menu UI -----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    ref_set_text_value_input.current(String((selected_nodes.length != 1) ? '' : selected_nodes[0].name))

    // Refresh this menu
    setCount(a => a + 1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for node's configuration
    new_data.menu_configuration.updateAllComponentsRelatedToNodesConfig()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // JSX Components ---------------------------------------------------------------------

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


  // Funcion undo =========================

  /**
   * Create a node & save it's undo in history
   *
   */
  const addNode = () => {
    let new_node: Class_NodeElement

    const _addNode = () => {
      // Create default node
      new_node = new_data.drawing_area.addNewDefaultNodeToSankey()
      //Deselect previously selected nodes
      new_data.drawing_area.purgeSelectionOfNode()
      // Add node to selection
      new_data.drawing_area.addNodeToSelection(new_node)
      // Update all menus
      refreshThisAndUpdateRelatedComponents()
    }

    const inv_addNode = () => {
      new_data.drawing_area.deleteNode(new_node)
      refreshThisAndUpdateRelatedComponents()
    }

    // Save undo/redo in history
    new_data.drawing_area.application_data.history.saveUndo(inv_addNode)
    new_data.drawing_area.application_data.history.saveRedo(_addNode)
    // Execute original function
    _addNode()
  }

  /**
   * Method to mutate node name & save it's undoing in data history
   *
   * @param {(number | null | undefined)} _
   */
  const updateNameNode = (_: string | null | undefined) => {
    if (_ == undefined || _ == null)
      return
    // Save old values in dict so the undo reset value for previous value of each node
    const old_val = selected_nodes[0].name
    // Undo node name

    const inv_updateNameNode = () => {
      // Update selected nodes' name
      if (selected_nodes.length != 1) {
        return
      }
      selected_nodes[0].name = old_val
      // Refresh and toggle saving
      refreshThisAndToggleSaving()
    }

    // Mutate node name
    const _updateNameNode = () => {
      // Update selected nodes' name
      if (selected_nodes.length != 1) {
        return
      }
      selected_nodes[0].name = _
      // Refresh and toggle saving
      refreshThisAndToggleSaving()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateNameNode)
    new_data.history.saveRedo(_updateNameNode)
    // Execute original attr mutation
    _updateNameNode()
  }

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_droplist'
        className='row_select'
      >
        {/* Boutton pour ajouter un noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.plus')}>
          <Button
            variant='menuconfigpanel_add_button'
            size='sizeConfigButton'
            onClick={addNode}>
            {icon_add_element}
          </Button>
        </OSTooltip>

        {/* Liste déroulante pour selectionner un noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.slct')}>
          <OSMultiSelect
            t={new_data.t}
            elements={entries_for_nodes}
            onClick={(entries: typeElementSelectable) => {
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
          />
        </OSTooltip>

        {/* Boutton pour supprimer le noeud selectionné */}
        <OSTooltip label={t('Menu.tooltips.noeud.rm')}>
          <Button
            variant='menuconfigpanel_del_button'
            size='sizeConfigButton'
            isDisabled={selected_nodes.length === 0}
            onClick={
              () => {
                // Delete all selected nodes
                new_data.drawing_area.deleteSelectedNodes()
                // Update all menus
                refreshThisAndUpdateRelatedComponents()
              }}>
            {icon_remove_element}
          </Button>
        </OSTooltip>

        {/* Checkbox permettant d'afficher que les noeuds visibles dans le selecteur */}
        <OSTooltip label={t('Menu.tooltips.noeud.dns')}>
          <Button
            variant='menuconfigpanel_option_button'
            size='sizeConfigButton'
            onClick={
              () => {
                // Update indicator (only visible nodes / all nodes)
                new_data.menu_configuration.toggle_selector_on_visible_nodes()
              }}>
            {new_data.menu_configuration.is_selector_only_for_visible_nodes ? icon_element_visible : icon_element_invisible}
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
            <ConfigMenuTextInput
              default_value={(selected_nodes.length != 1) ? '' : selected_nodes[0].name}
              function_on_blur={updateNameNode}
              disabled={new_data.drawing_area.selected_nodes_list.length !== 1}
            />
          </OSTooltip>
        </Box>
      </Box>
    </Box>
  )
}

export const SankeyNodeSelectionSimple: FC<FCType_SankeyNodeEdition> = (
  {
    new_data,
  }
) => {

  // Datas ------------------------------------------------------------------------------

  // Traduction
  const { t, icon_library } = new_data
  const { icon_element_visible, icon_element_invisible } = icon_library

  // Nodes to select --------------------------------------------------------------------

  let nodes: Class_NodeElement[]
  let selected_nodes: Class_NodeElement[]
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
  const entries_for_nodes: typeElementSelectable = nodes.map((d) => { return { 'label': d.name, 'value': d.id, selected: selected_nodes.includes(d) } })

  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  // Link this menu's update function to ref
  new_data.menu_configuration.ref_to_menu_config_nodes_selection_updater.current = () => {
    const value_to_show = (new_data.drawing_area.selected_nodes_list.length != 1) ? '' : new_data.drawing_area.selected_nodes_list[0].name
    // Update text input of node name
    ref_set_text_value_input.current(String(value_to_show))
    setCount(a => a + 1)
  }

  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Function used to reset menu UI -----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    ref_set_text_value_input.current(String((selected_nodes.length != 1) ? '' : selected_nodes[0].name))

    // Refresh this menu
    setCount(a => a + 1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for node's configuration
    new_data.menu_configuration.updateAllComponentsRelatedToNodesConfig()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // JSX Components ---------------------------------------------------------------------
  const new_select = <OSMultiSelect
    t={new_data.t}
    elements={entries_for_nodes}
    onClick={(entries: typeElementSelectable) => {
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
  />

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box
        as='span'
        className='row_select'
        layerStyle='menuconfigpanel_row_droplist_simple'
      >

        {/* Liste déroulante pour selectionner un noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.slct')}>
          {/* {dropdownMultiNode()} */}
          {new_select}
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
            {new_data.menu_configuration.is_selector_only_for_visible_nodes ? icon_element_visible : icon_element_invisible}
          </Button>
        </OSTooltip>
      </Box>
    </Box>
  )
}


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
//   if(n.tags && n.tags['type de noeud'] && n.tags['type de noeud'].length>0 && filter_node_selector.length>0){
//     return (filter_node_selector.includes(n.tags['type de noeud'][0]))
//   }else{
//     return true
//   }
// }
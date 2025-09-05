import React, { FC, useRef, useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'

import {
  Box,
  Button
} from '@chakra-ui/react'

import { ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { OSTooltip } from './MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'

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

  // Préparation des options pour MultiSelect
  const INITIAL_OPTIONS = nodes.map((d) => { 
    return { 'label': d.name, 'value': d.id } 
  })

  const selected_for_multiselect = selected_nodes.map((d) => { 
    return { 'label': d.name, 'value': d.id } 
  })

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

  // MultiSelect dropdown component ----------------------------------------------------
  const dropdownMultiNode = () => {
    return (
      <Box
        layerStyle='submenuconfig_droplist'
      >
        {/* Position custom pour MultiSelect */}
        <Box
        >
          <MultiSelect
            options={INITIAL_OPTIONS}
            value={selected_for_multiselect}
            labelledBy={t('Noeud.TS')}
            onChange={(selected: [{ label: string, value: string }]) => {
              const new_sel = selected.map(d => d.value)
              
              // Mise à jour de la sélection
              nodes.forEach(n => {
                if (new_sel.includes(n.id)) {
                  new_data.drawing_area.addNodeToSelection(n)
                } else {
                  new_data.drawing_area.removeNodeFromSelection(n)
                }
              })

              // Update all menus
              refreshThisAndUpdateRelatedComponents()
            }}
            valueRenderer={(selected: { label: string, value: string }[]) => {
              return selected.length ? selected.map(({ label }) => label + ', ') : t('Noeud.NS')
            }}
          />
        </Box>
      </Box>
    )
  }

  // Funcion undo =========================

  /**
   * Create a node & save it's undo in history
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
          {dropdownMultiNode()}
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

  // Préparation des options pour MultiSelect
  const INITIAL_OPTIONS = nodes.map((d) => { 
    return { 'label': d.name, 'value': d.id } 
  })

  const selected_for_multiselect = selected_nodes.map((d) => { 
    return { 'label': d.name, 'value': d.id } 
  })

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

  // MultiSelect dropdown component pour version simple ------------------------------------
  const dropdownMultiNodeSimple = () => {
    return (
      <Box
        layerStyle='submenuconfig_droplist'
      >
        <Box
          height='2rem'
          width='14.75rem'
        >
          <MultiSelect
            options={INITIAL_OPTIONS}
            value={selected_for_multiselect}
            labelledBy={t('Noeud.TS')}
            onChange={(selected: [{ label: string, value: string }]) => {
              const new_sel = selected.map(d => d.value)
              
              // Mise à jour de la sélection
              nodes.forEach(n => {
                if (new_sel.includes(n.id)) {
                  new_data.drawing_area.addNodeToSelection(n)
                } else {
                  new_data.drawing_area.removeNodeFromSelection(n)
                }
              })

              // Update all menus
              refreshThisAndUpdateRelatedComponents()
            }}
            valueRenderer={(selected: { label: string, value: string }[]) => {
              return selected.length ? selected.map(({ label }) => label + ', ') : t('Noeud.NS')
            }}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box
        as='span'
        className='row_select'
        layerStyle='menuconfigpanel_row_droplist_simple'
      >

        {/* Liste déroulante pour selectionner un noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.slct')}>
          {dropdownMultiNodeSimple()}
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
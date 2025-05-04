// External imports
import React, { FunctionComponent, useState, useRef } from 'react'
import {
  Box,
  Checkbox,
  Button
} from '@chakra-ui/react'

// Local types
import type { Class_LevelTagGroup} from '../../deps/OpenSankey/types/Tag'
import type { Type_GenericApplicationData, Type_GenericNodeElement } from '../../deps/OpenSankey/types/Types'

import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { OSMultiSelect, typeElementSelectable, WrapperBoxSubSectionMenu } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { Type_GenericApplicationDataOSP } from '../../types/TypesOSP'
import { Class_NodeDimension } from '../../deps/OpenSankey/Elements/NodeDimension'

type FCType_SankeyLevelEdition = {
  new_data: Type_GenericApplicationData,
}

// Component definition =================================================================
export const SankeyLevelSelectionSimple: FunctionComponent<FCType_SankeyLevelEdition> = (
  {
    new_data,
  }
) => {

  // Datas ------------------------------------------------------------------------------

  // Traduction
  const { t, icon_library } = new_data
  const { icon_element_visible, icon_element_invisible } = icon_library

  // Nodes to select --------------------------------------------------------------------

  let nodes: Type_GenericNodeElement[]
  let selected_nodes: Type_GenericNodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    nodes = new_data.drawing_area.sankey.nodes_list_sorted
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted.filter(n=>n.dimensions_as_parent.length> 0)
  }
  else {
    // Only visible nodes
    nodes = new_data.drawing_area.sankey.visible_nodes_list_sorted
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted.filter(n=>n.dimensions_as_parent.length> 0)
  }
  let nodes_dimensions: Class_NodeDimension[] =[]
  nodes.forEach(n=>n.dimensions_as_parent.forEach(dim=>nodes_dimensions.push(dim)))

  let selected_nodes_dimensions: Class_NodeDimension[] =[]
  selected_nodes.forEach(n=>n.dimensions_as_parent.forEach(dim=>selected_nodes_dimensions.push(dim)))

  const entries_for_nodes: typeElementSelectable = nodes_dimensions.map((d) => { 
    return { 
      'value': d.id, 
      'label': d.parent.name + '->(' + d.children.map(c=>c.name+' ')+')', selected: selected_nodes_dimensions.includes(d) 
    } }
  )

  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  // Link this menu's update function to ref
  new_data.menu_configuration.ref_to_menu_config_nodes_dim_selection_updater.current = () => {
    const value_to_show = (new_data.drawing_area.selected_nodes_list.filter(n=>n.dimensions_as_parent.length> 0).length != 1) ? '' : new_data.drawing_area.selected_nodes_list.filter(n=>n.dimensions_as_parent.length> 0)[0].name
    // Update text input of node name
    //ref_set_text_value_input.current(String(value_to_show))
    setCount(a => a + 1)
  }

  //const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Function used to reset menu UI -----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    //ref_set_text_value_input.current(String((selected_nodes_dimensions.length != 1) ? '' : selected_nodes_dimensions[0].id))

    // Refresh this menu
    setCount(a => a + 1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Update values displayed in menus for node's configuration
    new_data.menu_configuration.updateComponentRelatedToNodesDimTags()
    // Update and update saving indicator
    refreshThisAndToggleSaving()
  }

  // JSX Components ---------------------------------------------------------------------
  const new_select = <OSMultiSelect
    t={new_data.t}
    elements={entries_for_nodes}
    onClick={(entries: typeElementSelectable) => {
      // Update selection list
      selected_nodes.forEach(n=>new_data.drawing_area.removeNodeFromSelection(n))
      const entries_values = entries.map(d => d.value)
      const selected_nodes_set = new Set<Type_GenericNodeElement>()
      nodes_dimensions.forEach(dim => {
        if (entries_values.includes(dim.id)) {
          selected_nodes_set.add(dim.parent as Type_GenericNodeElement)
        }
      });
      [...selected_nodes_set].forEach(n => {
          new_data.drawing_area.addNodeToSelection(n as Type_GenericNodeElement)
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

        {/* Liste déroulante pour selectionner une hiérarchie de noeud */}
        <OSTooltip label={t('Menu.tooltips.noeud.slct')}>
          {/* {dropdownMultiNode()} */}
          {new_select}
        </OSTooltip>

        {/* Checkbox permettant d'afficher que les hiérarchies des noeuds visibles dans le selecteur */}
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

type FCType_SankeyMenuConfigurationLevelTags = {
  new_data: Type_GenericApplicationDataOSP,
}

/**
 * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
 * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
 * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
 *
 * @type {*}
 */
export const SankeyMenuConfigurationLevelTags: FunctionComponent<FCType_SankeyMenuConfigurationLevelTags> = ({
  new_data,
}) => {

  // Data ------------------------------------------------------------------------------

  const { t } = new_data

  // Node tags groups ------------------------------------------------------------------

  const list_level_taggs = new_data.drawing_area.sankey.level_taggs_list
  const has_level_taggs = list_level_taggs.length > 0
  const [level_tagg_entry_index, setNodeTaggEntryIndex] = useState(0)
  //const level_tagg_entry = list_level_taggs[level_tagg_entry_index]

  // Selected nodes ---------------------------------------------------------------------

  let selected_nodes: Type_GenericNodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted.filter(n=>n.dimensions_as_parent.length> 0)
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted.filter(n=>n.dimensions_as_parent.length> 0)
  }
  let selected_nodes_dimensions: Class_NodeDimension[] =[]
  selected_nodes.forEach(n=>n.dimensions_as_parent.forEach(dim=>selected_nodes_dimensions.push(dim)))

  // Menu updaters ----------------------------------------------------------------------

  const [, setCount] = useState(0)
  const updateThis = () => {
    // Can just use simple refresh if level_tagg entry exists
    if (new_data.drawing_area.sankey.level_taggs_list[level_tagg_entry_index])
      setCount(a => a + 1)
    // If not, reset entry index
    else
      setNodeTaggEntryIndex(0)
    setCount(a => a + 1)

  }
  new_data.menu_configuration.ref_to_menu_config_nodes_dim_tags_updater.current = updateThis


  // Utils functions --------------------------------------------------------------------

  /**
   * Check if all selected nodes are related to the given tag
   * @param {Class_Tag} tag
   * @return [allTrue: boolean, allFalse: boolean]
   */
  const haveAllSelectedLevelGivenTag = (
    tagg: Class_LevelTagGroup
  ) => {
    if (selected_nodes_dimensions.length == 0) {
      return [false, true]
    }
    let allTrue = true
    let allFalse = true
    selected_nodes_dimensions
      .forEach(node_dim => {
        const test = node_dim.parent_level_tag.group == tagg
        allTrue = allTrue && (test === true)
        allFalse = allFalse && (test === false)
      })
    return [allTrue, allFalse]
  }

  // JSX content ------------------------------------------------------------------------

  // Return nothing if there is no tag or no nodes are selected
  // if (!has_level_taggs || selected_nodes.length==0)
  //   return <></>
  if (!has_level_taggs)
    return <></>

  const content = <>
    <Box layerStyle='menuconfigpanel_grid' >
    <SankeyLevelSelectionSimple new_data={new_data} />
      {<Box
        layerStyle='menuconfigpanel_grid'
      >
        {
          list_level_taggs
            .map(level_tagg => {
              const [allTrue, allFalse] = haveAllSelectedLevelGivenTag(level_tagg)
              return <Checkbox
                isDisabled={!new_data.has_sankey_plus}
                variant='menuconfigpanel_tag_checkbox'
                isIndeterminate={
                  (selected_nodes_dimensions.length > 1) &&
                  (!allTrue) &&
                  (!allFalse)
                }
                isChecked={allTrue}
                onChange={(evt) => {
                  const visible = evt.target.checked
                  if (visible) {
                    selected_nodes_dimensions.forEach(dim=>{
                      const new_parent_level_tag = level_tagg.tags_list[0]
                      const new_child_level_tag = level_tagg.tags_list[1]
                      dim.children.forEach(c=>new_parent_level_tag.getOrCreateLowerDimension(dim.parent,c,new_child_level_tag))
                      dim.delete()
                    })
                    updateThis()
                  }
                  //new_data.drawing_area.updateSelectedLevelTagAssignation(visible, level_tag)
                }}
              >
                {level_tagg.name}
              </Checkbox>
            })
        }
      </Box>}
    </Box>
  </>

  return <WrapperBoxSubSectionMenu new_data={new_data} title={t('Menu.level_associated_tag')}>
    <OSTooltip label={new_data.has_sankey_plus ? '' : t('Menu.sankeyOSPDisabled')}>
      {content}
    </OSTooltip>
  </WrapperBoxSubSectionMenu>
}

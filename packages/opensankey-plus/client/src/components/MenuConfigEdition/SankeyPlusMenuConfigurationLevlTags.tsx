// External imports
import React, { FunctionComponent, useState, useRef } from 'react'
import {
  Box,
  Checkbox,
  Select,
  Button
} from '@chakra-ui/react'

// Local types
import type { Class_LevelTag, Class_Tag } from '../../deps/OpenSankey/types/Tag'
import type { Type_GenericApplicationData, Type_GenericNodeElement } from '../../deps/OpenSankey/types/Types'
// import type {
//   FCType_SankeyMenuConfigurationLevelTags
// } from './types/SankeyMenuConfigurationLevelTagsTypes'
import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
//import { SankeyNodeSelectionSimple } from '../../deps/OpenSankey/components/configmenus/SankeyMenuConfigurationNodes'
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

  // let nodes: Type_GenericNodeElement[]
  // let selected_nodes: Type_GenericNodeElement[]
  // if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
  //   // All availables nodes
  //   nodes = new_data.drawing_area.sankey.nodes_list_sorted
  //   selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  // }
  // else {
  //   // Only visible nodes
  //   nodes = new_data.drawing_area.sankey.visible_nodes_list_sorted
  //   selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  // }
  let selected_nodes: Class_NodeDimension[] =[]
  //if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
  // All availables nodes
  new_data.drawing_area.sankey.nodes_list.filter(n=>n.dimensions_as_parent.length> 0).forEach(n=>n.dimensions_as_parent.forEach(dim=>selected_nodes.push(dim)))

  const entries_for_nodes: typeElementSelectable = selected_nodes.map((d) => { return { 'label': d.id, 'value': d.id, selected: selected_nodes.includes(d) } })

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
    ref_set_text_value_input.current(String((selected_nodes.length != 1) ? '' : selected_nodes[0].id))

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
      // selected_nodes.forEach(n => {
      //   if (entries_values.includes(n.id)) {
      //     new_data.drawing_area.addNodeToSelection(n)
      //   }
      //   else {
      //     new_data.drawing_area.removeNodeFromSelection(n)
      //   }
      // })
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
  const level_tagg_entry = list_level_taggs[level_tagg_entry_index]

  // Selected nodes ---------------------------------------------------------------------

  let selected_nodes: Class_NodeDimension[] =[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    new_data.drawing_area.sankey.nodes_list.filter(n=>n.dimensions_as_parent.length> 0).forEach(n=>n.dimensions_as_parent.forEach(dim=>selected_nodes.push(dim)))
  }
  else {
    // Only visible nodes
    //selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sortednode.hasGivenTag(tag)
  }

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
  //new_data.menu_configuration.ref_to_menu_config_level_tags_updater.current = updateThis


  // Utils functions --------------------------------------------------------------------

  /**
   * Check if all selected nodes are related to the given tag
   * @param {Class_Tag} tag
   * @return [allTrue: boolean, allFalse: boolean]
   */
  const haveAllSelectedLevelGivenTag = (
    tag: Class_LevelTag
  ) => {
    let allTrue = true
    let allFalse = true
    // selected_nodes
    //   .forEach(node => {
    //     const test = true//node.hasGivenTag(tag)
    //     allTrue = allTrue && (test === true)
    //     allFalse = allFalse && (test === false)
    //   })
    return [allTrue, allFalse]
  }

  // JSX content ------------------------------------------------------------------------

  // Return nothing if there is no tag or no nodes are selected
  // if (!has_level_taggs || selected_nodes.length==0)
  //   return <></>

  const content = <>
    {/* <Box
      as='span'
      layerStyle='menu_sub_section_title'>
      {t('Menu.level_associated_tag')}
    </Box> */}
    <Box layerStyle='menuconfigpanel_grid' >
      {/* Groupe d'étiquettes  */}
      <Select
        isDisabled={!new_data.has_sankey_plus}
        variant='menuconfigpanel_option_select'
        value={level_tagg_entry_index}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
          setNodeTaggEntryIndex(Number(evt.target.value))
        }
      >
        {
          list_level_taggs
            .map((level_tagg, level_tagg_index) =>
              <option
                key={level_tagg.id}
                value={level_tagg_index}
              >
                {level_tagg.name}
              </option>
            )
        }
      </Select>
      {/* {has_level_taggs ? <Box
        layerStyle='menuconfigpanel_grid'
      >
        {
          level_tagg_entry.tags_list
            .map(level_tag => {
              const [allTrue, allFalse] = haveAllSelectedLevelGivenTag(level_tag)
              return <Checkbox
                isDisabled={!new_data.has_sankey_plus}
                variant='menuconfigpanel_tag_checkbox'
                isIndeterminate={
                  (selected_nodes.length > 1) &&
                  (!allTrue) &&
                  (!allFalse)
                }
                isChecked={allTrue}
                onChange={(evt) => {
                  const visible = evt.target.checked
                  //new_data.drawing_area.updateSelectedLevelTagAssignation(visible, level_tag)
                }}
              >
                {level_tag.name}
              </Checkbox>
            })
        }
      </Box> : <></>} */}
    </Box>
    <SankeyLevelSelectionSimple new_data={new_data} />
  </>
  return <WrapperBoxSubSectionMenu new_data={new_data} title={t('Menu.level_associated_tag')}>
    <OSTooltip label={new_data.has_sankey_plus ? '' : t('Menu.sankeyOSPDisabled')}>
      {content}
    </OSTooltip>
  </WrapperBoxSubSectionMenu>
}

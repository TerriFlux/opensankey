// External imports
import React, { FunctionComponent, useState, useRef } from 'react'
import {
  Box,
  Checkbox,
  Button
} from '@chakra-ui/react'

// Local types
import type { Class_LevelTag, Class_LevelTagGroup} from '../../deps/OpenSankey/types/Tag'
import type { Type_GenericApplicationData, Type_GenericNodeElement } from '../../deps/OpenSankey/types/Types'

import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { OSMultiSelect, typeElementSelectable, WrapperBoxSubSectionMenu } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { Type_GenericApplicationDataOSP, Type_GenericNodeElementOSP } from '../../types/TypesOSP'
import { Class_NodeDimension } from '../../deps/OpenSankey/Elements/NodeDimension'


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
  const { t, icon_library,drawing_area } = new_data
  const {sankey} = drawing_area
  const { icon_element_visible, icon_element_invisible } = icon_library

  // Nodes to select --------------------------------------------------------------------

  let nodes: Type_GenericNodeElementOSP[]
  let selected_nodes: Type_GenericNodeElementOSP[]
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

  const [selectedNodesDimensions,setSelectedNodesDimensions] = useState<Class_NodeDimension[]>([])
  //selected_nodes.forEach(n=>n.dimensions_as_parent.forEach(dim=>selected_nodes_dimensions.push(dim)))

  const entries_for_nodes: typeElementSelectable = nodes_dimensions.map((d) => { 
    return { 
      'value': d.short_name,
      'label':  d.short_name, 
      selected: selectedNodesDimensions.includes(d) 
    } }
  )

  // Node tags groups ------------------------------------------------------------------

  const list_level_taggs = new_data.drawing_area.sankey.level_taggs_list
  const has_level_taggs = list_level_taggs.length > 0
  const [level_tagg_entry_index, setNodeTaggEntryIndex] = useState(0)
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
    if (selectedNodesDimensions.length == 0) {
      return [false, true]
    }
    let allTrue = true
    let allFalse = true
    selectedNodesDimensions
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
      <Box layerStyle='menuconfigpanel_grid'>
        <Box
          as='span'
          className='row_select'
          layerStyle='menuconfigpanel_row_droplist_simple'
        >

          {/* Liste déroulante pour selectionner une hiérarchie de noeud */}
          <OSTooltip label={t('Menu.tooltips.noeud.slct')}>
            {/* {dropdownMultiNode()} */}
            <OSMultiSelect
              t={new_data.t}
              elements={entries_for_nodes}
              onClick={(entries: typeElementSelectable) => {
                // Update selection list
                selected_nodes.forEach(n => new_data.drawing_area.removeNodeFromSelection(n))
                const entries_values = entries.map(d => d.value)
                const selected_nodes_set = new Set<Type_GenericNodeElement>()
                const selected_nodes_dimensions = nodes_dimensions.filter(dim => {
                  if (entries_values.includes(dim.short_name)) {
                    return true
                  }
                  return false
                })
                setSelectedNodesDimensions(selected_nodes_dimensions)
                nodes_dimensions.forEach(dim => {
                  if (entries_values.includes(dim.short_name)) {
                    selected_nodes_set.add(dim.parent as Type_GenericNodeElement)
                  }
                });
                [...selected_nodes_set].forEach(n => {
                  new_data.drawing_area.addNodeToSelection(n as Type_GenericNodeElementOSP)
                })
                // Update all menus
                updateThis()
              }}
            />
          </OSTooltip>

          {/* Checkbox permettant d'afficher que les hiérarchies des noeuds visibles dans le selecteur */}
          <OSTooltip label={t('Menu.tooltips.noeud.dns')}>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={
                () => {
                  // Update indicator (only visible nodes / all nodes)
                  new_data.menu_configuration.toggle_selector_on_visible_nodes()
                  // Update all menus
                  updateThis()
                }}>
              {new_data.menu_configuration.is_selector_only_for_visible_nodes ? icon_element_visible : icon_element_invisible}

            </Button>
          </OSTooltip>
        </Box>
      </Box>
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
                  (selectedNodesDimensions.length > 1) &&
                  (!allTrue) &&
                  (!allFalse)
                }
                isChecked={allTrue}
                onChange={(evt) => {
                  const visible = evt.target.checked
                  if (visible) {
                    const new_selected_nodes_dimensions : Class_NodeDimension[] = []
                    selectedNodesDimensions.forEach(dim => {
                      let new_parent_level_tag = level_tagg.tags_list[0]
                      let new_child_level_tag = level_tagg.tags_list[1]
                      const new_parent_dim = dim.parent.nodeDimensionAsChild(level_tagg)
                      if (new_parent_dim) {
                        new_parent_level_tag = new_parent_dim.child_level_tag as Class_LevelTag
                        const idx = level_tagg.tags_list.indexOf(new_parent_level_tag)
                        new_child_level_tag = level_tagg.tags_list[idx+1]
                      }
                      const children_id = dim.children.filter(c=>c!=dim.parent).map(n=>n.id)
                      const parent_id = dim.parent.id
                      dim.delete()
                      nodes_dimensions = nodes_dimensions.filter(d=>d!=dim)
                      children_id.forEach(cid => {
                        const new_dim = new_parent_level_tag.getOrCreateLowerDimension(
                          sankey.nodes_dict[parent_id], sankey.nodes_dict[cid], new_child_level_tag
                        )
                        if (new_dim.children.includes(new_dim.parent)) {
                          new_dim.removeNodeFromChildren(new_dim.parent)
                        }
                        if (!new_selected_nodes_dimensions.includes(new_dim)) {
                          new_selected_nodes_dimensions.push(new_dim)
                        }
                      }
                      )
                    })
                    nodes_dimensions.forEach(dim=>{
                      dim.normalize()
                    })
                    setSelectedNodesDimensions(new_selected_nodes_dimensions)
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

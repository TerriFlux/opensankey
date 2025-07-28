// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  Box,
  Checkbox,
  Select,
} from '@chakra-ui/react'

// Local types
import type { Class_Tag } from '../../deps/OpenSankey/types/Tag'
import type {
  FCType_SankeyMenuConfigurationNodesTags
} from './types/SankeyMenuConfigurationNodesTagsTypes'
import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { SankeyNodeSelectionSimple } from '../../deps/OpenSankey/components/configmenus/SankeyMenuConfigurationNodes'
import { WrapperBoxSubSectionMenu } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { Class_NodeElement } from '../../deps/OpenSankey/Elements/Node'

// Component definition =================================================================

/**
 * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
 * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
 * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
 *
 * @type {*}
 */
export const SankeyMenuConfigurationNodesTags: FunctionComponent<FCType_SankeyMenuConfigurationNodesTags> = ({
  new_data,
}) => {

  // Data ------------------------------------------------------------------------------

  const { t } = new_data

  // Node tags groups ------------------------------------------------------------------

  const list_node_taggs = new_data.drawing_area.sankey.node_taggs_list
  const has_node_taggs = list_node_taggs.length > 0
  const [node_tagg_entry_index, setNodeTaggEntryIndex] = useState(0)
  const node_tagg_entry = list_node_taggs[node_tagg_entry_index]

  // Selected nodes ---------------------------------------------------------------------

  let selected_nodes: Class_NodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Menu updaters ----------------------------------------------------------------------

  const [, setCount] = useState(0)
  const updateThis = () => {
    // Can just use simple refresh if node_tagg entry exists
    if (new_data.drawing_area.sankey.node_taggs_list[node_tagg_entry_index])
      setCount(a => a + 1)
    // If not, reset entry index
    else
      setNodeTaggEntryIndex(0)
    setCount(a => a + 1)

  }
  new_data.menu_configuration.ref_to_menu_config_nodes_tags_updater.current = updateThis


  // Utils functions --------------------------------------------------------------------

  /**
   * Check if all selected nodes are related to the given tag
   * @param {Class_Tag} tag
   * @return [allTrue: boolean, allFalse: boolean]
   */
  const haveAllSelectedNodesGivenTag = (
    tag: Class_Tag
  ) => {
    let allTrue = true
    let allFalse = true
    selected_nodes
      .forEach(node => {
        const test = node.hasGivenTag(tag)
        allTrue = allTrue && (test === true)
        allFalse = allFalse && (test === false)
      })
    return [allTrue, allFalse]
  }

  // JSX content ------------------------------------------------------------------------

  // Return nothing if there is no tag or no nodes are selected
  if (!has_node_taggs || selected_nodes.length==0)
    return <></>

  const content = <>
    <Box
      as='span'
      layerStyle='menu_sub_section_title'>
      {t('Menu.node_associated_tag')}
    </Box>
    <SankeyNodeSelectionSimple new_data={new_data} />
    <Box layerStyle='menuconfigpanel_grid' >
      {/* Groupe d'étiquettes  */}
      <Select
        isDisabled={!new_data.has_sankey_plus}
        variant='menuconfigpanel_option_select'
        value={node_tagg_entry_index}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
          setNodeTaggEntryIndex(Number(evt.target.value))
        }
      >
        {
          list_node_taggs
            .map((node_tagg, node_tagg_index) =>
              <option
                key={node_tagg.id}
                value={node_tagg_index}
              >
                {node_tagg.name}
              </option>
            )
        }
      </Select>
      {has_node_taggs ? <Box
        layerStyle='menuconfigpanel_grid'
      >
        {
          node_tagg_entry.tags_list
            .map(node_tag => {
              const [allTrue, allFalse] = haveAllSelectedNodesGivenTag(node_tag)
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
                  new_data.drawing_area.updateSelectedNodesTagAssignation(visible, node_tag)
                }}
              >
                {node_tag.name}
              </Checkbox>
            })
        }
      </Box> : <></>}
    </Box>
  </>
  return <WrapperBoxSubSectionMenu new_data={new_data} title={t('Menu.node_associated_tag')}>
    <OSTooltip label={new_data.has_sankey_plus ? '' : t('Menu.sankeyOSPDisabled')}>
      {content}
    </OSTooltip>
  </WrapperBoxSubSectionMenu>
}

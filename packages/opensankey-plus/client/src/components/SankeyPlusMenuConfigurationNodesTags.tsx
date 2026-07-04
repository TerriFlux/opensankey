
import React, { useState } from 'react'
import {Box,Checkbox,Select,} from '@chakra-ui/react'

import type { Class_Tag } from '@terriflux/opensankey/src/types/Tag'
import { WrapperBoxSubSectionMenu } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { SankeyNodeSelectionSimple } from '@terriflux/opensankey/src/components/configmenus/MenuElementsSelection'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

export interface BaseComponentProps {
  app_data: Class_ApplicationDataOSP
}

/**
 * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
 * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
 * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
 *
 * @type {*}
 */
export const SankeyMenuConfigurationNodesTags = ({app_data}:BaseComponentProps) => {

  // Data ------------------------------------------------------------------------------

  const { t } = app_data

  // Node tags groups ------------------------------------------------------------------

  const list_node_taggs = app_data.drawing_area.sankey.node_taggs_list
  const has_node_taggs = list_node_taggs.length > 0
  const [node_tagg_entry_index, setNodeTaggEntryIndex] = useState(0)
  const node_tagg_entry = list_node_taggs[node_tagg_entry_index]

  const selected_nodes = app_data.drawing_area.selected_nodes_list_sorted

  const [, setCount] = useState(0)
  const updateThis = () => {
    // Can just use simple refresh if node_tagg entry exists
    if (app_data.drawing_area.sankey.node_taggs_list[node_tagg_entry_index])
      setCount(a => a + 1)
    // If not, reset entry index
    else
      setNodeTaggEntryIndex(0)
    setCount(a => a + 1)

  }
  app_data.menu_configuration.ref_to_menu_config_nodes_tags_updater.current = updateThis


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
    <SankeyNodeSelectionSimple app_data={app_data} />
    <Box layerStyle='menuconfigpanel_grid' >
      {/* Groupe d'étiquettes  */}
      <Select
        isDisabled={!app_data.has_sankey_plus}
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
                isDisabled={!app_data.has_sankey_plus}
                variant='menuconfigpanel_tag_checkbox'
                isIndeterminate={
                  (selected_nodes.length > 1) &&
                  (!allTrue) &&
                  (!allFalse)
                }
                isChecked={allTrue}
                onChange={(evt) => {
                  const visible = evt.target.checked
                  app_data.drawing_area.updateSelectedNodesTagAssignation(visible, node_tag)
                }}
              >
                {node_tag.name}
              </Checkbox>
            })
        }
      </Box> : <></>}
    </Box>
  </>
  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('Menu.node_associated_tag')}>
    <OSTooltip label={app_data.has_sankey_plus ? '' : t('Menu.sankeyOSPDisabled')}>
      {content}
    </OSTooltip>
  </WrapperBoxSubSectionMenu>
}

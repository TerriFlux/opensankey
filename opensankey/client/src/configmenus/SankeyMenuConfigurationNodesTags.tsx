// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  Box,
  Checkbox,
  Select,
  TabPanel,
  useBoolean
} from '@chakra-ui/react'

// Local types
import { Class_Tag } from '../types/Tag'
import { Class_NodeElement } from '../types/Node'
import {
  SankeyMenuConfigurationNodesTagsFType
} from './types/SankeyMenuConfigurationNodesTagsTypes'

// Component definition =================================================================

/**
 * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
 * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
 * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
 *
 * @type {*}
 */
export const SankeyMenuConfigurationNodesTags : FunctionComponent<SankeyMenuConfigurationNodesTagsFType> = ({
  applicationContext,
  applicationData,
  menu_for_modal
})=> {

  // Data ------------------------------------------------------------------------------

  const { t } = applicationContext
  const { new_data} = applicationData

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

  const [ , refreshThis ] = useBoolean()
  const updateThis = () => {
    // Can just use simple refresh if node_tagg entry exists
    if (new_data.drawing_area.sankey.node_taggs_list[node_tagg_entry_index])
      refreshThis.toggle()
    // If not, reset entry index
    else
      setNodeTaggEntryIndex(0)
  }
  new_data.menu_configuration.ref_to_menu_config_node_tags_updater.current = updateThis

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    refreshThis.toggle()
  }

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

  const content = <> {
    (
      has_node_taggs &&
      selected_nodes.length > 0
    ) ?
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        <Box
          as='span'
          layerStyle='menuconfigpanel_part_title_1'
        >
          {t('Menu.EN')}
        </Box>

        {/* Groupe d'étiquettes  */}
        <Select
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

        <Box
          layerStyle='menuconfigpanel_grid'
        >
          {
            node_tagg_entry.tags_list
              .map(node_tag => {
                const [allTrue, allFalse] = haveAllSelectedNodesGivenTag(node_tag)
                return <Checkbox
                  variant='menuconfigpanel_tag_checkbox'
                  isIndeterminate = {
                    (selected_nodes.length > 1) &&
                    (!allTrue) &&
                    (!allFalse)
                  }
                  isChecked={allTrue}
                  onChange={(evt) => {
                    const visible = evt.target.checked
                    selected_nodes.forEach(node => {
                      if (visible) {
                        node.addTag(node_tag)
                      }
                      else {
                        node.removeTag(node_tag)
                      }
                    })
                    // Full update
                    refreshThisAndUpdateRelatedComponents()
                  }}
                >
                  {node_tag.name}
                </Checkbox>
              })
          }
        </Box>
      </Box>
      :
      <></>
  } </>

  return menu_for_modal ?
    content:
    <TabPanel>
      {content}
    </TabPanel>
}

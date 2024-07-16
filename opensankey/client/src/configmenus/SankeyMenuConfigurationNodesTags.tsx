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
import { SankeyMenuConfigurationNodesTagsFType } from './types/SankeyMenuConfigurationNodesTagsTypes'
import { Class_Tag } from '../types/Tag'


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
  const { t } = applicationContext
  const { new_data} = applicationData

  // Node tags groups
  const node_taggs = new_data.drawing_area.sankey.node_taggs_list
  const has_node_taggs = node_taggs.length > 0
  const [node_tagg_entry_id, setNodeTaggEntryId] = useState(has_node_taggs ? node_taggs[0].id : '')
  const node_tagg_entry = new_data.drawing_area.sankey.flux_taggs_dict[node_tagg_entry_id]

  // Selected nodes
  const nodes_selected = new_data.drawing_area.selected_nodes_list

  // Menu updaters
  const [ , setForceUpdate ] = useBoolean()
  new_data.menu_configuration.ref_to_menu_config_node_tags_updater.current = setForceUpdate.toggle

  /**
   * Function used to reset menu UI
   */
  const setForceFullUpdate = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setForceUpdate.toggle()
  }

  /**
   *
   *
   * @param {Class_Tag} tag
   * @return {*}
   */
  const haveAllSelectedNodesGivenTag = (
    tag: Class_Tag
  ) => {
    let allTrue = true
    let allFalse = true
    nodes_selected
      .forEach(node => {
        const test = node.hasGivenTag(tag)
        allTrue = allTrue && (test === true)
        allFalse = allFalse && (test === false)
      })
    return [allTrue, allFalse]
  }


  const content = <> {
    (
      has_node_taggs &&
      nodes_selected.length > 0
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
          value={node_tagg_entry_id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) =>
            setNodeTaggEntryId(evt.target.value)}
        >
          {
            node_taggs
              .map(node_tagg =>
                <option
                  key={node_tagg.id}
                  value={node_tagg.id}
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
                    (nodes_selected.length > 1) &&
                    (!allTrue) &&
                    (!allFalse)
                  }
                  isChecked={allTrue}
                  onChange={(evt) => {
                    const visible = evt.target.checked
                    nodes_selected.forEach(node => {
                      if (visible) {
                        node.addTag(node_tag)
                      }
                      else {
                        node.removeTag(node_tag)
                      }
                    })
                    // Full update
                    setForceFullUpdate()
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

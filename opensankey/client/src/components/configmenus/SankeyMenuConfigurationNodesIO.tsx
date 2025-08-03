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

import React, { FC, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'

import {
  Box,
  Button,
  Checkbox,
  Select,
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import type { Type_Side } from '../../Elements/LinkAttributes'

/*************************************************************************************************/

import { OSTooltip } from '../../types/Utils'
import { SankeyNodeSelection } from './SankeyMenuConfigurationNodes'
import { WrapperBoxSubSectionMenu } from './SankeyMenuComponents'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { BaseApplicationDataType } from '../SankeyMenuTypes'

/*************************************************************************************************/

/**
 * Define IO selection menu for nodes
  *
  * @param {*} {
  *   new_data,
  *   menu_for_modal
  * }
  * @return {*}
  */
export const SankeyMenuConfigurationNodesIO: FC<BaseApplicationDataType> = ({
  new_data
}) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library } = new_data
  const { icon_move_element_down, icon_move_element_up } = icon_library

  // Nodes to modify --------------------------------------------------------------------

  let selected_nodes: Class_NodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }
  const unique_node_selected = (selected_nodes.length === 1) ? selected_nodes[0] : undefined

  // Related Links ----------------------------------------------------------------------

  let has_at_least_one_input_link = false
  let has_at_least_one_output_link = false
  selected_nodes.forEach(node => {
    has_at_least_one_input_link = (has_at_least_one_input_link || node.hasInputLinks())
    has_at_least_one_output_link = (has_at_least_one_output_link || node.hasOutputLinks())
  })

  const has_input_links = unique_node_selected?.hasInputLinks() ?? false
  const has_output_links = unique_node_selected?.hasOutputLinks() ?? false


  // Set direction state ----------------------------------------------------------------

  const output_direction = 'o'
  const input_direction = 'i'
  const [direction_selected, setSelectedDirection] = useState<string | undefined>(undefined)

  if (direction_selected == undefined) {
    if (has_input_links)
      setSelectedDirection(input_direction)
    else if (has_output_links)
      setSelectedDirection(output_direction)
  }
  else {
    if (!has_input_links && (direction_selected === input_direction))
      setSelectedDirection(undefined)
    else if (!has_output_links && (direction_selected === output_direction))
      setSelectedDirection(undefined)
  }
  // Index of link in list of visible link IO for a node side
  let idx_link_io_visible = -1
  // Number of link visble for a selected side
  let filtered_links_to_reorganize_length = 0
  // Set selected side ------------------------------------------------------------------

  const [side_selected, setSelectedSide] = useState<Type_Side | undefined>(undefined)

  if (direction_selected && side_selected == undefined) {
    if (direction_selected === input_direction)
      setSelectedSide(unique_node_selected?.input_links_list[0]?.target_side ?? undefined)
    else
      setSelectedSide(unique_node_selected?.output_links_list[0]?.source_side ?? undefined)
  }
  else if (direction_selected == undefined && side_selected) {
    setSelectedSide(undefined)  // reset selected side
  }

  // Set list of links to reorganize ----------------------------------------------------

  const links_to_reorganize: { [_ in Type_Side]: Class_LinkElement[] } = {
    'right': [], 'left': [], 'top': [], 'bottom': []
  }
  if (unique_node_selected && direction_selected && side_selected) {
    Object.keys(links_to_reorganize)
      .forEach((_) => {
        const side = _ as Type_Side
        if (direction_selected === output_direction) {
          links_to_reorganize[side] = unique_node_selected.getOutputLinksForGivenSide(side)
        }
        else {
          links_to_reorganize[side] = unique_node_selected.getInputLinksForGivenSide(side)
        }
      })

    const sideWithLinks = Object.keys(links_to_reorganize).filter((k) => links_to_reorganize[k as Type_Side].length > 0) as Type_Side[]
    if (!sideWithLinks.includes(side_selected)) {
      setSelectedSide(sideWithLinks[0])
    }

    filtered_links_to_reorganize_length = links_to_reorganize[side_selected].filter(link => link.is_visible).length
  }

  // Boolean to color or not link table ------------------------------------------------

  const [tab_colored, setTabColored] = useState(false)

  // Components updaters ---------------------------------------------------------------

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_config_nodes_io_updater.current = () => setCount(a => a + 1)

  /**
   * Local refresh function
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a => a + 1)
  }

  // Function that can be undone ---------------------------------------------------------------------

  const reorgIONodeSelected = () => {
    // Save old value that can be used in undo
    const dict_old_io: { [x: string]: string[] } = {}
    selected_nodes.forEach(node => dict_old_io[node.id] = [...Object.keys(node.input_links_dict), ...Object.keys(node.output_links_dict)])

    // Function undo
    const inv_reorgIONodeSelected = () => {
      selected_nodes.forEach(n => n.reorganizeIOFromListIds(dict_old_io[n.id]))
    }
    // Function original
    const _reorgIONodeSelected = () => {
      selected_nodes.forEach(node => node.reorganizeIOLinks())
      refreshThisAndUpdateRelatedComponents()
    }

    // Save undo/redo
    new_data.history.saveUndo(inv_reorgIONodeSelected)
    new_data.history.saveRedo(_reorgIONodeSelected)
    // Execute original function
    _reorgIONodeSelected()
  }

  /**
   * Move link order before node target
   *
   * @param {Class_LinkElement} link
   * @param {Class_LinkElement} link_target
   */
  const moveLinkBefore = (link: Class_LinkElement, link_target: Class_LinkElement) => {
    // Save old value that can be used in undo
    const list_old_io: string[] = unique_node_selected?.links_order_visible.map(l => l.id) ?? []
    // Function undo
    const inv_moveLinkBefore = () => {
      unique_node_selected?.reorganizeIOFromListIds(list_old_io)
      unique_node_selected?.draw()
      refreshThisAndUpdateRelatedComponents()
    }
    // Function original
    const _moveLinkBefore = () => {
      unique_node_selected?.moveLinkToPositionInOrderBefore(
        link,
        link_target
      )
      refreshThisAndUpdateRelatedComponents()
    }
    // Save undo/redo
    new_data.history.saveUndo(inv_moveLinkBefore)
    new_data.history.saveRedo(_moveLinkBefore)
    // Execute original function
    _moveLinkBefore()
  }

  /**
   * Move link order after node target
   *
   * @param {Class_LinkElement} link
   * @param {Class_LinkElement} link_target
   */
  const moveLinkAfter = (link: Class_LinkElement, link_target: Class_LinkElement) => {
    // Save old value that can be used in undo
    const list_old_io: string[] = unique_node_selected?.links_order_visible.map(l => l.id) ?? []
    // Function undo
    const inv_moveLinkAfter = () => {
      unique_node_selected?.reorganizeIOFromListIds(list_old_io)
      unique_node_selected?.draw()
      refreshThisAndUpdateRelatedComponents()
    }
    // Function original
    const _moveLinkAfter = () => {
      unique_node_selected?.moveLinkToPositionInOrderAfter(
        link,
        link_target
      )
      refreshThisAndUpdateRelatedComponents()
    }
    // Save undo/redo
    new_data.history.saveUndo(inv_moveLinkAfter)
    new_data.history.saveRedo(_moveLinkAfter)
    // Execute original function
    _moveLinkAfter()
  }

  // Function that return style of element draggable depending on it's state (isDragging)
  const style_TableLineDragging = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
    // change background colour if dragging
    border: isDragging ? '1px solid #78A7C2' : 'unset',
    // styles we need to apply on draggables
    ...draggableStyle
  })

  // JSX Components ---------------------------------------------------------------------

  const content_reorg = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <OSTooltip label={t('Noeud.tooltips.Reorg')}>
      <Button
        variant='menuconfigpanel_option_button'
        isDisabled={!has_at_least_one_input_link && !has_at_least_one_output_link}
        onClick={reorgIONodeSelected}
      >
        {t('Noeud.Reorg')}
      </Button>
    </OSTooltip>
  </Box>

  // Content to reorganize the i/o of only 1 node at the time
  const content_for_one_node = (
    unique_node_selected &&
    direction_selected &&
    side_selected
  ) ?
    <Box
      layerStyle='menu_sub_section'
    >
      {/* Choisir un lien entrant / sortant */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <OSTooltip label={t('Noeud.PF.tooltips.io')}>
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.PF.FES')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          value={direction_selected}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedDirection(evt.target.value)
          }}
        >
          {
            has_input_links ?
              <option
                value={input_direction}
              >
                {t('Noeud.PF.ent')}
              </option> :
              <></>
          }
          {
            has_output_links ?
              <option
                value={output_direction}
              >
                {t('Noeud.PF.sort')}
              </option> :
              <></>
          }
        </Select>
      </Box>

      {/* Choix des liens */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <OSTooltip label={t('Noeud.PF.tooltips.side')}>
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {t('Noeud.PF.FRN')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          value={side_selected as string}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedSide(evt.target.value as Type_Side)
          }}
        >
          {
            (links_to_reorganize['left'].length > 0) ?
              <option value='left'>{t('Noeud.PF.gauche')}</option> :
              <></>
          }
          {
            (links_to_reorganize['right'].length > 0) ?
              <option value='right'>{t('Noeud.PF.droite')}</option> :
              <></>
          }
          {
            (links_to_reorganize['top'].length > 0) ?
              <option value='top'>{t('Noeud.PF.ades')}</option> :
              <></>
          }
          {
            (links_to_reorganize['bottom'].length > 0) ?
              <option value='bottom'>{t('Noeud.PF.edes')}</option> :
              <></>
          }
        </Select>
      </Box>

      {/* Mettre les couleurs des flux dans le tableau pour les indentifier */}

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={tab_colored}
        onChange={(evt) => {
          setTabColored(evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.PF.tooltips.lti')}>
          {t('Noeud.PF.lti')}
        </OSTooltip>
      </Checkbox>

      {/* Table montrant les noeuds selectionnés  */}
      {
        <>
          <Table
            variant='table_edit_node_io'
          >
            <Thead>
              <Tr>
                <Th>{t('Menu.flux')}</Th>
                <Th>{t('Tags.Position')}</Th>
              </Tr>
            </Thead>
            <DragDropContext onDragEnd={(evt) => {
              // Reorganise links order at drop event
              if (evt.destination && evt.destination.index !== undefined) {
                if (evt.destination.index - evt.source.index < 0) {
                  moveLinkBefore(links_to_reorganize[side_selected][evt.source.index], links_to_reorganize[side_selected][evt.destination.index])
                } else if (evt.destination.index - evt.source.index > 0) {
                  moveLinkAfter(links_to_reorganize[side_selected][evt.source.index], links_to_reorganize[side_selected][evt.destination.index])
                }
              }
            }}>
              <Droppable droppableId="droppable">
                {(provided,) => (
                  <Tbody
                    {...provided.droppableProps}
                    ref={provided.innerRef}>
                    {
                      links_to_reorganize[side_selected]
                        .map((link, link_idx) => {

                          // Early return to not show link invisible, 
                          // but we still need correct index of link in node IO that why we don't filter links_to_reorganize
                          if (!link.is_visible)
                            return <></>

                          idx_link_io_visible += 1
                          const color = link.getPathColorToUse()
                          const bc = { 'backgroundColor': (color && tab_colored) ? color : 'inherit' }
                          const first_link = (idx_link_io_visible === 0)
                          const last_link = idx_link_io_visible === (filtered_links_to_reorganize_length - 1)

                          const curr_idx = idx_link_io_visible // save id of this link (used in onClick and if we use true_idx_link_io it will take last index since it refer to an object)
                          return (
                            <Draggable key={link.id} index={link_idx} draggableId={'line_drag_' + link.id}>
                              {(provided, snapshot) => (
                                <Tr key={link.id} ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={style_TableLineDragging(snapshot.isDragging, provided.draggableProps.style)}
                                >
                                  <td style={bc}>{link.name}</td>
                                  <td style={{ 'width': '10%' }}>
                                    <Box layerStyle="options_2cols">
                                      <Button
                                        variant='menuconfigpanel_move_order_node_io'
                                        isDisabled={first_link}
                                        minWidth='0'
                                        onClick={() => {
                                          if (!first_link) {
                                            const prev_visible_link = links_to_reorganize[side_selected].filter(l => l.is_visible)[curr_idx - 1]
                                            const idx_prev_visible_l = links_to_reorganize[side_selected].findIndex(link => link.id == prev_visible_link.id)
                                            moveLinkBefore(link, links_to_reorganize[side_selected][idx_prev_visible_l])
                                          }
                                        }}
                                      >
                                        {icon_move_element_up}
                                      </Button>
                                      <Button
                                        variant='menuconfigpanel_move_order_node_io'
                                        isDisabled={last_link}
                                        minWidth='0'
                                        onClick={() => {
                                          if (!last_link) {
                                            const next_visible_link = links_to_reorganize[side_selected].filter(l => l.is_visible)[curr_idx + 1]
                                            const idx_next_visible_l = links_to_reorganize[side_selected].findIndex(link => link.id == next_visible_link.id)
                                            moveLinkAfter(link, links_to_reorganize[side_selected][idx_next_visible_l])
                                          }
                                        }}
                                      >
                                        {icon_move_element_down}
                                      </Button>
                                    </Box>
                                  </td>
                                </Tr>)}
                            </Draggable>
                          )
                        })
                    }
                    {provided.placeholder}
                  </Tbody>
                )}
              </Droppable>
            </DragDropContext>
          </Table>
        </>
      }
    </Box> :
    <></>

  const content_always_present = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menu_sub_section_title'
    >
      {t('Noeud.Slct')}
    </Box>

    {/* Boutons de rérrangement / selection des flux  */}
    <Box
      as='span'
      layerStyle='options_2cols'
    >
      <OSTooltip label={t('Noeud.tooltips.SlctOutLink')}>
        <Button
          variant='menuconfigpanel_option_button_left'
          isDisabled={!has_at_least_one_output_link}
          onClick={() => {
            new_data.drawing_area.purgeSelectionOfLinks()
            selected_nodes
              .forEach(node => {
                node.output_links_list
                  .forEach(link => new_data.drawing_area.addLinkToSelection(link))
              })
          }}
        >
          {t('Noeud.SlctOutLink')}
        </Button>
      </OSTooltip>

      <OSTooltip label={t('Noeud.tooltips.SlctInLink')}>
        <Button
          variant='menuconfigpanel_option_button_right'
          isDisabled={!has_at_least_one_input_link}
          onClick={() => {
            new_data.drawing_area.purgeSelectionOfLinks()
            selected_nodes
              .forEach(node => {
                node.input_links_list
                  .forEach(link => new_data.drawing_area.addLinkToSelection(link))
              })
          }}
        >
          {t('Noeud.SlctInLink')}
        </Button>
      </OSTooltip>
    </Box>
  </Box>

  const content = <>
    <SankeyNodeSelection new_data={new_data} />
    <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Reorg_title')} >
      <Box layerStyle='menuconfigpanel_grid'>
        {content_reorg}
        {content_for_one_node}
        {content_always_present}
      </Box>
    </WrapperBoxSubSectionMenu>
  </>
  return content

}



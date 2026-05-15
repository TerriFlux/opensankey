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

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import { Box, Button, Checkbox, Select, Table, Tbody, Tr, } from '@chakra-ui/react'

import { ConfigMenuNumberInput, OSTooltip } from '../configmenus/MenuCommon'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Type_Side } from '../../Elements/ElementsAttributesConfig'
import { Class_ApplicationData } from '../../types/ApplicationData'

interface NodeIOReorganizerProps {
  app_data: Class_ApplicationData,
  node: Class_NodeElement
}

export const NodeIOReorganizer = ({
  app_data,
  node,
}: NodeIOReorganizerProps) => {
  // ✅ Constantes
  const { t, icon_library } = app_data
  const { icon_move_element_down, icon_move_element_up, icon_locked, icon_unlocked } = icon_library
  
  // ✅ TOUS LES HOOKS D'ABORD (avant tout return)
  const [_, setCount] = useState(0)
  const [direction_selected, setSelectedDirection] = useState<string | undefined>(undefined)
  const [side_selected, setSelectedSide] = useState<Type_Side | undefined>(undefined)
  const [tab_colored, setTabColored] = useState(false)
  const [show_all_links, setShowAllLinks] = useState(false)


  // ✅ TOUS LES useEffect AVANT le return
  const output_direction = 'o'
  const input_direction = 'i'
  const has_input_links = node?.hasInputLinks() ?? false
  const has_output_links = node?.hasOutputLinks() ?? false

  // ✅ Synchronisation de direction_selected (utilise useEffect ou logique dans le rendu)
  React.useEffect(() => {
    if (direction_selected === undefined) {
      if (has_input_links) {
        setSelectedDirection(input_direction)
      } else if (has_output_links) {
        setSelectedDirection(output_direction)
      }
    } else {
      // Vérification de cohérence
      if (!has_input_links && direction_selected === input_direction) {
        setSelectedDirection(has_output_links ? output_direction : undefined)
      } else if (!has_output_links && direction_selected === output_direction) {
        setSelectedDirection(has_input_links ? input_direction : undefined)
      }
    }
  }, [node, has_input_links, has_output_links, direction_selected])

  // ✅ Synchronisation de side_selected
  React.useEffect(() => {
    if (direction_selected && side_selected === undefined) {
      if (direction_selected === input_direction) {
        setSelectedSide(node?.input_links_list[0]?.target_side ?? undefined)
      } else {
        setSelectedSide(node?.output_links_list[0]?.source_side ?? undefined)
      }
    } else if (direction_selected === undefined && side_selected !== undefined) {
      setSelectedSide(undefined)
    }
  }, [direction_selected, side_selected, node])
  // ✅ Early return APRÈS tous les hooks
  if (!node) return <></>
  // ✅ Calcul des liens à réorganiser
  const links_to_reorganize: { [_ in Type_Side]: Class_LinkElement[] } = {
    'right': [], 'left': [], 'top': [], 'bottom': []
  }

  if (direction_selected && side_selected) {
    Object.keys(links_to_reorganize).forEach((_) => {
      const side = _ as Type_Side
      if (direction_selected === output_direction) {
        links_to_reorganize[side] = node.getOutputLinksForGivenSide(side)
      } else {
        links_to_reorganize[side] = node.getInputLinksForGivenSide(side)
      }
    })

    const sideWithLinks = Object.keys(links_to_reorganize).filter(
      (k) => links_to_reorganize[k as Type_Side].length > 0
    ) as Type_Side[]

    if (!sideWithLinks.includes(side_selected)) {
      setSelectedSide(sideWithLinks[0])
    }
  }

  // ... le reste du code reste identique

  const filtered_links_to_reorganize_length = side_selected
    ? links_to_reorganize[side_selected].filter(link => show_all_links || link.is_visible).length
    : 0

  // ✅ Fonctions de réorganisation
  const moveLinkBefore = (link: Class_LinkElement, link_target: Class_LinkElement) => {
    const list_old_io: string[] = node.links_order_visible.map(l => l.id)

    const inv_moveLinkBefore = () => {
      node.reorganizeIOFromListIds(list_old_io)
      node.draw()
      setCount(a => a + 1)
    }

    const _moveLinkBefore = () => {
      node.moveLinkToPositionInOrderBefore(link, link_target)
      // L'utilisateur a manipulé cette ancre : on verrouille son côté.
      link.setAnchorLockedForNode(node, true)
      setCount(a => a + 1)
    }

    app_data.history.saveUndo(inv_moveLinkBefore)
    app_data.history.saveRedo(_moveLinkBefore)
    _moveLinkBefore()
  }

  const moveLinkAfter = (link: Class_LinkElement, link_target: Class_LinkElement) => {
    const list_old_io: string[] = node.links_order_visible.map(l => l.id)

    const inv_moveLinkAfter = () => {
      node.reorganizeIOFromListIds(list_old_io)
      node.draw()
      setCount(a => a + 1)
    }

    const _moveLinkAfter = () => {
      node.moveLinkToPositionInOrderAfter(link, link_target)
      // L'utilisateur a manipulé cette ancre : on verrouille son côté.
      link.setAnchorLockedForNode(node, true)
      setCount(a => a + 1)
    }

    app_data.history.saveUndo(inv_moveLinkAfter)
    app_data.history.saveRedo(_moveLinkAfter)
    _moveLinkAfter()
  }

  // ✅ Style pour le drag & drop
  const style_TableLineDragging = (
    isDragging: boolean,
    draggableStyle: DraggingStyle | NotDraggingStyle | undefined
  ) => ({
    border: isDragging ? '1px solid #78A7C2' : 'unset',
    ...draggableStyle
  })

  // ✅ Condition d'affichage
  if (!direction_selected || !side_selected) {
    return <></>
  }

  // ✅ Index pour la table
  let idx_link_io_visible = -1

  return (
    <>
      {/* Choisir un lien entrant / sortant */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <OSTooltip label={t('Noeud.PF.tooltips.io')}>
          <Box as='span' layerStyle='menuconfigpanel_option_name'>
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
          {has_input_links && (
            <option value={input_direction}>
              {t('Noeud.PF.ent')}
            </option>
          )}
          {has_output_links && (
            <option value={output_direction}>
              {t('Noeud.PF.sort')}
            </option>
          )}
        </Select>
      </Box>

      {/* Choix des liens */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <OSTooltip label={t('Noeud.PF.tooltips.side')}>
          <Box as='span' layerStyle='menuconfigpanel_option_name'>
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
          {links_to_reorganize['left'].length > 0 && (
            <option value='left'>{t('Noeud.PF.gauche')}</option>
          )}
          {links_to_reorganize['right'].length > 0 && (
            <option value='right'>{t('Noeud.PF.droite')}</option>
          )}
          {links_to_reorganize['top'].length > 0 && (
            <option value='top'>{t('Noeud.PF.ades')}</option>
          )}
          {links_to_reorganize['bottom'].length > 0 && (
            <option value='bottom'>{t('Noeud.PF.edes')}</option>
          )}
        </Select>
      </Box>

      {/* Flux visibles / Tous les flux */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <OSTooltip label={t('Noeud.PF.tooltips.filter_links')}>
          <Box as='span' layerStyle='menuconfigpanel_option_name'>
            {t('Noeud.PF.filter_links')}
          </Box>
        </OSTooltip>
        <Select
          variant='menuconfigpanel_option_select'
          value={show_all_links ? 'all' : 'visible'}
          onChange={(evt) => setShowAllLinks(evt.target.value === 'all')}
        >
          <option value='visible'>{t('Noeud.PF.visible_links')}</option>
          <option value='all'>{t('Noeud.PF.all_links')}</option>
        </Select>
      </Box>

      {/* Mettre les couleurs des flux dans le tableau */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={tab_colored}
        onChange={(evt) => setTabColored(evt.target.checked)}
      >
        <OSTooltip label={t('Noeud.PF.tooltips.lti')}>
          {t('Noeud.PF.lti')}
        </OSTooltip>
      </Checkbox>

      {/* Table montrant les liens */}
      <Table variant='table_edit_node_io'>
        <DragDropContext
          onDragEnd={(evt) => {
            if (evt.destination && evt.destination.index !== undefined) {
              if (evt.destination.index - evt.source.index < 0) {
                moveLinkBefore(
                  links_to_reorganize[side_selected][evt.source.index],
                  links_to_reorganize[side_selected][evt.destination.index]
                )
              } else if (evt.destination.index - evt.source.index > 0) {
                moveLinkAfter(
                  links_to_reorganize[side_selected][evt.source.index],
                  links_to_reorganize[side_selected][evt.destination.index]
                )
              }
            }
          }}
        >
          <Droppable droppableId="droppable">
            {(provided) => (
              <Tbody {...provided.droppableProps} ref={provided.innerRef}>
                {links_to_reorganize[side_selected].map((link, link_idx) => {
                  if (!show_all_links && !link.is_visible) return <React.Fragment key={link.id} />

                  idx_link_io_visible += 1
                  const color = link.getShapeColorToUse()
                  const bc = { backgroundColor: (color && tab_colored) ? color : 'inherit' }
                  const first_link = idx_link_io_visible === 0
                  const last_link = idx_link_io_visible === filtered_links_to_reorganize_length - 1
                  const curr_idx = idx_link_io_visible

                  return (
                    <Draggable key={link.id} index={link_idx} draggableId={'line_drag_' + link.id}>
                      {(provided, snapshot) => (
                        <Tr
                          key={link.id}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={style_TableLineDragging(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                        >
                          <td style={{ ...bc, fontSize: '0.7rem', lineHeight: '0.85rem' }}>{link.name}</td>
                          <td style={{ width: '10%' }}>
                            <Box layerStyle="options_2cols">
                              <Button
                                variant='menuconfigpanel_move_order_node_io'
                                isDisabled={first_link}
                                minWidth='0'
                                onClick={() => {
                                  if (!first_link) {
                                    const prev_visible_link = links_to_reorganize[side_selected]
                                      .filter(l => l.is_visible)[curr_idx - 1]
                                    const idx_prev_visible_l = links_to_reorganize[side_selected]
                                      .findIndex(l => l.id === prev_visible_link.id)
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
                                    const next_visible_link = links_to_reorganize[side_selected]
                                      .filter(l => l.is_visible)[curr_idx + 1]
                                    const idx_next_visible_l = links_to_reorganize[side_selected]
                                      .findIndex(l => l.id === next_visible_link.id)
                                    moveLinkAfter(link, links_to_reorganize[side_selected][idx_next_visible_l])
                                  }
                                }}
                              >
                                {icon_move_element_down}
                              </Button>
                            </Box>
                          </td>
                          <td style={{ width: '1%' }}>
                            <OSTooltip label={t('Noeud.PF.tooltips.lock')}>
                              <Button
                                variant='menuconfigpanel_move_order_node_io'
                                minWidth='0'
                                onClick={() => {
                                  link.setAnchorLockedForNode(node, !link.getAnchorLockedForNode(node))
                                  node.draw()
                                  setCount(a => a + 1)
                                }}
                              >
                                {link.getAnchorLockedForNode(node) ? icon_locked : icon_unlocked}
                              </Button>
                            </OSTooltip>
                          </td>
                          <td style={{ width: '100%', margin: 0 }}>
                            <ConfigMenuNumberInput
                              t={t}
                              default_value={link.getAnchorDeltaForNode(node)}
                              stepper={true}
                              step={5}
                              fixed_dec={0}
                              function_on_blur={(value) => {
                                link.setAnchorDeltaForNode(node, value ?? 0)
                                node.draw()
                                setCount(a => a + 1)
                              }}
                            />
                          </td>
                        </Tr>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </Tbody>
            )}
          </Droppable>
        </DragDropContext>
      </Table>
    </>
  )
}

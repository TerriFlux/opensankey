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

import React, { FunctionComponent, useRef, useState } from 'react'

import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useBoolean
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

/*************************************************************************************************/

import { FCType_ContextMenuNode } from './types/SankeyMenuContextNodeTypes'
import {
  Type_GenericApplicationData, Type_GenericLinkElement, Type_GenericNodeElement
} from '../../types/Types'
import { Class_NodeDimension } from '../../Elements/NodeDimension'
import { Class_NodeAttribute, Class_NodeStyle } from '../../Elements/NodeAttributes'
import { Class_LevelTag, Class_LevelTagGroup, Class_ProtoLevelTag } from '../../types/Tag'
import { ClassAbstract_ProtoLevelTag } from '../../types/Abstract'
import { default_style_id } from '../../types/Utils'


/*************************************************************************************************/

const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

// MENU COMPONENT ***********************************************************************

export const ContextMenuNode: FunctionComponent<FCType_ContextMenuNode> = (
  {
    new_data,
    additionalMenu
  }: FCType_ContextMenuNode
) => {

  // Datas ------------------------------------------------------------------------------

  const { t } = new_data
  const {
    ref_setter_show_menu_node_apparence,
    ref_setter_show_menu_node_io,
  } = new_data.menu_configuration.dict_setter_show_dialog

  // Node on which this menu applies ----------------------------------------------------

  const contextualised_node = new_data.drawing_area.node_contextualised

  let style_c_n = '0px 0px auto auto'
  let is_top = true
  let pos_x = 0
  let pos_y = 0

  const size_Button = 40
  const size_context_menu = (additionalMenu.current.context_node_order.filter(key => !key.includes('sep_')).length) * size_Button // Get approx. height of context menu
  // The limit value of the mouse position that engages the shift of the context menu
  // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
  if (contextualised_node) {
    if (new_data.drawing_area.pointer_pos[0] + 410 > window.innerWidth) {
      pos_x = new_data.drawing_area.pointer_pos[0] - 400
    }
    pos_x = new_data.drawing_area.pointer_pos[0]
    pos_y = new_data.drawing_area.pointer_pos[1]

    if (new_data.drawing_area.pointer_pos[1] + size_context_menu > window.innerHeight) {
      pos_y = ((new_data.drawing_area.pointer_pos[1] - (new_data.drawing_area.pointer_pos[1] + size_context_menu - window.innerHeight)))
      is_top = false
    }
    style_c_n = pos_y + 'px auto auto ' + pos_x + 'px'
  }

  const contextualised_node_shape_visible = contextualised_node !== undefined ? contextualised_node.shape_visible : false
  const contextualised_node_label_visible = contextualised_node !== undefined ? contextualised_node.name_label_is_visible : false
  const contextualised_node_value_visible = contextualised_node !== undefined ? contextualised_node.value_label_is_visible : false

  const selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list

  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, refreshThis] = useBoolean()

  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_context_nodes_updater.current = () => refreshThis.toggle()

  // Functions used to reset menu UI ----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    new_data.menu_configuration.ref_to_spreadsheet.current()
    // Refresh this menu
    refreshThis.toggle()
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data.drawing_area.node_contextualised = undefined
    // Refresh this menu
    refreshThis.toggle()
  }

  // Functions we can undo --------------------------------------------------------------

  /**
   * Deal with node horizontal / vertical alignement & save it's undo
   *
   * @param {('min' | 'max')} ref
   * @param {('position_x' | 'position_y')} attr
   * @param {('b' | 'm' | 'a')} pos : b:before, m:middle, a:after
   */
  const align_node = (
    ref: 'min' | 'max',
    attr: 'position_x' | 'position_y',
    pos: 'b' | 'm' | 'a'
  ) => {
    // Save old value that can be used in undo
    const dict_old_pos: { [x: string]: [number, number] } = {}
    selected_nodes.forEach(n => dict_old_pos[n.id] = [n.position_x, n.position_y])

    // Function undo
    const inv_align_node = () => {
      selected_nodes.forEach(n => n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1]))
    }
    // Function original
    const _align_node = () => {
      // Reference position
      const node_ref = selected_nodes
        .filter(nf => nf.position_type != 'relative')
        .sort((n1, n2) => {
          return ref == 'min' ? n1[attr] - n2[attr] : n2[attr] - n1[attr]
        })[0]
      const pos_ref = node_ref[attr]
      // Deal with ellipses shapes
      const is_circle = (node_ref.shape_type === 'ellipse')
      let wORh_ref = is_circle ? node_ref.getShapeWidthToUse() / 2 : node_ref.getShapeWidthToUse()
      if (attr === 'position_y') {
        wORh_ref = is_circle ? node_ref.getShapeHeightToUse() / 2 : node_ref.getShapeHeightToUse()
      }
      let center_ref = 0
      if (pos === 'm') {
        center_ref = pos_ref + (wORh_ref / 2)
      }
      // Update positions of all selected nodes
      selected_nodes
        .filter(n => n != node_ref && n.position_type != 'relative')
        .forEach(n => {
          const is_circle_to_shift = (n.shape_type === 'ellipse')
          let wORh_to_shift = is_circle_to_shift ? n.getShapeWidthToUse() / 2 : n.getShapeWidthToUse()
          if (attr === 'position_y') {
            wORh_to_shift = is_circle_to_shift ? n.getShapeHeightToUse() / 2 : n.getShapeHeightToUse()
          }

          if (pos === 'm') {
            n[attr] = center_ref - ((wORh_to_shift) / 2)
          }
          else if (pos === 'b') {
            n[attr] = pos_ref
          }
          else { // if (pos === 'a')
            n[attr] = (pos_ref + wORh_ref) - wORh_to_shift
          }
          n.draw()
        })
      // Refresh and toggle saving
      refreshThisAndToggleSaving()
    }
    // Save undo/redo
    new_data.history.saveUndo(inv_align_node)
    new_data.history.saveRedo(_align_node)
    // Execute original function
    _align_node()
  }

  /**
   * Update style of selected nodes & save it's undo
   *
   * @param {Class_NodeStyle} sn
   */
  const updateStyle = (sn: Class_NodeStyle) => {

    const dict_old_value: { [x: string]: Class_NodeStyle } = {}

    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.style
    })
    const _updateStyle = () => {
      selected_nodes.forEach(n => {
        n.style = sn
      })
      refreshThisAndToggleSaving()

    }

    const inv_updateStyle = () => {
      selected_nodes.forEach(n => {
        n.style = dict_old_value[n.id]
      })
      refreshThisAndToggleSaving()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateStyle)
    new_data.history.saveRedo(_updateStyle)
    // Execute original attr mutation
    _updateStyle()
  }

  /**
   * Rest attributes of selected nodes & save it's undo
   *
   */
  const resetAttr = () => {
    const dict_old_value: { [x: string]: Class_NodeAttribute } = {}
    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.display.attributes
    })
    const _resetAttr = () => {
      selected_nodes.forEach(n => {
        n.resetAttributes()
      })
      refreshThisAndToggleSaving()

    }

    const inv_resetAttr = () => {
      selected_nodes.forEach(n => {
        n.display.attributes = dict_old_value[n.id]
      })
      refreshThisAndToggleSaving()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_resetAttr)
    new_data.history.saveRedo(_resetAttr)
    // Execute original attr mutation
    _resetAttr()
  }

  /**
   * Update name visibility of selected nodes & save it's undo
   *
   */
  const updateNameVisibility = () => {
    const dict_old_value: { [x: string]: boolean } = {}
    // Clone Class_attribute of links so in the undo it's doens't affect a value if the original value came from style
    selected_nodes.forEach(node => {
      dict_old_value[node.id] = node.name_label_is_visible
    })
    const _updateNameVisibility = () => {
      selected_nodes
        .forEach(node => {
          node.name_label_is_visible = !contextualised_node_label_visible
        })
      refreshThisAndToggleSaving()
    }

    const inv_updateNameVisibility = () => {
      selected_nodes.forEach(node => {
        node.name_label_is_visible = dict_old_value[node.id]
        node.draw()
      })
      refreshThisAndToggleSaving()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateNameVisibility)
    new_data.history.saveRedo(_updateNameVisibility)
    // Execute original attr mutation
    _updateNameVisibility()
  }

  /**
   * Update value visibility of selected nodes & save it's undo
   *
   */
  const updateValueVisibility = () => {
    const dict_old_value: { [x: string]: boolean } = {}
    // Clone Class_attribute of links so in the undo it's doens't affect a value if the original value came from style
    selected_nodes.forEach(node => {
      dict_old_value[node.id] = node.value_label_is_visible
    })
    const _updateValueVisibility = () => {
      selected_nodes
        .forEach(node => {
          node.value_label_is_visible = !contextualised_node_value_visible
        })
      refreshThisAndToggleSaving()
    }

    const inv_updateValueVisibility = () => {
      selected_nodes.forEach(node => {
        node.value_label_is_visible = dict_old_value[node.id]
        node.draw()
      })
      refreshThisAndToggleSaving()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateValueVisibility)
    new_data.history.saveRedo(_updateValueVisibility)
    // Execute original attr mutation
    _updateValueVisibility()
  }

  /**
  * Update shape visibility of selected nodes & save it's undo
  *
  */
  const updateShapeVisibility = () => {
    const dict_old_value: { [x: string]: boolean } = {}
    // Clone Class_attribute of links so in the undo it's doens't affect a value if the original value came from style
    selected_nodes.forEach(node => {
      dict_old_value[node.id] = node.shape_visible
    })
    const _updateShapeVisibility = () => {
      selected_nodes
        .forEach(node => {
          node.shape_visible = !contextualised_node_shape_visible
        })
      refreshThisAndToggleSaving()
    }

    const inv_updateShapeVisibility = () => {
      selected_nodes.forEach(node => {
        node.shape_visible = dict_old_value[node.id]
        node.draw()
      })
      refreshThisAndToggleSaving()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateShapeVisibility)
    new_data.history.saveRedo(_updateShapeVisibility)
    // Execute original attr mutation
    _updateShapeVisibility()
  }

  /**
 * Reorganise link's IO order of selected nodes based on pos of source/target & save it's undo
 *
 */
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
      refreshThisAndToggleSaving()
    }

    // Save undo/redo
    new_data.history.saveUndo(inv_reorgIONodeSelected)
    new_data.history.saveRedo(_reorgIONodeSelected)
    // Execute original function
    _reorgIONodeSelected()
  }
  // JSX Components ---------------------------------------------------------------------

  const dropdown_c_n_apparence = <Button
    onClick={() => {
      ref_setter_show_menu_node_apparence.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
    rightIcon={new_data.icon_library.icon_popup_menu}
  >
    {t('Noeud.apparence.apparence')}
  </Button>

  // Menu to change some pararmeter concerning the style of the node
  const dropdown_c_n_style_select = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.SelectStyle')}
    </MenuButton>
    <MenuList>
      {
        new_data.drawing_area.sankey.node_styles_list_sorted
          .map((sn, i) => {
            return <MenuItem key={'context_node_item_' + i} onClick={() => {
              if (contextualised_node) {
                updateStyle(sn)

              }
            }}>
              {sn.name}
            </MenuItem>
          })
      }
    </MenuList>
  </Menu>

  const dropdown_c_n_style = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.editStyle')}
    </MenuButton>
    <MenuList>
      <Button
        variant='contextmenu_button'
        onClick={resetAttr}
      >
        {t('Noeud.AS')}
      </Button>
      {dropdown_c_n_style_select}
    </MenuList>
  </Menu>



  const dropdown_c_n_io = <Button
    onClick={() => {
      ref_setter_show_menu_node_io.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
    rightIcon={new_data.icon_library.icon_popup_menu}
  >
    {t('Noeud.PF.PF')}
  </Button>

  // ===============ALIGNEMENT HORIZONTAL DES NOEUDS====================================

  const dropdown_c_n_align_h_min_ori = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.align_horiz_min')}
    </MenuButton>
    <MenuList>
      <MenuItem
        onClick={() => {
          align_node('min', 'position_x', 'b')
        }}
      >
        {t('Noeud.align_horiz_left')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          align_node('min', 'position_x', 'm')
        }}
      >
        {t('Noeud.align_horiz_center')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          align_node('min', 'position_x', 'a')
        }}
      >
        {t('Noeud.align_horiz_right')}
      </MenuItem>
    </MenuList>
  </Menu>

  const dropdown_c_n_align_h_max_ori = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.align_horiz_max')}
    </MenuButton>
    <MenuList>
      <MenuItem
        onClick={() => {
          align_node('max', 'position_x', 'b')
        }}
      >
        {t('Noeud.align_horiz_left')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          align_node('max', 'position_x', 'm')
        }}
      >
        {t('Noeud.align_horiz_center')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          align_node('max', 'position_x', 'a')
        }}
      >
        {t('Noeud.align_horiz_right')}
      </MenuItem>
    </MenuList>
  </Menu>

  const dropdown_c_n_align_h = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.align_horiz')}
    </MenuButton>
    <MenuList>
      {dropdown_c_n_align_h_min_ori}
      {dropdown_c_n_align_h_max_ori}
    </MenuList>
  </Menu>

  // ===============ALIGNEMENT VERTICAL DES NOEUDS=======================================

  const dropdown_c_n_align_v_min_ori = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.align_vert_min')}
    </MenuButton>
    <MenuList>
      <MenuItem
        onClick={() => {
          align_node('min', 'position_y', 'b')
        }}
      >
        {t('Noeud.align_vert_top')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          align_node('min', 'position_y', 'm')
        }}
      >
        {t('Noeud.align_horiz_center')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          align_node('min', 'position_y', 'a')
        }}
      >
        {t('Noeud.align_vert_bottom')}
      </MenuItem>
    </MenuList>
  </Menu>

  const dropdown_c_n_align_v_max_ori = <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Noeud.align_vert_max')}
    </MenuButton>
    <MenuList>
      <MenuItem onClick={() => {
        align_node('max', 'position_y', 'b')
      }}>{t('Noeud.align_vert_top')}
      </MenuItem>
      <MenuItem onClick={() => {
        align_node('max', 'position_y', 'm')
      }}>{t('Noeud.align_horiz_center')}
      </MenuItem>
      <MenuItem onClick={() => {
        align_node('max', 'position_y', 'a')
      }}>{t('Noeud.align_vert_bottom')}
      </MenuItem>
    </MenuList>
  </Menu>

  const dropdown_c_n_align_v = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.align_vert')}
    </MenuButton>
    <MenuList>
      {dropdown_c_n_align_v_min_ori}
      {dropdown_c_n_align_v_max_ori}
    </MenuList>
  </Menu>

  const dropdown_c_n_align = <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.align')}
    </MenuButton>
    <MenuList>
      {dropdown_c_n_align_h}
      {dropdown_c_n_align_v}
    </MenuList>
  </Menu>

  const button_edit_label_node = <Button
    variant='contextmenu_button'
    onClick={() => {
      // TODO : when we can edit node label on DA re-instance this function

      // const label_x = document.getElementById('text_' + contextualised_node!.idNode)?.getBoundingClientRect().x ?? 0
      // const label_y = document.getElementById('text_' + contextualised_node!.idNode)?.getBoundingClientRect().y ?? 0
      // const node_x = document.getElementById('shape_' + contextualised_node!.idNode)?.getBoundingClientRect().x ?? 0
      // const node_y = document.getElementById('shape_' + contextualised_node!.idNode)?.getBoundingClientRect().y ?? 0

      // d3.select('#fo_input_label_' + contextualised_node!.idNode).style('display', 'inline-block')
      // d3.select('#fo_input_label_' + contextualised_node!.idNode).attr('x', (label_x - node_x)).attr('y', label_y - node_y)
      // d3.select('#text_' + contextualised_node!.idNode).style('visibility', 'hidden')
      // document.getElementById('input_label_' + contextualised_node!.idNode)?.focus()

      // new_data.drawing_area.node_contextualised = undefined
      contextualised_node?.setInputLabelVisible()
      closeContextMenu()
    }}
  >
    {t('Noeud.labels.edit_node_label')}
  </Button>

  // Menu to select output or input links of the contextualised node
  const drp_dwn_slct_link = <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Noeud.SlctL')}
    </MenuButton>
    <MenuList>

      <MenuItem
        onClick={() => {
          // Select links attached to selected nodes
          selected_nodes.forEach(n => {
            n.output_links_list.forEach(l => new_data.drawing_area.addLinkToSelection(l))
          })
          new_data.drawing_area.node_contextualised = undefined
          refreshThisAndToggleSaving()

        }}>
        {t('Noeud.SlctOL')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          // Select links attached to selected nodes
          selected_nodes.forEach(n => {
            n.input_links_list.forEach(l => new_data.drawing_area.addLinkToSelection(l))
          })
          new_data.drawing_area.node_contextualised = undefined
          refreshThisAndToggleSaving()

        }}>
        {t('Noeud.SlctIL')}
      </MenuItem>
    </MenuList>
  </Menu>

  const btn_reorganise_link_io = <Button
    variant='contextmenu_button'
    onClick={reorgIONodeSelected}>
    {t('Noeud.Reorg')}
  </Button>

  const btn_aggregate = (
    (selected_nodes.length === 1) &&
    (contextualised_node !== undefined) &&
    (selected_nodes.includes(contextualised_node)) &&
    (contextualised_node.is_child)
  ) ?
    <Button
      variant='contextmenu_button'
      onClick={() => {
        if (contextualised_node.is_multi_children) {
          new_data.menu_configuration.ref_to_updater_node_agregate.current(true)
        }
        else {
          contextualised_node.drawParent()
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined

          refreshThisAndToggleSaving()
        }

      }}
    >
      {t('Noeud.context_agregate')}
    </Button> :
    <></>

  const btn_desagregate = (
    (selected_nodes.length === 1) &&
    (contextualised_node !== undefined) &&
    (selected_nodes.includes(contextualised_node)) &&
    (contextualised_node.is_parent)
  ) ?
    <Button
      variant='contextmenu_button'
      onClick={() => {
        if (contextualised_node.is_multi_parent) {
          new_data.menu_configuration.ref_to_updater_node_disagregate.current(true)
        } else {
          contextualised_node.drawChildren(
            contextualised_node.dimensions_as_parent[contextualised_node.dimensions_as_parent.length - 1].id
          )
          contextualised_node.input_links_list.forEach(l=>l.source.draw())
          contextualised_node.output_links_list.forEach(l=>l.target.draw())
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          refreshThisAndToggleSaving()
        }

      }}
    >
      {t('Noeud.context_desagregate')}
    </Button> :
    <></>

  const btn_create_flux_on_children = (
    (selected_nodes.length === 1) &&
    (contextualised_node !== undefined) &&
    (selected_nodes.includes(contextualised_node)) &&
    (contextualised_node.is_parent)
  ) ?
    <Button
      variant='contextmenu_button'
      onClick={() => {
        function addNewLinks(n: Type_GenericNodeElement) {
          n.dimensions_as_parent.forEach(dim => {
            dim.children.forEach(c => {
              
              if (c.input_links_list.length === 0 ) {
                //already treated
                n.input_links_list.forEach(l => sankey.addNewLink(l.source, c as Type_GenericNodeElement))
              }
              if (c.output_links_list.length === 0 ) {
                //already treated
                n.output_links_list.forEach(l => sankey.addNewLink(c as Type_GenericNodeElement, l.target))
              }
            })
            dim.children.forEach(c => {
              addNewLinks(c as Type_GenericNodeElement)
            })
          })
        }
        addNewLinks(contextualised_node)
        new_data.drawing_area.purgeSelection()
        new_data.drawing_area.node_contextualised = undefined
        new_data.drawing_area.areaAutoFit(false)
        refreshThisAndToggleSaving()
      }}
    >
      {t('Noeud.context_create_flux')}
    </Button> :
    <></>


  const sankey = new_data.drawing_area.sankey
  const expand_left = selected_nodes.length > 0 ? selected_nodes[0].output_links_list.length == 0 : true
  const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  const source_or_target_attr = expand_left ? 'source' : 'target'
  let possible_root_nodes: Set<string> = new Set
  selected_nodes.forEach(n => {
    if (possible_root_nodes.size !== 0) {
      possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id)).intersection(possible_root_nodes)
    } else {
      possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
    }
  })
  const btn_set_child_ok = [...possible_root_nodes].length > 0

  function addNewLinks(n:Type_GenericNodeElement,extremity_node:Type_GenericNodeElement,tagg:Class_LevelTagGroup) {
    const pdim = n.nodeDimensionAsParent(tagg)
    if (pdim) {
      (pdim.children as Type_GenericNodeElement[]).forEach(c => {
        const link2copy = (c as Type_GenericNodeElement)[input_or_output_attr][0]
        const child_link = n.sankey.addNewLink(expand_left ? extremity_node : c, expand_left ? c : extremity_node);
        (child_link as Type_GenericLinkElement).copyValues(link2copy)
        //n.sankey.drawing_area.deleteLink(link2copy)
        addNewLinks(c,extremity_node,tagg)
      })
    }
  }
  function removeLinks(n:Type_GenericNodeElement,tagg:Class_LevelTagGroup) {
    const pdim = n.nodeDimensionAsParent(tagg)
    if (pdim) {
      (pdim.children as Type_GenericNodeElement[]).forEach(c => {
        n.sankey.drawing_area.deleteLink((c as Type_GenericNodeElement)[input_or_output_attr][0])
        removeLinks(c,tagg)
      })
    }        
  }

  const btn_set_child = btn_set_child_ok ? <Button
    variant='contextmenu_button'
    onClick={() => {
      new_data.drawing_area.bypass_redraws = true

      let new_tag = false
      let this_parent_dim: Class_NodeDimension | undefined
      let this_child_dim: Class_NodeDimension | undefined

      let root_node: Type_GenericNodeElement

      let tagg = sankey.level_taggs_dict['dimension_1'] as Class_LevelTagGroup
      if (!tagg) {
        tagg = sankey.addLevelTagGroup('dimension_1', 'Dimension 1') as Class_LevelTagGroup
        tagg.activated = true
        tagg.addTag('1', '1')
      }
      selected_nodes.forEach(n => {
        if (new_tag) {
          return
        }
        // If node being set as child is set as parent we must create a new level
        this_parent_dim = n.dimensions_as_parent[0] // TODO > 1
        this_child_dim = this_child_dim ? this_child_dim : n.dimensions_as_child[0]
        if (this_parent_dim) {
          new_tag = true
          if ((this_parent_dim.children as Type_GenericNodeElement[])[0].dimensions_as_child.length == 1) {
            this_parent_dim.shift_level_tags()
            tagg = this_parent_dim.parent_level_tag.group as Class_LevelTagGroup
          } else {
            // On croise
            const other_dim = (this_parent_dim.children as Type_GenericNodeElement[])[0].dimensions_as_child.filter(cdim => cdim.parent_level_tag.group != this_parent_dim?.parent_level_tag.group)[0]
            if (other_dim) {
              tagg = other_dim.parent_level_tag.group as Class_LevelTagGroup
            }
          }
        }
      })
      root_node = sankey.nodes_dict[[...possible_root_nodes][0]]

      let root_has_parent = root_node.dimensions_as_parent.filter(dim => dim.parent_level_tag.group.id == tagg.id).length !== 0
      let parent_level_tag: ClassAbstract_ProtoLevelTag
      let child_level_tag: ClassAbstract_ProtoLevelTag
      let idx = 1
      if (!root_has_parent && !this_child_dim) {
        parent_level_tag = tagg.tags_list[0]
        if (tagg.tags_list.length == 1) {
          tagg.addTag(
            String(+parent_level_tag.id + 1),
            String(+parent_level_tag.id + 1)
          )
        }
        //if (this_parent_dim) {
        // PC parent child
        //parent_level_tag = this_parent_dim.parent_level_tag
        //hild_level_tag = this_parent_dim.child_level_tag
        //} else {
        child_level_tag = tagg.tags_list[1]
        //} 
      } else if (root_has_parent && !this_child_dim) {
        // New dimension
        idx = root_node.dimensions_as_parent.length + 1
        tagg = sankey.addLevelTagGroup(
          'dimension_' + idx,
          'Dimension ' + idx,
        ) as Class_LevelTagGroup
        tagg.activated = true
        tagg.addTag('1', '1')
        tagg.addTag('2', '2')
        parent_level_tag = sankey.level_taggs_dict['dimension_' + idx].tags_list[0]
        child_level_tag = sankey.level_taggs_dict['dimension_' + idx].tags_list[1]
      } else {
        if (this_child_dim == undefined) return
        // this_child_dim is defined
        // New dimension
        tagg = Object.values(sankey.level_taggs_dict).filter(tagg => tagg !== this_child_dim?.parent_level_tag.group)[0]
        if (!tagg) {
          idx = Object.values(sankey.level_taggs_dict).length + 1
          tagg = sankey.addLevelTagGroup(
            'dimension_' + idx,
            'Dimension ' + idx,
          ) as Class_LevelTagGroup
          tagg.activated = true
          tagg.addTag('1', '1')
          tagg.addTag('2', '2')
        }
        parent_level_tag = tagg.tags_list[0]
        child_level_tag = tagg.tags_list[1];
      }

      selected_nodes.forEach(n => {
        (parent_level_tag as Class_LevelTag).getOrCreateLowerDimension(root_node, n, child_level_tag as Class_LevelTag)
        n.dimensionsUpdated()
        root_node.dimensionsUpdated()
        root_node.nodeDimensionAsParent(tagg)!.normalize()

        const desagregation_link = n[input_or_output_attr].filter(l => l[source_or_target_attr].id == root_node.id)[0]
        if (n.input_links_list.length==0 || n.output_links_list.length==0) {
          root_node[input_or_output_attr].forEach(supply_link => {
            if (!supply_link.value?.valueData) {
              return
            }
            const new_link = n.sankey.addNewLink(expand_left ? supply_link.source : n, expand_left ? n : supply_link.target);
            (new_link as Type_GenericLinkElement).copyValues(desagregation_link);
            addNewLinks(n,expand_left?supply_link.source:supply_link.target,tagg);
            supply_link[source_or_target_attr].reorganizeIOLinks()
          })
          removeLinks(n,tagg)
        }
        sankey.drawing_area.deleteLink(desagregation_link)
      })
      sankey.nodes_list.forEach(n => {
        n.dimensionsUpdated();
        n.updateVisibilityFingerprint()
      })
      tagg.tags_list[0].setSelected()
      new_data.menu_configuration.ref_to_leveltag_filter_updater.current()
      new_data.drawing_area.draw()
    }}
  >{t('Noeud.context_set_child')}</Button> : <></>

  const dropdown_expand_right = (
    (selected_nodes.length === 1) &&
    (contextualised_node !== undefined) &&
    (selected_nodes.includes(contextualised_node)) &&
    (contextualised_node.dimensions_as_parent.length>0 || (contextualised_node.sibling))
  ) ?<Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {t('Noeud.hierarchy')}
    </MenuButton>
    <MenuList>
    {contextualised_node.dimensions_as_parent.map(dim=><Button
      variant='contextmenu_button'
      onClick={() => expand(new_data, contextualised_node, false,dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_expand_right') + ' ' + dim.related_level_tagg.name}
    </Button>)}
    {contextualised_node.dimensions_as_parent.map(dim=><Button
      variant='contextmenu_button'
      onClick={() => expand(new_data, contextualised_node, true,dim.related_level_tagg as Class_LevelTagGroup)}
    >
      {t('Noeud.context_expand_left') + ' ' + dim.related_level_tagg.name}
    </Button>)}
    {(contextualised_node.sibling)?<Button
      variant='contextmenu_button'
      onClick={() => {
        const original_parent_node = contextualised_node.sibling!.dimensions_as_child[0].parent as Type_GenericNodeElement
        let l = contextualised_node.output_links_list.filter(l=>l.target==original_parent_node || l.target.sibling==original_parent_node)[0]
        let expand_left = true
        if (!l) {
          l = contextualised_node.input_links_list.filter(l=>l.source==original_parent_node || l.source.sibling==original_parent_node)[0]
          expand_left = false
        }
        if (!l) {
          // error
          return
        }
        let parent_node= expand_left?l.target:l.source
        new_data.drawing_area.bypass_redraws = true
        const children = expand_left ? parent_node.input_links_list.filter(l=>l.is_visible) : parent_node.output_links_list.filter(l=>l.is_visible)
        children.forEach((c, i) => {
          new_data.drawing_area.sankey.deleteNode(expand_left ? c.source : c.target)
        })
        if (expand_left) {
          parent_node.input_links_list.forEach(l=>l.setVisible())
        } else {
          parent_node.output_links_list.forEach(l=>l.setVisible())          
        }
        new_data.drawing_area.draw()
      }
      }
    >
      {t('Noeud.context_contract')}
    </Button>:<></>}
    </MenuList>
  </Menu>:<></>

  const btn_mask_shape = <Button
    variant='contextmenu_button'
    onClick={updateShapeVisibility}
  >
    {
      contextualised_node_shape_visible ?
        t('Noeud.apparence.hide_shape') :
        t('Noeud.apparence.display_shape')
    }
  </Button>

  const btn_mask_label = <Button
    variant='contextmenu_button'
    onClick={updateNameVisibility}
  >
    {
      contextualised_node_label_visible ?
        t('Noeud.apparence.hide_label') :
        t('Noeud.apparence.display_label')
    }
  </Button>

  const btn_delete = <Button
    variant='contextmenu_button'
    onClick={() => {
      new_data.drawing_area.deleteSelectedNodes()
      new_data.drawing_area.node_contextualised = undefined
      refreshThisAndToggleSaving()
      closeContextMenu()
    }}
  >
    {t('Menu.suppr')}
  </Button>

  const btn_mask_value = <Button
    variant='contextmenu_button'
    onClick={updateValueVisibility}
  >
    {
      contextualised_node_value_visible ?
        t('Noeud.apparence.hide_value') :
        t('Noeud.apparence.display_value')
    }
  </Button>

  const context_content: { [_: string]: JSX.Element } = {
    'aggregate': btn_aggregate,
    'desaggregate': btn_desagregate,
    'expand_left': dropdown_expand_right,
    'set_as_child': btn_set_child,
    'create_flux': btn_create_flux_on_children,
    'sep_1': sep,

    'align': selected_nodes.length > 1 ? <>{dropdown_c_n_align}{sep}</> : <></>,
    'edit_name': button_edit_label_node,
    'delete': btn_delete,
    'sep_2': sep,

    'style': dropdown_c_n_style,
    'mask_shape': btn_mask_shape,
    'mask_label': btn_mask_label,
    'mask_value': btn_mask_value,
    'sep_3': sep,

    'reorg': btn_reorganise_link_io,
    'select_link': drp_dwn_slct_link,
    'sep_4': sep,

    'drag_apparence': dropdown_c_n_apparence,
    'drag_io': selected_nodes.length == 1 ? dropdown_c_n_io : <></>,
    ...additionalMenu.current.additional_context_node_element
  }

  // Pop over that serve as context menu
  return contextualised_node !== undefined ?
    <Box
      layerStyle='context_menu'
      id="context_node_pop_over"
      className={'context_popover ' + (is_top ? '' : 'at_bot')}
      style={{
        maxWidth: '100%',
        position: 'absolute',
        zIndex: '1',
        inset: style_c_n
      }}
    >
      <ButtonGroup
        orientation='vertical'
        isAttached
      >
        {additionalMenu.current.context_node_order.map((key, id) => {
          return <React.Fragment key={id}>{context_content[key]}</React.Fragment>
        })}
      </ButtonGroup>
    </Box> :
    <></>
}

export type AgregationModalTypes = {
  new_data: Type_GenericApplicationData,
}

export const DisaggregationModal: FunctionComponent<AgregationModalTypes> = (
  { new_data }
) => {
  const [, setForce] = useState(0)
  const [show_agregation, set_show_agregation] = useState(false)
  const selected_grp = useRef<Class_NodeDimension | undefined>()
  const closeModal = () => {
    new_data.drawing_area.node_contextualised = undefined
    new_data.drawing_area.purgeSelection()
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    set_show_agregation(false)
  }
  new_data.menu_configuration.ref_to_updater_node_disagregate.current = (b: boolean) => set_show_agregation(b)
  if (new_data.drawing_area.node_contextualised) {
    const list_child_dim = new_data.drawing_area.node_contextualised.dimensions_as_parent
    if (selected_grp.current == null || selected_grp.current == undefined) {
      selected_grp.current = list_child_dim[0]
      setForce(a => a + 1)
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={closeModal}
        variant='modal_dialog'
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
            {new_data.t('Noeud.title_desaggreg')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            width='100%'
          >
            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='0.25rem'
              width='calc(100% - 2rem)'
            >
              <Select
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const idx_new_selected_grp = list_child_dim.map(dim => dim.id).indexOf(evt.target.value)
                  selected_grp.current = (list_child_dim[idx_new_selected_grp])
                  setForce(a => a + 1)
                }}
                value={selected_grp.current?.id}
                width='100%'
              >
                {list_child_dim.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name.id} >{cur_dim_name.child_level_tagg.name}</option>
                )}
              </Select>
              <Text>{new_data.t('Noeud.text_desagreg')}</Text>
              {selected_grp.current?.children.map(child_name => <Text>{child_name.name}</Text>)}
            </Box>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="menuconfigpanel_option_button_secondary"
                isActive
                size='sizeButtonDialog'
                onClick={() => {
                  new_data.drawing_area.node_contextualised?.drawChildren((selected_grp.current?.id ?? ''))
                  // new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
                  closeModal()
                }}
              >
                {new_data.t('Noeud.desaggreg')}
              </Button>
              <Button
                variant="menuconfigpanel_del_button"
                size='sizeButtonDialog'
                onClick={() => {
                  closeModal()
                }}
              >
                {new_data.t('Menu.annuler')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

}


export const AggregationModal: FunctionComponent<AgregationModalTypes> = (
  { new_data }
) => {
  const [, setForce] = useState(0)
  const [show_agregation, set_show_agregation] = useState(false)
  const selected_grp = useRef<Class_NodeDimension | undefined>()
  const closeModal = () => {
    new_data.drawing_area.node_contextualised = undefined
    new_data.drawing_area.purgeSelection()
    new_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
    set_show_agregation(false)
  }
  new_data.menu_configuration.ref_to_updater_node_agregate.current = (b: boolean) => set_show_agregation(b)
  if (new_data.drawing_area.node_contextualised) {
    const list_parent_dim = new_data.drawing_area.node_contextualised.dimensions_as_child
    if (selected_grp.current == null || selected_grp.current == undefined) {
      selected_grp.current = list_parent_dim[0]
      setForce(a => a + 1)
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={closeModal}
        variant='modal_dialog'
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
            {new_data.t('Noeud.title_aggreg')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            width='100%'
          >
            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='0.25rem'
              width='calc(100% - 2rem)'
            >
              <Select
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const idx_new_selected_grp = list_parent_dim.map(dim => dim.id).indexOf(evt.target.value)
                  selected_grp.current = (list_parent_dim[idx_new_selected_grp])
                  setForce(a => a + 1)
                }}
                value={selected_grp.current?.id}
                width='100%'
              >
                {list_parent_dim.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name.id} >{cur_dim_name.child_level_tagg.name}</option>
                )}
              </Select>
              <Text>{new_data.t('Noeud.text_agreg')}</Text>
              {<Text>{selected_grp.current?.parent.name}</Text>}
            </Box>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="menuconfigpanel_option_button_secondary"
                isActive
                size='sizeButtonDialog'
                onClick={() => {
                  new_data.drawing_area.node_contextualised?.drawParent((selected_grp.current?.id ?? ''))
                  // new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
                  closeModal()
                }}
              >
                {new_data.t('Noeud.aggreg')}
              </Button>
              <Button
                variant="menuconfigpanel_del_button"
                size='sizeButtonDialog'
                onClick={() => {
                  closeModal()
                }}
              >
                {new_data.t('Menu.annuler')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }
}

function expand(
  new_data: Type_GenericApplicationData, 
  contextualised_node: Type_GenericNodeElement, 
  expand_left: boolean,
  tagg:Class_LevelTagGroup
) {
  new_data.drawing_area.bypass_redraws = true
  //do not draw until all nodes and links have been created
  const parent_dim = contextualised_node.nodeDimensionAsParent(tagg)
  if (!parent_dim) {
    return
  }
  const children = parent_dim.children as Type_GenericNodeElement[]
  const new_nodes: Type_GenericNodeElement[] = []
  //const original_node = contextualised_node.sibling ?? contextualised_node
  const original_node = contextualised_node
  const original_node_sibling = contextualised_node.sibling??contextualised_node
  // the new node is intimely linked to the original child node
  let links_aggregate: Type_GenericLinkElement[] = []
  // Si on étend à droite ce sont les flux qui vont à droite du noeud que l'on expand et qui additionnent les flux à droite des neouds enfants expandus 
  // Si on étend à gauche ce sont les flux qui viennent de gauche du noeud que l'on expand
  let links_copy: Type_GenericLinkElement[] = []
  // Si on étend à gauche ce sont les flux qui viennent de gauche
  // Si on étend à droite ce sont les flux qui vont à droite des neouds enfants expandus copié depuis le sibling

  let copy_left = expand_left
  if (expand_left) {
    links_aggregate = original_node_sibling.output_links_list/*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
    links_copy = original_node.input_links_list/*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
  } else {
    // expand right
    if (original_node_sibling.output_links_list.length == 0) {
      links_aggregate = original_node_sibling.input_links_list/*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
    } else {
      copy_left = true
      links_aggregate = original_node_sibling.output_links_list.filter(l => l.target.is_visible) as Type_GenericLinkElement[]      
    }
    links_copy = original_node.output_links_list/*.filter(l => l.is_visible)*/ as Type_GenericLinkElement[]
  }

  children.forEach((c, i) => {
    const n = new_data.drawing_area.sankey.addNewNode(c.id + 'expand', c.name)
    new_nodes.push(n)
    n.sibling = c
    n.copyFrom(c)
    n.shape_color = contextualised_node.shape_color
    n.shape_opacity = (contextualised_node.shape_opacity > 0.3) ? contextualised_node.shape_opacity - 0.2 : contextualised_node.shape_opacity
    //n.position_type = 'parametric'
    // n is no more a child (contrary to its sibling)
    //if (i==0) {
    if (contextualised_node.dimensions_as_child.length == 0 ) {
      n.dimensions_as_child.forEach(cdim => n.removeDimensionAsChild(cdim))
    } else {
      const dim_as_child = contextualised_node.nodeDimensionAsChild(tagg)
      const n_dim_as_child = n.nodeDimensionAsChild(tagg)
      n_dim_as_child!.force_child_level_tag(dim_as_child!.child_level_tag)
      n_dim_as_child!.force_parent_level_tag(dim_as_child!.parent_level_tag)
      n_dim_as_child!.setForceToShowChildren(true)
    }
    if (n.dimensions_as_parent.length !== 0 ) {
      // the dimension as parent go up one level
      const dim_as_parent = contextualised_node.nodeDimensionAsParent(tagg)
      const n_dim_as_parent = n.nodeDimensionAsParent(tagg)
      if (n_dim_as_parent) {
        n_dim_as_parent!.force_parent_level_tag(dim_as_parent!.parent_level_tag)
        n_dim_as_parent!.force_child_level_tag(dim_as_parent!.child_level_tag)
      }
    }
    //}
    // let lchild: Type_GenericLinkElement
    // if (expand_left) {
    //   lchild = new_data.drawing_area.sankey.addNewLink(n, contextualised_node)
    // } else {
    //   lchild = new_data.drawing_area.sankey.addNewLink(contextualised_node, n)
    // }
    // lchild.shape_color_rule = 'source'
    // lchild.shape_opacity = n.shape_opacity

    // links_aggregate.forEach(laggregate => {
    //   if (copy_left) {
    //     //const l2copy = lparent.target.input_links_list.filter(l => l.source == n.sibling)[0]
    //     let laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n.sibling)[0]
    //     if (!laggregate_child) {
    //       laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n)[0]          
    //     }
    //     if (laggregate_child) {
    //       lchild.addValues(laggregate_child)
    //     }
    //   } else {
    //     const laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n.sibling)[0]
    //     if (laggregate_child) {
    //       lchild.addValues(laggregate_child)
    //     }
    //   }
    // })
    links_aggregate.forEach(laggregate => {
      let lchild: Type_GenericLinkElement
      if (expand_left) {
        lchild = new_data.drawing_area.sankey.addNewLink(n, contextualised_node)
      } else {
        lchild = new_data.drawing_area.sankey.addNewLink(contextualised_node, n)
      }
      lchild.shape_color_rule = 'source'
      lchild.shape_opacity = n.shape_opacity
      lchild.sibling = laggregate
      if (copy_left) {
        //const l2copy = lparent.target.input_links_list.filter(l => l.source == n.sibling)[0]
        let laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n.sibling)[0]
        if (!laggregate_child) {
          laggregate_child = laggregate.target.input_links_list.filter(l => l.source == n)[0]          
        }
        if (laggregate_child) {
          lchild.copyValues(laggregate_child)
        }
      } else {
        const laggregate_child = laggregate.source.output_links_list.filter(l => l.target == n.sibling)[0]
        if (laggregate_child) {
          lchild.copyValues(laggregate_child)
        }
      }
    })

    links_copy.forEach(lcopy => {
      let lchild: Type_GenericLinkElement
      if (expand_left) {
        lchild = new_data.drawing_area.sankey.addNewLink(lcopy.source, n)
        const lcopy_child = lcopy.source.output_links_list.filter(l => l.target == n.sibling)[0]
        if (lcopy_child) {
          lchild.copyValues(lcopy_child)
        }
        lcopy.setInvisible()
      } else {
        lchild = new_data.drawing_area.sankey.addNewLink(n, lcopy.target)
        const lcopy_child = lcopy.target.input_links_list.filter(l => l.source == n.sibling)[0]
        if (lcopy_child) {
          lchild.copyValues(lcopy_child)
        }
        lcopy.setInvisible()
      }
    })

    //if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type == 'parametric') {
    if (expand_left) {
      n.position_x = contextualised_node.position_x - new_data.drawing_area.horizontal_spacing / 2
    } else {
      n.position_x = contextualised_node.position_x + new_data.drawing_area.horizontal_spacing / 2
    }
    //}
    n.position_v = -1
  })
  let total_height = (new_nodes.length - 1) * new_data.drawing_area.vertical_spacing
  new_nodes.forEach(c=> total_height += c.getShapeHeightToUse())
  const shift_y = total_height/2
  new_nodes.forEach((n,i) => {
    if (new_data.drawing_area.sankey.node_styles_dict[default_style_id].position.type == 'parametric' && i == 0) {
      n.position_y = contextualised_node.position_y + contextualised_node.getShapeHeightToUse() / 2 - shift_y
    }
  })

  new_data.drawing_area.bypass_redraws = false
  // ready to draw in parametric mode
  new_data.drawing_area.computeParametrization()
  new_nodes.forEach(n => {
    n.resetPositionAttribute('dy')
    n.applyPosition()
    n.input_links_list.forEach(l=>l.source.reorganizeIOLinks())
    n.output_links_list.forEach(l=>l.target.reorganizeIOLinks())
    n.reorganizeIOLinks()
    n.draw()
  })
}

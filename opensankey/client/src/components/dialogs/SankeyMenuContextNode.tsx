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

import React, { useState, MutableRefObject } from 'react'

import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

/*************************************************************************************************/

import { Class_NodeAttribute } from '../../Elements/NodeAttributes'
import { Class_NodeStyle } from '../../Elements/ElementStyle'
import { hierarchyEditionMenu, hierarchyManipulationMenu } from './SankeyMenuContextHierarchie'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'


/*************************************************************************************************/

const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

// MENU COMPONENT ***********************************************************************

export const ContextMenuNode = ({new_data,additionalMenus}:{
  new_data: Class_ApplicationData
  additionalMenus: MutableRefObject<Type_AdditionalMenus>
}
) => {

  // Datas ------------------------------------------------------------------------------

  const { t, drawing_area } = new_data

  // Node on which this menu applies ----------------------------------------------------

  const contextualised_node = drawing_area.node_contextualised

  let style_c_n = '0px 0px auto auto'
  let is_top = true
  let pos_x = 0
  let pos_y = 0

  const size_Button = 40
  const size_context_menu = (additionalMenus.current.context_node_order.filter(key => !key.includes('sep_')).length) * size_Button // Get approx. height of context menu
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
  const [, refreshThis] = useState(0)

  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_context_nodes_updater.current = () => refreshThis(a => a + 1)

  // Functions used to reset menu UI ----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    new_data.menu_configuration.ref_to_spreadsheet.current()
    // Refresh this menu
    refreshThis(a => a + 1)
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data.drawing_area.node_contextualised = undefined
    // Refresh this menu
    refreshThis(a => a + 1)
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
    closeContextMenu()
  }

  /**
   * Update style of selected nodes & save it's undo
   *
   * @param {Class_NodeStyle} sn
   */
  const updateStyle = (sn: Class_NodeStyle) => {

    const dict_old_value: { [x: string]: Class_NodeStyle[] } = {}

    selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.style
    })
    const _updateStyle = () => {
      const node_ref_has_style=selected_nodes[0].style.includes(sn)??false
      new_data.drawing_area.sankey.switchNodeStyle(sn,node_ref_has_style)

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
    closeContextMenu()
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
    closeContextMenu()

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
    closeContextMenu()
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
    closeContextMenu()
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
    closeContextMenu()
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
    closeContextMenu()

  }


  const moveToFirstPlan = () => {
    drawing_area.selected_nodes_list.forEach(node => {
      const idx_to_shift = drawing_area.list_g_element.indexOf(node.id)
      drawing_area.moveOrderElementInDA(idx_to_shift, drawing_area.list_g_element.length - 1)
    })
    closeContextMenu()
  }
  const moveToLastPlan = () => {
    drawing_area.selected_nodes_list.forEach(node => {
      const idx_to_shift = drawing_area.list_g_element.indexOf(node.id)
      drawing_area.moveOrderElementInDA(idx_to_shift, 0)
    })
    closeContextMenu()
  }


  // JSX Components ---------------------------------------------------------------------

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

  const menu_change_plan = <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Noeud.changePlan')}
    </MenuButton>
    <MenuList>

      <MenuItem
        onClick={moveToFirstPlan}>
        {t('Noeud.firstPlan')}
      </MenuItem>
      <MenuItem
        onClick={moveToLastPlan}>
        {t('Noeud.lastPlan')}
      </MenuItem>
    </MenuList>
  </Menu>


  const btn_edition_hierarchy = contextualised_node ? hierarchyEditionMenu(new_data, contextualised_node, selected_nodes,refreshThisAndToggleSaving) : <></>
  const btn_nav_hierarchy = contextualised_node ? hierarchyManipulationMenu(new_data, contextualised_node, selected_nodes,refreshThisAndToggleSaving) : <></>


  const menu_mask_node_attr = <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('Noeud.mask_attr')}
    </MenuButton>
    <MenuList>

      <MenuItem
        onClick={updateShapeVisibility}>
        {
          contextualised_node_shape_visible ?
            t('Noeud.apparence.hide_shape') :
            t('Noeud.apparence.display_shape')
        }
      </MenuItem>
      <MenuItem
        onClick={updateNameVisibility}>
        {contextualised_node_label_visible ?
          t('Noeud.apparence.hide_label') :
          t('Noeud.apparence.display_label')}
      </MenuItem>
      <MenuItem
        onClick={updateValueVisibility}>
        {contextualised_node_value_visible ?
          t('Noeud.apparence.hide_value') :
          t('Noeud.apparence.display_value')}
      </MenuItem>
    </MenuList>
  </Menu>

  const context_content: { [_: string]: JSX.Element } = {
    'edition_hierarchy': btn_edition_hierarchy,
    'nav_hierarchy': btn_nav_hierarchy,
    'sep_1': sep,

    'align': selected_nodes.length > 1 ? <>{dropdown_c_n_align}{sep}</> : <></>,
    'edit_name': button_edit_label_node,
    'sep_2': sep,

    'style': dropdown_c_n_style,
    'mask_node_attr': menu_mask_node_attr,
    'sep_3': sep,

    'reorg': btn_reorganise_link_io,
    'change_plan': menu_change_plan,
    'select_link': drp_dwn_slct_link,

    ...additionalMenus.current.additional_context_node_element
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
        {additionalMenus.current.context_node_order.map((key, id) => {
          return <React.Fragment key={id}>{context_content[key]}</React.Fragment>
        })}
      </ButtonGroup>
    </Box> :
    <></>
}



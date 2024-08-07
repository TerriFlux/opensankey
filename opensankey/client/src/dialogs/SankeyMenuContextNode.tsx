import React, { FunctionComponent } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useBoolean
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

/*************************************************************************************************/

import { ContextMenuNodeFType } from './types/SankeyMenuContextNodeTypes'

/*************************************************************************************************/

const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />
const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

// MENU COMPONENT ***********************************************************************

export const ContextMenuNode: FunctionComponent<ContextMenuNodeFType> = (
  {
    applicationData,
    agregation,
    additional_context_element_menu,
    additional_context_element_other
  }
) => {

  // Datas ------------------------------------------------------------------------------

  const { new_data } = applicationData
  const { t } = new_data
  const {ref_setter_show_menu_node_apparence, ref_setter_show_menu_node_tooltip, ref_setter_show_menu_node_io, ref_setter_show_menu_node_tags}=new_data.menu_configuration.dict_setter_show_dialog
  // Node on which this menu applies ----------------------------------------------------

  const contextualised_node = new_data.drawing_area.node_contextualised

  let style_c_n = '0px 0px auto auto'
  let is_top = true
  let pos_x = 0
  let pos_y = 0

  // The limit value of the mouse position that engages the shift of the context menu
  // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
  if (contextualised_node) {
    if (new_data.drawing_area.pointer_pos[0] + 410 > window.innerWidth) {
      pos_x = new_data.drawing_area.pointer_pos[0] - 400
    }
    pos_x = new_data.drawing_area.pointer_pos[0]
    pos_y = new_data.drawing_area.pointer_pos[1]

    if (new_data.drawing_area.pointer_pos[1] + 490 > window.innerHeight) {
      pos_y = new_data.drawing_area.pointer_pos[1] - 470
      is_top = false
    }
    style_c_n = pos_y + 'px auto auto ' + pos_x + 'px'
  }

  const contextualised_node_shape_visible = contextualised_node !== undefined ? contextualised_node.shape_visible : false
  const contextualised_node_label_visible = contextualised_node !== undefined ? contextualised_node.name_label_visible : false
  const contextualised_node_value_visible = contextualised_node !== undefined ? contextualised_node.value_label_visible : false

  const selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list

  // Menu updaters ----------------------------------------------------------------------

  // Boolean used to force this component to reload
  const [ , refreshThis] = useBoolean()

  // Link this menu's update function
  new_data.menu_configuration.ref_to_menu_context_nodes_updater.current = () => refreshThis.toggle()

  // Functions used to reset menu UI ----------------------------------------------------

  const refreshThisAndToggleSaving = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Refresh this menu
    refreshThis.toggle()
  }

  const closeContextMenu=()=>{
    // Unset contextualized node
    new_data.drawing_area.node_contextualised=undefined
    // Refresh this menu
    refreshThis.toggle()
  }

  // Local utils functions --------------------------------------------------------------

  /**
   * Deal with node horizontal / vertical alignement
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
      })
    // Refresh and toggle saving
    refreshThisAndToggleSaving()
  }

  // JSX Components ---------------------------------------------------------------------

  const dropdown_c_n_apparence = <Button
    onClick={() => {
      ref_setter_show_menu_node_apparence.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('Noeud.apparence.apparence')}
    {icon_open_modal}
  </Button>

  const dropdown_c_n_tooltip = <Button
    onClick={() => {
      ref_setter_show_menu_node_tooltip.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('Noeud.IS')}
    {icon_open_modal}
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
          .map((sn,i) => {
            return <MenuItem key={'context_node_item_'+i} onClick={() => {
              if (contextualised_node) {
                selected_nodes.map(node => {
                  node.style = sn
                })
                refreshThisAndToggleSaving()
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
        onClick={() => {
          selected_nodes.forEach(node => node.resetAttributes())
          refreshThisAndToggleSaving()
        }}
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
  >
    {t('Noeud.PF.PF')}
    {icon_open_modal}
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
        }}>
        {t('Noeud.SlctIL')}
      </MenuItem>
    </MenuList>
  </Menu>

  const btn_reorganise_link_io = <Button
    variant='contextmenu_button'
    onClick={() => {

      selected_nodes.forEach(node => node.reorganizeIOLinks()) // TODO : function to reorganise IO links of nodes depending on source/target position
      refreshThisAndToggleSaving()

    }}>
    {t('Noeud.Reorg')}
  </Button>


  // TODO : function to aggregate/deaggregate only 1 node

  // const btn_aggregate = multi_selected_nodes.current.filter(n => n != contextualised_node).length == 0 && contextualised_node && NodeContextHasAggregate(contextualised_node, data) ? <Button variant='contextmenu_button' onClick={() => {
  //   Aggregate(contextualised_node, data, agregation)
  //   multi_selected_nodes.current = []
  //   node_function.recomputeDisplayedElement()
  //   set_data({ ...data })
  //   new_data.drawing_area.node_contextualised = undefined
  //
  //   refreshThisAndToggleSaving()

  // }}>{t('Noeud.context_agregate')}</Button> : <></>

  // const btn_desagregate = multi_selected_nodes.current.filter(n => n != contextualised_node).length == 0 && contextualised_node && NodeContextHasDesaggregate(contextualised_node, data) ? <Button variant='contextmenu_button' onClick={() => {
  //   Desaggregate(contextualised_node, applicationData, agregation)
  //   multi_selected_nodes.current = []
  //   node_function.recomputeDisplayedElement()
  //   set_data({ ...data })
  //   new_data.drawing_area.node_contextualised = undefined
  //
  //   refreshThisAndToggleSaving()

  // }}>{t('Noeud.context_desagregate')}</Button> : <></>

  const btn_mask_shape = <Button
    variant='contextmenu_button'
    onClick={() => {
      selected_nodes
        .forEach(n => {
          n.shape_visible = !contextualised_node_shape_visible
        })
      refreshThisAndToggleSaving()
    }}
  >
    {
      contextualised_node_shape_visible ?
        t('Noeud.apparence.hide_shape') :
        t('Noeud.apparence.display_shape')
    }
  </Button>

  const btn_mask_label = <Button
    variant='contextmenu_button'
    onClick={() => {
      selected_nodes.forEach(n => {
        n.name_label_visible = !contextualised_node_label_visible
      })
      refreshThisAndToggleSaving()
    }}
  >
    {
      contextualised_node_label_visible ?
        t('Noeud.apparence.hide_label') :
        t('Noeud.apparence.display_label')
    }
  </Button>

  const btn_mask_value = <Button
    variant='contextmenu_button'
    onClick={() => {
      selected_nodes
        .forEach(n => {
          n.value_label_visible = !contextualised_node_value_visible
        })
      refreshThisAndToggleSaving()
    }}
  >
    {
      contextualised_node_value_visible ?
        t('Noeud.apparence.hide_value') :
        t('Noeud.apparence.display_value')
    }
  </Button>

  const btn_c_n_show_tags_menu = <Button
    onClick={() => {
      ref_setter_show_menu_node_tags.current(true)
      closeContextMenu()
    }}
    variant='contextmenu_button'
  >
    {t('Menu.Etiquettes')}
    {icon_open_modal}
  </Button>

  // Pop over that serve as context menu
  return contextualised_node !== undefined ?
    <Box
      layerStyle='context_menu'
      id="context_node_pop_over"
      className={'context_popover ' + (is_top ? '' : 'at_bot')}
      style={{
        maxWidth: '100%',
        position: 'absolute',
        inset: style_c_n
      }}
    >
      <ButtonGroup
        orientation='vertical'
        isAttached
      >
        {/* TODO mettre en oeuvre {btn_aggregate} */}
        {/* TODO mettre en oeuvre {btn_desagregate} */}
        {/* {sep} */}

        {selected_nodes.length > 1 ? <>
          {dropdown_c_n_align}
          {sep}</> : <></>
        }

        {additional_context_element_other}

        {button_edit_label_node}
        <Button
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

        {sep}

        {dropdown_c_n_style}
        {btn_mask_shape}
        {btn_mask_label}
        {btn_mask_value}

        {sep}

        {btn_reorganise_link_io}
        {drp_dwn_slct_link}

        {sep}

        {dropdown_c_n_apparence}
        {btn_c_n_show_tags_menu}
        {selected_nodes.length == 1 ? dropdown_c_n_io : <></>}
        {dropdown_c_n_tooltip}
        {additional_context_element_menu}
      </ButtonGroup>
    </Box> :
    <></>
}
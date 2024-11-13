import React, { FunctionComponent, useRef, useState } from 'react'

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
import { Type_GenericApplicationDataOS } from '../types/TypesOS'
import { Class_NodeDimension } from '../types/NodeDimension'

/*************************************************************************************************/

export const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />
const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

// MENU COMPONENT ***********************************************************************

export const ContextMenuNode: FunctionComponent<FCType_ContextMenuNode> = (
  {
    new_data,
    additionalMenu
  }
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
  const size_context_menu = (additionalMenu.context_node_order.filter(key => !key.includes('sep_')).length) * size_Button // Get approx. height of context menu
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
  const contextualised_node_label_visible = contextualised_node !== undefined ? contextualised_node.name_label_visible : false

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
    // Refresh this menu
    refreshThis.toggle()
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data.drawing_area.node_contextualised = undefined
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
        } else {
          contextualised_node.drawParent()
          new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before aggregation
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          new_data.drawing_area.areaAutoFit()
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
          contextualised_node.drawChildren()
          new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
          new_data.drawing_area.purgeSelection()
          new_data.drawing_area.node_contextualised = undefined
          new_data.drawing_area.areaAutoFit()
          refreshThisAndToggleSaving()
        }

      }}
    >
      {t('Noeud.context_desagregate')}
    </Button> :
    <></>

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

  const context_content: { [_: string]: JSX.Element } = {
    'aggregate': btn_aggregate,
    'desaggregate': btn_desagregate,
    'sep_1': sep,

    'align': selected_nodes.length > 1 ? <>{dropdown_c_n_align}{sep}</> : <></>,
    'edit_name': button_edit_label_node,
    'delete': btn_delete,
    'sep_2': sep,

    'style': dropdown_c_n_style,
    'mask_shape': btn_mask_shape,
    'mask_label': btn_mask_label,
    'sep_3': sep,

    'reorg': btn_reorganise_link_io,
    'select_link': drp_dwn_slct_link,
    'sep_4': sep,

    'drag_apparence': dropdown_c_n_apparence,
    'drag_io': selected_nodes.length == 1 ? dropdown_c_n_io : <></>,
    ...additionalMenu.additional_context_node_element
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
        inset: style_c_n
      }}
    >
      <ButtonGroup
        orientation='vertical'
        isAttached
      >
        {additionalMenu.context_node_order.map((key, id) => {
          return <React.Fragment key={id}>{context_content[key]}</React.Fragment>
        })}
      </ButtonGroup>
    </Box> :
    <></>
}

export type AgregationModalTypes = {
  new_data: Type_GenericApplicationDataOS,
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
    const list_child_dim = new_data.drawing_area.node_contextualised.get_children_dim.filter(dim => dim.children_level_tagg.id != 'Primaire')
    if (selected_grp.current == null || selected_grp.current == undefined) {
      selected_grp.current = list_child_dim[0]
      setForce(a => a + 1)
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={closeModal}
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
            {new_data.t('Noeud.title_desaggreg')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Select
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const idx_new_selected_grp = list_child_dim.map(dim => dim.id).indexOf(evt.target.value)
                  selected_grp.current = (list_child_dim[idx_new_selected_grp])
                  setForce(a => a + 1)
                }}
                value={selected_grp.current?.id}
              >
                {list_child_dim.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name.id} >{cur_dim_name.children_level_tagg.name}</option>
                )}
              </Select>
              <Text>{new_data.t('Noeud.text_agreg')}</Text>
              {selected_grp.current?.children.map(child_name => <Text>{child_name.name}</Text>)}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="menuconfigpanel_option_button_secondary"
              onClick={() => {
                new_data.drawing_area.node_contextualised?.drawChildrenOfGrp((selected_grp.current?.id ?? ''))
                new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
                closeModal()
              }}
            >{new_data.t('Noeud.desaggreg')}</Button>
            <Button variant="menuconfigpanel_del_button" onClick={() => {
              closeModal()
            }}>{new_data.t('Menu.annuler')}</Button>
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
    const list_parent_dim = new_data.drawing_area.node_contextualised.get_parent_dim.filter(dim => dim.parent_level_tag.group.id != 'Primaire')
    if (selected_grp.current == null || selected_grp.current == undefined) {
      selected_grp.current = list_parent_dim[0]
      setForce(a => a + 1)
    }
    return (
      <Modal
        isOpen={show_agregation}
        onClose={closeModal}
      >
        <ModalOverlay />
        <ModalContent
          maxWidth='inherit'
        >
          <ModalHeader>
            {new_data.t('Noeud.title_aggreg')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <Select
                onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                  const idx_new_selected_grp = list_parent_dim.map(dim => dim.id).indexOf(evt.target.value)
                  selected_grp.current = (list_parent_dim[idx_new_selected_grp])
                  setForce(a => a + 1)
                }}
                value={selected_grp.current?.id}
              >
                {list_parent_dim.map(
                  (cur_dim_name, i) => <option key={i} value={cur_dim_name.id} >{cur_dim_name.children_level_tagg.name}</option>
                )}
              </Select>
              <Text>{new_data.t('Noeud.text_agreg')}</Text>
              {<Text>{selected_grp.current?.parent.name}</Text>}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="menuconfigpanel_option_button_secondary"
              onClick={() => {
                new_data.drawing_area.node_contextualised?.drawParentOfGrp((selected_grp.current?.id ?? ''))
                new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())//Redraw all node visible because some link position where not computed before disaggregation
                closeModal()
              }}
            >{new_data.t('Noeud.aggreg')}</Button>
            <Button variant="menuconfigpanel_del_button" onClick={() => {
              closeModal()
            }}>{new_data.t('Menu.annuler')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }
}
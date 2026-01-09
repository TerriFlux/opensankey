// 'react-quill' seem to not be updated anymore, for new it doesn't create problem but it make a warning error in console
// to solve it when time will come we can use 'react-quill-new' wich solve this issu (https://github.com/zenoamaro/react-quill/issues/988#issuecomment-2241533429)
// Imported libs
import {
  Box, Button, ButtonGroup
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { sep } from './SankeyPlusMenuConfigurationLabels'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'
import { MenuColorPicker } from '../deps/OpenSankey/components/configmenus/MenuCommon'

export const ContextZDT = (
  { app_data: app_data }: { app_data: Class_ApplicationData }
) => {
  const { t, drawing_area } = app_data

  const selected_zdt = app_data.drawing_area.selected_containers_list
  const zdt_to_contextualise = app_data.drawing_area.contextualised_container

  const [, setCount] = useState(0)
  app_data.menu_configuration.ref_to_menu_context_container_updater.current = () => setCount(a => a + 1)
  let style_c_zdd = '0px 0px auto auto'
  let pos_x = app_data.drawing_area.pointer_pos[0] + 10
  let pos_y = app_data.drawing_area.pointer_pos[1] - 20
  //let is_top = true
  const size_context_menu = 6 * 40 // Get approx. height of context menu

  if (zdt_to_contextualise) {
    if (app_data.drawing_area.pointer_pos[0] + 450 > window.innerWidth) {
      pos_x = app_data.drawing_area.pointer_pos[0] - 455
    }

    if (app_data.drawing_area.pointer_pos[1] + size_context_menu > window.innerHeight) {
      pos_y = app_data.drawing_area.pointer_pos[1] - size_context_menu
      //is_top = false
    }
    style_c_zdd = pos_y + 'px auto auto ' + pos_x + 'px'
  }
  else {
    // Early return in case zdt zdt_to_contextualise isn't defined, it avoid testing if zdt is defined in each function
    return <></>
  }

  const redrawAndRefresh = () => {
    // Refresh menu config free label
    app_data.menu_configuration.ref_to_menu_config_containers_updater.current()
    // Redraw selected elements
    selected_zdt.forEach(zdt => zdt.draw())
    // Refresh this menu
    setCount(a => a + 1)
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    app_data.drawing_area.contextualised_container = undefined
    setCount(a => a + 1)

  }

  /**
   * Return a list of node which position are inside contextualised zdt
   *
   */
  const getNodeInsideContextZDT = () => app_data.drawing_area.sankey.visible_nodes_list
    .filter(n => {
      // Check if node is horizontally in zdt
      const is_node_horizontally_in_zone = (
        (n.position_x >= zdt_to_contextualise.position_x) &&
        (n.position_x <= (zdt_to_contextualise.position_x + zdt_to_contextualise.shape_min_width)) &&
        ((n.position_x + n.getShapeWidthToUse()) <= (zdt_to_contextualise.position_x + zdt_to_contextualise.shape_min_width))
      )
      // Check if node is vertically in zdt
      const is_node_vertically_in_zone = (
        (n.position_y >= zdt_to_contextualise.position_y) &&
        (n.position_y <= (zdt_to_contextualise.position_y + zdt_to_contextualise.shape_min_height)) &&
        ((n.position_y + n.getShapeHeightToUse()) <= (zdt_to_contextualise.position_y + zdt_to_contextualise.shape_min_height))
      )
      // Must be in zdt
      return (is_node_horizontally_in_zone && is_node_vertically_in_zone)
    })

  const moveToFirstPlan = () => {
    drawing_area.selected_containers_list.forEach(cont => {
      const idx_to_shift = drawing_area.list_g_element.indexOf(cont.id)
      drawing_area.moveOrderElementInDA(idx_to_shift, drawing_area.list_g_element.length - 1)
    })
  }

  const moveToLastPlan = () => {
    drawing_area.selected_containers_list.forEach(cont => {
      const idx_to_shift = drawing_area.list_g_element.indexOf(cont.id)
      drawing_area.moveOrderElementInDA(idx_to_shift, 0)
    })
  }

  // Check if every transparent_border of selected zdt are the same as the first selected, if it true value is not indeterminate
  const valAllLabelBorderTransparent = selected_zdt[0]?.shape_border_visible ?? true

  const btn_mask_border = <Button onClick={() => {
    selected_zdt.forEach(zdt => zdt.shape_border_visible = !valAllLabelBorderTransparent)
    redrawAndRefresh()
  }} variant='contextmenu_button'>{valAllLabelBorderTransparent ? t('LL.display_border') : t('LL.hide_border')}</Button>


  const btn_change_color = <>
    <Button variant='contextmenu_button'>
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 3fr' }}>
        <label style={{ margin: 0 }}>{t('LL.cfl')}</label>
        <MenuColorPicker
          initialColor={(selected_zdt.length === 1) ? selected_zdt[0].shape_color : '#ffffff'}
          onColorChange={(new_color) => {
            selected_zdt.map(d => d.shape_color = new_color)
            redrawAndRefresh()
          }} />
      </Box>
    </Button>
  </>


  const button_open_layout = <Button onClick={() => {
    app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_menu_zdt.current(true)
    closeContextMenu()
  }}
  variant='contextmenu_button'
  rightIcon={app_data.icon_library.icon_popup_menu}
  >{t('Menu.LL')} </Button>


  // Detach all nodes from ZDT 
  const button_detach_all_tied_nodes = <Button onClick={() => {
    // Loop throught attached nodes in reverse index order to avoid problem when deleting element from array 
    for (let i = zdt_to_contextualise.attached_node.length - 1; i >= 0; i--) {
      zdt_to_contextualise.dettachNodeFromCont(zdt_to_contextualise.attached_node[i])
    }
    zdt_to_contextualise.tied_to_nodes = false
    zdt_to_contextualise.draw()
    closeContextMenu()
  }}
  variant='contextmenu_button'
  >{t('Menu.detachTiedNodes')} </Button>

  // Select nodes 'inside' zdt
  const btn_select_node_inside = <Button onClick={() => {
    zdt_to_contextualise.tied_to_nodes = true
    app_data.drawing_area.purgeSelection()
    getNodeInsideContextZDT()
      .forEach(n => {
        n.getListDescendantOfNode().forEach(node => {
          zdt_to_contextualise.attachNodeToCont(node)
          //new_data_plus.drawing_area.addNodeToSelection(node)
        })
        zdt_to_contextualise.attachNodeToCont(n)
      })
    zdt_to_contextualise.draw()
    closeContextMenu()
  }}
  variant='contextmenu_button'
  >{t('Menu.SNI')}
  </Button>

  const btn_move_to_first_plan = <Button
    variant='contextmenu_button'
    onClick={moveToFirstPlan}>
    {t('Noeud.firstPlan')}
  </Button>
  const btn_move_to_last_plan = <Button
    variant='contextmenu_button'
    onClick={moveToLastPlan}>
    {t('Noeud.lastPlan')}
  </Button>


  return zdt_to_contextualise ? <Box
    layerStyle='context_menu'
    id="context_zdd_pop_over"
    style={{
      inset: style_c_zdd,
      maxWidth: '100%',
      position: 'absolute',
      zIndex: '1',
    }}>
    <ButtonGroup orientation='vertical' isAttached>
      {zdt_to_contextualise.tied_to_nodes ? button_detach_all_tied_nodes : btn_select_node_inside}
      {sep}
      {btn_mask_border}
      {btn_change_color}
      {sep}
      {btn_move_to_first_plan}
      {btn_move_to_last_plan}
      {sep}
      {sep}
      {button_open_layout}
    </ButtonGroup>
  </Box> : <></>
}

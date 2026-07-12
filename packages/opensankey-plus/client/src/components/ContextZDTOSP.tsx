import { Box, Button, ButtonGroup, Divider, Menu, MenuButton, MenuList } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import React from 'react'
import { Class_ApplicationData } from '@terriflux/opensankey/src/types/ApplicationData'
import { MenuColorPicker } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { ButtonContainerContextAssignStyle } from '@terriflux/opensankey/src/components/dialogs/MenuContextWidgetFactory'
import { NodeActions } from '@terriflux/opensankey/src/components/dialogs/NodeActions'
import { useCloseContextMenuOnOutsideMouseDown } from '@terriflux/opensankey/src/components/dialogs/SankeyMenuContext'
import { downloadImageSource } from '@terriflux/opensankey/src/components/dialogs/SaveImage'
import { useModelBinding } from '@terriflux/opensankey/src/hooks/useModelBinding'

export const ContextZDT = (
  { app_data: app_data }: { app_data: Class_ApplicationData }
) => {
  const { t, drawing_area } = app_data

  const selected_zdt = app_data.drawing_area.selected_containers_list
  const zdt_to_contextualise = app_data.drawing_area.contextualised_container

  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_menu_context_container_updater)
  // Ferme le menu si l'utilisateur clique ailleurs (menu config, toolbar, dialogue…).
  // Appelé avant le early-return ci-dessous (règles des hooks).
  const menu_ref = useCloseContextMenuOnOutsideMouseDown(app_data, !!zdt_to_contextualise)
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
    refreshThis()
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    app_data.drawing_area.contextualised_container = undefined
    refreshThis()

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
  // const valAllLabelBorderTransparent = selected_zdt[0]?.shape_border_visible ?? true

  // const btn_mask_border = <Button onClick={() => {
  //   selected_zdt.forEach(zdt => zdt.shape_border_visible = !valAllLabelBorderTransparent)
  //   redrawAndRefresh()
  // }} variant='contextmenu_button'>{valAllLabelBorderTransparent ? t('LL.display_border') : t('LL.hide_border')}</Button>


  // const btn_change_color = <>
  //   <Button variant='contextmenu_button'>
  //     <Box style={{ display: 'grid', gridTemplateColumns: '1fr 3fr' }}>
  //       <label style={{ margin: 0 }}>{t('LL.cfl')}</label>
  //       <MenuColorPicker
  //         initialColor={(selected_zdt.length === 1) ? selected_zdt[0].shape_color : '#ffffff'}
  //         onColorChange={(new_color) => {
  //           selected_zdt.map(d => d.shape_color = new_color)
  //           redrawAndRefresh()
  //         }} />
  //     </Box>
  //   </Button>
  // </>

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
        })
        n.getListAncestorOfNode().forEach(node => {
          zdt_to_contextualise.attachNodeToCont(node)
        })
        zdt_to_contextualise.attachNodeToCont(n)
        zdt_to_contextualise.computeSizeAndPositionFromAttachedNodes()
      })
    zdt_to_contextualise.draw()
    closeContextMenu()
  }}
  variant='contextmenu_button'
  >{t('Menu.SNI')}
  </Button>

  const btn_fit_frame_to_attached = <Button
    variant='contextmenu_button'
    onClick={() => {
      zdt_to_contextualise.computeSizeAndPositionFromAttachedNodes()
      zdt_to_contextualise.draw()
      closeContextMenu()
    }}>
    {t('Menu.fitFrameToAttached')}
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

  const btn_copy = <Button
    variant='contextmenu_button'
    onClick={() => {
      const sankey = drawing_area.sankey
      const offset = 50
      drawing_area.purgeSelection()
      selected_zdt.forEach(container => {
        const new_container = sankey.addNewContainer(container.id + '_copy', container.name)
        new_container.copyFrom(container)
        new_container.position_x = container.position_x + offset
        new_container.position_y = container.position_y + offset
        new_container.draw()
        drawing_area.addElementToSelection(new_container)
      })
      closeContextMenu()
    }}>
    {t('Menu.copyElement')}
  </Button>

  const btn_edit_name = <Button
    variant='contextmenu_button'
    onClick={() => {
      if (!zdt_to_contextualise.name_label_is_visible) {
        zdt_to_contextualise.name_label_is_visible = true
        zdt_to_contextualise.drawNameLabel()
      }
      zdt_to_contextualise.setInputLabelVisible()
      closeContextMenu()
    }}>
    {t('Menu.editName')}
  </Button>

  // Télécharger l'image portée par le ZDT (icon_is_image) — n'apparaît que si
  // le container affiche réellement une image.
  const btn_save_image = (zdt_to_contextualise.icon_is_image && zdt_to_contextualise.icon_image_src)
    ? <Button
      variant='contextmenu_button'
      onClick={() => {
        downloadImageSource(zdt_to_contextualise.icon_image_src, zdt_to_contextualise.name || zdt_to_contextualise.id)
        closeContextMenu()
      }}>
      {t('Menu.saveImage')}
    </Button>
    : <></>

  // Alignement : réutilise les actions de NodeActions, qui opèrent à la fois sur
  // les nœuds et les zones de texte sélectionnés (parent commun Class_NodeBase).
  // Mêmes glyphes/clés de traduction (namespace ContextMenuNodes) que le menu nœud.
  const align_modifier = NodeActions.createModifier(app_data)
  const nb_alignable =
    drawing_area.selected_nodes_list.length + drawing_area.selected_containers_list.length

  const alignButton = (action: string, glyph: string, fn: () => void) => <Button
    key={action}
    variant='contextmenu_button'
    title={t('ContextMenuNodes.tooltips.' + action)}
    onClick={() => { fn(); closeContextMenu() }}>
    {glyph}
  </Button>

  const alignSubmenu = (
    titleKey: string,
    buttons: [string, string, () => void][]
  ) => <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className='dropdown-basic'>
      {t('ContextMenuNodes.' + titleKey)}
    </MenuButton>
    <MenuList as={Box} layerStyle='context_menu'>
      {buttons.map(([action, glyph, fn]) => alignButton(action, glyph, fn))}
    </MenuList>
  </Menu>

  const btn_align = (nb_alignable > 1) ? <Menu placement='end'>
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className='dropdown-basic'>
      {t('ContextMenuNodes.align')}
    </MenuButton>
    <MenuList as={Box} layerStyle='context_menu'>
      {alignSubmenu('alignHorizontal', [
        ['alignHorizMinLeft', '←▌□', align_modifier.alignHorizMinLeft],
        ['alignHorizMinCenter', '←▐□▌', align_modifier.alignHorizMinCenter],
        ['alignHorizMinRight', '←□▐', align_modifier.alignHorizMinRight],
        ['alignHorizMaxLeft', '▌□→', align_modifier.alignHorizMaxLeft],
        ['alignHorizMaxCenter', '▐□▌→', align_modifier.alignHorizMaxCenter],
        ['alignHorizMaxRight', '□▐→', align_modifier.alignHorizMaxRight],
      ])}
      {alignSubmenu('alignVertical', [
        ['alignVertMinTop', '↑▀', align_modifier.alignVertMinTop],
        ['alignVertMinCenter', '↑▄▀', align_modifier.alignVertMinCenter],
        ['alignVertMinBottom', '↑▄', align_modifier.alignVertMinBottom],
        ['alignVertMaxTop', '▀↓', align_modifier.alignVertMaxTop],
        ['alignVertMaxCenter', '▄▀↓', align_modifier.alignVertMaxCenter],
        ['alignVertMaxBottom', '▄↓', align_modifier.alignVertMaxBottom],
      ])}
    </MenuList>
  </Menu> : <></>

  return zdt_to_contextualise ? <Box
    ref={menu_ref}
    layerStyle='context_menu'
    id="context_zdd_pop_over"
    style={{
      inset: style_c_zdd,
      maxWidth: '100%',
      position: 'absolute',
      zIndex: '1',
    }}>
    <ButtonGroup orientation='vertical' isAttached>
      {btn_edit_name}
      {btn_save_image}
      {btn_copy}
      {btn_align}
      {zdt_to_contextualise.tied_to_nodes ? button_detach_all_tied_nodes : btn_select_node_inside}
      {zdt_to_contextualise.tied_to_nodes && zdt_to_contextualise.attached_node.length > 0 ? btn_fit_frame_to_attached : <></>}
      {btn_move_to_first_plan}
      {btn_move_to_last_plan}
      <ButtonContainerContextAssignStyle app_data={app_data} />
    </ButtonGroup>
  </Box> : <></>
}

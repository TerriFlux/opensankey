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

import React, { FC, MutableRefObject, useRef, useState } from 'react'

import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

import { ConfigMenuNumberInput } from '../configmenus/SankeyMenuConfiguration'
import { applyRandomColors } from '../../Algorithms/Colors'
import { BaseComponentProps } from '../SankeyMenuTypes'

const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
export const checked = (b: boolean) => <span style={{ margin: 'auto 0 auto auto' }}>{b ? '✓' : ''}</span>

interface ContextMenuButtonProps {
  children: React.ReactNode
}

export const ContextMenuButton: React.FC<ContextMenuButtonProps> = ({
  children
}) => {
  return (
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {children}
    </MenuButton>
  )
}

export const ContextMenuZdd: FC<BaseComponentProps> = ({
  new_data,
}) => {

  const { t, OSColorPicker } = new_data
  const [, setForceUpdate] = useState(0)
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void> = useRef((_: string | null | undefined) => null)
  ref_set_number_inputs.current(String(new_data.drawing_area.scale))
  new_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current = () => setForceUpdate(a => a + 1)
  const { dict_setter_show_dialog } = new_data.menu_configuration
  const {
    ref_setter_show_modal_styles_links_visual, ref_setter_show_modal_styles_links_labels,
    ref_setter_show_modal_styles_nodes_visual, ref_setter_show_modal_styles_nodes_labels
  } = dict_setter_show_dialog

  const indicateSankeyToSaveInCache = () => new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

  let style_c_zdd = '0px 0px auto auto'
  let is_top = true
  let pos_x = new_data.drawing_area.pointer_pos[0] + 10
  let pos_y = new_data.drawing_area.pointer_pos[1] - 20

  // The limit value of the mouse position that engages the shift of the context menu
  // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
  if (new_data.drawing_area.is_drawing_area_contextualised) {
    if (new_data.drawing_area.pointer_pos[0] + 450 > window.innerWidth) {
      pos_x = new_data.drawing_area.pointer_pos[0] - 455
    }

    if (new_data.drawing_area.pointer_pos[1] + 330 > window.innerHeight) {
      pos_y = new_data.drawing_area.pointer_pos[1] - 310
      is_top = false
    }
    style_c_zdd = pos_y + 'px auto auto ' + pos_x + 'px'
  }

  const closeContextMenu = () => {
    // Unset contextualized flow
    new_data.drawing_area.is_drawing_area_contextualised = false
    // Refresh this menu
    setForceUpdate(a => a + 1)
  }

  // Functions & undo ==========================================

  /**
   * Align node pos with grid lines & save it's undo
   *
   */
  const arrangeNodesToGrid = () => {
    const node_pos = Object.fromEntries(new_data.drawing_area.sankey.visible_nodes_list.map(n => [n.id, { x: n.display.position.x, y: n.display.position.y }]))

    const _arrangeNodesToGrid = () => {
      new_data.drawing_area.nodePositioning.arrangeNodesToGrid()
      indicateSankeyToSaveInCache()
    }

    const inv_arrangeNodesToGrid = () => {
      new_data.drawing_area.sankey.visible_nodes_list.forEach(n => {
        n.setPosXY(node_pos[n.id].x, node_pos[n.id].y)
      })
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_arrangeNodesToGrid)
    new_data.history.saveRedo(_arrangeNodesToGrid)
    // Execute original attr mutation
    _arrangeNodesToGrid()
    closeContextMenu()
  }

  /**
   * Update background grid visibility & save it's undo
   *
   */
  const bgGrid = () => {

    const _bgGrid = () => {
      new_data.drawing_area.grid_visible = !new_data.drawing_area.grid_visible
      setForceUpdate(a => a + 1)
      indicateSankeyToSaveInCache()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(_bgGrid)
    new_data.history.saveRedo(_bgGrid)
    // Execute original attr mutation
    _bgGrid()
    closeContextMenu()
  }

  /**
   * Update legend visibility & save it's undo
   *
   */
  const maskLegend = () => {

    const _maskLegend = () => {
      new_data.drawing_area.legend.masked = !new_data.drawing_area.legend.masked
      setForceUpdate(a => a + 1)
      indicateSankeyToSaveInCache()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(_maskLegend)
    new_data.history.saveRedo(_maskLegend)
    // Execute original attr mutation
    _maskLegend()
    closeContextMenu()
  }



  /**
   * Update DA scale & save it's undo
   *
   * @param {(number | null | undefined)} evt
   */
  const changeScale = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.scale = _
        indicateSankeyToSaveInCache()
        setForceUpdate(a => a + 1)
      }
      // Undo/redo done in setValueAndSaveHistory
      new_data.setValueAndSaveHistory(new_data.drawing_area, 'scale', evt, f)
    }
  }
  const setTrade = (close: boolean) => {
    if (!new_data.drawing_area.sankey.node_taggs_dict['type de noeud']) {
      return
    }
    new_data.drawing_area.bypass_redraws = true
    const process_nodes = new_data.drawing_area.sankey.nodes_list
    const echangeTag = new_data.drawing_area.sankey.node_taggs_dict['type de noeud'].tags_dict['echange']
    const import_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
    )
    const export_nodes = process_nodes.filter(n =>
      n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
    )
    if (close) {
      import_nodes.forEach((n, i) => {
        if (i == 0) n.sibling!.style = [
          new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportExportCloseStyle'],
        ]
        n.style = [
          new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportExportCloseStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportCloseStyle']
        ]
        n.getFirstOutputLink()!.style = [
          new_data.drawing_area.sankey.link_styles_dict['LinkImportExportCloseStyle'],
          new_data.drawing_area.sankey.link_styles_dict['LinkImportCloseStyle']
        ]
      })
      export_nodes.forEach(n => {
        n.style = [
          new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportExportCloseStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeExportCloseStyle']
        ]
        n.getFirstInputLink()!.style = [
          new_data.drawing_area.sankey.link_styles_dict['LinkImportExportCloseStyle'],
          new_data.drawing_area.sankey.link_styles_dict['LinkExportCloseStyle']
        ]
      })
    } else {
      import_nodes.forEach((n, i) => {
        if (i == 0) n.sibling!.style = [
          new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportExportAboveBelowStyle'],
        ]
        n.style = [
          new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportExportAboveBelowStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportAboveStyle']
        ]
        n.getFirstOutputLink()!.style = [
          new_data.drawing_area.sankey.link_styles_dict['LinkImportExportAboveBelowStyle'],
          new_data.drawing_area.sankey.link_styles_dict['LinkImportAboveStyle']
        ]
      })
      export_nodes.forEach(n => {
        n.style = [
          new_data.drawing_area.sankey.node_styles_dict['NodeSectorStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeImportExportAboveBelowStyle'],
          new_data.drawing_area.sankey.node_styles_dict['NodeExportBelowStyle']
        ]
        n.getFirstInputLink()!.style = [
          new_data.drawing_area.sankey.link_styles_dict['LinkImportExportAboveBelowStyle'],
          new_data.drawing_area.sankey.link_styles_dict['LinkExportBelowStyle']
        ]
      })
    }
    new_data.drawing_area.nodePositioning.arrangeTrade(true)
    new_data.drawing_area.draw()
  }


  // Buttons components ==============================================================

  const button_bg_color = <Button variant='contextmenu_button'>
    <Box style={{ display: 'flex', flex: '1 2' }}>
      <label htmlFor='color_bg_zdd' style={{ margin: 'auto auto auto 0' }}>{t('Menu.BgC')}</label>
      <Box w='100%'>
        <OSColorPicker
          initialColor={new_data.drawing_area.color}
          functionOnBlur={(new_color) => {
            new_data.drawing_area.color = new_color
            closeContextMenu()
          }}
        />
      </Box>
    </Box>
  </Button>

  const button_bg_grid = <Button variant='contextmenu_button' onClick={bgGrid}>{t('MEP.TCG')}{checked(new_data.drawing_area.grid_visible)}</Button>

  const button_assgn_rand_node_color = <Button variant='contextmenu_button' onClick={() => {
    applyRandomColors(new_data, new_data.drawing_area.sankey.nodes_list)
    indicateSankeyToSaveInCache()
    closeContextMenu()
  }}>{t('Menu.rand_node_color')}</Button>
  const button_assgn_rand_link_color = <Button variant='contextmenu_button' onClick={() => {
    applyRandomColors(new_data, new_data.drawing_area.sankey.links_list)
    indicateSankeyToSaveInCache()
    closeContextMenu()
  }}>{t('Menu.rand_link_color')}</Button>

  // Item to change sankey scale
  const dropdown_c_zdd_scale = <Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
        {t('MEP.Echelle')}
      </Box>
      <Box margin={'auto'}>
        <ConfigMenuNumberInput
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs}
          default_value={new_data.drawing_area.scale}
          function_on_blur={changeScale}
          minimum_value={1}
          stepper={false}
        />
      </Box>
    </Box>
  </Box>

  // Item to set vert and horiz shift and automatically position nodes
  const button_pa = <Button variant='contextmenu_button'
    onClick={() => {
      new_data.drawing_area.nodePositioning.computeAutoSankeyWithToast(false)
    }}>
    {t('MEP.PA')}
  </Button>

  // Item to display or mask the legend
  const button_mask_leg = <Button variant='contextmenu_button'
    onClick={maskLegend}>
    {!new_data.drawing_area.legend.masked ? t('MEP.hide_leg') : t('MEP.show_leg')}
  </Button>

  const button_an = <Button variant='contextmenu_button'
    onClick={arrangeNodesToGrid}>
    {t('MEP.AN')}
  </Button>

  const button_trade_close = <Button variant='contextmenu_button'
    onClick={() => setTrade(true)}>
    {t('MEP.importExportClose')}
  </Button>
  const button_trade_open = <Button variant='contextmenu_button'
    onClick={() => setTrade(false)}>
    {t('MEP.importExportAboveBelow')}
  </Button>
  const default_style = new_data.drawing_area.sankey.node_styles_dict['default']
  const button_parametric = <Button variant='contextmenu_button'
    onClick={() => {
      if (default_style.position_type == 'parametric')
        default_style.position_type = 'absolute'
      else
        default_style.position_type = 'parametric'

      new_data.drawing_area.sankey.nodes_list.forEach(n => n.position_v = -1)
      Object.values(new_data.drawing_area.sankey.nodes_dict)
        .filter(node => node.display.position.type !== 'relative')
        .forEach(node => {
          node.resetPositionAttribute('dy')
          node.applyPosition()
        }
        )
      if (default_style.position_type == 'parametric')
        new_data.drawing_area.nodePositioning.computeParametrization()
      setForceUpdate(a => a + 1)
    }}>
    {default_style.position_type == 'absolute' ? t('MEP.parametricMode') : t('MEP.absoluteMode')}
  </Button>
  const button_auto_x = <Button variant='contextmenu_button'
    onClick={() => {
      new_data.drawing_area.sankey.node_styles_dict['default'].position.auto_x = true 
      // new_data.drawing_area.sankey.nodes_list.forEach(n => n.position_v = -1)
      // Object.values(new_data.drawing_area.sankey.nodes_dict)
      //   .filter(node => node.display.position.type !== 'relative')
      //   .forEach(node => {
      //     node.resetPositionAttribute('dy')
      //     node.applyPosition()
      //   }
      //   )
      // new_data.drawing_area.nodePositioning.computeParametrization()
    }}>
    {'Auto x'}
  </Button>

  const style_links_visual = <Button
    variant='contextmenu_button'
    onClick={() => {
      ref_setter_show_modal_styles_links_visual.current(true)
    }}>
    {t('MEP.linkStyleVisual')}
  </Button>
  const style_links_labels = <Button
    variant='contextmenu_button'
    onClick={() => {
      ref_setter_show_modal_styles_links_labels.current(true)
    }}>
    {t('MEP.linkStyleLabels')}
  </Button>
  const style_nodes_visual = <Button
    variant='contextmenu_button'
    onClick={() => {
      ref_setter_show_modal_styles_nodes_visual.current(true)
    }}>
    {t('MEP.nodeStyleVisual')}
  </Button>
  const style_nodes_labels = <Button
    variant='contextmenu_button'
    onClick={() => {
      ref_setter_show_modal_styles_nodes_labels.current(true)
    }}>
    {t('MEP.nodeStyleLabels')}
  </Button>


  const button_reset = <Button
    variant='contextmenu_button'
    onClick={() => {
      new_data.reinitialization()
    }}
  >
    {new_data.t('Menu.from_new')}
  </Button>

  // Créer le sous-menu de positionnement
  const button_positioning = <Menu placement='end'>
    <ContextMenuButton>
      {t('MEP.Positionnement')} {/* ou 'MEP.MiseEnPage' ou 'MEP.Layout' */}
    </ContextMenuButton>
    <MenuList as={Box} layerStyle='context_menu'>
      {button_pa}
      {button_an}
      {button_trade_close}
      {button_trade_open}
      {button_parametric}
      {button_auto_x}
    </MenuList>
  </Menu>

  // Créer le sous-menu de gestion des couleurs
  const button_colors = <Menu placement='end'>
    <ContextMenuButton>
      {t('MEP.GestionCouleurs')}
    </ContextMenuButton>
    <MenuList as={Box} layerStyle='context_menu'>
      {button_assgn_rand_node_color}
      {button_assgn_rand_link_color}
    </MenuList>
  </Menu>

  // Créer le sous-menu Zone de dessin
  const button_drawing_area = <Menu placement='end'>
    <ContextMenuButton>
      {t('MEP.ZoneDessin')} {/* ou MEP.Affichage, MEP.Visualisation, MEP.Interface */}
    </ContextMenuButton>
    <MenuList as={Box} layerStyle='context_menu'>
      {button_bg_grid}
      {dropdown_c_zdd_scale}
      {button_mask_leg}
      {button_bg_color}
    </MenuList>
  </Menu>
  const style_menu = <Menu placement='end'>
    <ContextMenuButton>
      {t('MEP.Style')} {/* ou MEP.Affichage, MEP.Visualisation, MEP.Interface */}
    </ContextMenuButton>
    <MenuList as={Box} layerStyle='context_menu'>
      {style_nodes_visual}
      {style_nodes_labels}
      {style_links_visual}
      {style_links_labels}
    </MenuList>
  </Menu>


  // Dans le return principal :
  return new_data.drawing_area.is_drawing_area_contextualised ? <Box
    id="context_zdd_pop_over"
    layerStyle='context_menu'
    className={'context_popover ' + (is_top ? '' : 'at_bot')}
    style={{ maxWidth: '100%', position: 'absolute', zIndex: '1', inset: style_c_zdd }}>
    <ButtonGroup isAttached orientation='vertical'>
      {button_reset}
      {button_drawing_area}
      {button_positioning}
      {button_colors}
      {style_menu}
    </ButtonGroup>
  </Box> : <></>
}
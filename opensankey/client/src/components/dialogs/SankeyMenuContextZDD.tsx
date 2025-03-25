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

import * as d3 from 'd3'
import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'

import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  NumberInput,
  NumberInputField
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

import { FCType_ContextMenuZdd } from './types/SankeyMenuContextZDDTypes'
import { GetRandomInt, list_palette_color } from '../../types/Utils'
import { ConfigMenuNumberInput } from '../configmenus/SankeyMenuConfiguration'
import { OSColorPicker } from '../configmenus/OSColorPicker'

const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
const checked = (b: boolean) => <span style={{ float: 'right' }}>{b ? '✓' : ''}</span>

export const ContextMenuZdd: FunctionComponent<FCType_ContextMenuZdd> = ({
  new_data,
}) => {

  const { t } = new_data
  const [forceUpdate, setForceUpdate] = useState(false)
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void> = useRef((_: string | null | undefined) => null)
  ref_set_number_inputs.current(String(new_data.drawing_area.scale))
  new_data.menu_configuration.ref_to_menu_context_drawing_area_updater.current = () => setForceUpdate(!forceUpdate)

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

  // Functions & undo ==========================================

  /**
   * Align node pos with grid lines & save it's undo
   *
   */
  const arrangeNodesToGrid = () => {
    const node_pos = Object.fromEntries(new_data.drawing_area.sankey.visible_nodes_list.map(n => [n.id, { x: n.display.position.x, y: n.display.position.y }]))

    const _arrangeNodesToGrid = () => {
      new_data.drawing_area.arrangeNodesToGrid()
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
  }

  /**
   * Update background grid visibility & save it's undo
   *
   */
  const bgGrid = () => {

    const _bgGrid = () => {
      new_data.drawing_area.grid_visible = !new_data.drawing_area.grid_visible
      setForceUpdate(!forceUpdate)
      indicateSankeyToSaveInCache()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(_bgGrid)
    new_data.history.saveRedo(_bgGrid)
    // Execute original attr mutation
    _bgGrid()
  }

  /**
   * Update legend visibility & save it's undo
   *
   */
  const maskLegend = () => {

    const _maskLegend = () => {
      new_data.drawing_area.legend.masked = !new_data.drawing_area.legend.masked
      setForceUpdate(!forceUpdate)
      indicateSankeyToSaveInCache()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(_maskLegend)
    new_data.history.saveRedo(_maskLegend)
    // Execute original attr mutation
    _maskLegend()
  }

  /**
   * Update color of node with random palette & save it's undo
   *
   */
  const randColor = () => {
    const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
    const size_color = new_data.drawing_area.sankey.nodes_list.length
    const old_color = Object.fromEntries(new_data.drawing_area.sankey.nodes_list.map(n => [n.id, n.shape_color]))
    const _randColor = () => {
      for (const i in d3.range(size_color)) {
        new_data.drawing_area.sankey.nodes_list[i].shape_color = (d3.color(color_selected(+i / size_color))?.formatHex() as string)
      }
      indicateSankeyToSaveInCache()
    }

    const inv_randColor = () => {
      new_data.drawing_area.sankey.nodes_list.forEach(n => n.shape_color = old_color[n.id])
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_randColor)
    new_data.history.saveRedo(_randColor)
    // Execute original attr mutation
    _randColor()
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
        setForceUpdate(!forceUpdate)
      }
      // Undo/redo done in setValueAndSaveHistory
      new_data.setValueAndSaveHistory(new_data.drawing_area, 'scale', evt, f)
    }
  }


  // Buttons components ==============================================================

  const button_bg_color = <Button variant='contextmenu_button'>
    <Box style={{display:'grid',gridTemplateColumns:'1fr 3fr'}}>
      <label htmlFor='color_bg_zdd' style={{ margin: 0 }}>{t('Menu.BgC')}</label>
      <OSColorPicker
        initialColor={new_data.drawing_area.color}
        functionOnBlur={(new_color) => {
          new_data.drawing_area.color = new_color
        }}
      />
    </Box>
  </Button>

  const button_bg_grid = <Button variant='contextmenu_button' onClick={bgGrid}>{t('MEP.TCG')}{checked(new_data.drawing_area.grid_visible)}</Button>

  const button_assgn_rand_node_color = <Button variant='contextmenu_button' onClick={randColor}>{t('Menu.rand_node_color')}</Button>

  // Item to change sankey scale
  const dropdown_c_zdd_scale = <Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
        {t('MEP.Echelle')}
      </Box>
      <ConfigMenuNumberInput
        ref_to_set_value={ref_set_number_inputs}
        default_value={new_data.drawing_area.scale}
        function_on_blur={changeScale}
        minimum_value={1}
        stepper={false}
      />
    </Box>
  </Box>

  // Item to set vert and horiz shift and automatically position nodes
  const button_pa = <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('MEP.PA')}
    </MenuButton>
    <MenuList as={Box} layerStyle='context_menu' >
      {/* Set horizontal value for automatic positionning */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
          {t('MEP.Horizontal')}
        </Box>

        <NumberInput
          variant='menuconfigpanel_option_numberinput_with_right_addon'
          min={0}
          value={new_data.drawing_area.horizontal_spacing}
          onChange={evt => {
            new_data.drawing_area.horizontal_spacing = +evt
            indicateSankeyToSaveInCache()
            setForceUpdate(!forceUpdate)
          }}>
          <NumberInputField />
        </NumberInput>
      </Box>

      {/* Set vertical value for automatic positionning */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
          {t('MEP.Vertical')}
        </Box>

        <NumberInput
          variant='menuconfigpanel_option_numberinput_with_right_addon'
          min={0}
          value={new_data.drawing_area.vertical_spacing}
          onChange={evt => {
            new_data.drawing_area.vertical_spacing = +evt
            indicateSankeyToSaveInCache()
            setForceUpdate(!forceUpdate)
          }}>
          <NumberInputField />
        </NumberInput>
      </Box>

      <Button variant='contextmenu_button'
        onClick={() => {
          new_data.drawing_area.computeAutoSankey(false)
        }}>
        {t('MEP.PA_action')}
      </Button>
    </MenuList>
  </Menu>

  // Item to display or mask the legend
  const button_mask_leg = <Button variant='contextmenu_button'
    onClick={maskLegend}>
    {!new_data.drawing_area.legend.masked ? t('MEP.hide_leg') : t('MEP.show_leg')}
  </Button>

  const button_an = <Button variant='contextmenu_button'
    onClick={arrangeNodesToGrid}>
    {t('MEP.AN')}
  </Button>

  let full = t('fullscreen')
  if (!document.fullscreenElement) {
    full = t('fullscreen')
  } else {
    full = t('exitFullscreen')
  }

  const button_fullscreen = <Button variant='contextmenu_button'
    onClick={() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      new_data.drawing_area.is_drawing_area_contextualised = false
    }}
  >
    {full}
  </Button>

  // Item to open a draggable modal with the configuration menu of the draw area
  const button_open_layout = <Button onClick={() => {
    new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_menu_layout.current(true)
    new_data.drawing_area.is_drawing_area_contextualised = false
  }}
    variant='contextmenu_button'
    rightIcon={new_data.icon_library.icon_popup_menu}
  >
    {t('Menu.MEP')}
  </Button>

  return new_data.drawing_area.is_drawing_area_contextualised ? <Box
    id="context_zdd_pop_over"
    layerStyle='context_menu'
    className={'context_popover ' + (is_top ? '' : 'at_bot')}

    style={{ maxWidth: '100%', position: 'absolute', zIndex: '1', inset: style_c_zdd }}>
    <ButtonGroup isAttached orientation='vertical'>
      {button_pa}
      {button_an}
      {sep}
      {button_assgn_rand_node_color}
      {sep}

      {button_bg_color}
      {button_bg_grid}
      {dropdown_c_zdd_scale}
      {button_mask_leg}
      {sep}
      {button_open_layout}
      {sep}
      {button_fullscreen}

    </ButtonGroup>
  </Box> : <></>
}
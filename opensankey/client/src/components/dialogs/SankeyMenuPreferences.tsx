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

// External imports
import React, { FunctionComponent, useRef, useState } from 'react'
import { Box, Button, Select } from '@chakra-ui/react'
import i18next from 'i18next'

// Internal types / classes
import {
  FCType_ModalPreference
} from './types/SankeyMenuPreferencesTypes'

// Internal components / functions
import { OSTooltip } from '../../types/Utils'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { ConfigMenuTextInput } from '../configmenus/SankeyMenuConfiguration'

// COMPONENTS ===========================================================================
export const ModalPreference: FunctionComponent<FCType_ModalPreference> = (
  {
    new_data
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { t } = new_data

  // Component updater ------------------------------------------------------------------
  const [, setUpdate] = useState(0)


  new_data.menu_configuration.ref_to_modal_pref_updater.current = () => {
    setUpdate(a => a + 1)
  }

  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Update input data value
  ref_set_text_value_input.current(new_data.node_label_separator)

  // JSX Component ----------------------------------------------------------------------
  const node_label_sep = <OSTooltip label={t('Menu.tooltips.node_label_sep')}>
    <Box layerStyle='menuconfigpanel_row_2cols_little_input' >
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep')}</Box>
      <ConfigMenuTextInput
        ref_to_set_value={ref_set_text_value_input}
        function_get_value={() => { return new_data.node_label_separator }}
        function_on_blur={(_) => {
          const tmp = _ ? _ : ''
          new_data.node_label_separator = tmp
          new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
        }}
      />
    </Box>
  </OSTooltip>

  const node_label_sep_pos = <OSTooltip label={t('Menu.tooltips.node_label_sep_pos')}>
    <Box layerStyle='menuconfigpanel_row_2cols_little_input' >
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep_pos')}</Box>
      <Box layerStyle='options_2cols'>
        <Button variant={new_data.node_label_separator_part == 'before' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
          onClick={() => {
            new_data.node_label_separator_part = 'before'
            new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
            setUpdate(a => a + 1)
          }
          }
        >
          {t('Menu.before')}
        </Button>
        <Button variant={new_data.node_label_separator_part == 'after' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
          onClick={() => {
            new_data.node_label_separator_part = 'after'
            new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
            setUpdate(a => a + 1)
          }
          }
        >
          {t('Menu.after')}
        </Button>
      </Box>
    </Box>
  </OSTooltip>

  const ui = {
    'lang': <Box layerStyle='menuconfigpanel_row_2cols_little_input' >

      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.lang')}</Box>
      <Select
        variant='menuconfigpanel_option_select'
        value={i18next.language}
        onChange={evt => {
          new_data.language=evt.target.value
          new_data.saveInCache() // Save data in cache because change language re-render the app from index
          new_data.i18n.changeLanguage(evt.target.value)
          new_data.menu_configuration.updateAllMenuComponents()
          new_data.draw()
        }}
      >
        <option key={'francais'} value={'fr'}>Français</option>
        <option key={'english'} value={'en'}>English</option>
      </Select>
    </Box>,
    
    'sep':<hr style={{
      borderStyle: 'none',
      margin: '10px',
      color: 'grey',
      backgroundColor: 'grey',
      height: 1
    }}/>,
    
    'node_label_sep': <>{node_label_sep}{node_label_sep_pos}</>,
  }

  const content = <>
    {Object.values(ui).map((d, i) => <React.Fragment key={i}>{d}</React.Fragment>)}
  </>

  return <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_preference'}
    content={content}
    title={t('Menu.title_pref')}
  />
}


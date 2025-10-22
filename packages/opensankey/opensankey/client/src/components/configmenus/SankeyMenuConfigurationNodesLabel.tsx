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
import { Box, Button } from '@chakra-ui/react'
import { NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributesConfig'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import {
  CheckboxWithColorPicker, ElementAttrSetterNumberInput2Cols, ElementAttrSetterTextInput2Cols,
  MenuSectionCheckbox, OSTooltip, updateElements, ValueKey
} from './MenuCommon'
import { SankeyMenuLabelComponent } from './MenuLabel'
import { MenuUnit } from './MenuUnit'
import { SankeyMenuValueLabelComponent } from './MenuValueLabel'
import { SankeyNodeSelectionSimple } from './SankeyMenuConfigurationNodes'
import { Class_ApplicationData } from '../../types/ApplicationData'


export const MenuConfigurationNodeContext = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  const { t, drawing_area, menu_configuration } = app_data
  const { selected_nodes_list_sorted, visible_and_selected_nodes_list_sorted } = drawing_area
  const { ref_selected_style_node, is_selector_only_for_visible_nodes } = menu_configuration
  const { sankey } = drawing_area

  // Elements on which this menu applies ------------------------------------------------
  const selected_nodes = !is_selector_only_for_visible_nodes ?
    selected_nodes_list_sorted :
    visible_and_selected_nodes_list_sorted

  // Elements on which menu modification applies
  const elements = menu_for_style ? [sankey.node_styles_dict[ref_selected_style_node.current]] : selected_nodes
  const element_ref = elements[0]
  const name_label_is_visible = (element_ref?.name_label_is_visible ?? NODES_ATTRIBUTES_CONFIG.name_label_is_visible.default)
  const value_label_is_visible = (element_ref?.value_label_is_visible ?? NODES_ATTRIBUTES_CONFIG.value_label_is_visible.default)

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Node this menu's update function
  if (!menu_for_style) {
    menu_configuration.ref_to_menu_config_nodes_apparence_context_updater.current = () => setCount(a => a + 1)
  } else {
    menu_configuration.ref_to_menu_config_nodes_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    menu_configuration.updateComponentRelatedToNodesApparence()
  }

  const content_label =
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.labels'
      attributeKey={'name_label_is_visible'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {
        name_label_is_visible ? <><SankeyMenuLabelComponent
          new_data={app_data}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'name_'} />
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={'Noeud.labels'}
          attributeKey={'name_label_box_width' as ValueKey}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          unit_text='pixels'
        />
        {/* Position horizontal du label par rapport à l'ancre*/}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={'Noeud.labels'}
          attributeKey={'name_label_horiz_shift' as ValueKey}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          unit_text='pixels'
        />
        {/* Position vertical du label par rapport à l'ancre*/}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={'Noeud.labels'}
          attributeKey={'name_label_vert_shift' as ValueKey}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          unit_text='pixels'
        />
        <ElementAttrSetterTextInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={'Noeud.labels'}
          attributeKey={'name_label_separator' as ValueKey}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        />
        {/* Masquer une partie des noms des noeuds */}
        <OSTooltip label={t('Menu.tooltips.node_label_sep_pos')}>
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep_pos')}</Box>
            <Box layerStyle='options_2cols'>
              <Button variant={element_ref?.name_label_separator_part == 'before' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
                onClick={() => {
                  updateElements(app_data, elements, 'name_label_separator_part' as ValueKey, 'before', refreshThisAndUpdateRelatedComponents)
                }}
              >
                {t('Menu.before')}
              </Button>
              <Button variant={element_ref?.name_label_separator_part == 'after' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
                onClick={() => {
                  updateElements(app_data, elements, 'name_label_separator_part' as ValueKey, 'after', refreshThisAndUpdateRelatedComponents)
                }}
              >
                {t('Menu.after')}
              </Button>
            </Box>
          </Box>
        </OSTooltip>
        </> : <></>
      }
    </MenuSectionCheckbox>

  const content_label_value = <MenuSectionCheckbox
    app_data={app_data}
    elements={elements}
    attributePath='Noeud.labels'
    attributeKey={'value_label_is_visible'}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {value_label_is_visible ? <>
      <SankeyMenuLabelComponent
        new_data={app_data}
        elements={elements}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        prefix={'value_'} />
      <SankeyMenuValueLabelComponent
        new_data={app_data}
        elements={elements}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        prefix={'value_'} />
      {/* Position horizontal du label par rapport à l'ancre*/}
      <ElementAttrSetterNumberInput2Cols
        app_data={app_data}
        elements={elements}
        attributePath={'Noeud.labels'}
        attributeKey={'value_label_horiz_shift' as ValueKey}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        unit_text='pixels'
      />
      {/* Position vertical du label par rapport à l'ancre*/}
      <ElementAttrSetterNumberInput2Cols
        app_data={app_data}
        elements={elements}
        attributePath={'Noeud.labels'}
        attributeKey={'value_label_vert_shift' as ValueKey}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        unit_text='pixels'
      />

    </> : <></>}
  </MenuSectionCheckbox>

  return <Box layerStyle='box_content_config'>
    {menu_for_style ? <></> : <SankeyNodeSelectionSimple new_data={app_data} />}
    {menu_for_style ? <></> : <ConfigMenuStyleElement
      app_data={app_data}
      selected_elements={selected_nodes}
      config={NODES_ATTRIBUTES_CONFIG}
      categories={['value_label', 'name_label']}
      nodesOrLinks={'nodes'} />}
    {elements.length > 0 ? <>
      {content_label}
      {content_label_value}
      {<MenuUnit
        new_data={app_data}
        elements={elements}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents} />} </> : <></>}
  </Box>
}

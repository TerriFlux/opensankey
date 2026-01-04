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
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import {
  ElementAttrSetterTextInput2Cols,
  ElementsType,
  getElementsLabelValues,
  getIconValues,
  getNodesLabelValues,
  MenuSectionCheckbox, OSTooltip
} from './MenuCommon'
import { SankeyMenuLabelComponent } from './MenuLabel'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { ICON_LABEL_BASE_CONFIG, LINKS_ATTRIBUTES_CONFIG, NAME_LABEL_CONFIG, NODES_ATTRIBUTES_CONFIG, VALUE_LABEL_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { SankeyLinkSelectionSimple, SankeyNodeSelectionSimple, SankeyContainerSelectionSimple } from './MenuSelectionElements'


// Composant générique factorisant NodeLabel, LinkLabel et ContainerLabel
const MenuConfigurationLabel = ({
  app_data,
  menu_for_style,
  elementType // 'nodes', 'links' ou 'containers'
}: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean,
  elementType: 'nodes' | 'links' | 'containers'
}) => {
  const { t, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area

  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // ✅ Configuration selon le type
  const config = elementType === 'nodes' ? {
    selectedRef: menu_configuration.ref_selected_style_node,
    stylesDict: sankey.node_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_nodes
      ? drawing_area.selected_nodes_list_sorted
      : drawing_area.visible_and_selected_nodes_list_sorted,
    visibleList: sankey.visible_nodes_list,
    attributePath: 'Noeud.labels',
    attributesConfig: NODES_ATTRIBUTES_CONFIG,
    updateApparenceRef: menu_configuration.ref_to_menu_config_nodes_apparence_context_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_nodes_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToNodesApparence(),
    updateStyle: () => menu_configuration.updateComponentRelatedToNodesStyles(),
    SelectionComponent: SankeyNodeSelectionSimple,
    hasExtraFields: true // separator, separator_part
  } : elementType === 'containers' ? {
    selectedRef: menu_configuration.ref_selected_style_container,
    stylesDict: sankey.container_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_containers
      ? drawing_area.selected_containers_list_sorted
      : drawing_area.visible_and_selected_containers_list_sorted,
    visibleList: sankey.drawing_area.visible_containers_list,
    attributePath: 'Noeud.labels',
    attributesConfig: NODES_ATTRIBUTES_CONFIG, // ✅ Utilise la même config que nodes
    updateApparenceRef: menu_configuration.ref_to_menu_config_containers_apparence_context_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_containers_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToContainersApparence(),
    updateStyle: () => menu_configuration.updateComponentRelatedToContainersStyles(),
    SelectionComponent: SankeyContainerSelectionSimple,
    hasExtraFields: true // separator, separator_part (comme nodes)
  } : {
    selectedRef: menu_configuration.ref_selected_style_link,
    stylesDict: sankey.link_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_links
      ? drawing_area.selected_links_list_sorted
      : drawing_area.visible_and_selected_links_list_sorted,
    visibleList: sankey.visible_links_list,
    attributePath: 'Flux.labels',
    attributesConfig: LINKS_ATTRIBUTES_CONFIG,
    updateApparenceRef: menu_configuration.ref_to_menu_config_links_apparence_context_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_links_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToLinksApparence(),
    updateStyle: () => {
      menu_configuration.updateAllComponentsRelatedToLinks()
      menu_configuration.updateComponentRelatedToLinksStyles()
    },
    SelectionComponent: SankeyLinkSelectionSimple,
    hasExtraFields: false
  }

  // ✅ Assigner les updaters
  if (!menu_for_style) {
    config.updateApparenceRef.current = () => setCount(a => a + 1)
  } else {
    config.updateStyleRef.current = () => setCountStyle(a => a + 1)
  }

  const elements = (menu_for_style
    ? [config.stylesDict[config.selectedRef.current]]
    : config.selectedList) as ElementsType

  const refreshThisAndUpdateRelatedComponents = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      config.updateStyle()
      config.visibleList.forEach(el => el.draw())
    }
    config.updateApparence()
  }

  const nameLabelValues = elements.length > 0
    ? (elementType === 'nodes' || elementType === 'containers'
      //@ts-expect-error xxx 
      ? getNodesLabelValues(elements, 'name_label', refreshThisAndUpdateRelatedComponents)
      : getElementsLabelValues(elements, 'name_label', refreshThisAndUpdateRelatedComponents))
    : Object.fromEntries(
      Object.entries(NAME_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof NAME_LABEL_CONFIG]: ReturnType<typeof NAME_LABEL_CONFIG[K]['type']> }

  const valueLabelValues = elements.length > 0
    ? getElementsLabelValues(elements, 'value_label', refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(VALUE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof VALUE_LABEL_CONFIG]: ReturnType<typeof VALUE_LABEL_CONFIG[K]['type']> }

  const iconValues = elements.length > 0
    ? getIconValues(elements, refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(ICON_LABEL_BASE_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof ICON_LABEL_BASE_CONFIG]: ReturnType<typeof ICON_LABEL_BASE_CONFIG[K]['type']> }

  const content_name_label = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'is_visible'}
      config={NAME_LABEL_CONFIG}
      prefix={'name_label'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {/* ✅ Champs extra pour nodes et containers uniquement */}
      {config.hasExtraFields && (
        <Box layerStyle='options_2cols'>
          <ElementAttrSetterTextInput2Cols
            app_data={app_data}
            elements={elements}
            attributePath={config.attributePath}
            attributeKey={'separator'}
            prefix={'name_label'}
            config={NAME_LABEL_CONFIG}
            refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          />
          <OSTooltip label={t('Menu.tooltips.name_label_separator')}>
            <Box layerStyle='options_2cols'>
              <Button
                //@ts-expect-error xxx 
                variant={nameLabelValues.separator_part == 'before'
                  ? 'menuconfigpanel_option_button_activated_left'
                  : 'menuconfigpanel_option_button_left'}
                onClick={() => {       //@ts-expect-error xxx 
                  nameLabelValues.separator_part = 'before'
                }}
              >
                {t('Menu.before')}
              </Button>
              <Button
                variant={      //@ts-expect-error xxx 
                  nameLabelValues.separator_part == 'after'
                    ? 'menuconfigpanel_option_button_activated_right'
                    : 'menuconfigpanel_option_button_right'}
                onClick={() => { 
                  //@ts-expect-error xxx 
                  nameLabelValues.separator_part = 'after' }}
              >
                {t('Menu.after')}
              </Button>
            </Box>
          </OSTooltip>
        </Box>
      )}

      {nameLabelValues.is_visible && (
        <SankeyMenuLabelComponent
          app_data={app_data}
          attributePath={config.attributePath}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'name_label'}
        />
      )}
    </MenuSectionCheckbox>
  )

  const content_illustration = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'is_visible'}
      config={ICON_LABEL_BASE_CONFIG}
      prefix={'icon'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {iconValues.is_visible && (
        <SankeyMenuLabelComponent
          app_data={app_data}
          attributePath={config.attributePath}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'icon'}
        />
      )}
    </MenuSectionCheckbox>
  )

  const content_value_label = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'is_visible'}
      config={VALUE_LABEL_CONFIG}
      prefix={'value_label'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {valueLabelValues.is_visible && (
        <SankeyMenuLabelComponent
          app_data={app_data}
          elements={elements}
          attributePath={config.attributePath}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'value_label'}
        />
      )}
    </MenuSectionCheckbox>
  )

  return (
    <Box layerStyle='box_content_config'>
      {!menu_for_style && <config.SelectionComponent app_data={app_data} />}
      {!menu_for_style && (
        <ConfigMenuStyleElement
          app_data={app_data}
          selected_elements={config.selectedList}
          config={config.attributesConfig}
          categories={['value_label', 'name_label']}
          nodesOrLinks={elementType === 'containers' ? 'nodes' : elementType} // ✅ containers utilise 'nodes' pour la config
        />
      )}
      {elements.length > 0 && (
        <>
          {elementType === 'links' ? (
            <>
              {content_value_label}
              {content_name_label}
              {content_illustration}
            </>
          ) : (
            // nodes ET containers ont le même ordre
            <>
              {content_name_label}
              {content_value_label}
              {content_illustration}
            </>
          )}
        </>
      )}
    </Box>
  )
}

// ✅ Wrappers pour compatibilité
export const MenuConfigurationNodeLabel = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  return <MenuConfigurationLabel
    app_data={app_data}
    menu_for_style={menu_for_style}
    elementType='nodes'
  />
}

export const MenuConfigurationLinkLabel = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  return <MenuConfigurationLabel
    app_data={app_data}
    menu_for_style={menu_for_style}
    elementType='links'
  />
}

// ✅ Nouveau wrapper pour containers
export const MenuConfigurationContainersLabel = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  return <MenuConfigurationLabel
    app_data={app_data}
    menu_for_style={menu_for_style}
    elementType='containers'
  />
}
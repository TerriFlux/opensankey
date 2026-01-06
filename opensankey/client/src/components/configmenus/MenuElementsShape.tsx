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
import { Box, Button, Checkbox, InputGroup, Select, Divider } from '@chakra-ui/react'

import { Class_LinkElement } from '../../Elements/Link'
import { Class_ElementStyle } from '../../Elements/Element'
import { default_style_id } from '../../types/Utils'
import {
  WrapperBoxSubSectionMenu, ElementAttrSetterNumberInput2Cols, MenuSectionCheckbox,
  ConfigMenuNumberInput
  } from './MenuCommon'
import {
  getShapeValues, getLinkShapeValues, getNodeShapeValues,
  ElementsType
} from '../../Elements/ElementsAttributesConfig'
import { SankeyLinkSelectionSimple, SankeyNodeSelectionSimple, SankeyContainerSelectionSimple } from './MenuElementsSelection'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import {
  BASE_SHAPE_CONFIG, isLinkShapeSpecificValueIndeterminate,
  LINKS_SHAPE_SPECIFIC_CONFIG, LINKS_ATTRIBUTES_CONFIG,
  Type_Shape, isNodeShapeSpecificValueIndeterminate, NODE_SHAPE_SPECIFIC_CONFIG,
  NODES_ATTRIBUTES_CONFIG
} from '../../Elements/ElementsAttributesConfig'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { getShapeAttributeKey, isShapeValueIndeterminate, ShapePrefix } from '../../Elements/ElementsAttributesConfig'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { MenuColorPicker } from './MenuCommon'

interface MenuShapeAttributesProps {
  app_data: Class_ApplicationData
  elements?: Class_NodeBase[] | Class_LinkElement[] | Class_ElementStyle[] | Class_ContainerElement[]
  attributePath?: string
  prefix?: ShapePrefix
  disable_attr_props?: Record<string, boolean>
  refreshUI?: () => void
}

export const MenuShapeAttributes = ({
  app_data,
  elements: initialElements,
  attributePath: initialAttributePath,
  prefix: initialPrefix,
  disable_attr_props: initialDisableAttrProps,
  refreshUI: initialRefreshUI
}: MenuShapeAttributesProps) => {
  const { t, icon_library } = app_data
  const { icon_locked, icon_unlocked } = icon_library

  const [state, setState] = useState({
    elements: initialElements,
    attributePath: initialAttributePath,
    prefix: initialPrefix,
    disable_attr_props: initialDisableAttrProps,
    refreshUI: initialRefreshUI
  })

  if (!initialElements) {
    app_data.menu_configuration.r_shape_attributes_set_elements.current = (
      _elements: Class_NodeBase[] | Class_LinkElement[] | Class_ElementStyle[] | Class_ContainerElement[],
      _attributePath: string,
      _prefix: ShapePrefix,
      _disable_attr_props: Record<string, boolean>,
      _refreshUI: () => void) => {
      setState({
        elements: _elements,
        attributePath: _attributePath,
        prefix: _prefix,
        disable_attr_props: _disable_attr_props,
        refreshUI: _refreshUI
      })
    }
  }

  const { elements, attributePath, prefix, disable_attr_props, refreshUI } = state
  if (!elements || !attributePath || !disable_attr_props || !prefix || !refreshUI) return <></>

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  const config = BASE_SHAPE_CONFIG
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[] | Class_ContainerElement[]

  const shapeValues = elements.length > 0
    ? getShapeValues(elements, prefix, refreshUI)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof config]: ReturnType<typeof config[K]['type']> }

  return (
    <>
      {/* Fond visible + Couleur */}
      <Box as='span' layerStyle='options_2cols'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={isShapeValueIndeterminate(elements, prefix, 'color_visible') ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color_visible')]}
          isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'color_visible')}
          isChecked={shapeValues.color_visible}
          onChange={(evt) => {
            shapeValues.color_visible = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color_visible')}`) || 'Afficher le fond'}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'color_visible')}`) || 'Fond visible'}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'color_visible'}
                config={config}
                prefix={prefix}
              /> : <></>}
          </OSTooltip>
        </Checkbox>
        <Box layerStyle='option_with_activation'>
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color')}`)}>
            <Box>
              <MenuColorPicker
                isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color')]}
                initialColor={shapeValues.color}
                onColorChange={(new_color) => {
                  shapeValues.color = new_color
                }}
              />
            </Box>
          </OSTooltip>
          <OSTooltip label={t(`${attributePath}.tooltips.color_sustainable`)}>
            <Button
              isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color_sustainable')]}
              variant={
                shapeValues.color_sustainable ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                shapeValues.color_sustainable = !shapeValues.color_sustainable
              }}
            >
              {shapeValues.color_sustainable ? icon_locked : icon_unlocked}
              {!menu_for_style ?
                <TooltipElementOverloaded
                  elements={base_elements}
                  t={t}
                  attributeKey={'color_sustainable'}
                  config={config}
                  prefix={prefix}
                /> : <></>}
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      <Box as='span' layerStyle='options_2cols'>
        {/* Shape Opacity */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'opacity'}
          prefix={prefix}
          config={BASE_SHAPE_CONFIG}
          refreshParentComponent={refreshUI}
          unit_text=''
          minimum_value={0}
          maximum_value={1}
          step={0.1}
          stepper={true}
        />
        {/* Radius */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'border_radius'}
          prefix={prefix}
          config={BASE_SHAPE_CONFIG}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true}
        />
      </Box>

      {/* Bordure visible + Couleur */}
      <Box as='span' layerStyle='options_2cols'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={isShapeValueIndeterminate(elements, prefix, 'border_visible') ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_visible')]}
          isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'border_visible')}
          isChecked={shapeValues.border_visible}
          onChange={(evt) => {
            shapeValues.border_visible = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_visible')}`) || 'Afficher la bordure'}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_visible')}`) || 'Bordure visible'}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'border_visible'}
                config={config}
                prefix={prefix} /> : <></>}
          </OSTooltip>
        </Checkbox>

        <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_color')}`) || 'Couleur de la bordure'}>
          <MenuColorPicker
            isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_color')]}
            initialColor={shapeValues.border_color}
            onColorChange={(new_color) => {
              shapeValues.border_color = new_color
            }}
          />
        </OSTooltip>
      </Box>

      <Box as='span' layerStyle='options_2cols'>
        {/* Épaisseur */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'border_thickness'}
          config={BASE_SHAPE_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true}
        />

        {/* Pointillés */}
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={isShapeValueIndeterminate(elements, prefix, 'border_dashed') ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_dashed')]}
          isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'border_dashed')}
          isChecked={shapeValues.border_dashed}
          onChange={(evt) => {
            shapeValues.border_dashed = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_dashed')}`)}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_dashed')}`)}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'border_dashed'}
                config={config}
                prefix={prefix}
              /> : <></>}
          </OSTooltip>
        </Checkbox>
        <Box />
      </Box>
    </>
  )
}

/*************************************************************************************************/

// ✅ COMPOSANT GÉNÉRIQUE POUR LA CONFIGURATION DES FORMES
const MenuConfigurationShape = ({
  app_data,
  menu_for_style,
  elementType,
  additional_menus
}: {
  app_data: Class_ApplicationData
  menu_for_style: boolean
  elementType: 'nodes' | 'links' | 'containers'
  additional_menus?: MutableRefObject<Type_AdditionalMenus>
}) => {
  const { t, drawing_area, menu_configuration, icon_library } = app_data
  const { sankey } = drawing_area
  const [, setCount] = useState(0)

  // ✅ Configuration selon le type
  const config = elementType === 'nodes' ? {
    selectedRef: menu_configuration.ref_selected_style_node,
    stylesDict: sankey.node_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_nodes
      ? drawing_area.selected_nodes_list_sorted
      : drawing_area.visible_and_selected_nodes_list_sorted,
    visibleList: sankey.visible_nodes_list,
    attributePath: 'Noeud.apparence',
    attributesConfig: NODES_ATTRIBUTES_CONFIG,
    updateVisualRef: menu_configuration.ref_to_menu_config_nodes_apparence_visual_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_nodes_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToNodesApparence(),
    updateStyle: () => menu_configuration.updateComponentRelatedToNodesStyles(),
    SelectionComponent: SankeyNodeSelectionSimple,
    StyleComponent: ConfigMenuStyleElement,
    hasShapeType: true,
    hasGeometry: true,
    hasOrphanVisible: true,
    hasLinkSpecific: false
  } : elementType === 'containers' ? {
    selectedRef: menu_configuration.ref_selected_style_container,
    stylesDict: sankey.container_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_containers
      ? drawing_area.selected_containers_list_sorted
      : drawing_area.visible_and_selected_containers_list_sorted,
    visibleList: sankey.drawing_area.visible_containers_list,
    attributePath: 'Noeud.apparence',
    attributesConfig: NODES_ATTRIBUTES_CONFIG, // Containers utilisent la config des nodes
    updateVisualRef: menu_configuration.ref_to_menu_config_containers_apparence_visual_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_containers_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToContainersApparence(),
    updateStyle: () => menu_configuration.updateComponentRelatedToContainersStyles(),
    SelectionComponent: SankeyContainerSelectionSimple,
    StyleComponent: ConfigMenuStyleElement,
    hasShapeType: true,
    hasGeometry: true, // Containers ont aussi geometry mais sans position_type
    hasOrphanVisible: false,
    hasLinkSpecific: false
  } : {
    selectedRef: menu_configuration.ref_selected_style_link,
    stylesDict: sankey.link_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_links
      ? drawing_area.selected_links_list_sorted
      : drawing_area.visible_and_selected_links_list_sorted,
    visibleList: sankey.visible_links_list,
    attributePath: 'Flux.apparence',
    attributesConfig: LINKS_ATTRIBUTES_CONFIG,
    updateVisualRef: menu_configuration.ref_to_menu_config_links_apparence_visual_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_links_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToLinksApparence(),
    updateStyle: () => {
      menu_configuration.updateAllComponentsRelatedToLinks()
      menu_configuration.updateComponentRelatedToLinksStyles()
    },
    SelectionComponent: SankeyLinkSelectionSimple,
    StyleComponent: ConfigMenuStyleElement,
    hasShapeType: false,
    hasGeometry: false,
    hasOrphanVisible: false,
    hasLinkSpecific: true
  }

  // ✅ Assigner les updaters
  if (!menu_for_style) {
    config.updateVisualRef.current = () => setCount(a => a + 1)
  } else {
    config.updateStyleRef.current = () => setCount(a => a + 1)
  }

  const elements = (menu_for_style
    ? [config.stylesDict[config.selectedRef.current]]
    : config.selectedList) as ElementsType

  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[] | Class_ContainerElement[]
  const link_elements = elements as Class_LinkElement[] | Class_ElementStyle[]
  const node_elements = elements as Class_NodeBase[] | Class_ElementStyle[]

  let disable_attr_props = config.stylesDict[default_style_id].customisable_attribute
  if (menu_for_style) {
    disable_attr_props = config.stylesDict[config.selectedRef.current].customisable_attribute
  }

  const refreshThisAndUpdateRelatedComponents = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      config.updateStyle()
      config.visibleList.forEach((el: any) => el.draw())
    }
    config.updateApparence()
  }

  const refreshThisAndUpdateRelatedComponentsGeometry = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      config.updateStyle()
      config.visibleList.forEach((el: any) => el.draw())
    } else {
      elements.forEach((el: any) => el.draw())
    }
    config.updateApparence()
  }

  const shapeValues = elements.length > 0
    ? getShapeValues(elements, 'shape', refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(BASE_SHAPE_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof BASE_SHAPE_CONFIG]: ReturnType<typeof BASE_SHAPE_CONFIG[K]['type']> }

  const nodeSpecificShapeValues = (elementType === 'nodes' || elementType === 'containers') && elements.length > 0
    ? getNodeShapeValues(elements, refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(NODE_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof NODE_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof NODE_SHAPE_SPECIFIC_CONFIG[K]['type']> }

  const linkShapeValues = elementType === 'links' && elements.length > 0
    ? getLinkShapeValues(elements, refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(LINKS_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof LINKS_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof LINKS_SHAPE_SPECIFIC_CONFIG[K]['type']> }

  // ✅ CONTENU APPARENCE
  const content_appearence = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'visible'}
      config={BASE_SHAPE_CONFIG}
      prefix={'shape'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      <Divider/>
      <Box as='span' textStyle='title_sub_section'>Forme</Box>
      {/* ✅ Forme du noeud/container (ellipse/rect) */}
      {config.hasShapeType && (
        <OSTooltip label={t(`${config.attributePath}.tooltips.shape_type`)}>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t(`${config.attributePath}.shape_type`)}
              {!menu_for_style && (
                <TooltipElementOverloaded
                  elements={base_elements}
                  t={t}
                  attributeKey={'type'}
                  prefix='shape'
                  config={BASE_SHAPE_CONFIG}
                />
              )}
            </Box>
            <Box layerStyle='options_3cols'>
              <Button
                isDisabled={!disable_attr_props['shape_type']}
                variant={shapeValues.type === 'ellipse' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => { shapeValues.type = 'ellipse' }}
              >
                {icon_library.icon_ellipse_shape}
              </Button>
              <Button
                isDisabled={!disable_attr_props['shape_type']}
                variant={shapeValues.type === 'rect' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => { shapeValues.type = 'rect' }}
              >
                {icon_library.icon_rect_shape}
              </Button>
            </Box>
          </Box>
        </OSTooltip>
      )}

      {/* ✅ Orientation et options spécifiques aux links */}
      {config.hasLinkSpecific && (
        <>
          {/* Orientation */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='options_4cols'>
              <OSTooltip label={t('Flux.apparence.tooltips.shape_is_recycling')}>
                <Button
                  isDisabled={!disable_attr_props['shape_is_recycling']}
                  variant={linkShapeValues.is_recycling ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => { linkShapeValues.is_recycling = !linkShapeValues.is_recycling }}
                >
                  {icon_library.icon_orientation_recycle}
                </Button>
              </OSTooltip>
              <></>
              <></>
              <></>
            </Box>
            <Box layerStyle='options_4cols'>
              {['hh', 'vv', 'vh', 'hv'].map((orient, idx) => (
                <OSTooltip key={orient} label={t(`Flux.apparence.tooltips.of_${orient}`)}>
                  <Button
                    isDisabled={!disable_attr_props['shape_orientation']}
                    variant={
                      linkShapeValues.orientation === orient
                        ? `menuconfigpanel_option_button_activated_${idx === 0 ? 'left' : idx === 3 ? 'right' : 'center'}`
                        : `menuconfigpanel_option_button_${idx === 0 ? 'left' : idx === 3 ? 'right' : 'center'}`
                    }
                    onClick={() => { linkShapeValues.orientation = orient as any }}
                  >
                    {icon_library[`icon_orientation_${orient}` as keyof typeof icon_library]}
                  </Button>
                </OSTooltip>
              ))}
            </Box>
          </Box>

          {/* Forme courbée */}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Checkbox
              isDisabled={!disable_attr_props['shape_is_curved']}
              variant='menuconfigpanel_option_checkbox'
              isIndeterminate={isLinkShapeSpecificValueIndeterminate(link_elements, 'is_curved')}
              isChecked={linkShapeValues.is_curved}
              onChange={(evt) => { linkShapeValues.is_curved = evt.target.checked }}
            >
              <OSTooltip label={t('Flux.apparence.tooltips.courbe')}>
                {t('Flux.apparence.shape_is_curved')}
                {!menu_for_style && (
                  <TooltipElementOverloaded
                    elements={base_elements}
                    t={t}
                    attributeKey={'is_curved'}
                    config={LINKS_SHAPE_SPECIFIC_CONFIG}
                    prefix={'shape'}
                  />
                )}
              </OSTooltip>
            </Checkbox>
            {linkShapeValues.is_curved && (
              <OSTooltip label={t('Flux.apparence.tooltips.shape_type')}>
                <Select
                  isDisabled={!disable_attr_props['shape_type']}
                  value={shapeValues.type}
                  onChange={(evt) => { shapeValues.type = evt.target.value as Type_Shape }}
                >
                  {menu_configuration.shape_type.map(el => (
                    <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
                  ))}
                </Select>
                {!menu_for_style && (
                  <TooltipElementOverloaded
                    elements={base_elements}
                    t={t}
                    attributeKey={'type'}
                    config={BASE_SHAPE_CONFIG}
                    prefix={'shape'}
                  />
                )}
              </OSTooltip>
            )}
          </Box>

          {/* Flèche */}
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Checkbox
              isDisabled={!disable_attr_props['shape_is_arrow']}
              variant='menuconfigpanel_option_checkbox'
              isIndeterminate={isLinkShapeSpecificValueIndeterminate(link_elements, 'is_arrow')}
              isChecked={linkShapeValues.is_arrow}
              onChange={(evt) => { linkShapeValues.is_arrow = evt.target.checked }}
            >
              <OSTooltip label={t('Flux.apparence.tooltips.fleche')}>
                {t('Flux.apparence.shape_is_arrow')}
              </OSTooltip>
            </Checkbox>
            {linkShapeValues.is_arrow && (
              <InputGroup variant='menuconfigpanel_option_input'>
                <OSTooltip label={t('Flux.apparence.tooltips.arrow_size')}>
                  <ConfigMenuNumberInput
                    disabled={!disable_attr_props['shape_arrow_size']}
                    t={t}
                    default_value={linkShapeValues.arrow_size}
                    menu_for_style={menu_for_style}
                    minimum_value={1}
                    unit_text={'px'}
                    stepper={true}
                    function_on_blur={(value) => { linkShapeValues.arrow_size = value ?? linkShapeValues.arrow_size }}
                    multiValue={isLinkShapeSpecificValueIndeterminate(link_elements, 'arrow_size')}
                  />
                  {!menu_for_style && (
                    <TooltipElementOverloaded
                      elements={base_elements}
                      t={t}
                      attributeKey={'arrow_size'}
                      config={LINKS_SHAPE_SPECIFIC_CONFIG}
                      prefix={'shape'}
                    />
                  )}
                </OSTooltip>
              </InputGroup>
            )}
          </Box>
        </>
      )}
      <Divider />
      <Box as='span' textStyle='title_sub_section'>Fond</Box>
      {/* ✅ Attributs de forme communs */}
      <MenuShapeAttributes
        app_data={app_data}
        elements={elements}
        attributePath={config.attributePath}
        prefix='shape'
        disable_attr_props={disable_attr_props}
        refreshUI={refreshThisAndUpdateRelatedComponents}
      />
    </MenuSectionCheckbox>
  )

  // ✅ CONTENU GÉOMÉTRIE (pour nodes et containers)
  const content_geometry = config.hasGeometry && (
    <WrapperBoxSubSectionMenu is_open={false} new_data={app_data} title={t('Noeud.apparence.Geometry')}>
      <>
        <Box as='span' layerStyle='menuconfigpanel_part_title_2'>
          {t('Noeud.size')}
        </Box>

        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={config.attributePath}
          attributeKey={'min_width'}
          prefix={'shape'}
          config={BASE_SHAPE_CONFIG}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          unit_text='px'
          stepper={true}
        />

        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={config.attributePath}
          attributeKey={'min_height'}
          prefix={'shape'}
          config={BASE_SHAPE_CONFIG}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          unit_text='px'
          stepper={true}
        />

        <Box as='span' layerStyle='menuconfigpanel_part_title_2'>
          {t('Noeud.position')}
        </Box>

        {/* Position type (seulement pour nodes, pas containers) */}
        {elementType === 'nodes' && (
          <OSTooltip label={t('Noeud.apparence.tooltips.geometry')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>
                {t('Noeud.apparence.geometry')}
              </Box>
              <Box layerStyle='options_3cols'>
                {['absolute', 'parametric', 'relative'].map(type => (
                  <Button
                    key={type}
                    variant={
                      nodeSpecificShapeValues.position_type === type
                        ? 'menuconfigpanel_option_button_activated'
                        : 'menuconfigpanel_option_button'
                    }
                    onClick={() => {
                      elements.forEach((element: any) => element.position_type = type)
                      refreshThisAndUpdateRelatedComponents()
                    }}
                  >
                    {t(`Noeud.apparence.geometry_${type}`)}
                  </Button>
                ))}
              </Box>
            </Box>
          </OSTooltip>
        )}

        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={config.attributePath}
          attributeKey={'position_dx'}
          prefix={'shape'}
          config={NODE_SHAPE_SPECIFIC_CONFIG}
          refreshParentComponent={refreshThisAndUpdateRelatedComponentsGeometry}
          unit_text='px'
          stepper={true}
        />

        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={config.attributePath}
          attributeKey={'position_dy'}
          prefix={'shape'}
          config={NODE_SHAPE_SPECIFIC_CONFIG}
          refreshParentComponent={refreshThisAndUpdateRelatedComponentsGeometry}
          unit_text='px'
          stepper={true}
        />

        {elementType === 'nodes' && additional_menus?.current.advanced_appearence_content}
      </>
    </WrapperBoxSubSectionMenu>
  )

  // ✅ DÉTAILS GÉOMÉTRIE (pour links)
  const content_geometry_detail = config.hasLinkSpecific && (
    <WrapperBoxSubSectionMenu is_open={false} new_data={app_data} title={t('Noeud.apparence.Geometry')}>
      <>
        {[
          ['starting_curve', 0, (1 - linkShapeValues.ending_curve)],
          ['ending_curve', linkShapeValues.starting_curve * 100, 100],
          ['starting_tangeant', 0, 100],
          ['ending_tangeant', 0, 100],
        ].map(p => (
          <ElementAttrSetterNumberInput2Cols
            key={p[0] as string}
            app_data={app_data}
            elements={elements}
            attributePath={config.attributePath}
            attributeKey={p[0] as keyof typeof LINKS_SHAPE_SPECIFIC_CONFIG}
            prefix={'shape'}
            config={LINKS_SHAPE_SPECIFIC_CONFIG}
            minimum_value={p[1] as number}
            maximum_value={p[2] as number}
            percent={true}
          />
        ))}
      </>
    </WrapperBoxSubSectionMenu>
  )

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {!menu_for_style && <config.SelectionComponent app_data={app_data} />}
      {!menu_for_style && (
        <config.StyleComponent
          app_data={app_data}
          //@ts-expect-error xxx
          selected_elements={base_elements}
          config={config.attributesConfig}
          categories={['shape']}
          nodesOrLinks={elementType === 'containers' ? 'nodes' : elementType}
        />
      )}
      {elements.length > 0 && (
        <>
          {content_appearence}
          {config.hasOrphanVisible && (
            <Checkbox
              isDisabled={!disable_attr_props['orphan_node_visible']}
              variant='menuconfigpanel_option_checkbox'
              isIndeterminate={isNodeShapeSpecificValueIndeterminate(node_elements, 'orphan_node_visible')}
              isChecked={nodeSpecificShapeValues.orphan_node_visible}
              onChange={(evt) => { nodeSpecificShapeValues.orphan_node_visible = evt.target.checked }}
            >
              <OSTooltip label={t('Noeud.apparence.tooltips.orphan_node_visible')}>
                {t('Noeud.apparence.orphan_node_visible')}
                {!menu_for_style && (
                  <TooltipElementOverloaded
                    elements={base_elements}
                    t={t}
                    attributeKey={'orphan_node_visible'}
                    prefix='shape'
                    config={NODE_SHAPE_SPECIFIC_CONFIG}
                  />
                )}
              </OSTooltip>
            </Checkbox>
          )}
          {content_geometry}
          {content_geometry_detail}
          {elementType === 'nodes' && !menu_for_style && additional_menus?.current.additional_node_config_style.map((el, i) => (
            <React.Fragment key={'add_node_config_style_' + i}>{el}</React.Fragment>
          ))}
        </>
      )}
    </Box>
  )
}

// ✅ WRAPPERS POUR COMPATIBILITÉ
export const MenuConfigurationNodeShape = (props: {
  app_data: Class_ApplicationData
  menu_for_style: boolean
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}) => <MenuConfigurationShape {...props} elementType='nodes' />

export const MenuConfigurationLinkShape = (props: {
  new_data: Class_ApplicationData
  menu_for_style: boolean
}) => <MenuConfigurationShape app_data={props.new_data} menu_for_style={props.menu_for_style} elementType='links' />

export const MenuConfigurationContainerShape = (props: {
  app_data: Class_ApplicationData
  menu_for_style: boolean
}) => <MenuConfigurationShape {...props} elementType='containers' />
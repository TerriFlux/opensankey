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
import { Box, Button, Checkbox, InputGroup, Select, } from '@chakra-ui/react'

import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/Element'
import { default_style_id } from '../../types/Utils'
import {
  WrapperBoxSubSectionMenu, ElementAttrSetterNumberInput2Cols, ValueKey, MenuSectionCheckbox,
  getShapeValues, getLinkShapeValues, ConfigMenuNumberInput, ConfigMenuNumberOrUndefinedInput
} from './MenuCommon'
import { SankeyLinkSelectionSimple } from './MenuSelectionElements'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { MenuShapeAttributes } from './MenuShapeBase'
import {
  BASE_SHAPE_CONFIG, isLinkShapeSpecificValueIndeterminate,
  LINKS_SHAPE_SPECIFIC_CONFIG, LINKS_ATTRIBUTES_CONFIG,
  Type_Shape
} from '../../Elements/ElementsAttributesConfig'

// export type keyStyle = keyof Class_LinkStyle
// export type valStyle = Class_LinkStyle[keyStyle]
// export type keyLink = keyof Class_LinkElement
// export type valLink = Class_LinkElement[keyLink]

export const MenuConfigurationLinkShape = ({ new_data, menu_for_style }: {
  new_data: Class_ApplicationData
  menu_for_style: boolean
}) => {
  const { t, icon_library, drawing_area } = new_data
  const { sankey } = drawing_area

  const { icon_orientation_recycle, icon_orientation_hh, icon_orientation_hv, icon_orientation_vh, icon_orientation_vv } = icon_library
  const { ref_selected_style_link } = new_data.menu_configuration

  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    selected_links = drawing_area.selected_links_list_sorted
  } else {
    selected_links = drawing_area.visible_and_selected_links_list_sorted
  }

  let elements: Class_LinkStyle[] | Class_LinkElement[]
  let disable_attr_props = sankey.link_styles_dict[default_style_id].customisable_attribute
  if (menu_for_style) {
    elements = [sankey.link_styles_dict[ref_selected_style_link.current]]
    disable_attr_props = sankey.link_styles_dict[ref_selected_style_link.current].customisable_attribute
  } else {
    elements = selected_links
  }
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      new_data.menu_configuration.updateAllComponentsRelatedToLinks()
      // Update menus for link's apparence in case we use this for style
      new_data.menu_configuration.updateComponentRelatedToLinksStyles()
      // Redraw all visible nodes if we modifie link style
      sankey.visible_links_list.forEach(link => link.draw())
    }
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToLinksApparence()
  }
  const shapeValues = selected_links.length > 0
    ? getShapeValues(selected_links, 'shape', refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(BASE_SHAPE_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof BASE_SHAPE_CONFIG]: ReturnType<typeof BASE_SHAPE_CONFIG[K]['type']> }
  const linkShapeSpecificValues = selected_links.length > 0
    ? getLinkShapeValues(selected_links, refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(LINKS_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof LINKS_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof LINKS_SHAPE_SPECIFIC_CONFIG[K]['type']> }

  //const element_ref = elements[0]
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)
  // Link this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_links_apparence_visual_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_links_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  const content_shape_color = <MenuSectionCheckbox
    app_data={new_data}
    elements={selected_links}
    attributePath='Flux.apparence'
    attributeKey={'visible'}
    config={BASE_SHAPE_CONFIG}
    prefix={'shape'}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {/* Orientation du flux */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='options_4cols' >
        {/* Flux en recyclage  */}
        <OSTooltip label={t('Flux.apparence.tooltips.shape_is_recycling')}>
          <Button
            isDisabled={!disable_attr_props['shape_is_recycling']}
            className='btn_menu_config'
            variant={(linkShapeSpecificValues.is_recycling) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              linkShapeSpecificValues.is_recycling = !linkShapeSpecificValues.is_recycling
            }}
          >
            {icon_orientation_recycle}
          </Button>
        </OSTooltip>
        <></>
        <></>
        <></>
      </Box>
      <Box layerStyle='options_4cols' >
        {/* Horizontal - Horizontal  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_hh')}>
          <Button
            isDisabled={!disable_attr_props['shape_orientation']}
            className='btn_menu_config'
            value='hh'
            variant={
              (linkShapeSpecificValues.orientation === 'hh') ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'
            }
            onClick={() => {
              linkShapeSpecificValues.orientation = 'hh'
            }}
          >
            {icon_orientation_hh}
          </Button>
        </OSTooltip>

        {/* Vertical - Verticale  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_vv')}>
          <Button
            isDisabled={!disable_attr_props['shape_orientation']}
            className='btn_menu_config'
            value='vv'
            variant={(linkShapeSpecificValues.orientation === 'vv') ? 'menuconfigpanel_option_button_activated_center' :
              'menuconfigpanel_option_button_center'}
            onClick={() => {
              linkShapeSpecificValues.orientation = 'vv'
            }}
          >
            {icon_orientation_vv}
          </Button>
        </OSTooltip>

        {/* Vertical - Horizontal  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_vh')}>
          <Button
            isDisabled={!disable_attr_props['shape_orientation']}
            className='btn_menu_config'
            value='vh'
            variant={
              (linkShapeSpecificValues.orientation === 'vh') ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'
            }
            onClick={() => {
              linkShapeSpecificValues.orientation = 'vh'
            }}
          >
            {icon_orientation_vh}
          </Button>
        </OSTooltip>

        {/* Horizontal - Vertical  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_hv')}>
          <Button
            isDisabled={!disable_attr_props['shape_orientation']}
            className='btn_menu_config'
            value='hv'
            variant={
              (linkShapeSpecificValues.orientation === 'hv') ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'
            }
            onClick={() => {
              linkShapeSpecificValues.orientation = 'hv'
            }}
          >
            {icon_orientation_hv}
          </Button>
        </OSTooltip>
      </Box>
    </Box>

    {/* Forme courbée  */}
    {/* Choix de la forme du flux */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Checkbox
        isDisabled={!disable_attr_props['shape_is_curved']}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={isLinkShapeSpecificValueIndeterminate(elements, 'is_curved')}
        isChecked={linkShapeSpecificValues.is_curved}
        onChange={(evt) => {
          linkShapeSpecificValues.is_curved = evt.target.checked
        }}>
        <OSTooltip label={t('Flux.apparence.tooltips.courbe')}>
          {t('Flux.apparence.shape_is_curved')}
          {!menu_for_style ?
            <TooltipElementOverloaded
              elements={selected_links}
              t={t}
              attributeKey={'is_curved'}
              config={LINKS_SHAPE_SPECIFIC_CONFIG}
              prefix={'shape'}
            /> : <></>}
        </OSTooltip>
      </Checkbox>
      {linkShapeSpecificValues.is_curved ? <>
        <OSTooltip label={t('Flux.apparence.tooltips.shape_type')}>
          <Select
            isDisabled={!disable_attr_props['shape_type']}
            value={shapeValues.type}
            onChange={(evt) => {
              shapeValues.type = evt.target.value as Type_Shape
            }}
          >
            {new_data.menu_configuration.shape_type.map(el => {
              return <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
            })}
          </Select>
          {!menu_for_style ? <TooltipElementOverloaded
            elements={selected_links}
            t={t}
            attributeKey={'type'}
            config={BASE_SHAPE_CONFIG}
            prefix={'shape'}
          /> : <></>}
        </OSTooltip></> : <></>}
    </Box>

    <Box layerStyle='menuconfigpanel_row_2cols'>
      {/* Forme fleche droite  */}
      <Checkbox
        isDisabled={!disable_attr_props['shape_is_arrow']}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={isLinkShapeSpecificValueIndeterminate(elements, 'is_arrow')}
        isChecked={linkShapeSpecificValues.is_arrow}
        onChange={(evt) => {
          linkShapeSpecificValues.is_arrow = evt.target.checked
        }}>
        <OSTooltip label={t('Flux.apparence.tooltips.fleche')}>
          {t('Flux.apparence.shape_is_arrow')}
        </OSTooltip>
      </Checkbox>

      {linkShapeSpecificValues.is_arrow ? <InputGroup variant='menuconfigpanel_option_input' >
            <OSTooltip label={t('Flux.apparence.tooltips.arrow_size')}>
              <ConfigMenuNumberInput
                disabled={!disable_attr_props['shape_arrow_size']}
                t={new_data.t}
                default_value={linkShapeSpecificValues.arrow_size}
                menu_for_style={menu_for_style}
                minimum_value={1}
                unit_text={'px'}
                stepper={true}
                function_on_blur={(value) => {
                  linkShapeSpecificValues.arrow_size = value ?? linkShapeSpecificValues.arrow_size
                }}
                multiValue={isLinkShapeSpecificValueIndeterminate(elements, 'arrow_size')}
              />
              {!menu_for_style ?
                <TooltipElementOverloaded
                  elements={selected_links}
                  t={t}
                  attributeKey={'arrow_size'}
                  config={LINKS_SHAPE_SPECIFIC_CONFIG}
                  prefix={'shape'}
                /> : <></>}
            </OSTooltip>
          </InputGroup>
        // </Box>
        : <></>}

    </Box>
    <MenuShapeAttributes
      app_data={new_data}
      elements={elements}
      attributePath='Flux.apparence'
      prefix='shape'
      disable_attr_props={disable_attr_props}
      refreshUI={refreshThisAndUpdateRelatedComponents}
    />
  </MenuSectionCheckbox>

  const content_geometry_detail = <WrapperBoxSubSectionMenu is_open={false} new_data={new_data} title={t('Noeud.apparence.Geometry')}>
    <>{[
      ['starting_curve', 0, (1 - linkShapeSpecificValues.ending_curve)],
      ['ending_curve', linkShapeSpecificValues.starting_curve * 100, 100],
      ['starting_tangeant', 0, 100],
      ['ending_tangeant', 0, 100],
    ].map(p => {
      return <ElementAttrSetterNumberInput2Cols
        app_data={new_data}
        elements={selected_links}
        attributePath={'Flux.apparence'}
        attributeKey={p[0] as keyof typeof LINKS_SHAPE_SPECIFIC_CONFIG}
        prefix={'shape'}
        config={LINKS_SHAPE_SPECIFIC_CONFIG}
        minimum_value={p[1] as number}
        maximum_value={p[3] as number}
        percent={true} />
    })}
    </>
  </WrapperBoxSubSectionMenu>

  return <Box layerStyle='menuconfigpanel_grid'>
    {menu_for_style ? <></> : <SankeyLinkSelectionSimple app_data={new_data} />}
    {menu_for_style ? <></> : <ConfigMenuStyleElement
      app_data={new_data}
      selected_elements={selected_links}
      config={LINKS_ATTRIBUTES_CONFIG}
      categories={['shape']}
      nodesOrLinks={'links'}
    />}
    {elements.length > 0 ? <>
      {<Box layerStyle='menuconfigpanel_grid'>
        {content_shape_color}
        {content_geometry_detail}
      </Box>}</> : <></>}
  </Box>
}


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
import { Box, Button, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack,Checkbox } from '@chakra-ui/react'

import { Class_NodeElement } from '../../Elements/Node'
import { default_dy, default_position_type, default_dx, } from '../../Elements/NodeAttributes'
import { type Class_NodeStyle } from '../../Elements/ElementStyle'
import { ElementAttrSetterNumberInput2Cols, MenuSectionCheckbox, updateElements, ValueKey, WrapperBoxSubSectionMenu } from './MenuCommon'
import { SankeyNodeSelectionSimple } from './SankeyMenuConfigurationNodes'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributesConfig'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { default_style_id } from '../../types/Utils'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { MenuColorPicker } from './MenuColorPicker'

export const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>
export const svg_label_upper = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z" /><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z" /></g></svg>


// Declare type used for generics functions

export type keyNodeStyle = keyof Class_NodeStyle
export type typeValNodeStyle = Class_NodeStyle[keyNodeStyle]
export type keyNodeAttr = keyof Class_NodeElement
export type typeValNodeAttr = Class_NodeElement[keyNodeAttr]

/*************************************************************************************************/

/**
 * Define the menu that allows to modifiy appararence for nodes / properties for a node style
 *
 * @param {*} {
 *   new_data,
 *   menu_for_style,
 *   additional_menus,
 * }
 * @return {*}
 */
export const MenuConfigurationNodeStyle = ({ app_data, menu_for_style, additional_menus }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean,
  additional_menus : MutableRefObject<Type_AdditionalMenus>
}) => {
  const { t, drawing_area, menu_configuration, icon_library } = app_data
  const { sankey, selected_nodes_list_sorted, visible_and_selected_nodes_list_sorted } = drawing_area
  const { ref_selected_style_node, is_selector_only_for_visible_nodes } = menu_configuration
  const { icon_direction_down, icon_direction_left, icon_direction_rift, icon_direction_up, icon_locked, icon_unlocked } = icon_library

  let selected_nodes = !is_selector_only_for_visible_nodes ?
    selected_nodes_list_sorted :
    visible_and_selected_nodes_list_sorted

  // Elements on which menu modification applies
  let elements = menu_for_style ? [sankey.node_styles_dict[ref_selected_style_node.current]] : selected_nodes
  const element_ref = elements[0]

  // Get values or default values
  const shape_visible = (element_ref?.shape_visible ?? NODES_ATTRIBUTES_CONFIG.shape_visible.default)
  const shape_color = (element_ref?.shape_color ?? NODES_ATTRIBUTES_CONFIG.shape_color.default)
  const shape_type = (element_ref?.shape_type ?? NODES_ATTRIBUTES_CONFIG.shape_type.default)
  const shape_arrow_angle_factor = (element_ref?.shape_arrow_angle_factor ?? NODES_ATTRIBUTES_CONFIG.shape_arrow_angle_factor.default)
  const shape_arrow_angle_direction = (element_ref?.shape_arrow_angle_direction ?? NODES_ATTRIBUTES_CONFIG.shape_arrow_angle_direction.default)
  const shape_color_sustainable = (element_ref?.shape_color_sustainable ?? NODES_ATTRIBUTES_CONFIG.shape_color_sustainable.default)
  const orphan_node_visible = (element_ref?.orphan_node_visible ?? NODES_ATTRIBUTES_CONFIG.orphan_node_visible.default)
  const check_indeterminate = (curr: Class_NodeElement) => {
    return (selected_nodes[0].orphan_node_visible == curr.orphan_node_visible)
  }
  const is_indeterminate = !selected_nodes.every(check_indeterminate)

  const position_type = menu_for_style ?
    ((element_ref as Class_NodeStyle)?.position.type ?? default_position_type) :
    ((element_ref as Class_NodeElement)?.position_type ?? default_position_type)
  const position_u = menu_for_style ?
    ((element_ref as Class_NodeStyle)?.position.dx ?? 0) :
    ((element_ref as Class_NodeElement)?.display.position.u ?? 0)
  const position_dy = menu_for_style ?
    ((element_ref as Class_NodeStyle)?.position.dy ?? default_dy) :
    ((element_ref as Class_NodeElement)?.display.position.dy ?? default_dy)
  const position_dx = menu_for_style ?
    ((element_ref as Class_NodeStyle)?.position.dx ?? default_dx) :
    ((element_ref as Class_NodeElement)?.display.position.dx ?? default_dx)

  // Components updaters ----------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Node this menu's update function
  if (!menu_for_style) {
    app_data.menu_configuration.ref_to_menu_config_nodes_apparence_visual_updater.current = () => setCount(a => a + 1)
  } else {
    app_data.menu_configuration.ref_to_menu_config_nodes_styles_updater.current = () => setCountStyle(a => a + 1)
  }
  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      app_data.menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    app_data.menu_configuration.updateComponentRelatedToNodesApparence()
  }

  let disable_attr_props = sankey.node_styles_dict[default_style_id].customisable_attribute
  if (menu_for_style) disable_attr_props = sankey.node_styles_dict[ref_selected_style_node.current].customisable_attribute

  const content_appearence = <MenuSectionCheckbox
    app_data={app_data}
    elements={selected_nodes}
    attributePath='Noeud.apparence'
    attributeKey={'shape_visible' as ValueKey}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
    {shape_visible ? <>
      {/* In this position of the array, there is an input who can change the node visibility (hide if intermediary)(dev) */}
      {additional_menus.current.advanced_appearence_content.splice(1, 1)}

      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        {t('Menu.edition')}
      </Box>

      {/* Couleur du noeud */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.apparence.shape_color')}
          <TooltipElementOverloaded elements={selected_nodes} t={t} k='shape_color' />
        </Box>
        <Box layerStyle='option_with_activation'>
          <OSTooltip label={t('Noeud.apparence.tooltips.shape_color')}>
            <Box>
              <MenuColorPicker
                isDisabled={!disable_attr_props['shape_color']}
                initialColor={shape_color}
                onColorChange={(new_color) => {
                  updateElements(app_data, elements, 'shape_color' as ValueKey, new_color, refreshThisAndUpdateRelatedComponents)
                }}
              />
            </Box>
          </OSTooltip>
          <OSTooltip label={t('Noeud.apparence.tooltips.shape_color_sustainable')}>
            <Button
              isDisabled={!disable_attr_props['shape_color_sustainable']}
              //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
              variant={
                shape_color_sustainable ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                updateElements(app_data, elements, 'shape_color_sustainable' as ValueKey, !shape_color_sustainable, refreshThisAndUpdateRelatedComponents)
              }}
            >
              {shape_color_sustainable ? icon_locked : icon_unlocked}
              <TooltipElementOverloaded elements={selected_nodes} t={t} k='shape_color_sustainable' />
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Forme du noeud */}
      <OSTooltip label={t('Noeud.apparence.tooltips.shape_type')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.apparence.shape_type')}
            <TooltipElementOverloaded elements={selected_nodes} t={t} k='shape_type' />
          </Box>
          <Box layerStyle='options_3cols' >
            <Button
              isDisabled={!disable_attr_props['shape_type']}
              value="ellipse"
              variant={
                shape_type === 'ellipse' ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                updateElements(app_data, elements, 'shape_type' as ValueKey, 'ellipse', refreshThisAndUpdateRelatedComponents)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill='#78C2AD'
                stroke='currentColor'
                viewBox='0 0 17 17'
                width="1rem"
                height="1rem"
              >
                <path d="M 16.440445,8.4666672 A 7.9737778,7.9737773 0 0 1 8.4666672,16.440444 7.9737778,7.9737773 0 0 1 0.4928894,8.4666672 7.9737778,7.9737773 0 0 1 8.4666672,0.49288988 7.9737778,7.9737773 0 0 1 16.440445,8.4666672 Z" />
              </svg>
            </Button>

            <Button
              isDisabled={!disable_attr_props['shape_type']}
              variant={
                shape_type === 'rect' ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                updateElements(app_data, elements, 'shape_type' as ValueKey, 'rect', refreshThisAndUpdateRelatedComponents)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill='#78C2AD'
                stroke='currentColor'
                viewBox='0 0 17 17'
                width="1rem"
                height="1rem"
              >
                <path d="M 0.385555,0.385555 H 16.547779 V 16.547779 H 0.385555 Z" />
              </svg>
              {/* {t('Noeud.apparence.Rectangle')} */}
            </Button>

            <Button
              isDisabled={!disable_attr_props['shape_type']}
              variant={
                shape_type === 'arrow' ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'
              }
              onClick={() => {
                updateElements(app_data, elements, 'shape_type' as ValueKey, 'arrow', refreshThisAndUpdateRelatedComponents)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill='#78C2AD'
                stroke='currentColor'
                viewBox='0 0 17 17'
                width="1rem"
                height="1rem"
              >
                <path d="M 0.11499051,0.11500028 H 10.015883 L 16.844087,8.5149428 10.015883,16.818334 H 0.11499051 L 6.601784,8.5149428 Z" />
              </svg>
            </Button>
          </Box>
        </Box>
      </OSTooltip>

      {
        /* Change the angle of the arrow shaped node */
        shape_type === 'arrow' ?
          <Box layerStyle='menuconfigpanel_grid'>
            <OSTooltip label={t('Noeud.apparence.tooltips.shape_arrow_angle_factor')}>
              <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                <Box layerStyle='menuconfigpanel_option_name' >
                  {t('Noeud.apparence.shape_arrow_angle_factor')}
                  <TooltipElementOverloaded elements={selected_nodes} t={t} k='shape_arrow_angle_factor' />
                </Box>
                <Slider
                  isDisabled={!disable_attr_props['shape_arrow_angle_factor']}
                  min={0}
                  max={45}
                  step={5}
                  value={shape_arrow_angle_factor}
                  onChange={(value) => {
                    updateElements(app_data, elements, 'shape_arrow_angle_factor' as ValueKey, value, refreshThisAndUpdateRelatedComponents)
                  }}
                >
                  <SliderMark
                    value={shape_arrow_angle_factor as number}
                  >
                    {shape_arrow_angle_factor}°
                  </SliderMark>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>
            </OSTooltip>

            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.apparence.shape_arrow_angle_direction')}
                <TooltipElementOverloaded elements={selected_nodes} t={t} k='shape_arrow_angle_direction' />
              </Box>
              <Box layerStyle='options_4cols' >
                <Button
                  isDisabled={!disable_attr_props['shape_arrow_angle_direction']}
                  variant={
                    shape_arrow_angle_direction === 'left' ?
                      'menuconfigpanel_option_button_activated' :
                      'menuconfigpanel_option_button'
                  }
                  minWidth={0}
                  onClick={() => {
                    updateElements(app_data, elements, 'shape_arrow_angle_direction' as ValueKey, 'left', refreshThisAndUpdateRelatedComponents)
                  }}
                >
                  {icon_direction_left}
                </Button>
                <Button
                  isDisabled={!disable_attr_props['shape_arrow_angle_direction']}
                  variant={
                    shape_arrow_angle_direction === 'right' ?
                      'menuconfigpanel_option_button_activated' :
                      'menuconfigpanel_option_button'
                  }
                  minWidth={0}
                  onClick={() => {
                    updateElements(app_data, elements, 'shape_arrow_angle_direction' as ValueKey, 'right', refreshThisAndUpdateRelatedComponents)
                  }}
                >
                  {icon_direction_rift}
                </Button>
                <Button
                  isDisabled={!disable_attr_props['shape_arrow_angle_direction']}
                  variant={
                    shape_arrow_angle_direction === 'top' ?
                      'menuconfigpanel_option_button_activated' :
                      'menuconfigpanel_option_button'
                  }
                  minWidth={0}
                  onClick={() => {
                    updateElements(app_data, elements, 'shape_arrow_angle_direction' as ValueKey, 'top', refreshThisAndUpdateRelatedComponents)

                  }}
                >
                  {icon_direction_up}
                </Button>
                <Button
                  isDisabled={!disable_attr_props['shape_arrow_angle_direction']}
                  variant={
                    shape_arrow_angle_direction === 'bottom' ?
                      'menuconfigpanel_option_button_activated' :
                      'menuconfigpanel_option_button'
                  }
                  minWidth={0}
                  onClick={() => {
                    updateElements(app_data, elements, 'shape_arrow_angle_direction' as ValueKey, 'bottom', refreshThisAndUpdateRelatedComponents)
                  }}
                >
                  {icon_direction_down}
                </Button>
              </Box>
            </Box>
          </Box> :
          <></>
      }

      {/* Shape Opacity */}
      <ElementAttrSetterNumberInput2Cols
        app_data={app_data}
        elements={elements}
        attributePath='Noeud.apparence'
        attributeKey={'shape_opacity' as ValueKey}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        unit_text='pixels'
        minimum_value={0}
        maximum_value={1}
        step={0.1}
        stepper={true} />
        
        <Checkbox
          isDisabled={!disable_attr_props['orphan_node_visible']}
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminate}
          isChecked={orphan_node_visible}
          onChange={(evt) => { updateElements(app_data,elements,'orphan_node_visible' as ValueKey, evt.target.checked,refreshThisAndUpdateRelatedComponents) }}>
          <OSTooltip label={t('Noeud.apparence.tooltips.orphan_node_visible')}>
            {t('Noeud.apparence.orphan_node_visible')}
            <TooltipElementOverloaded elements={selected_nodes} t={t} k={'orphan_node_visible'} />
          </OSTooltip>
        </Checkbox>
    </> : <></>}
  </MenuSectionCheckbox>

  const content_geometry = <WrapperBoxSubSectionMenu collapse={false} new_data={app_data} title={t('Noeud.apparence.Geometry')}><>
    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.size')}
    </Box>

    {/* Largeur minimale du noeud */}
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'shape_min_width' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      unit_text='pixels'
      stepper={true} />

    {/* Hauteur minimale du noeud */}
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'shape_min_height' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      unit_text='pixels'
      stepper={true} />

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.position')}
    </Box>

    {/* Position du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.geometry')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry')}
        </Box>
        <Box layerStyle='options_3cols' >
          <Button
            value="absolute"
            variant={
              position_type === 'absolute' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element => element.position_type = 'absolute')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_absolute')}
          </Button>

          <Button
            variant={
              position_type === 'parametric' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element => element.position_type = 'parametric')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_parametric')}
          </Button>

          <Button
            variant={
              position_type === 'relative' ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'
            }
            onClick={() => {
              elements.forEach(element => {
                element.position_type = 'relative'
              })
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_relative')}
          </Button>
        </Box>
      </Box>
    </OSTooltip>
    {!menu_for_style ? <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'position_u' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      minimum_value={1}
      unit_text='pixels'
      stepper={true} /> : <></>}
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'position_dx' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      unit_text='pixels'
      stepper={true} />
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'position_dy' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      unit_text='pixels'
      stepper={true} />

    {/* Positionnement vertical automatique*/}
    {/* <Box as='span' >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={multi_selected_nodes.current.length > 0 && multi_selected_nodes.current[0].position === 'parametric'}
        onChange={(evt) => {
          multi_selected_nodes.current[0].position = evt.target.checked ? 'parametric' : 'absolute'
          setForceUpdate(!forceUpdate)
        }}>
        <OSTooltip label={t('Noeud.apparence.parametric')}>
        {t('Noeud.apparence.parametric')}
        </OSTooltip>
      </Checkbox>
    </Box> */}
    {additional_menus.current.advanced_appearence_content}
  </></WrapperBoxSubSectionMenu>


  const additional_content = menu_for_style ? <></> : additional_menus.current.additional_node_config_style.map((el, i) =>
    <React.Fragment key={'add_node_config_style_' + i}>{el}</React.Fragment>
  )

  return <>
    {menu_for_style ? <></> : <SankeyNodeSelectionSimple new_data={app_data} />}
    {menu_for_style ? <></> : <ConfigMenuStyleElement
      app_data={app_data}
      selected_elements={selected_nodes}
      config={NODES_ATTRIBUTES_CONFIG}
      categories={['shape']}
      nodesOrLinks={'nodes'}
    />}
    <>{elements.length > 0 ?
      <>
        {content_appearence}
        {content_geometry}
        {additional_content}
      </> : <></>
    }</>
  </>
}




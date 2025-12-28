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
import { Box, Button,Checkbox } from '@chakra-ui/react'

import { Class_NodeElement } from '../../Elements/Node'
import { type Class_NodeStyle } from '../../Elements/Element'
import { ElementAttrSetterNumberInput2Cols, MenuSectionCheckbox, updateElements, ValueKey, WrapperBoxSubSectionMenu } from './MenuCommon'
import { SankeyNodeSelectionSimple } from './SankeyMenuConfigurationNodes'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { default_style_id } from '../../types/Utils'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { MenuShapeAttributes } from './MenuShapeBase'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Class_LinkElement } from '../../Elements/Link'
import { default_position_type, NODES_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'

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
  additional_menus: MutableRefObject<Type_AdditionalMenus>
}) => {
  const { t, drawing_area, menu_configuration, icon_library } = app_data
  const { sankey, selected_nodes_list_sorted, visible_and_selected_nodes_list_sorted } = drawing_area
  const { ref_selected_style_node, is_selector_only_for_visible_nodes } = menu_configuration

  const selected_nodes = !is_selector_only_for_visible_nodes ?
    selected_nodes_list_sorted :
    visible_and_selected_nodes_list_sorted

  // Elements on which menu modification applies
  const elements = menu_for_style ? [sankey.node_styles_dict[ref_selected_style_node.current]] : selected_nodes
  const element_ref = elements[0]
  const orphan_node_visible = (element_ref?.orphan_node_visible ?? NODES_ATTRIBUTES_CONFIG.orphan_node_visible.default)
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]

  const check_indeterminate = (curr: Class_NodeElement) => {
    return (selected_nodes[0].orphan_node_visible == curr.orphan_node_visible)
  }
  const is_indeterminate = !selected_nodes.every(check_indeterminate)

  const position_type = menu_for_style ?
    ((element_ref as Class_NodeStyle)?.position_type ?? default_position_type) :
    ((element_ref as Class_NodeElement)?.position_type ?? default_position_type)

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
  const refreshThisAndUpdateRelatedComponentsGeometry = () => {
    // Whatever is done, set saving indicator
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      app_data.menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      sankey.visible_nodes_list.forEach(n => n.draw())
    } else {
      // Redraw all visible nodes if we modifie node style
      selected_nodes.forEach(n => n.draw())
    }
    // And update this menu also
    app_data.menu_configuration.updateComponentRelatedToNodesApparence()
  }

  let disable_attr_props = sankey.node_styles_dict[default_style_id].customisable_attribute
  if (menu_for_style) disable_attr_props = sankey.node_styles_dict[ref_selected_style_node.current].customisable_attribute
  const attr_shape_type = 'shape_type'
    const shape_type = element_ref?.[attr_shape_type] ?? 'rect'

  const content_appearence = <MenuSectionCheckbox
    app_data={app_data}
    elements={selected_nodes}
    attributePath='Noeud.apparence'
    attributeKey={'shape_visible' as ValueKey}
    refreshParentComponent={refreshThisAndUpdateRelatedComponents}
  >
      {/* Forme du noeud */}
      <OSTooltip label={t(`Noeud.apparence.tooltips.${attr_shape_type}`)}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t(`Noeud.apparence.${attr_shape_type}`)}
            <TooltipElementOverloaded elements={base_elements} t={t} k={attr_shape_type} />
          </Box>
          <Box layerStyle='options_3cols'>
            <Button
              isDisabled={!disable_attr_props[attr_shape_type]}
              value="ellipse"
              variant={
                shape_type === 'ellipse' ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                updateElements(app_data, elements, attr_shape_type as ValueKey, 'ellipse', refreshThisAndUpdateRelatedComponents)
              }}
            >
              {app_data.icon_library.icon_ellipse_shape}
            </Button>

            <Button
              isDisabled={!disable_attr_props[attr_shape_type]}
              variant={
                shape_type === 'rect' ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                updateElements(app_data, elements, attr_shape_type as ValueKey, 'rect', refreshThisAndUpdateRelatedComponents)
              }}
            >
              {app_data.icon_library.icon_rect_shape}
            </Button>
          </Box>
        </Box>
      </OSTooltip>
    <MenuShapeAttributes
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      prefix='shape'
      disable_attr_props={disable_attr_props}
      refreshUI={refreshThisAndUpdateRelatedComponents}
    />
  </MenuSectionCheckbox>

  const content_geometry = <WrapperBoxSubSectionMenu is_open={false} new_data={app_data} title={t('Noeud.apparence.Geometry')}><>
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
      unit_text='px'
      stepper={true} />

    {/* Hauteur minimale du noeud */}
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'shape_min_height' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      unit_text='px'
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
      refreshParentComponent={refreshThisAndUpdateRelatedComponentsGeometry}
      minimum_value={1}
      unit_text='px'
      stepper={true} /> : <></>}
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'position_dx' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponentsGeometry}
      unit_text='px'
      stepper={true} />
    <ElementAttrSetterNumberInput2Cols
      app_data={app_data}
      elements={elements}
      attributePath='Noeud.apparence'
      attributeKey={'position_dy' as ValueKey}
      refreshParentComponent={refreshThisAndUpdateRelatedComponentsGeometry}
      unit_text='px'
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
        <Checkbox
          isDisabled={!disable_attr_props['orphan_node_visible']}
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminate}
          isChecked={orphan_node_visible}
          onChange={(evt) => { updateElements(app_data, elements, 'orphan_node_visible' as ValueKey, evt.target.checked, refreshThisAndUpdateRelatedComponents) }}>
          <OSTooltip label={t('Noeud.apparence.tooltips.orphan_node_visible')}>
            {t('Noeud.apparence.orphan_node_visible')}
            <TooltipElementOverloaded elements={selected_nodes} t={t} k={'orphan_node_visible'} />
          </OSTooltip>
        </Checkbox>
        {content_geometry}
        {additional_content}
      </> : <></>
    }</>
  </>
}




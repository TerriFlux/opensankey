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

// External libs
import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react'

// Local types
import type {
  FCType_MenuConfigurationNodeStyle
} from './types/SankeyMenuConfigurationNodesAttributesTypes'
import {
  Class_NodeElement,
  isAttributeOverloaded,
} from '../../Elements/Node'
import {
  default_dy,
  default_position_type,
  Class_NodeAttribute,
  NODES_ATTRIBUTES_CONFIG,
  default_dx
} from '../../Elements/NodeAttributes'
import { type Class_NodeStyle } from '../../Elements/NodeAttributes'
import {
  CustomFaEyeCheckIcon,
  default_style_id
} from '../../types/Utils'

// Local functions
import {
  OSTooltip,
  TooltipValueSurcharge,
} from '../../types/Utils'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { MenuResetAttrLocal, MenuUnit, OSMultiSelect, SankeyMenuLabelComponent, SankeyMenuValueLabelComponent, typeElementSelectable, WrapperBoxSubSectionMenu } from './SankeyMenuComponents'
import { SankeyNodeSelectionSimple } from './SankeyMenuConfigurationNodes'
import { Draggable, DraggingStyle, DragDropContext, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { Class_ApplicationData } from '../../types/ApplicationData'

export const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>
export const svg_label_upper = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z" /><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z" /></g></svg>


// Declare type used for generics functions

type keyNodeStyle = keyof Class_NodeStyle
type typeValNodeStyle = Class_NodeStyle[keyNodeStyle]
type keyNodeAttr = keyof Class_NodeElement
type typeValNodeAttr = Class_NodeElement[keyNodeAttr]

/*************************************************************************************************/

const style_TableLineDragging = (isDisabled: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  // change background colour if dragging
  background: isDisabled ? 'lightgrey' : 'unset',
  // styles we need to apply on draggables
  ...draggableStyle
})


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
export const MenuConfigurationNodeStyle: FunctionComponent<FCType_MenuConfigurationNodeStyle> = ({
  new_data,
  menu_for_style,
  additional_menus,
}) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, icon_library, OSColorPicker, drawing_area } = new_data
  const { sankey } = drawing_area
  const { ref_selected_style_node } = new_data.menu_configuration
  const { ref_setter_show_modal_styles_nodes } = new_data.menu_configuration.dict_setter_show_dialog
  const { icon_direction_down, icon_direction_left, icon_direction_rift, icon_direction_up, icon_locked, icon_unlocked } = icon_library
  // Elements on which this menu applies ------------------------------------------------

  let selected_nodes: Class_NodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_NodeStyle[] | Class_NodeElement[]

  const updateValueForListElements = <TModel, TKey extends keyof TModel>(
    model: TModel[],
    key: TKey,
    value: TModel[TKey] | undefined
  ) => {
    model.forEach(el => updateValueForElement(el, key, value))
  }

  const updateValueForElement = <TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey] | undefined
  ) => {
    model[key] = value as TModel[TKey]
  }


  /**
   *  Define a type of function that will be used to update elements and save unde/redo in data history
   *
   * We can't directly define 1 function to treat Style & Links because they don't have exactly the same Class functions
   *
   * And generic function setValueWithDecoratorRetriever don't like it
   *  @type {*} */
  let updateElements: (((k: keyNodeStyle, value: typeValNodeStyle|undefined) => void) | ((k: keyNodeAttr, value: typeValNodeAttr|undefined) => void))
  let disable_attr_props = sankey.node_styles_dict[default_style_id].customisable_attribute
  if (menu_for_style) {
    elements = [sankey.node_styles_dict[ref_selected_style_node.current]]
    disable_attr_props = sankey.node_styles_dict[ref_selected_style_node.current].customisable_attribute
    updateElements = (k: keyNodeStyle, value: typeValNodeStyle|undefined) => {
      // Save old value
      const old_val = sankey.node_styles_dict[ref_selected_style_node.current][k]
      // Define fucntion that will mutate value of 'k' attribute in Style
      const _updateElements = (_: typeValNodeStyle|undefined) => {
        updateValueForListElements([sankey.node_styles_dict[ref_selected_style_node.current]], k, _)
        refreshThisAndUpdateRelatedComponents()
      }
      // Save undo/redo in data history
      new_data.history.saveUndo(() => _updateElements(old_val))
      new_data.history.saveRedo(() => _updateElements(value))
      // Execute original attr mutation
      _updateElements(value)
    }
  }
  else {
    elements = selected_nodes
    updateElements = (k: keyNodeAttr, value: typeValNodeAttr) => {
      // Save old values in dict so the undo reset value for previous value of each node
      const dict_old_val: { [x: string]: typeValNodeAttr } = {}
      selected_nodes.forEach(l => dict_old_val[l.id] = l[k])
      // Define fucntion that will mutate value of 'k' attribute in Node
      const _updateElements = (_: typeValNodeAttr) => {
        updateValueForListElements(selected_nodes, k, _)
        refreshThisAndUpdateRelatedComponents()
      }
      const inv_updateElements = () => {
        selected_nodes.forEach(l => updateValueForElement(l, k, dict_old_val[l.id]))
        refreshThisAndUpdateRelatedComponents()
      }
      // Save undo/redo in data history
      new_data.history.saveUndo(inv_updateElements)
      new_data.history.saveRedo(() => _updateElements(value))
      // Execute original attr mutation
      _updateElements(value)
    }
  }

  // Elements attributes ----------------------------------------------------------------

  /**
   *
   * function that go throught all Class_NodeElement of an array & check if they're all equals
   * (to the first )
   *
   * @param {Class_NodeElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Class_NodeElement,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)
  const element_ref = elements[0]
  // Get values or default values
  const shape_visible = (element_ref?.shape_visible ?? NODES_ATTRIBUTES_CONFIG.shape_visible.default)
  const shape_min_width = (element_ref?.shape_min_width ?? NODES_ATTRIBUTES_CONFIG.shape_min_width.default)
  const shape_min_height = (element_ref?.shape_min_height ?? NODES_ATTRIBUTES_CONFIG.shape_min_height.default)
  const shape_color = (element_ref?.shape_color ?? NODES_ATTRIBUTES_CONFIG.shape_color.default)
  const shape_type = (element_ref?.shape_type ?? NODES_ATTRIBUTES_CONFIG.shape_type.default)
  const shape_arrow_angle_factor = (element_ref?.shape_arrow_angle_factor ?? NODES_ATTRIBUTES_CONFIG.shape_arrow_angle_factor.default)
  const shape_arrow_angle_direction = (element_ref?.shape_arrow_angle_direction ?? NODES_ATTRIBUTES_CONFIG.shape_arrow_angle_direction.default)
  const shape_color_sustainable = (element_ref?.shape_color_sustainable ?? NODES_ATTRIBUTES_CONFIG.shape_color_sustainable.default)
  const shape_opacity = (element_ref?.shape_opacity ?? NODES_ATTRIBUTES_CONFIG.shape_opacity.default)


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
    new_data.menu_configuration.ref_to_menu_config_nodes_apparence_visual_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_nodes_styles_updater.current = () => setCountStyle(a => a + 1)
  }
  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToNodesApparence()
  }

  // Node to ConfigMenuNumberInput state variable
  const number_of_input = 7
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(shape_min_height))
  ref_set_number_inputs[1].current(String(shape_min_width))
  ref_set_number_inputs[2].current(String(position_u))
  ref_set_number_inputs[3].current(String(position_dy))
  ref_set_number_inputs[6].current(String(shape_opacity))

  const is_shape_min_height_indeterminated = !elements.every(el => el.shape_min_height == element_ref.shape_min_height)
  const is_shape_min_width_indeterminated = !elements.every(el => el.shape_min_width == element_ref.shape_min_width)
  const is_shape_opacity_indeterminated = !elements.every(el => el.shape_opacity == element_ref.shape_opacity)

  // JSX menu components ---------------------------------------------------------------

  /**
   * Local component that add a icon with a tooltip to show attribute value is managed by node attribute (and not style as by default)
   *
   * @param {*} {k}
   * @return {*}
   */
  const TooltipElementOverloaded: FunctionComponent<{ k: keyof Class_NodeAttribute }> = ({ k }) => {
    if (menu_for_style)
      return <></>

    return isAttributeOverloaded(selected_nodes, k) ? (
      <>{TooltipValueSurcharge('node_var_', t)}</>
    ) : <></>
  }

  // Check if the 1st selected node has a tag selected from the group tag 'type de noeud' so we can disable the selection of the node shape
  const content_appearence = <Box layerStyle='menu_sub_section' >
    {/* Visibilite du noeud */}
    <Box as='span' layerStyle='menu_sub_section_title' >
      <Checkbox
        isDisabled={!disable_attr_props['shape_visible']}
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isChecked={shape_visible}
        isIndeterminate={
          is_indeterminated
        }
        onChange={(evt) => {
          updateElements('shape_visible', evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.apparence.tooltips.shape_visible')}>
          {t('Noeud.apparence.shape_visible')}
        </OSTooltip>
        <TooltipElementOverloaded k='shape_visible' />
      </Checkbox>
    </Box>
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
          <TooltipElementOverloaded k='shape_color' />
        </Box>
        <Box layerStyle='option_with_activation'>
          <OSTooltip label={t('Noeud.apparence.tooltips.shape_color')}>
            <Box>
              <OSColorPicker
                isDisabled={!disable_attr_props['shape_color']}
                initialColor={shape_color}
                functionOnBlur={(new_color) => {
                  updateElements('shape_color', new_color)
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
                updateElements('shape_color_sustainable', !shape_color_sustainable)
              }}
            >
              {shape_color_sustainable ? icon_locked : icon_unlocked}
              <TooltipElementOverloaded k='shape_color_sustainable' />
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Forme du noeud */}
      <OSTooltip label={t('Noeud.apparence.tooltips.shape_type')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.apparence.shape_type')}
            <TooltipElementOverloaded k='shape_type' />
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
                updateElements('shape_type', 'ellipse')
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
                updateElements('shape_type', 'rect')
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
                updateElements('shape_type', 'arrow')
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
                  <TooltipElementOverloaded k='shape_arrow_angle_factor' />
                </Box>
                <Slider
                  isDisabled={!disable_attr_props['shape_arrow_angle_factor']}
                  min={0}
                  max={45}
                  step={5}
                  value={shape_arrow_angle_factor}
                  onChange={(value) => {
                    updateElements('shape_arrow_angle_factor', value)
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
                <TooltipElementOverloaded k='shape_arrow_angle_direction' />
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
                    updateElements('shape_arrow_angle_direction', 'left')
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
                    updateElements('shape_arrow_angle_direction', 'right')
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
                    updateElements('shape_arrow_angle_direction', 'top')

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
                    updateElements('shape_arrow_angle_direction', 'bottom')
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
      <OSTooltip label={t('Noeud.apparence.tooltips.shape_opacity')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.apparence.shape_opacity')}
            <TooltipElementOverloaded k='shape_opacity' />
          </Box>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['shape_opacity']}
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[6]}
            default_value={shape_opacity}
            function_on_blur={(value) => {
              updateElements('shape_opacity', (value ?? undefined))
            }}
            menu_for_style={menu_for_style}
            minimum_value={0}
            maximum_value={1}
            step={0.1}
            stepper={true}
            unit_text='%'
            multiValue={is_shape_opacity_indeterminated}
          />
        </Box>
      </OSTooltip>
    </> : <></>}
  </Box>

  const content_geometry = <WrapperBoxSubSectionMenu collapse={false} new_data={new_data} title={t('Noeud.apparence.Geometry')}><>
    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.size')}
    </Box>

    {/* Largeur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.shape_min_width')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.shape_min_width')}
          <TooltipElementOverloaded k='shape_min_width' />
        </Box>
        <ConfigMenuNumberInput
          disabled={!disable_attr_props['shape_min_width']}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[1]}
          default_value={shape_min_width}
          function_on_blur={(value) => {
            updateElements('shape_min_width', (value ?? undefined))
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
          multiValue={is_shape_min_width_indeterminated}
        />
      </Box>
    </OSTooltip>

    {/* Hauteur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.shape_min_height')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.shape_min_height')}
          <TooltipElementOverloaded k='shape_min_height' />
        </Box>
        <ConfigMenuNumberInput
          disabled={!disable_attr_props['shape_min_height']}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={shape_min_height}
          function_on_blur={(value) => {
            updateElements('shape_min_height', (value ?? undefined))
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
          multiValue={is_shape_min_height_indeterminated}
        />
      </Box>
    </OSTooltip>
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
              position_type==='absolute'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element =>  element.position_type = 'absolute')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_absolute')}
          </Button>

          <Button
            variant={
              position_type==='parametric'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'}
            onClick={() => {
              elements.forEach(element =>  element.position_type = 'parametric')
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_parametric')}
          </Button>

          <Button
            variant={
              position_type==='relative'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'
            }
            onClick={() => {
              elements.forEach(element =>  {
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
    {!menu_for_style ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry_u')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_u')}
        </Box>

        <ConfigMenuNumberInput
          t={new_data.t}
          default_value={position_u}
          ref_to_set_value={ref_set_number_inputs[2]}
          menu_for_style={menu_for_style}
          function_on_blur={() => {
            drawing_area.nodePositioning.computeParametricV()
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          minimum_value={1}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip> : <></>}
    <OSTooltip label={t('Noeud.apparence.tooltips.geometry_dx')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_dx')}
        </Box>
        <ConfigMenuNumberInput
          t={new_data.t}
          default_value={position_dx}
          ref_to_set_value={ref_set_number_inputs[4]}
          menu_for_style={menu_for_style}
          function_on_blur={() => {
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip>
    <OSTooltip label={t('Noeud.apparence.tooltips.geometry_dy')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_dy')}
        </Box>
        <ConfigMenuNumberInput
          t={new_data.t}
          default_value={position_dy}
          ref_to_set_value={ref_set_number_inputs[5]}
          menu_for_style={menu_for_style}
          function_on_blur={() => {
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip>
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
  let style_node = <></>

  if (!menu_for_style) {
    // Dict of attribute who overwrite style value
    const dict_overwritted_attr = {
      shape_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_visible'), name: t('Noeud.apparence.shape_visible') },
      shape_min_width: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_min_width'), name: t('Noeud.apparence.shape_min_width') },
      shape_min_height: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_min_height'), name: t('Noeud.apparence.shape_min_height') },
      shape_color: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_color'), name: t('Noeud.apparence.shape_color') },
      shape_type: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_type'), name: t('Noeud.apparence.shape_type') },
      shape_arrow_angle_factor: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_arrow_angle_factor'), name: t('Noeud.apparence.shape_arrow_angle_factor') },
      shape_arrow_angle_direction: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_arrow_angle_direction'), name: t('Noeud.apparence.shape_arrow_angle_direction') },
      shape_color_sustainable: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_color_sustainable'), name: t('Noeud.apparence.shape_color_sustainable') },
      shape_opacity: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_opacity'), name: t('Noeud.apparence.shape_opacity') }
    }
    const options_selector: typeElementSelectable = sankey.node_styles_list.map(style => {
      return {
        value: style.id,
        label: style.name,
        selected: (element_ref as Class_NodeElement)?.style.includes(style) ?? false,
        disabled:style.id==default_style_id,
      }
    })
    style_node = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Style')} ><>
      <Box layerStyle='menuconfigpanel_row_stylechoice' >
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal new_data={new_data} nodesOrLinks='nodes' dict_overwritted_attr={dict_overwritted_attr} />
        </OSTooltip>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            if (selected_nodes.length !== 0) {
              const style = selected_nodes[0].style
              const list_id_style = style.map(s => s.id)
              let inchangee = true
              selected_nodes.forEach(node => {
                inchangee = (node.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
              })
              if (inchangee) {
                ref_selected_style_node.current = [...style].reverse()[0].id
              }
            }
            new_data.menu_configuration.updateComponentRelatedToNodesStyles()
            ref_setter_show_modal_styles_nodes.current(true)

          }}
        >
          {icon_library.icon_edit_style}
        </Button>
        <OSMultiSelect
          t={t}
          elements={options_selector}
          onClick={(entries) => {
            // Update selection list
            const entries_values = entries.map(d => d.value)
            sankey.node_styles_list.forEach(style => {
              sankey.switchNodeStyle(style, entries_values.includes(style.id))
            })

          }}
        />
      </Box>
      <MenuOrderStylesOfSelectedNodes new_data={new_data} />
    </>
    </WrapperBoxSubSectionMenu>
  }


  const selection_node = menu_for_style ? <></> : <SankeyNodeSelectionSimple new_data={new_data} />

  return <>
    <React.Fragment key={'selection_node'}>{selection_node}</React.Fragment>
    <React.Fragment key={'style_node'}>{style_node}</React.Fragment>
    <>{elements.length > 0 ?
      <>
        <React.Fragment key={'app'}>{content_appearence}</React.Fragment>
        <React.Fragment key={'geometry'}>{content_geometry}</React.Fragment>
        {additional_content}
      </> : <></>
    }</>

  </>
}


export const MenuConfigurationNodeContext: FunctionComponent<FCType_MenuConfigurationNodeStyle> = ({ new_data, menu_for_style }) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, menu_configuration, icon_library, OSColorPicker, drawing_area } = new_data
  const { sankey } = drawing_area
  const { icon_edit_style } = icon_library
  const { ref_selected_style_node, dict_setter_show_dialog } = menu_configuration
  const { ref_setter_show_modal_styles_nodes_context } = dict_setter_show_dialog

  // Elements on which this menu applies ------------------------------------------------
  let selected_nodes: Class_NodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_NodeStyle[] | Class_NodeElement[]

  const updateValueForListElements = <TModel, TKey extends keyof TModel>(
    model: TModel[],
    key: TKey,
    value: TModel[TKey] | undefined
  ) => {
    model.forEach(el => updateValueForElement(el, key, value))
  }

  const updateValueForElement = <TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey] | undefined
  ) => {
    model[key] = value as TModel[TKey]
  }


  let updateElements: (((k: keyNodeStyle, value: typeValNodeStyle | undefined) => void) | ((k: keyNodeAttr, value: typeValNodeAttr| undefined) => void))
  let disable_attr_props = sankey.node_styles_dict[default_style_id].customisable_attribute
  elements = [sankey.node_styles_dict[ref_selected_style_node.current]]
  if (menu_for_style) {
    disable_attr_props = sankey.node_styles_dict[ref_selected_style_node.current].customisable_attribute
    updateElements = (k: keyNodeStyle, value: typeValNodeStyle| undefined) => {
      // Save old value
      const old_val = sankey.node_styles_dict[ref_selected_style_node.current][k]
      // Define fucntion that will mutate value of 'k' attribute in Style
      const _updateElements = (_: typeValNodeStyle| undefined) => {
        updateValueForListElements([sankey.node_styles_dict[ref_selected_style_node.current]], k, _)
        refreshThisAndUpdateRelatedComponents()
      }
      // Save undo/redo in data history
      new_data.history.saveUndo(() => _updateElements(old_val))
      new_data.history.saveRedo(() => _updateElements(value))
      // Execute original attr mutation
      _updateElements(value)
    }
  }
  else {
    elements = selected_nodes
    updateElements = (k: keyNodeAttr, value: typeValNodeAttr) => {
      // Save old values in dict so the undo reset value for previous value of each node
      const dict_old_val: { [x: string]: typeValNodeAttr } = {}
      selected_nodes.forEach(l => dict_old_val[l.id] = l[k])
      // Define fucntion that will mutate value of 'k' attribute in Node
      const _updateElements = (_: typeValNodeAttr) => {
        updateValueForListElements(selected_nodes, k, _)
        refreshThisAndUpdateRelatedComponents()
      }
      const inv_updateElements = () => {
        selected_nodes.forEach(l => updateValueForElement(l, k, dict_old_val[l.id]))
        refreshThisAndUpdateRelatedComponents()
      }
      // Save undo/redo in data history
      new_data.history.saveUndo(inv_updateElements)
      new_data.history.saveRedo(() => _updateElements(value))
      // Execute original attr mutation
      _updateElements(value)
    }
  }

  /**
 * Local component that add a icon with a tooltip to show attribute value is managed by node attribute (and not style as by default)
 *
 * @param {*} {k}
 * @return {*}
 */
  const TooltipElementOverloaded: FunctionComponent<{ k: keyof Class_NodeAttribute }> = ({ k }) => {
    if (menu_for_style)
      return <></>

    return isAttributeOverloaded(selected_nodes, k) ? (
      <>{TooltipValueSurcharge('node_var_', t)}</>
    ) : <></>
  }

  /**
   *
   * function that go throught all Class_NodeElement of an array & check if they're all equals
   * (to the first )
   *
   * @param {Class_NodeElement} curr
        * @return {*}
        */
  const check_indeterminate = (curr: Class_NodeElement,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)
  const element_ref = elements[0]
  const name_label_is_visible = (element_ref?.name_label_is_visible ?? NODES_ATTRIBUTES_CONFIG.name_label_is_visible.default)
  const value_label_is_visible = (element_ref?.value_label_is_visible ?? NODES_ATTRIBUTES_CONFIG.value_label_is_visible.default)
  const name_label_background = (element_ref?.name_label_background ?? NODES_ATTRIBUTES_CONFIG.name_label_background.default)
  const name_label_background_color = (element_ref?.name_label_background_color ?? NODES_ATTRIBUTES_CONFIG.name_label_background_color.default)
  const value_label_background = (element_ref?.value_label_background ?? NODES_ATTRIBUTES_CONFIG.value_label_background.default)
  const value_label_background_color = (element_ref?.value_label_background_color ?? NODES_ATTRIBUTES_CONFIG.value_label_background_color.default)
  const name_label_box_width = (element_ref?.name_label_box_width ?? NODES_ATTRIBUTES_CONFIG.name_label_box_width.default)
  const value_label_horiz_shift = (element_ref?.value_label_horiz_shift ?? NODES_ATTRIBUTES_CONFIG.value_label_horiz_shift.default)
  const value_label_vert_shift = (element_ref?.value_label_vert_shift ?? NODES_ATTRIBUTES_CONFIG.value_label_vert_shift.default)
  const name_label_horiz_shift = (element_ref?.name_label_horiz_shift ?? NODES_ATTRIBUTES_CONFIG.name_label_horiz_shift.default)
  const name_label_vert_shift = (element_ref?.name_label_vert_shift ?? NODES_ATTRIBUTES_CONFIG.name_label_vert_shift.default)

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Node this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_nodes_apparence_context_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_nodes_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  /**
        * Function used to reset menu UI
        */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      // Update menus for node's apparence in case we use this for style
      new_data.menu_configuration.updateComponentRelatedToNodesStyles()
      // Redraw all visible nodes if we modifie node style
      sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToNodesApparence()
  }

  // Node to ConfigMenuNumberInput state variable
  const number_of_input = 11
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  ref_set_number_inputs[0].current(String(name_label_box_width))
  ref_set_number_inputs[1].current(String(name_label_horiz_shift))
  ref_set_number_inputs[2].current(String(name_label_vert_shift))
  ref_set_number_inputs[3].current(String(value_label_horiz_shift))
  ref_set_number_inputs[4].current(String(value_label_vert_shift))

  const is_name_label_box_width_indeterminated = !elements.every(el => el.name_label_box_width == element_ref.name_label_box_width)
  const is_name_label_horiz_shift_indeterminated = !elements.every(el => el.name_label_horiz_shift == element_ref.name_label_horiz_shift)
  const is_name_label_vert_shift_indeterminated = !elements.every(el => el.name_label_vert_shift == element_ref.name_label_vert_shift)
  const is_value_label_horiz_shift_indeterminated = !elements.every(el => el.value_label_horiz_shift == element_ref.value_label_horiz_shift)
  const is_value_label_vert_shift_indeterminated = !elements.every(el => el.value_label_vert_shift == element_ref.value_label_vert_shift)

  const ref_name_label_separator = useRef((_: string | null | undefined) => null)
  ref_name_label_separator.current(element_ref?.name_label_separator)

  const content_label = <Box layerStyle='menu_sub_section' >
    {/* Checkbox visibilité noeud */}

    <Box as='span' layerStyle='menu_sub_section_title' >
      <Checkbox
        isDisabled={!disable_attr_props['name_label_is_visible']}
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminated}
        isChecked={name_label_is_visible}
        onChange={(evt) => {
          updateElements('name_label_is_visible', evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.name_label_is_visible')}>
          {t('Noeud.labels.name_label_is_visible')}
        </OSTooltip>
        <TooltipElementOverloaded k='name_label_is_visible' />
      </Checkbox>
    </Box>
    {/* Masquer une partie des noms des noeuds */}
    <OSTooltip label={t('Menu.tooltips.node_label_sep')}>
      <Box layerStyle='menuconfigpanel_row_2cols_little_input' >
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep')}</Box>
        <ConfigMenuTextInput
          ref_to_set_value={ref_name_label_separator}
          function_get_value={() => { return element_ref?.name_label_separator }}
          function_on_blur={(_) => {
            //@ts-expect-error xxx
            updateElements('name_label_separator', _)
          }}
        />
      </Box>
    </OSTooltip>

    <OSTooltip label={t('Menu.tooltips.node_label_sep_pos')}>
      <Box layerStyle='menuconfigpanel_row_2cols_little_input' >
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep_pos')}</Box>
        <Box layerStyle='options_2cols'>
          <Button variant={element_ref?.name_label_separator_part == 'before' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            onClick={() => {
              updateElements('name_label_separator_part', 'before')
            }
            }
          >
            {t('Menu.before')}
          </Button>
          <Button variant={element_ref?.name_label_separator_part == 'after' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
            onClick={() => {
              updateElements('name_label_separator_part', 'after')
            }
            }
          >
            {t('Menu.after')}
          </Button>
        </Box>
      </Box>
    </OSTooltip>
    {name_label_is_visible ? <><SankeyMenuLabelComponent
      new_data={new_data}
      elements={elements}
      selectedElements={selected_nodes}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
      dict_decorator_name={{
        label_horiz: 'name_label_horiz',
        label_vert: 'name_label_vert',
        label_font_size: 'name_label_font_size',
        label_color: 'name_label_color',
        label_bold: 'name_label_bold',
        label_uppercase: 'name_label_uppercase',
        label_italic: 'name_label_italic',
        label_font_family: 'name_label_font_family',
      }} />

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >

      <Checkbox
        isDisabled={!disable_attr_props['name_label_background']}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminated}
        isChecked={name_label_background}
        onChange={(evt) => {
          updateElements('name_label_background', evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.name_label_background')}>
          {t('Noeud.labels.name_label_background')}
        </OSTooltip>
        <TooltipElementOverloaded k='name_label_background' />
      </Checkbox>
      <OSColorPicker
        isDisabled={!disable_attr_props['name_label_background_color']}
        initialColor={name_label_background_color}
        functionOnBlur={(new_color) => {
          updateElements('name_label_background_color', new_color)
        }}
      />
    </Box>
    {/* Largeur de la zone de texte du label */}
    <OSTooltip label={t('Noeud.labels.tooltips.cl')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.labels.name_label_box_width')}
          <TooltipElementOverloaded k='name_label_background' />
        </Box>
        <ConfigMenuNumberInput
          disabled={!disable_attr_props['name_label_box_width']}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={name_label_box_width}
          function_on_blur={(value) => {
            updateElements('name_label_box_width', (value ?? undefined))
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
          multiValue={is_name_label_box_width_indeterminated}
        />
      </Box>
    </OSTooltip>

    {/* Position horizontal du label par rapport à l'ancre*/}
    <OSTooltip label={t('Noeud.labels.tooltips.name_label_horiz_shift')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.labels.name_label_horiz_shift')}
          <TooltipElementOverloaded k='name_label_horiz_shift' />
        </Box>
        <ConfigMenuNumberInput
          disabled={!disable_attr_props['name_label_horiz_shift']}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[1]}
          default_value={name_label_horiz_shift}
          function_on_blur={(value) => {
            updateElements('name_label_horiz_shift', (value ?? undefined))
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
          multiValue={is_name_label_horiz_shift_indeterminated}
        />
      </Box>
    </OSTooltip>

    {/* Position vertical du label par rapport à l'ancre*/}
    <OSTooltip label={t('Noeud.labels.tooltips.anchor_dy')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.labels.anchor_dy')}
          <TooltipElementOverloaded k='name_label_vert_shift' />
        </Box>

        <ConfigMenuNumberInput
          disabled={!disable_attr_props['name_label_vert_shift']}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[2]}
          default_value={name_label_vert_shift}
          function_on_blur={(value) => {
            updateElements('name_label_vert_shift', (value ?? undefined))
          }}
          menu_for_style={menu_for_style}
          minimum_value={0}
          step={1}
          stepper={true}
          unit_text='pixels'
          multiValue={is_name_label_vert_shift_indeterminated}
        />
      </Box>
    </OSTooltip>
    </> : <></>}

  </Box>


  const content_label_value = <Box layerStyle='menu_sub_section'>
    <Box
      as='span'
      layerStyle='menu_sub_section_title'
    >
      <Checkbox
        isDisabled={!disable_attr_props['value_label_is_visible']}
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminated}
        isChecked={value_label_is_visible}
        onChange={(evt) => {
          updateElements('value_label_is_visible', evt.target.checked)
        }}>
        <OSTooltip label={t('Flux.labels.tooltips.label')}>
          {t('Flux.labels.vdb') + ' '}
        </OSTooltip>
        <TooltipElementOverloaded k='value_label_is_visible' />
      </Checkbox>
    </Box>
    {value_label_is_visible ? <>
      <SankeyMenuValueLabelComponent
        new_data={new_data}
        elements={elements}
        selectedElements={selected_nodes}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        dict_decorator_name={{
          label_horiz: 'value_label_horiz',
          label_vert: 'value_label_vert',
          label_font_size: 'value_label_font_size',
          label_color: 'value_label_color',
          label_font_family: 'value_label_font_family',
          label_bold: 'value_label_bold',
          label_uppercase: 'value_label_uppercase',
          label_italic: 'value_label_italic',
          label_custom_digit: 'value_label_custom_digit',
          label_nb_digit: 'value_label_nb_digit',
        }}
      />
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Checkbox
          isDisabled={!disable_attr_props['value_label_background']}
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminated}
          isChecked={value_label_background}
          onChange={(evt) => {
            updateElements('value_label_background', evt.target.checked)
          }}
        >
          <OSTooltip label={t('Noeud.labels.tooltips.name_label_background')}>
            {t('Noeud.labels.name_label_background')}
          </OSTooltip>
          <TooltipElementOverloaded k='value_label_background' />
        </Checkbox>
        <OSColorPicker
          isDisabled={!disable_attr_props['value_label_background_color']}
          initialColor={value_label_background_color}
          functionOnBlur={(new_color) => {
            updateElements('value_label_background_color', new_color)
          }}
        />
      </Box>
      {/* Position horizontal du label par rapport à l'ancre*/}
      <OSTooltip label={t('Noeud.labels.tooltips.name_label_horiz_shift')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.labels.name_label_horiz_shift')}
            <TooltipElementOverloaded k='value_label_horiz_shift' />
          </Box>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['value_label_horiz_shift']}
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[3]}
            default_value={value_label_horiz_shift}
            function_on_blur={(value) => {
              updateElements('value_label_horiz_shift', (value ?? undefined))
            }}
            menu_for_style={menu_for_style}
            minimum_value={0}
            step={1}
            stepper={true}
            unit_text='pixels'
            multiValue={is_value_label_horiz_shift_indeterminated}
          />
        </Box>
      </OSTooltip>

      {/* Position vertical du label par rapport à l'ancre*/}
      <OSTooltip label={t('Noeud.labels.tooltips.anchor_dy')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.labels.anchor_dy')}
            <TooltipElementOverloaded k='value_label_vert_shift' />
          </Box>

          <ConfigMenuNumberInput
            disabled={!disable_attr_props['value_label_vert_shift']}
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[4]}
            default_value={value_label_vert_shift}
            function_on_blur={(value) => {
              updateElements('value_label_vert_shift', (value ?? undefined))
            }}
            menu_for_style={menu_for_style}
            minimum_value={0}
            step={1}
            stepper={true}
            unit_text='pixels'
            multiValue={is_value_label_vert_shift_indeterminated}
          />
        </Box>
      </OSTooltip>

      {/* Config Label value unit */}
      <MenuUnit
        new_data={new_data}
        elements={elements}
        selectedElements={selected_nodes}
        refreshParentComponent={refreshThisAndUpdateRelatedComponents}
        dict_decorator_name={{
          label_unit_visible: 'value_label_unit_visible',
          label_unit: 'value_label_unit',
          label_unit_factor: 'value_label_unit_factor',
        }}
      />
    </> : <></>}

  </Box>


  let content_style = <></>
  if (!menu_for_style) {

    // Dict of attribute who overwrite style value
    const dict_overwritted_attr = {
      name_label_is_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_is_visible'), name: t('Noeud.labels.name_label_is_visible') },
      value_label_is_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_is_visible'), name: t('Flux.labels.vbd') },
      name_label_background: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_background'), name: t('Noeud.labels.name_label_is_visible') + ' ' + t('Noeud.labels.name_label_background') },
      name_label_background_color: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_background_color'), name: t('Noeud.labels.name_label_is_visible') + ' ' + t('Noeud.labels.name_label_background_color') },
      value_label_background: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_background'), name: t('Flux.labels.vbd') + ' ' + t('Noeud.labels.name_label_background') },
      value_label_background_color: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_background_color'), name: t('Flux.labels.vbd') + ' ' + t('Noeud.labels.name_label_background_color') },
      name_label_box_width: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_box_width'), name: t('Noeud.labels.name_label_box_width') },
      value_label_horiz_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_horiz_shift'), name: t('Flux.labels.vbd') + ' ' + t('Noeud.labels.name_label_horiz_shift') },
      value_label_vert_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_vert_shift'), name: t('Flux.labels.vbd') + ' ' + t('Noeud.labels.anchor_dy') },
      name_label_horiz_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_horiz_shift'), name: t('Noeud.labels.name_label_is_visible') + ' ' + t('Noeud.labels.name_label_horiz_shift') },
      name_label_vert_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_vert_shift'), name: t('Noeud.labels.name_label_is_visible') + ' ' + t('Noeud.labels.anchor_dy') },

      value_label_horiz: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_horiz'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_horiz') },
      value_label_vert: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_vert'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_vert') },
      value_label_font_size: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_font_size'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_font_size') },
      value_label_color: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_color'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_color') },
      value_label_font_family: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_font_family'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_font_family') },
      value_label_unit_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_unit_visible'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_unit_visible') },
      value_label_unit: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_unit'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_unit') },
      value_label_bold: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_bold'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_bold') },
      value_label_uppercase: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_uppercase'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_uppercase') },
      value_label_italic: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_italic'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_italic') },
      value_label_unit_factor: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_unit_factor'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_unit_factor') },
      value_label_custom_digit: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_custom_digit'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_custom_digit') },
      value_label_nb_digit: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_nb_digit'), name: t('Noeud.labels.value_label_is_visible') + ' ' + t('Noeud.labels.value_label_nb_digit') },

      name_label_horiz: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_horiz'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_horiz') },
      name_label_vert: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_vert'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_vert') },
      name_label_font_size: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_font_size'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_font_size') },
      name_label_color: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_color'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_color') },
      name_label_font_family: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_font_family'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_font_family') },
      name_label_bold: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_bold'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_bold') },
      name_label_uppercase: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_uppercase'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_uppercase') },
      name_label_italic: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_italic'), name: t('Label.name_title') + ' ' + t('Noeud.labels.name_label_italic') },
      name_label_separator: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_separator'), name: t('Label.name_separator') + ' ' + t('Noeud.labels.name_label_separator') },
      name_label_separator_part: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_separator_part'), name: t('Label.name_separator_part') + ' ' + t('Noeud.labels.name_label_separator_part') },
    }
    const options_selector: typeElementSelectable = sankey.node_styles_list.map(style => {
      return {
        value: style.id,
        label: style.name,
        selected: (element_ref as Class_NodeElement)?.style.includes(style) ?? false,
        disabled:style.id==default_style_id
      }
    })
    content_style = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Style')} ><>
      <Box layerStyle='menuconfigpanel_row_stylechoice' >
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal new_data={new_data} nodesOrLinks='nodes' dict_overwritted_attr={dict_overwritted_attr} />
        </OSTooltip>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            if (selected_nodes.length !== 0) {
              const style = selected_nodes[0].style
              const list_id_style = style.map(s => s.id)
              let inchangee = true
              selected_nodes.forEach(node => {
                inchangee = (node.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
              })
              if (inchangee) {
                ref_selected_style_node.current = [...style].reverse()[0].id
              }
            }
            new_data.menu_configuration.updateComponentRelatedToNodesStyles()
            ref_setter_show_modal_styles_nodes_context.current(true)
          }}
        >
          {icon_edit_style}
        </Button>
        <OSMultiSelect
          t={t}
          elements={options_selector}
          onClick={(entries) => {
            // Update selection list
            const entries_values = entries.map(d => d.value)
            sankey.node_styles_list.forEach(style => {
              sankey.switchNodeStyle(style, entries_values.includes(style.id))
            })
          }}
        />
      </Box>
      <MenuOrderStylesOfSelectedNodes new_data={new_data} />
    </>
    </WrapperBoxSubSectionMenu>
  }


  const selection_node = menu_for_style ? <></> : <SankeyNodeSelectionSimple new_data={new_data} />


  return <Box layerStyle='box_content_config'>
    <React.Fragment key={'selection_node'}>{selection_node}</React.Fragment>
    <React.Fragment key={'style'}>{content_style}</React.Fragment>
    {
      elements.length > 0 ? <>
        <React.Fragment key={'lab_text'}>{content_label}</React.Fragment>
        <React.Fragment key={'lab_val'}>{content_label_value}</React.Fragment></> : <></>
    }
  </Box>
}

/**
 * Component to modify order of style in selected elements,
 * it take first selected node has reference to which style must go before/after which style
 * (because order of style can be different between node)
 *
 * @param {*} { new_data }
 * @return {*}
 */
const MenuOrderStylesOfSelectedNodes: FunctionComponent<{ new_data: Class_ApplicationData }> = ({ new_data }) => {
  const { drawing_area, t, icon_library } = new_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  const elements = drawing_area.selected_nodes_list
  const style_list_to_use = elements[0]?.style.slice().reverse() ?? []

  return <WrapperBoxSubSectionMenu collapse={false} new_data={new_data} title={t('Noeud.OrderStyle')} >
    <DragDropContext onDragEnd={(evt) => {
      if (evt.destination?.index == undefined)
        return //early return if problem

      // We can't put a style before default style in node style order
      let dest_to_use = evt.destination.index
      if (dest_to_use == style_list_to_use.length - 1)
        dest_to_use = style_list_to_use.length - 2

      const style_src = style_list_to_use[evt.source.index]
      const style_trgt = style_list_to_use[dest_to_use]
      elements.forEach(_ => {
        drawing_area.moveOrderStyleInSelectedNodes(style_src, style_trgt)
      })
    }}>
      <Droppable droppableId="droppable">
        {(provided,) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ display: 'grid', gridRowGap: '0.2rem' }}
          >
            {
              style_list_to_use
                .map((node_style, element_idx) => {

                  const draggDisabled = node_style.id == default_style_id

                  return (
                    <Draggable isDragDisabled={draggDisabled} key={node_style.id} index={element_idx} draggableId={'line_drag_' + node_style.id}>
                      {(provided, _) => (
                        <Box key={node_style.id} layerStyle='drag_line_element_order' ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={style_TableLineDragging(draggDisabled, provided.draggableProps.style)}
                        >
                          <Box className='name_element'>{node_style.name}</Box>
                          <Box layerStyle="options_2cols">
                            <Button
                              isDisabled={draggDisabled || element_idx == 0}
                              variant='menuconfigpanel_move_order_node_io'
                              minWidth='0'
                              onClick={() => {

                                const style_src = style_list_to_use[element_idx]
                                const style_trgt = style_list_to_use[element_idx - 1]
                                elements.forEach(_ => {
                                  drawing_area.moveOrderStyleInSelectedNodes(style_src, style_trgt)
                                })
                                new_data.menu_configuration.updateComponentRelatedToNodesApparence()
                              }}
                            >
                              {icon_move_element_up}
                            </Button>
                            <Button
                              isDisabled={element_idx == style_list_to_use.length - 2 || draggDisabled}
                              variant='menuconfigpanel_move_order_node_io'
                              minWidth='0'
                              onClick={() => {
                                const style_src = style_list_to_use[element_idx]
                                const style_trgt = style_list_to_use[element_idx + 1]
                                elements.forEach(_ => {
                                  drawing_area.moveOrderStyleInSelectedNodes(style_src, style_trgt)
                                })
                                new_data.menu_configuration.updateComponentRelatedToNodesApparence()
                              }}
                            >
                              {icon_move_element_down}
                            </Button>
                          </Box>
                        </Box>)}
                    </Draggable>
                  )
                })
            }
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  </WrapperBoxSubSectionMenu>
}
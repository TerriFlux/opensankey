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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
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
import type { Type_GenericNodeElement } from '../../types/Types'
import {
  isAttributeOverloaded,
} from '../../Elements/Node'
import {
  default_node_name_label_box_width,
  default_node_name_label_is_visible,
  default_shape_arrow_angle_direction,
  default_shape_arrow_angle_factor,
  default_shape_color,
  default_shape_color_sustainable,
  default_shape_min_height,
  default_shape_min_width,
  default_shape_type,
  default_shape_visible, default_dy,
  default_position_type,
  default_relative_dx,
  default_relative_dy,
  default_node_value_label_is_visible,
  default_node_name_label_background,
  default_node_value_label_background,
  default_node_value_label_horiz_shift,
  default_node_value_label_vert_shift,
  default_node_name_label_horiz_shift,
  default_node_name_label_vert_shift,
  default_node_name_label_background_color,
  default_node_value_label_background_color,
  Class_NodeAttribute
} from '../../Elements/NodeAttributes'
import { type Class_NodeStyle } from '../../Elements/NodeAttributes'
import {
  CustomFaEyeCheckIcon
} from '../../types/Utils'

// Local functions
import {
  OSTooltip,
  TooltipValueSurcharge,
} from '../../types/Utils'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'
import { MenuResetAttrLocal, MenuUnit, SankeyMenuLabelComponent, SankeyMenuValueLabelComponent, WrapperBoxSubSectionMenu } from './SankeyMenuComponents'
import { SankeyNodeSelection } from './SankeyMenuConfigurationNodes'
import { OSColorPicker } from './OSColorPicker'

export const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
export const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>
export const svg_label_upper = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z" /><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z" /></g></svg>


// Declare type used for generics functions

type keyNodeStyle = keyof Class_NodeStyle
type typeValNodeStyle = Class_NodeStyle[keyNodeStyle]
type keyNodeAttr = keyof Type_GenericNodeElement
type typeValNodeAttr = Type_GenericNodeElement[keyNodeAttr]

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
export const MenuConfigurationNodeStyle: FunctionComponent<FCType_MenuConfigurationNodeStyle> = ({
  new_data,
  menu_for_style,
  additional_menus,
}) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, icon_library } = new_data
  const { ref_selected_style_node } = new_data.menu_configuration
  const { ref_setter_show_modal_styles_nodes } = new_data.menu_configuration.dict_setter_show_dialog
  const { icon_direction_down, icon_direction_left, icon_direction_rift, icon_direction_up, icon_locked, icon_unlocked, icon_open_selector } = icon_library
  // Elements on which this menu applies ------------------------------------------------

  let selected_nodes: Type_GenericNodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_NodeStyle[] | Type_GenericNodeElement[]

  const updateValueForListElements = <TModel, TKey extends keyof TModel>(
    model: TModel[],
    key: TKey,
    value: TModel[TKey]
  ) => {
    model.forEach(el => updateValueForElement(el, key, value))
  }

  const updateValueForElement = <TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey]
  ) => {
    model[key] = value
  }


  /**
   *  Define a type of function that will be used to update elements and save unde/redo in data history
   * 
   * We can't directly define 1 function to treat Style & Links because they don't have exactly the same Class functions
   * 
   * And generic function setValueWithDecoratorRetriever don't like it
   *  @type {*} */
  let updateElements: (((k: keyNodeStyle, value: typeValNodeStyle) => void) | ((k: keyNodeAttr, value: typeValNodeAttr) => void))

  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current]]
    updateElements = (k: keyNodeStyle, value: typeValNodeStyle) => {
      // Save old value
      const old_val = new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current][k]
      // Define fucntion that will mutate value of 'k' attribute in Style
      const _updateElements = (_: typeValNodeStyle) => {
        updateValueForListElements([new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current]], k, _)
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
   * function that go throught all Type_GenericNodeElement of an array & check if they're all equals
   * (to the first )
   *
   * @param {Type_GenericNodeElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Type_GenericNodeElement,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)

  // Get values or default values
  const shape_visible = (elements[0]?.shape_visible ?? default_shape_visible)
  const shape_min_width = (elements[0]?.shape_min_width ?? default_shape_min_width)
  const shape_min_height = (elements[0]?.shape_min_height ?? default_shape_min_height)
  const shape_color = (elements[0]?.shape_color ?? default_shape_color)
  const shape_type = (elements[0]?.shape_type ?? default_shape_type)
  const shape_arrow_angle_factor = (elements[0]?.shape_arrow_angle_factor ?? default_shape_arrow_angle_factor)
  const shape_arrow_angle_direction = (elements[0]?.shape_arrow_angle_direction ?? default_shape_arrow_angle_direction)
  const shape_color_sustainable = (elements[0]?.shape_color_sustainable ?? default_shape_color_sustainable)


  const position_type = menu_for_style ?
    ((elements[0] as Class_NodeStyle)?.position.type ?? default_position_type) :
    ((elements[0] as Type_GenericNodeElement)?.position_type ?? default_position_type)
  const position_u = menu_for_style ?
    ((elements[0] as Class_NodeStyle)?.position.dx ?? 0) :
    ((elements[0] as Type_GenericNodeElement)?.display.position.u ?? 0)
  const position_dy = menu_for_style ?
    ((elements[0] as Class_NodeStyle)?.position.dy ?? default_dy) :
    ((elements[0] as Type_GenericNodeElement)?.display.position.dy ?? default_dy)
  const position_relative_dx = menu_for_style ?
    ((elements[0] as Class_NodeStyle)?.position.relative_dx ?? default_relative_dx) :
    ((elements[0] as Type_GenericNodeElement)?.display.position.relative_dx ?? default_relative_dx)
  const position_relative_dy = menu_for_style ?
    ((elements[0] as Class_NodeStyle)?.position.relative_dy ?? default_relative_dy) :
    ((elements[0] as Type_GenericNodeElement)?.display.position.relative_dy ?? default_relative_dy)


  // Components updaters ----------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Node this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_nodes_apparence_updater.current = () => setCount(a => a + 1)
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
      new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
    }
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToNodesApparence()
  }

  // Node to ConfigMenuNumberInput state variable
  const number_of_input = 11
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(shape_min_height))
  ref_set_number_inputs[1].current(String(shape_min_width))
  ref_set_number_inputs[2].current(String(position_u))
  ref_set_number_inputs[3].current(String(position_dy))
  ref_set_number_inputs[4].current(String(position_relative_dx))
  ref_set_number_inputs[5].current(String(position_relative_dy))


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
        <OSTooltip label={t('Noeud.apparence.tooltips.Visibilité')}>
          {t('Noeud.apparence.Visibilité')}
        </OSTooltip>
        <TooltipElementOverloaded k='shape_visible' />
      </Checkbox>
    </Box>

    {/* In this position of the array, there is an input who can change the node visibility (hide if intermediary)(dev) */}
    {additional_menus.advanced_appearence_content.splice(1, 1)}

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Menu.edition')}
    </Box>

    {/* Couleur du noeud */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Noeud.apparence.Couleur')}
        <TooltipElementOverloaded k='shape_color' />
      </Box>
      <Box layerStyle='option_with_activation'>
        <OSTooltip label={t('Noeud.apparence.tooltips.Couleur')}>
          <Box>
            <OSColorPicker
              initialColor={shape_color}
              functionOnBlur={(new_color) => {
                updateElements('shape_color', new_color)
              }}
            />
          </Box>
        </OSTooltip>
        <OSTooltip label={t('Noeud.apparence.tooltips.CouleurPérenne')}>
          <Button
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
    <OSTooltip label={t('Noeud.apparence.tooltips.Forme')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.Forme')}
          <TooltipElementOverloaded k='shape_type' />
        </Box>
        <Box layerStyle='options_3cols' >
          <Button
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
            {/* {t('Noeud.apparence.arrow')} */}
          </Button>
        </Box>
      </Box>
    </OSTooltip>

    {
      /* Change the angle of the arrow shaped node */
      shape_type === 'arrow' ?
        <Box layerStyle='menuconfigpanel_grid'>
          <OSTooltip label={t('Noeud.apparence.tooltips.arrow_angle')}>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Noeud.apparence.arrow_angle')}
                <TooltipElementOverloaded k='shape_arrow_angle_factor' />
              </Box>
              <Slider
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
              {t('Noeud.apparence.angle_orientation')}
              <TooltipElementOverloaded k='shape_arrow_angle_direction' />
            </Box>
            <Box layerStyle='options_4cols' >
              <Button
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

    <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.size')}
    </Box>

    {/* Largeur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TML')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TML')}
          <TooltipElementOverloaded k='shape_min_width' />
        </Box>
        <ConfigMenuNumberInput
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
        />
      </Box>
    </OSTooltip>

    {/* Hauteur minimale du noeud */}
    <OSTooltip label={t('Noeud.apparence.tooltips.TMH')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.TMH')}
          <TooltipElementOverloaded k='shape_min_height' />
        </Box>
        <ConfigMenuNumberInput
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
        />
      </Box>
    </OSTooltip>
    {!menu_for_style && position_type == 'parametric' ? <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      {t('Noeud.position')}
    </Box> : <></>}

    {/* Position du noeud */}
    {/* {menu_for_style ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry')}
          {((!menu_for_style) &&
            isPositionOverloaded(selected_nodes,'type')?
            <>{TooltipValueSurcharge('node_var_',t)}</>:
            <></>)}
        </Box>
        <Box layerStyle='options_3cols' >
          <Button
            value="absolute"
            variant={
              position_type==='absolute'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'}
            onClick={() => {
                elements.forEach(element =>  (element as Class_NodeStyle).position.type = 'absolute')
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
                elements.forEach(element =>  (element as Class_NodeStyle).position.type = 'parametric')
                refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_parametric')}
          </Button>

          { elements[0].id == 'NodeExportStyle' || elements[0].id == 'NodeImportStyle' ? <Button
            variant={
              position_type==='relative'?
                'menuconfigpanel_option_button_activated':
                'menuconfigpanel_option_button'
            }
            onClick={() => {
              elements.forEach(element =>  {
                  (element as Class_NodeStyle).position.type = 'relative'
                })
                refreshThisAndUpdateRelatedComponents()
            }}
          >
            {t('Noeud.apparence.geometry_relative')}
          </Button> : <></>}
        </Box>
      </Box>
    </OSTooltip>:<></>} */}
    {/* Ecarts horizontal des noeuds */}
    {!menu_for_style && position_type == 'parametric' ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry_u')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_u')}
        </Box>

        <ConfigMenuNumberInput
          default_value={position_u}
          ref_to_set_value={ref_set_number_inputs[2]}
          menu_for_style={menu_for_style}
          function_on_blur={() => {
            new_data.drawing_area.computeParametricV()
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          minimum_value={1}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip> : <></>}
    {/* Ecarts horizontal des noeuds
    {list_value['position'][0] == 'parametric' ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry_dx')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_dx')}
        </Box>
        <ConfigMenuNumberInput
          data={applicationData.data}
          parameter_to_modify={parameter_to_modify}
          selected_parameter={selected_parameter}
          menu_for_style={menu_for_style}
          local_var_of_node='dx'
          function_on_blur={()=>{
            updateMenuConfigNode()
            updateLinkAttachedToNodes()
          }}
          stepper={true}
          unitText='pixels'
        />
      </Box>
    </OSTooltip> : <></>} */}
    {/* Ecarts vertical des noeuds */}
    {menu_for_style && position_type == 'parametric' ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry_dy')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_dy')}
        </Box>
        <ConfigMenuNumberInput
          default_value={position_dy}
          ref_to_set_value={ref_set_number_inputs[3]}
          menu_for_style={menu_for_style}
          function_on_blur={val => {
            elements.forEach(element => (element as Class_NodeStyle).position.dy = val as number)
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip> : <></>}
    {/* Ecarts vertical des noeuds */}
    {menu_for_style && position_type == 'relative' ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry_relative_dx')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_relative_dx')}
        </Box>
        <ConfigMenuNumberInput
          default_value={position_relative_dx}
          ref_to_set_value={ref_set_number_inputs[4]}
          menu_for_style={menu_for_style}
          function_on_blur={() => {
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip> : <></>}
    {menu_for_style && position_type == 'relative' ? <OSTooltip label={t('Noeud.apparence.tooltips.geometry_relative_dy')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Noeud.apparence.geometry_relative_dy')}
        </Box>
        <ConfigMenuNumberInput
          default_value={position_relative_dy}
          ref_to_set_value={ref_set_number_inputs[5]}
          menu_for_style={menu_for_style}
          function_on_blur={() => {
            refreshThisAndUpdateRelatedComponents()
          }}
          stepper={true}
          unit_text='pixels'
        />
      </Box>
    </OSTooltip> : <></>}
    {/* Positionnement vertical automatique
    <Box as='span' >
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
    {additional_menus.advanced_appearence_content}
  </Box>


  const additional_content = additional_menus.additional_node_config_style.map((el, i) =>
    <React.Fragment key={'add_node_config_style_' + i}>{el}</React.Fragment>
  )
  let style_node = <></>

  if (!menu_for_style) {
    // Dict of attribute who overwrite style value
    const dict_overwritted_attr = {
      _shape_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_visible'), name: t('Noeud.apparence.Visibilité') },
      _shape_min_width: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_min_width'), name: t('Noeud.apparence.TML') },
      _shape_min_height: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_min_height'), name: t('Noeud.apparence.TMH') },
      _shape_color: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_color'), name: t('Noeud.apparence.Couleur') },
      _shape_type: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_type'), name: t('Noeud.apparence.Forme') },
      _shape_arrow_angle_factor: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_arrow_angle_factor'), name: t('Noeud.apparence.arrow_angle') },
      _shape_arrow_angle_direction: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_arrow_angle_direction'), name: t('Noeud.apparence.angle_orientation') },
      _shape_color_sustainable: { overloaded: isAttributeOverloaded(selected_nodes, 'shape_color_sustainable'), name: t('Noeud.apparence.CouleurPérenne') },
    }



    style_node = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Style')} >
      <Box layerStyle='menuconfigpanel_row_stylechoice' >
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal new_data={new_data} nodesOrLinks='nodes' dict_overwritted_attr={dict_overwritted_attr} />
        </OSTooltip>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { ref_setter_show_modal_styles_nodes.current(true) }}
        >
          {icon_library.icon_edit_style}
        </Button>
        <Menu>
          <MenuButton
            as={Button}
            variant='menuconfigpanel_option_button'
            rightIcon={icon_open_selector}
          >
            {new_data.drawing_area.sankey.getStyleOfSelectedNodes()}
          </MenuButton>
          <MenuList>
            {
              new_data.drawing_area.sankey.node_styles_list_sorted
                .map(style => {
                  return (<React.Fragment key={style.id}>
                    <MenuItem
                      key={style.id}
                      onClick={() => {
                        new_data.drawing_area.sankey.switchNodeStyle(style)
                      }}
                    >
                      {style.name}
                    </MenuItem></React.Fragment>
                  )
                })
            }
          </MenuList>
        </Menu>
      </Box></WrapperBoxSubSectionMenu>
  }


  const selection_node = menu_for_style ? <></> : <SankeyNodeSelection new_data={new_data} />

  return <>
    <React.Fragment key={'selection_node'}>{selection_node}</React.Fragment>
    <>{elements.length > 0 ?
      <>
        <React.Fragment key={'style_node'}>{style_node}</React.Fragment>
        <React.Fragment key={'app'}>{content_appearence}</React.Fragment>
        {additional_content}
      </> : <></>
    }</>

  </>
}


export const MenuConfigurationNodeContext: FunctionComponent<FCType_MenuConfigurationNodeStyle> = ({ new_data, menu_for_style }) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, menu_configuration, icon_library } = new_data
  const { icon_open_selector, icon_edit_style } = icon_library
  const { ref_selected_style_node, dict_setter_show_dialog } = menu_configuration
  const { ref_setter_show_modal_styles_nodes_context } = dict_setter_show_dialog
  // Elements on which this menu applies ------------------------------------------------
  let selected_nodes: Type_GenericNodeElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_nodes) {
    // All availables nodes
    selected_nodes = new_data.drawing_area.selected_nodes_list_sorted
  }
  else {
    // Only visible nodes
    selected_nodes = new_data.drawing_area.visible_and_selected_nodes_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_NodeStyle[] | Type_GenericNodeElement[]

  const updateValueForListElements = <TModel, TKey extends keyof TModel>(
    model: TModel[],
    key: TKey,
    value: TModel[TKey]
  ) => {
    model.forEach(el => updateValueForElement(el, key, value))
  }

  const updateValueForElement = <TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey]
  ) => {
    model[key] = value
  }


  let updateElements: (((k: keyNodeStyle, value: typeValNodeStyle) => void) | ((k: keyNodeAttr, value: typeValNodeAttr) => void))

  if (menu_for_style) {
    elements = [new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current]]
    updateElements = (k: keyNodeStyle, value: typeValNodeStyle) => {
      // Save old value
      const old_val = new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current][k]
      // Define fucntion that will mutate value of 'k' attribute in Style
      const _updateElements = (_: typeValNodeStyle) => {
        updateValueForListElements([new_data.drawing_area.sankey.node_styles_dict[ref_selected_style_node.current]], k, _)
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
   *
   * function that go throught all Type_GenericNodeElement of an array & check if they're all equals
   * (to the first )
   *
   * @param {Type_GenericNodeElement} curr
        * @return {*}
        */
  const check_indeterminate = (curr: Type_GenericNodeElement,) => {
    return (selected_nodes[0].isEqual(curr))
  }
  const is_indeterminated = !selected_nodes.every(check_indeterminate)

  const name_label_is_visible = (elements[0]?.name_label_is_visible ?? default_node_name_label_is_visible)
  const value_label_is_visible = (elements[0]?.value_label_is_visible ?? default_node_value_label_is_visible)
  const name_label_background = (elements[0]?.name_label_background ?? default_node_name_label_background)
  const name_label_background_color = (elements[0]?.name_label_background_color ?? default_node_name_label_background_color)
  const value_label_background = (elements[0]?.value_label_background ?? default_node_value_label_background)
  const value_label_background_color = (elements[0]?.value_label_background_color ?? default_node_value_label_background_color)
  const name_label_box_width = (elements[0]?.name_label_box_width ?? default_node_name_label_box_width)
  const value_label_horiz_shift = (elements[0]?.value_label_horiz_shift ?? default_node_value_label_horiz_shift)
  const value_label_vert_shift = (elements[0]?.value_label_vert_shift ?? default_node_value_label_vert_shift)
  const name_label_horiz_shift = (elements[0]?.name_label_horiz_shift ?? default_node_name_label_horiz_shift)
  const name_label_vert_shift = (elements[0]?.name_label_vert_shift ?? default_node_name_label_vert_shift)

  // Components updaters ----------------------------------------------------------------

  // Boolean used to force this component to reload
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Node this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_nodes_apparence_updater.current = () => setCount(a => a + 1)
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
      new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
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


  const content_label = <Box layerStyle='menu_sub_section' >
    {/* Checkbox visibilité noeud */}

    <Box as='span' layerStyle='menu_sub_section_title' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminated}
        isChecked={name_label_is_visible}
        onChange={(evt) => {
          updateElements('name_label_is_visible', evt.target.checked)
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.vdb')}>
          {t('Noeud.labels.vdb')}
        </OSTooltip>
        {((!menu_for_style) &&
          isAttributeOverloaded(selected_nodes, 'name_label_is_visible') ?
          TooltipValueSurcharge('node_var', t) :
          <></>
        )}
      </Checkbox>
    </Box>
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
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminated}
          isChecked={name_label_background}
          onChange={(evt) => {
            updateElements('name_label_background', evt.target.checked)
          }}
        >
          <OSTooltip label={t('Noeud.labels.tooltips.l_bg')}>
            {t('Noeud.labels.l_bg')}
          </OSTooltip>
          {
            (!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'name_label_background') ?
              TooltipValueSurcharge('node_var', t) :
              <></>
          }
        </Checkbox>
        <OSColorPicker
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
            {t('Menu.larg')}
            {
              (!menu_for_style) &&
                isAttributeOverloaded(selected_nodes, 'name_label_box_width') ?
                <>{TooltipValueSurcharge('node_var_', t)}</> :
                <></>
            }
          </Box>
          <ConfigMenuNumberInput
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
          />
        </Box>
      </OSTooltip>

      {/* Position horizontal du label par rapport à l'ancre*/}
      <OSTooltip label={t('Noeud.labels.tooltips.anchor_dx')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.labels.anchor_dx')}
            {(!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'name_label_horiz_shift') ?
              TooltipValueSurcharge('node_var', t) :
              <></>}
          </Box>
          <ConfigMenuNumberInput
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
          />
        </Box>
      </OSTooltip>

      {/* Position vertical du label par rapport à l'ancre*/}
      <OSTooltip label={t('Noeud.labels.tooltips.anchor_dy')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.labels.anchor_dy')}
            {(!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'name_label_vert_shift') ?
              TooltipValueSurcharge('node_var', t) :
              <></>}
          </Box>

          <ConfigMenuNumberInput
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
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminated}
        isChecked={value_label_is_visible}
        onChange={(evt) => {
          updateElements('value_label_is_visible', evt.target.checked)
        }}>
        <OSTooltip label={t('Flux.label.tooltips.label')}>
          {t('Flux.label.vdb') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
            isAttributeOverloaded(selected_nodes, 'value_label_is_visible') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
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
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminated}
          isChecked={value_label_background}
          onChange={(evt) => {
            updateElements('value_label_background', evt.target.checked)
          }}
        >
          <OSTooltip label={t('Noeud.labels.tooltips.l_bg')}>
            {t('Noeud.labels.l_bg')}
          </OSTooltip>
          {
            (!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'value_label_background') ?
              TooltipValueSurcharge('node_var', t) :
              <></>
          }
        </Checkbox>
        <OSColorPicker
          initialColor={value_label_background_color}
          functionOnBlur={(new_color) => {
            updateElements('value_label_background_color', new_color)
          }}
        />
      </Box>
      {/* Position horizontal du label par rapport à l'ancre*/}
      <OSTooltip label={t('Noeud.labels.tooltips.anchor_dx')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.labels.anchor_dx')}
            {(!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'value_label_horiz_shift') ?
              TooltipValueSurcharge('node_var', t) :
              <></>}
          </Box>
          <ConfigMenuNumberInput
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
          />
        </Box>
      </OSTooltip>

      {/* Position vertical du label par rapport à l'ancre*/}
      <OSTooltip label={t('Noeud.labels.tooltips.anchor_dy')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('Noeud.labels.anchor_dy')}
            {(!menu_for_style) &&
              isAttributeOverloaded(selected_nodes, 'value_label_vert_shift') ?
              TooltipValueSurcharge('node_var', t) :
              <></>}
          </Box>

          <ConfigMenuNumberInput
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
      _name_label_is_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_is_visible'), name: t('Noeud.labels.vdb') },
      _value_label_is_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_is_visible'), name: t('Flux.label.vbd') },
      _name_label_background: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_background'), name: t('Noeud.labels.vdb') + ' ' + t('Noeud.labels.l_bg') },
      _name_label_background_color: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_background_color'), name: t('Noeud.labels.vdb') + ' ' + t('Noeud.labels.l_bg_color') },
      _value_label_background: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_background'), name: t('Flux.label.vbd') + ' ' + t('Noeud.labels.l_bg') },
      _value_label_background_color: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_background_color'), name: t('Flux.label.vbd') + ' ' + t('Noeud.labels.l_bg_color') },
      _name_label_box_width: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_box_width'), name: t('Menu.larg') },
      _value_label_horiz_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_horiz_shift'), name: t('Flux.label.vbd') + ' ' + t('Noeud.labels.anchor_dx') },
      _value_label_vert_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_vert_shift'), name: t('Flux.label.vbd') + ' ' + t('Noeud.labels.anchor_dy') },
      _name_label_horiz_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_horiz_shift'), name: t('Noeud.labels.vdb') + ' ' + t('Noeud.labels.anchor_dx') },
      _name_label_vert_shift: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_vert_shift'), name: t('Noeud.labels.vdb') + ' ' + t('Noeud.labels.anchor_dy') },

      _value_label_horiz: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_horiz'), name: t('Label.value_title') + ' ' + t('Label.align_h') },
      _value_label_vert: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_vert'), name: t('Label.value_title') + ' ' + t('Label.align_v') },
      _value_label_font_size: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_font_size'), name: t('Label.value_title') + ' ' + t('Label.size') },
      _value_label_color: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_color'), name: t('Label.value_title') + ' ' + t('Label.color') },
      _value_label_font_family: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_font_family'), name: t('Label.value_title') + ' ' + t('Label.police') },
      _value_label_unit_visible: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_unit_visible'), name: t('Label.value_title') + ' ' + t('Label.unit') },
      _value_label_unit: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_unit'), name: t('Label.value_title') + ' ' + t('Label.unit_name') },
      _value_label_bold: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_bold'), name: t('Label.value_title') + ' ' + t('Label.bold') },
      _value_label_uppercase: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_uppercase'), name: t('Label.value_title') + ' ' + t('Label.uppercase') },
      _value_label_italic: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_italic'), name: t('Label.value_title') + ' ' + t('Label.italic') },
      _value_label_unit_factor: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_unit_factor'), name: t('Label.value_title') + ' ' + t('Label.unit_factor') },
      _value_label_custom_digit: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_custom_digit'), name: t('Label.value_title') + ' ' + t('Label.custom_digit') },
      _value_label_nb_digit: { overloaded: isAttributeOverloaded(selected_nodes, 'value_label_nb_digit'), name: t('Label.value_title') + ' ' + t('Label.NbDigit') },

      _name_label_horiz: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_horiz'), name: t('Label.name_title') + ' ' + t('Label.align_h') },
      _name_label_vert: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_vert'), name: t('Label.name_title') + ' ' + t('Label.align_v') },
      _name_label_font_size: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_font_size'), name: t('Label.name_title') + ' ' + t('Label.size') },
      _name_label_color: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_color'), name: t('Label.name_title') + ' ' + t('Label.color') },
      _name_label_font_family: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_font_family'), name: t('Label.name_title') + ' ' + t('Label.police') },
      _name_label_bold: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_bold'), name: t('Label.name_title') + ' ' + t('Label.bold') },
      _name_label_uppercase: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_uppercase'), name: t('Label.name_title') + ' ' + t('Label.uppercase') },
      _name_label_italic: { overloaded: isAttributeOverloaded(selected_nodes, 'name_label_italic'), name: t('Label.name_title') + ' ' + t('Label.italic') },
    }


    content_style = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Style')} >
      <Box layerStyle='menuconfigpanel_row_stylechoice' >
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal new_data={new_data} nodesOrLinks='nodes' dict_overwritted_attr={dict_overwritted_attr} />
        </OSTooltip>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => { ref_setter_show_modal_styles_nodes_context.current(true) }}
        >
          {icon_edit_style}
        </Button>
        <Menu>
          <MenuButton
            as={Button}
            variant='menuconfigpanel_option_button'
            rightIcon={icon_open_selector}
          >
            {new_data.drawing_area.sankey.getStyleOfSelectedNodes()}
          </MenuButton>
          <MenuList>
            {
              new_data.drawing_area.sankey.node_styles_list_sorted
                .map(style => {
                  return (<React.Fragment key={style.id}>
                    <MenuItem
                      key={style.id}
                      onClick={() => {
                        new_data.drawing_area.sankey.switchNodeStyle(style)
                      }}
                    >
                      {style.name}
                    </MenuItem></React.Fragment>
                  )
                })
            }
          </MenuList>
        </Menu>
      </Box></WrapperBoxSubSectionMenu>
  }


  const selection_node = menu_for_style ? <></> : <SankeyNodeSelection new_data={new_data} />


  return <Box layerStyle='box_content_config'>
    <React.Fragment key={'selection_node'}>{selection_node}</React.Fragment>
    <>
      {
        elements.length > 0 ? <>

          <React.Fragment key={'style'}>{content_style}</React.Fragment>
          <React.Fragment key={'lab_text'}>{content_label}</React.Fragment>
          <React.Fragment key={'lab_val'}>{content_label_value}</React.Fragment></> : <></>
      }</>
  </Box>
}
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

import React, { Fragment, FunctionComponent, MutableRefObject, useRef, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  InputGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
} from '@chakra-ui/react'

/*************************************************************************************************/

import {
  isAttributeOverloaded,
} from '../../Elements/Link'
import {
  default_shape_arrow_size,
  default_shape_color,
  default_shape_ending_curve,
  default_shape_ending_tangeant,
  default_shape_is_arrow,
  default_shape_is_curved,
  default_shape_is_recycling,
  default_shape_is_structure,
  default_shape_local_scale,
  default_shape_opacity,
  default_shape_orientation,
  default_shape_starting_curve,
  default_shape_starting_tangeant,
  default_link_value_label_is_visible,
  default_link_value_label_on_path,
  default_link_value_label_pos_auto,
  default_link_name_label_is_visible,
  default_shape_color_rule,
  Class_LinkAttribute,
  default_link_value_label_percent_input,
  default_link_value_label_percent_output
} from '../../Elements/LinkAttributes'
import { Class_LinkStyle } from '../../Elements/LinkAttributes'
import {
  Type_GenericApplicationData,
  Type_GenericLinkElement
} from '../../types/Types'
import {
  CustomFaEyeCheckIcon,
  default_style_id
} from '../../types/Utils'
import {
  FCType_MenuConfigurationLinksAppearence,
} from './types/SankeyMenuConfigurationLinksAppearenceTypes'
import {
  TooltipValueSurcharge,
  OSTooltip
} from '../../types/Utils'
import { ConfigMenuNumberInput, ConfigMenuNumberOrUndefinedInput } from './SankeyMenuConfiguration'
import { WrapperBoxSubSectionMenu, SankeyMenuLabelComponent, SankeyMenuValueLabelComponent, MenuResetAttrLocal, MenuUnit, OSMultiSelect, typeElementSelectable } from './SankeyMenuComponents'
import { SankeyLinkSelectionSimple } from './SankeyMenuConfigurationLinks'
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'

/*************************************************************************************************/
// Declare custom logo used for some button

/*************************************************************************************************/
// Declare type used for generics functions

type keyStyle = keyof Class_LinkStyle
type valStyle = Class_LinkStyle[keyStyle]
type keyLink = keyof Type_GenericLinkElement
type valLink = Type_GenericLinkElement[keyLink]


/*************************************************************************************************/

const style_TableLineDragging = (isDisabled: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  // change background colour if dragging
  background: isDisabled ? 'lightgrey' : 'unset',
  // styles we need to apply on draggables
  ...draggableStyle
})

export const MenuConfigurationLinksStyle: FunctionComponent<FCType_MenuConfigurationLinksAppearence> = ({
  new_data,
  additionMenus,
  menu_for_style
}) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, icon_library, OSColorPicker, drawing_area } = new_data
  const { sankey } = drawing_area

  const { icon_redo, icon_open_selector, icon_orientation_hh, icon_orientation_hv, icon_orientation_vh, icon_orientation_vv } = icon_library
  // Get data
  const { ref_selected_style_link, dict_setter_show_dialog } = new_data.menu_configuration
  const { ref_setter_show_modal_styles_links } = dict_setter_show_dialog

  // Elements on which this menu applies ------------------------------------------------

  // Selected links
  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStyle[] | Type_GenericLinkElement[]

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


  // Define a type of function that will be used to update elements and save unde/redo in data history
  // We can't directly define 1 function to treat Style & Links because they don't have exactly the same Class functions
  // And generic function setValueWithDecoratorRetriever don't like it
  let updateElements: (((k: keyStyle, value: valStyle) => void) | ((k: keyLink, value: valLink) => void))
  let disable_attr_props = sankey.link_styles_dict[default_style_id].customisable_attribute

  if (menu_for_style) {
    elements = [sankey.link_styles_dict[ref_selected_style_link.current]]
    disable_attr_props = sankey.link_styles_dict[ref_selected_style_link.current].customisable_attribute
    updateElements = (k: keyStyle, value: valStyle) => {
      // Save old value
      const old_val = sankey.link_styles_dict[ref_selected_style_link.current][k]
      // Define fucntion that will mutate value of 'k' attribute in Style
      const _updateElements = (_: valStyle) => {
        updateValueForListElements([sankey.link_styles_dict[ref_selected_style_link.current]], k, _)
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
    elements = selected_links
    updateElements = (k: keyLink, value: valLink) => {
      // Save old values in dict so the undo reset value for previous value of each link
      const dict_old_val: { [x: string]: valLink } = {}
      selected_links.forEach(l => dict_old_val[l.id] = l[k])
      // Define fucntion that will mutate value of 'k' attribute in Link
      const _updateElements = (_: valLink) => {
        updateValueForListElements(selected_links, k, _)
        refreshThisAndUpdateRelatedComponents()
      }
      const inv_updateElements = () => {
        selected_links.forEach(l => updateValueForElement(l, k, dict_old_val[l.id]))
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
   * function that go throught all links of an array & check if they're all equals
   * (to the first )
   * @param {Type_GenericLinkElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Type_GenericLinkElement) => {
    return (selected_links[0].isEqual(curr))
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)

  const element_ref = elements[0]
  const shape_orientation = (element_ref?.shape_orientation ?? default_shape_orientation)
  const shape_starting_curve = (element_ref?.shape_starting_curve ?? default_shape_starting_curve)
  const shape_ending_curve = (element_ref?.shape_ending_curve ?? default_shape_ending_curve)
  const shape_starting_tangeant = (element_ref?.shape_starting_tangeant ?? default_shape_starting_tangeant)
  const shape_ending_tangeant = (element_ref?.shape_ending_tangeant ?? default_shape_ending_tangeant)
  const shape_is_curved = (element_ref?.shape_is_curved ?? default_shape_is_curved)
  const shape_is_recycling = (element_ref?.shape_is_recycling ?? default_shape_is_recycling)
  const shape_arrow_size = (element_ref?.shape_arrow_size ?? default_shape_arrow_size)
  const shape_is_arrow = (element_ref?.shape_is_arrow ?? default_shape_is_arrow)
  const shape_color = (element_ref?.shape_color ?? default_shape_color)
  const shape_color_rule = (element_ref?.shape_color_rule ?? default_shape_color_rule)
  const shape_opacity = (element_ref?.shape_opacity ?? default_shape_opacity)
  const shape_is_structure = (element_ref?.shape_is_structure ?? default_shape_is_structure)
  const shape_local_scale = (element_ref?.shape_local_link_scale ?? default_shape_local_scale)



  // Components updaters ----------------------------------------------------------------

  // State variable to trigger this menu refreshing
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)
  // Link this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_links_apparence_visual_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_links_styles_updater.current = () => setCountStyle(a => a + 1)
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 6
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))

  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(shape_arrow_size))
  ref_set_number_inputs[1].current(String(shape_starting_curve * 100))
  ref_set_number_inputs[2].current(String(shape_ending_curve * 100))
  ref_set_number_inputs[3].current(String(shape_starting_tangeant * 100))
  ref_set_number_inputs[4].current(String(shape_ending_tangeant * 100))
  ref_set_number_inputs[5].current(String(shape_opacity))

  const ref_set_link_scale_inputs = useRef((_: string | null | undefined) => null)
  ref_set_link_scale_inputs.current(shape_local_scale as string | null | undefined)
  /**
   * Function used to reset menu UI
   */
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

  /**
   * Local component that add a icon with a tooltip to show attribute value is managed by node attribute (and not style as by default)
   *
   * @param {*} {k}
   * @return {*}
   */
  const TooltipElementOverloaded: FunctionComponent<{ k: keyof Class_LinkAttribute }> = ({ k }) => {
    if (menu_for_style)
      return <></>

    return isAttributeOverloaded(selected_links, k) ? (
      <>{TooltipValueSurcharge('node_var_', t)}</>
    ) : <></>
  }

  const is_arrow_size_indeterminated = !elements.every(el => el.shape_arrow_size == element_ref.shape_arrow_size)
  const is_starting_curve_indeterminated = !elements.every(el => el.shape_starting_curve == element_ref.shape_starting_curve)
  const is_ending_curve_indeterminated = !elements.every(el => el.shape_ending_curve == element_ref.shape_ending_curve)
  const is_starting_tangeant_indeterminated = !elements.every(el => el.shape_starting_tangeant == element_ref.shape_starting_tangeant)
  const is_ending_tangeant_indeterminated = !elements.every(el => el.shape_ending_tangeant == element_ref.shape_ending_tangeant)
  const is_opacity_indeterminated = !elements.every(el => el.shape_opacity == element_ref.shape_opacity)


  // JSX menu components ---------------------------------------------------------------

  const content_shape_color = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Flux.apparence.fond')}>
    <>
      {/* Choix de la source de la couleur */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_color_rule')}
          <TooltipElementOverloaded k={'shape_color_rule'} />
        </Box>
        <OSTooltip label={t('Flux.apparence.tooltips.color_source.def')}>
          <Select
            isDisabled={!disable_attr_props['shape_color_rule']}
            value={shape_color_rule}
            onChange={(evt) => {
              updateElements('shape_color_rule', evt.target.value)
            }}
          >
            {new_data.menu_configuration.flow_color_origin_type.map(el => {
              return <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
            })}
          </Select>
        </OSTooltip>
      </Box>

      {/* Choix de la couleur du flux */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_color')}
          <TooltipElementOverloaded k={'shape_color'} />
        </Box><Box>
          <OSColorPicker
            isDisabled={shape_color_rule !== 'flow' || !disable_attr_props['shape_color']}
            initialColor={shape_color}
            functionOnBlur={(new_color) => {
              updateElements('shape_color', new_color)
            }}
            textDisabled={t('Flux.apparence.tooltips.color_source.disabled')}
          />
        </Box>
      </Box>

      {/* Opacité */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_opacity')}
          <TooltipElementOverloaded k={'shape_opacity'} />
        </Box>
        <InputGroup variant='menuconfigpanel_option_input' >
          <OSTooltip label={t('Flux.apparence.tooltips.shape_opacity')}>
            <ConfigMenuNumberInput
              disabled={!disable_attr_props['shape_opacity']}
              t={new_data.t}
              ref_to_set_value={ref_set_number_inputs[5]}
              default_value={shape_opacity}
              menu_for_style={menu_for_style}
              minimum_value={0}
              maximum_value={1}
              step={0.1}
              stepper={true}
              function_on_blur={(value) => { updateElements('shape_opacity', value ?? undefined) }}
              multiValue={is_opacity_indeterminated}
            />

          </OSTooltip>
        </InputGroup>
      </Box>

      {additionMenus.current.additional_link_appearence_items.map((el, idx) => <Fragment key={'additional_apparence_' + idx}>{el(menu_for_style)}</Fragment>/*<React.Fragment key={'additional_config_link_' + i}>{el}</React.Fragment>*/)}
    </>
  </WrapperBoxSubSectionMenu>

  const content_shape_detail = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.apparence.shape_visible')}>
    <>

      {/* Orientation du flux */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >

        {/* Flux en recyclage  */}
        <OSTooltip label={t('Flux.apparence.tooltips.recy')}>
          <Button
            isDisabled={!disable_attr_props['shape_is_recycling']}
            className='btn_menu_config'
            variant={(shape_is_recycling) ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => { updateElements('shape_is_recycling', !shape_is_recycling) }}
          >
            {icon_redo}
          </Button>

        </OSTooltip>

        <Box layerStyle='options_4cols' >
          {/* Horizontal - Horizontal  */}
          <OSTooltip label={t('Flux.apparence.tooltips.of_hh')}>
            <Button
              isDisabled={!disable_attr_props['shape_orientation']}
              className='btn_menu_config'
              value='hh'
              variant={
                (shape_orientation === 'hh') ?
                  'menuconfigpanel_option_button_activated_left' :
                  'menuconfigpanel_option_button_left'
              }
              onClick={
                () => { updateElements('shape_orientation', 'hh') }
              }
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
              variant={(shape_orientation === 'vv') ? 'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => { updateElements('shape_orientation', 'vv') }}
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
                (shape_orientation === 'vh') ?
                  'menuconfigpanel_option_button_activated_center' :
                  'menuconfigpanel_option_button_center'
              }
              onClick={() => { updateElements('shape_orientation', 'vh') }}

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
                (shape_orientation === 'hv') ?
                  'menuconfigpanel_option_button_activated_right' :
                  'menuconfigpanel_option_button_right'
              }
              onClick={() => { updateElements('shape_orientation', 'hv') }}
            >
              {icon_orientation_hv}
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Forme courbée  */}
      <Checkbox
        isDisabled={!disable_attr_props['shape_is_curved']}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={shape_is_curved}
        onChange={(evt) => { updateElements('shape_is_curved', evt.target.checked) }}>
        <OSTooltip label={t('Flux.apparence.tooltips.courbe')}>
          {t('Flux.apparence.shape_is_curved')}
          <TooltipElementOverloaded k={'shape_is_curved'} />
        </OSTooltip>
      </Checkbox>
      <Box layerStyle='menuconfigpanel_row_2cols'>
        {/* Forme fleche droite  */}
        <Checkbox
          isDisabled={!disable_attr_props['shape_is_arrow']}
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminate}
          isChecked={shape_is_arrow}
          onChange={(evt) => { updateElements('shape_is_arrow', evt.target.checked) }}>
          <OSTooltip label={t('Flux.apparence.tooltips.fleche')}>
            {t('Flux.apparence.shape_is_arrow')}
          </OSTooltip>
        </Checkbox>

        {shape_is_arrow ?
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.apparence.shape_arrow_size')}
              <TooltipElementOverloaded k={'shape_arrow_size'} />
            </Box>
            <InputGroup variant='menuconfigpanel_option_input' >
              <OSTooltip label={t('Flux.apparence.tooltips.arrow_size')}>
                <ConfigMenuNumberInput
                  disabled={!disable_attr_props['shape_arrow_size']}
                  t={new_data.t}
                  ref_to_set_value={ref_set_number_inputs[0]}
                  default_value={shape_arrow_size}
                  menu_for_style={menu_for_style}
                  minimum_value={1}
                  stepper={true}
                  function_on_blur={(value) => { updateElements('shape_arrow_size', value ?? undefined) }}
                  multiValue={is_arrow_size_indeterminated}
                />
              </OSTooltip>
            </InputGroup>
          </Box>
          : <></>}

      </Box>
      {/* Forme en structure  */}
      <Checkbox
        isDisabled={!disable_attr_props['shape_is_structure']}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={shape_is_structure}
        onChange={(evt) => { updateElements('shape_is_structure', evt.target.checked) }}>
        <OSTooltip label={t('Flux.apparence.tooltips.structure')}>
          {t('Flux.apparence.shape_is_structure')}
          <TooltipElementOverloaded k={'shape_is_structure'} />
        </OSTooltip>
      </Checkbox>

      {/* Value of link local scale to override scale from DA, can be undefined */}
      <Box layerStyle='menuconfigpanel_grid' >
        <OSTooltip label={t('Flux.apparence.tooltips.local_scale')}>
          <>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Flux.apparence.local_link_scale')}
                <TooltipElementOverloaded k={'shape_local_link_scale'} />
              </Box>
              <ConfigMenuNumberOrUndefinedInput
                disabled={!disable_attr_props['shape_local_link_scale']}
                ref_to_set_value={ref_set_link_scale_inputs}
                default_value={selected_links[0]?.shape_local_link_scale ?? undefined}
                function_on_blur={(_) => { updateElements('shape_local_link_scale', (_ !== undefined) ? undefined : _) }}
                minimum_value={0}
                stepper={true}
                step={1}
              />
            </Box>
          </>
        </OSTooltip>
      </Box>
    </>
  </WrapperBoxSubSectionMenu>

  const content_geometry_detail = <WrapperBoxSubSectionMenu collapse={false} new_data={new_data} title={t('Noeud.apparence.Geometry')}>
    <>
      {/*Départ de courbure*/}
      {<Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_starting_curve')}
          <TooltipElementOverloaded k={'shape_starting_curve'} />
        </Box>
        <OSTooltip label={t('Flux.apparence.tooltips.starting_curve')}>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['shape_starting_curve']}
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[1]}
            default_value={shape_starting_curve * 100}
            function_on_blur={(value) => { updateElements('shape_starting_curve', (value ? value / 100 : undefined)) }}
            menu_for_style={menu_for_style}
            minimum_value={0}
            maximum_value={shape_ending_curve * 100}
            step={1}
            stepper={true}
            unit_text='%'
            multiValue={is_starting_curve_indeterminated}
          />
        </OSTooltip>
      </Box>}

      {/* Fin de courbure */}
      {<Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_ending_curve')}
          <TooltipElementOverloaded k={'shape_ending_curve'} />
        </Box>
        <OSTooltip label={t('Flux.apparence.tooltips.ending_curve')}>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['shape_ending_curve']}
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[2]}
            default_value={shape_ending_curve * 100}
            menu_for_style={menu_for_style}
            minimum_value={shape_starting_curve * 100}
            maximum_value={100}
            step={1}
            stepper={true}
            unit_text='%'
            function_on_blur={(value) => { updateElements('shape_ending_curve', (value ? value / 100 : undefined)) }}
            multiValue={is_ending_curve_indeterminated}
          />
        </OSTooltip>
      </Box>}


      {/* Modification de la longueur de la tangente de départ  */}
      {<Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_starting_tangeant')}
          <TooltipElementOverloaded k={'shape_starting_tangeant'} />
        </Box>
        <InputGroup variant='menuconfigpanel_option_input' >
          <OSTooltip label={t('Flux.apparence.tooltips.starting_tangeant')}>
            <ConfigMenuNumberInput
              disabled={!disable_attr_props['shape_starting_tangeant']}
              t={new_data.t}
              ref_to_set_value={ref_set_number_inputs[3]}
              default_value={shape_starting_tangeant * 100}
              menu_for_style={menu_for_style}
              minimum_value={0}
              step={1}
              stepper={true}
              unit_text='%'
              function_on_blur={(value) => { updateElements('shape_starting_tangeant', (value ? value / 100 : undefined)) }}
              multiValue={is_starting_tangeant_indeterminated}

            />
          </OSTooltip>
        </InputGroup>
      </Box>}


      {/* Modification de la longueur de la tangente de fin  */}
      {<Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_ending_tangeant')}
          <TooltipElementOverloaded k={'shape_ending_tangeant'} />
        </Box>
        <InputGroup variant='menuconfigpanel_option_input' >
          <OSTooltip label={t('Flux.apparence.tooltips.ending_tangeant')}>
            <ConfigMenuNumberInput
              disabled={!disable_attr_props['shape_ending_tangeant']}
              t={new_data.t}
              ref_to_set_value={ref_set_number_inputs[4]}
              default_value={shape_ending_tangeant * 100}
              menu_for_style={menu_for_style}
              minimum_value={0}
              step={1}
              stepper={true}
              unit_text='%'
              function_on_blur={(value) => { updateElements('shape_ending_tangeant', (value ? value / 100 : undefined)) }}
              multiValue={is_ending_tangeant_indeterminated}
            />
          </OSTooltip>
        </InputGroup>
      </Box>}
    </>
  </WrapperBoxSubSectionMenu>

  const content_config = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {content_shape_color}
    {content_shape_detail}
    {content_geometry_detail}
  </Box>


  let content_style = <></>
  if (!menu_for_style) {
    // Dict of attribute who overwrite style value
    const dict_overwritted_attr = {
      _shape_orientation: { overloaded: isAttributeOverloaded(selected_links, 'shape_orientation'), name: t('Flux.apparence.of') },
      _shape_starting_curve: { overloaded: isAttributeOverloaded(selected_links, 'shape_starting_curve'), name: t('Flux.apparence.shape_starting_curve') },
      _shape_ending_curve: { overloaded: isAttributeOverloaded(selected_links, 'shape_ending_curve'), name: t('Flux.apparence.shape_ending_curve') },
      _shape_starting_tangeant: { overloaded: isAttributeOverloaded(selected_links, 'shape_starting_tangeant'), name: t('Flux.apparence.shape_starting_tangeant') },
      _shape_ending_tangeant: { overloaded: isAttributeOverloaded(selected_links, 'shape_ending_tangeant'), name: t('Flux.apparence.shape_ending_tangeant') },
      _shape_is_curved: { overloaded: isAttributeOverloaded(selected_links, 'shape_is_curved'), name: t('Flux.apparence.shape_is_curved') },
      _shape_is_recycling: { overloaded: isAttributeOverloaded(selected_links, 'shape_is_recycling'), name: t('Flux.apparence.shape_is_recycling') },
      _shape_arrow_size: { overloaded: isAttributeOverloaded(selected_links, 'shape_arrow_size'), name: t('Flux.apparence.shape_arrow_size') },
      _shape_is_arrow: { overloaded: isAttributeOverloaded(selected_links, 'shape_is_arrow'), name: t('Flux.apparence.shape_is_arrow') },
      _shape_color: { overloaded: isAttributeOverloaded(selected_links, 'shape_color'), name: t('Flux.apparence.shape_color') },
      _shape_color_rule: { overloaded: isAttributeOverloaded(selected_links, 'shape_color_rule'), name: t('Flux.apparence.shape_color_rule') },
      _shape_opacity: { overloaded: isAttributeOverloaded(selected_links, 'shape_opacity'), name: t('Flux.apparence.shape_opacity') },
      _shape_is_structure: { overloaded: isAttributeOverloaded(selected_links, 'shape_is_structure'), name: t('Flux.apparence.shape_is_structure') },
      _shape_local_link_scale: { overloaded: isAttributeOverloaded(selected_links, 'shape_local_link_scale'), name: t('Flux.apparence.shape_local_link_scale') },
    }

    const options_selector: typeElementSelectable = sankey.link_styles_list.map(style => {
      return {
        value: style.id,
        label: style.name,
        selected: (element_ref as Type_GenericLinkElement)?.style.includes(style) ?? false,
        disabled: style.id == default_style_id,

      }
    })

    content_style = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Style')} ><>
      <Box layerStyle='menuconfigpanel_row_stylechoice' >
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal new_data={new_data} nodesOrLinks='links' dict_overwritted_attr={dict_overwritted_attr} />
        </OSTooltip>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            if (selected_links.length !== 0) {
              const style = selected_links[0].style
              const list_id_style = style.map(s => s.id)
              let inchangee = true
              selected_links.map(link => {
                inchangee = (link.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
              })
              if (inchangee) {
                ref_selected_style_link.current = [...style].reverse()[0].id

              }
            }
            new_data.menu_configuration.updateComponentRelatedToLinksStyles()
            ref_setter_show_modal_styles_links.current(true)

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
            sankey.link_styles_list.forEach(style => {
              sankey.switchLinkStyle(style, entries_values.includes(style.id))
            })

          }}
        />
      </Box>
      <MenuOrderStylesOfSelectedFlows new_data={new_data} />
    </>
    </WrapperBoxSubSectionMenu>

  }


  const selection_link = menu_for_style ? <></> : <SankeyLinkSelectionSimple new_data={new_data} />

  const content = <Box layerStyle='menuconfigpanel_grid'>
    {selection_link}
    {elements.length > 0 ? <>
      {content_style}
      {content_config}</> : <></>}
  </Box>

  /* Formattage de l'affichage du menu attribut de flux */
  return content
}

export const MenuConfigurationLinkContext: FunctionComponent<FCType_MenuConfigurationLinksAppearence> = ({ new_data, menu_for_style, additionMenus }) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, icon_library, drawing_area } = new_data
  const { sankey } = drawing_area
  const { icon_open_selector } = icon_library
  // Get data
  const { ref_selected_style_link, dict_setter_show_dialog } = new_data.menu_configuration
  const { ref_setter_show_modal_styles_links_context } = dict_setter_show_dialog

  // Elements on which this menu applies ------------------------------------------------
  // State variable to trigger this menu refreshing
  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // Link this menu's update function
  if (!menu_for_style) {
    new_data.menu_configuration.ref_to_menu_config_links_apparence_context_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_links_styles_updater.current = () => setCountStyle(a => a + 1)
  }
  // Selected links
  let selected_links
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = drawing_area.visible_and_selected_links_list_sorted
  }

  // Elements on which menu modification applies
  let elements: Class_LinkStyle[] | Type_GenericLinkElement[]

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
 * Function used to reset menu UI
 */
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

  // Define a type of function that will be used to update elements and save unde/redo in data history
  // We can't directly define 1 function to treat Style & Links because they don't have exactly the same Class functions
  // And generic function setValueWithDecoratorRetriever don't like it
  let updateElements: (((k: keyStyle, value: valStyle) => void) | ((k: keyLink, value: valLink) => void))
  let disable_attr_props = sankey.link_styles_dict[default_style_id].customisable_attribute

  if (menu_for_style) {
    elements = [sankey.link_styles_dict[ref_selected_style_link.current]]
    disable_attr_props = sankey.link_styles_dict[ref_selected_style_link.current].customisable_attribute

    updateElements = (k: keyStyle, value: valStyle) => {
      // Save old value
      const old_val = sankey.link_styles_dict[ref_selected_style_link.current][k]
      // Define fucntion that will mutate value of 'k' attribute in Style
      const _updateElements = (_: valStyle) => {
        updateValueForListElements([sankey.link_styles_dict[ref_selected_style_link.current]], k, _)
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
    elements = selected_links
    updateElements = (k: keyLink, value: valLink) => {
      // Save old values in dict so the undo reset value for previous value of each link
      const dict_old_val: { [x: string]: valLink } = {}
      selected_links.forEach(l => dict_old_val[l.id] = l[k])
      // Define fucntion that will mutate value of 'k' attribute in Link
      const _updateElements = (_: valLink) => {
        updateValueForListElements(selected_links, k, _)
        refreshThisAndUpdateRelatedComponents()
      }
      const inv_updateElements = () => {
        selected_links.forEach(l => updateValueForElement(l, k, dict_old_val[l.id]))
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
  const element_ref = elements[0]
  const value_label_on_path = (element_ref?.value_label_on_path ?? default_link_value_label_on_path)
  const value_label_pos_auto = (element_ref?.value_label_pos_auto ?? default_link_value_label_pos_auto)
  const value_label_is_visible = (element_ref?.value_label_is_visible ?? default_link_value_label_is_visible)
  const name_label_is_visible = (element_ref?.name_label_is_visible ?? default_link_name_label_is_visible)
  const name_label_on_path = (element_ref?.name_label_on_path ?? default_link_value_label_on_path)
  const name_label_pos_auto = (element_ref?.name_label_pos_auto ?? default_link_value_label_pos_auto)
  const value_label_percent_input = (element_ref?.value_label_percent_input ?? default_link_value_label_percent_input)
  const value_label_percent_output = (element_ref?.value_label_percent_output ?? default_link_value_label_percent_output)

  /**
   * function that go throught all links of an array & check if they're all equals
   * (to the first )
   * @param {Type_GenericLinkElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Type_GenericLinkElement) => {
    return (selected_links[0].isEqual(curr))
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)

  /**
   * Local component that add a icon with a tooltip to show attribute value is managed by node attribute (and not style as by default)
   *
   * @param {*} {k}
   * @return {*}
   */
  const TooltipElementOverloaded: FunctionComponent<{ k: keyof Class_LinkAttribute }> = ({ k }) => {
    if (menu_for_style)
      return <></>

    return isAttributeOverloaded(selected_links, k) ? (
      <>{TooltipValueSurcharge('link_var_', t)}</>
    ) : <></>
  }

  const content_value_specific_flow = value_label_is_visible ? <>
    {/* Orienter le texte du label le long du flux  */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isDisabled={!disable_attr_props['value_label_on_path']}
      isIndeterminate={is_indeterminate}
      isChecked={value_label_on_path}
      onChange={(evt) => { updateElements('value_label_on_path', evt.target.checked) }}>
      <OSTooltip label={t('Flux.labels.tooltips.acf')}>
        {t('Flux.labels.acf') + ' '}
      </OSTooltip>
      <TooltipElementOverloaded k='value_label_on_path' />
    </Checkbox>

    {/* Button to adjust label position in case the label is bigger than the link */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isIndeterminate={is_indeterminate}
      isDisabled={!disable_attr_props['value_label_pos_auto']}
      isChecked={value_label_pos_auto}
      onChange={(evt) => { updateElements('value_label_pos_auto', evt.target.checked) }}
    >
      <OSTooltip label={t('Flux.tooltips.ajust_label')}>
        {t('Flux.ajust_label')}
      </OSTooltip>
      <TooltipElementOverloaded k='value_label_pos_auto' />
    </Checkbox>
  </> : <></>

  const content_label_value = <Box layerStyle='menu_sub_section'>
    <Box
      as='span'
      layerStyle='menu_sub_section_title'
    >

      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        isDisabled={!disable_attr_props['value_label_is_visible']}
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminate}
        isChecked={value_label_is_visible}
        onChange={(evt) => { updateElements('value_label_is_visible', evt.target.checked) }}
      >
        <OSTooltip label={t('Flux.labels.tooltips.label')}>
          {t('Flux.labels.value_label_is_visible')}
        </OSTooltip>
        <TooltipElementOverloaded k='value_label_is_visible' />
      </Checkbox>
    </Box>
    {value_label_is_visible ?
      <>
        <SankeyMenuValueLabelComponent
          new_data={new_data}
          elements={elements}
          selectedElements={selected_links}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          dict_decorator_name={{
            label_horiz: 'value_label_horiz',
            label_vert: 'value_label_vert',
            label_font_size: 'value_label_font_size',
            label_color: 'value_label_color',
            label_bold: 'value_label_bold',
            label_uppercase: 'value_label_uppercase',
            label_italic: 'value_label_italic',
            label_font_family: 'value_label_font_family',
            label_custom_digit: 'value_label_custom_digit',
            label_nb_digit: 'value_label_nb_digit',
          }}
        />
        {content_value_specific_flow}
        {additionMenus.current.additional_link_appearence_value.map((el, idx) => <Fragment key={'additional_apparence_' + idx}>{el(menu_for_style)}</Fragment>)}
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isDisabled={!disable_attr_props['value_label_percent_input']}
          isChecked={value_label_percent_input}
          onChange={(evt) => {
            elements.forEach(element => {
              if (evt.target.checked) {
                element.value_label_percent_output = false
              }
              element.value_label_percent_input = evt.target.checked
            })
            refreshThisAndUpdateRelatedComponents()
          }}>
          <OSTooltip label={t('Flux.labels.tooltips.percentInput')}>
            {t('Flux.labels.percentInput') + ' '}
          </OSTooltip>
          {
            (!menu_for_style) &&
              isAttributeOverloaded(selected_links, 'value_label_percent_input') ?
              TooltipValueSurcharge('link_var_', t) :
              <></>
          }
        </Checkbox>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isDisabled={!disable_attr_props['value_label_percent_output']}
          isChecked={value_label_percent_output}
          onChange={(evt) => {
            elements.forEach(element => {
              if (evt.target.checked) {
                element.value_label_percent_input = false
              }
              element.value_label_percent_output = evt.target.checked
            })
            refreshThisAndUpdateRelatedComponents()
          }}>
          <OSTooltip label={t('Flux.labels.tooltips.percentOutput')}>
            {t('Flux.labels.percentOutput') + ' '}
          </OSTooltip>
          {
            (!menu_for_style) &&
              isAttributeOverloaded(selected_links, 'value_label_percent_output') ?
              TooltipValueSurcharge('link_var_', t) :
              <></>
          }
        </Checkbox>

        {/* Config Label value unit */}
        <MenuUnit
          new_data={new_data}
          elements={elements}
          selectedElements={selected_links}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          dict_decorator_name={{
            label_unit_visible: 'value_label_unit_visible',
            label_unit: 'value_label_unit',
            label_unit_factor: 'value_label_unit_factor',
          }}
        />
      </> :
      <></>}
  </Box>

  // Content specific to link label, it us not generic so not in SankeyMenuLabelComponent
  const content_name_specific_flow = name_label_is_visible ? <>
    {/* Orienter le texte du label le long du flux  */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isDisabled={!disable_attr_props['name_label_on_path']}
      isIndeterminate={is_indeterminate}
      isChecked={name_label_on_path}
      onChange={(evt) => { updateElements('name_label_on_path', evt.target.checked) }}
    >
      <OSTooltip label={t('Flux.labels.tooltips.acf')}>
        {t('Flux.labels.acf') + ' '}
      </OSTooltip>
      <TooltipElementOverloaded k='name_label_on_path' />
    </Checkbox>

    {/* Button to adjust label position in case the label is bigger than the link */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isDisabled={!disable_attr_props['name_label_pos_auto']}
      isIndeterminate={is_indeterminate}
      isChecked={name_label_pos_auto}
      onChange={(evt) => { updateElements('name_label_pos_auto', evt.target.checked) }}
    >
      <OSTooltip label={t('Flux.tooltips.ajust_label')}>
        {t('Flux.ajust_label')}
      </OSTooltip>
      <TooltipElementOverloaded k='name_label_pos_auto' />
    </Checkbox>
  </> : <></>

  const content_label_text = <Box layerStyle='menu_sub_section' >
    {/* Checkbox visibilité label nom flux */}

    <Box as='span' layerStyle='menu_sub_section_title' >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        isDisabled={!disable_attr_props['name_label_is_visible']}
        icon={<CustomFaEyeCheckIcon />}
        isIndeterminate={is_indeterminate}
        isChecked={name_label_is_visible}
        onChange={(evt) => { updateElements('name_label_is_visible', evt.target.checked) }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.name_label_is_visible')}>
          {t('Noeud.labels.name_label_is_visible')}
        </OSTooltip>
        <TooltipElementOverloaded k='name_label_is_visible' />
      </Checkbox>
    </Box>

    {name_label_is_visible ? <SankeyMenuLabelComponent
      new_data={new_data}
      elements={elements}
      selectedElements={selected_links}
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
      }} /> : <></>}

    {content_name_specific_flow}
  </Box>

  const selection_link = menu_for_style ? <></> : <SankeyLinkSelectionSimple new_data={new_data} />


  let content_style = <></>
  if (!menu_for_style) {
    // Dict of attribute who overwrite style value
    const dict_overwritted_attr = {
      _name_label_is_visible: { overloaded: isAttributeOverloaded(selected_links, 'name_label_is_visible'), name: t('Noeud.labels.name_label_is_visible') },
      _value_label_is_visible: { overloaded: isAttributeOverloaded(selected_links, 'value_label_is_visible'), name: t('Flux.labels.value_label_is_visible') },
      _value_label_on_path: { overloaded: isAttributeOverloaded(selected_links, 'value_label_on_path'), name: t('Label.name_title') + ' ' + t('Label.textPath') },
      _value_label_pos_auto: { overloaded: isAttributeOverloaded(selected_links, 'value_label_pos_auto'), name: '' },
      _name_label_on_path: { overloaded: isAttributeOverloaded(selected_links, 'name_label_on_path'), name: t('Label.name_title') + ' ' + t('Label.textPath') },
      _name_label_pos_auto: { overloaded: isAttributeOverloaded(selected_links, 'name_label_pos_auto'), name: '' },

      _value_label_horiz: { overloaded: isAttributeOverloaded(selected_links, 'value_label_horiz'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_horiz') },
      _value_label_vert: { overloaded: isAttributeOverloaded(selected_links, 'value_label_vert'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_vert') },
      _value_label_font_size: { overloaded: isAttributeOverloaded(selected_links, 'value_label_font_size'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_font_size') },
      _value_label_color: { overloaded: isAttributeOverloaded(selected_links, 'value_label_color'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_color') },
      _value_label_font_family: { overloaded: isAttributeOverloaded(selected_links, 'value_label_font_family'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_font_family') },
      _value_label_unit_visible: { overloaded: isAttributeOverloaded(selected_links, 'value_label_unit_visible'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_unit_visible') },
      _value_label_unit: { overloaded: isAttributeOverloaded(selected_links, 'value_label_unit'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_unit') },
      _value_label_bold: { overloaded: isAttributeOverloaded(selected_links, 'value_label_bold'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_bold') },
      _value_label_uppercase: { overloaded: isAttributeOverloaded(selected_links, 'value_label_uppercase'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_uppercase') },
      _value_label_italic: { overloaded: isAttributeOverloaded(selected_links, 'value_label_italic'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_italic') },
      _value_label_unit_factor: { overloaded: isAttributeOverloaded(selected_links, 'value_label_unit_factor'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_unit_factor') },
      _value_label_custom_digit: { overloaded: isAttributeOverloaded(selected_links, 'value_label_custom_digit'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_custom_digit') },
      _value_label_nb_digit: { overloaded: isAttributeOverloaded(selected_links, 'value_label_nb_digit'), name: t('Label.value_title') + ' ' + t('Flux.labels.value_label_nb_digit') },

      _name_label_horiz: { overloaded: isAttributeOverloaded(selected_links, 'name_label_horiz'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_horiz') },
      _name_label_vert: { overloaded: isAttributeOverloaded(selected_links, 'name_label_vert'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_vert') },
      _name_label_font_size: { overloaded: isAttributeOverloaded(selected_links, 'name_label_font_size'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_font_size') },
      _name_label_color: { overloaded: isAttributeOverloaded(selected_links, 'name_label_color'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_color') },
      _name_label_font_family: { overloaded: isAttributeOverloaded(selected_links, 'name_label_font_family'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_font_family') },
      _name_label_bold: { overloaded: isAttributeOverloaded(selected_links, 'name_label_bold'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_bold') },
      _name_label_uppercase: { overloaded: isAttributeOverloaded(selected_links, 'name_label_uppercase'), name: t('Label.name_title') + ' ' + t('Label.uppercase') },
      _name_label_italic: { overloaded: isAttributeOverloaded(selected_links, 'name_label_italic'), name: t('Label.name_title') + ' ' + t('Flux.labels.name_label_italic') },
    }

    const options_selector: typeElementSelectable = sankey.link_styles_list.map(style => {
      return {
        value: style.id,
        label: style.name,
        selected: (element_ref as Type_GenericLinkElement)?.style.includes(style) ?? false,
        disabled: style.id == default_style_id,

      }
    })
    content_style = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Noeud.Style')} ><>
      <Box layerStyle='menuconfigpanel_row_stylechoice' >
        <OSTooltip label={t('Noeud.tooltips.AS')}>
          <MenuResetAttrLocal new_data={new_data} nodesOrLinks='links' dict_overwritted_attr={dict_overwritted_attr} />
        </OSTooltip>
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            if (selected_links.length !== 0) {
              const style = selected_links[0].style
              const list_id_style = style.map(s => s.id)
              let inchangee = true
              selected_links.map(link => {
                inchangee = (link.style.every(style => list_id_style.includes(style.id))) ? inchangee : false
              })
              if (inchangee) {
                ref_selected_style_link.current = [...style].reverse()[0].id
              }
            }

            new_data.menu_configuration.updateComponentRelatedToLinksStyles()
            ref_setter_show_modal_styles_links_context.current(true)
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
            sankey.link_styles_list.forEach(style => {
              sankey.switchLinkStyle(style, entries_values.includes(style.id))
            })

          }}
        />
      </Box>
      <MenuOrderStylesOfSelectedFlows new_data={new_data} />
    </>
    </WrapperBoxSubSectionMenu>

  }

  return <>
    {selection_link}
    <>{elements.length > 0 ? <>
      {content_style}
      {content_label_value}
      {content_label_text}
    </> : <></>}</>
  </>
}


/**
 * Component to modify order of style in selected elements, 
 * it take first selected flow has reference to which style must go before/after which style
 * (because order of style can be different between flow)
 *
 * @param {*} { new_data }
 * @return {*} 
 */
export const MenuOrderStylesOfSelectedFlows: FunctionComponent<{ new_data: Type_GenericApplicationData }> = ({ new_data }) => {
  const { drawing_area, t, icon_library } = new_data
  const { icon_move_element_down, icon_move_element_up } = icon_library
  const elements = drawing_area.selected_links_list
  const style_list_to_use = elements[0]?.style.slice().reverse() ?? []

  return <WrapperBoxSubSectionMenu collapse={false} new_data={new_data} title={t('Noeud.OrderStyle')} >
    <DragDropContext onDragEnd={(evt) => {
      if (evt.destination?.index == undefined)
        return //early return if problem

      // We can't put a style before default style in flow style order
      let dest_to_use = evt.destination.index
      if (dest_to_use == style_list_to_use.length - 1)
        dest_to_use = style_list_to_use.length - 2

      const style_src = style_list_to_use[evt.source.index]
      const style_trgt = style_list_to_use[dest_to_use]
      drawing_area.moveOrderStyleInSelectedFlows(style_src, style_trgt)
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
                      {(provided, snapshot) => (
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
                                drawing_area.moveOrderStyleInSelectedFlows(style_src, style_trgt)
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
                                drawing_area.moveOrderStyleInSelectedFlows(style_src, style_trgt)
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
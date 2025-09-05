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

import React, { Fragment, useRef, useState, MutableRefObject } from 'react'

import {
  Box,
  Button,
  Checkbox,
  InputGroup,
  Select,
} from '@chakra-ui/react'

/*************************************************************************************************/

import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/ElementStyle'
import { default_style_id } from '../../types/Utils'

import { ConfigMenuNumberInput, ConfigMenuNumberOrUndefinedInput } from './SankeyMenuConfiguration'
import { WrapperBoxSubSectionMenu, ElementAttrSetterNumberInput2Cols, ValueKey } from './MenuCommon'
import { SankeyLinkSelectionSimple } from './SankeyMenuConfigurationLinks'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { MenuColorPicker } from './MenuColorPicker'

export type keyStyle = keyof Class_LinkStyle
export type valStyle = Class_LinkStyle[keyStyle]
export type keyLink = keyof Class_LinkElement
export type valLink = Class_LinkElement[keyLink]

export const MenuConfigurationLinkShape = ({ new_data, additionMenus, menu_for_style }: {
  new_data: Class_ApplicationData
  menu_for_style: boolean
  additionMenus: MutableRefObject<Type_AdditionalMenus>,
}) => {

  // Datas ------------------------------------------------------------------------------

  // Get traduction function
  const { t, icon_library, drawing_area } = new_data
  const { sankey } = drawing_area

  const { icon_redo, icon_orientation_hh, icon_orientation_hv, icon_orientation_vh, icon_orientation_vv } = icon_library
  // Get data
  const { ref_selected_style_link } = new_data.menu_configuration

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
  let elements: Class_LinkStyle[] | Class_LinkElement[]

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
   * @param {Class_LinkElement} curr
   * @return {*}
   */
  const check_indeterminate = (curr: Class_LinkElement) => {
    return (selected_links[0].isEqual(curr))
  }
  const is_indeterminate = !selected_links.every(check_indeterminate)

  const element_ref = elements[0]
  const shape_orientation = (element_ref?.shape_orientation ?? LINKS_ATTRIBUTES_CONFIG.shape_orientation.default)
  const shape_starting_curve = (element_ref?.shape_starting_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_starting_curve.default)
  const shape_ending_curve = (element_ref?.shape_ending_curve ?? LINKS_ATTRIBUTES_CONFIG.shape_ending_curve.default)
  const shape_starting_tangeant = (element_ref?.shape_starting_tangeant ?? LINKS_ATTRIBUTES_CONFIG.shape_starting_tangeant.default)
  const shape_ending_tangeant = (element_ref?.shape_ending_tangeant ?? LINKS_ATTRIBUTES_CONFIG.shape_ending_tangeant.default)
  const shape_is_curved = (element_ref?.shape_is_curved ?? LINKS_ATTRIBUTES_CONFIG.shape_is_curved.default)
  const shape_shape = (element_ref?.shape_shape ?? LINKS_ATTRIBUTES_CONFIG.shape_shape.default)
  const shape_is_recycling = (element_ref?.shape_is_recycling ?? LINKS_ATTRIBUTES_CONFIG.shape_is_recycling.default)
  const shape_arrow_size = (element_ref?.shape_arrow_size ?? LINKS_ATTRIBUTES_CONFIG.shape_arrow_size.default)
  const shape_is_arrow = (element_ref?.shape_is_arrow ?? LINKS_ATTRIBUTES_CONFIG.shape_is_arrow.default)
  const shape_color = (element_ref?.shape_color ?? LINKS_ATTRIBUTES_CONFIG.shape_color.default)
  const shape_color_rule = (element_ref?.shape_color_rule ?? LINKS_ATTRIBUTES_CONFIG.shape_color_rule.default)
  const shape_opacity = (element_ref?.shape_opacity ?? LINKS_ATTRIBUTES_CONFIG.shape_opacity.default)
  const shape_is_structure = (element_ref?.shape_is_structure ?? LINKS_ATTRIBUTES_CONFIG.shape_is_structure.default)
  const shape_local_scale = (element_ref?.shape_local_link_scale ?? LINKS_ATTRIBUTES_CONFIG.shape_local_link_scale.default)


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

  const is_arrow_size_indeterminated = !elements.every(el => el.shape_arrow_size == element_ref.shape_arrow_size)
  const is_opacity_indeterminated = !elements.every(el => el.shape_opacity == element_ref.shape_opacity)

  // JSX menu components ---------------------------------------------------------------

  const content_shape_color = <WrapperBoxSubSectionMenu new_data={new_data} title={t('Flux.apparence.fond')}>
    <>
      {/* Choix de la source de la couleur */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_color_rule')}
          <TooltipElementOverloaded elements={selected_links} t={t}
            k={'shape_color_rule'}
          />
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
          <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_color'} />
        </Box><Box>
          <MenuColorPicker
            isDisabled={shape_color_rule !== 'flow' || !disable_attr_props['shape_color']}
            initialColor={shape_color}
            onColorChange={(new_color) => {
              updateElements('shape_color', new_color)
            }}
            disabledTooltip={t('Flux.apparence.tooltips.color_source.disabled')}
          />
        </Box>
      </Box>

      {/* Opacité */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_opacity')}
          <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_opacity'} />
        </Box>
        <InputGroup variant='menuconfigpanel_option_input' >
          <OSTooltip label={t('Flux.apparence.tooltips.shape_opacity')}>
            <ConfigMenuNumberInput
              disabled={!disable_attr_props['shape_opacity']}
              t={new_data.t}
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
        <OSTooltip label={t('Flux.apparence.tooltips.shape_is_recycling')}>
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
      {/* Choix de la forme du flux */}
      <Box as='span' layerStyle='menuconfigpanel_row_3colsbis' >
        <Checkbox
          isDisabled={!disable_attr_props['shape_is_curved']}
          variant='menuconfigpanel_option_checkbox'
          isIndeterminate={is_indeterminate}
          isChecked={shape_is_curved}
          onChange={(evt) => { updateElements('shape_is_curved', evt.target.checked) }}>
          <OSTooltip label={t('Flux.apparence.tooltips.courbe')}>
            {t('Flux.apparence.shape_is_curved')}
            <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_is_curved'} />
          </OSTooltip>
        </Checkbox>
        {shape_is_curved ? <><Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_shape')}
          <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_shape'} />
        </Box>
          <OSTooltip label={t('Flux.apparence.tooltips.shape_shape')}>
            <Select
              //isDisabled={!disable_attr_props['shape_shape']}
              value={shape_shape}
              onChange={(evt) => {
                updateElements('shape_shape', evt.target.value)
              }}
            >
              {new_data.menu_configuration.shape_shape.map(el => {
                return <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
              })}
            </Select>
          </OSTooltip></> : <></>}
      </Box>

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
              <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_arrow_size'} />
            </Box>
            <InputGroup variant='menuconfigpanel_option_input' >
              <OSTooltip label={t('Flux.apparence.tooltips.arrow_size')}>
                <ConfigMenuNumberInput
                  disabled={!disable_attr_props['shape_arrow_size']}
                  t={new_data.t}
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
          <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_is_structure'} />
        </OSTooltip>
      </Checkbox>

      {/* Value of link local scale to override scale from DA, can be undefined */}
      <Box layerStyle='menuconfigpanel_grid' >
        <OSTooltip label={t('Flux.apparence.tooltips.local_scale')}>
          <>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
              <Box layerStyle='menuconfigpanel_option_name' >
                {t('Flux.apparence.shape_local_link_scale')}
                <TooltipElementOverloaded elements={selected_links} t={t} k={'shape_local_link_scale'} />
              </Box>
              <ConfigMenuNumberOrUndefinedInput
                disabled={!disable_attr_props['shape_local_link_scale']}
                default_value={selected_links[0]?.shape_local_link_scale ?? undefined}
                function_on_blur={(_) => { updateElements('shape_local_link_scale', _ as number) }}
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
    <>{[
      ['shape_starting_curve', 0, (1 - shape_ending_curve)],
      ['shape_ending_curve', shape_starting_curve * 100, 100],
      ['shape_starting_tangeant', 0, 100],
      ['shape_ending_tangeant', 0, 100],
    ].map(p => {
      return <ElementAttrSetterNumberInput2Cols
        app_data={new_data}
        elements={selected_links}
        attributePath={'Flux.apparence'}
        attributeKey={p[0] as ValueKey}
        minimum_value={p[1] as number}
        maximum_value={p[3] as number}
        percent={true} />
    })}
    </>
  </WrapperBoxSubSectionMenu>

  return <Box layerStyle='menuconfigpanel_grid'>
    {menu_for_style ? <></> : <SankeyLinkSelectionSimple new_data={new_data} />}
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
        {content_shape_detail}
        {content_geometry_detail}
      </Box>}</> : <></>}
  </Box>
}


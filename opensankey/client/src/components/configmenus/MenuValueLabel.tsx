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
import {
  Box, Checkbox
} from '@chakra-ui/react';
import { t } from 'i18next';
import React, { FC } from 'react';
import { Class_LinkElement } from '../../Elements/Link';
import { Class_LinkStyle } from '../../Elements/LinkAttributes';
import { Class_NodeElement } from '../../Elements/Node';
import { Class_NodeStyle, NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributes';
import { default_style_id } from '../../types/Utils';
import { updateElements, ValueKey } from './MenuCommon';
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration';
import { isElementAttributeOverloaded, OSTooltip, TooltipValueSurcharge } from './BaseComponents';
import { ElementMenuComponentType } from '../SankeyMenuTypes';

/**
 * Component with inputs to set value for label_value attribute of node & flow
 *
 * @param {*} {
 *   new_data,
 *   elements,
 *   selectedElements,
 *   refreshParentComponent,
 *   prefix
 * }
 * @return {*}
 */

export const SankeyMenuValueLabelComponent: FC<ElementMenuComponentType> = ({
  new_data, elements, selectedElements, refreshParentComponent, prefix
}) => {
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration;
  const { node_styles_dict, link_styles_dict } = new_data.drawing_area.sankey;
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle);


  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle);
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement);

  const style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict;
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link;

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ? 
    style_to_use[correct_ref_style_to_use.current].customisable_attribute : 
    style_to_use[default_style_id].customisable_attribute;

  const check_indeterminate = (curr: Class_LinkElement | Class_NodeElement) => {
    const ref_element = selectedElements[0];
    if (curr instanceof Class_LinkElement && ref_element instanceof Class_LinkElement) {
      return (ref_element.isEqual(curr));
    } else if (curr instanceof Class_NodeElement && ref_element instanceof Class_NodeElement) {
      return (ref_element.isEqual(curr));
    } else {
      return false;
    }
  };
  const is_indeterminate = !selectedElements.every(check_indeterminate);
  // Declare var used to set default attribute value in inputs 
  let label_custom_digit = NODES_ATTRIBUTES_CONFIG.value_label_custom_digit.default;
  let label_nb_digit = NODES_ATTRIBUTES_CONFIG.value_label_nb_digit.default;
  let label_significant_digits = NODES_ATTRIBUTES_CONFIG.value_label_significant_digits.default;
  let label_nb_significant_digits = NODES_ATTRIBUTES_CONFIG.value_label_nb_significant_digits.default;
  let label_scientific_notation = NODES_ATTRIBUTES_CONFIG.value_label_scientific_notation.default;

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0];
    label_custom_digit = (Reflect.get(element_ref, prefix + 'label_custom_digit') ?? NODES_ATTRIBUTES_CONFIG.value_label_custom_digit.default);
    label_nb_digit = (Reflect.get(element_ref, prefix + 'label_nb_digit') ?? NODES_ATTRIBUTES_CONFIG.value_label_nb_digit.default);
    label_significant_digits = (Reflect.get(element_ref, prefix + 'label_significant_digits') ?? NODES_ATTRIBUTES_CONFIG.value_label_significant_digits.default);
    label_nb_significant_digits = (Reflect.get(element_ref, prefix + 'label_nb_significant_digits') ?? NODES_ATTRIBUTES_CONFIG.value_label_nb_significant_digits.default);
    label_scientific_notation = (Reflect.get(element_ref, prefix + 'label_scientific_notation') ?? NODES_ATTRIBUTES_CONFIG.value_label_scientific_notation.default);
  }

  const is_cstm_digit_indetermined = !elements.every(el => Reflect.get(el, prefix + 'label_nb_digit') == label_nb_digit);

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Input for specific attr on value label */}

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      {/* Choix d'affichage du nombre de chiffre après la virgule  */}
      <Checkbox
        isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_custom_digit')}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={label_custom_digit}
        onChange={(evt) => {
          updateElements(new_data, elements, prefix + 'label_custom_digit' as ValueKey, evt.target.checked, refreshParentComponent);
        }}>
        <OSTooltip label={t('Flux.labels.tooltips.value_label_custom_digit')}>
          {t('Flux.labels.value_label_custom_digit') + ' '}
        </OSTooltip>
        {(!menu_for_style) &&
          isElementAttributeOverloaded(selectedElements, 'value_label_custom_digit') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>}
      </Checkbox>
      {label_custom_digit ?
        /* Choose number of custom digit */
        <OSTooltip label={t('Flux.labels.tooltips.NbDigit')}>
          <ConfigMenuNumberInput
            disabled={!Reflect.get(disable_attr_props,prefix + 'label_nb_digit')}
            t={new_data.t}
            default_value={label_nb_digit}
            menu_for_style={menu_for_style}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              updateElements(new_data, elements, prefix + 'label_nb_digit' as ValueKey, value ?? undefined, refreshParentComponent);
            }}
            multiValue={is_cstm_digit_indetermined} />
        </OSTooltip>
        : <></>}
    </Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols_little_input'>
      {/* Choix d'affichage du nombre de chiffre significatifs  */}
      <Checkbox
        isDisabled={!disable_attr_props['value_label_significant_digits']}
        variant='menuconfigpanel_option_checkbox'
        isChecked={label_significant_digits}
        onChange={(evt) => {
          updateElements(new_data, elements, prefix + 'label_significant_digits' as ValueKey, evt.target.checked ?? undefined, refreshParentComponent);
        }}>
        <OSTooltip label={t('Flux.labels.tooltips.significantDigits')}>
          {t('Flux.labels.significantDigits') + ' '}
        </OSTooltip>
        {(!menu_for_style) &&
          isElementAttributeOverloaded(selectedElements, 'value_label_significant_digits') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>}
      </Checkbox>
      {label_significant_digits ?
        /* Choose number of custom digit */
        /* <Box layerStyle='menuconfigpanel_option_name'>
                {t('Flux.labels.NbDigit')}
              </Box> */
        <OSTooltip label={t('Flux.labels.tooltips.significantDigits')}>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['value_label_nb_significant_digits']}
            t={new_data.t}
            default_value={label_nb_significant_digits}
            menu_for_style={/*menu_for_style*/false}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              updateElements(new_data, elements, prefix + 'label_nb_significant_digits' as ValueKey, value ?? undefined, refreshParentComponent);
            }} />
        </OSTooltip>
        : <></>}
    </Box>
    <Checkbox
      isDisabled={!disable_attr_props['value_label_scientific_notation']}
      variant='menuconfigpanel_option_checkbox'
      isChecked={label_scientific_notation}
      onChange={(evt) => {
        updateElements(new_data, elements, prefix+ 'label_scientific_notation' as ValueKey, evt.target.checked ?? undefined, refreshParentComponent);
      }}>
      <OSTooltip label={t('Flux.labels.tooltips.scientificNotation')}>
        {t('Flux.labels.scientificNotation') + ' '}
      </OSTooltip>
      {(!menu_for_style) &&
        isElementAttributeOverloaded(selectedElements, 'value_label_scientific_notation') ?
        TooltipValueSurcharge('link_var_', t) :
        <></>}

    </Checkbox>

  </Box>;
};

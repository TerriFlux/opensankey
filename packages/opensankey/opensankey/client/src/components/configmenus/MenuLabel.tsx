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
  Box,
  Button, Select
} from '@chakra-ui/react';
import { t } from 'i18next';
import React, { FC, MutableRefObject, useRef } from 'react';
import { Class_LinkElement } from '../../Elements/Link';
import { Class_LinkStyle } from '../../Elements/LinkAttributes';
import { Class_NodeElement } from '../../Elements/Node';
import { Class_NodeStyle, NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributes';
import { default_style_id, TooltipValueSurcharge, font_families, OSTooltip } from '../../types/Utils';
import { FCType_SankeyMenuLabelComponent, possibleDecoratorName } from '../SankeyMenuTypes';
import { getValueWithDecoratorRetriever, isElementAttributeOverloaded, updateElements } from './MenuCommon';
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration';
import { svg_label_upper } from './SankeyMenuConfigurationNodesAttributes';


export const SankeyMenuLabelComponent: FC<FCType_SankeyMenuLabelComponent> = ({
  new_data, elements, selectedElements, refreshParentComponent, dict_decorator_name
}) => {
  const { MenuColorPicker } = new_data;
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration;
  const { node_styles_dict, link_styles_dict } = new_data.drawing_area.sankey;
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle);


  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle);
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement);

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict;
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link;

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ? correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute : correct_dict_style_to_use[default_style_id].customisable_attribute;

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
  let get_label_horiz = NODES_ATTRIBUTES_CONFIG.value_label_horiz.default;
  let get_label_vert = NODES_ATTRIBUTES_CONFIG.value_label_vert.default;
  let get_label_font_size = NODES_ATTRIBUTES_CONFIG.value_label_font_size.default;
  let get_label_color = NODES_ATTRIBUTES_CONFIG.value_label_color.default;
  let get_label_bold = NODES_ATTRIBUTES_CONFIG.value_label_bold.default;
  let get_label_italic = NODES_ATTRIBUTES_CONFIG.value_label_italic.default;
  let get_label_uppercase = NODES_ATTRIBUTES_CONFIG.value_label_uppercase.default;
  let get_label_font_family = NODES_ATTRIBUTES_CONFIG.value_label_font_family.default;

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0];
    // Since element_ref can be LinkAttributes | Class_LinkElement | Class_NodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    get_label_horiz = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_horiz']) ?? NODES_ATTRIBUTES_CONFIG.value_label_horiz.default;
    get_label_vert = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_vert']) ?? NODES_ATTRIBUTES_CONFIG.value_label_vert.default;
    //@ts-expect-error xxx
    get_label_font_size = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_size']) ?? NODES_ATTRIBUTES_CONFIG.value_label_font_size.default;
    //@ts-expect-error xxx
    get_label_color = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_color']) ?? NODES_ATTRIBUTES_CONFIG.value_label_color.default;
    //@ts-expect-error xxx
    get_label_font_family = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_family']) ?? NODES_ATTRIBUTES_CONFIG.value_label_font_family.default;
    //@ts-expect-error xxx
    get_label_bold = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_bold']) ?? NODES_ATTRIBUTES_CONFIG.value_label_bold.default;
    //@ts-expect-error xxx
    get_label_italic = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_italic']) ?? NODES_ATTRIBUTES_CONFIG.value_label_italic.default;
    //@ts-expect-error xxx
    get_label_uppercase = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_uppercase']) ?? NODES_ATTRIBUTES_CONFIG.value_label_uppercase.default;
  }


  /**
     * Local component that add a icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
     *
     * @param {*} {k}
     * @return {*}
     */
  const TooltipElementOverloaded: FC<{ k: possibleDecoratorName; }> = ({ k }) => {
    if (menu_for_style)
      return <></>;

    const isOverwritted = isElementAttributeOverloaded(selectedElements, k);
    return isOverwritted ? (
      <>{TooltipValueSurcharge('el_var_', t)}</>
    ) : <></>;
  };

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 1;
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = [];
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null));
  ref_set_number_inputs[0].current(String(get_label_font_size));
  const is_label_font_size_indetermined = !elements.every(el => getValueWithDecoratorRetriever(el, dict_decorator_name['label_font_size']) == getValueWithDecoratorRetriever(elements[0], dict_decorator_name['label_font_size']));

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {/* Police et taille du texte de label */}
      <Box layerStyle='options_2cols'>
        <Select
          isDisabled={!disable_attr_props[dict_decorator_name['label_font_family']]}
          variant='menuconfigpanel_option_select'
          value={get_label_font_family}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            updateElements(new_data, elements, dict_decorator_name, 'label_font_family', evt.target.value, refreshParentComponent);
          }}
        >
          {font_families
            .map((d) => {
              return <option
                style={{ fontFamily: d }}
                key={'ff-' + d}
                value={d}
              >
                {d}
              </option>;
            })}
        </Select>

        <ConfigMenuNumberInput
          disabled={!disable_attr_props[dict_decorator_name['label_font_size']]}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={get_label_font_size}
          menu_for_style={menu_for_style}
          minimum_value={11}
          stepper={true}
          unit_text='pixels'
          function_on_blur={(value) => {
            updateElements(new_data, elements, dict_decorator_name, 'label_font_size', value ?? undefined, refreshParentComponent);
          }}
          multiValue={is_label_font_size_indetermined} />
      </Box>

      {/* Text style et position horizontale et vertical */}
      <Box layerStyle='options_3cols'>
        <Box layerStyle='options_3cols'>
          {/* Gras */}
          <Button
            isDisabled={!disable_attr_props[dict_decorator_name['label_bold']]}
            variant={get_label_bold ?
              'menuconfigpanel_option_button_activated_left' :
              'menuconfigpanel_option_button_left'}
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, dict_decorator_name, 'label_bold', !get_label_bold, refreshParentComponent);
            }}
          >
            {new_data.icon_library.icon_text_bold}
          </Button>

          {/* en majuscule */}
          <Button
            isDisabled={!disable_attr_props[dict_decorator_name['label_uppercase']]}
            variant={get_label_uppercase ?
              'menuconfigpanel_option_button_activated_center' :
              'menuconfigpanel_option_button_center'}
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, dict_decorator_name, 'label_uppercase', !get_label_uppercase, refreshParentComponent);
            }}
          >
            {svg_label_upper}
          </Button>

          {/* En italique */}
          <Button
            isDisabled={!disable_attr_props[dict_decorator_name['label_italic']]}
            variant={get_label_italic ?
              'menuconfigpanel_option_button_activated_right' :
              'menuconfigpanel_option_button_right'}
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, dict_decorator_name, 'label_italic', !get_label_italic, refreshParentComponent);
            }}
          >
            {new_data.icon_library.icon_text_italic}
          </Button>
        </Box>

        {/* Positionnement lateral des label */}
        <Box layerStyle='options_3cols'>
          {/* Vers le début  */}
          <OSTooltip label={t('Flux.labels.tooltips.deb')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_horiz']]}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (get_label_horiz === 'left')) ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              onClick={() => {
                updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'left', refreshParentComponent);
              }}>
              {new_data.icon_library.icon_text_align_left}
            </Button>
          </OSTooltip>

          {/* Vers le milieu  */}
          <OSTooltip label={t('Flux.labels.tooltips.milieu_h')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_horiz']]}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (get_label_horiz === 'middle')) ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => {
                updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'middle', refreshParentComponent);
              }}>
              {new_data.icon_library.icon_text_align_center}
            </Button>
          </OSTooltip>

          {/* Vers la fin du flux  */}
          <OSTooltip label={t('Flux.labels.tooltips.fin')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_horiz']]}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (get_label_horiz === 'right')) ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              onClick={() => {
                updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'right', refreshParentComponent);
              }}>
              {new_data.icon_library.icon_text_align_right}
            </Button>
          </OSTooltip>
        </Box>

        {/* Positionnement vertical des label  */}
        <Box layerStyle='options_3cols'>
          {/* Positionnement au dessous  */}
          <OSTooltip label={t('Flux.labels.tooltips.dessous')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_vert']]}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(
                !is_indeterminate &&
                (get_label_vert === 'bottom')
              ) ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              onClick={() => {
                updateElements(new_data, elements, dict_decorator_name, 'label_vert', 'bottom', refreshParentComponent);
              }}
            >
              {new_data.icon_library.icon_text_vert_pos_bottom}
            </Button>
          </OSTooltip>

          {/* Positionnement au milieu  */}
          <OSTooltip label={t('Flux.labels.tooltips.milieu_v')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_vert']]}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(

                !is_indeterminate &&
                (get_label_vert === 'middle')
              ) ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => {
                updateElements(new_data, elements, dict_decorator_name, 'label_vert', 'middle', refreshParentComponent);
              }}
            >
              {new_data.icon_library.icon_text_vert_pos_center}
            </Button>
          </OSTooltip>

          {/* Positionnement au dessus  */}
          <OSTooltip label={t('Flux.labels.tooltips.dessus')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_vert']]}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(
                !is_indeterminate &&
                (get_label_vert === 'top')
              ) ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              onClick={() => {
                updateElements(new_data, elements, dict_decorator_name, 'label_vert', 'top', refreshParentComponent);
              }}>
              {new_data.icon_library.icon_text_vert_pos_top}
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Couleur des Labels  */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_color')}
          <TooltipElementOverloaded k={dict_decorator_name['label_color']} />
        </Box>
        <MenuColorPicker
          isDisabled={!disable_attr_props[dict_decorator_name['label_color']]}
          initialColor={get_label_color}
          functionOnBlur={(new_color) => {
            updateElements(new_data, elements, dict_decorator_name, 'label_color', new_color, refreshParentComponent);

          }} />
      </Box>
    </Box>

  </Box>;
};

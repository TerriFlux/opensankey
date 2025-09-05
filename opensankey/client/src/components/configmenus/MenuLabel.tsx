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
import React from 'react'
import {
  Box,
  Button, Select
} from '@chakra-ui/react'
import { t } from 'i18next'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/ElementStyle'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_NodeStyle } from '../../Elements/ElementStyle'
import { default_style_id, font_families } from '../../types/Utils'
import { updateElements, ValueKey } from './MenuCommon'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'
import { svg_label_upper } from './SankeyMenuConfigurationNodesShape'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributesConfig'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { MenuColorPicker } from './MenuColorPicker'


export const SankeyMenuLabelComponent = ({
  new_data, elements, refreshParentComponent, prefix
}:{
  new_data: Class_ApplicationData
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
  refreshParentComponent: () => void,
  prefix: 'name_' | 'value_'
}) => {
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration;
  const { node_styles_dict, link_styles_dict } = new_data.drawing_area.sankey;
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle);


  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle);
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement);

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict;
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link;

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ? 
    correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute : 
    correct_dict_style_to_use[default_style_id].customisable_attribute;

  const check_indeterminate = (curr: Class_LinkElement | Class_NodeElement) => {
    const ref_element = elements[0];
    if (curr instanceof Class_LinkElement && ref_element instanceof Class_LinkElement) {
      return (ref_element.isEqual(curr));
    } else if (curr instanceof Class_NodeElement && ref_element instanceof Class_NodeElement) {
      return (ref_element.isEqual(curr));
    } else {
      return false;
    }
  };
  const is_indeterminate = !(elements as (Class_NodeElement|Class_LinkElement)[]).every(check_indeterminate);
  // Declare var used to set default attribute value in inputs 
  let label_horiz = NODES_ATTRIBUTES_CONFIG.value_label_horiz.default;
  let label_vert = NODES_ATTRIBUTES_CONFIG.value_label_vert.default;
  let label_font_size = NODES_ATTRIBUTES_CONFIG.value_label_font_size.default;
  let label_color = NODES_ATTRIBUTES_CONFIG.value_label_color.default;
  let label_bold = NODES_ATTRIBUTES_CONFIG.value_label_bold.default;
  let label_italic = NODES_ATTRIBUTES_CONFIG.value_label_italic.default;
  let label_uppercase = NODES_ATTRIBUTES_CONFIG.value_label_uppercase.default;
  let label_font_family = NODES_ATTRIBUTES_CONFIG.value_label_font_family.default;

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0];
    // Since element_ref can be LinkAttributes | Class_LinkElement | Class_NodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in prefix
    label_horiz = Reflect.get(element_ref, prefix + 'label_horiz') ?? NODES_ATTRIBUTES_CONFIG.value_label_horiz.default;
    label_vert =  Reflect.get(element_ref, prefix + 'label_vert') ?? NODES_ATTRIBUTES_CONFIG.value_label_vert.default;
    label_font_size = Reflect.get(element_ref, prefix + 'label_font_size') ?? NODES_ATTRIBUTES_CONFIG.value_label_font_size.default;
    label_color = Reflect.get(element_ref, prefix + 'label_color') ?? NODES_ATTRIBUTES_CONFIG.value_label_color.default;
    label_font_family = Reflect.get(element_ref, prefix + 'label_font_family') ?? NODES_ATTRIBUTES_CONFIG.value_label_font_family.default;
    label_bold = Reflect.get(element_ref, prefix + 'label_bold') ?? NODES_ATTRIBUTES_CONFIG.value_label_bold.default;
    label_italic = Reflect.get(element_ref, prefix + 'label_italic') ?? NODES_ATTRIBUTES_CONFIG.value_label_italic.default;
    label_uppercase = Reflect.get(element_ref, prefix + 'label_uppercase') ?? NODES_ATTRIBUTES_CONFIG.value_label_uppercase.default;
  }

  const is_label_font_size_indetermined = !elements.every(el => Reflect.get(el, prefix + 'label_font_size') == Reflect.get(elements[0], prefix + 'label_font_size'));

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {/* Police et taille du texte de label */}
      <Box layerStyle='options_2cols'>
        <Select
          isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_font_family')}
          variant='menuconfigpanel_option_select'
          value={label_font_family}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            updateElements(new_data, elements, prefix + 'label_font_family' as ValueKey, evt.target.value, refreshParentComponent);
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
          disabled={!Reflect.get(disable_attr_props,prefix + 'label_font_size')}
          t={new_data.t}
          default_value={label_font_size}
          menu_for_style={menu_for_style}
          minimum_value={11}
          stepper={true}
          unit_text='pixels'
          function_on_blur={(value) => {
            updateElements(new_data, elements, prefix + 'label_font_size' as ValueKey, value ?? undefined, refreshParentComponent);
          }}
          multiValue={is_label_font_size_indetermined} />
      </Box>

      {/* Text style et position horizontale et vertical */}
      <Box layerStyle='options_3cols'>
        <Box layerStyle='options_3cols'>
          {/* Gras */}
          <Button
            isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_bold')}
            variant={label_bold ?
              'menuconfigpanel_option_button_activated_left' :
              'menuconfigpanel_option_button_left'}
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, prefix + 'label_bold' as ValueKey, !label_bold, refreshParentComponent);
            }}
          >
            {new_data.icon_library.icon_text_bold}
          </Button>

          {/* en majuscule */}
          <Button
            isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_uppercase')}
            variant={label_uppercase ?
              'menuconfigpanel_option_button_activated_center' :
              'menuconfigpanel_option_button_center'}
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, prefix + 'label_uppercase' as ValueKey, !label_uppercase, refreshParentComponent);
            }}
          >
            {svg_label_upper}
          </Button>

          {/* En italique */}
          <Button
            isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_italic')}
            variant={label_italic ?
              'menuconfigpanel_option_button_activated_right' :
              'menuconfigpanel_option_button_right'}
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, prefix + 'label_italic' as ValueKey, !label_italic, refreshParentComponent);
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
              isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_horiz')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (label_horiz === 'left')) ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              onClick={() => {
                updateElements(new_data, elements, prefix + 'label_horiz' as ValueKey, 'left', refreshParentComponent);
              }}>
              {new_data.icon_library.icon_text_align_left}
            </Button>
          </OSTooltip>

          {/* Vers le milieu  */}
          <OSTooltip label={t('Flux.labels.tooltips.milieu_h')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_horiz')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (label_horiz === 'middle')) ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => {
                updateElements(new_data, elements, prefix + 'label_horiz' as ValueKey, 'middle', refreshParentComponent);
              }}>
              {new_data.icon_library.icon_text_align_center}
            </Button>
          </OSTooltip>

          {/* Vers la fin du flux  */}
          <OSTooltip label={t('Flux.labels.tooltips.fin')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_horiz')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (label_horiz === 'right')) ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              onClick={() => {
                updateElements(new_data, elements, prefix + 'label_horiz' as ValueKey, 'right', refreshParentComponent);
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
              isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_vert')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(
                !is_indeterminate &&
                (label_vert === 'bottom')
              ) ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              onClick={() => {
                updateElements(new_data, elements, prefix + 'label_vert' as ValueKey, 'bottom', refreshParentComponent);
              }}
            >
              {new_data.icon_library.icon_text_vert_pos_bottom}
            </Button>
          </OSTooltip>

          {/* Positionnement au milieu  */}
          <OSTooltip label={t('Flux.labels.tooltips.milieu_v')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_vert')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(

                !is_indeterminate &&
                (label_vert === 'middle')
              ) ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => {
                updateElements(new_data, elements, prefix + 'label_vert' as ValueKey, 'middle', refreshParentComponent);
              }}
            >
              {new_data.icon_library.icon_text_vert_pos_center}
            </Button>
          </OSTooltip>

          {/* Positionnement au dessus  */}
          <OSTooltip label={t('Flux.labels.tooltips.dessus')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_vert')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(
                !is_indeterminate &&
                (label_vert === 'top')
              ) ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              onClick={() => {
                updateElements(new_data, elements, prefix + 'label_vert' as ValueKey, 'top', refreshParentComponent);
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
          {!menu_for_style ? <TooltipElementOverloaded
          elements={elements as (Class_NodeElement | Class_LinkElement)[]}
          k={prefix + 'label_color' as ValueKey} 
          t={t}
          />:<></>}
        </Box>
        <MenuColorPicker
          isDisabled={!Reflect.get(disable_attr_props,prefix + 'label_color')}
          initialColor={label_color}
          onColorChange={(new_color) => {
            updateElements(new_data, elements, prefix + 'label_color' as ValueKey, new_color, refreshParentComponent);

          }} />
      </Box>
    </Box>

  </Box>;
};

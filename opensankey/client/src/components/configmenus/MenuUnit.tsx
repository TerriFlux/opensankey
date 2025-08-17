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

import { Select } from '@chakra-ui/react';
import { t } from 'i18next';
import React, { FC } from 'react';
import { Class_LinkElement } from '../../Elements/Link';
import { Class_LinkStyle, LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributes';
import { UnitType, unit_constants } from '../../Elements/LinkValues';
import { Class_NodeElement } from '../../Elements/Node';
import { Class_NodeStyle, NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributes';
import { Class_DataTagGroup } from '../../types/TagGroup';
import { default_style_id, } from '../../types/Utils';
import { ConfigMenuTextInput, ConfigMenuNumberInput } from './SankeyMenuConfiguration';
import { Class_ApplicationData } from '../../types/ApplicationData';
import { MenuSectionCheckbox, OptionWithTooltip } from './BaseComponents';
import { ElementMenuComponentType } from '../SankeyMenuTypes';
import { updateElements, ValueKey } from './MenuCommon';


export const MenuUnit: FC<ElementMenuComponentType> = ({
  new_data, elements, selectedElements, refreshParentComponent, prefix
}) => {
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration;
  const { link_styles_dict, node_styles_dict } = new_data.drawing_area.sankey;

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle);

  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle);
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement);

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict;
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link;

  const is_link = elements.length > 0 && (elements[0] instanceof Class_LinkElement || elements[0] instanceof Class_LinkStyle);
  const link_ref = elements.length > 0 && is_link ? elements[0] as Class_LinkElement : null;

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ?
    correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute :
    correct_dict_style_to_use[default_style_id].customisable_attribute;
  // Declare var used to set default attribute value in inputs 
  let label_unit_visible = NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default;
  let label_unit = NODES_ATTRIBUTES_CONFIG.value_label_unit.default;
  let label_unit_factor = NODES_ATTRIBUTES_CONFIG.value_label_unit_factor.default;
  let label_unit_type = LINKS_ATTRIBUTES_CONFIG.value_label_unit_type.default as UnitType;
  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0];
    label_unit_visible = (Reflect.get(element_ref, prefix + 'label_unit_visible') ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default);
    label_unit = (Reflect.get(element_ref, prefix + 'label_unit') ?? NODES_ATTRIBUTES_CONFIG.value_label_unit.default);
    label_unit_type = (Reflect.get(element_ref, prefix + 'label_unit_type') ?? LINKS_ATTRIBUTES_CONFIG.value_label_unit_type.default) as UnitType;
    label_unit_factor = (Reflect.get(element_ref, prefix + 'label_unit_factor') ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_factor.default);
  }

  const is_unit_name_indetermined = label_unit != undefined && !elements.every(el => {
    const valEl = Reflect.get(el, prefix + 'label_unit');
    if (valEl == undefined) {
      return true;
    }
    return Reflect.get(el, prefix + 'label_unit') == label_unit;
  });

  const is_unit_factor_indetermined = label_unit_factor != undefined && !elements.every(el => {
    const valEl = Reflect.get(el, prefix + 'label_unit_factor');
    if (valEl == undefined) {
      return true;
    }
    return Reflect.get(el, prefix + 'label_unit_factor') == label_unit_factor;
  });

  const unit_taggs = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[];

  return <MenuSectionCheckbox
      elements={elements}
      attributeKey={'value_label_unit_visible'}
      t={t}
      isStyle={menu_for_style}
      onChange={(evt:React.ChangeEvent<HTMLInputElement>) => {
        updateElements(new_data, elements, prefix + 'label_unit_visible' as ValueKey, evt.target.checked, refreshParentComponent);
      }}
      isChecked={label_unit_visible}
      isDisabled={!disable_attr_props['value_label_unit_visible']} >
    {/* Modifie l'unité du label de flux */}
    {label_unit_visible ? <>
      {is_link ?
        <OptionWithTooltip
          attributeKey={'value_label_unit_type'}
          t={t}
          elements={elements}
        >
          <Select
            isDisabled={!disable_attr_props['value_label_unit_type']}
            value={label_unit_type}
            onChange={(evt) => {
              updateElements(new_data, elements, prefix + 'label_unit_type' as ValueKey, evt.target.value, refreshParentComponent);
            }}
          >
            {(unit_constants).map(el => {
              return <option key={'value_' + el} value={el}>{t('Flux.labels.' + el)}</option>;
            })}
          </Select>
        </OptionWithTooltip> : <></>}
      {label_unit_type == 'other_unit_tag' && unit_taggs[0] ?
        <OptionWithTooltip
          attributeKey={'value_label_unit_visible'}
          t={t}
          elements={elements}
        >
          <Select
            isDisabled={!disable_attr_props['value_label_unit']}
            value={label_unit}
            onChange={(evt) => {
              updateElements(new_data, elements, prefix + 'label_unit' as ValueKey, evt.target.value, refreshParentComponent);
            }}
          >
            {unit_taggs[0].tags_list.map(el => {
              return <option key={'value_' + el.id} value={el.id}>{el.name}</option>;
            })}
          </Select>
        </OptionWithTooltip>
        : <></>}
      {label_unit_type == 'unit_name' ? <>
        <OptionWithTooltip
          attributeKey={'value_label_unit'}
          t={t}
          elements={elements}
        >
          <ConfigMenuTextInput
            disabled={!disable_attr_props['value_label_unit']}
            default_value={label_unit}
            function_on_blur={(value) => {
              updateElements(new_data, elements, prefix + 'label_unit' as ValueKey, value ? value : undefined, refreshParentComponent);
            }}
            menu_for_style={menu_for_style}
            multiValue={is_unit_name_indetermined}
          />
        </OptionWithTooltip>
        {/* Change unit factor*/}
        <OptionWithTooltip
          attributeKey={'value_label_unit_factor'}
          t={t}
          elements={elements}
        >
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['value_label_unit_factor']}
            t={new_data.t}
            default_value={label_unit_factor}
            function_on_blur={(value) => {
              updateElements(new_data, elements, prefix + 'label_unit_factor' as ValueKey, (value ? value : undefined), refreshParentComponent)
            }}
            menu_for_style={menu_for_style}
            minimum_value={1}
            maximum_value={label_unit_factor}
            step={1}
            stepper={true}
            multiValue={is_unit_factor_indetermined} />
        </OptionWithTooltip></> : <></>}
    </> : <></>}
  </MenuSectionCheckbox>
}
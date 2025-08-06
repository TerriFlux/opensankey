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
  Box, Checkbox, Select
} from '@chakra-ui/react';
import { t } from 'i18next';
import React, { FC, useRef } from 'react';
import { Class_LinkElement } from '../../Elements/Link';
import { Class_LinkStyle, LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributes';
import { UnitType, unit_constants } from '../../Elements/LinkValues';
import { Class_NodeElement } from '../../Elements/Node';
import { Class_NodeStyle, NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributes';
import { Class_DataTagGroup } from '../../types/TagGroup';
import { default_style_id, TooltipValueSurcharge, CustomFaEyeCheckIcon, OSTooltip } from '../../types/Utils';
import { FCType_MenuUnit, possibleDecoratorName, UnitAttributeType } from '../SankeyMenuTypes';
import { elementsType, getValueWithDecoratorRetriever, isElementAttributeOverloaded, setValueWithDecoratorRetriever, valueElementsType } from './MenuCommon';
import { ConfigMenuTextInput, ConfigMenuNumberInput } from './SankeyMenuConfiguration';
import { Class_ApplicationData } from '../../types/ApplicationData';


export const MenuUnit: FC<FCType_MenuUnit> = ({
  new_data, elements, selectedElements, refreshParentComponent, dict_decorator_name
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
  let get_label_unit_visible = NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default;
  let get_label_unit = NODES_ATTRIBUTES_CONFIG.value_label_unit.default;
  let get_label_unit_factor = NODES_ATTRIBUTES_CONFIG.value_label_unit_factor.default;
  let get_label_unit_type = LINKS_ATTRIBUTES_CONFIG.value_label_unit_type.default as UnitType;
  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0];
    // Since element_ref can be LinkAttributes | Class_LinkElement | Class_NodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    //@ts-expect-error xxx
    get_label_unit_visible = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_visible']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default);
    //@ts-expect-error xxx
    get_label_unit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit.default);
    get_label_unit_type = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_type']) ?? LINKS_ATTRIBUTES_CONFIG.value_label_unit_type.default) as UnitType;
    //@ts-expect-error xxx
    get_label_unit_factor = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_factor']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_factor.default);
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

  const ref_label_unit = useRef((_: string | null | undefined) => null);
  const ref_label_unit_factor = useRef((_: string | null | undefined) => null);

  const is_unit_name_indetermined = get_label_unit != undefined && !elements.every(el => {
    const valEl = getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit']);
    if (valEl == undefined) {
      return true;
    }
    return getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit']) == get_label_unit;
  });

  const is_unit_factor_indetermined = get_label_unit_factor != undefined && !elements.every(el => {
    const valEl = getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit_factor']);
    if (valEl == undefined) {
      return true;
    }
    return getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit_factor']) == get_label_unit_factor;
  });

  const unit_taggs = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[];

  return <>
    <Box layerStyle='menu_sub_section'>
      <Box layerStyle='menu_sub_section_title'>
        {/* Ajout une unité au label de flux */}
        <Checkbox
          isDisabled={!disable_attr_props['value_label_unit_visible']}
          variant='menuconfigpanel_part_title_1_checkbox'
          icon={<CustomFaEyeCheckIcon />}
          isChecked={get_label_unit_visible}
          onChange={(evt) => {
            updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit_visible', evt.target.checked, refreshParentComponent);
          }}>
          <OSTooltip label={t('Flux.labels.tooltips.l_u_v')}>
            {t('Flux.labels.l_u_v') + ' '}
          </OSTooltip>
          <TooltipElementOverloaded k='value_label_unit_visible' />
        </Checkbox>
      </Box>
      {/* Modifie l'unité du label de flux */}
      {get_label_unit_visible ? <>
        {is_link ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.labels.unit_type')}
            <TooltipElementOverloaded k={'value_label_unit_type'} />
          </Box>
          <OSTooltip label={t('Flux.labels.tooltips.value_label_unit_type')}>
            <Select
              isDisabled={!disable_attr_props['value_label_unit_type']}
              value={get_label_unit_type}
              onChange={(evt) => {
                updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit_type', evt.target.value, refreshParentComponent);
              }}
            >
              {(unit_constants).map(el => {
                return <option key={'value_' + el} value={el}>{t('Flux.labels.' + el)}</option>;
              })}
            </Select>
          </OSTooltip>
        </Box> : <></>}
        {get_label_unit_type == 'other_unit_tag' && unit_taggs[0] ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.labels.other_unit_tag')}
            <TooltipElementOverloaded k={'value_label_unit'} />
          </Box>
          <OSTooltip label={t('Flux.labels.tooltips.other_unit_tag')}>
            <Select
              isDisabled={!disable_attr_props['value_label_unit']}
              value={get_label_unit}
              onChange={(evt) => {
                updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit', evt.target.value, refreshParentComponent);
              }}
            >
              {unit_taggs[0].tags_list.map(el => {
                return <option key={'value_' + el.id} value={el.id}>{el.name}</option>;
              })}
            </Select>
          </OSTooltip>
        </Box>
          : <></>}
        {get_label_unit_type == 'unit_name' ? <>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.labels.l_u')}
              <TooltipElementOverloaded k='value_label_unit' />
            </Box>
            <OSTooltip label={t('Flux.labels.tooltips.l_u')}>
              <ConfigMenuTextInput

                disabled={!disable_attr_props['value_label_unit']}
                ref_to_set_value={ref_label_unit}
                function_get_value={() => get_label_unit}
                function_on_blur={(value) => {
                  updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit', value ? value : undefined, refreshParentComponent);
                }}
                menu_for_style={menu_for_style}
                multiValue={is_unit_name_indetermined} />
            </OSTooltip>
          </Box>
          {/* Change unit factor*/}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.labels.unit_factor')}
              <TooltipElementOverloaded k='value_label_unit_factor' />
            </Box>
            <OSTooltip label={t('Flux.labels.tooltips.unit_factor')}>
              <ConfigMenuNumberInput
                disabled={!disable_attr_props['value_label_unit_factor']}
                t={new_data.t}
                ref_to_set_value={ref_label_unit_factor}
                default_value={get_label_unit_factor}
                function_on_blur={(value) => {
                  updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit_factor', (value ? value : undefined), refreshParentComponent)
                }}
                menu_for_style={menu_for_style}
                minimum_value={1}
                maximum_value={get_label_unit_factor}
                step={1}
                stepper={true}
                multiValue={is_unit_factor_indetermined} />
            </OSTooltip>
          </Box></> : <></>}
      </> :
        <></>}
    </Box>  </>
}


/**
 * Upate attribute value via it's decorator & save it's possible undoing in data history
 *
 * @param {Class_ApplicationData} data
 * @param {elementsType[]} elements
 * @param {(labelValueAttribute | labelAttributeType)} _dict_decorator_name
 * @param {keyof labelValueAttribute} k
 * @param {valueElementsType} val
 * @param {() => void} refreshParentComponent
 */
export const updateElementsUnit = (data: Class_ApplicationData,
  elements: elementsType[],
  _dict_decorator_name: UnitAttributeType, // declare var can be both type so we can use the function in SankeyMenuLabelComponent & SankeyMenuValueLabelComponent 
  k: keyof UnitAttributeType, // key of labelValueAttribute also contain key of labelAttributeType (since labelValueAttribute is a composite type with labelAttributeType)
  val: valueElementsType,
  refreshParentComponent: () => void
) => {
  const dict_decorator_name = _dict_decorator_name
  // Create a dict of old val for each elements 
  const dict_old_val: { [x: string]: valueElementsType}  = {}
  elements.forEach(element => dict_old_val[element.id] = getValueWithDecoratorRetriever(element, dict_decorator_name[k]))

  // Original function
  const _updateElements = () => {
    elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name[k], val))
    refreshParentComponent()
  }

  // Undo function
  const inv_updateElements = () => {
    elements.forEach(element => setValueWithDecoratorRetriever(element, dict_decorator_name[k], dict_old_val[element.id]))
    refreshParentComponent()
  }

  data.history.saveUndo(inv_updateElements) //save undo
  data.history.saveRedo(_updateElements) //save original func for a redo

  _updateElements() // execute function
}


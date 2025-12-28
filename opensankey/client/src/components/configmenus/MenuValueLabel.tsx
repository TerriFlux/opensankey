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

import React, { useState } from 'react'
import { Box, Checkbox } from '@chakra-ui/react'
import { t } from 'i18next'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle, Class_NodeStyle } from '../../Elements/Element'
import { unit_constants } from '../../Elements/LinkValues'
import {
  ConditionalCheckboxWithInput,
  ElementAttrSetterNumberInput2Cols, ElementAttrSetterSelect2Cols,
  ElementAttrSetterTextInput2Cols,
  OSTooltip,
  SimpleElementCheckbox,
  TooltipElementOverloaded,
  updateElements,
  ValueKey
} from './MenuCommon'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { getLabelValueAttributeKey, getLabelValues, isLabelValueIndeterminate, ValueLabelConfigReturn } from '../../Elements/ElementsAttributesConfig'


export const MenuUnit = ({
  app_data,
  config,
  attributePath: initialAttributePath,
  elements: initialElements,
  disable_attr_props: initialDisableAttrProps,
}: {
  app_data: Class_ApplicationData,
  config: ValueLabelConfigReturn
  attributePath?: string
  elements?: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeBase[] | Class_NodeStyle[],
  disable_attr_props?: Record<string, boolean>
}) => {
  const { drawing_area } = app_data
  const { sankey } = drawing_area
  const [count, setCount] = useState(0)
  const refreshUI = () => setCount(a => a + 1)
  const [state, setState] = useState({
    elements: initialElements,
    attributePath: initialAttributePath,
    disable_attr_props: initialDisableAttrProps
  })
  if (!initialElements) {
    app_data.menu_configuration.r_value_formatting_set_elements.current = (
      _elements: Class_NodeBase[] | Class_NodeStyle[] | Class_LinkElement[] | Class_LinkStyle[],
      _attributePath: string,
      _disable_attr_props: Record<string, boolean>) => {
      setState({
        elements: _elements,
        attributePath: _attributePath,
        disable_attr_props: _disable_attr_props
      })
    }
  }
  const { elements, attributePath, disable_attr_props } = state
  if (!elements || elements.length === 0 || !attributePath || !disable_attr_props) {
    return <></>
  }
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]
  const unit_tagg = sankey.data_taggs_list.find(tagg => tagg.is_unit)
  //const is_link = elements.length > 0 && (elements[0] instanceof Class_LinkElement || elements[0] instanceof Class_LinkStyle)
  const attr_visible = getLabelValueAttributeKey('unit_visible')
  const is_indeterminate_visible = isLabelValueIndeterminate(elements, 'unit_visible')

  let unit_visible = config.unit_visible.default
  let unit_type = config.unit_type.default

  // Construction des clés d'attributs avec le préfixe
  const customDigitKey = `value_label_custom_digit` as ValueKey
  const nbDigitKey = `value_label_nb_digit` as ValueKey
  const significantDigitsKey = `value_label_significant_digits` as ValueKey
  const nbSignificantDigitsKey = `value_label_nb_significant_digits` as ValueKey
  const scientificNotationKey = `value_label_scientific_notation` as ValueKey

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const labelValues = elements.length > 0
      ? getLabelValues(elements[0], 'value_', config)
      : Object.fromEntries(
        Object.entries(config).map(([key, value]) => [key, value.default])
      ) as { [K in keyof typeof config]: ReturnType<typeof config[K]['type']> }
    unit_visible = labelValues.unit_visible
    unit_type = labelValues.unit_type
  }

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      iconColor={is_indeterminate_visible ? '#78C2AD' : 'white'}
      isDisabled={!disable_attr_props[attr_visible]}
      isIndeterminate={is_indeterminate_visible}
      isChecked={unit_visible}
      onChange={(evt) => {
        updateElements(app_data, elements!, attr_visible as ValueKey, evt.target.checked, refreshUI!)
      }}
    >
      <OSTooltip label={t(`${attributePath}.tooltips.${attr_visible}`) || 'Afficher le fond'}>
        {t(`${attributePath}.${attr_visible}`) || 'Fond visible'}
        <TooltipElementOverloaded elements={base_elements} t={t} k={attr_visible} />
      </OSTooltip>
    </Checkbox>
    {/* Select pour unit type (seulement pour les liens) */}
    {
      <ElementAttrSetterSelect2Cols
        app_data={app_data}
        attributePath={attributePath}
        attributeKey={'value_label_unit_type'}
        elements={elements}
        options={unit_constants.map(el => ({
          key: 'value_' + el,
          value: el,
          label: t('Flux.labels.' + el)
        }))}
        refreshParentComponent={refreshUI}
      />
    }
    {/* Select pour unit tag (quand type = other_unit_tag) */}
    {unit_type == 'other_unit_tag' && unit_tagg && (
      <ElementAttrSetterSelect2Cols
        app_data={app_data}
        elements={elements}
        attributePath={attributePath}
        attributeKey={'value_label_unit'}
        options={unit_tagg.tags_list.map(el => ({
          key: 'value_' + el.id,
          value: el.id,
          label: el.name
        }))}
        refreshParentComponent={refreshUI}
      />
    )}
    {/* Text input et number input pour unit_name */}
    {unit_type == 'unit_name' && (
      <>
        <ElementAttrSetterTextInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'value_label_unit'}
          refreshParentComponent={refreshUI}
        />
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'value_label_unit_factor'}
          refreshParentComponent={refreshUI}
          stepper={false}
        />
      </>
    )}
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Checkbox pour nombre de chiffres personnalisé avec input conditionnel */}
      <ConditionalCheckboxWithInput
        app_data={app_data}
        elements={elements}
        checkboxAttributeKey={customDigitKey}
        inputAttributeKey={nbDigitKey}
        refreshParentComponent={refreshUI}
        minimum_value={0}
        stepper={true}
      />

      {/* Checkbox pour chiffres significatifs avec input conditionnel */}
      <ConditionalCheckboxWithInput
        app_data={app_data}
        elements={elements}
        checkboxAttributeKey={significantDigitsKey}
        inputAttributeKey={nbSignificantDigitsKey}
        refreshParentComponent={refreshUI}
        minimum_value={0}
        stepper={true}
      />

      {/* Checkbox simple pour notation scientifique */}
      <SimpleElementCheckbox
        app_data={app_data}
        elements={elements}
        attributeKey={scientificNotationKey}
        refreshParentComponent={refreshUI}
      />
    </Box>
  </Box>
}
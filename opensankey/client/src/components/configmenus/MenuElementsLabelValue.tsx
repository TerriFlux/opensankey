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
import { Class_ElementStyle } from '../../Elements/Element'
import { unit_constants } from '../../Elements/LinkValues'
import {
  ConditionalCheckboxWithInput,
  ElementAttrSetterNumberInput2Cols, ElementAttrSetterSelect2Cols,
  ElementAttrSetterTextInput2Cols,
  OSTooltip,
  SimpleElementCheckbox,
  TooltipElementOverloaded
} from './MenuCommon'
import { getElementsValueLabelValues } from '../../Elements/ElementsAttributesConfig'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { isValueLabelIndeterminate, VALUE_LABEL_CONFIG } from '../../Elements/ElementsAttributesConfig'


export const MenuUnit = ({
  app_data,
  attributePath: initialAttributePath,
  elements: initialElements
}: {
  app_data: Class_ApplicationData,
  attributePath?: string
  elements?: Class_ElementStyle[] | Class_LinkElement[] | Class_NodeBase[]
}) => {
  const { drawing_area } = app_data
  const { sankey } = drawing_area
  const [_, setCount] = useState(0)
  const refreshUI = () => setCount(a => a + 1)
  const [state, setState] = useState({
    elements: initialElements,
    attributePath: initialAttributePath
  })
  if (!initialElements) {
    app_data.menu_configuration.r_value_formatting_set_elements.current = (
      _elements: Class_NodeBase[] | Class_LinkElement[] | Class_ElementStyle[],
      _attributePath: string) => {
      setState({
        elements: _elements,
        attributePath: _attributePath
      })
    }
  }
  const { elements, attributePath } = state
  if (!elements || !attributePath) return <></>
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]
  const unit_tagg = sankey.data_taggs_list.find(tagg => tagg.is_unit)

  const labelValues = elements.length > 0
    ? getElementsValueLabelValues(elements, 'value_label', refreshUI)
    : Object.fromEntries(
      Object.entries(VALUE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof VALUE_LABEL_CONFIG]: ReturnType<typeof VALUE_LABEL_CONFIG[K]['type']> }

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      iconColor={isValueLabelIndeterminate(elements, 'unit_visible') ? '#78C2AD' : 'white'}
      isIndeterminate={isValueLabelIndeterminate(elements, 'unit_visible')}
      isChecked={labelValues.unit_visible}
      onChange={(evt) => {
        labelValues.unit_visible = evt.target.checked
      }}
    >
      <OSTooltip label={t(`${attributePath}.tooltips.${'value_label_unit_visible'}`) || 'Afficher le fond'}>
        {t(`${attributePath}.${'value_label_unit_visible'}`) || 'Fond visible'}
        <TooltipElementOverloaded
          elements={base_elements}
          t={t}
          attributeKey={'unit_visible'}
          config={VALUE_LABEL_CONFIG}
          prefix={'value_label'}
        />
      </OSTooltip>
    </Checkbox>
    {/* Select pour unit type (seulement pour les liens) */}
    {
      <ElementAttrSetterSelect2Cols
        app_data={app_data}
        attributePath={attributePath}
        attributeKey={'unit_type'}
        elements={elements}
        config={VALUE_LABEL_CONFIG}
        prefix='value_label'
        options={unit_constants.map(el => ({
          key: 'value_' + el,
          value: el,
          label: t('Flux.labels.' + el)
        }))}
        refreshParentComponent={refreshUI}
      />
    }
    {/* Select pour unit tag (quand type = other_unit_tag) */}
    {labelValues.unit_type == 'other_unit_tag' && unit_tagg && (
      <ElementAttrSetterSelect2Cols
        app_data={app_data}
        elements={elements}
        attributePath={attributePath}
        attributeKey={'unit'}
        config={VALUE_LABEL_CONFIG}
        prefix='value_label'
        options={unit_tagg.tags_list.map(el => ({
          key: 'value_' + el.id,
          value: el.id,
          label: el.name
        }))}
        refreshParentComponent={refreshUI}
      />
    )}
    {/* Text input et number input pour unit_name */}
    {labelValues.unit_type == 'unit_name' && (
      <>
        <ElementAttrSetterTextInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'unit'}
          config={VALUE_LABEL_CONFIG}
          prefix='value_label'
          refreshParentComponent={refreshUI}
        />
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'unit_factor'}
          config={VALUE_LABEL_CONFIG}
          prefix='value_label'
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
        checkboxAttributeKey={'custom_digit'}
        inputAttributeKey={'nb_digit'}
        config={VALUE_LABEL_CONFIG}
        prefix='value_label'
        refreshParentComponent={refreshUI}
        minimum_value={0}
        stepper={true}
      />

      {/* Checkbox pour chiffres significatifs avec input conditionnel */}
      <ConditionalCheckboxWithInput
        app_data={app_data}
        elements={elements}
        checkboxAttributeKey={'significant_digits'}
        inputAttributeKey={'nb_significant_digits'}
        config={VALUE_LABEL_CONFIG}
        prefix='value_label'
        refreshParentComponent={refreshUI}
        minimum_value={0}
        stepper={true}
      />

      {/* Checkbox simple pour notation scientifique */}
      <SimpleElementCheckbox
        elements={elements}
        attributeKey={'scientific_notation'}
        config={VALUE_LABEL_CONFIG}
        prefix='value_label'
        refreshParentComponent={refreshUI}
      />
    </Box>
  </Box>
}
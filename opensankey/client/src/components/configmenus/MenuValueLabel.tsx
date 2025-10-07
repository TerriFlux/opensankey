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
import {Box} from '@chakra-ui/react'
import { ConditionalCheckboxWithInput, SimpleElementCheckbox, ValueKey } from './MenuCommon'
import { Class_LinkStyle, Class_NodeStyle } from '../../Elements/ElementStyle'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ApplicationData } from '../../types/ApplicationData'

/**
 * Component with inputs to set value for label_value attribute of node & flow
 * Version refactorisée utilisant les composants communs
 */
export const SankeyMenuValueLabelComponent = ({
  new_data, elements, refreshParentComponent, prefix
}:{
  new_data: Class_ApplicationData
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
  refreshParentComponent: () => void,
  prefix: 'name_' | 'value_'
}) => {
  // Construction des clés d'attributs avec le préfixe
  const customDigitKey = `${prefix}label_custom_digit` as ValueKey
  const nbDigitKey = `${prefix}label_nb_digit` as ValueKey
  const significantDigitsKey = `${prefix}label_significant_digits` as ValueKey
  const nbSignificantDigitsKey = `${prefix}label_nb_significant_digits` as ValueKey
  const scientificNotationKey = `${prefix}label_scientific_notation` as ValueKey

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Checkbox pour nombre de chiffres personnalisé avec input conditionnel */}
      <ConditionalCheckboxWithInput
        app_data={new_data}
        elements={elements}
        checkboxAttributeKey={customDigitKey}
        inputAttributeKey={nbDigitKey}
        refreshParentComponent={refreshParentComponent}
        minimum_value={0}
        stepper={true}
      />

      {/* Checkbox pour chiffres significatifs avec input conditionnel */}
      <ConditionalCheckboxWithInput
        app_data={new_data}
        elements={elements}
        checkboxAttributeKey={significantDigitsKey}
        inputAttributeKey={nbSignificantDigitsKey}
        refreshParentComponent={refreshParentComponent}
        minimum_value={0}
        stepper={true}
      />

      {/* Checkbox simple pour notation scientifique */}
      <SimpleElementCheckbox
        app_data={new_data}
        elements={elements}
        attributeKey={scientificNotationKey}
        refreshParentComponent={refreshParentComponent}
      />
    </Box>
  )
}
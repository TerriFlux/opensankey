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
import { t } from 'i18next'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle, Class_NodeStyle } from '../../Elements/ElementStyle'
import { unit_constants } from '../../Elements/LinkValues'
import { 
  ElementAttrSetterNumberInput2Cols, ElementAttrSetterSelect2Cols, 
  ElementAttrSetterTextInput2Cols, MenuSectionCheckbox 
} from './MenuCommon'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'
import { NODES_ATTRIBUTES_CONFIG } from '../../Elements/NodeAttributesConfig'


export const MenuUnit = ({ new_data, elements, refreshParentComponent }: {
  new_data: Class_ApplicationData,
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeElement[] | Class_NodeStyle[],
  refreshParentComponent: () => void
}) => {
  const { drawing_area } = new_data
  const { sankey } = drawing_area

  const unit_tagg = sankey.data_taggs_list.find(tagg => tagg.is_unit)
  const is_link = elements.length > 0 && (elements[0] instanceof Class_LinkElement || elements[0] instanceof Class_LinkStyle)

  const element_ref = elements[0]
  const value_label_unit_visible = element_ref?.value_label_unit_visible ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default
  const value_label_unit_type = element_ref?.value_label_unit_type ?? LINKS_ATTRIBUTES_CONFIG.value_label_unit_type.default

  return (
    <MenuSectionCheckbox
      app_data={new_data}
      elements={elements}
      attributePath='Flux.labels'
      attributeKey={'value_label_unit_visible'}
      refreshParentComponent={refreshParentComponent}
    >
      {value_label_unit_visible && (
        <>
          {/* Select pour unit type (seulement pour les liens) */}
          {is_link && (
            <ElementAttrSetterSelect2Cols
              app_data={new_data}
              attributeKey={'value_label_unit_type'}
              elements={elements}
              options={unit_constants.map(el => ({
                key: 'value_' + el,
                value: el,
                label: t('Flux.labels.' + el)
              }))}
              refreshParentComponent={refreshParentComponent}
            />
          )}
          {/* Select pour unit tag (quand type = other_unit_tag) */}
          {value_label_unit_type == 'other_unit_tag' && unit_tagg && (
            <ElementAttrSetterSelect2Cols
              app_data={new_data}
              elements={elements}
              attributeKey={'value_label_unit'}
              options={unit_tagg.tags_list.map(el => ({
                key: 'value_' + el.id,
                value: el.id,
                label: el.name
              }))}
              refreshParentComponent={refreshParentComponent}
            />
          )}
          {/* Text input et number input pour unit_name */}
          {value_label_unit_type == 'unit_name' && (
            <>
              <ElementAttrSetterTextInput2Cols
                app_data={new_data}
                elements={elements}
                attributePath={'Flux.labels'}
                attributeKey={'value_label_unit'}
                refreshParentComponent={refreshParentComponent}
              />
              <ElementAttrSetterNumberInput2Cols
                app_data={new_data}
                elements={elements}
                attributePath={'Flux.labels'}
                attributeKey={'value_label_unit_factor'}
                refreshParentComponent={refreshParentComponent}
                stepper={false}
              />
            </>
          )}
        </>
      )}
    </MenuSectionCheckbox>
  )
}
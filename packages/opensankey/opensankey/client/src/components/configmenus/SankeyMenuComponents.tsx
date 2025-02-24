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
  Button,
  Checkbox,
  Input,
  Select,
} from '@chakra-ui/react'
import { t } from 'i18next'
import React, { FunctionComponent, MutableRefObject, useRef } from 'react'
import { FaAlignLeft, FaAlignCenter, FaAlignRight, FaBold, FaItalic } from 'react-icons/fa'
import { ClassTemplate_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/LinkAttributes'
import { CustomFaEyeCheckIcon, OSTooltip, TooltipValueSurcharge, font_families } from '../../types/Utils'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { svg_label_upper } from './SankeyMenuConfigurationNodesAttributes'
import { FCType_SankeyMenuLabelComponent, FCType_SankeyMenuValueLabelComponent, labelAttributeType, labelValueAttribute, possibleDecoratorName } from './types/SankeyMenuComponentsType'
import { Type_GenericApplicationData, Type_GenericLinkElement, Type_GenericNodeElement } from '../../types/Types'
import { ClassTemplate_NodeElement } from '../../Elements/Node'
import {
  Class_NodeStyle,
  default_node_value_label_bold,
  default_node_value_label_color,
  default_node_value_label_custom_digit,
  default_node_value_label_font_family,
  default_node_value_label_font_size,
  default_node_value_label_horiz,
  default_node_value_label_italic,
  default_node_value_label_nb_digit,
  default_node_value_label_unit,
  default_node_value_label_unit_factor,
  default_node_value_label_unit_visible,
  default_node_value_label_uppercase,
  default_node_value_label_vert,
} from '../../Elements/NodeAttributes'

const svg_label_top = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
const svg_label_bottom = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" /></svg>
const svg_label_center = <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z" /></svg>

/**
 * Check if element attribute is from local attr
 *
 * @param {(Type_GenericLinkElement[] | Type_GenericNodeElement[])} elements
 * @param {possibleDecoratorName} attr
 * @return {boolean} 
 */
function isElementAttributeOverloaded(
  elements: Type_GenericLinkElement[] | Type_GenericNodeElement[],
  attr: possibleDecoratorName) {
  let overloaded = false
  elements.forEach(el => overloaded = (overloaded || el.isAttributeOverloaded(attr)))
  return overloaded
}

/**
 * Generic function to call getter decorator of model
 *
 * @template TModel
 * @template TKey
 * @param {TModel} model
 * @param {TKey} key
 * @return {TModel[TKey]} 
 */
function getValueWithDecoratorRetriever<TModel, TKey extends keyof TModel>(
  model: TModel,
  key: TKey
) {
  return model[key]
}

type elementsType = Class_LinkStyle | Type_GenericLinkElement | Type_GenericNodeElement | Class_NodeStyle
type valueType = labelValueAttribute[valueKeu]
type valueKeu = keyof labelValueAttribute
type valueElementsType = elementsType[valueType]


/**
 * Generic function to call setter decorator of model
 *
 * @template TModel
 * @template TKey
 * @template Tvalue
 * @param {TModel} model
 * @param {TKey} key
 * @param {Tvalue} value
 */
function setValueWithDecoratorRetriever<TModel, TKey extends keyof TModel, Tvalue extends TModel[TKey]>(
  model: TModel,
  key: TKey,
  value: Tvalue
) {
  model[key] = value
}

/**
 * Upate attribute value via it's decorator & save it's possible undoing in data history
 *
 * @param {Type_GenericApplicationData} data
 * @param {elementsType[]} elements
 * @param {(labelValueAttribute | labelAttributeType)} _dict_decorator_name
 * @param {keyof labelValueAttribute} k
 * @param {valueElementsType} val
 * @param {() => void} refreshParentComponent
 */
const updateElements = (data: Type_GenericApplicationData,
  elements: elementsType[],
  _dict_decorator_name: labelValueAttribute | labelAttributeType, // declare var can be both type so we can use the function in SankeyMenuLabelComponent & SankeyMenuValueLabelComponent 
  k: keyof labelValueAttribute, // key of labelValueAttribute also contain key of labelAttributeType (since labelValueAttribute is a composite type with labelAttributeType)
  val: valueElementsType,
  refreshParentComponent: () => void
) => {
  const dict_decorator_name = _dict_decorator_name as labelValueAttribute
  // Create a dict of old val for each elements 
  const dict_old_val: { [x: string]: valueElementsType } = {}
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

  data.history.saveUndo(inv_updateElements)//save undo
  data.history.saveRedo(_updateElements)//save original func for a redo

  _updateElements() // execute function
}

export const SankeyMenuLabelComponent: FunctionComponent<FCType_SankeyMenuLabelComponent> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)

  const check_indeterminate = (curr: Type_GenericLinkElement | Type_GenericNodeElement) => {
    const ref_element = selectedElements[0]
    if (curr instanceof ClassTemplate_LinkElement && ref_element instanceof ClassTemplate_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof ClassTemplate_NodeElement && ref_element instanceof ClassTemplate_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !selectedElements.every(check_indeterminate)
  // Declare var used to set default attribute value in inputs 
  let get_label_horiz = default_node_value_label_horiz
  let get_label_vert = default_node_value_label_vert
  let get_label_font_size = default_node_value_label_font_size
  let get_label_color = default_node_value_label_color
  let get_label_bold = default_node_value_label_bold
  let get_label_italic = default_node_value_label_italic
  let get_label_uppercase = default_node_value_label_uppercase
  let get_label_font_family = default_node_value_label_font_family

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Type_GenericLinkElement | Type_GenericNodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    get_label_horiz = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_horiz']) ?? default_node_value_label_horiz)
    get_label_vert = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_vert']) ?? default_node_value_label_vert)
    get_label_font_size = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_size']) ?? default_node_value_label_font_size)
    get_label_color = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_color']) ?? default_node_value_label_color)
    get_label_font_family = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_family']) ?? default_node_value_label_font_family)
    get_label_bold = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_bold'])) ?? default_node_value_label_bold
    get_label_italic = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_italic'])) ?? default_node_value_label_italic
    get_label_uppercase = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_uppercase'])) ?? default_node_value_label_uppercase
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 3
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  ref_set_number_inputs[0].current(String(get_label_font_size))

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        {t('Menu.edition')}
      </Box>

      {/* Couleur des Labels  */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.couleur')}
          {
            (!menu_for_style) &&
              isElementAttributeOverloaded(selectedElements, 'value_label_color') ?
              <>{TooltipValueSurcharge('link_var_', t)}</> :
              <></>
          }
        </Box>
        <Input
          variant='menuconfigpanel_option_input_color'
          type='color'
          value={get_label_color}
          onChange={evt => {
            updateElements(new_data, elements, dict_decorator_name, 'label_color', evt.target.value, refreshParentComponent)
          }}
        />
      </Box>

      {/* Police des labels de flux  */}
      <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
        Police
      </Box>
      {/* Police et taille du texte de label */}
      <Box layerStyle='options_3cols' >
        <Box layerStyle='options_3cols' >
          {/* Gras */}
          <Button
            variant={
              get_label_bold ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'
            }
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, dict_decorator_name, 'label_bold', !get_label_bold, refreshParentComponent)
            }}
          >
            <FaBold />
          </Button>

          {/* en majuscule */}
          <Button
            variant={
              get_label_uppercase ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'
            }
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, dict_decorator_name, 'label_uppercase', !get_label_uppercase, refreshParentComponent)
            }}
          >
            {svg_label_upper}
          </Button>

          {/* En italique */}
          <Button
            variant={
              get_label_italic ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'
            }
            paddingStart='0'
            paddingEnd='0'
            minWidth='0'
            onClick={() => {
              updateElements(new_data, elements, dict_decorator_name, 'label_italic', !get_label_italic, refreshParentComponent)
            }}
          >
            <FaItalic />
          </Button>
        </Box>
        <Select
          variant='menuconfigpanel_option_select'
          value={get_label_font_family}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              updateElements(new_data, elements, dict_decorator_name, 'label_font_family', evt.target.value, refreshParentComponent)
            }}
        >
          {
            font_families
              .map((d) => {
                return <option
                  style={{ fontFamily: d }}
                  key={'ff-' + d}
                  value={d}
                >
                  {d}
                </option>
              })
          }
        </Select>

        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={get_label_font_size}
          menu_for_style={menu_for_style}
          minimum_value={11}
          stepper={true}
          unit_text='pixels'
          function_on_blur={(value) => {
            updateElements(new_data, elements, dict_decorator_name, 'label_font_size', value ?? undefined, refreshParentComponent)
          }}
        />
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
        Position
      </Box>

      {/* Positionnement lateral des label */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.label.pos')}
          {
            (!menu_for_style) &&
              isElementAttributeOverloaded(selectedElements, 'value_label_horiz') ?
              <>{TooltipValueSurcharge('link_var_', t)}</> :
              <></>
          }
        </Box>
        <Box
          layerStyle='options_2cols'
        >
          <Box layerStyle='options_3cols' >
            {/* Vers le début  */}
            <OSTooltip label={t('Flux.label.tooltips.deb')}>
              <Button
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                variant={
                  (!is_indeterminate && (get_label_horiz === 'left')) ?
                    'menuconfigpanel_option_button_activated_left' :
                    'menuconfigpanel_option_button_left'
                }
                onClick={
                  () => {
                    updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'left', refreshParentComponent)
                  }}>
                <FaAlignLeft />
              </Button>
            </OSTooltip>

            {/* Vers le milieu  */}
            <OSTooltip label={t('Flux.label.tooltips.milieu_h')}>
              <Button
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                variant={
                  (!is_indeterminate && (get_label_horiz === 'middle')) ?
                    'menuconfigpanel_option_button_activated_center' :
                    'menuconfigpanel_option_button_center'
                }
                onClick={
                  () => {
                    updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'middle', refreshParentComponent)
                  }}>
                <FaAlignCenter />
              </Button>
            </OSTooltip>

            {/* Vers la fin du flux  */}
            <OSTooltip label={t('Flux.label.tooltips.fin')}>
              <Button
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                variant={
                  (!is_indeterminate && (get_label_horiz === 'right')) ?
                    'menuconfigpanel_option_button_activated_right' :
                    'menuconfigpanel_option_button_right'}
                onClick={
                  () => {
                    updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'right', refreshParentComponent)
                  }}>
                <FaAlignRight />
              </Button>
            </OSTooltip>
          </Box>

          {/* Positionnement vertical des label  */}
          <Box layerStyle='options_3cols' >
            {/* Positionnement au dessous  */}
            <OSTooltip label={t('Flux.label.tooltips.dessous')}>
              <Button
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                variant={
                  (
                    !is_indeterminate &&
                    (get_label_vert === 'bottom')
                  ) ?
                    'menuconfigpanel_option_button_activated_left' :
                    'menuconfigpanel_option_button_left'}
                onClick={() => {
                  updateElements(new_data, elements, dict_decorator_name, 'label_vert', 'bottom', refreshParentComponent)
                }}
              >
                {svg_label_bottom}
              </Button>
            </OSTooltip>

            {/* Positionnement au milieu  */}
            <OSTooltip label={t('Flux.label.tooltips.milieu_v')}>
              <Button
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                variant={
                  (

                    !is_indeterminate &&
                    (get_label_vert === 'middle')
                  ) ?
                    'menuconfigpanel_option_button_activated_center' :
                    'menuconfigpanel_option_button_center'}
                onClick={() => {
                  updateElements(new_data, elements, dict_decorator_name, 'label_vert', 'middle', refreshParentComponent)
                }}
              >
                {svg_label_center}
              </Button>
            </OSTooltip>

            {/* Positionnement au dessus  */}
            <OSTooltip label={t('Flux.label.tooltips.dessus')}>
              <Button
                paddingStart='0'
                paddingEnd='0'
                minWidth='0'
                variant={
                  (
                    !is_indeterminate &&
                    (get_label_vert === 'top')
                  ) ?
                    'menuconfigpanel_option_button_activated_right' :
                    'menuconfigpanel_option_button_right'}
                onClick={
                  () => {
                    updateElements(new_data, elements, dict_decorator_name, 'label_vert', 'top', refreshParentComponent)
                  }}>
                {svg_label_top}
              </Button>
            </OSTooltip>
          </Box>
        </Box>
      </Box>


    </Box>

  </Box>
}

export const SankeyMenuValueLabelComponent: FunctionComponent<FCType_SankeyMenuValueLabelComponent> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)

  const check_indeterminate = (curr: Type_GenericLinkElement | Type_GenericNodeElement) => {
    const ref_element = selectedElements[0]
    if (curr instanceof ClassTemplate_LinkElement && ref_element instanceof ClassTemplate_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof ClassTemplate_NodeElement && ref_element instanceof ClassTemplate_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !selectedElements.every(check_indeterminate)
  // Declare var used to set default attribute value in inputs 
  let get_label_unit_visible = default_node_value_label_unit_visible
  let get_label_unit = default_node_value_label_unit
  let get_label_unit_factor = default_node_value_label_unit_factor
  let get_label_custom_digit = default_node_value_label_custom_digit
  let get_label_nb_digit = default_node_value_label_nb_digit

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Type_GenericLinkElement | Type_GenericNodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    get_label_unit_visible = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_visible']) ?? default_node_value_label_unit_visible)
    get_label_unit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit']) ?? default_node_value_label_unit)
    get_label_unit_factor = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_factor']) ?? default_node_value_label_unit_factor)
    get_label_custom_digit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_custom_digit']) ?? default_node_value_label_custom_digit)
    get_label_nb_digit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_nb_digit']) ?? default_node_value_label_nb_digit)
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 2
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  ref_set_number_inputs[0].current(String(get_label_nb_digit))
  ref_set_number_inputs[1].current(String(get_label_unit_factor))


  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      {/* Choix d'affichage du nombre de chiffre après la virgule  */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={get_label_custom_digit}
        onChange={(evt) => {
          updateElements(new_data, elements, dict_decorator_name, 'label_custom_digit', evt.target.checked, refreshParentComponent)
        }}>
        <OSTooltip label={t('Flux.label.tooltips.custom_digit')}>
          {t('Flux.label.custom_digit') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
            isElementAttributeOverloaded(selectedElements, 'value_label_custom_digit') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>
      {get_label_custom_digit ?
        /* Choose number of custom digit */
        <OSTooltip label={t('Flux.label.tooltips.NbDigit')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[0]}
            default_value={get_label_nb_digit}
            menu_for_style={menu_for_style}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              updateElements(new_data, elements, dict_decorator_name, 'label_nb_digit', value ?? undefined, refreshParentComponent)
            }}
          />
        </OSTooltip>
        : <></>
      }
    </Box>

    {/* Ajout une unité au label de flux */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      icon={<CustomFaEyeCheckIcon />}
      isChecked={get_label_unit_visible}
      onChange={(evt) => {
        updateElements(new_data, elements, dict_decorator_name, 'label_unit_visible', evt.target.checked, refreshParentComponent)
      }}>
      <OSTooltip label={t('Flux.label.tooltips.l_u_v')}>
        {t('Flux.label.l_u_v') + ' '}
      </OSTooltip>
      {
        (!menu_for_style) &&
          isElementAttributeOverloaded(selectedElements, 'value_label_unit_visible') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>
      }
    </Checkbox>

    {/* Modifie l'unité du label de flux */}
    {
      get_label_unit_visible ?
        <>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.label.l_u')}
              {
                (!menu_for_style) &&
                  isElementAttributeOverloaded(selectedElements, 'value_label_unit') ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Box>
            <OSTooltip label={t('Flux.label.tooltips.l_u')}>
              <ConfigMenuTextInput
              ref_to_set_value={ref_set_number_inputs[1]}
              function_get_value={()=>get_label_unit}
              function_on_blur={(value) => {
                updateElements(new_data, elements, dict_decorator_name, 'label_unit', value?value:undefined, refreshParentComponent)
              }}
              menu_for_style={menu_for_style}
              />
            </OSTooltip>
          </Box>
          {/* Change unit factor*/}
          <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.label.unit_factor')}
              {
                (
                  (!menu_for_style) &&
                  isElementAttributeOverloaded(selectedElements, 'value_label_unit_factor')
                ) ?
                  <>{TooltipValueSurcharge('link_var_', t)}</> :
                  <></>
              }
            </Box>
            <OSTooltip label={t('Flux.label.tooltips.unit_factor')}>
              <ConfigMenuNumberInput
                ref_to_set_value={ref_set_number_inputs[1]}
                default_value={get_label_unit_factor}
                function_on_blur={(value) => {
                  updateElements(new_data, elements, dict_decorator_name, 'label_unit_factor', (value ? value : undefined), refreshParentComponent)
                }}
                menu_for_style={menu_for_style}
                minimum_value={1}
                maximum_value={get_label_unit_factor}
                step={1}
                stepper={true}
              />
            </OSTooltip>
          </Box>
        </> :
        <></>
    }

    <SankeyMenuLabelComponent
      new_data={new_data}
      elements={elements}
      selectedElements={selectedElements}
      refreshParentComponent={refreshParentComponent}
      dict_decorator_name={dict_decorator_name} />
  </Box>
}
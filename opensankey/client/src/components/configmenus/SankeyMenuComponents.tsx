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
  Collapse,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Select,
  useDisclosure,
} from '@chakra-ui/react'
import { t, TFunction } from 'i18next'
import React, { FC, MutableRefObject, useRef, useState } from 'react'
import { Class_LinkElement } from '../../Elements/Link'
import { LINKS_ATTRIBUTES_CONFIG, Class_LinkStyle, unit_type, UnitType } from '../../Elements/LinkAttributes'
import { CustomFaEyeCheckIcon, OSTooltip, TooltipValueSurcharge, default_style_id, font_families } from '../../types/Utils'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { svg_label_upper } from './SankeyMenuConfigurationNodesAttributes'
import {
  Class_NodeAttribute,
  Class_NodeStyle,
  NODES_ATTRIBUTES_CONFIG
} from '../../Elements/NodeAttributes'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaSquare } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ApplicationData } from '../../types/ApplicationData'
import {
  FCType_MenuUnit, FCType_SankeyMenuLabelComponent, FCType_SankeyMenuValueLabelComponent,
  FCType_WrapperBoxSubSectionMenu, FCType_WrapperCheckBoxSubSectionMenu,
  labelAttributeType, labelValueAttribute, possibleDecoratorName, UnitAttributeType
} from '../SankeyMenuTypes'


/**
 * Check if element attribute is from local attr
 *
 * @param {(Class_LinkElement[] | Class_NodeElement[])} elements
 * @param {possibleDecoratorName} attr
 * @return {boolean} 
 */
function isElementAttributeOverloaded(
  elements: Class_LinkElement[] | Class_NodeElement[],
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

type elementsType = Class_LinkStyle | Class_LinkElement | Class_NodeElement | Class_NodeStyle
type valueType = labelValueAttribute[valueKeu]
type valueKeu = keyof labelValueAttribute
type valueElementsType = elementsType[valueType] | undefined


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
  value: Tvalue | undefined
) {
  model[key] = value as TModel[TKey]
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
const updateElements = (
  data: Class_ApplicationData,
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
const updateElementsUnit = (data: Class_ApplicationData,
  elements: elementsType[],
  _dict_decorator_name: UnitAttributeType, // declare var can be both type so we can use the function in SankeyMenuLabelComponent & SankeyMenuValueLabelComponent 
  k: keyof UnitAttributeType, // key of labelValueAttribute also contain key of labelAttributeType (since labelValueAttribute is a composite type with labelAttributeType)
  val: valueElementsType,
  refreshParentComponent: () => void
) => {
  const dict_decorator_name = _dict_decorator_name
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

export const SankeyMenuLabelComponent: FC<FCType_SankeyMenuLabelComponent> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {
  const { OSColorPicker } = new_data
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration
  const { node_styles_dict, link_styles_dict } = new_data.drawing_area.sankey
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)


  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle)
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement)

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ? correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute : correct_dict_style_to_use[default_style_id].customisable_attribute

  const check_indeterminate = (curr: Class_LinkElement | Class_NodeElement) => {
    const ref_element = selectedElements[0]
    if (curr instanceof Class_LinkElement && ref_element instanceof Class_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof Class_NodeElement && ref_element instanceof Class_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !selectedElements.every(check_indeterminate)
  // Declare var used to set default attribute value in inputs 
  let get_label_horiz = NODES_ATTRIBUTES_CONFIG.value_label_horiz.default
  let get_label_vert = NODES_ATTRIBUTES_CONFIG.value_label_vert.default
  let get_label_font_size = NODES_ATTRIBUTES_CONFIG.value_label_font_size.default
  let get_label_color = NODES_ATTRIBUTES_CONFIG.value_label_color.default
  let get_label_bold = NODES_ATTRIBUTES_CONFIG.value_label_bold.default
  let get_label_italic = NODES_ATTRIBUTES_CONFIG.value_label_italic.default
  let get_label_uppercase = NODES_ATTRIBUTES_CONFIG.value_label_uppercase.default
  let get_label_font_family = NODES_ATTRIBUTES_CONFIG.value_label_font_family.default

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Class_LinkElement | Class_NodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    get_label_horiz = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_horiz']) ?? NODES_ATTRIBUTES_CONFIG.value_label_horiz.default
    get_label_vert = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_vert']) ?? NODES_ATTRIBUTES_CONFIG.value_label_vert.default
    //@ts-expect-error xxx
    get_label_font_size = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_size']) ?? NODES_ATTRIBUTES_CONFIG.value_label_font_size.default
    //@ts-expect-error xxx
    get_label_color = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_color']) ?? NODES_ATTRIBUTES_CONFIG.value_label_color.default
    //@ts-expect-error xxx
    get_label_font_family = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_font_family']) ?? NODES_ATTRIBUTES_CONFIG.value_label_font_family.default
    //@ts-expect-error xxx
    get_label_bold = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_bold']) ?? NODES_ATTRIBUTES_CONFIG.value_label_bold.default
    //@ts-expect-error xxx
    get_label_italic = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_italic']) ?? NODES_ATTRIBUTES_CONFIG.value_label_italic.default
    //@ts-expect-error xxx
    get_label_uppercase = getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_uppercase']) ?? NODES_ATTRIBUTES_CONFIG.value_label_uppercase.default
  }


  /**
     * Local component that add a icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
     *
     * @param {*} {k}
     * @return {*} 
     */
  const TooltipElementOverloaded: FC<{ k: possibleDecoratorName }> = ({ k }) => {
    if (menu_for_style)
      return <></>

    const isOverwritted = isElementAttributeOverloaded(selectedElements, k)
    return isOverwritted ? (
      <>{TooltipValueSurcharge('el_var_', t)}</>
    ) : <></>
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 1
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  ref_set_number_inputs[0].current(String(get_label_font_size))
  const is_label_font_size_indetermined = !elements.every(el => getValueWithDecoratorRetriever(el, dict_decorator_name['label_font_size']) == getValueWithDecoratorRetriever(elements[0], dict_decorator_name['label_font_size']))

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      {/* Police et taille du texte de label */}
      <Box layerStyle='options_2cols' >
        <Select
          isDisabled={!disable_attr_props[dict_decorator_name['label_font_family']]}
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
          disabled={!disable_attr_props[dict_decorator_name['label_font_size']]}
          t={new_data.t}
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={get_label_font_size}
          menu_for_style={menu_for_style}
          minimum_value={11}
          stepper={true}
          unit_text='pixels'
          function_on_blur={(value) => {
            updateElements(new_data, elements, dict_decorator_name, 'label_font_size', value ?? undefined, refreshParentComponent)
          }}
          multiValue={is_label_font_size_indetermined}
        />
      </Box>

      {/* Text style et position horizontale et vertical */}
      <Box layerStyle='options_3cols' >
        <Box layerStyle='options_3cols' >
          {/* Gras */}
          <Button
            isDisabled={!disable_attr_props[dict_decorator_name['label_bold']]}
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
            {new_data.icon_library.icon_text_bold}
          </Button>

          {/* en majuscule */}
          <Button
            isDisabled={!disable_attr_props[dict_decorator_name['label_uppercase']]}
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
            isDisabled={!disable_attr_props[dict_decorator_name['label_italic']]}
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
            {new_data.icon_library.icon_text_italic}
          </Button>
        </Box>

        {/* Positionnement lateral des label */}
        <Box layerStyle='options_3cols' >
          {/* Vers le début  */}
          <OSTooltip label={t('Flux.labels.tooltips.deb')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_horiz']]}
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
              variant={
                (!is_indeterminate && (get_label_horiz === 'middle')) ?
                  'menuconfigpanel_option_button_activated_center' :
                  'menuconfigpanel_option_button_center'
              }
              onClick={
                () => {
                  updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'middle', refreshParentComponent)
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
              variant={
                (!is_indeterminate && (get_label_horiz === 'right')) ?
                  'menuconfigpanel_option_button_activated_right' :
                  'menuconfigpanel_option_button_right'}
              onClick={
                () => {
                  updateElements(new_data, elements, dict_decorator_name, 'label_horiz', 'right', refreshParentComponent)
                }}>
              {new_data.icon_library.icon_text_align_right}
            </Button>
          </OSTooltip>
        </Box>

        {/* Positionnement vertical des label  */}
        <Box layerStyle='options_3cols' >
          {/* Positionnement au dessous  */}
          <OSTooltip label={t('Flux.labels.tooltips.dessous')}>
            <Button
              isDisabled={!disable_attr_props[dict_decorator_name['label_vert']]}
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
              {new_data.icon_library.icon_text_vert_pos_top}
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Couleur des Labels  */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.apparence.shape_color')}
          <TooltipElementOverloaded k={dict_decorator_name['label_color']} />
        </Box>
        <OSColorPicker
          isDisabled={!disable_attr_props[dict_decorator_name['label_color']]}
          initialColor={get_label_color}
          functionOnBlur={(new_color) => {
            updateElements(new_data, elements, dict_decorator_name, 'label_color', new_color, refreshParentComponent)

          }}
        />
      </Box>
    </Box>

  </Box>
}


/**
 * Component with inputs to set value for label_value attribute of node & flow
 *
 * @param {*} {
 *   new_data,
 *   elements,
 *   selectedElements,
 *   refreshParentComponent,
 *   dict_decorator_name
 * }
 * @return {*} 
 */
export const SankeyMenuValueLabelComponent: FC<FCType_SankeyMenuValueLabelComponent> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration
  const { node_styles_dict, link_styles_dict } = new_data.drawing_area.sankey
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)


  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle)
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement)

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ? correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute : correct_dict_style_to_use[default_style_id].customisable_attribute

  const check_indeterminate = (curr: Class_LinkElement | Class_NodeElement) => {
    const ref_element = selectedElements[0]
    if (curr instanceof Class_LinkElement && ref_element instanceof Class_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof Class_NodeElement && ref_element instanceof Class_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !selectedElements.every(check_indeterminate)
  // Declare var used to set default attribute value in inputs 
  let get_label_custom_digit = NODES_ATTRIBUTES_CONFIG.value_label_custom_digit.default
  let get_label_nb_digit = NODES_ATTRIBUTES_CONFIG.value_label_nb_digit.default
  let get_label_significant_digits = NODES_ATTRIBUTES_CONFIG.value_label_significant_digits.default
  let get_label_nb_significant_digits = NODES_ATTRIBUTES_CONFIG.value_label_nb_significant_digits.default
  let get_label_scientific_notation = NODES_ATTRIBUTES_CONFIG.value_label_scientific_notation.default

  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Class_LinkElement | Class_NodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    //@ts-expect-error xxx
    get_label_custom_digit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_custom_digit']) ?? NODES_ATTRIBUTES_CONFIG.value_label_custom_digit.default)
    //@ts-expect-error xxx
    get_label_nb_digit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_nb_digit']) ?? NODES_ATTRIBUTES_CONFIG.value_label_nb_digit.default)
    //@ts-expect-error xxx
    get_label_significant_digits = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_significant_digits']) ?? NODES_ATTRIBUTES_CONFIG.value_labelvalue_label_significant_digits.default)
    //@ts-expect-error xxx
    get_label_nb_significant_digits = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_nb_significant_digits']) ?? NODES_ATTRIBUTES_CONFIG.value_label_nb_significant_digits.default)
    //@ts-expect-error xxx
    get_label_scientific_notation = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_scientific_notation']) ?? NODES_ATTRIBUTES_CONFIG.value_label_scientific_notation.default)
  }


  const ref_label_nb_digit = useRef((_: string | null | undefined) => null)
  ref_label_nb_digit.current(String(get_label_nb_digit))
  const ref_label_nb_significant_digit = useRef((_: string | null | undefined) => null)
  ref_label_nb_significant_digit.current(String(get_label_nb_significant_digits))

  const is_cstm_digit_indetermined = !elements.every(el => getValueWithDecoratorRetriever(el, dict_decorator_name['label_nb_digit']) == get_label_nb_digit)



  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    {/* Input for specific attr on value label */}

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      {/* Choix d'affichage du nombre de chiffre après la virgule  */}
      <Checkbox
        isDisabled={!disable_attr_props[dict_decorator_name['label_custom_digit']]}
        variant='menuconfigpanel_option_checkbox'
        isIndeterminate={is_indeterminate}
        isChecked={get_label_custom_digit}
        onChange={(evt) => {
          updateElements(new_data, elements, dict_decorator_name, 'label_custom_digit', evt.target.checked, refreshParentComponent)
        }}>
        <OSTooltip label={t('Flux.labels.tooltips.value_label_custom_digit')}>
          {t('Flux.labels.value_label_custom_digit') + ' '}
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
        <OSTooltip label={t('Flux.labels.tooltips.NbDigit')}>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props[dict_decorator_name['label_nb_digit']]}
            t={new_data.t}
            ref_to_set_value={ref_label_nb_digit}
            default_value={get_label_nb_digit}
            menu_for_style={menu_for_style}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              updateElements(new_data, elements, dict_decorator_name, 'label_nb_digit', value ?? undefined, refreshParentComponent)
            }}
            multiValue={is_cstm_digit_indetermined}
          />
        </OSTooltip>
        : <></>
      }
    </Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols_little_input' >
      {/* Choix d'affichage du nombre de chiffre significatifs  */}
      <Checkbox
        isDisabled={!disable_attr_props['value_label_significant_digits']}
        variant='menuconfigpanel_option_checkbox'
        isChecked={get_label_significant_digits}
        onChange={(evt) => {
          updateElements(new_data, elements, dict_decorator_name, 'label_significant_digits', evt.target.checked ?? undefined, refreshParentComponent)
        }}>
        <OSTooltip label={t('Flux.labels.tooltips.significantDigits')}>
          {t('Flux.labels.significantDigits') + ' '}
        </OSTooltip>
        {
          (!menu_for_style) &&
            isElementAttributeOverloaded(selectedElements, 'value_label_significant_digits') ?
            TooltipValueSurcharge('link_var_', t) :
            <></>
        }
      </Checkbox>
      {get_label_significant_digits ?
        /* Choose number of custom digit */

        /* <Box layerStyle='menuconfigpanel_option_name'>
                {t('Flux.labels.NbDigit')}
              </Box> */
        <OSTooltip label={t('Flux.labels.tooltips.significantDigits')}>
          <ConfigMenuNumberInput
            disabled={!disable_attr_props['value_label_nb_significant_digits']}
            t={new_data.t}
            ref_to_set_value={ref_label_nb_significant_digit}
            default_value={get_label_nb_significant_digits}
            menu_for_style={/*menu_for_style*/false}
            minimum_value={0}
            stepper={true}
            function_on_blur={(value) => {
              updateElements(new_data, elements, dict_decorator_name, 'label_nb_significant_digits', value ?? undefined, refreshParentComponent)
            }}
          />
        </OSTooltip>
        : <></>
      }
    </Box>
    <Checkbox
      isDisabled={!disable_attr_props['value_label_scientific_notation']}
      variant='menuconfigpanel_option_checkbox'
      isChecked={get_label_scientific_notation}
      onChange={(evt) => {
        updateElements(new_data, elements, dict_decorator_name, 'label_scientific_notation', evt.target.checked ?? undefined, refreshParentComponent)
      }}>
      <OSTooltip label={t('Flux.labels.tooltips.scientificNotation')}>
        {t('Flux.labels.scientificNotation') + ' '}
      </OSTooltip>
      {
        (!menu_for_style) &&
          isElementAttributeOverloaded(selectedElements, 'value_label_scientific_notation') ?
          TooltipValueSurcharge('link_var_', t) :
          <></>
      }

    </Checkbox>

  </Box>
}

/**
 * Wrapper to create a box collapsable to reduce size of sub-section in configuration sub-menus 
 *
 * @param {*} {
 *   new_data,
 *   title,
 *   children
 * }
 * @return {*} 
 */
export const WrapperBoxSubSectionMenu: FC<FCType_WrapperBoxSubSectionMenu> = ({
  new_data,
  title,
  collapse = true,
  children
}) => {
  // Hooks controlling collapse opening, initiallised at true
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: collapse })
  return <Box layerStyle='menu_sub_section'>
    <Box layerStyle='menu_sub_section_head'>
      <Button variant='menu_sub_section_collapse_button'
        size='sizeCollapseButton'
        onClick={onToggle}>
        {isOpen ? new_data.icon_library.icon_collapse_up : new_data.icon_library.icon_collapse_down}
      </Button>
      <Box as='span' layerStyle='menu_sub_section_title'
        textStyle='title_sub_section'
      >{title}</Box>
    </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        {children}
      </Box>
    </Collapse>
  </Box>
}

/**
 * Wrapper to create a box collapsable to reduce size of sub-section in configuration sub-menus 
 *
 * @param {*} {
 *   new_data,
 *   title,
 *   children
 * }
 * @return {*} 
 */
export const WrapperCheckBoxSubSectionMenu: FC<FCType_WrapperCheckBoxSubSectionMenu> = ({
  title,
  open = true,
  onClick,
  children
}) => {
  // Hooks controlling collapse opening, initiallised at true
  const { isOpen, onToggle } = useDisclosure({ isOpen: open })
  return <> <Box layerStyle='menu_sub_section_title'>
    <Checkbox
      variant='menuconfigpanel_part_title_1_checkbox'
      isChecked={isOpen}
      onChange={() => {
        onClick(!isOpen)
        onToggle()

      }}
    >
      {title}
    </Checkbox>
  </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box
        layerStyle='menuconfigpanel_grid'
        marginLeft='1rem'
        borderLeft='lightgray 1px solid'
        paddingLeft='0.2rem'
      >
        {children}
      </Box>
    </Collapse>
  </>
}

/**
 * Wrapper for content of each sub-menus  
 *
 * @param {*} { new_data, title, children, hide = false }
 * @return {*} 
 */
export const WrapperContentConfig: FC<{ title: string; hide?: boolean; children: JSX.Element }> = ({ title, children, hide = false }) => {
  // If var hide is at true then return 'nothing'
  if (hide)
    return <></>

  return <Box layerStyle='box_content_config'>
    <span className='title_box'>{title}</span>
    {children}
  </Box>
}

/**
 * Menu select to delete local attribute value of nodes/links
 *
 * @param {*} { new_data, nodesOrLinks, dict_overwritted_attr }
 * @return {*} 
 */
export const MenuResetAttrLocal: FC<{ new_data: Class_ApplicationData, nodesOrLinks: 'nodes' | 'links', dict_overwritted_attr: { [x: string]: { overloaded: boolean, name: string } } }> = (
  {
    new_data,
    nodesOrLinks,
    dict_overwritted_attr
  }) => {
  const { t, icon_library } = new_data
  const { icon_undo } = icon_library

  // Delete all local attributes of selected elements
  const resetAll = () => nodesOrLinks == 'nodes' ? new_data.drawing_area.sankey.resetAttrSelectedNodes() : new_data.drawing_area.sankey.resetAttrSelectedLinks()
  // Delete local attributes 'k' of selected elements
  const resetLocal = (k: string) => nodesOrLinks == 'nodes' ? new_data.drawing_area.deleteLocalAttrSelectedNode(k as keyof Class_NodeAttribute) : new_data.drawing_area.deleteLocalAttrSelectedLinks(k as (keyof typeof LINKS_ATTRIBUTES_CONFIG))

  return <Menu direction='rtl' placement='left' closeOnSelect={false}>
    <MenuButton as={Button} variant='menuconfigpanel_option_button'>
      {icon_undo}
      <ChevronDownIcon />
    </MenuButton>

    <MenuList>
      <MenuItem onClick={resetAll}>{t('Menu.reset_all_attr')} </MenuItem>
      <MenuDivider />
      {
        Object.entries(dict_overwritted_attr).filter(ent => ent[1].overloaded).map(ent => {
          return <MenuItem onClick={() => resetLocal(ent[0])}>{t('Menu.reset_attr')}{ent[1].name}</MenuItem>
        })
      }
    </MenuList>
  </Menu>
}

export const MenuUnit: FC<FCType_MenuUnit> = ({
  new_data,
  elements,
  selectedElements,
  refreshParentComponent,
  dict_decorator_name
}) => {
  const { ref_selected_style_node, ref_selected_style_link } = new_data.menu_configuration
  const { link_styles_dict, node_styles_dict } = new_data.drawing_area.sankey

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)

  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_NodeStyle)
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_NodeElement)

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link

  const is_link = elements.length > 0 && (elements[0] instanceof Class_LinkElement || elements[0] instanceof Class_LinkStyle)
  const link_ref = elements.length > 0 && is_link ? elements[0] as Class_LinkElement : null

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ?
    correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute :
    correct_dict_style_to_use[default_style_id].customisable_attribute
  // Declare var used to set default attribute value in inputs 
  let get_label_unit_visible = NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default
  let get_label_unit = NODES_ATTRIBUTES_CONFIG.value_label_unit.default
  let get_label_unit_factor = NODES_ATTRIBUTES_CONFIG.value_label_unit_factor.default
  let get_label_unit_type = NODES_ATTRIBUTES_CONFIG.value_label_unit_type.default
  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const element_ref = elements[0]
    // Since element_ref can be LinkAttributes | Class_LinkElement | Class_NodeElement | Class_NodeStyle
    // we use a function to use correct decorator 'getter' to get attribute of either name label or value label depending on what we used in dict_decorator_name
    //@ts-expect-error xxx
    get_label_unit_visible = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_visible']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_visible.default)
    //@ts-expect-error xxx
    get_label_unit = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit.default)
    //@ts-expect-error xxx
    get_label_unit_type = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_type']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_type.default)
    //@ts-expect-error xxx
    get_label_unit_factor = (getValueWithDecoratorRetriever(element_ref, dict_decorator_name['label_unit_factor']) ?? NODES_ATTRIBUTES_CONFIG.value_label_unit_factor.default)
  }

  /**
   * Local component that add a icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
   *
   * @param {*} {k}
   * @return {*} 
   */
  const TooltipElementOverloaded: FC<{ k: possibleDecoratorName }> = ({ k }) => {
    if (menu_for_style)
      return <></>

    const isOverwritted = isElementAttributeOverloaded(selectedElements, k)
    return isOverwritted ? (
      <>{TooltipValueSurcharge('el_var_', t)}</>
    ) : <></>
  }

  const ref_label_unit = useRef((_: string | null | undefined) => null)
  const ref_label_unit_factor = useRef((_: string | null | undefined) => null)

  const is_unit_name_indetermined = get_label_unit != undefined && !elements.every(el => {
    const valEl = getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit'])
    if (valEl == undefined) {
      return true
    }
    return getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit']) == get_label_unit
  })

  const is_unit_factor_indetermined = get_label_unit_factor != undefined && !elements.every(el => {
    const valEl = getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit_factor'])
    if (valEl == undefined) {
      return true
    }
    return getValueWithDecoratorRetriever(el, dict_decorator_name['label_unit_factor']) == get_label_unit_factor
  })


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
            updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit_visible', evt.target.checked, refreshParentComponent)
          }}>
          <OSTooltip label={t('Flux.labels.tooltips.l_u_v')}>
            {t('Flux.labels.l_u_v') + ' '}
          </OSTooltip>
          <TooltipElementOverloaded k='value_label_unit_visible' />
        </Checkbox>
      </Box>
      {/* Modifie l'unité du label de flux */}
      {
        get_label_unit_visible ? <>
          {is_link ? < Box as='span' layerStyle='menuconfigpanel_row_2cols' >
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Flux.labels.unit_type')}
              <TooltipElementOverloaded k={'value_label_unit_type'} />
            </Box>
            <OSTooltip label={t('Flux.labels.tooltips.value_label_unit_type')}>
              <Select
                isDisabled={!disable_attr_props['value_label_unit_type']}
                value={get_label_unit_type}
                onChange={(evt) => {
                  updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit_type', evt.target.value, refreshParentComponent)
                }}
              >
                {(unit_type).map(el => {
                  return <option key={'value_' + el} value={el}>{t('Flux.labels.' + el)}</option>
                })}
              </Select>
            </OSTooltip>
          </Box> : <></>}
          {get_label_unit_type == 'unit_name' ? <>
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
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
                    updateElementsUnit(new_data, elements, dict_decorator_name, 'label_unit', value ? value : undefined, refreshParentComponent)
                  }}
                  menu_for_style={menu_for_style}
                  multiValue={is_unit_name_indetermined}
                />
              </OSTooltip>
            </Box>
            {/* Change unit factor*/}
            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
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
                  multiValue={is_unit_factor_indetermined}
                />
              </OSTooltip>
            </Box></> : <></>}
        </> :
          <></>
      }
    </Box >  </>
}

export type typeElementSelectable = {
  label: string,
  value: string,
  selected: boolean,
  disabled?: boolean
}[]


/**
 * Component to select multple element from a list passed in parameter
 *
 * @param {*} {
 *   elements,
 *   selected_elements,
 *   onClick
 * }
 * @return {*} 
 */
export const OSMultiSelect: FC<{ t: TFunction, elements: typeElementSelectable, onClick: (entries: typeElementSelectable) => void }> = ({
  elements,
  onClick
}) => {
  const [menuListItems, setMenuListItems] = useState<JSX.Element[]>([])
  const [displayBgOverlay, setDisplayBgOverlay] = useState(false)

  const selected_elements = elements.filter(el => el.selected)
  const textBtn = selected_elements.length > 0 ? selected_elements.map(el => el.label).join(',') : 'Aucune sélection'
  const selecAll = elements.length > 0 ? <>
    <MenuItem
      icon={(selected_elements.length == elements.length) ? <FontAwesomeIcon icon={faSquareCheck} /> : <FaSquare />}
      onClick={() => {
        const new_sel = selected_elements.length == elements.length ? [] : elements //select or deselect all
        onClick(new_sel)
      }}>{t('Noeud.TS')}</MenuItem>
    <MenuDivider />
  </> : <></>

  // Create a function that render list so we can choose when to go throught list (that can be long with big sankey)
  const renderMenu = () => elements.map((el, i) => {

    return <MenuItem
      key={'elements_' + i}
      isDisabled={el.disabled}
      icon={el.selected ? <FontAwesomeIcon icon={faSquareCheck} /> : <FaSquare />}
      onClick={() => {
        // Update list of selected element before letting parent decide what to do with it (via onClick)
        el.selected = !el.selected
        const new_selected_elements = elements.filter(el => el.selected)
        // Execute parent function for newly selected elements
        onClick(new_selected_elements)
        setMenuListItems(renderMenu())
      }}>
      {el.label}
    </MenuItem>
  })

  // Background overlay for when we want to close selector by clicking outside Menu (sometime the DA) we don't trigger any other event
  const backgroundOverlay = <div style={{
    display: displayBgOverlay ? 'unset' : 'none',
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  }} onClick={() => setDisplayBgOverlay(false)}></div>

  return <Menu isLazy
    placement='auto'
    variant={'menu_select_elements'}
    closeOnSelect={false}
    isOpen={displayBgOverlay}
    onOpen={() => setMenuListItems(renderMenu())}>
    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant={'text_menu_select'} onClick={() => setDisplayBgOverlay(!displayBgOverlay)}> {textBtn}</MenuButton>
    {backgroundOverlay}
    <MenuList>
      {selecAll}
      {menuListItems}
    </MenuList>
  </Menu>
}



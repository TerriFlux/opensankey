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

// External imports
import React, { FC, useState } from 'react'
import { Box, Select } from '@chakra-ui/react'

import { BaseApplicationDataType } from '../SankeyMenuTypes'
import { RowSetter2Cols, BOX2COLSTITLEH4, DataTagSelector, OSTooltip } from './MenuCommon'
import { ConfigMenuNumberInput, ConfigMenuNumberOrUndefinedInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { SankeyLinkSelection } from './SankeyMenuConfigurationLinks'

import { Class_LinkElement } from '../../Elements/Link'
import { value_option_constants, value_option_percent_constants, ValueOptionType } from '../../Elements/LinkValues'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributesConfig'

/*************************************************************************************************/
export const default_value_option = 'value'

export const MenuConfigurationLinksData: FC<BaseApplicationDataType> = ({ new_data }) => {
  const { t, drawing_area, menu_configuration } = new_data
  const { sankey } = drawing_area
  const { data_taggs_list } = sankey
  const {
    is_selector_only_for_visible_links, 
    ref_to_menu_config_links_data_updater,
    ref_to_save_in_cache_indicator
  } = menu_configuration

  const unit_data_tagg = data_taggs_list.find(tagg => tagg.is_unit)

  let selected_links = is_selector_only_for_visible_links ?
    drawing_area.visible_and_selected_links_list_sorted :
    drawing_area.selected_links_list_sorted
  const first_link = selected_links[0]
  const first_link_value = first_link?.value

  const value_option = first_link_value?.value_option ?? default_value_option

  const unit_text = value_option_percent_constants.includes(value_option) ?
    '%' :
    first_link?.value_label_unit_visible ?
      first_link?.value_label_unit :
      undefined
  const default_value = value_option_percent_constants.includes(value_option) ?
    first_link?.value?.valueData ?? null :
    first_link?.valueCurrent

  const is_label_indeterminated = !selected_links.every(el => el.value?.text_value == first_link_value?.text_value)

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  const refreshThis = () => {
    setCount(a => a + 1)
  }

  // Link this menu's update function
  const refreshThisAndUpdateRelatedComponents = () => {
    drawing_area.updateScaleAtLinkValueSetting()
    // Toogle saving indicator
    ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    menu_configuration.updateComponentRelatedToLinksData()
  }
  ref_to_menu_config_links_data_updater.current = refreshThis

  data_taggs_list.map(data_tagg => {
    let selected_data_tags = data_tagg.selected_tags_list
    if (selected_data_tags.length === 0) {
      data_tagg.tags_list[0].setSelected()
    } else if (selected_data_tags.length > 1 && data_tagg.banner == 'one') {
      const data_tags_to_unselect = selected_data_tags.splice(1)
      data_tags_to_unselect.forEach(tag => tag.setUnSelected())
    }
  })

  return <Box layerStyle='menu_sub_section'>
    <SankeyLinkSelection new_data={new_data} />
    {data_taggs_list.map(data_tagg => {
      return <BOX2COLSTITLEH4 title={data_tagg.name}>
        <Select
          name={data_tagg.id}
          variant='menuconfigpanel_option_select'
          value={data_tagg.selected_tags_list[0].id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            data_tagg.selectTagsFromId(evt.target.value)
            refreshThisAndUpdateRelatedComponents()
          }}
        >
          {data_tagg.tags_list.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </Select>
      </BOX2COLSTITLEH4>
    })}

    {/* Choix du type de donnée */}
    <RowSetter2Cols
      attributePath={'Flux.data'}
      attributeKey={'data_type'}
    >
      <Select
        key={`value-option-${value_option}`}
        value={value_option}
        onChange={(evt) => {
          selected_links.forEach(l => l.value!.value_option = evt.target.value as ValueOptionType)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {value_option_constants.map(el => <option key={'value_' + el} value={el}><OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip></option>)}
      </Select>
    </RowSetter2Cols>
    {value_option == 'unit_conversion' && unit_data_tagg ? <DataTagSelector
      data_tagg={unit_data_tagg}
      value={selected_links[0]?.value!.ratio_unit_tag?.id as string}
      onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
        first_link_value!.ratio_unit_tag = unit_data_tagg.tags_dict[evt.target.value]
        refreshThisAndUpdateRelatedComponents()
      }}
    /> : <></>}
    <RowSetter2Cols
      attributePath={'Flux.labels'}
      attributeKey={value_option}
      // optionName={value_option == 'unit_conversion' && unit_data_tagg ?
      //   'ratio ' + unit_data_tagg.selected_tags_list[0].id + '/' + first_link_value?.ratio_unit_tag?.id :
      //   t('Flux.labels.' + value_option)
      // }
    >
      <ConfigMenuNumberOrUndefinedInput
        default_value={default_value}
        function_on_blur={(_: number | null) => updateAttributeAndHistory(selected_links, 'valueCurrent', _, refreshThisAndUpdateRelatedComponents)}
        minimum_value={0}
        stepper={true}
        step={1}
        unit_text={unit_text}
      />
    </RowSetter2Cols>

    <RowSetter2Cols
      attributePath={'Flux.data'}
      attributeKey={'affichage'}
    >
      <ConfigMenuTextInput
        default_value={first_link_value?.text_value}
        function_on_blur={(_: string | null) => updateAttributeAndHistory(selected_links, 'text_value', _ ?? '', refreshThisAndUpdateRelatedComponents)}
        multiValue={is_label_indeterminated}
      />
    </RowSetter2Cols>
  </Box>
}

/*************************************************************************************************/

/**
 * Component developped for number input of the link data config menu
 * @param {new_data}
 * @return {JSX.Elmement}
 */
export const MenuContextLinksData: FC<BaseApplicationDataType> = ({
  new_data,
}) => {

  const { drawing_area, menu_configuration } = new_data
  const { selected_links_list_sorted, visible_and_selected_links_list_sorted } = drawing_area
  const {
    ref_to_menu_contextual_config_links_data_updater,
    ref_to_save_in_cache_indicator
  } = menu_configuration

  let selected_links = menu_configuration.is_selector_only_for_visible_links ?
    visible_and_selected_links_list_sorted :
    selected_links_list_sorted
  const first_link = selected_links[0]
  const first_link_value = first_link?.value
  const value_option = first_link_value?.value_option ?? default_value_option
  const default_value = value_option_percent_constants.includes(value_option) ?
    first_link_value?.valueData ?? null :
    first_link?.valueCurrent
  // Function used to force this component to reload
  const [, setCount] = useState(0)
  ref_to_menu_contextual_config_links_data_updater.current = ()=>setCount(a => a + 1)

  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    ref_to_save_in_cache_indicator.current(false)
    // Update data menu for link
    menu_configuration.updateComponentRelatedToLinksData()
    setCount(a => a + 1)
    // And update this menu also
  }

  return <ConfigMenuNumberInput
    t={new_data.t}
    default_value={default_value}
    function_on_blur={(_: number | null) => updateAttributeAndHistory(selected_links, 'valueCurrent', _, refreshThisAndUpdateRelatedComponents)}
    minimum_value={0}
    stepper={true}
    step={1}
    unit_text={
      (
        selected_links[0]?.value_label_unit_visible &&
        selected_links[0]?.value_label_unit !== LINKS_ATTRIBUTES_CONFIG.value_label_unit.default
      ) ?
        selected_links[0]?.value_label_unit :
        undefined
    }
  />
}

const updateAttributeAndHistory = <
  TKey extends keyof Class_LinkElement
>(
  selected_links: Class_LinkElement[],
  attribute_name: TKey,
  attribute_value: Class_LinkElement[TKey],
  refresh: () => void
) => {
  if (selected_links.length == 0) {
    return
  }
  const drawing_area = selected_links[0].sankey.drawing_area
  const app_data = drawing_area.application_data
  const dict_old_val: { [x: string]: Class_LinkElement[TKey] } = {}
  selected_links.forEach(l => dict_old_val[l.id] = l[attribute_name])
  const _invUpdateAttribute = () => {
    selected_links.forEach(link => link[attribute_name] = dict_old_val[link.id])
    refresh()
  }
  const _updateAttribute = () => {
    selected_links.forEach(link => link[attribute_name] = attribute_value)
    refresh()
  }
  app_data.history.saveUndo(_invUpdateAttribute)
  app_data.history.saveRedo(_updateAttribute)
  _updateAttribute()
}



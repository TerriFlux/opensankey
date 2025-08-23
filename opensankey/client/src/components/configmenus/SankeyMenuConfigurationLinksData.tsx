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
import { Box, Select } from '@chakra-ui/react'

import { RowSetter2Cols, BOX2COLSTITLEH4, DataTagSelector, OSTooltip, updateElements, ValueKey, ValueElementsType } from './MenuCommon'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { SankeyLinkSelection } from './SankeyMenuConfigurationLinks'

import { value_option_constants, value_option_percent_constants, value_option_percent_constants_source, value_option_percent_constants_target, ValueOptionType } from '../../Elements/LinkValues'
import { Class_ApplicationData } from '../../types/ApplicationData'

/*************************************************************************************************/
export const default_value_option = 'value'

export const MenuConfigurationLinksData = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area, menu_configuration } = app_data
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
  const default_value = value_option_percent_constants.includes(value_option) || value_option == 'unit_ratio' ?
    first_link?.value?.valueData ?? null :
    first_link?.valueCurrent

  const is_label_indeterminated = !selected_links.every(el => el.value?.text_value == first_link_value?.text_value)

  // Function used to force this component to reload
  const [, setCount] = useState(0)
  const current_value_type = value_option == 'value' ? 'value' : value_option == 'unit_ratio' ? 'ratio' : 'percent'
  const [value_type, set_value_type] = useState(current_value_type)
  if (value_type !== current_value_type) set_value_type(current_value_type)
  const type_constants = ['value', 'percent']
  if (unit_data_tagg) type_constants.push('ratio')
  const current_node_ref = value_option == '%PS' || value_option == '%IS' || value_option == '%OS' ? 'source' : 'target'
  const [node_ref, set_node_ref] = useState(current_node_ref)
  if (node_ref !== current_node_ref) set_node_ref(current_node_ref)
  const current_dir = value_option == '%IS' || value_option == '%ID' ? 'input' : 'output'
  const [dir, set_dir] = useState(current_dir)
  if (dir !== current_dir) set_dir(current_dir)
  const [ratio, set_ratio] = useState('unit_ratio')
  if (unit_data_tagg && value_type == 'ratio' && ratio == 'unit_ratio' && value_option !== 'unit_ratio') {
    selected_links.forEach(l => {
      l.value!.value_option = 'unit_ratio' as ValueOptionType
      l.value!.ratio_unit_tag = unit_data_tagg.tags_list[0]
    })
  }

  const compute_value_option = (
    value_type: string, node_ref: string, dir: string
  ) => {
    if (value_type == 'value') return 'value'
    if (value_type == 'percent') {
      if (node_ref == 'source') {
        if (dir == 'input') return '%IS'
        if (dir == 'output') return '%OS'
        if (dir == 'parent') return '%PS'
      }
      if (node_ref == 'target') {
        if (dir == 'input') return '%ID'
        if (dir == 'output') return '%OD'
        if (dir == 'parent') return '%PD'
      }
    }
    if (value_type == 'ratio') return 'unit_ratio'
    return
  }

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
    <SankeyLinkSelection new_data={app_data} />
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
      attributeKey={'value_type'}
    >
      <Select
        value={value_type}
        onChange={(evt) => {
          const value_option = compute_value_option(evt.target.value, node_ref, dir)
          selected_links.forEach(l => {
            l.value!.value_option = value_option as ValueOptionType
            if (value_option == 'unit_ratio') {
              l.value!.ratio_unit_tag = unit_data_tagg?.tags_list[0] ?? null
            }
          })
          set_value_type(evt.target.value)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {type_constants.map(el => <option key={'value_' + el} value={el}><OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip></option>)}
      </Select>
    </RowSetter2Cols>
    {value_type === 'percent' ? <RowSetter2Cols
      attributePath={'Flux.data'}
      attributeKey={'node_ref'}
    >
      <Select
        value={node_ref}
        onChange={(evt) => {
          const value_option = compute_value_option(value_type, evt.target.value, dir)
          selected_links.forEach(l => l.value!.value_option = value_option as ValueOptionType)
          set_node_ref(evt.target.value)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {['source', 'target'].map(el => <option key={'value_' + el} value={el}><OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip></option>)}
      </Select>
    </RowSetter2Cols> : <></>}
    {value_type === 'percent' ? <RowSetter2Cols
      attributePath={'Flux.data'}
      attributeKey={'dir'}
    >
      <Select
        value={compute_value_option(value_type, node_ref, dir)}
        onChange={(evt) => {
          const value_option = compute_value_option(value_type, node_ref, evt.target.value)
          selected_links.forEach(l => l.value!.value_option = value_option as ValueOptionType)
          set_dir(evt.target.value)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {node_ref == 'source' ? value_option_percent_constants_source.map(el => <option key={'value_' + el} value={el}><OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip></option>)
          : value_option_percent_constants_target.map(el => <option key={'value_' + el} value={el}><OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip></option>)
        }
      </Select>
    </RowSetter2Cols> : <></>}
    {value_type === 'ratio' ? <RowSetter2Cols
      attributePath={'Flux.data'}
      attributeKey={'ratio'}
    >
      <Select
        value={ratio}
        onChange={(evt) => {
          const value_option = 'unit_ratio'
          selected_links.forEach(l => {
            l.value!.value_option = value_option as ValueOptionType
            l.value!.ratio_unit_tag = unit_data_tagg?.tags_list[0] ?? null
            l.value_label_unit_type = 'unit_ratio'
          })
          set_ratio(evt.target.value)
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {['unit_ratio'].map(el => <option key={'value_' + el} value={el}><OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip></option>)}
      </Select>
    </RowSetter2Cols> : <></>}
    {value_option == 'unit_ratio' && unit_data_tagg ? <DataTagSelector
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
    // optionName={value_option == 'unit_ratio' && unit_data_tagg ?
    //   'ratio ' + unit_data_tagg.selected_tags_list[0].id + '/' + first_link_value?.ratio_unit_tag?.id :
    //   t('Flux.labels.' + value_option)
    // }
    >
      <ConfigMenuNumberInput
        t={t}
        default_value={default_value}
        function_on_blur={(_: number | null) => updateElements(
          app_data, selected_links, 'valueCurrent' as ValueKey, _ as ValueElementsType, refreshThisAndUpdateRelatedComponents
        )}
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
        function_on_blur={(_: string | null) => updateElements(app_data, selected_links, 'text_value' as ValueKey, _ ?? '', refreshThisAndUpdateRelatedComponents)}
        multiValue={is_label_indeterminated}
      />
    </RowSetter2Cols>
  </Box>
}




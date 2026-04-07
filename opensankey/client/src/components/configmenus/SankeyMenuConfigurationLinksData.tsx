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
import { Select, InputGroup, InputLeftAddon } from '@chakra-ui/react'
import { TFunction } from 'i18next'
import { ValueOptionType, value_option_percent_constants_source, value_option_percent_constants_target } from '../../Elements/LinkValues'
import { Class_LinkElement } from '../../Elements/Link'
import { Box, Button, Checkbox } from '@chakra-ui/react'
import {
  RowSetter2Cols, DataTagSelector, OSTooltip,
  BOX2COLSTITLEH4,
  ConfigMenuNumberInput, ConfigMenuTextInput
} from './MenuCommon'
import { getElementsLabelValues } from '../../Elements/ElementsAttributesConfig'
import { SankeyLinkSelection } from './MenuElementsSelection'
import { value_option_percent_constants } from '../../Elements/LinkValues'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { BASE_LABEL_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { Class_DataTagGroup } from '../../types/TagGroup'
interface LinkValueTypeSelectorProps {
  t: TFunction,
  app_data: Class_ApplicationData
}

export const LinkValueTypeSelector = ({
  t, app_data
}: LinkValueTypeSelectorProps) => {
  const [state, setState] = useState<{
    selected_links: Class_LinkElement[],
    unit_data_tagg?: Class_DataTagGroup,
    refreshThis: () => void
  }>({
    selected_links: [],
    refreshThis: () => null
  })

  app_data.menu_configuration.r_value_type_set_elements.current = (
    _selected_links: Class_LinkElement[],
    _unit_data_tagg: Class_DataTagGroup,
    _refreshThis: () => void
  ) => {
    setState({
      selected_links: _selected_links,
      unit_data_tagg: _unit_data_tagg,
      refreshThis: _refreshThis
    })
  }

  const first_link = state.selected_links[0]
  const first_link_value = first_link?.value
  const value_option = first_link_value?.value_option ?? 'value'

  // ✅ Fonction de calcul du value_option
  const compute_value_option = (
    value_type: string,
    node_ref: string,
    dir: string
  ): string | undefined => {
    if (value_type === 'value') return 'value'
    if (value_type === 'percent') {
      if (node_ref === 'source') {
        if (dir === 'input') return '%IS'
        if (dir === 'output') return '%OS'
        if (dir === 'parent') return '%PS'
      }
      if (node_ref === 'target') {
        if (dir === 'input') return '%ID'
        if (dir === 'output') return '%OD'
        if (dir === 'parent') return '%PD'
      }
    }
    if (value_type === 'ratio') return 'unit_ratio'
    return undefined
  }

  // ✅ States avec synchronisation
  const current_value_type = value_option === 'value' ? 'value' : value_option === 'unit_ratio' ? 'ratio' : 'percent'
  const [value_type, set_value_type] = useState(current_value_type)
  if (value_type !== current_value_type) set_value_type(current_value_type)

  const type_constants = ['value', 'percent']
  if (state.unit_data_tagg) type_constants.push('ratio')

  const current_node_ref = value_option === '%PS' || value_option === '%IS' || value_option === '%OS' ? 'source' : 'target'
  const [node_ref, set_node_ref] = useState(current_node_ref)
  if (node_ref !== current_node_ref) set_node_ref(current_node_ref)

  const current_dir = (value_option === '%IS' || value_option === '%ID') ? 'input' : (value_option === '%OS' || value_option === '%OD') ? 'output' : 'parent'
  const [dir, set_dir] = useState(current_dir)
  if (dir !== current_dir) set_dir(current_dir)

  const [ratio, set_ratio] = useState('unit_ratio')

  // ✅ Logique de synchronisation pour unit_ratio
  if (state.unit_data_tagg && value_type === 'ratio' && ratio === 'unit_ratio' && value_option !== 'unit_ratio') {
    state.selected_links.forEach(l => {
      l.value!.value_option = 'unit_ratio' as ValueOptionType
      l.value!.ratio_unit_tag = state.unit_data_tagg!.tags_list[0]
    })
  }

  return (
    <>
      {/* Choix du type de donnée */}
      <RowSetter2Cols
        attributePath={'Flux.data'}
        attributeKey={'value_type'}
      >
        <Select
          value={value_type}
          onChange={(evt) => {
            const computed_value_option = compute_value_option(evt.target.value, node_ref, dir)
            state.selected_links.forEach(l => {
              l.value!.value_option = computed_value_option as ValueOptionType
              if (computed_value_option === 'unit_ratio') {
                l.value!.ratio_unit_tag = state.unit_data_tagg!.tags_list[0] ?? null
              }
            })
            set_value_type(evt.target.value)
            state.refreshThis()
          }}
        >
          {type_constants.map(el => (
            <option key={'value_' + el} value={el}>
              <OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip>
            </option>
          ))}
        </Select>
      </RowSetter2Cols>

      {/* Référence de nœud (pour percent) */}
      {value_type === 'percent' && (
        <RowSetter2Cols
          attributePath={'Flux.data'}
          attributeKey={'node_ref'}
        >
          <Select
            value={node_ref}
            onChange={(evt) => {
              const computed_value_option = compute_value_option(value_type, evt.target.value, dir)
              state.selected_links.forEach(l => l.value!.value_option = computed_value_option as ValueOptionType)
              set_node_ref(evt.target.value)
              state.refreshThis()
            }}
          >
            {['source', 'target'].map(el => (
              <option key={'value_' + el} value={el}>
                <OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip>
              </option>
            ))}
          </Select>
        </RowSetter2Cols>
      )}

      {/* Direction (pour percent) */}
      {value_type === 'percent' && (
        <RowSetter2Cols
          attributePath={'Flux.data'}
          attributeKey={'dir'}
        >
          <Select
            value={compute_value_option(value_type, node_ref, dir)}
            onChange={(evt) => {
              state.selected_links.forEach(l => l.value!.value_option = evt.target.value as ValueOptionType)
              set_dir(evt.target.value)
              state.refreshThis()
            }}
          >
            {node_ref === 'source'
              ? value_option_percent_constants_source.map(el => (
                <option key={'value_' + el} value={el}>
                  <OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip>
                </option>
              ))
              : value_option_percent_constants_target.map(el => (
                <option key={'value_' + el} value={el}>
                  <OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip>
                </option>
              ))
            }
          </Select>
        </RowSetter2Cols>
      )}

      {/* Ratio (pour ratio) */}
      {value_type === 'ratio' && (
        <RowSetter2Cols
          attributePath={'Flux.data'}
          attributeKey={'ratio'}
        >
          <Select
            value={ratio}
            onChange={(evt) => {
              const computed_value_option = 'unit_ratio'
              state.selected_links.forEach(l => {
                l.value!.value_option = computed_value_option as ValueOptionType
                l.value!.ratio_unit_tag = state.unit_data_tagg!.tags_list[0] ?? null
                l.value_label_unit_type = 'unit_ratio'
              })
              set_ratio(evt.target.value)
              state.refreshThis()
            }}
          >
            {['unit_ratio'].map(el => (
              <option key={'value_' + el} value={el}>
                <OSTooltip label={el}>{t('Flux.labels.' + el)}</OSTooltip>
              </option>
            ))}
          </Select>
        </RowSetter2Cols>
      )}

      {/* Sélecteur de tag unitaire */}
      {value_option === 'unit_ratio' && state.unit_data_tagg && (
        <DataTagSelector
          data_tagg={state.unit_data_tagg}
          value={state.selected_links[0]?.value!.ratio_unit_tag?.id as string}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            if (first_link_value) {
              first_link_value.ratio_unit_tag = state.unit_data_tagg!.tags_dict[evt.target.value]
              state.refreshThis()
            }
          }}
        />
      )}
    </>
  )
}

/*************************************************************************************************/
export const default_value_option = 'value'

export const MenuConfigurationLinksData = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { data_taggs_list } = sankey
  const {
    ref_to_menu_config_links_data_updater,
    ref_to_save_in_cache_indicator
  } = menu_configuration

  const unit_data_tagg = data_taggs_list.find(tagg => tagg.is_unit)

  const selected_links = drawing_area.selected_links_list_sorted

  const first_link = selected_links[0]
  const first_link_value = first_link?.value

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  const refreshThis = () => {
    setCount(a => a + 1)
  }

  // Link this menu's update function
  const refreshThisAndUpdateRelatedComponents = () => {
    //drawing_area.updateScaleAtLinkValueSetting()
    // Toogle saving indicator
    ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    menu_configuration.updateComponentRelatedToLinksData()
  }

  ref_to_menu_config_links_data_updater.current = refreshThis

  // const shapeValues = selected_links.length > 0
  //   ? getLinkShapeValues(selected_links, refreshThisAndUpdateRelatedComponents)
  //   : Object.fromEntries(
  //     Object.entries(LINK_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])
  //   ) as { -readonly [K in keyof typeof LINK_SHAPE_SPECIFIC_CONFIG]: ReturnType<typeof LINK_SHAPE_SPECIFIC_CONFIG[K]['type']> }

  type DisplayMode = 'simple_text' | 'rich_text' | 'icon' | 'image'

  const labelValues = selected_links.length > 0
    ? getElementsLabelValues(selected_links, 'name_label', refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(BASE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof BASE_LABEL_CONFIG]: ReturnType<typeof BASE_LABEL_CONFIG[K]['type']> }

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (selected_links.length === 0) return 'simple_text'
    if (labelValues.has_fo) return 'rich_text'
    if (labelValues.is_image) return 'image'
    if (labelValues.is_icon) return 'icon'
    return 'simple_text'
  })

  const value_option = first_link_value?.value_option ?? default_value_option

  const unit_text = value_option_percent_constants.includes(value_option) ?
    '%' :
    first_link?.value_label_unit_visible ?
      first_link?.value_label_unit :
      undefined

  const default_value = value_option_percent_constants.includes(value_option) || value_option === 'unit_ratio' ?
    first_link?.value?.valueData ?? null :
    first_link?.valueCurrent

  const default_value_target = first_link?.valueCurrentTarget

  const is_label_indeterminated = !selected_links.every(el => el.value?.text_value === first_link_value?.text_value)

  // ✅ Gestion des data tags
  data_taggs_list.map(data_tagg => {
    const selected_data_tags = data_tagg.selected_tags_list
    if (selected_data_tags.length === 0) {
      data_tagg.tags_list[0].setSelected()
    } else if (selected_data_tags.length > 1 && data_tagg.banner === 'one') {
      const data_tags_to_unselect = selected_data_tags.splice(1)
      data_tags_to_unselect.forEach(tag => tag.setUnSelected())
    }
  })

  const setModeSimpleText = () => {
    labelValues.has_fo = false
    labelValues.icon_name = ''
    setDisplayMode('simple_text')
  }

  const setModeRichText = () => {
    app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_rich_text_editor.current(true)
    app_data.menu_configuration.r_editor_content_set_elements.current(selected_links, 'name_label')
    labelValues.has_fo = true
    labelValues.icon_name = ''
    setDisplayMode('rich_text')
  }

  return <Box layerStyle='menu_sub_section'>
    <SankeyLinkSelection app_data={app_data} />
    {/* Édition origine / destination du flux */}
    <Box
      display='grid'
      gridTemplateColumns='9fr 1fr'
      gridTemplateRows='1fr 1fr'
      gridColumnGap='0.25rem'
      gridRowGap='0.25rem'
      height='4.25rem'
    >
      <Box
        display='grid'
        gridTemplateColumns='1fr'
        gridTemplateRows='1fr 1fr'
        gridRowGap='0.25rem'
      >
        <OSTooltip label={t('Flux.tooltips.src')}>
          <InputGroup variant='menuconfigpanel_option_input'>
            <InputLeftAddon height='1.5rem' width='5rem'>
              {t('Flux.src')}
            </InputLeftAddon>
            <Select
              variant='select_custom_style'
              isDisabled={selected_links.length !== 1}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const new_source = sankey.nodes_dict[event.target.value]
                if (new_source !== null) {
                  selected_links.forEach(link => link.source = new_source)
                  refreshThisAndUpdateRelatedComponents()
                }
              }}
              value={selected_links.length > 0 ? selected_links[0].source.id : ''}
            >
              <>
                <option hidden key={'no_source'} value=''> </option>
                {sankey.nodes_list.map((n, i) => <option key={i} value={n.id}>{n.name}</option>)}
              </>
            </Select>
          </InputGroup>
        </OSTooltip>

        <OSTooltip label={t('Flux.tooltips.trgt')}>
          <InputGroup variant='menuconfigpanel_option_input'>
            <InputLeftAddon height='1.5rem' width='5rem'>
              {t('Flux.trgt')}
            </InputLeftAddon>
            <Select
              variant='select_custom_style'
              isDisabled={selected_links.length !== 1}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const new_target = sankey.nodes_dict[event.target.value]
                if (new_target !== null) {
                  selected_links.forEach(link => link.target = new_target)
                  refreshThisAndUpdateRelatedComponents()
                }
              }}
              value={selected_links.length > 0 ? selected_links[0].target.id : ''}
            >
              <>
                <option hidden key={'no_target'} value=''> </option>
                {sankey.nodes_list.map((n, i) => <option key={i} value={n.id}>{n.name}</option>)}
              </>
            </Select>
          </InputGroup>
        </OSTooltip>
      </Box>
    </Box>
    {/* Data tags selector */}
    {data_taggs_list.map(data_tagg => {
      return <BOX2COLSTITLEH4 key={data_tagg.id} title={data_tagg.name}>
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

      {/* Value input and format button */}
      <Box layerStyle='options_2cols'>
        <RowSetter2Cols
          attributePath={'Flux.labels'}
          attributeKey={'value'}
        >
          <ConfigMenuNumberInput
            t={t}
            default_value={default_value}
            function_on_blur={(_: number | null) => {
              Class_LinkElement.updateLinks(
                app_data, selected_links, 'valueCurrent', _!, refreshThisAndUpdateRelatedComponents
              )
              drawing_area.updateScaleAtLinkValueSetting()
            }}
            minimum_value={0}
            stepper={true}
            step={1}
            unit_text={unit_text}
          />
        </RowSetter2Cols>
        <Box layerStyle='options_2cols'>
          {/* <Button
          variant={'menuconfigpanel_option_button'}
          onClick={() => {
            app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_value_formatting_editor.current(true)
            app_data.menu_configuration.r_value_formatting_set_elements.current(
              selected_links,
              'Flux.labels'
            )
          }}
        >
        Format
        </Button> */}
          <OSTooltip label={''} disabled={!app_data.has_sankey_afm}>
            <Button
              isDisabled={!app_data.has_sankey_afm}
              variant={'menuconfigpanel_option_button'}
              onClick={() => {
                app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_value_type_editor.current(true)
                app_data.menu_configuration.r_value_type_set_elements.current(
                  selected_links,
                  unit_data_tagg!,
                  refreshThisAndUpdateRelatedComponents
                )
              }}
            >
              Type
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Target (destination) value - checkbox to enable, disabled without OSP+ */}
      <OSTooltip label={t('Flux.data.tooltips.value_target')} disabled={!app_data.has_sankey_plus}>
        <Box layerStyle='options_2cols'>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isDisabled={!app_data.has_sankey_plus}
            isChecked={default_value_target !== null}
            onChange={(evt) => {
              if (evt.target.checked) {
                // Enable: set target value = current source value
                Class_LinkElement.updateLinks(
                  app_data, selected_links, 'valueCurrentTarget', first_link?.valueCurrent ?? 0, refreshThisAndUpdateRelatedComponents
                )
              } else {
                // Disable: clear target value
                Class_LinkElement.updateLinks(
                  app_data, selected_links, 'valueCurrentTarget', null as unknown as number, refreshThisAndUpdateRelatedComponents
                )
              }
            }}
          >
            {t('Flux.data.value_target')}
          </Checkbox>
        </Box>
      </OSTooltip>
      {default_value_target !== null && app_data.has_sankey_plus && <Box layerStyle='options_2cols'>
        <RowSetter2Cols
          attributePath={'Flux.data'}
          attributeKey={'value_target'}
        >
          <ConfigMenuNumberInput
            t={t}
            default_value={default_value_target}
            function_on_blur={(_: number | null) => {
              Class_LinkElement.updateLinks(
                app_data, selected_links, 'valueCurrentTarget', _!, refreshThisAndUpdateRelatedComponents
              )
            }}
            minimum_value={0}
            stepper={true}
            step={1}
            unit_text={unit_text}
          />
        </RowSetter2Cols>
      </Box>}

      {/* Text display and mode selector */}
      <Box layerStyle='options_2cols'>
        <RowSetter2Cols
          attributePath={'Flux.data'}
          attributeKey={'affichage'}
        >
          <ConfigMenuTextInput
            t={t}
            default_value={first_link_value?.text_value}
            function_on_blur={(_: string | null) =>
              Class_LinkElement.updateLinks(app_data, selected_links, 'text_value', _ ?? '', refreshThisAndUpdateRelatedComponents)
            }
            multiValue={is_label_indeterminated}
          />
        </RowSetter2Cols>
        <Box layerStyle='options_2cols'>
          <Button
            variant={displayMode === 'simple_text' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            onClick={setModeSimpleText}
          >
            Text
          </Button>
          <OSTooltip label={''} disabled={!app_data.has_sankey_plus}>
            <Button
              isDisabled={!app_data.has_sankey_plus}
              variant={displayMode === 'rich_text' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
              onClick={setModeRichText}
            >
              Rich
            </Button>
          </OSTooltip>
        </Box>
      </Box>
  </Box>
}
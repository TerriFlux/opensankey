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
import React, { FunctionComponent, useRef, useState } from 'react'

import {
  Box,
  Select,
} from '@chakra-ui/react'

// Local types imports
import type {
  FCType_MenuContextLinkData,
  FCType_MenuConfigurationLinksData
} from './types/SankeyMenuConfigurationLinksDataTypes'

// Local components or functions
import {
  OSTooltip
} from '../../types/Utils'
import { LINKS_ATTRIBUTES_CONFIG } from '../../Elements/LinkAttributes'
import { ConfigMenuNumberInput, ConfigMenuNumberOrUndefinedInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { SankeyLinkSelection } from './SankeyMenuConfigurationLinks'
import { ValueOptionType } from '../../Elements/LinkValues'
import { Class_LinkElement } from '../../Elements/Link'

/*************************************************************************************************/

export const MenuConfigurationLinksData: FunctionComponent<FCType_MenuConfigurationLinksData> = ({
  new_data,
  contextual
}) => {

  // Traduction
  const { t } = new_data

  // Selected links --------------------------------------------------------------------

  let selected_links: Class_LinkElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Data tags and values --------------------------------------------------------------
  const list_data_taggs = new_data.drawing_area.sankey.data_taggs_list
  const value = selected_links[0]?.value

  // Components updaters ---------------------------------------------------------------

  // Refs used to trigger refreshing of number & text inputs
  const ref_set_data_value_input = useRef((_: string | null | undefined) => null)
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  let unit_text : string | undefined
  let default_value = element_ref.valueCurrent
  if (value_option == 'ratio_input' || value_option == 'ratio_output') {
    unit_text = '%'
    default_value = default_value?default_value:null
  }

  const updateInputsValues = () => {
    // Recreate a updated_selected_links list in the function because it can be called before re-rendering <MenuConfigurationLinksData/>
    // so selected_links can have the list of previous selected links wich can lead to incorrect links value
    const updated_selected_links = !new_data.menu_configuration.is_selector_only_for_visible_links ?
      new_data.drawing_area.selected_links_list_sorted : new_data.drawing_area.visible_and_selected_links_list_sorted

    const value_update = updated_selected_links[0]?.value
    // Update input data value
    ref_set_data_value_input.current(String(updated_selected_links[0]?.valueCurrent ?? ''))

    // Update input text value
    ref_set_text_value_input.current(String(value_update?.text_value ?? ''))
  }

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  const refreshThis = () => {
    updateInputsValues()
    setCount(a => a + 1)
  }

  // Link this menu's update function
  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToLinksData()
  }

  if (contextual) {
    new_data.menu_configuration.ref_to_menu_contextual_config_links_data_updater.current = refreshThis
  }
  else {
    new_data.menu_configuration.ref_to_menu_config_links_data_updater.current = refreshThis
  }

  /**
   * Method to mutate link value & save it's undoing in data history
   *
   * @param {(number | null | undefined)} _
   */
  const updateValueAndHistory = (_: number | null | undefined) => {
    // Save old values in dict so the undo reset value for previous value of each link
    const dict_old_val: { [x: string]: number | null } = {}
    selected_links.forEach(l => dict_old_val[l.id] = l.valueData)
    // Undo link value
    const inv_updateDataLinks = () => {
      // Update data for links
      selected_links.forEach(link => {
        link.data_value = dict_old_val[link.id]
      })
      // Update scaling if only one link
      new_data.drawing_area.updateScaleAtLinkValueSetting()
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }
    // Mutate link value
    const _updateDataLinks = () => {
      // Update data for links
      selected_links.forEach(link => {
        link.data_value = (_ ?? null)
      })
      // Update scaling if only one link
      new_data.drawing_area.updateScaleAtLinkValueSetting()
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateDataLinks)
    new_data.history.saveRedo(_updateDataLinks)
    // Execute original attr mutation
    _updateDataLinks()
  }

  /**
   * Method to mutate link text & save it's undoing in data history
   *
   * @param {(number | null | undefined)} _
   */
  const updateTextLinks = (_: string | undefined | null) => {
    // Save old values in dict so the undo reset value for previous value of each link
    const dict_old_val: { [x: string]: string } = {}
    selected_links.forEach(l => dict_old_val[l.id] = l.text_value)
    // Undo link value
    const inv_updateTextLinks = () => {
      // Update data for links
      selected_links.forEach(link => {
        link.text_value = dict_old_val[link.id]
      })
      // Update scaling if only one link
      new_data.drawing_area.updateScaleAtLinkValueSetting()
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }

    // Mutate link value
    const _updateTextLinks = () => {
      // Update data for links
      selected_links.forEach(link => {
        link.text_value = (_ ?? '')
      })
      // Update scaling if only one link
      new_data.drawing_area.updateScaleAtLinkValueSetting()
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateTextLinks)
    new_data.history.saveRedo(_updateTextLinks)
    // Execute original attr mutation
    _updateTextLinks()
  }

  const is_label_indeterminated = !selected_links.every(el => el.value?.text_value == selected_links[0].value?.text_value)

  // JSX -------------------------------------------------------------------------------

  const content = <Box
    layerStyle='menu_sub_section'
  >
    <SankeyLinkSelection
      new_data={new_data}
    />
    {
      // Définition des valeurs selon les paramètre dataTags
      list_data_taggs.map(data_tagg => {
        if (data_tagg.has_tags) {
          // Only one dataTag / group can be selected
          let selected_data_tags = data_tagg.selected_tags_list
          if (selected_data_tags.length === 0) {
            data_tagg.tags_list[0].setSelected()
            selected_data_tags = data_tagg.selected_tags_list
          }
          else if (selected_data_tags.length > 1) {
            const data_tags_to_unselect = selected_data_tags.splice(1)
            data_tags_to_unselect.forEach(tag => tag.setUnSelected())
          }
          // Retrun selection box
          return (<>
            <Box
              as='span'
              layerStyle='menuconfigpanel_part_title_3'
            >
              {data_tagg.name}
            </Box>
            <Select
              name={data_tagg.id}
              variant='menuconfigpanel_option_select'
              value={
                selected_data_tags[0].id
              }
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                // Update selected attributes for tags
                data_tagg.selectTagsFromId(evt.target.value)
                // Update this menu
                refreshThisAndUpdateRelatedComponents()
              }}
            >
              {
                data_tagg.tags_list.map(tag => {
                  return <option key={tag.id} value={tag.id}>{tag.name}</option>
                })
              }
            </Select></>
          )
        }
      })
    }

    {/* Choix du type de donnée */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.data.data_type')}
      </Box>
      {/* <OSTooltip label={t('Flux.data.tooltips.data_type')}> */}
      <Select
        value={value_option}
        onChange={(evt) => {
          selected_links.forEach(l=>l.value!.value_option = evt.target.value as ValueOptionType)
          new_data.drawing_area.updateScaleAtLinkValueSetting()
          // Update this menu
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {new_data.menu_configuration.data_type.map(el => {
          // if (el=='unit_conversion' && (list_data_taggs.length==0 || list_data_taggs.filter(g=>g.banner == 'unit').length==0)) {
          //   return <></>
          // }
          return <option key={'value_' + el} value={el}><><OSTooltip label={el}>{t('Flux.data.'+el)}</OSTooltip></></option>
        })}
      </Select>
      {/* </OSTooltip> */}
    </Box>
    {/* Valeur du flux pour les parametre (filtres datatags) choisis  */}
    <OSTooltip label={t('Flux.data.tooltips.vpp')}>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
        >
          {t('Flux.data.vpp')}
        </Box>
        <ConfigMenuNumberOrUndefinedInput
          ref_to_set_value={ref_set_data_value_input}
          default_value={default_value}
          function_on_blur={updateValueAndHistory}
          minimum_value={0}
          stepper={true}
          step={1}
          multiValue={is_value_indeterminated}
          unit_text={
            (
              selected_links[0]?.value_label_unit_visible &&
              selected_links[0]?.value_label_unit !== default_link_value_label_unit
            ) ?
              selected_links[0]?.value_label_unit :
              undefined
          }

        />
      </Box>
    </OSTooltip>

    <OSTooltip
      label={t('Flux.data.tooltips.affichage')}
    >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Flux.data.affichage')}
        </Box>
        <ConfigMenuTextInput
          ref_to_set_value={ref_set_text_value_input}
          function_get_value={() => { return value?.text_value }}
          function_on_blur={updateTextLinks}
          multiValue={is_label_indeterminated}
        />
      </Box>
    </OSTooltip>
  </Box>
  // Return JSX component
  return content
}

/*************************************************************************************************/

/**
 * Component developped for number input of the link data config menu
 * @param {new_data}
 * @return {JSX.Elmement}
 */
export const MenuContextLinksData: FunctionComponent<FCType_MenuContextLinkData> = ({
  new_data,
}) => {

  // Selected links --------------------------------------------------------------------

  let selected_links: Class_LinkElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }
  const value = selected_links[0]?.value

  // Components updaters ---------------------------------------------------------------

  // Refs used to trigger refreshing of number & text inputs
  const ref_set_data_value_input = useRef((_: string | null | undefined) => null)
  const updateInputsValues = () => {
    // Update input data value
    ref_set_data_value_input.current(String(value?.data_value ?? ''))
  }

  // Function used to force this component to reload
  const [, setCount] = useState(0)
  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update data menu for link
    new_data.menu_configuration.updateComponentRelatedToLinksData()
    // And update this menu also
    setCount(a => a + 1)
    updateInputsValues()
  }

  const updateDataLinks = (_: number | null | undefined) => {
    // Save old values in dict so the undo reset value for previous value of each link
    const dict_old_val: { [x: string]: number | null } = {}
    selected_links.forEach(l => dict_old_val[l.id] = l.data_value)
    // Undo link value
    const inv_updateDataLinks = () => {
      // Update data for links
      selected_links.forEach(link => {
        link.data_value = dict_old_val[link.id]
      })
      // Update scaling if only one link
      new_data.drawing_area.updateScaleAtLinkValueSetting()
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }

    const _updateDataLinks = () => {
      // Update data for links
      selected_links.forEach(link => {
        link.data_value = (_ ?? null)
      })
      // Update scaling if only one link
      new_data.drawing_area.updateScaleAtLinkValueSetting()
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }
    // Save undo/redo in data history
    new_data.history.saveUndo(inv_updateDataLinks)
    new_data.history.saveRedo(_updateDataLinks)
    // Execute original attr mutation
    _updateDataLinks()
  }

  return <ConfigMenuNumberInput
    t={new_data.t}
    ref_to_set_value={ref_set_data_value_input}
    default_value={value?.data_value ?? null}
    function_on_blur={updateDataLinks}
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
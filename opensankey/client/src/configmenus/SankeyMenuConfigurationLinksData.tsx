// External imports
import React, { FunctionComponent, useRef, useState } from 'react'

import {
  Box,
  Select,
} from '@chakra-ui/react'

// Local types
import {
  MenuContextLinksDataType,
  MenuConfigurationLinksDataFType
} from './types/SankeyMenuConfigurationLinksDataTypes'

// Local components or functions
import {
  OSTooltip
} from '../types/Utils'
import { Class_LinkElement, default_value_label_unit } from '../types/Link'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'

/*************************************************************************************************/

export const MenuConfigurationLinksData: FunctionComponent<MenuConfigurationLinksDataFType> = ({
  applicationData,
  additional_data_element,
}) => {

  // Traduction
  const { t } = applicationData.new_data

  // Sankey datas
  const { new_data } = applicationData

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
  const ref_set_data_value_input = useRef((_: number | null | undefined) => null)
  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)
  const updateInputsValues = () => {
    // Update input data value
    ref_set_data_value_input.current(value?.data_value ?? null)
    // Update input text value
    ref_set_text_value_input.current(value?.text_value ?? null)
  }

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  // Link this menu's update function
  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a=>a+1)
  }

  new_data.menu_configuration.ref_to_menu_config_link_data_updater.current = () => {
    updateInputsValues()
    setCount(a=>a+1)
  }

  // JSX -------------------------------------------------------------------------------

  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
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
                data_tagg.tags_list.forEach(tag => {
                  if (tag.id === evt.target.value)
                    tag.setSelected()
                  else
                    tag.setUnSelected()
                })
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
        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_data_value_input}
          default_value={value?.data_value ?? null}
          function_on_blur={(_) => {
            // Update data for links
            selected_links.forEach(link => {
              link.data_value = (_ ?? null)
            })
            // Update this menu
            refreshThisAndUpdateRelatedComponents()
          }}
          minimum_value={0}
          stepper={true}
          step={1}
          unit_text={
            (
              selected_links[0]?.value_label_unit_visible &&
              selected_links[0]?.value_label_unit !== default_value_label_unit
            ) ?
              selected_links[0]?.value_label_unit :
              undefined
          }
        />
      </Box>
    </OSTooltip>


    {/* Afficher ou non les donnée sur le Sankey  */}

    <OSTooltip label={t('Flux.data.tooltips.affichage')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Flux.data.affichage')}
        </Box>
        <ConfigMenuTextInput
          ref_to_set_value={ref_set_text_value_input}
          function_get_value={() => { return value?.text_value }}
          function_on_blur={(_) => {
            // Update text for links
            selected_links.forEach(link => {
              link.text_value = (_ ?? '')
            })
            // Update this menu
            refreshThisAndUpdateRelatedComponents()
          }}
        />
      </Box>
    </OSTooltip>

    {additional_data_element}

  </Box>

  // Update input values
  updateInputsValues()

  // Return JSX component
  return content
}

/*************************************************************************************************/

/**
 * Component developped for number input of the link data config menu
 * @param {applicationData} TODO
 * @return {JSX.Elmement}
 */
export const MenuContextLinksData: FunctionComponent<MenuContextLinksDataType> = ({
  applicationData,
}) => {

  // Application data ------------------------------------------------------------------

  // Sankey datas
  const { new_data } = applicationData

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
  const ref_set_data_value_input = useRef((_: number | null | undefined) => null)
  const updateInputsValues = () => {
    // Update input data value
    ref_set_data_value_input.current(value?.data_value ?? null)
  }

  // Function used to force this component to reload
  const [, setCount] = useState(0)

  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update data menu for link
    new_data.menu_configuration.ref_to_menu_config_link_data_updater.current()
    // And update this menu also
    setCount(a=>a+1)
    updateInputsValues()
  }

  const content = <ConfigMenuNumberInput
    ref_to_set_value={ref_set_data_value_input}
    default_value={value?.data_value ?? null}
    function_on_blur={(_) => {
      // Update data for links
      selected_links.forEach(link => {
        link.data_value = (_ ?? null)
      })
      // Update this menu
      refreshThisAndUpdateRelatedComponents()
    }}
    minimum_value={0}
    stepper={true}
    step={1}
    unit_text={
      (
        selected_links[0]?.value_label_unit_visible &&
        selected_links[0]?.value_label_unit !== default_value_label_unit
      ) ?
        selected_links[0]?.value_label_unit :
        undefined
    }
  />

  return content
}
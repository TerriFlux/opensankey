// External imports
import React, { FunctionComponent, useState } from 'react'
import {
  Box,
  Checkbox,
  Select,
  TabPanel,
  useBoolean
} from '@chakra-ui/react'

// Local types
import { Class_Tag } from '../types/Tag'
import { Class_LinkElement } from '../types/Link'
import {
  MenuConfigurationLinksTagsFType
} from './types/SankeyMenuConfigurationLinksTagsTypes'

/*************************************************************************************************/

export const MenuConfigurationLinksTags : FunctionComponent<MenuConfigurationLinksTagsFType> = ({
  applicationData,
  applicationContext,
  menu_for_modal,
})=>{

  // Data -------------------------------------------------------------------------------

  const { t } = applicationContext
  const { new_data } = applicationData

  // Tags -------------------------------------------------------------------------------

  // Flux tag groups
  const list_flux_taggs = new_data.drawing_area.sankey.flux_taggs_list
  const has_flux_taggs = list_flux_taggs.length > 0
  const [flux_tagg_entry_index, setFluxTaggEntryIndex] = useState(0)
  const flux_tagg_entry = list_flux_taggs[flux_tagg_entry_index]

  // Data tag groups
  const data_taggs = new_data.drawing_area.sankey.data_taggs_list

  // Selected links ---------------------------------------------------------------------

  let selected_links: Class_LinkElement[]
  if (!new_data.menu_configuration.is_selector_only_for_visible_links) {
    // All availables links
    selected_links = new_data.drawing_area.selected_links_list_sorted
  }
  else {
    // Only visible links
    selected_links = new_data.drawing_area.visible_and_selected_links_list_sorted
  }

  // Menu updaters ----------------------------------------------------------------------

  const [ , refreshThis ] = useBoolean()
  const updateThis = () => {
    // Can just use simple refresh if flux_tagg entry exists
    if (new_data.drawing_area.sankey.flux_taggs_list[flux_tagg_entry_index])
      refreshThis.toggle()
    // If not, reset entry
    else
      setFluxTaggEntryIndex(0)
  }
  new_data.menu_configuration.ref_to_menu_config_link_tags_updater.current = updateThis

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
  }

  // Utils functions --------------------------------------------------------------------

  /**
   * Check if all selected nodes are related to the given tag
   * @param {Class_Tag} tag
   * @return [allTrue: boolean, allFalse: boolean]
   */
  const haveAllSelectedLinksGivenTag = (
    tag: Class_Tag
  ) => {
    let allTrue = true
    let allFalse = true
    selected_links
      .forEach(link => {
        const test = link.hasGivenTag(tag)
        allTrue = allTrue && (test === true)
        allFalse = allFalse && (test === false)
      })
    return [allTrue, allFalse]
  }

  // JSX content ------------------------------------------------------------------------

  const content = <>
    {
      (
        has_flux_taggs &&
        selected_links.length !== 0
      ) ?
        <Box
          layerStyle='menuconfigpanel_grid'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_part_title_1'
          >
            {t('Menu.EF')}
          </Box>

          {/* Groupe d'étiquettes  */}
          <Select
            variant='menuconfigpanel_option_select'
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              setFluxTaggEntryIndex(Number(evt.target.value))
            }}
            value={flux_tagg_entry_index}
          >
            {
              list_flux_taggs.map((flux_tagg, flux_tagg_index) =>
                <option
                  key={flux_tagg.id}
                  value={flux_tagg_index}
                >
                  {flux_tagg.name}
                </option>)
            }
          </Select>

          {/* Définition des valeurs selon les paramètre dataTags */}
          {
            data_taggs
              .filter(data_tagg => data_tagg.has_tags) // Secu
              .map(data_tagg => {
                return (<>
                  <Box
                    as='span'
                    layerStyle='menuconfigpanel_part_title_3'
                  >
                    {data_tagg.name}
                  </Box>
                  <Select
                    variant='menuconfigpanel_option_select'
                    name={data_tagg.id}
                    value={data_tagg.first_selected_tags?.id ?? '-'}
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => {
                        data_tagg.tags_list
                          .forEach(data_tag => {
                            if (data_tag.id === evt.target.value)
                              data_tag.setSelected()
                            else
                              data_tag.setUnSelected()
                          })
                        // Update only this menu
                        new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
                      }
                    }
                  >
                    {
                      data_tagg.tags_list
                        .map(data_tag => {
                          return (
                            <option
                              key={data_tag.id}
                              value={data_tag.id}
                            >
                              {data_tag.name}
                            </option>
                          )
                        })}
                  </Select></>
                )
              })
          }

          <Box
            layerStyle='menuconfigpanel_grid'
          >
            {
              flux_tagg_entry.tags_list
                .map(flux_tag => {
                  const [allTrue, allFalse] = haveAllSelectedLinksGivenTag(flux_tag)
                  return (
                    <Checkbox
                      variant='menuconfigpanel_option_checkbox'
                      isChecked={allTrue}
                      isIndeterminate={!allTrue && !allFalse}
                      onChange={(evt) => {
                        const visible = evt.target.checked
                        selected_links.forEach(link=>{
                          if (visible) {
                            link.addTag(flux_tag)
                          }
                          else {
                            link.removeTag(flux_tag)
                          }
                        })
                        // Full update
                        refreshThisAndUpdateRelatedComponents()
                      }}>
                      {flux_tag.name}
                    </Checkbox>
                  )
                })
            }
          </Box>
        </Box>
        :
        <></>
    }</>


  return menu_for_modal ?
    content :
    <TabPanel >
      {content}
    </TabPanel>
}

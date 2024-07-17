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
import {
  MenuConfigurationLinksTagsFType
} from './types/SankeyMenuConfigurationLinksTagsTypes'

// Component definition =================================================================
export const MenuConfigurationLinksTags : FunctionComponent<MenuConfigurationLinksTagsFType> = ({
  applicationData,
  applicationContext,
  menu_for_modal,
})=>{
  const { t } = applicationContext
  const { new_data } = applicationData

  // Flux tag groups
  const flux_taggs = new_data.drawing_area.sankey.flux_taggs_list
  const has_flux_taggs = flux_taggs.length > 0
  const [flux_tagg_entry_id, setFluxTaggEntryId] = useState(has_flux_taggs ? flux_taggs[0].id : '')
  const flux_tagg_entry = new_data.drawing_area.sankey.flux_taggs_dict[flux_tagg_entry_id]

  // Data tag groups
  const data_taggs = new_data.drawing_area.sankey.data_taggs_list

  // Currently selected links
  const selected_links = new_data.drawing_area.selected_links_list
  const reference_link = selected_links[0] // Used for value displaying in this menu

  // Menu updaters
  const [ , setForceUpdate ] = useBoolean()
  new_data.menu_configuration.ref_to_menu_config_link_tags_updater.current = setForceUpdate.toggle

  /**
   * Function used to reset menu UI
   */
  const setForceFullUpdate = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setForceUpdate.toggle()
  }

  // DIsplayed content in menu
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
        {t('Menu.EF')}</Box>

      {/* Groupe d'étiquettes  */}
      <Select
        variant='menuconfigpanel_option_select'
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          setFluxTaggEntryId(evt.target.value)
        }}
        value={flux_tagg_entry_id}
      >
        {flux_taggs.map(flux_tagg =>
            <option
              key={flux_tagg.id}
              value={flux_tagg.id}
            >
              {flux_tagg.name}
            </option>)}
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
                    setForceUpdate.toggle()
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
              return (
                <Checkbox
                  variant='menuconfigpanel_option_checkbox'
                  isChecked={reference_link.hasGivenTag(flux_tag)}
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
                    setForceFullUpdate()
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

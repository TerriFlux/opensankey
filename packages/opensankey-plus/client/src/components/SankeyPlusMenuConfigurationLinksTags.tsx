// External imports
import React, { useState } from 'react'
import {
  Box,
  Checkbox,
  Select,
} from '@chakra-ui/react'

// Local types
import type { Class_Tag } from '@terriflux/opensankey/src/types/Tag'
import { SankeyLinkSelectionSimple } from '@terriflux/opensankey/src/components/configmenus/MenuElementsSelection'
import { WrapperBoxSubSectionMenu } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { useModelBinding, useModelSlot } from '@terriflux/opensankey/src/hooks/useModelBinding'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

export const MenuConfigurationLinksTags = ({new_data}:{new_data: Class_ApplicationDataOSP}) => {
  const { t } = new_data
  const list_flux_taggs = new_data.drawing_area.sankey.flux_taggs_list
  const has_flux_taggs = list_flux_taggs.length > 0
  const [flux_tagg_entry_index, setFluxTaggEntryIndex] = useState(0)
  const flux_tagg_entry = list_flux_taggs[flux_tagg_entry_index]

  const data_taggs = new_data.drawing_area.sankey.data_taggs_list
  const selected_links = new_data.drawing_area.selected_links_list_sorted

  // #247 — re-render forcé d'identité stable + slot updater lié au montage (closure fraîche,
  // cleanup au démontage).
  const refreshThis = useModelBinding()
  const updateThis = () => {
    // Can just use simple refresh if flux_tagg entry exists
    if (new_data.drawing_area.sankey.flux_taggs_list[flux_tagg_entry_index])
      refreshThis()
    // If not, reset entry
    else
      setFluxTaggEntryIndex(0)
    refreshThis()

  }
  useModelSlot(new_data.menu_configuration.ref_to_menu_config_links_tags_updater, updateThis)

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
  // Return nothing if there is no tag or no links are selected
  if (!has_flux_taggs || selected_links.length==0)
    return <></>


  const content = <>
    {
      (
        selected_links.length !== 0
      ) ?
        <Box
          layerStyle='menuconfigpanel_grid'
        >
          {/* Groupe d'étiquettes  */}
          <Select
            isDisabled={!new_data.has_sankey_plus}
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
                    isDisabled={!new_data.has_sankey_plus}
                    variant='menuconfigpanel_option_select'
                    name={data_tagg.id}
                    value={data_tagg.first_selected_tags?.id ?? '-'}
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => {
                        data_tagg.selectTagsFromId(evt.target.value)
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
          {has_flux_taggs ?
            <Box
              layerStyle='menuconfigpanel_grid'
            >
              {
                flux_tagg_entry.tags_list
                  .map(flux_tag => {
                    const [allTrue, allFalse] = haveAllSelectedLinksGivenTag(flux_tag)
                    return (
                      <Checkbox
                        isDisabled={!new_data.has_sankey_plus}
                        variant='menuconfigpanel_option_checkbox'
                        isChecked={allTrue}
                        isIndeterminate={!allTrue && !allFalse}
                        onChange={(evt) => {
                          const visible = evt.target.checked
                          new_data.drawing_area.updateSelectedLinksTagAssignation(visible, flux_tag)
                        }}>
                        {flux_tag.name}
                      </Checkbox>
                    )
                  })
              }
            </Box> : <></>}
        </Box>
        :
        <></>
    }</>


  return <WrapperBoxSubSectionMenu new_data={new_data} title={t('Menu.flow_associated_tag')}>
    <OSTooltip label={new_data.has_sankey_plus ? '' : t('Menu.sankeyOSPDisabled')}>
      <>
        <SankeyLinkSelectionSimple app_data={new_data} />
        {content}
      </>
    </OSTooltip>

  </WrapperBoxSubSectionMenu>
}

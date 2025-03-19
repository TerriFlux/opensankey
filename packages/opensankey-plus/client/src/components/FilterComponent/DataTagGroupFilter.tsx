import { Select, Box, Switch } from '@chakra-ui/react'
import React, { FunctionComponent, useState } from 'react'
import { FCType_DataTagGroupFilter } from './type'
import { FilterWrapperBox, title_filter_column } from './TagsFilterComponent'
import { OSMultiSelect, typeElementSelectable } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'

/**
 * Function that return a simple or multiple dropdown of groupTag of data and links
 * This allow us to choose wich grouptag to select and wich tag of these group to display *
 * @param {*} {
 *   new_data
 * }
 * @return {*} 
 */
export const DataTagGroupFilter: FunctionComponent<FCType_DataTagGroupFilter> = ({
  new_data
}) => {
  // Data -------------------------------------------------------------------------------
  const data_taggs = new_data.drawing_area.sankey.data_taggs_dict
  const data_taggs_with_banner = Object.values(data_taggs)
    .filter(tagg => { return (tagg.banner == 'one' || tagg.banner == 'multi') })
  let show_legend_for_data_taggs = (data_taggs_with_banner.length > 0) // False if no data taggs
  data_taggs_with_banner
    .forEach(tagg => show_legend_for_data_taggs = show_legend_for_data_taggs && tagg.show_legend)

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_datatag_filter_updater.current = () => setCount(a => a + 1)

  // JSX Components --------------------------------------------------------------------
  const SelectorOfTagsByGroup = data_taggs_with_banner
    .map(tagg => {
      let selector = <></>
      if (tagg.banner == 'one') {
        const selected_tag_id = tagg.selected_tags_list[0]?.id ?? ''
        selector = <Select
          key={tagg.id}
          value={selected_tag_id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            tagg.selectTagsFromId(evt.target.value)
            new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
          }}
        >
          {tagg.tags_list
            .map(tag => {
              return (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              )
            })}
        </Select>
      }
      else {
        const selected_options = tagg.selected_tags_list
          .map((tag) => { return { 'label': tag.name, 'value': tag.id } })
        const options = tagg.tags_list
          .map((tag) => {
            return {
              'label': tag.name,
              'value': tag.id,
              'disabled': (
                (selected_options.length < 2) &&
                (tag.id == selected_options[0].value)
              ),
              selected:tag.is_selected
            }
          })

        selector = <OSMultiSelect
          t={new_data.t}
          elements={options}
          onClick={(entries: typeElementSelectable) => {
            // Set correct tags as selected
            tagg.selectTagsFromIds(entries.map(_ => _.value))
            // TODO not optimal. Target Source nodes of redrawn link must be redrawn
            new_data.drawing_area.sankey.visible_nodes_list.forEach(n => n.draw())
            // Update related components (includes this)
            new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
          }}
        />
      }
  
      return (
        <Box
          layerStyle='menuconfigpanel_grid'
        >
          <Box
            as='span'
            layerStyle='menuconfigpanel_option_name'
          >
            {tagg.name}
          </Box>
          <Box
            layerStyle={'filter_grid_row'}
          >
            {selector}
            <Switch
              justifySelf='end'
              alignSelf='center'
              height='1rem'
              isChecked={tagg.show_legend}
              onChange={evt => {
                // Met à jour l'indicateur de legende pour tous les tags
                Object.values(data_taggs_with_banner)
                  .forEach(tagg => tagg.show_legend = false)
                tagg.show_legend = evt.target.checked
                new_data.drawing_area.legend.draw()
                new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
              }} />
          </Box>
        </Box>)
    })

  return data_taggs_with_banner.length > 0 ? <FilterWrapperBox
    new_data={new_data}
    title={new_data.t('Banner.sdd')}>
    {title_filter_column(new_data)}
    {SelectorOfTagsByGroup}
  </FilterWrapperBox> : <></>

}

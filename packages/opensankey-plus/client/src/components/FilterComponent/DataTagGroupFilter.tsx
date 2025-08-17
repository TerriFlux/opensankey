import { Select, Box, Switch } from '@chakra-ui/react'
import React, { FC, useState } from 'react'
import { FilterWrapperBox } from './TagsFilterComponent'
import { OSMultiSelect, typeElementSelectable } from '../../deps/OpenSankey/components/configmenus/MenuCommon'
import { BaseComponentProps } from '../ComponentTypes'

/**
 * Function that return a simple or multiple dropdown of groupTag of data and links
 * This allow us to choose wich grouptag to select and wich tag of these group to display *
 * @param {*} {
 *   new_data
 * }
 * @return {*} 
 */
export const DataTagGroupFilter: FC<BaseComponentProps> = ({
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
              selected: tag.is_selected
            }
          })

        selector = <OSMultiSelect
          t={new_data.t}
          elements={options}
          onClick={(entries: typeElementSelectable) => {
            // Set correct tags as selected
            tagg.selectTagsFromIds(entries.map(_ => _.value))
            new_data.drawing_area.sankey.links_list.forEach(l => {
              if (l.is_multi_link) {
                return
              }
              if (entries.length == 1) {
                Object.keys(l.child_links).forEach(key => {
                   l.child_links[key].delete()
                  delete l.child_links[key]
                })
              } else {
                tagg.tags_list.forEach(tag => {
                  if (!tag.is_selected) {
                    if (tag.id in l.child_links) {
                      l.child_links[tag.id].delete()
                      delete l.child_links[tag.id]
                    }
                  }
                })
                tagg.selected_tags_list.forEach(tag => {
                  if (tag.id in l.child_links || l.is_multi_link) {
                    return
                  }
                  const child_link = new_data.drawing_area.sankey.addNewLink(l.source, l.target)
                  child_link.copyFrom(l)
                  l.addChildLink(child_link, tag)
                })
              }
            })
            new_data.drawing_area.draw()
            new_data.drawing_area.sankey.visible_nodes_list.forEach(n=>n.reorganizeIOLinks())
            new_data.drawing_area.orderElementOnDA()
            new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
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
              isChecked={tagg.banner == 'multi'}
              onChange={evt => {
                // Met à jour l'indicateur de legende pour tous les tags
                tagg.banner = evt.target.checked ? 'multi' : 'one'
                if (tagg.banner == 'one') {
                  new_data.drawing_area.sankey.remove_child_links()
                }
                tagg.selectTagsFromId(tagg.tags_list[0].id)
                new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
              }} />
          </Box>
        </Box>)
    })

  return data_taggs_with_banner.length > 0 ? <FilterWrapperBox
    new_data={new_data}
    title={new_data.t('Banner.sdd')}>
    <Box
      as='span'
      layerStyle='popover_sidebar_row_tag_filter'
    >
      <Box textStyle='h2'></Box>
      <Box textStyle='h2'>{new_data.t('Menu.type_selection')}</Box>
    </Box>
    {SelectorOfTagsByGroup}
  </FilterWrapperBox> : <></>

}

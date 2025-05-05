import { Select } from '@chakra-ui/react'
import React, { FunctionComponent, useState } from 'react'
import { FCType_ToolBarTagFilter, FType_AddSimpleLevelDropDown } from '../../ftypes/SankeyPlusUtilsTypes'
import { NodeTagGroupFilter } from './NodeTagGroupFilter'
import { FilterWrapperBox } from './TagsFilterComponent'

/**
 * Component return either simple levelTag filter (when there is only primary level group) or a selector for each level group
 *
 * @param {*} { new_data_plus }
 * @return {*} 
 */
export const LevelTagFilter: FunctionComponent<FCType_ToolBarTagFilter> = ({ new_data_plus }) => {
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_leveltag_filter_updater.current = () => setCount(a => a + 1)

  const level_filter = Object.entries(new_data_plus.drawing_area.sankey.level_taggs_dict).length > 0
  const only_primary = new_data_plus.drawing_area.sankey.level_taggs_list.length == 1 && new_data_plus.drawing_area.sankey.level_taggs_list[0].name == 'Primaire'
  const mutli_level = new_data_plus.drawing_area.sankey.level_taggs_list.length > 0
  let content_popover = <></>

  if (only_primary) { // Only have primary level group tag
    content_popover = <SimpleLevelTagFilter
      new_data={new_data_plus} />
  } else if (mutli_level) { // has other level group tag than 'Primaire'
    content_popover = <NodeTagGroupFilter
      new_data={new_data_plus}
      level={true} />
  }

  return level_filter ? content_popover : <></>

}

/**
 * Drop down to select primary level tag
 * @param {*} {
 *   new_data,
 * }
 * @return {*}
 */

export const SimpleLevelTagFilter: FunctionComponent<FType_AddSimpleLevelDropDown> = (
  {
    new_data
  }
) => {
  // Data -------------------------------------------------------------------------------
  const level_taggs = new_data.drawing_area.sankey.level_taggs_dict
  const { t } = new_data
  // Component updater ------------------------------------------------------------------
  const [update, setUpdate] = useState(true)

  // JSX Component ----------------------------------------------------------------------
  if (Object.keys(level_taggs).includes('Primaire')) {
    const primary_level_tags = level_taggs['Primaire'].tags_list

    if (primary_level_tags.length < 2) {
      return <></>
    }
    else {
      return <FilterWrapperBox
        new_data={new_data}
        title={t('Banner.ndd')}>
        <Select
          key={level_taggs['Primaire'].id}
          value={level_taggs['Primaire'].selected_tags_list[0]?.id ?? ''}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            new_data.drawing_area.bypass_redraws = true
            level_taggs['Primaire'].selectTagsFromId(evt.target.value)
            new_data.menu_configuration.updateAllComponentsRelatedToLevelTags()
            setUpdate(!update)
            // recall node.draw because selectTagsFromId doesn't lead to applyPositionOnLinks wich compute endpoints
            // (it isn't done for link not directly displayed after fromJSON)
            new_data.drawing_area.draw()
            new_data.drawing_area.areaAutoFit(false)
          }}
        >
          {level_taggs['Primaire'].tags_list
            .map(tag => {
              return (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.name}
                </option>)
            })}
        </Select>
      </FilterWrapperBox>
    }
  }
  else {
    return <></>
  }
}

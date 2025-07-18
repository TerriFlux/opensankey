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


import { Switch, Checkbox, Select, Box } from '@chakra-ui/react'
import React, { FunctionComponent, useState } from 'react'
import { Class_TagGroup, Class_LevelTagGroup, Class_Tag, Class_NodeTagGroup } from '../../deps/OpenSankey/types/Tag'
import { CustomFaEyeCheckIcon, OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { FilterWrapperBox, title_filter_column } from './TagsFilterComponent'
import { FCType_NodeTagGroupFilter } from './type'
import { OSMultiSelect, typeElementSelectable } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'

/**
 *
 * Drop down to select node tags, component also used for level tags (when level == true)
 *
 * @param {*} {
 *   new_data
 *   level
 *  }
 * @return {*}
 */

export const NodeTagGroupFilter: FunctionComponent<FCType_NodeTagGroupFilter> = (
  {
    new_data, level
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { t } = new_data

  // Tag group dicts
  const node_taggs = new_data.drawing_area.sankey.node_taggs_dict
  const level_taggs = new_data.drawing_area.sankey.level_taggs_dict

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)

  let taggs_in_banner: Class_TagGroup[] | Class_LevelTagGroup[]
  if (level) {
    const nb_of_level_taggs = Object.values(level_taggs).filter(tagg => tagg.has_tags).length
    if (nb_of_level_taggs > 1) {
      taggs_in_banner = Object.values(level_taggs)
        .filter(tagg => tagg.has_tags)
    }
    else {
      taggs_in_banner = Object.values(level_taggs)
        .filter(tagg => tagg.has_tags)
    }
  }
  else {
    new_data.menu_configuration.ref_to_nodetag_filter_updater.current = () => setCount(a => a + 1)

    taggs_in_banner = Object.values(node_taggs)
      .filter(tagg => tagg.banner !== 'none')
  }

  // Undoable functions ===================================================
  /**
   * Apply color palette of 'tagg' to nodes, show group palette in legend if visible & save it's undo
   *
   * @param {Class_TagGroup} tagg
   * @param {boolean} _
   */
  const setApplyNodeTagGroupPalette = (tagg: Class_TagGroup, _: boolean) => {
    const dict_old_val = Object.fromEntries(Object.values(node_taggs).map(tagg => [tagg.id, tagg.show_legend]))

    const _setApplyNodeTagGroupPalette = () => {
      // Reset values
      Object.values(node_taggs).forEach(tagg => tagg.show_legend = false)
      // Update this tagg group value
      if (_) {
        tagg.show_legend = true
      }
      new_data.drawing_area.legend.draw()
      // Refresh this & related component
      new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
    }

    const inv_setApplyNodeTagGroupPalette = () => {
      Object.values(node_taggs).forEach(tagg => tagg.show_legend = dict_old_val[tagg.id])
      new_data.drawing_area.legend.draw()
      // Refresh this & related component
      new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_setApplyNodeTagGroupPalette)
    new_data.history.saveRedo(_setApplyNodeTagGroupPalette)
    // Execute original attr mutation
    _setApplyNodeTagGroupPalette()
  }


  // JSX Components --------------------------------------------------------------------
  const SelectorOfTagsByGroup = taggs_in_banner.map(tagg => {
    // Create a btn that can either be a switch to activate tag color palette
    // or in some case for level tag activating or deactivating antagonists tags
    let btn_switch = <></>
    if (!level) {
      const casted_tag=tagg as Class_NodeTagGroup
      btn_switch = <Switch
        justifySelf='end'
        alignSelf='center'
        height='1rem'
        isChecked={casted_tag.show_legend}
        onChange={evt => setApplyNodeTagGroupPalette(casted_tag, evt.target.checked)} />
    }
    else if ((level) &&
      (tagg instanceof Class_LevelTagGroup) &&
      (tagg.has_tags)) {
      // Cast type to exclude Class_TagGroup
      const level_tagg = tagg as Class_LevelTagGroup
      // Create swith button
      btn_switch = (
        (level_tagg.siblings !== undefined) &&
        (level_tagg.siblings.length > 0)
      ) ?
        <Checkbox
          justifySelf='end'
          alignSelf='center'
          variant='activate_antagonist_checkbox'
          isChecked={level_tagg.activated}
          icon={<CustomFaEyeCheckIcon />}
          onChange={evt => {
            level_tagg.activated = evt.target.checked
            new_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
            new_data.drawing_area.draw()
            // Refresh this & related component
            new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
          }} /> :
        <></>
    }

    // Create the tag selector
    // It can either select one tag at the time or multiple at the time
    let selector = <></>
    if (tagg.banner == 'one') {
      selector = <Select
        key={tagg.name}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // Set tag with given id as selected : other are unselected
          new_data.drawing_area.bypass_redraws = true
          tagg.selectTagsFromId(evt.target.value)
          new_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
          new_data.drawing_area.draw()
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      >
        {tagg.tags_list
          .map(tag => {
            return (
              <option
                key={tag.id}
                value={tag.id}
              >
                {tag.name}
              </option>
            )
          })}
      </Select>
    }
    else if ((tagg.banner === 'level') &&
      tagg.has_tags) {
      if (Object.keys(tagg.tags_dict).length < 1) {
        return <></>
      }
      selector = <Select
        key={tagg.name}
        value={tagg.selected_tags_list[0]?.id ?? ''}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          // Set tag with given id as selected : other are unselected
          tagg.selectTagsFromId(evt.target.value)
          new_data.drawing_area.sankey.nodes_list.forEach(n => n.dimensionsUpdated())
          new_data.drawing_area.sankey.nodes_list.forEach(n => n.draw())
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      >
        {tagg.tags_list
          .map(tag => {
            return (
              <option
                key={tag.id}
                value={tag.id}
              >
                {tag.name}
              </option>
            )
          })}
      </Select>
    }
    else if (tagg.banner === 'multi') {
      const tags_options = (tagg.tags_list as Class_Tag[])
        .map(tag => { return { 'label': tag.name, 'value': tag.id,selected:tag.is_selected } })

      // selector = <MultiSelect
      //   valueRenderer={(curr_selected_tags_options: Type_MenuSelectionEntry[]) => {
      //     return curr_selected_tags_options.length ?
      //       curr_selected_tags_options.map(({ label }) => label + ', ') :
      //       'Aucun tag sélectionné';
      //   }}
      //   labelledBy={'dropdown_node_filter'}
      //   overrideStrings={{
      //     'selectAll': 'Tout sélectionner',
      //   }}
      //   value={selected_tags_options}
      //   options={tags_options}
      //   onChange={(curr_selected_tags_options: [{ label: string; value: string; }]) => {
      //     // Set tags with given id as selected : other are unselected
      //     //new_data.drawing_area.bypass_redraws = true
      //     tagg.selectTagsFromIds(curr_selected_tags_options.map(_ => _.value));
      //     // TODO For now the draw below is necessary (interdependance of finger print of nodes and links not solved)
      //     new_data.drawing_area.draw();
      //     // Refresh this & related component
      //     new_data.menu_configuration.updateAllComponentsRelatedToNodeTags();
      //   }} />;

      selector=<OSMultiSelect
        t={new_data.t}
        elements={tags_options}
        // selected_elements={selected_tags_options}
        onClick={(entries: typeElementSelectable) => {
          // Set tags with given id as selected : other are unselected
          tagg.selectTagsFromIds(entries.map(_ => _.value))
          // TODO For now the draw below is necessary (interdependance of finger print of nodes and links not solved)
          new_data.drawing_area.draw()
          // Refresh this & related component
          new_data.menu_configuration.updateAllComponentsRelatedToNodeTags()
        }}
      />     
    }
    

    return (
      <Box layerStyle='menuconfig_grid'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {tagg.name}
        </Box>
        <Box layerStyle='filter_grid_row'>
          <OSTooltip label={t('Banner.ndd_lst')}>
            {selector}
          </OSTooltip>
          <OSTooltip label={t('Banner.ndd_chk')}>
            <Box
              justifySelf='end'
            >
              {btn_switch}
            </Box>
          </OSTooltip>
        </Box>
      </Box>
    )
  })
  const title = level ? 'ndd' : 'fdn'

  // If there is tags show filter
  return SelectorOfTagsByGroup.length > 0 ? (<FilterWrapperBox
    new_data={new_data}
    title={t('Banner.' + title)}>
    {level?'':title_filter_column(new_data)}
    {SelectorOfTagsByGroup}
  </FilterWrapperBox>) : <></>
}

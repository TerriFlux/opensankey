import { Select, Box, Switch } from '@chakra-ui/react'
import React, { FunctionComponent, useState } from 'react'
import { Class_FluxTagGroup } from '../../deps/OpenSankey/types/Tag'
import { OSTooltip } from '../../deps/OpenSankey/types/Utils'
import { FCType_FlowTagGroupFilterFType } from './type'
import { FilterWrapperBox, title_filter_column } from './TagsFilterComponent'
import { OSMultiSelect, typeElementSelectable } from '../../deps/OpenSankey/components/configmenus/SankeyMenuComponents'

/**
 * Function that generate dropdown for each groupTag of linkTags
 * @param {*} new_data
 * @return {*}
 */

export const FlowTagGroupFilter: FunctionComponent<FCType_FlowTagGroupFilterFType> = (
  {
    new_data
  }
) => {
  // Data -------------------------------------------------------------------------------
  const { t } = new_data
  // Tag group dicts
  const flux_taggs_dict = new_data.drawing_area.sankey.flux_taggs_dict
  const flux_taggs_with_banner = Object.values(flux_taggs_dict)
    .filter(flux_tagg => {
      return ((flux_tagg.banner === 'one') || (flux_tagg.banner === 'multi'))
    })

  // Component updater ------------------------------------------------------------------
  const [, setCount] = useState(0)
  new_data.menu_configuration.ref_to_fluxtag_filter_updater.current = () => setCount(a => a + 1)

  /**
   * Apply color palette of 'tagg' to flows, show group palette in legend if visible & save it's undo
   *
   * @param {Class_FluxTagGroup} tagg
   * @param {boolean} _
   */
  const setApplyFlowTagGroupPalette = (tagg: Class_FluxTagGroup, _: boolean) => {
    const dict_old_val = Object.fromEntries(Object.values(flux_taggs_dict).map(tagg => [tagg.id, tagg.show_legend]))

    const _setApplyFlowTagGroupPalette = () => {
      // Reset values
      Object.values(flux_taggs_dict).forEach(tagg => tagg.show_legend = false)
      // Update this tagg group value
      if (_) {
        tagg.show_legend = true
      }
      new_data.drawing_area.legend.draw()
      // Refresh this & related component
      new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
    }

    const inv_setApplyFlowTagGroupPalette = () => {
      Object.values(flux_taggs_dict).forEach(tagg => tagg.show_legend = dict_old_val[tagg.id])
      new_data.drawing_area.legend.draw()
      // Refresh this & related component
      new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
    }

    // Save undo/redo in data history
    new_data.history.saveUndo(inv_setApplyFlowTagGroupPalette)
    new_data.history.saveRedo(_setApplyFlowTagGroupPalette)
    // Execute original attr mutation
    _setApplyFlowTagGroupPalette()
  }


  // JSX Components --------------------------------------------------------------------
  // Create drop down
  const SelectorOfTagsByGroup = flux_taggs_with_banner
    .map(flux_tagg => {
      // Create the tag selector
      // It can either select one tag at the time or multiple at the time
      let selector = <></>
      if (flux_tagg.banner == 'one') {
        selector = <Select
          key={flux_tagg.name}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            // Set correct tag as selected
            flux_tagg.selectTagsFromId(evt.target.value)
            // Update related components (includes this)
            new_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
          }}
        >
          {flux_tagg.tags_list.map(tag => {
            return (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            )
          })}
        </Select>
      }
      else {
        const options = flux_tagg.tags_list
          .map(tag => { return { 'label': tag.name, 'value': tag.id,selected:tag.is_selected } })

        selector = <OSMultiSelect
          t={new_data.t}
          elements={options}
          onClick={(entries: typeElementSelectable) => {
            // Set correct tags as selected
            flux_tagg.selectTagsFromIds(entries.map(_ => _.value))
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
            layerStyle='menuconfigpanel_option_name'
          >
            {flux_tagg.name}
          </Box>
          <Box
            layerStyle='filter_grid_row'
          >
            <OSTooltip label={t('Banner.ndd_lst')}>
              {selector}
            </OSTooltip>
            <OSTooltip label={t('Banner.ndd_chk')}>
              <Box
                justifySelf='end'
                alignSelf='center'
                height='1rem'
              >
                <Switch
                  isChecked={flux_tagg.show_legend}
                  onChange={evt => {
                    setApplyFlowTagGroupPalette(flux_tagg, evt.target.checked)
                  }} />
              </Box>
            </OSTooltip>
          </Box>
        </Box>)
    })

  // Output -----------------------------------------------------------------------------
  // If there is tags show filter
  return (SelectorOfTagsByGroup.length > 0 ? <FilterWrapperBox
    new_data={new_data}
    title={t('Banner.fdf')}>
    {title_filter_column(new_data)}
    {SelectorOfTagsByGroup}
  </FilterWrapperBox> : <></>)
}

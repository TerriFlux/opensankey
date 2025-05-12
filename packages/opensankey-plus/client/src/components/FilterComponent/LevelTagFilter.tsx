import React, { FunctionComponent, useState } from 'react'
import { FCType_ToolBarTagFilter } from '../../ftypes/SankeyPlusUtilsTypes'
import { NodeTagGroupFilter } from './NodeTagGroupFilter'

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
  let content_popover = <></>
  content_popover = <NodeTagGroupFilter
    new_data={new_data_plus}
    level={true} />

  return level_filter ? content_popover : <></>

}


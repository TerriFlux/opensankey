import React, { useState } from 'react'
import { SankeyMenuConfigurationNodesTooltipFType } from './types/SankeyMenuConfigurationNodesTooltipTypes'
import { Box, Tab, TabPanel, Textarea } from '@chakra-ui/react'
import { OSTooltip } from './SankeyUtils'

export const SankeyMenuConfigurationNodesTooltip : SankeyMenuConfigurationNodesTooltipFType = (
  applicationContext,
  dict_variable_elements_selected,
  menu_for_modal
) => {
  const { t } = applicationContext
  const { multi_selected_nodes } = dict_variable_elements_selected
  const [ forceUpdate, setForceUpdate ]=useState(false)
  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.IB')}
    </Box>

    <OSTooltip label={t('Noeud.tooltips.IB')}>
      <Textarea
        rows={10}
        value={
          multi_selected_nodes.current.length>0 && multi_selected_nodes.current[0].tooltip_text ?
            multi_selected_nodes.current[0].tooltip_text :
            ''
        }
        onChange={
          (evt) => {
            multi_selected_nodes.current.map(node => node.tooltip_text = evt.target.value)
            setForceUpdate(!forceUpdate)
          }}
      />
    </OSTooltip>
  </Box>

  return menu_for_modal?
    [
      content
    ]:[
      <Tab>
        <Box
          layerStyle='submenuconfig_tab'
        >
          {t('Noeud.tabs.infos')}
        </Box>
      </Tab>,
      <TabPanel>
        {content}
      </TabPanel>
    ]
}
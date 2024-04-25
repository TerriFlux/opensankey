import React from 'react'
import { Tooltip } from '@chakra-ui/react'
import { SankeyData, SankeyLink } from '../types/Types'
import { TFunction } from 'i18next'
import { MenuConfigurationLinksTooltipFType } from './types/SankeyMenuConfigurationLinksTooltipTypes'
import { Box, Tab, TabPanel, Textarea } from '@chakra-ui/react'

export const MenuConfigurationLinksTooltip : MenuConfigurationLinksTooltipFType = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  menu_for_modal:boolean
)=>{

  const content=    <>
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      {t('Noeud.IB')}
    </Box>   
    <Tooltip
      key={'Flux.tooltips.IB'}
      placement={'top'}
      openDelay={500}
      label={t('Flux.tooltips.IB')}>
      <Textarea
        rows={10}
        value={multi_selected_links.current.length>0 && multi_selected_links.current[0].tooltip_text ? multi_selected_links.current[0].tooltip_text : ''}
        onChange={evt => {
          multi_selected_links.current.forEach(l=>l.tooltip_text = evt.target.value)
        }}/>
    </Tooltip>
  </>

  return menu_for_modal?[content]:
    [ 
      <Tab>
        <Box
          layerStyle='submenuconfig_tab'
        >
          {t('Flux.IS')}
        </Box>
      </Tab>,
      <TabPanel >
        {content}
      </TabPanel>]

}
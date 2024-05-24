// Standard libs
import { TFunction } from 'i18next'
import React from 'react'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box
} from '@chakra-ui/react'

// Local libs
import {OSPShortcutFType} from '../types/SankeyPlusItemShortcutTypes'

export const OSPShortcut : OSPShortcutFType =(t:TFunction)=>{
  return (<Accordion>
    <AccordionItem
      // eventKey='OSP'
    >
      <AccordionButton>
        <Box
          as='span'
          layerStyle='menuconfig_entry'
        >
          {t('Menu.rcc_titre_OSP')}
        </Box>
        <AccordionIcon/>
      </AccordionButton>
      <AccordionPanel>
        <p><b>{t('Menu.rcc_osp_cs_bold')}</b>{t('Menu.rcc_osp_cs')}</p>
        <p><b>{t('Menu.rcc_osp_ctrl_czdt_bold')}</b>{t('Menu.rcc_osp_ctrl_czdt')}</p>
        <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
        <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
        <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>
      </AccordionPanel>
    </AccordionItem>
  </Accordion>
  )
}
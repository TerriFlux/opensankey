
import { TFunction } from 'i18next'
import React from 'react'
import { Accordion } from 'react-bootstrap'
import {SankeyPlusShortcutFType} from '../types/SankeyPlusItemShortcutTypes'

export const SankeyPlusShortcut : SankeyPlusShortcutFType =(t:TFunction)=>{
  return (<Accordion>
    <Accordion.Item eventKey='OSP'>
      <Accordion.Header>
        <h2>{t('Menu.rcc_titre_OSP')} :</h2>

      </Accordion.Header>
      <Accordion.Body>
        <p><b>{t('Menu.rcc_osp_cs_bold')}</b>{t('Menu.rcc_osp_cs')}</p>
        <p><b>{t('Menu.rcc_osp_ctrl_czdt_bold')}</b>{t('Menu.rcc_osp_ctrl_czdt')}</p>
        <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
        <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
        <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>
      </Accordion.Body>
    </Accordion.Item>
  </Accordion>
  )
}
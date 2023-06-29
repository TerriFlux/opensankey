
import { TFunction } from 'i18next'
import React from 'react'

export const SankeyPlusShortcut=(t:TFunction)=>{
  return (<React.Fragment>
    <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_OSP')} :</h4>
    <p><b>{t('Menu.rcc_osp_cs_bold')}</b>{t('Menu.rcc_osp_cs')}</p>
    <p><b>{t('Menu.rcc_osp_ctrl_czdt_bold')}</b>{t('Menu.rcc_osp_ctrl_czdt')}</p>
    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>
  </React.Fragment>
  )
}
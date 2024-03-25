// Standard lib
import React, {
  useState
} from 'react'
import {
  FormCheck,
  Modal,
  Pagination,
} from 'react-bootstrap'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box
} from '@chakra-ui/react'


import { windowSankey } from '../configmenus/SankeyUtils'
import { SankeyModalWelcomeFType } from '../topmenus/types/SankeyMenuTopTypes'

export const SankeyModalWelcome : SankeyModalWelcomeFType = (
  t,
  active_page,
  set_active_page,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  additional_shortcut_item,
  external_pagination,
  external_content,
  exemple_menu: object
)=>{
  const [show_wecome,set_show_welcome]=useState(!never_see_again.current)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current=set_show_welcome

  const content_rc_static=<>
    <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_princ')}</h4>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>

  </>

  const content_rc_not_static=<Accordion
    // className='accordion_new_welcome'
    // defaultActiveKey={'OS'}
    allowToggle
  >
    <AccordionItem
      // eventKey='OS'
    >
      <AccordionButton>
        <Box
          as='span'
          layerStyle='menuconfig_entry'
        >
          {t('Menu.rcc_titre_princ')}
        </Box>
        <AccordionIcon/>
      </AccordionButton>
      <AccordionPanel>
        <h5>{t('Menu.rcc_titre_select')}:</h5>
        <p><b>{t('Menu.rcc_cn_bold')}</b>{t('Menu.rcc_cn')}</p>
        <p><b>{t('Menu.rcc_ctrl_cn_bold')}</b>{t('Menu.rcc_ctrl_cn')}</p>
        <p><b>{t('Menu.rcc_cf_bold')}</b>{t('Menu.rcc_cf')}</p>
        <p><b>{t('Menu.rcc_ctrl_cf_bold')}</b>{t('Menu.rcc_ctrl_cf')}</p>
        <p><b>{t('Menu.rcc_cs_bold')}</b>{t('Menu.rcc_cs')}</p>
        <p><b>{t('Menu.rcc_click_and_drag_bold')}</b>{t('Menu.rcc_click_and_drag')}</p>
        <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
        <p><b>{t('Menu.rcc_ad_bold')}</b>{t('Menu.rcc_ad')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <h5>{t('Menu.rcc_titre_edi')} :</h5>

        <p><b>{t('Menu.rcc_e_cn_bold')}</b>{t('Menu.rcc_e_cn')}</p>
        <p><b>{t('Menu.rcc_e_ds_bold')}</b>{t('Menu.rcc_e_ds')}</p>
        <p><b>{t('Menu.rcc_e_dn_bold')}</b>{t('Menu.rcc_e_dn')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <h5>{t('Menu.rcc_titre_autre')} :</h5>

        <p><b>{t('Menu.rcc_a_s_bold')}</b>{t('Menu.rcc_a_s')}</p>
        <p><b>{t('Menu.rcc_a_fc_bold')}</b>{t('Menu.rcc_a_fc')}</p>
        <p><b>{t('Menu.rcc_a_dbm_bold')}</b>{t('Menu.rcc_a_dbm')}</p>
        <p><b>{t('Menu.rcc_a_ech_bold')}</b>{t('Menu.rcc_a_ech')}</p>
        <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>
        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      </AccordionPanel>
    </AccordionItem>


    {additional_shortcut_item}
  </Accordion>
  external_content['rc'] = windowSankey.SankeyToolsStatic?content_rc_static:content_rc_not_static

  return <Modal scrollable size='xl' show={show_wecome && !never_see_again.current} onHide={()=>{
    set_show_welcome(false)
  }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('welcome.'+active_page)}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {external_content[active_page as 'read_me' | 'intro' | 'rc' | 'licence' | 'news']}
    </Modal.Body>

    <Modal.Footer style={{justifyContent:'center'}}>
      <Pagination >
        {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}

        <Pagination.Item active={active_page==='rc'} key={'rc'} onClick={()=>{
          set_active_page('rc')
        }}>
          {t('welcome.rc')}
        </Pagination.Item>

      </Pagination>
      <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again.current} onChange={evt=>{
        never_see_again.current = evt.target.checked
        localStorage.setItem('dontSeeAggainWelcome','1')
        set_show_welcome(false)
      }}/>
    </Modal.Footer>
  </Modal>
}



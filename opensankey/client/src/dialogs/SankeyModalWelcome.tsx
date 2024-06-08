// Standard lib
import React, {
  FunctionComponent,
  useState
} from 'react'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Heading,
  ModalFooter,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  Checkbox,
  Breadcrumb,
  BreadcrumbItem
} from '@chakra-ui/react'

import { windowSankey } from '../configmenus/SankeyUtils'
import { SankeyModalWelcomeFType } from '../topmenus/types/SankeyMenuTopTypes'

export const SankeyModalWelcome : FunctionComponent<SankeyModalWelcomeFType> = ({
  t,
  active_page,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  additional_shortcut_item,
  external_pagination,
  external_content
})=>{
  const [show_wecome,set_show_welcome]=useState(!never_see_again.current)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current=set_show_welcome

  const content_rc_static=<>
    <Heading variant='heading_welcome_style' >{t('Menu.rcc_titre_princ')}</Heading>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>

  </>

  const content_rc_not_static=<Accordion
    // className='accordion_new_welcome'
    defaultIndex={0}
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
        <Heading variant='heading_welcome_style'>{t('Menu.rcc_titre_select')}:</Heading>
        <p><b>{t('Menu.rcc_cn_bold')}</b>{t('Menu.rcc_cn')}</p>
        <p><b>{t('Menu.rcc_ctrl_cn_bold')}</b>{t('Menu.rcc_ctrl_cn')}</p>
        <p><b>{t('Menu.rcc_cf_bold')}</b>{t('Menu.rcc_cf')}</p>
        <p><b>{t('Menu.rcc_ctrl_cf_bold')}</b>{t('Menu.rcc_ctrl_cf')}</p>
        <p><b>{t('Menu.rcc_cs_bold')}</b>{t('Menu.rcc_cs')}</p>
        <p><b>{t('Menu.rcc_click_and_drag_bold')}</b>{t('Menu.rcc_click_and_drag')}</p>
        <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
        <p><b>{t('Menu.rcc_ad_bold')}</b>{t('Menu.rcc_ad')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <Heading variant='heading_welcome_style'>{t('Menu.rcc_titre_edi')} :</Heading>

        <p><b>{t('Menu.rcc_e_cn_bold')}</b>{t('Menu.rcc_e_cn')}</p>
        <p><b>{t('Menu.rcc_e_ds_bold')}</b>{t('Menu.rcc_e_ds')}</p>
        <p><b>{t('Menu.rcc_e_dn_bold')}</b>{t('Menu.rcc_e_dn')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <Heading variant='heading_welcome_style'>{t('Menu.rcc_titre_autre')} :</Heading>

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
  
  const content=<Modal variant='modal_welcome' isOpen={show_wecome && !never_see_again.current} onClose={()=>set_show_welcome(false)}>
    <ModalContent>
      <ModalHeader>
        <Box  className='title_menu'>
          {t('welcome.'+active_page)}
        </Box>
      </ModalHeader>
      <ModalCloseButton/>
      <ModalBody>
        {external_content[active_page as 'read_me' | 'intro' | 'rc' | 'licence' | 'news']}
      </ModalBody>
      <ModalFooter style={{justifyContent:'center'}}>

        <Breadcrumb variant={'pagination_welecome'} separator='-' >
          {Object.entries(external_pagination).map((k)=>{return <BreadcrumbItem isCurrentPage={active_page===k[0]}  key={k[0]}>{k[1]}</BreadcrumbItem>})}
        </Breadcrumb>

        <Checkbox style={{width:'15%',position:'absolute',right:0}} isChecked={never_see_again.current} onChange={evt=>{
          never_see_again.current = evt.target.checked
          localStorage.setItem('dontSeeAggainWelcome','1')
          set_show_welcome(false)
        }}>{t('dontSeeAgain')}</Checkbox>
      </ModalFooter>
    </ModalContent>
  </Modal>

  return content
}

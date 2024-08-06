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
  ModalCloseButton,
  Checkbox,
  Breadcrumb,
  BreadcrumbItem,
  Text,
} from '@chakra-ui/react'

import { windowSankey } from '../configmenus/SankeyUtils'
import { SankeyModalWelcomeFType } from '../topmenus/types/SankeyMenuTopTypes'

export const SankeyModalWelcome : FunctionComponent<SankeyModalWelcomeFType> = ({
  applicationData,
  t,
  active_page,
  never_see_again,
  additional_shortcut_item,
  external_pagination,
  external_content
})=>{
  const [show_wecome,set_show_welcome]=useState(!never_see_again.current)
  applicationData.new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current=set_show_welcome

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

  const content=<Modal
    variant='modal_welcome'
    isOpen={show_wecome && !never_see_again.current}
    onClose={()=>set_show_welcome(false)}
  >
    <ModalContent
      maxWidth='inherit'
    >
      <ModalCloseButton/>
      <ModalBody
        display='grid'
        gridTemplateColumns='minmax(10rem, 10%) auto'
        gridGap='0.25rem'
      >
        <Breadcrumb
          variant={'pagination_welcome'}
          separator={''}
          listProps={{
            'display': 'grid',
            'gridAutoFlow': 'rows',
            'gridRowGap': '1rem',
            'gridTemplateRows': 'repeat(auto, 1fr)',
            'alignItems': 'center',
            'padding': '0.25rem'
          }}
        >
          {
            Object.entries(external_pagination)
              .map((k)=>{
                return <BreadcrumbItem
                  isCurrentPage={active_page===k[0]}
                  key={k[0]}
                >
                  {k[1]}
                </BreadcrumbItem>
              })
          }
        </Breadcrumb>
        <Box
          display='grid'
          gridAutoFlow='rows'
          padding='0rem 0.5rem 0.5rem 0.5rem'
        >
          {/* Titre  */}
          <Text
            textStyle='h1'
            fontSize='1.5rem'
            color='white'
            background='primaire.2'
            borderRadius='6px'
            paddingInlineStart='1rem'
            width='calc(100% - 2rem)'
          >
            {t('welcome.'+active_page)}
          </Text>
          {/* Contenu */}
          {external_content[active_page as 'read_me' | 'intro' | 'interface' | 'rc' | 'licence' | 'news']}
        </Box>

      </ModalBody>
      <ModalFooter style={{justifyContent:'center'}}>
        <Box layerStyle='box_footer_welcome'>
          <Checkbox
            variant='checkbox_dont_show_again'
            isChecked={never_see_again.current} onChange={evt=>{
              never_see_again.current = evt.target.checked
              localStorage.setItem('dontSeeAggainWelcome','1')
              set_show_welcome(false)
            }}
          >
            {t('dontSeeAgain')}
          </Checkbox>
        </Box>
      </ModalFooter>
    </ModalContent>
  </Modal>

  return content
}

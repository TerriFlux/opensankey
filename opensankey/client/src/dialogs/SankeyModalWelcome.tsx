// Standard lib
import React, {
  FunctionComponent,
  useState
} from 'react'

// Imported libs
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
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

  const content_rc_static=<Table variant='table_welcome_buttons'>
    <Thead>
      <Tr>
        {t('Menu.rcc_titre_princ')}
      </Tr>
    </Thead>
    <Tbody>
      <Tr>
        <Td>{t('Menu.rcc_cdn_bold')}</Td>
        <Td>{t('Menu.rcc_cdn')}</Td>
      </Tr>
      <Tr>
        <Td>{t('Menu.rcc_ctrl_scrll_bold')}</Td>
        <Td>{t('Menu.rcc_ctrl_scrll')}</Td>
      </Tr>
      <Tr>
        <Td>{t('Menu.rcc_F7_bold')}</Td>
        <Td>{t('Menu.rcc_F7')}</Td>
      </Tr>
      <Tr>
        <Td>{t('Menu.rcc_F8_bold')}</Td>
        <Td>{t('Menu.rcc_F8')}</Td>
      </Tr>
      <Tr>
        <Td>{t('Menu.rcc_F9_bold')}</Td>
        <Td>{t('Menu.rcc_F9')}</Td>
      </Tr>
    </Tbody>
  </Table>

  const content_rc_not_static=<>
    <Box
      display='grid'
      gridTemplateColumns='50% 50%'
      gridColumnGap='0.25rem'
      width='100%'
      justifySelf='center'
    >
      <Table
        variant='table_welcome_buttons'
      >
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_select')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_cn_bold')}</Td><Td>{t('Menu.rcc_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_cn_bold')}</Td><Td>{t('Menu.rcc_ctrl_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_cf_bold')}</Td><Td>{t('Menu.rcc_cf')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_cf_bold')}</Td><Td>{t('Menu.rcc_ctrl_cf')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_cs_bold')}</Td><Td>{t('Menu.rcc_cs')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_click_and_drag_bold')}</Td><Td>{t('Menu.rcc_click_and_drag')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_cdn_bold')}</Td><Td>{t('Menu.rcc_cdn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ad_bold')}</Td><Td>{t('Menu.rcc_ad')}</Td></Tr>
        </Tbody>
      </Table>
      <Table
        variant='table_welcome_buttons'
      >
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_edi')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_e_cn_bold')}</Td><Td>{t('Menu.rcc_e_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_e_ds_bold')}</Td><Td>{t('Menu.rcc_e_ds')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_e_dn_bold')}</Td><Td>{t('Menu.rcc_e_dn')}</Td></Tr>
        </Tbody>
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_autre')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_a_s_bold')}</Td><Td>{t('Menu.rcc_a_s')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_a_fc_bold')}</Td><Td>{t('Menu.rcc_a_fc')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_a_dbm_bold')}</Td><Td>{t('Menu.rcc_a_dbm')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_a_ech_bold')}</Td><Td>{t('Menu.rcc_a_ech')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_scrll_bold')}</Td><Td>{t('Menu.rcc_ctrl_scrll')}</Td></Tr>
        </Tbody>
      </Table>
    </Box>

    {additional_shortcut_item}
  </>

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
            'padding': '0.25rem',
            'marginBlockStart': '30vh'
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

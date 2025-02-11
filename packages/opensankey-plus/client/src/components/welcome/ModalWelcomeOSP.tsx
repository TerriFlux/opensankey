// Standard libs
import React, { FunctionComponent, useState } from 'react'

// OpenSankey libs
import { ModalWelcome, ModalWelcomeContent } from '../../deps/OpenSankey/components/welcome/ModalWelcome'
import { FCType_ModalWelcomeBuilder } from '../../deps/OpenSankey/components/welcome/types/ModalWelcome'
import { Box, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
// Local libs
import { Type_GenericApplicationDataOSP } from '../../types/TypesOSP'

const ShortcutsOSP = (
  new_data_plus: Type_GenericApplicationDataOSP,
  page_content: { [_: string]: JSX.Element }
) => {
  const { t } = new_data_plus
  page_content['rc'] = <Box
    display="block"
    overflowY='scroll'
    overflowX='hidden'
    height='100%'
    width='100%'
  >
    <Box
      display='grid'
      gridTemplateColumns='50% 50%'
      gridColumnGap='0.25rem'
      width='100%'
      height='100%'
      justifySelf='center'
    >
      <Table
        variant='table_welcome_buttons'
      >
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_select')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_cn_bold')}</Td><Td>{t('Menu.rcc_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_shift_cn_bold')}</Td><Td>{t('Menu.rcc_shift_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_cn_bold')}</Td><Td>{t('Menu.rcc_ctrl_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_cf_bold')}</Td><Td>{t('Menu.rcc_cf')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_shift_cf_bold')}</Td><Td>{t('Menu.rcc_shift_cf')}</Td></Tr>
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
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_OSP')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_osp_cs_bold')}</Td><Td>{t('Menu.rcc_osp_cs')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_osp_ctrl_czdt_bold')}</Td><Td>{t('Menu.rcc_osp_ctrl_czdt')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_F7_bold')}</Td><Td>{t('Menu.rcc_F7')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_F8_bold')}</Td><Td>{t('Menu.rcc_F8')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_F9_bold')}</Td><Td>{t('Menu.rcc_F9')}</Td></Tr>
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
  </Box>
}


export const ModalWelcomeBuilderOSP: FunctionComponent<FCType_ModalWelcomeBuilder> = (
  { new_data }
) => {
  const [, setCount] = useState(0)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const [page_links, page_content] = ModalWelcomeContent(
    new_data,
  )

  ShortcutsOSP(
    new_data as Type_GenericApplicationDataOSP,
    page_content
  )

  return <ModalWelcome
    new_data={new_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}


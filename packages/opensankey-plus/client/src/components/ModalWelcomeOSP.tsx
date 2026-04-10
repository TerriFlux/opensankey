// Standard libs
import React, { useState } from 'react'

// OpenSankey libs
import { ModalWelcome, ModalWelcomeContent } from '../deps/OpenSankey/components/welcome/ModalWelcome'
import { Box, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_ApplicationData } from '../deps/OpenSankey/types/ApplicationData'


const ShortcutsOSP = (
  new_data_plus: Class_ApplicationDataOSP,
  page_content: { [_: string]: JSX.Element }
) => {
  const { t, icon_library } = new_data_plus
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
      justifySelf='center'
      alignItems='start'
    >
      <Table
        variant='table_welcome_buttons'
      >
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_select')} {icon_library.icon_DA_selection}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_cn_bold')}</Td><Td>{t('Menu.rcc_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_cn_bold')}</Td><Td>{t('Menu.rcc_ctrl_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_cs_bold')}</Td><Td>{t('Menu.rcc_cs')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_click_and_drag_bold')}</Td><Td>{t('Menu.rcc_click_and_drag')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_dn_bold')}</Td><Td>{t('Menu.rcc_dn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_cdn_bold')}</Td><Td>{t('Menu.rcc_cdn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ad_bold')}</Td><Td>{t('Menu.rcc_ad')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_handle_bold')}</Td><Td>{t('Menu.rcc_handle')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_shift_hover_bold')}</Td><Td>{t('Menu.rcc_shift_hover')}</Td></Tr>
        </Tbody>
      </Table>
      <Table
        variant='table_welcome_buttons'
      >
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_edi')} {icon_library.icon_DA_edit}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_e_cn_bold')}</Td><Td>{t('Menu.rcc_e_cn')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_e_ds_bold')}</Td><Td>{t('Menu.rcc_e_ds')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_e_dn_bold')}</Td><Td>{t('Menu.rcc_e_dn')}</Td></Tr>
        </Tbody>
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_toolbar')}</Th></Thead>
        <Tbody>
          <Tr><Td>{icon_library.icon_DA_selection} {t('Menu.rcc_tb_select_bold')}</Td><Td>{t('Menu.rcc_tb_select')}</Td></Tr>
          <Tr><Td>{icon_library.icon_DA_edit} {t('Menu.rcc_tb_edition_bold')}</Td><Td>{t('Menu.rcc_tb_edition')}</Td></Tr>
          <Tr><Td>{icon_library.icon_style_paint} {t('Menu.rcc_tb_style_bold')}</Td><Td>{t('Menu.rcc_tb_style')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_tb_param_bold')}</Td><Td>{t('Menu.rcc_tb_param')}</Td></Tr>
          <Tr><Td>{icon_library.icon_area_fit_horiz} {icon_library.icon_area_fit_vert} {t('Menu.rcc_tb_fit_bold')}</Td><Td>{t('Menu.rcc_tb_fit')}</Td></Tr>
          <Tr><Td>{icon_library.icon_exit_fullscreen} {t('Menu.rcc_tb_fullscreen_bold')}</Td><Td>{t('Menu.rcc_tb_fullscreen')}</Td></Tr>
        </Tbody>
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_OSP')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_osp_cs_bold')}</Td><Td>{t('Menu.rcc_osp_cs')}</Td></Tr>
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
          <Tr><Td>{t('Menu.rcc_ctrl_a_bold')}</Td><Td>{t('Menu.rcc_ctrl_a')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_c_bold')}</Td><Td>{t('Menu.rcc_ctrl_c')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_v_bold')}</Td><Td>{t('Menu.rcc_ctrl_v')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_s_bold')}</Td><Td>{t('Menu.rcc_ctrl_s')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_shift_s_bold')}</Td><Td>{t('Menu.rcc_ctrl_shift_s')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_alt_s_bold')}</Td><Td>{t('Menu.rcc_ctrl_alt_s')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_scrll_bold')}</Td><Td>{t('Menu.rcc_ctrl_scrll')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_z_bold')}</Td><Td>{t('Menu.rcc_ctrl_z')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_y_bold')}</Td><Td>{t('Menu.rcc_ctrl_y')}</Td></Tr>
        </Tbody>
      </Table>
    </Box>
  </Box>
}


export const ModalWelcomeBuilderOSP = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, setCount] = useState(0)
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const [page_links, page_content] = ModalWelcomeContent(
    app_data
  )

  ShortcutsOSP(
    app_data as Class_ApplicationDataOSP,
    page_content
  )

  return <ModalWelcome
    app_data={app_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}


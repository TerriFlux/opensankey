// Standard libs
import React, { useState } from 'react'

// OpenSankey libs
import {
  ModalWelcome,
  ModalWelcomeContent,
  buildShortcutsContent
} from '@terriflux/opensankey/src/components/welcome/ModalWelcome'
import { Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { Class_ApplicationData } from '@terriflux/opensankey/src/types/ApplicationData'


export const ModalWelcomeBuilderOSP = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, setCount] = useState(0)
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const { t } = app_data
  const [page_links, page_content] = ModalWelcomeContent(app_data)

  // OSP only adds the "Vues" section between the toolbar and the keyboard-shortcuts
  // sections of the base shortcuts page — everything else is inherited from the OS base.
  page_content['rc'] = buildShortcutsContent(app_data, {
    extraSectionsBeforeKeyboard: <>
      <Thead><Th colSpan={2}>{t('Menu.rcc_titre_OSP')}</Th></Thead>
      <Tbody>
        <Tr><Td>{t('Menu.rcc_osp_cs_bold')}</Td><Td>{t('Menu.rcc_osp_cs')}</Td></Tr>
        <Tr><Td>{t('Menu.rcc_F7_bold')}</Td><Td>{t('Menu.rcc_F7')}</Td></Tr>
        <Tr><Td>{t('Menu.rcc_F8_bold')}</Td><Td>{t('Menu.rcc_F8')}</Td></Tr>
        <Tr><Td>{t('Menu.rcc_F9_bold')}</Td><Td>{t('Menu.rcc_F9')}</Td></Tr>
      </Tbody>
    </>
  })

  return <ModalWelcome
    app_data={app_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}

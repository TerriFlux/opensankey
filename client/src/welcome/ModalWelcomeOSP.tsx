// Standard libs
import { TFunction } from 'i18next'
import React from 'react'

// Imported libs
import {
  Box,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

// Local libs
import type { FType_ShortcutsOSP } from './types/ModalWelcomeOSP'

export const ShortcutsOSP: FType_ShortcutsOSP = (t: TFunction) => {
  return (
    <Box
      display='grid'
      width='100%'
      justifySelf='center'
    >
      <Table
        variant='table_welcome_buttons'
      >
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_OSP')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_osp_cs_bold')}</Td><Td>{t('Menu.rcc_osp_cs')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_osp_ctrl_czdt_bold')}</Td><Td>{t('Menu.rcc_osp_ctrl_czdt')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_F7_bold')}</Td><Td>{t('Menu.rcc_F7')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_F8_bold')}</Td><Td>{t('Menu.rcc_F8')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_F9_bold')}</Td><Td>{t('Menu.rcc_F9')}</Td></Tr>
        </Tbody>
      </Table>
    </Box>
  )
}
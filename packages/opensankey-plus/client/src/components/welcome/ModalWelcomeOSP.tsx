// Standard libs
import React, { FunctionComponent, useState } from 'react'

// Imported libs
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

// OpenSankey libs
import { ModalWelcome, ModalWelcomeContent } from '../../deps/OpenSankey/components/welcome/ModalWelcome'
import { FCType_ModalWelcomeBuilder } from '../../deps/OpenSankey/components/welcome/types/ModalWelcome'

// Local libs
import { Type_GenericApplicationDataOSP } from '../../types/TypesOSP'

// const ShortcutsOSP = (
//   new_data_plus: Type_GenericApplicationDataOSP,
//   page_content: { [_: string]: JSX.Element }
// ) => {
//   const { t } = new_data_plus
//   page_content['rc'] = <React.Fragment>
//     {page_content['rc'] ?? <></>}
//     <AccordionItem>
//       <AccordionButton>
//         <Box
//           as='span'
//           layerStyle='menuconfig_entry'
//         >
//           {t('Menu.rcc_titre_princ')}
//         </Box>
//         <AccordionIcon />
//       </AccordionButton>
//       <AccordionPanel>
//         <Box
//           display='grid'
//           gridTemplateColumns='50% 50%'
//           gridColumnGap='0.25rem'
//           width='100%'
//           justifySelf='center'
//         >
//           <Table
//             variant='table_welcome_buttons'
//           >
//             <Thead><Th colSpan={2}>{t('Menu.rcc_titre_OSP')}</Th></Thead>
//             <Tbody>
//               <Tr><Td>{t('Menu.rcc_osp_cs_bold')}</Td><Td>{t('Menu.rcc_osp_cs')}</Td></Tr>
//               <Tr><Td>{t('Menu.rcc_osp_ctrl_czdt_bold')}</Td><Td>{t('Menu.rcc_osp_ctrl_czdt')}</Td></Tr>
//               <Tr><Td>{t('Menu.rcc_F7_bold')}</Td><Td>{t('Menu.rcc_F7')}</Td></Tr>
//               <Tr><Td>{t('Menu.rcc_F8_bold')}</Td><Td>{t('Menu.rcc_F8')}</Td></Tr>
//               <Tr><Td>{t('Menu.rcc_F9_bold')}</Td><Td>{t('Menu.rcc_F9')}</Td></Tr>
//             </Tbody>
//           </Table>
//         </Box>
//       </AccordionPanel>
//     </AccordionItem>
//   </React.Fragment>
// }

// const LicenceOSP = (
//   new_data_plus: Type_GenericApplicationDataOSP,
//   page_content: { [_: string]: JSX.Element }
// ) => {
//   const { t, logo_sankey_plus } = new_data_plus
//   page_content['licence'] = <React.Fragment>
//     {page_content['licence'] ?? <></>}
//     {/* OpenSankey+ */}
//     <Box layerStyle='welcome_license_row' background='gray.50'>
//       <Box>
//         <img
//           src={logo_sankey_plus}
//           alt='logo_OSP'
//           style={{ 'objectFit': 'contain', 'width': '225px' }}
//         />
//       </Box>
//       <Box layerStyle='welcome_license_desc'>
//         {t('Menu.presentation_OSP')}
//         <Button variant='welcome_button_license_description' onClick={() => {
//           window.open('https://terriflux.com/downloads/open-sankey-plus/')
//         }}>
//           {t('desire_to_know_more')}
//         </Button>
//       </Box>
//     </Box>
//   </React.Fragment>
// }

export const ModalWelcomeBuilderOSP: FunctionComponent<FCType_ModalWelcomeBuilder> = (
  { new_data }
) => {
  const welcome_text = (new_data.options?.welcome_text as string) ?? ''
  const has_welcome_text = welcome_text.length > 0
  const [active_page, set_active_page] = useState(has_welcome_text ? 'read_me' : 'intro')
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = set_active_page

  const [page_links, page_content] = ModalWelcomeContent(
    new_data,
    set_active_page
  )

  // ShortcutsOSP(
  //   new_data as Type_GenericApplicationDataOSP,
  //   page_content
  // )

  // if (!new_data.is_static) {
  //   LicenceOSP(
  //     new_data as Type_GenericApplicationDataOSP,
  //     page_content
  //   )
  // }

  return <ModalWelcome
    new_data={new_data}
    active_page={active_page}
    external_pagination={page_links}
    external_content={page_content}
  />
}


// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Standard lib
import React, {
  FC,
  useState
} from 'react'
import { Carousel } from 'react-bootstrap'

// Imported libs
import {
  Box,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Tab,
  Tabs,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  ModalOverlay,
  ModalHeader
} from '@chakra-ui/react'


import resources from './resources.json'
import { Class_ApplicationData } from '../../types/ApplicationData'


export const ModalWelcome = ({new_data, external_pagination, external_content}: {
    new_data: Class_ApplicationData
   external_pagination: { [x: string]: JSX.Element; };
    external_content: { [x: string]: JSX.Element; };
  }) => {
  const { t } = new_data
  const [show_welcome, set_show_welcome] = useState(false)
  const [current_header, setCurrentHeader] = useState<string>(Object.keys(external_pagination)[0] as string)

  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current = set_show_welcome

  const content_rc_static = <>
    <Heading variant='heading_welcome_style' >{t('Menu.rcc_titre_princ')}</Heading>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>
  </>

  external_content['rc'] = new_data.is_static ? content_rc_static : external_content['rc']

  const content = <Modal
    isOpen={show_welcome}
    onClose={() => set_show_welcome(false)}
  >
    <ModalOverlay />
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>
        {t('welcome.' + current_header)}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Tabs
          orientation='vertical'
          align='start'
          variant='tabs_variant_template'
          height='100%'
        >
          <TabList
          >
            {
              Object.entries(external_pagination)
                .map(([key, content]) => {
                  return <Tab key={key} onClick={() => setCurrentHeader(key)}> {content} </Tab>
                })
            }
          </TabList>
          <TabPanels>
            {
              Object.values(external_content)
                .map((content, idx) => {
                  return <TabPanel key={idx}>
                    {content}
                  </TabPanel>
                })
            }
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalContent>
  </Modal>

  return content
}

export const ModalWelcomeBuilder = ({ new_data } : { new_data: Class_ApplicationData }) => {
  const [, setCount] = useState(0)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const [page_links, page_content] = ModalWelcomeContent(
    new_data,
  )

  return <ModalWelcome
    new_data={new_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}

export const ModalWelcomeContent = (new_data: Class_ApplicationData) => {
  const { t, static_path } = new_data
  const welcome_text = (new_data.options?.welcome_text as string) ?? ''
  const has_welcome_text = welcome_text.length > 0

  const images_paths = resources['images_carousel_paths'].map(image_path => {
    const path = window.location.href
    if (!path.includes('localhost')) {
      image_path = image_path.replace('static/', static_path)
    }
    return image_path
  })

  const src_intro_static = 'welcome/intro_static.png'

  const page_links: { [x: string]: JSX.Element } = {}
  const page_content: { [x: string]: JSX.Element } = {}

  // Welcom text
  if (has_welcome_text) {
    page_links['read_me'] = <>{t('welcome.breadcrumbs.read_me')}</>
    page_content['read_me'] = welcome_text ? <> parse(welcome_text) </> : <></>
  }

  // Introduction to application
  page_links['intro'] = <> {t('welcome.breadcrumbs.intro')}</>
  page_content['intro'] = <Box
    display="block"
    height='100%'
  >
    {
      new_data.is_static ?
        <img
          src={src_intro_static}
          alt='intro carousel'
          style={{ 'objectFit': 'contain', 'width': '100%' }}
        /> :
        <Carousel
          variant='dark'
          style={{ 'height': '100%' }}
        >
          {
            (images_paths as string[]).map((_, idx) => {
              let title = _.split('/').pop()
              title = title!.split('.').splice(0, 1).join('')
              return (
                <Carousel.Item key={idx} style={{ 'height': '100%' }}>
                  <Box
                    display='grid'
                    width='100%'
                    height='100%'
                  >
                    <Text
                      textStyle='h2'
                      padding='2rem'
                      justifySelf='center'
                      alignSelf='bottom'
                      textAlign='center'
                    >
                      {t('welcome.caroussel.' + title)}
                    </Text>
                    <img
                      alt={title}
                      src={_}
                      style={{
                        'objectFit': 'scale-down',
                        'justifySelf': 'center',
                        'alignSelf': 'center',
                        'maxWidth': '100%',
                        'height': '100%'
                      }}
                    />
                    <Text
                      textStyle='h4'
                      padding='2rem'
                      justifySelf='center'
                      alignSelf='bottom'
                      textAlign='center'
                    >
                      {t('welcome.caroussel.descr.' + title)}
                    </Text>
                  </Box>
                </Carousel.Item>
              )
            })
          }
        </Carousel>
    }
  </Box>

  // Shortcuts
  page_links['rc'] = <>{t('welcome.breadcrumbs.rc')}</>
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
        <Thead><Th colSpan={2}>{t('Menu.rcc_titre_autre')}</Th></Thead>
        <Tbody>
          <Tr><Td>{t('Menu.rcc_a_s_bold')}</Td><Td>{t('Menu.rcc_a_s')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_a_fc_bold')}</Td><Td>{t('Menu.rcc_a_fc')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_a_dbm_bold')}</Td><Td>{t('Menu.rcc_a_dbm')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_a_ech_bold')}</Td><Td>{t('Menu.rcc_a_ech')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_scrll_bold')}</Td><Td>{t('Menu.rcc_ctrl_scrll')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_z_bold')}</Td><Td>{t('Menu.rcc_ctrl_z')}</Td></Tr>
          <Tr><Td>{t('Menu.rcc_ctrl_y_bold')}</Td><Td>{t('Menu.rcc_ctrl_y')}</Td></Tr>
        </Tbody>
      </Table>
    </Box>
  </Box>

  return [
    page_links,
    page_content
  ]
}

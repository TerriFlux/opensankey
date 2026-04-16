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

import React, { useState, useEffect } from 'react'
import { Carousel } from 'react-bootstrap'
import {
  Box, Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, ModalHeader,
  Tab, Tabs, Table, TabList, TabPanel, TabPanels, Tbody, Td, Text, Th, Thead, Tr,
} from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'

export const ModalWelcome = ({ app_data, external_pagination, external_content }: {
  app_data: Class_ApplicationData
  external_pagination: { [x: string]: JSX.Element; };
  external_content: { [x: string]: JSX.Element; };
}) => {
  const { t, menu_configuration } = app_data
  const [show_welcome, set_show_welcome] = useState(false)
  const [current_header, setCurrentHeader] = useState<string>(Object.keys(external_pagination)[0] as string)

  menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current = set_show_welcome

  // const content_rc_static = <>
  //   <Heading variant='heading_welcome_style' >{t('Menu.rcc_titre_princ')}</Heading>
  //   <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
  //   <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

  //   <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
  //   <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
  //   <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>
  // </>

  //external_content['rc'] = is_static ? <></> : external_content['rc']

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

export const ModalWelcomeBuilder = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, setCount] = useState(0)
  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const [page_links, page_content] = ModalWelcomeContent(app_data)

  return <ModalWelcome
    app_data={app_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}
interface Resources {
  images_carousel_paths: string[]
  carousel_data: {
    [key: string]: {
      title: string;
      description: string
    }
  }
}

export const ModalWelcomeContent = (app_data: Class_ApplicationData) => {
  const { t, static_path, is_static } = app_data
  const [resources, setResources] = useState<Resources | null>(null)
  // const welcome_text = (app_data.options?.welcome_text as string) ?? ''
  // const has_welcome_text = welcome_text.length > 0
  //const src_intro_static = 'intro.png'
  // Ajouter cet useEffect
  useEffect(() => {
    const loadResources = async () => {
      try {
        const response = await fetch('./resources.json')
        // Vérifier si le fichier existe (status 200)
        if (!response.ok) {
          if (response.status === 404) {
            console.log('ℹ️ resources.json non trouvé, skip')
            return // Skip silencieusement
          }
          throw new Error(`HTTP ${response.status}`)
        }
      
        const data = await response.json()
        setResources(data)
        console.log('✅ resources.json chargé')
      } catch (error) {
        // Si erreur réseau (pas CORS, pas de serveur, etc.)
        console.log('ℹ️ resources.json non disponible, skip')
        // Ne pas setResources, laisser à null
      }
    }
    
    loadResources()
  }, [])

  const images_paths = resources?.['images_carousel_paths']?.map(image_path => {
    const path = window.location.href
    if (!path.includes('localhost')) {
      image_path = image_path.replace('static/', static_path)
    }
    return image_path
  })

  const page_links: { [x: string]: JSX.Element } = {}
  const page_content: { [x: string]: JSX.Element } = {}

  // Welcom text
  // if (has_welcome_text) {
  //   page_links['read_me'] = <>{t('welcome.breadcrumbs.read_me')}</>
  //   page_content['read_me'] = welcome_text ? <> parse(welcome_text) </> : <></>
  // }

  // Shortcuts / Essentials
  if (!is_static) {
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
        justifySelf='center'
        alignItems='start'
      >
        <Table
          variant='table_welcome_buttons'
        >
          <Thead><Th colSpan={2}>{t('Menu.rcc_titre_select')} {app_data.icon_library.icon_DA_selection}</Th></Thead>
          <Tbody>
            <Tr><Td>{t('Menu.rcc_cn_bold')}</Td><Td>{t('Menu.rcc_cn')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_ctrl_cn_bold')}</Td><Td>{t('Menu.rcc_ctrl_cn')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_cs_bold')}</Td><Td>{t('Menu.rcc_cs')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_click_and_drag_bold')}</Td><Td>{t('Menu.rcc_click_and_drag')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_dn_bold')}</Td><Td>{t('Menu.rcc_dn')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_shift_dn_bold')}</Td><Td>{t('Menu.rcc_shift_dn')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_cdn_bold')}</Td><Td>{t('Menu.rcc_cdn')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_ad_bold')}</Td><Td>{t('Menu.rcc_ad')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_handle_bold')}</Td><Td>{t('Menu.rcc_handle')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_shift_hover_bold')}</Td><Td>{t('Menu.rcc_shift_hover')}</Td></Tr>
          </Tbody>
        </Table>
        <Table
          variant='table_welcome_buttons'
        >
          <Thead><Th colSpan={2}>{t('Menu.rcc_titre_edi')} {app_data.icon_library.icon_DA_edit}</Th></Thead>
          <Tbody>
            <Tr><Td>{t('Menu.rcc_e_cn_bold')}</Td><Td>{t('Menu.rcc_e_cn')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_e_ds_bold')}</Td><Td>{t('Menu.rcc_e_ds')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_e_dn_bold')}</Td><Td>{t('Menu.rcc_e_dn')}</Td></Tr>
          </Tbody>
          <Thead><Th colSpan={2}>{t('Menu.rcc_titre_toolbar')}</Th></Thead>
          <Tbody>
            <Tr><Td>{app_data.icon_library.icon_DA_selection} {t('Menu.rcc_tb_select_bold')}</Td><Td>{t('Menu.rcc_tb_select')}</Td></Tr>
            <Tr><Td>{app_data.icon_library.icon_DA_edit} {t('Menu.rcc_tb_edition_bold')}</Td><Td>{t('Menu.rcc_tb_edition')}</Td></Tr>
            <Tr><Td>{app_data.icon_library.icon_style_paint} {t('Menu.rcc_tb_style_bold')}</Td><Td>{t('Menu.rcc_tb_style')}</Td></Tr>
            <Tr><Td>{t('Menu.rcc_tb_param_bold')}</Td><Td>{t('Menu.rcc_tb_param')}</Td></Tr>
            <Tr><Td>{app_data.icon_library.icon_area_fit_horiz} {app_data.icon_library.icon_area_fit_vert} {t('Menu.rcc_tb_fit_bold')}</Td><Td>{t('Menu.rcc_tb_fit')}</Td></Tr>
            <Tr><Td>{app_data.icon_library.icon_exit_fullscreen} {t('Menu.rcc_tb_fullscreen_bold')}</Td><Td>{t('Menu.rcc_tb_fullscreen')}</Td></Tr>
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

  // Introduction to application
  page_links['intro'] = <> {t('welcome.breadcrumbs.intro')}</>
  page_content['intro'] = <Box
    display="block"
    height='100%'
    maxHeight='60vh' // Limite la hauteur du carousel
    overflow='hidden'
  >
    <Carousel
      variant='dark'
      style={{
        height: '100%',
        maxHeight: '60vh'
      }}
    >
      {
        (images_paths as string[])?.map((imagePath, idx) => {
          let title = imagePath.split('/').pop()
          title = title!.split('.').splice(0, 1).join('')

          // Use i18n translations if available, fallback to resources.json
          const carouselItem = resources?.carousel_data?.[title]
          const carouselTitle = t('welcome.carousel.' + title + '.title', carouselItem?.title ?? '')
          const carouselDescription = t('welcome.carousel.' + title + '.description', carouselItem?.description ?? '')

          return (
            <Carousel.Item key={idx} style={{ height: '60vh', overflow: 'hidden' }}>
              <Box
                display='flex'
                flexDirection='column'
                width='100%'
                height='100%'
                overflow='hidden'
              >
                <Text
                  textStyle='h2'
                  padding='1rem'
                  textAlign='center'
                  flexShrink={0}
                  maxHeight='8%'
                  overflow='hidden'
                >
                  {carouselTitle}
                </Text>

                <Box
                  flex={1}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  overflow='hidden'
                  minHeight={0}
                  maxHeight='82%'
                >
                  <img
                    alt={title}
                    src={imagePath}
                    style={{
                      objectFit: 'contain',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </Box>

                <Text
                  textStyle='h4'
                  padding='1rem'
                  textAlign='center'
                  flexShrink={0}
                  maxHeight='10%'
                  overflow='hidden'
                >
                  {carouselDescription}
                </Text>
              </Box>
            </Carousel.Item>
          )
        })
      }
    </Carousel>
  </Box>



  return [
    page_links,
    page_content
  ]
}

// Standard libs
import React, { Dispatch, MutableRefObject, SetStateAction, useState } from 'react'
import { Carousel } from 'react-bootstrap'
import {
  FaUser,
  FaAngleDoubleLeft,
  FaHome,
  FaCaretSquareLeft,
  FaCaretSquareRight
} from 'react-icons/fa'
import parse from 'html-react-parser'

import {
  faArrowPointer,
  faShareNodes,
  faFolderTree,
  faSliders,
  faArrowsUpDown,
  faArrowsLeftRight,
  faDiagramProject
} from '@fortawesome/free-solid-svg-icons'
import {
  FontAwesomeIcon
} from '@fortawesome/react-fontawesome'
import {
  Box,
  BreadcrumbLink,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Image,
  Stack,
  Table,
  Text,
  Tr,
  Td,
  Tbody
} from '@chakra-ui/react'
import { Type_GenericApplicationDataOSP } from '../deps/OpenSankey+/types/TypesOSP'
import { Type_GenericApplicationDataOS } from '../deps/OpenSankey+/deps/OpenSankey/types/TypesOS'
import { ModalWelcomeOS } from './ModalWelcomeOS'
import { ShortcutsOSP } from './ModalWelcomeOSP'

// OpenSankey import

// OpenSankey+ imports

// import { Class_ApplicationDataSuite } from '../types/ApplicationDataSuite'
// import { complete_sankey_data, DefaultLink, DefaultNode } from 'open-sankey/dist/types/Legacy'
// import { applicationDataType } from 'open-sankey/src/types/LegacyType'

// OpenSankey types
// import { dict_hook_ref_setter_show_dialog_componentsType } from 'open-sankey/src/types/Types'
// import { ConvertDataFuncType } from 'open-sankey/src/configmenus/types/SankeyConvertTypes'


const windowSankey = window as Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      sankey_data_file: RequestInfo
      sous_filieres: { [key: string]: string }
      units: string[]
      flask_logo?: string
      flask_header?: string
      logo_width?: number
      legend_average: string
      legend_uncert: string
      help_text: string
      welcome_text: string
      excel: string
      logo: string,
      advanced: boolean,
      intro: string
    }
  }

export const CardsTemplateBuilder = (
  new_data: Type_GenericApplicationDataOS
) => {
  const { t } = new_data
  /* eslint-disable */
  // @ts-ignore
  const image_preview = require.context('./css/image_preview', true)
  // @ts-ignore
  const imageList = image_preview.keys().map(image => {
    let img = image_preview(image)
    const path = window.location.href
    if (!path.includes('localhost')) {
      img = img.replace('static/', 'static/sankeysuite/')
    }
    return img
  })
  // @ts-ignore
  // const list_template = require.context('./css/easy_template', true)
  // @ts-ignore
  // const list_template_data = list_template.keys().filter(im => im.includes('.json')).map(path_to_file => {
  //   const d = list_template(path_to_file)
  //   complete_sankey_data(d, applicationData.get_default_data, DefaultNode, DefaultLink)
  //   //convert_data(d, applicationData.get_default_data)
  //   return d
  // })
  /* eslint-enable */
  return <>
    {(imageList as string[]).map((_, /*idx*/) => {
      // _ is the path to the image, it contain '/' because it is in a folder tree
      // so we take the name of file by removing the path & keeping the file name
      const tmp = _.split('/')
      // then since we use a require file name have number in their name (exemple : tolkien.556685563.png)
      // so we take only the name by removing extra (number + file extension)
      const title = tmp[tmp.length - 1].split('.')[0]
      return (
        <Card variant='cards_template'>
          <CardBody>
            <Stack>
              <Heading variant='heading_template_dashboard'>{title.replaceAll('_', ' ')}</Heading>
              <Image
                className='img-card'
                src={_}
                style={{ 'objectFit': 'contain', 'maxHeight': '150px' }}
              />
            </Stack>

          </CardBody>
          <CardFooter>
            <ButtonGroup
            //ButtonGroup don't have variants theming so we modify directly the style
              style={{
                margin:'auto'
              }}>
              <Button variant='menuconfigpanel_option_button'
                onClick={() => {
                  // applicationState.multi_selected_nodes.current = []
                  // applicationState.multi_selected_links.current = []
                  // applicationState.multi_selected_label.current = []
                  // applicationData.set_data(
                  //   { ...list_template_data[idx] })
                }}>{t('useTemplate')}</Button>

              <Button variant='menuconfigpanel_option_button_secondary'
                onClick={() => {
                  // applicationState.multi_selected_nodes.current = []
                  // applicationState.multi_selected_links.current = []
                  // applicationState.multi_selected_label.current = []
                  //const difficulty_file=(tmp['OpenSankey']['easy_template'].includes(list_template_data[idx]))?'easy_template':'expert_template'
                  // ClickSaveExcel('/opensankey/', list_template_data[idx], title)
                }}>{t('dl')}</Button>
            </ButtonGroup>
          </CardFooter>
        </Card>
      )
    }
    )}
  </>
}

export const welcomeModalBuilder = (
  new_data_plus: Type_GenericApplicationDataOSP,
  // exemple_menu: object,
  never_see_again: MutableRefObject<boolean>,
  ref_setter_active_page: MutableRefObject<Dispatch<SetStateAction<string>>>
) => {
  const { t } = new_data_plus
  const [active_page, set_active_page] = useState((windowSankey.sankey && windowSankey.sankey.welcome_text) ? 'read_me' : 'intro')
  ref_setter_active_page.current = set_active_page

  /* eslint-disable */
  // @ts-ignore
  const carousel = require.context('./css/image_carousel', true)
  // @ts-ignore
  const imageList = carousel.keys().map(image => {
    let carousel_element = carousel(image)
    const path = window.location.href
    if (!path.includes('localhost')) {
      carousel_element = carousel_element.replace('static/', 'static/sankeysuite/')
    }
    return carousel_element
  })
  /* eslint-enable */

  const src_intro_static = 'intro_static.png'
  const external_pag: { [x: string]: JSX.Element } = {}

  if (windowSankey.sankey && windowSankey.sankey.welcome_text) {
    external_pag['read_me'] = <BreadcrumbLink onClick={() => { set_active_page('read_me') }}>
      {t('welcome.breadcrumbs.read_me')}
    </BreadcrumbLink>
  }

  external_pag['intro'] = <BreadcrumbLink onClick={() => { set_active_page('intro') }}>
    {t('welcome.breadcrumbs.intro')}
  </BreadcrumbLink>

  external_pag['interface'] = <BreadcrumbLink onClick={() => { set_active_page('interface') }}>
    {t('welcome.breadcrumbs.interface')}
  </BreadcrumbLink>

  external_pag['rc'] = <BreadcrumbLink onClick={() => { set_active_page('rc') }}>
    {t('welcome.breadcrumbs.rc')}
  </BreadcrumbLink>

  if (!windowSankey.SankeyToolsStatic) {
    external_pag['licence'] = <BreadcrumbLink onClick={() => { set_active_page('licence') }}>
      {t('welcome.breadcrumbs.licence')}
    </BreadcrumbLink>
  }

  return <ModalWelcomeOS
    new_data={new_data_plus as Type_GenericApplicationDataOS}
    active_page={active_page}
    //dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
    never_see_again={never_see_again}
    additional_shortcut_item={[ShortcutsOSP(t)]}
    external_pagination={external_pag}
    external_content={{
      'read_me': windowSankey.sankey && windowSankey.sankey.welcome_text ? parse(windowSankey.sankey.welcome_text) : '',
      'intro': <div>
        {
          windowSankey.SankeyToolsStatic ?
            <img
              src={src_intro_static}
              alt='intro carousel'
              style={{ 'objectFit': 'contain', 'width': '100%' }}
            /> :
            <Carousel
              variant='dark'
              interval={null}
            >
              {
                (imageList as string[]).map((_) => {
                  let title = _.split('/').pop()
                  title = title!.split('.').splice(0, 1).join('')
                  return (
                    <Carousel.Item>
                      <div
                        style={{
                          'display': 'grid',
                          'width': '60vw',
                          'height': '60vh'
                        }}
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
                      </div>
                    </Carousel.Item>
                  )
                })
              }
            </Carousel>
        }
      </div>,
      'interface': <>
        <Table variant='table_welcome_buttons'>
          <Tbody>
            {
              !windowSankey.SankeyToolsStatic ?
                <>
                  {/* Info account button */}
                  <Tr>
                    <Td>
                      <Button variant={'menutop_button_goto_dashboard'}>
                        <FaUser />
                      </Button>
                    </Td>
                    <Td>{t('welcome.9')}</Td>
                  </Tr>
                  {/* Infos selection / edition buttons */}
                  <Tr>
                    <Td>
                      <ButtonGroup>
                        <Button variant={'toolbar_button_1'}>
                          <FontAwesomeIcon icon={faArrowPointer} />
                        </Button>
                        <Button variant={'toolbar_button_1'}>
                          <FontAwesomeIcon icon={faShareNodes} />
                        </Button>
                      </ButtonGroup>
                    </Td>
                    <Td>{t('welcome.1')}</Td>
                  </Tr>
                </> :
                <> </>
            }
            {/* Info level buttons */}
            <Tr>
              <Td>
                <ButtonGroup>
                  <Button variant={'toolbar_button_2'}>
                    <FontAwesomeIcon icon={faFolderTree} />
                  </Button>
                </ButtonGroup>
              </Td>
              <Td>{t('welcome.3')}</Td>
            </Tr>
            {/* Infos filter button */}
            <Tr>
              <Td>
                <ButtonGroup>
                  <Button variant={'toolbar_button_3'}>
                    <FontAwesomeIcon icon={faSliders} />
                  </Button>
                </ButtonGroup>
              </Td>
              <Td>{t('welcome.4')}</Td>
            </Tr>
            {/* Info resize drawing area buttons */}
            <Tr>
              <Td>
                <ButtonGroup>
                  <Button variant={'toolbar_button_6'}>
                    <FontAwesomeIcon icon={faArrowsUpDown} />
                  </Button>
                  <Button variant={'toolbar_button_6'}>
                    <FontAwesomeIcon icon={faArrowsLeftRight} />
                  </Button>
                </ButtonGroup>
              </Td>
              <Td>{t('welcome.5')}</Td>
            </Tr>
            {/* Info data choice button */}
            <Tr>
              <Td>
                <ButtonGroup>
                  <Button variant={'toolbar_button_5'}>
                    <FontAwesomeIcon icon={faDiagramProject} />
                  </Button>
                </ButtonGroup>
              </Td>
              <Td>{t('welcome.6')}</Td>
            </Tr>
            {/* Info config menu button */}
            <Tr>
              <Td>
                <ButtonGroup>
                  <Button variant={'toolbar_main_button'}>
                    <FaAngleDoubleLeft />
                  </Button>
                </ButtonGroup>
              </Td>
              <Td>{t('welcome.10')}</Td>
            </Tr>
            {/* Info view navigation buttons */}
            {
              (
                (!windowSankey.SankeyToolsStatic) ||
                (windowSankey.SankeyToolsStatic /*&& applicationData.data.view.length !== 0*/)
              ) ?
                <Tr>
                  <Td>
                    <ButtonGroup>
                      <Button variant={'light'}>
                        <FaHome />
                      </Button>
                      <Button variant={'light'}>
                        <FaCaretSquareLeft />
                      </Button>
                      <Button variant={'light'}>
                        <FaCaretSquareRight />
                      </Button>
                    </ButtonGroup>
                  </Td>
                  <Td>{t('welcome.view')}</Td>
                </Tr> :
                <></>
            }
            {/* Publish help button */}
            {
              (
                windowSankey.SankeyToolsStatic &&
                windowSankey.sankey &&
                windowSankey.sankey.excel
              ) ?
                <Tr>
                  <Td>
                    <ButtonGroup>
                      <Button variant='link'>{t('Banner.tl')}</Button>
                    </ButtonGroup>
                  </Td>
                  <Td>{t('welcome.excel')}</Td>
                </Tr> :
                <></>
            }
          </Tbody>
        </Table>
      </>,
      'rc': <></>,
      // Content for welcome modal : Licences explanation
      'licence': <>
        {/* OpenSankey */}
        <Box layerStyle='licence_row'>
          <Box>
            <img src={new_data_plus.logo_opensankey} alt='logo_OS' style={{ 'objectFit': 'contain', 'width': '225px' }} />
          </Box>
          <Box layerStyle='licence_desc'>
            <span>{t('Menu.presentation_OS')}</span>
            <span style={{ fontWeight: 'bold' }}>{t('Menu.presentation_OS_limit_node')}</span>
            <Button variant='btn_desc_licence'
              onClick={() => {
                window.open('https://terriflux.com/downloads/open-sankey/')
              }}>
              {t('contribute_to_os')}
            </Button>
          </Box>
        </Box>
        {/* OpenSankey+ */}
        <Box layerStyle='licence_row' background='gray.50'>
          <Box>
            <img src={new_data_plus.logo_sankey_plus} alt='logo_OSP' style={{ 'objectFit': 'contain', 'width': '225px' }} />
          </Box>
          <Box layerStyle='licence_desc'>
            {t('Menu.presentation_OSP')}
            <Button variant='btn_desc_licence' onClick={() => {
              window.open('https://terriflux.com/downloads/open-sankey-plus/')
            }}>
              {t('desire_to_know_more')}
            </Button>
          </Box>
        </Box>
        {/* SankeySuite */}
        <Box layerStyle='licence_row'>
          <Box>
            <img src={new_data_plus.logo_sankey_plus} alt='logo_OSS' style={{ 'objectFit': 'contain', 'width': '225px' }} />
          </Box>
          <Box layerStyle='licence_desc'>
            {t('Menu.presentation_OSS')}
            <Button variant='btn_desc_licence'
              onClick={() => {
                window.open('https://terriflux.com/downloads/sankey-suite/')
              }}>
              {t('desire_to_know_more')}
            </Button>
          </Box>
        </Box>
      </>,
      'news': <></>
    }}
  />
}

// ---------------------News are disable from welcome modale until judged otherwise------------------------
// const pagination_news=(!windowSankey.SankeyToolsStatic)?<Pagination.Item active={active_page==='news'} key={'news'} onClick={()=>{
//   set_active_page('news')
// }}>
//   {t('welcome.news')}
// </Pagination.Item>:<></>

/* eslint-disable */
// @ts-ignore
// Content for welcome modal : Updates in Sankey app
// let image1 = require('./css/news_material/' + t('welcome.news_content.230803.image1'))
// let image2 = require('./css/news_material/' + t('welcome.news_content.230803.image2'))
// let image3 = require('./css/news_material/' + t('welcome.news_content.230803.image3'))
// let image4 = require('./css/news_material/' + t('welcome.news_content.230803.image4'))
// if ( !windowSankey.location.href.includes('localhost') ) {
//   image1 = image1.replace('static/', 'static/sankeysuite/')
//   image2 = image2.replace('static/', 'static/sankeysuite/')
//   image3 = image3.replace('static/', 'static/sankeysuite/')
//   image4 = image4.replace('static/', 'static/sankeysuite/')
// }

// let image_230908_1 = require('./css/news_material/' + t('welcome.news_content.230908.img1'))
// const image_230908_2 = require('./css/news_material/' + t('welcome.news_content.230908.img2'))
// let image_230908_3 = require('./css/news_material/' + t('welcome.news_content.230908.img3'))
// /* eslint-enable */
// if ( !windowSankey.location.href.includes('localhost') ) {
//   image_230908_1 = image_230908_1.replace('static/', 'static/sankeysuite/')
//   image_230908_1 = image_230908_2.replace('static/', 'static/sankeysuite/')
//   image_230908_3 = image_230908_2.replace('static/', 'static/sankeysuite/')

// }
// const content_news=<>
//   <Accordion
//     allowToggle
//     // className='accordion_new_welcome'
//     // defaultActiveKey={'08-09-23'}
//   >
//     {/* New 08 Septembre 2023 */}
//     <AccordionItem
//       // eventKey='08-09-23'
//     >
//       <AccordionButton>
//         <Box as='span' width='100%'>
//           <Box
//             layerStyle='menuconfig_entry'
//           >
//             {t('welcome.news_content.230908.main_title')}
//           </Box>
//           <Box
//             layerStyle='submenuconfig_entry'
//           >
//             {t('welcome.news_content.230908.main_content')}
//           </Box>
//         </Box>
//         <AccordionIcon/>
//       </AccordionButton>
//       <AccordionPanel>
//         <h3>{t('welcome.news_content.230908.sub_title_1')}</h3>
//         <p>{t('welcome.news_content.230908.sub_content_1')}</p>
//         <Row >
//           <Box>
//           <Box>
//         </Row>

//         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//         <h3>{t('welcome.news_content.230908.sub_title_2')}</h3>
//         <p>{t('welcome.news_content.230908.sub_content_2')}</p>
//         <Row >
//           <img src={image_230908_3} alt='menu_config_node' style={{'objectFit':'contain','width':'450px'}}/>
//         </Row>
//         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//       </AccordionPanel>
//     </AccordionItem>


//     {/* New 03 Août 2023 */}
//     <AccordionItem
//     // eventKey='03-09-23'
//     >
//       <AccordionButton>
//         <Box as='span' width='100%'>
//           <Box
//             layerStyle='menuconfig_entry'
//           >
//             {t('welcome.news_content.230803.main_title')}
//           </Box>
//           <Box
//             layerStyle='submenuconfig_entry'
//           >
//             {t('welcome.news_content.230803.main_content')}
//           </Box>
//         </Box>
//         <AccordionIcon/>
//       </AccordionButton>
//       <AccordionPanel>
//         <Row>
//           <h3>{t('welcome.news_content.230803.sub_title_1')}</h3>
//           <p>{t('welcome.news_content.230803.sub_content_1')}</p>
//           <Box>
//           <Box>
//           <Box>
//         </Row>
//         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//         <Row>
//           <h3>{t('welcome.news_content.230803.sub_title_2')}</h3>
//           <p>{t('welcome.news_content.230803.sub_content_2')}</p>
//           <Box>
//         </Row>
//         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//         <Row>
//           <h3>{t('welcome.news_content.230803.sub_title_3')}</h3>
//           <p>{t('welcome.news_content.230803.sub_content_3')}</p>
//         </Row>
//       </AccordionPanel>
//     </AccordionItem>

//   </Accordion>

//   {/* <Row>
//           <h2>{t('welcome.news_content.230803.main_title')}</h2>
//           <p><b>{t('welcome.news_content.230803.main_content')}</b></p>
//       </Row>
//       <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//       <Row>
//           <h3>{t('welcome.news_content.230803.sub_title_1')}</h3>
//           <p>{t('welcome.news_content.230803.sub_content_1')}</p>
//           <Box>
//           <Box>
//           <Box>
//       </Row>
//       <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//       <Row>
//           <h3>{t('welcome.news_content.230803.sub_title_2')}</h3>
//           <p>{t('welcome.news_content.230803.sub_content_2')}</p>
//           <Box>
//       </Row>
//       <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
//       <Row>
//           <h3>{t('welcome.news_content.230803.sub_title_3')}</h3>
//           <p>{t('welcome.news_content.230803.sub_content_3')}</p>
//       </Row> */}
// </>
// Standard lib
import React, {
  FunctionComponent,
  useState
} from 'react'
import { Carousel } from 'react-bootstrap'

// Imported libs
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Checkbox,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import { FCType_ModalWelcome, FCType_ModalWelcomeBuilder } from './types/ModalWelcome'
import { Type_GenericApplicationDataOS } from '../types/TypesOS'
import { faArrowPointer, faShareNodes, faFolderTree, faSliders, faArrowsUpDown, faArrowsLeftRight, faDiagramProject } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FaUser, FaAngleDoubleLeft } from 'react-icons/fa'

export const ModalWelcome: FunctionComponent<FCType_ModalWelcome> = ({
  new_data,
  active_page,
  external_pagination,
  external_content
}) => {
  const { t } = new_data
  const { never_see_again } = new_data.menu_configuration

  const [show_welcome, set_show_welcome] = useState(!never_see_again.current)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current = set_show_welcome

  const content_rc_static = <>
    <Heading variant='heading_welcome_style' >{t('Menu.rcc_titre_princ')}</Heading>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>
  </>

  const content_rc_not_static = <Accordion
    // className='accordion_new_welcome'
    defaultIndex={0}
    allowToggle
  >
    {external_content['rc']}
  </Accordion>

  external_content['rc'] = new_data.is_static ? content_rc_static : content_rc_not_static

  const content = <Modal
    variant='modal_welcome'
    isOpen={show_welcome && !never_see_again.current}
    onClose={() => set_show_welcome(false)}
  >
    <ModalContent
      maxWidth='inherit'
    >
      <ModalCloseButton />
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
              .map((k) => {
                return <BreadcrumbItem
                  isCurrentPage={active_page === k[0]}
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
            {t('welcome.' + active_page)}
          </Text>
          {/* Contenu */}
          {external_content[active_page as 'read_me' | 'intro' | 'interface' | 'rc' | 'licence' | 'news']}
        </Box>

      </ModalBody>
      <ModalFooter style={{ justifyContent: 'center' }}>
        <Box layerStyle='box_footer_welcome'>
          <Checkbox
            variant='checkbox_dont_show_again'
            isChecked={never_see_again.current} onChange={evt => {
              never_see_again.current = evt.target.checked
              localStorage.setItem('dontSeeAggainWelcome', '1')
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

export const CardsTemplateBuilder = (
  new_data: Type_GenericApplicationDataOS
) => {
  const { t, static_path } = new_data
  /* eslint-disable */
  // @ts-ignore
  const image_preview = require.context('../css/image_preview', true)
  // @ts-ignore
  const imageList = image_preview.keys().map(image => {
    let img = image_preview(image)
    const path = window.location.href
    if (!path.includes('localhost')) {
      img = img.replace('static/', static_path)
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
    {(imageList as string[]).map((_, idx) => {
      // _ is the path to the image, it contain '/' because it is in a folder tree
      // so we take the name of file by removing the path & keeping the file name
      const tmp = _.split('/')
      // then since we use a require file name have number in their name (exemple : tolkien.556685563.png)
      // so we take only the name by removing extra (number + file extension)
      const title = tmp[tmp.length - 1].split('.')[0]
      return (
        <Card key={idx} variant='cards_template'>
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
                margin: 'auto'
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

export const ModalWelcomeBuilder: FunctionComponent<FCType_ModalWelcomeBuilder> = (
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

  return <ModalWelcome
    new_data={new_data}
    active_page={active_page}
    external_pagination={page_links}
    external_content={page_content}
  />
}

export const ModalWelcomeContent = (
  new_data: Type_GenericApplicationDataOS,
  set_active_page: (_: string) => void,
) => {
  const { t, static_path } = new_data
  const welcome_text = (new_data.options?.welcome_text as string) ?? ''
  const has_welcome_text = welcome_text.length > 0

  /* eslint-disable */
  // @ts-ignore
  const carousel = require.context('../css/image_carousel', true)
  // @ts-ignore
  const imageList = carousel.keys().map(image => {
    let carousel_element = carousel(image)
    const path = window.location.href
    if (!path.includes('localhost')) {
      carousel_element = carousel_element.replace('static/', static_path)
    }
    return carousel_element
  })
  /* eslint-enable */

  const src_intro_static = 'intro_static.png'

  const page_links: { [x: string]: JSX.Element } = {}
  const page_content: { [x: string]: JSX.Element } = {}

  // Welcom text
  if (has_welcome_text) {
    page_links['read_me'] = <BreadcrumbLink onClick={() => { set_active_page('read_me') }}>
      {t('welcome.breadcrumbs.read_me')}
    </BreadcrumbLink>
    page_content['read_me'] = welcome_text ? <>parse(welcome_text)</> : <></>
  }

  // Introduction to application
  page_links['intro'] = <BreadcrumbLink onClick={() => { set_active_page('intro') }}>
    {t('welcome.breadcrumbs.intro')}
  </BreadcrumbLink>
  page_content['intro'] = <div>
    {
      new_data.is_static ?
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
            (imageList as string[]).map((_,idx) => {
              let title = _.split('/').pop()
              title = title!.split('.').splice(0, 1).join('')
              return (
                <Carousel.Item key={idx}>
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
  </div>

  // Interface explained
  page_links['interface'] = <BreadcrumbLink onClick={() => { set_active_page('interface') }}>
    {t('welcome.breadcrumbs.interface')}
  </BreadcrumbLink>
  page_content['interface'] = <>
    <Table variant='table_welcome_buttons'>
      <Tbody>
        {
          !new_data.is_static ?
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
      </Tbody>
    </Table>
  </>

  // Shortcuts
  page_links['rc'] = <BreadcrumbLink onClick={() => { set_active_page('rc') }}>
    {t('welcome.breadcrumbs.rc')}
  </BreadcrumbLink>
  page_content['rc'] = <AccordionItem
  // eventKey='OS'
  >
    <AccordionButton>
      <Box
        as='span'
        layerStyle='menuconfig_entry'
      >
        {t('Menu.rcc_titre_princ')}
      </Box>
      <AccordionIcon />
    </AccordionButton>
    <AccordionPanel>
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
    </AccordionPanel>
  </AccordionItem>

  if (!new_data.is_static) {
    page_links['licence'] = <BreadcrumbLink onClick={() => { set_active_page('licence') }}>
      {t('welcome.breadcrumbs.licence')}
    </BreadcrumbLink>
    page_content['licence'] = <Box layerStyle='licence_row'>
      <Box>
        <img
          src={new_data.logo_opensankey}
          alt='logo_OS'
          style={{ 'objectFit': 'contain', 'width': '225px' }}
        />
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
  }

  return [
    page_links,
    page_content
  ]
}

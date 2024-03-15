// Standard lib
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useState
} from 'react'
import {
  Button,
  ButtonGroup,
  Card,
  Carousel,
  Col,
  FormCheck,
  Modal,
  Pagination,
} from 'react-bootstrap'
import {
  FaUser,
  FaAngleDoubleLeft,
  FaHome,
  FaCaretSquareLeft,
  FaCaretSquareRight
} from 'react-icons/fa'
import parse from 'html-react-parser'
import { TFunction } from 'i18next'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box
} from '@chakra-ui/react'
import {
  faArrowPointer,
  faShareNodes,
  faFolderTree,
  faSliders,
  faArrowsUpDown,
  faArrowsLeftRight,
  faDiagramProject
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Local libs
import {
  SankeyData,
  applicationContextType,
  dict_variable_application_dataType,
  dict_variable_elements_selectedType,
  dict_hook_ref_setter_show_dialog_componentsType
} from '../types/Types'
import { ConvertDataFuncType } from '../configmenus/types/SankeyConvertTypes'
import { windowSankey } from '../configmenus/SankeyUtils'
import { DownloadExempleExcel } from './SankeyPersistence'
import { UploadExemple } from './SankeyPersistence'
import { SankeyModalWelcomeFType } from '../topmenus/types/SankeyMenuTopTypes'

export const SankeyModalWelcome : SankeyModalWelcomeFType = (
  t,
  active_page,
  set_active_page,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  additional_shortcut_item,
  external_pagination,
  external_content,
  exemple_menu: object
)=>{
  const [show_wecome,set_show_welcome]=useState(!never_see_again.current)
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current=set_show_welcome

  const content_rc_static=<>
    <h4 style={{textAlign:'center'}}>{t('Menu.rcc_titre_princ')}</h4>
    <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
    <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>

    <p><b>{t('Menu.rcc_F7_bold')}</b>{t('Menu.rcc_F7')}</p>
    <p><b>{t('Menu.rcc_F8_bold')}</b>{t('Menu.rcc_F8')}</p>
    <p><b>{t('Menu.rcc_F9_bold')}</b>{t('Menu.rcc_F9')}</p>

  </>

  const content_rc_not_static=<Accordion
    // className='accordion_new_welcome'
    // defaultActiveKey={'OS'}
    allowToggle
  >
    <AccordionItem
      // eventKey='OS'
    >
      <AccordionButton>
        <Box
          as='span'
          layerStyle='menuconfig_entry'
        >
          {t('Menu.rcc_titre_princ')}
        </Box>
        <AccordionIcon/>
      </AccordionButton>
      <AccordionPanel>
        <h5>{t('Menu.rcc_titre_select')}:</h5>
        <p><b>{t('Menu.rcc_cn_bold')}</b>{t('Menu.rcc_cn')}</p>
        <p><b>{t('Menu.rcc_ctrl_cn_bold')}</b>{t('Menu.rcc_ctrl_cn')}</p>
        <p><b>{t('Menu.rcc_cf_bold')}</b>{t('Menu.rcc_cf')}</p>
        <p><b>{t('Menu.rcc_ctrl_cf_bold')}</b>{t('Menu.rcc_ctrl_cf')}</p>
        <p><b>{t('Menu.rcc_cs_bold')}</b>{t('Menu.rcc_cs')}</p>
        <p><b>{t('Menu.rcc_click_and_drag_bold')}</b>{t('Menu.rcc_click_and_drag')}</p>
        <p><b>{t('Menu.rcc_cdn_bold')}</b>{t('Menu.rcc_cdn')}</p>
        <p><b>{t('Menu.rcc_ad_bold')}</b>{t('Menu.rcc_ad')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <h5>{t('Menu.rcc_titre_edi')} :</h5>

        <p><b>{t('Menu.rcc_e_cn_bold')}</b>{t('Menu.rcc_e_cn')}</p>
        <p><b>{t('Menu.rcc_e_ds_bold')}</b>{t('Menu.rcc_e_ds')}</p>
        <p><b>{t('Menu.rcc_e_dn_bold')}</b>{t('Menu.rcc_e_dn')}</p>

        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

        <h5>{t('Menu.rcc_titre_autre')} :</h5>

        <p><b>{t('Menu.rcc_a_s_bold')}</b>{t('Menu.rcc_a_s')}</p>
        <p><b>{t('Menu.rcc_a_fc_bold')}</b>{t('Menu.rcc_a_fc')}</p>
        <p><b>{t('Menu.rcc_a_dbm_bold')}</b>{t('Menu.rcc_a_dbm')}</p>
        <p><b>{t('Menu.rcc_a_ech_bold')}</b>{t('Menu.rcc_a_ech')}</p>
        <p><b>{t('Menu.rcc_ctrl_scrll_bold')}</b>{t('Menu.rcc_ctrl_scrll')}</p>
        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
      </AccordionPanel>
    </AccordionItem>


    {additional_shortcut_item}
  </Accordion>
  external_content['rc'] = windowSankey.SankeyToolsStatic?content_rc_static:content_rc_not_static

  const tmp=JSON.parse(JSON.stringify(exemple_menu))
  let list_template_data=[] as string[]
  // Si exemple_menu contient OpenSankey et que ce sous dossier contient les templates simple alors remple la liste des templates avec les modèle simples
  if(Object.keys(tmp).length!==0 && Object.keys(tmp).includes('OpenSankey') && Object.keys(tmp['OpenSankey']).includes('easy_template') ){
    list_template_data=tmp['OpenSankey']['easy_template'].filter((f:string)=>!f.includes('.xlsx'))
    // Si l'un des sous dossier d'OpenSankey dans exemple_menu est expert_template alors ajoute les modèles expert à la liste des modèles
    if( Object.keys(tmp['OpenSankey']).includes('expert_template') ){
      list_template_data.push(tmp['OpenSankey']['expert_template'])
      list_template_data=list_template_data.flat()
    }
  }
  return <Modal scrollable size='xl' show={show_wecome && !never_see_again.current} onHide={()=>{
    set_show_welcome(false)
  }}>
    <Modal.Header closeButton>
      <Modal.Title>{t('welcome.'+active_page)}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {external_content[active_page as 'read_me' | 'intro' | 'rc' | 'licence' | 'news']}
    </Modal.Body>

    <Modal.Footer style={{justifyContent:'center'}}>
      <Pagination >
        {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}

        <Pagination.Item active={active_page==='rc'} key={'rc'} onClick={()=>{
          set_active_page('rc')
        }}>
          {t('welcome.rc')}
        </Pagination.Item>

      </Pagination>
      <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again.current} onChange={evt=>{
        never_see_again.current = evt.target.checked
        localStorage.setItem('dontSeeAggainWelcome','1')
        set_show_welcome(false)
      }}/>
    </Modal.Footer>
  </Modal>
}

export const CardsTemplateBuilder = (
  exemple_menu : object,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  dict_variable_application_data : dict_variable_application_dataType,
  applicationContext : applicationContextType,
  Reinitialization: ()=>void,
  convert_data: ConvertDataFuncType
) => {
  const { t } = applicationContext
  const tmp=JSON.parse(JSON.stringify(exemple_menu))
  let list_template_data=[] as string[]
  // Si exemple_menu contient OpenSankey et que ce sous dossier contient les templates simple alors remple la liste des templates avec les modèle simples
  if(Object.keys(tmp).length!==0 && Object.keys(tmp).includes('OpenSankey') && Object.keys(tmp['OpenSankey']).includes('easy_template') ){
    list_template_data=tmp['OpenSankey']['easy_template'].filter((f:string)=>!f.includes('.xlsx'))
  // Si l'un des sous dossier d'OpenSankey dans exemple_menu est expert_template alors ajoute les modèles expert à la liste des modèles
  // if( applicationContext.token && Object.keys(tmp['OpenSankey']).includes('expert_template') ){ TODO
  //   list_template_data.push(tmp['OpenSankey']['expert_template'])
  //   list_template_data=list_template_data.flat()
  // }
  }

  return <>
    {list_template_data.map((_,idx) => {
      const title=_.split('.').splice(0,1).join('')
      return(
        <Col key={idx}>
          <Card>
            <Card.Img className='img-card' variant="top" src={'/fm/userfiles/Formations/Demos/OpenSankey/image_preview/'+title+'.png'} style={{'objectFit':'contain','minHeight':'350px','maxHeight':'500px'}} />
            <Card.Body>
              <Card.Title>{title.replaceAll('_',' ')}</Card.Title>
              <Card.Text>

              </Card.Text>
              <ButtonGroup>
                <Button variant='primary'
                  onClick={() => {
                    dict_variable_elements_selected.multi_selected_nodes.current = []
                    dict_variable_elements_selected.multi_selected_links.current = []
                    //dict_variable_elements_selected.multi_selected_label.current = [] TODO
                    const difficulty_file=(tmp['OpenSankey']['easy_template'].includes(list_template_data[idx]))?'easy_template':'expert_template'
                    UploadExemple(
                      'OpenSankey/'+difficulty_file+'/'+list_template_data[idx], applicationContext.url_prefix,
                      dict_variable_application_data.data,dict_variable_application_data.set_data as (d:SankeyData)=>void,
                      Reinitialization,convert_data ,dict_variable_application_data.get_default_data
                    )
                    dict_variable_application_data.set_data({...dict_variable_application_data.data})
                  }}>{t('useTemplate')}</Button>

                <Button variant='info'
                  onClick={() => {
                    dict_variable_elements_selected.multi_selected_nodes.current = []
                    dict_variable_elements_selected.multi_selected_links.current = []
                    //dict_variable_elements_selected.multi_selected_label.current = [] TODO
                    const difficulty_file=(tmp['OpenSankey']['easy_template'].includes(list_template_data[idx]))?'easy_template':'expert_template'
                    DownloadExempleExcel(
                      'OpenSankey/'+difficulty_file+'/'+list_template_data[idx]
                    )
                  }}>{t('dl')}</Button>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </Col>
      )}
    )}
  </>
}

export const welcomeModalBuilder = (
  t:TFunction,
  exemple_menu : object,
  dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType,
  never_see_again : MutableRefObject<boolean>,
  ref_setter_active_page : MutableRefObject<Dispatch<SetStateAction<string>>>
)=>{
  const [active_page,set_active_page] = useState((windowSankey.sankey && windowSankey.sankey.welcome_text)?'read_me':'intro')
  ref_setter_active_page.current = set_active_page

  const tmp=JSON.parse(JSON.stringify(exemple_menu))
  const additional_shortcut_item=[] as JSX.Element[]
  //additional_shortcut_item.push(SankeyPlusShortcut(t)) TODO
  let carousel_img=[] as string[]
  if(tmp['OpenSankey'] && tmp['OpenSankey']['carousel_img']){
    carousel_img=tmp['OpenSankey']['carousel_img']
  }
  const content_carousel=<Carousel variant='dark'> {
    carousel_img.map((_) => {
      const title=_.split('.').splice(0,1).join('')
      return (<Carousel.Item>
        <img alt={title} src={'/fm/userfiles/Formations/Demos/OpenSankey/image_carousel/'+_}   style={{'objectFit':'contain','width':'100%','height':'650px',display:'inline-block'}}   />
      </Carousel.Item>)
    })
  }</Carousel>

  const style_border='solid 1px grey'
  const src_intro_static = 'intro_static.png'

  // Content for welcome modal : Introduction
  const pagination_intro = <Pagination.Item active={active_page==='intro'} key={'intro'} onClick={()=>{
    set_active_page('intro')
  }}>
    {t('welcome.intro')}
  </Pagination.Item>

  const intro = <div>
    {windowSankey.SankeyToolsStatic ?<img src={src_intro_static} alt='intro carousel' style={{'objectFit':'contain','width':'100%'}}/>:content_carousel}
    <p>{t('Banner.hlp_1_txt_1')}</p>
    <table style={{'border':style_border,textAlign:'center'}}>
      {!windowSankey.SankeyToolsStatic?
        <>
          <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'danger'}><FaUser/></Button></td><td style={{'border':style_border}}>{t('welcome.9')}</td></tr>
          <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'info'}><FontAwesomeIcon icon={faArrowPointer} /></Button><Button size='sm' variant={'secondary'}><FontAwesomeIcon icon={faShareNodes} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.1')}</td></tr>
        </>:
        <></>
      }

      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'warning'}><FontAwesomeIcon icon={faFolderTree} /></Button></td><td style={{'border':style_border}}>{t('welcome.3')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'danger'}><FontAwesomeIcon icon={faSliders} /></Button></td><td style={{'border':style_border}}>{t('welcome.4')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsUpDown} /></Button><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsLeftRight} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.5')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FontAwesomeIcon icon={faDiagramProject} /></Button></td><td style={{'border':style_border}}>{t('welcome.6')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FaAngleDoubleLeft/></Button></td><td style={{'border':style_border}}>{t('welcome.10')}</td></tr>
      {(!windowSankey.SankeyToolsStatic /*|| (windowSankey.SankeyToolsStatic && data_plus.view.length!==0)*/)?
        <tr style={{'border':style_border}}>
          <td style={{'border':style_border}}>
            <ButtonGroup>
              <Button size='sm' variant={'light'}><FaHome/></Button>
              <Button size='sm' variant={'light'}><FaCaretSquareLeft/></Button>
              <Button size='sm' variant={'light'}><FaCaretSquareRight/></Button>
            </ButtonGroup>
          </td>
          <td>{t('welcome.view')}</td>
        </tr>:
        <></>
      }
      {windowSankey.SankeyToolsStatic && windowSankey.sankey && windowSankey.sankey.excel?
        <tr style={{'border':style_border}}>
          <td style={{'border':style_border}}>
            <Button variant='link'>{t('Banner.tl')}</Button>
          </td>
          <td style={{'border':style_border}}>{t('welcome.excel')}</td>
        </tr>:
        <></>
      }

    </table>
  </div>

  // Content for welcome modal : Licences explanation
  // const content_licence = <> TODO
  //   {/* OpenSankey */}
  //   <Row>
  //     <Col xs={3}>
  //       <img src={applicationContext.logo_OS} alt='logo_OS' style={{'objectFit':'contain','width':'250px'}}/>
  //     </Col>
  //     <Col style={{whiteSpace:'pre-line'}}>
  //       {t('Menu.presentation_OS')}
  //       <Button href="https://terriflux.com/downloads/open-sankey/" target="_blank" rel="noopener noreferrer">
  //         {t('desire_to_know_more')}
  //       </Button>
  //     </Col>
  //   </Row>
  //   <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
  //   {/* OpenSankey+ */}
  //   <Row>
  //     <Col style={{whiteSpace:'pre-line'}}>{t('Menu.presentation_OSP')}
  //       <Button href="https://terriflux.com/downloads/open-sankey-plus/" target="_blank" rel="noopener noreferrer">
  //         {t('desire_to_know_more')}
  //       </Button>
  //     </Col>
  //     <Col xs={3}><img src={applicationContext.logo_OSP} alt='logo_OSP' style={{'objectFit':'contain','width':'250px'}}/></Col>
  //   </Row>
  //   <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
  //   {/* SankeySuite */}
  //   <Row>
  //     <Col xs={3}><img src={applicationContext.logo_OSS} alt='logo_OSS' style={{'objectFit':'contain','width':'250px'}}/></Col>
  //     <Col style={{whiteSpace:'pre-line'}}>
  //       {t('Menu.presentation_OSS')}
  //       <Button href="https://terriflux.com/downloads/sankey-suite/" target="_blank" rel="noopener noreferrer">
  //         {t('desire_to_know_more')}
  //       </Button>
  //     </Col>
  //   </Row>
  // </>
  /* eslint-disable */
  // @ts-ignore
  // Content for welcome modal : Updates in Sankey app
/*  let image1 = require('../css/news_material/' + t('welcome.news_content.230803.image1'))
  let image2 = require('../css/news_material/' + t('welcome.news_content.230803.image2'))
  let image3 = require('../css/news_material/' + t('welcome.news_content.230803.image3'))
  let image4 = require('../css/news_material/' + t('welcome.news_content.230803.image4'))
  if ( !windowSankey.location.href.includes('localhost') ) {
    image1 = image1.replace('static/', 'static/sankeysuite/')
    image2 = image2.replace('static/', 'static/sankeysuite/')
    image3 = image3.replace('static/', 'static/sankeysuite/')
    image4 = image4.replace('static/', 'static/sankeysuite/')
  }

  let image_230908_1 = require('../css/news_material/' + t('welcome.news_content.230908.img1'))
  const image_230908_2 = require('../css/news_material/' + t('welcome.news_content.230908.img2'))
  let image_230908_3 = require('../css/news_material/' + t('welcome.news_content.230908.img3'))
  /* eslint-enable */
  // if ( !windowSankey.location.href.includes('localhost') ) {
  //   image_230908_1 = image_230908_1.replace('static/', 'static/sankeysuite/')
  //   image_230908_1 = image_230908_2.replace('static/', 'static/sankeysuite/')
  //   image_230908_3 = image_230908_2.replace('static/', 'static/sankeysuite/')

  // }
  // const content_news=<>
  //   <Accordion className='accordion_new_welcome' defaultActiveKey={'08-09-23'}>
  //     {/* New 08 Septembre 2023 */}
  //     <Accordion.Item eventKey='08-09-23'>
  //       <Accordion.Header>
  //         <Row>
  //           <h2>{t('welcome.news_content.230908.main_title')}</h2>
  //           <p><b>{t('welcome.news_content.230908.main_content')}</b></p>
  //         </Row>

  //       </Accordion.Header>
  //       <Accordion.Body>
  //         <h3>{t('welcome.news_content.230908.sub_title_1')}</h3>
  //         <p>{t('welcome.news_content.230908.sub_content_1')}</p>
  //         <Row >
  //           <Col xs={6}><img src={image_230908_1} alt='menu_config_node' style={{'objectFit':'contain','height':'450px'}}/></Col>
  //           <Col xs={6}><img src={image_230908_2} alt='menu config zdd' style={{'objectFit':'contain','height':'350px'}}/></Col>
  //         </Row>

  //         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
  //         <h3>{t('welcome.news_content.230908.sub_title_2')}</h3>
  //         <p>{t('welcome.news_content.230908.sub_content_2')}</p>
  //         <Row >
  //           <img src={image_230908_3} alt='menu_config_node' style={{'objectFit':'contain','width':'450px'}}/>
  //         </Row>
  //         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>

  //       </Accordion.Body>
  //     </Accordion.Item>


  //     {/* New 03 Août 2023 */}
  //     <Accordion.Item eventKey='03-09-23'>
  //       <Accordion.Header>
  //         <Row>
  //           <h2>{t('welcome.news_content.230803.main_title')}</h2>
  //           <p><b>{t('welcome.news_content.230803.main_content')}</b></p>
  //         </Row>

  //       </Accordion.Header>
  //       <Accordion.Body>
  //         <Row>
  //           <h3>{t('welcome.news_content.230803.sub_title_1')}</h3>
  //           <p>{t('welcome.news_content.230803.sub_content_1')}</p>
  //           <Col xs={3}><img src={image1} alt='Right clic nodes' style={{'objectFit':'contain','height':'250px'}}/></Col>
  //           <Col xs={3}><img src={image2} alt='Right clic links' style={{'objectFit':'contain','height':'250px'}}/></Col>
  //           <Col xs={6}><img src={image3} alt='Right clic background' style={{'objectFit':'contain','height':'250px'}}/></Col>
  //         </Row>
  //         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
  //         <Row>
  //           <h3>{t('welcome.news_content.230803.sub_title_2')}</h3>
  //           <p>{t('welcome.news_content.230803.sub_content_2')}</p>
  //           <Col xs={3}><img src={image4} alt='Selection zone' style={{'objectFit':'contain','height':'250px'}}/></Col>
  //         </Row>
  //         <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
  //         <Row>
  //           <h3>{t('welcome.news_content.230803.sub_title_3')}</h3>
  //           <p>{t('welcome.news_content.230803.sub_content_3')}</p>
  //         </Row>
  //       </Accordion.Body>
  //     </Accordion.Item>

  //   </Accordion>

    {/* <Row>
            <h2>{t('welcome.news_content.230803.main_title')}</h2>
            <p><b>{t('welcome.news_content.230803.main_content')}</b></p>
        </Row>
        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
        <Row>
            <h3>{t('welcome.news_content.230803.sub_title_1')}</h3>
            <p>{t('welcome.news_content.230803.sub_content_1')}</p>
            <Col xs={3}><img src={image1} alt='Right clic nodes' style={{'objectFit':'contain','height':'250px'}}/></Col>
            <Col xs={3}><img src={image2} alt='Right clic links' style={{'objectFit':'contain','height':'250px'}}/></Col>
            <Col xs={6}><img src={image3} alt='Right clic background' style={{'objectFit':'contain','height':'250px'}}/></Col>
        </Row>
        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
        <Row>
            <h3>{t('welcome.news_content.230803.sub_title_2')}</h3>
            <p>{t('welcome.news_content.230803.sub_content_2')}</p>
            <Col xs={3}><img src={image4} alt='Selection zone' style={{'objectFit':'contain','height':'250px'}}/></Col>
        </Row>
        <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }}/>
        <Row>
            <h3>{t('welcome.news_content.230803.sub_title_3')}</h3>
            <p>{t('welcome.news_content.230803.sub_content_3')}</p>
        </Row> */}
  // </>

  const pagination_read_me = (windowSankey.sankey && windowSankey.sankey.welcome_text)?
    <Pagination.Item active={active_page==='read_me'} key={'read_me'} onClick={()=>{
      set_active_page('read_me')}}>{t('welcome.read_me')}
    </Pagination.Item>:
    <></>

  const pagination_rc = windowSankey.SankeyToolsStatic?
    <></>:
    <Pagination.Item active={active_page==='licence'} key={'licence'} onClick={()=>{
      set_active_page('licence')
    }}>
      {t('welcome.licence')}
    </Pagination.Item>

  const pagination_news=<Pagination.Item active={active_page==='news'} key={'news'} onClick={()=>{
    set_active_page('news')
  }}>
    {t('welcome.news')}
  </Pagination.Item>

  const external_pagination=[
    pagination_read_me,
    pagination_intro,
    pagination_rc,
    pagination_news]

  const external_content={
    'read_me': windowSankey.sankey && windowSankey.sankey.welcome_text ? parse(windowSankey.sankey.welcome_text) :'',
    'intro':intro,
    'rc':<></>,
    //'licence':content_licence, TODO
    'news':<></>
  }

  return SankeyModalWelcome(
    t,
    active_page,
    set_active_page,
    dict_hook_ref_setter_show_dialog_components,
    never_see_again,
    additional_shortcut_item,
    external_pagination,
    external_content,
    exemple_menu
  )
}

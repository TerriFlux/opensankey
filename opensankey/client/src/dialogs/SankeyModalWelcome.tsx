// Standard lib
import React, {
  CSSProperties,
  useState
} from 'react'
import {
  CloseButton,
  Col,
  FormCheck,
  Modal,
  Pagination,
  Row,
} from 'react-bootstrap'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box
} from '@chakra-ui/react'


import { windowSankey } from '../configmenus/SankeyUtils'
import { SankeyModalWelcomeFType } from '../topmenus/types/SankeyMenuTopTypes'
import Draggable from 'react-draggable'
import * as d3 from 'd3'

export const SankeyModalWelcome : SankeyModalWelcomeFType = (
  t,
  active_page,
  set_active_page,
  dict_hook_ref_setter_show_dialog_components,
  never_see_again,
  additional_shortcut_item,
  external_pagination,
  external_content
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
    defaultIndex={0}
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
  



  const content=<div style={  {height:window.innerHeight*0.65,overflowY:'auto'}}>
    {external_content[active_page as 'read_me' | 'intro' | 'rc' | 'licence' | 'news']}
  </div>

  const welcome_footer=<Modal.Footer style={{justifyContent:'center'}}>
    <Pagination >
      {external_pagination.map((c,i)=>{return <React.Fragment key={i}>{c}</React.Fragment>})}
    </Pagination>
    <FormCheck type='checkbox' label={t('dontSeeAgain')} checked={never_see_again.current} onChange={evt=>{
      never_see_again.current = evt.target.checked
      localStorage.setItem('dontSeeAggainWelcome','1')
      dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current(false)
    }}/>
  </Modal.Footer>
  const class_name=t('welcome.'+active_page).replaceAll('/','').replaceAll('.','').replaceAll('\'','').split(' ').join('_')
  const n_style_menu_draggable=JSON.parse(JSON.stringify(style_menu_draggable)) as CSSProperties
  n_style_menu_draggable.width='75%'

  return <Draggable  handle='.title_menu'
    defaultPosition={{x:window.innerWidth/8,y:window.innerHeight*0.12}}
    bounds={{left:0,top:0}}
    onStart={()=>{d3.selectAll('.menu_conf').style('z-index','1')
      d3.select('.menu_conf.'+class_name).style('z-index','1031')
    }}
  >
    <div hidden={!show_wecome || never_see_again.current} className={'menu_conf '+class_name}
      style={n_style_menu_draggable}
    >
      <Row className='title_menu' style={{'borderBottom':' 1px solid #eceeef','lineHeight':'1.5rem','zIndex':'3','backgroundColor':'white','position':'sticky','top':'0','padding':'1rem'}}>
        <Col><h3>{t('welcome.'+active_page)}</h3></Col>
        <Col className='text-end'>{<CloseButton onClick={()=>{
          dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current(false)}}/>}</Col>
      </Row>
      <div className='sankey-menu'>
        {content}
      </div>
      {welcome_footer}
    </div>
  </Draggable>

}


const style_menu_draggable={'display':'flex',
  width:'25%',
  'paddingLeft':'0.75rem',
  'paddingRight':'0.75rem',
  'position': 'fixed',
  'flexDirection': 'column',
  'backgroundColor': '#fff',
  'backgroundClip': 'padding-box',
  'border': '1px solid rgba(0, 0, 0, 0.2)',
  'borderRadius':' 0.6rem',
  'zIndex':'1031',

} as CSSProperties
import React, { useState, useEffect, useRef} from 'react'
import { Popover, Form,Pagination,Button,ButtonGroup,Carousel} from 'react-bootstrap'

import { useBeforeunload } from 'react-beforeunload'
import LZString from 'lz-string'

import SankeyDraw from './SankeyDraw'
import Menu, { OpenSankeyMenus,OpenSankeyModalWelcome} from './SankeyMenu'
import { SankeySettingsEditionElementTags } from './SankeyMenuConfigurationTags'
import * as SankeyUtils from './SankeyUtils'
import {OpenSankeyConfigurationsMenus} from './SankeyMenuConfiguration'
import {OpenSankeyConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {OpenSankeyMenuConfigurationNodes} from './SankeyMenuConfigurationNodes'
import {OpenSankeyMenuConfigurationLinks} from './SankeyMenuConfigurationLinks'
import {OpenSankeyMenuConfigurationLegend} from './SankeyMenuConfigurationLegend'
import { linkTooltipsContent, nodeTooltipsContent } from './SankeyTooltip'
import { useTranslation } from 'react-i18next'
import { SankeyData, SankeyLink, SankeyNode } from './types'
import { OpenSankeyMenuConfigurationLayout } from './SankeyMenuConfigurationLayout'
import { keyHandler } from './SankeyDraw'
import { OpenSankeyDrawNodes } from './SankeyDrawNodes'
import { OpenSankeyDrawLinks } from './SankeyDrawLinks'
import { OpenSankeyDrawLegend } from './SankeyDrawLegend'
import { OpenSankeyDrawNodesLabel } from './SankeyDrawNodesLabel'
//import {SankeyPlusModalStyleLink,SankeyPlusModalStyleNode} from 'sankeyanimation/dist/SankeyPlusStyle'
import {addSimpleLevelDropDown,  setDiagram, toolbar_builder} from './SankeyMenuBanner'
import ModalPreference,{OpenSankeyDefaultModalePreferenceContent} from './SankeyMenuPreferences'
import {linkStroke, min_width_and_height,drawArrows} from './SankeyDrawFunction'
import i18next from './traduction'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes, faArrowPointer,faFilter,faFolderTree, faDiagramProject,faArrowsLeftRight,faArrowsUpDown } from '@fortawesome/free-solid-svg-icons'
import { FaAngleDoubleLeft,FaUser} from 'react-icons/fa'

type SankeyAppTypes = {
  initial_sankey_data : SankeyData
  exemple_menu        : object
  formations_menu      : object
  logo: string,
  logo_terriflux: string,
  logo_OS:string,
  logo_OSP:string,
  logo_OSS:string,

}

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
  sankey: {
    sankey_data_file:RequestInfo
    sous_filieres : { [ key : string ] : string }
    units: string[]
    flask_logo? : string
    flask_header? : string
    logo_width? : number
    legend_average : string
    legend_uncert : string
    help_text : string
    welcome_text: string
    excel : string
    logo: string,
    advanced: boolean
  }
}

export const SankeyApp = ({initial_sankey_data,exemple_menu,formations_menu,logo,logo_terriflux,logo_OS,logo_OSP,logo_OSS} : SankeyAppTypes) => {
  exemple_menu

  //- All
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [style_to_apply, set_style_to_apply] = useState('default')
  const mode_selection= useRef('s')
  const selected_link = useRef(SankeyUtils.default_link(initial_sankey_data))
  const selected_node = useRef(SankeyUtils.default_node(initial_sankey_data))
  const multi_selected_nodes = useRef([])
  const multi_selected_links = useRef([])
  const button_ref = useRef<HTMLLabelElement>(null)
  const accordion_ref = useRef<HTMLDivElement>(null)
  const links_accordion_ref = useRef<HTMLDivElement>(null)
  const nodes_accordion_ref = useRef<HTMLDivElement>(null)
  const [data,set_data] = useState<SankeyData>(initial_sankey_data)
  const [show_nav,set_show_nav] = useState(false)
  const [show_modal_welcome,set_show_modal_welcome]=useState(true)
  const [never_see_again,set_never_see_again]=useState((localStorage.getItem('dontSeeAggainWelcome')==='1'))
  const multi_selected_label = useRef([])
  const [show_modale_tuto,set_show_modale_tuto]=useState(false)
  const [show_modale_support,set_show_modale_support]=useState(false)


  // For SankeyDraw
  const [alt_key_pressed,set_alt_key_pressed] = useState(false)

  const [first_selected_node,set_first_selected_node] = useState({})
  const [show_agregation, set_show_agregation] = useState(false)
  const [agregation_node, set_agregation_node] = useState('')
  const [is_agregation, set_is_agregation] = useState(true)

  // For OpenSankeyConfigurationsMenus
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')

  //For OpenSankeyMenuConfigurationLegend
  const [legend_position, set_legend_position] = useState(data.legend_position)

  // For OpenSankeyMenuConfigurationLayout
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [maximum_flux, set_maximum_flux] = useState(data.maximum_flux)
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)

  // For OpenSankeyMenuConfigurationNodes
  const [link_io,set_link_io]=useState<string>('output')
  const [link_pos,set_link_pos]=useState<string>('right')
  const [tab_colored,set_tab_colored]=useState<boolean>(false)


  // For OpenSankeyMenuConfigurationLinks
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data.fluxTags).length > 0 ? Object.keys(data.fluxTags)[0] : '')
  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const dataTagsSelected = Object.fromEntries(newEntries)
  const [tags_selected, set_tags_selected] = useState(dataTagsSelected)
  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }
  const [displayed_value,set_displayed_value]=useState('')
  const [display_link_opacity,set_display_link_opacity]=useState('0')




  //- Processess
  const [processing,setProcessing] = useState(false)
  const [failure,setFailure] = useState(false)
  const [not_started,setNotStarted] = useState(true)
  const [result,setResult] = useState('')
  const [path,setPath] = useState('')

  //- Modals and Dialogs
  // const [welcome_text,set_welcome_text] = useState(window.sankey ? window.sankey.welcome_text : '')
  const [show_draw, set_show_draw] = useState(false)
  const [show_load,set_show_load] = useState(false)
  const [show_excel_dialog, set_show_excel_dialog] = useState(false)
  const [show_apply_layout, set_show_apply_layout] = useState(false)
  const [show_save_json, set_show_save_json] = useState(false)
  const [showPreference, setShowPreference] = useState(false)
  //Modal et fonctions pour l'édition et affectation des styles de noeud
  // const [showStyle,setShowStyle] = useState(false)
  const showStyleEdition = () => null
  //Modal et fonctions pour l'edition et affectation des style de flux
  const showStyleEditionLink = () => null
  const [show_publish_dialog,set_show_publish_dialog] = useState(false)
  const [show_modalTemplate, set_show_modalTemplate] = useState(false)

  //- Styles
  const selected_style_node = useState('default')[0]


  const {t} =useTranslation()

  //Réinitialise data et vide les noeud/flux sélectionnés
  const reinitialization = () => {
    const data = SankeyUtils.default_sankey_data()
    multi_selected_nodes.current = []
    multi_selected_links.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('initial_data')
    set_legend_position(data.legend_position)
    set_data({ ...data })
  }

  const launch = (path:string) => {
    setPath(path)
    set_show_load(true)
    setProcessing(true)
    setFailure(true)
    setNotStarted(false)
  }

  const tmp=JSON.parse(JSON.stringify(exemple_menu))

  let carousel_img=[] as string[]
  if(tmp['OpenSankey'] && tmp['OpenSankey']['carousel_img']){
    carousel_img=tmp['OpenSankey']['carousel_img']
  }
  const content_carousel=<Carousel variant='dark' >
    {carousel_img.map((_) =>
    {
      const title=_.split('.').splice(0,1).join('')
      return (<Carousel.Item>
        <img alt={title} src={'/fm/userfiles/OpenSankey/image_carousel/'+_}   style={{'objectFit':'contain','width':'100%','height':'650px',display:'inline-block'}}   />
        {/* <Carousel.Caption style={{display:'inline-block'}}><p>{title.replaceAll('_',' ')}</p></Carousel.Caption> */}
      </Carousel.Item>)
    })
    }</Carousel>


  const [active_page,set_active_page]=useState('intro')
  const style_border='solid 1px grey'
  const src_intro_static = 'intro_static.png'
  const node_filter = Object.entries(data.nodeTags).filter(([, v]) => v.banner !== 'none' && v.banner !== 'level').length > 0
  const flux_filter = Object.entries(data.fluxTags).filter(([, v]) => v.banner !== 'none').length > 0
  const buttons_filter=<>{(node_filter)?<Button size='sm' variant='light'>{t('Menu.Noeuds')}</Button>:<></>}
  
    {(flux_filter)?<Button size='sm' variant='light' >{t('Menu.flux')}</Button>:<></>}
    {(Object.values(data.dataTags).length>0)?<Button size='sm' variant='light'>{t('Banner.data')}</Button>:<></>}</>

  const intro=<div>
    {/* <img src='/fm/userfiles/OpenSankey/image_carousel/intro.png' alt='intro carousel' style={{'objectFit':'contain','width':'100%'}}/> */}
    {window.SankeyToolsStatic ?<img src={src_intro_static} alt='intro carousel' style={{'objectFit':'contain','width':'100%'}}/>:content_carousel}
    <p>{t('Banner.hlp_1_txt_1')}</p>
    <table style={{'border':style_border,textAlign:'center'}} >
      {!window.SankeyToolsStatic?<>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'danger'}><FaUser/></Button></td><td style={{'border':style_border}}>{t('welcome.9')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'info'}><FontAwesomeIcon icon={faArrowPointer} /></Button><Button size='sm' variant={'secondary'}><FontAwesomeIcon icon={faShareNodes} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.1')}</td></tr>
        {/* <tr style={{'border':style_border}}><td style={{'border':style_border}}>&nbsp;</td><td style={{'border':style_border}}>{t('welcome.8')}</td></tr> */}
      </>:<></>}   
        
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'warning'}><FontAwesomeIcon icon={faFolderTree} /></Button></td><td style={{'border':style_border}}>{t('welcome.3')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'danger'}><FontAwesomeIcon icon={faFilter} /></Button></td><td style={{'border':style_border}}>{t('welcome.4')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsUpDown} /></Button><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsLeftRight} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.5')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FontAwesomeIcon icon={faDiagramProject} /></Button></td><td style={{'border':style_border}}>{t('welcome.6')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'info'}> ?</Button></td><td style={{'border':style_border}}>{t('welcome.7')}</td></tr>
      <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FaAngleDoubleLeft/></Button></td><td style={{'border':style_border}}>{t('welcome.10')}</td></tr>
      {window.SankeyToolsStatic && window.sankey && window.sankey.excel?<tr style={{'border':style_border}}><td style={{'border':style_border}}><Button variant='link'>{t('Banner.tl')}</Button></td><td style={{'border':style_border}}>{t('welcome.excel')}</td></tr>:<></>}
      <tr style={{'border':style_border}}><td style={{'border':style_border}}>{buttons_filter}</td><td style={{'border':style_border}}>{t('welcome.2')}</td></tr>
        
    </table>
  </div>
  
  const pagination_intro=<Pagination.Item active={active_page==='intro'} key={'intro'} onClick={()=>{
    set_active_page('intro')
  }}>Introduction
  </Pagination.Item>

  const external_pagination=[pagination_intro]
  const external_content={'intro':intro} 

  const intro_modal=!window.SankeyToolsStatic?OpenSankeyModalWelcome(t,active_page,set_active_page,show_modal_welcome,set_show_modal_welcome,never_see_again,set_never_see_again,[],external_pagination,external_content,exemple_menu,logo_OS,logo_OSP,logo_OSS):<></>


  //- 1. Builds Configuration Menus
  //- 1.1 Builds Configuration Menus Layout
  const menu_configuration_layout = OpenSankeyMenuConfigurationLayout(t,data,set_data,user_scale,set_user_scale,maximum_flux,set_maximum_flux,node_hspace,set_node_hspace,node_vspace,set_node_vspace)
  //- 1.2 Builds Configuration Menus Node
  //- 1.2.1 Builds Configuration Menus Node Attributes
  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(t,data,set_data,multi_selected_nodes,false,selected_style_node)
  const menu_configuration_nodes = OpenSankeyMenuConfigurationNodes(t,data,set_data,multi_selected_nodes,menu_configuration_nodes_attributes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,SankeyUtils.getLinkValue)
  //- 1.2.1 Builds Configuration Menus Node Tags
  const menu_configuration_nodes_tags=<SankeySettingsEditionElementTags
    t={t}
    data={data}
    set_data={set_data}
    elementTagNameProp='nodeTags'
    elementNameProp='nodes'/>

  //- 1.3 Builds Configuration Menus Links
  //- 1.3.1 Builds Configuration Menus Link Attributes
  const menu_configuration_links = OpenSankeyMenuConfigurationLinks(data,set_data,selected_link,multi_selected_links,t,tags_group_key,set_tags_group_key,tags_selected,set_tags_selected,[],displayed_value,set_displayed_value,[],display_link_opacity,set_display_link_opacity)
  //- 1.3.2 Builds Configuration Menus Link tags
  const  menu_configuration_link_tags=<SankeySettingsEditionElementTags
    t={t}
    data={data}
    set_data={set_data}
    elementTagNameProp='fluxTags'
    elementNameProp='links'/>
  //- 1.4 Builds Configuration Menus DataTags
  const  menu_configuration_data_tags=<SankeySettingsEditionElementTags
    t={t}
    data={data}
    set_data={set_data}
    elementTagNameProp='dataTags'
    elementNameProp='links' />
  //- 1.5 Builds Configuration Menus FreeLabel
  // const menu_configuration_free_labels=OpenSankeyMenuConfigurationFreeLabels(data,set_data,multi_selected_label,t,forceUpdate,setForceUpdate)
  //- 1.6 Builds Configuration Menus Legend

  const menu_configuration_legends=  OpenSankeyMenuConfigurationLegend(data,set_data,t,legend_position,set_legend_position)
  //- End of 1.
  const configurations_menus =  OpenSankeyConfigurationsMenus(
    t,
    data, set_data,
    nav_item_active,set_nav_item_active,
    nodes_accordion_ref,links_accordion_ref,
    selected_node,multi_selected_nodes,multi_selected_links,selected_link,
    style_to_apply,set_style_to_apply,set_show_nav,
    menu_configuration_layout,menu_configuration_nodes_tags, menu_configuration_link_tags, menu_configuration_data_tags,
    menu_configuration_nodes,menu_configuration_links,<></>,menu_configuration_legends,sub_nav_item_active,set_sub_nav_item_active,
    false,true,set_displayed_value,tags_selected,set_tags_selected,set_display_link_opacity
  )

  //- 2. Build Menus
  const sankey_menus = OpenSankeyMenus(
    t,setShowPreference,reinitialization,SankeyUtils.default_sankey_data,set_show_apply_layout,set_show_excel_dialog,
    set_show_save_json,showStyleEdition,showStyleEditionLink,
    set_show_modal_welcome,set_never_see_again,data,set_data,'',set_show_modalTemplate,set_show_modale_support,[],[]
  )
  // sankey_menus['formation']=<DropdownButton title={t('Menu.Formations')} id="formation" >
  //   <ExempleItem
  //     exemple_menu={formations_menu as unknown as Validator<ReactElementLike> | Validator<{ [x: string]: ReactElementLike; }>}
  //     data={data}
  //     set_data={set_data}
  //     current_path={'Formations'}
  //     url_prefix=''
  //     multi_selected_links={multi_selected_links}
  //     multi_selected_nodes={multi_selected_nodes}
  //     launch={launch}
  //     reinitialization={reinitialization}
  //   /></DropdownButton >
  // sankey_menus['formation']=<Button variant='light' onClick={()=>set_show_modale_tuto(true)}>{t('menuTuto')}</Button>
  sankey_menus['formation']=<>{()=>set_show_modale_tuto(true)}</>

  
  // 2.4 Modal linked to menu item
  const external_menu_modal=[] as JSX.Element[]
  const regular_ui=OpenSankeyDefaultModalePreferenceContent(t,data,set_data,i18next)

  //const modale_style_link=SankeyPlusModalStyleLink(t,data,set_data,showStyleLink,setShowStyleLink,selected_link,selected_style_link,set_selected_style_link,false,[])
  //const modale_style_node=SankeyPlusModalStyleNode(t,data,set_data,showStyle,setShowStyle,selected_style_node,set_selected_style_node,false)

  const elments_of_modale_preference=Object.values(regular_ui).map(d=>{
    return d
  })
  const modale_preference=<ModalPreference
    showPreference={showPreference}
    setShowPreference={setShowPreference}
    ui={elments_of_modale_preference}
  />
  // external_menu_modal.push(modale_style_link)
  // external_menu_modal.push(modale_style_node)
  external_menu_modal.push(modale_preference)
  external_menu_modal.push(intro_modal)

  const func_current_filter=(
    new_current_filter: number
  ) => {
    const { display_style } = data
    display_style.filter = +new_current_filter
    set_data({ ...data })
  }
  Object.values(data.nodeTags).filter(tag_group=>tag_group.banner==='level').forEach(tag_group=>tag_group.activated = false)
  if ('Primaire' in data.nodeTags && data.nodeTags['Primaire'].activated === false) {
    data.nodeTags['Primaire'].activated = true
  }
  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const detail_level=
    <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{t('Banner.ndd')}</Popover.Header>
      <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>

        <table>{(Object.entries(data.nodeTags).filter(([, v]) => v.banner === 'level').length > 0) ? (<>
          {addSimpleLevelDropDown(t,data,set_data)}</>
        ) : (<>
          <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)}</table>
      </Popover.Body>
    </Popover>
  const {filter}=data.display_style
  const toolbar = toolbar_builder(t,data,set_data,mode_selection,user_scale,set_user_scale,filter,func_current_filter,detail_level,'',first_selected_node,set_first_selected_node,min_width_and_height,setDiagram,set_show_modalTemplate,set_never_see_again)
  Object.keys(toolbar).forEach(k=>{
    sankey_menus[k]=toolbar[k]
  })

  //-3. Sankey Draws
  useBeforeunload((event : BeforeUnloadEvent) => {
    event.preventDefault()
    localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  })
  const select_node=(n: SankeyNode) => {
    selected_node.current = n
  }

  const select_link=(l: SankeyLink) => {
    selected_link.current = l
  }
  const node_arrow_visible=(data:SankeyData,n: SankeyNode) => !n.node_visible || (n.inputLinksId.length === 0) || (!data.links[n.inputLinksId[0]].arrow) ? false : true
  const position = data.static_sankey ? 'relative' : 'absolute'


  // let alt_key_pressed = false

  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,data,multi_selected_nodes,multi_selected_links,set_data,accordion_ref,button_ref,set_show_nav,mode_selection)
  }

  // Call the function that add nodes to the sankey
  OpenSankeyDrawNodes(data,set_data,
    nodes_accordion_ref,links_accordion_ref,
    multi_selected_nodes,multi_selected_links,
    mode_selection,
    first_selected_node,set_first_selected_node,
    accordion_ref,button_ref,
    set_agregation_node,set_is_agregation,set_show_agregation,
    select_node,
    alt_key_pressed,
    data.static_sankey,
    position,nodeTooltipsContent,SankeyUtils.link_text,min_width_and_height,SankeyUtils.getLinkValue,multi_selected_label)

  OpenSankeyDrawNodesLabel(data,set_data,multi_selected_nodes,SankeyUtils.getLinkValue)

  // Call the function that add links to the sankey
  OpenSankeyDrawLinks(
    data,links_accordion_ref,
    multi_selected_links,
    mode_selection,
    accordion_ref,
    button_ref,
    select_link,
    alt_key_pressed,
    data.static_sankey,position,node_arrow_visible,
    linkTooltipsContent,
    SankeyUtils.link_text,SankeyUtils.getLinkValue,set_data,set_displayed_value,tags_selected,set_tags_selected,linkStroke,drawArrows,set_display_link_opacity
  )


  OpenSankeyDrawLegend(data,SankeyUtils.getLinkValue,t)
  //Event listener sur les touche du clavier
  //Réagis à :
  //-Flêches qui déplace les noeuds sélectionnés
  //-Echape qui ferme la navbar
  //-Ctrl+S qui sauvegarde une vue
  //document.onkeydown = formatKeyHandler
  document.onkeydown = formatKeyHandler

  //const tmp=JSON.parse(JSON.stringify(exemple_menu))
  // let list_template_data=[] as string[]

  // if(Object.keys(tmp).length!=0 && Object.keys(tmp).includes('OpenSankey') ){
  //   list_template_image=tmp['OpenSankey']['Image']
  //   list_template_data=tmp['OpenSankey']['Files'].filter((f:string)=>!f.includes('.xlsx'))
  // }
  const cardsTemplate=
  <>
    {/* {list_template_image.map((_,idx) =>
    {
      // let tmp_template=''
      // try {
      //   tmp_template=require('../images/'+list_template_image[idx])
      // } catch (expt) {
      //   console.log('images '+list_template_image[idx]+' for template not found')
      // }
      const title=_.split('_')
      title.splice(-1,1)
      return(
        <Col>
          <Card>
            <Card.Img className='img-card' variant="top" src={'/fm/userfiles/OpenSankey/image_preview/'+list_template_image[idx]} style={{'objectFit':'contain','minHeight':'350px','maxHeight':'500px'}} />
            <Card.Body>
              <Card.Title>{title.join(' ')}</Card.Title>
              <Card.Text>

              </Card.Text>
              <Button variant='primary'
                onClick={() => {
                  multi_selected_nodes.current = []
                  multi_selected_links.current = []
                  multi_selected_label.current = []
                  SankeyUtils.uploadExemple(
                    'OpenSankey/sankey/'+list_template_data[idx], '', data, set_data
                  )
                  set_data({...data})
                }

                }
              >Use this template</Button>
            </Card.Body>
          </Card>
        </Col>
      )})} */}
  </>
  const d= (
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <>
        <Menu
          t={t}
          data={data}
          set_data={set_data}
          default_sankey_data={SankeyUtils.default_sankey_data}
          show_nav={show_nav}
          set_show_nav={set_show_nav}
          nav_item_active={nav_item_active}
          callback={()=>null}
          path={path}
          launch={launch}
          url_prefix={ ''}
          logo={!window.SankeyToolsStatic ? logo.replace('static/', 'static/opensankey/') : window.sankey.logo as string}
          logo_terriflux={!window.SankeyToolsStatic ? logo_terriflux.replace('static/', 'static/opensankey/') : ''}
          logo_width={!window.SankeyToolsStatic ? 100 : window.sankey.logo_width}
          app_name={!window.SankeyToolsStatic ? 'Pré-version 1.0' : ''}
          mode_selection={mode_selection}
          style_to_apply={style_to_apply}
          set_style_to_apply={set_style_to_apply}

          selected_node={selected_node}
          accordion_ref={accordion_ref as {current : HTMLDivElement}}
          button_ref={button_ref as {current : HTMLLabelElement}}
          show_load={show_load}
          set_show_load={set_show_load}
          processing={processing}
          setProcessing={setProcessing}
          failure={failure}
          setFailure={setFailure}
          not_started={not_started}
          setNotStarted={setNotStarted}
          result={result}
          setResult={setResult}
          configurations_menus={configurations_menus}
          menus={sankey_menus}
          show_excel_dialog={show_excel_dialog}
          show_apply_layout={show_apply_layout}
          show_save_json={show_save_json}
          showPreference={showPreference}
          show_publish_dialog={show_publish_dialog}

          set_show_excel_dialog={set_show_excel_dialog}
          set_show_apply_layout={set_show_apply_layout}
          set_show_save_json={set_show_save_json}
          setShowPreference={setShowPreference}
          set_show_publish_dialog={set_show_publish_dialog}
          cardsTemplate={cardsTemplate}
          // set_welcome_text={set_welcome_text}
          show_modalTemplate={show_modalTemplate}
          set_show_modalTemplate={set_show_modalTemplate}
          token={false}
          useNavigate={()=>''}
          external_modal={external_menu_modal}
          loginOut={()=>null}
          unsetTokens={()=>null}
          // modalShortcut={shortcut_modale}
          min_width_and_height={min_width_and_height}
          name_user={''}
          formations_menu={formations_menu}
          reinitialization={reinitialization}
          set_show_modale_tuto={set_show_modale_tuto}
          show_modale_tuto={show_modale_tuto}
          show_modale_support={show_modale_support}
          set_show_modale_support={set_show_modale_support}
        />
        {//Ajout d'un delay pour laisser le temps au Menu de render pour ensuite utiliser sa hauteur afin d'ajouter un margin top au draw
        }
        {useEffect(() => {
          const timer = setTimeout(() => {
            set_show_draw(true)
          }, 100)
          return () => clearTimeout(timer)
        }, [])}
        {
          (show_draw ) ? (<SankeyDraw
            data={data}
            set_data={set_data}
            animation={false}
            multi_selected_nodes={multi_selected_nodes}
            multi_selected_links={multi_selected_links}
            mode_selection={mode_selection}
            first_selected_node={first_selected_node}
            set_first_selected_node={set_first_selected_node}
            show_agregation={show_agregation}
            set_show_agregation={set_show_agregation}
            agregation_node={agregation_node}
            is_agregation={is_agregation}
            set_alt_key_pressed={set_alt_key_pressed}
            min_width_and_height={min_width_and_height}
            getLinkValue={SankeyUtils.getLinkValue}
            token={true}
            set_show_toast_limit_node={()=>false}
          />) : (<></>)}
        {/* <Modal
          bsSize="large"
          show={welcome_text !== undefined && welcome_text !== ''}
          onHide={()=>{
            set_welcome_text('')
          }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Modal.Header closeButton>
            <Modal.Title>Lisez Moi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {welcome_text ? parse(welcome_text) : ''}
            <Button
              onClick={()=>{
                set_welcome_text('')
              }}
            >J&apos;ai lu</Button>
          </Modal.Body>
        </Modal> */}
      </>
    </div>
  )


  return (
    d

  )
}

export default SankeyApp




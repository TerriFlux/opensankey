import React, { useState, useEffect, useRef} from 'react'
import { Popover, Form,Pagination,Button,ButtonGroup,Carousel} from 'react-bootstrap'

import { useBeforeunload } from 'react-beforeunload'
import LZString from 'lz-string'
import * as d3 from 'd3'

import SankeyDraw from './SankeyDraw'
import Menu, { OpenSankeyMenus,OpenSankeyModalWelcome,context_menu_node,context_menu_link,menu_draggable,context_zdd} from './SankeyMenu'
import { SankeySettingsEditionElementTags } from './SankeyMenuConfigurationTags'
import * as SankeyUtils from './SankeyUtils'
import {OpenSankeyConfigurationsMenus} from './SankeyMenuConfiguration'
import {OpenSankeyConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {OpenSankeyMenuConfigurationNodes} from './SankeyMenuConfigurationNodes'
import {OpenSankeyMenuConfigurationLinks} from './SankeyMenuConfigurationLinks'
import { linkTooltipsContent, nodeTooltipsContent } from './SankeyTooltip'
import { useTranslation } from 'react-i18next'
import { SankeyData, SankeyLink, SankeyNode } from './types'
import { OpenSankeyMenuConfigurationLayout } from './SankeyMenuConfigurationLayout'
import { keyHandler } from './SankeyDraw'
import { OpenSankeyDrawNodes } from './SankeyDrawNodes'
import { OpenSankeyDrawLinks } from './SankeyDrawLinks'
import { OpenSankeyDrawLegend } from './SankeyDrawLegend'
import { OpenSankeyDrawNodesLabel } from './SankeyDrawNodesLabel'
import {addSimpleLevelDropDown,  setDiagram, toolbar_builder} from './SankeyMenuBanner'
import ModalPreference,{OpenSankeyDefaultModalePreferenceContent} from './SankeyMenuPreferences'
import {linkStroke, min_width_and_height,drawArrows,eventOnSankeyZoneMouseDown,eventOnSankeyZoneMouseMove,eventOnSankeyZoneMouseUp,zoom_function} from './SankeyDrawFunction'
import i18next from './traduction'
import { updateLayout } from './SankeyLayout'
import {SankeyMenuConfigurationNodesIO} from './SankeyMenuConfigurationNodesIO'

import {SankeyMenuConfigurationLinksData} from './SankeyMenuConfigurationLinksData'
import {SankeyMenuConfigurationLinksAppearence} from './SankeyMenuConfigurationLinksAppearence'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes, faArrowPointer,faFilter,faFolderTree, faDiagramProject,faArrowsLeftRight,faArrowsUpDown } from '@fortawesome/free-solid-svg-icons'
import { FaAngleDoubleLeft} from 'react-icons/fa'
import { return_value_link } from './SankeyUtils'
import { convert_data } from './SankeyConvert'
import { OpenSankeyDiagramSelector } from './SankeyMenuDialogs'

type SankeyAppTypes = {
  initial_sankey_data : SankeyData
  exemple_menu        : object
  formations_menu      : object
  logo: string,
  logo_terriflux: string,
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

export const SankeyApp = ({initial_sankey_data,exemple_menu,formations_menu,logo,logo_terriflux} : SankeyAppTypes) => {
  exemple_menu

  //- All
  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [style_to_apply, set_style_to_apply] = useState('default')
  const mode_selection= useRef('s')
  // const selected_link = useRef(SankeyUtils.default_link(initial_sankey_data))
  const multi_selected_nodes = useRef([])
  const multi_selected_links = useRef([])
  const button_ref = useRef<HTMLLabelElement>(null)
  const accordion_ref = useRef<HTMLDivElement>(null)
  const links_accordion_ref = useRef<HTMLDivElement>(null)
  const nodes_accordion_ref = useRef<HTMLDivElement>(null)
  const [data,pre_set_data] = useState<SankeyData>(initial_sankey_data)
  const [show_nav,set_show_nav] = useState(false)
  const [show_modal_welcome,set_show_modal_welcome]=useState(true)
  const [never_see_again,set_never_see_again]=useState((localStorage.getItem('dontSeeAggainWelcome')==='1'))
  const [show_modale_tuto,set_show_modale_tuto]=useState(false)
  const [show_modale_support,set_show_modale_support]=useState(false)
  const set_data=(ndata:SankeyData)=>{
    set_user_scale(ndata.user_scale)
    if(ndata.legend_position!==legend_position){
      set_legend_position(ndata.legend_position)
    }

    if(data.maximum_flux && data.minimum_flux && data.minimum_flux>data.maximum_flux){
      data.maximum_flux=data.minimum_flux
      set_maximum_flux(data.minimum_flux)
    }
    pre_set_data({...ndata})
  }
  const [contextualised_node,set_contextualised_node]=useState<SankeyNode>()
  const [contextualised_link,set_contextualised_link]=useState<SankeyLink>()
  const [show_context_zdd,set_show_context_zdd]=useState(false)
  const pointer_pos=useRef([0,0])
  // For SankeyDraw
  const [alt_key_pressed,set_alt_key_pressed] = useState(false)
  const start_point=useRef([0,0])

  const [first_selected_node,set_first_selected_node] = useState({})
  const [show_agregation, set_show_agregation] = useState(false)
  const [agregation_node, set_agregation_node] = useState('')
  const [is_agregation, set_is_agregation] = useState(true)
  const accept_simple_click=useRef(true)

  // For OpenSankeyConfigurationsMenus
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')

  
  const [show_menu_node_apparence,set_show_menu_node_apparence]=useState(false)
  const [show_menu_node_io,set_show_menu_node_io]=useState(false)

  const [show_menu_link_data,set_show_menu_link_data]=useState(false)
  const [show_menu_link_appearence,set_show_menu_link_appearence]=useState(false)

  const [show_menu_layout,set_show_menu_layout]=useState(false)

  //For OpenSankeyMenuConfigurationLegend
  const [legend_position, set_legend_position] = useState(data.legend_position)

  // For OpenSankeyMenuConfigurationLayout
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [maximum_flux, set_maximum_flux] = useState(data.maximum_flux)
  const [minimum_flux, set_minimum_flux] = useState(data.minimum_flux)
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
  const [displayed_input_link_value,set_displayed_input_link_value]=useState('')
  const [display_link_opacity,set_display_link_opacity]=useState('0')




  //- Processess
  const [processing,setProcessing] = useState(false)
  const [failure,setFailure] = useState(false)
  const [not_started,setNotStarted] = useState(true)
  const [result,setResult] = useState('')
  const [path,setPath] = useState('')

  //- Modals and Dialogs
  const [show_load,set_show_load] = useState(false)
  const [show_excel_dialog, set_show_excel_dialog] = useState(false)
  const [show_apply_layout, set_show_apply_layout] = useState(false)
  const [show_save_json, set_show_save_json] = useState(false)
  const [showPreference, setShowPreference] = useState(false)
  //Modal et fonctions pour l'édition et affectation des styles de noeud
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
    {window.SankeyToolsStatic ?<img src={src_intro_static} alt='intro carousel' style={{'objectFit':'contain','width':'100%'}}/>:content_carousel}
    <p>{t('Banner.hlp_1_txt_1')}</p>
    <table style={{'border':style_border,textAlign:'center'}} >
      <tbody>
        {!window.SankeyToolsStatic?<>
          <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'info'}><FontAwesomeIcon icon={faArrowPointer} /></Button><Button size='sm' variant={'secondary'}><FontAwesomeIcon icon={faShareNodes} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.1')}</td></tr>
        </>:<></>}   
          
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'warning'}><FontAwesomeIcon icon={faFolderTree} /></Button></td><td style={{'border':style_border}}>{t('welcome.3')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'danger'}><FontAwesomeIcon icon={faFilter} /></Button></td><td style={{'border':style_border}}>{t('welcome.4')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsUpDown} /></Button><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsLeftRight} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.5')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FontAwesomeIcon icon={faDiagramProject} /></Button></td><td style={{'border':style_border}}>{t('welcome.6')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'info'}> ?</Button></td><td style={{'border':style_border}}>{t('welcome.7')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FaAngleDoubleLeft/></Button></td><td style={{'border':style_border}}>{t('welcome.10')}</td></tr>
        {window.SankeyToolsStatic && window.sankey && window.sankey.excel?<tr style={{'border':style_border}}><td style={{'border':style_border}}><Button variant='link'>{t('Banner.tl')}</Button></td><td style={{'border':style_border}}>{t('welcome.excel')}</td></tr>:<></>}
        <tr style={{'border':style_border}}><td style={{'border':style_border}}>{buttons_filter}</td><td style={{'border':style_border}}>{t('welcome.2')}</td></tr>
      </tbody>
    </table>
  </div>
  
  const pagination_intro=<Pagination.Item active={active_page==='intro'} key={'intro'} onClick={()=>{
    set_active_page('intro')
  }}>Introduction
  </Pagination.Item>

  const external_pagination=[pagination_intro]
  const external_content={'intro':intro} 

  const intro_modal=!window.SankeyToolsStatic?OpenSankeyModalWelcome(t,active_page,set_active_page,show_modal_welcome,set_show_modal_welcome,never_see_again,set_never_see_again,[],external_pagination,external_content,exemple_menu):<></>


  //- 1. Builds Configuration Menus
  //- 1.1 Builds Configuration Menus Layout
  const menu_configuration_layout = OpenSankeyMenuConfigurationLayout(t,data,set_data,user_scale,set_user_scale,legend_position,set_legend_position)
  //- 1.2 Builds Configuration Menus Node
  //- 1.2.1 Builds Configuration Menus Node Attributes
  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(t,data,set_data,multi_selected_nodes,false,selected_style_node,set_style_to_apply,[],[],[])
  const menu_configuration_nodes = OpenSankeyMenuConfigurationNodes(t,data,set_data,multi_selected_nodes,menu_configuration_nodes_attributes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,SankeyUtils.getLinkValue,multi_selected_links,set_display_link_opacity)
  //- 1.2.1 Builds Configuration Menus Node Tags
  const menu_configuration_nodes_tags=<SankeySettingsEditionElementTags
    t={t}
    data={data}
    set_data={set_data}
    elementTagNameProp='nodeTags'
    elementNameProp='nodes'/>

  //- 1.3 Builds Configuration Menus Links
  //- 1.3.1 Builds Configuration Menus Link Attributes
  const menu_configuration_links = OpenSankeyMenuConfigurationLinks(data,set_data,multi_selected_links,t,tags_group_key,set_tags_group_key,tags_selected,set_tags_selected,[],displayed_input_link_value,set_displayed_input_link_value,[],display_link_opacity,set_display_link_opacity)
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

  //- End of 1.
  const configurations_menus =  OpenSankeyConfigurationsMenus(
    t,
    data, set_data,
    nav_item_active,set_nav_item_active,
    nodes_accordion_ref,links_accordion_ref,
    multi_selected_nodes,multi_selected_links,
    style_to_apply,set_style_to_apply,set_show_nav,
    menu_configuration_layout,menu_configuration_nodes_tags, menu_configuration_link_tags, menu_configuration_data_tags,
    menu_configuration_nodes,menu_configuration_links,<></>,sub_nav_item_active,set_sub_nav_item_active,
    true,set_displayed_input_link_value,tags_selected,set_tags_selected,set_display_link_opacity
  )

  //- 2. Build Menus
  const sankey_menus = OpenSankeyMenus(
    t,setShowPreference,reinitialization,SankeyUtils.default_sankey_data,set_show_apply_layout,set_show_excel_dialog,
    set_show_save_json,showStyleEdition,showStyleEditionLink,
    set_show_modal_welcome,set_never_see_again,data,set_data,set_show_modalTemplate,set_show_modale_support,[],[],set_tags_selected,convert_data
  )

  sankey_menus['formation']=<>{()=>set_show_modale_tuto(true)}</>

  
  // 2.4 Modal linked to menu item
  const external_menu_modal=[] as JSX.Element[]
  const regular_ui=OpenSankeyDefaultModalePreferenceContent(t,data,set_data,i18next)

  const elments_of_modale_preference=Object.values(regular_ui).map(d=>{
    return d
  })
  const modale_preference=<ModalPreference
    showPreference={showPreference}
    setShowPreference={setShowPreference}
    ui={elments_of_modale_preference}
  />
  external_menu_modal.push(modale_preference)
  external_menu_modal.push(intro_modal)

  const func_current_filter=(
    new_current_filter: number
  ) => {
    const { display_style } = data
    display_style.filter = +new_current_filter
    set_data({ ...data })
  }
  Object.values(data.levelTags).forEach(tag_group=>tag_group.activated = false)
  if ('Primaire' in data.levelTags && data.levelTags['Primaire'].activated === false) {
    data.levelTags['Primaire'].activated = true
  }
  const opacity_advanced =  !window.SankeyToolsStatic ? '0.3' : '0'
  const detail_level=
    <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{t('Banner.ndd')}</Popover.Header>
      <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>
      
        <>{(Object.entries(data.levelTags).length > 0) ? (<>
          {addSimpleLevelDropDown(t,data,set_data)}</>
        ) : (<>
          <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)}</>
      </Popover.Body>
    </Popover>
  const {filter}=data.display_style
  const toolbar = toolbar_builder(t,data,set_data,mode_selection,user_scale,set_user_scale,filter,func_current_filter,detail_level,'',first_selected_node,set_first_selected_node,min_width_and_height,setDiagram,set_show_modalTemplate,set_never_see_again,convert_data,maximum_flux,set_maximum_flux,minimum_flux,set_minimum_flux)
  Object.keys(toolbar).forEach(k=>{
    sankey_menus[k]=toolbar[k]
  })

  //-3. Sankey Draws
  useBeforeunload((event : BeforeUnloadEvent) => {
    event.preventDefault()
    localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  })

  // const select_link=(l: SankeyLink) => {
  //   selected_link.current = l
  // }
  const node_arrow_visible=(data:SankeyData,n: SankeyNode) => !SankeyUtils.node_displayed(data,n) || (n.inputLinksId.length === 0) || (!(return_value_link(data,data.links[n.inputLinksId[0]],'arrow'))) ? false : true
  const position = (window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ? 'relative' : 'absolute'


  const closeAllMenuContext=()=>{
    set_contextualised_node(undefined)
    set_contextualised_link(undefined)
    set_show_context_zdd(false)
  }
  // Function to close all menu : menu confugartion, menu context (nodes,links, drawZone), an menu dragggable
  // Called when we press escape   
  const closeAllMenu=()=>{
    set_show_nav(false)
    set_show_menu_node_apparence(false)
    set_show_menu_node_io(false)
    set_show_menu_link_data(false)
    set_show_menu_link_appearence(false)
    set_show_menu_layout(false)
    set_show_apply_layout(false)


    closeAllMenuContext()

  }
  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,data,multi_selected_nodes,multi_selected_links,set_data,accordion_ref,button_ref,mode_selection,
      closeAllMenu
    )
  }
  useEffect(()=>{
  // Call the function that add nodes to the sankey
    OpenSankeyDrawNodes(data,set_data,
      nodes_accordion_ref,links_accordion_ref,
      multi_selected_nodes,multi_selected_links,
      mode_selection,
      first_selected_node,set_first_selected_node,
      accordion_ref,button_ref,
      alt_key_pressed,
      nodeTooltipsContent,SankeyUtils.link_text,SankeyUtils.getLinkValue,
      // multi_selected_label,
      set_displayed_input_link_value,accept_simple_click,set_contextualised_node,pointer_pos)

    OpenSankeyDrawNodesLabel(data,set_data,multi_selected_nodes,SankeyUtils.getLinkValue,accept_simple_click)

    // Call the function that add links to the sankey
    OpenSankeyDrawLinks(
      data,links_accordion_ref,
      multi_selected_links,
      mode_selection,
      accordion_ref,
      button_ref,
      
      alt_key_pressed,
      position,node_arrow_visible,
      linkTooltipsContent,
      SankeyUtils.link_text,SankeyUtils.getLinkValue,set_data,set_displayed_input_link_value,tags_selected,set_tags_selected,linkStroke,drawArrows,set_display_link_opacity,
      set_contextualised_link,pointer_pos
    )


    OpenSankeyDrawLegend(data,set_data,SankeyUtils.getLinkValue,t)
  })
 
  //Event listener sur les touche du clavier
  //Réagis à :
  //-Flêches qui déplace les noeuds sélectionnés
  //-Echape qui ferme la navbar
  //-Ctrl+S qui sauvegarde une vue
  document.onkeydown = formatKeyHandler


  const cardsTemplate=
  <>
  </>





  // =================DRAGGABEL MENU + CONTEXT MENU=============================
  
  // MENU DRAGGABLE NODE ATTR
  const menu_node_attr=menu_configuration_nodes_attributes
  const dragNodeAttr=show_menu_node_apparence?menu_draggable(menu_node_attr,pointer_pos,t('Menu.Noeuds')+' '+t('Noeud.apparence.apparence'),set_show_menu_node_apparence):<></>

  // MENU DRAGGABLE NODE IO
  if(show_menu_node_io && multi_selected_nodes.current.length!==1){
    set_show_menu_node_io(false)
  }
  const menu_node_io=multi_selected_nodes.current.length==1?SankeyMenuConfigurationNodesIO(t,data,set_data,multi_selected_nodes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,SankeyUtils.getLinkValue,multi_selected_links,set_display_link_opacity,true):<></>
  const dragNodeIO=show_menu_node_io?menu_draggable(menu_node_io,pointer_pos,t('Menu.Noeuds')+' '+t('Noeud.PF.PFM'),set_show_menu_node_io):<></>

    



    
  const context_n=context_menu_node(contextualised_node,set_contextualised_node,data,set_data,multi_selected_nodes,multi_selected_links,t,
    set_show_menu_node_apparence,set_show_menu_node_io,
    set_agregation_node,set_is_agregation,set_show_agregation,
    set_display_link_opacity,
    pointer_pos,[])


  // MENU DRAGGABLE LINK DATA
  const menu_link_data=SankeyMenuConfigurationLinksData(data,tags_selected,set_tags_selected,multi_selected_links,set_data,t,[],displayed_input_link_value,set_displayed_input_link_value,true)
  const dragLink_data=show_menu_link_data?menu_draggable(menu_link_data,pointer_pos,t('Menu.flux')+' '+t('Flux.data.données'),set_show_menu_link_data):<></>


  // MENU DRAGGABLE LINK APPEARENCE
  const menu_link_appearence=SankeyMenuConfigurationLinksAppearence(data,multi_selected_links,set_data,t,[],false,'default',display_link_opacity,set_display_link_opacity,true)
  const dragLink_appearence=show_menu_link_appearence?menu_draggable(menu_link_appearence,pointer_pos,t('Menu.flux')+' '+t('Flux.apparence.apparence'),set_show_menu_link_appearence):<></>

  const context_l=context_menu_link(contextualised_link,set_contextualised_link,
    set_show_menu_link_data,set_show_menu_link_appearence
    ,data,set_data,tags_selected,multi_selected_links,t,pointer_pos)

  // MENU DRAGGABLE LAYOUT
  menu_configuration_layout
  const drag_menu_layout=show_menu_layout?menu_draggable(menu_configuration_layout,pointer_pos,t('Menu.MEP'),set_show_menu_layout):<></>
    

  const context_for_zdd=context_zdd(show_context_zdd,set_show_context_zdd,data,set_data,pointer_pos,node_hspace,set_node_hspace,node_vspace,set_node_vspace,t,set_show_menu_layout)



  const d= (
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <>
        <div className='div-Menu'>
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
            logo={!window.SankeyToolsStatic ? logo: window.sankey.logo as string}
            logo_terriflux={!window.SankeyToolsStatic ? logo_terriflux: ''}
            logo_width={!window.SankeyToolsStatic ? 100 : window.sankey.logo_width}
            app_name={!window.SankeyToolsStatic ? 'Pré-version 1.0' : ''}
            mode_selection={mode_selection}
            style_to_apply={style_to_apply}
            set_style_to_apply={set_style_to_apply}

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
            show_modalTemplate={show_modalTemplate}
            set_show_modalTemplate={set_show_modalTemplate}
            external_modal={external_menu_modal}
            min_width_and_height={min_width_and_height}
            formations_menu={formations_menu}
            reinitialization={reinitialization}
            set_show_modale_tuto={set_show_modale_tuto}
            show_modale_tuto={show_modale_tuto}
            show_modale_support={show_modale_support}
            set_show_modale_support={set_show_modale_support}
            additional_nav_item={[] as JSX.Element[]}
            set_contextualised_node={set_contextualised_node}
            set_contextualised_link={set_contextualised_link}
            set_show_context_zdd={set_show_context_zdd}
            updateLayout={updateLayout}
            convert_data={convert_data}
            node_hspace={node_hspace}
            set_node_hspace={set_node_hspace}
            node_vspace={node_vspace}
            set_node_vspace={set_node_vspace}
            apply_transformation_additional_elements={()=>[]}
            DiagramSelector={OpenSankeyDiagramSelector}
          />
        </div>
        {//Ajout d'un delay pour laisser le temps au Menu de render pour ensuite utiliser sa hauteur afin d'ajouter un margin top au draw
        }
        {useEffect(() => {
          // Zoom Behavior
          const svgSankey = d3.select('.opensankey #svg');
          (svgSankey as d3.Selection<Element, unknown, HTMLElement, unknown>)
            .call(d3.zoom()
              .filter(ev => { // Permet d'obliger Crtl pour activer le zoom
                return (ev.ctrlKey || ev.metaKey) && ev.buttons == 0
              })
              .wheelDelta(ev => { // Permet de regler la vitesse du zoom
                return -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002)
              })
              .on('zoom', function (evt) {
                zoom_function(evt,data)
              }))
            .on('dblclick.zoom', null)

          
          const timer = setTimeout(() => {
            // set_show_draw(true)
            SankeyUtils.adjust_sankey_zone(data,min_width_and_height)
          }, 100)
          return () => clearTimeout(timer)
        }, [])}
        
        <SankeyDraw
          data={data}
          set_data={set_data}
          animation={false}
          mode_selection={mode_selection}
          show_agregation={show_agregation}
          set_show_agregation={set_show_agregation}
          agregation_node={agregation_node}
          set_agregation_node={set_agregation_node}
          is_agregation={is_agregation}
          set_alt_key_pressed={set_alt_key_pressed}
          min_width_and_height={min_width_and_height}
          // additional_draw_element={[]}
          pointer_pos={pointer_pos}
          set_show_context_zdd={set_show_context_zdd}
        />
        {dragNodeAttr}
        {dragNodeIO}

        {dragLink_data}
        {dragLink_appearence}
        
        {drag_menu_layout}

        {context_n}
        {context_l}
        {context_for_zdd}
      </>
    </div>
  )

  // Wait a delay before adding the event for the element to be created, because otherwise the d3 selection return nothing
  setTimeout(() => {
    //Ajout des events sur les l'ajout des noeuds aux click
    const svgSankey=d3.select('.opensankey #svg')
    svgSankey.on('mousedown',evt=>{
      eventOnSankeyZoneMouseDown(mode_selection,data,set_data,set_first_selected_node,true,()=>false,evt,start_point,closeAllMenuContext)
    })
    svgSankey.on('mousemove',evt=>{
      eventOnSankeyZoneMouseMove(mode_selection,data,first_selected_node,set_first_selected_node,evt,start_point)
    })
    svgSankey.on('mouseup',evt=>{
      eventOnSankeyZoneMouseUp(mode_selection,data,set_data,multi_selected_nodes,multi_selected_links,first_selected_node,set_first_selected_node,true,()=>false,accordion_ref,button_ref,links_accordion_ref,set_displayed_input_link_value,evt,start_point)
    })
  }, 100)
  
  return (
    d

  )
}

export default SankeyApp




import React, { useState, useEffect, useRef} from 'react'
import { Popover, Form,Pagination,Button,ButtonGroup,Carousel} from 'react-bootstrap'

import * as d3 from 'd3'

import SankeyDraw from './SankeyDraw'
import Menu, { OpenSankeyMenus,OpenSankeyModalWelcome,ContextMenuNode,ContextMenuLink,MenuDraggable,ContextZdd,OpenSankeySaveButton,LastCheckpointTime} from './SankeyMenu'
import { SankeySettingsEditionElementTags } from './SankeyMenuConfigurationTags'
import * as SankeyUtils from './SankeyUtils'
import {OpenSankeyConfigurationsMenus} from './SankeyMenuConfiguration'
import {OpenSankeyConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {OpenSankeyMenuConfigurationNodes} from './SankeyMenuConfigurationNodes'
import {OpenSankeyMenuConfigurationLinks} from './SankeyMenuConfigurationLinks'
import { LinkTooltipsContent, NodeTooltipsContent } from './SankeyTooltip'
import { useTranslation } from 'react-i18next'
import { SankeyData, SankeyLink, SankeyNode, showMenuComponentsType } from './types'
import { OpenSankeyMenuConfigurationLayout } from './SankeyMenuConfigurationLayout'
import { keyHandler } from './SankeyDraw'
import { OpenSankeyDrawNodes } from './SankeyDrawNodes'
import { OpenSankeyDrawLinks } from './SankeyDrawLinks'
import { OpenSankeyDrawLegend,context_legend_tags,drag_legend } from './SankeyDrawLegend'
import { OpenSankeyDrawNodesLabel } from './SankeyDrawNodesLabel'
import {addSimpleLevelDropDown,  setDiagram, toolbar_builder} from './SankeyMenuBanner'
import ModalPreference,{OpenSankeyDefaultModalePreferenceContent} from './SankeyMenuPreferences'
import {LinkStroke,
  GetSankeyMinWidthAndHeight,
  DrawArrows,
  EventOnSankeyZoneMouseDown,
  EventOnSankeyZoneMouseMove,
  EventOnSankeyZoneMouseUp,
  ZoomFunction,
  RepositionneSidebar} from './SankeyDrawFunction'
import i18next from './traduction'
import { updateLayout } from './SankeyLayout'
import {SankeyMenuConfigurationNodesIO} from './SankeyMenuConfigurationNodesIO'

import {SankeyMenuConfigurationLinksData} from './SankeyMenuConfigurationLinksData'
import {SankeyMenuConfigurationLinksAppearence} from './SankeyMenuConfigurationLinksAppearence'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareNodes, faArrowPointer,faSliders,faFolderTree, faDiagramProject,faArrowsLeftRight,faArrowsUpDown } from '@fortawesome/free-solid-svg-icons'
import { FaAngleDoubleLeft} from 'react-icons/fa'
import { ReturnValueLink } from './SankeyUtils'
import { convert_data } from './SankeyConvert'
import { OpenSankeyDiagramSelector } from './SankeyMenuDialogs'
import { SankeyPlusModalStyleLink,SankeyPlusModalStyleNode} from './SankeyStyle'
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
  const multi_selected_nodes = useRef([])
  const multi_selected_links = useRef([])
  const button_ref = useRef<HTMLLabelElement>(null)
  const accordion_ref = useRef<HTMLDivElement>(null)
  const links_accordion_ref = useRef<HTMLDivElement>(null)
  const nodes_accordion_ref = useRef<HTMLDivElement>(null)
  const [data,pre_set_data] = useState<SankeyData>(initial_sankey_data)

  const [never_see_again,set_never_see_again]=useState((localStorage.getItem('dontSeeAggainWelcome')==='1'))

  const [elementToDispose, ] = useState([''])
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

  const pointer_pos=useRef([0,0])
  const [tag_contextualised,set_tag_contextualised]=useState<string>()

  // For SankeyDraw
  const [alt_key_pressed,set_alt_key_pressed] = useState(false)
  const start_point=useRef([0,0])

  const [first_selected_node,set_first_selected_node] = useState({})

  const [agregation_node, set_agregation_node] = useState('')
  const [is_agregation, set_is_agregation] = useState(true)
  const accept_simple_click=useRef(true)

  const show_nav = useState(false)
  const show_menu_node_apparence=useState(false)
  const show_menu_node_io=useState(false)
  const show_menu_link_data=useState(false)
  const show_menu_link_appearence=useState(false)
  const show_menu_layout=useState(false)
  const show_modal_welcome=useState(false)
  const show_modale_tuto=useState(false)
  const show_modale_support=useState(false)
  const show_agregation=useState(false)
  const show_context_zdd=useState(false)
  const show_excel_dialog=useState(false)
  const show_save_json=useState(false)
  const show_apply_layout= useState(false)
  const ShowPreference = useState(false)
  const show_modalTemplate= useState(false)
  const show_welcome=useState(false)
  const show_load=useState(false)
  // For OpenSankeyConfigurationsMenus
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
  const showMenuComponents : showMenuComponentsType = {
    show_nav: show_nav,
    show_menu_node_apparence : show_menu_node_apparence,
    show_menu_node_io : show_menu_node_io,
    show_menu_link_data : show_menu_link_data,
    show_menu_link_appearence : show_menu_link_appearence,
    show_menu_layout : show_menu_layout,
    show_modal_welcome : show_modal_welcome,
    show_modale_tuto : show_modale_tuto,
    show_modale_support : show_modale_support,
    show_agregation : show_agregation,
    show_context_zdd : show_context_zdd,
    show_excel_dialog : show_excel_dialog,
    show_save_json : show_save_json,
    show_apply_layout :  show_apply_layout,
    ShowPreference  : ShowPreference,
    show_modalTemplate : show_modalTemplate,
    show_welcome : show_welcome,
    show_load : show_load
  }

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
  const [is_computing,setIsComputing]=useState(false)


  //Modal et fonctions pour l'édition et affectation des styles de noeud
  // Modal et fonctions pour l'edition et affectation des style de flux
  const [showStyleLink, setShowStyleLink] = useState(false)
  const [showStyle, setShowStyle] = useState(false)

  const [selected_style_link, set_selected_style_link] = useState('default')
  const [selected_style_node, set_selected_style_node] = useState('default')

  const showStyleEditionLink = () => {
    setShowStyleLink(true)
  }

  const showStyleEdition = () => {
    setShowStyle(true)
  }

  //- Styles
  const {t} =useTranslation()

  //Réinitialise data et vide les noeud/flux sélectionnés
  const Reinitialization = () => {
    const data = SankeyUtils.DefaultSankeyData()
    multi_selected_nodes.current = []
    multi_selected_links.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('last_save')
    set_legend_position(data.legend_position)
    set_data({ ...data })
  }

  const launch = (path:string) => {
    setPath(path)
    showMenuComponents.show_load[1](true)
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



  const intro=<div>
    {window.SankeyToolsStatic ?<img src={src_intro_static} alt='intro carousel' style={{'objectFit':'contain','width':'100%'}}/>:content_carousel}
    <p>{t('Banner.hlp_1_txt_1')}</p>
    <table style={{'border':style_border,textAlign:'center'}} >
      <tbody>
        {!window.SankeyToolsStatic?<>
          <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'info'}><FontAwesomeIcon icon={faArrowPointer} /></Button><Button size='sm' variant={'secondary'}><FontAwesomeIcon icon={faShareNodes} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.1')}</td></tr>
        </>:<></>}

        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'warning'}><FontAwesomeIcon icon={faFolderTree} /></Button></td><td style={{'border':style_border}}>{t('welcome.3')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'danger'}><FontAwesomeIcon icon={faSliders} /></Button></td><td style={{'border':style_border}}>{t('welcome.4')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><ButtonGroup><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsUpDown} /></Button><Button size='sm' variant={'dark'}><FontAwesomeIcon icon={faArrowsLeftRight} /></Button></ButtonGroup></td><td style={{'border':style_border}}>{t('welcome.5')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FontAwesomeIcon icon={faDiagramProject} /></Button></td><td style={{'border':style_border}}>{t('welcome.6')}</td></tr>
        <tr style={{'border':style_border}}><td style={{'border':style_border}}><Button size='sm' variant={'success'}><FaAngleDoubleLeft/></Button></td><td style={{'border':style_border}}>{t('welcome.10')}</td></tr>
        {window.SankeyToolsStatic && window.sankey && window.sankey.excel?<tr style={{'border':style_border}}><td style={{'border':style_border}}><Button variant='link'>{t('Banner.tl')}</Button></td><td style={{'border':style_border}}>{t('welcome.excel')}</td></tr>:<></>}
      </tbody>
    </table>
  </div>

  const pagination_intro=<Pagination.Item active={active_page==='intro'} key={'intro'} onClick={()=>{
    set_active_page('intro')
  }}>Introduction
  </Pagination.Item>

  const external_pagination=[pagination_intro]
  const external_content={'intro':intro}

  const intro_modal=!window.SankeyToolsStatic?OpenSankeyModalWelcome(
    t,active_page,set_active_page,showMenuComponents,never_see_again,set_never_see_again,[],external_pagination,external_content,exemple_menu
  ):<></>


  //- 1. Builds Configuration Menus
  //- 1.1 Builds Configuration Menus Layout
  const menu_configuration_layout = OpenSankeyMenuConfigurationLayout(t,data,set_data,user_scale,set_user_scale,legend_position,set_legend_position,<></>)
  //- 1.2 Builds Configuration Menus Node
  //- 1.2.1 Builds Configuration Menus Node Attributes
  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(t,data,set_data,multi_selected_nodes,false,selected_style_node,set_style_to_apply,[],[],[])
  const menu_configuration_nodes = OpenSankeyMenuConfigurationNodes(t,data,set_data,multi_selected_nodes,menu_configuration_nodes_attributes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,SankeyUtils.GetLinkValue,multi_selected_links,set_display_link_opacity)
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
    set_style_to_apply,showMenuComponents,
    menu_configuration_layout,menu_configuration_nodes_tags, menu_configuration_link_tags, menu_configuration_data_tags,
    menu_configuration_nodes,menu_configuration_links,<></>,sub_nav_item_active,set_sub_nav_item_active,
    true,set_displayed_input_link_value,tags_selected,set_tags_selected,set_display_link_opacity
  )

  //- 2. Build Menus
  const sankey_menus = OpenSankeyMenus(
    t,Reinitialization,
    SankeyUtils.DefaultSankeyData,
    showMenuComponents,
    showStyleEdition,
    showStyleEditionLink,
    set_never_see_again,
    data,set_data,
    [],[],[],
    set_tags_selected,
    convert_data
  )

  // 2.4 Modal linked to menu item
  const external_menu_modal=[] as JSX.Element[]
  const regular_ui=OpenSankeyDefaultModalePreferenceContent(t,data,set_data,i18next)

  const elments_of_modale_preference=Object.values(regular_ui).map(d=>{
    return d
  })
  const modale_preference=<ModalPreference
    showPreference={showMenuComponents.ShowPreference[0]}
    setShowPreference={showMenuComponents.ShowPreference[1]}
    ui={elments_of_modale_preference}
    t={t}
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
  const toolbar = toolbar_builder(t,data,set_data,mode_selection,user_scale,set_user_scale,filter,func_current_filter,detail_level,'',first_selected_node,set_first_selected_node,GetSankeyMinWidthAndHeight,setDiagram,showMenuComponents.show_modalTemplate[1],set_never_see_again,convert_data,maximum_flux,set_maximum_flux,minimum_flux,set_minimum_flux,SankeyUtils.DefaultSankeyData)
  Object.keys(toolbar).forEach(k=>{
    sankey_menus[k]=[toolbar[k]]
  })

  //-3. Sankey Draws
  // useBeforeunload((event : BeforeUnloadEvent) => {
  //   event.preventDefault()
  //   localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  // })


  const node_arrow_visible=(data:SankeyData,n: SankeyNode) => !SankeyUtils.NodeDisplayed(data,n) || (n.inputLinksId.length === 0) || (!(ReturnValueLink(data,data.links[n.inputLinksId[0]],'arrow'))) ? false : true
  const position = (window.SankeyToolsStatic ? window.SankeyToolsStatic : false) ? 'relative' : 'absolute'


  const closeAllMenuContext=()=>{
    set_contextualised_node(undefined)
    set_contextualised_link(undefined)
    set_tag_contextualised(undefined)
    showMenuComponents.show_context_zdd[1](false)
  }
  // Function to close all menu : menu confugartion, menu context (nodes,links, drawZone), an menu dragggable
  // Called when we press escape
  const closeAllMenu=()=>{
    showMenuComponents.show_nav[1](false),
    showMenuComponents.show_menu_node_apparence[1](false)
    showMenuComponents.show_menu_node_io[1](false)
    showMenuComponents.show_menu_link_data[1](false)
    showMenuComponents.show_menu_link_appearence[1](false)
    showMenuComponents.show_menu_layout[1](false)
    showMenuComponents.show_apply_layout[1](false)


    closeAllMenuContext()

  }
  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,data,multi_selected_nodes,multi_selected_links,set_data,mode_selection,
      closeAllMenu
    )
  }

  // Add event listener on the resize of window (can happen when we move the window to a different screen with different format) to reposition the sidebar
  /* eslint-disable */
    // @ts-ignore
    addEventListener('resize',()=>{
      RepositionneSidebar(showMenuComponents.show_nav[0])
      })
      /* eslint-enable */

  const display_nodes = Object.keys(data.nodes)
    .filter((key) => SankeyUtils.NodeDisplayed(data,data.nodes[key]))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.nodes[key]
      })
    }, {}) as {[idNode:string]:SankeyNode}
  const pre_display_links=Object.keys(data.links)
    .filter((key) => data.links[key].idSource in display_nodes && data.links[key].idTarget in display_nodes)
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.links[key]
      })
    }, {}) as {[idLink:string]:SankeyLink}
  const pre_link_key=Object.keys(pre_display_links)
  const display_links={} as {[idLink:string]:SankeyLink}
  data.linkZIndex.filter(lk=>pre_link_key.includes(lk)).forEach(lk=>display_links[lk]=pre_display_links[lk])
  useEffect(()=>{
    // Call the function that add nodes to the sankey
    OpenSankeyDrawNodes(data,set_data,
      display_nodes,display_links,
      nodes_accordion_ref,links_accordion_ref,
      multi_selected_nodes,multi_selected_links,
      mode_selection,
      first_selected_node,set_first_selected_node,
      accordion_ref,button_ref,
      alt_key_pressed,
      NodeTooltipsContent,SankeyUtils.LinkText,SankeyUtils.GetLinkValue,
      set_displayed_input_link_value,accept_simple_click,set_contextualised_node,pointer_pos)

    OpenSankeyDrawNodesLabel(data,set_data,multi_selected_nodes,SankeyUtils.GetLinkValue)

    // Call the function that add links to the sankey
    OpenSankeyDrawLinks(
      data,
      display_nodes,
      display_links,
      links_accordion_ref,
      multi_selected_links,
      mode_selection,
      accordion_ref,
      button_ref,

      alt_key_pressed,
      position,node_arrow_visible,
      LinkTooltipsContent,
      SankeyUtils.LinkText,SankeyUtils.GetLinkValue,set_data,set_displayed_input_link_value,tags_selected,set_tags_selected,LinkStroke,DrawArrows,set_display_link_opacity,
      set_contextualised_link,pointer_pos
    )


    OpenSankeyDrawLegend(data,set_data,SankeyUtils.GetLinkValue,t,pointer_pos,set_tag_contextualised)
    const g_legend=d3.select(' .opensankey #g_legend .drag_zone_leg') as d3.Selection<SVGGElement,unknown,HTMLElement,unknown>
    if(!window.SankeyToolsStatic){
      g_legend.call(drag_legend(data,set_data))
    }
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
  const dragNodeAttr=showMenuComponents.show_menu_node_apparence[0]?MenuDraggable(menu_node_attr,pointer_pos,t('Menu.Noeuds')+' '+t('Noeud.apparence.apparence'),showMenuComponents.show_menu_node_apparence[1]):<></>

  // MENU DRAGGABLE NODE IO
  if(showMenuComponents.show_menu_node_io[0] && multi_selected_nodes.current.length!==1){
    showMenuComponents.show_menu_node_io[1](false)
  }
  const menu_node_io=SankeyMenuConfigurationNodesIO(t,data,set_data,multi_selected_nodes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,SankeyUtils.GetLinkValue,multi_selected_links,set_display_link_opacity,true)
  const dragNodeIO=showMenuComponents.show_menu_node_io[0]?MenuDraggable(menu_node_io,pointer_pos,t('Menu.Noeuds')+' '+t('Noeud.PF.PFM'),showMenuComponents.show_menu_node_io[1]):<></>

  const context_n=ContextMenuNode(
    contextualised_node,set_contextualised_node,
    data,set_data,display_nodes,display_links,multi_selected_nodes,multi_selected_links,
    t,
    showMenuComponents,
    set_agregation_node,set_is_agregation,
    set_display_link_opacity,
    pointer_pos,[],[])


  // MENU DRAGGABLE LINK DATA
  const menu_link_data=SankeyMenuConfigurationLinksData(data,tags_selected,set_tags_selected,multi_selected_links,set_data,t,[],displayed_input_link_value,set_displayed_input_link_value,true)
  const dragLink_data=showMenuComponents.show_menu_link_data[0]?MenuDraggable(menu_link_data,pointer_pos,t('Menu.flux')+' '+t('Flux.data.données'),showMenuComponents.show_menu_link_data[1]):<></>


  // MENU DRAGGABLE LINK APPEARENCE
  const menu_link_appearence=SankeyMenuConfigurationLinksAppearence(data,multi_selected_links,set_data,t,[],false,'default',display_link_opacity,set_display_link_opacity,true)
  const dragLink_appearence=showMenuComponents.show_menu_link_appearence[0]?MenuDraggable(menu_link_appearence,pointer_pos,t('Menu.flux')+' '+t('Flux.apparence.apparence'),showMenuComponents.show_menu_link_appearence[1]):<></>

  const context_l=ContextMenuLink(
    contextualised_link,set_contextualised_link,
    showMenuComponents.show_menu_link_data[1],
    showMenuComponents.show_menu_link_appearence[1],
    data,set_data,tags_selected,multi_selected_links,t,pointer_pos
  )

  // MENU DRAGGABLE LAYOUT
  menu_configuration_layout
  const drag_menu_layout=showMenuComponents.show_menu_layout[0]?MenuDraggable(menu_configuration_layout,pointer_pos,t('Menu.MEP'),showMenuComponents.show_menu_layout[1]):<></>


  const context_for_zdd=ContextZdd(showMenuComponents,data,set_data,pointer_pos,node_hspace,set_node_hspace,node_vspace,set_node_vspace,t)
  const context_for_tag_legend=context_legend_tags(tag_contextualised,set_tag_contextualised,data,set_data,multi_selected_nodes,multi_selected_links,t,pointer_pos,SankeyUtils.GetLinkValue)


  const modale_style_link=<React.Fragment key={'modale_style_link'}>{SankeyPlusModalStyleLink(t,data,set_data,showStyleLink,setShowStyleLink,selected_style_link,set_selected_style_link,[],display_link_opacity,set_display_link_opacity)}</React.Fragment>
  const modale_style_node=<React.Fragment key={'modale_style_node'}>{SankeyPlusModalStyleNode(t,data,set_data,showStyle,setShowStyle,selected_style_node,set_selected_style_node,[],set_style_to_apply)}</React.Fragment>
  external_menu_modal.push(modale_style_link)
  external_menu_modal.push(modale_style_node)


  
  const processExcel=(text:string)=>SankeyUtils.RetrieveExcelResults(text,data,set_data,updateLayout,()=>0,GetSankeyMinWidthAndHeight,convert_data,SankeyUtils.DefaultSankeyData)

  const additional_nav_item=[]

  const checkpoint_time=LastCheckpointTime(t)
  additional_nav_item.push(checkpoint_time)
  const checkpoint_button=OpenSankeySaveButton(t)
  additional_nav_item.push(checkpoint_button)


  const d= (
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <>
        <div className='div-Menu'>
          <Menu
            t={t}
            data={data}
            set_data={set_data}
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
            showMenuComponents={showMenuComponents}
            cardsTemplate={cardsTemplate}
            external_modal={external_menu_modal}
            GetSankeyMinWidthAndHeight={GetSankeyMinWidthAndHeight}
            formations_menu={formations_menu}
            Reinitialization={Reinitialization}
            additional_nav_item={additional_nav_item}
            set_contextualised_node={set_contextualised_node}
            set_contextualised_link={set_contextualised_link}
            set_tag_contextualised={set_tag_contextualised}
            updateLayout={updateLayout}
            convert_data={convert_data}
            node_hspace={node_hspace}
            set_node_hspace={set_node_hspace}
            node_vspace={node_vspace}
            set_node_vspace={set_node_vspace}
            elementToDispose={elementToDispose}
            apply_transformation_additional_elements={[]}
            DiagramSelector={OpenSankeyDiagramSelector}
            is_computing={is_computing}
            setIsComputing={setIsComputing}
            set_tags_selected={set_tags_selected}
            RetrieveExcelResults={processExcel}
            DefaultSankeyData={SankeyUtils.DefaultSankeyData}
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
                ZoomFunction(evt,data)
              }))
            .on('dblclick.zoom', null)


          const timer = setTimeout(() => {
            SankeyUtils.AdjustSankeyZone(data,GetSankeyMinWidthAndHeight)
          }, 100)
          return () => clearTimeout(timer)
        }, [])}

        <SankeyDraw
          data={data}
          set_data={set_data}
          display_nodes={display_nodes}
          display_links={display_links}
          animation={false}
          mode_selection={mode_selection}
          show_agregation={showMenuComponents.show_agregation[0]}
          set_show_agregation={showMenuComponents.show_agregation[1]}
          agregation_node={agregation_node}
          set_agregation_node={set_agregation_node}
          is_agregation={is_agregation}
          set_alt_key_pressed={set_alt_key_pressed}
          GetSankeyMinWidthAndHeight={GetSankeyMinWidthAndHeight}
          pointer_pos={pointer_pos}
          set_show_context_zdd={showMenuComponents.show_context_zdd[1]}
        />
        {dragNodeAttr}
        {dragNodeIO}

        {dragLink_data}
        {dragLink_appearence}

        {drag_menu_layout}

        {context_n}
        {context_l}
        {context_for_zdd}
        {context_for_tag_legend}
      </>
    </div>
  )

  // Wait a delay before adding the event for the element to be created, because otherwise the d3 selection return nothing
  setTimeout(() => {
    //Ajout des events sur les l'ajout des noeuds aux click
    const svgSankey=d3.select('.opensankey #svg')
    svgSankey.on('mousedown',evt=>{
      EventOnSankeyZoneMouseDown(mode_selection,data,set_data,set_first_selected_node,true,()=>false,evt,start_point,closeAllMenuContext)
    })
    svgSankey.on('mousemove',evt=>{
      EventOnSankeyZoneMouseMove(mode_selection,data,first_selected_node,set_first_selected_node,evt,start_point)
    })
    svgSankey.on('mouseup',evt=>{
      EventOnSankeyZoneMouseUp(mode_selection,data,set_data,multi_selected_nodes,multi_selected_links,first_selected_node,set_first_selected_node,true,()=>false,accordion_ref,button_ref,links_accordion_ref,set_displayed_input_link_value,evt,start_point)
    })
  }, 100)

  return (
    d

  )
}

export default SankeyApp




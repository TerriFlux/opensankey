// General import
import React, { useState, FunctionComponent, useRef, useEffect } from 'react'
import { Popover, Form} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import i18next from './traduction'

import { SankeyAppBuilderTypes, SankeyData, applicationDrawType, processFunctionsType, showMenuComponentsType } from './types/Types'
import { Menu, OpenSankeyMenus, MenuDraggable,OpenSankeySaveButton,LastCheckpointTime } from './lib/SankeyMenuTop'
import { SankeySettingsEditionElementTags } from './lib/SankeyMenuConfigurationTags'
import { OpenSankeyMenuConfigurationLayout } from './lib/SankeyMenuConfigurationLayout'
import { OpenSankeyConfigurationNodesAttributes} from './lib/SankeyMenuConfigurationNodesAttributes'
import { OpenSankeyMenuConfigurationNodes} from './lib/SankeyMenuConfigurationNodes'
import { OpenSankeyDiagramSelector} from './lib/SankeyMenuDialogs'
import { OpenSankeyMenusFType} from './types/SankeyMenuTopTypes'

import {SankeyMenuConfigurationNodesIO} from './lib/SankeyMenuConfigurationNodesIO'
import {SankeyMenuConfigurationNodesIOFType} from './types/SankeyMenuConfigurationNodesIOTypes'

import {OpenSankeyMenuConfigurationLinks} from './lib/SankeyMenuConfigurationLinks'
import {SankeyMenuConfigurationLinksData} from './lib/SankeyMenuConfigurationLinksData'
import {SankeyMenuConfigurationLinksAppearence} from './lib/SankeyMenuConfigurationLinksAppearence'

import {toolbar_builder,addSimpleLevelDropDown,setDiagram} from './lib/SankeyMenuBanner'
import { ModalPreference,OpenSankeyDefaultModalePreferenceContent} from './lib/SankeyMenuPreferences'
import { keyHandler } from './lib/SankeyDraw'
import { context_legend_tags } from './lib/SankeyDrawLegend'
import { RetrieveExcelResults, updateLayout, windowSankey } from './lib/SankeyUtils'
import { ContextMenuLink } from './lib/SankeyMenuContextLink'
import { ContextMenuNode } from './lib/SankeyMenuContextNode'
import { ContextMenuZdd } from './lib/SankeyMenuContextZDD'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './lib/SankeyStyle'
import { OpenSankeyConfigurationsMenus } from './lib/SankeyMenuConfiguration'
import { CardsTemplateBuilder, welcomeModalBuilder } from './lib/SankeyModalWelcome'


/*****************************************************************************/

export const SankeyAppBuilder : FunctionComponent<SankeyAppBuilderTypes> = ({
  applicationContext,
  elementsSelected,
  uiElementsRef,
  applicationData,
  contextMenu,
  show_nav,
  set_show_nav,
  displayedInputLinkValueRef,
  exemple_menu,
  formations_menu,
  mode_selection,
  GetLinkValue,
  Reinitialization,
  size_of_draw_zone,
  display_link_opacity,
  set_display_link_opacity,
  legend_position,
  set_legend_position,
  set_agregation_node,
  set_is_agregation,
  convert_data,
  maximum_flux,
  set_maximum_flux,
  set_show_agregation
} ) => {

  const [nav_item_active, set_nav_item_active] = useState<string>('')
  const [style_to_apply, set_style_to_apply] = useState('default')
  const [never_see_again,set_never_see_again]=useState((localStorage.getItem('dontSeeAggainWelcome')==='1'))
  const [is_computing,setIsComputing]=useState(false)
  const [elementToDispose, ] = useState([''])

  // For OpenSankeyConfigurationsMenus
  const [sub_nav_item_active, set_sub_nav_item_active] = useState<string>('')
  const [pre_idSource,set_pre_idSource]=useState('none')
  const [pre_idTarget,set_pre_idTarget]=useState('none')

  // For OpenSankeyMenuConfigurationLayout
  const [minimum_flux, set_minimum_flux] = useState(applicationData.data.minimum_flux)
  const [node_hspace, set_node_hspace] = useState(applicationData.data.h_space)
  const [node_vspace, set_node_vspace] = useState(applicationData.data.v_space)

  // For OpenSankeyMenuConfigurationNodes
  const [link_io,set_link_io]=useState<string>('output')
  const [link_pos,set_link_pos]=useState<string>('right')
  const [tab_colored,set_tab_colored]=useState<boolean>(false)

  //- Processes
  const [processing,setProcessing] = useState(false)
  const [failure,setFailure] = useState(false)
  const [not_started,setNotStarted] = useState(true)
  const [result,setResult] = useState('')
  const [path,setPath] = useState('')

  const userScaleRef = useRef(applicationData.data.user_scale)
  userScaleRef.current = applicationData.data.user_scale

  const show_menu_node_apparence=useState(false)
  const show_menu_node_io=useState(false)
  const show_menu_link_data=useState(false)
  const show_menu_link_appearence=useState(false)
  const show_menu_layout=useState(false)
  const show_modal_welcome=useState(true)
  const show_modale_tuto=useState(false)
  const show_modale_support=useState(false)
  const show_excel_dialog=useState(false)
  const show_save_json=useState(false)
  const show_apply_layout= useState(false)
  const ShowPreference = useState(false)
  const show_modalTemplate= useState(false)
  const show_welcome=useState(false)
  const show_load=useState(false)
  
  const showMenuComponents : showMenuComponentsType = {
    show_menu_node_apparence : show_menu_node_apparence,
    show_menu_node_io : show_menu_node_io,
    show_menu_link_data : show_menu_link_data,
    show_menu_link_appearence : show_menu_link_appearence,
    show_menu_layout : show_menu_layout,
    show_modal_welcome : show_modal_welcome,
    show_modale_tuto : show_modale_tuto,
    show_modale_support : show_modale_support,
    show_excel_dialog : show_excel_dialog,
    show_save_json : show_save_json,
    show_apply_layout :  show_apply_layout,
    ShowPreference  : ShowPreference,
    show_modalTemplate : show_modalTemplate,
    show_welcome : show_welcome,
    show_load : show_load
  }

  const launch = (path:string) => {
    setPath(path)
    showMenuComponents.show_load[1](true)
    setProcessing(true)
    setFailure(true)
    setNotStarted(false)
    setResult('')
  }

  const processFunctions : processFunctionsType = {
    processing,
    setProcessing,
    failure,
    setFailure,
    not_started,
    setNotStarted,
    result,
    setResult,
    path,
    setPath,
    launch,
    is_computing,
    setIsComputing,
    RetrieveExcelResults
  }
  
  const applicationDraw : applicationDrawType = {
    GetSankeyMinWidthAndHeight : size_of_draw_zone,
    updateLayout,
    node_hspace,
    set_node_hspace,
    node_vspace,
    set_node_vspace
  }

  // Modals
  const [showStyle, setShowStyle] = useState(false)

  //- Modals and Dialogs
  // For OpenSankeyMenuConfigurationLinks
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(applicationData.data.fluxTags).length > 0 ? Object.keys(applicationData.data.fluxTags)[0] : '')

  // Modal et fonctions pour l'edition et affectation des style de flux
  const [showStyleLink, setShowStyleLink] = useState(false) as [boolean,(_:boolean)=>void]
  const showStyleEditionLink = () => {
    setShowStyleLink(true)
  }

  // Modal et fonctions pour l'édition et affectation des styles de noeud
  const showStyleEdition = () => {
    setShowStyle(true)
  }

  // Create traduction function
  const {t} = useTranslation()

  // Function to close all menu : menu confugartion, menu context (nodes,links, drawZone), an menu dragggable
  // Called when we press escape
  const closeAllMenu=()=>{
    set_show_nav(false)
    showMenuComponents.show_menu_node_apparence[1](false)
    showMenuComponents.show_menu_node_io[1](false)
    showMenuComponents.show_menu_link_data[1](false)
    showMenuComponents.show_menu_link_appearence[1](false)
    showMenuComponents.show_menu_layout[1](false)
    showMenuComponents.show_apply_layout[1](false)
    contextMenu.closeAllMenuContext()
  }

  const cardsTemplate = CardsTemplateBuilder(
    exemple_menu,
    elementsSelected,
    applicationData,
    applicationContext,
    Reinitialization,
    convert_data
  )
  const [active_page,set_active_page]=useState((windowSankey.sankey && windowSankey.sankey.welcome_text)?'read_me':'intro')

  const intro_modal = welcomeModalBuilder(
    exemple_menu,
    showMenuComponents,
    never_see_again,
    set_never_see_again,
    active_page,
    set_active_page
  )

  //- 1. Builds Configuration Menus
  //- 1.1 Builds Configuration Menus Layout

  const  menu_configuration_layout= OpenSankeyMenuConfigurationLayout(t,
    applicationData.data,applicationData.set_data,
    userScaleRef,
    legend_position, set_legend_position,
    <></>
  )

  //- 1.2 Builds Configuration Menus Node
  //- 1.2.1 Builds Configuration Menus Node Attributes
  const menu_config_add_node_appearence_attr=[] as JSX.Element[]
  const menu_config_add_node_label=[] as JSX.Element[]
  const menu_config_add_node_label_value=[] as  JSX.Element[]

  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(t,
    applicationData.data,applicationData.set_data,
    elementsSelected.multi_selected_nodes,
    false,
    elementsSelected.selected_style_node, elementsSelected.set_selected_style_node,
    menu_config_add_node_appearence_attr,
    menu_config_add_node_label,
    menu_config_add_node_label_value)
  // menu_configuration_nodes_attributes.push(SankeyPlusNodeImage(t, applicationData.data,applicationData.set_data, elementsSelected.multi_selected_nodes, has_open_sankey_plus))

  //- 1.2.2 Builds Configuration Menus Node
  const menu_configuration_nodes = OpenSankeyMenuConfigurationNodes(t,
    applicationData.data,applicationData.set_data, applicationData.display_nodes,
    elementsSelected.multi_selected_nodes,
    menu_configuration_nodes_attributes,
    link_io, set_link_io,
    link_pos, set_link_pos,
    tab_colored, set_tab_colored,
    GetLinkValue,
    elementsSelected.multi_selected_links,
    set_display_link_opacity
  )

  //- 1.2.3 Builds Configuration Menus Node Tags
  const menu_configuration_nodes_tags=<SankeySettingsEditionElementTags
    t={t}
    data={applicationData.data}
    set_data={applicationData.set_data}
    elementTagNameProp='nodeTags'
    elementNameProp='nodes' />

  //- 1.3 Builds Configuration Menus Links
  //- 1.3.1.1 Builds different subpart for Menu Links according to activated token
  // const additional_data_element=[] as JSX.Element[]
  // const add_link_appearence_item=[] as JSX.Element[]

  //- 1.3.1.2 Builds the core for Menu Links
  const menu_configuration_links = OpenSankeyMenuConfigurationLinks(
    applicationData.data,applicationData.set_data,
    elementsSelected.multi_selected_links,
    t,
    tags_group_key, set_tags_group_key,
    elementsSelected.tags_selected, 
    elementsSelected.set_tags_selected,
    [<></>],
    displayedInputLinkValueRef,
    [<></>],
    display_link_opacity, set_display_link_opacity,
    pre_idSource,set_pre_idSource,
    pre_idTarget,set_pre_idTarget,
    GetLinkValue,

  )

  //- 1.3.2 Builds Configuration Menus Link tags
  const  menu_configuration_link_tags=<SankeySettingsEditionElementTags
    t={t}
    data={applicationData.data}
    set_data={applicationData.set_data}
    elementTagNameProp='fluxTags'
    elementNameProp='links' />

  //- 1.4 Builds Configuration Menus DataTags
  const  menu_configuration_data_tags=<SankeySettingsEditionElementTags
    t={t}
    data={applicationData.data}
    set_data={applicationData.set_data}
    elementTagNameProp='dataTags'
    elementNameProp='links' />

  //- 1.5 Builds Configuration Menus FreeLabel


  //- 1.7 Finish builds Configuration Menus
  const configurations_menus =  OpenSankeyConfigurationsMenus(
    t,
    applicationData.data,applicationData.set_data as (d:SankeyData)=>void,
    set_show_nav,
    nav_item_active, set_nav_item_active,
    sub_nav_item_active, set_sub_nav_item_active,
    uiElementsRef.nodes_accordion_ref,
    uiElementsRef.links_accordion_ref,
    elementsSelected.multi_selected_nodes,
    elementsSelected.multi_selected_links,
    set_style_to_apply,
    menu_configuration_layout,
    menu_configuration_nodes_tags, 
    menu_configuration_link_tags, 
    menu_configuration_data_tags,
    menu_configuration_nodes,
    menu_configuration_links,
    <></>,
    false, //TODO
    displayedInputLinkValueRef,
    elementsSelected.tags_selected, 
    elementsSelected.set_tags_selected,
    set_display_link_opacity,
    pre_idSource,
    pre_idTarget
  )

  // const _load_json = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }
  // const _load_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; } TODO



  //- End of 1. Build configuration Menus

  //- 2.  Build Menus
  //- 2.1 Build Menus dropdown
  //- 2.2 Build Menus banner
  //- 2.3 Build Menus toolbar
  const additional_edition_item=[] as JSX.Element[]
  const additional_file_save_item=[] as JSX.Element[]
  const additional_file_item=[] as JSX.Element[]

  const sankey_menus = (OpenSankeyMenus as OpenSankeyMenusFType)(
    t,
    Reinitialization,
    applicationData.get_default_data,
    showMenuComponents,
    showStyleEdition,
    showStyleEditionLink,
    set_never_see_again,
    applicationData.data,applicationData.set_data as (d:SankeyData)=>void,
    additional_edition_item,
    additional_file_item,
    additional_file_save_item,
    elementsSelected.set_tags_selected,
    convert_data,
  )

  // 2.4 Modal linked to menu item
  const external_menu_modal=[] as JSX.Element[]
  // const sankey_plus_menu_node_attr_for_style= SankeyPlusNodesAttributes(t, applicationData.data,applicationData.set_data, elementsSelected.multi_selected_nodes, has_open_sankey_plus, true, selected_style_node)
  const sankey_plus_menu_node_attr_for_style=[] as JSX.Element[]
  const regular_ui=OpenSankeyDefaultModalePreferenceContent(t,
    applicationData.data, applicationData.set_data,
    i18next)

  const add_style_link_appearence_item=[] as JSX.Element[]

  const modale_style_link=<React.Fragment key={'modale_style_link'}>{SankeyModalStyleLink(t,
    applicationData.data, applicationData.set_data as (_:SankeyData)=>void,
    showStyleLink, setShowStyleLink,
    elementsSelected.selected_style_link, elementsSelected.set_selected_style_link,
    add_style_link_appearence_item,
    display_link_opacity, set_display_link_opacity)
  }</React.Fragment>

  const modale_style_node=<React.Fragment key={'modale_style_node'}>{SankeyModalStyleNode(t,
    applicationData.data, applicationData.set_data as (_:SankeyData)=>void,
    showStyle, setShowStyle,
    elementsSelected.selected_style_node, elementsSelected.set_selected_style_node,
    sankey_plus_menu_node_attr_for_style,
    set_style_to_apply
  )}</React.Fragment>


    
  // regular_ui['form'].push(AFMSankeyMenuPreferenceView( //TODO
  //   t,
  //       applicationData.data as SankeyData, 
  //       applicationData.set_data as (d:SankeyData)=>void,
  //       preferenceCheck)
  // )
  // regular_ui['form'].push(SankeyPlusMenuPreferenceView(t,
  //   applicationData.master_data?applicationData.master_data:applicationData.data, applicationData.set_data as (_:SankeyPlusData)=>void,
  //   preferenceCheck))

  // regular_ui['form'].push(SankeyPlusMenuPreferenceLabels(t,
  //   applicationData.data,applicationData.set_data as (_:SankeyPlusData)=>void))

  const elments_of_modale_preference=Object.values(regular_ui).map(d=>{
    return <>{d}<hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} /></>
  })

  const modale_preference=<React.Fragment key={'modale_preference'}><ModalPreference
    showPreference={showMenuComponents.ShowPreference[0]}
    setShowPreference={showMenuComponents.ShowPreference[1]}
    ui={elments_of_modale_preference}
    t={t}
  /></React.Fragment>

  external_menu_modal.push(modale_style_link)
  external_menu_modal.push(modale_style_node)
  external_menu_modal.push(modale_preference)
  external_menu_modal.push(intro_modal)

  const func_current_filter=(
    new_current_filter: number
  ) => {
    const { display_style } = applicationData.data
    display_style.filter = +new_current_filter
    applicationData.set_data({ ...applicationData.data })
  }

  const opacity_advanced =  !windowSankey.SankeyToolsStatic ? '0.3' : '0'
  //Popover element to handle node levels (aggregation)
  const detail_level=
        <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
          <Popover.Header as="h3">{t('Banner.ndd')}</Popover.Header>
          <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>

            <>{(Object.entries(applicationData.data.levelTags).length > 0) ? (<>
              {addSimpleLevelDropDown(t,applicationData.data,applicationData.set_data)}</>
            ) : (<>
              <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)}</>
          </Popover.Body>
        </Popover>

  Object.values(applicationData.data.levelTags).forEach(tag_group=>tag_group.activated = false)
  if ('Primaire' in applicationData.data.levelTags) {
    applicationData.data.levelTags['Primaire'].activated = true
  }

  const {filter}=applicationData.data.display_style
  const toolbar = toolbar_builder(
    t,applicationData.data,applicationData.set_data,mode_selection,userScaleRef,filter,func_current_filter,
    detail_level,'',elementsSelected.first_selected_node,elementsSelected.set_first_selected_node,size_of_draw_zone,
    setDiagram,
    showMenuComponents.show_modal_welcome[1],set_never_see_again,convert_data,
    maximum_flux,set_maximum_flux,minimum_flux,set_minimum_flux,applicationData.get_default_data
  )

  Object.keys(toolbar).forEach(k=>{
    sankey_menus[k]=toolbar[k]
  })

  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(e,applicationData.data,elementsSelected.multi_selected_nodes,elementsSelected.multi_selected_links,applicationData.set_data,mode_selection,closeAllMenu
    )
  }
  document.onkeydown = formatKeyHandler

  //const navigate=useNavigate()
  // const returnToApp=()=>{
  //   navigate('/')
  //   applicationData.set_data({...applicationData.data})
  // }
  const additional_nav_item=[]
  const os_checkpoint_button=OpenSankeySaveButton(t)
  const checkpoint_time=LastCheckpointTime(t)
  additional_nav_item.push(checkpoint_time)

  additional_nav_item.push(os_checkpoint_button)

  // MENU DRAGGABLE NODE ATTR
  const menu_node_attr=menu_configuration_nodes_attributes
  const dragNodeAttr=showMenuComponents.show_menu_node_apparence[0]?MenuDraggable(menu_node_attr,contextMenu.pointer_pos,t('Menu.Noeuds')+' '+t('Noeud.apparence.apparence'),showMenuComponents.show_menu_node_apparence[1]):<></>

  // MENU DRAGGABLE NODE IO
  if(showMenuComponents.show_menu_node_io[0] && elementsSelected.multi_selected_nodes.current.length!==1){
    showMenuComponents.show_menu_node_io[1](false)
  }
  const menu_node_io = (SankeyMenuConfigurationNodesIO as SankeyMenuConfigurationNodesIOFType)(
    t,applicationData.data,applicationData.set_data as (_:SankeyData)=>void,applicationData.display_nodes,elementsSelected.multi_selected_nodes,link_io,set_link_io,link_pos,set_link_pos,
    tab_colored,set_tab_colored,GetLinkValue,elementsSelected.multi_selected_links,set_display_link_opacity,
    true
  )

  const dragNodeIO=showMenuComponents.show_menu_node_io[0]?MenuDraggable(menu_node_io,contextMenu.pointer_pos,t('Menu.Noeuds')+' '+t('Noeud.PF.PFM'),showMenuComponents.show_menu_node_io[1]):<></>

  // OpenSankey+ : cast of showMenuComponents in showMenuComponentsType
  //const showMenuComponents = showMenuComponents as showMenuComponentsType
  // MENU DRAGGABLE NODE ICON

  // Array containaing additional button to add to the menu transformation
  const apply_transformation_additional_elements : JSX.Element[] = []

  const DiagramSelector = OpenSankeyDiagramSelector

  const context_n = ContextMenuNode(
    applicationContext,
    applicationData,
    elementsSelected,
    contextMenu,
    showMenuComponents,
    set_show_agregation,
    set_agregation_node,
    set_is_agregation,
    set_display_link_opacity,
    [<></>],
    [<></>]
  )
  useEffect(()=> {
    contextMenu.contextNodeRef.current!.hidden = true    
    contextMenu.contextZDDRef.current!.hidden = true    
  })

  // MENU DRAGGABLE LINK DATA
  const menu_link_data = SankeyMenuConfigurationLinksData(
    applicationData.data,
    elementsSelected.tags_selected,
    elementsSelected.multi_selected_links,
    applicationData.set_data,
    t,
    [<></>],
    displayedInputLinkValueRef,
    pre_idSource,
    set_pre_idSource,
    pre_idTarget,
    set_pre_idTarget,
    true
  )

  const dragLink_data = showMenuComponents.show_menu_link_data[0] ? MenuDraggable(
    menu_link_data,
    contextMenu.pointer_pos,
    t('Menu.flux')+' '+t('Flux.data.données'),
    showMenuComponents.show_menu_link_data[1]):<></>


  // MENU DRAGGABLE LINK APPEARENCE
  const menu_link_appearence = SankeyMenuConfigurationLinksAppearence(
    applicationData.data,
    elementsSelected.multi_selected_links,
    applicationData.set_data,
    t,
    add_style_link_appearence_item,
    false,
    'default',
    display_link_opacity,set_display_link_opacity,
    GetLinkValue,
    true)

  const dragLink_appearence = showMenuComponents.show_menu_link_appearence[0] ? MenuDraggable(
    menu_link_appearence,
    contextMenu.pointer_pos,
    t('Menu.flux')+' '+t('Flux.apparence.apparence'),
    showMenuComponents.show_menu_link_appearence[1]):<></>

  const context_l = ContextMenuLink(
    applicationContext,
applicationData,
elementsSelected,
contextMenu,
showMenuComponents
)


  // MENU DRAGGABLE LAYOUT
  const drag_menu_layout = showMenuComponents.show_menu_layout[0] ? MenuDraggable(
    menu_configuration_layout,
    contextMenu.pointer_pos,
    t('Menu.MEP'),
    showMenuComponents.show_menu_layout[1]):<></>

  const context_for_zdd = ContextMenuZdd(
    applicationContext,
    applicationData,
    contextMenu,
    showMenuComponents,
    applicationDraw
  )

  // MENU DRAGGABLE ZDT
    
  const context_for_tag_legend = context_legend_tags(
    contextMenu.tag_contextualised,contextMenu.set_tag_contextualised,
    applicationData.data,applicationData.set_data,
    elementsSelected.multi_selected_nodes,
    elementsSelected.multi_selected_links,
    t,
    contextMenu.pointer_pos,GetLinkValue
  )

  return (<>
    <div className='div-Menu' style={{ 'backgroundColor' : 'WhiteSmoke'}} >
      {dragNodeAttr}
      {dragNodeIO}
      {dragLink_data}
      {dragLink_appearence}
      {drag_menu_layout}
      <>
        <Menu
          applicationContext={applicationContext}
          applicationData={applicationData}
          uiElementsRef={uiElementsRef}
          elementsSelected={elementsSelected}
          contextMenu={contextMenu}
          processFunctions={processFunctions}
          showMenuComponents={showMenuComponents}
          applicationDraw={applicationDraw}
          nav_item_active={nav_item_active}
          show_nav={show_nav}
          set_show_nav={set_show_nav}
          mode_selection={mode_selection}
          example_menu={<></>}
          style_to_apply={style_to_apply}
          set_style_to_apply={set_style_to_apply}
          configurations_menus={configurations_menus}
          menus={sankey_menus}
          cardsTemplate={cardsTemplate}
          external_modal={external_menu_modal}
          Reinitialization={Reinitialization}
          formations_menu={formations_menu}
          additional_nav_item={additional_nav_item}
          convert_data={convert_data}
          elementToDispose={elementToDispose}
          apply_transformation_additional_elements={apply_transformation_additional_elements}
          DiagramSelector={DiagramSelector}
        />
      </>
    </div>
    {context_n}
    {context_l}
    {context_for_zdd}
    {context_for_tag_legend}
  </>
  )
}



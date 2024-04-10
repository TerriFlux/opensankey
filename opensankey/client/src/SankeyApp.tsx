import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react'
import * as d3 from 'd3'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { Popover, Form } from 'react-bootstrap'
import { ChakraProvider } from '@chakra-ui/react'
/*************************************************************************************************/
import {
  agregationType,
  applicationContextType,
  applicationDrawType,
  ComponentUpdaterType,
  contextMenuType,
  dict_hook_ref_setter_show_dialog_componentsType,
  dict_variable_application_dataType,
  dict_variable_elements_selectedType,
  LinkFunctionTypes,
  NodeFunctionTypes,
  processFunctionsType,
  SankeyAppTypes,
  SankeyData,
  SankeyLink,
  SankeyNode,
  uiElementsRefType
} from './types/Types'
/*************************************************************************************************/
import SankeyDraw, { keyHandler } from './draw/SankeyDraw'
import {
  GetSankeyMinWidthAndHeight,
  LinkStroke,
  DrawArrows,
  NodeVisibleOnsSvg
} from './draw/SankeyDrawFunction'
import { applyZoomEvent } from './draw/SankeyDrawEventFunction'
import {
  EventOnZoneMouseDown,
  EventOnZoneMouseMove,
  EventOnZoneMouseUp
} from './draw/SankeyDrawEventFunction'
import { ContextLegendTags, drag_legend, DrawLegend } from './draw/SankeyDrawLegend'
import { NodeTooltipsContent, LinkTooltipsContent } from './draw/SankeyTooltip'
import {
  AdjustSankeyZone,
  DefaultSankeyData,
  GetLinkValue,
  LinkColor,
  LinkText,
  LinkVisible,
  NodeDisplayed,
  ReturnValueLink,
  windowSankey
} from './configmenus/SankeyUtils'
import { ClickSaveDiagram, RetrieveExcelResults } from './dialogs/SankeyPersistence'
import { updateLayout } from './draw/SankeyDrawLayout'
import { convert_data } from './configmenus/SankeyConvert'
import { ToolbarBuilder, addSimpleLevelDropDown, setDiagram } from './configmenus/SankeyMenuBanner'
import { OpenSankeyConfigurationsMenus } from './configmenus/SankeyMenuConfiguration'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { MenuConfigurationLinks } from './configmenus/SankeyMenuConfigurationLinks'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { OpenSankeyMenuConfigurationNodes } from './configmenus/SankeyMenuConfigurationNodes'
import { OpenSankeyConfigurationNodesAttributes } from './configmenus/SankeyMenuConfigurationNodesAttributes'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { SankeySettingsEditionElementTags } from './configmenus/SankeyMenuConfigurationTags'
import { ContextMenuLink } from './dialogs/SankeyMenuContextLink'
import { ContextMenuNode } from './dialogs/SankeyMenuContextNode'
import { ContextMenuZdd } from './dialogs/SankeyMenuContextZDD'
import { ApplySaveJSONDialog, OpenSankeyDiagramSelector } from './dialogs/SankeyMenuDialogs'
import {
  ModalPreference, OpenSankeyDefaultModalePreferenceContent
} from './dialogs/SankeyMenuPreferences'
import {
  OpenSankeyMenus, MenuDraggable, OpenSankeySaveButton, Menu, ToastWaitFunc
} from './topmenus/SankeyMenuTop'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './dialogs/SankeyStyle'
import { SankeyMenuConfigurationNodesTooltip } from './configmenus/SankeyMenuConfigurationNodesTooltip'
import { MenuConfigurationLinksTooltip } from './configmenus/SankeyMenuConfigurationLinksTooltip'
import { SankeyMenuConfigurationNodesTags } from './configmenus/SankeyMenuConfigurationNodesTags'
import { MenuConfigurationLinksTags } from './configmenus/SankeyMenuConfigurationLinksTags'
import { opensankey_theme } from './chakra/Theme'
import { AddDrawLinksEvent, drawAddLinks, DrawAllLinks, drawLinkShape } from './draw/SankeyDrawLinks'
import { DeleteGNodes, drawAddNodes, DrawAllNodes, updateDrawNodeShape } from './draw/SankeyDrawNodes'
import { RedrawNodesLabel } from './draw/SankeyDrawNodesLabel'

/*************************************************************************************************/
export const SankeyApp : FunctionComponent<SankeyAppTypes> = ({
  initial_sankey_data,
  formations_menu,
  logo,
  logo_terriflux
}) => {
  const [, set_show_draw] = useState(false)

  /*************************************************************************************************/
  const applicationContext : applicationContextType = {
    t : useTranslation().t,
    logo_width : 100,
    app_name : 'SankeySuite',//TODO
    url_prefix : '/opensankey/',
    logo : logo,
    logo_terriflux : logo_terriflux
  }
  /*************************************************************************************************/
  const [data, set_data] = useState<SankeyData>(initial_sankey_data)
  const display_nodes = Object.keys(data.nodes)
    .filter((key) => NodeDisplayed(data,data.nodes[key]))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.nodes[key]
      })
    }, {}) as {[idNode:string]:SankeyNode}
  const pre_display_links=Object.keys(data.links)
    .filter((key) =>LinkVisible(data.links[key],data,display_nodes,GetLinkValue))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.links[key]
      })
    }, {}) as {[idLink:string]:SankeyLink}
  const pre_link_key=Object.keys(pre_display_links)
  const display_links={} as {[idLink:string]:SankeyLink}
  data.linkZIndex.filter(lk=>pre_link_key.includes(lk)).forEach(lk=>display_links[lk]=pre_display_links[lk])
  const dict_variable_application_data : dict_variable_application_dataType = {
    data : data,
    set_data : set_data,
    get_default_data : DefaultSankeyData,
    display_nodes : display_nodes,
    display_links : display_links,
    function_on_wait:useRef(()=>null)
  }


  const recomputeDisplayedElement=()=>{
    dict_variable_application_data.display_nodes = Object.keys(data.nodes)
      .filter((key) => NodeDisplayed(data,data.nodes[key]))
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: data.nodes[key]
        })
      }, {}) as {[idNode:string]:SankeyNode}

    const pre_display_links=Object.keys(data.links)
      .filter((key) =>LinkVisible(data.links[key],data,dict_variable_application_data.display_nodes,GetLinkValue))
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: data.links[key]
        })
      }, {}) as {[idLink:string]:SankeyLink}
    const pre_link_key=Object.keys(pre_display_links)

    dict_variable_application_data.display_links={}
    data.linkZIndex=pre_link_key
    pre_link_key.forEach(lid=>dict_variable_application_data.display_links[lid]=data.links[lid])

    // delete element no longer displayed
    const curr_displayed_nodes= Object.keys(dict_variable_application_data.display_nodes)
    const node_to_delete=NodeVisibleOnsSvg().filter(nid=>!curr_displayed_nodes.includes(nid))
    DeleteGNodes(node_to_delete)

    applyZoomEvent(dict_variable_application_data)

  }
  /*************************************************************************************************/
  const dict_variable_elements_selected : dict_variable_elements_selectedType = {
    ref_setter_mode_selection : useRef<Dispatch<SetStateAction<string>>>(()=>null),
    ref_getter_mode_selection : useRef<string>(),
    multi_selected_nodes : useRef([]),
    multi_selected_links : useRef([] as SankeyLink[]),
    ref_selected_style_node : useRef('default'),
    ref_selected_style_link :  useRef('default'),
    first_selected_node : useRef<SankeyNode>(),
    ref_pre_idSource : useRef('none'),
    ref_pre_idTarget : useRef('none'),

    ref_display_link_opacity : useRef<Dispatch<SetStateAction<string>>[]>([]),
    displayedInputLinkValueSetterRef : useRef<Dispatch<SetStateAction<string>>[]>([]),
    displayedInputLinkValueRef : useRef<string>(''),
    userScaleRef : useRef(dict_variable_application_data.data.user_scale)
  }
  // Reset list of setter of input link value
  dict_variable_elements_selected.displayedInputLinkValueSetterRef.current=[]
  dict_variable_elements_selected.ref_display_link_opacity.current=[]

  /*************************************************************************************************/
  const uiElementsRef : uiElementsRefType = {
    button_ref : useRef<HTMLLabelElement>(null),
    accordion_ref : useRef<HTMLDivElement>(null),
    links_accordion_ref : useRef<HTMLDivElement>(null),
    nodes_accordion_ref : useRef<HTMLDivElement>(null),
    ref_setter_nav_item_active : useRef<Dispatch<SetStateAction<number>>>(()=>null),
    ref_nav_item_active : useRef<number>(-1),
    ref_setter_sub_nav_item_active : useRef<Dispatch<SetStateAction<string>>>(()=>null)
  }
  /*************************************************************************************************/
  const dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType = {
    ref_setter_show_menu_node_apparence : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_node_io : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_node_tooltip : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_node_tags : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_link_tags : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_link_data : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_link_appearence : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_link_tooltip : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_layout : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_welcome : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modale_tuto : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modale_support : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_excel_dialog : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_save_json : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_getter_show_save_json : useRef(false), // TODO why not a set function
    ref_setter_show_style_node : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_style_link : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),

    ref_setter_show_apply_layout : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_preference : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_template : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_load : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_waiting : useRef<Dispatch<SetStateAction<boolean>>>(()=>null)
  }
  /*************************************************************************************************/
  const contextMenu : contextMenuType = {
    ref_setter_contextualised_node : useRef<Dispatch<SetStateAction<SankeyNode|undefined>>>(),
    ref_contextualised_node : useRef<SankeyNode|undefined>(),
    ref_setter_contextualised_link : useRef<Dispatch<SetStateAction<SankeyLink|undefined>>>(),
    tagContext : useRef<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>([]),
    closeAllMenuContext : ()=>{
      contextMenu.ref_setter_contextualised_node.current!(undefined)
      contextMenu.ref_setter_contextualised_link.current!(undefined)
      contextMenu.tagContext.current![0][1](undefined)
      contextMenu.showContextZDDRef.current![1](false)
    },
    pointer_pos : useRef([window.innerWidth/4,window.innerHeight/4]),
    showContextZDDRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>]>()
  }

  const ComponentUpdater:ComponentUpdaterType={
    updateComponentMenuConfigNode:useRef(()=>null),
    updateComponentMenuConfigNodeAppearence:useRef(()=>null),
    updateComponentMenuConfigLink:useRef(()=>null),
    updateComponentToolbar:useRef(()=>null),
    updateComponentMenuConfig:useRef(()=>null),
    updateComponentMenuConfigLayout:useRef(()=>null),
    updateComponentMenu:useRef(()=>null),
    updateComponenSaveInCache:useRef(()=>null),
    updateComponentMenuNodeIOSelectSideNode:useRef([] as (()=>void)[])

  }
  /*************************************************************************************************/
  const agregation : agregationType = {
    showAgregationRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>][]>([]),
    isAgregationRef : useRef<boolean>(true),
    agregationNode : useRef<SankeyNode>()
  }
  /*************************************************************************************************/
  const processFunctions : processFunctionsType = {
    ref_processing : useRef(false),
    ref_setter_processing : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    failure : useRef(false),
    not_started : useRef(true),
    ref_result : useRef<Dispatch<SetStateAction<string>>>(()=>null),
    path : useRef(''),
    launch : (path:string) => {
      processFunctions.path.current = path
      dict_hook_ref_setter_show_dialog_components.ref_setter_show_load.current!(true)
      processFunctions.ref_setter_processing.current(true)
      processFunctions.failure.current = true
      processFunctions.not_started.current = false
      processFunctions.ref_result.current('')
    },
    RetrieveExcelResults
  }
  /*************************************************************************************************/
  const applicationDraw : applicationDrawType = {
    GetSankeyMinWidthAndHeight,
    updateLayout
  }
  /*************************************************************************************************/
  const start_point=useRef([0,0])
  const legend_clicked = useRef(false)
  const accept_simple_click=useRef(true)
  const elementToDispose = useRef([''])
  const never_see_again = useRef((localStorage.getItem('dontSeeAggainWelcome')==='1'))
  const ref_alt_key_pressed = useRef(false)
  /*************************************************************************************************/
  const mode_pref=sessionStorage.getItem('modepref')
  if(mode_pref && mode_pref==='expert' && data.accordeonToShow.length!==6){
    data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
  }
  /*************************************************************************************************/
  // Réinitialise data et vide les noeud/liens sélectionnés
  const Reinitialization = () => {
    const new_data = DefaultSankeyData()
    dict_variable_elements_selected.multi_selected_nodes.current = []
    dict_variable_elements_selected.multi_selected_links.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')
    dict_variable_elements_selected.ref_selected_style_node.current = 'default'
    dict_variable_elements_selected.ref_selected_style_link.current = 'default'
    contextMenu.ref_setter_contextualised_node.current!(undefined)
    contextMenu.ref_setter_contextualised_link.current!(undefined)
    contextMenu.tagContext.current![0][1](undefined)
    contextMenu.showContextZDDRef.current![1](false)
    set_data(new_data)
    sessionStorage.setItem('dismiss_warning_sankey_plus','0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa','0')
  }

  const closeAllMenu=()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_apparence.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_io.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_tooltip.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_tags.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_data.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_appearence.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_tooltip.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_tags.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_layout.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_apply_layout.current!(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_preference.current!(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_style_node.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_style_link.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_modal_welcome.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_modale_support.current(false)

    contextMenu.closeAllMenuContext()
  }
  const node_arrow_visible =
  (data:SankeyData,n: SankeyNode) => !NodeDisplayed(data,n) || (n.inputLinksId.length === 0) || (!ReturnValueLink(data,data.links[n.inputLinksId[0]],'arrow')) ? false : true

  // Color for the sabot when the source node is an arrow
  const LinkSabotColor=LinkColor
  const RedrawLinks=(links_to_update:SankeyLink[])=>{
    drawLinkShape(dict_variable_application_data,dict_variable_elements_selected,applicationContext,link_function,links_to_update,ComponentUpdater)
    AddDrawLinksEvent(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,link_function,ComponentUpdater,dict_hook_ref_setter_show_dialog_components,applicationContext,ref_alt_key_pressed)

  }

  const OpenSankeyCreateLinksOnSVG=(links_to_update:SankeyLink[])=>{
    drawAddLinks(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,
      link_function,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      links_to_update
    )  }

  const link_function:LinkFunctionTypes = {
    GetLinkValue,
    LinkText,
    DrawArrows,
    LinkStroke,
    LinkSabotColor,
    node_arrow_visible,
    LinkTooltipsContent,
    DrawAllLinks,
    drawAddLinks,
    drawLinkShape,
    RedrawLinks,
    CreateLinksOnSVG:OpenSankeyCreateLinksOnSVG
  }
  const OpenSankeyRedrawNode=(nodes_to_update:SankeyNode[])=>{
    updateDrawNodeShape(dict_variable_application_data,link_function,dict_variable_elements_selected.multi_selected_nodes,nodes_to_update)
    RedrawNodesLabel(dict_variable_application_data,nodes_to_update,GetLinkValue,applicationContext.t)
  }
  const OpenSankeyCreateNodeOnSVG=(nodes_to_update:SankeyNode[])=>{
    drawAddNodes(contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,accept_simple_click,
      link_function,
      NodeTooltipsContent,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      node_function,nodes_to_update)
  }

  const node_function:NodeFunctionTypes={
    DrawAllNodes,
    drawAddNodes,
    RedrawNodes:OpenSankeyRedrawNode,
    recomputeDisplayedElement,
    CreateNodesOnSVG:OpenSankeyCreateNodeOnSVG
  }

  /*************************************************************************************************/
  const resizeCanvas=()=>{
    AdjustSankeyZone(dict_variable_application_data,GetSankeyMinWidthAndHeight)
  }
  /*******************************************************************************/
  const reDrawLegend=()=>{
    DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked,ComponentUpdater,reDrawLegend,resizeCanvas)
    if(!windowSankey.SankeyToolsStatic){
      const g_legend=d3.select(' .opensankey #g_legend .g_drag_zone_leg') as d3.Selection<SVGGElement,unknown,HTMLElement,unknown>
      g_legend.call(drag_legend(dict_variable_application_data.data,resizeCanvas,node_function,link_function,dict_variable_application_data))
    }
  }
  /*******************************************************************************/
  const redrawAllNodes=()=>{
    DrawAllNodes(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,ref_alt_key_pressed,accept_simple_click,link_function,NodeTooltipsContent,ComponentUpdater,dict_hook_ref_setter_show_dialog_components,node_function)
  }
  const redrawAllLinks=()=>{
    DrawAllLinks(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,ref_alt_key_pressed,(windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute',
      link_function,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components
    )  }


  const menu_configuration_layout= OpenSankeyMenuConfigurationLayout(
    applicationContext,
    dict_variable_application_data,
    dict_variable_elements_selected,
    <></>,
    node_function,
    link_function,
    reDrawLegend,
    ComponentUpdater
  )

  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(
    applicationContext,
    dict_variable_application_data,
    dict_variable_elements_selected,
    false,
    dict_variable_elements_selected.ref_selected_style_node,
    [],
    [],
    [],
    link_function,
    ComponentUpdater,
    node_function
  )

  const sankey_menus = OpenSankeyMenus(
    applicationContext.t,
    Reinitialization,
    dict_variable_application_data.get_default_data,
    dict_hook_ref_setter_show_dialog_components,
    never_see_again,
    dict_variable_application_data.data,dict_variable_application_data.set_data as (d:SankeyData)=>void,
    [],
    [],
    [],
    [],
    //dict_variable_elements_selected.set_tags_selected,
    convert_data,
    setDiagram,
  )

  //TOAST That appeat to heavy processing func
  const toast_wait_func=<ToastWaitFunc
    dict_variable_application_data={dict_variable_application_data}
    dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
    applicationContext={applicationContext}
  />

  // MENU DRAGGABLE LINK Tooltip
  const menu_link_tooltip = MenuConfigurationLinksTooltip(
    data,set_data,
    dict_variable_elements_selected.multi_selected_links,
    applicationContext.t,true)



  // MENU DRAGGABLE NODE Tooltip editor
  const menu_node_tooltip = SankeyMenuConfigurationNodesTooltip(applicationContext,dict_variable_elements_selected,true)

  const menuNodeTooltip= MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_node_tooltip',
    menu_node_tooltip,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.IS')
  )

  // MENU DRAGGABLE NODE tag selection
  const menu_node_tags = SankeyMenuConfigurationNodesTags(applicationContext,dict_variable_application_data,dict_variable_elements_selected,node_function,ComponentUpdater,true)

  const menuNodeTags= MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_node_tags',
    menu_node_tags,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Menu.Etiquettes')
  )

  // MENU DRAGGABLE Link tag selection
  const menu_link_tags = MenuConfigurationLinksTags(dict_variable_application_data,dict_variable_elements_selected,applicationContext,true,ComponentUpdater,node_function,link_function)

  const menuLinkTags= MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_link_tags',
    menu_link_tags,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Flux')+' '+applicationContext.t('Menu.Etiquettes')
  )

  Object.values(dict_variable_application_data.data.levelTags).forEach(tag_group=>tag_group.activated = false)
  if ('Primaire' in dict_variable_application_data.data.levelTags) {
    dict_variable_application_data.data.levelTags['Primaire'].activated = true
  }

  const {filter}=dict_variable_application_data.data.display_style
  const toolbar = ToolbarBuilder(
    applicationContext,
    dict_variable_application_data,
    dict_variable_elements_selected,
    filter,
    ( new_current_filter: number ) => {
      const { display_style } = dict_variable_application_data.data
      display_style.filter = +new_current_filter
      dict_variable_application_data.set_data({ ...dict_variable_application_data.data })
    },
    <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{applicationContext.t('Banner.ndd')}</Popover.Header>
      <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>

        <>{(Object.entries(dict_variable_application_data.data.levelTags).length > 0) ? (<>
          {addSimpleLevelDropDown(dict_variable_application_data,reDrawLegend,redrawAllNodes,redrawAllLinks,recomputeDisplayedElement)}</>
        ) : (<>
          <Form.Control placeholder="Pas de filtrage" style={{ opacity: !windowSankey.SankeyToolsStatic ? '0.3' : '0', color: '#6c757d' }} disabled /></>)}</>
      </Popover.Body>
    </Popover>,
    '',
    dict_variable_elements_selected.first_selected_node,
    GetSankeyMinWidthAndHeight,
    dict_hook_ref_setter_show_dialog_components,
    never_see_again,
    [],
    reDrawLegend,
    node_function,link_function,
    recomputeDisplayedElement,ComponentUpdater
  )

  sankey_menus['toolbar']=toolbar

  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(
      dict_variable_application_data,
      uiElementsRef,
      contextMenu,
      e,dict_variable_application_data.data,dict_variable_elements_selected,
      dict_variable_application_data.set_data,closeAllMenu,ref_alt_key_pressed,accept_simple_click,link_function,NodeTooltipsContent,
      ComponentUpdater,dict_hook_ref_setter_show_dialog_components,applicationContext,node_function
    )
  }
  document.onkeydown = formatKeyHandler
  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  if( !windowSankey.SankeyToolsStatic ){
    setTimeout(()=>{
      //Ajout des events sur les l'ajout des noeuds aux click
      const svgSankey=d3.select('.opensankey #svg')

      svgSankey.on('mousedown',evt=>{
        EventOnZoneMouseDown(
          dict_variable_application_data,
          dict_variable_elements_selected,
          dict_hook_ref_setter_show_dialog_components,
          false,
          evt,
          start_point,
          contextMenu.closeAllMenuContext,
          node_function
        )
      })
      svgSankey.on('mousemove',evt=>{
        EventOnZoneMouseMove(
          dict_variable_application_data,
          dict_variable_elements_selected,
          evt,
          start_point
        )
      })
      svgSankey.on('mouseup',evt=>{
        EventOnZoneMouseUp(
          dict_variable_application_data,
          uiElementsRef,
          dict_variable_elements_selected,
          dict_hook_ref_setter_show_dialog_components,
          false,
          evt,
          start_point,
          legend_clicked,
          link_function,
          ComponentUpdater,
          node_function,
          reDrawLegend,
          resizeCanvas
        )
      })
    },100)
  }
  /*************************************************************************************************/
  useEffect(() => {

    DrawAllNodes(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,ref_alt_key_pressed,accept_simple_click,link_function,NodeTooltipsContent,ComponentUpdater,dict_hook_ref_setter_show_dialog_components,node_function)
    DrawAllLinks(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,ref_alt_key_pressed,(windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute',
      link_function,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components
    )
    // Zoom Behavior
    applyZoomEvent(dict_variable_application_data)
  },[data])
  /*************************************************************************************************/
  //Ajout d'un delay pour laisser le temps au Menu de render pour ensuite utiliser sa hauteur afin d'ajouter un margin top au draw
  useEffect(() => {
    const timer = setTimeout(() => {
      set_show_draw(true)
      AdjustSankeyZone(dict_variable_application_data,GetSankeyMinWidthAndHeight)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return <ChakraProvider theme={opensankey_theme}>
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <div className='div-Menu' style={{ 'backgroundColor' : 'WhiteSmoke'}} >
        {
          MenuDraggable(
            dict_hook_ref_setter_show_dialog_components,
            'ref_setter_show_menu_node_apparence',
            menu_configuration_nodes_attributes,
            contextMenu.pointer_pos,
            applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.apparence.apparence'),
          )
        }
        {
          MenuDraggable(
            dict_hook_ref_setter_show_dialog_components,
            'ref_setter_show_menu_node_io',
            SankeyMenuConfigurationNodesIO(
              applicationContext,
              dict_variable_application_data,
              dict_variable_elements_selected,
              GetLinkValue,
              node_function,link_function,
              ComponentUpdater,
              true
            )[0],
            contextMenu.pointer_pos,
            applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.PF.PFM')
          )
        }
        {
          MenuDraggable(
            dict_hook_ref_setter_show_dialog_components,
            'ref_setter_show_menu_link_data',
            MenuConfigurationLinksData(
              dict_variable_application_data,
              dict_variable_elements_selected,
              applicationContext,
              [<></>],
              true,
              ComponentUpdater,
              node_function,
              link_function
            ),
            contextMenu.pointer_pos,
            applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.data.données')
          )
        }
        {
          MenuDraggable(
            dict_hook_ref_setter_show_dialog_components,
            'ref_setter_show_menu_link_appearence',
            MenuConfigurationLinksAppearence(
              dict_variable_application_data,
              dict_variable_elements_selected,
              applicationContext,
              [],
              false,
              link_function,
              ComponentUpdater,
              true
            ),
            contextMenu.pointer_pos,
            applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.apparence.apparence')
          )
        }
        {
          MenuDraggable(
            dict_hook_ref_setter_show_dialog_components,
            'ref_setter_show_menu_layout',
            menu_configuration_layout,
            contextMenu.pointer_pos,
            applicationContext.t('Menu.MEP'),
            33
          )
        }
        {menuNodeTooltip}
        {menuNodeTags}
        {menuLinkTags}
        {
          MenuDraggable(
            dict_hook_ref_setter_show_dialog_components,
            'ref_setter_show_menu_link_tooltip',
            menu_link_tooltip,
            contextMenu.pointer_pos,
            applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.IB'),
          )}
        <>
          <Menu
            applicationContext={applicationContext}
            dict_variable_elements_selected={dict_variable_elements_selected}
            dict_variable_application_data={dict_variable_application_data}
            uiElementsRef={uiElementsRef}
            contextMenu={contextMenu}
            processFunctions={processFunctions}
            dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
            applicationDraw={applicationDraw}

            example_menu={<></>}
            configurations_menus={ OpenSankeyConfigurationsMenus(
              dict_variable_application_data,
              dict_variable_elements_selected,
              applicationContext,
              uiElementsRef,
              dict_hook_ref_setter_show_dialog_components,
              menu_configuration_layout,
              <SankeySettingsEditionElementTags
                applicationContext={applicationContext}
                dict_variable_application_data={dict_variable_application_data}
                elementTagNameProp='nodeTags'
                elementNameProp='nodes'
                node_function={node_function}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                reDrawLegend={reDrawLegend}
              />,
              <SankeySettingsEditionElementTags
                applicationContext={applicationContext}
                dict_variable_application_data={dict_variable_application_data}
                elementTagNameProp='fluxTags'
                elementNameProp='links'
                node_function={node_function}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                reDrawLegend={reDrawLegend}
              />,
              <SankeySettingsEditionElementTags
                applicationContext={applicationContext}
                dict_variable_application_data={dict_variable_application_data}
                elementTagNameProp='dataTags'
                elementNameProp='links'
                node_function={node_function}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                reDrawLegend={reDrawLegend}
              />,
              OpenSankeyMenuConfigurationNodes(
                applicationContext,
                dict_variable_application_data,
                dict_variable_elements_selected,
                contextMenu,
                menu_configuration_nodes_attributes,
                GetLinkValue,
                node_function,link_function,
                ComponentUpdater
              ),
              MenuConfigurationLinks(
                dict_variable_application_data,
                dict_variable_elements_selected,
                applicationContext,
                [<></>],
                [<></>],
                link_function,
                ComponentUpdater,
                node_function
              ),
              [<></>],
              false, //TODO
              link_function,
              ComponentUpdater,
              contextMenu,
              ref_alt_key_pressed,
              node_function
            )}
            menus={sankey_menus}
            cardsTemplate={<></>}
            external_modal={[
              <React.Fragment key={'modale_style_link'}>{SankeyModalStyleLink(
                applicationContext,
                dict_variable_application_data,
                dict_variable_elements_selected,
                dict_hook_ref_setter_show_dialog_components,
                contextMenu.pointer_pos,
                [],
                link_function,
                ComponentUpdater
              )
              }</React.Fragment>,
              <React.Fragment key={'modale_style_node'}>{SankeyModalStyleNode(
                applicationContext,
                dict_variable_application_data,
                dict_hook_ref_setter_show_dialog_components,
                dict_variable_elements_selected.ref_selected_style_node,ComponentUpdater,
                node_function,
                contextMenu.pointer_pos,
                []
              )}</React.Fragment>,
              <React.Fragment key={'modale_preference'}><ModalPreference
                dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
                ui={Object.values(OpenSankeyDefaultModalePreferenceContent(applicationContext.t,
                  dict_variable_application_data.data,
                  i18next,ComponentUpdater)).map(d=>{
                  return <>{d}<hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} /></>
                })}
                t={applicationContext.t}
                pointer_pos={contextMenu.pointer_pos}

              /></React.Fragment> ,
              <></>
            ]}
            Reinitialization={Reinitialization}
            formations_menu={formations_menu}
            additional_nav_item={[
              OpenSankeySaveButton(ComponentUpdater,applicationContext)
            ]}
            convert_data={convert_data}
            elementToDispose={elementToDispose}
            apply_transformation_additional_elements={[]}
            DiagramSelector={OpenSankeyDiagramSelector}
            callback={()=>null}
            ref_alt_key_pressed={ref_alt_key_pressed}
            accept_simple_click={accept_simple_click}
            link_function={link_function}
            NodeTooltipsContent={NodeTooltipsContent}
            ComponentUpdater={ComponentUpdater}
            node_function={node_function}
          />
        </>
        <ApplySaveJSONDialog
          t={applicationContext.t}
          dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
          sankey_data={dict_variable_application_data.data}
          additionnal_button_option_save_json={[]}
          ClickSaveDiagram={ClickSaveDiagram}
        />
      </div>
      <ContextMenuNode
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        dict_variable_elements_selected = {dict_variable_elements_selected}
        contextMenu = {contextMenu}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        agregation = {agregation}
        node_function={node_function}
        link_function={link_function}
        ComponentUpdater={ComponentUpdater}
        additional_context_element_menu = {[<></>]}
        additional_context_element_other = {[<></>]}
      />
      <ContextMenuLink
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        dict_variable_elements_selected = {dict_variable_elements_selected}
        contextMenu = {contextMenu}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        node_function={node_function}
        link_function={link_function}
        ComponentUpdater={ComponentUpdater}
      />
      <ContextMenuZdd
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        contextMenu = {contextMenu}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        node_function={node_function}
        link_function={link_function}
        reDrawLegend={reDrawLegend}
        ComponentUpdater={ComponentUpdater}

      />
      <ContextLegendTags
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        dict_variable_elements_selected = {dict_variable_elements_selected}
        contextMenu = {contextMenu}
        GetLinkValue = {GetLinkValue}
        ComponentUpdater={ComponentUpdater}
      />

      <SankeyDraw
        contextMenu={contextMenu}
        dict_variable_application_data={dict_variable_application_data}
        display_nodes={display_nodes}
        display_links={display_links}
        animation={useRef(false)}
        dict_variable_elements_selected={dict_variable_elements_selected}
        agregation={agregation}
        ref_alt_key_pressed={ref_alt_key_pressed}
        GetSankeyMinWidthAndHeight={GetSankeyMinWidthAndHeight}
      />
    </div>
    {toast_wait_func}
  </ChakraProvider>
}

export default SankeyApp



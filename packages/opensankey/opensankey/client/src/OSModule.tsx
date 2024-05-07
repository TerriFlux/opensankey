import {
  Dispatch,
  SetStateAction,
  useRef
} from 'react'
import { useTranslation } from 'react-i18next'
/*************************************************************************************************/
import {
  applicationContextType,
  applicationDrawType,
  ComponentUpdaterType,
  contextMenuType,
  dict_hook_ref_setter_show_dialog_componentsType,
  dict_variable_application_dataType,
  dict_variable_elements_selectedType,
  DrawAllType,
  initializeAdditionalMenusType,
  initializeLinkFunctionsType,
  LinkFunctionTypes,
  module_dialogsType,
  processFunctionsType,
  SankeyData,
  SankeyLink,
  SankeyNode,
  uiElementsRefType
} from './types/Types'
/*************************************************************************************************/
import {
  DrawArrows,
  GetSankeyMinWidthAndHeight,
  LinkStroke,
  resizeDrawingArea
} from './draw/SankeyDrawFunction'
import {
  AdjustSankeyZone,
  DefaultSankeyData,
  GetLinkValue,
  LinkColor,
  LinkText,
  NodeDisplayed,
  ReturnValueLink
} from './configmenus/SankeyUtils'
import { updateLayout } from './draw/SankeyDrawLayout'
import { os_all_element_to_transform } from './dialogs/SankeyMenuDialogs'
import { RetrieveExcelResults } from './dialogs/SankeyPersistence'
import { AddDrawLinksEvent, DrawAllLinks, drawAddLinks, drawLinkShape } from './draw/SankeyDrawLinks'
import { LinkTooltipsContent, NodeTooltipsContent } from './draw/SankeyTooltip'
import * as d3 from 'd3'
import { DrawLinkStartSabot } from './draw/SankeyDrawShapes'
import { DrawAllNodes, drawAddNodes, updateDrawNodeShape } from './draw/SankeyDrawNodes'
import { RedrawNodesLabel } from './draw/SankeyDrawNodesLabel'
import React from 'react'
import { MenuDraggable } from './topmenus/SankeyMenuTop'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { SankeyMenuConfigurationNodesTooltip } from './configmenus/SankeyMenuConfigurationNodesTooltip'
import { SankeyMenuConfigurationNodesTags } from './configmenus/SankeyMenuConfigurationNodesTags'
import { MenuConfigurationLinksTags } from './configmenus/SankeyMenuConfigurationLinksTags'
import { MenuConfigurationLinksTooltip } from './configmenus/SankeyMenuConfigurationLinksTooltip'

let logo = ''
try {
  /* eslint-disable */
  // @ts-ignore
  logo = require('./css/opensankey.png')
  /* eslint-enable */
  const path = window.location.href
  if ( !path.includes('localhost') ) {
    logo = logo.replace('static/', 'static/opensankey/')
  }
} catch (expt) {
  console.log('opensankey.png not found')
}

let logo_terriflux = ''
try {
  /* eslint-disable */
  // @ts-ignore
  logo_terriflux = require('./css/terriflux.png')
  /* eslint-enable */
  const path = window.location.href
  if ( !path.includes('localhost') ) {
    logo_terriflux = logo_terriflux.replace('static/', 'static/opensankey/')
  }
} catch (expt) {
  console.log('terriflux.png not found')
}

// Logo, names, licences
export const initializeApplicationContext : ()=>applicationContextType = ()=> {return {
  t : useTranslation().t,
  logo_width : 100,
  app_name : 'SankeySuite',//TODO
  url_prefix : '/opensankey/',
  logo : logo,
  logo_terriflux : logo_terriflux
}}

// Global variables not stored in SankeyData
// Mode, nodes and links selected, style selected...
export const initializeElementSelected : ()=>dict_variable_elements_selectedType = ()=> {
  const elementsSelected = {
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
    displayedInputLinkDataTagSetterRef : useRef<Dispatch<SetStateAction<{[k: string]: string;}>>[]>([]),
    displayedInputLinkValueRef : useRef<string>(''),
    userScaleRef : useRef(10)
  }
  // Reset list of setter of input link value
  elementsSelected.displayedInputLinkValueSetterRef.current=[]
  elementsSelected.displayedInputLinkDataTagSetterRef.current=[]
  elementsSelected.ref_display_link_opacity.current=[]
  return elementsSelected
}

// Réinitialise data et vide les noeud/liens sélectionnés
export const initializeReinitialization = (
  dict_variable_application_data :dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType,
  contextMenu : contextMenuType
) => ()=>{
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
    dict_variable_application_data.set_data(new_data)
    sessionStorage.setItem('dismiss_warning_sankey_plus','0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa','0')
}

// Data, displayed data, default data
export const initializeApplicationData : (  
  data:SankeyData,
  set_data:(_:SankeyData)=>void,
  get_default_data:()=>SankeyData,
  display_nodes : {[_:string]:SankeyNode},
  display_links : {[_:string]:SankeyLink})=>dict_variable_application_dataType = (
    data,
    set_data,
    get_default_data,
    display_nodes,
    display_links
  )=>{return {
    data : data,
    set_data : set_data,
    get_default_data : get_default_data,
    display_nodes : display_nodes,
    display_links : display_links,
    function_on_wait:useRef(()=>null),
    min_link_thickness:5
  }
}
// General functions necessay to draw the diagram
export const initializeApplicationDraw = ( dict_variable_application_data:dict_variable_application_dataType)=> {
  const reAdjustSankey=(dict_variable_application_data:dict_variable_application_dataType)=>()=>{
    AdjustSankeyZone(dict_variable_application_data,GetSankeyMinWidthAndHeight)
  }
  const resizeCanvas=(dict_variable_application_data:dict_variable_application_dataType)=>()=>{
    resizeDrawingArea(dict_variable_application_data,GetSankeyMinWidthAndHeight)
  }
  return {
    GetSankeyMinWidthAndHeight,
    updateLayout,
    resizeCanvas: resizeCanvas(dict_variable_application_data),
    reAdjustSankey: reAdjustSankey(dict_variable_application_data),
    all_element_UpdateLayout:os_all_element_to_transform,
    start_point:useRef([0,0])
  }
}
// Functions necessay to draw the links
export const initializeLinkFunctions : initializeLinkFunctionsType = (
  dict_variable_application_data,
  dict_variable_elements_selected,
  contextMenu,
  applicationContext,
  ComponentUpdater,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  ref_alt_key_pressed
) => {
  const node_arrow_visible =
  (data:SankeyData,n: SankeyNode) => !NodeDisplayed(data,n) || (n.inputLinksId.length === 0) || (!ReturnValueLink(data,data.links[n.inputLinksId[0]],'arrow')) ? false : true

  // Color for the sabot when the source node is an arrow
  const {data} = dict_variable_application_data
  const LinkSabotColor=LinkColor
  const OSDrawLinkStartSabot=(node_to_update:SankeyNode[])=>{
    const scale = d3.scaleLinear()
      .domain([0, data.user_scale])
      .range([0, 100])
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, data.user_scale])
    node_to_update.forEach(n=>{
      DrawLinkStartSabot(dict_variable_application_data,n,scale,inv_scale,GetLinkValue,LinkSabotColor)
    })
  }
  const _ = {
    GetLinkValue,
    LinkText,
    DrawArrows,
    LinkStroke,
    LinkSabotColor,
    reDrawLinkStartSabot:OSDrawLinkStartSabot,
    node_arrow_visible,
    LinkTooltipsContent,
    DrawAllLinks,
    drawAddLinks,
    drawLinkShape,
    RedrawLinks:(()=>null) as unknown as ((_:SankeyLink[])=>null),
    CreateLinksOnSVG:(()=>null) as unknown as ((_:SankeyLink[])=>null),
  }
  _.RedrawLinks=(links_to_update:SankeyLink[])=>{
    drawLinkShape(
      dict_variable_application_data,
      dict_variable_elements_selected,
      applicationContext,
      _,
      links_to_update,
      ComponentUpdater
    )
    AddDrawLinksEvent(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      _,
      ComponentUpdater,
      applicationContext,
      ref_alt_key_pressed
    )
    ComponentUpdater.updateComponenSaveInCache.current(false)
    return null
  } 

  _.CreateLinksOnSVG=(links_to_update:SankeyLink[])=>{
    drawAddLinks(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,
      _,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      links_to_update
    ) 
    ComponentUpdater.updateComponenSaveInCache.current(false)
    return null 
  }

  return _
}

// Functions necessay to draw the nodes
export const initializeNodeFunctions = (
  dict_variable_application_data: dict_variable_application_dataType,
  dict_variable_elements_selected: dict_variable_elements_selectedType,
  contextMenu:contextMenuType,
  applicationContext: applicationContextType,
  ComponentUpdater: ComponentUpdaterType,
  uiElementsRef:uiElementsRefType,
  applicationDraw:applicationDrawType,
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  ref_alt_key_pressed: React.MutableRefObject<boolean>,
  accept_simple_click: React.MutableRefObject<boolean>,
  recomputeDisplayedElement: () => void,
  link_function: LinkFunctionTypes
) => {
  const _ = {
    DrawAllNodes,
    drawAddNodes,
    RedrawNodes: (()=>null) as unknown as (nodes_to_update: SankeyNode[]) => null ,
    recomputeDisplayedElement,
    CreateNodesOnSVG:(()=>null) as unknown as (nodes_to_update: SankeyNode[]) => null ,
  }
  _.RedrawNodes=(nodes_to_update:SankeyNode[])=>{
    updateDrawNodeShape(dict_variable_application_data,link_function,dict_variable_elements_selected.multi_selected_nodes,nodes_to_update)
    RedrawNodesLabel(dict_variable_application_data,nodes_to_update,GetLinkValue,applicationContext.t,_)
    return null
  }
  _.CreateNodesOnSVG=(nodes_to_update:SankeyNode[])=>{
    drawAddNodes(contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,
      accept_simple_click,
      link_function,
      NodeTooltipsContent,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      _,nodes_to_update,
      GetSankeyMinWidthAndHeight,
      applicationDraw
    )
    return null
  }
  return _
}

export const DrawAll : DrawAllType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
  applicationContext,
  alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  GetSankeyMinWidthAndHeight,
  applicationDraw
)=>{
  DrawAllNodes(
    contextMenu,
    dict_variable_application_data,
    uiElementsRef,
    dict_variable_elements_selected,
    applicationContext,
    alt_key_pressed,
    accept_simple_click,
    link_function,
    NodeTooltipsContent,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components,
    node_function,
    GetSankeyMinWidthAndHeight,
    applicationDraw

  )
  DrawAllLinks(
    contextMenu,
    dict_variable_application_data,
    uiElementsRef,
    dict_variable_elements_selected,
    applicationContext,
    alt_key_pressed,
    //(windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute', TODO
    'absolute',
    link_function,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components
  )  
}

// Used to update the various component of the application
export const initializeComponentUpdater : ()=>ComponentUpdaterType = ()=> {
  const _ = {
    updateComponentMenuConfigNode:useRef(()=>null),
    updateComponentMenuConfigNodeAppearence:useRef(()=>null),
    updateComponentMenuConfigLink:useRef(()=>null),
    updateComponentToolbar:useRef(()=>null),
    updateComponentMenuConfig:useRef(()=>null),
    updateComponentMenuConfigLayout:useRef(()=>null),
    updateComponentMenu:useRef(()=>null),
    updateComponenSaveInCache:useRef(()=>null),
    updateComponentMenuNodeIOSelectSideNode:useRef([] as (()=>void)[]),
    updateComponentBtnUpdateLayout : useRef(()=>null),
    updateMenuConfigTextNodeTooltip:useRef([] as (()=>void)[]),
    updateMenuConfigTextLinkTooltip:useRef([] as (()=>void)[]),
  }
  _.updateMenuConfigTextNodeTooltip.current=[]
  _.updateMenuConfigTextLinkTooltip.current=[]
  _.updateComponentMenuNodeIOSelectSideNode.current=[]
  return _
}

// Ref to some key ui element (accordion item) in the application
export const initializeUIElementsRef : ()=> uiElementsRefType = ()=> {return {
  button_ref : useRef<HTMLLabelElement>(null),
  accordion_ref : useRef<HTMLDivElement>(null),
  links_accordion_ref : useRef<HTMLDivElement>(null),
  nodes_accordion_ref : useRef<HTMLDivElement>(null),
  ref_setter_nav_item_active : useRef<Dispatch<SetStateAction<number>>>(()=>null),
  ref_nav_item_active : useRef<number>(-1),
  ref_setter_sub_nav_item_active : useRef<Dispatch<SetStateAction<string>>>(()=>null)
}}

export const initializeAdditionalMenus : initializeAdditionalMenusType = () => {return {
  // Top Menus
  external_edition_item: [],
  external_file_item: [],
  external_file_export_item: [],
  externale_save_item: [],

  // Page settings
  extra_background_element: <></>,

  // Nodes
  advanced_appearence_content: [],
  advanced_label_content: [],
  advanced_label_value_content: [],
  additional_menu_configuration_nodes:{},

  // Links
  additional_data_element: [],
  additional_link_appearence_items: [],
  additional_link_visual_filter_content: [],

  // Preferences
  additional_preferences : [],

  // Configuration Menu
  additional_configuration_menus : []
}}

// Modal Dialogs
export const moduleDialogs : module_dialogsType = (
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  contextMenu,
  applicationDraw,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  link_function,
  ComponentUpdater,
  additional_menus,
  menu_configuration_nodes_attributes,
  reDrawLegend
) => {return [
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_node_apparence',
    menu_configuration_nodes_attributes,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.apparence.apparence'),
  ),
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
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_link_data',
      MenuConfigurationLinksData(
        dict_variable_application_data,
        dict_variable_elements_selected,
        applicationContext,
        additional_menus.additional_data_element,
        ComponentUpdater,
        node_function,
        link_function
      ),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.data.données')
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_link_appearence',
      MenuConfigurationLinksAppearence(
        dict_variable_application_data,
        dict_variable_elements_selected,
        applicationContext,
        additional_menus.additional_link_appearence_items,
        false,
        link_function,
        ComponentUpdater 
      ),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.apparence.apparence')
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_layout',
      OpenSankeyMenuConfigurationLayout(
        applicationContext,
        dict_variable_application_data,
        dict_variable_elements_selected,
        additional_menus.extra_background_element,
        node_function,
        link_function,
        reDrawLegend,
        ComponentUpdater
      ),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.MEP'),
      33
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_node_tooltip',
      SankeyMenuConfigurationNodesTooltip(
        applicationContext,
        dict_variable_elements_selected,
        ComponentUpdater,
        true
      ),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.IS')
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_node_tags',
      SankeyMenuConfigurationNodesTags(
        applicationContext,
        dict_variable_application_data,
        dict_variable_elements_selected,
        node_function,
        ComponentUpdater,
        true
      ),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Menu.Etiquettes')
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_link_tags',
      MenuConfigurationLinksTags(
        dict_variable_application_data,
        dict_variable_elements_selected,
        applicationContext,
        true,
        ComponentUpdater,
        node_function,
        link_function
      ),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.Flux')+' '+applicationContext.t('Menu.Etiquettes')
    ),
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
      'ref_setter_show_menu_link_tooltip',
      MenuConfigurationLinksTooltip(
        ComponentUpdater,
        dict_variable_elements_selected.multi_selected_links,
        applicationContext.t,true),
      contextMenu.pointer_pos,
      applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.IB'),
    )
]}

// Visibility states for the modal dialogs
export const initializeShowDialog : ()=>dict_hook_ref_setter_show_dialog_componentsType = () => {return {
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
  ref_setter_show_waiting : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
  ref_setter_show_resolution_save_png : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
  ref_setter_png_res_h:useRef<Dispatch<SetStateAction<number|undefined>>>(()=>null),
  ref_setter_png_res_v:useRef<Dispatch<SetStateAction<number|undefined>>>(()=>null)
}}

 // Menu opening on RMB
 export const initializeContextMenu : ()=> contextMenuType = ()=> {
  const _ = {
    ref_setter_contextualised_node : useRef<Dispatch<SetStateAction<SankeyNode|undefined>>>(),
    ref_contextualised_node : useRef<SankeyNode|undefined>(),
    ref_setter_contextualised_link : useRef<Dispatch<SetStateAction<SankeyLink|undefined>>>(),
    tagContext : useRef<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>([]),
    closeAllMenuContext : ()=>{
      _.ref_setter_contextualised_node.current!(undefined)
      _.ref_setter_contextualised_link.current!(undefined)
      _.tagContext.current![0][1](undefined)
      _.showContextZDDRef.current![1](false)
    },
    pointer_pos : useRef([window.innerWidth/4,window.innerHeight/4]),
    showContextZDDRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>]>()
  }
  return _
}

export const closeAllMenu=(
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  contextMenu:contextMenuType
)=>{
  const func = (
  )=> {
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
  return func
}

//- BackEnd
export const initializeProcessFunctions : (
    dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType
  )=> processFunctionsType = (dict_hook_ref_setter_show_dialog_components) => {
    const _ = {
      ref_processing : useRef(false),
      ref_setter_processing : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
      failure : useRef(false),
      not_started : useRef(true),
      ref_result : useRef<Dispatch<SetStateAction<string>>>(()=>null),
      path : useRef(''),
      RetrieveExcelResults,
      launch:(cur_path:string)=>{
        _.path.current = cur_path
        dict_hook_ref_setter_show_dialog_components.ref_setter_show_load.current!(true)
        _.ref_setter_processing.current(true)
        _.failure.current = true
        _.not_started.current = false
        _.ref_result.current('')
      }
    }
    return _
  }







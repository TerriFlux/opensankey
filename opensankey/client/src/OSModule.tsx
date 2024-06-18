import React, {
  Dispatch,
  SetStateAction,
  useRef
} from 'react'
import { useTranslation } from 'react-i18next'
/*************************************************************************************************/
import {
  ComponentUpdaterType,
  contextMenuType,
  dict_hook_ref_setter_show_dialog_componentsType,
  applicationDataType,
  applicationStateType,
  DrawAllType,
  InitalizeSelectorDetailNodesType,
  initializeAdditionalMenusType,
  initializeApplicationContextType,
  initializeApplicationDataType,
  initializeApplicationDrawType,
  initializeCloseAllMenuContextType,
  initializeElementSelectedType,
  initializeKeyHandlerType,
  initializeLinkFunctionsType,
  initializeMenuConfigurationFuncType,
  initializeNodeFunctionsType,
  initializeReinitializationType,
  initializeShowDialogType,
  initializeUIElementsRefType,
  InstallEventsOnSVGType,
  module_dialogsType,
  processFunctionsType,
  SankeyData,
  SankeyLink,
  SankeyNode,
  NodeFunctionTypes
} from './types/Types'
/*************************************************************************************************/
import {
  DrawArrows,
  GetSankeyMinWidthAndHeight,
  LinkStroke
} from './draw/SankeyDrawFunction'
import {
  AdjustSankeyZone,
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
import { MenuDraggable, OpenSankeySaveButton } from './topmenus/SankeyMenuTop'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { SankeyMenuConfigurationNodesTooltip } from './configmenus/SankeyMenuConfigurationNodesTooltip'
import { SankeyMenuConfigurationNodesTags } from './configmenus/SankeyMenuConfigurationNodesTags'
import { MenuConfigurationLinksTags } from './configmenus/SankeyMenuConfigurationLinksTags'
import { MenuConfigurationLinksTooltip } from './configmenus/SankeyMenuConfigurationLinksTooltip'
import { drag_legend, DrawLegend } from './draw/SankeyDrawLegend'
import { EventOnZoneMouseDown, EventOnZoneMouseMove, EventOnZoneMouseUp } from './draw/SankeyDrawEventFunction'
import * as SankeyConvert from './configmenus/SankeyConvert'
import { OpenSankeyConfigurationsMenus } from './configmenus/SankeyMenuConfiguration'
import { SankeySettingsEditionElementTags } from './configmenus/SankeyMenuConfigurationTags'
import { MenuConfigurationLinks } from './configmenus/SankeyMenuConfigurationLinks'
import { keyHandler } from './draw/SankeyDraw'
import { addSimpleLevelDropDown, setDiagram } from './configmenus/SankeyMenuBanner'
import { OpposingDragElements } from './draw/SankeyDragNodes'
import { Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverHeader, PopoverTrigger,Button, Input } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderTree } from '@fortawesome/free-solid-svg-icons'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      filiere?: string,
      header?: string,
      has_header?: boolean,
      footer?: boolean,
      logo_width?: number,
      excel?: string,
      publish?: boolean
      logo?: string
    }
  }

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
export const initializeApplicationContext : initializeApplicationContextType = ()=> {return {
  t : useTranslation().t,
  logo_width : 100,
  app_name : 'SankeySuite',//TODO
  url_prefix : '/opensankey/',
  logo : logo,
  logo_terriflux : logo_terriflux,
  has_free_account:false
}}

// Global variables not stored in SankeyData
// Mode, nodes and links selected, style selected...
export const initializeElementSelected : initializeElementSelectedType = ()=> {
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

    link_io:useRef('output'),
    link_pos:useRef('right'),

    ref_display_link_opacity : useRef<Dispatch<SetStateAction<string>>[]>([]),
    displayedInputLinkValueSetterRef : useRef<Dispatch<SetStateAction<string>>[]>([]),
    displayedInputLinkDataTagSetterRef : useRef<Dispatch<SetStateAction<{[k: string]: string;}>>[]>([]),
    displayedInputLinkValueRef : useRef<string>(''),

    userScaleRef : useRef(10),

    legend_clicked : useRef(false),
    never_see_again : useRef((localStorage.getItem('dontSeeAggainWelcome')==='1'))
  }
  // Reset list of setter of input link value
  elementsSelected.displayedInputLinkValueSetterRef.current=[]
  elementsSelected.displayedInputLinkDataTagSetterRef.current=[]
  elementsSelected.ref_display_link_opacity.current=[]
  return elementsSelected
}

// Réinitialise data et vide les noeud/liens sélectionnés
export const initializeReinitialization : initializeReinitializationType = (
  applicationData :applicationDataType,
  applicationState : applicationStateType,
  contextMenu : contextMenuType
) => ()=>{
  const new_data = applicationData.get_default_data()
  applicationState.multi_selected_nodes.current = []
  applicationState.multi_selected_links.current = []
  localStorage.removeItem('diff')
  localStorage.removeItem('data')
  localStorage.removeItem('last_save')
  localStorage.removeItem('initial_data')
  localStorage.removeItem('icon_imported')
  applicationState.ref_selected_style_node.current = 'default'
  applicationState.ref_selected_style_link.current = 'default'
  contextMenu.ref_setter_contextualised_node.current!(undefined)
  contextMenu.ref_setter_contextualised_link.current!(undefined)
  contextMenu.tagContext.current![0][1](undefined)
  contextMenu.showContextZDDRef.current![1](false)
  applicationData.set_data(new_data)
  sessionStorage.setItem('dismiss_warning_sankey_plus','0')
  sessionStorage.setItem('dismiss_warning_sankey_mfa','0')
}

// Data, displayed data, default data
export const initializeApplicationData : initializeApplicationDataType = (
  data,
  set_data,
  get_default_data,
  display_nodes,
  display_links
)=>{return {
  data : data,
  set_data : set_data,
  get_default_data : get_default_data,
  convert_data : SankeyConvert.convert_data,
  display_nodes : display_nodes,
  display_links : display_links,
  function_on_wait:useRef(()=>null),
  min_link_thickness:2,
  dataVarToUpdate:useRef(['']),
  setDiagram:setDiagram

}
}
// General functions necessay to draw the diagram
export const initializeApplicationDraw : initializeApplicationDrawType = (
  applicationData,
  applicationState,
  contextMenu:contextMenuType,
  applicationContext,
  ComponentUpdater,
  uiElementsRef,
  node_function,
  link_function,
  start_point,
  resizeCanvas,
  _
)=> {
  const reAdjustSankey=(applicationData:applicationDataType)=>()=>{
    AdjustSankeyZone(applicationData,GetSankeyMinWidthAndHeight)
  }
  const reDrawLegend=()=>{
    DrawLegend(
      applicationData,
      applicationContext,
      contextMenu,
      GetLinkValue,
      applicationState.legend_clicked,
      ComponentUpdater,
      reDrawLegend, //TODO why
      resizeCanvas
    )
    //if(!windowSankey.SankeyToolsStatic){ TODO
    const g_legend=d3.select(' .opensankey #g_legend .g_drag_zone_leg') as d3.Selection<SVGGElement,unknown,HTMLElement,unknown>
    g_legend.call( drag_legend(
      resizeCanvas,
      node_function,
      link_function,
      applicationData,
      applicationState
    ))
  }
  return {
    GetSankeyMinWidthAndHeight,
    updateLayout,
    resizeCanvas,
    reAdjustSankey: reAdjustSankey(applicationData),
    all_element_UpdateLayout:os_all_element_to_transform,
    start_point,
    reDrawLegend
  }
}
// Functions necessay to draw the links
export const initializeLinkFunctions : initializeLinkFunctionsType = (
  applicationData,
  applicationState,
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
  const {data} = applicationData
  const LinkSabotColor=LinkColor
  const OSDrawLinkStartSabot=(node_to_update:SankeyNode[])=>{
    const scale = d3.scaleLinear()
      .domain([0, data.user_scale])
      .range([0, 100])
    const inv_scale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, data.user_scale])
    node_to_update.forEach(n=>{
      DrawLinkStartSabot(applicationData,n,scale,inv_scale,GetLinkValue,LinkSabotColor)
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
      applicationData,
      applicationState,
      applicationContext,
      _,
      links_to_update,
      ComponentUpdater
    )
    AddDrawLinksEvent(
      contextMenu,
      applicationData,
      uiElementsRef,
      applicationState,
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
      applicationData,
      uiElementsRef,
      applicationState,
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
export const initializeNodeFunctions : initializeNodeFunctionsType = (
  applicationData,
  applicationState,
  contextMenu,
  applicationContext,
  ComponentUpdater,
  uiElementsRef,
  resizeCanvas,
  dict_hook_ref_setter_show_dialog_components,
  ref_alt_key_pressed,
  accept_simple_click,
  recomputeDisplayedElement,
  link_function
) => {
  const _ = {
    DrawAllNodes,
    drawAddNodes,
    RedrawNodes: (()=>null) as unknown as (nodes_to_update: SankeyNode[]) => null ,
    RedrawNodesLabels: (()=>null),
    recomputeDisplayedElement,
    CreateNodesOnSVG:(()=>null) as unknown as (nodes_to_update: SankeyNode[]) => null ,
    OpposingDragElements:OpposingDragElements,
    postProcessLoadExcel: (()=>null)
  } as NodeFunctionTypes
  _.RedrawNodes=(nodes_to_update:SankeyNode[])=>{
    updateDrawNodeShape(applicationData,link_function,applicationState.multi_selected_nodes,nodes_to_update)
    RedrawNodesLabel(applicationData,nodes_to_update,GetLinkValue,applicationContext.t,_)
    return null
  }
  _.RedrawNodesLabels=(nodes_to_update:SankeyNode[])=>{
    RedrawNodesLabel(applicationData,nodes_to_update,GetLinkValue,applicationContext.t,_)
  }
  _.CreateNodesOnSVG=(nodes_to_update:SankeyNode[])=>{
    drawAddNodes(
      contextMenu,
      applicationData,
      uiElementsRef,
      applicationState,
      applicationContext,
      ref_alt_key_pressed,
      accept_simple_click,
      link_function,
      NodeTooltipsContent,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      _,
      nodes_to_update,
      GetSankeyMinWidthAndHeight,
      resizeCanvas
    )
    return null
  }
  return _
}

export const DrawAll : DrawAllType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  applicationState,
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
  node_function.DrawAllNodes(
    contextMenu,
    applicationData,
    uiElementsRef,
    applicationState,
    applicationContext,
    alt_key_pressed,
    accept_simple_click,
    link_function,
    NodeTooltipsContent,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components,
    node_function,
    GetSankeyMinWidthAndHeight,
    applicationDraw.resizeCanvas

  )
  link_function.DrawAllLinks(
    contextMenu,
    applicationData,
    uiElementsRef,
    applicationState,
    applicationContext,
    alt_key_pressed,
    //(windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute', TODO
    'absolute',
    link_function,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components
  )



  // Legend
  applicationDraw.reDrawLegend()
}

export const InstallEventsOnSVG : InstallEventsOnSVGType = (
  contextMenu,
  applicationData,
  uiElementsRef,
  applicationState,
  link_function,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  applicationDraw
) => {
  const svgSankey=d3.select('.opensankey #svg')

  svgSankey.on('mousedown',evt=>{
    const token = true
    EventOnZoneMouseDown(
      applicationData,
      applicationState,
      dict_hook_ref_setter_show_dialog_components,
      token,
      evt,
      applicationDraw.start_point,
      contextMenu.closeAllMenuContext,
      node_function
    )
  })
  svgSankey.on('mousemove',evt=>{
    EventOnZoneMouseMove(
      applicationData,
      applicationState,
      evt,
      applicationDraw.start_point
    )
  })
  svgSankey.on('mouseup',evt=>{
    EventOnZoneMouseUp(
      applicationData,
      uiElementsRef,
      applicationState,
      dict_hook_ref_setter_show_dialog_components,
      false,
      evt,
      applicationDraw.start_point,
      applicationState.legend_clicked,
      link_function,
      ComponentUpdater,
      node_function,
      applicationDraw.reDrawLegend,
      applicationDraw.resizeCanvas
    )
  })
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
    updateComponentMenuNodeIOSelectSideNode:useRef(()=>null),
    updateComponentBtnUpdateLayout : useRef(()=>null),
    updateMenuConfigTextNodeTooltip:useRef([] as (()=>void)[]),
    updateMenuConfigTextLinkTooltip:useRef([] as (()=>void)[]),
    updatePreference:useRef(()=>null)
  }
  _.updateMenuConfigTextNodeTooltip.current=[]
  _.updateMenuConfigTextLinkTooltip.current=[]
  // _.updateComponentMenuNodeIOSelectSideNode.current=[]
  return _
}

// Ref to some key ui element (accordion item) in the application
export const initializeUIElementsRef : initializeUIElementsRefType = ()=> {return {
  button_ref : useRef<HTMLLabelElement>(null),
  accordion_ref : useRef<HTMLDivElement>(null),
  links_accordion_ref : useRef<HTMLDivElement>(null),
  nodes_accordion_ref : useRef<HTMLDivElement>(null),
  ref_setter_nav_item_active : useRef<Dispatch<SetStateAction<number>>>(()=>null),
  ref_nav_item_active : useRef<number>(-1),
  ref_setter_sub_nav_item_active : useRef<Dispatch<SetStateAction<string>>>(()=>null)
}}

export const initializeAdditionalMenus : initializeAdditionalMenusType = (
  additional_menus,
  updateMenus,
  applicationContext,
  applicationData,
  applicationDraw,
  ComponentUpdater
) => {
  if (!window.SankeyToolsStatic) {
    additional_menus.additional_nav_item.push(
      <OpenSankeySaveButton
        ComponentUpdater={ComponentUpdater}
        applicationContext={applicationContext}
      />
    )
  }
}

// Modal Dialogs
export const moduleDialogs : module_dialogsType = (
  applicationContext,
  applicationData,
  applicationState,
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
    <SankeyMenuConfigurationNodesIO
      applicationContext={applicationContext}
      applicationData={applicationData}
      applicationState={applicationState}
      GetLinkValue={GetLinkValue}
      node_function={node_function}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
      menu_for_modal={true}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.PF.PFM')
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_link_data',
    <MenuConfigurationLinksData
      applicationData={applicationData}
      applicationState={applicationState}
      applicationContext={applicationContext}
      additional_data_element={additional_menus.additional_data_element}
      ComponentUpdater={ComponentUpdater}
      node_function={node_function}
      link_function={link_function}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.data.données')
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_link_appearence',
    <MenuConfigurationLinksAppearence
      applicationData={applicationData}
      applicationState={applicationState}
      applicationContext={applicationContext}
      additional_link_appearence_items={additional_menus.additional_link_appearence_items}
      menu_for_style={false}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.apparence.apparence')
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_layout',
    <OpenSankeyMenuConfigurationLayout
      applicationData={applicationData}
      applicationState={applicationState}
      applicationContext={applicationContext}
      extra_background_element={additional_menus.extra_background_element}
      node_function={node_function}
      reDrawLegend={reDrawLegend}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.MEP'),
    33
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_node_tooltip',
    <SankeyMenuConfigurationNodesTooltip
      applicationContext={applicationContext}
      applicationState ={applicationState}
      ComponentUpdater={ComponentUpdater}
      menu_for_modal = {true}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.IS')
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_node_tags',
    <SankeyMenuConfigurationNodesTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      applicationState={applicationState}
      node_function={node_function}
      ComponentUpdater={ComponentUpdater}
      menu_for_modal={true}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Menu.Etiquettes')
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_link_tags',
    <MenuConfigurationLinksTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      applicationState={applicationState}
      menu_for_modal={true}
      ComponentUpdater={ComponentUpdater}
      node_function={node_function}
      link_function={link_function}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.Flux')+' '+applicationContext.t('Menu.Etiquettes')
  ),
  MenuDraggable(
    dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_link_tooltip',
    <MenuConfigurationLinksTooltip
      ComponentUpdater={ComponentUpdater}
      multi_selected_links={applicationState.multi_selected_links}
      t={applicationContext.t}
      menu_for_modal={true}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.IB'),
  )
]}

// Visibility states for the modal dialogs
export const initializeShowDialog : initializeShowDialogType = () => {return {
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
  ref_lauchToast : useRef<()=>void>(()=>null),
  ref_setter_show_resolution_save_png : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
  ref_setter_png_res_h:useRef<Dispatch<SetStateAction<number|undefined>>>(()=>null),
  ref_setter_png_res_v:useRef<Dispatch<SetStateAction<number|undefined>>>(()=>null)
}}

// Menu opening on RMB
export const initializeContextMenu : ()=> contextMenuType = ()=> {
  // Initialize the object onctaining contextMenu var
  const _ = {
    ref_setter_contextualised_node : useRef<Dispatch<SetStateAction<SankeyNode|undefined>>>(),
    ref_contextualised_node : useRef<SankeyNode|undefined>(),
    ref_setter_contextualised_link : useRef<Dispatch<SetStateAction<SankeyLink|undefined>>>(),
    tagContext : useRef<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>([]),
    pointer_pos : useRef([window.innerWidth/4,window.innerHeight/4]),
    showContextZDDRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>]>(),
    closeAllMenuContext:()=>null
  }  as contextMenuType

  // Then add the function closeAllMenuContext
  _.closeAllMenuContext =initializeCloseAllMenuContext(
    _.ref_setter_contextualised_node,
    _.ref_setter_contextualised_link,
    _.tagContext,
    _.showContextZDDRef
  )

  return _ as contextMenuType
}
export const initializeCloseAllMenuContext:initializeCloseAllMenuContextType=(
  ref_setter_contextualised_node ,
  ref_setter_contextualised_link ,
  tagContext ,
  showContextZDDRef
)=>{
  return ()=>{
    ref_setter_contextualised_node.current!(undefined)
    ref_setter_contextualised_link.current!(undefined)
    tagContext.current![0][1](undefined)
    showContextZDDRef.current![1](false)
  }
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
export const initializeMenuConfiguration:initializeMenuConfigurationFuncType=(
  applicationData,
  applicationState,
  applicationContext,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  additional_menus,
  node_function,
  link_function,
  applicationDraw,
  ComponentUpdater,
  updateMenus,
  menu_configuration_nodes,
  config_link_data,
  config_link_attr,
  contextMenu,
  ref_alt_key_pressed
)=>{
  return OpenSankeyConfigurationsMenus(
    applicationData,
    applicationState,
    applicationContext,
    uiElementsRef,
    dict_hook_ref_setter_show_dialog_components,
    <OpenSankeyMenuConfigurationLayout
      applicationData={applicationData}
      applicationState={applicationState}
      applicationContext={applicationContext}
      extra_background_element={additional_menus.extra_background_element}
      node_function={node_function}
      reDrawLegend={applicationDraw.reDrawLegend}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
    />,
    <SankeySettingsEditionElementTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      elementTagNameProp='nodeTags'
      elementNameProp='nodes'
      node_function={node_function}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
      updateMenus={updateMenus}
      reDrawLegend={applicationDraw.reDrawLegend}
    />,
    <SankeySettingsEditionElementTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      elementTagNameProp='fluxTags'
      elementNameProp='links'
      node_function={node_function}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
      updateMenus={updateMenus}
      reDrawLegend={applicationDraw.reDrawLegend}
    />,
    <SankeySettingsEditionElementTags
      applicationContext={applicationContext}
      applicationData={applicationData}
      elementTagNameProp='dataTags'
      elementNameProp='links'
      node_function={node_function}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
      updateMenus={updateMenus}
      reDrawLegend={applicationDraw.reDrawLegend}
    />,
    menu_configuration_nodes,
    MenuConfigurationLinks(
      applicationData,
      applicationState,
      applicationContext,
      config_link_data,
      config_link_attr,
      link_function,
      ComponentUpdater,
      node_function
    ),
    additional_menus.additional_configuration_menus,
    link_function,
    ComponentUpdater,
    contextMenu,
    ref_alt_key_pressed,
    node_function
  )
}

export const initializeKeyHandler:initializeKeyHandlerType=(
  applicationData,
  uiElementsRef,
  contextMenu,
  e,
  applicationState,
  closeAllMenu,
  ref_alt_key_pressed,
  accept_simple_click,
  link_function,
  NodeTooltipsContent,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  applicationContext,
  node_function,
  applicationDraw,
)=>{
  keyHandler(
    applicationData,
    uiElementsRef,
    contextMenu,
    e,
    applicationState,
    closeAllMenu,
    ref_alt_key_pressed,
    accept_simple_click,
    link_function,
    NodeTooltipsContent,
    ComponentUpdater,
    dict_hook_ref_setter_show_dialog_components,
    applicationContext,
    node_function,
    applicationDraw
  )
}

export const InitalizeSelectorDetailNodes:InitalizeSelectorDetailNodesType=(
  applicationContext,
  applicationData,
  applicationDraw,
  node_function,
  link_function)=>{
  // const redrawAllNodes=()=>node_function.RedrawNodes(Object.values(applicationData.display_nodes))
  // const redrawAllLinks=()=>link_function.RedrawLinks(Object.values(applicationData.display_links))

  return <Popover placement='left' id='popover_details_level'>
    <PopoverTrigger>
      <Button variant='toolbar_button_2' id='btn_open_popover_details_level'>
        <FontAwesomeIcon icon={faFolderTree} />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverArrow />
      <PopoverCloseButton />
      <PopoverHeader>{applicationContext.t('Banner.ndd')}</PopoverHeader>
      <PopoverBody>
        <>
          {
            (Object.entries(applicationData.data.levelTags).length > 0) ?
              (<>
                {
                  addSimpleLevelDropDown(
                    applicationData,
                    applicationDraw,
                    node_function,
                    link_function)
                }
              </>) :
              (<>
                <Input
                  placeholder="Pas de filtrage"
                  isDisabled
                />
              </>)
          }
        </>
      </PopoverBody>
    </PopoverContent>

  </Popover>
}



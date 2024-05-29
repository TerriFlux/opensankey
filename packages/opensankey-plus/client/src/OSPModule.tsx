import {
  Dispatch,
  SetStateAction,
  useRef,
  useState
} from 'react'
import React from 'react'
import ReactQuill from 'react-quill'
import * as d3 from 'd3'
import { 
  dict_hook_ref_setter_show_dialog_componentsType, contextMenuType, 
  SankeyData, 
  module_dialogsType,  
  DrawAllType,
  InstallEventsOnSVGType,
  NodeFunctionTypes,
  SankeyNode,
  InitalizeSelectorDetailNodesType
} from 'open-sankey/src/types/Types'
import { 
  OSPApplicationDataVarType,
  OSPGetDefaultData,
  OSPInitializeAdditionalMenusType,
  OSPInitializeApplicationContextVarType,
  OSPInitializeApplicationDrawType,
  OSPInitializeComponentUpdaterType,
  OSPInitializeElementSelectedType,
  OSPInitializeKeyHandlerType,
  OSPInitializeLinkFuntionType,
  OSPInitializeNodeFunctionsType,
  OSPInitializeReinitializationType,
  OSPInitializeShowDialogType,
  OSPInitializeUIElementsRefType,
  OSPUpdateMenuConfType,
  OSPinitializeApplicationDataVarType,
  OSPApplicationContextType,
  OSPApplicationDrawType,
  OSPApplicationDrawVarType,
  OSPComponentUpdaterType, OSPElementsSelectedType, OSPElementsSelectedVarType, OSPNodeFuntionType, OSPUiElementsRefType, OSPApplicationDataType, 
  OSPContextMenuType, OSPData, OSPLabel, 
  OSPLink, 
  OSPNode, 
  OSPShowMenuComponentsType,
  OSPShowMenuComponentsVarType
} from '../types/Types'

import { 
  MenuDraggable, closeAllMenu, 
  initializeContextMenu,
  updateLayoutOSTyped,
  NodeTooltipsContent,
  convert_data,
  EventOnZoneMouseDown,
  EventOnZoneMouseUp,
  initializeCloseAllMenuContext,
  setDiagram,
  updateDrawNodeShape,
  RedrawNodesLabel,
  DrawAllNodes,
  AddAllDropDownNode,
  AdjustSankeyZone
} from './import/OpenSankey'
import { os_all_element_to_transform } from 'open-sankey/dist/dialogs/SankeyMenuDialogs'
import { OSPNodeFO } from './SankeyPlusForeignObject'
import { OSPDrawArrows, OSPLinkStroke, MenuConfLinkApparenceGradient } from './SankeyPlusGradient'
import { OSPDrawLabels, sankey_plus_min_width_and_height, zone_selection_label } from './SankeyPlusLabels'
import { OSPMenuPreferenceLabels, ZDTMenuAsAccordeonItem, OSPMenuConfigurationFreeLabels, context_zdt, blur_ZDT_wysiwyg } from './SankeyPlusMenuConfigurationLabels'
import { OSPDrawNodesIllustration, OSPNodeClickEvent, OSPNodeIcon, OSPHyperLink } from './SankeyPlusNodes'
import { DefaultOSPStyleLink,  ImportImageAsSvgBg, OSPItemExport, OSPLinkSabotColor, SetSvgBg } from './SankeyPlusUtils'
import { plus_convert_data, plus_sankey_layout, plus_all_element_to_transform, OSPTransformationElements, } from './SankeyPlusConvert'
import { 
  GetDataFromView, MenuEnregistrerView, OSPKeyHandler, OSPBannerView, 
  SelecteurView, getSetDiagramFunc, modal_transparent_view_attr, modal_view_not_saved, 
  ViewToast, ViewToast_update_view, viewsAccordion 
} from './SankeyPlusViews'

import ModalSelectionIcon from './SankeyPlusCatalogIcon'

import { Col, Form, FormGroup, Popover, Row } from 'react-bootstrap'
import { t } from 'i18next'
import { windowSankey } from 'open-sankey/dist/configmenus/SankeyUtils'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const OSPDefaultData = () => {
  return {
    is_catalog:false,
    view:[],
    current_view:'none',
    labels:{},
    icon_catalog:{},
    style_link:{'default':DefaultOSPStyleLink()},
    // unitary_node:[],
    // unit_link_value_display:'percent',
    background_image:''
  } 
}

export const OSPInitializeApplicationContext : OSPInitializeApplicationContextVarType = ()=>{
  let logo_OSP = ''
  try {
    /* eslint-disable */
      // @ts-ignore
      logo_OSP = require('./css/OSP.png')
      /* eslint-enable */
    const path = window.location.href
    if ( !path.includes('localhost') ) {
      logo_OSP = logo_OSP.replace('static/', 'static/sankeysuite/')
    }
  } catch (expt) {
    console.log('logo_OSP not found')
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
  return {
    has_open_sankey_plus : true,
    logo : logo_OSP,
    logo_terriflux : logo_terriflux
  } 
}


export const OSPInitializeApplicationData : OSPinitializeApplicationDataVarType= (
  data,
  set_data,
  get_default_data,
  display_nodes,
  display_links,
) => {
  const data_plus=data as OSPData
  const [master_data, set_master_data] = useState<OSPData>() // useState OK
  const [view, pre_set_view] = useState(data_plus.current_view) // useState OK
  const set_view=(s:string)=>{
    data_plus.current_view=s
    if(master_data){
      master_data.current_view=s
    }
    pre_set_view(s)
  }
  const [view_not_saved,set_view_not_saved]=useState('')
  const plus_display_nodes=display_nodes as {[_:string]:OSPNode}
  const plus_display_links=display_links as {[_:string]:OSPLink}
  const set_data_plus=set_data as (_:OSPData)=>void
  const plus_get_defaut_data=get_default_data as OSPGetDefaultData
  const useOpenSankeySetDiagram = (master_data && master_data.view.length > 0) || window.SankeyToolsStatic
    
  // If initial data has views & has a current view then update current data to the view (and initial data become master data) 
  if (data_plus.view && data_plus.view.length > 0 && !master_data) {
    set_master_data({...JSON.parse(JSON.stringify(data))})
    if(data_plus.current_view && data_plus.current_view!=='none'){
      const view_to_display= GetDataFromView(data_plus,data_plus.current_view)
      set_view(data_plus.current_view)
      set_data(view_to_display as OSPData)
    }
  }

  return { 
    data:data_plus,
    set_data:set_data_plus,
    display_nodes:plus_display_nodes, 
    display_links:plus_display_links,
    get_default_data:plus_get_defaut_data,
    convert_data : (data:SankeyData,DefaultSankeyData:()=>SankeyData) => {
      convert_data(data,DefaultSankeyData)
      plus_convert_data(data as OSPData,DefaultSankeyData as ()=> OSPData)
    },
    master_data,
    set_master_data,
    view,
    set_view,
    view_not_saved:view_not_saved,
    set_view_not_saved:set_view_not_saved,
    setDiagram:useOpenSankeySetDiagram?getSetDiagramFunc(set_master_data,set_view,plus_get_defaut_data ) : setDiagram,
    is_catalog:false
  } as OSPApplicationDataVarType
}

export const OSPInitializeElementSelected : OSPInitializeElementSelectedType = ()=>{
  return {
    multi_selected_nodes : useRef([]),
    multi_selected_links : useRef([]),
    multi_selected_label : useRef([]),
    r_editor_ZDT :  useRef<ReactQuill|undefined>(),
    r_setter_editor_content_fo_zdt : useRef<Dispatch<SetStateAction<string>>[]>([]),
    r_setter_editor_content_fo_node : useRef<Dispatch<SetStateAction<string>>>(),
    r_setter_value_editor_name_view: useRef<Dispatch<SetStateAction<string>>>(),
    saveViewGetter:useRef<boolean>(false)
  } as OSPElementsSelectedVarType
}

export const OSPInitializeShowDialog : OSPInitializeShowDialogType = ()=>{
  return {
    ref_setter_show_menu_node_icon : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_import_icons : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_zdt : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_transparent_view_attr: useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    show_toast_new_view: useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    show_toast_update_view: useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
  } as  OSPShowMenuComponentsVarType
}
export const OSPcloseAllMenu = closeAllMenu

// Modify Application Draw
export const OSPInitializeApplicationDraw : OSPInitializeApplicationDrawType= (  
  applicationData,
  applicationState,
  contextMenu,
  applicationContext,
  ComponentUpdater,
  uiElementsRef,
  node_function,
  link_function,
  start_point,
  resizeCanvas
) => {
  const _ = {
    reDrawOSPLabels : (object_to_update:OSPLabel[])=>{
      OSPDrawLabels(
          applicationData as OSPApplicationDataType,
          applicationState as OSPElementsSelectedType,
          uiElementsRef as OSPUiElementsRefType,
          contextMenu as OSPContextMenuType,
          applicationContext as OSPApplicationContextType,
          sankey_plus_min_width_and_height,
          contextMenu.closeAllMenuContext,
          _ as unknown as OSPApplicationDrawType,
          ComponentUpdater as OSPComponentUpdaterType,
          object_to_update,
          link_function,
          start_point,
          resizeCanvas
      )
      ComponentUpdater.updateComponenSaveInCache.current(false)
    },
    GetSankeyMinWidthAndHeight : sankey_plus_min_width_and_height,
    updateLayout : (
      data: SankeyData,
      new_layout: SankeyData,
      mode:string[],
      synchronize?:boolean
    )=> {
      updateLayoutOSTyped(data,new_layout,mode,synchronize)
      plus_sankey_layout(data as OSPData,new_layout as OSPData,mode)
    },
    all_element_UpdateLayout : [...os_all_element_to_transform,...plus_all_element_to_transform],
    reAdjustSankey:()=>(()=>{
      AdjustSankeyZone(applicationData,sankey_plus_min_width_and_height)
    })()
  }
  return _ as OSPApplicationDrawVarType
}

export const OSPInitializeComponentUpdater : OSPInitializeComponentUpdaterType  = ()=> {
  const _ = {
    updateComponentMenuConfigZdt : useRef([] as (()=>void)[]),
  }
  _.updateComponentMenuConfigZdt.current = []
  return _ 
}

export const OSPInitializeReinitialization : OSPInitializeReinitializationType = (
  applicationData ,
  applicationState 
) => ()=> {
  const recast_selected_dict=applicationState as OSPElementsSelectedType
  recast_selected_dict.multi_selected_label.current = []
  localStorage.removeItem('icon_imported')
  sessionStorage.setItem('dismiss_warning_sankey_plus','0');
  (applicationData as OSPApplicationDataType).set_master_data(undefined);
  (applicationData as OSPApplicationDataType).set_view('none')
}

// Modify context menu
export const OSPInitializeContextMenu : ()=> contextMenuType = ()=> {
  const context_menu = initializeContextMenu()
  const osp_context_menu = context_menu as OSPContextMenuType
  osp_context_menu.contextualised_zdt = useRef<Dispatch<SetStateAction<OSPLabel|undefined>>>()
  osp_context_menu.closeAllMenuContext = ()=> {
    initializeCloseAllMenuContext(
      context_menu.ref_setter_contextualised_node,
      context_menu.ref_setter_contextualised_link,
      context_menu.tagContext,
      context_menu.showContextZDDRef
    )()
    osp_context_menu.contextualised_zdt.current!(undefined)
  }
  return context_menu
}

// Modify Ref used to open accordion item
export const OSPInitializeUIElementsRef : OSPInitializeUIElementsRefType = () => {
  return {
    zdt_accordion_ref : useRef<HTMLDivElement>(null),
    ViewSelector:useRef<JSX.Element>(null)
  }
}

// Only override 
export const OSPInitializeLinkFunctions : OSPInitializeLinkFuntionType = () => {
  return {
    DrawArrows : OSPDrawArrows,
    LinkStroke : OSPLinkStroke ,
    LinkSabotColor : OSPLinkSabotColor
  } 
}

export const OSPInitializeNodeFunctions : OSPInitializeNodeFunctionsType = (  
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
  const animating = useRef(false) //TODO
  const reDrawIllustration = (nodes_to_update:OSPNode[])=>{
    OSPDrawNodesIllustration(
      applicationData.data as OSPData,
      nodes_to_update,
      applicationState as OSPElementsSelectedType,
      NodeTooltipsContent,
      link_function.GetLinkValue,
      applicationContext.t
    )
  }
  const _ = {
    reDrawIllustration : reDrawIllustration,
    reDrawOSPNodeEvent : (nodes_to_update:OSPNode[])=>{
      OSPNodeClickEvent(
        applicationData as OSPApplicationDataType,
        applicationState as OSPElementsSelectedType,
        uiElementsRef,
        animating,
        accept_simple_click,
        link_function.GetLinkValue,
        ComponentUpdater,
        nodes_to_update
      )
    } 
  } as unknown as NodeFunctionTypes
  _.RedrawNodes=(nodes_to_update:SankeyNode[])=>{
    const osp_nodes_to_update=nodes_to_update as OSPNode[]

    updateDrawNodeShape(applicationData,link_function,applicationState.multi_selected_nodes,nodes_to_update)
    RedrawNodesLabel(applicationData,nodes_to_update,link_function.GetLinkValue,applicationContext.t,_)
    reDrawIllustration(nodes_to_update as OSPNode[])
    OSPNodeClickEvent(
      applicationData as OSPApplicationDataType,
      applicationState as OSPElementsSelectedType,
      uiElementsRef,
      animating,
      accept_simple_click,
      link_function.GetLinkValue,
      ComponentUpdater,
      osp_nodes_to_update
    )
    return null
  }
  _.DrawAllNodes  = (
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
    resizeCanvas
  ) => {
    const osp_nodes_to_update=Object.values(applicationData.display_nodes) as OSPNode[]

    DrawAllNodes(
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
      resizeCanvas      
    )
    reDrawIllustration(osp_nodes_to_update)    
    OSPNodeClickEvent(
      applicationData as OSPApplicationDataType,
      applicationState as OSPElementsSelectedType,
      uiElementsRef,
      animating,
      accept_simple_click,
      link_function.GetLinkValue,
      ComponentUpdater,
      osp_nodes_to_update
    )
  }
  return _ as OSPNodeFuntionType
}

// Since AdditionalMenus is an OS var specially created to add external element in menus
// we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
export const OSPInitializeAdditionalMenus : OSPInitializeAdditionalMenusType = (
  additionalMenus,
  updateMenus,
  applicationContext,
  applicationData,
  applicationDraw,
  ComponentUpdater,
  applicationState,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  link_function
) => {
  const OSPApplicationContext=applicationContext as OSPApplicationContextType
  const plus_dict_app_data=applicationData as OSPApplicationDataType

  (uiElementsRef as OSPUiElementsRefType).ViewSelector.current=<SelecteurView
    applicationData={plus_dict_app_data}
    applicationState={applicationState as OSPElementsSelectedType}
    t={applicationContext.t}
    set_view_not_saved={plus_dict_app_data.set_view_not_saved}
    connected={OSPApplicationContext.has_open_sankey_plus}
  />
  // Top Menus
  additionalMenus.external_file_export_item.push(<OSPItemExport/>)

  // Page settings
  additionalMenus.extra_background_element = <ImportImageAsSvgBg
    t={applicationContext.t}
    data={applicationData.data as OSPData}
    set_data={applicationData.set_data as (_:OSPData)=>void}
    has_open_sankey_plus={true}
  />

  additionalMenus.externale_navbar_item['view']=<OSPBannerView
    applicationData={applicationData as OSPApplicationDataType}
    applicationContext={OSPApplicationContext}
    dict_hook_ref_setter_show_dialog_components={(dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType)}
    convert_data={applicationData.convert_data}
    view_selector={(uiElementsRef as OSPUiElementsRefType).ViewSelector.current as JSX.Element}
  />


  // Menu conf nodes
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.icon']=<OSPNodeIcon
    t={applicationContext.t}
    data={applicationData.data as OSPData}
    multi_selected_nodes={applicationState.multi_selected_nodes as { current: OSPNode[]; }}
    is_activated={true}
    menu_for_modal={false}
    dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType}
    node_function={node_function as OSPNodeFuntionType}
    ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.fo']= <OSPNodeFO
    t={applicationContext.t}
    data={applicationData.data as OSPData}
    multi_selected_nodes={applicationState.multi_selected_nodes as { current: OSPNode[]; }}
    is_activated={true}
    applicationState={applicationState as OSPElementsSelectedType}
    node_function={node_function as OSPNodeFuntionType}
  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.hl']=<OSPHyperLink
    t={applicationContext.t}
    data={applicationData.data as OSPData}
    multi_selected_nodes={applicationState.multi_selected_nodes as { current: OSPNode[]; }}
    is_activated={true}
    node_function={node_function as OSPNodeFuntionType}
  />
    
  //Links
  additionalMenus.additional_link_appearence_items.push(<MenuConfLinkApparenceGradient
    applicationContext={applicationContext as OSPApplicationContextType}
    ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
    multi_selected_links={applicationState.multi_selected_links}
    data={applicationData.data as OSPData}
    link_function={link_function}
    is_activated={true}
    menu_for_style={false}
    selected_style_link={applicationState.ref_selected_style_link}
  />)
  //Preferences
  additionalMenus.additional_preferences.push(
    <OSPMenuPreferenceLabels
      t={applicationContext.t}
      data={applicationData.data as OSPData}
      updateMenus={updateMenus}
    />
  )
  //- Builds Configuration Menus FreeLabel
  additionalMenus.additional_configuration_menus.push(
    <ZDTMenuAsAccordeonItem
      data={applicationData.data as OSPData}
      uiElementsRef={uiElementsRef as OSPUiElementsRefType}
      applicationContext={applicationContext as OSPApplicationContextType}
      content_menu_zdt={
        <OSPMenuConfigurationFreeLabels
          applicationData={applicationData as OSPApplicationDataType}
          applicationContext={applicationContext as OSPApplicationContextType}
          applicationState={(applicationState as OSPElementsSelectedType)}
          reDrawOSPLabels={(applicationDraw as OSPApplicationDrawType).reDrawOSPLabels}
          ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
        />
      }
    />
  )

  const plusData = applicationData as OSPApplicationDataType
  if (plusData.master_data && plusData.master_data.current_view && plusData.master_data.current_view!=='none') {
    additionalMenus.additional_file_save_json_option.push(
      <MenuEnregistrerView
        t={t}
        elementsSelected={applicationState as OSPElementsSelectedType}
      />
    )
  }
 
  // add option for updateLayout (OSP var to update)
  // (Only add these options if connected with OSP)
  const component_apply_transfor_OSP= <OSPTransformationElements
    applicationData={plusData}
    applicationContext={applicationContext as OSPApplicationContextType}
    ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
  />

  // Add buttons in the menu transformation for adding ZDT and views as variable transferable in SuiteUpdateLayout
  additionalMenus.apply_transformation_additional_elements.push(component_apply_transfor_OSP)
}

// module_dialogsType return a JSX.Element array wich is a react type
// we don't need to recast it ( and don't need additionnal parameters for OSP dialogs)
export const OSPModuleDialogs : module_dialogsType = (
  applicationContext,
  applicationData,
  applicationState,
  contextMenu,
  applicationDraw,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  link_function,
  ComponentUpdater
  // additional_menus,
  // menu_configuration_nodes_attributes,
  // reDrawLegend
) => {
  const OSP_elements_selected = applicationState as OSPElementsSelectedType
  const OSP_dict_hook_ref=dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType
  const OSP_dict_app_data=applicationData as OSPApplicationDataType
  const OSP_node_function=node_function as OSPNodeFuntionType
  return [
    MenuDraggable(
      OSP_dict_hook_ref,
    'ref_setter_show_menu_zdt' as unknown as keyof dict_hook_ref_setter_show_dialog_componentsType,
    <OSPMenuConfigurationFreeLabels
      applicationData={OSP_dict_app_data}
      reDrawOSPLabels={(applicationDraw as OSPApplicationDrawType).reDrawOSPLabels}
      applicationContext={applicationContext as OSPApplicationContextType}
      ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
      applicationState={OSP_elements_selected}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.LL')
    ),
    context_zdt(
      contextMenu,
      applicationContext.t,
      OSP_dict_app_data,
      OSP_dict_hook_ref,
      applicationState as OSPElementsSelectedType,
      ComponentUpdater as OSPComponentUpdaterType,
      (applicationDraw as OSPApplicationDrawType).reDrawOSPLabels
    ),
    modal_transparent_view_attr(
      OSP_dict_hook_ref,
      OSP_dict_app_data,
      applicationContext.t
    ),
    modal_view_not_saved(
      OSP_dict_app_data.view_not_saved, 
      OSP_dict_app_data.set_view_not_saved,
      applicationContext.t,
      applicationData as OSPApplicationDataType
    ),
    <ModalSelectionIcon 
      t={applicationContext.t}
      applicationData={OSP_dict_app_data}
      applicationState={OSP_elements_selected}
      dict_hook_ref_setter_show_dialog_components={OSP_dict_hook_ref}
      node_function={OSP_node_function }
    />,
    <ViewToast
      dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType}
    />,
    <ViewToast_update_view
      dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType}
    />
  ]
}

// Function to draw element on svg area it return nothing
// we don't need to recast it ( and don't need additionnal parameters for OSP draw elements functions)
export const OSPDrawAll : DrawAllType = (
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
  d3.selectAll(' .opensankey #svg #g_label').remove()
  d3.selectAll(' .opensankey #svg #g_label_handles').remove()

  // Insert la balise qui contient tous les labels libres avant la balise de la légende
  d3.select('.opensankey #svg').insert('g','#g_links').attr('class','g_label').attr('id','g_label')
  d3.select('.opensankey #svg').append('g').attr('class','g_label_handles').attr('id','g_label_handles')

  // // Call the function that add links to the sankey
  // d3.selectAll(' .opensankey #svg #sankey_def').remove()
  // d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')

  // Free Labels
  OSPDrawLabels(
    applicationData as OSPApplicationDataType,
    applicationState as OSPElementsSelectedType,
    uiElementsRef as OSPUiElementsRefType,
    contextMenu as OSPContextMenuType,
    applicationContext as OSPApplicationContextType,
    applicationDraw.GetSankeyMinWidthAndHeight,
    contextMenu.closeAllMenuContext,
    applicationDraw as OSPApplicationDrawType,
    ComponentUpdater as OSPComponentUpdaterType,
    Object.values((applicationData as OSPApplicationDataType).data.labels),
    link_function,
    applicationDraw.start_point,
    applicationDraw.resizeCanvas
  )
  SetSvgBg(applicationData.data as OSPData)
}

// Function to add event on elements on svg area it return nothing
// we don't need to recast it ( and don't need additionnal parameters for OSP add event functions)
export const OSPInstallEventsOnSVG : InstallEventsOnSVGType = (
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
  const svgSankey = d3.select('.opensankey #svg')
  svgSankey.on('mousedown',evt=>{
    blur_ZDT_wysiwyg((applicationState as unknown as OSPElementsSelectedVarType).r_editor_ZDT as { current: ReactQuill; })
    EventOnZoneMouseDown(
      applicationData,
      applicationState,
      dict_hook_ref_setter_show_dialog_components,
      false,
      evt,
      applicationDraw.start_point,
      contextMenu.closeAllMenuContext,
      node_function
    )
  })
  svgSankey.on('mouseup',evt=>{
    zone_selection_label(
      applicationData.data as OSPData,
      (applicationState as OSPElementsSelectedType).multi_selected_label,
      evt,
      ComponentUpdater as OSPComponentUpdaterType
    )
    EventOnZoneMouseUp(
      applicationData,
      uiElementsRef,
      applicationState,
      dict_hook_ref_setter_show_dialog_components,
      true,
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

export const OSPUpdateMenuConf:OSPUpdateMenuConfType=(menu_conf,
  applicationData,
  applicationContext,
  uiElementsRef
)=>{
  const OSPApplicationData=applicationData as OSPApplicationDataType
  const  OSPUiElementsRef=uiElementsRef as OSPUiElementsRefType

  const OSPApplicationContext=applicationContext as OSPApplicationContextType
  const menu_conf_view=viewsAccordion(
    OSPApplicationData,
    OSPApplicationContext.t,
    OSPApplicationContext.has_open_sankey_plus,
    OSPApplicationData.convert_data,
    OSPApplicationData.get_default_data,
    OSPUiElementsRef.ViewSelector?.current??<></>
  )
  menu_conf.push(menu_conf_view)
  return menu_conf

}

export const OSPInitializeKeyHandler:OSPInitializeKeyHandlerType=(
  applicationContext,
  e,
  applicationData,
  applicationState,
  dict_hook_ref_setter_show_dialog_components,
  reDrawOSPLabels,
  ComponentUpdater
)=>{
  OSPKeyHandler(
    applicationContext,
    e,
    applicationData,
    applicationState,
    dict_hook_ref_setter_show_dialog_components,
    reDrawOSPLabels,
    ComponentUpdater
  )
}

export const OSPInitalizeSelectorDetailNodes:InitalizeSelectorDetailNodesType=(  applicationContext,
  applicationData,
  applicationDraw,
  node_function,
  link_function,
  ComponentUpdater
)=>{
  const opacity_advanced =  !windowSankey.SankeyToolsStatic ? '0.3' : '0'

  const mutiple_level_tag_filter=<AddAllDropDownNode 
    applicationContext={applicationContext}
    ComponentUpdater={ComponentUpdater}
    applicationData={applicationData}
    level={true}
    node_function={node_function}
    link_function={link_function}
    applicationDraw={applicationDraw}
  />
  return <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
    <Popover.Header as="h3">{applicationContext.t('Banner.ndd')}</Popover.Header>
    <Popover.Body style={{maxHeight:'600px',overflowY:'auto',  marginLeft: '5px', width: '350px' }}>
      <FormGroup as={Row}>
        <Col xs={9}>
          {t('Menu.group')}
        </Col>
      </FormGroup>
      <>{(Object.entries(applicationData.data.levelTags).length > 0) ? (<>
        {mutiple_level_tag_filter}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)}</>
    </Popover.Body>
  </Popover>
}
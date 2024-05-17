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
  InitalizeSelectorDetailNodesType} from 'open-sankey/src/types/Types'
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
  PlusApplicationContextType,
  PlusApplicationDrawType,
  PlusApplicationDrawVarType,
  PlusComponentUpdaterType, PlusElementsSelectedType, PlusElementsSelectedVarType, PlusNodeFuntionType, PlusUiElementsRefType, SankeyPlusApplicationDataType, 
  SankeyPlusContextMenuType, SankeyPlusData, SankeyPlusLabel, 
  SankeyPlusLink, 
  SankeyPlusNode, 
  SankeyPlusShowMenuComponentsType,
  SankeyPlusShowMenuComponentsVarType
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
  AddAllDropDownNode
} from './import/OpenSankey'
import { os_all_element_to_transform } from 'open-sankey/dist/dialogs/SankeyMenuDialogs'
import { SankeyPlusNodeFO } from './SankeyPlusForeignObject'
import { SankeyPlusDrawArrows, PlusLinkStroke, menu_conf_link_apparence_gradient } from './SankeyPlusGradient'
import { PlusDrawLabels, sankey_plus_min_width_and_height, zone_selection_label } from './SankeyPlusLabels'
import { SankeyPlusMenuPreferenceLabels, zdtMenuAsAccordeonItem, SankeyPlusMenuConfigurationFreeLabels, context_zdt, blur_ZDT_wysiwyg } from './SankeyPlusMenuConfigurationLabels'
import { SankeyPlusDrawNodesIllustration, PlusNodeClickEvent, SankeyPlusNodeIcon, SankeyPlusHyperLink } from './SankeyPlusNodes'
import { DefaultSankeyPlusStyleLink,  ImportImageAsSvgBg, PlusItemExport, PlusLinkSabotColor } from './SankeyPlusUtils'
import { plus_convert_data, plus_sankey_layout, plus_all_element_to_transform, apply_transformation_opensankey_plus_elements } from './SankeyPlusConvert'
import { GetDataFromView, OSPKeyHandler, SankeyPlusBannerView, SelecteurView, getSetDiagramFunc, modal_transparent_view_attr, viewsAccordion } from './SankeyPlusViews'

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
    style_link:{'default':DefaultSankeyPlusStyleLink()},
    // unitary_node:[],
    // unit_link_value_display:'percent',
    background_image:''
  } 
}

export const OSPInitializeApplicationContext : OSPInitializeApplicationContextVarType = ()=>{
  return {
    has_open_sankey_plus : true
  } 
}


export const OSPInitializeApplicationData : OSPinitializeApplicationDataVarType= (
  data,
  set_data,
  get_default_data,
  display_nodes,
  display_links,
) => {
  const data_plus=data as SankeyPlusData
  const [master_data, set_master_data] = useState<SankeyPlusData>() // useState OK
  const [view, set_view] = useState(data_plus.current_view) // useState OK
  const [view_not_saved,set_view_not_saved]=useState('')
  const plus_display_nodes=display_nodes as {[_:string]:SankeyPlusNode}
  const plus_display_links=display_links as {[_:string]:SankeyPlusLink}
  const set_data_plus=set_data as (_:SankeyPlusData)=>void
  const plus_get_defaut_data=get_default_data as OSPGetDefaultData
  const useOpenSankeySetDiagram = (master_data && master_data.view.length > 0) || window.SankeyToolsStatic
    
  // If initial data has views & has a current view then update current data to the view (and initial data become master data) 
  if (data_plus.view && data_plus.view.length > 0 && !master_data) {
    set_master_data({...JSON.parse(JSON.stringify(data))})
    if(data_plus.current_view && data_plus.current_view!=='none'){
      const view_to_display= GetDataFromView(data_plus,data_plus.current_view)
      set_view(data_plus.current_view)
      set_data(view_to_display as SankeyPlusData)
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
      plus_convert_data(data as SankeyPlusData,DefaultSankeyData as ()=> SankeyPlusData)
    },
    master_data,
    set_master_data,
    view,
    set_view,
    view_not_saved:view_not_saved,
    set_view_not_saved:set_view_not_saved,
    setDiagram:useOpenSankeySetDiagram?getSetDiagramFunc(set_master_data,set_view,plus_get_defaut_data ) : setDiagram
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
  } as PlusElementsSelectedVarType
}

export const OSPInitializeShowDialog : OSPInitializeShowDialogType = ()=>{
  return {
    ref_setter_show_menu_node_icon : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_import_icons : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_zdt : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_transparent_view_attr: useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    show_toast_new_view: useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    show_toast_update_view: useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
  
  } as  SankeyPlusShowMenuComponentsVarType
}
export const OSPcloseAllMenu = closeAllMenu

// Modify Application Draw
export const OSPInitializeApplicationDraw : OSPInitializeApplicationDrawType= (  
  dict_variable_application_data,
  dict_variable_elements_selected,
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
    reDrawPlusLabels : (object_to_update:SankeyPlusLabel[])=>{
      PlusDrawLabels(
          dict_variable_application_data as SankeyPlusApplicationDataType,
          dict_variable_elements_selected as PlusElementsSelectedType,
          uiElementsRef as PlusUiElementsRefType,
          contextMenu as SankeyPlusContextMenuType,
          applicationContext as PlusApplicationContextType,
          sankey_plus_min_width_and_height,
          contextMenu.closeAllMenuContext,
          ComponentUpdater as PlusComponentUpdaterType,
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
      plus_sankey_layout(data as SankeyPlusData,new_layout as SankeyPlusData,mode)
    },
    all_element_UpdateLayout : [...os_all_element_to_transform,...plus_all_element_to_transform]
  }
  return _ as PlusApplicationDrawVarType
}

export const OSPInitializeComponentUpdater : OSPInitializeComponentUpdaterType  = ()=> {
  const _ = {
    updateComponentMenuConfigZdt : useRef([] as (()=>void)[]),
  }
  _.updateComponentMenuConfigZdt.current = []
  return _ 
}

export const OSPInitializeReinitialization : OSPInitializeReinitializationType = (
  dict_variable_application_data ,
  dict_variable_elements_selected 
) => ()=> {
  const recast_selected_dict=dict_variable_elements_selected as PlusElementsSelectedType
  recast_selected_dict.multi_selected_label.current = []
  localStorage.removeItem('icon_imported')
  sessionStorage.setItem('dismiss_warning_sankey_plus','0')
}

// Modify context menu
export const OSPInitializeContextMenu : ()=> contextMenuType = ()=> {
  const context_menu = initializeContextMenu()
  const osp_context_menu = context_menu as SankeyPlusContextMenuType
  osp_context_menu.contextualised_zdt = useRef<Dispatch<SetStateAction<SankeyPlusLabel|undefined>>>()
  osp_context_menu.closeAllMenuContext = ()=> {
    initializeCloseAllMenuContext(
      context_menu.ref_setter_contextualised_node,
      context_menu.ref_setter_contextualised_link,
      context_menu.tagContext,
      context_menu.showContextZDDRef
    )
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
    DrawArrows : SankeyPlusDrawArrows,
    LinkStroke : PlusLinkStroke ,
    LinkSabotColor : PlusLinkSabotColor
  } 
}

export const OSPInitializeNodeFunctions : OSPInitializeNodeFunctionsType = (  
  dict_variable_application_data,
  dict_variable_elements_selected,
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
  const reDrawIllustration = (nodes_to_update:SankeyPlusNode[])=>{
    SankeyPlusDrawNodesIllustration(
      dict_variable_application_data.data as SankeyPlusData,
      nodes_to_update,
      dict_variable_elements_selected as PlusElementsSelectedType,
      NodeTooltipsContent,
      link_function.GetLinkValue,
      applicationContext.t
    )
  }
  const _ = {
    reDrawIllustration : reDrawIllustration,
    reDrawPlusNodeEvent : (nodes_to_update:SankeyPlusNode[])=>{
      PlusNodeClickEvent(
        dict_variable_application_data as SankeyPlusApplicationDataType,
        dict_variable_elements_selected as PlusElementsSelectedType,
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
    updateDrawNodeShape(dict_variable_application_data,link_function,dict_variable_elements_selected.multi_selected_nodes,nodes_to_update)
    RedrawNodesLabel(dict_variable_application_data,nodes_to_update,link_function.GetLinkValue,applicationContext.t,_)
    reDrawIllustration(nodes_to_update as SankeyPlusNode[])
    return null
  }
  _.DrawAllNodes  = (
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
    resizeCanvas
  ) => {
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
      resizeCanvas      
    )
    reDrawIllustration(Object.values(dict_variable_application_data.display_nodes) as SankeyPlusNode[])    
  }
  return _ as PlusNodeFuntionType
}

// Since AdditionalMenus is an OS var specially created to add external element in menus
// we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
export const OSPInitializeAdditionalMenus : OSPInitializeAdditionalMenusType = (
  additionalMenus,
  applicationContext,
  dict_variable_application_data,
  applicationDraw,
  ComponentUpdater,
  dict_variable_elements_selected,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  link_function
) => {
  const PlusApplicationContext=applicationContext as PlusApplicationContextType
  const plus_dict_app_data=dict_variable_application_data as SankeyPlusApplicationDataType
  const plus_updater=ComponentUpdater as PlusComponentUpdaterType
  const selector_of_view=SelecteurView(
    plus_dict_app_data,
    dict_variable_elements_selected as PlusElementsSelectedType,
    applicationContext.t,
    plus_dict_app_data.set_view_not_saved,
    PlusApplicationContext.has_open_sankey_plus,
  );
  (uiElementsRef as PlusUiElementsRefType).ViewSelector.current=selector_of_view
  // Top Menus
  additionalMenus.external_file_export_item.push(PlusItemExport())

  // Page settings
  additionalMenus.extra_background_element = ImportImageAsSvgBg(
    applicationContext.t,
    dict_variable_application_data.data as SankeyPlusData,
    dict_variable_application_data.set_data as (_:SankeyPlusData)=>void,
    true
  )

  additionalMenus.externale_navbar_item['view']=SankeyPlusBannerView(
    dict_variable_application_data as SankeyPlusApplicationDataType,
    PlusApplicationContext ,
    (dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType) ,
    dict_variable_application_data.convert_data,
    selector_of_view
  )


  // add option for updateLayout (OSP var to update)
  // (Only add these options if connected with OSP)
  additionalMenus.apply_transformation_additional_elements=PlusApplicationContext.has_open_sankey_plus?apply_transformation_opensankey_plus_elements(
    plus_dict_app_data,
    applicationContext.t,
    plus_updater
  ):[]
    


  // Menu conf nodes
  additionalMenus.additional_menu_configuration_nodes['icon']=SankeyPlusNodeIcon(
    applicationContext.t,
      dict_variable_application_data.data as SankeyPlusData,
      dict_variable_elements_selected.multi_selected_nodes as { current: SankeyPlusNode[]; },
      true,
      false,
      dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType,
      node_function as PlusNodeFuntionType,
      ComponentUpdater as PlusComponentUpdaterType
  )
  additionalMenus.additional_menu_configuration_nodes['fo']=SankeyPlusNodeFO(
    applicationContext.t,
      dict_variable_application_data.data as SankeyPlusData,
      dict_variable_elements_selected.multi_selected_nodes as { current: SankeyPlusNode[]; },
      true,
      dict_variable_elements_selected as PlusElementsSelectedType,
      node_function as PlusNodeFuntionType
  )
  additionalMenus.additional_menu_configuration_nodes['hl']=SankeyPlusHyperLink(
    applicationContext.t,
      dict_variable_application_data.data as SankeyPlusData,
      dict_variable_elements_selected.multi_selected_nodes as { current: SankeyPlusNode[]; },
      true,
      node_function as PlusNodeFuntionType
  )
    
  
  //Links
  additionalMenus.additional_link_appearence_items.push(menu_conf_link_apparence_gradient(
    applicationContext as PlusApplicationContextType,
    ComponentUpdater as PlusComponentUpdaterType,
    dict_variable_elements_selected.multi_selected_links,
    dict_variable_application_data.data as SankeyPlusData,
    link_function,
    true,
    false,
    dict_variable_elements_selected.ref_selected_style_link))
    
  //Preferences
  additionalMenus.additional_preferences.push(
    SankeyPlusMenuPreferenceLabels(
      applicationContext.t,
      dict_variable_application_data.data as SankeyPlusData,
      ComponentUpdater as PlusComponentUpdaterType
    ))

  //- Builds Configuration Menus FreeLabel
  additionalMenus.additional_configuration_menus.push(zdtMenuAsAccordeonItem(
    dict_variable_application_data.data as SankeyPlusData,
    uiElementsRef as PlusUiElementsRefType,
    applicationContext as PlusApplicationContextType,
    <SankeyPlusMenuConfigurationFreeLabels
      dict_variable_application_data={dict_variable_application_data as SankeyPlusApplicationDataType}
      applicationContext={applicationContext as PlusApplicationContextType}
      dict_variable_elements_selected={(dict_variable_elements_selected as PlusElementsSelectedType)}
      reDrawPlusLabels={(applicationDraw as PlusApplicationDrawType).reDrawPlusLabels}
      ComponentUpdater={ComponentUpdater as PlusComponentUpdaterType}
    />
  ))
}

// module_dialogsType return a JSX.Element array wich is a react type
// we don't need to recast it ( and don't need additionnal parameters for OSP dialogs)
export const OSPModuleDialogs : module_dialogsType = (
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
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
  const OSP_elements_selected = dict_variable_elements_selected as PlusElementsSelectedType
  const OSP_dict_hook_ref=dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType
  const OSP_dict_app_data=dict_variable_application_data as SankeyPlusApplicationDataType
  const OSP_node_function=node_function as PlusNodeFuntionType
  return [
    MenuDraggable(
      OSP_dict_hook_ref,
    'ref_setter_show_menu_zdt' as unknown as keyof dict_hook_ref_setter_show_dialog_componentsType,
    <SankeyPlusMenuConfigurationFreeLabels
      dict_variable_application_data={OSP_dict_app_data}
      reDrawPlusLabels={(applicationDraw as PlusApplicationDrawType).reDrawPlusLabels}
      applicationContext={applicationContext as PlusApplicationContextType}
      ComponentUpdater={ComponentUpdater as PlusComponentUpdaterType}
      dict_variable_elements_selected={OSP_elements_selected}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.LL')
    ),
    context_zdt(
      contextMenu,
      applicationContext.t,
      OSP_dict_app_data,
      OSP_dict_hook_ref,
      dict_variable_elements_selected as PlusElementsSelectedType,
      ComponentUpdater as PlusComponentUpdaterType,
      (applicationDraw as PlusApplicationDrawType).reDrawPlusLabels
    ),
    modal_transparent_view_attr(
      OSP_dict_hook_ref,
      OSP_dict_app_data,
      applicationContext.t
    ),
    <ModalSelectionIcon 
      t={applicationContext.t}
      dict_variable_application_data={OSP_dict_app_data}
      dict_variable_elements_selected={OSP_elements_selected}
      dict_hook_ref_setter_show_dialog_components={OSP_dict_hook_ref}
      node_function={OSP_node_function }
    />
  ]
}

// Function to draw element on svg area it return nothing
// we don't need to recast it ( and don't need additionnal parameters for OSP draw elements functions)
export const OSPDrawAll : DrawAllType = (
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
  d3.selectAll(' .opensankey #svg #g_label').remove()
  d3.selectAll(' .opensankey #svg #g_label_handles').remove()

  // Insert la balise qui contient tous les labels libres avant la balise de la légende
  d3.select('.opensankey #svg').insert('g','#g_links').attr('class','g_label').attr('id','g_label')
  d3.select('.opensankey #svg').append('g').attr('class','g_label_handles').attr('id','g_label_handles')

  // Call the function that add links to the sankey
  d3.selectAll(' .opensankey #svg #sankey_def').remove()
  d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')

  // Free Labels
  PlusDrawLabels(
    dict_variable_application_data as SankeyPlusApplicationDataType,
    dict_variable_elements_selected as PlusElementsSelectedType,
    uiElementsRef as PlusUiElementsRefType,
    contextMenu as SankeyPlusContextMenuType,
    applicationContext as PlusApplicationContextType,
    applicationDraw.GetSankeyMinWidthAndHeight,
    contextMenu.closeAllMenuContext,
    ComponentUpdater as PlusComponentUpdaterType,
    Object.values((dict_variable_application_data as SankeyPlusApplicationDataType).data.labels),
    link_function,
    applicationDraw.start_point,
    applicationDraw.resizeCanvas
  )
}

// Function to add event on elements on svg area it return nothing
// we don't need to recast it ( and don't need additionnal parameters for OSP add event functions)
export const OSPInstallEventsOnSVG : InstallEventsOnSVGType = (
  contextMenu,
  dict_variable_application_data,
  uiElementsRef,
  dict_variable_elements_selected,
  link_function,
  ComponentUpdater,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  applicationDraw
) => {
  const svgSankey = d3.select('.opensankey #svg')
  svgSankey.on('mousedown',evt=>{
    blur_ZDT_wysiwyg((dict_variable_elements_selected as unknown as PlusElementsSelectedVarType).r_editor_ZDT as { current: ReactQuill; })
    EventOnZoneMouseDown(
      dict_variable_application_data,
      dict_variable_elements_selected,
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
      dict_variable_application_data.data as SankeyPlusData,
      (dict_variable_elements_selected as PlusElementsSelectedType).multi_selected_label,
      evt,
      ComponentUpdater as PlusComponentUpdaterType
    )
    EventOnZoneMouseUp(
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      dict_hook_ref_setter_show_dialog_components,
      true,
      evt,
      applicationDraw.start_point,
      dict_variable_elements_selected.legend_clicked,
      link_function,
      ComponentUpdater,
      node_function,
      applicationDraw.reDrawLegend,
      applicationDraw.resizeCanvas
    )
  })
}

export const OSPUpdateMenuConf:OSPUpdateMenuConfType=(menu_conf,
  dict_variable_application_data,
  applicationContext,
  uiElementsRef
)=>{
  const SankeyPlusApplicationData=dict_variable_application_data as SankeyPlusApplicationDataType
  const  PlusUiElementsRef=uiElementsRef as PlusUiElementsRefType

  const PlusApplicationContext=applicationContext as PlusApplicationContextType
  const menu_conf_view=viewsAccordion(
    SankeyPlusApplicationData,
    PlusApplicationContext.t,
    PlusApplicationContext.has_open_sankey_plus,
    SankeyPlusApplicationData.convert_data,
    SankeyPlusApplicationData.get_default_data,
    PlusUiElementsRef.ViewSelector?.current??<></>
  )
  menu_conf.push(menu_conf_view)
  return menu_conf

}

export const OSPInitializeKeyHandler:OSPInitializeKeyHandlerType=(
  applicationContext,
  e,
  dict_variable_application_data,
  dict_variable_elements_selected,
  dict_hook_ref_setter_show_dialog_components,
  reDrawPlusLabels,
  ComponentUpdater
)=>{
  OSPKeyHandler(
    applicationContext,
    e,
    dict_variable_application_data,
    dict_variable_elements_selected,
    dict_hook_ref_setter_show_dialog_components,
    reDrawPlusLabels,
    ComponentUpdater
  )
}

export const OSPInitalizeSelectorDetailNodes:InitalizeSelectorDetailNodesType=(  applicationContext,
  dict_variable_application_data,
  applicationDraw,
  node_function,
  link_function,
  ComponentUpdater
)=>{
  const opacity_advanced =  !windowSankey.SankeyToolsStatic ? '0.3' : '0'

  const mutiple_level_tag_filter=<AddAllDropDownNode 
    applicationContext={applicationContext}
    ComponentUpdater={ComponentUpdater}
    dict_variable_application_data={dict_variable_application_data}
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
      <>{(Object.entries(dict_variable_application_data.data.levelTags).length > 0) ? (<>
        {mutiple_level_tag_filter}</>
      ) : (<>
        <Form.Control placeholder="Pas de filtrage" style={{ opacity: opacity_advanced, color: '#6c757d' }} disabled /></>)}</>
    </Popover.Body>
  </Popover>
}
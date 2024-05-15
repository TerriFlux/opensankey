import {
  Dispatch,
  SetStateAction,
  useRef
} from 'react'
import React from 'react'
import ReactQuill from 'react-quill'
import * as d3 from 'd3'
import { 
  dict_hook_ref_setter_show_dialog_componentsType, contextMenuType, applicationDrawType, 
  SankeyData, ComponentUpdaterType, uiElementsRefType, initializeLinkFunctionsType, 
  LinkFunctionTypes, initializeAdditionalMenusType, module_dialogsType,  
  initializeShowDialogType,
  initializeElementSelectedType,
  initializeApplicationDataType,
  DrawAllType,
  initializeApplicationDrawType,
  initializeNodeFunctionsType,
  InstallEventsOnSVGType,
  initializeReinitializationType,
  dict_variable_application_dataType,
  applicationContextType,
  NodeFunctionTypes,
  dict_variable_elements_selectedType,
  initializeApplicationContextType,
  initializeUIElementsRefType,
  initializeComponentUpdaterType
} from 'open-sankey/src/types/Types'
import { LinkColorFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { DrawArrowsType, LinkStrokeFType } from 'open-sankey/src/draw/types/SankeyDrawFunctionTypes'
import { 
  PlusApplicationContextType,
  PlusApplicationDrawType,
  PlusComponentUpdaterType, PlusElementsSelectedType, PlusNodeFuntionType, PlusUiElementsRefType, SankeyPlusApplicationDataType, 
  SankeyPlusContextMenuType, SankeyPlusData, SankeyPlusLabel, 
  SankeyPlusNode, 
  SankeyPlusShowMenuComponentsType
} from 'sankeyanimation/types/Types'

import { 
  MenuDraggable, closeAllMenu, 
  initializeContextMenu,
  initializeProcessFunctions,
  updateLayoutOSTyped,
  NodeTooltipsContent,
  convert_data,
  EventOnZoneMouseDown,
  EventOnZoneMouseUp} from './import/OpenSankey'
import { os_all_element_to_transform } from 'open-sankey/dist/dialogs/SankeyMenuDialogs'
import { modal_selection_icons } from './import/SankeyIconsUtils'
import { SankeyIconsData, SankeyIconsNode } from 'sankeyicons/src/types'
import { SankeyPlusNodeFO } from './SankeyPlusForeignObject'
import { SankeyPlusDrawArrows, PlusLinkStroke, menu_conf_link_apparence_gradient } from './SankeyPlusGradient'
import { PlusDrawLabels, sankey_plus_min_width_and_height, zone_selection_label } from './SankeyPlusLabels'
import { SankeyPlusMenuPreferenceLabels, zdtMenuAsAccordeonItem, SankeyPlusMenuConfigurationFreeLabels, context_zdt, blur_ZDT_wysiwyg } from './SankeyPlusMenuConfigurationLabels'
import { SankeyPlusDrawNodesIllustration, PlusNodeClickEvent, SankeyPlusNodeIcon, SankeyPlusHyperLink } from './SankeyPlusNodes'
import { DefaultSankeyPlusStyleLink, ImportImageAsSvgBg, PlusItemExport, PlusLinkSabotColor } from './SankeyPlusUtils'
import { plus_convert_data, plus_sankey_layout, plus_all_element_to_transform } from './SankeyPlusConvert'

export const OSPDefaultData = () => {
  return {
    is_catalog:false,
    // view:[],
    // current_view:'none',
    labels:{},
    icon_catalog:{},
    style_link:{'default':DefaultSankeyPlusStyleLink()},
    // unitary_node:[],
    // unit_link_value_display:'percent',
    background_image:''
  } 
}

export const OSPInitializeApplicationContext : initializeApplicationContextType = ()=>{
  return {
    has_open_sankey_plus : true
  } as unknown as applicationContextType
}


export const OSPInitializeApplicationData : initializeApplicationDataType= () => {
  return {
    convert_data : (data:SankeyData,DefaultSankeyData:()=>SankeyData) => {
      convert_data(data,DefaultSankeyData)
      plus_convert_data(data as SankeyPlusData,DefaultSankeyData as ()=> SankeyPlusData)
    }
  } as dict_variable_application_dataType
}

export const OSPInitializeElementSelected : initializeElementSelectedType = ()=>{
  return {
    multi_selected_label : useRef([]),
    r_setter_editor_content_fo_zdt : useRef<Dispatch<SetStateAction<string>>[]>([]),
    r_setter_editor_content_fo_node : useRef<Dispatch<SetStateAction<string>>>()
  } as unknown as dict_variable_elements_selectedType
}

export const OSPInitializeShowDialog : initializeShowDialogType = ()=>{
  return {
    ref_setter_show_menu_node_icon : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_import_icons : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_zdt : useRef<Dispatch<SetStateAction<boolean>>>(()=>null)
  } as unknown as dict_hook_ref_setter_show_dialog_componentsType
}
export const OSPcloseAllMenu = closeAllMenu

// Modify Application Draw
export const OSPInitializeApplicationDraw : initializeApplicationDrawType= (  
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
  return _ as unknown as applicationDrawType
}

export const OSPInitializeComponentUpdater : initializeComponentUpdaterType  = ()=> {
  const _ = {
    updateComponentMenuConfigZdt : useRef([] as (()=>void)[]),
  }
  _.updateComponentMenuConfigZdt.current = []
  return _ as unknown as ComponentUpdaterType
}

export const OSPInitializeReinitialization : initializeReinitializationType = (
  dict_variable_application_data : dict_variable_application_dataType,
  dict_variable_elements_selected : dict_variable_elements_selectedType
) => ()=> {
  (dict_variable_elements_selected as PlusElementsSelectedType).multi_selected_label.current = []
  localStorage.removeItem('icon_imported')
  sessionStorage.setItem('dismiss_warning_sankey_plus','0')
}

export const OSPInitializeProcessFunctions = initializeProcessFunctions

// Modify context menu
export const OSPInitializeContextMenu : ()=> contextMenuType = ()=> {
  const context_menu = initializeContextMenu()
  const osp_context_menu = context_menu as unknown as SankeyPlusContextMenuType
  osp_context_menu.contextualised_zdt = useRef<Dispatch<SetStateAction<SankeyPlusLabel|undefined>>>()
  osp_context_menu.closeAllMenuContext = ()=> {
    osp_context_menu.ref_setter_contextualised_node.current!(undefined)
    osp_context_menu.ref_setter_contextualised_link.current!(undefined)
    osp_context_menu.tagContext.current![0][1](undefined)
    osp_context_menu.showContextZDDRef.current![1](false)
    osp_context_menu.contextualised_zdt.current!(undefined)
  }
  return context_menu
}

// Modify Ref used to open accordion item
export const OSPInitializeUIElementsRef : initializeUIElementsRefType = () => {
  return {
    zdt_accordion_ref : useRef<HTMLDivElement>(null)
  } as unknown as uiElementsRefType
}

export const OSPInitializeLinkFunctions : initializeLinkFunctionsType = () => {
  return {
    //OSLinkFunction.GetLinkValue unchanged
    //OSLinkFunction.LinkText unchanged  
    DrawArrows : SankeyPlusDrawArrows as DrawArrowsType,
    LinkStroke : PlusLinkStroke as LinkStrokeFType,
    LinkSabotColor : PlusLinkSabotColor as LinkColorFuncType
    //OSLinkFunction.DrawAllLinks unchanged
    //OSLinkFunction.drawAddLinks unchanged
    //OSLinkFunction.drawLinkShape unchanged
    //OSLinkFunction.reDrawLinkStartSabot = (SuiteReDrawLinkStartSabot as RedrawNodesFType) TODO
    //OSLinkFunction.node_arrow_visible  unchanged
    //OSLinkFunction.RedrawLinks unchanged
    //OSLinkFunction.CreateLinksOnSVG unchanged
  } as unknown as LinkFunctionTypes
}

export const OSPInitializeNodeFunctions : initializeNodeFunctionsType = (  
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
  return {
    reDrawIllustration : (nodes_to_update:SankeyPlusNode[])=>{
      SankeyPlusDrawNodesIllustration(
        dict_variable_application_data.data as SankeyPlusData,
        nodes_to_update,
        dict_variable_elements_selected as PlusElementsSelectedType,
        NodeTooltipsContent,
        link_function.GetLinkValue,
        applicationContext.t
      )
    },
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
}

export const OSPInitializeAdditionalMenus : initializeAdditionalMenusType = (
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

  additionalMenus.external_file_export_item.push(PlusItemExport())

  // Page settings
  additionalMenus.extra_background_element = ImportImageAsSvgBg(
    applicationContext.t,
    dict_variable_application_data.data as SankeyPlusData,
    dict_variable_application_data.set_data as (_:SankeyPlusData)=>void,
    true
  )

  // Nodes

  additionalMenus.additional_menu_configuration_nodes['icon'] = SankeyPlusNodeIcon(
      applicationContext.t,
      dict_variable_application_data.data as SankeyPlusData,
      dict_variable_elements_selected.multi_selected_nodes as { current: SankeyPlusNode[]; },
      true,
      false,
      dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType,
      node_function as PlusNodeFuntionType,
      ComponentUpdater as PlusComponentUpdaterType
  )
  additionalMenus.additional_menu_configuration_nodes['fo'] = SankeyPlusNodeFO(
    applicationContext.t,
    dict_variable_application_data.data as SankeyPlusData,
    dict_variable_elements_selected.multi_selected_nodes as { current: SankeyPlusNode[]; },
    true,
    dict_variable_elements_selected as PlusElementsSelectedType,
    node_function as PlusNodeFuntionType
  ),
  additionalMenus.additional_menu_configuration_nodes['hl'] = SankeyPlusHyperLink(
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
    dict_variable_elements_selected.ref_selected_style_link)
  )

  //Preferences
  additionalMenus.additional_preferences.push(
    SankeyPlusMenuPreferenceLabels(
      applicationContext.t,
      dict_variable_application_data.data as SankeyPlusData,
      ComponentUpdater as PlusComponentUpdaterType
    )
  )

  //- Builds Configuration Menus FreeLabel
  additionalMenus.additional_configuration_menus.push(zdtMenuAsAccordeonItem(
    dict_variable_application_data.data as SankeyPlusData,
    uiElementsRef as PlusUiElementsRefType,
    applicationContext as PlusApplicationContextType,
    <SankeyPlusMenuConfigurationFreeLabels
      data={dict_variable_application_data.data as SankeyPlusData}
      multi_selected_label={(dict_variable_elements_selected as PlusElementsSelectedType).multi_selected_label}
      t={applicationContext.t}
      is_activated={true}
      dict_variable_elements_selected={(dict_variable_elements_selected as PlusElementsSelectedType)}
      reDrawPlusLabels={(applicationDraw as PlusApplicationDrawType).reDrawPlusLabels}
      ComponentUpdater={ComponentUpdater as PlusComponentUpdaterType}
    />
  ))
}

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
  return [
    MenuDraggable(
      dict_hook_ref_setter_show_dialog_components,
    'ref_setter_show_menu_zdt' as unknown as keyof dict_hook_ref_setter_show_dialog_componentsType,
    <SankeyPlusMenuConfigurationFreeLabels
      data={dict_variable_application_data.data as SankeyPlusData}
      multi_selected_label={OSP_elements_selected.multi_selected_label}
      t={applicationContext.t}
      is_activated={true}
      reDrawPlusLabels={(applicationDraw as PlusApplicationDrawType).reDrawPlusLabels}
      ComponentUpdater={ComponentUpdater as PlusComponentUpdaterType}
      dict_variable_elements_selected={OSP_elements_selected}
    />,
    contextMenu.pointer_pos,
    applicationContext.t('Menu.LL')
    ),
    context_zdt(
      contextMenu,
      applicationContext.t,
      dict_variable_application_data as SankeyPlusApplicationDataType,
      dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType,
      dict_variable_elements_selected as PlusElementsSelectedType,
      ComponentUpdater as PlusComponentUpdaterType,
      (applicationDraw as PlusApplicationDrawType).reDrawPlusLabels
    ),
    modal_selection_icons(
      applicationContext.t,
      dict_variable_elements_selected.multi_selected_nodes as {current:SankeyIconsNode[]},
      dict_variable_application_data.data as SankeyIconsData,
      dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType,
      node_function as PlusNodeFuntionType
    )
  ]
}

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
    blur_ZDT_wysiwyg(dict_variable_elements_selected.r_editor_ZDT as { current: ReactQuill; })
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

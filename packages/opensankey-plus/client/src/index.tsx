import './css/bootstrap.css'
import './css/main.css'
import './css/colors/red.css'
import './css/style_elements_sankey.css'
import React, { MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'

import LZString from 'lz-string'
import './traduction'

import { 
  dict_variable_application_dataType, ComponentUpdaterType, 
  LinkFunctionTypes, NodeFunctionTypes, applicationContextType, contextMenuType, 
  dict_variable_elements_selectedType, uiElementsRefType, dict_hook_ref_setter_show_dialog_componentsType, 
  applicationDrawType, 
  AdditionalMenusType,
  processFunctionsType,
  SankeyData
} from 'open-sankey/src/types/Types'
import { NodeTooltipsContentFType } from 'open-sankey/src/draw/types/SankeyTooltipTypes'
import { GetSankeyMinWidthAndHeightFuncType } from 'open-sankey/src/configmenus/types/SankeyUtilsTypes'
import { 
  convert_data, DefaultNode,initializeAdditionalMenus, DefaultLink, initializeApplicationContext, 
  initializeApplicationData, initializeApplicationDraw, initializeComponentUpdater, 
  initializeElementSelected, initializeShowDialog, initializeContextMenu, initializeLinkFunctions, 
  initializeProcessFunctions, initializeUIElementsRef, initializeReinitialization, initializeNodeFunctions,
  InstallEventsOnSVG,
  moduleDialogs, DrawAll, closeAllMenu, 
  DefaultSankeyData,
  complete_sankey_data,
  SankeyApp,
  initializeMenuConfiguration,
  initializeKeyHandler,
  ClickSaveDiagram
} from './import/OpenSankey'
import { PlusApplicationContextType, PlusApplicationDrawType, PlusComponentUpdaterType, PlusElementsSelectedType, SankeyPlusApplicationDataType, SankeyPlusData, SankeyPlusDataVar, SankeyPlusLink, SankeyPlusNode, SankeyPlusShowMenuComponentsType } from '../types/Types'
import { 
  OSPInitializeApplicationContext, OSPInitializeApplicationData, OSPInitializeElementSelected, 
  OSPInitializeApplicationDraw, OSPInitializeShowDialog, OSPInitializeComponentUpdater, OSPInitializeReinitialization, 
  OSPInitializeContextMenu, OSPInitializeUIElementsRef, OSPInitializeLinkFunctions, 
  OSPInitializeNodeFunctions, OSPInitializeAdditionalMenus, OSPModuleDialogs, OSPDrawAll, OSPInstallEventsOnSVG,
  OSPUpdateMenuConf,
  OSPInitializeKeyHandler,
  OSPInitalizeSelectorDetailNodes} from './OSPModule'
import { SankeyPlusDiagramSelector, plus_convert_data } from './SankeyPlusConvert'
import { DefaultSankeyPlusStyleLink } from './SankeyPlusUtils'
//import { ClickSaveDiagram } from 'open-sankey/dist/dialogs/SankeyPersistence'
import { SaveDiagramOptionsType } from 'open-sankey/src/dialogs/types/SankeyPersistenceTypes'

window.React = React


const get_default_data=()=>{
  const os_var = DefaultSankeyData()

  const osp_var:SankeyPlusDataVar={
    nodes:os_var.nodes as {[x:string]:SankeyPlusNode},
    links:os_var.links as {[x:string]:SankeyPlusLink},
    is_catalog:false,
    view:[],
    current_view:'none',
    labels:{},
    icon_catalog:{},
    style_link:{'default':DefaultSankeyPlusStyleLink()},
    background_image:'',
    show_background_image:false,
    style_node:os_var.style_node
  }
  const tmp:SankeyPlusData=Object.assign(os_var,osp_var)
  
  return tmp
}

// Create a default sankey
const data = get_default_data()

// Search if a data is stored in localStorage of the navigator
const json_data = LZString.decompress(localStorage.getItem('data') as string)
// const json_data = localStorage.getItem('data')

// If there is, store the data in the sankey_data
if (json_data !== null && json_data != '' && json_data!='null') {
  const new_data = JSON.parse(json_data)
  Object.assign(data, new_data)
  convert_data(data,get_default_data)
  plus_convert_data(data as SankeyPlusData, get_default_data as () => SankeyPlusData)
  complete_sankey_data(data,get_default_data,DefaultNode,DefaultLink)
}


// Cahnge data to list of node contianing icons from the icon lib
// data = generate_data_example_icons(get_default_data)

const container=document.getElementById('react-container') as Element | DocumentFragment
const root=createRoot(container)
root.render(
  <SankeyApp
    initial_sankey_data={data as SankeyPlusData}
    get_default_data={get_default_data}
    initializeApplicationContext={
      ()=>{
        const _ = initializeApplicationContext()
        Object.assign(_,OSPInitializeApplicationContext())
        _.has_free_account = true
        return _
      }
    }
    initializeApplicationData={
      (  
        data,
        set_data,
        get_default_data,
        display_nodes,
        display_links

      )=>{
        return {
          ...initializeApplicationData(data,set_data,get_default_data,display_nodes,display_links),
          ...OSPInitializeApplicationData(data,set_data,get_default_data,display_nodes,display_links)
        } as SankeyPlusApplicationDataType
      }
    }
    initializeElementSelected={
      ()=>{
        return {
          ...initializeElementSelected(),
          ...OSPInitializeElementSelected()
        }
      }
    }
    initializeApplicationDraw={
      (  
        dict_variable_application_data : dict_variable_application_dataType,
        dict_variable_elements_selected : dict_variable_elements_selectedType,
        contextMenu : contextMenuType,
        applicationContext : applicationContextType,
        ComponentUpdater : ComponentUpdaterType,
        uiElementsRef : uiElementsRefType,
        node_function:NodeFunctionTypes,
        link_function:LinkFunctionTypes,
        start_point :{ current: number[]; },
        resizeCanvas :() => void
      )=>{
        const _ = {
          ...initializeApplicationDraw(
            dict_variable_application_data,dict_variable_elements_selected,contextMenu,
            applicationContext, ComponentUpdater, uiElementsRef, node_function, link_function,
            start_point, resizeCanvas
          ),
          ...OSPInitializeApplicationDraw(
            dict_variable_application_data,dict_variable_elements_selected,contextMenu,
            applicationContext,ComponentUpdater,uiElementsRef,node_function,link_function,
            start_point, resizeCanvas
          )
        }
        return _
      }
    }
    initializeShowDialog={
      () => {
        return {
          ...initializeShowDialog(),
          ...OSPInitializeShowDialog()
        }
      }
    }
    initializeComponentUpdater={
      () => {
        return {
          ...initializeComponentUpdater(),
          ...OSPInitializeComponentUpdater()
        }
      }
    }
    initializeMenuConfiguration={
      (
        dict_variable_application_data,
        dict_variable_elements_selected,
        applicationContext,
        uiElementsRef,
        dict_hook_ref_setter_show_dialog_components,
        additional_menus,
        node_function,
        link_function,
        applicationDraw,
        ComponentUpdater,
        menu_configuration_nodes,
        config_link_data,
        config_link_attr,
        contextMenu,
        ref_alt_key_pressed
      )=>{
        const menu_conf= initializeMenuConfiguration(dict_variable_application_data,dict_variable_elements_selected,applicationContext,uiElementsRef,dict_hook_ref_setter_show_dialog_components,additional_menus,node_function,link_function,applicationDraw,ComponentUpdater,menu_configuration_nodes,config_link_data,config_link_attr,contextMenu,ref_alt_key_pressed)
        
        OSPUpdateMenuConf(menu_conf,dict_variable_application_data,applicationContext,uiElementsRef)
        return menu_conf
  
      }
    }
    initializeReinitialization={
      (
        dict_variable_application_data,
        dict_variable_elements_selected,
        contextMenu
      )=>{
        return () => {
          initializeReinitialization(dict_variable_application_data,dict_variable_elements_selected,contextMenu)()
          OSPInitializeReinitialization(dict_variable_application_data,dict_variable_elements_selected,contextMenu)()
        }
      }
    }
    closeAllMenu={
      (
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
        contextMenu:contextMenuType
      )=>{
        return closeAllMenu(dict_hook_ref_setter_show_dialog_components,contextMenu)
      }
    }
    initializeProcessFunctions={
      (
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType
      )=>{
        return {
          ...initializeProcessFunctions(dict_hook_ref_setter_show_dialog_components)
        }
      }
    }
    initializeContextMenu={
      () => {
        return {
          ...initializeContextMenu(),
          ...OSPInitializeContextMenu()
        }
      }
    }
    initializeUIElementsRef={
      () => {
        return {
          ...initializeUIElementsRef(),
          ...OSPInitializeUIElementsRef()
        }
      }
    }
    initializeLinkFunctions={
      (  
        dict_variable_application_data: dict_variable_application_dataType,
        dict_variable_elements_selected: dict_variable_elements_selectedType,
        contextMenu:contextMenuType,
        applicationContext: applicationContextType,
        ComponentUpdater: ComponentUpdaterType,
        uiElementsRef:uiElementsRefType,
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
        ref_alt_key_pressed: React.MutableRefObject<boolean>
      )=>{
        const _= initializeLinkFunctions(
          dict_variable_application_data,dict_variable_elements_selected,contextMenu,applicationContext,
          ComponentUpdater,uiElementsRef,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed
        )
        Object.assign(_,OSPInitializeLinkFunctions(
          dict_variable_application_data,dict_variable_elements_selected,contextMenu,applicationContext,
          ComponentUpdater,uiElementsRef,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed
        ))
        return _
      }
    }
    initializeNodeFunctions={
      (
        dict_variable_application_data: dict_variable_application_dataType,
        dict_variable_elements_selected: dict_variable_elements_selectedType,
        contextMenu:contextMenuType,
        applicationContext: applicationContextType,
        ComponentUpdater: ComponentUpdaterType,
        uiElementsRef:uiElementsRefType,
        resizeCanvas:(_:dict_variable_application_dataType)=>void,
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
        ref_alt_key_pressed: React.MutableRefObject<boolean>,
        accept_simple_click: React.MutableRefObject<boolean>,
        recomputeDisplayedElement: () => void,
        link_function: LinkFunctionTypes
      )=>{
        const _ = initializeNodeFunctions(
          dict_variable_application_data,dict_variable_elements_selected,contextMenu,applicationContext,ComponentUpdater,
          uiElementsRef,resizeCanvas,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed,accept_simple_click,
          recomputeDisplayedElement,link_function
        )
        Object.assign(_,OSPInitializeNodeFunctions(
          dict_variable_application_data,dict_variable_elements_selected,contextMenu,applicationContext,ComponentUpdater,
          uiElementsRef,resizeCanvas,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed,accept_simple_click,
          recomputeDisplayedElement,link_function
        ))
        return _
      }
    }
    initializeAdditionalMenus={
      (
        additionalMenus,
        applicationContext,
        dict_variable_application_data,
        applicationDraw,
        ComponentUpdater,
        dict_variable_elements_selected,
        uiElementsRef,
        dict_hook_ref_setter_show_dialog_components,
        node_function,
        link_function,
        processFunctions,
        Reinitialization,
        contextMenu

      )=>{
        initializeAdditionalMenus(
          additionalMenus,
          applicationContext,dict_variable_application_data,applicationDraw,ComponentUpdater,dict_variable_elements_selected,
          uiElementsRef,dict_hook_ref_setter_show_dialog_components,node_function,link_function,processFunctions,Reinitialization,contextMenu
        )
        OSPInitializeAdditionalMenus(
          additionalMenus,
          applicationContext,dict_variable_application_data,applicationDraw,ComponentUpdater,dict_variable_elements_selected,
          uiElementsRef,dict_hook_ref_setter_show_dialog_components,node_function,link_function,processFunctions,Reinitialization,contextMenu
        )
      }
    }
    moduleDialogs={
      (  
        applicationContext:applicationContextType,
        dict_variable_application_data:dict_variable_application_dataType,
        dict_variable_elements_selected:dict_variable_elements_selectedType,
        contextMenu : contextMenuType,
        applicationDraw:applicationDrawType,
        uiElementsRef:uiElementsRefType,
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
        node_function:NodeFunctionTypes,
        link_function:LinkFunctionTypes,
        ComponentUpdater:ComponentUpdaterType,
        additional_menus:AdditionalMenusType,
        menu_configuration_nodes_attributes:JSX.Element,
        reDrawLegend:()=>void,
        processFunctions:processFunctionsType
      )=>{
        return [
          ...moduleDialogs(
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
            applicationDraw.reDrawLegend,
            processFunctions 
          ),
          ...OSPModuleDialogs(
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
            applicationDraw.reDrawLegend,
            processFunctions
          )
        ]
      }
    }
    DrawAll={
      (
        contextMenu:contextMenuType,
        dict_variable_application_data:dict_variable_application_dataType,
        uiElementsRef:uiElementsRefType,
        dict_variable_elements_selected:dict_variable_elements_selectedType,
        applicationContext:applicationContextType,
        alt_key_pressed:MutableRefObject<boolean>,
        accept_simple_click:{current:boolean},
        link_function:LinkFunctionTypes,
        NodeTooltipsContent:NodeTooltipsContentFType,
        ComponentUpdater:ComponentUpdaterType,
        dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
        node_function:NodeFunctionTypes,
        GetSankeyMinWidthAndHeight:GetSankeyMinWidthAndHeightFuncType,
        applicationDraw:applicationDrawType
      )=>{
        DrawAll(
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
        OSPDrawAll(
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
      }
    }
    initializeKeyHandler={(
      dict_variable_application_data,
      uiElementsRef,
      contextMenu,
      e,
      dict_variable_elements_selected,
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
    )=>{
      // Recasted var for OSP key handler func
      const plus_dict_app_data=dict_variable_application_data as SankeyPlusApplicationDataType
      const plus_applicationContext=applicationContext as PlusApplicationContextType
      const  plus_app_draw_func= applicationDraw as PlusApplicationDrawType
      const plus_elem_selected=dict_variable_elements_selected as PlusElementsSelectedType
      const plus_dict_hook=dict_hook_ref_setter_show_dialog_components as SankeyPlusShowMenuComponentsType
      const plus_updater=ComponentUpdater as PlusComponentUpdaterType

      initializeKeyHandler(
        dict_variable_application_data,
        uiElementsRef,
        contextMenu,
        e,
        dict_variable_elements_selected,
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
      OSPInitializeKeyHandler(
        plus_applicationContext,e,plus_dict_app_data,plus_elem_selected,
        plus_dict_hook,plus_app_draw_func.reDrawPlusLabels,plus_updater
      )
    }
    }
    // Input data used for updateLayout
    // (OS only use data from imported file 
    // but OSP can use its view as imported data
    // )
    initializeDiagrammSelector={(dict_variable_application_data)=>{
      const plus_app_data=dict_variable_application_data as SankeyPlusApplicationDataType
      return SankeyPlusDiagramSelector(
        plus_app_data
      )}

    }
    ClickSaveDiagram={
      (
        dict_variable_application_data: dict_variable_application_dataType, 
        data:SankeyData,
        dict_variable_elements_selected:dict_variable_elements_selectedType,
        options:SaveDiagramOptionsType
      ) => {
        const {master_data} = dict_variable_application_data as SankeyPlusApplicationDataType
        const PlusElementsSelected = dict_variable_elements_selected as PlusElementsSelectedType
        let data_to_save = data as SankeyPlusData
        if (master_data && (master_data.view.length > 0)) {
          //if views are present there are two cases. If save only view data is saved otherwise master data is saved.
          if ( PlusElementsSelected.saveViewGetter.current ) {
            data_to_save.current_view='none'
          } else {
            data_to_save = master_data
          }
        }
        ClickSaveDiagram(
          dict_variable_application_data,
          data_to_save,
          dict_variable_elements_selected,
          options
        )
      }
    }
    installEventOnSVG={
      (
        contextMenu,
        dict_variable_application_data,
        uiElementsRef,
        dict_variable_elements_selected,
        link_function,
        ComponentUpdater,
        dict_hook_ref_setter_show_dialog_components,
        node_function,
        applicationDraw
      )=>{
        InstallEventsOnSVG(  
          contextMenu,
          dict_variable_application_data,
          uiElementsRef,
          dict_variable_elements_selected,
          link_function,
          ComponentUpdater,
          dict_hook_ref_setter_show_dialog_components,
          node_function,
          applicationDraw
        )
        OSPInstallEventsOnSVG(
          contextMenu,
          dict_variable_application_data,
          uiElementsRef,
          dict_variable_elements_selected,
          link_function,
          ComponentUpdater,
          dict_hook_ref_setter_show_dialog_components,
          node_function,
          applicationDraw
        )
      }
    }

    InitalizeSelectorDetailNodes={OSPInitalizeSelectorDetailNodes}
  />
)


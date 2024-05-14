import './css/bootstrap.css'
import './css/main.css'
import './css/colors/red.css'
import './css/style_elements_sankey.css'
import React, { MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'

import LZString from 'lz-string'
import './traduction'

import { 
  SankeyData, SankeyNode, SankeyLink, dict_variable_application_dataType, ComponentUpdaterType, 
  LinkFunctionTypes, NodeFunctionTypes, applicationContextType, contextMenuType, 
  dict_variable_elements_selectedType, uiElementsRefType, dict_hook_ref_setter_show_dialog_componentsType, 
  applicationDrawType, 
  AdditionalMenusType,
  processFunctionsType
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
  SankeyApp
} from './import/OpenSankey'
import { SankeyPlusData } from 'sankeyanimation/types/Types'
import { 
  OSPInitializeApplicationContext, OSPInitializeApplicationData, OSPInitializeElementSelected, 
  OSPInitializeApplicationDraw, OSPInitializeShowDialog, OSPInitializeComponentUpdater, OSPInitializeReinitialization, 
  OSPInitializeProcessFunctions, OSPInitializeContextMenu, OSPInitializeUIElementsRef, OSPInitializeLinkFunctions, 
  OSPInitializeNodeFunctions, OSPInitializeAdditionalMenus, OSPModuleDialogs, OSPDrawAll, OSPInstallEventsOnSVG 
} from './OSPModule'
import { plus_convert_data } from './SankeyPlusConvert'
import { DefaultSankeyPlusStyleLink } from './SankeyPlusUtils'

window.React = React

const get_default_data=()=>{
  const _ = {...DefaultSankeyData()}
  const TOTO_var={
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
  Object.assign(_,TOTO_var)
  return _
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
const container=document.getElementById('react-container') as Element | DocumentFragment
const root=createRoot(container)
root.render(
  <SankeyApp
    initial_sankey_data={data}
    get_default_data={get_default_data}
    initializeApplicationContext={
      ()=>{
        return {
          ...initializeApplicationContext(),
          ...OSPInitializeApplicationContext()
        }
      }
    }
    initializeApplicationData={
      (  
        data:SankeyData,
        set_data:(_:SankeyData)=>void,
        get_default_data:()=>SankeyData,
        display_nodes : {[_:string]:SankeyNode},
        display_links : {[_:string]:SankeyLink}
      )=>{
        return {
          ...initializeApplicationData(data,set_data,get_default_data,display_nodes,display_links),
          ...OSPInitializeApplicationData(data,set_data,get_default_data,display_nodes,display_links)
        }       
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
    initializeReinitialization={
      (
        dict_variable_application_data :dict_variable_application_dataType,
        dict_variable_elements_selected : dict_variable_elements_selectedType,
        contextMenu : contextMenuType
      )=>{
        return (() => {return {
          ...initializeReinitialization(dict_variable_application_data,dict_variable_elements_selected,contextMenu),
          ...OSPInitializeReinitialization(dict_variable_application_data,dict_variable_elements_selected,contextMenu)
        }})
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
          ...initializeProcessFunctions(dict_hook_ref_setter_show_dialog_components),
          ...OSPInitializeProcessFunctions(dict_hook_ref_setter_show_dialog_components)
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
        return {
          ...initializeNodeFunctions(
            dict_variable_application_data,dict_variable_elements_selected,contextMenu,applicationContext,ComponentUpdater,
            uiElementsRef,resizeCanvas,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed,accept_simple_click,
            recomputeDisplayedElement,link_function
          ),
          ...OSPInitializeNodeFunctions(
            dict_variable_application_data,dict_variable_elements_selected,contextMenu,applicationContext,ComponentUpdater,
            uiElementsRef,resizeCanvas,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed,accept_simple_click,
            recomputeDisplayedElement,link_function
          )
        }
      }
    }
    initializeAdditionalMenus={
      (
        applicationContext:applicationContextType,
        dict_variable_application_data:dict_variable_application_dataType,
        applicationDraw:applicationDrawType,
        ComponentUpdater:ComponentUpdaterType,
        dict_variable_elements_selected:dict_variable_elements_selectedType,
        uiElementsRef:uiElementsRefType,
        dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
        node_function:NodeFunctionTypes,
        link_function:LinkFunctionTypes,
        processFunctions:processFunctionsType,
        Reinitialization:()=>void
      )=>{
        return {
          ...initializeAdditionalMenus(
            applicationContext,dict_variable_application_data,applicationDraw,ComponentUpdater,dict_variable_elements_selected,
            uiElementsRef,dict_hook_ref_setter_show_dialog_components,node_function,link_function,processFunctions,Reinitialization
          ),
          ...OSPInitializeAdditionalMenus(
            applicationContext,dict_variable_application_data,applicationDraw,ComponentUpdater,dict_variable_elements_selected,
            uiElementsRef,dict_hook_ref_setter_show_dialog_components,node_function,link_function,processFunctions,Reinitialization
          )
        }
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
        menu_configuration_nodes_attributes:JSX.Element[],
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
    installEventOnSVG={
      (
        contextMenu:contextMenuType,
        dict_variable_application_data:dict_variable_application_dataType,
        uiElementsRef:uiElementsRefType,
        dict_variable_elements_selected:dict_variable_elements_selectedType,
        link_function:LinkFunctionTypes,
        ComponentUpdater:ComponentUpdaterType,
        dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
        node_function:NodeFunctionTypes,
        applicationDraw:applicationDrawType
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
  />
)


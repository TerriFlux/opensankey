import './css/main.css'
import './css/colors/red.css'
import './css/style_elements_sankey.css'
import './css/react-quill.css'
import React, { MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'
import * as d3 from 'd3'
import LZString from 'lz-string'
import './traduction'

import { 
  applicationDataType, ComponentUpdaterType, 
  LinkFunctionTypes, NodeFunctionTypes, applicationContextType, contextMenuType, 
  applicationStateType, uiElementsRefType, dict_hook_ref_setter_show_dialog_componentsType, 
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
import { OSPApplicationContextType, OSPApplicationDrawType, OSPComponentUpdaterType, OSPElementsSelectedType, OSPUiElementsRefType, OSPApplicationDataType, OSPContextMenuType, OSPData, OSPDataVar, OSPLabel, OSPLink, OSPNode, OSPShowMenuComponentsType, OSPNodeFuntionType } from '../types/Types'
import { 
  OSPInitializeApplicationContext, OSPInitializeApplicationData, OSPInitializeElementSelected, 
  OSPInitializeApplicationDraw, OSPInitializeShowDialog, OSPInitializeComponentUpdater, OSPInitializeReinitialization, 
  OSPInitializeContextMenu, OSPInitializeUIElementsRef, OSPInitializeLinkFunctions, 
  OSPInitializeNodeFunctions, OSPInitializeAdditionalMenus, OSPModuleDialogs, OSPDrawAll, OSPInstallEventsOnSVG,
  OSPUpdateMenuConf,
  OSPInitializeKeyHandler,
  OSPInitalizeSelectorDetailNodes} from './OSPModule'
import { OSPDiagramSelector, plus_convert_data } from './SankeyPlusConvert'
import { DefaultOSPStyleLink } from './SankeyPlusUtils'
import { SaveDiagramOptionsType } from 'open-sankey/src/dialogs/types/SankeyPersistenceTypes'
import { OSPBannerView, SelecteurView } from './SankeyPlusViews'
import { OSPDrawLabels, sankey_plus_min_width_and_height } from './SankeyPlusLabels'
import { OSPNodeDragEvent } from './SankeyPlusNodes'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
  sankey: {
    filiere?:string
    footer?:boolean
    header?:string
    logo?:string
  }
}

window.React = React


const get_default_data=()=>{
  const os_var = DefaultSankeyData()

  const osp_var:OSPDataVar={
    nodes:os_var.nodes as {[x:string]:OSPNode},
    links:os_var.links as {[x:string]:OSPLink},
    is_catalog:false,
    view:[],
    current_view:'none',
    labels:{},
    icon_catalog:{},
    style_link:{'default':DefaultOSPStyleLink()},
    background_image:'',
    show_background_image:false,
    style_node:os_var.style_node
  }
  const tmp:OSPData=Object.assign(os_var,osp_var)
  
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
  plus_convert_data(data as OSPData, get_default_data as () => OSPData)
  complete_sankey_data(data,get_default_data,DefaultNode,DefaultLink)
}

// window.SankeyToolsStatic = true
// if (!window.sankey) {
//   window.sankey = { 
//     footer: true,
//     header: 'Sankey Viewer'
//   }
// }
if (window.sankey && window.sankey.filiere) {
  Object.assign(data, window.sankey.filiere)
}

// Cahnge data to list of node contianing icons from the icon lib
// data = generate_data_example_icons(get_default_data)

const container=document.getElementById('react-container') as Element | DocumentFragment
const root=createRoot(container)
root.render(
  <SankeyApp
    initial_sankey_data={data as OSPData}
    get_default_data={get_default_data}
    initializeApplicationContext={
      ()=>{
        const _ = initializeApplicationContext()
        Object.assign(_,OSPInitializeApplicationContext())
        _.has_free_account = true
        if (window.sankey && window.sankey.logo) {
          _.logo = window.sankey && window.sankey.logo?window.sankey.logo:''
          _.logo_terriflux = 'logo_terriflux.png'
        }
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
        } as OSPApplicationDataType
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
        applicationData : applicationDataType,
        applicationState : applicationStateType,
        contextMenu : contextMenuType,
        applicationContext : applicationContextType,
        ComponentUpdater : ComponentUpdaterType,
        uiElementsRef : uiElementsRefType,
        node_function:NodeFunctionTypes,
        link_function:LinkFunctionTypes,
        start_point :{ current: number[]; },
        resizeCanvas :() => void,
        ref_alt_key_pressed:MutableRefObject<boolean>
      )=>{
        const _ = initializeApplicationDraw(
          applicationData,applicationState,contextMenu,
          applicationContext, ComponentUpdater, uiElementsRef, node_function, link_function,
          start_point, resizeCanvas,ref_alt_key_pressed
        )
        Object.assign(_,OSPInitializeApplicationDraw(
          applicationData,applicationState,contextMenu,
          applicationContext,ComponentUpdater,uiElementsRef,node_function,link_function,
          start_point, resizeCanvas,ref_alt_key_pressed
        ))
        OSPNodeDragEvent(
          applicationData as OSPApplicationDataType,
          applicationState as OSPElementsSelectedType,
          applicationContext as OSPApplicationContextType,
          ref_alt_key_pressed.current,
          ComponentUpdater,
          (node_function as OSPNodeFuntionType),
          link_function,
          _ as unknown as OSPApplicationDrawType
        );
        (_ as OSPApplicationDrawType).reDrawOSPLabels = (object_to_update:OSPLabel[])=>{
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
          ComponentUpdater.updateComponenSaveInCache.current(false)}
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
        const menu_conf= initializeMenuConfiguration(
          applicationData,
          applicationState,
          applicationContext,uiElementsRef,
          dict_hook_ref_setter_show_dialog_components,additional_menus,node_function,link_function,
          applicationDraw,
          ComponentUpdater,
          updateMenus,
          menu_configuration_nodes,config_link_data,config_link_attr,
          contextMenu,ref_alt_key_pressed
        )
        OSPUpdateMenuConf(menu_conf,applicationData,applicationContext,uiElementsRef)
        return menu_conf
  
      }
    }
    initializeReinitialization={
      (
        applicationData,
        applicationState,
        contextMenu
      )=>{
        return () => {
          initializeReinitialization(applicationData,applicationState,contextMenu)()
          OSPInitializeReinitialization(applicationData,applicationState,contextMenu)()
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
        applicationData: applicationDataType,
        applicationState: applicationStateType,
        contextMenu:contextMenuType,
        applicationContext: applicationContextType,
        ComponentUpdater: ComponentUpdaterType,
        uiElementsRef:uiElementsRefType,
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
        ref_alt_key_pressed: React.MutableRefObject<boolean>
      )=>{
        const _= initializeLinkFunctions(
          applicationData,applicationState,contextMenu,applicationContext,
          ComponentUpdater,uiElementsRef,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed
        )
        Object.assign(_,OSPInitializeLinkFunctions(
          applicationData,applicationState,contextMenu,applicationContext,
          ComponentUpdater,uiElementsRef,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed
        ))
        return _
      }
    }
    initializeNodeFunctions={
      (
        applicationData: applicationDataType,
        applicationState: applicationStateType,
        contextMenu:contextMenuType,
        applicationContext: applicationContextType,
        ComponentUpdater: ComponentUpdaterType,
        uiElementsRef:uiElementsRefType,
        resizeCanvas:(_:applicationDataType)=>void,
        dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
        ref_alt_key_pressed: React.MutableRefObject<boolean>,
        accept_simple_click: React.MutableRefObject<boolean>,
        recomputeDisplayedElement: () => void,
        link_function: LinkFunctionTypes
      )=>{
        const _ = initializeNodeFunctions(
          applicationData,applicationState,contextMenu,applicationContext,ComponentUpdater,
          uiElementsRef,resizeCanvas,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed,accept_simple_click,
          recomputeDisplayedElement,link_function
        )
        Object.assign(_,OSPInitializeNodeFunctions(
          applicationData,applicationState,contextMenu,applicationContext,ComponentUpdater,
          uiElementsRef,resizeCanvas,dict_hook_ref_setter_show_dialog_components,ref_alt_key_pressed,accept_simple_click,
          recomputeDisplayedElement,link_function
        ))
        return _
      }
    }
    initializeAdditionalMenus={
      (
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
        link_function,
        processFunctions,
        Reinitialization,
        contextMenu

      )=>{
        if (window.SankeyToolsStatic) {
          const plus_dict_app_data=applicationData as OSPApplicationDataType
          const OSPApplicationContext=applicationContext as OSPApplicationContextType
          const selector_of_view=<SelecteurView
            applicationData={plus_dict_app_data}
            applicationState={applicationState as OSPElementsSelectedType}
            t={applicationContext.t}
            set_view_not_saved={plus_dict_app_data.set_view_not_saved}
            connected={OSPApplicationContext.has_open_sankey_plus}
          />;
          (uiElementsRef as OSPUiElementsRefType).ViewSelector.current=selector_of_view
          additionalMenus.externale_navbar_item['view']=<OSPBannerView
            applicationData={applicationData as OSPApplicationDataType}
            applicationContext={OSPApplicationContext}
            dict_hook_ref_setter_show_dialog_components={(dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType)}
            convert_data={applicationData.convert_data}
            view_selector={(uiElementsRef as OSPUiElementsRefType).ViewSelector.current as JSX.Element}
          />
          return
        }
        initializeAdditionalMenus(
          additionalMenus,
          updateMenus,
          applicationContext,applicationData,applicationDraw,ComponentUpdater,applicationState,
          uiElementsRef,dict_hook_ref_setter_show_dialog_components,node_function,link_function,processFunctions,Reinitialization,contextMenu
        )
        OSPInitializeAdditionalMenus(
          additionalMenus,
          updateMenus,
          applicationContext,applicationData,applicationDraw,ComponentUpdater,applicationState,
          uiElementsRef,dict_hook_ref_setter_show_dialog_components,node_function,link_function,processFunctions,Reinitialization,contextMenu
        )
      }
    }
    moduleDialogs={
      (  
        applicationContext:applicationContextType,
        applicationData:applicationDataType,
        applicationState:applicationStateType,
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
            applicationDraw.reDrawLegend,
            processFunctions 
          ),
          ...OSPModuleDialogs(
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
            applicationDraw.reDrawLegend,
            processFunctions
          )
        ]
      }
    }
    DrawAll={
      (
        contextMenu:contextMenuType,
        applicationData:applicationDataType,
        uiElementsRef:uiElementsRefType,
        applicationState:applicationStateType,
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
        // Call the function that add links to the sankey
        d3.selectAll(' .opensankey #svg #sankey_def').remove()
        d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')
        DrawAll(
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
        )
        OSPDrawAll(
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
        )
      }
    }
    initializeKeyHandler={(
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
    )=>{
      // Recasted var for OSP key handler func
      const plus_dict_app_data=applicationData as OSPApplicationDataType
      const plus_applicationContext=applicationContext as OSPApplicationContextType
      const  plus_app_draw_func= applicationDraw as OSPApplicationDrawType
      const plus_elem_selected=applicationState as OSPElementsSelectedType
      const plus_dict_hook=dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType
      const plus_updater=ComponentUpdater as OSPComponentUpdaterType

      initializeKeyHandler(
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
      OSPInitializeKeyHandler(
        plus_applicationContext,e,plus_dict_app_data,plus_elem_selected,
        plus_dict_hook,plus_app_draw_func.reDrawOSPLabels,plus_updater
      )
    }
    }
    // Input data used for updateLayout
    // (OS only use data from imported file 
    // but OSP can use its view as imported data
    // )
    initializeDiagrammSelector={(applicationData)=>{
      const plus_app_data=applicationData as OSPApplicationDataType
      return OSPDiagramSelector(
        plus_app_data
      )}

    }
    ClickSaveDiagram={
      (
        applicationData: applicationDataType, 
        data:SankeyData,
        applicationState:applicationStateType,
        options:SaveDiagramOptionsType
      ) => {
        const {master_data} = applicationData as OSPApplicationDataType
        const OSPElementsSelected = applicationState as OSPElementsSelectedType
        let data_to_save = data as OSPData
        if (master_data && (master_data.view.length > 0)) {
          //if views are present there are two cases. If save only view data is saved otherwise master data is saved.
          if ( OSPElementsSelected.saveViewGetter.current ) {
            data_to_save.current_view='none'
          } else {
            data_to_save = master_data
          }
        }
        ClickSaveDiagram(
          applicationData,
          data_to_save,
          applicationState,
          options
        )
      }
    }
    installEventOnSVG={
      (
        contextMenu,
        applicationContext,
        applicationData,
        uiElementsRef,
        applicationState,
        link_function,
        ComponentUpdater,
        dict_hook_ref_setter_show_dialog_components,
        node_function,
        applicationDraw
      )=>{
        InstallEventsOnSVG(  
          contextMenu,
          applicationContext,
          applicationData,
          uiElementsRef,
          applicationState,
          link_function,
          ComponentUpdater,
          dict_hook_ref_setter_show_dialog_components,
          node_function,
          applicationDraw
        )
        OSPInstallEventsOnSVG(
          contextMenu,
          applicationContext,
          applicationData,
          uiElementsRef,
          applicationState,
          link_function,
          ComponentUpdater,
          dict_hook_ref_setter_show_dialog_components,
          node_function,
          applicationDraw
        )
      }
    }

    InitalizeSelectorDetailNodes={OSPInitalizeSelectorDetailNodes}
    GetSankeyMinWidthAndHeight={sankey_plus_min_width_and_height}
  />
)


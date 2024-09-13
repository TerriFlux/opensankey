import './deps/OpenSankey/css/main.css'
import './css/main.css'
import './css/colors/red.css'
import './css/style_elements_sankey.css'
import './css/react-quill.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import './traduction'


import { OSPData } from '../types/Types'
import {
  OSPInitializeApplicationData,
  OSPInitializeReinitialization,

  OSPInitializeAdditionalMenus, OSPModuleDialogs,
} from './OSPModule'
import { initializeAdditionalMenus, initializeMenuConfiguration, initializeReinitialization, moduleDialogs } from './deps/OpenSankey/OSModule'
import { applicationDataType, processFunctionsType, SankeyData } from './deps/OpenSankey/types/LegacyType'
import SankeyApp from './deps/OpenSankey/SankeyApp'
import { OpenSankeyDiagramSelector } from './deps/OpenSankey/dialogs/SankeyMenuDialogs'
import { ClickSaveDiagram } from './deps/OpenSankey/dialogs/SankeyPersistence'
import { DefaultSankeyData } from './deps/OpenSankey/types/Legacy'
import { Type_GenericApplicationDataOS } from './deps/OpenSankey/types/TypesOS'

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

  // const osp_var:OSPDataVar={
  //   nodes:os_var.nodes as {[x:string]:OSPNode},
  //   links:os_var.links as {[x:string]:OSPLink},
  //   is_catalog:false,
  //   view:[],
  //   current_view:'none',
  //   labels:{},
  //   icon_catalog:{},
  //   // style_link:{'default':DefaultOSPStyleLink()},
  //   style_link:{'default':DefaultOSPStyleLink()},
  //   background_image:'',
  //   show_background_image:false,
  //   style_node:os_var.style_node
  // }
  // const tmp:OSPData=Object.assign(os_var,osp_var)
  const tmp:OSPData=Object.assign(os_var)

  return tmp
}

// Create a default sankey
const data = get_default_data() as SankeyData
// Search if a data is stored in localStorage of the navigator
// const json_data = LZString.decompress(localStorage.getItem('data') as string)

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

    initializeApplicationData={
      (
        data,
        set_data,
        get_default_data,
        initial_data
      )=>{
        return {
          // ...initializeApplicationData(data,set_data,get_default_data,initial_data),
          ...OSPInitializeApplicationData(data,set_data,get_default_data,initial_data) as unknown as applicationDataType
        }
      }
    }

    initializeMenuConfiguration={
      (
        applicationData,
        additional_menus,
        config_link_data,
        config_link_attr,
        menu_configuration_nodes_attributes,
      )=>{
        const menu_conf= initializeMenuConfiguration(
          applicationData,
          additional_menus,
          config_link_data,
          config_link_attr,
          menu_configuration_nodes_attributes,
        )
        return menu_conf

      }
    }
    initializeReinitialization={
      (
        applicationData
      )=>{
        return () => {
          initializeReinitialization(applicationData)()
          OSPInitializeReinitialization()()
        }
      }
    }

    initializeAdditionalMenus={
      (
        additionalMenus,
        applicationData,
        processFunctions,
        reinitialization
      )=>{
        if (window.SankeyToolsStatic) {

          return
        }
        initializeAdditionalMenus(
          additionalMenus,
          applicationData,
          processFunctions,
          reinitialization
        )
        OSPInitializeAdditionalMenus(
          additionalMenus,
          applicationData,
          processFunctions,
          reinitialization
        )
      }
    }
    moduleDialogs={
      (
        applicationData,
        additional_menus,
        menu_configuration_nodes_attributes,
        processFunctions:processFunctionsType
      )=>{
        return [
          ...moduleDialogs(
            applicationData,
            additional_menus,
            menu_configuration_nodes_attributes,
            processFunctions
          ),
          ...OSPModuleDialogs(
            applicationData,
            additional_menus,
            menu_configuration_nodes_attributes,
            processFunctions
          )
        ]
      }
    }


    // Input data used for updateLayout
    // (OS only use data from imported file
    // but OSP can use its view as imported data
    // )
    initializeDiagrammSelector={(_applicationData)=>{
      // const plus_app_data=applicationData as unknown as OSPApplicationDataType
      // return OSPDiagramSelector(
      //   plus_app_data
      // )
      return OpenSankeyDiagramSelector
    }

    }
    ClickSaveDiagram={
      (
        ApplicationClass: Type_GenericApplicationDataOS
      ) => {
        ClickSaveDiagram(
          ApplicationClass
        )
      }
    }

  />
)


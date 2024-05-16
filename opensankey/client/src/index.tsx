import './css/bootstrap.css'
import './css/main.css'
import './css/colors/red.css'
import React from 'react'
import { createRoot } from 'react-dom/client'

import SankeyApp from './SankeyApp'
import { convert_data,complete_sankey_data } from './configmenus/SankeyConvert'
import { DefaultLink, DefaultNode, DefaultSankeyData } from './configmenus/SankeyUtils'
import LZString from 'lz-string'
import './traduction'
import { 
  initializeApplicationContext, 
  initializeApplicationData, 
  initializeElementSelected, 
  initializeApplicationDraw, 
  initializeShowDialog, 
  initializeComponentUpdater, 
  initializeReinitialization, 
  closeAllMenu, 
  initializeUIElementsRef, 
  initializeContextMenu, 
  initializeProcessFunctions, 
  initializeLinkFunctions,
  initializeNodeFunctions,
  initializeAdditionalMenus,
  moduleDialogs,
  DrawAll,
  InstallEventsOnSVG,
  initializeMenuConfiguration,
  initializeKeyHandler
} from './OSModule'
import { OpenSankeyDiagramSelector } from './dialogs/SankeyMenuDialogs'


window.React = React

// Create a default sankey
const data = DefaultSankeyData()

// Search if a data is stored in localStorage of the navigator
const json_data = LZString.decompress(localStorage.getItem('data') as string)
// If there is, store the data in the sankey_data
if (json_data !== null && json_data != '' && json_data!='null') {
  const new_data = JSON.parse(json_data)
  Object.assign(data, new_data)
  convert_data(data,DefaultSankeyData)
  complete_sankey_data(data,DefaultSankeyData,DefaultNode,DefaultLink)
}
const container=document.getElementById('react-container') as Element | DocumentFragment
const root=createRoot(container)
root.render(
  <SankeyApp
    //- Application
    initializeApplicationContext={initializeApplicationContext} // Logo, names, licences
    initializeElementSelected={initializeElementSelected} 
    // Global variables not stored in SankeyData
    // Mode, nodes and links selected, style selected...
    initializeReinitialization={initializeReinitialization}

    //- Data
    initial_sankey_data={data}
    get_default_data={DefaultSankeyData} // Default sankey data
    initializeApplicationData={initializeApplicationData} // Data, displayed data, default data

    //- Draw
    initializeApplicationDraw={initializeApplicationDraw} // Functions necessay to draw the diagram
    initializeLinkFunctions={initializeLinkFunctions} // Functions necessay to draw the links
    initializeNodeFunctions={initializeNodeFunctions} // Functions necessay to draw the nodes
    DrawAll={DrawAll}
    installEventOnSVG={InstallEventsOnSVG}

    //- UI
    initializeComponentUpdater={initializeComponentUpdater}
    initializeMenuConfiguration={initializeMenuConfiguration} // Function to create the configuration menu
    // Used to update the various component of the application
    initializeUIElementsRef={initializeUIElementsRef} 
    // Ref to some key ui element in the application
    initializeAdditionalMenus={initializeAdditionalMenus}
    // Submenus to add in the application
    moduleDialogs={moduleDialogs}
    // Modal Dialogs
    initializeShowDialog={initializeShowDialog}
    // Visibility states for the modal dialogs
    initializeContextMenu={initializeContextMenu}
    // Menu opening on RMB
    closeAllMenu={closeAllMenu}

    // - Key handler
    initializeKeyHandler={initializeKeyHandler}

    // Input data used for updateLayout
    // (OS only use data from imported file 
    // but OSP can use its view as imported data
    // )
    initializeDiagrammSelector={()=>OpenSankeyDiagramSelector}

    //- BackEnd
    initializeProcessFunctions={initializeProcessFunctions}
  />
)


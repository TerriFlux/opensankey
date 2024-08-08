import './css/main.css'
import './css/colors/red.css'
import React from 'react'
import { createRoot } from 'react-dom/client'

import SankeyApp from './SankeyApp'
import './traduction'
import { 
  initializeApplicationData, 
  initializeReinitialization, 
  initializeAdditionalMenus,
  moduleDialogs,
  initializeMenuConfiguration} from './OSModule'
import { OpenSankeyDiagramSelector } from './dialogs/SankeyMenuDialogs'
import { ClickSaveDiagram } from './dialogs/SankeyPersistence'
import { DefaultSankeyData } from './types/Legacy'


window.React = React

// Create a default sankey
const data = DefaultSankeyData()



const container=document.getElementById('react-container') as Element | DocumentFragment
const root=createRoot(container)
root.render(
  <SankeyApp
    initializeReinitialization={initializeReinitialization}

    //- Data
    initial_sankey_data={data}
    get_default_data={DefaultSankeyData} // Default sankey data
    initializeApplicationData={initializeApplicationData} // Data, displayed data, default data

    //- UI
    initializeMenuConfiguration={initializeMenuConfiguration} // Function to create the configuration menu
    
    // Ref to some key ui element in the application
    initializeAdditionalMenus={initializeAdditionalMenus}
    // Submenus to add in the application
    moduleDialogs={moduleDialogs}
    
    // Input data used for updateLayout
    // (OS only use data from imported file 
    // but OSP can use its view as imported data
    // )
    initializeDiagrammSelector={()=>OpenSankeyDiagramSelector}

    //- BackEnd

    ClickSaveDiagram={ClickSaveDiagram}

    // Content of the popover node aggregation selector
  />
)


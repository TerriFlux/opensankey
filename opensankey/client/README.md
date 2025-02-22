# Using package Open-Sankey

npx create-react-app mysankey
npm install open-sankey

!! react and react-dom in package.json must the same version as the one in OpenSankey (18.3.1 at the time of this writing)

Replace your index.js by

> import React from 'react';
> import './index.css';
> import reportWebVitals from './reportWebVitals';
> import { createRoot } from 'react-dom/client'
> import { ChakraProvider } from '@chakra-ui/react'
> // Local imports ====================================================================================
> 
> import 'open-sankey/dist/traductions/traduction'
> 
> import OpenSankeyApp from 'open-sankey/dist/App'
> import {
>   initializeApplicationData,
>   initializeReinitialization,
>   initializeAdditionalMenus,
>   moduleDialogs,
>   initializeMenuConfiguration,
>   initializeDiagrammSelector
> } from 'open-sankey/dist/Modules'
> import {
>   ClickSaveDiagram
> } from 'open-sankey/dist/components/dialogs/SankeyPersistence'
> import {
>   ModalWelcomeBuilder
> } from 'open-sankey/dist/components/welcome/ModalWelcome'
> import { opensankey_theme } from 'open-sankey/dist/chakra/Theme'

> // CONSTANTS =========================================================================================

> // Link with React
> window.React = React

> // Application container
> const container=document.getElementById('root')
> const root=createRoot(container)

> // RENDERING ==========================================================================================
> root.render(
>   <ChakraProvider theme={opensankey_theme}>
>     <OpenSankeyApp
>      initializeReinitialization={initializeReinitialization}
> 
>       //- Data
>       initializeApplicationData={initializeApplicationData} // Data, displayed data, default data
> 
>       //- UI
>       initializeMenuConfiguration={initializeMenuConfiguration} // Function to create the configuration menu
> 
>       // Ref to some key ui element in the application
>       initializeAdditionalMenus={initializeAdditionalMenus}
> 
>       // Input data used for updateLayout
>       // (OS only use data from imported file
>       // but OSP can use its view as imported data
>       // )
>       initializeDiagrammSelector={initializeDiagrammSelector}
> 
>       // Submenus to add in the application
>       moduleDialogs={moduleDialogs}
> 
>       // Welcome modal
>       ModalWelcome={ModalWelcomeBuilder}
> 
>       // BackEnd
>       ClickSaveDiagram={ClickSaveDiagram}
>     />
>   </ChakraProvider>
> )


> // If you want to start measuring performance in your app, pass a function
> // to log results (for example: reportWebVitals(console.log))
> // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
> reportWebVitals();`

npm run start
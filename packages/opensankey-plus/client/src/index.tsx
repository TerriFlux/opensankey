import 'open-sankey/src/css/main.css'
import './css/style_elements_sankey.css'
import './css/react-quill.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import './traductions/traduction'
import { OpenSankeyPlusApp } from './AppOSP'

window.React = React

const container = document.getElementById('react-container') as Element | DocumentFragment
const root = createRoot(container)

root.render(OpenSankeyPlusApp)


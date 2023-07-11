import React from 'react'
import { Row, Form, FormLabel, Col, FormCheck, Tab, Button } from 'react-bootstrap'
import { SankeyPlusData, SankeyPlusNode,SankeyPlusLinkStyle } from './types'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from 'open-sankey/dist/SankeyLayout'
import { default_link,default_link_style } from 'open-sankey/dist/SankeyUtils'

export const default_sankey_plus_style_link=()=>{
    const style=default_link_style() as SankeyPlusLinkStyle
    style.gradient=false
    return style
}
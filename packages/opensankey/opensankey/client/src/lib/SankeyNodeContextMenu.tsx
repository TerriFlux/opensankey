import React, { FunctionComponent } from 'react'
import { Button, Modal, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { reorganize_inputLinksId} from './SankeyLayout'
import { SankeyDataPropTypes, SankeyLink, SankeyNode, SankeyNodePropTypes } from './types'
import { delete_link, delete_node } from './SankeyUtils'

const SankeyNodeContextMenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  closeNodeContextMenu: PropTypes.func.isRequired,
  selected_node: PropTypes.shape(SankeyNodePropTypes).isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyNodeContextMenuTypes = InferProps<typeof SankeyNodeContextMenuPropTypes>
const SankeyNodeContextMenu: FunctionComponent<SankeyNodeContextMenuTypes> = ({ data, set_data, show, selected_node, closeNodeContextMenu }) => {
  const display_nodes = data.nodes
  const display_links = data.links
  
  return (
    <Modal size="sm" show={show} onHide={closeNodeContextMenu}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <br></br>
        <ButtonGroup style={{ 'marginLeft': '10px' }}>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px', 'marginRight' : '3px' }}
            onClick={
              () => {
                reorganize_inputLinksId(selected_node, true, false, display_nodes, display_links)
                closeNodeContextMenu()
              }
            }
          >Réorganiser liens entrants</Button>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px' }}
            onClick={
              () => {
                reorganize_inputLinksId(selected_node, false, true, display_nodes, display_links)
                closeNodeContextMenu()
              }
            }
          >Réorganiser liens sortants</Button>
        </ButtonGroup>
        <ButtonGroup style={{ 'marginLeft': '10px' }}>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px' }}
            onClick={
              () => {
                delete_node(data, selected_node)
                set_data({ ...data })
                closeNodeContextMenu()
              }
            }
          >Supprimer noeud</Button>
        </ButtonGroup>
        <ButtonGroup style={{ 'marginLeft': '10px' }}>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px', 'marginRight' : '3px' }}
            onClick={
              () => {
                while (selected_node.inputLinksId.length > 0) {
                  const link = display_links[selected_node.inputLinksId[0]]
                  delete_link(data, link)
                }
                set_data({ ...data })
              }
            }
          >Supprimer flux entrant</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                while (selected_node.outputLinksId.length > 0) {
                  const link = display_links[selected_node.outputLinksId[0]]
                  delete_link(data, link)
                }
                set_data({ ...data })
              }
            }
          >Supprimer flux sortant</Button>
        </ButtonGroup>
        <ButtonGroup style={{ 'marginLeft': '10px' }}> 
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px', 'marginRight' : '3px'}} 
            onClick = {
              () =>  {
                const current_x = selected_node.x
                const current_prev_y = selected_node.y - data.v_space
                const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.y = selected_node.y
                }
                selected_node.y = selected_node.y - data.v_space
                set_data({...data})
              }
            }
          >Monter</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px', 'marginRight' : '3px'}} 
            onClick = {
              () =>  {
                const current_x = selected_node.x
                const current_prev_y = selected_node.y + data.v_space
                const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_x && n.y === current_prev_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.y = selected_node.y
                }
                selected_node.y = selected_node.y + data.v_space
                set_data({...data})
              }
            }
          >Descendre</Button>
        </ButtonGroup>
        <ButtonGroup style={{ 'marginLeft': '10px' }}> 
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                const current_prev_x = Math.round(selected_node.x/data.h_space)*data.h_space - data.h_space
                const current_y = selected_node.y 
                const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_prev_x && n.y === current_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.x = Math.round(selected_node.x/data.h_space)*data.h_space
                }
                selected_node.x = current_prev_x
                set_data({...data})
              }
            }
          >Décaler gauche</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                const current_prev_x = Math.round(selected_node.x/data.h_space)*data.h_space + data.h_space
                const current_y = selected_node.y 
                const node_to_replace = Object.values(display_nodes).filter(n => n.node_visible && n.x === current_prev_x && n.y === current_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.x = Math.round(selected_node.x/data.h_space)*data.h_space
                }
                selected_node.x = current_prev_x
                set_data({...data})
              }
            }
          >Décaler droite</Button>
        </ButtonGroup>
      </Modal.Body>
    </Modal>
  )
}

SankeyNodeContextMenu.propTypes = SankeyNodeContextMenuPropTypes

export default SankeyNodeContextMenu
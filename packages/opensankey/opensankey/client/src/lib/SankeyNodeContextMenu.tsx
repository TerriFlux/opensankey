import React, { FunctionComponent } from 'react'
import { Button, Modal, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { reorganize_input_links } from './SankeyLayout'
import { SankeyDataPropTypes } from './types'
import { delete_link, delete_node } from './SankeyUtils'

const SankeyNodeContextMenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  closeNodeContextMenu: PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyNodeContextMenuTypes = InferProps<typeof SankeyNodeContextMenuPropTypes>
const SankeyNodeContextMenu: FunctionComponent<SankeyNodeContextMenuTypes> = ({ data, set_data, show, selected_node, closeNodeContextMenu }) => {
  //const {data} = parent.state 
  const { links, nodes } = data
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
                reorganize_input_links(selected_node, true, false, nodes, links)
                closeNodeContextMenu()
              }
            }
          >Réorganiser liens entrants</Button>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px' }}
            onClick={
              () => {
                reorganize_input_links(selected_node, false, true, nodes, links)
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
                while (nodes[selected_node].input_links.length > 0) {
                  delete_link(data, nodes[selected_node].input_links[0])
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
                while (nodes[selected_node].output_links.length > 0) {
                  delete_link(data, nodes[selected_node].output_links[0])
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
                const node_name = nodes[selected_node].name
                const desagregate_nodes = nodes.filter( n => n.parent_name === node_name )
                desagregate_nodes.forEach(n => {
                  // show desagregated nodes and input and output links if source and target nodes are visible
                  n.label_visible = true
                  n.visible = true
                  n.input_links.forEach(
                    l_idx => {
                      const source_name = links[l_idx].source_name
                      const source_node = nodes.filter( n => n.name === source_name )[0]
                      links[l_idx].visible = source_node.visible
                    }
                  )
                  n.output_links.forEach(
                    l_idx => {
                      const target_name = links[l_idx].target_name
                      const target_node = nodes.filter( n => n.name === target_name )[0]
                      links[l_idx].visible = target_node.visible
                    }
                  )
                })
                // Hides agregated nodes
                nodes[selected_node].label_visible = false
                nodes[selected_node].visible = false
                nodes[selected_node].input_links.forEach(
                  l_idx => links[l_idx].visible = false
                )
                nodes[selected_node].output_links.forEach(
                  l_idx => links[l_idx].visible = false
                )
                set_data({...data})
              }
            }
          >Désagrégation</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                const agregated_node = nodes.filter( n => n.name === nodes[selected_node].parent_name )[0]
                if (!agregated_node) {
                  return
                }
                const desagregate_nodes = nodes.filter( n => n.parent_name === agregated_node.name )
                desagregate_nodes.forEach(n => {
                  n.label_visible = false
                  n.visible = false
                  n.input_links.forEach(
                    l_idx => links[l_idx].visible = false
                  )
                  n.output_links.forEach(
                    l_idx => links[l_idx].visible = false
                  )
                })
                // show agregated node
                agregated_node.label_visible = true
                agregated_node.visible = true
                agregated_node.input_links.forEach(
                  l_idx => {
                    const source_name = links[l_idx].source_name
                    const source_node = nodes.filter( n => n.name === source_name )[0]
                    links[l_idx].visible = source_node.visible
                  }
                )
                agregated_node.output_links.forEach(
                  l_idx => {
                    const target_name = links[l_idx].target_name
                    const target_node = nodes.filter( n => n.name === target_name )[0]
                    links[l_idx].visible = target_node.visible
                  }
                )
                set_data({...data})
              }
            }
          >Agrégation</Button>
        </ButtonGroup>
        <ButtonGroup style={{ 'marginLeft': '10px' }}> 
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px', 'marginRight' : '3px'}} 
            onClick = {
              () =>  {
                const current_x = nodes[selected_node].x
                const current_prev_y = nodes[selected_node].y - data.v_space
                const node_to_replace = nodes.filter(n => n.x === current_x && n.y === current_prev_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.y = nodes[selected_node].y
                }
                nodes[selected_node].y = nodes[selected_node].y - data.v_space
                set_data({...data})
              }
            }
          >Monter</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px', 'marginRight' : '3px'}} 
            onClick = {
              () =>  {
                const current_x = nodes[selected_node].x
                const current_prev_y = nodes[selected_node].y + data.v_space
                const node_to_replace = nodes.filter(n => n.x === current_x && n.y === current_prev_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.y = nodes[selected_node].y
                }
                nodes[selected_node].y = nodes[selected_node].y + data.v_space
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
                const current_prev_x = nodes[selected_node].x - data.h_space
                const current_y = nodes[selected_node].y 
                const node_to_replace = nodes.filter(n => n.x === current_prev_x && n.y === current_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.x = nodes[selected_node].x
                }
                nodes[selected_node].x = nodes[selected_node].x - data.h_space
                set_data({...data})
              }
            }
          >Décaler gauche</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                const current_prev_x = nodes[selected_node].x + data.h_space
                const current_y = nodes[selected_node].y 
                const node_to_replace = nodes.filter(n => n.x === current_prev_x && n.y === current_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.x = nodes[selected_node].x
                }
                nodes[selected_node].x = nodes[selected_node].x + data.h_space
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
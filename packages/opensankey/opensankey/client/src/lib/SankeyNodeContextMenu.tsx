import React, { FunctionComponent } from 'react'
import { Button, Modal, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { reorganize_input_links, reorganize_node_input_links, reorganize_node_output_links } from './SankeyLayout'
import { SankeyDataPropTypes, SankeyLink, SankeyNode } from './types'
import { delete_link, delete_node, normalize_name } from './SankeyUtils'

const SankeyNodeContextMenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  closeNodeContextMenu: PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyNodeContextMenuTypes = InferProps<typeof SankeyNodeContextMenuPropTypes>
const SankeyNodeContextMenu: FunctionComponent<SankeyNodeContextMenuTypes> = ({ data, set_data, show, selected_node, closeNodeContextMenu }) => {
  //const { nodes, links } = data
  const display_nodes : SankeyNode[] = data.nodes.filter( n=> n.display )
  const display_links : SankeyLink[] = data.links.filter( l=> {
    const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
    const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
    return source_node.display &&  target_node.display
  })
  
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
                reorganize_input_links(selected_node, true, false, display_nodes, display_links)
                closeNodeContextMenu()
              }
            }
          >Réorganiser liens entrants</Button>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px' }}
            onClick={
              () => {
                reorganize_input_links(selected_node, false, true, display_nodes, display_links)
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
                while (display_nodes[selected_node].input_links.length > 0) {
                  delete_link(data, display_nodes[selected_node].input_links[0])
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
                while (display_nodes[selected_node].output_links.length > 0) {
                  delete_link(data, display_nodes[selected_node].output_links[0])
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
                const node_name = display_nodes[selected_node].name
                const desagregate_nodes = data.nodes.filter( n => n.parent_name === node_name )
                desagregate_nodes.forEach( n => {
                  n.display = true
                  n.visible = true
                  n.label_visible = true
                })
                const nb_desagregated = desagregate_nodes.length
                let current_y = data.v_space/2
                const delta_y = data.v_space / (nb_desagregated-1)
                desagregate_nodes.forEach(n => {
                  // show desagregated nodes and input and output links if source and target nodes are visible
                  // n.label_visible = true
                  // n.visible = true
                  if (n.x === undefined) {
                    n.x = display_nodes[selected_node].x
                    n.y = display_nodes[selected_node].y - current_y
                  }
                  current_y = current_y - delta_y
                })
                // Hides agregated nodes
                display_nodes[selected_node].display = false
                // nodes[selected_node].label_visible = false
                // nodes[selected_node].visible = false
                display_nodes[selected_node].input_links.forEach(
                  l_idx => display_links[l_idx].visible = false
                )
                display_nodes[selected_node].output_links.forEach(
                  l_idx => display_links[l_idx].visible = false
                )

                const new_display_nodes = data.nodes.filter( n=> n.display )
                const new_display_links = data.links.filter( l=> {
                  const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
                  const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
                  return source_node.display &&  target_node.display
                })
                desagregate_nodes.forEach(n => {
                  n.input_links = []
                  n.output_links = []
                  new_display_links.forEach((link, link_id) => {
                    if (normalize_name(link.target_name) === normalize_name(n.name)) {
                      n.input_links.push(link_id)
                    }
                    if (normalize_name(link.source_name) === normalize_name(n.name)) {
                      n.output_links.push(link_id)
                    }
                  })
                  n.input_links.forEach(
                    l_idx => {
                      const source_name = new_display_links[l_idx].source_name
                      const source_node = new_display_nodes.filter( n => n.name === source_name )[0]
                      new_display_links[l_idx].visible = source_node.visible
                    }
                  )
                  n.output_links.forEach(
                    l_idx => {
                      const target_name = new_display_links[l_idx].target_name
                      const target_node = new_display_nodes.filter( n => n.name === target_name )[0]
                      new_display_links[l_idx].visible = target_node.visible
                    }
                  )
                })
                new_display_nodes.forEach(n => {
                  reorganize_node_input_links(n,new_display_nodes,new_display_links)
                  reorganize_node_output_links(n,new_display_nodes,new_display_links)
                })

                set_data({...data})
              }
            }
          >Désagrégation</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                const agregated_node = data.nodes.filter( n => n.name === display_nodes[selected_node].parent_name )[0]
                if (!agregated_node) {
                  return
                }
                const desagregate_nodes = display_nodes.filter( n => n.parent_name === agregated_node.name )
                // show agregated node
                agregated_node.display = true
                agregated_node.visible = true
                agregated_node.label_visible = true
                desagregate_nodes.forEach( n => n.display = false)
                let mean_x = 0
                let mean_y = 0
                desagregate_nodes.forEach(n => {
                  // n.label_visible = false
                  // n.visible = false
                  mean_x += n.x
                  mean_y += n.y
                })
                mean_x = mean_x/desagregate_nodes.length
                mean_y = mean_y/desagregate_nodes.length

                // agregated_node.label_visible = true
                // agregated_node.visible = true
                if (agregated_node.x === undefined ) {
                  agregated_node.x = mean_x
                  agregated_node.y = mean_y
                }

                const new_display_nodes = data.nodes.filter( n=> n.display )
                const new_display_links = data.links.filter( l=> {
                  const source_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.source_name))[0]
                  const target_node = data.nodes.filter(n => normalize_name(n.name) === normalize_name(l.target_name))[0]
                  return source_node.display &&  target_node.display
                })

                agregated_node.input_links = []
                agregated_node.output_links = []
                new_display_links.forEach((link, link_id) => {
                  if (normalize_name(link.target_name) === normalize_name(agregated_node.name)) {
                    agregated_node.input_links.push(link_id)
                  }
                  if (normalize_name(link.source_name) === normalize_name(agregated_node.name)) {
                    agregated_node.output_links.push(link_id)
                  }
                })
                agregated_node.input_links.forEach(
                  l_idx => {
                    const source_name = new_display_links[l_idx].source_name
                    const source_node = new_display_nodes.filter( n => normalize_name(n.name) === normalize_name(source_name) )[0]
                    new_display_links[l_idx].visible = source_node.visible
                  }
                )
                agregated_node.output_links.forEach(
                  l_idx => {
                    const target_name = new_display_links[l_idx].target_name
                    const target_node = new_display_nodes.filter( n => normalize_name(n.name) === normalize_name(target_name) )[0]
                    new_display_links[l_idx].visible = target_node.visible
                  }
                )
                new_display_nodes.forEach(n => {
                  reorganize_node_input_links(n,new_display_nodes,new_display_links)
                  reorganize_node_output_links(n,new_display_nodes,new_display_links)
                })
                
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
                const current_x = display_nodes[selected_node].x
                const current_prev_y = display_nodes[selected_node].y - data.v_space
                const node_to_replace = display_nodes.filter(n => n.x === current_x && n.y === current_prev_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.y = display_nodes[selected_node].y
                }
                display_nodes[selected_node].y = display_nodes[selected_node].y - data.v_space
                set_data({...data})
              }
            }
          >Monter</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px', 'marginRight' : '3px'}} 
            onClick = {
              () =>  {
                const current_x = display_nodes[selected_node].x
                const current_prev_y = display_nodes[selected_node].y + data.v_space
                const node_to_replace = display_nodes.filter(n => n.x === current_x && n.y === current_prev_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.y = display_nodes[selected_node].y
                }
                display_nodes[selected_node].y = display_nodes[selected_node].y + data.v_space
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
                const current_prev_x = Math.round(display_nodes[selected_node].x/data.h_space)*data.h_space - data.h_space
                const current_y = display_nodes[selected_node].y 
                const node_to_replace = display_nodes.filter(n => n.x === current_prev_x && n.y === current_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.x = Math.round(display_nodes[selected_node].x/data.h_space)*data.h_space
                }
                display_nodes[selected_node].x = current_prev_x
                set_data({...data})
              }
            }
          >Décaler gauche</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                const current_prev_x = Math.round(display_nodes[selected_node].x/data.h_space)*data.h_space + data.h_space
                const current_y = display_nodes[selected_node].y 
                const node_to_replace = display_nodes.filter(n => n.x === current_prev_x && n.y === current_y )[0]
                if ( node_to_replace !== undefined ) {
                  node_to_replace.x = Math.round(display_nodes[selected_node].x/data.h_space)*data.h_space
                }
                display_nodes[selected_node].x = current_prev_x
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
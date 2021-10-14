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
        <ButtonGroup vertical style={{ 'marginLeft': '10px' }}>
          <Button
            size="sm"
            style={{ 'marginBottom': '3px' }}
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
          <Button
            size="sm"
            style={{ 'marginBottom': '3px' }}
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
            onClick={
              () => {
                while (nodes[selected_node].output_links.length > 0) {
                  delete_link(data, nodes[selected_node].output_links[0])
                }
                set_data({ ...data })
              }
            }
          >Supprimer flux sortant</Button>
        </ButtonGroup>
      </Modal.Body>
    </Modal>
  )
}

SankeyNodeContextMenu.propTypes = SankeyNodeContextMenuPropTypes

export default SankeyNodeContextMenu
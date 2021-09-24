import React, { FunctionComponent } from 'react'
import { Button,Modal,ButtonGroup } from 'react-bootstrap'
import PropTypes,{InferProps} from 'prop-types'
import { reorganize_input_links } from './SankeyLayout'
import { SankeyDataPropTypes } from './types'

const SankeyNodeContextMenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  closeNodeContextMenu: PropTypes.func.isRequired,
  selected_node: PropTypes.number.isRequired,
  delete_node: PropTypes.func.isRequired,
  delete_link: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
}

type  SankeyNodeContextMenuTypes = InferProps<typeof SankeyNodeContextMenuPropTypes>
const  SankeyNodeContextMenu: FunctionComponent<SankeyNodeContextMenuTypes> = ({data,show,selected_node,delete_node,delete_link,closeNodeContextMenu}) => {
  //const {data} = parent.state 
  const { links,nodes} = data
  return (
    <Modal size="sm"  show={show} onHide={closeNodeContextMenu}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <br></br>
        <ButtonGroup vertical style={{ 'marginLeft' : '10px' }}>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick={
              ()=> {
                reorganize_input_links(selected_node,true,false,nodes,links)
                //parent.setState({data})
                closeNodeContextMenu()  
              }
            }
          >Réorganiser liens entrants</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick={
              ()=> {
                reorganize_input_links(selected_node,false,true,nodes,links)
                //setState({data})
                closeNodeContextMenu()  
              }
            }
          >Réorganiser liens sortants</Button>
          <Button 
            size="sm" 
            style={{ 'marginBottom' : '3px'}} 
            onClick={
              ()=> {
                delete_node(selected_node)
                closeNodeContextMenu()  
              }
            }
          >Supprimer noeud</Button>
          <Button 
            size="sm"
            style={{ 'marginBottom' : '3px'}} 
            onClick = {
              () =>  {
                while (nodes[selected_node].input_links.length > 0) {
                  delete_link(nodes[selected_node].input_links[0])
                }
                //parent.setState({data})
              }
            }
          >Supprimer flux entrant</Button>
          <Button 
            size="sm" 
            onClick = {
              () =>  {
                while (nodes[selected_node].output_links.length > 0) {
                  delete_link(nodes[selected_node].output_links[0])
                }
                //parent.setState({data})
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
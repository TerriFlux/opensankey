import React,{ FunctionComponent } from 'react'
import { Button,Modal,ButtonGroup } from 'react-bootstrap'
import PropTypes,{InferProps} from 'prop-types'

const SankeyLinkContextMenuPropTypes = {
  delete_link: PropTypes.func.isRequired,
  closeLinkContextMenu: PropTypes.func.isRequired,
  selected_link: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyLinkContextMenuTypes = InferProps<typeof SankeyLinkContextMenuPropTypes>
const SankeyLinkContextMenu : FunctionComponent<SankeyLinkContextMenuTypes> = ({delete_link,closeLinkContextMenu,selected_link,show}) => {
  return (
    <Modal size="sm"  show={show} onHide={closeLinkContextMenu}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <br></br>
        <ButtonGroup vertical style={{ 'marginLeft' : '10px' }}>
          <Button 
            size="sm" 
            onClick={
              ()=> {
                delete_link(selected_link)
                closeLinkContextMenu()
              }
            }
          >Supprimer flux</Button>
        </ButtonGroup>
      </Modal.Body>
    </Modal>
  )
}

SankeyLinkContextMenu.propTypes = SankeyLinkContextMenuPropTypes

export default SankeyLinkContextMenu
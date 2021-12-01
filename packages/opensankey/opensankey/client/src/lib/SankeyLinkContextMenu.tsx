import React, { FunctionComponent } from 'react'
import { Button, Modal, ButtonGroup } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { delete_link } from './SankeyUtils'
import { SankeyDataPropTypes, SankeyLinkPropTypes } from './types'

const SankeyLinkContextMenuPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  closeLinkContextMenu: PropTypes.func.isRequired,
  selected_link: PropTypes.shape(SankeyLinkPropTypes).isRequired,
  show: PropTypes.bool.isRequired
}

type SankeyLinkContextMenuTypes = InferProps<typeof SankeyLinkContextMenuPropTypes>
const SankeyLinkContextMenu: FunctionComponent<SankeyLinkContextMenuTypes> = ({ data, set_data, closeLinkContextMenu, selected_link, show }) => {
  return (
    <Modal size="sm" show={show} onHide={closeLinkContextMenu}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <br></br>
        <ButtonGroup vertical style={{ 'marginLeft': '10px' }}>
          <Button
            size="sm"
            onClick={
              () => {
                delete_link(data, selected_link)
                set_data({ ...data })
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
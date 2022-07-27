import React, { useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, Tabs } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import { SankeyDataPropTypes } from './types'

const SankeySettingsEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired
}
type SankeyEditionTypes = InferProps<typeof SankeySettingsEditionPropTypes>

const SankeySettingsEdition: FunctionComponent<SankeyEditionTypes> = ({
  data,
  set_data,
  children
}) => {
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)

  return (
    <>
      <Form>
        <Form.Group as={Row} >
          <Col xs={3}>
            <FormLabel >Echelle</FormLabel>
          </Col>
          <Col>
            <FormControl
              type="text"
              value={user_scale}
              onChange={evt => set_user_scale(+evt.target.value)}
              onBlur={() => {
                data.user_scale = user_scale
                set_data({ ...data })
              }}
            />
            <FormControl.Feedback />
            <Form.Text>    (valeur pour 100px)</Form.Text>
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col xs={3}>
            <FormLabel >Taille Carré Grille</FormLabel>
          </Col>
          <Col xs={4}>
            <FormControl
              type="number"
              min={1}
              max={100}
              step={1}
              value={data.grid_square_size}
              onChange={evt => {
                data.grid_square_size = (+evt.target.value >= 1) ? +evt.target.value : 10
                set_data({ ...data })
              }}

            />
          </Col>
          <Col >
            <FormCheck
              inline
              type='switch'
              checked={data.grid_visible}
              label='Grille visible'
              onChange={() => {
                data.grid_visible = !data.grid_visible
                set_data({ ...data })
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col>
            <Button
              size="sm"
              onClick={() => {
                arrangeNodes(data)
                set_data({ ...data })
              }}
            >Arranger noeuds</Button>
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col xs={3}>
            <FormLabel>Ecart entre noeuds</FormLabel>
          </Col>
          <Col xs={2}>
            <FormLabel>Horizontal</FormLabel>
          </Col>
          <Col xs={2}>
            <FormControl
              type="text"
              value={node_hspace}
              onChange={evt => {
                set_node_hspace(+evt.target.value)
                data.h_space = +evt.target.value
              }}
            />
          </Col>
          <Col xs={2}>
            <FormLabel>Vertical</FormLabel>
          </Col>
          <Col xs={2}>
            <FormControl
              type="text"
              value={node_vspace}
              onChange={evt => {
                set_node_vspace(+evt.target.value)
                data.v_space = +evt.target.value
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} >
          <Col xs={4}>
            <Button
              size="sm"
              onClick={() => {
                compute_auto_sankey(data, node_hspace)
                set_data({ ...data })
              }}
            > Positionnement automatique</Button>
          </Col>
        </Form.Group>
      </Form>
      <Tabs id="settings-layout">
        {children}
      </Tabs>
    </>
  )
}

SankeySettingsEdition.propTypes = SankeySettingsEditionPropTypes

export default null

export { SankeySettingsEdition}
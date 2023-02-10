import React, { useState, FunctionComponent } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import { SankeyData } from './types'
import { TFunction } from 'i18next'

export const OpenSankeyMenuConfigurationLayout = (
  t:TFunction,
  data: SankeyData,
  set_data:(d:SankeyData)=>void
) => { 
  const [user_scale, set_user_scale] = useState(data.user_scale)
  const [maximum_flux, set_maximum_flux] = useState(data.maximum_flux)
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)
  return [
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('MEP.Echelle')}</FormLabel>
      </Col>
      <Col>
        <FormControl
          type="text"
          value={user_scale}
          onChange={evt => {
            set_user_scale(+evt.target.value)
          }}
          onBlur={() => {
            data.user_scale = user_scale
            set_data({ ...data })
          }}
        />
        <FormControl.Feedback />
        <Form.Text>    ({t('MEP.vp100')})</Form.Text>
      </Col>
    </Form.Group>,
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('MEP.MaxFlux')}</FormLabel>
      </Col>
      <Col>
        <FormControl
          type="text"
          value={maximum_flux == null ? undefined : maximum_flux}
          onChange={evt => {
            set_maximum_flux(+evt.target.value)
          }}
          onBlur={() => {
            data.maximum_flux = maximum_flux
            set_data({ ...data })
          }}
        />
      </Col>
    </Form.Group>,
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('MEP.TCG')}</FormLabel>
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
          label={t('MEP.GV')}
          onChange={() => {
            data.grid_visible = !data.grid_visible
            set_data({ ...data })
          }}
        />
      </Col>
    </Form.Group>,
    <Form.Group as={Row} >
      <Col>
        <Button
          size="sm"
          onClick={() => {
            arrangeNodes(data)
            set_data({ ...data })
          }}
        >{t('MEP.AN')}</Button>
      </Col>
    </Form.Group>,
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel>{t('MEP.EEN')}</FormLabel>
      </Col>
      <Col xs={2}>
        <FormLabel>{t('MEP.Horizontal')}</FormLabel>
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
        <FormLabel>{t('MEP.Vertical')}</FormLabel>
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
    </Form.Group>,
    <Form.Group as={Row} >
      <Col xs={4}>
        <Button
          size="sm"
          onClick={() => {
            compute_auto_sankey(data, node_hspace)
            set_data({ ...data })
          }}
        > {t('MEP.PA')}</Button>
      </Col>
    </Form.Group>
  ]
}

const SankeyMenuConfigurationLayoutPropTypes = {
  menu_configuration_layout: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
}
type SankeyMenuConfigurationLayoutTypes = InferProps<typeof SankeyMenuConfigurationLayoutPropTypes>

export const SankeyMenuConfigurationLayout: FunctionComponent<SankeyMenuConfigurationLayoutTypes> = ({
  menu_configuration_layout,
  //children
}) => {
  return (
    <>
      <Form>
        {menu_configuration_layout.map((c:JSX.Element)=>c)}
      </Form>
      {/* <Tabs id="settings-layout">
        {children}
      </Tabs> */}
    </>
  )
}

SankeyMenuConfigurationLayout.propTypes = SankeyMenuConfigurationLayoutPropTypes

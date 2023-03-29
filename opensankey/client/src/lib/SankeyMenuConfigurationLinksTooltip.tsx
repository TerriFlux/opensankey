import React from 'react'
import { Row, Form, Col, FormLabel, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'
import { TFunction } from 'i18next'

export const SankeyMenuConfigurationLinksTooltip = (
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  selected_link:{current:SankeyLink},
  t:TFunction
)=>{


  return <Tab eventKey="flux_tooltip" title={t('Flux.IB')}>
    <Form.Group as={Row} >
      <Col xs={12}>
        <OverlayTrigger
          key={'Flux.tooltips.IB'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.tooltips.IB'}>{t('Flux.tooltips.IB')} </Tooltip>}>
          <Form.Control
            as="textarea"
            rows={10}
            value={selected_link.current.tooltip_text ? selected_link.current.tooltip_text : ''}
            onChange={evt => {
              selected_link.current.tooltip_text = evt.target.value
              set_data({ ...data })
          }}/>
          </OverlayTrigger>
      </Col>
    </Form.Group>
  </Tab>

}
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
    <Form >
      <Row>
        <FormLabel column sm={1}>{t('Flux.IB')}:</FormLabel>
        <Col sm={11}>
          <OverlayTrigger
            key={'tooltip-adjust'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'tooltip-adjust'}>{t('Flux.tooltips.IB')} </Tooltip>}>
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
      </Row>
    </Form>
  </Tab>

}
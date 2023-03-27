import { TFunction } from 'i18next'
import React from 'react'
import { Row, Form, FormLabel, Col, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyNode} from './types'

export const SankeyMenuConfigurationNodesTooltip = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}
) => {
  return (
    <Tab eventKey="node_tooltip" title={t('Noeud.IB')}>
      <Form >
        <Row>
          <FormLabel column sm={1}>{t('Noeud.IB')}:</FormLabel>
          <Col sm={11}>
            <OverlayTrigger
              key={'tooltip-adjust'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'tooltip-adjust'}>{t('Noeud.tooltips.IB')} </Tooltip>}>
                <Form.Control
                  as="textarea"
                  rows={10}
                  value={multi_selected_nodes.current.length>0 && multi_selected_nodes.current[0].tooltip_text ? multi_selected_nodes.current[0].tooltip_text : ''}
                  onChange={
                    (evt) => {
                      multi_selected_nodes.current.map(node => node.tooltip_text = evt.target.value)
                      set_data({ ...data })
                }}/>
            </OverlayTrigger>
          </Col>
        </Row>
      </Form>
    </Tab>
  )
}
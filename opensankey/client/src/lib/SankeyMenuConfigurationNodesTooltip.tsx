import React from 'react'
import { Row, Form, FormLabel, Col, Tab } from 'react-bootstrap'
import { SankeyData, SankeyNode} from './types'
import {useTranslation} from 'react-i18next'

export const SankeyMenuConfigurationNodesTooltip = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}
) => {
  const {t} = useTranslation()
  return (
    <Tab eventKey="node_tooltip" title={t('Noeud.IB')}>
      <Form >
        <Row>
          <FormLabel column sm={1}>{t('Noeud.IB')}:</FormLabel>
          <Col sm={11}>
            <Form.Control
              as="textarea"
              rows={10}
              value={multi_selected_nodes.current.length>0 && multi_selected_nodes.current[0].tooltip_text ? multi_selected_nodes.current[0].tooltip_text : ''}
              onChange={
                (evt) => {
                  multi_selected_nodes.current.map(node => node.tooltip_text = evt.target.value)
                  set_data({ ...data })
                }
              }
            />
          </Col>
        </Row>
      </Form>
    </Tab>
  )
}
import React from 'react'
import { Row, Form, Col, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyMenuConfigurationNodesTooltipFType } from '../types/SankeyMenuConfigurationNodesTooltipTypes'

export const SankeyMenuConfigurationNodesTooltip : SankeyMenuConfigurationNodesTooltipFType = (
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected
) => {
  const { t } = applicationContext
  const { data, set_data} = dict_variable_application_data
  const { multi_selected_nodes } = dict_variable_elements_selected
  return (
    <Tab key="node_tooltip" eventKey="node_tooltip" title={t('Noeud.IB')}>
      <Form >
        <Row>
          <Col xs={12}>
            <OverlayTrigger
              key={'Noeud.tooltips.IB.1'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'Noeud.tooltips.IB.1'}>{t('Noeud.tooltips.IB')} </Tooltip>}>
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
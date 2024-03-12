import React, { useState } from 'react'
import { Row, Form, Col, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyMenuConfigurationNodesTooltipFType } from './types/SankeyMenuConfigurationNodesTooltipTypes'
import { StyleTitleSubSectionMenuEditionElements } from './SankeyUtils'

export const SankeyMenuConfigurationNodesTooltip : SankeyMenuConfigurationNodesTooltipFType = (
  applicationContext,
  dict_variable_elements_selected,
  menu_for_modal
) => {
  const { t } = applicationContext
  const { multi_selected_nodes } = dict_variable_elements_selected
  const [forceUpdate,setForceUpdate]=useState(false)
  const content =<Form >
    <h4 style={StyleTitleSubSectionMenuEditionElements({underline:true})}>{t('Noeud.IB')}</h4>

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
                setForceUpdate(!forceUpdate)
              }}/>
        </OverlayTrigger>
      </Col>
    </Row>
  </Form>
  return menu_for_modal?content:<Tab className='content_editon_elements' key="node_tooltip" eventKey="node_tooltip" title={t('Noeud.IS')}>
    {content}
  </Tab>
}
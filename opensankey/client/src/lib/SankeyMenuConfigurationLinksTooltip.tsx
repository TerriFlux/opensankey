import React from 'react'
import { Row, Form, Col, FormLabel, Tab} from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'
import { TFunction } from 'i18next'



export const SankeyMenuConfigurationLinksTooltip = (
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  selected_link:{current:SankeyLink},
  t:TFunction
)=>{


  

  return <Tab eventKey="flux_tooltip" title={t('Noeud.IB')}>
    <Form >
      <Row>
        <FormLabel column sm={1}>{t('Noeud.IB')}:</FormLabel>
        <Col sm={11}>
          <Form.Control
            as="textarea"
            rows={10}
            value={selected_link.current.tooltip_text ? selected_link.current.tooltip_text : ''}
            onChange={evt => {
              selected_link.current.tooltip_text = evt.target.value
              set_data({ ...data })
            }}
          />
        </Col>
      </Row>
    </Form>
  </Tab>

}
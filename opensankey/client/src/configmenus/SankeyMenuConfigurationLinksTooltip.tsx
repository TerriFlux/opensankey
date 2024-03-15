import React from 'react'
import { Row, Form, Col, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyLink } from '../types/Types'
import { TFunction } from 'i18next'
import { MenuConfigurationLinksTooltipFType } from './types/SankeyMenuConfigurationLinksTooltipTypes'
import { StyleTitleSubSectionMenuEditionElements } from './SankeyUtils'

export const MenuConfigurationLinksTooltip : MenuConfigurationLinksTooltipFType = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_links:{current:SankeyLink[]},
  t:TFunction,
  menu_for_modal:boolean
)=>{

  const content=    <>
    <h4 style={StyleTitleSubSectionMenuEditionElements({underline:true})}>{t('Noeud.IB')}</h4>

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
            value={multi_selected_links.current.length>0 && multi_selected_links.current[0].tooltip_text ? multi_selected_links.current[0].tooltip_text : ''}
            onChange={evt => {
              multi_selected_links.current.forEach(l=>l.tooltip_text = evt.target.value)
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group></>

  return menu_for_modal?content:<Tab key="flux_tooltip" className='content_editon_elements' eventKey="flux_tooltip" title={t('Flux.IS')}>
    {content}
  </Tab>

}
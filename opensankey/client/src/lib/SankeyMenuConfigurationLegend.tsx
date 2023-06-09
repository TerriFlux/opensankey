import { SankeyData } from './types'
import { Form, FormControl, FormLabel, Row, Col, OverlayTrigger, Tooltip,FormCheck } from 'react-bootstrap'
import React from 'react'
import { TFunction } from 'i18next'


export const OpenSankeyMenuConfigurationLegend= (
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  t: TFunction,
  legend_position:number[],
  set_legend_position:(n:number[])=>void
) => {

  return [
    /* Position X de la legende  */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel >{t('Menu.LegX')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'Menu.tooltips.LegX'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.LegX'}>{t('Menu.tooltips.LegX')} </Tooltip>}>
          <FormControl
            type="text"
            value={legend_position[0]}
            onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
            onBlur={() => {
              data.legend_position = legend_position
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Position Y de la legende */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel>{t('Menu.LegY')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'Menu.tooltips.LegY'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.LegY'}>{t('Menu.tooltips.LegY')} </Tooltip>}>
          <FormControl
            type="text"
            value={legend_position[1]}
            onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
            onBlur={() => {
              data.legend_position = legend_position
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Largeur de la fenetre de legende */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel>{t('Menu.LegWidth')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'Menu.tooltips.LegWidth'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.LegWidth'}>{t('Menu.tooltips.LegWidth')} </Tooltip>}>
          <FormControl
            type="number"
            step={1}
            value={data.legend_width}
            onChange={evt =>{
              data.legend_width=+evt.target.value
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    // Afficher l'échelle sur le graphe
    <Form.Group as={Row}>
    <Col xs={7}>
        <Form.Label>{t('Menu.display_scale')}</Form.Label>
    </Col>
    <Col xs={5}>
    <FormCheck
        inline
        type='switch'
        checked={data.display_legend_scale}
        onChange={() => {
          data.display_legend_scale = !data.display_legend_scale
          set_data({ ...data })
        }}/>
    </Col>
  </Form.Group>,

  /* Font size de la legende*/
  <Form.Group as={Row} >
  <Col xs={7}>
    <FormLabel>{t('Menu.fontSize')}</FormLabel>
  </Col>
  <Col xs={5}>
    <OverlayTrigger
      key={'Menu.tooltips.fontSize'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'Menu.tooltips.fontSize'}>{t('Menu.tooltips.fontSize')} </Tooltip>}>
      <FormControl
        type="number"
        step={1}
        value={data.legend_police}
        onChange={evt =>{
          data.legend_police=+evt.target.value
          set_data({ ...data })
        }}/>
    </OverlayTrigger>
  </Col>
</Form.Group>,
  ]

}

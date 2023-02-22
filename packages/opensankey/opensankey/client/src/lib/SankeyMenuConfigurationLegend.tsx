import { SankeyData } from './types'
import { Form, FormControl, FormLabel, Row, Col} from 'react-bootstrap'
import React, {  useState } from 'react'
import { TFunction } from 'i18next'


export const OpenSankeyMenuConfigurationLegend= (
  data:SankeyData,
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  t: TFunction,
  legend_position:number[],
  set_legend_position:(n:number[])=>void
) => {
  return [
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('Menu.LegX')}</FormLabel>
      </Col>
      <Col>
        <FormControl
          type="text"
          value={legend_position[0]}
          onChange={evt => set_legend_position([+evt.target.value, legend_position[1]])}
          onBlur={() => {
            data.legend_position = legend_position
            set_data({ ...data })
          }}
        />
      </Col>
    </Form.Group>,
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel>{t('Menu.LegY')}</FormLabel>
      </Col>
      <Col>
        <FormControl
          type="text"
          value={legend_position[1]}
          onChange={evt => set_legend_position([legend_position[0], +evt.target.value])}
          onBlur={() => {
            data.legend_position = legend_position
            set_data({ ...data })
          }}
        />
      </Col>
    </Form.Group>,
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel>{t('Menu.LegWidth')}</FormLabel>
      </Col>
      <Col>
        <FormControl
          type="number"
          step={1}
          value={data.legend_width}
          onChange={evt =>{
            data.legend_width=+evt.target.value
            set_data({ ...data })
          }}
        />
      </Col>
    </Form.Group>
  ]
  
}

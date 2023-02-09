import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, } from './types'
import { Form, FormControl, FormLabel, Row, Col} from 'react-bootstrap'
import React, { FunctionComponent, useState } from 'react'
import {useTranslation} from 'react-i18next'

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any; }}
 */
const MenuConfigurationLegendPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired
}
/**
 * Description placeholder
 *
 * @typedef {MenuConfigurationLegendTypes}
 */
type MenuConfigurationLegendTypes = InferProps<typeof MenuConfigurationLegendPropTypes>

const SankeyMenuConfigurationLegend: FunctionComponent<MenuConfigurationLegendTypes> = (
  { data, set_data}
) => {
  const [legend_position, set_legend_position] = useState(data.legend_position)
  const {t} =useTranslation()

  return (
    <>
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
      </Form.Group>
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
      </Form.Group>
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
    </>
  )
}

export default SankeyMenuConfigurationLegend
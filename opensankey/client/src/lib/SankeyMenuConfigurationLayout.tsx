import React from 'react'
import {  Row, FormControl, Form, Col, FormLabel, FormCheck, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData } from './types'
import { TFunction } from 'i18next'
export const OpenSankeyMenuConfigurationLayout = (
  t:TFunction,
  data: SankeyData,
  set_data:(d:SankeyData)=>void,
  user_scale:number,
  set_user_scale:(n:number)=>void,
  legend_position:number[],
  set_legend_position:(n:number[])=>void
) => {

  return [
    <h5>{t('Menu.background')}</h5>,
    /* Couleur du fond de la page */
    <Form.Group as={Row}>
      <Col xs={7}>
        <FormLabel>{t('Menu.BgC')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'MEP.tooltips.BgC'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.BgC'}>{t('MEP.tooltips.BgC')} </Tooltip>}>
          <Form.Control
            type='color'
            value={data.couleur_fond_sankey}
            onChange={evt=>{
              // const c=evt.target.checkeds
              data.couleur_fond_sankey=evt.target.value
              set_data({...data})
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Quadrillage */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel >{t('MEP.TCG')}</FormLabel>
      </Col>
      {/* Taille de la grille */}
      <Col xs={4}>
        <OverlayTrigger
          key={'MEP.tooltips.TCG'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.TCG'}>{t('MEP.tooltips.TCG')} </Tooltip>}>
          <FormControl
            type="number"
            min={1}
            max={100}
            step={1}
            value={data.grid_square_size}
            onChange={evt => {
              data.grid_square_size = (+evt.target.value >= 1) ? +evt.target.value : 10
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
      {/* Afficher le quadrillage */}
      <Col xs={1}>
        <OverlayTrigger
          key={'MEP.tooltips.GV'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.GV'}>{t('MEP.tooltips.GV')} </Tooltip>}>
          <FormCheck
            inline
            type='switch'
            style={{marginRight: '0px', marginLeft: '-0.75em'}}
            checked={data.grid_visible}
            onChange={() => {
              data.grid_visible = !data.grid_visible
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Echelle du Sankey */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel >{t('MEP.Echelle')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'MEP.tooltips.Echelle'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.Echelle'}>{t('MEP.tooltips.Echelle')} </Tooltip>}>
          <FormControl
            type="text"
            value={user_scale}
            isInvalid={user_scale!=data.user_scale}
            onChange={evt => {
              set_user_scale(+evt.target.value)
            }}
            onBlur={() => {
              data.user_scale = user_scale
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
        <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback>
        <Form.Text>({t('MEP.vp100')})</Form.Text>
      </Col>
    </Form.Group>,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <h5>{t('Menu.Leg')}</h5>,
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
          rootClose
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
          rootClose
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
          rootClose
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
    <h6></h6>,
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
          rootClose
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

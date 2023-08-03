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
  maximum_flux:number | null | undefined,
  set_maximum_flux:(n:number)=>void,
) => {



 
  return [
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

    /* Taille maximale du flux */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel >{t('MEP.MaxFlux')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'MEP.tooltips.MaxFlux'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.MaxFlux'}>{t('MEP.tooltips.MaxFlux')} </Tooltip>}>
          <FormControl
            type="text"
            value={maximum_flux == null ? undefined : maximum_flux}
            onChange={evt => {
              set_maximum_flux(+evt.target.value)
            }}
            onBlur={() => {
              data.maximum_flux = maximum_flux
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,

   
  ]
}

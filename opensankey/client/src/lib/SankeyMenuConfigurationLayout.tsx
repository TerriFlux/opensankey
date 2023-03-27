import React from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
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
  node_hspace:number,
  set_node_hspace:(n:number)=>void,
  node_vspace:number,
  set_node_vspace:(n:number)=>void
) => {

  return [
    /* Couleur du fond de la page */
    <Form.Group as={Row}>
      <Col xs={5}>
        <FormLabel >{t('Menu.BgC')}</FormLabel>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.BgC')} </Tooltip>}>
            <Form.Control type='color' value={data.couleur_fond_sankey} onChange={evt=>{
              // const c=evt.target.checkeds
              data.couleur_fond_sankey=evt.target.value
              set_data({...data})
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Echelle du Sankey */
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('MEP.Echelle')}</FormLabel>
      </Col>
      <Col>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.Echelle')} </Tooltip>}>
            <FormControl
              type="text"
              value={user_scale}
              onChange={evt => {
                set_user_scale(+evt.target.value)
              }}
              onBlur={() => {
                data.user_scale = user_scale
                set_data({ ...data })
            }}/>
        </OverlayTrigger>
        <FormControl.Feedback />
        <Form.Text>({t('MEP.vp100')})</Form.Text>
      </Col>
    </Form.Group>,
    /* Taille maximale du flux */
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('MEP.MaxFlux')}</FormLabel>
      </Col>
      <Col>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.MaxFlux')} </Tooltip>}>
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
    /* Taille de la grille */
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel >{t('MEP.TCG')}</FormLabel>
      </Col>
      <Col xs={4}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.TCG')} </Tooltip>}>
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
      <Col >
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.GV')} </Tooltip>}>
            <FormCheck
              inline
              type='switch'
              checked={data.grid_visible}
              label={t('MEP.GV')}
              onChange={() => {
                data.grid_visible = !data.grid_visible
                set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Arranger les noeud */
    <Form.Group as={Row} >
      <Col>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.AN')} </Tooltip>}>
            <Button
              size="sm"
              onClick={() => {
                arrangeNodes(data)
                set_data({ ...data })
              }}
            >
              {t('MEP.AN')}
            </Button>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Positionner automatiquement les noeuds */
    <Form.Group as={Row} >
      <Col xs={3}>
        <FormLabel>{t('MEP.EEN')}</FormLabel>
      </Col>
      {/* Ecart horizontal  */}
      <Col xs={2}>
        <FormLabel>{t('MEP.Horizontal')}</FormLabel>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.EEN_h')} </Tooltip>}>
            <FormControl
              type="text"
              value={node_hspace}
              onChange={evt => {
                set_node_hspace(+evt.target.value)
                data.h_space = +evt.target.value
            }}/>
        </OverlayTrigger>
      </Col>
      {/* Ecart Vertical */}
      <Col xs={2}>
        <FormLabel>{t('MEP.Vertical')}</FormLabel>
      </Col>
      <Col xs={2}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.EEN_v')} </Tooltip>}>
            <FormControl
              type="text"
              value={node_vspace}
              onChange={evt => {
                set_node_vspace(+evt.target.value)
                data.v_space = +evt.target.value
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Mise en forme automatique */
    <Form.Group as={Row} >
      <Col xs={4}>
        <OverlayTrigger
          key={'tooltip-adjust'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'tooltip-adjust'}>{t('Menu.tooltips.PA')} </Tooltip>}>
            <Button
              size="sm"
              onClick={() => {
                compute_auto_sankey(data, node_hspace)
                set_data({ ...data })
              }}
            >
              {t('MEP.PA')}
            </Button>
        </OverlayTrigger>
      </Col>
    </Form.Group>
  ]
}


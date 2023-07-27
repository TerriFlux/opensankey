import React, { useState } from 'react'
import { Button, Row, FormControl, Form, Col, FormLabel, FormCheck, OverlayTrigger, Tooltip,  InputGroup } from 'react-bootstrap'
import { arrangeNodes, compute_auto_sankey } from './SankeyLayout'
import { SankeyData } from './types'
import { TFunction } from 'i18next'
import { node_visible_on_svg } from './SankeyDrawFunction'
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
  const [stretchFactorH,set_stretchFactorH]=useState(1)
  const [stretchFactorV,set_stretchFactorV]=useState(1)

  const node_visible=node_visible_on_svg()

  const applyStretch=(param:string)=>{
    const attr=param=='h'?'x':'y'
    const stretchFactor=param=='h'?stretchFactorH:stretchFactorV
    let min=Object.values(data.nodes)[0][attr]
    // Cheche la position en y du noeud le plus en haut à gauche
    Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && n.position!='relative').forEach(n=>{
      min=(n[attr]<min)?n[attr]:min
    })

    // Parcours les noeuds --> calcule le delta des position en y entre ceux-ci --> multiplie le delta par le facteur du input -->
    // applique le delta mutiplié par le facteur au noeud
    Object.values(data.nodes).filter(n=>node_visible.includes(n.idNode) && n.position!='relative').forEach(n=>{
      const delta=n[attr]-min
      n[attr]=min+(delta*stretchFactor)
    })
    set_data({...data})
  }
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
    /* Ecart horizontal  */
    <Form.Group as={Row} >
      <Col xs={7}>
        <FormLabel>{t('MEP.Horizontal')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'MEP.tooltips.EEN_h'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'tooltip-adjust'}>{t('MEP.tooltips.EEN_h')} </Tooltip>}>
          <FormControl
            type="text"
            value={node_hspace}
            onChange={evt => {
              set_node_hspace(+evt.target.value)
              data.h_space = +evt.target.value
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
    /* Ecart Vertical */
    <Form.Group as={Row}>
      <Col xs={7}>
        <FormLabel>{t('MEP.Vertical')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'MEP.tooltips.EEN_v'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.EEN_v'}>{t('MEP.tooltips.EEN_v')} </Tooltip>}>
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
    <OverlayTrigger
      key={'MEP.tooltips.factExpH'}
      placement={'top'}
      delay={500}
      rootClose
      overlay={<Tooltip id={'MEP.tooltips.factExpH'}>{t('MEP.tooltips.factExpH')} </Tooltip>}>
      <Form.Group as={Row}>
        <Col xs={7}>

          <Form.Label>
            {t('MEP.factExpH')}
          </Form.Label>
        </Col>
        <Col xs={5}>
          <InputGroup>
            <Form.Control
              type='number'
              min={0}
              step={0.1}
              value={stretchFactorH}
              onChange={evt=>{
                set_stretchFactorH(+evt.target.value)
              }}
            />
            <Button
              variant='outline-primary'
              onClick={()=>applyStretch('h')}>
              {t('MEP.stretchH')}
            </Button>
          </InputGroup>
        </Col>
      </Form.Group>
    </OverlayTrigger>,
    <OverlayTrigger
      key={'MEP.tooltips.factExpV'}
      placement={'top'}
      delay={500}
      rootClose
      overlay={<Tooltip id={'MEP.tooltips.factExpV'}>{t('MEP.tooltips.factExpV')} </Tooltip>}>
        
      <Form.Group as={Row}>
        <Col xs={7}>
          <Form.Label>
            {t('MEP.factExpV')}
          </Form.Label>
        </Col>
        <Col xs={5}>
          <InputGroup>
            <Form.Control
              type='number'
              min={0}
              step={0.1}
              value={stretchFactorV}
              onChange={evt=>{
                set_stretchFactorV(+evt.target.value)
              }}
            />
            <Button
              variant='outline-primary'
              onClick={()=>applyStretch('v')}>
              {t('MEP.stretchV')}
            </Button>
          </InputGroup>
        </Col>
      </Form.Group>
    </OverlayTrigger>,

    /* Positionnement des noeuds */
    <Form.Group as={Row}>
      { /* Mise en forme automatique */}
      <Col xs={6}>
        <OverlayTrigger
          key={'MEP.tooltips.PA'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.PA'}>{t('MEP.tooltips.PA')} </Tooltip>}>
          <Button
            size="sm"
            onClick={() => {
              compute_auto_sankey(data, node_hspace)
              set_data({ ...data })
            }}>
            {t('MEP.PA')}
          </Button>
        </OverlayTrigger>
      </Col>
      {/* Arranger les noeud */}
      <Col xs={6}>
        <OverlayTrigger
          key={'MEP.tooltips.AN'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.AN'}>{t('MEP.tooltips.AN')} </Tooltip>}>
          <Button
            size="sm"
            onClick={() => {
              arrangeNodes(data)
              set_data({ ...data })
            }}>
            {t('MEP.AN')}
          </Button>
        </OverlayTrigger>
      </Col>
    </Form.Group>,
  ]
}

import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'

import { TFunction } from 'i18next'


export const SankeyMenuConfigurationLinksAppearence = (
  data:SankeyData,
  selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  t:TFunction,
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean,
  selected_style_link:string,
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
)=>{
  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[selected_style_link]]:multi_selected_links.current

  const dashChecked = () => {
    let dashChecked = true
    selected_parameter.map(d => {
      dashChecked = (d.dashed) ? dashChecked : false
    })
    return dashChecked
  }

  const shiftCenter = () => {
    if (selected_parameter.length == 0) {
      return 0.5
    }
    const idx = selected_parameter.length-1
    const current_link = selected_parameter[idx]
    return parseFloat(((current_link.left_horiz_shift + current_link.right_horiz_shift) / 2).toPrecision(2))
  }

  const shift = () => {
    if (selected_parameter.length == 0) {
      return 0.1
    }
    const idx = selected_parameter.length-1
    const current_link = selected_parameter[idx]
    const the_shift = (current_link.right_horiz_shift - current_link.left_horiz_shift)/2
    return parseFloat(the_shift.toPrecision(2))
  }

  const linkOrientation = (param: string) => {
    let allChecked = true
    switch (param) {
    case 'hh':
      selected_parameter.map(d => {
        allChecked = (d.orientation == 'hh') ? allChecked : false
      })
      return allChecked
      break
    case 'vv':
      selected_parameter.map(d => {
        allChecked = (d.orientation == 'vv') ? allChecked : false
      })
      return allChecked
      break
    case 'hv':
      selected_parameter.map(d => {
        allChecked = (d.orientation == 'hv') ? allChecked : false
      })
      return allChecked
      break
    case 'vh':
      selected_parameter.map(d => {
        allChecked = (d.orientation == 'vh') ? allChecked : false
      })
      return allChecked
      break
    }
  }

  const courbure = () => {
    let display_courbe = true
    let courbe = 0.5
    if (selected_parameter.length != 0) {
      courbe = selected_parameter[0].curvature
    }
    selected_parameter.map((d) => {
      display_courbe = (d.curvature == courbe) ? display_courbe : false
    })
    return (display_courbe) ? courbe : 0
  }

  const linkType = (param: string) => {
    let allChecked = true
    if (selected_parameter.length != 0) {
      switch (param) {
      case 'courbe':
        selected_parameter.map(d => {
          allChecked = (d.curved) ? allChecked : false
        })
        break
      case 'arrow':
        selected_parameter.map(d => {
          allChecked = (d.arrow) ? allChecked : false
        })
        break
      case 'recycle':
        selected_parameter.map(d => {
          allChecked = (d.recycling) ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  /* Formattage de l'affichage du menu attribut de flux */
  return <Tab eventKey="flux_attributes" title={t('Flux.apparence.apparence')}>

    {/* Choix de la couleur du flux */}
    <Form >
      <Form.Group as={Row} >
        <Col xs={5}>
          <FormLabel >{t('Flux.apparence.couleur')}:</FormLabel>
        </Col>
        <Col xs={7}>
          <OverlayTrigger
            key={'Flux.apparence.tooltips.1'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.apparence.tooltips.1'}>{t('Flux.apparence.tooltips.couleur')} </Tooltip>}>
            <Form.Control
              type="color"
              value={(selected_parameter.length == 1) ? selected_parameter[0].color : '#ffffff'}
              onChange={
                evt => {
                  // selected_parameter[0].color = evt.target.value
                  const color = evt.target.value
                  selected_parameter.map(d => d.color = evt.target.value)
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => d.color = color)
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Opacité */}
      <Form.Group as={Row} >
        <Col xs={5}>
          <FormLabel >{t('Flux.apparence.opacity')}:</FormLabel>
        </Col>
        <Col xs={7}>
          <OverlayTrigger
            key={'Flux.apparence.tooltips.1'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.apparence.tooltips.1'}>{t('Flux.apparence.tooltips.opacity')} </Tooltip>}><>
              <Form.Control
                type="number"
                max={1}
                min={0}
                step={0.1}
                value={display_link_opacity}
                isInvalid={+display_link_opacity!=selected_parameter[0]?.opacity}
                onChange={
                  evt => {
                    set_display_link_opacity(evt.target.value)
                  }}
                onBlur={(evt)=>{
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => d.opacity = +evt.target.value)
                  set_data({...data})
                }}
              />
              <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback>
            </>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Flux hachuré */}
      <Form.Group as={Row} >
        <Col xs={5}>
          <FormLabel >{t('Flux.apparence.hach')}:</FormLabel>
        </Col>
        <Col xs={7}>
          <OverlayTrigger
            key={'Flux.apparence.tooltips.2'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.apparence.tooltips.2'}>{t('Flux.apparence.tooltips.hach')} </Tooltip>}>
            <Form.Check
              inline
              type="checkbox"
              checked={
                dashChecked()
              }
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => d.dashed = evt.target.checked)
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Orientation du flux */}
      <Form.Group as={Row} >
        <Col xs={4}>
          <FormLabel>{t('Flux.apparence.of')}:</FormLabel>
        </Col>

        {/* Horizontal - Horizontal  */}
        <Col xs={2}>
          <OverlayTrigger
            key={'Flux.apparence.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.apparence.tooltips.3'}>{t('Flux.apparence.tooltips.of_hh')} </Tooltip>}>
            <FormCheck
              name='orientation'
              type='checkbox'
              label='Horiz-Horiz'
              value='hh'
              checked={linkOrientation('hh')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    d.orientation = evt.target.value
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        {/* Vertical - Verticale  */}
        <Col xs={2}>
          <OverlayTrigger
            key={'Flux.apparence.tooltips.4'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.apparence.tooltips.4'}>{t('Flux.apparence.tooltips.of_vv')} </Tooltip>}>
            <FormCheck
              name='orientation'
              type='checkbox'
              label='Vert-Vert'
              value='vv'
              checked={linkOrientation('vv')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    d.orientation = evt.target.value
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        {/* Vertical - Horizontal  */}
        <Col xs={2}>
          <OverlayTrigger
            key={'Flux.apparence.tooltips.5'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.apparence.tooltips.5'}>{t('Flux.apparence.tooltips.of_vh')} </Tooltip>}>
            <FormCheck
              name='orientation'
              type='checkbox'
              label='Vert-Horiz'
              value='vh'
              checked={linkOrientation('vh')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    d.orientation = evt.target.value
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        {/* Horizontal - Vertical  */}
        <Col xs={2}>
          <OverlayTrigger
            key={'flux.apparence.tooltips.6'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.6'}>{t('Flux.apparence.tooltips.of_hv')} </Tooltip>}>
            <FormCheck
              name='orientation'
              type='checkbox'
              label='Horiz-Vert'
              value='hv'
              checked={linkOrientation('hv')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    d.orientation = evt.target.value
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Positionnement du centre du flux  */}
      <Form.Group as={Row} >
        <Col xs={5}>
          <FormLabel >{t('Flux.apparence.pdc')}</FormLabel>
        </Col>
        <Col xs={5}>
          <OverlayTrigger
            key={'flux.apparence.tooltips.7'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.7'}>{t('Flux.apparence.tooltips.pdc')} </Tooltip>}>
            <FormControl
              min={0} max={100}
              type={'number'}
              value={Math.round(shiftCenter()*100)}
              disabled={(linkOrientation('hv')||linkOrientation('vh'))}
              onChange={
                evt => {
                  const center = +evt.target.value/100
                  selected_parameter.forEach(d => {
                    let shift_gap = (d.right_horiz_shift - d.left_horiz_shift)/2
                    if (center - shift_gap < 0) {
                      shift_gap = center
                    }
                    if (center + shift_gap > 1) {
                      shift_gap = 1-center
                    }
                    d.left_horiz_shift = center - shift_gap
                    d.right_horiz_shift = center + shift_gap
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        <Col xs={2}>{shiftCenter()}</Col>
      </Form.Group>

      {/* Distance des poignée */}
      <Form.Group as={Row} >
        <Col xs={5}>
          <FormLabel >{t('Flux.apparence.eep')}</FormLabel>
        </Col>
        <Col xs={5}>
          <OverlayTrigger
            key={'flux.apparence.tooltips.8'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.8'}>{t('Flux.apparence.tooltips.eep')} </Tooltip>}>
            <FormControl
              min={0} max={50}
              type={'number'}
              value={Math.round(shift()*100)}
              disabled={(linkOrientation('hv')||linkOrientation('vh'))}
              onChange={
                evt => {
                  const shift_gap = +evt.target.value/100
                  if (shift_gap > 0.5 ) {
                    return
                  }
                  selected_parameter.forEach(d => {
                    let new_center_position = shiftCenter()
                    if (new_center_position - shift_gap < 0) {
                      new_center_position = shift_gap
                    }
                    if (new_center_position + shift_gap > 1) {
                      new_center_position = 1-shift_gap
                    }
                    d.left_horiz_shift = new_center_position - shift_gap
                    d.right_horiz_shift = new_center_position + shift_gap
                  })
                  set_data({ ...data })
                }
              }
            />
          </OverlayTrigger>
        </Col>
        <Col xs={2}>{shift()}</Col>
      </Form.Group>

      {/* Choix du type de représentation du flux  */}
      <Form.Group as={Row} >
        <Col>
          <FormLabel>{t('Flux.apparence.type')}:</FormLabel>
        </Col>
        {/* Forme courbée  */}
        <Col>
          <OverlayTrigger
            key={'flux.apparence.tooltips.9'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.9'}>{t('Flux.apparence.tooltips.courbe')} </Tooltip>}>
            <FormCheck
              type='checkbox'
              label={t('Flux.apparence.courbe')}
              checked={linkType('courbe')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => d.curved = evt.target.checked)
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        {/* Forme fleche droite  */}
        <Col>
          <OverlayTrigger
            key={'flux.apparence.tooltips.10'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.10'}>{t('Flux.apparence.tooltips.fleche')} </Tooltip>}>
            <FormCheck
              type='checkbox'
              label={t('Flux.apparence.fleche')}
              checked={linkType('arrow')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => d.arrow = evt.target.checked)
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        {/* Flux en recyclage  */}
        <Col>
          <OverlayTrigger
            key={'flux.apparence.tooltips.11'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.11'}>{t('Flux.apparence.tooltips.recy')} </Tooltip>}>
            <FormCheck
              type='checkbox'
              label={t('Flux.apparence.recy')}
              checked={linkType('recycle')}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    d.recycling = evt.target.checked
                    d.left_horiz_shift = 0
                    d.right_horiz_shift = 0
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
      </Form.Group>

      {/* Modification du rayon de courbure du flux  */}
      <Form.Group as={Row} >
        <Col xs={5}>
          <FormLabel >{t('Flux.apparence.courbure')}</FormLabel>
        </Col>
        <Col xs={5}>
          <OverlayTrigger
            key={'flux.apparence.tooltips.12'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.apparence.tooltips.12'}>{t('Flux.apparence.tooltips.courbure')} </Tooltip>}>
            <FormControl
              min={0} max={1} step={0.01}
              type={'number'}
              value={courbure()}
              onChange={
                evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    d.curvature = +evt.target.value
                  })
                  set_data({ ...data })
                }}/>
          </OverlayTrigger>
        </Col>
        <Col xs={2}>{(selected_parameter.length>0)?selected_parameter[0].curvature:0}</Col>
      </Form.Group>
      {additional_link_appearence_items}

    </Form>
  </Tab>
}

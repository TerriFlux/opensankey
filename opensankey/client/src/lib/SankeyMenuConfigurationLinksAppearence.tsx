import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'

import { TFunction } from 'i18next'
import { return_correct_link_attribute_value,assign_link_value_to_correct_var,is_all_link_attr_same_value,is_link_diplaying_value_local} from './SankeyUtils'


export const SankeyMenuConfigurationLinksAppearence = (
  data:SankeyData,
  selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  t:TFunction,
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean,
  selected_style_link:string,
  display_link_opacity:string,
  set_display_link_opacity:(s:string)=>void,
  menu_for_modal=false
)=>{
  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[selected_style_link]]:multi_selected_links.current

  // const dashChecked = () => {
  //   let dashChecked = true
  //   selected_parameter.map(d => {
  //     dashChecked = (d.dashed) ? dashChecked : false
  //   })
  //   return dashChecked
  // }
  const dashChecked=is_all_link_attr_same_value(data,selected_parameter,'dashed',menu_for_style) as boolean

  const shiftCenter = () => {
    if (selected_parameter.length == 0) {
      return 0.5
    }
    const idx = selected_parameter.length-1
    const current_link = selected_parameter[idx]
    return parseFloat((((return_correct_link_attribute_value(data,current_link,'left_horiz_shift',menu_for_style)as number) + (return_correct_link_attribute_value(data,current_link,'right_horiz_shift',menu_for_style)as number)) / 2).toPrecision(2))
  }

  const shift = () => {
    if (selected_parameter.length == 0) {
      return 0.1
    }
    const idx = selected_parameter.length-1
    const current_link = selected_parameter[idx]
    const the_shift = ((return_correct_link_attribute_value(data,current_link,'right_horiz_shift',menu_for_style)as number) - (return_correct_link_attribute_value(data,current_link,'left_horiz_shift',menu_for_style)as number))/2
    return parseFloat(the_shift.toPrecision(2))
  }

  const linkOrientation = (param: string) => {
    let allChecked = true
    switch (param) {
    case 'hh':
      selected_parameter.map(d => {
        allChecked = (return_correct_link_attribute_value(data,d,'orientation',menu_for_style) == 'hh') ? allChecked : false
      })
      return allChecked
      break
    case 'vv':
      selected_parameter.map(d => {
        allChecked = (return_correct_link_attribute_value(data,d,'orientation',menu_for_style) == 'vv') ? allChecked : false
      })
      return allChecked
      break
    case 'hv':
      selected_parameter.map(d => {
        allChecked = (return_correct_link_attribute_value(data,d,'orientation',menu_for_style) == 'hv') ? allChecked : false
      })
      return allChecked
      break
    case 'vh':
      selected_parameter.map(d => {
        allChecked = (return_correct_link_attribute_value(data,d,'orientation',menu_for_style) == 'vh') ? allChecked : false
      })
      return allChecked
      break
    }
  }

  const courbure = () => {
    let display_courbe = true
    let courbe = 0.5
    if (selected_parameter.length != 0) {
      courbe=return_correct_link_attribute_value(data,selected_parameter[0],'curvature',menu_for_style) as number
      // courbe = selected_parameter[0].curvature
    }
    selected_parameter.map((d) => {
      display_courbe = (return_correct_link_attribute_value(data,d,'curvature',menu_for_style)  == courbe) ? display_courbe : false
    })
    
    return (display_courbe) ? courbe : 0
  }

  const linkType = (param: 'recycling'|'curved'|'arrow') => {
    return is_all_link_attr_same_value(data,selected_parameter,param,menu_for_style) as boolean
  }

  const content=  <Form >
    {/* Choix de la couleur du flux */}
    <Form.Group as={Row} >
      <Col xs={5}>
        <FormLabel >{t('Flux.apparence.couleur')+(is_link_diplaying_value_local(multi_selected_links,'color',menu_for_style)?'*':'')}:</FormLabel>
      </Col>
      <Col xs={7}>
        <OverlayTrigger
          key={'Flux.apparence.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.apparence.tooltips.1'}>{t('Flux.apparence.tooltips.couleur')} </Tooltip>}>
          <Form.Control
            type="color"
            value={(selected_parameter.length == 1) ? (return_correct_link_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
            onChange={
              evt => {
                // selected_parameter[0].color = evt.target.value
                const color = evt.target.value
                // selected_parameter.map(d => d.color = evt.target.value)
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => assign_link_value_to_correct_var(d,'color',color,menu_for_style))
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Opacité */}
    <Form.Group as={Row} >
      <Col xs={5}>
        <FormLabel >{t('Flux.apparence.opacity')+(is_link_diplaying_value_local(multi_selected_links,'opacity',menu_for_style)?'*':'')}:</FormLabel>
      </Col>
      <Col xs={7}>
        <OverlayTrigger
          key={'Flux.apparence.tooltips.1'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Flux.apparence.tooltips.1'}>{t('Flux.apparence.tooltips.opacity')} </Tooltip>}><>
            <Form.Control
              type="number"
              max={1}
              min={0}
              step={0.1}
              value={display_link_opacity}
              isInvalid={selected_parameter.length>0?+display_link_opacity!=return_correct_link_attribute_value(data,selected_parameter[0],'opacity',menu_for_style):false}
              onChange={
                evt => {
                  set_display_link_opacity(evt.target.value)
                }}
              onBlur={(evt)=>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => assign_link_value_to_correct_var(d,'opacity',+evt.target.value,menu_for_style))
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
        <FormLabel >{t('Flux.apparence.hach')+(is_link_diplaying_value_local(multi_selected_links,'dashed',menu_for_style)?'*':'')}:</FormLabel>
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
              dashChecked
            }
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>assign_link_value_to_correct_var(d,'dashed',evt.target.checked,menu_for_style)
                )
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Orientation du flux */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel>{t('Flux.apparence.of')+(is_link_diplaying_value_local(multi_selected_links,'orientation',menu_for_style)?'*':'')}:</FormLabel>
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
                  // d.orientation = evt.target.value
                  assign_link_value_to_correct_var(d,'orientation',evt.target.value,menu_for_style)

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
                  // d.orientation = evt.target.value
                  assign_link_value_to_correct_var(d,'orientation',evt.target.value,menu_for_style)

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
                  // d.orientation = evt.target.value
                  assign_link_value_to_correct_var(d,'orientation',evt.target.value,menu_for_style)
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
                  // d.orientation = evt.target.value
                  assign_link_value_to_correct_var(d,'orientation',evt.target.value,menu_for_style)
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
          rootClose
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
                  let shift_gap = (Number(return_correct_link_attribute_value(data,d,'right_horiz_shift',menu_for_style)) - Number(return_correct_link_attribute_value(data,d,'left_horiz_shift',menu_for_style)))/2
                  if (center - shift_gap < 0) {
                    shift_gap = center
                  }
                  if (center + shift_gap > 1) {
                    shift_gap = 1-center
                  }
                  assign_link_value_to_correct_var(d,'left_horiz_shift',(center - shift_gap),menu_for_style)
                  assign_link_value_to_correct_var(d,'right_horiz_shift',(center + shift_gap),menu_for_style)
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
        <FormLabel >{t('Flux.apparence.eep')+(is_link_diplaying_value_local(multi_selected_links,'left_horiz_shift',menu_for_style)&&is_link_diplaying_value_local(multi_selected_links,'right_horiz_shift',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'flux.apparence.tooltips.8'}
          placement={'top'}
          delay={500}
          rootClose
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

                  assign_link_value_to_correct_var(d,'left_horiz_shift',(new_center_position - shift_gap),menu_for_style)
                  assign_link_value_to_correct_var(d,'right_horiz_shift',(new_center_position + shift_gap),menu_for_style)

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
        <FormLabel>{t('Flux.apparence.type')+(is_link_diplaying_value_local(multi_selected_links,'left_horiz_shift',menu_for_style)&&is_link_diplaying_value_local(multi_selected_links,'right_horiz_shift',menu_for_style)?'*':'')}:</FormLabel>
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
            checked={linkType('curved')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => assign_link_value_to_correct_var(d,'curved',evt.target.checked,menu_for_style))
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
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>assign_link_value_to_correct_var(d,'arrow',evt.target.checked,menu_for_style)
                )
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
            checked={linkType('recycling')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.recycling = evt.target.checked
                  // d.left_horiz_shift = 0
                  // d.right_horiz_shift = 0
                  assign_link_value_to_correct_var(d,'recycling',evt.target.checked,menu_for_style)
                  assign_link_value_to_correct_var(d,'left_horiz_shift',0,menu_for_style)
                  assign_link_value_to_correct_var(d,'right_horiz_shift',0,menu_for_style)

                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Modification du rayon de courbure du flux  */}
    <Form.Group as={Row} >
      <Col xs={5}>
        <FormLabel >{t('Flux.apparence.courbure')+(is_link_diplaying_value_local(multi_selected_links,'curvature',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'flux.apparence.tooltips.12'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'flux.apparence.tooltips.12'}>{t('Flux.apparence.tooltips.courbure')} </Tooltip>}>
          <FormControl
            min={0} max={1} step={0.01}
            type={'number'}
            value={courbure()}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.curvature = +evt.target.value
                  assign_link_value_to_correct_var(d,'curvature',+evt.target.value,menu_for_style)

                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={2}>{(selected_parameter.length>0)?return_correct_link_attribute_value(data,selected_parameter[0],'curvature',menu_for_style):0}</Col>
    </Form.Group>
    {additional_link_appearence_items}

  </Form>

  /* Formattage de l'affichage du menu attribut de flux */
  return menu_for_modal?content:<Tab eventKey="flux_attributes" title={t('Flux.apparence.apparence')}>{content}</Tab>
}

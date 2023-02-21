import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab,FormControl} from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'

import { TFunction } from 'i18next'



export const SankeyMenuConfigurationLinksAppearence = (
  data:SankeyData,
  selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  t:TFunction,

)=>{
  const center = selected_link.current.left_horiz_shift && selected_link.current.right_horiz_shift ? (selected_link.current.left_horiz_shift + selected_link.current.right_horiz_shift) / 2 : 0.5

  const gradChecked = () => {
    let gradChecked = true
    multi_selected_links.current.map(d => {
      gradChecked = (d.gradient) ? gradChecked : false
    })
    return gradChecked
  }

  const dashChecked = () => {
    let dashChecked = true
    multi_selected_links.current.map(d => {
      dashChecked = (d.dashed) ? dashChecked : false
    })
    return dashChecked
  }

  const shiftCenter = () => {
    if (multi_selected_links.current.length == 0) {
      return 0.5
    }
    const idx = multi_selected_links.current.length-1
    const current_link = multi_selected_links.current[idx]
    return parseFloat(((current_link.left_horiz_shift + current_link.right_horiz_shift) / 2).toPrecision(2))
  }
  const shift = () => {
    if (multi_selected_links.current.length == 0) {
      return 0.1
    }
    const idx = multi_selected_links.current.length-1
    const current_link = multi_selected_links.current[idx]
    const the_shift = (current_link.right_horiz_shift - current_link.left_horiz_shift)/2
    return parseFloat(the_shift.toPrecision(2))
  }
  const linkOrientation = (param: string) => {
    let allChecked = true
    switch (param) {
    case 'hh':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'hh') ? allChecked : false
      })
      return allChecked
      break
    case 'vv':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'vv') ? allChecked : false
      })
      return allChecked

      break
    case 'hv':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'hv') ? allChecked : false
      })
      return allChecked
      break
    case 'vh':
      multi_selected_links.current.map(d => {
        allChecked = (d.orientation == 'vh') ? allChecked : false
      })
      return allChecked

      break
    }

  }
  const courbure = () => {
    let display_courbe = true
    let courbe = 0.5
    if (multi_selected_links.current.length != 0) {
      courbe = multi_selected_links.current[0].curvature
    }
    multi_selected_links.current.map((d) => {
      display_courbe = (d.curvature == courbe) ? display_courbe : false
    })
    return (display_courbe) ? courbe : 0
  }
  const linkType = (param: string) => {
    let allChecked = true
    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'courbe':
        multi_selected_links.current.map(d => {
          allChecked = (d.curved) ? allChecked : false
        })
        break
      case 'arrow':
        multi_selected_links.current.map(d => {
          allChecked = (d.arrow) ? allChecked : false
        })
        break
      case 'recycle':
        multi_selected_links.current.map(d => {
          allChecked = (d.recycling) ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }
  


  return <Tab eventKey="flux_attributes" title={t('Flux.apparence.apparence')}>
    <Form >
      <Form.Group as={Row} >
        <Col>
          <FormLabel >{t('Flux.apparence.couleur')}:</FormLabel>
        </Col>
        <Col>
          <Form.Control
            type="color"
            value={(multi_selected_links.current.length == 1) ? multi_selected_links.current[0].color : '#ffffff'}
            onChange={
              evt => {
              // selected_link.current.color = evt.target.value
                const color = evt.target.value
                multi_selected_links.current.map(d => d.color = evt.target.value)
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.color = color)
                set_data({ ...data })
              }
            }
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col>
          <FormLabel >{t('Flux.apparence.grad')}:</FormLabel>
        </Col>
        <Col>
          <Form.Check
            inline
            type="checkbox"
            checked={
              gradChecked()
            }
            onChange={
              evt => {
              // selected_link.gradient = evt.target.checked
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.gradient = evt.target.checked)
                set_data({ ...data })
              }
            }
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col>
          <FormLabel >{t('Flux.apparence.hach')}:</FormLabel>
        </Col>
        <Col>
          <Form.Check
            inline
            type="checkbox"
            checked={
              dashChecked()
            }
            onChange={
              evt => {
              // selected_link.gradient = evt.target.checked
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.dashed = evt.target.checked)
                set_data({ ...data })
              }
            }
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col>
          <FormLabel>{t('Flux.apparence.of')}:</FormLabel>
        </Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col sm={3}>
          <FormCheck
          
            name='orientation'
            type='radio'
            label='Horiz-Horiz'
            value='hh'
            checked={linkOrientation('hh')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orientation = evt.target.value
                })
                set_data({ ...data })
              }
            }
          />
        </Col>
        <Col sm={3}>

          <FormCheck
          
            name='orientation'
            type='radio'
            label='Vert-Vert'
            value='vv'
            checked={linkOrientation('vv')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orientation = evt.target.value
                })
                set_data({ ...data })
              }
            }
          />
        </Col>
        <Col sm={3}>

          <FormCheck
          
            name='orientation'
            type='radio'
            label='Vert-Horiz'
            value='vh'
            checked={linkOrientation('vh')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orientation = evt.target.value
                })
                set_data({ ...data })
              }
            }
          />
        </Col>
        <Col sm={3}>
          <FormCheck
            name='orientation'
            type='radio'
            label='Horiz-Vert'
            value='hv'
            checked={linkOrientation('hv')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orientation = evt.target.value
                })
                set_data({ ...data })
              }
            }
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} >
        <Col>
          <FormLabel >{t('Flux.apparence.pdc')}</FormLabel>
        </Col>
        <Col>
      
          <FormControl
            min={0} max={100}
            type={'number'}
            value={shiftCenter()*100}
            disabled={(linkOrientation('hv')||linkOrientation('vh'))}
            onChange={
              evt => {
                const center = +evt.target.value/100
                multi_selected_links.current.forEach(d => {
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
              }
            } />
        </Col>
        <Col sm={2}>{shiftCenter()}</Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col>
          <FormLabel >{t('Flux.apparence.eep')}</FormLabel>
        </Col>
        <Col>
        

          <FormControl
            min={0} max={5} 
            type={'number'}
            value={shift()*100}
            disabled={(linkOrientation('hv')||linkOrientation('vh'))}
            onChange={
              evt => {
                const shift_gap = +evt.target.value/100
                if (shift_gap > 0.5 ) {
                  return
                }
                multi_selected_links.current.forEach(d => {
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
            } />
        </Col>
        <Col sm={2}>{shift()}</Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col>
          <FormLabel>{t('Flux.apparence.type')}:</FormLabel>
        </Col>
        <Col>
          <FormCheck
            type='checkbox'
            label={t('Flux.apparence.courbe')}
            checked={linkType('courbe')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.curved = evt.target.checked)

                set_data({ ...data })
              }
            }
          />
        </Col>
        <Col>
          <FormCheck
            type='checkbox'
            label={t('Flux.apparence.fleche')}
            checked={linkType('arrow')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.arrow = evt.target.checked)
                set_data({ ...data })
              }
            }
          />
        </Col>
        <Col>
          <FormCheck
            type='checkbox'
            label={t('Flux.apparence.recy')}
            checked={linkType('recycle')}
            onChange={
              evt => {

                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.recycling = evt.target.checked
                  d.left_horiz_shift = 0
                  d.right_horiz_shift = 0
                })


                set_data({ ...data })
              }
            }
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} >
        <Col>
          <FormLabel >{t('Flux.apparence.courbure')}</FormLabel>
        </Col>
      
        <Col>
          <FormControl

            min={0} max={1} step={0.01}
            type={'number'}
            value={courbure()}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.curvature = +evt.target.value
                })

                set_data({ ...data })
              }
            } />
        </Col>
        <Col sm={2}>{selected_link.current.curvature}</Col>
      </Form.Group>
  
    </Form>
  </Tab>
}

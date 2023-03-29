import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap'
import { SankeyData, SankeyLink, } from './types'
import {TFunction} from 'i18next'

export const SankeyMenuConfigurationLinksLabel = (
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  t:TFunction,
)=>{

  const linkLabelColor = (param: string) => {
    let allChecked = true

    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'white':
        multi_selected_links.current.map(d => {
          allChecked = (d.text_color == 'white') ? allChecked : false
        })
        break
      case 'black':
        multi_selected_links.current.map(d => {
          allChecked = (d.text_color == 'black') ? allChecked : false
        })
        break
      case 'color':
        multi_selected_links.current.map(d => {
          allChecked = (d.text_color == d.color) ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (multi_selected_links.current.length != 0) {
      size = multi_selected_links.current[0].label_font_size
    }
    multi_selected_links.current.map((d) => {
      display_size = (d.label_font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const labelPositionVert = (param: string) => {
    let allChecked = true
    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'beginning':
        multi_selected_links.current.map(d => {
          allChecked = (d.label_position == 'beginning') ? allChecked : false
        })
        break
      case 'middle':
        multi_selected_links.current.map(d => {
          allChecked = (d.label_position == 'middle') ? allChecked : false
        })
        break
      case 'end':
        multi_selected_links.current.map(d => {
          allChecked = (d.label_position == 'end') ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  const labelSticktoLinkDisabled = () => {
    let labelSticktoLink = false
    multi_selected_links.current.map(d => {
      labelSticktoLink = (d.label_on_path) ? true : labelSticktoLink
    })
    return labelSticktoLink
  }

  const labelLinkFree = () => {
    let labelLinkFree = false
    multi_selected_links.current.map(d => {
      labelLinkFree = (d.label_position === 'frozen'&& d.orthogonal_label_position === 'frozen') ? true : labelLinkFree
    })
    return labelLinkFree
  }

  const labelPositionOrtho = (param: string) => {
    let allChecked = true
    if (multi_selected_links.current.length != 0) {
      switch (param) {
      case 'above':
        multi_selected_links.current.map(d => {
          allChecked = (d.orthogonal_label_position == 'above') ? allChecked : false
        })
        break
      case 'middle':
        multi_selected_links.current.map(d => {
          allChecked = (d.orthogonal_label_position == 'middle') ? allChecked : false
        })
        break
      case 'below':
        multi_selected_links.current.map(d => {
          allChecked = (d.orthogonal_label_position == 'below') ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  const labelVisibleChecked = () => {
    let labelVisibleChecked = true
    multi_selected_links.current.map(d => {
      labelVisibleChecked = (d.label_visible) ? labelVisibleChecked : false
    })
    return labelVisibleChecked
  }


  return <Tab eventKey="label" title={t('Flux.label.label')}>
    {/* Display label  */}
    <Form.Group as={Row}>
      <Col xs={2}>
        <OverlayTrigger
          key={'flux.label.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.1'}>{t('Flux.label.tooltips.label')} </Tooltip>}>
          <FormCheck
            type='switch'
            checked={labelVisibleChecked()}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.label_visible = evt.target.checked
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={10}>
        <Form.Label>{t('Flux.label.vdb')}</Form.Label>
      </Col>
    </Form.Group>

    {/* Couleur des Labels  */}
    <Form.Group as={Row} >
      {/* Label en noir  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.2'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.2'}>{t('Flux.label.tooltips.len')} </Tooltip>}>
          <FormCheck
            value='black'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.len')}
            checked={linkLabelColor('black')}
            onChange={
              (evt) => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.text_color = evt.target.value
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>

      {/* Label en blanc  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.3'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.3'}>{t('Flux.label.tooltips.lb')} </Tooltip>}>
          <FormCheck
            value='white'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.lb')}
            checked={linkLabelColor('white')}
            onChange={
              (evt) => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.text_color = evt.target.value
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>

      {/* Label en couleur  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.4'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.4'}>{t('Flux.label.tooltips.lec')} </Tooltip>}>
          <FormCheck
            value='same_color'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.lec')}
            checked={linkLabelColor('color')}
            onChange={
              () => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.text_color = d.color
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Taille de la police  */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}</FormLabel>
      </Col>
      <Col xs={5}>
        <FormControl
          min={11}
          type={'number'}
          disabled={!labelVisibleChecked()}
          value={allNodeLabelFontSize()}
          onChange={evt => {
            Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.label_font_size = +evt.target.value)
            set_data({ ...data })
          }}
        />
      </Col>
      <Col style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}}>px</Col>
    </Form.Group>

    {/* Orienter le texte du label le long du flux  */}
    <Form.Group as={Row}>
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.5'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.5'}>{t('Flux.label.tooltips.acf')} </Tooltip>}>
          <FormCheck
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.acf')}
            // disabled={selected_link.current.label_position === 'frozen'}
            checked={labelSticktoLinkDisabled()}
            onClick={()=>{
              const val=labelSticktoLinkDisabled()
              Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                d.label_on_path = !val
                if(!val){
                  d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                  d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                }
              })
              set_data({ ...data })
            }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Positionnement lateral des label */}
    <Form.Group as={Row} >
      <Col>
        <FormLabel style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}}>{t('Flux.label.pl')}:</FormLabel>
      </Col>
      {/* Vers le début  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.6'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.6'}>{t('Flux.label.tooltips.deb')} </Tooltip>}>
          <Form.Check
            value='beginning'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.deb')}
            checked={labelPositionVert('beginning')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.label_position = evt.target.value
                  d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>

      {/* Vers le milieu  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.7'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.7'}>{t('Flux.label.tooltips.milieu_h')} </Tooltip>}>
          <Form.Check
            value='middle'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.milieu')}
            checked={labelPositionVert('middle')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.label_position = evt.target.value
                  d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>

      {/* Vers la fin du flux  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.8'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.8'}>{t('Flux.label.tooltips.fin')} </Tooltip>}>
          <Form.Check
            value='end'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.fin')}
            checked={labelPositionVert('end')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.label_position = evt.target.value
                  d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Positionnement vertical des label  */}
    <Form.Group as={Row} >
      <Col>
        <FormLabel style={{color:(labelVisibleChecked())?'#555555':'#DADADA'}}>{t('Flux.label.po')}:</FormLabel>
      </Col>
      {/* Positionnement au dessous  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.9'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.9'}>{t('Flux.label.tooltips.dessous')} </Tooltip>}>
          <Form.Check
            value='below'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.dessous')}
            checked={labelPositionOrtho('below')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orthogonal_label_position = evt.target.value
                  d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      {/* Positionnement au milieu  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.10'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.10'}>{t('Flux.label.tooltips.milieu_v')} </Tooltip>}>
          <Form.Check
            value='middle'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.milieu')}
            checked={labelPositionOrtho('middle')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orthogonal_label_position = evt.target.value
                  d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      {/* Positionnement au dessus  */}
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.11'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.11'}>{t('Flux.label.tooltips.dessus')} </Tooltip>}>
          <Form.Check
            value='above'
            disabled={!labelVisibleChecked()}
            type='radio'
            label={t('Flux.label.dessus')}
            checked={labelPositionOrtho('above')}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.orthogonal_label_position = evt.target.value
                  d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Positionnement à la souris  */}
    <Form.Group as={Row}>
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.12'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.12'}>{t('Flux.label.tooltips.pls')} </Tooltip>}>
          <FormCheck
            disabled={!labelVisibleChecked()}
            type='checkbox'
            label={t('Flux.label.pls')}
            // disabled={selected_link.current.label_position === 'frozen'}
            checked={labelLinkFree()}
            onChange={
              evt => {
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  d.label_on_path = (evt.target.checked)?false:d.label_on_path
                  d.label_position=(evt.target.checked)?'frozen':'middle'
                  d.orthogonal_label_position=(evt.target.checked)?'frozen':'middle'
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>
  </Tab>
}

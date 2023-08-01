import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab, FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap'
import { SankeyData, SankeyLink, } from './types'
import {TFunction} from 'i18next'
import { return_correct_link_attribute_value,assign_link_value_to_correct_var,is_all_link_attr_same_value,is_link_diplaying_value_local, return_value_link} from './SankeyUtils'

export const SankeyMenuConfigurationLinksLabel = (
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  t:TFunction,
  menu_for_style:boolean,
  selected_style_link:string,
  menu_for_modal=false
)=>{
  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[selected_style_link]]:multi_selected_links.current

  const linkLabelColor = (param: string) => {
    let allChecked = true

    if (selected_parameter.length != 0) {
      switch (param) {
      case 'white':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'text_color',menu_for_style) == 'white') ? allChecked : false
        })
        break
      case 'black':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'text_color',menu_for_style) == 'black') ? allChecked : false
        })
        break
      case 'color':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'text_color',menu_for_style) == return_correct_link_attribute_value(data,d,'color',menu_for_style)) ? allChecked : false
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
    if (selected_parameter.length != 0) {
      size = return_correct_link_attribute_value(data,selected_parameter[0],'label_font_size',menu_for_style) as number
    }
    selected_parameter.map((d) => {
      display_size = ((return_correct_link_attribute_value(data,d,'label_font_size',menu_for_style) as number) == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const labelPositionVert = (param: string) => {
    let allChecked = true
    if (selected_parameter.length != 0) {
      switch (param) {
      case 'beginning':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'label_position',menu_for_style)== 'beginning') ? allChecked : false
        })
        break
      case 'middle':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'label_position',menu_for_style) == 'middle') ? allChecked : false
        })
        break
      case 'end':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'label_position',menu_for_style) == 'end') ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  // const labelSticktoLinkDisabled = () => {
  //   let labelSticktoLink = false
  //   selected_parameter.map(d => {
  //     labelSticktoLink = (d.label_on_path) ? true : labelSticktoLink
  //   })
  //   return labelSticktoLink
  // }
  const labelSticktoLinkDisabled= is_all_link_attr_same_value(data,selected_parameter,'label_on_path',menu_for_style) as boolean


  const labelLinkFree = () => {
    let labelLinkFree = false
    selected_parameter.map(d => {
      labelLinkFree = (return_correct_link_attribute_value(data,d,'label_position',menu_for_style) === 'frozen'&& (return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style)) === 'frozen') ? true : labelLinkFree
    })
    return labelLinkFree
  }
  // return_correct_link_attribute_value(data,d,'frozen',menu_for_style)
  const labelPositionOrtho = (param: string) => {
    let allChecked = true
    if (selected_parameter.length != 0) {
      switch (param) {
      case 'above':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style) == 'above') ? allChecked : false
        })
        break
      case 'middle':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style) == 'middle') ? allChecked : false
        })
        break
      case 'below':
        selected_parameter.map(d => {
          allChecked = (return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style) == 'below') ? allChecked : false
        })
        break
      }
      return allChecked
    } else {
      return false
    }
  }

  const isAllLinkToPrecision=()=>{
    let toPrecision = true
    selected_parameter.map(d => {
      toPrecision =(return_correct_link_attribute_value(data,d,'to_precision',menu_for_style)) ? toPrecision : false
    })
    return toPrecision
  }

  const allLinkLabelScientificPrecision = () => {
    let display_size = true
    let size = 0
    if (selected_parameter.length != 0) {
      size = return_correct_link_attribute_value(data,selected_parameter[0],'scientific_precision',menu_for_style) as number
    }
    selected_parameter.map((d) => {
      display_size = ((return_correct_link_attribute_value(data,d,'scientific_precision',menu_for_style) as number) == size) ? display_size : false
    })
    return (display_size) ? size : 0
  }

  const labelVisibleChecked=is_all_link_attr_same_value(data,selected_parameter,'label_visible',menu_for_style) as boolean

  const content=<>
    {/* Display label  */}
    <Form.Group as={Row}>
      <Col xs={2}>
        <OverlayTrigger
          key={'flux.label.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.1'}>{t('Flux.label.tooltips.label')} </Tooltip>}>
          <FormCheck
            inline
            type='switch'
            checked={labelVisibleChecked}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.label_visible = evt.target.checked
                  assign_link_value_to_correct_var(d,'label_visible',evt.target.checked,menu_for_style)
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={10}>
        <Form.Label>{t('Flux.label.vdb')}</Form.Label>
      </Col>
    </Form.Group>

    {/* Choix d'affichage en notation scientifique  */}
    <Form.Group as={Row}>
      <Col xs={2}>
        <OverlayTrigger
          key={'flux.label.tooltips.13'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.13'}>{t('Flux.label.tooltips.toPrecision')} </Tooltip>}>
          <FormCheck
            inline
            type='switch'
            checked={isAllLinkToPrecision()}
            onChange={evt=>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d =>assign_link_value_to_correct_var(d,'to_precision',evt.target.checked,menu_for_style))
              set_data({...data})
            }}/>
        </OverlayTrigger>
      </Col>
      <Col xs={10}>
        <Form.Label >{t('Flux.label.toPrecision')}</Form.Label>
      </Col>
    </Form.Group>

    {/* Choose number of scientific number */}
    <Form.Group as={Row}>
      <Col xs={4}>
        <Form.Label >{t('Flux.label.NbPrecision')}</Form.Label>
      </Col>
      <Col xs={5}>
        <OverlayTrigger
          key={'flux.label.tooltips.14'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.14'}>{t('Flux.label.tooltips.NbPrecision')} </Tooltip>}>
          <Form.Control
            type='number'
            min={1}
            step={1}
            disabled={!isAllLinkToPrecision()}
            value={allLinkLabelScientificPrecision()}
            onChange={evt=>{
              const value=+evt.target.value
              const val=isNaN(value) || value<=0?5:Math.round(value)
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d =>assign_link_value_to_correct_var(d,'scientific_precision',val,menu_for_style))
              set_data({...data})
            }}/>
        </OverlayTrigger>
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.len')+(is_link_diplaying_value_local(multi_selected_links,'text_color',menu_for_style)?'*':'')}
            checked={linkLabelColor('black')}
            onChange={
              (evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.text_color = evt.target.value
                  assign_link_value_to_correct_var(d,'text_color',evt.target.value,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.lb')+(is_link_diplaying_value_local(multi_selected_links,'text_color',menu_for_style)?'*':'')}
            checked={linkLabelColor('white')}
            onChange={
              (evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.text_color = evt.target.value
                  assign_link_value_to_correct_var(d,'text_color',evt.target.value,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.lec')+(is_link_diplaying_value_local(multi_selected_links,'text_color',menu_for_style)?'*':'')}
            checked={linkLabelColor('color')}
            onChange={
              () => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.text_color = d.color
                  assign_link_value_to_correct_var(d,'text_color',return_value_link(data,d,'color'),menu_for_style)
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Taille de la police  */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel style={{color:(labelVisibleChecked)?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')+(is_link_diplaying_value_local(multi_selected_links,'label_font_size',menu_for_style)?'*':'')}</FormLabel>
      </Col>
      <Col xs={5}>
        <FormControl
          min={11}
          type={'number'}
          disabled={!labelVisibleChecked}
          value={allNodeLabelFontSize()}
          onChange={evt => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>{
              //  d.label_font_size = +evt.target.value
              assign_link_value_to_correct_var(d,'label_font_size',+evt.target.value,menu_for_style)
            })
            set_data({ ...data })
          }}
        />
      </Col>
      <Col style={{color:(labelVisibleChecked)?'#555555':'#DADADA'}}>px</Col>
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.acf')+(is_link_diplaying_value_local(multi_selected_links,'label_on_path',menu_for_style)?'*':'')}
            // disabled={selected_link.current.label_position === 'frozen'}
            checked={labelSticktoLinkDisabled}
            onClick={()=>{
              const val=labelSticktoLinkDisabled
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                // d.label_on_path = !val
                assign_link_value_to_correct_var(d,'label_on_path',!val,menu_for_style)

                if(!val){
                  // d.label_position=(d.label_position=='frozen')?'middle':d.label_position
                  // d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position

                  const l_pos=return_value_link(data,d,'label_position')
                  const l_orth_pos=return_value_link(data,d,'orthogonal_label_position')
                  assign_link_value_to_correct_var(d,'label_position',(l_pos=='frozen')?'middle':l_pos,menu_for_style)
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',(l_orth_pos=='frozen')?'middle':l_orth_pos,menu_for_style)

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
        <FormLabel style={{color:(labelVisibleChecked)?'#555555':'#DADADA'}}>{t('Flux.label.pl')+(is_link_diplaying_value_local(multi_selected_links,'label_position',menu_for_style)?'*':'')}:</FormLabel>
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.deb')}
            checked={labelPositionVert('beginning')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.label_position = evt.target.value
                  // d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position

                  const orth_pos=return_value_link(data,d,'orthogonal_label_position')
                  assign_link_value_to_correct_var(d,'label_position',evt.target.value,menu_for_style)
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.milieu')}
            checked={labelPositionVert('middle')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.label_position = evt.target.value
                  // d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position

                  const orth_pos=return_value_link(data,d,'orthogonal_label_position')
                  assign_link_value_to_correct_var(d,'label_position',evt.target.value,menu_for_style)
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.fin')}
            checked={labelPositionVert('end')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.label_position = evt.target.value
                  // d.orthogonal_label_position=(d.orthogonal_label_position=='frozen')?'middle':d.orthogonal_label_position

                  const orth_pos=return_value_link(data,d,'orthogonal_label_position')
                  assign_link_value_to_correct_var(d,'label_position',evt.target.value,menu_for_style)
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>

    {/* Positionnement vertical des label  */}
    <Form.Group as={Row} >
      <Col>
        <FormLabel style={{color:(labelVisibleChecked)?'#555555':'#DADADA'}}>{t('Flux.label.po')+(is_link_diplaying_value_local(multi_selected_links,'orthogonal_label_position',menu_for_style)?'*':'')}:</FormLabel>
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.dessous')}
            checked={labelPositionOrtho('below')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.orthogonal_label_position = evt.target.value
                  // d.label_position=(d.label_position=='frozen')?'middle':d.label_position

                  const lab_pos=return_value_link(data,d,'label_position')
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',evt.target.value,menu_for_style)
                  assign_link_value_to_correct_var(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.milieu')}
            checked={labelPositionOrtho('middle')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.orthogonal_label_position = evt.target.value
                  // d.label_position=(d.label_position=='frozen')?'middle':d.label_position

                  const lab_pos=return_value_link(data,d,'label_position')
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',evt.target.value,menu_for_style)
                  assign_link_value_to_correct_var(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='radio'
            label={t('Flux.label.dessus')}
            checked={labelPositionOrtho('above')}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.orthogonal_label_position = evt.target.value
                  // d.label_position=(d.label_position=='frozen')?'middle':d.label_position

                  const lab_pos=return_value_link(data,d,'label_position')
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',evt.target.value,menu_for_style)
                  assign_link_value_to_correct_var(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
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
            disabled={!labelVisibleChecked}
            type='checkbox'
            label={t('Flux.label.pls')+(is_link_diplaying_value_local(multi_selected_links,'label_position',menu_for_style)?'*':'')}
            // disabled={selected_link.current.label_position === 'frozen'}
            checked={labelLinkFree()}
            onChange={
              evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  // d.label_on_path = (evt.target.checked)?false:d.label_on_path
                  // d.label_position=(evt.target.checked)?'frozen':'middle'
                  // d.orthogonal_label_position=(evt.target.checked)?'frozen':'middle'


                  const l_o_p=return_value_link(data,d,'label_on_path')
                  assign_link_value_to_correct_var(d,'label_on_path',((evt.target.checked)?false:l_o_p),menu_for_style)
                  assign_link_value_to_correct_var(d,'label_position',(evt.target.checked)?'frozen':'middle',menu_for_style)
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',(evt.target.checked)?'frozen':'middle',menu_for_style)
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Form.Group>
  </>

  return menu_for_modal?content:<Tab eventKey="label" title={t('Flux.label.label')}>{content}</Tab>
}

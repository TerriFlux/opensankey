import React,{useState} from 'react'
import { Row, Form, Tab, FormControl, OverlayTrigger, Tooltip, InputGroup, Button, ButtonGroup, Dropdown} from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'

import { TFunction } from 'i18next'
import { return_correct_link_attribute_value,assign_link_value_to_correct_var,is_all_link_attr_same_value,is_link_diplaying_value_local,cut_name} from './SankeyUtils'
import { FaEye, FaEyeSlash,FaCheck, FaAlignLeft,FaAlignCenter,FaAlignRight} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

export const SankeyMenuConfigurationLinksAppearence = (
  data:SankeyData,
  // // selected_link:{current:SankeyLink},
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
  const [, set_style_to_apply_to_link] = useState('default')

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
    }
    selected_parameter.map((d) => {
      display_courbe = (return_correct_link_attribute_value(data,d,'curvature',menu_for_style)  == courbe) ? display_courbe : false
    })

    return (display_courbe) ? courbe : 0
  }

  const arrow_size = () => {
    let display_arrow_size = true
    let courbe = 10
    if (selected_parameter.length != 0) {
      courbe=return_correct_link_attribute_value(data,selected_parameter[0],'arrow_size',menu_for_style) as number
    }
    selected_parameter.map((d) => {
      display_arrow_size = (return_correct_link_attribute_value(data,d,'arrow_size',menu_for_style)  == courbe) ? display_arrow_size : false
    })

    return (display_arrow_size) ? courbe : 0
  }

  const linkType = (param: 'recycling'|'curved'|'arrow') => {
    return is_all_link_attr_same_value(data,selected_parameter,param,menu_for_style) as boolean
  }

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

  const labelSticktoLinkDisabled= is_all_link_attr_same_value(data,selected_parameter,'label_on_path',menu_for_style) as boolean

  const labelLinkFree = () => {
    let labelLinkFree = false
    selected_parameter.map(d => {
      labelLinkFree = (return_correct_link_attribute_value(data,d,'label_position',menu_for_style) === 'frozen'&& (return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style)) === 'frozen') ? true : labelLinkFree
    })
    return labelLinkFree
  }

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

  const apply_style_to_selected_links = () => {
    multi_selected_links.current.map(d => {
      delete d.local
    })
  }

  const isAllLabelUnitVisible =is_all_link_attr_same_value(data,selected_parameter,'label_unit_visible',menu_for_style) as boolean

  //Change le style des flux sélectionnés
  const style_of_selected_links = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_links.current.length != 0) {
      style_to_display = multi_selected_links.current[0].style
      let inchangee = true
      multi_selected_links.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_link[style_to_display].idLink, 25) : 'Multiple style parmi les noeuds sélectionnés'
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  const labelVisibleChecked=is_all_link_attr_same_value(data,selected_parameter,'label_visible',menu_for_style) as boolean
  const allLinkFF=is_all_link_attr_same_value(data,selected_parameter,'font_family',menu_for_style) as boolean
  const label_link_free_checked=labelLinkFree()

  const svg_label_top=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_bottom=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
  const svg_label_center=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z"/></svg>

  const content_appearence = <Form >

    {/* Choix de la couleur du flux */}
    <InputGroup >
      <InputGroup.Text style={{width:'40%'}}>
        {t('Flux.apparence.couleur')+(is_link_diplaying_value_local(multi_selected_links,'color',menu_for_style)?'*':'')}
      </InputGroup.Text>
      <Form.Label for="form_color_link" style={{width:'60%',
        'background':(selected_parameter.length == 1) ? (return_correct_link_attribute_value(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff',
        border:'1px solid #ced4da',
        borderTopRightRadius:'4px',
        borderBottomRightRadius:'4px',
      }}/>
      <OverlayTrigger
        key={'Flux.apparence.tooltips.1'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Flux.apparence.tooltips.1'}>{t('Flux.apparence.tooltips.couleur')} </Tooltip>}>
        <Form.Control
          type="color"
          id='form_color_link'
          name='form_color_link'
          style={{display:'none'}}
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
    </InputGroup>

    {/* Opacité */}
    <InputGroup >
      <InputGroup.Text style={{width:'40%'}} >{t('Flux.apparence.opacity')+(is_link_diplaying_value_local(multi_selected_links,'opacity',menu_for_style)?'*':'')}</InputGroup.Text>
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
    </InputGroup>

    {/* Flux hachuré */}
    <InputGroup >
      <InputGroup.Text style={{width:'40%'}}>{t('Flux.apparence.hach')+(is_link_diplaying_value_local(multi_selected_links,'dashed',menu_for_style)?'*':'')}</InputGroup.Text>
      <OverlayTrigger
        key={'Flux.apparence.tooltips.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Flux.apparence.tooltips.2'}>{t('Flux.apparence.tooltips.hach')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'60%'}}
          //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
          variant={dashChecked?'primary':'outline-primary'}
          onClick={() => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => assign_link_value_to_correct_var(d,'dashed',!dashChecked,menu_for_style))
            set_data({ ...data })
          }}>{dashChecked?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
      </OverlayTrigger>
    </InputGroup>

    {/* Orientation du flux */}
    <InputGroup >
      <InputGroup.Text style={{width:'40%'}}>
        {t('Flux.apparence.of')+(is_link_diplaying_value_local(multi_selected_links,'orientation',menu_for_style)?'*':'')}
      </InputGroup.Text>

      {/* Horizontal - Horizontal  */}
      <OverlayTrigger
        key={'Flux.apparence.tooltips.3'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Flux.apparence.tooltips.3'}>{t('Flux.apparence.tooltips.of_hh')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'15%'}}
          value='hh'
          variant={linkOrientation('hh')?'primary':'outline-primary'}
          onClick={
            () =>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                // d.orientation = evt.target.value
                assign_link_value_to_correct_var(d,'orientation','hh',menu_for_style)

              })
              set_data({ ...data })
            }}>Horiz-Horiz</Button>
      </OverlayTrigger>

      {/* Vertical - Verticale  */}
      <OverlayTrigger
        key={'Flux.apparence.tooltips.4'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Flux.apparence.tooltips.4'}>{t('Flux.apparence.tooltips.of_vv')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'15%'}}
          value='vv'
          variant={linkOrientation('vv')?'primary':'outline-primary'}
          onClick={
            () =>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'orientation','vv',menu_for_style)
              })
              set_data({ ...data })
            }}>Vert-Vert</Button>
      </OverlayTrigger>

      {/* Vertical - Horizontal  */}
      <OverlayTrigger
        key={'Flux.apparence.tooltips.5'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Flux.apparence.tooltips.5'}>{t('Flux.apparence.tooltips.of_vh')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'15%'}}
          value='vh'
          variant={linkOrientation('vh')?'primary':'outline-primary'}
          onClick={
            () =>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'orientation','vh',menu_for_style)
              })
              set_data({ ...data })
            }}>Vert-Horiz</Button>
      </OverlayTrigger>

      {/* Horizontal - Vertical  */}
      <OverlayTrigger
        key={'flux.apparence.tooltips.6'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.apparence.tooltips.6'}>{t('Flux.apparence.tooltips.of_hv')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'15%'}}
          value='hv'
          variant={linkOrientation('hv')?'primary':'outline-primary'}
          onClick={
            () =>{
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'orientation','hv',menu_for_style)
              })
              set_data({ ...data })
            }}>Horiz-Vert</Button>
      </OverlayTrigger>
    </InputGroup>

    {/* Positionnement du centre du flux  */}
    <InputGroup >
      <InputGroup.Text style={{width:'70%'}}>
        {t('Flux.apparence.pdc')}
      </InputGroup.Text>

      <OverlayTrigger
        key={'flux.apparence.tooltips.7'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'flux.apparence.tooltips.7'}>{t('Flux.apparence.tooltips.pdc')} </Tooltip>}>
        <FormControl
          style={{width:'30%'}}
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
    </InputGroup>

    {/* Distance des poignée */}
    <InputGroup >
      <InputGroup.Text style={{width:'70%'}}>
        {t('Flux.apparence.eep')+(is_link_diplaying_value_local(multi_selected_links,'left_horiz_shift',menu_for_style)&&is_link_diplaying_value_local(multi_selected_links,'right_horiz_shift',menu_for_style)?'*':'')}
      </InputGroup.Text>

      <OverlayTrigger
        key={'flux.apparence.tooltips.8'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'flux.apparence.tooltips.8'}>{t('Flux.apparence.tooltips.eep')} </Tooltip>}>
        <FormControl
          style={{width:'30%'}}
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
    </InputGroup>

    {/* Choix du type de représentation du flux  */}
    <InputGroup >
      <InputGroup.Text style={{width:'40%'}}>
        {t('Flux.apparence.type')+(is_link_diplaying_value_local(multi_selected_links,'left_horiz_shift',menu_for_style)&&is_link_diplaying_value_local(multi_selected_links,'right_horiz_shift',menu_for_style)?'*':'')}
      </InputGroup.Text>

      {/* Forme courbée  */}
      <OverlayTrigger
        key={'flux.apparence.tooltips.9'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.apparence.tooltips.9'}>{t('Flux.apparence.tooltips.courbe')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'20%'}}
          variant={linkType('curved')?'primary':'outline-primary'}
          onClick={
            () => {
              const val=linkType('curved')
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => assign_link_value_to_correct_var(d,'curved',!val,menu_for_style))
              set_data({ ...data })
            }}>{t('Flux.apparence.courbe')}</Button>
      </OverlayTrigger>

      {/* Forme fleche droite  */}
      <OverlayTrigger
        key={'flux.apparence.tooltips.10'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.apparence.tooltips.10'}>{t('Flux.apparence.tooltips.fleche')} </Tooltip>}>
        <Button
          style={{width:'20%'}}
          className='btn_menu_config'
          variant={linkType('arrow')?'primary':'outline-primary'}
          onClick={
            () => {
              const val=linkType('arrow')
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>assign_link_value_to_correct_var(d,'arrow',!val,menu_for_style)
              )
              set_data({ ...data })
            }}>{t('Flux.apparence.fleche')}</Button>
      </OverlayTrigger>

      {/* Flux en recyclage  */}
      <OverlayTrigger
        key={'flux.apparence.tooltips.11'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.apparence.tooltips.11'}>{t('Flux.apparence.tooltips.recy')} </Tooltip>}>
        <Button
          style={{width:'20%'}}
          className='btn_menu_config'
          variant={linkType('recycling')?'primary':'outline-primary'}
          onClick={
            () => {
              const val=linkType('recycling')
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'recycling',!val,menu_for_style)
                assign_link_value_to_correct_var(d,'left_horiz_shift',0,menu_for_style)
                assign_link_value_to_correct_var(d,'right_horiz_shift',0,menu_for_style)

              })
              set_data({ ...data })
            }}>{t('Flux.apparence.recy')}</Button>
      </OverlayTrigger>
    </InputGroup>

    {/* Modification du rayon de courbure du flux  */}
    <InputGroup >
      <InputGroup.Text style={{width:'40%'}}>{t('Flux.apparence.courbure')+(is_link_diplaying_value_local(multi_selected_links,'curvature',menu_for_style)?'*':'')}</InputGroup.Text>
      <OverlayTrigger
        key={'flux.apparence.tooltips.12'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'flux.apparence.tooltips.12'}>{t('Flux.apparence.tooltips.courbure')} </Tooltip>}>
        <FormControl
          style={{width:'60%'}}
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
    </InputGroup>

    <InputGroup >
      <InputGroup.Text style={{width:'40%'}}>
        {t('Flux.apparence.arrow_size')+(is_link_diplaying_value_local(multi_selected_links,'arrow_size',menu_for_style)?'*':'')}
      </InputGroup.Text>

      <OverlayTrigger
        key={'flux.apparence.tooltips.13'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'flux.apparence.tooltips.13'}>{t('Flux.apparence.tooltips.arrow_size')} </Tooltip>}>
        <FormControl
          style={{width:'60%'}}
          min={1}  step={1}
          type={'number'}
          value={arrow_size()}
          onChange={
            evt => {
              const val=+evt.target.value
              const value=isNaN(val) || val<=0?10:val
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'arrow_size',value,menu_for_style)

              })
              set_data({ ...data })
            }}/>
      </OverlayTrigger>
    </InputGroup>
    {additional_link_appearence_items}
  </Form>

  const content_label=<>
    {/* Display label  */}
    <InputGroup>
      <InputGroup.Text style={{width:'70%'}}>{t('Flux.label.vdb')}</InputGroup.Text>
      <OverlayTrigger
        key={'flux.label.tooltips.1'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.label.tooltips.1'}>{t('Flux.label.tooltips.label')} </Tooltip>}>
        <Button
          className='btn_menu_config'
          style={{width:'30%'}}
          variant={labelVisibleChecked?'primary':'outline-primary'}
          onClick={
            () => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'label_visible',!labelVisibleChecked,menu_for_style)
              })
              set_data({ ...data })
            }}>{labelVisibleChecked?<FaEye/>:<FaEyeSlash/>}</Button>
      </OverlayTrigger>
    </InputGroup>

    {labelVisibleChecked?<>       {/* Ajout une unité au label de flux */}
      <InputGroup>
        <InputGroup.Text style={{width:'70%'}} >{t('Flux.label.l_u_v')+(is_link_diplaying_value_local(multi_selected_links,'label_unit_visible',menu_for_style)?'*':'')}</InputGroup.Text>

        <OverlayTrigger
          key={'Flux.label.tooltips.2'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.label.tooltips.2'}>{t('Flux.label.tooltips.l_u_v')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            style={{width:'30%'}}
            //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
            variant={isAllLabelUnitVisible?'primary':'outline-primary'}
            onClick={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => assign_link_value_to_correct_var(d,'label_unit_visible',!isAllLabelUnitVisible,menu_for_style))
              set_data({ ...data })
            }}>{isAllLabelUnitVisible?<FaEye/>:<FaEyeSlash/>}</Button>
        </OverlayTrigger>
      </InputGroup>

      {isAllLabelUnitVisible?<>    {/* Modifie l'unité du label de flux */}
        <InputGroup>
          <InputGroup.Text style={{width:'40%'}}>
            {t('Flux.label.l_u')+(is_link_diplaying_value_local(multi_selected_links,'label_unit',menu_for_style)?'*':'')}
          </InputGroup.Text>
          <OverlayTrigger
            key={'Flux.label.tooltips.l_u'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.label.tooltips.l_u'}>{t('Flux.label.tooltips.l_u')} </Tooltip>}>
            <Form.Control
              type='text'
              style={{width:'60%'}}
              value={return_correct_link_attribute_value(data,selected_parameter[0],'label_unit',menu_for_style) as string}
              onChange={evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => assign_link_value_to_correct_var(d,'label_unit',evt.target.value,menu_for_style))
                set_data({ ...data })
              }}/>
          </OverlayTrigger>
        </InputGroup></>:<></>}

      {/* Choix d'affichage en notation scientifique  */}
      <InputGroup>
        <InputGroup.Text style={{width:'70%'}} >{t('Flux.label.toPrecision')}</InputGroup.Text>
        <OverlayTrigger
          key={'flux.label.tooltips.13'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.13'}>{t('Flux.label.tooltips.toPrecision')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            style={{width:'30%'}}
            variant={isAllLinkToPrecision()?'primary':'outline-primary'}
            onClick={
              () => {
                const val=isAllLinkToPrecision()
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  assign_link_value_to_correct_var(d,'to_precision',!val,menu_for_style)
                })
                set_data({ ...data })
              }}>{isAllLinkToPrecision()?<FaEye/>:<FaEyeSlash/>}</Button>
        </OverlayTrigger>
      </InputGroup>

      {isAllLinkToPrecision()?<>  {/* Choose number of scientific number */}
        <InputGroup>
          <InputGroup.Text style={{width:'70%'}}>{t('Flux.label.NbPrecision')}</InputGroup.Text>
          <OverlayTrigger
            key={'flux.label.tooltips.14'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.14'}>{t('Flux.label.tooltips.NbPrecision')} </Tooltip>}>
            <Form.Control
              style={{width:'30%'}}
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
        </InputGroup></>:<></>}

      {/* Couleur des Labels  */}
      <Form.Group as={Row} >
        <ButtonGroup>
          {/* Label en noir  */}
          <OverlayTrigger
            key={'flux.label.tooltips.2'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.2'}>{t('Flux.label.tooltips.len')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              style={{width:'33%', height:'2rem'}}
              disabled={!labelVisibleChecked}
              variant={linkLabelColor('black')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    assign_link_value_to_correct_var(d,'text_color','black',menu_for_style)
                  })
                  set_data({ ...data })
                }}>{t('Flux.label.len')+(is_link_diplaying_value_local(multi_selected_links,'text_color',menu_for_style)?'*':'')}</Button>
          </OverlayTrigger>

          {/* Label en blanc  */}
          <OverlayTrigger
            key={'flux.label.tooltips.3'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.3'}>{t('Flux.label.tooltips.lb')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              style={{width:'33%', height:'2rem'}}
              disabled={!labelVisibleChecked}
              variant={linkLabelColor('white')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    assign_link_value_to_correct_var(d,'text_color','white',menu_for_style)
                  })
                  set_data({ ...data })
                }}>{t('Flux.label.lb')+(is_link_diplaying_value_local(multi_selected_links,'text_color',menu_for_style)?'*':'')}</Button>
          </OverlayTrigger>

          {/* Label en couleur  */}
          <OverlayTrigger
            key={'flux.label.tooltips.4'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.4'}>{t('Flux.label.tooltips.lec')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              style={{width:'34%', height:'2rem'}}
              disabled={!labelVisibleChecked}
              variant={linkLabelColor('color')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    assign_link_value_to_correct_var(d,'text_color',return_correct_link_attribute_value(data,d,'color',menu_for_style),menu_for_style)
                  })
                  set_data({ ...data })
                }}>{t('Flux.label.lec')+(is_link_diplaying_value_local(multi_selected_links,'text_color',menu_for_style)?'*':'')}</Button>
          </OverlayTrigger>
        </ButtonGroup>
      </Form.Group>

      {/* Police des labels de flux  */}
      <InputGroup>
        <Form.Select
          value={allLinkFF?return_correct_link_attribute_value(data,selected_parameter[0],'font_family',menu_for_style) as string:''}
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => assign_link_value_to_correct_var(d,'font_family', evt.target.value,menu_for_style))
              set_data({...data})
            }}>
          {data.display_style.font_family.map((d) => {
            return <option
              style={{fontFamily:d}}
              key={'ff-' + d}
              value={d}
            >{d}</option>
          })}
        </Form.Select>
        <FormControl
          style={{width:'30%'}}
          min={11}
          type={'number'}
          disabled={!labelVisibleChecked}
          value={allNodeLabelFontSize()}
          onChange={evt => {
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>{
              assign_link_value_to_correct_var(d,'label_font_size',+evt.target.value,menu_for_style)
            })
            set_data({ ...data })
          }}
        />
        <InputGroup.Text style={{width:'15%'}}>px</InputGroup.Text>
      </InputGroup>

      {/* Orienter le texte du label le long du flux  */}
      <InputGroup>
        <InputGroup.Text style={{width:'70%'}}>
          {t('Flux.label.acf')+(is_link_diplaying_value_local(multi_selected_links,'label_on_path',menu_for_style)?'*':'')}
        </InputGroup.Text>
        <OverlayTrigger
          key={'flux.label.tooltips.5'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.5'}>{t('Flux.label.tooltips.acf')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            style={{width:'30%'}}
            disabled={!labelVisibleChecked}
            variant={labelSticktoLinkDisabled?'primary':'outline-primary'}
            onClick={()=>{
              const val=labelSticktoLinkDisabled
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                assign_link_value_to_correct_var(d,'label_on_path',!val,menu_for_style)
                if(!val){
                  const l_pos=return_correct_link_attribute_value(data,d,'label_position',menu_for_style)
                  const l_orth_pos=return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style)
                  assign_link_value_to_correct_var(d,'label_position',(l_pos=='frozen')?'middle':l_pos,menu_for_style)
                  assign_link_value_to_correct_var(d,'orthogonal_label_position',(l_orth_pos=='frozen')?'middle':l_orth_pos,menu_for_style)
                }
              })
              set_data({ ...data })
            }}>{labelSticktoLinkDisabled?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </OverlayTrigger>
      </InputGroup>

      {/* Positionnement lateral des label */}
      <InputGroup>
        <InputGroup.Text style={{width:'40%'}}>
          {t('Flux.label.pos')+(is_link_diplaying_value_local(multi_selected_links,'label_position',menu_for_style)?'*':'')}
        </InputGroup.Text>

        {/* Vers le début  */}
        <ButtonGroup style={{width:'30%'}}>
          <OverlayTrigger
            key={'flux.label.tooltips.6'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.6'}>{t('Flux.label.tooltips.deb')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={labelPositionVert('beginning')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    const orth_pos=return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style)
                    assign_link_value_to_correct_var(d,'label_position','beginning',menu_for_style)
                    assign_link_value_to_correct_var(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                  })
                  set_data({ ...data })
                }}><FaAlignLeft/></Button>
          </OverlayTrigger>

          {/* Vers le milieu  */}
          <OverlayTrigger
            key={'flux.label.tooltips.7'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.7'}>{t('Flux.label.tooltips.milieu_h')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={labelPositionVert('middle')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    const orth_pos=return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style)
                    assign_link_value_to_correct_var(d,'label_position','middle',menu_for_style)
                    assign_link_value_to_correct_var(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                  })
                  set_data({ ...data })
                }}><FaAlignCenter/></Button>
          </OverlayTrigger>

          {/* Vers la fin du flux  */}
          <OverlayTrigger
            key={'flux.label.tooltips.8'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.8'}>{t('Flux.label.tooltips.fin')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={labelPositionVert('end')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    const orth_pos=return_correct_link_attribute_value(data,d,'orthogonal_label_position',menu_for_style)
                    assign_link_value_to_correct_var(d,'label_position','end',menu_for_style)
                    assign_link_value_to_correct_var(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                  })
                  set_data({ ...data })
                }}><FaAlignRight/></Button>
          </OverlayTrigger>
        </ButtonGroup>

        {/* Positionnement vertical des label  */}
        <ButtonGroup style={{width:'30%'}}>
          {/* Positionnement au dessous  */}
          <OverlayTrigger
            key={'flux.label.tooltips.9'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.9'}>{t('Flux.label.tooltips.dessous')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={labelPositionOrtho('below')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    const lab_pos=return_correct_link_attribute_value(data,d,'label_position',menu_for_style)
                    assign_link_value_to_correct_var(d,'orthogonal_label_position','below',menu_for_style)
                    assign_link_value_to_correct_var(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                  })
                  set_data({ ...data })
                }}>{svg_label_bottom}</Button>
          </OverlayTrigger>

          {/* Positionnement au milieu  */}
          <OverlayTrigger
            key={'flux.label.tooltips.10'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.10'}>{t('Flux.label.tooltips.milieu_v')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={labelPositionOrtho('middle')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    const lab_pos=return_correct_link_attribute_value(data,d,'label_position',menu_for_style)
                    assign_link_value_to_correct_var(d,'orthogonal_label_position','middle',menu_for_style)
                    assign_link_value_to_correct_var(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                  })
                  set_data({ ...data })
                }}>{svg_label_center}</Button>
          </OverlayTrigger>

          {/* Positionnement au dessus  */}
          <OverlayTrigger
            key={'flux.label.tooltips.11'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.11'}>{t('Flux.label.tooltips.dessus')} </Tooltip>}>
            <Button
              className='btn_menu_config'
              variant={labelPositionOrtho('above')?'primary':'outline-primary'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    const lab_pos=return_correct_link_attribute_value(data,d,'label_position',menu_for_style)
                    assign_link_value_to_correct_var(d,'orthogonal_label_position','above',menu_for_style)
                    assign_link_value_to_correct_var(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                  })
                  set_data({ ...data })
                }}>{svg_label_top}</Button>
          </OverlayTrigger>
        </ButtonGroup>
      </InputGroup>

      {/* Positionnement à la souris  */}
      <InputGroup>
        <InputGroup.Text style={{width:'70%'}}>{t('Flux.label.pls')+(is_link_diplaying_value_local(multi_selected_links,'label_position',menu_for_style)?'*':'')}</InputGroup.Text>
        <OverlayTrigger
          key={'flux.label.tooltips.12'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.12'}>{t('Flux.label.tooltips.pls')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            style={{width:'30%'}}
            // disabled={selected_link.current.label_position === 'frozen'}
            variant={label_link_free_checked?'primary':'outline-primary'}
            onClick={() => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                const l_o_p=return_correct_link_attribute_value(data,d,'label_on_path',menu_for_style)
                assign_link_value_to_correct_var(d,'label_on_path',((!label_link_free_checked)?false:l_o_p),menu_for_style)
                assign_link_value_to_correct_var(d,'label_position',(!label_link_free_checked)?'frozen':'middle',menu_for_style)
                assign_link_value_to_correct_var(d,'orthogonal_label_position',(!label_link_free_checked)?'frozen':'middle',menu_for_style)
              })
              set_data({ ...data })
            }}>{label_link_free_checked?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
        </OverlayTrigger>
      </InputGroup>
    </>:<></>}
  </>

  const content_style=(!menu_for_style)?<InputGroup>
    <InputGroup.Text style={{width:'25%'}}>{t('Flux.style')}</InputGroup.Text>

    {/* Choix du style  */}
    <Dropdown>
      <Dropdown.Toggle style={{width:'50%'}} variant="outline-primary" id="dropdown-basic">{style_of_selected_links()}</Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => {
          set_style_to_apply_to_link('')
          multi_selected_links.current.map(n => {
            n.style = ''
          })
          set_data({ ...data })
        }}>{'Aucun'}</Dropdown.Item>
        {Object.keys(data.style_link).map((d,i) => {
          return (<Dropdown.Item key={i} onClick={() => {
            set_style_to_apply_to_link(d)
            multi_selected_links.current.map(n => {
              n.style = d
            })
            set_data({ ...data })
          }}>{data.style_link[d].idLink}</Dropdown.Item>)
        })}
      </Dropdown.Menu>
    </Dropdown>

    {/* Appliquer le style  */}
    <OverlayTrigger
      key={'Menu.tooltips.flux.as'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'Menu.tooltips.flux.as'}>{t('Flux.tooltips.as')} </Tooltip>}>
      <Button
        style={{width:'25%'}}
        size="sm"
        variant="outline-primary"
        className='btn_menu_config'
        onClick={
          () => {
            apply_style_to_selected_links()
            set_data({ ...data })
          }}>
        {t('Flux.as')}
      </Button>
    </OverlayTrigger>
  </InputGroup>:<></>

  const content= <div className='apparence_config'>
    {content_style}
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    <h4 style={{fontSize:'14px' ,fontWeight:'bold'}}>{t('Flux.apparence.apparence')}</h4>
    {content_appearence}
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    <h4 style={{fontSize:'14px' ,fontWeight:'bold'}}>{t('Flux.label.label')}</h4>
    {content_label}</div>

  /* Formattage de l'affichage du menu attribut de flux */
  return menu_for_modal?content:<Tab eventKey="flux_attributes" title={t('Flux.apparence.apparence')}>{content}</Tab>
}

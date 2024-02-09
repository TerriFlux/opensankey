import React,{useState} from 'react'
import { Row, Form, Tab, FormControl, OverlayTrigger, Tooltip, Button, ButtonGroup, Dropdown, Col} from 'react-bootstrap'
import { SankeyData, SankeyLinkAttrLocal } from '../types/Types'
import { FaAlignLeft, FaAlignCenter, FaAlignRight, FaEyeSlash, FaEye } from 'react-icons/fa'
import { FaAngleDoubleDown, FaAngleDoubleUp, FaAngleDown, FaAngleUp } from 'react-icons/fa'

import { Checkbox } from '@chakra-ui/react'

import { ReturnCorrectLinkAttributeValue,AssignLinkValueToCorrectVar,IsAllLinkAttrSameValue,IsLinkDiplayingValueLocal,CutName,SmoothClasses,TooltipValueSurcharge, StyleTitleSubSectionMenuEditionElements, IsAllLinkNotLocalAttrSameValue} from './SankeyUtils'
import { MenuConfigurationLinksAppearenceFType, handleDownLinkFType, handleUpLinkFType } from './types/SankeyMenuConfigurationLinksAppearenceTypes'
import { GetLinkValueFuncType } from './types/SankeyUtilsTypes'

const logo_hv=<svg  xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 26 26"
>
  <g>
    <path
      d="m 17.84271,23.063448 c -1.269418,-1.282992 -2.346574,-2.454122 -2.393679,-2.602512 -0.0594,-0.187118 -0.01495,-0.364549 0.145033,-0.578998 0.227793,-0.305339 0.251457,-0.30961 1.893906,-0.341824 l 1.663232,-0.03262 v -5.044847 c 0,-3.278554 -0.04379,-5.16073 -0.125076,-5.375831 C 18.85592,8.636398 18.348461,8.114093 17.890847,7.918325 17.58911,7.78924 16.487878,7.756442 12.455374,7.756442 H 7.3983032 l -0.03263,1.662971 c -0.0324,1.65136 -0.03483,1.664613 -0.348521,1.898566 -0.272363,0.203132 -0.362903,0.216128 -0.65705,0.09431 -0.187636,-0.07771 -1.355183,-1.160016 -2.594548,-2.405127 -1.678774,-1.686558 -2.25339,-2.336228 -2.25339,-2.547722 0,-0.212412 0.600322,-0.884111 2.384458,-2.667967 2.546767,-2.546366 2.737072,-2.671811 3.260033,-2.148932 0.212788,0.212755 0.235188,0.391917 0.235188,1.881201 v 1.646051 h 5.0906128 c 5.443018,0 5.946321,0.04455 6.897173,0.610539 0.590386,0.351422 1.254964,1.004393 1.65343,1.62455 0.666046,1.036613 0.705198,1.426315 0.705198,7.019257 v 5.089812 h 1.646309 c 1.489519,0 1.668709,0.0224 1.881497,0.235151 0.519204,0.519121 0.394333,0.708915 -2.142301,3.256165 -1.834562,1.84224 -2.445485,2.387833 -2.675253,2.389168 -0.232072,0.0013 -0.80697,-0.51292 -2.605802,-2.330984 z"
    />
  </g>
</svg>

const logo_vh=<svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 26 26"
  style={{transform:'rotate(180deg)'}}
>
  <g>
    <path
      d="m 3.1500765,17.283934 c 1.282992,-1.269418 2.454122,-2.346574 2.602512,-2.393679 0.187118,-0.0594 0.364549,-0.01495 0.578998,0.145033 0.305339,0.227793 0.30961,0.251457 0.341824,1.893906 l 0.03262,1.663232 h 5.0448465 c 3.278554,0 5.16073,-0.04379 5.375831,-0.125076 0.450418,-0.170206 0.972723,-0.677665 1.168491,-1.135279 0.129085,-0.301737 0.161883,-1.402969 0.161883,-5.435473 V 6.8395274 l -1.662971,-0.03263 c -1.65136,-0.0324 -1.664613,-0.03483 -1.898566,-0.348521 -0.203132,-0.272363 -0.216128,-0.362903 -0.09431,-0.65705 0.07771,-0.187636 1.160016,-1.355183 2.405127,-2.594548 1.686558,-1.678774 2.336228,-2.25339004 2.547722,-2.25339004 0.212412,0 0.884111,0.60032204 2.667967,2.38445804 2.546366,2.546767 2.671811,2.737072 2.148932,3.260033 -0.212755,0.212788 -0.391917,0.235188 -1.881201,0.235188 H 21.043731 V 11.92368 c 0,5.443018 -0.04455,5.946321 -0.610539,6.897173 -0.351422,0.590386 -1.004393,1.254964 -1.62455,1.65343 -1.036613,0.666046 -1.426315,0.705198 -7.019257,0.705198 H 6.6995735 v 1.646309 c 0,1.489519 -0.0224,1.668709 -0.235151,1.881497 -0.519121,0.519204 -0.708915,0.394333 -3.256165,-2.142301 -1.84224,-1.834562 -2.387833,-2.445485 -2.389168,-2.675253 -0.0013,-0.232072 0.51292,-0.80697 2.330984,-2.605802 z"
    />
  </g>
</svg>

const logo_vv=<svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 27 70">
  <g>
    <path
      d="m 1.0769167,58.015255 c 0.217654,0.354078 2.981133,3.275215 6.141066,6.491418 5.2863293,5.380463 5.8029433,5.84764 6.4664543,5.84764 0.665502,0 1.194478,-0.484452 6.858149,-6.280882 6.083147,-6.225736 6.13703,-6.28875 6.13703,-7.176876 0,-0.637443 -0.145906,-1.069736 -0.505635,-1.498089 L 25.668348,54.796371 21.3514,54.730451 17.034455,54.664531 V 37.542387 c 0,-9.417179 -0.06092,-18.000541 -0.135383,-19.074135 l -0.135382,-1.951988 4.45232,-0.06594 4.452319,-0.06597 0.505644,-0.602096 c 0.358397,-0.426766 0.505643,-0.861029 0.505643,-1.491273 0,-0.878947 -0.07053,-0.961469 -6.133897,-7.1768736 -5.688745,-5.831388 -6.186808,-6.28770195 -6.86297,-6.28770195 -0.675922,0 -1.176483,0.45789495 -6.8661033,6.28087995 -6.08314705,6.2257346 -6.13703005,6.2887486 -6.13703005,7.1768766 0,0.637443 0.145908,1.069735 0.50563505,1.498089 l 0.505633,0.602095 4.316948,0.06592 4.3169453,0.06592 v 17.122137 c 0,9.417183 0.06092,18.000543 0.135383,19.074137 l 0.135382,1.951988 -4.4523203,0.06596 -4.452317,0.06596 -0.505646,0.602096 c -0.61444705,0.731653 -0.65563605,1.726456 -0.108342,2.616786 z"
    />
  </g>
</svg>

const logo_hh=<svg xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 70 27"
>
  <g>
    <path
      d="m 57.188847,25.602699 c 0.354078,-0.217654 3.275215,-2.981133 6.491418,-6.141066 5.380463,-5.286329 5.84764,-5.802943 5.84764,-6.466454 0,-0.665502 -0.484452,-1.194478 -6.280882,-6.858149 C 57.021287,0.053883 56.958273,0 56.070147,0 55.432704,0 55.000411,0.145906 54.572058,0.505635 l -0.602095,0.505633 -0.06592,4.316948 -0.06592,4.316945 H 36.715979 c -9.41718,0 -18.000542,0.06092 -19.074136,0.135383 L 15.689855,9.915926 15.623915,5.463606 15.557945,1.011287 14.955849,0.505643 C 14.529083,0.147246 14.09482,0 13.464576,0 12.585629,0 12.503107,0.07053 6.287703,6.133897 0.45631402,11.822642 2.289157e-8,12.320705 2.289157e-8,12.996867 2.289157e-8,13.672789 0.45789502,14.17335 6.280881,19.86297 12.506615,25.946117 12.569629,26 13.457757,26 c 0.637443,0 1.069735,-0.145908 1.498089,-0.505635 l 0.602095,-0.505633 0.06592,-4.316948 0.06592,-4.316945 h 17.122138 c 9.417183,0 18.000543,-0.06092 19.074137,-0.135383 l 1.951988,-0.135382 0.06596,4.45232 0.06596,4.452317 0.602096,0.505646 c 0.731653,0.614447 1.726456,0.655636 2.616786,0.108342 z"
    />
  </g>
</svg>

const svg_label_top=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,0H4.5c-.829,0-1.5,.671-1.5,1.5s.671,1.5,1.5,1.5h7.247c-.143,.042-.278,.12-.391,.234l-5.087,5.191c-.574,.581-.167,1.575,.644,1.575h3.587v12.5c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5V10h3.587c.811,0,1.218-.994,.644-1.575L12.644,3.234c-.113-.114-.248-.192-.391-.234h7.247c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
const svg_label_bottom=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M19.5,21h-7.247c.143-.042,.278-.12,.391-.234l5.087-5.191c.574-.581,.167-1.575-.644-1.575h-3.587V1.5c0-.829-.672-1.5-1.5-1.5s-1.5,.671-1.5,1.5V14h-3.587c-.811,0-1.218,.994-.644,1.575l5.087,5.191c.113,.114,.248,.192,.391,.234H4.5c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h15c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z"/></svg>
const svg_label_center=<svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 24 24' width="12" height="12"><path d="M24,12c0,.553-.448,1-1,1H1c-.552,0-1-.447-1-1s.448-1,1-1H23c.552,0,1,.447,1,1Zm-13.414-3.586c.39,.39,.902,.585,1.414,.585s1.024-.195,1.414-.585l3.293-3.293c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0l-2.293,2.293V1c0-.553-.448-1-1-1s-1,.447-1,1V6l-2.293-2.293c-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414l3.293,3.293Zm2.828,7.172c-.779-.779-2.049-.779-2.828,0l-3.293,3.293c-.391,.391-.391,1.023,0,1.414s1.023,.391,1.414,0l2.293-2.293v5c0,.553,.448,1,1,1s1-.447,1-1v-5l2.293,2.293c.195,.195,.451,.293,.707,.293s.512-.098,.707-.293c.391-.391,.391-1.023,0-1.414l-3.293-3.293Z"/></svg>


export const MenuConfigurationLinksAppearence : MenuConfigurationLinksAppearenceFType = (
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  additional_link_appearence_items:JSX.Element[],
  menu_for_style:boolean,
  GetLinkValue:GetLinkValueFuncType,
  menu_for_modal=false
)=>{
  const {t}=applicationContext
  const {data,set_data}=dict_variable_application_data
  const {ref_selected_style_link,multi_selected_links}=dict_variable_elements_selected
  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[ref_selected_style_link.current]]:multi_selected_links.current
  const [, set_style_to_apply_to_link] = useState('default')
  const [display_link_opacity, set_display_link_opacity] = useState('0')
  if (!menu_for_style && dict_variable_elements_selected.ref_display_link_opacity.current.length < 2) {
    dict_variable_elements_selected.ref_display_link_opacity.current.push(set_display_link_opacity)
  }

  const list_key=['dashed','label_on_path','to_precision','custom_digit','label_unit_visible',
    'label_visible','font_family','recycling','arrow','curved','nb_digit','scientific_precision',
    'text_color','label_position','orthogonal_label_position'] as (keyof SankeyLinkAttrLocal)[]
  const list_value=IsAllLinkAttrSameValue(data,selected_parameter,list_key,menu_for_style)

  const isAllLinksLabelPosOrthAuto=IsAllLinkNotLocalAttrSameValue(data,(menu_for_style)?[]:multi_selected_links.current,['label_pos_auto'])


  const shiftCenter = () => {
    if (selected_parameter.length == 0) {
      return 0.5
    }
    const idx = selected_parameter.length-1
    const current_link = selected_parameter[idx]
    return parseFloat((((ReturnCorrectLinkAttributeValue(data,current_link,'left_horiz_shift',menu_for_style)as number) + (ReturnCorrectLinkAttributeValue(data,current_link,'right_horiz_shift',menu_for_style)as number)) / 2).toPrecision(2))
  }

  const shift = () => {
    if (selected_parameter.length == 0) {
      return 0.1
    }
    const idx = selected_parameter.length-1
    const current_link = selected_parameter[idx]
    const the_shift = ((ReturnCorrectLinkAttributeValue(data,current_link,'right_horiz_shift',menu_for_style)as number) - (ReturnCorrectLinkAttributeValue(data,current_link,'left_horiz_shift',menu_for_style)as number))/2
    return parseFloat(the_shift.toPrecision(2))
  }

  const linkOrientation = (param: string) => {
    let allChecked = true
    switch (param) {
    case 'hh':
      selected_parameter.map(d => {
        allChecked = (ReturnCorrectLinkAttributeValue(data,d,'orientation',menu_for_style) == 'hh') ? allChecked : false
      })
      return allChecked
      break
    case 'vv':
      selected_parameter.map(d => {
        allChecked = (ReturnCorrectLinkAttributeValue(data,d,'orientation',menu_for_style) == 'vv') ? allChecked : false
      })
      return allChecked
      break
    case 'hv':
      selected_parameter.map(d => {
        allChecked = (ReturnCorrectLinkAttributeValue(data,d,'orientation',menu_for_style) == 'hv') ? allChecked : false
      })
      return allChecked
      break
    case 'vh':
      selected_parameter.map(d => {
        allChecked = (ReturnCorrectLinkAttributeValue(data,d,'orientation',menu_for_style) == 'vh') ? allChecked : false
      })
      return allChecked
      break
    }
  }

  const courbure = () => {
    let display_courbe = true
    let courbe = 0.5
    if (selected_parameter.length != 0) {
      courbe=ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'curvature',menu_for_style) as number
    }
    selected_parameter.map((d) => {
      display_courbe = (ReturnCorrectLinkAttributeValue(data,d,'curvature',menu_for_style)  == courbe) ? display_courbe : false
    })

    return (display_courbe) ? courbe : 0
  }

  const arrow_size = () => {
    let display_arrow_size = true
    let courbe = 10
    if (selected_parameter.length != 0) {
      courbe=ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'arrow_size',menu_for_style) as number
    }
    selected_parameter.map((d) => {
      display_arrow_size = (ReturnCorrectLinkAttributeValue(data,d,'arrow_size',menu_for_style)  == courbe) ? display_arrow_size : false
    })

    return (display_arrow_size) ? courbe : 0
  }

  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (selected_parameter.length != 0) {
      size = ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'label_font_size',menu_for_style) as number
    }
    selected_parameter.map((d) => {
      display_size = ((ReturnCorrectLinkAttributeValue(data,d,'label_font_size',menu_for_style) as number) == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }

  const labelLinkFree = () => {
    if(selected_parameter.length==0){
      return [null,null]
    }
    const first_value=(ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'label_position',menu_for_style) === 'frozen'&& (ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'orthogonal_label_position',menu_for_style)) === 'frozen')
    let all_same=true
    selected_parameter.forEach(l=>{
      all_same=((ReturnCorrectLinkAttributeValue(data,l,'label_position',menu_for_style) === 'frozen'&& (ReturnCorrectLinkAttributeValue(data,l,'orthogonal_label_position',menu_for_style)) === 'frozen') ? false : all_same)
    })
    return (all_same?[first_value,false]:[false,true])
  }
  const label_link_free_checked=labelLinkFree() as boolean[]

  const apply_style_to_selected_links = () => {
    multi_selected_links.current.map(d => {
      delete d.local
    })
  }

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
        return (inchangee) ? CutName(data.style_link[style_to_display].idLink, 25 ) : 'Multiple style parmi les noeuds sélectionnés'
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  const content_appearence = < >

    <Row>
      <span className='title_grp_attributes'>{t('Menu.edition')}</span>
    </Row>
    {/* Flux en recyclage  */}
    <Row>
      <Col>
        <OverlayTrigger
          key={'flux.apparence.tooltips.11'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.apparence.tooltips.11'}>{t('Flux.apparence.tooltips.recy')} </Tooltip>}>
          <Checkbox
            sx={SmoothClasses({})}
            iconColor={list_value['recycling'][1]?'#78C2AD':'white'}
            isIndeterminate={list_value['recycling'][1]}
            isChecked={list_value['recycling'][0] as boolean}
            onChange={
              (evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'recycling',evt.target.checked,menu_for_style)
                  AssignLinkValueToCorrectVar(d,'left_horiz_shift',(!evt.target.checked?0.2:0),menu_for_style)
                  AssignLinkValueToCorrectVar(d,'right_horiz_shift',(!evt.target.checked?0.8:0),menu_for_style)
                })
                set_data({ ...data })
              }}>{t('Flux.apparence.recy')}</Checkbox>
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Orientation du flux */}
    <Row className='input_row'>
      <Col>
        <Form.Label >
          {t('Flux.apparence.of')}{(IsLinkDiplayingValueLocal(multi_selected_links,'orientation',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
        </Form.Label>
      </Col>
      <ButtonGroup as={Col}>
        {/* Horizontal - Horizontal  */}
        <OverlayTrigger
          key={'Flux.apparence.tooltips.3'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.apparence.tooltips.3'}>{t('Flux.apparence.tooltips.of_hh')} </Tooltip>}>
          <Button
            className='btn_menu_config'

            value='hh'
            variant={linkOrientation('hh')?'primary':'outline-primary'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','hh',menu_for_style)

                })
                set_data({ ...data })
              }}>{logo_hh}</Button>
        </OverlayTrigger>

        {/* Vertical - Verticale  */}
        <OverlayTrigger
          key={'Flux.apparence.tooltips.4'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.apparence.tooltips.4'}>{t('Flux.apparence.tooltips.of_vv')} </Tooltip>}>
          <Button
            className='btn_menu_config'

            value='vv'
            variant={linkOrientation('vv')?'primary':'outline-primary'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','vv',menu_for_style)
                })
                set_data({ ...data })
              }}>{logo_vv}</Button>
        </OverlayTrigger>

        {/* Vertical - Horizontal  */}
        <OverlayTrigger
          key={'Flux.apparence.tooltips.5'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.apparence.tooltips.5'}>{t('Flux.apparence.tooltips.of_vh')} </Tooltip>}>
          <Button
            className='btn_menu_config'

            value='vh'
            variant={linkOrientation('vh')?'primary':'outline-primary'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','vh',menu_for_style)
                })
                set_data({ ...data })
              }}>{logo_vh}</Button>
        </OverlayTrigger>

        {/* Horizontal - Vertical  */}
        <OverlayTrigger
          key={'flux.apparence.tooltips.6'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.apparence.tooltips.6'}>{t('Flux.apparence.tooltips.of_hv')} </Tooltip>}>
          <Button
            className='btn_menu_config'

            value='hv'
            variant={linkOrientation('hv')?'primary':'outline-primary'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','hv',menu_for_style)
                })
                set_data({ ...data })
              }}>{logo_hv}</Button>
        </OverlayTrigger>
      </ButtonGroup>
    </Row>

    {/* Forme fleche droite  */}
    <Row>
      <Col>
        <OverlayTrigger
          key={'flux.apparence.tooltips.10'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.apparence.tooltips.10'}>{t('Flux.apparence.tooltips.fleche')} </Tooltip>}>
          <Checkbox
            sx={SmoothClasses({})}
            iconColor={list_value['arrow'][1]?'#78C2AD':'white'}
            isIndeterminate={list_value['arrow'][1]}
            isChecked={list_value['arrow'][0] as boolean}
            onChange={
              (evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>AssignLinkValueToCorrectVar(d,'arrow',evt.target.checked,menu_for_style)
                )
                set_data({ ...data })
              }}>{t('Flux.apparence.fleche')}</Checkbox>
        </OverlayTrigger>
      </Col>
    </Row>

    <Row className='input_row'>
      <Col>
        <Form.Label >
          {t('Flux.apparence.arrow_size')}{(IsLinkDiplayingValueLocal(multi_selected_links,'arrow_size',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
        </Form.Label>
      </Col>
      <Col>
        <OverlayTrigger
          key={'flux.apparence.tooltips.13'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'flux.apparence.tooltips.13'}>{t('Flux.apparence.tooltips.arrow_size')} </Tooltip>}>
          <FormControl

            min={1}  step={1}
            type={'number'}
            value={arrow_size()}
            onChange={
              evt => {
                const val=+evt.target.value
                const value=isNaN(val) || val<=0?10:val
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'arrow_size',value,menu_for_style)

                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger></Col>
    </Row>

    {/* Forme courbée  */}
    <Row>
      <Col>
        <OverlayTrigger
          key={'flux.apparence.tooltips.9'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.apparence.tooltips.9'}>{t('Flux.apparence.tooltips.courbe')} </Tooltip>}>
          <Checkbox
            sx={SmoothClasses({})}
            iconColor={list_value['curved'][1]?'#78C2AD':'white'}
            isIndeterminate={list_value['curved'][1]}
            isChecked={list_value['curved'][0] as boolean}
            onChange={
              (evt) => {
                Object.values(parameter_to_modify)
                  .filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink))
                  .map(d => AssignLinkValueToCorrectVar(d,'curved',evt.target.checked,menu_for_style))
                set_data({ ...data })
              }}>{t('Flux.apparence.courbe')}</Checkbox>
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Modification du rayon de courbure du flux  */}
    <Row className='input_row'>
      <Col><Form.Label >{t('Flux.apparence.courbure')}{(IsLinkDiplayingValueLocal(multi_selected_links,'curvature',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Form.Label></Col>
      <Col><OverlayTrigger
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
                AssignLinkValueToCorrectVar(d,'curvature',+evt.target.value,menu_for_style)

              })
              set_data({ ...data })
            }}/>
      </OverlayTrigger></Col>
    </Row>

    {/* Positionnement du centre du flux  */}
    <Row className='input_row'>
      <Col><Form.Label >
        {t('Flux.apparence.pdc')}
      </Form.Label></Col>

      <Col>
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
                  let shift_gap = (Number(ReturnCorrectLinkAttributeValue(data,d,'right_horiz_shift',menu_for_style)) - Number(ReturnCorrectLinkAttributeValue(data,d,'left_horiz_shift',menu_for_style)))/2
                  if (center - shift_gap < 0) {
                    shift_gap = center
                  }
                  if (center + shift_gap > 1) {
                    shift_gap = 1-center
                  }
                  AssignLinkValueToCorrectVar(d,'left_horiz_shift',(center - shift_gap),menu_for_style)
                  AssignLinkValueToCorrectVar(d,'right_horiz_shift',(center + shift_gap),menu_for_style)
                })
                set_data({ ...data })
              }}/>
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Distance des poignée */}
    <Row className='input_row'>
      <Col>
        <Form.Label >
          {t('Flux.apparence.eep')}{(IsLinkDiplayingValueLocal(multi_selected_links,'left_horiz_shift',menu_for_style)&&IsLinkDiplayingValueLocal(multi_selected_links,'right_horiz_shift',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
        </Form.Label>
      </Col>

      <Col>
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

                  AssignLinkValueToCorrectVar(d,'left_horiz_shift',(new_center_position - shift_gap),menu_for_style)
                  AssignLinkValueToCorrectVar(d,'right_horiz_shift',(new_center_position + shift_gap),menu_for_style)

                })
                set_data({ ...data })
              }
            }
          />
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Choix de la couleur du flux */}
    <Row className='input_row'>
      <Col>
        <Form.Label>
          {t('Flux.apparence.couleur')}{(IsLinkDiplayingValueLocal(multi_selected_links,'color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
        </Form.Label>
      </Col>
      <Col>
        <OverlayTrigger
          key={'Flux.apparence.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.apparence.tooltips.1'}>{t('Flux.apparence.tooltips.couleur')} </Tooltip>}>
          <Form.Label htmlFor="form_color_link" style={{
            'background':(selected_parameter.length == 1) ? (ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff',
            border:'1px solid #ced4da',
            borderTopRightRadius:'4px',
            borderBottomRightRadius:'4px',
            height:'1.2rem'
          }}/>
        </OverlayTrigger>
      </Col>
      <Form.Control
        type="color"
        id='form_color_link'
        name='form_color_link'
        style={{display:'none'}}
        value={(selected_parameter.length == 1) ? (ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
        onChange={
          evt => {
            const color = evt.target.value
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => AssignLinkValueToCorrectVar(d,'color',color,menu_for_style))
            set_data({ ...data })
          }}/>
    </Row>

    {/* Opacité */}
    <Row className='input_row'>
      <Col>
        <Form.Label>
          {t('Flux.apparence.opacity')}{(IsLinkDiplayingValueLocal(multi_selected_links,'opacity',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
        </Form.Label>
      </Col>
      <Col>
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
              isInvalid={selected_parameter.length>0?+display_link_opacity!=ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'opacity',menu_for_style):false}
              onChange={
                evt => {
                  dict_variable_elements_selected.ref_display_link_opacity.current.forEach(setter=>setter(evt.target.value))
                }}
              onBlur={(evt)=>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(
                  d => AssignLinkValueToCorrectVar(d,'opacity',+evt.target.value,menu_for_style)
                )
                set_data({...data})
              }}
            />
            <FormControl.Feedback type='invalid'>{t('MEP.onBlur')}</FormControl.Feedback>
          </>
        </OverlayTrigger>
      </Col>
    </Row>

    {/* Flux hachuré */}
    <Row className='input_row'>
      <Col>
        <OverlayTrigger
          key={'Flux.apparence.tooltips.2'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Flux.apparence.tooltips.2'}>{t('Flux.apparence.tooltips.hach')} </Tooltip>}>

          <Checkbox
            sx={SmoothClasses({})}
            iconColor={list_value['dashed'][1]?'#78C2AD':'white'}
            isIndeterminate={list_value['dashed'][1]}
            isChecked={list_value['dashed'][0] as boolean}
            onChange={(evt) => {
              Object.values(parameter_to_modify)
                .filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink))
                .forEach(d => AssignLinkValueToCorrectVar(d,'dashed',evt.target.checked,menu_for_style))
              set_data({ ...data })
            }}>
            {t('Flux.apparence.hach')+' '}
            {(IsLinkDiplayingValueLocal(multi_selected_links,'dashed',menu_for_style)?
              TooltipValueSurcharge('link_var_',t):<></>)}
          </Checkbox>
        </OverlayTrigger>
      </Col>
    </Row>

    <Row className='input_row'>
      <Col>
        <Checkbox
          sx={SmoothClasses({})}
          iconColor={!data.display_style.null_flux?'#78C2AD':'white'}
          isChecked={data.display_style.null_flux}
          onChange={(evt) => {
            data.display_style.null_flux=evt.target.checked
            set_data({ ...data })
          }}>
          {t('Banner.fn')}
        </Checkbox>
      </Col>
    </Row>
    <Row className='input_row'>
      <Col>
        {additional_link_appearence_items}
      </Col>
    </Row>
  </>

  const content_label=<>
    {/* Display label  */}
    <Row className='input_row'>
      <Col>
        <OverlayTrigger
          key={'flux.label.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.label.tooltips.1'}>{t('Flux.label.tooltips.label')} </Tooltip>}>
          <Checkbox
            style={StyleTitleSubSectionMenuEditionElements({underline:true,v_max_width:'90%'})}
            sx={SmoothClasses({})}
            icon={list_value['label_visible'][0] as boolean?<FaEye/>:<FaEyeSlash/>}
            iconColor={list_value['label_visible'][1]?'#78C2AD':'white'}
            isIndeterminate={list_value['label_visible'][1]}
            isChecked={list_value['label_visible'][0] as boolean}
            onChange={(evt) => {
              Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                AssignLinkValueToCorrectVar(d,'label_visible',evt.target.checked,menu_for_style)
              })
              set_data({ ...data })
            }}>
            {t('Flux.label.vdb')+' '}
            {(IsLinkDiplayingValueLocal(multi_selected_links,'label_visible',menu_for_style)?
              TooltipValueSurcharge('link_var_',t):<></>)}
          </Checkbox>
        </OverlayTrigger>
      </Col>
    </Row>

    {list_value['label_visible'][0] as boolean?<>

      {/* Choose number of significant number */}
      <Row className='input_row'>
        <Col>
          <Form.Label>
            {t('Flux.label.NbPrecision')}
          </Form.Label>
        </Col>
        <Col>
          <OverlayTrigger
            key={'flux.label.tooltips.14'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.14'}>{t('Flux.label.tooltips.NbPrecision')} </Tooltip>}>
            <Form.Control
              type='number'
              min={0}
              step={1}
              value={list_value['scientific_precision'][0] as number}
              onChange={evt=>{
                const value=+evt.target.value
                if(!isNaN(value)){
                  const val=isNaN(value) || value<=0?5:Math.round(value)
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d =>AssignLinkValueToCorrectVar(d,'scientific_precision',val,menu_for_style))
                  set_data({...data})
                }
              }}/>
          </OverlayTrigger>
        </Col>
      </Row>

      {/* Choix d'affichage en notation scientifique  */}
      <Row className='input_row'>
        <Col>
          <OverlayTrigger
            key={'flux.label.tooltips.13'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.13'}>{t('Flux.label.tooltips.toPrecision')} </Tooltip>}>
            <Checkbox
              sx={SmoothClasses({})}
              iconColor={list_value['to_precision'][1]?'#78C2AD':'white'}
              isIndeterminate={list_value['to_precision'][1]}
              isChecked={list_value['to_precision'][0] as boolean}
              onChange={(evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'custom_digit',false,menu_for_style)
                  AssignLinkValueToCorrectVar(d,'to_precision',evt.target.checked,menu_for_style)
                })
                set_data({ ...data })
              }}>
              {t('Flux.label.toPrecision')+' '}
              {(IsLinkDiplayingValueLocal(multi_selected_links,'to_precision',menu_for_style)?
                TooltipValueSurcharge('link_var_',t):<></>)}
            </Checkbox>
          </OverlayTrigger>
        </Col>
      </Row>

      {list_value['to_precision'][0]?<>
      </>:<></>}

      {/* Choix d'affichage du nombre de chiffre après la virgule  */}
      <Row className='input_row'>
        <Col>
          <OverlayTrigger
            key={'flux.label.tooltips.cd'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.cd'}>{t('Flux.label.tooltips.custom_digit')} </Tooltip>}>
            <Checkbox
              sx={SmoothClasses({})}
              iconColor={list_value['custom_digit'][1]?'#78C2AD':'white'}
              isIndeterminate={list_value['custom_digit'][1]}
              isChecked={list_value['custom_digit'][0] as boolean}
              onChange={(evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'to_precision',false,menu_for_style)
                  AssignLinkValueToCorrectVar(d,'custom_digit',evt.target.checked,menu_for_style)
                })
                set_data({ ...data })
              }}>
              {t('Flux.label.custom_digit')+' '}
              {(IsLinkDiplayingValueLocal(multi_selected_links,'custom_digit',menu_for_style)?
                TooltipValueSurcharge('link_var_',t):<></>)}
            </Checkbox>
          </OverlayTrigger></Col>
      </Row>

      {list_value['custom_digit'][0]?<>
        {/* Choose number of custom digit */}
        <Row className='input_row'>
          <Col>
            <Form.Label>
              {t('Flux.label.NbDigit')}
            </Form.Label>
          </Col>
          <Col>
            <OverlayTrigger
              key={'flux.label.tooltips.nd'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.nd'}>{t('Flux.label.tooltips.NbDigit')} </Tooltip>}>
              <Form.Control
                type='number'
                min={0}
                step={1}
                disabled={!(list_value['custom_digit'][0] as boolean)}
                value={list_value['nb_digit'][0] as number}
                onChange={evt=>{
                  const value=+evt.target.value
                  const val=isNaN(value)
                  Object.values(parameter_to_modify).filter(f => !val && selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d =>AssignLinkValueToCorrectVar(d,'nb_digit',value,menu_for_style))
                  set_data({...data})
                }}/>
            </OverlayTrigger>
          </Col>
        </Row></>:<></>}

      <Row className='input_row'>
        {/* Ajout une unité au label de flux */}
        <Col>
          <OverlayTrigger
            key={'Flux.label.tooltips.2'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'Flux.label.tooltips.2'}>{t('Flux.label.tooltips.l_u_v')} </Tooltip>}>
            <Checkbox
              sx={SmoothClasses({})}
              iconColor={list_value['label_unit_visible'][1]?'#78C2AD':'white'}
              icon={list_value['label_unit_visible'][0] as boolean?<FaEye/>:<FaEyeSlash/>}
              isChecked={list_value['label_unit_visible'][0] as boolean}
              onChange={(evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'label_unit_visible',evt.target.checked,menu_for_style)
                })
                set_data({ ...data })
              }}>
              {t('Flux.label.l_u_v')+' '}
              {(IsLinkDiplayingValueLocal(multi_selected_links,'label_unit_visible',menu_for_style)?
                TooltipValueSurcharge('link_var_',t):<></>)}
            </Checkbox>
          </OverlayTrigger>
        </Col>
      </Row>

      {/* Modifie l'unité du label de flux */}
      {list_value['label_unit_visible'][0]?<>
        <Row className='input_row'>
          <Col>
            <Form.Label >
              {t('Flux.label.l_u')}{(IsLinkDiplayingValueLocal(multi_selected_links,'label_unit',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
            </Form.Label>
          </Col>
          <Col>
            <OverlayTrigger
              key={'Flux.label.tooltips.l_u'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'Flux.label.tooltips.l_u'}>{t('Flux.label.tooltips.l_u')} </Tooltip>}>
              <Form.Control
                type='text'
                value={ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'label_unit',menu_for_style) as string}
                onChange={evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => AssignLinkValueToCorrectVar(d,'label_unit',evt.target.value,menu_for_style))
                  set_data({ ...data })
                }}/>
            </OverlayTrigger>
          </Col>
        </Row></>:<></>}

      <Row>
        <span className='title_grp_attributes'>{t('Menu.edition')}</span>
      </Row>

      {/* Couleur des Labels  */}
      <Row className='input_row' >
        <Col>
          <ButtonGroup>
            {/* Label en noir  */}
            <OverlayTrigger
              key={'flux.label.tooltips.2'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.2'}>{t('Flux.label.tooltips.len')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                disabled={!list_value['label_visible'][0]}
                variant={!list_value['text_color'][1] && list_value['text_color'][0]==='black'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      AssignLinkValueToCorrectVar(d,'text_color','black',menu_for_style)
                    })
                    set_data({ ...data })
                  }}>{t('Flux.label.len')}{(IsLinkDiplayingValueLocal(multi_selected_links,'text_color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Button>
            </OverlayTrigger>

            {/* Label en blanc  */}
            <OverlayTrigger
              key={'flux.label.tooltips.3'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.3'}>{t('Flux.label.tooltips.lb')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                disabled={!list_value['label_visible'][0]}
                variant={!list_value['text_color'][1] && list_value['text_color'][0]==='white'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      AssignLinkValueToCorrectVar(d,'text_color','white',menu_for_style)
                    })
                    set_data({ ...data })
                  }}>{t('Flux.label.lb')}{(IsLinkDiplayingValueLocal(multi_selected_links,'text_color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Button>
            </OverlayTrigger>

            {/* Label en couleur  */}
            <OverlayTrigger
              key={'flux.label.tooltips.4'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.4'}>{t('Flux.label.tooltips.lec')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                disabled={!list_value['label_visible'][0]}
                variant={!list_value['text_color'][1] && list_value['text_color'][0]==='color'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      AssignLinkValueToCorrectVar(d,'text_color',ReturnCorrectLinkAttributeValue(data,d,'color',menu_for_style),menu_for_style)
                    })
                    set_data({ ...data })
                  }}>{t('Flux.label.lec')}{(IsLinkDiplayingValueLocal(multi_selected_links,'text_color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Button>
            </OverlayTrigger>
          </ButtonGroup>
        </Col>
      </Row>

      <span style={{fontSize:'14px' ,fontStyle:'italic'}}>Police</span>

      {/* Police des labels de flux  */}
      <Row>
        <Col>
          <Form.Select
            value={list_value['font_family'][0]?ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'font_family',menu_for_style) as string:''}
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => AssignLinkValueToCorrectVar(d,'font_family', evt.target.value,menu_for_style))
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
        </Col>
        <Col>
          <Row>
            <Col>
              <FormControl
                min={11}
                type={'number'}
                disabled={!list_value['label_visible'][0]}
                value={allNodeLabelFontSize()}
                onChange={evt => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>{
                    AssignLinkValueToCorrectVar(d,'label_font_size',+evt.target.value,menu_for_style)
                  })
                  set_data({ ...data })
                }}
              />
            </Col>
            <Col xs={4}>
              <Form.Label>px</Form.Label>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row>
        <span className='title_grp_attributes'>Position</span>
      </Row>

      {/* Positionnement lateral des label */}
      <Row>
        <Col>
          <Form.Label>
            {t('Flux.label.pos')}{(IsLinkDiplayingValueLocal(multi_selected_links,'label_position',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
          </Form.Label>
        </Col>
        {/* Vers le début  */}

        <Col>
          <ButtonGroup style={{width:'50%'}}>
            <OverlayTrigger
              key={'flux.label.tooltips.6'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.6'}>{t('Flux.label.tooltips.deb')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={!list_value['label_position'][1] && list_value['label_position'][0]==='beginning'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      const orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'label_position','beginning',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                      delete d.x_label
                      delete d.y_label
                    })
                    set_data({ ...data })
                  }}>
                <FaAlignLeft/>
              </Button>
            </OverlayTrigger>

            {/* Vers le milieu  */}
            <OverlayTrigger
              key={'flux.label.tooltips.7'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.7'}>{t('Flux.label.tooltips.milieu_h')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={!list_value['label_position'][1] && list_value['label_position'][0]==='middle'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      const orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'label_position','middle',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                      delete d.x_label
                      delete d.y_label
                    })
                    set_data({ ...data })
                  }}>
                <FaAlignCenter/>
              </Button>
            </OverlayTrigger>

            {/* Vers la fin du flux  */}
            <OverlayTrigger
              key={'flux.label.tooltips.8'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.8'}>{t('Flux.label.tooltips.fin')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={!list_value['label_position'][1] && list_value['label_position'][0]==='end'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      const orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'label_position','end',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                      delete d.x_label
                      delete d.y_label
                    })
                    set_data({ ...data })
                  }}>
                <FaAlignRight/>
              </Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Positionnement vertical des label  */}
          <ButtonGroup style={{width:'50%'}}>
            {/* Positionnement au dessous  */}
            <OverlayTrigger
              key={'flux.label.tooltips.9'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.9'}>{t('Flux.label.tooltips.dessous')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={!isAllLinksLabelPosOrthAuto['label_pos_auto'][0] &&!list_value['orthogonal_label_position'][1] && list_value['orthogonal_label_position'][0]==='below'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      d.label_pos_auto=false
                      const lab_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'orthogonal_label_position','below',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                      delete d.x_label
                      delete d.y_label
                    })
                    set_data({ ...data })
                  }}>
                {svg_label_bottom}
              </Button>
            </OverlayTrigger>

            {/* Positionnement au milieu  */}
            <OverlayTrigger
              key={'flux.label.tooltips.10'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.10'}>{t('Flux.label.tooltips.milieu_v')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={!isAllLinksLabelPosOrthAuto['label_pos_auto'][0] && !list_value['orthogonal_label_position'][1] && list_value['orthogonal_label_position'][0]==='middle'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      d.label_pos_auto=false
                      const lab_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'orthogonal_label_position','middle',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                      delete d.x_label
                      delete d.y_label
                    })
                    set_data({ ...data })
                  }}>
                {svg_label_center}
              </Button>
            </OverlayTrigger>

            {/* Positionnement au dessus  */}
            <OverlayTrigger
              key={'flux.label.tooltips.11'}
              placement={'top'}
              delay={500}
              overlay={<Tooltip id={'flux.label.tooltips.11'}>{t('Flux.label.tooltips.dessus')} </Tooltip>}>
              <Button
                className='btn_menu_config'
                variant={!isAllLinksLabelPosOrthAuto['label_pos_auto'][0] && !list_value['orthogonal_label_position'][1] && list_value['orthogonal_label_position'][0]==='above'?'primary':'outline-primary'}
                onClick={
                  () => {
                    Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                      d.label_pos_auto=false
                      const lab_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'orthogonal_label_position','above',menu_for_style)
                      AssignLinkValueToCorrectVar(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                      delete d.x_label
                      delete d.y_label
                    })
                    set_data({ ...data })
                  }}>
                {svg_label_top}
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
        </Col>
      </Row>

      {/* Orienter le texte du label le long du flux  */}
      <Row className='input_row'>
        <Col>
          <OverlayTrigger
            key={'flux.label.tooltips.5'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.5'}>{t('Flux.label.tooltips.acf')} </Tooltip>}>
            <Checkbox
              sx={SmoothClasses({})}
              iconColor={list_value['label_on_path'][1]?'#78C2AD':'white'}
              isIndeterminate={list_value['label_on_path'][1]}
              isChecked={list_value['label_on_path'][0] as boolean}
              onChange={(evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'label_on_path',evt.target.checked,menu_for_style)
                  if(evt.target.checked){
                    const l_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                    const l_orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                    AssignLinkValueToCorrectVar(d,'label_position',(l_pos=='frozen')?'middle':l_pos,menu_for_style)
                    AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(l_orth_pos=='frozen')?'middle':l_orth_pos,menu_for_style)
                    delete d.x_label
                    delete d.y_label
                  }
                })
                set_data({ ...data })
              }}>
              {t('Flux.label.acf')+' '}
              {(IsLinkDiplayingValueLocal(multi_selected_links,'label_on_path',menu_for_style)?
                TooltipValueSurcharge('link_var_',t):<></>)}
            </Checkbox>
          </OverlayTrigger>
        </Col>
      </Row>

      {/* Positionnement à la souris  */}
      <Row className='input_row'>
        <Col>
          <OverlayTrigger
            key={'flux.label.tooltips.12'}
            placement={'top'}
            delay={500}
            overlay={<Tooltip id={'flux.label.tooltips.12'}>{t('Flux.label.tooltips.pls')} </Tooltip>}>
            <Checkbox
              sx={SmoothClasses({})}
              iconColor={label_link_free_checked[1]?'#78C2AD':'white'}
              isIndeterminate={label_link_free_checked[1]}
              isChecked={label_link_free_checked[0]}
              onChange={(evt) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  const l_o_p=ReturnCorrectLinkAttributeValue(data,d,'label_on_path',menu_for_style)
                  AssignLinkValueToCorrectVar(d,'label_on_path',((evt.target.checked)?false:l_o_p),menu_for_style)
                  AssignLinkValueToCorrectVar(d,'label_position',(evt.target.checked)?'frozen':'middle',menu_for_style)
                  AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(evt.target.checked)?'frozen':'middle',menu_for_style)
                })
                set_data({ ...data })
              }}>
              {t('Flux.label.pls')+' '}
              {(IsLinkDiplayingValueLocal(multi_selected_links,'label_position',menu_for_style)?
                TooltipValueSurcharge('link_var_',t):<></>)}
            </Checkbox>
          </OverlayTrigger>
        </Col>
      </Row></>:<></>}
  </>

  const content_style=(!menu_for_style)?<><Row>
    <Col><Form.Label>{t('Flux.style')}</Form.Label></Col>
    <Col>
      {/* Choix du style  */}
      <Dropdown>
        <Dropdown.Toggle variant="outline-primary" id="dropdown-basic"
          className='btn_menu_config'
        >{style_of_selected_links()}</Dropdown.Toggle>
        <Dropdown.Menu>
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
    </Col>

    <Col>
      
      {/* Appliquer le style  */}
      <OverlayTrigger
        key={'Menu.tooltips.flux.as'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'Menu.tooltips.flux.as'}>{t('Flux.tooltips.as')} </Tooltip>}>
        <Button
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
    </Col>

  </Row>
  <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
  </>:<></>
  const content_zIndex_and_direction=(!menu_for_style)?<>

    <Row>
      <span className='title_grp_attributes'>{t('Flux.FS')}</span>
    </Row>

    <Row className='input_row'>
      <Col><Form.Label style={{
        color:(multi_selected_links.current.length != 1)?'#666666':'',
        backgroundColor:(multi_selected_links.current.length != 1)?'#cccccc':''
      }}>
        {t('Flux.dzf')}
      </Form.Label></Col>
      {/* Boutton pour monter le lien sélctionné */}
      <ButtonGroup as={Col}>
        <OverlayTrigger
          key={'Menu.tooltips.flux.up'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.up'}>{t('Flux.tooltips.up')} </Tooltip>}>
          <Button
            className='btn_menu_config'
            variant="outline-primary"
            disabled={multi_selected_links.current.length != 1}
            onClick={() => {
              multi_selected_links.current.map(l => {
                handleDownLink(data,l.idLink)
              })
              set_data({ ...data })
            }}>
            <FaAngleUp/>
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          key={'Menu.tooltips.flux.upup'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.upup'}>{t('Flux.tooltips.upup')} </Tooltip>}>
          <Button  variant="outline-primary" disabled={multi_selected_links.current.length<1}
            className='btn_menu_config'
            onClick={() => {
              const tab_toshift:string[]=[]
              const list_link_id_selected=multi_selected_links.current.map(l=>l.idLink)

              data.linkZIndex.filter(l=>list_link_id_selected.includes(l)).forEach(l=>{
                const posElemt = data.linkZIndex.indexOf(l)
                tab_toshift.push(data.linkZIndex.splice(posElemt, 1)[0])
              })
              tab_toshift.forEach(l=>data.linkZIndex.push(l))
              set_data({ ...data })
            }}>
            <FaAngleDoubleUp />
          </Button>
        </OverlayTrigger>

        {/* Boutton pour baisser le lien sélctionné */}
        <OverlayTrigger
          key={'Menu.tooltips.flux.dwn'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.dwn'}>{t('Flux.tooltips.dwn')} </Tooltip>}>
          <Button  variant="outline-primary" disabled={multi_selected_links.current.length != 1}
            className='btn_menu_config'
            onClick={() => {
              multi_selected_links.current.map(l => {
                handleUpLink(data,l.idLink)
              })
              set_data({ ...data })

            }}>
            <FaAngleDown />
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          key={'Menu.tooltips.flux.dwndwn'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'Menu.tooltips.flux.dwndwn'}>{t('Flux.tooltips.dwndwn')} </Tooltip>}>
          <Button  variant="outline-primary" disabled={multi_selected_links.current.length<1}
            className='btn_menu_config'
            onClick={() => {
              const tab_toshift:string[]=[]
              const list_link_id_selected=multi_selected_links.current.map(l=>l.idLink)

              data.linkZIndex.filter(l=>list_link_id_selected.includes(l)).forEach(l=>{
                const posElemt = data.linkZIndex.indexOf(l)
                tab_toshift.push(data.linkZIndex.splice(posElemt, 1)[0])
              })
              const reverse_linkzindex=data.linkZIndex.reverse();
              (tab_toshift.reverse()).forEach(l=>reverse_linkzindex.push(l))
              data.linkZIndex=reverse_linkzindex.reverse()
              set_data({ ...data })

            }}>
            <FaAngleDoubleDown />
          </Button>
        </OverlayTrigger>
      </ButtonGroup>
    </Row>
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
  </>:<></>



  const content= <div className='apparence_config'>
    {content_style}
    {content_zIndex_and_direction}

    {content_appearence}
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    {content_label}
  </div>

  /* Formattage de l'affichage du menu attribut de flux */
  return menu_for_modal?content:<Tab key="flux_attributes" eventKey="flux_attributes" className='content_editon_elements' title={t('Flux.apparence.apparence')}>{content}</Tab>
}

//Dépalce la place des flux sélectionnés vers le début dans le tableau de flux de data
//Permet donc de les déssiner avant
export const handleUpLink : handleUpLinkFType = (
  data:SankeyData,i: string
) => {
  const posElemt = data.linkZIndex.indexOf(i)
  data.linkZIndex.splice(posElemt, 1)
  data.linkZIndex.splice(posElemt-1, 0, i)
}

//Dépalce la place des flux sélectionnés vers la fin dans le tableau de flux de data
//Permet donc de les déssiner après
export const handleDownLink : handleDownLinkFType = (
  data:SankeyData,i: string
) => {
  const posElemt = data.linkZIndex.indexOf(i)
  data.linkZIndex.splice(posElemt, 1)
  data.linkZIndex.splice(posElemt+1, 0, i)
}
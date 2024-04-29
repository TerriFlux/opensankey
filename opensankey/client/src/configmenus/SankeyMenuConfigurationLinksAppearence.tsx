import React,{FunctionComponent, MutableRefObject, useRef, useState} from 'react'
import { SankeyData, SankeyLink, SankeyLinkAttrLocal, SankeyLinkStyle } from '../types/Types'
import { FaAlignLeft, FaAlignCenter, FaAlignRight, FaEyeSlash, FaEye, FaChevronDown, FaUndo } from 'react-icons/fa'
import { FaAngleDoubleDown, FaAngleDoubleUp, FaAngleDown, FaAngleUp } from 'react-icons/fa'

import { Box, Button, Checkbox, Input, InputGroup, InputRightAddon, Menu, MenuButton, MenuItem, MenuList, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select } from '@chakra-ui/react'

import { ReturnCorrectLinkAttributeValue,AssignLinkValueToCorrectVar,IsAllLinkAttrSameValue,IsLinkDiplayingValueLocal,CutName,TooltipValueSurcharge, IsAllLinkNotLocalAttrSameValue, OSTooltip} from './SankeyUtils'
import { MenuConfigurationLinksAppearenceFType, handleDownLinkFType, handleUpLinkFType } from './types/SankeyMenuConfigurationLinksAppearenceTypes'

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
  link_function,
  ComponentUpdater,
)=>{
  const {t}=applicationContext
  const {data}=dict_variable_application_data
  const {ref_selected_style_link,multi_selected_links}=dict_variable_elements_selected
  const parameter_to_modify=(menu_for_style)?data.style_link:data.links
  const selected_parameter=(menu_for_style)?[data.style_link[ref_selected_style_link.current]]:multi_selected_links.current
  const [, set_style_to_apply_to_link] = useState('default')
  const {updateComponentMenuConfigLink}=ComponentUpdater

  const element_to_update=menu_for_style?Object.values(dict_variable_application_data.display_links):multi_selected_links.current

  const updateMenuConfigLink=()=>{
    ComponentUpdater.updateComponenSaveInCache.current(false)
    link_function.RedrawLinks(element_to_update)
    updateComponentMenuConfigLink.current()
  }
  const list_key=['dashed','label_on_path','to_precision','custom_digit','label_unit_visible',
    'label_visible','font_family','recycling','arrow','curved',
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
        return (inchangee) ? CutName(data.style_link[style_to_display].name, 25 ) : 'Multiple style parmi les noeuds sélectionnés'
      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  const content_appearence =<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_2'
    >
      {t('Menu.edition')}
    </Box>

    {/* Flux en recyclage  */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
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
          updateMenuConfigLink()              }}>
      <OSTooltip label={t('Flux.apparence.tooltips.recy')}>{t('Flux.apparence.recy')}
      </OSTooltip>
    </Checkbox>

    {/* Orientation du flux */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.of')}{(IsLinkDiplayingValueLocal(multi_selected_links,'orientation',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
      </Box>
      <Box layerStyle='options_4cols' >
        {/* Horizontal - Horizontal  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_hh')}>
          <Button
            className='btn_menu_config'
            value='hh'
            variant={linkOrientation('hh')?'menuconfigpanel_option_button_activated_left':
              'menuconfigpanel_option_button_left'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','hh',menu_for_style)

                })
                updateMenuConfigLink()
              }}>{logo_hh}</Button>
        </OSTooltip>

        {/* Vertical - Verticale  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_vv')}>
          <Button
            className='btn_menu_config'

            value='vv'
            variant={linkOrientation('vv')?'menuconfigpanel_option_button_activated_center':
              'menuconfigpanel_option_button_center'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','vv',menu_for_style)
                })
                updateMenuConfigLink()              }}>{logo_vv}</Button>
        </OSTooltip>

        {/* Vertical - Horizontal  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_vh')}>
          <Button
            className='btn_menu_config'

            value='vh'
            variant={linkOrientation('vh')?'menuconfigpanel_option_button_activated_center':
              'menuconfigpanel_option_button_center'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','vh',menu_for_style)
                })
                updateMenuConfigLink()              }}>{logo_vh}</Button>
        </OSTooltip>

        {/* Horizontal - Vertical  */}
        <OSTooltip label={t('Flux.apparence.tooltips.of_hv')}>
          <Button
            className='btn_menu_config'

            value='hv'
            variant={linkOrientation('hv')?'menuconfigpanel_option_button_activated_right':
              'menuconfigpanel_option_button_right'}
            onClick={
              () =>{
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                  AssignLinkValueToCorrectVar(d,'orientation','hv',menu_for_style)
                })
                updateMenuConfigLink()              }}>{logo_hv}</Button>
        </OSTooltip>
      </Box>
    </Box>

    {/* Forme fleche droite  */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      iconColor={list_value['arrow'][1]?'#78C2AD':'white'}
      isIndeterminate={list_value['arrow'][1]}
      isChecked={list_value['arrow'][0] as boolean}
      onChange={
        (evt) => {
          Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d =>AssignLinkValueToCorrectVar(d,'arrow',evt.target.checked,menu_for_style)
          )
          updateMenuConfigLink()
        }
      }>    
      <OSTooltip label={t('Flux.apparence.tooltips.fleche')}>
        {t('Flux.apparence.fleche')}    
      </OSTooltip>
    </Checkbox>


    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.arrow_size')}{(IsLinkDiplayingValueLocal(multi_selected_links,'arrow_size',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <OSTooltip label={t('Flux.apparence.tooltips.arrow_size')}>
            
          <ConfigLinkAttributeNumberInput
            data={dict_variable_application_data.data}
            local_var_of_node={'arrow_size'}
            parameter_to_modify={parameter_to_modify}
            selected_parameter={selected_parameter}
            menu_for_style={menu_for_style}
            minimum_value={1}
            stepper={true}
            function_onBlur={updateMenuConfigLink}
          />
        </OSTooltip>
      </InputGroup>
    </Box>

    {/* Forme courbée  */}

    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      iconColor={list_value['curved'][1]?'#78C2AD':'white'}
      isIndeterminate={list_value['curved'][1]}
      isChecked={list_value['curved'][0] as boolean}
      onChange={
        (evt) => {
          Object.values(parameter_to_modify)
            .filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink))
            .map(d => AssignLinkValueToCorrectVar(d,'curved',evt.target.checked,menu_for_style))
          updateMenuConfigLink()              }}>
      <OSTooltip label={t('Flux.apparence.tooltips.courbe')}>
        {t('Flux.apparence.courbe')}
      </OSTooltip>
    </Checkbox>



    {/* Modification du rayon de courbure du flux  */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.courbure')}{(IsLinkDiplayingValueLocal(multi_selected_links,'curvature',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <OSTooltip label={t('Flux.apparence.tooltips.courbure')}>
            
          <ConfigLinkAttributeNumberInput
            data={dict_variable_application_data.data}
            local_var_of_node={'curvature'}
            parameter_to_modify={parameter_to_modify}
            selected_parameter={selected_parameter}
            menu_for_style={menu_for_style}
            minimum_value={0}
            maximum_value={1}
            step={0.01}
            stepper={true}
            function_onBlur={updateMenuConfigLink}
          />
        </OSTooltip>
      </InputGroup>
    </Box>
  
    {/* Positionnement du centre du flux  */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.pdc')}
      </Box>

      <OSTooltip label={t('Flux.apparence.tooltips.pdc')}>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <NumberInput
            variant='menuconfigpanel_option_numberinput_with_right_addon'
            min={0}
            max={1}
            step={0.01}
            value={Math.round(shiftCenter()*100)}
            isDisabled={(linkOrientation('hv')||linkOrientation('vh'))}
            onChange={
              (_,val) => {
                const center = val/100
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
                updateMenuConfigLink()}}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
            </NumberInputStepper>
          </NumberInput>
          <InputRightAddon>
              %
          </InputRightAddon>
        </InputGroup>
      </OSTooltip>
    </Box>


    {/* Distance des poignée */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.eep')}{(IsLinkDiplayingValueLocal(multi_selected_links,'left_horiz_shift',menu_for_style)&&IsLinkDiplayingValueLocal(multi_selected_links,'right_horiz_shift',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
      </Box>

      <OSTooltip label={t('Flux.apparence.tooltips.eep')}>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <NumberInput
            variant='menuconfigpanel_option_numberinput_with_right_addon'
            min={0} max={50}
            value={Math.round(shift()*100)}
            isDisabled={(linkOrientation('hv')||linkOrientation('vh'))}
            onChange={
              (_,val) => {
                const shift_gap = val/100
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
                updateMenuConfigLink()}}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
            </NumberInputStepper>
          </NumberInput>
          <InputRightAddon>
              %
          </InputRightAddon>
        </InputGroup>
      </OSTooltip>
    </Box>

    {/* Choix de la couleur du flux */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.couleur')}{(IsLinkDiplayingValueLocal(multi_selected_links,'color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
      </Box>
      <Input
        variant='menuconfigpanel_option_input_color'
        type='color'
        value={(selected_parameter.length == 1) ? (ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'color',menu_for_style) as string) : '#ffffff'}
        onChange={
          evt => {
            const color = evt.target.value
            Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => AssignLinkValueToCorrectVar(d,'color',color,menu_for_style))
            updateMenuConfigLink()          }}
      />
    </Box>


    {/* Opacité */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Flux.apparence.opacity')}{(IsLinkDiplayingValueLocal(multi_selected_links,'opacity',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
      </Box>
      <InputGroup
        variant='menuconfigpanel_option_input'
      >
        <OSTooltip label={t('Flux.apparence.tooltips.opacity')}>
          <ConfigLinkAttributeNumberInput
            data={dict_variable_application_data.data}
            local_var_of_node={'opacity'}
            parameter_to_modify={parameter_to_modify}
            selected_parameter={selected_parameter}
            menu_for_style={menu_for_style}
            minimum_value={0}
            maximum_value={1}
            step={0.1}
            stepper={true}
            function_onBlur={updateMenuConfigLink}
          />
        </OSTooltip>
      </InputGroup>
    </Box>

    {/* Flux hachuré */}


    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      iconColor={list_value['dashed'][1]?'#78C2AD':'white'}
      isIndeterminate={list_value['dashed'][1]}
      isChecked={list_value['dashed'][0] as boolean}
      onChange={(evt) => {
        Object.values(parameter_to_modify)
          .filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink))
          .forEach(d => AssignLinkValueToCorrectVar(d,'dashed',evt.target.checked,menu_for_style))
        updateMenuConfigLink()            }}>
      <OSTooltip label={t('Flux.apparence.tooltips.hach')}>
        {t('Flux.apparence.hach')+' '}
      </OSTooltip>
      {IsLinkDiplayingValueLocal(multi_selected_links,'dashed',menu_for_style)?TooltipValueSurcharge('link_var_',t):<></>}
    </Checkbox>


    {additional_link_appearence_items}

  </Box>

  const content_label=<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >

      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'

        icon={list_value['label_visible'][0] as boolean?<FaEye/>:<FaEyeSlash/>}
        iconColor={list_value['label_visible'][1]?'#78C2AD':'white'}
        isIndeterminate={list_value['label_visible'][1]}
        isChecked={list_value['label_visible'][0] as boolean}
        onChange={(evt) => {
          Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
            AssignLinkValueToCorrectVar(d,'label_visible',evt.target.checked,menu_for_style)
          })
          updateMenuConfigLink()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.label')}>
          {t('Flux.label.vdb')+' '}
        </OSTooltip>
        {(IsLinkDiplayingValueLocal(multi_selected_links,'label_visible',menu_for_style)?
          TooltipValueSurcharge('link_var_',t):<></>)}
      </Checkbox>
    </Box>
    {list_value['label_visible'][0] as boolean?<>

      {/* Choose number of significant number */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Flux.label.NbPrecision')}
        </Box>
        <OSTooltip label={t('Flux.label.tooltips.NbPrecision')}>

          <ConfigLinkAttributeNumberInput
            data={dict_variable_application_data.data}
            local_var_of_node={'scientific_precision'}
            parameter_to_modify={parameter_to_modify}
            selected_parameter={selected_parameter}
            menu_for_style={menu_for_style}
            minimum_value={0}
            stepper={true}
            function_onBlur={updateMenuConfigLink}
          />
        </OSTooltip>
      </Box>

      {/* Choix d'affichage en notation scientifique  */}


      <Checkbox
        variant='menuconfigpanel_option_checkbox'              iconColor={list_value['to_precision'][1]?'#78C2AD':'white'}
        isIndeterminate={list_value['to_precision'][1]}
        isChecked={list_value['to_precision'][0] as boolean}
        onChange={(evt) => {
          Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
            AssignLinkValueToCorrectVar(d,'custom_digit',false,menu_for_style)
            AssignLinkValueToCorrectVar(d,'to_precision',evt.target.checked,menu_for_style)
          })
          updateMenuConfigLink()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.toPrecision')}>
          {t('Flux.label.toPrecision')+' '}
        </OSTooltip>
        {(IsLinkDiplayingValueLocal(multi_selected_links,'to_precision',menu_for_style)?
          TooltipValueSurcharge('link_var_',t):<></>)}

      </Checkbox>


      {list_value['to_precision'][0]?<>
      </>:<></>}

      {/* Choix d'affichage du nombre de chiffre après la virgule  */}


      <Checkbox
        variant='menuconfigpanel_option_checkbox'              iconColor={list_value['custom_digit'][1]?'#78C2AD':'white'}
        isIndeterminate={list_value['custom_digit'][1]}
        isChecked={list_value['custom_digit'][0] as boolean}
        onChange={(evt) => {
          Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
            AssignLinkValueToCorrectVar(d,'to_precision',false,menu_for_style)
            AssignLinkValueToCorrectVar(d,'custom_digit',evt.target.checked,menu_for_style)
          })
          updateMenuConfigLink()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.custom_digit')}>
          {t('Flux.label.custom_digit')+' '}
        </OSTooltip>
        {(IsLinkDiplayingValueLocal(multi_selected_links,'custom_digit',menu_for_style)?
          TooltipValueSurcharge('link_var_',t):<></>)}

      </Checkbox>

      {list_value['custom_digit'][0]?<>
        {/* Choose number of custom digit */}
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.label.NbDigit')}
          </Box>

          <OSTooltip label={t('Flux.label.tooltips.NbDigit')}>

            <ConfigLinkAttributeNumberInput
              data={dict_variable_application_data.data}
              local_var_of_node={'nb_digit'}
              parameter_to_modify={parameter_to_modify}
              selected_parameter={selected_parameter}
              menu_for_style={menu_for_style}
              minimum_value={0}
              stepper={true}
              function_onBlur={updateMenuConfigLink}
            />
          </OSTooltip>
        </Box></>:<></>}

      {/* Ajout une unité au label de flux */}

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        iconColor={list_value['label_unit_visible'][1]?'#78C2AD':'white'}
        icon={list_value['label_unit_visible'][0] as boolean?<FaEye/>:<FaEyeSlash/>}
        isChecked={list_value['label_unit_visible'][0] as boolean}
        onChange={(evt) => {
          Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
            AssignLinkValueToCorrectVar(d,'label_unit_visible',evt.target.checked,menu_for_style)
          })
          updateMenuConfigLink()
        }}>      
        <OSTooltip label={t('Flux.label.tooltips.l_u_v')}>
          {t('Flux.label.l_u_v')+' '}
        </OSTooltip>
        {(IsLinkDiplayingValueLocal(multi_selected_links,'label_unit_visible',menu_for_style)?
          TooltipValueSurcharge('link_var_',t):<></>)}

      </Checkbox>


      {/* Modifie l'unité du label de flux */}
      {list_value['label_unit_visible'][0]?<>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.label.l_u')}{(IsLinkDiplayingValueLocal(multi_selected_links,'label_unit',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
          </Box>
          <OSTooltip label={t('Flux.label.tooltips.l_u')}>
            <Input
              variant='menuconfigpanel_option_input'
              value={ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'label_unit',menu_for_style) as string}
              onChange={evt => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => AssignLinkValueToCorrectVar(d,'label_unit',evt.target.value,menu_for_style))
                updateMenuConfigLink()
              }}/>
          </OSTooltip>
        </Box>
      </>:<></>}
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
          {t('Menu.edition')}
        </Box>

        {/* Couleur des Labels  */}
        <Box layerStyle='options_3cols' >

          {/* Label en noir  */}
          <OSTooltip label={t('Flux.label.tooltips.len')}>
            <Button
              
              disabled={!list_value['label_visible'][0]}
              variant={!list_value['text_color'][1] && list_value['text_color'][0]==='black'?'menuconfigpanel_option_button_activated_left':'menuconfigpanel_option_button_left'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    AssignLinkValueToCorrectVar(d,'text_color','black',menu_for_style)
                  })
                  updateMenuConfigLink()
                }}>{t('Flux.label.len')}{(IsLinkDiplayingValueLocal(multi_selected_links,'text_color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Button>
          </OSTooltip>

          {/* Label en blanc  */}
          <OSTooltip label={t('Flux.label.tooltips.lb')}>
            <Button
              disabled={!list_value['label_visible'][0]}
              variant={!list_value['text_color'][1] && list_value['text_color'][0]==='white'?'menuconfigpanel_option_button_activated_center':'menuconfigpanel_option_button_center'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    AssignLinkValueToCorrectVar(d,'text_color','white',menu_for_style)
                  })
                  updateMenuConfigLink()
                }}>{t('Flux.label.lb')}{(IsLinkDiplayingValueLocal(multi_selected_links,'text_color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Button>
          </OSTooltip>

          {/* Label en couleur  */}
          <OSTooltip label={t('Flux.label.tooltips.lec')}>
            <Button
              
              disabled={!list_value['label_visible'][0]}
              variant={!list_value['text_color'][1] && list_value['text_color'][0]==='color'?'menuconfigpanel_option_button_activated_right':'menuconfigpanel_option_button_right'}
              onClick={
                () => {
                  Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                    AssignLinkValueToCorrectVar(d,'text_color','color',menu_for_style)
                  })
                  updateMenuConfigLink()
                }}>{t('Flux.label.lec')}{(IsLinkDiplayingValueLocal(multi_selected_links,'text_color',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}</Button>
          </OSTooltip>
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_part_title_3' >
      Police
        </Box>
        {/* Police des labels de flux  */}
        <Box
          layerStyle='options_2cols'
        >
          <Select
            variant='menuconfigpanel_option_select'
            value={list_value['font_family'][0]?ReturnCorrectLinkAttributeValue(data,selected_parameter[0],'font_family',menu_for_style) as string:''}
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => {
                Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).forEach(d => AssignLinkValueToCorrectVar(d,'font_family', evt.target.value,menu_for_style))
                link_function.RedrawLinks(multi_selected_links.current)
              }}>
            {data.display_style.font_family.map((d) => {
              return <option
                style={{fontFamily:d}}
                key={'ff-' + d}
                value={d}
              >{d}</option>
            })}
          </Select>

          <ConfigLinkAttributeNumberInput
            data={dict_variable_application_data.data}
            local_var_of_node={'label_font_size'}
            parameter_to_modify={parameter_to_modify}
            selected_parameter={selected_parameter}
            menu_for_style={menu_for_style}
            minimum_value={11}
            stepper={true}
            unitText='pixels'
            function_onBlur={updateMenuConfigLink}
          />
        </Box>

        <Box as='span' layerStyle='menuconfigpanel_part_title_2' >
      Position
        </Box>

        {/* Positionnement lateral des label */}
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.label.pos')}{(IsLinkDiplayingValueLocal(multi_selected_links,'label_position',menu_for_style)?<>{TooltipValueSurcharge('link_var_',t)}</>:<></>)}
          </Box>
          <Box
            layerStyle='options_2cols'
          >
            <Box layerStyle='options_3cols' >
            
              {/* Vers le début  */}
              <OSTooltip label={t('Flux.label.tooltips.deb')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={!list_value['label_position'][1] && list_value['label_position'][0]==='beginning'?'menuconfigpanel_option_button_activated_left':'menuconfigpanel_option_button_left'}
                  onClick={
                    () => {
                      Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                        const orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'label_position','beginning',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                        delete d.x_label
                        delete d.y_label
                        delete d.drag_label_offset
                      })
                      updateMenuConfigLink()
                    }}>
                  <FaAlignLeft/>
                </Button>
              </OSTooltip>

              {/* Vers le milieu  */}
              <OSTooltip label={t('Flux.label.tooltips.milieu_h')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={!list_value['label_position'][1] && list_value['label_position'][0]==='middle'?'menuconfigpanel_option_button_activated_center':'menuconfigpanel_option_button_center'}
                  onClick={
                    () => {
                      Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                        const orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'label_position','middle',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                        delete d.x_label
                        delete d.y_label
                        delete d.drag_label_offset
                      })
                      updateMenuConfigLink()
                    }}>
                  <FaAlignCenter/>
                </Button>
              </OSTooltip>

              {/* Vers la fin du flux  */}
              <OSTooltip label={t('Flux.label.tooltips.fin')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={!list_value['label_position'][1] && list_value['label_position'][0]==='end'?'menuconfigpanel_option_button_activated_right':'menuconfigpanel_option_button_right'}
                  onClick={
                    () => {
                      Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                        const orth_pos=ReturnCorrectLinkAttributeValue(data,d,'orthogonal_label_position',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'label_position','end',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'orthogonal_label_position',(orth_pos=='frozen')?'middle':orth_pos,menu_for_style)
                        delete d.x_label
                        delete d.y_label
                        delete d.drag_label_offset
                      })
                      updateMenuConfigLink()
                    }}>
                  <FaAlignRight/>
                </Button>
              </OSTooltip>
            </Box>
            <Box layerStyle='options_3cols' >

              {/* Positionnement vertical des label  */}
              {/* Positionnement au dessous  */}
              <OSTooltip label={t('Flux.label.tooltips.dessous')}>
                <Button
                
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={!isAllLinksLabelPosOrthAuto['label_pos_auto'][0] &&!list_value['orthogonal_label_position'][1] && list_value['orthogonal_label_position'][0]==='below'?'menuconfigpanel_option_button_activated_left':'menuconfigpanel_option_button_left'}
                  onClick={
                    () => {
                      Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_pos_auto=false
                        const lab_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'orthogonal_label_position','below',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                        delete d.x_label
                        delete d.y_label
                        delete d.drag_label_offset
                      })
                      updateMenuConfigLink()
                    }}>
                  {svg_label_bottom}
                </Button>
              </OSTooltip>

              {/* Positionnement au milieu  */}
              <OSTooltip label={t('Flux.label.tooltips.milieu_v')}>
                <Button
                
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={!isAllLinksLabelPosOrthAuto['label_pos_auto'][0] && !list_value['orthogonal_label_position'][1] && list_value['orthogonal_label_position'][0]==='middle'?'menuconfigpanel_option_button_activated_center':'menuconfigpanel_option_button_center'}
                  onClick={
                    () => {
                      Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_pos_auto=false
                        const lab_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'orthogonal_label_position','middle',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                        delete d.x_label
                        delete d.y_label
                        delete d.drag_label_offset
                      })
                      updateMenuConfigLink()
                    }}>
                  {svg_label_center}
                </Button>
              </OSTooltip>

              {/* Positionnement au dessus  */}
              <OSTooltip label={t('Flux.label.tooltips.dessus')}>
                <Button
                  paddingStart='0'
                  paddingEnd='0'
                  minWidth='0'
                  variant={!isAllLinksLabelPosOrthAuto['label_pos_auto'][0] && !list_value['orthogonal_label_position'][1] && list_value['orthogonal_label_position'][0]==='above'?'menuconfigpanel_option_button_activated_right':'menuconfigpanel_option_button_right'}
                  onClick={
                    () => {
                      Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
                        d.label_pos_auto=false
                        const lab_pos=ReturnCorrectLinkAttributeValue(data,d,'label_position',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'orthogonal_label_position','above',menu_for_style)
                        AssignLinkValueToCorrectVar(d,'label_position',(lab_pos=='frozen')?'middle':lab_pos,menu_for_style)
                        delete d.x_label
                        delete d.y_label
                        delete d.drag_label_offset
                      })
                      updateMenuConfigLink()
                    }}>
                  {svg_label_top}
                </Button>
              </OSTooltip>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Orienter le texte du label le long du flux  */}

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
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
              delete d.drag_label_offset
            }
          })
          updateMenuConfigLink()
        }}>
        <OSTooltip label={t('Flux.label.tooltips.acf')}>
          {t('Flux.label.acf')+' '}
        </OSTooltip>
        {(IsLinkDiplayingValueLocal(multi_selected_links,'label_on_path',menu_for_style)?
          TooltipValueSurcharge('link_var_',t):<></>)}
      </Checkbox>
    </>:<></>}
  </Box>


  const content_style=(!menu_for_style)?<Box
    layerStyle='menuconfigpanel_grid'
  ><Box
      layerStyle='menuconfigpanel_row_stylechoice'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        textStyle='h3'
      >
        {t('Noeud.Style')}
      </Box>
      <Menu>
        <MenuButton
          as={Button}
          variant='menuconfigpanel_option_button'
          rightIcon={<FaChevronDown />}>
          {style_of_selected_links()}
        </MenuButton>
        <MenuList>
          {Object.keys(data.style_link).map((d,i) => {
            return (
              <MenuItem
                key={i}
                onClick={() => {
                  set_style_to_apply_to_link(d)
                  multi_selected_links.current.map(n => {
                    n.style = d
                  })
                  updateMenuConfigLink()
                }}
              >
                {data.style_link[d].name}
              </MenuItem>
            )
          })}
        </MenuList>
      </Menu>
      <OSTooltip label={t('Noeud.tooltips.AS')}
      >
        <Button
          variant='menuconfigpanel_option_button'
          onClick={() => {
            apply_style_to_selected_links()
            updateMenuConfigLink()
          }}
        >
          <FaUndo />
        </Button>
      </OSTooltip>
    </Box>
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
  </Box>:<></>


  const content_zIndex_and_direction=(!menu_for_style)?<Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_2'
    >
      {t('Flux.FS')}
    </Box>
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
      >
        {t('Flux.dzf')}
      </Box>
      <Box
        layerStyle='options_4cols'
      >
        {/* Boutton pour monter le lien sélctionné */}
        <OSTooltip label={t('Flux.tooltips.up')}>
          <Button
            className='btn_menu_config'
            variant={'menuconfigpanel_option_button_left'}
            disabled={multi_selected_links.current.length != 1}
            onClick={() => {
              multi_selected_links.current.map(l => {
                handleDownLink(data,l.idLink)
              })
              updateMenuConfigLink()
            }}>
            <FaAngleUp/>
          </Button>
        </OSTooltip>

        <OSTooltip label={t('Flux.tooltips.upup')}>
          <Button  
            variant={'menuconfigpanel_option_button_center'}
            disabled={multi_selected_links.current.length<1}
            className='btn_menu_config'
            onClick={() => {
              const tab_toshift:string[]=[]
              const list_link_id_selected=multi_selected_links.current.map(l=>l.idLink)

              data.linkZIndex.filter(l=>list_link_id_selected.includes(l)).forEach(l=>{
                const posElemt = data.linkZIndex.indexOf(l)
                tab_toshift.push(data.linkZIndex.splice(posElemt, 1)[0])
              })
              tab_toshift.forEach(l=>data.linkZIndex.push(l))
              updateMenuConfigLink()
            }}>
            <FaAngleDoubleUp />
          </Button>
        </OSTooltip>

        {/* Boutton pour baisser le lien sélctionné */}
        <OSTooltip label={t('Flux.tooltips.dwn')}>
          <Button  
            variant={'menuconfigpanel_option_button_center'}
            disabled={multi_selected_links.current.length != 1}
            className='btn_menu_config'
            onClick={() => {
              multi_selected_links.current.map(l => {
                handleUpLink(data,l.idLink)
              })
              updateMenuConfigLink()

            }}>
            <FaAngleDown />
          </Button>
        </OSTooltip>

        <OSTooltip label={t('Flux.tooltips.dwndwn')}>
          <Button 
            variant={'menuconfigpanel_option_button_right'}
            disabled={multi_selected_links.current.length<1}
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
              updateMenuConfigLink()

            }}>
            <FaAngleDoubleDown />
          </Button>
        </OSTooltip>
      </Box>
    </Box>
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
  </Box>:<></>



  const content= <Box
    layerStyle='menuconfigpanel_grid'
  >
    {content_style}
    {content_zIndex_and_direction}

    {content_appearence}
    <hr style={{borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
    {content_label}
  </Box>

  /* Formattage de l'affichage du menu attribut de flux */
  return [content]
  // :[
  //   <Tab>
  //     <Box
  //       layerStyle='submenuconfig_tab'
  //     >
  //       {t('Flux.apparence.apparence')}
  //     </Box>
  //   </Tab>,<TabPanel 
  //     id='links_desc'
  //   >
  //     <Box layerStyle='menuconfigpanel_grid'>
      
  //       {content}
  //     </Box>
  //   </TabPanel>
  // ]

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


type ConfigLinkNumberInputType={
  data:SankeyData
  local_var_of_node: keyof SankeyLinkAttrLocal
  parameter_to_modify: {[_: string]: SankeyLinkStyle;} | {[_: string]: SankeyLink;}
  selected_parameter: SankeyLinkStyle[] | SankeyLink[]
  menu_for_style:boolean
  minimum_value?:number
  maximum_value?:number
  stepper?:boolean
  step?:number
  unitText?:string
  function_onBlur:()=>void
}
/**
 * Component developped for number input of the nodes attributs config menu
 * 
 * @param {dict_variable_application_dataType} dict_variable_application_data
 * @param {keyof SankeyNodeAttrLocal} var_of_data keyof of the variable we want to reference in the inputn the variable in SankeyData need to be a number
 * @param {{[_: string]: SankeyNodeStyle;} | {[_: string]: SankeyNode;}} parameter_to_modify multi_selected_nodes or dict of node style
 * @param {SankeyNodeStyle[] | SankeyNode[]} selected_parameter either modify node style or selected node depending on if we are in the edition of style or configuration menu
 * @param {boolean} menu_for_style Modify either the style of node or the multi_selected_nodes
 * @param {number} minimum_value (optional, if not specified it mean the value can be undefined )
 * @param {number} maximum_value (optional, if not specified it mean the value can be undefined )
 * @param {boolean} stepper (default:false) add stepper to the input to increase or decrease the value
 * @param {string} unitText (default:'') text of the addon
 * @param {function} function_onBlur function called when we leave the input, it is generally used to update the draw area
 * 
 * @return {JSX.Elmement}
 */
export const ConfigLinkAttributeNumberInput:FunctionComponent<ConfigLinkNumberInputType>=({
  data,
  local_var_of_node,
  parameter_to_modify,
  selected_parameter,
  menu_for_style,
  minimum_value,
  maximum_value,
  stepper=false,
  step=1,
  unitText,
  function_onBlur
})=>{
  const [update,setUpdate]=useState(false)
  const ref_input=useRef<HTMLInputElement>(null)
  const isModifying:MutableRefObject<NodeJS.Timeout|undefined>=useRef<NodeJS.Timeout>()
  let val=0
  const variantOfInput=unitText?'menuconfigpanel_option_numberinput_with_right_addon':'menuconfigpanel_option_numberinput'
  
  if(selected_parameter[0]){
    val=ReturnCorrectLinkAttributeValue(data,selected_parameter[0],local_var_of_node,menu_for_style) as number
    if (val == null) {
      //TODO investigate
      val = 0
    }
  }

  // Add stepper addon if specified
  const stepperBtn=stepper?<NumberInputStepper>
    <NumberIncrementStepper/>
    <NumberDecrementStepper/>
  </NumberInputStepper>:<></>

  // Add unit addon if specified
  const inputUnit=unitText?<InputRightAddon>{unitText}</InputRightAddon>:<></>

  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel variant={variantOfInput} min={minimum_value} max={maximum_value} step={step} 
      value={val}
      onChange={(_,value)=>{

        Object.values(parameter_to_modify).filter(f => selected_parameter.map(d => d.idLink).includes(f.idLink)).map(d => {
          AssignLinkValueToCorrectVar(d,local_var_of_node,Number(value),menu_for_style)
        })

        if(!menu_for_style){
        // reset timeout if exist
          if(isModifying.current){
            console.log('clear timout')
            clearTimeout(isModifying.current)
          }
          // launch timeout that automatically blur the input
          isModifying.current=setTimeout(()=>{
            function_onBlur()
            ref_input.current?.blur()
          },2000)
        }

        setUpdate(!update)
      }}
      onBlur={()=>{
        if(!menu_for_style){
          clearTimeout(isModifying.current)
        }
        function_onBlur()
      }}
    >
      <NumberInputField ref={ref_input}/>
      {stepperBtn}
    </NumberInput>
    {inputUnit}
  </InputGroup>
}

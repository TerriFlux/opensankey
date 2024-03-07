import React,{useState} from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  Box,
  Checkbox,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Input,
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react'

import { OpenSankeyMenuConfigurationLayoutFType} from './types/SankeyMenuConfigurationLayoutTypes'
import { DrawLegend } from '../draw/SankeyDrawLegend'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export const OpenSankeyMenuConfigurationLayout : OpenSankeyMenuConfigurationLayoutFType = (
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  extra_background_element,
  package_for_draw_legend
) => {
  const { t } = applicationContext
  const { data, set_data} = dict_variable_application_data
  const { userScaleRef } = dict_variable_elements_selected
  const [,,contextMenu,GetLinkValue,legend_clicked]=package_for_draw_legend

  const [legend_position,set_legend_position] = useState(data.legend_position)
  const [current_legend_bg_opacity,set_current_legend_bg_opacity]=useState(data.legend_bg_opacity)
  const [,set_user_scale]=useState(data.user_scale)
  const [minimum_flux,set_minimum_flux] = useState(data.minimum_flux)
  const [maximum_flux,set_maximum_flux] = useState(data.maximum_flux)
  const [forceUpdate,setForceUpdate]=useState(false)
  const right_addon_pixel = (val: number) => {
    if (val === 1) {
      return 'pixel'
    }
    return 'pixels'
  }

  if(data.maximum_flux && data.minimum_flux && data.minimum_flux>data.maximum_flux){
    data.maximum_flux=data.minimum_flux
    set_maximum_flux(data.minimum_flux)
  }
  return [
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'>
      {t('Menu.background')}
    </Box>,

    /* Couleur du fond de la page */
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.BgC')}
      </Box>
      <OverlayTrigger
        key={'MEP.tooltips.BgC'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.BgC'}>{t('MEP.tooltips.BgC')} </Tooltip>}>
        <Input
          variant='menuconfigpanel_option_input_color'
          type='color'
          value={data.couleur_fond_sankey}
          onChange={evt=>{
            data.couleur_fond_sankey=evt.target.value
            set_data({...data})
          }}
        />
      </OverlayTrigger>
    </Box>,

    extra_background_element,

    /* Quadrillage */
    /* Afficher le quadrillage */
    <Box as='span'>
      <OverlayTrigger
        key={'MEP.tooltips.GV'}
        placement={'top'}
        delay={500}
        rootClose
        overlay={<Tooltip id={'MEP.tooltips.GV'}>{t('MEP.tooltips.GV')} </Tooltip>}>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isChecked={data.grid_visible}
          icon={data.grid_visible?<FaEye/>:<FaEyeSlash/>}
          onChange={(evt) => {
            data.grid_visible = evt.target.checked
            set_data({ ...data })
          }}
        >
          {t('MEP.TCG')}
        </Checkbox>
      </OverlayTrigger>
    </Box>,

    /* Taille de la grille */
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
      style={{display:(data.grid_visible?'':'none')}}
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.TCG_shift')}
      </Box>
      <Box>
        <OverlayTrigger
          key={'MEP.tooltips.TCG'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.TCG'}>{t('MEP.tooltips.TCG')} </Tooltip>}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={10}
              step={1}
              value={data.grid_square_size}
              onChange={value => {
                data.grid_square_size = Number(value)
                set_data({ ...data })
              }}
            >
              <NumberInputField/>
              <NumberInputStepper>
                <NumberIncrementStepper/>
                <NumberDecrementStepper/>
              </NumberInputStepper>
            </NumberInput>
            <InputRightAddon>
              pixels
            </InputRightAddon>
          </InputGroup>
        </OverlayTrigger>
      </Box>
    </Box>,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'>
      {t('MEP.links_size')}
    </Box>,

    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.Echelle')}
      </Box>
      <Box>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <NumberInput
            variant='menuconfigpanel_option_numberinput_with_right_addon'
            min={1}
            value={userScaleRef.current}
            isInvalid={userScaleRef.current != data.user_scale}
            inputMode='numeric'
            errorBorderColor='red'
            onChange={value => {
              userScaleRef.current = Number(value)
              set_user_scale(Number(value))
            }}
            onBlur={() => {
              data.user_scale = userScaleRef.current
              set_data({ ...data })
            }}
          >
            <NumberInputField/>
          </NumberInput>
          <InputRightAddon>
            {'unit. / 100 pixels'}
          </InputRightAddon>
        </InputGroup>
        {/* <FormControl.Feedback type='invalid'>
          {t('MEP.onBlur')}
        </FormControl.Feedback> */}
      </Box>
    </Box>,

    /* Taille minimale du flux */
    <Box
      layerStyle='menuconfigpanel_2row_3cols'
    >
      <Box
        layerStyle='menuconfigpanel_option_name'
        gridColumnStart='1'
        gridColumnEnd='2'
        gridRowStart='2'
        gridRowEnd='3'
      >
        {t('MEP.link_size_limit')}
      </Box>
      <Box
        layerStyle='menuconfigpanel_option_name'
        gridColumnStart='2'
        gridColumnEnd='3'
        gridRowStart='1'
        gridRowEnd='2'
        alignItems='flex-end'
      >
        {t('MEP.MinFlux')}
      </Box>
      <Box
        layerStyle='menuconfigpanel_option_name'
        gridColumnStart='3'
        gridColumnEnd='4'
        gridRowStart='1'
        gridRowEnd='2'
        alignItems='flex-end'
      >
        {t('MEP.MaxFlux')}
      </Box>
      <Box
        gridColumnStart='2'
        gridColumnEnd='3'
        gridRowStart='2'
        gridRowEnd='3'
      >
        <OverlayTrigger
          key={'MEP.tooltips.MinFlux'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.MinFlux'}>{t('MEP.tooltips.MinFlux')} </Tooltip>}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={1}
              value={minimum_flux!}
              inputMode='numeric'
              onChange={value => {
                set_minimum_flux(Number(value))
              }}
              onBlur={() => {
                data.minimum_flux = isNaN(Number(minimum_flux))?undefined:minimum_flux
                set_data({ ...data })
              }}
            >
              <NumberInputField/>
            </NumberInput>
            <InputRightAddon>
              {right_addon_pixel(minimum_flux!)}
            </InputRightAddon>
          </InputGroup>
        </OverlayTrigger>
      </Box>
      <Box
        gridColumnStart='3'
        gridColumnEnd='4'
        gridRowStart='2'
        gridRowEnd='3'
      >
        <OverlayTrigger
          key={'MEP.tooltips.MaxFlux'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'MEP.tooltips.MaxFlux'}>{t('MEP.tooltips.MaxFlux')} </Tooltip>}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={1}
              value={maximum_flux!}
              inputMode='numeric'
              onChange={value => {
                set_maximum_flux(Number(value))
              }}
              onBlur={() => {
                data.maximum_flux = maximum_flux
                set_data({ ...data })
              }}
            >
              <NumberInputField/>
            </NumberInput>
            <InputRightAddon>
              {right_addon_pixel(maximum_flux!)}
            </InputRightAddon>
          </InputGroup>
        </OverlayTrigger>
      </Box>
    </Box>,

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />,

    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'
    >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={data.mask_legend?<FaEye/>:<FaEyeSlash/>}
        isChecked={data.mask_legend}
        onChange={(evt) => {
          data.mask_legend = evt.target.checked
          set_data({ ...data })
        }}
      >
        {t('Menu.Leg')}
      </Checkbox>
    </Box>
    ,

    <Box
      layerStyle='menuconfigpanel_grid'
      style={{display:(data.mask_legend?'':'none')}}
    >
      <Box
        as='span'
        layerStyle='menuconfigpanel_part_title_2'>
        {t('MEP.leg_layout')}
      </Box>
      <Box
        as='span'
        layerStyle='menuconfigpanel_part_title_3'>
        {t('MEP.leg_layout_text')}
      </Box>

      {/* Font size de la legende*/}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_suboption_name'>
          {t('Menu.fontSize')}
        </Box>
        <OverlayTrigger
          key={'Menu.tooltips.fontSize'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.fontSize'}>{t('Menu.tooltips.fontSize')} </Tooltip>}>
          <NumberInput
            variant='menuconfigpanel_option_numberinput'
            min={1}
            step={1}
            value={data.legend_police}
            inputMode='numeric'
            onChange={value =>{
              data.legend_police = Number(value)
              DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
              setForceUpdate(!forceUpdate)
            }}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
            </NumberInputStepper>
          </NumberInput>
        </OverlayTrigger>
      </Box>

      {/* Couleur de fond de la légende */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_part_title_3'>
        {t('MEP.leg_layout_background')}
      </Box>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_suboption_name'>
          {t('Menu.LegBgColor')}
        </Box>
        <OverlayTrigger
          key={'Menu.tooltips.LegBgColor'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegBgColor'}>{t('Menu.tooltips.LegBgColor')} </Tooltip>}>
          <Input
            variant='menuconfigpanel_option_input_color'
            type='color'
            value={data.legend_bg_color}
            onChange={evt => {
              data.legend_bg_color = evt.target.value
              DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
              setForceUpdate(!forceUpdate)
            }}
          />
        </OverlayTrigger>
      </Box>

      {/* Opacité du fond de la légende */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_suboption_name'>
          {t('Menu.LegBgOpacity')}
        </Box>
        <OverlayTrigger
          key={'Menu.tooltips.LegBgOpacity'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegBgOpacity'}>{t('Menu.tooltips.LegBgOpacity')} </Tooltip>}>
          <NumberInput
            variant='menuconfigpanel_option_numberinput'
            min={0}
            max={100}
            step={1}
            value={current_legend_bg_opacity}
            inputMode='numeric'
            onChange={value => set_current_legend_bg_opacity(Number(value))}
            onBlur={() => {
              data.legend_bg_opacity = current_legend_bg_opacity
              DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
              setForceUpdate(!forceUpdate)
            }}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
            </NumberInputStepper>
          </NumberInput>
        </OverlayTrigger>
      </Box>

      {/* Affichage du bord de la légende */}
      <Box as='span'>
        <OverlayTrigger
          key={'Menu.tooltips.LegBgBorder'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegBgBorder'}>{t('Menu.tooltips.LegBgBorder')} </Tooltip>}>
          <Checkbox
            variant='menuconfigpanel_option_checkbox'
            isChecked={data.legend_bg_border}
            onChange={(evt) => {
              data.legend_bg_border = evt.target.checked
              DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
              setForceUpdate(!forceUpdate)
            }}
          >
            {t('Menu.LegBgBorder')}
          </Checkbox>
        </OverlayTrigger>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_part_title_2'>
        {t('MEP.leg_pos')}
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'>
          {t('Menu.LegX')}
        </Box>
        <OverlayTrigger
          key={'Menu.tooltips.LegX'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegX'}>{t('Menu.tooltips.LegX')} </Tooltip>}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={0}
              step={1}
              value={Math.round(legend_position[0])}
              inputMode='numeric'
              onChange={value => set_legend_position([Number(value), legend_position[1]])}
              onBlur={() => {
                data.legend_position = legend_position
                DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
                setForceUpdate(!forceUpdate)
              }}
            >
              <NumberInputField/>
              <NumberInputStepper>
                <NumberIncrementStepper/>
                <NumberDecrementStepper/>
              </NumberInputStepper>
            </NumberInput>
            <InputRightAddon>
              {right_addon_pixel(Math.round(legend_position[0]))}
            </InputRightAddon>
          </InputGroup>
        </OverlayTrigger>
      </Box>

      {/* Position Y de la legende */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'>
          {t('Menu.LegY')}
        </Box>
        <OverlayTrigger
          key={'Menu.tooltips.LegY'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegY'}>{t('Menu.tooltips.LegY')} </Tooltip>}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={0}
              step={1}
              value={Math.round(legend_position[1])}
              inputMode='numeric'
              onChange={value => set_legend_position([legend_position[0], Number(value)])}
              onBlur={() => {
                data.legend_position = legend_position
                DrawLegend(
                  dict_variable_application_data,
                  applicationContext,
                  contextMenu,
                  GetLinkValue,
                  legend_clicked)
                setForceUpdate(!forceUpdate)
              }}
            >
              <NumberInputField/>
              <NumberInputStepper>
                <NumberIncrementStepper/>
                <NumberDecrementStepper/>
              </NumberInputStepper>
            </NumberInput>
            <InputRightAddon>
              {right_addon_pixel(Math.round(legend_position[1]))}
            </InputRightAddon>
          </InputGroup>
        </OverlayTrigger>
      </Box>

      {/* Largeur de la fenetre de legende */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'>
          {t('Menu.LegWidth')}
        </Box>
        <OverlayTrigger
          key={'Menu.tooltips.LegWidth'}
          placement={'top'}
          delay={500}
          rootClose
          overlay={<Tooltip id={'Menu.tooltips.LegWidth'}>{t('Menu.tooltips.LegWidth')} </Tooltip>}>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={0}
              step={1}
              value={data.legend_width}
              inputMode='numeric'
              onChange={value =>{
                data.legend_width = Number(value)
                DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
                setForceUpdate(!forceUpdate)
              }}
            >
              <NumberInputField/>
              <NumberInputStepper>
                <NumberIncrementStepper/>
                <NumberDecrementStepper/>
              </NumberInputStepper>
            </NumberInput>
            <InputRightAddon>
              {right_addon_pixel(data.legend_width)}
            </InputRightAddon>
          </InputGroup>
        </OverlayTrigger>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_part_title_2'>
        {t('MEP.leg_info')}
      </Box>

      {/* Afficher l'échelle sur le graphe*/}
      <Box as='span'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isChecked={data.display_legend_scale}
          checked={data.display_legend_scale}
          onChange={(evt) => {
            data.display_legend_scale = evt.target.checked
            DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
            setForceUpdate(!forceUpdate)
          }}
        >
          {t('Menu.display_scale')}
        </Checkbox>
      </Box>

      {/* Afficher les dataTags dans la légende*/}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.legend_show_dataTags}
        checked={data.legend_show_dataTags}
        onChange={(evt) => {
          data.legend_show_dataTags = evt.target.checked
          DrawLegend(dict_variable_application_data,applicationContext,contextMenu,GetLinkValue,legend_clicked)
          setForceUpdate(!forceUpdate)
        }}
      >
        {t('MEP.leg_show_dataTags')}
      </Checkbox>
    </Box>
  ]
}

import React,{FunctionComponent, MutableRefObject, useRef, useState} from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
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
import * as d3 from 'd3'

import { OpenSankeyMenuConfigurationLayoutFType} from './types/SankeyMenuConfigurationLayoutTypes'
import { DrawGrid } from '../draw/SankeyDrawFunction'
import { SankeyData } from '../types/Types'
import { OSTooltip } from './SankeyUtils'

export const OpenSankeyMenuConfigurationLayout : FunctionComponent<OpenSankeyMenuConfigurationLayoutFType> = ({
  applicationContext,
  dict_variable_application_data,
  extra_background_element,
  node_function,
  link_function,
  reDrawLegend,
  ComponentUpdater
}) => {
  const { t } = applicationContext
  const { data, set_data} = dict_variable_application_data
  const {RedrawNodes} = node_function
  const {RedrawLinks} = link_function

  const {updateComponentMenuConfigLayout}=ComponentUpdater
  const [legend_position,set_legend_position] = useState(data.legend_position)
  const [forceUpdate,setForceUpdate]=useState(false)
  updateComponentMenuConfigLayout.current=()=>setForceUpdate(!forceUpdate)
  const {updateComponentMenuConfigLink}=ComponentUpdater
  updateComponentMenuConfigLink.current=()=>setForceUpdate(!forceUpdate)

  const right_addon_pixel = (val: number) => {
    if (val === 1) {
      return 'pixel'
    }
    return 'pixels'
  }

  return <>
    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'>
      {t('Menu.background')}
    </Box>

    {/* Couleur du fond de la page */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.BgC')}
      </Box>
      <OSTooltip label={t('MEP.tooltips.BgC')}>
        <Input
          variant='menuconfigpanel_option_input_color'
          type='color'
          value={data.couleur_fond_sankey}
          onChange={evt=>{
            data.couleur_fond_sankey=evt.target.value
            d3.select('#svg').style('background-color',evt.target.value)
          }}
          onBlur={()=>{
            set_data({...data})
          }}
        />
      </OSTooltip>
    </Box>

    {extra_background_element}

    {/* Quadrillage */}
    {/* Afficher le quadrillage */}
    <Box as='span'>

      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={data.grid_visible}
        icon={data.grid_visible?<FaEye/>:<FaEyeSlash/>}
        onChange={(evt) => {
          data.grid_visible = evt.target.checked
          DrawGrid(data)
          setForceUpdate(!forceUpdate)
        }}
      >
        <OSTooltip label={t('MEP.tooltips.GV')}>
          {t('MEP.TCG')}
        </OSTooltip>
      </Checkbox>

    </Box>

    {/* Taille de la grille */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
      style={{display:(data.grid_visible?'':'none')}}
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.TCG_shift')}
      </Box>
      <Box>
        <OSTooltip label={t('MEP.tooltips.TCG')}>

          <ConfigLayoutNumberInput
            data={dict_variable_application_data.data}
            var_of_data={'grid_square_size'}
            function_onBlur={()=>DrawGrid(data)}
            minimum_value={10}
            stepper={true}
            unitText={right_addon_pixel(data.grid_square_size)}
          />

        </OSTooltip>
      </Box>
    </Box>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <Box
      as='span'
      layerStyle='menuconfigpanel_part_title_1'>
      {t('MEP.links_size')}
    </Box>

    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.Echelle')}
      </Box>
      <Box>

        <ConfigLayoutNumberInput
          data={dict_variable_application_data.data}
          var_of_data={'user_scale'}
          function_onBlur={()=>{
            reDrawLegend()
            RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
            RedrawLinks(Object.values(dict_variable_application_data.display_links))
            ComponentUpdater.updateComponenSaveInCache.current(false)
          }}
          minimum_value={1}
          stepper={true}
          unitText='unit. / 100 pixels'
        />

      </Box>
    </Box>

    {/* Taille minimale du flux */}
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
        <OSTooltip label={t('MEP.tooltips.MinFlux')}>

          <ConfigLayoutNumberInput
            data={dict_variable_application_data.data}
            var_of_data={'minimum_flux'}
            function_onBlur={()=>{
              RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
              RedrawLinks(Object.values(dict_variable_application_data.display_links))
              ComponentUpdater.updateComponenSaveInCache.current(false)
            }}
            unitText={right_addon_pixel(data.minimum_flux!)}
          />

        </OSTooltip>
      </Box>
      <Box
        gridColumnStart='3'
        gridColumnEnd='4'
        gridRowStart='2'
        gridRowEnd='3'
      >
        <OSTooltip label={t('MEP.tooltips.MaxFlux')}>

          <ConfigLayoutNumberInput
            data={dict_variable_application_data.data}
            var_of_data={'maximum_flux'}
            function_onBlur={()=>{
              RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
              RedrawLinks(Object.values(dict_variable_application_data.display_links))
              ComponentUpdater.updateComponenSaveInCache.current(false)
            }}
            unitText={right_addon_pixel(data.maximum_flux!)}
          />
        </OSTooltip>
      </Box>
    </Box>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

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
          setForceUpdate(!forceUpdate)
          reDrawLegend()
        }}
      >
        {t('Menu.Leg')}
      </Checkbox>
    </Box>

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
        <OSTooltip label={t('Menu.tooltips.fontSize')}>

          <ConfigLayoutNumberInput
            data={dict_variable_application_data.data}
            var_of_data={'legend_police'}
            function_onBlur={()=>{
              reDrawLegend()
            }}
            minimum_value={1}
            stepper={true}
          />

        </OSTooltip>
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
        <OSTooltip label={t('Menu.tooltips.LegBgColor')}>
          <Input
            variant='menuconfigpanel_option_input_color'
            type='color'
            value={data.legend_bg_color}
            onChange={evt => {
              data.legend_bg_color = evt.target.value
              reDrawLegend()
              setForceUpdate(!forceUpdate)
            }}
          />
        </OSTooltip>
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
        <OSTooltip label={t('Menu.tooltips.LegBgOpacity')}>

          <ConfigLayoutNumberInput
            data={dict_variable_application_data.data}
            var_of_data={'legend_bg_opacity'}
            function_onBlur={()=>{
              reDrawLegend()
            }}
            minimum_value={0}
            maximum_value={100}
            stepper={true}
            unitText='%'
          />

        </OSTooltip>
      </Box>

      {/* Affichage du bord de la légende */}
      <Box as='span'>

        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isChecked={data.legend_bg_border}
          onChange={(evt) => {
            data.legend_bg_border = evt.target.checked
            reDrawLegend()
            setForceUpdate(!forceUpdate)
          }}
        >
          <OSTooltip label={t('Menu.tooltips.LegBgBorder')}>
            {t('Menu.LegBgBorder')}
          </OSTooltip>
        </Checkbox>
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
        <OSTooltip label={t('Menu.tooltips.LegX')}>
          <InputGroup variant='menuconfigpanel_option_input' >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={0}
              step={1}
              value={Math.round(legend_position[0])}
              inputMode='numeric'
              onChange={value => set_legend_position([Number(value), legend_position[1]])}
              onBlur={() => {
                data.legend_position = legend_position
                reDrawLegend()
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
        </OSTooltip>
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
        <OSTooltip label={t('Menu.tooltips.LegY')}>
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
                reDrawLegend()
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
        </OSTooltip>
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
        <OSTooltip label={t('Menu.tooltips.LegWidth')}>

          <ConfigLayoutNumberInput
            data={dict_variable_application_data.data}
            var_of_data={'legend_width'}
            function_onBlur={()=>{
              reDrawLegend()
            }}
            minimum_value={0}
            stepper={true}
            unitText={right_addon_pixel(data.legend_width)}
          />
        </OSTooltip>
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
            reDrawLegend()
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
          reDrawLegend()
          setForceUpdate(!forceUpdate)
        }}
      >
        {t('MEP.leg_show_dataTags')}
      </Checkbox>
    </Box>
  </>
}


type ConfigLayoutNumberInputType={
  data:SankeyData
  var_of_data:keyof SankeyData
  minimum_value?:number
  maximum_value?:number
  stepper?:boolean
  unitText?:string
  function_onBlur:()=>void
}
/**
 * Component developped for number input of the layout config menu
 *
 * @param {SankeyData} data
 * @param {keyof SankeyData} var_of_data keyof of the variable we want to reference in the inputn the variable in SankeyData need to be a number
 * @param {number} minimum_value (optional, if not specified it mean the value can be undefined )
 * @param {boolean} stepper (default:false) add stepper to the input to increase or decrease the value
 * @param {boolean} hasUnit (default:false) add an addon after the input
 * @param {string} unitText (default:'') text of the addon
 * @param {function} function_onBlur function called when we leave the input, it is generally used to update the draw area
 *
 * @return {JSX.Elmement}
 */
export const ConfigLayoutNumberInput:FunctionComponent<ConfigLayoutNumberInputType>=({
  data,
  var_of_data,
  minimum_value,
  maximum_value,
  stepper=false,
  unitText,
  function_onBlur
})=>{
  const [update,setUpdate]=useState(false)
  const ref_input=useRef<HTMLInputElement>(null)
  const isModifying:MutableRefObject<NodeJS.Timeout|undefined>=useRef<NodeJS.Timeout>()
  const variantOfInput=unitText?'menuconfigpanel_option_numberinput_with_right_addon':'menuconfigpanel_option_numberinput'
  const val_of_key=(data[var_of_data] as number)

  // Add stepper addon if specified
  const stepperBtn=stepper?<NumberInputStepper>
    <NumberIncrementStepper/>
    <NumberDecrementStepper/>
  </NumberInputStepper>:<></>

  // Add unit addon if specified
  const inputUnit=unitText?<InputRightAddon>{unitText}</InputRightAddon>:<></>

  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel
      variant={variantOfInput}
      min={minimum_value}
      max={maximum_value}
      step={1}
      value={(val_of_key || val_of_key===0)?val_of_key:''}
      onChange={(_,value)=>{
        (data[var_of_data] as number)=value
        setUpdate(!update)

        if(isModifying.current){
          clearTimeout(isModifying.current)
        }

        isModifying.current=setTimeout(()=>{
          function_onBlur()
          ref_input.current?.blur()
        },2000)
      }}
      onBlur={()=>{
        clearTimeout(isModifying.current)
        function_onBlur()
      }}
    >
      <NumberInputField
        ref={ref_input}
      />
      {stepperBtn}
    </NumberInput>
    {inputUnit}
  </InputGroup>
}

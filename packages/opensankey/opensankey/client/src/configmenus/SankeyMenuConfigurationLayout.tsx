import React, { FunctionComponent, MutableRefObject, useRef } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import {
  Box,
  Checkbox,
  Input,
  useBoolean,
} from '@chakra-ui/react'

import { OpenSankeyMenuConfigurationLayoutFType } from './types/SankeyMenuConfigurationLayoutTypes'
import { OSTooltip } from '../types/Utils'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'

// MENU COMPONENT ***********************************************************************

export const OpenSankeyMenuConfigurationLayout: FunctionComponent<OpenSankeyMenuConfigurationLayoutFType> = ({
  applicationData,
  extra_background_element
}) => {

  // Data -------------------------------------------------------------------------------

  const { new_data } = applicationData
  const { t } = new_data

  // Components updaters ---------------------------------------------------------------

  const [, refreshThis] = useBoolean()
  new_data.menu_configuration.ref_to_menu_config_layout_updater.current = refreshThis.toggle


  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 9
  const ref_set_number_inputs: MutableRefObject<(_: number | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: number | null | undefined) => null))

  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(new_data.drawing_area.scale)
  ref_set_number_inputs[1].current(new_data.drawing_area.minimum_flux)
  ref_set_number_inputs[2].current(new_data.drawing_area.maximum_flux)
  ref_set_number_inputs[3].current(new_data.drawing_area.legend.legend_police)
  ref_set_number_inputs[4].current(new_data.drawing_area.legend.legend_bg_opacity)
  ref_set_number_inputs[5].current(new_data.drawing_area.legend.position_x)
  ref_set_number_inputs[6].current(new_data.drawing_area.legend.position_y)
  ref_set_number_inputs[7].current(new_data.drawing_area.legend.width)
  ref_set_number_inputs[8].current(new_data.drawing_area.grid_size)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    refreshThis.toggle()
  }

  // Utils functions -------------------------------------------------------------------

  const right_addon_pixel = (val: number) => {
    if (val === 1) {
      return 'pixel'
    }
    return 'pixels'
  }

  // Components updaters ---------------------------------------------------------------

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
          value={new_data.drawing_area.color}
          onChange={evt => {
            new_data.drawing_area.color = evt.target.value
            refreshThisAndUpdateRelatedComponents()
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
        isChecked={new_data.drawing_area.grid_visible}
        icon={new_data.drawing_area.grid_visible ? <FaEye /> : <FaEyeSlash />}
        onChange={(evt) => {
          new_data.drawing_area.grid_visible = evt.target.checked
          refreshThisAndUpdateRelatedComponents()
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
      style={{ display: (new_data.drawing_area.grid_visible ? '' : 'none') }}
    >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.TCG_shift')}
      </Box>
      <Box>
        <OSTooltip label={t('MEP.tooltips.TCG')}>
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[8]}
            default_value={new_data.drawing_area.grid_size}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.grid_size = value
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            minimum_value={10}
            stepper={true}
            unit_text={right_addon_pixel(new_data.drawing_area.grid_size)}
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
        <ConfigMenuNumberInput
          ref_to_set_value={ref_set_number_inputs[0]}
          default_value={new_data.drawing_area.scale}
          function_on_blur={(value) => {
            if (value) {
              new_data.drawing_area.scale = value
              refreshThisAndUpdateRelatedComponents()
            }
          }}
          minimum_value={1}
          stepper={true}
          unit_text={'unit. / 100 pixels'}
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[1]}
            default_value={new_data.drawing_area.minimum_flux}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.minimum_flux = value
                // Even we are changing a parameter for link we redraw all node so it also redraw link + arrow
                new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            minimum_value={1}
            maximum_value={new_data.drawing_area.maximum_flux}
            stepper={true}
            unit_text={right_addon_pixel(new_data.drawing_area.minimum_flux!)}
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[2]}
            default_value={new_data.drawing_area.maximum_flux}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.maximum_flux = value
                // Even we are changing a parameter for link we redraw all node so it also redraw link + arrow
                new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            minimum_value={new_data.drawing_area.minimum_flux}
            stepper={true}
            unit_text={right_addon_pixel(new_data.drawing_area.maximum_flux!)}
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
        icon={!new_data.drawing_area.legend.masked ? <FaEye /> : <FaEyeSlash />}
        isChecked={!new_data.drawing_area.legend.masked}
        onChange={() => {
          new_data.drawing_area.legend.masked = !new_data.drawing_area.legend.masked
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {t('Menu.Leg')}
      </Checkbox>
    </Box>

    <Box
      layerStyle='menuconfigpanel_grid'
      style={{ display: (new_data.drawing_area.legend.masked ? 'none' : '') }}
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[3]}
            default_value={new_data.drawing_area.legend.legend_police}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.legend.legend_police = value
                refreshThisAndUpdateRelatedComponents()
              }
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
            value={new_data.drawing_area.legend.legend_bg_color}
            onChange={evt => {
              new_data.drawing_area.legend.legend_bg_color = evt.target.value
              refreshThisAndUpdateRelatedComponents()
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[4]}
            default_value={new_data.drawing_area.legend.legend_bg_opacity}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.legend.legend_bg_opacity = value
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            minimum_value={0}
            maximum_value={100}
            stepper={true}
            unit_text='%'
          />
        </OSTooltip>
      </Box>

      {/* Affichage du bord de la légende */}
      <Box as='span'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isChecked={new_data.drawing_area.legend.legend_bg_border}
          onChange={(evt) => {
            new_data.drawing_area.legend.legend_bg_border = evt.target.checked
            refreshThisAndUpdateRelatedComponents()
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[5]}
            default_value={new_data.drawing_area.legend.position_x}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.legend.position_x = value
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            step={1}
            stepper={true}
            unit_text={right_addon_pixel(Math.round(new_data.drawing_area.legend.position_x))}
          />
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[6]}
            default_value={new_data.drawing_area.legend.position_y}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.legend.position_y = value
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            step={1}
            stepper={true}
            unit_text={right_addon_pixel(Math.round(new_data.drawing_area.legend.position_y))}
          />
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
          <ConfigMenuNumberInput
            ref_to_set_value={ref_set_number_inputs[7]}
            default_value={new_data.drawing_area.legend.width}
            function_on_blur={(value) => {
              if (value) {
                new_data.drawing_area.legend.width = value
                refreshThisAndUpdateRelatedComponents()
              }
            }}
            minimum_value={0}
            step={1}
            stepper={true}
            unit_text={right_addon_pixel(new_data.drawing_area.legend.width)}
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
          isChecked={new_data.drawing_area.legend.display_legend_scale}
          checked={new_data.drawing_area.legend.display_legend_scale}
          onChange={(evt) => {
            new_data.drawing_area.legend.display_legend_scale = evt.target.checked
            refreshThisAndUpdateRelatedComponents()
          }}
        >
          {t('Menu.display_scale')}
        </Checkbox>
      </Box>

      {/* Afficher les dataTags dans la légende*/}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={new_data.drawing_area.legend.legend_show_dataTags}
        checked={new_data.drawing_area.legend.legend_show_dataTags}
        onChange={(evt) => {
          new_data.drawing_area.legend.legend_show_dataTags = evt.target.checked
          refreshThisAndUpdateRelatedComponents()
        }}
      >
        {t('MEP.leg_show_dataTags')}
      </Checkbox>
    </Box>
  </>
}
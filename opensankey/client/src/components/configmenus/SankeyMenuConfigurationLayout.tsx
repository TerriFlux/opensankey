// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import {
  Box,
  Checkbox,
  Input,
} from '@chakra-ui/react'

import { FType_OpenSankeyMenuConfigurationLayout } from './types/SankeyMenuConfigurationLayoutTypes'
import { CustomFaEyeCheckIcon, OSTooltip } from '../../types/Utils'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'

// MENU COMPONENT ***********************************************************************

export const OpenSankeyMenuConfigurationLayout: FunctionComponent<FType_OpenSankeyMenuConfigurationLayout> = ({
  new_data,
  extra_background_element,
  contextual
}) => {

  // Data -------------------------------------------------------------------------------

  const { t } = new_data

  // Components updaters ---------------------------------------------------------------

  const [, setCount] = useState(0)

  // Assing component updater to corresponding ref updater
  if (contextual) {
    new_data.menu_configuration.ref_to_menu_contextual_config_layout_updater.current = () => setCount(a => a + 1)
  } else {
    new_data.menu_configuration.ref_to_menu_config_layout_updater.current = () => setCount(a => a + 1)
  }


  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 9
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(new_data.drawing_area.scale))
  ref_set_number_inputs[1].current(String(new_data.drawing_area.minimum_flux ?? ''))
  ref_set_number_inputs[2].current(String(new_data.drawing_area.maximum_flux ?? ''))
  ref_set_number_inputs[3].current(String(new_data.drawing_area.legend.legend_police))
  ref_set_number_inputs[4].current(String(new_data.drawing_area.legend.legend_bg_opacity))
  ref_set_number_inputs[5].current(String(new_data.drawing_area.legend.position_x))
  ref_set_number_inputs[6].current(String(new_data.drawing_area.legend.position_y))
  ref_set_number_inputs[7].current(String(new_data.drawing_area.legend.width))
  ref_set_number_inputs[8].current(String(new_data.drawing_area.grid_size))

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToLayoutApparence()
  }

  // Utils functions -------------------------------------------------------------------

  const right_addon_pixel = (val: number) => {
    if (val === 1) {
      return 'pixel'
    }
    return 'pixels'
  }

  // Event functions -------------------------------------------------------------------

  // ===================================================================================
  // Create functions that will be used when modifying a attribute of the DA or the Legend,
  // these functions will save the last value of said attribute in data history so we can revert if we want it
  // ===================================================================================

  const eventBgColor = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: string) => {
      new_data.drawing_area.color = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area, 'color', evt.target.value, f)
  }

  const eventGridVisible = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.grid_visible = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area, 'grid_visible', evt.target.checked, f)
  }

  const eventGridSize = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.grid_size = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area, 'grid_size', evt, f)
    }
  }

  const eventMinLinkThickness = (evt: number | null | undefined) => {
    if (evt == null)
      return
    const f = (_: number | undefined) => {
      if (_) {
        new_data.drawing_area.minimum_flux = _
        // Even we are changing a parameter for link we redraw all node so it also redraw link + arrow
        new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      } else {
        new_data.drawing_area.removeMinimumLinkThickness()
        new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      }
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area, 'minimum_flux', evt, f)
  }
  const eventMaxLinkThickness = (evt: number | null | undefined) => {
    if (evt == null)
      return
    const f = (_: number | undefined) => {
      if (_) {
        new_data.drawing_area.maximum_flux = _
        // Even we are changing a parameter for link we redraw all node so it also redraw link + arrow
        new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      } else {
        new_data.drawing_area.removeMaximumLinkThickness()
        new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      }
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area, 'maximum_flux', evt, f)
  }

  const eventScale = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.scale = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area, 'scale', evt, f)
    }
  }

  const eventLegendMasked = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.masked = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'masked', !evt.target.checked, f)
  }

  const eventLegendFontSize = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.legend.legend_police = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_police', evt, f)
    }
  }

  const eventGLegendBgColor = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: string) => {
      new_data.drawing_area.legend.legend_bg_color = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_bg_color', evt.target.value, f)
  }

  const eventLegendBgOpacity = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.legend.legend_bg_opacity = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_bg_opacity', evt, f)
    }
  }

  const eventLegendBorder = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.legend_bg_border = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_bg_border', evt.target.checked, f)
  }

  const eventLegendPosX = (evt: number | undefined | null) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.legend.position_x = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'position_x', evt, f)
    }
  }

  const eventLegendPosY = (evt: number | undefined | null) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.legend.position_y = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'position_y', evt, f)
    }
  }

  const eventLegendWidth = (evt: number | undefined | null) => {
    if (evt) {
      const f = (_: number) => {
        new_data.drawing_area.legend.width = _
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'width', evt, f)
    }
  }

  const eventLegendScale = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.display_legend_scale = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'display_legend_scale', evt.target.checked, f)
  }

  const eventLegendDataTag = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.legend_show_dataTags = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_show_dataTags', evt.target.checked, f)
  }

  const eventLegendLinkInfo = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.info_link_value_void = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'info_link_value_void', evt.target.checked, f)
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
          onChange={eventBgColor}
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
        icon={<CustomFaEyeCheckIcon />}
        onChange={eventGridVisible}
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
            function_on_blur={eventGridSize}
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
          function_on_blur={eventScale}
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
            function_on_blur={eventMinLinkThickness}
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
            function_on_blur={eventMaxLinkThickness}
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
        icon={<CustomFaEyeCheckIcon />}
        isChecked={!new_data.drawing_area.legend.masked}
        onChange={eventLegendMasked}
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
            function_on_blur={eventLegendFontSize}
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
            onChange={eventGLegendBgColor}
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
            function_on_blur={eventLegendBgOpacity}
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
          onChange={eventLegendBorder}
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
            function_on_blur={eventLegendPosX}
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
            function_on_blur={eventLegendPosY}
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
            function_on_blur={eventLegendWidth}
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
          onChange={eventLegendScale}
        >
          {t('Menu.display_scale')}
        </Checkbox>
      </Box>

      {/* Afficher les dataTags dans la légende*/}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={new_data.drawing_area.legend.legend_show_dataTags}
        checked={new_data.drawing_area.legend.legend_show_dataTags}
        onChange={eventLegendDataTag}
      >
        {t('MEP.leg_show_dataTags')}
      </Checkbox>

      {/* Afficher l'info concernant les flux null*/}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={new_data.drawing_area.legend.info_link_value_void}
        checked={new_data.drawing_area.legend.info_link_value_void}
        onChange={eventLegendLinkInfo}
      >
        {t('MEP.leg_show_info_link_void')}
      </Checkbox>
    </Box>
  </>
}
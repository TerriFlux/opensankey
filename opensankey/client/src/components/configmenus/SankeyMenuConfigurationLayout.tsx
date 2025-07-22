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
  Button,
  Checkbox,
} from '@chakra-ui/react'
import { FCTpe_LayoutConfigDAScaleAndLimit, FCType_DrawingAreaStyle, FType_OpenSankeyMenuConfigurationLayout } from './types/SankeyMenuConfigurationLayoutTypes'
import { CustomFaEyeCheckIcon, OSTooltip } from '../../types/Utils'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'
import { WrapperBoxSubSectionMenu } from './SankeyMenuComponents'
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { Type_GenericApplicationData } from '../../types/Types'
import { t } from 'i18next'
import { Type_AnyElement } from '../../Elements/Element'
import { Type_AnyLinkElement } from '../../Elements/Link'


// Utils functions -------------------------------------------------------------------

const right_addon_pixel = (val: number) => {
  if (val === 1) {
    return 'pixel'
  }
  return 'pixels'
}

// MENU COMPONENT ***********************************************************************

export const OpenSankeyMenuConfigurationLayout: FunctionComponent<FType_OpenSankeyMenuConfigurationLayout> = ({
  new_data,
  extra_background_element,
}) => {

  // Components updaters ---------------------------------------------------------------

  return <Box>
    <DrawingAreaStyle new_data={new_data} extra_background_element={extra_background_element} />
    <LayoutConfigDAScaleAndLimit new_data={new_data} />
    <LegendStyleConfig new_data={new_data} />
    <LegendContextConfig new_data={new_data} />

  </Box>
}


export const DrawingAreaStyle: FunctionComponent<FCType_DrawingAreaStyle> = ({ new_data, extra_background_element }) => {

  // Data -------------------------------------------------------------------------------

  const { t, OSColorPicker } = new_data

  // Components updaters ---------------------------------------------------------------

  const [, setCount] = useState(0)

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 1
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(new_data.drawing_area.grid_size))

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setCount(a => a + 1)
    // And update this menu also
    new_data.menu_configuration.updateComponentRelatedToLayoutApparence()
  }


  // Event functions -------------------------------------------------------------------

  // ===================================================================================
  // Create functions that will be used when modifying a attribute of the DA or the Legend,
  // these functions will save the last value of said attribute in data history so we can revert if we want it
  // ===================================================================================

  const eventBgColor = (evt: string) => {
    const f = (_: string) => {
      new_data.drawing_area.color = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area, 'color', evt, f)
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

  const eventMagneticNodes = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.magnetic_nodes = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area, 'magnetic_nodes', evt.target.checked, f)
  }


  return <WrapperBoxSubSectionMenu title={t('Menu.background')} new_data={new_data} >
    <>
      {/* Couleur du fond de la page */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Menu.BgC')}
        </Box>
        <OSTooltip label={t('MEP.tooltips.BgC')}>
          <Box>
            <OSColorPicker
              initialColor={new_data.drawing_area.color}
              functionOnBlur={eventBgColor}
            />
          </Box>
        </OSTooltip>
      </Box>

      {extra_background_element}

      {/* Quadrillage */}
      {/* Afficher le quadrillage */}
      <Box layerStyle='menuconfigpanel_row_2cols'>

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
        {/* Taille de la grille */}

        <OSTooltip label={t('MEP.tooltips.TCG')}>
          <ConfigMenuNumberInput
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[0]}
            default_value={new_data.drawing_area.grid_size}
            function_on_blur={eventGridSize}
            minimum_value={10}
            stepper={true}
            unit_text={right_addon_pixel(new_data.drawing_area.grid_size)}
          />
        </OSTooltip>
      </Box>
      {/* Nodes move by steps */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={new_data.drawing_area.magnetic_nodes}
        icon={<CustomFaEyeCheckIcon />}
        onChange={eventMagneticNodes}
      >
        <OSTooltip label={t('MEP.tooltips.MN')}>
          {t('MEP.MN')}
        </OSTooltip>
      </Checkbox>
    </>
  </WrapperBoxSubSectionMenu>
}

/**
 * Component to config scale of DA and limit to flow thickness
 *
 * @param {*} { new_data }
 * @return {*} 
 */
export const LayoutConfigDAScaleAndLimit: FunctionComponent<FCTpe_LayoutConfigDAScaleAndLimit> = ({ new_data }) => {
  const { t } = new_data
  const [, setCount] = useState(0)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a => a + 1)
  }

  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 3
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(new_data.drawing_area.scale))
  ref_set_number_inputs[1].current(String(new_data.drawing_area.minimum_flux ?? ''))
  ref_set_number_inputs[2].current(String(new_data.drawing_area.maximum_flux ?? ''))




  // Event functions -------------------------------------------------------------------

  // ===================================================================================
  // Create functions that will be used when modifying a attribute of the DA or the Legend,
  // these functions will save the last value of said attribute in data history so we can revert if we want it
  // ===================================================================================

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



  return <WrapperBoxSubSectionMenu new_data={new_data} title={t('MEP.links_size')}>
    <>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('MEP.Echelle')}
        </Box>
        <Box>
          <ConfigMenuNumberInput
            t={new_data.t}
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
              t={new_data.t}
              ref_to_set_value={ref_set_number_inputs[1]}
              default_value={new_data.drawing_area.minimum_flux}
              function_on_blur={eventMinLinkThickness}
              maximum_value={new_data.drawing_area.maximum_flux}
              stepper={true}
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
              t={new_data.t}
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
    </>
  </WrapperBoxSubSectionMenu>
}


/**
 *Component to configure legend attribute
 *
 * @param {*} { new_data }
 * @return {*} 
 */
export const LegendStyleConfig: FunctionComponent<FCTpe_LayoutConfigDAScaleAndLimit> = ({ new_data }) => {

  const { t, OSColorPicker } = new_data
  const [, setCount] = useState(0)


  // Link to ConfigMenuNumberInput state variable
  const number_of_input = 5
  const ref_set_number_inputs: MutableRefObject<(_: string | null | undefined) => void>[] = []
  for (let i = 0; i < number_of_input; i++)
    ref_set_number_inputs.push(useRef((_: string | null | undefined) => null))
  // Be sure that values are updated in inputs when refreshing this component
  ref_set_number_inputs[0].current(String(new_data.drawing_area.legend.legend_police))
  ref_set_number_inputs[1].current(String(new_data.drawing_area.legend.legend_bg_opacity))
  ref_set_number_inputs[2].current(String(new_data.drawing_area.legend.position_x))
  ref_set_number_inputs[3].current(String(new_data.drawing_area.legend.position_y))
  ref_set_number_inputs[4].current(String(new_data.drawing_area.legend.width))


  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a => a + 1)
  }

  // Event functions -------------------------------------------------------------------

  // ===================================================================================
  // Create functions that will be used when modifying a attribute of the DA or the Legend,
  // these functions will save the last value of said attribute in data history so we can revert if we want it
  // ===================================================================================

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

  const eventGLegendBgColor = (evt: string) => {
    const f = (_: string) => {
      new_data.drawing_area.legend.legend_bg_color = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_bg_color', evt, f)
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
  const eventLegendStickDrawing = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.stick_to_drawing = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'stick_to_drawing', evt.target.checked, f)
  }

  const eventLegendBorder = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.legend_bg_border = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_bg_border', evt.target.checked, f)
  }

  const eventLegendPosX = (evt: number | undefined | null) => {
    if (evt !== undefined && evt !== null) {
      const f = (_: number) => {
        new_data.drawing_area.legend.position_x = _
        new_data.drawing_area.legend.applyPosition()
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'position_x', evt, f)
    }
  }

  const eventLegendPosY = (evt: number | undefined | null) => {
    if (evt !== undefined && evt !== null) {
      const f = (_: number) => {
        new_data.drawing_area.legend.position_y = _
        new_data.drawing_area.legend.applyPosition()
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

  return <Box layerStyle='menu_sub_section'>
    <Box
      as='span'
      layerStyle='menu_sub_section_title'
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
      {/* Solidaire du diagramme */}
      <Box layerStyle='menuconfigpanel_grid'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isChecked={new_data.drawing_area.legend.stick_to_drawing}
          onChange={eventLegendStickDrawing}
        >
          <OSTooltip label={t('Menu.tooltips.LegStickDrawing')}>
            {t('Menu.LegStickDrawing')}
          </OSTooltip>
        </Checkbox>
      </Box>

    <Box
      layerStyle='menuconfigpanel_grid'
      style={{ display: (new_data.drawing_area.legend.masked ? 'none' : '') }}
    >

      {/* Couleur de fond de la légende */}
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_suboption_name'>
          {t('Menu.LegBgColor')}
        </Box>
        <OSTooltip label={t('Menu.tooltips.LegBgColor')}>
          <Box>
            <OSColorPicker
              initialColor={new_data.drawing_area.legend.legend_bg_color}
              functionOnBlur={eventGLegendBgColor}
            />
          </Box>
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
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[1]}
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
      <Box layerStyle='menuconfigpanel_grid'>
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
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[0]}
            default_value={new_data.drawing_area.legend.legend_police}
            function_on_blur={eventLegendFontSize}
            minimum_value={1}
            stepper={true}
          />
        </OSTooltip>
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
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[2]}
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
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[3]}
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
            t={new_data.t}
            ref_to_set_value={ref_set_number_inputs[4]}
            default_value={new_data.drawing_area.legend.width}
            function_on_blur={eventLegendWidth}
            minimum_value={0}
            step={1}
            stepper={true}
            unit_text={right_addon_pixel(new_data.drawing_area.legend.width)}
          />
        </OSTooltip>
      </Box>

    </Box>
  </Box>
}


export const LegendContextConfig: FunctionComponent<FCTpe_LayoutConfigDAScaleAndLimit> = ({ new_data }) => {

  const { t } = new_data
  const [, setCount] = useState(0)


  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Update input data value
  ref_set_text_value_input.current(new_data.node_label_separator)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a => a + 1)
  }

  // Event functions -------------------------------------------------------------------

  // ===================================================================================
  // Create functions that will be used when modifying a attribute of the DA or the Legend,
  // these functions will save the last value of said attribute in data history so we can revert if we want it
  // ===================================================================================


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

  const eventLegendMasked = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.masked = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'masked', !evt.target.checked, f)
  }

  return <>
    {/* Masquer une partie des noms des noeuds */}
    <OSTooltip label={t('Menu.tooltips.node_label_sep')}>
      <Box layerStyle='menuconfigpanel_row_2cols_little_input' >
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep')}</Box>
        <ConfigMenuTextInput
          ref_to_set_value={ref_set_text_value_input}
          function_get_value={() => { return new_data.node_label_separator }}
          function_on_blur={(_) => {
            const tmp = _ ? _ : ''
            new_data.node_label_separator = tmp
            new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
          }}
        />
      </Box>
    </OSTooltip>

    <OSTooltip label={t('Menu.tooltips.node_label_sep_pos')}>
      <Box layerStyle='menuconfigpanel_row_2cols_little_input' >
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.node_label_sep_pos')}</Box>
        <Box layerStyle='options_2cols'>
          <Button variant={new_data.node_label_separator_part == 'before' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            onClick={() => {
              new_data.node_label_separator_part = 'before'
              new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
              setCount(a => a + 1)
            }
            }
          >
            {t('Menu.before')}
          </Button>
          <Button variant={new_data.node_label_separator_part == 'after' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
            onClick={() => {
              new_data.node_label_separator_part = 'after'
              new_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
              setCount(a => a + 1)
            }
            }
          >
            {t('Menu.after')}
          </Button>
        </Box>
      </Box>
    </OSTooltip>

    <Box
      as='span'
      layerStyle='menu_sub_section_title'
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

    {/* Afficher l'échelle sur le graphe*/}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={new_data.drawing_area.legend.display_legend_scale}
      checked={new_data.drawing_area.legend.display_legend_scale}
      onChange={eventLegendScale}
    >
      {t('Menu.display_scale')}
    </Checkbox>

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




  </>
}

export const GraphElementsOrdoner: FunctionComponent<{ new_data: Type_GenericApplicationData }> = ({ new_data }) => {
  const { icon_move_element_down, icon_move_element_up } = new_data.icon_library
  const [, setUpdate] = useState(0)

  new_data.menu_configuration.ref_to_GraphElementsOrdoner_updater.current = () => setUpdate(a => a + 1)

  // Function that return style of element draggable depending on it's state (isDragging)
  const style_TableLineDragging = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined, is_selected: boolean) => ({
    // change background colour if dragging
    // border:isDragging ? '1px solid #78A7C2' : 'unset',
    borderColor: is_selected ? 'red' : 'black',
    // styles we need to apply on draggables
    ...draggableStyle
  })
  return <WrapperBoxSubSectionMenu title={t('Menu.ElOrder')} new_data={new_data} collapse={false}>
    <DragDropContext onDragEnd={(evt) => {
      // Reorganise links order at drop event
      if (evt.destination && evt.destination.index !== undefined) {
        new_data.drawing_area.moveOrderElementInDA(evt.source.index, evt.destination.index)
      }
    }}>
      <Droppable droppableId="droppable">
        {(provided,) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ display: 'grid', gridRowGap: '0.2rem' }}
          >
            {
              new_data.drawing_area.list_g_element
                .map((element, element_idx) => {
                  //const element = new_data.drawing_area.elementFromId(id_element)
                  if (!element.is_visible)
                    return <></>
                  return (
                    <Draggable key={element.id} index={element_idx} draggableId={'line_drag_' + element.id}>
                      {(provided, snapshot) => (
                        <Box key={element.id} layerStyle='drag_line_element_order' ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={style_TableLineDragging(snapshot.isDragging, provided.draggableProps.style, element.is_selected)}
                        >
                          <Box className='name_element'>{(element as Type_AnyLinkElement).name}</Box>
                          <Box layerStyle="options_2cols">
                            <Button
                              variant='menuconfigpanel_move_order_node_io'
                              minWidth='0'
                              onClick={() => {
                                new_data.drawing_area.moveOrderElementInDA(element_idx, element_idx - 1)
                                setUpdate(a => a + 1)
                              }}
                            >
                              {icon_move_element_up}
                            </Button>
                            <Button
                              variant='menuconfigpanel_move_order_node_io'
                              minWidth='0'
                              onClick={() => {
                                new_data.drawing_area.moveOrderElementInDA(element_idx, element_idx + 1)
                                setUpdate(a => a + 1)
                              }}
                            >
                              {icon_move_element_down}
                            </Button>
                          </Box>
                        </Box>)}
                    </Draggable>
                  )
                })
            }
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  </WrapperBoxSubSectionMenu>
}
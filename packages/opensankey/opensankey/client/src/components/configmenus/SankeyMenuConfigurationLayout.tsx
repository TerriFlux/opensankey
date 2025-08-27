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

import React, { FC, MutableRefObject, useRef, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Select
} from '@chakra-ui/react'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'
import { WrapperBoxSubSectionMenu } from './MenuCommon'
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { t } from 'i18next'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_ApplicationData } from '../../types/ApplicationData'
import {BaseApplicationDataType } from '../SankeyMenuTypes'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { CustomFaEyeCheckIcon, OSTooltip } from './MenuCommon'


// Utils functions -------------------------------------------------------------------

const right_addon_pixel = (val: number) => {
  if (val === 1) {
    return 'pixel'
  }
  return 'pixels'
}

// MENU COMPONENT ***********************************************************************

export const OpenSankeyMenuConfigurationLayout = ({
  new_data,
  extra_background_element,
}:{
  new_data: Class_ApplicationData
  contextual: boolean
  extra_background_element: JSX.Element,
}) => {

  // Components updaters ---------------------------------------------------------------

  return <Box>
    <DrawingAreaStyle new_data={new_data} extra_background_element={extra_background_element} />
    <LayoutConfigDAScaleAndLimit new_data={new_data} />
    <LegendStyleConfig new_data={new_data} />
    <LegendContextConfig new_data={new_data} />

  </Box>
}

export const DrawingAreaStyle = ({ new_data, extra_background_element }:{
  new_data: Class_ApplicationData
  extra_background_element: JSX.Element,
}) => {

  // Data -------------------------------------------------------------------------------

  const { t, MenuColorPicker } = new_data

  // Components updaters ---------------------------------------------------------------

  const [, setCount] = useState(0)

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
            <MenuColorPicker
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
export const LayoutConfigDAScaleAndLimit: FC<BaseApplicationDataType> = ({ new_data }) => {
  const { t } = new_data
  const [, setCount] = useState(0)
  const unit_taggs = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
  const [selectedTag,setSelectedTag] = useState(unit_taggs.length > 0?unit_taggs[0].tags_list.filter(tag => tag.is_selected)[0].id:'')
  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a => a + 1)
  }
  const ref_scale = useRef((_: string | null | undefined) => null)
  const ref_minimum_flux = useRef((_: string | null | undefined) => null)
  const ref_maximum_flux = useRef((_: string | null | undefined) => null)

  if (unit_taggs.length > 0) {
    ref_scale.current(String(unit_taggs[0].tags_dict[selectedTag].scale))
  } else {
    ref_scale.current(String(new_data.drawing_area.scale))
  }
  ref_minimum_flux.current(String(new_data.drawing_area.minimum_flux ?? ''))
  ref_maximum_flux.current(String(new_data.drawing_area.maximum_flux ?? ''))

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
        if (unit_taggs.length > 0) {
          unit_taggs[0].tags_dict[selectedTag].scale = _
          new_data.drawing_area.draw()
        } else {
          new_data.drawing_area.scale = _
        }
        refreshThisAndUpdateRelatedComponents()
      }
      new_data.setValueAndSaveHistory(new_data.drawing_area, 'scale', evt, f)
    }
  }

  return <WrapperBoxSubSectionMenu new_data={new_data} title={t('MEP.links_size')}>
    <>
      {unit_taggs.length > 0 ?
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box
            as='span'
            layerStyle='menuconfigpanel_part_title_3'
          >
            {unit_taggs[0].name}
          </Box>
          <Select
            name={unit_taggs[0].id}
            variant='menuconfigpanel_option_select'
            value={
              selectedTag
            }
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedTag(evt.target.value)
              // Update selected attributes for tags
              // data_tagg.selectTagsFromId(evt.target.value)
              // Update this menu
              refreshThisAndUpdateRelatedComponents()
            }}
          >
            {
              unit_taggs[0].tags_list.map(tag => {
                return <option key={tag.id} value={tag.id}>{tag.name}</option>
              })
            }
          </Select>
        </Box> : <></>
      }
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
export const LegendStyleConfig: FC<BaseApplicationDataType> = ({ new_data }) => {

  const { t, MenuColorPicker } = new_data
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
            <MenuColorPicker
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


export const LegendContextConfig: FC<BaseApplicationDataType> = ({ new_data }) => {

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

  const eventLegendConstraints = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      new_data.drawing_area.legend.legend_show_constraints = _
      refreshThisAndUpdateRelatedComponents()
    }
    new_data.setValueAndSaveHistory(new_data.drawing_area.legend, 'legend_show_constraints', evt.target.checked, f)
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
    {/* Afficher les dataTags dans la légende*/}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={new_data.drawing_area.legend.legend_show_constraints}
      checked={new_data.drawing_area.legend.legend_show_constraints}
      onChange={eventLegendConstraints}
    >
      {t('MEP.leg_show_constraints')}
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

export const GraphElementsOrdoner: FC<{ new_data: Class_ApplicationData }> = ({ new_data }) => {
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
                .map((id_element, element_idx) => {
                  const element = new_data.drawing_area.elementFromId(id_element)
                  if (!element.is_visible)
                    return <></>
                  return (
                    <Draggable key={element.id} index={element_idx} draggableId={'line_drag_' + element.id}>
                      {(provided, snapshot) => (
                        <Box key={id_element} layerStyle='drag_line_element_order' ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={style_TableLineDragging(snapshot.isDragging, provided.draggableProps.style, element.is_selected)}
                        >
                          <Box className='name_element'>{(element as Class_LinkElement).name}</Box>
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
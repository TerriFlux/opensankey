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

import React, { useRef, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Select
} from '@chakra-ui/react'

import { ConfigMenuNumberInput, MenuColorPicker, WrapperBoxSubSectionMenu } from './MenuCommon'
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle, OnDragEndResponder } from 'react-beautiful-dnd'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { CustomFaEyeCheckIcon, OSTooltip } from './MenuCommon'
import { Type_PaperFormat, Type_PaperOrientation } from '../../Elements/ElementsAttributesConfig'

// Utils functions -------------------------------------------------------------------

const right_addon_pixel = (val: number) => {
  if (val === 1) {
    return 'pixel'
  }
  return 'px'
}


export const DrawingAreaConfig = ({
  app_data,
  extra_background_element,
}: {
  app_data: Class_ApplicationData,
  extra_background_element?: JSX.Element,
}) => {
  const { t } = app_data
  const [, setCount] = useState(0)

  const unit_taggs = app_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
  const [selectedTag, setSelectedTag] = useState(unit_taggs.length > 0 ? unit_taggs[0].tags_list.filter(tag => tag.is_selected)[0].id : '')

  // Refs for inputs
  const ref_scale = useRef((_: string | null | undefined) => null)
  const ref_minimum_flux = useRef((_: string | null | undefined) => null)
  const ref_maximum_flux = useRef((_: string | null | undefined) => null)

  // Update refs
  if (unit_taggs.length > 0) {
    ref_scale.current(String(unit_taggs[0].tags_dict[selectedTag].scale))
  } else {
    ref_scale.current(String(app_data.drawing_area.scale))
  }
  ref_minimum_flux.current(String(app_data.drawing_area.minimum_flux ?? ''))
  ref_maximum_flux.current(String(app_data.drawing_area.maximum_flux ?? ''))

  const refreshThisAndUpdateRelatedComponents = () => {
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setCount(a => a + 1)
    app_data.menu_configuration.updateComponentRelatedToLayoutApparence()
  }

  // Paper format event handlers
  const eventPaperFormat = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const val = evt.target.value as Type_PaperFormat
    const f = (_: Type_PaperFormat) => {
      app_data.drawing_area.paper_format = _
      app_data.drawing_area.areaAutoFit()
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'paper_format', val, f)
  }

  const eventPaperOrientation = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const val = evt.target.value as Type_PaperOrientation
    const f = (_: Type_PaperOrientation) => {
      app_data.drawing_area.paper_orientation = _
      app_data.drawing_area.areaAutoFit()
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'paper_orientation', val, f)
  }

  const eventMargin = (side: 'top' | 'right' | 'bottom' | 'left') => (evt: number | null | undefined) => {
    if (evt == null) return
    const key = `margin_${side}_mm` as 'margin_top_mm' | 'margin_right_mm' | 'margin_bottom_mm' | 'margin_left_mm'
    const f = (_: number) => {
      app_data.drawing_area[key] = _
      app_data.drawing_area.areaAutoFit()
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, key, evt, f)
  }

  const eventBgColor = (evt: string) => {
    const f = (_: string) => {
      app_data.drawing_area.color = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'color', evt, f)
  }

  const eventGridVisible = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.grid_visible = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'grid_visible', evt.target.checked, f)
  }

  const eventGridSize = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        app_data.drawing_area.grid_size = _
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area, 'grid_size', evt, f)
    }
  }

  const eventMagneticNodes = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.magnetic_nodes = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'magnetic_nodes', evt.target.checked, f)
  }

  const eventScale = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        if (unit_taggs.length > 0) {
          unit_taggs[0].tags_dict[selectedTag].scale = _
          app_data.drawing_area.draw()
        } else {
          app_data.drawing_area.scale = _
        }
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area, 'scale', evt, f)
    }
  }

  const eventMinLinkThickness = (evt: number | null | undefined) => {
    if (evt == null) return
    const f = (_: number | undefined) => {
      if (_) {
        app_data.drawing_area.minimum_flux = _
        app_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      } else {
        app_data.drawing_area.removeMinimumLinkThickness()
        app_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      }
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'minimum_flux', evt, f)
  }

  const eventStructureForceMin = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.structure_mode_force_min = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'structure_mode_force_min', evt.target.checked, f)
  }

  const eventArrowStandaloneLayout = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.arrow_use_standalone_layout = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'arrow_use_standalone_layout', evt.target.checked, f)
  }

  const eventMaxLinkThickness = (evt: number | null | undefined) => {
    if (evt == null) return
    const f = (_: number | undefined) => {
      if (_) {
        app_data.drawing_area.maximum_flux = _
        app_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      } else {
        app_data.drawing_area.removeMaximumLinkThickness()
        app_data.drawing_area.sankey.visible_nodes_list.forEach(node => node.draw())
      }
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area, 'maximum_flux', evt, f)
  }

  return <>
    {/* Paper format */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.PaperFormat')}
      </Box>
      <Select
        variant='menuconfigpanel_option_select'
        value={app_data.drawing_area.paper_format}
        onChange={eventPaperFormat}
      >
        <option value='free'>{t('MEP.PaperFree')}</option>
        <option value='A3'>A3</option>
        <option value='A4'>A4</option>
        <option value='A5'>A5</option>
      </Select>
    </Box>

    {app_data.drawing_area.is_paper_mode && <>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('MEP.PaperOrientation')}
        </Box>
        <Select
          variant='menuconfigpanel_option_select'
          value={app_data.drawing_area.paper_orientation}
          onChange={eventPaperOrientation}
        >
          <option value='landscape'>{t('MEP.Landscape')}</option>
          <option value='portrait'>{t('MEP.Portrait')}</option>
        </Select>
      </Box>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('MEP.Margins')}
        </Box>
        <Box display='grid' gridTemplateColumns='1fr 1fr' gap='4px'>
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={app_data.drawing_area.margin_top_mm}
            function_on_blur={eventMargin('top')}
            minimum_value={0}
            maximum_value={50}
            stepper={true}
            unit_text='mm'
          />
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={app_data.drawing_area.margin_right_mm}
            function_on_blur={eventMargin('right')}
            minimum_value={0}
            maximum_value={50}
            stepper={true}
            unit_text='mm'
          />
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={app_data.drawing_area.margin_bottom_mm}
            function_on_blur={eventMargin('bottom')}
            minimum_value={0}
            maximum_value={50}
            stepper={true}
            unit_text='mm'
          />
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={app_data.drawing_area.margin_left_mm}
            function_on_blur={eventMargin('left')}
            minimum_value={0}
            maximum_value={50}
            stepper={true}
            unit_text='mm'
          />
        </Box>
      </Box>

      <Box layerStyle='menuconfigpanel_option_name' fontSize='xs' opacity={0.7}>
        {Math.round(app_data.drawing_area.width)} x {Math.round(app_data.drawing_area.height)} px
      </Box>

    </>}

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.BgC')}
      </Box>
      <OSTooltip label={t('MEP.tooltips.BgC')}>
        <Box>
          <MenuColorPicker
            initialColor={app_data.drawing_area.color}
            onColorChange={eventBgColor}
          />
        </Box>
      </OSTooltip>
    </Box>
    <Box layerStyle='menuconfigpanel_row_2cols'>
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.grid_visible}
        icon={<CustomFaEyeCheckIcon />}
        onChange={eventGridVisible}
      >
        <OSTooltip label={t('MEP.tooltips.GV')}>
          {t('MEP.TCG')}
        </OSTooltip>
      </Checkbox>

      <OSTooltip label={t('MEP.tooltips.TCG')}>
        <ConfigMenuNumberInput
          t={app_data.t}
          default_value={app_data.drawing_area.grid_size}
          function_on_blur={eventGridSize}
          minimum_value={10}
          stepper={true}
          unit_text={right_addon_pixel(app_data.drawing_area.grid_size)}
        />
      </OSTooltip>
    </Box>

    {/* Nodes move by steps */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={app_data.drawing_area.magnetic_nodes}
      icon={<CustomFaEyeCheckIcon />}
      onChange={eventMagneticNodes}
    >
      <OSTooltip label={t('MEP.tooltips.MN')}>
        {t('MEP.MN')}
      </OSTooltip>
    </Checkbox>

    {unit_taggs.length > 0 && (
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box as='span' layerStyle='menuconfigpanel_part_title_3'>
          {unit_taggs[0].name}
        </Box>
        <Select
          name={unit_taggs[0].id}
          variant='menuconfigpanel_option_select'
          value={selectedTag}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedTag(evt.target.value)
            refreshThisAndUpdateRelatedComponents()
          }}
        >
          {unit_taggs[0].tags_list.map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </Select>
      </Box>
    )}

    {/* Échelle */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('MEP.Echelle')}
      </Box>
      <Box>
        <ConfigMenuNumberInput
          t={app_data.t}
          default_value={unit_taggs.length > 0 ? unit_taggs[0].tags_dict[selectedTag].scale : app_data.drawing_area.scale}
          function_on_blur={eventScale}
          minimum_value={1}
          stepper={true}
          unit_text={'unit. / 100 pixels'}
        />
      </Box>
    </Box>

    {/* Limites min/max */}
    <Box layerStyle='menuconfigpanel_2row_3cols'>
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
            t={app_data.t}
            default_value={app_data.drawing_area.minimum_flux}
            function_on_blur={eventMinLinkThickness}
            maximum_value={app_data.drawing_area.maximum_flux}
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
            t={app_data.t}
            default_value={app_data.drawing_area.maximum_flux}
            function_on_blur={eventMaxLinkThickness}
            minimum_value={app_data.drawing_area.minimum_flux}
            stepper={true}
            unit_text={right_addon_pixel(app_data.drawing_area.maximum_flux!)}
          />
        </OSTooltip>
      </Box>

    </Box>

    {/* Mode Structure : forcer toutes les épaisseurs à minimum_flux */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={app_data.drawing_area.structure_mode_force_min}
      icon={<CustomFaEyeCheckIcon />}
      onChange={eventStructureForceMin}
    >
      <OSTooltip label={t('MEP.tooltips.StructureForceMin')}>
        {t('MEP.StructureForceMin')}
      </OSTooltip>
    </Checkbox>

    {/* Layout des flèches : triangle indépendant par flux (défaut) vs éventail partagé (legacy) */}
    <Checkbox
      variant='menuconfigpanel_option_checkbox'
      isChecked={app_data.drawing_area.arrow_use_standalone_layout}
      icon={<CustomFaEyeCheckIcon />}
      onChange={eventArrowStandaloneLayout}
    >
      <OSTooltip label={t('MEP.tooltips.ArrowStandaloneLayout')}>
        {t('MEP.ArrowStandaloneLayout')}
      </OSTooltip>
    </Checkbox>

    {extra_background_element}

    <WrapperBoxSubSectionMenu title={t('Menu.ElOrder')} new_data={app_data} is_open={false}>
      <GraphElementsOrdoner app_data={app_data} />
    </WrapperBoxSubSectionMenu>
  </>
}

/**
 * ✅ Composant unifié pour configurer la légende (style + contenu)
 *
 * @param {*} { app_data }
 * @return {*} 
 */
export const LegendConfig = ({ app_data }: { app_data: Class_ApplicationData }) => {

  const { t } = app_data
  const [, setCount] = useState(0)

  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    // Whatever is done, set saving indicator
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // And update this menu also
    setCount(a => a + 1)
  }

  // Event functions -------------------------------------------------------------------

  // ✅ Visibilité principale
  const eventLegendMasked = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.masked = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'masked', !evt.target.checked, f)
  }

  // ✅ Style
  const eventLegendBgColor = (evt: string) => {
    const f = (_: string) => {
      app_data.drawing_area.legend.legend_bg_color = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_bg_color', evt, f)
  }

  const eventLegendBgOpacity = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        app_data.drawing_area.legend.legend_bg_opacity = _
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_bg_opacity', evt, f)
    }
  }

  const eventLegendBorder = (checked: boolean) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.legend_bg_border = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_bg_border', checked, f)
  }

  const eventLegendFontSize = (evt: number | null | undefined) => {
    if (evt) {
      const f = (_: number) => {
        app_data.drawing_area.legend.legend_police = _
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_police', evt, f)
    }
  }

  // ✅ Position
  const eventLegendStickDrawing = (checked: boolean) => {
    const f = (_: boolean) => {
      const { drawing_area } = app_data
      drawing_area.legend.stick_to_drawing = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'stick_to_drawing', checked, f)
  }

  const eventLegendPosX = (evt: number | undefined | null) => {
    if (evt !== undefined && evt !== null) {
      const f = (_: number) => {
        app_data.drawing_area.legend.position_x = _
        app_data.drawing_area.legend.applyPosition()
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'position_x', evt, f)
    }
  }

  const eventLegendPosY = (evt: number | undefined | null) => {
    if (evt !== undefined && evt !== null) {
      const f = (_: number) => {
        app_data.drawing_area.legend.position_y = _
        app_data.drawing_area.legend.applyPosition()
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'position_y', evt, f)
    }
  }

  const eventLegendWidth = (evt: number | undefined | null) => {
    if (evt) {
      const f = (_: number) => {
        app_data.drawing_area.legend.width = _
        refreshThisAndUpdateRelatedComponents()
      }
      app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'width', evt, f)
    }
  }

  // ✅ Contenu
  const eventLegendScale = (checked: boolean) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.display_legend_scale = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'display_legend_scale', checked, f)
  }

  const eventLegendDataTag = (checked: boolean) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.legend_show_dataTags = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_show_dataTags', checked, f)
  }

  const eventLegendDataType = (checked: boolean) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.legend_show_data_type = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_show_data_type', checked, f)
  }

  return <Box layerStyle='menu_sub_section'>
    {/* ✅ TITRE AVEC CHECKBOX DE VISIBILITÉ */}
    <Box
      as='span'
      layerStyle='menu_sub_section_title'
    >
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isChecked={!app_data.drawing_area.legend.masked}
        onChange={eventLegendMasked}
      >
        {t('Menu.Leg')}
      </Checkbox>
    </Box>

    <Box
      layerStyle='menuconfigpanel_grid'
      style={{ display: (app_data.drawing_area.legend.masked ? 'none' : '') }}
    >
      {/* Couleur + Opacité du fond */}
      <Box as='span' layerStyle='options_2cols'>
        <OSTooltip label={t('Menu.tooltips.LegBgColor')}>
          <Box>
            <MenuColorPicker
              initialColor={app_data.drawing_area.legend.legend_bg_color}
              onColorChange={eventLegendBgColor}
            />
          </Box>
        </OSTooltip>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Menu.LegBgOpacity')}
          </Box>
          <OSTooltip label={t('Menu.tooltips.LegBgOpacity')}>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={app_data.drawing_area.legend.legend_bg_opacity}
              function_on_blur={eventLegendBgOpacity}
              minimum_value={0}
              maximum_value={100}
              stepper={true}
              unit_text='%'
            />
          </OSTooltip>
        </Box>
      </Box>

      {/* Taille de police + Bordure */}
      <Box as='span' layerStyle='options_2cols'>
        <OSTooltip label={t('Menu.tooltips.fontSize')}>
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={app_data.drawing_area.legend.legend_police}
            function_on_blur={eventLegendFontSize}
            minimum_value={1}
            stepper={true}
            unit_text='px'
          />
        </OSTooltip>
        <OSTooltip label={t('Menu.tooltips.LegBgBorder')}>
          <Button
            variant={app_data.drawing_area.legend.legend_bg_border ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => eventLegendBorder(!app_data.drawing_area.legend.legend_bg_border)}
          >
            {t('Menu.LegBgBorder')}
          </Button>
        </OSTooltip>
      </Box>

      {/* ✅ SECTION POSITION */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.position') || 'Position'}</Box>

      {/* Solidaire du diagramme + Largeur */}
      <Box as='span' layerStyle='options_2cols'>
        <OSTooltip label={t('Menu.tooltips.LegStickDrawing')}>
          <Button
            variant={app_data.drawing_area.legend.stick_to_drawing ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => eventLegendStickDrawing(!app_data.drawing_area.legend.stick_to_drawing)}
          >
            {t('Menu.LegStickDrawing')}
          </Button>
        </OSTooltip>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Menu.LegWidth')}
          </Box>
          <OSTooltip label={t('Menu.tooltips.LegWidth')}>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={app_data.drawing_area.legend.width}
              function_on_blur={eventLegendWidth}
              minimum_value={0}
              step={1}
              stepper={true}
              unit_text={right_addon_pixel(app_data.drawing_area.legend.width)}
            />
          </OSTooltip>
        </Box>
      </Box>

      {/* Position X + Y */}
      <Box as='span' layerStyle='options_2cols'>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Menu.LegX')}
          </Box>
          <OSTooltip label={t('Menu.tooltips.LegX')}>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={app_data.drawing_area.legend.position_x}
              function_on_blur={eventLegendPosX}
              step={1}
              stepper={true}
              unit_text={right_addon_pixel(Math.round(app_data.drawing_area.legend.position_x))}
            />
          </OSTooltip>
        </Box>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Menu.LegY')}
          </Box>
          <OSTooltip label={t('Menu.tooltips.LegY')}>
            <ConfigMenuNumberInput
              t={app_data.t}
              default_value={app_data.drawing_area.legend.position_y}
              function_on_blur={eventLegendPosY}
              step={1}
              stepper={true}
              unit_text={right_addon_pixel(Math.round(app_data.drawing_area.legend.position_y))}
            />
          </OSTooltip>
        </Box>
      </Box>

      {/* ✅ SECTION CONTENU */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.content') || 'Contenu'}</Box>

      {/* Contenu : échelle + dataTags + type de données */}
      <Box as='span' layerStyle='options_3cols'>
        <Button
          variant={app_data.drawing_area.legend.display_legend_scale ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
          onClick={() => eventLegendScale(!app_data.drawing_area.legend.display_legend_scale)}
        >
          {t('Menu.display_scale')}
        </Button>
        <Button
          variant={app_data.drawing_area.legend.legend_show_dataTags ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
          onClick={() => eventLegendDataTag(!app_data.drawing_area.legend.legend_show_dataTags)}
        >
          {t('MEP.leg_show_dataTags')}
        </Button>
        <Button
          variant={app_data.drawing_area.legend.legend_show_data_type ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
          onClick={() => eventLegendDataType(!app_data.drawing_area.legend.legend_show_data_type)}
        >
          {t('MEP.leg_show_data_type')}
        </Button>
      </Box>

    </Box>
  </Box>
}
/**
 * Composant de configuration du titre du diagramme (cf. ClassTemplate_DrawingTitle).
 * Affiché à côté de la légende dans l'onglet style.
 */
export const TitleConfig = ({ app_data }: { app_data: Class_ApplicationData }) => {

  const { t } = app_data
  const [, setCount] = useState(0)
  const sankey = app_data.drawing_area.sankey
  const title = sankey.getTitleContainer()
  const is_shown = !!title && title.is_visible

  const refreshThisAndUpdateRelatedComponents = () => {
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setCount(a => a + 1)
  }

  const data_taggs = sankey.data_taggs_list
  const [token_group_id, setTokenGroupId] = useState('')

  // La visibilité du titre est pilotée ici. Le texte (statique + jetons) et le
  // reste du style s'éditent via l'interface normale des zones de texte.
  const eventTitleShown = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (evt.target.checked) {
      sankey.getOrCreateTitleContainer().setVisible()
    } else {
      title?.setInvisible()
    }
    app_data.drawing_area.draw()
    refreshThisAndUpdateRelatedComponents()
  }

  // Insère le jeton {NomDuGroupe} à la fin du texte du titre. Au rendu, il est
  // remplacé par la valeur sélectionnée du data tag (combine statique + data tag).
  const eventInsertToken = () => {
    const grp = data_taggs.find(g => g.id === token_group_id)
    if (!grp) return
    const c = sankey.getOrCreateTitleContainer()
    const token = '{' + grp.name + '}'
    c.name = c.name ? c.name + ' ' + token : token
    app_data.drawing_area.draw()
    refreshThisAndUpdateRelatedComponents()
  }

  return <Box layerStyle='menu_sub_section'>
    <Box as='span' layerStyle='menu_sub_section_title'>
      <Checkbox
        variant='menuconfigpanel_part_title_1_checkbox'
        icon={<CustomFaEyeCheckIcon />}
        isChecked={is_shown}
        onChange={eventTitleShown}
      >
        {t('Menu.TitleSection')}
      </Checkbox>
    </Box>

    <Box
      layerStyle='menuconfigpanel_grid'
      style={{ display: (is_shown ? '' : 'none') }}
    >
      {/* Édition du texte via l'interface ZDT */}
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.TitleEditHint')}
      </Box>

      {/* Insertion d'un jeton data tag (combine statique + data tag) */}
      {data_taggs.length > 0 &&
        <Box as='span' layerStyle='options_2cols'>
          <OSTooltip label={t('Menu.tooltips.TitleGroupSelect')}>
            <Select
              size='sm'
              value={token_group_id}
              onChange={(evt) => setTokenGroupId(evt.target.value)}
            >
              <option value=''>{t('Menu.TitleSelectGroup')}</option>
              {data_taggs.map(tagg => (
                <option key={tagg.id} value={tagg.id}>{tagg.name}</option>
              ))}
            </Select>
          </OSTooltip>
          <Button
            variant='menuconfigpanel_option_button'
            isDisabled={token_group_id === ''}
            onClick={eventInsertToken}
          >
            {t('Menu.TitleInsertToken')}
          </Button>
        </Box>
      }
    </Box>
  </Box>
}

export const GraphElementsOrdoner = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { icon_move_element_down, icon_move_element_up } = app_data.icon_library
  const [, forceUpdate] = useState(0)

  const triggerUpdate = () => forceUpdate(prev => prev + 1)

  const style_TableLineDragging = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined, is_selected: boolean) => ({
    borderColor: is_selected ? 'red' : 'black',
    ...draggableStyle
  })

  const handleDragEnd: OnDragEndResponder = (evt) => {
    if (evt.destination && evt.destination.index !== undefined && evt.source.index !== evt.destination.index) {
      app_data.drawing_area.moveOrderElementInDA(evt.source.index, evt.destination.index)
      triggerUpdate()
    }
  }

  const handleMoveUp = (element_idx: number) => {
    if (element_idx > 0) {
      app_data.drawing_area.moveOrderElementInDA(element_idx, element_idx - 1)
      triggerUpdate()
    }
  }

  const handleMoveDown = (element_idx: number, maxIdx: number) => {
    if (element_idx < maxIdx - 1) {
      app_data.drawing_area.moveOrderElementInDA(element_idx, element_idx + 1)
      triggerUpdate()
    }
  }

  // Nettoyer la liste : enlever doublons, legend et ghost_link
  const cleanedElements = [...new Set(
    app_data.drawing_area.list_g_element.filter(id =>
      id !== 'legend' &&
      id !== 'ghost_link' &&
      !id.includes('ghost')
    )
  )]

  console.log('Cleaned elements:', cleanedElements)

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              display: 'grid',
              gridRowGap: '0.2rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {cleanedElements.map((id_element, element_idx) => {
              const element = app_data.drawing_area.sankey.elementFromId(id_element)
              if (!element?.is_visible) return null

              return (
                <Draggable
                  key={id_element}
                  index={element_idx}
                  draggableId={id_element}
                >
                  {(provided, snapshot) => (
                    <Box
                      layerStyle='drag_line_element_order'
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={style_TableLineDragging(snapshot.isDragging, provided.draggableProps.style, element.is_selected)}
                    >
                      <Box className='name_element'>{element.name}</Box>
                      <Box layerStyle="options_2cols">
                        <Button
                          variant='menuconfigpanel_move_order_node_io'
                          minWidth='0'
                          disabled={element_idx === 0}
                          onClick={() => handleMoveUp(element_idx)}
                        >
                          {icon_move_element_up}
                        </Button>
                        <Button
                          variant='menuconfigpanel_move_order_node_io'
                          minWidth='0'
                          disabled={element_idx === cleanedElements.length - 1}
                          onClick={() => handleMoveDown(element_idx, cleanedElements.length)}
                        >
                          {icon_move_element_down}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  )
}
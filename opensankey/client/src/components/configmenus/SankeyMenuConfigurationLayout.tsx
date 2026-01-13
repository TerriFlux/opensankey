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
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { CustomFaEyeCheckIcon, OSTooltip } from './MenuCommon'

// Utils functions -------------------------------------------------------------------

const right_addon_pixel = (val: number) => {
  if (val === 1) {
    return 'pixel'
  }
  return 'px'
}

/**
 * ✅ Composant unifié pour la zone de dessin (style + échelle + limites)
 */
export const DrawingAreaConfig = ({
  app_data,
  extra_background_element
}: {
  app_data: Class_ApplicationData
  extra_background_element?: JSX.Element
}) => {

  // Data -------------------------------------------------------------------------------
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

  // Components updaters ---------------------------------------------------------------
  /**
   * Function used to reset menu UI
   */
  const refreshThisAndUpdateRelatedComponents = () => {
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setCount(a => a + 1)
    app_data.menu_configuration.updateComponentRelatedToLayoutApparence()
  }

  // Event functions -------------------------------------------------------------------
  // ✅ SECTION STYLE FOND & GRILLE

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

  // ✅ SECTION ÉCHELLE & LIMITES

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

  return <WrapperBoxSubSectionMenu title={t('Menu.background')} new_data={app_data}>
    <>
      {/* ✅ SECTION STYLE */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.style') || 'Style'}</Box>

      {/* Couleur du fond de la page */}
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

      {extra_background_element}

      {/* ✅ SECTION GRILLE */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.grid') || 'Grille'}</Box>

      {/* Afficher le quadrillage + Taille */}
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

      {/* ✅ SECTION ÉCHELLE & LIMITES DES FLUX */}
      <Box as='span' textStyle='title_sub_section'>{t('MEP.links_size') || 'Taille des flux'}</Box>

      {/* Sélecteur d'unité (si tags unitaires présents) */}
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
      <Button
        variant={'menuconfigpanel_option_button'}
        onClick={() => {
          app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_element_ordoner.current(true)
        }}
      >
        {t('Menu.ElOrder')}
      </Button>
    </>
  </WrapperBoxSubSectionMenu>
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

  const eventLegendBorder = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.legend_bg_border = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_bg_border', evt.target.checked, f)
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
  const eventLegendStickDrawing = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      const { drawing_area } = app_data
      drawing_area.legend.stick_to_drawing = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'stick_to_drawing', evt.target.checked, f)
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
  const eventLegendScale = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.display_legend_scale = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'display_legend_scale', evt.target.checked, f)
  }

  const eventLegendDataTag = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.legend_show_dataTags = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_show_dataTags', evt.target.checked, f)
  }

  const eventLegendConstraints = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.legend_show_constraints = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'legend_show_constraints', evt.target.checked, f)
  }

  const eventLegendLinkInfo = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = (_: boolean) => {
      app_data.drawing_area.legend.info_link_value_void = _
      refreshThisAndUpdateRelatedComponents()
    }
    app_data.setValueAndSaveHistory(app_data.drawing_area.legend, 'info_link_value_void', evt.target.checked, f)
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
      {/* ✅ SECTION STYLE */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.style') || 'Style'}</Box>

      {/* Couleur de fond */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_suboption_name'>
          {t('Menu.LegBgColor')}
        </Box>
        <OSTooltip label={t('Menu.tooltips.LegBgColor')}>
          <Box>
            <MenuColorPicker
              initialColor={app_data.drawing_area.legend.legend_bg_color}
              onColorChange={eventLegendBgColor}
            />
          </Box>
        </OSTooltip>
      </Box>

      {/* Opacité du fond */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_suboption_name'>
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

      {/* Affichage du bord */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.legend.legend_bg_border}
        onChange={eventLegendBorder}
      >
        <OSTooltip label={t('Menu.tooltips.LegBgBorder')}>
          {t('Menu.LegBgBorder')}
        </OSTooltip>
      </Checkbox>

      {/* Taille de police */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_suboption_name'>
          {t('Menu.fontSize')}
        </Box>
        <OSTooltip label={t('Menu.tooltips.fontSize')}>
          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={app_data.drawing_area.legend.legend_police}
            function_on_blur={eventLegendFontSize}
            minimum_value={1}
            stepper={true}
          />
        </OSTooltip>
      </Box>

      {/* ✅ SECTION POSITION */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.position') || 'Position'}</Box>

      {/* Solidaire du diagramme */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.legend.stick_to_drawing}
        onChange={eventLegendStickDrawing}
      >
        <OSTooltip label={t('Menu.tooltips.LegStickDrawing')}>
          {t('Menu.LegStickDrawing')}
        </OSTooltip>
      </Checkbox>

      {/* Position X */}
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

      {/* Position Y */}
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

      {/* Largeur */}
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

      {/* ✅ SECTION CONTENU */}
      <Box as='span' textStyle='title_sub_section'>{t('Menu.content') || 'Contenu'}</Box>

      {/* Afficher l'échelle */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.legend.display_legend_scale}
        onChange={eventLegendScale}
      >
        {t('Menu.display_scale')}
      </Checkbox>

      {/* Afficher les dataTags */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.legend.legend_show_dataTags}
        onChange={eventLegendDataTag}
      >
        {t('MEP.leg_show_dataTags')}
      </Checkbox>

      {/* Afficher les contraintes */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.legend.legend_show_constraints}
        onChange={eventLegendConstraints}
      >
        {t('MEP.leg_show_constraints')}
      </Checkbox>

      {/* Afficher l'info flux null */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={app_data.drawing_area.legend.info_link_value_void}
        onChange={eventLegendLinkInfo}
      >
        {t('MEP.leg_show_info_link_void')}
      </Checkbox>

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

  const handleDragEnd = (evt: any) => {
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
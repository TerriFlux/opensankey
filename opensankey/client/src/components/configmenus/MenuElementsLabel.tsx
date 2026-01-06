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


import React, { useState } from 'react'
import { Box, Button, Select, Input,Divider } from '@chakra-ui/react'
import { useRef, ChangeEvent } from 'react'
import { FaAlignCenter, FaAlignLeft, FaAlignRight } from 'react-icons/fa'
import { MdTextRotateVertical, MdTextRotationNone } from 'react-icons/md'
import { t } from 'i18next'
import { svg_label_upper } from '../../css/IconLibrairie'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { default_style_id } from '../../types/Utils'
import { font_families } from '../../Elements/ElementsAttributesConfig'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_NodeBase } from '../../Elements/NodeBase'
import {
  BASE_LABEL_CONFIG, isConfigValueIndeterminate,
  LINKS_LABEL_SPECIFIC_CONFIG, ShapePrefix
} from '../../Elements/ElementsAttributesConfig'
import { Class_ElementStyle } from '../../Elements/Element'

import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import {
  ElementAttrSetterTextInput2Cols, 
  MenuSectionCheckbox, OSTooltip, ConfigMenuNumberInput, ElementAttrSetterNumberInput2Cols,
  TooltipElementOverloaded,
  MenuColorPicker,
  getButtonVariant,
  LabelWithOverload
} from './MenuCommon'
import {
  ElementsType, getElementsLabelValues, getIconValues,
  getElementsNameLabelValues, getLinksLabelValues
} from '../../Elements/ElementsAttributesConfig'

import {
  ICON_LABEL_BASE_CONFIG, LINKS_ATTRIBUTES_CONFIG, NAME_LABEL_CONFIG,
  NODES_ATTRIBUTES_CONFIG, VALUE_LABEL_CONFIG
} from '../../Elements/ElementsAttributesConfig'
import { SankeyLinkSelectionSimple, SankeyNodeSelectionSimple, SankeyContainerSelectionSimple } from './MenuElementsSelection'
import { MenuShapeAttributes } from './MenuElementsShape'

export const SankeyMenuLabelComponent = ({
  app_data,
  attributePath,
  elements,
  refreshParentComponent,
  prefix
}: {
  app_data: Class_ApplicationData
  attributePath: string
  elements: ElementsType,
  refreshParentComponent: () => void,
  prefix: 'name_label' | 'value_label' | 'icon'
}) => {
  // ✅ État pour gérer le mode d'affichage
  type DisplayMode = 'simple_text' | 'rich_text' | 'icon' | 'image'

  const labelValues = elements.length > 0
    ? getElementsLabelValues(elements, prefix, refreshParentComponent)
    : Object.fromEntries(
      Object.entries(BASE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof BASE_LABEL_CONFIG]: ReturnType<typeof BASE_LABEL_CONFIG[K]['type']> }

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (elements.length === 0) return 'simple_text'
    if (labelValues.has_fo) return 'rich_text'
    if (labelValues.is_image) return 'image'
    if (labelValues.is_icon) return 'icon'
    return 'simple_text'
  })

  const { ref_selected_style_node, ref_selected_style_link } = app_data.menu_configuration
  const { node_styles_dict, link_styles_dict } = app_data.drawing_area.sankey
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)

  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_ElementStyle || elements[0] instanceof Class_NodeElement)
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]
  const links_elements = elements as Class_LinkElement[] | Class_ElementStyle[]
  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link

  const disable_attr_props = menu_for_style ?
    correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute :
    correct_dict_style_to_use[default_style_id].customisable_attribute

  const linkLabelValues = elements.length > 0
    ? getLinksLabelValues(links_elements, prefix, refreshParentComponent)
    : Object.fromEntries(
      Object.entries(LINKS_LABEL_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof LINKS_LABEL_SPECIFIC_CONFIG]: ReturnType<typeof LINKS_LABEL_SPECIFIC_CONFIG[K]['type']> }

  const position_config = BASE_LABEL_CONFIG
  const position_values = labelValues

  const _load_image = useRef<HTMLInputElement>(null)

  const setModeSimpleText = () => {
    labelValues.has_fo = false
    labelValues.icon_name = ''
    setDisplayMode('simple_text')
  }

  const setModeRichText = () => {
    app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_rich_text_editor.current(true)
    app_data.menu_configuration.r_editor_content_set_elements.current(base_elements, prefix)
    labelValues.has_fo = true
    labelValues.icon_name = ''
    setDisplayMode('rich_text')
  }

  const setModeIcon = () => {
    labelValues.has_fo = false
    setDisplayMode('icon')
  }

  const setModeImage = () => {
    setDisplayMode('image')
  }

  // ✅ Valeur pour icon/image (premier élément seulement)
  const firstElement = elements.length > 0 ? elements[0] as Class_NodeBase : null
  const iconColor = firstElement?.icon_color ?? '#ffffff'
  const iconColorSustainable = firstElement?.icon_color_sustainable ?? false

  return <Box layerStyle='menuconfigpanel_grid'>
    <Box layerStyle='menuconfigpanel_grid'>
      {/* ✅ Sélecteur de mode : 4 boutons */}
      {prefix != 'value_label' ? <Box layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='options_4cols'>
          {prefix == 'name_label' ? <><Button
            variant={displayMode === 'simple_text' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            onClick={setModeSimpleText}
          >
            Text
          </Button>
            <Button
              variant={displayMode === 'rich_text' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
              onClick={setModeRichText}
            >
              Rich
            </Button></> : <></>}
          {prefix == 'icon' ? <><Button
            variant={displayMode === 'icon' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
            onClick={setModeIcon}
          >
            Icon
          </Button>
            <Button
              variant={displayMode === 'image' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
              onClick={setModeImage}
            >
              Image
            </Button></> : <></>}
        </Box>
      </Box> : <></>}

      {/* ✅ Section TEXT (simple seulement, pas rich) */}
      {displayMode === 'simple_text' && <>
        <Box layerStyle='options_2cols'>
          {/* ✅ Font family avec indicateur */}
          <LabelWithOverload attributeKey="font_family" elements={elements} config={BASE_LABEL_CONFIG} prefix={prefix} t={app_data.t}>
            <Select
              isDisabled={!Reflect.get(disable_attr_props, prefix + '_font_family')}
              variant='menuconfigpanel_option_select'
              value={labelValues.font_family}
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                labelValues.font_family = evt.target.value
              }}
            >
              {font_families.map((d: string) => (
                <option style={{ fontFamily: d }} key={'ff-' + d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </LabelWithOverload>

          {/* ✅ Font size avec indicateur */}
          <LabelWithOverload attributeKey="font_size" elements={elements} config={BASE_LABEL_CONFIG} prefix={prefix} t={app_data.t}>
            <ConfigMenuNumberInput
              disabled={!Reflect.get(disable_attr_props, prefix + '_font_size')}
              t={app_data.t}
              default_value={labelValues.font_size}
              menu_for_style={menu_for_style}
              minimum_value={11}
              stepper={true}
              unit_text='px'
              function_on_blur={(value) => {
                labelValues.font_size = value ?? labelValues.font_size
              }}
              multiValue={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'font_size', prefix)}
            />
          </LabelWithOverload>
        </Box>

        <Box as='span' layerStyle='options_2cols'>
          {/* ✅ Style de texte avec indicateur groupé + getButtonVariant */}
          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_bold')}
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'bold', prefix), labelValues.bold)}
                paddingStart='0' paddingEnd='0' minWidth='0'
                onClick={() => { labelValues.bold = !labelValues.bold }}
              >
                {app_data.icon_library.icon_text_bold}
              </Button>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_uppercase')}
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'uppercase', prefix), labelValues.uppercase)}
                paddingStart='0' paddingEnd='0' minWidth='0'
                onClick={() => { labelValues.uppercase = !labelValues.uppercase }}
              >
                {svg_label_upper}
              </Button>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_italic')}
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'italic', prefix), labelValues.italic)}
                paddingStart='0' paddingEnd='0' minWidth='0'
                onClick={() => { labelValues.italic = !labelValues.italic }}
              >
                {app_data.icon_library.icon_text_italic}
              </Button>
            </Box>
            {/* Indicateur pour le groupe bold/uppercase/italic */}
            <TooltipElementOverloaded attributeKey={`${prefix}_bold` as any} elements={elements as any} config={BASE_LABEL_CONFIG} t={app_data.t} />
          </Box>

          {/* ✅ Couleur avec indicateur */}
          <LabelWithOverload attributeKey="color" elements={elements} config={BASE_LABEL_CONFIG} prefix={prefix} t={app_data.t}>
            <MenuColorPicker
              isDisabled={!Reflect.get(disable_attr_props, prefix + '_color')}
              initialColor={labelValues.color}
              onColorChange={(new_color) => { labelValues.color = new_color }}
            />
          </LabelWithOverload>
        </Box>

        <Box layerStyle='options_2cols'>
          {/* ✅ Text align avec indicateur groupé + getButtonVariant */}
          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.left_align')}>
                <Button
                  isDisabled={!Reflect.get(disable_attr_props, prefix + '_text_align')}
                  paddingStart='0' paddingEnd='0' minWidth='0'
                  variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix), labelValues.text_align === 'left')}
                  onClick={() => { labelValues.text_align = 'left' }}
                >
                  <FaAlignLeft />
                </Button>
              </OSTooltip>
              <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.center_align')}>
                <Button
                  isDisabled={!Reflect.get(disable_attr_props, prefix + '_text_align')}
                  paddingStart='0' paddingEnd='0' minWidth='0'
                  variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix), labelValues.text_align === 'middle')}
                  onClick={() => { labelValues.text_align = 'middle' }}
                >
                  <FaAlignCenter />
                </Button>
              </OSTooltip>
              <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.right_align')}>
                <Button
                  isDisabled={!Reflect.get(disable_attr_props, prefix + '_text_align')}
                  paddingStart='0' paddingEnd='0' minWidth='0'
                  variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix), labelValues.text_align === 'right')}
                  onClick={() => { labelValues.text_align = 'right' }}
                >
                  <FaAlignRight />
                </Button>
              </OSTooltip>
            </Box>
            {/* Indicateur pour text_align */}
            <TooltipElementOverloaded attributeKey={`${prefix}_text_align` as any} elements={elements as any} config={BASE_LABEL_CONFIG} t={app_data.t} />
          </Box>

          {/* ✅ Vertical text + on_path + pos_auto avec indicateurs + getButtonVariant */}
          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <OSTooltip label={t('Noeud.labels.tooltips.name_label_vertical_text') || 'Vertical'}>
                <Button
                  isDisabled={!Reflect.get(disable_attr_props, prefix + '_vertical_text')}
                  variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vertical_text', prefix), labelValues.vertical_text)}
                  paddingStart='0' paddingEnd='0' minWidth='0'
                  onClick={() => { labelValues.vertical_text = !labelValues.vertical_text }}
                >
                  {labelValues.vertical_text ? <MdTextRotateVertical /> : <MdTextRotationNone />}
                </Button>
              </OSTooltip>
              <Button
                variant={getButtonVariant('', isConfigValueIndeterminate(links_elements, LINKS_LABEL_SPECIFIC_CONFIG, 'on_path', prefix), linkLabelValues.on_path)}
                paddingStart='0' paddingEnd='0' minWidth='0'
                onClick={() => { linkLabelValues.on_path = !linkLabelValues.on_path }}
              >
                {app_data.icon_library.icon_label_on_path}
              </Button>
              <Button
                variant={getButtonVariant('', isConfigValueIndeterminate(links_elements, LINKS_LABEL_SPECIFIC_CONFIG, 'pos_auto', prefix), linkLabelValues.pos_auto)}
                paddingStart='0' paddingEnd='0' minWidth='0'
                onClick={() => { linkLabelValues.pos_auto = !linkLabelValues.pos_auto }}
              >
                {app_data.icon_library.icon_label_auto_position}
              </Button>
            </Box>
            {/* Indicateur pour vertical_text */}
            <TooltipElementOverloaded attributeKey={`${prefix}_vertical_text` as any} elements={elements as any} config={BASE_LABEL_CONFIG} t={app_data.t} />
          </Box>
        </Box>
      </>}

      {/* ✅ Section ICON */}
      {displayMode === 'icon' && <>
        <Box layerStyle='menuconfigpanel_row_2cols'>
          <Box as='span' layerStyle='menuconfigpanel_option_name'>
            Catalogue d'icônes
          </Box>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_import_icons?.current?.(true)
              app_data.menu_configuration.icon_selector_set_elements.current(base_elements, prefix)
            }}
          >
            {app_data.icon_library.icon_open_modal_icon}
          </Button>
        </Box>

        <Box layerStyle='menuconfigpanel_row_3cols'>
          <Box as='span' layerStyle='menuconfigpanel_option_name'>
            Couleur icône
          </Box>
          <MenuColorPicker
            initialColor={iconColor}
            onColorChange={(new_color) => {
              base_elements.forEach(el => {
                if ('icon_color' in el) {
                  el.icon_color = new_color
                  el.draw()
                }
              })
            }}
          />
          <Button
            variant={iconColorSustainable ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              base_elements.forEach(el => {
                if ('icon_color_sustainable' in el) {
                  el.icon_color_sustainable = !iconColorSustainable
                  el.draw()
                }
              })
              refreshParentComponent()
            }}
          >
            {iconColorSustainable ? app_data.icon_library.icon_locked : app_data.icon_library.icon_unlocked}
          </Button>
        </Box>
      </>}

      {/* ✅ Section IMAGE */}
      {displayMode === 'image' && <>
        <Box layerStyle='menuconfigpanel_row_2cols'>
          <Box as='span' layerStyle='menuconfigpanel_option_name'>
            Source image
          </Box>
          <Box as='span' layerStyle='options_2cols'>
            <Button
              variant='menuconfigpanel_option_button_left'
              onClick={() => {
                if (_load_image.current) {
                  _load_image.current.name = ''
                  _load_image.current.click()
                }
              }}
            >
              {app_data.icon_library.icon_import_file_image}
            </Button>
            <Button
              variant='menuconfigpanel_option_button_right'
              onClick={() => {
                base_elements.forEach(el => {
                  if ('image_src' in el) {
                    el.image_src = ''
                    el.draw()
                  }
                })
              }}
            >
              {app_data.icon_library.icon_delete}
            </Button>
          </Box>
          <Input
            ref={_load_image}
            style={{ display: 'none' }}
            accept='image/*'
            type="file"
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (e: ProgressEvent<FileReader>) => {
                const resultat = (e.target as FileReader).result
                const res = resultat?.toString().replaceAll('=', '')
                base_elements.forEach(el => {
                  if ('image_src' in el) {
                    el.image_src = res as string
                    el.draw()
                  }
                })
              }
              reader.readAsDataURL(files[0])
            }}
          />
        </Box>
      </>}
    <Divider borderBottomWidth='2px' opacity='1' borderColor='primaire.2' />
      {/* Décalage (toujours visible) */}
      <Box as='span' textStyle='title_sub_section'>Position, taille et décalages</Box>
      {/* ✅ POSITION (toujours visible) */}
      <Box layerStyle='options_2cols'>
        {/* ✅ Position horizontale avec indicateur groupé + getButtonVariant */}
        <Box display="flex" alignItems="center" gap={1}>
          <Box layerStyle='options_4cols'>
            <OSTooltip label={isConfigValueIndeterminate(elements, position_config, 'horiz', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.deb')}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_horiz')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, position_config, 'horiz', prefix), position_values.horiz === 'left')}
                onClick={() => { position_values.horiz = 'left' }}
              >
                {app_data.icon_library.icon_text_align_left}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, position_config, 'horiz', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.milieu_h')}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_horiz')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, position_config, 'horiz', prefix), position_values.horiz === 'middle')}
                onClick={() => { position_values.horiz = 'middle' }}
              >
                {app_data.icon_library.icon_text_align_center}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, position_config, 'horiz', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.fin')}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_horiz')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, position_config, 'horiz', prefix), position_values.horiz === 'right')}
                onClick={() => { position_values.horiz = 'right' }}
              >
                {app_data.icon_library.icon_text_align_right}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_horiz', prefix) ? "Valeurs multiples" : (labelValues.inside_horiz ? "Extérieur" : "Intérieur")}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_inside_horiz')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_horiz', prefix), labelValues.inside_horiz)}
                onClick={() => { labelValues.inside_horiz = !labelValues.inside_horiz }}
              >
                {app_data.icon_library.icon_label_inside_horiz}
              </Button>
            </OSTooltip>
          </Box>
          {/* Indicateur pour horiz */}
          <TooltipElementOverloaded attributeKey={`${prefix}_horiz` as any} elements={elements as any} config={BASE_LABEL_CONFIG} t={app_data.t} />
        </Box>

        {/* ✅ Position verticale avec indicateur groupé + getButtonVariant */}
        <Box display="flex" alignItems="center" gap={1}>
          <Box layerStyle='options_4cols'>
            <OSTooltip label={isConfigValueIndeterminate(elements, position_config, 'vert', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.dessous')}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_vert')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, position_config, 'vert', prefix), labelValues.vert === 'bottom')}
                onClick={() => { position_values.vert = 'bottom' }}
              >
                {app_data.icon_library.icon_text_vert_pos_bottom}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, position_config, 'vert', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.milieu_v')}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_vert')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, position_config, 'vert', prefix), labelValues.vert === 'middle')}
                onClick={() => { position_values.vert = 'middle' }}
              >
                {app_data.icon_library.icon_text_vert_pos_center}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, position_config, 'vert', prefix) ? "Valeurs multiples" : t(attributePath + '.tooltips.dessus')}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_vert')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, position_config, 'vert', prefix), labelValues.vert === 'top')}
                onClick={() => { position_values.vert = 'top' }}
              >
                {app_data.icon_library.icon_text_vert_pos_top}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_vert', prefix) ? "Valeurs multiples" : (labelValues.inside_vert ? "Extérieur" : "Intérieur")}>
              <Button
                isDisabled={!Reflect.get(disable_attr_props, prefix + '_inside_vert')}
                paddingStart='0' paddingEnd='0' minWidth='0'
                variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_vert', prefix), labelValues.inside_vert)}
                onClick={() => { labelValues.inside_vert = !labelValues.inside_vert }}
              >
                {app_data.icon_library.icon_label_inside_vert}
              </Button>
            </OSTooltip>
          </Box>
          {/* Indicateur pour vert */}
          <TooltipElementOverloaded attributeKey={`${prefix}_vert` as any} elements={elements as any} config={BASE_LABEL_CONFIG} t={app_data.t} />
        </Box>
      </Box>

      <Box layerStyle='options_2cols'>
        {/* ElementAttrSetterNumberInput2Cols gère déjà l'indicateur en interne */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'horiz_shift'}
          config={BASE_LABEL_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshParentComponent}
          unit_text='px'
        />
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'vert_shift'}
          config={BASE_LABEL_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshParentComponent}
          unit_text='px'
        />
      </Box>

      {/* Box width (pour text seulement) */}
      <Box layerStyle='options_2cols'>
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'box_width'}
          config={BASE_LABEL_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshParentComponent}
          unit_text='px'
        />
        <></>
      </Box>
    </Box>
    <Divider borderBottomWidth='2px' opacity='1' borderColor='primaire.2' />
          <Box as='span' textStyle='title_sub_section'>Fond</Box>
      <MenuShapeAttributes
        app_data={app_data}
        elements={elements}
        attributePath={attributePath}
        prefix={prefix + '_background' as ShapePrefix}
        disable_attr_props={disable_attr_props}
        refreshUI={refreshParentComponent}
      />
  </Box>
}
// Composant générique factorisant NodeLabel, LinkLabel et ContainerLabel
const MenuConfigurationLabel = ({
  app_data,
  menu_for_style,
  elementType // 'nodes', 'links' ou 'containers'
}: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean,
  elementType: 'nodes' | 'links' | 'containers'
}) => {
  const { t, drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area

  const [, setCount] = useState(0)
  const [, setCountStyle] = useState(0)

  // ✅ State pour gérer le label actif affiché
  type ActiveLabel = 'name' | 'value' | 'icon'
  const [activeLabel, setActiveLabel] = useState<ActiveLabel>(
    elementType === 'links' ? 'value' : 'name'
  )

  // ✅ Configuration selon le type
  const config = elementType === 'nodes' ? {
    selectedRef: menu_configuration.ref_selected_style_node,
    stylesDict: sankey.node_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_nodes
      ? drawing_area.selected_nodes_list_sorted
      : drawing_area.visible_and_selected_nodes_list_sorted,
    visibleList: sankey.visible_nodes_list,
    attributePath: 'Noeud.labels',
    attributesConfig: NODES_ATTRIBUTES_CONFIG,
    updateApparenceRef: menu_configuration.ref_to_menu_config_nodes_apparence_context_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_nodes_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToNodesApparence(),
    updateStyle: () => menu_configuration.updateComponentRelatedToNodesStyles(),
    SelectionComponent: SankeyNodeSelectionSimple,
    hasExtraFields: true // separator, separator_part
  } : elementType === 'containers' ? {
    selectedRef: menu_configuration.ref_selected_style_container,
    stylesDict: sankey.container_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_containers
      ? drawing_area.selected_containers_list_sorted
      : drawing_area.visible_and_selected_containers_list_sorted,
    visibleList: sankey.drawing_area.visible_containers_list,
    attributePath: 'Noeud.labels',
    attributesConfig: NODES_ATTRIBUTES_CONFIG, // ✅ Utilise la même config que nodes
    updateApparenceRef: menu_configuration.ref_to_menu_config_containers_apparence_context_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_containers_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToContainersApparence(),
    updateStyle: () => menu_configuration.updateComponentRelatedToContainersStyles(),
    SelectionComponent: SankeyContainerSelectionSimple,
    hasExtraFields: true // separator, separator_part (comme nodes)
  } : {
    selectedRef: menu_configuration.ref_selected_style_link,
    stylesDict: sankey.link_styles_dict,
    selectedList: !menu_configuration.is_selector_only_for_visible_links
      ? drawing_area.selected_links_list_sorted
      : drawing_area.visible_and_selected_links_list_sorted,
    visibleList: sankey.visible_links_list,
    attributePath: 'Flux.labels',
    attributesConfig: LINKS_ATTRIBUTES_CONFIG,
    updateApparenceRef: menu_configuration.ref_to_menu_config_links_apparence_context_updater,
    updateStyleRef: menu_configuration.ref_to_menu_config_links_styles_updater,
    updateApparence: () => menu_configuration.updateComponentRelatedToLinksApparence(),
    updateStyle: () => {
      menu_configuration.updateAllComponentsRelatedToLinks()
      menu_configuration.updateComponentRelatedToLinksStyles()
    },
    SelectionComponent: SankeyLinkSelectionSimple,
    hasExtraFields: false
  }

  // ✅ Assigner les updaters
  if (!menu_for_style) {
    config.updateApparenceRef.current = () => setCount(a => a + 1)
  } else {
    config.updateStyleRef.current = () => setCountStyle(a => a + 1)
  }

  const elements = (menu_for_style
    ? [config.stylesDict[config.selectedRef.current]]
    : config.selectedList) as ElementsType
  const node_elements = elements as Class_NodeElement[] | Class_ElementStyle[]

  const refreshThisAndUpdateRelatedComponents = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (menu_for_style) {
      config.updateStyle()
      config.visibleList.forEach(el => el.draw())
    }
    config.updateApparence()
  }

  const nameLabelValues = elements.length > 0
    ? (elementType === 'nodes' || elementType === 'containers'
      ? getElementsNameLabelValues(node_elements, 'name_label', refreshThisAndUpdateRelatedComponents)
      : getElementsLabelValues(elements, 'name_label', refreshThisAndUpdateRelatedComponents))
    : Object.fromEntries(
      Object.entries(NAME_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof NAME_LABEL_CONFIG]: ReturnType<typeof NAME_LABEL_CONFIG[K]['type']> }

  const valueLabelValues = elements.length > 0
    ? getElementsLabelValues(elements, 'value_label', refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(VALUE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof VALUE_LABEL_CONFIG]: ReturnType<typeof VALUE_LABEL_CONFIG[K]['type']> }

  const iconValues = elements.length > 0
    ? getIconValues(elements, refreshThisAndUpdateRelatedComponents)
    : Object.fromEntries(
      Object.entries(ICON_LABEL_BASE_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof ICON_LABEL_BASE_CONFIG]: ReturnType<typeof ICON_LABEL_BASE_CONFIG[K]['type']> }

  const content_name_label = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'is_visible'}
      config={NAME_LABEL_CONFIG}
      prefix={'name_label'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {/* ✅ Champs extra pour nodes et containers uniquement */}
      {config.hasExtraFields && (
        <Box layerStyle='options_2cols'>
          <ElementAttrSetterTextInput2Cols
            app_data={app_data}
            elements={elements}
            attributePath={config.attributePath}
            attributeKey={'separator'}
            prefix={'name_label'}
            config={NAME_LABEL_CONFIG}
            refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          />
          <OSTooltip label={t('Menu.tooltips.name_label_separator')}>
            <Box layerStyle='options_2cols'>
              <Button
                //@ts-expect-error xxx 
                variant={nameLabelValues.separator_part == 'before'
                  ? 'menuconfigpanel_option_button_activated_left'
                  : 'menuconfigpanel_option_button_left'}
                onClick={() => {       //@ts-expect-error xxx 
                  nameLabelValues.separator_part = 'before'
                }}
              >
                {t('Menu.before')}
              </Button>
              <Button
                variant={      //@ts-expect-error xxx 
                  nameLabelValues.separator_part == 'after'
                    ? 'menuconfigpanel_option_button_activated_right'
                    : 'menuconfigpanel_option_button_right'}
                onClick={() => {
                  //@ts-expect-error xxx 
                  nameLabelValues.separator_part = 'after'
                }}
              >
                {t('Menu.after')}
              </Button>
            </Box>
          </OSTooltip>
        </Box>
      )}

      {nameLabelValues.is_visible && (
        <SankeyMenuLabelComponent
          app_data={app_data}
          attributePath={config.attributePath}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'name_label'}
        />
      )}
    </MenuSectionCheckbox>
  )

  const content_illustration = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'is_visible'}
      config={ICON_LABEL_BASE_CONFIG}
      prefix={'icon'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {iconValues.is_visible && (
        <SankeyMenuLabelComponent
          app_data={app_data}
          attributePath={config.attributePath}
          elements={elements}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'icon'}
        />
      )}
    </MenuSectionCheckbox>
  )

  const content_value_label = (
    <MenuSectionCheckbox
      app_data={app_data}
      elements={elements}
      attributePath={config.attributePath}
      attributeKey={'is_visible'}
      config={VALUE_LABEL_CONFIG}
      prefix={'value_label'}
      refreshParentComponent={refreshThisAndUpdateRelatedComponents}
    >
      {valueLabelValues.is_visible && (
        <SankeyMenuLabelComponent
          app_data={app_data}
          elements={elements}
          attributePath={config.attributePath}
          refreshParentComponent={refreshThisAndUpdateRelatedComponents}
          prefix={'value_label'}
        />
      )}
    </MenuSectionCheckbox>
  )

  return (
    <Box layerStyle='box_content_config'>
      {!menu_for_style && <config.SelectionComponent app_data={app_data} />}
      {!menu_for_style && (
        <ConfigMenuStyleElement
          app_data={app_data}
          selected_elements={config.selectedList}
          config={config.attributesConfig}
          categories={['value_label', 'name_label']}
          nodesOrLinks={elementType === 'containers' ? 'nodes' : elementType} // ✅ containers utilise 'nodes' pour la config
        />
      )}
      {elements.length > 0 && (
        <>
          {/* ✅ Sélecteur de label : 3 boutons */}
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='options_3cols'>
              <Button
                variant={activeLabel === 'name' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
                onClick={() => setActiveLabel('name')}
              >
                {t(config.attributePath + '.name_label_is_visible')}
              </Button>
              <Button
                variant={activeLabel === 'value' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
                onClick={() => setActiveLabel('value')}
              >
                {t(config.attributePath + '.value_label_is_visible')}
              </Button>
              <Button
                variant={activeLabel === 'icon' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
                onClick={() => setActiveLabel('icon')}
              >
                {t(config.attributePath + '.icon_is_visible')}
              </Button>
            </Box>
          </Box>

          {/* ✅ Affichage conditionnel du contenu */}
          {activeLabel === 'name' && content_name_label}
          {activeLabel === 'value' && content_value_label}
          {activeLabel === 'icon' && content_illustration}
        </>
      )}
    </Box>
  )
}

// ✅ Wrappers pour compatibilité
export const MenuConfigurationNodeLabel = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  return <MenuConfigurationLabel
    app_data={app_data}
    menu_for_style={menu_for_style}
    elementType='nodes'
  />
}

export const MenuConfigurationLinkLabel = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  return <MenuConfigurationLabel
    app_data={app_data}
    menu_for_style={menu_for_style}
    elementType='links'
  />
}

// ✅ Nouveau wrapper pour containers
export const MenuConfigurationContainersLabel = ({ app_data, menu_for_style }: {
  app_data: Class_ApplicationData,
  menu_for_style: boolean
}) => {
  return <MenuConfigurationLabel
    app_data={app_data}
    menu_for_style={menu_for_style}
    elementType='containers'
  />
}
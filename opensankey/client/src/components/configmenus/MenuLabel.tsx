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
import React, { useState, useRef, ChangeEvent } from 'react'
import { Box, Button, Select, Input } from '@chakra-ui/react'
import {
  FaAlignCenter, FaAlignLeft, FaAlignRight
} from 'react-icons/fa'
import { MdTextRotateVertical, MdTextRotationNone } from 'react-icons/md'
import { t, TFunction } from 'i18next'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle } from '../../Elements/Element'
import { Class_NodeElement } from '../../Elements/Node'
import { default_style_id, font_families } from '../../types/Utils'
import {
  ConfigMenuNumberInput, ElementAttrSetterNumberInput2Cols, ElementsType, getElementsLabelValues,
  getLinksLabelValues, MenuColorPicker, TooltipElementOverloaded
} from './MenuCommon'
import { svg_label_upper } from './SankeyMenuConfigurationNodesShape'
import { OSTooltip } from './MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { BASE_LABEL_CONFIG, isConfigValueIndeterminate, LINKS_LABEL_SPECIFIC_CONFIG, ShapePrefix, VALUE_LABEL_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { Class_ElementStyle } from '../../Elements/Element'

/**
 * Retourne le variant approprié pour un bouton selon son état
 */
const getButtonVariant = (
  position: 'left' | 'center' | 'right' | '',
  isIndeterminate: boolean,
  isActive: boolean
): string => {
  const suffix = position ? `_${position}` : ''

  if (isIndeterminate) {
    return `menuconfigpanel_option_button_indeterminate${suffix}`
  }

  if (isActive) {
    return `menuconfigpanel_option_button_activated${suffix}`
  }

  return `menuconfigpanel_option_button${suffix}`
}

/**
 * ✅ Wrapper qui combine un composant avec l'icône de surcharge
 */
const LabelWithOverload = ({
  attributeKey,
  elements,
  config,
  prefix,
  children,
  t
}: React.PropsWithChildren<{
  attributeKey: string
  elements: ElementsType
  config: typeof BASE_LABEL_CONFIG | typeof VALUE_LABEL_CONFIG
  prefix: string
  children: React.ReactNode
  t: TFunction
}>) => {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      {children}
      <TooltipElementOverloaded
        attributeKey={`${prefix}_${attributeKey}` as any}
        elements={elements as any}
        config={config}
        t={t}
      />
    </Box>
  )
}

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
  const links_elements = elements as Class_LinkElement[] | Class_LinkStyle[]
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
      <Box layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='options_4cols'>
          <Button
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
          </Button>
          <Button
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
          </Button>
        </Box>
      </Box>

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

      {/* Décalage (toujours visible) */}
      <Box as='span' textStyle='title_sub_section'>Décalage</Box>
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

    {/* Fond et Formatage (toujours visible) */}
    <Box layerStyle='options_2cols'>
      <Button
        variant={'menuconfigpanel_option_button'}
        onClick={() => {
          app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_shape_attribute_editor.current(true)
          app_data.menu_configuration.r_shape_attributes_set_elements.current(
            elements,
            attributePath,
            prefix + '_background' as ShapePrefix,
            disable_attr_props,
            () => null
          )
        }}
      >
        Fond
      </Button>
      {prefix === 'value_label' && (
        <Button
          variant={'menuconfigpanel_option_button'}
          onClick={() => {
            app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_value_formatting_editor.current(true)
            app_data.menu_configuration.r_value_formatting_set_elements.current(
              elements,
              attributePath,
              disable_attr_props
            )
          }}
        >
          Formattage valeurs
        </Button>
      )}
    </Box>
  </Box>
}
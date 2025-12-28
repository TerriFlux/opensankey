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
import { Box, Checkbox, Button, Select } from '@chakra-ui/react'
import { t } from 'i18next'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle,Class_NodeStyle } from '../../Elements/Element'
import { Class_NodeElement } from '../../Elements/Node'
import { default_style_id, font_families } from '../../types/Utils'
import { updateElements, ValueKey } from './MenuCommon'
import { ConfigMenuNumberInput } from './SankeyMenuConfiguration'
import { svg_label_upper } from './SankeyMenuConfigurationNodesShape'
import { OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { MenuColorPicker } from './MenuColorPicker'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { getLabelValues, LabelConfigReturn, NODES_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { Class_ElementStyle } from '../../Elements/Element'

export const SankeyMenuLabelComponent = ({
  app_data,
  attributePath,
  elements,
  refreshParentComponent,
  prefix,
  config
}: {
  app_data: Class_ApplicationData
  attributePath: string
  elements: Class_LinkStyle[] | Class_LinkElement[] | Class_NodeBase[] | Class_NodeStyle[],
  refreshParentComponent: () => void,
  prefix: 'name_' | 'value_',
  config: LabelConfigReturn
}) => {
  const [rich_text, setRichText] = useState(false)
  const { ref_selected_style_node, ref_selected_style_link } = app_data.menu_configuration
  const { node_styles_dict, link_styles_dict } = app_data.drawing_area.sankey
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle || elements[0] instanceof Class_ElementStyle)


  const nodeStyle = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  const nodeRelatedElement = elements.length > 0 && (elements[0] instanceof Class_ElementStyle || elements[0] instanceof Class_NodeElement)
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]

  const correct_dict_style_to_use = (nodeStyle || nodeRelatedElement) ? node_styles_dict : link_styles_dict
  const correct_ref_style_to_use = nodeStyle ? ref_selected_style_node : ref_selected_style_link

  // By combining the different variable correct_ref_style_to_use can only be used when MenuUnit is used with style element (instead of normal element)
  const disable_attr_props = menu_for_style ?
    correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute :
    correct_dict_style_to_use[default_style_id].customisable_attribute

  const check_indeterminate = (curr: Class_LinkElement | Class_NodeBase) => {
    const ref_element = elements[0]
    if (curr instanceof Class_LinkElement && ref_element instanceof Class_LinkElement) {
      return (ref_element.isEqual(curr))
    } else if (curr instanceof Class_NodeElement && ref_element instanceof Class_NodeElement) {
      return (ref_element.isEqual(curr))
    } else {
      return false
    }
  }
  const is_indeterminate = !(elements as (Class_NodeElement | Class_LinkElement)[]).every(check_indeterminate)

  let label_horiz = config.horiz.default
  let label_vert = config.vert.default
  let label_font_size = config.font_size.default
  let label_color = config.color.default
  let label_bold = config.bold.default
  let label_italic = config.italic.default
  let label_uppercase = config.uppercase.default
  let label_font_family = config.font_family.default
  let label_vertical = config.vertical_text.default

  let label_background = config.background_visible.default
  let label_background_shape = config.background_type.default
  let label_background_opacity = config.background_opacity.default


  // If elements selected set displayed value with first selected element
  if (elements.length > 0) {
    const labelValues = elements.length > 0
      ? getLabelValues(elements[0], prefix, config)
      : Object.fromEntries(
        Object.entries(config).map(([key, value]) => [key, value.default])
      ) as { [K in keyof typeof config]: ReturnType<typeof config[K]['type']> }
    label_horiz = labelValues.horiz
    label_vert = labelValues.vert
    label_font_size = labelValues.font_size
    label_color = labelValues.color
    label_font_family = labelValues.font_family
    label_bold = labelValues.bold
    label_italic = labelValues.italic
    label_uppercase = labelValues.uppercase

    label_background = labelValues.background_visible
    label_background_shape = labelValues.background_type
    label_background_opacity = labelValues.background_opacity
    label_vertical = labelValues.vertical_text
  }

  const is_label_font_size_indetermined = !elements.every(el => Reflect.get(el, prefix + 'label_font_size') == Reflect.get(elements[0], prefix + 'label_font_size'))
  const is_label_background_opacity_indetermined = !elements.every(el => Reflect.get(el, prefix + 'label_background_opacity') == Reflect.get(elements[0], prefix + 'label_background_opacity'))
  const is_label_vertical_indetermined = !elements.every(el => Reflect.get(el, prefix + 'vertical_text') == Reflect.get(elements[0], prefix + 'vertical_text'))

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box
      layerStyle='menuconfigpanel_grid'
    >
      <Box layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='options_2cols'>
          <Button variant={rich_text ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            onClick={() => {
              app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_rich_text_editor.current(true)
              app_data.menu_configuration.r_editor_content_set_elements.current(base_elements)
              base_elements.forEach(n => {
                n.has_fo = true
                n.draw()
              })
              setRichText(true)
            }}
          >
            {'Rich text'}
          </Button>
          <Button variant={!rich_text ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
            onClick={() => {
              app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_rich_text_editor.current(false)
              base_elements.forEach(el => {
                el.has_fo = false
                el.draw()
              })
              setRichText(false)
            }}
          >
            {'Simple text'}
          </Button>
        </Box>
      </Box>
      {rich_text ? <></> : <>
        <Box layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='options_3cols'>
            {/* Gras */}
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_bold')}
              variant={label_bold ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_bold' as ValueKey, !label_bold, refreshParentComponent)
              }}
            >
              {app_data.icon_library.icon_text_bold}
            </Button>

            {/* en majuscule */}
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_uppercase')}
              variant={label_uppercase ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_uppercase' as ValueKey, !label_uppercase, refreshParentComponent)
              }}
            >
              {svg_label_upper}
            </Button>

            {/* En italique */}
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_italic')}
              variant={label_italic ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_italic' as ValueKey, !label_italic, refreshParentComponent)
              }}
            >
              {app_data.icon_library.icon_text_italic}
            </Button>
          </Box>
          {/* Police et taille du texte de label */}
          <Box layerStyle='option_with_activation'>
            <Select
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_font_family')}
              variant='menuconfigpanel_option_select'
              value={label_font_family}
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                updateElements(app_data, elements, prefix + 'label_font_family' as ValueKey, evt.target.value, refreshParentComponent)
              }}
            >
              {font_families
                .map((d) => {
                  return <option
                    style={{ fontFamily: d }}
                    key={'ff-' + d}
                    value={d}
                  >
                    {d}
                  </option>
                })}
            </Select>

            <ConfigMenuNumberInput
              disabled={!Reflect.get(disable_attr_props, prefix + 'label_font_size')}
              t={app_data.t}
              default_value={label_font_size}
              menu_for_style={menu_for_style}
              minimum_value={11}
              stepper={true}
              unit_text='px'
              function_on_blur={(value) => {
                updateElements(app_data, elements, prefix + 'label_font_size' as ValueKey, value ?? undefined, refreshParentComponent)
              }}
              multiValue={is_label_font_size_indetermined} />
          </Box>
        </Box>
        {/* Couleur des Labels  */}
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('Flux.apparence.shape_color')}
            {!menu_for_style ? <TooltipElementOverloaded
              elements={base_elements}
              k={prefix + 'label_color' as ValueKey}
              t={t}
            /> : <></>}
          </Box>
          <MenuColorPicker
            isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_color')}
            initialColor={label_color}
            onColorChange={(new_color) => {
              updateElements(app_data, elements, prefix + 'label_color' as ValueKey, new_color, refreshParentComponent)

            }} />
        </Box>
      </>}
      {/* Text style et position horizontale et vertical */}
      <Box layerStyle='options_2cols'>
        {/* Positionnement lateral des label */}
        <Box layerStyle='options_3cols'>
          {/* Vers le début  */}
          <OSTooltip label={t(attributePath + '.tooltips.deb')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_horiz')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (label_horiz === 'left')) ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_horiz' as ValueKey, 'left', refreshParentComponent)
              }}>
              {app_data.icon_library.icon_text_align_left}
            </Button>
          </OSTooltip>

          {/* Vers le milieu  */}
          <OSTooltip label={t(attributePath + '.tooltips.milieu_h')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_horiz')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (label_horiz === 'middle')) ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_horiz' as ValueKey, 'middle', refreshParentComponent)
              }}>
              {app_data.icon_library.icon_text_align_center}
            </Button>
          </OSTooltip>

          {/* Vers la fin du flux  */}
          <OSTooltip label={t(attributePath + '.tooltips.fin')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_horiz')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(!is_indeterminate && (label_horiz === 'right')) ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_horiz' as ValueKey, 'right', refreshParentComponent)
              }}>
              {app_data.icon_library.icon_text_align_right}
            </Button>
          </OSTooltip>
        </Box>

        {/* Positionnement vertical des label  */}
        <Box layerStyle='options_3cols'>
          {/* Positionnement au dessous  */}
          <OSTooltip label={t(attributePath + '.tooltips.dessous')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_vert')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(
                !is_indeterminate &&
                (label_vert === 'bottom')
              ) ?
                'menuconfigpanel_option_button_activated_left' :
                'menuconfigpanel_option_button_left'}
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_vert' as ValueKey, 'bottom', refreshParentComponent)
              }}
            >
              {app_data.icon_library.icon_text_vert_pos_bottom}
            </Button>
          </OSTooltip>

          {/* Positionnement au milieu  */}
          <OSTooltip label={t(attributePath + '.tooltips.milieu_v')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_vert')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(

                !is_indeterminate &&
                (label_vert === 'middle')
              ) ?
                'menuconfigpanel_option_button_activated_center' :
                'menuconfigpanel_option_button_center'}
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_vert' as ValueKey, 'middle', refreshParentComponent)
              }}
            >
              {app_data.icon_library.icon_text_vert_pos_center}
            </Button>
          </OSTooltip>

          {/* Positionnement au dessus  */}
          <OSTooltip label={t(attributePath + '.tooltips.dessus')}>
            <Button
              isDisabled={!Reflect.get(disable_attr_props, prefix + 'label_vert')}
              paddingStart='0'
              paddingEnd='0'
              minWidth='0'
              variant={(
                !is_indeterminate &&
                (label_vert === 'top')
              ) ?
                'menuconfigpanel_option_button_activated_right' :
                'menuconfigpanel_option_button_right'}
              onClick={() => {
                updateElements(app_data, elements, prefix + 'label_vert' as ValueKey, 'top', refreshParentComponent)
              }}>
              {app_data.icon_library.icon_text_vert_pos_top}
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      {/* Texte vertical */}
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        iconColor={is_label_vertical_indetermined ? '#78C2AD' : 'white'}
        isIndeterminate={is_label_vertical_indetermined}
        isChecked={label_vertical}
        onChange={(evt) => {
          updateElements(app_data, elements, prefix + 'label_vertical_text' as ValueKey, evt.target.checked, refreshParentComponent)
        }}
      >
        <OSTooltip label={t('Noeud.labels.tooltips.name_label_vertical_text') || 'Orienter le texte verticalement'}>
          {t('Noeud.labels.name_label_vertical_text') || 'Texte vertical'}
          <TooltipElementOverloaded elements={base_elements} t={t} k={prefix + 'label_vertical_text' as ValueKey} />
        </OSTooltip>
      </Checkbox>


    </Box>

  </Box >
}



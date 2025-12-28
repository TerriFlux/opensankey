// MenuShapeAttributes.tsx

import React, { useState } from 'react'
import { Box, Button, Checkbox } from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { ElementAttrSetterNumberInput2Cols, OSTooltip, TooltipElementOverloaded, updateElements, ValueKey } from './MenuCommon'
import { MenuColorPicker } from './MenuColorPicker'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle, Class_NodeStyle } from '../../Elements/Element'
import { BASE_SHAPE_CONFIG, getShapeAttributeKey, getShapeValues, isShapeValueIndeterminate, ShapePrefix } from '../../Elements/ElementsAttributesConfig'

interface MenuShapeAttributesProps {
  app_data: Class_ApplicationData
  elements?: Class_NodeBase[] | Class_NodeStyle[] | Class_LinkElement[] | Class_LinkStyle[]
  attributePath?: string
  prefix?: ShapePrefix
  disable_attr_props?: Record<string, boolean>
  refreshUI?: () => void
}

export const MenuShapeAttributes = ({
  app_data,
  elements: initialElements,
  attributePath: initialAttributePath,
  prefix: initialPrefix,
  disable_attr_props: initialDisableAttrProps,
  refreshUI: initialRefreshUI
}: MenuShapeAttributesProps) => {
  const { t, icon_library } = app_data
  const { icon_locked, icon_unlocked } = icon_library
  const [state, setState] = useState({
    elements: initialElements,
    attributePath: initialAttributePath,
    prefix: initialPrefix,
    disable_attr_props: initialDisableAttrProps,
    refreshUI: initialRefreshUI
  })
  if (!initialElements) {
    app_data.menu_configuration.r_shape_attributes_set_elements.current = (
      _elements: Class_NodeBase[] | Class_NodeStyle[] | Class_LinkElement[] | Class_LinkStyle[],
      _attributePath: string,
      _prefix: ShapePrefix,
      _disable_attr_props: Record<string, boolean>,
      _refreshUI: () => void) => {
      setState({
        elements: _elements,
        attributePath: _attributePath,
        prefix: _prefix,
        disable_attr_props: _disable_attr_props,
        refreshUI: _refreshUI
      })
    }
  }

  const { elements, attributePath, prefix, disable_attr_props, refreshUI } = state
  if (!elements || elements.length === 0 || !attributePath || !prefix || !disable_attr_props || !refreshUI) {
    return <></>
  }
  // Attribute names
  // Shape
  const config = BASE_SHAPE_CONFIG
  const attr_visible = getShapeAttributeKey(prefix, 'visible')
  const attr_color_visible = getShapeAttributeKey(prefix, 'color_visible')
  const attr_shape_color = getShapeAttributeKey(prefix, 'color')
  const attr_shape_color_sustainable = getShapeAttributeKey(prefix, 'color_sustainable')
  const attr_shape_opacity = getShapeAttributeKey(prefix, 'opacity')
  // Border
  const attr_border_visible = getShapeAttributeKey(prefix, 'border_visible')
  const attr_border_color = getShapeAttributeKey(prefix, 'border_color')
  const attr_border_thickness = getShapeAttributeKey(prefix, 'border_thickness')
  const attr_border_radius = getShapeAttributeKey(prefix, 'border_radius')
  const attr_border_dashed = getShapeAttributeKey(prefix, 'border_dashed')


  // Get values from first element
  const element_ref = elements[0]
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]

  const shapeValues = elements.length > 0
    ? getShapeValues(elements[0], prefix, config)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    ) as { [K in keyof typeof config]: ReturnType<typeof config[K]['type']> }

  const visible = shapeValues.visible
  const color_visible = shapeValues.color_visible
  const shape_color = shapeValues.color
  const shape_color_sustainable = shapeValues.color_sustainable

  const border_visible = element_ref?.[attr_border_visible] ?? false
  const border_color = element_ref?.[attr_border_color] ?? 'black'
  const border_dashed = element_ref?.[attr_border_dashed] ?? false

  // Check indeterminate states
  const is_indeterminate_visible = elements.length > 1 &&
    isShapeValueIndeterminate(elements, prefix, 'visible', config)
  const is_indeterminate_bg_visible = elements.length > 1 &&
    isShapeValueIndeterminate(elements, prefix, 'color_visible', config)

  const is_indeterminate_border = elements.length > 1 &&
    !elements.every(curr => curr[attr_border_visible] === elements![0][attr_border_visible])

  const is_indeterminate_border_dashed = elements.length > 1 &&
    !elements.every(curr => curr[attr_border_dashed] === elements![0][attr_border_dashed])

  return (
    <>

        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={is_indeterminate_visible ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[attr_visible]}
          isIndeterminate={is_indeterminate_visible}
          isChecked={visible}
          onChange={(evt) => {
            updateElements(app_data, elements!, attr_visible as ValueKey, evt.target.checked, refreshUI!)
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${attr_visible}`) || 'Afficher le fond'}>
            {t(`${attributePath}.${attr_visible}`) || 'Fond visible'}
            <TooltipElementOverloaded elements={base_elements} t={t} k={attr_visible} />
          </OSTooltip>
        </Checkbox>
      {/* Couleur du noeud */}
      {/* Fond visible + Couleur */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={is_indeterminate_bg_visible ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[attr_color_visible]}
          isIndeterminate={is_indeterminate_bg_visible}
          isChecked={color_visible}
          onChange={(evt) => {
            updateElements(app_data, elements!, attr_color_visible as ValueKey, evt.target.checked, refreshUI!)
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${attr_color_visible}`) || 'Afficher le fond'}>
            {t(`${attributePath}.${attr_color_visible}`) || 'Fond visible'}
            <TooltipElementOverloaded elements={base_elements} t={t} k={attr_color_visible} />
          </OSTooltip>
        </Checkbox>
        <Box layerStyle='option_with_activation'>
          <OSTooltip label={t(`${attributePath}.tooltips.${attr_shape_color}`)}>
            <Box>
              <MenuColorPicker
                isDisabled={!disable_attr_props[attr_shape_color]}
                initialColor={shape_color}
                onColorChange={(new_color) => {
                  updateElements(app_data, elements!, attr_shape_color as ValueKey, new_color, refreshUI!)
                }}
              />
            </Box>
          </OSTooltip>
          <OSTooltip label={t(`${attributePath}.tooltips.${attr_shape_color_sustainable}`)}>
            <Button
              isDisabled={!disable_attr_props[attr_shape_color_sustainable]}
              variant={
                shape_color_sustainable ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                updateElements(app_data, elements!, attr_shape_color_sustainable as ValueKey, !shape_color_sustainable, refreshUI!)
              }}
            >
              {shape_color_sustainable ? icon_locked : icon_unlocked}
              <TooltipElementOverloaded elements={base_elements} t={t} k={attr_shape_color_sustainable} />
            </Button>
          </OSTooltip>
        </Box>
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        {/* Shape Opacity */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={attr_shape_opacity as ValueKey}
          refreshParentComponent={refreshUI}
          unit_text=''
          minimum_value={0}
          maximum_value={1}
          step={0.1}
          stepper={true}
        />
        {/* Radius */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={attr_border_radius as ValueKey}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true}
        />
      </Box>
      {/* Bordure visible + Couleur */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={is_indeterminate_border ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[attr_border_visible]}
          isIndeterminate={is_indeterminate_border}
          isChecked={border_visible}
          onChange={(evt) => {
            updateElements(app_data, elements!, attr_border_visible as ValueKey, evt.target.checked, refreshUI!)
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${attr_border_visible}`) || 'Afficher la bordure'}>
            {t(`${attributePath}.${attr_border_visible}`) || 'Bordure visible'}
            <TooltipElementOverloaded elements={base_elements} t={t} k={attr_border_visible} />
          </OSTooltip>
        </Checkbox>

        <OSTooltip label={t(`${attributePath}.tooltips.${attr_border_color}`) || 'Couleur de la bordure'}>
          <MenuColorPicker
            isDisabled={!disable_attr_props[attr_border_color]}
            initialColor={border_color}
            onColorChange={(new_color) => {
              updateElements(app_data, elements!, attr_border_color as ValueKey, new_color, refreshUI!)
            }}
          />
        </OSTooltip>
      </Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        {/* Épaisseur */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={attr_border_thickness as ValueKey}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true}
        />



        {/* Pointillés */}
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={is_indeterminate_border_dashed ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[attr_border_dashed]}
          isIndeterminate={is_indeterminate_border_dashed}
          isChecked={border_dashed}
          onChange={(evt) => {
            updateElements(app_data, elements!, attr_border_dashed as ValueKey, evt.target.checked, refreshUI!)
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${attr_border_dashed}`)}>
            {t(`${attributePath}.${attr_border_dashed}`)}
            <TooltipElementOverloaded elements={base_elements} t={t} k={attr_border_dashed} />
          </OSTooltip>
        </Checkbox>
        <Box />
      </Box>
    </>
  )
}

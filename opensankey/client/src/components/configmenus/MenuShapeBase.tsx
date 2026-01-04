import React, { useState } from 'react'
import { Box, Button, Checkbox } from '@chakra-ui/react'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { ElementAttrSetterNumberInput2Cols, getShapeValues, MenuColorPicker, OSTooltip, TooltipElementOverloaded } from './MenuCommon'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_LinkStyle, Class_NodeStyle } from '../../Elements/Element'
import { BASE_SHAPE_CONFIG, getShapeAttributeKey, isShapeValueIndeterminate, ShapePrefix } from '../../Elements/ElementsAttributesConfig'

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
  const [header_visible,setHeaderVisible] = useState(false)
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
      setHeaderVisible(true)
    }
  }


  const { elements, attributePath, prefix, disable_attr_props, refreshUI } = state
  if (!elements || !attributePath || !disable_attr_props || !prefix || !refreshUI) return <></>
  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_NodeStyle || elements[0] instanceof Class_LinkStyle)
  const config = BASE_SHAPE_CONFIG
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]

  const shapeValues = elements.length > 0
    ? getShapeValues(elements, prefix, refreshUI)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof config]: ReturnType<typeof config[K]['type']> }

  return (
    <>

      { header_visible ? <Checkbox
        variant='menuconfigpanel_option_checkbox'
        iconColor={isShapeValueIndeterminate(elements, prefix, 'visible') ? '#78C2AD' : 'white'}
        isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'visible')]}
        isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'visible')}
        isChecked={shapeValues.visible}
        onChange={(evt) => {
          shapeValues.visible = evt.target.checked
        }}
      >
        <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'visible')}`) || 'Afficher le fond'}>
          {t(`${attributePath}.${getShapeAttributeKey(prefix, 'visible')}`) || 'Fond visible'}
          {!menu_for_style ?
            <TooltipElementOverloaded
              elements={base_elements}
              t={t}
              attributeKey={'visible'}
              config={config}
              prefix={prefix}
            /> : <></>}
        </OSTooltip>
      </Checkbox>:<></>}
      {/* Couleur du noeud */}
      {/* Fond visible + Couleur */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={isShapeValueIndeterminate(elements, prefix, 'color_visible') ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color_visible')]}
          isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'color_visible')}
          isChecked={shapeValues.color_visible}
          onChange={(evt) => {
            shapeValues.color_visible = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color_visible')}`) || 'Afficher le fond'}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'color_visible')}`) || 'Fond visible'}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'color_visible'}
                config={config}
                prefix={prefix}
              /> : <></>}
          </OSTooltip>
        </Checkbox>
        <Box layerStyle='option_with_activation'>
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color')}`)}>
            <Box>
              <MenuColorPicker
                isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color')]}
                initialColor={shapeValues.color}
                onColorChange={(new_color) => {
                  shapeValues.color = new_color
                }}
              />
            </Box>
          </OSTooltip>
          <OSTooltip label={t(`${attributePath}.tooltips.color_sustainable`)}>
            <Button
              isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color_sustainable')]}
              variant={
                shapeValues.color_sustainable ?
                  'menuconfigpanel_option_button_activated' :
                  'menuconfigpanel_option_button'}
              onClick={() => {
                shapeValues.color_sustainable = !shapeValues.color_sustainable
              }}
            >
              {shapeValues.color_sustainable ? icon_locked : icon_unlocked}
              {!menu_for_style ?
                <TooltipElementOverloaded
                  elements={base_elements}
                  t={t}
                  attributeKey={'color_sustainable'}
                  config={config}
                  prefix={prefix}
                /> : <></>}
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
          attributeKey={'opacity'}
          prefix={prefix}
          config={BASE_SHAPE_CONFIG}
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
          attributeKey={'border_radius'}
          prefix={prefix}
          config={BASE_SHAPE_CONFIG}
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
          iconColor={isShapeValueIndeterminate(elements, prefix, 'border_visible') ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_visible')]}
          isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'border_visible')}
          isChecked={shapeValues.border_visible}
          onChange={(evt) => {
            shapeValues.border_visible = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_visible')}`) || 'Afficher la bordure'}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_visible')}`) || 'Bordure visible'}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'border_visible'}
                config={config}
                prefix={prefix} /> : <></>}
          </OSTooltip>
        </Checkbox>

        <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_color')}`) || 'Couleur de la bordure'}>
          <MenuColorPicker
            isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_color')]}
            initialColor={shapeValues.border_color}
            onColorChange={(new_color) => {
              shapeValues.border_color = new_color
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
          attributeKey={'border_thickness'}
          config={BASE_SHAPE_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true}
        />



        {/* Pointillés */}
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          iconColor={isShapeValueIndeterminate(elements, prefix, 'border_dashed') ? '#78C2AD' : 'white'}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_dashed')]}
          isIndeterminate={isShapeValueIndeterminate(elements, prefix, 'border_dashed')}
          isChecked={shapeValues.border_dashed}
          onChange={(evt) => {
            shapeValues.border_dashed = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_dashed')}`)}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_dashed')}`)}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'border_dashed'}
                config={config}
                prefix={prefix}
              /> : <></>}
          </OSTooltip>
        </Checkbox>
        <Box />
      </Box>
    </>
  )
}

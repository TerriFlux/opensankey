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

import React, { useState, MutableRefObject, useMemo } from 'react'
import { Box, Button, ButtonGroup, Menu, MenuButton, MenuList, } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_MenuConfig, Type_AdditionalMenus } from '../../types/MenuConfig'
import { Class_DrawingArea } from '../../types/DrawingArea'
import { MenuContextLinksData } from './SankeyMenuContextLink'

export const checked = (b: boolean) => <span style={{ margin: 'auto 0 auto auto' }}>{b ? '✓' : ''}</span>

export const ContextMenuButton = ({ children }: React.PropsWithChildren) => {
  return (
    <MenuButton
      variant='contextmenu_button'
      as={Button}
      rightIcon={<ChevronRightIcon />}
      className="dropdown-basic"
    >
      {children}
    </MenuButton>
  )
}

interface MenuStructureItem {
  type: 'button' | 'submenu' | 'widget' | 'separator'
  actionName?: string
  titleKey?: string
  actions?: Array<{ actionName: string }>
  widgetName?: string
  widgetProps?: Record<string, any>
}

export interface MenuConfig {
  structure: MenuStructureItem[]
  actions: Record<string, any>
  sectionTitles: Record<string, Record<string, string>>
}

export class WidgetRegistry {
  private static instance: WidgetRegistry
  private widgets = new Map<string, React.ComponentType<any>>()

  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry()
    }
    return WidgetRegistry.instance
  }

  register(name: string, component: React.ComponentType<any>): void {
    this.widgets.set(name, component)
  }

  get(name: string): React.ComponentType<any> | undefined {
    return this.widgets.get(name)
  }

  unregister(name: string): boolean {
    return this.widgets.delete(name)
  }

  list(): string[] {
    return Array.from(this.widgets.keys())
  }
}

// Instance globale du registry
export const widgetRegistry = WidgetRegistry.getInstance()

// Enregistrement des widgets
widgetRegistry.register('MenuContextLinksData', MenuContextLinksData)

export const WidgetRenderer = ({
  widgetName,
  widgetProps = {},
  app_data
}: {
  widgetName: string
  widgetProps?: Record<string, any>
  app_data: Class_ApplicationData
}) => {
  const WidgetComponent = widgetRegistry.get(widgetName)

  if (!WidgetComponent) {
    console.warn(`Widget "${widgetName}" not found in registry`)
    return (
      <Box p={2} color="red.500">
        Widget "{widgetName}" not found
      </Box>
    )
  }

  return <WidgetComponent app_data={app_data} {...widgetProps} />
}

export const createWidgetAction = (
  widgetName: string,
  labels: Record<string, string>,
  tooltips: Record<string, string>,
  widgetProps?: Record<string, any>
) => ({
  type: 'widget',
  widgetName,
  widgetProps: widgetProps || {},
  showCheck: false,
  toggle: false,
  labels,
  tooltips
})

export const GenericContextMenuRenderer = ({
  config,
  modifier,
  app_data,
  additionalMenus,
  isVisible,
  position,
  path
}: {
  config: MenuConfig
  modifier: any
  app_data: Class_ApplicationData
  additionalMenus?: MutableRefObject<Type_AdditionalMenus>
  isVisible: boolean
  position: { x: number, y: number, isTop: boolean }
  path: string
}) => {
  const [, setForceUpdate] = useState(0)
  const { t } = app_data

  // Composant pour rendre un bouton d'action
  const ActionButton = ({ actionName }: { actionName: string }) => {
    const actionConfig = config.actions[actionName]
    if (!actionConfig) return null

    const action = modifier[actionName] as () => void
    const valueMethodName = actionName + 'Value'
    const valueMethodNameTrue = actionName + 'True'
    const valueMethodNameFalse = actionName + 'False'
    const getValue = modifier[valueMethodName] as (() => boolean) | undefined

    // Déterminer le label
    let label = t(path + '.' + actionName)

    if (actionConfig.toggle && actionConfig.labelsToggle && getValue) {
      const currentValue = getValue()
      label = currentValue ? t(path + '.' + valueMethodNameTrue) : t(path + '.' + valueMethodNameFalse)
    }

    // Tooltip
    const tooltip = t(actionName + '.tooltips')

    return (
      <Button
        variant='contextmenu_button'
        onClick={() => {
          action();
          setForceUpdate(a => a + 1)
        }}
        title={tooltip}
      >
        {label}
        {actionConfig.showCheck && getValue && checked(getValue())}
      </Button>
    )
  }

  // Composant pour rendre un élément de structure
  const renderStructureItem = (item: MenuStructureItem, index: number) => {
    switch (item.type) {
      case 'button':
        return item.actionName ? (
          <ActionButton key={index} actionName={item.actionName} />
        ) : null

      case 'submenu':
        if (!item.titleKey || !item.actions) return null
        const sectionTitle = app_data.t(path+'.'+item.titleKey)

        return (
          <Menu key={index} placement='end'>
            <ContextMenuButton>
              {sectionTitle}
            </ContextMenuButton>
            <MenuList as={Box} layerStyle='context_menu'>
              {item.actions.map((action, actionIndex) => (
                config.actions[action.actionName].type === 'widget' && config.actions[action.actionName].widgetName ? (
                  <Box key={index} p={2}>
                    <WidgetRenderer
                      widgetName={config.actions[action.actionName].widgetName}
                      widgetProps={config.actions[action.actionName].widgetProps}
                      app_data={app_data}
                    />
                  </Box>
                ) :
                  <ActionButton key={actionIndex} actionName={action.actionName} />
              ))}
            </MenuList>
          </Menu>
        )
      case 'widget':
        // Nouveau: rendu des widgets
        if (!item.widgetName) return null

        return (
          <Box key={index} p={2}>
            <WidgetRenderer
              widgetName={item.widgetName}
              widgetProps={item.widgetProps}
              app_data={app_data}
            />
          </Box>
        )

      default:
        return null
    }
  }

  if (!isVisible) return <></>

  // Calcul de la position finale avec valeurs hardcodées
  const offsetX = 10, offsetY = -20, menuWidth = 450, menuHeight = 330
  let posX = position.x + offsetX
  let posY = position.y + offsetY
  let isTop = position.isTop

  if (posX + menuWidth > window.innerWidth) {
    posX = position.x - menuWidth - offsetX
  }
  if (posY + menuHeight > window.innerHeight) {
    posY = position.y - menuHeight - offsetY
    isTop = false
  }

  return (
    <Box
      layerStyle='context_menu'
      className={`context_popover ${isTop ? '' : 'at_bot'}`}
      style={{
        maxWidth: '100%',
        position: 'absolute',
        zIndex: '1',
        inset: `${posY}px auto auto ${posX}px`
      }}
    >
      <ButtonGroup isAttached orientation='vertical'>
        {config.structure.map((item, index) => renderStructureItem(item, index))}
      </ButtonGroup>
    </Box>
  )
}

type ModifierCreator<T> = (app_data: Class_ApplicationData) => T

export const ContextMenu = <T extends Record<string, any>>({
  app_data, createModifier, menuConfig, attr_is_contextualised, attr_updater, path
}: {
  app_data: Class_ApplicationData
  createModifier: ModifierCreator<T>
  menuConfig: MenuConfig,
  attr_is_contextualised: keyof Class_DrawingArea
  attr_updater: keyof Class_MenuConfig,
  path: string
}) => {
  const { drawing_area, menu_configuration } = app_data
  // const { is_drawing_area_contextualised } = drawing_area
  const [, setForceUpdate] = useState(0)
  //@ts-expect-error xxx
  menu_configuration[attr_updater].current = () => setForceUpdate(a => a + 1)
  const isVisible = drawing_area[attr_is_contextualised] as boolean
  // // Calcul de position
  // const position = {
  //   x: drawing_area.pointer_pos[0],
  //   y: drawing_area.pointer_pos[1],
  //   isTop: drawing_area.pointer_pos[1] + 330 <= window.innerHeight
  // }
  // console.log(position.x + ' / ' + position.y + ' / ')
  // Mémoriser la position seulement quand le menu devient visible
  const position = useMemo(() => {
    if (!isVisible) return null

    const pos = {
      x: drawing_area.pointer_pos[0],
      y: drawing_area.pointer_pos[1],
      isTop: drawing_area.pointer_pos[1] + 330 <= window.innerHeight
    }
    console.log('Position mémorisée:', pos.x + ' / ' + pos.y)
    return pos
  }, [isVisible]) // Seulement se recalculer quand isVisible change

  if (!isVisible || !position) {
    return <></>
  }

  return (
    <GenericContextMenuRenderer
      config={menuConfig}
      modifier={createModifier(app_data)}
      app_data={app_data}
      isVisible={drawing_area[attr_is_contextualised] as boolean}
      position={position}
      path={path}
    />
  )
}


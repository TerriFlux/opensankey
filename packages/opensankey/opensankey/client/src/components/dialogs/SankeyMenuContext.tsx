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

import React, { useState, useMemo } from 'react'
import { Box, Button, ButtonGroup, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_MenuConfig } from '../../types/MenuConfig'
import { Class_DrawingArea } from '../../types/DrawingArea'
import { ButtonNodeContextAssignStyle, MenuContextLinksData, ButtonLinkContextAssignTag, ButtonNodeContextAssignTag } from './MenuContextWidgetFactory'

// ==================================================================================================
// TYPES ET INTERFACES
// ==================================================================================================

export interface MenuCondition {
  type: 'nodeCount' | 'nodeProperty' | 'custom'
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'includes'
  value?: any
  property?: string
  customCheck?: (app_data: Class_ApplicationData) => boolean
}

export interface MenuStructureItem {
  type: 'button' | 'submenu' | 'widget' | 'separator'
  actionName?: string
  titleKey?: string
  titleName?: string
  widgetName?: string
  widgetProps?: Record<string, any>

  // Système de conditions pour la visibilité
  visibilityConditions?: MenuCondition[]

  // Sous-menus récursifs
  children?: MenuStructureItem[]

  // Configuration d'action avancée
  actionConfig?: {
    type: 'simple' | 'toggle' | 'dynamic'
    confirmMessage?: string
    undoable?: boolean
    closeMenuAfter?: boolean
  }
}

export interface MenuAction {
  type: 'action' | 'toggle' | 'widget' | 'submenu'
  labels: Record<string, string>
  tooltips: Record<string, string>

  // Conditions de visibilité
  visibilityConditions?: MenuCondition[]

  // Pour les toggles
  labelsToggle?: Record<string, Record<string, string>>
  getToggleValue?: string // nom de la méthode dans le modifier

  // Pour les widgets
  widgetName?: string
  widgetProps?: Record<string, any>

  // Configuration avancée
  showCheck?: boolean
  confirmMessage?: string
  undoable?: boolean
  closeMenuAfter?: boolean
}

export interface MenuConfig {
  structure: MenuStructureItem[]
  actions: Record<string, MenuAction>
  sectionTitles: Record<string, Record<string, string>>

  // Configuration globale
  globalConditions?: MenuCondition[]
  maxDepth?: number
}

// ==================================================================================================
// ÉVALUATEUR DE CONDITIONS
// ==================================================================================================

export class MenuConditionEvaluator {
  static evaluate(condition: MenuCondition, app_data: Class_ApplicationData): boolean {
    const { drawing_area } = app_data
    const contextualised_node = drawing_area.node_contextualised
    const selected_nodes = drawing_area.visible_and_selected_nodes_list

    switch (condition.type) {
      case 'nodeCount':
        const count = selected_nodes.length
        return this.compareValues(count, condition.operator!, condition.value)

      case 'nodeProperty':
        if (!contextualised_node || !condition.property) return false
        const propValue = this.getNestedProperty(contextualised_node, condition.property)
        return this.compareValues(propValue, condition.operator!, condition.value)

      case 'custom':
        return condition.customCheck ? condition.customCheck(app_data) : false

      default:
        return true
    }
  }

  static evaluateAll(conditions: MenuCondition[], app_data: Class_ApplicationData): boolean {
    return conditions.every(condition => this.evaluate(condition, app_data))
  }

  private static compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '==': return actual === expected
      case '!=': return actual !== expected
      case '>': return actual > expected
      case '<': return actual < expected
      case '>=': return actual >= expected
      case '<=': return actual <= expected
      case 'includes': return Array.isArray(actual) ? actual.includes(expected) : false
      default: return true
    }
  }

  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj)
  }
}

// ==================================================================================================
// RENDERER PRINCIPAL
// ==================================================================================================

export const ContextMenuRenderer = ({
  config,
  modifier,
  app_data,
  isVisible,
  position,
  path,
  refreshCallback
}: {
  config: MenuConfig
  modifier: any
  app_data: Class_ApplicationData
  isVisible: boolean
  position: { x: number, y: number, isTop: boolean }
  path: string
  refreshCallback?: () => void
}) => {
  const [, setForceUpdate] = useState(0)
  const { t } = app_data

  // Callback de refresh unifié
  const handleRefresh = refreshCallback || (() => setForceUpdate(a => a + 1))

  // Évaluation des conditions globales
  const globalConditionsMet = useMemo(() => {
    if (!config.globalConditions) return true
    return MenuConditionEvaluator.evaluateAll(config.globalConditions, app_data)
  }, [config.globalConditions, app_data])

  // Fonction pour évaluer la visibilité d'un élément
  const isItemVisible = (item: MenuStructureItem): boolean => {
    if (!item.visibilityConditions) return true
    return MenuConditionEvaluator.evaluateAll(item.visibilityConditions, app_data)
  }

  // Fonction pour obtenir le label d'une action toggle
  const getToggleLabel = (actionName: string): string => {
    const actionConfig = config.actions[actionName]
    if (!actionConfig.labelsToggle || !actionConfig.getToggleValue) {
      return t(`${path}.${actionName}`)
    }

    const getValue = modifier[actionConfig.getToggleValue]
    if (typeof getValue === 'function') {
      const currentValue = getValue()
      const lang = app_data.i18n?.language || 'en'
      return actionConfig.labelsToggle[lang]?.[String(currentValue)] || t(`${path}.${actionName}`)
    }

    return t(`${path}.${actionName}`)
  }

  // Fonction pour générer des éléments dynamiques (dimensions, etc.)
  const generateDynamicItems = (item: MenuStructureItem): MenuStructureItem[] => {
    // Génération des dimensions existantes pour setChild
    if (item.titleKey === 'setChild' && item.children) {
      const sankey = app_data.drawing_area.sankey
      const dynamicDimensions = sankey.level_taggs_list.map((tagg, index) => ({
        type: 'button' as const,
        actionName: `setChild_${tagg.id}`,
        titleKey: tagg.name
      }))

      return [{
        ...item,
        children: [...item.children, ...dynamicDimensions]
      }]
    }

    // Génération des dimensions existantes pour createParent
    if (item.titleKey === 'createParent' && item.children) {
      const sankey = app_data.drawing_area.sankey
      const dynamicDimensions = sankey.level_taggs_list.map((tagg, index) => ({
        type: 'button' as const,
        actionName: `createParent_${tagg.id}`,
        titleKey: tagg.name
      }))

      return [{
        ...item,
        children: [...item.children, ...dynamicDimensions]
      }]
    }
    // Génération des sous-menus par dimension pour l'agrégation
    if (item.titleKey === 'aggregation' && item.children) {
      const contextualised_node = app_data.drawing_area.node_contextualised
      if (contextualised_node) {
        const child_dims = contextualised_node.master_node ?
          contextualised_node.master_node.dimensions_as_child_pure :
          contextualised_node.dimensions_as_child_pure
        if (child_dims.length == 1) {
          // Garder les boutons existants (cas dimension unique) et les boutons de contraction
          const existingButtons = item.children.filter(child =>
            child.type === 'button' &&
            (child.actionName === 'aggregate' || child.actionName === 'aggregateLeft' ||
              child.actionName === 'aggregateRight' || child.actionName === 'contractLeft' ||
              child.actionName === 'contractRight')
          )
          return [{
            ...item,
            children: existingButtons
          }]
        }
        // Créer un sous-menu pour chaque dimension child
        const dimensionSubmenus = child_dims.map((dim) => ({
          type: 'submenu' as const,
          titleName: `-> ${dim.parent.name}`,
          children: [
            {
              type: 'button' as const,
              actionName: `aggregate_${dim.related_level_tagg.id}`,
              titleKey: 'Sans expansion'
            },
            {
              type: 'button' as const,
              actionName: `aggregateLeft_${dim.related_level_tagg.id}`,
              titleKey: 'Expansion à gauche'
            },
            {
              type: 'button' as const,
              actionName: `aggregateRight_${dim.related_level_tagg.id}`,
              titleKey: 'Expansion à droite'
            }
          ]
        }))
        return [{
          ...item,
          children: dimensionSubmenus
        }]
      }
    }

    // Génération des sous-menus par dimension pour la désagrégation
    if (item.titleKey === 'disaggregation' && item.children) {
      const contextualised_node = app_data.drawing_area.node_contextualised
      if (contextualised_node) {
        const parent_dims = contextualised_node.master_node ?
          contextualised_node.master_node.dimensions_as_parent_pure :
          contextualised_node.dimensions_as_parent_pure


        if (parent_dims.length == 1) {
          const existingButtons = item.children.filter(child =>
            child.type === 'button' &&
            (child.actionName === 'disaggregate' || child.actionName === 'expandLeft' ||
              child.actionName === 'expandRight')
          )
          return [{
            ...item,
            children: existingButtons
          }]
        } else {

          // Créer un sous-menu pour chaque dimension parent
          const dimensionSubmenus = parent_dims.map((dim) => ({
            type: 'submenu' as const,
            titleName: `${dim.name}`,
            children: [
              {
                type: 'button' as const,
                actionName: `disaggregate_${dim.related_level_tagg.id}`,
                titleKey: 'Sans expansion'
              },
              {
                type: 'button' as const,
                actionName: `expandLeft_${dim.related_level_tagg.id}`,
                titleKey: 'Expansion à gauche'
              },
              {
                type: 'button' as const,
                actionName: `expandRight_${dim.related_level_tagg.id}`,
                titleKey: 'Expansion à droite'
              }
            ]
          }))
          return [{
            ...item,
            children: dimensionSubmenus
          }]
        }
      }
    }
    // Génération des styles disponibles pour selectStyle
    // if (item.actionName === 'selectStyle' && item.type === 'button') {
    //   const sankey = app_data.drawing_area.sankey
    //   const styleButtons = sankey.node_styles_list_sorted.map((style) => ({
    //     type: 'button' as const,
    //     actionName: `selectStyle_${style.id}`,
    //     titleName: style.name
    //   }))

    //   return [{
    //     type: 'submenu' as const,
    //     titleKey: 'selectStyle',
    //     children: styleButtons
    //   }]
    // }
    return [item]
  }

  // Composant pour rendre un bouton d'action
  const ActionButton = ({ actionName, titleName }: { actionName: string, titleName: string }) => {
    let arg: string
    if (actionName.includes('_')) {
      [actionName, arg] = actionName.split('_')
    }
    const actionConfig = config.actions[actionName]
    if (!actionConfig) {
      // Action dynamique (ex: setChild_dimension1)
      const label = titleName

      return (
        <Button
          variant='contextmenu_button'
          onClick={() => {
            if (modifier[actionName]) {
              modifier[actionName]()
              handleRefresh()
            }
          }}
        >
          {label}
        </Button>
      )
    }

    const action = modifier[actionName] as (arg?: string) => void
    let label = titleName
    if (actionConfig.type === 'toggle') label = getToggleLabel(actionName)

    const tooltip = t(`${path}.tooltips.${actionName}`)

    const handleClick = () => {
      // Confirmation si nécessaire
      if (actionConfig.confirmMessage) {
        const confirmMsg = t(actionConfig.confirmMessage)
        if (!window.confirm(confirmMsg)) return
      }

      // Exécuter l'action
      action(arg)

      // Refresh
      handleRefresh()
      if (actionConfig.closeMenuAfter) {
        app_data.drawing_area.node_contextualised = undefined
        app_data.drawing_area.purgeSelection()
        //app_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
      }
      handleRefresh()
    }

    return (
      <Button
        variant='contextmenu_button'
        onClick={handleClick}
        title={tooltip}
      >
        {label}
        {actionConfig.showCheck && actionConfig.getToggleValue &&
          modifier[actionConfig.getToggleValue] &&
          (modifier[actionConfig.getToggleValue]() ? ' ✓' : '')
        }
      </Button>
    )
  }

  // Fonction récursive pour rendre les éléments de structure
  const renderStructureItem = (
    item: MenuStructureItem,
    index: number,
    depth: number = 0
  ): JSX.Element | null => {
    // Vérification de profondeur maximale
    if (config.maxDepth && depth >= config.maxDepth) {
      console.warn(`Menu depth limit reached: ${depth}`)
      return null
    }

    // Vérification de visibilité
    if (!isItemVisible(item)) {
      return null
    }

    switch (item.type) {
      case 'separator':
        return (
          <hr
            key={`sep-${index}`}
            style={{
              margin: '8px 0',
              border: 'none',
              borderTop: '1px solid #e2e8f0'
            }}
          />
        )

      case 'button':
        if (item.actionName) {
          let title_name = ''
          if (item.titleName) title_name = item.titleName
          else title_name = item.actionName.includes('_')
            ? t(`${path}.${item.actionName.split('_')[0]}`)
            : t(`${path}.${item.actionName}`)

          return (
            <ActionButton key={`btn-${index}`} actionName={item.actionName} titleName={title_name} />
          )
        }
        return <></>

      case 'widget':
        if (!item.widgetName) return null

        return (
          <Box key={`widget-${index}`} p={2}>
            <WidgetRenderer
              widgetName={item.widgetName}
              widgetProps={item.widgetProps}
              app_data={app_data}
              refreshCallback={refreshCallback}
            />
          </Box>
        )

      case 'submenu':
        if ((!item.titleName && !item.titleKey) || !item.children) return null

        // Filtrer les enfants visibles après génération dynamique
        const processedChildren = item.children.flatMap(child => generateDynamicItems(child))
        const visibleChildren = processedChildren.filter(child => isItemVisible(child))

        if (visibleChildren.length === 0) return null

        const sectionTitle = item.titleName ?? (item.titleKey!.includes('.')
          ? t(item.titleKey!)
          : t(`${path}.${item.titleKey}`))

        return (
          <Menu key={`submenu-${index}`} placement='end'>
            <MenuButton
              variant='contextmenu_button'
              as={Button}
              rightIcon={<ChevronRightIcon />}
              className="dropdown-basic"
            >
              {sectionTitle}
            </MenuButton>
            <MenuList as={Box} layerStyle='context_menu'>
              {visibleChildren.map((child, childIndex) =>
                renderStructureItem(child, childIndex, depth + 1)
              )}
            </MenuList>
          </Menu>
        )

      default:
        return null
    }
  }

  // Preprocessing de la structure pour gérer les éléments dynamiques
  const processedStructure = useMemo(() => {
    const processItems = (items: MenuStructureItem[]): MenuStructureItem[] => {
      return items.flatMap(item => {
        const processed = generateDynamicItems(item)
        return processed.map(processedItem => ({
          ...processedItem,
          children: processedItem.children ? processItems(processedItem.children) : undefined
        }))
      })
    }
    return processItems(config.structure)
  }, [config.structure, app_data])

  if (!isVisible || !globalConditionsMet) return null

  // Calcul de position
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
        {processedStructure.map((item, index) => renderStructureItem(item, index, 0))}
      </ButtonGroup>
    </Box>
  )
}

// ==================================================================================================
// COMPOSANT PRINCIPAL DE MENU CONTEXTUEL
// ==================================================================================================

type ModifierCreator<T> = (app_data: Class_ApplicationData) => T

export const ContextMenu = <T extends Record<string, any>>({
  app_data,
  createModifier,
  menuConfig,
  attr_is_contextualised,
  attr_updater,
  path
}: {
  app_data: Class_ApplicationData
  createModifier: ModifierCreator<T>
  menuConfig: MenuConfig,
  attr_is_contextualised: keyof Class_DrawingArea
  attr_updater: keyof Class_MenuConfig,
  path: string
}) => {
  const { drawing_area, menu_configuration } = app_data
  const [, setForceUpdate] = useState(0)

  // @ts-expect-error xxx
  menu_configuration[attr_updater].current = () => setForceUpdate(a => a + 1)
  const isVisible = drawing_area[attr_is_contextualised] as boolean

  // Mémoriser la position seulement quand le menu devient visible
  const position = useMemo(() => {
    if (!isVisible) return null

    const pos = {
      x: drawing_area.pointer_pos[0],
      y: drawing_area.pointer_pos[1],
      isTop: drawing_area.pointer_pos[1] + 330 <= window.innerHeight
    }
    return pos
  }, [isVisible])

  if (!isVisible || !position) {
    return <></>
  }

  return (
    <ContextMenuRenderer
      config={menuConfig}
      modifier={createModifier(app_data)}
      app_data={app_data}
      isVisible={isVisible}
      position={position}
      path={path}
      refreshCallback={() => setForceUpdate(a => a + 1)}
    />
  )
}

// ==================================================================================================
// COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME (OPTIONNEL)
// ==================================================================================================

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

// Ajoutez cette section après les interfaces et avant MenuConditionEvaluator :

// ==================================================================================================
// WIDGET REGISTRY SYSTEM
// ==================================================================================================

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

const widgetRegistry = WidgetRegistry.getInstance()
widgetRegistry.register('MenuContextLinksData', MenuContextLinksData)
widgetRegistry.register('ButtonNodeContextAssignStyle', ButtonNodeContextAssignStyle)
widgetRegistry.register('ButtonLinkContextAssignTag', ButtonLinkContextAssignTag)
widgetRegistry.register('ButtonNodeContextAssignTag', ButtonNodeContextAssignTag)

export const WidgetRenderer = ({
  widgetName,
  widgetProps = {},
  app_data,
  refreshCallback
}: {
  widgetName: string
  widgetProps?: Record<string, any>
  app_data: Class_ApplicationData
  refreshCallback?: () => void
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

  return <WidgetComponent app_data={app_data} refreshCallback={refreshCallback} {...widgetProps} />
}

// Fonction utilitaire pour créer des widgets facilement
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

export { widgetRegistry }


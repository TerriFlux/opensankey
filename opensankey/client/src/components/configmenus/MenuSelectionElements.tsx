import React, { useState, useRef } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { Box, Button } from '@chakra-ui/react'
import { ConfigMenuTextInput, OSTooltip } from './MenuCommon'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { Class_ApplicationData } from '../../types/ApplicationData'

// ==================================================================================
// TYPES & CONFIGURATION
// ==================================================================================

type ElementType = 'node' | 'link' | 'container'

type ElementInstance = Class_NodeElement | Class_LinkElement | Class_ContainerElement

interface ElementConfig<T extends ElementInstance> {
  // Getters pour les listes
  getAllElements: (app_data: Class_ApplicationData) => T[]
  getVisibleElements: (app_data: Class_ApplicationData) => T[]
  getSelectedElements: (app_data: Class_ApplicationData) => T[]
  getVisibleAndSelectedElements: (app_data: Class_ApplicationData) => T[]

  // Flags de visibilité
  getIsOnlyVisible: (app_data: Class_ApplicationData) => boolean
  toggleOnlyVisible: (app_data: Class_ApplicationData) => void

  // Gestion de la sélection
  addToSelection: (app_data: Class_ApplicationData, element: T) => void
  removeFromSelection: (app_data: Class_ApplicationData, element: T) => void
  purgeSelection: (app_data: Class_ApplicationData) => void
  deleteSelected: (app_data: Class_ApplicationData) => void

  // Création d'éléments
  createNewElement?: (app_data: Class_ApplicationData) => T

  // Refs d'update
  getUpdateRef: (app_data: Class_ApplicationData) => React.MutableRefObject<() => void>
  updateRelatedComponents: (app_data: Class_ApplicationData) => void

  // Traductions
  translationKeys: {
    labelSelect: string
    labelNoSelection: string
    tooltipAdd?: string
    tooltipSelect: string
    tooltipRemove: string
    tooltipVisibility: string
    labelName?: string
    tooltipName?: string
  }

  // Options spécifiques
  hasNameInput?: boolean
  hasCreateButton?: boolean
  hasDeleteButton?: boolean
  sortElements?: boolean
}

// ==================================================================================
// CONFIGURATIONS POUR CHAQUE TYPE
// ==================================================================================

const NODE_CONFIG: ElementConfig<Class_NodeElement> = {
  getAllElements: (app_data) => app_data.drawing_area.sankey.nodes_list_sorted,
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_nodes_list_sorted,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_nodes_list_sorted,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.visible_and_selected_nodes_list_sorted,

  getIsOnlyVisible: (app_data) => app_data.menu_configuration.is_selector_only_for_visible_nodes,
  toggleOnlyVisible: (app_data) => app_data.menu_configuration.toggle_selector_on_visible_nodes(),

  addToSelection: (app_data, element) => app_data.drawing_area.addNodeToSelection(element),
  removeFromSelection: (app_data, element) => app_data.drawing_area.removeNodeFromSelection(element),
  purgeSelection: (app_data) => app_data.drawing_area.purgeSelectionOfNode(),
  deleteSelected: (app_data) => app_data.drawing_area.deleteSelectedNodes(),

  createNewElement: (app_data) => app_data.drawing_area.addNewDefaultNodeToSankey(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_nodes_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToNodesConfig(),

  translationKeys: {
    labelSelect: 'Noeud.TS',
    labelNoSelection: 'Noeud.NS',
    tooltipAdd: 'Menu.tooltips.noeud.plus',
    tooltipSelect: 'Menu.tooltips.noeud.slct',
    tooltipRemove: 'Menu.tooltips.noeud.rm',
    tooltipVisibility: 'Menu.tooltips.noeud.dns',
    labelName: 'Noeud.Nom',
    tooltipName: 'Noeud.tooltips.Nom'
  },

  hasNameInput: true,
  hasCreateButton: true,
  hasDeleteButton: true,
  sortElements: true
}

const LINK_CONFIG: ElementConfig<Class_LinkElement> = {
  getAllElements: (app_data) => app_data.drawing_area.sankey.links_list,
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_links_list,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_links_list,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.visible_and_selected_links_list,

  getIsOnlyVisible: (app_data) => app_data.menu_configuration.is_selector_only_for_visible_links,
  toggleOnlyVisible: (app_data) => app_data.menu_configuration.toggle_selector_on_visible_links(),

  addToSelection: (app_data, element) => app_data.drawing_area.addLinkToSelection(element),
  removeFromSelection: (app_data, element) => app_data.drawing_area.removeLinkFromSelection(element),
  purgeSelection: (app_data) => app_data.drawing_area.purgeSelectionOfLinks(),
  deleteSelected: (app_data) => app_data.drawing_area.deleteSelectedLinks(),

  createNewElement: (app_data) => app_data.drawing_area.addNewDefaultLinkToSankey(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_links_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToLinksConfig(),

  translationKeys: {
    labelSelect: 'Flux.TS',
    labelNoSelection: 'Flux.NS',
    tooltipAdd: 'Menu.tooltips.flux.plus',
    tooltipSelect: 'Menu.tooltips.flux.slct',
    tooltipRemove: 'Menu.tooltips.flux.rm',
    tooltipVisibility: 'Menu.tooltips.noeud.dns'
  },

  hasCreateButton: true,
  hasDeleteButton: true
}

const CONTAINER_CONFIG: ElementConfig<Class_ContainerElement> = {
  getAllElements: (app_data) => app_data.drawing_area.containers_list,
  getVisibleElements: (app_data) => app_data.drawing_area.visible_containers_list,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_containers_list,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.visible_and_selected_containers_list,

  getIsOnlyVisible: (app_data) => app_data.menu_configuration.is_selector_only_for_visible_containers,
  toggleOnlyVisible: (app_data) => app_data.menu_configuration.toggle_selector_on_visible_containers(),

  addToSelection: (app_data, element) => app_data.drawing_area.addContainerToSelection(element),
  removeFromSelection: (app_data, element) => app_data.drawing_area.removeContainerFromSelection(element),
  purgeSelection: (app_data) => app_data.drawing_area.purgeSelectionOfContainers(),
  deleteSelected: (app_data) => app_data.drawing_area.deleteSelectedContainers(),

  createNewElement: (app_data) => app_data.drawing_area.addNewDefaultContainerToSankey(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_containers_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToContainersConfig(),

  translationKeys: {
    labelSelect: 'Container.TS',
    labelNoSelection: 'Container.NS',
    tooltipAdd: 'Menu.tooltips.container.plus',
    tooltipSelect: 'Menu.tooltips.container.slct',
    tooltipRemove: 'Menu.tooltips.container.rm',
    tooltipVisibility: 'Menu.tooltips.container.dns',
    labelName: 'Container.Nom',
    tooltipName: 'Container.tooltips.Nom'
  },

  hasNameInput: true,
  hasCreateButton: true,
  hasDeleteButton: true
}

// ==================================================================================
// COMPOSANT GÉNÉRIQUE DE SÉLECTION
// ==================================================================================

interface GenericSelectionProps<T extends ElementInstance> {
  app_data: Class_ApplicationData
  config: ElementConfig<T>
  mode?: 'full' | 'simple'
  dropdownWidth?: string
}

function GenericElementSelection<T extends ElementInstance>({
  app_data,
  config,
  mode = 'full',
  dropdownWidth
}: GenericSelectionProps<T>) {

  const { t, icon_library, menu_configuration, drawing_area, history } = app_data
  const { icon_add_element, icon_remove_element, icon_element_visible, icon_element_invisible } = icon_library

  // Récupération des éléments selon le mode de visibilité
  const elements = config.getIsOnlyVisible(app_data)
    ? config.getVisibleElements(app_data)
    : config.getAllElements(app_data)

  const selectedElements = config.getIsOnlyVisible(app_data)
    ? config.getVisibleAndSelectedElements(app_data)
    : config.getSelectedElements(app_data)

  // Préparation des options pour MultiSelect
  const options = elements.map((element) => ({
    label: element.name,
    value: element.id
  }))

  const selectedOptions = selectedElements.map((element) => ({
    label: element.name,
    value: element.id
  }))

  // State pour forcer le re-render
  const [, setCount] = useState(0)
  const refTextInput = useRef((_: string | null | undefined) => null)

  // Lier la fonction d'update
  config.getUpdateRef(app_data).current = () => {
    if (config.hasNameInput) {
      const valueToShow = (selectedElements.length !== 1) ? '' : selectedElements[0].name
      refTextInput.current(String(valueToShow))
    }
    setCount(a => a + 1)
  }

  // Fonctions de rafraîchissement
  const refreshAndToggleSaving = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (config.hasNameInput) {
      refTextInput.current(String((selectedElements.length !== 1) ? '' : selectedElements[0].name))
    }
    setCount(a => a + 1)
  }

  const refreshAndUpdateRelated = () => {
    config.updateRelatedComponents(app_data)
    refreshAndToggleSaving()
  }

  // MultiSelect dropdown
  const renderDropdown = () => {
    const width = dropdownWidth || (mode === 'simple' ? '14vw' : '11vw')

    return (
      <Box layerStyle='submenuconfig_droplist' width={width}>
        <MultiSelect
          options={options}
          value={selectedOptions}
          labelledBy={t(config.translationKeys.labelSelect) || 'Sélection'}
          onChange={(selected: [{ label: string, value: string }]) => {
            const newSelection = selected.map(d => d.value)

            elements.forEach(element => {
              if (newSelection.includes(element.id)) {
                config.addToSelection(app_data, element)
              } else {
                config.removeFromSelection(app_data, element)
              }
            })

            refreshAndUpdateRelated()
          }}
          valueRenderer={(selected: { label: string, value: string }[]) => {
            return selected.length
              ? selected.map(({ label }) => label + ', ')
              : t(config.translationKeys.labelNoSelection) || 'Aucune sélection'
          }}
        />
      </Box>
    )
  }

  // Création d'un nouvel élément
  const handleCreate = () => {
    if (!config.createNewElement) return

    let newElement: T

    const execute = () => {
      newElement = config.createNewElement!(app_data)
      config.purgeSelection(app_data)
      config.addToSelection(app_data, newElement)
      refreshAndUpdateRelated()
    }

    const undo = () => {
      // Supprimer l'élément créé
      if ('deleteNode' in app_data.drawing_area && newElement instanceof Class_NodeElement) {
        app_data.drawing_area.deleteNode(newElement)
      } else if ('deleteLink' in app_data.drawing_area && newElement instanceof Class_LinkElement) {
        app_data.drawing_area.deleteLink(newElement)
      } else if ('deleteContainer' in app_data.drawing_area && newElement instanceof Class_ContainerElement) {
        app_data.drawing_area.deleteContainer(newElement)
      }
      refreshAndUpdateRelated()
    }

    history.saveUndo(undo)
    history.saveRedo(execute)
    execute()
  }

  // Mise à jour du nom
  const handleNameUpdate = (newName: string | null | undefined) => {
    if (!config.hasNameInput || !newName || selectedElements.length !== 1) return

    const oldName = selectedElements[0].name

    const execute = () => {
      if (selectedElements.length === 1) {
        //@ts-expect-error xxx
        selectedElements[0].name = newName
        refreshAndToggleSaving()
      }
    }

    const undo = () => {
      if (selectedElements.length === 1) {
        //@ts-expect-error xxx
        selectedElements[0].name = oldName
        refreshAndToggleSaving()
      }
    }

    history.saveUndo(undo)
    history.saveRedo(execute)
    execute()
  }

  // Rendu MODE SIMPLE
  if (mode === 'simple') {
    return (
      <Box layerStyle='menuconfigpanel_grid'>
        <Box as='span' layerStyle='menuconfigpanel_row_droplist_simple'>
          <OSTooltip label={t(config.translationKeys.tooltipSelect)}>
            {renderDropdown()}
          </OSTooltip>

          <OSTooltip label={t(config.translationKeys.tooltipVisibility)}>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={() => config.toggleOnlyVisible(app_data)}
            >
              {config.getIsOnlyVisible(app_data) ? icon_element_visible : icon_element_invisible}
            </Button>
          </OSTooltip>
        </Box>
      </Box>
    )
  }

  // Rendu MODE FULL
  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box as='span' layerStyle='menuconfigpanel_row_droplist'>
        {config.hasCreateButton && (
          <OSTooltip label={t(config.translationKeys.tooltipAdd!)}>
            <Button
              variant='menuconfigpanel_add_button'
              size='sizeConfigButton'
              onClick={handleCreate}
            >
              {icon_add_element}
            </Button>
          </OSTooltip>
        )}

        <OSTooltip label={t(config.translationKeys.tooltipSelect)}>
          {renderDropdown()}
        </OSTooltip>

        {config.hasDeleteButton && (
          <OSTooltip label={t(config.translationKeys.tooltipRemove)}>
            <Button
              variant='menuconfigpanel_del_button'
              size='sizeConfigButton'
              isDisabled={selectedElements.length === 0}
              onClick={() => {
                config.deleteSelected(app_data)
                refreshAndUpdateRelated()
              }}
            >
              {icon_remove_element}
            </Button>
          </OSTooltip>
        )}

        <OSTooltip label={t(config.translationKeys.tooltipVisibility)}>
          <Button
            variant='menuconfigpanel_option_button'
            size='sizeConfigButton'
            onClick={() => config.toggleOnlyVisible(app_data)}
          >
            {config.getIsOnlyVisible(app_data) ? icon_element_visible : icon_element_invisible}
          </Button>
        </OSTooltip>
      </Box>

      {config.hasNameInput && (
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' gridTemplateColumns='1fr 9fr'>
          <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>
            {t(config.translationKeys.labelName!)}
          </Box>
          <Box>
            <OSTooltip label={t(config.translationKeys.tooltipName!)}>
              <ConfigMenuTextInput
                default_value={(selectedElements.length !== 1) ? '' : selectedElements[0].name}
                function_on_blur={handleNameUpdate}
                disabled={selectedElements.length !== 1}
              />
            </OSTooltip>
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ==================================================================================
// COMPOSANTS EXPORTÉS (compatibilité avec l'existant)
// ==================================================================================

export const SankeyNodeSelection = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <GenericElementSelection app_data={app_data} config={NODE_CONFIG} mode="full" />
)

export const SankeyNodeSelectionSimple = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <GenericElementSelection app_data={app_data} config={NODE_CONFIG} mode="simple" />
)

export const SankeyLinkSelection = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <GenericElementSelection app_data={app_data} config={LINK_CONFIG} mode="full" />
)

export const SankeyLinkSelectionSimple = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <GenericElementSelection app_data={app_data} config={LINK_CONFIG} mode="simple" />
)

export const SankeyContainerSelection = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <GenericElementSelection app_data={app_data} config={CONTAINER_CONFIG} mode="full" />
)

export const SankeyContainerSelectionSimple = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <GenericElementSelection app_data={app_data} config={CONTAINER_CONFIG} mode="simple" />
)
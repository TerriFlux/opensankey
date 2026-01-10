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
  type: ElementType
  // Getters pour les listes
  getAllElements: (app_data: Class_ApplicationData) => T[]
  getVisibleElements: (app_data: Class_ApplicationData) => T[]
  getSelectedElements: (app_data: Class_ApplicationData) => T[]
  getVisibleAndSelectedElements: (app_data: Class_ApplicationData) => T[]

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

// ElementsMenuConfig.ts
export const ELEMENTS_MENU_CONFIG = {
  node: {
    labels: {
      TS: { en: 'Selected nodes', fr: 'Noeuds sélectionnés' },
      NS: { en: 'No selection', fr: 'Aucune sélection' },
      Nom: { en: 'Name', fr: 'Nom' }
    },
    tooltips: {
      plus: { en: 'Add a node, which will be automatically selected', fr: 'Ajouter un noeud. Celui-ci sera automatiquement selectionné.' },
      slct: { en: 'Choose nodes to select via dropdown', fr: 'Choisir un / des / tous les noeud(s) à sélectionner via une liste déroulante' },
      rm: { en: 'Delete all currently selected nodes', fr: 'Permettre de supprimer tous les noeud(s) actuellement sélectionné(s)' },
      dns: { en: 'Display only visible nodes in selector', fr: 'Afficher dans la liste de selection des noeuds, uniquement ceux actuellement visibles' },
      Nom: { en: 'Rename the node', fr: 'Renommer le noeud' }
    }
  },
  
  link: {
    labels: {
      TS: { en: 'Selected links', fr: 'Flux sélectionnés' },
      NS: { en: 'No selection', fr: 'Aucune sélection' }
    },
    tooltips: {
      plus: { en: 'Add a new link', fr: 'Ajouter un flux' },
      slct: { en: 'Choose links to select', fr: 'Choisir un / des / tous les flux à sélectionner' },
      rm: { en: 'Delete selected links', fr: 'Supprimer les flux sélectionnés' },
      dns: { en: 'Display only visible links', fr: 'Afficher uniquement les flux visibles' },
      dls: { en: 'Display only visible links', fr: 'Afficher uniquement les flux visibles' }
    }
  },

  container: {
    labels: {
      TS: { en: 'Selected containers', fr: 'Containers sélectionnés' },
      NS: { en: 'No selection', fr: 'Aucune sélection' },
      Nom: { en: 'Name', fr: 'Nom' }
    },
    tooltips: {
      plus: { en: 'Add a container', fr: 'Ajouter un container' },
      slct: { en: 'Choose containers to select', fr: 'Choisir les containers à sélectionner' },
      rm: { en: 'Delete selected containers', fr: 'Supprimer les containers sélectionnés' },
      dns: { en: 'Display only visible containers', fr: 'Afficher uniquement les containers visibles' },
      Nom: { en: 'Rename the container', fr: 'Renommer le container' }
    }
  },

  common: {
    labels: {
      filter_nodes: { en: 'Filter nodes', fr: 'Filtrer les nœuds' },
      filter_links: { en: 'Filter links', fr: 'Filtrer les flux' },
      filter_containers: { en: 'Filter containers', fr: 'Filtrer les containers' },
      select_elements: { en: 'Select elements', fr: 'Sélectionner des éléments' },
      toggle_visibility: { en: 'Toggle visibility', fr: 'Basculer la visibilité' }
    }
  }
} as const

const NODE_CONFIG: ElementConfig<Class_NodeElement> = {
  type: 'node',
  getAllElements: (app_data) => app_data.drawing_area.sankey.nodes_list_sorted,
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_nodes_list_sorted,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_nodes_list_sorted,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.visible_and_selected_nodes_list_sorted,

  createNewElement: (app_data) => app_data.drawing_area.sankey.addNewDefaultNode(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_nodes_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToNodesConfig(),

  translationKeys: {
    labelSelect: 'Noeud.TS',              // ✅ Chemin direct
    labelNoSelection: 'Noeud.NS',
    tooltipAdd: 'Noeud.tooltips.plus',
    tooltipSelect: 'Noeud.tooltips.slct',
    tooltipRemove: 'Noeud.tooltips.rm',
    tooltipVisibility: 'Noeud.tooltips.dns',
    labelName: 'Noeud.Nom',
    tooltipName: 'Noeud.tooltips.Nom'
  },

  hasNameInput: true,
  hasCreateButton: true,
  hasDeleteButton: true,
  sortElements: true
}

const LINK_CONFIG: ElementConfig<Class_LinkElement> = {
  type: 'link',
  getAllElements: (app_data) => app_data.drawing_area.sankey.links_list,
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_links_list,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_links_list,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.visible_and_selected_links_list,

  createNewElement: (app_data) => app_data.drawing_area.sankey.addNewDefaultLink(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_links_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToLinksConfig(),

  translationKeys: {
    labelSelect: 'Flux.TS',
    labelNoSelection: 'Flux.NS',
    tooltipAdd: 'Flux.tooltips.plus',
    tooltipSelect: 'Flux.tooltips.slct',
    tooltipRemove: 'Flux.tooltips.rm',
    tooltipVisibility: 'Flux.tooltips.dls'
  },

  hasCreateButton: true,
  hasDeleteButton: true
}

const CONTAINER_CONFIG: ElementConfig<Class_ContainerElement> = {
  type: 'container',
  getAllElements: (app_data) => app_data.drawing_area.sankey.containers_list,
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_containers_list,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_containers_list,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.visible_and_selected_containers_list,

  createNewElement: (app_data) => app_data.drawing_area.sankey.addNewDefaultContainer(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_containers_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToContainersConfig(),

  translationKeys: {
    labelSelect: 'Container.TS',
    labelNoSelection: 'Container.NS',
    tooltipAdd: 'Container.tooltips.plus',
    tooltipSelect: 'Container.tooltips.slct',
    tooltipRemove: 'Container.tooltips.rm',
    tooltipVisibility: 'Container.tooltips.dns',
    labelName: 'Container.Nom',
    tooltipName: 'Container.tooltips.Nom'
  },

  hasNameInput: true,
  hasCreateButton: true,
  hasDeleteButton: true
}

const ALL_CONFIGS = {
  node: NODE_CONFIG,
  link: LINK_CONFIG,
  container: CONTAINER_CONFIG
}

// ==================================================================================
// COMPOSANT SÉLECTEUR MULTI-TYPE (NOUVEAU)
// ==================================================================================

interface MultiTypeSelectionProps {
  app_data: Class_ApplicationData
  enabledTypes?: ElementType[]
  dropdownWidth?: string
}

export const SankeyMultiTypeSelectionSimple = ({
  app_data,
  enabledTypes = ['node', 'link', 'container'],
  dropdownWidth
}: MultiTypeSelectionProps) => {
  const { t, icon_library, menu_configuration } = app_data
  const { icon_element_visible, icon_element_invisible, icon_flow, icon_object, icon_node } = icon_library

  // ✅ State pour les filtres actifs
  const [activeFilters, setActiveFilters] = useState<Set<ElementType>>(new Set(enabledTypes))
  const [, setCount] = useState(0)

  // ✅ Icônes pour chaque type
  const typeIcons = {
    node: icon_node,
    link: icon_flow,
    container: icon_object
  }

  // ✅ Récupérer tous les éléments filtrés
  const getAllFilteredElements = () => {
    const allElements: { element: ElementInstance; type: ElementType; config: ElementConfig<any> }[] = []

    enabledTypes.forEach(type => {
      if (!activeFilters.has(type)) return

      const config = ALL_CONFIGS[type]
      const elements = app_data.menu_configuration.is_selector_only_for_visible_elements
        ? config.getVisibleElements(app_data)
        : config.getAllElements(app_data)

      elements.forEach(element => {
        allElements.push({ element, type, config })
      })
    })

    return allElements
  }

  // ✅ Récupérer tous les éléments sélectionnés
  const getAllSelectedElements = () => {
    const selectedElements: { element: ElementInstance; type: ElementType; config: ElementConfig<any> }[] = []

    enabledTypes.forEach(type => {
      if (!activeFilters.has(type)) return

      const config = ALL_CONFIGS[type]
      const elements = app_data.menu_configuration.is_selector_only_for_visible_elements
        ? config.getVisibleAndSelectedElements(app_data)
        : config.getSelectedElements(app_data)

      elements.forEach(element => {
        selectedElements.push({ element, type, config })
      })
    })

    return selectedElements
  }

  const allFilteredElements = getAllFilteredElements()
  const allSelectedElements = getAllSelectedElements()

  // ✅ Options pour MultiSelect avec préfixe de type
  const options = allFilteredElements.map(({ element, type }) => ({
    label: `[${type === 'node' ? 'N' : type === 'link' ? 'F' : 'C'}] ${element.name}`,
    value: `${type}:${element.id}`,
    type
  }))

  const selectedOptions = allSelectedElements.map(({ element, type }) => ({
    label: `[${type === 'node' ? 'N' : type === 'link' ? 'F' : 'C'}] ${element.name}`,
    value: `${type}:${element.id}`,
    type
  }))

  // ✅ Lier les updaters
  enabledTypes.forEach(type => {
    const config = ALL_CONFIGS[type]
    config.getUpdateRef(app_data).current = () => setCount(a => a + 1)
  })

  // ✅ Refresh
  const refreshAndUpdateAll = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    enabledTypes.forEach(type => {
      const config = ALL_CONFIGS[type]
      config.updateRelatedComponents(app_data)
    })
    setCount(a => a + 1)
  }

  // ✅ Toggle filtre
  const toggleFilter = (type: ElementType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(type)) {
        newFilters.delete(type)
      } else {
        newFilters.add(type)
      }
      return newFilters
    })
  }

  // ✅ Toggle visibilité (applique à tous les types actifs)
  const toggleAllVisibility = () => {
    enabledTypes.forEach(type => {
      if (activeFilters.has(type)) {
        const config = ALL_CONFIGS[type]
        app_data.menu_configuration.toggle_selector_on_visible_elements()
      }
    })
    setCount(a => a + 1)
  }

  // ✅ Vérifier si au moins un type a "only visible" activé
  const hasAnyOnlyVisible = enabledTypes.some(type => {
    if (!activeFilters.has(type)) return false
    const config = ALL_CONFIGS[type]
    return app_data.menu_configuration.is_selector_only_for_visible_elements
  })

  // ✅ Dropdown
  const renderDropdown = () => {
    const width = dropdownWidth || '8vw'

    return (
      <Box layerStyle='submenuconfig_droplist' width={width}>
        <MultiSelect
          options={options}
          value={selectedOptions}
          labelledBy={t('Menu.selection') || 'Sélection'}
          onChange={(selected: [{ label: string; value: string; type: ElementType }]) => {
            const newSelection = selected.map(d => d.value)

            // Pour chaque type, mettre à jour la sélection
            enabledTypes.forEach(type => {
              if (!activeFilters.has(type)) return

              const config = ALL_CONFIGS[type]
              const elements = app_data.menu_configuration.is_selector_only_for_visible_elements
                ? config.getVisibleElements(app_data)
                : config.getAllElements(app_data)

              elements.forEach(element => {
                const key = `${type}:${element.id}`
                if (newSelection.includes(key)) {
                  app_data.drawing_area.addElementToSelection(element)
                } else {
                  app_data.drawing_area.removeElementFromSelection(element)
                }
              })
            })

            refreshAndUpdateAll()
          }}
          valueRenderer={(selected: { label: string; value: string; type: ElementType }[]) => {
            if (!selected.length) {
              return t('Menu.no_selection') || 'Aucune sélection'
            }

            // Compter par type
            const counts = { node: 0, link: 0, container: 0 }
            selected.forEach(s => counts[s.type]++)

            const parts: string[] = []
            if (counts.node > 0) parts.push(`${counts.node}N`)
            if (counts.link > 0) parts.push(`${counts.link}F`)
            if (counts.container > 0) parts.push(`${counts.container}C`)

            return parts.join(' + ')
          }}
        />
      </Box>
    )
  }

  // ✅ Boutons de filtre
  const renderFilters = () => (
    <Box layerStyle='options_3cols'>
      {enabledTypes.includes('node') && (
        <OSTooltip label={t('Menu.filter_nodes') || 'Filtrer les nœuds'}>
          <Button
            variant={activeFilters.has('node') ? 'button_config_element_activated' : 'button_config_element'}
            onClick={() => toggleFilter('node')}
            sx={{
              padding: '4px',
              minWidth: 'auto',
              height: 'auto',
              '& svg': {
                width: '10px',    // ✅ Réduit la taille des SVG
                height: '10px'
              }
            }}
          >
            {typeIcons.node}
          </Button>
        </OSTooltip>
      )}

      {enabledTypes.includes('link') && (
        <OSTooltip label={t('Menu.filter_links') || 'Filtrer les flux'}>
          <Button
            variant={activeFilters.has('link') ? 'button_config_element_activated' : 'button_config_element'}
            onClick={() => toggleFilter('link')}
            sx={{
              padding: '4px',
              minWidth: 'auto',
              height: 'auto',
              '& svg': {
                width: '10px',    // ✅ Réduit la taille des SVG
                height: '10px'
              }
            }}
          >
            {typeIcons.link}
          </Button>
        </OSTooltip>
      )}

      {enabledTypes.includes('container') && (
        <OSTooltip label={t('Menu.filter_containers') || 'Filtrer les containers'}>
          <Button
            variant={activeFilters.has('container') ? 'button_config_element_activated' : 'button_config_element'}
            onClick={() => toggleFilter('container')}
            sx={{
              padding: '4px',
              minWidth: 'auto',
              height: 'auto',
              '& svg': {
                width: '10px',    // ✅ Réduit la taille des SVG
                height: '10px'
              }
            }}
          >
            {typeIcons.container}
          </Button>
        </OSTooltip>
      )}
    </Box>
  )

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      <Box as='span' layerStyle='menuconfigpanel_row_droplist_simple'>
        {/* Filtres de type */}
        {renderFilters()}

        {/* Dropdown */}
        <OSTooltip label={t('Menu.select_elements') || 'Sélectionner des éléments'}>
          {renderDropdown()}
        </OSTooltip>

        {/* Bouton visibilité */}
        <OSTooltip label={t('Menu.toggle_visibility') || 'Basculer la visibilité'}>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={toggleAllVisibility}
          >
            {hasAnyOnlyVisible ? icon_element_visible : icon_element_invisible}
          </Button>
        </OSTooltip>
      </Box>
    </Box>
  )
}

// ==================================================================================
// COMPOSANT GÉNÉRIQUE DE SÉLECTION SINGLE-TYPE
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

  const { t, icon_library, menu_configuration, history } = app_data
  const { icon_add_element, icon_remove_element, icon_element_visible, icon_element_invisible } = icon_library

  const elements = app_data.menu_configuration.is_selector_only_for_visible_elements
    ? config.getVisibleElements(app_data)
    : config.getAllElements(app_data)

  const selectedElements = app_data.menu_configuration.is_selector_only_for_visible_elements
    ? config.getVisibleAndSelectedElements(app_data)
    : config.getSelectedElements(app_data)

  const options = elements.map((element) => ({
    label: element.name,
    value: element.id
  }))

  const selectedOptions = selectedElements.map((element) => ({
    label: element.name,
    value: element.id
  }))

  const [, setCount] = useState(0)
  const refTextInput = useRef((_: string | null | undefined) => null)

  config.getUpdateRef(app_data).current = () => {
    if (config.hasNameInput) {
      const valueToShow = (selectedElements.length !== 1) ? '' : selectedElements[0].name
      refTextInput.current(String(valueToShow))
    }
    setCount(a => a + 1)
  }

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
                app_data.drawing_area.addElementToSelection(element)
              } else {
                app_data.drawing_area.removeElementFromSelection(element)
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

  const handleCreate = () => {
    if (!config.createNewElement) return

    let newElement: T

    const execute = () => {
      newElement = config.createNewElement!(app_data)
      app_data.drawing_area.purgeSelectionOfElement()
      app_data.drawing_area.addElementToSelection(newElement)
      refreshAndUpdateRelated()
    }

    const undo = () => {
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
              onClick={() => app_data.menu_configuration.toggle_selector_on_visible_elements()}
            >
              {app_data.menu_configuration.is_selector_only_for_visible_elements ? icon_element_visible : icon_element_invisible}
            </Button>
          </OSTooltip>
        </Box>
      </Box>
    )
  }

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
                app_data.drawing_area.deleteSelectedElements()
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
            onClick={() => app_data.menu_configuration.toggle_selector_on_visible_elements()}
          >
            {app_data.menu_configuration.is_selector_only_for_visible_elements ? icon_element_visible : icon_element_invisible}
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

// ✅ Sélecteurs single-type (compatibilité)
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
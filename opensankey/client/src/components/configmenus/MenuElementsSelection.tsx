import React, { useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { Box, Button, Checkbox, Divider, Select } from '@chakra-ui/react'
import { ConfigMenuTextInput, ConfigMenuNumberInput, OSTooltip } from './MenuCommon'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeBase } from '../../Elements/NodeBase'

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
      TS: { en: 'Selected nodes', fr: 'Noeuds sélectionnés', es: 'Nodos seleccionados', de: 'Ausgewählte Knoten', it: 'Nodi selezionati' },
      NS: { en: 'No selection', fr: 'Aucune sélection', es: 'Sin selección', de: 'Keine Auswahl', it: 'Nessuna selezione' },
      Nom: { en: 'Name', fr: 'Nom', es: 'Nombre', de: 'Name', it: 'Nome' }
    },
    tooltips: {
      plus: { en: 'Add a node, which will be automatically selected', fr: 'Ajouter un noeud. Celui-ci sera automatiquement selectionné.', es: 'Añadir un nodo, que se seleccionará automáticamente', de: 'Einen Knoten hinzufügen, der automatisch ausgewählt wird', it: 'Aggiungere un nodo, che verrà selezionato automaticamente' },
      slct: { en: 'Choose nodes to select via dropdown', fr: 'Choisir un / des / tous les noeud(s) à sélectionner via une liste déroulante', es: 'Elegir nodos a seleccionar mediante lista desplegable', de: 'Knoten über Dropdown-Liste auswählen', it: 'Scegliere i nodi da selezionare tramite elenco a discesa' },
      rm: { en: 'Delete all currently selected nodes', fr: 'Permettre de supprimer tous les noeud(s) actuellement sélectionné(s)', es: 'Eliminar todos los nodos actualmente seleccionados', de: 'Alle aktuell ausgewählten Knoten löschen', it: 'Eliminare tutti i nodi attualmente selezionati' },
      dns: { en: 'Display only visible nodes in selector', fr: 'Afficher dans la liste de selection des noeuds, uniquement ceux actuellement visibles', es: 'Mostrar solo los nodos visibles en el selector', de: 'Nur sichtbare Knoten im Selektor anzeigen', it: 'Visualizzare solo i nodi visibili nel selettore' },
      Nom: { en: 'Rename the node', fr: 'Renommer le noeud', es: 'Renombrar el nodo', de: 'Den Knoten umbenennen', it: 'Rinominare il nodo' }
    }
  },

  link: {
    labels: {
      TS: { en: 'Selected links', fr: 'Flux sélectionnés', es: 'Flujos seleccionados', de: 'Ausgewählte Flüsse', it: 'Flussi selezionati' },
      NS: { en: 'No selection', fr: 'Aucune sélection', es: 'Sin selección', de: 'Keine Auswahl', it: 'Nessuna selezione' }
    },
    tooltips: {
      plus: { en: 'Add a new link', fr: 'Ajouter un flux', es: 'Añadir un nuevo flujo', de: 'Einen neuen Fluss hinzufügen', it: 'Aggiungere un nuovo flusso' },
      slct: { en: 'Choose links to select', fr: 'Choisir un / des / tous les flux à sélectionner', es: 'Elegir flujos a seleccionar', de: 'Flüsse zum Auswählen wählen', it: 'Scegliere i flussi da selezionare' },
      rm: { en: 'Delete selected links', fr: 'Supprimer les flux sélectionnés', es: 'Eliminar los flujos seleccionados', de: 'Ausgewählte Flüsse löschen', it: 'Eliminare i flussi selezionati' },
      dns: { en: 'Display only visible links', fr: 'Afficher uniquement les flux visibles', es: 'Mostrar solo los flujos visibles', de: 'Nur sichtbare Flüsse anzeigen', it: 'Visualizzare solo i flussi visibili' },
      dls: { en: 'Display only visible links', fr: 'Afficher uniquement les flux visibles', es: 'Mostrar solo los flujos visibles', de: 'Nur sichtbare Flüsse anzeigen', it: 'Visualizzare solo i flussi visibili' }
    }
  },

  container: {
    labels: {
      TS: { en: 'Selected containers', fr: 'Containers sélectionnés', es: 'Contenedores seleccionados', de: 'Ausgewählte Container', it: 'Contenitori selezionati' },
      NS: { en: 'No selection', fr: 'Aucune sélection', es: 'Sin selección', de: 'Keine Auswahl', it: 'Nessuna selezione' },
      Nom: { en: 'Name', fr: 'Nom', es: 'Nombre', de: 'Name', it: 'Nome' }
    },
    tooltips: {
      plus: { en: 'Add a container', fr: 'Ajouter un container', es: 'Añadir un contenedor', de: 'Einen Container hinzufügen', it: 'Aggiungere un contenitore' },
      slct: { en: 'Choose containers to select', fr: 'Choisir les containers à sélectionner', es: 'Elegir contenedores a seleccionar', de: 'Container zum Auswählen wählen', it: 'Scegliere i contenitori da selezionare' },
      rm: { en: 'Delete selected containers', fr: 'Supprimer les containers sélectionnés', es: 'Eliminar los contenedores seleccionados', de: 'Ausgewählte Container löschen', it: 'Eliminare i contenitori selezionati' },
      dns: { en: 'Display only visible containers', fr: 'Afficher uniquement les containers visibles', es: 'Mostrar solo los contenedores visibles', de: 'Nur sichtbare Container anzeigen', it: 'Visualizzare solo i contenitori visibili' },
      Nom: { en: 'Rename the container', fr: 'Renommer le container', es: 'Renombrar el contenedor', de: 'Den Container umbenennen', it: 'Rinominare il contenitore' }
    }
  },

  common: {
    labels: {
      filter_nodes: { en: 'Filter nodes', fr: 'Filtrer les nœuds', es: 'Filtrar nodos', de: 'Knoten filtern', it: 'Filtrare i nodi' },
      filter_links: { en: 'Filter links', fr: 'Filtrer les flux', es: 'Filtrar flujos', de: 'Flüsse filtern', it: 'Filtrare i flussi' },
      filter_containers: { en: 'Filter containers', fr: 'Filtrer les containers', es: 'Filtrar contenedores', de: 'Container filtern', it: 'Filtrare i contenitori' },
      select_elements: { en: 'Select elements', fr: 'Sélectionner des éléments', es: 'Seleccionar elementos', de: 'Elemente auswählen', it: 'Selezionare elementi' },
      toggle_visibility: { en: 'Toggle visibility', fr: 'Basculer la visibilité', es: 'Alternar visibilidad', de: 'Sichtbarkeit umschalten', it: 'Attivare/disattivare visibilità' }
    }
  }
} as const

const NODE_CONFIG: ElementConfig<Class_NodeElement> = {
  type: 'node',
  getAllElements: (app_data) => app_data.drawing_area.sankey.nodes_list_sorted,
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_nodes_list_sorted,
  getSelectedElements: (app_data) => app_data.drawing_area.selected_nodes_list_sorted,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.selected_nodes_list_sorted,

  createNewElement: (app_data) => app_data.drawing_area.sankey.addNewDefaultNode(),

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_nodes_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToNodesConfig(),

  translationKeys: {
    labelSelect: 'Noeud.TS',
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
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.selected_links_list,

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
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.selected_containers_list,

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

export const ALL_CONFIGS = {
  node: NODE_CONFIG,
  link: LINK_CONFIG,
  container: CONTAINER_CONFIG
}

// ==================================================================================
// COMPOSANT UNIFIÉ DE SÉLECTION
// ==================================================================================

interface UnifiedSelectionProps {
  app_data: Class_ApplicationData
  // Configuration
  config?: ElementConfig<Class_ContainerElement | Class_NodeElement | Class_LinkElement>  // Pour single-type
  enabledTypes?: ElementType[]  // Pour multi-type
  // Mode
  mode?: 'full' | 'simple'
  // Options
  dropdownWidth?: string
}

export const UnifiedElementSelection = ({
  app_data,
  config,
  enabledTypes,
  mode = 'full',
  dropdownWidth: _dropdownWidth
}: UnifiedSelectionProps) => {
  const { t, icon_library, menu_configuration, history } = app_data
  const [only_visible, setOnlyVisible] = useState(true)
  const {
    icon_add_element,
    icon_remove_element,
    icon_element_visible,
    icon_element_invisible,
    icon_node,
    icon_flow,
    icon_object
  } = icon_library

  // ✅ Détection du mode : single-type ou multi-type
  const isMultiType = !!enabledTypes && enabledTypes.length > 1
  const isSingleType = !isMultiType

  // ✅ Pour single-type, on utilise la config fournie
  const singleConfig = isSingleType ? (config || NODE_CONFIG) : null

  // ✅ Pour multi-type, state des filtres actifs
  const [activeFilters, setActiveFilters] = useState<Set<ElementType>>(
    new Set(enabledTypes || ['node'])
  )
  const [, setCount] = useState(0)

  // ✅ Icônes pour chaque type
  const typeIcons = {
    node: icon_node,
    link: icon_flow,
    container: icon_object
  }

  // ==================================================================================
  // LOGIQUE MULTI-TYPE
  // ==================================================================================

  const getAllFilteredElements = () => {
    if (!isMultiType) return []

    const allElements: { element: ElementInstance; type: ElementType; config: ElementConfig<Class_ContainerElement | Class_NodeElement | Class_LinkElement> }[] = []

    enabledTypes!.forEach(type => {
      if (!activeFilters.has(type)) return

      const cfg = ALL_CONFIGS[type]
      const elements = only_visible
        ? cfg.getVisibleElements(app_data)
        : cfg.getAllElements(app_data)

      elements.forEach(element => {
        allElements.push({ element, type, config: cfg })
      })
    })

    return allElements
  }

  const getAllSelectedElements = () => {
    if (!isMultiType) return []

    const selectedElements: { element: ElementInstance; type: ElementType; config: ElementConfig<Class_ContainerElement | Class_NodeElement | Class_LinkElement> }[] = []

    enabledTypes!.forEach(type => {
      if (!activeFilters.has(type)) return

      const cfg = ALL_CONFIGS[type]
      const elements = only_visible
        ? cfg.getVisibleAndSelectedElements(app_data)
        : cfg.getSelectedElements(app_data)

      elements.forEach(element => {
        selectedElements.push({ element, type, config: cfg })
      })
    })

    return selectedElements
  }

  // ==================================================================================
  // LOGIQUE SINGLE-TYPE
  // ==================================================================================

  const singleTypeElements = isSingleType && singleConfig
    ? (only_visible
      ? singleConfig.getVisibleElements(app_data)
      : singleConfig.getAllElements(app_data))
    : []

  const singleTypeSelectedElements = isSingleType && singleConfig
    ? (only_visible
      ? singleConfig.getVisibleAndSelectedElements(app_data)
      : singleConfig.getSelectedElements(app_data))
    : []

  // ==================================================================================
  // OPTIONS POUR LE DROPDOWN
  // ==================================================================================

  const options = isMultiType
    ? getAllFilteredElements().map(({ element, type }) => ({
      label: `[${type === 'node' ? 'N' : type === 'link' ? 'F' : 'C'}] ${element.name}`,
      value: `${type}:${element.id}`,
      type
    }))
    : singleTypeElements.map((element) => ({
      label: element.name,
      value: element.id
    }))

  const selectedOptions = isMultiType
    ? getAllSelectedElements().map(({ element, type }) => ({
      label: `[${type === 'node' ? 'N' : type === 'link' ? 'F' : 'C'}] ${element.name}`,
      value: `${type}:${element.id}`,
      type
    }))
    : singleTypeSelectedElements.map((element) => ({
      label: element.name,
      value: element.id
    }))

  // ==================================================================================
  // SETUP DES UPDATERS
  // ==================================================================================

  if (isMultiType) {
    enabledTypes!.forEach(type => {
      ALL_CONFIGS[type].getUpdateRef(app_data).current = () => setCount(a => a + 1)
    })
  } else if (singleConfig) {
    singleConfig.getUpdateRef(app_data).current = () => {
      setCount(a => a + 1)
    }
  }

  // ==================================================================================
  // FONCTIONS UTILITAIRES
  // ==================================================================================

  const refreshAndToggleSaving = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setCount(a => a + 1)
  }

  const refreshAndUpdateRelated = () => {
    if (isMultiType) {
      enabledTypes!.forEach(type => {
        ALL_CONFIGS[type].updateRelatedComponents(app_data)
      })
    } else if (singleConfig) {
      singleConfig.updateRelatedComponents(app_data)
    }
    refreshAndToggleSaving()
  }

  const toggleFilter = (type: ElementType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev)
      const wasActive = newFilters.has(type)

      if (wasActive) {
        // ✅ Si on désactive le filtre, désélectionner tous les éléments de ce type
        newFilters.delete(type)

        const cfg = ALL_CONFIGS[type]
        const elementsToDeselect = cfg.getSelectedElements(app_data)

        elementsToDeselect.forEach(element => {
          app_data.drawing_area.removeElementFromSelection(element)
        })

        // Rafraîchir les composants liés
        cfg.updateRelatedComponents(app_data)
        refreshAndToggleSaving()
      } else {
        // Si on active le filtre, juste l'ajouter
        newFilters.add(type)
      }

      return newFilters
    })
  }

  const toggleVisibility = () => {
    setOnlyVisible(!only_visible)
  }
  type DropdownOption = SingleTypeOption | MultiTypeOption
  // ==================================================================================
  // HANDLERS
  // ==================================================================================
  const handleDropdownChange = (selected: DropdownOption[]) => {
    const newSelection = selected.map(d => d.value)

    if (isMultiType) {
      // Multi-type : traiter chaque type
      enabledTypes!.forEach(type => {
        if (!activeFilters.has(type)) return

        const cfg = ALL_CONFIGS[type]
        const elements = only_visible
          ? cfg.getVisibleElements(app_data)
          : cfg.getAllElements(app_data)

        elements.forEach(element => {
          const key = `${type}:${element.id}`
          if (newSelection.includes(key)) {
            app_data.drawing_area.addElementToSelection(element)
          } else {
            app_data.drawing_area.removeElementFromSelection(element)
          }
        })
      })
    } else {
      // Single-type
      singleTypeElements.forEach(element => {
        if (newSelection.includes(element.id)) {
          app_data.drawing_area.addElementToSelection(element)
        } else {
          app_data.drawing_area.removeElementFromSelection(element)
        }
      })
    }

    refreshAndUpdateRelated()
  }

  const handleCreate = () => {
    if (!singleConfig?.createNewElement) return

    let newElement: Class_NodeElement | Class_LinkElement | Class_ContainerElement

    const execute = () => {
      newElement = singleConfig.createNewElement!(app_data)
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

  const handleDelete = () => {
    app_data.drawing_area.deleteSelectedElements()
    refreshAndUpdateRelated()
  }

  const handleNameUpdate = (newName: string | null | undefined) => {
    if (!singleConfig?.hasNameInput || !newName || singleTypeSelectedElements.length !== 1) return

    const oldName = singleTypeSelectedElements[0].name

    const execute = () => {
      if (singleTypeSelectedElements.length === 1) {
        (singleTypeSelectedElements[0] as Class_NodeBase).name = newName
        refreshAndToggleSaving()
      }
    }

    const undo = () => {
      if (singleTypeSelectedElements.length === 1) {
        (singleTypeSelectedElements[0] as Class_NodeBase).name = oldName
        refreshAndToggleSaving()
      }
    }

    history.saveUndo(undo)
    history.saveRedo(execute)
    execute()
  }

  // ==================================================================================
  // TYPES POUR LES OPTIONS DU DROPDOWN
  // ==================================================================================

  interface SingleTypeOption {
    label: string
    value: string
  }

  interface MultiTypeOption {
    label: string
    value: string
    type: ElementType
  }

  // type DropdownOption = SingleTypeOption | MultiTypeOption

  // // Dans la fonction isMultiTypeOption pour le type guard
  // const isMultiTypeOption = (option: DropdownOption): option is MultiTypeOption => {
  //   return 'type' in option
  // }

  // ==================================================================================
  // Dans le composant UnifiedElementSelection
  // ==================================================================================

  const renderDropdown = () => {
    const labelKey = isMultiType
      ? 'Menu.selection'
      : singleConfig?.translationKeys.labelSelect

    const valueRenderer = isMultiType
      ? (selected: MultiTypeOption[]) => {
        if (!selected.length) return t('Noeud.NS') || 'Aucune sélection'

        const counts: Record<ElementType, number> = { node: 0, link: 0, container: 0 }
        selected.forEach(s => {
          counts[s.type]++
        })

        const parts: string[] = []
        if (counts.node > 0) parts.push(`${counts.node}N`)
        if (counts.link > 0) parts.push(`${counts.link}F`)
        if (counts.container > 0) parts.push(`${counts.container}C`)

        return parts.join(' + ')
      }
      : (selected: SingleTypeOption[]) => {
        // ✅ Afficher le nombre au lieu de la liste complète
        return selected.length === 0
          ? t(singleConfig!.translationKeys.labelNoSelection) || 'Aucune sélection'
          : selected.length === 1
            ? selected[0].label
            : `${selected.length} éléments sélectionnés`  // ou `${selected.length} E`
      }
    const multiSelectStrings = {
      selectSomeItems: 'Sélectionner...',
      allItemsAreSelected: 'Tous sélectionnés',
      selectAll: 'Tout sélectionner',
      search: 'Rechercher',
      clearSearch: 'Effacer',
    }
    return (
      <Box layerStyle='submenuconfig_droplist'>
        <MultiSelect
          options={options}
          value={selectedOptions}
          labelledBy={t(labelKey!) || 'Sélection'}
          onChange={handleDropdownChange}
          valueRenderer={valueRenderer}
          overrideStrings={multiSelectStrings}
        />
      </Box>
    )
  }

  const renderFilters = () => {
    if (!isMultiType || !enabledTypes) return null

    return (
      <Box layerStyle='options_3cols'>
        {enabledTypes.includes('node') && (
          <OSTooltip label={t('Menu.filter_nodes') || 'Filtrer les nœuds'}>
            <Button
              variant={activeFilters.has('node') ? 'button_config_element_activated' : 'button_config_element'}
              onClick={() => toggleFilter('node')}
              sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '10px', height: '10px' } }}
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
              sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '10px', height: '10px' } }}
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
              sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '10px', height: '10px' } }}
            >
              {typeIcons.container}
            </Button>
          </OSTooltip>
        )}
      </Box>
    )
  }

  // ==================================================================================
  // MODE SIMPLE
  // ==================================================================================

  if (mode === 'simple') {
    return (
      <Box layerStyle='menuconfigpanel_grid'>
        <Box as='span' layerStyle='menuconfigpanel_row_droplist_simple'>
          {/* Filtres multi-type */}
          {isMultiType && renderFilters()}

          {/* Dropdown */}
          <OSTooltip label={t(isMultiType ? 'Menu.select_elements' : singleConfig!.translationKeys.tooltipSelect)}>
            {renderDropdown()}
          </OSTooltip>

          {/* Bouton visibilité */}
          <OSTooltip label={t(isMultiType ? 'Menu.toggle_visibility' : singleConfig!.translationKeys.tooltipVisibility)}>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={toggleVisibility}
            >
              {only_visible ? icon_element_visible : icon_element_invisible}
            </Button>
          </OSTooltip>
        </Box>
      </Box>
    )
  }

  // ==================================================================================
  // MODE FULL
  // ==================================================================================

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Ligne principale avec actions */}
      <Box as='span' layerStyle='menuconfigpanel_row_droplist'>
        {/* Filtres multi-type */}
        {isMultiType && renderFilters()}

        {/* Bouton Add (single-type seulement) */}
        {isSingleType && singleConfig?.hasCreateButton && (
          <OSTooltip label={t(singleConfig.translationKeys.tooltipAdd!)}>
            <Button
              variant='menuconfigpanel_add_button'
              size='sizeConfigButton'
              onClick={handleCreate}
            >
              {icon_add_element}
            </Button>
          </OSTooltip>
        )}

        {/* Dropdown */}
        <OSTooltip label={t(isMultiType ? 'Menu.select_elements' : singleConfig!.translationKeys.tooltipSelect)}>
          {renderDropdown()}
        </OSTooltip>

        {/* Bouton Delete (single-type seulement) */}
        {isSingleType && singleConfig?.hasDeleteButton && (
          <OSTooltip label={t(singleConfig.translationKeys.tooltipRemove)}>
            <Button
              variant='menuconfigpanel_del_button'
              size='sizeConfigButton'
              isDisabled={singleTypeSelectedElements.length === 0}
              onClick={handleDelete}
            >
              {icon_remove_element}
            </Button>
          </OSTooltip>
        )}

        {/* Bouton visibilité */}
        <OSTooltip label={t(isMultiType ? 'Menu.toggle_visibility' : singleConfig!.translationKeys.tooltipVisibility)}>
          <Button
            variant='menuconfigpanel_option_button'
            size='sizeConfigButton'
            onClick={toggleVisibility}
          >
            {only_visible ? icon_element_visible : icon_element_invisible}
          </Button>
        </OSTooltip>
      </Box>

      {/* Ligne Name Input (single-type seulement) */}
      {isSingleType && singleConfig?.hasNameInput && (
        <Box as='span' layerStyle='menuconfigpanel_row_2cols' gridTemplateColumns='1fr 9fr'>
          <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>
            {t(singleConfig.translationKeys.labelName!)}
          </Box>
          <Box>
            <OSTooltip label={t(singleConfig.translationKeys.tooltipName!)}>
              <ConfigMenuTextInput
                t={t}
                default_value={(singleTypeSelectedElements.length !== 1) ? '' : singleTypeSelectedElements[0].name}
                function_on_blur={handleNameUpdate}
                disabled={singleTypeSelectedElements.length !== 1}
              />
            </OSTooltip>
          </Box>
        </Box>
      )}
    </Box>
  )
}

// ==================================================================================
// EXPORTS DE COMPATIBILITÉ
// ==================================================================================

export const SankeyNodeSelection = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, setUpdate] = useState(0)
  app_data.menu_configuration.ref_to_menu_config_nodes_stock_updater.current = () => setUpdate(a => a + 1)

  const nodes = app_data.drawing_area.selected_nodes_list
  const firstNode = nodes.length > 0 ? nodes[0] : null
  const showStock = app_data.has_sankey_dev && firstNode

  const refreshStock = () => {
    nodes.forEach(n => n.draw())
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    setUpdate(a => a + 1)
  }

  return <>
    <UnifiedElementSelection app_data={app_data} config={NODE_CONFIG} mode="full" />
    {showStock && (() => {
      const sv = firstNode.stock_value
      const data_taggs_list = app_data.drawing_area.sankey.data_taggs_list
      return <>
        <Divider my={2} />
        <Checkbox
          size='sm'
          isChecked={firstNode.has_stock}
          onChange={(e) => {
            nodes.forEach(n => { n.has_stock = e.target.checked; n.draw() })
            refreshStock()
          }}
        >
          <Box as='span' fontSize='xs'>Stock</Box>
        </Checkbox>
        {firstNode.has_stock && <>
          {data_taggs_list.length > 0 &&
            <Box layerStyle='options_2cols'>
              {data_taggs_list.map(data_tagg => {
                const selected = data_tagg.selected_tags_list
                if (selected.length === 0 && data_tagg.tags_list.length > 0) {
                  data_tagg.tags_list[0].setSelected()
                }
                return <React.Fragment key={data_tagg.id}>
                  <Box as='span' fontSize='xs'>{data_tagg.name}</Box>
                  <Select
                    size='xs'
                    variant='menuconfigpanel_option_select'
                    value={selected.length > 0 ? selected[0].id : ''}
                    onChange={(evt) => {
                      data_tagg.selectTagsFromId(evt.target.value)
                      refreshStock()
                    }}
                  >
                    {data_tagg.tags_list.map(tag =>
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    )}
                  </Select>
                </React.Fragment>
              })}
            </Box>
          }
          {(() => {
            const unit_text = firstNode.stock_label_unit_visible ? firstNode.stock_label_unit : undefined
            // Mirror Node.drawStockBox: in reconciled/calculated mode show the
            // result (cumulative for the initial stock) with a fallback to the
            // input; in 'data' mode show the raw input. Editing always writes
            // the input value (stock*Data), so a later reconciliation refreshes
            // the result.
            const use_result = firstNode.drawing_area.type_data !== 'data'
            const stock_initial_shown = use_result
              ? (sv?.stockInitialResult ?? sv?.stockInitialData ?? null)
              : (sv?.stockInitialData ?? null)
            const stock_variation_shown = use_result
              ? (sv?.stockVariationResult ?? sv?.stockVariationData ?? null)
              : (sv?.stockVariationData ?? null)
            return <>
              <Box layerStyle='options_2cols'>
                <Box as='span' fontSize='xs'>Stock initial</Box>
                <ConfigMenuNumberInput
                  t={app_data.t}
                  default_value={stock_initial_shown}
                  function_on_blur={(v) => {
                    nodes.forEach(n => { const s = n.stock_value; if (s) s.stockInitialData = v })
                    refreshStock()
                  }}
                  stepper={true}
                  step={1}
                  unit_text={unit_text}
                />
              </Box>
              <Box layerStyle='options_2cols'>
                <Box as='span' fontSize='xs'>{'\u0394 Stock'}</Box>
                <ConfigMenuNumberInput
                  t={app_data.t}
                  default_value={stock_variation_shown}
                  function_on_blur={(v) => {
                    nodes.forEach(n => { const s = n.stock_value; if (s) s.stockVariationData = v })
                    refreshStock()
                  }}
                  stepper={true}
                  step={1}
                  unit_text={unit_text}
                />
              </Box>
            </>
          })()}
        </>}
        {app_data.has_sankey_afm &&
          <Checkbox
            size='sm'
            isChecked={firstNode.has_material_balance}
            onChange={(e) => {
              nodes.forEach(n => { n.has_material_balance = e.target.checked })
              refreshStock()
            }}
          >
            <OSTooltip label={'Si actif, le bilan mati\u00e8re de ce noeud sera respect\u00e9 lors de la r\u00e9conciliation'}>
              <Box as='span' fontSize='xs'>{'Bilan mati\u00e8re'}</Box>
            </OSTooltip>
          </Checkbox>
        }
      </>
    })()}
  </>
}

export const SankeyNodeSelectionSimple = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <UnifiedElementSelection app_data={app_data} config={NODE_CONFIG} mode="simple" />
)

export const SankeyLinkSelection = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <UnifiedElementSelection app_data={app_data} config={LINK_CONFIG} mode="full" />
)

export const SankeyLinkSelectionSimple = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <UnifiedElementSelection app_data={app_data} config={LINK_CONFIG} mode="simple" />
)

export const SankeyContainerSelection = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <UnifiedElementSelection app_data={app_data} config={CONTAINER_CONFIG} mode="full" />
)

export const SankeyContainerSelectionSimple = ({ app_data }: { app_data: Class_ApplicationData }) => (
  <UnifiedElementSelection app_data={app_data} config={CONTAINER_CONFIG} mode="simple" />
)

export const SankeyMultiTypeSelectionSimple = ({
  app_data,
  enabledTypes = ['node', 'link', 'container'],
  dropdownWidth
}: { app_data: Class_ApplicationData; enabledTypes?: ElementType[]; dropdownWidth?: string }) => (
  <UnifiedElementSelection
    app_data={app_data}
    enabledTypes={enabledTypes}
    mode="simple"
    dropdownWidth={dropdownWidth}
  />
)

// 🎯 NOUVEAU : Multi-type en mode full !
export const SankeyMultiTypeSelectionFull = ({
  app_data,
  enabledTypes = ['node', 'link', 'container'],
  dropdownWidth
}: { app_data: Class_ApplicationData; enabledTypes?: ElementType[]; dropdownWidth?: string }) => (
  <UnifiedElementSelection
    app_data={app_data}
    enabledTypes={enabledTypes}
    mode="full"
    dropdownWidth={dropdownWidth}
  />
)
import React, { useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { Box, Button, Checkbox, Divider, Select } from '@chakra-ui/react'
import { useModelBinding } from '../../hooks/useModelBinding'
import { ConfigMenuTextInput, ConfigMenuNumberInput, OSTooltip } from './MenuCommon'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { Class_StockShape } from '../../Elements/StockShape'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { SELECTION_TOPIC } from '../../types/EventBus'
import { NodeActions } from '../dialogs/NodeActions'

// ==================================================================================
// TYPES & CONFIGURATION
// ==================================================================================

type ElementType = 'node' | 'link' | 'container' | 'stock'

type ElementInstance = Class_NodeElement | Class_LinkElement | Class_ContainerElement | Class_StockShape

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

// Stock visual sub-elements (SA#1229): listed as their own selectable type.
// They live on nodes (node._stock_shape), not in sankey.nodes, so we gather
// them from nodes that carry a stock. No create/delete (tied to has_stock).
const STOCK_CONFIG: ElementConfig<Class_StockShape> = {
  type: 'stock',
  getAllElements: (app_data) => app_data.drawing_area.sankey.nodes_list_sorted
    .filter(n => n.has_stock && n._stock_shape).map(n => n._stock_shape as Class_StockShape),
  getVisibleElements: (app_data) => app_data.drawing_area.sankey.visible_nodes_list_sorted
    .filter(n => n.has_stock && n._stock_shape).map(n => n._stock_shape as Class_StockShape),
  getSelectedElements: (app_data) => app_data.drawing_area.selected_stock_shapes_list,
  getVisibleAndSelectedElements: (app_data) => app_data.drawing_area.selected_stock_shapes_list,

  getUpdateRef: (app_data) => app_data.menu_configuration.ref_to_menu_config_nodes_selection_updater,
  updateRelatedComponents: (app_data) => app_data.menu_configuration.updateAllComponentsRelatedToNodesConfig(),

  translationKeys: {
    labelSelect: 'Noeud.TS',
    labelNoSelection: 'Noeud.NS',
    tooltipSelect: 'Noeud.tooltips.slct',
    tooltipRemove: 'Noeud.tooltips.rm',
    tooltipVisibility: 'Noeud.tooltips.dns'
  }
}

export const ALL_CONFIGS = {
  node: NODE_CONFIG,
  link: LINK_CONFIG,
  container: CONTAINER_CONFIG,
  stock: STOCK_CONFIG
}

// ==================================================================================
// COMPOSANT UNIFIÉ DE SÉLECTION
// ==================================================================================

interface UnifiedSelectionProps {
  app_data: Class_ApplicationData
  // Configuration
  config?: ElementConfig<Class_ContainerElement | Class_NodeElement | Class_LinkElement>  // Pour single-type (jamais un stock)
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
  // #247 — re-render piloté par le modèle : un slot updater par type d'élément géré par ce menu.
  const refreshThis = useModelBinding(
    isMultiType
      ? enabledTypes!.map(type => ALL_CONFIGS[type].getUpdateRef(app_data))
      : (singleConfig ? [singleConfig.getUpdateRef(app_data)] : [])
  )
  const [tag_filter_group_id, set_tag_filter_group_id] = useState('')
  const [tag_filter_tag_id, set_tag_filter_tag_id] = useState('')

  // ✅ Icônes pour chaque type
  const typeIcons = {
    node: icon_node,
    link: icon_flow,
    container: icon_object,
    stock: icon_node
  }

  // ==================================================================================
  // LOGIQUE MULTI-TYPE
  // ==================================================================================

  const getAllFilteredElements = () => {
    if (!isMultiType) return []

    const allElements: { element: ElementInstance; type: ElementType; config: ElementConfig<ElementInstance> }[] = []

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

    const selectedElements: { element: ElementInstance; type: ElementType; config: ElementConfig<ElementInstance> }[] = []

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

  // Tag filter helpers — only for node and link single-type configs
  const tagGroups = (isSingleType && singleConfig && (singleConfig.type === 'node' || singleConfig.type === 'link'))
    ? (singleConfig.type === 'node'
      ? app_data.drawing_area.sankey.node_taggs_list
      : app_data.drawing_area.sankey.flux_taggs_list)
    : []
  const activeTagGroup = tagGroups.find(g => g.id === tag_filter_group_id) ?? null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeTag: any = activeTagGroup?.tags_list.find(t => t.id === tag_filter_tag_id) ?? null

  const singleTypeElements = isSingleType && singleConfig
    ? (only_visible
      ? singleConfig.getVisibleElements(app_data)
      : singleConfig.getAllElements(app_data))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(el => !activeTag || (el as any).hasGivenTag(activeTag))
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
      label: `[${type === 'node' ? 'N' : type === 'link' ? 'F' : type === 'stock' ? 'S' : 'C'}] ${type === 'stock' ? (element as Class_StockShape).host.name : element.name}`,
      value: `${type}:${element.id}`,
      type
    }))
    : singleTypeElements.map((element) => ({
      label: element.name,
      value: element.id
    }))

  const selectedOptions = isMultiType
    ? getAllSelectedElements().map(({ element, type }) => ({
      label: `[${type === 'node' ? 'N' : type === 'link' ? 'F' : type === 'stock' ? 'S' : 'C'}] ${type === 'stock' ? (element as Class_StockShape).host.name : element.name}`,
      value: `${type}:${element.id}`,
      type
    }))
    : singleTypeSelectedElements.map((element) => ({
      label: element.name,
      value: element.id
    }))

  // ==================================================================================
  // FONCTIONS UTILITAIRES
  // ==================================================================================

  const refreshAndToggleSaving = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    refreshThis()
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

  // Le filtre par tag n'existe que pour les nœuds et les flux en single-type,
  // et seulement s'il y a des groupes : les colonnes de la ligne compacte
  // dépendent donc de ce booléen.
  const has_tag_filter = isSingleType && !!singleConfig &&
    (singleConfig.type === 'node' || singleConfig.type === 'link') &&
    tagGroups.length > 0

  // Les deux selects seuls (sans ligne porteuse) : le mode compact les pose sur
  // la ligne du sélecteur, le mode full leur garde une ligne à eux.
  const renderTagSelects = () => {
    return (
      <>
        <Select
          size='xs'
          variant='menuconfigpanel_option_select'
          value={tag_filter_group_id}
          onChange={(e) => {
            set_tag_filter_group_id(e.target.value)
            set_tag_filter_tag_id('')
          }}
        >
          <option value=''>—</option>
          {tagGroups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Select
          size='xs'
          variant='menuconfigpanel_option_select'
          value={tag_filter_tag_id}
          isDisabled={!activeTagGroup}
          onChange={(e) => set_tag_filter_tag_id(e.target.value)}
        >
          <option value=''>—</option>
          {(activeTagGroup?.tags_list ?? []).map(tag => (
            <option key={tag.id} value={tag.id}>{tag.display_name}</option>
          ))}
        </Select>
      </>
    )
  }

  const renderTagFilter = () => {
    if (!has_tag_filter) return null
    return (
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        {renderTagSelects()}
      </Box>
    )
  }

  const renderDropdown = () => {
    const labelKey = isMultiType
      ? 'Menu.selection'
      : singleConfig?.translationKeys.labelSelect

    const valueRenderer = isMultiType
      ? (selected: MultiTypeOption[]) => {
        if (!selected.length) return t('Noeud.NS') || 'Aucune sélection'

        const counts: Record<ElementType, number> = { node: 0, link: 0, container: 0, stock: 0 }
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
              sx={{ '& svg': { width: '10px', height: '10px' } }}
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
              sx={{ '& svg': { width: '10px', height: '10px' } }}
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
              sx={{ '& svg': { width: '10px', height: '10px' } }}
            >
              {typeIcons.container}
            </Button>
          </OSTooltip>
        )}

        {enabledTypes.includes('stock') && (
          <OSTooltip label={'Filtrer les stocks'}>
            <Button
              variant={activeFilters.has('stock') ? 'button_config_element_activated' : 'button_config_element'}
              onClick={() => toggleFilter('stock')}
              sx={{ '& svg': { width: '10px', height: '10px' } }}
            >
              {typeIcons.stock}
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
    // Colonnes calculées : une cellule absente ne doit décaler personne. Le
    // sélecteur prend l'essentiel ; l'œil est un bouton étroit dimensionné par
    // son icône. Sa liste s'ouvre sur toute la largeur de la ligne (cf.
    // layerStyle), donc le comprimer à la fermeture ne coûte rien.
    const columns = [
      isMultiType ? 'auto' : null,
      'minmax(0, 3fr)',
      ...(has_tag_filter ? ['minmax(0, 2fr)', 'minmax(0, 2fr)'] : []),
      'auto'
    ].filter(Boolean).join(' ')
    return (
      <Box layerStyle='menuconfigpanel_grid'>
        <Box as='span' layerStyle='menuconfigpanel_row_droplist_inline' gridTemplateColumns={columns}>
          {/* Filtres multi-type */}
          {isMultiType && renderFilters()}

          {/* Dropdown */}
          <OSTooltip label={t(isMultiType ? 'Menu.select_elements' : singleConfig!.translationKeys.tooltipSelect)}>
            {renderDropdown()}
          </OSTooltip>

          {/* Filtre par tag — sur la MÊME ligne que le sélecteur : les trois
              contrôles composent un seul critère de sélection. */}
          {has_tag_filter && renderTagSelects()}

          {/* Bouton visibilité */}
          <OSTooltip label={t(isMultiType ? 'Menu.toggle_visibility' : singleConfig!.translationKeys.tooltipVisibility)}>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={toggleVisibility}
              sx={{ minWidth: 'auto', width: 'auto', paddingInline: '0.3rem' }}
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

      {renderTagFilter()}

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

// #1243 — Ligne « Nom » autonome (avec undo), pour les sections d'inspecteur où
// le sélecteur unifié est porté par le panneau (hide_selector) mais où le
// renommage de l'élément sélectionné doit rester accessible.
export const ElementNameRow = ({ app_data, elements, labelKey, tooltipKey }: {
  app_data: Class_ApplicationData
  elements: (Class_NodeBase | Class_ContainerElement)[]
  labelKey: string
  tooltipKey: string
}) => {
  const { t, history, menu_configuration } = app_data
  const handleNameUpdate = (newName: string | null | undefined) => {
    if (!newName || elements.length !== 1) return
    const el = elements[0]
    const oldName = el.name
    const execute = () => {
      el.name = newName
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.updateAllComponentsRelatedToNodesConfig()
    }
    const undo = () => {
      el.name = oldName
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.updateAllComponentsRelatedToNodesConfig()
    }
    history.saveUndo(undo)
    history.saveRedo(execute)
    execute()
  }
  return (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' gridTemplateColumns='1fr 9fr'>
      <Box layerStyle='menuconfigpanel_option_name' textStyle='h3'>
        {t(labelKey)}
      </Box>
      <Box>
        <OSTooltip label={t(tooltipKey)}>
          <ConfigMenuTextInput
            t={t}
            default_value={(elements.length !== 1) ? '' : elements[0].name}
            function_on_blur={handleNameUpdate}
            disabled={elements.length !== 1}
          />
        </OSTooltip>
      </Box>
    </Box>
  )
}

// #1274 lot E2 — Section « Disposition » : aligner / répartir / caler la taille
// des éléments sélectionnés depuis l'inspecteur (les mêmes commandes existent au
// clic droit). Chaque commande instancie un NodeActions frais pour capturer la
// sélection courante ; la logique géométrique + l'undo vivent dans NodeActions.
const NodeDispositionSection = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const da = app_data.drawing_area
  const count = da.selected_nodes_list.length + da.selected_containers_list.length
  // Aligner/répartir opèrent sur nœuds + zones de texte ; il faut au moins 2 éléments.
  if (count < 2) return <></>

  const run = (fn: (na: NodeActions) => void) => () => fn(new NodeActions(app_data))
  const canDistribute = count > 2
  const canMatchSize = da.selected_nodes_list.length > 1

  const btn = (label: string, tooltip: string, onClick: () => void, isDisabled = false) => (
    <OSTooltip label={tooltip}>
      <Button
        size='xs'
        variant='menuconfigpanel_option_button'
        minW='2.2rem'
        fontSize='sm'
        isDisabled={isDisabled}
        onClick={onClick}
      >{label}</Button>
    </OSTooltip>
  )

  return <>
    <Divider my={2} />
    <Box fontSize='xs' fontWeight='semibold' mb={1}>Disposition</Box>
    <Box display='flex' flexWrap='wrap' gap='0.25rem' mb={1}>
      {btn('←▌□', 'Aligner les bords gauches', run(na => na.alignHorizMinLeft()))}
      {btn('←▐□▌', 'Aligner les centres horizontalement', run(na => na.alignHorizMinCenter()))}
      {btn('□▐→', 'Aligner les bords droits', run(na => na.alignHorizMaxRight()))}
      {btn('↑▀', 'Aligner les bords hauts', run(na => na.alignVertMinTop()))}
      {btn('↑▄▀', 'Aligner les centres verticalement', run(na => na.alignVertMinCenter()))}
      {btn('▄↓', 'Aligner les bords bas', run(na => na.alignVertMaxBottom()))}
    </Box>
    <Box display='flex' flexWrap='wrap' gap='0.25rem'>
      {btn('↔', 'Répartir à distance égale (horizontal)', run(na => na.distributeHorizontal()), !canDistribute)}
      {btn('↕', 'Répartir à distance égale (vertical)', run(na => na.distributeVertical()), !canDistribute)}
      {btn('⇱⇲', 'Caler la taille sur le premier nœud sélectionné', run(na => na.matchSizeToRef()), !canMatchSize)}
    </Box>
  </>
}

export const SankeyNodeSelection = ({ app_data, hide_selector = false, stock_only = false }: {
  app_data: Class_ApplicationData
  // #1243 — inspecteur : le sélecteur unifié est rendu une seule fois en tête de
  // panneau ; la section ne garde que le nom et les extras (stock).
  hide_selector?: boolean
  // #1243 — onglet Stock de l'inspecteur : seulement les DONNÉES de stock
  // (le nom vit dans l'en-tête d'identité, le sélecteur n'existe plus).
  stock_only?: boolean
}) => {
  // #247 — re-render piloté par le modèle (lie le slot updater + cleanup au démontage).
  const refreshThis = useModelBinding(app_data.menu_configuration.ref_to_menu_config_nodes_stock_updater)

  const nodes = app_data.drawing_area.selected_nodes_list
  const firstNode = nodes.length > 0 ? nodes[0] : null
  const showStock = app_data.has_sankey_dev && firstNode

  const refreshStock = () => {
    nodes.forEach(n => n.draw())
    app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    refreshThis()
  }

  return <>
    {stock_only
      ? <></>
      : hide_selector
        ? <ElementNameRow
          app_data={app_data}
          elements={nodes}
          labelKey='Noeud.Nom'
          tooltipKey='Noeud.tooltips.Nom'
        />
        : <UnifiedElementSelection app_data={app_data} config={NODE_CONFIG} mode="full" />}
    {/* #1274 lot E2 — commandes d'alignement / distribution / taille (masquées
        dans l'onglet Stock de l'inspecteur, qui ne montre que les données). */}
    {!stock_only && <NodeDispositionSection app_data={app_data} />}
    {showStock && (() => {
      const sv = firstNode.stock_value
      const data_taggs_list = app_data.drawing_area.sankey.data_taggs_list
      return <>
        {!stock_only && <Divider my={2} />}
        {/* #1243 — dans l'inspecteur (stock_only), l'activation du stock vit
            dans l'EN-TÊTE de l'onglet (œil « Activé »), pas ici. */}
        {!stock_only && <Checkbox
          size='sm'
          isChecked={firstNode.has_stock}
          onChange={(e) => {
            nodes.forEach(n => { n.has_stock = e.target.checked; n.draw() })
            refreshStock()
          }}
        >
          <Box as='span' fontSize='xs'>Stock</Box>
        </Checkbox>}
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
                      <option key={tag.id} value={tag.id}>{tag.display_name}</option>
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
                    // Mirror Link.valueCurrent setter: write data AND clear the
                    // result, so in reconciled/calculated mode the displayed
                    // value (and the stock shape height) updates immediately;
                    // a later reconciliation recomputes the result.
                    // L'undo restaure les DEUX (donnée + résultat effacé).
                    const before = nodes.map(n => {
                      const s = n.stock_value
                      return { n, data: s?.stockInitialData ?? null, result: s?.stockInitialResult ?? null }
                    })
                    const apply = () => {
                      nodes.forEach(n => { const s = n.stock_value; if (s) { s.stockInitialData = v; s.stockInitialResult = null } })
                      refreshStock()
                    }
                    const undo = () => {
                      before.forEach(({ n, data, result }) => {
                        const s = n.stock_value; if (s) { s.stockInitialData = data; s.stockInitialResult = result }
                      })
                      refreshStock()
                    }
                    app_data.history.saveUndo(undo)
                    app_data.history.saveRedo(apply)
                    apply()
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
                    // Idem stock initial : donnée + résultat restaurés.
                    const before = nodes.map(n => {
                      const s = n.stock_value
                      return { n, data: s?.stockVariationData ?? null, result: s?.stockVariationResult ?? null }
                    })
                    const apply = () => {
                      nodes.forEach(n => { const s = n.stock_value; if (s) { s.stockVariationData = v; s.stockVariationResult = null } })
                      refreshStock()
                    }
                    const undo = () => {
                      before.forEach(({ n, data, result }) => {
                        const s = n.stock_value; if (s) { s.stockVariationData = data; s.stockVariationResult = result }
                      })
                      refreshStock()
                    }
                    app_data.history.saveUndo(undo)
                    app_data.history.saveRedo(apply)
                    apply()
                  }}
                  stepper={true}
                  step={1}
                  unit_text={unit_text}
                />
              </Box>
              <Checkbox
                size='sm'
                isChecked={firstNode.use_stock_for_height}
                onChange={(e) => {
                  nodes.forEach(n => { n.use_stock_for_height = e.target.checked })
                  refreshStock()
                }}
              >
                <OSTooltip label={'Si actif, la hauteur du rectangle du n\u0153ud encode son niveau de stock au lieu de l\u2019\u00e9paisseur des flux'}>
                  <Box as='span' fontSize='xs'>{'Hauteur selon le stock'}</Box>
                </OSTooltip>
              </Checkbox>
              {firstNode.use_stock_for_height &&
                <Box layerStyle='options_2cols'>
                  <OSTooltip label={'Facteur d\u2019\u00e9chelle local appliqu\u00e9 \u00e0 la hauteur du stock (comme pour les flux) : plus il est grand, plus le n\u0153ud est court'}>
                    <Box as='span' fontSize='xs'>{'Facteur d\u2019\u00e9chelle'}</Box>
                  </OSTooltip>
                  <ConfigMenuNumberInput
                    t={app_data.t}
                    default_value={firstNode.stock_height_scale_factor}
                    function_on_blur={(v) => {
                      nodes.forEach(n => { n.stock_height_scale_factor = (v && v > 0) ? v : 1 })
                      refreshStock()
                    }}
                    stepper={true}
                    step={1}
                    minimum_value={0}
                  />
                </Box>
              }
            </>
          })()}
        </>}
        {/* #1243 \u2014 le bilan mati\u00e8re est une propri\u00e9t\u00e9 du N\u0152UD (r\u00e9conciliation),
            pas du stock : dans l'inspecteur (stock_only) il vit dans l'onglet
            Valeur ; on ne le garde ici que pour le panneau historique. */}
        {!stock_only && <NodeMaterialBalanceCheckbox app_data={app_data} />}
      </>
    })()}
  </>
}

// #1243 \u2014 Bilan mati\u00e8re : contrainte de r\u00e9conciliation port\u00e9e par le N\u0152UD
// (pas par le stock). Rendue par l'onglet Valeur de l'inspecteur et par le
// panneau historique. Se masque seule sans licence AFM ou sans n\u0153ud.
export const NodeMaterialBalanceCheckbox = ({ app_data }: { app_data: Class_ApplicationData }) => {
  // Re-render local (pas de slot d\u00e9di\u00e9 : le slot stock est tenu par SankeyNodeSelection).
  const refreshThis = useModelBinding()
  const nodes = app_data.drawing_area.selected_nodes_list
  const firstNode = nodes[0]
  if (!app_data.has_sankey_afm || !firstNode) return <></>
  return (
    <Checkbox
      size='sm'
      isChecked={firstNode.has_material_balance}
      onChange={(e) => {
        nodes.forEach(n => { n.has_material_balance = e.target.checked })
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
        refreshThis()
      }}
    >
      <OSTooltip label={'Si actif, le bilan mati\u00e8re de ce noeud sera respect\u00e9 lors de la r\u00e9conciliation'}>
        <Box as='span' fontSize='xs'>{'Bilan mati\u00e8re'}</Box>
      </OSTooltip>
    </Checkbox>
  )
}

// OS#1272 \u2014 Marqueur VISUEL d'avertissement de bilan (\u03a3 flux entrants \u2260 sortants).
// Distinct de la contrainte AFM ci-dessus : simple contr\u00f4le d'affichage. R\u00e9glage
// global (activation + strat\u00e9gie/tol\u00e9rance) port\u00e9 par la zone de dessin, plus un
// override par n\u0153ud pour la ou les s\u00e9lection(s).
export const NodeBalanceMarkerConfig = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const refresh = useModelBinding()
  const da = app_data.drawing_area
  const nodes = da.selected_nodes_list
  const firstNode = nodes[0]
  if (!firstNode) return <></>
  const markDirty = () => app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
  return (
    <Box>
      <Checkbox
        size='sm'
        isChecked={da.balance_marker_enabled}
        onChange={(e) => { da.balance_marker_enabled = e.target.checked; markDirty(); refresh() }}
      >
        <OSTooltip label={'Affiche un marqueur \u26a0 sur les n\u0153uds dont la somme des flux entrants diff\u00e8re de celle des sortants (contr\u00f4le visuel, distinct de la r\u00e9conciliation AFM).'}>
          <Box as='span' fontSize='xs'>{'Marqueur de bilan (global)'}</Box>
        </OSTooltip>
      </Checkbox>
      {da.balance_marker_enabled && (
        <Box layerStyle='options_2cols'>
          <Box as='span' fontSize='xs'>{'Strat\u00e9gie'}</Box>
          <Select
            size='xs'
            variant='menuconfigpanel_option_select'
            value={da.balance_marker_strategy}
            onChange={(e) => { da.balance_marker_strategy = e.target.value as 'exact' | 'absolute' | 'relative'; markDirty(); refresh() }}
          >
            <option value='exact'>{'Exact'}</option>
            <option value='absolute'>{'Tol\u00e9rance absolue'}</option>
            <option value='relative'>{'Tol\u00e9rance relative (%)'}</option>
          </Select>
          {da.balance_marker_strategy !== 'exact' && (
            <>
              <Box as='span' fontSize='xs'>{da.balance_marker_strategy === 'relative' ? 'Tol\u00e9rance (%)' : 'Tol\u00e9rance'}</Box>
              <ConfigMenuNumberInput
                t={app_data.t}
                default_value={da.balance_marker_tolerance}
                minimum_value={0}
                function_on_blur={(v) => { da.balance_marker_tolerance = v ?? 0; markDirty(); refresh() }}
              />
            </>
          )}
        </Box>
      )}
      <Box layerStyle='options_2cols'>
        <Box as='span' fontSize='xs'>{'Ce(s) n\u0153ud(s)'}</Box>
        <Select
          size='xs'
          variant='menuconfigpanel_option_select'
          value={firstNode.balance_marker_mode}
          onChange={(e) => {
            const m = e.target.value as 'inherit' | 'on' | 'off'
            nodes.forEach(n => { n.balance_marker_mode = m })
            markDirty()
            da.drawElements()
            refresh()
          }}
        >
          <option value='inherit'>{'Suivre le r\u00e9glage global'}</option>
          <option value='on'>{'Toujours afficher'}</option>
          <option value='off'>{'Ne jamais afficher'}</option>
        </Select>
      </Box>
    </Box>
  )
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

export const SankeyContainerSelection = ({ app_data, hide_selector = false }: {
  app_data: Class_ApplicationData
  // #1243 — inspecteur : sélecteur porté par le panneau, la section garde le nom.
  hide_selector?: boolean
}) => (
  hide_selector
    ? <ElementNameRow
      app_data={app_data}
      elements={app_data.drawing_area.selected_containers_list}
      labelKey='Container.Nom'
      tooltipKey='Container.tooltips.Nom'
    />
    : <UnifiedElementSelection app_data={app_data} config={CONTAINER_CONFIG} mode="full" />
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

// #1243 — OUTIL de sélection par critères (panneau Filtres, onglet
// « Sélectionner »). L'inspecteur n'a plus de sélecteur (le canvas est le
// sélecteur), mais sélectionner 50 nœuds à la main pour une opération groupée
// n'est pas praticable : cet outil sélectionne par TYPE + TAG + liste
// (recherche), et l'inspecteur édite ensuite la sélection obtenue.
// Mode 'simple' volontaire : c'est un outil de sélection, pas de création
// (créer reste un geste de canvas).
export const ElementSelectionTool = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t, drawing_area } = app_data
  const [type, setType] = useState<'node' | 'link' | 'container'>('node')
  // Récapitulatif de la sélection TOTALE (tous types) : abonnement au topic
  // pub/sub (multi-abonnés) — l'inspecteur garde son slot ref dédié, et le
  // sélecteur unifié enfant garde le slot du type courant. Pas de vol de slot.
  useModelBinding(undefined, (r) =>
    app_data.menu_configuration.subscribe(SELECTION_TOPIC, r))

  const types: { key: 'node' | 'link' | 'container', label: string }[] = [
    { key: 'node', label: t('Menu.Config.element_node') },
    { key: 'link', label: t('Menu.Config.element_flow') },
    { key: 'container', label: t('Menu.Config.element_object0') }
  ]
  const counts = {
    node: drawing_area.selected_nodes_list.length,
    link: drawing_area.selected_links_list.length,
    container: drawing_area.selected_containers_list.length
  }
  const total = counts.node + counts.link + counts.container
  const summary = [
    counts.node ? `${counts.node} ${t('Menu.Config.element_node')}` : null,
    counts.link ? `${counts.link} ${t('Menu.Config.element_flow')}` : null,
    counts.container ? `${counts.container} ${t('Menu.Config.element_object0')}` : null
  ].filter(Boolean).join(' + ')

  return <Box layerStyle='menuconfigpanel_grid'>
    {/* Type = dans QUEL type on pioche. La sélection est CUMULATIVE : changer
        de type n'efface pas les autres, on compose donc une sélection
        HÉTÉROGÈNE (nœuds + flux) pour éditer leurs attributs communs.
        Single-type volontaire : le sélecteur unifié n'expose le filtre par
        groupe de tags que dans ce mode — c'est le critère clé. */}
    <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.15rem' }}>
      {types.map(({ key, label }) => (
        <Button
          key={key}
          size='xs'
          variant={type === key
            ? 'menuconfigpanel_option_button_activated'
            : 'menuconfigpanel_option_button'}
          sx={{ paddingInline: '0.25rem', minWidth: 'auto' }}
          onClick={() => setType(key)}
        >
          {label}
        </Button>
      ))}
    </Box>
    <UnifiedElementSelection
      app_data={app_data}
      config={ALL_CONFIGS[type] as ElementConfig<Class_NodeElement | Class_LinkElement | Class_ContainerElement>}
      mode='simple'
    />
    {/* Récapitulatif : rend VISIBLE le cumul entre types (sinon on croit que
        changer de type remet à zéro) + désélection globale. */}
    <Box style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      fontSize: '0.7rem', paddingTop: '0.2rem'
    }}>
      <Box as='span' style={{ opacity: 0.75 }}>
        {total > 0 ? t('filter_panel.selection_summary', { summary }) : t('Noeud.NS')}
      </Box>
      <Button
        size='xs'
        variant='menuconfigpanel_option_button'
        sx={{ paddingInline: '0.4rem', minWidth: 'auto', width: 'auto', flex: 'none', marginLeft: 'auto' }}
        isDisabled={total === 0}
        onClick={() => {
          drawing_area.purgeSelection()
          app_data.menu_configuration.updateAllComponentsRelatedToNodes()
          app_data.menu_configuration.updateAllComponentsRelatedToLinks()
          app_data.menu_configuration.updateAllComponentsRelatedToContainers()
        }}
      >
        {t('filter_panel.deselect_all')}
      </Button>
    </Box>
  </Box>
}

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
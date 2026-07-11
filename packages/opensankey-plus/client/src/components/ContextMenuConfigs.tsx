// ==================================================================================================
// MenuConfigExtensions.tsx - Extension propre des configurations de menu ( Version)
// ==================================================================================================

import { LINK_MENU_CONFIG } from '@terriflux/opensankey/src/components/dialogs/ContextLinkConfig'
import { NODE_MENU_CONFIG, STATIC_NODE_MENU_CONFIG } from '@terriflux/opensankey/src/components/dialogs/ContextNodeConfig'
import { createZDDModifier, ZDD_MENU_CONFIG } from '@terriflux/opensankey/src/components/dialogs/ContextZDDConfig'
import { createNodeModifier } from '@terriflux/opensankey/src/components/dialogs/NodeActions'
import { CONVERTER_CONFIGS } from '@terriflux/opensankey/src/components/dialogs/PersistenceProcessDialogConfigs'
import { MenuConfig } from '@terriflux/opensankey/src/components/dialogs/SankeyMenuContext'
import { Class_NodeElement } from '@terriflux/opensankey/src/Elements/Node'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

// Extension de la config ZDD
export const createZDDMenuConfigPlus = (): MenuConfig => {
  return {
    ...ZDD_MENU_CONFIG,
    structure: [
      ...ZDD_MENU_CONFIG.structure,
      {
        type: 'button',
        actionName: 'afmReconciliation',
        visibilityConditions: [{
          type: 'custom',
          customCheck: (app_data) => {
            return (app_data as Class_ApplicationDataOSP).has_sankey_afm
          }
        }]
      },
      {
        type: 'button',
        actionName: 'afmCompleteOnly',
        visibilityConditions: [{
          type: 'custom',
          customCheck: (app_data) => {
            return (app_data as Class_ApplicationDataOSP).has_sankey_afm
          }
        }]
      }
    ],
    actions: {
      ...ZDD_MENU_CONFIG.actions,
      afmReconciliation: {
        type: 'action',
        labels: {
          en: 'Reconciling actual sankey diagram',
          fr: 'Ajuster et compléter le diagramme',
          es: 'Reconciliar el diagrama Sankey actual',
          de: 'Aktuelles Sankey-Diagramm abgleichen',
          it: 'Riconciliare il diagramma Sankey attuale'
        },
        tooltips: {
          en: 'Reconciling actual sankey diagram',
          fr: 'Ajuster et compléter le diagramme',
          es: 'Reconciliar el diagrama Sankey actual',
          de: 'Aktuelles Sankey-Diagramm abgleichen',
          it: 'Riconciliare il diagramma Sankey attuale'
        }
      },
      afmCompleteOnly: {
        type: 'action',
        labels: {
          en: 'Complete the diagram (no redundancy)',
          fr: 'Compléter le diagramme',
          es: 'Completar el diagrama (sin redundancia)',
          de: 'Diagramm vervollständigen (ohne Redundanz)',
          it: 'Completare il diagramma (senza ridondanza)'
        },
        tooltips: {
          en: 'Run reconciliation in no-redundancy mode: redundant balance constraints are dropped so measured values are kept as-is and only unknown flows are filled in',
          fr: 'Lance la réconciliation en mode sans redondance : les bilans en trop sont retirés, les valeurs mesurées sont conservées telles quelles et seuls les flux inconnus sont complétés',
          es: 'Ejecuta la reconciliación en modo sin redundancia',
          de: 'Abgleich im Modus ohne Redundanz ausführen',
          it: 'Esegue la riconciliazione in modalità senza ridondanza'
        }
      }
    }
  }
}

// Extension de la config Link
export const createLinkMenuConfigPlus = (): MenuConfig => {
  return {
    ...LINK_MENU_CONFIG,
    structure: [
      ...LINK_MENU_CONFIG.structure,
      {
        type: 'widget',
        widgetName: 'ButtonLinkContextAssignTag',
        widgetProps: {}
      }
    ],
    actions: {
      ...LINK_MENU_CONFIG.actions
    }
  }
}

const new_structure = [...NODE_MENU_CONFIG.structure]
const edit_style_submenu = new_structure.find(item => item.type === 'submenu' && item.titleKey === 'editStyle')!
edit_style_submenu.children!.push({
  type: 'widget',
  widgetName: 'ButtonNodeContextAssignTag', // Réutiliser le même widget
  widgetProps: {
    context: 'node' // Pour différencier le contexte si nécessaire
  },
  visibilityConditions: [{
    type: 'custom',
    customCheck: (app_data) => {
      return Object.values(app_data.drawing_area.sankey.node_taggs_dict).length > 0
    }
  }]
})
new_structure[0].children!.push({
  type: 'button',
  actionName: 'generateLabelFromChildren',
  visibilityConditions: [
    { type: 'nodeCount', operator: '==', value: 1 },
    { type: 'nodeProperty', property: 'is_parent', operator: '==', value: true }
  ]
})
const new_static_structure = [...STATIC_NODE_MENU_CONFIG.structure]

export const createNodeMenuConfigPlus = (): MenuConfig => {
  return {
    ...NODE_MENU_CONFIG,
    structure: new_structure,
    actions: {
      ...NODE_MENU_CONFIG.actions,
      createUnitarySankey: {
        type: 'action',
        labels: {
          en: 'Creates unitary sankey',
          fr: 'Créer sankey unitaire',
          es: 'Crear Sankey unitario',
          de: 'Einheitliches Sankey erstellen',
          it: 'Creare Sankey unitario'
        },
        tooltips: {
          en: 'Creates unitary sankey',
          fr: 'Créer sankey unitaire',
          es: 'Crear Sankey unitario',
          de: 'Einheitliches Sankey erstellen',
          it: 'Creare Sankey unitario'
        }
      },
      generateLabelFromChildren: {
        type: 'action',
        labels: {
          en: 'Set label from children',
          fr: 'Générer le label depuis les enfants',
          es: 'Generar etiqueta desde los hijos',
          de: 'Label aus Kindern generieren',
          it: 'Genera etichetta dai figli'
        },
        tooltips: {
          en: 'Replace the node label with the comma-separated list of its children',
          fr: 'Remplace le label du nœud par la liste de ses enfants, séparés par des virgules',
          es: 'Reemplaza la etiqueta del nodo por la lista de sus hijos, separados por comas',
          de: 'Ersetzt das Node-Label durch die kommagetrennte Liste der Kinder',
          it: 'Sostituisce l\'etichetta del nodo con l\'elenco dei figli separati da virgole'
        }
      }
    },
    sectionTitles: {
      ...NODE_MENU_CONFIG.sectionTitles,
      createUnitarySankey: { fr: 'Créer sankey unitaire', en: 'Creates unitary sankey', es: 'Crear Sankey unitario', de: 'Einheitliches Sankey erstellen', it: 'Creare Sankey unitario' }
    }
  }
}
export const createStaticNodeMenuConfigPlus = (): MenuConfig => {
  return {
    ...STATIC_NODE_MENU_CONFIG,
    structure: new_static_structure,
    actions: {
      ...STATIC_NODE_MENU_CONFIG.actions,
      createUnitarySankey: {
        type: 'action',
        labels: {
          en: 'Creates unitary sankey',
          fr: 'Créer sankey unitaire',
          es: 'Crear Sankey unitario',
          de: 'Einheitliches Sankey erstellen',
          it: 'Creare Sankey unitario'
        },
        tooltips: {
          en: 'Creates unitary sankey',
          fr: 'Créer sankey unitaire',
          es: 'Crear Sankey unitario',
          de: 'Einheitliches Sankey erstellen',
          it: 'Creare Sankey unitario'
        }
      }
    },
    sectionTitles: {
      ...STATIC_NODE_MENU_CONFIG.sectionTitles,
      createUnitarySankey: { fr: 'Créer sankey unitaire', en: 'Creates unitary sankey', es: 'Crear Sankey unitario', de: 'Einheitliches Sankey erstellen', it: 'Creare Sankey unitario' }
    }
  }
}

// ==================================================================================================
// Extended Modifier Creators
// ==================================================================================================

export const createZDDModifierPlus = (app_data: Class_ApplicationDataOSP) => {
  const { menu_configuration_osp } = app_data
  const { dict_setter_show_dialog } = menu_configuration_osp
  const baseModifiers = createZDDModifier(app_data)

  return {
    ...baseModifiers,
    afmReconciliation: () => {
      app_data.menu_configuration.ref_universal_converter_set_config.current(
        CONVERTER_CONFIGS['reconciliation_sankey'], '', true
      )
      dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
      app_data.drawing_area.is_drawing_area_contextualised = false
      app_data.menu_configuration_osp.ref_to_menu_context_drawing_area_updater.current()
    },
    afmCompleteOnly: () => {
      // "Compléter le diagramme" — single-pass no-redundancy mode: measured
      // values are preserved as-is and only unknown flows are filled in. The
      // reconciliation pass is skipped so no measure is adjusted.
      app_data.menu_configuration.ref_universal_converter_set_config.current(
        CONVERTER_CONFIGS['reconciliation_sankey'], '', true,
        { with_reconciled: false, with_completed: true }
      )
      dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
      app_data.drawing_area.is_drawing_area_contextualised = false
      app_data.menu_configuration_osp.ref_to_menu_context_drawing_area_updater.current()
    },
  }
}

export const createNodeModifierPlus = (app_data: Class_ApplicationDataOSP) => {
  const baseModifiers = createNodeModifier(app_data)

  return {
    ...baseModifiers,
    createUnitarySankey: () => {
      // Le sankey unitaire n'est plus généré comme une vue (qui échangeait la
      // zone de dessin principale) mais comme un second diagramme rendu dans un
      // panneau draggable, en plus du diagramme principal (cf. ModalUnitarySankeyOSP).
      if (app_data.drawing_area.node_contextualised) {
        app_data.menu_configuration_osp.ref_open_unitary_sankey_modal.current(
          app_data.drawing_area.node_contextualised
        )
      }
    },
    generateLabelFromChildren: () => {
      const node = app_data.drawing_area.node_contextualised
      if (!node || !node.is_parent) return

      const seen = new Set<string>()
      const ordered_children: Class_NodeElement[] = []
      node.dimensions_as_parent.forEach(dim => {
        dim.children.forEach(c => {
          if (!seen.has(c.id)) {
            seen.add(c.id)
            ordered_children.push(c)
          }
        })
      })
      if (ordered_children.length === 0) return

      const new_label = ordered_children.map(c => c.name).join(', ')
      const old_name = node.name

      const refresh = () => {
        app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
        app_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
      }
      const doAction = () => {
        node.name = new_label
        refresh()
      }
      const undoAction = () => {
        node.name = old_name
        refresh()
      }
      app_data.history.saveUndo(undoAction)
      app_data.history.saveRedo(doAction)
      doAction()
    }
  }
}
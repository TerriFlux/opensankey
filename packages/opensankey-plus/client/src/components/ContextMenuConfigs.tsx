// ==================================================================================================
// MenuConfigExtensions.tsx - Extension propre des configurations de menu ( Version)
// ==================================================================================================

import { LINK_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextLinkConfig"
import { NODE_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextNodeConfig"
import { createZDDModifier, ZDD_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextZDDConfig"
import { createNodeModifier } from "../deps/OpenSankey/components/dialogs/NodeActions"
import { MenuConfig } from "../deps/OpenSankey/components/dialogs/SankeyMenuContext"
import { Class_ApplicationDataOSP } from "../types/ApplicationDataOSP"

// Extension de la config ZDD
export const createZDDMenuConfigPlus = (): MenuConfig => {
  return {
    ...ZDD_MENU_CONFIG,
    structure: [
      ...ZDD_MENU_CONFIG.structure,
      {
        type: 'button',
        actionName: 'afmReconciliation'
      }
    ],
    actions: {
      ...ZDD_MENU_CONFIG.actions,
      afmReconciliation: {
        type: 'action',
        labels: {
          en: 'Reconciling actual sankey diagram',
          fr: 'Ajuster et compléter le diagramme'
        },
        tooltips: {
          en: 'Reconciling actual sankey diagram',
          fr: 'Ajuster et compléter le diagramme'
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
new_structure[0].children!.push({
  type: 'widget',
  widgetName: 'ButtonNodeContextAssignTag', // Réutiliser le même widget
  widgetProps: {
    context: 'node' // Pour différencier le contexte si nécessaire
  }
})
new_structure[5].children!.push({
  type: 'button',
  actionName: 'createUnitarySankey'
})

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
          fr: 'Créer sankey unitaire'
        },
        tooltips: {
          en: 'Creates unitary sankey',
          fr: 'Créer sankey unitaire'
        }
      }
    },
    sectionTitles: {
      ...NODE_MENU_CONFIG.sectionTitles,
      createUnitarySankey: { fr: "Créer sankey unitaire", en: "Creates unitary sankey" }
    }
  }
}

// ==================================================================================================
// Extended Modifier Creators
// ==================================================================================================

export const createZDDModifierPlus = (app_data: Class_ApplicationDataOSP) => {
  const { menu_configuration_osp } = app_data
  const { dict_setter_show_dialog_afm } = menu_configuration_osp
  const baseModifiers = createZDDModifier(app_data)

  return {
    ...baseModifiers,
    afmReconciliation: () => {
      app_data.menu_configuration_osp.action_type = 'optim_sankey'
      dict_setter_show_dialog_afm.ref_setter_show_reconciliation.current(true)
      app_data.drawing_area.is_drawing_area_contextualised = false
      app_data.menu_configuration_osp.ref_to_menu_context_drawing_area_updater.current()
    }
  }
}

export const createNodeModifierPlus = (app_data: Class_ApplicationDataOSP) => {
  const { menu_configuration_osp } = app_data
  const baseModifiers = createNodeModifier(app_data)

  return {
    ...baseModifiers,
    createUnitarySankey: () => {
      if (app_data.drawing_area.node_contextualised)
        app_data.createUnitaryNewView(app_data.drawing_area.node_contextualised)
    }
  }
}
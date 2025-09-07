// ==================================================================================================
// MenuConfigExtensions.tsx - Extension propre des configurations de menu ( Version)
// ==================================================================================================

import { LINK_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextLinkConfig"
import { NODE_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextNodeConfig"
import { createZDDModifier, ZDD_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextZDDConfig"
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
      // Note: Les widgets n'ont plus besoin d'actions définies dans le nouveau système
      // Le widget se gère lui-même
    }
  }
}

export const createNodeMenuConfigPlus = (): MenuConfig => {
  return {
    ...NODE_MENU_CONFIG,
    structure: [
      ...NODE_MENU_CONFIG.structure,
      {
        type: 'widget',
        widgetName: 'ButtonNodeContextAssignTag', // Réutiliser le même widget
        widgetProps: { 
          context: 'node' // Pour différencier le contexte si nécessaire
        }
      }
    ],
    actions: {
      ...NODE_MENU_CONFIG.actions
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

class MenuConfigBuilder {
  private config: MenuConfig

  constructor(baseConfig: MenuConfig) {
    this.config = {
      structure: [...baseConfig.structure],
      actions: { ...baseConfig.actions },
      sectionTitles: { ...baseConfig.sectionTitles },
      globalConditions: baseConfig.globalConditions ? [...baseConfig.globalConditions] : undefined,
      maxDepth: baseConfig.maxDepth
    }
  }

  addButton(actionName: string, actionConfig: any): this {
    this.config.structure.push({
      type: 'button',
      actionName
    })
    this.config.actions[actionName] = {
      ...actionConfig,
      type: 'action' // S'assurer que le type est défini
    }
    return this
  }

  addWidget(widgetName: string, widgetProps: any = {}): this {
    this.config.structure.push({
      type: 'widget',
      widgetName,
      widgetProps
    })
    // Les widgets n'ont plus besoin d'actions dans le nouveau système
    return this
  }

  addSubmenu(titleKey: string, children: any[]): this {
    this.config.structure.push({
      type: 'submenu',
      titleKey,
      children: children.map(child => ({
        type: 'button',
        actionName: child.actionName,
        visibilityConditions: child.visibilityConditions
      }))
    })
    return this
  }

  addSubmenuWithConditions(titleKey: string, children: any[], visibilityConditions?: any[]): this {
    this.config.structure.push({
      type: 'submenu',
      titleKey,
      children: children.map(child => ({
        type: 'button',
        actionName: child.actionName,
        visibilityConditions: child.visibilityConditions
      })),
      visibilityConditions
    })
    return this
  }

  addSeparator(): this {
    this.config.structure.push({
      type: 'separator'
    })
    return this
  }

  addConditionalButton(actionName: string, actionConfig: any, visibilityConditions: any[]): this {
    this.config.structure.push({
      type: 'button',
      actionName,
      visibilityConditions
    })
    this.config.actions[actionName] = {
      ...actionConfig,
      type: 'action'
    }
    return this
  }

  addToggleButton(actionName: string, actionConfig: any, getToggleValue: string): this {
    this.config.structure.push({
      type: 'button',
      actionName
    })
    this.config.actions[actionName] = {
      ...actionConfig,
      type: 'toggle',
      getToggleValue
    }
    return this
  }

  addSectionTitle(key: string, en: string, fr: string): this {
    this.config.sectionTitles[key] = { en, fr }
    return this
  }

  build(): MenuConfig {
    return { ...this.config }
  }
}

// ==================================================================================================
// Factory Functions  (approche recommandée)
// ==================================================================================================

export const createExtendedZDDConfig = (): MenuConfig => {
  return new MenuConfigBuilder(ZDD_MENU_CONFIG)
    .addButton('afmReconciliation', {
      labels: {
        en: 'Reconciling actual sankey diagram',
        fr: 'Ajuster et compléter le diagramme'
      },
      tooltips: {
        en: 'Reconciling actual sankey diagram',
        fr: 'Ajuster et compléter le diagramme'
      }
    })
    .build()
}

export const createExtendedLinkConfig = (): MenuConfig => {
  return new MenuConfigBuilder(LINK_MENU_CONFIG)
    .addWidget('ButtonLinkContextAssignTag', {
      // Props spécifiques au widget si nécessaire
    })
    .addSectionTitle('TagAssignment', 'Tag Assignment', 'Attribution d\'étiquettes')
    .build()
}

export const createExtendedNodeConfig = (): MenuConfig => {
  return new MenuConfigBuilder(NODE_MENU_CONFIG)
    .addWidget('ButtonNodeContextAssignTag', {
      context: 'node' // Indiquer que c'est pour les nœuds
    })
    .addSectionTitle('TagAssignment', 'Tag Assignment', 'Attribution d\'étiquettes')
    .build()
}


export {
  createExtendedZDDConfig as ZDD_MENU_CONFIG_PLUS,
  createExtendedLinkConfig as LINK_MENU_CONFIG_PLUS,
  createExtendedNodeConfig as NODE_MENU_CONFIG_PLUS
}
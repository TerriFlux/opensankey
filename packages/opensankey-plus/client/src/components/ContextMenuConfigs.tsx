// ==================================================================================================
// MenuConfigExtensions.tsx - Extension propre des configurations de menu
// ==================================================================================================

import { LINK_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextLinkConfig"
import { createZDDModifier, ZDD_MENU_CONFIG } from "../deps/OpenSankey/components/dialogs/ContextZDDConfig"
import { widgetRegistry, MenuConfig } from "../deps/OpenSankey/components/dialogs/SankeyMenuContext"
import { Class_ApplicationDataOSP } from "../types/ApplicationDataOSP"
import { ButtonLinkContextAssignTag } from "./SankeyPlusLink"

// ==================================================================================================
// Widget Registration (fait une seule fois à l'initialisation)
// ==================================================================================================

export const registerPlusWidgets = () => {
  widgetRegistry.register('ButtonLinkContextAssignTag', ButtonLinkContextAssignTag)
}

// ==================================================================================================
// Extended Menu Configurations (immutables, pas de mutation des originaux)
// ==================================================================================================

// Extension de la config ZDD
export const createZDDMenuConfigPlus = (): MenuConfig => {
  return {
    ...ZDD_MENU_CONFIG,
    structure: [
      ...ZDD_MENU_CONFIG.structure,
      { 
        type: 'button', 
        actionName: 'afm_reconciliation' 
      }
    ],
    actions: {
      ...ZDD_MENU_CONFIG.actions,
      afm_reconciliation: {
        type: 'action',
        showCheck: false,
        toggle: false,
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
        widgetName: 'ButtonLinkContextAssignTag'
      }
    ],
    actions: {
      ...LINK_MENU_CONFIG.actions,
      assign_flux_tag: {
        type: 'widget',
        widgetName: 'ButtonLinkContextAssignTag',
        showCheck: false,
        toggle: false,
        labels: {
          en: 'Assign a tag',
          fr: 'Assigner une étiquette'
        },
        tooltips: {
          en: 'Assign a tag',
          fr: 'Assigner une étiquette'
        }
      }
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
    afm_reconciliation: () => {
      app_data.menu_configuration_osp.action_type = 'optim_sankey'
      dict_setter_show_dialog_afm.ref_setter_show_reconciliation.current(true)
      app_data.drawing_area.is_drawing_area_contextualised = false
      app_data.menu_configuration_osp.ref_to_menu_context_drawing_area_updater.current()
    }
  }
}

// ==================================================================================================
// Configuration Builder (pour une approche plus flexible)
// ==================================================================================================

export class MenuConfigBuilder {
  private config: MenuConfig

  constructor(baseConfig: MenuConfig) {
    this.config = {
      structure: [...baseConfig.structure],
      actions: { ...baseConfig.actions },
      sectionTitles: { ...baseConfig.sectionTitles }
    }
  }

  addButton(actionName: string, actionConfig: any): this {
    this.config.structure.push({
      type: 'button',
      actionName
    })
    this.config.actions[actionName] = actionConfig
    return this
  }

  addWidget(widgetName: string, actionName: string, actionConfig: any, widgetProps: any = {}): this {
    this.config.structure.push({
      type: 'widget',
      widgetName,
      widgetProps
    })
    this.config.actions[actionName] = {
      ...actionConfig,
      type: 'widget',
      widgetName,
      widgetProps
    }
    return this
  }

  addSubmenu(titleKey: string, actions: Array<{ actionName: string }>): this {
    this.config.structure.push({
      type: 'submenu',
      titleKey,
      actions
    })
    return this
  }

  addSeparator(): this {
    this.config.structure.push({
      type: 'separator'
    })
    return this
  }

  build(): MenuConfig {
    return { ...this.config }
  }
}

// ==================================================================================================
// Factory Functions (approche recommandée)
// ==================================================================================================

export const createExtendedZDDConfig = (): MenuConfig => {
  return new MenuConfigBuilder(ZDD_MENU_CONFIG)
    .addButton('afm_reconciliation', {
      type: 'action',
      showCheck: false,
      toggle: false,
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
    .addWidget('ButtonLinkContextAssignTag', 'assign_flux_tag', {
      showCheck: false,
      toggle: false,
      labels: {
        en: 'Assign a tag',
        fr: 'Assigner une étiquette'
      },
      tooltips: {
        en: 'Assign a tag',
        fr: 'Assigner une étiquette'
      }
    })
    .build()
}

// ==================================================================================================
// Initialization Function (à appeler une seule fois dans votre app)
// ==================================================================================================

export const initializePlusMenus = () => {
  registerPlusWidgets()
}

// ==================================================================================================
// Clean Exports
// ==================================================================================================

export {
  createExtendedZDDConfig as ZDD_MENU_CONFIG_PLUS,
  createExtendedLinkConfig as LINK_MENU_CONFIG_PLUS,
  createZDDModifierPlus as ZDD_MODIFIER_PLUS
}
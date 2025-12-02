import { applyRandomColors } from '../../Algorithms/Colors'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_Tag } from '../../types/Tag'
import { MenuConfig } from './SankeyMenuContext'

export const ZDD_MENU_CONFIG: MenuConfig = {
  structure: [
    {
      type: 'button',
      actionName: 'fromNew'
    },
    {
      type: 'submenu',
      titleKey: 'Positionnement',
      children: [
        { type: 'button', actionName: 'toggleParametricMode' },
        {
          type: 'button', actionName: 'resetVerticalIntervals',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              return app_data.drawing_area.sankey.node_styles_dict['default'].position_type === 'parametric'
            }
          }]
        },
        { type: 'button', actionName: 'computeAutoPosition' },
        { type: 'button', actionName: 'computeAutoPositionOptim' },
        {
          type: 'button', actionName: 'toggleAutoX',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              return app_data.drawing_area.sankey.node_styles_dict['default'].position_type === 'parametric'
            }
          }]
        },
        {
          type: 'button', actionName: 'toggleAutoY',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              return app_data.drawing_area.sankey.node_styles_dict['default'].position_type === 'parametric'
            }
          }]
        },
        {
          type: 'button', actionName: 'toggleTradeMode',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              const sankey = app_data.drawing_area.sankey
              if (!sankey.node_taggs_dict['type de noeud']) {
                return false
              }
              const process_nodes = sankey.nodes_list
              const echangeTag = sankey.node_taggs_dict['type de noeud'].tags_dict['echange']
              const import_nodes = process_nodes.filter(n =>
                n.hasGivenTag(echangeTag) && n.output_links_list.length > 0
              )
              const export_nodes = process_nodes.filter(n =>
                n.hasGivenTag(echangeTag) && n.input_links_list.length > 0
              )
              if (import_nodes.length + export_nodes.length === 0) {
                return false
              }
              return true
            }
          }]
        },
        { type: 'button', actionName: 'resetTradeNode'},
        { type: 'button', actionName: 'arrangeNodesToGrid' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'ZoneDessin',
      children: [
        { type: 'button', actionName: 'bgGrid' },
        { type: 'button', actionName: 'maskLegend' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'GestionCouleurs',
      children: [
        { type: 'button', actionName: 'applyRandomNodeColors' },
        { type: 'button', actionName: 'applyRandomLinkColors' },
        { type: 'button', actionName: 'resetNodeColors' },
        { type: 'button', actionName: 'resetLinkColors' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'Style',
      children: [
        { type: 'button', actionName: 'openNodeVisualStyleModal' },
        { type: 'button', actionName: 'openNodeLabelsStyleModal' },
        { type: 'button', actionName: 'openLinkVisualStyleModal' },
        { type: 'button', actionName: 'openLinkLabelsStyleModal' }
      ]
    },
    {
      type: 'button',
      actionName: 'toggleZDTActivated',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          return app_data.drawing_area.containers_list.length > 0
        }
      }]
    }
  ],

  actions: {
    toggleZDTActivated: {
      type: 'toggle',
      labels: {
        en: 'ZDT',
        fr: 'ZDT'
      },
      tooltips: {
        en: 'ZDT',
        fr: 'ZDT'
      },
      labelsToggle: {
        en: {
          true: 'Deactivate ZDT ',
          false: 'Activate ZDT'
        },
        fr: {
          true: 'Désactiver ZDT',
          false: 'Activer ZDT'
        }
      },
      getToggleValue: 'toggleZDTActivatedValue'
    },
    fromNew: {
      type: 'action',
      labels: {
        en: 'Empty diagram',
        fr: 'Nouveau diagramme'
      },
      tooltips: {
        en: 'Create a new empty Sankey diagram',
        fr: 'Créer un nouveau diagramme de Sankey vide'
      }
    },

    bgGrid: {
      type: 'toggle',
      labels: {
        en: 'Grid',
        fr: 'Quadrillage'
      },
      tooltips: {
        en: 'Show or hide the background grid',
        fr: 'Afficher ou masquer la grille de fond'
      },
      getToggleValue: 'bgGridValue',
      showCheck: true
    },

    maskLegend: {
      type: 'toggle',
      labels: {
        en: 'Legend',
        fr: 'Légende'
      },
      labelsToggle: {
        en: {
          true: 'Show the legend',
          false: 'Hide the legend'
        },
        fr: {
          true: 'Afficher la légende',
          false: 'Masquer la légende'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the legend',
        fr: 'Basculer la visibilité de la légende'
      },
      getToggleValue: 'maskLegendValue'
    },

    computeAutoPosition: {
      type: 'action',
      labels: {
        en: 'Auto position',
        fr: 'Option centrage des nœuds'
      },
      tooltips: {
        en: 'Automatically position all nodes in the diagram',
        fr: 'Option centrage des nœuds'
      }
    },

    computeAutoPositionOptim: {
      type: 'action',
      labels: {
        en: 'Auto position (optim)',
        fr: 'Option Minimisation des croisements'
      },
      tooltips: {
        en: 'Automatically position all nodes in the diagram minimizing crossings',
        fr: 'Positionner automatiquement tous les nœuds du diagramme en minimisant les croisements'
      }
    },

    arrangeNodesToGrid: {
      type: 'action',
      labels: {
        en: 'Align to grid',
        fr: 'Aligner sur grille'
      },
      tooltips: {
        en: 'Align all nodes to the background grid',
        fr: 'Aligner tous les nœuds sur la grille de fond'
      }
    },

    toggleParametricMode: {
      type: 'toggle',
      labels: {
        en: 'Absolute Coordinate',
        fr: 'Coordonnées absolues'
      },
      labelsToggle: {
        en: {
          true: 'Switch to absolute coordinates',
          false: 'Switch to parametric mode'
        },
        fr: {
          true: 'Passer en coordonnées absolues',
          false: 'Passer en mode paramétrique'
        }
      },
      tooltips: {
        en: 'Toggle between parametric and absolute positioning mode',
        fr: 'Basculer entre le mode paramétrique et absolu'
      },
      getToggleValue: 'toggleParametricModeValue'
    },
    resetVerticalIntervals: {
      type: 'action',
      labels: {
        en: 'Reset vertical intervals',
        fr: 'Réinitialiser les intervalles verticaux'
      },
      tooltips: {
        en: 'Reset vertical intervals',
        fr: 'Réinitialiser les intervalles verticaux'
      }
    },
    toggleAutoX: {
      type: 'toggle',
      labels: {
        en: 'Auto X position',
        fr: 'Position X auto'
      },
      labelsToggle: {
        en: {
          true: 'Disable auto horizontal positioning',
          false: 'Enable auto horizontal positioning'
        },
        fr: {
          true: 'Désactiver positionnement horizontal auto',
          false: 'Activer positionnement horizontal auto'
        }
      },
      tooltips: {
        en: 'Toggle automatic horizontal positioning of nodes',
        fr: 'Basculer le positionnement horizontal automatique des nœuds'
      },
      getToggleValue: 'toggleAutoXValue'
    },

    toggleTradeMode: {
      type: 'toggle',
      labels: {
        en: 'Import/export close',
        fr: 'Import/export proche'
      },
      tooltips: {
        en: 'Set import/export nodes close to their connected nodes oir at the top and bottom of the diagram',
        fr: 'Placer les nœuds import/export près de leurs nœuds connectés ou en haut et en bas du diagramme'
      },
      labelsToggle: {
        en: {
          true: 'Option Import/export close',
          false: 'Option Import/export top/bottom'
        },
        fr: {
          true: 'Option Import/export proche',
          false: 'Option Import/export haut/bas'
        }
      },
      getToggleValue: 'toggleTradeValue'
    },
    resetTradeNode: {
      type: 'action',
      labels: {
        en: 'Transform trade nodes in sectors',
        fr: 'Transforme les noeuds d\'échanges en secteurs'
      },
      tooltips: {
        en: 'Transform trade nodes in sectors',
        fr: 'Transforme les noeuds d\'échanges en secteurs'
      }
    },
    applyRandomNodeColors: {
      type: 'action',
      labels: {
        en: 'Random node colors',
        fr: 'Couleurs aléatoires nœuds'
      },
      tooltips: {
        en: 'Apply random colors to all nodes',
        fr: 'Appliquer des couleurs aléatoires à tous les nœuds'
      }
    },

    applyRandomLinkColors: {
      type: 'action',
      labels: {
        en: 'Random link colors',
        fr: 'Couleurs aléatoires flux'
      },
      tooltips: {
        en: 'Apply random colors to all links',
        fr: 'Appliquer des couleurs aléatoires à tous les flux'
      }
    },

    resetNodeColors: {
      type: 'action',
      labels: {
        en: 'Default node colors',
        fr: 'Couleurs par défaut nœuds'
      },
      tooltips: {
        en: 'Reset all nodes to their default colors',
        fr: 'Remettre tous les nœuds à leurs couleurs par défaut'
      }
    },

    resetLinkColors: {
      type: 'action',
      labels: {
        en: 'Default link colors',
        fr: 'Couleurs par défaut flux'
      },
      tooltips: {
        en: 'Reset all links to their default colors',
        fr: 'Remettre tous les flux à leurs couleurs par défaut'
      }
    },

    openNodeVisualStyleModal: {
      type: 'action',
      labels: {
        en: 'Node appearance',
        fr: 'Formes des nœuds'
      },
      tooltips: {
        en: 'Open the node visual style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style visuel des nœuds'
      }
    },

    openNodeLabelsStyleModal: {
      type: 'action',
      labels: {
        en: 'Node labels',
        fr: 'Libellés des nœuds'
      },
      tooltips: {
        en: 'Open the node labels style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style des libellés des nœuds'
      }
    },

    openLinkVisualStyleModal: {
      type: 'action',
      labels: {
        en: 'Flow appearance',
        fr: 'Formes des flux'
      },
      tooltips: {
        en: 'Open the link visual style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style visuel des flux'
      }
    },

    openLinkLabelsStyleModal: {
      type: 'action',
      labels: {
        en: 'Flow labels',
        fr: 'Libellés des flux'
      },
      tooltips: {
        en: 'Open the link labels style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style des libellés des flux'
      }
    }
  },

  sectionTitles: {
    ZoneDessin: {
      en: 'Drawing zone',
      fr: 'Zone de dessin'
    },
    Positionnement: {
      en: 'Automatic Positioning',
      fr: 'Positionnement Automatique'
    },
    GestionCouleurs: {
      en: 'Color Management',
      fr: 'Gestion des couleurs'
    },
    Style: {
      en: 'Styles',
      fr: 'Style des éléments'
    }
  }
} as const

export const createZDDModifier = (app_data: Class_ApplicationData) => {
  const { drawing_area, menu_configuration } = app_data
  const { sankey } = drawing_area
  const { nodePositioning } = drawing_area
  const { dict_setter_show_dialog } = menu_configuration
  const {
    ref_setter_show_modal_styles_nodes_visual, ref_setter_show_modal_styles_nodes_labels,
    ref_setter_show_modal_styles_links_visual, ref_setter_show_modal_styles_links_labels
  } = dict_setter_show_dialog
  const saveToCache = () => menu_configuration.ref_to_save_in_cache_indicator.current(false)
  const getNodeStyle = () => sankey.node_styles_dict['default']
  const echangeTag = sankey.node_taggs_dict['type de noeud'] ? sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
  return {
    fromNew: () => app_data.reinitialization(),
    bgGrid: () => drawing_area.bgGrid(),
    bgGridValue: () => drawing_area.grid_visible,
    maskLegend: () => drawing_area.maskLegend(),
    maskLegendValue: () => drawing_area.legend.masked,
    computeAutoPosition: () => { nodePositioning.computeAutoSankeyWithToast(false, false); saveToCache() },
    computeAutoPositionOptim: () => { nodePositioning.computeAutoSankeyWithToast(false, true); saveToCache() },
    resetTradeNode:() => {sankey.nodes_list.filter(n=>n.hasGivenTag(echangeTag!)).forEach(n=>n.removeTag(echangeTag!))},
    arrangeNodesToGrid: () => { nodePositioning.arrangeNodesToGrid(); saveToCache() },
    toggleParametricMode: () => getNodeStyle().position_type === 'parametric' ? drawing_area.setAbsoluteMode() : drawing_area.setParametricMode(),
    toggleParametricModeValue: () => getNodeStyle().position_type === 'parametric',
    resetVerticalIntervals: () => { drawing_area.resetAllVerticalIntervals(); saveToCache() },
    toggleAutoX: () => { getNodeStyle().position.auto_x = !getNodeStyle().position.auto_x },
    toggleAutoXValue: () => getNodeStyle().position.auto_x,
    toggleAutoY: () => { getNodeStyle().position.auto_y = !getNodeStyle().position.auto_y },
    toggleAutoYValue: () => getNodeStyle().position.auto_y,
    toggleTradeMode: () => { sankey.tradeOption() == 'above_below' ? sankey.setTrade(true) : sankey.setTrade(false); saveToCache() },
    toggleTradeValue: () => sankey.tradeOption() == 'above_below',
    applyRandomNodeColors: () => { applyRandomColors(app_data, sankey.nodes_list); saveToCache() },
    applyRandomLinkColors: () => { applyRandomColors(app_data, sankey.links_list); saveToCache() },
    resetNodeColors: () => { sankey.deleteLocalAttrSelectedNodes('shape_color', sankey.nodes_list); saveToCache() },
    resetLinkColors: () => { sankey.deleteLocalAttrSelectedLinks('shape_color', sankey.links_list); saveToCache() },
    openNodeVisualStyleModal: () => ref_setter_show_modal_styles_nodes_visual.current(true),
    openNodeLabelsStyleModal: () => ref_setter_show_modal_styles_nodes_labels.current(true),
    openLinkVisualStyleModal: () => ref_setter_show_modal_styles_links_visual.current(true),
    openLinkLabelsStyleModal: () => ref_setter_show_modal_styles_links_labels.current(true),
    toggleZDTActivated: () => {
      app_data.drawing_area.container_activated = !app_data.drawing_area.container_activated
      app_data.drawing_area.draw()
    },
    toggleZDTActivatedValue: () => app_data.drawing_area.container_activated
  }
}
export type ZDDModifierType = ReturnType<typeof createZDDModifier>
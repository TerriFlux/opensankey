import { applyRandomColors } from "../../Algorithms/Colors";
import { Class_ApplicationData } from "../../types/ApplicationData";
import { MenuConfig } from "./SankeyMenuContext";

export const ZDD_MENU_CONFIG: MenuConfig = {
  structure: [
    {
      type: 'submenu',
      titleKey: 'Positionnement',
      actions: [
        { actionName: 'computeAutoPosition' },
        { actionName: 'arrangeNodesToGrid' },
        { actionName: 'toggleParametricMode' },
        { actionName: 'toggleAutoX' },
        { actionName: 'setTradeClose' },
        { actionName: 'setTradeOpen' }
      ]
    },
    {
      type: 'button',
      actionName: 'from_new'
    },
    {
      type: 'submenu',
      titleKey: 'ZoneDessin',
      actions: [
        { actionName: 'bgGrid' },
        { actionName: 'maskLegend' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'GestionCouleurs',
      actions: [
        { actionName: 'applyRandomNodeColors' },
        { actionName: 'applyRandomLinkColors' },
        { actionName: 'resetNodeColors' },
        { actionName: 'resetLinkColors' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'Style',
      actions: [
        { actionName: 'openNodeVisualStyleModal' },
        { actionName: 'openNodeLabelsStyleModal' },
        { actionName: 'openLinkVisualStyleModal' },
        { actionName: 'openLinkLabelsStyleModal' }
      ]
    }
  ],

  // Configuration des actions (votre ZDD_CONFIG existant)
  actions: {
    from_new: {
      type: 'action',
      showCheck: false,
      toggle: false,
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
      type: 'action',
      showCheck: true,
      toggle: false,
      labels: {
        en: 'Grid',
        fr: 'Quadrillage'
      },
      tooltips: {
        en: 'Show or hide the background grid',
        fr: 'Afficher ou masquer la grille de fond'
      }
    },

    maskLegend: {
      type: 'toggle',
      showCheck: false,
      toggle: true,
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
      }
    },

    computeAutoPosition: {
      type: 'action',
      showCheck: false,
      toggle: false,
      labels: {
        en: 'Auto position',
        fr: 'Positionnement auto'
      },
      tooltips: {
        en: 'Automatically position all nodes in the diagram',
        fr: 'Positionner automatiquement tous les nœuds du diagramme'
      }
    },

    arrangeNodesToGrid: {
      type: 'action',
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: true,
      labels: {
        en: 'Position mode',
        fr: 'Mode position'
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
      }
    },

    toggleAutoX: {
      type: 'toggle',
      showCheck: false,
      toggle: true,
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
      }
    },

    setTradeClose: {
      type: 'action',
      showCheck: false,
      toggle: false,
      labels: {
        en: 'Import/export close',
        fr: 'Import/export proche'
      },
      tooltips: {
        en: 'Set import/export nodes close to their connected nodes',
        fr: 'Placer les nœuds import/export près de leurs nœuds connectés'
      }
    },

    setTradeOpen: {
      type: 'action',
      showCheck: false,
      toggle: false,
      labels: {
        en: 'Import/export top/bottom',
        fr: 'Import/export haut/bas'
      },
      tooltips: {
        en: 'Set import/export nodes at the top and bottom of the diagram',
        fr: 'Placer les nœuds import/export en haut et en bas du diagramme'
      }
    },

    applyRandomNodeColors: {
      type: 'action',
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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
      showCheck: false,
      toggle: false,
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

  // Traductions pour les titres des sections
  sectionTitles: {
    ZoneDessin: {
      en: 'Drawing zone',
      fr: 'Zone de dessin'
    },
    Positionnement: {
      en: 'Positioning',
      fr: 'Positionnement'
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

  return {
    from_new: () => app_data.reinitialization(),
    bgGrid: () => drawing_area.bgGrid(),
    bgGridValue: () => drawing_area.grid_visible,
    maskLegend: () => drawing_area.maskLegend(),
    maskLegendValue: () => drawing_area.legend.masked,
    computeAutoPosition: () => { nodePositioning.computeAutoSankeyWithToast(false); saveToCache() },
    arrangeNodesToGrid: () => { nodePositioning.arrangeNodesToGrid(); saveToCache() },
    toggleParametricMode: () => drawing_area.setParametricMode(),
    toggleParametricModeValue: () => getNodeStyle().position_type === 'parametric',
    toggleAutoX: () => { getNodeStyle().position.auto_x = !getNodeStyle().position.auto_x },
    toggleAutoXValue: () => getNodeStyle().position.auto_x,
    setTradeClose: () => { sankey.setTrade(true); saveToCache() },
    setTradeOpen: () => { sankey.setTrade(false); saveToCache() },
    applyRandomNodeColors: () => { applyRandomColors(app_data, sankey.nodes_list); saveToCache() },
    applyRandomLinkColors: () => { applyRandomColors(app_data, sankey.links_list); saveToCache() },
    resetNodeColors: () => { sankey.deleteLocalAttrSelectedNodes('shape_color', sankey.nodes_list); saveToCache() },
    resetLinkColors: () => { sankey.deleteLocalAttrSelectedLinks('shape_color', sankey.links_list); saveToCache() },
    openNodeVisualStyleModal: () => ref_setter_show_modal_styles_nodes_visual.current(true),
    openNodeLabelsStyleModal: () => ref_setter_show_modal_styles_nodes_labels.current(true),
    openLinkVisualStyleModal: () => ref_setter_show_modal_styles_links_visual.current(true),
    openLinkLabelsStyleModal: () => ref_setter_show_modal_styles_links_labels.current(true)
  }
}
export type ZDDModifierType = typeof createZDDModifier
import { applyRandomColors } from '../../Algorithms/Colors'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { MenuConfig } from './SankeyMenuContext'

export const ZDD_MENU_CONFIG: MenuConfig = {
  structure: [
    { type: 'button', actionName: 'clearCurrentView', visibilityConditions: [{ type: 'custom', customCheck: (app_data) => 'has_views' in app_data && (app_data as unknown as { has_views: boolean }).has_views }] },
    { type: 'button', actionName: 'deleteAllViews' },
    {
      type: 'submenu',
      titleKey: 'Positionnement',
      children: [
        { type: 'button', actionName: 'transposeDA' },
        {
          type: 'submenu',
          titleKey: 'MiseEnPageAuto',
          children: [
            { type: 'widget', widgetName: 'MenuContextAutoLayout', widgetProps: {} }
          ]
        },
        // {
        //   type: 'button', actionName: 'toggleAutoX',
        //   visibilityConditions: [{
        //     type: 'custom',
        //     customCheck: (app_data) => {
        //       return app_data.drawing_area.sankey.styles_dict['default'].shape_position_type === 'parametric'
        //     }
        //   }]
        // },
        // {
        //   type: 'button', actionName: 'toggleAutoY',
        //   visibilityConditions: [{
        //     type: 'custom',
        //     customCheck: (app_data) => {
        //       return app_data.drawing_area.sankey.styles_dict['default'].shape_position_type === 'parametric'
        //     }
        //   }]
        // },
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
        { type: 'button', actionName: 'arrangeNodesToGrid' },
        {
          type: 'submenu',
          titleKey: 'ResetVerticalIntervals',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              return app_data.drawing_area.sankey.styles_dict['default'].shape_position_type === 'parametric'
            }
          }],
          children: [
            { type: 'widget', widgetName: 'MenuContextResetVerticalIntervals', widgetProps: {} }
          ]
        }
      ]
    },
    // {
    //   type: 'submenu',
    //   titleKey: 'ZoneDessin',
    //   children: [
    //     { type: 'button', actionName: 'bgGrid' },
    //     { type: 'button', actionName: 'maskLegend' }
    //   ]
    // },
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
      type: 'button',
      actionName: 'openStyleModal'
    },
    // {
    //   type: 'button',
    //   actionName: 'openGraphOrder'
    // },
    {
      type: 'button',
      actionName: 'toggleZDTActivated',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          return app_data.drawing_area.sankey.containers_list.length > 0
        }
      }]
    }
  ],

  actions: {
    toggleZDTActivated: {
      type: 'toggle',
      labels: {
        en: 'Text Zone',
        fr: 'Zone de texte'
      },
      tooltips: {
        en: 'Text Zone',
        fr: 'Zone de texte'
      },
      labelsToggle: {
        en: {
          true: 'Deactivate Text Zone ',
          false: 'Activate Text Zone'
        },
        fr: {
          true: 'Désactiver zone de texte',
          false: 'Activer zone de texte'
        }
      },
      getToggleValue: 'toggleZDTActivatedValue'
    },
    clearCurrentView: {
      type: 'action',
      labels: {
        en: 'Clear view',
        fr: 'Vider la vue'
      },
      tooltips: {
        en: 'Clear all nodes and links in the current view',
        fr: 'Supprimer tous les nœuds et flux de la vue courante'
      }
    },

    deleteAllViews: {
      type: 'action',
      labels: {
        en: 'New diagram',
        fr: 'Nouveau diagramme'
      },
      tooltips: {
        en: 'Delete all views and reset to an empty diagram',
        fr: 'Supprimer toutes les vues et réinitialiser un diagramme vide'
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

    transposeDA: {
      type: 'action',
      labels: {
        en: 'Transpose diagram',
        fr: 'Transposer le diagramme'
      },
      tooltips: {
        en: 'Transpose the diagram: swap horizontal and vertical axes',
        fr: 'Transposer le diagramme : inverser les axes horizontal et vertical'
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
        en: 'Absolute coordinate mode',
        fr: 'Mode position en coordonnées absolues'
      },
      labelsToggle: {
        en: {
          true: 'Absolute coordinate mode',
          false: 'Constant vertical offset mode'
        },
        fr: {
          true: 'Mode position en coordonnées absolues',
          false: 'Mode position avec écart vertical constant'
        }
      },
      tooltips: {
        en: 'Toggle between absolute coordinate mode and constant vertical offset mode',
        fr: 'Basculer entre le mode coordonnées absolues et le mode écart vertical constant'
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
    // toggleAutoX: {
    //   type: 'toggle',
    //   labels: {
    //     en: 'Auto X position',
    //     fr: 'Position X auto'
    //   },
    //   labelsToggle: {
    //     en: {
    //       true: 'Disable auto horizontal positioning',
    //       false: 'Enable auto horizontal positioning'
    //     },
    //     fr: {
    //       true: 'Désactiver positionnement horizontal auto',
    //       false: 'Activer positionnement horizontal auto'
    //     }
    //   },
    //   tooltips: {
    //     en: 'Toggle automatic horizontal positioning of nodes',
    //     fr: 'Basculer le positionnement horizontal automatique des nœuds'
    //   },
    //   getToggleValue: 'toggleAutoXValue'
    // },

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

    openStyleModal: {
      type: 'action',
      labels: {
        en: 'Element styles',
        fr: 'Styles des éléments'
      },
      tooltips: {
        en: 'Open the node visual style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style visuel des nœuds'
      }
    },
    // openGraphOrder: {
    //   type: 'action',
    //   labels: {
    //     en: 'Shape draw order',
    //     fr: 'Ordre d\'affichage des formes'
    //   },
    //   tooltips: {
    //     en: 'Shape draw order',
    //     fr: 'Ordre d\'affichage des formes'
    //   }
    // }


  },

  sectionTitles: {
    // ZoneDessin: {
    //   en: 'Drawing zone',
    //   fr: 'Zone de dessin'
    // },
    Positionnement: {
      en: 'Positioning',
      fr: 'Positionnement'
    },
    MiseEnPageAuto: {
      en: 'Auto layout',
      fr: 'Mise en page auto'
    },
    ResetVerticalIntervals: {
      en: 'Reset vertical intervals',
      fr: 'Réinitialiser les intervalles verticaux'
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
  const { ref_setter_show_modal_styles } = dict_setter_show_dialog
  const saveToCache = () => menu_configuration.ref_to_save_in_cache_indicator.current(false)
  const getNodeStyle = () => sankey.styles_dict['default']
  return {
    clearCurrentView: () => { app_data.reset({ only_current_view: true }); app_data.drawing_area.draw() },
    deleteAllViews: () => app_data.reinitialization(),
    transposeDA: () => { drawing_area.verticalizeDiagram(); saveToCache() },
    arrangeNodesToGrid: () => { nodePositioning.arrangeNodesToGrid(); saveToCache() },
    toggleParametricMode: () => getNodeStyle().shape_position_type === 'parametric' ? drawing_area.setAbsoluteMode() : drawing_area.setParametricMode(),
    toggleParametricModeValue: () => getNodeStyle().shape_position_type === 'parametric',
    resetVerticalIntervals: () => { drawing_area.resetAllVerticalIntervals(); saveToCache() },
    // toggleAutoX: () => { },//getNodeStyle().position.auto_x = !getNodeStyle().position.auto_x },
    // toggleAutoXValue: () => null,//getNodeStyle().position.auto_x,
    // toggleAutoY: () => { },//getNodeStyle().position.auto_y = !getNodeStyle().position.auto_y },
    // toggleAutoYValue: () => null, //getNodeStyle().position.auto_y,
    toggleTradeMode: () => { sankey.tradeOption() == 'above_below' ? sankey.setTrade(true) : sankey.setTrade(false); saveToCache() },
    toggleTradeValue: () => sankey.tradeOption() == 'above_below',
    applyRandomNodeColors: () => { applyRandomColors(app_data, sankey.nodes_list); saveToCache() },
    applyRandomLinkColors: () => { applyRandomColors(app_data, sankey.links_list); saveToCache() },
    resetNodeColors: () => { sankey.deleteLocalAttrSelectedElements('shape_color', sankey.nodes_list); saveToCache() },
    resetLinkColors: () => { sankey.deleteLocalAttrSelectedElements('shape_color', sankey.links_list); saveToCache() },
    openStyleModal: () => ref_setter_show_modal_styles.current(true),

    toggleZDTActivated: () => {
      app_data.drawing_area.sankey.container_activated = !app_data.drawing_area.sankey.container_activated
      app_data.drawing_area.draw()
    },
    toggleZDTActivatedValue: () => app_data.drawing_area.sankey.container_activated
  }
}
export type ZDDModifierType = ReturnType<typeof createZDDModifier>
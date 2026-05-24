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
        fr: 'Zone de texte',
        es: 'Zona de texto',
        de: 'Textbereich',
        it: 'Zona di testo'
      },
      tooltips: {
        en: 'Text Zone',
        fr: 'Zone de texte',
        es: 'Zona de texto',
        de: 'Textbereich',
        it: 'Zona di testo'
      },
      labelsToggle: {
        en: {
          true: 'Deactivate Text Zone ',
          false: 'Activate Text Zone'
        },
        fr: {
          true: 'Désactiver zone de texte',
          false: 'Activer zone de texte'
        },
        es: {
          true: 'Desactivar zona de texto',
          false: 'Activar zona de texto'
        },
        de: {
          true: 'Textbereich deaktivieren',
          false: 'Textbereich aktivieren'
        },
        it: {
          true: 'Disattiva zona di testo',
          false: 'Attiva zona di testo'
        }
      },
      getToggleValue: 'toggleZDTActivatedValue'
    },
    clearCurrentView: {
      type: 'action',
      labels: {
        en: 'Clear view',
        fr: 'Vider la vue',
        es: 'Vaciar la vista',
        de: 'Ansicht leeren',
        it: 'Svuota la vista'
      },
      tooltips: {
        en: 'Clear all nodes and links in the current view',
        fr: 'Supprimer tous les nœuds et flux de la vue courante',
        es: 'Eliminar todos los nodos y flujos de la vista actual',
        de: 'Alle Knoten und Flüsse in der aktuellen Ansicht löschen',
        it: 'Eliminare tutti i nodi e flussi nella vista corrente'
      }
    },

    deleteAllViews: {
      type: 'action',
      labels: {
        en: 'New diagram',
        fr: 'Nouveau diagramme',
        es: 'Nuevo diagrama',
        de: 'Neues Diagramm',
        it: 'Nuovo diagramma'
      },
      tooltips: {
        en: 'Delete all views and reset to an empty diagram',
        fr: 'Supprimer toutes les vues et réinitialiser un diagramme vide',
        es: 'Eliminar todas las vistas y restablecer un diagrama vacío',
        de: 'Alle Ansichten löschen und auf ein leeres Diagramm zurücksetzen',
        it: 'Eliminare tutte le viste e reimpostare un diagramma vuoto'
      }
    },

    bgGrid: {
      type: 'toggle',
      labels: {
        en: 'Grid',
        fr: 'Quadrillage',
        es: 'Cuadrícula',
        de: 'Raster',
        it: 'Griglia'
      },
      tooltips: {
        en: 'Show or hide the background grid',
        fr: 'Afficher ou masquer la grille de fond',
        es: 'Mostrar u ocultar la cuadrícula de fondo',
        de: 'Hintergrundraster ein- oder ausblenden',
        it: 'Mostrare o nascondere la griglia di sfondo'
      },
      getToggleValue: 'bgGridValue',
      showCheck: true
    },

    maskLegend: {
      type: 'toggle',
      labels: {
        en: 'Legend',
        fr: 'Légende',
        es: 'Leyenda',
        de: 'Legende',
        it: 'Legenda'
      },
      labelsToggle: {
        en: {
          true: 'Show the legend',
          false: 'Hide the legend'
        },
        fr: {
          true: 'Afficher la légende',
          false: 'Masquer la légende'
        },
        es: {
          true: 'Mostrar la leyenda',
          false: 'Ocultar la leyenda'
        },
        de: {
          true: 'Legende anzeigen',
          false: 'Legende ausblenden'
        },
        it: {
          true: 'Mostra la legenda',
          false: 'Nascondi la legenda'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the legend',
        fr: 'Basculer la visibilité de la légende',
        es: 'Alternar la visibilidad de la leyenda',
        de: 'Sichtbarkeit der Legende umschalten',
        it: 'Attiva/disattiva la visibilità della legenda'
      },
      getToggleValue: 'maskLegendValue'
    },

    transposeDA: {
      type: 'action',
      labels: {
        en: 'Transpose diagram',
        fr: 'Transposer le diagramme',
        es: 'Transponer diagrama',
        de: 'Diagramm transponieren',
        it: 'Trasponi diagramma'
      },
      tooltips: {
        en: 'Transpose the diagram: swap horizontal and vertical axes',
        fr: 'Transposer le diagramme : inverser les axes horizontal et vertical',
        es: 'Transponer el diagrama: intercambiar los ejes horizontal y vertical',
        de: 'Diagramm transponieren: horizontale und vertikale Achsen tauschen',
        it: 'Trasponi il diagramma: scambia gli assi orizzontale e verticale'
      }
    },

    arrangeNodesToGrid: {
      type: 'action',
      labels: {
        en: 'Align to grid',
        fr: 'Aligner sur grille',
        es: 'Alinear a la cuadrícula',
        de: 'Am Raster ausrichten',
        it: 'Allinea alla griglia'
      },
      tooltips: {
        en: 'Align all nodes to the background grid',
        fr: 'Aligner tous les nœuds sur la grille de fond',
        es: 'Alinear todos los nodos a la cuadrícula de fondo',
        de: 'Alle Knoten am Hintergrundraster ausrichten',
        it: 'Allineare tutti i nodi alla griglia di sfondo'
      }
    },

    toggleParametricMode: {
      type: 'toggle',
      labels: {
        en: 'Absolute coordinate mode',
        fr: 'Mode position en coordonnées absolues',
        es: 'Modo coordenadas absolutas',
        de: 'Absolutkoordinaten-Modus',
        it: 'Modalità coordinate assolute'
      },
      labelsToggle: {
        en: {
          true: 'Absolute coordinate mode',
          false: 'Constant vertical offset mode'
        },
        fr: {
          true: 'Mode position en coordonnées absolues',
          false: 'Mode position avec écart vertical constant'
        },
        es: {
          true: 'Modo coordenadas absolutas',
          false: 'Modo desplazamiento vertical constante'
        },
        de: {
          true: 'Absolutkoordinaten-Modus',
          false: 'Konstanter vertikaler Versatz-Modus'
        },
        it: {
          true: 'Modalità coordinate assolute',
          false: 'Modalità offset verticale costante'
        }
      },
      tooltips: {
        en: 'Toggle between absolute coordinate mode and constant vertical offset mode',
        fr: 'Basculer entre le mode coordonnées absolues et le mode écart vertical constant',
        es: 'Alternar entre modo coordenadas absolutas y modo desplazamiento vertical constante',
        de: 'Zwischen Absolutkoordinaten-Modus und konstantem vertikalen Versatz-Modus umschalten',
        it: 'Alternare tra modalità coordinate assolute e modalità offset verticale costante'
      },
      getToggleValue: 'toggleParametricModeValue'
    },

    resetVerticalIntervals: {
      type: 'action',
      labels: {
        en: 'Reset vertical intervals',
        fr: 'Réinitialiser les intervalles verticaux',
        es: 'Restablecer intervalos verticales',
        de: 'Vertikale Abstände zurücksetzen',
        it: 'Reimposta intervalli verticali'
      },
      tooltips: {
        en: 'Reset vertical intervals',
        fr: 'Réinitialiser les intervalles verticaux',
        es: 'Restablecer intervalos verticales',
        de: 'Vertikale Abstände zurücksetzen',
        it: 'Reimposta intervalli verticali'
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
        fr: 'Import/export proche',
        es: 'Importación/exportación cercana',
        de: 'Import/Export nah',
        it: 'Importazione/esportazione vicina'
      },
      tooltips: {
        en: 'Set import/export nodes close to their connected nodes oir at the top and bottom of the diagram',
        fr: 'Placer les nœuds import/export près de leurs nœuds connectés ou en haut et en bas du diagramme',
        es: 'Colocar los nodos de importación/exportación cerca de sus nodos conectados o en la parte superior e inferior del diagrama',
        de: 'Import-/Export-Knoten nah an ihren verbundenen Knoten oder oben und unten im Diagramm platzieren',
        it: 'Posizionare i nodi di importazione/esportazione vicino ai nodi collegati o in alto e in basso nel diagramma'
      },
      labelsToggle: {
        en: {
          true: 'Option Import/export close',
          false: 'Option Import/export top/bottom'
        },
        fr: {
          true: 'Option Import/export proche',
          false: 'Option Import/export haut/bas'
        },
        es: {
          true: 'Opción Importación/exportación cercana',
          false: 'Opción Importación/exportación arriba/abajo'
        },
        de: {
          true: 'Option Import/Export nah',
          false: 'Option Import/Export oben/unten'
        },
        it: {
          true: 'Opzione Importazione/esportazione vicina',
          false: 'Opzione Importazione/esportazione alto/basso'
        }
      },
      getToggleValue: 'toggleTradeValue'
    },
    applyRandomNodeColors: {
      type: 'action',
      labels: {
        en: 'Random node colors',
        fr: 'Couleurs aléatoires nœuds',
        es: 'Colores aleatorios de nodos',
        de: 'Zufällige Knotenfarben',
        it: 'Colori casuali nodi'
      },
      tooltips: {
        en: 'Apply random colors to all nodes',
        fr: 'Appliquer des couleurs aléatoires à tous les nœuds',
        es: 'Aplicar colores aleatorios a todos los nodos',
        de: 'Zufällige Farben auf alle Knoten anwenden',
        it: 'Applicare colori casuali a tutti i nodi'
      }
    },

    applyRandomLinkColors: {
      type: 'action',
      labels: {
        en: 'Random link colors',
        fr: 'Couleurs aléatoires flux',
        es: 'Colores aleatorios de flujos',
        de: 'Zufällige Flussfarben',
        it: 'Colori casuali flussi'
      },
      tooltips: {
        en: 'Apply random colors to all links',
        fr: 'Appliquer des couleurs aléatoires à tous les flux',
        es: 'Aplicar colores aleatorios a todos los flujos',
        de: 'Zufällige Farben auf alle Flüsse anwenden',
        it: 'Applicare colori casuali a tutti i flussi'
      }
    },

    resetNodeColors: {
      type: 'action',
      labels: {
        en: 'Default node colors',
        fr: 'Couleurs par défaut nœuds',
        es: 'Colores predeterminados de nodos',
        de: 'Standard-Knotenfarben',
        it: 'Colori predefiniti nodi'
      },
      tooltips: {
        en: 'Reset all nodes to their default colors',
        fr: 'Remettre tous les nœuds à leurs couleurs par défaut',
        es: 'Restablecer todos los nodos a sus colores predeterminados',
        de: 'Alle Knoten auf ihre Standardfarben zurücksetzen',
        it: 'Reimpostare tutti i nodi ai colori predefiniti'
      }
    },

    resetLinkColors: {
      type: 'action',
      labels: {
        en: 'Default link colors',
        fr: 'Couleurs par défaut flux',
        es: 'Colores predeterminados de flujos',
        de: 'Standard-Flussfarben',
        it: 'Colori predefiniti flussi'
      },
      tooltips: {
        en: 'Reset all links to their default colors',
        fr: 'Remettre tous les flux à leurs couleurs par défaut',
        es: 'Restablecer todos los flujos a sus colores predeterminados',
        de: 'Alle Flüsse auf ihre Standardfarben zurücksetzen',
        it: 'Reimpostare tutti i flussi ai colori predefiniti'
      }
    },

    openStyleModal: {
      type: 'action',
      labels: {
        en: 'Element styles',
        fr: 'Styles des éléments',
        es: 'Estilos de elementos',
        de: 'Elementstile',
        it: 'Stili degli elementi'
      },
      tooltips: {
        en: 'Open the node visual style configuration dialog',
        fr: 'Ouvrir la boîte de dialogue de configuration du style visuel des nœuds',
        es: 'Abrir el diálogo de configuración del estilo visual de los nodos',
        de: 'Den Dialog zur Konfiguration des visuellen Knotenstils öffnen',
        it: 'Aprire la finestra di configurazione dello stile visivo dei nodi'
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
      fr: 'Positionnement',
      es: 'Posicionamiento',
      de: 'Positionierung',
      it: 'Posizionamento'
    },
    MiseEnPageAuto: {
      en: 'Auto layout',
      fr: 'Mise en page auto',
      es: 'Diseño automático',
      de: 'Automatisches Layout',
      it: 'Layout automatico'
    },
    ResetVerticalIntervals: {
      en: 'Reset vertical intervals',
      fr: 'Réinitialiser les intervalles verticaux',
      es: 'Restablecer intervalos verticales',
      de: 'Vertikale Abstände zurücksetzen',
      it: 'Reimposta intervalli verticali'
    },
    GestionCouleurs: {
      en: 'Color Management',
      fr: 'Gestion des couleurs',
      es: 'Gestión de colores',
      de: 'Farbverwaltung',
      it: 'Gestione colori'
    },
    Style: {
      en: 'Styles',
      fr: 'Style des éléments',
      es: 'Estilos de elementos',
      de: 'Elementstile',
      it: 'Stili degli elementi'
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
    // #1231 — le mode paramétrique n'est plus un mode utilisateur : ce toggle bascule
    // désormais entre pourcentage et absolu.
    toggleParametricMode: () => getNodeStyle().shape_position_type === 'proportional' ? drawing_area.setAbsoluteMode() : drawing_area.setProportionalMode(),
    toggleParametricModeValue: () => getNodeStyle().shape_position_type === 'proportional',
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
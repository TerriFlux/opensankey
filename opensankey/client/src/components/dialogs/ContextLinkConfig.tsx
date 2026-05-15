import { MenuConfig } from './SankeyMenuContext'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { StorageType } from '../../Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'

export const LINK_MENU_CONFIG: MenuConfig = {
  structure: [
    {
      type: 'submenu',
      titleKey: 'EditStyle',
      children: [
        { type: 'widget', widgetName: 'MenuContextLinksData', widgetProps: {} },
        { type: 'button', actionName: 'resetAttr' },
        { type: 'widget', widgetName: 'ButtonLinkContextAssignStyle' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'MaskAttr',
      children: [
        { type: 'button', actionName: 'toggleNameVisibility' },
        { type: 'button', actionName: 'toggleValueVisibility' },
        { type: 'button', actionName: 'moveToFirstPlan' },
        { type: 'button', actionName: 'moveToLastPlan' }
      ]
    },
    {
      type: 'button',
      actionName: 'inverseIO'
    },
    {
      type: 'button',
      actionName: 'splitLink'
    },
    {
      type: 'button',
      actionName: 'copyElement'
    }
  ],

  actions: {
    inverseIO: {
      type: 'action',
      labels: {
        en: 'Inverse source/target',
        fr: 'Inverser source/cible',
        es: 'Invertir origen/destino',
        de: 'Quelle/Ziel umkehren',
        it: 'Inverti origine/destinazione'
      },
      tooltips: {
        en: 'Inverse the source and target of the selected link(s)',
        fr: 'Inverser la source et la cible du/des flux sélectionné(s)',
        es: 'Invertir el origen y el destino del/de los flujo(s) seleccionado(s)',
        de: 'Quelle und Ziel des/der ausgewählten Flusses/Flüsse umkehren',
        it: 'Inverti l\'origine e la destinazione del/dei flusso/i selezionato/i'
      }
    },

    splitLink: {
      type: 'action',
      labels: {
        en: 'Split into two',
        fr: 'Scinder en deux',
        es: 'Dividir en dos',
        de: 'In zwei teilen',
        it: 'Dividi in due'
      },
      tooltips: {
        en: 'Insert a new node at the middle of this link, replacing it by two links of equal value',
        fr: 'Insérer un nouveau nœud au milieu du flux, remplaçant le flux par deux flux de même valeur',
        es: 'Insertar un nuevo nodo en el medio del flujo, reemplazándolo por dos flujos del mismo valor',
        de: 'Einen neuen Knoten in der Mitte des Flusses einfügen und ihn durch zwei Flüsse gleichen Wertes ersetzen',
        it: 'Inserire un nuovo nodo al centro del flusso, sostituendolo con due flussi dello stesso valore'
      },
      closeMenuAfter: true,
      undoable: true
    },

    copyElement: {
      type: 'action',
      labels: {
        en: 'Copy link(s)',
        fr: 'Copier le(s) flux',
        es: 'Copiar flujo(s)',
        de: 'Fluss/Flüsse kopieren',
        it: 'Copia flusso/i'
      },
      tooltips: {
        en: 'Duplicate the selected link(s) between the same source and target',
        fr: 'Dupliquer le(s) flux sélectionné(s) entre la même source et la même cible',
        es: 'Duplicar el/los flujo(s) seleccionado(s) entre el mismo origen y destino',
        de: 'Ausgewählte(n) Fluss/Flüsse zwischen gleicher Quelle und gleichem Ziel duplizieren',
        it: 'Duplica il/i flusso/i selezionato/i tra la stessa origine e destinazione'
      },
      closeMenuAfter: true
    },

    resetAttr: {
      type: 'action',
      labels: {
        en: 'Reset attributes',
        fr: 'Réinit. valeurs styles',
        es: 'Restablecer atributos',
        de: 'Attribute zurücksetzen',
        it: 'Reimposta attributi'
      },
      tooltips: {
        en: 'Reset all local attributes to default values',
        fr: 'Remettre tous les attributs locaux aux valeurs par défaut',
        es: 'Restablecer todos los atributos locales a los valores predeterminados',
        de: 'Alle lokalen Attribute auf Standardwerte zurücksetzen',
        it: 'Reimpostare tutti gli attributi locali ai valori predefiniti'
      },
      undoable: true
    },

    // selectStyle: {
    //   type: 'widget',
    //   widgetName: 'ButtonLinkContextAssignStyle',
    //   widgetProps: {},
    //   labels: { en: 'Select style', fr: 'Styles' },
    //   tooltips: { en: 'Choose a style', fr: 'Styles' },
    //   // Cette action sera gérée dynamiquement pour créer des boutons pour chaque style
    // },

    moveToFirstPlan: {
      type: 'action',
      labels: {
        en: 'Bring to front',
        fr: 'Mettre au premier plan',
        es: 'Traer al frente',
        de: 'In den Vordergrund',
        it: 'Porta in primo piano'
      },
      tooltips: {
        en: 'Draw selected link(s) on top of all other elements',
        fr: 'Afficher le(s) flux sélectionné(s) au-dessus de tous les autres éléments',
        es: 'Dibujar el/los flujo(s) seleccionado(s) encima de todos los demás elementos',
        de: 'Ausgewählte(n) Fluss/Flüsse über allen anderen Elementen zeichnen',
        it: 'Disegna il/i flusso/i selezionato/i sopra tutti gli altri elementi'
      }
    },

    moveToLastPlan: {
      type: 'action',
      labels: {
        en: 'Send to back',
        fr: 'Mettre à l\'arrière-plan',
        es: 'Enviar al fondo',
        de: 'In den Hintergrund',
        it: 'Manda in secondo piano'
      },
      tooltips: {
        en: 'Draw selected link(s) behind all other elements',
        fr: 'Afficher le(s) flux sélectionné(s) derrière tous les autres éléments',
        es: 'Dibujar el/los flujo(s) seleccionado(s) detrás de todos los demás elementos',
        de: 'Ausgewählte(n) Fluss/Flüsse hinter allen anderen Elementen zeichnen',
        it: 'Disegna il/i flusso/i selezionato/i dietro tutti gli altri elementi'
      }
    },

    toggleNameVisibility: {
      type: 'toggle',
      labels: {
        en: 'Name label',
        fr: 'Libellé nom',
        es: 'Etiqueta de nombre',
        de: 'Namensbezeichnung',
        it: 'Etichetta nome'
      },
      labelsToggle: {
        en: {
          true: 'Hide name label',
          false: 'Show name label'
        },
        fr: {
          true: 'Masquer libellé',
          false: 'Afficher libellé'
        },
        es: {
          true: 'Ocultar etiqueta de nombre',
          false: 'Mostrar etiqueta de nombre'
        },
        de: {
          true: 'Namensbezeichnung ausblenden',
          false: 'Namensbezeichnung einblenden'
        },
        it: {
          true: 'Nascondi etichetta nome',
          false: 'Mostra etichetta nome'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the name label',
        fr: 'Basculer la visibilité du libellé nom',
        es: 'Alternar la visibilidad de la etiqueta de nombre',
        de: 'Sichtbarkeit der Namensbezeichnung umschalten',
        it: 'Attiva/disattiva la visibilità dell\'etichetta nome'
      },
      getToggleValue: 'toggleNameVisibilityValue',
      undoable: true
    },

    toggleValueVisibility: {
      type: 'toggle',
      labels: {
        en: 'Value label',
        fr: 'Libellé valeur',
        es: 'Etiqueta de valor',
        de: 'Wertbezeichnung',
        it: 'Etichetta valore'
      },
      labelsToggle: {
        en: {
          true: 'Hide value',
          false: 'Show value'
        },
        fr: {
          true: 'Masquer libellé',
          false: 'Afficher libellé'
        },
        es: {
          true: 'Ocultar valor',
          false: 'Mostrar valor'
        },
        de: {
          true: 'Wert ausblenden',
          false: 'Wert einblenden'
        },
        it: {
          true: 'Nascondi valore',
          false: 'Mostra valore'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the value label',
        fr: 'Basculer la visibilité du libellé valeur',
        es: 'Alternar la visibilidad de la etiqueta de valor',
        de: 'Sichtbarkeit der Wertbezeichnung umschalten',
        it: 'Attiva/disattiva la visibilità dell\'etichetta valore'
      },
      getToggleValue: 'toggleValueVisibilityValue',
      undoable: true
    }
  },

  sectionTitles: {
    EditStyle: {
      en: 'Edition',
      fr: 'Édition',
      es: 'Edición',
      de: 'Bearbeitung',
      it: 'Modifica'
    },
    ChangePlan: {
      en: 'Change Layer',
      fr: 'Changer Plan',
      es: 'Cambiar capa',
      de: 'Ebene ändern',
      it: 'Cambia livello'
    },
    MaskAttr: {
      en: 'Mask Attributes',
      fr: 'Affichage des éléments',
      es: 'Visualización de elementos',
      de: 'Elementanzeige',
      it: 'Visualizzazione elementi'
    },
    EditValue: {
      en: 'Edit Value',
      fr: 'Éditer Valeur',
      es: 'Editar valor',
      de: 'Wert bearbeiten',
      it: 'Modifica valore'
    }
  }
} as const

export const createLinkModifier = (app_data: Class_ApplicationData) => {
  const { drawing_area, menu_configuration, history } = app_data
  const contextualised_link = drawing_area.link_contextualised
  const selected_links = drawing_area.selected_links_list

  const refreshThisAndToggleSaving = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    menu_configuration.ref_to_menu_context_links_updater.current()
  }

  const executeWithUndo = (
    actionFn: () => void,
    undoFn: () => void,
  ) => {
    history.saveUndo(undoFn)
    history.saveRedo(actionFn)
    actionFn()
  }

  return {
    // Actions simples
    inverseIO: () => {
      drawing_area.inverseSelectedLinks()
    },

    // Style actions
    resetAttr: () => {
      const dict_old_value: { [x: string]: StorageType<typeof ALL_ATTRIBUTES_CONFIG> } = {}
      selected_links.forEach(l => {
        dict_old_value[l.id] = l.attributes
      })

      const doReset = () => {
        selected_links.forEach(l => l.resetAttributes())
        refreshThisAndToggleSaving()
      }

      const undoReset = () => {
        selected_links.forEach(l => {
          l.attributes = dict_old_value[l.id]
        })
        refreshThisAndToggleSaving()
      }

      executeWithUndo(doReset, undoReset)
    },

    // Plan actions
    moveToLastPlan: () => {
      drawing_area.selected_links_list.forEach(link => {
        const idx_to_shift = drawing_area.list_g_element.indexOf(link.id)
        drawing_area.moveOrderElementInDA(idx_to_shift, drawing_area.list_g_element.length - 1)
      })
    },

    moveToFirstPlan: () => {
      drawing_area.selected_links_list.forEach(link => {
        const idx_to_shift = drawing_area.list_g_element.indexOf(link.id)
        drawing_area.moveOrderElementInDA(idx_to_shift, 0)
      })
    },

    // Visibility toggles
    toggleNameVisibility: () => {
      const dict_old_name: { [x: string]: typeof ALL_ATTRIBUTES_CONFIG } = {}
      selected_links.forEach(l => {
        dict_old_name[l.id] = Object.assign(Object.create(Object.getPrototypeOf(l.attributes)), l.attributes)
      })

      const context_link_name_visible = contextualised_link?.name_label_is_visible ?? false

      const doToggle = () => {
        selected_links.forEach(link => {
          link.name_label_is_visible = !context_link_name_visible
        })
        refreshThisAndToggleSaving()
      }

      const undoToggle = () => {
        selected_links.forEach(l => {
          l.attributes = dict_old_name[l.id]
          l.draw()
        })
        refreshThisAndToggleSaving()
      }

      executeWithUndo(doToggle, undoToggle)
    },

    toggleNameVisibilityValue: () => {
      return contextualised_link?.name_label_is_visible ?? false
    },

    toggleValueVisibility: () => {
      const dict_old_value: { [x: string]: typeof ALL_ATTRIBUTES_CONFIG } = {}
      selected_links.forEach(l => {
        dict_old_value[l.id] = Object.assign(Object.create(Object.getPrototypeOf(l.attributes)), l.attributes)
      })

      const context_link_value_visible = contextualised_link?.value_label_is_visible ?? false

      const doToggle = () => {
        selected_links.forEach(link => {
          link.value_label_is_visible = !context_link_value_visible
        })
        refreshThisAndToggleSaving()
      }

      const undoToggle = () => {
        selected_links.forEach(l => {
          l.attributes = dict_old_value[l.id]
          l.draw()
        })
        refreshThisAndToggleSaving()
      }

      executeWithUndo(doToggle, undoToggle)
    },

    toggleValueVisibilityValue: () => {
      return contextualised_link?.value_label_is_visible ?? false
    },

    copyElement: () => {
      const sankey = drawing_area.sankey
      drawing_area.purgeSelection()
      selected_links.forEach(link => {
        const new_link = sankey.addNewLink(link.source, link.target)
        new_link.copyFrom(link)
        new_link.draw()
        drawing_area.addElementToSelection(new_link)
      })
      drawing_area.link_contextualised = undefined
      menu_configuration.ref_to_save_in_cache_indicator.current(false)
      menu_configuration.ref_to_menu_context_links_updater.current()
    },

    splitLink: () => {
      const sankey = drawing_area.sankey
      const link = contextualised_link
      if (!link) return

      const original_source = link.source
      const original_target = link.target

      // Milieu géométrique du segment visible du flux (avant modification)
      const mx = (link.position_x_start + link.position_x_end) / 2
      const my = (link.position_y_start + link.position_y_end) / 2

      // Snapshot des ordres de flux pour preservation lors du split/undo
      const source_order_ids_before = original_source.links_order.map(l => l.id)
      const target_order_ids_before = original_target.links_order.map(l => l.id)

      // Id unique pour le nouveau nœud (capturé une fois, réutilisé en redo)
      let n = Object.keys(sankey.nodes_dict).length
      let node_id = 'split_node_' + n
      while (sankey.nodes_dict[node_id]) {
        n += 1
        node_id = 'split_node_' + n
      }
      const node_name = 'Node ' + n

      // Références persistées dans la closure pour undo/redo
      let new_node: typeof original_target | null = null
      let link_out: typeof link | null = null

      const doSplit = () => {
        new_node = sankey.addNewNode(node_id, node_name)
        const w = new_node.getShapeWidthToUse?.() ?? 20
        const h = new_node.getShapeHeightToUse?.() ?? 20
        new_node.setPosXY(mx - w / 2, my - h / 2)

        // Nouveau flux newNode -> target_original, copie de la valeur d'origine
        link_out = sankey.addNewLink(new_node, original_target)
        link_out.copyValues(link)
        // Le flux d'origine devient source -> newNode (en place, pas de delete/recreate)
        link.target = new_node

        // Conserver la place du flux dans l'ordre du target : link_out remplace link
        const target_order_after = target_order_ids_before.map(id => id === link.id ? link_out!.id : id)
        original_target.reorganizeIOFromListIds(target_order_after)

        new_node.draw()
        link.draw()
        link_out.draw()
        original_target.draw()

        drawing_area.link_contextualised = undefined
        refreshThisAndToggleSaving()
        menu_configuration.updateAllComponentsRelatedToNodes()
      }

      const undoSplit = () => {
        // Restaurer la cible d'origine (link revient en fin de _links_order du target)
        link.target = original_target
        // Supprimer le second flux puis le nœud intermédiaire
        if (link_out) drawing_area.deleteLink(link_out)
        if (new_node) drawing_area.deleteNode(new_node)
        new_node = null
        link_out = null

        // Remettre les ordres d'origine sur source et target
        original_source.reorganizeIOFromListIds(source_order_ids_before)
        original_target.reorganizeIOFromListIds(target_order_ids_before)

        link.draw()
        original_source.draw()
        original_target.draw()
        refreshThisAndToggleSaving()
        menu_configuration.updateAllComponentsRelatedToNodes()
      }

      executeWithUndo(doSplit, undoSplit)
    }
  }
}

export type LinkModifierType = ReturnType<typeof createLinkModifier>
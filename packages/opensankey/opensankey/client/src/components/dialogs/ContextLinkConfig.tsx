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
      actionName: 'copyElement'
    }
  ],

  actions: {
    inverseIO: {
      type: 'action',
      labels: {
        en: 'Inverse source/target',
        fr: 'Inverser source/cible'
      },
      tooltips: {
        en: 'Inverse the source and target of the selected link(s)',
        fr: 'Inverser la source et la cible du/des flux sélectionné(s)'
      }
    },

    copyElement: {
      type: 'action',
      labels: {
        en: 'Copy link(s)',
        fr: 'Copier le(s) flux'
      },
      tooltips: {
        en: 'Duplicate the selected link(s) between the same source and target',
        fr: 'Dupliquer le(s) flux sélectionné(s) entre la même source et la même cible'
      },
      closeMenuAfter: true
    },

    resetAttr: {
      type: 'action',
      labels: {
        en: 'Reset attributes',
        fr: 'Réinit. valeurs styles'
      },
      tooltips: {
        en: 'Reset all local attributes to default values',
        fr: 'Remettre tous les attributs locaux aux valeurs par défaut'
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
        fr: 'Mettre au premier plan'
      },
      tooltips: {
        en: 'Draw selected link(s) on top of all other elements',
        fr: 'Afficher le(s) flux sélectionné(s) au-dessus de tous les autres éléments'
      }
    },

    moveToLastPlan: {
      type: 'action',
      labels: {
        en: 'Send to back',
        fr: 'Mettre à l\'arrière-plan'
      },
      tooltips: {
        en: 'Draw selected link(s) behind all other elements',
        fr: 'Afficher le(s) flux sélectionné(s) derrière tous les autres éléments'
      }
    },

    toggleNameVisibility: {
      type: 'toggle',
      labels: {
        en: 'Name label',
        fr: 'Libellé nom'
      },
      labelsToggle: {
        en: {
          true: 'Hide name label',
          false: 'Show name label'
        },
        fr: {
          true: 'Masquer libellé',
          false: 'Afficher libellé'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the name label',
        fr: 'Basculer la visibilité du libellé nom'
      },
      getToggleValue: 'toggleNameVisibilityValue',
      undoable: true
    },

    toggleValueVisibility: {
      type: 'toggle',
      labels: {
        en: 'Value label',
        fr: 'Libellé valeur'
      },
      labelsToggle: {
        en: {
          true: 'Hide value',
          false: 'Show value'
        },
        fr: {
          true: 'Masquer libellé',
          false: 'Afficher libellé'
        }
      },
      tooltips: {
        en: 'Toggle the visibility of the value label',
        fr: 'Basculer la visibilité du libellé valeur'
      },
      getToggleValue: 'toggleValueVisibilityValue',
      undoable: true
    }
  },

  sectionTitles: {
    EditStyle: {
      en: 'Edition',
      fr: 'Édition'
    },
    ChangePlan: {
      en: 'Change Layer',
      fr: 'Changer Plan'
    },
    MaskAttr: {
      en: 'Mask Attributes',
      fr: 'Affichage des éléments'
    },
    EditValue: {
      en: 'Edit Value',
      fr: 'Éditer Valeur'
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
    }
  }
}

export type LinkModifierType = ReturnType<typeof createLinkModifier>
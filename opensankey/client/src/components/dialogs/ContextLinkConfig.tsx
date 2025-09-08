import { MenuConfig } from "./SankeyMenuContext";
import { Class_ApplicationData } from "../../types/ApplicationData";
import { Class_LinkStyle } from "../../Elements/ElementStyle";
import { Class_LinkAttribute } from "../../Elements/LinkAttributes";

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
        en: 'Move to front',
        fr: 'Premier plan'
      },
      tooltips: {
        en: 'Move the selected link(s) to the front layer',
        fr: 'Déplacer le/les flux sélectionné(s) au premier plan'
      }
    },

    moveToLastPlan: {
      type: 'action',
      labels: {
        en: 'Move to back',
        fr: 'Arrière plan'
      },
      tooltips: {
        en: 'Move the selected link(s) to the back layer',
        fr: 'Déplacer le/les flux sélectionné(s) à l\'arrière plan'
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
          true: 'Masquer libellé nom',
          false: 'Afficher libellé nom'
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
          true: 'Hide value label',
          false: 'Show value label'
        },
        fr: {
          true: 'Masquer libellé valeur',
          false: 'Afficher libellé valeur'
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
  const selected_links = drawing_area.visible_and_selected_links_list

  const updateStyle = (sl: Class_LinkStyle) => {
    const dict_old_value: { [x: string]: Class_LinkStyle[] } = {}
    selected_links.forEach(l => {
      dict_old_value[l.id] = l.style
    })
    const _updateStyle = () => {
      selected_links.forEach(_ => {
        const flow_ref_has_style = selected_links[0].style.includes(sl) ?? false
        drawing_area.sankey.switchLinkStyle(sl, flow_ref_has_style)
      })
      refreshThisAndToggleSaving()
    }

    const inv_updateStyle = () => {
      selected_links.forEach(l => {
        l.style = dict_old_value[l.id]
      })
      refreshThisAndToggleSaving()
    }
    history.saveUndo(inv_updateStyle)
    history.saveRedo(_updateStyle)
    _updateStyle()
  }

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
      const dict_old_value: { [x: string]: Class_LinkAttribute } = {}
      selected_links.forEach(l => {
        dict_old_value[l.id] = l.display.attributes
      })

      const doReset = () => {
        selected_links.forEach(l => l.resetAttributes())
        refreshThisAndToggleSaving()
      }

      const undoReset = () => {
        selected_links.forEach(l => {
          l.display.attributes = dict_old_value[l.id]
        })
        refreshThisAndToggleSaving()
      }

      executeWithUndo(doReset, undoReset)
    },

    // Plan actions
    moveToFirstPlan: () => {
      drawing_area.selected_links_list.forEach(link => {
        const idx_to_shift = drawing_area.list_g_element.indexOf(link.id)
        drawing_area.moveOrderElementInDA(idx_to_shift, drawing_area.list_g_element.length - 1)
      })
    },

    moveToLastPlan: () => {
      drawing_area.selected_links_list.forEach(link => {
        const idx_to_shift = drawing_area.list_g_element.indexOf(link.id)
        drawing_area.moveOrderElementInDA(idx_to_shift, 0)
      })
    },

    // Visibility toggles
    toggleNameVisibility: () => {
      const dict_old_name: { [x: string]: Class_LinkAttribute } = {}
      selected_links.forEach(l => {
        dict_old_name[l.id] = Object.assign(Object.create(Object.getPrototypeOf(l.display.attributes)), l.display.attributes)
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
          l.display.attributes = dict_old_name[l.id]
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
      const dict_old_value: { [x: string]: Class_LinkAttribute } = {}
      selected_links.forEach(l => {
        dict_old_value[l.id] = Object.assign(Object.create(Object.getPrototypeOf(l.display.attributes)), l.display.attributes)
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
          l.display.attributes = dict_old_value[l.id]
          l.draw()
        })
        refreshThisAndToggleSaving()
      }

      executeWithUndo(doToggle, undoToggle)
    },

    toggleValueVisibilityValue: () => {
      return contextualised_link?.value_label_is_visible ?? false
    }
  }
}

export type LinkModifierType = ReturnType<typeof createLinkModifier>
import { MenuConfig, MenuAction, MenuStructureItem } from './SankeyMenuContext'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { StorageType } from '../../Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'

// === Droiture multi-ancrage (su-model/opensankey#665, refonte) ===
// Le menu « Rectitude » propose deux portées (« Flux uniquement », « Enfants ») et, pour
// chacune, un mode d'ancrage. Le mode est stocké dans `shape_straight_mode` ; la portée
// « Enfants » pose en plus `shape_straight_include_children`. 'absolute' est réservé (2e
// passe) et n'est donc pas listé ici. Actions et handlers sont générés par (portée, mode)
// pour rester DRY et i18n (les libellés alimentent l'autogen de traductions).
export const STRAIGHT_MENU_MODES = ['none', 'source', 'target', 'highest', 'lowest'] as const
export type Type_StraightMenuMode = typeof STRAIGHT_MENU_MODES[number]
type StraightScope = 'Flux' | 'Children'
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const straightActionKey = (scope: StraightScope, mode: Type_StraightMenuMode) =>
  `straight${scope}${capFirst(mode)}`

export const STRAIGHT_MODE_LABELS: Record<Type_StraightMenuMode, Record<string, string>> = {
  none: { en: 'Free', fr: 'Libre', es: 'Libre', de: 'Frei', it: 'Libero' },
  source: { en: 'Aligned to source', fr: 'En face de la source', es: 'Alineado al origen', de: 'An Quelle ausgerichtet', it: 'Allineato all\'origine' },
  target: { en: 'Aligned to target', fr: 'En face de la destination', es: 'Alineado al destino', de: 'An Ziel ausgerichtet', it: 'Allineato alla destinazione' },
  highest: { en: 'Highest of the two', fr: 'Le plus haut des deux', es: 'El más alto de los dos', de: 'Höchster der beiden', it: 'Il più alto dei due' },
  lowest: { en: 'Lowest of the two', fr: 'Le plus bas des deux', es: 'El más bajo de los dos', de: 'Niedrigster der beiden', it: 'Il più basso dei due' }
}
const STRAIGHT_MODE_TIPS: Record<Type_StraightMenuMode, Record<string, string>> = {
  none: { en: 'Release this flow (not kept straight).', fr: 'Libérer ce flux (non gardé droit).', es: 'Liberar este flujo (no mantenido recto).', de: 'Diesen Fluss lösen (nicht gerade gehalten).', it: 'Libera questo flusso (non mantenuto dritto).' },
  source: { en: 'Keep straight by aligning onto the source anchor (moves the target).', fr: 'Garder droit en alignant sur l\'accroche source (déplace la cible).', es: 'Mantener recto alineando sobre el anclaje del origen (mueve el destino).', de: 'Gerade halten durch Ausrichtung am Quell-Anker (verschiebt das Ziel).', it: 'Mantieni dritto allineando sull\'ancoraggio origine (sposta la destinazione).' },
  target: { en: 'Keep straight by aligning onto the target anchor (moves the source).', fr: 'Garder droit en alignant sur l\'accroche cible (déplace la source).', es: 'Mantener recto alineando sobre el anclaje del destino (mueve el origen).', de: 'Gerade halten durch Ausrichtung am Ziel-Anker (verschiebt die Quelle).', it: 'Mantieni dritto allineando sull\'ancoraggio destinazione (sposta l\'origine).' },
  highest: { en: 'Keep straight by aligning both anchors onto the highest of the two.', fr: 'Garder droit en alignant les deux accroches sur la plus haute des deux.', es: 'Mantener recto alineando ambos anclajes sobre el más alto de los dos.', de: 'Gerade halten durch Ausrichtung beider Anker am höchsten der beiden.', it: 'Mantieni dritto allineando entrambi gli ancoraggi sul più alto dei due.' },
  lowest: { en: 'Keep straight by aligning both anchors onto the lowest of the two.', fr: 'Garder droit en alignant les deux accroches sur la plus basse des deux.', es: 'Mantener recto alineando ambos anclajes sobre el más bajo de los dos.', de: 'Gerade halten durch Ausrichtung beider Anker am niedrigsten der beiden.', it: 'Mantieni dritto allineando entrambi gli ancoraggi sul più basso dei due.' }
}

// Boutons d'un sous-menu de portée (un par mode), liés à l'action générée correspondante.
const buildStraightButtons = (scope: StraightScope): MenuStructureItem[] =>
  STRAIGHT_MENU_MODES.map(mode => ({ type: 'button', actionName: straightActionKey(scope, mode) }))

// Une action toggle par (portée, mode) ; le libellé = libellé du mode (la portée vient du
// sous-menu parent). showCheck + getToggleValue affichent la coche du mode actif.
const buildStraightActions = (): Record<string, MenuAction> => {
  const acts: Record<string, MenuAction> = {}
  ;(['Flux', 'Children'] as StraightScope[]).forEach(scope => {
    STRAIGHT_MENU_MODES.forEach(mode => {
      const key = straightActionKey(scope, mode)
      acts[key] = {
        type: 'toggle',
        labels: STRAIGHT_MODE_LABELS[mode],
        tooltips: STRAIGHT_MODE_TIPS[mode],
        getToggleValue: `${key}Value`,
        showCheck: true,
        closeMenuAfter: true,
        undoable: true
      }
    })
  })
  return acts
}

export const LINK_MENU_CONFIG: MenuConfig = {
  structure: [
    {
      type: 'submenu',
      titleKey: 'EditStyle',
      children: [
        { type: 'widget', widgetName: 'MenuContextLinksData', widgetProps: {} },
        { type: 'button', actionName: 'resetAttr' },
        {
          type: 'button',
          actionName: 'applyStyleToChildren',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => {
              const l = app_data.drawing_area.link_contextualised
              return !!l && (l.source.is_parent || l.target.is_parent)
            }
          }]
        },
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
      type: 'submenu',
      titleKey: 'Straightness',
      children: [
        {
          type: 'submenu',
          titleKey: 'StraightnessFlux',
          children: buildStraightButtons('Flux')
        },
        {
          type: 'submenu',
          titleKey: 'StraightnessChildren',
          children: buildStraightButtons('Children')
        }
      ]
    },
    {
      type: 'button',
      actionName: 'setReferenceFlux',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          const m = app_data.drawing_area.sankey.default_style.shape_position_type
          return m === 'proportional' || m === 'scale_adapted'
        }
      }]
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

    // Droiture multi-ancrage : une action toggle par (portée, mode), générée.
    ...buildStraightActions(),

    setReferenceFlux: {
      type: 'toggle',
      labels: {
        en: 'Reference flow (proportional)',
        fr: 'Flux de référence (proportionnel)',
        es: 'Flujo de referencia (proporcional)',
        de: 'Referenzfluss (proportional)',
        it: 'Flusso di riferimento (proporzionale)'
      },
      labelsToggle: {
        en: { true: 'Unset reference flow', false: 'Set as reference flow' },
        fr: { true: 'Retirer le flux de référence', false: 'Définir comme flux de référence' },
        es: { true: 'Quitar flujo de referencia', false: 'Definir como flujo de referencia' },
        de: { true: 'Referenzfluss entfernen', false: 'Als Referenzfluss festlegen' },
        it: { true: 'Rimuovi flusso di riferimento', false: 'Imposta come flusso di riferimento' }
      },
      tooltips: {
        en: 'In proportional mode, anchor the diagram center of gravity on this flow and scale everything by this flow\'s thickness ratio across data tags.',
        fr: 'En mode proportionnel, ancrer le centre de gravité du diagramme sur ce flux et dimensionner tout le reste selon le ratio d\'épaisseur de ce flux entre les tags de données.',
        es: 'En modo proporcional, anclar el centro de gravedad del diagrama en este flujo y escalar todo según la relación de grosor de este flujo entre las etiquetas de datos.',
        de: 'Im proportionalen Modus den Schwerpunkt des Diagramms an diesem Fluss verankern und alles anhand des Dickenverhältnisses dieses Flusses über die Daten-Tags skalieren.',
        it: 'In modalità proporzionale, ancorare il baricentro del diagramma a questo flusso e ridimensionare tutto in base al rapporto di spessore di questo flusso tra i tag di dati.'
      },
      getToggleValue: 'setReferenceFluxValue',
      closeMenuAfter: true
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

    applyStyleToChildren: {
      type: 'action',
      labels: {
        en: 'Apply style to children',
        fr: 'Appliquer le style aux enfants',
        es: 'Aplicar estilo a los hijos',
        de: 'Stil auf Kinder anwenden',
        it: 'Applica stile ai figli'
      },
      tooltips: {
        en: 'Copy this flow\'s style and attributes onto all child flows between the source\'s and target\'s child nodes',
        fr: 'Copier le style et les attributs de ce flux sur tous les flux enfants reliant les nœuds enfants de la source et de la cible',
        es: 'Copiar el estilo y los atributos de este flujo en todos los flujos hijos entre los nodos hijos del origen y del destino',
        de: 'Stil und Attribute dieses Flusses auf alle Kind-Flüsse zwischen den Kindknoten von Quelle und Ziel kopieren',
        it: 'Copia lo stile e gli attributi di questo flusso su tutti i flussi figli tra i nodi figli dell\'origine e della destinazione'
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
    },
    Straightness: {
      en: 'Straightness',
      fr: 'Rectitude',
      es: 'Rectitud',
      de: 'Geradheit',
      it: 'Rettitudine'
    },
    StraightnessFlux: {
      en: 'Flow only',
      fr: 'Flux uniquement',
      es: 'Solo el flujo',
      de: 'Nur Fluss',
      it: 'Solo flusso'
    },
    StraightnessChildren: {
      en: 'Children',
      fr: 'Enfants',
      es: 'Hijos',
      de: 'Kinder',
      it: 'Figli'
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

  // === Droiture multi-ancrage (#665, refonte) ===
  // Pose le mode d'ancrage (`shape_straight_mode`) du flux cliqué et, selon la portée,
  // la propagation aux enfants (`shape_straight_include_children`). On garde le drapeau
  // legacy `shape_must_stay_straight` en phase (= mode ≠ 'none') pour la rétrocompat.
  // L'application/maintien réel est fait par NodePositioning.enforceStraightLinks à chaque
  // draw. Undo : on restaure les 3 attributs + les position_y/dy des nœuds visibles.
  const applyStraightMode = (scope: StraightScope, mode: Type_StraightMenuMode) => {
    const link = contextualised_link
    if (!link) return
    const include = scope === 'Children' && mode !== 'none'
    const old = {
      mode: link.shape_straight_mode,
      include: link.shape_straight_include_children,
      legacy: link.shape_must_stay_straight
    }
    const saved = drawing_area.sankey.visible_nodes_list.map(n => ({
      n, y: n.position_y, dy: n.shape_position_dy
    }))
    const doApply = () => {
      link.shape_straight_mode = mode
      link.shape_straight_include_children = include
      link.shape_must_stay_straight = mode !== 'none'
      drawing_area.drawElements()
      refreshThisAndToggleSaving()
    }
    const undoApply = () => {
      link.shape_straight_mode = old.mode
      link.shape_straight_include_children = old.include
      link.shape_must_stay_straight = old.legacy
      saved.forEach(({ n, y, dy }) => { n.position_y = y; n.shape_position_dy = dy })
      drawing_area.drawElements()
      refreshThisAndToggleSaving()
    }
    executeWithUndo(doApply, undoApply)
  }

  // Coche du mode actif. 'none' (« Libre ») n'est coché que dans le sous-menu « Flux »
  // quand le flux est libre. Sinon : mode courant ET portée concordante (include_children).
  const isStraightModeActive = (scope: StraightScope, mode: Type_StraightMenuMode): boolean => {
    const link = contextualised_link
    if (!link) return false
    const m = link.shape_straight_mode ?? 'none'
    const include = link.shape_straight_include_children ?? false
    if (mode === 'none') return scope === 'Flux' && m === 'none'
    return m === mode && (scope === 'Children' ? include : !include)
  }

  const straightHandlers: Record<string, (() => void) | (() => boolean)> = {}
  ;(['Flux', 'Children'] as StraightScope[]).forEach(scope => {
    STRAIGHT_MENU_MODES.forEach(mode => {
      const key = straightActionKey(scope, mode)
      straightHandlers[key] = () => applyStraightMode(scope, mode)
      straightHandlers[`${key}Value`] = () => isStraightModeActive(scope, mode)
    })
  })

  return {
    ...straightHandlers,

    // Actions simples
    inverseIO: () => {
      drawing_area.inverseSelectedLinks()
    },

    // #1231 — Mode proportionnel : désigner/retirer ce flux comme flux de référence. La
    // médiane (centre de gravité) se cale sur le centre vertical du flux et le facteur de
    // compression devient le ratio d'épaisseur de ce flux entre datatags. Transitoire :
    // re-capture la référence puis redessine (f = 1 au moment de la sélection → pas de saut).
    setReferenceFlux: () => {
      const link = contextualised_link
      if (!link) return
      const np = drawing_area.nodePositioning
      const is_ref = np.proportionalReferenceLink === link
      np.setProportionalReferenceLink(is_ref ? undefined : link)
      // Le même flux sert aux deux modes (proportionnel + échelle). On reste cohérent quel
      // que soit le mode courant : à la sélection, re-capturer les deux références ; au
      // retrait, restaurer l'échelle de base (échelle adaptée) en plus de la re-capture %.
      if (is_ref) {
        np.clearScaleAdaptation()
      } else {
        np.captureScaleReference()
      }
      np.captureProportionalReference()
      drawing_area.drawElements()
      refreshThisAndToggleSaving()
    },

    setReferenceFluxValue: () => {
      return drawing_area.nodePositioning.proportionalReferenceLink === contextualised_link
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

    // Propage le style du flux contextualisé à ses flux enfants (flux entre les
    // descendants de la source et ceux de la cible). Undo/redo géré dans
    // applyStyleToLinkChildren.
    applyStyleToChildren: () => {
      if (!contextualised_link) return
      drawing_area.applyStyleToLinkChildren(contextualised_link)
      refreshThisAndToggleSaving()
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
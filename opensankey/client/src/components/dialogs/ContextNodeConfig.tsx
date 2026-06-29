import { MenuConfig } from './SankeyMenuContext'


export const STATIC_NODE_MENU_CONFIG: MenuConfig = {
  structure: [
    {
      type: 'button',
      actionName: 'aggregate',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          const selected_nodes = app_data.drawing_area.selected_nodes_list
          return selected_nodes.length === 1 && selected_nodes[0].is_child
        }
      }]
    },
    {
      type: 'button',
      actionName: 'disaggregate',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          const selected_nodes = app_data.drawing_area.selected_nodes_list
          return selected_nodes.length === 1 && selected_nodes[0].is_parent
        }
      }]
    },
    { type: 'button', actionName: 'startAnimation',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          const selected_nodes = app_data.drawing_area.selected_nodes_list
          return selected_nodes.length === 1 && selected_nodes[0].hasOutputLinks()
        }
      }]
    },
  ],
  actions: {
    aggregate: {
      type: 'action',
      labels: { en: 'Aggregate', fr: 'Agréger', es: 'Agregar', de: 'Aggregieren', it: 'Aggregare' },
      tooltips: { en: 'Aggregate this node', fr: 'Agréger ce nœud', es: 'Agregar este nodo', de: 'Diesen Knoten aggregieren', it: 'Aggregare questo nodo' },
      undoable: true,
      closeMenuAfter: true
    },
    disaggregate: {
      type: 'action',
      labels: { en: 'Disaggregate', fr: 'Désagréger', es: 'Desagregar', de: 'Disaggregieren', it: 'Disaggregare' },
      tooltips: { en: 'Disaggregate this node', fr: 'Désagréger ce nœud', es: 'Desagregar este nodo', de: 'Diesen Knoten disaggregieren', it: 'Disaggregare questo nodo' },
      undoable: true,
      closeMenuAfter: true
    },
    startAnimation: {
      type: 'action',
      labels: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione' },
      tooltips: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione' },
      closeMenuAfter: true
    }
  },

  sectionTitles: {},
  maxDepth: 0
}
// Configuration du menu contextuel des nœuds avec la structure hiérarchique correcte
export const NODE_MENU_CONFIG: MenuConfig = {
  structure: [
    // Navigation hiérarchie (agrégation/désagrégation) — aplatie en tête de menu
    {
      type: 'submenu',
      titleKey: 'navHierarchy',
      visibilityConditions: [
        {
          type: 'custom',
          customCheck: (app_data) => {
            const node = app_data.drawing_area.node_contextualised
            if (!node) return false

            const child_dims = node.dimensions_as_child
            const parent_dims = node.dimensions_as_parent

            return (child_dims?.length > 0) ||
              (parent_dims?.length > 0) ||
              parent_dims.some(d => d.is_expanded)
          }
        }
      ],
      children: [
        {
          type: 'button',
          actionName: 'contractLeft',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                if (!app_data.has_sankey_dev) return false
                const node = app_data.drawing_area.node_contextualised
                return !!node?.dimensions_as_parent.some(d => d.expanded_left)
              }
            }
          ]
        },
        {
          type: 'button',
          actionName: 'contractRight',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                if (!app_data.has_sankey_dev) return false
                const node = app_data.drawing_area.node_contextualised
                return !!node?.dimensions_as_parent.some(d => d.expanded_right)
              }
            }
          ]
        }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'editStyle',
      children: [
        { type: 'button', actionName: 'editName' },
        { type: 'button', actionName: 'resetAttr' },
        {
          type: 'button',
          actionName: 'applyStyleToChildren',
          // Visible dès qu'au moins un nœud parent est sélectionné : l'action
          // propage le style de CHAQUE nœud parent sélectionné à ses propres
          // enfants (multi-sélection supportée).
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) =>
                app_data.drawing_area.selected_nodes_list.some(n => n.is_parent)
            }
          ]
        },
        { type: 'widget', widgetName: 'ButtonNodeContextAssignStyle' }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'maskAttr',
      children: [
        { type: 'button', actionName: 'toggleShapeVisibility' },
        { type: 'button', actionName: 'toggleNameVisibility' },
        { type: 'button', actionName: 'toggleValueVisibility' },
        { type: 'button', actionName: 'moveToFirstPlan' },
        { type: 'button', actionName: 'moveToLastPlan' },
        { type: 'button', actionName: 'setGlobalMaxNodeToCurrent' },
        {
          type: 'button',
          actionName: 'clearGlobalMaxNode',
          visibilityConditions: [{
            type: 'custom',
            customCheck: (app_data) => app_data.drawing_area.maximum_node !== undefined
          }]
        }
      ]
    },
    // Edition hiérarchie (création de dimensions et liens)
    {
      type: 'submenu',
      titleKey: 'editionHierarchy',
      children: [
        {
          type: 'button',
          actionName: 'createFluxOnChildren',
          visibilityConditions: [
            { type: 'nodeCount', operator: '==', value: 1 },
            { type: 'nodeProperty', property: 'is_parent', operator: '==', value: true }
          ]
        },
        {
          type: 'submenu',
          titleKey: 'setChild',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                const selected_nodes = app_data.drawing_area.selected_nodes_list
                const expand_left = selected_nodes.length > 0 ? selected_nodes[0].output_links_list.length == 0 : true
                const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
                const source_or_target_attr = expand_left ? 'source' : 'target'

                let possible_root_nodes: Set<string> = new Set()
                selected_nodes.forEach(n => {
                  if (possible_root_nodes.size !== 0) {
                    possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
                      .intersection(possible_root_nodes)
                  } else {
                    possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
                  }
                })
                return possible_root_nodes.size > 0
              }
            }
          ],
          children: [
            {
              type: 'button',
              actionName: 'createNewDimension'
            }
            // Les dimensions existantes seront générées dynamiquement par setChild_${dimension.id}
          ]
        },
        {
          type: 'submenu',
          titleKey: 'createParent',
          children: [
            {
              type: 'button',
              actionName: 'createNewDimensionForParent'
            }
            // Les dimensions existantes seront générées dynamiquement par createParent_${dimension.id}
          ]
        }
      ],
      visibilityConditions: [
        {
          type: 'custom',
          customCheck: (app_data) => {
            if (!app_data.has_sankey_dev) return false
            return true
          }
        }
      ]
    },


    // Reste du menu (alignement, style, etc.)
    {
      type: 'submenu',
      titleKey: 'align',
      // L'alignement opère sur les nœuds ET les zones de texte sélectionnés :
      // afficher la section dès qu'au moins deux de ces éléments sont sélectionnés
      // (ex. 1 nœud + 1 zone de texte).
      visibilityConditions: [
        {
          type: 'custom',
          customCheck: (app_data) =>
            app_data.drawing_area.selected_nodes_list.length +
            app_data.drawing_area.selected_containers_list.length > 1
        }
      ],
      children: [
        {
          type: 'submenu',
          titleKey: 'alignHorizontal',
          children: [
            { type: 'button', actionName: 'alignHorizMinLeft' },
            { type: 'button', actionName: 'alignHorizMinCenter' },
            { type: 'button', actionName: 'alignHorizMinRight' },
            { type: 'button', actionName: 'alignHorizMaxLeft' },
            { type: 'button', actionName: 'alignHorizMaxCenter' },
            { type: 'button', actionName: 'alignHorizMaxRight' }
          ]
        },
        {
          type: 'submenu',
          titleKey: 'alignVertical',
          children: [
            { type: 'button', actionName: 'alignVertMinTop' },
            { type: 'button', actionName: 'alignVertMinCenter' },
            { type: 'button', actionName: 'alignVertMinBottom' },
            { type: 'button', actionName: 'alignVertMaxTop' },
            { type: 'button', actionName: 'alignVertMaxCenter' },
            { type: 'button', actionName: 'alignVertMaxBottom' }
          ]
        }
      ]
    },
    {
      type: 'submenu',
      titleKey: 'associatedElements',
      children: [
        { type: 'button', actionName: 'createTiedZdt' },
        {
          type: 'button',
          actionName: 'setTiedFrame',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                const node = app_data.drawing_area.node_contextualised
                return !!node && !node.tied_to_nodes
              }
            }
          ]
        },
        {
          type: 'button',
          actionName: 'unsetTiedFrame',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                const node = app_data.drawing_area.node_contextualised
                return !!node && node.tied_to_nodes
              }
            }
          ]
        },
        {
          type: 'button',
          actionName: 'fitFrameToAttached',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                const node = app_data.drawing_area.node_contextualised
                return !!node && node.tied_to_nodes && node.attached_node.length > 0
              }
            }
          ]
        },
        { type: 'button', actionName: 'reorg' },
        { type: 'button', actionName: 'selectOutputLinks' },
        { type: 'button', actionName: 'selectInputLinks' }
      ]
    },
    // Stock values (has_sankey_dev + has_stock)
    {
      type: 'submenu',
      titleKey: 'stockValues',
      visibilityConditions: [
        {
          type: 'custom',
          customCheck: (app_data) => {
            if (!app_data.has_sankey_dev) return false
            const node = app_data.drawing_area.node_contextualised
            return !!node?.has_stock
          }
        }
      ],
      children: [
        { type: 'widget', widgetName: 'MenuContextNodeStock' }
      ]
    },
    // #1231b — Stock de référence (mode proportionnel / échelle adaptée). Disponible dès
    // qu'un mode de position « ancré » est actif et que le nœud porte un stock.
    {
      type: 'button',
      actionName: 'setReferenceStock',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          const node = app_data.drawing_area.node_contextualised
          if (!node?.has_stock) return false
          const m = app_data.drawing_area.sankey.default_style.shape_position_type
          return m === 'absolute' || m === 'proportional' || m === 'scale_adapted'
        }
      }]
    },
    { type: 'button', actionName: 'startAnimation' },
    { type: 'button', actionName: 'copyElement' },
    {
      type: 'button',
      actionName: 'saveNodeImage',
      visibilityConditions: [{
        type: 'custom',
        customCheck: (app_data) => {
          const node = app_data.drawing_area.node_contextualised
          return !!node?.icon_is_image && !!node?.icon_image_src
        }
      }]
    }
  ],

  actions: {
    // Actions de hiérarchie
    createFluxOnChildren: {
      type: 'action',
      labels: { en: 'Create child flows', fr: 'Créer les flux enfants', es: 'Crear flujos hijos', de: 'Kind-Flüsse erstellen', it: 'Crea flussi figli' },
      tooltips: { en: 'Create flows on child nodes', fr: 'Créer des flux sur les nœuds enfants', es: 'Crear flujos en los nodos hijos', de: 'Flüsse auf Kindknoten erstellen', it: 'Creare flussi sui nodi figli' },
      undoable: true
    },

    createNewDimension: {
      type: 'action',
      labels: { en: 'New dimension', fr: 'Nouvelle dimension', es: 'Nueva dimensión', de: 'Neue Dimension', it: 'Nuova dimensione' },
      tooltips: { en: 'Create a new dimension', fr: 'Créer une nouvelle dimension', es: 'Crear una nueva dimensión', de: 'Eine neue Dimension erstellen', it: 'Creare una nuova dimensione' }
    },

    createNewDimensionForParent: {
      type: 'action',
      labels: { en: 'New dimension', fr: 'Nouvelle dimension', es: 'Nueva dimensión', de: 'Neue Dimension', it: 'Nuova dimensione' },
      tooltips: { en: 'Create a new dimension for parent', fr: 'Créer une nouvelle dimension pour parent', es: 'Crear una nueva dimensión para el padre', de: 'Eine neue Dimension für den Elternknoten erstellen', it: 'Creare una nuova dimensione per il genitore' }
    },

    // Actions d'agrégation
    aggregate: {
      type: 'action',
      labels: { en: 'Aggregate', fr: 'Agréger', es: 'Agregar', de: 'Aggregieren', it: 'Aggregare' },
      tooltips: { en: 'Aggregate this node', fr: 'Agréger ce nœud', es: 'Agregar este nodo', de: 'Diesen Knoten aggregieren', it: 'Aggregare questo nodo' },
      undoable: true,
      closeMenuAfter: true
    },

    aggregateLeft: {
      type: 'action',
      labels: { en: 'Left expansion', fr: 'Expansion à gauche', es: 'Expansión izquierda', de: 'Expansion links', it: 'Espansione a sinistra' },
      tooltips: { en: 'Aggregate with left expansion', fr: 'Agréger avec expansion à gauche', es: 'Agregar con expansión izquierda', de: 'Aggregieren mit Expansion nach links', it: 'Aggregare con espansione a sinistra' },
      closeMenuAfter: true
    },

    aggregateRight: {
      type: 'action',
      labels: { en: 'Right expansion', fr: 'Expansion à droite', es: 'Expansión derecha', de: 'Expansion rechts', it: 'Espansione a destra' },
      tooltips: { en: 'Aggregate with right expansion', fr: 'Agréger avec expansion à droite', es: 'Agregar con expansión derecha', de: 'Aggregieren mit Expansion nach rechts', it: 'Aggregare con espansione a destra' },
      closeMenuAfter: true
    },

    // Actions de désagrégation
    disaggregate: {
      type: 'action',
      labels: { en: 'Disaggregate', fr: 'Désagréger', es: 'Desagregar', de: 'Disaggregieren', it: 'Disaggregare' },
      tooltips: { en: 'Disaggregate this node', fr: 'Désagréger ce nœud', es: 'Desagregar este nodo', de: 'Diesen Knoten disaggregieren', it: 'Disaggregare questo nodo' },
      undoable: true,
      closeMenuAfter: true
    },

    expandLeft: {
      type: 'action',
      labels: { en: 'Left expansion', fr: 'Expansion à gauche', es: 'Expansión izquierda', de: 'Expansion links', it: 'Espansione a sinistra' },
      tooltips: { en: 'Expand to the left', fr: 'Expansion vers la gauche', es: 'Expandir hacia la izquierda', de: 'Nach links expandieren', it: 'Espandere a sinistra' },
      closeMenuAfter: true
    },

    expandRight: {
      type: 'action',
      labels: { en: 'Right expansion', fr: 'Expansion à droite', es: 'Expansión derecha', de: 'Expansion rechts', it: 'Espansione a destra' },
      tooltips: { en: 'Expand to the right', fr: 'Expansion vers la droite', es: 'Expandir hacia la derecha', de: 'Nach rechts expandieren', it: 'Espandere a destra' },
      closeMenuAfter: true
    },

    // Actions de contraction
    contractLeft: {
      type: 'action',
      labels: { en: 'Contract right', fr: 'Réduire à droite', es: 'Contraer a la derecha', de: 'Nach rechts reduzieren', it: 'Contrarre a destra' },
      tooltips: { en: 'Contract to the right', fr: 'Réduire vers la droite', es: 'Contraer hacia la derecha', de: 'Nach rechts reduzieren', it: 'Contrarre verso destra' },
      closeMenuAfter: true
    },

    contractRight: {
      type: 'action',
      labels: { en: 'Contract left', fr: 'Réduire à gauche', es: 'Contraer a la izquierda', de: 'Nach links reduzieren', it: 'Contrarre a sinistra' },
      tooltips: { en: 'Contract to the left', fr: 'Réduire vers la gauche', es: 'Contraer hacia la izquierda', de: 'Nach links reduzieren', it: 'Contrarre verso sinistra' },
      closeMenuAfter: true
    },

    // Issue #1225 — contracter l'expansion d'un parent depuis le menu d'un
    // enfant (bouton ← Parent qui défait l'expansion).
    contractParent: {
      type: 'action',
      labels: { en: 'Contract', fr: 'Réduire', es: 'Contraer', de: 'Reduzieren', it: 'Contrarre' },
      tooltips: { en: 'Contract the parent expansion', fr: 'Annuler l\'expansion du parent', es: 'Anular la expansión del padre', de: 'Eltern-Expansion aufheben', it: 'Annullare l\'espansione del genitore' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions de mode englobant (parent entoure les enfants, flux filtrés par côté)
    containerInChildrenOutParent: {
      type: 'action',
      labels: {
        en: 'Enclose (inputs → children, outputs ← parent)',
        fr: 'Englober (entrées → enfants, sorties ← parent)',
        es: 'Englobar (entradas → hijos, salidas ← padre)',
        de: 'Umschließen (Eingänge → Kinder, Ausgänge ← Eltern)',
        it: 'Racchiudere (ingressi → figli, uscite ← genitore)'
      },
      tooltips: {
        en: 'Parent surrounds children; incoming links land on children, outgoing links leave from parent',
        fr: 'Le parent entoure les enfants ; les flux entrants vont sur les enfants, les flux sortants partent du parent',
        es: 'El padre rodea a los hijos; los flujos entrantes llegan a los hijos, los flujos salientes parten del padre',
        de: 'Elternknoten umschließt Kinder; eingehende Flüsse landen auf Kindern, ausgehende Flüsse gehen vom Elternknoten',
        it: 'Il genitore circonda i figli; i flussi in ingresso arrivano ai figli, i flussi in uscita partono dal genitore'
      },
      undoable: true,
      closeMenuAfter: true
    },

    containerInParentOutChildren: {
      type: 'action',
      labels: {
        en: 'Enclose (inputs → parent, outputs ← children)',
        fr: 'Englober (entrées → parent, sorties ← enfants)',
        es: 'Englobar (entradas → padre, salidas ← hijos)',
        de: 'Umschließen (Eingänge → Eltern, Ausgänge ← Kinder)',
        it: 'Racchiudere (ingressi → genitore, uscite ← figli)'
      },
      tooltips: {
        en: 'Parent surrounds children; incoming links land on parent, outgoing links leave from children',
        fr: 'Le parent entoure les enfants ; les flux entrants vont sur le parent, les flux sortants partent des enfants',
        es: 'El padre rodea a los hijos; los flujos entrantes llegan al padre, los flujos salientes parten de los hijos',
        de: 'Elternknoten umschließt Kinder; eingehende Flüsse landen auf Elternknoten, ausgehende Flüsse gehen von Kindern',
        it: 'Il genitore circonda i figli; i flussi in ingresso arrivano al genitore, i flussi in uscita partono dai figli'
      },
      undoable: true,
      closeMenuAfter: true
    },

    containerInChildrenOutChildren: {
      type: 'action',
      labels: {
        en: 'Enclose (inputs → children, outputs ← children)',
        fr: 'Englober (entrées → enfants, sorties ← enfants)',
        es: 'Englobar (entradas → hijos, salidas ← hijos)',
        de: 'Umschließen (Eingänge → Kinder, Ausgänge ← Kinder)',
        it: 'Racchiudere (ingressi → figli, uscite ← figli)'
      },
      tooltips: {
        en: 'Parent surrounds children as a pure visual envelope; all incoming and outgoing links land on the children',
        fr: 'Le parent entoure les enfants comme une enveloppe visuelle ; tous les flux entrants et sortants vont sur les enfants',
        es: 'El padre rodea a los hijos como una envoltura visual; todos los flujos entrantes y salientes llegan a los hijos',
        de: 'Elternknoten umschließt Kinder als reine visuelle Hülle; alle eingehenden und ausgehenden Flüsse landen auf den Kindern',
        it: 'Il genitore circonda i figli come pura busta visiva; tutti i flussi in ingresso e in uscita arrivano sui figli'
      },
      undoable: true,
      closeMenuAfter: true
    },

    containerInParentOutParent: {
      type: 'action',
      labels: {
        en: 'Enclose (inputs → parent, outputs ← parent)',
        fr: 'Englober (entrées → parent, sorties ← parent)',
        es: 'Englobar (entradas → padre, salidas ← padre)',
        de: 'Umschließen (Eingänge → Eltern, Ausgänge ← Eltern)',
        it: 'Racchiudere (ingressi → genitore, uscite ← genitore)'
      },
      tooltips: {
        en: 'Parent surrounds children; all incoming and outgoing links land on the parent — children are visible inside the envelope but carry no flux of their own',
        fr: 'Le parent entoure les enfants ; tous les flux entrants et sortants vont sur le parent — les enfants sont visibles dans l\'enveloppe mais n\'ont aucun flux propre',
        es: 'El padre rodea a los hijos; todos los flujos entrantes y salientes llegan al padre — los hijos son visibles dentro de la envoltura pero no llevan flujo propio',
        de: 'Elternknoten umschließt Kinder; alle eingehenden und ausgehenden Flüsse landen auf dem Elternknoten — Kinder sind innerhalb der Hülle sichtbar, tragen aber keinen eigenen Fluss',
        it: 'Il genitore circonda i figli; tutti i flussi in ingresso e in uscita arrivano sul genitore — i figli sono visibili dentro la busta ma non portano flusso proprio'
      },
      undoable: true,
      closeMenuAfter: true
    },

    unsetContainerMode: {
      type: 'action',
      labels: { en: 'Exit enclosing mode', fr: 'Quitter mode englobant', es: 'Salir del modo englobante', de: 'Umschließungsmodus verlassen', it: 'Uscire dalla modalità di contenimento' },
      tooltips: {
        en: 'Leave the enclosing display mode',
        fr: 'Quitter le mode d\'affichage englobant',
        es: 'Salir del modo de visualización englobante',
        de: 'Den umschließenden Anzeigemodus verlassen',
        it: 'Uscire dalla modalità di visualizzazione di contenimento'
      },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement horizontal - Référence = nœud le plus à gauche
    alignHorizMinLeft: {
      type: 'action',
      labels: { en: '←▌□', fr: '←▌□', es: '←▌□', de: '←▌□', it: '←▌□' },
      tooltips: { en: 'Align to left edge of leftmost node', fr: 'Aligner sur le bord gauche du nœud le plus à gauche', es: 'Alinear al borde izquierdo del nodo más a la izquierda', de: 'Am linken Rand des am weitesten links liegenden Knotens ausrichten', it: 'Allinea al bordo sinistro del nodo più a sinistra' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMinCenter: {
      type: 'action',
      labels: { en: '←▐□▌', fr: '←▐□▌', es: '←▐□▌', de: '←▐□▌', it: '←▐□▌' },
      tooltips: { en: 'Align to center of leftmost node', fr: 'Aligner sur le centre du nœud le plus à gauche', es: 'Alinear al centro del nodo más a la izquierda', de: 'An der Mitte des am weitesten links liegenden Knotens ausrichten', it: 'Allinea al centro del nodo più a sinistra' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMinRight: {
      type: 'action',
      labels: { en: '←□▐', fr: '←□▐', es: '←□▐', de: '←□▐', it: '←□▐' },
      tooltips: { en: 'Align to right edge of leftmost node', fr: 'Aligner sur le bord droit du nœud le plus à gauche', es: 'Alinear al borde derecho del nodo más a la izquierda', de: 'Am rechten Rand des am weitesten links liegenden Knotens ausrichten', it: 'Allinea al bordo destro del nodo più a sinistra' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement horizontal - Référence = nœud le plus à droite
    alignHorizMaxLeft: {
      type: 'action',
      labels: { en: '▌□→', fr: '▌□→', es: '▌□→', de: '▌□→', it: '▌□→' },
      tooltips: { en: 'Align to left edge of rightmost node', fr: 'Aligner sur le bord gauche du nœud le plus à droite', es: 'Alinear al borde izquierdo del nodo más a la derecha', de: 'Am linken Rand des am weitesten rechts liegenden Knotens ausrichten', it: 'Allinea al bordo sinistro del nodo più a destra' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMaxCenter: {
      type: 'action',
      labels: { en: '▐□▌→', fr: '▐□▌→', es: '▐□▌→', de: '▐□▌→', it: '▐□▌→' },
      tooltips: { en: 'Align to center of rightmost node', fr: 'Aligner sur le centre du nœud le plus à droite', es: 'Alinear al centro del nodo más a la derecha', de: 'An der Mitte des am weitesten rechts liegenden Knotens ausrichten', it: 'Allinea al centro del nodo più a destra' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMaxRight: {
      type: 'action',
      labels: { en: '□▐→', fr: '□▐→', es: '□▐→', de: '□▐→', it: '□▐→' },
      tooltips: { en: 'Align to right edge of rightmost node', fr: 'Aligner sur le bord droit du nœud le plus à droite', es: 'Alinear al borde derecho del nodo más a la derecha', de: 'Am rechten Rand des am weitesten rechts liegenden Knotens ausrichten', it: 'Allinea al bordo destro del nodo più a destra' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement vertical - Référence = nœud le plus haut
    // Actions d'alignement vertical - Référence = nœud le plus haut
    alignVertMinTop: {
      type: 'action',
      labels: { en: '↑▀', fr: '↑▀', es: '↑▀', de: '↑▀', it: '↑▀' },
      tooltips: { en: 'Align to top edge of topmost node', fr: 'Aligner sur le bord haut du nœud le plus haut', es: 'Alinear al borde superior del nodo más arriba', de: 'Am oberen Rand des obersten Knotens ausrichten', it: 'Allinea al bordo superiore del nodo più in alto' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMinCenter: {
      type: 'action',
      labels: { en: '↑▄▀', fr: '↑▄▀', es: '↑▄▀', de: '↑▄▀', it: '↑▄▀' },
      tooltips: { en: 'Align to center of topmost node', fr: 'Aligner sur le centre du nœud le plus haut', es: 'Alinear al centro del nodo más arriba', de: 'An der Mitte des obersten Knotens ausrichten', it: 'Allinea al centro del nodo più in alto' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMinBottom: {
      type: 'action',
      labels: { en: '↑▄', fr: '↑▄', es: '↑▄', de: '↑▄', it: '↑▄' },
      tooltips: { en: 'Align to bottom edge of topmost node', fr: 'Aligner sur le bord bas du nœud le plus haut', es: 'Alinear al borde inferior del nodo más arriba', de: 'Am unteren Rand des obersten Knotens ausrichten', it: 'Allinea al bordo inferiore del nodo più in alto' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement vertical - Référence = nœud le plus bas
    alignVertMaxTop: {
      type: 'action',
      labels: { en: '▀↓', fr: '▀↓', es: '▀↓', de: '▀↓', it: '▀↓' },
      tooltips: { en: 'Align to top edge of bottommost node', fr: 'Aligner sur le bord haut du nœud le plus bas', es: 'Alinear al borde superior del nodo más abajo', de: 'Am oberen Rand des untersten Knotens ausrichten', it: 'Allinea al bordo superiore del nodo più in basso' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMaxCenter: {
      type: 'action',
      labels: { en: '▄▀↓', fr: '▄▀↓', es: '▄▀↓', de: '▄▀↓', it: '▄▀↓' },
      tooltips: { en: 'Align to center of bottommost node', fr: 'Aligner sur le centre du nœud le plus bas', es: 'Alinear al centro del nodo más abajo', de: 'An der Mitte des untersten Knotens ausrichten', it: 'Allinea al centro del nodo più in basso' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMaxBottom: {
      type: 'action',
      labels: { en: '▄↓', fr: '▄↓', es: '▄↓', de: '▄↓', it: '▄↓' },
      tooltips: { en: 'Align to bottom edge of bottommost node', fr: 'Aligner sur le bord bas du nœud le plus bas', es: 'Alinear al borde inferior del nodo más abajo', de: 'Am unteren Rand des untersten Knotens ausrichten', it: 'Allinea al bordo inferiore del nodo più in basso' },
      undoable: true,
      closeMenuAfter: true
    },
    // Actions de visibilité avec toggle
    toggleShapeVisibility: {
      type: 'toggle',
      labels: { en: 'Shape', fr: 'Forme', es: 'Forma', de: 'Form', it: 'Forma' },
      tooltips: { en: 'Toggle shape visibility', fr: 'Basculer la visibilité de la forme', es: 'Alternar la visibilidad de la forma', de: 'Sichtbarkeit der Form umschalten', it: 'Attiva/disattiva la visibilità della forma' },
      labelsToggle: {
        en: { true: 'Hide shape', false: 'Show shape' },
        fr: { true: 'Masquer le nœud', false: 'Afficher le nœud' },
        es: { true: 'Ocultar forma', false: 'Mostrar forma' },
        de: { true: 'Form ausblenden', false: 'Form einblenden' },
        it: { true: 'Nascondi forma', false: 'Mostra forma' }
      },
      getToggleValue: 'getShapeVisibility',
      undoable: true
    },

    toggleNameVisibility: {
      type: 'toggle',
      labels: { en: 'Name', fr: 'Nom', es: 'Nombre', de: 'Name', it: 'Nome' },
      tooltips: { en: 'Toggle name visibility', fr: 'Basculer la visibilité du nom', es: 'Alternar la visibilidad del nombre', de: 'Sichtbarkeit des Namens umschalten', it: 'Attiva/disattiva la visibilità del nome' },
      labelsToggle: {
        en: { true: 'Hide name', false: 'Show name' },
        fr: { true: 'Masquer le nom', false: 'Afficher le nom' },
        es: { true: 'Ocultar nombre', false: 'Mostrar nombre' },
        de: { true: 'Name ausblenden', false: 'Name einblenden' },
        it: { true: 'Nascondi nome', false: 'Mostra nome' }
      },
      getToggleValue: 'getNameVisibility',
      undoable: true
    },

    toggleValueVisibility: {
      type: 'toggle',
      labels: { en: 'Value', fr: 'Valeur', es: 'Valor', de: 'Wert', it: 'Valore' },
      tooltips: { en: 'Toggle value visibility', fr: 'Basculer la visibilité de la valeur', es: 'Alternar la visibilidad del valor', de: 'Sichtbarkeit des Werts umschalten', it: 'Attiva/disattiva la visibilità del valore' },
      labelsToggle: {
        en: { true: 'Hide value', false: 'Show value' },
        fr: { true: 'Masquer la valeur', false: 'Afficher la valeur' },
        es: { true: 'Ocultar valor', false: 'Mostrar valor' },
        de: { true: 'Wert ausblenden', false: 'Wert einblenden' },
        it: { true: 'Nascondi valore', false: 'Mostra valore' }
      },
      getToggleValue: 'getValueVisibility',
      undoable: true
    },

    // Autres actions
    editName: {
      type: 'action',
      labels: { en: 'Edit name', fr: 'Éditer le nom', es: 'Editar nombre', de: 'Name bearbeiten', it: 'Modifica nome' },
      tooltips: { en: 'Edit node name', fr: 'Éditer le nom du nœud', es: 'Editar el nombre del nodo', de: 'Knotenname bearbeiten', it: 'Modifica il nome del nodo' },
      closeMenuAfter: true
    },

    startAnimation: {
      type: 'action',
      labels: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione' },
      tooltips: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione' },
      closeMenuAfter: true
    },
    createTiedZdt: {
      type: 'action',
      labels: { en: 'Wrap in geometric frame (ZDT)', fr: 'Envelopper dans un cadre (ZDT)', es: 'Envolver en marco (ZDT)', de: 'In Rahmen einhüllen (ZDT)', it: 'Avvolgi in cornice (ZDT)' },
      tooltips: { en: 'Create a geometric frame (ZDT) tied to this node and its descendants/ancestors', fr: 'Créer un cadre géométrique (ZDT) lié à ce nœud et à ses descendants/ancêtres', es: 'Crear un marco geométrico (ZDT) vinculado a este nodo y sus descendientes/ancestros', de: 'Geometrischen Rahmen (ZDT) verknüpft mit diesem Knoten und seinen Nachfahren/Vorfahren erstellen', it: 'Crea una cornice geometrica (ZDT) legata a questo nodo e ai suoi discendenti/antenati' },
      closeMenuAfter: true
    },
    setTiedFrame: {
      type: 'action',
      labels: { en: 'Use as geometric frame', fr: 'Utiliser comme cadre géométrique', es: 'Usar como marco geométrico', de: 'Als geometrischen Rahmen verwenden', it: 'Usa come cornice geometrica' },
      tooltips: { en: 'Tie this node to its descendants — size and position auto-fit the enclosed nodes', fr: 'Lier ce nœud à ses descendants — taille et position s\'ajustent automatiquement aux nœuds englobés', es: 'Vincular este nodo a sus descendientes — tamaño y posición se ajustan automáticamente', de: 'Knoten an Nachfahren binden — Größe und Position passen sich automatisch an', it: 'Lega questo nodo ai discendenti — dimensione e posizione si adattano automaticamente' },
      undoable: true,
      closeMenuAfter: true
    },
    unsetTiedFrame: {
      type: 'action',
      labels: { en: 'Use as simple frame', fr: 'Utiliser comme cadre simple', es: 'Usar como marco simple', de: 'Als einfachen Rahmen verwenden', it: 'Usa come cornice semplice' },
      tooltips: { en: 'Detach all tied nodes — size and position become fixed', fr: 'Détacher tous les nœuds liés — taille et position deviennent fixes', es: 'Desvincular todos los nodos atados — tamaño y posición se vuelven fijos', de: 'Alle verbundenen Knoten lösen — Größe und Position werden fest', it: 'Scollega tutti i nodi legati — dimensione e posizione diventano fisse' },
      undoable: true,
      closeMenuAfter: true
    },
    fitFrameToAttached: {
      type: 'action',
      labels: { en: 'Fit frame to attached', fr: 'Ajuster le cadre aux nœuds attachés', es: 'Ajustar marco a los nodos vinculados', de: 'Rahmen an verbundene Knoten anpassen', it: 'Adatta cornice ai nodi legati' },
      tooltips: { en: 'Snap every side of the frame onto the attached nodes bbox', fr: 'Ajuster les quatre bords du cadre sur la bbox des nœuds attachés', es: 'Ajustar los cuatro lados del marco a la bbox de los nodos vinculados', de: 'Alle vier Seiten des Rahmens an die Bbox der verbundenen Knoten anpassen', it: 'Allinea tutti i lati della cornice alla bbox dei nodi legati' },
      undoable: true,
      closeMenuAfter: true
    },
    resetAttr: {
      type: 'action',
      labels: { en: 'Reset attributes', fr: 'Réinit. valeurs styles', es: 'Restablecer atributos', de: 'Attribute zurücksetzen', it: 'Reimposta attributi' },
      tooltips: { en: 'Reset all attributes', fr: 'Réinitialiser tous les attributs', es: 'Restablecer todos los atributos', de: 'Alle Attribute zurücksetzen', it: 'Reimpostare tutti gli attributi' },
      undoable: true
    },

    applyStyleToChildren: {
      type: 'action',
      labels: { en: 'Apply style to children', fr: 'Appliquer le style aux enfants', es: 'Aplicar estilo a los hijos', de: 'Stil auf Kinder anwenden', it: 'Applica stile ai figli' },
      tooltips: { en: 'Copy this node\'s style and attributes onto all its descendants in the dimension hierarchy', fr: 'Copier le style et les attributs de ce nœud sur toute sa descendance dans la hiérarchie de dimensions', es: 'Copiar el estilo y los atributos de este nodo en toda su descendencia en la jerarquía de dimensiones', de: 'Stil und Attribute dieses Knotens auf alle Nachfahren in der Dimensionshierarchie kopieren', it: 'Copia lo stile e gli attributi di questo nodo su tutta la sua discendenza nella gerarchia delle dimensioni' },
      undoable: true
    },

    reorg: {
      type: 'action',
      labels: { en: 'Reorganize I/O', fr: 'Réorganiser E/S', es: 'Reorganizar E/S', de: 'E/A reorganisieren', it: 'Riorganizza I/O' },
      tooltips: { en: 'Reorganize input/output links', fr: 'Permet de réorganiser automatiquement les flux entrant et sortant (position haut / bas)', es: 'Reorganizar automáticamente los flujos de entrada y salida (posición arriba/abajo)', de: 'Ein-/Ausgangsflüsse automatisch reorganisieren (Position oben/unten)', it: 'Riorganizza automaticamente i flussi in ingresso e uscita (posizione alto/basso)' },
      undoable: true
    },

    moveToFirstPlan: {
      type: 'action',
      labels: { en: 'Move to front', fr: 'Premier plan', es: 'Primer plano', de: 'In den Vordergrund', it: 'Primo piano' },
      tooltips: { en: 'Move to foreground', fr: 'Déplacer au premier plan', es: 'Mover al primer plano', de: 'In den Vordergrund verschieben', it: 'Spostare in primo piano' },
    },

    moveToLastPlan: {
      type: 'action',
      labels: { en: 'Move to back', fr: 'Dernier plan', es: 'Último plano', de: 'In den Hintergrund', it: 'Ultimo piano' },
      tooltips: { en: 'Move to background', fr: 'Déplacer à l\'arrière plan', es: 'Mover al fondo', de: 'In den Hintergrund verschieben', it: 'Spostare in secondo piano' }
    },

    selectOutputLinks: {
      type: 'action',
      labels: { en: 'Output', fr: 'Sortants', es: 'Salientes', de: 'Ausgehende', it: 'Uscenti' },
      tooltips: { en: 'Select output links', fr: 'Sélectionne tous les flux sortants du/des nœud(s)', es: 'Seleccionar todos los flujos salientes del/de los nodo(s)', de: 'Alle ausgehenden Flüsse des/der Knoten(s) auswählen', it: 'Seleziona tutti i flussi uscenti del/dei nodo/i' }
    },

    selectInputLinks: {
      type: 'action',
      labels: { en: 'Input', fr: 'Entrants', es: 'Entrantes', de: 'Eingehende', it: 'Entranti' },
      tooltips: { en: 'Select input links', fr: 'Sélectionne tous les flux entrants vers le/les nœud(s)', es: 'Seleccionar todos los flujos entrantes hacia el/los nodo(s)', de: 'Alle eingehenden Flüsse zum/zu den Knoten auswählen', it: 'Seleziona tutti i flussi entranti verso il/i nodo/i' }
    },

    copyElement: {
      type: 'action',
      labels: { en: 'Copy element(s)', fr: 'Copier les éléments', es: 'Copiar elemento(s)', de: 'Element(e) kopieren', it: 'Copia elemento/i' },
      tooltips: { en: 'Duplicate the selected element(s) — copies remain selected', fr: 'Dupliquer les éléments sélectionnés — les copies restent sélectionnées', es: 'Duplicar los elementos seleccionados — las copias permanecen seleccionadas', de: 'Ausgewählte Element(e) duplizieren — Kopien bleiben ausgewählt', it: 'Duplicare gli elementi selezionati — le copie rimangono selezionate' }
    },

    setGlobalMaxNodeToCurrent: {
      type: 'action',
      labels: { en: 'Global node max height = this node', fr: 'Hauteur max globale = ce nœud', es: 'Altura máx global = este nodo', de: 'Globale Maximalhöhe = dieser Knoten', it: 'Altezza max globale = questo nodo' },
      tooltips: { en: 'Set the GLOBAL maximum node height (all nodes) to this node\'s current height', fr: 'Fixe la hauteur maximale GLOBALE des nœuds (tous les nœuds) à la hauteur actuelle de ce nœud', es: 'Fija la altura máxima GLOBAL de los nodos (todos) a la altura actual de este nodo', de: 'Setzt die GLOBALE maximale Knotenhöhe (alle Knoten) auf die aktuelle Höhe dieses Knotens', it: 'Imposta l\'altezza massima GLOBALE dei nodi (tutti) all\'altezza attuale di questo nodo' },
      undoable: true,
      closeMenuAfter: true
    },
    clearGlobalMaxNode: {
      type: 'action',
      labels: { en: 'Clear global node max height', fr: 'Supprimer hauteur max globale', es: 'Quitar altura máx global', de: 'Globale Maximalhöhe entfernen', it: 'Rimuovi altezza max globale' },
      tooltips: { en: 'Remove the global maximum node height limit', fr: 'Supprimer la limite globale de hauteur des nœuds', es: 'Quitar el límite global de altura de los nodos', de: 'Globale Maximalhöhen-Begrenzung der Knoten entfernen', it: 'Rimuovere il limite globale di altezza dei nodi' },
      undoable: true,
      closeMenuAfter: true
    },

    setReferenceStock: {
      type: 'toggle',
      labels: {
        en: 'Reference stock (proportional)',
        fr: 'Stock de référence (proportionnel)',
        es: 'Stock de referencia (proporcional)',
        de: 'Referenzbestand (proportional)',
        it: 'Stock di riferimento (proporzionale)'
      },
      labelsToggle: {
        en: { true: 'Unset reference stock', false: 'Set as reference stock' },
        fr: { true: 'Retirer le stock de référence', false: 'Définir comme stock de référence' },
        es: { true: 'Quitar stock de referencia', false: 'Definir como stock de referencia' },
        de: { true: 'Referenzbestand entfernen', false: 'Als Referenzbestand festlegen' },
        it: { true: 'Rimuovi stock di riferimento', false: 'Imposta come stock di riferimento' }
      },
      tooltips: {
        en: 'In proportional / adapted-scale mode, anchor the diagram on this node\'s stock and scale everything by this stock\'s ratio across data tags.',
        fr: 'En mode proportionnel / échelle adaptée, ancrer le diagramme sur le stock de ce nœud et dimensionner le reste selon le ratio de ce stock entre les tags de données.',
        es: 'En modo proporcional / escala adaptada, anclar el diagrama en el stock de este nodo y escalar todo según la relación de este stock entre las etiquetas de datos.',
        de: 'Im proportionalen / angepassten Maßstab-Modus das Diagramm am Bestand dieses Knotens verankern und alles anhand des Verhältnisses dieses Bestands über die Daten-Tags skalieren.',
        it: 'In modalità proporzionale / scala adattata, ancorare il diagramma allo stock di questo nodo e ridimensionare tutto in base al rapporto di questo stock tra i tag di dati.'
      },
      getToggleValue: 'setReferenceStockValue',
      closeMenuAfter: true
    },

    saveNodeImage: {
      type: 'action',
      labels: { en: 'Save image', fr: 'Enregistrer l\'image', es: 'Guardar imagen', de: 'Bild speichern', it: 'Salva immagine' },
      tooltips: { en: 'Download the node image to a file', fr: 'Télécharger l\'image du nœud dans un fichier', es: 'Descargar la imagen del nodo a un archivo', de: 'Knotenbild in eine Datei herunterladen', it: 'Scarica l\'immagine del nodo in un file' },
      closeMenuAfter: true
    }
  },

  sectionTitles: {
    editionHierarchy: { en: 'Hierarchy Edition', fr: 'Édition hiérarchie', es: 'Edición de jerarquía', de: 'Hierarchie-Bearbeitung', it: 'Modifica gerarchia' },
    navHierarchy: { en: 'Hierarchy Navigation', fr: 'Navigation hiérarchie', es: 'Navegación de jerarquía', de: 'Hierarchie-Navigation', it: 'Navigazione gerarchia' },
    // aggregation: { en: 'Expansion Agg.', fr: 'Expansion Agg.' },
    // disaggregation: { en: 'Expansion Disagg.', fr: 'Expansion Désag.' },
    setChild: { en: 'Set as child', fr: 'Définir comme enfant', es: 'Definir como hijo', de: 'Als Kind festlegen', it: 'Definisci come figlio' },
    createParent: { en: 'Create parent', fr: 'Créer parent', es: 'Crear padre', de: 'Elternknoten erstellen', it: 'Crea genitore' },
    align: { en: 'Align nodes', fr: 'Aligner les nœuds', es: 'Alinear nodos', de: 'Knoten ausrichten', it: 'Allinea nodi' },
    alignHorizontal: { en: 'Horizontally', fr: 'Horizontalement', es: 'Horizontalmente', de: 'Horizontal', it: 'Orizzontalmente' },
    alignVertical: { en: 'Vertically', fr: 'Verticalement', es: 'Verticalmente', de: 'Vertikal', it: 'Verticalmente' },
    alignHorizMin: { en: 'Relative to the selected node furthest to the left', fr: 'Par rapport au nœud sélectionné le + à gauche', es: 'Respecto al nodo seleccionado más a la izquierda', de: 'Relativ zum am weitesten links liegenden ausgewählten Knoten', it: 'Rispetto al nodo selezionato più a sinistra' },
    alignHorizMax: { en: 'Relative to the selected node furthest to the right', fr: 'Par rapport au nœud sélectionné le + à droite', es: 'Respecto al nodo seleccionado más a la derecha', de: 'Relativ zum am weitesten rechts liegenden ausgewählten Knoten', it: 'Rispetto al nodo selezionato più a destra' },
    alignVertMin: { en: 'Relative to the selected topmost node', fr: 'Par rapport au nœud sélectionné le + en haut', es: 'Respecto al nodo seleccionado más arriba', de: 'Relativ zum obersten ausgewählten Knoten', it: 'Rispetto al nodo selezionato più in alto' },
    alignVertMax: { en: 'Relative to the selected node furthest down', fr: 'Par rapport au nœud sélectionné le + en bas', es: 'Respecto al nodo seleccionado más abajo', de: 'Relativ zum untersten ausgewählten Knoten', it: 'Rispetto al nodo selezionato più in basso' },
    editStyle: { en: 'Edition', fr: 'Édition', es: 'Edición', de: 'Bearbeitung', it: 'Modifica' },
    maskAttr: { en: 'Display', fr: 'Affichage', es: 'Visualización', de: 'Anzeige', it: 'Visualizzazione' },
    changePlan: { en: 'Change plan', fr: 'Changer plan', es: 'Cambiar plano', de: 'Ebene ändern', it: 'Cambia piano' },
    associatedElements: { en: 'Associated Elements', fr: 'Élements associés', es: 'Elementos asociados', de: 'Zugehörige Elemente', it: 'Elementi associati' },
    stockValues: { en: 'Stock Values', fr: 'Valeurs de stock', es: 'Valores de stock', de: 'Bestandswerte', it: 'Valori di stock' }
  },

  maxDepth: 5
}
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
    {
      type: 'submenu',
      titleKey: 'editStyle',
      children: [
        // { type: 'button', actionName: 'editName' },
        { type: 'button', actionName: 'resetAttr' },
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
        { type: 'button', actionName: 'moveToLastPlan' }
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

    // Navigation hiérarchie (agrégation/désagrégation)
    {
      type: 'submenu',
      titleKey: 'navHierarchy',
      visibilityConditions: [
        {
          type: 'custom',
          customCheck: (app_data) => {
            const node = app_data.drawing_area.node_contextualised
            if (!node) return false

            // Vérifier s'il y a des dimensions child ou parent disponibles
            const child_dims = node.master_node ?
              node.master_node.dimensions_as_child :
              node.dimensions_as_child
            const parent_dims = node.master_node ?
              node.master_node.dimensions_as_parent :
              node.dimensions_as_parent

            return (child_dims?.length > 0) ||
              (parent_dims?.length > 0) ||
              (!!node.master_node && (node.id.includes('expandleft') || node.id.includes('expandright')))
          }
        }
      ],
      children: [

        // Boutons de contraction
        {
          type: 'button',
          actionName: 'contractLeft',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                if (!app_data.has_sankey_dev) return false
                const node = app_data.drawing_area.node_contextualised
                return !!(node?.master_node && node.id.includes('expandleft'))
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
                return !!(node?.master_node && node.id.includes('expandright'))
              }
            }
          ]
        }
      ]
    },

    // Reste du menu (alignement, style, etc.)
    {
      type: 'submenu',
      titleKey: 'align',
      visibilityConditions: [
        { type: 'nodeCount', operator: '>', value: 1 }
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
    { type: 'button', actionName: 'startAnimation' },
    { type: 'button', actionName: 'copyElement' }
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
      labels: { en: 'Creates geometric frame', fr: 'Créer un cadre géométrique', es: 'Crear marco geométrico', de: 'Geometrischen Rahmen erstellen', it: 'Crea cornice geometrica' },
      tooltips: { en: 'Creates geometric frame', fr: 'Créer un cadre géométrique', es: 'Crear marco geométrico', de: 'Geometrischen Rahmen erstellen', it: 'Crea cornice geometrica' },
      closeMenuAfter: true
    },
    resetAttr: {
      type: 'action',
      labels: { en: 'Reset attributes', fr: 'Réinit. valeurs styles', es: 'Restablecer atributos', de: 'Attribute zurücksetzen', it: 'Reimposta attributi' },
      tooltips: { en: 'Reset all attributes', fr: 'Réinitialiser tous les attributs', es: 'Restablecer todos los atributos', de: 'Alle Attribute zurücksetzen', it: 'Reimpostare tutti gli attributi' },
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
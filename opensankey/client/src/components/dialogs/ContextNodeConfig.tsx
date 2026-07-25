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
      labels: { en: 'Aggregate', fr: 'Agréger', es: 'Agregar', de: 'Aggregieren', it: 'Aggregare',
        'zh-CN': '聚合',
        ja: '集約' },
      tooltips: { en: 'Aggregate this node', fr: 'Agréger ce nœud', es: 'Agregar este nodo', de: 'Diesen Knoten aggregieren', it: 'Aggregare questo nodo',
        'zh-CN': '聚合该节点',
        ja: 'このノードを集約します' },
      undoable: true,
      closeMenuAfter: true
    },
    disaggregate: {
      type: 'action',
      labels: { en: 'Disaggregate', fr: 'Désagréger', es: 'Desagregar', de: 'Disaggregieren', it: 'Disaggregare',
        'zh-CN': '分解',
        ja: '分解' },
      tooltips: { en: 'Disaggregate this node', fr: 'Désagréger ce nœud', es: 'Desagregar este nodo', de: 'Diesen Knoten disaggregieren', it: 'Disaggregare questo nodo',
        'zh-CN': '分解该节点',
        ja: 'このノードを分解します' },
      undoable: true,
      closeMenuAfter: true
    },
    startAnimation: {
      type: 'action',
      labels: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione',
        'zh-CN': '启动动画',
        ja: 'アニメーションを再生' },
      tooltips: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione',
        'zh-CN': '启动动画',
        ja: 'アニメーションを再生' },
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
        {
          type: 'button',
          actionName: 'assignColumnToChildren',
          // Visible dès qu'au moins un nœud parent est sélectionné : l'action
          // assigne la colonne (position_u) de CHAQUE parent sélectionné à ses
          // propres enfants (multi-sélection supportée).
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
        },
        // #1274 lot E2 — répartir à distance égale (≥ 3 éléments) et caler la taille.
        {
          type: 'submenu',
          titleKey: 'distribute',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) =>
                app_data.drawing_area.selected_nodes_list.length +
                app_data.drawing_area.selected_containers_list.length > 2
            }
          ],
          children: [
            { type: 'button', actionName: 'distributeHorizontal' },
            { type: 'button', actionName: 'distributeVertical' }
          ]
        },
        {
          type: 'button',
          actionName: 'matchSizeToRef',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) =>
                app_data.drawing_area.selected_nodes_list.length > 1
            }
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
      labels: { en: 'Create child flows', fr: 'Créer les flux enfants', es: 'Crear flujos hijos', de: 'Kind-Flüsse erstellen', it: 'Crea flussi figli',
        'zh-CN': '创建子流量',
        ja: '子フローを作成' },
      tooltips: { en: 'Create flows on child nodes', fr: 'Créer des flux sur les nœuds enfants', es: 'Crear flujos en los nodos hijos', de: 'Flüsse auf Kindknoten erstellen', it: 'Creare flussi sui nodi figli',
        'zh-CN': '在子节点上创建流量',
        ja: '子ノード上にフローを作成します' },
      undoable: true
    },

    createNewDimension: {
      type: 'action',
      labels: { en: 'New dimension', fr: 'Nouvelle dimension', es: 'Nueva dimensión', de: 'Neue Dimension', it: 'Nuova dimensione',
        'zh-CN': '新建维度',
        ja: '新しい次元' },
      tooltips: { en: 'Create a new dimension', fr: 'Créer une nouvelle dimension', es: 'Crear una nueva dimensión', de: 'Eine neue Dimension erstellen', it: 'Creare una nuova dimensione',
        'zh-CN': '创建一个新维度',
        ja: '新しい次元を作成します' }
    },

    createNewDimensionForParent: {
      type: 'action',
      labels: { en: 'New dimension', fr: 'Nouvelle dimension', es: 'Nueva dimensión', de: 'Neue Dimension', it: 'Nuova dimensione',
        'zh-CN': '新建维度',
        ja: '新しい次元' },
      tooltips: { en: 'Create a new dimension for parent', fr: 'Créer une nouvelle dimension pour parent', es: 'Crear una nueva dimensión para el padre', de: 'Eine neue Dimension für den Elternknoten erstellen', it: 'Creare una nuova dimensione per il genitore',
        'zh-CN': '为父节点创建一个新维度',
        ja: '親ノードに新しい次元を作成します' }
    },

    // Actions d'agrégation
    aggregate: {
      type: 'action',
      labels: { en: 'Aggregate', fr: 'Agréger', es: 'Agregar', de: 'Aggregieren', it: 'Aggregare',
        'zh-CN': '聚合',
        ja: '集約' },
      tooltips: { en: 'Aggregate this node', fr: 'Agréger ce nœud', es: 'Agregar este nodo', de: 'Diesen Knoten aggregieren', it: 'Aggregare questo nodo',
        'zh-CN': '聚合该节点',
        ja: 'このノードを集約します' },
      undoable: true,
      closeMenuAfter: true
    },

    aggregateLeft: {
      type: 'action',
      labels: { en: 'Left expansion', fr: 'Expansion à gauche', es: 'Expansión izquierda', de: 'Expansion links', it: 'Espansione a sinistra',
        'zh-CN': '向左展开',
        ja: '左に展開' },
      tooltips: { en: 'Aggregate with left expansion', fr: 'Agréger avec expansion à gauche', es: 'Agregar con expansión izquierda', de: 'Aggregieren mit Expansion nach links', it: 'Aggregare con espansione a sinistra',
        'zh-CN': '聚合并向左展开',
        ja: '左に展開して集約します' },
      closeMenuAfter: true
    },

    aggregateRight: {
      type: 'action',
      labels: { en: 'Right expansion', fr: 'Expansion à droite', es: 'Expansión derecha', de: 'Expansion rechts', it: 'Espansione a destra',
        'zh-CN': '向右展开',
        ja: '右に展開' },
      tooltips: { en: 'Aggregate with right expansion', fr: 'Agréger avec expansion à droite', es: 'Agregar con expansión derecha', de: 'Aggregieren mit Expansion nach rechts', it: 'Aggregare con espansione a destra',
        'zh-CN': '聚合并向右展开',
        ja: '右に展開して集約します' },
      closeMenuAfter: true
    },

    // Actions de désagrégation
    disaggregate: {
      type: 'action',
      labels: { en: 'Disaggregate', fr: 'Désagréger', es: 'Desagregar', de: 'Disaggregieren', it: 'Disaggregare',
        'zh-CN': '分解',
        ja: '分解' },
      tooltips: { en: 'Disaggregate this node', fr: 'Désagréger ce nœud', es: 'Desagregar este nodo', de: 'Diesen Knoten disaggregieren', it: 'Disaggregare questo nodo',
        'zh-CN': '分解该节点',
        ja: 'このノードを分解します' },
      undoable: true,
      closeMenuAfter: true
    },

    expandLeft: {
      type: 'action',
      labels: { en: 'Left expansion', fr: 'Expansion à gauche', es: 'Expansión izquierda', de: 'Expansion links', it: 'Espansione a sinistra',
        'zh-CN': '向左展开',
        ja: '左に展開' },
      tooltips: { en: 'Expand to the left', fr: 'Expansion vers la gauche', es: 'Expandir hacia la izquierda', de: 'Nach links expandieren', it: 'Espandere a sinistra',
        'zh-CN': '向左展开',
        ja: '左へ展開します' },
      closeMenuAfter: true
    },

    expandRight: {
      type: 'action',
      labels: { en: 'Right expansion', fr: 'Expansion à droite', es: 'Expansión derecha', de: 'Expansion rechts', it: 'Espansione a destra',
        'zh-CN': '向右展开',
        ja: '右に展開' },
      tooltips: { en: 'Expand to the right', fr: 'Expansion vers la droite', es: 'Expandir hacia la derecha', de: 'Nach rechts expandieren', it: 'Espandere a destra',
        'zh-CN': '向右展开',
        ja: '右へ展開します' },
      closeMenuAfter: true
    },

    // Actions de contraction
    contractLeft: {
      type: 'action',
      labels: { en: 'Contract right', fr: 'Réduire à droite', es: 'Contraer a la derecha', de: 'Nach rechts reduzieren', it: 'Contrarre a destra',
        'zh-CN': '向右收拢',
        ja: '右に収縮' },
      tooltips: { en: 'Contract to the right', fr: 'Réduire vers la droite', es: 'Contraer hacia la derecha', de: 'Nach rechts reduzieren', it: 'Contrarre verso destra',
        'zh-CN': '向右收拢',
        ja: '右へ収縮します' },
      closeMenuAfter: true
    },

    contractRight: {
      type: 'action',
      labels: { en: 'Contract left', fr: 'Réduire à gauche', es: 'Contraer a la izquierda', de: 'Nach links reduzieren', it: 'Contrarre a sinistra',
        'zh-CN': '向左收拢',
        ja: '左に収縮' },
      tooltips: { en: 'Contract to the left', fr: 'Réduire vers la gauche', es: 'Contraer hacia la izquierda', de: 'Nach links reduzieren', it: 'Contrarre verso sinistra',
        'zh-CN': '向左收拢',
        ja: '左へ収縮します' },
      closeMenuAfter: true
    },

    // Issue #1225 — contracter l'expansion d'un parent depuis le menu d'un
    // enfant (bouton ← Parent qui défait l'expansion).
    contractParent: {
      type: 'action',
      labels: { en: 'Contract', fr: 'Réduire', es: 'Contraer', de: 'Reduzieren', it: 'Contrarre',
        'zh-CN': '收拢',
        ja: '収縮' },
      tooltips: { en: 'Contract the parent expansion', fr: 'Annuler l\'expansion du parent', es: 'Anular la expansión del padre', de: 'Eltern-Expansion aufheben', it: 'Annullare l\'espansione del genitore',
        'zh-CN': '收拢父节点的展开',
        ja: '親ノードの展開を収縮します' },
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
        it: 'Racchiudere (ingressi → figli, uscite ← genitore)',
        'zh-CN': '包围（输入 → 子节点，输出 ← 父节点）',
        ja: '内包（入力 → 子、出力 ← 親）'
      },
      tooltips: {
        en: 'Parent surrounds children; incoming links land on children, outgoing links leave from parent',
        fr: 'Le parent entoure les enfants ; les flux entrants vont sur les enfants, les flux sortants partent du parent',
        es: 'El padre rodea a los hijos; los flujos entrantes llegan a los hijos, los flujos salientes parten del padre',
        de: 'Elternknoten umschließt Kinder; eingehende Flüsse landen auf Kindern, ausgehende Flüsse gehen vom Elternknoten',
        it: 'Il genitore circonda i figli; i flussi in ingresso arrivano ai figli, i flussi in uscita partono dal genitore',
        'zh-CN': '父节点包围子节点；进入的流量落在子节点上，流出的流量从父节点出发',
        ja: '親が子を囲みます。入るフローは子に着地し、出るフローは親から出ます'
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
        it: 'Racchiudere (ingressi → genitore, uscite ← figli)',
        'zh-CN': '包围（输入 → 父节点，输出 ← 子节点）',
        ja: '内包（入力 → 親、出力 ← 子）'
      },
      tooltips: {
        en: 'Parent surrounds children; incoming links land on parent, outgoing links leave from children',
        fr: 'Le parent entoure les enfants ; les flux entrants vont sur le parent, les flux sortants partent des enfants',
        es: 'El padre rodea a los hijos; los flujos entrantes llegan al padre, los flujos salientes parten de los hijos',
        de: 'Elternknoten umschließt Kinder; eingehende Flüsse landen auf Elternknoten, ausgehende Flüsse gehen von Kindern',
        it: 'Il genitore circonda i figli; i flussi in ingresso arrivano al genitore, i flussi in uscita partono dai figli',
        'zh-CN': '父节点包围子节点；进入的流量落在父节点上，流出的流量从子节点出发',
        ja: '親が子を囲みます。入るフローは親に着地し、出るフローは子から出ます'
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
        it: 'Racchiudere (ingressi → figli, uscite ← figli)',
        'zh-CN': '包围（输入 → 子节点，输出 ← 子节点）',
        ja: '内包（入力 → 子、出力 ← 子）'
      },
      tooltips: {
        en: 'Parent surrounds children as a pure visual envelope; all incoming and outgoing links land on the children',
        fr: 'Le parent entoure les enfants comme une enveloppe visuelle ; tous les flux entrants et sortants vont sur les enfants',
        es: 'El padre rodea a los hijos como una envoltura visual; todos los flujos entrantes y salientes llegan a los hijos',
        de: 'Elternknoten umschließt Kinder als reine visuelle Hülle; alle eingehenden und ausgehenden Flüsse landen auf den Kindern',
        it: 'Il genitore circonda i figli come pura busta visiva; tutti i flussi in ingresso e in uscita arrivano sui figli',
        'zh-CN': '父节点作为纯视觉外壳包围子节点；所有进出流量都落在子节点上',
        ja: '親が純粋な視覚的な外枠として子を囲みます。出入りするフローはすべて子に着地します'
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
        it: 'Racchiudere (ingressi → genitore, uscite ← genitore)',
        'zh-CN': '包围（输入 → 父节点，输出 ← 父节点）',
        ja: '内包（入力 → 親、出力 ← 親）'
      },
      tooltips: {
        en: 'Parent surrounds children; all incoming and outgoing links land on the parent — children are visible inside the envelope but carry no flux of their own',
        fr: 'Le parent entoure les enfants ; tous les flux entrants et sortants vont sur le parent — les enfants sont visibles dans l\'enveloppe mais n\'ont aucun flux propre',
        es: 'El padre rodea a los hijos; todos los flujos entrantes y salientes llegan al padre — los hijos son visibles dentro de la envoltura pero no llevan flujo propio',
        de: 'Elternknoten umschließt Kinder; alle eingehenden und ausgehenden Flüsse landen auf dem Elternknoten — Kinder sind innerhalb der Hülle sichtbar, tragen aber keinen eigenen Fluss',
        it: 'Il genitore circonda i figli; tutti i flussi in ingresso e in uscita arrivano sul genitore — i figli sono visibili dentro la busta ma non portano flusso proprio',
        'zh-CN': '父节点包围子节点；所有进出流量都落在父节点上——子节点在外壳内可见，但自身不承载任何流量',
        ja: '親が子を囲みます。出入りするフローはすべて親に着地します — 子は外枠の中に見えますが、自身はフローを持ちません'
      },
      undoable: true,
      closeMenuAfter: true
    },

    unsetContainerMode: {
      type: 'action',
      labels: { en: 'Exit enclosing mode', fr: 'Quitter mode englobant', es: 'Salir del modo englobante', de: 'Umschließungsmodus verlassen', it: 'Uscire dalla modalità di contenimento',
        'zh-CN': '退出包围模式',
        ja: '内包モードを終了' },
      tooltips: {
        en: 'Leave the enclosing display mode',
        fr: 'Quitter le mode d\'affichage englobant',
        es: 'Salir del modo de visualización englobante',
        de: 'Den umschließenden Anzeigemodus verlassen',
        it: 'Uscire dalla modalità di visualizzazione di contenimento',
        'zh-CN': '离开包围显示模式',
        ja: '内包表示モードを終了します'
      },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement horizontal - Référence = nœud le plus à gauche
    alignHorizMinLeft: {
      type: 'action',
      labels: { en: '←▌□', fr: '←▌□', es: '←▌□', de: '←▌□', it: '←▌□',
        'zh-CN': '←▌□',
        ja: '←▌□' },
      tooltips: { en: 'Align to left edge of leftmost node', fr: 'Aligner sur le bord gauche du nœud le plus à gauche', es: 'Alinear al borde izquierdo del nodo más a la izquierda', de: 'Am linken Rand des am weitesten links liegenden Knotens ausrichten', it: 'Allinea al bordo sinistro del nodo più a sinistra',
        'zh-CN': '对齐到最左侧节点的左边缘',
        ja: '最も左のノードの左端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMinCenter: {
      type: 'action',
      labels: { en: '←▐□▌', fr: '←▐□▌', es: '←▐□▌', de: '←▐□▌', it: '←▐□▌',
        'zh-CN': '←▐□▌',
        ja: '←▐□▌' },
      tooltips: { en: 'Align to center of leftmost node', fr: 'Aligner sur le centre du nœud le plus à gauche', es: 'Alinear al centro del nodo más a la izquierda', de: 'An der Mitte des am weitesten links liegenden Knotens ausrichten', it: 'Allinea al centro del nodo più a sinistra',
        'zh-CN': '对齐到最左侧节点的中心',
        ja: '最も左のノードの中央に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMinRight: {
      type: 'action',
      labels: { en: '←□▐', fr: '←□▐', es: '←□▐', de: '←□▐', it: '←□▐',
        'zh-CN': '←□▐',
        ja: '←□▐' },
      tooltips: { en: 'Align to right edge of leftmost node', fr: 'Aligner sur le bord droit du nœud le plus à gauche', es: 'Alinear al borde derecho del nodo más a la izquierda', de: 'Am rechten Rand des am weitesten links liegenden Knotens ausrichten', it: 'Allinea al bordo destro del nodo più a sinistra',
        'zh-CN': '对齐到最左侧节点的右边缘',
        ja: '最も左のノードの右端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement horizontal - Référence = nœud le plus à droite
    alignHorizMaxLeft: {
      type: 'action',
      labels: { en: '▌□→', fr: '▌□→', es: '▌□→', de: '▌□→', it: '▌□→',
        'zh-CN': '▌□→',
        ja: '▌□→' },
      tooltips: { en: 'Align to left edge of rightmost node', fr: 'Aligner sur le bord gauche du nœud le plus à droite', es: 'Alinear al borde izquierdo del nodo más a la derecha', de: 'Am linken Rand des am weitesten rechts liegenden Knotens ausrichten', it: 'Allinea al bordo sinistro del nodo più a destra',
        'zh-CN': '对齐到最右侧节点的左边缘',
        ja: '最も右のノードの左端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMaxCenter: {
      type: 'action',
      labels: { en: '▐□▌→', fr: '▐□▌→', es: '▐□▌→', de: '▐□▌→', it: '▐□▌→',
        'zh-CN': '▐□▌→',
        ja: '▐□▌→' },
      tooltips: { en: 'Align to center of rightmost node', fr: 'Aligner sur le centre du nœud le plus à droite', es: 'Alinear al centro del nodo más a la derecha', de: 'An der Mitte des am weitesten rechts liegenden Knotens ausrichten', it: 'Allinea al centro del nodo più a destra',
        'zh-CN': '对齐到最右侧节点的中心',
        ja: '最も右のノードの中央に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMaxRight: {
      type: 'action',
      labels: { en: '□▐→', fr: '□▐→', es: '□▐→', de: '□▐→', it: '□▐→',
        'zh-CN': '□▐→',
        ja: '□▐→' },
      tooltips: { en: 'Align to right edge of rightmost node', fr: 'Aligner sur le bord droit du nœud le plus à droite', es: 'Alinear al borde derecho del nodo más a la derecha', de: 'Am rechten Rand des am weitesten rechts liegenden Knotens ausrichten', it: 'Allinea al bordo destro del nodo più a destra',
        'zh-CN': '对齐到最右侧节点的右边缘',
        ja: '最も右のノードの右端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement vertical - Référence = nœud le plus haut
    // Actions d'alignement vertical - Référence = nœud le plus haut
    alignVertMinTop: {
      type: 'action',
      labels: { en: '↑▀', fr: '↑▀', es: '↑▀', de: '↑▀', it: '↑▀',
        'zh-CN': '↑▀',
        ja: '↑▀' },
      tooltips: { en: 'Align to top edge of topmost node', fr: 'Aligner sur le bord haut du nœud le plus haut', es: 'Alinear al borde superior del nodo más arriba', de: 'Am oberen Rand des obersten Knotens ausrichten', it: 'Allinea al bordo superiore del nodo più in alto',
        'zh-CN': '对齐到最上方节点的上边缘',
        ja: '最も上のノードの上端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMinCenter: {
      type: 'action',
      labels: { en: '↑▄▀', fr: '↑▄▀', es: '↑▄▀', de: '↑▄▀', it: '↑▄▀',
        'zh-CN': '↑▄▀',
        ja: '↑▄▀' },
      tooltips: { en: 'Align to center of topmost node', fr: 'Aligner sur le centre du nœud le plus haut', es: 'Alinear al centro del nodo más arriba', de: 'An der Mitte des obersten Knotens ausrichten', it: 'Allinea al centro del nodo più in alto',
        'zh-CN': '对齐到最上方节点的中心',
        ja: '最も上のノードの中央に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMinBottom: {
      type: 'action',
      labels: { en: '↑▄', fr: '↑▄', es: '↑▄', de: '↑▄', it: '↑▄',
        'zh-CN': '↑▄',
        ja: '↑▄' },
      tooltips: { en: 'Align to bottom edge of topmost node', fr: 'Aligner sur le bord bas du nœud le plus haut', es: 'Alinear al borde inferior del nodo más arriba', de: 'Am unteren Rand des obersten Knotens ausrichten', it: 'Allinea al bordo inferiore del nodo più in alto',
        'zh-CN': '对齐到最上方节点的下边缘',
        ja: '最も上のノードの下端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement vertical - Référence = nœud le plus bas
    alignVertMaxTop: {
      type: 'action',
      labels: { en: '▀↓', fr: '▀↓', es: '▀↓', de: '▀↓', it: '▀↓',
        'zh-CN': '▀↓',
        ja: '▀↓' },
      tooltips: { en: 'Align to top edge of bottommost node', fr: 'Aligner sur le bord haut du nœud le plus bas', es: 'Alinear al borde superior del nodo más abajo', de: 'Am oberen Rand des untersten Knotens ausrichten', it: 'Allinea al bordo superiore del nodo più in basso',
        'zh-CN': '对齐到最下方节点的上边缘',
        ja: '最も下のノードの上端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMaxCenter: {
      type: 'action',
      labels: { en: '▄▀↓', fr: '▄▀↓', es: '▄▀↓', de: '▄▀↓', it: '▄▀↓',
        'zh-CN': '▄▀↓',
        ja: '▄▀↓' },
      tooltips: { en: 'Align to center of bottommost node', fr: 'Aligner sur le centre du nœud le plus bas', es: 'Alinear al centro del nodo más abajo', de: 'An der Mitte des untersten Knotens ausrichten', it: 'Allinea al centro del nodo più in basso',
        'zh-CN': '对齐到最下方节点的中心',
        ja: '最も下のノードの中央に揃える' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMaxBottom: {
      type: 'action',
      labels: { en: '▄↓', fr: '▄↓', es: '▄↓', de: '▄↓', it: '▄↓',
        'zh-CN': '▄↓',
        ja: '▄↓' },
      tooltips: { en: 'Align to bottom edge of bottommost node', fr: 'Aligner sur le bord bas du nœud le plus bas', es: 'Alinear al borde inferior del nodo más abajo', de: 'Am unteren Rand des untersten Knotens ausrichten', it: 'Allinea al bordo inferiore del nodo più in basso',
        'zh-CN': '对齐到最下方节点的下边缘',
        ja: '最も下のノードの下端に揃える' },
      undoable: true,
      closeMenuAfter: true
    },
    // #1274 lot E2 — distribution à distance égale
    distributeHorizontal: {
      type: 'action',
      labels: { en: 'Horizontally', fr: 'Horizontalement', es: 'Horizontalmente', de: 'Horizontal', it: 'Orizzontalmente',
        'zh-CN': '水平方向',
        ja: '水平方向' },
      tooltips: { en: 'Distribute selected elements with equal horizontal spacing', fr: 'Répartir les éléments sélectionnés à espacement horizontal égal', es: 'Distribuir los elementos seleccionados con espaciado horizontal uniforme', de: 'Ausgewählte Elemente mit gleichem horizontalen Abstand verteilen', it: 'Distribuire gli elementi selezionati con spaziatura orizzontale uniforme',
        'zh-CN': '使所选元素在水平方向上等间距分布',
        ja: '選択した要素を水平方向に等間隔で配置します' },
      undoable: true,
      closeMenuAfter: true
    },
    distributeVertical: {
      type: 'action',
      labels: { en: 'Vertically', fr: 'Verticalement', es: 'Verticalmente', de: 'Vertikal', it: 'Verticalmente',
        'zh-CN': '垂直方向',
        ja: '垂直方向' },
      tooltips: { en: 'Distribute selected elements with equal vertical spacing', fr: 'Répartir les éléments sélectionnés à espacement vertical égal', es: 'Distribuir los elementos seleccionados con espaciado vertical uniforme', de: 'Ausgewählte Elemente mit gleichem vertikalen Abstand verteilen', it: 'Distribuire gli elementi selezionati con spaziatura verticale uniforme',
        'zh-CN': '使所选元素在垂直方向上等间距分布',
        ja: '選択した要素を垂直方向に等間隔で配置します' },
      undoable: true,
      closeMenuAfter: true
    },
    // #1274 lot E2 — caler la taille sur l'élément de référence (le nœud cliqué)
    matchSizeToRef: {
      type: 'action',
      labels: { en: 'Match size to this node', fr: 'Caler la taille sur ce nœud', es: 'Igualar el tamaño a este nodo', de: 'Größe an diesen Knoten angleichen', it: 'Adatta la dimensione a questo nodo',
        'zh-CN': '尺寸对齐到该节点',
        ja: 'このノードにサイズを合わせる' },
      tooltips: { en: 'Apply this node\'s width and height to all other selected nodes', fr: 'Appliquer la largeur et la hauteur de ce nœud à tous les autres nœuds sélectionnés', es: 'Aplicar el ancho y alto de este nodo a los demás nodos seleccionados', de: 'Breite und Höhe dieses Knotens auf alle anderen ausgewählten Knoten anwenden', it: 'Applicare larghezza e altezza di questo nodo a tutti gli altri nodi selezionati',
        'zh-CN': '将该节点的宽度和高度应用到其他所有已选节点',
        ja: 'このノードの幅と高さを、選択中の他のすべてのノードに適用します' },
      undoable: true,
      closeMenuAfter: true
    },
    // Actions de visibilité avec toggle
    toggleShapeVisibility: {
      type: 'toggle',
      labels: { en: 'Shape', fr: 'Forme', es: 'Forma', de: 'Form', it: 'Forma',
        'zh-CN': '形状',
        ja: '形状' },
      tooltips: { en: 'Toggle shape visibility', fr: 'Basculer la visibilité de la forme', es: 'Alternar la visibilidad de la forma', de: 'Sichtbarkeit der Form umschalten', it: 'Attiva/disattiva la visibilità della forma',
        'zh-CN': '切换形状可见性',
        ja: '形状の表示を切り替えます' },
      labelsToggle: {
        en: { true: 'Hide shape', false: 'Show shape' },
        fr: { true: 'Masquer le nœud', false: 'Afficher le nœud' },
        es: { true: 'Ocultar forma', false: 'Mostrar forma' },
        de: { true: 'Form ausblenden', false: 'Form einblenden' },
        it: { true: 'Nascondi forma', false: 'Mostra forma' },
        'zh-CN': { true: '隐藏形状', false: '显示形状' },
        ja: { true: '形状を隠す', false: '形状を表示' }
      },
      getToggleValue: 'getShapeVisibility',
      undoable: true
    },

    toggleNameVisibility: {
      type: 'toggle',
      labels: { en: 'Name', fr: 'Nom', es: 'Nombre', de: 'Name', it: 'Nome',
        'zh-CN': '名称',
        ja: '名前' },
      tooltips: { en: 'Toggle name visibility', fr: 'Basculer la visibilité du nom', es: 'Alternar la visibilidad del nombre', de: 'Sichtbarkeit des Namens umschalten', it: 'Attiva/disattiva la visibilità del nome',
        'zh-CN': '切换名称可见性',
        ja: '名前の表示を切り替えます' },
      labelsToggle: {
        en: { true: 'Hide name', false: 'Show name' },
        fr: { true: 'Masquer le nom', false: 'Afficher le nom' },
        es: { true: 'Ocultar nombre', false: 'Mostrar nombre' },
        de: { true: 'Name ausblenden', false: 'Name einblenden' },
        it: { true: 'Nascondi nome', false: 'Mostra nome' },
        'zh-CN': { true: '隐藏名称', false: '显示名称' },
        ja: { true: '名前を隠す', false: '名前を表示' }
      },
      getToggleValue: 'getNameVisibility',
      undoable: true
    },

    toggleValueVisibility: {
      type: 'toggle',
      labels: { en: 'Value', fr: 'Valeur', es: 'Valor', de: 'Wert', it: 'Valore',
        'zh-CN': '数值',
        ja: '値' },
      tooltips: { en: 'Toggle value visibility', fr: 'Basculer la visibilité de la valeur', es: 'Alternar la visibilidad del valor', de: 'Sichtbarkeit des Werts umschalten', it: 'Attiva/disattiva la visibilità del valore',
        'zh-CN': '切换数值可见性',
        ja: '値の表示を切り替えます' },
      labelsToggle: {
        en: { true: 'Hide value', false: 'Show value' },
        fr: { true: 'Masquer la valeur', false: 'Afficher la valeur' },
        es: { true: 'Ocultar valor', false: 'Mostrar valor' },
        de: { true: 'Wert ausblenden', false: 'Wert einblenden' },
        it: { true: 'Nascondi valore', false: 'Mostra valore' },
        'zh-CN': { true: '隐藏数值', false: '显示数值' },
        ja: { true: '値を隠す', false: '値を表示' }
      },
      getToggleValue: 'getValueVisibility',
      undoable: true
    },

    // Autres actions
    editName: {
      type: 'action',
      labels: { en: 'Edit name', fr: 'Éditer le nom', es: 'Editar nombre', de: 'Name bearbeiten', it: 'Modifica nome',
        'zh-CN': '编辑名称',
        ja: '名前を編集' },
      tooltips: { en: 'Edit node name', fr: 'Éditer le nom du nœud', es: 'Editar el nombre del nodo', de: 'Knotenname bearbeiten', it: 'Modifica il nome del nodo',
        'zh-CN': '编辑节点名称',
        ja: 'ノード名を編集します' },
      closeMenuAfter: true
    },

    startAnimation: {
      type: 'action',
      labels: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione',
        'zh-CN': '启动动画',
        ja: 'アニメーションを再生' },
      tooltips: { en: 'Launch animation', fr: 'Lancer animation', es: 'Iniciar animación', de: 'Animation starten', it: 'Avvia animazione',
        'zh-CN': '启动动画',
        ja: 'アニメーションを再生' },
      closeMenuAfter: true
    },
    createTiedZdt: {
      type: 'action',
      labels: { en: 'Wrap in a group (ZDT)', fr: 'Envelopper dans un groupe (ZDT)', es: 'Envolver en un grupo (ZDT)', de: 'In eine Gruppe einhüllen (ZDT)', it: 'Avvolgi in un gruppo (ZDT)',
        'zh-CN': '包入文本区组（ZDT）',
        ja: 'グループにまとめる（テキストエリア）' },
      tooltips: { en: 'Create a text zone grouped with this node and its descendants/ancestors', fr: 'Créer une zone de texte groupée avec ce nœud et ses descendants/ancêtres', es: 'Crear una zona de texto agrupada con este nodo y sus descendientes/ancestros', de: 'Textzone erstellen, gruppiert mit diesem Knoten und seinen Nachfahren/Vorfahren', it: 'Crea una zona di testo raggruppata con questo nodo e i suoi discendenti/antenati',
        'zh-CN': '创建一个文本区，将该节点及其后代/祖先归为一组',
        ja: 'このノードとその子孫／祖先をまとめたテキストエリアを作成します' },
      closeMenuAfter: true
    },
    setTiedFrame: {
      type: 'action',
      labels: { en: 'Group contained elements', fr: 'Grouper les éléments contenus', es: 'Agrupar los elementos contenidos', de: 'Enthaltene Elemente gruppieren', it: 'Raggruppa gli elementi contenuti',
        'zh-CN': '组合所包含的元素',
        ja: '内包する要素をグループ化' },
      tooltips: { en: 'Attach the geometrically contained elements (nodes and text zones) to this node — the frame then follows its members', fr: 'Attache au nœud les éléments géométriquement contenus (nœuds et zones de texte) — le cadre suit ensuite ses membres', es: 'Adjunta al nodo los elementos contenidos geométricamente (nodos y zonas de texto) — el marco sigue después a sus miembros', de: 'Hängt die geometrisch enthaltenen Elemente (Knoten und Textzonen) an diesen Knoten an — der Rahmen folgt dann seinen Mitgliedern', it: 'Collega al nodo gli elementi geometricamente contenuti (nodi e zone di testo) — la cornice segue poi i suoi membri',
        'zh-CN': '将几何上被包含的元素（节点与文本区）附加到该节点——框体随后跟随其成员',
        ja: '幾何学的に内包される要素（ノードとテキストエリア）をこのノードに紐づけます — 枠はメンバーに追従するようになります' },
      undoable: true,
      closeMenuAfter: true
    },
    unsetTiedFrame: {
      type: 'action',
      labels: { en: 'Ungroup', fr: 'Dissocier le groupe', es: 'Desagrupar', de: 'Gruppierung aufheben', it: 'Separa il gruppo',
        'zh-CN': '取消组合',
        ja: 'グループ解除' },
      tooltips: { en: 'Detach all members — size and position become fixed', fr: 'Détache tous les membres — taille et position deviennent fixes', es: 'Desvincula todos los miembros — tamaño y posición se vuelven fijos', de: 'Löst alle Mitglieder — Größe und Position werden fest', it: 'Scollega tutti i membri — dimensione e posizione diventano fisse',
        'zh-CN': '分离全部成员——尺寸与位置变为固定',
        ja: 'すべてのメンバーを切り離します — サイズと位置は固定になります' },
      undoable: true,
      closeMenuAfter: true
    },
    fitFrameToAttached: {
      type: 'action',
      labels: { en: 'Fit frame to group', fr: 'Ajuster le cadre au groupe', es: 'Ajustar el marco al grupo', de: 'Rahmen an Gruppe anpassen', it: 'Adatta la cornice al gruppo',
        'zh-CN': '使框体贴合组合',
        ja: '枠をグループに合わせる' },
      tooltips: { en: 'Snap every side of the frame onto the members bbox', fr: 'Ajuster les quatre bords du cadre sur la bbox des membres', es: 'Ajustar los cuatro lados del marco a la bbox de los miembros', de: 'Alle vier Seiten des Rahmens an die Bbox der Mitglieder anpassen', it: 'Allinea tutti i lati della cornice alla bbox dei membri',
        'zh-CN': '将框体的每一条边贴合到成员的包围盒',
        ja: '枠の各辺をメンバーの外接矩形にぴったり合わせます' },
      undoable: true,
      closeMenuAfter: true
    },
    resetAttr: {
      type: 'action',
      labels: { en: 'Reset attributes', fr: 'Réinit. valeurs styles', es: 'Restablecer atributos', de: 'Attribute zurücksetzen', it: 'Reimposta attributi',
        'zh-CN': '重置属性',
        ja: '属性をリセット' },
      tooltips: { en: 'Reset all attributes', fr: 'Réinitialiser tous les attributs', es: 'Restablecer todos los atributos', de: 'Alle Attribute zurücksetzen', it: 'Reimpostare tutti gli attributi',
        'zh-CN': '重置所有属性',
        ja: 'すべての属性をリセットします' },
      undoable: true
    },

    applyStyleToChildren: {
      type: 'action',
      labels: { en: 'Apply style to children', fr: 'Appliquer le style aux enfants', es: 'Aplicar estilo a los hijos', de: 'Stil auf Kinder anwenden', it: 'Applica stile ai figli',
        'zh-CN': '将样式应用到子元素',
        ja: 'スタイルを子要素に適用' },
      tooltips: { en: 'Copy this node\'s style and attributes onto all its descendants in the dimension hierarchy', fr: 'Copier le style et les attributs de ce nœud sur toute sa descendance dans la hiérarchie de dimensions', es: 'Copiar el estilo y los atributos de este nodo en toda su descendencia en la jerarquía de dimensiones', de: 'Stil und Attribute dieses Knotens auf alle Nachfahren in der Dimensionshierarchie kopieren', it: 'Copia lo stile e gli attributi di questo nodo su tutta la sua discendenza nella gerarchia delle dimensioni',
        'zh-CN': '将该节点的样式与属性复制到维度层级中的所有后代',
        ja: 'このノードのスタイルと属性を、次元階層におけるすべての子孫にコピーします' },
      undoable: true
    },

    assignColumnToChildren: {
      type: 'action',
      labels: { en: 'Assign column to children', fr: 'Assigner u,v aux enfants (lignes et colonnes)', es: 'Asignar la columna a los hijos', de: 'Spalte auf Kinder anwenden', it: 'Assegna la colonna ai figli',
        'zh-CN': '将列指派给子节点',
        ja: '列を子ノードに割り当て' },
      tooltips: { en: 'Assign this node\'s column (position) to all its descendants in the dimension hierarchy (locked columns are skipped)', fr: 'Assigner la colonne (position) de ce nœud à toute sa descendance dans la hiérarchie de dimensions (les colonnes verrouillées sont ignorées)', es: 'Asignar la columna (posición) de este nodo a toda su descendencia en la jerarquía de dimensiones (se omiten las columnas bloqueadas)', de: 'Die Spalte (Position) dieses Knotens auf alle Nachfahren in der Dimensionshierarchie anwenden (gesperrte Spalten werden übersprungen)', it: 'Assegna la colonna (posizione) di questo nodo a tutta la sua discendenza nella gerarchia delle dimensioni (le colonne bloccate vengono ignorate)',
        'zh-CN': '将该节点的列（位置）指派给维度层级中的所有后代（已锁定的列会被跳过）',
        ja: 'このノードの列（位置）を、次元階層におけるすべての子孫に割り当てます（固定された列は除きます）' },
      undoable: true
    },

    reorg: {
      type: 'action',
      labels: { en: 'Reorganize I/O', fr: 'Réorganiser E/S', es: 'Reorganizar E/S', de: 'E/A reorganisieren', it: 'Riorganizza I/O',
        'zh-CN': '重排进出流量',
        ja: '入出力フローを整理' },
      tooltips: { en: 'Reorganize input/output links', fr: 'Permet de réorganiser automatiquement les flux entrant et sortant (position haut / bas)', es: 'Reorganizar automáticamente los flujos de entrada y salida (posición arriba/abajo)', de: 'Ein-/Ausgangsflüsse automatisch reorganisieren (Position oben/unten)', it: 'Riorganizza automaticamente i flussi in ingresso e uscita (posizione alto/basso)',
        'zh-CN': '重排输入/输出流量',
        ja: '入力／出力フローを並べ替えます' },
      undoable: true
    },

    moveToFirstPlan: {
      type: 'action',
      labels: { en: 'Move to front', fr: 'Premier plan', es: 'Primer plano', de: 'In den Vordergrund', it: 'Primo piano',
        'zh-CN': '移到前面',
        ja: '前面へ移動' },
      tooltips: { en: 'Move to foreground', fr: 'Déplacer au premier plan', es: 'Mover al primer plano', de: 'In den Vordergrund verschieben', it: 'Spostare in primo piano',
        'zh-CN': '移到前景',
        ja: '前面へ移動します' },
    },

    moveToLastPlan: {
      type: 'action',
      labels: { en: 'Move to back', fr: 'Dernier plan', es: 'Último plano', de: 'In den Hintergrund', it: 'Ultimo piano',
        'zh-CN': '移到后面',
        ja: '背面へ移動' },
      tooltips: { en: 'Move to background', fr: 'Déplacer à l\'arrière plan', es: 'Mover al fondo', de: 'In den Hintergrund verschieben', it: 'Spostare in secondo piano',
        'zh-CN': '移到背景',
        ja: '背面へ移動します' }
    },

    selectOutputLinks: {
      type: 'action',
      labels: { en: 'Output', fr: 'Sortants', es: 'Salientes', de: 'Ausgehende', it: 'Uscenti',
        'zh-CN': '输出',
        ja: '出力' },
      tooltips: { en: 'Select output links', fr: 'Sélectionne tous les flux sortants du/des nœud(s)', es: 'Seleccionar todos los flujos salientes del/de los nodo(s)', de: 'Alle ausgehenden Flüsse des/der Knoten(s) auswählen', it: 'Seleziona tutti i flussi uscenti del/dei nodo/i',
        'zh-CN': '选择输出流量',
        ja: '出力フローを選択します' }
    },

    selectInputLinks: {
      type: 'action',
      labels: { en: 'Input', fr: 'Entrants', es: 'Entrantes', de: 'Eingehende', it: 'Entranti',
        'zh-CN': '输入',
        ja: '入力' },
      tooltips: { en: 'Select input links', fr: 'Sélectionne tous les flux entrants vers le/les nœud(s)', es: 'Seleccionar todos los flujos entrantes hacia el/los nodo(s)', de: 'Alle eingehenden Flüsse zum/zu den Knoten auswählen', it: 'Seleziona tutti i flussi entranti verso il/i nodo/i',
        'zh-CN': '选择输入流量',
        ja: '入力フローを選択します' }
    },

    copyElement: {
      type: 'action',
      labels: { en: 'Copy element(s)', fr: 'Copier les éléments', es: 'Copiar elemento(s)', de: 'Element(e) kopieren', it: 'Copia elemento/i',
        'zh-CN': '复制元素',
        ja: '要素を複製' },
      tooltips: { en: 'Duplicate the selected element(s) — copies remain selected', fr: 'Dupliquer les éléments sélectionnés — les copies restent sélectionnées', es: 'Duplicar los elementos seleccionados — las copias permanecen seleccionadas', de: 'Ausgewählte Element(e) duplizieren — Kopien bleiben ausgewählt', it: 'Duplicare gli elementi selezionati — le copie rimangono selezionate',
        'zh-CN': '复制所选元素——副本保持选中状态',
        ja: '選択した要素を複製します — 複製されたものが選択状態のまま残ります' }
    },

    setGlobalMaxNodeToCurrent: {
      type: 'action',
      labels: { en: 'Global node max height = this node', fr: 'Hauteur max globale = ce nœud', es: 'Altura máx global = este nodo', de: 'Globale Maximalhöhe = dieser Knoten', it: 'Altezza max globale = questo nodo',
        'zh-CN': '全局节点最大高度 = 该节点',
        ja: 'ノード最大高さの全体設定 = このノード' },
      tooltips: { en: 'Set the GLOBAL maximum node height (all nodes) to this node\'s current height', fr: 'Fixe la hauteur maximale GLOBALE des nœuds (tous les nœuds) à la hauteur actuelle de ce nœud', es: 'Fija la altura máxima GLOBAL de los nodos (todos) a la altura actual de este nodo', de: 'Setzt die GLOBALE maximale Knotenhöhe (alle Knoten) auf die aktuelle Höhe dieses Knotens', it: 'Imposta l\'altezza massima GLOBALE dei nodi (tutti) all\'altezza attuale di questo nodo',
        'zh-CN': '将全局（所有节点）的最大节点高度设为该节点的当前高度',
        ja: 'ノードの最大高さの全体設定（すべてのノード）を、このノードの現在の高さにします' },
      undoable: true,
      closeMenuAfter: true
    },
    clearGlobalMaxNode: {
      type: 'action',
      labels: { en: 'Clear global node max height', fr: 'Supprimer hauteur max globale', es: 'Quitar altura máx global', de: 'Globale Maximalhöhe entfernen', it: 'Rimuovi altezza max globale',
        'zh-CN': '清除全局节点最大高度',
        ja: 'ノード最大高さの全体設定を解除' },
      tooltips: { en: 'Remove the global maximum node height limit', fr: 'Supprimer la limite globale de hauteur des nœuds', es: 'Quitar el límite global de altura de los nodos', de: 'Globale Maximalhöhen-Begrenzung der Knoten entfernen', it: 'Rimuovere il limite globale di altezza dei nodi',
        'zh-CN': '移除全局节点最大高度限制',
        ja: 'ノードの最大高さの全体的な上限を解除します' },
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
        it: 'Stock di riferimento (proporzionale)',
        'zh-CN': '参考存量（比例模式）',
        ja: '基準ストック（比例モード）'
      },
      labelsToggle: {
        en: { true: 'Unset reference stock', false: 'Set as reference stock' },
        fr: { true: 'Retirer le stock de référence', false: 'Définir comme stock de référence' },
        es: { true: 'Quitar stock de referencia', false: 'Definir como stock de referencia' },
        de: { true: 'Referenzbestand entfernen', false: 'Als Referenzbestand festlegen' },
        it: { true: 'Rimuovi stock di riferimento', false: 'Imposta come stock di riferimento' },
        'zh-CN': { true: '取消参考存量', false: '设为参考存量' },
        ja: { true: '基準ストックを解除', false: '基準ストックに設定' }
      },
      tooltips: {
        en: 'In proportional / adapted-scale mode, anchor the diagram on this node\'s stock and scale everything by this stock\'s ratio across data tags.',
        fr: 'En mode proportionnel / échelle adaptée, ancrer le diagramme sur le stock de ce nœud et dimensionner le reste selon le ratio de ce stock entre les tags de données.',
        es: 'En modo proporcional / escala adaptada, anclar el diagrama en el stock de este nodo y escalar todo según la relación de este stock entre las etiquetas de datos.',
        de: 'Im proportionalen / angepassten Maßstab-Modus das Diagramm am Bestand dieses Knotens verankern und alles anhand des Verhältnisses dieses Bestands über die Daten-Tags skalieren.',
        it: 'In modalità proporzionale / scala adattata, ancorare il diagramma allo stock di questo nodo e ridimensionare tutto in base al rapporto di questo stock tra i tag di dati.',
        'zh-CN': '在比例 / 自适应比例模式下，将图表锚定在该节点的存量上，并按该存量在各数据标签下的比例缩放全部内容。',
        ja: '比例／適応スケールモードで、図をこのノードのストックに固定し、各データタグにおけるこのストックの比率で全体を拡大縮小します。'
      },
      getToggleValue: 'setReferenceStockValue',
      closeMenuAfter: true
    },

    saveNodeImage: {
      type: 'action',
      labels: { en: 'Save image', fr: 'Enregistrer l\'image', es: 'Guardar imagen', de: 'Bild speichern', it: 'Salva immagine',
        'zh-CN': '保存图片',
        ja: '画像を保存' },
      tooltips: { en: 'Download the node image to a file', fr: 'Télécharger l\'image du nœud dans un fichier', es: 'Descargar la imagen del nodo a un archivo', de: 'Knotenbild in eine Datei herunterladen', it: 'Scarica l\'immagine del nodo in un file',
        'zh-CN': '将节点图片下载为文件',
        ja: 'ノードの画像をファイルとしてダウンロードします' },
      closeMenuAfter: true
    }
  },

  sectionTitles: {
    editionHierarchy: { en: 'Hierarchy Edition', fr: 'Édition hiérarchie', es: 'Edición de jerarquía', de: 'Hierarchie-Bearbeitung', it: 'Modifica gerarchia',
      'zh-CN': '层级编辑',
      ja: '階層の編集' },
    navHierarchy: { en: 'Hierarchy Navigation', fr: 'Navigation hiérarchie', es: 'Navegación de jerarquía', de: 'Hierarchie-Navigation', it: 'Navigazione gerarchia',
      'zh-CN': '层级浏览',
      ja: '階層の移動' },
    // aggregation: { en: 'Expansion Agg.', fr: 'Expansion Agg.' },
    // disaggregation: { en: 'Expansion Disagg.', fr: 'Expansion Désag.' },
    setChild: { en: 'Set as child', fr: 'Définir comme enfant', es: 'Definir como hijo', de: 'Als Kind festlegen', it: 'Definisci come figlio',
      'zh-CN': '设为子节点',
      ja: '子に設定' },
    createParent: { en: 'Create parent', fr: 'Créer parent', es: 'Crear padre', de: 'Elternknoten erstellen', it: 'Crea genitore',
      'zh-CN': '创建父节点',
      ja: '親を作成' },
    align: { en: 'Align nodes', fr: 'Aligner les nœuds', es: 'Alinear nodos', de: 'Knoten ausrichten', it: 'Allinea nodi',
      'zh-CN': '对齐节点',
      ja: 'ノードを整列' },
    alignHorizontal: { en: 'Horizontally', fr: 'Horizontalement', es: 'Horizontalmente', de: 'Horizontal', it: 'Orizzontalmente',
      'zh-CN': '水平方向',
      ja: '水平方向' },
    alignVertical: { en: 'Vertically', fr: 'Verticalement', es: 'Verticalmente', de: 'Vertikal', it: 'Verticalmente',
      'zh-CN': '垂直方向',
      ja: '垂直方向' },
    alignHorizMin: { en: 'Relative to the selected node furthest to the left', fr: 'Par rapport au nœud sélectionné le + à gauche', es: 'Respecto al nodo seleccionado más a la izquierda', de: 'Relativ zum am weitesten links liegenden ausgewählten Knoten', it: 'Rispetto al nodo selezionato più a sinistra',
      'zh-CN': '相对于最左侧的已选节点',
      ja: '選択中で最も左にあるノードを基準' },
    alignHorizMax: { en: 'Relative to the selected node furthest to the right', fr: 'Par rapport au nœud sélectionné le + à droite', es: 'Respecto al nodo seleccionado más a la derecha', de: 'Relativ zum am weitesten rechts liegenden ausgewählten Knoten', it: 'Rispetto al nodo selezionato più a destra',
      'zh-CN': '相对于最右侧的已选节点',
      ja: '選択中で最も右にあるノードを基準' },
    alignVertMin: { en: 'Relative to the selected topmost node', fr: 'Par rapport au nœud sélectionné le + en haut', es: 'Respecto al nodo seleccionado más arriba', de: 'Relativ zum obersten ausgewählten Knoten', it: 'Rispetto al nodo selezionato più in alto',
      'zh-CN': '相对于最上方的已选节点',
      ja: '選択中で最も上にあるノードを基準' },
    alignVertMax: { en: 'Relative to the selected node furthest down', fr: 'Par rapport au nœud sélectionné le + en bas', es: 'Respecto al nodo seleccionado más abajo', de: 'Relativ zum untersten ausgewählten Knoten', it: 'Rispetto al nodo selezionato più in basso',
      'zh-CN': '相对于最下方的已选节点',
      ja: '選択中で最も下にあるノードを基準' },
    distribute: { en: 'Distribute evenly', fr: 'Répartir à distance égale', es: 'Distribuir uniformemente', de: 'Gleichmäßig verteilen', it: 'Distribuire uniformemente',
      'zh-CN': '均匀分布',
      ja: '等間隔に配置' },
    editStyle: { en: 'Edition', fr: 'Édition', es: 'Edición', de: 'Bearbeitung', it: 'Modifica',
      'zh-CN': '编辑',
      ja: '編集' },
    maskAttr: { en: 'Display', fr: 'Affichage', es: 'Visualización', de: 'Anzeige', it: 'Visualizzazione',
      'zh-CN': '显示',
      ja: '表示' },
    changePlan: { en: 'Change plan', fr: 'Changer plan', es: 'Cambiar plano', de: 'Ebene ändern', it: 'Cambia piano',
      'zh-CN': '更改图层',
      ja: 'レイヤーを変更' },
    associatedElements: { en: 'Associated Elements', fr: 'Élements associés', es: 'Elementos asociados', de: 'Zugehörige Elemente', it: 'Elementi associati',
      'zh-CN': '关联元素',
      ja: '関連する要素' },
    stockValues: { en: 'Stock Values', fr: 'Valeurs de stock', es: 'Valores de stock', de: 'Bestandswerte', it: 'Valori di stock',
      'zh-CN': '存量数值',
      ja: 'ストックの値' }
  },

  maxDepth: 5
}
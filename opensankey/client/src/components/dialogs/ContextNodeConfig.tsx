import { MenuConfig, MenuCondition } from "./SankeyMenuContext";
import { Class_ApplicationData } from "../../types/ApplicationData";

// Configuration du menu contextuel des nœuds avec la structure hiérarchique correcte
export const NODE_MENU_CONFIG: MenuConfig = {
  structure: [
    {
      type: 'submenu',
      titleKey: 'editStyle',
      children: [
        { type: 'button', actionName: 'editName' },
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
                const selected_nodes = app_data.drawing_area.visible_and_selected_nodes_list
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
              node.master_node.dimensions_as_child_pure :
              node.dimensions_as_child_pure
            const parent_dims = node.master_node ?
              node.master_node.dimensions_as_parent_pure :
              node.dimensions_as_parent_pure

            return (child_dims?.length > 0) ||
              (parent_dims?.length > 0) ||
              (!!node.master_node && (node.id.includes('expandleft') || node.id.includes('expandright')))
          }
        }
      ],
      children: [
        // Section Agrégation
        {
          type: 'submenu',
          titleKey: 'aggregation',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                const node = app_data.drawing_area.node_contextualised
                if (!node) return false

                const child_dims = node.master_node ?
                  node.master_node.dimensions_as_child_pure :
                  node.dimensions_as_child_pure

                return (child_dims.length > 0) ||
                  !!(node.master_node && (node.id.includes('expandleft') || node.id.includes('expandright')))
              }
            }
          ],
          children: [
            // Cas simple : une seule dimension child
            {
              type: 'button',
              actionName: 'aggregate',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data) => {
                    const node = app_data.drawing_area.node_contextualised
                    const selected = app_data.drawing_area.visible_and_selected_nodes_list
                    if (!node || selected.length !== 1 || !selected.includes(node) || !node.is_child) return false

                    const child_dims = node.master_node ?
                      node.master_node.dimensions_as_child_pure :
                      node.dimensions_as_child_pure

                    return child_dims.length === 1
                  }
                }
              ]
            },
            {
              type: 'button',
              actionName: 'aggregateLeft',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data) => {
                    const node = app_data.drawing_area.node_contextualised
                    if (!node) return false

                    const child_dims = node.master_node ?
                      node.master_node.dimensions_as_child_pure :
                      node.dimensions_as_child_pure

                    return child_dims.length === 1
                  }
                }
              ]
            },
            {
              type: 'button',
              actionName: 'aggregateRight',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data) => {
                    const node = app_data.drawing_area.node_contextualised
                    if (!node) return false

                    const child_dims = node.master_node ?
                      node.master_node.dimensions_as_child_pure :
                      node.dimensions_as_child_pure

                    return child_dims.length === 1
                  }
                }
              ]
            },
            // Les sous-menus pour chaque dimension child seront générés dynamiquement
            // avec les actions aggregate_${dim.id}, aggregateLeft_${dim.id}, aggregateRight_${dim.id}

            // Boutons de contraction
            {
              type: 'button',
              actionName: 'contractLeft',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data) => {
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
                    const node = app_data.drawing_area.node_contextualised
                    return !!(node?.master_node && node.id.includes('expandright'))
                  }
                }
              ]
            }
          ]
        },

        // Section Désagrégation
        {
          type: 'submenu',
          titleKey: 'disaggregation',
          visibilityConditions: [
            {
              type: 'custom',
              customCheck: (app_data) => {
                const node = app_data.drawing_area.node_contextualised
                if (!node) return false

                const parent_dims = node.master_node ?
                  node.master_node.dimensions_as_parent_pure :
                  node.dimensions_as_parent_pure

                return parent_dims.length > 0
              }
            }
          ],
          children: [
            // Cas simple : une seule dimension parent
            {
              type: 'button',
              actionName: 'disaggregate',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data: Class_ApplicationData) => {
                    const node = app_data.drawing_area.node_contextualised
                    if (!node) return false

                    const parent_dims = node.master_node ?
                      node.master_node.dimensions_as_parent_pure :
                      node.dimensions_as_parent_pure

                    return (parent_dims.length === 1) &&
                      !!(node.nodeDimensionAsParent(parent_dims[0].related_level_tagg))
                  }
                }
              ]
            },
            {
              type: 'button',
              actionName: 'expandLeft',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data) => {
                    const node = app_data.drawing_area.node_contextualised
                    if (!node) return false

                    const parent_dims = node.master_node ?
                      node.master_node.dimensions_as_parent_pure :
                      node.dimensions_as_parent_pure

                    return parent_dims.length === 1
                  }
                }
              ]
            },
            {
              type: 'button',
              actionName: 'expandRight',
              visibilityConditions: [
                {
                  type: 'custom',
                  customCheck: (app_data) => {
                    const node = app_data.drawing_area.node_contextualised
                    if (!node) return false

                    const parent_dims = node.master_node ?
                      node.master_node.dimensions_as_parent_pure :
                      node.dimensions_as_parent_pure

                    return parent_dims.length === 1
                  }
                }
              ]
            }
            // Les sous-menus pour chaque dimension parent seront générés dynamiquement
            // avec les actions disaggregate_${dim.id}, expandLeft_${dim.id}, expandRight_${dim.id}
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
      titleKey: 'selectLinks',
      children: [
        { type: 'button', actionName: 'reorg' },
        { type: 'button', actionName: 'selectOutputLinks' },
        { type: 'button', actionName: 'selectInputLinks' }
      ]
    }
  ],

  actions: {
    // Actions de hiérarchie
    createFluxOnChildren: {
      type: 'action',
      labels: { en: 'Create child flows', fr: 'Créer les flux enfants' },
      tooltips: { en: 'Create flows on child nodes', fr: 'Créer des flux sur les nœuds enfants' },
      undoable: true
    },

    createNewDimension: {
      type: 'action',
      labels: { en: 'New dimension', fr: 'Nouvelle dimension' },
      tooltips: { en: 'Create a new dimension', fr: 'Créer une nouvelle dimension' }
    },

    createNewDimensionForParent: {
      type: 'action',
      labels: { en: 'New dimension', fr: 'Nouvelle dimension' },
      tooltips: { en: 'Create a new dimension for parent', fr: 'Créer une nouvelle dimension pour parent' }
    },

    // Actions d'agrégation
    aggregate: {
      type: 'action',
      labels: { en: 'Without expansion', fr: 'Sans expansion' },
      tooltips: { en: 'Aggregate this node', fr: 'Agréger ce nœud' },
      undoable: true,
      closeMenuAfter: true
    },

    aggregateLeft: {
      type: 'action',
      labels: { en: 'Left expansion', fr: 'Expansion à gauche' },
      tooltips: { en: 'Aggregate with left expansion', fr: 'Agréger avec expansion à gauche' },
      closeMenuAfter: true
    },

    aggregateRight: {
      type: 'action',
      labels: { en: 'Right expansion', fr: 'Expansion à droite' },
      tooltips: { en: 'Aggregate with right expansion', fr: 'Agréger avec expansion à droite' },
      closeMenuAfter: true
    },

    // Actions de désagrégation
    disaggregate: {
      type: 'action',
      labels: { en: 'Without expansion', fr: 'Sans expansion' },
      tooltips: { en: 'Disaggregate this node', fr: 'Désagréger ce nœud' },
      undoable: true,
      closeMenuAfter: true
    },

    expandLeft: {
      type: 'action',
      labels: { en: 'Left expansion', fr: 'Expansion à gauche' },
      tooltips: { en: 'Expand to the left', fr: 'Expansion vers la gauche' },
      closeMenuAfter: true
    },

    expandRight: {
      type: 'action',
      labels: { en: 'Right expansion', fr: 'Expansion à droite' },
      tooltips: { en: 'Expand to the right', fr: 'Expansion vers la droite' },
      closeMenuAfter: true
    },

    // Actions de contraction
    contractLeft: {
      type: 'action',
      labels: { en: 'Contract right', fr: 'Réduire à droite' },
      tooltips: { en: 'Contract to the right', fr: 'Réduire vers la droite' },
      closeMenuAfter: true
    },

    contractRight: {
      type: 'action',
      labels: { en: 'Contract left', fr: 'Réduire à gauche' },
      tooltips: { en: 'Contract to the left', fr: 'Réduire vers la gauche' },
      closeMenuAfter: true
    },

    // Actions d'alignement horizontal - Référence = nœud le plus à gauche
    alignHorizMinLeft: {
      type: 'action',
      labels: { en: '←▌□', fr: '←▌□' },
      tooltips: { en: 'Align to left edge of leftmost node', fr: 'Aligner sur le bord gauche du nœud le plus à gauche' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMinCenter: {
      type: 'action',
      labels: { en: '←▐□▌', fr: '←▐□▌' },
      tooltips: { en: 'Align to center of leftmost node', fr: 'Aligner sur le centre du nœud le plus à gauche' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMinRight: {
      type: 'action',
      labels: { en: '←□▐', fr: '←□▐' },
      tooltips: { en: 'Align to right edge of leftmost node', fr: 'Aligner sur le bord droit du nœud le plus à gauche' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement horizontal - Référence = nœud le plus à droite
    alignHorizMaxLeft: {
      type: 'action',
      labels: { en: '▌□→', fr: '▌□→' },
      tooltips: { en: 'Align to left edge of rightmost node', fr: 'Aligner sur le bord gauche du nœud le plus à droite' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMaxCenter: {
      type: 'action',
      labels: { en: '▐□▌→', fr: '▐□▌→' },
      tooltips: { en: 'Align to center of rightmost node', fr: 'Aligner sur le centre du nœud le plus à droite' },
      undoable: true,
      closeMenuAfter: true
    },

    alignHorizMaxRight: {
      type: 'action',
      labels: { en: '□▐→', fr: '□▐→' },
      tooltips: { en: 'Align to right edge of rightmost node', fr: 'Aligner sur le bord droit du nœud le plus à droite' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement vertical - Référence = nœud le plus haut
    // Actions d'alignement vertical - Référence = nœud le plus haut
    alignVertMinTop: {
      type: 'action',
      labels: { en: '↑▀', fr: '↑▀' },
      tooltips: { en: 'Align to top edge of topmost node', fr: 'Aligner sur le bord haut du nœud le plus haut' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMinCenter: {
      type: 'action',
      labels: { en: '↑▄▀', fr: '↑▄▀' },
      tooltips: { en: 'Align to center of topmost node', fr: 'Aligner sur le centre du nœud le plus haut' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMinBottom: {
      type: 'action',
      labels: { en: '↑▄', fr: '↑▄' },
      tooltips: { en: 'Align to bottom edge of topmost node', fr: 'Aligner sur le bord bas du nœud le plus haut' },
      undoable: true,
      closeMenuAfter: true
    },

    // Actions d'alignement vertical - Référence = nœud le plus bas
    alignVertMaxTop: {
      type: 'action',
      labels: { en: '▀↓', fr: '▀↓' },
      tooltips: { en: 'Align to top edge of bottommost node', fr: 'Aligner sur le bord haut du nœud le plus bas' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMaxCenter: {
      type: 'action',
      labels: { en: '▄▀↓', fr: '▄▀↓' },
      tooltips: { en: 'Align to center of bottommost node', fr: 'Aligner sur le centre du nœud le plus bas' },
      undoable: true,
      closeMenuAfter: true
    },

    alignVertMaxBottom: {
      type: 'action',
      labels: { en: '▄↓', fr: '▄↓' },
      tooltips: { en: 'Align to bottom edge of bottommost node', fr: 'Aligner sur le bord bas du nœud le plus bas' },
      undoable: true,
      closeMenuAfter: true
    },
    // Actions de visibilité avec toggle
    toggleShapeVisibility: {
      type: 'toggle',
      labels: { en: 'Shape', fr: 'Forme' },
      tooltips: { en: 'Toggle shape visibility', fr: 'Basculer la visibilité de la forme' },
      labelsToggle: {
        en: { true: 'Hide shape', false: 'Show shape' },
        fr: { true: 'Masquer le nœud', false: 'Afficher le nœud' }
      },
      getToggleValue: 'getShapeVisibility',
      undoable: true
    },

    toggleNameVisibility: {
      type: 'toggle',
      labels: { en: 'Name', fr: 'Nom' },
      tooltips: { en: 'Toggle name visibility', fr: 'Basculer la visibilité du nom' },
      labelsToggle: {
        en: { true: 'Hide name', false: 'Show name' },
        fr: { true: 'Masquer le nom', false: 'Afficher le nom' }
      },
      getToggleValue: 'getNameVisibility',
      undoable: true
    },

    toggleValueVisibility: {
      type: 'toggle',
      labels: { en: 'Value', fr: 'Valeur' },
      tooltips: { en: 'Toggle value visibility', fr: 'Basculer la visibilité de la valeur' },
      labelsToggle: {
        en: { true: 'Hide value', false: 'Show value' },
        fr: { true: 'Masquer la valeur', false: 'Afficher la valeur' }
      },
      getToggleValue: 'getValueVisibility',
      undoable: true
    },

    // Autres actions
    editName: {
      type: 'action',
      labels: { en: 'Edit name', fr: 'Éditer le nom' },
      tooltips: { en: 'Edit node name', fr: 'Éditer le nom du nœud' },
      closeMenuAfter: true
    },

    resetAttr: {
      type: 'action',
      labels: { en: 'Reset attributes', fr: 'Réinit. valeurs styles' },
      tooltips: { en: 'Reset all attributes', fr: 'Réinitialiser tous les attributs' },
      undoable: true
    },

    // selectStyle: {
    //   type: 'widget',
    //   widgetName: 'ButtonNodeContextAssignStyle',
    //   widgetProps: {},
    //   labels: { en: 'Select style', fr: 'Styles' },
    //   tooltips: { en: 'Choose a style', fr: 'Styles' },
    //   // Cette action sera gérée dynamiquement pour créer des boutons pour chaque style
    // },

    reorg: {
      type: 'action',
      labels: { en: 'Reorganize I/O', fr: 'Réorganiser E/S' },
      tooltips: { en: 'Reorganize input/output links', fr: 'Permet de réorganiser automatiquement les flux entrant et sortant (position haut / bas)' },
      undoable: true
    },

    moveToFirstPlan: {
      type: 'action',
      labels: { en: 'Move to front', fr: 'Mettre au premier plan' },
      tooltips: { en: 'Move to foreground', fr: 'Déplacer au premier plan' },
    },

    moveToLastPlan: {
      type: 'action',
      labels: { en: 'Move to back', fr: 'Mettre au dernier plan' },
      tooltips: { en: 'Move to background', fr: 'Déplacer à l\'arrière plan' }
    },

    selectOutputLinks: {
      type: 'action',
      labels: { en: 'Output', fr: 'Sortants' },
      tooltips: { en: 'Select output links', fr: 'Sélectionne tous les flux sortants du/des nœud(s)' }
    },

    selectInputLinks: {
      type: 'action',
      labels: { en: 'Input', fr: 'Entrants' },
      tooltips: { en: 'Select input links', fr: 'Sélectionne tous les flux entrants vers le/les nœud(s)' }
    }
  },

  sectionTitles: {
    editionHierarchy: { en: 'Hierarchy Edition', fr: 'Édition hiérarchie' },
    navHierarchy: { en: 'Hierarchy Navigation', fr: 'Navigation hiérarchie' },
    aggregation: { en: 'Aggregation', fr: 'Agrégation' },
    disaggregation: { en: 'Disaggregation', fr: 'Désagrégation' },
    setChild: { en: 'Set as child', fr: 'Définir comme enfant' },
    createParent: { en: 'Create parent', fr: 'Créer parent' },
    align: { en: 'Align nodes', fr: 'Aligner les nœuds' },
    alignHorizontal: { en: 'Horizontally', fr: 'Horizontalement' },
    alignVertical: { en: 'Vertically', fr: 'Verticalement' },
    alignHorizMin: { en: 'Relative to the selected node furthest to the left', fr: 'Par rapport au nœud sélectionné le + à gauche' },
    alignHorizMax: { en: 'Relative to the selected node furthest to the right', fr: 'Par rapport au nœud sélectionné le + à droite' },
    alignVertMin: { en: 'Relative to the selected topmost node', fr: 'Par rapport au nœud sélectionné le + en haut' },
    alignVertMax: { en: 'Relative to the selected node furthest down', fr: 'Par rapport au nœud sélectionné le + en bas' },
    editStyle: { en: 'Edition', fr: 'Édition' },
    maskAttr: { en: 'Display', fr: 'Affichage' },
    changePlan: { en: 'Change plan', fr: 'Changer plan' },
    selectLinks: { en: 'Select links', fr: 'Flux associés' }
  },

  maxDepth: 5
}
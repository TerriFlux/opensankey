// ==================================================================================================
// Actions spécifiques aux nœuds - Logique métier séparée
// ==================================================================================================

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import {
  aggregate,
  disaggregate,
  aggregationExpansion,
  disaggregationExpansion,
  contract,
  // create_parent,
  // set_child,
  // applyDimension,
  EXPANSION_SUFFIXES
} from '../../Algorithms/Hierarchies'
import { Class_DrawingArea } from '../../types/DrawingArea'
import { Class_ApplicationHistory } from '../../types/ApplicationHistory'
import { StorageType } from '../../Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'

// ==================================================================================================
// CLASSE PRINCIPALE D'ACTIONS DES NŒUDS
// ==================================================================================================

export class NodeActions {
  private app_data: Class_ApplicationData
  private drawing_area: Class_DrawingArea
  private history: Class_ApplicationHistory
  private contextualised_node: Class_NodeElement | undefined
  private selected_nodes: Class_NodeElement[]

  constructor(app_data: Class_ApplicationData) {
    this.app_data = app_data
    this.drawing_area = app_data.drawing_area
    this.history = app_data.history
    this.contextualised_node = this.drawing_area.node_contextualised
    this.selected_nodes = this.drawing_area.selected_nodes_list
  }

  // ==================================================================================================
  // UTILITAIRES DE BASE
  // ==================================================================================================

  private refreshAndSave = () => {
    this.drawing_area.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    this.drawing_area.application_data.menu_configuration.ref_to_spreadsheet?.current()
    this.drawing_area.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
  }

  private closeContextMenu = () => {
    this.drawing_area.node_contextualised = undefined
    this.drawing_area.application_data.menu_configuration.ref_to_menu_context_nodes_updater.current()
  }

  private executeWithUndo = (actionFn: () => void, undoFn: () => void) => {
    this.history.saveUndo(undoFn)
    this.history.saveRedo(actionFn)
    actionFn()
  }

  // ==================================================================================================
  // MÉTHODES DE VISIBILITÉ POUR LES TOGGLES
  // ==================================================================================================

  getShapeVisibility = (): boolean => {
    return this.contextualised_node?.shape_visible ?? false
  }

  getNameVisibility = (): boolean => {
    return this.contextualised_node?.name_label_is_visible ?? false
  }

  getValueVisibility = (): boolean => {
    return this.contextualised_node?.value_label_is_visible ?? false
  }

  // ==================================================================================================
  // ACTIONS DE HIÉRARCHIE
  // ==================================================================================================

  aggregate = (parent: string) => {
    if (!this.contextualised_node) return

    const child_dims = this.contextualised_node.master_node ?
      this.contextualised_node.master_node.dimensions_as_child :
      this.contextualised_node.dimensions_as_child

    //let parent = dim_name ? this.app_data.drawing_area.sankey.level_taggs_dict[dim_name] : child_dims[0].parent
    // if (!dim_name) {
    //   if (child_dims.filter(dim => dim.force_show_children).length != 0) {
    //     level_tagg = child_dims.filter(dim => dim.force_show_children)[0].related_level_tagg
    //   }
    // }

    if (child_dims.length > 0) {
      aggregate(this.app_data, this.contextualised_node, parent)
      this.app_data.drawing_area.bypass_autofit = true
      this.drawing_area.draw()
      this.app_data.drawing_area.bypass_autofit = false
      this.drawing_area.purgeSelection()
      this.drawing_area.node_contextualised = undefined
      //this.drawing_area.areaAutoFit(false)
      this.refreshAndSave()
    }
  }

  aggregateLeft = (_dim_name: string) => {
    if (!this.contextualised_node) return

    const parentDims = this.contextualised_node.master_node ?
      this.contextualised_node.master_node.dimensions_as_child :
      this.contextualised_node.dimensions_as_child

    if (parentDims.length > 0) {
      const parent = parentDims[0].parent
      aggregationExpansion(this.app_data, this.contextualised_node, true, parent)
    }
  }

  aggregateRight = (_dim_name: string) => {
    if (!this.contextualised_node) return

    const parentDims = this.contextualised_node.master_node ?
      this.contextualised_node.master_node.dimensions_as_child :
      this.contextualised_node.dimensions_as_child

    if (parentDims.length > 0) {
      const parent = parentDims[0].parent
      aggregationExpansion(this.app_data, this.contextualised_node, false, parent)
    }
  }

  disaggregate = (dim_name: string) => {
    if (!this.contextualised_node) return

    const childDims = this.contextualised_node.master_node ?
      this.contextualised_node.master_node.dimensions_as_parent :
      this.contextualised_node.dimensions_as_parent

    if (childDims.length > 0) {
      const child = childDims.filter(dim=>dim.children.filter(c=>c.id==dim_name).length>0)[0].children[0].id
      disaggregate(this.app_data, this.contextualised_node, child)
      this.app_data.drawing_area.bypass_autofit = true
      this.drawing_area.draw()
      this.app_data.drawing_area.bypass_autofit = false
      // this.drawing_area.purgeSelection()
      //this.drawing_area.areaAutoFit(false)
      this.refreshAndSave()
    }
  }

  expandLeft = (_dim_name: string) => {
    if (!this.contextualised_node) return

    const childDims = this.contextualised_node.master_node ?
      this.contextualised_node.master_node.dimensions_as_parent :
      this.contextualised_node.dimensions_as_parent
    //this.app_data.drawing_area.sankey.default_node_style.position.auto_x = true
    if (childDims.length > 0) {
      const child = childDims[0].children[0]
      disaggregationExpansion(this.app_data, this.contextualised_node, true, child)
    }
  }

  expandRight = (_: string) => {
    if (!this.contextualised_node) return

    const childDims = this.contextualised_node.master_node ?
      this.contextualised_node.master_node.dimensions_as_parent :
      this.contextualised_node.dimensions_as_parent
    //this.app_data.drawing_area.sankey.default_node_style.position.auto_x = true
    if (childDims.length > 0) {
      const child = childDims[0].children[0]
      disaggregationExpansion(this.app_data, this.contextualised_node, false, child)
    }
  }

  contractLeft = () => {
    if (this.contextualised_node?.master_node && this.contextualised_node.id.includes(EXPANSION_SUFFIXES.LEFT)) {
      contract(this.app_data, this.contextualised_node)
    }
  }

  contractRight = () => {
    if (this.contextualised_node?.master_node && this.contextualised_node.id.includes(EXPANSION_SUFFIXES.RIGHT)) {
      contract(this.app_data, this.contextualised_node)
    }
  }

  createFluxOnChildren = () => {
    if (!this.contextualised_node || !this.contextualised_node.is_parent) return

    const addNewLinks = (n: Class_NodeElement) => {
      n.dimensions_as_parent.forEach(dim => {
        dim.children.forEach(c => {
          if (c.input_links_list.length === 0) {
            n.input_links_list.forEach(l => this.drawing_area.sankey.addNewLink(l.source, c as Class_NodeElement))
          }
          if (c.output_links_list.length === 0) {
            n.output_links_list.forEach(l => this.drawing_area.sankey.addNewLink(c as Class_NodeElement, l.target))
          }
        })
        dim.children.forEach(c => {
          addNewLinks(c as Class_NodeElement)
        })
      })
    }

    addNewLinks(this.contextualised_node)
    this.drawing_area.purgeSelection()
    this.drawing_area.node_contextualised = undefined
    this.drawing_area.areaAutoFit()
    this.refreshAndSave()
  }

  // Actions dynamiques pour les dimensions
  // private createDimensionAction = (actionPrefix: string, isParent: boolean = false) => {
  //   const sankey = this.drawing_area.sankey
  //   const actions: Record<string, () => void> = {}

  //   // Génération dynamique des actions pour chaque dimension
  //   sankey.level_taggs_list.forEach((tagg) => {
  //     const actionName = `${actionPrefix}_${tagg.id}`
  //     actions[actionName] = () => {
  //       if (isParent) {
  //         create_parent(this.app_data, this.selected_nodes, tagg as Class_LevelTagGroup)
  //       } else {
  //         const expand_left = this.selected_nodes.length > 0 ? this.selected_nodes[0].output_links_list.length == 0 : true
  //         const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  //         const source_or_target_attr = expand_left ? 'source' : 'target'

  //         let possible_root_nodes: Set<string> = new Set()
  //         this.selected_nodes.forEach(n => {
  //           if (possible_root_nodes.size !== 0) {
  //             possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
  //               .intersection(possible_root_nodes)
  //           } else {
  //             possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
  //           }
  //         })

  //         set_child(this.app_data, this.selected_nodes, possible_root_nodes, tagg as Class_LevelTagGroup, expand_left)
  //       }
  //     }
  //   })

  //   return actions
  // }

  // createNewDimension = () => {
  //   const sankey = this.drawing_area.sankey
  //   const expand_left = this.selected_nodes.length > 0 ? this.selected_nodes[0].output_links_list.length == 0 : true
  //   const input_or_output_attr = expand_left ? 'input_links_list' : 'output_links_list'
  //   const source_or_target_attr = expand_left ? 'source' : 'target'

  //   let possible_root_nodes: Set<string> = new Set()
  //   this.selected_nodes.forEach(n => {
  //     if (possible_root_nodes.size !== 0) {
  //       possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
  //         .intersection(possible_root_nodes)
  //     } else {
  //       possible_root_nodes = new Set(n[input_or_output_attr].map(l => l[source_or_target_attr].id))
  //     }
  //   })

  //   if (possible_root_nodes.size > 0) {
  //     this.drawing_area.bypass_redraws = true
  //     const tagg_idx = sankey.level_taggs_list.length + 1
  //     const tagg = sankey.addLevelTagGroup('dimension_' + tagg_idx, 'Dimension ' + tagg_idx) as Class_LevelTagGroup
  //     tagg.activated = true
  //     tagg.addTag('1', '1')
  //     tagg.addTag('2', '2')
  //     const parent_level_tag = tagg.tags_list[0]
  //     const child_level_tag = tagg.tags_list[1]
  //     const root_node = sankey.nodes_dict[[...possible_root_nodes][0]]

  //     applyDimension(this.app_data, this.selected_nodes, parent_level_tag, root_node, child_level_tag, tagg, expand_left)
  //     tagg.tags_list[0].setSelected()
  //     this.drawing_area.application_data.menu_configuration.ref_to_leveltag_filter_updater.current()
  //     this.drawing_area.draw()
  //   }
  // }

  // createNewDimensionForParent = () => {
  //   const sankey = this.drawing_area.sankey
  //   const tagg_idx = sankey.level_taggs_list.length + 1
  //   const tagg = sankey.addLevelTagGroup('dimension_' + tagg_idx, 'Dimension ' + tagg_idx) as Class_LevelTagGroup
  //   tagg.activated = true
  //   tagg.addTag('1', '1')
  //   tagg.addTag('2', '2')

  //   create_parent(this.app_data, this.selected_nodes, tagg)
  //   this.drawing_area.application_data.menu_configuration.ref_to_leveltag_filter_updater.current()
  //   this.drawing_area.draw()
  // }

  // ==================================================================================================
  // ACTIONS D'ALIGNEMENT
  // ==================================================================================================

  private alignNode = (
    ref: 'min' | 'max',
    attr: 'position_x' | 'position_y',
    pos: 'b' | 'm' | 'a'
  ) => {
    const dict_old_pos: { [x: string]: [number, number] } = {}
    this.selected_nodes.forEach(n => dict_old_pos[n.id] = [n.position_x, n.position_y])

    const doAlign = () => {
      const node_ref = this.selected_nodes
        .filter(nf => nf.shape_position_type != 'relative')
        .sort((n1, n2) => {
          return ref == 'min' ? n1[attr] - n2[attr] : n2[attr] - n1[attr]
        })[0]

      if (!node_ref) return

      const pos_ref = node_ref[attr]
      const is_circle = (node_ref.shape_type === 'ellipse')
      let wORh_ref = is_circle ? node_ref.getShapeWidthToUse() / 2 : node_ref.getShapeWidthToUse()
      if (attr === 'position_y') {
        wORh_ref = is_circle ? node_ref.getShapeHeightToUse() / 2 : node_ref.getShapeHeightToUse()
      }
      let center_ref = 0
      if (pos === 'm') {
        center_ref = pos_ref + (wORh_ref / 2)
      }

      this.selected_nodes
        .filter(n => n != node_ref && n.shape_position_type != 'relative')
        .forEach(n => {
          const is_circle_to_shift = (n.shape_type === 'ellipse')
          let wORh_to_shift = is_circle_to_shift ? n.getShapeWidthToUse() / 2 : n.getShapeWidthToUse()
          if (attr === 'position_y') {
            wORh_to_shift = is_circle_to_shift ? n.getShapeHeightToUse() / 2 : n.getShapeHeightToUse()
          }

          if (pos === 'm') {
            n[attr] = center_ref - ((wORh_to_shift) / 2)
          }
          else if (pos === 'b') {
            n[attr] = pos_ref
          }
          else {
            n[attr] = (pos_ref + wORh_ref) - wORh_to_shift
          }
          n.draw()
        })
      this.refreshAndSave()
    }

    const undoAlign = () => {
      this.selected_nodes.forEach(n => n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1]))
    }

    this.executeWithUndo(doAlign, undoAlign)
    //this.closeContextMenu()
  }

  // Actions d'alignement spécifiques
  alignHorizMinLeft = () => this.alignNode('min', 'position_x', 'b')
  alignHorizMinCenter = () => this.alignNode('min', 'position_x', 'm')
  alignHorizMinRight = () => this.alignNode('min', 'position_x', 'a')
  alignHorizMaxLeft = () => this.alignNode('max', 'position_x', 'b')
  alignHorizMaxCenter = () => this.alignNode('max', 'position_x', 'm')
  alignHorizMaxRight = () => this.alignNode('max', 'position_x', 'a')
  alignVertMinTop = () => this.alignNode('min', 'position_y', 'b')
  alignVertMinCenter = () => this.alignNode('min', 'position_y', 'm')
  alignVertMinBottom = () => this.alignNode('min', 'position_y', 'a')
  alignVertMaxTop = () => this.alignNode('max', 'position_y', 'b')
  alignVertMaxCenter = () => this.alignNode('max', 'position_y', 'm')
  alignVertMaxBottom = () => this.alignNode('max', 'position_y', 'a')

  // ==================================================================================================
  // ACTIONS DE VISIBILITÉ
  // ==================================================================================================

  toggleShapeVisibility = () => {
    const dict_old_value: { [x: string]: boolean } = {}
    this.selected_nodes.forEach(node => {
      dict_old_value[node.id] = node.shape_visible
    })

    const currentValue = this.contextualised_node?.shape_visible ?? false

    const doToggle = () => {
      this.selected_nodes.forEach(node => {
        node.shape_visible = !currentValue
      })
      this.refreshAndSave()
    }

    const undoToggle = () => {
      this.selected_nodes.forEach(node => {
        node.shape_visible = dict_old_value[node.id]
        node.draw()
      })
      this.refreshAndSave()
    }

    this.executeWithUndo(doToggle, undoToggle)
    //this.closeContextMenu()
  }

  toggleNameVisibility = () => {
    const dict_old_value: { [x: string]: boolean } = {}
    this.selected_nodes.forEach(node => {
      dict_old_value[node.id] = node.name_label_is_visible
    })

    const currentValue = this.contextualised_node?.name_label_is_visible ?? false

    const doToggle = () => {
      this.selected_nodes.forEach(node => {
        node.name_label_is_visible = !currentValue
      })
      this.refreshAndSave()
    }

    const undoToggle = () => {
      this.selected_nodes.forEach(node => {
        node.name_label_is_visible = dict_old_value[node.id]
        node.draw()
      })
      this.refreshAndSave()
    }

    this.executeWithUndo(doToggle, undoToggle)
    //this.closeContextMenu()
  }

  toggleValueVisibility = () => {
    const dict_old_value: { [x: string]: boolean } = {}
    this.selected_nodes.forEach(node => {
      dict_old_value[node.id] = node.value_label_is_visible
    })

    const currentValue = this.contextualised_node?.value_label_is_visible ?? false

    const doToggle = () => {
      this.selected_nodes.forEach(node => {
        node.value_label_is_visible = !currentValue
      })
      this.refreshAndSave()
    }

    const undoToggle = () => {
      this.selected_nodes.forEach(node => {
        node.value_label_is_visible = dict_old_value[node.id]
        node.draw()
      })
      this.refreshAndSave()
    }

    this.executeWithUndo(doToggle, undoToggle)
    //this.closeContextMenu()
  }

  // ==================================================================================================
  // AUTRES ACTIONS
  // ==================================================================================================

  editName = () => {
    this.contextualised_node?.setInputLabelVisible()
    //this.closeContextMenu()
  }

  resetAttr = () => {
    const dict_old_value: { [x: string]: StorageType<typeof ALL_ATTRIBUTES_CONFIG> } = {}
    this.selected_nodes.forEach(n => {
      dict_old_value[n.id] = n.attributes
    })

    const doReset = () => {
      this.selected_nodes.forEach(n => n.resetAttributes())
      this.refreshAndSave()
    }

    const undoReset = () => {
      this.selected_nodes.forEach(n => {
        n.attributes = dict_old_value[n.id]
      })
      this.refreshAndSave()
    }

    this.executeWithUndo(doReset, undoReset)
  }

  reorg = () => {
    const dict_old_io: { [x: string]: string[] } = {}
    this.selected_nodes.forEach(node =>
      dict_old_io[node.id] = [...Object.keys(node.input_links_dict), ...Object.keys(node.output_links_dict)]
    )

    const doReorg = () => {
      this.selected_nodes.forEach(node => node.reorganizeIOLinks())
      this.refreshAndSave()
    }

    const undoReorg = () => {
      this.selected_nodes.forEach(n => n.reorganizeIOFromListIds(dict_old_io[n.id]))
    }

    this.executeWithUndo(doReorg, undoReorg)
  }

  startAnimation = () => {
    this.drawing_area.node_contextualised?.launchAnimation()
  }

  createTiedZdt = () => {
    const cont = this.drawing_area.sankey.addNewDefaultContainer()
    cont.tied_to_nodes = true
    this.drawing_area.selected_nodes_list.forEach(node => {
      node.getListDescendantOfNode().forEach(n => {
        cont.attachNodeToCont(n)
      })
      cont.attachNodeToCont(node)
    })
    this.drawing_area.draw()
  }

  moveToFirstPlan = () => {
    this.drawing_area.selected_nodes_list.forEach(node => {
      const idx_to_shift = this.drawing_area.list_g_element.indexOf(node.id)
      this.drawing_area.moveOrderElementInDA(idx_to_shift, this.drawing_area.list_g_element.length - 1)
    })
    //this.closeContextMenu()
  }

  moveToLastPlan = () => {
    this.drawing_area.selected_nodes_list.forEach(node => {
      const idx_to_shift = this.drawing_area.list_g_element.indexOf(node.id)
      this.drawing_area.moveOrderElementInDA(idx_to_shift, 0)
    })
    //this.closeContextMenu()
  }

  selectOutputLinks = () => {
    this.selected_nodes.forEach(n => {
      n.output_links_list.forEach(l => this.drawing_area.addElementToSelection(l))
    })
    this.refreshAndSave()
  }

  selectInputLinks = () => {
    this.selected_nodes.forEach(n => {
      n.input_links_list.forEach(l => this.drawing_area.addElementToSelection(l))
    })
    this.refreshAndSave()
  }

  static createModifier = (app_data: Class_ApplicationData) => {
    const nodeActions = new NodeActions(app_data)

    // Génération des actions dynamiques pour les dimensions
    // const setChildActions = nodeActions.createDimensionAction('setChild', false)
    // const createParentActions = nodeActions.createDimensionAction('createParent', true)
    //const styleActions = nodeActions.createStyleActions()
    return {
      // Méthodes de visibilité pour les toggles
      getShapeVisibility: nodeActions.getShapeVisibility,
      getNameVisibility: nodeActions.getNameVisibility,
      getValueVisibility: nodeActions.getValueVisibility,

      // Actions de hiérarchie
      aggregate: nodeActions.aggregate,
      aggregateLeft: nodeActions.aggregateLeft,
      aggregateRight: nodeActions.aggregateRight,
      disaggregate: nodeActions.disaggregate,
      expandLeft: nodeActions.expandLeft,
      expandRight: nodeActions.expandRight,
      contractLeft: nodeActions.contractLeft,
      contractRight: nodeActions.contractRight,
      // createFluxOnChildren: nodeActions.createFluxOnChildren,
      // createNewDimension: nodeActions.createNewDimension,
      // createNewDimensionForParent: nodeActions.createNewDimensionForParent,

      // Actions d'alignement
      alignHorizMinLeft: nodeActions.alignHorizMinLeft,
      alignHorizMinCenter: nodeActions.alignHorizMinCenter,
      alignHorizMinRight: nodeActions.alignHorizMinRight,
      alignHorizMaxLeft: nodeActions.alignHorizMaxLeft,
      alignHorizMaxCenter: nodeActions.alignHorizMaxCenter,
      alignHorizMaxRight: nodeActions.alignHorizMaxRight,
      alignVertMinTop: nodeActions.alignVertMinTop,
      alignVertMinCenter: nodeActions.alignVertMinCenter,
      alignVertMinBottom: nodeActions.alignVertMinBottom,
      alignVertMaxTop: nodeActions.alignVertMaxTop,
      alignVertMaxCenter: nodeActions.alignVertMaxCenter,
      alignVertMaxBottom: nodeActions.alignVertMaxBottom,

      // Actions de visibilité
      toggleShapeVisibility: nodeActions.toggleShapeVisibility,
      toggleNameVisibility: nodeActions.toggleNameVisibility,
      toggleValueVisibility: nodeActions.toggleValueVisibility,

      // Autres actions
      editName: nodeActions.editName,
      resetAttr: nodeActions.resetAttr,

      startAnimation: nodeActions.startAnimation,
      createTiedZdt:nodeActions.createTiedZdt,
      reorg: nodeActions.reorg,
      moveToFirstPlan: nodeActions.moveToFirstPlan,
      moveToLastPlan: nodeActions.moveToLastPlan,
      selectOutputLinks: nodeActions.selectOutputLinks,
      selectInputLinks: nodeActions.selectInputLinks,

      // Actions dynamiques générées pour les dimensions
      // ...setChildActions,
      // ...createParentActions,
      // ...styleActions
    }
  }
}

// ==================================================================================================
// EXPORT POUR UTILISATION
// ==================================================================================================

export const createNodeModifier = NodeActions.createModifier

export type NodeModifierType = ReturnType<typeof NodeActions.createModifier>
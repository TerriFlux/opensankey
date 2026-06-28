// ==================================================================================================
// Actions spécifiques aux nœuds - Logique métier séparée
// ==================================================================================================

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_NodeBase } from '../../Elements/NodeBase'
import {
  aggregate,
  disaggregate,
  aggregationExpansion,
  disaggregationExpansion,
  contract,
} from '../../Algorithms/Hierarchies'
import { Class_DrawingArea } from '../../types/DrawingArea'
import { Class_ApplicationHistory } from '../../types/ApplicationHistory'
import { StorageType } from '../../Elements/Element'
import { ALL_ATTRIBUTES_CONFIG } from '../../Elements/ElementsAttributesConfig'
import { NodePositioning } from '../../Algorithms/NodePositioning'
import { Class_NodeDimension } from '../../Elements/NodeDimension'
import { downloadImageSource } from './SaveImage'

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
    // #1231 — rafraîchir le menu Hiérarchies (toolbar) pour qu'il reflète tout de suite
    // l'état hybride après une (dés)agrégation locale : bouton « Réinitialiser » +
    // dropdowns désactivés, sans avoir à recharger.
    this.drawing_area.application_data.menu_configuration.ref_to_toolbar_level_tag_filter_updater?.current?.()
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

  // Snapshot every state mutated by tied-frame actions so undo can restore
  // it. Captures the frame's own geometry, its tied flag, the list of
  // attached nodes, and each attached node's own geometry (since drag /
  // stack moves them too).
  private _captureTiedFrameState = (nodes: Class_NodeElement[]) => nodes.map(n => ({
    node: n,
    tied: n.tied_to_nodes,
    attached: [...n.attached_node],
    x: n.position_x, y: n.position_y,
    w: n.shape_min_width, h: n.shape_min_height,
    children: [...n.attached_node, ...n.getListDescendantOfNode()].map(c => ({
      c, x: c.position_x, y: c.position_y,
    })),
  }))

  private _restoreTiedFrameState = (snap: ReturnType<NodeActions['_captureTiedFrameState']>) => {
    snap.forEach(s => {
      // Detach everything currently attached, then reattach the old set.
      for (let i = s.node.attached_node.length - 1; i >= 0; i--) {
        s.node.dettachNodeFromCont(s.node.attached_node[i])
      }
      s.attached.forEach(a => s.node.attachNodeToCont(a))
      s.node.tied_to_nodes = s.tied
      s.node.position_x = s.x
      s.node.position_y = s.y
      s.node.shape_min_width = s.w
      s.node.shape_min_height = s.h
      s.children.forEach(({ c, x, y }) => { c.position_x = x; c.position_y = y })
    })
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

    const child_dims = this.contextualised_node.dimensions_as_child

    //let parent = dim_name ? this.app_data.drawing_area.sankey.level_taggs_dict[dim_name] : child_dims[0].parent
    // if (!dim_name) {
    //   if (child_dims.filter(dim => dim.force_show_children).length != 0) {
    //     level_tagg = child_dims.filter(dim => dim.force_show_children)[0].related_level_tagg
    //   }
    // }

    if (child_dims.length > 0) {
      aggregate(this.app_data, this.contextualised_node, parent)
      this._restackEnglobingChain(this.contextualised_node)
      this.drawing_area.draw()
      this.drawing_area.purgeSelection()
      this.drawing_area.node_contextualised = undefined
      //this.drawing_area.areaAutoFit(false)
      this.refreshAndSave()
    }
  }

  aggregateLeft = (_dim_name: string) => {
    if (!this.contextualised_node) return

    const parentDims = this.contextualised_node.dimensions_as_child

    if (parentDims.length > 0) {
      const parent = parentDims[0].parent
      aggregationExpansion(this.app_data, this.contextualised_node, true, parent)
      this._restackEnglobingChain(this.contextualised_node)
    }
  }

  aggregateRight = (_dim_name: string) => {
    if (!this.contextualised_node) return

    const parentDims = this.contextualised_node.dimensions_as_child

    if (parentDims.length > 0) {
      const parent = parentDims[0].parent
      aggregationExpansion(this.app_data, this.contextualised_node, false, parent)
      this._restackEnglobingChain(this.contextualised_node)
    }
  }

  disaggregate = (dim_name: string) => {
    if (!this.contextualised_node) return

    const childDims = this.contextualised_node.dimensions_as_parent

    if (childDims.length > 0) {
      const target_dim = childDims.filter(dim => dim.children.filter(c => c.id == dim_name).length > 0)[0]
      const child = target_dim.children[0].id
      disaggregate(this.app_data, this.contextualised_node, child)
      // #1231 — désagrégation LOCALE (clic droit) → marque l'état hybride local
      // (affiche « Réinitialiser la hiérarchie »).
      target_dim.forced_by_local_action = true
      this._restackEnglobingChain(this.contextualised_node)
      this.drawing_area.draw()
      // this.drawing_area.purgeSelection()
      //this.drawing_area.areaAutoFit(false)
      this.refreshAndSave()
    }
  }

  // Les expansions/contractions latérales mutent une grosse partie du graphe
  // (création/suppression de nœuds et de liens, reroutage). Plutôt que de
  // tenter une inverse symbolique fragile, on snapshot l'application complète
  // (toJSON) et on restaure via fromJSON pour l'undo. Le redo réapplique
  // simplement l'action sur l'état restauré (les ids stables permettent de
  // re-résoudre le nœud contextualisé).
  private _runExpansionWithUndo = (
    fn: (node: Class_NodeElement) => void
  ) => {
    if (!this.contextualised_node) return
    const ctx_id = this.contextualised_node.id
    const snapshot = this.app_data.toJSON()
    const apply = () => {
      const node = this.drawing_area.sankey.nodes_dict[ctx_id]
      if (!node) return
      fn(node)
      this._restackEnglobingChain(node)
      this.refreshAndSave()
    }
    const undo = () => {
      this.app_data.fromJSON(snapshot)
      this.refreshAndSave()
    }
    this.executeWithUndo(apply, undo)
  }

  expandLeft = (dim_name: string) => {
    this._runExpansionWithUndo((node) => {
      const child = this.drawing_area.sankey.nodes_dict[dim_name]
      if (!child) return
      disaggregationExpansion(this.app_data, node, true, child)
      // #1231 — expansion LOCALE (clic droit) → marque l'état hybride local.
      const dim = node.nodeDimensionAsParent(child)
      if (dim) dim.forced_by_local_action = true
    })
  }

  expandRight = (dim_name: string) => {
    this._runExpansionWithUndo((node) => {
      const child = this.drawing_area.sankey.nodes_dict[dim_name]
      if (!child) return
      disaggregationExpansion(this.app_data, node, false, child)
      // #1231 — expansion LOCALE (clic droit) → marque l'état hybride local.
      const dim = node.nodeDimensionAsParent(child)
      if (dim) dim.forced_by_local_action = true
    })
  }

  contractLeft = () => {
    if (!this.contextualised_node?.dimensions_as_parent.some(d => d.expanded_left)) return
    this._runExpansionWithUndo((node) => contract(this.app_data, node))
  }

  contractRight = () => {
    if (!this.contextualised_node?.dimensions_as_parent.some(d => d.expanded_right)) return
    this._runExpansionWithUndo((node) => contract(this.app_data, node))
  }

  // Issue #1225 — contracter l'expansion d'un nœud parent depuis le menu
  // d'un de ses enfants (bouton ← Parent dans le menu d'un enfant expansé).
  contractParent = (parent_id: string) => {
    const parent_node = this.drawing_area.sankey.nodes_dict[parent_id]
    if (!parent_node) return
    if (!parent_node.dimensions_as_parent.some(d => d.is_expanded)) return
    const ctx_id = this.contextualised_node?.id
    const snapshot = this.app_data.toJSON()
    const apply = () => {
      const p = this.drawing_area.sankey.nodes_dict[parent_id]
      if (!p) return
      contract(this.app_data, p)
      this._restackEnglobingChain(p)
      if (ctx_id) {
        const ctx = this.drawing_area.sankey.nodes_dict[ctx_id]
        if (ctx) this._restackEnglobingChain(ctx)
      }
      this.refreshAndSave()
    }
    const undo = () => {
      this.app_data.fromJSON(snapshot)
      this.refreshAndSave()
    }
    this.executeWithUndo(apply, undo)
  }

  // Container display mode (parent surrounds children, links filtered per side)
  private _findDimensionFromOtherId = (other_id: string) => {
    if (!this.contextualised_node) return undefined
    const node = this.contextualised_node
    const dim_as_child = node.dimensions_as_child.find(dim => dim.parent.id === other_id)
    if (dim_as_child) return dim_as_child
    return node.dimensions_as_parent.find(dim =>
      dim.children.some(c => c.id === other_id)
    )
  }

  // Collecte les nœuds qui doivent appartenir au cadre tied d'un ancêtre
  // englobant après désagrégation/expansion. On descend dans toute
  // dim_as_parent en `force_show_children` (= dim désagrégée) pour
  // attraper les enfants à la place du parent — même si le parent reste
  // is_visible (ce qui arrive en imbriqué : un container_mode hérité
  // garde le parent visible côté visibilité de nœud, mais visuellement
  // ce sont les enfants qui prennent sa place dans la pile englobante).
  // En mode expansion (issue #1225), les enfants d'une dim is_expanded
  // sont aussi visibles à côté du parent — on les collecte également.
  private _collectVisibleEnglobedNodes = (roots: Class_NodeElement[]): Class_NodeElement[] => {
    const out: Class_NodeElement[] = []
    const seen = new Set<string>()
    const visit = (n: Class_NodeElement) => {
      if (seen.has(n.id)) return
      const expanded_dim = n.dimensions_as_parent.find(d => d.force_show_children)
      if (expanded_dim) {
        seen.add(n.id) // on saute le parent au profit de ses enfants
        expanded_dim.children.forEach(c => visit(c as Class_NodeElement))
        return
      }
      seen.add(n.id)
      if (n.is_visible) out.push(n)
      // Descendre dans les sous-dims pour attraper les enfants visibles
      // des dims désagrégées ou expansées en cascade.
      n.dimensions_as_parent.forEach(d => {
        (d.children as Class_NodeElement[]).forEach(c => {
          if (!seen.has(c.id)) visit(c)
        })
      })
    }
    roots.forEach(visit)
    return out
  }

  // Re-stack une dim englobante (dim.parent doit être en container_mode) :
  // détache l'attached_node courant, recollecte tous les descendants
  // visibles de dim.children, les empile verticalement sur dim.parent et
  // les ré-attache. La taille du parent suit dynamiquement via
  // _envelopeSize() (NodeBase.getShape*ToUse).
  private _restackEnglobingDim = (d: Class_NodeDimension) => {
    const p = d.parent as Class_NodeElement
    for (let i = p.attached_node.length - 1; i >= 0; i--) {
      p.dettachNodeFromCont(p.attached_node[i])
    }
    const cs = this._collectVisibleEnglobedNodes(d.children as Class_NodeElement[])
    // Les enfants d'une dim expansée ont déjà été positionnés par
    // disaggregationExpansion (colonne latérale gauche/droite). On NE les
    // ré-empile PAS dans la colonne du parent — sinon le visuel d'expansion
    // serait cassé. On les attache quand même au cadre tied pour que
    // l'enveloppe les englobe (taille + drag suivent).
    // Transitivité (issue #1225) — délégué à Class_NodeElement.findExpandedAncestor.
    const isExpandedChild = (c: Class_NodeElement): boolean =>
      c.findExpandedAncestor() !== null
    const stackable = cs.filter(c => !isExpandedChild(c))
    const expanded = cs.filter(isExpandedChild)
    // #1231 — exactement comme la DÉSAGRÉGATION : les enfants suivent le mode d'écart
    // vertical configuré (cf. Type_DisaggregationGap / layoutChildrenInParentSlot). On lit
    // la hauteur du slot AVANT de passer le parent en cadre (sinon getShapeHeightToUse
    // renvoie l'enveloppe des enfants → circulaire). Défaut 'fill' = remplissage du slot
    // [haut, bas] → le cadre les entoure et aucun voisin n'est poussé. Le x du parent est
    // TOUJOURS appliqué (même en 'keep' qui ne conserve que le Y des enfants).
    const parent_top = p.position_y
    const parent_h = p.getShapeHeightToUse()
    p.tied_to_nodes = true
    stackable.forEach(c => { c.position_x = p.position_x })
    this.drawing_area.nodePositioning.layoutChildrenInParentSlot(stackable, parent_top, parent_h)
    stackable.forEach(c => p.attachNodeToCont(c))
    expanded.forEach(c => p.attachNodeToCont(c))
    p.expandToContainAttachedNodes()
    // Le bascule de visibilité / la nouvelle pile changent l'ordre et
    // les ancres des liens I/O. Reorganize sur le parent, chaque enfant
    // collecté ET sur les sources/cibles externes — sinon les liens
    // restent attachés à la mauvaise position côté nœud distant.
    const to_reorg = new Set<Class_NodeElement>([p, ...cs])
    cs.forEach(c => {
      c.input_links_list.forEach(l => to_reorg.add(l.source))
      c.output_links_list.forEach(l => to_reorg.add(l.target))
    })
    to_reorg.forEach(n => n.reorganizeIOLinks())
  }

  // Remonte la chaîne des ancêtres englobants à partir de `start_node` et
  // re-stacke chaque dim englobée trouvée. À appeler après toute opération
  // qui modifie la structure visible sous un nœud englobé : disaggregate,
  // aggregate, expandLeft/Right, contractLeft/Right, mode container.
  private _restackEnglobingChain = (start_node: Class_NodeElement) => {
    let cur: Class_NodeElement | undefined = start_node
    const visited = new Set<string>([cur.id])
    while (cur) {
      const ancestor_dim = cur.dimensions_as_child.find(d => !!d.container_mode)
      if (!ancestor_dim) break
      const ancestor_parent = ancestor_dim.parent as Class_NodeElement
      if (visited.has(ancestor_parent.id)) break
      visited.add(ancestor_parent.id)
      this._restackEnglobingDim(ancestor_dim)
      cur = ancestor_parent
    }
  }

  // Entering an enclosing mode also turns the parent into a geometric
  // frame for its children, so the parent visually wraps them. Both
  // capabilities stay independent in general; this is the only place
  // where they are coupled.
  private _runContainerModeWithUndo = (
    other_id: string,
    target_mode: 'in_children_out_parent' | 'in_parent_out_children' | 'in_children_out_children' | 'in_parent_out_parent' | null
  ) => {
    const dim = this._findDimensionFromOtherId(other_id)
    if (!dim) return
    const prev_mode = dim.container_mode
    const parent = dim.parent
    const before = this._captureTiedFrameState([parent])
    const is_prop = this.drawing_area.sankey.default_style.shape_position_type === 'proportional'
    const apply = () => {
      // #1231 — opération STRUCTURELLE : suspendre la compression proportionnelle. Sinon
      // un draw transitoire (déclenché par setContainerMode/attach, parent-cadre + enfants
      // visibles dans la même colonne → somme de colonne doublée) ferait bondir f, dilatant
      // tout le diagramme, et la re-capture finale figerait cet état dilaté.
      this.drawing_area.nodePositioning.suppressProportionalCompression = is_prop
      if (target_mode === null) {
        // #1231 — en mode englobant, expandToContainAttachedNodes a élargi le cadre pour
        // inclure les LABELS des enfants (via le getBBox SVG). En sortant, le parent garde
        // ce x/y label-inclus → il apparaît décalé. On le recale sur le x/y du nœud enfant
        // LE PLUS HAUT (forme, sans label) = sa position logique d'origine. Le désenglobement
        // RÉAGRÈGE (enfants cachés) → on lit les positions AVANT unsetContainerMode, et sur
        // TOUS les enfants (leur position_x/y stockée survit au masquage).
        const all_children = (dim.children as Class_NodeElement[])
        const top_child = all_children.length > 0
          ? all_children.reduce((a, b) => (b.position_y < a.position_y ? b : a))
          : undefined
        dim.unsetContainerMode()
        // Mirror entering: detach this dim's children from the parent's
        // frame; preserve sibling/manual attaches.
        dim.children.forEach(child => parent.dettachNodeFromCont(child))
        if (parent.attached_node.length === 0) parent.tied_to_nodes = false
        if (top_child) {
          parent.position_x = top_child.position_x
          parent.position_y = top_child.position_y
        }
      } else {
        dim.setContainerMode(target_mode)
        // #1231 — englobement LOCAL (clic droit) → marque l'état hybride local
        // (affiche « Réinitialiser la hiérarchie »).
        dim.forced_by_local_action = true
        parent.tied_to_nodes = true
        // Mirror leaving: attach this dim's children into the parent's
        // geometric frame, so the cadre géométrique behaves like a ZDT
        // (the frame "contains" its elements via _attached_node).
        dim.children.forEach(child => parent.attachNodeToCont(child))
        this._restackEnglobingDim(dim)
      }
      // Propagation aux ancêtres englobants : indispensable quand la dim
      // qu'on vient de modifier (ou son parent) est elle-même imbriquée
      // dans un parent en container_mode — sinon l'enveloppe visuelle de
      // l'ancêtre n'intègre pas les nouveaux enfants/petits-enfants.
      this._restackEnglobingChain(parent)
      // #1231 — l'englobement est une commande de positionnement → bascule en mode ABSOLU
      // (positions explicites des enfants dans le cadre). Le couple flux/datatag de réf reste
      // persisté. setAbsoluteMode re-cale les ancres de centre (#1230).
      this.drawing_area.setAbsoluteMode()
      // Lever la suppression APRÈS (le mode est désormais absolu → pas de compression de toute façon).
      this.drawing_area.nodePositioning.suppressProportionalCompression = false
      this.drawing_area.draw()
      // #1231 — redessiner juste le nœud-cadre une fois les positions finales des
      // enfants appliquées (sa taille = enveloppe des enfants), sinon le cadre n'apparaît
      // qu'au prochain redraw manuel. Inutile de redessiner toute la zone.
      parent.draw()
    }
    const undo = () => {
      this.drawing_area.nodePositioning.suppressProportionalCompression = is_prop
      if (prev_mode === null) dim.unsetContainerMode()
      else dim.setContainerMode(prev_mode)
      this._restoreTiedFrameState(before)
      // #1231 — comme apply : on reste en mode absolu (réf persistée conservée).
      this.drawing_area.setAbsoluteMode()
      this.drawing_area.nodePositioning.suppressProportionalCompression = false
      this.drawing_area.draw()
    }
    this.executeWithUndo(apply, undo)
    this.refreshAndSave()
  }

  containerInChildrenOutParent = (other_id: string) => this._runContainerModeWithUndo(other_id, 'in_children_out_parent')
  containerInParentOutChildren = (other_id: string) => this._runContainerModeWithUndo(other_id, 'in_parent_out_children')
  containerInChildrenOutChildren = (other_id: string) => this._runContainerModeWithUndo(other_id, 'in_children_out_children')
  containerInParentOutParent = (other_id: string) => this._runContainerModeWithUndo(other_id, 'in_parent_out_parent')
  unsetContainerMode = (other_id: string) => this._runContainerModeWithUndo(other_id, null)

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
    // L'alignement opère sur les nœuds ET les zones de texte (containers)
    // sélectionnés : tous héritent de Class_NodeBase et partagent
    // position_x/y, getShapeWidthToUse/HeightToUse, shape_type et setPosXY.
    const elements: Class_NodeBase[] = [
      ...this.selected_nodes,
      ...this.drawing_area.selected_containers_list,
    ]

    const dict_old_pos: { [x: string]: [number, number] } = {}
    elements.forEach(n => dict_old_pos[n.id] = [n.position_x, n.position_y])

    const doAlign = () => {
      const node_ref = elements
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

      elements
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
      elements.forEach(n => n.setPosXY(dict_old_pos[n.id][0], dict_old_pos[n.id][1]))
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

  // Propage le style (styles custom + attributs) de chaque nœud parent
  // sélectionné à toute sa descendance dans la hiérarchie de dimensions (comme
  // le pinceau, mais parent → enfants). Multi-sélection supportée : si aucun
  // nœud n'est sélectionné on retombe sur le nœud contextualisé. L'undo/redo
  // (une seule transition pour toute la sélection) est géré dans
  // applyStyleToNodesChildren.
  applyStyleToChildren = () => {
    const parents = (this.selected_nodes.length > 0
      ? this.selected_nodes
      : (this.contextualised_node ? [this.contextualised_node] : [])
    ).filter(n => n.is_parent)
    if (parents.length === 0) return
    this.drawing_area.applyStyleToNodesChildren(parents)
    this.refreshAndSave()
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
    this.drawing_area.selected_nodes_list.forEach(n => {
      n.getListDescendantOfNode().forEach(node => {
        cont.attachNodeToCont(node)
      })
      n.getListAncestorOfNode().forEach(node => {
        cont.attachNodeToCont(node)
      })
      cont.attachNodeToCont(n)
      cont.computeSizeAndPositionFromAttachedNodes()
    })
    this.drawing_area.draw()
  }

  // Cadre géométrique sur le nœud lui-même : attache les nœuds géométriquement
  // à l'intérieur des bornes du nœud (mêmes règles que ZDT — cf.
  // ContextZDTOSP.btn_select_node_inside), puis auto-resize.
  setTiedFrame = () => {
    const nodes = [...this.drawing_area.selected_nodes_list]
    const before = this._captureTiedFrameState(nodes)
    this.executeWithUndo(
      () => {
        nodes.forEach(n => {
          n.tied_to_nodes = true
          const frame_x = n.position_x
          const frame_y = n.position_y
          const frame_w = n.getShapeWidthToUse()
          const frame_h = n.getShapeHeightToUse()
          this.drawing_area.sankey.visible_nodes_list
            .filter(other => {
              if (other === n) return false
              const horizontally_in = (
                other.position_x >= frame_x &&
                (other.position_x + other.getShapeWidthToUse()) <= (frame_x + frame_w)
              )
              const vertically_in = (
                other.position_y >= frame_y &&
                (other.position_y + other.getShapeHeightToUse()) <= (frame_y + frame_h)
              )
              return horizontally_in && vertically_in
            })
            .forEach(inside => {
              inside.getListDescendantOfNode().forEach(d => { if (d !== n) n.attachNodeToCont(d) })
              inside.getListAncestorOfNode().forEach(a => { if (a !== n) n.attachNodeToCont(a) })
              n.attachNodeToCont(inside)
            })
          n.computeSizeAndPositionFromAttachedNodes()
        })
        this.drawing_area.draw()
      },
      () => { this._restoreTiedFrameState(before); this.drawing_area.draw() }
    )
  }

  // Repasse le nœud en cadre simple : détache tout, taille/position figées.
  unsetTiedFrame = () => {
    const nodes = [...this.drawing_area.selected_nodes_list]
    const before = this._captureTiedFrameState(nodes)
    this.executeWithUndo(
      () => {
        nodes.forEach(n => {
          for (let i = n.attached_node.length - 1; i >= 0; i--) {
            n.dettachNodeFromCont(n.attached_node[i])
          }
          n.tied_to_nodes = false
        })
        this.drawing_area.draw()
      },
      () => { this._restoreTiedFrameState(before); this.drawing_area.draw() }
    )
  }

  // Action explicite : aligne tous les bords sur la bbox des attached_node.
  fitFrameToAttached = () => {
    const nodes = [...this.drawing_area.selected_nodes_list]
    const before = this._captureTiedFrameState(nodes)
    this.executeWithUndo(
      () => {
        nodes.forEach(n => {
          if (n.tied_to_nodes) n.computeSizeAndPositionFromAttachedNodes()
        })
        this.drawing_area.draw()
      },
      () => { this._restoreTiedFrameState(before); this.drawing_area.draw() }
    )
  }

  moveToFirstPlan = () => {
    this.drawing_area.selected_nodes_list.forEach(node => {
      const idx_to_shift = this.drawing_area.list_g_element.indexOf(node.id)
      this.drawing_area.moveOrderElementInDA(idx_to_shift, 0)
    })
    //this.closeContextMenu()
  }

  moveToLastPlan = () => {
    this.drawing_area.selected_nodes_list.forEach(node => {
      const idx_to_shift = this.drawing_area.list_g_element.indexOf(node.id)
      this.drawing_area.moveOrderElementInDA(idx_to_shift, this.drawing_area.list_g_element.length - 1)
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

  copyElement = () => {
    this.drawing_area.copyNodes(this.selected_nodes.map(n => n.id))
    this.closeContextMenu()
    this.refreshAndSave()
  }

  // Fige la hauteur de chaque nœud sélectionné à sa hauteur courante (plafond
  // max_height = hauteur intrinsèque actuelle). S'applique en mode stock comme
  // normal. Undoable.
  setMaxHeightToCurrent = () => {
    const nodes = this.selected_nodes.length > 0
      ? this.selected_nodes
      : (this.contextualised_node ? [this.contextualised_node] : [])
    if (nodes.length === 0) return
    const dict_old_value: { [x: string]: number | null } = {}
    nodes.forEach(n => { dict_old_value[n.id] = n.max_height })

    const doSet = () => {
      nodes.forEach(n => { n.setMaxHeightToCurrentHeight(); n.draw() })
      this.refreshAndSave()
    }
    const undoSet = () => {
      nodes.forEach(n => { n.max_height = dict_old_value[n.id]; n.draw() })
      this.refreshAndSave()
    }
    this.executeWithUndo(doSet, undoSet)
  }

  // Supprime le plafond de hauteur (max_height = null) sur les nœuds
  // sélectionnés. Undoable.
  clearMaxHeight = () => {
    const nodes = this.selected_nodes.length > 0
      ? this.selected_nodes
      : (this.contextualised_node ? [this.contextualised_node] : [])
    if (nodes.length === 0) return
    const dict_old_value: { [x: string]: number | null } = {}
    nodes.forEach(n => { dict_old_value[n.id] = n.max_height })

    const doClear = () => {
      nodes.forEach(n => { n.max_height = null; n.draw() })
      this.refreshAndSave()
    }
    const undoClear = () => {
      nodes.forEach(n => { n.max_height = dict_old_value[n.id]; n.draw() })
      this.refreshAndSave()
    }
    this.executeWithUndo(doClear, undoClear)
  }

  // Télécharge l'image affichée sur le nœud (icon_is_image) sous forme de fichier.
  saveNodeImage = () => {
    const node = this.contextualised_node
    if (!node?.icon_is_image || !node.icon_image_src) return
    downloadImageSource(node.icon_image_src, node.name || node.id)
    this.closeContextMenu()
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
      contractParent: nodeActions.contractParent,
      containerInChildrenOutParent: nodeActions.containerInChildrenOutParent,
      containerInParentOutChildren: nodeActions.containerInParentOutChildren,
      containerInChildrenOutChildren: nodeActions.containerInChildrenOutChildren,
      containerInParentOutParent: nodeActions.containerInParentOutParent,
      unsetContainerMode: nodeActions.unsetContainerMode,
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
      applyStyleToChildren: nodeActions.applyStyleToChildren,

      startAnimation: nodeActions.startAnimation,
      createTiedZdt: nodeActions.createTiedZdt,
      setTiedFrame: nodeActions.setTiedFrame,
      unsetTiedFrame: nodeActions.unsetTiedFrame,
      fitFrameToAttached: nodeActions.fitFrameToAttached,
      reorg: nodeActions.reorg,
      moveToFirstPlan: nodeActions.moveToFirstPlan,
      moveToLastPlan: nodeActions.moveToLastPlan,
      selectOutputLinks: nodeActions.selectOutputLinks,
      selectInputLinks: nodeActions.selectInputLinks,
      copyElement: nodeActions.copyElement,
      setMaxHeightToCurrent: nodeActions.setMaxHeightToCurrent,
      clearMaxHeight: nodeActions.clearMaxHeight,
      saveNodeImage: nodeActions.saveNodeImage,

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
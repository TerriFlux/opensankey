// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Mode PARAMETRIQUE / grille extrait de NodePositioning (#243, split des modes). Colonnes (u) et
// niveaux (v) : clustering par x, calcul des V (agrege/desagrege par level tag), empilement
// vertical des colonnes et des cadres englobants, back-calc des ecarts, alignement grille.
//
// Le mode << ecart >> (recomputeParametricLayout) reutilise le cadre du mode proportionnel :
// #1231 — Mode « écart » (ex-paramétrique) : réutilise intégralement le cadre du mode
// proportionnel (médiane globale `_prop_median_y`, facteur f via `_prop_ref_col_sums`,
// centre de réf PAR NŒUD `_prop_center_ref` sur NodeBase). Seule l'application diffère :
// le NŒUD DU HAUT de chaque colonne prend sa position % (comme le mode proportionnel),
// puis le reste s'empile dessous avec des écarts constants. Pas de champ dédié.
// Ces lectures passent par `this.np.proportional`. Sous-service compose : `drawingArea` en getter,
// corps deplaces VERBATIM.

import type { Class_NodeElement } from '../Elements/Node'
import { Class_LevelTag } from '../types/Tag'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { NodePositioning } from './NodePositioning'
import * as Geometry from './NodePositioningGeometry'

export class NodePositioningParametric {
  constructor(private readonly np: NodePositioning) { }

  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }

  /**
   * Place verticalement les enfants d'une opération STRUCTURELLE (désagrégation,
   * expansion latérale, englobement) dans le slot vertical du parent `[parent_top,
   * parent_top + parent_h]`, selon le mode d'écart configuré sur la DrawingArea
   * (`effective_gap_mode` = surcharge transitoire ?? réglage global), cf.
   * Type_DisaggregationGap :
   *  - 'fill'        : écart égal pour remplir exactement le slot (≥ 0). Historique #1231.
   *  - 'keep'        : aucun repositionnement VERTICAL (les enfants gardent leur position_y).
   *  - 'children_dy' : empile depuis `parent_top`, écart = shape_position_dy de chaque enfant.
   *  - 'constant'    : empile depuis `parent_top`, écart = disaggregation_gap_value, réécrit dans dy.
   *
   * N.B. : ne touche QUE position_y (+ shape_position_dy selon le mode). L'appelant gère
   * position_u / position_x (qui diffèrent selon l'opération : colonne du parent pour la
   * désagrégation, colonne adjacente décalée pour l'expansion) et les applique TOUJOURS,
   * même en 'keep' (qui ne conserve que le Y des enfants).
   * L'ordre du tableau `children` détermine l'empilement (haut → bas).
   */
  public layoutChildrenInParentSlot(
    children: Class_NodeElement[],
    parent_top: number,
    parent_h: number
  ): void {
    const mode = this.drawingArea.effective_gap_mode
    if (children.length === 0) return
    // 'keep' ne touche pas au Y (les enfants gardent leur position_y) ; les autres modes
    // empilent depuis parent_top. Dans TOUS les cas, le x a déjà été posé par l'appelant.
    if (mode !== 'keep') {
      const default_dy = this.drawingArea.sankey.default_style.shape_position_dy
      const const_gap = this.drawingArea.disaggregation_gap_value
      const sum_h = children.reduce((s, c) => s + c.getShapeHeightToUse(), 0)
      const fill_gap = children.length > 1
        ? Math.max(0, (parent_h - sum_h) / (children.length - 1))
        : 0
      let cursor = parent_top
      children.forEach((c, i) => {
        if (i > 0) {
          const gap = mode === 'fill'
            ? fill_gap
            : mode === 'children_dy'
              ? (c.shape_position_dy ?? default_dy)
              : const_gap
          cursor += gap
          // 'fill' fixe un écart CALCULÉ (propre à ce slot) → on le matérialise dans dy pour que
          // le ré-empilement au dessin le reproduise. 'constant' est au contraire lu EN DIRECT
          // depuis disaggregation_gap_value (containerChildGap) : ne rien figer, sinon éditer la
          // valeur ne changerait pas les englobements déjà en place.
          if (mode === 'fill') c.shape_position_dy = gap
        }
        c.position_y = cursor
        cursor += c.getShapeHeightToUse()
      })
    }
    // #1230/#1231 — CAPITAL : ré-ancrer le centre (#1230) sur la position FINALE des enfants.
    // Sinon le setAbsoluteMode() de fin d'opération, s'il vient du mode proportionnel/échelle,
    // appelle deriveAbsoluteNodesFromCenter() qui restaurerait le centre PÉRIMÉ des enfants
    // (capturé avant qu'ils soient masqués/déplacés) et écraserait le x/y qu'on vient de poser.
    children.forEach(c => c.captureCenterFromCorner())
  }

  /**
   * Point d'entrée unique pour le recompute du layout paramétrique (PR 3).
   *
   * Traite une colonne (ensemble de nœuds visibles partageant un même
   * `position_u`) comme une pile verticale triée par `position_v` croissant,
   * ancrée sur le `position_y` courant du nœud de plus petit V, et espacée
   * par `shape_position_dy` via `stackNodesVertically` (cf. PR 2).
   *
   * **Responsabilité stricte : empilement géométrique uniquement.** `position_v`
   * est supposé déjà à jour à l'entrée — les call sites qui ont besoin de le
   * recalculer (nouveau diagramme, bascule de mode, data tag change) doivent
   * appeler `computeParametricV` avant. Cette séparation des responsabilités
   * était le point 1 de la discussion PR 3 : V est une donnée métier, le
   * recompute est un calcul géométrique pur.
   *
   * **Limitation de l'étape 1 (ce commit)** : les containers ne sont **pas**
   * traités récursivement. Les nœuds enfants d'un container (i.e. ceux avec
   * `dimensions_as_child.some(d => d.container_mode)`) sont exclus du
   * stacking de colonne — l'ancien chemin `Node.applyPosition` les prend en
   * charge via sa logique `nodeAbove`. L'intégration récursive des
   * containers comme sous-colonnes est prévue dans un commit ultérieur de
   * PR 3.
   *
   * **Scopes supportés** :
   * - `{ type: 'all' }` : toutes les colonnes top-level de la drawing area.
   * - `{ type: 'column', u: number }` : une seule colonne (utile pour fin
   *   de drag, désagrégation latérale).
   * - `{ type: 'subtree', node }` : réservé à l'étape containers récursifs
   *   (commit ultérieur) — non implémenté ici, lève une erreur explicite.
   *
   * Les nœuds « échange » (tag `type de noeud` / `echange`) sont exclus du
   * stacking, comme dans tous les autres chemins paramétriques.
   *
   * **Dead code temporaire** : tant que `Node.applyPosition` n'est pas
   * réduit à un pass-through, appeler `recomputeParametricLayout` n'a aucun
   * effet visible — le prochain `applyPosition` écrase les positions qu'on
   * vient de poser. C'est volontaire : ce commit ajoute uniquement la
   * plomberie, la bascule de `applyPosition` et la migration des call sites
   * viennent dans un commit séparé pour isoler les régressions éventuelles.
   */
  public recomputeParametricLayout(
    scope: { type: 'all' } | { type: 'column', u: number } | { type: 'subtree', node: Class_NodeElement }
  ) {
    if (scope.type === 'subtree') {
      throw new Error(
        '[recomputeParametricLayout] scope \'subtree\' not implemented yet ' +
        '— requires container recursion (future commit of PR 3).'
      )
    }

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']

    // Mode d'écart des enfants de cadre + valeur constante LIVE (cf. containerChildGap) : partagés
    // par le sizing (Phase A) et l'empilement (Phase C) pour que l'écart 'constant' reste éditable.
    const gap_mode = this.drawingArea.effective_gap_mode
    const const_gap = this.drawingArea.disaggregation_gap_value

    // --- Helpers ---

    // A container is any node that is a parent of at least one dimension
    // running in container_mode. Nested containers are handled recursively.
    const isContainerParent = (n: Class_NodeElement): boolean =>
      n.dimensions_as_parent.some(d => d.container_mode)

    // A "top-level" node for the column stacking is a visible, non-exchange
    // node that is NOT itself sitting inside a container. Top-level nodes
    // include: plain leaves, plain intermediates, AND top-level containers
    // (containers that are not themselves children of another container).
    // Container children — at any depth — are excluded; they are positioned
    // by the recursive container descent pass.
    const isTopLevel = (n: Class_NodeElement): boolean => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      if (n.dimensions_as_child.some(d => d.container_mode)) return false
      return true
    }

    // Sort container children by position_v, with a stable tie-break on
    // the current position_y so equal-V or unassigned-V (-1) nodes don't
    // dance around between recomputes.
    const sortByV = (nodes: Class_NodeElement[]): Class_NodeElement[] => {
      return [...nodes].sort((a, b) => {
        if (a.position_v !== b.position_v) return a.position_v - b.position_v
        return a.position_y - b.position_y
      })
    }

    // Collect direct container children of a given container parent.
    // Dedupes across multiple container_mode dimensions and keeps only
    // visible non-exchange nodes (the rest do not contribute to the
    // envelope).
    const collectContainerChildren = (container: Class_NodeElement): Class_NodeElement[] => {
      const seen = new Set<Class_NodeElement>()
      const children: Class_NodeElement[] = []
      container.dimensions_as_parent
        .filter(d => d.container_mode)
        .forEach(dim => {
          dim.children.forEach(child => {
            const c = child as Class_NodeElement
            if (seen.has(c)) return
            seen.add(c)
            if (!c.is_visible) return
            if (echangeTag && c.hasGivenTag(echangeTag)) return
            children.push(c)
          })
        })
      return children
    }

    // --- Phase A : bottom-up sizing of nested containers ---
    //
    // Sets shape_min_height / shape_min_width of every container parent to
    // the envelope size its (recursively-sized) children would produce,
    // WITHOUT writing any position. Positions are decided in phase B and C.
    //
    // Recursion walks post-order: we need each child's final height before
    // we can sum them into the enclosing container's envelope. For a leaf
    // child, getShapeHeightToUse() already returns its intrinsic height.
    const sized = new Set<Class_NodeElement>()
    const sizeContainerRecursive = (container: Class_NodeElement) => {
      if (sized.has(container)) return
      sized.add(container)
      const children = sortByV(collectContainerChildren(container))
      if (children.length === 0) return
      // Recurse first: each container-parent child must have its own
      // envelope size computed before we read its height.
      children.forEach(c => {
        if (isContainerParent(c)) sizeContainerRecursive(c)
      })
      // Sum children heights + écarts (constant lu en direct) + top/bottom margins.
      const stack_h = Geometry.totalContainerStackHeight(children, gap_mode, const_gap)
      const envelope_h = stack_h + container.shape_margin_top + container.shape_margin_bottom
      // Width: max of child widths + left/right margins. Container children
      // are supposed to be aligned on the container's x axis in the current
      // layout, so max(child.width) is a safe upper bound.
      const max_child_w = children.reduce(
        (m, c) => Math.max(m, c.getShapeWidthToUse()), 0
      )
      const envelope_w = max_child_w + container.shape_margin_left + container.shape_margin_right
      container.shape_min_height = envelope_h
      container.shape_min_width = envelope_w
    }

    // --- Phase B : top-level column stacking ---
    //
    // Collect every visible, non-exchange, non-container-child node. Group
    // by position_u. For each column, sort by position_v (anchor = current
    // y of the lowest-V node) and stack via stackNodesVertically. Top-level
    // containers participate as normal nodes in this pass — their height
    // is accurate after phase A.
    const top_level_nodes = this.drawingArea.sankey.visible_nodes_list.filter(isTopLevel)
    // Run phase A on every top-level container before we rely on their
    // getShapeHeightToUse() in phase B.
    top_level_nodes
      .filter(isContainerParent)
      .forEach(c => sizeContainerRecursive(c))

    // #1231 — Mode « écart » : le NŒUD DU HAUT de chaque colonne suit EXACTEMENT le mode
    // pourcentage (même centre = médiane_globale + (centre_ref − médiane) × f), puis le
    // reste de la colonne s'empile dessous avec des écarts CONSTANTS. Conséquence voulue :
    // les nœuds du haut (et les colonnes à 1 nœud) sont placés à l'identique du mode %.
    // Réutilise le cadre du mode proportionnel ; capture paresseuse si absente.
    if (!this.np.proportional.hasReferenceFrame) {
      this.np.proportional.captureProportionalReference()
    }
    const median = this.np.proportional.medianY
    const factor = this.np.proportional.proportionalFactor(this.np.proportional.proportionalEligibleNodes())

    const columns = new Map<number, Class_NodeElement[]>()
    top_level_nodes.forEach(n => {
      if (scope.type === 'column' && n.position_u !== scope.u) return
      const col = columns.get(n.position_u) ?? []
      col.push(n)
      columns.set(n.position_u, col)
    })
    columns.forEach((column) => {
      if (column.length === 0) return
      const sorted = sortByV(column)
      const top = sorted[0]
      const top_ref = top._prop_center_ref
      let anchor_y: number
      if (median !== undefined && top_ref !== undefined) {
        // Centre du nœud du haut = sa position en mode % ; l'ancre (bord haut) en découle.
        const top_center = median + (top_ref - median) * factor
        anchor_y = top_center - top.getShapeHeightToUse() / 2
      } else {
        anchor_y = top.position_y // fallback : pas de référence (relative/échange/tied)
      }
      Geometry.stackNodesVertically(sorted, anchor_y)
    })

    // --- Phase C : top-down positioning of container descendants ---
    //
    // Containers that participated in phase B may now have a different y
    // than they had going in. Their children need to be re-stacked at the
    // new (container.y + margin_top) anchor. Recursive: if a child is
    // itself a container, we descend into it after positioning it.
    const positioned = new Set<Class_NodeElement>()
    const positionContainerChildrenRecursive = (container: Class_NodeElement) => {
      if (positioned.has(container)) return
      positioned.add(container)
      const children = sortByV(collectContainerChildren(container))
      if (children.length === 0) return
      const anchor_y = container.position_y + container.shape_margin_top
      Geometry.stackContainerChildren(children, anchor_y, gap_mode, const_gap)
      children.forEach(c => {
        if (isContainerParent(c)) positionContainerChildrenRecursive(c)
      })
    }
    // When the scope is 'column', only descend into top-level containers
    // that live in the target column; the others retain their current
    // (already-valid) descendant layout.
    top_level_nodes
      .filter(isContainerParent)
      .filter(c => scope.type !== 'column' || c.position_u === scope.u)
      .forEach(c => positionContainerChildrenRecursive(c))
  }

  /**
   * Ré-empile les enfants de chaque cadre englobant (`container_mode`) sur la position et la
   * hauteur COURANTES du cadre — pendant de la Phase C de `recomputeParametricLayout`, mais pour
   * les modes de positionnement NON-parametric (absolu, proportionnel, échelle adaptée).
   *
   * Pourquoi : dans ces modes, le placement global (`anchorAbsoluteNodesByCenter`,
   * `anchorProportionalNodes`…) garde le CENTRE de chaque enfant fixe quand sa taille change
   * (changement de datatag/vue/échelle). Des enfants empilés jointivement (écart constant) finissent
   * donc par se chevaucher ou se disperser dès que leur valeur change.
   *
   * Empilement À PLAT des FEUILLES : on collecte les feuilles réelles (pas les sous-cadres) dans
   * l'ordre hiérarchique et on les espace UNIFORMÉMENT — écart identique quel que soit le niveau
   * d'imbrication. Empiler récursivement les sous-cadres ajouterait leurs marges (`shape_margin_top`
   * /`_bottom`) entre deux groupes → l'écart casserait au 2ᵉ niveau. Chaque sous-cadre est ensuite
   * réancré (`reanchorTiedFrame`) pour envelopper ses feuilles ; sa taille suit via `_envelopeSize()`.
   * Le cadre de premier niveau garde sa position (il sert d'ancre).
   *
   * L'écart est résolu par `containerChildGap` : en mode 'constant' il est lu EN DIRECT sur
   * `disaggregation_gap_value` (éditer la valeur ré-englobe au prochain dessin, sans être figé dans
   * les feuilles) ; sinon = `shape_position_dy` persisté. En mode 'keep' rien n'est ré-empilé.
   *
   * À appeler en FIN de placement (après le mode global + `anchorParametricNodesToAbsolute`), pour
   * écraser le re-centrage individuel des feuilles. Nœuds « échange » et enfants invisibles exclus.
   */
  public restackContainerChildren() {
    const mode = this.drawingArea.effective_gap_mode
    // 'keep' = les enfants conservent leur position_y manuelle → aucun ré-empilement.
    if (mode === 'keep') return
    const const_gap = this.drawingArea.disaggregation_gap_value
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']

    const isContainerParent = (n: Class_NodeElement): boolean =>
      n.dimensions_as_parent.some(d => d.container_mode)

    const sortByV = (nodes: Class_NodeElement[]): Class_NodeElement[] =>
      [...nodes].sort((a, b) =>
        a.position_v !== b.position_v ? a.position_v - b.position_v : a.position_y - b.position_y)

    // Enfants directs VISIBLES d'un cadre (dédupliqués sur les dims container_mode).
    const directChildren = (container: Class_NodeElement): Class_NodeElement[] => {
      const seen = new Set<Class_NodeElement>()
      const children: Class_NodeElement[] = []
      container.dimensions_as_parent
        .filter(d => d.container_mode)
        .forEach(dim => {
          dim.children.forEach(child => {
            const c = child as Class_NodeElement
            if (seen.has(c)) return
            seen.add(c)
            if (!c.is_visible) return
            if (echangeTag && c.hasGivenTag(echangeTag)) return
            children.push(c)
          })
        })
      return children
    }

    // Feuilles visibles d'un cadre, dans l'ordre hiérarchique (DFS + tri par v) : on descend dans
    // les sous-cadres et on ne renvoie QUE les vraies feuilles (pas les cadres eux-mêmes).
    const leavesInOrder = (container: Class_NodeElement): Class_NodeElement[] => {
      const out: Class_NodeElement[] = []
      sortByV(directChildren(container)).forEach(c => {
        if (isContainerParent(c)) out.push(...leavesInOrder(c))
        else out.push(c)
      })
      return out
    }

    // Réancre les sous-cadres imbriqués (bottom-up) sur l'enveloppe de leurs feuilles.
    const reanchorSubFrames = (container: Class_NodeElement) => {
      directChildren(container).forEach(c => {
        if (isContainerParent(c)) { reanchorSubFrames(c); c.reanchorTiedFrame() }
      })
    }

    this.drawingArea.sankey.visible_nodes_list
      .filter(isContainerParent)
      .filter(n => !n.dimensions_as_child.some(d => d.container_mode))
      .forEach(container => {
        const leaves = leavesInOrder(container)
        if (leaves.length === 0) return
        // Empilement uniforme des feuilles depuis le haut du cadre de premier niveau.
        let cursor = container.position_y + container.shape_margin_top
        leaves.forEach((leaf, i) => {
          if (i > 0) cursor += Geometry.containerChildGap(leaf, mode, const_gap)
          leaf.position_y = cursor
          leaf.applyPosition()
          cursor += leaf.getShapeHeightToUse()
        })
        // Le centre stocké de chaque feuille devient sa position empilée : sinon le prochain
        // anchorByCenterIfResized (mode absolu) tenterait de restaurer un centre périmé.
        leaves.forEach(l => l.captureCenterFromCorner())
        // Les sous-cadres enveloppent leurs feuilles ; le cadre de premier niveau reste ancré.
        reanchorSubFrames(container)
      })
  }

  /**
   * Back-calcule `shape_position_dy` de chaque nœud visible depuis sa `position_y`
   * absolue. Pour chaque colonne (groupée par `position_u`), les nœuds sont triés par
   * y et le dy de chacun est déduit du gap avec le nœud précédent. Utilisé à la bascule
   * absolu→paramétrique et en fin de drag pour que le déplacement vertical d'un nœud
   * persiste (sinon `applyPosition` rappelle le nœud à sa position dérivée du dy).
   * Retourne le nombre de chevauchements clampés (raw_dy < 0 → dy = 0).
   */
  public backCalculateShapePositionDyFromY(): number {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const visible_relevant = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag)
    )
    const columns: { [u: number]: Class_NodeElement[] } = {}
    visible_relevant.forEach(n => {
      if (!(n.position_u in columns)) columns[n.position_u] = []
      columns[n.position_u].push(n)
    })
    let overlap_count = 0
    Object.values(columns).forEach(column => {
      column.sort((a, b) => a.position_y - b.position_y)
      for (let i = 1; i < column.length; i++) {
        const prev = column[i - 1]
        const curr = column[i]
        const raw_dy = curr.position_y - (prev.position_y + prev.getShapeHeightToUse())
        if (raw_dy < 0) overlap_count++
        curr.shape_position_dy = Math.max(0, raw_dy)
      }
    })
    return overlap_count
  }

  /**
   * Déduit `position_u` depuis `position_x` pour les nœuds visibles non
   * verrouillés. À appeler explicitement aux endroits où une position absolue
   * vient d'être modifiée (drop de ghost link, fin de drag, contraction). Ce
   * calcul **ne fait plus partie** de `computeParametrization` pour éviter le
   * couplage bidirectionnel u ↔ x qui faisait dériver les colonnes à chaque
   * recalcul (notamment quand l'envelope d'un container modifie x).
   *
   * **Clustering plutôt que rounding indépendant (PR 3 step 5)** : l'ancienne
   * implémentation faisait `u = Math.round(x / dx)` sur chaque nœud
   * indépendamment. Deux nœuds visuellement alignés (à 1-2 px près) tombaient
   * parfois de part et d'autre de la frontière de rounding (ex. x=1898.88 →
   * u=9 et x=1901.47 → u=10 avec dx=200, frontière à 1900), ce qui les
   * affectait à des colonnes différentes sans intention utilisateur.
   *
   * La nouvelle implémentation regroupe d'abord les nœuds en **clusters**
   * (tri par x croissant, puis fusion glissante : un nœud rejoint le cluster
   * courant si son x est à moins de `tolerance` du max-x du cluster), puis
   * calcule un `u` commun par cluster. Conséquences :
   *
   * - Deux nœuds quasi alignés tombent dans le même cluster → même `u`,
   *   toujours, peu importe où ils sont par rapport aux frontières de
   *   rounding.
   * - Un cluster contenant un nœud `u`-verrouillé hérite du `u` du verrou
   *   (le verrou définit la colonne d'autorité).
   * - Un cluster sans verrou calcule son `u` depuis le x moyen du cluster,
   *   ce qui reste proche de l'ancien comportement pour les colonnes
   *   bien-formées.
   *
   * `tolerance` est fixée à 5 % de `dx` (plafonnée à 10 px min), valeur bien
   * au-dessus du bruit pixel et très en dessous d'une demi-colonne.
   */
  public inferPositionUFromX() {
    const dx = this.drawingArea.sankey.styles_dict['default'].shape_position_dx!
    const clusters = this.clusterNodesByAxis('x')

    // For each cluster, decide the u once, then apply to every non-locked
    // member. A cluster containing a u-locked node inherits its u; otherwise
    // we compute u from the cluster's mean x.
    for (const cluster of clusters) {
      const locked = cluster.find(n => n.shape_position_u_locked === true)
      let cluster_u: number
      if (locked) {
        cluster_u = locked.position_u
      } else {
        const mean_x = cluster.reduce((sum, n) => sum + n.position_x, 0) / cluster.length
        cluster_u = Math.round(mean_x / dx)
      }
      cluster.forEach(n => {
        if (n.shape_position_u_locked !== true) n.position_u = cluster_u
      })
    }
  }

  /**
   * Nœuds éligibles à une colonne : visibles et non taggés « échange » (ces derniers sont
   * placés par arrangeTrade et n'appartiennent à aucune colonne). Les nœuds `u`-verrouillés
   * restent dans leur cluster — ils en ancrent la valeur.
   */
  private nodesEligibleForColumns(): Class_NodeElement[] {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    return this.drawingArea.sankey.visible_nodes_list.filter(n => {
      if (!n.is_visible) return false
      if (echangeTag && n.hasGivenTag(echangeTag)) return false
      return true
    })
  }

  /**
   * Regroupe les nœuds en bandes d'après leur position sur `axis`, par fusion glissante : on trie
   * sur l'axe puis on ouvre un nouveau cluster dès que l'écart au max du cluster courant dépasse
   * la tolérance. C'est le max — et non la valeur de tête — qui est la bonne référence : une
   * chaîne de nœuds distants deux à deux de moins que la tolérance forme une seule bande, même si
   * les extrêmes en sont plus éloignés.
   *
   * Clusters retournés dans l'ordre croissant. `axis = 'x'` donne les COLONNES (diagramme
   * horizontal), `axis = 'y'` les RANGÉES (diagramme vertical) ; la tolérance suit l'écart de
   * référence du même axe (`shape_position_dx` / `dy` du style par défaut).
   */
  private clusterNodesByAxis(axis: 'x' | 'y'): Class_NodeElement[][] {
    const default_style = this.drawingArea.sankey.styles_dict['default']
    const spacing = (axis === 'x' ? default_style.shape_position_dx : default_style.shape_position_dy)!
    const tolerance = Math.max(10, spacing * 0.05)
    const coord = (n: Class_NodeElement) => axis === 'x' ? n.position_x : n.position_y

    const eligible = this.nodesEligibleForColumns()
    if (eligible.length === 0) return []

    const sorted = [...eligible].sort((a, b) => coord(a) - coord(b))
    const clusters: Class_NodeElement[][] = []
    let current: Class_NodeElement[] = []
    let current_max = -Infinity
    for (const node of sorted) {
      if (current.length === 0 || coord(node) - current_max <= tolerance) {
        current.push(node)
        if (coord(node) > current_max) current_max = coord(node)
      } else {
        clusters.push(current)
        current = [node]
        current_max = coord(node)
      }
    }
    if (current.length > 0) clusters.push(current)
    return clusters
  }

  /**
   * Colonnes ORDINALES (0, 1, 2…) déduites des `position_x` courants. Ne mute rien.
   *
   * Distinct de `inferPositionUFromX`, qui écrit `position_u` en arrondissant `x / dx` : cet
   * arrondi peut attribuer le même `u` à deux colonnes voisines ou en sauter une. Pour décider
   * si un flux « recule », seul l'ORDRE des colonnes compte, et l'ordinal est strictement
   * monotone en x.
   */
  public computeColumnsFromX(): { [node_id: string]: number } {
    const columns: { [node_id: string]: number } = {}
    this.clusterNodesByAxis('x').forEach((cluster, index) => {
      cluster.forEach(node => { columns[node.id] = index })
    })
    return columns
  }

  /**
   * Rangées ORDINALES (0, 1, 2…) déduites des `position_y` courants — pendant vertical de
   * `computeColumnsFromX`. Ne mute rien.
   *
   * Sert au statut recyclage des flux VERTICAUX (`shape_orientation === 'vv'`), pour qui
   * « reculer » veut dire remonter, pas aller vers la gauche.
   */
  public computeRowsFromY(): { [node_id: string]: number } {
    const rows: { [node_id: string]: number } = {}
    this.clusterNodesByAxis('y').forEach((cluster, index) => {
      cluster.forEach(node => { rows[node.id] = index })
    })
    return rows
  }

  /**
   * sankeyapplication#153 — Recalcul incrémental du statut recyclage après une action de
   * l'utilisateur (typiquement un déplacement de nœud). Un flux dont la cible ne se trouve plus
   * à droite de sa source passe en recyclage, et réciproquement.
   *
   * Ne déplace AUCUN nœud et ne touche ni `position_u` ni `position_v` : une mise en page
   * manuelle est préservée telle quelle. Le verrouillage tri-state de l'utilisateur prime.
   *
   * @returns pour chaque flux dont le statut a changé, sa valeur précédente (pour l'undo).
   */
  public updateRecyclingFromPositions(only_touching_nodes?: Set<string>): { [link_id: string]: boolean } {
    return this.np.cycles.markRecyclingLinks(
      this.nodesEligibleForColumns(),
      this.computeColumnsFromX(),
      only_touching_nodes,
      this.computeRowsFromY()
    )
  }

  /** Cf. NodePositioningCyclesCore.lockRecyclingStatusDivergences (passe post-chargement #153). */
  public lockRecyclingStatusDivergences(): string[] {
    return this.np.cycles.lockRecyclingStatusDivergences(
      this.nodesEligibleForColumns(),
      this.computeColumnsFromX(),
      this.computeRowsFromY()
    )
  }

  /**
  * Computes u,v for nodes in the drawing area
  * Utilise l'algorithme amélioré
  *
  * Quand `use_horizontal_index` est true, `position_u` est recalculé via l'analyse
  * topologique (detectAllCyclesAndOptimize). Sinon, `position_u` est supposé déjà
  * à jour (ne plus dériver depuis x ici — appeler `inferPositionUFromX` côté caller
  * si nécessaire).
  */
  public computeParametrization(use_horizontal_index: boolean) {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    // Locked nodes keep their existing position_u so the user can pin a node to a
    // specific column across recomputes.
    if (use_horizontal_index) {
      const result = this.np.detectAllCyclesAndOptimize(nodes_to_process)
      const horizontal_indexes_per_nodes_ids = result.horizontal_indexes

      nodes_to_process.forEach(node => {
        if (node.shape_position_u_locked === true) return
        const node_index = horizontal_indexes_per_nodes_ids[node.id]
        node.position_u = node_index + 1
      })
    }
    const first_level_tagg = this.drawingArea.sankey.level_taggs_list.filter(
      tagg => tagg.activated
    )[0]?.tags_list[0]
    //if (first_level_tagg)
    this.computeParametricV(first_level_tagg as Class_LevelTag)
    // // Sort input and output links for each node based on their connected nodes' position_v
    // this.drawingArea.sankey.nodes_list.forEach(node => {
    //   // Get current links order
    //   const current_links_order = [...node.links_order]

    //   // Sort input links based on source node position_v
    //   const sorted_input_links = node.input_links_list.sort((link1, link2) => {
    //     const source1_v = link1.source.position_v
    //     const source2_v = link2.source.position_v

    //     if (source1_v >= 0 || source2_v >= 0) {
    //       return source1_v - source2_v
    //     } else {
    //       return source2_v - source1_v
    //     }
    //   })

    //   // Sort output links based on target node position_v
    //   const sorted_output_links = node.output_links_list.sort((link1, link2) => {
    //     const target1_v = link1.target.position_v
    //     const target2_v = link2.target.position_v

    //     if (target1_v >= 0 || target2_v >= 0) {
    //       return target1_v - target2_v
    //     } else {
    //       return target2_v - target1_v
    //     }
    //   })

    //   // Create new sorted order: import links first, other links, export links last
    //   const other_links = current_links_order.filter(link =>
    //     !sorted_input_links.includes(link) && !sorted_output_links.includes(link)
    //   )

    //   // Separate import and export links from input/output links
    //   const import_links = sorted_input_links.filter(link =>
    //     echangeTag && link.source.hasGivenTag(echangeTag)
    //   )
    //   const export_links = sorted_output_links.filter(link =>
    //     echangeTag && link.target.hasGivenTag(echangeTag)
    //   )
    //   const regular_input_links = sorted_input_links.filter(link =>
    //     !echangeTag || !link.source.hasGivenTag(echangeTag)
    //   )
    //   const regular_output_links = sorted_output_links.filter(link =>
    //     !echangeTag || !link.target.hasGivenTag(echangeTag)
    //   )

    //   const new_links_order = [
    //     ...import_links,        // Import links first
    //     ...regular_input_links, // Regular input links
    //     ...other_links,         // Other links (like recycling)
    //     ...regular_output_links,// Regular output links
    //     ...export_links         // Export links last
    //   ]

    //   // Use reorganizeIOFromListIds to update the internal order
    //   const new_links_ids = new_links_order.map(link => link.id)
    //   node.reorganizeIOFromListIds(new_links_ids)
    //})
  }

  // Fonction qui calcule les colonnes
  private computeColumns(): { [_: number]: Class_NodeElement[] } {
    const columns: { [_: number]: Class_NodeElement[] } = {}
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ? this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (n.hasGivenTag(echangeTag!)) {
        return
      }
      if (!(n.position_u in columns)) {
        columns[n.position_u] = [n]
      } else {
        columns[n.position_u].push(n)
      }
    })
    return columns
  }

  // Fonction qui applique le V pour un level tag donné
  public applyVForLevelTag(columns: { [_: number]: Class_NodeElement[] }, tag: Class_LevelTag) {
    Object.values(columns).forEach(column => {
      column.sort((n1, n2) => n1.position_y - n2.position_y)
      let current_v = 0
      column.forEach(n => {
        if (n.shape_position_v_locked !== true) {
          n.position_v = -1
        }
        current_v = this.applyVDesagregate(n, current_v, tag)
      })
    })
    Object.values(columns).forEach(column => {
      column.forEach(n => this.applyVAgregate(n))
    })
  }

  // Fonction principale refactorisée
  public computeParametricV(tag: Class_LevelTag | undefined) {
    const columns = this.computeColumns()

    if (this.drawingArea.sankey.level_taggs_list.length == 0) {
      Object.values(columns).forEach(column => {
        column.sort((n1, n2) => n1.position_y - n2.position_y)
        let current_v = 0
        column.forEach(n => {
          if (n.shape_position_v_locked === true) {
            current_v++
            return
          }
          n.position_v = current_v++
        })
      })
    }

    //this.drawingArea.sankey.level_taggs_list.forEach(tagGroup => {
    this.applyVForLevelTag(columns, tag as Class_LevelTag )
    //})

    this.drawingArea.sankey.sortNodes()
  }

  // Fonction qui compute le V paramétrique pour un tag spécifique
  public computeParametricVForTagg(tag: Class_LevelTag) {
    const columns = this.computeColumns()
    this.applyVForLevelTag(columns, tag)
    this.drawingArea.sankey.sortNodes()
  }

  /**
   * Apply v aggregation for nodes
   */
  public applyVAgregate(node: Class_NodeElement) {
    // const nodeDimParent = node.nodeDimensionAsChild(tagGroup)
    // if (!nodeDimParent) {
    //   return
    // }
    node.dimensions_as_child.forEach(nodeDimParent => {
      if (nodeDimParent.parent.position_v != -1) {
        // v is computed at the first path
        return
      }
      nodeDimParent.parent.position_x = node.position_x
      nodeDimParent.parent.position_y = node.position_y
      nodeDimParent.parent.position_u = node.position_u
      nodeDimParent.parent.position_v = node.position_v
      this.applyVAgregate(nodeDimParent.parent as Class_NodeElement)
    })
  }

  /**
   * Apply v disaggregation for nodes
   */
  public applyVDesagregate(
    node: Class_NodeElement,
    current_v: number,
    tag: Class_LevelTag
  ) {
    if (node.position_v == -1) {
      // v is computed at the first path
      node.position_v = current_v
    }
    let new_current_v = current_v
    const desagregated_nodes = ([...new Set(node.dimensions_as_parent.flatMap(d => d.children))] as Class_NodeElement[]).filter(n => n.hasGivenTag(tag))
    desagregated_nodes.forEach(nn => {


      const shift_y = (desagregated_nodes.length - 1) / 2 * node.shape_position_dy

      let current_y = node.position_y - shift_y
      nn.position_v = -1
      nn.position_x = node.position_x
      nn.position_u = node.position_u
      nn.position_y = current_y
      current_y += nn.getShapeHeightToUse() + nn.shape_position_dy
      if (tag.group.tags_list[tag.group.tags_list.indexOf(tag)])
        new_current_v = this.applyVDesagregate(nn, new_current_v, tag.group.tags_list[tag.group.tags_list.indexOf(tag)] as Class_LevelTag)

    })
    return new_current_v + 1
  }

  /**
   * Reposition visible nodes so that their left/top side is close to a grid line
   */
  public _arrangeNodesToGrid() {
    const grid_size = this.drawingArea.grid_size
    this.drawingArea.sankey.visible_nodes_list.forEach(node => {
      const shift_x = node.position_x - (node.position_x % grid_size)
      const shift_y = node.position_y - (node.position_y % grid_size)
      node.setPosXY(shift_x, shift_y)
    })
    Object.values(this.drawingArea.sankey.containers_dict).forEach(container => {
      if (container.tied_to_nodes) return
      container.position_x = container.position_x - (container.position_x % grid_size)
      container.position_y = container.position_y - (container.position_y % grid_size)
      container.draw()
    })
  }
}

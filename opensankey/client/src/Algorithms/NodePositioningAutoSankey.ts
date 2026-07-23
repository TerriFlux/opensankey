// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #243 c9 — ORCHESTRATEUR de la disposition automatique (`computeAutoSankey`) et son pipeline de
// positionnement final. Extrait de NodePositioning en sous-service compose. Le cluster ne touchait
// AUCUN champ prive : il n'utilise que `drawingArea`, des methodes publiques de NodePositioning
// (parametrisation, trade, croisements) et le socle cycles/index (c8).
//
// `drawingArea` est expose en getter pour que les corps soient deplaces VERBATIM ; seuls les 8
// appels SORTANTS ont ete requalifies en `this.np.*` (resp. `this.np.cycles.*`).
//
// Mode papier (opensankey#1252) : le placement se cale sur `paperLayoutTarget()`, une page de
// REFERENCE au ratio du format, independante du contenu. En fin de course on rejoue
// `applyPaperDimensions()` : le GUIDE suit le contenu, jamais l'inverse.

import { Class_DrawingArea } from '../types/DrawingArea'
import { PAPER_DIMENSIONS_MM, PAPER_TARGET_FONT_SIZES } from '../Elements/ElementsAttributesConfig'
import { NodeLeftExtremityStyle, NodeRightExtremityStyle } from '../Elements/ElementStyle'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_Tag } from '../types/Tag'
import type { NodePositioning } from './NodePositioning'

export class NodePositioningAutoSankey {
  constructor(private readonly np: NodePositioning) { }

  /** Raccourci pour que les corps deplaces gardent `this.drawingArea` tel quel. */
  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }

  /**
   * Version améliorée de computeAutoSankey qui corrige le positionnement
   * en gardant la logique existante
   */
  public computeAutoSankey(
    launched_from_process: boolean,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor',
    sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor',
    skip_horizontal: boolean = false,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {
    this.drawingArea.bypass_redraws = true
    // Recalcul automatique : on relâche tous les cadenas d'ancres E/S posés
    // manuellement par l'utilisateur (drag de poignée / menu "Ordre des flux E/S").
    this.drawingArea.sankey.links_list.forEach(l => l.resetAnchorLocks())
    // Calculate max value of flows (inchangé)
    const unit_taggs = this.drawingArea.sankey.getTagGroupsAsList('data_taggs').filter(tagg => tagg.is_unit) as Class_DataTagGroup[]
    if (unit_taggs.length > 0) {
      const selectedTag = unit_taggs[0].tags_list.filter(tag => tag.is_selected)[0]
      unit_taggs[0].tags_list.forEach(tag => {
        unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
        tag.setSelected()
        let linksMaxValue = 0
        this.drawingArea.sankey.links_list.forEach(link => {
          const linkMaxValue = link.getMaxValue()
          linksMaxValue = Math.max(
            linksMaxValue,
            linkMaxValue ? linkMaxValue : 0
          )
        })
        linksMaxValue += 1
        if (launched_from_process) {
          tag.scale = linksMaxValue
        }
      })
      unit_taggs[0].tags_list.forEach(tag2 => tag2.setUnSelected())
      selectedTag.setSelected()
    }
    if (launched_from_process) {
      this.computeScale()
    }

    let is_zero = true
    this.drawingArea.sankey.links_list.forEach(l => is_zero = is_zero && l.is_zero)
    if (is_zero) { this.drawingArea.data_source = 'structure' }

    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    const nodes_to_process = this.drawingArea.sankey.visible_nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))

    const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
    let max_horizontal_index = 0
    let nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] } = {}

    // Snapshot des liens dont l'utilisateur a verrouillé le statut recyclage
    // AVANT recalcul. Sémantique (issue OpenSankey#711, retour Alexandre 13/05) :
    // tristate via shape_is_recycling_locked (cadenas) + shape_is_recycling :
    //   - locked + true  → forcé recyclage (le calcul auto le préserve)
    //   - locked + false → forcé non-recyclage (préservé visuellement ; limitation :
    //     pas de support DFS dédié, le cycle peut quand même être coupé ailleurs ;
    //     si le DFS choisit ce flux comme back-edge, il restera affiché droit
    //     mais l'index horizontal sera incohérent)
    //   - unlocked       → auto, l'algo décide librement
    // Le marquage lui-même relit ces sets depuis le socle (markRecyclingLinks) ; seul le mode
    // « interdit » est encore consulté ici, à l'ÉTAPE 3.
    const user_forbidden_recycling_ids = this.np.cycles.user_forbidden_recycling_link_ids

    if (skip_horizontal) {
      // Skip horizontal recalculation — use existing position_u values
      const has_valid_u = nodes_to_process.some(n => n.position_u > 0)
      if (!has_valid_u) {
        this.np.inferPositionUFromX()
        this.np.computeParametrization(false)
      }
      // Build structures from existing U (position_u is 1-based, h_index is 0-based)
      nodes_to_process.forEach(node => {
        const u = Math.max(0, node.position_u - 1)
        horizontal_indexes_per_nodes_ids[node.id] = u
        if (!nodes_per_horizontal_indexes[u]) nodes_per_horizontal_indexes[u] = []
        nodes_per_horizontal_indexes[u].push(node)
        if (u > max_horizontal_index) max_horizontal_index = u
      })
      // Mark recycling links — préserver les liens verrouillés par l'utilisateur.
      this.np.cycles.markRecyclingLinks(nodes_to_process, horizontal_indexes_per_nodes_ids)
    } else {
      // ÉTAPES 1, 2 et 2 bis : socle commun avec `position_u` (opensankey#1253).
      // Amorçage (dont les liens recyclage forcés par l'utilisateur, que le DFS considère déjà
      // coupés), propagation depuis les sources, compaction, puis colonnes verrouillées.
      const {
        recycling_links: possible_recycling_links_ids,
        horizontal_indexes
      } = this.np.cycles.computeHorizontalIndexes(nodes_to_process)
      Object.assign(horizontal_indexes_per_nodes_ids, horizontal_indexes)

      // Set des liens reconnus comme recyclage par la détection de cycles.
      // possible_recycling_links_ids contient les back-edges trouvées par DFS
      // ET les liens pré-amorcés par l'utilisateur. On utilise cette source de vérité pour
      // le marquage final, plutôt qu'une comparaison node_index >= target_index :
      // quand l'utilisateur force UN flux d'un cycle comme recyclage, le DFS
      // coupe à cet endroit et n'identifie PAS d'autres back-edges dans ce
      // cycle ; mais la comparaison d'index re-flaguait quand même les autres
      // arêtes du cycle (qui se retrouvent backward après relaxation
      // topologique des index). Le set unique garantit la sémantique
      // « candidate » : un seul flux user-forcé suffit à forcer les autres
      // du même cycle à non-recyclage.
      const auto_recycling_set = new Set(possible_recycling_links_ids)

      // ÉTAPE 3: Construction des structures de données (logique existante)
      this.drawingArea.sankey.visible_nodes_list.forEach(node => {
        const node_index = horizontal_indexes_per_nodes_ids[node.id]

        if (node_index !== undefined && node_index >= 0) {
          if (!nodes_per_horizontal_indexes[node_index]) {
            nodes_per_horizontal_indexes[node_index] = []
          }
          nodes_per_horizontal_indexes[node_index].push(this.drawingArea.sankey.nodes_dict[node.id])

          if (node_index > max_horizontal_index) {
            max_horizontal_index = node_index
          }

          // Marquer les liens de recyclage. auto_recycling_set inclut déjà
          // les liens pré-amorcés par l'utilisateur (cf. ÉTAPE 1), donc le
          // statut user-forcé est naturellement préservé. Pour les liens
          // user-interdits (locked + false), on force shape_is_recycling=false
          // même si le DFS les a identifiés comme back-edge — limitation
          // documentée plus haut.
          node.output_links_list.forEach(link => {
            const link_data = this.drawingArea.sankey.links_dict[link.id]
            if (user_forbidden_recycling_ids.has(link.id)) {
              link_data.shape_is_recycling = false
              return
            }
            link_data.shape_is_recycling = auto_recycling_set.has(link.id)
          })
        }
      })

      // ÉTAPE 3 bis: Mode 'right_extremity'
      if (sinks_mode === 'right_extremity') {
        const sink_nodes = nodes_to_process.filter(node =>
          !node.hasVisibleOutputLinks() && node.hasVisibleInputLinks())
        if (sink_nodes.length > 0) {
          sink_nodes.forEach(node => {
            const old_index = horizontal_indexes_per_nodes_ids[node.id]
            if (old_index === undefined || old_index < 0) return
            if (old_index === max_horizontal_index) return
            if (nodes_per_horizontal_indexes[old_index]) {
              const i = nodes_per_horizontal_indexes[old_index].indexOf(node)
              if (i > -1) nodes_per_horizontal_indexes[old_index].splice(i, 1)
            }
            horizontal_indexes_per_nodes_ids[node.id] = max_horizontal_index
            if (!nodes_per_horizontal_indexes[max_horizontal_index]) {
              nodes_per_horizontal_indexes[max_horizontal_index] = []
            }
            nodes_per_horizontal_indexes[max_horizontal_index].push(node)
          })
        }
      }

      // ÉTAPE 4: Repositionnement des nœuds sans entrée (sauf si mode 'left_extremity')
      if (sources_mode !== 'left_extremity') {
        this.np.cycles.repositionNodesWithoutInputs(
          nodes_per_horizontal_indexes,
          horizontal_indexes_per_nodes_ids,
          max_horizontal_index
        )
      }
    }

    nodes_per_horizontal_indexes = Object.fromEntries(
      Object.entries(nodes_per_horizontal_indexes).filter(([, value]) => value.length > 0)
    )

    // ÉTAPE 5: Calcul des positions finales (logique existante)
    this.computeFinalPositions(
      nodes_per_horizontal_indexes,
      horizontal_indexes_per_nodes_ids,
      max_horizontal_index,
      optimize_crossing,
      h_spacing,
      v_spacing,
      skip_vertical,
      apply_target_fonts
    )

    const tmp = this.drawingArea.sankey.nodes_list.filter(n =>
      !echangeTag || !n.hasGivenTag(echangeTag))
    tmp.forEach(n => this.setNodeLabelPositioning(n))

    // Mode papier : le placement est deja cale sur la page de reference (paperLayoutTarget).
    // On redessine, puis on laisse le GUIDE suivre le contenu — et non l'inverse. L'ancienne
    // passe « two-pass » relisait drawing_area.width/height comme une page fixe et etirait les
    // positions (scale_x != scale_y) pour la remplir : non idempotent, et deformant puisque ni
    // les tailles de noeuds ni les epaisseurs de flux ne suivaient (opensankey#1252).
    if (this.isPaperMode()) {
      this.drawingArea.bypass_redraws = false
      this.drawingArea.drawElements()
      // `protected` sur Class_DrawingArea : meme acces indirect que SankeyPersistence.
      this.drawingArea['applyPaperDimensions']()
      this.drawingArea['drawBackground']()
      this.drawingArea.drawGrid()
    }
  }

  /** Le mode papier n'impose une cible de placement que si un format est choisi. */
  private isPaperMode(): boolean {
    return this.drawingArea.is_paper_mode && this.drawingArea.paper_format !== 'free'
  }

  /**
   * Page de REFERENCE sur laquelle l'auto-layout repartit colonnes et lignes, en mode papier.
   *
   * Deliberement INDEPENDANTE du contenu : `drawing_area.width/height` derive desormais de la
   * bbox du diagramme (applyPaperDimensions = guide au ratio), donc s'en servir comme cible
   * ferait dependre le placement du placement precedent — relancer la disposition automatique
   * deux fois ne convergeait pas.
   *
   * Seul le RATIO du format compte, a surface A4 constante : A3/A4/A5 partagent 1:V2 et donnent
   * donc le meme placement. Seule l'ORIENTATION le change. Les vrais millimetres restent
   * l'affaire de l'export (getPaperDimensionsMm).
   */
  private paperLayoutTarget(): {
    width: number, height: number,
    pad_left: number, pad_right: number, pad_top: number, pad_bottom: number
  } {
    const dims = this.drawingArea.getPaperDimensionsMm()
    const ratio = dims.width / dims.height
    const reference_area = Class_DrawingArea.mmToPx(PAPER_DIMENSIONS_MM.A4.width) *
      Class_DrawingArea.mmToPx(PAPER_DIMENSIONS_MM.A4.height)
    const height = Math.sqrt(reference_area / ratio)
    return {
      width: ratio * height,
      height,
      pad_left: Class_DrawingArea.mmToPx(this.drawingArea.margin_left_mm),
      pad_right: Class_DrawingArea.mmToPx(this.drawingArea.margin_right_mm),
      pad_top: Class_DrawingArea.mmToPx(this.drawingArea.margin_top_mm),
      pad_bottom: Class_DrawingArea.mmToPx(this.drawingArea.margin_bottom_mm)
    }
  }

  public computeScale() {
    let linksMaxValue = 0
    this.drawingArea.sankey.links_list.forEach(link => {
      const linkMaxValue = link.getMaxValue()
      linksMaxValue = Math.max(
        linksMaxValue,
        linkMaxValue ? linkMaxValue : 0
      )
    })
    linksMaxValue += 1

    this.drawingArea.scale = this.drawingArea.maximum_flux ?
      Math.max(this.drawingArea.maximum_flux, linksMaxValue) : linksMaxValue
  }

  /**
   * Calcul des positions finales (extrait de la logique existante)
   */
  private computeFinalPositions(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {
    // Utiliser la logique existante de positionnement vertical
    // mais avec les corrections de la méthode updateNodesPositions précédente

    const height_per_nodes_ids: { [node_id: string]: number } = {}
    const height_cumul_per_indexes: number[] = []
    const node_id_per_hxv_indexes: string[][] = []
    let max_height_cumul = 0
    let prev_col_width = 0

    // Paper mode: compute spacing from paper dimensions and apply target fonts
    const paper_mode = this.isPaperMode()
    const paper_target = paper_mode ? this.paperLayoutTarget() : undefined
    let first_col_x: number

    if (paper_target) {
      first_col_x = paper_target.pad_left

      // Apply target font sizes (optional)
      if (apply_target_fonts) {
        const fmt = this.drawingArea.paper_format as Exclude<typeof this.drawingArea.paper_format, 'free'>
        const targetFonts = PAPER_TARGET_FONT_SIZES[fmt]
        this.drawingArea.sankey.visible_nodes_list.forEach(n => {
          n.name_label_font_size = targetFonts.node_name
          n.value_label_font_size = targetFonts.node_value
        })
        this.drawingArea.sankey.links_list.forEach(l => {
          l.name_label_font_size = targetFonts.link_name
          l.value_label_font_size = targetFonts.link_value
        })
        // Don't change legend_police — the legend has its own scale transform
      }
    } else {
      // Fixed left margin so the first column always starts at the same x
      first_col_x = 200
    }

    if (paper_target) {
      // Paper mode: simple even distribution — each column gets a slot of width dx
      const available_w = paper_target.width - paper_target.pad_left - paper_target.pad_right
      const num_cols = max_horizontal_index + 1
      const new_dx = available_w / Math.max(num_cols, 1)

      for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
        if (!nodes_per_horizontal_indexes[h_index]) continue
        nodes_per_horizontal_indexes[h_index].forEach(node => {
          node.position_x = h_index * new_dx + paper_target.pad_left
          node.shape_position_dx = new_dx
        })
      }
    } else {
      for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
        if (!nodes_per_horizontal_indexes[h_index]) {
          continue
        }
        let col_max_w_col = 0
        const effective_h = h_spacing ?? nodes_per_horizontal_indexes[h_index][0]?.shape_position_dx ?? 0
        nodes_per_horizontal_indexes[h_index].forEach(node => {
          node.position_x = first_col_x + prev_col_width + effective_h * h_index
          const node_w = node.shape_min_width
          if (node_w > col_max_w_col) col_max_w_col = node_w
        })
        if (col_max_w_col > 50) prev_col_width = col_max_w_col
      }
    }

    // Calcul des hauteurs et tri vertical (logique existante)
    for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
      if (!nodes_per_horizontal_indexes[h_index]) {
        continue
      }

      let height_cumul_for_index = 0
      let max_vertical_index = 0
      const sortcoef_per_nodes_ids: { [node_id: string]: number } = {}
      const vertical_indexes_per_node_id: { [node_id: string]: number } = {}
      const nodes_ids_per_vertical_index: string[] = []
      const effective_v = v_spacing ?? nodes_per_horizontal_indexes[h_index][0]?.shape_position_dy ?? 0

      if (skip_vertical) {
        // Keep existing vertical order — sort by current position_y
        const sorted_by_y = [...nodes_per_horizontal_indexes[h_index]]
          .sort((a, b) => a.position_y - b.position_y)
        sorted_by_y.forEach((node, idx) => {
          const node_height = node.getShapeHeightToUse()
          height_per_nodes_ids[node.id] = node_height
          vertical_indexes_per_node_id[node.id] = idx
          nodes_ids_per_vertical_index.push(node.id)
          height_cumul_for_index += node_height + effective_v
        })
        max_vertical_index = sorted_by_y.length
      } else {
        nodes_per_horizontal_indexes[h_index].forEach(node => {
          const node_height = node.getShapeHeightToUse()
          const node_sortcoef = node_height * (0.8 + 0.2 / (node.output_links_list.length + node.input_links_list.length))

          height_per_nodes_ids[node.id] = node_height
          sortcoef_per_nodes_ids[node.id] = node_sortcoef
          vertical_indexes_per_node_id[node.id] = max_vertical_index
          nodes_ids_per_vertical_index.push(node.id)

          // Tri à bulles (logique existante)
          if (max_vertical_index > 0) {
            for (let v_index = max_vertical_index; v_index > 0; v_index--) {
              const prev_v_index = v_index - 1
              const prev_node_id = nodes_ids_per_vertical_index[prev_v_index]
              const prev_node_sortcoef = sortcoef_per_nodes_ids[prev_node_id]

              if (prev_node_sortcoef < node_sortcoef) {
                vertical_indexes_per_node_id[node.id] = prev_v_index
                nodes_ids_per_vertical_index[prev_v_index] = node.id
                vertical_indexes_per_node_id[prev_node_id] = v_index
                nodes_ids_per_vertical_index[v_index] = prev_node_id
              } else {
                break
              }
            }
          }
          max_vertical_index += 1
          height_cumul_for_index += node_height + effective_v
        })
      }

      // Réordonnancement selon les verrous V (shape_position_v_locked).
      // Les nœuds verrouillés sont placés dans l'ordre croissant de leur position_v
      // (utilisée comme cible d'index 1-based, clampée aux bornes). En cas de collision
      // de cible, on préserve l'ordre relatif des nœuds verrouillés. Les nœuds libres
      // remplissent les créneaux restants dans leur ordre issu du tri par sortcoef.
      const col_nodes = nodes_per_horizontal_indexes[h_index]
      const locked_nodes = col_nodes
        .filter(n => n.shape_position_v_locked === true)
        .slice()
        .sort((a, b) => a.position_v - b.position_v)
      if (locked_nodes.length > 0 && nodes_ids_per_vertical_index.length > 1) {
        const N = nodes_ids_per_vertical_index.length
        const locked_set = new Set(locked_nodes.map(n => n.id))
        const unlocked_in_order = nodes_ids_per_vertical_index.filter(id => !locked_set.has(id))
        const final_arr: (string | null)[] = new Array(N).fill(null)
        let last_assigned = -1
        locked_nodes.forEach(n => {
          const target = Math.max(0, Math.min(N - 1, Math.round(n.position_v) - 1))
          let slot = Math.max(target, last_assigned + 1)
          while (slot < N && final_arr[slot] !== null) slot += 1
          if (slot >= N) {
            // Pas de place à droite → recule vers la gauche pour garder le nœud dans la colonne
            slot = N - 1
            while (slot >= 0 && final_arr[slot] !== null) slot -= 1
          }
          if (slot >= 0 && slot < N) {
            final_arr[slot] = n.id
            last_assigned = slot
          }
        })
        let u_i = 0
        for (let i = 0; i < N; i++) {
          if (final_arr[i] === null) {
            final_arr[i] = unlocked_in_order[u_i++] ?? null
          }
        }
        for (let i = 0; i < N; i++) {
          const id = final_arr[i]
          if (id !== null) {
            nodes_ids_per_vertical_index[i] = id
            vertical_indexes_per_node_id[id] = i
          }
        }
      }

      //height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined
    // Positionnement final avec la logique corrigée
    this.updateNodesPositionsY(
      node_id_per_hxv_indexes,
      height_per_nodes_ids,
      height_cumul_per_indexes,
      max_height_cumul,
      max_horizontal_index,
      echangeTag,
      h_spacing,
      v_spacing
    )
    this.np.optimizeCrossingsPositioning(optimize_crossing, h_spacing, v_spacing)
  }

  /**
   * Adjust positioning for nodes that have no input links
   * @private
   */
  private adjustNodesWithoutInputs(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number
  ) {
    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!nodes_per_horizontal_indexes[horizontal_index]) {
        continue
      }

      const to_splice: Class_NodeElement[] = []
      nodes_per_horizontal_indexes[horizontal_index].forEach(node => {
        if (!node.hasInputLinks()) {
          let min_next_horizontal_index = max_horizontal_index + 1
          node.output_links_list.forEach((link) => {
            if (this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].source.id].is_visible &&
              this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id].is_visible
            ) {
              const target_node = this.drawingArea.sankey.nodes_dict[this.drawingArea.sankey.links_dict[link.id].target.id]
              if (target_node === undefined) {
                return
              }
              if (horizontal_indexes_per_nodes_ids[target_node.id] < horizontal_indexes_per_nodes_ids[node.id]) {
                return
              }
              if (horizontal_indexes_per_nodes_ids[target_node.id] < min_next_horizontal_index) {
                min_next_horizontal_index = horizontal_indexes_per_nodes_ids[target_node.id]
              }
            }
          })

          if (horizontal_indexes_per_nodes_ids[node.id] < min_next_horizontal_index - 1) {
            to_splice.push(node as Class_NodeElement)
            horizontal_indexes_per_nodes_ids[node.id] = min_next_horizontal_index - 1
            if (!nodes_per_horizontal_indexes[min_next_horizontal_index - 1]) {
              nodes_per_horizontal_indexes[min_next_horizontal_index - 1] = []
            }
            nodes_per_horizontal_indexes[min_next_horizontal_index - 1].push(node)
          }
        }
      })

      to_splice.forEach(node =>
        nodes_per_horizontal_indexes[horizontal_index].splice(
          nodes_per_horizontal_indexes[horizontal_index].indexOf(node), 1
        )
      )

      // Compacter les indices pour qu'ils commencent à 0
      this.compactHorizontalIndexes(nodes_per_horizontal_indexes, horizontal_indexes_per_nodes_ids, max_horizontal_index)
    }
  }

  /**
   * Compact horizontal indexes to start from 0 and remove gaps
   * @private
   */
  private compactHorizontalIndexes(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number
  ) {
    // Trouver le premier index non vide
    let first_non_empty_index = -1
    for (let i = 0; i <= max_horizontal_index; i++) {
      if (nodes_per_horizontal_indexes[i] && nodes_per_horizontal_indexes[i].length > 0) {
        first_non_empty_index = i
        break
      }
    }

    // Si le premier index non vide n'est pas 0, décaler tout
    if (first_non_empty_index > 0) {
      const offset = first_non_empty_index

      // Créer un nouveau mapping temporaire
      const new_nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] } = {}

      // Décaler les indices dans nodes_per_horizontal_indexes
      for (let i = first_non_empty_index; i <= max_horizontal_index; i++) {
        if (nodes_per_horizontal_indexes[i] && nodes_per_horizontal_indexes[i].length > 0) {
          new_nodes_per_horizontal_indexes[i - offset] = nodes_per_horizontal_indexes[i]
          delete nodes_per_horizontal_indexes[i]
        }
      }

      // Copier les nouveaux indices
      Object.assign(nodes_per_horizontal_indexes, new_nodes_per_horizontal_indexes)

      // Mettre à jour horizontal_indexes_per_nodes_ids
      Object.keys(horizontal_indexes_per_nodes_ids).forEach(node_id => {
        horizontal_indexes_per_nodes_ids[node_id] -= offset
      })
    }
  }

  /**
   * Position nodes based on computed horizontal indexes
   * @private
   */
  private positionNodesFromIndexes(
    nodes_per_horizontal_indexes: { [index: number]: Class_NodeElement[] },
    horizontal_indexes_per_nodes_ids: { [node_id: string]: number },
    max_horizontal_index: number,
    launched_from_process: boolean,
    echangeTag?: Class_Tag
  ) {

    // Loop on all index "columns"
    const height_cumul_per_indexes: number[] = []
    const height_per_nodes_ids: { [node_id: string]: number } = {}
    const node_id_per_hxv_indexes: string[][] = []
    let max_height_cumul = 0

    // Calculate heights and margins for each column
    for (let h_index = 0; h_index <= max_horizontal_index; h_index++) {
      if (!nodes_per_horizontal_indexes[h_index]) {
        continue
      }

      let height_cumul_for_index = 0
      let max_vertical_index = 0
      const sortcoef_per_nodes_ids: { [node_id: string]: number } = {}
      const vertical_indexes_per_node_id: { [node_id: string]: number } = {}
      const nodes_ids_per_vertical_index: string[] = []

      // Process each node in the column
      nodes_per_horizontal_indexes[h_index].forEach(node => {
        const node_height = node.getShapeHeightToUse()
        const node_sortcoef = node_height * (0.8 + 0.2 / (node.output_links_list.length + node.input_links_list.length))

        // Vertically sort nodes according to their height
        height_per_nodes_ids[node.id] = node_height
        sortcoef_per_nodes_ids[node.id] = node_sortcoef
        vertical_indexes_per_node_id[node.id] = max_vertical_index
        nodes_ids_per_vertical_index.push(node.id)

        if (max_vertical_index > 0) {
          // Bubble sort algorithm
          for (let v_index = max_vertical_index; v_index > 0; v_index--) {
            const prev_v_index = v_index - 1
            const prev_node_id = nodes_ids_per_vertical_index[prev_v_index]
            const prev_node_sortcoef = sortcoef_per_nodes_ids[prev_node_id]

            if (prev_node_sortcoef < node_sortcoef) {
              // Update referencing for bubble node
              vertical_indexes_per_node_id[node.id] = prev_v_index
              nodes_ids_per_vertical_index[prev_v_index] = node.id
              // Update referencing for prev node
              vertical_indexes_per_node_id[prev_node_id] = v_index
              nodes_ids_per_vertical_index[v_index] = prev_node_id
            }
            else {
              break
            }
          }
        }
        max_vertical_index += 1

        // Compute cumulative height for given index
        height_cumul_for_index += node_height

        // Compute margins for label display
        this.computeMargins(node, h_index, max_horizontal_index, node.shape_position_dx, node.shape_position_dx)

        // Set label positioning if launched from process
        if (launched_from_process) {
          this.setNodeLabelPositioning(node)
        }
      })

      // Get horizontal index that needs the most vertical space
      height_cumul_for_index += (nodes_per_horizontal_indexes[h_index].length - 1) * this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
      if (height_cumul_for_index > max_height_cumul) {
        max_height_cumul = height_cumul_for_index
      }
      height_cumul_per_indexes.push(height_cumul_for_index)
      node_id_per_hxv_indexes.push(nodes_ids_per_vertical_index)
    }

    max_horizontal_index = (node_id_per_hxv_indexes.length - 1)

    // Update horizontal and vertical position of nodes
    this.updateNodesPositionsY(
      node_id_per_hxv_indexes,
      height_per_nodes_ids,
      height_cumul_per_indexes,
      max_height_cumul,
      max_horizontal_index,
      echangeTag
    )
  }

  /**
   * Compute margins for node labels
   * @private
   */
  private computeMargins(
    node: Class_NodeElement,
    h_index: number,
    max_horizontal_index: number,
    h_left_margin: number,
    h_right_margin: number
  ) {
    // Compute left horizontal margin
    if (h_index == 0) {
      const style_node = node.getStyleWithAttr('name_label_box_width')
      const node_shape_min_width = this.drawingArea.sankey.styles_dict[style_node.id].name_label_box_width!
      const needed_margin = this.drawingArea.grid_size + node_shape_min_width
      if (needed_margin > h_left_margin) {
        h_left_margin = needed_margin
      }
    }

    // Compute right horizontal margin
    if (h_index == max_horizontal_index) {
      const style_node = node.getStyleWithAttr('name_label_box_width')
      const node_shape_min_width = this.drawingArea.sankey.styles_dict[style_node.id].name_label_box_width!
      const needed_margin = this.drawingArea.grid_size + node_shape_min_width
      if (needed_margin > h_right_margin) {
        h_right_margin = needed_margin
      }
    }
  }

  /**
   * Positionne le label des nœuds en fonction de leur connectivité, via les
   * styles d'extrémité (NodeLeftExtremityStyle / NodeRightExtremityStyle).
   * Les nœuds centraux et lone ne reçoivent aucun style ni mutation d'attribut.
   * Si l'utilisateur a déjà personnalisé name_label_horiz / name_label_vert
   * localement, le style n'est pas (ré)appliqué pour préserver l'override.
   * @private
   */
  private setNodeLabelPositioning(node: Class_NodeElement) {
    const styles_dict = this.drawingArea.sankey.styles_dict
    const left_style = styles_dict[NodeLeftExtremityStyle]
    const right_style = styles_dict[NodeRightExtremityStyle]

    const is_source = node.hasOutputLinks() && !node.hasInputLinks()
    const is_sink = node.hasInputLinks() && !node.hasOutputLinks()

    const target_style = is_source ? left_style : (is_sink ? right_style : undefined)
    const other_style = is_source ? right_style : (is_sink ? left_style : undefined)

    // Nœuds centraux ou lone : retirer les styles d'extrémité éventuellement
    // présents, sans toucher aux attributs.
    if (!target_style) {
      if (left_style && node.hasStyle(left_style.id)) node.removeStyleById(left_style.id)
      if (right_style && node.hasStyle(right_style.id)) node.removeStyleById(right_style.id)
      return
    }

    // Nettoyer le style d'extrémité opposé s'il était appliqué.
    if (other_style && node.hasStyle(other_style.id)) {
      node.removeStyleById(other_style.id)
    }

    // Préserver tout override local user sur name_label_horiz/vert.
    if (node.isAttributeOverloaded('name_label_horiz') || node.isAttributeOverloaded('name_label_vert')) {
      return
    }

    if (!node.hasStyle(target_style.id)) {
      node.addStyle(target_style)
    }
  }

  /**
   * Version simplifiée de updateNodesPositions sans la logique de croisements
   */
  private updateNodesPositionsY(
    node_id_per_hxv_indexes: string[][],
    height_per_nodes_ids: { [node_id: string]: number },
    height_cumul_per_indexes: number[],
    max_height_cumul: number,
    max_horizontal_index: number,
    echangeTag?: Class_Tag,
    h_spacing?: number,
    v_spacing?: number
  ) {
    if (node_id_per_hxv_indexes.length === 0) {
      return
    }
    const v_margin = v_spacing ?? this.drawingArea.sankey.styles_dict['default'].shape_position_dy!

    const horizontal_spacing = h_spacing ?? this.drawingArea.sankey.nodes_dict[node_id_per_hxv_indexes[0][0]].shape_position_dx

    // Paper mode: compute per-column v_spacing to fit within paper height
    const paper_mode = this.isPaperMode()
    let paper_pad_top = 0
    let paper_available_h = 0
    if (paper_mode) {
      const paper_target = this.paperLayoutTarget()
      paper_pad_top = paper_target.pad_top
      paper_available_h = paper_target.height - paper_target.pad_top - paper_target.pad_bottom
    }

    // Paper mode: precompute spacing to fill available height
    let paper_v_margin_computed = false
    let paper_effective_v = 0
    let tallest_total = 0

    for (let horizontal_index = 0; horizontal_index <= max_horizontal_index; horizontal_index++) {
      if (!node_id_per_hxv_indexes[horizontal_index]) {
        continue
      }

      let upper_node_height_and_margin: number
      let effective_v_margin: number

      if (paper_mode) {
        // Paper mode: compute spacing so the tallest column fills the available height.
        // Shorter columns are centered relative to the tallest.
        const col_node_ids = node_id_per_hxv_indexes[horizontal_index]
        const col_pure_height = col_node_ids.reduce((sum, nid) => sum + height_per_nodes_ids[nid], 0)

        // For the tallest column, compute the spacing that fills paper_available_h
        // We need max_pure_height (without spacing) to compute the right spacing
        // max_height_cumul includes old spacing, so recompute from pure heights
        if (horizontal_index === 0 || !paper_v_margin_computed) {
          // Compute pure heights for all columns to find the tallest
          let tallest_pure = 0
          let tallest_count = 0
          for (let ci = 0; ci <= max_horizontal_index; ci++) {
            if (!node_id_per_hxv_indexes[ci]) continue
            const pure = node_id_per_hxv_indexes[ci].reduce((s, nid) => s + height_per_nodes_ids[nid], 0)
            const cnt = node_id_per_hxv_indexes[ci].length
            const total = pure + v_margin * (cnt - 1)
            if (total > tallest_total) {
              tallest_total = total
              tallest_pure = pure
              tallest_count = cnt
            }
          }
          // Spacing so tallest column fills available height
          if (tallest_count > 1) {
            paper_effective_v = Math.max(5, (paper_available_h - tallest_pure) / (tallest_count - 1))
          } else {
            paper_effective_v = 0
          }
          // Recompute tallest_total with paper spacing
          tallest_total = tallest_pure + paper_effective_v * (tallest_count - 1)
          paper_v_margin_computed = true
        }

        effective_v_margin = paper_effective_v
        // Center this column relative to the tallest
        const col_total_with_spacing = col_pure_height + paper_effective_v * (col_node_ids.length - 1)
        const center_offset = Math.max(0, (tallest_total - col_total_with_spacing) / 2)
        upper_node_height_and_margin = paper_pad_top + center_offset
      } else {
        // Free mode: center columns vertically
        const v_margin_for_index = v_margin + (max_height_cumul - height_cumul_per_indexes[horizontal_index]) / 2
        upper_node_height_and_margin = Math.max(0, v_margin_for_index)
        effective_v_margin = v_margin
      }

      node_id_per_hxv_indexes[horizontal_index].forEach((node_id, idx) => {
        this.drawingArea.sankey.nodes_dict[node_id].position_y = upper_node_height_and_margin

        // Logique d'alignement pour les liens spéciaux (ajustement local au nœud,
        // pas reporté sur la colonne suivante)
        const import_link = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
          echangeTag && l.source.hasGivenTag(echangeTag)
        )

        if (import_link.length > 0) {
          this.drawingArea.sankey.nodes_dict[node_id].position_y -= import_link[0].thickness
        } else {
          // is_visible_ignoring_zero (et pas is_visible) : un flux à valeur nulle (souvent
          // fraîchement créé) doit quand même aligner verticalement son nœud cible sur sa
          // source, sinon le nœud reste à son Y par défaut (cf. fix horizontal analogue).
          const non_recycling_input_links = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
            l.is_visible_ignoring_zero && !l.shape_is_recycling && !(echangeTag && l.source.hasGivenTag(echangeTag))
          )

          if (non_recycling_input_links.length > 0) {
            const recycling_links = this.drawingArea.sankey.nodes_dict[node_id].input_links_list.filter(l =>
              l.is_visible_ignoring_zero && l.shape_is_recycling
            )

            if (recycling_links.length > 0) {
              this.drawingArea.sankey.nodes_dict[node_id].position_y += recycling_links[0].thickness
            } else if (non_recycling_input_links.filter(l =>
              l.source.output_links_list.filter(ol => ol.is_visible_ignoring_zero).length == 1
            ).length == 1 && idx == 0) {
              // Alignement des centres : si le premier nœud de la colonne a une
              // unique source 1-vers-1, on l'aligne verticalement avec cette source.
              const source_node = non_recycling_input_links[0].source
              const current_node = this.drawingArea.sankey.nodes_dict[node_id]
              const source_center_y = source_node.position_y + source_node.getShapeHeightToUse() / 2
              const current_node_half_height = current_node.getShapeHeightToUse() / 2
              const aligned_position_y = source_center_y - current_node_half_height

              this.drawingArea.sankey.nodes_dict[node_id].position_y = aligned_position_y
            }
          }
        }

        const node_height = height_per_nodes_ids[node_id]
        upper_node_height_and_margin += node_height + effective_v_margin
      })

    }

    // Calcul des dimensions finales
    const possible_width = (horizontal_spacing + max_horizontal_index * horizontal_spacing + horizontal_spacing)
    const possible_height = (v_margin * 2 + max_height_cumul)

    this.drawingArea.width = (this.drawingArea.window_fitting_width < possible_width) ? possible_width : this.drawingArea.window_fitting_width
    this.drawingArea.height = (this.drawingArea.window_fitting_height < possible_height) ? possible_height : this.drawingArea.window_fitting_height
  }

  /**
   * Auto-compute sankey with waiting toast
   */
  public computeAutoSankeyWithToast(
    launched_from_process: boolean,
    optimize_crossing: boolean,
    h_spacing?: number,
    v_spacing?: number,
    sources_mode: 'before_neighbor' | 'left_extremity' = 'before_neighbor',
    sinks_mode: 'after_neighbor' | 'right_extremity' = 'after_neighbor',
    skip_horizontal: boolean = false,
    skip_vertical: boolean = false,
    apply_target_fonts: boolean = true
  ) {

    // If it's not launched_from_process then we assume it's user input so we save it undoing
    if (!launched_from_process) {
      const node_pos = Object.fromEntries(this.drawingArea.sankey.visible_nodes_list.map(n => [n.id, { x: n.position_x, y: n.position_y, links_order: n.links_order_visible.map(l => l.id) }]))
      const link_recy = Object.fromEntries(this.drawingArea.sankey.visible_links_list.map(l => [l.id, l.shape_is_recycling]))

      const inv_computeAutoSankey = () => {
        this.drawingArea.sankey.visible_links_list.forEach(l => l.shape_is_recycling = link_recy[l.id])
        // Reposition node to old pos
        this.drawingArea.sankey.visible_nodes_list.forEach(n => {
          n.position_x = node_pos[n.id].x
          n.position_y = node_pos[n.id].y
          // Reset old node IO order
          n.reorganizeIOFromListIds(node_pos[n.id].links_order)
          n.draw()
        })
        this.drawingArea.areaAutoFit()
      }
      this.drawingArea.saveUndo(inv_computeAutoSankey)
    }

    // Compute auto pos of nodes
    this.computeAutoSankey(launched_from_process, optimize_crossing, h_spacing, v_spacing, sources_mode, sinks_mode, skip_horizontal, skip_vertical, apply_target_fonts)
    this.np.computeParametrization(true)

    if (launched_from_process) {
      // Split trade nodes
      // this.np.splitTrade()
      // Computes u v,x and initial y for trade nodes
      //this.np.arrangeTrade(true)
    }

    // Default color + auto reorg of links
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      //n.resetPositionAttribute('dy')
      n.reorganizeIOLinks()
    })

    if (launched_from_process) {
      // Update default data on recycling mode
      this.drawingArea.sankey.links_list.forEach(l => {
        if (l.shape_is_recycling) {
          l.shape_starting_tangeant = 0.01
          l.shape_ending_tangeant = 0.01
        }
      })
    }

    this.drawingArea.draw()
    this.drawingArea.recenter()
    // this.drawingArea.draw()
    // Update area
    this.drawingArea.areaAutoFit()
    this.drawingArea.draw()
    // Toggle saving indicator
    this.drawingArea.application_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)

    // If it's not launched_from_process then we assume it's user input so we save it undoing
    if (!launched_from_process) {
      const node_pos = Object.fromEntries(this.drawingArea.sankey.visible_nodes_list.map(n => [n.id, { x: n.position_x, y: n.position_y, links_order: n.links_order_visible.map(l => l.id) }]))
      const link_recy = Object.fromEntries(this.drawingArea.sankey.visible_links_list.map(l => [l.id, l.shape_is_recycling]))

      const _computeAutoSankey = () => {
        this.drawingArea.sankey.visible_links_list.forEach(l => l.shape_is_recycling = link_recy[l.id])

        // Reposition node to old pos
        this.drawingArea.sankey.visible_nodes_list.forEach(n => {
          n.position_x = node_pos[n.id].x
          n.position_y = node_pos[n.id].y
          // Reset old node IO order
          n.reorganizeIOFromListIds(node_pos[n.id].links_order)
          n.draw()
        })
        this.drawingArea.areaAutoFit()
      }
      this.drawingArea.saveRedo(_computeAutoSankey)
    }
  }

  /**
   * Calcule automatiquement la valeur de shape_middle_recycling pour que le flux
   * de recyclage passe sous les nœuds à gauche du nœud source (mais pas ceux qui
   * sont dessous et non connectés)
   */
  private computeRecyclingMiddleShape(
    recycling_links_ids: string[]
  ) {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud'] ?
      this.drawingArea.sankey.node_taggs_dict['type de noeud'].tags_dict['echange'] : undefined

    recycling_links_ids.forEach(link_id => {
      const link = this.drawingArea.sankey.links_dict[link_id]
      const source_node = link.source
      const target_node = link.target


      // 1. Identifier les nœuds à gauche du nœud source
      const nodes_to_avoid: Class_NodeElement[] = []

      // 2. Calculer la position Y minimale pour passer sous ces nœuds
      let min_y_to_avoid = source_node.position_y // Position par défaut

      this.drawingArea.sankey.visible_nodes_list.filter(n => !n.hasGivenTag(echangeTag!)).forEach(node => {
        const node_bottom = node.position_y + node.getShapeHeightToUse()
        if (node_bottom > min_y_to_avoid) {
          min_y_to_avoid = node_bottom
        }
      })

      // 3. Ajouter une marge de sécurité
      const safety_margin = this.drawingArea.sankey.styles_dict['default'].shape_position_dy!
      //min_y_to_avoid += safety_margin

      // 4. Calculer shape_middle_recycling en fonction de l'orientation du lien
      const source_x = source_node.position_x
      const source_y = source_node.position_y
      const target_x = target_node.position_x
      const target_y = target_node.position_y

      // Point de référence (centre du segment source-target)
      const ref_x = (source_x + target_x) / 2
      const ref_y = (source_y + target_y) / 2

      let calculated_middle_recycling: number

      if (link.is_horizontal) {
        // Pour un flux horizontal, shape_middle_recycling affecte Y
        calculated_middle_recycling = min_y_to_avoid - ref_y
      } else if (link.is_vertical) {
        // Pour un flux vertical, shape_middle_recycling affecte X
        // On décale vers la gauche pour éviter les nœuds
        const min_x_to_avoid = Math.min(...nodes_to_avoid.map(n => n.position_x)) - safety_margin
        calculated_middle_recycling = min_x_to_avoid - ref_x
      } else {
        // Pour un flux diagonal, calculer le décalage perpendiculaire
        const dx = target_x - source_x
        const dy = target_y - source_y
        const length = Math.sqrt(dx * dx + dy * dy)

        if (length > 0) {
          // Vecteur perpendiculaire normalisé
          // const perp_x = -dy / length
          // const perp_y = dx / length

          // Distance nécessaire pour éviter les nœuds
          const distance_to_avoid = min_y_to_avoid - ref_y
          calculated_middle_recycling = distance_to_avoid / Math.sqrt(2)
        } else {
          calculated_middle_recycling = safety_margin
        }
      }

      // 5. Appliquer la valeur calculée
      link.shape_middle_recycling = calculated_middle_recycling

    })
  }
}

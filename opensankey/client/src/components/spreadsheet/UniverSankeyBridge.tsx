// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Write-back : propage les éditions du classeur Univer vers le modèle Sankey.
// Écoute `SheetValueChanged` (couvre édition manuelle ET copier-coller / fill / clear), traite les
// LIGNES affectées par réconciliation (compare cellules <-> modèle, n'applique que les diffs),
// puis un seul redraw en fin de lot.
//
// IMPORTANT : ne JAMAIS déclencher de rebuild du workbook Univer depuis ce handler (ex.
// menu_configuration.updateComponentRelatedToLinksData() appelle ref_to_spreadsheet -> dispose/
// recreate de l'unit -> crash "univerInstanceService is null"). On met à jour le modèle + le
// diagramme uniquement.
// ==================================================================================================

import { Class_ApplicationData } from '../../types/ApplicationData'
import { defaultLinkId } from '../../Elements/Link'
import { SHEET_ID_FLUX, SHEET_ID_NOEUDS, SHEET_ID_TAGS, SHEET_ID_RATIO, SHEET_ID_RATIO_STOCK, SHEET_ID_STOCK_CHAINING, NOEUDS_COL, TAGS_COL, fluxRowLinks, noeudsRowEntries, tagsRowGroups } from './UniverSankeyData'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const attachSankeyBridge = (
  univerAPI: any,
  app_data: Class_ApplicationData,
  isSyncing: { current: boolean },
  onlyVisibleRef: { current: boolean }
): { dispose: () => void } => {
  // drawing_area/sankey EN LIVE (let, pas const) : reset()/fromJSON et le changement de vue
  // remplacent app_data.drawing_area (et sa sankey) par de NOUVELLES instances. Capturer en const
  // ferait écrire les éditions du tableur dans l'ANCIENNE instance alors que le diagramme visible
  // vient de app_data en live -> "édite la vue précédente / deux instances coexistent". Chaque
  // handler réassigne ces liaisons avant usage ; les closures des helpers voient la réassignation.
  let drawing_area = app_data.drawing_area
  let sankey = drawing_area.sankey
  const menu_configuration = app_data.menu_configuration

  // Mapping ligne -> élément : MÊME ordre/filtrage que le builder (onlyVisible + fusion siblings +
  // hiérarchie parents/enfants). rowNodes()[r-1] = le nœud de la ligne r (peut se répéter si
  // multi-parent ; renommer/supprimer agit sur le nœud sous-jacent unique).
  const rowLinks = (): any[] => fluxRowLinks(app_data, onlyVisibleRef.current)
  const rowNodes = (): any[] => noeudsRowEntries(app_data, onlyVisibleRef.current).map((e: any) => e.node)

  // Place les nœuds NOUVELLEMENT créés (ajout de flux/nœud) sans toucher aux nœuds existants.
  // Heuristique : un nœud se cale juste à DROITE de ses voisins amont (sources) ou juste à
  // GAUCHE de ses voisins aval (cibles) déjà positionnés, à leur hauteur moyenne. Plusieurs
  // passes pour résoudre les chaînes de nœuds tous neufs (A→B où A et B sont inédits).
  const placeNewNodesIncrementally = (newNodes: any[]) => {
    if (!newNodes || newNodes.length === 0) {
      return
    }
    const default_dx = sankey.styles_dict['default'].shape_position_dx ?? 0
    const default_dy = sankey.styles_dict['default'].shape_position_dy ?? 0
    const hx = app_data.layout_h_spacing ?? default_dx ?? 100
    const vy = app_data.layout_v_spacing ?? default_dy ?? 50
    const newSet = new Set(newNodes)
    // Un voisin est utilisable comme repère s'il est déjà positionné (= pas un autre nœud neuf
    // encore non placé). On le suit via un set des nœuds restant à placer.
    const pending = new Set(newNodes)
    const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

    let progressed = true
    while (pending.size > 0 && progressed) {
      progressed = false
      pending.forEach((n: any) => {
        const sources = n.input_links_list.map((l: any) => l.source).filter((s: any) => !pending.has(s))
        const targets = n.output_links_list.map((l: any) => l.target).filter((t: any) => !pending.has(t))
        let x: number | null = null
        let y: number | null = null
        if (sources.length > 0) {
          const ref = sources.reduce((a: any, b: any) => (b.position_x > a.position_x ? b : a))
          x = ref.position_x + ref.getShapeWidthToUse() + hx
          y = avg(sources.map((s: any) => s.position_y))
        } else if (targets.length > 0) {
          const ref = targets.reduce((a: any, b: any) => (b.position_x < a.position_x ? b : a))
          x = ref.position_x - n.getShapeWidthToUse() - hx
          y = avg(targets.map((t: any) => t.position_y))
        }
        if (x !== null && y !== null) {
          // Évite l'empilement exact sur un nœud déjà placé à la même colonne.
          const h = n.getShapeHeightToUse() || 1
          const collide = (yy: number) => sankey.nodes_list.some((o: any) =>
            o !== n && !newSet.has(o) && Math.abs(o.position_x - (x as number)) < 1 &&
            Math.abs(o.position_y - yy) < h)
          while (collide(y)) {
            y += h + vy
          }
          n.setPosXY(x, y)
          pending.delete(n)
          progressed = true
        }
      })
    }
    // Les nœuds isolés (aucun voisin positionné : nœud ajouté seul dans l'onglet Noeuds) gardent
    // leur position par défaut — rien à faire, ils restent où createNewNode les a posés.
  }

  // newNodes : nœuds créés par l'édition courante (mode 'increment' uniquement).
  const redraw = (newNodes: any[] = []) => {
    const mode = menu_configuration.spreadsheet_placement_mode
    // 'spreadsheet_freeze' (legacy reactgrid) force le mode 'none' s'il est actif.
    const effective = menu_configuration.spreadsheet_freeze ? 'none' : mode
    if (effective === 'auto') {
      // Reproduire EXACTEMENT l'appel du bouton « disposition auto » (MenuContextAutoLayout) :
      // mêmes espacements et modes sources/puits configurés par l'utilisateur. L'ancien appel
      // `(true, true)` figeait les défauts (before_neighbor/after_neighbor, espacements = dx/dy
      // du NŒUD au lieu du style par défaut) → disposition différente de celle obtenue via le
      // menu après rechargement (que l'utilisateur prend comme référence).
      const default_dx = sankey.styles_dict['default'].shape_position_dx ?? 0
      const default_dy = sankey.styles_dict['default'].shape_position_dy ?? 0
      drawing_area.nodePositioning.computeAutoSankeyWithToast(
        false,
        app_data.layout_optimize_crossing,
        app_data.layout_h_spacing ?? default_dx,
        app_data.layout_v_spacing ?? default_dy,
        app_data.layout_sources_mode,
        app_data.layout_sinks_mode
      )
    } else if (effective === 'increment') {
      placeNewNodesIncrementally(newNodes)
    }
    // 'none' : aucun replacement, le nouveau nœud garde sa position par défaut.

    // Intégration légère des nouveaux nœuds (modes 'none'/'increment') : en mode parametric, la
    // position Y d'un nœud est DÉRIVÉE de position_u ; un nœud fraîchement créé n'a pas de u, donc
    // recomputeParametricLayout (appelé par drawElements) lui calcule un y invalide → il ne s'affiche
    // pas (et part de 0 = rien ne se crée à l'écran). inferPositionUFromX + computeParametrization(false)
    // lui donnent ses coordonnées paramétriques à partir de son x, SANS relayout complet (pas de reset
    // d'ancres / recentrage / optimisation de croisements). C'est le chemin de la création de flux au
    // drop canvas (cf. DrawingArea.eventReleasedClick). En mode absolu, position_x/y suffisent → rien à faire.
    if (
      effective !== 'auto' && newNodes.length > 0 &&
      sankey.styles_dict['default'].shape_position_type === 'parametric'
    ) {
      drawing_area.nodePositioning.inferPositionUFromX()
      drawing_area.nodePositioning.computeParametrization(false)
    }
    app_data.draw()
  }

  const cellText = (ws: any, r: number, c: number): string => {
    const v = ws.getRange(r, c).getValue()
    return v == null ? '' : String(v).trim()
  }

  const parseNum = (s: string): number | null => {
    if (s === '') {
      return null
    }
    const n = Number(s.replace(',', '.').replace(/\s/g, ''))
    return isNaN(n) ? null : n
  }

  // Clé sur le nom TRIMMÉ : les cellules saisies sont trimmées par cellText(), mais un nom de nœud
  // existant peut porter une espace résiduelle (import Excel) ; sans trim ici, "Farine " ne serait
  // pas retrouvé sous "Farine" -> addNewNodeWithName recrée un id en collision -> nœud "Farine_0".
  const nameToNode = (): { [name: string]: any } => {
    const m: { [name: string]: any } = {}
    sankey.nodes_list.forEach((n: any) => { m[String(n.name).trim()] = n })
    return m
  }

  // Rebranche / renomme l'extrémité d'un flux selon que le nom existe ou non.
  const applyEndpoint = (link: any, field: 'source' | 'target', name: string, map: { [k: string]: any }) => {
    if (map[name]) {
      const prev = link[field]
      link[field] = map[name]
      if (prev !== map[name] && !prev.hasInputLinks() && !prev.hasOutputLinks()) {
        drawing_area.deleteNode(prev)
      }
    } else {
      link[field].name = name
    }
  }

  // Réconcilie une ligne de l'onglet Flux. Retourne les types de changements appliqués.
  const reconcileFluxRow = (
    ws: any, r: number, originalLinkCount: number, hasAfm: boolean
  ): { structural: boolean, value: boolean } => {
    const idx = r - 1
    let structural = false
    let value = false
    const src = cellText(ws, r, 0)
    const tgt = cellText(ws, r, 1)

    if (idx < originalLinkCount) {
      // Ligne d'un flux existant : on applique uniquement les écarts.
      const link = rowLinks()[idx]
      if (!link) {
        return { structural, value }
      }
      if (link.value) {
        const v2 = parseNum(cellText(ws, r, 2))
        if (v2 !== (link.value.valueData != null ? link.value.valueData : null)) {
          link.value.valueData = v2
          value = true
        }
        if (hasAfm) {
          const v3 = parseNum(cellText(ws, r, 3))
          if (v3 !== (link.value.valueResult != null ? link.value.valueResult : null)) {
            link.value.valueResult = v3
            value = true
          }
        }
      }
      const map = nameToNode()
      if (src && src !== link.source.name) { applyEndpoint(link, 'source', src, map); structural = true }
      if (tgt && tgt !== link.target.name) { applyEndpoint(link, 'target', tgt, map); structural = true }
    } else {
      // Ligne nouvelle (au-delà des flux existants) : création si origine + destination saisies.
      if (src && tgt) {
        const map = nameToNode()
        const sNode = map[src] || sankey.addNewNodeWithName(src)
        const tNode = map[tgt] || sankey.addNewNodeWithName(tgt)
        if (!sankey.links_dict[defaultLinkId(sNode, tNode)]) {
          const l = sankey.addNewLink(sNode, tNode)
          const v2 = parseNum(cellText(ws, r, 2))
          if (l && l.value && v2 != null) {
            l.value.valueData = v2
          }
          structural = true
        }
      }
    }
    return { structural, value }
  }

  // Réconcilie une ligne de l'onglet Noeuds (renommage ; création si ligne nouvelle).
  const reconcileNodeRow = (ws: any, r: number, originalNodeCount: number): boolean => {
    const idx = r - 1
    const name = cellText(ws, r, NOEUDS_COL.node)
    if (idx < originalNodeCount) {
      const node = rowNodes()[idx]
      if (node && name && name !== node.name) {
        node.name = name
        return true
      }
    } else if (name && !nameToNode()[name]) {
      sankey.addNewNodeWithName(name)
      return true
    }
    return false
  }

  // Réconcilie une ligne de l'onglet Etiquettes : renomme le groupe (col 0), les étiquettes
  // (col 2, séparées par des virgules, appariées par position) et leurs couleurs (col 3).
  const reconcileTagRow = (ws: any, r: number): boolean => {
    const group = tagsRowGroups(app_data)[r - 1]
    if (!group) {
      return false
    }
    let changed = false
    const gName = cellText(ws, r, TAGS_COL.group)
    if (gName && gName !== group.name) {
      group.name = gName
      changed = true
    }
    const tags = group.tags_list || []
    const tagsText = cellText(ws, r, TAGS_COL.tags)
    if (tagsText) {
      const names = tagsText.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      // Renommage uniquement si le nombre d'étiquettes correspond (pas d'ajout/suppression ici).
      if (names.length === tags.length) {
        names.forEach((nm: string, i: number) => {
          if (nm !== tags[i].name) { tags[i].name = nm; changed = true }
        })
      }
    }
    const colorsText = cellText(ws, r, TAGS_COL.colors)
    if (colorsText) {
      colorsText.split(',').map((s: string) => s.trim()).forEach((col: string, i: number) => {
        if (i < tags.length && col && col !== tags[i].color) { tags[i].color = col; changed = true }
      })
    }
    return changed
  }

  // Réconcilie une ligne de l'onglet Ratio flux -> sankey.ratio_flux_constraints (sankeyexcelparser#116).
  // Colonnes : 0 Origine, 1 Destination, 2 Coef, 3 Min, 4 Max, 5 Origine réf, 6 Destination réf,
  // 7 Étiquette, 8 Étiquette réf, 9 Traduction. Pas d'impact visuel sur le diagramme (contrainte
  // solveur) : on met juste à jour le modèle, persisté tel quel.
  const reconcileRatioRow = (ws: any, r: number, originalRatioCount: number): boolean => {
    const idx = r - 1
    const origin = cellText(ws, r, 0)
    const destination = cellText(ws, r, 1)
    const coef = parseNum(cellText(ws, r, 2))
    const min = parseNum(cellText(ws, r, 3))
    const max = parseNum(cellText(ws, r, 4))
    const origin_ref = cellText(ws, r, 5)
    const destination_ref = cellText(ws, r, 6)
    const data_tag = cellText(ws, r, 7) || null
    const data_tag_ref = cellText(ws, r, 8) || null
    const traduction = cellText(ws, r, 9) || null

    if (idx < originalRatioCount) {
      // Ligne existante : édition in-place (l'édition d'une seule cellule réécrit la ligne entière
      // avec les valeurs courantes des autres cellules, qui sont inchangées).
      const rc = sankey.ratio_flux_constraints[idx]
      if (!rc) {
        return false
      }
      rc.origin = origin
      rc.destination = destination
      rc.coef = coef
      rc.min = min
      rc.max = max
      rc.origin_ref = origin_ref
      rc.destination_ref = destination_ref
      rc.data_tag = data_tag
      rc.data_tag_ref = data_tag_ref
      rc.traduction = traduction
      return true
    }
    // Ligne nouvelle : création quand les deux côtés sont complets et au moins un Coef/Min/Max.
    if (origin && destination && origin_ref && destination_ref && (coef != null || min != null || max != null)) {
      sankey.ratio_flux_constraints.push({
        origin, destination, origin_ref, destination_ref,
        coef, min, max, data_tag, data_tag_ref, traduction
      })
      return true
    }
    return false
  }

  // Réconcilie une ligne de l'onglet Ratio stock flux -> sankey.ratio_stock_flux_constraints (#156).
  // Colonnes : 0 Origine, 1 Destination, 2 Coef, 3 Min, 4 Max, 5 Stock, 6 Étiquette, 7 Étiquette réf,
  // 8 Traduction. flux[O->D, période] = Coef · S[Stock, période réf].
  const reconcileRatioStockRow = (ws: any, r: number, originalCount: number): boolean => {
    const idx = r - 1
    const origin = cellText(ws, r, 0)
    const destination = cellText(ws, r, 1)
    const coef = parseNum(cellText(ws, r, 2))
    const min = parseNum(cellText(ws, r, 3))
    const max = parseNum(cellText(ws, r, 4))
    const stock = cellText(ws, r, 5)
    const data_tag = cellText(ws, r, 6) || null
    const data_tag_ref = cellText(ws, r, 7) || null
    const traduction = cellText(ws, r, 8) || null
    if (idx < originalCount) {
      const rc = sankey.ratio_stock_flux_constraints[idx]
      if (!rc) { return false }
      rc.origin = origin; rc.destination = destination
      rc.coef = coef; rc.min = min; rc.max = max
      rc.stock = stock; rc.data_tag = data_tag; rc.data_tag_ref = data_tag_ref
      rc.traduction = traduction
      return true
    }
    // Nouvelle ligne : flux complet + nœud stock + au moins un Coef/Min/Max.
    if (origin && destination && stock && (coef != null || min != null || max != null)) {
      sankey.ratio_stock_flux_constraints.push({
        origin, destination, coef, min, max, stock, data_tag, data_tag_ref, traduction
      })
      return true
    }
    return false
  }

  // Réconcilie une ligne de l'onglet Chaînage stock -> sankey.stock_chaining_constraints (#156).
  // Colonnes : 0 Stock, 1 Coef, 2 Delta stock, 3 Étiquette, 4 Étiquette réf, 5 Traduction.
  // S[Stock, Année] = Coef · S[Stock, Année réf] + Δstock[Delta stock, Année].
  const reconcileStockChainRow = (ws: any, r: number, originalCount: number): boolean => {
    const idx = r - 1
    const stock = cellText(ws, r, 0)
    const coef = parseNum(cellText(ws, r, 1))
    const delta_stock = cellText(ws, r, 2)
    const data_tag = cellText(ws, r, 3) || null
    const data_tag_ref = cellText(ws, r, 4) || null
    const traduction = cellText(ws, r, 5) || null
    if (idx < originalCount) {
      const sc = sankey.stock_chaining_constraints[idx]
      if (!sc) { return false }
      sc.stock = stock; sc.coef = coef; sc.delta_stock = delta_stock
      sc.data_tag = data_tag; sc.data_tag_ref = data_tag_ref; sc.traduction = traduction
      return true
    }
    // Nouvelle ligne : un nœud de stock et une période de référence (l'année précédente).
    if (stock && data_tag_ref) {
      sankey.stock_chaining_constraints.push({
        stock, coef, delta_stock: delta_stock || stock, data_tag, data_tag_ref, traduction
      })
      return true
    }
    return false
  }

  const disposable = univerAPI.addEvent(univerAPI.Event.SheetValueChanged, (params: any) => {
    if (isSyncing.current) {
      return
    }
    const ranges = (params && params.effectedRanges) || []
    if (ranges.length === 0) {
      return
    }
    const wb = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
    if (!wb) {
      return
    }

    // Liaisons live : la vue/diagramme courant a pu changer depuis l'attache du bridge.
    drawing_area = app_data.drawing_area
    sankey = drawing_area.sankey

    drawing_area.setToModeEdition(false)
    const hasAfm = app_data.has_sankey_afm
    // Signature de la liste des nœuds AVANT traitement : une édition de flux peut créer un nœud
    // (origine/destination inédite), renommer une extrémité ou supprimer un nœud devenu orphelin.
    // Ces changements doivent se répercuter dans l'onglet Noeuds (et Flux) -> rebuild différé si la
    // signature change. Saut de ligne comme séparateur (improbable dans un nom de nœud).
    const nodeSig = (): string => sankey.nodes_list.map((n: any) => String(n.name)).join('\n')
    const beforeNodeSig = nodeSig()
    // Ids des nœuds AVANT traitement : permet d'isoler les nœuds créés par cette édition pour le
    // placement incrémental (mode 'increment').
    const beforeNodeIds = new Set(sankey.nodes_list.map((n: any) => n.id))
    // Comptes d'origine : addNewLink/addNewNode font de l'append -> les index existants restent valides.
    const originalLinkCount = rowLinks().length
    const originalNodeCount = rowNodes().length
    const originalRatioCount = sankey.ratio_flux_constraints.length
    const originalRatioStockCount = sankey.ratio_stock_flux_constraints.length
    const originalStockChainCount = sankey.stock_chaining_constraints.length

    // Regroupe les lignes affectées par feuille (paste = plage multi-lignes).
    const rowsBySheet: { [sheetId: string]: Set<number> } = {}
    ranges.forEach((fr: any) => {
      const sheetId = fr.getSheetId()
      const rng = fr.getRange()
      if (!rowsBySheet[sheetId]) {
        rowsBySheet[sheetId] = new Set()
      }
      for (let r = rng.startRow; r <= rng.endRow; r++) {
        rowsBySheet[sheetId].add(r)
      }
    })

    let structural = false
    let value = false
    let tagChanged = false
    Object.keys(rowsBySheet).forEach((sheetId) => {
      const ws = wb.getSheetBySheetId(sheetId)
      if (!ws) {
        return
      }
      const rows = Array.from(rowsBySheet[sheetId]).sort((a, b) => a - b)
      if (sheetId === SHEET_ID_FLUX) {
        rows.forEach((r) => {
          if (r === 0) {
            return // en-tête
          }
          const res = reconcileFluxRow(ws, r, originalLinkCount, hasAfm)
          structural = structural || res.structural
          value = value || res.value
        })
      } else if (sheetId === SHEET_ID_NOEUDS) {
        rows.forEach((r) => {
          if (r === 0) {
            return
          }
          if (reconcileNodeRow(ws, r, originalNodeCount)) {
            structural = true
          }
        })
      } else if (sheetId === SHEET_ID_TAGS) {
        rows.forEach((r) => {
          if (r === 0) {
            return
          }
          if (reconcileTagRow(ws, r)) {
            tagChanged = true
          }
        })
      } else if (sheetId === SHEET_ID_RATIO) {
        rows.forEach((r) => {
          if (r === 0) {
            return // en-tête
          }
          reconcileRatioRow(ws, r, originalRatioCount)
        })
      } else if (sheetId === SHEET_ID_RATIO_STOCK) {
        rows.forEach((r) => {
          if (r === 0) {
            return // en-tête
          }
          reconcileRatioStockRow(ws, r, originalRatioStockCount)
        })
      } else if (sheetId === SHEET_ID_STOCK_CHAINING) {
        rows.forEach((r) => {
          if (r === 0) {
            return // en-tête
          }
          reconcileStockChainRow(ws, r, originalStockChainCount)
        })
      }
    })

    // La liste des nœuds a-t-elle changé (création/renommage/suppression d'orphelin via l'onglet
    // Flux notamment) ? Si oui, l'onglet Noeuds est devenu obsolète et doit être reconstruit.
    const nodesChanged = nodeSig() !== beforeNodeSig
    const newNodes = sankey.nodes_list.filter((n: any) => !beforeNodeIds.has(n.id))

    // Si exactement une valeur existe sur tout le diagramme, elle fixe l'échelle. À déclencher
    // AUSSI sur le chemin structurel : créer un flux avec sa valeur (première valeur d'un diagramme
    // complet) ne lève que `structural`, jamais `value` -> sinon l'échelle ne se calerait jamais.
    if (structural || value) {
      drawing_area.updateScaleAtLinkValueSetting()
    }
    if (structural) {
      redraw(newNodes)
    } else if (value) {
      app_data.draw()
    } else if (tagChanged) {
      app_data.draw()
    }

    // Reconstruction du classeur pour répercuter dans l'onglet Noeuds (et Flux) les renommages de
    // tags/étiquettes OU les changements de la liste des nœuds induits par une édition de flux.
    // En DIFFÉRÉ (setTimeout) : reconstruire pendant le traitement de la commande disposerait l'unit
    // Univer en plein vol (crash "univerInstanceService is null").
    if (tagChanged || nodesChanged) {
      const ref = app_data.menu_configuration.ref_to_spreadsheet
      if (ref && ref.current) {
        setTimeout(() => { if (ref.current) { ref.current() } }, 0)
      }
    }
  })

  // Suppression de ligne (clic droit -> supprimer la ligne) : la commande remove-row est structurelle
  // (ne passe pas par SheetValueChanged). Au moment de CommandExecuted, le modèle Sankey a encore
  // tous les nœuds/liens -> on mappe les lignes supprimées (1-based décalé) vers les éléments.
  const removeDisposable = univerAPI.addEvent(univerAPI.Event.CommandExecuted, (event: any) => {
    if (isSyncing.current) {
      return
    }
    if (event.id !== 'sheet.command.remove-row' && event.id !== 'sheet.command.remove-row-by-range') {
      return
    }
    const p = event.params || {}
    const range = p.range
    if (!range) {
      return
    }
    // Liaisons live : la vue/diagramme courant a pu changer depuis l'attache du bridge.
    drawing_area = app_data.drawing_area
    sankey = drawing_area.sankey
    const wb = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
    const sheetId = p.subUnitId || (wb && wb.getActiveSheet && wb.getActiveSheet().getSheetId())
    let structural = false

    if (sheetId === SHEET_ID_NOEUDS) {
      const toDelete: any[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        const node = r >= 1 ? rowNodes()[r - 1] : null
        if (node) {
          toDelete.push(node)
        }
      }
      toDelete.forEach((n) => { drawing_area.deleteNode(n); structural = true })
    } else if (sheetId === SHEET_ID_FLUX) {
      const toDelete: any[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        const link = r >= 1 ? rowLinks()[r - 1] : null
        if (link) {
          toDelete.push(link)
        }
      }
      toDelete.forEach((l) => { drawing_area.deleteLink(l); structural = true })
    } else if (sheetId === SHEET_ID_RATIO) {
      // Suppression de contraintes ratio : retrait du modèle (aucun impact visuel sur le
      // diagramme). Splice en ordre décroissant pour garder les index valides.
      const idxs: number[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        if (r >= 1) {
          idxs.push(r - 1)
        }
      }
      idxs.sort((a, b) => b - a).forEach((i) => {
        if (i < sankey.ratio_flux_constraints.length) {
          sankey.ratio_flux_constraints.splice(i, 1)
        }
      })
    } else if (sheetId === SHEET_ID_RATIO_STOCK) {
      const idxs: number[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        if (r >= 1) {
          idxs.push(r - 1)
        }
      }
      idxs.sort((a, b) => b - a).forEach((i) => {
        if (i < sankey.ratio_stock_flux_constraints.length) {
          sankey.ratio_stock_flux_constraints.splice(i, 1)
        }
      })
    } else if (sheetId === SHEET_ID_STOCK_CHAINING) {
      const idxs: number[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        if (r >= 1) {
          idxs.push(r - 1)
        }
      }
      idxs.sort((a, b) => b - a).forEach((i) => {
        if (i < sankey.stock_chaining_constraints.length) {
          sankey.stock_chaining_constraints.splice(i, 1)
        }
      })
    }

    if (structural) {
      redraw()
    }
  })

  return {
    dispose: () => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose()
      }
      if (removeDisposable && typeof removeDisposable.dispose === 'function') {
        removeDisposable.dispose()
      }
    }
  }
}

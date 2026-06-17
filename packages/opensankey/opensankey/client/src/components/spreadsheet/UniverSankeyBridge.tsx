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
import {
  NodeProductStyle, NodeSectorStyle, elementStyleConfigs, ElementStyleKey
} from '../../Elements/ElementStyle'
import {
  SHEET_ID_FLUX, SHEET_ID_NOEUDS, SHEET_ID_TAGS, SHEET_ID_RATIO, SHEET_ID_RATIO_STOCK,
  SHEET_ID_STOCK_CHAINING, SHEET_ID_PRODUITS, SHEET_ID_SECTEURS, SHEET_ID_ECHANGES, SHEET_ID_NOEUDS_AGG,
  SHEET_ID_TES, SHEET_ID_TER,
  NOEUDS_COL, TAGS_COL, NODE_TYPE_GROUP_ID, NODE_TYPE_PRODUCT, NODE_TYPE_SECTOR, NODE_TYPE_EXCHANGE,
  fluxRowLinks, noeudsRowEntries, tagsRowGroups, nodeTypeTag, nodesAggLayout,
  nodeSheetTagColumns, tesMatrixNodes, terMatrixLayout, fluxCellLabel
} from './UniverSankeyData'

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
  // Onglets Produits/Secteurs/Échanges : même mapping que Noeuds, mais filtré par le tag de nature.
  const typeRowNodes = (tag: any): any[] =>
    noeudsRowEntries(app_data, onlyVisibleRef.current, tag).map((e: any) => e.node)
  // Nature (produit/secteur/echange) par sheetId. Le tag est résolu À L'ÉVÉNEMENT (pas capturé à
  // l'attache) pour rester valide si un fichier portant ces tags est chargé pendant que l'onglet
  // Tableur est ouvert. tag undefined (nature absente) => la feuille reste inerte.
  const NODE_SHEET_TYPE: { [sheetId: string]: string } = {
    [SHEET_ID_PRODUITS]: NODE_TYPE_PRODUCT,
    [SHEET_ID_SECTEURS]: NODE_TYPE_SECTOR,
    [SHEET_ID_ECHANGES]: NODE_TYPE_EXCHANGE
  }
  const sheetTypeTag = (sheetId: string): any =>
    NODE_SHEET_TYPE[sheetId] ? nodeTypeTag(sankey, NODE_SHEET_TYPE[sheetId]) : undefined

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

  // Disposition automatique reproduisant EXACTEMENT l'appel du bouton « disposition auto »
  // (MenuContextAutoLayout) : mêmes espacements et modes sources/puits configurés par l'utilisateur.
  // L'ancien appel `(true, true)` figeait les défauts (before_neighbor/after_neighbor, espacements =
  // dx/dy du NŒUD au lieu du style par défaut) → disposition différente de celle obtenue via le menu
  // après rechargement (que l'utilisateur prend comme référence).
  const computeAutoLayout = () => {
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
  }

  // newNodes : nœuds créés par l'édition courante (mode 'increment' uniquement).
  const redraw = (newNodes: any[] = []) => {
    const mode = menu_configuration.spreadsheet_placement_mode
    // 'spreadsheet_freeze' (legacy reactgrid) force le mode 'none' s'il est actif.
    const effective = menu_configuration.spreadsheet_freeze ? 'none' : mode
    if (effective === 'auto') {
      computeAutoLayout()
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
    // Tolère le « % » d'une cellule à format pourcentage (ex. « 15% » saisi/affiché dans la colonne
    // Incertitude) : sans ce strip, Number(« 15% ») = NaN -> valeur non persistée (cellule qui se vide
    // au rebuild). Inoffensif pour les autres colonnes (pas de % attendu).
    const n = Number(s.replace(',', '.').replace(/\s/g, '').replace(/%/g, ''))
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
        // Col 6 = Incertitude relative (en %) : on persiste exactement la valeur saisie (vide -> null).
        const u = parseNum(cellText(ws, r, 6))
        if (u !== (link.value.data_uncertainty != null ? link.value.data_uncertainty : null)) {
          link.value.data_uncertainty = u
          value = true
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
          // Incertitude relative (col 6) : persistée si saisie.
          const u = parseNum(cellText(ws, r, 6))
          if (l && l.value && u != null) {
            l.value.data_uncertainty = u
          }
          structural = true
        }
      }
    }
    return { structural, value }
  }

  // Réconcilie une ligne d'une feuille de nœuds (Noeuds / Produits / Secteurs / Échanges) :
  // renommage d'un nœud existant ; création si ligne nouvelle. `getRowNodes` = mapping ligne->nœud
  // propre à la feuille (filtré ou non par nature) ; `typeTag` = tag de nature appliqué aux nœuds
  // créés sur une feuille filtrée (pour qu'ils se rangent dans la bonne feuille, comme SEP).
  // Aligne l'appartenance d'un nœud aux étiquettes d'un groupe (colonne de tags) sur la cellule
  // (liste déroulante multi-valeurs, valeurs jointes par virgule). N'ajoute/ne retire QUE des
  // étiquettes EXISTANTES du groupe (la liste déroulante ne propose qu'elles) ; les noms inconnus
  // sont ignorés. Retourne true si l'appartenance a changé.
  // HACK (temporaire) : assigne/retire le style produit/secteur selon l'étiquette de nature, en
  // attendant un vrai « style associé à une étiquette ». Mapping tag de nature -> style de nœud.
  const TYPE_TAG_STYLE: { [tagName: string]: ElementStyleKey } = {
    [NODE_TYPE_PRODUCT]: NodeProductStyle,
    [NODE_TYPE_SECTOR]: NodeSectorStyle
  }
  // Aligne le style produit/secteur du nœud sur ses étiquettes de nature (cellule du groupe
  // « type de noeud »). `wanted` = noms d'étiquettes saisis dans la cellule.
  const syncNodeTypeStyle = (node: any, wanted: Set<string>): boolean => {
    let changed = false
    Object.keys(TYPE_TAG_STYLE).forEach((tagName) => {
      const styleId = TYPE_TAG_STYLE[tagName]
      // Les styles produit/secteur ne sont créés qu'au chargement d'un fichier portant le groupe
      // « type de noeud » ; on les crée à la demande (idempotent) pour que le hack marche aussi sur
      // un groupe ajouté à l'exécution.
      if (!sankey.styles_dict[styleId]) {
        sankey.create_internal_style(styleId, elementStyleConfigs)
      }
      const style = sankey.styles_dict[styleId]
      if (!style) {
        return
      }
      const want = wanted.has(tagName)
      if (want && !node.hasStyle(styleId)) {
        node.addStyle(style)
        changed = true
      } else if (!want && node.hasStyle(styleId)) {
        node.removeStyleById(styleId)
        changed = true
      }
    })
    return changed
  }

  const reconcileNodeTagCell = (node: any, group: any, text: string): boolean => {
    const wanted = new Set(
      text.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    )
    let changed = false
    ;(group.tags_list || []).forEach((tag: any) => {
      const has = !!(node.hasGivenTag && node.hasGivenTag(tag))
      if (wanted.has(tag.name) && !has) {
        node.addTag(tag)
        changed = true
      } else if (!wanted.has(tag.name) && has) {
        node.removeTag(tag)
        changed = true
      }
    })
    // Groupe de nature : synchronise le style produit/secteur (hack ci-dessus).
    if (group.id === NODE_TYPE_GROUP_ID && syncNodeTypeStyle(node, wanted)) {
      changed = true
    }
    return changed
  }

  const reconcileNodeRow = (
    ws: any, r: number, originalNodeCount: number,
    getRowNodes: () => any[], typeTag?: any, tagColumns: Array<{ col: number, group: any }> = []
  ): { structural: boolean, value: boolean, tag: boolean } => {
    const idx = r - 1
    const name = cellText(ws, r, NOEUDS_COL.node)
    let structural = false
    let value = false
    let tag = false
    if (idx < originalNodeCount) {
      const node = getRowNodes()[idx]
      if (!node) {
        return { structural, value, tag }
      }
      if (name && name !== node.name) {
        node.name = name
        structural = true
      }
      // Couleur : la cellule affiche getShapeColorToUse() ; on réécrit la couleur propre du nœud
      // (shape_color) si elle a changé — édition basique, comme le sélecteur de couleur du menu.
      // (Si la couleur est pilotée par des étiquettes, shape_color reste masquée par la couleur de
      // tag tant que le « cadenas » couleur n'est pas activé : comportement identique au menu.)
      const colorText = cellText(ws, r, NOEUDS_COL.color)
      const curColor = (node.getShapeColorToUse ? node.getShapeColorToUse() : node.shape_color) || ''
      if (colorText && colorText !== curColor) {
        node.shape_color = colorText
        value = true
      }
      // Définition / infobulle.
      const defText = cellText(ws, r, NOEUDS_COL.definitions)
      if (defText !== (node.tooltip_text || '')) {
        node.tooltip_text = defText
        value = true
      }
      // Équilibre entrée-sortie : pertinent uniquement pour un nœud interne (flux entrant ET sortant ;
      // une extrémité ne peut pas être équilibrée). « 0 » -> has_material_balance=false ; sinon true.
      if (node.hasInputLinks && node.hasOutputLinks && node.hasInputLinks() && node.hasOutputLinks()) {
        const wantBalance = cellText(ws, r, NOEUDS_COL.mat_balance) !== '0'
        if (wantBalance !== (node.has_material_balance !== false)) {
          node.has_material_balance = wantBalance
          value = true
        }
      }
      // Étiquettes : colonnes de tags (sélecteur déroulant). Aligne l'appartenance du nœud aux
      // étiquettes de chaque groupe sur la cellule. Marqué `tag` (pas `structural`) -> redraw simple
      // + reconstruction différée de l'onglet (rafraîchit la colonne Couleur si pilotée par tag),
      // sans relayout des positions.
      tagColumns.forEach(({ col, group }) => {
        if (reconcileNodeTagCell(node, group, cellText(ws, r, col))) {
          tag = true
        }
      })
    } else if (name && !nameToNode()[name]) {
      const node = sankey.addNewNodeWithName(name)
      if (node && typeTag && node.addTag) {
        node.addTag(typeTag)
      }
      // Étiquettes saisies sur la ligne du nouveau nœud (au-delà du tag de nature).
      if (node) {
        tagColumns.forEach(({ col, group }) => {
          reconcileNodeTagCell(node, group, cellText(ws, r, col))
        })
      }
      structural = true
    }
    return { structural, value, tag }
  }

  // Réconcilie une ligne de l'onglet « Noeuds par agrégation » : write-back = renommage des nœuds.
  // Chaque colonne de niveau contient le nom d'un nœud de la chaîne feuille->racine ; on renomme
  // le nœud sous-jacent si la cellule a changé. (Couleur/position/tags = lecture seule pour l'instant.)
  const reconcileAggRow = (ws: any, r: number, aggLayout: any): boolean => {
    const aggRow = aggLayout.rows[r - 1]
    if (!aggRow) {
      return false
    }
    let changed = false
    for (let c = 0; c < aggLayout.levelCount; c++) {
      const node = aggRow.levelNodes[c]
      if (!node) {
        continue
      }
      const name = cellText(ws, r, c)
      if (name && name !== node.name) {
        node.name = name
        changed = true
      }
    }
    return changed
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
  const reconcileRatioRow = (ws: any, r: number, originalRatioCount: number, prune: number[]): boolean => {
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
      // Ligne existante entièrement vidée (sélection + touche Suppr) : suppression réelle de la
      // contrainte, pas une réécriture en contrainte fantôme aux champs vides. On marque l'index à
      // purger (le splice et le rebuild sont différés après la passe pour garder les index valides).
      if (!origin && !destination && !origin_ref && !destination_ref &&
        coef == null && min == null && max == null && !data_tag && !data_tag_ref && !traduction) {
        prune.push(idx)
        return false
      }
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
  const reconcileRatioStockRow = (ws: any, r: number, originalCount: number, prune: number[]): boolean => {
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
      // Ligne existante entièrement vidée -> suppression réelle (voir reconcileRatioRow).
      if (!origin && !destination && !stock && coef == null && min == null && max == null &&
        !data_tag && !data_tag_ref && !traduction) {
        prune.push(idx)
        return false
      }
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
  const reconcileStockChainRow = (ws: any, r: number, originalCount: number, prune: number[]): boolean => {
    const idx = r - 1
    const stock = cellText(ws, r, 0)
    const coef = parseNum(cellText(ws, r, 1))
    const delta_stock = cellText(ws, r, 2)
    const data_tag = cellText(ws, r, 3) || null
    const data_tag_ref = cellText(ws, r, 4) || null
    const traduction = cellText(ws, r, 5) || null
    if (idx < originalCount) {
      // Ligne existante entièrement vidée -> suppression réelle (voir reconcileRatioRow).
      if (!stock && coef == null && !delta_stock && !data_tag && !data_tag_ref && !traduction) {
        prune.push(idx)
        return false
      }
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

  // Résout les deux extrémités (origine, destination) d'une cellule de matrice TES/TER. Renvoie null
  // pour les cellules d'en-tête / de coin / de séparation (rien à faire).
  const matrixCellEndpoints = (sheetId: string, r: number, c: number): { orig: any, dest: any } | null => {
    if (c < 1) {
      return null
    }
    if (sheetId === SHEET_ID_TES) {
      // Matrice carrée : ligne = origine, colonne = destination.
      const nodes = tesMatrixNodes(app_data, onlyVisibleRef.current)
      if (r < 1 || r - 1 >= nodes.length || c - 1 >= nodes.length) {
        return null
      }
      return { orig: nodes[r - 1], dest: nodes[c - 1] }
    }
    // TER : produits en lignes, secteurs en colonnes, deux blocs.
    const lay = terMatrixLayout(app_data, onlyVisibleRef.current)
    if (c - 1 >= lay.sectors.length) {
      return null
    }
    const sector = lay.sectors[c - 1]
    // Bloc 1 « Ressources » (lignes 1..P) : flux secteur → produit.
    if (r >= 1 && r <= lay.products.length) {
      return { orig: sector, dest: lay.products[r - 1] }
    }
    // Bloc 2 « Emplois » (lignes block2HeaderRow+1 .. +P) : flux produit → secteur.
    const b2first = lay.block2HeaderRow + 1
    if (r >= b2first && r < b2first + lay.products.length) {
      return { orig: lay.products[r - b2first], dest: sector }
    }
    return null // en-tête de bloc ou ligne de séparation
  }

  // Réconcilie une cellule de matrice TES/TER : une cellule NON VIDE (croix « x » ou nombre) garantit
  // l'existence du flux origine→destination (création si absent ; valeur saisie posée si nombre) ;
  // une cellule VIDÉE supprime le flux. La diagonale (origine == destination) est ignorée.
  const reconcileMatrixCell = (
    sheetId: string, ws: any, r: number, c: number
  ): { structural: boolean, value: boolean } => {
    const ends = matrixCellEndpoints(sheetId, r, c)
    if (!ends || !ends.orig || !ends.dest || ends.orig === ends.dest) {
      return { structural: false, value: false }
    }
    const text = cellText(ws, r, c)
    const existing = sankey.links_dict[defaultLinkId(ends.orig, ends.dest)]
    if (text === '') {
      if (existing) {
        drawing_area.deleteLink(existing)
        return { structural: true, value: false }
      }
      return { structural: false, value: false }
    }
    let structural = false
    let link = existing
    if (!link) {
      link = sankey.addNewLink(ends.orig, ends.dest)
      structural = true
    }
    // Cellule numérique -> on pose aussi la valeur saisie (sinon simple « x » = existence seule).
    const num = parseNum(text)
    let value = false
    if (link && link.value && num != null && num !== link.value.valueData) {
      link.value.valueData = num
      value = true
    }
    return { structural, value }
  }

  const disposable = univerAPI.addEvent(univerAPI.Event.SheetValueChanged, (params: any) => {
    if (isSyncing.current) {
      return
    }
    const ranges = (params && params.effectedRanges) || []
    // [DEBUG paste-reset] à retirer
    try {
      console.log('[bridge] SheetValueChanged ' + JSON.stringify(ranges.map((fr: any) => {
        const rg = fr.getRange()
        return { sheet: fr.getSheetId(), sr: rg.startRow, er: rg.endRow, sc: rg.startColumn, ec: rg.endColumn }
      })))
    } catch (e) { console.log('[bridge] SheetValueChanged (introspection failed)', e) }
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

    // RESET sur collage d'un tableau en A2 de l'onglet Flux : un paste qui démarre en A2 (1re ligne
    // de données, colonne Origine) et couvre PLUSIEURS lignes ET au moins 2 colonnes (Origine +
    // Destination) est interprété comme l'import d'une NOUVELLE liste de flux. Plutôt que de
    // réconcilier ligne par ligne (ce qui mapperait les anciens flux sur les nouvelles lignes), on
    // VIDE entièrement le diagramme puis on le reconstruit à partir des seules lignes collées.
    const fluxPaste = ranges
      .map((fr: any) => ({ id: fr.getSheetId(), rng: fr.getRange() }))
      .find((x: any) => x.id === SHEET_ID_FLUX &&
        x.rng.startRow === 1 && x.rng.startColumn === 0 &&
        x.rng.endRow > x.rng.startRow && x.rng.endColumn >= 1)
    // [DEBUG paste-reset] à retirer
    console.log('[bridge] fluxPaste match=', !!fluxPaste, 'SHEET_ID_FLUX=', SHEET_ID_FLUX,
      fluxPaste ? JSON.stringify(fluxPaste) : '')
    if (fluxPaste) {
      const ws = wb.getSheetBySheetId(SHEET_ID_FLUX)
      if (ws) {
        // Vider entièrement le diagramme (flux PUIS nœuds : un nœud orphelin se supprime seul).
        ;[...sankey.links_list].forEach((l: any) => drawing_area.deleteLink(l))
        ;[...sankey.nodes_list].forEach((n: any) => drawing_area.deleteNode(n))
        // Reconstruire depuis les lignes collées. Dédoublonnage des nœuds par nom (un nom = un nœud).
        const map: { [name: string]: any } = {}
        const getNode = (name: string): any => {
          if (!map[name]) {
            map[name] = sankey.addNewNodeWithName(name)
          }
          return map[name]
        }
        for (let r = fluxPaste.rng.startRow; r <= fluxPaste.rng.endRow; r++) {
          const src = cellText(ws, r, 0)
          const tgt = cellText(ws, r, 1)
          if (!src || !tgt) {
            continue
          }
          const sNode = getNode(src)
          const tNode = getNode(tgt)
          if (sankey.links_dict[defaultLinkId(sNode, tNode)]) {
            continue
          }
          const l = sankey.addNewLink(sNode, tNode)
          if (l && l.value) {
            const v2 = parseNum(cellText(ws, r, 2))
            if (v2 != null) {
              l.value.valueData = v2
            }
            if (hasAfm) {
              const v3 = parseNum(cellText(ws, r, 3))
              if (v3 != null) {
                l.value.valueResult = v3
              }
            }
            const u = parseNum(cellText(ws, r, 6))
            if (u != null) {
              l.value.data_uncertainty = u
            }
          }
        }
        // [DEBUG paste-reset] à retirer
        console.log('[bridge] RESET done: nodes=', sankey.nodes_list.length,
          'links=', sankey.links_list.length, 'rows', fluxPaste.rng.startRow, '..', fluxPaste.rng.endRow)
        // Diagramme reconstruit de zéro -> diagramme « vierge » (0 flux valué avant) : l'échelle se
        // cale sur le plus gros flux collé.
        drawing_area.updateScaleAtLinkValueSetting(0)
        // Tout le diagramme est neuf -> disposition automatique (les modes increment/none laisseraient
        // les nœuds empilés à l'origine faute de repère déjà positionné).
        computeAutoLayout()
        app_data.draw()
        // Réaligner l'onglet Flux/Noeuds sur le modèle (purge des lignes obsolètes au-delà du collage,
        // reconstruction de l'onglet Noeuds). En différé : reconstruire pendant le traitement de la
        // commande disposerait l'unit Univer en plein vol.
        const ref = app_data.menu_configuration.ref_to_spreadsheet
        if (ref && ref.current) {
          setTimeout(() => { if (ref.current) { ref.current() } }, 0)
        }
      }
      return
    }

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
    // Nombre de flux déjà valués AVANT l'édition : si le diagramme était « vierge » (0 ou 1 valeur)
    // et qu'un paste y dépose plusieurs valeurs, l'échelle doit se caler sur le plus gros flux.
    const beforeValuedLinkCount = sankey.links_list.filter((l: any) => l.valueCurrent).length
    // Comptes par feuille de nœuds filtrée (Produits/Secteurs/Échanges) AVANT édition.
    const originalNodeCountBySheet: { [sheetId: string]: number } = {}
    Object.keys(NODE_SHEET_TYPE).forEach((sid) => {
      const tag = sheetTypeTag(sid)
      originalNodeCountBySheet[sid] = tag ? typeRowNodes(tag).length : 0
    })
    const originalRatioCount = sankey.ratio_flux_constraints.length
    const originalRatioStockCount = sankey.ratio_stock_flux_constraints.length
    const originalStockChainCount = sankey.stock_chaining_constraints.length

    // Regroupe les lignes affectées par feuille (paste = plage multi-lignes). Les matrices TES/TER
    // sont traitées par CELLULE (origine×destination) -> collectées à part en (ligne, colonne).
    const rowsBySheet: { [sheetId: string]: Set<number> } = {}
    const matrixCellsBySheet: { [sheetId: string]: Array<{ r: number, c: number }> } = {}
    ranges.forEach((fr: any) => {
      const sheetId = fr.getSheetId()
      const rng = fr.getRange()
      if (sheetId === SHEET_ID_TES || sheetId === SHEET_ID_TER) {
        if (!matrixCellsBySheet[sheetId]) {
          matrixCellsBySheet[sheetId] = []
        }
        for (let r = rng.startRow; r <= rng.endRow; r++) {
          for (let c = rng.startColumn; c <= rng.endColumn; c++) {
            matrixCellsBySheet[sheetId].push({ r, c })
          }
        }
        return
      }
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
    // Index de contraintes vidées (ligne existante effacée via la touche Suppr) à purger après la
    // passe : on collecte puis on splice en ordre décroissant pour garder les index valides.
    const ratioPrune: number[] = []
    const ratioStockPrune: number[] = []
    const stockChainPrune: number[] = []
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
        const tagCols = nodeSheetTagColumns(app_data, SHEET_ID_NOEUDS)
        rows.forEach((r) => {
          if (r === 0) {
            return
          }
          const res = reconcileNodeRow(ws, r, originalNodeCount, rowNodes, undefined, tagCols)
          structural = structural || res.structural
          value = value || res.value
          tagChanged = tagChanged || res.tag
        })
      } else if (NODE_SHEET_TYPE[sheetId]) {
        // Onglets Produits / Secteurs / Échanges : renommage + création (avec tag de nature).
        const tag = sheetTypeTag(sheetId)
        const cnt = originalNodeCountBySheet[sheetId]
        const tagCols = nodeSheetTagColumns(app_data, sheetId)
        rows.forEach((r) => {
          if (r === 0) {
            return
          }
          if (tag) {
            const res = reconcileNodeRow(ws, r, cnt, () => typeRowNodes(tag), tag, tagCols)
            structural = structural || res.structural
            value = value || res.value
            tagChanged = tagChanged || res.tag
          }
        })
      } else if (sheetId === SHEET_ID_NOEUDS_AGG) {
        // Onglet « Noeuds par agrégation » : write-back = renommage des nœuds (cellules de niveau).
        const aggLayout = nodesAggLayout(app_data, onlyVisibleRef.current)
        rows.forEach((r) => {
          if (r === 0) {
            return
          }
          if (reconcileAggRow(ws, r, aggLayout)) {
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
          reconcileRatioRow(ws, r, originalRatioCount, ratioPrune)
        })
      } else if (sheetId === SHEET_ID_RATIO_STOCK) {
        rows.forEach((r) => {
          if (r === 0) {
            return // en-tête
          }
          reconcileRatioStockRow(ws, r, originalRatioStockCount, ratioStockPrune)
        })
      } else if (sheetId === SHEET_ID_STOCK_CHAINING) {
        rows.forEach((r) => {
          if (r === 0) {
            return // en-tête
          }
          reconcileStockChainRow(ws, r, originalStockChainCount, stockChainPrune)
        })
      }
    })

    // Matrices TES/TER : chaque cellule cochée/décochée crée/supprime le flux origine→destination.
    let matrixChanged = false
    Object.keys(matrixCellsBySheet).forEach((sheetId) => {
      const ws = wb.getSheetBySheetId(sheetId)
      if (!ws) {
        return
      }
      matrixCellsBySheet[sheetId].forEach(({ r, c }) => {
        const res = reconcileMatrixCell(sheetId, ws, r, c)
        structural = structural || res.structural
        value = value || res.value
        matrixChanged = matrixChanged || res.structural || res.value
      })
    })

    // Purge des contraintes vidées (touche Suppr sur une ligne existante) : splice en ordre
    // décroissant pour ne pas invalider les index restants. Le rebuild différé plus bas réaligne
    // ensuite l'affichage (lignes vides retirées) sur le modèle.
    const pruneConstraints = (list: any[], idxs: number[]) => {
      idxs.sort((a, b) => b - a).forEach((i) => {
        if (i < list.length) {
          list.splice(i, 1)
        }
      })
    }
    pruneConstraints(sankey.ratio_flux_constraints, ratioPrune)
    pruneConstraints(sankey.ratio_stock_flux_constraints, ratioStockPrune)
    pruneConstraints(sankey.stock_chaining_constraints, stockChainPrune)
    const constraintsPruned = ratioPrune.length > 0 || ratioStockPrune.length > 0 || stockChainPrune.length > 0

    // La liste des nœuds a-t-elle changé (création/renommage/suppression d'orphelin via l'onglet
    // Flux notamment) ? Si oui, l'onglet Noeuds est devenu obsolète et doit être reconstruit.
    const nodesChanged = nodeSig() !== beforeNodeSig
    const newNodes = sankey.nodes_list.filter((n: any) => !beforeNodeIds.has(n.id))

    // Si exactement une valeur existe sur tout le diagramme, elle fixe l'échelle. À déclencher
    // AUSSI sur le chemin structurel : créer un flux avec sa valeur (première valeur d'un diagramme
    // complet) ne lève que `structural`, jamais `value` -> sinon l'échelle ne se calerait jamais.
    if (structural || value) {
      drawing_area.updateScaleAtLinkValueSetting(beforeValuedLinkCount)
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
    if (tagChanged || nodesChanged || constraintsPruned) {
      const ref = app_data.menu_configuration.ref_to_spreadsheet
      if (ref && ref.current) {
        setTimeout(() => { if (ref.current) { ref.current() } }, 0)
      }
    } else if (matrixChanged) {
      // Édition d'une matrice TES/TER : un flux a été créé/supprimé via une cellule. On NE
      // reconstruit PAS tout le classeur (un rebuild ré-ordonnerait les axes — l'ordre des nœuds
      // dépend de visible_nodes_list, qui peut changer après addNewLink/redraw — et reconstruirait
      // chaque onglet à chaque croix). Une édition de matrice ne change jamais l'ensemble des nœuds
      // (extrémités = nœuds existants ; deleteLink ne supprime pas les orphelins), donc l'ordre est
      // stable : on se contente de réécrire EN PLACE la valeur canonique des cellules éditées (croix
      // « x » ou valeur du modèle, '' si flux supprimé). Différé + isSyncing pour ne pas re-déclencher
      // l'événement ni écrire pendant le traitement de la commande courante.
      const cells = matrixCellsBySheet
      setTimeout(() => {
        isSyncing.current = true
        try {
          const mode = app_data.menu_configuration.spreadsheet_matrix_mode
          Object.keys(cells).forEach((sheetId) => {
            const ws2 = wb.getSheetBySheetId(sheetId)
            if (!ws2) {
              return
            }
            cells[sheetId].forEach(({ r, c }) => {
              const ends = matrixCellEndpoints(sheetId, r, c)
              // En-tête / coin / séparateur (ends null) : ne pas toucher.
              if (!ends || !ends.orig || !ends.dest || ends.orig === ends.dest) {
                return
              }
              const link = sankey.links_dict[defaultLinkId(ends.orig, ends.dest)]
              ws2.getRange(r, c).setValue(fluxCellLabel(link || null, mode))
            })
          })
        } finally {
          isSyncing.current = false
        }
      }, 0)
    }
  })

  // Suppression de ligne (clic droit -> supprimer la ligne) : la commande remove-row est structurelle
  // (ne passe pas par SheetValueChanged). Au moment de CommandExecuted, le modèle Sankey a encore
  // tous les nœuds/liens -> on mappe les lignes supprimées (1-based décalé) vers les éléments.
  const removeDisposable = univerAPI.addEvent(univerAPI.Event.CommandExecuted, (event: any) => {
    if (isSyncing.current) {
      return
    }
    // [DEBUG paste-reset] à retirer : tracer les ids de commande (repérer la commande de collage)
    if (event && event.id && /paste|clipboard|value|set-range/i.test(String(event.id))) {
      console.log('[bridge] CommandExecuted', event.id)
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

    if (sheetId === SHEET_ID_NOEUDS || NODE_SHEET_TYPE[sheetId]) {
      // Onglet Noeuds ou feuille filtrée par nature : suppression du nœud sous-jacent. Pour une
      // feuille de type, mapping filtré par le tag ; si le tag est absent (feuille inerte), aucune
      // suppression (ne PAS retomber sur le mapping global -> mauvaise ligne).
      const isTypeSheet = !!NODE_SHEET_TYPE[sheetId]
      const typeTag = isTypeSheet ? sheetTypeTag(sheetId) : undefined
      const getNodes = isTypeSheet
        ? (typeTag ? () => typeRowNodes(typeTag) : () => [])
        : rowNodes
      const toDelete: any[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        const node = r >= 1 ? getNodes()[r - 1] : null
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

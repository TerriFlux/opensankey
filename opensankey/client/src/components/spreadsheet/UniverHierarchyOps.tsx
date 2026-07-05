// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Opérations unitaires de hiérarchie d'agrégation, pilotées par des boutons du tableur (et non plus
// par l'édition de la colonne 'Niveau d\'agrégation', trop fragile). Agissent sur la sélection
// courante de l'onglet Noeuds. S'appuient sur l'API du modèle (Class_NodeDimension, addNodeAsChild,
// setForceToShowParent/Children) -> opérations explicites qui mappent 1:1 sur le modèle.
// ==================================================================================================

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeDimension } from '../../Elements/NodeDimension'
import { SHEET_ID_NOEUDS, NOEUDS_COL } from './UniverSankeyData'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Groupe de level-tags (dimension) géré par le tableur.
export const SPREADSHEET_DIM_ID = 'spreadsheet_levels'

const ensureDimGroup = (sankey: any) => {
  if (!sankey.level_taggs_list.some((g: any) => g.id === SPREADSHEET_DIM_ID)) {
    sankey.addLevelTagGroup(SPREADSHEET_DIM_ID, 'Niveau d\'agrégation')
  }
}

/** Nœuds sélectionnés dans l'onglet Noeuds (vide si autre onglet / pas de sélection). */
export const getSelectedNodes = (app_data: Class_ApplicationData, univerAPI: any): any[] => {
  const sankey = (app_data.drawing_area as any).sankey
  const wb = univerAPI && univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
  if (!wb) {
    return []
  }
  const ws = wb.getActiveSheet && wb.getActiveSheet()
  if (!ws || (ws.getSheetId && ws.getSheetId() !== SHEET_ID_NOEUDS)) {
    return []
  }
  let range = wb.getActiveRange && wb.getActiveRange()
  if (!range) {
    const sel = ws.getSelection && ws.getSelection()
    range = sel && sel.getActiveRange && sel.getActiveRange()
  }
  if (!range) {
    return []
  }
  const start = range.getRow()
  const end = range.getLastRow ? range.getLastRow() : start
  const nodes: any[] = []
  for (let r = start; r <= end; r++) {
    if (r >= 1 && sankey.nodes_list[r - 1]) {
      nodes.push(sankey.nodes_list[r - 1])
    }
  }
  return nodes
}

/** Regroupe : 1er sélectionné = parent, les suivants = enfants. */
export const groupSelected = (app_data: Class_ApplicationData, univerAPI: any): boolean => {
  const nodes = getSelectedNodes(app_data, univerAPI)
  if (nodes.length < 2) {
    return false
  }
  const sankey = (app_data.drawing_area as any).sankey
  ensureDimGroup(sankey)
  const parent = nodes[0]
  const children = nodes.slice(1).filter((c) => c !== parent)
  if (!children.length) {
    return false
  }
  // Réutilise la dimension existante de ce parent dans le groupe, sinon en crée une.
  const dim = (sankey.dimensions_list || [])
    .find((d: any) => d.id === SPREADSHEET_DIM_ID && d.parent === parent)
  if (dim) {
    children.forEach((c) => dim.addNodeAsChild(c))
  } else {
    new Class_NodeDimension(parent, children, SPREADSHEET_DIM_ID)
  }
  return true
}

/** Détache : retire chaque nœud sélectionné de son parent (dans le groupe du tableur). */
export const detachSelected = (app_data: Class_ApplicationData, univerAPI: any): boolean => {
  const nodes = getSelectedNodes(app_data, univerAPI)
  if (!nodes.length) {
    return false
  }
  let changed = false
  nodes.forEach((node) => {
    (node.dimensions_as_child || [])
      .filter((d: any) => d.id === SPREADSHEET_DIM_ID)
      .forEach((dim: any) => {
        const parent = dim.parent
        const remaining = (dim.children || []).filter((c: any) => c !== node)
        dim.delete()
        if (remaining.length) {
          new Class_NodeDimension(parent, remaining, SPREADSHEET_DIM_ID)
        }
        changed = true
      })
  })
  return changed
}

/**
 * "Parser" : construit la hiérarchie d'agrégation à partir de la colonne 'Niveau d\'agrégation'
 * de l'onglet Noeuds (règle Excel : un nœud de niveau N a pour parent la ligne précédente la plus
 * proche de niveau N-1 ; les frères = même niveau sous le même parent). Idempotent : efface puis
 * recrée les dimensions du groupe géré par le tableur. Ne replie PAS (création seule).
 */
export const parseHierarchyFromLevels = (app_data: Class_ApplicationData, univerAPI: any): boolean => {
  const sankey = (app_data.drawing_area as any).sankey
  const wb = univerAPI && univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
  if (!wb) {
    return false
  }
  const ws = wb.getSheetBySheetId && wb.getSheetBySheetId(SHEET_ID_NOEUDS)
  if (!ws) {
    return false
  }

  // Idempotence : efface les dimensions du groupe, puis supprime+recrée le groupe de level-tags
  // (delete nettoie ses tags + les références des nœuds) pour repartir d'un état propre.
  ;(sankey.dimensions_list || [])
    .filter((d: any) => d.id === SPREADSHEET_DIM_ID)
    .forEach((d: any) => d.delete())
  const existingGrp = sankey.level_taggs_list.find((g: any) => g.id === SPREADSHEET_DIM_ID)
  if (existingGrp && typeof existingGrp.delete === 'function') {
    existingGrp.delete()
  }
  const group = sankey.addLevelTagGroup(SPREADSHEET_DIM_ID, 'Niveau d\'agrégation')

  const nodesArr = sankey.nodes_list
  const readLevel = (rowIdx0: number): number => {
    const cell = ws.getRange(rowIdx0 + 1, NOEUDS_COL.level).getValue()
    const n = cell == null ? NaN : Number(String(cell).replace(',', '.'))
    return isNaN(n) ? 1 : Math.round(n)
  }
  const lvls = nodesArr.map((_n: any, idx: number) => readLevel(idx))

  // Un level-tag par niveau présent, et chaque nœud assigné à son tag de niveau.
  const tagByLevel = new Map<number, any>()
  const ensureLevelTag = (lvl: number): any => {
    if (!tagByLevel.has(lvl)) {
      tagByLevel.set(lvl, group.addTag('Niveau ' + lvl, 'level_' + lvl))
    }
    return tagByLevel.get(lvl)
  }
  nodesArr.forEach((n: any, idx: number) => {
    const tag = ensureLevelTag(lvls[idx])
    if (tag && typeof n.addTag === 'function') {
      n.addTag(tag)
    }
  })

  // Hiérarchie : parent = ligne précédente la plus proche de niveau-1.
  const childrenByParentIdx = new Map<number, any[]>()
  for (let i = 0; i < nodesArr.length; i++) {
    const lvl = lvls[i]
    if (lvl <= 1) {
      continue
    }
    let parentIdx = -1
    for (let j = i - 1; j >= 0; j--) {
      if (lvls[j] === lvl - 1) { parentIdx = j; break }
    }
    if (parentIdx >= 0) {
      if (!childrenByParentIdx.has(parentIdx)) {
        childrenByParentIdx.set(parentIdx, [])
      }
      childrenByParentIdx.get(parentIdx)!.push(nodesArr[i])
    }
  }

  childrenByParentIdx.forEach((children, pIdx) => {
    new Class_NodeDimension(nodesArr[pIdx], children, SPREADSHEET_DIM_ID)
  })
  return true
}

/** Replie (n'affiche que le parent) les dimensions des nœuds sélectionnés. */
export const collapseSelected = (app_data: Class_ApplicationData, univerAPI: any): boolean => {
  const nodes = getSelectedNodes(app_data, univerAPI)
  let changed = false
  nodes.forEach((node) => {
    (node.dimensions_as_parent || [])
      .filter((d: any) => d.id === SPREADSHEET_DIM_ID)
      .forEach((dim: any) => {
        try {
          if (typeof dim.setForceToShowParent === 'function') {
            dim.setForceToShowParent()
            changed = true
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[UniverHierarchy] collapse ERREUR :', err)
        }
      })
  })
  return changed
}

/** Déplie (affiche les enfants) les dimensions des nœuds sélectionnés. */
export const expandSelected = (app_data: Class_ApplicationData, univerAPI: any): boolean => {
  const nodes = getSelectedNodes(app_data, univerAPI)
  let changed = false
  nodes.forEach((node) => {
    (node.dimensions_as_parent || [])
      .filter((d: any) => d.id === SPREADSHEET_DIM_ID)
      .forEach((dim: any) => {
        try {
          if (typeof dim.setForceToShowChildren === 'function') {
            dim.setForceToShowChildren()
            changed = true
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[UniverHierarchy] expand ERREUR :', err)
        }
      })
  })
  return changed
}

/** Recalcule la mise en page (sauf freeze), redessine, et rafraîchit le classeur (niveaux/dégradé). */
export const refreshAfterHierarchyChange = (app_data: Class_ApplicationData) => {
  const da = app_data.drawing_area as any
  try {
    // Relayout complet seulement en mode 'auto' (freeze legacy force 'none').
    const placement = app_data.menu_configuration.spreadsheet_placement_mode
    if (placement === 'auto' && !app_data.menu_configuration.spreadsheet_freeze) {
      // Mêmes paramètres que le bouton « disposition auto » (cf. UniverSankeyBridge.redraw).
      const default_dx = app_data.drawing_area.sankey.styles_dict['default'].shape_position_dx ?? 0
      const default_dy = app_data.drawing_area.sankey.styles_dict['default'].shape_position_dy ?? 0
      da.nodePositioning.computeAutoSankeyWithToast(
        false,
        app_data.layout_optimize_crossing,
        app_data.layout_h_spacing ?? default_dx,
        app_data.layout_v_spacing ?? default_dy,
        app_data.layout_sources_mode,
        app_data.layout_sinks_mode
      )
    }
    app_data.draw()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[UniverHierarchy] redraw ERREUR :', err)
  }
  // Rafraîchit le tableur (la colonne niveau + le dégradé reflètent la hiérarchie).
  const ref = app_data.menu_configuration.ref_to_spreadsheet
  if (ref && ref.current) {
    ref.current()
  }
}

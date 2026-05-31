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
import { SHEET_ID_FLUX, SHEET_ID_NOEUDS, NOEUDS_COL } from './UniverSankeyData'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const attachSankeyBridge = (
  univerAPI: any,
  app_data: Class_ApplicationData,
  isSyncing: { current: boolean }
): { dispose: () => void } => {
  const { drawing_area } = app_data
  const { sankey } = drawing_area
  const menu_configuration = app_data.menu_configuration

  const redraw = () => {
    if (!menu_configuration.spreadsheet_freeze) {
      drawing_area.nodePositioning.computeAutoSankeyWithToast(true, true)
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

  const nameToNode = (): { [name: string]: any } => {
    const m: { [name: string]: any } = {}
    sankey.nodes_list.forEach((n: any) => { m[n.name] = n })
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
      const link = sankey.links_list[idx]
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
      const node = sankey.nodes_list[idx]
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

    drawing_area.setToModeEdition(false)
    const hasAfm = app_data.has_sankey_afm
    // Comptes d'origine : addNewLink/addNewNode font de l'append -> les index existants restent valides.
    const originalLinkCount = sankey.links_list.length
    const originalNodeCount = sankey.nodes_list.length

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
      }
    })

    if (structural) {
      redraw()
    } else if (value) {
      drawing_area.updateScaleAtLinkValueSetting()
      app_data.draw()
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
    const wb = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
    const sheetId = p.subUnitId || (wb && wb.getActiveSheet && wb.getActiveSheet().getSheetId())
    let structural = false

    if (sheetId === SHEET_ID_NOEUDS) {
      const toDelete: any[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        const node = r >= 1 ? sankey.nodes_list[r - 1] : null
        if (node) {
          toDelete.push(node)
        }
      }
      toDelete.forEach((n) => { drawing_area.deleteNode(n); structural = true })
    } else if (sheetId === SHEET_ID_FLUX) {
      const toDelete: any[] = []
      for (let r = range.startRow; r <= range.endRow; r++) {
        const link = r >= 1 ? sankey.links_list[r - 1] : null
        if (link) {
          toDelete.push(link)
        }
      }
      toDelete.forEach((l) => { drawing_area.deleteLink(l); structural = true })
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

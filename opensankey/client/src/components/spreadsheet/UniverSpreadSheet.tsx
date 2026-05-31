// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Composant tableur basé sur Univer (remplace l'ancien @silevis/reactgrid).
// Classeur à onglets calqués sur le format Excel de SankeyExcelParser (Flux + Noeuds).
// Monté dans la grande zone (onglet "Tableur" de MainZoneTabs).
//
// Cycle de vie : UNE instance Univer vit uniquement pendant que l'onglet Tableur est actif.
// Créée à l'activation (conteneur visible -> taille correcte, synchro depuis le Sankey courant),
// détruite à la désactivation/démontage. Évite : conteneur hauteur 0, units fantômes après
// dispose/recreate, instance disposée par HMR pendant que le canvas reçoit des events.
// ==================================================================================================

// External imports
import React, { useEffect, useRef } from 'react'
import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import sheetsCoreFrFR from '@univerjs/presets/preset-sheets-core/locales/fr-FR'
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { buildSankeyWorkbookData } from './UniverSankeyData'
import { attachSankeyBridge } from './UniverSankeyBridge'
import { parseHierarchyFromLevels, refreshAfterHierarchyChange } from './UniverHierarchyOps'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const UniverSpreadSheet = (
  { app_data, active }: { app_data: Class_ApplicationData, active: boolean }
) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  useEffect(() => {
    if (!active) {
      return
    }
    const container = containerRef.current
    if (!container) {
      return
    }

    let disposed = false
    const isSyncing = { current: false }

    const { univer, univerAPI } = createUniver({
      locale: LocaleType.FR_FR,
      locales: { [LocaleType.FR_FR]: merge({}, sheetsCoreFrFR) },
      theme: defaultTheme,
      presets: [
        // toolbar:false -> masque le ruban Univer (Démarrer/Formules/Données).
        UniverSheetsCorePreset({ container, toolbar: false })
      ]
    })

    // Construit le classeur (Flux + Noeuds) depuis le Sankey courant.
    isSyncing.current = true
    try {
      univerAPI.createWorkbook(buildSankeyWorkbookData(app_data))
    } finally {
      isSyncing.current = false
    }

    apiRef.current = univerAPI

    // Write-back édition -> Sankey.
    const bridge = attachSankeyBridge(univerAPI, app_data, isSyncing)

    // Resynchro externe (ex : après import / réconciliation MFA) tant que le tableur est ouvert.
    app_data.menu_configuration.ref_to_spreadsheet.current = () => {
      if (disposed) {
        return
      }
      isSyncing.current = true
      try {
        const existing = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
        // Préserve la feuille active (sinon le rebuild réactive Flux, 1re du sheetOrder).
        let activeSheetId: string | null = null
        if (existing) {
          const as = existing.getActiveSheet && existing.getActiveSheet()
          activeSheetId = as && as.getSheetId ? as.getSheetId() : null
          if (univerAPI.disposeUnit) {
            univerAPI.disposeUnit(existing.getId())
          }
        }
        const wb: any = univerAPI.createWorkbook(buildSankeyWorkbookData(app_data))
        if (activeSheetId && wb && typeof wb.setActiveSheet === 'function') {
          try { wb.setActiveSheet(activeSheetId) } catch (e) { /* feuille absente : on ignore */ }
        }
      } finally {
        isSyncing.current = false
      }
    }

    return () => {
      disposed = true
      apiRef.current = null
      bridge.dispose()
      univer.dispose()
    }
  }, [active])

  // Boutons de hiérarchie (onglet Noeuds) : opèrent sur la sélection courante du tableur.
  const runOp = (op: (a: Class_ApplicationData, api: any) => boolean) => () => {
    if (op(app_data, apiRef.current)) {
      refreshAfterHierarchyChange(app_data)
    }
  }

  const hBtn: React.CSSProperties = {
    border: '1px solid #cbd5e0', background: 'white', color: '#2d3748',
    fontSize: 12, padding: '2px 8px', borderRadius: 4, cursor: 'pointer'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        padding: '4px 6px', borderBottom: '1px solid #e2e8f0', background: '#f7fafc'
      }}>
        <button style={hBtn}
          title="Construit la hiérarchie d'agrégation depuis la colonne Niveau d'agrégation"
          onClick={runOp(parseHierarchyFromLevels)}>Parser</button>
        <span style={{ fontSize: 11, color: '#718096' }}>
          construit la hiérarchie depuis la colonne « Niveau d&apos;agrégation »
        </span>
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  )
}

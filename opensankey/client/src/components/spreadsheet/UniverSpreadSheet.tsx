// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Composant tableur basé sur Univer (remplace l'ancien @silevis/reactgrid).
// Classeur à onglets calqués sur le format Excel de SankeyExcelParser (Flux/Noeuds/Données/Etiquettes).
// Monté dans la grande zone (onglet "Tableur" de MainZoneTabs).
//
// Cycle de vie : UNE instance Univer vit uniquement pendant que l'onglet Tableur est actif.
// Univer (@univerjs/presets) est chargé en DYNAMIC IMPORT (chunk séparé, hors bundle initial).
// ==================================================================================================

// External imports
import React, { useEffect, useRef, useState } from 'react'
import {
  Button, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverBody,
  Portal, Input, Checkbox, Divider, VStack, Text
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

import { Class_ApplicationData } from '../../types/ApplicationData'
import {
  buildSankeyWorkbookData, Type_SheetColumns, Type_ColMeta, SHEET_ID_NOEUDS
} from './UniverSankeyData'
import { attachSankeyBridge } from './UniverSankeyBridge'
import { parseHierarchyFromLevels, refreshAfterHierarchyChange } from './UniverHierarchyOps'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Sélecteur de colonnes optionnelles, style filtre Excel (Popover + recherche + "Tout sélectionner"
 * tri-state + cases). Application immédiate de chaque toggle.
 */
const ColumnSelector = (
  { columns, hiddenSet, onSet }:
  { columns: Type_ColMeta[], hiddenSet: Set<number>, onSet: (col: number, hidden: boolean) => void }
) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const lc = search.trim().toLowerCase()
  const rows = columns.filter((c) => !lc || c.label.toLowerCase().includes(lc))
  const checkedCount = rows.filter((c) => !hiddenSet.has(c.index)).length
  const allChecked = rows.length > 0 && checkedCount === rows.length
  const noneChecked = checkedCount === 0

  const toggleAll = (next: boolean) => {
    rows.forEach((c) => {
      const visible = !hiddenSet.has(c.index)
      if (visible !== next) {
        onSet(c.index, !next)
      }
    })
  }

  const triggerLabel = columns.length === 0
    ? 'Colonnes'
    : `Colonnes (${columns.length - hiddenSet.size}/${columns.length})`

  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement='bottom-start' isLazy>
      <PopoverTrigger>
        <Button
          size='xs'
          variant='outline'
          rightIcon={<ChevronDownIcon />}
          onClick={() => { setSearch(''); setIsOpen(true) }}
          isDisabled={columns.length === 0}
          fontWeight='normal'
          width='auto'
          maxW='190px'
          flexShrink={0}
        >
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent minW='280px' maxW='420px' zIndex='popover'>
          <PopoverArrow />
          <PopoverBody p='6px'>
            <Input
              size='xs'
              placeholder='Rechercher'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              mb='6px'
            />
            <Checkbox
              size='sm'
              isChecked={allChecked}
              isIndeterminate={!allChecked && !noneChecked}
              onChange={(e) => toggleAll(e.target.checked)}
            >
              <Text fontSize='xs' fontStyle='italic'>(Tout sélectionner)</Text>
            </Checkbox>
            <Divider my='4px' />
            <VStack align='stretch' spacing='2px' maxH='240px' overflowY='auto'>
              {rows.map((c) => (
                <Checkbox
                  key={c.index}
                  size='sm'
                  isChecked={!hiddenSet.has(c.index)}
                  onChange={(e) => onSet(c.index, !e.target.checked)}
                >
                  <Text fontSize='xs'>{c.label}</Text>
                </Checkbox>
              ))}
              {rows.length === 0 && (
                <Text fontSize='xs' color='gray.500' fontStyle='italic'>—</Text>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}

export const UniverSpreadSheet = (
  { app_data, active }: { app_data: Class_ApplicationData, active: boolean }
) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  // Métadonnées de colonnes (par onglet) du dernier build, pour le sélecteur "Colonnes".
  const columnsRef = useRef<Type_SheetColumns>({})

  const [activeSheetId, setActiveSheetId] = useState<string>('')
  // Colonnes masquées par onglet (indices).
  const [hiddenCols, setHiddenCols] = useState<{ [sheetId: string]: number[] }>({})
  // "Visibles uniquement" : ne lister que les éléments visibles (exclut repliés/agrégés).
  const onlyVisibleRef = useRef(false)
  const [onlyVisible, setOnlyVisible] = useState(false)

  // Masque/affiche une colonne d'un onglet dans Univer.
  const setColHidden = (sheetId: string, col: number, hidden: boolean) => {
    const api = apiRef.current
    const wb = api && api.getActiveWorkbook && api.getActiveWorkbook()
    const ws = wb && wb.getSheetBySheetId ? wb.getSheetBySheetId(sheetId) : null
    if (!ws) {
      return
    }
    if (hidden) {
      ws.hideColumns(col, 1)
    } else {
      ws.showColumns(col, 1)
    }
  }

  // Fige la ligne d'en-tête (row 0) d'un onglet pour qu'elle reste visible au scroll.
  const freezeHeaderRow = (sheetId: string) => {
    const api = apiRef.current
    const wb = api && api.getActiveWorkbook && api.getActiveWorkbook()
    const ws = wb && wb.getSheetBySheetId ? wb.getSheetBySheetId(sheetId) : null
    if (ws && typeof ws.setFrozenRows === 'function') {
      try { ws.setFrozenRows(1) } catch (e) { /* ignore */ }
    }
  }

  useEffect(() => {
    if (!active) {
      return
    }
    const container = containerRef.current
    if (!container) {
      return
    }

    let disposed = false
    let univerInstance: { dispose: () => void } | null = null
    let bridgeInstance: { dispose: () => void } | null = null
    let activeSheetDisposable: { dispose: () => void } | null = null
    const isSyncing = { current: false }

    const init = async () => {
      const [presets, sheetsCore, localeMod] = await Promise.all([
        import('@univerjs/presets'),
        import('@univerjs/presets/preset-sheets-core'),
        import('@univerjs/presets/preset-sheets-core/locales/fr-FR')
      ])
      await import('@univerjs/presets/lib/styles/preset-sheets-core.css')
      const liveContainer = containerRef.current
      if (disposed || !liveContainer) {
        return
      }
      const { createUniver, defaultTheme, LocaleType, merge } = presets
      const { UniverSheetsCorePreset } = sheetsCore
      const sheetsCoreFrFR = localeMod.default

      const { univer, univerAPI } = createUniver({
        locale: LocaleType.FR_FR,
        locales: { [LocaleType.FR_FR]: merge({}, sheetsCoreFrFR) },
        theme: defaultTheme,
        presets: [
          UniverSheetsCorePreset({ container: liveContainer, toolbar: false })
        ]
      })
      univerInstance = univer
      apiRef.current = univerAPI

      // (Re)construit le classeur + applique la visibilité initiale (optionnelles vides masquées).
      const buildAndApply = () => {
        isSyncing.current = true
        try {
          let keepActive: string | null = null
          const existing = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
          if (existing) {
            const as = existing.getActiveSheet && existing.getActiveSheet()
            keepActive = as && as.getSheetId ? as.getSheetId() : null
            if (univerAPI.disposeUnit) {
              univerAPI.disposeUnit(existing.getId())
            }
          }
          const built = buildSankeyWorkbookData(app_data, onlyVisibleRef.current)
          columnsRef.current = built.columns
          const wb: any = univerAPI.createWorkbook(built.data)
          if (keepActive && wb && typeof wb.setActiveSheet === 'function') {
            try { wb.setActiveSheet(keepActive) } catch (e) { /* feuille absente */ }
          }
          const hidden: { [sheetId: string]: number[] } = {}
          Object.keys(built.columns).forEach((sheetId) => {
            hidden[sheetId] = []
            built.columns[sheetId].forEach((c) => {
              if (!c.mandatory && !c.hasData) {
                setColHidden(sheetId, c.index, true)
                hidden[sheetId].push(c.index)
              }
            })
            // Fige la ligne d'en-tête de chaque onglet.
            freezeHeaderRow(sheetId)
          })
          setHiddenCols(hidden)
          const wbA = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
          const asNow = wbA && wbA.getActiveSheet && wbA.getActiveSheet()
          if (asNow && asNow.getSheetId) {
            setActiveSheetId(asNow.getSheetId())
          }
        } finally {
          isSyncing.current = false
        }
      }

      buildAndApply()
      bridgeInstance = attachSankeyBridge(univerAPI, app_data, isSyncing)
      app_data.menu_configuration.ref_to_spreadsheet.current = () => {
        if (!disposed) {
          buildAndApply()
        }
      }

      // Onglet actif (pour les contrôles contextuels : Parser, sélecteur de colonnes).
      activeSheetDisposable = univerAPI.addEvent(univerAPI.Event.ActiveSheetChanged, () => {
        const wb = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
        const as = wb && wb.getActiveSheet && wb.getActiveSheet()
        if (as && as.getSheetId) {
          setActiveSheetId(as.getSheetId())
        }
      })
    }
    init()

    return () => {
      disposed = true
      apiRef.current = null
      if (activeSheetDisposable && typeof activeSheetDisposable.dispose === 'function') {
        activeSheetDisposable.dispose()
      }
      if (bridgeInstance) {
        bridgeInstance.dispose()
      }
      if (univerInstance) {
        univerInstance.dispose()
      }
    }
  }, [active])

  // Bouton hiérarchie (onglet Noeuds) : opère sur la sélection courante.
  const runOp = (op: (a: Class_ApplicationData, api: any) => boolean) => () => {
    if (op(app_data, apiRef.current)) {
      refreshAfterHierarchyChange(app_data)
    }
  }

  // Visibilité d'une colonne (Univer + état local), par onglet actif.
  const handleColSet = (col: number, hidden: boolean) => {
    setColHidden(activeSheetId, col, hidden)
    setHiddenCols((prev) => {
      const cur = new Set(prev[activeSheetId] || [])
      if (hidden) {
        cur.add(col)
      } else {
        cur.delete(col)
      }
      return { ...prev, [activeSheetId]: Array.from(cur) }
    })
  }

  // Bascule "Visibles uniquement" : met à jour le ref + reconstruit le classeur.
  const toggleOnlyVisible = (v: boolean) => {
    onlyVisibleRef.current = v
    setOnlyVisible(v)
    const ref = app_data.menu_configuration.ref_to_spreadsheet
    if (ref && ref.current) {
      ref.current()
    }
  }

  const optionalCols = (columnsRef.current[activeSheetId] || []).filter((c) => !c.mandatory)
  const hiddenSet = new Set(hiddenCols[activeSheetId] || [])
  const isNoeuds = activeSheetId === SHEET_ID_NOEUDS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        padding: '4px 6px', borderBottom: '1px solid #e2e8f0', background: '#f7fafc'
      }}>
        {/* Parser : contextuel à l'onglet Noeuds (construit la hiérarchie depuis la colonne niveau). */}
        {isNoeuds && (
          <Button
            size='xs'
            colorScheme='blue'
            width='auto'
            maxW='110px'
            flexShrink={0}
            title="Construit la hiérarchie d'agrégation depuis la colonne Niveau d'agrégation"
            onClick={runOp(parseHierarchyFromLevels)}
          >
            Parser
          </Button>
        )}

        <ColumnSelector columns={optionalCols} hiddenSet={hiddenSet} onSet={handleColSet} />

        <Checkbox
          size='sm'
          isChecked={onlyVisible}
          onChange={(e) => toggleOnlyVisible(e.target.checked)}
          flexShrink={0}
        >
          <Text fontSize='xs'>Visibles uniquement</Text>
        </Checkbox>

        <span style={{ fontSize: 11, color: '#718096' }}>
          colonnes optionnelles (vides masquées par défaut){isNoeuds ? ' · Parser → hiérarchie' : ''}
        </span>
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  )
}

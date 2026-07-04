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
import { useTranslation } from 'react-i18next'
import {
  Button, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverBody,
  Portal, Input, Checkbox, Divider, VStack, Text, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

import { Class_ApplicationData } from '../../types/ApplicationData'
import {
  buildSankeyWorkbookData, Type_SheetColumns, Type_ColMeta, Type_SheetMeta, SHEET_ID_NOEUDS,
  allNodesTyped,
  SHEET_ID_FLUX, SHEET_ID_RATIO, SHEET_ID_RATIO_STOCK, SHEET_ID_STOCK_CHAINING,
  SHEET_ID_TES, SHEET_ID_TER
} from './UniverSankeyData'
import { attachSankeyBridge } from './UniverSankeyBridge'
import { parseHierarchyFromLevels, refreshAfterHierarchyChange } from './UniverHierarchyOps'
import { AddConstraintModal } from './AddConstraintModal'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Type i18next minimal (clé -> libellé) pour typer les builders d'options ci-dessous.
type Type_TFn = (key: string) => string

// Filtres d'affichage du tableur. Pour l'instant deux modes ; la liste est destinée à s'enrichir
// (ex. masquer les flux à zéro, n'afficher qu'un tag…) sans toucher au reste de la barre d'outils.
// 'visible' = seulement les éléments visibles (exclut repliés/agrégés) → onlyVisible.
const displayFilters = (t: Type_TFn): { id: 'all' | 'visible', label: string }[] => [
  { id: 'all', label: t('Spreadsheet.toolbar.show_all') },
  { id: 'visible', label: t('Spreadsheet.toolbar.only_visible') }
]

// Modes de placement des nœuds créés depuis le tableur (cf. MenuConfig.spreadsheet_placement_mode).
const placementModes = (t: Type_TFn): { id: 'auto' | 'none' | 'increment', label: string }[] => [
  { id: 'auto', label: t('Spreadsheet.toolbar.placement_auto') },
  { id: 'none', label: t('Spreadsheet.toolbar.placement_none') },
  { id: 'increment', label: t('Spreadsheet.toolbar.placement_increment') }
]

// Mode d'affichage des matrices TES/TER (cf. MenuConfig.spreadsheet_matrix_mode).
const matrixModes = (t: Type_TFn): { id: 'cross' | 'value', label: string }[] => [
  { id: 'cross', label: t('Spreadsheet.toolbar.matrix_cross') },
  { id: 'value', label: t('Spreadsheet.toolbar.matrix_value') }
]

/**
 * Sélecteur mono-choix compact, calqué sur le style des boutons « Onglets »/« Colonnes »
 * (Button outline xs + chevron). Affiche le libellé de l'option courante ; les options sont
 * dans un menu déroulant.
 */
const SingleSelectMenu = <T extends string>(
  { value, options, onChange, maxW, title }:
  {
    value: T, options: { id: T, label: string }[], onChange: (v: T) => void,
    maxW?: string, title?: string
  }
) => {
  const current = options.find((o) => o.id === value)
  return (
    <Menu isLazy placement='bottom-start'>
      <MenuButton
        as={Button}
        size='xs'
        variant='outline'
        rightIcon={<ChevronDownIcon />}
        fontWeight='normal'
        width='auto'
        maxW={maxW ?? '170px'}
        flexShrink={0}
        title={title}
      >
        {current ? current.label : ''}
      </MenuButton>
      <Portal>
        <MenuList minW='auto' zIndex='popover'>
          {options.map((o) => (
            <MenuItem
              key={o.id}
              fontSize='xs'
              fontWeight={o.id === value ? 'bold' : 'normal'}
              onClick={() => onChange(o.id)}
            >
              {o.label}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  )
}

/**
 * Sélecteur de colonnes optionnelles, style filtre Excel (Popover + recherche + "Tout sélectionner"
 * tri-state + cases). Application immédiate de chaque toggle.
 */
const ColumnSelector = (
  { columns, hiddenSet, onSet }:
  { columns: Type_ColMeta[], hiddenSet: Set<number>, onSet: (col: number, hidden: boolean) => void }
) => {
  const { t } = useTranslation()
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
    ? t('Spreadsheet.toolbar.columns')
    : t('Spreadsheet.toolbar.columns_count', { shown: columns.length - hiddenSet.size, total: columns.length })

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
              placeholder={t('Spreadsheet.toolbar.search')}
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
              <Text fontSize='xs' fontStyle='italic'>{t('Spreadsheet.toolbar.select_all')}</Text>
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

/**
 * Sélecteur d'onglets à afficher, même UX que le sélecteur de colonnes (Popover + recherche +
 * "Tout sélectionner" tri-state + cases). Les onglets vides sont masqués par défaut au build ;
 * ce sélecteur permet de les ré-afficher (ou de masquer ceux qu'on ne veut pas voir).
 */
const SheetSelector = (
  { sheets, hiddenSet, onSet }:
  { sheets: Type_SheetMeta[], hiddenSet: Set<string>, onSet: (sheetId: string, hidden: boolean) => void }
) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const lc = search.trim().toLowerCase()
  const rows = sheets.filter((s) => !lc || s.name.toLowerCase().includes(lc))
  const checkedCount = rows.filter((s) => !hiddenSet.has(s.id)).length
  const allChecked = rows.length > 0 && checkedCount === rows.length
  const noneChecked = checkedCount === 0

  const toggleAll = (next: boolean) => {
    rows.forEach((s) => {
      const visible = !hiddenSet.has(s.id)
      if (visible !== next) {
        onSet(s.id, !next)
      }
    })
  }

  const triggerLabel = sheets.length === 0
    ? t('Spreadsheet.toolbar.sheets')
    : t('Spreadsheet.toolbar.sheets_count', { shown: sheets.length - hiddenSet.size, total: sheets.length })

  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement='bottom-start' isLazy>
      <PopoverTrigger>
        <Button
          size='xs'
          variant='outline'
          rightIcon={<ChevronDownIcon />}
          onClick={() => { setSearch(''); setIsOpen(true) }}
          isDisabled={sheets.length === 0}
          fontWeight='normal'
          width='auto'
          maxW='190px'
          flexShrink={0}
        >
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent minW='240px' maxW='360px' zIndex='popover'>
          <PopoverArrow />
          <PopoverBody p='6px'>
            <Input
              size='xs'
              placeholder={t('Spreadsheet.toolbar.search')}
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
              <Text fontSize='xs' fontStyle='italic'>{t('Spreadsheet.toolbar.select_all')}</Text>
            </Checkbox>
            <Divider my='4px' />
            <VStack align='stretch' spacing='2px' maxH='240px' overflowY='auto'>
              {rows.map((s) => (
                <Checkbox
                  key={s.id}
                  size='sm'
                  isChecked={!hiddenSet.has(s.id)}
                  onChange={(e) => onSet(s.id, !e.target.checked)}
                >
                  <Text fontSize='xs'>{s.name}</Text>
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

// Mapping langue applicative (i18next) -> type d'enum LocaleType Univer. Univer fournit en-US/fr-FR/
// es-ES/de-DE/it-IT (cf. @univerjs/presets/.../locales). Repli en-US.
const UNIVER_LOCALE_TYPE: { [lang: string]: string } = {
  fr: 'FR_FR', en: 'EN_US', es: 'ES_ES', de: 'DE_DE', it: 'IT_IT'
}

// Charge les 4 fichiers de locale Univer (core/filter/sort/data-validation) pour la langue donnée.
// Imports STATIQUES par langue (et non un import dynamique à chemin variable) : le champ `exports`
// du paquet @univerjs/presets n'expose les locales que via le wildcard `./preset-sheets-core/*`, que
// webpack résout par littéral mais PAS en contexte dynamique -> on énumère les langues explicitement.
const loadUniverLocales = (lang: string): Promise<any[]> => {
  switch (lang) {
  case 'fr': return Promise.all([
    import('@univerjs/presets/preset-sheets-core/locales/fr-FR'),
    import('@univerjs/presets/preset-sheets-filter/locales/fr-FR'),
    import('@univerjs/presets/preset-sheets-sort/locales/fr-FR'),
    import('@univerjs/presets/preset-sheets-data-validation/locales/fr-FR')
  ])
  case 'es': return Promise.all([
    import('@univerjs/presets/preset-sheets-core/locales/es-ES'),
    import('@univerjs/presets/preset-sheets-filter/locales/es-ES'),
    import('@univerjs/presets/preset-sheets-sort/locales/es-ES'),
    import('@univerjs/presets/preset-sheets-data-validation/locales/es-ES')
  ])
  case 'de': return Promise.all([
    import('@univerjs/presets/preset-sheets-core/locales/de-DE'),
    import('@univerjs/presets/preset-sheets-filter/locales/de-DE'),
    import('@univerjs/presets/preset-sheets-sort/locales/de-DE'),
    import('@univerjs/presets/preset-sheets-data-validation/locales/de-DE')
  ])
  case 'it': return Promise.all([
    import('@univerjs/presets/preset-sheets-core/locales/it-IT'),
    import('@univerjs/presets/preset-sheets-filter/locales/it-IT'),
    import('@univerjs/presets/preset-sheets-sort/locales/it-IT'),
    import('@univerjs/presets/preset-sheets-data-validation/locales/it-IT')
  ])
  default: return Promise.all([
    import('@univerjs/presets/preset-sheets-core/locales/en-US'),
    import('@univerjs/presets/preset-sheets-filter/locales/en-US'),
    import('@univerjs/presets/preset-sheets-sort/locales/en-US'),
    import('@univerjs/presets/preset-sheets-data-validation/locales/en-US')
  ])
  }
}

export const UniverSpreadSheet = (
  { app_data, active }: { app_data: Class_ApplicationData, active: boolean }
) => {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').slice(0, 2)
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  // Métadonnées de colonnes (par onglet) du dernier build, pour le sélecteur "Colonnes".
  const columnsRef = useRef<Type_SheetColumns>({})
  // Instance Sankey pour laquelle on a construit le dernier classeur. reset()/nouveau diagramme/
  // changement de vue/chargement JSON remplacent app_data.drawing_area.sankey par une NOUVELLE
  // instance : dans ce cas on ne conserve PAS l'onglet actif du classeur précédent (keepActive),
  // sinon le tableur « se souvient » de l'onglet du diagramme précédent.
  const builtForSankeyRef = useRef<any>(null)

  const [activeSheetId, setActiveSheetId] = useState<string>('')
  // Colonnes masquées par onglet (indices).
  const [hiddenCols, setHiddenCols] = useState<{ [sheetId: string]: number[] }>({})
  // Choix EXPLICITES de visibilité de colonne par l'utilisateur (sélecteur « Colonnes »), par onglet :
  // { [sheetId]: { [col]: hidden } }. Persistés à travers les rebuilds (déclenchés à chaque édition de
  // la zone de dessin) pour que buildAndApply ne réécrase pas les choix par les règles par défaut.
  const userColOverridesRef = useRef<{ [sheetId: string]: { [col: number]: boolean } }>({})
  // Idem pour la visibilité des onglets (sélecteur « Onglets ») : { [sheetId]: hidden }.
  const userSheetOverridesRef = useRef<{ [sheetId: string]: boolean }>({})
  // Onglets du dernier build (ordre d'affichage) + onglets masqués (ids), pour le sélecteur "Onglets".
  const [sheetsMeta, setSheetsMeta] = useState<Type_SheetMeta[]>([])
  const [hiddenSheets, setHiddenSheets] = useState<string[]>([])
  // "Visibles uniquement" : ne lister que les éléments visibles (exclut repliés/agrégés).
  const onlyVisibleRef = useRef(false)
  const [onlyVisible, setOnlyVisible] = useState(false)
  // Mode filtre (autofilter Excel) actif sur l'onglet courant.
  const [filterOn, setFilterOn] = useState(false)
  // Mode de placement des nœuds créés depuis le tableur (miroir de menu_configuration).
  const [placementMode, setPlacementMode] = useState<'auto' | 'none' | 'increment'>(
    app_data.menu_configuration.spreadsheet_placement_mode
  )
  // Mode d'affichage des matrices TES/TER (miroir de menu_configuration).
  const [matrixMode, setMatrixMode] = useState<'cross' | 'value'>(
    app_data.menu_configuration.spreadsheet_matrix_mode
  )
  // Modale « Ajouter une contrainte » (onglets Ratio flux / Ratio stock flux / Chaînage stock).
  const [isAddConstraintOpen, setIsAddConstraintOpen] = useState(false)

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

  // Masque/affiche un onglet entier dans Univer. (Univer interdit de masquer la feuille active ->
  // l'appelant doit basculer l'onglet actif avant.)
  const setSheetHidden = (sheetId: string, hidden: boolean) => {
    const api = apiRef.current
    const wb = api && api.getActiveWorkbook && api.getActiveWorkbook()
    const ws = wb && wb.getSheetBySheetId ? wb.getSheetBySheetId(sheetId) : null
    if (!ws) {
      return
    }
    try {
      if (hidden && typeof ws.hideSheet === 'function') {
        ws.hideSheet()
      } else if (!hidden && typeof ws.showSheet === 'function') {
        ws.showSheet()
      }
    } catch (e) { /* ignore (ex: tentative de masquer la feuille active) */ }
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

  // Worksheet active (helper).
  const getActiveWs = () => {
    const api = apiRef.current
    const wb = api && api.getActiveWorkbook && api.getActiveWorkbook()
    return (wb && wb.getActiveSheet) ? wb.getActiveSheet() : null
  }

  // Active/désactive l'autofilter Excel (flèche par colonne) sur l'onglet courant.
  const toggleFilter = (on: boolean) => {
    const ws = getActiveWs()
    if (!ws) {
      return
    }
    try {
      const existing = typeof ws.getFilter === 'function' ? ws.getFilter() : null
      if (on) {
        if (!existing && typeof ws.getDataRange === 'function') {
          const range = ws.getDataRange()
          if (range && typeof range.createFilter === 'function') {
            range.createFilter()
          }
        }
      } else if (existing && typeof existing.remove === 'function') {
        existing.remove()
      }
    } catch (e) { /* ignore */ }
    setFilterOn(on)
  }

  // Reflète l'état de filtre de l'onglet courant (au changement d'onglet).
  const syncFilterState = () => {
    const ws = getActiveWs()
    let has = false
    try { has = !!(ws && typeof ws.getFilter === 'function' && ws.getFilter()) } catch (e) { /* ignore */ }
    setFilterOn(has)
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
    let resizeObserver: ResizeObserver | null = null
    const isSyncing = { current: false }

    const init = async () => {
      // Locale Univer suivant la langue applicative (repli en-US). Les presets et leurs 4 fichiers de
      // locale sont chargés en chunks séparés (cf. loadUniverLocales).
      const [
        presets, sheetsCore, sheetsFilter, sheetsSort, sheetsDataValidation
      ] = await Promise.all([
        import('@univerjs/presets'),
        import('@univerjs/presets/preset-sheets-core'),
        import('@univerjs/presets/preset-sheets-filter'),
        import('@univerjs/presets/preset-sheets-sort'),
        import('@univerjs/presets/preset-sheets-data-validation')
      ])
      const [localeMod, filterLocaleMod, sortLocaleMod, dataValidationLocaleMod] =
        await loadUniverLocales(lang)
      await Promise.all([
        import('@univerjs/presets/lib/styles/preset-sheets-core.css'),
        import('@univerjs/presets/lib/styles/preset-sheets-filter.css'),
        import('@univerjs/presets/lib/styles/preset-sheets-sort.css'),
        import('@univerjs/presets/lib/styles/preset-sheets-data-validation.css')
      ])
      const liveContainer = containerRef.current
      if (disposed || !liveContainer) {
        return
      }
      const { createUniver, defaultTheme, LocaleType, merge } = presets
      const { UniverSheetsCorePreset } = sheetsCore
      const { UniverSheetsFilterPreset } = sheetsFilter
      const { UniverSheetsSortPreset } = sheetsSort
      const { UniverSheetsDataValidationPreset } = sheetsDataValidation
      const sheetsCoreLocale = localeMod.default

      const univerLocale = LocaleType[(UNIVER_LOCALE_TYPE[lang] || 'EN_US') as keyof typeof LocaleType] ||
        LocaleType.EN_US
      const { univer, univerAPI } = createUniver({
        locale: univerLocale,
        locales: {
          [univerLocale]: merge(
            {}, sheetsCoreLocale, filterLocaleMod.default, sortLocaleMod.default,
            dataValidationLocaleMod.default
          )
        },
        theme: defaultTheme,
        presets: [
          // footer.statisticBar: false -> retire les stats du pied (Max/Min/Somme…) qui, en vue
          // étroite, recouvrent les onglets de feuilles. (statusBarStatistic est déprécié ET non
          // forwardé par le preset ; seul `footer` l'est.) On garde sheetBar/zoom/menus.
          UniverSheetsCorePreset({
            container: liveContainer,
            toolbar: false,
            // formulaBar: false -> retire la barre de formule (nom de cellule + fx + contenu) en
            // haut de la grille : inutile ici (pas de saisie de formules, juste de la donnée tabulaire).
            formulaBar: false,
            // addSheetButtonConfig.show: false -> masque le bouton « + » d'ajout d'onglet (créer une
            // feuille arbitraire n'a pas de sens ici ; onglets gérés via le sélecteur « Onglets »).
            // NE PAS le masquer en CSS : le « + » et les flèches de navigation entre onglets partagent
            // le même composant Univer (data-u-comp="sheet-bar-append-button") -> un display:none CSS
            // masquerait AUSSI les flèches de scroll des onglets.
            footer: { statisticBar: false, addSheetButtonConfig: { show: false } }
          }),
          // Filtre (autofilter Excel : flèche par colonne, tri, recherche, valeurs) + tri par colonne.
          UniverSheetsFilterPreset(),
          UniverSheetsSortPreset(),
          // Validation de données : listes déroulantes (sélecteur d'étiquette dans les colonnes de
          // tags des feuilles de nœuds).
          UniverSheetsDataValidationPreset()
        ]
      })
      univerInstance = univer
      apiRef.current = univerAPI

      // Univer ne se re-mesure pas seul quand la zone change de largeur (ouverture/fermeture du
      // diagramme, déplacement du séparateur) -> canvas plus étroit que le conteneur = espace vide à
      // droite + scrollbar mal placée. On observe le conteneur et on déclenche un `resize` (écouté
      // par le moteur de rendu Univer) pour qu'il remplisse toute la largeur.
      if (typeof ResizeObserver !== 'undefined') {
        let raf = 0
        resizeObserver = new ResizeObserver(() => {
          if (raf) {
            cancelAnimationFrame(raf)
          }
          raf = requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')) })
        })
        resizeObserver.observe(liveContainer)
      }

      // (Re)construit le classeur + applique la visibilité initiale (optionnelles vides masquées).
      const buildAndApply = () => {
        isSyncing.current = true
        try {
          // Source de vérité de l'état d'affichage = sankey.spreadsheet_state (persisté par
          // diagramme, cf. SankeyPersistence). On y branche DIRECTEMENT les refs d'overrides :
          // toute modif via les sélecteurs « Onglets »/« Colonnes » écrit alors dans le modèle,
          // donc sauvegardée au JSON. Lecture LIVE (reset()/changement de vue remplacent
          // app_data.drawing_area.sankey par une nouvelle instance).
          const sankeyState = app_data.drawing_area.sankey.spreadsheet_state
          if (!sankeyState.col_overrides) sankeyState.col_overrides = {}
          if (!sankeyState.sheet_overrides) sankeyState.sheet_overrides = {}
          userColOverridesRef.current = sankeyState.col_overrides
          userSheetOverridesRef.current = sankeyState.sheet_overrides
          // Si la sankey courante a été remplacée depuis le dernier build (nouveau diagramme,
          // reset, changement de vue, chargement JSON), on ne reporte pas l'onglet actif du
          // classeur précédent : on repart de l'état persisté du nouveau diagramme (Flux par défaut).
          const sankeyChanged = builtForSankeyRef.current !== app_data.drawing_area.sankey
          builtForSankeyRef.current = app_data.drawing_area.sankey
          let keepActive: string | null = null
          const existing = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
          if (existing) {
            if (!sankeyChanged) {
              const as = existing.getActiveSheet && existing.getActiveSheet()
              keepActive = as && as.getSheetId ? as.getSheetId() : null
            }
            if (univerAPI.disposeUnit) {
              univerAPI.disposeUnit(existing.getId())
            }
          }
          const built = buildSankeyWorkbookData(app_data, onlyVisibleRef.current)
          columnsRef.current = built.columns
          setSheetsMeta(built.sheets)
          const wb: any = univerAPI.createWorkbook(built.data)
          const hidden: { [sheetId: string]: number[] } = {}
          Object.keys(built.columns).forEach((sheetId) => {
            hidden[sheetId] = []
            const overrides = userColOverridesRef.current[sheetId] || {}
            built.columns[sheetId].forEach((c) => {
              if (c.mandatory) {
                return
              }
              // Choix utilisateur explicite prioritaire ; sinon règle par défaut (vide ou forcedHidden).
              const shouldHide = c.index in overrides
                ? overrides[c.index]
                : (!c.hasData || c.forcedHidden)
              if (shouldHide) {
                setColHidden(sheetId, c.index, true)
                hidden[sheetId].push(c.index)
              }
            })
            // Fige la ligne d'en-tête de chaque onglet (le filtre s'active via le bouton).
            freezeHeaderRow(sheetId)
          })
          setHiddenCols(hidden)
          // Listes déroulantes (sélecteur d'étiquette) sur les colonnes de tags des feuilles de
          // nœuds : validation de liste appliquée aux lignes de données (en-tête figé exclu). Le
          // write-back (UniverSankeyBridge) aligne ensuite l'appartenance du nœud sur la cellule.
          Object.keys(built.validations || {}).forEach((sheetId) => {
            const rules = built.validations[sheetId]
            if (!rules || rules.length === 0) {
              return
            }
            const ws = wb.getSheetBySheetId ? wb.getSheetBySheetId(sheetId) : null
            if (!ws) {
              return
            }
            const rowCount = typeof ws.getMaxRows === 'function' ? ws.getMaxRows() : 1000
            const numRows = Math.max(1, rowCount - 1)
            rules.forEach((rule) => {
              try {
                const dv = univerAPI.newDataValidation()
                  .requireValueInList(rule.options, rule.multiple, true)
                  .build()
                ws.getRange(1, rule.col, numRows, 1).setDataValidation(dv)
              } catch (e) { /* preset absent / API indispo : pas de dropdown, édition libre */ }
            })
          })
          // Onglet actif cible : on conserve celui sur lequel l'utilisateur était (keepActive) ;
          // au tout premier build (keepActive null) l'onglet par défaut est Flux. On le rend actif
          // AVANT de masquer les onglets vides (Univer interdit de masquer la feuille active) et
          // APRÈS les opérations par-feuille (hide colonnes/freeze) qui laissent sinon active la
          // dernière feuille traitée -> l'onglet changeait au moindre rebuild.
          // À la réouverture (keepActive null), on restaure l'onglet persisté ; sinon Flux par défaut.
          const targetActive = keepActive || sankeyState.active_sheet || SHEET_ID_FLUX
          if (wb && typeof wb.setActiveSheet === 'function') {
            try { wb.setActiveSheet(targetActive) } catch (e) { /* feuille absente */ }
          }
          // Masque par défaut les onglets vides (sauf Flux, toujours visible, et sauf l'onglet actif).
          const hiddenSh: string[] = []
          const sheetOverrides = userSheetOverridesRef.current
          // Format `products_sectors` : l'onglet Noeuds n'est redondant avec Produits/Secteurs/Échanges
          // que si CHAQUE nœud porte un tag de nature -> masqué par défaut. S'il reste des nœuds non
          // catégorisés (visibles seulement dans Noeuds), on garde l'onglet.
          const noeudsRedundant = allNodesTyped(app_data, onlyVisibleRef.current)
          built.sheets.forEach((s) => {
            // Choix utilisateur explicite prioritaire ; sinon défaut (onglet vide masqué, ou Noeuds
            // masqué quand tous les nœuds sont ventilés en produits/secteurs/échanges). Flux et
            // l'onglet actif restent toujours visibles (Univer interdit de masquer la feuille active).
            const defaultHide = !s.hasData || (s.id === SHEET_ID_NOEUDS && noeudsRedundant)
            const wantHide = s.id in sheetOverrides ? sheetOverrides[s.id] : defaultHide
            // Flux n'est jamais masqué PAR DÉFAUT (il a toujours des données -> defaultHide=false),
            // mais un choix utilisateur explicite (sheet_overrides) doit pouvoir le masquer. Seule
            // contrainte conservée : ne pas masquer l'onglet actif (interdit par Univer ; l'appelant
            // bascule l'onglet actif avant de masquer Flux).
            const shouldHide = wantHide && s.id !== targetActive
            setSheetHidden(s.id, shouldHide)
            if (shouldHide) {
              hiddenSh.push(s.id)
            }
          })
          setHiddenSheets(hiddenSh)
          const wbA = univerAPI.getActiveWorkbook && univerAPI.getActiveWorkbook()
          const asNow = wbA && wbA.getActiveSheet && wbA.getActiveSheet()
          if (asNow && asNow.getSheetId) {
            const sid = asNow.getSheetId()
            setActiveSheetId(sid)
            sankeyState.active_sheet = sid
          }
          syncFilterState()
        } finally {
          isSyncing.current = false
        }
      }

      buildAndApply()
      bridgeInstance = attachSankeyBridge(univerAPI, app_data, isSyncing, onlyVisibleRef)
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
          const sid = as.getSheetId()
          setActiveSheetId(sid)
          // Persiste l'onglet courant (sauf pendant un rebuild, où buildAndApply gère active_sheet).
          if (!isSyncing.current) {
            app_data.drawing_area.sankey.spreadsheet_state.active_sheet = sid
          }
        }
        syncFilterState()
      })
    }
    init()

    return () => {
      disposed = true
      apiRef.current = null
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
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
    // `lang` dans les deps : un changement de langue recrée l'instance Univer avec la nouvelle locale
    // (menus/filtres internes) et reconstruit le classeur (noms d'onglets / en-têtes traduits).
  }, [active, lang])

  // Bouton hiérarchie (onglet Noeuds) : opère sur la sélection courante.
  const runOp = (op: (a: Class_ApplicationData, api: any) => boolean) => () => {
    if (op(app_data, apiRef.current)) {
      refreshAfterHierarchyChange(app_data)
    }
  }

  // Visibilité d'une colonne (Univer + état local), par onglet actif.
  const handleColSet = (col: number, hidden: boolean) => {
    setColHidden(activeSheetId, col, hidden)
    // Mémorise le choix pour le réappliquer aux rebuilds suivants (édition de la zone de dessin).
    const sheetOverrides = userColOverridesRef.current[activeSheetId] || {}
    sheetOverrides[col] = hidden
    userColOverridesRef.current[activeSheetId] = sheetOverrides
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

  // Visibilité d'un onglet (Univer + état local), depuis le sélecteur "Onglets". Masquer l'onglet
  // actif est interdit par Univer -> on bascule d'abord sur le 1er onglet visible restant (Flux en
  // priorité) avant de masquer.
  const handleSheetSet = (sheetId: string, hidden: boolean) => {
    if (hidden && sheetId === activeSheetId) {
      const hiddenNow = new Set(hiddenSheets)
      const fallback = sheetsMeta.find((s) => s.id !== sheetId && !hiddenNow.has(s.id))
      const target = (fallback && fallback.id) || SHEET_ID_FLUX
      const api = apiRef.current
      const wb = api && api.getActiveWorkbook && api.getActiveWorkbook()
      if (wb && typeof wb.setActiveSheet === 'function' && target !== sheetId) {
        try { wb.setActiveSheet(target) } catch (e) { /* feuille absente */ }
        setActiveSheetId(target)
      }
    }
    setSheetHidden(sheetId, hidden)
    // Mémorise le choix pour le réappliquer aux rebuilds suivants (édition de la zone de dessin).
    userSheetOverridesRef.current[sheetId] = hidden
    setHiddenSheets((prev) => {
      const cur = new Set(prev)
      if (hidden) {
        cur.add(sheetId)
      } else {
        cur.delete(sheetId)
      }
      return Array.from(cur)
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
  const isConstraintSheet = activeSheetId === SHEET_ID_RATIO ||
    activeSheetId === SHEET_ID_RATIO_STOCK || activeSheetId === SHEET_ID_STOCK_CHAINING
  const isMatrixSheet = activeSheetId === SHEET_ID_TES || activeSheetId === SHEET_ID_TER

  // Bascule croix/valeur des matrices TES/TER : met à jour le ref + reconstruit le classeur.
  const toggleMatrixMode = (m: 'cross' | 'value') => {
    setMatrixMode(m)
    app_data.menu_configuration.spreadsheet_matrix_mode = m
    const ref = app_data.menu_configuration.ref_to_spreadsheet
    if (ref && ref.current) {
      ref.current()
    }
  }

  // Après ajout d'une contrainte depuis la modale : bascule sur l'onglet de la famille concernée
  // (l'onglet actif est mis avant le rebuild -> buildAndApply le restaure via keepActive).
  const handleConstraintAdded = (family: 'ratio_flux' | 'ratio_stock_flux' | 'stock_chaining') => {
    const sheetId = family === 'ratio_flux' ? SHEET_ID_RATIO
      : family === 'ratio_stock_flux' ? SHEET_ID_RATIO_STOCK
        : SHEET_ID_STOCK_CHAINING
    const api = apiRef.current
    const wb = api && api.getActiveWorkbook && api.getActiveWorkbook()
    // L'onglet de la famille peut être masqué (vide jusqu'ici) -> le ré-afficher avant de l'activer,
    // sinon setActiveSheet échoue et keepActive ne le capturerait pas au rebuild.
    setSheetHidden(sheetId, false)
    if (wb && typeof wb.setActiveSheet === 'function') {
      try { wb.setActiveSheet(sheetId) } catch (e) { /* feuille absente */ }
    }
    if (app_data.menu_configuration.ref_to_spreadsheet.current) {
      app_data.menu_configuration.ref_to_spreadsheet.current()
    }
    setActiveSheetId(sheetId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto',
        padding: '1px 6px', borderBottom: '1px solid #e2e8f0', background: '#f7fafc'
      }}>
        {/* Création assistée de contrainte (placée en 1er pour rester visible même si le toolbar
            déborde). Onglets Ratio flux / Ratio stock flux / Chaînage stock. */}
        {isConstraintSheet && (
          <Button
            size='xs'
            colorScheme='blue'
            width='auto'
            flexShrink={0}
            title={t('Spreadsheet.toolbar.add_constraint_tip')}
            onClick={() => setIsAddConstraintOpen(true)}
          >
            {t('Spreadsheet.toolbar.add_constraint')}
          </Button>
        )}

        {/* Parser : contextuel à l'onglet Noeuds (construit la hiérarchie depuis la colonne niveau). */}
        {isNoeuds && (
          <Button
            size='xs'
            colorScheme='blue'
            width='auto'
            maxW='110px'
            flexShrink={0}
            title={t('Spreadsheet.toolbar.parser_tip')}
            onClick={runOp(parseHierarchyFromLevels)}
          >
            {t('Spreadsheet.toolbar.parser')}
          </Button>
        )}

        <SheetSelector
          sheets={sheetsMeta}
          hiddenSet={new Set(hiddenSheets)}
          onSet={handleSheetSet}
        />

        <ColumnSelector columns={optionalCols} hiddenSet={hiddenSet} onSet={handleColSet} />

        <Button
          size='xs'
          width='auto'
          maxW='90px'
          flexShrink={0}
          colorScheme={filterOn ? 'blue' : 'gray'}
          variant={filterOn ? 'solid' : 'outline'}
          title={t('Spreadsheet.toolbar.filter_tip')}
          onClick={() => toggleFilter(!filterOn)}
        >
          {t('Spreadsheet.toolbar.filter')}
        </Button>

        {/* Filtre d'affichage (extensible : voir displayFilters). */}
        <SingleSelectMenu
          value={onlyVisible ? 'visible' : 'all'}
          options={displayFilters(t)}
          onChange={(v) => toggleOnlyVisible(v === 'visible')}
          title={t('Spreadsheet.toolbar.display_filter_tip')}
        />

        {/* Affichage des matrices TES/TER : croix (structure) ou valeur (suit le data_type courant). */}
        {isMatrixSheet && (
          <SingleSelectMenu
            value={matrixMode}
            options={matrixModes(t)}
            onChange={toggleMatrixMode}
            title={t('Spreadsheet.toolbar.matrix_tip')}
          />
        )}

        {/* Mode de placement des nœuds créés depuis le tableur (ajout de flux/nœud). */}
        <SingleSelectMenu
          value={placementMode}
          options={placementModes(t)}
          onChange={(m) => {
            setPlacementMode(m)
            app_data.menu_configuration.spreadsheet_placement_mode = m
          }}
          title={t('Spreadsheet.toolbar.placement_tip')}
        />
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
      <AddConstraintModal
        app_data={app_data}
        isOpen={isAddConstraintOpen}
        onClose={() => setIsAddConstraintOpen(false)}
        onAdded={handleConstraintAdded}
      />
    </div>
  )
}

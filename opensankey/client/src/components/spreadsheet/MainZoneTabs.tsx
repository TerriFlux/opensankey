// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Grande zone : diagramme et/ou tableur, affichables simultanément (split view).
// - Deux booléens indépendants (menu_configuration.main_zone_show_diagram / _spreadsheet), pilotés
//   par les boutons de la barre du haut (MenuTop) et reflétés ici.
// - Quand les deux sont affichés : séparateur vertical déplaçable ; le tableur occupe la droite et
//   le DIAGRAMME SE RECADRE dans la gauche (menu_configuration.getMainZoneRightReservedPx, lu par
//   window_fitting_width de toute drawing area, + areaAutoFit()).
// - Le diagramme D3 (#draw_zoom) reste toujours monté ; on ne fait que réserver de la largeur.
// ==================================================================================================

import React, { useEffect, useReducer, useRef, useState } from 'react'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_MainZoneDocLayout, DOC_LAYOUTS_WITH_SHEET, DOC_LAYOUTS_BOTTOM } from '../../types/MenuConfig'
import { UniverSpreadSheet } from './UniverSpreadSheet'
import { DocPanel } from './DocPanel'
import { usePipWindow, PipPortal } from './PipWindow'

const MIN_RATIO = 0.15
const MAX_RATIO = 0.85
// Largeur minimale du tableur (px) : sur petits écrans, 1/3 de la largeur peut être trop étroit.
const MIN_SPREADSHEET_PX = 320
// Largeur minimale laissée au diagramme (px).
const MIN_DIAGRAM_PX = 160

// Largeur effective (px) du tableur pour un ratio diagramme donné, bornée par les minimums.
export const spreadsheetWidthPx = (diagramRatio: number): number => {
  const W = window.innerWidth
  let w = (1 - diagramRatio) * W
  w = Math.max(MIN_SPREADSHEET_PX, w)
  w = Math.min(w, Math.max(MIN_SPREADSHEET_PX, W - MIN_DIAGRAM_PX))
  return w
}

/**
 * Largeur (px) réservée à droite par le tableur en mode split (0 sinon). Le chrome du diagramme
 * (bouton/panneau config, barre du bas) y soustrait cette valeur pour se décaler vers la gauche,
 * comme si l'écran rétrécissait. Fonction pure de l'état (pas du `drawing_area` mis à jour en effet).
 */
export const mainZoneRightReservedPx = (app_data: Class_ApplicationData): number =>
  app_data.menu_configuration.getMainZoneRightReservedPx()

// Bornes de la part verticale donnée au groupe tableur/doc quand l'unitaire partage la colonne droite.
const UNIT_MIN_RATIO = 0.2
const UNIT_MAX_RATIO = 0.85
export const clampUnitaryRatio = (r: number) => Math.min(UNIT_MAX_RATIO, Math.max(UNIT_MIN_RATIO, r))

/**
 * Rectangle (coords viewport) du bloc réservé au panneau unitaire dans la colonne droite, ou null s'il
 * n'est pas affiché. SOURCE UNIQUE de géométrie partagée par MainZoneTabs (réserve/empilement) et par
 * le panneau OS+ (ModalUnitarySankeyOSP), qui est porté vers document.body — hors #sankey_app, sinon le
 * redraw du diagramme principal effacerait son SVG — puis positionné EXACTEMENT sur ce bloc. Fonction
 * pure de l'état (menu_configuration) + window + barres nav/bas, donc les deux restent alignés.
 */
export const mainZoneUnitaryRect = (
  app_data: Class_ApplicationData
): { top: number, left: number, width: number, height: number } | null => {
  const mc = app_data.menu_configuration
  // Détaché en dialogue flottant → pas de bloc réservé (OS+ le rend en Draggable).
  if (!mc.main_zone_show_unitary || mc.main_zone_unitary_detached) return null
  const da = app_data.drawing_area
  const navH = da.getNavBarHeight ? da.getNavBarHeight() : 56
  const bottomH = da.getBottomBarHeight ? da.getBottomBarHeight() : 0
  const W = window.innerWidth
  const Hh = window.innerHeight
  const contentTop = navH
  const contentBottom = Hh - bottomH
  const contentH = Math.max(0, contentBottom - contentTop)

  const showDiagram = mc.main_zone_show_diagram
  const docInApp = mc.main_zone_show_doc && !mc.main_zone_doc_detached
  const docWithSheet = docInApp && DOC_LAYOUTS_WITH_SHEET.includes(mc.main_zone_doc_layout)
  const docBottomMode = docInApp && DOC_LAYOUTS_BOTTOM.includes(mc.main_zone_doc_layout)
  const sheetGroupShown = mc.main_zone_show_spreadsheet || docWithSheet

  const rightSlotW = spreadsheetWidthPx(mc.main_zone_split_ratio)
  const left = showDiagram ? (W - rightSlotW) : 0
  const width = showDiagram ? rightSlotW : W

  // Bandeau doc pleine largeur (window-bottom, ou diagram-bottom sans diagramme) : raccourcit la
  // colonne droite par le bas, comme dans le composant.
  const docFullWidthBand = docBottomMode && (mc.main_zone_doc_layout === 'window-bottom' || !showDiagram)
  const docH = docBottomMode
    ? Math.min(Math.max(MIN_DOC_PX, mc.main_zone_doc_bottom_px), Math.max(MIN_DOC_PX, contentH - MIN_ABOVE_PX))
    : 0
  const rightBottomPx = docFullWidthBand ? (bottomH + docH) : bottomH

  const colTop = contentTop
  const colBottomY = Hh - rightBottomPx
  const colH = Math.max(0, colBottomY - colTop)

  const SEP_PX = 6
  if (sheetGroupShown) {
    const sheetH = clampUnitaryRatio(mc.main_zone_unitary_ratio) * colH
    const top = colTop + sheetH + SEP_PX
    return { top, left, width, height: Math.max(0, colBottomY - top) }
  }
  return { top: colTop, left, width, height: colH }
}

/**
 * Hook partagé : état de la grande zone (diagramme/tableur + ratio du séparateur), re-render à
 * chaque changement (pub/sub sur menu_configuration).
 */
export const useMainZone = (app_data: Class_ApplicationData) => {
  const [, force] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(force)
  }, [])
  const mc = app_data.menu_configuration
  return {
    showDiagram: mc.main_zone_show_diagram,
    showSpreadsheet: mc.main_zone_show_spreadsheet,
    showDoc: mc.main_zone_show_doc,
    // Panneau « Unit. » (sankey unitaire OS+) : disponibilité (injectée par OS+) + état affiché +
    // ratio vertical de la colonne droite + toggle. Le contenu est rendu par OS+ (porté vers body),
    // OS de base ne fait que réserver/empiler le bloc.
    unitaryTabAvailable: mc.unitary_tab_available,
    showUnitary: mc.main_zone_show_unitary,
    unitaryDetached: mc.main_zone_unitary_detached,
    unitaryRatio: mc.main_zone_unitary_ratio,
    toggleUnitary: () => mc.toggleUnitaryTab(),
    docLayout: mc.main_zone_doc_layout,
    docBottomPx: mc.main_zone_doc_bottom_px,
    splitRatio: mc.main_zone_split_ratio,
    docSheetRatio: mc.main_zone_doc_sheet_ratio,
    setShowDiagram: (v: boolean) => { mc.main_zone_show_diagram = v },
    setShowSpreadsheet: (v: boolean) => { mc.main_zone_show_spreadsheet = v },
    setShowDoc: (v: boolean) => { mc.main_zone_show_doc = v },
    setShowUnitary: (v: boolean) => { mc.main_zone_show_unitary = v },
    setUnitaryRatio: (v: number) => { mc.main_zone_unitary_ratio = v },
    setDocLayout: (v: Type_MainZoneDocLayout) => { mc.main_zone_doc_layout = v },
    setDocBottomPx: (v: number) => { mc.main_zone_doc_bottom_px = v },
    setSplitRatio: (v: number) => { mc.main_zone_split_ratio = v },
    setDocSheetRatio: (v: number) => { mc.main_zone_doc_sheet_ratio = v }
  }
}

const clampRatio = (r: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, r))
// Bornes du partage tableur/doc dans la colonne droite (modes sheet-*).
const DOC_SHEET_MIN = 0.15
const DOC_SHEET_MAX = 0.85
const clampDocSheet = (r: number) => Math.min(DOC_SHEET_MAX, Math.max(DOC_SHEET_MIN, r))
const MIN_DOC_PX = 120
const MIN_ABOVE_PX = 120
const SEP = '1px solid #e2e8f0'

// Direction du flex du slot droit selon où la doc est accolée au tableur (modes sheet-*).
const sheetSlotFlexDir = (layout: Type_MainZoneDocLayout): React.CSSProperties['flexDirection'] =>
  layout === 'sheet-top' ? 'column-reverse'
    : layout === 'sheet-bottom' ? 'column'
      : layout === 'sheet-left' ? 'row-reverse'
        : 'row' // sheet-right
// Bordure posée sur le tableur, du côté qui touche la doc.
const sheetBorder = (layout: Type_MainZoneDocLayout): React.CSSProperties =>
  layout === 'sheet-top' ? { borderTop: SEP }
    : layout === 'sheet-bottom' ? { borderBottom: SEP }
      : layout === 'sheet-left' ? { borderLeft: SEP }
        : { borderRight: SEP } // sheet-right

export const MainZoneTabs = (
  { app_data }: { app_data: Class_ApplicationData }
) => {
  const {
    showDiagram, showSpreadsheet, showDoc, showUnitary, unitaryDetached, unitaryRatio,
    docLayout, docBottomPx, splitRatio, docSheetRatio,
    setDocLayout, setDocBottomPx, setDocSheetRatio
  } = useMainZone(app_data)

  // Détachement de la doc dans une fenêtre OS séparée (transitoire, non persisté).
  const { pipWindow, open: openDocPip, close: closeDocPip } = usePipWindow()
  const docDetached = pipWindow != null
  const toggleDocDetach = () => {
    if (docDetached) closeDocPip()
    else openDocPip({ width: 480, height: 680, title: 'OpenSankey — Documentation' })
  }
  // La doc occupe un slot in-app seulement si affichée ET non détachée.
  const docInApp = showDoc && !docDetached
  // Miroir du drapeau pour les réserves de largeur/hauteur du diagramme (getMainZoneRight/Bottom
  // ReservedPx, lues par toute drawing area lors d'areaAutoFit). Assignation simple (pas le setter
  // notifiant) : MainZoneTabs se re-rend déjà depuis son propre état pipWindow.
  app_data.menu_configuration.main_zone_doc_detached = docDetached
  // Si la doc est masquée pendant qu'elle est détachée, on referme la fenêtre (ré-attachement).
  useEffect(() => {
    if (!showDoc && docDetached) closeDocPip()
  }, [showDoc, docDetached, closeDocPip])

  // Re-render on viewport resize so fixed-position panels stay within the browser window.
  const [, forceResize] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    window.addEventListener('resize', forceResize)
    return () => window.removeEventListener('resize', forceResize)
  }, [])

  // La hauteur des barres haut/bas (navH / bottomH) est lue dans le DOM au rendu. En publish, la doc
  // s'ouvre d'office au démarrage AVANT que la frise de data tags (.BottomMenu) ait sa hauteur finale,
  // donc la doc déborderait par-dessus (workaround actuel : fermer/rouvrir la doc). On observe les
  // barres pour re-render dès que leur taille change, sans intervention de l'utilisateur.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => forceResize())
    const top = document.getElementsByClassName('TopMenu')[0]
    const bottom = document.getElementsByClassName('BottomMenu')[0]
    if (top) ro.observe(top)
    if (bottom) ro.observe(bottom)
    return () => ro.disconnect()
  }, [])

  const drawing_area = app_data.drawing_area
  const navH = drawing_area.getNavBarHeight ? drawing_area.getNavBarHeight() : 56
  const bottomH = drawing_area.getBottomBarHeight ? drawing_area.getBottomBarHeight() : 0

  const W = window.innerWidth
  const contentTop = navH
  const contentBottom = window.innerHeight - bottomH
  const contentH = Math.max(0, contentBottom - contentTop)

  // Familles de disposition de la doc (uniquement quand elle occupe un slot in-app).
  const docWithSheet = docInApp && DOC_LAYOUTS_WITH_SHEET.includes(docLayout)
  const docBottomMode = docInApp && DOC_LAYOUTS_BOTTOM.includes(docLayout)
  // Unitaire DOCKÉ dans la colonne droite (vs détaché en dialogue flottant, qui ne réserve rien).
  const unitaryDocked = showUnitary && !unitaryDetached
  // Doc seule (ni diagramme, ni tableur, ni unitaire docké) -> elle remplit toute la zone.
  const docAlone = docInApp && !showDiagram && !showSpreadsheet && !unitaryDocked
  // Bandeau pleine largeur : window-bottom, ou diagram-bottom sans diagramme (repli).
  const docFullWidthBand = !docAlone && docBottomMode &&
    (docLayout === 'window-bottom' || !showDiagram)

  // Colonne de droite (tableur ± doc accolée, ± panneau unitaire docké empilé dessous).
  const rightColumnShown = !docAlone && (showSpreadsheet || docWithSheet || unitaryDocked)
  // Groupe tableur/doc en haut de la colonne droite (l'unitaire s'empile en dessous).
  const sheetGroupShown = showSpreadsheet || docWithSheet

  // Ratio "live" du séparateur vertical (diagramme / colonne droite).
  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const effRatio = dragRatio != null ? dragRatio : splitRatio
  const rightSlotW = spreadsheetWidthPx(effRatio)
  const rightReserveW = (showDiagram && rightColumnShown) ? rightSlotW : 0

  // Hauteur "live" de la poignée horizontale (hauteur de la doc en mode bas).
  const [dragDocPx, setDragDocPx] = useState<number | null>(null)
  const effDocPx = dragDocPx != null ? dragDocPx : docBottomPx
  const docH = (docBottomMode && !docAlone)
    ? Math.min(Math.max(MIN_DOC_PX, effDocPx), Math.max(MIN_DOC_PX, contentH - MIN_ABOVE_PX))
    : 0

  // Ratio "live" du séparateur tableur/doc (part du tableur dans la colonne droite, modes sheet-*).
  const [dragDocSheet, setDragDocSheet] = useState<number | null>(null)
  const effDocSheet = clampDocSheet(dragDocSheet != null ? dragDocSheet : docSheetRatio)

  // Le diagramme se recadre dans la largeur/hauteur restantes via les réserves globales
  // (menu_configuration.getMainZoneRight/BottomReservedPx, lues par window_fitting_width/height de
  // toute drawing area) : on déclenche juste le re-fit au commit (toggle, changement de mode/ratio,
  // fin de drag).
  // On saute le premier run (montage) : App.tsx fait déjà le dessin initial. Ne redessiner que
  // sur un VRAI changement de disposition, sinon double draw/toast « zone de dessin prête ».
  const didMount = useRef(false)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    drawing_area.areaAutoFit()
    app_data.draw()
    // showUnitary : ouvrir/fermer le panneau change la réserve de largeur droite quand il est le seul
    // occupant de la colonne (pas de tableur/doc) -> re-fit. Le RATIO unitaire ne change pas la largeur
    // réservée (partage vertical interne), il est donc volontairement hors deps (pas de re-fit au drag).
  }, [showDiagram, showSpreadsheet, showDoc, showUnitary, unitaryDetached, docDetached, docLayout, splitRatio, docBottomPx])

  // --- Séparateur vertical : largeur de la colonne droite ---
  const onVDividerDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent) => { setDragRatio(clampRatio(ev.clientX / window.innerWidth)) }
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      setDragRatio(null)
      app_data.menu_configuration.main_zone_split_ratio = clampRatio(ev.clientX / window.innerWidth)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // --- Poignée horizontale : hauteur de la doc en mode bas ---
  const docPxFromMouse = (clientY: number) => Math.min(
    Math.max(MIN_DOC_PX, contentBottom - clientY),
    Math.max(MIN_DOC_PX, contentH - MIN_ABOVE_PX)
  )
  const onHDividerDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent) => { setDragDocPx(docPxFromMouse(ev.clientY)) }
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      setDragDocPx(null)
      setDocBottomPx(docPxFromMouse(ev.clientY))
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // Géométrie.
  const rightLeft = showDiagram ? (W - rightSlotW) : 0
  // La colonne droite est raccourcie par le bas seulement par un bandeau pleine largeur.
  const rightBottom = docFullWidthBand ? (bottomH + docH) : bottomH
  // Bandeau doc (mode bas) : pleine largeur, ou seulement sous le diagramme (largeur restante).
  const docBandWidth = docFullWidthBand ? W : (W - rightReserveW)

  const showVDivider = showDiagram && rightColumnShown
  const vDividerX = W - rightSlotW
  const showHDivider = docBottomMode && !docAlone

  // --- Séparateur tableur/doc dans la colonne droite (modes sheet-*) ---
  // N'existe que si les DEUX (tableur + doc accolée) sont affichés ; oriente selon l'axe d'accolement.
  const showDocSheetDivider = rightColumnShown && showSpreadsheet && docWithSheet
  const docSheetRow = docLayout === 'sheet-right' || docLayout === 'sheet-left'
  const rightColW = showDiagram ? rightSlotW : W
  // Ratio (part du tableur) déduit de la position souris, selon le mode d'accolement.
  const docSheetFromMouse = (clientX: number, clientY: number): number => {
    let r: number
    if (docLayout === 'sheet-right') r = (clientX - rightLeft) / rightColW
    else if (docLayout === 'sheet-left') r = (W - clientX) / rightColW
    else if (docLayout === 'sheet-bottom') r = (clientY - contentTop) / contentH
    else /* sheet-top */ r = (contentBottom - clientY) / contentH
    return clampDocSheet(r)
  }
  const onDocSheetDividerDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent) => { setDragDocSheet(docSheetFromMouse(ev.clientX, ev.clientY)) }
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      setDragDocSheet(null)
      setDocSheetRatio(docSheetFromMouse(ev.clientX, ev.clientY))
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // --- Séparateur horizontal tableur/doc ↔ unitaire (part verticale de la colonne droite) ---
  // N'existe que si le groupe tableur/doc ET l'unitaire sont affichés. Le panneau unitaire (OS+) est
  // porté vers document.body et se repositionne sur mainZoneUnitaryRect : on écrit le ratio EN DIRECT
  // dans menu_configuration pendant le drag (le setter notifie -> le panneau suit). Pas de re-fit du
  // diagramme (ratio hors deps de l'effet ci-dessus) car la largeur réservée à droite est inchangée.
  const showUnitaryDivider = rightColumnShown && sheetGroupShown && unitaryDocked
  const unitColTop = contentTop
  const unitColH = Math.max(1, (window.innerHeight - rightBottom) - unitColTop)
  const unitRatioFromMouse = (clientY: number) => clampUnitaryRatio((clientY - unitColTop) / unitColH)
  const onUnitDividerDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent) => { app_data.menu_configuration.main_zone_unitary_ratio = unitRatioFromMouse(ev.clientY) }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  // Position Y du séparateur unitaire = bas du groupe tableur/doc dans la colonne droite.
  const unitDividerY = unitColTop + clampUnitaryRatio(unitaryRatio) * unitColH

  const renderDocPanel = (detached: boolean) => (
    <DocPanel
      app_data={app_data}
      active={showDoc}
      docLayout={docLayout}
      setDocLayout={setDocLayout}
      showDiagram={showDiagram}
      showSpreadsheet={showSpreadsheet}
      detached={detached}
      onToggleDetach={toggleDocDetach}
    />
  )
  const docPanelEl = renderDocPanel(false)

  return (
    <>
      {/* Doc détachée : rendue LIVE dans une fenêtre OS séparée (cf. PipWindow). */}
      {pipWindow && (
        <PipPortal pipWindow={pipWindow}>
          {renderDocPanel(true)}
        </PipPortal>
      )}

      {/* Doc seule : remplit toute la grande zone. */}
      {docAlone && (
        <div style={{
          position: 'fixed', top: contentTop, left: 0, right: 0, bottom: bottomH,
          zIndex: 20, background: 'white'
        }}>
          {docPanelEl}
        </div>
      )}

      {/* Colonne de droite : groupe tableur/doc en haut, panneau unitaire empilé dessous.
          `position: fixed` -> top/bottom relatifs au VIEWPORT (et non à un ancêtre positionné).
          Conteneur externe TOUJOURS en colonne (empilement vertical sheet-group ↕ unitaire) ; le
          groupe tableur/doc garde son axe d'accolement propre (sheetSlotFlexDir) dans un bloc interne. */}
      {rightColumnShown && (
        <div
          style={{
            position: 'fixed',
            top: contentTop,
            left: rightLeft,
            right: 0,
            bottom: rightBottom,
            zIndex: 20,
            background: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {sheetGroupShown && (
            <div style={{
              // Avec l'unitaire empilé dessous : hauteur = part verticale (unitaryRatio) ; sinon plein.
              flex: unitaryDocked ? `0 0 ${clampUnitaryRatio(unitaryRatio) * 100}%` : '1 1 0',
              minHeight: 0, minWidth: 0,
              display: 'flex',
              flexDirection: docWithSheet ? sheetSlotFlexDir(docLayout) : 'column'
            }}>
              {showSpreadsheet && (
                <div style={{
                  // Avec un séparateur tableur/doc : taille pilotée par le ratio ; sinon partage 50/50.
                  flex: showDocSheetDivider ? `0 0 ${effDocSheet * 100}%` : '1 1 0',
                  minHeight: 0, minWidth: 0,
                  ...(docWithSheet ? sheetBorder(docLayout) : {})
                }}>
                  <UniverSpreadSheet app_data={app_data} active={showSpreadsheet} />
                </div>
              )}
              {showDocSheetDivider && (
                <div
                  onMouseDown={onDocSheetDividerDown}
                  style={{
                    flex: '0 0 6px',
                    cursor: docSheetRow ? 'col-resize' : 'row-resize',
                    background: '#cbd5e0'
                  }}
                />
              )}
              {docWithSheet && (
                <div style={{ flex: '1 1 0', minHeight: 0, minWidth: 0 }}>
                  {docPanelEl}
                </div>
              )}
            </div>
          )}
          {showUnitaryDivider && (
            <div style={{ flex: '0 0 6px', minHeight: 0 }} />
          )}
          {unitaryDocked && (
            // Bloc RÉSERVÉ au panneau unitaire : laissé vide ici (fond blanc). Le contenu réel est
            // rendu par OS+ (ModalUnitarySankeyOSP), porté vers document.body — hors #sankey_app pour
            // survivre au redraw du diagramme principal — et positionné sur mainZoneUnitaryRect.
            <div style={{ flex: '1 1 0', minHeight: 0, minWidth: 0, background: 'white' }} />
          )}
        </div>
      )}

      {/* Bandeau doc en bas (modes diagram-bottom / window-bottom). */}
      {docBottomMode && !docAlone && (
        <div style={{
          position: 'fixed',
          top: contentBottom - docH,
          left: 0,
          width: docBandWidth,
          height: docH,
          zIndex: 20,
          background: 'white',
          borderTop: SEP
        }}>
          {docPanelEl}
        </div>
      )}

      {/* Séparateur vertical déplaçable (diagramme / colonne droite). */}
      {showVDivider && (
        <div
          onMouseDown={onVDividerDown}
          style={{
            position: 'fixed',
            top: contentTop,
            bottom: docFullWidthBand ? rightBottom : bottomH,
            left: vDividerX - 3,
            width: 6,
            zIndex: 25,
            cursor: 'col-resize',
            background: '#cbd5e0'
          }}
        />
      )}

      {/* Poignée horizontale déplaçable (hauteur de la doc en mode bas). */}
      {showHDivider && (
        <div
          onMouseDown={onHDividerDown}
          style={{
            position: 'fixed',
            top: contentBottom - docH - 3,
            left: 0,
            width: docBandWidth,
            height: 6,
            zIndex: 25,
            cursor: 'row-resize',
            background: '#cbd5e0'
          }}
        />
      )}

      {/* Poignée déplaçable groupe tableur/doc ↔ panneau unitaire (overlay fixe au-dessus du panneau
          OS+ porté vers body, pour rester cliquable). */}
      {showUnitaryDivider && (
        <div
          onMouseDown={onUnitDividerDown}
          style={{
            position: 'fixed',
            top: unitDividerY - 3,
            left: rightLeft,
            width: showDiagram ? rightSlotW : W,
            height: 6,
            zIndex: 25,
            cursor: 'row-resize',
            background: '#cbd5e0'
          }}
        />
      )}
    </>
  )
}

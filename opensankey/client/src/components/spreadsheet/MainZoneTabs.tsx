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
    docLayout: mc.main_zone_doc_layout,
    docBottomPx: mc.main_zone_doc_bottom_px,
    splitRatio: mc.main_zone_split_ratio,
    docSheetRatio: mc.main_zone_doc_sheet_ratio,
    setShowDiagram: (v: boolean) => { mc.main_zone_show_diagram = v },
    setShowSpreadsheet: (v: boolean) => { mc.main_zone_show_spreadsheet = v },
    setShowDoc: (v: boolean) => { mc.main_zone_show_doc = v },
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
    showDiagram, showSpreadsheet, showDoc, docLayout, docBottomPx, splitRatio, docSheetRatio,
    setDocLayout, setDocBottomPx, setDocSheetRatio
  } = useMainZone(app_data)

  // Re-render on viewport resize so fixed-position panels stay within the browser window.
  const [, forceResize] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    window.addEventListener('resize', forceResize)
    return () => window.removeEventListener('resize', forceResize)
  }, [])

  const drawing_area = app_data.drawing_area
  const navH = drawing_area.getNavBarHeight ? drawing_area.getNavBarHeight() : 56
  const bottomH = drawing_area.getBottomBarHeight ? drawing_area.getBottomBarHeight() : 0

  const W = window.innerWidth
  const contentTop = navH
  const contentBottom = window.innerHeight - bottomH
  const contentH = Math.max(0, contentBottom - contentTop)

  // Familles de disposition de la doc.
  const docWithSheet = showDoc && DOC_LAYOUTS_WITH_SHEET.includes(docLayout)
  const docBottomMode = showDoc && DOC_LAYOUTS_BOTTOM.includes(docLayout)
  // Doc seule (ni diagramme ni tableur) -> elle remplit toute la zone, peu importe le mode.
  const docAlone = showDoc && !showDiagram && !showSpreadsheet
  // Bandeau pleine largeur : window-bottom, ou diagram-bottom sans diagramme (repli).
  const docFullWidthBand = !docAlone && docBottomMode &&
    (docLayout === 'window-bottom' || !showDiagram)

  // Colonne de droite (tableur ± doc accolée).
  const rightColumnShown = !docAlone && (showSpreadsheet || docWithSheet)

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
  }, [showDiagram, showSpreadsheet, showDoc, docLayout, splitRatio, docBottomPx])

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

  const docPanelEl = (
    <DocPanel
      app_data={app_data}
      active={showDoc}
      docLayout={docLayout}
      setDocLayout={setDocLayout}
      showDiagram={showDiagram}
      showSpreadsheet={showSpreadsheet}
    />
  )

  return (
    <>
      {/* Doc seule : remplit toute la grande zone. */}
      {docAlone && (
        <div style={{
          position: 'fixed', top: contentTop, left: 0, right: 0, bottom: bottomH,
          zIndex: 20, background: 'white'
        }}>
          {docPanelEl}
        </div>
      )}

      {/* Colonne de droite : tableur ± doc accolée (modes sheet-*). `position: fixed` -> top/bottom
          relatifs au VIEWPORT (et non à un ancêtre positionné). */}
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
            flexDirection: docWithSheet ? sheetSlotFlexDir(docLayout) : 'column'
          }}
        >
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
    </>
  )
}

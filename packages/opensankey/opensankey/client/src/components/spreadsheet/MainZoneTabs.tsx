// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Grande zone : diagramme et/ou tableur, affichables simultanément (split view).
// - Deux booléens indépendants (menu_configuration.main_zone_show_diagram / _spreadsheet), pilotés
//   par les boutons de la barre du haut (MenuTop) et reflétés ici.
// - Quand les deux sont affichés : séparateur vertical déplaçable ; le tableur occupe la droite et
//   le DIAGRAMME SE RECADRE dans la gauche (drawing_area.main_zone_right_reserved + areaAutoFit()).
// - Le diagramme D3 (#draw_zoom) reste toujours monté ; on ne fait que réserver de la largeur.
// ==================================================================================================

import React, { useEffect, useReducer, useState } from 'react'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { UniverSpreadSheet } from './UniverSpreadSheet'

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
export const mainZoneRightReservedPx = (app_data: Class_ApplicationData): number => {
  const mc = app_data.menu_configuration
  return (mc.main_zone_show_diagram && mc.main_zone_show_spreadsheet)
    ? spreadsheetWidthPx(mc.main_zone_split_ratio)
    : 0
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
    splitRatio: mc.main_zone_split_ratio,
    setShowDiagram: (v: boolean) => { mc.main_zone_show_diagram = v },
    setShowSpreadsheet: (v: boolean) => { mc.main_zone_show_spreadsheet = v },
    setSplitRatio: (v: number) => { mc.main_zone_split_ratio = v }
  }
}

const clampRatio = (r: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, r))

export const MainZoneTabs = (
  { app_data }: { app_data: Class_ApplicationData }
) => {
  const { showDiagram, showSpreadsheet, splitRatio } = useMainZone(app_data)

  const drawing_area = app_data.drawing_area
  const navH = drawing_area.getNavBarHeight ? drawing_area.getNavBarHeight() : 56
  const bottomH = drawing_area.getBottomBarHeight ? drawing_area.getBottomBarHeight() : 0

  const both = showDiagram && showSpreadsheet
  // Ratio "live" pendant le drag du séparateur (visuel seulement) ; null = pas de drag.
  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const effRatio = dragRatio != null ? dragRatio : splitRatio

  // Réserve la largeur à droite pour le tableur et recadre le diagramme dans la gauche.
  // Ne tourne qu'au "commit" (toggle ou fin de drag), pas pendant le drag (perf).
  useEffect(() => {
    const reserved = (showDiagram && showSpreadsheet)
      ? spreadsheetWidthPx(splitRatio)
      : 0
    drawing_area.main_zone_right_reserved = reserved
    drawing_area.areaAutoFit()
    app_data.draw()
  }, [showDiagram, showSpreadsheet, splitRatio])

  const onDividerDown = (e: React.MouseEvent) => {
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

  const leftPx = window.innerWidth - spreadsheetWidthPx(effRatio)
  const overlayLeft = both ? leftPx : 0

  return (
    <>
      {/* Overlay tableur : pleine zone, ou moitié droite en split. `position: fixed` -> top/bottom
          relatifs au VIEWPORT (et non à un ancêtre positionné pouvant dépasser l'écran, ce qui
          rognait le footer/scrollbars d'Univer ou poussait le tableur trop bas). */}
      <div
        style={{
          position: 'fixed',
          top: navH,
          left: overlayLeft,
          right: 0,
          bottom: bottomH,
          zIndex: 20,
          background: 'white',
          display: showSpreadsheet ? 'block' : 'none'
        }}
      >
        <UniverSpreadSheet app_data={app_data} active={showSpreadsheet} />
      </div>

      {/* Séparateur déplaçable (uniquement quand les deux panneaux sont affichés). */}
      {both && (
        <div
          onMouseDown={onDividerDown}
          style={{
            position: 'fixed',
            top: navH,
            bottom: bottomH,
            left: leftPx - 3,
            width: 6,
            zIndex: 25,
            cursor: 'col-resize',
            background: '#cbd5e0'
          }}
        />
      )}
    </>
  )
}

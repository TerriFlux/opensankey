// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#300 — Coquille de panneau unique (Lot 0, socle).
//
// `PanelShell` est le contenant générique de TOUS les menus. Il lit son mode
// courant dans le modèle (`menu_configuration.panels`) et se rend en l'UN des
// trois contenants : info-bulle (survol), pop-up (déplaçable) ou barre latérale
// (ancrée, recadre le dessin). Tous partagent le MÊME en-tête uniforme
// (`PanelHeader`) qui permet de passer d'un mode à l'autre. Le contenu (children)
// est fourni par la feature appelante (inspecteur, filtres, recherche, props
// d'élément) et reste identique quel que soit le contenant.
//
// Ce que le Lot 0 fournit ici : les 3 rendus + l'en-tête + la promotion PAR
// BOUTONS. Différé : clamp du redimensionnement (Lot 3), persistance (Lot 4),
// déclenchement survol + auto-épinglage à la 1ʳᵉ édition (Lot 5), glisser pour
// ancrer/détacher + harmonisation fine des z-index (Lot 6).

import React from 'react'
import { Box, Button, CloseButton, Text } from '@chakra-ui/react'
import { FaThumbtack, FaAngleDoubleRight, FaExpandAlt, FaArrowsAltH } from 'react-icons/fa'
import Draggable, { DraggableProps } from 'react-draggable'

import type { Class_ApplicationData } from '../../types/ApplicationData'
import { PANELS_TOPIC } from '../../types/EventBus'
import {
  Class_PanelManager,
  Type_PanelMode,
  PANEL_SIDEBAR_DEFAULT_WIDTH_PX,
  PANEL_SIDEBAR_MIN_WIDTH_PX,
  PANEL_SIDEBAR_MAX_WIDTH_PX,
  PANEL_POPUP_MIN_SIZE,
  PANEL_POPUP_MAX_SIZE
} from '../../types/PanelManager'
import { useModelBinding } from '../../hooks/useModelBinding'
import { default_font_size } from '../../css/Theme'

// react-draggable : typings relâchés comme dans SankeyMenus (les props
// deviennent requises selon la source des @types tirée par le CI).
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

// OS#300 Lot 6 — Empilement HARMONISÉ des contenants, du plus « posé » au plus
// transitoire, en cohérence avec le reste du chrome :
//   diagramme < tableur/doc (20-25) < barre latérale (26) < colonne d'outils (35)
//   < pop-up (40) < zone d'ancrage (42) < info-bulle (45) < dialogues Chakra (~1300+)
// La barre latérale est DOCKÉE : elle reste sous la colonne d'outils, à sa gauche.
// Les pop-ups flottent au-dessus du chrome ; l'info-bulle, transitoire, passe
// au-dessus des pop-ups. L'info-bulle était à 1400 (héritage de l'overlay de
// recherche) : elle recouvrait les dialogues, ce qui n'a pas lieu d'être.
const PANEL_Z_SIDEBAR = 26
const PANEL_Z_POPUP = 40
const PANEL_Z_DOCK_HINT = 42
const PANEL_Z_TOOLTIP = 45

// Largeur (px) de la bande, au bord droit, où relâcher une pop-up l'ANCRE en
// barre latérale. Mesurée sur le bord GAUCHE de la pop-up : il faut donc l'y
// pousser franchement (une pop-up posée par défaut près du bord n'ancre pas).
const DOCK_ZONE_PX = 120

const ALL_MODES: Type_PanelMode[] = ['tooltip', 'popup', 'sidebar']

export type Type_PanelShellProps = {
  app_data: Class_ApplicationData
  /** Identifiant stable du panneau (ex. 'config', ou 'element:<uid>'). */
  id: string
  /** Titre affiché dans l'en-tête. */
  title: string
  children: React.ReactNode
  /** Modes autorisés pour ce menu (défaut : les 3). Ex. la Config n'utilise pas
   *  l'info-bulle (elle n'est pas déclenchée au survol). */
  allowedModes?: Type_PanelMode[]
  /** Largeur de la barre latérale quand ce menu y est ancré (défaut partagé 270). */
  sidebarWidthPx?: number
  /** Fermeture : par défaut `panels.close(id)`. */
  onClose?: () => void
  // OS#300 Lot 5 — intention de survol de l'INFO-BULLE (annule/programme sa
  // fermeture) + intention d'édition (auto-épinglage en pop-up à la 1ʳᵉ édition).
  /** Curseur entré dans l'info-bulle : annule la fermeture programmée. */
  onTooltipHoverIn?: () => void
  /** Curseur sorti de l'info-bulle : programme la fermeture (délai d'intention). */
  onTooltipHoverOut?: () => void
  /** 1ʳᵉ interaction dans le corps de l'info-bulle : épingle en pop-up. */
  onTooltipEditIntent?: () => void
}

/**
 * En-tête uniforme : Titre · [épingler → pop-up] · [ancrer → barre latérale] ·
 * [✕]. Chaque bouton de mode n'apparaît que si le mode est autorisé ET n'est pas
 * le mode courant. Le `dragHandleClassName` marque la zone de saisie pour le
 * déplacement des pop-ups (react-draggable cible ce sélecteur).
 */
const PanelHeader = ({
  app_data, panels, id, title, mode, allowedModes, dragHandleClassName, onClose
}: {
  app_data: Class_ApplicationData
  panels: Class_PanelManager
  id: string
  title: string
  mode: Type_PanelMode
  allowedModes: Type_PanelMode[]
  dragHandleClassName?: string
  onClose: () => void
}) => {
  const { t } = app_data
  const can = (m: Type_PanelMode) => allowedModes.includes(m) && mode !== m
  return (
    <Box
      className={dragHandleClassName}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.3rem',
        borderBottom: '1px solid #e2e8f0',
        background: '#f7fafc',
        // Saisissable : déplacer la pop-up, ou DÉTACHER un menu ancré (Lot 6).
        cursor: (mode === 'popup' || mode === 'sidebar') ? 'grab' : 'default',
        userSelect: 'none'
      }}
    >
      <Text
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: default_font_size,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={title}
      >
        {title}
      </Text>

      {can('popup') && (
        <Button
          size='xs'
          variant='menuconfigpanel_option_button'
          sx={{ paddingInline: '0.25rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
          title={t('panel.to_popup', { defaultValue: 'Épingler en fenêtre' })}
          aria-label='panel-to-popup'
          // L'input/handle de drag ne doit pas capter ce clic.
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => panels.setMode(id, 'popup')}
        >
          <FaThumbtack />
        </Button>
      )}

      {can('sidebar') && (
        <Button
          size='xs'
          variant='menuconfigpanel_option_button'
          sx={{ paddingInline: '0.25rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
          title={t('panel.to_sidebar', { defaultValue: 'Ancrer en barre latérale' })}
          aria-label='panel-to-sidebar'
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => panels.setMode(id, 'sidebar')}
        >
          <FaAngleDoubleRight />
        </Button>
      )}

      <CloseButton
        size='sm'
        aria-label='panel-close'
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClose}
      />
    </Box>
  )
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Poignée de redimensionnement fonctionnelle (Lot 3). Aperçu local pendant le
// glisser (onPreview), commit dans le modèle au relâchement (onCommit) — comme le
// séparateur de la grande zone : pas de recadrage du dessin à chaque pixel.
// Barre latérale : bord GAUCHE (largeur). Pop-up : coin BAS-DROIT (largeur+hauteur).

const SidebarResizeHandle = ({ startWidth, onPreview, onCommit }: {
  startWidth: number
  onPreview: (w: number) => void
  onCommit: (w: number) => void
}) => {
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const x0 = e.clientX
    // Glisser vers la GAUCHE élargit (la barre est ancrée à droite).
    const widthAt = (cx: number) =>
      clamp(startWidth + (x0 - cx), PANEL_SIDEBAR_MIN_WIDTH_PX, PANEL_SIDEBAR_MAX_WIDTH_PX)
    const move = (ev: MouseEvent) => onPreview(widthAt(ev.clientX))
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      onCommit(widthAt(ev.clientX))
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  return (
    <Box
      className='panel_resize_handle_sidebar'
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '7px',
        cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#cbd5e0', zIndex: 1
      }}
      _hover={{ color: 'gray.500', bg: 'rgba(0,0,0,0.04)' }}
    >
      <Box as='span' style={{ fontSize: '0.5rem', pointerEvents: 'none' }}><FaArrowsAltH /></Box>
    </Box>
  )
}

const PopupResizeHandle = ({ startW, startH, onPreview, onCommit }: {
  startW: number
  startH: number
  onPreview: (size: { w: number, h: number }) => void
  onCommit: (size: { w: number, h: number }) => void
}) => {
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const x0 = e.clientX, y0 = e.clientY
    const sizeAt = (cx: number, cy: number) => ({
      w: clamp(startW + (cx - x0), PANEL_POPUP_MIN_SIZE.w, PANEL_POPUP_MAX_SIZE.w),
      h: clamp(startH + (cy - y0), PANEL_POPUP_MIN_SIZE.h, PANEL_POPUP_MAX_SIZE.h)
    })
    const move = (ev: MouseEvent) => onPreview(sizeAt(ev.clientX, ev.clientY))
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      onCommit(sizeAt(ev.clientX, ev.clientY))
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  return (
    <Box
      className='panel_resize_handle_popup'
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', right: 0, bottom: 0, width: '16px', height: '16px',
        cursor: 'nwse-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        padding: '2px', color: '#a0aec0', zIndex: 1
      }}
      _hover={{ color: 'gray.500' }}
    >
      <Box as='span' style={{ fontSize: '0.55rem', pointerEvents: 'none' }}><FaExpandAlt /></Box>
    </Box>
  )
}

// --- Barre latérale : ancrée à droite, réserve sa largeur (dessin recadré) ----
const SidebarShell = ({ app_data, panels, id, title, allowedModes, width_px, onClose, children }: {
  app_data: Class_ApplicationData
  panels: Class_PanelManager
  id: string
  title: string
  allowedModes: Type_PanelMode[]
  width_px: number
  onClose: () => void
  children: React.ReactNode
}) => {
  const da = app_data.drawing_area
  // Se cale à gauche de la colonne d'outils (extrême droite), comme l'ex-panneau
  // de config épinglé.
  const right_offset = app_data.menu_configuration.getToolsColumnWidthPx()
  // Aperçu local de la largeur pendant le glisser (commit au relâchement).
  const [drag_width, setDragWidth] = React.useState<number | null>(null)
  const eff_width = drag_width ?? width_px
  // OS#300 Lot 6 — glisser l'EN-TÊTE d'un menu ancré le DÉTACHE en pop-up, posée
  // sous le curseur. Seuil de 8 px pour ne pas confondre avec un clic (les
  // boutons de l'en-tête sont exclus).
  const startDetachDrag = (e: React.PointerEvent) => {
    if (!allowedModes.includes('popup')) return
    if ((e.target as HTMLElement).closest('button')) return
    const start_x = e.clientX
    const start_y = e.clientY
    let done = false
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', cleanup)
    }
    const move = (ev: PointerEvent) => {
      if (done) return
      if (Math.abs(ev.clientX - start_x) < 8 && Math.abs(ev.clientY - start_y) < 8) return
      done = true
      cleanup()
      const w = 340
      const h = 380
      panels.setMode(id, 'popup', {
        geometry: {
          x: Math.max(0, Math.round(ev.clientX - w / 2)),
          y: Math.max(0, Math.round(ev.clientY - 12)),
          w, h
        }
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', cleanup)
  }
  return (
    <Box
      className='panel_sidebar'
      data-panel-id={id}
      position='fixed'
      right={right_offset + 'px'}
      top={da.getNavBarHeight() + 'px'}
      bottom={da.getBottomBarHeight() + 'px'}
      width={eff_width + 'px'}
      zIndex={PANEL_Z_SIDEBAR}
      bg='white'
      borderLeft='1px solid #e2e8f0'
      display='flex'
      flexDirection='column'
    >
      <SidebarResizeHandle
        startWidth={width_px}
        onPreview={setDragWidth}
        onCommit={(w) => { panels.sidebar_width_px = w; setDragWidth(null) }}
      />
      <Box onPointerDown={startDetachDrag}>
        <PanelHeader
          app_data={app_data} panels={panels} id={id} title={title}
          mode='sidebar' allowedModes={allowedModes} onClose={onClose}
        />
      </Box>
      <Box style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.2rem 0.2rem 0.2rem 0.4rem' }}>
        {children}
      </Box>
    </Box>
  )
}

/**
 * OS#300 Lot 6 — Repère de la zone d'ancrage : bande translucide au bord droit,
 * affichée pendant qu'une pop-up y est glissée. Purement visuel (pointerEvents
 * none) — c'est `onStop` qui décide de l'ancrage.
 */
const DockHint = ({ app_data, width_px }: { app_data: Class_ApplicationData, width_px: number }) => {
  const da = app_data.drawing_area
  return (
    <Box
      className='panel_dock_hint'
      position='fixed'
      right={app_data.menu_configuration.getToolsColumnWidthPx() + 'px'}
      top={da.getNavBarHeight() + 'px'}
      bottom={da.getBottomBarHeight() + 'px'}
      width={width_px + 'px'}
      zIndex={PANEL_Z_DOCK_HINT}
      bg='rgba(66, 153, 225, 0.18)'
      borderLeft='2px dashed'
      borderColor='blue.400'
      pointerEvents='none'
    />
  )
}

// --- Pop-up : déplaçable, épinglée, plusieurs simultanées ---------------------
const PopupShell = ({ app_data, panels, id, title, allowedModes, onClose, children }: {
  app_data: Class_ApplicationData
  panels: Class_PanelManager
  id: string
  title: string
  allowedModes: Type_PanelMode[]
  onClose: () => void
  children: React.ReactNode
}) => {
  const node_ref = React.useRef(null)
  const geom = panels.getPopupGeometry(id)
  const handle_class = 'panel-popup-handle-' + id.replace(/[^a-zA-Z0-9_-]/g, '_')
  const base_w = geom?.w ?? 340
  const base_h = geom?.h ?? 380
  // Aperçu local de la taille pendant le glisser (commit au relâchement).
  const [drag_size, setDragSize] = React.useState<{ w: number, h: number } | null>(null)
  const eff_w = drag_size?.w ?? base_w
  const eff_h = drag_size?.h ?? base_h
  // OS#300 Lot 6 — glisser vers le bord droit pour ANCRER en barre latérale.
  const can_dock = allowedModes.includes('sidebar')
  const [in_dock_zone, setInDockZone] = React.useState(false)
  const inDockZone = (x: number) => x >= (window.innerWidth || 4096) - DOCK_ZONE_PX
  return (
    <>
      {can_dock && in_dock_zone && (
        <DockHint app_data={app_data} width_px={panels.sidebar_width_px} />
      )}
      <DraggableComponent
        nodeRef={node_ref}
        handle={'.' + handle_class}
        defaultPosition={geom ? { x: geom.x, y: geom.y } : { x: window.innerWidth / 3, y: 120 }}
        bounds={{ left: 0, top: 0 }}
        onDrag={(_e, data) => {
          if (can_dock) setInDockZone(inDockZone(data.x))
        }}
        onStop={(_e, data) => {
          // Relâchée dans la bande d'ancrage -> devient la barre latérale
          // (l'invariant « un seul menu ancré » est appliqué par le modèle).
          if (can_dock && inDockZone(data.x)) {
            setInDockZone(false)
            panels.setMode(id, 'sidebar')
            return
          }
          setInDockZone(false)
          // Sinon : mémorise la position dans le modèle (persistance Lot 4).
          const g = panels.getPopupGeometry(id)
          if (g) panels.setPopupGeometry(id, { ...g, x: data.x, y: data.y })
        }}
      >
      <Box
        ref={node_ref}
        className='panel_popup'
        data-panel-id={id}
        position='fixed'
        zIndex={PANEL_Z_POPUP}
        bg='white'
        borderRadius='md'
        boxShadow='0 4px 16px rgba(0, 0, 0, 0.25)'
        border='1px solid'
        borderColor='gray.200'
        width={eff_w + 'px'}
        height={eff_h + 'px'}
        display='flex'
        flexDirection='column'
        overflow='hidden'
      >
        <PanelHeader
          app_data={app_data} panels={panels} id={id} title={title}
          mode='popup' allowedModes={allowedModes} dragHandleClassName={handle_class}
          onClose={onClose}
        />
        <Box style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.2rem' }}>
          {children}
        </Box>
        <PopupResizeHandle
          startW={base_w}
          startH={base_h}
          onPreview={setDragSize}
          onCommit={(size) => {
            const g = panels.getPopupGeometry(id)
            if (g) panels.setPopupGeometry(id, { ...g, w: size.w, h: size.h })
            setDragSize(null)
          }}
        />
        </Box>
      </DraggableComponent>
    </>
  )
}

// --- Info-bulle : transitoire, ancrée près du point de survol -----------------
const TOOLTIP_W = 300
const TooltipShell = ({
  app_data, panels, id, title, allowedModes, onClose, children,
  onTooltipHoverIn, onTooltipHoverOut, onTooltipEditIntent
}: {
  app_data: Class_ApplicationData
  panels: Class_PanelManager
  id: string
  title: string
  allowedModes: Type_PanelMode[]
  onClose: () => void
  children: React.ReactNode
  onTooltipHoverIn?: () => void
  onTooltipHoverOut?: () => void
  onTooltipEditIntent?: () => void
}) => {
  const anchor = panels.tooltip_anchor
  // Décalée du curseur (pour être atteignable) et bornée dans la fenêtre.
  // Garde-fou si innerWidth/innerHeight valent 0 (contexte de rendu sans fenêtre).
  const vw = window.innerWidth || 4096
  const vh = window.innerHeight || 4096
  const left = Math.max(4, Math.min(anchor.x + 14, vw - TOOLTIP_W - 6))
  const top = Math.max(4, Math.min(anchor.y + 14, vh - 120))
  return (
    <Box
      className='panel_tooltip'
      data-panel-id={id}
      position='fixed'
      left={left + 'px'}
      top={top + 'px'}
      zIndex={PANEL_Z_TOOLTIP}
      bg='white'
      borderRadius='md'
      boxShadow='0 4px 16px rgba(0, 0, 0, 0.25)'
      border='1px solid'
      borderColor='gray.200'
      width={TOOLTIP_W + 'px'}
      maxHeight='60vh'
      display='flex'
      flexDirection='column'
      overflow='hidden'
      // Intention de survol : entrer annule la fermeture programmée par l'élément ;
      // sortir la (re)programme. Fallback onClose si non fournis.
      onMouseEnter={onTooltipHoverIn}
      onMouseLeave={onTooltipHoverOut ?? onClose}
    >
      <PanelHeader
        app_data={app_data} panels={panels} id={id} title={title}
        mode='tooltip' allowedModes={allowedModes} onClose={onClose}
      />
      {/* 1ʳᵉ interaction dans le CORPS (éditer un champ, cliquer un bouton) =
          intention d'édition → épingle en pop-up. */}
      <Box
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.2rem' }}
        onPointerDownCapture={onTooltipEditIntent}
      >
        {children}
      </Box>
    </Box>
  )
}

/**
 * Coquille de panneau : rend `children` dans le contenant correspondant au mode
 * courant de `id` (ou rien si le panneau est fermé). Se re-rend sur le topic
 * PANELS.
 */
export const PanelShell = ({
  app_data, id, title, children, allowedModes = ALL_MODES,
  sidebarWidthPx, onClose,
  onTooltipHoverIn, onTooltipHoverOut, onTooltipEditIntent
}: Type_PanelShellProps) => {
  useModelBinding<() => void>(
    undefined,
  (rerender) => app_data.menu_configuration.subscribe(PANELS_TOPIC, rerender)
  )
  const panels = app_data.menu_configuration.panels
  const mode = panels.getMode(id)
  if (mode === null) return null

  const close = onClose ?? (() => panels.close(id))
  const width = sidebarWidthPx ?? panels.sidebar_width_px ?? PANEL_SIDEBAR_DEFAULT_WIDTH_PX

  if (mode === 'sidebar') {
    // OS#300 Lot 2 — barre latérale repliée (Ctrl+B) : le menu reste « le » menu
    // de barre mais n'est pas rendu (et ne réserve rien, cf. getSidebarReservedPx).
    if (panels.sidebar_collapsed) return null
    return (
      <SidebarShell
        app_data={app_data} panels={panels} id={id} title={title}
        allowedModes={allowedModes} width_px={width} onClose={close}
      >
        {children}
      </SidebarShell>
    )
  }
  if (mode === 'popup') {
    return (
      <PopupShell
        app_data={app_data} panels={panels} id={id} title={title}
        allowedModes={allowedModes} onClose={close}
      >
        {children}
      </PopupShell>
    )
  }
  return (
    <TooltipShell
      app_data={app_data} panels={panels} id={id} title={title}
      allowedModes={allowedModes} onClose={close}
      onTooltipHoverIn={onTooltipHoverIn}
      onTooltipHoverOut={onTooltipHoverOut}
      onTooltipEditIntent={onTooltipEditIntent}
    >
      {children}
    </TooltipShell>
  )
}

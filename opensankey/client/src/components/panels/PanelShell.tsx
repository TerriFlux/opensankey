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
import { FaThumbtack, FaAngleDoubleRight, FaExpandAlt } from 'react-icons/fa'
import Draggable, { DraggableProps } from 'react-draggable'

import type { Class_ApplicationData } from '../../types/ApplicationData'
import { PANELS_TOPIC } from '../../types/EventBus'
import {
  Class_PanelManager,
  Type_PanelMode,
  PANEL_SIDEBAR_DEFAULT_WIDTH_PX
} from '../../types/PanelManager'
import { useModelBinding } from '../../hooks/useModelBinding'
import { default_font_size } from '../../css/Theme'

// react-draggable : typings relâchés comme dans SankeyMenus (les props
// deviennent requises selon la source des @types tirée par le CI).
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

// z-index par contenant. Harmonisation fine au Lot 6 ; on centralise ici les
// valeurs héritées des patterns existants pour garder l'empilement actuel :
//  - barre latérale : 26 (ex-config_panel_pinned / filter_panel_pinned) ;
//  - pop-up         : 40 (ex-MenuDraggable) ;
//  - info-bulle     : 1400 (ex-ElementSearchOverlay).
const PANEL_Z_SIDEBAR = 26
const PANEL_Z_POPUP = 40
const PANEL_Z_TOOLTIP = 1400

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
        cursor: mode === 'popup' ? 'grab' : 'default',
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

/**
 * Poignée de redimensionnement (double-flèche). Slot VISUEL posé au Lot 0 ;
 * le clamp min/max et le glisser effectif sont branchés au Lot 3.
 */
const ResizeGrip = ({ corner }: { corner: 'bottom-right' | 'left' }) => (
  <Box
    aria-hidden
    style={corner === 'bottom-right'
      ? {
        position: 'absolute', right: '2px', bottom: '2px',
        color: '#a0aec0', fontSize: '0.6rem', pointerEvents: 'none',
        transform: 'rotate(90deg)'
      }
      : {
        position: 'absolute', left: '1px', top: '50%',
        color: '#cbd5e0', fontSize: '0.6rem', pointerEvents: 'none',
        transform: 'translateY(-50%)'
      }}
  >
    <FaExpandAlt />
  </Box>
)

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
  return (
    <Box
      className='panel_sidebar'
      data-panel-id={id}
      position='fixed'
      right={right_offset + 'px'}
      top={da.getNavBarHeight() + 'px'}
      bottom={da.getBottomBarHeight() + 'px'}
      width={width_px + 'px'}
      zIndex={PANEL_Z_SIDEBAR}
      bg='white'
      borderLeft='1px solid #e2e8f0'
      display='flex'
      flexDirection='column'
    >
      <PanelHeader
        app_data={app_data} panels={panels} id={id} title={title}
        mode='sidebar' allowedModes={allowedModes} onClose={onClose}
      />
      <Box style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.2rem' }}>
        {children}
      </Box>
      <ResizeGrip corner='left' />
    </Box>
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
  return (
    <DraggableComponent
      nodeRef={node_ref}
      handle={'.' + handle_class}
      defaultPosition={geom ? { x: geom.x, y: geom.y } : { x: window.innerWidth / 3, y: 120 }}
      bounds={{ left: 0, top: 0 }}
      // Mémorise la position dans le modèle (persistance Lot 4).
      onStop={(_e, data) => {
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
        width={(geom?.w ?? 340) + 'px'}
        height={(geom?.h ?? 380) + 'px'}
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
        <ResizeGrip corner='bottom-right' />
      </Box>
    </DraggableComponent>
  )
}

// --- Info-bulle : transitoire, ancrée au point d'ouverture --------------------
const TooltipShell = ({ app_data, panels, id, title, allowedModes, onClose, children }: {
  app_data: Class_ApplicationData
  panels: Class_PanelManager
  id: string
  title: string
  allowedModes: Type_PanelMode[]
  onClose: () => void
  children: React.ReactNode
}) => {
  const anchor = panels.tooltip_anchor
  return (
    <Box
      className='panel_tooltip'
      data-panel-id={id}
      position='fixed'
      left={anchor.x + 'px'}
      top={anchor.y + 'px'}
      zIndex={PANEL_Z_TOOLTIP}
      bg='white'
      borderRadius='md'
      boxShadow='0 4px 16px rgba(0, 0, 0, 0.25)'
      border='1px solid'
      borderColor='gray.200'
      width='300px'
      maxHeight='60vh'
      display='flex'
      flexDirection='column'
      overflow='hidden'
      // S'efface en sortant (le survol-suivi + l'auto-épinglage à la 1ʳᵉ édition
      // sont branchés au Lot 5).
      onMouseLeave={onClose}
    >
      <PanelHeader
        app_data={app_data} panels={panels} id={id} title={title}
        mode='tooltip' allowedModes={allowedModes} onClose={onClose}
      />
      <Box style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.2rem' }}>
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
  sidebarWidthPx, onClose
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
    >
      {children}
    </TooltipShell>
  )
}

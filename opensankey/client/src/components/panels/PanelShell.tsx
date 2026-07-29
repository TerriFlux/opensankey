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
  PANEL_POPUP_MAX_SIZE,
  PANEL_POPUP_DEFAULT_SIZE
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
 * En-tête uniforme : Titre · [épingle] · [ancrer → barre latérale] · [✕]. Le
 * bouton d'ancrage n'apparaît que si la barre latérale est autorisée ET n'est
 * pas le mode courant. Le `dragHandleClassName` marque la zone de saisie pour le
 * déplacement des pop-ups (react-draggable cible ce sélecteur).
 *
 * L'ÉPINGLE (OS#321) promet toujours la même chose — « garde cette fenêtre sous
 * les yeux » : depuis une info-bulle ou la barre latérale elle promeut le
 * panneau en pop-up épinglée ; sur une pop-up transitoire elle la fixe.
 *
 * Chaque contenant n'expose donc que le bouton qui lui SERT — les fermetures ne
 * se recouvrent jamais :
 *  - pop-up NON ÉPINGLÉE : épingle, mais pas de croix (cliquer ailleurs ferme) ;
 *  - pop-up ÉPINGLÉE : croix, mais pas d'épingle (rien à désépingler — pour
 *    retrouver une fenêtre transitoire, on la ferme et on reclique) ;
 *  - info-bulle : épingle seule (elle s'efface d'elle-même) ;
 *  - barre latérale : épingle (détacher) seule — la barre est un contenant
 *    toujours à portée (son bouton, Ctrl+B), et chaque menu garde le sien :
 *    une croix de plus n'y ajoutait rien.
 *
 * L'épingle n'est pas le seul chemin : tout geste qui PLACE la fenêtre l'épingle
 * aussi — la déplacer par son en-tête, la détacher de la barre latérale. Échap,
 * lui, referme tout (cf. Class_PanelManager.closeAllPopups).
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
  const is_pinned = panels.isPinned(id)
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
          // Promotion DÉLIBÉRÉE : la fenêtre obtenue est ÉPINGLÉE (OS#321).
          onClick={() => panels.setMode(id, 'popup', { pinned: true })}
        >
          <FaThumbtack />
        </Button>
      )}

      {/* OS#321 — épingle d'une pop-up TRANSITOIRE. Absente une fois la fenêtre
          épinglée : la désépingler n'a pas d'usage (on la ferme, et un nouveau
          clic rouvre une fenêtre transitoire). L'épingle couchée et pâle dit
          « celle-ci ne reste pas ». */}
      {mode === 'popup' && !is_pinned && (
        <Button
          size='xs'
          variant='menuconfigpanel_option_button'
          sx={{ paddingInline: '0.25rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
          title={t('panel.pin', {
            defaultValue: 'Épingler : la fenêtre reste ouverte quand on clique ailleurs'
          })}
          aria-label='panel-pin'
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => panels.setPinned(id, true)}
        >
          <Box as='span' style={{ transform: 'rotate(45deg)', opacity: 0.55 }}>
            <FaThumbtack />
          </Box>
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

      {/* Croix réservée à la POP-UP ÉPINGLÉE : c'est le seul contenant que rien
          d'autre ne referme. L'info-bulle s'efface quand le curseur la quitte,
          la pop-up transitoire au clic suivant posé ailleurs, et la barre
          latérale reste à portée par son propre bouton (Ctrl+B) comme par celui
          du menu qu'elle porte. Ailleurs, la croix ferait doublon. */}
      {mode === 'popup' && is_pinned && (
        <CloseButton
          size='sm'
          aria-label='panel-close'
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
        />
      )}
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

/**
 * Repère de la zone d'ancrage : bande translucide au bord droit, affichée pendant
 * qu'une pop-up y est glissée. Purement visuel (`pointerEvents: none`) — c'est
 * `onStop` qui décide de l'ancrage.
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

// Info-bulle : sa largeur s'adapte au CONTENU (`max-content`), entre ces bornes.
// Le minimum évite une bulle ridicule pour un seul mot ; le maximum garde un
// tableau large lisible sans barrer l'écran, et sert de repère au clamp de
// position ci-dessous. La hauteur reste plafonnée (60vh) avec défilement.
const TOOLTIP_MIN_W = 140
const TOOLTIP_MAX_W = 420

/**
 * ENVELOPPE UNIQUE des trois contenants.
 *
 * Les trois modes partagent le MÊME arbre React — même wrapper draggable, même
 * Box, mêmes emplacements d'enfants : seuls l'habillage et les gestes changent.
 * C'est ce qui garantit que `children` n'est JAMAIS démonté quand le panneau
 * change de contenant. Avec trois composants distincts (l'implémentation
 * précédente), React démontait l'un pour monter l'autre et l'état local du
 * CONTENU repartait au défaut à chaque promotion : onglet actif de l'inspecteur,
 * position de défilement, sections dépliées, portée Sélection/Styles.
 *
 * Deux conséquences de conception à connaître :
 *  - le wrapper react-draggable est TOUJOURS monté ; il est `disabled` hors
 *    pop-up et sa position forcée à (0,0) — un `translate(0,0)` sans effet
 *    visuel, le placement étant alors porté par le `position:fixed` de la Box
 *    (une transform sur un élément ne change pas son propre bloc conteneur) ;
 *  - les emplacements optionnels (poignées) rendent `null` au lieu de
 *    disparaître, pour que l'index des enfants — donc l'identité du contenu —
 *    reste stable.
 */
const PanelFrame = ({
  app_data, panels, id, title, mode, allowedModes, width_px, onClose, children,
  hidden, onTooltipHoverIn, onTooltipHoverOut, onTooltipEditIntent
}: {
  app_data: Class_ApplicationData
  panels: Class_PanelManager
  id: string
  title: string
  mode: Type_PanelMode
  allowedModes: Type_PanelMode[]
  width_px: number
  onClose: () => void
  children: React.ReactNode
  /** Rendu mais MASQUÉ (barre latérale repliée par Ctrl+B) : on garde le contenu
   *  monté pour ne pas perdre son état au dépliage. */
  hidden?: boolean
  onTooltipHoverIn?: () => void
  onTooltipHoverOut?: () => void
  onTooltipEditIntent?: () => void
}) => {
  const da = app_data.drawing_area
  const node_ref = React.useRef(null)
  const handle_class = 'panel-popup-handle-' + id.replace(/[^a-zA-Z0-9_-]/g, '_')

  const is_popup = mode === 'popup'
  const is_sidebar = mode === 'sidebar'
  const is_tooltip = mode === 'tooltip'

  // Aperçus locaux pendant les glissers (commit au relâchement). Ils survivent
  // désormais aux changements de mode, le frame n'étant plus remonté.
  const [drag_pos, setDragPos] = React.useState<{ x: number, y: number } | null>(null)
  const [drag_size, setDragSize] = React.useState<{ w: number, h: number } | null>(null)
  const [drag_width, setDragWidth] = React.useState<number | null>(null)
  const [in_dock_zone, setInDockZone] = React.useState(false)

  const geom = panels.getPopupGeometry(id)
  const base_w = geom?.w ?? 340
  const base_h = geom?.h ?? 380
  const eff_w = drag_size?.w ?? base_w
  const eff_h = drag_size?.h ?? base_h
  const eff_width = drag_width ?? width_px

  // Position CONTRÔLÉE du wrapper : la géométrie de la pop-up en mode pop-up,
  // (0,0) sinon. Contrôlée (et non `defaultPosition`) parce qu'un même wrapper
  // sert les trois modes : sa position doit suivre le mode courant.
  const position = is_popup
    ? (drag_pos ?? { x: geom?.x ?? 0, y: geom?.y ?? 0 })
    : { x: 0, y: 0 }

  // --- Ancrage par glisser (pop-up -> barre latérale) -------------------------
  const can_dock = allowedModes.includes('sidebar')
  const inDockZone = (x: number) => x >= (window.innerWidth || 4096) - DOCK_ZONE_PX

  // --- Détachement par glisser (barre latérale -> pop-up) ---------------------
  //
  // AJUSTEMENT #2 — UN SEUL geste. Le détachement transformait la barre en
  // pop-up puis rendait la main : react-draggable, lui, n'avait pas vu le
  // pointeur s'enfoncer, donc la fenêtre restait posée là où la conversion
  // l'avait mise et il fallait la ressaisir pour la placer. On mène donc le
  // glisser de bout en bout ici : conversion au franchissement du seuil, puis
  // suivi du curseur jusqu'au relâchement, exactement comme un déplacement de
  // pop-up ordinaire (aperçu local `drag_pos`, écriture au relâchement).
  const startDetachDrag = (e: React.PointerEvent) => {
    if (!is_sidebar || !allowedModes.includes('popup')) return
    if ((e.target as HTMLElement).closest('button')) return
    const start_x = e.clientX
    const start_y = e.clientY
    const { w, h } = PANEL_POPUP_DEFAULT_SIZE
    // Décalage de PRISE : le point saisi dans l'en-tête reste sous le curseur,
    // pour que la fenêtre ne saute pas au moment où elle se détache. Borné à la
    // largeur de la pop-up (la barre peut être plus large qu'elle).
    const rect = (node_ref.current as HTMLElement | null)?.getBoundingClientRect()
    const grab_x = Math.min(rect ? start_x - rect.left : w / 2, w - 24)
    const grab_y = rect ? start_y - rect.top : 12

    let detached = false
    const posAt = (ev: PointerEvent) => ({
      x: Math.max(0, Math.round(ev.clientX - grab_x)),
      y: Math.max(0, Math.round(ev.clientY - grab_y))
    })
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    const move = (ev: PointerEvent) => {
      if (!detached) {
        // Seuil : un clic sur l'en-tête ne doit pas détacher le menu.
        if (Math.abs(ev.clientX - start_x) < 8 && Math.abs(ev.clientY - start_y) < 8) return
        detached = true
        // Détacher la barre à la main est délibéré : la fenêtre obtenue est
        // ÉPINGLÉE (OS#321), elle ne doit pas s'évaporer au clic suivant.
        panels.setMode(id, 'popup', { geometry: { ...posAt(ev), w, h }, pinned: true })
        return
      }
      // Le panneau est désormais une pop-up : on la porte, sans réécrire le
      // modèle à chaque pixel (même économie que le glisser react-draggable).
      const p = posAt(ev)
      setDragPos(p)
      if (can_dock) setInDockZone(inDockZone(p.x))
    }
    const up = (ev: PointerEvent) => {
      cleanup()
      if (!detached) return
      setDragPos(null)
      setInDockZone(false)
      const p = posAt(ev)
      // Relâchée dans la bande d'ancrage : elle retourne d'où elle vient.
      if (can_dock && inDockZone(p.x)) { panels.setMode(id, 'sidebar'); return }
      const g = panels.getPopupGeometry(id)
      if (g) panels.setPopupGeometry(id, { ...g, x: p.x, y: p.y })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Ancre de l'info-bulle : décalée du curseur (pour être atteignable) et bornée
  // dans la fenêtre. Garde-fou si innerWidth/innerHeight valent 0.
  const anchor = panels.tooltip_anchor
  const vw = window.innerWidth || 4096
  const vh = window.innerHeight || 4096
  // La largeur réelle de l'info-bulle s'adapte au contenu ; pour le placement on
  // borne au maximum possible, de sorte qu'une bulle large ne déborde jamais à
  // droite (une bulle plus étroite se trouvera simplement un peu à gauche du bord).
  const tt_left = Math.max(4, Math.min(anchor.x + 14, vw - TOOLTIP_MAX_W - 6))
  const tt_top = Math.max(4, Math.min(anchor.y + 14, vh - 120))

  return (
    <>
      {(is_popup && can_dock && in_dock_zone)
        ? <DockHint app_data={app_data} width_px={panels.sidebar_width_px} />
        : null}
      <DraggableComponent
        nodeRef={node_ref}
        handle={'.' + handle_class}
        disabled={!is_popup}
        position={position}
        bounds={{ left: 0, top: 0 }}
        onDrag={(_e, data) => {
          setDragPos({ x: data.x, y: data.y })
          if (can_dock) setInDockZone(inDockZone(data.x))
        }}
        onStop={(_e, data) => {
          setDragPos(null)
          setInDockZone(false)
          if (!is_popup) return
          // Relâchée dans la bande d'ancrage -> devient la barre latérale
          // (l'invariant « un seul menu ancré » est appliqué par le modèle).
          if (can_dock && inDockZone(data.x)) {
            panels.setMode(id, 'sidebar')
            return
          }
          const g = panels.getPopupGeometry(id)
          if (!g) return
          // `g` porte encore la position d'AVANT le glisser (elle n'est écrite
          // qu'ici) : de quoi distinguer un vrai déplacement d'un simple clic
          // sur l'en-tête, qui déclenche lui aussi onStop.
          const moved = Math.abs(data.x - g.x) > 2 || Math.abs(data.y - g.y) > 2
          panels.setPopupGeometry(id, { ...g, x: data.x, y: data.y })
          // OS#321 — déplacer une fenêtre, c'est la PLACER : le geste dit qu'on
          // la veut là, donc qu'on la garde. Elle devient épinglée, sans quoi le
          // clic suivant effacerait le placement qu'on vient de faire.
          if (moved) panels.setPinned(id, true)
        }}
      >
        <Box
          ref={node_ref}
          data-panel-id={id}
          className={is_sidebar ? 'panel_sidebar' : is_popup ? 'panel_popup' : 'panel_tooltip'}
          position='fixed'
          bg='white'
          display={hidden ? 'none' : 'flex'}
          flexDirection='column'
          zIndex={is_sidebar ? PANEL_Z_SIDEBAR : is_popup ? PANEL_Z_POPUP : PANEL_Z_TOOLTIP}
          right={is_sidebar ? app_data.menu_configuration.getToolsColumnWidthPx() + 'px' : undefined}
          bottom={is_sidebar ? da.getBottomBarHeight() + 'px' : undefined}
          // Pop-up : ANCRÉE à l'origine du viewport (0,0). react-draggable pose la
          // géométrie via un `transform: translate(x,y)` ; sans left/top explicites,
          // une Box `position:fixed` partirait de sa position de FLUX — qui, depuis
          // que les panneaux sont portalés en fin de <body>, tombe tout en bas, d'où
          // une pop-up hors écran. `0,0` la rend indépendante de son emplacement DOM.
          left={is_tooltip ? tt_left + 'px' : (is_popup ? '0' : undefined)}
          top={is_sidebar ? da.getNavBarHeight() + 'px' : (is_tooltip ? tt_top + 'px' : (is_popup ? '0' : undefined))}
          // Info-bulle : largeur au CONTENU (`max-content`), bornée — elle rétrécit
          // pour un seul mot, s'élargit pour un tableau serré, et varie donc d'un
          // élément à l'autre. Sidebar / pop-up gardent leur largeur explicite.
          width={is_sidebar ? eff_width + 'px' : (is_popup ? eff_w + 'px' : 'max-content')}
          minWidth={is_tooltip ? TOOLTIP_MIN_W + 'px' : undefined}
          maxWidth={is_tooltip ? TOOLTIP_MAX_W + 'px' : undefined}
          height={is_popup ? eff_h + 'px' : undefined}
          maxHeight={is_tooltip ? '60vh' : undefined}
          borderLeft={is_sidebar ? '1px solid #e2e8f0' : undefined}
          borderRadius={is_sidebar ? undefined : 'md'}
          boxShadow={is_sidebar ? undefined : '0 4px 16px rgba(0, 0, 0, 0.25)'}
          border={is_sidebar ? undefined : '1px solid'}
          borderColor={is_sidebar ? undefined : 'gray.200'}
          overflow={is_sidebar ? undefined : 'hidden'}
          // Info-bulle : intention de survol — entrer annule la fermeture
          // programmée par l'élément, sortir la (re)programme.
          onMouseEnter={is_tooltip ? onTooltipHoverIn : undefined}
          onMouseLeave={is_tooltip ? (onTooltipHoverOut ?? onClose) : undefined}
        >
          {/* Emplacement 1 — poignée de largeur (barre latérale seule). */}
          {is_sidebar
            ? <SidebarResizeHandle
              startWidth={width_px}
              onPreview={setDragWidth}
              onCommit={(w) => { panels.sidebar_width_px = w; setDragWidth(null) }}
            />
            : null}
          {/* Emplacement 2 — en-tête : poignée de DÉPLACEMENT en pop-up
              (react-draggable cible `handle_class`), poignée de DÉTACHEMENT en
              barre latérale. */}
          <Box onPointerDown={is_sidebar ? startDetachDrag : undefined}>
            <PanelHeader
              app_data={app_data} panels={panels} id={id} title={title}
              mode={mode} allowedModes={allowedModes}
              dragHandleClassName={handle_class}
              onClose={onClose}
            />
          </Box>
          {/* Emplacement 3 — CONTENU : jamais démonté d'un mode à l'autre. */}
          <Box
            style={{
              flex: 1, overflowY: 'auto', overflowX: 'hidden',
              padding: is_sidebar ? '0.2rem 0.2rem 0.2rem 0.4rem' : '0.2rem'
            }}
            // Info-bulle : 1ʳᵉ interaction dans le corps = intention d'édition
            // -> épingle en pop-up.
            onPointerDownCapture={is_tooltip ? onTooltipEditIntent : undefined}
          >
            {children}
          </Box>
          {/* Emplacement 4 — poignée de taille (pop-up seule). */}
          {is_popup
            ? <PopupResizeHandle
              startW={base_w}
              startH={base_h}
              onPreview={setDragSize}
              onCommit={(size) => {
                const g = panels.getPopupGeometry(id)
                if (g) panels.setPopupGeometry(id, { ...g, w: size.w, h: size.h })
                setDragSize(null)
              }}
            />
            : null}
        </Box>
      </DraggableComponent>
    </>
  )
}

/**
 * FOND de la barre latérale — la bande elle-même, indépendamment de ce qu'elle
 * contient (ajustement #4).
 *
 * La barre est devenue un contenant à part entière : elle peut être ouverte et
 * VIDE, état qui a un sens propre (« ouvre les prochains clics ici »). Sans ce
 * fond, une barre vide ne serait qu'un blanc inexpliqué au bord du dessin, alors
 * qu'elle en réserve la largeur. Rendu SOUS les panneaux (z-index inférieur) :
 * le menu ancré, quand il y en a un, le recouvre exactement.
 */
export const SidebarSurface = ({ app_data }: { app_data: Class_ApplicationData }) => {
  useModelBinding<() => void>(
    undefined,
  (rerender) => app_data.menu_configuration.subscribe(PANELS_TOPIC, rerender)
  )
  const panels = app_data.menu_configuration.panels
  if (!panels.sidebar_open) return null
  const da = app_data.drawing_area
  return (
    <Box
      className='panel_sidebar_surface'
      position='fixed'
      right={app_data.menu_configuration.getToolsColumnWidthPx() + 'px'}
      top={da.getNavBarHeight() + 'px'}
      bottom={da.getBottomBarHeight() + 'px'}
      width={panels.sidebar_width_px + 'px'}
      zIndex={PANEL_Z_SIDEBAR - 1}
      bg='white'
      borderLeft='1px solid #e2e8f0'
      display='flex'
      alignItems='center'
      justifyContent='center'
      padding='0.6rem'
    >
      {panels.sidebar_id === null && (
        <Text
          style={{
            fontSize: default_font_size, opacity: 0.5, textAlign: 'center', lineHeight: 1.35
          }}
        >
          {app_data.t('panel.sidebar_empty', {
            defaultValue: 'Panneau ouvert. Cliquez un élément ou un menu pour l\'afficher ici.'
          })}
        </Text>
      )}
    </Box>
  )
}

// OS#321 — Interfaces FLOTTANTES qui vivent hors du panneau qui les a ouvertes
// (dialogues, menus déroulants, listes de sélection, popovers). Y cliquer n'est
// pas « cliquer ailleurs » : c'est poursuivre ce qu'on faisait dans le panneau —
// on ne referme donc rien.
const FLOATING_UI_SELECTOR = [
  '.chakra-modal__content', '.chakra-popover__content',
  '[role="dialog"]', '[role="alertdialog"]', '[role="menu"]', '[role="listbox"]'
].join(', ')

/**
 * OS#321 — CONGÉDIEMENT des pop-ups NON ÉPINGLÉES au clic extérieur.
 *
 * Une pop-up ouverte par un clic est transitoire : le clic suivant, posé hors
 * d'elle, la referme — exactement comme les menus déroulants de la barre du haut
 * et le menu contextuel, dont on généralise ici le comportement. L'épingle de
 * l'en-tête est la sortie de secours quand on veut la garder sous les yeux.
 *
 * Écoute en CAPTURE sur `pointerdown` : le congédiement doit précéder le
 * gestionnaire de clic de l'élément visé, pour que celui-ci puisse constater
 * (via `consumeJustDismissed`) qu'il vient de fermer SA pop-up et s'abstenir de
 * la rouvrir — c'est la BASCULE (recliquer l'élément referme sa pop-up).
 *
 * Monté une seule fois (cf. SankeyMenus) ; ne rend rien.
 */
export const PanelDismissLayer = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const panels = app_data.menu_configuration.panels
  React.useEffect(() => {
    const onPointerDown = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null
      if (!target || typeof target.closest !== 'function') return
      if (target.closest(FLOATING_UI_SELECTOR)) return
      // Clic DANS un panneau : celui-là seul survit (les autres pop-ups
      // transitoires se referment — un panneau n'est pas « à l'intérieur » d'un
      // autre).
      const host = target.closest('[data-panel-id]') as HTMLElement | null
      panels.dismissTransientPopups(host?.dataset.panelId)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [panels])
  return null
}

/**
 * Coquille de panneau : rend `children` dans le contenant correspondant au mode
 * courant de `id` (ou rien si le panneau est fermé). Se re-rend sur le topic
 * PANELS. Le contenu n'est PAS remonté d'un mode à l'autre (cf. PanelFrame).
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
  // OS#321 — publie la fermeture PROPRE de ce panneau, pour que le congédiement
  // au clic extérieur emprunte la même porte que la croix (et n'oublie donc
  // aucun effet de bord : miroir du filtre, requête de la recherche…). Le `ref`
  // garde l'enregistrement stable alors que `onClose` change à chaque rendu.
  const close_ref = React.useRef<() => void>(() => panels.close(id))
  close_ref.current = onClose ?? (() => panels.close(id))
  React.useEffect(() => {
    panels.setCloseHandler(id, () => close_ref.current())
    return () => panels.setCloseHandler(id, null)
  }, [panels, id])
  if (mode === null) return null
  // Barre latérale FERMÉE (Ctrl+B) : le menu y reste ancré mais rien ne s'affiche
  // ni ne se réserve (cf. getSidebarReservedPx). On le rend MASQUÉ plutôt que de
  // le démonter, pour que son contenu (onglet actif, défilement) survive à la
  // réouverture — même raison que l'enveloppe unique ci-dessus.
  const collapsed = mode === 'sidebar' && !panels.sidebar_open

  const close = close_ref.current
  const width = sidebarWidthPx ?? panels.sidebar_width_px ?? PANEL_SIDEBAR_DEFAULT_WIDTH_PX

  return (
    <PanelFrame
      app_data={app_data} panels={panels} id={id} title={title}
      mode={mode} allowedModes={allowedModes} width_px={width} onClose={close}
      hidden={collapsed}
      onTooltipHoverIn={onTooltipHoverIn}
      onTooltipHoverOut={onTooltipHoverOut}
      onTooltipEditIntent={onTooltipEditIntent}
    >
      {children}
    </PanelFrame>
  )
}

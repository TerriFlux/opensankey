// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — LES SURCOUCHES DU TABLEAU DE NAVIGATION D'UNE COURONNE (os#1511) : la liste à cases du
// zoom d'un niveau et le menu de dessin d'une dimension.
//
// Le tableau est du DOM pur, posé par le dessin de la figure (cf. `figureNavigationTable`) ; ses
// surcouches sont du React (la liste à cases est celle du sélecteur « Par niveau »,
// `DimensionMemberChecklist`). Elles se montent donc dans leur PROPRE racine, posée sur `body` sous la
// case qui les ouvre, avec un `ChakraProvider` dont les variables restent dans la surcouche
// (`cssVarsRoot`) et sans styles globaux : rien ne fuit sur l'application.
//
// UNE SEULE OUVERTE À LA FOIS, et ELLE SURVIT AU REDESSIN : cocher un membre réécrit la figure, qui
// redessine son tableau — la surcouche ouverte (même clé) reçoit alors le nouveau contenu, comme une
// liste de filtre d'Excel qui reste ouverte pendant qu'on coche. Un clic dehors ou Échap la ferme.

import React, { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Box, ChakraProvider, Text } from '@chakra-ui/react'

import { opensankey_theme } from '../css/Theme'
import type { Class_DataTag } from '../types/Tag'
import type { Type_TopbarFigureChoice } from '../types/MenuConfig'
import { DimensionMemberChecklist } from '../components/ui/DimensionMemberChecklist'
import { FigureDrawingIcon, isFigureDrawingIconName } from '../components/ui/FigureDrawingIcon'

const POPOVER_ID = 'figure_navigation_popover'

type Type_Open = {
  key: string
  box: HTMLDivElement
  root: Root
  close: () => void
}

let open: Type_Open | null = null

/** La surcouche ouverte porte-t-elle cette clé ? */
export const isFigureNavPopoverOpen = (key: string): boolean => open?.key === key

const render = (o: Type_Open, content: (close: () => void) => ReactNode) => {
  o.root.render(
    <ChakraProvider theme={opensankey_theme} resetCSS={false} disableGlobalStyle cssVarsRoot={`#${POPOVER_ID}`}>
      {content(o.close)}
    </ChakraProvider>
  )
}

/** Ferme la surcouche ouverte, s'il y en a une. */
export const closeFigureNavPopover = (): void => { open?.close() }

/**
 * Ouvre (ou referme, si elle l'est déjà) la surcouche `key` sous `anchor`. `content` reçoit de quoi
 * la fermer.
 */
export const toggleFigureNavPopover = (
  key: string, anchor: HTMLElement, content: (close: () => void) => ReactNode
): void => {
  if (open?.key === key) { open.close(); return }
  open?.close()
  const box = document.createElement('div')
  box.id = POPOVER_ID
  box.className = 'figure_navigation_popover'
  const rect = anchor.getBoundingClientRect()
  box.style.position = 'fixed'
  box.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - 280))}px`
  box.style.top = `${rect.bottom + 2}px`
  box.style.zIndex = '1500'
  box.style.background = 'white'
  box.style.border = '1px solid #cbd5e0'
  box.style.borderRadius = '6px'
  box.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'
  box.style.padding = '0.4rem'
  box.style.display = 'flex'
  box.style.flexDirection = 'column'
  box.style.gap = '0.3rem'
  box.style.minWidth = '14rem'
  box.style.maxWidth = '22rem'
  box.style.fontSize = '12px'
  // Les gestes dans la surcouche ne sont pas des clics sur la figure dessous.
  box.addEventListener('pointerdown', e => e.stopPropagation())
  box.addEventListener('click', e => e.stopPropagation())
  document.body.appendChild(box)
  const root = createRoot(box)
  const onPointerDown = (evt: PointerEvent) => {
    const target = evt.target as Node | null
    if (target && (box.contains(target) || anchor.contains(target))) return
    // Le clic sur la case qui l'a ouverte (redessinée depuis) referme par son propre geste.
    if ((target as HTMLElement | null)?.closest?.(`[data-nav-popover="${key}"]`)) return
    close()
  }
  const onKey = (evt: KeyboardEvent) => { if (evt.key === 'Escape') close() }
  const close = () => {
    if (open?.box !== box) return
    open = null
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('keydown', onKey, true)
    // Démonter hors du rendu en cours (un clic dans la liste peut fermer la surcouche).
    setTimeout(() => { root.unmount(); box.remove() }, 0)
  }
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('keydown', onKey, true)
  open = { key, box, root, close }
  render(open, content)
}

/** Le tableau redessiné redonne son contenu à la surcouche ouverte de même clé. */
export const refreshFigureNavPopover = (key: string, content: (close: () => void) => ReactNode): void => {
  if (open?.key !== key) return
  render(open, content)
}

// ── LES DEUX CONTENUS ────────────────────────────────────────────────────────────────────────────

type Type_T = (key: string, options?: { [k: string]: unknown }) => unknown

/** Ce que la liste du zoom d'un niveau lit et écrit (cf. `Type_FigureNavLevel.pick`). */
export interface Type_FigureNavZoomPick {
  /** Les membres de ce niveau, restreints au zoom des niveaux au-dessus. */
  members: Class_DataTag[]
  /** Les membres cochés : ceux du zoom à ce niveau, tous sans zoom (rien n'est retiré). */
  chosen: string[]
  /**
   * Pose exactement ces membres comme zoom de ce niveau (tous : plus de zoom à ce niveau), parmi
   * `candidates` : les membres que la liste OUVERTE propose (ceux de son ouverture, qui ne changent
   * pas pendant qu'on coche).
   */
  apply: (ids: string[], candidates: Class_DataTag[]) => void
}

/**
 * LA LISTE DU ZOOM D'UN NIVEAU : celle du sélecteur « Par niveau ». Tout décocher n'applique rien
 * (attente, comme le sélecteur) : la première case cochée pose le zoom.
 */
const ZoomMemberPicker = ({ t, title, pick }: { t: Type_T, title: string, pick: Type_FigureNavZoomPick }) => {
  // La liste garde les membres de son ouverture : cocher une branche réécrit le zoom au-dessus, et
  // les autres branches ne doivent pas quitter la liste pendant qu'on coche (comme Excel).
  const [membres] = React.useState(pick.members)
  const chosen = pick.chosen.filter(id => membres.some(m => m.id === id))
  const cle = [...chosen].sort().join('\u0000')
  const [attente_sur, setAttenteSur] = React.useState<string | null>(null)
  const en_attente = attente_sur === cle
  return <Box display='flex' flexDirection='column' gap='0.3rem' className='figure_navigation_picker'>
    <Text fontSize='0.72rem' fontWeight='600' color='gray.600' padding='0 0.2rem'>{title}</Text>
    <DimensionMemberChecklist
      t={t}
      membres={membres}
      chosen={en_attente ? new Set<string>() : new Set(chosen)}
      single={false}
      apply={ids => {
        setAttenteSur(null)
        if (ids.length === chosen.length && ids.every(id => chosen.includes(id))) return
        pick.apply(ids, membres)
      }}
      vider={() => setAttenteSur(cle)}
      attente={en_attente
        ? <Text fontSize='0.72rem' fontStyle='italic' color='gray.500' padding='0 0.4rem'>{String(t('Banner.cut_pending'))}</Text>
        : null}
    />
  </Box>
}

export const zoomPickerContent = (t: Type_T, title: string, pick: Type_FigureNavZoomPick) =>
  () => <ZoomMemberPicker t={t} title={title} pick={pick} />

/** LE MENU DE DESSIN D'UNE DIMENSION : ses choix illustrés, le courant coché, un grisé dit pourquoi. */
export const drawingMenuContent = (choice: Type_TopbarFigureChoice) =>
  (close: () => void) => <Box display='flex' flexDirection='column' className='figure_navigation_drawing_menu'>
    <Text fontSize='0.72rem' fontWeight='600' color='gray.600' padding='0 0.3rem 0.2rem'>{choice.label}</Text>
    {choice.options.map(o => {
      const current = o.value === choice.value
      return <Box
        as='button'
        key={o.value}
        display='flex'
        alignItems='center'
        gap='0.45rem'
        padding='0.2rem 0.4rem'
        borderRadius='4px'
        fontSize='0.8rem'
        textAlign='left'
        fontWeight={current ? 600 : 400}
        color={o.disabled ? 'gray.400' : 'gray.800'}
        cursor={o.disabled ? 'not-allowed' : 'pointer'}
        _hover={o.disabled ? undefined : { background: 'gray.100' }}
        title={o.title}
        className={current ? 'figure_navigation_drawing_choice figure_navigation_drawing_current' : 'figure_navigation_drawing_choice'}
        onClick={() => {
          if (o.disabled) return
          close()
          if (!current) choice.choose(o.value)
        }}
      >
        <Box as='span' width='0.8rem' textAlign='center'>{current ? '✓' : ''}</Box>
        {isFigureDrawingIconName(o.icon) ? <FigureDrawingIcon name={o.icon} /> : null}
        <span>{o.label}</span>
      </Box>
    })}
  </Box>

// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// RENDU LECTEUR de la présentation d'un élément (patron imposé, post-#305).
//
//  - INFO-BULLE (survol) : la pile des blocs cochés dans le sous-menu Info-bulle
//    (`tooltip_hidden_blocks`) ; une épingle la fixe en pop-up.
//  - POP-UP (clic) : la structure fixe `PresentationPopup` (contenu + colonne de
//    diagrammes).
//
// La barre latérale est RÉSERVÉE aux menus (config / filtres / recherche) : un
// élément ne s'y ancre jamais, d'où `allowedModes = ['tooltip', 'popup']` (le
// bouton « >> » de l'en-tête disparaît alors de lui-même).

import React from 'react'
import { createPortal } from 'react-dom'
import { Box, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { PANELS_TOPIC } from '../../../types/EventBus'
import type { Type_PanelMode } from '../../../types/PanelManager'
import { useModelBinding } from '../../../hooks/useModelBinding'
import { default_font_size } from '../../../css/Theme'
import { blocksFor } from '../../../types/PresentationComposition'
import { PanelShell } from '../PanelShell'
import { renderPresentationBlock } from './PresentationBlockRegistry'
import { registerBasePresentationBlocks } from './registerBaseBlocks'
import { PresentationPopup } from './PresentationPopup'
import {
  isPresentationPanelId, elementIdOfPanel, compositionOf, type Type_Presentable,
  cancelPresentationHoverClose, schedulePresentationHoverClose, releasePresentationHover,
  presentationPanelId
} from './openPresentation'

registerBasePresentationBlocks()

// Contenants offerts à un élément : jamais la barre latérale (réservée aux menus).
const ELEMENT_MODES: Type_PanelMode[] = ['tooltip', 'popup']

type Presentable = Type_Presentable

/** Retrouve un élément par son id, tous types confondus. */
const findElementById = (
  app_data: Class_ApplicationData,
  element_id: string
): Presentable | null => {
  const sankey = app_data.drawing_area.sankey
  const found = sankey.nodes_dict[element_id]
    ?? sankey.links_dict[element_id]
    ?? sankey.containers_dict[element_id]
  return (found ?? null) as unknown as Presentable | null
}

/** Titre du panneau : le nom de l'élément (origine → destination pour un flux). */
const titleOf = (element: Presentable): string => {
  const raw = element as unknown as Record<string, unknown>
  const src = raw['source'] as Record<string, unknown> | undefined
  const tgt = raw['target'] as Record<string, unknown> | undefined
  if (src && tgt) {
    const s = typeof src['name'] === 'string' ? src['name'] : ''
    const t = typeof tgt['name'] === 'string' ? tgt['name'] : ''
    if (s || t) return `${s} → ${t}`
  }
  return element.name ?? ''
}

/** Info-bulle : la PILE des blocs cochés, dans l'ordre du patron. Les blocs sans
 *  contenu (et ceux qu'on ne sait pas dessiner) sont sautés. */
const TooltipContent = ({ app_data, element }: {
  app_data: Class_ApplicationData
  element: Presentable
}) => {
  const rendered = blocksFor(compositionOf(element), 'tooltip')
    .map(entry => ({
      key: entry.block,
      node: renderPresentationBlock(entry.block, {
        app_data,
        element: element as unknown as null,
        mode: 'tooltip',
        options: entry.options
      })
    }))
    .filter(r => r.node !== null && r.node !== undefined)

  if (rendered.length === 0) {
    return (
      <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.3rem 0.1rem' }}>
        <Text>{app_data.t('presentation.nothing_here', {
          defaultValue: 'Rien à afficher pour cet élément.'
        })}</Text>
      </Box>
    )
  }
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      {rendered.map(r => <React.Fragment key={r.key}>{r.node}</React.Fragment>)}
    </Box>
  )
}

/**
 * Monte une coquille par panneau de présentation ouvert. Se re-rend sur le topic
 * PANELS : c'est lui qui fait apparaître/disparaître les panneaux et suivre les
 * changements de contenant.
 */
export const PresentationPanels = ({ app_data }: { app_data: Class_ApplicationData }) => {
  useModelBinding<() => void>(
    undefined,
  (rerender) => app_data.menu_configuration.subscribe(PANELS_TOPIC, rerender)
  )
  const panels = app_data.menu_configuration.panels
  const ids = panels.open_ids.filter(isPresentationPanelId)
  if (ids.length === 0) return null

  // PORTAIL vers <body> : les panneaux de présentation (position:fixed) doivent
  // vivre HORS de #sankey_app. Un diagramme unitaire dessine une DA détachée dont
  // le SVG porte l'id `#draw_zoom` ; or le redessin du diagramme principal fait
  // `d3.select('#sankey_app').selectAll('#draw_zoom').remove()` — il effacerait le
  // SVG détaché s'il était sous #sankey_app. Le modal unitaire est portalé pour la
  // même raison.
  return createPortal(
    <>
      {ids.map(id => {
        const element = findElementById(app_data, elementIdOfPanel(id))
        const mode = panels.getMode(id)
        // Élément disparu (supprimé entre-temps) : on referme proprement.
        if (!element || mode === null) {
          if (mode !== null) panels.close(id)
          return null
        }
        return (
          <PanelShell
            key={id}
            app_data={app_data}
            id={id}
            title={titleOf(element)}
            allowedModes={ELEMENT_MODES}
            // Intention de survol : entrer dans l'info-bulle annule la fermeture
            // programmée par l'élément ; en sortir la reprogramme.
            onTooltipHoverIn={cancelPresentationHoverClose}
            onTooltipHoverOut={() => schedulePresentationHoverClose(app_data)}
            // L'épingle (clic dans l'info-bulle) fixe la présentation en POP-UP —
            // jamais en barre latérale (réservée aux menus).
            onTooltipEditIntent={() => {
              releasePresentationHover()
              panels.setMode(presentationPanelId(element.id), 'popup')
            }}
          >
            {mode === 'popup'
              ? <PresentationPopup app_data={app_data} element={element} />
              : <TooltipContent app_data={app_data} element={element} />}
          </PanelShell>
        )
      })}
    </>,
    document.body
  )
}

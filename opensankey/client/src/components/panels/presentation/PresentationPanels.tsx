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

// OS#305 (Lot 3) — RENDU LECTEUR : les trois contenants affichent enfin la
// composition de l'auteur.
//
// C'est ici que la boucle se referme : le Lot 0 a posé le modèle, le Lot 1 les
// blocs, le Lot 2 le composeur ; ce module lit la composition résolue par la
// cascade et la rend dans le contenant que la politique désigne.
//
// Décision #1 : ceci NE remplace PAS l'inspecteur. En édition, cliquer un
// élément ouvre toujours l'inspecteur (outil d'auteur) ; c'est en LECTURE que le
// clic ouvre la présentation composée. L'auteur y accède par « Aperçu ».
//
// Un panneau de présentation par élément (id `presentation:<id>`) : plusieurs
// pop-ups peuvent donc coexister, comme le permet #300.

import React from 'react'
import { Box, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { PANELS_TOPIC } from '../../../types/EventBus'
import type { Type_PanelMode } from '../../../types/PanelManager'
import { useModelBinding } from '../../../hooks/useModelBinding'
import { default_font_size } from '../../../css/Theme'
import {
  compositionFromJSON, containerPolicyFromJSON, blocksFor
} from '../../../types/PresentationComposition'
import { PanelShell } from '../PanelShell'
import { renderPresentationBlock } from './PresentationBlockRegistry'
import { registerBasePresentationBlocks } from './registerBaseBlocks'
import {
  isPresentationPanelId, elementIdOfPanel, type Type_Presentable
} from './openPresentation'

registerBasePresentationBlocks()

const MODES: Type_PanelMode[] = ['tooltip', 'popup', 'sidebar']

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

/**
 * Contenu d'un panneau de présentation : les blocs visibles dans ce contenant,
 * DANS L'ORDRE de la composition. Les blocs qui n'ont rien à montrer — et ceux
 * qu'on ne sait pas dessiner (venus d'une version plus récente) — sont sautés.
 */
export const PresentationPanel = ({ app_data, element, mode }: {
  app_data: Class_ApplicationData
  element: Presentable
  mode: Type_PanelMode
}) => {
  const composition = compositionFromJSON(element.getElementProperty('presentation_blocks'))
  const rendered = blocksFor(composition, mode)
    .map(entry => ({
      key: entry.block,
      node: renderPresentationBlock(entry.block, {
        app_data,
        element: element as unknown as null,
        mode,
        options: entry.options
      })
    }))
    .filter(r => r.node !== null && r.node !== undefined)

  if (rendered.length === 0) {
    return (
      <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.3rem 0.1rem' }}>
        <Text>{app_data.t('presentation.nothing_here', {
          defaultValue: 'Rien à afficher ici pour cet élément.'
        })}</Text>
      </Box>
    )
  }
  return <>{rendered.map(r => <React.Fragment key={r.key}>{r.node}</React.Fragment>)}</>
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

  return (
    <>
      {ids.map(id => {
        const element = findElementById(app_data, elementIdOfPanel(id))
        const mode = panels.getMode(id)
        // Élément disparu (supprimé entre-temps) : on referme proprement.
        if (!element || mode === null) {
          if (mode !== null) panels.close(id)
          return null
        }
        // Contenants offerts par l'en-tête : ceux que l'auteur a permis.
        const policy = containerPolicyFromJSON(element.getElementProperty('presentation_containers'))
        const allowed = MODES.filter(m => policy.allow[m])
        return (
          <PanelShell
            key={id}
            app_data={app_data}
            id={id}
            title={titleOf(element)}
            allowedModes={allowed}
          >
            <PresentationPanel app_data={app_data} element={element} mode={mode} />
          </PanelShell>
        )
      })}
    </>
  )
}

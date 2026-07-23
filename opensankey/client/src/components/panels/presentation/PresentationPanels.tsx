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
import { Box, Button, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { PANELS_TOPIC } from '../../../types/EventBus'
import type { Type_PanelMode } from '../../../types/PanelManager'
import { useModelBinding } from '../../../hooks/useModelBinding'
import { default_font_size } from '../../../css/Theme'
import { layoutFor, tabLabelsFromJSON, tabLabelAt } from '../../../types/PresentationComposition'
import { PanelShell } from '../PanelShell'
import { renderPresentationBlock, presentation_block_registry } from './PresentationBlockRegistry'
import { registerBasePresentationBlocks } from './registerBaseBlocks'
import {
  isPresentationPanelId, elementIdOfPanel, compositionOf, type Type_Presentable,
  cancelPresentationHoverClose, schedulePresentationHoverClose, releasePresentationHover
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
 * Contenu d'un panneau de présentation : la DISPOSITION composée par l'auteur
 * pour ce contenant — onglets, rangées empilées, blocs côte à côte sur une même
 * rangée (ajustement #5).
 *
 * Les blocs qui n'ont rien à montrer — et ceux qu'on ne sait pas dessiner (venus
 * d'une version plus récente) — sont sautés ; une rangée entièrement muette
 * disparaît, et un onglet entièrement muet avec elle. Sans cela, l'auteur
 * verrait des onglets vides apparaître chez les lecteurs dont les éléments ne
 * portent pas la donnée.
 */
export const PresentationPanel = ({ app_data, element, mode, panel_id }: {
  app_data: Class_ApplicationData
  element: Presentable
  mode: Type_PanelMode
  /** Id du panneau : sert à retenir l'onglet actif, côté modèle. */
  panel_id: string
}) => {
  const composition = compositionOf(element)
  const panels = app_data.menu_configuration.panels

  // Rendu d'abord, structure ensuite : c'est le seul moyen de savoir ce qui est
  // réellement muet. Une cellule vide s'efface, une colonne vide avec elle, et
  // un onglet vide de même.
  const tabs = layoutFor(composition, mode)
    .map(cols => cols
      .map(rows => rows
        .map(cell => cell
          .map(entry => ({
            key: entry.block,
            node: renderPresentationBlock(entry.block, {
              app_data,
              element: element as unknown as null,
              mode,
              options: entry.options
            })
          }))
          .filter(r => r.node !== null && r.node !== undefined))
        .filter(cell => cell.length > 0))
      .filter(rows => rows.length > 0))
    .filter(cols => cols.length > 0)

  if (tabs.length === 0) {
    return (
      <Box style={{ fontSize: default_font_size, opacity: 0.7, padding: '0.3rem 0.1rem' }}>
        <Text>{app_data.t('presentation.nothing_here', {
          defaultValue: 'Rien à afficher ici pour cet élément.'
        })}</Text>
      </Box>
    )
  }

  const labels = tabLabelsFromJSON(element.getElementProperty('presentation_tabs'))
  // L'onglet mémorisé peut être devenu hors bornes (l'auteur en a retiré un, ou
  // l'élément n'a pas de quoi remplir le dernier) : on retombe sur le premier.
  const active = Math.min(panels.getActiveTab(panel_id), tabs.length - 1)

  // Les colonnes se partagent la largeur à parts égales et peuvent rétrécir
  // (`minWidth: 0`, sans quoi un tableau large déborderait sa colonne) ; chaque
  // colonne empile ses cellules.
  const active_cols = tabs[active]
  const rows = (
    <Box
      style={{
        display: 'flex',
        gap: active_cols.length > 1 ? '0.4rem' : undefined,
        alignItems: 'flex-start'
      }}
    >
      {active_cols.map((cells, col_index) => (
        <Box
          key={col_index}
          style={{
            flex: '1 1 0', minWidth: 0,
            display: 'flex', flexDirection: 'column', gap: '0.15rem'
          }}
        >
          {cells.map((cell, row_index) => (
            <Box key={row_index}>
              {cell.map(r => <React.Fragment key={r.key}>{r.node}</React.Fragment>)}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )

  if (tabs.length === 1) return rows

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <Box
        style={{
          display: 'flex', gap: '0.15rem', flexWrap: 'wrap',
          borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem'
        }}
      >
        {tabs.map((rows_of_tab, index) => {
          const label = tabLabelAt(labels, mode, index).trim()
          return (
            <Button
              key={index}
              size='xs'
              variant={index === active ? 'button_type_config_activated' : 'button_type_config'}
              sx={{ paddingInline: '0.45rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
              onClick={() => panels.setActiveTab(panel_id, index)}
            >
              {label !== ''
                ? label
                // Onglet sans nom : on l'annonce par son premier bloc plutôt que
                // par un numéro, qui ne dirait rien au lecteur.
                : (presentation_block_registry.get(rows_of_tab[0][0][0].key)?.label(app_data)
                  ?? app_data.t('presentation.tab_n', { defaultValue: 'Onglet' }) + ' ' + (index + 1))}
            </Button>
          )
        })}
      </Box>
      {rows}
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
        // Les trois contenants restent atteignables depuis l'en-tête : l'auteur
        // ne les restreint plus (ajustement #4), il décide seulement de ce qui
        // s'y affiche. Le lecteur, lui, garde la main sur l'endroit.
        return (
          <PanelShell
            key={id}
            app_data={app_data}
            id={id}
            title={titleOf(element)}
            allowedModes={MODES}
            // Intention de survol : entrer dans l'info-bulle annule la fermeture
            // programmée par l'élément ; en sortir la reprogramme.
            onTooltipHoverIn={cancelPresentationHoverClose}
            onTooltipHoverOut={() => schedulePresentationHoverClose(app_data)}
            // Le lecteur interagit avec l'info-bulle : elle cesse d'être
            // transitoire et se fixe — dans le contenant que désigne la règle
            // du clic, puisque c'est bien un clic qu'il vient de faire.
            onTooltipEditIntent={() => {
              releasePresentationHover()
              panels.setMode(id, panels.defaultOpenMode())
            }}
          >
            <PresentationPanel app_data={app_data} element={element} mode={mode} panel_id={id} />
          </PanelShell>
        )
      })}
    </>
  )
}

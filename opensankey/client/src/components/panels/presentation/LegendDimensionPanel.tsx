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

// SA#552 — Liste déroulante d'une dimension, ouverte sous sa ligne de rappel dans la légende.
//
// Volontairement DISCRÈTE (retour du test local du 2026-09-15 : une pop-up avec en-tête détonnait
// à côté de la légende) : pas de coquille de panneau, une simple liste posée sous la ligne.
//  - valeur unique : l'aspect d'une liste de sélection ouverte, la tranche affichée surlignée ;
//  - « Plusieurs » : l'aspect du menu « Assigner une étiquette » (clic droit), coche à droite.
// Styles écrits en dur plutôt que par variantes de thème : le lecteur MIT monte Chakra SANS le
// thème de l'application, la liste doit y avoir le même aspect.
//
// `role` listbox / menu : la couche de congé (PanelDismissLayer) tient un clic posé DANS la liste
// pour la suite du geste ; un clic ailleurs la referme comme toute pop-up non épinglée.

import React from 'react'
import { Box } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../../types/TagGroup'
import { chooseLegendDimensionTag, isMultiDimension, legendDimensionPanelId } from './legendDimensionChoice'

const HOVER_BG = '#edf2f7'
// Même plan que les pop-ups (PanelShell) : au-dessus du dessin et du chrome, sous les dialogues.
const LIST_Z_INDEX = 40

export const LegendDimensionChoice = ({ app_data, group }: {
  app_data: Class_ApplicationData
  group: Class_DataTagGroup
}) => {
  // La liste ne se re-rend que sur le topic PANELS : en « Plusieurs », elle reste ouverte et doit
  // refléter chaque coche.
  const [, refresh] = React.useReducer((n: number) => n + 1, 0)
  const panels = app_data.menu_configuration.panels
  const panel_id = legendDimensionPanelId(group.id)
  const geometry = panels.getPopupGeometry(panel_id)
  if (geometry === null) return null
  const multi = isMultiDimension(group)
  const selected_count = group.selected_tags_list.length

  const choose = (tag_id: string) => {
    chooseLegendDimensionTag(app_data, group, tag_id)
    if (multi) refresh()
    else panels.close(panel_id)
  }

  return (
    <Box
      role={multi ? 'menu' : 'listbox'}
      aria-label={group.name}
      style={{
        position: 'fixed', left: geometry.x, top: geometry.y, minWidth: geometry.w,
        maxHeight: geometry.h, overflowY: 'auto', zIndex: LIST_Z_INDEX,
        background: 'white', border: '1px solid #cbd5e0', borderRadius: '0.25rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', padding: '0.25rem 0',
        fontSize: '0.875rem', lineHeight: '1.25rem', color: '#1a202c'
      }}
    >
      {group.tags_list.map(tag => {
        const is_selected = tag.is_selected
        // « Plusieurs » : la dernière tranche affichée ne se décoche pas.
        const locked = multi && is_selected && selected_count === 1
        return (
          <Box
            key={tag.id}
            role={multi ? 'menuitemcheckbox' : 'option'}
            aria-checked={multi ? is_selected : undefined}
            aria-selected={multi ? undefined : is_selected}
            aria-disabled={locked || undefined}
            tabIndex={0}
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            gap='1rem'
            padding='0.2rem 0.75rem'
            whiteSpace='nowrap'
            cursor={locked ? 'default' : 'pointer'}
            opacity={locked ? 0.6 : 1}
            fontWeight={!multi && is_selected ? 600 : 400}
            background={!multi && is_selected ? HOVER_BG : undefined}
            _hover={locked ? undefined : { background: HOVER_BG }}
            onClick={() => { if (!locked) choose(tag.id) }}
            onKeyDown={(evt: React.KeyboardEvent) => {
              if ((evt.key === 'Enter' || evt.key === ' ') && !locked) {
                evt.preventDefault()
                choose(tag.id)
              }
            }}
          >
            <span>{tag.display_name}</span>
            {multi ? <span aria-hidden style={{ visibility: is_selected ? 'visible' : 'hidden' }}>✓</span> : null}
          </Box>
        )
      })}
    </Box>
  )
}

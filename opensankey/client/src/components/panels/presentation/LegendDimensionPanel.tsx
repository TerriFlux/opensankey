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

// SA#552 — Contenu de la liste d'une dimension ouverte depuis la légende : une ligne par
// étiquette, la sélection courante marquée. Aucun libellé propre (le titre est le nom du
// groupe, les lignes les noms des étiquettes) : rien à traduire.

import React from 'react'
import { Box, Button } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../../types/TagGroup'
import { chooseLegendDimensionTag, isMultiDimension, legendDimensionPanelId } from './legendDimensionChoice'

export const LegendDimensionChoice = ({ app_data, group }: {
  app_data: Class_ApplicationData
  group: Class_DataTagGroup
}) => {
  // Le panneau ne se re-rend que sur le topic PANELS : en « Plusieurs », la liste reste
  // ouverte et doit refléter chaque coche.
  const [, refresh] = React.useReducer((n: number) => n + 1, 0)
  const multi = isMultiDimension(group)
  const selected_count = group.selected_tags_list.length
  return (
    <Box role={multi ? 'group' : 'radiogroup'} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
      {group.tags_list.map(tag => {
        const is_selected = tag.is_selected
        return (
          <Button
            key={tag.id}
            size='sm'
            variant='ghost'
            justifyContent='flex-start'
            fontWeight={is_selected ? 'bold' : 'normal'}
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={is_selected}
            // « Plusieurs » : la dernière tranche affichée ne se décoche pas.
            isDisabled={multi && is_selected && selected_count === 1}
            leftIcon={<span style={{ display: 'inline-block', width: '1em' }}>{is_selected ? '✓' : ''}</span>}
            onClick={() => {
              chooseLegendDimensionTag(app_data, group, tag.id)
              if (multi) refresh()
              else app_data.menu_configuration.panels.close(legendDimensionPanelId(group.id))
            }}
          >
            {tag.display_name}
          </Button>
        )
      })}
    </Box>
  )
}

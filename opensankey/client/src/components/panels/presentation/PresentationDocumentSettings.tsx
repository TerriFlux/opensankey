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

// OS#305 (Lot 4) — Réglages de présentation au niveau DOCUMENT.
//
// Décision #6 : le déclencheur (survol nu / +MAJ / +Alt) et le délai valent pour
// TOUT le diagramme, pas par élément — un lecteur a besoin d'une grammaire
// d'interaction cohérente : « ce nœud réagit au survol, celui-là exige Alt »
// serait déroutant.
//
// Ces réglages vivent sur Class_PanelManager (donc dans le JSON du diagramme) et
// non dans PublishOptions, qui est une config viewer read-only issue de
// window.sankey — ni éditable par l'auteur, ni enregistrée avec le document.

import React from 'react'
import { Box, Button, Input, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import { PANELS_TOPIC } from '../../../types/EventBus'
import {
  PRESENTATION_TRIGGERS, PRESENTATION_DELAY_MAX_MS,
  type Type_PresentationTrigger
} from '../../../types/PanelManager'
import { useModelBinding } from '../../../hooks/useModelBinding'
import { default_font_size } from '../../../css/Theme'

const TRIGGER_LABEL: Record<Type_PresentationTrigger, { key: string, fallback: string }> = {
  hover: { key: 'presentation.trigger.hover', fallback: 'Survol' },
  shift: { key: 'presentation.trigger.shift', fallback: 'MAJ + survol' },
  alt: { key: 'presentation.trigger.alt', fallback: 'Alt + survol' }
}

export const PresentationDocumentSettings = ({ app_data }: {
  app_data: Class_ApplicationData
}) => {
  useModelBinding<() => void>(
    undefined,
  (rerender) => app_data.menu_configuration.subscribe(PANELS_TOPIC, rerender)
  )
  const { t, menu_configuration } = app_data
  const panels = menu_configuration.panels
  const markDirty = () => menu_configuration.ref_to_save_in_cache_indicator.current(false)

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <Text style={{ fontSize: default_font_size, opacity: 0.75 }}>
        {t('presentation.doc_hint', {
          defaultValue: 'Comment le lecteur fait apparaître la présentation des éléments. Vaut pour tout le diagramme.'
        })}
      </Text>

      <Box>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('presentation.trigger', { defaultValue: 'Déclencheur' })}
        </Box>
        <Box style={{ display: 'flex', gap: '0.15rem', paddingTop: '0.2rem' }}>
          {PRESENTATION_TRIGGERS.map(trigger => (
            <Button
              key={trigger}
              size='xs'
              flex='1'
              variant={panels.presentation_trigger === trigger
                ? 'button_type_config_activated'
                : 'button_type_config'}
              onClick={() => { panels.presentation_trigger = trigger; markDirty() }}
            >
              {t(TRIGGER_LABEL[trigger].key, { defaultValue: TRIGGER_LABEL[trigger].fallback })}
            </Button>
          ))}
        </Box>
      </Box>

      <Box>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('presentation.delay', { defaultValue: 'Délai d\'apparition (ms)' })}
        </Box>
        <Input
          size='xs'
          type='number'
          min={0}
          max={PRESENTATION_DELAY_MAX_MS}
          step={50}
          variant='menuconfigpanel_option_input'
          value={panels.presentation_delay_ms}
          onChange={(e) => {
            const v = Number(e.target.value)
            panels.presentation_delay_ms = isNaN(v) ? 0 : v
            markDirty()
          }}
        />
      </Box>
    </Box>
  )
}

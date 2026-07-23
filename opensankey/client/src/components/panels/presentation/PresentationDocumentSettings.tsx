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
  PRESENTATION_TRIGGERS, PRESENTATION_DELAY_MAX_MS, MENU_PANEL_IDS,
  type Type_PresentationTrigger
} from '../../../types/PanelManager'
import { useModelBinding } from '../../../hooks/useModelBinding'
import { default_font_size } from '../../../css/Theme'

const TRIGGER_LABEL: Record<Type_PresentationTrigger, { key: string, fallback: string }> = {
  hover: { key: 'presentation.trigger.hover', fallback: 'Survol' },
  shift: { key: 'presentation.trigger.shift', fallback: 'MAJ + survol' },
  alt: { key: 'presentation.trigger.alt', fallback: 'Alt + survol' }
}

const MENU_LABEL: Record<string, { key: string, fallback: string }> = {
  config: { key: 'presentation.menu.config', fallback: 'Configuration' },
  filter: { key: 'presentation.menu.filter', fallback: 'Filtres et légende' },
  search: { key: 'presentation.menu.search', fallback: 'Recherche' }
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

      {/* OS#305 Lot 5 — MENUS DE BARRE. Décision #9 : un bouton n'est pas un
          élément, on ne compose pas son contenu (qui est l'UI de l'appli). Reste
          l'aide que le lecteur lit en survolant le bouton — le CONTENANT, lui,
          ne se règle plus (ajustement #4) : il suit la règle unique du clic. */}
      <Box>
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('presentation.menus', { defaultValue: 'Menus de barre' })}
        </Box>
        <Text style={{ fontSize: '0.7rem', opacity: 0.7, paddingBottom: '0.2rem' }}>
          {t('presentation.menus_hint', {
            defaultValue: 'L\'aide affichée au survol du bouton de chaque menu.'
          })}
        </Text>
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {MENU_PANEL_IDS.map(menu_id => {
            const policy = panels.getMenuPolicy(menu_id)
            const setPolicy = (next: typeof policy) => {
              panels.setMenuPolicy(menu_id, next)
              markDirty()
            }
            return (
              <Box
                key={menu_id}
                style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.25rem 0.3rem' }}
              >
                <Text style={{ fontSize: default_font_size, fontWeight: 600 }}>
                  {t(MENU_LABEL[menu_id].key, { defaultValue: MENU_LABEL[menu_id].fallback })}
                </Text>
                <Input
                  size='xs'
                  variant='menuconfigpanel_option_input'
                  marginTop='0.2rem'
                  placeholder={t('presentation.menu_help_placeholder', {
                    defaultValue: 'Aide au survol (facultatif)'
                  })}
                  defaultValue={policy.help}
                  // onBlur et non onChange : on ne veut pas un point d'undo par
                  // frappe de touche.
                  onBlur={(e) => {
                    if (e.target.value !== policy.help) setPolicy({ ...policy, help: e.target.value })
                  }}
                />
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

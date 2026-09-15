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

// os#1405 — LES RÉGLAGES DU TABLEUR, c'est-à-dire le `renderOptions` de son entrée de registre.
//
// Le tableur était la seule nature de la grande zone à n'en avoir aucun : ses cinq commandes
// vivaient dans une bande au-dessus de la grille. Le tri les a réparties (cf. l'issue) et il en
// reste une ici : l'affichage des matrices TES/TER, croix ou valeur. C'est un RÉGLAGE — les mêmes
// cellules restent à l'écran, écrites autrement — donc le volet de représentation, comme le mode
// de valeur d'une étoile unitaire.
//
// CE QUI N'A PAS CHANGÉ, ET C'EST VOULU : l'état reste `menu_configuration.spreadsheet_matrix_mode`
// (réglage de SESSION, non persisté dans le document, cf. `Class_MenuConfig`), et le classeur est
// reconstruit par `ref_to_spreadsheet` — exactement ce que faisait la barre. Les réglages
// `options`/`setOptions` que le registre transporte par fenêtre ne sont donc PAS utilisés :
// les y déplacer changerait l'endroit d'écriture et la persistance du réglage, ce que ce lot
// n'a pas à faire.
//
// POURQUOI CE VOLET NE SAIT PAS SI UN ONGLET DE MATRICE EST OUVERT : l'onglet actif est un état
// local de la grille montée (un `useState` d'`UniverSpreadSheet`), et un volet de réglages n'a
// pas à aller le chercher. Le réglage dit COMMENT le tableur écrit ses matrices ; il vaut dès
// qu'il en montre une, et l'infobulle le dit.

import React, { useState } from 'react'
import { Box, Select, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../types/ApplicationData'
import { default_font_size } from '../css/Theme'

export const SpreadsheetRepresentationOptions = (
  { app_data }: { app_data: Class_ApplicationData }
) => {
  const t = app_data.t
  const menu_configuration = app_data.menu_configuration
  // Miroir d'affichage seulement : la valeur qui fait foi est celle de `menu_configuration`, et
  // c'est elle que lit la construction du classeur.
  const [mode, setMode] = useState<'cross' | 'value'>(
    menu_configuration.spreadsheet_matrix_mode
  )

  const apply = (next: 'cross' | 'value') => {
    menu_configuration.spreadsheet_matrix_mode = next
    setMode(next)
    const ref = menu_configuration.ref_to_spreadsheet
    if (ref && ref.current) {
      ref.current()
    }
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.2rem' }}>
      <Box>
        <Text style={{ fontSize: default_font_size, opacity: 0.75 }}>
          {t('Spreadsheet.toolbar.matrix_label')}
        </Text>
        <Select
          size='xs'
          value={mode}
          onChange={(e) => apply(e.target.value as 'cross' | 'value')}
        >
          <option value='cross'>{t('Spreadsheet.toolbar.matrix_cross')}</option>
          <option value='value'>{t('Spreadsheet.toolbar.matrix_value')}</option>
        </Select>
      </Box>
      <Text style={{ fontSize: '0.65rem', opacity: 0.6 }}>
        {t('Spreadsheet.toolbar.matrix_tip')}
      </Text>
    </Box>
  )
}

// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

/**
 * sa#617 — L'INFO-BULLE D'UN TYPE DE VOLET : son nom, et dessous ce à quoi il sert.
 *
 * Un seul composant pour toutes les surfaces qui PROPOSENT un type (menu « + », liste des natures
 * de l'en-tête aujourd'hui ; barre des tâches des volets et icône de l'en-tête demain) : le texte
 * vient du registre (`label`, `description`), la mise en page d'ici, et les deux ne divergent pas
 * d'une surface à l'autre.
 *
 * `OSTooltip` ne prend qu'une chaîne ; ici le nom est en gras au-dessus de la description, d'où un
 * habillage à part — qui respecte le même interrupteur `OSTooltipDisabledContext` (fenêtres
 * détachées, où une info-bulle Chakra ne se referme jamais).
 */

import React, { ReactNode } from 'react'
import { Box, Tooltip } from '@chakra-ui/react'
import type { PlacementWithLogical } from '@chakra-ui/react'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_RepresentationEntry } from './RepresentationRegistry'
import { OSTooltipDisabledContext } from '../components/ui/OSTooltip'

/** Le contenu de l'info-bulle : nom en gras, description dessous quand le type en a une. */
export const RepresentationTypeHint = (
  { entry, app_data }: { entry: Type_RepresentationEntry, app_data: Class_ApplicationData }
) => {
  const description = entry.description?.(app_data)
  return <Box>
    <Box fontWeight={600}>{entry.label(app_data)}</Box>
    {description ? <Box fontWeight={400}>{description}</Box> : null}
  </Box>
}

export const RepresentationTypeTooltip = (
  { entry, app_data, placement = 'right', delay = 300, children }: {
    entry: Type_RepresentationEntry
    app_data: Class_ApplicationData
    placement?: PlacementWithLogical
    delay?: number
    children: ReactNode
  }
) => {
  const disabled = React.useContext(OSTooltipDisabledContext)
  if (disabled) return <>{children}</>
  return <Tooltip
    openDelay={delay}
    closeDelay={100}
    placement={placement}
    label={<RepresentationTypeHint entry={entry} app_data={app_data} />}
  >
    {children}
  </Tooltip>
}

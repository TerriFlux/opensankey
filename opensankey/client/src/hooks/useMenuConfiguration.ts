// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

import { useRef } from 'react'
import { useToast } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../types/ApplicationData'

/**
 * Pose la `menu_configuration` d'une application React, avec le toast Chakra, UNE FOIS par
 * instance d'`app_data` montée — et jamais à nouveau au re-rendu.
 *
 * Le toast est un hook : il ne s'acquiert que dans le corps d'un composant, d'où cet appel
 * pendant le rendu (les enfants lisent `app_data.menu_configuration` dès leur propre rendu, un
 * effet arriverait trop tard). Mais `createNewMenuConfiguration` REMPLACE l'instance : tout ce
 * qui s'y est abonné (`useModelBinding` sur un topic, slots `ref_*`) reste accroché à l'ancienne
 * et n'entend plus rien. Tant que l'hôte ne re-rend jamais l'application (éditeur, page publiée),
 * l'appel nu à chaque rendu passait inaperçu ; un viewer EMBARQUÉ, lui, est re-rendu par son
 * hôte à chaque changement de prop — et ses panneaux de présentation (OS#305) restaient muets
 * (viewer CARTOFOB, 11/09/2026 : `panels.setMode` remplissait `open_ids` sans qu'aucun
 * composant ne se re-rende).
 *
 * Clé sur l'identité d'`app_data`, pas sur le montage : un `initializeApplicationData` qui
 * construirait une nouvelle instance à chaque rendu garde son comportement d'avant.
 */
export function useMenuConfiguration(app_data: Class_ApplicationData): void {
  const toast = useToast()
  const configured_for = useRef<Class_ApplicationData | null>(null)
  if (configured_for.current !== app_data) {
    app_data.createNewMenuConfiguration(toast)
    configured_for.current = app_data
  }
}

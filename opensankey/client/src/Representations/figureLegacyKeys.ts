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

// 03/10/2026 — LES CLÉS DE FIGURE QUI ONT CHANGÉ DE FORME, RELUES ICI ET NULLE PART AILLEURS.
//
// Un sac de réglages écrit par une version d'avant entre par `Class_Figure.loadOwn` (surcharge
// propre d'une figure) ou par `Class_FigureNature.fromJSON` (un style de figure). Les deux passent
// par cette fonction : le tracé, le panneau et la persistance ne voient ensuite que la clé neuve.
// Le panneau annonce donc ce que le fichier disait, et le fichier se réécrit sous la clé neuve.

import type { Type_OptionBag } from './Figure'

/**
 * `labels_callout_small` (booléen, 01/10/2026) → `labels_small` (quatre choix, 03/10/2026).
 * VRAI = « Détacher » (le défaut), FAUX = « Masquer ». Une clé neuve déjà posée l'emporte.
 */
const LEGACY_LABELS_CALLOUT_SMALL = 'labels_callout_small'

/** Le sac, avec ses clés d'avant traduites. Rend le MÊME objet quand il n'y a rien à traduire. */
export const upgradeLegacyFigureKeys = (bag: Type_OptionBag): Type_OptionBag => {
  if (!(LEGACY_LABELS_CALLOUT_SMALL in bag)) return bag
  const { [LEGACY_LABELS_CALLOUT_SMALL]: old, ...rest } = bag
  if (rest['labels_small'] === undefined && typeof old === 'boolean') {
    rest['labels_small'] = old ? 'detach' : 'hide'
  }
  return rest
}

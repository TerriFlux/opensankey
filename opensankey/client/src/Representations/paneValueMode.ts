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

// sa#598 — LE TYPE DE VALEUR QU'UN VOLET MONTRE : pourcentage, valeur normalisée ou valeur absolue,
// choisi depuis l'en-tête du volet, lecteur d'une page publiée compris.
//
// MODULE FEUILLE : aucun import, comme `representationIds`.
//
// LE CHOIX EST CELUI DU VOLET (`Type_MainZoneOccupant.value_mode`), et non de ses vignettes. Une
// étoile Unit. réglait son mode vignette par vignette : une vignette NÉE après le choix (le lecteur
// change de filière) serait repartie en pourcentages. Le volet le donne donc, au dessin, à chaque
// figure qui DÉCLARE `value_mode` (cf. `withPaneValueMode`, éditeur) ; le réglage PROPRE d'une
// vignette, posé depuis le menu de configuration après le choix, garde la main — et le bouton de
// l'en-tête le retire, le dernier geste l'emportant.
//
// SEULES CES FIGURES (l'étoile Unit.) ONT LES BOUTONS (arbitrage Alexandre, 05/10/2026) : sur un
// volet Sankey, ils prêteraient à confusion. Le critère est `declaresPaneValueMode`, pas le seul
// nom de la clé (06/10/2026 : la couronne les recevait).

export type Type_PaneValueMode = 'percent' | 'normalized' | 'value'

/** Les trois modes, dans l'ordre des boutons de l'en-tête. */
export const PANE_VALUE_MODES: readonly Type_PaneValueMode[] = ['percent', 'normalized', 'value']

/** La clé du réglage, sur une figure comme sur un volet. */
export const PANE_VALUE_MODE_KEY = 'value_mode'

export const isPaneValueMode = (v: unknown): v is Type_PaneValueMode =>
  typeof v === 'string' && (PANE_VALUE_MODES as readonly string[]).includes(v)

/**
 * LA FIGURE PARLE-T-ELLE DE CE TYPE DE VALEUR ? Déclarer une clé `value_mode` ne suffit pas : la
 * couronne (et le donut qui la reprend) en déclare une AUSSI, qui veut dire tout autre chose — la
 * valeur d'un secteur parent, `sum` ou `declared`. Tester le seul nom lui donnait les trois boutons,
 * et un clic effaçait son réglage de secteur parent. On demande donc que les choix déclarés soient
 * ceux des boutons.
 *
 * Structurel, pour que ce module reste une feuille : on ne lit que `ui.choices`.
 */
export const declaresPaneValueMode = (
  entry: { attributes?: { [key: string]: { ui?: { choices?: { value: unknown }[] } } } } | undefined
): boolean => {
  const choices = entry?.attributes?.[PANE_VALUE_MODE_KEY]?.ui?.choices
  if (!choices) return false
  const values = choices.map(c => c.value)
  return PANE_VALUE_MODES.every(m => values.includes(m))
}
